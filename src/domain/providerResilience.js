/** @typedef {"TRANSIENT_RATE_LIMIT" | "QUOTA_OR_BILLING_LIMIT" | "AUTH_OR_ACCESS" | "REGION_OR_POLICY" | "SERVER_OR_NETWORK" | "INVALID_REQUEST"} ProviderFailureClass */
/** @typedef {"RETRY" | "FALLBACK_PROVIDER" | "LOCAL" | "NO_LLM" | "INTERVENTION"} ProviderRecoveryAction */
/** @typedef {{status?: number, code?: string, type?: string, message?: string, retryAfterMs?: number}} ProviderErrorLike */
/** @typedef {{errorClass: ProviderFailureClass, action: ProviderRecoveryAction, retryEligible: boolean, delayMs: number, degraded: true}} ProviderRecoveryPlan */

/** @param {ProviderErrorLike} error @returns {string} */
function errorText(error) {
  return `${error.code ?? ""} ${error.type ?? ""} ${error.message ?? ""}`.toLowerCase();
}

/** @param {ProviderErrorLike} error @returns {ProviderFailureClass} */
export function classifyProviderFailure(error) {
  const status = error.status ?? 0;
  const text = errorText(error);

  if (/region|country|geograph|unsupported location|policy/.test(text)) {
    return "REGION_OR_POLICY";
  }

  if (status === 429) {
    if (/insufficient_quota|quota|billing|credit|spend|usage limit/.test(text)) {
      return "QUOTA_OR_BILLING_LIMIT";
    }
    return "TRANSIENT_RATE_LIMIT";
  }

  if (status === 401 || status === 403) return "AUTH_OR_ACCESS";
  if (status >= 500 || /timeout|timed out|network|connection|socket|econn/.test(text)) {
    return "SERVER_OR_NETWORK";
  }
  return "INVALID_REQUEST";
}

/** @param {ProviderFailureClass} errorClass @returns {boolean} */
export function isProviderRetryEligible(errorClass) {
  return errorClass === "TRANSIENT_RATE_LIMIT" || errorClass === "SERVER_OR_NETWORK";
}

/**
 * @param {{attempt: number, retryAfterMs?: number, baseDelayMs?: number, maxDelayMs?: number, jitterRatio?: number}} input
 * @returns {number}
 */
export function computeProviderRetryDelay(input) {
  const retryAfterMs = input.retryAfterMs ?? 0;
  if (retryAfterMs > 0) return retryAfterMs;

  const attempt = Math.max(0, input.attempt);
  const baseDelayMs = Math.max(1, input.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(baseDelayMs, input.maxDelayMs ?? 8000);
  const jitterRatio = Math.min(1, Math.max(0, input.jitterRatio ?? 0));
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.round(exponential * (1 + jitterRatio));
}

/**
 * @param {{error: ProviderErrorLike, attempt: number, maxAttempts?: number, fallbackAvailable?: boolean, localAvailable?: boolean, jitterRatio?: number}} input
 * @returns {ProviderRecoveryPlan}
 */
export function planProviderRecovery(input) {
  const errorClass = classifyProviderFailure(input.error);
  const retryEligible = isProviderRetryEligible(errorClass);
  const maxAttempts = Math.max(0, input.maxAttempts ?? 3);

  if (retryEligible && input.attempt < maxAttempts) {
    return {
      errorClass,
      action: "RETRY",
      retryEligible,
      delayMs: computeProviderRetryDelay({
        attempt: input.attempt,
        retryAfterMs: input.error.retryAfterMs,
        jitterRatio: input.jitterRatio
      }),
      degraded: true
    };
  }

  if (errorClass === "INVALID_REQUEST") {
    return { errorClass, action: "INTERVENTION", retryEligible: false, delayMs: 0, degraded: true };
  }
  if (input.fallbackAvailable ?? true) {
    return { errorClass, action: "FALLBACK_PROVIDER", retryEligible, delayMs: 0, degraded: true };
  }
  if (input.localAvailable ?? true) {
    return { errorClass, action: "LOCAL", retryEligible, delayMs: 0, degraded: true };
  }
  return { errorClass, action: "NO_LLM", retryEligible, delayMs: 0, degraded: true };
}
