# Rahjo — Story-driven data platform

A Persian-first, RTL product and editorial experience for turning data into traceable decisions.

## Current experience

- Story-led public homepage
- Platform architecture page
- Editorial story desk
- Trust and data-governance center
- Visual product/site atlas
- Decision-room dashboard demo
- Stateful verification/request flow
- Vazinmatn typography and responsive design system

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

Runtime code has no third-party JavaScript dependencies. TypeScript is used for strict static checking of the browser-native ES modules.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/HOSTINGER.md`](docs/HOSTINGER.md).

## Safety boundary

This repository contains demo data only. It does not connect to Rahjo's claimed data services and must not process real personal data until legal, source, security, and product gates are passed.
