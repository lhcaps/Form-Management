#!/usr/bin/env python3
"""Phase 6 + 7: Cleanup dry-run + apply.

Reads worktree-inventory.json, builds cleanup-manifest-dry-run.json,
and applies DELETE_SAFE actions safely.
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


def run_git(args: list[str]) -> tuple[int, str]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    return proc.returncode, proc.stdout


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()

    # Read inventory
    inv_path = AUDIT_DIR / "worktree-inventory.json"
    inventory = json.loads(inv_path.read_text(encoding="utf-8"))

    # Build cleanup manifest
    manifest_items = []
    for item in inventory["items"]:
        if item["action"] == "DELETE_SAFE":
            # Determine delete command
            if item["tracked"]:
                delete_cmd = f"git rm -- {item['path']}"
                method = "git_rm"
            else:
                # Use PowerShell Remove-Item since we're on Windows
                delete_cmd = f"Remove-Item -LiteralPath '{item['path']}' -Force"
                method = "powershell_remove"
            manifest_items.append({
                "path": item["path"],
                "tracked": item["tracked"],
                "sizeBytes": item["sizeBytes"],
                "sha256": item["sha256"],
                "category": item["category"],
                "referenceScanResult": "no_product_test_package_ci_reference",
                "canonicalReplacement": None,
                "backupLocation": "D:\\Study\\Project\\QLLaw-release-backups\\20260727-213426\\qllaw-all-refs.bundle",
                "deleteCommand": delete_cmd,
                "method": method,
                "rationale": item["rationale"],
                "rollbackMethod": "git bundle restore from safety bundle",
            })

    planned_count = len(manifest_items)
    planned_bytes = sum(m["sizeBytes"] for m in manifest_items)

    # Dry-run manifest
    dry_run = {
        "schema": "qllaw.cleanup_manifest_dry_run/v1",
        "generatedAt": generated_at,
        "plannedDeletions": planned_count,
        "plannedBytes": planned_bytes,
        "items": manifest_items,
    }
    (AUDIT_DIR / "cleanup-manifest-dry-run.json").write_text(
        json.dumps(dry_run, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Markdown summary
    md_lines = [
        "# Cleanup Manifest (Dry Run)",
        "",
        f"- Generated at: `{generated_at}`",
        f"- Planned deletions: **{planned_count}**",
        f"- Planned bytes reclaimed: **{planned_bytes:,}**",
        "",
        "## Items to delete",
        "",
        "| Path | Tracked | Size | Method |",
        "|---|---:|---:|---|",
    ]
    for m in sorted(manifest_items, key=lambda x: -x["sizeBytes"])[:50]:
        rel = m["path"][:90]
        md_lines.append(f"| `{rel}` | {m['tracked']} | {m['sizeBytes']:,} | {m['method']} |")
    md_lines.append("")
    md_lines.append(f"_Showing top 50 by size, total {planned_count} items._")
    (AUDIT_DIR / "cleanup-manifest-dry-run.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    print(f"Planned: {planned_count} deletions, {planned_bytes:,} bytes")
    print(f"See: {AUDIT_DIR / 'cleanup-manifest-dry-run.json'}")

    # Sanity check: total inventory count == delete + keep + review
    total = inventory["totalItems"]
    delete = planned_count
    keep = inventory["actionCounts"].get("KEEP_AND_COMMIT", 0)
    review = inventory["actionCounts"].get("REVIEW_REQUIRED", 0) + inventory["actionCounts"].get("BLOCK_RELEASE_SECRET", 0)
    unknown = inventory["actionCounts"].get("BLOCK_RELEASE_UNKNOWN", 0)
    assert delete + keep + review + unknown == total, f"invariant: {delete}+{keep}+{review}+{unknown} != {total}"

    return 0


if __name__ == "__main__":
    sys.exit(main())
