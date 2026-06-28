# BM-066 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 13 |
| DOCX placeholders unique | 6 |
| DOCX duplicate semantic risks | 2 |
| Contract slots | 5 |
| Canonical fields | 5 |
| Render bindings | 5 |
| Mismatch count | 10 |

## Baseline Findings

- TEMPLATE_PLACEHOLDER_WITHOUT_SLOT
- REVIEW_REQUIRED_REMAINS

## Structural Mismatches

| Type | Count | Items |
| --- | --- | --- |
| templatePlaceholdersWithoutSlots | 1 | recipients.personLine4 |
| contractSlotsWithoutTemplatePlaceholders | 0 |  |
| bindingsWithoutTemplatePlaceholders | 0 |  |
| slotsWithoutBindings | 0 |  |
| bindingsWithoutSlots | 0 |  |
| slotsWithoutCanonicalFields | 0 |  |
| fieldsWithoutSlots | 0 |  |
| duplicateSemanticPlaceholders | 2 | document.fullDocumentCode4, recipients.personLine4 |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |
| document.fullDocumentCode4 | 4 | alias, currentAddress, decisionBasis, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |
| recipients.personLine4 | 4 | alias, currentAddress, fullName, idNumber, job, permanentAddress, signature, temporaryAddress | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.name | 2 | ư số /2026/TT-VKSTC ngày / /2026) Mẫu số 66/HS (Ban hành theo Thông t ư số /2026/TT-VKSTC ngày / /2026) VIỆN KIỂM SÁT … {{agency.name}} 543560 85090 Số: …/LPT-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 986790 19685 … {{document |
| decision.decisionLine | 1 | … ngày … tháng … năm … (hoặc Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án hình sự {{document.fullDocumentCode}}{{decision.decisionLine}} số … ngày … tháng … năm … , nếu có) của … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự; Căn cứ Quyết định k |
| document.fullDocumentCode | 1 | định khởi tố vụ án hình sự số … ngày … tháng … năm … (hoặc Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án hình sự {{document.fullDocumentCode}}{{decision.decisionLine}} số … ngày … tháng … năm … , nếu có) của … về tội … quy định tại khoản … Điều … của Bộ luật Hìn |
| document.fullDocumentCode4 | 4 | ncy.name}} 543560 85090 Số: …/LPT-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 986790 19685 … {{document.fullDocumentCode4}} LỆNH PHONG TỎA TÀI KHOẢN VIỆN TRƯỞNG VIỆN KIỂM SÁT 2 {{agency.name}} Căn cứ các điều 41, 129 và 165 của Bộ luật Tố tụng |
| recipients.personLine | 1 | ocument.fullDocumentCode4}} RA LỆNH: Điều 1. Phong tỏa số tiền: … ( bằng chữ : … ) trong tài khoản … tại … của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine4}} {{recipients.personLine4}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{do |
| recipients.personLine4 | 4 | u 1. Phong tỏa số tiền: … ( bằng chữ : … ) trong tài khoản … tại … của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine4}} {{recipients.personLine4}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.fullDocumentCode4}} Nơi thường trú |
