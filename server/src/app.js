import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { requireRole } from "./database.js";
import { HttpProblem, problems, toProblem } from "./errors.js";
import { normalizeEmail, normalizePersianText } from "./normalization.js";
import {
  assertPublicIntakeOrigin,
  createFixedWindowLimiter,
  publicIntakeIdempotencyKey,
  publicIntakeInput,
  resolvePublicIntakeContext,
  safePublicIntakeResponse
} from "./publicIntake.js";
import { opaqueToken, passwordCredential, safeEqual, secretDigest, tokenDigest, verifyPassword } from "./security.js";

function routeMatch(pathname, expression) {
  return pathname.match(expression);
}

function baseHeaders(requestId) {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    // The public UI and API use distinct managed-hosting origins. CORS remains
    // credentialed and allowlisted below; CORP must permit that intentional API use.
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Request-Id": requestId
  };
}

function json(response, status, payload, requestId, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    ...baseHeaders(requestId),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders
  });
  response.end(body);
}

async function readJson(request, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new HttpProblem(413, "PAYLOAD_TOO_LARGE", "Payload too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw problems.validation("Request body must be a JSON object");
  }
}

function bearer(request) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) throw problems.unauthorized();
  const token = authorization.slice(7).trim();
  if (token.length < 24 || token.length > 256) throw problems.unauthorized();
  return token;
}

function cookieValue(request, name) {
  const header = request.headers.cookie;
  if (typeof header !== "string") return null;
  for (const item of header.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) return decodeURIComponent(item.slice(separator + 1).trim());
  }
  return null;
}

function rejectWorkspaceOverride(request, body = {}) {
  if (request.headers["x-team-id"] || request.headers["x-workspace-id"] || Object.hasOwn(body, "workspaceId") || Object.hasOwn(body, "workspace_id")) {
    throw problems.validation("Workspace scope is derived from the authenticated server session and cannot be overridden");
  }
}

function credentialForNewPassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 256) {
    throw problems.validation("Password must be 8-256 characters");
  }
  try {
    return passwordCredential(value);
  } catch {
    throw problems.validation("Password must be 8-256 characters");
  }
}

function trustedUiOrigin(origin, corsOrigins) {
  const normalized = typeof origin === "string" ? origin.replace(/\/$/, "") : "";
  if (normalized && corsOrigins.includes(normalized)) return normalized;
  return corsOrigins[0];
}

function fragmentUrl(origin, path, values) {
  const target = new URL(path, `${origin.replace(/\/$/, "")}/`);
  target.hash = new URLSearchParams(values).toString();
  return target.toString();
}

export function createRahjoServer({ config, database, repository, relaticle, workspaceTokens, logger = console }) {
  const sessionCookie = config.appEnv === "production" ? "__Host-rahjo_session" : "rahjo_session";
  const dummyCredential = passwordCredential("not-a-real-password-value");
  const loginWindows = new Map();
  const accountWindows = new Map();
  const publicIntakeLimit = createFixedWindowLimiter({
    maxRequests: config.publicIntakeMaxRequests ?? 20,
    windowMs: config.publicIntakeWindowMs ?? 10 * 60_000
  });

  function checkWindow(request, store, maxRequests = 10, windowMs = 10 * 60_000) {
    const now = Date.now();
    const key = request.socket?.remoteAddress ?? "unknown";
    const prior = store.get(key);
    const state = !prior || now - prior.startedAt >= windowMs ? { startedAt: now, count: 0 } : prior;
    state.count += 1;
    store.set(key, state);
    if (state.count > maxRequests) throw problems.rateLimited(Math.ceil((state.startedAt + windowMs - now) / 1000));
  }

  function checkLoginRate(request) {
    checkWindow(request, loginWindows, 10);
  }

  function checkAccountRate(request) {
    checkWindow(request, accountWindows, 12);
  }

  async function authenticate(request) {
    let context;
    if (request.headers.authorization) {
      const rawToken = bearer(request);
      context = await database.authenticate(tokenDigest(rawToken, config.tokenPepper));
      if (context) context.auth_method = "bearer";
    } else {
      const rawSession = cookieValue(request, sessionCookie);
      if (!rawSession) throw problems.unauthorized();
      context = await database.authenticateSession(tokenDigest(rawSession, config.tokenPepper));
      if (context) {
        context.auth_method = "cookie";
        context.session_token = rawSession;
      }
    }
    if (!context) throw problems.unauthorized();
    return context;
  }

  function requireCsrf(request, context) {
    if (context.auth_method !== "cookie") return;
    const csrf = request.headers["x-csrf-token"];
    if (typeof csrf !== "string" || csrf.length < 24 || !safeEqual(tokenDigest(csrf, config.tokenPepper), context.csrf_hash)) {
      throw problems.forbidden();
    }
  }

  async function issueBrowserSession(membershipId, response, requestId, corsHeaders) {
    const rawSession = opaqueToken("rahjo_session");
    const csrfToken = opaqueToken("rahjo_csrf");
    const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60_000);
    const created = await database.createSession(
      membershipId,
      tokenDigest(rawSession, config.tokenPepper),
      tokenDigest(csrfToken, config.tokenPepper),
      expiresAt
    );
    if (!created) throw problems.unauthorized();
    const context = await database.authenticateSession(tokenDigest(rawSession, config.tokenPepper));
    if (!context) throw problems.unauthorized();
    json(response, 201, {
      dataMode: "server",
      csrfToken,
      expiresAt: expiresAt.toISOString(),
      workspace: { id: context.workspace_id, slug: context.workspace_slug, name: context.workspace_name },
      user: { id: context.user_id, email: context.user_email, name: context.display_name, role: context.role }
    }, requestId, {
      ...corsHeaders,
      "Set-Cookie": `${sessionCookie}=${encodeURIComponent(rawSession)}; Path=/; HttpOnly; ${config.appEnv === "production" ? "Secure; " : ""}SameSite=Lax; Max-Age=${config.sessionHours * 3600}`
    });
  }

  async function handler(request, response) {
    const requestId = typeof request.headers["x-request-id"] === "string" && /^[A-Za-z0-9._:-]{8,100}$/.test(request.headers["x-request-id"])
      ? request.headers["x-request-id"]
      : randomUUID();
    const startedAt = performance.now();
    let status = 500;
    const origin = request.headers.origin;
    const corsHeaders = {};
    try {
      if (origin) {
        if (!config.corsOrigins.includes(origin.replace(/\/$/, ""))) throw problems.forbidden();
        corsHeaders["Access-Control-Allow-Origin"] = origin;
        corsHeaders["Access-Control-Allow-Credentials"] = "true";
        corsHeaders.Vary = "Origin";
        corsHeaders["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Idempotency-Key, If-Match, X-CSRF-Token, X-Request-Id";
        corsHeaders["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
      }
      if (request.method === "OPTIONS") {
        status = 204;
        response.writeHead(status, { ...baseHeaders(requestId), ...corsHeaders, "Access-Control-Max-Age": "600" });
        response.end();
        return;
      }

      const url = new URL(request.url ?? "/", config.publicOrigin);
      if (request.method === "GET" && url.pathname === "/healthz") {
        status = 200;
        json(response, status, {
          status: "ok",
          service: "rahjo-crm-bff",
          dataMode: "server",
          crmMode: config.crmMode,
          interim: config.interim,
          publicIntake: config.publicIntakeEnabled === true ? "enabled" : "disabled",
          llmEnabled: false
        }, requestId, corsHeaders);
        return;
      }
      if (request.method === "GET" && url.pathname === "/readyz") {
        const databaseState = await database.ready();
        if (config.crmMode === "native_deferred") {
          status = 200;
          json(response, status, {
            status: "ready-interim",
            dataMode: "server",
            crmMode: config.crmMode,
            interim: true,
            productionReady: false,
            publicIntake: config.publicIntakeEnabled === true ? "enabled" : "disabled",
            llmEnabled: false,
            database: { status: "ready", role: databaseState.role },
            relaticle: { status: "deferred-not-deployed", workspaces: 0 }
          }, requestId, corsHeaders);
          return;
        }
        const upstream = [];
        for (const [workspaceId, mapping] of workspaceTokens) {
          await database.verifyWorkspaceBinding(workspaceId, mapping.expectedTeamId);
          const user = await relaticle.verifyAuthentication(workspaceId);
          const identity = await relaticle.verifyTeamIdentity(workspaceId);
          upstream.push({ workspaceId, authenticated: true, teamVerified: true, teamId: identity.teamId, userId: user.id });
        }
        status = 200;
        json(response, status, {
          status: "ready",
          dataMode: "server",
          publicIntake: config.publicIntakeEnabled === true ? "enabled" : "disabled",
          llmEnabled: false,
          database: { status: "ready", role: databaseState.role },
          relaticle: { status: "authenticated-and-team-verified", workspaces: upstream.length }
        }, requestId, corsHeaders);
        return;
      }

      // Hostinger's edge may require a one-time top-level JavaScript challenge
      // before credentialed API calls are allowed. This endpoint is deliberately
      // data-free: after the edge has established its browser cookie, it redirects
      // only to an explicitly allowlisted Rahjo UI origin.
      if (request.method === "GET" && url.pathname === "/browser-bootstrap") {
        const rawReturn = url.searchParams.get("return");
        let returnUrl;
        try {
          returnUrl = new URL(rawReturn ?? "");
        } catch {
          throw problems.validation("A valid browser bootstrap return URL is required");
        }
        if (returnUrl.protocol !== "https:" || !config.corsOrigins.includes(returnUrl.origin)) {
          throw problems.forbidden();
        }
        status = 302;
        response.writeHead(status, {
          ...baseHeaders(requestId),
          Location: returnUrl.toString()
        });
        response.end();
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/session") {
        checkLoginRate(request);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const workspaceSlug = normalizePersianText(body.workspaceSlug, { max: 63, required: true });
        const email = normalizeEmail(body.email);
        const suppliedPassword = typeof body.password === "string" ? body.password : "";
        const credential = await database.lookupPassword(workspaceSlug, email);
        const valid = verifyPassword(
          suppliedPassword || "invalid-password",
          credential?.password_salt ?? dummyCredential.salt,
          credential?.password_hash ?? dummyCredential.hash
        );
        if (!credential || !valid) throw problems.unauthorized();
        status = 201;
        await issueBrowserSession(credential.membership_id, response, requestId, corsHeaders);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/invitations/accept") {
        checkAccountRate(request);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const token = typeof body.token === "string" ? body.token.trim() : "";
        if (token.length < 32 || token.length > 256) throw problems.unauthorized();
        const password = credentialForNewPassword(body.password);
        const accepted = await database.consumeMemberInvitation(secretDigest(token), password.salt, password.hash);
        if (!accepted?.membership_id) throw problems.unauthorized();
        status = 201;
        await issueBrowserSession(accepted.membership_id, response, requestId, corsHeaders);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/account/reset") {
        checkAccountRate(request);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const token = typeof body.token === "string" ? body.token.trim() : "";
        if (token.length < 32 || token.length > 256) throw problems.unauthorized();
        const password = credentialForNewPassword(body.password);
        const membershipId = await database.consumePasswordResetToken(secretDigest(token), password.salt, password.hash);
        if (!membershipId) throw problems.unauthorized();
        status = 201;
        await issueBrowserSession(membershipId, response, requestId, corsHeaders);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/account/recovery") {
        checkAccountRate(request);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const workspaceSlug = normalizePersianText(body.workspaceSlug, { max: 63, required: true });
        const email = normalizeEmail(body.email);
        const recoveryCode = typeof body.recoveryCode === "string" ? body.recoveryCode.trim() : "";
        if (recoveryCode.length < 24 || recoveryCode.length > 256) throw problems.unauthorized();
        const password = credentialForNewPassword(body.password);
        const membershipId = await database.consumeRecoveryCode(workspaceSlug, email, secretDigest(recoveryCode), password.salt, password.hash);
        if (!membershipId) throw problems.unauthorized();
        status = 201;
        await issueBrowserSession(membershipId, response, requestId, corsHeaders);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/public/intakes") {
        assertPublicIntakeOrigin(config, origin);
        const limited = publicIntakeLimit(`${request.socket?.remoteAddress ?? "unknown"}|${origin}`);
        if (limited) throw limited;
        const idempotencyKey = publicIntakeIdempotencyKey(request.headers["idempotency-key"]);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const publicContext = await resolvePublicIntakeContext(config, database);
        const result = await repository.createIntake(
          publicContext,
          publicIntakeInput(config, body),
          idempotencyKey,
          requestId
        );
        status = result.status;
        const publicCorsHeaders = { ...corsHeaders };
        delete publicCorsHeaders["Access-Control-Allow-Credentials"];
        json(response, status, safePublicIntakeResponse(result), requestId, publicCorsHeaders);
        return;
      }

      rejectWorkspaceOverride(request);
      const context = await authenticate(request);

      if (request.method === "GET" && url.pathname === "/api/v1/session") {
        status = 200;
        json(response, status, {
          dataMode: "server",
          workspace: { id: context.workspace_id, slug: context.workspace_slug, name: context.workspace_name },
          user: { id: context.user_id, email: context.user_email, name: context.display_name, role: context.role },
          scopes: context.scopes
        }, requestId, corsHeaders);
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/v1/runtime") {
        const runtime = await repository.runtime(context);
        status = 200;
        json(response, status, runtime, requestId, corsHeaders);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/v1/session/csrf") {
        if (context.auth_method !== "cookie") throw problems.forbidden();
        const rawSession = opaqueToken("rahjo_session");
        const csrfToken = opaqueToken("rahjo_csrf");
        const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60_000);
        const renewed = await database.renewSession(
          context.membership_id,
          tokenDigest(context.session_token, config.tokenPepper),
          tokenDigest(rawSession, config.tokenPepper),
          tokenDigest(csrfToken, config.tokenPepper),
          expiresAt
        );
        if (!renewed) throw problems.unauthorized();
        status = 200;
        json(response, status, { dataMode: "server", csrfToken, expiresAt: expiresAt.toISOString() }, requestId, {
          ...corsHeaders,
          "Set-Cookie": `${sessionCookie}=${encodeURIComponent(rawSession)}; Path=/; HttpOnly; ${config.appEnv === "production" ? "Secure; " : ""}SameSite=Lax; Max-Age=${config.sessionHours * 3600}`
        });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/v1/session/logout") {
        requireCsrf(request, context);
        if (context.auth_method === "cookie") await database.revokeSession(tokenDigest(context.session_token, config.tokenPepper));
        status = 204;
        response.writeHead(status, {
          ...baseHeaders(requestId),
          ...corsHeaders,
          "Set-Cookie": `${sessionCookie}=; Path=/; HttpOnly; ${config.appEnv === "production" ? "Secure; " : ""}SameSite=Lax; Max-Age=0`
        });
        response.end();
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/v1/members") {
        requireRole(context, ["owner", "admin"]);
        const members = await database.listWorkspaceMembers(context.workspace_id, context.membership_id);
        status = 200;
        json(response, status, { dataMode: "server", members }, requestId, corsHeaders);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/members/invitations") {
        requireRole(context, ["owner", "admin"]);
        requireCsrf(request, context);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const email = normalizeEmail(body.email);
        const displayName = normalizePersianText(body.displayName, { max: 160, required: true });
        const role = typeof body.role === "string" ? body.role : "viewer";
        if (!new Set(["admin", "operator", "viewer"]).has(role)) throw problems.validation("Invitation role is invalid");
        const rawToken = opaqueToken("rahjo_invite");
        const expiresAt = new Date(Date.now() + 48 * 60 * 60_000);
        const invitation = await database.createMemberInvitation(
          context.workspace_id, context.membership_id, email, displayName, role, secretDigest(rawToken), expiresAt
        );
        if (!invitation) throw problems.conflict("INVITATION_NOT_CREATED", "Invitation could not be created");
        const uiOrigin = trustedUiOrigin(origin, config.corsOrigins);
        status = 201;
        json(response, status, {
          dataMode: "server",
          invitation: {
            id: invitation.invitation_id,
            email,
            role,
            expiresAt: expiresAt.toISOString(),
            url: fragmentUrl(uiOrigin, "/accept-invite", { token: rawToken })
          }
        }, requestId, corsHeaders);
        return;
      }

      const memberReset = routeMatch(url.pathname, /^\/api\/v1\/members\/([^/]+)\/reset-link$/);
      if (request.method === "POST" && memberReset) {
        requireRole(context, ["owner", "admin"]);
        requireCsrf(request, context);
        const membershipId = decodeURIComponent(memberReset[1]);
        const rawToken = opaqueToken("rahjo_reset");
        const expiresAt = new Date(Date.now() + 30 * 60_000);
        const created = await database.createPasswordResetToken(
          context.workspace_id, membershipId, context.membership_id, secretDigest(rawToken), expiresAt
        );
        if (!created) throw problems.notFound();
        const uiOrigin = trustedUiOrigin(origin, config.corsOrigins);
        status = 201;
        json(response, status, {
          dataMode: "server",
          reset: { expiresAt: expiresAt.toISOString(), url: fragmentUrl(uiOrigin, "/recover-account", { mode: "reset", token: rawToken }) }
        }, requestId, corsHeaders);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/account/password") {
        requireCsrf(request, context);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
        const credential = await database.lookupPassword(context.workspace_slug, context.user_email);
        if (!credential || !verifyPassword(currentPassword, credential.password_salt, credential.password_hash)) throw problems.unauthorized();
        const next = credentialForNewPassword(body.newPassword);
        const changed = await database.setPasswordCredential(context.workspace_id, context.membership_id, next.salt, next.hash);
        if (!changed) throw problems.unavailable("PASSWORD_CHANGE_FAILED", "Password change could not be completed");
        status = 204;
        response.writeHead(status, {
          ...baseHeaders(requestId),
          ...corsHeaders,
          "Set-Cookie": `${sessionCookie}=; Path=/; HttpOnly; ${config.appEnv === "production" ? "Secure; " : ""}SameSite=Lax; Max-Age=0`
        });
        response.end();
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/account/recovery-codes") {
        requireCsrf(request, context);
        const codes = Array.from({ length: 8 }, () => opaqueToken("rahjo_recovery"));
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60_000);
        const count = await database.replaceRecoveryCodes(context.workspace_id, context.membership_id, codes.map(secretDigest), expiresAt);
        if (count !== codes.length) throw problems.unavailable("RECOVERY_CODES_FAILED", "Recovery codes could not be generated");
        status = 201;
        json(response, status, { dataMode: "server", codes, expiresAt: expiresAt.toISOString() }, requestId, corsHeaders);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/intakes") {
        requireCsrf(request, context);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const result = await repository.createIntake(context, body, request.headers["idempotency-key"], requestId);
        status = result.status;
        json(response, status, { dataMode: "server", replayed: result.replayed, data: result.data }, requestId, corsHeaders);
        return;
      }

      const approval = routeMatch(url.pathname, /^\/api\/v1\/approvals\/([^/]+)\/decision$/);
      if (request.method === "POST" && approval) {
        requireCsrf(request, context);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const result = await repository.decideApproval(context, decodeURIComponent(approval[1]), body.decision, requestId);
        status = 200;
        json(response, status, { dataMode: "server", data: result }, requestId, corsHeaders);
        return;
      }

      const action = routeMatch(url.pathname, /^\/api\/v1\/cases\/([^/]+)\/actions$/);
      if (request.method === "POST" && action) {
        requireCsrf(request, context);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const result = await repository.createAction(context, decodeURIComponent(action[1]), body, request.headers["idempotency-key"], requestId);
        status = result.replayed ? 200 : 201;
        json(response, status, { dataMode: "server", data: result }, requestId, corsHeaders);
        return;
      }

      const run = routeMatch(url.pathname, /^\/api\/v1\/actions\/([^/]+)\/runs$/);
      if (request.method === "POST" && run) {
        requireCsrf(request, context);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const result = await repository.executeAction(context, decodeURIComponent(run[1]), requestId);
        status = result.replayed ? 200 : 201;
        json(response, status, { dataMode: "server", data: result }, requestId, corsHeaders);
        return;
      }

      const outcome = routeMatch(url.pathname, /^\/api\/v1\/cases\/([^/]+)\/outcomes$/);
      if (request.method === "POST" && outcome) {
        requireCsrf(request, context);
        const body = await readJson(request, config.bodyLimit);
        rejectWorkspaceOverride(request, body);
        const result = await repository.recordOutcome(context, decodeURIComponent(outcome[1]), body, requestId);
        status = result.replayed ? 200 : 201;
        json(response, status, { dataMode: "server", data: result }, requestId, corsHeaders);
        return;
      }

      throw problems.notFound();
    } catch (error) {
      const problem = toProblem(error, request.url ?? "/", requestId);
      status = problem.status;
      json(response, status, problem.body, requestId, { ...corsHeaders, ...problem.headers, "Content-Type": "application/problem+json; charset=utf-8" });
      if (!(error instanceof HttpProblem) || error.status >= 500) {
        logger.error?.({ requestId, code: error.code ?? "UNHANDLED", status });
      }
    } finally {
      logger.info?.({ requestId, method: request.method, path: request.url, status, durationMs: Math.round(performance.now() - startedAt) });
    }
  }

  return createServer(handler);
}
