import assert from "node:assert/strict";
import test from "node:test";
import { NativeDeferredCrmClient } from "../src/nativeDeferredCrmClient.js";

test("native deferred bridge is explicit and marks records for later Relaticle sync", async () => {
  const client = new NativeDeferredCrmClient();
  assert.equal(client.mode, "native_deferred");
  const company = await client.createCompany("workspace-a", { name: "شرکت رهجو" });
  const person = await client.createPerson("workspace-a", { name: "کاربر رهجو", companyId: company.id });
  assert.match(company.id, /^NATIVE-COMPANY-/);
  assert.match(person.id, /^NATIVE-PERSON-/);
  assert.equal(company.attributes.sync_state, "pending_relaticle");
  assert.equal(person.attributes.company_id, company.id);
  assert.deepEqual(await client.list(), []);
});
