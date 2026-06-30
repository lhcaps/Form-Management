# BM-066 Live State

**Task:** BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Generated:** 2026-06-28T11:30:07.023Z

## Template

| Field | Value |
|-------|-------|
| Code | BM-066 |
| Title | Lệnh phong toả tài khoản |
| SourceId | BM-066__e3bc56081554 |
| Board lane | CONTRACT_REPAIR |
| Board status | NEEDS_REMEDIATION |

## Render Gate

| Check | Status |
|-------|--------|
| Overall | FAIL |
| Binding fidelity | FAIL |
| Literal fidelity | FAIL |
| Text fidelity | PASS |
| Structure fidelity | PASS |

**Undefined literals:** 4 (`recipients.personLine4` — 0 slots, 0 bindings)
**Without slots:** `recipients.personLine4`
**Without bindings:** `recipients.personLine4`

## Duplicate Semantic Risks

| Placeholder | Count | Severity |
|-------------|-------|----------|
| `recipients.personLine4` | 4 | HIGH |
| `document.fullDocumentCode4` | 4 | HIGH |

Both trigger `highVolumeGeneric` rule (count >= 3).

## DB Sync

| Metric | Count |
|--------|-------|
| Matched | 213 |
| Missing | 0 |
| Stale | 0 |
| Status | CLEAN |

## Blocked BMs (preserved)

| BM | Lane | Status | Done | Preserved |
|----|------|--------|------|-----------|
| BM-052 | LEGAL_REVIEW | BLOCKED_BY_HUMAN_DOCX_REVIEW | NO | YES |
| BM-062 | LEGAL_REVIEW | BLOCKED_BY_HUMAN_DOCX_REVIEW | NO | YES |
| BM-063 | LEGAL_REVIEW | BLOCKED_BY_HUMAN_DOCX_REVIEW | NO | YES |

**Legal review lane count:** 3

## Worktree

Mixed — BM-066 evidence is isolated, no cross-BM mutations.
