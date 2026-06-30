# BM-052 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 10 |
| DOCX placeholders unique | 7 |
| DOCX duplicate semantic risks | 1 |
| Contract slots | 8 |
| Canonical fields | 8 |
| Render bindings | 8 |
| Mismatch count | 18 |

## Baseline Findings

- EXTRACTION_HASH_MISMATCH
- TEMPLATE_PLACEHOLDER_WITHOUT_SLOT
- CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER
- BINDING_WITHOUT_TEMPLATE_PLACEHOLDER
- REVIEW_REQUIRED_REMAINS

## Structural Mismatches

| Type | Count | Items |
| --- | --- | --- |
| templatePlaceholdersWithoutSlots | 1 | recipients.personLine6 |
| contractSlotsWithoutTemplatePlaceholders | 2 | document.fullDocumentCode, document.fullDocumentCode2 |
| bindingsWithoutTemplatePlaceholders | 2 | document.fullDocumentCode, document.fullDocumentCode2 |
| slotsWithoutBindings | 0 |  |
| bindingsWithoutSlots | 0 |  |
| slotsWithoutCanonicalFields | 0 |  |
| fieldsWithoutSlots | 0 |  |
| duplicateSemanticPlaceholders | 1 | recipients.personLine6 |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |
| recipients.personLine6 | 3 | fullName, idNumber, job, permanentAddress, temporaryAddress | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.name | 1 | VIỆN KIỂM SÁT … {{agency.name}} 541655 34290 Số: …/QĐ-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM 1699260 -445770 Mẫu số 52/HS (Ban hành theo Thông t ư |
| person.fullName | 2 | t Tư pháp người chưa thành niên ; Căn cứ Quyết định về việc đặt tiền để bảo đảm số … ngày … tháng … năm … của … đối với {{person.fullName}} Xét thấy {{person.fullName}} QUYẾT ĐỊNH: Điều 1. Hủy bỏ biện pháp đặt tiền để bảo đảm đối với bị can Họ tên: 8 {{recipi |
| person.idNumber | 1 | ents.personLine6}} {{recipients.personLine6}} {{recipients.personLine6}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{person.idNumber}} Nơi thường trú: Nơi tạm trú: {{person.temporaryAddress}} bị khởi tố về tội … quy định tại khoản … Điều … của Bộ luật Hì |
| person.temporaryAddress | 1 | ecipients.personLine6}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{person.idNumber}} Nơi thường trú: Nơi tạm trú: {{person.temporaryAddress}} bị khởi tố về tội … quy định tại khoản … Điều … của Bộ luật Hình sự. Điều 2. Yêu cầu cơ quan, người có thẩm quyền 7 và |
| recipients.personLine | 1 | llName}} Xét thấy {{person.fullName}} QUYẾT ĐỊNH: Điều 1. Hủy bỏ biện pháp đặt tiền để bảo đảm đối với bị can Họ tên: 8 {{recipients.personLine}} {{recipients.personLine6}} {{recipients.personLine6}} {{recipients.personLine6}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/H |
| recipients.personLine6 | 3 | .fullName}} QUYẾT ĐỊNH: Điều 1. Hủy bỏ biện pháp đặt tiền để bảo đảm đối với bị can Họ tên: 8 {{recipients.personLine}} {{recipients.personLine6}} {{recipients.personLine6}} {{recipients.personLine6}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{person.idNumber} |
| signature.signerName | 1 | nh của Bộ luật Tố tụng hình sự./. Nơi nhận: - 7 …; - 10 …; - 8 …/người thân thích của bị can; - Lưu: HSVA, HSKS, VP. 11 {{signature.signerName}} ( Ký, ghi rõ họ tên, đóng dấu ) |
