# CRM Core Standardization Contract

## Goal

تبدیل محصول موجود به یک CRM استاندارد، provider-neutral و قابل توسعه، بدون وابستگی هویتی یا دامنه‌ای به محصول قبلی.

## Canonical core

Core entities:
- Workspace
- User / Membership / Role
- Lead
- Account
- Contact
- Opportunity
- Task
- Activity / Note
- Audit / Provenance
- Custom Field
- Import / Dedupe

Core invariants:
- tenant isolation is mandatory;
- every mutation is attributable;
- provider failures fail closed;
- Account/Contact/Opportunity/Task semantics belong to CRM Core, not to a provider;
- UI and API do not expose provider-specific Company/People naming.

## Optional workflow extension

The following concepts are preserved but moved out of the CRM identity:
- Case
- Service / Capability
- Approval
- Action / Run
- Receipt
- Outcome

They may be enabled for operational workflows but are not prerequisites for a standard CRM deployment.

## Runtime contract

Canonical environment names use `CRM_*`.

The existing `RAHJO_*` variables are accepted only by the migration shim during cutover. New deployment manifests, docs and secrets must use `CRM_*`.

## Provider contract

CRM Core speaks:
- listAccounts
- listContacts
- listOpportunities
- listTasks
- createAccount
- createContact

The Relaticle adapter maps these to its upstream collections. No upstream naming may escape into the public CRM API.

## API contract

Core write routes:
- `POST /api/v1/accounts`
- `POST /api/v1/contacts`
- `POST /api/v1/opportunities`
- `POST /api/v1/opportunities/:id/stage`
- `POST /api/v1/tasks`
- `POST /api/v1/tasks/:id/status`
- `POST /api/v1/interactions`

Required authorization:
- scope: `crm:write`
- role: owner, admin or operator

Current core slice:
- Opportunity create/update-stage;
- Task create/update-status;
- Activity/Interaction append using the provider Note contract;
- all writes are crm:write + tenant scoped + audited.

Next core routes:
- Account/Contact update and search;
- Task due-date/assignee UX after custom-field provisioning;
- Activity list/filter UX;
- import/dedupe review.

These routes must only be implemented after their provider contracts are verified; do not guess upstream field shapes.

## Storage migration

Current production storage still uses a legacy schema/role namespace from earlier builds. It remains a compatibility boundary in this PR so the application can be standardized before a breaking database rename.

Separate cutover:
1. ship CRM_* env aliases and generic runtime identity;
2. prove branch CI and production restore;
3. migrate database schema/roles to generic `crm` / `crm_app` names;
4. switch deployment secrets/manifests;
5. remove the legacy env shim;
6. rename external resources/repository after deployment references are updated.

No production schema rename should be performed without a fresh backup/restore receipt.

## External resource rename gate

The following are external identifiers and require a coordinated cutover rather than source-only search/replace:
- GitHub repository name
- Supabase project display name
- Hostinger app/site names and environment keys
- canonical Drive project/task names
- public domain/brand, if a final commercial name is chosen

Until a new commercial brand is supplied, public product copy uses the neutral label **CRM** and technical documentation uses **CRM Core**.

## Acceptance

- no Rahjo branding on canonical public/login/runtime surfaces;
- core package/service names are generic;
- CRM_* is canonical config;
- Account/Contact provider contract is generic;
- Account/Contact write operations are tenant-scoped, role/scoped and audited;
- workflow extension remains optional;
- Quality and foundation CI stay green;
- production is not called ready until restore and provider gates pass.
