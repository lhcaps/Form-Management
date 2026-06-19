# BM-001 Shadow Evidence Summary

**Generated**: 2026-06-19T23:56:15.933Z
**Phase**: D.2.3A — Shared Renderer Foundation
**Source**: `storage/generated/shadow-renders/BM-001/**`

## Summary

- scenarios run: **5**
- semantic pass: **1** / warning: **4** / fail: **0**
- format pass: **0** / warning: **5** / fail: **0**
- unresolved placeholders: **0**
- unexpected undefined/null literals: **0**
- missing expected text: **0**
- package integrity failures: **0**
- stale/non-shared renderer evidence: **0**
- not_detectable format checks: **5** scenarios
- accepted warnings: **5** scenarios (01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses)
- blockers: **none**

## Scenario Matrix

| Scenario | Semantic | Format | Package | Missing expected text | Unresolved/literal | Format failures | Notes |
|---|---|---|---|---|---|---|---|
| 01-basic-valid | `warning` | `warning` | `pass` | - | - | - | Text length differs by 19.7% but no specific missing values found.<br>FMT-011<br>FMT-015 |
| 02-long-source-report | `pass` | `warning` | `pass` | - | - | - | FMT-011<br>FMT-015 |
| 03-organization-informant | `warning` | `warning` | `pass` | - | - | - | Text length differs by 13.6% but no specific missing values found.<br>FMT-011<br>FMT-015 |
| 04-missing-optional-fields | `warning` | `warning` | `pass` | - | - | - | Text length differs by 20.6% but no specific missing values found.<br>FMT-011<br>FMT-015 |
| 05-vietnamese-diacritics-and-addresses | `warning` | `warning` | `pass` | - | - | - | Text length differs by 12.5% but no specific missing values found.<br>FMT-011<br>FMT-015 |

## Format Requirement Coverage

| Requirement ID | Check ID | Overall Status | Pass/Warn/Fail/ND | Evidence | Notes |
|---|---|---|---|---|---|
| FMT-001 | FMT-001 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-002 | FMT-002 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-003 | FMT-003 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-004 | FMT-004 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-005 | FMT-005 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-006 | FMT-006 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-007 | FMT-007 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-008 | FMT-008 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-009 | FMT-009 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-010 | FMT-010 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-011 | FMT-011 | `warning` | 0/5/0/0 | - |  |
| FMT-012 | FMT-012 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-013 | FMT-013 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-014 | FMT-014 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-015 | FMT-015 | `warning` | 0/5/0/0 | - |  |
| FMT-016 | FMT-016 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-017 | FMT-017 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-018 | FMT-018 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-019 | FMT-019 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |

> **ND = not_detectable**: OOXML structure does not permit reliable verification of this requirement.
> Visual/PDF rendering pipeline would be needed for pixel-perfect fidelity verification.

## Cutover Recommendation

**Conditional** — Automated hard gates pass but semantic warnings and human Word review remain.

### Cutover Gate Checklist

- [x] At least 5 shadow scenarios ran (actual: 5)
- [x] No semantic failures (actual: 0)
- [x] No unresolved placeholders (actual: 0)
- [x] No undefined/null literals (actual: 0)
- [x] No hard format failures (actual: 0)
- [x] Full DOCX package integrity passed (failures: 0)
- [x] Evidence produced by shared full-package renderer
- [x] Different First Page (FMT-017) confirmed or explicitly blocked
- [ ] Human reviewer has inspected at least one rendered BM-001 DOCX
- [ ] Legal correctness is not claimed unless human-reviewed
- [x] Sample fixture data cannot persist into production path (guarded by test fixture isolation)

## Product Requirements Traceability

| Requirement | Area | Status | Evidence |
|---|---|---|---|
| FMT-001 Times New Roman | DOCX | pass | format-audit |
| FMT-002 Agency header | DOCX | pass | format-audit |
| FMT-003 KHU VỰC 7 bold | DOCX | pass | format-audit |
| FMT-005 Legal basis size 8 | DOCX | pass | format-audit |
| FMT-006 Quốc hiệu size 13 | DOCX | pass | format-audit |
| FMT-007 Motto size 14 | DOCX | pass | format-audit |
| FMT-009 Issue date italic 14 | DOCX | pass | format-audit |
| FMT-011 Body titles bold 14 | DOCX | warning | format-audit |
| FMT-012 Điều bold | DOCX | not_detectable | format-audit |
| FMT-013 Nơi nhận bold italic 12 | DOCX | not_detectable | format-audit |
| FMT-014 Footer lines size 11 | DOCX | not_detectable | format-audit |
| FMT-015 Signature title bold 14 | DOCX | warning | format-audit |
| FMT-016 Page number | DOCX | pass | format-audit |
| FMT-017 Different First Page | DOCX | pass | format-audit |
| API-001 Sample data safety | API | partial | fixture isolation |
| WEB-001–006 Form fields/date/stages | WEB | pending | - |
| RPT-001–005 Reporting | RPT | pending | - |

## Notes

- `not_detectable` status is counted separately from pass/fail and does not block cutover.
- Format checks marked `warning` reflect proximity-based checks that cannot confirm exact font sizes.
- Visual fidelity (underline width, exact pt sizes) requires PDF rendering pipeline.
- Scenarios use only synthetic data in `test/fixtures/rendering/bm001-shadow-scenarios/`.
- Shadow output writes to `storage/generated/shadow-renders/BM-001/` only.
- Each manifest records source, normalized template, locked contract, and rendered DOCX SHA-256 hashes.
- API-001 (sample data non-interference) is guarded by test fixture isolation, full implementation pending D.3.
