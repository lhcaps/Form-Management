# Review Batch 1 — Approved Decisions

Generated: 2026-06-25T20:39:35.775Z
Reviewer: Project Owner (Human Reviewer)

## Summary

| Metric | Value |
|--------|-------|
| Total groups reviewed | 24 |
| Approved for apply | 2 |
| Rejected (NO_OP) | 6 |
| Deferred legal | 1 |
| Deferred DOCX | 15 |

## Decisions

| reviewGroupId | BM | path | decision | action | approved label | rationale |
|---|---|---|---|---|---|---|
| RG-001 | BM-002 | `document.documentCode` | APPROVED_FOR_APPLY | UPDATE_LABEL | Số văn bản | Known label map: document.documentCode is a stable document number/code field. V |
| RG-002 | BM-003 | `document.documentCode` | APPROVED_FOR_APPLY | UPDATE_LABEL | Số văn bản | Known label map: document.documentCode is a stable document number/code field. V |
| RG-003 | BM-003 | `legalBasis.procedureArticlesLine` | DEFER_LEGAL | MANUAL_REVIEW | - | legalBasis.* is excluded from safe apply. Even if "Căn cứ pháp lý" looks reasona |
| RG-004 | BM-021 | `document.issuePlaceAndDateLine` | REJECTED_NO_OP | NO_OP | - | Path collision: proposed target path already exists. Auto-suggestion is ambiguou |
| RG-005 | BM-026 | `agency.nameUpper` | REJECTED_NO_OP | NO_OP | - | Path collision: proposed target path already exists. Auto-suggestion is ambiguou |
| RG-006 | BM-036 | `document.issuePlaceAndDateLine` | REJECTED_NO_OP | NO_OP | - | Path collision: proposed target path already exists. Auto-suggestion is ambiguou |
| RG-007 | BM-036 | `person.fullName` | REJECTED_NO_OP | NO_OP | - | Path collision: proposed target path already exists. Auto-suggestion is ambiguou |
| RG-008 | BM-036 | `decision.summaryLine` | REJECTED_NO_OP | NO_OP | - | Path collision: proposed target path already exists. Auto-suggestion is ambiguou |
| RG-009 | BM-041 | `agency.issuePlace` | REJECTED_NO_OP | NO_OP | - | Path collision: proposed target path already exists. Auto-suggestion is ambiguou |
| RG-010 | BM-068 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-011 | BM-068 | `document.issueDate` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-012 | BM-069 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-013 | BM-069 | `document.issueDate` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-014 | BM-073 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-015 | BM-073 | `document.issueDate` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-016 | BM-075 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-017 | BM-077 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-018 | BM-080 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-019 | BM-080 | `document.issueDate` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-020 | BM-082 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-021 | BM-162 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-022 | BM-162 | `document.issueDate` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-023 | BM-163 | `document.fullDocumentCode` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |
| RG-024 | BM-163 | `document.issueDate` | DEFER_DOCX | MANUAL_REVIEW | - | Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/re |

## Approved for Apply

### RG-001: BM-002::document.documentCode

- **Decision**: APPROVED_FOR_APPLY
- **Action**: UPDATE_LABEL
- **Approved label**: `Số văn bản`
- **Current label**: `documentCode`
- **Confidence**: HIGH
- **Reviewer override**: HIGH
- **Apply eligible**: true
- **Rationale**: Known label map: document.documentCode is a stable document number/code field. Vietnamese UI label "Số văn bản" is deterministic, non-legal, and label-only. No path/source/required/editable/visible semantics changed.

### RG-002: BM-003::document.documentCode

- **Decision**: APPROVED_FOR_APPLY
- **Action**: UPDATE_LABEL
- **Approved label**: `Số văn bản`
- **Current label**: `documentCode`
- **Confidence**: HIGH
- **Reviewer override**: HIGH
- **Apply eligible**: true
- **Rationale**: Known label map: document.documentCode is a stable document number/code field. Vietnamese UI label "Số văn bản" is deterministic, non-legal, and label-only. No path/source/required/editable/visible semantics changed.

## Deferred / Rejected Groups

- **RG-003** (BM-003::legalBasis.procedureArticlesLine): DEFER_LEGAL — legalBasis.* is excluded from safe apply. Even if "Căn cứ pháp lý" looks reasonable, legalBasis labe
- **RG-004** (BM-021::document.issuePlaceAndDateLine): REJECTED_NO_OP — Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.
- **RG-005** (BM-026::agency.nameUpper): REJECTED_NO_OP — Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.
- **RG-006** (BM-036::document.issuePlaceAndDateLine): REJECTED_NO_OP — Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.
- **RG-007** (BM-036::person.fullName): REJECTED_NO_OP — Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.
- **RG-008** (BM-036::decision.summaryLine): REJECTED_NO_OP — Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.
- **RG-009** (BM-041::agency.issuePlace): REJECTED_NO_OP — Path collision: proposed target path already exists. Auto-suggestion is ambiguous or wrong.
- **RG-010** (BM-068::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-011** (BM-068::document.issueDate): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-012** (BM-069::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-013** (BM-069::document.issueDate): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-014** (BM-073::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-015** (BM-073::document.issueDate): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-016** (BM-075::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-017** (BM-077::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-018** (BM-080::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-019** (BM-080::document.issueDate): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-020** (BM-082::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-021** (BM-162::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-022** (BM-162::document.issueDate): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-023** (BM-163::document.fullDocumentCode): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause
- **RG-024** (BM-163::document.issueDate): DEFER_DOCX — Current label is "Slot from Wave 02 DOCX remediation". This may indicate DOCX/remediation root cause