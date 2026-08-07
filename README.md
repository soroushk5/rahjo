# Rahjo — Controlled Data Access Platform

A presentation-ready, dependency-light frontend prototype for Rahjo.

## Product direction

Rahjo is positioned as a control layer between data sources and organizational use cases. The interface makes five things explicit:

1. data cluster and source
2. sensitivity level
3. customer and purpose
4. controlled delivery
5. audit and operational ownership

## Presentation build

The current build includes:

- Persian RTL public landing page
- Vazirmatn typography across the interface
- interactive data atlas
- interactive ecosystem map
- platform and access-control pages
- demo login and browser-local session
- dashboard overview
- access-request dashboard
- data portfolio/readiness dashboard
- audit/control dashboard
- multi-step access-request flow
- browser-local draft and request persistence
- centralized design tokens and 2px Rahjo icon system
- responsive desktop/mobile layouts
- Hostinger static package and smoke tests

## Demo login

Route: `/login`

```text
demo@rahjo.ir
RahjoDemo1405
```

This is a static demo credential. It creates a local browser session only and is not connected to a backend account.

Recommended presentation flow:

```text
/login
→ /dashboard
→ /request
→ submit demo request
→ /dashboard/requests
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

## Quality checks

```bash
npm run qa
```

The quality pipeline runs strict static checking, automated tests, the Hostinger build and deployment smoke tests.

Runtime code has no third-party dependencies. TypeScript is used only for strict static checking of JavaScript modules.

## Design reference

See `docs/PRESENTATION_SYSTEM.md` for design tokens, mock-data rules, routes and the presentation QA contract.

## Safety boundary

This prototype contains demonstration data only. It does not connect to the claimed portfolio services and must not process real personal data until source, legal, security and product gates are passed.
