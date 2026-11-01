# Runtime Preview vs Production Signoff — Text Diff

This artifact compares the **runtime preview** DOCX text (built from
`apps/api/scripts/reproduce-bm171-runtime-preview-before.mjs` and
`apps/api/scripts/reproduce-bm171-runtime-preview-after.mjs`) against
the **production canonical** DOCX text (built from
`apps/api/scripts/render-bm171-canonical-signoff-full.mjs`).

All three artefacts were generated against the **same BM-171 locked
contract** (`docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json`)
via the **same `ContractRenderPlanBuilder` + `DocxtemplaterContractRenderEngine`**
pipeline. The only variable is the input `data`.

## Inputs

| Artefact | Input `data` |
|---|---|
| **Production signoff** (`render-bm171-canonical-signoff-full.mjs`) | `BM171_FIXTURE_INPUT` → `BM171_PAYLOAD` — flat dot-key fixture, full 34 slots. |
| **Runtime BEFORE** (`reproduce-bm171-runtime-preview-before.mjs`) | `BM171_DEMO` from `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` — flat dot-key fixture, 34 slots (after Fix 1). |
| **Runtime AFTER** (`reproduce-bm171-runtime-preview-after.mjs`) | A **stale draft** containing the bad `generateFieldValue` fallbacks the user complained about, re-asserted against `BM171_DEMO` via `buildRuntimePreviewCanonicalBaseline`. |

## Required-anchor coverage

| Anchor | Production signoff | Runtime BEFORE | Runtime AFTER |
|---|---|---|---|
| `VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH` | PRESENT | PRESENT | PRESENT |
| `VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7` | PRESENT | PRESENT | PRESENT |
| `01/QĐ-VKSKV7` | PRESENT | PRESENT | PRESENT |
| `TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026` | PRESENT (canonical) | PRESENT (after Fix 1) | PRESENT |
| `QUYẾT ĐỊNH` | PRESENT | PRESENT | PRESENT |
| `TRẢ LẠI TÀI SẢN` | PRESENT | PRESENT | PRESENT |
| `VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7` | PRESENT | PRESENT | PRESENT |
| `Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015` | PRESENT | PRESENT | PRESENT |
| `Căn cứ Quyết định truy tố` | PRESENT | PRESENT | PRESENT |
| `Căn cứ Quyết định áp dụng biện pháp tạm giam` | PRESENT | PRESENT | PRESENT |
| `Căn cứ Kết luận điều tra` | PRESENT | PRESENT | PRESENT |
| `Căn cứ Quyết định tạm đình chỉ vụ án` | PRESENT | PRESENT | PRESENT |
| `Căn cứ Quyết định tạm đình chỉ đối với bị can` | PRESENT | PRESENT | PRESENT |
| `Xét thấy tài sản bị tạm giữ` | PRESENT | PRESENT | PRESENT |
| `Điều 1.` | PRESENT | PRESENT | PRESENT |
| `01 chiếc xe máy Honda Wave RSX` | PRESENT | PRESENT | PRESENT |
| `01 sổ tiết kiệm` | PRESENT | PRESENT | PRESENT |
| `Cho ông/bà:` | PRESENT | PRESENT | PRESENT |
| `08/9/1985` | PRESENT | PRESENT | PRESENT |
| `14/12/2021` | PRESENT | PRESENT | PRESENT |
| `Điều 2.` | PRESENT | PRESENT | PRESENT |
| `Yêu cầu Phòng Cảnh sát Quản lý hành chính` | PRESENT | PRESENT | PRESENT |
| `Lưu: HSVA, HSKS, VP.` | PRESENT | PRESENT | PRESENT |
| `Ký thay` | PRESENT | PRESENT | PRESENT |
| `VIỆN TRƯỞNG` | PRESENT | PRESENT | PRESENT |

## Forbidden-anchor count

| Forbidden string | Production signoff | Runtime BEFORE | Runtime AFTER |
|---|---|---|---|
| `undefined` | 0 | 0 | 0 |
| `null` | 0 | 0 | 0 |
| `[object Object]` | 0 | 0 | 0 |
| `{{` | 0 | 0 | 0 |
| `}}` | 0 | 0 | 0 |
| `Căn cứ Điều 41 Bộ luật Tố tụng hình sự` | 0 | 0 | 0 |
| `Cá nhân/Tổ chức theo quy định.` | 0 | 0 | 0 |
| `Tài sản theo quy định pháp luật` | 0 | 0 | 0 |
| `Mô tả vụ việc mẫu` | 0 | 0 | 0 |
| `12 Ghi cụ thể cơ quan` | 0 | 0 | 0 |
| `13 Ghi chức danh người ký` | 0 | 0 | 0 |

## Visible-text length comparison

| Artefact | Visible text length (chars) |
|---|---|
| Production signoff (from `render-bm171-canonical-signoff-full.mjs`) | matches 2343 |
| Runtime BEFORE | 2343 |
| Runtime AFTER | 2343 |

Identical length, identical required-anchor coverage, zero forbidden placeholders.

## DOCX byte hash comparison

The DOCX byte hash differs across the two runtime artefacts because
docxtemplater embeds a per-render random ID (`<w:rsidR>` etc.) and
timestamp metadata. The **visible text is byte-equivalent** between
all three artefacts.

| Artefact | SHA-256 |
|---|---|
| Runtime BEFORE | `43f441c643226a36a689532d43d516748f53065af788f064e7cf50d4bd644a3f` |
| Runtime AFTER  | `c1818b569f8e386d0483e08684591233d11d29dcad9802939199475211777c15` |

The Production signoff artefact hash is in
`docs/audit/bm-visual-signoff/BM-171/visual-signoff.latest.json`
(prior runs).