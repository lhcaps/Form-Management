# Wave 03A DOCX Remediation

## Scope
BM-164, BM-165, BM-174, BM-175, BM-176, BM-177, BM-178, BM-179, BM-180, BM-181, BM-182, BM-183

Note: BM-139 excluded (Wave 03B — legacy mustaches).

## Baseline (2026-06-22T16:52:00Z)

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation | 74 |
| Warning | 58 |
| Gate | PASS |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |

## DB State (before Wave 03A)
- Wave 01 v2: BM-051, BM-052, BM-060–BM-067 (10 forms, version 2)
- Wave 02 v2: BM-068, BM-069, BM-073, BM-075, BM-077, BM-080, BM-082, BM-162, BM-163 (9 forms, version 2)
- All others: version 1
- Scope key: GLOBAL

## Changes

| BM | Old Placeholder | New Placeholder | Evidence | DB Version |
|---|---|---|---|---|
| BM-164 | `{{document.field}}` | `{{document.fullDocumentCode}}` | Document serial in header | v2 |
| BM-164 | `{{recipients.field}}` (5×) | `{{recipients.personLine2..6}}` | Recipient rows 2–6 in handover table | v2 |
| BM-165 | `{{document.field}}` | `{{document.fullDocumentCode}}` | Document serial in header | v2 |
| BM-174 | `{{document.field}}` (10×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}`, `{{document.issuePlace}}`, `{{document.contentLine}}`, `{{person.personFullName}}`, `{{person.dateOfBirth}}`, `{{person.currentAddress}}`, `{{person.occupation}}`, `{{person.idNumber}}`, `{{document.summaryLine}}` | Ordered by formInputHints; field10=person.* | v2 |
| BM-175 | `{{document.field}}` (2×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}` | Decision serial and date | v2 |
| BM-176 | `{{document.field}}` (6×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}`, `{{decision.decisionLine}}`, `{{document.contentLine}}`, `{{document.reasonLine}}`, `{{document.summaryLine}}` | Decision serial, date, authority, content, reasoning, summary | v2 |
| BM-177 | `{{document.field}}` | `{{document.fullDocumentCode}}` | Decision serial number | v2 |
| BM-178 | `{{document.field}}` (3×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}`, `{{document.issuePlace}}` | Serial, date, and place of original decision | v2 |
| BM-179 | `{{document.field}}` (8×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}`, `{{document.issuePlace}}`, `{{document.contentLine}}`, `{{document.reasonLine}}`, `{{person.personFullName}}`, `{{person.dateOfBirth}}`, `{{document.summaryLine}}` | Treatment decision serial, date, place, content, reason, subject name/DOB, summary | v2 |
| BM-180 | `{{document.field}}` (9×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}`, `{{agency.agencyReferenceLine}}`, `{{document.issuePlace}}`, `{{document.reasonLine}}`, `{{document.reasonLine2}}`, `{{document.contentLine}}`, `{{person.personFullName}}`, `{{document.summaryLine}}` | Decision serial, date, agency ref, place, reason(s), content, subject name, summary | v2 |
| BM-181 | `{{document.field}}` (2×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}` | Decision serial and date | v2 |
| BM-182 | `{{document.field}}` (2×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}` | Decision serial and date of revoked decision | v2 |
| BM-183 | `{{document.field}}` (8×) | `{{document.fullDocumentCode}}`, `{{document.issueDate}}`, `{{legalBasis.legalBasisLine}}`, `{{legalBasis.legalBasisLine2}}`, `{{document.contentLine}}`, `{{legalBasis.statuteReference}}`, `{{person.personFullName}}`, `{{person.dateOfBirth}}` | Prosecution decision serial, date, legal basis lines, statute ref, content, defendant name/DOB | v2 |

**Total mustache renames: 60 occurrences across 12 forms**

## After

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation | 62 |
| Warning | 58 |
| Gate | PASS |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |

## DB Publish

- Created: 12 (BM-164, BM-165, BM-174–BM-183)
- Skipped: 201 (already published with same hash or previous version)
- Failed: 0
- Scope key: GLOBAL
- Source resolution: GLOBAL_PUBLISHED

## Warnings

- New warnings: 0
- Resolved warnings: 0
- Accepted warnings: 0 (no new warnings introduced)

## Issues Encountered

1. **BM-180 / BM-183 — Generic path blocking after initial remediation**
   - `wave-03a-remediation.mjs` initially mapped field3→`agency.field3` (BM-180) and field6→`legalBasis.field6` (BM-183)
   - These still matched `GENERIC_PATH_RE` (`(^|\.)field(?:\d+)?(?:_|$)`)
   - Fixed inline: renamed `agency.field3`→`agency.agencyReferenceLine`, `legalBasis.field6`→`legalBasis.statuteReference`
   - Also fixed DOCX hash sync after second write

## Remaining Work

| Remaining metric | Count | Notes |
|---|---|---|
| Remediation | 62 | Includes: BM-139 legacy placeholders, CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER for Wave 01/02 semantic fields, and ~30 other forms with document.field/recipients.field |
| Warning | 58 | REVIEW_REQUIRED_REMAINS on newly added semantic slots |

## Recommended Wave 03B

- BM-139 (legacy `agency.dongDia`, `document.chuThe`, `document.ngayBan` — unique legacy pattern)
- Remaining `{{document.field}}` / `{{recipients.field}}` in forms not in Wave 03A (BM-184–BM-212)
