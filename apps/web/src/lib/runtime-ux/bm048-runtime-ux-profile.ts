/**
 * Curated runtime-ux profile for BM-048 — UI-only override metadata for the
 * standalone `/templates/BM-048` template page.
 *
 * Title: QĐ huỷ bỏ biện pháp bảo lĩnh
 *
 * Note: BM-048 uses non-standard compound Vietnamese keys inherited from
 * the locked/compiled contract. The keys in this profile are taken
 * verbatim from the compiled contract — DO NOT renamesake them. The
 * curated labels, placeholders and demo data are still safe to add.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM048_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Quyết định huỷ bỏ biện pháp bảo lĩnh — Thông tin biểu mẫu",
    description:
      "Tên cơ quan, tên cơ quan đầy đủ, người bị áp dụng, địa danh ban hành, số quyết định, ngày ban hành, căn cứ pháp lý và căn cứ chi tiết.",
  },
] as const;

const BM048_FIELDS = {
  "agency.tenVien": {
    label: "Tên viện kiểm sát",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  },
  "agency.coQuan": {
    label: "Tên cơ quan",
    placeholder: "Viện Kiểm sát nhân dân Quận Bình Thạnh",
  },
  "recipients.personLine": {
    label: "Người bị áp dụng (người bảo lĩnh cũ)",
    placeholder: "Bà Lê Thị Hoa — địa chỉ: 12 đường Điện Biên Phủ, Quận Bình Thạnh, TP. HCM",
  },
  "agency.diaDanh": {
    label: "Địa danh",
    placeholder: "TP. Hồ Chí Minh",
  },
  "document.soQuyet": {
    label: "Số quyết định",
    placeholder: "68/QĐ-VKSHBBL",
  },
  "document.ngayBan": {
    label: "Ngày ban hành",
    placeholder: "04 tháng 7 năm 2026",
  },
  "legalBasis.canCu": {
    label: "Căn cứ pháp lý",
    placeholder:
      "Căn cứ Điều 121, Điều 125 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.canCu",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 121, Điều 125 BLTTHS năm 2015;",
    },
  },
  "document.canCu": {
    label: "Căn cứ chi tiết",
    placeholder:
      "Căn cứ Quyết định về việc bảo lĩnh số 39/QĐ-BL-PC04 ngày 04/6/2026; căn cứ Đơn đề nghị số 73/TTr-PC04 ngày 02/7/2026 của Cơ quan Cảnh sát điều tra;",
    control: "TEXTAREA",
    smart: {
      key: "document.canCu",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ QĐ về việc bảo lĩnh …; Đơn đề nghị …;",
    },
  },
} as const;

const BM048_DEMO_RUNTIME_UX = {
  "agency.tenVien":
    "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "agency.coQuan":
    "Viện Kiểm sát nhân dân Quận Bình Thạnh",
  "recipients.personLine":
    "Bà Lê Thị Hoa — địa chỉ: 12 đường Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh",
  "agency.diaDanh": "TP. Hồ Chí Minh",
  "document.soQuyet": "68/QĐ-VKSHBBL",
  "document.ngayBan": "04 tháng 7 năm 2026",
  "legalBasis.canCu":
    "Căn cứ Điều 121, Điều 125 Bộ luật Tố tụng hình sự năm 2015;",
  "document.canCu":
    "Căn cứ Quyết định về việc bảo lĩnh số 39/QĐ-BL-PC04 ngày 04/6/2026; căn cứ Đơn đề nghị số 73/TTr-PC04 ngày 02/7/2026 của Cơ quan Cảnh sát điều tra;",
} as const;

const BM048_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-048",
  versionLabel:
    "BM-048 curated batch (non-standard compound Vietnamese keys, no stale tokens)",
  sections: BM048_SECTIONS,
  fields: BM048_FIELDS,
  demo: BM048_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM048_RUNTIME_UX_PROFILE);
