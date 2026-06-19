# BM-001 Human Review Report

## Scope

Review the latest BM-001 DOCX produced by the shared full-package renderer before active cutover.

The review must use Microsoft Word. Structural OOXML checks and automated smoke results do not replace this review.

## Review Environment

- Reviewer: BM-001 product owner (human review via Microsoft Word)
- Review date: 2026-06-20
- Microsoft Word version: Microsoft Word (local install)
- Operating system: Windows
- Source commit: `07301ed` (`feat(renderer): harden BM-001 shadow renderer readiness`)
- Reviewed artifacts (latest smoke run, 2026-06-19T22:36 local):
  - `storage\generated\shadow-renders\BM-001\01-basic-valid-2026-06-19T22-36-11-979Z\contract.docx` (116,241 bytes; SHA-256 `98207EE92989F8014397AB3583605EFB521121A657433A52B782BCB025C8957F`)
  - `storage\generated\shadow-renders\BM-001\02-long-source-report-2026-06-19T22-36-11-992Z\contract.docx` (116,765 bytes; SHA-256 `14B277B19C396014D30774BC429705EA194EAA656CCD0710BF1FCD3E2D7604DC`)
  - `storage\generated\shadow-renders\BM-001\04-missing-optional-fields-2026-06-19T22-36-12-016Z\contract.docx` (116,205 bytes; SHA-256 `74B801E101FCC4804C54F0F882C2B1352FFCAEEC98B0F5FC30EA888357041CB3`)
  - `storage\generated\shadow-renders\BM-001\05-vietnamese-diacritics-and-addresses-2026-06-19T22-36-12-025Z\contract.docx` (116,473 bytes; SHA-256 `066888F35C243F28B271574439CA95FD5DD2CB2020B85EE3008A4A5C67C21AB0`)
- Manifest/rendered SHA-256: per file above. Full-package integrity PASS for 5/5 scenarios per `pnpm smoke:bm001-shadow-render`.
- Reference UI artifact: `bm01.pdf` (6-page UI export, used for form-field coverage review only — not a legal PDF).

## Overall Disposition

- DOCX visual review: **Conditional pass**
- Automated renderer readiness: **Pass** (`pnpm check:bm001-cutover` → Automated ready YES)
- Human active approval: **Not yet** (this report)
- Two-page layout: **OK**. BM-001 source is 1 blank page, but filled documents legitimately flow to 2 pages once address / long source content / attached items / signature block are populated. Scenario 02-long-source-report in particular must flow to page 2 — forcing single-page would break BM-001 font/spacing standards.

## Visual and Format Review

| Check | Result | Notes |
|---|---|---|
| File opens without repair warning | OK | All 4 DOCX files open cleanly in Word, no repair prompt. |
| Times New Roman baseline 13pt | OK | Body baseline correct. |
| Agency header content and alignment | OK | Header cơ quan/quốc hiệu ở đúng vị trí. |
| `KHU VỰC 7` bold and underline placement | OK | |
| Legal basis line 8pt | OK | |
| Quốc hiệu 13pt | OK | |
| `Độc lập - Tự do - Hạnh phúc` 14pt and underline width | OK | |
| Issue date italic 14pt | OK | |
| Main title and subtitle bold 14pt | OK | |
| Signature titles and spacing | OK | Khu vực chữ ký không lệch. |
| Archive/recipient area | OK | Dòng `Lưu: Hồ sơ vụ án, VP VKS.` xuất hiện đúng kiểu BM-001, không bị ép thành `Nơi nhận`. |
| Page number behavior | OK | |
| Different First Page behavior | OK | Trang 1 không hiện số trang, trang 2 hiện số 2. |
| Vietnamese text and diacritics | OK | Tiếng Việt hiển thị đầy đủ dấu, không lỗi font. |
| No clipping, overlap, or unexpected page break | Conditional | Layout tổng thể ổn, nhưng 3 blocker dưới đây cần xử lý. |
| Top-right `Mẫu số 01/HS...` note visibility | **Blocker 3** | Trong Word trông rất nhạt. Cần xác nhận lại bằng Print Preview / export PDF nền trắng trước khi in chính thức; nếu in ra vẫn mờ thì phải chỉnh màu/font. |
| Legal-content color (e.g. `Tôi: ...` line) | **Blocker 1** | Dòng `Tôi: [tên người tiếp nhận]` xuất hiện màu đỏ. Văn bản biểu mẫu pháp lý không được render field chính bằng màu đỏ trừ khi mẫu gốc yêu cầu. Cần loại trừ khả năng Track Changes / Review markup / dark-mode artifact trước; nếu màu thật của file thì phải fix template/style binding. |
| Source-template instructional footnotes | **Blocker 2** | Ảnh mẫu gốc có footnote/chú thích cuối trang kiểu `Ghi tên Viện kiểm sát...`, `Mẫu này dùng trong trường hợp...`, `Ghi họ tên người tiếp nhận...`. Bản render đã filled không còn phần footnote này. Cần quyết định policy sản phẩm: filled document được phép bỏ footnote hướng dẫn (OK, ghi rõ), hay phải preserve để giữ fidelity với mẫu gốc (chưa đạt, phải restore). |

## Semantic Review

| Area | Result | Notes |
|---|---|---|
| Reception start time and date | OK | `reception.startedAt*` bindings render đúng ngữ nghĩa, không fallback fixture. |
| Reception location | OK | `reception.locationName` render đúng. |
| Informant identity fields | OK | Họ tên, ngày sinh/năm sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, CMND/CCCD/Hộ chiếu + ngày cấp + nơi cấp, thường trú / tạm trú / nơi ở hiện tại, số điện thoại, đại diện cơ quan tổ chức (nếu có) đều có mặt. |
| Crime report content | OK | `crimeReport.content` render đúng nghĩa; scenario 02 dài vẫn không phá layout. |
| Attached items description | OK | `crimeReport.attachedItemsDescription` render đúng. |
| Reception end time and date | OK | `reception.endedAt*` bindings render đúng. |
| Optional empty fields render naturally | OK | Scenario 04-missing-optional-fields: trường optional trống render hợp lý, không sinh `undefined`/`null`. |
| No unresolved placeholder | OK | Không thấy `{{...}}`, `{...}`, `___`, `...` sót lại. |
| No `undefined` or `null` literal | OK | Không có chuỗi `undefined` hoặc `null` lọt vào output. |

## Post-lock Binding Amendment Review

Review all 11 bindings added after the original BM-001 lock:

- `reception.startedAtTimeText` — OK
- `reception.startedAtDay` — OK
- `reception.startedAtMonth` — OK
- `reception.startedAtYear` — OK
- `reception.locationName` — OK
- `crimeReport.content` — OK
- `crimeReport.attachedItemsDescription` — OK
- `reception.endedAtTimeText` — OK
- `reception.endedAtDay` — OK
- `reception.endedAtMonth` — OK
- `reception.endedAtYear` — OK

All 11 bindings use the correct semantic source, do not use fixture fallback, and behave correctly when optional values are absent.

## UI Form Coverage Notes (from `bm01.pdf`)

Field coverage is largely complete for: cơ quan cấp trên, Viện kiểm sát tiếp nhận, địa danh, ngày lập biên bản, giờ/ngày bắt đầu & kết thúc, địa điểm tiếp nhận, người tiếp nhận (họ tên, chức danh, đơn vị, tên ký), người cung cấp nguồn tin (họ tên, ngày/năm sinh, nơi sinh, quốc tịch, dân tộc, tôn giáo, nghề nghiệp, CMND/CCCD/Hộ chiếu, ngày cấp, nơi cấp, thường trú, tạm trú, nơi ở hiện tại, số điện thoại, đại diện cơ quan tổ chức, tên ký), nội dung nguồn tin, tài liệu đồ vật giao nộp, dòng lưu.

UI defects noted (must be fixed before active cutover):

- **Sticky save panel overlap (UI bug 1)** — on page 4 of `bm01.pdf`, the sticky save panel (`Sau khi lưu, render lại DOCX/PDF...` / `Lưu dữ liệu BM-001`) overlaps the provider-fields region and hides labels/inputs beneath. This is a print/export CSS issue. Fix candidate: in print stylesheet, force `.sticky-save-panel` / `.floating-action-panel` to `position: static; box-shadow: none;`, or hide these panels from the print/PDF export.
- **Missing/low-visibility `Giới tính` label (UI bug 2)** — DOCX render shows `Giới tính: Nam/Nữ` but the PDF form does not clearly expose the `Giới tính` label/field in the informant section (possibly hidden by the sticky panel above). Must be confirmed in a real browser and added if missing; this field is required by BM-001.
- **Missing/low-visibility `Tên gọi khác` label (UI bug 3)** — on page 4 of the PDF there is an input whose value is `Không`, but the label above it is hidden/cut (likely the same overlap). If that input is in fact `Tên gọi khác`, the layout must be fixed so the label renders clearly.

## Legal Correctness Statement

This review does not certify legal correctness. It verifies visual and semantic fidelity against the available BM-001 source template and product requirements.

## Decision

- [ ] Approved for BM-001 active allow-list cutover
- [x] Conditional approval; fixes required
- [ ] Rejected; remain in shadow/off mode

## Required Fixes (before active cutover)

1. Verify and fix the red font color on the `Tôi: [người tiếp nhận]` line. Final DOCX must not render legal content in red unless explicitly required by the source template. First rule out Track Changes / Review markup / dark-mode artifact in Word before changing the template.
2. Decide and document whether instructional footnotes from the original BM-001 template are intentionally removed in filled documents. If fidelity requires them, restore footnotes; otherwise record the policy decision explicitly in the product doc.
3. Verify the top-right `Mẫu số 01/HS...` note in Word Print Preview / exported white-background PDF; fix font/color if it remains too faint when printed.
4. Fix BM-001 web form print/export layout: sticky save panel must not overlap provider fields on page 4. Apply print-CSS rules so floating/sticky panels become static (or hidden) in print/PDF export.
5. Confirm the BM-001 web form exposes visible, labeled fields for `Giới tính` and `Tên gọi khác`; these must map cleanly to the DOCX render bindings. Add fields if missing; fix layout if labels are hidden by overlapping panels.

## Active Cutover Status

- `DOCUMENT_RENDERER_MODE=active` for BM-001: **DO NOT ENABLE** until all 5 required fixes above are verified by a new human review and `pnpm check:bm001-cutover -- --require-ready` exits 0.
- Renderer pipeline itself remains **stable in shadow/off mode**; smoke 5/5 package integrity PASS, automated readiness YES. D.2.3A is locked in at commit `07301ed`.

Reviewer: BM-001 product owner (human review via Microsoft Word)

Review date: 2026-06-20
