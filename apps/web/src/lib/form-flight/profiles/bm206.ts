/**
 * BM-206 runtime-ready Form Flight profile.
 *
 * Stage 07 (BIỆN PHÁP ĐIỀU TRA ĐẶC BIỆT) — "Lệnh bắt cấp tốc". Field
 * paths are taken verbatim from the locked contract
 * `docs/audit/docx/contracts/locked/BM-206__93474453608f.contract.locked.json`.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM206_FIELD_PATHS = [
  "document.fullDocumentCode",
  "document.issueDate",
  "document.issuePlace",
  "agency.parentName",
  "agency.name",
  "document.birthYear",
  "document.birthPlace",
  "document.permanentAddress",
  "document.personName",
  "document.personFullName",
  "document.idNumber",
  "document.referenceFactLine",
  "document.urgencyFactLine",
  "document.legalBasisLine",
  "document.receiverLine",
] as const;

const BM206_REQUIRED_FIELD_PATHS = [
  "document.fullDocumentCode",
  "document.issueDate",
  "document.personFullName",
  "document.referenceFactLine",
  "document.urgencyFactLine",
] as const;

const BM206_DEMO = {
  "document.fullDocumentCode": "10/LBT-VKSKV7",
  "document.issueDate": "2026-07-04",
  "document.issuePlace": "TP. Hồ Chí Minh",
  "agency.parentName":
    "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "agency.name":
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "document.birthYear": "1985",
  "document.birthPlace": "Tỉnh Bình Dương",
  "document.permanentAddress":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "document.personName": "Nguyễn Văn",
  "document.personFullName": "Nguyễn Văn A",
  "document.idNumber": "079085001234",
  "document.referenceFactLine":
    "Đối tượng đang chuẩn bị tẩu thoát khỏi địa phương để trốn tránh sự truy cứu trách nhiệm hình sự.",
  "document.urgencyFactLine":
    "Căn cứ tài liệu trong hồ sơ vụ án hình sự số 12/HS-VKS-KV7 cho thấy hành vi phạm tội đặc biệt nghiêm trọng.",
  "document.legalBasisLine":
    "Căn cứ Điều 113, Điều 114, Điều 115 Bộ luật Tố tụng hình sự năm 2015.",
  "document.receiverLine":
    "Gửi Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh để thi hành.",
} as const;

const BM206_ACCEPTANCE = {
  requiredText: [
    "LỆNH BẮT CẤP TỐC",
    "Nguyễn Văn A",
    "Viện Kiểm sát nhân dân Khu vực 7",
    "10/LBT-VKSKV7",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM206_SUMMARY_LINES = [
  {
    label: "Cơ quan",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).agency?.name;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Số LBT",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.fullDocumentCode;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Ngày ban hành",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.issueDate;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Đối tượng",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.personFullName;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Lý do khẩn cấp",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.urgencyFactLine;
      if (typeof raw !== "string" || raw.trim().length === 0) return "—";
      return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
    },
  },
];

export const BM206_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-206",
  title: "Lệnh bắt cấp tốc",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM206_FIELD_PATHS,
  requiredFieldPaths: BM206_REQUIRED_FIELD_PATHS,
  demo: BM206_DEMO,
  summaryLines: BM206_SUMMARY_LINES,
  acceptance: BM206_ACCEPTANCE,
};

registerFormFlightProfile(BM206_FORM_FLIGHT_PROFILE);
