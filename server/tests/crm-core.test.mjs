import assert from "node:assert/strict";
import test from "node:test";
import { CrmRepository } from "../src/repository.js";

const owner = Object.freeze({
  workspace_id: "11111111-1111-4111-8111-111111111111",
  membership_id: "22222222-2222-4222-8222-222222222222",
  role: "owner",
  scopes: ["read", "crm:write"]
});

function fixture() {
  const queries = [];
  const database = {
    async withWorkspace(_context, callback) {
      return callback({
        async query(sql, params = []) {
          queries.push({ sql, params });
          return { rows: [], rowCount: 1 };
        }
      });
    }
  };
  const provider = {
    mode: "native_deferred",
    async createAccount(_workspaceId, { name }) {
      return { id: "ACC-UPSTREAM-1", type: "accounts", attributes: { name } };
    },
    async createContact(_workspaceId, { name, accountId }) {
      return { id: "CON-UPSTREAM-1", type: "contacts", attributes: { name, account_id: accountId } };
    },
    async createOpportunity(_workspaceId, { name, accountId, contactId, stage }) {
      return { id: "OPP-UPSTREAM-1", type: "opportunities", attributes: { name, account_id: accountId, contact_id: contactId, stage } };
    },
    async updateOpportunityStage(_workspaceId, id, { stage }) {
      return { id, type: "opportunities", attributes: { stage } };
    },
    async createTask(_workspaceId, { title, accountId, contactId, opportunityId, status }) {
      return { id: "TASK-UPSTREAM-1", type: "tasks", attributes: { title, account_id: accountId, contact_id: contactId, opportunity_id: opportunityId, status } };
    },
    async updateTaskStatus(_workspaceId, id, { status }) {
      return { id, type: "tasks", attributes: { status } };
    },
    async createInteraction(_workspaceId, { title, body, accountId, contactId, opportunityId }) {
      return { id: "INT-UPSTREAM-1", type: "interactions", attributes: { title, body, account_id: accountId, contact_id: contactId, opportunity_id: opportunityId } };
    }
  };
  return { repository: new CrmRepository({ database, relaticle: provider }), queries };
}

test("CRM core creates an Account through the provider-neutral adapter and audits it", async () => {
  const { repository, queries } = fixture();
  const result = await repository.createAccount(owner, { name: "شرکت نمونه" }, "REQ-ACCOUNT-1");

  assert.equal(result.id, "ACC-UPSTREAM-1");
  assert.equal(result.name, "شرکت نمونه");
  assert.equal(result.source, "crm-native-bridge");
  assert.ok(queries.some(({ sql }) => sql.includes("crm_entity_refs")));
  assert.ok(queries.some(({ sql, params }) => sql.includes("audit_events") && params.includes("crm.account.created")));
});

test("CRM core creates a Contact attached to an Account and audits it", async () => {
  const { repository, queries } = fixture();
  const result = await repository.createContact(owner, { name: "سارا محمدی", accountId: "ACC-UPSTREAM-1" }, "REQ-CONTACT-1");

  assert.equal(result.id, "CON-UPSTREAM-1");
  assert.equal(result.name, "سارا محمدی");
  assert.equal(result.account_id, "ACC-UPSTREAM-1");
  assert.ok(queries.some(({ sql }) => sql.includes("crm_entity_refs")));
  assert.ok(queries.some(({ sql, params }) => sql.includes("audit_events") && params.includes("crm.contact.created")));
});

test("CRM write operations fail closed without crm:write", async () => {
  const { repository } = fixture();
  const viewer = { ...owner, role: "viewer", scopes: ["read"] };
  await assert.rejects(
    () => repository.createAccount(viewer, { name: "شرکت نمونه" }, "REQ-DENIED"),
    (error) => error?.status === 403
  );
});


test("CRM core creates and stages an Opportunity with provider-neutral audit evidence", async () => {
  const { repository, queries } = fixture();
  const created = await repository.createOpportunity(owner, {
    name: "فرصت سازمانی",
    accountId: "ACC-UPSTREAM-1",
    contactId: "CON-UPSTREAM-1",
    stage: "Proposal"
  }, "REQ-OPP-1");

  assert.equal(created.id, "OPP-UPSTREAM-1");
  assert.equal(created.stage, "Proposal");
  assert.ok(queries.some(({ sql, params }) => sql.includes("crm_entity_refs") && params.includes("opportunity")));
  assert.ok(queries.some(({ sql, params }) => sql.includes("audit_events") && params.includes("crm.opportunity.created")));

  const updated = await repository.updateOpportunityStage(owner, created.id, { stage: "Negotiation" }, "REQ-OPP-2");
  assert.equal(updated.stage, "Negotiation");
  assert.ok(queries.some(({ sql, params }) => sql.includes("audit_events") && params.includes("crm.opportunity.stage_changed")));
});

test("CRM core creates and updates a Task linked to the commercial graph", async () => {
  const { repository, queries } = fixture();
  const created = await repository.createTask(owner, {
    title: "پیگیری پیشنهاد",
    accountId: "ACC-UPSTREAM-1",
    contactId: "CON-UPSTREAM-1",
    opportunityId: "OPP-UPSTREAM-1",
    status: "To do"
  }, "REQ-TASK-1");

  assert.equal(created.id, "TASK-UPSTREAM-1");
  assert.equal(created.opportunity_id, "OPP-UPSTREAM-1");
  const updated = await repository.updateTaskStatus(owner, created.id, { status: "Done" }, "REQ-TASK-2");
  assert.equal(updated.status, "Done");
  assert.ok(queries.some(({ sql, params }) => sql.includes("audit_events") && params.includes("crm.task.created")));
  assert.ok(queries.some(({ sql, params }) => sql.includes("audit_events") && params.includes("crm.task.status_changed")));
});

test("CRM core appends an Interaction only when it is linked to CRM context", async () => {
  const { repository, queries } = fixture();
  const interaction = await repository.appendInteraction(owner, {
    title: "تماس پیگیری",
    body: "درخواست نسخه جدید پیشنهاد",
    opportunityId: "OPP-UPSTREAM-1"
  }, "REQ-INT-1");

  assert.equal(interaction.id, "INT-UPSTREAM-1");
  assert.equal(interaction.opportunity_id, "OPP-UPSTREAM-1");
  assert.ok(queries.some(({ sql, params }) => sql.includes("audit_events") && params.includes("crm.interaction.created")));

  await assert.rejects(
    () => repository.appendInteraction(owner, { title: "یادداشت بدون زمینه" }, "REQ-INT-2"),
    (error) => error?.status === 422
  );
});
