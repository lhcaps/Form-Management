# Wave 04C Add Missing Placeholders

**Phase:** Phase E — DOCX Quality Remediation (Wave 04C)
**Date:** 2026-06-23
**Status:** Complete

---

## Scope

BM-051, BM-052, BM-060–BM-067

## Before

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation checks | 35 |
| Field-level items | 62 |
| Warning | 58 |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |
| Stable hash tests | 21 tests, all pass |
| Publish dry-run | Would create: 213, Would skip: 0 |

## Root Cause

`CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER` and `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER` mean the locked contract has a slot/binding but the DOCX template lacks the corresponding `{{mustache}}`. These cannot be fixed by metadata manipulation — they require actual DOCX template edits to add the missing placeholders.

## Missing Placeholder Inventory

Source: `remaining-remediation-inventory.json` filtered for scoped BMs with `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER` / `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`.

| BM | Placeholder | Issue Codes | Risk | Decision |
|---|---|---|---|---|
| BM-051 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-052 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-052 | `document.fullDocumentCode2` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-060 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-061 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-062 | `decision.decisionLine` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-062 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-063 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |
| BM-063 | `document.issuePlaceAndDateLine` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | add placeholder |
| BM-064 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |
| BM-065 | `decision.decisionLine` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |
| BM-065 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |
| BM-066 | `decision.decisionLine` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |
| BM-066 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |
| BM-067 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |
| BM-067 | `document.fullDocumentCode2` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | low | skip — no anchor found |

## Additions (4 placeholders added)

All additions used text-level XML replacement on the OOXML `word/document.xml` content. Approach follows the Wave 01/03 series pattern: insert mustache immediately after anchor text in the XML string.

| BM | Placeholder | Anchor | Reason |
|---|---|---|---|
| BM-051 | `{{document.fullDocumentCode}}` | `Số: …/QĐ-VKS…-` | Document serial number in header — replaces generic Số placeholder |
| BM-062 | `{{decision.decisionLine}}` | `Xét thấy` | Decision provision text after "Xét thấy" |
| BM-062 | `{{document.fullDocumentCode}}` | `Số: …/LKB-VKS…-` | Document serial number in header — replaces generic Số placeholder |
| BM-063 | `{{document.issuePlaceAndDateLine}}` | `ngày … tháng … năm …` | Issue place and date line — date pattern in document body |

Each addition also updated `extractionSource.sha256` in the corresponding locked contract to maintain EXTRACTION_HASH_MISMATCH correctness.

## Skipped Items (16 placeholders not added)

These slots exist in locked contracts but have no clear anchor text in the current DOCX templates. No anchor means no safe insertion point — appending to end of file would create meaningless DOM placement. Skipped with documentation.

| BM | Placeholder | Reason |
|---|---|---|
| BM-052 | `document.fullDocumentCode` | No document serial number header in template (no `Số: …/…-` pattern) |
| BM-052 | `document.fullDocumentCode2` | No anchor found in template |
| BM-060 | `document.fullDocumentCode` | No document serial number header in template |
| BM-061 | `document.fullDocumentCode` | No anchor found in template |
| BM-063 | `document.fullDocumentCode` | No document serial number header in template |
| BM-064 | `document.fullDocumentCode` | No document serial number header in template |
| BM-065 | `decision.decisionLine` | No "Xét thấy" anchor in template |
| BM-065 | `document.fullDocumentCode` | No document serial number header in template |
| BM-066 | `decision.decisionLine` | No "Xét thấy" anchor in template |
| BM-066 | `document.fullDocumentCode` | No document serial number header in template |
| BM-067 | `document.fullDocumentCode` | No document serial number header in template |
| BM-067 | `document.fullDocumentCode2` | No anchor found in template |

Note: The locked contracts for these BMs have generic slot entries (`document.fullDocumentCode` as a base name, without numbered variants like `fullDocumentCode8`). The DOCX templates don't have the numbered variant either. This suggests the slot was added incorrectly during an earlier remediation pass — the semantic numbering should match the template, but the template lacks both the base and numbered forms.

## Script

**File:** `scripts/docx-contract/wave-04c-add-missing-placeholders.mjs`

Uses `PizZip` to load the DOCX, `zip.file("word/document.xml", updatedXml)` to modify the XML, and `zip.generate()` to produce the output buffer. Updates `extractionSource.sha256` in locked contracts for forms with additions.

## Stable Hash Tests Added

Added 4 new test cases to `test/docx-contract/stable-contract-hash.test.mjs` to cover the `evidence` / `reviewEvidence` exclusion and `renderBindings.transform` semantics:

| Test | Description |
|---|---|
| `changing evidence only does not change hash` | Verify evidence fields (textBefore, textAfter, rawPattern, blockId) are in VOLATILE_FIELDS |
| `changing reviewEvidence only does not change hash` | Verify reviewEvidence fields are in VOLATILE_FIELDS |
| `changing renderBindings.transform produces different hash` | Verify transform is semantic (not excluded) |
| `adding evidence to a slot that has none does not change hash` | Verify evidence presence is not a semantic change |

All 25 tests pass.

## After

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation checks | 31 (was 35) |
| Field-level items | 58 (was 62) |
| Warning | 58 |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |
| Stable hash tests | 25 tests, all pass |
| Gate | PASS |

## Warning Delta

No new warnings introduced.

## DB Versions

- v1: Published in Wave 04A
- v2: Published in Wave 04B (after adding evidence to VOLATILE_FIELDS)
- v3: Published in Wave 04C (3 forms: BM-051, BM-062, BM-063 — where DOCX changed)
- v4: Idempotency verification (Created: 0, Skipped: 213)

| Publish run | Created | Skipped | Failed |
|---|---|---|---|
| Wave 04A | 213 | 0 | 0 |
| Wave 04B | 213 | 0 | 0 |
| Wave 04C | 3 | 210 | 0 |
| Idempotency check | 0 | 213 | 0 |

The 3 forms created in Wave 04C are BM-051, BM-062, BM-063 — exactly the scoped BMs where DOCX placeholders were added. The 210 skipped forms are all other BMs whose hashes didn't change.

## Verification

| Check | Result |
|---|---|
| `pnpm audit:docx:verify-locked` | Blocking: 0, Remediation: 31, Warning: 58 |
| `pnpm gate:forms:213` | PASS (213/213, 0 generic paths) |
| `pnpm audit:forms:runtime-readiness` | 213 locked, 0 draft, 0 generic fields |
| `pnpm smoke:forms-runtime:213` | PASS (213 locked, 0 draft) |
| Stable hash tests | 25/25 pass |

## Remaining Work

- **Remediation checks: 31** (down from 35)
- **Field-level items: 58** (down from 62)
- **Remaining scoped BM items**: 16 slots in scoped BMs that were skipped — no anchor in template. These may need human review to determine if the slot itself should be removed from the locked contract (if the field is not actually needed in the template), or if the template needs structural changes to accommodate the field.
- **Recommended next wave**: Wave 04D — investigate the 16 skipped slots. For slots where the template genuinely lacks the field (BM-052, BM-060, BM-061, BM-064, BM-065, BM-066, BM-067), assess whether the slot should be removed from the locked contract or if the template requires human authoring.

---

*Report generated by Wave 04C pipeline. Audit data: `docs/audit/docx/reports/wave-04c-added-placeholders.json`*
