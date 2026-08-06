# Rahjo frontend architecture

## Why this baseline is framework-light

The MVP uses browser-native ES modules and a small amount of explicit infrastructure. This keeps the first release easy to read, cheap to host, and simple to audit. The domain, services, design system, and page boundaries can later move into React without rewriting the business rules.

## Dependency rule

```text
pages/features -> components -> design system
features -> domain -> service contracts
adapters -> service contracts
```

Pages must not call external endpoints directly. A future provider is added behind a gateway implementation.

## State ownership

- URL state: router
- Request workflow state: request feature
- Business rules: domain module
- External calls: service adapter
- Visual values: CSS tokens

## Definition of a healthy component

A component has one reason to change, uses shared tokens, receives explicit data, and does not know how remote providers work.
