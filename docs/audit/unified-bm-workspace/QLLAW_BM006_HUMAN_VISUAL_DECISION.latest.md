# BM-006 Human Visual Decision — KEEP (Phase A, scoped)

| Field | Value |
|---|---|
| artifact | QLLAW_BM006_HUMAN_VISUAL_DECISION |
| snapshotDate | 2026-07-10T04:02:54.777Z |
| pilot_code | BM-006 |
| scope | BM-006_PHASE_A_ONLY |
| doNotApplyAsUnifiedDecision | true |
| decision | **KEEP** |
| reviewer | USER |
| reviewedAt | 2026-07-10T04:02:54.777Z |
| reviewedArtifact | `.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_OPEN_THIS.pdf` |
| comparedWith | `.tmp-bm006-review-v3-final/BM-006_SOURCE_NORMALIZED_V3_COMPARE.pdf` |

## Conclusion

**BM-006 v3 top-right calibration is visually acceptable for Phase A.**

## Rationale

- Top-right block now shows all 3 lines:
  - `Mẫu số 06/HS` (bold)
  - `Ban hành theo Thông tư số 03/2026/TT-VKSTC` (italic)
  - `Ngày 09/02/2026` (italic)
- No clipping, no forced wrap, no ugly truncation in the v3 generated PDF.
- No undefined tokens, no placeholder leaks, no double-punctuation (no `;;`, no `;,`).
- Body, signature, page number, date line, and recipient list all acceptable.
- Source normalized PDF has `{{...}}` placeholders by design — that is the unbound template, not a defect in the generated PDF.

## Geometry accepted

| Field | Value |
|---|---|
| posOffsetH | 3700000 EMU (~4.046") |
| posOffsetV | 85000 EMU (~0.093") |
| anchor cx | 2600000 EMU (~2.843") |
| anchor cy | 700000 EMU (~0.766") |
| inner cx | 2200000 EMU (~2.406") |
| inner cy | 600000 EMU (~0.656") |

## Limitations

- Live `/forms/runtime/BM-006/preview-session` endpoint was NOT exercised in this session. The visual comparison was performed against the offline PizZip+docxtemplater render equivalent used by the runtime pipeline.
- The decision is scoped to BM-006 Phase A only. It does not promote BM-006 to the FormFlight `runtimeReady` allowlist (BM-001 + BM-171 only).
- The decision does not constitute a global 77/97-form unified human decision.
- `FIDELITY_COMPLETE_EVIDENCED` remains false globally.

## Global fidelity (unchanged)

| Field | Value |
|---|---|
| `fidelityCompleteEvidenced` | false |
| `formFlightRuntimeReadyPromoted` | 0 |
| `inputConnectedPass` | 97 |
| `inputConnectedPartial` | 116 |

## Reviewer artifacts

- `OPEN_THIS`: `.tmp-bm006-review-v3-final/BM-006_GENERATED_V3_OPEN_THIS.pdf` (132081 bytes)
- `COMPARE_WITH`: `.tmp-bm006-review-v3-final/BM-006_SOURCE_NORMALIZED_V3_COMPARE.pdf` (123753 bytes)
- `DIFF_PNG`: `.tmp-bm006-review-v3-final/BM-006_DIFF_V3_page_1.png` (62448 bytes)

## Amendment plan

- Amend the current Phase A commit (HEAD = `307bf87d docs(audit): adjust BM006 top-right text-box geometry`).
- Stage only the allowed Phase A files (see companion JSON for the allowlist).
- Do not push, do not open PR, do not start Batch 6.

## Allowed to stage (Phase A only)

- `scripts/audit/apply-bm006-top-right-template-calibration.mjs`
- `scripts/audit/assert-bm006-top-right-template-calibration.mjs`
- `scripts/audit/bm006-visual-pdf-review.mjs`
- `apps/web/src/lib/runtime-ux/bm006-runtime-ux-profile.ts`
- `storage/templates/normalized-docx/BM-006/BM-006_normalized.docx`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.json`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_TOP_RIGHT_TEMPLATE_CALIBRATION.latest.md`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_END_TO_END_EVIDENCE_PHASE.latest.md`
- `docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.json`
- `docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.md`
- `docs/audit/unified-bm-workspace/QLLAW_BM006_HUMAN_VISUAL_DECISION.latest.json` (this file)
- `docs/audit/unified-bm-workspace/QLLAW_BM006_HUMAN_VISUAL_DECISION.latest.md` (this file)

## Not allowed to stage

- `.tmp-*`
- `apps/api/**`
- Batch 6 files
- `apps/web/src/components/documents/bm-XXX-form-inputs.tsx` (unrelated forms)
- `d:\Study\batch6-skeleton.patch`

## Notes

- This is a **scoped per-form human decision** for BM-006 Phase A. It does not constitute a global 77/97 unified human review.
- `FIDELITY_COMPLETE_EVIDENCED` remains false globally; this artifact does not change that.
- BM-006 remains OFF the FormFlight `runtimeReady` allowlist.
- The amendment is to the existing Phase A commit (307bf87d) so the v3 geometry change + the KEEP decision + the supporting evidence are recorded atomically in a single commit.
