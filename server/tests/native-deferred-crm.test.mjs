import assert from "node:assert/strict";
import test from "node:test";
import { NativeDeferredCrmClient } from "../src/nativeDeferredCrmClient.js";

test("native deferred bridge is explicit and marks records for later Relaticle sync", async () => {
  const client = new NativeDeferredCrmClient();
  assert.equal(client.mode, "native_deferred");
  const account = await client.createAccount("workspace-a", { name: "شرکت نمونه" });
  const person = await client.createContact("workspace-a", { name: "کاربر نمونه", accountId: account.id });
  assert.match(account.id, /^NATIVE-ACCOUNT-/);
  assert.match(person.id, /^NATIVE-CONTACT-/);
  assert.equal(account.attributes.sync_state, "pending_relaticle");
  assert.equal(person.attributes.account_id, account.id);
  assert.deepEqual(await client.listAccounts(), []);
});
