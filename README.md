# Rahjo Web Platform MVP

A human-readable, dependency-light frontend baseline for Rahjo.

## What exists

- Persian RTL marketing landing page
- Product dashboard demo
- Stateful verification/request demo
- Centralized design tokens
- Domain state machine and provider adapter boundary
- Responsive and accessible foundations
- GitHub quality workflow
- Hostinger SPA fallback and deployment guide

## Run locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Quality checks

```bash
npm install
npm run qa
```

Runtime code has no third-party dependencies. TypeScript is used only for static checking of the JavaScript modules.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Safety boundary

This MVP contains demo data only. It does not connect to the claimed 52 data services and must not process real personal data until legal, source, security, and product gates are passed.
