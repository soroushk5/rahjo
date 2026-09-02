import assert from "node:assert/strict";
import test from "node:test";
import {
  accountMemory,
  demoAccounts,
  demoActions,
  demoApprovals,
  demoAutomationRuns,
  demoCases,
  demoContacts,
  demoDataQuality,
  demoLeads,
  demoOpportunities,
  demoOutcomes,
  demoServiceCapabilities,
  demoTasks,
  demoWorkflows
} from "../src/data/operationalData.js";

test("canonical demo fixtures have stable IDs and required operational coverage", () => {
  assert.ok(demoAccounts.length >= 3);
  assert.ok(demoContacts.length >= 3);
  assert.ok(demoLeads.length >= 3);
  assert.ok(demoOpportunities.length >= 3);
  assert.ok(demoCases.length >= 3);
  assert.ok(demoTasks.length >= 3);
  assert.ok(demoServiceCapabilities.length >= 3);
  assert.ok(demoApprovals.length >= 2);
  assert.ok(demoActions.length >= 2);
  assert.ok(demoOutcomes.length >= 1);
  assert.ok(demoWorkflows.length >= 3);
  assert.ok(demoAutomationRuns.length >= 5);
  assert.ok(demoDataQuality.length >= 4);

  for (const [items, key, prefix] of [
    [demoAccounts, "accountId", "ACC-DEMO-"], [demoContacts, "contactId", "CON-DEMO-"],
    [demoLeads, "leadId", "LEAD-DEMO-"], [demoOpportunities, "opportunityId", "OPP-DEMO-"],
    [demoCases, "caseId", "CASE-DEMO-"], [demoTasks, "taskId", "TASK-DEMO-"],
    [demoServiceCapabilities, "serviceId", "SVC-DEMO-"], [demoApprovals, "approvalId", "APR-DEMO-"],
    [demoActions, "actionId", "ACT-DEMO-"], [demoOutcomes, "outcomeId", "OUT-DEMO-"]
  ]) {
    assert.equal(new Set(items.map((item) => item[key])).size, items.length);
    assert.ok(items.every((item) => String(item[key]).startsWith(prefix)));
  }
});

test("service capability statuses remain within the claim-safe vocabulary", () => {
  const allowed = new Set(["Demo/Synthetic", "Under Review", "Pilot Candidate", "Evidence Required", "Unavailable/TBD"]);
  assert.ok(demoServiceCapabilities.every((item) => allowed.has(item.publicStatus)));
  assert.ok(demoServiceCapabilities.some((item) => item.environmentStatus.includes("degraded")));
});

test("Account 360 uses one identity spine through case, action and outcome", () => {
  const memory = accountMemory("ACC-DEMO-001");
  assert.equal(memory.account.accountId, "ACC-DEMO-001");
  assert.ok(memory.contacts.every((item) => item.accountId === memory.account.accountId));
  assert.ok(memory.cases.every((item) => item.accountId === memory.account.accountId));
  assert.ok(memory.cases.some((item) => item.actionId));
  assert.ok(memory.outcomes.some((item) => item.caseId === "CASE-DEMO-104"));
});

test("automation fixtures cover bounded lifecycle and human approval", () => {
  const states = new Set(demoAutomationRuns.map((item) => item.state));
  for (const state of ["queued", "running", "succeeded", "failed", "canceled"]) assert.ok(states.has(state));
  assert.ok(demoWorkflows.some((item) => item.approval === "Human required"));
  assert.ok(demoActions.every((item) => ["Human", "Sandbox"].includes(item.executionMode)));
});
