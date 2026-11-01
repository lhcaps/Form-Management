# BM-001 Template Runtime Visual Target

> Phase: **BM-001 TEMPLATE RUNTIME VISUAL PARITY + GENERALIZABLE RUNTIME-READY FORM CONTRACT**
> Generated: 2026-07-07
> Status: **PASS**

## 1. Goal

After this phase, `http://localhost:3000/templates/BM-001` renders the
**same visible runtime-ready input-panel pattern** that
`/templates/BM-171` renders today, while keeping BM-171 unchanged and
keeping all 211 skeletons fail-closed.

## 2. Visible behaviour

- `/templates/BM-001` shows a clean legal-document input surface with
  BM-001 fields/sections (not BM-171 fields, not raw locked-contract
  text with `person.fullName` placeholder).
- Page header reads:
  `Biên bản tiếp nhận nguồn tin về tội phạm`
  (the locked contract `templateTitle`, surfaced by
  `BM001_FORM_FLIGHT_PROFILE.title`).
- Section titles render via the new BM-001 runtime-ux profile:
  1. Thông tin chung biên bản
  2. Người tiếp nhận
  3. Người cung cấp nguồn tin
  4. Căn cứ pháp lý / tài liệu
  5. Nội dung tiếp nhận
  6. Ký ban hành
- Field labels are in clean Vietnamese legal wording (e.g. `Họ và tên`,
  `Số CCCD`, `Ngày cấp CCCD`, `Nội dung nguồn tin`).
- Dates use the existing `<input type="date">` pattern (renderer maps
  ISO → DD/MM/YYYY on write-back) — locked contract unchanged.
- A "Kiểm tra nhanh nội dung chính" summary card mirrors the BM-001
  `summaryLines` (Thời gian / Người tiếp nhận / Người cung cấp /
  Nội dung nguồn tin / Tài liệu giao nộp / Thời gian kết thúc /
  Chữ ký / Dòng lưu hồ sơ).

## 3. Lifecycle bound

- `/templates/BM-001` MUST NOT require `generatedDocumentId`.
- `/templates/BM-001` MUST NOT call `saveDocumentFormInputs` or the
  generated-document save endpoint.
- `/templates/BM-001` preview remains the runtime preview lifecycle
  (`createRuntimePreviewSession`).
- The generated-document workspace `/documents/:id` keeps its existing
  behaviour; this phase does not change `GeneratedDocumentWorkspace`.

## 4. Demo / sample / reset alignment

The legacy `fillCustomerSample` button has already been patched in a
previous phase so its sample values match `BM001_DEMO`. This phase
extends that pattern to the runtime-ux profile's `demo:` so the
"Dữ liệu demo" button in the workspace, and the runtime-ux profile
sample reset, both use:

- Receiver: `Nguyễn Thị Mai`
- Informant: `Trần Văn Bình`
- Birth year: `1985`
- Reception: `04/03/2026` at VKS Khu vực 7
- Issue place/date line: `Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026`
- Archive line: `Lưu: HSVA, HSKS, VP.`

### Forbidden in fresh/demo path

The following stale values MUST NOT appear on a clean browser context at
`/templates/BM-001`:

- `Nguyễn Văn A` — the legacy `getSampleData(...)` `person.fullName`
- `Trần Thị B` — the legacy `informant.fullName` / `reporter.fullName`
- `1980` — the legacy `informant.birthYear` / `reporter.birthYear`
- `Ông  cung cấp` — the legacy `crimeReport.content` two-space bug
- `Nguyễn Thị Hồng Hạnh` — legacy receiver-name stale fallback

### How the fix actually removes stale defaults

The workspace's `applySampleData()` already prefers `uxProfile.demo`
over the generic `getSampleData(...)` heuristic (lines 526–553 of
`template-preview-workspace.tsx`). Once a BM-001 `RuntimeUxProfile` is
registered, `uxProfile.demo` is non-empty, so the heuristic is skipped
on demo/reset clicks.

For a clean browser context, the existing `loadStoredDraft(...)` returns
`null` and the workspace starts from `{}`. The "Dữ liệu demo" button is
the only explicit way the workspace produces user-visible defaults; with
the BM-001 `RuntimeUxProfile`, that path resolves to BM-001 demo values.

The `Xóa bản nháp` button (already in the workspace footer) clears the
localStorage draft if the operator wants to start clean.

## 5. Out of scope

- BM-002 visual fix (out of scope this phase)
- Generalizing the contract to all 213 forms (out of scope)
- Touching `bm-001-form-inputs.tsx` legacy UI (out of scope)
- Touching BM-171 source (out of scope)
- Touching any skeleton profile (out of scope)
- DB / schema / migration / route path / contract mutation (out of scope)

## 6. Acceptance

This target is satisfied when:

- `/templates/BM-001` no longer matches the legacy screenshot
- The visible UI matches the BM-171 visible pattern at the same level
  of polish (section grouping, field labelling, summary card, demo reset)
- No forbidden values appear in fresh/demo path
- BM-171 remains visually unchanged
- `/templates/BM-002` remains fail-closed / generic fallback

These checks are automated by the two new guard tests:

- `bm001-template-runtime-visual.guard.test.mjs` (14 assertions)
- `runtime-ready-template-panel-contract.guard.test.mjs` (12 assertions)
