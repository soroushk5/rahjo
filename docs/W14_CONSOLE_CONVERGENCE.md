# W14 — Authenticated Console Convergence

## Scope

This slice aligns Rahjo's authenticated operational console with the compact software-first public baseline without changing backend contracts, data semantics, routing ownership or the server/demo boundary.

## Visual contract

The console should feel like the same product as the public site:

- bright surfaces, navy copy and restrained teal accents;
- compact spacing and modest radii;
- one clear action hierarchy per screen;
- fewer dashboard blocks and less repeated management reporting;
- tables remain dense and scannable rather than card-heavy;
- mobile uses an off-canvas operational nav and must not create body-level horizontal overflow;
- visible keyboard focus is required on interactive controls.

## Shell contract

The authenticated shell has three navigation groups:

1. **کار روزانه** — Dashboard, Customers, Sales, Requests, Tasks
2. **اجرا و پشتیبانی** — Services, Operations, Finance, Documents
3. **مدیریت** — Reports, Audit, Settings

The shell preserves all existing operational routes. Navigation is grouped for comprehension; routes are not removed.

The top bar is intentionally compact: workspace identity, quick search and one primary create action.

## Dashboard contract

The Demo dashboard is reduced to four moves:

1. compact page heading;
2. four summary metrics;
3. one primary **اقدام بعدی من** work table;
4. two supporting panels: **نیازمند توجه** and **آخرین حرکت‌ها**.

Legacy repeated sales/service performance blocks are not part of the dashboard baseline. Their detailed information remains available in Sales and Reports.

Server-mode operational pages continue to render server projections through `serverOperationalPages.js`; the convergence stylesheet applies to the same shared shell/components.

## Copy boundary

This version must not present artificial-intelligence positioning or status copy in the rendered public, login or console surfaces. Operational claims stay deterministic and tied to actual runtime state.

## Acceptance

Required before marking the visual portion of W14-007 accepted:

- `npm run qa` passes;
- Hostinger package build/smoke passes;
- rendered Public QA still passes;
- rendered Console QA passes on `1365×900` and `390×844`;
- Dashboard, Customers, Customer Detail, Requests and Request Detail have no body-level horizontal overflow;
- mobile console menu opens with correct `aria-expanded` state;
- skip link and visible focus remain functional;
- no browser console/page errors;
- screenshots are visually inspected before merge.

Live authenticated server-session acceptance remains a separate gate when owner-authenticated credentials/session are safely available.
