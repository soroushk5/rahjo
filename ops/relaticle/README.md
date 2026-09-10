# W13 separated backend topology

The current Hostinger site remains the static Rahjo frontend. This stack belongs on a container host with persistent volumes, encrypted backups, outbound registry access, a TLS reverse proxy and separate `crm` and `api` hostnames.

## Services

- `relaticle-app`: pinned, unmodified Relaticle v3.5.7 web/API/MCP service
- `relaticle-horizon`: pinned queue worker
- `relaticle-scheduler`: pinned scheduler
- `postgres`: pinned PostgreSQL 17 persistent store
- `redis`: pinned Redis 7 queue/cache/session store
- `rahjo-migrate`: one-shot Rahjo-schema migrator using the database owner
- `rahjo-bff`: non-owner, RLS-constrained Rahjo adapter and domain service

Relaticle and the BFF bind to loopback. The target host reverse proxy must terminate TLS and route the approved public hostnames. PostgreSQL and Redis are never published to the host network.

Relaticle stays in its supported path topology on one ingress host: the CRM UI
is `/app`, REST is `/api/v1`, and MCP is `/mcp`. Keep `APP_PANEL_DOMAIN` empty;
enabling a dedicated panel domain activates upstream host enforcement and needs
a separately tested reverse-proxy and internal-host design.

## Required operator sequence

1. Copy `.env.example` to an untracked `.env` on the backend host and replace every placeholder through the provider's secret controls.
2. Create an untracked `secrets/relaticle_workspace_tokens.json` from the example. Every PAT must be created inside and pinned by Relaticle to exactly one team; do not use `X-Team-Id` switching.
3. Set `RAHJO_SOURCE_SHA` to the reviewed Rahjo commit, not a branch name.
4. Render and review the effective stack with `docker compose --env-file .env config`.
5. Start PostgreSQL and Redis, then Relaticle. Create the Rahjo workspaces in Relaticle's native UI and create least-privilege team-pinned PATs.
6. Run `rahjo-migrate`, provision Rahjo memberships/tokens through the one-shot CLI, then start the BFF.
7. Verify `/up` plus Relaticle's full health checks, BFF `/readyz`, Horizon, scheduler and volume mounts. `/up` alone is not acceptance evidence.
8. Run the mandatory two-workspace negative suite, the no-LLM server E2E and a disposable restore drill before any production-ready claim.

The stack intentionally contains no model-provider configuration. Relaticle's optional AI features are not part of the Phase-1 critical path.

The BFF refuses startup unless its database connection is exactly the
non-superuser, `NOBYPASSRLS` `rahjo_app` role. For every configured workspace,
readiness also checks the database workspace-to-team binding, authenticates the
Relaticle REST token, and calls the pinned MCP `who-ami-tool` to compare the
actual team ID and token abilities with the mounted secret mapping. A swapped
or under-scoped PAT therefore fails closed.

Browser sessions use an HttpOnly `__Host-rahjo_session` cookie in production.
Deploy the frontend and BFF behind the same site (for example sibling Rahjo
subdomains) or one same-origin ingress; the cookie policy is not weakened to
support unrelated hosting domains.

## Known provisioning boundary

Relaticle v3.5.7 does not expose public endpoints for team creation or custom-field definition creation. Those items must be created in the native UI and read back before their IDs/codes are used. Unknown custom-field codes must never be guessed.

## Deployment status

This directory is a deployable topology, not proof that it is running. Production deployment requires a real container host, TLS/DNS control, persistent-volume policy and secrets. Keep `RAH-W13-002` open until those services are observed healthy on the selected backend target.

The W13 GitHub workflow is predeployment evidence: it migrates twice, exercises
the BFF against two workspaces with all model variables absent, starts the
pinned Relaticle web/worker/scheduler services, and restores the Rahjo schema
into a fresh PostgreSQL container with roles bootstrapped explicitly. It is not
a production Relaticle-data backup receipt and must not be presented as one.
