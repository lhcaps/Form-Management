/**
 * BM-136 runtime-ready Form Flight profile.
 *
 * Stage 04 (KHỞI TỐ, ĐIỀU TRA) — "Biên bản đối chất". Field paths are
 * taken verbatim from the locked contract
 * `docs/audit/docx/contracts/locked/BM-136__f7c2e28ddd12.contract.locked.json`.
 *
 * The contract carries 17 canonical fields spanning agency / signature /
 * recipients (person identity) / person charges / document identifiers /
 * archive, all marked as required for the legal face of the form.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM136_FIELD_PATHS = [
  "agency.vienKiem",
  "signature.positionTitle",
  "recipients.personLine",
  "document.soQuyet",
  "agency.diaDanh",
  "document.ngayBan",
  "agency.dongDia",
  "document.chuThe",
  "person.tenBi",
  "document.tenVu",
  "person.toiDanh",
  "document.soTien",
  "document.lyDo",
  "recipients.luuHo",
  "signature.cheDo",
  "signature.chucVu",
  "signature.nguoiKy",
] as const;

const BM136_REQUIRED_FIELD_PATHS = [
  "agency.vienKiem",
  "signature.positionTitle",
  "recipients.personLine",
  "document.tenVu",
  "person.tenBi",
  "person.toiDanh",
  "document.ngayBan",
] as const;

const BM136_DEMO = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Khu vực 7",
  "signature.positionTitle": "Kiểm sát viên sơ cấp",
  "recipients.personLine": "Nguyễn Văn A",
  "document.soQuyet": "09/QĐ-VKSKV7",
  "agency.diaDanh": "Thành phố Hồ Chí Minh",
  "document.ngayBan": "2026-07-04",
  "agency.dongDia":
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "document.chuThe": "Bên tham gia đối chất",
  "person.tenBi": "Nguyễn Văn A",
  "document.tenVu": "Vụ án Đánh bạc tại Phường Bến Nghé, Quận 1",
  "person.toiDanh": "Đánh bạc",
  "document.soTien": "Không áp dụng",
  "document.lyDo":
    "Hai lời khai có mâu thuẫn về thời điểm tham gia đánh bạc; cần đối chất để làm rõ.",
  "recipients.luuHo": "Lưu: HSVA, HSKS, VP.",
  "signature.cheDo": "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, TP.HCM",
  "signature.chucVu": "Bị can",
  "signature.nguoiKy": "Lê Văn C",
} as const;

const BM136_ACCEPTANCE = {
  requiredText: [
    "BẢN ĐỐI CHẤT",
    "Điều 178",
    "Điều 189",
    "Nguyễn Văn A",
    "Đánh bạc",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM136_SUMMARY_LINES = [
  {
    label: "Cơ quan",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).agency?.vienKiem;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Tên vụ án",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.tenVu;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Bị can",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).person?.tenBi;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Tội danh",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).person?.toiDanh;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Số QĐ",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.soQuyet;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Lý do",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.lyDo;
      if (typeof raw !== "string" || raw.trim().length === 0) return "—";
      return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
    },
  },
];

export const BM136_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-136",
  title: "BB đối chất",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM136_FIELD_PATHS,
  requiredFieldPaths: BM136_REQUIRED_FIELD_PATHS,
  demo: BM136_DEMO,
  summaryLines: BM136_SUMMARY_LINES,
  acceptance: BM136_ACCEPTANCE,
};

registerFormFlightProfile(BM136_FORM_FLIGHT_PROFILE);
