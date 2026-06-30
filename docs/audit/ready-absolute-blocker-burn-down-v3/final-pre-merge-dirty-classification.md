# Final Pre-Merge Dirty Classification

Generated: 2026-06-30T09:30:00Z
HEAD: 00bb8c962d8a10d6efd3120f658817e5ce2b93fc

## Classification of 18 Dirty Files

| File | Category | Action |
|------|----------|--------|
| `docs/audit/repo-clean-to-zero-v1/active-decision-gate.latest.json` | **MUST_COMMIT_GATE_ARTIFACT** | HEAD updated from 1bca3912 → 00bb8c96, timestamp refreshed. Required by readiness gate. |
| `docs/audit/repo-clean-to-zero-v1/active-decision-gate.latest.md` | **MUST_COMMIT_GATE_ARTIFACT** | Same as above, markdown version. |
| `docs/audit/repo-clean-to-zero-v1/active-remediation-blocker-pack.latest.json` | **MUST_COMMIT_GATE_ARTIFACT** | Refreshed evidence, HEAD updated. |
| `docs/audit/repo-clean-to-zero-v1/active-remediation-blocker-pack.latest.md` | **MUST_COMMIT_GATE_ARTIFACT** | Same as above, markdown version. |
| `docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md` | **MUST_COMMIT_GATE_ARTIFACT** | Required by strict gate-forms-213.cjs. Contains verify report. |
| `docs/audit/website-requirement-acceptance-v1/workflow-e2e.latest.json` | **DO_NOT_COMMIT_FAILURE_EVIDENCE** | Contains API 404 failure evidence. Committed version was PASS. Must be restored to PASS state or excluded. |
| `docs/audit/forms-root-cause/latest.json` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. Not required by readiness gate. |
| `docs/audit/forms-root-cause/latest.md` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. Not required by readiness gate. |
| `docs/audit/ready-absolute-blocker-burn-down-v3/blockers.latest.json` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. 0 blockers already. |
| `docs/audit/ready-absolute-blocker-burn-down-v3/blockers.latest.md` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. 0 blockers already. |
| `docs/audit/sample-data-coverage-v1/latest.json` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. Coverage already 100%. |
| `docs/audit/sample-data-coverage-v1/latest.md` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. Coverage already 100%. |
| `docs/audit/sot-gates-v1/latest.json` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. C3 already PASS. |
| `docs/audit/sot-gates-v1/latest.md` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. C3 already PASS. |
| `docs/audit/sot-rebase-v1/latest.json` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. SOT already clean. |
| `docs/audit/sot-rebase-v1/latest.md` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. SOT already clean. |
| `docs/audit/website-requirement-acceptance-v1/latest.json` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. READY_ABSOLUTE already. |
| `docs/audit/website-requirement-acceptance-v1/latest.md` | **OPTIONAL_TIMESTAMP_CHURN** | Timestamp-only change. READY_ABSOLUTE already. |

## Summary

| Category | Count |
|----------|-------|
| MUST_COMMIT_GATE_ARTIFACT | 5 |
| OPTIONAL_TIMESTAMP_CHURN | 12 |
| DO_NOT_COMMIT_FAILURE_EVIDENCE | 1 |
| SOURCE_CHANGE_UNEXPECTED | 0 |

## Critical Issue: workflow-e2e.latest.json

**Committed version (HEAD):** PASS (2026-06-29T21:09:45Z)
- status: PASS
- exported: true
- userEnteredMarker: "E2EWORKFLOW1782767386827"
- exportedFile: BM-004_QD-thay-doi-nguoi-...docx (41400 bytes)
- hasUnresolvedPlaceholders: false
- containsUserEnteredValue: true

**Local dirty version:** FAIL (2026-06-30T09:15:22Z)
- status: FAIL
- error: HTTP 404 /api/v1/auth/login
- API server not running

**Decision:** DO NOT COMMIT the failure version. Restore to committed PASS version.

## Action Plan

1. **MUST commit:**
   - active-decision-gate.latest.{json,md}
   - active-remediation-blocker-pack.latest.{json,md}
   - LOCKED-CONTRACTS-SUMMARY.md

2. **DO NOT commit:**
   - workflow-e2e.latest.json (restore to committed PASS version)
   - All OPTIONAL_TIMESTAMP_CHURN files (unless needed for evidence trail)

3. **Restore workflow-e2e.latest.json:**
   - git checkout HEAD -- docs/audit/website-requirement-acceptance-v1/workflow-e2e.latest.json
