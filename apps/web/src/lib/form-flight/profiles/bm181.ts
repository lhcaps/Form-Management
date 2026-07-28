/**
 * BM-181 runtime-ready Form Flight profile.
 *
 * Stage 08 (THỦ TỤC ĐẶC BIỆT) "Quyết định áp dụng thủ tục rút gọn".
 * Field paths are taken verbatim from the locked contract
 * `docs/audit/docx/contracts/locked/BM-181__ec1d8701fc13.contract.locked.json`
 * and verified against the Wave-03A remediation log.
 *
 * Required-field subset is a strict subset of `fieldPaths`.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM181_FIELD_PATHS = [
  "agency.name",
  "document.fullDocumentCode",
  "document.issueDate",
] as const;

const BM181_REQUIRED_FIELD_PATHS = [
  "agency.name",
  "document.fullDocumentCode",
  "document.issueDate",
] as const;

const BM181_DEMO = {
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  "document.fullDocumentCode": "07/QĐ-VKSKV7",
  "document.issueDate": "2026-07-04",
} as const;

const BM181_ACCEPTANCE = {
  requiredText: [
    "QUYẾT ĐỊNH",
    "Viện Kiểm sát nhân dân Khu vực 7",
    "07/QĐ-VKSKV7",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM181_SUMMARY_LINES = [
  {
    label: "Cơ quan ban hành",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).agency?.name;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Số QĐ",
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
];

export const BM181_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-181",
  title: "QĐ áp dụng thủ tục rút gọn",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM181_FIELD_PATHS,
  requiredFieldPaths: BM181_REQUIRED_FIELD_PATHS,
  demo: BM181_DEMO,
  summaryLines: BM181_SUMMARY_LINES,
  acceptance: BM181_ACCEPTANCE,
};

registerFormFlightProfile(BM181_FORM_FLIGHT_PROFILE);
