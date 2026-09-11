import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { HttpProblem, problems, toProblem } from "./errors.js";
import { normalizeEmail, normalizePersianText } from "./normalization.js";
import { opaqueToken, passwordCredential, safeEqual, tokenDigest, verifyPassword } from "./security.js";

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

export function createRahjoServer({ config, database, repository, relaticle, workspaceTokens, logger = console }) {
  const sessionCookie = config.appEnv === "production" ? "__Host-rahjo_session" : "rahjo_session";
  const dummyCredential = passwordCredential("not-a-real-password-value");
  const loginWindows = new Map();

  function checkLoginRate(request) {
    const now = Date.now();
    const key = request.socket?.remoteAddress ?? "unknown";
    const prior = loginWindows.get(key);
    const state = !prior || now - prior.startedAt >= 10 * 60_000 ? { startedAt: now, count: 0 } : prior;
    state.count += 1;
    loginWindows.set(key, state);
    if (state.count > 10) throw problems.rateLimited(Math.ceil((state.startedAt + 10 * 60_000 - now) / 1000));
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
        json(response, status, { status: "ok", service: "rahjo-crm-bff", dataMode: "server", crmMode: config.crmMode, interim: config.interim, llmEnabled: false }, requestId, corsHeaders);
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
          llmEnabled: false,
          database: { status: "ready", role: databaseState.role },
          relaticle: { status: "authenticated-and-team-verified", workspaces: upstream.length }
        }, requestId, corsHeaders);
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
        const rawSession = opaqueToken("rahjo_session");
        const csrfToken = opaqueToken("rahjo_csrf");
        const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60_000);
        const created = await database.createSession(
          credential.membership_id,
          tokenDigest(rawSession, config.tokenPepper),
          tokenDigest(csrfToken, config.tokenPepper),
          expiresAt
        );
        if (!created) throw problems.unauthorized();
        const context = await database.authenticateSession(tokenDigest(rawSession, config.tokenPepper));
        if (!context) throw problems.unauthorized();
        status = 201;
        json(response, status, {
          dataMode: "server",
          csrfToken,
          expiresAt: expiresAt.toISOString(),
          workspace: { id: context.workspace_id, slug: context.workspace_slug, name: context.workspace_name },
          user: { id: context.user_id, email: context.user_email, name: context.display_name, role: context.role }
        }, requestId, {
          ...corsHeaders,
          "Set-Cookie": `${sessionCookie}=${encodeURIComponent(rawSession)}; Path=/; HttpOnly; ${config.appEnv === "production" ? "Secure; " : ""}SameSite=Lax; Max-Age=${config.sessionHours * 3600}`
        });
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
        const csrfToken = opaqueToken("rahjo_csrf");
        const rotated = await database.rotateSessionCsrf(
          tokenDigest(context.session_token, config.tokenPepper),
          tokenDigest(csrfToken, config.tokenPepper)
        );
        if (!rotated) throw problems.unauthorized();
        status = 200;
        json(response, status, { dataMode: "server", csrfToken }, requestId, corsHeaders);
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
