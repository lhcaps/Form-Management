# Form Root-Cause Fix Plan
Generated: 2026-06-25T17:50:37.395Z
Source audit: v2

## Executive Summary

| Metric | Value |
|--------|-------|
| totalIssues | 3460 |
| totalClassified | 3460 |
| unclassifiedCount | 0 |

| Classification | Count |
|---------------|-------|
| REVIEW_FIX_CANDIDATE | 1868 |
| DO_NOT_FIX_NOISE_OR_DERIVED | 952 |
| MANUAL_LEGAL_REVIEW | 468 |
| BLOCKED_BY_DOCX_AUTHORING | 100 |
| AUTO_FIX_CANDIDATE | 72 |

## Classification Breakdown

### AUTO_FIX_CANDIDATE (72)

These are safe, high-confidence fixes. They do NOT modify locked contracts — they represent the safest batch for automated application.

| templateCode | path | action | proposedLabel | proposedPath | reason |
|--------------|------|--------|--------------|-------------|--------|
| BM-002 | `document.documentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="documentCode" on path "document.documentCode" has known Vietnamese la |
| BM-002 | `document.documentCode` | UPDATE_LABEL | `Số văn bản` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-003 | `document.documentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="documentCode" on path "document.documentCode" has known Vietnamese la |
| BM-003 | `legalBasis.procedureArticlesLine` | UPDATE_LABEL | `Căn cứ pháp lý` | - | BAD_LABEL="procedureArticlesLine" on path "legalBasis.procedureArticlesLine" has |
| BM-003 | `document.documentCode` | UPDATE_LABEL | `Số văn bản` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-003 | `legalBasis.procedureArticlesLine` | UPDATE_LABEL | `Căn cứ pháp lý` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-021 | `document.issuePlaceAndDateLine` | UPDATE_PATH | `Căn cứ pháp lý` | `legalBasis.procedureArticlesLine` | Domain mismatch: raw="{{legalBasis.procedureArticlesLine}}" on path "document.is |
| BM-026 | `agency.nameUpper` | UPDATE_PATH | `Ngày ban hành` | `document.issueDate` | Domain mismatch: raw="{{document.issueDate}}" on path "agency.nameUpper". sugges |
| BM-036 | `document.issuePlaceAndDateLine` | UPDATE_PATH | `Họ tên` | `person.fullName` | Domain mismatch: raw="{{person.fullName}}" on path "document.issuePlaceAndDateLi |
| BM-036 | `person.fullName` | UPDATE_PATH | `Ngày ban hành` | `document.issueDate` | Domain mismatch: raw="{{document.issueDate}}" on path "person.fullName". suggest |
| BM-036 | `decision.summaryLine` | UPDATE_PATH | `Cơ quan cấp trên viết hoa` | `agency.parentNameUpper` | Domain mismatch: raw="{{agency.parentNameUpper}}" on path "decision.summaryLine" |
| BM-041 | `agency.issuePlace` | UPDATE_PATH | `Số văn bản` | `document.documentCode` | Domain mismatch: raw="{{document.documentCode}}" on path "agency.issuePlace". su |
| BM-068 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod |
| BM-068 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field1}}" on path "docum |
| BM-068 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.issueDate" has  |
| BM-068 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field2}}" on path "docum |
| BM-068 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | REMEDIATION_LEAK on path="document.fullDocumentCode" which has known label overr |
| BM-068 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | REMEDIATION_LEAK on path="document.issueDate" which has known label override. La |
| BM-068 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-068 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-069 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod |
| BM-069 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field1}}" on path "docum |
| BM-069 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.issueDate" has  |
| BM-069 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field2}}" on path "docum |
| BM-069 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | REMEDIATION_LEAK on path="document.fullDocumentCode" which has known label overr |
| BM-069 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | REMEDIATION_LEAK on path="document.issueDate" which has known label override. La |
| BM-069 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-069 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-073 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod |
| BM-073 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field1}}" on path "docum |
| BM-073 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.issueDate" has  |
| BM-073 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field2}}" on path "docum |
| BM-073 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | REMEDIATION_LEAK on path="document.fullDocumentCode" which has known label overr |
| BM-073 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | REMEDIATION_LEAK on path="document.issueDate" which has known label override. La |
| BM-073 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-073 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-075 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod |
| BM-075 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field1}}" on path "docum |
| BM-075 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | REMEDIATION_LEAK on path="document.fullDocumentCode" which has known label overr |
| BM-075 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-077 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod |
| BM-077 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field1}}" on path "docum |
| BM-077 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | REMEDIATION_LEAK on path="document.fullDocumentCode" which has known label overr |
| BM-077 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| BM-080 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod |
| BM-080 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field1}}" on path "docum |
| BM-080 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.issueDate" has  |
| BM-080 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field2}}" on path "docum |
| BM-080 | `document.fullDocumentCode` | UPDATE_LABEL | `Số văn bản` | - | REMEDIATION_LEAK on path="document.fullDocumentCode" which has known label overr |
| BM-080 | `document.issueDate` | UPDATE_LABEL | `Ngày ban hành` | - | REMEDIATION_LEAK on path="document.issueDate" which has known label override. La |
| ... | | | | | 22 more |

### REVIEW_FIX_CANDIDATE (1868)

These need human review before fixing. Common: SOURCE_MISMATCH, REQUIRED_SUSPICIOUS, SHOULD_BE_READONLY, GENERIC_FIELD_CANONICALIZATION with unknown path.

| templateCode | path | issueCodes | action | reason |
|--------------|------|------------|--------|--------|
| BM-001 | `document.issuePlaceDateLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="document.issuePlaceDateLine" with source="systemDate |
| BM-001 | `informant.occupation` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "occupation" on path "informant.occupation" needs review |
| BM-001 | `informant.identityNo` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityNo" on path "informant.identityNo" needs review |
| BM-001 | `informant.identityIssuedDay` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityIssuedDay" on path "informant.identityIssuedDay" ne |
| BM-001 | `informant.identityIssuedMonth` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityIssuedMonth" on path "informant.identityIssuedMonth |
| BM-001 | `informant.identityIssuedYear` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityIssuedYear" on path "informant.identityIssuedYear"  |
| BM-001 | `informant.identityIssuedPlace` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityIssuedPlace" on path "informant.identityIssuedPlace |
| BM-001 | `informant.permanentAddress` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "permanentAddress" on path "informant.permanentAddress" need |
| BM-001 | `informant.temporaryAddress` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "temporaryAddress" on path "informant.temporaryAddress" need |
| BM-001 | `informant.currentAddress` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "currentAddress" on path "informant.currentAddress" needs re |
| BM-001 | `informant.phone` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "phone" on path "informant.phone" needs review |
| BM-001 | `informant.representedOrganization` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "representedOrganization" on path "informant.representedOrga |
| BM-001 | `recipients.archiveLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "archiveLine" on path "recipients.archiveLine" needs review |
| BM-001 | `informant.occupation` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.occupation" with label "occupation" — |
| BM-001 | `informant.identityNo` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.identityNo" with label "identityNo" — |
| BM-001 | `informant.identityIssuedDay` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.identityIssuedDay" with label "identi |
| BM-001 | `informant.identityIssuedMonth` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.identityIssuedMonth" with label "iden |
| BM-001 | `informant.identityIssuedYear` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.identityIssuedYear" with label "ident |
| BM-001 | `informant.identityIssuedPlace` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.identityIssuedPlace" with label "iden |
| BM-001 | `informant.permanentAddress` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.permanentAddress" with label "permane |
| BM-001 | `informant.temporaryAddress` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.temporaryAddress" with label "tempora |
| BM-001 | `informant.currentAddress` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.currentAddress" with label "currentAd |
| BM-001 | `informant.phone` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.phone" with label "phone" — needs rev |
| BM-001 | `informant.representedOrganization` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "informant.representedOrganization" with label " |
| BM-001 | `recipients.archiveLine` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "recipients.archiveLine" with label "archiveLine |
| BM-002 | `document.documentCode` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY: path="document.documentCode" looks computed/system but sourc |
| BM-002 | `document.documentCode` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY: path="document.documentCode" looks computed/system but sourc |
| BM-002 | `document.issuePlaceAndDateLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "issuePlaceAndDateLine" on path "document.issuePlaceAndDateL |
| BM-002 | `sourceReport.receivedDateLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "receivedDateLine" on path "sourceReport.receivedDateLine" n |
| BM-002 | `agency.bodyName` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "bodyName" on path "agency.bodyName" needs review |
| BM-002 | `reporter.genderText` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "genderText" on path "reporter.genderText" needs review |
| BM-002 | `reporter.otherName` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "otherName" on path "reporter.otherName" needs review |
| BM-002 | `reporter.birthDateLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "birthDateLine" on path "reporter.birthDateLine" needs revie |
| BM-002 | `reporter.birthPlace` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "birthPlace" on path "reporter.birthPlace" needs review |
| BM-002 | `reporter.ethnicity` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "ethnicity" on path "reporter.ethnicity" needs review |
| BM-002 | `reporter.religion` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "religion" on path "reporter.religion" needs review |
| BM-002 | `reporter.occupation` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "occupation" on path "reporter.occupation" needs review |
| BM-002 | `reporter.identityNumber` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityNumber" on path "reporter.identityNumber" needs rev |
| BM-002 | `reporter.identityIssueDateLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityIssueDateLine" on path "reporter.identityIssueDateL |
| BM-002 | `reporter.identityIssuePlace` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "identityIssuePlace" on path "reporter.identityIssuePlace" n |
| BM-002 | `reporter.permanentResidence` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "permanentResidence" on path "reporter.permanentResidence" n |
| BM-002 | `reporter.temporaryResidence` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "temporaryResidence" on path "reporter.temporaryResidence" n |
| BM-002 | `reporter.currentResidence` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "currentResidence" on path "reporter.currentResidence" needs |
| BM-002 | `reporter.phoneNumber` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "phoneNumber" on path "reporter.phoneNumber" needs review |
| BM-002 | `reporter.organizationRepresentative` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "organizationRepresentative" on path "reporter.organizationR |
| BM-002 | `sourceReport.content` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "content" on path "sourceReport.content" needs review |
| BM-002 | `recipients.primaryLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "primaryLine" on path "recipients.primaryLine" needs review |
| BM-002 | `recipients.archiveLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "archiveLine" on path "recipients.archiveLine" needs review |
| BM-002 | `agency.bodyName` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "agency.bodyName" with label "bodyName" — needs  |
| BM-002 | `document.issuePlaceAndDateLine` | UI_VISIBLE_BAD_METADATA | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "document.issuePlaceAndDateLine" with label "iss |
| ... | | | | 1818 more |

### MANUAL_LEGAL_REVIEW (468)

These involve legal/procedural judgment. Required: legal expert review before any change.

| templateCode | path | issueCodes | reason |
|--------------|------|------------|--------|
| BM-004 | `document.vietTat` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field4}}" on path="docum |
| BM-004 | `agency.diaDanh` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field9}}" on path="agenc |
| BM-009 | `sourceResolutionExtension.article1Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceResolutionExtension.article1Line |
| BM-009 | `sourceResolutionExtension.article2Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceResolutionExtension.article2Line |
| BM-010 | `sourceSuspension.caseSummary` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceSuspension.caseSummary" but cont |
| BM-010 | `sourceSuspension.article2Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceSuspension.article2Line" but con |
| BM-010 | `sourceSuspension.article3Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceSuspension.article3Line" but con |
| BM-011 | `sourceSuspensionCancellation.article1Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceSuspensionCancellation.article1L |
| BM-011 | `sourceSuspensionCancellation.article2Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceSuspensionCancellation.article2L |
| BM-013 | `agency.tenCo` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field3}}" on path="agenc |
| BM-013 | `document.vietTat` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field4}}" on path="docum |
| BM-013 | `agency.diaDanh` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field5}}" on path="agenc |
| BM-013 | `document.ngayBan` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="document.ngayBan" but context is fixed |
| BM-013 | `document.ngayBan` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{case.field6}}" on path="document. |
| BM-013 | `document.soVan` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field7}}" on path="docum |
| BM-014 | `sourceDirectInspection.article1Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceDirectInspection.article1Line" b |
| BM-014 | `sourceDirectInspection.article3Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceDirectInspection.article3Line" b |
| BM-014 | `sourceDirectInspection.article4Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="sourceDirectInspection.article4Line" b |
| BM-020 | `initiationRequest.article1Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="initiationRequest.article1Line" but co |
| BM-020 | `initiationRequest.article2Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="initiationRequest.article2Line" but co |
| BM-021 | `agency.issuePlace` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field3}}" on path="agenc |
| BM-021 | `decision.summaryLine` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field9}}" on path="decis |
| BM-021 | `decision.decisionLine` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field10}}" on path="deci |
| BM-023 | `investigation.article2Line` | SOURCE_MISMATCH | SOURCE_MISMATCH: source="manual" on path="investigation.article2Line" but contex |
| BM-024 | `document.issuePlaceAndDateLine` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field6}}" on path="docum |
| BM-025 | `agency.issuePlace` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field3}}" on path="agenc |
| BM-027 | `agency.coQuan` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field2}}" on path="agenc |
| BM-027 | `agency.diaDanh` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{case.field3}}" on path="agency.di |
| BM-027 | `document.soThong` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{case.field4}}" on path="document. |
| BM-027 | `document.ngayBan` | GENERIC_FIELD_CANONICALIZATION | GENERIC_FIELD_CANONICALIZATION: generic raw "{{case.field5}}" on path="document. |
| ... | | | 438 more |

### DO_NOT_FIX_NOISE_OR_DERIVED (952)

These are NOT defects: compiled normalization, SHOULD_BE_READONLY noise where source is already correct, duplicate issues.

| templateCode | path | issueCodes | reason |
|--------------|------|------------|--------|
| BM-001 | `document.issuePlaceDateLine` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `document.issuePlaceDateLine` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-001 | `receiver.fullName` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `receiver.positionTitle` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `receiver.positionTitle` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-001 | `receiver.departmentName` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.fullName` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.genderLabel` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.otherName` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.birthDay` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.birthMonth` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.birthYear` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.placeOfBirth` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.nationality` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.ethnicity` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.religion` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.signerName` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `informant.signerName` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-001 | `receiver.signerName` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-001 | `receiver.signerName` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-002 | `agency.parentName` | SHOULD_BE_READONLY | SHOULD_BE_READONLY on path="agency.parentName" but source="agencyConfig" is alre |
| BM-002 | `agency.name` | SHOULD_BE_READONLY | SHOULD_BE_READONLY on path="agency.name" but source="agencyConfig" is already a  |
| BM-002 | `agency.parentName` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-002 | `agency.parentName` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-002 | `agency.name` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-002 | `agency.name` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-002 | `document.issuePlaceAndDateLine` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-002 | `receiver.name` | COMPILED_DRIFT | Label drift between locked and compiled is resolved by compilation; not a locked |
| BM-002 | `sourceReport.receivedDateLine` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| BM-002 | `agency.bodyName` | COMPILED_DRIFT | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| ... | | | 922 more |

### BLOCKED_BY_DOCX_AUTHORING (100)

These need DOCX template reauthoring. Cannot be fixed by metadata changes alone.

| templateCode | path | issueCodes | reason |
|--------------|------|------------|--------|
| BM-051 | `decision.decisionLine3` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "decision.decisionLi |
| BM-052 | `decision.decisionLine2` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "decision.decisionLi |
| BM-052 | `recipients.personLine6` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "recipients.personLi |
| BM-060 | `decision.decisionLine10` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "decision.decisionLi |
| BM-061 | `recipients.personLine3` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "recipients.personLi |
| BM-062 | `decision.decisionLine11` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "decision.decisionLi |
| BM-062 | `recipients.personLine5` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "recipients.personLi |
| BM-063 | `document.fullDocumentCode8` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "document.fullDocume |
| BM-063 | `recipients.personLine5` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "recipients.personLi |
| BM-064 | `document.issueDate4` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "document.issueDate4 |
| BM-065 | `document.fullDocumentCode8` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "document.fullDocume |
| BM-065 | `recipients.personLine3` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "recipients.personLi |
| BM-066 | `document.fullDocumentCode4` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "document.fullDocume |
| BM-066 | `recipients.personLine4` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "recipients.personLi |
| BM-067 | `document.fullDocumentCode6` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "document.fullDocume |
| BM-067 | `recipients.personLine3` | BAD_LABEL | Remediation label leak "Slot from DOCX remediation" on path "recipients.personLi |
| BM-068 | `person.dateOfBirth` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.date |
| BM-068 | `person.permanentAddress` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.perm |
| BM-068 | `person.permanentAddress2` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.perm |
| BM-068 | `person.occupation` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.occu |
| BM-068 | `person.idNumber` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.idNu |
| BM-068 | `person.permanentAddress3` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.perm |
| BM-068 | `person.occupation2` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.occu |
| BM-068 | `person.idNumber2` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.idNu |
| BM-068 | `person.temporaryAddress` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.temp |
| BM-068 | `person.province` | BAD_LABEL | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.prov |
| BM-068 | `person.dateOfBirth` | REMEDIATION_LEAK | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| BM-068 | `person.permanentAddress` | REMEDIATION_LEAK | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| BM-068 | `person.permanentAddress2` | REMEDIATION_LEAK | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| BM-068 | `person.occupation` | REMEDIATION_LEAK | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| ... | | | 70 more |

### BLOCKED_BY_COMPILED_DRIFT_REBUILD (0)

Fix is to recompile the compiled-v2 artifact, not to modify the locked contract.

## BM-050 Detailed Fix Plan

Total: 13 issues classified

| path | classification | action | proposed | reason |
|------|----------------|--------|---------|--------|
| `agency.tenVien` | REVIEW_FIX_CANDIDATE | UPDATE_PATH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested "document.field1" but suggestedPath contai |
| `agency.tenVien` | REVIEW_FIX_CANDIDATE | UPDATE_SOURCE | UPDATE_SOURCE | SOURCE_MISMATCH: source="agencyConfig" on path="agency.tenVien" (document domain |
| `agency.coQuan` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.coQuan"; context="Xét hồ sơ đề nghị phê chuẩ |
| `agency.coQuan` | REVIEW_FIX_CANDIDATE | UPDATE_PATH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested "decision.field2" but suggestedPath contai |
| `agency.coQuan` | REVIEW_FIX_CANDIDATE | UPDATE_SOURCE | UPDATE_SOURCE | SOURCE_MISMATCH: source="agencyConfig" on path="agency.coQuan" (decision domain) |
| `agency.coQuan` | MANUAL_LEGAL_REVIEW | MANUAL_REVIEW | MANUAL_REVIEW | GENERIC_FIELD_CANONICALIZATION: generic raw "{{decision.field2}}" on path="agenc |
| `agency.diaDanh` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.diaDanh"; context="11{{document.field3}}" —  |
| `agency.diaDanh` | REVIEW_FIX_CANDIDATE | UPDATE_PATH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested "document.field3" but suggestedPath contai |
| `agency.diaDanh` | REVIEW_FIX_CANDIDATE | UPDATE_SOURCE | UPDATE_SOURCE | SOURCE_MISMATCH: source="agencyConfig" on path="agency.diaDanh" (document domain |
| `agency.diaDanh` | MANUAL_LEGAL_REVIEW | MANUAL_REVIEW | MANUAL_REVIEW | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field3}}" on path="agenc |
| `agency.tenVien` | DO_NOT_FIX_NOISE_OR_DERIVED | NO_OP | NO_OP | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| `agency.coQuan` | DO_NOT_FIX_NOISE_OR_DERIVED | NO_OP | NO_OP | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| `agency.diaDanh` | DO_NOT_FIX_NOISE_OR_DERIVED | NO_OP | NO_OP | Enum normalization difference between locked (snake) and compiled (uppercase); n |

## BM-068 Detailed Fix Plan

Total: 49 issues classified

| path | classification | action | proposed | reason |
|------|----------------|--------|---------|--------|
| `agency.name` | REVIEW_FIX_CANDIDATE | UPDATE_PATH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested "document.field1" but suggestedPath contai |
| `agency.name` | REVIEW_FIX_CANDIDATE | UPDATE_SOURCE | UPDATE_SOURCE | SOURCE_MISMATCH: source="agencyConfig" on path="agency.name" (document domain).  |
| `agency.name` | DO_NOT_FIX_NOISE_OR_DERIVED | NO_OP | NO_OP | SHOULD_BE_READONLY on path="agency.name" but source="agencyConfig" is already a  |
| `document.fullDocumentCode` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Số văn bản, UPDATE_LABEL | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.fullDocumentCod |
| `document.fullDocumentCode` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Số văn bản, UPDATE_LABEL | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field1}}" on path "docum |
| `document.fullDocumentCode` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.fullDocumentCode" looks required but requir |
| `document.fullDocumentCode` | REVIEW_FIX_CANDIDATE | UPDATE_SOURCE | UPDATE_SOURCE | SHOULD_BE_READONLY: path="document.fullDocumentCode" looks computed/system but s |
| `document.issueDate` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Ngày ban hành, UPDATE_LABEL | BAD_LABEL="Slot from Wave 02 DOCX remediation" on path "document.issueDate" has  |
| `document.issueDate` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Ngày ban hành, UPDATE_LABEL | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field2}}" on path "docum |
| `document.issueDate` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.issueDate" looks required but required=fals |
| `person.dateOfBirth` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.date |
| `person.dateOfBirth` | REVIEW_FIX_CANDIDATE | UPDATE_PATH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested "document.field3" but suggestedPath contai |
| `person.dateOfBirth` | MANUAL_LEGAL_REVIEW | MANUAL_REVIEW | MANUAL_REVIEW | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field3}}" on path="perso |
| `person.permanentAddress` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.perm |
| `person.permanentAddress2` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.perm |
| `person.occupation` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.occu |
| `person.occupation` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "person.occupation" looks required but required=false |
| `person.idNumber` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.idNu |
| `person.idNumber` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "person.idNumber" looks required but required=false.  |
| `person.permanentAddress3` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.perm |
| `person.occupation2` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.occu |
| `person.idNumber2` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.idNu |
| `person.temporaryAddress` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.temp |
| `person.province` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | Remediation label leak "Slot from Wave 02 DOCX remediation" on path "person.prov |
| `document.fullDocumentCode` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Số văn bản, UPDATE_LABEL | REMEDIATION_LEAK on path="document.fullDocumentCode" which has known label overr |
| `document.issueDate` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Ngày ban hành, UPDATE_LABEL | REMEDIATION_LEAK on path="document.issueDate" which has known label override. La |
| `person.dateOfBirth` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.permanentAddress` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.permanentAddress2` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.occupation` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.idNumber` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.permanentAddress3` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.occupation2` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.idNumber2` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.temporaryAddress` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `person.province` | BLOCKED_BY_DOCX_AUTHORING | DOCX_REAUTHOR | DOCX_REAUTHOR | REMEDIATION_LEAK: Wave 02 slot "Slot from Wave 02 DOCX remediation" on path="per |
| `agency.name` | DO_NOT_FIX_NOISE_OR_DERIVED | NO_OP | NO_OP | Enum normalization difference between locked (snake) and compiled (uppercase); n |
| `document.fullDocumentCode` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Số văn bản, UPDATE_LABEL | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| `document.issueDate` | AUTO_FIX_CANDIDATE | UPDATE_LABEL | Ngày ban hành, UPDATE_LABEL | UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing labe |
| `person.dateOfBirth` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.dateOfBirth" with label "Slot from Wave  |
| `person.permanentAddress` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.permanentAddress" with label "Slot from  |
| `person.permanentAddress2` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.permanentAddress2" with label "Slot from |
| `person.occupation` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.occupation" with label "Slot from Wave 0 |
| `person.idNumber` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.idNumber" with label "Slot from Wave 02  |
| `person.permanentAddress3` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.permanentAddress3" with label "Slot from |
| `person.occupation2` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.occupation2" with label "Slot from Wave  |
| `person.idNumber2` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.idNumber2" with label "Slot from Wave 02 |
| `person.temporaryAddress` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.temporaryAddress" with label "Slot from  |
| `person.province` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | UI_VISIBLE_BAD_METADATA on path "person.province" with label "Slot from Wave 02  |

## Top 20 Highest-Risk BMs

| templateCode | totalIssues | risk | recommendedAction |
|--------------|-------------|------|-------------------|
| BM-069 | 58 | HIGH | Manual legal review + DOCX authoring required |
| BM-068 | 49 | HIGH | Manual legal review + DOCX authoring required |
| BM-096 | 49 | HIGH | Manual legal review + DOCX authoring required |
| BM-136 | 45 | HIGH | Manual legal review + DOCX authoring required |
| BM-163 | 43 | HIGH | Manual legal review + DOCX authoring required |
| BM-155 | 40 | HIGH | Manual legal review + DOCX authoring required |
| BM-162 | 34 | HIGH | Manual legal review + DOCX authoring required |
| BM-117 | 32 | HIGH | Manual legal review + DOCX authoring required |
| BM-126 | 32 | HIGH | Manual legal review + DOCX authoring required |
| BM-118 | 31 | HIGH | Manual legal review + DOCX authoring required |
| BM-080 | 27 | HIGH | Manual legal review + DOCX authoring required |
| BM-106 | 27 | HIGH | Manual legal review + DOCX authoring required |
| BM-134 | 26 | HIGH | Manual legal review + DOCX authoring required |
| BM-135 | 26 | HIGH | Manual legal review + DOCX authoring required |
| BM-152 | 25 | HIGH | Manual legal review + DOCX authoring required |
| BM-028 | 24 | HIGH | Manual legal review + DOCX authoring required |
| BM-127 | 24 | HIGH | Manual legal review + DOCX authoring required |
| BM-138 | 23 | HIGH | Manual legal review + DOCX authoring required |
| BM-048 | 22 | HIGH | Manual legal review + DOCX authoring required |
| BM-129 | 22 | HIGH | Manual legal review + DOCX authoring required |

## Recommended Next Task

**FORMS_ROOT_CAUSE_APPLY_SAFE_FIXES**

72 AUTO_FIX_CANDIDATE items with applySafe=true are ready for application.

**Action**: Apply only AUTO_FIX_CANDIDATE with applySafe=true. These:
1. Update labels using known Vietnamese label overrides
2. Update paths where suggestedPath is a known semantic path
3. Do NOT modify DOCX templates
4. Do NOT modify compiled artifacts
5. Regenerate compiled-v2 after locked contract changes
