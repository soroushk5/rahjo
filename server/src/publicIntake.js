import { problems } from "./errors.js";
import { normalizePersianText, requiredIdempotencyKey } from "./normalization.js";

const attributionKeys = Object.freeze([
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "referrer",
  "landingPath"
]);

/** Resolve the server-owned public-intake identity and service for one configured origin. */
export async function resolvePublicIntakeContext(config, database, origin) {
  if (!config.publicIntakeEnabled) throw problems.notFound();
  const context = await database.resolvePublicIntake(origin);
  if (!context
    || context.role !== "intake"
    || !Array.isArray(context.scopes)
    || !context.scopes.includes("intake:write")
    || typeof context.service_id !== "string"
    || !context.service_id) {
    throw problems.notFound();
  }
  return Object.freeze({
    context: Object.freeze({
      workspace_id: context.workspace_id,
      workspace_slug: context.workspace_slug,
      workspace_name: context.workspace_name,
      membership_id: context.membership_id,
      user_id: context.user_id,
      user_email: context.user_email,
      display_name: context.display_name,
      role: context.role,
      scopes: context.scopes
    }),
    serviceId: context.service_id
  });
}

export function assertPublicIntakeOrigin(config, origin) {
  if (!config.publicIntakeEnabled) throw problems.notFound();
  const normalized = typeof origin === "string" ? origin.replace(/\/$/, "") : "";
  if (!normalized || !config.corsOrigins.includes(normalized)) throw problems.forbidden();
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

export function publicIntakeInput(serviceId, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw problems.validation();
  return {
    organization: body.organization,
    contactName: body.contactName,
    email: body.email,
    phone: body.phone,
    purpose: body.purpose,
    serviceId,
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
