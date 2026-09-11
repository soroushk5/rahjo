import postgres from "postgres";
import { opaqueToken, tokenDigest } from "../src/security.js";
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

const args = argumentsMap(process.argv.slice(2));
const databaseUrl = process.env.RAHJO_MIGRATION_DATABASE_URL;
const pepper = process.env.RAHJO_TOKEN_PEPPER;
if (!databaseUrl) throw new Error("RAHJO_MIGRATION_DATABASE_URL is required");
if (!pepper || pepper.length < 32) throw new Error("RAHJO_TOKEN_PEPPER must be at least 32 characters");

const slug = args.get("workspace-slug");
if (!slug || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) throw new Error("--workspace-slug is invalid");
const displayName = normalizePersianText(args.get("display-name") ?? "Rahjo Website Intake", { max: 160, required: true });
const email = `public-intake+${slug}@rahjo.invalid`;
const token = opaqueToken("rahjo_public_intake");
const digest = tokenDigest(token, pepper);

const sql = postgres(databaseUrl, { max: 1, connection: { application_name: "rahjo-public-intake-provisioner" } });
try {
  const result = await sql.begin(async (transaction) => {
    const tx = { async query(text, parameters = []) { const rows = await transaction.unsafe(text, parameters); return { rows: Array.from(rows), rowCount: rows.count ?? rows.length }; } };
    const workspace = await tx.query("SELECT id, slug FROM rahjo.workspaces WHERE slug=$1 AND status='active' FOR UPDATE", [slug]);
    if (!workspace.rowCount) throw new Error("Target workspace does not exist or is not active");
    const user = await tx.query(
      `INSERT INTO rahjo.users(email,display_name,status) VALUES($1,$2,'active')
       ON CONFLICT(email) DO UPDATE SET display_name=excluded.display_name,status='active',updated_at=now()
       RETURNING id`,
      [email, displayName]
    );
    const membership = await tx.query(
      `INSERT INTO rahjo.memberships(workspace_id,user_id,role,status) VALUES($1,$2,'intake','active')
       ON CONFLICT(workspace_id,user_id) DO UPDATE SET role='intake',status='active',authz_version=rahjo.memberships.authz_version+1,updated_at=now()
       RETURNING id`,
      [workspace.rows[0].id, user.rows[0].id]
    );
    await tx.query("DELETE FROM rahjo.password_credentials WHERE user_id=$1", [user.rows[0].id]);
    await tx.query(
      `UPDATE rahjo.api_tokens SET revoked_at=now()
        WHERE workspace_id=$1 AND membership_id=$2 AND revoked_at IS NULL AND label='public website intake'`,
      [workspace.rows[0].id, membership.rows[0].id]
    );
    await tx.query(
      `INSERT INTO rahjo.api_tokens(workspace_id,membership_id,token_hash,label,scopes)
       VALUES($1,$2,$3,'public website intake',ARRAY['read','intake:write']::text[])`,
      [workspace.rows[0].id, membership.rows[0].id, digest]
    );
    return { workspaceId: workspace.rows[0].id, membershipId: membership.rows[0].id };
  });
  console.log(JSON.stringify({
    status: "provisioned",
    workspaceSlug: slug,
    ...result,
    publicIntakeToken: token,
    warning: "Store this token only in the backend secret manager as RAHJO_PUBLIC_INTAKE_TOKEN. It is shown once and must never be exposed to the browser, Drive, source or logs."
  }, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}
