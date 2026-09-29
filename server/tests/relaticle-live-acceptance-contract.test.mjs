import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const script = await readFile(new URL("../scripts/relaticle-live-acceptance.mjs", import.meta.url), "utf8");

test("live Relaticle acceptance is explicit, two-workspace and secret-safe", () => {
  assert.match(script, /CRM_RELATICLE_ACCEPTANCE_ACK/);
  assert.match(script, /workspaceTokens\.size !== 2/);
  assert.match(script, /verifyAuthentication/);
  assert.match(script, /verifyTeamIdentity/);
  assert.match(script, /createAccount/);
  assert.match(script, /createContact/);
  assert.match(script, /createOpportunity/);
  assert.match(script, /createTask/);
  assert.match(script, /createInteraction/);
  assert.match(script, /updateOpportunityStage/);
  assert.match(script, /updateTaskStatus/);
  assert.match(script, /crossWorkspaceIsolation/);
  assert.match(script, /secretPrinted: false/);
  assert.match(script, /customerDataUsed: false/);
  assert.doesNotMatch(script, /console\.log\([^\n]*(?:token|workspaceTokens)/i);
});

test("live Relaticle acceptance does not invent stage or task status values", () => {
  for (const variable of [
    "CRM_RELATICLE_ACCEPTANCE_STAGE_INITIAL",
    "CRM_RELATICLE_ACCEPTANCE_STAGE_UPDATED",
    "CRM_RELATICLE_ACCEPTANCE_TASK_INITIAL",
    "CRM_RELATICLE_ACCEPTANCE_TASK_UPDATED"
  ]) assert.match(script, new RegExp(variable));
});
