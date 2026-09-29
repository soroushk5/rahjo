import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { Database } from "../src/database.js";

const adminUrl = process.env.CRM_RESTORE_ADMIN_DATABASE_URL;
const runtimeUrl = process.env.CRM_RESTORE_RUNTIME_DATABASE_URL;
const publicOrigin = process.env.CRM_RESTORE_PUBLIC_ORIGIN;

if (!adminUrl || !runtimeUrl || !publicOrigin) {
  throw new Error("Production restore smoke environment is incomplete");
}

const admin = postgres(adminUrl, { max: 1 });
const database = new Database(runtimeUrl);

try {
  const readiness = await database.ready();
  const context = await database.resolvePublicIntake(publicOrigin);
  if (!context || context.role !== "intake" || !context.scopes?.includes("intake:write")) {
    throw new Error("Restored public-intake routing failed");
  }

  const smokeId = randomUUID();
  const result = await database.withWorkspace(context, async (client) => {
    const services = await client.query(
      "SELECT public_id FROM rahjo.services WHERE workspace_id=$1 ORDER BY public_id",
      [context.workspace_id]
    );
    const leadCount = await client.query(
      "SELECT count(*)::integer AS count FROM rahjo.leads WHERE workspace_id=$1",
      [context.workspace_id]
    );
    await client.query(
      `INSERT INTO rahjo.outbox_events(workspace_id,event_type,aggregate_type,aggregate_id,payload)
       VALUES($1,'restore.production_smoke','restore',$2,$3)`,
      [context.workspace_id, smokeId, { restored: true, source: "production-backup-proof" }]
    );
    const writeCheck = await client.query(
      "SELECT count(*)::integer AS count FROM rahjo.outbox_events WHERE workspace_id=$1 AND event_type='restore.production_smoke' AND aggregate_id=$2",
      [context.workspace_id, smokeId]
    );
    return {
      services: services.rows.map((row) => row.public_id),
      leadCount: leadCount.rows[0]?.count ?? 0,
      writeCount: writeCheck.rows[0]?.count ?? 0
    };
  });

  const policyCount = await admin`
    SELECT count(*)::integer AS count
      FROM pg_policies
     WHERE schemaname='rahjo'
       AND (policyname='workspace_isolation' OR policyname='public_intake_routes_runtime_deny')
  `;
  const routeCount = await admin`
    SELECT count(*)::integer AS count
      FROM rahjo.public_intake_routes
     WHERE enabled=true
  `;

  if (!result.services.includes("SVC-WEBSITE-INTAKE")
      || result.writeCount !== 1
      || policyCount[0].count < 2
      || routeCount[0].count < 1) {
    throw new Error("Production restore read/write/RLS/public-intake smoke failed");
  }

  console.log(JSON.stringify({
    status: "pass",
    runtimeRole: readiness.role,
    publicIntake: true,
    workspaceSlug: context.workspace_slug,
    serviceId: "SVC-WEBSITE-INTAKE",
    read: true,
    leadCount: result.leadCount,
    write: true,
    rlsPolicyCount: policyCount[0].count,
    routeCount: routeCount[0].count
  }));
} finally {
  await database.close();
  await admin.end({ timeout: 5 });
}
