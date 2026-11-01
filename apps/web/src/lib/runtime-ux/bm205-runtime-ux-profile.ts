/** BM-205 source-aligned runtime UX for a juvenile preventive-measure notice. */
import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM205_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Áp dụng biện pháp ngăn chặn đối với người chưa thành niên",
    description:
      "Thông báo cho gia đình, chính quyền cấp xã hoặc cơ quan, tổ chức liên quan về biện pháp ngăn chặn và thời gian áp dụng đối với người chưa thành niên.",
  },
] as const;

const BM205_FIELDS = {
  "agency.name": { label: "Viện kiểm sát thông báo", placeholder: "Tên Viện kiểm sát ban hành thông báo" },
  "recipients.personLine": { label: "Gia đình, cơ quan hoặc tổ chức nhận thông báo", placeholder: "Tên người, Ủy ban nhân dân cấp xã, cơ quan hoặc tổ chức" },
  "recipients.personLine14": { label: "Biện pháp ngăn chặn", placeholder: "Tên biện pháp ngăn chặn được áp dụng" },
  "recipients.personLine13": { label: "Người chưa thành niên", placeholder: "Họ tên người chưa thành niên" },
  "document.fullDocumentCode": { label: "Số thông báo", placeholder: "Số .../TB-VKS" },
  "recipients.personLine12": { label: "Giới tính", placeholder: "Giới tính người chưa thành niên" },
  "recipients.personLine11": { label: "Tên gọi khác", placeholder: "Tên gọi khác, nếu có" },
  "recipients.personLine10": { label: "Ngày sinh và nơi sinh", placeholder: "Ngày sinh, nơi sinh" },
  "recipients.personLine9": { label: "Quốc tịch, dân tộc, tôn giáo", placeholder: "Thông tin quốc tịch, dân tộc, tôn giáo" },
  "recipients.personLine8": { label: "Nghề nghiệp", placeholder: "Nghề nghiệp" },
  "recipients.personLine7": { label: "Giấy tờ định danh", placeholder: "Số CMND, CCCD, hộ chiếu hoặc số định danh" },
  "recipients.personLine6": { label: "Thông tin cấp giấy tờ", placeholder: "Ngày cấp và nơi cấp" },
  "recipients.personLine5": { label: "Nơi thường trú", placeholder: "Địa chỉ thường trú" },
  "recipients.personLine4": { label: "Nơi tạm trú", placeholder: "Địa chỉ tạm trú" },
  "recipients.personLine3": { label: "Nơi ở hiện tại", placeholder: "Địa chỉ nơi ở hiện tại" },
  "recipients.personLine2": { label: "Thời gian áp dụng", placeholder: "Thời điểm bắt đầu và kết thúc áp dụng" },
} as const;

const BM205_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-205",
  versionLabel: "BM-205 curated juvenile preventive-measure notice",
  sections: BM205_SECTIONS,
  fields: BM205_FIELDS,
  demo: {},
};

registerRuntimeUxProfile(BM205_RUNTIME_UX_PROFILE);
