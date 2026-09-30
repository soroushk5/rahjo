# Rahjo Provider / Connector / Context Resilience Spike

This spike implements deterministic prototype contracts for Stress Matrix T75–T79.

## What is implemented

- Provider error taxonomy: transient rate limit, quota/billing, auth/access, region/policy, server/network, invalid request.
- Bounded provider recovery planning with Retry-After support, exponential delay, provider fallback, local fallback and No-LLM continuity.
- Connector quota taxonomy for Google-class 403/429 behavior, degraded/stale state, bounded retries and idempotent mutation keys.
- Context integrity checks for Case/Account scope, permission, derived-artifact provenance/version and action authorization.
- Transcript intake gating that preserves unknown speakers and prevents hypotheses, jokes and unverified critical fields from becoming canonical records.
- Five noisy Persian transcript statements used as the T79 prototype fixture.

## Test mapping

- T75: `tests/provider-context-resilience.test.mjs` — temporary 429, Retry-After and bounded recovery.
- T76: same test file — quota and region/access failures skip blind retry and fall back safely.
- T77: same test file — Drive-style 403/429, stale snapshot and mutation idempotency.
- T78: same test file — cross-case context rejection and derived provenance requirements.
- T79: same test file — structured transcript intake safety gate.

## Proof boundary

These tests are contract-level prototype simulations. They do **not** prove live OpenAI/Anthropic connectivity, live Google Drive quota behavior, a production queue/circuit breaker, a deployed local model, or Persian ASR/NLP extraction quality. Those require adapter/integration and infrastructure tests in later spikes.

T79 currently proves the post-extraction verification/gating contract only; it does not perform diarization or speech recognition.
