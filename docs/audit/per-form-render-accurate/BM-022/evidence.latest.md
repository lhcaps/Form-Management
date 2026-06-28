# BM-022 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 7 |
| DOCX placeholders unique | 4 |
| Contract slots | 4 |
| Canonical fields | 4 |
| Render bindings | 4 |
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
| agency.nameUpper | 1 | 0 15240 Số : …/QĐ-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 1081405 67945 … , ngày … tháng {{agency.nameUpper}} QUYẾT ĐỊNH HỦY BỎ QUYẾT ĐỊNH KHÔNG KHỞI TỐ VỤ ÁN HÌNH SỰ VIỆN TRƯỞNG VIỆN KIỂM SÁT 2 … Căn cứ các đ iều 41, 158, 161 và |
| agency.parentNameUpper | 1 | 2 6 /TT-VKSTC ngày / /202 6 ) Mẫu số 22 /HS (Ban hành theo Thông tư số /202 6 /TT-VKSTC ngày / /202 6 ) VIỆN KIỂM SÁT … {{agency.parentNameUpper}} 551180 15240 Số : …/QĐ-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 1081405 67945 … , ngày … |
| document.issuePlaceAndDateLine | 4 | quy định tại khoản … Điều … của Bộ luật Hình sự, QUYẾT ĐỊNH: Điều 1. H ủy bỏ Q uyết định không khởi tố vụ án hình sự số {{document.issuePlaceAndDateLine}} ngày … tháng … năm … c ủa 5 {{document.issuePlaceAndDateLine}} {{document.issuePlaceAndDateLine}} Điều 2. Yêu cầu 5 {{d |
| person.fullName | 1 | aceAndDateLine}} Điều 2. Yêu cầu 5 {{document.issuePlaceAndDateLine}} Nơi nhận: - 5 … ; - 1 … ; - Lưu : HSVV, HSKS, VP. {{person.fullName}} .. ( Ký, ghi rõ họ tên, đóng dấu ) |
