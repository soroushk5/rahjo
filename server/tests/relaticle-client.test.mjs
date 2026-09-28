import assert from "node:assert/strict";
import test from "node:test";
import { RelaticleClient } from "../src/relaticleClient.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const workspaceTokens = new Map([[workspaceId, {
  token: "relaticle-test-token-with-enough-length",
  expectedTeamId: "TEAM-A",
  requiredAbilities: ["read", "create"]
}]]);

function mcpResponse(teamId = "TEAM-A", abilities = ["read", "create"]) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (options.method === "DELETE") return new Response(null, { status: 204 });
    const payload = JSON.parse(options.body);
    if (payload.method === "initialize") {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-11-25", capabilities: {}, serverInfo: { name: "Relaticle", version: "2.0.0" } } }), {
        status: 200,
        headers: { "Content-Type": "application/json", "MCP-Session-Id": "mcp-test-session" }
      });
    }
    if (payload.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (payload.method === "tools/call") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        result: {
          content: [{ type: "text", text: "Account context" }],
          structuredContent: { user: { id: "USER-A" }, team: { id: teamId, name: "Alpha" }, team_members: [], token_abilities: abilities }
        }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw new Error("Unexpected MCP request");
  };
  return { fetchImpl, calls };
}

test("Relaticle adapter uses only the server-side team-pinned token", async () => {
  let request;
  const client = new RelaticleClient({
    baseUrl: "https://crm.example.test/api/v1",
    workspaceTokens,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ data: { id: "01RELATICLE", type: "companies", attributes: { name: "شرکت یارا" } } }), { status: 201, headers: { "Content-Type": "application/json" } });
    }
  });
  const company = await client.createAccount(workspaceId, { name: "شرکت یارا" });
  assert.equal(company.id, "01RELATICLE");
  assert.equal(request.options.headers.Authorization, "Bearer relaticle-test-token-with-enough-length");
  assert.equal(request.options.headers["X-Team-Id"], undefined);
  assert.equal(request.url, "https://crm.example.test/api/v1/companies");
  assert.deepEqual(JSON.parse(request.options.body), { name: "شرکت یارا" });
});

test("upstream credential and contract failures remain explicit server failures", async () => {
  const rejected = new RelaticleClient({
    baseUrl: "https://crm.example.test/api/v1",
    workspaceTokens,
    fetchImpl: async () => new Response("{}", { status: 401 })
  });
  await assert.rejects(() => rejected.verifyAuthentication(workspaceId), (error) => error.status === 503 && error.code === "RELATICLE_CREDENTIAL_REJECTED");

  const malformed = new RelaticleClient({
    baseUrl: "https://crm.example.test/api/v1",
    workspaceTokens,
    fetchImpl: async () => new Response(JSON.stringify({ records: [] }), { status: 200 })
  });
  await assert.rejects(() => malformed.listAccounts(workspaceId), (error) => error.status === 503 && error.code === "RELATICLE_CONTRACT_ERROR");
});

test("an unmapped workspace never reuses another workspace credential", async () => {
  const client = new RelaticleClient({ baseUrl: "https://crm.example.test/api/v1", workspaceTokens, fetchImpl: async () => { throw new Error("must not call"); } });
  await assert.rejects(() => client.listAccounts("22222222-2222-4222-8222-222222222222"), (error) => error.status === 503 && error.code === "RELATICLE_WORKSPACE_NOT_PROVISIONED");
});

test("MCP who-ami proves the pinned team and least required token abilities", async () => {
  const mock = mcpResponse();
  const client = new RelaticleClient({
    baseUrl: "https://crm.example.test/api/v1",
    mcpUrl: "https://crm.example.test/mcp",
    workspaceTokens,
    fetchImpl: mock.fetchImpl
  });
  const identity = await client.verifyTeamIdentity(workspaceId);
  assert.equal(identity.teamId, "TEAM-A");
  assert.deepEqual(identity.abilities, ["read", "create"]);
  assert.deepEqual(mock.calls.map((call) => call.options.method), ["POST", "POST", "POST", "DELETE"]);
  assert.equal(mock.calls[2].options.headers.Authorization, "Bearer relaticle-test-token-with-enough-length");
  assert.equal(mock.calls[2].options.headers["X-Team-Id"], undefined);
  assert.equal(JSON.parse(mock.calls[2].options.body).params.name, "who-ami-tool");
});

test("MCP identity fails closed for a swapped team token or missing ability", async () => {
  const swapped = mcpResponse("TEAM-B");
  const swappedClient = new RelaticleClient({
    baseUrl: "https://crm.example.test/api/v1",
    mcpUrl: "https://crm.example.test/mcp",
    workspaceTokens,
    fetchImpl: swapped.fetchImpl
  });
  await assert.rejects(
    () => swappedClient.verifyTeamIdentity(workspaceId),
    (error) => error.status === 503 && error.code === "RELATICLE_TEAM_MISMATCH"
  );

  const underScoped = mcpResponse("TEAM-A", ["read"]);
  const underScopedClient = new RelaticleClient({
    baseUrl: "https://crm.example.test/api/v1",
    mcpUrl: "https://crm.example.test/mcp",
    workspaceTokens,
    fetchImpl: underScoped.fetchImpl
  });
  await assert.rejects(
    () => underScopedClient.verifyTeamIdentity(workspaceId),
    (error) => error.status === 503 && error.code === "RELATICLE_TOKEN_ABILITY_MISMATCH"
  );
});


test("Relaticle adapter maps standard Opportunity Task and Interaction writes to documented REST fields", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const parsed = new URL(String(url));
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ path: parsed.pathname, method: options.method, body });
    const type = parsed.pathname.includes("/opportunities") ? "opportunities"
      : parsed.pathname.includes("/tasks") ? "tasks"
        : "notes";
    const id = type === "opportunities" ? "OPP-REL-1" : type === "tasks" ? "TASK-REL-1" : "NOTE-REL-1";
    return new Response(JSON.stringify({ data: { id, type, attributes: body ?? {} } }), {
      status: options.method === "POST" ? 201 : 200,
      headers: { "Content-Type": "application/json" }
    });
  };
  const client = new RelaticleClient({
    baseUrl: "https://crm.example.test/api/v1",
    workspaceTokens,
    fetchImpl
  });

  await client.createOpportunity(workspaceId, {
    name: "Enterprise Deal",
    accountId: "COMPANY-1",
    contactId: "PERSON-1",
    stage: "Proposal"
  });
  await client.updateOpportunityStage(workspaceId, "OPP-REL-1", { stage: "Negotiation" });
  await client.createTask(workspaceId, {
    title: "Follow up",
    accountId: "COMPANY-1",
    contactId: "PERSON-1",
    opportunityId: "OPP-REL-1",
    status: "To do"
  });
  await client.updateTaskStatus(workspaceId, "TASK-REL-1", { status: "Done" });
  await client.createInteraction(workspaceId, {
    title: "Call note",
    body: "Customer asked for revised proposal",
    accountId: "COMPANY-1",
    contactId: "PERSON-1",
    opportunityId: "OPP-REL-1"
  });

  assert.deepEqual(calls, [
    {
      path: "/api/v1/opportunities",
      method: "POST",
      body: {
        name: "Enterprise Deal",
        company_id: "COMPANY-1",
        contact_id: "PERSON-1",
        custom_fields: { stage: "Proposal" }
      }
    },
    {
      path: "/api/v1/opportunities/OPP-REL-1",
      method: "PUT",
      body: { custom_fields: { stage: "Negotiation" } }
    },
    {
      path: "/api/v1/tasks",
      method: "POST",
      body: {
        title: "Follow up",
        company_ids: ["COMPANY-1"],
        people_ids: ["PERSON-1"],
        opportunity_ids: ["OPP-REL-1"],
        custom_fields: { status: "To do" }
      }
    },
    {
      path: "/api/v1/tasks/TASK-REL-1",
      method: "PUT",
      body: { custom_fields: { status: "Done" } }
    },
    {
      path: "/api/v1/notes",
      method: "POST",
      body: {
        title: "Call note",
        company_ids: ["COMPANY-1"],
        people_ids: ["PERSON-1"],
        opportunity_ids: ["OPP-REL-1"],
        custom_fields: { body: "Customer asked for revised proposal" }
      }
    }
  ]);
});
