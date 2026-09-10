# ADR-001: Relaticle service boundary and AGPL provenance

- Status: Accepted for W13 foundation
- Date: 2026-09-10
- Rahjo baseline: `b888b39a6a7f9f710095e295822c2ce3cba59725`
- Decision owner: Soroush
- Task: `RAH-W13-001`

## Context

Rahjo already has a deployed Persian customer-to-outcome experience and the completed W7, W11 and W12 product-flow work. That browser-local experience is not a production CRM and must not be mistaken for one. W13 introduces a real server foundation without replacing the existing UX or making AI part of the critical path.

Relaticle is licensed under AGPL-3.0. The W13 handoff explicitly requires an owner/legal decision before a substantial source copy or deep fork. No such deep-fork approval has been given.

## Decision

1. Run unmodified Relaticle v3.5.7 as a separately deployed service.
2. Pin the Relaticle release, source commit and container digest in the provenance manifest.
3. Put a Rahjo-owned BFF/adapter in front of Relaticle. Browsers never receive Relaticle credentials and never select their own tenant.
4. Use Relaticle as the system of record for Company/Account, Person/Contact, Opportunity, Task and CRM interactions.
5. Keep Lead, Case, Service, ServiceCapability, Approval, Action, ActionRun, ExecutionReceipt, Outcome, document metadata, provenance and import-review records as first-class Rahjo domain objects in a separate `rahjo` PostgreSQL schema.
6. Bind every authenticated token to one server-side workspace membership. Tenant scope is derived from that membership and enforced again by PostgreSQL row-level security.
7. Keep runtime data mode explicit: exactly `demo` or `server`. Server failure is an error state and can never activate, seed or display Golden Demo data.
8. Keep all model-provider variables absent from the Phase-1 critical path and its acceptance tests.

## Licensing boundary

- No Relaticle source file is copied into this repository by this decision.
- The deployment configuration is an independently written composition based on the documented upstream runtime contract.
- Rahjo-specific code calls the public Relaticle API through a clean adapter and does not link to Relaticle application code.
- Upstream notices and the AGPL license remain with the separately deployed Relaticle image.
- Any future modification, vendoring, deep fork, or substantial code copy requires a new explicit owner/legal decision before work begins.
- All upstream deviations must be recorded in `ops/relaticle/patches/manifest.json`.

## Consequences

This boundary preserves the deployed Rahjo product and makes upgrades or replacement possible. It also means that a production container host, persistent storage, TLS/DNS controls and securely provisioned Relaticle workspace tokens are real prerequisites. The existing static Hostinger site cannot satisfy those backend requirements by itself.

## Release gate

This ADR does not make the backend healthy or production-ready. W13 remains unreleasable until the pinned services are deployed, backup/restore is proven, the mandatory two-workspace isolation suite passes, and the complete server-backed no-LLM Phase-1 E2E passes.
