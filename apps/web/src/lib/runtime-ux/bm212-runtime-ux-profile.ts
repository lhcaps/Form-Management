/**
 * BM-212 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-212 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên
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

const BM212_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM212_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "recipients.personLine": {
    label: "Nơi nhận (personLine)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine9": {
    label: "Nơi nhận (personLine9)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine8": {
    label: "Nơi nhận (personLine8)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine7": {
    label: "Nơi nhận (personLine7)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine23": {
    label: "Nơi nhận (personLine23)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  }
} as const;

const BM212_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine9": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine8": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine7": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine23": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
} as const;

const BM212_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-212",
  versionLabel: `BM-212 runtime-ux batch 9 curated source-render profile`,
  sections: BM212_SECTIONS,
  fields: BM212_FIELDS,
  demo: BM212_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM212_RUNTIME_UX_PROFILE);
