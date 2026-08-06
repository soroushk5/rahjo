/**
 * @typedef {{serviceId: string, nationalId: string, mobile: string}} VerificationRequest
 * @typedef {{referenceId: string, status: "accepted"}} VerificationResponse
 * @typedef {{submit(request: VerificationRequest): Promise<VerificationResponse>}} VerificationGateway
 */

/** @implements {VerificationGateway} */
export class MockVerificationGateway {
  /** @param {VerificationRequest} request */
  async submit(request) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const suffix = String(Date.now()).slice(-6);
    return /** @type {VerificationResponse} */ ({ referenceId: `RH-${request.serviceId.toUpperCase()}-${suffix}`, status: "accepted" });
  }
}
