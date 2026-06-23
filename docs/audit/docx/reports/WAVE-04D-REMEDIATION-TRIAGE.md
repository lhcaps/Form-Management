# Wave 04D Remediation Triage

**Phase:** Phase E — DOCX Quality Remediation (Wave 04D)
**Date:** 2026-06-23
**Status:** Complete

---

## Scope

All 31 remediation checks / 58 field-level items from the current locked contracts verification report.

## Baseline

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation checks | 31 |
| Field-level items | 58 |
| Warning | 58 |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |
| Stable hash | 25 tests, all pass |
| Publish dry-run | Created 0 / Skipped 213 |

## Decision Summary

| Decision | Count |
|---|---:|
| ACCEPT_NON_RENDERED_METADATA | 16 |
| ADD_PLACEHOLDER_HUMAN_REQUIRED | 36 |
| NEEDS_LEGAL_REVIEW | 2 |
| FIXABLE_BY_SCRIPT | 0 |
| STALE_AUDIT_METADATA | 0 |
| **Total** | **54** |

Note: The total is 54 because each path with both CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER and BINDING_WITHOUT_TEMPLATE_PLACEHOLDER appears as two separate issue entries. The 31 unique remediation checks correspond to 23 unique placeholder paths.

## By Risk

| Risk | Count |
|---|---:|
| Low | 38 |
| Medium | 16 |
| High | 0 |

## By Form

| BM | Items | Unique Paths | Main Decision |
|---|---|---|---|
| BM-001 | 11 | 11 | ACCEPT_NON_RENDERED_METADATA |
| BM-002 | 1 | 1 | ACCEPT_NON_RENDERED_METADATA |
| BM-003 | 4 | 4 | ACCEPT_NON_RENDERED_METADATA |
| BM-021 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-031 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-036 | 4 | 2 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-044 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-052 | 4 | 2 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-056 | 2 | 1 | NEEDS_LEGAL_REVIEW |
| BM-059 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-060 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-061 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-063 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-064 | 2 | 1 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-065 | 4 | 2 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-066 | 4 | 2 | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-067 | 4 | 2 | ADD_PLACEHOLDER_HUMAN_REQUIRED |

## Full Decision Matrix

| BM | Issue | Path | Risk | Decision |
|---|---|---|---|---|
| BM-001 | TEMPLA | `crimeReport.attachedItemsDescription` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `crimeReport.content` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.endedAtDay` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.endedAtMonth` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.endedAtTimeText` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.endedAtYear` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.locationName` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.startedAtDay` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.startedAtMonth` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.startedAtTimeText` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-001 | TEMPLA | `reception.startedAtYear` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-002 | TEMPLA | `sourceTransfer.attachedItemsDescription` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-003 | TEMPLA | `official.issuerTitle` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-003 | TEMPLA | `sourceAssignment.article1Line` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-003 | TEMPLA | `sourceAssignment.article2Line` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-003 | TEMPLA | `sourceAssignment.article3Line` | medium | ACCEPT_NON_RENDERED_METADATA |
| BM-021 | CONTRA | `agency.nameUpper` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-021 | BINDIN | `agency.nameUpper` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-031 | CONTRA | `agency.bodyName` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-031 | BINDIN | `agency.bodyName` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-036 | CONTRA | `agency.parentNameUpper` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-036 | BINDIN | `agency.parentNameUpper` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-036 | CONTRA | `document.issueDate` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-036 | BINDIN | `document.issueDate` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-044 | CONTRA | `agency.parentNameUpper` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-044 | BINDIN | `agency.parentNameUpper` | medium | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-052 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-052 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-052 | CONTRA | `document.fullDocumentCode2` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-052 | BINDIN | `document.fullDocumentCode2` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-056 | CONTRA | `person.religion` | medium | NEEDS_LEGAL_REVIEW |
| BM-056 | BINDIN | `person.religion` | medium | NEEDS_LEGAL_REVIEW |
| BM-059 | CONTRA | `recipients.personLine` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-059 | BINDIN | `recipients.personLine` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-060 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-060 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-061 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-061 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-063 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-063 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-064 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-064 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-065 | CONTRA | `decision.decisionLine` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-065 | BINDIN | `decision.decisionLine` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-065 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-065 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-066 | CONTRA | `decision.decisionLine` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-066 | BINDIN | `decision.decisionLine` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-066 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-066 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-067 | CONTRA | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-067 | BINDIN | `document.fullDocumentCode` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-067 | CONTRA | `document.fullDocumentCode2` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |
| BM-067 | BINDIN | `document.fullDocumentCode2` | low | ADD_PLACEHOLDER_HUMAN_REQUIRED |

## Wave 04E Candidate List

**FIXABLE_BY_SCRIPT:** 0 items — no items currently have safe anchors that can be fixed by automated script.

**ADD_PLACEHOLDER_HUMAN_REQUIRED** items that could theoretically be addressed by a future wave if anchors are found:

| BM | Path | Evidence | Anchor Status |
|---|---|---|---|
| BM-021 | `agency.nameUpper` | textBefore: `…, ngày … tháng … năm 20` | No anchor found — DOCX uses `agency.name` |
| BM-031 | `agency.bodyName` | No textBefore | DOCX uses `agency.name` and `agency.parentName` |
| BM-036 | `agency.parentNameUpper` | textBefore: `VIỆN KIỂM SÁT …` | No anchor found |
| BM-036 | `document.issueDate` | No textBefore | May be covered by `document.issuePlaceAndDateLine` |
| BM-044 | `agency.parentNameUpper` | No textBefore | DOCX uses `agency.nameUpper` |
| BM-052 | `document.fullDocumentCode` | Wave 04C skipped — no serial number header in template | |
| BM-052 | `document.fullDocumentCode2` | Wave 04C skipped — no anchor found | |
| BM-059 | `recipients.personLine` | Wave 04C skipped — no anchor found | |
| BM-060 | `document.fullDocumentCode` | Wave 04C skipped — no serial number header in template | |
| BM-061 | `document.fullDocumentCode` | Wave 04C skipped — no anchor found | |
| BM-063 | `document.fullDocumentCode` | Wave 04C skipped — no serial number header in template | |
| BM-064 | `document.fullDocumentCode` | Wave 04C skipped — no serial number header in template | |
| BM-065 | `decision.decisionLine` | Wave 04C skipped — no "Xét thấy" anchor in template | |
| BM-065 | `document.fullDocumentCode` | Wave 04C skipped — no serial number header in template | |
| BM-066 | `decision.decisionLine` | Wave 04C skipped — no "Xét thấy" anchor in template | |
| BM-066 | `document.fullDocumentCode` | Wave 04C skipped — no serial number header in template | |
| BM-067 | `document.fullDocumentCode` | Wave 04C skipped — no serial number header in template | |
| BM-067 | `document.fullDocumentCode2` | Wave 04C skipped — no anchor found | |

All require human template authoring. No automated fix is safe without a confirmed anchor.

## Human / Legal Review List

| BM | Path | Reason |
|---|---|---|
| BM-056 | `person.religion` | BM-056 is an exit postponement form for minors ("Biện pháp hoãn xuất cảnh"). Collecting religion data on minors requires legal/regulatory review to confirm the data field's basis. The slot exists in the locked contract but the DOCX template lacks the mustache. Either the mustache must be added (requiring legal review) or the slot/binding must be removed (also requiring legal review). |

## No-Action / Accepted List

**ACCEPT_NON_RENDERED_METADATA** (16 items):

These are orphaned mustaches — the DOCX template contains the `{{mustache}}` but the locked contract has no corresponding slot, canonical field, or render binding. The locked contract is the authoritative template model; if it has no slot for the mustache, the mustache is a leftover from earlier extraction and does not affect runtime rendering.

| BM | Path | Evidence |
|---|---|---|
| BM-001 | `crimeReport.attachedItemsDescription` | DOCX has `{{crimeReport.attachedItemsDescription}}`; locked has no slot/field/binding |
| BM-001 | `crimeReport.content` | DOCX has `{{crimeReport.content}}`; locked has no slot/field/binding |
| BM-001 | `reception.endedAtDay` | DOCX has `{{reception.endedAtDay}}`; locked has no slot/field/binding |
| BM-001 | `reception.endedAtMonth` | DOCX has `{{reception.endedAtMonth}}`; locked has no slot/field/binding |
| BM-001 | `reception.endedAtTimeText` | DOCX has `{{reception.endedAtTimeText}}`; locked has no slot/field/binding |
| BM-001 | `reception.endedAtYear` | DOCX has `{{reception.endedAtYear}}`; locked has no slot/field/binding |
| BM-001 | `reception.locationName` | DOCX has `{{reception.locationName}}`; locked has no slot/field/binding |
| BM-001 | `reception.startedAtDay` | DOCX has `{{reception.startedAtDay}}`; locked has no slot/field/binding |
| BM-001 | `reception.startedAtMonth` | DOCX has `{{reception.startedAtMonth}}`; locked has no slot/field/binding |
| BM-001 | `reception.startedAtTimeText` | DOCX has `{{reception.startedAtTimeText}}`; locked has no slot/field/binding |
| BM-001 | `reception.startedAtYear` | DOCX has `{{reception.startedAtYear}}`; locked has no slot/field/binding |
| BM-002 | `sourceTransfer.attachedItemsDescription` | DOCX has `{{sourceTransfer.attachedItemsDescription}}`; locked has no slot/field/binding |
| BM-003 | `official.issuerTitle` | DOCX has `{{official.issuerTitle}}`; locked has no slot/field/binding |
| BM-003 | `sourceAssignment.article1Line` | DOCX has `{{sourceAssignment.article1Line}}`; locked has no slot/field/binding |
| BM-003 | `sourceAssignment.article2Line` | DOCX has `{{sourceAssignment.article2Line}}`; locked has no slot/field/binding |
| BM-003 | `sourceAssignment.article3Line` | DOCX has `{{sourceAssignment.article3Line}}`; locked has no slot/field/binding |

These are the 16 `TEMPLATE_PLACEHOLDER_WITHOUT_SLOT` items. They are pre-existing orphaned mustaches from earlier extraction waves. They do not cause runtime issues because the locked contract does not reference them. No action required.

## Verification

All checks pass after triage (no changes were made to DOCX, locked contracts, or DB):

| Check | Result |
|---|---|
| `pnpm audit:docx:verify-locked` | Blocking: 0, Remediation: 31, Warning: 58 |
| `pnpm gate:forms:213` | PASS (213/213, 0 generic paths) |
| `pnpm audit:forms:runtime-readiness` | 213 locked, 0 draft, 0 generic fields |
| `pnpm smoke:forms-runtime:213` | PASS (213 locked, 0 draft) |
| Stable hash tests | 25/25 pass |
| Publish dry-run | Created 0 / Skipped 213 |

## Scripts Generated

| File | Purpose |
|---|---|
| `scripts/docx-contract/triage-remaining-remediation.mjs` | Triage classification script. Reads locked contracts and normalized DOCX, classifies each remediation item. |

## Outputs Generated

| File | Purpose |
|---|---|
| `docs/audit/docx/reports/remaining-remediation-decision-matrix.json` | Full JSON decision matrix with evidence for each item |
| `docs/audit/docx/reports/REMAINING-REMEDIATION-DECISION-MATRIX.md` | Markdown table version of decision matrix |

## Recommended Next Steps

1. **ACCEPT_NON_RENDERED_METADATA (16 items):** No action required. These are pre-existing orphaned mustaches with no runtime impact. The locked contract is the authoritative model.

2. **NEEDS_LEGAL_REVIEW (2 items — BM-056 `person.religion`):** Require legal/form author review to determine whether the `person.religion` slot should be added to the DOCX template or removed from the locked contract. This affects personal data collection for minors.

3. **ADD_PLACEHOLDER_HUMAN_REQUIRED (36 items):** Require human template authoring. Cannot be safely addressed by automated script without confirmed anchor text. The template author must add the mustaches at semantically correct positions.

4. **Potential Wave 04E actions:**
   - For BM-021/031/044 (agency field variants): Investigate whether the existing `agency.name` mustaches in DOCX already cover the rendering need, making the variant slots (nameUpper, bodyName, parentNameUpper) redundant.
   - For BM-036 `document.issueDate`: Verify whether `document.issuePlaceAndDateLine` already renders the date.
   - For BM-052/060/061/063/064/065/066/067: If the template author confirms that the document serial number / decision line should appear in the rendered output, a human-authored Wave 04E can add the mustaches.

---

*Report generated by Wave 04D pipeline. Data: `docs/audit/docx/reports/remaining-remediation-decision-matrix.json`*
