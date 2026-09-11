import assert from "node:assert/strict";
import test from "node:test";
import {
  createRuntimeDataFacade,
  RUNTIME_DATA_STATES,
  SERVER_SESSION_PATH,
  serverRuntimeUrl
} from "../src/services/runtimeDataFacade.js";

const demoConfig = { mode: "demo", apiBase: "", buildSha: "demo-sha" };
const serverConfig = { mode: "server", apiBase: "https://api.rahjo.example", buildSha: "server-sha" };

test("invalid runtime configuration is an explicit validation state", async () => {
  const facade = createRuntimeDataFacade();
  const state = await facade.initialize({ mode: "production", apiBase: "", buildSha: "bad-sha" });
  assert.equal(state.mode, null);
  assert.equal(state.state, RUNTIME_DATA_STATES.VALIDATION);
  assert.equal(state.projection, null);
  assert.equal(facade.readProjection(), null);
});

test("explicit demo mode never contacts the server and has no server projection", async () => {
  const facade = createRuntimeDataFacade();
  let calls = 0;
  const state = await facade.initialize(demoConfig, { fetchImpl: async () => { calls += 1; } });
  assert.equal(calls, 0);
  assert.equal(state.mode, "demo");
  assert.equal(state.state, RUNTIME_DATA_STATES.DEMO);
  assert.equal(facade.readProjection(), null);
});

test("server network failure is unavailable and never falls back to demo or stale data", async () => {
  const facade = createRuntimeDataFacade();
  const ready = await facade.initialize(serverConfig, {
    fetchImpl: async () => new Response(JSON.stringify({
      dataMode: "server",
      version: 1,
      workspace: { id: "workspace-a", name: "Workspace A" },
      projection: { accounts: [{ id: "account-a" }] }
    }), { status: 200, headers: { "Content-Type": "application/json" } })
  });
  assert.equal(ready.state, RUNTIME_DATA_STATES.READY);
  assert.equal(facade.readProjection().accounts[0].id, "account-a");

  const failed = await facade.initialize(serverConfig, { fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(failed.mode, "server");
  assert.equal(failed.state, RUNTIME_DATA_STATES.UNAVAILABLE);
  assert.equal(failed.projection, null);
  assert.equal(facade.readProjection(), null);
  assert.match(failed.message, /نمایشی جایگزین نشده/);
});

test("server facade maps authorization, isolation, conflict, and validation failures explicitly", async () => {
  for (const [status, expected] of [
    [401, RUNTIME_DATA_STATES.AUTH],
    [403, RUNTIME_DATA_STATES.FORBIDDEN],
    [409, RUNTIME_DATA_STATES.CONFLICT],
    [422, RUNTIME_DATA_STATES.VALIDATION],
    [503, RUNTIME_DATA_STATES.UNAVAILABLE]
  ]) {
    const facade = createRuntimeDataFacade();
    const state = await facade.initialize(serverConfig, {
      fetchImpl: async () => new Response(null, { status })
    });
    assert.equal(state.state, expected, `HTTP ${status}`);
    assert.equal(state.projection, null, `HTTP ${status}`);
  }
});

test("server facade validates and synchronously caches a workspace projection", async () => {
  const facade = createRuntimeDataFacade();
  const requestedUrls = [];
  const state = await facade.initialize(serverConfig, {
    fetchImpl: async (url) => {
      requestedUrls.push(String(url));
      return new Response(JSON.stringify({
        dataMode: "server",
        version: 1,
        workspace: { id: "workspace-a", name: "عملیات الف" },
        projection: { cases: [{ id: "case-1" }] }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
  });
  assert.equal(requestedUrls[0], serverRuntimeUrl(serverConfig.apiBase));
  assert.equal(requestedUrls[1], `${serverConfig.apiBase}/api/v1/session/csrf`);
  assert.equal(state.state, RUNTIME_DATA_STATES.READY);
  assert.equal(facade.read().workspace.id, "workspace-a");
  assert.equal(facade.readProjection().cases[0].id, "case-1");
  assert.equal(Object.isFrozen(facade.readProjection()), true);
  assert.equal(Object.isFrozen(facade.readProjection().cases), true);

  const invalid = await facade.initialize(serverConfig, {
    fetchImpl: async () => new Response(JSON.stringify({ version: 1, projection: {} }), { status: 200 })
  });
  assert.equal(invalid.state, RUNTIME_DATA_STATES.VALIDATION);
  assert.equal(invalid.projection, null);
});

test("server login exchanges only credentials, then validates the cookie-backed runtime", async () => {
  const facade = createRuntimeDataFacade();
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith(SERVER_SESSION_PATH)) {
      return new Response(JSON.stringify({ dataMode: "server", csrfToken: "rahjo_csrf_abcdefghijklmnopqrstuvwxyz" }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      dataMode: "server",
      version: 1,
      workspace: { id: "workspace-a", name: "عملیات الف" },
      projection: { cases: [] }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  await facade.initialize(serverConfig, { fetchImpl: async () => new Response(null, { status: 401 }) });
  const state = await facade.authenticate({ workspaceSlug: "alpha", email: "owner@example.test", password: "server-only-password" }, { fetchImpl });

  assert.equal(state.state, RUNTIME_DATA_STATES.READY);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `${serverConfig.apiBase}${SERVER_SESSION_PATH}`);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.credentials, "include");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    workspaceSlug: "alpha",
    email: "owner@example.test",
    password: "server-only-password"
  });
  assert.equal(calls[1].url, serverRuntimeUrl(serverConfig.apiBase));
  assert.equal(calls[1].options.credentials, "include");
  assert.equal("csrfToken" in state, false);
  assert.equal(JSON.stringify(state).includes("server-only-password"), false);
  assert.equal(JSON.stringify(state).includes("rahjo_csrf_"), false);
});

test("failed server login remains explicit and has no projection", async () => {
  const facade = createRuntimeDataFacade();
  await facade.initialize(serverConfig, { fetchImpl: async () => new Response(null, { status: 401 }) });
  const state = await facade.authenticate(
    { workspaceSlug: "alpha", email: "owner@example.test", password: "wrong-password" },
    { fetchImpl: async () => new Response(null, { status: 401 }) }
  );
  assert.equal(state.state, RUNTIME_DATA_STATES.AUTH);
  assert.equal(state.httpStatus, 401);
  assert.equal(state.projection, null);
  assert.equal(facade.readProjection(), null);
});

test("server commands use the rotated CSRF token, keep workspace scope server-owned, and refresh projection", async () => {
  const facade = createRuntimeDataFacade();
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/runtime")) return new Response(JSON.stringify({
      dataMode: "server", version: 1, workspace: { id: "workspace-a", name: "رهجو" }, projection: { cases: [] }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    if (String(url).endsWith("/csrf")) return new Response(JSON.stringify({ dataMode: "server", csrfToken: "rahjo_csrf_rotated_abcdefghijklmnopqrstuvwxyz" }), { status: 200 });
    return new Response(JSON.stringify({ dataMode: "server", data: { status: "approved" } }), { status: 200 });
  };
  await facade.initialize(serverConfig, { fetchImpl });
  await facade.command("/api/v1/approvals/APR-1/decision", { body: { decision: "approved" }, fetchImpl });
  const command = calls.find((item) => item.url.endsWith("/decision"));
  assert.equal(command.options.credentials, "include");
  assert.equal(command.options.headers["X-CSRF-Token"], "rahjo_csrf_rotated_abcdefghijklmnopqrstuvwxyz");
  assert.equal("workspaceId" in JSON.parse(command.options.body), false);
  assert.equal(calls.filter((item) => item.url.endsWith("/runtime")).length, 2);
});
