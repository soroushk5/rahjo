/**
 * @typedef {{serviceId: string, organization: string, purpose: string, monthlyVolume: string}} AccessRequest
 * @typedef {{referenceId: string, status: "accepted"}} AccessResponse
 * @typedef {{submit(request: AccessRequest): Promise<AccessResponse>}} AccessRequestGateway
 */

/** @implements {AccessRequestGateway} */
export class MockAccessRequestGateway {
  /** @param {AccessRequest} request */
  async submit(request) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const suffix = String(Date.now()).slice(-6);
    return /** @type {AccessResponse} */ ({
      referenceId: `RA-${request.serviceId.toUpperCase()}-${suffix}`,
      status: "accepted"
    });
  }
}
