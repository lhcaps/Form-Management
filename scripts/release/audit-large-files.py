#!/usr/bin/env python3
"""Phase 5: Large file and binary audit."""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"

LARGE_THRESHOLD = 5 * 1024 * 1024  # 5 MB
HUGE_THRESHOLD = 100 * 1024 * 1024  # 100 MB GitHub limit


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

    # Get all tracked files with sizes via git ls-files + stat
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "-z"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    tracked_files = [f for f in proc.stdout.split("\x00") if f]

    proc = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "--others", "--exclude-standard", "-z"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    untracked_files = [f for f in proc.stdout.split("\x00") if f]

    def classify(file_path: str) -> tuple[str, bool, bool]:
        p = file_path.lower()
        ext = Path(file_path).suffix.lower()
        is_binary = ext in {".docx", ".pdf", ".zip", ".7z", ".rar", ".png", ".jpg", ".jpeg", ".gif", ".sqlite", ".sqlite3", ".db", ".woff", ".woff2", ".ttf"}
        # Canonical vs runtime
        if "audit/docx/contracts/locked" in p or "storage/templates/normalized-docx" in p or "storage/templates/source" in p:
            return ("CANONICAL", True, True)
        if "storage/generated/" in p or "storage/runtime-preview-sessions/" in p:
            return ("RUNTIME_GENERATED", False, False)
        if "/screenshots/" in p:
            return ("PLAYWRIGHT_OUTPUT", False, False)
        return ("OTHER", False, False)

    def audit_file(path: str, tracked: bool) -> dict | None:
        full = ROOT / path
        if not full.is_file():
            return None
        try:
            size = full.stat().st_size
        except OSError:
            return None
        if size < LARGE_THRESHOLD:
            return None
        category, canonical, runtime_required = classify(path)
        action = "KEEP_TRACKED" if tracked and canonical else "REVIEW"
        if not tracked:
            action = "KEEP_UNTRACKED"
        return {
            "path": path,
            "sizeBytes": size,
            "tracked": tracked,
            "category": category,
            "canonical": canonical,
            "requiredAtRuntime": runtime_required,
            "overGithubLimit": size > HUGE_THRESHOLD,
            "action": action,
        }

    findings: list[dict] = []
    for f in tracked_files:
        r = audit_file(f, True)
        if r:
            findings.append(r)
    for f in untracked_files:
        r = audit_file(f, False)
        if r:
            findings.append(r)

    findings.sort(key=lambda x: -x["sizeBytes"])

    summary = {
        "schema": "qllaw.large_file_audit/v1",
        "generatedAt": generated_at,
        "largeThresholdBytes": LARGE_THRESHOLD,
        "hugeThresholdBytes": HUGE_THRESHOLD,
        "totalLargeFiles": len(findings),
        "overGithubLimit": sum(1 for f in findings if f["overGithubLimit"]),
        "trackedLargeFiles": sum(1 for f in findings if f["tracked"]),
        "untrackedLargeFiles": sum(1 for f in findings if not f["tracked"]),
        "findings": findings[:200],
    }
    (AUDIT_DIR / "large-file-audit.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(json.dumps({
        "totalLargeFiles": summary["totalLargeFiles"],
        "overGithubLimit": summary["overGithubLimit"],
        "trackedLargeFiles": summary["trackedLargeFiles"],
        "untrackedLargeFiles": summary["untrackedLargeFiles"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
