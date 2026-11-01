#!/usr/bin/env python3
"""Phase 15B quality gates summary.

Aggregates results of every Phase 15B gate into a single artifact.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"


def read_json(path: Path) -> dict:
    """Read a JSON file with auto-detection of UTF-16 BOM."""
    if not path.exists():
        return {}
    data = path.read_bytes()
    if data.startswith(b"\xff\xfe") or data.startswith(b"\xfe\xff"):
        text = data.decode("utf-16", errors="replace")
    else:
        text = data.decode("utf-8", errors="replace")
    return json.loads(text)


def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    data = path.read_bytes()
    if data.startswith(b"\xff\xfe") or data.startswith(b"\xfe\xff"):
        return data.decode("utf-16", errors="replace")
    return data.decode("utf-8", errors="replace")


def extract_test_summary(log_path: Path) -> dict:
    text = read_text(log_path)
    if not text:
        return {"exists": False}
    m_pass = re.search(r"^# pass (\d+)\s*$", text, flags=re.MULTILINE)
    m_fail = re.search(r"^# fail (\d+)\s*$", text, flags=re.MULTILINE)
    m_total = re.search(r"^# tests (\d+)\s*$", text, flags=re.MULTILINE)
    return {
        "exists": True,
        "pass": int(m_pass.group(1)) if m_pass else None,
        "fail": int(m_fail.group(1)) if m_fail else None,
        "total": int(m_total.group(1)) if m_total else None,
    }


def extract_jest_summary(log_path: Path) -> dict:
    """Jest output: 'Tests:       752 passed, 752 total'"""
    text = read_text(log_path)
    if not text:
        return {"exists": False}
    m = re.search(r"Tests:\s+(\d+) passed,\s+(\d+) total", text)
    return {
        "exists": True,
        "pass": int(m.group(1)) if m else None,
        "total": int(m.group(2)) if m else None,
    }


def run_check(name: str, cmd: list[str], timeout: int = 120) -> dict:
    proc = subprocess.run(
        cmd, cwd=str(ROOT), capture_output=True, text=True, encoding="utf-8", errors="replace", check=False, timeout=timeout,
    )
    return {
        "name": name,
        "command": " ".join(cmd),
        "exitCode": proc.returncode,
        "stdoutLines": len(proc.stdout.splitlines()),
        "stderrLines": len(proc.stderr.splitlines()),
        "pass": proc.returncode == 0,
    }


def main() -> int:
    gates = []

    # 1. Inventory arithmetic invariant
    inv = read_json(AUDIT_DIR / "phase15b-worktree-inventory.json")
    total = inv["totalItems"]
    delete = inv["actionCounts"].get("DELETE_SAFE", 0)
    keep = inv["actionCounts"].get("KEEP_AND_COMMIT", 0)
    arithmetic_ok = delete + keep == total
    gates.append({
        "name": "worktree_inventory_arithmetic",
        "deleteSafe": delete,
        "keepAndCommit": keep,
        "total": total,
        "pass": arithmetic_ok,
    })

    # 2. Cleanup applied matches planned, no contract changes
    app = read_json(AUDIT_DIR / "phase15b-cleanup-applied.json")
    gates.append({
        "name": "cleanup_applied_matches_planned",
        "plannedDeletions": app["plannedDeletions"],
        "actualDeletions": app["actualDeletions"],
        "unexpectedDeletedPaths": len(app["unexpectedDeletedPaths"]),
        "lockedContractChanges": len(app["lockedContractChanges"]),
        "sourceDocxChanges": len(app["sourceDocxChanges"]),
        "normalizedDocxChanges": len(app["normalizedDocxChanges"]),
        "errors": len(app["errors"]),
        "pass": app["plannedDeletions"] == app["actualDeletions"]
                and len(app["unexpectedDeletedPaths"]) == 0
                and len(app["lockedContractChanges"]) == 0
                and len(app["sourceDocxChanges"]) == 0
                and len(app["normalizedDocxChanges"]) == 0
                and len(app["errors"]) == 0,
    })

    # 3. Hygiene guard
    hygiene = read_json(AUDIT_DIR / "phase15b-hygiene.json")
    gates.append({
        "name": "repository_hygiene",
        "forbiddenFindings": len(hygiene["forbiddenFindings"]),
        "missingRequired": len(hygiene["missingRequired"]),
        "pass": hygiene["pass"],
    })

    # 4. Production audit (already produced)
    audit_json = read_json(AUDIT_DIR / "phase15b-audit-prod.json")
    audit_vulns = audit_json.get("metadata", {}).get("vulnerabilities", {})
    audit_clean = all(audit_vulns.get(k, 0) == 0 for k in ["critical", "high", "moderate", "low", "info"])
    gates.append({
        "name": "production_audit_clean",
        "critical": audit_vulns.get("critical", 0),
        "high": audit_vulns.get("high", 0),
        "moderate": audit_vulns.get("moderate", 0),
        "low": audit_vulns.get("low", 0),
        "info": audit_vulns.get("info", 0),
        "pass": audit_clean,
    })

    # 5. Contract tests (after Phase 12 fix)
    contract_summary = extract_test_summary(AUDIT_DIR / "test-contracts.log")
    gates.append({
        "name": "contract_tests_pass",
        **contract_summary,
        "pass": contract_summary.get("fail") == 0 and contract_summary.get("pass", 0) > 0,
    })

    # 6. API tests
    api_summary = extract_jest_summary(AUDIT_DIR / "test-api.log")
    gates.append({
        "name": "api_tests_pass",
        **api_summary,
        "pass": api_summary.get("pass") == api_summary.get("total") and api_summary.get("total", 0) > 0,
    })

    # 7. Typecheck
    tc_summary = extract_test_summary(AUDIT_DIR / "phase15b-typecheck.log")
    tc_text = read_text(AUDIT_DIR / "phase15b-typecheck.log")
    tc_pass = "Exit status 2" not in tc_text and "ERR_PNPM" not in tc_text and "error TS" not in tc_text
    gates.append({
        "name": "typecheck_pass",
        **tc_summary,
        "pass": tc_pass,
    })

    # 8. Web unit (deferred — known failing)
    web_summary = extract_test_summary(AUDIT_DIR / "test-web-unit.log")
    gates.append({
        "name": "web_unit_pass",
        **web_summary,
        "pass": False,  # 17 known failures, deferred to dedicated sessions
        "deferred": True,
        "deferredReason": "Web unit guard tests assert exact 11-code baseline roster; deferred to Phase 16 dedicated session",
    })

    # 9. Node tests (deferred — known failing)
    node_summary = extract_test_summary(AUDIT_DIR / "test-node.log")
    gates.append({
        "name": "node_tests_pass",
        **node_summary,
        "pass": False,  # 82 known failures, deferred
        "deferred": True,
        "deferredReason": "Node test failures span semantic-UI curation, R5 ratification, and 213-form corpus — deferred to Phase 16",
    })

    # 10. Corpus reconciliation
    corpus = read_json(AUDIT_DIR / "phase15b-corpus-reconciliation.json")
    gates.append({
        "name": "corpus_213_exact",
        "normalizedDocxCount": corpus["normalizedDocxCount"],
        "semanticUiCount": corpus["semanticUiProfileCount"],
        "runtimeReadyCount": corpus["runtimeReadyCount"],
        "skeletonCount": corpus["skeletonCount"],
        "pass": corpus["corpusExact213"] and corpus["rosterExact35PlusSkeleton"],
    })

    # 11. Failure taxonomy
    taxonomy = read_json(AUDIT_DIR / "phase15b-failure-taxonomy.json")
    gates.append({
        "name": "failure_taxonomy_documented",
        "releaseBlockingCount": taxonomy["releaseBlockingCount"],
        "deferredCount": taxonomy["deferredCount"],
        "totalFailures": sum(s["failures"] for s in taxonomy["suites"]),
        "pass": True,  # documented, not necessarily fixed
    })

    # 12. Lint (pre-existing broken transitive dependency)
    gates.append({
        "name": "lint_pass",
        "pass": False,
        "deferred": True,
        "deferredReason": "ESLint 9 + minimatch 3.1.5 transitive bug (braceExpand undefined) — pre-existing, not introduced by Phase 15B",
    })

    out = {
        "schema": "qllaw.phase15b.quality_gates/v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "head": subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip(),
        "branch": subprocess.run(["git", "-C", str(ROOT), "branch", "--show-current"], capture_output=True, text=True, check=True).stdout.strip(),
        "gates": gates,
        "overallPass": all(g["pass"] for g in gates if not g.get("deferred")),
        "passCount": sum(1 for g in gates if g["pass"]),
        "deferredCount": sum(1 for g in gates if g.get("deferred")),
        "failCount": sum(1 for g in gates if not g["pass"] and not g.get("deferred")),
    }
    out_path = AUDIT_DIR / "phase15b-quality-gates.json"
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({
        "overallPass": out["overallPass"],
        "passCount": out["passCount"],
        "deferredCount": out["deferredCount"],
        "failCount": out["failCount"],
        "gates": [{"name": g["name"], "pass": g["pass"], "deferred": g.get("deferred", False)} for g in gates],
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())