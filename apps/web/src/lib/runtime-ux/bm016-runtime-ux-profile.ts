/**
 * BM-016 — Kết luận trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin
 * về tội phạm. Presentation metadata follows the BM-016 DOCX headings and
 * footnotes; it never changes contract keys or generated-document behavior.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM016_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan ban hành và kết luận",
    description: "Cơ quan kiểm sát ban hành, số kết luận và dòng địa danh, ngày ký.",
  },
  {
    sectionId: "section-can-cu-va-pham-vi-kiem-sat",
    title: "Căn cứ và phạm vi kiểm sát trực tiếp",
    description: "Căn cứ tố tụng và quyết định trực tiếp kiểm sát được thực hiện.",
  },
  {
    sectionId: "section-ket-qua-tiep-nhan",
    title: "Nguồn tin về tội phạm đã tiếp nhận",
    description: "Thống kê tổng số nguồn tin và từng nhóm nguồn tin trong kỳ kiểm sát.",
  },
  {
    sectionId: "section-ket-qua-giai-quyet",
    title: "Kết quả giải quyết nguồn tin",
    description: "Thống kê nguồn tin đã giải quyết, chuyển thẩm quyền, đang giải quyết và tạm đình chỉ.",
  },
  {
    sectionId: "section-nhan-xet-va-kien-nghi",
    title: "Nhận xét, vi phạm và kiến nghị",
    description: "Đánh giá kết quả kiểm sát, nguyên nhân tồn tại và yêu cầu thực hiện kiến nghị.",
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận",
    description: "Cơ quan, thành viên Đoàn kiểm sát và thành phần lưu hồ sơ nhận kết luận.",
  },
  {
    sectionId: "section-chu-ky",
    title: "Ký ban hành",
    description: "Chế độ ký, chức danh và họ tên người ký kết luận.",
  },
] as const;

const BM016_FIELDS = {
  "agency.parentName": { label: "Viện kiểm sát cấp trên trực tiếp", placeholder: "Tên Viện kiểm sát cấp trên trực tiếp" },
  "agency.name": { label: "Viện kiểm sát ban hành kết luận", placeholder: "Tên Viện kiểm sát ban hành" },
  "document.documentCode": { label: "Số kết luận", placeholder: "Ví dụ: 08/KL-VKS" },
  "document.issuePlaceAndDateLine": { label: "Địa danh, ngày ban hành", placeholder: "Địa danh, ngày ... tháng ... năm ..." },
  "legalBasis.procedureArticlesLine": { label: "Căn cứ Bộ luật Tố tụng hình sự", placeholder: "Ghi Điều 41, Điều 160 hoặc căn cứ tố tụng áp dụng", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.implementationDecisionLine": { label: "Quyết định trực tiếp kiểm sát được thực hiện", placeholder: "Số, ngày quyết định; Viện trưởng ban hành; cơ quan hoặc người được kiểm sát", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.receivedTotalLine": { label: "Tổng số nguồn tin đã tiếp nhận", placeholder: "Gồm số cũ, số mới và số phục hồi", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.receivedDenunciationLine": { label: "Số tố giác về tội phạm", placeholder: "Số lượng tố giác" },
  "sourceDirectInspectionConclusion.receivedCrimeReportLine": { label: "Số tin báo về tội phạm", placeholder: "Số lượng tin báo" },
  "sourceDirectInspectionConclusion.receivedProsecutionRequestLine": { label: "Số kiến nghị khởi tố", placeholder: "Số lượng kiến nghị khởi tố" },
  "sourceDirectInspectionConclusion.receivedDirectDiscoveryLine": { label: "Nguồn tin do cơ quan tố tụng trực tiếp phát hiện", placeholder: "Số lượng nguồn tin" },
  "sourceDirectInspectionConclusion.receivedSelfSurrenderLine": { label: "Nguồn tin do người phạm tội tự thú", placeholder: "Số lượng nguồn tin" },
  "sourceDirectInspectionConclusion.receivedOtherLine": { label: "Nguồn tin về tội phạm khác", placeholder: "Số lượng nguồn tin khác" },
  "sourceDirectInspectionConclusion.resolvedStatsBlock": { label: "Tổng số nguồn tin đã giải quyết", placeholder: "Tổng số đã giải quyết và phân loại theo từng hình thức", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.prosecutionDecisionStatsLine": { label: "Kết quả quyết định khởi tố vụ án", placeholder: "Số vụ và cơ cấu nguồn tin", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.nonProsecutionDecisionStatsLine": { label: "Kết quả quyết định không khởi tố vụ án", placeholder: "Số nguồn tin và cơ cấu", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.transferredStatsLine": { label: "Nguồn tin chuyển giải quyết theo thẩm quyền", placeholder: "Số lượng, cơ cấu và nơi nhận tin", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.pendingStatsLine": { label: "Nguồn tin đang giải quyết", placeholder: "Số lượng; trong đó số quá hạn", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.suspendedStatsLine": { label: "Nguồn tin tạm đình chỉ", placeholder: "Số vụ việc, lý do và căn cứ tạm đình chỉ", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.advantagesLine": { label: "Ưu điểm", placeholder: "Đánh giá ưu điểm trong tiếp nhận, giải quyết nguồn tin", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.violationsLine": { label: "Vi phạm, hạn chế, tồn tại", placeholder: "Nêu cụ thể vi phạm về thời hạn, thẩm quyền, căn cứ hoặc thủ tục", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.violationReasonsLine": { label: "Nguyên nhân vi phạm", placeholder: "Phân tích nguyên nhân chủ quan và khách quan", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.recommendationsBlock": { label: "Nội dung kiến nghị", placeholder: "Kiến nghị để bảo đảm tiếp nhận, giải quyết nguồn tin đúng pháp luật", control: "TEXTAREA" },
  "sourceDirectInspectionConclusion.implementationRequestLine": { label: "Yêu cầu thực hiện kiến nghị", placeholder: "Cơ quan được yêu cầu, nội dung thực hiện và thời hạn trả lời", control: "TEXTAREA" },
  "recipients.primaryLine": { label: "Cơ quan hoặc người nhận kết luận", placeholder: "Tên cơ quan được trực tiếp kiểm sát hoặc người có thẩm quyền" },
  "recipients.teamMembersLine": { label: "Thành viên Đoàn kiểm sát", placeholder: "Danh sách thành viên Đoàn kiểm sát" },
  "recipients.archiveLine": { label: "Nơi lưu hồ sơ", placeholder: "Ví dụ: Lưu: HSKS, VP" },
  "signature.signMode": { label: "Chế độ ký", placeholder: "Ví dụ: Viện trưởng hoặc ký thay" },
  "signature.positionTitle": { label: "Chức danh người ký", placeholder: "Chức danh theo khối ký" },
  "signature.signerName": { label: "Họ và tên người ký", placeholder: "Họ và tên người có thẩm quyền ký" },
} as const;

const BM016_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện kiểm sát nhân dân thành phố Hà Nội",
  "agency.name": "Viện kiểm sát nhân dân quận Hoàn Kiếm",
  "document.documentCode": "08/KL-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 18 tháng 7 năm 2026",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 41 và Điều 160 Bộ luật Tố tụng hình sự.",
  "sourceDirectInspectionConclusion.implementationDecisionLine": "Thực hiện Quyết định trực tiếp kiểm sát số 08/QĐ-VKS ngày 01 tháng 7 năm 2026 của Viện trưởng Viện kiểm sát nhân dân thành phố Hà Nội đối với Công an phường Hàng Bài.",
  "sourceDirectInspectionConclusion.receivedTotalLine": "Tổng số 36 nguồn tin đã tiếp nhận, gồm 9 nguồn tin cũ, 25 nguồn tin mới và 2 nguồn tin phục hồi.",
  "sourceDirectInspectionConclusion.receivedDenunciationLine": "12",
  "sourceDirectInspectionConclusion.receivedCrimeReportLine": "17",
  "sourceDirectInspectionConclusion.receivedProsecutionRequestLine": "3",
  "sourceDirectInspectionConclusion.receivedDirectDiscoveryLine": "2",
  "sourceDirectInspectionConclusion.receivedSelfSurrenderLine": "1",
  "sourceDirectInspectionConclusion.receivedOtherLine": "1",
  "sourceDirectInspectionConclusion.resolvedStatsBlock": "Đã giải quyết 30 nguồn tin về tội phạm theo quy định của Bộ luật Tố tụng hình sự.",
  "sourceDirectInspectionConclusion.prosecutionDecisionStatsLine": "Quyết định khởi tố vụ án hình sự: 9 vụ.",
  "sourceDirectInspectionConclusion.nonProsecutionDecisionStatsLine": "Quyết định không khởi tố vụ án hình sự: 6 nguồn tin.",
  "sourceDirectInspectionConclusion.transferredStatsLine": "Chuyển giải quyết theo thẩm quyền: 8 nguồn tin; nêu rõ nơi nhận tin.",
  "sourceDirectInspectionConclusion.pendingStatsLine": "Đang giải quyết 6 nguồn tin, trong đó quá hạn 0 nguồn tin.",
  "sourceDirectInspectionConclusion.suspendedStatsLine": "Tạm đình chỉ giải quyết 1 vụ việc theo căn cứ luật định.",
  "sourceDirectInspectionConclusion.advantagesLine": "Việc tiếp nhận, phân loại và giải quyết nguồn tin được theo dõi đầy đủ, đúng thẩm quyền.",
  "sourceDirectInspectionConclusion.violationsLine": "Còn một số hồ sơ cập nhật tiến độ chưa kịp thời.",
  "sourceDirectInspectionConclusion.violationReasonsLine": "Nguyên nhân chủ yếu là khối lượng nguồn tin tăng trong kỳ kiểm sát.",
  "sourceDirectInspectionConclusion.recommendationsBlock": "Kiến nghị rà soát tiến độ từng nguồn tin, bảo đảm giải quyết đúng thời hạn và cập nhật hồ sơ đầy đủ.",
  "sourceDirectInspectionConclusion.implementationRequestLine": "Yêu cầu Công an phường Hàng Bài tổ chức thực hiện kiến nghị và trả lời bằng văn bản trong 15 ngày kể từ ngày nhận kết luận.",
  "recipients.primaryLine": "Công an phường Hàng Bài",
  "recipients.teamMembersLine": "Thành viên Đoàn kiểm sát",
  "recipients.archiveLine": "Lưu: HSKS, VP.",
  "signature.signMode": "Viện trưởng",
  "signature.positionTitle": "Viện trưởng",
  "signature.signerName": "Nguyễn Văn Minh",
} as const;

const BM016_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-016",
  versionLabel: "BM-016 reviewed direct-inspection conclusion profile",
  sections: BM016_SECTIONS,
  fields: BM016_FIELDS,
  demo: BM016_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM016_RUNTIME_UX_PROFILE);
