# BM-063 Planner Handoff

**Task:** BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Status:** EVIDENCE_COMPLETE
**Generated:** undefined

## Summary

| Placeholder | Occurrences | Candidates | Deferred |
|---|---|---|---|
| `document.fullDocumentCode8` | 8 | 0 | 8 |
| `recipients.personLine5` | 5 | 0 | 5 |

## Classification

- **DEFER_AMBIGUOUS_DOCUMENT_CODE**: 8
- **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**: 5

## Render Gate (Before)

- Binding fidelity: FAIL
- `document.fullDocumentCode8`: 0 slots, 0 bindings → all 8 render as "undefined"
- `recipients.personLine5`: 1 slot, 5 DOCX occurrences → 4 render as "undefined"

## Candidates

_None_

## Deferred

### `document.fullDocumentCode8` occ 0: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 0: Appears near "Kiểm sát viên" reference — likely a superscript footnote numeral (1, 2, etc.) attached to prosecutor names. NOT the formal document code. Semantic requires human review.

---
### `document.fullDocumentCode8` occ 1: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 1: Appears near "Kiểm sát viên" reference — likely a superscript footnote numeral (1, 2, etc.) attached to prosecutor names. NOT the formal document code. Semantic requires human review.

---
### `document.fullDocumentCode8` occ 2: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 2: Appears in body text referencing underlying Lệnh/Quyết định procedural antecedent. These are separate from the formal "Số văn bản" header. Semantic requires human DOCX/legal review — should these bind to document.fullDocumentCode (same formal header) or to a different field (e.g., legalBasis.relatedDecisionLine)? Cannot determine from DOCX alone.

---
### `document.fullDocumentCode8` occ 3: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 3: Appears in body text referencing underlying Lệnh/Quyết định procedural antecedent. These are separate from the formal "Số văn bản" header. Semantic requires human DOCX/legal review — should these bind to document.fullDocumentCode (same formal header) or to a different field (e.g., legalBasis.relatedDecisionLine)? Cannot determine from DOCX alone.

---
### `document.fullDocumentCode8` occ 4: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 4: Appears in body text referencing underlying Lệnh/Quyết định procedural antecedent. These are separate from the formal "Số văn bản" header. Semantic requires human DOCX/legal review — should these bind to document.fullDocumentCode (same formal header) or to a different field (e.g., legalBasis.relatedDecisionLine)? Cannot determine from DOCX alone.

---
### `document.fullDocumentCode8` occ 5: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 5: Appears in body text referencing underlying Lệnh/Quyết định procedural antecedent. These are separate from the formal "Số văn bản" header. Semantic requires human DOCX/legal review — should these bind to document.fullDocumentCode (same formal header) or to a different field (e.g., legalBasis.relatedDecisionLine)? Cannot determine from DOCX alone.

---
### `document.fullDocumentCode8` occ 6: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 6: Appears in body text referencing underlying Lệnh/Quyết định procedural antecedent. These are separate from the formal "Số văn bản" header. Semantic requires human DOCX/legal review — should these bind to document.fullDocumentCode (same formal header) or to a different field (e.g., legalBasis.relatedDecisionLine)? Cannot determine from DOCX alone.

---
### `document.fullDocumentCode8` occ 7: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 7: Appears in body text referencing underlying Lệnh/Quyết định procedural antecedent. These are separate from the formal "Số văn bản" header. Semantic requires human DOCX/legal review — should these bind to document.fullDocumentCode (same formal header) or to a different field (e.g., legalBasis.relatedDecisionLine)? Cannot determine from DOCX alone.

---
### `recipients.personLine5` occ 0: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 0: Blank cell in person/organization table row. 5 such cells likely represent 5 distinct participants in the asset seizure. Cannot merge into one field. Semantic requires human DOCX/legal review.

---
### `recipients.personLine5` occ 1: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 1: Blank cell in person/organization table row. 5 such cells likely represent 5 distinct participants in the asset seizure. Cannot merge into one field. Semantic requires human DOCX/legal review.

---
### `recipients.personLine5` occ 2: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 2: Blank cell in person/organization table row. 5 such cells likely represent 5 distinct participants in the asset seizure. Cannot merge into one field. Semantic requires human DOCX/legal review.

---
### `recipients.personLine5` occ 3: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 3: Blank cell in person/organization table row. 5 such cells likely represent 5 distinct participants in the asset seizure. Cannot merge into one field. Semantic requires human DOCX/legal review.

---
### `recipients.personLine5` occ 4: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 4: Blank cell in person/organization table row. 5 such cells likely represent 5 distinct participants in the asset seizure. Cannot merge into one field. Semantic requires human DOCX/legal review.

## Safety

- [x] No DOCX mutation
- [x] No locked contract mutation
- [x] No compiled-v2 mutation
- [x] No DB publish
- [x] No approved decisions
- [x] BM-052/BM-062 blockers preserved
- [x] canApplyRunNow = false

## Next: Planner Decision

Review candidates. Approve or defer each one.
