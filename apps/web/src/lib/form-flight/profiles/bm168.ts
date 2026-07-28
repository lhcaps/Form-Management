/**
 * BM-168 runtime-ready Form Flight profile.
 *
 * Stage 05 (TRUY TỐ) — "Biên bản giao nhận hồ sơ vụ án, vụ việc".
 * All 14 fields are required (the contract marks every canonical
 * field as required). Field paths are taken verbatim from the locked
 * contract
 * `docs/audit/docx/contracts/locked/BM-168__3369df5870b2.contract.locked.json`.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM168_FIELD_PATHS = [
  "agency.parentName",
  "agency.name",
  "caseFileHandover.startedAtLine",
  "caseFileHandover.giverName",
  "caseFileHandover.giverPositionTitle",
  "caseFileHandover.receiverName",
  "caseFileHandover.receiverPositionTitle",
  "caseFileHandover.caseFileTitle",
  "caseFileHandover.handoverReasonLine",
  "caseFileHandover.fileStatsLine",
  "caseFileHandover.evidenceLine",
  "caseFileHandover.endedAtLine",
  "caseFileHandover.receiverSignerName",
  "caseFileHandover.giverSignerName",
] as const;

const BM168_REQUIRED_FIELD_PATHS = BM168_FIELD_PATHS;

const BM168_DEMO = {
  "agency.parentName":
    "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "agency.name":
    "Viện Kiểm sát nhân dân Khu vực 7",
  "caseFileHandover.startedAtLine":
    "Căn cứ vào Quyết định phân công số 09/QĐ-VKS-KV7, vào hồi 09 giờ 00 phút ngày 04 tháng 3 năm 2026 tại trụ sở Viện Kiểm sát nhân dân Khu vực 7.",
  "caseFileHandover.giverName": "Trần Thị Hồng",
  "caseFileHandover.giverPositionTitle": "Kiểm sát viên sơ cấp",
  "caseFileHandover.receiverName": "Lê Văn Hùng",
  "caseFileHandover.receiverPositionTitle": "Điều tra viên sơ cấp",
  "caseFileHandover.caseFileTitle":
    "Hồ sơ vụ án hình sự số 12/HS-VKS-KV7 về tội Đánh bạc theo Điều 321 BLHS 2015",
  "caseFileHandover.handoverReasonLine":
    "Bàn giao hồ sơ vụ án để phục vụ công tác điều tra bổ sung theo yêu cầu của Cơ quan Cảnh sát điều tra.",
  "caseFileHandover.fileStatsLine":
    "01 bản Kết luận điều tra; 01 bản Cáo trạng; 12 tờ hồ sơ vụ án có liên quan; 01 đĩa CD lưu trữ tài liệu, chứng cứ.",
  "caseFileHandover.evidenceLine":
    "01 chiếc xe máy Honda Wave RSX biển kiểm soát 59C1-123.45; 01 sổ tiết kiệm ngân hàng.",
  "caseFileHandover.endedAtLine":
    "Việc bàn giao kết thúc hồi 10 giờ 30 phút cùng ngày, các bên thống nhất không có ý kiến gì khác.",
  "caseFileHandover.receiverSignerName": "Lê Văn Hùng",
  "caseFileHandover.giverSignerName": "Trần Thị Hồng",
} as const;

const BM168_ACCEPTANCE = {
  requiredText: [
    "BIÊN BẢN",
    "giao nhận hồ sơ",
    "Trần Thị Hồng",
    "Lê Văn Hùng",
    "12/HS-VKS-KV7",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM168_SUMMARY_LINES = [
  {
    label: "Cơ quan",
    value: (data: Record<string, unknown>) => {
      const agency = (data as Record<string, Record<string, string>>).agency;
      const name = agency?.name ?? agency?.parentName;
      return typeof name === "string" && name.trim().length > 0 ? name : "—";
    },
  },
  {
    label: "Hồ sơ bàn giao",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).caseFileHandover?.caseFileTitle;
      if (typeof raw !== "string" || raw.trim().length === 0) return "—";
      return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
    },
  },
  {
    label: "Bên giao",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).caseFileHandover?.giverName;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Bên nhận",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).caseFileHandover?.receiverName;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Lý do",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).caseFileHandover?.handoverReasonLine;
      if (typeof raw !== "string" || raw.trim().length === 0) return "—";
      return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
    },
  },
];

export const BM168_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-168",
  title: "BB giao nhận hồ sơ vụ án, vụ việc",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM168_FIELD_PATHS,
  requiredFieldPaths: BM168_REQUIRED_FIELD_PATHS,
  demo: BM168_DEMO,
  summaryLines: BM168_SUMMARY_LINES,
  acceptance: BM168_ACCEPTANCE,
};

registerFormFlightProfile(BM168_FORM_FLIGHT_PROFILE);
