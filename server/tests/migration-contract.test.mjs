import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = await readFile(new URL("../migrations/001_w13_foundation.sql", import.meta.url), "utf8");
const migrator = await readFile(new URL("../scripts/migrate.mjs", import.meta.url), "utf8");
const database = await readFile(new URL("../src/database.js", import.meta.url), "utf8");
const repository = await readFile(new URL("../src/repository.js", import.meta.url), "utf8");

test("migration contains every first-class Rahjo operational concept", () => {
  for (const table of [
    "leads", "services", "service_capabilities", "cases", "approvals", "actions",
    "action_runs", "execution_receipts", "outcomes", "document_metadata", "source_provenance"
  ]) assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS rahjo\\.${table}`));
});

test("tenant tables use forced restrictive RLS and cross-workspace composite foreign keys", () => {
  assert.match(sql, /FORCE ROW LEVEL SECURITY/);
  assert.match(sql, /AS RESTRICTIVE FOR ALL TO rahjo_app, rahjo_worker/);
  assert.match(sql, /AS PERMISSIVE FOR ALL TO rahjo_app, rahjo_worker/);
  assert.match(sql, /USING \(true\) WITH CHECK \(true\)/);
  assert.match(sql, /FOREIGN KEY \(workspace_id, case_id\) REFERENCES rahjo\.cases\(workspace_id, id\)/);
  assert.match(sql, /FOREIGN KEY \(workspace_id, service_id\) REFERENCES rahjo\.services\(workspace_id, id\)/);
  assert.match(migrator, /NOBYPASSRLS/);
  assert.match(database, /state\.role !== "rahjo_app" \|\| state\.rolsuper \|\| state\.rolbypassrls/);
  assert.equal((repository.match(/WHERE [a-z_]+\.workspace_id=\$1|WHERE workspace_id=\$1/g) ?? []).length >= 10, true);
});

test("approval gate and evidence immutability are database-enforced", () => {
  assert.match(sql, /approved human gate required/);
  assert.match(sql, /actions_require_approved_gate/);
  assert.match(sql, /execution_receipts_immutable/);
  assert.match(sql, /audit_events_immutable/);
  assert.match(sql, /actions_one_active_per_case_kind/);
  assert.match(sql, /FOREIGN KEY \(workspace_id, run_id, action_id\) REFERENCES rahjo\.action_runs\(workspace_id, id, action_id\)/);
  assert.match(sql, /FOREIGN KEY \(workspace_id, action_id, case_id\) REFERENCES rahjo\.actions\(workspace_id, id, case_id\)/);
  assert.match(sql, /FOREIGN KEY \(workspace_id, receipt_id, action_id\) REFERENCES rahjo\.execution_receipts\(workspace_id, id, action_id\)/);
  assert.match(sql, /FOREIGN KEY \(workspace_id, token_id\) REFERENCES rahjo\.api_tokens\(workspace_id, id\)/);
});
