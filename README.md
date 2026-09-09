# Rahjo — Operational Foundation

Rahjo is a Persian-first, RTL-first operational product prototype that keeps commercial context continuous across Account, Lead, Opportunity, Case, ServiceCapability, Human Approval, Action, Receipt, Audit and Outcome.

The application is intentionally dependency-light and browser-local. It demonstrates coherent product behavior without claiming a live CRM, provider, API, payment, eligibility, AI/model or customer-data integration.

## Primary product journey

```text
Dashboard
→ Account / Lead context
→ Opportunity / Case
→ Service evidence and eligibility summary
→ Human Approval
→ deterministic local Action / Run
→ Receipt / Audit
→ Outcome
→ Account and Dashboard
```

Primary routes:

- `/login` — local demo entry and one-click Golden Demo
- `/dashboard` — state-derived action queue
- `/crm?account=...` — Account 360 and commercial memory
- `/sales?opportunity=...` — Lead, Opportunity and human handoff
- `/cases/new` — guided, claim-safe local Case intake
- `/services?service=...&case=...` — ServiceCapability and Case context
- `/automation?case=...&run=...` — human-gated local runs and receipts
- `/governance?case=...` — audit trail, Outcome and Data Quality lifecycle
- `/think-room?case=...` — read-only future intelligence context; never required for Phase 1

Entity context is carried in the URL so Back, Forward and Refresh remain meaningful. All writes go through the versioned local operational repository. Every mutation records actor, source, local deterministic time and state transition semantics. `Reset Demo` restores the exact canonical synthetic seed.

## Golden Demo

From `/login`, choose **شروع Golden Demo**. The presenter rail remains available across primary screens and proves the full Account → Approval → Action → Audit → Outcome loop. Reset is deterministic and safe to repeat.

Fallback demo credentials:

```text
demo@rahjo.ir
RahjoDemo1405
```

These credentials create only a browser-local session. They are not connected to an account backend.

## Run locally

Node.js 20 or newer is required.

```bash
npm ci
npm run dev
```

Open `http://localhost:4173`.

## Quality commands

```bash
npm run check
npm test
npm run qa
npm run build:hostinger
npm run smoke:hostinger
```

Rendered browser QA is required in addition to automated checks. Validate the Golden Demo twice with Reset, the normal product journey, global entity search, URL history/refresh, invalid IDs, canceled intake, desktop and mobile RTL, console health and horizontal overflow.

## Production and safety

`main` is the canonical source branch. `hostinger-production` is generated only by the quality-checked publication workflow documented in `docs/HOSTINGER_PRODUCTION.md`; do not edit it manually.

The repository contains synthetic demonstration data only. Local approval and execution states are product-prototype records, not evidence of provider access, legal eligibility, customer consent, delivery, ROI, pricing or autonomous action. Never add secrets or real external side effects to demo flows.

## Legacy reference surfaces

The older Controlled Data Access pages remain available only as secondary/reference routes under the console (`/dashboard/requests`, `/dashboard/data`, `/dashboard/audit`, `/request`). They do not define the current primary product story.
