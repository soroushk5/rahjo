export const RUNTIME_MODES = Object.freeze(["demo", "server"]);

export class RuntimeConfigurationError extends Error {
  /** @param {string} message @param {string} code */
  constructor(message, code) {
    super(message);
    this.name = "RuntimeConfigurationError";
    this.code = code;
  }
}

/** @param {unknown} value */
function requirePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RuntimeConfigurationError("Rahjo runtime configuration must be an object.", "invalid-config");
  }
  return /** @type {Record<string, unknown>} */ (value);
}

/** @param {unknown} value @param {string} field */
function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new RuntimeConfigurationError(`${field} must be a non-empty string.`, "invalid-config");
  }
  return value.trim();
}

/** @param {string} raw */
function normalizeApiBase(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new RuntimeConfigurationError("apiBase must be an absolute URL.", "invalid-api-base");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new RuntimeConfigurationError("apiBase cannot contain credentials, a query, or a fragment.", "unsafe-api-base");
  }

  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new RuntimeConfigurationError("apiBase must use HTTPS; HTTP is allowed only for localhost.", "insecure-api-base");
  }

  return url.toString().replace(/\/$/, "");
}

/**
 * Parse the only supported public runtime configuration. Unknown values are not
 * coerced, so a failed server deployment can never become a demo deployment.
 *
 * @param {unknown} value
 */
export function parseRuntimeConfig(value) {
  const candidate = requirePlainObject(value);
  if (typeof candidate.mode !== "string" || !RUNTIME_MODES.includes(candidate.mode)) {
    throw new RuntimeConfigurationError("mode must be exactly demo or server.", "invalid-mode");
  }
  const mode = candidate.mode;

  const buildSha = requireText(candidate.buildSha, "buildSha");
  const rawApiBase = typeof candidate.apiBase === "string" ? candidate.apiBase.trim() : "";

  if (mode === "demo" && rawApiBase) {
    throw new RuntimeConfigurationError("Demo mode must not be configured with a server API base.", "mixed-runtime-mode");
  }
  if (mode === "server" && !rawApiBase) {
    throw new RuntimeConfigurationError("Server mode requires apiBase.", "missing-api-base");
  }

  return Object.freeze({
    mode,
    apiBase: mode === "server" ? normalizeApiBase(rawApiBase) : "",
    buildSha
  });
}

/** @param {Document} [target] */
export function readRuntimeConfig(target = document) {
  const node = target.querySelector("#rahjo-runtime-config");
  if (!node) {
    throw new RuntimeConfigurationError("Rahjo runtime configuration is missing.", "missing-config");
  }

  try {
    return parseRuntimeConfig(JSON.parse(node.textContent ?? ""));
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) throw error;
    throw new RuntimeConfigurationError("Rahjo runtime configuration is not valid JSON.", "invalid-json");
  }
}
