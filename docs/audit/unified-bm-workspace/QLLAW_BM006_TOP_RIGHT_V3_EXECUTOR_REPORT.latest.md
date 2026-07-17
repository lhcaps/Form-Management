# EXECUTOR REPORT — BM-006 TOP-RIGHT V3 REVIEW COPY

**STATUS:** PARTIAL

**STATUS_NOTE:**
Surgical template calibration re-applied to BM-006 top-right text-box geometry (paragraph 0 of the normalized DOCX) as a v3 ADJUST. Geometry delta from v2 → v3: posOffsetH 4250000 → 3700000 EMU (~0.601" leftward), posOffsetV 36000 → 85000 EMU (~0.054" down), anchor extent 2150000×480000 → 2600000×700000 EMU (~0.492" wider / ~0.241" taller wrap area), inner text-box extent 1500000×420000 → 2200000×600000 EMU (~0.766" wider / ~0.197" taller). All required text and font rules preserved (Times New Roman 8pt; bold for "Mẫu số 06/HS"; italic for "Ban hành theo Thông tư số 03/2026/TT-VKSTC" and "Ngày 09/02/2026)"; jc=center). Body-level paragraphs (Ban hành/Ngày/national heading/signature/footer/articles) are byte-identical to v2 and v1. XML-property-level measurement reports `EXACT_MATCH` between calibrated source and regenerated runtime DOCX. Page count unchanged (1 → 1). All 7 form-flight unit-test suites / guard tests pass. Curated 37/57/77/97 evidence matrices all `ok=true`. Status matrix 97/116 unchanged. pnpm tsc --noEmit (web and api) both exit 0.

STATUS is PARTIAL — not PASS — because the user has not yet visually compared v3 against v2 and source. The v3 generated PDF is in `.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_OPEN_THIS.pdf` ready for the user's KEEP/ADJUST/REVERT decision. The reported v2 finding ("v2 still looked unchanged / still clipped") is addressed at the geometry level — v3 is decisively more leftward, taller, and wider than v2. Whether the visual matches the user's expectation must be decided by the user.

| Field | Value |
|---|---|
| PILOT_CODE | BM-006 |
| CALIBRATION_VERSION | v3 |
| TEMPLATE_CHANGE_APPROVED_BY_USER | YES (v3 ADJUST authorized 2026-07-10) |
| FIX_APPLIED | YES (v3 geometry) |
| FIX_SCOPE | BM-006_ONLY |
| SOURCE_TEMPLATE_MUTATED | NO |
| NORMALIZED_TEMPLATE_MUTATED | YES (BM-006 working tree only) |
| LOCKED_CONTRACT_MUTATED | NO |
| COMPILED_CONTRACT_MUTATED | NO |
| DB_MUTATED | NO |
| PRISMA_SCHEMA_MUTATED | NO |
| MIGRATIONS_CREATED | NO |
| PUBLIC_API_ROUTE_PATHS_CHANGED | NO |
| V3_APPLIED_IN_WORKING_TREE | YES |
| COMMIT_AMENDED | NO |
| PUSHED | NO |
| PR_OPENED | NO |

---

## GEOMETRY_BEFORE_V2

- posOffsetH: 4250000 EMU
- posOffsetV: 36000 EMU
- anchor cx: 2150000 EMU
- anchor cy: 480000 EMU
- inner cx: 1500000 EMU
- inner cy: 420000 EMU

## GEOMETRY_AFTER_V3

- posOffsetH: 3700000 EMU (~4.046")
- posOffsetV: 85000 EMU (~0.093")
- anchor cx: 2600000 EMU (~2.843")
- anchor cy: 700000 EMU (~0.766")
- inner cx: 2200000 EMU (~2.405")
- inner cy: 600000 EMU (~0.656")

## V3_DELTA_FROM_V2

- posOffsetH: -550000 EMU (~0.601" leftward)
- posOffsetV: +49000 EMU (~0.054" down)
- anchor cx: +450000 EMU (~0.492" wider wrap area)
- anchor cy: +220000 EMU (~0.241" taller wrap area)
- inner cx:  +700000 EMU (~0.766" wider textbox)
- inner cy:  +180000 EMU (~0.197" taller textbox)

## V3 vs V2 RATIONALE

- posOffsetH pushed left enough that the right edge of the text-box should clear the page margin even with the wider anchor extent
- posOffsetV moved down to keep the top of the text-box away from the very edge of the page (avoids top clipping)
- anchor extent grown to give the wrap region enough room so the body content below is not pushed down by the text-box footprint
- inner text-box extent grown by ~0.77" width and ~0.20" height so the "Ban hành theo Thông tư số 03/2026/TT-VKSTC" line and the bottom/date line have room to lay out without forced wrapping or clipping

---

## VERIFICATION_SUMMARY

| Field | Value |
|---|---|
| TOP_RIGHT_CLIPPING_EXPECTED_TO_BE_REDUCED | YES (decisive v3 geometry delta from v2) |
| TOP_RIGHT_CLIPPING_FINAL | USER_REVIEW_NEEDED (visual human decision required) |
| BODY_LAYOUT_REGRESSION | NO |
| PAGE_COUNT_REGRESSION | NO (1 → 1) |
| TEXT_CONTENT_REGRESSION | NO (Mẫu số 06/HS, Ban hành, Ngày 09/02/2026 all preserved; run props preserved) |
| UNDEFINED_LEAKS | 0 |
| PLACEHOLDER_LEAKS | 0 |
| DOUBLE_PUNCTUATION_LEAKS | 0 (no `;;`, no `;,` introduced) |
| AGENCY_TEXT_PRESENT | YES |
| SIGNATURE_TEXT_PRESENT | YES |
| BM006_MACHINE_FIDELITY_STATUS | PASS (`EXACT_MATCH` blocks=6/6) |
| BM006_VISUAL_PDF_STATUS | PARTIAL_PENDING_USER_REVIEW |
| TOTAL_INPUT_CONNECTED_PASS | 97 |
| TOTAL_INPUT_CONNECTED_PARTIAL | 116 |
| FIDELITY_COMPLETE_EVIDENCED | FALSE |
| FORMFLIGHT_RUNTIME_READY_PROMOTED | 0 |
| BATCH6_FILES_INCLUDED | NO |
| SOURCE_DOCX_MUTATED | NO |
| NORMALIZED_DOCX_MUTATED | YES, BM-006 working tree only |
| LOCKED_CONTRACTS_MUTATED | NO |
| COMPILED_CONTRACTS_MUTATED | NO |
| DB_MUTATED | NO |
| PRISMA_SCHEMA_MUTATED | NO |
| MIGRATIONS_CREATED | NO |
| PUBLIC_API_ROUTE_PATHS_CHANGED | NO |
| RUNTIME_UX_BM006_PROFILE_EDITED | NO (per STRICT SCOPE) |

---

## CLEAR_REVIEW_FOLDER

`.tmp-bm006-review-v3-final/`

## OPEN_THIS_FILE

`.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_OPEN_THIS.pdf`

## COMPARE_WITH

`.tmp-bm006-review-v3-final/BM-006_SOURCE_NORMALIZED_V3_COMPARE.pdf`

## ARTEFACT_FILES

- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json` (refreshed by v3 apply + artifact build)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.md` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.json` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.md` (refreshed)

---

## VALIDATION_COMMANDS_RUN

| Command | Exit | Verdict | Summary |
|---|---|---|---|
| `node scripts/audit/apply-bm006-top-right-template-calibration.mjs` | 0 | PASS | v3 geometry applied to `BM-006_normalized.docx` (before sha=0d44ad5e...; after sha=b83c42ad...; same byte length 23140) |
| `node scripts/audit/regenerate-bm006-runtime-docx.mjs` | 0 | PASS | runtime DOCX regenerated from v3 source (output sha=98423094...; 15 bindings applied) |
| `node scripts/audit/assert-bm006-top-right-template-calibration.mjs` | 0 | PASS | v3 geometry matches EXPECTED for source + regen; bold+TimesNewRoman+sz16+jc=center preserved |
| `node scripts/audit/assert-bm006-calibration-canary.mjs` | 0 | PASS | canary forms BM-001/171/015/057/076 sha unchanged vs HEAD; only BM-006 sha changed |
| `node scripts/audit/bm006-visual-pdf-review.mjs` | 0 | PASS | visual status PARTIAL_PENDING_USER_REVIEW; pixel diff 5.12% page 1; status downstream invariants preserved |
| `node scripts/audit/build-bm006-top-right-template-calibration-artifact.mjs` | 0 | PASS | artifact JSON+MD refreshed with v3 geometry |
| `TARGET_CODES=BM-006 node scripts/audit/measure-top-right-promulgation-block.mjs` | 0 | PASS | verdict=EXACT_MATCH blocks=6/6 |
| `node scripts/audit/curated-37-golden-layout-fidelity.mjs` | 0 | PASS | ok, allPass |
| `node scripts/audit/status-matrix-213.mjs` | 0 | PASS | 97 PASS / 116 PARTIAL / 0 FIDELITY_PENDING |
| `node scripts/audit/apply-all-current-evidence.mjs` | 0 | PASS | 97/116 preserved; bm006CalibrationStateChanged=false (for status matrix write-back) |
| `node scripts/audit/assert-curated-37-evidence-matrix.mjs` | 0 | PASS | ok=true; allCuratedFlagsCorrect=true; noPartialLeakage=true |
| `node scripts/audit/assert-curated-57-evidence-matrix.mjs` | 0 | PASS | ok=true; batch3FidelityComplete=0; fidelityCompleteEvidenced=false |
| `node scripts/audit/assert-curated-77-evidence-matrix.mjs` | 0 | PASS | ok=true; batch4VisualPdfStatus=PARTIAL; batch4FidelityComplete=0 |
| `node scripts/audit/assert-curated-97-evidence-matrix.mjs` | 0 | PASS | ok=true; bm006CalibrationStateChanged=false |
| `node scripts/audit/render-smoke-curated.mjs` | 0 | PASS | allPass=true across all curated 213 rows |
| `node scripts/audit/render-smoke-batch5-curation.mjs` | 0 | PASS | allPass for batch5 candidates |
| `node --test scripts/audit/status-matrix-preserves-evidence.guard.test.mjs` | 0 | PASS | 1/1 |
| `node --test scripts/audit/assert-bm006-calibration-canary.guard.test.mjs` | 0 | PASS | 1/1 |
| `node --test apps/web/src/lib/form-flight/runtime-preview-session-contract.guard.test.mjs` | 0 | PASS | 2/2 |
| `pnpm --filter web exec tsc --noEmit` | 0 | PASS | no diagnostics |
| `pnpm --filter api exec tsc --noEmit` | 0 | PASS | no diagnostics |

---

## FILES_CHANGED_WORKING_TREE

Pre-existing dirty tree (NOT caused by v3 — was dirty at start of session before v3 work):

- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json` (refreshed by v3 apply + artifact build)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.md` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md` (refreshed)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md` (refreshed)
- `scripts/audit/apply-bm006-top-right-template-calibration.mjs` (v2 → v3 NEW values)
- `scripts/audit/assert-bm006-top-right-template-calibration.mjs` (v2 → v3 EXPECTED values)
- `storage/templates/normalized-docx/BM-006/BM-006_normalized.docx` (v2 → v3 geometry; same byte length 23140)

New (untracked) — created by v3 session:

- `.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_OPEN_THIS.pdf` (132081 B)
- `.tmp-bm006-review-v3-final/BM-006_SOURCE_NORMALIZED_V3_COMPARE.pdf` (123753 B)
- `.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_page_1.png` (48750 B)
- `.tmp-bm006-review-v3-final/BM-006_SOURCE_V3_page_1.png` (34856 B)
- `.tmp-bm006-review-v3-final/BM-006_DIFF_V3_page_1.png` (62448 B)
- `.tmp-bm006-review-v3-final/README.txt` (v3 review instructions)

Also refreshed (untracked — present from previous v2 session):

- `docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.{json,md}`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION_EXECUTOR_REPORT.latest.md` (v2)

## FILES_STAGED

NO — no files added to index.

---

## REMAINING_RISKS

- User has not yet visually inspected the v3 calibrated BM-006 PDF (`.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_OPEN_THIS.pdf`).
- If the v3 visual still shows wrapping/clipping, the next step would be a v4 ADJUST (further leftward / wider / taller), or accept that the v3 geometry is the right shape and the remaining issue is textbox-relative-to-margin rather than textbox-relative-to-content.
- The live `/forms/runtime/BM-006/preview-session` endpoint was NOT exercised in this session; offline render equivalent used. The runtime DOCX and PDF were generated through the same `PizZip` + `docxtemplater` path used by `apps/api/src/modules/documents/rendering/infrastructure/docx-template-renderer.ts` and `runtime-template-render.adapter.ts`.
- FIDELITY_COMPLETE_EVIDENCED remains false — visual fidelity for all 213 forms is still PARTIAL regardless of this calibration.
- The pre-existing working-tree dirt in other files (apps/web/src/components/documents/bm-XXX-form-inputs.tsx, form-studio deletions, etc.) was dirty before this session and remains out of scope for the BM-006 v3 ADJUST.
- v3 has NOT been amended into a commit. If the user says KEEP, the next step is to amend the BM-006 v2 commit with v3 changes and re-push. If the user says REVERT, the v2 commit is left intact and the v3 changes are dropped (or, alternatively, reverted to v1 = original).
- If the v3 generated PDF is byte-identical to v2's generated PDF (because LibreOffice's renderer ignores the inner `<a:ext>` extent and only honors the `<wp:extent>`), then the next round of investigation must look at why the renderer does not honor the inner extent — but that hypothesis is unlikely to be true because the v2 → v3 changes are large and the diff PNG shows 5.12% pixel difference.

## NEXT_RECOMMENDED_PHASE

1. **STOP — user decision needed.** Open `.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_OPEN_THIS.pdf` and compare with `.tmp-bm006-review-v3-final/BM-006_SOURCE_NORMALIZED_V3_COMPARE.pdf`. Then say one of:

   - **KEEP** — v3 geometry is acceptable. Proceed to amend the v2 commit with v3 changes.
   - **ADJUST v4** — v3 geometry still not acceptable. Specify new v4 values (more left? more wide? different anchor?).
   - **REVERT** — v3 (or all) is unacceptable. Restore the v2 (or original pre-v1) geometry and roll back the working-tree DOCX to the committed version.
   - **STOP** — halt the calibration work entirely; do not amend, do not roll back.

2. Do NOT amend, push, or open a PR until the user picks KEEP, ADJUST, or REVERT.
