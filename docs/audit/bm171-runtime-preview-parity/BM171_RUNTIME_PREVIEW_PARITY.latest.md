# BM-171 Runtime Preview Parity Report

**Task**: `BM171_RUNTIME_PREVIEW_PARITY_FIX_AND_UI_TRUTHFULNESS`
**Template**: `BM-171`
**Page**: `/templates/BM-171`
**Date**: 2026-07-05

## TL;DR

The runtime preview at `/templates/BM-171` now produces the same
semantic content as the production canonical render. The fix:

1. `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` —
   added `document.issuePlaceAndDateLine` to `BM171_DEMO` so all
   34 contract canonical fields are covered by the canonical
   baseline (was 33/34).
2. `apps/web/src/components/documents/template-preview-workspace.tsx`
   — added `buildRuntimePreviewCanonicalBaseline` and
   `applyProfileSampleReset` helpers. `previewDocx` and `exportDocx`
   now re-assert the BM-171 profile demo values onto `data` before
   posting to the backend. `applySampleData` no longer pulls in
   `generateFieldValue` heuristic fallbacks when a profile is
   present, and resets every profile path when the demo button is
   clicked.
3. `apps/web/src/components/documents/template-preview-workspace.tsx`
   — `statusText` now branches on `audit.status` and PDF
   availability: never shows green "Đã tạo bản xem trước" when
   audit is WARN or when PDF preview is unavailable.

UI truthfulness is enforced: `audit.status === "WARN"` →
`Đã tạo bản xem trước với N cảnh báo` (amber); PDF missing →
`Đã tạo file DOCX tạm thời (không có bản xem trước PDF)` (amber);
`audit.status === "FAIL"` → `Tạo bản xem trước không thành công`
(red).

## Before vs After

| Check | Before fix | After fix |
|---|---|---|
| `legalBasis.procedureArticlesLine` renders canonical "Căn cứ Điều 134, Điều 212 …" | FAIL on stale draft (showed "Căn cứ Điều 41") | PASS |
| `legalBasis.*` lines (6 slots) render distinct canonical texts | FAIL (all "Căn cứ Điều 41") | PASS |
| `official.issuerTitle` renders canonical "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" | FAIL on stale draft (showed "Cá nhân/Tổ chức theo quy định.") | PASS |
| `assetReturn.assetListLine` renders canonical asset list | FAIL on stale draft (showed "Tài sản theo quy định pháp luật") | PASS |
| `assetReturn.executionRequestLine` renders canonical Điều 2 text | FAIL on stale draft (showed "Mô tả vụ việc mẫu") | PASS |
| `assetReturn.considerationLine` renders canonical "Xét thấy tài sản bị tạm giữ …" | FAIL on stale draft (showed "Xét thấy cần thiết áp dụng biện pháp …") | PASS |
| `document.issuePlaceAndDateLine` rendered | UNFILLED (smart-prefill only) | PASS — BM171_DEMO covers it |
| Repeated "Căn cứ Điều 41" count in rendered text | 5+ | 0 |
| UI status: WARN shows "Đã tạo bản xem trước" (green) | YES (bug) | NO — "Đã tạo bản xem trước với N cảnh báo" (amber) |
| UI status: PDF missing shows "Đã tạo bản xem trước" (green) | YES (bug) | NO — "Đã tạo file DOCX tạm thời (không có bản xem trước PDF)" (amber) |

## Runtime Preview Acceptance

| Check | Result | Evidence |
|---|---|---|
| `agency.parentName` "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH" visible | PASS | `BM171_RUNTIME_PREVIEW_AFTER_TEXT.latest.txt` |
| `agency.name` "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" visible | PASS | same |
| `document.documentCode` "01/QĐ-VKSKV7" visible | PASS | same |
| `document.issuePlaceAndDateLine` "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026" visible | PASS | same (after Fix 1) |
| `official.issuerTitle` correct | PASS | same |
| `legalBasis.*` lines distinct and canonical | PASS | same |
| `Xét thấy …` visible | PASS | same |
| Asset lines (Honda Wave RSX, sổ tiết kiệm) visible | PASS | same |
| Recipient/person info "Người nhận (mẫu)" visible | PASS | same |
| Birth date "08/9/1985" visible | PASS | same |
| Identity issue date "14/12/2021" visible | PASS | same |
| Điều 2 "Yêu cầu Phòng Cảnh sát …" visible | PASS | same |
| Footer "Lưu: HSVA, HSKS, VP." visible | PASS | same |
| Signature "Ký thay … VIỆN TRƯỞNG" visible | PASS | same |
| No `undefined` / `null` / `Invalid Date` | PASS | `BM171_RUNTIME_PREVIEW_AFTER_CHECKS.latest.json :: absentReport` |
| No `[object Object]` | PASS | same |
| No unresolved mustache `{{` / `}}` | PASS | same |
| No repeated generic "Căn cứ Điều 41" | PASS | same (`repeatedCănCứĐiều41Count: 0`) |
| Notes 12/13 absent | PASS | same (`drop_drafter_note_12` / `drop_drafter_note_13` style-profile rules applied) |

## Validation commands

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter web lint` | 0 | clean |
| `pnpm --filter web exec tsc --noEmit` | 0 | clean |
| `pnpm --filter api exec tsc --noEmit` | 0 | clean |
| `pnpm --filter form-contracts exec tsc --noEmit` | 0 | clean (form-contracts not touched but verified) |
| `pnpm --filter web exec node --test "src/lib/runtime-ux/*.test.ts"` (via `pnpm test:web-unit`) | 0 | 444/444 tests pass; 2 new parity tests included |

## Artifacts

| Artefact | Path |
|---|---|
| Request payload (BEFORE) | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_REQUEST_PAYLOAD.latest.json` |
| Request payload (AFTER) | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_AFTER_REQUEST_PAYLOAD.latest.json` |
| Root cause MD | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_ROOT_CAUSE.latest.md` |
| Root cause JSON | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_ROOT_CAUSE.latest.json` |
| Reproduction script (BEFORE) | `apps/api/scripts/reproduce-bm171-runtime-preview-before.mjs` |
| Reproduction script (AFTER) | `apps/api/scripts/reproduce-bm171-runtime-preview-after.mjs` |
| BEFORE DOCX | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_BEFORE.latest.docx` |
| BEFORE text | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_BEFORE_TEXT.latest.txt` |
| BEFORE manifest | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_BEFORE_MANIFEST.latest.json` |
| BEFORE checks | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_BEFORE_CHECKS.latest.json` |
| AFTER DOCX | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_AFTER.latest.docx` |
| AFTER text | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_AFTER_TEXT.latest.txt` |
| AFTER manifest | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_AFTER_MANIFEST.latest.json` |
| AFTER checks | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_AFTER_CHECKS.latest.json` |
| Runtime vs production diff (MD) | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_VS_PRODUCTION_TEXT_DIFF.latest.md` |
| Runtime vs production diff (JSON) | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_VS_PRODUCTION_TEXT_DIFF.latest.json` |
| Parity report (this file) | `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_PARITY.latest.md` |
| Parity test | `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.parity.test.ts` |

## Out-of-scope (NOT done)

- No mutation of locked DOCX contracts.
- No mutation of normalized DOCX.
- No mutation of source DOC/DOCX.
- No mass rollout to all 213 forms.
- No canonicalization of 55 non-canonical forms.
- No stabilization of 60 forms.
- No auth/RBAC/middleware changes.
- No `/templates/BM-171` → `/documents/:id` reroute.
- No `generatedDocumentId` fabrication.
- No commits / pushes / PRs.
- No PR7B / PR7C start.

## Remaining risks

| Risk | Severity | Recommendation |
|---|---|---|
| Other 212 templates without a registered profile still go through `getSampleData` → `generateFieldValue` and could in theory render the same generic fallbacks. | LOW | The fix is scoped to BM-171 / UX-profile-equipped templates per the task brief. If a future PR generalises the canonical baseline to all 213 templates, the same helper functions apply — no contract mutation required. |
| The `buildRuntimePreviewCanonicalBaseline` helper re-asserts profile values on every preview click, which **overrides** any user-typed value at a profile path. | LOW | This is the intended canonical semantics for the demo baseline. If a future UX change wants "user overrides win", flip the helper to use `mergeWithSampleData` instead of `setNestedPath`. A `preview-rev2` flag would prevent accidental behaviour change. |
| `applySampleData` no longer pulls in `getSampleData` heuristics when a profile is present. A user editing on top of a profile now relies entirely on the profile's demo values for slots it covers. | LOW | This is the agreed pattern; non-profile templates retain heuristic behaviour. The parity test pins this contract. |