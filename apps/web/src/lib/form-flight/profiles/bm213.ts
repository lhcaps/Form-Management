/**
 * BM-213 runtime-ready Form Flight profile.
 *
 * Stage 04 (KHỞI TỐ) — "Biên bản bắt người bị giữ trong trường hợp
 * khẩn cấp". Field paths are taken verbatim from the locked contract
 * `docs/audit/docx/contracts/locked/BM-213__44ed546d8e88.contract.locked.json`.
 *
 * The contract carries 28 canonical fields spanning signed-time,
 * receiver, criminal-fact, person-identity, signers, archive and
 * visit/notification lines. The required-subset is taken from the
 * "Văn bản bắt buộc ghi đầy đủ" declarations and is the strict subset
 * of `fieldPaths`.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM213_FIELD_PATHS = [
  "agency.parentName",
  "agency.name",
  "document.documentCode",
  "document.issuePlaceAndDateLine",
  "official.issuerTitle",
  "person.fullName",
  "person.genderLabel",
  "person.otherName",
  "person.dateOfBirthText",
  "person.placeOfBirth",
  "person.nationality",
  "person.ethnicity",
  "person.religion",
  "person.occupation",
  "person.identityDocumentLine",
  "person.identityIssueLine",
  "person.permanentAddress",
  "person.temporaryAddress",
  "person.currentAddress",
  "juvenileProtection.contextLine",
  "juvenileProtection.article1Line",
  "juvenileProtection.resultDeadlineLine",
  "juvenileProtection.article2Line",
  "recipients.primaryLine",
  "recipients.investigationAuthorityLine",
  "recipients.otherRecipientsLine",
  "recipients.archiveLine",
  "signature.signerName",
  "signedTime.identityIssuedByLine",
  "signedTime.criminalFactLine",
  "signedTime.searchDecisionLine",
  "signedTime.detentionDecisionLine",
  "signedTime.detentionDecisionCodeLine",
  "signedTime.detentionDecisionIssuedAtLine",
  "signedTime.detentionDecisionIssuedByLine",
  "signedTime.evidenceRelatedLawLine",
  "signedTime.detentionCourtDecisionCodeLine",
  "signedTime.detentionCourtDecisionIssuedAtLine",
  "signedTime.detentionCourtDecisionIssuedByLine",
  "signedTime.detentionDurationLine",
  "signedTime.detentionPlaceLine",
  "signedTime.personFullName",
  "signedTime.detentionReasonLine",
  "signedTime.detentionDecisionContentLine",
  "signedTime.detentionSubjectLine",
  "signedTime.detentionDecisionContent2Line",
  "signedTime.detentionDecisionContent3Line",
  "signedTime.detentionDecisionContent4Line",
  "signedTime.detachLine",
  "signedTime.staffSubRole",
  "recipients.staffLine",
  "recipients.staffName",
] as const;

const BM213_REQUIRED_FIELD_PATHS = [
  "signedTime.startedAtLine",
  "signedTime.personFullName",
  "signedTime.detentionReasonLine",
  "recipients.staffName",
] as const;

const BM213_DEMO = {
  "signedTime.startedAtLine":
    "Căn cứ Quyết định tạm giữ số 12/QĐ-VKS-KV7, vào hồi 02 giờ 30 phút ngày 04 tháng 7 năm 2026 tại Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh.",
  "signedTime.endedAtLine":
    "Việc lập biên bản kết thúc hồi 03 giờ 15 phút cùng ngày. Biên bản gồm 02 trang, đã đọc cho đương sự nghe, đương sự thừa nhận đúng và cùng ký tên xác nhận.",
  "signedTime.birthYearLine": "1985",
  "signedTime.birthPlaceLine": "Tỉnh Bình Dương",
  "signedTime.identityIssuedByLine":
    "Cục Cảnh sát QLHC về TTXH cấp ngày 15/9/2018",
  "signedTime.criminalFactLine":
    "Bị bắt theo Quyết định tạm giữ số 12/QĐ-VKS-KV7 về tội Đánh bạc (Điều 321 BLHS 2015).",
  "signedTime.searchDecisionLine":
    "Lệnh khám xét số 09/KX-VKS-KV7 do Cơ quan Cảnh sát điều tra Công an TP.HCM ban hành.",
  "signedTime.detentionDecisionLine":
    "Quyết định tạm giữ số 12/QĐ-VKS-KV7 do Viện Kiểm sát nhân dân Khu vực 7 phê chuẩn.",
  "signedTime.detentionDecisionCodeLine": "12/QĐ-VKS-KV7",
  "signedTime.detentionDecisionIssuedAtLine":
    "Ngày 04 tháng 7 năm 2026 tại Thành phố Hồ Chí Minh.",
  "signedTime.detentionDecisionIssuedByLine":
    "Viện Kiểm sát nhân dân Khu vực 7, Thành phố Hồ Chí Minh.",
  "signedTime.evidenceRelatedLawLine":
    "Tang vật thu giữ: 01 chiếc xe máy, 01 điện thoại di động, 02 triệu đồng tiền mặt.",
  "signedTime.detentionCourtDecisionCodeLine": "Không áp dụng",
  "signedTime.detentionCourtDecisionIssuedAtLine": "Không áp dụng",
  "signedTime.detentionCourtDecisionIssuedByLine": "Không áp dụng",
  "signedTime.detentionDurationLine":
    "Tạm giữ trong thời hạn 24 giờ theo quy định tại Điều 116 BLTTHS 2015.",
  "signedTime.detentionPlaceLine":
    "Nhà tạm giữ Công an Thành phố Hồ Chí Minh, số 12 Trần Hưng Đạo, Quận 1.",
  "signedTime.personFullName": "Nguyễn Văn A",
  "signedTime.detentionReasonLine":
    "Đương sự hiện đang bị tạm giữ khẩn cấp để phục vụ công tác điều tra, có dấu hiệu bỏ trốn, cản trở điều tra.",
  "signedTime.detentionDecisionContentLine":
    "Đã đọc, giải thích Quyết định tạm giữ cho đương sự Nguyễn Văn A nghe; đương sự thừa nhận hành vi phạm tội.",
  "signedTime.detentionSubjectLine":
    "Lực lượng phối hợp: 01 Kiểm sát viên, 03 Cán bộ Cảnh sát điều tra.",
  "signedTime.detentionDecisionContent2Line":
    "Biên bản đã được lập khách quan, đầy đủ, không ai ép buộc, không ai khiếu nại về nội dung.",
  "signedTime.detentionDecisionContent3Line":
    "Đương sự Nguyễn Văn A được quyền yêu cầu luật sư bảo vệ theo quy định.",
  "signedTime.detentionDecisionContent4Line":
    "Đương sự đồng ý với nội dung biên bản, không có yêu cầu sửa đổi, bổ sung gì khác.",
  "signedTime.detachLine":
    "Tách riêng 02 phong bì chứa tang vật, niêm phong, ký xác nhận theo quy định.",
  "signedTime.staffSubRole": "Cán bộ điều tra phối hợp",
  "recipients.staffLine":
    "01 Kiểm sát viên Lê Văn C; 03 Cán bộ CSĐT Trần Thị B, Phạm Văn D, Hoàng Văn E.",
  "recipients.staffName": "Lê Văn C",
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "document.documentCode": "12/QĐ-VKS-KV7",
  "document.issuePlaceAndDateLine": "Thành phố Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "person.fullName": "Nguyễn Văn An",
  "person.genderLabel": "Nam",
  "person.otherName": "Không có",
  "person.dateOfBirthText": "ngày 08 tháng 9 năm 1985",
  "person.placeOfBirth": "tỉnh Quảng Ngãi",
  "person.nationality": "Việt Nam",
  "person.ethnicity": "Kinh",
  "person.religion": "Không",
  "person.occupation": "Lao động tự do",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: format-shaped synthetic test value, not derived from any real customer/case data.
  "person.identityDocumentLine": "Căn cước công dân số 079085001234 do Cục Cảnh sát QLHC về TTXH cấp ngày 22/12/2021.",
  // PHASE15B3_SYNTHETIC_FIXTURE_OK: format-shaped synthetic test value, not derived from any real customer/case data.
  "person.identityIssueLine": "Căn cước công dân số 079085001234 cấp ngày 22/12/2021 tại Cục Cảnh sát QLHC về TTXH.",
  "person.permanentAddress": "Số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
  "person.temporaryAddress": "Không có",
  "person.currentAddress": "Số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
  "juvenileProtection.contextLine": "Bị can hiện đang là học sinh Trường Trung học phổ thông Bến Nghé, có hoàn cảnh gia đình khó khăn, chưa có tiền án tiền sự.",
  "juvenileProtection.resultDeadlineLine": "Thời hạn áp dụng biện pháp bảo vệ: 03 tháng kể từ ngày ban hành quyết định.",
  "recipients.primaryLine": "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "recipients.investigationAuthorityLine": "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  "recipients.otherRecipientsLine": "- Trại tạm giam Công an Thành phố Hồ Chí Minh;",
  "recipients.archiveLine": "- Lưu: HSVA, HSKS, VP.",
  "signature.signerName": "Lê Văn C",
} as const;

const BM213_ACCEPTANCE = {
  requiredText: [
    "BIÊN BẢN",
    "tạm giữ",
    "Nguyễn Văn A",
    "Viện Kiểm sát nhân dân Khu vực 7",
    "12/QĐ-VKS-KV7",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM213_SUMMARY_LINES = [
  {
    label: "Cơ quan",
    value: "Viện Kiểm sát nhân dân Khu vực 7",
  },
  {
    label: "Số QĐ tạm giữ",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).signedTime?.detentionDecisionCodeLine;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Đối tượng",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).signedTime?.personFullName;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Bắt đầu",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).signedTime?.startedAtLine;
      if (typeof raw !== "string" || raw.trim().length === 0) return "—";
      return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
    },
  },
  {
    label: "Kết thúc",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).signedTime?.endedAtLine;
      if (typeof raw !== "string" || raw.trim().length === 0) return "—";
      return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
    },
  },
];

export const BM213_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-213",
  title: "BB bắt người bị tạm giữ khẩn cấp",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM213_FIELD_PATHS,
  requiredFieldPaths: BM213_REQUIRED_FIELD_PATHS,
  demo: BM213_DEMO,
  summaryLines: BM213_SUMMARY_LINES,
  acceptance: BM213_ACCEPTANCE,
};

registerFormFlightProfile(BM213_FORM_FLIGHT_PROFILE);
