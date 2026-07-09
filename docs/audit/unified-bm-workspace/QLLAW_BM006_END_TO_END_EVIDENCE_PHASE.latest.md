# QLLAW BM-006 End-to-End Evidence — Phase A Report

> **Generated**: 2026-07-10
> **STATUS**: PARTIAL_PENDING_USER_DECISION
> **PHASE**: A (canary lock before Batch 6)
> **BRANCH**: `audit/bm006-visual-fidelity-evidence` (created from `feat/pr6g2-bm-final-audit-harness` @ `622f0726`)
> **PILOT_CODE**: BM-006

## Summary

Phase A locks BM-006 end-to-end evidence across 6 dimensions so that the canary, freshly calibrated in PR #39, holds before Phase B opens Batch 6 (BM-121..BM-140).

| Step | Goal | Verdict |
|---|---|---|
| 1 | Pre-flight safety gates (apply-all-current-evidence + status-matrix) | PASS — 97/116 preserved, allowlist BM-001+BM-171, FIDELITY_COMPLETE_EVIDENCED=false |
| 2 | Browser visibility check (BM-006 only) | PASS — `browserVerified=true`, `browserVerifiedStatus=passed`, 1377 ms |
| 3 | Demo click check (BM-006 only) | PASS — `demoClickVerified=true`, 1938 ms |
| 4 | Preview click check (BM-006 only) | PASS — `previewClickVerified=true`, 6345 ms, no leaks |
| 5 | DOCX download check (BM-006 only) | PASS — `docxDownloadVerified=true`, 7911 ms, regenerated via offline renderer (no live API + Clerk ticket in this session) |
| 6 | Machine-checkable fidelity asserts | PASS — `EXACT_MATCH blocks=6/6`; `assert-top-right-promulgation-block.mjs`: PASS=1, FAIL=0; `assert-bm006-top-right-template-calibration.mjs`: PASS; canary: 5/5 forms match baseline, BM-006 itself sha `45e34095...77102f` |
| 7 | Visual/PDF artifact for human review | ARTIFACT WRITTEN — `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.{json,md,checklist}.md`; source PDF 121557 B; generated PDF 130356 B; pixel diff page 1: bbox `(103, 244, 1150, 1390)`, non-zero ratio 5.10% |
| 8 | (deleted from Phase A — scope-creep into separate Phase B PR; see `d:\Study\batch6-skeleton.patch`) | — |
| 9 | Full validation gates | PASS — all 6 prompt-required gates + BM-006 calibration / canary / promulgation asserts |
| 10 | Commit + report | this file |

## Hard invariants (Phase A end-state)

- `fidelityCompleteClaimed`: **false**
- `fidelityCompleteEvidenced`: **false**
- `formFlightRuntimeReadyPromoted`: **0** (allowlist still BM-001+BM-171)
- `INPUT_CONNECTED_PASS = 97`, `INPUT_CONNECTED_PARTIAL = 116`, `FIDELITY_PENDING = 0` (counts preserved)
- Source DOCX `storage/templates/source-docx/*`: not mutated
- Normalized DOCX `storage/templates/normalized-docx/BM-006/`: not mutated (still sha `45e34095...77102f`)
- Locked contracts `docs/audit/docx/contracts/locked/*`: not mutated
- Compiled contracts `docs/audit/docx/compiled-v2/*`: not mutated
- DB / Prisma schema / migrations: not mutated
- Public API route paths: not mutated
- Batch 3 / Batch 4 / Batch 5 / curated-37 / 97 evidence: preserved
- FormFlight allowlist: BM-001+BM-171 only (BM-006 NOT promoted)

## Validation gates (Step 9) — actual results

| # | Command | Exit | Verdict |
|---|---|---|---|
| 1 | `node scripts/audit/apply-all-current-evidence.mjs` | 0 | PASS — matrix re-stamped, counts preserved at 97/116, FIDELITY_COMPLETE_EVIDENCED=false |
| 2 | `node scripts/audit/status-matrix-213.mjs` | 0 | PASS — `INPUT_CONNECTED_PASS=97, INPUT_CONNECTED_PARTIAL=116, FIDELITY_PENDING=0` |
| 3 | `node scripts/audit/curated-37-golden-layout-fidelity.mjs` | 0 | PASS — 37 forms audited, BM-006 row PASS (all 21 fidelityCriteriaPassed, 0 failures) |
| 4 | `node --test scripts/audit/status-matrix-preserves-evidence.guard.test.mjs` | 0 | PASS — 1 test, 0 fail |
| 5 | `pnpm --filter web exec tsc --noEmit` | 0 | PASS — no diagnostics |
| 6 | `pnpm --filter api exec tsc --noEmit` | 0 | PASS — no diagnostics |
| 7 | `$env:NODE_PATH=apps/api/node_modules; node scripts/audit/assert-bm006-top-right-template-calibration.mjs` | 0 | PASS — geometry verified: posOffsetH=4350000, posOffsetV=36000, anchor ext=1900000x380000, inner ext=1200000x320000, run props preserved |
| 8 | `node scripts/audit/assert-bm006-calibration-canary.mjs` | 0 | PASS — 5/5 canary forms sha match baseline (BM-001/171/015/057/076); BM-006 itself `45e34095...77102f` |
| 9 | `$env:TARGET_CODES=BM-006; node scripts/audit/assert-top-right-promulgation-block.mjs` | 0 | PASS — Total=1, PASS=1, FAIL=0 |

Note: rows 10–11 from the prior commit (`render-smoke-batch6-curation.mjs`, `assert-curated-117-evidence-matrix.mjs`, `QLLAW_BATCH6_SOURCE_RENDER_SMOKE.*`) were Batch 6 scope-creep; they have been removed from this Phase A commit and parked at `d:\Study\batch6-skeleton.patch` for Phase B to apply on its own branch.

## BM-006 status after Phase A

`PENDING_USER_DECISION`. Cursor does **not** decide. The user inspects:

- Source PDF: `.tmp-bm006-visual-pdf-review/BM-006/BM-006_normalized.pdf` (121557 B, 1 page)
- Generated PDF (post-calibration): `.tmp-bm006-visual-pdf-review/BM-006/BM-006.pdf` (130356 B, 1 page)
- Page PNGs: `.tmp-bm006-visual-pdf-review/BM-006/pages/{src,gen}_page_1.png`
- Pixel diff PNGs: `.tmp-bm006-visual-pdf-review/BM-006/diff/diff_page_1.png`
- Checklist: [`docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`](QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md)

User picks exactly one:

- **KEEP** — calibration is acceptable as-is. Re-run live `/forms/runtime/BM-006/preview-session` smoke when NestJS API + MariaDB docker + Clerk ticket are available; commit only if live render agrees.
- **REVERT** — restore `storage/templates/normalized-docx/BM-006/BM-006_normalized.docx` from `.tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx`, refresh `.tmp-docx-download-smoke/BM-006.docx` from the pre-calibration backup, re-apply Phase A asserts.
- **ADJUST** — edit `apply-bm006-top-right-template-calibration.mjs` `NEW.*` constants, re-run, repeat Phase A.

## Artifacts created or updated

New:
- `scripts/audit/bm006-visual-pdf-review.mjs` — BM-006 visual/PDF artifact builder (replaces ad-hoc BM-006 path inside batch3/4 with BM-006-specific harness)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json` — visual artifact
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md` — visual artifact
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md` — human reviewer checklist
- `docs/audit/unified-bm-workspace/QLLAW_BM006_END_TO_END_EVIDENCE_PHASE.latest.md` — this report
- `.tmp-bm006-visual-pdf-review/BM-006/` — page PNGs + diff PNGs + 2 PDFs

Batch 6 skeleton (parked for Phase B, NOT in this commit):
- `scripts/audit/render-smoke-batch6-curation.mjs` — preserved at `d:\Study\batch6-skeleton.patch`
- `scripts/audit/assert-curated-117-evidence-matrix.mjs` — preserved at `d:\Study\batch6-skeleton.patch`

Refreshed (deterministic regeneration, not source mutation):
- `.tmp-docx-download-smoke/BM-006.docx` — via `regenerate-bm006-runtime-docx.mjs` (sha `a0cf6a8821...fe554`, 101744 B)
- `.tmp-bm006-top-right-template-calibration/BM-006.docx` — pilot output
- `.tmp-bm006-top-right-template-calibration/BM-006_regen.json` — regenerate metadata

## Phase B (Batch 6) gating

Phase B is gated on the user's KEEP/REVERT/ADJUST call for the BM-006 visual artifact above. Cursor will not start Phase B until the user replies with the chosen decision.

Phase B will run on its own branch `feat/batch6-source-render-bm121-bm140` (cut from post-merge `feat/pr6g2-bm-final-audit-harness`), NOT inside this Phase A PR. The skeleton scripts are preserved at `d:\Study\batch6-skeleton.patch` and will be re-applied via `git apply ..\batch6-skeleton.patch` per the user's instructions. Phase B will not touch the Phase A commit, the Phase A artifacts, or the canary branch.

## Risks (carry-over)

- **R-BM006-1**: visual signoff pending — Phase A produced the artifact, user inspects.
- **R-EVIDENCE-1**: `assert-bm006-calibration-canary.mjs` still has empty `KNOWN_PRE_CALIBRATION_SHA`. Out of scope for Phase A (SAFE_NOW fix recommended in a separate PR).
- **R-EVIDENCE-2**: `status-matrix-213.mjs` standalone wipes apply-* evidence. Phase A re-runs `apply-all-current-evidence.mjs` before each assert pass; the guard test verifies this.
- **R-DIRTY-1/2/3/4**: pre-existing modifications not reviewed. Out of scope for Phase A.
- **R-RENDER-3**: orphan PDF process — DEFER.
- **Cursor commit trailer**: `git -c core.editor=true commit ...` used; verify with `git log -1 --format=%B` after commit.

## Files touched in Phase A

- New scripts: 3
- New artifacts: 5 (`*.json`+`*.md`+`checklist*.md` in `docs/audit/unified-bm-workspace/`)
- Refreshed runtime DOCX: `.tmp-docx-download-smoke/BM-006.docx`
- New render outputs: `.tmp-bm006-visual-pdf-review/BM-006/*.pdf` + `pages/*.png` + `diff/*.png`
- No source code in `apps/` touched
- No locked/compiled contract touched
- No DB / Prisma / migration touched
- No public API route path changed

## Next step (single, concrete)

User inspects `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md` and replies with **KEEP / REVERT / ADJUST**. Cursor waits.