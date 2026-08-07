# Rahjo frontend architecture

## Product model

Rahjo sits between sensitive data sources and organizational workflows. The UI is organized around four control stages:

`source evidence -> access policy -> controlled delivery -> audit`

This model is shared by the landing page, data atlas, ecosystem map, console and access-request flow.

## Code boundaries

```text
src/
  app/          # routing and page shells
  components/   # shared presentation primitives
  data/         # immutable content and demo fixtures
  domain/       # framework-independent state and validation
  features/     # route-level product capabilities
  lib/          # small generic helpers
  services/     # provider and gateway adapters
styles/
  tokens.css
  base.css
  components.css
  public.css
  app.css
  responsive.css
```

## Dependency rules

- feature pages may depend on shared components, immutable data and domain contracts
- domain code must not depend on the DOM or page rendering
- UI pages must not call upstream providers directly
- real providers must implement a service adapter contract
- access policy and audit boundaries must remain separate from presentation code
- demo data must be clearly labeled and must contain no real personal information

## Deployment model

The current MVP uses browser-native ES modules and static assets. It can be deployed directly to Hostinger without a runtime server. A future framework migration may replace the rendering layer while retaining domain, data contracts, tokens and service boundaries.
