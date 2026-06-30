# Cursor Resume from Codex — 213 DOCX Fidelity

## What Codex Changed

### Board and tooling
- Created `docs/audit/213-docx-fidelity-board/latest.json` and `latest.md` — 213-row fidelity board with lane classification.
- Created `scripts/audit/refresh-213-docx-fidelity-board.mjs` — deterministic board generator reading root-cause, baseline, and locked contract metadata.
- Created `scripts/audit/plan-docx-placeholder-renormalization.mjs` — scans all 213 BMs for duplicate semantic DOCX placeholders.
- Created `scripts/audit/lib/docx-placeholder-risks.mjs` — shared library: PizZip DOCX extraction, semantic anchor detection, duplicateSemantic risk detection.
- Created `docs/audit/docx-placeholder-renormalization/plan.latest.json` and `plan.latest.md` — 19 BMs with 25 duplicate semantic placeholder risks.
- Created `scripts/audit/plan-contract-repair-batch-1-evidence.mjs` — evidence-only script for batch-1 BMs (BM-052/062/063/065/066).
- Created `docs/audit/213-docx-fidelity-board/contract-repair-batch-1.latest.md` — batch-1 selection document.
- Created `docs/audit/213-docx-fidelity-board/contract-repair-batch-1-evidence.latest.md` — batch-1 evidence summary.

### Per-form evidence
- `docs/audit/per-form-render-accurate/BM-052/evidence.latest.json` — structural mismatch evidence for BM-052 (from batch-1).
- Similar evidence stubs for BM-062/063/065/066.

### Corrected remediation path
- `docs/audit/213-docx-fidelity-board/corrected-remediation-path.md` — documents the binding model correction: do NOT force slotId === canonicalFields.path === binding.from.
- Key rule: `docxSlots[].slotId` = actual DOCX placeholder; `renderBindings[].from` = semantic source; `canonicalFields[].path` = semantic field path.

### Contract repairs (7 BMs)
- Modified: `docs/audit/docx/contracts/locked/BM-003__*.contract.locked.json`
- Modified: `docs/audit/docx/contracts/locked/BM-021__*.contract.locked.json`
- Modified: `docs/audit/docx/contracts/locked/BM-022__*.contract.locked.json`
- Modified: `docs/audit/docx/contracts/locked/BM-025__*.contract.locked.json`
- Modified: `docs/audit/docx/contracts/locked/BM-032__*.contract.locked.json`
- Modified: `docs/audit/docx/contracts/locked/BM-036__*.contract.locked.json`
- Modified: `docs/audit/docx/contracts/locked/BM-096__*.contract.locked.json`
- Corresponding `docs/audit/docx/compiled-v2/BM-*.compiled.json` updated.
- These are on the `fix/documents-canonical-render-payload-snapshot` branch.

### Root-cause and baseline
- Modified: `docs/audit/forms-root-cause/latest.json` and `latest.md` — refreshed with current metrics.
- Modified: `docs/audit/form-authoring-baselines/audited.md` and `matrix.csv` — refreshed.
- Modified: `scripts/audit/audit-forms-root-cause.mjs` — updated rules.

### Rule file
- Created: `.cursor/rules/qllaw-contract-remediation.mdc` — project-specific remediation rules.

## What Was Verified (Live)

| Check | Result |
|---|---|
| DB sync | Matched 213, Missing 0, Stale 0 |
| Root-cause audit | 1467 issues (FAIL 1148, REVIEW 319) |
| Fidelity board refresh | 213 rows, 22 CONTRACT_REPAIR |
| Renormalization inventory | 19 BMs, 25 duplicate semantic risks |
| BM-052 evidence script | 8 occurrence items, 8 proposed splits |
| BM-052 test suite | 24/24 passed |
| Forbidden diffs | None (no DOCX/contract/compiled-v2 mutations) |

## Live Metrics

| Metric | Value |
|---|---|
| Root-cause issues | 1467 |
| Root-cause FAIL | 1148 |
| Root-cause REVIEW | 319 |
| DB sync matched | 213 |
| DB sync missing | 0 |
| DB sync stale | 0 |
| CONTRACT_REPAIR lane | 22 |
| PATH_DOMAIN_BINDING lane | 126 |
| SOURCE_POLICY lane | 50 |
| WEAK_EVIDENCE_REVIEW lane | 2 |
| RENDER_FIDELITY lane | 13 |
| VERIFY_ONLY lane | 0 |
| DOCX renormalization BMs | 19 |
| DOCX renormalization risks | 25 |

## Correct Binding Model (Confirmed)

```
canonicalFields[].path = semantic field path
docxSlots[].slotId = actual DOCX placeholder id
renderBindings[].slotId = actual target DOCX placeholder
renderBindings[].from = semantic source field
```

These three are NOT forced to be identical. Example from BM-096:
- DOCX placeholder remains `document.diaChi`
- Semantic source is `person.idNumber`
- Binding: `document.diaChi` <- `person.idNumber`

## CodeGraph Findings

CodeGraph confirmed:
- `scripts/audit/plan-contract-repair-batch-1-evidence.mjs` calls `simplifySlot`, `simplifyField`, `simplifyBinding`, `buildStructuralMismatches`, and `extractDocxPlaceholdersFromFile`.
- `slotId()` function uses `slot.slotId ?? slot.id ?? ''` — handles both naming conventions.
- `buildStructuralMismatches()` correctly compares placeholders, slots, fields, and bindings as separate sets.
- `duplicateSemanticPlaceholders` from `docx.placeholders.risks.duplicateSemantic` is included in structural mismatch output.
- Renderer routing (`document-renderer-routing.policy.ts`) uses template-level configuration — not directly affected by field-level binding changes.

## Phase 1 Complete — Next is Phase 2

All Phase 0 steps complete:
- [x] Git state captured
- [x] Codex files read
- [x] CodeGraph queries run
- [x] Live validation scripts run
- [x] Phase 1 handoff created
- [x] BM-052 evidence produced
- [x] BM-052 test passes
- [x] No forbidden diffs
- [x] DB sync clean
