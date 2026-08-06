# Rahjo frontend architecture

## Product idea

Rahjo is designed as a story-driven data platform. Its common narrative model is:

```text
Source → Context → Decision → Follow-up
```

The marketing site explains this model, the product atlas maps it, and the decision-room dashboard demonstrates how it feels in daily use.

## Dependency rule

```text
pages/features → shared components → design tokens
features → domain → service contracts
adapters → service contracts
```

Pages never call external providers directly. A future provider is introduced behind a gateway adapter after its legal and operational gate passes.

## State ownership

- URL and route state: router
- Editorial chapter state: marketing feature
- Request workflow state: request feature
- Business rules: domain modules
- External calls: service adapters
- Visual values: CSS tokens

## Human-friendly code rule

A module should have one clear reason to change, use explicit data, avoid hidden global behavior, and keep provider details outside rendering code.
