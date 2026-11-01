#!/usr/bin/env python3
"""Phase 1: Remote and PR reconciliation."""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"


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


def run_gh(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["gh", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        cwd=str(ROOT),
    )
    return proc.returncode, proc.stdout, proc.stderr


def count_commits(args: list[str]) -> int:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "log", "--oneline", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    out = proc.stdout.strip()
    if not out:
        return 0
    return len(out.splitlines())


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()

    # Refs
    local_head = run_git(["rev-parse", "HEAD"]).strip()
    current_branch = run_git(["branch", "--show-current"]).strip()
    remote_main = run_git(["rev-parse", "origin/main"]).strip()
    remote_branch = run_git(["rev-parse", "origin/codex/customer-ready-baseline"]).strip()
    merge_base = run_git(["merge-base", "origin/main", "HEAD"]).strip()

    local_ahead = count_commits([f"{remote_main}..HEAD"])
    local_behind = count_commits([f"HEAD..{remote_main}"])

    # Remote URLs
    remotes_raw = run_git(["remote", "-v"])
    remote_urls = [line.strip() for line in remotes_raw.splitlines() if line.strip()]

    remote_branch_exists = bool(remote_branch)

    # Fetch PR #40 data via gh
    rc, stdout, stderr = run_gh(
        [
            "pr", "view", "40",
            "--json",
            "number,title,state,isDraft,mergeable,baseRefName,headRefName,headRefOid,changedFiles,additions,deletions,commits,statusCheckRollup",
        ]
    )
    pr_data: dict = {}
    if rc == 0 and stdout:
        pr_data = json.loads(stdout)

    # Remote show origin
    rc2, origin_show, _ = run_gh(["repo", "view", "lhcaps/Form-Management", "--json", "name,owner,defaultBranchRef"])
    repo_data: dict = {}
    if rc2 == 0 and origin_show:
        repo_data = json.loads(origin_show)

    checks_summary = []
    for check in pr_data.get("statusCheckRollup", []):
        checks_summary.append(
            {
                "name": check.get("name"),
                "conclusion": check.get("conclusion"),
                "status": check.get("status"),
                "detailsUrl": check.get("detailsUrl"),
                "startedAt": check.get("startedAt"),
                "completedAt": check.get("completedAt"),
            }
        )

    failed_checks = [
        c["name"] for c in checks_summary if c.get("conclusion") == "FAILURE"
    ]
    pending_checks = [
        c["name"] for c in checks_summary if c.get("status") not in ("COMPLETED", "SUCCESS")
    ]

    fail_closed = {
        "branch_matches": current_branch == "codex/customer-ready-baseline",
        "pr_targets_main": pr_data.get("baseRefName") == "main",
        "pr_head_is_local": pr_data.get("headRefOid") == local_head,
        "mergeable": pr_data.get("mergeable") == "MERGEABLE",
        "no_failed_checks": len(failed_checks) == 0,
        "no_pending_checks": len(pending_checks) == 0,
        "remote_main_matches_recorded": remote_main == "12749f1fefaca7e63e1f0df7cf5c0d5b19f126f4",
    }

    output = {
        "schema": "qllaw.remote_reconciliation/v1",
        "generatedAt": generated_at,
        "localHead": local_head,
        "currentBranch": current_branch,
        "remoteMain": remote_main,
        "remoteBranch": remote_branch,
        "mergeBase": merge_base,
        "localAhead": local_ahead,
        "localBehind": local_behind,
        "remoteBranchExists": remote_branch_exists,
        "remoteUrls": remote_urls,
        "repoData": repo_data,
        "pr": {
            "number": pr_data.get("number"),
            "title": pr_data.get("title"),
            "state": pr_data.get("state"),
            "isDraft": pr_data.get("isDraft"),
            "mergeable": pr_data.get("mergeable"),
            "baseRefName": pr_data.get("baseRefName"),
            "headRefName": pr_data.get("headRefName"),
            "headRefOid": pr_data.get("headRefOid"),
            "changedFiles": pr_data.get("changedFiles"),
            "additions": pr_data.get("additions"),
            "deletions": pr_data.get("deletions"),
            "commitCount": len(pr_data.get("commits", [])),
        },
        "prChecks": checks_summary,
        "failedChecks": failed_checks,
        "pendingChecks": pending_checks,
        "failClosed": fail_closed,
        "verdict": "READY_TO_PROCEED" if all(fail_closed.values()) else (
            "BLOCKED_FAILED_CI" if failed_checks else
            "BLOCKED_PENDING_CI" if pending_checks else
            "BLOCKED_PR_STATE"
        ),
    }

    (AUDIT_DIR / "remote-reconciliation.json").write_text(
        json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(json.dumps({
        "branch": current_branch,
        "head": local_head,
        "remoteMain": remote_main,
        "localAhead": local_ahead,
        "localBehind": local_behind,
        "prState": pr_data.get("state"),
        "prDraft": pr_data.get("isDraft"),
        "prMergeable": pr_data.get("mergeable"),
        "prHeadSha": pr_data.get("headRefOid"),
        "failedChecks": failed_checks,
        "pendingChecks": pending_checks,
        "verdict": output["verdict"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
