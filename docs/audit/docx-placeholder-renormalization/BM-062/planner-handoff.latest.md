# BM-062 Planner Handoff

**Task:** BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Status:** EVIDENCE_COMPLETE | **canApplyRunNow:** false

## Render Gate

- Status: FAIL
- Reason: recipients.personLine5 no slot/binding (5 undefined); decision.decisionLine11 1 slot for 11 occurrences

## Classification Summary

| Classification | Count |
|---|---|
| DEFER_AMBIGUOUS_DECISION_LINE | 9 |
| DEFER_AMBIGUOUS_PERSON_TABLE_CELL | 6 |
| REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER | 1 |

## Proposed Candidates (1)

- **recipients.personLine5** (occ 4): `signature.signerName` — REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER (MEDIUM)

## Deferred Items (15)

| Placeholder | Occ | Classification |
|---|---|---|
| decision.decisionLine11 | 0 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 1 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |
| decision.decisionLine11 | 2 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |
| decision.decisionLine11 | 3 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 4 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 5 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 6 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 7 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 8 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 9 | DEFER_AMBIGUOUS_DECISION_LINE |
| decision.decisionLine11 | 10 | DEFER_AMBIGUOUS_DECISION_LINE |
| recipients.personLine5 | 0 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |
| recipients.personLine5 | 1 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |
| recipients.personLine5 | 2 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |
| recipients.personLine5 | 3 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |

## Planner Decision Needed

BM-062 has 16 risk occurrences: 9× DEFER_AMBIGUOUS_DECISION_LINE, 6× DEFER_AMBIGUOUS_PERSON_TABLE_CELL, 1× REVIEW_CANDIDATE_BIND_EXISTING_PLACEHOLDER. All candidates are REVIEW_CANDIDATE (proposed semantic) or DEFER. Decide: approve signature.signerName binding for footer recipients.personLine5, approve document.issuePlaceAndDate for occ 0 decision.decisionLine11, and/or defer remaining. Do not auto-merge 4 person-table cells into one field.
