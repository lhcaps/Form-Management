/**
 * BM-148 runtime-ready Form Flight profile.
 *
 * Stage 02 (GIẢI QUYẾT TIN BÁO) — "Biên bản giải trình". Field paths
 * are taken verbatim from the locked contract
 * `docs/audit/docx/contracts/locked/BM-148__0e8f6fe697fa.contract.locked.json`.
 *
 * The contract carries 30 canonical fields spanning agency, full
 * declarant identity (id/address/occupation), suspects, archive
 * details, full document numbers and dates.
 */
import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const BM148_FIELD_PATHS = [
  "agency.parentName",
  "agency.name",
  "document.fullDocumentCode",
  "document.issueDate",
  "document.issuePlace",
  "document.startLine",
  "document.endLine",
  "document.dateLine",
  "document.line00",
  "document.line01",
  "document.line02",
  "document.line03",
  "document.line04",
  "document.line05",
  "document.line06",
  "document.line07",
  "document.line08",
  "document.line09",
  "document.line10",
  "document.line11",
  "document.line12",
  "person.personFullName",
  "person.dateOfBirth",
  "person.occupation",
  "person.permanentAddress",
  "person.currentAddress",
  "person.alias",
  "person.fatherName",
  "person.criminalRecord",
  "recipients.evidenceList",
] as const;

const BM148_REQUIRED_FIELD_PATHS = [
  "agency.name",
  "document.fullDocumentCode",
  "document.issueDate",
  "person.personFullName",
  "recipients.evidenceList",
] as const;

const BM148_DEMO = {
  "agency.parentName": "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "agency.name": "Viện Kiểm sát nhân dân Khu vực 7",
  "document.fullDocumentCode": "156/HS-VKS-KV7",
  "document.issueDate": "2026-07-04",
  "document.issuePlace": "TP. Hồ Chí Minh",
  "document.startLine":
    "Căn cứ vào Thông tư số 03/2026/TT-VKSTC của Viện trưởng VKSND tối cao, Cục Cảnh sát điều tra Công an Thành phố Hồ Chí Minh.",
  "document.endLine":
    "Biên bản giải trình kết thúc hồi 17 giờ 00 phút cùng ngày. Biên bản gồm 03 trang đã đọc cho các đương sự nghe, không có khiếu nại gì khác.",
  "document.dateLine": "ngày 04 tháng 7 năm 2026",
  "document.line00":
    "Hôm nay, vào hồi 15 giờ 30 phút tại Công an Phường Bến Nghé, Quận 1, TP.HCM.",
  "document.line01":
    "Chúng tôi gồm: 1) Trần Thị B - Kiểm sát viên; 2) Lê Văn C - Điều tra viên.",
  "document.line02":
    "Tiến hành lấy lời khai giải trình của anh Nguyễn Văn A — sinh năm 1985.",
  "document.line03":
    "Anh Nguyễn Văn A có CCCD số 079085001234, cấp ngày 15/9/2018 tại Cục Cảnh sát QLHC về TTXH.",
  "document.line04":
    "Nghề nghiệp: Lao động tự do; Cư trú tại số 12 đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, TP.HCM.",
  "document.line05":
    "Bị can: Bị tạm giữ theo Quyết định số 12/QĐ-VKS-KV7 ngày 04/7/2026.",
  "document.line06":
    "Tội danh: Đánh bạc theo Điều 321 Bộ luật Hình sự năm 2015.",
  "document.line07":
    "Anh A thừa nhận đánh bài ăn tiền với 04 người khác vào tối ngày 03/7/2026 tại sảnh chung cư Flemington.",
  "document.line08":
    "Anh A khai số tiền dùng đánh bạc khoảng 02 triệu đồng, đã thu giữ tại hiện trường.",
  "document.line09":
    "Anh A không từ chối ký; cam đoan toàn bộ lời khai là đúng sự thật; không ai ép buộc.",
  "document.line10":
    "Anh A thừa nhận là thành viên của nhóm đánh bạc do anh Nguyễn Văn A cầm đầu tổ chức (trùng tên với đối tượng khác).",
  "document.line11":
    "Anh A cam kết không bỏ trốn, có mặt theo yêu cầu của Cơ quan điều tra và Viện kiểm sát.",
  "document.line12":
    "Biên bản đã được lưu hồ sơ số 156/HS-VKS-KV7; chuyển phòng PC05 ngày 04/7/2026.",
  "person.personFullName": "Nguyễn Văn A",
  "person.dateOfBirth": "08/9/1985",
  "person.occupation": "Lao động tự do",
  "person.permanentAddress":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "person.currentAddress":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "person.alias": "Anh Hai",
  "person.fatherName": "Nguyễn Văn Bố",
  "person.criminalRecord": "Chưa có tiền án, tiền sự",
  "recipients.evidenceList":
    "01 bộ bài tú lơ khơ; 01 chiếu bạc; 02 triệu đồng tiền mặt; video clip từ camera chung cư Flemington.",
} as const;

const BM148_ACCEPTANCE = {
  requiredText: [
    "BIÊN BẢN",
    "giải trình",
    "Nguyễn Văn A",
    "12/QĐ-VKS-KV7",
    "156/HS-VKS-KV7",
  ],
  forbiddenText: [
    "{{",
    "}}",
    "undefined",
    "null",
    "[object Object]",
  ],
};

const BM148_SUMMARY_LINES = [
  {
    label: "Cơ quan",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).agency?.name;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Số biên bản",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.fullDocumentCode;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Ngày",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).document?.issueDate;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Người khai",
    value: (data: Record<string, unknown>) => {
      const raw = (data as Record<string, Record<string, string>>).person?.personFullName;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
  {
    label: "Tội danh",
    value: (data: Record<string, Record<string, string>>) => {
      const raw = data?.document?.line06;
      return typeof raw === "string" && raw.trim().length > 0 ? raw : "—";
    },
  },
];

export const BM148_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "BM-148",
  title: "BB giải trình",
  runtimeReady: true,
  profileStatus: "runtime-ready",
  fieldPaths: BM148_FIELD_PATHS,
  requiredFieldPaths: BM148_REQUIRED_FIELD_PATHS,
  demo: BM148_DEMO,
  summaryLines: BM148_SUMMARY_LINES,
  acceptance: BM148_ACCEPTANCE,
};

registerFormFlightProfile(BM148_FORM_FLIGHT_PROFILE);
