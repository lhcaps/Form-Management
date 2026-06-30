# BM-065 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 13 |
| DOCX placeholders unique | 4 |
| DOCX duplicate semantic risks | 2 |
| Contract slots | 4 |
| Canonical fields | 4 |
| Render bindings | 4 |
| Mismatch count | 2 |

## Baseline Findings

- CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER
- BINDING_WITHOUT_TEMPLATE_PLACEHOLDER
- REVIEW_REQUIRED_REMAINS

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
| duplicateSemanticPlaceholders | 2 | document.fullDocumentCode8, recipients.personLine3 |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |
| document.fullDocumentCode8 | 8 | asset, committee, dateLine, documentNumber, prosecutor | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |
| recipients.personLine3 | 3 | alias, asset, currentAddress, dateLine, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.name | 1 | ư số /2026/TT-VKSTC ngày / /2026) Mẫu số 65/HS (Ban hành theo Thông t ư số /2026/TT-VKSTC ngày / /2026) VIỆN KIỂM SÁT … {{agency.name}} 535940 54610 CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 1231265 40005 BIÊN BẢN Về việc thi hành Quy |
| document.fullDocumentCode8 | 8 | HĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 1231265 40005 BIÊN BẢN Về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản {{document.fullDocumentCode8}} Chúng tôi gồm: Ông/Bà: … Kiểm sát viên của Viện kiểm sát 2 {{document.fullDocumentCode8}} {{document.fullDocumentCode8} |
| recipients.personLine | 1 | y bỏ biện pháp kê biên tài sản theo Lệnh kê biên tài sản số … ngày … tháng … năm … của … đối với tài sản … của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine3}} {{recipients.personLine3}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{re |
| recipients.personLine3 | 3 | kê biên tài sản số … ngày … tháng … năm … của … đối với tài sản … của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine3}} {{recipients.personLine3}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{recipients.personLine3}} Nơi thường trú: Nơ |
