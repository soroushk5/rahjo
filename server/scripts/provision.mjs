import postgres from "postgres";
import { opaqueToken, passwordCredential, tokenDigest } from "../src/security.js";
import { normalizeEmail, normalizePersianText } from "../src/normalization.js";

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
const initialPassword = process.env.RAHJO_PROVISION_PASSWORD;
if (!databaseUrl) throw new Error("RAHJO_MIGRATION_DATABASE_URL is required");
if (!pepper || pepper.length < 32) throw new Error("RAHJO_TOKEN_PEPPER must be at least 32 characters");
if (!initialPassword) throw new Error("RAHJO_PROVISION_PASSWORD is required and is never printed");

const slug = args.get("workspace-slug");
const workspaceName = normalizePersianText(args.get("workspace-name"), { max: 160, required: true });
const email = normalizeEmail(args.get("email"));
const displayName = normalizePersianText(args.get("display-name"), { max: 160, required: true });
const role = args.get("role") ?? "owner";
const relaticleTeamId = args.get("relaticle-team-id");
const label = normalizePersianText(args.get("token-label") ?? "initial API token", { max: 120, required: true });
const scopes = (args.get("scopes") ?? "read,intake:write,approval:decide,action:write,action:execute,outcome:write").split(",").filter(Boolean);
if (!slug || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) throw new Error("--workspace-slug is invalid");
if (!relaticleTeamId) throw new Error("--relaticle-team-id is required");
if (!new Set(["owner", "admin", "operator", "viewer", "intake"]).has(role)) throw new Error("--role is invalid");

const token = opaqueToken();
const digest = tokenDigest(token, pepper);
const credential = passwordCredential(initialPassword);
const sql = postgres(databaseUrl, { max: 1, connection: { application_name: "rahjo-provisioner" } });
try {
  const output = await sql.begin(async (transaction) => {
    const tx = { async query(text, parameters = []) { const rows = await transaction.unsafe(text, parameters); return { rows: Array.from(rows), rowCount: rows.count ?? rows.length }; } };
    const workspace = await tx.query(
    `INSERT INTO rahjo.workspaces(slug,name,relaticle_team_id) VALUES($1,$2,$3)
     ON CONFLICT(slug) DO UPDATE SET name=excluded.name, relaticle_team_id=excluded.relaticle_team_id, updated_at=now()
     RETURNING id`,
    [slug, workspaceName, relaticleTeamId]
  );
    const user = await tx.query(
    `INSERT INTO rahjo.users(email,display_name) VALUES($1,$2)
     ON CONFLICT(email) DO UPDATE SET display_name=excluded.display_name, updated_at=now()
     RETURNING id`,
    [email, displayName]
  );
    const membership = await tx.query(
    `INSERT INTO rahjo.memberships(workspace_id,user_id,role) VALUES($1,$2,$3)
     ON CONFLICT(workspace_id,user_id) DO UPDATE SET role=excluded.role, status='active', updated_at=now()
     RETURNING id`,
    [workspace.rows[0].id, user.rows[0].id, role]
  );
    await tx.query(
    `INSERT INTO rahjo.password_credentials(user_id,password_salt,password_hash) VALUES($1,$2,$3)
     ON CONFLICT(user_id) DO UPDATE SET password_salt=excluded.password_salt,password_hash=excluded.password_hash,changed_at=now()`,
    [user.rows[0].id, credential.salt, credential.hash]
  );
    await tx.query(
      "INSERT INTO rahjo.api_tokens(workspace_id,membership_id,token_hash,label,scopes) VALUES($1,$2,$3,$4,$5)",
    [workspace.rows[0].id, membership.rows[0].id, digest, label, scopes]
  );
    if (args.get("service-id")) {
      await tx.query(
      `INSERT INTO rahjo.services(workspace_id,public_id,name,description,capability_status,execution_mode,owner_membership_id)
       VALUES($1,$2,$3,$4,'under_review','human',$5)
       ON CONFLICT(workspace_id,public_id) DO NOTHING`,
      [workspace.rows[0].id, args.get("service-id"), normalizePersianText(args.get("service-name") ?? args.get("service-id"), { max: 180, required: true }), "Provisioned for Phase-1 human-gated execution", membership.rows[0].id]
      );
    }
    return {
      status: "provisioned",
      workspaceId: workspace.rows[0].id,
      workspaceSlug: slug,
      relaticleTeamId,
      token,
      warning: "This is the only display of the Rahjo token. Store it in an approved secret manager; never commit or log it again."
    };
  });
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  throw error;
} finally {
  await sql.end({ timeout: 5 });
}
