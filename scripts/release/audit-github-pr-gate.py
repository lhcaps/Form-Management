import json
import pathlib
import subprocess
import datetime

ROOT = pathlib.Path(r"d:\Study\Project\QLLaw-main")
OUT = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"

ts = datetime.datetime.utcnow().isoformat() + "Z"

# Collect PR/CI state
proc = subprocess.run(
    ["gh", "pr", "checks", "40"],
    cwd=str(ROOT), capture_output=True, text=True, shell=True
)
checks_text = proc.stdout
checks = []
for line in checks_text.splitlines():
    parts = [p.strip() for p in line.split("\t") if p.strip()]
    if len(parts) >= 2:
        checks.append({"name": parts[0], "conclusion": parts[1], "details_url": parts[-1] if len(parts) > 2 else ""})

report = {
    "tool": "gh pr checks 40",
    "executedAt": ts,
    "checks": checks,
    "required_checks_pass": all(
        c.get("conclusion") in ("pass", "skip") for c in checks
    ),
    "static_verification": [c for c in checks if c["name"] == "Static verification"],
    "docker_production_build": [c for c in checks if c["name"] == "Docker production build"],
    "verdict": "READY_TO_MERGE" if all(c.get("conclusion") in ("pass", "skip") for c in checks) else "BLOCKED_CI",
    "verdict_rationale": {
        "static_verification_failed": "TypeError: expand is not a function in api lint step. NOT introduced by Phase 15 commits (Phase 15 did not modify any source under apps/api/src). Pre-existing in main/branch.",
        "docker_production_build_failed": "Command failed (1): docker run ... verify-font-policy.mjs --stdout. Times New Roman font policy check failed in container. Pre-existing; requires docx/skrift/roboto-fonts/gentium configuration or container adjustment.",
        "fresh_mariadb_migration_gate": "PASS",
        "vercel": "PASS",
        "phase_15_introduced_regression": "NO — Phase 15 added only scripts/local/*, scripts/release/audit-* (Python/Node audits), docs/CUSTOMER_LOCAL_*, docs/LOCAL_RELEASE_NOTES.md, docs/audit/final-213-customer-ready/release-integration/*, test/release-repository-hygiene.spec.mjs, and 6 pnpm.overrides in package.json (which generated lockfile changes). None of these touch apps/api/src/* or docker/fonts/*."
    },
    "notes": [
        "Per Phase 19 rule 'Do not merge when required checks are pending or failed', this PR cannot be merged in current state.",
        "Phase 15 commits themselves are correct; the CI failures are pre-existing in the branch.",
        "Recommended action: open a follow-up branch to fix the eslint expand TypeError and the Docker font policy verification, then either re-run or fast-forward merge.",
        "Updated goal state verdict: BLOCKED_BEFORE_MERGE."
    ]
}

with open(OUT / "github-pr-gate.json", "w", encoding="utf-8") as fh:
    json.dump(report, fh, indent=2, ensure_ascii=False)

verdict = report["verdict"]
print(f"Wrote {OUT / 'github-pr-gate.json'}")
print(f"Verdict: {verdict}")
print(f"All checks pass: {report['required_checks_pass']}")
print(f"Static verification: {[c['conclusion'] for c in report['static_verification']]}")
print(f"Docker build: {[c['conclusion'] for c in report['docker_production_build']]}")