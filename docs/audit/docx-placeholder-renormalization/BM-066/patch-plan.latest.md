# BM-066 Patch Plan

**Task:** BM066_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Generated:** 2026-06-28T16:55:00.118Z

## Candidates (proposed for review, NOT approved)

_None_

## Deferred (NOT to be touched)

### `recipients.personLine4` occ 0

- **Classification:** DEFER_AMBIGUOUS_PERSON_TABLE_CELL
- **Confidence:** LOW
- **Reason:** Occurrence 0: Blank cell in person/organization table row. No visible label. Cannot merge into one field.

---
### `recipients.personLine4` occ 1

- **Classification:** DEFER_AMBIGUOUS_PERSON_TABLE_CELL
- **Confidence:** LOW
- **Reason:** Occurrence 1: Blank cell in person/organization table row. No visible label. Cannot merge into one field.

---
### `recipients.personLine4` occ 2

- **Classification:** DEFER_AMBIGUOUS_ACCOUNT_FIELD
- **Confidence:** LOW
- **Reason:** Occurrence 2: Appears in bank/account freeze context. Should NOT be recipients.personLine4.

---
### `recipients.personLine4` occ 3

- **Classification:** DEFER_AMBIGUOUS_PERSON_TABLE_CELL
- **Confidence:** LOW
- **Reason:** Occurrence 3: Nơi nhận / Lưu: distribution footer with "(Ký, ghi rõ họ tên, đóng dấu)" — administrative boilerplate. NOT a formal signer slot. Field is labeled "Người nhận". Semantic requires human DOCX/legal review: is the recipient also the signer, or a separate organization/custodian?

---
### `document.fullDocumentCode4` occ 0

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 0: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.

---
### `document.fullDocumentCode4` occ 1

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 1: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.

---
### `document.fullDocumentCode4` occ 2

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 2: Appears in body procedural context (căn cứ, lệnh, yêu cầu). NOT the formal document code. Semantic requires human DOCX/legal review against TT-03-2026-VKSTC.

---
### `document.fullDocumentCode4` occ 3

- **Classification:** DEFER_AMBIGUOUS_DOCUMENT_CODE
- **Confidence:** LOW
- **Reason:** Occurrence 3: Appears in bank/account/organization context (Lệnh phong tỏa tài khoản). NOT the formal document code. Should NOT bind to document.fullDocumentCode. Semantic requires human DOCX/legal review — likely a legal basis/account reference line.
