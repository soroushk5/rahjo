import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = await readFile(new URL("../migrations/001_w13_foundation.sql", import.meta.url), "utf8");
const identitySql = await readFile(new URL("../migrations/002_w15_identity_lifecycle.sql", import.meta.url), "utf8");
const publicIntakeSql = await readFile(new URL("../migrations/004_public_intake_routing.sql", import.meta.url), "utf8");
const publicIntakeHardeningSql = await readFile(new URL("../migrations/005_public_intake_hardening.sql", import.meta.url), "utf8");
const emailLoginSql = await readFile(new URL("../migrations/006_email_first_login.sql", import.meta.url), "utf8");
const rawInputSql = await readFile(new URL("../migrations/007_w0_005_raw_intake_values.sql", import.meta.url), "utf8");
const crmContractsSql = await readFile(new URL("../migrations/008_crm_contract_values.sql", import.meta.url), "utf8");
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

test("identity lifecycle is invite-only, one-time, session-revoking and RLS protected", () => {
  for (const table of ["member_invitations", "password_reset_tokens", "account_recovery_codes"]) {
    assert.match(identitySql, new RegExp(`CREATE TABLE IF NOT EXISTS rahjo\\.${table}`));
  }
  assert.match(identitySql, /role IN \('admin', 'operator', 'viewer'\)/);
  assert.doesNotMatch(identitySql, /CREATE.*public.*signup/i);
  assert.match(identitySql, /consume_member_invitation/);
  assert.match(identitySql, /consume_password_reset_token/);
  assert.match(identitySql, /consume_account_recovery_code/);
  assert.match(identitySql, /authz_version=authz_version\+1/);
  assert.match(identitySql, /web_sessions s SET revoked_at/);
  assert.match(identitySql, /FORCE ROW LEVEL SECURITY/);
  assert.match(identitySql, /SECURITY DEFINER/);
  assert.match(identitySql, /GRANT EXECUTE ON FUNCTION rahjo\.create_member_invitation/);
});


test("public intake routing is private, exact-origin and only executable by the runtime role", () => {
  assert.match(publicIntakeSql, /CREATE TABLE IF NOT EXISTS rahjo\.public_intake_routes/);
  assert.match(publicIntakeSql, /origin text NOT NULL UNIQUE/);
  assert.match(publicIntakeSql, /FORCE ROW LEVEL SECURITY/);
  assert.match(publicIntakeSql, /SECURITY DEFINER/);
  assert.match(publicIntakeSql, /SET search_path = pg_catalog, rahjo/);
  assert.match(publicIntakeSql, /REVOKE ALL ON FUNCTION rahjo\.resolve_public_intake\(text\) FROM PUBLIC/);
  assert.match(publicIntakeSql, /GRANT EXECUTE ON FUNCTION rahjo\.resolve_public_intake\(text\) TO rahjo_app/);
  assert.doesNotMatch(publicIntakeSql, /api_tokens/);
  assert.match(publicIntakeHardeningSql, /public_intake_routes_membership_idx/);
  assert.match(publicIntakeHardeningSql, /public_intake_routes_service_idx/);
  assert.match(publicIntakeHardeningSql, /public_intake_routes_runtime_deny/);
  assert.match(publicIntakeHardeningSql, /USING \(false\)/);
});


test("email-first login resolves only one active workspace and remains fail-closed for ambiguity", () => {
  assert.match(emailLoginSql, /lookup_password_login_by_email/);
  assert.match(emailLoginSql, /count\(\*\) OVER \(\)/);
  assert.match(emailLoginSql, /candidate_count=1/);
  assert.match(emailLoginSql, /REVOKE ALL ON FUNCTION rahjo\.lookup_password_login_by_email\(text\) FROM PUBLIC/);
  assert.match(emailLoginSql, /GRANT EXECUTE ON FUNCTION rahjo\.lookup_password_login_by_email\(text\) TO rahjo_app/);
  assert.match(emailLoginSql, /consume_account_recovery_code_by_email/);
  assert.match(emailLoginSql, /v_matches <> 1/);
  assert.match(emailLoginSql, /GRANT EXECUTE ON FUNCTION rahjo\.consume_account_recovery_code_by_email\(text,text,text,text\) TO rahjo_app/);
});

test("raw intake values are tenant-scoped, append-only to the runtime role, and worker-readable only", () => {
  assert.match(rawInputSql, /CREATE TABLE IF NOT EXISTS rahjo\.intake_raw_values/);
  assert.match(rawInputSql, /FOREIGN KEY \(workspace_id, intake_request_id\)/);
  assert.match(rawInputSql, /ALTER TABLE rahjo\.intake_raw_values FORCE ROW LEVEL SECURITY/);
  assert.match(rawInputSql, /FOR INSERT TO rahjo_app/);
  assert.match(rawInputSql, /FOR SELECT TO rahjo_worker/);
  assert.match(rawInputSql, /FOR DELETE TO rahjo_worker/);
  assert.match(rawInputSql, /REVOKE ALL ON rahjo\.intake_raw_values FROM PUBLIC, rahjo_app, rahjo_worker/);
  assert.match(rawInputSql, /GRANT INSERT ON rahjo\.intake_raw_values TO rahjo_app/);
  assert.match(rawInputSql, /GRANT SELECT, DELETE ON rahjo\.intake_raw_values TO rahjo_worker/);
  assert.doesNotMatch(rawInputSql, /GRANT SELECT[^;]*rahjo_app/);
  assert.match(repository, /INSERT INTO rahjo\.intake_raw_values/);
  assert.doesNotMatch(repository, /SELECT[^;]*FROM rahjo\.intake_raw_values/i);
});

test("typed CRM contract values and identifiers are tenant-scoped while raw values remain worker-only", () => {
  assert.match(crmContractsSql, /CREATE TABLE IF NOT EXISTS rahjo\.crm_entity_contract_values/);
  assert.match(crmContractsSql, /deadline_kind = 'date-only'.*deadline_date IS NOT NULL AND deadline_at IS NULL/s);
  assert.match(crmContractsSql, /deadline_kind = 'instant'.*deadline_date IS NULL AND deadline_at IS NOT NULL/s);
  assert.match(crmContractsSql, /money_amount_irr numeric,/);
  assert.match(crmContractsSql, /money_amount_irr = trunc\(money_amount_irr\)/);
  assert.match(crmContractsSql, /CREATE TABLE IF NOT EXISTS rahjo\.crm_entity_identifiers/);
  assert.match(crmContractsSql, /UNIQUE \(workspace_id, entity_ref_id, identifier_type, normalized_value\)/);
  assert.match(crmContractsSql, /CREATE UNIQUE INDEX IF NOT EXISTS crm_entity_identifiers_workspace_unique_idx[\s\S]*WHERE unique_scope = 'workspace'/);
  assert.match(crmContractsSql, /CREATE TABLE IF NOT EXISTS rahjo\.crm_restricted_raw_values/);
  assert.match(crmContractsSql, /duplicate_candidates_one_target[\s\S]*candidate_import_batch_id = source_import_batch_id/);
  assert.match(crmContractsSql, /duplicate_candidates_source_import_row_fkey[\s\S]*FOREIGN KEY \(workspace_id, source_import_batch_id, import_row_id\)/);
  assert.match(crmContractsSql, /duplicate_candidates_import_row_fkey[\s\S]*REFERENCES rahjo\.import_rows\(workspace_id, batch_id, id\)/);
  assert.match(crmContractsSql, /ALTER TABLE rahjo\.crm_entity_contract_values FORCE ROW LEVEL SECURITY/);
  assert.match(crmContractsSql, /ALTER TABLE rahjo\.crm_entity_identifiers FORCE ROW LEVEL SECURITY/);
  assert.match(crmContractsSql, /ALTER TABLE rahjo\.crm_restricted_raw_values FORCE ROW LEVEL SECURITY/);
  assert.match(crmContractsSql, /GRANT SELECT, INSERT, UPDATE ON rahjo\.crm_entity_contract_values,/);
  assert.match(crmContractsSql, /GRANT INSERT ON rahjo\.crm_restricted_raw_values TO rahjo_app/);
  assert.match(crmContractsSql, /GRANT SELECT, DELETE ON rahjo\.crm_restricted_raw_values TO rahjo_worker/);
  assert.doesNotMatch(crmContractsSql, /GRANT SELECT[^;]*crm_restricted_raw_values TO rahjo_app/);
});
