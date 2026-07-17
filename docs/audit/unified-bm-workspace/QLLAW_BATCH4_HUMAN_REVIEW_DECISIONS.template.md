# QLLAW Batch 4 — Human Visual Review Decision Template

> **Purpose**: Empty template for a human reviewer to record per-form visual review decisions.
> **Do not modify this template file**. Fill the companion JSON file:
> `docs/audit/unified-bm-workspace/QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.input.json`
> (mirrors `QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.template.json`).
>
> **Strict rule**: Do not mark PASS unless source.pdf and generated.pdf are visually
> acceptable side-by-side. AI / Cursor / tool output must NEVER be used as human signoff.

## Scope

- **Batch**: Batch 4 (20 forms)
- **Scope**: visual / PDF human review
- **Source PDF**: `.tmp-batch4-visual-pdf-review/<code>/<code>_normalized.pdf`
- **Generated PDF**: `.tmp-batch4-visual-pdf-review/<code>/<code>.pdf`

> Note: PDF filenames in this Batch are `<code>_normalized.pdf` and `<code>.pdf`,
> not literally `source.pdf` / `generated.pdf`. The visual review checklist artifact
> uses the same naming. Both files exist for every Batch 4 code (verified in Phase 1).

## Allowed decision values

- `PASS` — all nine criteria below are true. Reviewer/reviewedAt required. Notes optional.
- `FAIL` — visual fidelity unacceptable. Reviewer/reviewedAt required. Notes must explain failure.
- `UNCERTAIN` — reviewer cannot decide. Reviewer/reviewedAt required. Notes must explain uncertainty or tooling concern.

## Required criteria (all nine must be true for PASS)

| # | Criterion | Description |
|---|---|---|
| 1 | `samePageCount` | source.pdf and generated.pdf have the same number of pages |
| 2 | `headerLooksCorrect` | Vietnamese agency header looks correct (Viện Kiểm sát nhân dân) |
| 3 | `titleLooksCorrect` | form title looks correct (Quyết định / Biên bản / Báo cáo …) |
| 4 | `bodyLayoutLooksCorrect` | body / paragraph layout not collapsed or garbled |
| 5 | `tablesLookCorrect` | tables (if present) have correct rows, columns, borders |
| 6 | `footerSignatureLooksCorrect` | signature blocks in correct position |
| 7 | `noMissingTextVisible` | no obvious missing text (blank where text should be) |
| 8 | `noObviousOverflowOrClipping` | no obvious overflow, clipping, or off-page content |
| 9 | `acceptableForLegalDemo` | overall acceptable for a legal-demo render |

## Per-form decision table

| Code | Source PDF | Generated PDF | Decision | Reviewer | Reviewed At | Notes |
|---|---|---|---|---|---|---|
| BM-076 | `.tmp-batch4-visual-pdf-review/BM-076/BM-076_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-076/BM-076.pdf` | UNCERTAIN |  |  |  |
| BM-078 | `.tmp-batch4-visual-pdf-review/BM-078/BM-078_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-078/BM-078.pdf` | UNCERTAIN |  |  |  |
| BM-080 | `.tmp-batch4-visual-pdf-review/BM-080/BM-080_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-080/BM-080.pdf` | UNCERTAIN |  |  |  |
| BM-081 | `.tmp-batch4-visual-pdf-review/BM-081/BM-081_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-081/BM-081.pdf` | UNCERTAIN |  |  |  |
| BM-083 | `.tmp-batch4-visual-pdf-review/BM-083/BM-083_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-083/BM-083.pdf` | UNCERTAIN |  |  |  |
| BM-084 | `.tmp-batch4-visual-pdf-review/BM-084/BM-084_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-084/BM-084.pdf` | UNCERTAIN |  |  |  |
| BM-085 | `.tmp-batch4-visual-pdf-review/BM-085/BM-085_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-085/BM-085.pdf` | UNCERTAIN |  |  |  |
| BM-086 | `.tmp-batch4-visual-pdf-review/BM-086/BM-086_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-086/BM-086.pdf` | UNCERTAIN |  |  |  |
| BM-087 | `.tmp-batch4-visual-pdf-review/BM-087/BM-087_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-087/BM-087.pdf` | UNCERTAIN |  |  |  |
| BM-088 | `.tmp-batch4-visual-pdf-review/BM-088/BM-088_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-088/BM-088.pdf` | UNCERTAIN |  |  |  |
| BM-090 | `.tmp-batch4-visual-pdf-review/BM-090/BM-090_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-090/BM-090.pdf` | UNCERTAIN |  |  |  |
| BM-091 | `.tmp-batch4-visual-pdf-review/BM-091/BM-091_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-091/BM-091.pdf` | UNCERTAIN |  |  |  |
| BM-092 | `.tmp-batch4-visual-pdf-review/BM-092/BM-092_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-092/BM-092.pdf` | UNCERTAIN |  |  |  |
| BM-093 | `.tmp-batch4-visual-pdf-review/BM-093/BM-093_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-093/BM-093.pdf` | UNCERTAIN |  |  |  |
| BM-094 | `.tmp-batch4-visual-pdf-review/BM-094/BM-094_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-094/BM-094.pdf` | UNCERTAIN |  |  |  |
| BM-095 | `.tmp-batch4-visual-pdf-review/BM-095/BM-095_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-095/BM-095.pdf` | UNCERTAIN |  |  |  |
| BM-096 | `.tmp-batch4-visual-pdf-review/BM-096/BM-096_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-096/BM-096.pdf` | UNCERTAIN |  |  |  |
| BM-097 | `.tmp-batch4-visual-pdf-review/BM-097/BM-097_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-097/BM-097.pdf` | UNCERTAIN |  |  |  |
| BM-098 | `.tmp-batch4-visual-pdf-review/BM-098/BM-098_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-098/BM-098.pdf` | UNCERTAIN |  |  |  |
| BM-100 | `.tmp-batch4-visual-pdf-review/BM-100/BM-100_normalized.pdf` | `.tmp-batch4-visual-pdf-review/BM-100/BM-100.pdf` | UNCERTAIN |  |  |  |

## How to fill the JSON

1. Copy `QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.template.json` to
   `QLLAW_BATCH4_HUMAN_REVIEW_DECISIONS.input.json`.
2. For each decision, fill:
   - `reviewer`: human identifier (display name or initials). NOT "ai" / "cursor" / "gpt" / "tool".
   - `reviewedAt`: ISO-8601 timestamp (e.g. `2026-07-09T04:30:00Z`).
   - `decision`: `PASS`, `FAIL`, or `UNCERTAIN`.
   - `criteria`: set all nine booleans to `true` for PASS, or record the failing ones for FAIL/UNCERTAIN.
   - `notes`: explain failure (FAIL) or uncertainty (UNCERTAIN).
3. Do not add or remove decisions. Do not change codes.
4. Save the file. The Cursor executor will validate and apply on the next phase run.

## What the apply script will do (and will NOT do)

- WILL: set `humanReviewStatus` to PASS/FAIL/UNCERTAIN per form.
- WILL: set `visualPdfReviewStatus` to PASS_HUMAN_REVIEWED / FAIL_HUMAN_REVIEWED / PARTIAL_HUMAN_REVIEW_REQUIRED.
- WILL: set `fidelityComplete=true` ONLY for forms with explicit human PASS.
- WILL NOT: change any existing 37 or Batch 3 row.
- WILL NOT: change counts (INPUT_CONNECTED_PASS=77, PARTIAL=136).
- WILL NOT: promote any form into FormFlight runtimeReady allowlist.
- WILL NOT: mutate source / normalized / locked / compiled DOCX.
- WILL NOT: mutate DB / Prisma schema / migrations.
- WILL NOT: change runtime routes.
- WILL NOT: set global `FIDELITY_COMPLETE_EVIDENCED=true` (only Batch 4 partial evidence is updated).

## Remaining global gates (unchanged by this batch)

- Existing 37 forms still require human review before global fidelityComplete.
- Batch 3 still requires visual/PDF review + human review.
- Global FIDELITY_COMPLETE_EVIDENCED remains false unless all 77 forms are cleared.
- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
- strict audit-213 PASS remains 2 by design.
