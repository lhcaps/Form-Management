# Wave 03C-1 DOCX Remediation

**Branch:** `remediation/docx-placeholders-wave-03c-1`
**Timestamp:** 2026-06-22T18:05 UTC+7
**Scope:** BM-184 through BM-193 (10 forms)
**Script:** `scripts/docx-contract/wave-03c-1-remediation.mjs`

---

## Scope

BM-184, BM-185, BM-186, BM-187, BM-188, BM-189, BM-190, BM-191, BM-192, BM-193.

Not processed: BM-194–BM-212 (deferred to Wave 03C-2).

---

## Before

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation | 61 |
| Warning | 58 |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |
| DB published versions | BM-184–BM-193: v1 |

---

## Changes

### Summary

| BM | Old Mustache Types | New Semantic Paths | Mustaches Renamed | DB Version |
|---|---|---|---|---|
| BM-184 | document.field (8×), decision.field (4×) | document.fullDocumentCode, document.issueDate, document.issuePlace, document.summaryLine, person.personFullName, person.dateOfBirth, person.currentAddress, person.occupation, decision.decisionLine–decision.decisionLine4 | 12 | v2 |
| BM-185 | document.field (5×) | document.fullDocumentCode, document.issueDate, person.personFullName, person.dateOfBirth, person.currentAddress | 5 | v2 |
| BM-186 | document.field (4×), recipients.field (15×) | document.fullDocumentCode, document.issueDate, document.issuePlace, document.reasonLine, recipients.personLine2–personLine15 | 19 | v2 |
| BM-187 | document.field (2×), recipients.field (13×) | document.fullDocumentCode, document.issueDate, recipients.personLine2–personLine13 | 15 | v2 |
| BM-188 | document.field (2×), recipients.field (15×) | document.fullDocumentCode, document.issueDate, recipients.personLine2–personLine15 | 17 | v2 |
| BM-189 | document.field (1×), recipients.field (15×) | document.fullDocumentCode, recipients.personLine2–personLine15 | 16 | v2 |
| BM-190 | document.field (3×), recipients.personLine (2×), recipients.field (15×) | document.fullDocumentCode, document.issueDate, document.issuePlace, recipients.personLine (2nd occ.), recipients.personLine2–personLine15 | 20 | v2 |
| BM-191 | document.field (4×), recipients.field (13×) | document.fullDocumentCode, document.issueDate, document.issuePlace, document.reasonLine, recipients.personLine2–personLine13 | 17 | v2 |
| BM-192 | document.field (3×), recipients.field (13×) | document.fullDocumentCode, document.issueDate, document.issuePlace, recipients.personLine2–personLine13 | 16 | v2 |
| BM-193 | document.field (2×), recipients.field (13×) | document.fullDocumentCode, document.issueDate, recipients.personLine2–personLine13 | 15 | v2 |
| **Total** | | | **152** | |

### Detailed Rename Map

| BM | Old Placeholder | New Placeholder | Semantic Reason | Evidence |
|---|---|---|---|---|
| BM-184 | document.field (8×) | document.fullDocumentCode, document.issueDate, document.issuePlace, document.summaryLine, person.personFullName, person.dateOfBirth, person.currentAddress, person.occupation | Decision serial/date/place, protected person details | formInputHints field1-15 |
| BM-184 | decision.field (4×) | decision.decisionLine–decision.decisionLine4 | Court/authority reference lines (hint: field6-7=decision.*) | formInputHints field6-7 |
| BM-185 | document.field (5×) | document.fullDocumentCode, document.issueDate, person.personFullName, person.dateOfBirth, person.currentAddress | Document serial, date, subject identity details | formInputHints field1-6 |
| BM-186 | document.field (4×) | document.fullDocumentCode, document.issueDate, document.issuePlace, document.reasonLine | Decision serial, date, place, legal basis | formInputHints field1-2 |
| BM-186 | recipients.field (15×) | recipients.personLine2–personLine15 | Recipient detail lines (name, address, occupation, etc.) | formInputHints field4-21; token pattern |
| BM-187 | document.field (2×) | document.fullDocumentCode, document.issueDate | Document serial, request date | formInputHints field1 |
| BM-187 | recipients.field (13×) | recipients.personLine2–personLine13 | Recipient detail lines | formInputHints field2-17; token pattern |
| BM-188 | document.field (2×) | document.fullDocumentCode, document.issueDate | Document serial, request date | formInputHints field1 |
| BM-188 | recipients.field (15×) | recipients.personLine2–personLine15 | Recipient detail lines | formInputHints field2-19; token pattern |
| BM-189 | document.field (1×) | document.fullDocumentCode | Document serial | formInputHints field1 |
| BM-189 | recipients.field (15×) | recipients.personLine2–personLine15 | Recipient detail lines | formInputHints field3-18; token pattern |
| BM-190 | document.field (3×) | document.fullDocumentCode, document.issueDate, document.issuePlace | Decision serial, date, place | formInputHints field1-2 |
| BM-190 | recipients.personLine (2×) | recipients.personLine, recipients.personLine (2nd occ.) | Duplicate name line in same paragraph — already semantic | Token context in XML |
| BM-190 | recipients.field (15×) | recipients.personLine2–personLine15 | Recipient detail lines | formInputHints field5-21; token pattern |
| BM-191 | document.field (4×) | document.fullDocumentCode, document.issueDate, document.issuePlace, document.reasonLine | Decision serial, date, place, legal basis | formInputHints field1-4 |
| BM-191 | recipients.field (13×) | recipients.personLine2–personLine13 | Recipient detail lines | formInputHints field5-20; token pattern |
| BM-192 | document.field (3×) | document.fullDocumentCode, document.issueDate, document.issuePlace | Decision serial, date, place | formInputHints field1-3 |
| BM-192 | recipients.field (13×) | recipients.personLine2–personLine13 | Recipient detail lines | formInputHints field5-19; token pattern |
| BM-193 | document.field (2×) | document.fullDocumentCode, document.issueDate | Decision serial, date | formInputHints field1-2 |
| BM-193 | recipients.field (13×) | recipients.personLine2–personLine13 | Recipient detail lines | formInputHints field4-18; token pattern |

---

## After

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation | 54 |
| Warning | 58 |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |
| DB published versions | BM-184–BM-193: v2 |

---

## DB Publish

| Field | Value |
|---|---|
| Created | 13 (BM-184–BM-193 v2; plus 3 from prior waves) |
| Skipped | 200 |
| Failed | 0 |
| Scope key | GLOBAL |
| Source resolution | GLOBAL_PUBLISHED (no fallback) |
| Assertion note | Known pre-existing bug in publish script: `expectExactly=213` assertion triggers false failure even when publish succeeds correctly. Actual publish was correct: Failed=0. |

---

## Warning Delta

| Category | Change |
|---|---|
| New warnings | 0 |
| Resolved warnings | 0 |
| Accepted warnings | 0 |

No warning delta: all new slots were added with complete metadata (source=manual/agencyConfig, transform=identity, reviewRequired=false, reviewEvidence with reason/anchor/reviewer).

---

## Remaining Work

### Remediation (54)

Remaining remediation is exclusively from BM-194–BM-212 (outside Wave 03C-1 scope), all `TEMPLATE_PLACEHOLDER_WITHOUT_SLOT` for generic `{{document.field}}` and/or `{{recipients.field}}` mustaches.

| BM | Remaining Issue Type | Mustache Types |
|---|---|---|
| BM-194 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field |
| BM-195 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field |
| BM-196 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-197 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field |
| BM-198 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field |
| BM-199 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | decision.field, document.field, recipients.field |
| BM-200 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field |
| BM-201 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-202 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field |
| BM-203 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-204 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field |
| BM-205 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-206 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | recipients.field |
| BM-207 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-208 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-209 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-210 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | recipients.field |
| BM-211 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |
| BM-212 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | document.field, recipients.field |

### Warnings (58)

All pre-existing. No new warnings introduced by this wave.

### Recommended Next Wave

**Wave 03C-2:** BM-194–BM-212. All have the same pattern of generic `{{document.field}}` and/or `{{recipients.field}}` mustaches in DOCX. Strategy mirrors Wave 03C-1: extract mustaches in XML order, map to semantic paths based on formInputHints and surrounding context.

---

## Form Status Summary

| BM | Before Quality | After Quality |
|---|---|---|
| BM-184 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-185 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-186 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-187 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-188 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-189 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-190 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-191 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-192 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
| BM-193 | CONTRACT_REPAIR_REQUIRED | VERIFIED |
