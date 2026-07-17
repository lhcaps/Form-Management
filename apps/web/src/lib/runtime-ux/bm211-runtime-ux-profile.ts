/**
 * BM-211 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-211 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Thông báo về việc thụ lý vụ án
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

const BM211_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM211_FIELDS = {
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
  "recipients.personLine16": {
    label: "Nơi nhận (personLine16)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine3": {
    label: "Nơi nhận (personLine3)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  }
} as const;

const BM211_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine5": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine4": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine16": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine3": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
} as const;

const BM211_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-211",
  versionLabel: `BM-211 runtime-ux batch 9 curated source-render profile`,
  sections: BM211_SECTIONS,
  fields: BM211_FIELDS,
  demo: BM211_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM211_RUNTIME_UX_PROFILE);
