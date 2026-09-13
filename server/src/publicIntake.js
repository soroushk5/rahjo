import { problems } from "./errors.js";
import { normalizePersianText, requiredIdempotencyKey } from "./normalization.js";
import { tokenDigest } from "./security.js";

const attributionKeys = Object.freeze([
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "referrer",
  "landingPath"
]);

/** Resolve the one server-owned public-intake identity. */
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

export function assertPublicIntakeOrigin(config, origin) {
  if (!config.publicIntakeEnabled) throw problems.notFound();
  const normalized = typeof origin === "string" ? origin.replace(/\/$/, "") : "";
  if (!normalized || normalized !== config.publicIntakeOrigin) throw problems.forbidden();
  return normalized;
}

export function normalizePublicAttribution(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const output = {};
  for (const key of attributionKeys) {
    if (typeof input[key] !== "string") continue;
    const max = key === "referrer" ? 500 : 180;
    const normalized = normalizePersianText(input[key], { max });
    if (normalized) output[key] = normalized;
  }
  return Object.freeze(output);
}

export function publicIntakeInput(config, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw problems.validation();
  return {
    organization: body.organization,
    contactName: body.contactName,
    email: body.email,
    phone: body.phone,
    purpose: body.purpose,
    serviceId: config.publicIntakeServiceId,
    sourceChannel: "website",
    attribution: normalizePublicAttribution(body.attribution)
  };
}

export function publicIntakeIdempotencyKey(value) {
  return requiredIdempotencyKey(value);
}

/** Public callers receive no internal CRM/entity identifiers. */
export function safePublicIntakeResponse(result) {
  return Object.freeze({
    dataMode: "server",
    replayed: result?.replayed === true,
    status: "received"
  });
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
