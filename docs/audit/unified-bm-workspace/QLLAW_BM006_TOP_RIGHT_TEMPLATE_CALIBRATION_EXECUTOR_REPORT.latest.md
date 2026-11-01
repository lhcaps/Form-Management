# EXECUTOR REPORT — BM-006 TOP-RIGHT TEMPLATE CALIBRATION PILOT

**STATUS:** PARTIAL

**STATUS_NOTE:**
Surgical template calibration applied to BM-006 top-right text-box geometry (paragraph 0 of the normalized DOCX): pushed right ~0.93" (posOffsetH 3668395 → 4350000 EMU), pulled up ~0.08" (posOffsetV 109220 → 36000 EMU), reduced anchor wrap area (cx 2404110 → 1900000, cy 541655 → 380000), reduced inner text-box extent (cx 1475105 → 1200000, cy 450850 → 320000). All required text and font rules preserved (Times New Roman 8pt; bold for "Mẫu số 06/HS"; italic for "Ban hành..." and "Ngày 09/02/2026)"; jc=center). Body-level paragraphs (Ban hành/Ngày/national heading/signature/footer/articles) are byte-identical to pre-calibration. XML-property-level measurement (`scripts/audit/measure-top-right-promulgation-block.mjs`) now reports `EXACT_MATCH` between calibrated source and regenerated runtime DOCX. Page count unchanged (1 → 1). All 6 form-flight unit-test suites pass (765/765 tests). Curated 37/57/77 evidence matrices all `ok=true`. pnpm --filter web/api tsc --noEmit both exit 0.

STATUS is PARTIAL — not PASS — because the live `/forms/runtime/BM-006/preview-session` POST endpoint could not be re-invoked in this session (no NestJS API running, no MariaDB docker, no Clerk storage state). The runtime DOCX was regenerated via the offline equivalent (PizZip + docxtemplater, the exact same renderer code as `runtime-template-render.adapter.ts`), so the structural / XML-property result is trustworthy; visual review is still required from the user against the AFTER PDF (`docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.md` and `.tmp-bm006-top-right-template-calibration/after/pdf/BM-006.pdf`).

| Field | Value |
|---|---|
| PILOT_CODE | BM-006 |
| TEMPLATE_CHANGE_APPROVED_BY_USER | YES |
| FIX_APPLIED | YES |
| FIX_SCOPE | BM-006_ONLY |
| SOURCE_TEMPLATE_MUTATED | YES |
| NORMALIZED_TEMPLATE_MUTATED | YES |
| LOCKED_CONTRACT_MUTATED | NO |
| COMPILED_CONTRACT_MUTATED | NO |
| DB_MUTATED | NO |
| PRISMA_SCHEMA_MUTATED | NO |
| MIGRATIONS_CREATED | NO |
| PUBLIC_API_ROUTE_PATHS_CHANGED | NO |

---

## BEFORE_MEASUREMENT

- **posOffsetH** (`<wp:positionH relativeFrom="column"><wp:posOffset>`): `3668395` EMU (~3.828")
- **posOffsetV** (`<wp:positionV relativeFrom="paragraph"><wp:posOffset>`): `109220` EMU (~0.119")
- **anchor extent** (`<wp:extent cx cy>`): `cx=2404110` EMU (~2.628"), `cy=541655` EMU (~0.592")
- **inner text-box extent** (`<a:ext cx cy>`): `cx=1475105` EMU (~1.612"), `cy=450850` EMU (~0.493")
- **wrap type:** `wrapSquare`
- **font** (ascii/hAnsi/cs): `Times New Roman`
- **size:** `16` half-pt (8pt)
- **"Mẫu số 06/HS":** bold + jc=center
- **italic** for Ban hành/Ngày lines: present at body-level
- **page count:** 1

## AFTER_MEASUREMENT

- **posOffsetH:** `4350000` EMU (~4.757") — pushed right ~0.93"
- **posOffsetV:** `36000` EMU (~0.039") — pulled up ~0.08"
- **anchor extent:** `cx=1900000` EMU (~2.078"), `cy=380000` EMU (~0.416") — narrower/shorter wrap area (~21% / ~30% reduction)
- **inner text-box extent:** `cx=1200000` EMU (~1.312"), `cy=320000` EMU (~0.350") — narrower/shorter inner area
- **wrap type:** `wrapSquare` (unchanged)
- **font** (ascii/hAnsi/cs): `Times New Roman` (unchanged)
- **size:** `16` half-pt (unchanged)
- **"Mẫu số 06/HS":** bold + jc=center (unchanged)
- **italic** for Ban hành/Ngày lines: present (unchanged at body-level)
- **page count:** 1 (unchanged)

---

## VISUAL_BEFORE_AFTER

| State | Path | sha256 (first) | Size | Pages |
|---|---|---|---|---|
| BEFORE source DOCX | `.tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx` | `c990b43a...ca93db` | 23156 B | — |
| BEFORE generated DOCX | `.tmp-bm006-top-right-template-calibration/before/BM-006_PRE_CALIBRATION_GENERATED.docx` | `93ae8555...71005e` | 101745 B | — |
| BEFORE source PDF | `.tmp-bm006-top-right-template-calibration/before/pdf/BM-006_normalized.pdf` | — | 123757 B | 1 |
| BEFORE generated PDF | `.tmp-bm006-top-right-template-calibration/before/pdf/BM-006_PRE_CALIBRATION_GENERATED.pdf` | — | 132163 B | 1 |
| AFTER calibrated DOCX | `storage/templates/normalized-docx/BM-006/BM-006_normalized.docx` | `45e34095...77102f` | 23141 B | — |
| AFTER regenerated runtime DOCX | `.tmp-bm006-top-right-template-calibration/BM-006.docx` | `d9d03b38...29192` | 100566 B | — |
| AFTER PDF | `.tmp-bm006-top-right-template-calibration/after/pdf/BM-006.pdf` | — | 115878 B | 1 |
| AFTER canonical download | `.tmp-docx-download-smoke/BM-006.docx` | — | — | — |

All three PDFs contain "Mẫu số", "Ban hành", "Ngày 09/02/2026" text strings — no content regression.

---

| Field | Value |
|---|---|
| TOP_RIGHT_BLOCK_IMPROVED | SUBJECTIVE_REVIEW_NEEDED |
| BODY_LAYOUT_REGRESSION | NO |
| PAGE_COUNT_REGRESSION | NO |
| PREVIEW_SESSION_STATUS | NOT_RUN (API runtime not running in this session; offline render equivalent used in place) |
| DOCX_DOWNLOAD_STATUS | PASS (offline render equivalent passes PizZip/KiZip-byte / XML-property check; the regenerated DOCX is structurally equivalent to what the live `/forms/runtime/BM-006/preview-session` + `/forms/runtime/preview-sessions/{id}/docx` GET chain would produce — verified by reading `apps/api/src/modules/documents/rendering/infrastructure/docx-template-renderer.ts`, `runtime-preview-session.service.ts`, and `runtime-template-render.adapter.ts`; both use the same PizZip + docxtemplater path with `{{ }}` delimiters and `paragraphLoop: true, linebreaks: true`) |
| MACHINE_FIDELITY_STATUS | PASS (XML-property parity achieved: source template and regenerated runtime DOCX report `EXACT_MATCH` for jc, textBox geometry, run fonts, sizes, bold, italic — see `docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.json` verdict `EXACT_MATCH`, blocks `6/6`) |
| VISUAL_PDF_STATUS | PARTIAL (PDFs generated via LibreOffice for all three states; no page-count or content regression; but visual-vs-reference "is this closer to the expected legal layout" judgement requires the user) |
| LIFECYCLE_LEAKS | 0 |
| PLACEHOLDER_LEAKS | 0 |
| STALE_TOKEN_LEAKS | 0 |

---

## CANARY_RESULTS

| Code | Status | Regression |
|---|---|---|
| BM-001 | sha unchanged from pre-session dirty-tree baseline (`e2d1a2c60be3...`) | NONE |
| BM-171 | sha unchanged from pre-session dirty-tree baseline (`bbfd0720691e...`) | NONE |
| BM-015 | sha unchanged from pre-session dirty-tree baseline (`5a80fbb9038f...`) | NONE |
| BM-057 | sha unchanged from pre-session dirty-tree baseline (`4aa92cf8ac8a...`) | NONE |
| BM-076 | sha unchanged from pre-session dirty-tree baseline (`5df0e2bc86a9...`) | NONE |

Pre-existing baseline sha256 values were captured from the working-tree normalized DOCX at the moment this calibration started; no form-template other than BM-006 was edited.

---

## AGGREGATE COUNTERS

| Field | Value |
|---|---|
| TOTAL_INPUT_CONNECTED_PASS | 77 |
| TOTAL_INPUT_CONNECTED_PARTIAL | 136 |
| FIDELITY_COMPLETE_TRUE | 0 |
| FIDELITY_COMPLETE_EVIDENCED | FALSE |
| FORMFLIGHT_RUNTIME_READY_PROMOTED | 0 |
| COMMIT_CREATED | NO |
| GIT_PUSHED | NO |
| FILES_STAGED | NO |

---

## FILES_CHANGED

- `storage/templates/normalized-docx/BM-006/BM-006_normalized.docx` (modified — calibrated geometry: posOffsetH, posOffsetV, anchor extent, inner extent)
- `.tmp-docx-download-smoke/BM-006.docx` (refreshed — regenerated via offline render path equivalent so downstream audit scripts see the calibrated geometry)

Pre-existing working-tree modifications (NOT touched by this pilot — confirmed via `git status` diff scope to only my intended target):

- Many `M apps/web/src/components/documents/bm-XXX-form-inputs.tsx`
- `apps/api/src/...` (form-studio deletions, documents module edits)
- `.gitignore`, etc.

Those changes were already dirty before this session and are out of scope for the BM-006 pilot.

## ARTIFACTS_CREATED_OR_UPDATED

- `scripts/audit/apply-bm006-top-right-template-calibration.mjs` (NEW — surgical apply script with hard guards)
- `scripts/audit/regenerate-bm006-runtime-docx.mjs` (NEW — offline render equivalent of `/forms/runtime/BM-006/preview-session`)
- `scripts/audit/assert-bm006-top-right-template-calibration.mjs` (NEW — focused regression guard)
- `scripts/audit/assert-bm006-calibration-canary.mjs` (NEW — canary check for BM-001/171/015/057/076)
- `scripts/audit/build-bm006-top-right-template-calibration-artifact.mjs` (NEW — artifact writer)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json` (NEW — official artifact)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.md` (NEW — official artifact)
- `docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.{json,md}` (refreshed by re-running the measurement script)
- `.tmp-bm006-top-right-template-calibration/before/` (NEW — before backups: source DOCX, pre-calibration generated DOCX, measurement JSON+MD, before PDFs)
- `.tmp-bm006-top-right-template-calibration/after/` (NEW — after measurements: measurement JSON+MD, after PDF)
- `.tmp-bm006-top-right-template-calibration/BM-006.docx` (NEW — regenerated runtime DOCX)
- `.tmp-bm006-top-right-template-calibration/BM-006_regen.json` (NEW — regeneration metadata)

---

## VALIDATION_COMMANDS_RUN

| Command | Exit | Verdict | Summary |
|---|---|---|---|
| `node scripts/audit/apply-all-current-evidence.mjs` | 0 | PASS | Re-applied curated/batch3/batch4 evidence. Status matrix unchanged: 77 PASS / 136 PARTIAL |
| `node scripts/audit/assert-curated-37-evidence-matrix.mjs` | 0 | PASS | ok=true; allCuratedFlagsCorrect=true; noPartialLeakage=true |
| `node scripts/audit/assert-curated-57-evidence-matrix.mjs` | 0 | PASS | ok=true; batch3FidelityComplete=0; fidelityCompleteEvidenced=false |
| `node scripts/audit/assert-curated-77-evidence-matrix.mjs` | 0 | PASS | ok=true; batch4VisualPdfStatus=PARTIAL; batch4FidelityComplete=0 |
| `node scripts/audit/status-matrix-213.mjs` | 0 | PASS | 77 PASS / 136 PARTIAL / 0 FIDELITY_PENDING |
| `node scripts/audit/render-smoke-curated.mjs` | 0 | PASS | allPass=true across all curated 213 rows |
| `TARGET_CODES=BM-006 node scripts/audit/measure-top-right-promulgation-block.mjs` | 0 | PASS | BM-006: status=OK verdict=EXACT_MATCH blocks=6/6 |
| `TARGET_CODES=BM-006 node scripts/audit/assert-top-right-promulgation-block.mjs` | 0 | PASS | Total=1; PASS=1; FAIL=0 |
| `NODE_PATH=apps/api/node_modules node scripts/audit/assert-bm006-top-right-template-calibration.mjs` | 0 | PASS | geometry summary verified; run props preserved |
| `node scripts/audit/assert-bm006-calibration-canary.mjs` | 0 | PASS | BM-001/171/015/057/076 baselined; only BM-006 sha changed |
| `pnpm --filter web exec tsc --noEmit` | 0 | PASS | no diagnostics |
| `pnpm --filter api exec tsc --noEmit` | 0 | PASS | no diagnostics |
| `node --test apps/web/src/lib/form-flight/curated-runtime-ux-batch.guard.test.mjs` | 0 | PASS | 679/679 pass |
| `cd apps/web; node --test src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs` | 0 | PASS | 25/25 pass |
| `cd apps/web; node --test src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs` | 0 | PASS | 18/18 pass |
| `cd apps/web; node --test src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs` | 0 | PASS | 21/21 pass |
| `cd apps/web; node --test src/lib/form-flight/profile-registry-guard.test.mjs` | 0 | PASS | 10/10 pass |
| `cd apps/web; node --test src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs` | 0 | PASS | 12/12 pass |

---

## REMAINING_RISKS

- User has not yet visually inspected the calibrated BM-006 PDF (`docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.md` link → `.tmp-bm006-top-right-template-calibration/after/pdf/BM-006.pdf`).
- The live `/forms/runtime/BM-006/preview-session` endpoint was NOT exercised in this session; offline render equivalent used. If the live API renderer ever diverges from `docxtemplater` empty-bindings behavior on BM-006 (it currently doesn't), the live DOCX would need a separate smoke run.
- FIDELITY_COMPLETE_EVIDENCED remains false — visual fidelity for all 213 forms is still PARTIAL regardless of this calibration.
- The pre-existing working-tree (`apps/web/src/components/documents/bm-006-form-inputs.tsx`, etc) was dirty before this session; this pilot did not touch those files but they remain uncommitted.
- Applying this same calibration strategy to other affected forms requires per-form analysis (different text-box widths / page sizes / axis offsets); not a 1-line "apply everywhere" — the canary read-only check is purely a non-regression check on the canary set.

## NEXT_RECOMMENDED_PHASE

1. User visually approves BM-006 calibrated output and authorizes same calibration strategy for affected forms

(Because the structural & machine-fidelity checks all PASS and only visual human review remains. If the user rejects the visual, options 2 or 3 below become the next step.)

Open paths if user disagrees with the visual:

- 2. Adjust BM-006 calibration again (modify `apply-bm006-top-right-template-calibration.mjs` `NEW.*` values and re-run)
- 3. Revert BM-006 template calibration (re-copy `.tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx` over the calibrated source, refresh `.tmp-docx-download-smoke/BM-006.docx` from the pre-calibration backup)
- 4. Continue human review pack without template changes
- 5. Curate next large input-connected partial batch
- 6. Stop — user decision needed
