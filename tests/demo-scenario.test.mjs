import test from "node:test";
import assert from "node:assert/strict";
import {
  demoAction,
  demoHero,
  getDemoScenario,
  presenterAction,
  presenterNext,
  resetDemoScenario,
  startDemoScenario
} from "../src/services/demoScenarioStore.js";
import { accountMemory, caseContext } from "../src/services/operationalStore.js";

test("golden demo starts from deterministic synthetic seed", () => {
  const reset = resetDemoScenario();
  assert.equal(reset.started, false);
  assert.equal(reset.approvalStatus, "Requested");
  assert.equal(reset.actionStatus, "queued");
  assert.equal(reset.outcomeStatus, "Pending");
  assert.equal(demoHero.accountId, "ACC-DEMO-001");

  const started = startDemoScenario();
  assert.equal(started.started, true);
  assert.equal(started.currentStep, 0);
  assert.match(started.lastEvent, /Dashboard/);
});

test("golden demo enforces human approval before deterministic execution", () => {
  resetDemoScenario();
  startDemoScenario();
  const blocked = demoAction("execute");
  assert.equal(blocked.actionStatus, "queued");

  demoAction("followup");
  demoAction("qualify");
  assert.ok(accountMemory(demoHero.accountId).tasks.some((item) => item.taskId.startsWith("TASK-LOCAL")));
  demoAction("case");
  const approved = demoAction("approve");
  assert.equal(approved.approvalStatus, "Approved");

  const executed = demoAction("execute");
  assert.equal(executed.actionStatus, "succeeded");
  assert.equal(executed.receiptStatus, "Verified / Demo");
  assert.ok(caseContext(demoHero.caseId).runs.some((item) => item.runId.startsWith("RUN-LOCAL") && item.state === "succeeded"));
});

test("golden demo closes outcome loop and reset restores exact presentation state", () => {
  resetDemoScenario();
  startDemoScenario();
  for (const action of ["followup", "qualify", "case", "approve", "execute", "outcome"]) demoAction(action);
  const complete = getDemoScenario();
  assert.equal(complete.completed, true);
  assert.equal(complete.currentStep, 6);
  assert.equal(complete.outcomeStatus, "Recorded");
  assert.equal(presenterNext("/crm", complete).path, "/dashboard");
  assert.equal(presenterAction("/crm", complete), null);
  assert.equal(caseContext(demoHero.caseId).case.status, "Resolved");
  assert.ok(accountMemory(demoHero.accountId).outcomes.some((item) => item.outcomeId.startsWith("OUT-LOCAL")));

  const reset = resetDemoScenario();
  assert.deepEqual(reset, getDemoScenario());
  assert.equal(reset.eventCount, 1);
  assert.equal(reset.completed, false);
});
