/** BM-202 source-aligned runtime UX for the complaint-resolution discontinuance decision. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM202_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Đình chỉ giải quyết khiếu nại hoặc kiến nghị",
    description:
      "Quyết định đình chỉ việc giải quyết khiếu nại hoặc kiến nghị về quyết định áp dụng hoặc không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng.",
  },
] as const;

const BM202_FIELDS = {
  "agency.name": { label: "Viện kiểm sát đình chỉ giải quyết", placeholder: "Tên Viện kiểm sát ban hành quyết định" },
  "decision.decisionLine": { label: "Lý do đình chỉ", placeholder: "Lý do đình chỉ theo khoản 4 Điều 72" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "document.fullDocumentCode": { label: "Số quyết định", placeholder: "Số .../QĐ-VKS" },
} as const;

const BM202_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-202",
  versionLabel: "BM-202 curated complaint-resolution discontinuance",
  sections: BM202_SECTIONS,
  fields: BM202_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM202_RUNTIME_UX_PROFILE);
