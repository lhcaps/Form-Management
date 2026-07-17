/**
 * BM-016 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-016 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: KL trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 9 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 9.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM016_SECTIONS = [
  {
    sectionId: "section-co-quan-va-van-ban",
    title: "Cơ quan và văn bản"
  },
  {
    sectionId: "section-can-cu-va-pham-vi-kiem-sat",
    title: "Căn cứ và phạm vi kiểm sát"
  },
  {
    sectionId: "section-ket-qua-tiep-nhan",
    title: "Kết quả tiếp nhận"
  },
  {
    sectionId: "section-ket-qua-giai-quyet",
    title: "Kết quả giải quyết"
  },
  {
    sectionId: "section-nhan-xet-va-kien-nghi",
    title: "Nhận xét và kiến nghị"
  },
  {
    sectionId: "section-noi-nhan",
    title: "Nơi nhận"
  }
] as const;

const BM016_FIELDS = {
  "agency.parentName": {
    label: "Cơ quan cấp trên",
    placeholder: "Viện Kiểm sát nhân dân tối cao"
  },
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "document.documentCode": {
    label: "Số văn bản",
    placeholder: "82/QĐ-VKS"
  },
  "document.issuePlaceAndDateLine": {
    label: "Địa danh, ngày ban hành",
    placeholder: "Hà Nội"
  },
  "legalBasis.procedureArticlesLine": {
    label: "Căn cứ Bộ luật Tố tụng hình sự",
    placeholder: "Căn cứ Điều 76 Bộ luật Tố tụng hình sự năm 2015"
  },
  "sourceDirectInspectionConclusion.implementationDecisionLine": {
    label: "ImplementationDecision",
    placeholder: "(mẫu sourceDirectInspectionConclusion.implementationDecisionLine)"
  }
} as const;

const BM016_DEMO_RUNTIME_UX = {
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "document.documentCode": "82/QĐ-VKS",
  "document.issuePlaceAndDateLine": "Hà Nội",
  "legalBasis.procedureArticlesLine": "Căn cứ Điều 76 Bộ luật Tố tụng hình sự năm 2015",
  "sourceDirectInspectionConclusion.implementationDecisionLine": "(mẫu sourceDirectInspectionConclusion.implementationDecisionLine)"
} as const;

const BM016_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-016",
  versionLabel: `BM-016 runtime-ux batch 9 curated source-render profile`,
  sections: BM016_SECTIONS,
  fields: BM016_FIELDS,
  demo: BM016_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM016_RUNTIME_UX_PROFILE);
