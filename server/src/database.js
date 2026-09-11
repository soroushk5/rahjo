import postgres from "postgres";
import { problems } from "./errors.js";

function executor(sql) {
  return {
    async query(text, parameters = []) {
      const rows = await sql.unsafe(text, parameters);
      return { rows: Array.from(rows), rowCount: rows.count ?? rows.length };
    }
  };
}

export class Database {
  constructor(connectionString) {
    this.sql = postgres(connectionString, {
      max: 12,
      idle_timeout: 30,
      connect_timeout: 5,
      connection: { application_name: "rahjo-crm-bff" }
    });
    this.executor = executor(this.sql);
  }

  async ready() {
    const result = await this.executor.query(
      `SELECT current_database() AS database, current_user AS role,
              role_state.rolsuper, role_state.rolbypassrls
         FROM pg_roles role_state
        WHERE role_state.rolname = current_user`
    );
    const state = result.rows[0];
    if (!state || state.role !== "rahjo_app" || state.rolsuper || state.rolbypassrls) {
      throw problems.unavailable("UNSAFE_DATABASE_ROLE", "Rahjo refused a database connection that is not the exact non-bypass runtime role");
    }
    return state;
  }

  async authenticate(tokenHash) {
    const result = await this.executor.query("SELECT * FROM rahjo.authenticate_api_token($1)", [tokenHash]);
    return result.rows[0] ?? null;
  }

  async verifyWorkspaceBinding(workspaceId, relaticleTeamId) {
    const result = await this.executor.query("SELECT rahjo.verify_workspace_binding($1,$2) AS valid", [workspaceId, relaticleTeamId]);
    if (result.rows[0]?.valid !== true) {
      throw problems.unavailable("RELATICLE_TEAM_BINDING_MISMATCH", "Rahjo workspace and Relaticle team binding could not be verified");
    }
    return true;
  }

  async authenticateSession(tokenHash) {
    const result = await this.executor.query("SELECT * FROM rahjo.authenticate_web_session($1)", [tokenHash]);
    return result.rows[0] ?? null;
  }

  async lookupPassword(workspaceSlug, email) {
    const result = await this.executor.query("SELECT * FROM rahjo.lookup_password_login($1,$2)", [workspaceSlug, email]);
    return result.rows[0] ?? null;
  }

  async createSession(membershipId, tokenHash, csrfHash, expiresAt) {
    const result = await this.executor.query("SELECT rahjo.create_web_session($1,$2,$3,$4) AS id", [membershipId, tokenHash, csrfHash, expiresAt]);
    return result.rows[0]?.id ?? null;
  }

  async revokeSession(tokenHash) {
    const result = await this.executor.query("SELECT rahjo.revoke_web_session($1) AS revoked", [tokenHash]);
    return result.rows[0]?.revoked === true;
  }

  async renewSession(membershipId, oldTokenHash, newTokenHash, csrfHash, expiresAt) {
    return this.sql.begin(async (transaction) => {
      const client = executor(transaction);
      const created = await client.query(
        "SELECT rahjo.create_web_session($1,$2,$3,$4) AS id",
        [membershipId, newTokenHash, csrfHash, expiresAt]
      );
      if (!created.rows[0]?.id) throw problems.unauthorized();
      const revoked = await client.query("SELECT rahjo.revoke_web_session($1) AS revoked", [oldTokenHash]);
      if (revoked.rows[0]?.revoked !== true) throw problems.unauthorized();
      return created.rows[0].id;
    });
  }

  async withWorkspace(context, callback) {
    return this.sql.begin(async (transaction) => {
      const client = executor(transaction);
      await client.query("SELECT set_config('rahjo.workspace_id', $1, true)", [context.workspace_id]);
      await client.query("SELECT set_config('rahjo.membership_id', $1, true)", [context.membership_id]);
      await client.query("SET LOCAL statement_timeout = '12s'");
      return callback(client);
    });
  }

  async close() {
    await this.sql.end({ timeout: 5 });
  }
}

export function requireRole(context, allowed) {
  if (!allowed.includes(context.role)) throw problems.forbidden();
}

export function requireScope(context, scope) {
  if (!context.scopes?.includes(scope) && !context.scopes?.includes("*")) throw problems.forbidden();
}
