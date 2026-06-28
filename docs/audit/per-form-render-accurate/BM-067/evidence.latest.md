# BM-067 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 11 |
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
| duplicateSemanticPlaceholders | 2 | document.fullDocumentCode6, recipients.personLine3 |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |
| document.fullDocumentCode6 | 6 | dateLine, documentNumber, fullName, prosecutor | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |
| recipients.personLine3 | 3 | alias, currentAddress, dateLine, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.name | 1 | ư số /2026/TT-VKSTC ngày / /2026) Mẫu số 67/HS (Ban hành theo Thông t ư số /2026/TT-VKSTC ngày / /2026) VIỆN KIỂM SÁT … {{agency.name}} 513080 54610 CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM 1222375 247650 Độc lập - Tự do - Hạnh phúc BIÊN BẢN Phong tỏa tài khoản |
| document.fullDocumentCode6 | 6 | 513080 54610 CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM 1222375 247650 Độc lập - Tự do - Hạnh phúc BIÊN BẢN Phong tỏa tài khoản {{document.fullDocumentCode6}} Chúng tôi gồm: Ông/Bà: … Kiểm sát viên của Viện kiểm sát 2 {{document.fullDocumentCode6}} {{document.fullDocumentCode6} |
| recipients.personLine | 1 | ode6}} Thi hành Lệnh phong tỏa tài khoản số … ngày … tháng … năm … của Viện kiểm sát 2 … đối với tài khoản của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine3}} {{recipients.personLine3}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{re |
| recipients.personLine3 | 3 | số … ngày … tháng … năm … của Viện kiểm sát 2 … đối với tài khoản của: Họ tên: {{recipients.personLine}} Tên gọi khác: {{recipients.personLine3}} {{recipients.personLine3}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{recipients.personLine3}} Nơi thường trú: Nơ |
