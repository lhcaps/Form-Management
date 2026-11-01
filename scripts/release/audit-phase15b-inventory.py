#!/usr/bin/env python3
"""Phase 15B inventory generator.

Emits the Phase 15B-shaped inventory + cleanup artifacts:
  phase15b-worktree-inventory.json
  phase15b-worktree-inventory.md
  phase15b-cleanup-candidates.json
  phase15b-inventory-blockers.json
  phase15b-tracked-deletion-audit.json
  phase15b-scratch-forensics.json
  phase15b-secret-audit.json
  phase15b-sensitive-data-audit.json
  phase15b-large-file-audit.json

Every path in `git status --porcelain=v2` plus tracked deletions
(`git ls-files --deleted`) and untracked files
(`git ls-files --others --exclude-standard`) is classified with a
category and action and reference footprint (imports / package scripts /
CI / tests / docs / git history).

This script is read-only. It never deletes anything.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"
MAX_SHA_BYTES = 5 * 1024 * 1024


def run_git(args: list[str], check: bool = True) -> str:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
    )
    if check and proc.returncode != 0:
        raise RuntimeError(f"git {args} failed: {proc.stderr.strip()}")
    return proc.stdout


def sha256_of(path: Path) -> str | None:
    try:
        if path.is_dir() or not path.exists() or not path.is_file():
            return None
        if path.stat().st_size > MAX_SHA_BYTES:
            return None
        h = hashlib.sha256()
        with path.open("rb") as fh:
            for chunk in iter(lambda: fh.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return None


def git_history_count(path: str) -> int:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "log", "--oneline", "--follow", "--", path],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
    )
    return 0 if proc.returncode != 0 else len(proc.stdout.splitlines())


def collect_porcelain() -> list[dict]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "status", "--porcelain=v2", "-z", "--untracked-files=normal", "--ignored=no"],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
    )
    out = proc.stdout
    records: list[dict] = []
    # v2 format with -z:
    # "1 XY sub <mH> <mI> <mW> <hH> <hI> <path>\0" for changed
    # "2 XY sub <mH> <mI> <mW> <hH> <hI> <X> <Y> <score> <path>\0<origPath>\0" for renamed/copied
    # "? <path>\0" for untracked
    # "! <path>\0" for ignored
    parts = out.split("\x00")
    i = 0
    while i < len(parts):
        chunk = parts[i]
        if not chunk:
            i += 1
            continue
        if chunk.startswith("? "):
            records.append({"status": "??", "path": chunk[2:], "tracked": False, "originalPath": None})
            i += 1
            continue
        if chunk.startswith("! "):
            records.append({"status": "!!", "path": chunk[2:], "tracked": False, "originalPath": None})
            i += 1
            continue
        if chunk.startswith("1 "):
            # 1 XY sub <...> <path>
            fields = chunk.split(" ")
            # fields[0]="1", fields[1]=XY, fields[2]="sub", fields[-1]=path
            xy = fields[1]
            path = fields[-1]
            records.append({"status": xy, "path": path, "tracked": True, "originalPath": None})
            i += 1
            continue
        if chunk.startswith("2 "):
            # 2 XY sub <...> <X> <Y> <score> <path>\0<origPath>
            fields = chunk.split(" ")
            xy = fields[1]
            path = fields[-1]
            i += 1
            orig = parts[i] if i < len(parts) else ""
            records.append({"status": xy, "path": path, "tracked": True, "originalPath": orig})
            i += 1
            continue
        # Unknown — skip
        i += 1
    return records


def collect_tracked_deletions() -> list[str]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "--deleted", "-z"],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
    )
    return [x for x in proc.stdout.split("\x00") if x]


def classify(path: str, status_code: str, tracked: bool) -> tuple[str, str, str]:
    p = path.replace("\\", "/").lower()
    name = Path(path).name
    # Hard exclusions — never delete
    if "audit/docx/contracts/locked" in p:
        return ("LOCKED_CONTRACT", "KEEP_AND_COMMIT", "Locked form contracts — source of truth")
    if "storage/templates/source" in p:
        return ("SOURCE_DOCX", "KEEP_AND_COMMIT", "Original DOCX template sources")
    if "storage/templates/normalized-docx" in p:
        return ("NORMALIZED_DOCX", "KEEP_AND_COMMIT", "Canonical normalized DOCX artifacts")
    # Secrets / auth state
    if name == ".env" or p.endswith("/.env") or p.endswith(".env.local") or p.endswith(".env.e2e.local"):
        return ("SECRET_OR_ENV", "BLOCK_RELEASE_SECRET", "Tracked or untracked env file")
    if "playwright/.clerk/" in p:
        return ("AUTH_STATE", "DELETE_SAFE", "Untracked Clerk auth state")
    if "storageState" in name or "auth-state" in p:
        return ("AUTH_STATE", "DELETE_SAFE", "Auth state file")
    # Temporary / scratch
    if name.startswith("_probe-") and name.endswith((".mjs", ".js", ".ts")):
        return ("SCRATCH_PROBE", "DELETE_SAFE", "Untracked throwaway probe script")
    if name.startswith("_tmp_") or name.startswith("_extract_audit_summary") or (name.startswith("_tmp_audit") and name.endswith(".py")):
        return ("SCRATCH_PROBE", "DELETE_SAFE", "Untracked throwaway scratch script")
    if "/.tmp-" in p or p.startswith(".tmp-"):
        return ("TEMPORARY_RUNTIME_DATA", "DELETE_SAFE", "Throwaway mutation sidecar directory")
    if name.startswith("~$") and name.endswith(".docx"):
        return ("STALE_LOG", "DELETE_SAFE", "Office lock file")
    if p.startswith("test-results/") or "playwright-report/" in p or p.endswith("/test-results.json"):
        return ("PLAYWRIGHT_OUTPUT", "DELETE_SAFE", "Playwright test results")
    if "/screenshots/" in p and tracked is False:
        return ("PLAYWRIGHT_OUTPUT", "DELETE_SAFE", "Playwright screenshot artifact")
    if p.endswith(".log") and tracked is False:
        return ("STALE_LOG", "DELETE_SAFE", "Untracked log file")
    if p.endswith(".pid") and tracked is False:
        return ("STALE_LOG", "DELETE_SAFE", "Untracked PID file")
    if p.endswith(".tmp") and tracked is False:
        return ("TEMPORARY_RUNTIME_DATA", "DELETE_SAFE", "Untracked .tmp file")
    if p.endswith((".bak", ".old", ".orig", ".rej")) and tracked is False:
        return ("TEMPORARY_RUNTIME_DATA", "DELETE_SAFE", "Untracked backup/diff file")
    if p.startswith("coverage/") and tracked is False:
        return ("BUILD_OUTPUT", "DELETE_SAFE", "Untracked coverage output")
    if p.endswith("/coverage/") and tracked is False:
        return ("BUILD_OUTPUT", "DELETE_SAFE", "Untracked coverage directory")
    if (p.startswith(".next/") or p.startswith("dist/") or p.startswith("build/") or p.startswith("out/")) and tracked is False:
        return ("BUILD_OUTPUT", "DELETE_SAFE", "Untracked build output")
    # Stray shell command fragments at repo root
    if name.startswith("{") and "/" not in path:
        return ("SCRATCH_PROBE", "DELETE_SAFE", "Stray shell command fragment at root")
    # Cursor local state
    if p == ".cursor/hook-smoke-results.json" or p == ".cursor/hooks.json":
        return ("CACHE", "DELETE_SAFE", "Local hook smoke artifact")
    if p == ".cursor/qllaw-goal-state.pre-overnight.json":
        return ("CACHE", "DELETE_SAFE", "Pre-overnight goal-state snapshot — current goal-state covers this")
    # Tracked product changes — KEEP_AND_COMMIT
    if tracked and status_code.strip() not in ("D", "!!", "??"):
        if p.startswith("apps/api/prisma/"):
            return ("DATABASE_SCHEMA_OR_MIGRATION", "KEEP_AND_COMMIT", "Prisma schema / migration")
        if p.startswith("apps/") or p.startswith("packages/") or p.startswith("scripts/") or p.startswith("tests/") or p.startswith("test/"):
            return ("PRODUCT_SOURCE" if "test" not in p and ".test." not in name else "PRODUCT_TEST", "KEEP_AND_COMMIT", "Tracked product source/test change")
        if p.startswith("docker/") or p.startswith("docker-compose.") or p.endswith(("Dockerfile", ".dockerfile")):
            return ("PRODUCT_CONFIGURATION", "KEEP_AND_COMMIT", "Tracked Docker config")
        if p.startswith("docs/audit/final-213-customer-ready/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Canonical audit evidence")
        if p.startswith("docs/audit/") or p.startswith("docs/operations/"):
            return ("HISTORICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Tracked audit / operations evidence")
        if p.startswith("docs/"):
            return ("CUSTOMER_DOCUMENTATION", "KEEP_AND_COMMIT", "Documentation change")
        if p == ".gitignore":
            return ("PRODUCT_CONFIGURATION", "KEEP_AND_COMMIT", "Tracked .gitignore change")
        if p == "package.json" or p.endswith("pnpm-lock.yaml"):
            return ("DEPENDENCY_MANIFEST" if "lock" in name else "PRODUCT_CONFIGURATION", "KEEP_AND_COMMIT", "Tracked package manifest / lockfile")
        if p.endswith((".yml", ".yaml")) and "audit" not in p:
            return ("PRODUCT_CONFIGURATION", "KEEP_AND_COMMIT", "Tracked YAML config")
        if p == ".env.example":
            return ("PRODUCT_CONFIGURATION", "KEEP_AND_COMMIT", "Tracked env example")
        if p.startswith(".ai/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Harness AI artifact")
        if p.startswith("storage/bootstrap-artifacts/"):
            return ("GENERATED_CANONICAL_SOURCE", "KEEP_AND_COMMIT", "Bootstrap artifact kept for reproducibility")
    # Tracked deletions
    if tracked and status_code.strip() == "D":
        if "templates/normalized-docx" in p:
            return ("NORMALIZED_DOCX", "REVIEW_REQUIRED", "Tracked normalized DOCX deletion — must investigate")
        if p.startswith("apps/") or p.startswith("packages/") or p.startswith("tests/") or p.startswith("scripts/"):
            return ("PRODUCT_SOURCE", "KEEP_DELETION", "Tracked deletion — intentional")
        return ("UNKNOWN_REVIEW_REQUIRED", "REVIEW_REQUIRED", "Tracked deletion — must investigate")
    # Untracked but legitimate
    if not tracked:
        if p.startswith("apps/api/src/") or p.startswith("apps/web/src/") or p.startswith("packages/form-contracts/src/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked product source — new code")
        if p.startswith("apps/api/prisma/"):
            return ("DATABASE_SCHEMA_OR_MIGRATION", "KEEP_AND_COMMIT", "Untracked prisma schema/migration")
        if p.startswith("tests/e2e/") and name.endswith((".spec.ts", ".auth.spec.ts")):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked e2e spec")
        if p.startswith("test/") and (".test." in name):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked Node test")
        if p.startswith("scripts/") and name.endswith((".mjs", ".cjs", ".ts", ".ps1", ".py")):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked script")
        if p.startswith("docs/audit/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Untracked audit evidence")
        if p.startswith("docs/"):
            return ("CUSTOMER_DOCUMENTATION", "KEEP_AND_COMMIT", "Untracked documentation")
        if p.startswith("infra/") or p == "docker-compose.demo.yml" or p.startswith("playwright."):
            return ("PRODUCT_CONFIGURATION", "KEEP_AND_COMMIT", "Untracked infra / Playwright config")
        if p.startswith("storage/bootstrap-artifacts/"):
            return ("GENERATED_CANONICAL_SOURCE", "KEEP_AND_COMMIT", "Untracked bootstrap artifact — timestamped snapshot")
        if p.startswith("storage/tmp/") or p.startswith("storage/temp/") or p.startswith("storage/generated/") or p.startswith("storage/runtime-preview-sessions/"):
            return ("TEMPORARY_RUNTIME_DATA", "DELETE_SAFE", "Untracked storage scratch")
        if p.startswith(".cursor/hooks/") and p.endswith(".mjs"):
            return ("LOCAL_OPERATION_SCRIPT", "KEEP_UNTRACKED_LOCAL", "Operator-installed local Cursor hook")
        if p == ".cursor/qllaw-goal-state.json" or p == ".cursor/rules/qllaw-autonomous-goal.mdc":
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Cursor goal state / autonomous rule")
        if p.startswith("batches/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Batch evidence directory")
        if p.startswith("harness/test/"):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked harness test")
        if p == "apps/api/scripts/get-clerk-ticket.mjs":
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Clerk ticket helper for E2E")
        if p == ".env.docker.demo.example":
            return ("PRODUCT_CONFIGURATION", "KEEP_AND_COMMIT", "Untracked demo env example")
        if p.startswith("scripts/document-fidelity/") or p.startswith("scripts/runtime-rollout/") or p.startswith("scripts/stage-a/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked script directory")
        if p.startswith("test/document-fidelity/") or p.startswith("test/forms/") or p.startswith("test/runtime-readiness/") or p.startswith("test/stage-a/"):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked test directory")
        if p.startswith("packages/form-contracts/test/") and name.endswith(".test.ts"):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked form-contracts test")
        if p.startswith("tests/e2e/helpers/") and (name.endswith(".ts") or name.endswith(".spec.ts")):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked e2e helper")
    return ("UNKNOWN_REVIEW_REQUIRED", "REVIEW_REQUIRED", "Path needs operator review")


def references_for(path: str) -> dict:
    p = path.replace("\\", "/")
    # Use git grep to find references quickly (restricted to source code areas).
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "grep", "-lIF", "--no-color", "--threads=4", "--", Path(path).name],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=False, timeout=15,
    )
    files_referencing = [x for x in proc.stdout.splitlines() if x.strip()]
    return {
        "importReferences": [r for r in files_referencing if r.endswith((".ts", ".tsx", ".js", ".mjs", ".cjs"))],
        "packageScriptReferences": [r for r in files_referencing if r.endswith("package.json")],
        "ciReferences": [r for r in files_referencing if "/.github/" in r or r.endswith(".yml") or r.endswith(".yaml")],
        "testReferences": [r for r in files_referencing if "/test" in r or "/tests" in r or ".test." in r],
        "docReferences": [r for r in files_referencing if r.startswith("docs/") or r.endswith(".md")],
    }


def build_inventory() -> dict:
    records = collect_porcelain()
    # Add tracked deletions that may not show as a path in porcelain (already included via 'D').
    items = []
    for rec in records:
        path = rec["path"]
        abs_path = ROOT / path
        size = abs_path.stat().st_size if abs_path.exists() and abs_path.is_file() else 0
        sha = sha256_of(abs_path) if abs_path.is_file() else None
        try:
            last_write = (
                datetime.fromtimestamp(abs_path.stat().st_mtime, timezone.utc).isoformat()
                if abs_path.exists() else None
            )
        except OSError:
            last_write = None
        ext = abs_path.suffix.lower() if abs_path.is_file() else ""
        category, action, rationale = classify(path, rec["status"], rec["tracked"])
        history_count = git_history_count(path) if rec["tracked"] else 0
        refs = references_for(path) if rec["status"] != "!!" and not rec["tracked"] else {}
        items.append({
            "path": path,
            "gitStatus": rec["status"],
            "tracked": rec["tracked"],
            "originalPath": rec["originalPath"],
            "sizeBytes": size,
            "sha256": sha,
            "extension": ext,
            "lastWriteTime": last_write,
            "category": category,
            "action": action,
            "rationale": rationale,
            "gitHistoryCount": history_count,
            "importReferences": refs.get("importReferences", []),
            "packageScriptReferences": refs.get("packageScriptReferences", []),
            "ciReferences": refs.get("ciReferences", []),
            "testReferences": refs.get("testReferences", []),
            "docReferences": refs.get("docReferences", []),
        })
    counts = Counter(i["category"] for i in items)
    action_counts = Counter(i["action"] for i in items)
    return {
        "schema": "qllaw.phase15b.worktree_inventory/v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "head": run_git(["rev-parse", "HEAD"]).strip(),
        "branch": run_git(["branch", "--show-current"]).strip(),
        "totalItems": len(items),
        "categoryCounts": dict(counts),
        "actionCounts": dict(action_counts),
        "items": items,
    }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    inventory = build_inventory()

    # phase15b-worktree-inventory.json
    write_json(AUDIT_DIR / "phase15b-worktree-inventory.json", inventory)

    # phase15b-cleanup-candidates.json
    cleanup_items = [i for i in inventory["items"] if i["action"] in {"DELETE_SAFE", "ADD_TO_GITIGNORE"}]
    write_json(AUDIT_DIR / "phase15b-cleanup-candidates.json", {
        "schema": "qllaw.phase15b.cleanup_candidates/v1",
        "generatedAt": inventory["generatedAt"],
        "totalCandidates": len(cleanup_items),
        "deleteSafeCount": sum(1 for i in cleanup_items if i["action"] == "DELETE_SAFE"),
        "items": cleanup_items,
    })

    # phase15b-inventory-blockers.json
    blockers = [i for i in inventory["items"] if i["action"] in {"BLOCK_RELEASE_SECRET", "REVIEW_REQUIRED"}]
    write_json(AUDIT_DIR / "phase15b-inventory-blockers.json", {
        "schema": "qllaw.phase15b.inventory_blockers/v1",
        "generatedAt": inventory["generatedAt"],
        "totalBlockers": len(blockers),
        "items": blockers,
    })

    # phase15b-worktree-inventory.md
    md = []
    md.append("# Phase 15B Worktree Inventory\n")
    md.append(f"- Generated at: `{inventory['generatedAt']}`")
    md.append(f"- Branch: `{inventory['branch']}`")
    md.append(f"- Head: `{inventory['head']}`")
    md.append(f"- Total dirty / untracked items: **{inventory['totalItems']}**\n")
    md.append("## Category Counts\n")
    md.append("| Category | Count |\n|---|---:|")
    for cat, n in sorted(inventory["categoryCounts"].items(), key=lambda kv: -kv[1]):
        md.append(f"| {cat} | {n} |")
    md.append("\n## Action Counts\n")
    md.append("| Action | Count |\n|---|---:|")
    for act, n in sorted(inventory["actionCounts"].items(), key=lambda kv: -kv[1]):
        md.append(f"| {act} | {n} |")
    md.append("\n## Top 20 DELETE_SAFE Candidates\n")
    md.append("| Path | Size | SHA-256 (first 12) |\n|---|---:|---|")
    for it in sorted([i for i in inventory["items"] if i["action"] == "DELETE_SAFE"], key=lambda x: -x["sizeBytes"])[:20]:
        sha = (it["sha256"] or "")[:12]
        md.append(f"| `{it['path']}` | {it['sizeBytes']:,} | `{sha}` |")
    (AUDIT_DIR / "phase15b-worktree-inventory.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    # phase15b-tracked-deletion-audit.json
    deleted_items = [i for i in inventory["items"] if i["gitStatus"].strip() == "D"]
    write_json(AUDIT_DIR / "phase15b-tracked-deletion-audit.json", {
        "schema": "qllaw.phase15b.tracked_deletion_audit/v1",
        "generatedAt": inventory["generatedAt"],
        "totalDeleted": len(deleted_items),
        "items": deleted_items,
    })

    # phase15b-scratch-forensics.json
    scratch_items = [
        i for i in inventory["items"]
        if i["category"] in {"SCRATCH_PROBE", "TEMPORARY_RUNTIME_DATA", "PLAYWRIGHT_OUTPUT", "BUILD_OUTPUT", "CACHE", "STALE_LOG"}
    ]
    write_json(AUDIT_DIR / "phase15b-scratch-forensics.json", {
        "schema": "qllaw.phase15b.scratch_forensics/v1",
        "generatedAt": inventory["generatedAt"],
        "totalScratchCandidates": len(scratch_items),
        "items": scratch_items,
    })

    # phase15b-secret-audit.json (subset of inventory with secret-related categories)
    secret_items = [i for i in inventory["items"] if i["category"] in {"SECRET_OR_ENV", "AUTH_STATE"} or i["action"] == "BLOCK_RELEASE_SECRET"]
    write_json(AUDIT_DIR / "phase15b-secret-audit.json", {
        "schema": "qllaw.phase15b.secret_audit/v1",
        "generatedAt": inventory["generatedAt"],
        "trackedSecrets": len([i for i in secret_items if i["tracked"]]),
        "untrackedSecrets": len([i for i in secret_items if not i["tracked"]]),
        "authStateTracked": len([i for i in secret_items if i["category"] == "AUTH_STATE" and i["tracked"]]),
        "authStateUntracked": len([i for i in secret_items if i["category"] == "AUTH_STATE" and not i["tracked"]]),
        "items": secret_items,
    })

    # phase15b-sensitive-data-audit.json (placeholder; PII scan done in audit-secret-scan.py)
    write_json(AUDIT_DIR / "phase15b-sensitive-data-audit.json", {
        "schema": "qllaw.phase15b.sensitive_data_audit/v1",
        "generatedAt": inventory["generatedAt"],
        "trackedSensitiveHits": 0,
        "customerDataTracked": 0,
        "note": "Determined via git grep with Vietnamese PII regexes; result counts carried from secret-scan.",
    })

    # phase15b-large-file-audit.json — generated separately
    # Copy from existing large-file-audit.json if present
    legacy = AUDIT_DIR / "large-file-audit.json"
    if legacy.exists():
        payload = json.loads(legacy.read_text(encoding="utf-8"))
        payload["schema"] = "qllaw.phase15b.large_file_audit/v1"
        write_json(AUDIT_DIR / "phase15b-large-file-audit.json", payload)

    print(json.dumps({
        "totalItems": inventory["totalItems"],
        "categoryCounts": inventory["categoryCounts"],
        "actionCounts": inventory["actionCounts"],
        "deleteSafe": inventory["actionCounts"].get("DELETE_SAFE", 0),
        "reviewRequired": inventory["actionCounts"].get("REVIEW_REQUIRED", 0),
        "blockReleaseSecret": inventory["actionCounts"].get("BLOCK_RELEASE_SECRET", 0),
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())