/**
 * BM-209 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-209 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Quyết định áp dụng biện pháp giám sát bởi người đại diện
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

const BM209_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM209_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "recipients.personLine": {
    label: "Nơi nhận (personLine)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine12": {
    label: "Nơi nhận (personLine12)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "129/QĐ-VKS"
  },
  "recipients.personLine11": {
    label: "Nơi nhận (personLine11)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine10": {
    label: "Nơi nhận (personLine10)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  }
} as const;

const BM209_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine12": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "document.fullDocumentCode": "129/QĐ-VKS",
  "recipients.personLine11": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine10": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
} as const;

const BM209_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-209",
  versionLabel: `BM-209 runtime-ux batch 9 curated source-render profile`,
  sections: BM209_SECTIONS,
  fields: BM209_FIELDS,
  demo: BM209_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM209_RUNTIME_UX_PROFILE);
