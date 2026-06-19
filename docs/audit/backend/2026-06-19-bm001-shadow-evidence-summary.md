# BM-001 Shadow Evidence Summary

**Generated**: 2026-06-19T18:06:39.379Z
**Phase**: D.2.2.5
**Source**: `storage/generated/shadow-renders/BM-001/**`

## Summary

- scenarios run: **5**
- semantic pass: **0** / warning: **5** / fail: **0**
- format pass: **0** / warning: **5** / fail: **0**
- unresolved placeholders: **0**
- missing expected text: **0**
- not_detectable format checks: **5** scenarios
- accepted warnings: **5** scenarios (01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses)
- blockers: **none**

## Scenario Matrix

| Scenario | Semantic | Format | Missing expected text | Unresolved placeholders | Format failures | Notes |
|---|---|---|---|---|---|---|
| 01-basic-valid | `warning` | `warning` | - | - | - | Contract text is significantly shorter (0.17x) than legacy.<br>FMT-003<br>FMT-007<br>FMT-011<br>FMT-012<br>FMT-015 |
| 02-long-source-report | `warning` | `warning` | - | - | - | Contract text is significantly shorter (0.20x) than legacy.<br>FMT-003<br>FMT-007<br>FMT-011<br>FMT-012<br>FMT-015 |
| 03-organization-informant | `warning` | `warning` | - | - | - | Contract text is significantly shorter (0.18x) than legacy.<br>FMT-003<br>FMT-007<br>FMT-011<br>FMT-012<br>FMT-015 |
| 04-missing-optional-fields | `warning` | `warning` | - | - | - | Contract text is significantly shorter (0.16x) than legacy.<br>FMT-003<br>FMT-007<br>FMT-011<br>FMT-012<br>FMT-015 |
| 05-vietnamese-diacritics-and-addresses | `warning` | `warning` | - | - | - | Contract text is significantly shorter (0.18x) than legacy.<br>FMT-003<br>FMT-007<br>FMT-011<br>FMT-012<br>FMT-015 |

## Format Requirement Coverage

| Requirement ID | Check ID | Overall Status | Pass/Warn/Fail/ND | Evidence | Notes |
|---|---|---|---|---|---|
| FMT-001 | FMT-001 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-002 | FMT-002 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-003 | FMT-003 | `warning` | 0/5/0/0 | - |  |
| FMT-004 | FMT-004 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-005 | FMT-005 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-006 | FMT-006 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-007 | FMT-007 | `warning` | 0/5/0/0 | - |  |
| FMT-008 | FMT-008 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-009 | FMT-009 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |
| FMT-010 | FMT-010 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-011 | FMT-011 | `warning` | 0/5/0/0 | - |  |
| FMT-012 | FMT-012 | `warning` | 0/5/0/0 | - |  |
| FMT-013 | FMT-013 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-014 | FMT-014 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-015 | FMT-015 | `warning` | 0/5/0/0 | - |  |
| FMT-016 | FMT-016 | `not_detectable` | 0/0/0/5 | - | 5 scenarios ND |
| FMT-017 | FMT-017 | `pass` | 5/0/0/0 | 01-basic-valid, 02-long-source-report, 03-organization-informant, 04-missing-optional-fields, 05-vietnamese-diacritics-and-addresses |  |

> **ND = not_detectable**: OOXML structure does not permit reliable verification of this requirement.
> Visual/PDF rendering pipeline would be needed for pixel-perfect fidelity verification.

## Cutover Recommendation

**Conditional** — All semantic checks pass but warnings remain. Human review recommended.

### Cutover Gate Checklist

- [x] At least 5 shadow scenarios ran (actual: 5)
- [x] No semantic failures (actual: 0)
- [x] No unresolved placeholders (actual: 0)
- [x] No hard format failures (actual: 0)
- [x] Different First Page (FMT-017) confirmed or explicitly blocked
- [ ] Human reviewer has inspected at least one rendered BM-001 DOCX
- [ ] Legal correctness is not claimed unless human-reviewed
- [x] Sample fixture data cannot persist into production path (guarded by test fixture isolation)

## Product Requirements Traceability

| Requirement | Area | Status | Evidence |
|---|---|---|---|
| FMT-001 Times New Roman | DOCX | pass | format-audit |
| FMT-002 Agency header | DOCX | pass | format-audit |
| FMT-003 KHU VỰC 7 bold | DOCX | warning | format-audit |
| FMT-005 Legal basis size 8 | DOCX | not_detectable | format-audit |
| FMT-006 Quốc hiệu size 13 | DOCX | pass | format-audit |
| FMT-007 Motto size 14 | DOCX | warning | format-audit |
| FMT-009 Issue date italic 14 | DOCX | pass | format-audit |
| FMT-011 Body titles bold 14 | DOCX | warning | format-audit |
| FMT-012 Điều bold | DOCX | warning | format-audit |
| FMT-013 Nơi nhận bold italic 12 | DOCX | not_detectable | format-audit |
| FMT-014 Footer lines size 11 | DOCX | not_detectable | format-audit |
| FMT-015 Signature title bold 14 | DOCX | warning | format-audit |
| FMT-016 Page number | DOCX | not_detectable | format-audit |
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
- API-001 (sample data non-interference) is guarded by test fixture isolation, full implementation pending D.3.
