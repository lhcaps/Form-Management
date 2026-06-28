# BM-062 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 21 |
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
| templatePlaceholdersWithoutSlots | 1 | recipients.personLine5 |
| contractSlotsWithoutTemplatePlaceholders | 0 |  |
| bindingsWithoutTemplatePlaceholders | 0 |  |
| slotsWithoutBindings | 0 |  |
| bindingsWithoutSlots | 0 |  |
| slotsWithoutCanonicalFields | 0 |  |
| fieldsWithoutSlots | 0 |  |
| duplicateSemanticPlaceholders | 2 | decision.decisionLine11, recipients.personLine5 |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |
| decision.decisionLine11 | 11 | asset, assignment, currentAddress, decisionBasis, fullName, idNumber, job, permanentAddress, prosecutor, temporaryAddress | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |
| recipients.personLine5 | 5 | asset, assignment, fullName, idNumber, job, prosecutor, recipientFooter, signature | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.name | 2 | ư số /2026/TT-VKSTC ngày / /2026) Mẫu số 62/HS (Ban hành theo Thông t ư số /2026/TT-VKSTC ngày / /2026) VIỆN KIỂM SÁT … {{agency.name}} 490220 54610 Số: …/LKB-VKS…-{{document.fullDocumentCode}} … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh p |
| decision.decisionLine | 1 | n số … ngày … tháng … năm … , nếu có) của … đối với … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự; Xét thấy{{decision.decisionLine}} {{decision.decisionLine11}} RA LỆNH: Điều 1. Kê biên tài sản: 11 {{decision.decisionLine11}} Họ tên: 12 {{recipients.pe |
| decision.decisionLine11 | 11 | … , nếu có) của … đối với … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự; Xét thấy{{decision.decisionLine}} {{decision.decisionLine11}} RA LỆNH: Điều 1. Kê biên tài sản: 11 {{decision.decisionLine11}} Họ tên: 12 {{recipients.personLine}} {{recipients.pers |
| document.fullDocumentCode | 1 | HS (Ban hành theo Thông t ư số /2026/TT-VKSTC ngày / /2026) VIỆN KIỂM SÁT … {{agency.name}} 490220 54610 Số: …/LKB-VKS…-{{document.fullDocumentCode}} … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 995045 27940 … , ngày … tháng … năm 20… LỆNH KÊ BIÊN T |
| recipients.personLine | 1 | .decisionLine}} {{decision.decisionLine11}} RA LỆNH: Điều 1. Kê biên tài sản: 11 {{decision.decisionLine11}} Họ tên: 12 {{recipients.personLine}} {{recipients.personLine5}} {{recipients.personLine5}} {{recipients.personLine5}} {{recipients.personLine5}} Nghề nghiệp |
| recipients.personLine5 | 5 | .decisionLine11}} RA LỆNH: Điều 1. Kê biên tài sản: 11 {{decision.decisionLine11}} Họ tên: 12 {{recipients.personLine}} {{recipients.personLine5}} {{recipients.personLine5}} {{recipients.personLine5}} {{recipients.personLine5}} Nghề nghiệp: {{decision.decisionLine11 |
