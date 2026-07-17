/**
 * Curated runtime-ux profile for BM-086.
 *
 * 18 fields — QĐ chuyển việc thực hiện thẩm quyền thực hành quyền công tố,
 * kiểm sát giải quyết nguồn tin, khởi tố điều tra.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-086)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM086_SECTIONS = [
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
      "Căn cứ điều khoản Bộ luật Tố tụng hình sự, căn cứ thông tư liên ngành về thẩm quyền, căn cứ xem xét chuyển việc.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description: "Điều 1 — Chuyển việc. Điều 2 — Thông báo.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description:
      "Viện kiểm sát nguồn tin, Viện kiểm sát tiếp nhận, cơ quan điều tra, cơ quan thi hành tạm giữ / tạm giam, lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ, họ tên người ký.",
  },
] as const;

const BM086_FIELDS = {
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
    placeholder: "71/QĐ-VKSKV7",
    helpText: "Số ký hiệu của quyết định chuyển việc thực hiện thẩm quyền.",
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
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ điều khoản Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 36, 37, 39, Điều 154 Bộ luật Tố tụng hình sự năm 2015.",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Điều 36, 37, 39, Điều 154 Bộ luật Tố tụng hình sự năm 2015.",
    },
  },
  "legalBasis.jurisdictionCircularLine": {
    label: "Căn cứ thông tư liên ngành về thẩm quyền",
    placeholder:
      "Căn cứ Thông tư liên tịch số 01/2017/TTLT-VKSNDTC-TANDTC-BCA-BQP hướng dẫn phân cấp thẩm quyền giải quyết nguồn tin về tội phạm.",
    smart: {
      key: "legalBasis.jurisdictionCircularLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ Thông tư liên tịch số 01/2017/TTLT-VKSNDTC-TANDTC-BCA-BQP hướng dẫn phân cấp thẩm quyền giải quyết nguồn tin về tội phạm.",
    },
  },
  "prosecutionJurisdictionTransfer.considerationLine": {
    label: "Căn cứ xem xét chuyển việc",
    placeholder:
      "Căn cứ tính chất phức tạp của vụ việc, đối tượng phạm tội có yếu tố nước ngoài, phạm vi thu thập chứng cứ vượt quá địa bàn; phù hợp phân cấp thẩm quyền theo Thông tư liên tịch số 01/2017.",
    smart: {
      key: "prosecutionJurisdictionTransfer.considerationLine",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Căn cứ tính chất phức tạp của vụ việc, đối tượng phạm tội có yếu tố nước ngoài, phạm vi thu thập chứng cứ vượt quá địa bàn; phù hợp phân cấp thẩm quyền theo Thông tư liên tịch số 01/2017.",
    },
  },
  "prosecutionJurisdictionTransfer.article1Line": {
    label: "Điều 1 — Chuyển việc",
    placeholder:
      "Chuyển toàn bộ hồ sơ nguồn tin về tội phạm cho Viện kiểm sát nhân dân Thành phố Hồ Chí Minh để tiếp tục giải quyết theo thẩm quyền.",
    smart: {
      key: "prosecutionJurisdictionTransfer.article1Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Chuyển toàn bộ hồ sơ nguồn tin về tội phạm cho Viện kiểm sát nhân dân Thành phố Hồ Chí Minh để tiếp tục giải quyết theo thẩm quyền.",
    },
  },
  "prosecutionJurisdictionTransfer.article2Line": {
    label: "Điều 2 — Thông báo",
    placeholder:
      "Quyết định này được gửi cho các cơ quan tố tụng có liên quan để phối hợp thực hiện theo quy định pháp luật.",
    smart: {
      key: "prosecutionJurisdictionTransfer.article2Line",
      kind: "textarea",
      rows: 3,
      placeholder:
        "Quyết định này được gửi cho các cơ quan tố tụng có liên quan để phối hợp thực hiện theo quy định pháp luật.",
    },
  },
  "recipients.sourceProcuracyLine": {
    label: "Nơi nhận — Viện kiểm sát nguồn tin",
    placeholder: "Viện kiểm sát nhân dân Khu vực 7",
  },
  "recipients.targetProcuracyLine": {
    label: "Nơi nhận — Viện kiểm sát tiếp nhận",
    placeholder: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
  },
  "recipients.investigationAuthorityLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  "recipients.detentionFacilityLine": {
    label: "Nơi nhận — Cơ quan thi hành tạm giữ / tạm giam",
    placeholder: "Trại tạm giam Công an Thành phố Hồ Chí Minh",
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

const BM086_DEMO = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "71/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện trưởng Viện kiểm sát nhân dân Khu vực 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 36, 37, 39, Điều 154 Bộ luật Tố tụng hình sự năm 2015.",
  "legalBasis.jurisdictionCircularLine":
    "Căn cứ Thông tư liên tịch số 01/2017/TTLT-VKSNDTC-TANDTC-BCA-BQP hướng dẫn phân cấp thẩm quyền giải quyết nguồn tin về tội phạm.",
  "prosecutionJurisdictionTransfer.considerationLine":
    "Căn cứ tính chất phức tạp của vụ việc, đối tượng phạm tội có yếu tố nước ngoài, phạm vi thu thập chứng cứ vượt quá địa bàn; phù hợp phân cấp thẩm quyền theo Thông tư liên tịch số 01/2017.",
  "prosecutionJurisdictionTransfer.article1Line":
    "Chuyển toàn bộ hồ sơ nguồn tin về tội phạm cho Viện kiểm sát nhân dân Thành phố Hồ Chí Minh để tiếp tục giải quyết theo thẩm quyền.",
  "prosecutionJurisdictionTransfer.article2Line":
    "Quyết định này được gửi cho các cơ quan tố tụng có liên quan để phối hợp thực hiện theo quy định pháp luật.",
  "recipients.sourceProcuracyLine":
    "Viện kiểm sát nhân dân Khu vực 7",
  "recipients.targetProcuracyLine":
    "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "recipients.investigationAuthorityLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  "recipients.detentionFacilityLine":
    "Trại tạm giam Công an Thành phố Hồ Chí Minh",
  "recipients.archiveLine": "HSVA, HSKS, VP.",
  "signature.signMode": "Ký tay",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Phạm Thị Lan Hương",
} as const;

const BM086_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-086",
  versionLabel:
    "BM-086 curated batch 4 — QĐ chuyển việc thực hiện thẩm quyền thực hành QCT & KS giải quyết nguồn tin",
  sections: BM086_SECTIONS,
  fields: BM086_FIELDS,
  demo: BM086_DEMO,
};

registerRuntimeUxProfile(BM086_RUNTIME_UX_PROFILE);
