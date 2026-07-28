/**
 * BM-002 — Phiếu chuyển nguồn tin về tội phạm.
 *
 * Presentation metadata reviewed against the locked compiled contract and
 * DOCX slot contexts in `docs/audit/docx/extracted/BM-002__f78301178da7.extract.md`.
 * It does not alter any contract key, template-runtime lifecycle, or DOCX.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM002_SECTIONS = [
  {
    sectionId: "section-agency",
    title: "Cơ quan tiếp nhận và chuyển nguồn tin",
    description: "Cơ quan cấp trên, đơn vị ban hành và cơ quan đã tiếp nhận nguồn tin trước khi chuyển.",
  },
  {
    sectionId: "section-document",
    title: "Thông tin phiếu chuyển",
    description: "Số phiếu, địa danh và ngày lập phiếu chuyển nguồn tin về tội phạm.",
  },
  {
    sectionId: "section-receiver",
    title: "Cơ quan nhận giải quyết",
    description: "Cơ quan hoặc người có thẩm quyền nhận nguồn tin để giải quyết theo thẩm quyền.",
  },
  {
    sectionId: "section-sourcereport",
    title: "Nguồn tin về tội phạm",
    description: "Thời điểm cơ quan tiếp nhận nguồn tin và nội dung nguồn tin được chuyển.",
  },
  {
    sectionId: "section-reporter",
    title: "Người cung cấp nguồn tin",
    description: "Thông tin nhân thân, giấy tờ, nơi cư trú và liên hệ của người báo tin.",
  },
  {
    sectionId: "section-recipients",
    title: "Nơi nhận và lưu hồ sơ",
    description: "Các nơi nhận phiếu chuyển và dòng lưu hồ sơ theo mẫu.",
  },
  {
    sectionId: "section-signature",
    title: "Người ký phiếu chuyển",
    description: "Chức vụ và họ tên người có thẩm quyền ký ban hành phiếu.",
  },
  {
    sectionId: "section-chuyen-nguon-tin",
    title: "Tài liệu, đồ vật kèm theo",
    description: "Liệt kê tài liệu, đồ vật hoặc dữ liệu được chuyển kèm nguồn tin.",
  },
] as const;

const BM002_PRESENTATION_SECTIONS = [
  {
    id: "co-quan-va-phieu-chuyen",
    title: "1. Cơ quan và phiếu chuyển",
    description: "Xác định cơ quan tiếp nhận, cơ quan lập phiếu và thông tin ban hành.",
    fieldKeys: [
      "agency.parentName",
      "agency.name",
      "agency.bodyName",
      "document.documentCode",
      "document.issuePlaceAndDateLine",
    ],
  },
  {
    id: "co-quan-nhan-va-tiep-nhan",
    title: "2. Cơ quan nhận và thời điểm tiếp nhận",
    description: "Nơi nhận nguồn tin để giải quyết và ngày cơ quan chuyển đã tiếp nhận nguồn tin.",
    fieldKeys: ["receiver.name", "sourceReport.receivedDateLine"],
  },
  {
    id: "nguoi-cung-cap-nguon-tin",
    title: "3. Người cung cấp nguồn tin",
    description: "Nhân thân và thông tin liên hệ của người báo tin theo phiếu chuyển.",
    fieldKeys: [
      "reporter.fullName",
      "reporter.genderText",
      "reporter.otherName",
      "reporter.birthDateLine",
      "reporter.birthPlace",
      "reporter.nationality",
      "reporter.ethnicity",
      "reporter.religion",
      "reporter.occupation",
      "reporter.identityNumber",
      "reporter.identityIssueDateLine",
      "reporter.identityIssuePlace",
      "reporter.permanentResidence",
      "reporter.temporaryResidence",
      "reporter.currentResidence",
      "reporter.phoneNumber",
      "reporter.organizationRepresentative",
    ],
  },
  {
    id: "noi-dung-va-tai-lieu",
    title: "4. Nội dung nguồn tin và tài liệu kèm theo",
    description: "Nội dung cần chuyển giải quyết cùng toàn bộ tài liệu, đồ vật kèm theo.",
    fieldKeys: ["sourceReport.content", "sourceTransfer.attachedItemsDescription"],
  },
  {
    id: "noi-nhan-va-ky",
    title: "5. Nơi nhận và ký ban hành",
    description: "Dòng nơi nhận, lưu hồ sơ và thông tin người ký phiếu chuyển.",
    fieldKeys: [
      "recipients.primaryLine",
      "recipients.archiveLine",
      "signature.positionTitle",
      "signature.signerName",
    ],
  },
] as const;

const BM002_FIELDS = {
  "agency.parentName": { label: "Cơ quan cấp trên", placeholder: "VIỆN KIỂM SÁT NHÂN DÂN TỈNH, THÀNH PHỐ" },
  "agency.name": { label: "Cơ quan lập phiếu chuyển", placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC" },
  "agency.bodyName": { label: "Cơ quan đã tiếp nhận nguồn tin", placeholder: "Tên cơ quan tiếp nhận nguồn tin trước khi chuyển" },
  "document.documentCode": { label: "Số phiếu chuyển", placeholder: "Số/PC-..." },
  "document.issuePlaceAndDateLine": { label: "Địa danh, ngày lập phiếu", placeholder: "..., ngày ... tháng ... năm ..." },
  "receiver.name": { label: "Cơ quan hoặc người nhận giải quyết", placeholder: "Tên cơ quan, đơn vị hoặc người có thẩm quyền" },
  "sourceReport.receivedDateLine": { label: "Ngày tiếp nhận nguồn tin", placeholder: "... tháng ... năm ..." },
  "reporter.fullName": { label: "Họ và tên người báo tin", placeholder: "Họ và tên đầy đủ" },
  "reporter.genderText": { label: "Giới tính", placeholder: "Nam/Nữ" },
  "reporter.otherName": { label: "Tên gọi khác", placeholder: "Không có hoặc tên gọi khác" },
  "reporter.birthDateLine": { label: "Ngày, tháng, năm sinh", placeholder: "... tháng ... năm ..." },
  "reporter.birthPlace": { label: "Nơi sinh", placeholder: "Xã/phường, quận/huyện, tỉnh/thành phố" },
  "reporter.nationality": { label: "Quốc tịch", placeholder: "Việt Nam" },
  "reporter.ethnicity": { label: "Dân tộc", placeholder: "Kinh" },
  "reporter.religion": { label: "Tôn giáo", placeholder: "Không" },
  "reporter.occupation": { label: "Nghề nghiệp", placeholder: "Nghề nghiệp hiện tại" },
  "reporter.identityNumber": { label: "Số CMND/CCCD/thẻ căn cước/hộ chiếu", placeholder: "Số giấy tờ tùy thân" },
  "reporter.identityIssueDateLine": { label: "Ngày cấp giấy tờ tùy thân", placeholder: "... tháng ... năm ..." },
  "reporter.identityIssuePlace": { label: "Nơi cấp giấy tờ tùy thân", placeholder: "Cơ quan cấp" },
  "reporter.permanentResidence": { label: "Nơi thường trú", placeholder: "Địa chỉ thường trú" },
  "reporter.temporaryResidence": { label: "Nơi tạm trú", placeholder: "Địa chỉ tạm trú hoặc không có" },
  "reporter.currentResidence": { label: "Nơi ở hiện tại", placeholder: "Địa chỉ hiện đang sinh sống" },
  "reporter.phoneNumber": { label: "Số điện thoại liên hệ", placeholder: "Số điện thoại" },
  "reporter.organizationRepresentative": { label: "Đại diện cơ quan, tổ chức (nếu có)", placeholder: "Tên cơ quan, tổ chức hoặc để trống" },
  "sourceReport.content": { label: "Nội dung nguồn tin về tội phạm", placeholder: "Trình bày đầy đủ nội dung nguồn tin cần chuyển giải quyết", control: "TEXTAREA" },
  "sourceTransfer.attachedItemsDescription": { label: "Tài liệu, đồ vật kèm theo", placeholder: "Liệt kê từng tài liệu, đồ vật hoặc dữ liệu kèm theo", control: "TEXTAREA" },
  "recipients.primaryLine": { label: "Nơi nhận", placeholder: "- Cơ quan, đơn vị nhận giải quyết;" },
  "recipients.archiveLine": { label: "Dòng lưu hồ sơ", placeholder: "- Lưu: ...;" },
  "signature.positionTitle": { label: "Chức vụ người ký", placeholder: "CHỨC VỤ" },
  "signature.signerName": { label: "Họ và tên người ký", placeholder: "Họ và tên đầy đủ" },
} as const;

const BM002_DEMO = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.bodyName": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.documentCode": "12/PC-VKSKV7",
  "document.issuePlaceAndDateLine": "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
  "receiver.name": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "sourceReport.receivedDateLine": "04 tháng 3 năm 2026",
  "reporter.fullName": "Trần Văn Bình",
  "reporter.genderText": "Nam",
  "reporter.otherName": "Không có",
  "reporter.birthDateLine": "15 tháng 5 năm 1985",
  "reporter.birthPlace": "Thành phố Hồ Chí Minh",
  "reporter.nationality": "Việt Nam",
  "reporter.ethnicity": "Kinh",
  "reporter.religion": "Không",
  "reporter.occupation": "Nhân viên",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079085001234 is a format-shaped synthetic test CCCD, not derived from any real customer/case data.
  "reporter.identityNumber": "079085001234",
  "reporter.identityIssueDateLine": "10 tháng 5 năm 2020",
  "reporter.identityIssuePlace": "Công an Thành phố Hồ Chí Minh",
  "reporter.permanentResidence": "Phường Minh Họa, Thành phố Hồ Chí Minh",
  "reporter.temporaryResidence": "Không có",
  "reporter.currentResidence": "Phường Bến Nghé, Thành phố Hồ Chí Minh",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 0900000000 is a format-shaped synthetic test phone, not derived from any real customer/case data.
  "reporter.phoneNumber": "0900000000",
  "reporter.organizationRepresentative": "Không có",
  "sourceReport.content": "Nguồn tin do công dân Trần Văn B trình bày về việc phát hiện nhóm đối tượng có hành vi tổ chức đánh bạc tại địa chỉ số 49 đường Trần Hưng Đạo, Phường Phan Chu Trinh, Quận 1, Thành phố Hồ Chí Minh vào khoảng 21 giờ ngày 01/3/2026, đề nghị cơ quan có thẩm quyền xác minh.",
  "sourceTransfer.attachedItemsDescription": "01 bản tường trình; 01 bản sao giấy tờ tùy thân; 01 tệp dữ liệu điện tử.",
  "recipients.primaryLine": "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "recipients.archiveLine": "- Lưu: Hồ sơ nguồn tin, văn phòng.",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Lê Văn C",
} as const;

const BM002_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-002",
  versionLabel: "BM-002 reviewed semantic transfer-source profile",
  sections: BM002_SECTIONS,
  presentationSections: BM002_PRESENTATION_SECTIONS,
  fields: BM002_FIELDS,
  demo: BM002_DEMO,
};

registerRuntimeUxProfile(BM002_RUNTIME_UX_PROFILE);
