# Rahjo — Controlled Data Access Platform

A human-readable, dependency-light frontend baseline for Rahjo.

## Product direction

Rahjo is positioned as a control layer between sensitive data sources and organizational use cases. The interface makes five things explicit:

1. data cluster and source
2. sensitivity level
3. customer and purpose
4. controlled delivery
5. audit and operational ownership

## What exists

- Persian RTL marketing landing page
- interactive data-cluster explorer
- data atlas and use-case catalog
- layered platform architecture
- interactive ecosystem map
- data control console
- access-request flow with explicit domain state
- centralized design tokens and Vazirmatn typography
- GitHub quality workflow
- Hostinger SPA fallback and deployment guide

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

Runtime code has no third-party dependencies. TypeScript is used only for strict static checking of JavaScript modules.

## Safety boundary

This MVP contains demonstration data only. It does not connect to the claimed portfolio services and must not process real personal data until source, legal, security and product gates are passed.
