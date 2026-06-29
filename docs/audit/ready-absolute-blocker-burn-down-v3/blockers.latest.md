# READY_ABSOLUTE_BLOCKER_BURN_DOWN_V3 — Blockers

**Generated:** 2026-06-29T22:15:34.726Z

## Summary

| Metric | Value |
|--------|-------|
| Total blockers | 9 |
| Auto-fixable | 0 |
| Requires human review | 1 |
| BLOCKED status | 0 |

### By Category

| Category | Count |
|---------|-------|
| SAMPLE_DATA | 1 |
| DOCX_SEMANTIC_FIDELITY | 5 |
| SOT_SEMANTIC | 3 |

### By Severity

| Severity | Count |
|----------|-------|
| P0 | 4 |
| P1 | 5 |

### Blocker Alignment with Baseline

| Blocker | Baseline | Current |
|---------|----------|---------|
| SAMPLE-DATA | 1576/1735 (91%) | 1735/1735 (100%) |
| DOCX-FIDELITY | 22 repair + 2 render fail | 0 repair + 0 render fail |
| SOT-SEMANTIC | 4500 total / 3 crit / 2734 high | 2393 total / 0 crit / 995 high |

## Blocker Table

| ID | BM | Category | Severity | Status | Lane | AutoFix | HumanReview |
|----|----|----------|----------|--------|------|---------|-------------|
| BLK-001| —| SAMPLE_DATA| P0| FAIL| PARTIAL_SAMPLE| NO| NO
| BLK-002| —| DOCX_SEMANTIC_FIDELITY| P0| FAIL| CONTRACT_REPAIR_REQUIRED| NO| NO
| BLK-003| BM-211| DOCX_SEMANTIC_FIDELITY| P1| FAIL| SOURCE_MISMATCH| NO| NO
| BLK-004| BM-186| DOCX_SEMANTIC_FIDELITY| P1| FAIL| SOURCE_MISMATCH| NO| NO
| BLK-005| BM-196| DOCX_SEMANTIC_FIDELITY| P1| FAIL| SOURCE_MISMATCH| NO| NO
| BLK-006| —| SOT_SEMANTIC| P1| FAIL| GENERIC_LABEL| NO| YES
| BLK-007| —| SOT_SEMANTIC| P1| FAIL| RAW_PATTERN_DOMAIN_MISMATCH| NO| NO
| BLK-008| —| DOCX_SEMANTIC_FIDELITY| P0| FAIL| UNKNOWN| NO| NO
| BLK-009| —| SOT_SEMANTIC| P0| FAIL| UNKNOWN| NO| NO

## Detail by Category

### SAMPLE_DATA

**BLK-001** — (global)
- Severity: P0 | Status: FAIL | Lane: PARTIAL_SAMPLE
- Root cause: 1735/1735 manual fields filled. 0 forms partially covered (0 by prior count).
- Auto-fix: NO | Human review: NO
- Action: Extend domain dictionaries in sample-generator.ts / sample-data.ts to cover missing field patterns. Add explicit registry entries for forms with complex fields.
- Files: apps/web/src/features/forms-contracts/sample-data.ts, apps/web/src/features/forms-contracts/sample-generator.ts

### DOCX_SEMANTIC_FIDELITY

**BLK-002** — (global)
- Severity: P0 | Status: FAIL | Lane: CONTRACT_REPAIR_REQUIRED
- Root cause: 1427 root-cause issues. 0 contract repairs required. 0 render failures (render evidence clean: 213/213).
- Auto-fix: NO | Human review: NO
- Action: Phase 3: Fix render failures first, then contract repairs, then remaining forms by lane.

**BLK-003** — BM-211
- Severity: P1 | Status: FAIL | Lane: SOURCE_MISMATCH
- Root cause: SOURCE_POLICY lane. HIGH risk. 21 issues. Review source kind, readonly, required, and compiled drift policy before changing contract metadata.
- Auto-fix: NO | Human review: NO
- Action: Review source kind, readonly, required, and compiled drift policy before changing contract metadata.
- Files: docs/audit/docx/contracts/locked/BM-211.json, docs/audit/docx/compiled-v2/BM-211.json

**BLK-004** — BM-186
- Severity: P1 | Status: FAIL | Lane: SOURCE_MISMATCH
- Root cause: SOURCE_POLICY lane. HIGH risk. 20 issues. Review source kind, readonly, required, and compiled drift policy before changing contract metadata.
- Auto-fix: NO | Human review: NO
- Action: Review source kind, readonly, required, and compiled drift policy before changing contract metadata.
- Files: docs/audit/docx/contracts/locked/BM-186.json, docs/audit/docx/compiled-v2/BM-186.json

**BLK-005** — BM-196
- Severity: P1 | Status: FAIL | Lane: SOURCE_MISMATCH
- Root cause: SOURCE_POLICY lane. HIGH risk. 20 issues. Review source kind, readonly, required, and compiled drift policy before changing contract metadata.
- Auto-fix: NO | Human review: NO
- Action: Review source kind, readonly, required, and compiled drift policy before changing contract metadata.
- Files: docs/audit/docx/contracts/locked/BM-196.json, docs/audit/docx/compiled-v2/BM-196.json

**BLK-008** — (global)
- Severity: P0 | Status: FAIL | Lane: UNKNOWN
- Root cause: Render PASS alone is not enough; completion, quality, and render columns must all be clean.
- Auto-fix: NO | Human review: NO
- Action: Resolve underlying blockers for DOCX-SEMANTIC-FIDELITY before this gate can pass.

### SOT_SEMANTIC

**BLK-006** — (global)
- Severity: P1 | Status: FAIL | Lane: GENERIC_LABEL
- Root cause: 350 docxSlots/canonicalFields have label "Ô trống" and reviewRequired=false. Auto-approved without human review evidence.
- Auto-fix: NO | Human review: YES
- Action: Phase 4: Review each Ô trống field. Either replace with proper Vietnamese label (if DOCX context is clear) or mark as requiring human legal review.

**BLK-007** — (global)
- Severity: P1 | Status: FAIL | Lane: RAW_PATTERN_DOMAIN_MISMATCH
- Root cause: 709 fields have evidence.rawPattern that does not match their slotId/path.
- Auto-fix: NO | Human review: NO
- Action: Phase 4: Fix rawPattern to match slotId/path for each affected field. Auto-fix when mismatch is obvious.

**BLK-009** — (global)
- Severity: P0 | Status: FAIL | Lane: UNKNOWN
- Root cause: Locked/compiled/runtime sync is insufficient when semantic SOT issues remain.
- Auto-fix: NO | Human review: NO
- Action: Resolve underlying blockers for SOT-SEMANTIC-ISSUES before this gate can pass.
