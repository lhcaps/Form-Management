/** BM-178 through BM-183 multi-scope semantic frontier closure. */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROVENANCE_PATH = resolve(
  ROOT,
  "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md",
);

const FORMS = [
  {
    code: "BM-178",
    extractId: "7f2719dcacc7",
    extractSha: "7f2719dcacc7a583f2df1fcc6d06f1acfda76ed9e41cce42dc20a707adb00883",
    title: "QĐ huỷ bỏ QĐ áp dụng biện pháp điều tra tố tụng đặc biệt",
    operative: "Hủy bỏ Quyết định áp dụng biện pháp điều tra tố tụng đặc biệt",
    legalBasis: "Căn cứ các điều 41, 165 và 228",
    role: "TAIL_MEMBER_OF_BM174_178_FAMILY",
    boundary: "BM-178 is not treatment family",
    descriptionWord: "hủy bỏ",
  },
  {
    code: "BM-179",
    extractId: "186c49575a2e",
    extractSha: "186c49575a2e9eccee57a6fed56ae4237fb6840c12347eb8a9b7c000562569db",
    title: "QĐ áp dụng biện pháp chữa bệnh",
    operative: "Áp dụng biện pháp bắt buộc chữa bệnh đối với",
    legalBasis: "Căn cứ các điều 41, 165, 447 và 449",
    role: "COMPULSORY_TREATMENT_PAIR application member",
    boundary: "BM-179 is not expedited-procedure family",
    descriptionWord: "áp dụng biện pháp bắt buộc chữa bệnh",
  },
  {
    code: "BM-180",
    extractId: "d608f62a685a",
    extractSha: "d608f62a685a05a6d78ac229cafaaeebf690355c28702d68fd756fbbb0788200",
    title: "QĐ đình chỉ thi hành biện pháp bắt buộc chữa bệnh",
    operative: "Đình chỉ thi hành biện pháp bắt buộc chữa bệnh đối với",
    legalBasis: "Căn cứ Điều 41 và Điều 454",
    role: "COMPULSORY_TREATMENT_PAIR termination/discontinuation member",
    boundary: "BM-180 is not expedited-procedure family",
    descriptionWord: "đình chỉ thi hành biện pháp bắt buộc chữa bệnh",
  },
  {
    code: "BM-181",
    extractId: "ec1d8701fc13",
    extractSha: "ec1d8701fc133cc4bf5afa8e866db4572186a5f0ab644b838ffaaa874cc2199e",
    title: "QĐ áp dụng thủ tục rút gọn",
    operative: "Áp dụng thủ tục rút gọn đối với vụ án",
    legalBasis: "Căn cứ các điều 41, 165/236, 456 và 457",
    role: "EXPEDITED_PROCEDURE_FAMILY application member",
    boundary: "BM-181 is not special-investigation-measure family",
    descriptionWord: "áp dụng thủ tục rút gọn",
  },
  {
    code: "BM-182",
    extractId: "95dc6d1f57ab",
    extractSha: "95dc6d1f57abc5d29d16609c2d489a7e82326a3490a504d90db81f979fed5d4c",
    title: "QĐ huỷ bỏ QĐ áp dụng thủ tục rút gọn 1",
    operative: "Hủy bỏ Quyết định áp dụng thủ tục rút gọn",
    legalBasis: "Căn cứ các điều 41, 165/236, 456, 457 và 458",
    role: "EXPEDITED_PROCEDURE_FAMILY revocation member",
    boundary: "BM-182 is not special-investigation-measure family",
    descriptionWord: "hủy bỏ quyết định áp dụng thủ tục rút gọn",
  },
  {
    code: "BM-183",
    extractId: "294fc847169f",
    extractSha: "294fc847169fffca50c187246e8ae500095d58f20eb90ffaf3b50efd7fc45b66",
    title: "QĐ truy tố theo thủ tục rút gọn",
    operative: "Truy tố ra trước Tòa án để xét xử",
    legalBasis: "Căn cứ các điều 41, 236 và 461",
    role: "EXPEDITED_PROCEDURE_FAMILY prosecution outcome member",
    boundary: "BM-183 is not special-investigation-measure family",
    descriptionWord: "truy tố theo thủ tục rút gọn",
  },
];

function readJson(path) {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
}

function profilePath(code) {
  return `apps/web/src/lib/runtime-ux/${code.toLowerCase().replace("-", "")}-runtime-ux-profile.ts`;
}

function profileSections(source) {
  return [...source.matchAll(/sectionId:\s*"([^"]+)"/gu)].map((match) => match[1]);
}

function profileFields(source) {
  const block = source.match(/const BM\d+_FIELDS = \{([\s\S]*?)\n\} as const;/u)?.[1] ?? "";
  return [...block.matchAll(/^\s*"([^"]+)":/gmu)].map((match) => match[1]);
}

function profileDescriptions(source) {
  return [...source.matchAll(/description:\s*"([^"]*)"/gu)].map((match) => match[1]);
}

function provenanceRow(code, text = readFileSync(PROVENANCE_PATH, "utf8")) {
  return text.match(new RegExp(`^\\| ${code} \\|[^\\n]*`, "mu"))?.[0] ?? "";
}

function sourceText(extract) {
  return extract.textBlocks
    .map((block) => block.text)
    .join(" ")
    .replace(/\s+/gu, " ")
    .replace(/\s+([,.;:])/gu, "$1");
}

function canonicalState(form) {
  const compiledPath = `docs/audit/docx/compiled-v2/${form.code}.compiled.json`;
  const extractPath = `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.json`;
  return {
    compiled: readJson(compiledPath),
    compiledPath,
    compiledSha: sha256(compiledPath),
    extract: readJson(extractPath),
    extractPath,
    profile: readFileSync(resolve(ROOT, profilePath(form.code)), "utf8"),
    provenance: provenanceRow(form.code),
  };
}

function assertDocumentIdentity(form, state) {
  const { compiled, extract } = state;
  assert.equal(compiled.templateCode, form.code, `SCOPED_ASSERTION ${form.code} compiled templateCode`);
  assert.equal(compiled.title, form.title, `SCOPED_ASSERTION ${form.code} compiled title`);
  assert.equal(extract.templateCode, form.code, `SCOPED_ASSERTION ${form.code} extract templateCode`);
  assert.equal(extract.detectedTitle, form.title, `SCOPED_ASSERTION ${form.code} extract heading`);
  assert.equal(extract.sha256, form.extractSha, `SCOPED_ASSERTION ${form.code} extract SHA`);
  assert.equal(compiled.source.sections.length, 1, `SCOPED_ASSERTION ${form.code} section count`);
  assert.equal(compiled.source.fields.length, Object.keys(compiled.jsonSchema.properties).length, `SCOPED_ASSERTION ${form.code} field count`);
  const text = sourceText(extract).toLocaleLowerCase();
  assert.ok(text.includes(form.operative.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} operative phrase`);
  assert.ok(text.includes(form.legalBasis.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} legal basis`);
}

function assertPresentationIdentity(form, state) {
  const sections = state.compiled.source.sections.map((section) => section.id);
  const fields = state.compiled.source.fields.map((field) => field.key);
  assert.ok(state.profile.includes(`templateCode: "${form.code}"`), `SCOPED_ASSERTION ${form.code} profile code`);
  assert.deepEqual(profileSections(state.profile), sections, `SCOPED_ASSERTION ${form.code} exact sections`);
  assert.deepEqual(profileFields(state.profile), fields, `SCOPED_ASSERTION ${form.code} exact fields/order`);
  const descriptions = profileDescriptions(state.profile);
  assert.equal(descriptions.length, sections.length, `SCOPED_ASSERTION ${form.code} description count`);
  assert.ok(descriptions.every((value) => value.trim().length > 0), `SCOPED_ASSERTION ${form.code} description present`);
  assert.ok(descriptions.join(" ").toLocaleLowerCase().includes(form.descriptionWord), `SCOPED_ASSERTION ${form.code} operative description`);
  assert.doesNotMatch(state.profile, /section-(?:thong-tin-ca-nhan|noi-dung|can-cu-va-noi-dung)/u, `SCOPED_ASSERTION ${form.code} phantom section`);
  assert.doesNotMatch(state.profile, /Field\s+\d+|\[GENERATED\]/u, `SCOPED_ASSERTION ${form.code} generic/generated marker`);
  const demo = state.profile.match(/const BM\d+_DEMO_RUNTIME_UX = \{([\s\S]*?)\} as const;/u)?.[1] ?? "";
  assert.doesNotMatch(demo, /Bùi Quang Khải|ngày 04 tháng 3 năm 2026|Viện Kiểm sát nhân dân Thành phố Hà Nội/u, `SCOPED_ASSERTION ${form.code} fabricated demo`);
  const demoKeys = [...demo.matchAll(/^\s*"([^"]+)":/gmu)].map((match) => match[1]);
  assert.ok(demoKeys.every((key) => fields.includes(key)), `SCOPED_ASSERTION ${form.code} demo keys`);
}

function assertProvenanceIdentity(form, state) {
  const row = state.provenance;
  assert.ok(row, `SCOPED_ASSERTION ${form.code} provenance row`);
  assert.ok(row.includes(state.compiledPath), `SCOPED_ASSERTION ${form.code} compiled path`);
  assert.ok(row.toLocaleLowerCase().includes(state.compiledSha), `SCOPED_ASSERTION ${form.code} compiled SHA`);
  assert.ok(row.includes(state.extractPath.replace(".json", ".md")), `SCOPED_ASSERTION ${form.code} extract path`);
  assert.ok(row.includes(form.extractSha), `SCOPED_ASSERTION ${form.code} extract SHA`);
  assert.ok(row.includes("fieldEvidenceMap") && row.includes("confidenceByField"), `SCOPED_ASSERTION ${form.code} evidence map`);
  assert.ok(row.includes(form.role), `SCOPED_ASSERTION ${form.code} family role`);
  assert.ok(row.includes(form.boundary), `SCOPED_ASSERTION ${form.code} family boundary`);
  assert.ok(row.includes(form.legalBasis), `SCOPED_ASSERTION ${form.code} legal basis classification`);
  assert.ok(row.includes("runtimeReady=NOT_PROMOTED"), `SCOPED_ASSERTION ${form.code} runtime-ready boundary`);
}

function assertCanonical(form, state) {
  assertDocumentIdentity(form, state);
  assertPresentationIdentity(form, state);
  assertProvenanceIdentity(form, state);
}

function assertMutation(form, mutate) {
  const state = structuredClone(canonicalState(form));
  const before = JSON.stringify(state);
  mutate(state);
  assert.notEqual(JSON.stringify(state), before, `${form.code} mutation changes serialized state`);
  assert.throws(() => assertCanonical(form, state), /SCOPED_ASSERTION/u);
}

describe("BM-178 through BM-183 six-form frontier closure", { concurrency: false }, () => {
  for (const form of FORMS) {
    describe(form.code, () => {
      it("matches own document, presentation, and provenance identity", () => assertCanonical(form, canonicalState(form)));
      it("rejects wrong template code", () => assertMutation(form, (state) => { state.compiled.templateCode = "BM-184"; }));
      it("rejects sibling title or heading", () => assertMutation(form, (state) => { state.extract.detectedTitle = FORMS.find((candidate) => candidate.code !== form.code).title; }));
      it("rejects wrong source SHA", () => assertMutation(form, (state) => { state.extract.sha256 = "0".repeat(64); }));
      it("rejects wrong operative phrase", () => assertMutation(form, (state) => { state.extract.textBlocks = state.extract.textBlocks.map((block) => ({ ...block, text: "SOURCE_TEXT_REMOVED" })); }));
      it("rejects phantom or missing section", () => assertMutation(form, (state) => { state.profile = state.profile.replace("section-thong-tin-bieu-mau", "section-phantom"); }));
      it("rejects missing or reordered field", () => assertMutation(form, (state) => { state.profile = state.profile.replace(/^\s*"[^"]+":\s*\{[\s\S]*?^\s*\},\r?\n/mu, ""); }));
      it("rejects generic label or empty description", () => assertMutation(form, (state) => { state.profile = state.profile.replace(/description:\s*"[^"]+"/u, 'description: ""'); }));
      it("rejects fabricated demo", () => assertMutation(form, (state) => { state.profile = state.profile.replace("= {} as const", '= { "agency.name": "Viện Kiểm sát nhân dân Thành phố Hà Nội" } as const'); }));
      it("rejects missing provenance evidence", () => assertMutation(form, (state) => { state.provenance = state.provenance.replace("fieldEvidenceMap", "fieldEvidenceRemoved"); }));
      it("rejects sibling family role", () => assertMutation(form, (state) => { state.provenance = state.provenance.replace(form.role, FORMS.find((candidate) => candidate.role !== form.role).role); }));
      it("rejects runtime-ready promotion", () => assertMutation(form, (state) => { state.provenance = state.provenance.replace("runtimeReady=NOT_PROMOTED", "runtimeReady=PROMOTED"); }));
    });
  }

  it("distinguishes treatment application from discontinuation", () => {
    assert.notEqual(FORMS[1].operative, FORMS[2].operative);
    assert.notEqual(FORMS[1].legalBasis, FORMS[2].legalBasis);
  });

  it("distinguishes expedited application, revocation, and prosecution", () => {
    assert.equal(new Set(FORMS.slice(3).map((form) => form.operative)).size, 3);
    assert.equal(new Set(FORMS.slice(3).map((form) => form.legalBasis)).size, 3);
  });

  it("distinguishes BM-178 revocation from BM-177 extension wording", () => {
    const bm177 = readFileSync(resolve(ROOT, profilePath("BM-177")), "utf8");
    assert.match(bm177, /gia hạn thời hạn áp dụng/iu);
    assert.doesNotMatch(canonicalState(FORMS[0]).profile, /gia hạn thời hạn áp dụng/iu);
  });
});
