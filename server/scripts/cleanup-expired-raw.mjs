import postgres from "postgres";

const workspaceId = process.argv[2];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidPattern.test(workspaceId ?? "")) {
  console.error("Usage: npm run cleanup:expired-raw -- <workspace-uuid>");
  process.exit(2);
}

const connectionString = process.env.CRM_MAINTENANCE_DATABASE_URL;
if (!connectionString) {
  console.error("CRM_MAINTENANCE_DATABASE_URL is required");
  process.exit(2);
}

const sql = postgres(connectionString, { max: 1, idle_timeout: 5 });
let intakeDeleted = 0;
let crmDeleted = 0;
try {
  for (;;) {
    const [counts] = await sql.begin(async (tx) => {
      await tx`SET LOCAL ROLE rahjo_worker`;
      await tx`SELECT set_config('rahjo.workspace_id', ${workspaceId}, true)`;
      return tx`SELECT * FROM rahjo.cleanup_expired_raw_values(${workspaceId}::uuid, 1000)`;
    });
    intakeDeleted += counts.intake_deleted;
    crmDeleted += counts.crm_deleted;
    if (counts.intake_deleted === 0 && counts.crm_deleted === 0) break;
  }
  console.log(JSON.stringify({ completed: true, intakeDeleted, crmDeleted }));
} catch (error) {
  const code = typeof error?.code === "string" && /^\d{5}$/.test(error.code) ? error.code : "unknown";
  console.error(`raw-retention cleanup failed (${code})`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
