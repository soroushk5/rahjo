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
