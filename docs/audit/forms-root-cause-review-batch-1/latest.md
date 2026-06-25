# Forms Root Cause — Review Batch 1

Generated: 2026-06-25T20:19:14.755Z

## Summary

| Metric | Value |
|--------|-------|
| Total review groups | 24 |
| REVIEW_CHOOSE_LABEL | 18 |
| REVIEW_CHOOSE_PATH | 6 |
| REVIEW_CHOOSE_SOURCE | 0 |
| REVIEW_DEFER_LEGAL | 0 |
| REVIEW_DEFER_DOCX | 0 |
| REVIEW_REJECT_NOISE | 6 |
| Apply-safe after approval | 2 |

## Decision Sheet

| reviewGroupId | BM | field path | current label | current source | issue codes | candidate labels | recommended decision |
|---|---|---|---|---|---|---|---|
| RG-001 | BM-002 | `document.documentCode` | documentCode | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-002 | BM-003 | `document.documentCode` | documentCode | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-003 | BM-003 | `legalBasis.procedureArticlesLine` | procedureArticlesLine | officialConfig | BAD_LABEL, UI_VISIBLE_BAD_METADATA | Căn cứ pháp lý | APPROVE (MEDIUM) |
| RG-004 | BM-021 | `document.issuePlaceAndDateLine` | Căn cứ Bộ luật Tố tụng hình sự | systemDate | RAW_PATTERN_DOMAIN_MISMATCH | Căn cứ pháp lý | REJECT (LOW) |
| RG-005 | BM-026 | `agency.nameUpper` | Ngày ban hành | agencyConfig | RAW_PATTERN_DOMAIN_MISMATCH | Ngày ban hành | REJECT (LOW) |
| RG-006 | BM-036 | `document.issuePlaceAndDateLine` | Họ tên người bị áp dụng | systemDate | RAW_PATTERN_DOMAIN_MISMATCH | Họ tên | REJECT (LOW) |
| RG-007 | BM-036 | `person.fullName` | Ngày ban hành | manual | RAW_PATTERN_DOMAIN_MISMATCH | Ngày ban hành | REJECT (LOW) |
| RG-008 | BM-036 | `decision.summaryLine` | Cơ quan cấp trên | computed | RAW_PATTERN_DOMAIN_MISMATCH | Cơ quan cấp trên viết hoa | REJECT (LOW) |
| RG-009 | BM-041 | `agency.issuePlace` | Số quyết định | computed | RAW_PATTERN_DOMAIN_MISMATCH | Số văn bản | REJECT (LOW) |
| RG-010 | BM-068 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (HIGH) |
| RG-011 | BM-068 | `document.issueDate` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Ngày ban hành | APPROVE (HIGH) |
| RG-012 | BM-069 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (HIGH) |
| RG-013 | BM-069 | `document.issueDate` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Ngày ban hành | APPROVE (HIGH) |
| RG-014 | BM-073 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-015 | BM-073 | `document.issueDate` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Ngày ban hành | APPROVE (MEDIUM) |
| RG-016 | BM-075 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-017 | BM-077 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-018 | BM-080 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-019 | BM-080 | `document.issueDate` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Ngày ban hành | APPROVE (MEDIUM) |
| RG-020 | BM-082 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-021 | BM-162 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-022 | BM-162 | `document.issueDate` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Ngày ban hành | APPROVE (MEDIUM) |
| RG-023 | BM-163 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Số văn bản | APPROVE (MEDIUM) |
| RG-024 | BM-163 | `document.issueDate` | Slot from Wave 02 DOCX remediation | manual | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | Ngày ban hành | APPROVE (MEDIUM) |

## BM-068 Special Review

### RG-010: BM-068::document.fullDocumentCode

- **Current label**: `Slot from Wave 02 DOCX remediation`
- **Current source**: `manual`
- **Raw pattern**: `-`
- **Issue codes**: BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA
- **Skip reason**: Multiple different mutations planned for BM-068::document.fullDocumentCode
- **Recommended decision**: **APPROVE** (HIGH)
- **Rationale**: Wave 02 remediation label confirmed bad. Path "document.fullDocumentCode" is semantically correct. Label "Số văn bản" matches known label map. Multiple issue sources (BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA) all agree. Safe to approve.
- **Apply-safe**: false

Candidate options:
  - UPDATE_LABEL: label="Số văn bản" path="-" source="-" [MEDIUM] — BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod

### RG-011: BM-068::document.issueDate

- **Current label**: `Slot from Wave 02 DOCX remediation`
- **Current source**: `manual`
- **Raw pattern**: `-`
- **Issue codes**: BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA
- **Skip reason**: Multiple different mutations planned for BM-068::document.issueDate
- **Recommended decision**: **APPROVE** (HIGH)
- **Rationale**: Wave 02 remediation label confirmed bad. Path "document.issueDate" is semantically correct. Label "Ngày ban hành" matches known label map. Multiple issue sources (BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA) all agree. Safe to approve.
- **Apply-safe**: false

Candidate options:
  - UPDATE_LABEL: label="Ngày ban hành" path="-" source="-" [MEDIUM] — BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.issueDate" has 

## Path Collision Summary

- **BM-021::document.issuePlaceAndDateLine** → default: **REJECT** (LOW)
  Rationale: Path collision detected: proposed path "legalBasis.procedureArticlesLine" already exists. Auto-suggestion is ambiguous or wrong. Requires manual path design decision.
  Proposed options: legalBasis.procedureArticlesLine

- **BM-026::agency.nameUpper** → default: **REJECT** (LOW)
  Rationale: Path collision detected: proposed path "document.issueDate" already exists. Auto-suggestion is ambiguous or wrong. Requires manual path design decision.
  Proposed options: document.issueDate

- **BM-036::document.issuePlaceAndDateLine** → default: **REJECT** (LOW)
  Rationale: Path collision detected: proposed path "person.fullName" already exists. Auto-suggestion is ambiguous or wrong. Requires manual path design decision.
  Proposed options: person.fullName

- **BM-036::person.fullName** → default: **REJECT** (LOW)
  Rationale: Path collision detected: proposed path "document.issueDate" already exists. Auto-suggestion is ambiguous or wrong. Requires manual path design decision.
  Proposed options: document.issueDate

- **BM-036::decision.summaryLine** → default: **REJECT** (LOW)
  Rationale: Path collision detected: proposed path "agency.parentNameUpper" already exists. Auto-suggestion is ambiguous or wrong. Requires manual path design decision.
  Proposed options: agency.parentNameUpper

- **BM-041::agency.issuePlace** → default: **REJECT** (LOW)
  Rationale: Path collision detected: proposed path "document.documentCode" already exists. Auto-suggestion is ambiguous or wrong. Requires manual path design decision.
  Proposed options: document.documentCode

## Validation Result

Errors: 0
Warnings: 0

**PASS**