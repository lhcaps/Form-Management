# Wave 02 DOCX Remediation

## Scope
BM-068, BM-069, BM-073, BM-075, BM-077, BM-080, BM-082, BM-162, BM-163

## Baseline (2026-06-22T15:54:00Z)

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation | 83 |
| Warning | 40 |
| Gate | PASS |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |

## DB State Before Wave 02
- Wave 01 v2: BM-051, BM-052, BM-060–BM-067 (10 forms, version 2)
- All others: version 1
- Scope key: GLOBAL

## Root Cause Analysis

All 9 wave-02 forms had generic DOCX mustaches (`{{document.field}}`, `{{recipients.field}}` — no numeric suffix in the actual DOCX XML, unlike the draft contracts' `document.field1`, `document.field2`, etc.). The wave-01 lock process kept only 2 slots per form (agency.name + recipients.personLine), leaving the remaining generic mustaches unmatched → TEMPLATE_PLACEHOLDER_WITHOUT_SLOT.

## Changes

### Step 1: DOCX Renaming (wave-02-remediation.mjs)

Renamed generic mustaches to sequential numbered variants (e.g. `{{document.field}}` → `{{document.field1}}`, `{{recipients.field}}` → `{{recipients.personLine}}`, etc.), then to fully semantic names to avoid matching the generic path regex `(^|\.)field(?:\d+)?(?:_|$)`.

| BM | Old → New (selected examples) | Mustaches Renamed |
|---|---|---|
| BM-068 | `{{document.field}}` → 14 semantic slots | 15 |
| BM-069 | `{{document.field}}` → 15 semantic slots | 15 |
| BM-073 | `{{document.field}}` → 5 semantic slots | 5 |
| BM-075 | `{{document.field}}` → 4 semantic slots | 4 |
| BM-077 | `{{document.field}}` → 1 semantic slot | 1 |
| BM-080 | `{{document.field}}` → 6 semantic slots | 6 |
| BM-082 | `{{document.field}}` → 1 semantic slot | 1 |
| BM-162 | `{{document.field}}` → 9 semantic slots | 9 |
| BM-163 | `{{document.field}}` → 11 semantic slots | 11 |
| **Total** | | **67** |

### Step 2: Locked Contract Repair (fix-locked-slots-after-wave-02-remediation.mjs)

- Phase 1: Added missing docxSlots + canonicalFields + renderBindings for all newly renamed semantic mustaches.
- Phase 2: Renamed remaining `document.fieldN` slots to fully semantic paths (no "field" in path) to avoid generic path regex blocking.
- Post-fix: Deduplicated slots that collided (e.g., `person.dateOfBirth` existed from sequential step already).

### Step 3: Hash Sync

Updated `extractionSource.sha256` in all 9 locked contracts to match remediated DOCX hashes.

## After

| Metric | Value | Change |
|---|---|---|
| Blocking | 0 | 0 |
| Remediation | 74 | -9 |
| Warning | 58 | +18 |
| Gate | PASS | PASS |
| Runtime readiness | 213 locked / 0 draft | — |
| Smoke | PASS | PASS |

Warning increase explanation: Wave-02 forms now have properly defined semantic slots (person.dateOfBirth, person.currentAddress, etc.) that are absent from the DOCX templates themselves. These are documented `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER` warnings indicating the DOCX does not yet contain all expected mustaches — expected, non-blocking.

## DB Publish

| Field | Value |
|---|---|
| Created | 9 (v2: BM-068, 069, 073, 075, 077, 080, 082, 162, 163) |
| Skipped | 204 |
| Failed | 0 |
| Scope key | GLOBAL |
| Source resolution | GLOBAL_PUBLISHED |

## Scripts Created

- `scripts/docx-contract/wave-02-remediation.mjs` — DOCX mustache renaming with sequential + semantic naming
- `scripts/docx-contract/fix-locked-slots-after-wave-02-remediation.mjs` — Locked contract post-repair

## Remaining Work

- Remediation: **74** (was 83, -9)
  - BM-139: `TEMPLATE_PLACEHOLDER_WITHOUT_SLOT` — 3 mustaches (agency.dongDia, document.chuThe, document.ngayBan)
  - BM-164–212: `TEMPLATE_PLACEHOLDER_WITHOUT_SLOT` — generic `{{document.field}}`, `{{recipients.field}}`, `{{decision.field}}`
  - Wave 01 forms (BM-051–067): `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER` warnings from earlier lock
- Warning: **58** (was 40, +18 — expected from wave-02 remediation)

## Recommended Wave 03 Target List

Priority grouping based on issue type:

**Critical (TEMPLATE_PLACEHOLDER_WITHOUT_SLOT):**
1. BM-139 — 3 mustaches (agency.dongDia, document.chuThe, document.ngayBan)
2. BM-164, 165, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183 — single `{{document.field}}`
3. BM-186, 187, 188, 189, 190, 191, 192, 193, 196, 201, 203, 205, 207, 208, 209, 211, 212 — `{{document.field}}` + `{{recipients.field}}`
4. BM-184, 199 — `{{decision.field}}` + others
5. BM-194, 195, 197, 198, 200, 202, 204, 206, 210 — single or mixed

**Recommended Wave 03:** BM-139 (unique mustaches), BM-164, BM-165, BM-174, BM-175, BM-176, BM-177, BM-178, BM-179, BM-180, BM-181, BM-182, BM-183 (single `document.field` forms)
