# Planner Handoff — BM096_DEFERRED_GROUP_REVIEW_PLAN

**Version:** 1.0.0
**Status:** READY_FOR_PLANNER_REVIEW
**Can apply run now:** NO (evidence-only)

---

## Baseline

| Metric | Value |
|--------|-------|
| totalIssues | 1476 |
| FAIL | 1154 |
| REVIEW | 322 |
| REMEDIATION_LEAK | 10 |
| COMPILED_DRIFT | 37 |
| DB sync | matched=213, stale=0 |

---

## Classification Summary (18 fields)

| Classification | Count |
|---------------|-------|
| CLEAN_NO_ISSUES | 2 |
| REVIEW_CANDIDATE_LABEL_ONLY | 4 |
| DEFER_REQUIRED_POLICY_REVIEW | 1 |
| DEFER_NO_VISIBLE_LABEL | 11 |

---

## Key Findings

**Script vs Manual classification discrepancy:**

The script uses `slot.rawPattern` for rawDomain extraction (always null in this dataset), while the manual analysis used `audit rawKey`. The script classifies more fields as `DEFER_NO_VISIBLE_LABEL`.

**Important:** The following fields have **strong path mismatch signals** that were missed by script classification:

| Field | textBefore | Path | Signal |
|-------|-----------|------|--------|
| signature.cheDo | "Nơi thường trú:" | signature.cheDo | Should be person.permanentAddress |
| signature.nguoiKy | "Nơi tạm trú:" | signature.nguoiKy | Should be person.temporaryAddress |
| document.namSinh | "Nghề nghiệp:" | document.namSinh | Should be person.occupation |

These fields are classified `DEFER_NO_VISIBLE_LABEL` by script due to null rawDomain, but may be re-classifiable after DOCX evidence extraction.

---

## Safety Assertions

- ✅ No locked contract mutations
- ✅ No compiled-v2 changes
- ✅ No DB publish
- ✅ No apply run
- ✅ DB sync unchanged (matched=213, stale=0)
- ✅ Root-cause metrics unchanged (1476 total)

---

## Planner Decision Needed

**Which candidate to promote next?**

Options:
1. PROMOTE_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION
2. PROMOTE_DOCUMENT_NAM_SINH_OCCUPATION
3. PROMOTE_SIGNATURE_CHE_DO_PERMANENT_ADDRESS
4. MOVE_TO_NEXT_TOP_BM
5. STOP_AND_REVIEW

**Executor Recommendation:** PROMOTE_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION

Rationale: The 3 signature fields have the most striking path mismatches. Extracting DOCX evidence first will allow re-classification with audit rawKey-based rawDomain.
