# BM-213 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 28 |
| DOCX placeholders unique | 28 |
| DOCX duplicate semantic risks | 0 |
| Contract slots | 28 |
| Canonical fields | 28 |
| Render bindings | 28 |
| Mismatch count | 0 |

## Baseline Findings

- LEGACY_RENDERER_MANIFEST_STALE

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
| agency.name | 1 | {{agency.parentName}} {{agency.name}} Mẫu số 21 3 /HS (Ban hành theo Thông tư số /202 6 /TT-VKSTC ngày / /202 6 ) \s CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc l |
| agency.parentName | 1 | {{agency.parentName}} {{agency.name}} Mẫu số 21 3 /HS (Ban hành theo Thông tư số /202 6 /TT-VKSTC ngày / /202 6 ) \s CỘNG HÒA XÃ HỘI CHỦ NGHĨ |
| document.documentCode | 1 | theo Thông tư số /202 6 /TT-VKSTC ngày / /202 6 ) \s CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc Số: {{document.documentCode}} {{document.issuePlaceAndDateLine}} YÊU CẦU Áp dụng các biện pháp kỹ thuật để bảo vệ thông tin cá nhân, danh dự, nhân ph |
| document.issuePlaceAndDateLine | 1 | T-VKSTC ngày / /202 6 ) \s CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc Số: {{document.documentCode}} {{document.issuePlaceAndDateLine}} YÊU CẦU Áp dụng các biện pháp kỹ thuật để bảo vệ thông tin cá nhân, danh dự, nhân phẩm của n gười chưa thành niên bị ph |
| juvenileProtection.article1Line | 1 | ú: {{person.temporaryAddress}} Nơi ở hiện tại: {{person.currentAddress}} {{juvenileProtection.contextLine}} YÊU CẦU: 1. {{juvenileProtection.article1Line}} {{juvenileProtection.resultDeadlineLine}} 2. {{juvenileProtection.article2Line}} Nơi nhận : - {{recipients.primaryLine} |
| juvenileProtection.article2Line | 1 | leProtection.contextLine}} YÊU CẦU: 1. {{juvenileProtection.article1Line}} {{juvenileProtection.resultDeadlineLine}} 2. {{juvenileProtection.article2Line}} Nơi nhận : - {{recipients.primaryLine}}; - {{recipients.investigationAuthorityLine}}; - {{recipients.otherRecipientsLin |
| juvenileProtection.contextLine | 1 | ờng trú: {{person.permanentAddress}} Nơi tạm trú: {{person.temporaryAddress}} Nơi ở hiện tại: {{person.currentAddress}} {{juvenileProtection.contextLine}} YÊU CẦU: 1. {{juvenileProtection.article1Line}} {{juvenileProtection.resultDeadlineLine}} 2. {{juvenileProtection.artic |
| juvenileProtection.resultDeadlineLine | 1 | hiện tại: {{person.currentAddress}} {{juvenileProtection.contextLine}} YÊU CẦU: 1. {{juvenileProtection.article1Line}} {{juvenileProtection.resultDeadlineLine}} 2. {{juvenileProtection.article2Line}} Nơi nhận : - {{recipients.primaryLine}}; - {{recipients.investigationAuthorityLi |
| official.issuerTitle | 1 | áp kỹ thuật để bảo vệ thông tin cá nhân, danh dự, nhân phẩm của n gười chưa thành niên bị phát tán trên không gian mạng {{official.issuerTitle}} Căn cứ Điều 155 của Luật Tư pháp người chưa thành niên ; Xét thấy người chưa thành niên: Họ tên: {{person.fullName}} Gi |
| person.currentAddress | 1 | dentityIssueLine}} Nơi thường trú: {{person.permanentAddress}} Nơi tạm trú: {{person.temporaryAddress}} Nơi ở hiện tại: {{person.currentAddress}} {{juvenileProtection.contextLine}} YÊU CẦU: 1. {{juvenileProtection.article1Line}} {{juvenileProtection.resultDeadlineL |
| person.dateOfBirthText | 1 | thành niên: Họ tên: {{person.fullName}} Giới tính: {{person.genderLabel}} Tên gọi khác: {{person.otherName}} Sinh ngày {{person.dateOfBirthText}} tại: {{person.placeOfBirth}} Quốc tịch: {{person.nationality}}; Dân tộc: {{person.ethnicity}}; Tôn giáo: {{person.relig |
| person.ethnicity | 1 | herName}} Sinh ngày {{person.dateOfBirthText}} tại: {{person.placeOfBirth}} Quốc tịch: {{person.nationality}}; Dân tộc: {{person.ethnicity}}; Tôn giáo: {{person.religion}} Nghề nghiệp: {{person.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân |
| person.fullName | 1 | official.issuerTitle}} Căn cứ Điều 155 của Luật Tư pháp người chưa thành niên ; Xét thấy người chưa thành niên: Họ tên: {{person.fullName}} Giới tính: {{person.genderLabel}} Tên gọi khác: {{person.otherName}} Sinh ngày {{person.dateOfBirthText}} tại: {{person |
| person.genderLabel | 1 | iều 155 của Luật Tư pháp người chưa thành niên ; Xét thấy người chưa thành niên: Họ tên: {{person.fullName}} Giới tính: {{person.genderLabel}} Tên gọi khác: {{person.otherName}} Sinh ngày {{person.dateOfBirthText}} tại: {{person.placeOfBirth}} Quốc tịch: {{perso |
| person.identityDocumentLine | 1 | Tôn giáo: {{person.religion}} Nghề nghiệp: {{person.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân: {{person.identityDocumentLine}} {{person.identityIssueLine}} Nơi thường trú: {{person.permanentAddress}} Nơi tạm trú: {{person.temporaryAddress}} Nơi ở |
| person.identityIssueLine | 1 | hề nghiệp: {{person.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân: {{person.identityDocumentLine}} {{person.identityIssueLine}} Nơi thường trú: {{person.permanentAddress}} Nơi tạm trú: {{person.temporaryAddress}} Nơi ở hiện tại: {{person.currentAd |
| person.nationality | 1 | Label}} Tên gọi khác: {{person.otherName}} Sinh ngày {{person.dateOfBirthText}} tại: {{person.placeOfBirth}} Quốc tịch: {{person.nationality}}; Dân tộc: {{person.ethnicity}}; Tôn giáo: {{person.religion}} Nghề nghiệp: {{person.occupation}} Số CMND/Thẻ CCCD/Thẻ C |
| person.occupation | 1 | eOfBirth}} Quốc tịch: {{person.nationality}}; Dân tộc: {{person.ethnicity}}; Tôn giáo: {{person.religion}} Nghề nghiệp: {{person.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân: {{person.identityDocumentLine}} {{person.identityIssueLine}} Nơi |
| person.otherName | 1 | hành niên ; Xét thấy người chưa thành niên: Họ tên: {{person.fullName}} Giới tính: {{person.genderLabel}} Tên gọi khác: {{person.otherName}} Sinh ngày {{person.dateOfBirthText}} tại: {{person.placeOfBirth}} Quốc tịch: {{person.nationality}}; Dân tộc: {{person. |
| person.permanentAddress | 1 | CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân: {{person.identityDocumentLine}} {{person.identityIssueLine}} Nơi thường trú: {{person.permanentAddress}} Nơi tạm trú: {{person.temporaryAddress}} Nơi ở hiện tại: {{person.currentAddress}} {{juvenileProtection.contextLine}} Y |
| person.placeOfBirth | 1 | llName}} Giới tính: {{person.genderLabel}} Tên gọi khác: {{person.otherName}} Sinh ngày {{person.dateOfBirthText}} tại: {{person.placeOfBirth}} Quốc tịch: {{person.nationality}}; Dân tộc: {{person.ethnicity}}; Tôn giáo: {{person.religion}} Nghề nghiệp: {{person.o |
| person.religion | 1 | eOfBirthText}} tại: {{person.placeOfBirth}} Quốc tịch: {{person.nationality}}; Dân tộc: {{person.ethnicity}}; Tôn giáo: {{person.religion}} Nghề nghiệp: {{person.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu/Số định danh cá nhân: {{person.identityDocumentLine |
| person.temporaryAddress | 1 | : {{person.identityDocumentLine}} {{person.identityIssueLine}} Nơi thường trú: {{person.permanentAddress}} Nơi tạm trú: {{person.temporaryAddress}} Nơi ở hiện tại: {{person.currentAddress}} {{juvenileProtection.contextLine}} YÊU CẦU: 1. {{juvenileProtection.article1L |
| recipients.archiveLine | 1 | ận : - {{recipients.primaryLine}}; - {{recipients.investigationAuthorityLine}}; - {{recipients.otherRecipientsLine}}; - {{recipients.archiveLine}}. {{signature.signerName}} ( Ký, ghi rõ họ tên, đóng dấu ) |
| recipients.investigationAuthorityLine | 1 | venileProtection.resultDeadlineLine}} 2. {{juvenileProtection.article2Line}} Nơi nhận : - {{recipients.primaryLine}}; - {{recipients.investigationAuthorityLine}}; - {{recipients.otherRecipientsLine}}; - {{recipients.archiveLine}}. {{signature.signerName}} ( Ký, ghi rõ họ tên, đóng |
| recipients.otherRecipientsLine | 1 | venileProtection.article2Line}} Nơi nhận : - {{recipients.primaryLine}}; - {{recipients.investigationAuthorityLine}}; - {{recipients.otherRecipientsLine}}; - {{recipients.archiveLine}}. {{signature.signerName}} ( Ký, ghi rõ họ tên, đóng dấu ) |
| recipients.primaryLine | 1 | Protection.article1Line}} {{juvenileProtection.resultDeadlineLine}} 2. {{juvenileProtection.article2Line}} Nơi nhận : - {{recipients.primaryLine}}; - {{recipients.investigationAuthorityLine}}; - {{recipients.otherRecipientsLine}}; - {{recipients.archiveLine}}. {{sig |
| signature.signerName | 1 | ine}}; - {{recipients.investigationAuthorityLine}}; - {{recipients.otherRecipientsLine}}; - {{recipients.archiveLine}}. {{signature.signerName}} ( Ký, ghi rõ họ tên, đóng dấu ) |
