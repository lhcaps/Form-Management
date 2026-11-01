/**
 * BM-174 runtime-ready Form Flight profile.
 *
 * Stage 07 (BIỆN PHÁP ĐIỀU TRA ĐẶC BIỆT) — "Yêu cầu áp dụng biện pháp
 * điều tra tố tụng đặc biệt". Field paths are taken verbatim from the
 * locked contract
 * `docs/audit/docx/contracts/locked/BM-174__f8e45c638bb6.contract.locked.json`
 * (Wave-03A renamed the generic placeholders to semantic semantic paths).
 *
 * Required-field subset is a strict subset of `fieldPaths`.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM174_FIELD_PATHS = [
  "agency.name",
  "document.summaryLine",
  "person.idNumber",
  "person.occupation",
  "person.currentAddress",
  "person.dateOfBirth",
  "person.personFullName",
  "document.contentLine",
  "document.issuePlace",
  "document.issueDate",
  "document.fullDocumentCode",
] as const;

const BM174_REQUIRED_FIELD_PATHS = [
  "agency.name",
  "person.personFullName",
  "document.contentLine",
  "document.issueDate",
  "document.fullDocumentCode",
] as const;

const BM174_DEMO = {
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "document.summaryLine":
    "Căn cứ hồ sơ vụ án hình sự số 12/HS-VKS-KV7 đến nay đã có đủ căn cứ xác định hành vi phạm tội.",
  "person.idNumber": "079085001234",
  "person.occupation": "Lao động tự do",
  "person.currentAddress":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "person.dateOfBirth": "08/09/1985",
  "person.personFullName": "Nguyễn Văn A",
  "document.contentLine":
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh áp dụng biện pháp điều tra tố tụng đặc biệt đối với đối tượng Nguyễn Văn A theo quy định tại Điều 226 Bộ luật Tố tụng hình sự.",
  "document.issuePlace": "TP. Hồ Chí Minh",
  "document.issueDate": "2026-07-04",
  "document.fullDocumentCode": "08/YC-VKSKV7",
} as const;

const BM174_ACCEPTANCE = {
  requiredText: [
    "YÊU CẦU",
    "Nguyễn Văn A",
    "Viện Kiểm sát nhân dân Khu vực 7",
    "08/YC-VKSKV7",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM174_SUMMARY_LINES = [
  {
    label: "Cơ quan ban hành",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).agency?.name;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Số văn bản",
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
    label: "Đối tượng áp dụng",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).person?.personFullName;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Nội dung yêu cầu",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.contentLine;
      if (typeof raw !== "string" || raw.trim().length === 0) return "—";
      return raw.length > 140 ? `${raw.slice(0, 137)}…` : raw;
    },
  },
];

export const BM174_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-174",
  title: "Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM174_FIELD_PATHS,
  requiredFieldPaths: BM174_REQUIRED_FIELD_PATHS,
  demo: BM174_DEMO,
  summaryLines: BM174_SUMMARY_LINES,
  acceptance: BM174_ACCEPTANCE,
};

registerFormFlightProfile(BM174_FORM_FLIGHT_PROFILE);
