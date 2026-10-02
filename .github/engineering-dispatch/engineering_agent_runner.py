#!/usr/bin/env python3
from __future__ import annotations

import argparse
import io
import json
import os
import tarfile
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

MAX_ARCHIVE_BYTES = 50 * 1024 * 1024
EXCLUDE_DIRS = {
    ".git", ".venv", "venv", "node_modules", "dist", "build", "coverage",
    ".next", ".cache", "__pycache__", ".pytest_cache", ".mypy_cache", ".dispatcher"
}


def load_dispatch(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("status") != "READY":
        raise RuntimeError("dispatch preflight is not READY")
    if not data.get("agent_prompt"):
        raise RuntimeError("dispatch preflight has no agent_prompt")
    return data


def make_archive(repo_root: Path, destination: Path) -> int:
    repo_root = repo_root.resolve()
    with tarfile.open(destination, "w:gz") as tf:
        for path in repo_root.rglob("*"):
            rel = path.relative_to(repo_root)
            if any(part in EXCLUDE_DIRS for part in rel.parts):
                continue
            if path.is_symlink():
                continue
            if path.is_file():
                tf.add(path, arcname=str(Path("repo") / rel), recursive=False)
    size = destination.stat().st_size
    if size > MAX_ARCHIVE_BYTES:
        raise RuntimeError(f"repository archive is {size} bytes; max supported V1 size is {MAX_ARCHIVE_BYTES}")
    return size


def github_actions_oidc_token_provider(audience: str):
    request_url = os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]
    request_token = os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]

    def get_token() -> str:
        parsed = urllib.parse.urlparse(request_url)
        query = dict(urllib.parse.parse_qsl(parsed.query, keep_blank_values=True))
        query["audience"] = audience
        url = urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(query)))
        req = urllib.request.Request(url, headers={"Authorization": f"bearer {request_token}"})
        with urllib.request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        token = payload.get("value")
        if not token:
            raise RuntimeError("GitHub OIDC token response did not include a value")
        return token

    return {"token_type": "jwt", "get_token": get_token}


def make_client():
    from openai import OpenAI

    if os.environ.get("OPENAI_API_KEY"):
        return OpenAI()

    required = ["OPENAI_WIF_AUDIENCE", "OPENAI_IDENTITY_PROVIDER_ID", "OPENAI_SERVICE_ACCOUNT_ID"]
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise RuntimeError(
            "Agents API mode requires either OPENAI_API_KEY or GitHub OIDC/WIF variables: " + ", ".join(missing)
        )
    return OpenAI(
        workload_identity={
            "identity_provider_id": os.environ["OPENAI_IDENTITY_PROVIDER_ID"],
            "service_account_id": os.environ["OPENAI_SERVICE_ACCOUNT_ID"],
            "provider": github_actions_oidc_token_provider(os.environ["OPENAI_WIF_AUDIENCE"]),
        }
    )


def run_agents_api(repo_root: Path, dispatch_path: Path, output_dir: Path) -> dict[str, Any]:
    dispatch = load_dispatch(dispatch_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    client = make_client()

    archive_path = output_dir / "repo.tar.gz"
    archive_size = make_archive(repo_root, archive_path)
    with archive_path.open("rb") as handle:
        uploaded = client.files.create(
            file=handle,
            purpose="user_data",
            expires_after={"anchor": "created_at", "seconds": 86400},
        )

    model = os.environ.get("OPENAI_AGENT_MODEL", "gpt-6-astra")
    stream = client.beta.agents.sessions.create(
        agent={
            "model": model,
            "instructions": "You are a careful software implementation agent. Obey the dispatch safety contract exactly.",
            "reasoning": {"effort": os.environ.get("OPENAI_AGENT_REASONING", "medium")},
        },
        environment={
            "type": "openai_hosted",
            "container_size": os.environ.get("OPENAI_AGENT_CONTAINER_SIZE", "medium"),
            "network": {"access": "disabled"},
            "files": [
                {"type": "file_id", "file_id": uploaded.id, "path": "/workspace/repo.tar.gz"}
            ],
            "setup_commands": [
                {
                    "command": "mkdir -p /workspace/repo /workspace/outputs && tar -xzf /workspace/repo.tar.gz -C /workspace"
                }
            ],
        },
        input=dispatch["agent_prompt"],
        stream=True,
    )

    events_seen = 0
    with stream.with_result_collection():
        for event in stream:
            events_seen += 1
            if hasattr(event, "model_dump_json"):
                print(event.model_dump_json(), flush=True)
            else:
                print(str(event), flush=True)
        result = stream.get_final_result()

    patch_path = output_dir / "changes.patch"
    receipt_path = output_dir / "receipt.json"
    artifacts = client.beta.agents.sessions.artifacts.for_result(result)
    artifacts.download("/workspace/outputs/changes.patch", to=patch_path)
    artifacts.download("/workspace/outputs/receipt.json", to=receipt_path)

    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    summary = {
        "status": "COMPLETED",
        "model": model,
        "archive_size": archive_size,
        "events_seen": events_seen,
        "patch_bytes": patch_path.stat().st_size,
        "receipt": receipt,
    }
    (output_dir / "runner-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return summary

def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["dry-run", "agents_api"], default="dry-run")
    p.add_argument("--repo-root", default=".")
    p.add_argument("--dispatch", required=True)
    p.add_argument("--output-dir", required=True)
    args = p.parse_args()

    repo_root = Path(args.repo_root).resolve()
    dispatch_path = Path(args.dispatch).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    dispatch = load_dispatch(dispatch_path)

    if args.mode == "dry-run":
        result = {
            "status": "DRY_RUN",
            "dispatch_id": dispatch["payload"]["dispatch_id"],
            "canonical_id": dispatch["payload"]["canonical_id"],
            "branch": dispatch["branch"],
            "message": "Preflight passed. Agents API execution is intentionally disabled until the billing/authentication gate is explicitly armed.",
        }
        (output_dir / "runner-summary.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(result))
        return 0

    result = run_agents_api(repo_root, dispatch_path, output_dir)
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
