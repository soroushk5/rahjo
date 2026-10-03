# Engineering dispatch queue preflight

Owner-authored `[READY_FOR_AGENT]` issues carry a bounded `dispatcher:v1` JSON payload. The GitHub workflow validates that payload with read-only permissions. It does not execute a model, modify a branch, or create a PR.

The authorized execution boundary is a local Windows runner using the user's ChatGPT-managed Codex login. A local dispatcher must independently verify the issue author, payload, base SHA, allowed paths, gates, lane count, and resulting diff before it creates a Draft PR. This repository does not currently provide that local dispatcher implementation. Queue validation alone is not implementation acceptance.

The prior Agents API runner was removed because this control plane does not authorize OpenAI API keys, Agents API, or API billing for engineering execution. Reintroducing remote execution requires an explicit architecture and billing decision.

## Queue payload

Issue title: `[READY_FOR_AGENT] <canonical-id> — <short objective>`

Issue body contains one JSON payload between `<!-- dispatcher:v1:start -->` and `<!-- dispatcher:v1:end -->`.

## Validation

`python -m unittest discover -s .github/engineering-dispatch -p test_engineering_dispatcher.py -q`
