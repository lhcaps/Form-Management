# Form Root-Cause Fix Plan
Generated: 2026-06-29T03:39:22.280Z
Source audit: v2
KEEP_DEFERRED guard: 38 issues blocked from auto-fix (19 guarded BM/path entries)
Ineffective auto-fix guard: 0 issues blocked because canonical label already matches proposed label

## Executive Summary

| Metric | Value |
|--------|-------|
| totalIssues | 1427 |
| totalClassified | 1427 |
| unclassifiedCount | 0 |

| Classification | Count |
|---------------|-------|
| REVIEW_FIX_CANDIDATE | 931 |
| MANUAL_LEGAL_REVIEW | 454 |
| BLOCKED_BY_DOCX_AUTHORING | 42 |

## Classification Breakdown

### AUTO_FIX_CANDIDATE (0)

These are safe, high-confidence fixes. They do NOT modify locked contracts — they represent the safest batch for automated application.

### REVIEW_FIX_CANDIDATE (931)

These need human review before fixing. Common: SOURCE_MISMATCH, REQUIRED_SUSPICIOUS, SHOULD_BE_READONLY, GENERIC_FIELD_CANONICALIZATION with unknown path.

| templateCode | path | issueCodes | action | reason |
|--------------|------|------------|--------|--------|
| BM-003 | `document.issuePlaceAndDateLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "issuePlaceAndDateLine" on path "document.issuePlaceAndDateL |
| BM-003 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-003 | `recipients.primaryLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "primaryLine" on path "recipients.primaryLine" needs review |
| BM-003 | `recipients.archiveLine` | BAD_LABEL | UPDATE_LABEL | Raw camelCase label "archiveLine" on path "recipients.archiveLine" needs review |
| BM-004 | `document.vietTat` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.vietTat"; context="Xét thấy:{{document.fie |
| BM-004 | `agency.diaDanh` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.diaDanh"; context="{{document.field9}}" — ne |
| BM-007 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-011 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-013 | `agency.tenCo` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.tenCo"; context="Nhận thấy vụ việc{{document |
| BM-013 | `document.vietTat` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.vietTat"; context="Nhận thấy vụ việc{{docu |
| BM-013 | `agency.diaDanh` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.diaDanh"; context="Điều 1. Vụ việc7… thuộc t |
| BM-013 | `document.ngayBan` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.ngayBan"; context="Điều 2. Yêu cầu8{{case. |
| BM-013 | `document.soVan` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.soVan"; context="{{document.field7}}." — n |
| BM-014 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-016 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-018 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-021 | `agency.issuePlace` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.issuePlace"; context="Xét thấy{{document.fie |
| BM-021 | `document.issuePlaceAndDateLine` | RAW_PATTERN_DOMAIN_MISMATCH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested known path "legalBasis.procedureArticlesLi |
| BM-021 | `legalBasis.procedureArticlesLine` | RAW_PATTERN_DOMAIN_MISMATCH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested="agency.nameUpper" on path="legalBasis.pro |
| BM-021 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-021 | `decision.summaryLine` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "decision.summaryLine"; context="{{document.field9}} |
| BM-021 | `decision.decisionLine` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "decision.decisionLine"; context="{{document.field9} |
| BM-022 | `person.fullName` | REQUIRED_SUSPICIOUS | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "person.fullName" looks required but required=false.  |
| BM-023 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-024 | `document.issueDate` | REQUIRED_SUSPICIOUS | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.issueDate" looks required but required=fals |
| BM-024 | `document.issuePlaceAndDateLine` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.issuePlaceAndDateLine"; context="6{{docume |
| BM-025 | `agency.issuePlace` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.issuePlace"; context="6{{document.field3}}"  |
| BM-026 | `agency.nameUpper` | RAW_PATTERN_DOMAIN_MISMATCH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested known path "document.issueDate" for "agenc |
| BM-026 | `agency.nameUpper` | SOURCE_MISMATCH | UPDATE_SOURCE | SOURCE_MISMATCH: source="agencyConfig" on path="agency.nameUpper" (document doma |
| BM-026 | `document.issueDate` | REQUIRED_SUSPICIOUS | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.issueDate" looks required but required=fals |
| BM-027 | `agency.coQuan` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.coQuan"; context="Kính gửi:{{document.field2 |
| BM-027 | `agency.diaDanh` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.diaDanh"; context="Xét Quyết định khởi tố vụ |
| BM-027 | `document.soThong` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.soThong"; context="Xét Quyết định khởi tố  |
| BM-027 | `document.ngayBan` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.ngayBan"; context="Xét Quyết định khởi tố  |
| BM-028 | `agency.coQuan` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.coQuan"; context="1091565236220Độc lập - Tự  |
| BM-028 | `agency.diaDanh` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.diaDanh"; context="Xét thấy Quyết định thay  |
| BM-028 | `document.soQuyet` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.soQuyet"; context="Xét thấy Quyết định tha |
| BM-028 | `document.ngayBan` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.ngayBan"; context="Xét thấy Quyết định tha |
| BM-028 | `legalBasis.canCu` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "legalBasis.canCu"; context="Điều 1. Hủy bỏ Quyết đị |
| BM-028 | `document.soQd` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.soQd"; context="Điều 1. Hủy bỏ Quyết định  |
| BM-028 | `document.ngayQd` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.ngayQd"; context="Điều 1. Hủy bỏ Quyết địn |
| BM-029 | `agency.tenCo` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.tenCo"; context="Xét thấy Quyết định bổ sung |
| BM-029 | `document.vietTat` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "document.vietTat"; context="6{{document.field4}}" — |
| BM-030 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-031 | `agency.bodyName` | WEAK_EVIDENCE_AUTO_LOCKED | UPDATE_SOURCE | WEAK_EVIDENCE_AUTO_LOCKED: reviewRequired=false with generic raw="null" and weak |
| BM-032 | `agency.issuePlace` | BAD_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.issuePlace"; context="Nhận thấy8{{document.f |
| BM-033 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | UPDATE_SOURCE | SHOULD_BE_READONLY on path="legalBasis.procedureArticlesLine" with source="offic |
| BM-034 | `agency.issuePlace` | RAW_PATTERN_DOMAIN_MISMATCH | UPDATE_PATH | RAW_PATTERN_DOMAIN_MISMATCH suggested="decision.decisionLine" on path="agency.is |
| BM-034 | `document.issueDate` | REQUIRED_SUSPICIOUS | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.issueDate" looks required but required=fals |
| BM-035 | `document.issueDate` | REQUIRED_SUSPICIOUS | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.issueDate" looks required but required=fals |
| ... | | | | 881 more |

### MANUAL_LEGAL_REVIEW (454)

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
| ... | | | 424 more |

### DO_NOT_FIX_NOISE_OR_DERIVED (0)

These are NOT defects: compiled normalization, SHOULD_BE_READONLY noise where source is already correct, duplicate issues.

### BLOCKED_BY_DOCX_AUTHORING (42)

These need DOCX template reauthoring. Cannot be fixed by metadata changes alone.

| templateCode | path | issueCodes | reason |
|--------------|------|------------|--------|
| BM-063 | `document.issuePlaceAndDateLine` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-063 | `document.issuePlaceAndDateLine` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.fullDocumentCode` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.fullDocumentCode` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.fullDocumentCode` | REQUIRED_SUSPICIOUS | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine2` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine2` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `decision.decisionLine` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `decision.decisionLine` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.summaryLine` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.summaryLine` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.fullDocumentCode` | REMEDIATION_LEAK | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine` | REMEDIATION_LEAK | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine2` | REMEDIATION_LEAK | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `decision.decisionLine` | REMEDIATION_LEAK | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.summaryLine` | REMEDIATION_LEAK | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.fullDocumentCode` | UI_VISIBLE_BAD_METADATA | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine` | UI_VISIBLE_BAD_METADATA | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.reasonLine2` | UI_VISIBLE_BAD_METADATA | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `document.summaryLine` | UI_VISIBLE_BAD_METADATA | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-069 | `decision.decisionLine` | UI_VISIBLE_BAD_METADATA | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-075 | `document.fullDocumentCode` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-075 | `document.fullDocumentCode` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-075 | `document.fullDocumentCode` | REQUIRED_SUSPICIOUS | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-075 | `document.fullDocumentCode` | REMEDIATION_LEAK | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-075 | `document.fullDocumentCode` | UI_VISIBLE_BAD_METADATA | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-077 | `document.fullDocumentCode` | BAD_LABEL | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| BM-077 | `document.fullDocumentCode` | GENERIC_FIELD_CANONICALIZATION | KEEP_DEFERRED closure guard: BM/path is on KEEP_DEFERRED closure track. Prior cl |
| ... | | | 12 more |

### BLOCKED_BY_COMPILED_DRIFT_REBUILD (0)

Fix is to recompile the compiled-v2 artifact, not to modify the locked contract.

## BM-050 Detailed Fix Plan

Total: 4 issues classified

| path | classification | action | proposed | reason |
|------|----------------|--------|---------|--------|
| `agency.coQuan` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.coQuan"; context="Xét hồ sơ đề nghị phê chuẩ |
| `agency.coQuan` | MANUAL_LEGAL_REVIEW | MANUAL_REVIEW | MANUAL_REVIEW | GENERIC_FIELD_CANONICALIZATION: generic raw "{{decision.field2}}" on path="agenc |
| `agency.diaDanh` | REVIEW_FIX_CANDIDATE | UPDATE_LABEL | UPDATE_LABEL | Bad label "Ô trống" on path "agency.diaDanh"; context="11{{document.field3}}" —  |
| `agency.diaDanh` | MANUAL_LEGAL_REVIEW | MANUAL_REVIEW | MANUAL_REVIEW | GENERIC_FIELD_CANONICALIZATION: generic raw "{{document.field3}}" on path="agenc |

## BM-068 Detailed Fix Plan

Total: 4 issues classified

| path | classification | action | proposed | reason |
|------|----------------|--------|---------|--------|
| `document.fullDocumentCode` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.fullDocumentCode" looks required but requir |
| `document.issueDate` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "document.issueDate" looks required but required=fals |
| `person.occupation` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "person.occupation" looks required but required=false |
| `person.idNumber` | REVIEW_FIX_CANDIDATE | UPDATE_REQUIRED | UPDATE_REQUIRED | REQUIRED_SUSPICIOUS: field "person.idNumber" looks required but required=false.  |

## Top 20 Highest-Risk BMs

| templateCode | totalIssues | risk | recommendedAction |
|--------------|-------------|------|-------------------|
| BM-096 | 31 | HIGH | Manual legal review + DOCX authoring required |
| BM-155 | 29 | HIGH | Manual legal review + DOCX authoring required |
| BM-136 | 28 | HIGH | Manual legal review + DOCX authoring required |
| BM-069 | 24 | HIGH | Manual legal review + DOCX authoring required |
| BM-117 | 21 | HIGH | Manual legal review + DOCX authoring required |
| BM-118 | 21 | HIGH | Manual legal review + DOCX authoring required |
| BM-126 | 19 | HIGH | Manual legal review + DOCX authoring required |
| BM-106 | 18 | HIGH | Manual legal review + DOCX authoring required |
| BM-028 | 17 | HIGH | Manual legal review + DOCX authoring required |
| BM-134 | 14 | HIGH | Manual legal review + DOCX authoring required |
| BM-135 | 14 | HIGH | Manual legal review + DOCX authoring required |
| BM-152 | 14 | HIGH | Manual legal review + DOCX authoring required |
| BM-130 | 13 | HIGH | Manual legal review + DOCX authoring required |
| BM-048 | 12 | HIGH | Manual legal review + DOCX authoring required |
| BM-087 | 12 | HIGH | Manual legal review + DOCX authoring required |
| BM-127 | 12 | HIGH | Manual legal review + DOCX authoring required |
| BM-129 | 12 | HIGH | Manual legal review + DOCX authoring required |
| BM-133 | 12 | HIGH | Manual legal review + DOCX authoring required |
| BM-138 | 12 | HIGH | Manual legal review + DOCX authoring required |
| BM-161 | 12 | HIGH | Manual legal review + DOCX authoring required |

## Recommended Next Task

**FORMS_ROOT_CAUSE_REVIEW_BATCH_1**

Cannot proceed to auto-apply. Reasons:
- 0 effective AUTO_FIX_CANDIDATE items remain

**Action**: Run FORMS_ROOT_CAUSE_REVIEW_BATCH_1 to triage remaining issues.
