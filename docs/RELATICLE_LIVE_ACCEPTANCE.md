# CRM Core — Live Relaticle Acceptance

This acceptance is the closure harness for IN-011 and the remaining live-provider parts of W13-004, W13-005, W13-009 and W13-012.

## Safety boundary

- Never paste PAT values into chat, Drive, source, CI logs or receipts.
- The team-pinned token map must be mounted from a private server-side file.
- The harness requires an explicit write acknowledgement because it creates clearly labelled, non-customer acceptance records in both Relaticle teams.
- Acceptance records use the prefix `[CRM-ACCEPTANCE <tag>]`; no customer data is used.
- The output is a sanitized JSON receipt and never includes token values.

## Owner provisioning required first

In the authenticated Relaticle owner UI:

1. Create/confirm exactly two production teams corresponding to the two CRM Core workspaces.
2. Create one least-privilege PAT per team, pinned to that team.
3. Give only the abilities required by the adapter and MCP acceptance (currently `read` + `create`, plus any upstream update ability Relaticle requires for Opportunity/Task mutation).
4. Provision the required custom fields for:
   - Opportunity stage
   - Task status
   - Note/activity body if the deployment requires it
5. Record the exact machine-valid initial and updated values for Opportunity stage and Task status.
6. Write PATs only into the server-side token mapping file. Do not copy them into issue/PR/chat text.

The token file shape remains the existing versioned contract:

```json
{
  "version": 1,
  "workspaces": [
    {
      "workspaceId": "<crm-workspace-uuid>",
      "token": "<private PAT>",
      "expectedTeamId": "<relaticle-team-id>",
      "requiredAbilities": ["read", "create"]
    }
  ]
}
```

## Run

From the trusted backend environment:

```bash
cd server

CRM_RELATICLE_ACCEPTANCE_ACK=true \
CRM_RELATICLE_ACCEPTANCE_TAG=release-YYYYMMDD \
CRM_RELATICLE_ACCEPTANCE_STAGE_INITIAL='<exact provisioned value>' \
CRM_RELATICLE_ACCEPTANCE_STAGE_UPDATED='<exact provisioned value>' \
CRM_RELATICLE_ACCEPTANCE_TASK_INITIAL='<exact provisioned value>' \
CRM_RELATICLE_ACCEPTANCE_TASK_UPDATED='<exact provisioned value>' \
RELATICLE_BASE_URL='https://<private-relaticle-origin>/api/v1' \
RELATICLE_MCP_URL='https://<private-relaticle-origin>/mcp' \
RELATICLE_TOKEN_FILE='/run/secrets/relaticle_workspace_tokens.json' \
npm run acceptance:relaticle
```

## Pass criteria

The final JSON receipt must report:

- `status: "passed"`
- `workspaceCount: 2`
- REST authentication true
- MCP team identity + required abilities true
- Account / Contact / Opportunity / Task / Interaction create-read-reload true
- cross-workspace isolation true
- Opportunity stage mutation true
- Task status mutation true
- `secretPrinted: false`
- `customerDataUsed: false`

Only after that receipt exists should W13-004/W13-005/W13-009/W13-012 be closed and IN-011 marked supplied.
