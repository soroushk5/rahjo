import assert from "node:assert/strict";
import test from "node:test";
import { createRahjoServer } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { payloadDigest } from "../src/security.js";

const origin = "https://www.rahjo.example";
const pepper = "p".repeat(40);
const token = "t".repeat(40);

function baseConfig(overrides = {}) {
  return {
    appEnv: "development",
    bodyLimit: 64 * 1024,
    corsOrigins: [origin],
    crmMode: "native_deferred",
    interim: true,
    publicOrigin: "http://127.0.0.1:8787",
    publicIntakeEnabled: true,
    publicIntakeOrigin: origin,
    publicIntakeWorkspaceSlug: "rahjo",
    publicIntakeToken: token,
    publicIntakeServiceId: "SRV-WEBSITE-INTAKE",
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
    workspace_slug: "rahjo",
    workspace_name: "Rahjo",
    membership_id: "mem-intake",
    user_id: "user-intake",
    role: "intake",
    scopes: ["intake:write"]
  };
  const database = {
    async authenticate() { return context; },
    async ready() { return { role: "rahjo_app" }; },
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
  const server = createRahjoServer({ ...deps, logger: { info() {}, error() {} } });
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

test("public intake config is feature-gated and binds origin/workspace/service server-side", () => {
  const env = {
    NODE_ENV: "development",
    RAHJO_CRM_MODE: "native_deferred",
    RAHJO_INTERIM_ACK: "true",
    RAHJO_DATABASE_URL: "postgres://example.invalid/rahjo",
    RAHJO_TOKEN_PEPPER: pepper,
    RAHJO_CORS_ORIGINS: origin,
    RAHJO_PUBLIC_ORIGIN: "http://127.0.0.1:8787",
    RAHJO_PUBLIC_INTAKE_ENABLED: "true",
    RAHJO_PUBLIC_INTAKE_ORIGIN: origin,
    RAHJO_PUBLIC_INTAKE_WORKSPACE_SLUG: "rahjo",
    RAHJO_PUBLIC_INTAKE_TOKEN: token,
    RAHJO_PUBLIC_INTAKE_SERVICE_ID: "SRV-WEBSITE-INTAKE"
  };
  const config = loadConfig(env);
  assert.equal(config.publicIntakeEnabled, true);
  assert.equal(config.publicIntakeOrigin, origin);
  assert.equal(config.publicIntakeWorkspaceSlug, "rahjo");
  assert.equal(config.publicIntakeServiceId, "SRV-WEBSITE-INTAKE");
  assert.equal(payloadDigest(config.publicIntakeToken).length, 64);
});
