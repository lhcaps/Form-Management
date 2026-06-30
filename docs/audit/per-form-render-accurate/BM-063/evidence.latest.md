# BM-063 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 16 |
| DOCX placeholders unique | 5 |
| DOCX duplicate semantic risks | 2 |
| Contract slots | 5 |
| Canonical fields | 5 |
| Render bindings | 5 |
| Mismatch count | 12 |

## Baseline Findings

- TEMPLATE_PLACEHOLDER_WITHOUT_SLOT
- CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER
- BINDING_WITHOUT_TEMPLATE_PLACEHOLDER
- REVIEW_REQUIRED_REMAINS

## Structural Mismatches

| Type | Count | Items |
| --- | --- | --- |
| templatePlaceholdersWithoutSlots | 1 | document.fullDocumentCode8 |
| contractSlotsWithoutTemplatePlaceholders | 1 | document.fullDocumentCode |
| bindingsWithoutTemplatePlaceholders | 1 | document.fullDocumentCode |
| slotsWithoutBindings | 0 |  |
| bindingsWithoutSlots | 0 |  |
| slotsWithoutCanonicalFields | 0 |  |
| fieldsWithoutSlots | 0 |  |
| duplicateSemanticPlaceholders | 2 | document.fullDocumentCode8, recipients.personLine5 |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |
| document.fullDocumentCode8 | 8 | asset, committee, dateLine, documentNumber, fullName, prosecutor | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |
| recipients.personLine5 | 5 | alias, asset, currentAddress, dateLine, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.name | 1 | ư số /2026/TT-VKSTC ngày / /2026) Mẫu số 63/HS (Ban hành theo Thông t ư số /2026/TT-VKSTC ngày / /2026) VIỆN KIỂM SÁT … {{agency.name}} 535940 54610 CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 974090 27305 BIÊN BẢN Kê biên tài sản {{doc |
| document.fullDocumentCode8 | 8 | ame}} 535940 54610 CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 974090 27305 BIÊN BẢN Kê biên tài sản {{document.fullDocumentCode8}} ngày … tháng … năm …{{document.issuePlaceAndDateLine}} {{document.fullDocumentCode8}} Chúng tôi gồm: Ông/Bà: … Kiểm sát |
| document.issuePlaceAndDateLine | 1 | AM Độc lập - Tự do - Hạnh phúc 974090 27305 BIÊN BẢN Kê biên tài sản {{document.fullDocumentCode8}} ngày … tháng … năm …{{document.issuePlaceAndDateLine}} {{document.fullDocumentCode8}} Chúng tôi gồm: Ông/Bà: … Kiểm sát viên của Viện kiểm sát 2 {{document.fullDocumentCode8} |
| recipients.personLine | 1 | cument.fullDocumentCode8}} Thi hành Lệnh kê biên tài sản số … ngày … tháng … năm … của 2 … đối với tài sản của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine5}} {{recipients.personLine5}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{re |
| recipients.personLine5 | 5 | kê biên tài sản số … ngày … tháng … năm … của 2 … đối với tài sản của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine5}} {{recipients.personLine5}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{recipients.personLine5}} Nơi thường trú: Nơ |
