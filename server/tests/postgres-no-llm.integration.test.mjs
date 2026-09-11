import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";

const enabled = Boolean(process.env.TEST_DATABASE_URL && process.env.TEST_RAHJO_DATABASE_URL);

function context(row) {
  return row;
}

test("mandatory two-workspace RLS and no-context isolation", { skip: !enabled }, async () => {
  const [{ default: postgres }, { Database }, { passwordCredential, tokenDigest }] = await Promise.all([
    import("postgres"), import("../src/database.js"), import("../src/security.js")
  ]);
  const admin = postgres(process.env.TEST_DATABASE_URL, { max: 1 });
  const database = new Database(process.env.TEST_RAHJO_DATABASE_URL);
  const unsafeOwnerDatabase = new Database(process.env.TEST_DATABASE_URL);
  const pepper = process.env.RAHJO_TOKEN_PEPPER;
  const tokenA = "rahjo_test_workspace_a_12345678901234567890";
  const tokenB = "rahjo_test_workspace_b_12345678901234567890";
  try {
    await assert.rejects(
      () => unsafeOwnerDatabase.ready(),
      (error) => error.code === "UNSAFE_DATABASE_ROLE"
    );
    assert.equal((await database.ready()).role, "rahjo_app");
    const [workspaceA] = await admin`INSERT INTO rahjo.workspaces(slug,name,relaticle_team_id) VALUES('test-alpha','Alpha','TEAM-A') RETURNING id`;
    const [workspaceB] = await admin`INSERT INTO rahjo.workspaces(slug,name,relaticle_team_id) VALUES('test-beta','Beta','TEAM-B') RETURNING id`;
    const [userA] = await admin`INSERT INTO rahjo.users(email,display_name) VALUES('alpha@example.test','Alpha Owner') RETURNING id`;
    const [userB] = await admin`INSERT INTO rahjo.users(email,display_name) VALUES('beta@example.test','Beta Owner') RETURNING id`;
    const [membershipA] = await admin`INSERT INTO rahjo.memberships(workspace_id,user_id,role) VALUES(${workspaceA.id},${userA.id},'owner') RETURNING id`;
    const [membershipB] = await admin`INSERT INTO rahjo.memberships(workspace_id,user_id,role) VALUES(${workspaceB.id},${userB.id},'owner') RETURNING id`;
    const scopes = ["read", "intake:write", "approval:decide", "action:write", "action:execute", "outcome:write"];
    const credential = passwordCredential("restore smoke password value");
    await admin`INSERT INTO rahjo.password_credentials(user_id,password_salt,password_hash) VALUES(${userA.id},${credential.salt},${credential.hash})`;
    await admin`INSERT INTO rahjo.api_tokens(workspace_id,membership_id,token_hash,label,scopes) VALUES
      (${workspaceA.id},${membershipA.id},${tokenDigest(tokenA, pepper)},'alpha test',${scopes}),
      (${workspaceB.id},${membershipB.id},${tokenDigest(tokenB, pepper)},'beta test',${scopes})`;
    const [serviceA] = await admin`INSERT INTO rahjo.services(workspace_id,public_id,name,capability_status,execution_mode,owner_membership_id)
      VALUES(${workspaceA.id},'SVC-ALPHA','Alpha Service','active','human',${membershipA.id}) RETURNING id`;
    const [serviceB] = await admin`INSERT INTO rahjo.services(workspace_id,public_id,name,capability_status,execution_mode,owner_membership_id)
      VALUES(${workspaceB.id},'SVC-BETA','Beta Service','active','human',${membershipB.id}) RETURNING id`;

    const authA = context(await database.authenticate(tokenDigest(tokenA, pepper)));
    const authB = context(await database.authenticate(tokenDigest(tokenB, pepper)));
    assert.equal(authA.workspace_id, workspaceA.id);
    assert.equal(authB.workspace_id, workspaceB.id);

    const visibleA = await database.withWorkspace(authA, async (client) => (await client.query("SELECT public_id FROM rahjo.services ORDER BY public_id")).rows);
    const visibleB = await database.withWorkspace(authB, async (client) => (await client.query("SELECT public_id FROM rahjo.services ORDER BY public_id")).rows);
    assert.deepEqual(visibleA.map((row) => row.public_id), ["SVC-ALPHA"]);
    assert.deepEqual(visibleB.map((row) => row.public_id), ["SVC-BETA"]);

    const missingContext = await database.executor.query("SELECT public_id FROM rahjo.services");
    assert.deepEqual(missingContext.rows, []);

    const foreignRead = await database.withWorkspace(authA, (client) => client.query(
      "SELECT public_id FROM rahjo.services WHERE id=$1",
      [serviceB.id]
    ));
    assert.equal(foreignRead.rowCount, 0);
    const foreignUpdate = await database.withWorkspace(authA, (client) => client.query(
      "UPDATE rahjo.services SET name='forbidden' WHERE id=$1 RETURNING id",
      [serviceB.id]
    ));
    assert.equal(foreignUpdate.rowCount, 0);
    const foreignDelete = await database.withWorkspace(authA, (client) => client.query(
      "DELETE FROM rahjo.services WHERE id=$1 RETURNING id",
      [serviceB.id]
    ));
    assert.equal(foreignDelete.rowCount, 0);
    await assert.rejects(
      () => database.withWorkspace(authA, (client) => client.query(
        `INSERT INTO rahjo.services(workspace_id,public_id,name,capability_status,execution_mode)
         VALUES($1,'SVC-FORBIDDEN','Forbidden','active','human')`,
        [workspaceB.id]
      )),
      (error) => error.code === "42501"
    );
    await assert.rejects(
      () => database.executor.query(
        `INSERT INTO rahjo.services(workspace_id,public_id,name,capability_status,execution_mode)
         VALUES($1,'SVC-NO-CONTEXT','No context','active','human')`,
        [workspaceA.id]
      ),
      (error) => error.code === "42501"
    );

    await assert.rejects(
      () => database.withWorkspace(authA, (client) => client.query(
        `INSERT INTO rahjo.service_capabilities
          (workspace_id,service_id,capability_code,eligibility_status,environment_status,risk_class)
         VALUES($1,$2,'cross-tenant','eligible','available','low')`,
        [workspaceA.id, serviceB.id]
      )),
      (error) => error.code === "23503"
    );

    for (let index = 0; index < 8; index += 1) {
      const selected = index % 2 === 0 ? authA : authB;
      const expected = index % 2 === 0 ? "SVC-ALPHA" : "SVC-BETA";
      const result = await database.withWorkspace(selected, async (client) => (await client.query("SELECT public_id FROM rahjo.services")).rows);
      assert.deepEqual(result.map((row) => row.public_id), [expected]);
    }
    assert.notEqual(serviceA.id, serviceB.id);
    assert.equal(await database.verifyWorkspaceBinding(workspaceA.id, "TEAM-A"), true);
    await assert.rejects(
      () => database.verifyWorkspaceBinding(workspaceA.id, "TEAM-B"),
      (error) => error.code === "RELATICLE_TEAM_BINDING_MISMATCH"
    );
  } finally {
    await unsafeOwnerDatabase.close();
    await database.close();
    await admin.end({ timeout: 5 });
  }
});

test("server-backed intake-to-outcome path passes with every model provider absent", { skip: !enabled }, async (t) => {
  for (const key of Object.keys(process.env)) assert.equal(/^((OPENAI|ANTHROPIC|GEMINI|GOOGLE_AI|MISTRAL|COHERE)_.*|RAHJO_LLM_ENABLED)$/.test(key), false, `model variable must be absent: ${key}`);
  const [
    { default: postgres }, { Database }, { RahjoRepository }, { RelaticleClient },
    { createRahjoServer }, { passwordCredential, tokenDigest }
  ] = await Promise.all([
    import("postgres"), import("../src/database.js"), import("../src/repository.js"),
    import("../src/relaticleClient.js"), import("../src/app.js"), import("../src/security.js")
  ]);
  const admin = postgres(process.env.TEST_DATABASE_URL, { max: 1 });
  const database = new Database(process.env.TEST_RAHJO_DATABASE_URL);
  const pepper = process.env.RAHJO_TOKEN_PEPPER;
  const tokenA = "rahjo_e2e_workspace_a_12345678901234567890";
  const tokenB = "rahjo_e2e_workspace_b_12345678901234567890";
  const upstreamTokens = new Map([
    ["relaticle-alpha-token", { workspace: "A", companies: [], people: [] }],
    ["relaticle-beta-token", { workspace: "B", companies: [], people: [] }]
  ]);
  const upstream = createServer(async (request, response) => {
    const token = request.headers.authorization?.slice(7);
    const state = upstreamTokens.get(token);
    if (!state) { response.writeHead(401); response.end("{}"); return; }
    const url = new URL(request.url, "http://localhost");
    const collection = url.pathname.split("/").pop();
    if (request.method === "GET" && collection === "user") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ data: { id: `USER-${state.workspace}`, type: "users", attributes: { name: state.workspace, email: `${state.workspace.toLowerCase()}@example.test` } } }));
      return;
    }
    if (request.method === "GET") {
      const data = collection === "companies" ? state.companies : collection === "people" ? state.people : [];
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ data }));
      return;
    }
    if (request.method === "POST" && (collection === "companies" || collection === "people")) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const target = collection === "companies" ? state.companies : state.people;
      const entity = { id: `${state.workspace}-${collection.toUpperCase()}-${target.length + 1}`, type: collection, attributes: body };
      target.push(entity);
      response.writeHead(201, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ data: entity }));
      return;
    }
    response.writeHead(404); response.end("{}");
  });
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  t.after(() => upstream.close());

  let app;
  try {
    const workspaceSuffix = Math.random().toString(36).slice(2, 10);
    const [workspaceA] = await admin`INSERT INTO rahjo.workspaces(slug,name,relaticle_team_id) VALUES(${`e2e-alpha-${workspaceSuffix}`},'E2E Alpha',${`E2E-TEAM-A-${workspaceSuffix}`}) RETURNING id`;
    const [workspaceB] = await admin`INSERT INTO rahjo.workspaces(slug,name,relaticle_team_id) VALUES(${`e2e-beta-${workspaceSuffix}`},'E2E Beta',${`E2E-TEAM-B-${workspaceSuffix}`}) RETURNING id`;
    const [userA] = await admin`INSERT INTO rahjo.users(email,display_name) VALUES(${`e2e-alpha-${workspaceSuffix}@example.test`},'E2E Alpha Owner') RETURNING id`;
    const [userB] = await admin`INSERT INTO rahjo.users(email,display_name) VALUES(${`e2e-beta-${workspaceSuffix}@example.test`},'E2E Beta Owner') RETURNING id`;
    const [membershipA] = await admin`INSERT INTO rahjo.memberships(workspace_id,user_id,role) VALUES(${workspaceA.id},${userA.id},'owner') RETURNING id`;
    const [membershipB] = await admin`INSERT INTO rahjo.memberships(workspace_id,user_id,role) VALUES(${workspaceB.id},${userB.id},'owner') RETURNING id`;
    const scopes = ["read", "intake:write", "approval:decide", "action:write", "action:execute", "outcome:write"];
    const browserPassword = "a browser e2e password value";
    const browserCredentialA = passwordCredential(browserPassword);
    const browserCredentialB = passwordCredential("a separate beta password value");
    await admin`INSERT INTO rahjo.password_credentials(user_id,password_salt,password_hash) VALUES
      (${userA.id},${browserCredentialA.salt},${browserCredentialA.hash}),
      (${userB.id},${browserCredentialB.salt},${browserCredentialB.hash})`;
    await admin`INSERT INTO rahjo.api_tokens(workspace_id,membership_id,token_hash,label,scopes) VALUES
      (${workspaceA.id},${membershipA.id},${tokenDigest(tokenA, pepper)},'e2e alpha',${scopes}),
      (${workspaceB.id},${membershipB.id},${tokenDigest(tokenB, pepper)},'e2e beta',${scopes})`;
    await admin`INSERT INTO rahjo.services(workspace_id,public_id,name,capability_status,execution_mode,owner_membership_id) VALUES
      (${workspaceA.id},'SVC-E2E','خدمت آزمایشی','active','human',${membershipA.id}),
      (${workspaceB.id},'SVC-E2E','خدمت بتا','active','human',${membershipB.id})`;

    const workspaceTokens = new Map([
      [workspaceA.id, { token: "relaticle-alpha-token", expectedTeamId: `E2E-TEAM-A-${workspaceSuffix}` }],
      [workspaceB.id, { token: "relaticle-beta-token", expectedTeamId: `E2E-TEAM-B-${workspaceSuffix}` }]
    ]);
    const relaticle = new RelaticleClient({ baseUrl: `http://127.0.0.1:${upstream.address().port}/api/v1`, workspaceTokens });
    const repository = new RahjoRepository({ database, relaticle });
    const config = {
      appEnv: "development", publicOrigin: "http://localhost", corsOrigins: ["http://localhost"],
      tokenPepper: pepper, bodyLimit: 64 * 1024, sessionHours: 12
    };
    app = createRahjoServer({ config, database, repository, relaticle, workspaceTokens, logger: { info() {}, error() {} } });
    app.listen(0, "127.0.0.1");
    await once(app, "listening");
    t.after(() => app?.close());
    const base = `http://127.0.0.1:${app.address().port}`;
    const call = (path, { token = tokenA, method = "GET", body, idempotencyKey } = {}) => fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    const login = await fetch(`${base}/api/v1/session`, {
      method: "POST",
      headers: { Origin: "http://localhost", "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceSlug: `e2e-alpha-${workspaceSuffix}`, email: `e2e-alpha-${workspaceSuffix}@example.test`, password: browserPassword })
    });
    assert.equal(login.status, 201);
    let loginData = await login.json();
    let sessionCookie = login.headers.get("set-cookie").split(";")[0];
    const browserCall = (path, { method = "GET", body, idempotencyKey, csrf = true } = {}) => fetch(`${base}${path}`, {
      method,
      headers: {
        Origin: "http://localhost",
        Cookie: sessionCookie,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...(csrf && method !== "GET" ? { "X-CSRF-Token": loginData.csrfToken } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    assert.equal((await browserCall("/api/v1/runtime")).status, 200);
    const staleSessionCookie = sessionCookie;
    const csrfBootstrap = await browserCall("/api/v1/session/csrf", { method: "POST", csrf: false });
    assert.equal(csrfBootstrap.status, 200);
    const csrfBootstrapData = await csrfBootstrap.json();
    assert.match(csrfBootstrapData.csrfToken, /^rahjo_csrf_/);
    loginData = { ...loginData, csrfToken: csrfBootstrapData.csrfToken };
    sessionCookie = csrfBootstrap.headers.get("set-cookie").split(";")[0];
    assert.notEqual(sessionCookie, staleSessionCookie);
    assert.equal((await fetch(`${base}/api/v1/runtime`, {
      headers: { Origin: "http://localhost", Cookie: staleSessionCookie }
    })).status, 401);
    assert.equal((await browserCall("/api/v1/runtime")).status, 200);
    const override = await fetch(`${base}/api/v1/runtime`, { headers: { Origin: "http://localhost", Cookie: sessionCookie, "X-Workspace-Id": workspaceB.id } });
    assert.equal(override.status, 422);

    const intakePayload = { organization: "شركت يارا", contactName: "علی رضایی", phone: "۰۹۱۲۱۲۳۴۵۶۷", purpose: "پیگیری خدمت", serviceId: "SVC-E2E", sourceChannel: "website", attribution: { campaign: "phase-one" } };
    const intake = await browserCall("/api/v1/intakes", { method: "POST", body: intakePayload, idempotencyKey: "intake:e2e:0001" });
    assert.equal(intake.status, 201);
    const intakeData = (await intake.json()).data;
    assert.equal(intakeData.status, "waiting_approval");
    const replay = await browserCall("/api/v1/intakes", { method: "POST", body: intakePayload, idempotencyKey: "intake:e2e:0001" });
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).data.caseId, intakeData.caseId);
    const conflict = await browserCall("/api/v1/intakes", { method: "POST", body: { ...intakePayload, purpose: "different" }, idempotencyKey: "intake:e2e:0001" });
    assert.equal(conflict.status, 409);

    const foreign = await call(`/api/v1/approvals/${encodeURIComponent(intakeData.approvalId)}/decision`, { token: tokenB, method: "POST", body: { decision: "approved" } });
    assert.equal(foreign.status, 404);
    const missingCsrf = await browserCall(`/api/v1/approvals/${encodeURIComponent(intakeData.approvalId)}/decision`, { method: "POST", body: { decision: "approved" }, csrf: false });
    assert.equal(missingCsrf.status, 403);
    const approval = await browserCall(`/api/v1/approvals/${encodeURIComponent(intakeData.approvalId)}/decision`, { method: "POST", body: { decision: "approved" } });
    assert.equal(approval.status, 200);
    const action = await browserCall(`/api/v1/cases/${encodeURIComponent(intakeData.caseId)}/actions`, { method: "POST", body: { actionType: "human-reviewed-service", executionMode: "human" }, idempotencyKey: "action:e2e:0001" });
    assert.equal(action.status, 201);
    const actionData = (await action.json()).data;
    const run = await browserCall(`/api/v1/actions/${encodeURIComponent(actionData.actionId)}/runs`, { method: "POST", body: {} });
    assert.equal(run.status, 201);
    assert.equal((await run.json()).data.resultStatus, "succeeded");
    const outcome = await browserCall(`/api/v1/cases/${encodeURIComponent(intakeData.caseId)}/outcomes`, { method: "POST", body: { reason: "نتیجه با تأیید انسانی ثبت شد" } });
    assert.equal(outcome.status, 201);

    const runtimeA = await browserCall("/api/v1/runtime");
    assert.equal(runtimeA.status, 200);
    const projectionA = (await runtimeA.json()).projection;
    assert.equal(projectionA.cases.find((item) => item.id === intakeData.caseId).status, "resolved");
    assert.equal(projectionA.receipts.length, 1);
    assert.equal(projectionA.outcomes.length, 1);
    assert.equal(projectionA.accounts.length, 1);
    const ids = (items) => new Set(items.map((item) => item.id));
    const serviceIds = ids(projectionA.services);
    const leadIds = ids(projectionA.leads);
    const caseIds = ids(projectionA.cases);
    const approvalIds = ids(projectionA.approvals);
    const actionIds = ids(projectionA.actions);
    const runIds = ids(projectionA.runs);
    const receiptIds = ids(projectionA.receipts);
    for (const item of projectionA.cases) {
      assert.equal(serviceIds.has(item.service_id), true);
      if (item.lead_id) assert.equal(leadIds.has(item.lead_id), true);
    }
    for (const item of projectionA.approvals) assert.equal(caseIds.has(item.case_id), true);
    for (const item of projectionA.actions) {
      assert.equal(caseIds.has(item.case_id), true);
      assert.equal(approvalIds.has(item.approval_id), true);
    }
    for (const item of projectionA.runs) assert.equal(actionIds.has(item.action_id), true);
    for (const item of projectionA.receipts) {
      assert.equal(actionIds.has(item.action_id), true);
      assert.equal(runIds.has(item.run_id), true);
    }
    for (const item of projectionA.outcomes) {
      assert.equal(caseIds.has(item.case_id), true);
      assert.equal(actionIds.has(item.action_id), true);
      assert.equal(receiptIds.has(item.receipt_id), true);
    }
    const runtimeB = await call("/api/v1/runtime", { token: tokenB });
    const projectionB = (await runtimeB.json()).projection;
    assert.equal(projectionB.cases.some((item) => item.id === intakeData.caseId), false);
    assert.equal(projectionB.accounts.length, 0);
    const logout = await browserCall("/api/v1/session/logout", { method: "POST", body: {} });
    assert.equal(logout.status, 204);
    assert.equal((await browserCall("/api/v1/runtime")).status, 401);
  } finally {
    await database.close();
    await admin.end({ timeout: 5 });
  }
});
