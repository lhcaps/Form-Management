/**
 * Curated runtime-ux profile for BM-052 — UI-only override metadata for the
 * standalone `/templates/BM-052` template page.
 *
 * Title: QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM052_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "1. Thông tin biểu mẫu",
    description:
      "Tên cơ quan ban hành và người bị áp dụng.",
  },
  {
    sectionId: "section-nhan-than",
    title: "2. Nhân thân",
    description:
      "Họ tên, tên gọi khác, số CCCD/Hộ chiếu, nơi tạm trú, sinh ngày/tháng/năm, nơi sinh, quốc tịch, dân tộc, tôn giáo.",
  },
  {
    sectionId: "section-chu-ky",
    title: "3. Chữ ký",
    description: "Họ tên người ký.",
  },
] as const;

const BM052_FIELDS = {
  "agency.name": {
    label: "Tên cơ quan",
    placeholder: "Viện Kiểm sát nhân dân Tỉnh Bình Thuận",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng",
    placeholder:
      "Bà Trần Thị Ngọc Mai — địa chỉ: Số 4 đường Trần Phú, TP. Phan Thiết, Tỉnh Bình Thuận;",
  },
  "person.fullName": {
    label: "Họ tên",
    placeholder: "Trần Thị Ngọc Mai",
  },
  "person.otherName": {
    label: "Tên gọi khác",
    placeholder: "Không có",
  },
  "person.idNumber": {
    label: "Số CCCD / Hộ chiếu",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 089302001111 is a format-shaped synthetic test value, not derived from any real customer/case data.
    placeholder: "089302001111",
  },
  "person.birthInfoLine": {
    label: "Sinh ngày, tháng, năm, nơi sinh",
    placeholder: "Sinh năm 1985, tại TP. Phan Thiết, Tỉnh Bình Thuận",
    control: "TEXTAREA",
    smart: {
      key: "person.birthInfoLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Sinh ngày …, tháng …, năm …, tại …;",
    },
  },
  "person.nationalityEthnicityReligionLine": {
    label: "Quốc tịch, dân tộc, tôn giáo",
    placeholder: "Quốc tịch Việt Nam; dân tộc Kinh; tôn giáo Không",
    control: "TEXTAREA",
    smart: {
      key: "person.nationalityEthnicityReligionLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Quốc tịch …; dân tộc …; tôn giáo …;",
    },
  },
  "person.temporaryAddress": {
    label: "Nơi tạm trú",
    placeholder:
      "Số 4 đường Trần Phú, Phường Đức Nghĩa, TP. Phan Thiết, Tỉnh Bình Thuận",
  },
  "signature.signerName": {
    label: "Người ký",
    placeholder: "Bùi Hồng Phong",
  },
} as const;

const BM052_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Tỉnh Bình Thuận",
  "recipients.personLine":
    "Bà Trần Thị Ngọc Mai — địa chỉ: Số 4 đường Trần Phú, TP. Phan Thiết, Tỉnh Bình Thuận;",
  "person.fullName": "Trần Thị Ngọc Mai",
  "person.otherName": "Không có",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: 089302001111 is a format-shaped synthetic test value, not derived from any real customer/case data.
  "person.idNumber": "089302001111",
  "person.birthInfoLine":
    "Sinh năm 1985, tại TP. Phan Thiết, Tỉnh Bình Thuận",
  "person.nationalityEthnicityReligionLine":
    "Quốc tịch Việt Nam; dân tộc Kinh; tôn giáo Không",
  "person.temporaryAddress":
    "Số 4 đường Trần Phú, Phường Đức Nghĩa, TP. Phan Thiết, Tỉnh Bình Thuận",
  "signature.signerName": "Bùi Hồng Phong",
} as const;

const BM052_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-052",
  versionLabel:
    "BM-052 curated batch (header + dossier + signature, no stale tokens)",
  sections: BM052_SECTIONS,
  fields: BM052_FIELDS,
  demo: BM052_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM052_RUNTIME_UX_PROFILE);
