import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/features/operations/serverOperationalPages.js", import.meta.url), "utf8");

test("server CRM workspace is Account Opportunity Task Activity first", () => {
  for (const label of ["Account 360", "Opportunity pipeline", "Task / Follow-up", "Activity timeline"]) {
    assert.ok(source.includes(label), `missing CRM label: ${label}`);
  }
  assert.match(source, /if \(path === "\/tasks"\) return renderTasks\(\)/);
  assert.doesNotMatch(source, /Task مستقل پس از اتصال Relaticle فعال خواهد شد/);
  assert.doesNotMatch(source, /JSON\.stringify\(opportunities/);
});

test("standard CRM workspace writes only through server command routes", () => {
  for (const route of ["/api/v1/opportunities", "/api/v1/tasks", "/api/v1/interactions"]) {
    assert.ok(source.includes(route), `missing server route: ${route}`);
  }
  assert.ok(source.includes("/status"));
  assert.match(source, /data-task-status="Done"/);
});

test("Account 360 links commercial memory instead of only workflow cases", () => {
  assert.match(source, /linkedToAccount/);
  assert.match(source, /linkedToContact/);
  assert.match(source, /linkedToOpportunity/);
  assert.match(source, /list\("opportunities"\)/);
  assert.match(source, /list\("tasks"\)/);
  assert.match(source, /list\("interactions"\)/);
});
