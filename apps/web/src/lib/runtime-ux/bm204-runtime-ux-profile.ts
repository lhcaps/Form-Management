/**
 * BM-204 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-204 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: QĐ việc tham gia tố tụng của người đại diện, tổ chức
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

const BM204_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM204_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "recipients.personLine7": {
    label: "Nơi nhận (personLine7)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine6": {
    label: "Nơi nhận (personLine6)",
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
  "recipients.personLine3": {
    label: "Nơi nhận (personLine3)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  }
} as const;

const BM204_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine7": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine6": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine5": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine4": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine3": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
} as const;

const BM204_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-204",
  versionLabel: `BM-204 runtime-ux batch 9 curated source-render profile`,
  sections: BM204_SECTIONS,
  fields: BM204_FIELDS,
  demo: BM204_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM204_RUNTIME_UX_PROFILE);
