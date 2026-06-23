# Wave 04B Low-Risk Rename Remediation

**Phase:** Phase E — DOCX Quality Remediation (Wave 04B)
**Date:** 2026-06-23
**Status:** Complete

---

## Problem

The scoped BMs (BM-051, BM-052, BM-060–BM-067) had stale `rawPattern` values in their locked contracts' `docxSlots[].evidence.rawPattern` fields. These referenced generic mustaches (`{{document.field1}}`, `{{document.field2}}`, etc.) from before Wave 01 DOCX remediation, while the actual `_normalized.docx` files already contained semantic mustaches (`{{agency.name}}`, `{{document.fullDocumentCode8}}`, etc.).

This caused the `evaluateFormArtifact` quality check to report `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER` false positives — the check compares slotIds against template mustaches, but the stale `rawPattern` evidence confused audit reporting.

## Root Cause Analysis

Investigation revealed:

1. **Locked contracts have correct slotId values** (e.g., `agency.name`, `document.fullDocumentCode8`), established by Wave 01 direct edits.
2. **But `evidence.rawPattern` was never updated** to reflect the DOCX changes — it still showed generic patterns.
3. **DOCX `_normalized.docx` files have semantic mustaches** that match the slotId values.
4. **`all-lock-mappings.json` is stale** — contains generic `document.field` keys instead of semantic slot keys for scoped BMs, but this doesn't affect current locked contracts since they were directly edited.
5. **The `evaluateFormArtifact` check** compares `slotIds` (from `docxSlots[].slotId`) against `templateSet` (from DOCX mustaches). The stale `rawPattern` is NOT used in this comparison — it's only audit metadata.

## Approach: Evidence Metadata Fix

The fix is surgical: update `evidence.rawPattern` and `reviewEvidence.rawPattern` in locked contracts for the unambiguous case — `agency.name` slots where `rawPattern={{document.field1}}` but the DOCX has `{{agency.name}}`.

This is the only rename with zero ambiguity: the slotId and DOCX mustache are identical (`agency.name`), and the stale `rawPattern` is clearly wrong.

The 20 remaining slots (semantic slotId with no matching DOCX mustache) require actual DOCX template editing — not a metadata fix.

## Changes

### 1. Locked Contract Evidence Fix (`wave-04b-fix-rawpatterns.mjs`)

**File:** `scripts/docx-contract/wave-04b-fix-rawpatterns.mjs`

Surgical fix: for each scoped BM, for each docxSlot with `slotId="agency.name"` and `rawPattern` containing `"field"`, update `evidence.rawPattern` and `reviewEvidence.rawPattern` to `{{agency.name}}`.

Fixed slots (10 total, 1 per BM):

| BM | Old rawPattern | New rawPattern | DOCX occurrences |
|---|---|---|---|
| BM-051 | `{{document.field1}}` | `{{agency.name}}` | x1 |
| BM-052 | `{{document.field1}}` | `{{agency.name}}` | x1 |
| BM-060 | `{{document.field1}}` | `{{agency.name}}` | x1 |
| BM-061 | `{{document.field1}}` | `{{agency.name}}` | x1 |
| BM-062 | `{{document.field1}}` | `{{agency.name}}` | x2 |
| BM-063 | `{{document.field1}}` | `{{agency.name}}` | x1 |
| BM-064 | `{{document.field1}}` | `{{agency.name}}` | x2 |
| BM-065 | `{{document.field1}}` | `{{agency.name}}` | x1 |
| BM-066 | `{{document.field1}}` | `{{agency.name}}` | x2 |
| BM-067 | `{{document.field1}}` | `{{agency.name}}` | x1 |

Not fixed (require DOCX template editing — future wave):

| BM | slotId | Stale rawPattern | Reason |
|---|---|---|---|
| BM-051 | `document.fullDocumentCode` | `{{document.field2}}` | No matching mustache in DOCX |
| BM-052 | `document.fullDocumentCode` | `{{decision.field2}}` | No matching mustache in DOCX |
| BM-052 | `document.fullDocumentCode2` | `{{document.field5}}` | No matching mustache in DOCX |
| BM-060 | `document.fullDocumentCode` | `{{document.field2}}` | No matching mustache in DOCX |
| BM-061 | `document.fullDocumentCode` | `{{document.field3}}` | No matching mustache in DOCX |
| BM-062 | `decision.decisionLine` | `{{document.field3}}` | No matching mustache in DOCX |
| BM-062 | `document.fullDocumentCode` | `{{document.field6}}` | No matching mustache in DOCX |
| BM-063 | `document.issuePlaceAndDateLine` | `{{document.field2}}` | No matching mustache in DOCX |
| BM-063 | `document.fullDocumentCode` | `{{document.field10}}` | No matching mustache in DOCX |
| BM-064 | `document.fullDocumentCode` | `{{document.field3}}` | No matching mustache in DOCX |
| BM-065 | `decision.decisionLine` | `{{document.field2}}` | No matching mustache in DOCX |
| BM-065 | `document.fullDocumentCode` | `{{document.field9}}` | No matching mustache in DOCX |
| BM-066 | `decision.decisionLine` | `{{document.field2}}` | No matching mustache in DOCX |
| BM-066 | `document.fullDocumentCode` | `{{document.field6}}` | No matching mustache in DOCX |
| BM-067 | `document.fullDocumentCode` | `{{document.field2}}` | No matching mustache in DOCX |
| BM-067 | `document.fullDocumentCode2` | `{{document.field9}}` | No matching mustache in DOCX |

### 2. Stable Hash Update (`stable-contract-hash.mjs`)

**File:** `scripts/docx-contract/lib/stable-contract-hash.mjs`

Added `"evidence"` and `"reviewEvidence"` to `VOLATILE_FIELDS` set. These are extraction/audit metadata, not semantic content — they should not affect publish idempotency. This ensures that fixing stale `rawPattern` values does not trigger unnecessary version bumps.

## Before / After

| Metric | Before | After |
|---|---|---|
| Blocking | 0 | 0 |
| Remediation checks | 35 | 35 |
| Field-level items | 62 | 62 |
| Warning | 58 | 58 |
| Runtime readiness | 213 locked / 0 draft | 213 locked / 0 draft |
| Gate | PASS | PASS |
| Smoke | PASS | PASS |
| DB versions | v1 (213 published) | v2 (213 published) |

## Verification

| Check | Result |
|---|---|
| `pnpm audit:docx:verify-locked` | Blocking: 0, Remediation: 35, Warning: 58 |
| `pnpm gate:forms:213` | PASS (213/213 locked, 0 generic paths) |
| `pnpm audit:forms:runtime-readiness` | 213 locked, 0 draft, 0 generic fields |
| `pnpm smoke:forms-runtime:213` | PASS (213 locked, 0 draft) |
| `pnpm publish:forms:db` (1st run) | Created: 213, Skipped: 0, Failed: 0 |
| `pnpm publish:forms:db` (2nd run) | Created: 0, Skipped: 213, Failed: 0 |

## Warning Delta

No new warnings introduced.

## DB Versions

- **v1**: Published in Wave 04A (before evidence exclusion from hash)
- **v2**: Published in Wave 04B (after adding evidence to VOLATILE_FIELDS)
- All 213 forms have exactly 2 published versions (v1, v2)
- Idempotency confirmed: 2nd publish run skips all 213

## Remaining Work

- **Remediation checks: 35** (unchanged — 20 slots need DOCX template editing, 15 belong to other BMs)
- **Field-level items: 62** (unchanged — same reason)
- **Recommended next wave**: Wave 04C — add missing DOCX mustaches for the 20 remaining slots in scoped BMs, then rename the generic `{{document.fieldN}}` placeholders in DOCX to match the semantic slotIds

The 20 remaining slots require actual DOCX template mustaches to be added. This is a DOCX edit task that cannot be addressed by metadata fixes alone. The `all-lock-mappings.json` update was explored but deemed counterproductive — it would cause `lock-reviewed` to regenerate contracts with wrong slotIds, defeating the purpose.

---

*Report generated by Wave 04B pipeline. Audit data: `docs/audit/docx/reports/wave-04b-rawpattern-fix.json`*
