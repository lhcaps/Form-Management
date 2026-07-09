# QLLAW BM-006 — Visual / PDF Review CHECKLIST (Phase A)

> **Generated**: 2026-07-09T21:05:23.346Z
> **STATUS**: PARTIAL_PENDING_USER_REVIEW

## Files to inspect (open in your viewer)

- Source PDF: `D:/Study/Project/QLLaw-main/.tmp-bm006-visual-pdf-review/BM-006/BM-006_normalized.pdf`
- Generated PDF (post-calibration): `D:/Study/Project/QLLaw-main/.tmp-bm006-visual-pdf-review/BM-006/BM-006.pdf`
- Page PNGs (source): `D:/Study/Project/QLLaw-main/.tmp-bm006-visual-pdf-review/BM-006/pages/src_page_*.png`
- Page PNGs (generated): `D:/Study/Project/QLLaw-main/.tmp-bm006-visual-pdf-review/BM-006/pages/gen_page_*.png`
- Pixel diff PNGs: `D:/Study/Project/QLLaw-main/.tmp-bm006-visual-pdf-review/BM-006/diff/diff_page_*.png`

## Reviewer's checklist

Tick each line if true, leave blank if not. If any line is not ticked, the decision is ADJUST or REVERT (not KEEP).

- [ ] Source PDF and Generated PDF have the same page count.
- [ ] Top-right text-box "Mẫu số 06/HS" is positioned closer to the right edge in Generated than in Source (calibration goal).
- [ ] Body content (Ban hành / Ngày / national heading / signature / footer / articles) is byte-identical between Source and Generated at body level.
- [ ] No content regression (no missing paragraphs, no swapped text, no extra leaks).
- [ ] Title alignment, bold/italic, font (Times New Roman), size (8pt for top-right) all preserved.
- [ ] Page count unchanged (1 page).

## Decision

Pick exactly one of the three below. Cursor will NOT pick for you.

- [ ] **KEEP** — calibration is acceptable as-is. Next step: re-run the live `/forms/runtime/BM-006/preview-session` smoke when NestJS API + MariaDB docker + Clerk ticket are available, then commit only if live render agrees.
- [ ] **REVERT** — calibration is not acceptable. Next step: restore `storage/templates/normalized-docx/BM-006/BM-006_normalized.docx` from `.tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx`, refresh `.tmp-docx-download-smoke/BM-006.docx` from the pre-calibration backup, re-apply Phase A asserts.
- [ ] **ADJUST** — calibration is on the right track but the geometry needs more tuning. Next step: edit `apply-bm006-top-right-template-calibration.mjs` `NEW.*` constants, re-run, repeat Phase A.

## Why this checklist exists

Per AGENTS.md and `.cursor/rules/00-meta.mdc` §1, fidelity `KEEP` requires an explicit human visual decision. Machine checks (XML-property parity, geometry `EXACT_MATCH`, page-count parity, no placeholder leaks) are necessary but not sufficient. The revert path is fully prepared at `.tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx` so REVERT is one command away.

