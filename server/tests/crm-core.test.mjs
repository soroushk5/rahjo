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
          if (sql.includes("INSERT INTO rahjo.crm_entity_refs")) {
            return { rows: [{ id: "crm-ref-db-id", rahjo_id: "CRM-REF-001" }], rowCount: 1 };
          }
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
  const result = await repository.createContact(owner, {
    name: " سارا محمدی ", accountId: "ACC-UPSTREAM-1", email: " SARA@example.com ",
    phone: "۰۹۱۲۱۲۳۴۵۶۷", identifiers: [{ type: "client_ref", value: " REF-01 " }]
  }, "REQ-CONTACT-1");

  assert.equal(result.id, "CON-UPSTREAM-1");
  assert.equal(result.name, "سارا محمدی");
  assert.equal(result.account_id, "ACC-UPSTREAM-1");
  assert.equal(result.email, "sara@example.com");
  assert.equal(result.phone, "09121234567");
  assert.equal(result.identifiers.find((item) => item.type === "client_ref").normalizedValue, "REF-01");
  assert.ok(queries.some(({ sql, params }) => sql.includes("INSERT INTO rahjo.crm_entity_identifiers") && params.includes("client_ref")));
  assert.ok(queries.some(({ sql, params }) => sql.includes("INSERT INTO rahjo.crm_restricted_raw_values") && params[3]?.email === " SARA@example.com "));
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

test("intake persists raw values separately and never returns or reads the restricted record", async () => {
  const queries = [];
  let sequence = 0;
  const database = {
    async withWorkspace(_context, callback) {
      return callback({
        async query(sql, params = []) {
          queries.push({ sql, params });
          if (sql.includes("SELECT id, public_id, name FROM rahjo.services")) {
            return { rows: [{ id: "service-db-id", public_id: "SVC-001", name: "مشاوره" }], rowCount: 1 };
          }
          if (sql.includes("SELECT status, payload_sha256, response FROM rahjo.intake_requests")) return { rows: [], rowCount: 0 };
          if (sql.includes("INSERT INTO rahjo.intake_requests")) return { rows: [{ id: "intake-db-id" }], rowCount: 1 };
          if (sql.includes("INSERT INTO rahjo.crm_entity_refs")) {
            return { rows: [{ id: "account-ref-db-id", entity_type: "account" }, { id: "contact-ref-db-id", entity_type: "contact" }], rowCount: 2 };
          }
          if (sql.includes("INSERT INTO rahjo.leads")) return { rows: [{ id: "lead-db-id" }], rowCount: 1 };
          if (sql.includes("INSERT INTO rahjo.cases")) return { rows: [{ id: "case-db-id" }], rowCount: 1 };
          if (sql.includes("INSERT INTO rahjo.approvals")) return { rows: [{ id: "approval-db-id" }], rowCount: 1 };
          return { rows: [], rowCount: 1 };
        }
      });
    }
  };
  const relaticle = {
    mode: "native_deferred",
    async createAccount(_workspaceId, { name }) { return { id: "upstream-account", attributes: { name } }; },
    async createContact(_workspaceId, { name, accountId }) { return { id: "upstream-contact", attributes: { name, account_id: accountId } }; }
  };
  const repository = new CrmRepository({ database, relaticle });
  const raw = {
    organization: " شركت يارا ", contactName: "علي", email: " Sales@example.com ",
    phone: "۰۹۱۲ ۱۲۳ ۴۵۶۷", purpose: "درخواست", serviceId: "SVC-001",
    unrelated: "must not be retained"
  };
  const result = await repository.createIntake(
    { ...owner, scopes: ["read", "intake:write"] }, raw, "intake:raw-001", "corr-raw-001"
  );
  const rawInsert = queries.find(({ sql }) => sql.includes("INSERT INTO rahjo.intake_raw_values"));

  assert.ok(rawInsert);
  assert.deepEqual(rawInsert.params[3], {
    organization: " شركت يارا ", contactName: "علي", email: " Sales@example.com ",
    phone: "۰۹۱۲ ۱۲۳ ۴۵۶۷", purpose: "درخواست", serviceId: "SVC-001"
  });
  assert.equal(queries.some(({ sql }) => /SELECT[^;]*FROM rahjo\.intake_raw_values/i.test(sql)), false);
  assert.equal(JSON.stringify(result).includes("Sales@example.com"), false);
  assert.equal(JSON.stringify(result).includes("must not be retained"), false);
});


test("CRM core creates and stages an Opportunity with provider-neutral audit evidence", async () => {
  const { repository, queries } = fixture();
  const created = await repository.createOpportunity(owner, {
    name: "فرصت سازمانی",
    accountId: "ACC-UPSTREAM-1",
    contactId: "CON-UPSTREAM-1",
    stage: "Proposal",
    amount: { value: "۱۲۳٫۴", unit: "تومان" }
  }, "REQ-OPP-1");

  assert.equal(created.id, "OPP-UPSTREAM-1");
  assert.equal(created.stage, "Proposal");
  assert.deepEqual(created.amount, { currency: "IRR", value: "1234" });
  assert.ok(queries.some(({ sql, params }) => sql.includes("INSERT INTO rahjo.crm_entity_contract_values") && params.includes("1234")));
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
    status: "To do",
    deadline: { kind: "date-only", value: "1403/12/30", calendar: "jalali" }
  }, "REQ-TASK-1");

  assert.equal(created.id, "TASK-UPSTREAM-1");
  assert.equal(created.opportunity_id, "OPP-UPSTREAM-1");
  assert.deepEqual(created.deadline, { kind: "date-only", value: "2025-03-20", displayCalendar: "jalali" });
  assert.ok(queries.some(({ sql, params }) => sql.includes("INSERT INTO rahjo.crm_entity_contract_values") && params.includes("date-only")));
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
