/**
 * Curated runtime-ux profile for BM-065.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM065_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin cơ quan, người bị áp dụng, số văn bản, người nhận.",
  },
] as const;

const BM065_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Hoàng Văn Minh",
  },
  "document.fullDocumentCode8": {
    label: "Số văn bản",
    placeholder: "07/QĐ-VKSKV7",
    helpText: "Số ký hiệu của biên bản về việc thi hành quyết định hủy lệnh kê biên.",
  },
  "recipients.personLine3": {
    label: "Người nhận",
    placeholder: "Cơ quan thi hành án dân sự, Thành phố Hồ Chí Minh",
    smart: {
      key: "recipients.personLine3",
      kind: "textarea",
      rows: 2,
      placeholder:
        "Cơ quan thi hành án dân sự, Thành phố Hồ Chí Minh",
    },
  },
} as const;

const BM065_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "recipients.personLine": "Hoàng Văn Minh",
  "document.fullDocumentCode8": "07/QĐ-VKSKV7",
  "recipients.personLine3":
    "Cơ quan thi hành án dân sự, Thành phố Hồ Chí Minh",
} as const;

const BM065_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-065",
  versionLabel:
    "BM-065 curated batch 3 — no stale tokens, real demo values",
  sections: BM065_SECTIONS,
  fields: BM065_FIELDS,
  demo: BM065_DEMO,
};

registerRuntimeUxProfile(BM065_RUNTIME_UX_PROFILE);
