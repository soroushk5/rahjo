import { randomUUID } from "node:crypto";

/**
 * Explicit zero-cost bridge used while the separated Relaticle service is not
 * deployable. Records are persisted in Rahjo's PostgreSQL crm_entity_refs and
 * are visibly marked pending_relaticle; this is never a silent fallback.
 */
export class NativeDeferredCrmClient {
  constructor() {
    this.mode = "native_deferred";
  }

  async verifyAuthentication() {
    return { id: "native-deferred", type: "bridge", attributes: { mode: this.mode } };
  }

  async verifyTeamIdentity(workspaceId) {
    return { teamId: `deferred:${workspaceId}`, abilities: ["read", "create"], protocolVersion: "deferred" };
  }

  async list() {
    return [];
  }

  async createCompany(_workspaceId, { name }) {
    return {
      id: `NATIVE-COMPANY-${randomUUID()}`,
      type: "companies",
      attributes: { name, source: "rahjo-native-bridge", sync_state: "pending_relaticle" }
    };
  }

  async createPerson(_workspaceId, { name, companyId }) {
    return {
      id: `NATIVE-PERSON-${randomUUID()}`,
      type: "people",
      attributes: { name, company_id: companyId, source: "rahjo-native-bridge", sync_state: "pending_relaticle" }
    };
  }
}
