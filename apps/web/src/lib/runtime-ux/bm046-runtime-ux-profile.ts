/**
 * Curated runtime-ux profile for BM-046 — UI-only override metadata for the
 * standalone `/templates/BM-046` template page.
 *
 * Title: QĐ không phê chuẩn QĐ về việc bảo lĩnh
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM046_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "1. Cơ quan và văn bản",
    description:
      "Cơ quan cấp trên, viện kiểm sát ban hành, số quyết định, địa danh — ngày ban hành, chủ thể ban hành.",
  },
  {
    sectionId: "section-can-cu-phap-ly",
    title: "2. Căn cứ pháp lý",
    description:
      "Bộ luật Tố tụng hình sự, Luật xử lý vi phạm hành chính, căn cứ khởi tố vụ án, căn cứ khởi tố bị can, đề nghị và xem xét.",
  },
  {
    sectionId: "section-noi-dung-quyet-inh",
    title: "3. Nội dung quyết định",
    description:
      "Căn cứ không đủ điều kiện bảo lĩnh, Điều 1 — nội dung, Điều 2 — yêu cầu.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "4. Nơi nhận",
    description: "Cơ quan điều tra, bị can / đại diện, người bảo lãnh và lưu hồ sơ.",
  },
  {
    sectionId: "section-chu-ky",
    title: "5. Chữ ký",
    description: "Chế độ ký, chức vụ và họ tên người ký.",
  },
] as const;

const BM046_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HẢI PHÒNG",
  },
  "agency.name": {
    label: "Viện kiểm sát ban hành",
    placeholder: "VIỆN KIỂM SÁT NHÂN DÂN QUẬN LÊ CHÂN",
  },
  "document.documentCode": {
    label: "Số quyết định",
    placeholder: "66/QĐ-VKSPCCB",
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hải Phòng, ngày 04 tháng 7 năm 2026",
    smart: {
      key: "document.issuePlaceAndDateLine",
      kind: "issue-place-date-line",
      placeholder: "Thành phố Hải Phòng",
      derivedTargets: ["document.issuePlaceAndDateLine"],
    },
  },
  "official.issuerTitle": {
    label: "Chủ thể ban hành",
    placeholder: "Viện Kiểm sát nhân dân Quận Lê Chân;",
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder:
      "Căn cứ Điều 109, Điều 121 Bộ luật Tố tụng hình sự năm 2015;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.procedureArticlesLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Căn cứ Điều 109, Điều 121 BLTTHS năm 2015;",
    },
  },
  "legalBasis.juvenileJusticeLine": {
    label: "Căn cứ Luật xử lý vi phạm hành chính",
    placeholder: "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
    control: "TEXTAREA",
    smart: {
      key: "legalBasis.juvenileJusticeLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ Điều 18 Luật XLVPHC năm 2012;",
    },
  },
  "guaranteeNonApproval.caseInitiationLine": {
    label: "Căn cứ khởi tố vụ án",
    placeholder:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 51/QĐ-PC03 ngày 14/4/2026;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeNonApproval.caseInitiationLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố vụ án số …/QĐ-PC03 ngày …;",
    },
  },
  "guaranteeNonApproval.defendantInitiationLine": {
    label: "Căn cứ khởi tố bị can",
    placeholder:
      "Căn cứ Quyết định khởi tố bị can số 52/QĐ-PC03 ngày 15/4/2026;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeNonApproval.defendantInitiationLine",
      kind: "textarea",
      rows: 2,
      placeholder: "Căn cứ QĐ khởi tố bị can số …/QĐ-PC03 ngày …;",
    },
  },
  "guaranteeNonApproval.proposalReviewLine": {
    label: "Đề nghị và xem xét",
    placeholder:
      "Đề nghị cho bị can bảo lĩnh theo Đơn đề nghị số 67/TTr-PC03 ngày 25/5/2026 của Cơ quan Cảnh sát điều tra; xem xét đầy đủ các tài liệu liên quan;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeNonApproval.proposalReviewLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Đề nghị và xem xét số …/TTr-PC03 ngày …;",
    },
  },
  "guaranteeNonApproval.insufficientGroundsLine": {
    label: "Căn cứ không đủ điều kiện bảo lĩnh",
    placeholder:
      "Xét thấy: bị can phạm tội đặc biệt nghiêm trọng; hiện không có người bảo lĩnh đủ điều kiện theo quy định; chưa có căn cứ để cho bị can tại ngoại;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeNonApproval.insufficientGroundsLine",
      kind: "textarea",
      rows: 3,
      placeholder: "Bị can phạm tội nghiêm trọng; thiếu người bảo lĩnh;",
    },
  },
  "guaranteeNonApproval.article1Line": {
    label: "Điều 1 — Nội dung quyết định không phê chuẩn",
    placeholder:
      "Không phê chuẩn Quyết định về việc bảo lĩnh số 44/QĐ-BL-PC03 ngày 27/5/2026 của Cơ quan Cảnh sát điều tra đối với bị can Trịnh Văn Tuấn;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeNonApproval.article1Line",
      kind: "textarea",
      rows: 4,
      placeholder: "Không phê chuẩn QĐ về việc bảo lĩnh …;",
    },
  },
  "guaranteeNonApproval.article2Line": {
    label: "Điều 2 — Yêu cầu",
    placeholder:
      "Yêu cầu Cơ quan Cảnh sát điều tra tiếp tục tạm giam bị can theo Lệnh tạm giam đã ban hành; tổ chức thi hành theo quy định pháp luật;",
    control: "TEXTAREA",
    smart: {
      key: "guaranteeNonApproval.article2Line",
      kind: "textarea",
      rows: 2,
      placeholder: "Yêu cầu CQCSĐT tiếp tục tạm giam;",
    },
  },
  "recipients.investigationAuthorityLine": {
    label: "Nơi nhận — Cơ quan điều tra",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Quận Lê Chân;",
  },
  "recipients.defendantRepresentativeLine": {
    label: "Nơi nhận — Bị can / đại diện",
    placeholder: "Bị can Trịnh Văn Tuấn;",
  },
  "recipients.guarantorLine": {
    label: "Nơi nhận — Người bảo lãnh",
    placeholder: "(Không có người bảo lãnh đủ điều kiện);",
  },
  "recipients.archiveLine": {
    label: "Lưu hồ sơ",
    placeholder: "Lưu: HSVA, HSKS, VP.",
  },
  "signature.signMode": {
    label: "Chế độ ký",
    placeholder: "Ký tập thể",
  },
  "signature.positionTitle": {
    label: "Chức vụ người ký",
    placeholder: "Viện trưởng Viện Kiểm sát nhân dân Quận Lê Chân",
  },
  "signature.signerName": {
    label: "Họ tên người ký",
    placeholder: "Lại Hồng Phúc",
  },
} as const;

const BM046_DEMO_RUNTIME_UX = {
  "agency.parentName":
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HẢI PHÒNG",
  "agency.name":
    "VIỆN KIỂM SÁT NHÂN DÂN QUẬN LÊ CHÂN",
  "document.documentCode": "66/QĐ-VKSPCCB",
  "document.issuePlaceAndDateLine":
    "Hải Phòng, ngày 04 tháng 7 năm 2026",
  "official.issuerTitle":
    "Viện Kiểm sát nhân dân Quận Lê Chân;",
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 109, Điều 121 Bộ luật Tố tụng hình sự năm 2015;",
  "legalBasis.juvenileJusticeLine":
    "Căn cứ Điều 18 Luật Xử lý vi phạm hành chính năm 2012;",
  "guaranteeNonApproval.caseInitiationLine":
    "Căn cứ Quyết định khởi tố vụ án hình sự số 51/QĐ-PC03 ngày 14/4/2026;",
  "guaranteeNonApproval.defendantInitiationLine":
    "Căn cứ Quyết định khởi tố bị can số 52/QĐ-PC03 ngày 15/4/2026;",
  "guaranteeNonApproval.proposalReviewLine":
    "Đề nghị cho bị can bảo lĩnh theo Đơn đề nghị số 67/TTr-PC03 ngày 25/5/2026 của Cơ quan Cảnh sát điều tra; xem xét đầy đủ các tài liệu liên quan;",
  "guaranteeNonApproval.insufficientGroundsLine":
    "Xét thấy: bị can phạm tội đặc biệt nghiêm trọng; hiện không có người bảo lĩnh đủ điều kiện theo quy định; chưa có căn cứ để cho bị can tại ngoại;",
  "guaranteeNonApproval.article1Line":
    "Không phê chuẩn Quyết định về việc bảo lĩnh số 44/QĐ-BL-PC03 ngày 27/5/2026 của Cơ quan Cảnh sát điều tra đối với bị can Trịnh Văn Tuấn;",
  "guaranteeNonApproval.article2Line":
    "Yêu cầu Cơ quan Cảnh sát điều tra tiếp tục tạm giam bị can theo Lệnh tạm giam đã ban hành; tổ chức thi hành theo quy định pháp luật;",
  "recipients.investigationAuthorityLine":
    "Cơ quan Cảnh sát điều tra Công an Quận Lê Chân;",
  "recipients.defendantRepresentativeLine": "Bị can Trịnh Văn Tuấn;",
  "recipients.guarantorLine": "(Không có người bảo lãnh đủ điều kiện);",
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "signature.signMode": "Ký tập thể",
  "signature.positionTitle":
    "Viện trưởng Viện Kiểm sát nhân dân Quận Lê Chân",
  "signature.signerName": "Lại Hồng Phúc",
} as const;

const BM046_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-046",
  versionLabel:
    "BM-046 curated batch (issue-place-date-line + textarea smarts)",
  sections: BM046_SECTIONS,
  fields: BM046_FIELDS,
  demo: BM046_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM046_RUNTIME_UX_PROFILE);
