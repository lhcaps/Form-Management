# Forms Root Cause — Review Batch 2

Generated: 2026-06-25T22:31:22.851Z

## Summary

| Metric | Value |
|--------|-------|
| Total review groups | 50 |
| Apply-preview count | 0 |
| REVIEW_CHOOSE_LABEL | 0 |
| REVIEW_CHOOSE_SOURCE | 0 |
| REVIEW_CHOOSE_PATH | 0 |
| DEFER_METADATA_REVIEW | 50 |
| APPROVE | 0 |
| DEFER_* | 50 |

## By Issue Code

| Issue Code | Count |
|------------|-------|
| BAD_LABEL | 46 |
| UI_VISIBLE_BAD_METADATA | 34 |
| RAW_PATTERN_DOMAIN_MISMATCH | 9 |
| SOURCE_MISMATCH | 6 |
| SHOULD_BE_READONLY | 1 |
| COMPILED_DRIFT | 3 |

## Decision Sheet

| reviewGroupId | BM | field path | current label | current source | issue codes | recommended decision | applySafe |
|---|---|---|---|---|---|---|---|
| B2RG-001 | BM-001 | `informant.occupation` | occupation | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-002 | BM-001 | `informant.identityNo` | identityNo | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-003 | BM-001 | `informant.identityIssuedDay` | identityIssuedDay | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-004 | BM-001 | `informant.identityIssuedMonth` | identityIssuedMonth | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-005 | BM-001 | `informant.identityIssuedYear` | identityIssuedYear | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-006 | BM-001 | `informant.identityIssuedPlace` | identityIssuedPlace | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-007 | BM-001 | `informant.permanentAddress` | permanentAddress | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-008 | BM-001 | `informant.temporaryAddress` | temporaryAddress | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-009 | BM-001 | `informant.currentAddress` | currentAddress | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-010 | BM-001 | `informant.phone` | phone | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-011 | BM-001 | `informant.representedOrganization` | representedOrganization | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-012 | BM-001 | `recipients.archiveLine` | archiveLine | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-013 | BM-002 | `document.issuePlaceAndDateLine` | issuePlaceAndDateLine | systemDate | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-014 | BM-002 | `sourceReport.receivedDateLine` | receivedDateLine | systemDate | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-015 | BM-002 | `agency.bodyName` | bodyName | agencyConfig | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-016 | BM-002 | `reporter.genderText` | genderText | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-017 | BM-002 | `reporter.otherName` | otherName | manual | BAD_LABEL | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-018 | BM-002 | `reporter.birthDateLine` | birthDateLine | systemDate | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-019 | BM-002 | `reporter.birthPlace` | birthPlace | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-020 | BM-002 | `reporter.ethnicity` | ethnicity | manual | BAD_LABEL | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-021 | BM-002 | `reporter.religion` | religion | manual | BAD_LABEL | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-022 | BM-002 | `reporter.occupation` | occupation | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-023 | BM-002 | `reporter.identityNumber` | identityNumber | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-024 | BM-002 | `reporter.identityIssueDateLine` | identityIssueDateLine | systemDate | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-025 | BM-002 | `reporter.identityIssuePlace` | identityIssuePlace | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-026 | BM-002 | `reporter.permanentResidence` | permanentResidence | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-027 | BM-002 | `reporter.temporaryResidence` | temporaryResidence | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-028 | BM-002 | `reporter.currentResidence` | currentResidence | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-029 | BM-002 | `reporter.phoneNumber` | phoneNumber | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-030 | BM-002 | `reporter.organizationRepresentative` | organizationRepresentative | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-031 | BM-002 | `sourceReport.content` | content | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-032 | BM-002 | `recipients.primaryLine` | primaryLine | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-033 | BM-002 | `recipients.archiveLine` | archiveLine | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-034 | BM-003 | `document.issuePlaceAndDateLine` | issuePlaceAndDateLine | systemDate | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-035 | BM-003 | `recipients.primaryLine` | primaryLine | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-036 | BM-003 | `recipients.archiveLine` | archiveLine | manual | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-037 | BM-003 | `signature.signMode` | signMode | officialConfig | BAD_LABEL, UI_VISIBLE_BAD_METADATA | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-038 | BM-004 | `agency.vienKiem` | Tên cơ quan | agencyConfig | RAW_PATTERN_DOMAIN_MISMATCH, SOURCE_MISMATCH | DEFER_METADATA_REVIEW (MEDIUM) | no |
| B2RG-039 | BM-004 | `agency.tenCo` | Tên cơ quan | agencyConfig | RAW_PATTERN_DOMAIN_MISMATCH, SOURCE_MISMATCH | DEFER_METADATA_REVIEW (MEDIUM) | no |
| B2RG-040 | BM-004 | `document.vietTat` | Ô trống | manual | BAD_LABEL | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-041 | BM-004 | `agency.diaDanh` | Ô trống | agencyConfig | BAD_LABEL, RAW_PATTERN_DOMAIN_MISMATCH, SOURCE_MISMATCH | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-042 | BM-013 | `agency.vienKiem` | Tên cơ quan | agencyConfig | RAW_PATTERN_DOMAIN_MISMATCH, SOURCE_MISMATCH | DEFER_METADATA_REVIEW (MEDIUM) | no |
| B2RG-043 | BM-013 | `agency.tenCo` | Ô trống | agencyConfig | BAD_LABEL, RAW_PATTERN_DOMAIN_MISMATCH, SOURCE_MISMATCH | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-044 | BM-013 | `document.vietTat` | Ô trống | manual | BAD_LABEL | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-045 | BM-013 | `agency.diaDanh` | Ô trống | agencyConfig | BAD_LABEL, RAW_PATTERN_DOMAIN_MISMATCH, SOURCE_MISMATCH | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-046 | BM-013 | `document.ngayBan` | Ô trống | manual | BAD_LABEL | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-047 | BM-013 | `document.soVan` | Ô trống | manual | BAD_LABEL | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-048 | BM-021 | `agency.parentNameUpper` | Tên cơ quan | computed | RAW_PATTERN_DOMAIN_MISMATCH, SHOULD_BE_READONLY, COMPILED_DRIFT | DEFER_METADATA_REVIEW (MEDIUM) | no |
| B2RG-049 | BM-021 | `agency.issuePlace` | Ô trống | computed | BAD_LABEL, RAW_PATTERN_DOMAIN_MISMATCH, COMPILED_DRIFT | DEFER_METADATA_REVIEW (LOW) | no |
| B2RG-050 | BM-021 | `decision.summaryLine` | Ô trống | computed | BAD_LABEL, RAW_PATTERN_DOMAIN_MISMATCH, COMPILED_DRIFT | DEFER_METADATA_REVIEW (LOW) | no |

## Apply Preview (APPROVE + applySafe=true)

> **NOTE:** These groups are prepared for Batch 2 decisions. Do NOT apply until `decisions.approved.json` is created.

| reviewGroupId | BM | path | action | proposed value | confidence |
|---|---|---|---|---|---|
| _none_ | | | | | |

## Validation Result

Errors: 0
Warnings: 0

**PASS**

## Safety Exclusions Applied

- legalBasis.* paths excluded from Batch 2 scope
- Wave 02 DOCX remediation labels ("Slot from Wave 02 DOCX remediation") excluded
- BM-068, BM-069 excluded (Wave 02 BMs)
- MANUAL_LEGAL_REVIEW, BLOCKED_BY_DOCX_AUTHORING, DO_NOT_FIX_NOISE_OR_DERIVED excluded
- Groups already decided in Batch 1 excluded
- LOW confidence items excluded from apply-preview
- UPDATE_PATH items excluded from apply-safe (no explicit path collision safety proof)

## Recommended Next Task

`FORMS_ROOT_CAUSE_REVIEW_BATCH_2_DECISIONS` — Human reviews and approves/rejects Batch 2 decision sheet, producing `docs/audit/forms-root-cause-review-batch-2/decisions.approved.json`.

After decisions.approved.json exists:
1. `pnpm apply:forms-root-cause-review-batch-2-approved`
2. `pnpm validate`
3. `pnpm --filter @qllaw/form-contracts test`
4. `pnpm typecheck`