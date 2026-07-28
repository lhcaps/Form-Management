import { type RuntimeUxProfile, registerRuntimeUxProfile } from "./runtime-ux-profile";

const BM039_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-039",
  versionLabel: "BM-039 curated detention-arrest order profile",
  sections: [
    { sectionId: "section-co-quan-va-van-ban", title: "Cơ quan và Lệnh bắt", description: "Viện kiểm sát ban hành, số lệnh và dòng địa danh, ngày tháng." },
    { sectionId: "section-can-cu-phap-ly", title: "Căn cứ và lý do ra lệnh", description: "Căn cứ tố tụng, quyết định khởi tố và lý do bắt để tạm giam." },
    { sectionId: "section-thong-tin-nhan-than-bi-can", title: "Thông tin bị can", description: "Nhân thân, giấy tờ và địa chỉ của bị can bị bắt để tạm giam." },
    { sectionId: "section-noi-dung-quyet-inh", title: "Thời hạn tạm giam", description: "Thời hạn và mốc kết thúc việc tạm giam." },
    { sectionId: "section-noi-nhan", title: "Thi hành và nơi nhận", description: "Đơn vị thi hành, cơ sở giam giữ và các dòng nơi nhận." },
    { sectionId: "section-chu-ky", title: "Ký lệnh", description: "Chế độ ký, chức danh và họ tên người ký." },
  ],
  fields: {
    "agency.parentNameUpper": { label: "Viện kiểm sát cấp trên trực tiếp (IN HOA)" },
    "agency.nameUpper": { label: "Viện kiểm sát ban hành (IN HOA)" },
    "document.documentCode": { label: "Số Lệnh bắt" },
    "document.issuePlaceAndDateLine": { label: "Địa danh, ngày ban hành Lệnh" },
    "official.issuingAuthorityLine": { label: "Viện trưởng Viện kiểm sát ra Lệnh" },
    "legalBasis.procedureArticlesLine": { label: "Căn cứ Bộ luật Tố tụng hình sự", control: "TEXTAREA" },
    "legalBasis.juvenileJusticeLine": { label: "Căn cứ Luật Tư pháp người chưa thành niên", control: "TEXTAREA" },
    "detentionArrest.caseDecisionLegalBasisLine": { label: "Căn cứ quyết định khởi tố vụ án", control: "TEXTAREA" },
    "detentionArrest.accusedDecisionLegalBasisLine": { label: "Căn cứ quyết định khởi tố bị can", control: "TEXTAREA" },
    "detentionArrest.reasonLine": { label: "Lý do bắt bị can để tạm giam", control: "TEXTAREA" },
    "detentionArrest.accusedName": { label: "Họ tên bị can" }, "detentionArrest.genderLabel": { label: "Giới tính" },
    "detentionArrest.otherName": { label: "Tên gọi khác" }, "detentionArrest.birthDay": { label: "Ngày sinh" },
    "detentionArrest.birthMonth": { label: "Tháng sinh" }, "detentionArrest.birthYear": { label: "Năm sinh" },
    "detentionArrest.placeOfBirth": { label: "Nơi sinh" }, "detentionArrest.nationality": { label: "Quốc tịch" },
    "detentionArrest.ethnicity": { label: "Dân tộc" }, "detentionArrest.religion": { label: "Tôn giáo" },
    "detentionArrest.occupation": { label: "Nghề nghiệp" }, "detentionArrest.identityNo": { label: "Số CMND/CCCD/Hộ chiếu" },
    "detentionArrest.identityIssuedDay": { label: "Ngày cấp giấy tờ" }, "detentionArrest.identityIssuedMonth": { label: "Tháng cấp giấy tờ" },
    "detentionArrest.identityIssuedYear": { label: "Năm cấp giấy tờ" }, "detentionArrest.identityIssuedPlace": { label: "Nơi cấp giấy tờ" },
    "detentionArrest.permanentAddress": { label: "Nơi thường trú" }, "detentionArrest.temporaryAddress": { label: "Nơi tạm trú" },
    "detentionArrest.currentAddress": { label: "Nơi ở hiện tại" },
    "detentionArrest.detentionDurationText": { label: "Thời hạn tạm giam" }, "detentionArrest.detentionToDateLine": { label: "Thời hạn tạm giam đến ngày" },
    "detentionArrest.detentionExecutionUnitName": { label: "Đơn vị thi hành Lệnh bắt" }, "detentionArrest.detentionFacilityName": { label: "Cơ sở giam giữ" },
    "recipients.executionAgencyLine": { label: "Nơi nhận: đơn vị thi hành" }, "recipients.detentionFacilityLine": { label: "Nơi nhận: cơ sở giam giữ" },
    "recipients.personLine": { label: "Nơi nhận: bị can" }, "recipients.archiveLine": { label: "Nơi lưu hồ sơ" },
    "signature.signMode": { label: "Chế độ ký" }, "signature.positionTitle": { label: "Chức danh người ký" }, "signature.signerName": { label: "Họ tên người ký" },
  },
  demo: { "agency.parentNameUpper": "VIỆN KIỂM SÁT NHÂN DÂN TỐI CAO", "agency.nameUpper": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7", "document.documentCode": "18/LBTG-VKS", "document.issuePlaceAndDateLine": "Hà Nội, ngày 04 tháng 3 năm 2026", "detentionArrest.accusedName": "Lê Minh Quân", "detentionArrest.genderLabel": "Nam", "signature.positionTitle": "VIỆN TRƯỞNG", "signature.signerName": "Nguyễn Thị Mai" , "legalBasis.juvenileJusticeLine": "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên 2020;", "detentionArrest.caseDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố vụ án hình sự số 32/QĐ-CQĐT ngày 21 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;", "detentionArrest.detentionDurationLine": "Thời hạn tạm giam: 03 tháng kể từ ngày 21 tháng 4 năm 2026.", "detentionArrest.detentionSubjectLine": "Bị can Lê Minh Quân — đã có hành vi trộm cắp tài sản theo Điều 173 BLHS 2015.", "detentionArrest.detentionPlaceLine": "Trại tạm giam Công an Thành phố Hồ Chí Minh.", "detentionArrest.detentionReasonLine": "Bị can có hành vi phạm tội nghiêm trọng, có căn cứ để áp dụng biện pháp tạm giam theo quy định tại Điều 119 BLTTHS 2015.", "detentionArrest.searchDecisionLine": "Lệnh khám xét số 14/KX-CQĐT do Cơ quan Cảnh sát điều tra Công an TP.HCM ban hành ngày 21/4/2026.", "detentionArrest.evidenceRelatedLawLine": "Căn cứ Điều 193 Bộ luật Tố tụng hình sự 2015.", "official.issuingAuthorityLine": "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh", "detentionArrest.accusedDecisionLegalBasisLine": "Căn cứ Quyết định khởi tố bị can số 33/QĐ-CQĐT ngày 21 tháng 4 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;", "detentionArrest.reasonLine": "Bị can Lê Minh Quân có hành vi phạm tội nghiêm trọng về tội Trộm cắp tài sản theo Điều 173 BLHS 2015; có căn cứ để áp dụng biện pháp tạm giam theo quy định tại Điều 119 BLTTHS 2015.", "detentionArrest.birthDay": "08", "detentionArrest.birthMonth": "09", "detentionArrest.birthYear": "1985", "detentionArrest.placeOfBirth": "Tỉnh Quảng Ngãi", "detentionArrest.nationality": "Việt Nam", "detentionArrest.ethnicity": "Kinh", "detentionArrest.occupation": "Lao động tự do", // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079085001234 is a format-shaped synthetic test CCCD, not derived from any real customer/case data.
    "detentionArrest.identityNo": "079085001234", "detentionArrest.identityIssuedDay": "22", "detentionArrest.identityIssuedMonth": "12", "detentionArrest.identityIssuedYear": "2021", "detentionArrest.identityIssuedPlace": "Cục Cảnh sát Quản lý hành chính về trật tự xã hội", "detentionArrest.permanentAddress": "Số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh", "detentionArrest.currentAddress": "Số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh", "detentionArrest.detentionDurationText": "03 tháng", "detentionArrest.detentionExecutionUnitName": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh", "detentionArrest.detentionFacilityName": "Trại tạm giam Công an Thành phố Hồ Chí Minh", "recipients.executionAgencyLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;", "recipients.detentionFacilityLine": "Trại tạm giam Công an Thành phố Hồ Chí Minh;", "recipients.personLine": "Bị can Lê Minh Quân;", "recipients.archiveLine": "Lưu: HSVA, HSKS, VP."},
};

registerRuntimeUxProfile(BM039_RUNTIME_UX_PROFILE);
