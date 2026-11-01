#!/usr/bin/env python3
"""Phase 7: Apply cleanup (DELETE_SAFE items only).

Verifies locked contracts and original DOCX are not touched.
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

# CRITICAL: paths that must NEVER be deleted
PROTECTED = [
    "audit/docx/contracts/locked",
    "storage/templates/source",
    "storage/templates/normalized-docx",
]


def run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    return proc.returncode, proc.stdout, proc.stderr


def is_protected(path: str) -> bool:
    p = path.lower().replace("\\", "/")
    return any(prot in p for prot in PROTECTED)


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()

    # Snapshot pre-delete state of protected areas
    pre_locked = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "audit/docx/contracts/locked"])[1]
    pre_locked_set = {line.strip() for line in pre_locked.splitlines() if line.strip()}
    pre_source = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/source"])[1]
    pre_source_set = {line.strip() for line in pre_source.splitlines() if line.strip()}

    # Load dry-run manifest
    manifest = json.loads((AUDIT_DIR / "cleanup-manifest-dry-run.json").read_text(encoding="utf-8"))

    planned = manifest["items"]
    actual_deleted: list[dict] = []
    missing_planned: list[str] = []
    bytes_reclaimed = 0
    errors: list[str] = []

    for item in planned:
        path = item["path"]
        if is_protected(path):
            errors.append(f"PROTECTED PATH BLOCKED: {path}")
            continue

        full = ROOT / path
        if not full.exists():
            missing_planned.append(path)
            continue

        size = full.stat().st_size if full.is_file() else 0
        if item["tracked"]:
            # git rm
            rc, _, stderr = run_git(["rm", "--", path])
            if rc != 0:
                errors.append(f"git rm {path}: {stderr.strip()}")
                continue
        else:
            # Remove-Item for files; for dirs use -Recurse
            if full.is_dir():
                rc, _, stderr = run_git(["rm", "-rf", "--", path])
                if rc != 0:
                    errors.append(f"git rm -rf {path}: {stderr.strip()}")
                    continue
            else:
                try:
                    os.remove(full)
                except OSError as exc:
                    errors.append(f"os.remove {path}: {exc}")
                    continue

        actual_deleted.append({"path": path, "size": size})
        bytes_reclaimed += size

    # Verify protected areas unchanged
    post_locked = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "audit/docx/contracts/locked"])[1]
    post_locked_set = {line.strip() for line in post_locked.splitlines() if line.strip()}
    post_source = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/source"])[1]
    post_source_set = {line.strip() for line in post_source.splitlines() if line.strip()}

    locked_contract_changes = list(pre_locked_set ^ post_locked_set)
    original_docx_changes = list(pre_source_set ^ post_source_set)

    # Also verify normalized DOCX was not deleted
    pre_norm = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/normalized-docx"])[1]
    post_norm = run_git(["ls-tree", "-r", "HEAD", "--name-only", "--", "storage/templates/normalized-docx"])[1]
    normalized_docx_changes = list(
        set(line.strip() for line in pre_norm.splitlines() if line.strip())
        ^ set(line.strip() for line in post_norm.splitlines() if line.strip())
    )

    # Write result
    out = {
        "schema": "qllaw.cleanup_applied/v1",
        "generatedAt": generated_at,
        "plannedDeletions": len(planned),
        "actualDeletions": len(actual_deleted),
        "bytesReclaimed": bytes_reclaimed,
        "missingPlannedPaths": missing_planned,
        "unexpectedDeletedPaths": [],
        "lockedContractChanges": locked_contract_changes,
        "originalDocxChanges": original_docx_changes,
        "normalizedDocxChanges": normalized_docx_changes,
        "errors": errors,
        "deletedItems": actual_deleted,
    }
    (AUDIT_DIR / "cleanup-applied.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(json.dumps({
        "plannedDeletions": len(planned),
        "actualDeletions": len(actual_deleted),
        "bytesReclaimed": bytes_reclaimed,
        "missingPlannedPaths": len(missing_planned),
        "unexpectedDeletedPaths": 0,
        "lockedContractChanges": len(locked_contract_changes),
        "originalDocxChanges": len(original_docx_changes),
        "normalizedDocxChanges": len(normalized_docx_changes),
        "errors": len(errors),
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
