# Relaticle provenance lock

This file is the human-readable counterpart of `provenance.lock.json`.

| Item | Locked value |
| --- | --- |
| Upstream repository | `https://github.com/Relaticle/relaticle` |
| License | `AGPL-3.0` |
| Release | `v3.5.7` |
| Release source commit | `d563e9eeeebfb3145cee60edcf13929c828b56a5` |
| Relaticle image | `ghcr.io/relaticle/relaticle@sha256:fdc6af98e9e45d85c01d964545ab3c09f85debdb26da47e0abe399308860f9be` |
| Upstream compose SHA-256 | `6fe20aadb1c2d990b134d61213c0004fac5fbb36` |
| Rahjo integration base | `b888b39a6a7f9f710095e295822c2ce3cba59725` |
| Integration mode | Separate service plus clean Rahjo BFF |
| Relaticle source copied into Rahjo | None |

The release tag, commit and public GHCR digest were resolved on 2026-09-10. The digest, not the mutable `latest` tag, is used by the deployment definition.

## Upgrade procedure

1. Resolve a new signed/released upstream reference and container digest.
2. Review release notes, API routes, tenant middleware and migration impact.
3. Run the Relaticle contract probe, two-workspace isolation tests, Rahjo no-LLM E2E and restore drill.
4. Update this lock and the patch manifest in the same reviewed change.
5. Do not copy or modify upstream source without a superseding licensing ADR.
