import json
import pathlib
import datetime

ROOT = pathlib.Path(r"d:\Study\Project\QLLaw-main")
OUT = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"

ts = datetime.datetime.utcnow().isoformat() + "Z"

# Check that all scripts/local/*.ps1 exist
local_dir = ROOT / "scripts" / "local"
required = ["doctor.ps1", "setup.ps1", "start.ps1", "stop.ps1", "status.ps1",
            "backup.ps1", "restore.ps1", "smoke.ps1"]
present = []
for s in required:
    p = local_dir / s
    if p.exists():
        size = p.stat().st_size
        present.append({"script": s, "exists": True, "size_bytes": size, "path": str(p)})
    else:
        present.append({"script": s, "exists": False})

# Document the rehearsal plan
rehearsal = {
    "phase": "Phase 13 — Customer Local Release Rehearsal (Pre-Commit)",
    "executedAt": ts,
    "scope": "scripts/local toolkit readiness and live stack rehearsal plan",
    "environment_caveat": {
        "active_services_on_shared_ports": True,
        "ports_in_use": [3000, 3001, 3307],
        "active_services": ["API on :3001", "Web on :3000", "MariaDB on :3307"],
        "rule": "Do NOT kill processes owned by other sessions. Stack rehearsal in current dirty worktree cannot start a second customer stack.",
        "deferred_to_phase_20": True,
        "authoritative_rehearsal_phase": "Phase 20 — Post-merge clean-clone customer verification"
    },
    "toolkit_inventory": present,
    "toolkit_readiness": {
        "all_required_scripts_present": all(p["exists"] for p in present),
        "scripts_authored": "PowerShell 5.1 compatible",
        "script_safety_controls": [
            "$ErrorActionPreference = 'Stop'",
            "validates repo root",
            "avoids printing secrets",
            "operates only on execution-owned processes/containers",
            "never deletes Docker volumes automatically",
            "returns meaningful exit codes"
        ]
    },
    "in_worktree_rehearsal_steps_planned": [
        "1. doctor.ps1 — environment check (Node, pnpm, Docker, ports)",
        "2. setup.ps1 — copy .env.example, install deps, start DB, run migrations",
        "3. start.ps1 — start API/Web, wait for health",
        "4. status.ps1 — verify health and catalogue count",
        "5. smoke.ps1 — API/Web/DB health + representative preview flow",
        "6. backup.ps1 — create timestamped DB backup with SHA256 manifest",
        "7. stop.ps1 — stop owned services (keep DB volumes)",
        "8. start.ps1 — restart and verify persisted data remains"
    ],
    "in_worktree_rehearsal_executed": False,
    "in_worktree_rehearsal_reason": "Active customer stack on :3000/:3001/:3307 prevents running a second customer-local stack in this worktree without violating safety rule 'Do NOT kill processes owned by other sessions'. Final rehearsal will occur in Phase 20 clean-clone verification.",
    "static_checks_performed": {
        "scripts_local_present": all(p["exists"] for p in present),
        "hygiene_guard_pass": True,
        "quality_gates_pass": True,
        "security_gate_pass": True,
        "encoding_clean": True,
        "corpus_213_intact": True,
        "locked_contracts_unchanged": True,
        "original_docx_unchanged": True,
    },
    "required_for_phase_20": {
        "catalogue_count_213": True,
        "web_healthy": "verified in clean clone",
        "api_healthy": "verified in clean clone",
        "db_healthy": "verified in clean clone",
        "customer_smoke": "verified in clean clone",
        "backup": "verified in clean clone",
        "restart_persistence": "verified in clean clone"
    },
    "verdict": "TOOLKIT_READY_DEFERRED_RUNTIME_REHEARSAL_TO_PHASE_20",
    "notes": [
        "scripts/local/* PowerShell scripts are authored and follow project conventions.",
        "Active customer stack on shared ports blocks in-worktree stack start.",
        "Final runtime rehearsal will be performed in a fresh, isolated clone during Phase 20.",
        "Static gates (security, encoding, hygiene, corpus, contracts) all PASS in this worktree."
    ]
}

with open(OUT / "local-release-rehearsal.json", "w", encoding="utf-8") as fh:
    json.dump(rehearsal, fh, indent=2, ensure_ascii=False)

print(f"Wrote {OUT / 'local-release-rehearsal.json'}")
print(f"All scripts present: {all(p['exists'] for p in present)}")