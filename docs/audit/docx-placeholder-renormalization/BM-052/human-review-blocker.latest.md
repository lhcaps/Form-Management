# BM-052 Human Review Blocker Ledger

**Generated:** 2026-06-28T08:07:00.000Z
**Task:** BM052_CLOSE_REMAINING_PERSONLINE6_AS_HUMAN_REVIEW_BLOCKER
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW | canApplyRunNow: **NO** | canMarkDone: **NO**

---

## Render Gate Status

| Gate | Status |
|---|---|
| Binding fidelity | FAIL |
| Literal fidelity | FAIL |
| Render | PASS |
| Text fidelity | PASS |
| Structure fidelity | PASS |

**Root cause:** `recipients.personLine6` has no slot, no binding, no canonical field.
**Undefined/null literals:** 3 (each renders as `__RECIPIENTS_PERSONLINE6__`)

---

## Blocker Summary

BM-052 has **3 remaining body occurrences** of `{{recipients.personLine6}}` that are ambiguous blank cells. Planner decision is **DEFER_TO_HUMAN_DOCX_LEGAL_REVIEW**.

**Rejected:** Option A (bind as-is) — would render same value in 3 distinct cells, semantically wrong.

---

## Blocked Placeholders

| Occ | Para | Classification | Confidence | Reason |
|---|---|---|---|---|
| 0 | P29 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL | LOW | Blank cell between "Họ tên" and "Nghề nghiệp" |
| 1 | P30 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL | LOW | Blank cell between "Họ tên" and "Nghề nghiệp" |
| 2 | P31 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL | LOW | Blank cell between "Họ tên" and "Nghề nghiệp" |

---

## Planner Decision

**Decision:** DEFER_TO_HUMAN_DOCX_LEGAL_REVIEW
**Rationale:** Binding all 3 cells to the same placeholder would mechanically pass render-fidelity but produce semantically incorrect output. Bugbot confirmed HIGH severity.

**Rejected:** BIND_AS_IS_RECIPIENTS_PERSONLINE6

---

## Human Review Questions

1. What does each blank cell P29/P30/P31 represent under the official BM-052 DOCX / TT-03-2026-VKSTC spec?
2. Are these alias, date of birth, ethnicity, nationality, or other person details?
3. Should each cell become a distinct placeholder?
4. Should any cell be removed as authoring noise?
5. Is the "Nơi thường trú:" blank cell related to these?

---

## Safety Assertions

| Assertion | Value |
|---|---|
| noDocxMutation | true |
| noLockedContractMutation | true |
| noCompiledV2Mutation | true |
| noDbPublish | true |
| noApprovedDecisions | true |
| noApplyRunner | true |
| renderGateStillFailing | true |
| notMarkedDone | true |
