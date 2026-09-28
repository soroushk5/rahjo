# CRM Core production deployment

## Source-of-truth contract

- `main` is the canonical source branch for frontend and CRM Core BFF code.
- `hostinger-production` is a generated static deployment branch.
- Hostinger static production follows `hostinger-production`; the Node Web App follows `main`.
- Do not edit generated production files manually.

## GitHub configuration

Use the CRM-first repository variables:

- `CRM_PRODUCTION_ORIGIN` — public HTTPS site origin.
- `CRM_API_BASE` — Hostinger Node Web App origin.
- `CRM_RUNTIME_MODE=server`.

Legacy `RAHJO_*` repository variables are temporary compatibility fallbacks only.

After `Quality` succeeds on `main`, the production workflow:

1. builds and smoke-tests the static frontend;
2. proves the Node BFF has converged to the current CRM contract;
3. verifies live login abuse rate limiting (`429` + `Retry-After`);
4. verifies public Website → CRM intake with an idempotent replay;
5. publishes `hostinger-production`;
6. verifies `health.json` exposes the intended source SHA.

## Public intake

Public intake does **not** require a browser or Hostinger intake token.

Routing is server-owned in PostgreSQL:

```text
exact HTTPS origin
→ private public_intake_routes row
→ dedicated intake membership
→ target workspace
→ target service
```

The runtime role has no direct `SELECT` privilege on the routing table. It can only execute the private resolver function. Unknown origins or missing routes fail closed.

Provision or repair a route with:

```bash
cd server
CRM_MIGRATION_DATABASE_URL='postgresql://...' \
  node scripts/provision-public-intake.mjs \
  --workspace-slug <workspace> \
  --origin https://example.com \
  --service-id SVC-WEBSITE-INTAKE \
  --service-name "Website Intake"
```

No PAT, API token, or intake secret is generated or printed.

## Hostinger configuration

Static site:
- Repository: `soroushk5/rahjo`
- Branch: `hostinger-production`
- Target directory: document root
- Build command: none

Node BFF:
- Repository: `soroushk5/rahjo`
- Branch: `main`
- Runtime directory: `server`
- Start command: `npm start`
- The database connection and token pepper remain backend secrets.
- Provider credentials remain server-side only.

## Acceptance

A production release is accepted only when:

- BFF `/healthz` reports the expected CRM contract;
- live `429` / `Retry-After` abuse evidence passes;
- public intake returns `received` and the same Idempotency-Key replays without a duplicate side effect;
- public `health.json` reports the intended `main` SHA;
- direct route refreshes, assets, mobile RTL and console/network checks pass.

The legacy PostgreSQL `rahjo` schema/role names remain a compatibility boundary until the dedicated storage namespace cutover is backed by a fresh full backup/restore receipt.
