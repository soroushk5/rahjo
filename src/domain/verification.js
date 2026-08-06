/** @typedef {"service" | "details" | "review" | "result"} VerificationStep */
/** @typedef {{serviceId: string | null, nationalId: string, mobile: string}} VerificationPayload */
/** @typedef {{step: VerificationStep, payload: VerificationPayload, referenceId: string | null}} VerificationState */

/** @returns {VerificationState} */
export function createVerificationState() {
  return {
    step: "service",
    payload: { serviceId: null, nationalId: "", mobile: "" },
    referenceId: null
  };
}

/** @param {VerificationState} state @param {string} serviceId @returns {VerificationState} */
export function selectService(state, serviceId) {
  return { ...state, payload: { ...state.payload, serviceId } };
}

/** @param {VerificationState} state @param {Partial<VerificationPayload>} fields @returns {VerificationState} */
export function updateVerificationFields(state, fields) {
  return { ...state, payload: { ...state.payload, ...fields } };
}

/** @param {VerificationState} state @returns {VerificationState} */
export function nextVerificationStep(state) {
  const order = /** @type {VerificationStep[]} */ (["service", "details", "review", "result"]);
  const index = order.indexOf(state.step);
  return { ...state, step: order[Math.min(index + 1, order.length - 1)] };
}

/** @param {VerificationState} state @returns {VerificationState} */
export function previousVerificationStep(state) {
  const order = /** @type {VerificationStep[]} */ (["service", "details", "review", "result"]);
  const index = order.indexOf(state.step);
  return { ...state, step: order[Math.max(index - 1, 0)] };
}

/** @param {VerificationState} state @param {string} referenceId @returns {VerificationState} */
export function completeVerification(state, referenceId) {
  return { ...state, step: "result", referenceId };
}

/** @param {VerificationState} state @returns {boolean} */
export function canContinue(state) {
  if (state.step === "service") return Boolean(state.payload.serviceId);
  if (state.step === "details") {
    return /^\d{10}$/.test(state.payload.nationalId) && /^09\d{9}$/.test(state.payload.mobile);
  }
  return true;
}
