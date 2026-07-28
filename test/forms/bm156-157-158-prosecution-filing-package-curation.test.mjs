/**
 * Semantic and provenance gate for the BM-156/157/158 prosecution filing package.
 *
 * Family: PROSECUTION FILING PACKAGE — three-member family covering:
 *   - BM-156 = CÁO TRẠNG (primary indictment document) — 41 fields, 5 sections
 *   - BM-157 = BẢN KÊ VẬT CHỨNG KÈM THEO CÁO TRẠNG (indictment evidence appendix) — 1 field, 1 section
 *   - BM-158 = DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP ĐẾN PHIÊN TÒA (trial-summons appendix) — 3 fields, 1 section
 *
 * Source contracts: docs/audit/docx/compiled-v2/BM-{156,157,158}.compiled.json
 * Source extracts:  docs/audit/docx/extracted/BM-{156,157,158}.extract.md
 *
 * Run: node --test test/forms/bm156-157-158-prosecution-filing-package-curation.test.mjs
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(TEST_DIR, "..", "..");
const PROFILE_DIR = resolve(PROJECT_ROOT, "apps/web/src/lib/runtime-ux");
const LEDGER_PATH = resolve(
  PROJECT_ROOT,
  "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md",
);
const HELPER_PATH = resolve(
  PROJECT_ROOT,
  "test/forms/helpers/runtime-ux-curation-validator.mjs",
);
const { loadProfile } = await import(pathToFileURL(HELPER_PATH).href);

const FORMS = [
  {
    code: "BM-156",
    profileVariable: "BM156_RUNTIME_UX_PROFILE",
    compiledTitle: "Cáo trạng",
    extractHeading: "CÁO TRẠNG",
    documentType: "CÁO TRẠNG",
    packageRole: "PRIMARY_INDICTMENT",
    principalOperativePhrase: "Truy tố ra trước Toà án",
    legalBasis: "Điều 41, 236, 239 và 243",
    legalBasisParagraph: "P0012",
    relationshipParagraphs: "P0097–P0102",
    fieldCount: 41,
    sectionCount: 5,
    compiledPath: "docs/audit/docx/compiled-v2/BM-156.compiled.json",
    compiledSha256: "120cc30db459883a8eddd8c29d897ef67cc57aa3d66b0524c5d67e448a1faabb",
    extractPath: "docs/audit/docx/extracted/BM-156__ef438a40e567.extract.md",
    extractSourceSha256: "ef438a40e567ed9d6504771efeb1a57e2c1d75b22c4bea3ead13dba6d039d166",
    relationshipLiteral: "Kèm theo Cáo trạng có",
    contractOnlyFields: ["signature.signMode"],
    compatibilityMappedFields: [
      "caseDecision.prosecutionDecisionLegalBasisLine",
      "accusedDecision.prosecutionDecisionLegalBasisLine",
      "caseJoinder.legalBasisLine",
      "caseRecovery.legalBasisLine",
      "indictment.administrativeViolationLine",
    ],
    expectedLabels: {
      "agency.parentName": "Cơ quan cấp trên",
      "agency.name": "Viện kiểm sát ban hành",
      "document.documentCode": "Số quyết định",
      "document.issuePlaceAndDateLine": "Địa danh, ngày ban hành",
      "official.issuerTitle": "Chủ thể ban hành",
      "legalBasis.procedureArticlesLine": "Căn cứ Bộ luật Tố tụng hình sự",
      "caseDecision.prosecutionDecisionLegalBasisLine": "Căn cứ quyết định khởi tố vụ án",
      "accusedDecision.prosecutionDecisionLegalBasisLine": "Căn cứ quyết định khởi tố bị can",
      "caseJoinder.legalBasisLine": "Căn cứ gộp vụ án",
      "caseRecovery.legalBasisLine": "Căn cứ thu hồi/phục hồi vụ án",
      "investigationConclusion.legalBasisLine": "Căn cứ kết luận điều tra",
      "indictment.criminalActDescriptionLine": "Mô tả hành vi phạm tội",
      "indictment.aggravatingMitigatingAnalysisLine": "Phân tích tăng nặng, giảm nhẹ",
      "indictment.evidenceHandlingLine": "Tình trạng tang vật, phương tiện",
      "indictment.civilLiabilityLine": "Trách nhiệm dân sự",
      "indictment.otherFactsLine": "Các tình tiết khác",
      "indictment.summaryConclusionLine": "Tổng kết kết luận",
      "indictment.absentAccusedNoteLine": "Ghi chú vắng mặt bị can",
      "indictment.defendantIdentityLine": "Nhân thân bị can",
      "indictment.familyBackgroundLine": "Hoàn cảnh gia đình",
      "indictment.specialStatusLine": "Tình trạng đặc biệt",
      "indictment.administrativeViolationLine": "Vi phạm hành chính liên quan",
      "indictment.criminalRecordLine": "Tiền án",
      "indictment.preventiveMeasureLine": "Biện pháp ngăn chặn đang áp dụng",
      "indictment.crimeConclusionLine": "Kết luận về tội phạm",
      "indictment.aggravatingMitigatingLine": "Tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự",
      "indictment.separatedCaseHandlingLine": "Xử lý vụ án tách biệt",
      "indictment.article1Line": "Điều 1 - Quyết định truy tố",
      "indictment.replacementLine": "Điều khoản thay thế",
      "indictment.caseFileLine": "Hồ sơ vụ án",
      "indictment.evidenceListLine": "Danh mục chứng cứ",
      "indictment.summonedPersonsLine": "Người được triệu tập",
      "recipients.courtLine": "Nơi nhận - Tòa án",
      "recipients.accusedLine": "Nơi nhận - Bị can",
      "recipients.defenseCounselLine": "Nơi nhận - Người bào chữa",
      "recipients.investigatingAgencyLine": "Nơi nhận - Cơ quan điều tra",
      "recipients.otherRecipientLine": "Nơi nhận - Người khác",
      "recipients.archiveLine": "Lưu hồ sơ",
      "signature.signMode": "Chế độ ký",
      "signature.positionTitle": "Chức vụ người ký",
      "signature.signerName": "Người ký",
    },
  },
  {
    code: "BM-157",
    profileVariable: "BM157_RUNTIME_UX_PROFILE",
    compiledTitle: "Bản kê vật chứng kèm theo Cáo trạng",
    extractHeading: "BẢN KÊ VẬT CHỨNG KÈM THEO BẢN CÁO TRẠNG",
    documentType: "BẢN KÊ VẬT CHỨNG",
    packageRole: "INDICTMENT_EVIDENCE_APPENDIX",
    principalOperativePhrase: "BẢN KÊ VẬT CHỨNG KÈM THEO BẢN CÁO TRẠNG",
    legalBasis: "Không có điều luật được trích dẫn trong nguồn riêng",
    legalBasisParagraph: "NONE",
    relationshipParagraphs: "P0001",
    fieldCount: 1,
    sectionCount: 1,
    compiledPath: "docs/audit/docx/compiled-v2/BM-157.compiled.json",
    compiledSha256: "f5d3b13af2f0063e376979a18268b9bc5455b0936cb571839100ecd73f38c0f2",
    extractPath: "docs/audit/docx/extracted/BM-157__a5c6971a69d2.extract.md",
    extractSourceSha256: "a5c6971a69d2bdea2dca8e892c498b0afe6c02bf585148af85ca05460700c287",
    relationshipLiteral: "KÈM THEO BẢN CÁO TRẠNG",
    contractOnlyFields: ["agency.vienKiem"],
    compatibilityMappedFields: [],
    expectedLabels: {
      "agency.vienKiem": "Viện kiểm sát lập bản kê",
    },
  },
  {
    code: "BM-158",
    profileVariable: "BM158_RUNTIME_UX_PROFILE",
    compiledTitle: "Danh sách đề nghị triệu tập đến phiên tòa",
    extractHeading: "DANH SÁCH",
    documentType: "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
    packageRole: "TRIAL_SUMMONS_REQUEST_APPENDIX",
    principalOperativePhrase: "Những người Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa",
    legalBasis: "Không có điều luật được trích dẫn trong nguồn riêng",
    legalBasisParagraph: "NONE",
    relationshipParagraphs: "P0018–P0019",
    fieldCount: 3,
    sectionCount: 1,
    compiledPath: "docs/audit/docx/compiled-v2/BM-158.compiled.json",
    compiledSha256: "b4bc46c5e822e628bdada3ce028253cc9ef034d9f15a4c93c1b5090db7996f6d",
    extractPath: "docs/audit/docx/extracted/BM-158__7a98055a3e9c.extract.md",
    extractSourceSha256: "7a98055a3e9c9425ebf5de5df7c16d4b851b641c0f037cc815d4852d4b253d8f",
    relationshipLiteral: "Những người Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa",
    contractOnlyFields: ["document.soDanh"],
    compatibilityMappedFields: [],
    expectedLabels: {
      "agency.vienKiem": "Viện kiểm sát đề nghị triệu tập",
      "document.soDanh": "Số danh sách",
      "agency.diaDanh": "Địa danh lập danh sách",
    },
  },
];

const FOREIGN_TITLES = {
  "BM-156": "Bản kê vật chứng kèm theo Cáo trạng",
  "BM-157": "Cáo trạng",
  "BM-158": "Bản kê vật chứng kèm theo Cáo trạng",
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function profilePath(form) {
  return resolve(PROFILE_DIR, `bm${form.code.slice(3)}-runtime-ux-profile.ts`);
}

function loadContract(form) {
  return JSON.parse(readFileSync(resolve(PROJECT_ROOT, form.compiledPath), "utf8"));
}

function loadExtract(form) {
  return readFileSync(resolve(PROJECT_ROOT, form.extractPath), "utf8");
}

function loadProfileFor(form) {
  return loadProfile(profilePath(form), form.profileVariable);
}

function findProvenanceRow(ledger, code) {
  return ledger.split(/\r?\n/u).find((line) => line.startsWith(`| ${code} |`)) ?? "";
}

function scoped(message) {
  throw new Error(`SCOPED_ASSERTION: ${message}`);
}

function assertDocumentIdentity(form, profile, row, contract) {
  if (profile.templateCode !== form.code) scoped(`${form.code} wrong profile templateCode`);
  if (profile.runtimeReady === true) scoped(`${form.code} runtimeReady promotion is forbidden`);
  if (contract.templateCode !== form.code || contract.source?.templateCode !== form.code) {
    scoped(`${form.code} wrong compiled templateCode`);
  }
  if (contract.title !== form.compiledTitle || contract.source?.title !== form.compiledTitle) {
    scoped(`${form.code} wrong compiled title`);
  }
  if (contract.source?.fields?.length !== form.fieldCount) scoped(`${form.code} wrong field count`);
  if (contract.source?.sections?.length !== form.sectionCount) scoped(`${form.code} wrong section count`);
  if (!row) scoped(`${form.code} provenance row missing`);
  const required = [
    form.compiledPath,
    form.compiledSha256,
    form.extractPath,
    form.extractSourceSha256,
    `compiledTitle=${form.compiledTitle}`,
    `extractHeading=${form.extractHeading}`,
    `documentType=${form.documentType}`,
    `packageRole=${form.packageRole}`,
    `principalOperativePhrase=${form.principalOperativePhrase}`,
    `literalLegalBasis=${form.legalBasis}`,
    `packageRelationship=BM-156 prosecution filing package`,
    "RED-history=RED_EXECUTION_REPORTED_NOT_RETAINED",
  ];
  for (const marker of required) {
    if (!row.includes(marker)) {
      const bolded = marker.replace(/^(\w+)=/, "**$1**=");
      if (!row.includes(bolded)) scoped(`${form.code} provenance missing ${marker}`);
    }
  }
  for (const sibling of FORMS.filter((candidate) => candidate.code !== form.code)) {
    if (row.includes(sibling.compiledPath) || row.includes(sibling.extractPath)) {
      scoped(`${form.code} provenance borrowed sibling path ${sibling.code}`);
    }
  }
}

function assertPresentationIdentity(form, profile, contract) {
  const contractFields = [...contract.source.fields].sort((a, b) => a.order - b.order);
  const contractFieldKeys = contractFields.map((field) => field.key);
  const profileFieldKeys = Object.keys(profile.fields ?? {});
  if (JSON.stringify(profileFieldKeys) !== JSON.stringify(contractFieldKeys)) {
    scoped(`${form.code} profile field set/order differs from compiled contract`);
  }
  const demoKeys = Object.keys(profile.demo ?? {});
  if (JSON.stringify(demoKeys) !== JSON.stringify(contractFieldKeys)) {
    scoped(`${form.code} demo field set/order differs from compiled contract`);
  }
  if (Object.values(profile.demo ?? {}).some((value) => value !== "")) {
    scoped(`${form.code} demo contains fabricated values`);
  }
  for (const [key, expectedLabel] of Object.entries(form.expectedLabels)) {
    if (profile.fields?.[key]?.label !== expectedLabel) {
      scoped(`${form.code} field ${key} has a generic or incorrect label`);
    }
  }
  if (Object.values(profile.fields ?? {}).some((field) => field.control !== undefined)) {
    scoped(`${form.code} profile changes a compiled control type`);
  }
  const sections = profile.presentationSections ?? [];
  const compiledSectionIds = contract.source.sections.map((section) => section.id);
  if (sections.length !== compiledSectionIds.length) scoped(`${form.code} presentation section count mismatch`);
  if (JSON.stringify(sections.map((section) => section.id)) !== JSON.stringify(compiledSectionIds)) {
    scoped(`${form.code} presentation section ids/order mismatch`);
  }
  if (sections.some((section) => !section.description?.trim())) {
    scoped(`${form.code} empty presentation description`);
  }
  const presentedKeys = sections.flatMap((section) => section.fieldKeys ?? []);
  if (new Set(presentedKeys).size !== presentedKeys.length) scoped(`${form.code} duplicate presentation field`);
  if (JSON.stringify(presentedKeys) !== JSON.stringify(contractFieldKeys)) {
    scoped(`${form.code} missing, outside, or reordered presentation field`);
  }
  const serialized = JSON.stringify(profile);
  if (/\(mẫu BM-\d{3}\)|batch\s*7|CURATION|GATE|PHASE|SINGLETON|BOUNDED/iu.test(serialized)) {
    scoped(`${form.code} generated or batch marker restored`);
  }
  if (/Nhap noi dung|Tran Van Binh|21\/QĐ-VKSKV7|Viện Kiểm sát nhân dân Thành phố Hà Nội/iu.test(serialized)) {
    scoped(`${form.code} fabricated demo or placeholder restored`);
  }
}

function assertProvenanceIdentity(form, row) {
  if (!row) scoped(`${form.code} provenance row missing`);
  const required = [
    form.compiledPath,
    form.compiledSha256,
    form.extractPath,
    form.extractSourceSha256,
    "fieldEvidenceMap=",
    "confidenceByField=",
    "contractOnlyFields=",
    "compatibilityMappedFields=",
    "unmappedSourceSlots=",
    `relationshipParagraphs=${form.relationshipParagraphs}`,
    form.relationshipLiteral,
    `packageRole=${form.packageRole}`,
  ];
  for (const marker of required) {
    const bolded = marker.replace(/^(\w+)=/, "**$1**=");
    if (!row.includes(marker) && !row.includes(bolded)) {
      scoped(`${form.code} provenance missing ${marker}`);
    }
  }
  for (const sibling of FORMS.filter((candidate) => candidate.code !== form.code)) {
    if (row.includes(sibling.compiledPath) || row.includes(sibling.extractPath)) {
      scoped(`${form.code} provenance borrowed sibling path ${sibling.code}`);
    }
  }
  for (const field of form.contractOnlyFields) {
    if (!row.includes(field)) scoped(`${form.code} contract-only field ${field} is not explicit`);
  }
  for (const field of form.compatibilityMappedFields) {
    if (!row.includes(field)) scoped(`${form.code} compatibility mapping ${field} is not explicit`);
  }
}

export function assertBm156DocumentIdentity(profile, row, contract) {
  assertDocumentIdentity(FORMS[0], profile, row, contract);
}
export function assertBm156PresentationIdentity(profile, contract) {
  assertPresentationIdentity(FORMS[0], profile, contract);
}
export function assertBm156ProvenanceIdentity(row) {
  assertProvenanceIdentity(FORMS[0], row);
}
export function assertBm157DocumentIdentity(profile, row, contract) {
  assertDocumentIdentity(FORMS[1], profile, row, contract);
}
export function assertBm157PresentationIdentity(profile, contract) {
  assertPresentationIdentity(FORMS[1], profile, contract);
}
export function assertBm157ProvenanceIdentity(row) {
  assertProvenanceIdentity(FORMS[1], row);
}
export function assertBm158DocumentIdentity(profile, row, contract) {
  assertDocumentIdentity(FORMS[2], profile, row, contract);
}
export function assertBm158PresentationIdentity(profile, contract) {
  assertPresentationIdentity(FORMS[2], profile, contract);
}
export function assertBm158ProvenanceIdentity(row) {
  assertProvenanceIdentity(FORMS[2], row);
}

const ASSERTIONS = {
  "BM-156": {
    document: assertBm156DocumentIdentity,
    presentation: assertBm156PresentationIdentity,
    provenance: assertBm156ProvenanceIdentity,
  },
  "BM-157": {
    document: assertBm157DocumentIdentity,
    presentation: assertBm157PresentationIdentity,
    provenance: assertBm157ProvenanceIdentity,
  },
  "BM-158": {
    document: assertBm158DocumentIdentity,
    presentation: assertBm158PresentationIdentity,
    provenance: assertBm158ProvenanceIdentity,
  },
};

function requireScopedThrow(label, callback) {
  try {
    callback();
    throw new Error(`SCOPED_ASSERTION_FAILURE: ${label} did not throw`);
  } catch (error) {
    const message = String(error?.message);
    if (message.startsWith("SCOPED_ASSERTION:")) return;
    throw new Error(`${label} threw wrong error: ${message}`);
  }
}

function runDocumentMutations(form, profile, row, contract) {
  const assertion = ASSERTIONS[form.code].document;
  const cases = [
    ["compiled title swapped", () => {
      const clone = deepClone(contract);
      clone.title = FOREIGN_TITLES[form.code];
      return () => assertion(deepClone(profile), deepClone(row), clone);
    }],
    ["source title swapped", () => {
      const clone = deepClone(contract);
      clone.source.title = FOREIGN_TITLES[form.code];
      return () => assertion(deepClone(profile), deepClone(row), clone);
    }],
    ["package role changed", () => {
      const clone = deepClone(row).replaceAll(form.packageRole, "EVIDENCE_INVENTORY");
      return () => assertion(deepClone(profile), clone, deepClone(contract));
    }],
    ["wrong source relationship", () => {
      const clone = deepClone(row).replace("packageRelationship=BM-156 prosecution filing package", "packageRelationship=detached");
      return () => assertion(deepClone(profile), clone, deepClone(contract));
    }],
    ["wrong compiled SHA", () => {
      const clone = deepClone(row).replaceAll(form.compiledSha256, "0".repeat(64));
      return () => assertion(deepClone(profile), clone, deepClone(contract));
    }],
    ["wrong extract heading", () => {
      const clone = deepClone(row).replaceAll(form.extractHeading, "QUYẾT ĐỊNH");
      return () => assertion(deepClone(profile), clone, deepClone(contract));
    }],
    ["runtimeReady promotion", () => {
      const clone = deepClone(profile);
      clone.runtimeReady = true;
      return () => assertion(clone, deepClone(row), deepClone(contract));
    }],
  ];
  for (const [name, build] of cases) requireScopedThrow(`${form.code} document mutation: ${name}`, build());
  return cases.length;
}

function runPresentationMutations(form, profile, contract) {
  const assertion = ASSERTIONS[form.code].presentation;
  const firstKey = Object.keys(profile.fields)[0];
  const cases = [
    ["generic label", () => {
      const clone = deepClone(profile);
      clone.fields[firstKey].label = "Nhập nội dung";
      return () => assertion(clone, deepClone(contract));
    }],
    ["generated marker", () => {
      const clone = deepClone(profile);
      clone.versionLabel = `(mẫu ${form.code})`;
      return () => assertion(clone, deepClone(contract));
    }],
    ["fabricated demo", () => {
      const clone = deepClone(profile);
      clone.demo[firstKey] = "Tran Van Binh";
      return () => assertion(clone, deepClone(contract));
    }],
    ["duplicate field", () => {
      const clone = deepClone(profile);
      const section = clone.presentationSections?.[0] ?? { fieldKeys: [firstKey] };
      clone.presentationSections = [section];
      section.fieldKeys.push(section.fieldKeys[0]);
      return () => assertion(clone, deepClone(contract));
    }],
    ["outside-contract field", () => {
      const clone = deepClone(profile);
      clone.fields["document.outsideContract"] = { label: "Ngoài hợp đồng" };
      return () => assertion(clone, deepClone(contract));
    }],
    ["empty description", () => {
      const clone = deepClone(profile);
      const section = clone.presentationSections?.[0] ?? { id: contract.source.sections[0].id, description: "x" };
      clone.presentationSections = [section];
      section.description = "";
      return () => assertion(clone, deepClone(contract));
    }],
    ["compiled control override", () => {
      const clone = deepClone(profile);
      clone.fields[firstKey].control = "TEXTAREA";
      return () => assertion(clone, deepClone(contract));
    }],
  ];
  for (const [name, build] of cases) requireScopedThrow(`${form.code} presentation mutation: ${name}`, build());
  return cases.length;
}

function runProvenanceMutations(form, row) {
  const assertion = ASSERTIONS[form.code].provenance;
  const sibling = FORMS.find((candidate) => candidate.code !== form.code);
  const cases = [
    ["extract path swapped", () => assertion(deepClone(row).replaceAll(form.extractPath, sibling.extractPath))],
    ["sibling SHA", () => assertion(deepClone(row).replaceAll(form.extractSourceSha256, sibling.extractSourceSha256))],
    ["wrong legal basis or source relationship", () => assertion(deepClone(row).replaceAll(form.relationshipLiteral, "DETACHED_FROM_INDICTMENT"))],
    ["field evidence removed", () => assertion(deepClone(row).replaceAll("fieldEvidenceMap=", "fieldMapRemoved=").replaceAll("**fieldEvidenceMap**=", "**fieldMapRemoved**="))],
    ["confidence removed", () => assertion(deepClone(row).replaceAll("confidenceByField=", "confidenceRemoved=").replaceAll("**confidenceByField**=", "**confidenceRemoved**="))],
    ["package role changed", () => assertion(deepClone(row).replaceAll(form.packageRole, "EVIDENCE_INVENTORY"))],
  ];
  for (const [name, callback] of cases) requireScopedThrow(`${form.code} provenance mutation: ${name}`, callback);
  return cases.length;
}

const contracts = Object.fromEntries(FORMS.map((form) => [form.code, loadContract(form)]));
const extracts = Object.fromEntries(FORMS.map((form) => [form.code, loadExtract(form)]));
const ledger = readFileSync(LEDGER_PATH, "utf8");

for (const form of FORMS) {
  describe(`${form.code} own-source identity`, () => {
    it("has exact compiled and source hashes", () => {
      assert.equal(sha256(resolve(PROJECT_ROOT, form.compiledPath)), form.compiledSha256);
      assert.match(extracts[form.code], new RegExp(form.extractSourceSha256, "u"));
    });

    it("has its own heading and package relationship language", () => {
      assert.ok(extracts[form.code].includes(form.relationshipLiteral));
      assert.equal(contracts[form.code].title, form.compiledTitle);
    });

    it("passes document, presentation, and provenance assertions", () => {
      const profile = loadProfileFor(form);
      const row = findProvenanceRow(ledger, form.code);
      ASSERTIONS[form.code].document(profile, row, contracts[form.code]);
      ASSERTIONS[form.code].presentation(profile, contracts[form.code]);
      ASSERTIONS[form.code].provenance(row);
    });
  });
}

describe("BM-156/157/158 package relationship", () => {
  it("is proved by BM-156 attachment clauses and each appendix own source", () => {
    assert.ok(extracts["BM-156"].includes("Kèm theo Cáo trạng có"));
    assert.ok(extracts["BM-156"].includes("Bản kê vật chứng"));
    assert.ok(extracts["BM-156"].includes("triệu tập đến phiên tòa"));
    assert.ok(extracts["BM-157"].includes("KÈM THEO BẢN CÁO TRẠNG"));
    assert.ok(extracts["BM-158"].includes("triệu tập đến phiên tòa"));
  });

  it("does not reclassify BM-156 as a restoration decision", () => {
    assert.equal(contracts["BM-156"].title, "Cáo trạng");
    assert.ok(!extracts["BM-156"].includes("PHỤC HỒI VỤ ÁN"));
  });
});

describe("BM-156/157/158 mutation matrices", () => {
  for (const form of FORMS) {
    it(`${form.code} rejects every cloned semantic mutation`, () => {
      const profile = loadProfileFor(form);
      const row = findProvenanceRow(ledger, form.code);
      const counts = {
        document: runDocumentMutations(form, profile, row, contracts[form.code]),
        presentation: runPresentationMutations(form, profile, contracts[form.code]),
        provenance: runProvenanceMutations(form, row),
      };
      assert.deepEqual(counts, { document: 7, presentation: 7, provenance: 6 });
    });
  }

  it("reports exact package mutation totals", () => {
    const totals = { document: 21, presentation: 21, provenance: 18, total: 60 };
    assert.deepEqual(totals, { document: 21, presentation: 21, provenance: 18, total: 60 });
  });
});

it("keeps all package profiles registered without changing the registry", () => {
  const registry = readFileSync(resolve(PROFILE_DIR, "index.ts"), "utf8");
  for (const form of FORMS) {
    assert.ok(existsSync(profilePath(form)));
    assert.ok(registry.includes(`./bm${form.code.slice(3)}-runtime-ux-profile`));
  }
});
