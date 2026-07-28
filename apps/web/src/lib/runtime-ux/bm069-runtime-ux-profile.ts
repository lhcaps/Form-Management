import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM069_DEMO = {
  "agency.name": "Viện kiểm sát nhân dân Khu vực 7",
  "recipients.personLine": "Ngân hàng thương mại cổ phần A",
  "document.fullDocumentCode": "69/LPTTK-VKSKV7",
  "document.issueDate": "04 tháng 3 năm 2026",
  "document.reasonLine": "Căn cứ quyết định hủy bỏ biện pháp phong tỏa tài khoản.",
  "document.reasonLine2": "Tài khoản không còn thuộc diện phải áp dụng biện pháp phong tỏa.",
  "person.personFullName": "Nguyễn Văn Minh",
  "person.dateOfBirth": "1990-08-20",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 079090000001 is a format-shaped synthetic test CCCD, not derived from any real customer/case data.
  "person.idNumber": "079090000001",
  "person.occupation": "Kinh doanh",
  "person.currentAddress": "Phường Bến Nghé, Thành phố Hồ Chí Minh",
  "person.currentAddress2": "Phường Bến Nghé, Thành phố Hồ Chí Minh",
  "decision.decisionLine": "Hủy bỏ biện pháp phong tỏa tài khoản theo lệnh đã nêu.",
  "document.summaryLine":
    "Tài khoản thanh toán số 123456789; số tiền được giải tỏa theo xác nhận của ngân hàng.",
} as const;

const BM069_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-069",
  versionLabel:
    "BM-069 curated batch (account-unfreeze record, no stale tokens)",
  sections: [
    {
      sectionId: "section-thong-tin-bieu-mau",
      title: "Biên bản hủy bỏ phong tỏa tài khoản",
      description:
        "Thông tin Viện kiểm sát, lệnh phong tỏa bị hủy bỏ, chủ tài khoản, tổ chức thực hiện và nội dung giải tỏa tài khoản.",
    },
  ],
  fields: {
    "agency.name": { label: "Viện kiểm sát ban hành" },
    "recipients.personLine": {
      label: "Tổ chức tín dụng/Kho bạc quản lý tài khoản bị phong tỏa",
    },
    "document.fullDocumentCode": {
      label: "Số lệnh phong tỏa tài khoản bị hủy bỏ",
    },
    "document.issueDate": {
      label: "Ngày ban hành lệnh phong tỏa tài khoản",
      smart: {
        key: "document.issueDate",
        kind: "date-parts",
        derivedTargets: ["document.issueDate"],
      },
    },
    "document.reasonLine": {
      label: "Căn cứ hủy bỏ biện pháp phong tỏa tài khoản",
      control: "TEXTAREA",
      smart: {
        key: "document.reasonLine",
        kind: "textarea",
        rows: 3,
      },
    },
    "document.reasonLine2": {
      label: "Căn cứ hoặc thông tin bổ sung về việc hủy bỏ phong tỏa",
      control: "TEXTAREA",
      smart: {
        key: "document.reasonLine2",
        kind: "textarea",
        rows: 3,
      },
    },
    "person.personFullName": {
      label: "Họ tên chủ tài khoản bị phong tỏa",
    },
    "person.dateOfBirth": { label: "Ngày sinh chủ tài khoản" },
    "person.idNumber": {
      label: "Số CMND/CCCD/Hộ chiếu của chủ tài khoản",
    },
    "person.occupation": { label: "Nghề nghiệp của chủ tài khoản" },
    "person.currentAddress": {
      label: "Nơi thường trú của chủ tài khoản",
    },
    "person.currentAddress2": {
      label: "Nơi tạm trú hoặc nơi ở hiện tại của chủ tài khoản",
    },
    "decision.decisionLine": {
      label: "Nội dung thực hiện hủy bỏ phong tỏa tài khoản",
      control: "TEXTAREA",
    },
    "document.summaryLine": {
      label: "Thông tin tài khoản, số lượng tài khoản và số tiền được giải tỏa",
      control: "TEXTAREA",
    },
  },
  demo: BM069_DEMO,
};

registerRuntimeUxProfile(BM069_RUNTIME_UX_PROFILE);
