/**
 * Curated runtime-ux profile for BM-067.
 *
 * 4 fields — Biên bản phong tỏa tài khoản.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No legacy stale tokens (Nguyễn Văn A / Trần Thị B /
 *     1980 / Ông cung cấp / Nguyễn Thị Hồng Hạnh).
 *   - No "(mẫu BM-067)" stale placeholder tokens.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM067_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu",
    description:
      "Thông tin cơ quan, người bị áp dụng, số văn bản, người nhận.",
  },
] as const;

const BM067_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder: "Phạm Thị Hương",
  },
  "document.fullDocumentCode6": {
    label: "Số văn bản",
    placeholder: "08/BB-VKSKV7",
    helpText: "Số ký hiệu của biên bản phong tỏa tài khoản.",
  },
  "recipients.personLine3": {
    label: "Người nhận",
    placeholder: "Ngân hàng TMCP Ngoại thương Việt Nam — Chi nhánh TP.HCM",
    smart: {
      key: "recipients.personLine3",
      kind: "textarea",
      rows: 2,
      placeholder:
        "Ngân hàng TMCP Ngoại thương Việt Nam — Chi nhánh TP.HCM",
    },
  },
} as const;

const BM067_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "recipients.personLine": "Phạm Thị Hương",
  "document.fullDocumentCode6": "08/BB-VKSKV7",
  "recipients.personLine3":
    "Ngân hàng TMCP Ngoại thương Việt Nam — Chi nhánh TP.HCM",
} as const;

const BM067_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-067",
  versionLabel:
    "BM-067 curated batch 3 — no stale tokens, real demo values",
  sections: BM067_SECTIONS,
  fields: BM067_FIELDS,
  demo: BM067_DEMO,
};

registerRuntimeUxProfile(BM067_RUNTIME_UX_PROFILE);