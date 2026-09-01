/** @typedef {"USAGE_LIMIT" | "AUTH_OR_PERMISSION" | "SERVER_OR_NETWORK" | "INVALID_REQUEST"} ConnectorFailureClass */
/** @typedef {"RETRY" | "USE_STALE_SNAPSHOT" | "INTERVENTION"} ConnectorRecoveryAction */
/** @typedef {{status?: number, reason?: string, message?: string, retryAfterMs?: number}} ConnectorErrorLike */
/** @typedef {{errorClass: ConnectorFailureClass, action: ConnectorRecoveryAction, retryEligible: boolean, delayMs: number, state: "DEGRADED" | "STALE"}} ConnectorRecoveryPlan */

/** @param {ConnectorErrorLike} error @returns {ConnectorFailureClass} */
export function classifyConnectorFailure(error) {
  const status = error.status ?? 0;
  const text = `${error.reason ?? ""} ${error.message ?? ""}`.toLowerCase();

  if (
    status === 429 ||
    (status === 403 && /userratelimitexceeded|ratelimitexceeded|quota|rate limit/.test(text))
  ) {
    return "USAGE_LIMIT";
  }
  if (status === 401 || status === 403) return "AUTH_OR_PERMISSION";
  if (status >= 500 || /timeout|network|connection|socket|econn/.test(text)) {
    return "SERVER_OR_NETWORK";
  }
  return "INVALID_REQUEST";
}

/** @param {number} attempt @param {number | undefined} retryAfterMs @returns {number} */
function connectorRetryDelay(attempt, retryAfterMs) {
  if ((retryAfterMs ?? 0) > 0) return /** @type {number} */ (retryAfterMs);
  return Math.min(8000, 250 * 2 ** Math.max(0, attempt));
}

/**
 * @param {{error: ConnectorErrorLike, attempt: number, maxAttempts?: number, hasSnapshot?: boolean}} input
 * @returns {ConnectorRecoveryPlan}
 */
export function planConnectorRecovery(input) {
  const errorClass = classifyConnectorFailure(input.error);
  const retryEligible = errorClass === "USAGE_LIMIT" || errorClass === "SERVER_OR_NETWORK";
  const maxAttempts = Math.max(0, input.maxAttempts ?? 3);

  if (retryEligible && input.attempt < maxAttempts) {
    return {
      errorClass,
      action: "RETRY",
      retryEligible,
      delayMs: connectorRetryDelay(input.attempt, input.error.retryAfterMs),
      state: "DEGRADED"
    };
  }
  if ((input.hasSnapshot ?? false) && errorClass !== "AUTH_OR_PERMISSION") {
    return { errorClass, action: "USE_STALE_SNAPSHOT", retryEligible, delayMs: 0, state: "STALE" };
  }
  return { errorClass, action: "INTERVENTION", retryEligible: false, delayMs: 0, state: "DEGRADED" };
}

/** @param {string} idempotencyKey @param {string[]} completedKeys @returns {boolean} */
export function shouldExecuteMutation(idempotencyKey, completedKeys) {
  return !completedKeys.includes(idempotencyKey);
}

/** @param {string} idempotencyKey @param {string[]} completedKeys @returns {string[]} */
export function recordCompletedMutation(idempotencyKey, completedKeys) {
  return completedKeys.includes(idempotencyKey) ? completedKeys : [...completedKeys, idempotencyKey];
}
