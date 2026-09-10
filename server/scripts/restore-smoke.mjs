import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { Database } from "../src/database.js";
import { tokenDigest, verifyPassword } from "../src/security.js";

const adminUrl = process.env.RAHJO_RESTORE_ADMIN_DATABASE_URL;
const runtimeUrl = process.env.RAHJO_RESTORE_RUNTIME_DATABASE_URL;
const pepper = process.env.RAHJO_TOKEN_PEPPER;
const apiToken = process.env.RAHJO_RESTORE_TEST_TOKEN;
if (!adminUrl || !runtimeUrl || !pepper || !apiToken) throw new Error("Restore smoke environment is incomplete");

const admin = postgres(adminUrl, { max: 1 });
const database = new Database(runtimeUrl);
try {
  const context = await database.authenticate(tokenDigest(apiToken, pepper));
  if (!context) throw new Error("Restored API authentication failed");
  const credential = await database.lookupPassword("test-alpha", "alpha@example.test");
  if (!credential || !verifyPassword("restore smoke password value", credential.password_salt, credential.password_hash)) {
    throw new Error("Restored password login failed");
  }
  const result = await database.withWorkspace(context, async (client) => {
    const services = await client.query("SELECT public_id FROM rahjo.services ORDER BY public_id");
    await client.query(
      `INSERT INTO rahjo.outbox_events(workspace_id,event_type,aggregate_type,aggregate_id,payload)
       VALUES($1,'restore.smoke','restore',$2,$3)`,
      [context.workspace_id, randomUUID(), { restored: true }]
    );
    const jobs = await client.query("SELECT count(*)::integer AS count FROM rahjo.outbox_events WHERE event_type='restore.smoke'");
    return { services: services.rows.map((row) => row.public_id), jobs: jobs.rows[0].count };
  });
  const policyCount = await admin`SELECT count(*)::integer AS count FROM pg_policies WHERE schemaname='rahjo' AND policyname='workspace_isolation'`;
  if (!result.services.includes("SVC-ALPHA") || result.jobs < 1 || policyCount[0].count < 1) throw new Error("Restore read/write/job/RLS smoke failed");
  console.log(JSON.stringify({ status: "pass", login: true, read: true, write: true, job: true, rlsPolicies: policyCount[0].count }));
} finally {
  await database.close();
  await admin.end({ timeout: 5 });
}
