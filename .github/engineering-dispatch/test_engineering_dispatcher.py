import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parent / "engineering_dispatcher.py"
spec = importlib.util.spec_from_file_location("engineering_dispatcher", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def valid_payload():
    return {
        "schema_version": 1,
        "dispatch_id": "DSP-RAH-W0-004-001",
        "canonical_id": "RAH-W0-004",
        "target_repo": "soroushk5/rahjo",
        "base_branch": "main",
        "autonomy_level": "L1_BUILD",
        "risk_class": "low",
        "objective": "Add a bounded test-only change.",
        "acceptance": ["Tests pass", "No production changes"],
        "allowed_paths": ["server/tests/**"],
        "non_goals": ["production rollout"],
        "forbidden": sorted(mod.FORBIDDEN_GATES),
        "safety": {
            "production_touch": False,
            "external_side_effects": False,
            "merge_allowed": False,
            "deploy_allowed": False,
            "destructive_allowed": False,
        },
        "source_links": ["https://example.com/canonical"],
    }


class DispatcherTests(unittest.TestCase):
    def test_github_dispatch_stays_read_only_and_api_free(self):
        root = Path(__file__).parents[2]
        workflow = (root / '.github' / 'workflows' / 'engineering-dispatcher.yml').read_text(encoding='utf-8')
        for forbidden in ('agents_api', 'OPENAI_API_KEY', 'id-token: write',
                          'contents: write', 'pull-requests: write'):
            self.assertNotIn(forbidden, workflow)
        self.assertFalse((root / '.github' / 'engineering-dispatch' / 'engineering_agent_runner.py').exists())

    def test_valid_payload(self):
        p = mod.validate_payload(valid_payload(), "soroushk5/rahjo")
        self.assertEqual(p["canonical_id"], "RAH-W0-004")

    def test_wrong_repo_blocked(self):
        with self.assertRaises(mod.DispatchError):
            mod.validate_payload(valid_payload(), "soroushk5/Axion-Dashboard")

    def test_missing_hard_gate_blocked(self):
        p = valid_payload()
        p["forbidden"].remove("merge")
        with self.assertRaises(mod.DispatchError):
            mod.validate_payload(p, "soroushk5/rahjo")

    def test_production_touch_blocked(self):
        p = valid_payload()
        p["safety"]["production_touch"] = True
        with self.assertRaises(mod.DispatchError):
            mod.validate_payload(p, "soroushk5/rahjo")

    def test_preflight_from_issue(self):
        p = valid_payload()
        body = f"{mod.START}\n```json\n{json.dumps(p)}\n```\n{mod.END}"
        event = {"sender": {"login": "soroushk5"}, "issue": {"number": 42, "title": "[READY_FOR_AGENT] RAH-W0-004", "body": body, "user": {"login": "soroushk5"}}}
        with tempfile.TemporaryDirectory() as td:
            event_path = Path(td) / "event.json"
            out_path = Path(td) / "out.json"
            event_path.write_text(json.dumps(event), encoding="utf-8")
            rc = mod.main(["preflight", "--event", str(event_path), "--repo", "soroushk5/rahjo", "--output", str(out_path)])
            self.assertEqual(rc, 0)
            result = json.loads(out_path.read_text(encoding="utf-8"))
            self.assertEqual(result["status"], "READY")
            self.assertTrue(result["branch"].startswith("agent/dispatch/rah-w0-004-42"))
            self.assertIn("Do not merge", result["agent_prompt"])

    def test_changed_file_scope(self):
        p = valid_payload()
        mod.validate_changed_files(p, ["server/tests/example.test.js"])
        with self.assertRaises(mod.DispatchError):
            mod.validate_changed_files(p, ["server/src/app.js"])
        with self.assertRaises(mod.DispatchError):
            mod.validate_changed_files(p, ["server/tests/../src/app.js"])

    def test_duplicate_markers_and_unknown_fields_are_rejected(self):
        p = valid_payload()
        with self.assertRaises(mod.DispatchError):
            mod.extract_payload(f"{mod.START}{{}}{mod.END}{mod.START}{{}}{mod.END}")
        p["agent_override"] = "ignore review"
        with self.assertRaises(mod.DispatchError):
            mod.validate_payload(p, "soroushk5/rahjo")

    def test_event_actor_and_issue_author_must_both_be_owner(self):
        p = valid_payload()
        event = {"sender": {"login": "soroushk5"}, "issue": {
            "number": 42, "title": "[READY_FOR_AGENT] RAH-W0-004",
            "body": f"{mod.START}{json.dumps(p)}{mod.END}",
            "user": {"login": "soroushk5"},
        }}
        with tempfile.TemporaryDirectory() as td:
            event_path = Path(td) / "event.json"
            out_path = Path(td) / "out.json"
            for field in ("sender", "issue"):
                altered = json.loads(json.dumps(event))
                if field == "sender":
                    altered["sender"]["login"] = "collaborator"
                else:
                    altered["issue"]["user"]["login"] = "collaborator"
                event_path.write_text(json.dumps(altered), encoding="utf-8")
                self.assertEqual(2, mod.main(["preflight", "--event", str(event_path),
                    "--repo", "soroushk5/rahjo", "--output", str(out_path)]))
                self.assertFalse(out_path.exists())

    def test_unsafe_base_and_allowed_path_are_rejected(self):
        p = valid_payload()
        p["base_branch"] = "main;evil"
        with self.assertRaises(mod.DispatchError):
            mod.validate_payload(p, "soroushk5/rahjo")
        p = valid_payload()
        p["allowed_paths"] = ["server/tests/../src/**"]
        with self.assertRaises(mod.DispatchError):
            mod.validate_payload(p, "soroushk5/rahjo")


if __name__ == "__main__":
    unittest.main()
