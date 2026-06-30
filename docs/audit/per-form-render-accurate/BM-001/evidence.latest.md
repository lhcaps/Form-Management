# BM-001 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 39 |
| DOCX placeholders unique | 39 |
| DOCX duplicate semantic risks | 0 |
| Contract slots | 39 |
| Canonical fields | 39 |
| Render bindings | 39 |
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
| duplicateSemanticPlaceholders | 0 |  |

## DOCX Duplicate Semantic Risks

| Placeholder | Count | Anchors | Reason |
| --- | --- | --- | --- |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| crimeReport.attachedItemsDescription | 1 | on}} I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠ M : {{crimeReport.content}} II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có) : {{crimeReport.attachedItemsDescription}} Ngoài nguồn tin về tội phạ m và tài liệu, đồ vật có liên quan đã nhận nêu trên chúng tôi không giao, nhận thêm bất cứ t |
| crimeReport.content | 1 | ười đại diện của cơ quan, tổ chức (nếu có) : {{informant.representedOrganization}} I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠ M : {{crimeReport.content}} II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có) : {{crimeReport.attachedItemsDescription}} Ngoài nguồn tin về tội p |
| document.issuePlaceDateLine | 1 | PHỐ HỒ CHÍ MINH VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 ────── CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc {{document.issuePlaceDateLine}} BIÊN BẢN Tiếp nhận nguồn tin về tội phạm Hồi {{reception.startedAtTimeText}} , ngày {{reception.startedAtDay}} tháng {{ |
| informant.birthDay | 1 | bà: Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}} Tên gọi khác: {{informant.otherName}} Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}} Quốc tịch: {{informant.natio |
| informant.birthMonth | 1 | ame}} Giới tính: {{informant.genderLabel}} Tên gọi khác: {{informant.otherName}} Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}} Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant. |
| informant.birthYear | 1 | genderLabel}} Tên gọi khác: {{informant.otherName}} Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}} Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{inf |
| informant.currentAddress | 1 | ssuedPlace}} Nơi thường trú: {{informant.permanentAddress}} Nơi tạm trú: {{informant.temporaryAddress}} Nơi ở hiện tại: {{informant.currentAddress}} Số điện thoại: {{informant.phone}} Là người đại diện của cơ quan, tổ chức (nếu có) : {{informant.representedOrganizatio |
| informant.ethnicity | 1 | birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}} Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}} Nghề nghiệp: {{informant.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.i |
| informant.fullName | 1 | c điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự, tiến hành t iếp nhận nguồn tin về tội phạm của ông/bà: Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}} Tên gọi khác: {{informant.otherName}} Sinh ngày {{informant.birthDay}} tháng {{inf |
| informant.genderLabel | 1 | luật Tố tụng hình sự, tiến hành t iếp nhận nguồn tin về tội phạm của ông/bà: Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}} Tên gọi khác: {{informant.otherName}} Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.b |
| informant.identityIssuedDay | 1 | nt.religion}} Nghề nghiệp: {{informant.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.identityNo}} Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}} |
| informant.identityIssuedMonth | 1 | .occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.identityNo}} Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}} Nơi thường trú: {{informant.permanentAd |
| informant.identityIssuedPlace | 1 | y {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}} Nơi thường trú: {{informant.permanentAddress}} Nơi tạm trú: {{informant.temporaryAddress}} Nơi ở hiện tại: {{informant. |
| informant.identityIssuedYear | 1 | Hộ chiếu: {{informant.identityNo}} Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}} Nơi thường trú: {{informant.permanentAddress}} Nơi tạm trú: {{informant.temp |
| informant.identityNo | 1 | t.ethnicity}}; Tôn giáo: {{informant.religion}} Nghề nghiệp: {{informant.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.identityNo}} Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}} N |
| informant.nationality | 1 | ormant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}} Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}} Nghề nghiệp: {{informant.occupation}} Số CMND/Thẻ C |
| informant.occupation | 1 | } Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}} Nghề nghiệp: {{informant.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.identityNo}} Cấp ngày {{informant.identityIssuedDay}} tháng {{informant.i |
| informant.otherName | 1 | hận nguồn tin về tội phạm của ông/bà: Họ tên: {{informant.fullName}} Giới tính: {{informant.genderLabel}} Tên gọi khác: {{informant.otherName}} Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBir |
| informant.permanentAddress | 1 | t.identityIssuedMonth}} năm {{informant.identityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}} Nơi thường trú: {{informant.permanentAddress}} Nơi tạm trú: {{informant.temporaryAddress}} Nơi ở hiện tại: {{informant.currentAddress}} Số điện thoại: {{informant.pho |
| informant.phone | 1 | manentAddress}} Nơi tạm trú: {{informant.temporaryAddress}} Nơi ở hiện tại: {{informant.currentAddress}} Số điện thoại: {{informant.phone}} Là người đại diện của cơ quan, tổ chức (nếu có) : {{informant.representedOrganization}} I. NỘI DUNG NGUỒN TIN VỀ TỘI PH |
| informant.placeOfBirth | 1 | {informant.otherName}} Sinh ngày {{informant.birthDay}} tháng {{informant.birthMonth}} năm {{informant.birthYear}} tại: {{informant.placeOfBirth}} Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}} Nghề nghiệp: { |
| informant.religion | 1 | ear}} tại: {{informant.placeOfBirth}} Quốc tịch: {{informant.nationality}}; Dân tộc: {{informant.ethnicity}}; Tôn giáo: {{informant.religion}} Nghề nghiệp: {{informant.occupation}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{informant.identityNo}} Cấp ngày {{informant.i |
| informant.representedOrganization | 1 | tại: {{informant.currentAddress}} Số điện thoại: {{informant.phone}} Là người đại diện của cơ quan, tổ chức (nếu có) : {{informant.representedOrganization}} I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠ M : {{crimeReport.content}} II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO (nếu có) : {{cr |
| informant.signerName | 1 | ý tên xác nhận dưới dây. Biên bản này được lập thành 02 bản, mỗi bên giữ 01 bản./. NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM {{informant.signerName}} NGƯỜI TIẾP NHẬN {{receiver.signerName}} {{recipients.archiveLine}} |
| informant.temporaryAddress | 1 | tityIssuedYear}} Nơi cấp: {{informant.identityIssuedPlace}} Nơi thường trú: {{informant.permanentAddress}} Nơi tạm trú: {{informant.temporaryAddress}} Nơi ở hiện tại: {{informant.currentAddress}} Số điện thoại: {{informant.phone}} Là người đại diện của cơ quan, tổ chức |
| receiver.departmentName | 1 | r}}, tại {{reception.locationName}} Tôi : {{receiver.fullName}} ; chức danh: {{receiver.positionTitle}} Đơn vị công tác {{receiver.departmentName}} Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự, tiến hành t iếp nhận nguồn tin về tội phạm của ông/bà |
| receiver.fullName | 1 | startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}} Tôi : {{receiver.fullName}} ; chức danh: {{receiver.positionTitle}} Đơn vị công tác {{receiver.departmentName}} Căn cứ các điều 133, 144, 145 và 14 |
| receiver.positionTitle | 1 | artedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}} Tôi : {{receiver.fullName}} ; chức danh: {{receiver.positionTitle}} Đơn vị công tác {{receiver.departmentName}} Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự, tiến hành |
| receiver.signerName | 1 | c lập thành 02 bản, mỗi bên giữ 01 bản./. NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM {{informant.signerName}} NGƯỜI TIẾP NHẬN {{receiver.signerName}} {{recipients.archiveLine}} |
| reception.endedAtDay | 1 | bất cứ tài liệu, đồ vật nào khác. Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}. Biên bản này đã được đọc lại cho những người có tên trê |
| reception.endedAtMonth | 1 | ác. Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}. Biên bản này đã được đọc lại cho những người có tên trên nghe, công nhận đúng và cùng ký |
| reception.endedAtTimeText | 1 | rên chúng tôi không giao, nhận thêm bất cứ tài liệu, đồ vật nào khác. Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}. Biên bản này đã được đọc |
| reception.endedAtYear | 1 | tội phạm kết thúc hồi {{reception.endedAtTimeText}} ngày {{reception.endedAtDay}} tháng {{reception.endedAtMonth}} năm {{reception.endedAtYear}}. Biên bản này đã được đọc lại cho những người có tên trên nghe, công nhận đúng và cùng ký tên xác nhận dưới dây. Biên b |
| reception.locationName | 1 | dAtTimeText}} , ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}} Tôi : {{receiver.fullName}} ; chức danh: {{receiver.positionTitle}} Đơn vị công tác {{receiver.departmentName}} Căn cứ |
| reception.startedAtDay | 1 | húc {{document.issuePlaceDateLine}} BIÊN BẢN Tiếp nhận nguồn tin về tội phạm Hồi {{reception.startedAtTimeText}} , ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}} Tôi : {{receiver.ful |
| reception.startedAtMonth | 1 | }} BIÊN BẢN Tiếp nhận nguồn tin về tội phạm Hồi {{reception.startedAtTimeText}} , ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}} Tôi : {{receiver.fullName}} ; chức danh: {{receiver.pos |
| reception.startedAtTimeText | 1 | NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc {{document.issuePlaceDateLine}} BIÊN BẢN Tiếp nhận nguồn tin về tội phạm Hồi {{reception.startedAtTimeText}} , ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.l |
| reception.startedAtYear | 1 | ề tội phạm Hồi {{reception.startedAtTimeText}} , ngày {{reception.startedAtDay}} tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}}, tại {{reception.locationName}} Tôi : {{receiver.fullName}} ; chức danh: {{receiver.positionTitle}} Đơn vị công tác {{r |
| recipients.archiveLine | 1 | bên giữ 01 bản./. NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM {{informant.signerName}} NGƯỜI TIẾP NHẬN {{receiver.signerName}} {{recipients.archiveLine}} |
