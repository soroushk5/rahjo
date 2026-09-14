import postgres from "postgres";
import { opaqueToken, secretDigest } from "../src/security.js";

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
if (!databaseUrl) throw new Error("RAHJO_MIGRATION_DATABASE_URL is required");

const workspaceSlug = args.get("workspace-slug");
const email = String(args.get("email") || "").trim().toLowerCase();
const uiOrigin = String(args.get("ui-origin") || "").replace(/\/$/, "");
const ttlMinutes = Math.min(60, Math.max(10, Number(args.get("ttl-minutes") || 30)));
if (!workspaceSlug || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(workspaceSlug)) throw new Error("--workspace-slug is invalid");
if (!email || !email.includes("@")) throw new Error("--email is invalid");
if (!/^https:\/\//.test(uiOrigin)) throw new Error("--ui-origin must be an https origin");

const sql = postgres(databaseUrl, { max: 1, connection: { application_name: "rahjo-account-recovery-issuer" } });
try {
  const membershipRows = await sql`
    SELECT m.id AS membership_id, m.workspace_id, m.role
      FROM rahjo.memberships m
      JOIN rahjo.workspaces w ON w.id=m.workspace_id
      JOIN rahjo.users u ON u.id=m.user_id
     WHERE w.slug=${workspaceSlug}
       AND u.email=${email}
       AND w.status='active'
       AND u.status='active'
       AND m.status='active'
     LIMIT 1
  `;
  const target = membershipRows[0];
  if (!target) throw new Error("Active account was not found");

  const token = opaqueToken("rahjo_reset");
  const hash = secretDigest(token);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  await sql.begin(async (tx) => {
    await tx`
      UPDATE rahjo.password_reset_tokens
         SET revoked_at=now()
       WHERE workspace_id=${target.workspace_id}
         AND membership_id=${target.membership_id}
         AND used_at IS NULL
         AND revoked_at IS NULL
    `;
    await tx`
      INSERT INTO rahjo.password_reset_tokens(workspace_id,membership_id,token_hash,issued_by,expires_at)
      VALUES(${target.workspace_id},${target.membership_id},${hash},${target.role === "owner" || target.role === "admin" ? target.membership_id : null},${expiresAt})
    `;
  });

  const resetUrl = new URL("/recover-account", `${uiOrigin}/`);
  resetUrl.hash = new URLSearchParams({ mode: "reset", token }).toString();
  console.log(JSON.stringify({
    status: "issued",
    workspaceSlug,
    email,
    expiresAt: expiresAt.toISOString(),
    resetUrl: resetUrl.toString(),
    warning: "This one-time link is a short-lived bearer secret. Deliver it only to the account owner and never commit it."
  }, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}
