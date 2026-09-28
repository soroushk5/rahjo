import assert from "node:assert/strict";
import test from "node:test";
import { NativeDeferredCrmClient } from "../src/nativeDeferredCrmClient.js";

test("native deferred bridge is explicit and marks standard CRM records for later Relaticle sync", async () => {
  const client = new NativeDeferredCrmClient();
  assert.equal(client.mode, "native_deferred");

  const account = await client.createAccount("workspace-a", { name: "شرکت نمونه" });
  const contact = await client.createContact("workspace-a", { name: "کاربر نمونه", accountId: account.id });
  const opportunity = await client.createOpportunity("workspace-a", {
    name: "فرصت نمونه",
    accountId: account.id,
    contactId: contact.id,
    stage: "Proposal"
  });
  const task = await client.createTask("workspace-a", {
    title: "پیگیری پیشنهاد",
    accountId: account.id,
    contactId: contact.id,
    opportunityId: opportunity.id,
    status: "To do"
  });
  const interaction = await client.createInteraction("workspace-a", {
    title: "تماس اولیه",
    body: "خلاصه تماس",
    accountId: account.id,
    contactId: contact.id,
    opportunityId: opportunity.id
  });

  assert.match(account.id, /^NATIVE-ACCOUNT-/);
  assert.match(contact.id, /^NATIVE-CONTACT-/);
  assert.match(opportunity.id, /^NATIVE-OPPORTUNITY-/);
  assert.match(task.id, /^NATIVE-TASK-/);
  assert.match(interaction.id, /^NATIVE-INTERACTION-/);
  assert.equal(account.attributes.sync_state, "pending_relaticle");
  assert.equal(contact.attributes.account_id, account.id);
  assert.equal(opportunity.attributes.stage, "Proposal");
  assert.equal(task.attributes.opportunity_id, opportunity.id);
  assert.equal(interaction.attributes.body, "خلاصه تماس");

  const staged = await client.updateOpportunityStage("workspace-a", opportunity.id, { stage: "Negotiation" });
  const completed = await client.updateTaskStatus("workspace-a", task.id, { status: "Done" });
  assert.equal(staged.attributes.stage, "Negotiation");
  assert.equal(completed.attributes.status, "Done");

  assert.deepEqual(await client.listAccounts(), []);
  assert.deepEqual(await client.listInteractions(), []);
});
