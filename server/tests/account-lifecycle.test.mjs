import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createRahjoServer } from "../src/app.js";
import { passwordCredential, secretDigest } from "../src/security.js";

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

async function fixture() {
  let storedSession;
  let invitation;
  let reset;
  let changedPassword = false;
  let recoveryHashes = [];
  const database = {
    ready: async () => ({ database: "test", role: "rahjo_app" }),
    lookupPassword: async (slug, email) => slug === "alpha" && email === context.user_email
      ? { membership_id: context.membership_id, password_salt: credential.salt, password_hash: credential.hash }
      : null,
    createSession: async (membershipId, tokenHash, csrfHash) => {
      storedSession = { membershipId, tokenHash, csrfHash };
      return "session-id";
    },
    authenticateSession: async (tokenHash) => storedSession?.tokenHash === tokenHash ? { ...context, membership_id: storedSession.membershipId, csrf_hash: storedSession.csrfHash } : null,
    authenticate: async () => null,
    revokeSession: async () => true,
    renewSession: async () => null,
    listWorkspaceMembers: async () => [{ membership_id: context.membership_id, email: context.user_email, display_name: "Owner", role: "owner", status: "active" }],
    createMemberInvitation: async (workspaceId, invitedBy, email, displayName, role, tokenHash, expiresAt) => {
      invitation = { workspaceId, invitedBy, email, displayName, role, tokenHash, expiresAt };
      return { invitation_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", invitation_expires_at: expiresAt };
    },
    consumeMemberInvitation: async (tokenHash) => tokenHash === invitation?.tokenHash ? { membership_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" } : null,
    createPasswordResetToken: async (_workspaceId, membershipId, _issuedBy, tokenHash, expiresAt) => {
      reset = { membershipId, tokenHash, expiresAt };
      return true;
    },
    consumePasswordResetToken: async (tokenHash) => tokenHash === reset?.tokenHash ? reset.membershipId : null,
    setPasswordCredential: async () => { changedPassword = true; return true; },
    replaceRecoveryCodes: async (_workspaceId, _membershipId, hashes) => { recoveryHashes = hashes; return hashes.length; },
    consumeRecoveryCode: async (_slug, _email, codeHash) => recoveryHashes.includes(codeHash) ? context.membership_id : null
  };
  const repository = { runtime: async () => ({ version: 1, dataMode: "server", workspace: { id: context.workspace_id }, user: {}, projection: { accounts: [] } }) };
  const config = {
    appEnv: "development",
    port: 0,
    publicOrigin: "http://localhost",
    corsOrigins: ["https://rahjo.example.test"],
    tokenPepper: "p".repeat(32),
    bodyLimit: 64 * 1024,
    sessionHours: 12,
    crmMode: "native_deferred",
    interim: true
  };
  const server = createRahjoServer({ config, database, repository, relaticle: {}, workspaceTokens: new Map(), logger: { info() {}, error() {} } });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base, getInvitation: () => invitation, getReset: () => reset, passwordChanged: () => changedPassword, recoveryHashes: () => recoveryHashes };
}

async function login(base) {
  const response = await fetch(`${base}/api/v1/session`, {
    method: "POST",
    headers: { Origin: "https://rahjo.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceSlug: "alpha", email: context.user_email, password: "a correct long password" })
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  return { cookie: response.headers.get("set-cookie").split(";")[0], csrf: body.csrfToken };
}

function authHeaders(session) {
  return {
    Origin: "https://rahjo.example.test",
    Cookie: session.cookie,
    "X-CSRF-Token": session.csrf,
    "Content-Type": "application/json"
  };
}

test("owner can create a single-use invite URL and a clean device can accept it", async (t) => {
  const fixtureState = await fixture();
  t.after(() => fixtureState.server.close());
  const session = await login(fixtureState.base);

  const members = await fetch(`${fixtureState.base}/api/v1/members`, { headers: { Origin: "https://rahjo.example.test", Cookie: session.cookie } });
  assert.equal(members.status, 200);
  assert.equal((await members.json()).members[0].email, context.user_email);

  const invite = await fetch(`${fixtureState.base}/api/v1/members/invitations`, {
    method: "POST",
    headers: authHeaders(session),
    body: JSON.stringify({ email: "new@example.test", displayName: "New User", role: "operator" })
  });
  assert.equal(invite.status, 201);
  const inviteBody = await invite.json();
  const url = new URL(inviteBody.invitation.url);
  assert.equal(url.origin, "https://rahjo.example.test");
  assert.equal(url.pathname, "/accept-invite");
  assert.equal(url.search, "");
  const token = new URLSearchParams(url.hash.slice(1)).get("token");
  assert.ok(token?.startsWith("rahjo_invite_"));
  assert.equal(fixtureState.getInvitation().tokenHash, secretDigest(token));

  const accepted = await fetch(`${fixtureState.base}/api/v1/invitations/accept`, {
    method: "POST",
    headers: { Origin: "https://rahjo.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: "new secure password 123" })
  });
  assert.equal(accepted.status, 201);
  assert.match(accepted.headers.get("set-cookie"), /^rahjo_session=/);
});

test("owner can issue a reset link and consuming it starts a fresh browser session", async (t) => {
  const fixtureState = await fixture();
  t.after(() => fixtureState.server.close());
  const session = await login(fixtureState.base);
  const response = await fetch(`${fixtureState.base}/api/v1/members/${context.membership_id}/reset-link`, {
    method: "POST",
    headers: authHeaders(session),
    body: "{}"
  });
  assert.equal(response.status, 201);
  const resetBody = await response.json();
  const resetUrl = new URL(resetBody.reset.url);
  assert.equal(resetUrl.search, "");
  const token = new URLSearchParams(resetUrl.hash.slice(1)).get("token");
  assert.equal(fixtureState.getReset().tokenHash, secretDigest(token));

  const consumed = await fetch(`${fixtureState.base}/api/v1/account/reset`, {
    method: "POST",
    headers: { Origin: "https://rahjo.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: "another secure password 123" })
  });
  assert.equal(consumed.status, 201);
});

test("password change verifies the old password, invalidates the session and requires 8+ chars", async (t) => {
  const fixtureState = await fixture();
  t.after(() => fixtureState.server.close());
  const session = await login(fixtureState.base);

  const wrong = await fetch(`${fixtureState.base}/api/v1/account/password`, {
    method: "POST", headers: authHeaders(session),
    body: JSON.stringify({ currentPassword: "wrong password that is long", newPassword: "new password that is long" })
  });
  assert.equal(wrong.status, 401);
  assert.equal(fixtureState.passwordChanged(), false);

  const short = await fetch(`${fixtureState.base}/api/v1/account/password`, {
    method: "POST", headers: authHeaders(session),
    body: JSON.stringify({ currentPassword: "a correct long password", newPassword: "short7" })
  });
  assert.equal(short.status, 422);

  const changed = await fetch(`${fixtureState.base}/api/v1/account/password`, {
    method: "POST", headers: authHeaders(session),
    body: JSON.stringify({ currentPassword: "a correct long password", newPassword: "Eight888" })
  });
  assert.equal(changed.status, 204);
  assert.match(changed.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(fixtureState.passwordChanged(), true);
});

test("recovery codes are returned once and a code can recover an account on another device", async (t) => {
  const fixtureState = await fixture();
  t.after(() => fixtureState.server.close());
  const session = await login(fixtureState.base);
  const issued = await fetch(`${fixtureState.base}/api/v1/account/recovery-codes`, {
    method: "POST", headers: authHeaders(session), body: "{}"
  });
  assert.equal(issued.status, 201);
  const issuedBody = await issued.json();
  assert.equal(issuedBody.codes.length, 8);
  assert.equal(new Set(issuedBody.codes).size, 8);
  assert.deepEqual(fixtureState.recoveryHashes(), issuedBody.codes.map(secretDigest));

  const recovered = await fetch(`${fixtureState.base}/api/v1/account/recovery`, {
    method: "POST",
    headers: { Origin: "https://rahjo.example.test", "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceSlug: "alpha", email: context.user_email, recoveryCode: issuedBody.codes[0], password: "recovered password is long" })
  });
  assert.equal(recovered.status, 201);
});
