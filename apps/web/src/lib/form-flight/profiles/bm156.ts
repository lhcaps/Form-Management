/**
 * BM-156 runtime-ready Form Flight profile.
 *
 * Stage 02 (CÁO TRẠNG) — "Cáo trạng truy tố bị can trước Tòa án".
 * Field paths are taken verbatim from the locked contract
 * `docs/audit/docx/contracts/locked/BM-156__ef438a40e567.contract.locked.json`.
 *
 * The contract carries 41 canonical fields spanning agency, document,
 * official, legal basis, case decision, accused decision, case joinder,
 * case recovery, investigation conclusion, indictment, recipients and
 * signature. The previous draft of this profile used a fabricated
 * `report.*` namespace that did not exist in either the locked contract
 * or the persistence DTO. This file was rewritten on 2026-07-25 to
 * align with the contract — which is the source of truth for A5
 * persistence/hydration.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM156_FIELD_PATHS = [
  "agency.name",
  "agency.parentName",
  "document.documentCode",
  "document.issuePlaceAndDateLine",
  "official.issuerTitle",
  "legalBasis.procedureArticlesLine",
  "caseDecision.prosecutionDecisionLegalBasisLine",
  "accusedDecision.prosecutionDecisionLegalBasisLine",
  "caseJoinder.legalBasisLine",
  "caseRecovery.legalBasisLine",
  "investigationConclusion.legalBasisLine",
  "indictment.criminalActDescriptionLine",
  "indictment.aggravatingMitigatingAnalysisLine",
  "indictment.evidenceHandlingLine",
  "indictment.civilLiabilityLine",
  "indictment.otherFactsLine",
  "indictment.summaryConclusionLine",
  "indictment.absentAccusedNoteLine",
  "indictment.defendantIdentityLine",
  "indictment.familyBackgroundLine",
  "indictment.specialStatusLine",
  "indictment.administrativeViolationLine",
  "indictment.criminalRecordLine",
  "indictment.preventiveMeasureLine",
  "indictment.crimeConclusionLine",
  "indictment.aggravatingMitigatingLine",
  "indictment.separatedCaseHandlingLine",
  "indictment.article1Line",
  "indictment.replacementLine",
  "indictment.caseFileLine",
  "indictment.evidenceListLine",
  "indictment.summonedPersonsLine",
  "recipients.courtLine",
  "recipients.accusedLine",
  "recipients.defenseCounselLine",
  "recipients.investigatingAgencyLine",
  "recipients.otherRecipientLine",
  "recipients.archiveLine",
  "signature.signMode",
  "signature.positionTitle",
  "signature.signerName",
] as const;

const BM156_REQUIRED_FIELD_PATHS = [
  "agency.name",
  "agency.parentName",
  "document.documentCode",
  "document.issuePlaceAndDateLine",
  "official.issuerTitle",
  "legalBasis.procedureArticlesLine",
  "caseDecision.prosecutionDecisionLegalBasisLine",
  "accusedDecision.prosecutionDecisionLegalBasisLine",
  "investigationConclusion.legalBasisLine",
  "indictment.criminalActDescriptionLine",
  "indictment.summaryConclusionLine",
  "indictment.article1Line",
  "indictment.crimeConclusionLine",
  "indictment.caseFileLine",
  "recipients.courtLine",
  "recipients.archiveLine",
  "signature.positionTitle",
  "signature.signerName",
] as const;

const BM156_DEMO = {
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "document.documentCode": "156/CT-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 21 tháng 5 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ các điều 41, 236, 239 và 243 của Bộ luật Tố tụng hình sự;",
  "caseDecision.prosecutionDecisionLegalBasisLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số G505/QĐ-VPCQCSĐT ngày 15 tháng 10 năm 2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội \"Đánh bạc\" quy định tại khoản 1 Điều 321 của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025;",
  "accusedDecision.prosecutionDecisionLegalBasisLine":
    "Căn cứ Quyết định khởi tố bị can số ngày 15 tháng 10 năm 2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với về tội \"Đánh bạc\" quy định tại khoản 1 Điều 321 của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025;",
  "caseJoinder.legalBasisLine":
    "Căn cứ Quyết định nhập vụ án hình sự số 03/QĐ-CQĐT ngày 10 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "caseRecovery.legalBasisLine":
    "Căn cứ Quyết định phục hồi vụ án hình sự số 04/QĐ-CQĐT ngày 15 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "investigationConclusion.legalBasisLine":
    "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 25/KLĐT ngày 20 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "indictment.criminalActDescriptionLine":
    "đã có hành vi đánh bạc trái phép tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh. Hành vi của bị can xâm phạm trật tự công cộng, đủ yếu tố cấu thành tội Đánh bạc theo quy định của Bộ luật Hình sự.",
  "indictment.aggravatingMitigatingAnalysisLine":
    "Về tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự: bị can thành khẩn khai báo, ăn năn hối cải; chưa phát hiện tình tiết tăng nặng trách nhiệm hình sự.",
  "indictment.evidenceHandlingLine":
    "Việc thu giữ, tạm giữ tài liệu, đồ vật và xử lý vật chứng được thực hiện theo hồ sơ vụ án.",
  "indictment.civilLiabilityLine":
    "Phần dân sự: không có yêu cầu giải quyết trong vụ án.",
  "indictment.otherFactsLine":
    "Các vấn đề khác có liên quan đã được xem xét trong quá trình giải quyết vụ án.",
  "indictment.summaryConclusionLine":
    "đã thực hiện hành vi đánh bạc trái phép; hành vi có đủ yếu tố cấu thành tội Đánh bạc, thuộc trường hợp phải truy tố trách nhiệm hình sự.",
  "indictment.absentAccusedNoteLine":
    "Bị can có mặt tại địa phương, không thuộc trường hợp vắng mặt bị can.",
  "indictment.defendantIdentityLine":
    ", giới tính: Nam; nơi cư trú: số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh; nghề nghiệp: lao động tự do; trình độ học vấn: 9/12; quốc tịch: Việt Nam; dân tộc: Kinh.",
  "indictment.familyBackgroundLine":
    "Về gia đình: cha, mẹ, anh chị em ruột, vợ/chồng, con của bị can được thể hiện trong hồ sơ vụ án.",
  "indictment.specialStatusLine":
    "Bị can không thuộc diện thương binh, bệnh binh, người có công hoặc có danh hiệu Nhà nước phong tặng.",
  "indictment.administrativeViolationLine": "Tiền sự: không.",
  "indictment.criminalRecordLine": "Tiền án: không.",
  "indictment.preventiveMeasureLine":
    "Bị can đang bị áp dụng biện pháp ngăn chặn cấm đi khỏi nơi cư trú theo quyết định của cơ quan có thẩm quyền.",
  "indictment.crimeConclusionLine":
    "Bị can phạm tội \"Đánh bạc\" theo quy định tại khoản 1 Điều 321 Bộ luật Hình sự.",
  "indictment.aggravatingMitigatingLine":
    "Áp dụng tình tiết giảm nhẹ trách nhiệm hình sự: thành khẩn khai báo, ăn năn hối cải; chưa áp dụng tình tiết tăng nặng trách nhiệm hình sự.",
  "indictment.separatedCaseHandlingLine":
    "Trong vụ án không có người hoặc pháp nhân được đình chỉ, tạm đình chỉ, tách ra để xử lý trong vụ án khác.",
  "indictment.article1Line":
    "Truy tố ra trước Tòa án nhân dân có thẩm quyền để xét xử bị can về tội \"Đánh bạc\" theo quy định tại khoản 1 Điều 321 Bộ luật Hình sự.",
  "indictment.replacementLine":
    "Cáo trạng này thay thế Cáo trạng số 01/CT-VKSKV7 ngày 10 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7.",
  "indictment.caseFileLine":
    "- Hồ sơ vụ án gồm có: 01 tập, bằng 120 tờ; đánh số thứ tự từ 01 đến 120.",
  "indictment.evidenceListLine":
    "- Bản kê vật chứng kèm theo hồ sơ vụ án.",
  "indictment.summonedPersonsLine":
    "- Danh sách những người Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa.",
  "recipients.courtLine":
    "Tòa án nhân dân có thẩm quyền xét xử vụ án hình sự.",
  "recipients.accusedLine": "Bị can.",
  "recipients.defenseCounselLine":
    "Người bào chữa (nếu có).",
  "recipients.investigatingAgencyLine":
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh.",
  "recipients.otherRecipientLine":
    "Các cơ quan, tổ chức có liên quan theo quy định.",
  "recipients.archiveLine": "Lưu hồ sơ Viện kiểm sát.",
  "signature.signMode": "KT. VIỆN TRƯỞNG",
  "signature.positionTitle": "PHÓ VIỆN TRƯỞNG",
  "signature.signerName": "Phạm Văn Đức",
} as const;

const BM156_ACCEPTANCE = {
  requiredText: [
    "CÁO TRẠNG",
    "Phạm Văn Đức",
    "156/CT-VKSKV7",
    "Bị can",
    "Đánh bạc",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
    "report.signalReceivedDate",
  ],
};

const BM156_SUMMARY_LINES = [
  {
    label: "Số văn bản",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.documentCode;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Ngày ban hành",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.issuePlaceAndDateLine;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Bị can",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).indictment?.defendantIdentityLine;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Tội danh",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).indictment?.crimeConclusionLine;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Điều luật",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).indictment?.article1Line;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
];

export const BM156_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-156",
  title: "Cáo trạng truy tố bị can trước Tòa án",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM156_FIELD_PATHS,
  requiredFieldPaths: BM156_REQUIRED_FIELD_PATHS,
  demo: BM156_DEMO,
  summaryLines: BM156_SUMMARY_LINES,
  acceptance: BM156_ACCEPTANCE,
};

registerFormFlightProfile(BM156_FORM_FLIGHT_PROFILE);
