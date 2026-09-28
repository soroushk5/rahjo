import postgres from "postgres";
import { normalizePersianText } from "../src/normalization.js";

function argumentsMap(values) {
  const result = new Map();
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error("Arguments must use --name value pairs");
    result.set(key.slice(2), value);
  }
  return result;
}

function httpsOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("--origin must be an HTTPS origin without path, query, or fragment");
  }
  return url.origin;
}

const args = argumentsMap(process.argv.slice(2));
const databaseUrl = process.env.CRM_MIGRATION_DATABASE_URL || process.env.RAHJO_MIGRATION_DATABASE_URL;
if (!databaseUrl) throw new Error("CRM_MIGRATION_DATABASE_URL is required");

const slug = args.get("workspace-slug");
if (!slug || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) throw new Error("--workspace-slug is invalid");
const origin = httpsOrigin(args.get("origin") ?? "");
const serviceId = normalizePersianText(args.get("service-id") ?? "SVC-WEBSITE-INTAKE", { max: 120, required: true });
const serviceName = normalizePersianText(args.get("service-name") ?? "Website Intake", { max: 180, required: true });
const displayName = normalizePersianText(args.get("display-name") ?? "CRM Core Website Intake", { max: 160, required: true });
const email = `public-intake+${slug}@crm.invalid`;

const sql = postgres(databaseUrl, { max: 1, connection: { application_name: "crm-core-public-intake-provisioner" } });

try {
  const result = await sql.begin(async (transaction) => {
    const tx = {
      async query(text, parameters = []) {
        const rows = await transaction.unsafe(text, parameters);
        return { rows: Array.from(rows), rowCount: rows.count ?? rows.length };
      }
    };

    const workspace = await tx.query(
      "SELECT id, slug FROM rahjo.workspaces WHERE slug=$1 AND status='active' FOR UPDATE",
      [slug]
    );
    if (!workspace.rowCount) throw new Error("Target workspace does not exist or is not active");
    const workspaceId = workspace.rows[0].id;

    const user = await tx.query(
      `INSERT INTO rahjo.users(email,display_name,status)
       VALUES($1,$2,'active')
       ON CONFLICT(email) DO UPDATE
         SET display_name=excluded.display_name,status='active',updated_at=now()
       RETURNING id`,
      [email, displayName]
    );

    const membership = await tx.query(
      `INSERT INTO rahjo.memberships(workspace_id,user_id,role,status)
       VALUES($1,$2,'intake','active')
       ON CONFLICT(workspace_id,user_id) DO UPDATE
         SET role='intake',status='active',authz_version=rahjo.memberships.authz_version+1,updated_at=now()
       RETURNING id`,
      [workspaceId, user.rows[0].id]
    );

    await tx.query("DELETE FROM rahjo.password_credentials WHERE user_id=$1", [user.rows[0].id]);
    await tx.query(
      `UPDATE rahjo.api_tokens
          SET revoked_at=now()
        WHERE workspace_id=$1
          AND membership_id=$2
          AND revoked_at IS NULL
          AND label='public website intake'`,
      [workspaceId, membership.rows[0].id]
    );

    const service = await tx.query(
      `INSERT INTO rahjo.services
         (workspace_id,public_id,name,description,capability_status,execution_mode)
       VALUES($1,$2,$3,'Server-owned public website intake route for CRM Core','active','human')
       ON CONFLICT(workspace_id,public_id) DO UPDATE
         SET name=excluded.name,
             description=excluded.description,
             capability_status='active',
             execution_mode='human',
             updated_at=now()
       RETURNING id,public_id`,
      [workspaceId, serviceId, serviceName]
    );

    const route = await tx.query(
      `INSERT INTO rahjo.public_intake_routes(origin,workspace_id,membership_id,service_id,enabled)
       VALUES($1,$2,$3,$4,true)
       ON CONFLICT(origin) DO UPDATE
         SET workspace_id=excluded.workspace_id,
             membership_id=excluded.membership_id,
             service_id=excluded.service_id,
             enabled=true,
             updated_at=now()
       RETURNING origin`,
      [origin, workspaceId, membership.rows[0].id, service.rows[0].id]
    );

    return {
      workspaceId,
      membershipId: membership.rows[0].id,
      serviceId: service.rows[0].public_id,
      origin: route.rows[0].origin
    };
  });

  console.log(JSON.stringify({
    status: "provisioned",
    workspaceSlug: slug,
    ...result,
    secretRequired: false
  }));
} finally {
  await sql.end({ timeout: 5 });
}
