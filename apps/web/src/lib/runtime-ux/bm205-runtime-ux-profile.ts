/**
 * BM-205 runtime-ux batch 9 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated BM-205 profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: Thông báo áp dụng biện pháp ngăn chặn đối với NCTN
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

const BM205_SECTIONS = [
  {
    sectionId: "section-thong-tin-bieu-mau",
    title: "Thông tin biểu mẫu"
  }
] as const;

const BM205_FIELDS = {
  "agency.name": {
    label: "Viện Kiểm sát ban hành",
    placeholder: "Viện Kiểm sát nhân dân Thành phố Hà Nội"
  },
  "recipients.personLine": {
    label: "Nơi nhận (personLine)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine14": {
    label: "Nơi nhận (personLine14)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "recipients.personLine13": {
    label: "Nơi nhận (personLine13)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  },
  "document.fullDocumentCode": {
    label: "Số quyết định",
    placeholder: "129/QĐ-VKS"
  },
  "recipients.personLine12": {
    label: "Nơi nhận (personLine12)",
    placeholder: "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
  }
} as const;

const BM205_DEMO_RUNTIME_UX = {
  "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội",
  "recipients.personLine": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine14": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "recipients.personLine13": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội",
  "document.fullDocumentCode": "129/QĐ-VKS",
  "recipients.personLine12": "Cơ quan Cảnh sát điều tra Công an Thành phố Hà Nội"
} as const;

const BM205_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-205",
  versionLabel: `BM-205 runtime-ux batch 9 curated source-render profile`,
  sections: BM205_SECTIONS,
  fields: BM205_FIELDS,
  demo: BM205_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM205_RUNTIME_UX_PROFILE);
