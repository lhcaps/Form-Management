/** BM-204 source-aligned runtime UX for representative or organization participation. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM204_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Người đại diện hoặc tổ chức tham gia tố tụng",
    description:
      "Quyết định cho cá nhân đại diện hoặc người đại diện của tổ chức nơi người chưa thành niên học tập, lao động, sinh hoạt tham gia tố tụng với tư cách được xác định.",
  },
] as const;

const BM204_FIELDS = {
  "agency.name": { label: "Viện kiểm sát ra quyết định", placeholder: "Tên Viện kiểm sát ban hành quyết định" },
  "recipients.personLine7": { label: "Người chưa thành niên", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine6": { label: "Tư cách tố tụng của người chưa thành niên", placeholder: "Người bị tố giác, người bị kiến nghị khởi tố, người bị giữ hoặc người bị buộc tội" },
  "recipients.personLine5": { label: "Người đại diện tham gia tố tụng", placeholder: "Họ tên người đại diện hoặc đại diện của tổ chức" },
  "recipients.personLine4": { label: "Cơ quan hoặc tổ chức của người đại diện", placeholder: "Tên cơ quan, tổ chức công tác, học tập hoặc sinh hoạt" },
  "recipients.personLine3": { label: "Tư cách tham gia tố tụng", placeholder: "Tư cách của người đại diện hoặc tổ chức" },
  "recipients.personLine2": { label: "Thông tin cá nhân người đại diện", placeholder: "Giới tính, ngày sinh, giấy tờ định danh và nơi cư trú" },
  "case.caseNumber": { label: "Vụ việc hoặc vụ án liên quan", placeholder: "Số quyết định khởi tố và tóm tắt vụ việc" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "document.fullDocumentCode": { label: "Số quyết định", placeholder: "Số .../QĐ-VKS" },
} as const;

const BM204_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-204",
  versionLabel: "BM-204 curated representative or organization participation decision",
  sections: BM204_SECTIONS,
  fields: BM204_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM204_RUNTIME_UX_PROFILE);
