# BM-052 Review-Bugbot Report: Remaining recipients.personLine6 Evidence

**Generated:** 2026-06-28T07:55:00Z
**Task:** BM052_REMAINING_RECIPIENTS_PERSONLINE6_RENDER_BLOCKER_EVIDENCE

---

## Bugbot Findings

### Finding 1: MEDIUM — Ambiguous person cells reclassified without new evidence

**Location:** `scripts/audit/plan-bm052-remaining-personline6-render-blocker.mjs` (original version)

**Issue:** The original evidence classified all 3 occurrences as `REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER` (MEDIUM) but the original BM-052 plan script classified them as `DEFER_AMBIGUOUS_PERSON_NAME` (LOW). The reclassification had no new evidence — it used the same neighborhood text and anchors.

**Status: FIXED** — Evidence has been updated to use `DEFER_AMBIGUOUS_PERSON_TABLE_CELL` for all 3 occurrences.

### Finding 2: HIGH — Proposed placeholder ID reuses ambiguous name without semantic distinction

**Location:** `scripts/audit/plan-bm052-remaining-personline6-render-blocker.mjs` (original version)

**Issue:** All 3 occurrences were assigned `proposedNewPlaceholderId: 'recipients.personLine6'` — binding all 3 distinct blank cells to the same single field means the rendered document would show the same value in all 3 slots. This is semantically incorrect.

**Status: FIXED** — Evidence has been updated to use `DEFER_AMBIGUOUS_PERSON_TABLE_CELL` with `proposedNewPlaceholderId: null`. No binding is proposed, so render-fidelity will continue to FAIL until planner decides.

---

## Bugbot Safety Questions

| Question | Answer |
|---|---|
| Did the classifier over-approve ambiguous table cells? | Originally YES (FIXED). Now all 3 use DEFER. |
| Did it invent suffix paths like _extra6, _personLine6_1? | NO. Proposed values were 'recipients.personLine6' only. |
| Did it rely on cross-BM evidence for approval? | NO. All evidence is from BM-052 DOCX only. |
| Did it keep render-fidelity as the blocking gate? | YES. Render gate remains FAIL. |
| Did it accidentally create apply/approved artifacts? | NO. No decisions.approved.json or apply runners. |
| Is keeping recipients.personLine6 safe? | NOT for DEFER. For REVIEW it would be semantically wrong to bind all 3 to same value. |
| Is the MINIMAL_FIX reasoning sound? | NO for semantic correctness. YES for render-pass-only. DEFER is the right call. |

---

## Safety Assertions

| Assertion | Value |
|---|---|
| noDocxMutation | true |
| noLockedContractMutation | true |
| noCompiledV2Mutation | true |
| noDbPublish | true |
| noApprovedDecisions | true |
| sameBmEvidenceOnly | true |
| renderGateUsed | true |
| codeGraphUsedForCodeOnly | true |

---

## Decision

**Bugbot findings are resolved.** The evidence now correctly classifies all 3 remaining `recipients.personLine6` occurrences as `DEFER_AMBIGUOUS_PERSON_TABLE_CELL`. BM-052 render gate remains FAIL. The planner must decide how to resolve the remaining render blocker: (A) split to distinct semantic placeholders (requires DOCX mutation + contract changes), or (B) bind as `recipients.personLine6` (render-correct but semantically questionable for 3 distinct blank cells).
