# Wave 04A Stable Hash and Remediation Inventory

**Phase:** Phase E — DOCX Quality Remediation (Wave 04A)
**Date:** 2026-06-23
**Status:** Complete

---

## Problem

BM-001/BM-002/BM-003 (and potentially all 213 forms) were republished unintentionally because the publish script used `JSON.stringify(contract)` as the hash input. Any pipeline run that regenerated `generatedAt`, `updatedAt`, or other volatile timestamp fields would produce a different hash even though the semantic content was identical.

---

## Fix

### 1. Stable Semantic Hash Utility

**File:** `scripts/docx-contract/lib/stable-contract-hash.mjs`

`canonicalizeContractForHash(contract)`:
- Deep-clones contract, strips volatile fields at every level: `generatedAt`, `updatedAt`, `createdAt`, `reportGeneratedAt`, `lockedAt`, `publishedAt`
- At top-level: keeps only known semantic keys (schemaVersion, sourceId, templateCode, templateTitle, docxSlots, canonicalFields, renderBindings, formInputHints, renderFormatHints, reportingHints, productMetadata, extractionSource, etc.)
- `extractionSource`: flattens and keeps only semantic sub-fields (relativePath, sha256, kind, format)
- `productMetadata`: keeps only semantic sub-fields (stage, formNumber, legalBasisLine, reviewKind, reviewedBy, reviewedAt, etc.)
- Sorts object keys recursively for deterministic output; preserves array order (semantic for slots/fields/bindings)

`stableStringify(value)`: Deterministic JSON serializer.

`stableContractHash(contract)`: SHA256 hex of canonical stable string.

### 2. Publish Script Updated

**File:** `scripts/docx-contract/publish-locked-contracts-to-db.mjs`

- Replaced `sha256HexString(JSON.stringify(contract.draftJson))` with `stableContractHash(contract.draftJson)`
- Added `Hash mode: stable-semantic-v1` to console output
- Added `Would create:` / `Would skip:` / `Already published:` summary lines in dry-run mode
- Added `Hash mode: stable-semantic-v1` to publish report header

### 3. Tests

**File:** `test/docx-contract/stable-contract-hash.test.mjs`

21 test cases covering:
- Two contracts with only `generatedAt`/`updatedAt`/`createdAt` different → same hash
- Different `docxSlots.slotId` → different hash
- Different `canonicalFields.path` → different hash
- Different `renderBindings.from` → different hash
- Different `extractionSource.sha256` → different hash
- Different `productMetadata.stage.code` → different hash
- Object key order differences → same hash
- BM-001 timestamp-only republish → same hash (root cause scenario)
- Different `templateCode` / `schemaVersion` → different hash

---

## Verification

| Check | Result |
|---|---|
| Stable hash tests | ✅ PASS (21/21) |
| gate:forms:213 | ✅ PASS (213/213 locked, 0 generic paths) |
| smoke:forms-runtime:213 | ✅ PASS (213 locked, 0 draft) |
| audit:docx:verify-locked | ✅ PASS (Blocking: 0, Remediation: 35, Warning: 58) |
| audit:forms:runtime-readiness | ✅ PASS (213 locked, 0 draft, 0 generic fields) |
| Publish idempotency (1st run) | ✅ Created: 213, Skipped: 0 |
| Publish idempotency (2nd run) | ✅ Created: 0, Skipped: 213 |

---

## Remaining Remediation Inventory

**Source:** `REMAINING-REMEDIATION-INVENTORY.md` / `remaining-remediation-inventory.json`
**Total items:** 62 field-level remediation items across 30 contracts

### By Issue Type

| Issue Type | Count |
|---|---|
| TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | 16 |
| CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | 23 |
| BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | 23 |
| Other | 0 |
| **Total** | **62** |

### By Risk

| Risk | Count |
|---|---|
| Low | 36 |
| Medium | 26 |
| High | 0 |

### By Contract

| Contract | Count | Risk |
|---|---|---|
| BM-001 | 11 | Medium |
| BM-002 | 1 | Medium |
| BM-003 | 4 | Medium |
| BM-021 | 2 | Medium |
| BM-031 | 2 | Medium |
| BM-036 | 4 | Medium |
| BM-044 | 2 | Medium |
| BM-051 | 2 | Low |
| BM-052 | 4 | Low |
| BM-056 | 2 | Medium |
| BM-059 | 2 | Low |
| BM-060 | 2 | Low |
| BM-061 | 2 | Low |
| BM-062 | 4 | Low |
| BM-063 | 4 | Low |
| BM-064 | 2 | Low |
| BM-065 | 4 | Low |
| BM-066 | 4 | Low |
| BM-067 | 4 | Low |
| BM-068 | 14 | Low (REVIEW_REQUIRED) |
| BM-069 | 14 | Low (REVIEW_REQUIRED) |
| BM-073 | 4 | Low (REVIEW_REQUIRED) |
| BM-075 | 4 | Low (REVIEW_REQUIRED) |
| BM-077 | 2 | Low (REVIEW_REQUIRED) |
| BM-080 | 6 | Low (REVIEW_REQUIRED) |
| BM-082 | 2 | Low (REVIEW_REQUIRED) |
| BM-162 | 8 | Low (REVIEW_REQUIRED) |
| BM-163 | 10 | Low (REVIEW_REQUIRED) |

---

## Recommended Wave 04B

**Strategy:** Fix lowest-risk items first. Focus on `rename-placeholder` actions (Low risk) before `add-placeholder` (Medium risk).

### Priority 1: Low-risk rename actions (Low)
- **BM-051, BM-052, BM-060, BM-061, BM-062, BM-063, BM-064, BM-065, BM-066, BM-067**: Rename `{{document.fullDocumentCode}}` → specific path in DOCX template
- **BM-062, BM-065, BM-066**: Rename `{{decision.decisionLine}}` → actual decision line placeholder

### Priority 2: Low-risk add-placeholder (Low)
- **BM-059**: Add `{{recipients.personLine}}` to DOCX template

### Priority 3: Medium-risk add-placeholder (Medium)
- **BM-021, BM-031, BM-036, BM-044**: Add `{{agency.nameUpper}}` / `{{agency.bodyName}}` / `{{agency.parentNameUpper}}` to DOCX templates
- **BM-001, BM-002, BM-003**: Add missing reception/sourceAssignment slots (16 items)

### Out of scope for Wave 04A
- **BM-068, BM-069, BM-073, BM-075, BM-077, BM-080, BM-082, BM-162, BM-163**: REVIEW_REQUIRED items — require human review of binding evidence before template edit

---

## Files Changed

- `scripts/docx-contract/lib/stable-contract-hash.mjs` (new)
- `scripts/docx-contract/publish-locked-contracts-to-db.mjs` (modified)
- `test/docx-contract/stable-contract-hash.test.mjs` (new)
- `scripts/docx-contract/list-remaining-remediation.mjs` (new)
- `docs/audit/docx/reports/REMAINING-REMEDIATION-INVENTORY.md` (generated)
- `docs/audit/docx/reports/remaining-remediation-inventory.json` (generated)
- `docs/audit/docx/reports/WAVE-04A-STABLE-HASH-AND-REMEDIATION-INVENTORY.md` (this report)
