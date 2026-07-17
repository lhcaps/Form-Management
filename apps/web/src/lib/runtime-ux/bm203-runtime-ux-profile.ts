/**
 * BM-203 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-203 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Thông báo về hoạt động tố tụng
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

const BM203_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM203_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "recipients.personLine": {
    label: "Nơi nhận (personLine)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine5": {
    label: "Nơi nhận (personLine5)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine4": {
    label: "Nơi nhận (personLine4)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine15": {
    label: "Nơi nhận (personLine15)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine3": {
    label: "Nơi nhận (personLine3)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  }
} as const;

const BM203_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine5": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine4": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine15": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine3": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
} as const;

const BM203_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-203",
  versionLabel: `BM-203 runtime-ux batch 9 curated source-render profile`,
  sections: BM203_SECTIONS,
  fields: BM203_FIELDS,
  demo: BM203_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM203_RUNTIME_UX_PROFILE);
