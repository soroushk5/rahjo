import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyProviderFailure,
  computeProviderRetryDelay,
  planProviderRecovery
} from "../src/domain/providerResilience.js";
import {
  classifyConnectorFailure,
  planConnectorRecovery,
  recordCompletedMutation,
  shouldExecuteMutation
} from "../src/domain/connectorResilience.js";
import { buildScopedContext } from "../src/domain/contextIntegrity.js";
import { assessTranscript } from "../src/domain/transcriptIntake.js";

test("T75: temporary 429 is bounded and Retry-After aware", () => {
  const error = { status: 429, code: "rate_limit_exceeded", retryAfterMs: 1200 };
  assert.equal(classifyProviderFailure(error), "TRANSIENT_RATE_LIMIT");
  assert.equal(computeProviderRetryDelay({ attempt: 0, retryAfterMs: 1200 }), 1200);

  const retry = planProviderRecovery({ error, attempt: 0, maxAttempts: 2 });
  assert.equal(retry.action, "RETRY");
  assert.equal(retry.delayMs, 1200);

  const exhausted = planProviderRecovery({
    error,
    attempt: 2,
    maxAttempts: 2,
    fallbackAvailable: false,
    localAvailable: true
  });
  assert.equal(exhausted.action, "LOCAL");
});

test("T76: quota and regional access failures do not enter a retry loop", () => {
  const quota = { status: 429, code: "insufficient_quota", message: "billing quota exhausted" };
  const region = { status: 403, code: "unsupported_country", message: "region policy blocks access" };

  assert.equal(classifyProviderFailure(quota), "QUOTA_OR_BILLING_LIMIT");
  assert.equal(classifyProviderFailure(region), "REGION_OR_POLICY");
  assert.equal(planProviderRecovery({ error: quota, attempt: 0 }).action, "FALLBACK_PROVIDER");
  assert.equal(
    planProviderRecovery({
      error: region,
      attempt: 0,
      fallbackAvailable: false,
      localAvailable: false
    }).action,
    "NO_LLM"
  );
});

test("T77: Drive-style quota failures degrade safely and mutations stay idempotent", () => {
  const quota403 = { status: 403, reason: "userRateLimitExceeded" };
  const quota429 = { status: 429, reason: "rateLimitExceeded", retryAfterMs: 900 };
  const forbidden = { status: 403, reason: "insufficientPermissions" };

  assert.equal(classifyConnectorFailure(quota403), "USAGE_LIMIT");
  assert.equal(classifyConnectorFailure(quota429), "USAGE_LIMIT");
  assert.equal(classifyConnectorFailure(forbidden), "AUTH_OR_PERMISSION");

  const retry = planConnectorRecovery({ error: quota429, attempt: 0, maxAttempts: 1, hasSnapshot: true });
  assert.equal(retry.action, "RETRY");
  assert.equal(retry.delayMs, 900);

  const stale = planConnectorRecovery({ error: quota429, attempt: 1, maxAttempts: 1, hasSnapshot: true });
  assert.equal(stale.action, "USE_STALE_SNAPSHOT");
  assert.equal(stale.state, "STALE");

  let completed = [];
  assert.equal(shouldExecuteMutation("case-42:sync-7", completed), true);
  completed = recordCompletedMutation("case-42:sync-7", completed);
  assert.equal(shouldExecuteMutation("case-42:sync-7", completed), false);
});

test("T78: cross-case and unproven derived context cannot contaminate a decision", () => {
  const scope = { caseId: "CASE-B", accountId: "ACC-B" };
  const result = buildScopedContext(
    [
      {
        id: "canonical-b",
        sourceType: "canonical",
        caseId: "CASE-B",
        accountId: "ACC-B",
        permission: "allowed",
        verified: true
      },
      {
        id: "derived-a",
        sourceType: "derived",
        caseId: "CASE-A",
        accountId: "ACC-A",
        permission: "allowed",
        sourceIds: ["doc-a"],
        version: "v1"
      },
      {
        id: "derived-no-source",
        sourceType: "derived",
        caseId: "CASE-B",
        accountId: "ACC-B",
        permission: "allowed",
        sourceIds: [],
        version: "v2"
      },
      {
        id: "general-memory",
        sourceType: "general",
        caseId: null,
        accountId: null,
        permission: "allowed",
        verified: true
      }
    ],
    scope
  );

  assert.deepEqual(result.actionEligibleIds, ["canonical-b"]);
  assert.equal(result.accepted.some((item) => item.id === "general-memory"), true);
  assert.equal(result.rejected.some(({ item }) => item.id === "derived-a"), true);
  assert.equal(result.rejected.some(({ item }) => item.id === "derived-no-source"), true);
});

test("T79: noisy Persian transcript stays evidence until speaker and critical claims are verified", () => {
  const fixture = [
    {
      speaker: "گوینده ۱",
      kind: "fact_claim",
      text: "پلاس ماهی بیست دلار است و این عدد را باید دوباره چک کنیم.",
      criticalFields: ["money"]
    },
    {
      speaker: null,
      kind: "hypothesis",
      text: "شاید با n8n و گوگل‌درایو بتوانیم یک مسیر موقت بسازیم."
    },
    {
      speaker: "گوینده ۲",
      kind: "opinion_joke",
      text: "اسمش را ناصر روتر بگذاریم!"
    },
    {
      speaker: "گوینده ۱",
      kind: "decision",
      text: "برای رهجو مسیر local-first را baseline بگیریم.",
      criticalFields: ["policy"]
    },
    {
      speaker: null,
      kind: "commitment",
      text: "فردا این اتصال را production می‌کنیم.",
      criticalFields: ["date", "commitment"]
    }
  ];

  const assessed = assessTranscript(fixture);
  assert.equal(assessed.length, 5);
  assert.equal(assessed[1].speaker, "UNKNOWN");
  assert.equal(assessed[1].evidenceRole, "NON_FACT_CONTEXT");
  assert.equal(assessed[2].canonicalEligible, false);
  assert.equal(assessed[3].reviewRequired, true);
  assert.equal(assessed[4].canonicalEligible, false);
  assert.equal(assessed.every((item) => item.reviewRequired), true);
});
