import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import {
  asciiDigits,
  CANONICAL_UNIQUE_IDENTIFIER_SCOPES,
  normalizeCrmDate,
  normalizeCurrencyCode,
  normalizeEmail,
  normalizeEqualityValue,
  normalizeIdentifier,
  normalizeIntake,
  normalizeIranMoney,
  normalizePersianText,
  normalizePhone,
  rankDedupeCandidates,
  requiredIdempotencyKey,
  toJalaliDate
} from "../src/normalization.js";
import { passwordCredential, payloadDigest, verifyPassword } from "../src/security.js";

const validEnv = {
  NODE_ENV: "production",
  CRM_DATABASE_URL: "postgresql://rahjo_app:secret@postgres/relaticle",
  CRM_TOKEN_PEPPER: "p".repeat(32),
  RELATICLE_BASE_URL: "http://relaticle-app:8080/api/v1",
  RELATICLE_MCP_URL: "http://relaticle-app:8080/mcp",
  RELATICLE_TOKEN_FILE: "/run/secrets/map.json",
  CRM_CORS_ORIGINS: "https://crm.example,https://app.crm.example",
  CRM_PUBLIC_ORIGIN: "https://api.crm.example",
  CRM_ALLOW_INTERNAL_HTTP: "true"
};

test("production configuration is server-only and no-LLM", () => {
  const config = loadConfig(validEnv);
  assert.equal(config.dataMode, "server");
  assert.equal(config.llmEnabled, false);
  assert.equal(config.port, 8787);
  assert.deepEqual(config.corsOrigins, ["https://crm.example", "https://app.crm.example"]);
  assert.equal(config.relaticleBaseUrl, "http://relaticle-app:8080/api/v1");
  assert.equal(config.relaticleMcpUrl, "http://relaticle-app:8080/mcp");
  assert.equal(config.publicIntakeEnabled, true);
  assert.equal(Object.hasOwn(config, "publicIntakeToken"), false);
});

test("managed web app PORT takes precedence over the local default", () => {
  const config = loadConfig({ ...validEnv, PORT: "3100", CRM_API_PORT: "8787" });
  assert.equal(config.port, 3100);
});

test("configuration rejects an enabled model provider and insecure public URLs", () => {
  assert.throws(() => loadConfig({ ...validEnv, CRM_LLM_ENABLED: "true" }), /disabled/);
  assert.throws(() => loadConfig({ ...validEnv, CRM_PUBLIC_ORIGIN: "http://api.crm.example" }), /HTTPS/);
  assert.throws(() => loadConfig({ ...validEnv, CRM_CORS_ORIGINS: "*" }));
});

test("native deferred bridge is explicit and cannot activate accidentally", () => {
  assert.throws(() => loadConfig({ ...validEnv, CRM_MODE: "native_deferred" }), /INTERIM_ACK/);
  const config = loadConfig({
    ...validEnv,
    CRM_MODE: "native_deferred",
    CRM_INTERIM_ACK: "true",
    RELATICLE_BASE_URL: "",
    RELATICLE_MCP_URL: "",
    RELATICLE_TOKEN_FILE: ""
  });
  assert.equal(config.crmMode, "native_deferred");
  assert.equal(config.interim, true);
  assert.equal(config.relaticleBaseUrl, "");
});

test("Persian normalization preserves original meaning while normalizing keys", () => {
  assert.equal(normalizePersianText("  شركت يارا  "), "شرکت یارا");
  assert.equal(normalizePersianText("  شرکت\t  یارا  "), "شرکت یارا");
  assert.equal(normalizePersianText("Ａ"), "A");
  assert.equal(normalizePersianText("می\u200cروم\u200b"), "می\u200cروم\u200b");
  assert.equal(asciiDigits("۰۹۱٢٣٤٥٦٧٨٩٠"), "091234567890");
  assert.equal(normalizePhone("۰۹۱۲ ۱۲۳ ۴۵۶۷"), "09121234567");
  assert.equal(normalizePhone("+٩٨ ٩١٢-١٢٣-٤٥٦٧"), "+989121234567");
  assert.equal(normalizeEmail(" Test۰@example.com "), "test0@example.com");
  assert.equal(normalizeEmail("TEST٠@example.com"), "test0@example.com");
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

test("equivalent mixed Persian and Arabic intake variants produce the same identity key", () => {
  const base = normalizeIntake({
    organization: "شركت يارا",
    contactName: "علي رضايي",
    email: "Sales۰@example.com",
    phone: "۰۹۱۲۱۲۳۴۵۶۷",
    purpose: "پیگیری درخواست",
    serviceId: "SVC-001"
  });
  const mixed = normalizeIntake({
    organization: " شركت ىارا ",
    contactName: "علی رضایی",
    email: "SALES٠@example.com",
    phone: "٠٩١٢ ١٢٣ ٤٥٦٧",
    purpose: "پیگیری درخواست",
    serviceId: "SVC-001"
  });
  const equivalent = normalizeIntake({
    organization: "شرکت يارا",
    contactName: "علي رضايي",
    email: "sales0@example.com",
    phone: "09121234567",
    purpose: "پیگیری درخواست",
    serviceId: "SVC-001"
  });

  assert.deepEqual(
    [base.normalizedOrganization, base.email, base.phone],
    [equivalent.normalizedOrganization, equivalent.email, equivalent.phone]
  );
  assert.deepEqual(
    [mixed.normalizedOrganization, mixed.email, mixed.phone],
    [base.normalizedOrganization, "sales0@example.com", "09121234567"]
  );
});

test("normalization validates required text, contact channels, email, and phone bounds", () => {
  assert.throws(() => normalizePersianText("   ", { required: true }), /empty/);
  assert.throws(() => normalizePersianText("طولانی", { max: 2 }), /exceeds 2/);
  assert.throws(() => normalizeEmail("not-an-email"), /Email is invalid/);
  assert.throws(() => normalizePhone("۱۲۳۴۵۶۷"), /Phone is invalid/);
  assert.throws(() => normalizeIntake({
    organization: "شرکت",
    contactName: "نام",
    purpose: "پیگیری",
    serviceId: "SVC-001"
  }), /At least one contact channel/);
});

test("approved Persian text, digits, whitespace, and ZWNJ rules remain field-scoped", () => {
  assert.equal(normalizePersianText("  شركت يارا كيان  "), "شرکت یارا کیان");
  assert.equal(normalizePersianText("شرکت\t  یارا"), "شرکت یارا");
  assert.equal(normalizePersianText("می\u200cروم"), "می\u200cروم");
  assert.equal(normalizePersianText("می روم"), "می روم");
  assert.notEqual(normalizeEqualityValue("text", "می\u200cروم"), normalizeEqualityValue("text", "می روم"));
  assert.equal(asciiDigits("۰۱۲٣٤٥٦٧٨٩"), "0123456789");
  assert.equal(normalizePhone("+٩٨ ٩١٢-١٢٣-٤٥٦٧"), "+989121234567");
  assert.notEqual(normalizePhone("۰۹۱۲۱۲۳۴۵۶۷"), normalizePhone("+۹۸۹۱۲۱۲۳۴۵۶۷"));
});

test("Jalali input converts deterministically to a Gregorian date-only value", () => {
  assert.deepEqual(
    normalizeCrmDate({ kind: "date-only", value: "۱۴۰۳/۱۲/۳۰", calendar: "jalali" }),
    { kind: "date-only", value: "2025-03-20", displayCalendar: "jalali" }
  );
  assert.deepEqual(
    normalizeCrmDate({ kind: "date-only", value: "2024-03-20", calendar: "gregorian" }),
    { kind: "date-only", value: "2024-03-20", displayCalendar: "gregorian" }
  );
  assert.equal(toJalaliDate("2025-03-20"), "1403-12-30");
  assert.throws(() => normalizeCrmDate({ kind: "date-only", value: "1402/12/30", calendar: "jalali" }), /invalid/);
  assert.throws(() => normalizeCrmDate({ kind: "date-only", value: "2024-02-30", calendar: "gregorian" }), /invalid/);
  assert.throws(() => normalizeCrmDate({ kind: "date-only", value: "2024-03-20" }), /calendar/);
});

test("instants require an explicit RFC 3339 offset and a recognized IANA timezone", () => {
  assert.deepEqual(
    normalizeCrmDate({ kind: "instant", value: "2024-03-20T09:31:00+03:30" }),
    { kind: "instant", value: "2024-03-20T06:01:00.000Z", timeZone: "Asia/Tehran" }
  );
  assert.equal(normalizeCrmDate({ kind: "instant", value: "2024-03-20T06:01:00Z", timeZone: "UTC" }).value, "2024-03-20T06:01:00.000Z");
  assert.throws(() => normalizeCrmDate({ kind: "instant", value: "2024-03-20T06:01:00" }), /offset/);
  assert.throws(() => normalizeCrmDate({ kind: "instant", value: "2024-03-20T06:01:00Z", timeZone: "Mars/Olympus" }), /Timezone/);
  assert.throws(() => normalizeCrmDate({ kind: "instant", value: "2024-02-30T06:01:00Z" }), /invalid/);
});

test("Iranian money uses exact IRR integers and explicit toman conversion", () => {
  assert.deepEqual(normalizeIranMoney("۱۲۳٫۴", "تومان"), { currency: "IRR", amount: "1234", inputUnit: "TOMAN" });
  assert.deepEqual(normalizeIranMoney("12.00", "IRR"), { currency: "IRR", amount: "12", inputUnit: "IRR" });
  assert.equal(normalizeIranMoney("1.00", "TOMAN").amount, "10");
  assert.equal(normalizeCurrencyCode("irr"), "IRR");
  assert.equal(normalizeCurrencyCode("USD"), "USD");
  assert.throws(() => normalizeIranMoney(12, "IRR"), /string/);
  assert.throws(() => normalizeIranMoney("12.01", "TOMAN"), /precision/);
  assert.throws(() => normalizeIranMoney("12.1", "IRR"), /integer/);
  assert.throws(() => normalizeIranMoney("12", ""), /explicitly/);
});

test("identifier raw values stay separate and only a canonical registry can declare uniqueness", () => {
  assert.deepEqual(CANONICAL_UNIQUE_IDENTIFIER_SCOPES, {});
  const value = normalizeIdentifier("national_id", "۰۰۱٢٣", { numeric: true, uniqueScopes: { national_id: "workspace" } });
  assert.deepEqual(value, {
    canonical: { type: "national_id", normalizedValue: "00123", uniqueScope: null },
    raw: { value: "۰۰۱٢٣" }
  });
  const unknownType = normalizeIdentifier("external_ref", "٠٠١٢٣", { numeric: true });
  assert.equal(unknownType.canonical.uniqueScope, null);
  assert.deepEqual(normalizeEqualityValue("identifier", "۰۰۱٢٣", { type: "national_id", numeric: true }), {
    type: "national_id", normalizedValue: "00123", uniqueScope: null
  });
  assert.throws(() => normalizeIdentifier("national id", "123"), /type is invalid/);
});

test("dedupe ranks authoritative IDs before exact phone/email and fuzzy matches stay review-only", () => {
  const incoming = {
    workspaceId: "ws-1",
    phone: "09121234567",
    email: "sales@example.com",
    identifiers: [{ type: "registry_id", normalizedValue: "00012", uniqueScope: "workspace", scopeKey: "ws-1" }]
  };
  const ranked = rankDedupeCandidates(incoming, [
    { id: "fuzzy", workspaceId: "ws-1" },
    { id: "phone", workspaceId: "ws-1", phone: "09121234567" },
    { id: "authoritative", workspaceId: "ws-1", phone: "09121234567", identifiers: [{ type: "registry_id", normalizedValue: "00012", uniqueScope: "workspace", scopeKey: "ws-1" }] },
    { id: "wrong-type", workspaceId: "ws-1", identifiers: [{ type: "tax_id", normalizedValue: "00012", uniqueScope: "workspace", scopeKey: "ws-1" }] },
    { id: "other-workspace", workspaceId: "ws-2", phone: "09121234567" }
  ], ["fuzzy"]);
  assert.deepEqual(ranked.map(({ candidateId, evidence }) => [candidateId, evidence]), [
    ["authoritative", "authoritative_identifier"],
    ["phone", "exact_phone"],
    ["fuzzy", "fuzzy_review"]
  ]);
  assert.ok(ranked.every((candidate) => candidate.reviewRequired && !candidate.autoMerge));
});

test("intake keeps raw values separate from canonical values and limits captured fields", () => {
  const rawInput = {
    organization: " شركت يارا ",
    contactName: "علي",
    email: " Sales۰@example.com ",
    phone: "۰۹۱۲ ۱۲۳ ۴۵۶۷",
    purpose: "درخواست",
    serviceId: "SVC-1",
    unknownSecret: "must-not-be-captured",
    attribution: { utmCampaign: " کمپین ", unknown: "drop" }
  };
  const intake = normalizeIntake(rawInput);
  assert.equal(intake.organization, "شرکت یارا");
  assert.equal(intake.email, "sales0@example.com");
  assert.equal(intake.rawValues.organization, " شركت يارا ");
  assert.equal(intake.rawValues.phone, "۰۹۱۲ ۱۲۳ ۴۵۶۷");
  assert.deepEqual(intake.rawValues.attribution, { utmCampaign: " کمپین " });
  assert.deepEqual(intake.attribution, { utmCampaign: "کمپین" });
  assert.equal(Object.hasOwn(intake.rawValues, "unknownSecret"), false);
  assert.equal(Object.hasOwn(intake.attribution, "unknown"), false);
  assert.equal(Object.hasOwn(intake, "rawOrganization"), false);
});

test("idempotency and credential hashing are deterministic without storing cleartext", () => {
  assert.equal(requiredIdempotencyKey("intake:abc-123"), "intake:abc-123");
  assert.throws(() => requiredIdempotencyKey("short"));
  assert.equal(payloadDigest({ b: 2, a: 1 }), payloadDigest({ a: 1, b: 2 }));
  const credential = passwordCredential("a sufficiently long password");
  assert.equal(verifyPassword("a sufficiently long password", credential.salt, credential.hash), true);
  assert.equal(verifyPassword("wrong password value", credential.salt, credential.hash), false);
});
