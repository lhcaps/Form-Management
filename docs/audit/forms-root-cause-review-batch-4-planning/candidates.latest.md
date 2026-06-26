# Batch 4 Label-Only Planning Scan

Generated: 2026-06-26T11:09:51.937Z
Mode: **PLANNING ONLY** — no contracts mutated

## Executive Summary

| Metric | Value |
|--------|------:|

| Root-cause issues before | 3441 |
| BAD_LABEL remaining | 432 |
| UI_VISIBLE_BAD_METADATA remaining | 77 |
| Candidates scanned | 326 |
| **Safe label-only candidates** | **0** |
| Deferred candidates | 326 |
| Blocked candidates | 0 |

## Label Breakdown Analysis

The 432 BAD_LABEL remaining breaks down as:

| Category | Count | Contracts | Fixable Label-Only? |
|----------|------:|----------:|---------------------|
| `O trong` (blank label) | 340 | 86 | **No** — requires DOCX authoring |
| `Slot from Wave 02 DOCX remediation` | 57 | 9 | **No** — structural slot leftover |
| `Slot from DOCX remediation` | 16 | 10 | **No** — structural slot leftover |
| Individual camelCase | 19 | ~15 | Possible with per-BM review |

## Root Cause Explanation

### Primary Blocker: O trong (340 items, 86 BMs)

Fields labeled `O trong` — this is the DOCX slot placeholder text rendered as the field label.
The actual content comes from the DOCX slot name, not from the contract metadata.
**Cannot fix by label-only patch.** Requires DOCX authoring to set correct slot labels in source DOCX.

Sources for `O trong` items: `manual`, `agencyConfig`, `computed`, `systemDate` — all mixed.

### Secondary Blocker: Wave 02 DOCX Remediation Slots (57 items, 9 BMs)

Label = `Slot from Wave 02 DOCX remediation` — structural leftover from Wave 02 remediation.
Source = `manual`. These are empty or misnamed slots that need DOCX-level fix.

### Third Blocker: Generic Slot Labels (16 items)

Label = `Slot from DOCX remediation` — generic slot placeholder.
Needs targeted DOCX remediation.

### Patchable Remainder (19 items)

Individual camelCase labels: `archiveLine`, `issuePlaceAndDateLine`, `primaryLine`, `identityIssuedDay`, etc.
Each appears only 1-3 times across all BMs. Per-BM review would be needed for each.
Risk: medium to high — path context varies enough that a global dictionary would misfire.

## Cluster Summary (326 candidates, all deferred)

| Cluster | Count | Status |
|---------|------:|--------|
| person_identity | 49 | Deferred — O trong + wave02 slots |
| case_metadata | 197 | Deferred — O trong + wave02 slots |
| agency | 17 | Deferred — O trong |
| signature | 0 | None found |
| other | 63 | Deferred — O trong + generic slots |

## Risk Summary

| Risk | Count | Note |
|------|------:|------|
| low | 0 | No deterministic safe cluster found |
| medium | 326 | All deferred |
| high | 0 | None in the non-deferred set |

## Top Recurring Unresolved Labels

| # | Label | Occurrences | Contracts | Fixable? |
|---|-------|------------:|----------:|----------|
| 1 | `O trong` | 340 | 86 | No |
| 2 | `Slot from Wave 02 DOCX remediation` | 57 | 9 | No |
| 3 | `Slot from DOCX remediation` | 16 | 10 | No |
| 4 | `archiveLine` | 3 | 3 | Per-BM |
| 5 | `issuePlaceAndDateLine` | 2 | 2 | Per-BM |
| 6 | `primaryLine` | 2 | 2 | Per-BM |
| 7 | `identityIssuedDay` | 1 | 1 | Per-BM |
| 8 | `identityIssuedMonth` | 1 | 1 | Per-BM |
| 9 | `identityIssuedYear` | 1 | 1 | Per-BM |
| 10 | `representedOrganization` | 1 | 1 | Per-BM |

## Recommendation

**DEFER_TO_DOCX_AUTHORING_LANE**

Safe candidate count: 0. Batch 4 label-only is not viable in the current state.

**Reasoning:**
- 413/432 BAD_LABEL (95.6%) are structurally caused by DOCX slot naming, not label metadata.
  These cannot be fixed with a label dictionary patch — the label value in the locked contract
  reflects the DOCX slot placeholder, not the intended field label.
- The remaining 19 camelCase items are too fragmented (1-3 occurrences each) to justify
  a batch apply with low confidence.
- The Batch 3 dictionary approach worked because Batch 3 targeted person/address/contact
  labels that were already correctly sourced but had raw camelCase display values.

**Required upstream work before Batch 4:**
1. DOCX authoring lane to fix `O trong` labels at source (BM-001 through BM-213, 86 BMs)
2. Wave 02 DOCX remediation for the 9 Wave 02 contracts with `Slot from Wave 02` labels
3. A future wave after DOCX fixes will have a cleaner BAD_LABEL pool to batch-apply

## Safety Verification

| Check | Result |
|-------|--------|
| Locked contracts mutated | **false** |
| DOCX touched | **false** |
| Compiled artifacts hand-edited | **false** |
| Source/path/binding untouched | **true** |
| legalBasis excluded | **true** |
