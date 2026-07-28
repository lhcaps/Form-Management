/** BM-192 source-aligned runtime UX for declining community diversion. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM192_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định không áp dụng xử lý chuyển hướng tại cộng đồng",
    description:
      "Căn cứ không áp dụng biện pháp xử lý chuyển hướng và việc tiếp tục giải quyết vụ án theo thủ tục luật định.",
  },
] as const;

const BM192_FIELDS = {
  "agency.name": { label: "Viện kiểm sát ra quyết định", placeholder: "Tên Viện kiểm sát ban hành" },
  "recipients.personLine": { label: "Người chưa thành niên không được áp dụng", placeholder: "Họ tên người chưa thành niên" },
  "recipients.personLine13": { label: "Chức danh người ký", placeholder: "Chức danh người ký quyết định" },
  "document.issuePlace": { label: "Địa danh ban hành", placeholder: "Tỉnh hoặc thành phố nơi ban hành" },
  "document.issueDate": { label: "Ngày ban hành", placeholder: "Ngày, tháng, năm ban hành" },
  "recipients.personLine12": { label: "Lý do và căn cứ không áp dụng", placeholder: "Lý do, căn cứ ra quyết định" },
  "recipients.personLine11": { label: "Người đại diện", placeholder: "Họ tên và nơi cư trú hoặc làm việc" },
  "recipients.personLine10": { label: "Người bào chữa", placeholder: "Họ tên và nơi làm việc" },
  "recipients.personLine9": { label: "Vụ án tiếp tục giải quyết", placeholder: "Thông tin vụ án tiếp tục giải quyết" },
  "recipients.personLine8": { label: "Cơ quan khởi tố vụ án", placeholder: "Cơ quan, người ra quyết định khởi tố vụ án" },
  "recipients.personLine7": { label: "Cơ quan khởi tố bị can", placeholder: "Cơ quan, người ra quyết định khởi tố bị can" },
  "recipients.personLine6": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine5": { label: "Thông tin cấp giấy tờ", placeholder: "Ngày cấp và nơi cấp" },
  "recipients.personLine4": { label: "Nơi thường trú", placeholder: "Địa chỉ thường trú" },
  "recipients.personLine3": { label: "Nơi tạm trú", placeholder: "Địa chỉ tạm trú" },
  "recipients.personLine2": { label: "Nơi ở hiện tại", placeholder: "Địa chỉ hiện tại" },
  "document.fullDocumentCode": { label: "Số quyết định không áp dụng", placeholder: "Số .../QĐ-VKS" },
} as const;

const BM192_DEMO_RUNTIME_UX = {} as const;

const BM192_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-192",
  versionLabel: "BM-192 curated community diversion refusal",
  sections: BM192_SECTIONS,
  fields: BM192_FIELDS,
  demo: BM192_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM192_RUNTIME_UX_PROFILE);
