import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { asciiDigits, normalizeEmail, normalizeIntake, normalizePersianText, normalizePhone, requiredIdempotencyKey } from "../src/normalization.js";
import { passwordCredential, payloadDigest, verifyPassword } from "../src/security.js";

const validEnv = {
  NODE_ENV: "production",
  RAHJO_DATABASE_URL: "postgresql://rahjo_app:secret@postgres/relaticle",
  RAHJO_TOKEN_PEPPER: "p".repeat(32),
  RELATICLE_BASE_URL: "http://relaticle-app:8080/api/v1",
  RELATICLE_MCP_URL: "http://relaticle-app:8080/mcp",
  RELATICLE_TOKEN_FILE: "/run/secrets/map.json",
  RAHJO_CORS_ORIGINS: "https://rahjo.ir,https://app.rahjo.ir",
  RAHJO_PUBLIC_ORIGIN: "https://api.rahjo.ir",
  RAHJO_ALLOW_INTERNAL_HTTP: "true"
};

test("production configuration is server-only and no-LLM", () => {
  const config = loadConfig(validEnv);
  assert.equal(config.dataMode, "server");
  assert.equal(config.llmEnabled, false);
  assert.deepEqual(config.corsOrigins, ["https://rahjo.ir", "https://app.rahjo.ir"]);
  assert.equal(config.relaticleBaseUrl, "http://relaticle-app:8080/api/v1");
  assert.equal(config.relaticleMcpUrl, "http://relaticle-app:8080/mcp");
});

test("configuration rejects an enabled model provider and insecure public URLs", () => {
  assert.throws(() => loadConfig({ ...validEnv, RAHJO_LLM_ENABLED: "true" }), /forbids/);
  assert.throws(() => loadConfig({ ...validEnv, RAHJO_PUBLIC_ORIGIN: "http://api.rahjo.ir" }), /HTTPS/);
  assert.throws(() => loadConfig({ ...validEnv, RAHJO_CORS_ORIGINS: "*" }));
});

test("Persian normalization preserves original meaning while normalizing keys", () => {
  assert.equal(normalizePersianText("  شركت يارا  "), "شرکت یارا");
  assert.equal(asciiDigits("۰۹۱٢"), "0912");
  assert.equal(normalizePhone("۰۹۱۲ ۱۲۳ ۴۵۶۷"), "09121234567");
  assert.equal(normalizeEmail(" Test۰@example.com "), "test0@example.com");
  const intake = normalizeIntake({
    organization: "شركت يارا",
    contactName: "علی رضایی",
    phone: "۰۹۱۲۱۲۳۴۵۶۷",
    purpose: "پیگیری درخواست",
    serviceId: "SVC-001"
  });
  assert.equal(intake.organization, "شرکت یارا");
  assert.equal(intake.normalizedOrganization, "شرکت یارا");
  assert.equal(intake.sourceChannel, "website");
});

test("idempotency and credential hashing are deterministic without storing cleartext", () => {
  assert.equal(requiredIdempotencyKey("intake:abc-123"), "intake:abc-123");
  assert.throws(() => requiredIdempotencyKey("short"));
  assert.equal(payloadDigest({ b: 2, a: 1 }), payloadDigest({ a: 1, b: 2 }));
  const credential = passwordCredential("a sufficiently long password");
  assert.equal(verifyPassword("a sufficiently long password", credential.salt, credential.hash), true);
  assert.equal(verifyPassword("wrong password value", credential.salt, credential.hash), false);
});
