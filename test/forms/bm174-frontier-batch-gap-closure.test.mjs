/**
 * BM-174 through BM-177 contiguous frontier gap closure.
 *
 * The four forms are one special-investigative-measure family: request,
 * approval, refusal, and extension. Tests cover source identity, presentation
 * completeness, provenance evidence, and a lean mutation matrix.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROFILE_DIR = resolve(ROOT, "apps/web/src/lib/runtime-ux");
const PROVENANCE_PATH = resolve(
  ROOT,
  "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md",
);

const FORMS = [
  {
    code: "BM-174",
    title: "Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt",
    extractSha: "f8e45c638bb6047a159cd12b992a5099219657d88cf6b4486453607ac9821ec7",
    fieldKeys: ["agency.name", "document.summaryLine", "person.idNumber", "person.occupation", "person.currentAddress", "person.dateOfBirth", "person.personFullName", "document.contentLine", "document.issuePlace", "document.issueDate", "document.fullDocumentCode"],
    operative: "Áp dụng biện pháp điều tra tố tụng đặc biệt",
    legalBasis: "Điều 41, 165, 223, 224 và 225",
  },
  {
    code: "BM-175",
    title: "QĐ phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt",
    extractSha: "6d3f2b46283df10d969b5d23da45e37f98cbbe2bec6147371151afd800924fec",
    fieldKeys: ["agency.name", "document.issueDate", "document.fullDocumentCode"],
    operative: "PHÊ CHUẨN QUYẾT ĐỊNH ÁP DỤNG BIỆN PHÁP ĐIỀU TRA TỐ TỤNG ĐẶC BIỆT",
    legalBasis: "Điều 41, 165, 223, 224 và 225",
  },
  {
    code: "BM-176",
    title: "QĐ không phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt",
    extractSha: "8f1b057e17a7a573a8f2e49cbcbd44e50ce5dba9c4edae91e4919c5fadc32d57",
    fieldKeys: ["agency.name", "document.summaryLine", "document.reasonLine", "document.contentLine", "decision.decisionLine", "document.issueDate", "document.fullDocumentCode"],
    operative: "KHÔNG PHÊ CHUẨN QUYẾT ĐỊNH ÁP DỤNG BIỆN PHÁP ĐIỀU TRA TỐ TỤNG ĐẶC BIỆT",
    legalBasis: "Điều 41, 165, 223, 224 và 225",
  },
  {
    code: "BM-177",
    title: "QĐ gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt",
    extractSha: "05be0ed9739804279ad6402b5dee206e08d729809bc74650876388ee1d656968",
    fieldKeys: ["agency.name", "document.fullDocumentCode"],
    operative: "GIA HẠN THỜI HẠN ÁP DỤNG BIỆN PHÁP ĐIỀU TRA TỐ TỤNG ĐẶC BIỆT",
    legalBasis: "Điều 41 và Điều 226",
  },
];

const readJson = (relativePath) =>
  JSON.parse(readFileSync(resolve(ROOT, relativePath), "utf8"));

const profilePath = (code) =>
  resolve(PROFILE_DIR, code.toLowerCase().replace("-", "") + "-runtime-ux-profile.ts");

const compiledByCode = Object.fromEntries(
  FORMS.map((form) => [form.code, readJson(`docs/audit/docx/compiled-v2/${form.code}.compiled.json`)]),
);
const extractByCode = Object.fromEntries(
  FORMS.map((form) => [form.code, readJson(`docs/audit/docx/extracted/${form.code}__${form.extractSha.slice(0, 12)}.extract.json`)]),
);

function profileSource(code) {
  return readFileSync(profilePath(code), "utf8");
}

function provenanceRow(code, ledger = readFileSync(PROVENANCE_PATH, "utf8")) {
  return ledger.match(new RegExp(`^\\| ${code} \\|[^\\n]*`, "mu"))?.[0] ?? "";
}

function profileSections(source) {
  return [...source.matchAll(/sectionId:\s*"([^"]+)"/gu)].map((match) => match[1]);
}

function profileFields(source) {
  const fieldBlock = source.match(/const BM\d+_FIELDS = \{([\s\S]*?)\n\} as const;/u)?.[1] ?? "";
  return [...fieldBlock.matchAll(/^\s*"([^"]+)":/gmu)].map((match) => match[1]);
}

function assertCanonical(form, state) {
  const compiled = state.compiled;
  const extract = state.extract;
  const source = state.profileSource;
  const row = state.provenance;
  if (compiled.templateCode !== form.code) throw new Error(`SCOPED_ASSERTION: ${form.code} templateCode mismatch`);
  if (compiled.title !== form.title) throw new Error(`SCOPED_ASSERTION: ${form.code} compiled title mismatch`);
  if (extract.templateCode !== form.code || extract.detectedTitle !== form.title) throw new Error(`SCOPED_ASSERTION: ${form.code} extract identity mismatch`);
  if (!source.includes(`templateCode: "${form.code}"`)) throw new Error(`SCOPED_ASSERTION: ${form.code} profile identity missing`);
  const sections = profileSections(source);
  const compiledSections = compiled.source.sections.map((section) => section.id);
  if (JSON.stringify(sections) !== JSON.stringify(compiledSections)) throw new Error(`SCOPED_ASSERTION: ${form.code} section set/order mismatch`);
  const fields = profileFields(source);
  if (JSON.stringify(fields) !== JSON.stringify(form.fieldKeys)) throw new Error(`SCOPED_ASSERTION: ${form.code} field set/order mismatch`);
  if (fields.length !== compiled.source.fields.length) throw new Error(`SCOPED_ASSERTION: ${form.code} field count mismatch`);
  if ([...source.matchAll(/description:\s*"([^"]*)"/gu)].some((match) => !match[1].trim())) throw new Error(`SCOPED_ASSERTION: ${form.code} empty section description`);
  if (source.includes("(mẫu BM-") || source.includes("Trần Văn Bình") || source.includes("Tran Van Binh")) throw new Error(`SCOPED_ASSERTION: ${form.code} fabricated/generated marker`);
  const normalizedRow = row.toLocaleLowerCase();
  if (!normalizedRow.includes(form.extractSha.toLocaleLowerCase()) || !normalizedRow.includes(form.operative.toLocaleLowerCase()) || !normalizedRow.includes(form.legalBasis.toLocaleLowerCase())) throw new Error(`SCOPED_ASSERTION: ${form.code} source evidence mismatch`);
  if (!row.includes("fieldEvidenceMap") || !row.includes("confidenceByField") || !row.includes("runtimeReady=NOT_PROMOTED") || !row.includes("TRUE_FAMILY")) throw new Error(`SCOPED_ASSERTION: ${form.code} incomplete provenance`);
}

function baseState(form) {
  return {
    compiled: structuredClone(compiledByCode[form.code]),
    extract: structuredClone(extractByCode[form.code]),
    profileSource: profileSource(form.code),
    provenance: provenanceRow(form.code),
  };
}

function assertMutation(form, mutate) {
  const state = baseState(form);
  const before = JSON.stringify(state);
  mutate(state);
  assert.notStrictEqual(JSON.stringify(state), before, `${form.code} mutation must change serialized state`);
  assert.throws(() => assertCanonical(form, state), (error) => /SCOPED_ASSERTION/u.test(error.message));
}

describe("BM-174/BM-177 contiguous frontier gap closure", { concurrency: false }, () => {
  for (const form of FORMS) {
    describe(form.code, () => {
      it("matches own compiled and extracted source identity", () => assertCanonical(form, baseState(form)));
      it("represents the exact compiled section and field contract", () => assertCanonical(form, baseState(form)));
      it("contains parser-readable provenance and evidence confidence", () => assertCanonical(form, baseState(form)));

      it("rejects wrong template identity", () => assertMutation(form, (state) => { state.compiled.templateCode = "BM-181"; }));
      it("rejects sibling source identity", () => assertMutation(form, (state) => { state.extract.detectedTitle = FORMS.find((candidate) => candidate.code !== form.code).title; }));
      it("rejects source hash drift", () => assertMutation(form, (state) => { state.provenance = state.provenance.replace(form.extractSha, "0".repeat(64)); }));
      it("rejects phantom or missing sections", () => assertMutation(form, (state) => { state.profileSource = state.profileSource.replace(/sectionId: "[^"]+"/u, 'sectionId: "section-phantom"'); }));
      it("rejects missing field evidence", () => assertMutation(form, (state) => { state.provenance = state.provenance.replace("fieldEvidenceMap", "fieldEvidenceRemoved"); }));
      it("rejects evidence overpromotion", () => assertMutation(form, (state) => { state.provenance = state.provenance.replace("runtimeReady=NOT_PROMOTED", "runtimeReady=BM-001"); }));
    });
  }

  it("preserves the special-investigative-measure family distinction", () => {
    const rows = FORMS.map((form) => provenanceRow(form.code));
    assert.ok(rows.every((row) => row.includes("TRUE_FAMILY")));
    assert.notEqual(FORMS[0].operative, FORMS[1].operative);
    assert.notEqual(FORMS[1].operative, FORMS[2].operative);
    assert.notEqual(FORMS[2].operative, FORMS[3].operative);
  });
});
