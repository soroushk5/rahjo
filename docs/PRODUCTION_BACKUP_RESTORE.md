# CRM Core — Production Backup / Restore Gate

## Current constraint

As of 2026-09-29, the Supabase organization hosting the CRM Core production database is on the Free plan.

The release gate is **not** satisfied by CI-only disposable restores or by the earlier unpause/restore of the existing project. Before the legacy storage namespace is renamed or the project is called production-ready, a fresh backup of the current production CRM data plane must be restored into an independent disposable target and pass the production-style smoke.

## Accepted paths

### A. Supabase managed physical backup / restore

Preferred when the organization is on a paid plan with physical backups.

1. Confirm a fresh managed backup exists.
2. Use Supabase **Restore to a New Project**.
3. Do not point production DNS or applications at the restored project.
4. Run the CRM Core production restore smoke against the disposable restore.
5. Record the backup timestamp, restored project reference, source commit, smoke result, and cleanup receipt.
6. Delete the disposable restore after evidence is captured.

### B. Logical backup in a trusted private environment

Use when managed restore is unavailable.

1. Obtain the database connection string through Supabase's secure Connect/Database Settings UI.
2. Keep the database password in the local secret manager or private CI secret store. Never paste it into chat, Drive, source, logs, or a public repository.
3. Follow Supabase's documented CLI backup flow to dump roles, schema, and data.
4. Store the backup only in approved private encrypted storage. **Never commit a backup to this public GitHub repository.**
5. Restore into an isolated disposable PostgreSQL/Supabase target.
6. Run `server/scripts/production-restore-smoke.mjs`.
7. Record checksums and smoke metadata only; do not put customer data into the receipt.
8. Destroy the disposable restore after verification.

Official reference:
https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## Restore smoke contract

The production-style smoke must prove, on the restored copy:

- the exact non-bypass runtime role is healthy;
- the server-owned public-intake route resolves;
- the restored workspace can read its services through RLS;
- the runtime role can perform a workspace-scoped write;
- RLS/private-route policies exist;
- the Website Intake route exists;
- no production endpoint, DNS record, or live database is mutated by the drill.

The script intentionally derives context from the restored database and does not require a public-intake API token.

## Evidence required to close RAH-W13-014

Capture a receipt containing only:

- source project reference;
- backup type and timestamp;
- backup checksum or managed-backup identifier;
- confirmation that backup storage was encrypted/private;
- disposable restore identifier;
- source Git commit;
- restore-smoke result;
- restore cleanup confirmation.

Do not include passwords, connection strings, PATs, encryption keys, raw backup data, or customer records.

## Gate on legacy-name cutover

Do **not** rename the PostgreSQL `rahjo` schema/roles, GitHub repository slug, or Supabase project identifiers until RAH-W13-014 has a verified fresh production backup/restore receipt. The current names are compatibility identifiers, not product identity.
