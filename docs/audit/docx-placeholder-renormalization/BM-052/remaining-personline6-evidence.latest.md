# BM-052 Remaining recipients.personLine6 Render Blocker Evidence

**Mode:** EVIDENCE_ONLY | **canApplyRunNow:** NO | **Status:** FAIL

## Render Gate Status

| Gate | Status |
|---|---|
| Binding fidelity | FAIL |
| Render | PASS |
| Text fidelity | PASS |
| Literal fidelity | FAIL |
| Structure fidelity | PASS |

**Undefined/null literals:** 3 occurrences of __RECIPIENTS_PERSONLINE6__
**Root cause:** recipients.personLine6 has no slot, no binding, no canonical field in contract

## Occurrence Evidence

| # | TextNode | Classification | Confidence | Proposed |
|---|---|---|---|---|
| 0 | 42 | DEFER AMBIGUOUS PERSON TABLE CELL | LOW | null |
| 1 | 43 | DEFER AMBIGUOUS PERSON TABLE CELL | LOW | null |
| 2 | 44 | DEFER AMBIGUOUS PERSON TABLE CELL | LOW | null |

## Classification Counts
- **DEFER_AMBIGUOUS_PERSON_TABLE_CELL:** 3

## Planner Decision Needed
For the 3 remaining recipients.personLine6 occurrences in BM-052 body paragraphs, decide: (A) bind as-is with one slot+binding for recipients.personLine6 (no DOCX mutation, minimal fix, render-fidelity passes), or (B) split to distinct semantic placeholders (requires DOCX mutation + contract changes, semantics unknown).
