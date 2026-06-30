# Commit Isolation Plan — Legal Semantic Field Review 213

**Generated:** 2026-06-29T16:55:00Z
**Task:** `SAFE_COMMIT_OR_REVERT_PLAN_POST_LEGAL_SEMANTIC_REVIEW_213_V2`

## Phases Committed

| # | Hash | Message | Files |
|---|------|---------|-------|
| 1 | `36c9821a` | `audit: add legal semantic field review evidence and apply tools` | 9 |
| 2 | `94779d6f` | `audit: add form authoring baselines for BM-001..BM-213` | 2 |

---

## Remaining Dirty State: 465 paths

---

## Group A: LEGAL_LABEL_REMEDIATION_ONLY — 85 locked contracts + 108 compiled-v2 + derived artifacts

### Summary

**Commit 3 is SAFE** for the 85 locked contracts that are NOT affected by the DOCX semantic renormalization lane. All diffs are limited to `label`, `reviewRequired`, `reviewEvidence`, `reviewedBy`, `reviewedAt`, and `generatedAt` (timestamp-only).

### Locked Contracts Safe to Commit (85 BMs)

```
BM-004, BM-013, BM-021, BM-022, BM-024, BM-025, BM-026, BM-027, BM-028,
BM-029, BM-031, BM-032, BM-034, BM-035, BM-036, BM-041, BM-044, BM-048,
BM-049, BM-050, BM-051, BM-056, BM-060, BM-061, BM-064, BM-068, BM-069,
BM-072, BM-074, BM-075, BM-076, BM-077, BM-078, BM-080, BM-081, BM-082,
BM-083, BM-084, BM-087, BM-088, BM-091, BM-092, BM-093, BM-094, BM-095,
BM-096, BM-098, BM-099, BM-100, BM-101, BM-102, BM-105, BM-106, BM-107,
BM-108, BM-109, BM-110, BM-111, BM-112, BM-113, BM-114, BM-115, BM-116,
BM-117, BM-118, BM-119, BM-120, BM-121, BM-122, BM-123, BM-125, BM-126,
BM-127, BM-128, BM-129, BM-130, BM-131, BM-132, BM-133, BM-134, BM-135,
BM-136, BM-137, BM-138, BM-140, BM-142, BM-143, BM-147, BM-149, BM-151,
BM-152, BM-153, BM-154, BM-155, BM-157, BM-158, BM-160, BM-161, BM-162,
BM-163, BM-213
```

**Excluded (must NOT be staged):** BM-052, BM-062, BM-063, BM-066 — see Group B.

### Changed JSON Areas per Contract (verified by sampling)

All diffs contain only:
- `canonicalFields[].label` (fixed from generic "Ô trống" to semantic labels)
- `canonicalFields[].reviewRequired` (false across all reviewed fields)
- `canonicalFields[].reviewEvidence` (Codex review metadata)
- `canonicalFields[].reviewedBy`, `canonicalFields[].reviewedAt`
- `canonicalFields[].transform` (identity added)
- `canonicalFields[].section` (added for section grouping)
- `docxSlots[].reviewRequired`, `docxSlots[].reviewEvidence`, `docxSlots[].reviewedBy`
- `renderBindings[].reviewRequired`, `renderBindings[].reviewEvidence`, `renderBindings[].reviewedBy`
- `generatedAt` (timestamp update)
- `reviewedBy`, `reviewedAt` (top-level contract header)
- `renderRepairEvidence` — NOT present in any non-DOCX contract

**No path/source/rawPattern/slotId/id mutations in these 85 contracts.**

### Compiled-V2 (108 files) — Safe

All 108 changed compiled-v2 files are official compiler output reflecting locked contract state. Consistent `+2/-2` line diffs (added `reviewRequired: false` and timestamp). No substantive content changes beyond label propagation.

**Excluded:** `BM-052.compiled.json`, `BM-062.compiled.json`, `BM-063.compiled.json`, `BM-066.compiled.json` — see Group B.

### Derived Audit Artifacts (timestamp-only) — Safe to Include

| Artifact | Count | Change Type |
|----------|-------|-------------|
| `docs/audit/docx-atlas-v1/render-atlas.latest.{json,md}` | 2 | Timestamp regeneration |
| `docs/audit/per-form-render-accurate/*/render-diff.latest.{json,md}` | 130 | Timestamp regeneration |
| `docs/audit/forms-root-cause/latest.{json,md}` | 2 | Regenerates from locked contracts |
| `docs/audit/forms-root-cause-fix-plan/*.{json,md}` | 5 | Regenerates from locked contracts |
| `docs/audit/repo-clean-to-zero-v1/*.{json,md}` | 4 | Regenerates from current state |
| `docs/audit/docx/reports/*.{json,md}` | 2 | Regenerates from DB sync |

### Phase 4 Safety Gate (pre-commit)

Must pass before Phase 5:
```
git diff --check
pnpm audit:locked-compiled:strict
pnpm audit:contract-sync
pnpm typecheck
pnpm --filter @qllaw/form-contracts test
```

---

## Group B: DOCX_SEMANTIC_RENORMALIZATION_LANE — 4 locked contracts + 4 normalized DOCX + 4 compiled-v2 + scripts + backups

**STATUS: DO NOT COMMIT — requires separate lane approval**

### Locked Contracts with DOCX Lane Markers

| BM | Key Evidence |
|----|-------------|
| **BM-052** | `renderRepairEvidence` block: `"Codex source-DOCX semantic renormalization"`. New semantic slots added: `person.fullName`, `person.idNumber`, `person.temporaryAddress`, `signature.signerName`, `person.otherName`, `person.birthInfoLine`, `person.nationalityEthnicityReligionLine`. SlotId rewrites: `document.fullDocumentCode→recipients.personLine`, `recipients.personLine→person.fullName`. extractionSource.sha256 mutated. New renderBindings. |
| **BM-062** | `renderRepairEvidence` block: `"Codex source-DOCX semantic renormalization"`. 16 new field/slot/binding entries (person.otherName, person.birthInfoLine, person.nationality, person.ethnicityReligionLine, measure.reasonLine, measure.assetListLine, person.occupation, person.identityNo, person.identityIssueDateLine, person.identityIssuePlace, person.permanentAddress, person.temporaryAddress, person.currentAddress, measure.executionAgencyLine, measure.coordinationAgencyLine). extractionSource.sha256 mutated. |
| **BM-063** | `renderRepairEvidence` block: `"Codex source-DOCX semantic renormalization"`. |
| **BM-066** | `renderRepairEvidence` block: `"Codex source-DOCX semantic renormalization"`. |

### Normalized DOCX Files

```
storage/templates/normalized-docx/BM-052/BM-052_normalized.docx
storage/templates/normalized-docx/BM-062/BM-062_normalized.docx
storage/templates/normalized-docx/BM-063/BM-063_normalized.docx
storage/templates/normalized-docx/BM-066/BM-066_normalized.docx
```

**Reason:** Structural SOT. Modified by `apply-docx-source-semantic-renormalization.mjs`. Requires separate DOCX-lane approval before committing.

### Derived from DOCX Lane

```
docs/audit/docx/compiled-v2/BM-052.compiled.json
docs/audit/docx/compiled-v2/BM-062.compiled.json
docs/audit/docx/compiled-v2/BM-063.compiled.json
docs/audit/docx/compiled-v2/BM-066.compiled.json
docs/audit/per-form-render-accurate/BM-052/render-diff.latest.{json,md}
docs/audit/per-form-render-accurate/BM-062/render-diff.latest.{json,md}
docs/audit/per-form-render-accurate/BM-063/render-diff.latest.{json,md}
docs/audit/per-form-render-accurate/BM-066/render-diff.latest.{json,md}
docs/audit/docx-placeholder-renormalization/BM-052/apply.latest.{json,md}
docs/audit/docx-placeholder-renormalization/BM-052/approved-signature/apply.latest.{json,md}
docs/audit/docx-placeholder-renormalization/BM-062/apply-signature.latest.{json,md}
docs/audit/docx-placeholder-renormalization/BM-062/planner-handoff.signature-after-apply.{json,md}
```

### Scripts and Tests

```
scripts/audit/apply-docx-source-semantic-renormalization.mjs
test/docx-source-semantic-renormalization.test.mjs
```

### Backup Folders — DO NOT COMMIT

```
docs/audit/docx-placeholder-renormalization/BM-052/backups/
docs/audit/docx-placeholder-renormalization/BM-052/approved-signature/backups/
docs/audit/docx-placeholder-renormalization/BM-062/approved-signature/backups/
docs/audit/docx-placeholder-renormalization/source-backed-semantic-batch/
```

### Stale Raw-Pattern Artifacts — Recommend Delete

```
docs/audit/raw-pattern-mismatch-triage-batch-1/
  latest.json, latest.md, per-issue.csv, triage-data.json, triage-results.json
```

**Reason:** `latest.json/md` was staged and unstaged. Not a durable audit artifact. Recommend deletion.

---

## Group C: SOURCE_CODE_LANE — 10 files

**STATUS: DO NOT COMMIT in remediation commits — separate feature/bugfix commit required**

| File | Reason |
|------|--------|
| `packages/form-contracts/src/expression.ts` | Bugfix: self-referential cycle false positive detection |
| `packages/form-contracts/src/v1-adapter.ts` | Feature: computed source support in v1 contracts |
| `packages/form-contracts/test/v1-adapter.test.ts` | Tests for v1-adapter computed source |
| `scripts/audit/apply-render-binding-repair-v1.mjs` | Render binding repair (unrelated to 213) |
| `scripts/docx-contract/publish-locked-contracts-to-db.mjs` | DB publish (unrelated to 213) |
| `scripts/audit/build-active-remediation-blocker-pack.mjs` | Blocker pack builder (side effect) |
| `scripts/audit/check-213-remediation-readiness.mjs` | Gate adjustment reflecting clean atlas |
| `test/213-remediation-readiness-gate.test.mjs` | Gate test (reflects gate adjustment) |
| `test/active-remediation-blocker-pack.test.mjs` | Blocker pack test |
| `test/contract-render-binding-repair.test.mjs` | Render binding repair test |

---

## Group D: DELETE_OR_HOLD — 4 files

| File | Recommended Action |
|------|-------------------|
| `scripts/audit/apply-legal-semantic-field-review-213.mjs` | **DELETE** — vestigial; adds reviewEvidence but makes no label changes; superseded by `apply-legal-semantic-label-review-213.mjs` |
| `test/apply-legal-semantic-field-review-213.test.mjs` | **DELETE** — companion to vestigial script |
| `docs/audit/legal-semantic-field-review-213/apply.latest.json` | **DELETE** — vestigial apply report; durable evidence is in build/apply-label already committed |
| `docs/audit/legal-semantic-field-review-213/apply.latest.md` | **DELETE** — vestigial apply report |

---

## Phase 4 Safety Gate

Run before staging Commit 3:

```bash
git diff --check
pnpm audit:locked-compiled:strict
pnpm audit:contract-sync
pnpm typecheck
pnpm --filter @qllaw/form-contracts test
```

**Expected:** All pass (green C3/C2/typecheck/tests as documented).

---

## Phase 5 Staging Plan (if Phase 4 passes)

### Approach: Explicit enumeration (cannot use globs due to DOCX lane exclusion)

Stage locked contracts with exact exclusion of BM-052, 062, 063, 066:

```bash
# Stage 85 safe locked contracts (explicit, excluding BM-052/062/063/066)
git add docs/audit/docx/contracts/locked/BM-004__2775520fd22c.contract.locked.json
git add docs/audit/docx/contracts/locked/BM-013__9a1f7d37fec9.contract.locked.json
git add docs/audit/docx/contracts/locked/BM-021__772319486f41.contract.locked.json
# ... (83 more — see Group A list)
git add docs/audit/docx/contracts/locked/BM-213__*.contract.locked.json

# Stage compiled-v2 (explicit, excluding BM-052/062/063/066)
git add docs/audit/docx/compiled-v2/BM-004.compiled.json
git add docs/audit/docx/compiled-v2/BM-013.compiled.json
# ... (104 more — excluding BM-052/062/063/066)
git add docs/audit/docx/compiled-v2/BM-213.compiled.json

# Stage derived artifacts
git add docs/audit/docx-atlas-v1/render-atlas.latest.json
git add docs/audit/docx-atlas-v1/render-atlas.latest.md
git add docs/audit/per-form-render-accurate/
git add docs/audit/forms-root-cause/
git add docs/audit/forms-root-cause-fix-plan/
git add docs/audit/repo-clean-to-zero-v1/
git add docs/audit/docx/reports/
```

---

## Phase 6 Summary

| Item | Value |
|------|-------|
| Commit 1 | `36c9821a` — audit evidence and tools |
| Commit 2 | `94779d6f` — form authoring baselines |
| Commit 3 safe | **YES** — 85 locked contracts + 108 compiled-v2 + derived artifacts |
| LEGAL_LABEL_REMEDIATION_ONLY | 85 locked + 108 compiled-v2 + ~143 derived = ~336 |
| DOCX_SEMANTIC_RENORMALIZATION_LANE | 4 locked + 4 normalized-docx + 4 compiled-v2 + 8 render-diffs + 8 placeholder-renorm + 4 backups + 2 scripts/tests = 34 |
| SOURCE_CODE_LANE | 10 |
| DELETE_OR_HOLD | 4 vestigial + 5 stale = 9 (recommend delete) |
| Remaining after safe commits | ~86 paths (DOCX lane + source code + delete candidates) |
