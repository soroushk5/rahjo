#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

START = "<!-- dispatcher:v1:start -->"
END = "<!-- dispatcher:v1:end -->"
TITLE_PREFIX = "[READY_FOR_AGENT]"
ALLOWED_AUTONOMY = {"L1_BUILD"}
ALLOWED_RISK = {"low", "medium"}
FORBIDDEN_GATES = {
    "merge",
    "deploy",
    "production_write",
    "production_migration",
    "secret_change",
    "billing_change",
    "pricing_commitment",
    "external_send",
    "publish",
    "destructive_action",
}


class DispatchError(ValueError):
    pass


def extract_payload(body: str) -> dict[str, Any]:
    if body.count(START) != 1 or body.count(END) != 1 or body.index(START) > body.index(END):
        raise DispatchError("exactly one ordered dispatcher payload is required")
    chunk = body.split(START, 1)[1].split(END, 1)[0].strip()
    if chunk.startswith("```json"):
        chunk = chunk[len("```json"):]
    elif chunk.startswith("```"):
        chunk = chunk[3:]
    if chunk.endswith("```"):
        chunk = chunk[:-3]
    try:
        value = json.loads(chunk.strip())
    except json.JSONDecodeError as exc:
        raise DispatchError(f"invalid dispatcher JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise DispatchError("dispatcher payload must be a JSON object")
    return value


def require_string(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise DispatchError(f"{key} must be a non-empty string")
    return value.strip()


def require_list(payload: dict[str, Any], key: str) -> list[Any]:
    value = payload.get(key)
    if not isinstance(value, list):
        raise DispatchError(f"{key} must be a list")
    return value


def validate_payload(payload: dict[str, Any], current_repo: str) -> dict[str, Any]:
    supported = {
        "schema_version", "dispatch_id", "canonical_id", "target_repo", "base_branch",
        "autonomy_level", "risk_class", "objective", "acceptance", "allowed_paths",
        "non_goals", "forbidden", "safety", "source_links",
    }
    if set(payload) - supported:
        raise DispatchError("unsupported dispatcher fields")
    if payload.get("schema_version") != 1:
        raise DispatchError("schema_version must equal 1")

    dispatch_id = require_string(payload, "dispatch_id")
    if not re.fullmatch(r"DSP-[A-Za-z0-9._-]{3,80}", dispatch_id):
        raise DispatchError("dispatch_id must use DSP-<safe-id>")

    target_repo = require_string(payload, "target_repo")
    if target_repo.casefold() != current_repo.casefold():
        raise DispatchError("target_repo must match the repository running the dispatcher")

    canonical_id = require_string(payload, "canonical_id")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{1,79}", canonical_id):
        raise DispatchError("canonical_id is invalid")
    objective = require_string(payload, "objective")
    base_branch = require_string(payload, "base_branch")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]{0,119}", base_branch) or ".." in base_branch or base_branch.endswith("/"):
        raise DispatchError("base_branch is invalid")
    autonomy_level = require_string(payload, "autonomy_level")
    if autonomy_level not in ALLOWED_AUTONOMY:
        raise DispatchError(f"autonomy_level must be one of {sorted(ALLOWED_AUTONOMY)}")

    risk_class = require_string(payload, "risk_class").casefold()
    if risk_class not in ALLOWED_RISK:
        raise DispatchError(f"risk_class must be one of {sorted(ALLOWED_RISK)}")

    acceptance = require_list(payload, "acceptance")
    if not acceptance or not all(isinstance(x, str) and x.strip() for x in acceptance):
        raise DispatchError("acceptance must contain at least one non-empty string")

    forbidden = {str(x).strip().casefold() for x in require_list(payload, "forbidden")}
    missing = FORBIDDEN_GATES - forbidden
    if missing:
        raise DispatchError(f"forbidden must explicitly include hard gates: {sorted(missing)}")

    safety = payload.get("safety")
    if not isinstance(safety, dict):
        raise DispatchError("safety must be an object")
    required_false = [
        "production_touch",
        "external_side_effects",
        "merge_allowed",
        "deploy_allowed",
        "destructive_allowed",
    ]
    bad = [key for key in required_false if safety.get(key) is not False]
    if bad:
        raise DispatchError(f"safety fields must be explicitly false: {bad}")

    source_links = require_list(payload, "source_links")
    if not source_links or not all(isinstance(x, str) and x.startswith("https://") for x in source_links):
        raise DispatchError("source_links must contain at least one https URL")

    allowed_paths = payload.get("allowed_paths", [])
    if not isinstance(allowed_paths, list) or not allowed_paths or not all(isinstance(x, str) and x.strip() for x in allowed_paths):
        raise DispatchError("allowed_paths must contain at least one bounded glob")
    for pattern in allowed_paths:
        if (len(pattern) > 240 or pattern.startswith(("/", "\\")) or "\\" in pattern
                or ":" in pattern or any(part in {"", ".", ".."} for part in pattern.split("/"))):
            raise DispatchError("allowed_paths contains an unsafe pattern")

    non_goals = payload.get("non_goals", [])
    if not isinstance(non_goals, list) or not all(isinstance(x, str) for x in non_goals):
        raise DispatchError("non_goals must be a list of strings")

    normalized = {
        **payload,
        "dispatch_id": dispatch_id,
        "target_repo": target_repo,
        "canonical_id": canonical_id,
        "objective": objective,
        "base_branch": base_branch,
        "autonomy_level": autonomy_level,
        "risk_class": risk_class,
        "acceptance": [x.strip() for x in acceptance],
        "forbidden": sorted(forbidden),
        "source_links": source_links,
        "allowed_paths": allowed_paths,
        "non_goals": non_goals,
    }
    return normalized


def branch_name(payload: dict[str, Any], issue_number: int) -> str:
    raw = payload["canonical_id"].casefold()
    slug = re.sub(r"[^a-z0-9._-]+", "-", raw).strip("-._") or "task"
    return f"agent/dispatch/{slug}-{issue_number}"[:120]


def render_agent_prompt(payload: dict[str, Any], issue_number: int) -> str:
    acceptance = "\n".join(f"- {x}" for x in payload["acceptance"])
    non_goals = "\n".join(f"- {x}" for x in payload.get("non_goals", [])) or "- none supplied"
    allowed_paths = "\n".join(f"- {x}" for x in payload.get("allowed_paths", [])) or "- repository-wide, but stay tightly scoped"
    forbidden = "\n".join(f"- {x}" for x in payload["forbidden"])
    sources = "\n".join(f"- {x}" for x in payload["source_links"])
    return f"""You are the implementation agent for a bounded L1 build task.

Dispatch: {payload['dispatch_id']}
Canonical task: {payload['canonical_id']}
Repository: {payload['target_repo']}
Base branch: {payload['base_branch']}
Queue issue: #{issue_number}
Risk class: {payload['risk_class']}

OBJECTIVE
{payload['objective']}

ACCEPTANCE
{acceptance}

ALLOWED PATHS / SCOPE
{allowed_paths}

NON-GOALS
{non_goals}

HARD FORBIDDEN ACTIONS
{forbidden}

CANONICAL SOURCE LINKS
{sources}

RULES
- Work only inside /workspace/repo.
- Do not use real production data or credentials.
- Do not merge, deploy, publish, send externally, change billing/pricing, or perform destructive operations.
- Do not weaken tests, auth, authorization, evidence, recovery, or safety gates to make checks pass.
- Implement the smallest coherent change that satisfies acceptance.
- Run relevant tests/checks available in the repository.
- Do not create a git commit or push. The outer dispatcher owns GitHub mutations.
- Write the final git binary patch to /workspace/outputs/changes.patch using `git diff --binary`.
- Write /workspace/outputs/receipt.json with: dispatch_id, canonical_id, starting_sha, changed_files, tests (command/status/summary), unresolved_gates, review_notes, safe_next_action.
- If acceptance cannot be safely met, leave changes.patch empty and explain the blocker in receipt.json.
"""


def validate_changed_files(payload: dict[str, Any], changed_files: list[str]) -> None:
    import fnmatch

    allowed = payload.get("allowed_paths", [])
    if not changed_files:
        raise DispatchError("agent produced no changed files")
    denied_prefixes = (".git/",)
    for path in changed_files:
        if (path.startswith(denied_prefixes) or path.startswith(("/", "\\"))
                or "\\" in path or ":" in path
                or any(part in {"", ".", ".."} for part in path.split("/"))):
            raise DispatchError(f"changed path is always forbidden: {path}")
        if not any(fnmatch.fnmatch(path, pattern) for pattern in allowed):
            raise DispatchError(f"changed path is outside allowed_paths: {path}")


def cmd_validate_changed_files(args: argparse.Namespace) -> int:
    dispatch = json.loads(Path(args.dispatch).read_text(encoding="utf-8"))
    payload = dispatch.get("payload") if dispatch.get("status") == "READY" else None
    if not isinstance(payload, dict):
        raise DispatchError("dispatch preflight is not READY")
    changed = [line.strip() for line in Path(args.changed_files).read_text(encoding="utf-8").splitlines() if line.strip()]
    validate_changed_files(payload, changed)
    print(json.dumps({"status": "ALLOWED", "changed_files": changed}, ensure_ascii=False))
    return 0


def cmd_preflight(args: argparse.Namespace) -> int:
    event = json.loads(Path(args.event).read_text(encoding="utf-8"))
    issue = event.get("issue") or {}
    owner = args.repo.split("/", 1)[0]
    if (not isinstance(issue, dict) or (issue.get("user") or {}).get("login") != owner
            or (event.get("sender") or {}).get("login") != owner):
        raise DispatchError("dispatcher issue and event actor must be the repository owner")
    title = str(issue.get("title") or "")
    if not title.startswith(TITLE_PREFIX):
        print(json.dumps({"status": "NOOP", "reason": "not a dispatcher issue"}))
        return 0
    payload = extract_payload(str(issue.get("body") or ""))
    payload = validate_payload(payload, args.repo)
    result = {
        "status": "READY",
        "issue_number": int(issue.get("number")),
        "branch": branch_name(payload, int(issue.get("number"))),
        "payload": payload,
        "agent_prompt": render_agent_prompt(payload, int(issue.get("number"))),
    }
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "READY", "dispatch_id": payload["dispatch_id"], "branch": result["branch"]}))
    return 0


def cmd_validate_payload(args: argparse.Namespace) -> int:
    payload = json.loads(Path(args.payload).read_text(encoding="utf-8"))
    normalized = validate_payload(payload, args.repo)
    print(json.dumps(normalized, ensure_ascii=False, indent=2))
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="command", required=True)
    pre = sub.add_parser("preflight")
    pre.add_argument("--event", required=True)
    pre.add_argument("--repo", required=True)
    pre.add_argument("--output", required=True)
    val = sub.add_parser("validate-payload")
    val.add_argument("--payload", required=True)
    val.add_argument("--repo", required=True)
    ch = sub.add_parser("validate-changed-files")
    ch.add_argument("--dispatch", required=True)
    ch.add_argument("--changed-files", required=True)
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        if args.command == "preflight":
            return cmd_preflight(args)
        if args.command == "validate-changed-files":
            return cmd_validate_changed_files(args)
        return cmd_validate_payload(args)
    except (DispatchError, json.JSONDecodeError, OSError, ValueError) as exc:
        print(json.dumps({"status": "BLOCKED", "error": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
