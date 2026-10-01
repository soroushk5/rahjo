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
    const [intakeUser] = await admin`INSERT INTO rahjo.users(email,display_name) VALUES('public-intake-alpha@example.test','Alpha Public Intake') RETURNING id`;
    const [intakeMembership] = await admin`INSERT INTO rahjo.memberships(workspace_id,user_id,role) VALUES(${workspaceA.id},${intakeUser.id},'intake') RETURNING id`;
    await admin`INSERT INTO rahjo.public_intake_routes(origin,workspace_id,membership_id,service_id)
      VALUES('https://alpha-intake.example.test',${workspaceA.id},${intakeMembership.id},${serviceA.id})`;

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

    const publicRoute = await database.resolvePublicIntake("https://alpha-intake.example.test");
    assert.equal(publicRoute.workspace_id, workspaceA.id);
    assert.equal(publicRoute.membership_id, intakeMembership.id);
    assert.equal(publicRoute.role, "intake");
    assert.deepEqual(publicRoute.scopes, ["intake:write"]);
    assert.equal(publicRoute.service_id, "SVC-ALPHA");
    assert.equal(await database.resolvePublicIntake("https://unknown.example.test"), null);
    await assert.rejects(
      () => database.executor.query("SELECT origin FROM rahjo.public_intake_routes"),
      (error) => error.code === "42501"
    );

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
    { default: postgres }, { Database }, { CrmRepository }, { RelaticleClient },
    { createCrmServer }, { passwordCredential, tokenDigest }
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
    ["relaticle-alpha-token", { workspace: "A", companies: [], people: [], opportunities: [], tasks: [], notes: [] }],
    ["relaticle-beta-token", { workspace: "B", companies: [], people: [], opportunities: [], tasks: [], notes: [] }]
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
      const data = state[collection] ?? [];
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ data }));
      return;
    }
    if (request.method === "POST" && ["companies", "people", "opportunities", "tasks", "notes"].includes(collection)) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const target = state[collection];
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
  const requestLogs = [];
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
    const repository = new CrmRepository({ database, relaticle });
    const config = {
      appEnv: "development", publicOrigin: "http://localhost", corsOrigins: ["http://localhost"],
      tokenPepper: pepper, bodyLimit: 64 * 1024, sessionHours: 12
    };
    app = createCrmServer({ config, database, repository, relaticle, workspaceTokens, logger: { info(entry) { requestLogs.push(entry); }, error(entry) { requestLogs.push(entry); } } });
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
      body: JSON.stringify({ email: `e2e-alpha-${workspaceSuffix}@example.test`, password: browserPassword })
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
    assert.match(csrfBootstrapData.csrfToken, /^crm_csrf_/);
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

    const contactResponse = await browserCall("/api/v1/contacts", {
      method: "POST",
      body: {
        name: " سارا يوسفی ",
        accountId: intakeData.accountId,
        email: " SARA@example.com ",
        phone: "۰۹۱۲ ۱۲۳ ۴۵۶۷",
        identifiers: [{ type: "client_ref", value: " INV-123 " }]
      }
    });
    assert.equal(contactResponse.status, 201);
    const contactData = (await contactResponse.json()).data;
    assert.equal(contactData.name, "سارا یوسفی");
    assert.equal(contactData.email, "sara@example.com");
    assert.equal(contactData.phone, "09121234567");
    assert.equal(contactData.identifiers.find((item) => item.type === "client_ref").normalizedValue, "INV-123");
    assert.equal(contactData.identifiers.find((item) => item.type === "relaticle_contact_id").uniqueScope, "workspace");
    assert.equal(contactData.identifiers.find((item) => item.type === "rahjo_contact_id").normalizedValue, contactData.coreId);
    assert.equal(JSON.stringify(contactData).includes(" SARA@example.com "), false);

    const opportunityResponse = await browserCall("/api/v1/opportunities", {
      method: "POST",
      body: {
        name: "فرصت نرمال‌سازی",
        accountId: intakeData.accountId,
        contactId: contactData.id,
        amount: { value: "۱۲۳٫۴", unit: "تومان" }
      }
    });
    assert.equal(opportunityResponse.status, 201);
    const opportunityData = (await opportunityResponse.json()).data;
    assert.deepEqual(opportunityData.amount, { currency: "IRR", value: "1234" });

    const dateTaskResponse = await browserCall("/api/v1/tasks", {
      method: "POST",
      body: {
        title: "مهلت فقط‌تاریخ",
        opportunityId: opportunityData.id,
        deadline: { kind: "date-only", value: "۱۴۰۳/۱۲/۳۰", calendar: "jalali" }
      }
    });
    assert.equal(dateTaskResponse.status, 201);
    const dateTaskData = (await dateTaskResponse.json()).data;
    assert.deepEqual(dateTaskData.deadline, { kind: "date-only", value: "2025-03-20", displayCalendar: "jalali" });

    const instantTaskResponse = await browserCall("/api/v1/tasks", {
      method: "POST",
      body: {
        title: "مهلت لحظه‌ای",
        opportunityId: opportunityData.id,
        deadline: { kind: "instant", value: "2024-03-20T09:31:00+03:30", timeZone: "Asia/Tehran" }
      }
    });
    assert.equal(instantTaskResponse.status, 201);
    const instantTaskData = (await instantTaskResponse.json()).data;
    assert.deepEqual(instantTaskData.deadline, { kind: "instant", value: "2024-03-20T06:01:00.000Z", timeZone: "Asia/Tehran" });

    const searchFor = async (params, token = tokenA) => {
      const response = await call(`/api/v1/crm/search?${new URLSearchParams(params)}`, { token });
      assert.equal(response.status, 200);
      return (await response.json()).results;
    };
    assert.equal((await searchFor({ field: "email", value: "SARA@example.com" }))[0].id, contactData.id);
    assert.ok((await searchFor({ field: "phone", value: "۰۹۱۲۱۲۳۴۵۶۷" })).some((item) => item.id === contactData.id));
    assert.equal((await searchFor({ field: "name", value: "سارا یوسفی" }))[0].id, contactData.id);
    assert.equal((await searchFor({ field: "identifier", identifierType: "client_ref", value: "INV-123" }))[0].id, contactData.id);
    assert.equal((await searchFor({ field: "identifier", identifierType: "rahjo_contact_id", value: contactData.coreId }))[0].id, contactData.id);
    assert.equal((await searchFor({ field: "date-only", calendar: "jalali", value: "1403/12/30" }))[0].id, dateTaskData.id);
    assert.equal((await searchFor({ field: "instant", timeZone: "UTC", value: "2024-03-20T06:01:00Z" }))[0].id, instantTaskData.id);
    assert.equal((await searchFor({ field: "money", unit: "تومان", value: "۱۲۳٫۴" }))[0].id, opportunityData.id);
    assert.equal(JSON.stringify(requestLogs).includes("SARA@example.com"), false);
    const invalidSearch = await call(`/api/v1/crm/search?${new URLSearchParams({ field: "email", value: "raw-secret-not-an-email" })}`, { token: tokenA });
    assert.equal(invalidSearch.status, 422);
    assert.equal(JSON.stringify(await invalidSearch.json()).includes("raw-secret-not-an-email"), false);
    assert.equal(JSON.stringify(requestLogs).includes("raw-secret-not-an-email"), false);
    assert.deepEqual(await searchFor({ field: "email", value: "sara@example.com" }, tokenB), []);

    await admin`INSERT INTO rahjo.crm_entity_refs(workspace_id, entity_type, rahjo_id, relaticle_id, snapshot)
      SELECT ${workspaceA.id}, 'contact', 'BULK-CON-' || n::text, 'BULK-REL-' || n::text,
             jsonb_build_object('name', 'آزمون مخاطب ' || n::text)
        FROM generate_series(1, 2001) AS n`;

    const importResponse = await browserCall("/api/v1/import/contacts", {
      method: "POST",
      body: {
        sourceName: "درون‌ریزی آزمون",
        rows: [
          {
            name: "سارا یوسفی", email: " SARA@example.com ", phone: "09121234567",
            identifiers: [{ type: "relaticle_contact_id", value: contactData.id }, { type: "client_ref", value: "INV-123" }]
          },
          { name: "رکورد با تلفن تکراری", phone: "۰۹۱۲۱۲۳۴۵۶۷" },
          { name: "سارا یوسفیان" },
          { name: "رکورد با ایمیل تکراری", email: "sara@example.com" }
        ]
      }
    });
    const importResponseBody = await importResponse.json();
    assert.equal(importResponse.status, 202, JSON.stringify({ body: importResponseBody, serverErrors: requestLogs.filter((entry) => entry.status >= 500) }));
    const importData = importResponseBody.data;
    assert.equal(importData.fuzzyCandidatesTruncated, true);
    assert.equal(importData.rows[0].candidates[0].evidence, "authoritative_identifier");
    assert.equal(importData.rows[0].candidates[0].candidateRef === undefined, false);
    assert.ok(importData.rows[0].candidates.every((item) => item.reviewRequired && !item.autoMerge));
    assert.ok(importData.rows[1].candidates.some((item) => item.evidence === "exact_phone"));
    assert.ok(importData.rows[1].candidates.some((item) => item.candidateImportRowId === importData.rows[0].rowId));
    assert.ok(importData.rows[2].candidates.some((item) => item.evidence === "fuzzy_review"));
    assert.ok(importData.rows[3].candidates.some((item) => item.evidence === "exact_email"));
    assert.equal(JSON.stringify(importData).includes("sara@example.com"), false);
    assert.equal(JSON.stringify(importData).includes(" SARA@example.com "), false);
    const importReloadResponse = await browserCall(`/api/v1/import/contacts/${encodeURIComponent(importData.batchId)}`);
    assert.equal(importReloadResponse.status, 200);
    const importReload = (await importReloadResponse.json()).data;
    assert.equal(importReload.rows.length, 4);
    assert.equal(JSON.stringify(importReload).includes("sara@example.com"), true);
    assert.equal(importReload.rows[0].candidates[0].evidence, "authoritative_identifier");
    assert.equal(importReload.fuzzyCandidatesTruncated, true);
    assert.ok(importReload.rows[1].candidates.some((item) => item.candidateImportRowId === importData.rows[0].rowId));
    assert.equal(JSON.stringify(importReload).includes(" SARA@example.com "), false);
    const importedRaw = await admin`SELECT raw_values, retention_until FROM rahjo.crm_restricted_raw_values
      WHERE workspace_id=${workspaceA.id} AND import_row_id=${importData.rows[0].rowId}`;
    assert.equal(importedRaw.length, 1);
    assert.equal(importedRaw[0].raw_values.email, " SARA@example.com ");
    assert.equal(importedRaw[0].retention_until, null);
    const contactRaw = await admin`SELECT raw_values FROM rahjo.crm_restricted_raw_values
      WHERE workspace_id=${workspaceA.id}
        AND entity_ref_id=(SELECT id FROM rahjo.crm_entity_refs WHERE workspace_id=${workspaceA.id} AND relaticle_id=${contactData.id})`;
    assert.equal(contactRaw[0].raw_values.name, " سارا يوسفی ");
    assert.equal(contactRaw[0].raw_values.email, " SARA@example.com ");
    await admin.begin(async (tx) => {
      await tx`SET LOCAL ROLE rahjo_worker`;
      await tx`SELECT set_config('rahjo.workspace_id', ${workspaceA.id}, true)`;
      const workerRowsA = await tx`SELECT id FROM rahjo.crm_restricted_raw_values WHERE workspace_id=${workspaceA.id}`;
      assert.ok(workerRowsA.length >= 2);
      await tx`SELECT set_config('rahjo.workspace_id', ${workspaceB.id}, true)`;
      const workerRowsB = await tx`SELECT id FROM rahjo.crm_restricted_raw_values WHERE workspace_id=${workspaceA.id}`;
      assert.equal(workerRowsB.length, 0);
      const deletedRowsB = await tx`DELETE FROM rahjo.crm_restricted_raw_values WHERE workspace_id=${workspaceA.id} RETURNING id`;
      assert.equal(deletedRowsB.length, 0);
    });
    const authA = await database.authenticate(tokenDigest(tokenA, pepper));
    await assert.rejects(
      () => database.withWorkspace(authA, (client) => client.query(
        "SELECT raw_values FROM rahjo.crm_restricted_raw_values WHERE workspace_id=$1",
        [workspaceA.id]
      )),
      (error) => error.code === "42501"
    );
    const crossWorkspaceImport = await call(`/api/v1/import/contacts/${encodeURIComponent(importData.batchId)}`, { token: tokenB });
    assert.equal(crossWorkspaceImport.status, 404);

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
    assert.equal(projectionA.contacts.find((item) => item.id === contactData.id).email, "sara@example.com");
    assert.equal(projectionA.contacts.find((item) => item.id === contactData.id).identifiers.find((item) => item.type === "client_ref").normalizedValue, "INV-123");
    assert.deepEqual(projectionA.opportunities.find((item) => item.id === opportunityData.id).amount, { currency: "IRR", value: "1234" });
    assert.deepEqual(projectionA.tasks.find((item) => item.id === dateTaskData.id).deadline, { kind: "date-only", value: "2025-03-20", displayCalendar: "jalali" });
    assert.deepEqual(projectionA.tasks.find((item) => item.id === instantTaskData.id).deadline, { kind: "instant", value: "2024-03-20T06:01:00.000Z", timeZone: "Asia/Tehran" });
    assert.equal(JSON.stringify(projectionA).includes(" SARA@example.com "), false);
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
