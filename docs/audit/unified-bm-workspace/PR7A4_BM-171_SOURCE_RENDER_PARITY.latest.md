# PR7A.4 — BM-171 Source-vs-Render Parity Audit

**STATUS**: `READY_FOR_PLANNER_REVIEW`
**Generated**: 2026-07-05T20:38:50.305Z
**Fixture variant**: full

## Source DOCX

- Path: `D:\Study\Project\QLLaw-main\storage\templates\normalized-docx\BM-171\BM-171_normalized.docx`
- sha256: `bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2`
- bytes: 26445
- parts: 21

## Rendered DOCX

- Path: `D:\Study\Project\QLLaw-main\docs\audit\bm-visual-signoff\BM-171\rendered.latest.docx`
- sha256: `1c7a9f70ce25433a62afef1bf83e671de71c4a8c454c5a7a8c4f7c2b4fa4417c`
- bytes: 21557
- parts: 21
- visible-text length: 2337

## Required-Present assertions (auto-confirmable)

Total: **39**, pass: **39**, fail: **0**

| # | needle | rendered has? | pass | note |
|---|---|---|---|---|
| 1 | VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH | yes | PASS | not present in source DOCX — comes from fixture payload |
| 2 | VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 3 | 01/QĐ-VKSKV7 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 4 | TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 5 | QUYẾT ĐỊNH | yes | PASS | also present in source DOCX |
| 6 | TRẢ LẠI TÀI SẢN | yes | PASS | also present in source DOCX |
| 7 | VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 8 | Căn cứ Điều 134 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 9 | Căn cứ Quyết định truy tố số 02/QĐ-VKS-KV7 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 10 | Căn cứ Quyết định áp dụng biện pháp tạm giam | yes | PASS | not present in source DOCX — comes from fixture payload |
| 11 | Căn cứ Kết luận điều tra số 21/KLĐT-PCA | yes | PASS | not present in source DOCX — comes from fixture payload |
| 12 | Căn cứ Quyết định tạm đình chỉ vụ án | yes | PASS | not present in source DOCX — comes from fixture payload |
| 13 | Căn cứ Quyết định tạm đình chỉ đối với bị can | yes | PASS | not present in source DOCX — comes from fixture payload |
| 14 | Xét thấy tài sản bị tạm giữ | yes | PASS | not present in source DOCX — comes from fixture payload |
| 15 | QUYẾT ĐỊNH | yes | PASS | also present in source DOCX |
| 16 | Điều 1. Trả lại tài sản | yes | PASS | also present in source DOCX |
| 17 | Điều 1 | yes | PASS | also present in source DOCX |
| 18 | xe máy Honda Wave RSX | yes | PASS | not present in source DOCX — comes from fixture payload |
| 19 | sổ tiết kiệm Ngân hàng TMCP Ngoại thương Việt Nam | yes | PASS | not present in source DOCX — comes from fixture payload |
| 20 | Nguyễn Văn A | yes | PASS | not present in source DOCX — comes from fixture payload |
| 21 | Giới tính | yes | PASS | also present in source DOCX |
| 22 | Nam | yes | PASS | also present in source DOCX |
| 23 | Sinh ngày 08/09/1985 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 24 | Tỉnh Bình Dương | yes | PASS | not present in source DOCX — comes from fixture payload |
| 25 | Quốc tịch | yes | PASS | also present in source DOCX |
| 26 | Việt Nam | yes | PASS | not present in source DOCX — comes from fixture payload |
| 27 | Dân tộc | yes | PASS | also present in source DOCX |
| 28 | Kinh | yes | PASS | not present in source DOCX — comes from fixture payload |
| 29 | Nghề nghiệp | yes | PASS | also present in source DOCX |
| 30 | Lao động tự do | yes | PASS | not present in source DOCX — comes from fixture payload |
| 31 | 079085001234 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 32 | Cấp ngày 14/12/2021 | yes | PASS | not present in source DOCX — comes from fixture payload |
| 33 | Phường Bến Nghé | yes | PASS | not present in source DOCX — comes from fixture payload |
| 34 | Điều 2 | yes | PASS | also present in source DOCX |
| 35 | Yêu cầu Phòng Cảnh sát | yes | PASS | not present in source DOCX — comes from fixture payload |
| 36 | Nơi nhận | yes | PASS | also present in source DOCX |
| 37 | Lưu: HSVA, HSKS, VP. | yes | PASS | not present in source DOCX — comes from fixture payload |
| 38 | Ký thay | yes | PASS | not present in source DOCX — comes from fixture payload |
| 39 | Trần Thị B | yes | PASS | not present in source DOCX — comes from fixture payload |

## Required-Absent assertions (auto-confirmable)

Total: **14**, pass: **14**, fail: **0**

| # | forbidden | rendered has? | pass | note |
|---|---|---|---|---|
| 1 | 12 Ghi cụ thể cơ quan | no | PASS | present in source DOCX (template residue — suppression must drop it) |
| 2 | 13 Ghi chức danh người ký | no | PASS | present in source DOCX (template residue — suppression must drop it) |
| 3 | Lưu: HSVV, VP. | no | PASS | not present in source DOCX — synthetic check |
| 4 | - Lưu: HSVA, HSKS, VP. | no | PASS | not present in source DOCX — synthetic check |
| 5 | ngày 04 tháng 7 năm 2026 | no | PASS | not present in source DOCX — synthetic check |
| 6 | {{assetOwner.fullName}} | no | PASS | present in source DOCX (template residue — suppression must drop it) |
| 7 | {{document.issuePlaceAndDateLine}} | no | PASS | present in source DOCX (template residue — suppression must drop it) |
| 8 | {{recipients.archiveLine}} | no | PASS | present in source DOCX (template residue — suppression must drop it) |
| 9 | {{{ | no | PASS | not present in source DOCX — synthetic check |
| 10 | }}} | no | PASS | not present in source DOCX — synthetic check |
| 11 | undefined | no | PASS | not present in source DOCX — synthetic check |
| 12 | null | no | PASS | not present in source DOCX — synthetic check |
| 13 | [object Object] | no | PASS | not present in source DOCX — synthetic check |
| 14 | Invalid Date | no | PASS | not present in source DOCX — synthetic check |

## Header structure preservation

| needle | rendered has? | pass |
|---|---|---|
| CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM | yes | PASS |
| Độc lập | yes | PASS |
| Tự do | yes | PASS |
| Hạnh phúc | yes | PASS |

## XML / package parts health

| part | present | pass |
|---|---|---|
| [Content_Types].xml | yes | PASS |
| _rels/.rels | yes | PASS |
| word/document.xml | yes | PASS |
| word/styles.xml | yes | PASS |
| word/settings.xml | yes | PASS |

## Superscript marker audit (PR7A.3 drafter-note signature)

- body-level &lt;w:vertAlign w:val="superscript"/&gt; runs in rendered DOCX: **0**
- expected: 0 (the drafter-note paragraphs are suppression-eligible)
- PASS

## Acceptance

- Required-present: PASS (39/39)
- Required-absent:  PASS (14/14)
- Header structure: PASS (4/4)
- Superscript absent in body: PASS
- XML parts health: PASS (5/5)

