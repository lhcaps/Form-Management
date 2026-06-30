# BM-021 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 11 |
| DOCX placeholders unique | 8 |
| Contract slots | 8 |
| Canonical fields | 8 |
| Render bindings | 8 |
| Mismatch count | 0 |

## Baseline Findings

- TEMPLATE_PLACEHOLDER_WITHOUT_SLOT
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
| agency.issuePlace | 1 | I TỐ VỤ ÁN HÌNH SỰ VIỆN TRƯỞNG VIỆN KIỂM SÁT 2 … Căn cứ các đ iều 41, 157 và 158 của Bộ luật T ố tụng hình sự; Xét thấy {{agency.issuePlace}} {{document.documentCode}} , QUYẾT ĐỊNH: Điều 1. Không khởi tố vụ án hình sự đối với {{document.issuePlaceAndDateLine}} |
| agency.nameUpper | 1 | ởi tố vụ án hình sự đối với {{document.issuePlaceAndDateLine}} {{document.issuePlaceAndDateLine}} Điều 2. Viện kiểm sát {{agency.nameUpper}} 2 {{legalBasis.procedureArticlesLine}} thông báo để {{legalBasis.procedureArticlesLine}} Nơi nhận: - 8 …; - Lưu : HSVV, |
| agency.parentNameUpper | 1 | 2 6 /TT-VKSTC ngày / /202 6 ) Mẫu số 2 1/HS (Ban hành theo Thông tư số /202 6 /TT-VKSTC ngày / /202 6 ) VIỆN KIỂM SÁT … {{agency.parentNameUpper}} 474980 81915 Số : …/QĐ-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM 720725 187960 Độc lập - Tự do - Hạnh phúc … , ngày … |
| decision.decisionLine | 1 | e}} thông báo để {{legalBasis.procedureArticlesLine}} Nơi nhận: - 8 …; - Lưu : HSVV, HSKS, VP. {{decision.summaryLine}} {{decision.decisionLine}} ( Ký, ghi rõ họ tên, đóng dấu ) |
| decision.summaryLine | 1 | asis.procedureArticlesLine}} thông báo để {{legalBasis.procedureArticlesLine}} Nơi nhận: - 8 …; - Lưu : HSVV, HSKS, VP. {{decision.summaryLine}} {{decision.decisionLine}} ( Ký, ghi rõ họ tên, đóng dấu ) |
| document.documentCode | 1 | N TRƯỞNG VIỆN KIỂM SÁT 2 … Căn cứ các đ iều 41, 157 và 158 của Bộ luật T ố tụng hình sự; Xét thấy {{agency.issuePlace}} {{document.documentCode}} , QUYẾT ĐỊNH: Điều 1. Không khởi tố vụ án hình sự đối với {{document.issuePlaceAndDateLine}} {{document.issuePlaceAndDa |
| document.issuePlaceAndDateLine | 2 | sự; Xét thấy {{agency.issuePlace}} {{document.documentCode}} , QUYẾT ĐỊNH: Điều 1. Không khởi tố vụ án hình sự đối với {{document.issuePlaceAndDateLine}} {{document.issuePlaceAndDateLine}} Điều 2. Viện kiểm sát {{agency.nameUpper}} 2 {{legalBasis.procedureArticlesLine}} th |
| legalBasis.procedureArticlesLine | 3 | ố : …/QĐ-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM 720725 187960 Độc lập - Tự do - Hạnh phúc … , ngày … tháng … năm 20 {{legalBasis.procedureArticlesLine}} QUYẾT ĐỊNH K HÔNG KHỞI TỐ VỤ ÁN HÌNH SỰ VIỆN TRƯỞNG VIỆN KIỂM SÁT 2 … Căn cứ các đ iều 41, 157 và 158 của Bộ luật T ố t |
