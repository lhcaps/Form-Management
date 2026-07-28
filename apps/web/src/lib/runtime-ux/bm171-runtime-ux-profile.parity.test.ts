/**
 * BM-171 runtime preview parity test.
 *
 * Pins the BM-171 runtime UX profile's `demo` fixture to the canonical
 * BM-171 production signoff payload semantics. Any drift between the
 * two must fail this test so that
 * `apps/api/scripts/render-bm171-canonical-signoff-full.mjs` and the
 * `/templates/BM-171` runtime preview stay byte-for-byte equivalent.
 *
 * Source of truth for the canonical values:
 *   apps/api/scripts/render-bm171-canonical-signoff-full.mjs
 *   BM171_FIXTURE_INPUT → BM171_PAYLOAD
 */

import assert from "node:assert/strict";
import test from "node:test";

import { getRuntimeUxProfile } from "./runtime-ux-profile";
import "./bm171-runtime-ux-profile";

// Canonical values, copied verbatim from BM171_FIXTURE_INPUT in
// apps/api/scripts/render-bm171-canonical-signoff-full.mjs.
// If the production signoff script changes, this table must change in
// lockstep — that is the whole point of the parity test.
const CANONICAL_BM171_VALUES: Readonly<Record<string, string>> = {
  "agency.parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  "agency.name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "document.documentCode": "01/QĐ-VKSKV7",
  "document.issuePlaceAndDateLine":
    "TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015;",
  "caseDecision.prosecutionDecisionLegalBasisLine":
    "Căn cứ Quyết định truy tố số 02/QĐ-VKS-KV7 ngày 12/03/2026 của Viện Kiểm sát nhân dân Khu vực 7;",
  "accusedDecision.prosecutionDecisionLegalBasisLine":
    "Căn cứ Quyết định áp dụng biện pháp tạm giam số 15/QĐ-BCA ngày 20/02/2026;",
  "assetReturn.investigationConclusionLegalBasisLine":
    "Căn cứ Kết luận điều tra số 21/KLĐT-PCA ngày 28/02/2026 của Cơ quan Cảnh sát điều tra;",
  "assetReturn.caseSuspensionDecisionLegalBasisLine":
    "Căn cứ Quyết định tạm đình chỉ vụ án số 03/QĐ-VKS-KV7 ngày 05/03/2026;",
  "assetReturn.accusedSuspensionDecisionLegalBasisLine":
    "Căn cứ Quyết định tạm đình chỉ đối với bị can số 04/QĐ-VKS-KV7 ngày 05/03/2026;",
  "assetReturn.considerationLine":
    "Xét thấy tài sản bị tạm giữ không còn liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, quản lý hợp pháp theo quy định tại Điều 212 Bộ luật Tố tụng hình sự,",
  "assetReturn.assetListLine":
    "1. 01 chiếc xe máy Honda Wave RSX, biển số 59C1-123.45, màu đỏ-đen, năm sản xuất 2018, khung JL110E-1234567, máy JL110E-7654321;\n2. 01 sổ tiết kiệm Ngân hàng TMCP Ngoại thương Việt Nam, chi nhánh TP.HCM, số tài khoản 0011-2233-4455-66, số dư 12.500.000 đồng (Mười hai triệu năm trăm nghìn đồng).",
  "assetOwner.fullName": "Nguyễn Văn A",
  "assetOwner.genderText": "Nam",
  "assetOwner.otherName": "Không có",
  "assetOwner.dateOfBirthText": "08/09/1985",
  "assetOwner.placeOfBirth": "Tỉnh Bình Dương",
  "assetOwner.nationality": "Việt Nam",
  "assetOwner.ethnicity": "Kinh",
  "assetOwner.religion": "Không",
  "assetOwner.occupation": "Lao động tự do",
  "assetOwner.identityNo": "079085001234",
  "assetOwner.identityIssuedDateText": "14/12/2021",
  "assetOwner.identityIssuedPlace":
    "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
  "assetOwner.permanentResidence":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "assetOwner.temporaryResidence": "Không có",
  "assetOwner.currentResidence":
    "Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
  "assetReturn.executionRequestLine":
    "Yêu cầu Phòng Cảnh sát Quản lý hành chính về trật tự xã hội thuộc Công an Thành phố Hồ Chí Minh chuyển giao tài sản nêu tại Điều 1 cho ông Nguyễn Văn A trong thời hạn 05 ngày làm việc kể từ ngày nhận được Quyết định.",
  "recipients.line1": "Phòng CSQLHC TTXH Công an TP.HCM;",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký thay",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerName": "Nguyễn Thị Hồng C",
};

test("BM-171 runtime UX profile demo fixture is byte-for-byte equal to the canonical signoff payload", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "BM-171 profile must be registered");

  // Every canonical key must exist in the demo fixture.
  for (const [key, expected] of Object.entries(CANONICAL_BM171_VALUES)) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(profile!.demo, key),
      `BM-171 demo fixture must contain canonical key '${key}'`,
    );
    assert.equal(
      profile!.demo[key],
      expected,
      `BM-171 demo fixture value for '${key}' must match the canonical signoff payload`,
    );
  }

  // No unexpected keys in the demo fixture (drift guard).
  const unexpected = Object.keys(profile!.demo).filter(
    (k) => !Object.prototype.hasOwnProperty.call(CANONICAL_BM171_VALUES, k),
  );
  assert.deepStrictEqual(
    unexpected,
    [],
    `BM-171 demo fixture has unexpected keys not in the canonical payload: ${unexpected.join(", ")}`,
  );
});

test("BM-171 runtime UX profile demo fixture contains none of the generic legal-basis fallbacks", () => {
  const profile = getRuntimeUxProfile("BM-171");
  assert.ok(profile, "BM-171 profile must be registered");

  // The `generateFieldValue` generic fallback heuristics in
  // apps/web/src/features/forms-contracts/sample-data.ts must NEVER appear
  // in the BM-171 demo fixture.
  const forbiddenFragments = [
    "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
    "Cá nhân/Tổ chức theo quy định.",
    "Tài sản theo quy định pháp luật",
    "Mô tả vụ việc mẫu",
    "Nội dung mẫu cho biểu mẫu pháp lý.",
    "Người nhận (mẫu)",
    "Người ký (mẫu)",
    "người nhận (mẫu)",
  ];

  for (const [key, value] of Object.entries(profile!.demo)) {
    for (const fragment of forbiddenFragments) {
      assert.ok(
        !value.includes(fragment),
        `BM-171 demo value for '${key}' must not contain generic fallback '${fragment}', got: ${value}`,
      );
    }
  }
});