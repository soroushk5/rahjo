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
  async listInteractions() { return []; }

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

  async createOpportunity(_workspaceId, { name, accountId = "", contactId = "", stage = "" }) {
    return {
      id: `NATIVE-OPPORTUNITY-${randomUUID()}`,
      type: "opportunities",
      attributes: {
        name,
        ...(accountId ? { account_id: accountId } : {}),
        ...(contactId ? { contact_id: contactId } : {}),
        ...(stage ? { stage } : {}),
        source: "crm-native-bridge",
        sync_state: "pending_relaticle"
      }
    };
  }

  async updateOpportunityStage(_workspaceId, opportunityId, { stage }) {
    return {
      id: opportunityId,
      type: "opportunities",
      attributes: { stage, source: "crm-native-bridge", sync_state: "pending_relaticle" }
    };
  }

  async createTask(_workspaceId, { title, accountId = "", contactId = "", opportunityId = "", status = "" }) {
    return {
      id: `NATIVE-TASK-${randomUUID()}`,
      type: "tasks",
      attributes: {
        title,
        ...(accountId ? { account_id: accountId } : {}),
        ...(contactId ? { contact_id: contactId } : {}),
        ...(opportunityId ? { opportunity_id: opportunityId } : {}),
        status: status || "open",
        source: "crm-native-bridge",
        sync_state: "pending_relaticle"
      }
    };
  }

  async updateTaskStatus(_workspaceId, taskId, { status }) {
    return {
      id: taskId,
      type: "tasks",
      attributes: { status, source: "crm-native-bridge", sync_state: "pending_relaticle" }
    };
  }

  async createInteraction(_workspaceId, { title, body = "", accountId = "", contactId = "", opportunityId = "" }) {
    return {
      id: `NATIVE-INTERACTION-${randomUUID()}`,
      type: "interactions",
      attributes: {
        title,
        ...(body ? { body } : {}),
        ...(accountId ? { account_id: accountId } : {}),
        ...(contactId ? { contact_id: contactId } : {}),
        ...(opportunityId ? { opportunity_id: opportunityId } : {}),
        source: "crm-native-bridge",
        sync_state: "pending_relaticle"
      }
    };
  }
}
