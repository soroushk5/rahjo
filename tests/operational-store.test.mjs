import assert from "node:assert/strict";
import test from "node:test";
import {
  OPERATIONAL_STATE_KEY,
  OPERATIONAL_STATE_VERSION,
  accountMemory,
  approveOrReject,
  caseContext,
  createCase,
  createHandoffTask,
  dashboardQueue,
  getOperationalState,
  logFollowup,
  qualifyLead,
  recordOutcome,
  resetOperationalState,
  searchIndex,
  startOrRetryRun,
  updateDataQualityIssue
} from "../src/services/operationalStore.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

globalThis.window = { localStorage: memoryStorage() };

test("operational repository is versioned, persistent and exactly resettable", () => {
  const seed = resetOperationalState();
  assert.equal(seed.version, OPERATIONAL_STATE_VERSION);
  assert.equal(seed.revision, 0);
  assert.equal(getOperationalState().cases.length, 5);

  logFollowup({ accountId: "ACC-DEMO-001", caseId: "CASE-DEMO-101", title: "تماس پیگیری قرارداد", owner: "مهدی احمدی" });
  const persisted = JSON.parse(window.localStorage.getItem(OPERATIONAL_STATE_KEY));
  assert.equal(persisted.tasks[0].title, "تماس پیگیری قرارداد");
  assert.equal(persisted.interactions[0].sourceRef, persisted.tasks[0].taskId);
  assert.match(persisted.auditEvents[0].state, /Not recorded → Open/);

  const restored = resetOperationalState();
  assert.equal(restored.revision, 0);
  assert.equal(restored.tasks.some((item) => item.taskId.startsWith("TASK-LOCAL")), false);
  assert.equal(window.localStorage.getItem(OPERATIONAL_STATE_KEY), null);
});

test("all P0 mutations create linked entities and auditable transitions", () => {
  resetOperationalState();
  qualifyLead({ leadId: "LEAD-DEMO-002" });
  assert.equal(getOperationalState().leads.find((item) => item.leadId === "LEAD-DEMO-002").status, "Qualified");

  const handoff = createHandoffTask({ opportunityId: "OPP-DEMO-002" });
  assert.ok(accountMemory("ACC-DEMO-002").tasks.some((item) => item.taskId === handoff.taskId));
  assert.ok(dashboardQueue().some((item) => item.id === handoff.taskId));

  const created = createCase({ accountId: "ACC-DEMO-002", serviceId: "SVC-DEMO-003", purpose: "پایلوت پیگیری محلی", owner: "سارا نوری" });
  const createdContext = caseContext(created.caseId);
  assert.equal(createdContext.case.status, "Waiting/Approval");
  assert.equal(createdContext.approval.status, "Requested");
  assert.ok(accountMemory("ACC-DEMO-002").cases.some((item) => item.caseId === created.caseId));
  assert.ok(searchIndex().some((item) => item.id === created.caseId));

  approveOrReject({ caseId: created.caseId, decision: "Approved", actor: "سارا نوری" });
  assert.equal(caseContext(created.caseId).approval.status, "Approved");
  const run = startOrRetryRun({ caseId: created.caseId });
  assert.equal(caseContext(created.caseId).runs[0].receipt, run.receiptId);
  assert.equal(caseContext(created.caseId).runs[0].state, "succeeded");

  const retry = startOrRetryRun({ runId: "RUN-DEMO-004", mode: "retry" });
  assert.equal(getOperationalState().runs.find((item) => item.runId === retry.runId).state, "queued");
  assert.ok(getOperationalState().auditEvents.some((item) => item.entityId === retry.runId && item.change.includes(retry.receiptId)));

  const outcome = recordOutcome({ caseId: created.caseId, reason: "نتیجه محلی ثبت شد" });
  assert.equal(caseContext(created.caseId).case.status, "Resolved");
  assert.equal(caseContext(created.caseId).outcome.outcomeId, outcome.outcomeId);
  assert.ok(accountMemory("ACC-DEMO-002").outcomes.some((item) => item.outcomeId === outcome.outcomeId));

  for (const event of getOperationalState().auditEvents.filter((item) => item.eventId.startsWith("EVT-LOCAL"))) {
    assert.ok(event.actor);
    assert.ok(event.source);
    assert.ok(event.time);
    assert.match(event.state, /→/);
  }
});

test("data quality lifecycle is local, reversible and audited", () => {
  resetOperationalState();
  updateDataQualityIssue({ issueId: "DQ-DEMO-001", state: "Reviewing" });
  updateDataQualityIssue({ issueId: "DQ-DEMO-001", state: "Resolved" });
  const state = getOperationalState();
  assert.equal(state.dataQuality.find((item) => item.issueId === "DQ-DEMO-001").state, "Resolved");
  assert.equal(state.auditEvents.filter((item) => item.entityId === "DQ-DEMO-001").length, 2);
});
