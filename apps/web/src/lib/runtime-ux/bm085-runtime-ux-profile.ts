/**
 * Curated runtime-ux profile for BM-085.
 *
 * 19 fields — QĐ chuyển vụ án hình sự để điều tra theo thẩm quyền.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-085)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM085_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan ban hành và văn bản",
    description:
      "Viện kiểm sát cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Căn cứ điều khoản Bộ luật Tố tụng hình sự, lý do chuyển vụ án hình sự.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description: "Điều 1 — Chuyển vụ án. Điều 2 — Thông báo.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description:
      "Cơ quan điều tra nhận vụ án, cơ quan điều tra chuyển giao, Viện kiểm sát nhận, bị can / người đại diện, người bào chữa, người tham gia tố tụng khác, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM085_FIELDS = {
  "agency.parentName": {
    label: "Viện kiểm sát cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "70/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định chuyển vụ án hình sự.",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      derivedTargets: ["document.issuePlaceAndDateLine"],
      placeholder: "Thành phố Hồ Chí Minh",
    },
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  },
  "caseInvestigationTransfer.procedureArticlesLine": {
    label: "Căn cứ điều khoản Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 39, Điều 154, Điều 165 Bộ luật Tố tụng hình sự năm 2015.",
    smart: {
      key: "caseInvestigationTransfer.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 39, Điều 154, Điều 165 Bộ luật Tố tụng hình sự năm 2015.",
    },
  },
  "caseInvestigationTransfer.reasonLine": {
    label: "Lý do chuyển vụ án",
    placeholder:
      "Vụ án thuộc thẩm quyền điều tra của cơ quan điều tra cấp trên theo quy định tại Điều 39 BLTTHS.",
    smart: {
      key: "caseInvestigationTransfer.reasonLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Vụ án thuộc thẩm quyền điều tra của cơ quan điều tra cấp trên theo quy định tại Điều 39 BLTTHS.",
    },
  },
  "caseInvestigationTransfer.article1Line": {
    label: "Điều 1 — Chuyển vụ án",
    placeholder:
      "Chuyển toàn bộ hồ sơ vụ án hình sự số 08/2026/HSST cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh để tiếp tục điều tra theo thẩm quyền.",
    smart: {
      key: "caseInvestigationTransfer.article1Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Chuyển toàn bộ hồ sơ vụ án hình sự số 08/2026/HSST cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh để tiếp tục điều tra theo thẩm quyền.",
    },
  },
  "caseInvestigationTransfer.article2Line": {
    label: "Điều 2 — Thông báo",
    placeholder:
      "Quyết định này được gửi cho các cơ quan tố tụng có liên quan để phối hợp thực hiện theo quy định pháp luật.",
    smart: {
      key: "caseInvestigationTransfer.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định này được gửi cho các cơ quan tố tụng có liên quan để phối hợp thực hiện theo quy định pháp luật.",
    },
  },
  "caseInvestigationTransfer.fromInvestigationAuthorityRecipientLine": {
    label: "Nơi nhận — Cơ quan điều tra chuyển giao",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận 1",
  },
  "caseInvestigationTransfer.toInvestigationAuthorityRecipientLine": {
    label: "Nơi nhận — Cơ quan điều tra tiếp nhận",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "caseInvestigationTransfer.toProcuracyRecipientLine": {
    label: "Nơi nhận — Viện kiểm sát tiếp nhận",
    placeholder: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
  },
  "caseInvestigationTransfer.accusedOrRepresentativeRecipientLine": {
    label: "Nơi nhận — Bị can / người đại diện",
    placeholder: "Lê Minh Quang (bị can)",
  },
  "caseInvestigationTransfer.defenderRecipientLine": {
    label: "Nơi nhận — Người bào chữa",
    placeholder: "Luật sư Phạm Thị Hồng Nhung — Văn phòng Luật sư Phạm Hồng",
  },
  "caseInvestigationTransfer.otherParticipantRecipientLine": {
    label: "Nơi nhận — Người tham gia tố tụng khác",
    placeholder: "Người bảo vệ quyền lợi, người làm chứng (nếu có)",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký tay",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Phạm Thị Lan Hương",
  },
} as const;

const BM085_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "70/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "caseInvestigationTransfer.procedureArticlesLine":
    "Căn cứ Điều 39, Điều 154, Điều 165 Bộ luật Tố tụng hình sự năm 2015.",
  "caseInvestigationTransfer.reasonLine":
    "Vụ án thuộc thẩm quyền điều tra của cơ quan điều tra cấp trên theo quy định tại Điều 39 BLTTHS.",
  "caseInvestigationTransfer.article1Line":
    "Chuyển toàn bộ hồ sơ vụ án hình sự số 08/2026/HSST cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh để tiếp tục điều tra theo thẩm quyền.",
  "caseInvestigationTransfer.article2Line":
    "Quyết định này được gửi cho các cơ quan tố tụng có liên quan để phối hợp thực hiện theo quy định pháp luật.",
  "caseInvestigationTransfer.fromInvestigationAuthorityRecipientLine":
    "Cơ quan Cảnh sát điều tra Công an Quận 1",
  "caseInvestigationTransfer.toInvestigationAuthorityRecipientLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "caseInvestigationTransfer.toProcuracyRecipientLine":
    "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "caseInvestigationTransfer.accusedOrRepresentativeRecipientLine":
    "Lê Minh Quang (bị can)",
  "caseInvestigationTransfer.defenderRecipientLine":
    "Luật sư Phạm Thị Hồng Nhung — Văn phòng Luật sư Phạm Hồng",
  "caseInvestigationTransfer.otherParticipantRecipientLine":
    "Người bảo vệ quyền lợi, người làm chứng (nếu có)",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Hương",
} as const;

const BM085_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-085",
  versionLabel:
    "BM-085 curated batch 4 — QĐ chuyển vụ án hình sự để điều tra theo thẩm quyền",
  sections: BM085_SECTIONS,
  fields: BM085_FIELDS,
  demo: BM085_DEMO,
};

registerRuntimeUxProfile(BM085_RUNTIME_UX_PROFILE);
