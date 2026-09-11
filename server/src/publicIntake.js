import { problems } from "./errors.js";
import { normalizePersianText } from "./normalization.js";
import { tokenDigest } from "./security.js";

const attributionKeys = Object.freeze(["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "referrer", "landingPath"]);

/**
 * Resolve the one server-owned public-intake identity. The browser never sends a
 * workspace id, membership id or Rahjo API token.
 */
export async function resolvePublicIntakeContext(config, database) {
  if (!config.publicIntakeEnabled) throw problems.notFound();
  const context = await database.authenticate(tokenDigest(config.publicIntakeToken, config.tokenPepper));
  if (!context
    || context.workspace_slug !== config.publicIntakeWorkspaceSlug
    || context.role !== "intake"
    || !Array.isArray(context.scopes)
    || !context.scopes.includes("intake:write")) {
    throw problems.unavailable("PUBLIC_INTAKE_IDENTITY_INVALID", "The public intake identity is not safely provisioned");
  }
  return context;
}

export function normalizePublicAttribution(value, requestUrl = "") {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const output = {};
  for (const key of attributionKeys) {
    if (typeof input[key] !== "string") continue;
    const normalized = normalizePersianText(input[key], { max: key === "referrer" ? 500 : 180 });
    if (normalized) output[key] = normalized;
  }
  if (requestUrl) {
    try {
      const url = new URL(requestUrl, "https://rahjo.invalid");
      if (!output.landingPath) output.landingPath = normalizePersianText(url.pathname, { max: 180 });
    } catch {
      // The HTTP layer already owns URL parsing; attribution remains optional.
    }
  }
  return Object.freeze(output);
}

export function publicIntakeInput(body, requestUrl = "") {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw problems.validation();
  return {
    organization: body.organization,
    contactName: body.contactName,
    email: body.email,
    phone: body.phone,
    purpose: body.purpose,
    serviceId: body.serviceId,
    sourceChannel: "website",
    attribution: normalizePublicAttribution(body.attribution, requestUrl)
  };
}

export function safePublicIntakeResponse(result) {
  const data = result?.data ?? {};
  return {
    dataMode: "server",
    replayed: result?.replayed === true,
    caseId: data.caseId ?? null,
    serviceId: data.serviceId ?? null,
    status: data.status ?? "received"
  };
}

export function createFixedWindowLimiter({ maxRequests, windowMs }) {
  const windows = new Map();
  return function limit(key, now = Date.now()) {
    const previous = windows.get(key);
    if (!previous || now - previous.startedAt >= windowMs) {
      windows.set(key, { startedAt: now, count: 1 });
      return null;
    }
    previous.count += 1;
    if (previous.count <= maxRequests) return null;
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - previous.startedAt)) / 1000));
    return problems.rateLimited(retryAfter);
  };
}
