import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";
const databaseUrl = process.env.RAHJO_MIGRATION_DATABASE_URL;
const runtimePassword = process.env.RAHJO_DB_RUNTIME_PASSWORD;

if (!databaseUrl) throw new Error("RAHJO_MIGRATION_DATABASE_URL is required");
if (!runtimePassword || runtimePassword.length < 32) throw new Error("RAHJO_DB_RUNTIME_PASSWORD must be at least 32 characters");

function literal(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const sql = postgres(databaseUrl, { max: 1, connection: { application_name: "rahjo-migrator" } });

async function query(text, parameters = [], { simple = false } = {}) {
  const pending = sql.unsafe(text, parameters);
  const rows = simple ? await pending.simple() : await pending;
  return { rows: Array.from(rows), rowCount: rows.count ?? rows.length };
}

try {
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='rahjo_app') THEN
        CREATE ROLE rahjo_app LOGIN NOINHERIT NOCREATEDB NOCREATEROLE NOSUPERUSER NOBYPASSRLS;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='rahjo_worker') THEN
        CREATE ROLE rahjo_worker NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE NOSUPERUSER NOBYPASSRLS;
      END IF;
    END $$;
    ALTER ROLE rahjo_app PASSWORD ${literal(runtimePassword)};
    ALTER ROLE rahjo_app SET search_path TO rahjo, pg_catalog;
    ALTER ROLE rahjo_app SET statement_timeout TO '12s';
    CREATE SCHEMA IF NOT EXISTS rahjo;
    CREATE TABLE IF NOT EXISTS rahjo.schema_migrations (
      version text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `, [], { simple: true });
  const databaseName = (await query("SELECT current_database() AS name")).rows[0].name;
  if (!/^[A-Za-z0-9_-]+$/.test(databaseName)) throw new Error("Unsafe database identifier");
  await query(`GRANT CONNECT ON DATABASE "${databaseName}" TO rahjo_app`);

  const migrationsUrl = new URL("../migrations/", import.meta.url);
  const files = (await readdir(migrationsUrl)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  for (const version of files) {
    const migrationSql = await readFile(new URL(version, migrationsUrl), "utf8");
    const checksum = createHash("sha256").update(migrationSql).digest("hex");
    const existing = await query("SELECT checksum FROM rahjo.schema_migrations WHERE version=$1", [version]);
    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Migration checksum drift: ${version}`);
      console.log(JSON.stringify({ migration: version, status: "already_applied", checksum }));
      continue;
    }
    try {
      await sql.begin(async (transaction) => {
        await transaction.unsafe(migrationSql).simple();
        await transaction.unsafe("INSERT INTO rahjo.schema_migrations(version, checksum) VALUES ($1,$2)", [version, checksum]);
      });
      console.log(JSON.stringify({ migration: version, status: "applied", checksum }));
    } catch (error) {
      throw error;
    }
  }
} finally {
  await sql.end({ timeout: 5 });
}
