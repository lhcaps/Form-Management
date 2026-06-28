# BM-080 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 8 |
| DOCX placeholders unique | 7 |
| DOCX duplicate semantic risks | 0 |
| Contract slots | 7 |
| Canonical fields | 7 |
| Render bindings | 7 |
| Mismatch count | 15 |

## Baseline Findings

- TEMPLATE_PLACEHOLDER_WITHOUT_SLOT
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
| duplicateSemanticPlaceholders | 0 |  |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.name | 2 | -VKSTC ngày / /2026) Mẫu số 80/HS (Ban hành theo Thông tư số /2026/TT-VKSTC ngày / /2026) 749300 445770 VIỆN KIỂM SÁT … {{agency.name}} CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM 913130 208915 Độc lập – Tự do - Hạnh phúc Số: …/TB-VKS…- … … , ngày … tháng … năm 20 |
| document.fullDocumentCode | 1 | ộ luật Tố tụng hình sự, Sau khi kiểm tra các giấy tờ theo quy định tại Điều 78 của Bộ luật Tố tụng hình sự của: Ông/Bà: {{document.fullDocumentCode}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.issueDate}} Số thẻ luật sư/thẻ trợ giúp viên pháp lý: {{perso |
| document.issueDate | 1 | 8 của Bộ luật Tố tụng hình sự của: Ông/Bà: {{document.fullDocumentCode}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.issueDate}} Số thẻ luật sư/thẻ trợ giúp viên pháp lý: {{person.personFullName}} Đăng ký là người bào chữa cho: Thuộc vụ việc/vụ án: |
| legalBasis.legalBasisLine | 1 | erson.dateOfBirth}} 6 Lý do: . Viện kiểm sát 2 … thông báo cho ông (bà) 5 {{person.currentAddress}} biết./. Nơi nhận: 5 {{legalBasis.legalBasisLine}} - Lưu: HSVA, HSKS, VP. KIỂM SÁT VIÊN ( Ký, ghi rõ họ tên, đóng dấu ) |
| person.currentAddress | 1 | ho: Thuộc vụ việc/vụ án: Xét thấy ông/bà 5 {{person.dateOfBirth}} 6 Lý do: . Viện kiểm sát 2 … thông báo cho ông (bà) 5 {{person.currentAddress}} biết./. Nơi nhận: 5 {{legalBasis.legalBasisLine}} - Lưu: HSVA, HSKS, VP. KIỂM SÁT VIÊN ( Ký, ghi rõ họ tên, đóng dấu ) |
| person.dateOfBirth | 1 | trợ giúp viên pháp lý: {{person.personFullName}} Đăng ký là người bào chữa cho: Thuộc vụ việc/vụ án: Xét thấy ông/bà 5 {{person.dateOfBirth}} 6 Lý do: . Viện kiểm sát 2 … thông báo cho ông (bà) 5 {{person.currentAddress}} biết./. Nơi nhận: 5 {{legalBasis.legalB |
| person.personFullName | 1 | tCode}} Nghề nghiệp: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.issueDate}} Số thẻ luật sư/thẻ trợ giúp viên pháp lý: {{person.personFullName}} Đăng ký là người bào chữa cho: Thuộc vụ việc/vụ án: Xét thấy ông/bà 5 {{person.dateOfBirth}} 6 Lý do: . Viện kiểm sát 2 |
