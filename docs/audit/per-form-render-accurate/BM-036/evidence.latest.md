# BM-036 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 14 |
| DOCX placeholders unique | 9 |
| Contract slots | 9 |
| Canonical fields | 9 |
| Render bindings | 9 |
| Mismatch count | 0 |

## Baseline Findings

- CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER
- BINDING_WITHOUT_TEMPLATE_PLACEHOLDER

## Structural Mismatches

| Type | Count | Items |
| --- | --- | --- |
| templatePlaceholdersWithoutSlots | 0 |  |
| contractSlotsWithoutTemplatePlaceholders | 0 |  |
| bindingsWithoutTemplatePlaceholders | 0 |  |
| slotsWithoutBindings | 0 |  |
| bindingsWithoutSlots | 0 |  |
| slotsWithoutCanonicalFields | 0 |  |
| fieldsWithoutSlots | 0 |  |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.parentNameUpper | 1 | - Hạnh phúc 873760 19685 … , ngày … tháng … năm 20… QUYẾT ĐỊNH TRẢ TỰ DO CHO NGƯỜI BỊ TẠM GIỮ VIỆN TRƯỞNG VIỆN KIỂM SÁT{{agency.parentNameUpper}} 2 … Căn cứ Điều 41 và Điều 118 của Bộ luật Tố tụng hình sự; Căn cứ Điều 135 và Điều 137 của Luật Tư pháp người chưa thà |
| decision.summaryLine | 2 | VIỆN KIỂM SÁT … {{decision.summaryLine}} 474980 53340 Số: …/QĐ-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM 1778635 -476885 Mẫu số 36/HS (Ban hành theo Thông tư s |
| document.documentCode | 3 | ều 41 và Điều 118 của Bộ luật Tố tụng hình sự; Căn cứ Điều 135 và Điều 137 của Luật Tư pháp người chưa thành niên ; Xét {{document.documentCode}} số … ngày … tháng … năm … của … đ ối với {{document.documentCode}} {{document.documentCode}} Nhận thấy {{person.fullNam |
| document.issuePlaceAndDateLine | 1 | t.documentCode}} {{document.documentCode}} Nhận thấy {{person.fullName}} , QUYẾT ĐỊNH: Điều 1. Trả tự do cho: Họ tên: 8 {{document.issuePlaceAndDateLine}} Tên gọi khác: {{person.fullName}} {{legalBasis.procedureArticlesLine}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: { |
| legalBasis.procedureArticlesLine | 1 | e}} , QUYẾT ĐỊNH: Điều 1. Trả tự do cho: Họ tên: 8 {{document.issuePlaceAndDateLine}} Tên gọi khác: {{person.fullName}} {{legalBasis.procedureArticlesLine}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{decision.summaryLine}} Nơi thường trú: {{recipients.executionAgencyLin |
| person.fullName | 2 | t.documentCode}} số … ngày … tháng … năm … của … đ ối với {{document.documentCode}} {{document.documentCode}} Nhận thấy {{person.fullName}} , QUYẾT ĐỊNH: Điều 1. Trả tự do cho: Họ tên: 8 {{document.issuePlaceAndDateLine}} Tên gọi khác: {{person.fullName}} {{l |
| recipients.archiveLine | 1 | eo quy định của Bộ luật Tố tụng hình sự./. Nơi nhận: 10 {{recipients.personLine}} ; - 8 …; - Lưu: HSVV/VA, HSKS, VP. 11 {{recipients.archiveLine}} ( Ký, ghi rõ họ tên, đóng dấu ) 2540 60960 Quyết định này đã được giao cho người được trả tự do một bản vào hồi … giờ … |
| recipients.executionAgencyLine | 2 | alBasis.procedureArticlesLine}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{decision.summaryLine}} Nơi thường trú: {{recipients.executionAgencyLine}} {{recipients.executionAgencyLine}} Điều 2. Yêu cầu 10 … thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình |
| recipients.personLine | 1 | ionAgencyLine}} Điều 2. Yêu cầu 10 … thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./. Nơi nhận: 10 {{recipients.personLine}} ; - 8 …; - Lưu: HSVV/VA, HSKS, VP. 11 {{recipients.archiveLine}} ( Ký, ghi rõ họ tên, đóng dấu ) 2540 60960 Quyết định |
