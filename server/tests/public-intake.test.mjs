import assert from "node:assert/strict";
import test from "node:test";
import { createCrmServer } from "../src/app.js";
import { loadConfig } from "../src/config.js";

const origin = "https://www.crm.example";
const pepper = "p".repeat(40);

function baseConfig(overrides = {}) {
  return {
    appEnv: "development",
    bodyLimit: 64 * 1024,
    corsOrigins: [origin],
    crmMode: "native_deferred",
    interim: true,
    publicOrigin: "http://127.0.0.1:8787",
    publicIntakeEnabled: true,
    publicIntakeMaxRequests: 20,
    publicIntakeWindowMs: 600_000,
    sessionHours: 12,
    tokenPepper: pepper,
    ...overrides
  };
}

function dependencies(config = baseConfig()) {
  const captured = [];
  const context = {
    workspace_id: "ws-1",
    workspace_slug: "default",
    workspace_name: "CRM",
    membership_id: "mem-intake",
    user_id: "user-intake",
    role: "intake",
    scopes: ["intake:write"]
  };
  const database = {
    async resolvePublicIntake(receivedOrigin) {
      if (receivedOrigin !== origin) return null;
      return { ...context, service_id: "SRV-WEBSITE-INTAKE" };
    },
    async ready() { return { role: "crm_app" }; },
    async authenticateSession() { return null; },
    async lookupPassword() { return null; }
  };
  const repository = {
    async createIntake(receivedContext, input, idempotencyKey, requestId) {
      captured.push({ receivedContext, input, idempotencyKey, requestId });
      return {
        status: 201,
        replayed: false,
        data: {
          caseId: "CASE-secret-internal",
          serviceId: input.serviceId,
          accountId: "ACC-secret-internal",
          status: "waiting_approval"
        }
      };
    }
  };
  const relaticle = {};
  return { config, database, repository, relaticle, workspaceTokens: new Map(), captured };
}

async function withServer(deps, callback) {
  const server = createCrmServer({ ...deps, logger: { info() {}, error() {} } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  try {
    await callback(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function intakePayload(overrides = {}) {
  return {
    organization: " شرکت نمونه ",
    contactName: " سارا محمدی ",
    email: "sara@example.com",
    phone: "۰۹۱۲۱۲۳۴۵۶۷",
    purpose: "برای مدیریت پیگیری مشتری و پرونده‌ها",
    serviceId: "ATTACKER-CONTROLLED-SERVICE",
    attribution: {
      utmSource: "newsletter",
      utmCampaign: "launch",
      landingPath: "/contact",
      ignored: "must-not-pass"
    },
    ...overrides
  };
}

async function submit(base, { key = "web-12345678", body = intakePayload(), requestOrigin = origin } = {}) {
  return fetch(`${base}/api/v1/public/intakes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
      Origin: requestOrigin
    },
    body: JSON.stringify(body)
  });
}

test("public intake is anonymous, server-scoped, idempotent and does not leak CRM ids", async () => {
  const deps = dependencies();
  await withServer(deps, async (base) => {
    const response = await submit(base);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    assert.equal(response.headers.get("access-control-allow-credentials"), null);
    const payload = await response.json();
    assert.deepEqual(payload, { dataMode: "server", replayed: false, status: "received" });
    assert.equal(JSON.stringify(payload).includes("CASE-secret-internal"), false);
    assert.equal(deps.captured.length, 1);
    assert.equal(deps.captured[0].receivedContext.role, "intake");
    assert.equal(deps.captured[0].idempotencyKey, "web-12345678");
    assert.equal(deps.captured[0].input.serviceId, "SRV-WEBSITE-INTAKE");
    assert.equal(deps.captured[0].input.sourceChannel, "website");
    assert.equal(deps.captured[0].input.attribution.ignored, undefined);
    assert.equal(deps.captured[0].input.attribution.landingPath, "/contact");
  });
});

test("public intake rejects workspace and service steering from the browser", async () => {
  const deps = dependencies();
  await withServer(deps, async (base) => {
    const response = await submit(base, { body: intakePayload({ workspaceId: "other-workspace" }) });
    assert.equal(response.status, 422);
    const payload = await response.json();
    assert.equal(payload.code, "VALIDATION_FAILED");
    assert.equal(deps.captured.length, 0);
  });
});

test("public intake requires the exact configured origin", async () => {
  const deps = dependencies();
  await withServer(deps, async (base) => {
    const response = await submit(base, { requestOrigin: "https://evil.example" });
    assert.equal(response.status, 403);
    assert.equal(deps.captured.length, 0);
  });
});

test("disabled public intake is not discoverable", async () => {
  const deps = dependencies(baseConfig({ publicIntakeEnabled: false }));
  await withServer(deps, async (base) => {
    const response = await submit(base);
    assert.equal(response.status, 404);
    const payload = await response.json();
    assert.equal(payload.code, "NOT_FOUND");
    assert.equal(deps.captured.length, 0);
  });
});

test("public intake returns explicit 429 with Retry-After", async () => {
  const deps = dependencies(baseConfig({ publicIntakeMaxRequests: 1 }));
  await withServer(deps, async (base) => {
    const first = await submit(base, { key: "web-aaaaaaaa" });
    assert.equal(first.status, 201);
    const second = await submit(base, { key: "web-bbbbbbbb" });
    assert.equal(second.status, 429);
    assert.match(second.headers.get("retry-after") ?? "", /^\d+$/);
    const payload = await second.json();
    assert.equal(payload.code, "RATE_LIMITED");
    assert.equal(payload.dataMode, "server");
  });
});

test("public intake is enabled by default and requires no intake secret", () => {
  const env = {
    NODE_ENV: "development",
    CRM_MODE: "native_deferred",
    CRM_INTERIM_ACK: "true",
    CRM_DATABASE_URL: "postgres://example.invalid/crm",
    CRM_TOKEN_PEPPER: pepper,
    CRM_CORS_ORIGINS: origin,
    CRM_PUBLIC_ORIGIN: "http://127.0.0.1:8787"
  };
  const config = loadConfig(env);
  assert.equal(config.publicIntakeEnabled, true);
  assert.equal(Object.hasOwn(config, "publicIntakeToken"), false);
  assert.equal(Object.hasOwn(config, "publicIntakeWorkspaceSlug"), false);
  assert.equal(Object.hasOwn(config, "publicIntakeServiceId"), false);

  const disabled = loadConfig({ ...env, CRM_PUBLIC_INTAKE_ENABLED: "false" });
  assert.equal(disabled.publicIntakeEnabled, false);
});

test("public intake returns 404 when the origin has no server-owned route", async () => {
  const deps = dependencies();
  deps.database.resolvePublicIntake = async () => null;
  await withServer(deps, async (base) => {
    const response = await submit(base);
    assert.equal(response.status, 404);
    assert.equal(deps.captured.length, 0);
  });
});
