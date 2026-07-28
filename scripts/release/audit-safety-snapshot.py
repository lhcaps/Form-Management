#!/usr/bin/env python3
"""Phase 0: Generate safety-snapshot.json with backup metadata + git state."""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"
BACKUP_DIR_NAME = "20260727-213426"
BACKUP_DIR = Path(rf"d:\Study\Project\QLLaw-release-backups\{BACKUP_DIR_NAME}")


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def run_git(args: list[str]) -> str:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    return proc.stdout


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()

    bundle = BACKUP_DIR / "qllaw-all-refs.bundle"
    wt_patch = BACKUP_DIR / "working-tree.patch"
    st_patch = BACKUP_DIR / "staged.patch"

    snapshot = {
        "schema": "qllaw.safety_snapshot/v1",
        "generatedAt": generated_at,
        "backupDirectory": str(BACKUP_DIR),
        "backupTimestamp": BACKUP_DIR_NAME,
        "bundlePath": str(bundle),
        "bundleSha256": sha256_file(bundle) if bundle.exists() else None,
        "bundleSizeBytes": bundle.stat().st_size if bundle.exists() else 0,
        "workingTreePatchPath": str(wt_patch),
        "workingTreePatchSha256": sha256_file(wt_patch) if wt_patch.exists() else None,
        "workingTreePatchSizeBytes": wt_patch.stat().st_size if wt_patch.exists() else 0,
        "stagedPatchPath": str(st_patch),
        "stagedPatchSha256": sha256_file(st_patch) if st_patch.exists() else None,
        "stagedPatchSizeBytes": st_patch.stat().st_size if st_patch.exists() else 0,
        "currentHead": run_git(["rev-parse", "HEAD"]).strip(),
        "currentBranch": run_git(["branch", "--show-current"]).strip(),
        "remoteUrls": [line.strip() for line in run_git(["remote", "-v"]).splitlines() if line.strip()],
        "stagedCount": len(run_git(["diff", "--cached", "--name-only"]).splitlines()),
        "trackedModifiedCount": sum(
            1
            for line in run_git(["status", "--porcelain=v1", "-z", "--untracked-files=no", "--ignored=no"]).split("\x00")
            if line and (line.startswith(" M") or line.startswith("M "))
        ),
        "trackedDeletedCount": sum(
            1
            for line in run_git(["status", "--porcelain=v1", "-z", "--untracked-files=no", "--ignored=no"]).split("\x00")
            if line and (line.startswith(" D") or line.startswith("D "))
        ),
        "untrackedCount": len(
            [
                line
                for line in run_git(["status", "--porcelain=v1", "-z", "--untracked-files=normal", "--ignored=no"]).split("\x00")
                if line.startswith("??")
            ]
        ),
        "safetyBranch": f"safety/pre-release-cleanup-{BACKUP_DIR_NAME}",
        "verificationCommands": [
            "git bundle verify",
            "git apply --check working-tree.patch",
            "git apply --check staged.patch",
        ],
    }

    (AUDIT_DIR / "safety-snapshot.json").write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(snapshot, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
