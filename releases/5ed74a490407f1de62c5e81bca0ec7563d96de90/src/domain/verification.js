/** @typedef {"service" | "details" | "review" | "result"} AccessRequestStep */
/** @typedef {{serviceId: string | null, organization: string, purpose: string, monthlyVolume: string}} AccessRequestPayload */
/** @typedef {{step: AccessRequestStep, payload: AccessRequestPayload, referenceId: string | null}} AccessRequestState */

/** @returns {AccessRequestState} */
export function createVerificationState() {
  return {
    step: "service",
    payload: {
      serviceId: null,
      organization: "",
      purpose: "",
      monthlyVolume: ""
    },
    referenceId: null
  };
}

/** @param {AccessRequestState} state @param {string} serviceId @returns {AccessRequestState} */
export function selectService(state, serviceId) {
  return { ...state, payload: { ...state.payload, serviceId } };
}

/** @param {AccessRequestState} state @param {Partial<AccessRequestPayload>} fields @returns {AccessRequestState} */
export function updateVerificationFields(state, fields) {
  return { ...state, payload: { ...state.payload, ...fields } };
}

/** @param {AccessRequestState} state @returns {AccessRequestState} */
export function nextVerificationStep(state) {
  const order = /** @type {AccessRequestStep[]} */ (["service", "details", "review", "result"]);
  const index = order.indexOf(state.step);
  return { ...state, step: order[Math.min(index + 1, order.length - 1)] };
}

/** @param {AccessRequestState} state @returns {AccessRequestState} */
export function previousVerificationStep(state) {
  const order = /** @type {AccessRequestStep[]} */ (["service", "details", "review", "result"]);
  const index = order.indexOf(state.step);
  return { ...state, step: order[Math.max(index - 1, 0)] };
}

/** @param {AccessRequestState} state @param {string} referenceId @returns {AccessRequestState} */
export function completeVerification(state, referenceId) {
  return { ...state, step: "result", referenceId };
}

/** @param {AccessRequestState} state @returns {boolean} */
export function canContinue(state) {
  if (state.step === "service") return Boolean(state.payload.serviceId);

  if (state.step === "details") {
    return (
      state.payload.organization.trim().length >= 3 &&
      state.payload.purpose.trim().length >= 12 &&
      ["pilot", "small", "medium", "large"].includes(state.payload.monthlyVolume)
    );
  }

  return true;
}
