# BM-066 DOCX Placeholder Renormalization Evidence

**Task:** BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Generated:** 2026-06-28T16:55:00.118Z
**Template:** BM-066 — Lệnh phong toả tài khoản

## Summary

| Placeholder | Occurrences | Classifications |
|---|---|---|
| `recipients.personLine4` | 4 | candidates=0 deferred=4 |
| `document.fullDocumentCode4` | 4 | candidates=0 deferred=4 |

## Classification Counts

- **DEFER_AMBIGUOUS_PERSON_TABLE_CELL**: 3
- **DEFER_AMBIGUOUS_ACCOUNT_FIELD**: 1
- **DEFER_AMBIGUOUS_DOCUMENT_CODE**: 4

## Candidates

_None_

## Deferred

### Occ 0: `recipients.personLine4`

- **Classification:** DEFER_AMBIGUOUS_PERSON_TABLE_CELL
- **Confidence:** LOW
- **Reason:** Occurrence 0: Blank cell in person/organization table row. No visible label. Cannot merge into one field.
- **Visible labels:** none


---
### Occ 1: `recipients.personLine4`

- **Classification:** DEFER_AMBIGUOUS_PERSON_TABLE_CELL
- **Confidence:** LOW
- **Reason:** Occurrence 1: Blank cell in person/organization table row. No visible label. Cannot merge into one field.
- **Visible labels:** none


---
### Occ 2: `recipients.personLine4`

- **Classification:** DEFER_AMBIGUOUS_ACCOUNT_FIELD
- **Confidence:** LOW
- **Reason:** Occurrence 2: Appears in bank/account freeze context. Should NOT be recipients.personLine4.
- **Visible labels:** Lưu:


---
### Occ 3: `recipients.personLine4`

- **Classification:** DEFER_AMBIGUOUS_PERSON_TABLE_CELL
- **Confidence:** LOW
- **Reason:** Occurrence 3: Nơi nhận / Lưu: distribution footer with "(Ký, ghi rõ họ tên, đóng dấu)" — administrative boilerplate. NOT a formal signer slot. Field is labeled "Người nhận". Semantic requires human DOCX/legal review: is the recipient also the signer, or a separate organization/custodian?
- **Visible labels:** Lưu:


---
### Occ 0: `document.fullDocumentCode4`

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 0: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.
- **Visible labels:** none


---
### Occ 1: `document.fullDocumentCode4`

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 1: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.
- **Visible labels:** none


---
### Occ 2: `document.fullDocumentCode4`

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 2: Appears in body procedural context (căn cứ, lệnh, yêu cầu). NOT the formal document code. Semantic requires human DOCX/legal review against TT-03-2026-VKSTC.
- **Visible labels:** none


---
### Occ 3: `document.fullDocumentCode4`

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 3: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.
- **Visible labels:** Lưu:
