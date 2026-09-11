import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createRahjoServer } from "../src/app.js";
import { passwordCredential, tokenDigest } from "../src/security.js";

const pepper = "p".repeat(32);
const fetchBlockedPorts = new Set([2049, 3659, 4045, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669, 6697, 10080]);
const credential = passwordCredential("a correct long password");
const context = {
  workspace_id: "11111111-1111-4111-8111-111111111111",
  workspace_slug: "alpha",
  workspace_name: "Alpha",
  membership_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  user_email: "owner@example.test",
  display_name: "Owner",
  role: "owner",
  scopes: ["read", "intake:write", "approval:decide", "action:write", "action:execute", "outcome:write"]
};

async function fixture({ appEnv = "development" } = {}) {
  let storedSession;
  const database = {
    ready: async () => ({ database: "test", role: "rahjo_app" }),
    lookupPassword: async (slug, email) => slug === "alpha" && email === "owner@example.test" ? { membership_id: context.membership_id, password_salt: credential.salt, password_hash: credential.hash } : null,
    createSession: async (_membership, tokenHash, csrfHash) => { storedSession = { tokenHash, csrfHash }; return "session-id"; },
    rotateSessionCsrf: async (_tokenHash, csrfHash) => { storedSession.csrfHash = csrfHash; return true; },
    authenticateSession: async (tokenHash) => storedSession?.tokenHash === tokenHash ? { ...context, csrf_hash: storedSession.csrfHash } : null,
    authenticate: async () => null,
    revokeSession: async () => true
  };
  const repository = { runtime: async () => ({ version: 1, dataMode: "server", workspace: { id: context.workspace_id }, projection: { accounts: [] } }) };
  const relaticle = { verifyAuthentication: async () => ({ id: "user-1" }) };
  const config = {
    appEnv,
    port: 0,
    publicOrigin: "http://localhost",
    corsOrigins: ["https://rahjo.example.test"],
    tokenPepper: pepper,
    bodyLimit: 64 * 1024,
    sessionHours: 12
  };
  const logger = { info() {}, error() {} };
  const server = createRahjoServer({ config, database, repository, relaticle, workspaceTokens: new Map([[context.workspace_id, {}]]), logger });
  do {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    if (!fetchBlockedPorts.has(server.address().port)) break;
    await new Promise((resolve) => server.close(resolve));
  } while (true);
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base };
}

test("browser login issues an HttpOnly Rahjo session and runtime uses it with credentialed CORS", async (t) => {
  const { server, base } = await fixture();
  t.after(() => server.close());
  const login = await fetch(`${base}/api/v1/session`, {
    method: "POST",
    headers: { Origin: "https://rahjo.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceSlug: "alpha", email: "owner@example.test", password: "a correct long password" })
  });
  assert.equal(login.status, 201);
  assert.equal(login.headers.get("access-control-allow-credentials"), "true");
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /^rahjo_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  const loginBody = await login.json();
  assert.ok(loginBody.csrfToken.startsWith("rahjo_csrf_"));
  assert.equal(JSON.stringify(loginBody).includes("rahjo_session_"), false);

  const runtime = await fetch(`${base}/api/v1/runtime`, {
    headers: { Origin: "https://rahjo.example.test", Cookie: cookie.split(";")[0] }
  });
  assert.equal(runtime.status, 200);
  assert.equal(runtime.headers.get("access-control-allow-credentials"), "true");
  assert.deepEqual((await runtime.json()).projection.accounts, []);
});

test("an authenticated browser session can rotate a non-persistent CSRF token after reload", async (t) => {
  const { server, base } = await fixture();
  t.after(() => server.close());
  const login = await fetch(`${base}/api/v1/session`, {
    method: "POST", headers: { Origin: "https://rahjo.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceSlug: "alpha", email: "owner@example.test", password: "a correct long password" })
  });
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const response = await fetch(`${base}/api/v1/session/csrf`, { method: "POST", headers: { Origin: "https://rahjo.example.test", Cookie: cookie } });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.dataMode, "server");
  assert.match(body.csrfToken, /^rahjo_csrf_/);
});

test("production browser session uses the locked __Host cookie boundary", async (t) => {
  const { server, base } = await fixture({ appEnv: "production" });
  t.after(() => server.close());
  const response = await fetch(`${base}/api/v1/session`, {
    method: "POST",
    headers: { Origin: "https://rahjo.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceSlug: "alpha", email: "owner@example.test", password: "a correct long password" })
  });
  assert.equal(response.status, 201);
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /^__Host-rahjo_session=/);
  assert.match(cookie, /; Path=\/;/);
  assert.match(cookie, /; HttpOnly;/);
  assert.match(cookie, /; Secure;/);
  assert.match(cookie, /; SameSite=Lax;/);
  assert.doesNotMatch(cookie, /Domain=/i);
});

test("missing auth and workspace override fail without a demo response", async (t) => {
  const { server, base } = await fixture();
  t.after(() => server.close());
  const missing = await fetch(`${base}/api/v1/runtime`);
  assert.equal(missing.status, 401);
  const missingBody = await missing.json();
  assert.equal(missingBody.dataMode, "server");
  assert.equal(Object.hasOwn(missingBody, "projection"), false);

  const override = await fetch(`${base}/api/v1/runtime`, { headers: { "X-Workspace-Id": context.workspace_id } });
  assert.equal(override.status, 422);
  assert.equal((await override.json()).code, "VALIDATION_FAILED");
});

test("untrusted browser origins are denied before authentication", async (t) => {
  const { server, base } = await fixture();
  t.after(() => server.close());
  const response = await fetch(`${base}/healthz`, { headers: { Origin: "https://evil.example" } });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});
