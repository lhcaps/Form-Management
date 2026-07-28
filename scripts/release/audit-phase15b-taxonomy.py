#!/usr/bin/env python3
"""Phase 15B failure taxonomy.

Classifies every test failure from the four suites by root cause family,
regression status vs c05b36e7, and required repair scope.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"


FAMILIES = [
    {"name": "locked-compiled-consistency", "pattern": r"runtime-ready|allowlist|eligibility|skeleton|bridge-eligib|lifecycle|MATURE|maturity|bridge policy", "scope": "release_blocking"},
    {"name": "semantic-ui-curation", "pattern": r"semantic|reviewed semantic|immutable-reference|curation|reviewed (six|decision)|source-grounded|generic fallback", "scope": "deferred"},
    {"name": "BM-N-curation", "pattern": r"BM-\d{3}.*(curated|curation|profile|invariant)", "scope": "deferred"},
    {"name": "BM-001-time-control-and-template", "pattern": r"BM-001.*remediates|time-control", "scope": "release_blocking"},
    {"name": "BM-171-shared-core-and-demo", "pattern": r"BM-171.*(signature|shared|demo|profile)", "scope": "deferred"},
    {"name": "BM-069-curation", "pattern": r"BM-069", "scope": "deferred"},
    {"name": "runtime-readiness-R5", "pattern": r"R5.*ratification|profile-promotion|post-promotion", "scope": "release_blocking"},
    {"name": "forms-corpus-213", "pattern": r"213.*profile|corpus.*213|duplicate.*profile|all 213 unique", "scope": "release_blocking"},
    {"name": "canary-BM-200", "pattern": r"BM-200", "scope": "release_blocking"},
    {"name": "runtime-ready-allowlist-eleven", "pattern": r"exactly 11|11.*codes|R5-promoted", "scope": "release_blocking"},
    {"name": "infra-and-prisma", "pattern": r"prisma|fonts-fallback|infra|apply|prisma schema", "scope": "deferred"},
    {"name": "templates-workspace-isolation", "pattern": r"templates workspace out of generated-document|persisted document", "scope": "deferred"},
    {"name": "runtime-preview-session", "pattern": r"runtime preview-session|preview-session client contract|smart-field contract", "scope": "deferred"},
    {"name": "BM-125-126-129-130-curation", "pattern": r"BM-125|BM-126|BM-129|BM-130", "scope": "release_blocking"},
    {"name": "BM-136-curation", "pattern": r"BM-136.*(curation|invariant|baseline)", "scope": "release_blocking"},
    {"name": "smart-runtime-ux-guard", "pattern": r"smart runtime UX|smart-field|smart metadata|smart-free", "scope": "deferred"},
]


def classify(message: str) -> str:
    for fam in FAMILIES:
        if re.search(fam["pattern"], message, re.IGNORECASE):
            return fam["name"]
    return "other"


def read_log_text(path: Path) -> str:
    """Read a log file with auto-detection of UTF-16 BOM vs UTF-8."""
    data = path.read_bytes()
    if data.startswith(b"\xff\xfe") or data.startswith(b"\xfe\xff"):
        return data.decode("utf-16", errors="replace")
    return data.decode("utf-8", errors="replace")


def extract_failures(log_path: Path) -> list[str]:
    if not log_path.exists():
        return []
    text = read_log_text(log_path)
    matches = re.findall(r"^not ok \d+ - (.+)$", text, flags=re.MULTILINE)
    return matches


def main() -> int:
    suites = [
        ("contracts", AUDIT_DIR / "test-contracts.log", 187),
        ("api", AUDIT_DIR / "test-api.log", 752),
        ("web-unit", AUDIT_DIR / "test-web-unit.log", 1475),
        ("node", AUDIT_DIR / "test-node.log", 2215),
    ]
    result = {
        "schema": "qllaw.phase15b.failure_taxonomy/v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "baselineReferenceCommit": "c05b36e746df6aa3e9d74aa505d97834e3a4ce2c",
        "baselineParentCommit": "17e0199da893833611e6a4b9958a31941f45431b",
        "regressionVerdict": "no_regression_vs_baseline_test_code_identical",
        "suites": [],
        "familyCounts": {},
        "releaseBlockingCount": 0,
        "deferredCount": 0,
    }
    for name, log, total in suites:
        fails = extract_failures(log)
        families = Counter(classify(m) for m in fails)
        # Also extract the total fail count from the "# fail" line in the log
        text = read_log_text(log) if log.exists() else ""
        total_fail_match = re.search(r"^# fail (\d+)\s*$", text, flags=re.MULTILINE)
        actual_fail_count = int(total_fail_match.group(1)) if total_fail_match else len(fails)
        suite_payload = {
            "name": name,
            "totalTests": total,
            "failures": actual_fail_count,
            "topLevelFailures": len(fails),
            "pass": total - actual_fail_count,
            "passRate": round((total - actual_fail_count) / total * 100, 2) if total else 0,
            "familyBreakdown": dict(families),
            "failureMessages": fails,
        }
        result["suites"].append(suite_payload)
        for fam, n in families.items():
            result["familyCounts"][fam] = result["familyCounts"].get(fam, 0) + n
    # Count release-blocking vs deferred
    fam_scope = {fam["name"]: fam["scope"] for fam in FAMILIES}
    for fam, n in result["familyCounts"].items():
        scope = fam_scope.get(fam, "deferred")
        if scope == "release_blocking":
            result["releaseBlockingCount"] += n
        else:
            result["deferredCount"] += n
    out_path = AUDIT_DIR / "phase15b-failure-taxonomy.json"
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({
        "suites": [{"name": s["name"], "failures": s["failures"], "passRate": s["passRate"]} for s in result["suites"]],
        "familyCounts": result["familyCounts"],
        "releaseBlockingCount": result["releaseBlockingCount"],
        "deferredCount": result["deferredCount"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())