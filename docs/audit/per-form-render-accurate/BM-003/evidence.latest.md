# BM-003 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 14 |
| DOCX placeholders unique | 14 |
| Contract slots | 14 |
| Canonical fields | 14 |
| Render bindings | 14 |
| Mismatch count | 0 |

## Baseline Findings

- TEMPLATE_PLACEHOLDER_WITHOUT_SLOT

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
| agency.name | 1 | {{agency.parentName}} {{agency.name}} CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập – Tự do - Hạnh phúc Số: {{document.documentCode}} {{document.issuePlaceAndDa |
| agency.parentName | 1 | {{agency.parentName}} {{agency.name}} CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập – Tự do - Hạnh phúc Số: {{document.documentCode}} {{document |
| document.documentCode | 1 | {{agency.parentName}} {{agency.name}} CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập – Tự do - Hạnh phúc Số: {{document.documentCode}} {{document.issuePlaceAndDateLine}} Mẫu số 03/HS (Ban hành theo Thông tư số 03 /2026/TT-VKSTC Ngày 09 / 02 /2026) QUYẾT |
| document.issuePlaceAndDateLine | 1 | rentName}} {{agency.name}} CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập – Tự do - Hạnh phúc Số: {{document.documentCode}} {{document.issuePlaceAndDateLine}} Mẫu số 03/HS (Ban hành theo Thông tư số 03 /2026/TT-VKSTC Ngày 09 / 02 /2026) QUYẾT ĐỊNH Phân công thực hành quyền công |
| legalBasis.procedureArticlesLine | 1 | H Phân công thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm {{official.issuerTitle}} {{legalBasis.procedureArticlesLine}} QUYẾT ĐỊNH: Điều 1. {{sourceAssignment.article1Line}} Điều 2 . {{sourceAssignment.article2Line}} Điều 3. {{sourceAssign |
| official.issuerTitle | 1 | 09 / 02 /2026) QUYẾT ĐỊNH Phân công thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm {{official.issuerTitle}} {{legalBasis.procedureArticlesLine}} QUYẾT ĐỊNH: Điều 1. {{sourceAssignment.article1Line}} Điều 2 . {{sourceAssignment. |
| recipients.archiveLine | 1 | gnment.article2Line}} Điều 3. {{sourceAssignment.article3Line}} Nơi nhận: - {{recipients.primaryLine}}; - Như Điều 3; - {{recipients.archiveLine}}. {{signature.signMode}} {{signature.positionTitle}} {{signature.signerName}} |
| recipients.primaryLine | 1 | ignment.article1Line}} Điều 2 . {{sourceAssignment.article2Line}} Điều 3. {{sourceAssignment.article3Line}} Nơi nhận: - {{recipients.primaryLine}}; - Như Điều 3; - {{recipients.archiveLine}}. {{signature.signMode}} {{signature.positionTitle}} {{signature.signerName} |
| signature.positionTitle | 1 | ticle3Line}} Nơi nhận: - {{recipients.primaryLine}}; - Như Điều 3; - {{recipients.archiveLine}}. {{signature.signMode}} {{signature.positionTitle}} {{signature.signerName}} |
| signature.signMode | 1 | . {{sourceAssignment.article3Line}} Nơi nhận: - {{recipients.primaryLine}}; - Như Điều 3; - {{recipients.archiveLine}}. {{signature.signMode}} {{signature.positionTitle}} {{signature.signerName}} |
| signature.signerName | 1 | ecipients.primaryLine}}; - Như Điều 3; - {{recipients.archiveLine}}. {{signature.signMode}} {{signature.positionTitle}} {{signature.signerName}} |
| sourceAssignment.article1Line | 1 | hận, giải quyết nguồn tin về tội phạm {{official.issuerTitle}} {{legalBasis.procedureArticlesLine}} QUYẾT ĐỊNH: Điều 1. {{sourceAssignment.article1Line}} Điều 2 . {{sourceAssignment.article2Line}} Điều 3. {{sourceAssignment.article3Line}} Nơi nhận: - {{recipients.primaryLi |
| sourceAssignment.article2Line | 1 | icial.issuerTitle}} {{legalBasis.procedureArticlesLine}} QUYẾT ĐỊNH: Điều 1. {{sourceAssignment.article1Line}} Điều 2 . {{sourceAssignment.article2Line}} Điều 3. {{sourceAssignment.article3Line}} Nơi nhận: - {{recipients.primaryLine}}; - Như Điều 3; - {{recipients.archiveL |
| sourceAssignment.article3Line | 1 | ArticlesLine}} QUYẾT ĐỊNH: Điều 1. {{sourceAssignment.article1Line}} Điều 2 . {{sourceAssignment.article2Line}} Điều 3. {{sourceAssignment.article3Line}} Nơi nhận: - {{recipients.primaryLine}}; - Như Điều 3; - {{recipients.archiveLine}}. {{signature.signMode}} {{signature. |
