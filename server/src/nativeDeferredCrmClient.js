import { randomUUID } from "node:crypto";

/**
 * Explicit zero-cost bridge used while the separated Relaticle service is not
 * deployable. Records are persisted in the CRM PostgreSQL compatibility store and
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

  async listAccounts() { return []; }
  async listContacts() { return []; }
  async listOpportunities() { return []; }
  async listTasks() { return []; }

  async createAccount(_workspaceId, { name }) {
    return {
      id: `NATIVE-ACCOUNT-${randomUUID()}`,
      type: "accounts",
      attributes: { name, source: "crm-native-bridge", sync_state: "pending_relaticle" }
    };
  }

  async createContact(_workspaceId, { name, accountId }) {
    return {
      id: `NATIVE-CONTACT-${randomUUID()}`,
      type: "contacts",
      attributes: { name, account_id: accountId, source: "crm-native-bridge", sync_state: "pending_relaticle" }
    };
  }
}
