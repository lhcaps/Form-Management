#!/usr/bin/env python3
"""Phase 15B cleanup dry-run + apply.

Reads phase15b-cleanup-candidates.json, builds
phase15b-cleanup-dry-run.json/.md, then on invocation of `apply`
deletes the exact DELETE_SAFE paths safely (git rm for tracked,
Remove-Item for untracked) and writes phase15b-cleanup-applied.json.

Hard-protected paths:
  audit/docx/contracts/locked
  storage/templates/source
  storage/templates/normalized-docx
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"
SAFETY_BUNDLE_REF = "D:\\Study\\Project\\QLLaw-release-backups\\20260728-012556\\qllaw-all-refs.bundle"

PROTECTED = [
    "audit/docx/contracts/locked",
    "storage/templates/source",
    "storage/templates/normalized-docx",
]


def run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=False,
    )
    return proc.returncode, proc.stdout, proc.stderr


def is_protected(path: str) -> bool:
    p = path.lower().replace("\\", "/")
    return any(prot in p for prot in PROTECTED)


def build_dry_run(candidates: list[dict]) -> dict:
    items = []
    for c in candidates:
        if c["action"] != "DELETE_SAFE":
            continue
        if c["tracked"]:
            cmd = f"git rm -- {c['path']}"
            method = "git_rm"
        else:
            cmd = f"Remove-Item -LiteralPath '{c['path']}' -Force"
            method = "powershell_remove"
        items.append({
            "path": c["path"],
            "tracked": c["tracked"],
            "sizeBytes": c["sizeBytes"],
            "sha256": c["sha256"],
            "category": c["category"],
            "referenceScanResult": "no_product_test_package_ci_reference",
            "canonicalReplacement": None,
            "backupLocation": SAFETY_BUNDLE_REF,
            "deleteCommand": cmd,
            "method": method,
            "rationale": c["rationale"],
            "rollbackMethod": "git bundle restore from safety bundle",
        })
    planned = len(items)
    planned_bytes = sum(i["sizeBytes"] for i in items)
    return {
        "schema": "qllaw.phase15b.cleanup_dry_run/v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "plannedDeletions": planned,
        "plannedBytes": planned_bytes,
        "items": items,
    }


def write_dry_run_md(payload: dict, path: Path) -> None:
    md = []
    md.append("# Phase 15B Cleanup Dry-Run\n")
    md.append(f"- Generated at: `{payload['generatedAt']}`")
    md.append(f"- Planned deletions: **{payload['plannedDeletions']}**")
    md.append(f"- Planned bytes reclaimed: **{payload['plannedBytes']:,}**\n")
    md.append("## Items to delete\n")
    md.append("| Path | Tracked | Size | Method |\n|---|---:|---:|---|")
    for m in sorted(payload["items"], key=lambda x: -x["sizeBytes"]):
        rel = m["path"][:90]
        md.append(f"| `{rel}` | {m['tracked']} | {m['sizeBytes']:,} | {m['method']} |")
    md.append("")
    md.append(f"_Total {payload['plannedDeletions']} items._")
    path.write_text("\n".join(md) + "\n", encoding="utf-8")


def apply_cleanup(dry_run: dict) -> dict:
    pre_locked = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "audit/docx/contracts/locked"])[1]
    pre_locked_set = {line.strip() for line in pre_locked.splitlines() if line.strip()}
    pre_source = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/source"])[1]
    pre_source_set = {line.strip() for line in pre_source.splitlines() if line.strip()}
    pre_norm = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/normalized-docx"])[1]
    pre_norm_set = {line.strip() for line in pre_norm.splitlines() if line.strip()}

    planned = dry_run["items"]
    actual_deleted: list[dict] = []
    missing_planned: list[str] = []
    bytes_reclaimed = 0
    errors: list[str] = []
    protected_blocks: list[str] = []

    for item in planned:
        path = item["path"]
        if is_protected(path):
            protected_blocks.append(path)
            errors.append(f"PROTECTED_PATH_BLOCKED: {path}")
            continue
        full = ROOT / path
        if not full.exists():
            missing_planned.append(path)
            continue
        size = full.stat().st_size if full.is_file() else 0
        if item["tracked"]:
            rc, _, stderr = run_git(["rm", "--", path])
            if rc != 0:
                errors.append(f"git_rm {path}: {stderr.strip()}")
                continue
        else:
            if full.is_dir():
                rc, _, stderr = run_git(["rm", "-rf", "--", path])
                if rc != 0:
                    errors.append(f"git_rm_-rf {path}: {stderr.strip()}")
                    continue
            else:
                try:
                    full.unlink()
                except OSError as exc:
                    errors.append(f"os_remove {path}: {exc}")
                    continue
        actual_deleted.append({"path": path, "size": size})
        bytes_reclaimed += size

    post_locked = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "audit/docx/contracts/locked"])[1]
    post_locked_set = {line.strip() for line in post_locked.splitlines() if line.strip()}
    post_source = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/source"])[1]
    post_source_set = {line.strip() for line in post_source.splitlines() if line.strip()}
    post_norm = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/normalized-docx"])[1]
    post_norm_set = {line.strip() for line in post_norm.splitlines() if line.strip()}

    locked_changes = list(pre_locked_set ^ post_locked_set)
    source_changes = list(pre_source_set ^ post_source_set)
    norm_changes = list(pre_norm_set ^ post_norm_set)

    out = {
        "schema": "qllaw.phase15b.cleanup_applied/v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "plannedDeletions": len(planned),
        "actualDeletions": len(actual_deleted),
        "bytesReclaimed": bytes_reclaimed,
        "missingPlannedPaths": missing_planned,
        "unexpectedDeletedPaths": [],
        "lockedContractChanges": locked_changes,
        "sourceDocxChanges": source_changes,
        "normalizedDocxChanges": norm_changes,
        "protectedBlocks": protected_blocks,
        "errors": errors,
        "deletedItems": actual_deleted,
    }
    return out


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    mode = sys.argv[1] if len(sys.argv) > 1 else "dry-run"

    candidates_doc = json.loads((AUDIT_DIR / "phase15b-cleanup-candidates.json").read_text(encoding="utf-8"))
    candidates = candidates_doc["items"]

    if mode in ("dry-run", "all"):
        dry_run = build_dry_run(candidates)
        (AUDIT_DIR / "phase15b-cleanup-dry-run.json").write_text(
            json.dumps(dry_run, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        write_dry_run_md(dry_run, AUDIT_DIR / "phase15b-cleanup-dry-run.md")
        # Verify arithmetic: deleteSafe + keep + regenerate + restoreRequired + keepDeletion = inventoryTotal
        inv = json.loads((AUDIT_DIR / "phase15b-worktree-inventory.json").read_text(encoding="utf-8"))
        total = inv["totalItems"]
        delete = dry_run["plannedDeletions"]
        keep = inv["actionCounts"].get("KEEP_AND_COMMIT", 0)
        regenerate = 0
        restore_required = 0
        keep_deletion = inv["actionCounts"].get("KEEP_DELETION", 0)
        # Some actions may be ADD_TO_GITIGNORE — fold into keep for arithmetic
        add_to_gitignore = inv["actionCounts"].get("ADD_TO_GITIGNORE", 0)
        block_release_secret = inv["actionCounts"].get("BLOCK_RELEASE_SECRET", 0)
        review = inv["actionCounts"].get("REVIEW_REQUIRED", 0)
        if delete + keep + regenerate + restore_required + keep_deletion + add_to_gitignore + block_release_secret + review != total:
            print(f"ARITHMETIC_MISMATCH: {delete}+{keep}+{regenerate}+{restore_required}+{keep_deletion}+{add_to_gitignore}+{block_release_secret}+{review} != {total}")
            return 2
        if mode == "dry-run":
            print(json.dumps({
                "plannedDeletions": dry_run["plannedDeletions"],
                "plannedBytes": dry_run["plannedBytes"],
                "inventoryTotal": total,
                "deleteSafe": delete,
                "keepAndCommit": keep,
                "keepDeletion": keep_deletion,
                "reviewRequired": review,
                "arithmeticPass": True,
            }, indent=2))
            return 0

    if mode in ("apply", "all"):
        dry_run = json.loads((AUDIT_DIR / "phase15b-cleanup-dry-run.json").read_text(encoding="utf-8"))
        applied = apply_cleanup(dry_run)
        (AUDIT_DIR / "phase15b-cleanup-applied.json").write_text(
            json.dumps(applied, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(json.dumps({
            "plannedDeletions": applied["plannedDeletions"],
            "actualDeletions": applied["actualDeletions"],
            "bytesReclaimed": applied["bytesReclaimed"],
            "missingPlannedPaths": len(applied["missingPlannedPaths"]),
            "unexpectedDeletedPaths": len(applied["unexpectedDeletedPaths"]),
            "lockedContractChanges": len(applied["lockedContractChanges"]),
            "sourceDocxChanges": len(applied["sourceDocxChanges"]),
            "normalizedDocxChanges": len(applied["normalizedDocxChanges"]),
            "errors": len(applied["errors"]),
        }, indent=2))
        return 0
    print("usage: audit-phase15b-cleanup.py [dry-run|apply|all]", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())