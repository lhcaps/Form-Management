# BM-066 Planner Handoff

**Task:** BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Status:** EVIDENCE_COMPLETE
**Generated:** 2026-06-28T16:55:00.119Z

## Summary

| Placeholder | Occurrences | Candidates | Deferred |
|---|---|---|---|
| `recipients.personLine4` | 4 | 0 | 4 |
| `document.fullDocumentCode4` | 4 | 0 | 4 |

## Classification

- **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**: 3
- **DEFER_AMBIGUOUS_ACCOUNT_FIELD**: 1
- **DEFER_AMBIGUOUS_DOCUMENT_CODE**: 4

## Render Gate (Before)

- Binding fidelity: FAIL
- `recipients.personLine4`: 0 slots, 0 bindings → all 4 render as "undefined"
- `document.fullDocumentCode4`: 4 DOCX occurrences, 1 slot

## Candidates

_None_

## Deferred

### `recipients.personLine4` occ 0: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 0: Blank cell in person/organization table row. No visible label. Cannot merge into one field.

---
### `recipients.personLine4` occ 1: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 1: Blank cell in person/organization table row. No visible label. Cannot merge into one field.

---
### `recipients.personLine4` occ 2: **DEFER_AMBIGUOUS_ACCOUNT_FIELD**

Occurrence 2: Appears in bank/account freeze context. Should NOT be recipients.personLine4.

---
### `recipients.personLine4` occ 3: **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**

Occurrence 3: Nơi nhận / Lưu: distribution footer with "(Ký, ghi rõ họ tên, đóng dấu)" — administrative boilerplate. NOT a formal signer slot. Field is labeled "Người nhận". Semantic requires human DOCX/legal review: is the recipient also the signer, or a separate organization/custodian?

---
### `document.fullDocumentCode4` occ 0: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 0: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.

---
### `document.fullDocumentCode4` occ 1: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 1: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.

---
### `document.fullDocumentCode4` occ 2: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 2: Appears in body procedural context (căn cứ, lệnh, yêu cầu). NOT the formal document code. Semantic requires human DOCX/legal review against TT-03-2026-VKSTC.

---
### `document.fullDocumentCode4` occ 3: **DEFER_AMBIGUOUS_DOCUMENT_CODE**

Occurrence 3: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.

## Safety

- [x] No DOCX mutation
- [x] No locked contract mutation
- [x] No compiled-v2 mutation
- [x] No DB publish
- [x] No approved decisions
- [x] BM-052/BM-062/BM-063 blockers preserved
- [x] canApplyRunNow = false

## Next: Planner Decision

Review candidates. Approve or defer each one.
If candidates exist with HIGH/MEDIUM confidence and strong same-BM evidence, propose a small guarded apply.
If all deferred, close as BLOCKED_BY_HUMAN_DOCX_REVIEW.
