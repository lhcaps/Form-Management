# Review Batch 1 — Approved Apply Report

Generated: 2026-06-25T20:43:43.115Z
Mode: **WRITE**

## Summary

| Metric | Value |
|--------|-------|
| Decisions reviewed | 24 |
| Approved for apply | 2 |
| Mutations planned | 0 |
| Mutations applied | 0 |
| Mutations skipped/idempotent | 4 |
| Changed contracts | 0 |

## Idempotent (Already Applied)

- RG-001: BM-002::document.documentCode — already "Số văn bản"
- RG-002: BM-003::document.documentCode — already "Số văn bản"

## Non-Touched Groups

### Deferred Legal (RG-003)
- **RG-003**: BM-003::legalBasis.procedureArticlesLine — DEFER_LEGAL

### Rejected Path Collisions (RG-004 to RG-009)
- **RG-004**: BM-021::document.issuePlaceAndDateLine — REJECTED_NO_OP
- **RG-005**: BM-026::agency.nameUpper — REJECTED_NO_OP
- **RG-006**: BM-036::document.issuePlaceAndDateLine — REJECTED_NO_OP
- **RG-007**: BM-036::person.fullName — REJECTED_NO_OP
- **RG-008**: BM-036::decision.summaryLine — REJECTED_NO_OP
- **RG-009**: BM-041::agency.issuePlace — REJECTED_NO_OP

### Deferred DOCX/Wave 02 (RG-010 to RG-024, 15 groups)

BM-068 groups:
- **RG-010**: BM-068::document.fullDocumentCode — DEFER_DOCX
- **RG-011**: BM-068::document.issueDate — DEFER_DOCX
