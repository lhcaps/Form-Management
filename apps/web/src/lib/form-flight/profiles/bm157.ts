/**
 * BM-157 runtime-ready Form Flight profile.
 *
 * Single-section form "Bản kê vật chứng kèm theo Cáo trạng" — curated
 * after R5 promotion. Field path `agency.vienKiem` is taken verbatim
 * from the locked contract
 * `docs/audit/docx/contracts/locked/BM-157__a5c6971a69d2.contract.locked.json`.
 *
 * Stage 05 (TRUY TỐ), form number 157/HS, issued under Thông tư số
 * 03/2026/TT-VKSTC. The DOCX holds a single filled token
 * (`{{agency.vienKiem}}`) next to the VỤ ÁN: prefix.
 *
 * Demo data uses the same VKS Khu vực 7 fixture as BM-001 / BM-171 so
 * the discharge preview is coherent across the canonical cohort.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM157_FIELD_PATHS = ["agency.vienKiem"] as const;

const BM157_DEMO = {
  "agency.vienKiem": "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
} as const;

const BM157_ACCEPTANCE = {
  // The literal template header text + canonical fixture agency name.
  requiredText: [
    "BẢN KÊ VẬT CHỨNG KÈM THEO BẢN CÁO TRẠNG",
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM157_SUMMARY_LINES = [
  {
    label: "Viện kiểm sát",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).agency?.vienKiem;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Số văn bản",
    value: () => "Mẫu số 157/HS",
  },
  {
    label: "Căn cứ",
    value: () => "Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026",
  },
];

export const BM157_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-157",
  title: "Bản kê vật chứng kèm theo Cáo trạng",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM157_FIELD_PATHS,
  requiredFieldPaths: BM157_FIELD_PATHS,
  demo: BM157_DEMO,
  summaryLines: BM157_SUMMARY_LINES,
  acceptance: BM157_ACCEPTANCE,
};

registerFormFlightProfile(BM157_FORM_FLIGHT_PROFILE);
