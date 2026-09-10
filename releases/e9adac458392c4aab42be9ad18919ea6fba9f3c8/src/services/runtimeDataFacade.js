import { RuntimeConfigurationError, parseRuntimeConfig } from "../config/runtimeConfig.js";

export const RUNTIME_DATA_STATES = Object.freeze({
  DEMO: "demo",
  CONNECTING: "connecting",
  READY: "ready",
  UNAVAILABLE: "unavailable",
  AUTH: "auth",
  FORBIDDEN: "forbidden",
  CONFLICT: "conflict",
  VALIDATION: "validation"
});

export const SERVER_RUNTIME_PATH = "/api/v1/runtime";
export const SERVER_SESSION_PATH = "/api/v1/session";
export const DEFAULT_SERVER_TIMEOUT_MS = 30000;

/** @type {Readonly<Record<string, string>>} */
const stateMessages = Object.freeze({
  unavailable: "سرویس دادهٔ رهجو در دسترس نیست. هیچ دادهٔ نمایشی جایگزین نشده است.",
  auth: "نشست معتبر نیست. برای ادامه باید از مسیر امن سرور وارد شوید.",
  forbidden: "این نشست به فضای کاری درخواستی دسترسی ندارد.",
  conflict: "نسخهٔ داده تغییر کرده است. پیش از ادامه باید دادهٔ سرور دوباره خوانده شود.",
  validation: "پاسخ سرور با قرارداد دادهٔ رهجو سازگار نیست.",
  connecting: "در حال برقراری اتصال امن با سرویس دادهٔ رهجو…",
  ready: "اتصال سرور و فضای کاری تأیید شد.",
  demo: "حالت Golden Demo با دادهٔ ساختگی و جدا از سرور فعال است."
});

/** @param {unknown} value */
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** @param {unknown} value */
function immutableJson(value) {
  if (Array.isArray(value)) {
    value.forEach(immutableJson);
    return Object.freeze(value);
  }
  if (isPlainObject(value)) {
    Object.values(/** @type {Record<string, unknown>} */ (value)).forEach(immutableJson);
    return Object.freeze(value);
  }
  return value;
}

/**
 * @param {unknown} payload
 * @returns {{version:number, workspace:Record<string, any>, projection:Record<string, any>}}
 */
function validateServerEnvelope(payload) {
  if (!isPlainObject(payload)) throw new Error("Response envelope must be an object.");
  const envelope = /** @type {Record<string, any>} */ (payload);
  if (envelope.dataMode !== "server") throw new Error("Response data mode is not server.");
  if (!Number.isInteger(envelope.version) || envelope.version < 1) throw new Error("Response version is missing.");
  if (!isPlainObject(envelope.workspace) || typeof envelope.workspace.id !== "string" || !envelope.workspace.id.trim()) {
    throw new Error("Workspace identity is missing.");
  }
  if (!isPlainObject(envelope.projection)) throw new Error("Runtime projection is missing.");

  return /** @type {{version:number, workspace:Record<string, any>, projection:Record<string, any>}} */ (immutableJson({
    version: envelope.version,
    workspace: { ...envelope.workspace, id: envelope.workspace.id.trim() },
    projection: { ...envelope.projection }
  }));
}

/** @param {string} apiBase */
export function serverRuntimeUrl(apiBase) {
  return `${apiBase.replace(/\/$/, "")}${SERVER_RUNTIME_PATH}`;
}

/** @param {number} status */
function stateForHttpStatus(status) {
  if (status === 401) return RUNTIME_DATA_STATES.AUTH;
  if (status === 403) return RUNTIME_DATA_STATES.FORBIDDEN;
  if (status === 409) return RUNTIME_DATA_STATES.CONFLICT;
  if (status === 400 || status === 422) return RUNTIME_DATA_STATES.VALIDATION;
  if (status >= 400 && status < 500) return RUNTIME_DATA_STATES.VALIDATION;
  return RUNTIME_DATA_STATES.UNAVAILABLE;
}

/** @param {string | null} mode @param {string} state @param {Record<string, unknown>} [extra] */
function makeSnapshot(mode, state, extra = {}) {
  return Object.freeze({
    mode,
    state,
    message: stateMessages[state] ?? stateMessages.unavailable,
    workspace: null,
    projection: null,
    httpStatus: null,
    buildSha: null,
    ...extra
  });
}

export function createRuntimeDataFacade() {
  let current = makeSnapshot(null, RUNTIME_DATA_STATES.UNAVAILABLE, { reason: "not-initialized" });
  /** @type {ReturnType<typeof parseRuntimeConfig> | null} */
  let activeConfig = null;
  let sessionCsrfToken = "";

  /** @param {ReturnType<typeof makeSnapshot>} next */
  function publish(next) {
    current = next;
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent("rahjo:runtime-data", { detail: next }));
    }
    return next;
  }

  /** @returns {typeof current} */
  function read() {
    return current;
  }

  /**
   * Synchronous read of the last server-confirmed projection. It is deliberately
   * null for every failure and for demo mode; callers must branch on state.
   */
  function readProjection() {
    return current.state === RUNTIME_DATA_STATES.READY ? current.projection : null;
  }

  /** @param {unknown} error */
  function configurationFailure(error) {
    activeConfig = null;
    sessionCsrfToken = "";
    const reason = error instanceof RuntimeConfigurationError ? error.code : "invalid-config";
    return publish(makeSnapshot(null, RUNTIME_DATA_STATES.VALIDATION, { reason }));
  }

  /**
   * @param {unknown} rawConfig
   * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [options]
   */
  async function initialize(rawConfig, options = {}) {
    let config;
    try {
      config = parseRuntimeConfig(rawConfig);
    } catch (error) {
      return configurationFailure(error);
    }
    activeConfig = config;

    if (config.mode === "demo") {
      sessionCsrfToken = "";
      return publish(makeSnapshot("demo", RUNTIME_DATA_STATES.DEMO, { buildSha: config.buildSha }));
    }

    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      return publish(makeSnapshot("server", RUNTIME_DATA_STATES.UNAVAILABLE, {
        buildSha: config.buildSha,
        reason: "fetch-unavailable"
      }));
    }

    publish(makeSnapshot("server", RUNTIME_DATA_STATES.CONNECTING, { buildSha: config.buildSha }));
    const controller = new AbortController();
    const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1, Number(options.timeoutMs)) : DEFAULT_SERVER_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(serverRuntimeUrl(config.apiBase), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const state = stateForHttpStatus(response.status);
        if (state === RUNTIME_DATA_STATES.AUTH) sessionCsrfToken = "";
        return publish(makeSnapshot("server", state, {
          buildSha: config.buildSha,
          httpStatus: response.status,
          reason: `http-${response.status}`
        }));
      }

      let envelope;
      try {
        envelope = validateServerEnvelope(await response.json());
      } catch {
        return publish(makeSnapshot("server", RUNTIME_DATA_STATES.VALIDATION, {
          buildSha: config.buildSha,
          httpStatus: response.status,
          reason: "invalid-response"
        }));
      }

      return publish(makeSnapshot("server", RUNTIME_DATA_STATES.READY, {
        buildSha: config.buildSha,
        httpStatus: response.status,
        workspace: envelope.workspace,
        projection: envelope.projection,
        version: envelope.version
      }));
    } catch {
      return publish(makeSnapshot("server", RUNTIME_DATA_STATES.UNAVAILABLE, {
        buildSha: config.buildSha,
        reason: "request-failed"
      }));
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Establish a server-owned browser session. Credentials and the CSRF token
   * stay inside this closure and never enter a public snapshot or browser
   * storage. A successful exchange is not READY until the server projection is
   * fetched and validated through the normal fail-closed path.
   *
   * @param {{workspaceSlug:string, email:string, password:string}} credentials
   * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} [options]
   */
  async function authenticate(credentials, options = {}) {
    const config = activeConfig;
    if (!config || config.mode !== "server") {
      return configurationFailure(new RuntimeConfigurationError("Server runtime is not configured.", "server-not-configured"));
    }
    if (!credentials || typeof credentials !== "object"
      || typeof credentials.workspaceSlug !== "string" || !credentials.workspaceSlug.trim()
      || typeof credentials.email !== "string" || !credentials.email.trim()
      || typeof credentials.password !== "string" || !credentials.password) {
      return publish(makeSnapshot("server", RUNTIME_DATA_STATES.VALIDATION, {
        buildSha: config.buildSha,
        reason: "invalid-login-input"
      }));
    }

    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      return publish(makeSnapshot("server", RUNTIME_DATA_STATES.UNAVAILABLE, {
        buildSha: config.buildSha,
        reason: "fetch-unavailable"
      }));
    }

    publish(makeSnapshot("server", RUNTIME_DATA_STATES.CONNECTING, { buildSha: config.buildSha }));
    const controller = new AbortController();
    const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1, Number(options.timeoutMs)) : DEFAULT_SERVER_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${config.apiBase}${SERVER_SESSION_PATH}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workspaceSlug: credentials.workspaceSlug.trim(),
          email: credentials.email.trim(),
          password: credentials.password
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        sessionCsrfToken = "";
        const state = stateForHttpStatus(response.status);
        return publish(makeSnapshot("server", state, {
          buildSha: config.buildSha,
          httpStatus: response.status,
          reason: `login-http-${response.status}`
        }));
      }

      let session;
      try {
        session = await response.json();
      } catch {
        session = null;
      }
      if (!isPlainObject(session) || session.dataMode !== "server"
        || typeof session.csrfToken !== "string" || session.csrfToken.length < 24) {
        sessionCsrfToken = "";
        return publish(makeSnapshot("server", RUNTIME_DATA_STATES.VALIDATION, {
          buildSha: config.buildSha,
          httpStatus: response.status,
          reason: "invalid-session-response"
        }));
      }
      sessionCsrfToken = session.csrfToken;
    } catch {
      sessionCsrfToken = "";
      return publish(makeSnapshot("server", RUNTIME_DATA_STATES.UNAVAILABLE, {
        buildSha: config.buildSha,
        reason: "login-request-failed"
      }));
    } finally {
      clearTimeout(timeout);
    }

    return initialize(config, options);
  }

  return Object.freeze({ initialize, authenticate, read, readProjection, configurationFailure });
}

export const runtimeData = createRuntimeDataFacade();
