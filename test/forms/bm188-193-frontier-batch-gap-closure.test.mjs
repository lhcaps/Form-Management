/** BM-188 through BM-193 multi-scope semantic frontier closure. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROVENANCE_PATH = "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md";
const FORMS = [
  { code: "BM-188", extractId: "cb14348d184c", extractSha: "cb14348d184c66ca2203a0bf96ad105abeda6d9832a149ba66738b9451d21f83", title: "Đề nghị Tòa án giải quyết vấn đề bồi thường thiệt hại", operative: "giải quyết vấn đề bồi thường thiệt hại, tịch thu tài sản", legalBasis: "Căn cứ các điều 35, 37, 38, 39 và 55", role: "JUVENILE_DIVERSION_COMPENSATION_SINGLETON", boundary: "singleton compensation scope", words: ["bồi thường thiệt hại", "tịch thu tài sản"] },
  { code: "BM-189", extractId: "70da8df0a0da", extractSha: "70da8df0a0dab9c85abb1ac7ae0e50a301e87244a389de13953ec67120c61c1e", title: "Yêu cầu CQĐT đề nghị TA xem xét áp dụng biện pháp giáo dục tại trường giáo dưỡng", operative: "làm thủ tục đề nghị Tòa án có thẩm quyền", legalBasis: "Căn cứ điều 35, 37, 39, 51, 55 và 63", role: "REFORMATORY_INVESTIGATION_AUTHORITY_REQUEST", boundary: "SHARED_DOMAIN_DISTINCT_DOCUMENTS", words: ["cơ quan điều tra", "làm thủ tục đề nghị"] },
  { code: "BM-190", extractId: "36fb96ee1a73", extractSha: "36fb96ee1a734743ed6250060be9b65c82d3e8ddb72c5308574ad144fa5b6394", title: "Đề nghị Tòa án xem xét, quyết định áp dụng biện pháp giáo dục tại trường giáo dưỡng", operative: "xem xét áp dụng biện pháp giáo dục tại trường giáo dưỡng", legalBasis: "Căn cứ các điều 35, 37, 39, 51, 55 và 63", role: "REFORMATORY_DIRECT_COURT_PROPOSAL", boundary: "SHARED_DOMAIN_DISTINCT_DOCUMENTS", words: ["trực tiếp Tòa án", "giáo dục tại trường giáo dưỡng"] },
  { code: "BM-191", extractId: "11335dc18806", extractSha: "11335dc188061b46e0eb3343ce38752fc76339d22588e2a8eabd7e54eea850ff", title: "Quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng", operative: "Điều 1. Áp dụng biện pháp", legalBasis: "Căn cứ các điều 52, 56 và 60", role: "COMMUNITY_DIVERSION_DECISION_FAMILY application member", boundary: "TRUE_FAMILY BM-191/BM-192/BM-193", words: ["áp dụng xử lý chuyển hướng", "trách nhiệm thi hành"] },
  { code: "BM-192", extractId: "42db503bed2a", extractSha: "42db503bed2af4b4ea0b59e3f74ac7bc45feed5185089eb0eda2c91ec1d2d159", title: "Quyết định không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng", operative: "Điều 1. Không áp dụng biện pháp", legalBasis: "Căn cứ các điều 52, 56 và 60", role: "COMMUNITY_DIVERSION_DECISION_FAMILY refusal member", boundary: "TRUE_FAMILY BM-191/BM-192/BM-193", words: ["không áp dụng", "tiếp tục giải quyết vụ án"] },
  { code: "BM-193", extractId: "e24862458ecb", extractSha: "e24862458ecbf5ef1ccf920b6ef454c0a1c67b125b867f38f7ef4ad9e851e207", title: "Quyết định thay đổi biện pháp xử lý chuyển hướng tại cộng đồng", operative: "Điều 1. Thay đổi biện pháp", legalBasis: "Căn cứ Điều 85 và Điều 142", role: "COMMUNITY_DIVERSION_DECISION_FAMILY change member", boundary: "TRUE_FAMILY BM-191/BM-192/BM-193", words: ["biện pháp đang áp dụng", "biện pháp thay thế"] },
];

const readText = (path) => readFileSync(resolve(ROOT, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const sha256 = (path) => createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
const profilePath = (code) => `apps/web/src/lib/runtime-ux/${code.toLowerCase().replace("-", "")}-runtime-ux-profile.ts`;
const compiledPath = (form) => `docs/audit/docx/compiled-v2/${form.code}.compiled.json`;
const extractJsonPath = (form) => `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.json`;
const extractMdPath = (form) => `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.md`;
const profileSections = (source) => [...source.matchAll(/sectionId:\s*["']([^"']+)["']/gu)].map((match) => match[1]);
const profileFields = (source) => [...(source.match(/const BM\d+_FIELDS = \{([\s\S]*?)\n\} as const;/u)?.[1] ?? "").matchAll(/^\s*["']([^"']+)["']:/gmu)].map((match) => match[1]);
const sourceText = (extract) => extract.textBlocks.map((block) => block.text).join(" ").replace(/\s+/gu, " ");
const provenanceRow = (code, text = readText(PROVENANCE_PATH)) => text.match(new RegExp(`^\\| ${code} \\|[^\\n]*`, "mu"))?.[0] ?? "";

function canonicalState(form) {
  const compiledFile = compiledPath(form);
  return {
    compiled: readJson(compiledFile),
    compiledPath: compiledFile,
    compiledSha: sha256(compiledFile),
    extract: readJson(extractJsonPath(form)),
    extractPath: extractMdPath(form),
    profile: readText(profilePath(form.code)),
    provenance: provenanceRow(form.code),
  };
}

function assertDocumentIdentity(form, state) {
  assert.equal(state.compiled.templateCode, form.code, `SCOPED_ASSERTION ${form.code} compiled code`);
  assert.equal(state.compiled.title, form.title, `SCOPED_ASSERTION ${form.code} compiled title`);
  assert.equal(state.extract.templateCode, form.code, `SCOPED_ASSERTION ${form.code} extract code`);
  assert.equal(state.extract.detectedTitle, form.title, `SCOPED_ASSERTION ${form.code} extract heading`);
  assert.equal(state.extract.sha256, form.extractSha, `SCOPED_ASSERTION ${form.code} extract hash`);
  assert.equal(state.compiled.source.sections.length, 1, `SCOPED_ASSERTION ${form.code} section count`);
  assert.equal(state.compiled.source.fields.length, Object.keys(state.compiled.jsonSchema.properties).length, `SCOPED_ASSERTION ${form.code} field count`);
  const text = sourceText(state.extract).toLocaleLowerCase();
  assert.ok(text.includes(form.operative.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} operative`);
  assert.ok(text.includes(form.legalBasis.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} legal basis`);
}

function assertPresentationIdentity(form, state) {
  const compiledFields = state.compiled.source.fields.map((field) => field.key);
  assert.ok(state.profile.includes(`templateCode: "${form.code}"`), `SCOPED_ASSERTION ${form.code} profile code`);
  assert.deepEqual(profileSections(state.profile), state.compiled.source.sections.map((section) => section.id), `SCOPED_ASSERTION ${form.code} sections`);
  assert.deepEqual(profileFields(state.profile), compiledFields, `SCOPED_ASSERTION ${form.code} fields/order`);
  const description = state.profile.match(/description:\s*\n?\s*["']([^"']+)["']/u)?.[1] ?? "";
  assert.ok(description, `SCOPED_ASSERTION ${form.code} description`);
  for (const word of form.words) assert.ok(description.toLocaleLowerCase().includes(word.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} role wording`);
  assert.doesNotMatch(state.profile, /Field\s+\d+|Người nhận \(dòng|\[GENERATED\]|\(mẫu BM-\d{3}\)/u, `SCOPED_ASSERTION ${form.code} generic marker`);
  assert.doesNotMatch(state.profile, /section-(?:thong-tin-ca-nhan|noi-dung|can-cu-va-noi-dung)/u, `SCOPED_ASSERTION ${form.code} phantom section`);
  const demo = state.profile.match(/DEMO_RUNTIME_UX = \{([\s\S]*?)\} as const;/u)?.[1] ?? "";
  assert.equal(demo.trim(), "", `SCOPED_ASSERTION ${form.code} fabricated demo`);
}

function assertProvenanceIdentity(form, state) {
  assert.ok(state.provenance, `SCOPED_ASSERTION ${form.code} provenance row`);
  assert.ok(state.provenance.includes(state.compiledPath), `SCOPED_ASSERTION ${form.code} compiled path`);
  assert.ok(state.provenance.includes(state.compiledSha), `SCOPED_ASSERTION ${form.code} compiled hash`);
  assert.ok(state.provenance.includes(state.extractPath), `SCOPED_ASSERTION ${form.code} extract path`);
  assert.ok(state.provenance.includes(form.extractSha), `SCOPED_ASSERTION ${form.code} extract hash`);
  assert.ok(state.provenance.includes(form.title), `SCOPED_ASSERTION ${form.code} title`);
  assert.match(state.provenance, /fieldEvidenceMap/u, `SCOPED_ASSERTION ${form.code} evidence map`);
  assert.match(state.provenance, /confidenceByField/u, `SCOPED_ASSERTION ${form.code} confidence map`);
  assert.ok(state.provenance.includes(form.role), `SCOPED_ASSERTION ${form.code} family role`);
  assert.ok(state.provenance.includes(form.boundary), `SCOPED_ASSERTION ${form.code} family boundary`);
  assert.ok(state.provenance.includes("runtimeReady=NOT_PROMOTED"), `SCOPED_ASSERTION ${form.code} runtime boundary`);
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
  assert.notEqual(JSON.stringify(state), before, `${form.code} mutation changes state`);
  assert.throws(() => assertCanonical(form, state), /SCOPED_ASSERTION/u);
}

describe("BM-188 through BM-193 adaptive frontier closure", { concurrency: false }, () => {
  for (const form of FORMS) {
    describe(form.code, () => {
      it("matches own document, presentation, and provenance identity", () => assertCanonical(form, canonicalState(form)));
      it("rejects document identity mutations", () => {
        assertMutation(form, (state) => { state.compiled.templateCode = "BM-194"; });
        assertMutation(form, (state) => { state.compiled.title = "SIBLING_TITLE"; });
        assertMutation(form, (state) => { state.extract.detectedTitle = "SIBLING_HEADING"; });
        assertMutation(form, (state) => { state.extract.sha256 = "0".repeat(64); });
        assertMutation(form, (state) => { state.extract.textBlocks = [{ text: "SOURCE_REMOVED" }]; });
      });
      it("rejects presentation mutations", () => {
        assertMutation(form, (state) => { state.profile = state.profile.replace("section-thong-tin-bieu-mau", "section-phantom"); });
        assertMutation(form, (state) => { state.profile = state.profile.replace(/description:\s*\n?\s*["'][^"']+["']/u, 'description: ""'); });
        assertMutation(form, (state) => { state.profile = state.profile.replace(/(\n\s*["'][^"']+["']:\s*\{[^\n]+\},)(\n\s*["'][^"']+["']:\s*\{[^\n]+\},)/u, "$2$1"); });
        assertMutation(form, (state) => { state.profile = state.profile.replace('label: "', 'label: "Field 1 - '); });
        assertMutation(form, (state) => { state.profile = state.profile.replace(/DEMO_RUNTIME_UX = \{\}/u, 'DEMO_RUNTIME_UX = { "agency.name": "Dữ liệu giả" }'); });
      });
      it("rejects provenance mutations", () => {
        assertMutation(form, (state) => { state.provenance = ""; });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace(state.compiledSha, "0".repeat(64)); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace("fieldEvidenceMap", "fieldEvidenceRemoved"); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace("confidenceByField", "confidenceRemoved"); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace(form.boundary, "BOUNDARY_REMOVED"); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace("runtimeReady=NOT_PROMOTED", "runtimeReady=PROMOTED"); });
      });
    });
  }

  it("distinguishes the investigation-authority request from the direct Court proposal", () => {
    assert.match(canonicalState(FORMS[1]).profile, /cơ quan điều tra làm thủ tục/iu);
    assert.match(canonicalState(FORMS[2]).profile, /trực tiếp Tòa án/iu);
    assert.doesNotMatch(canonicalState(FORMS[2]).profile, /cơ quan điều tra làm thủ tục/iu);
  });

  it("distinguishes application, refusal, and change outcomes", () => {
    const profiles = FORMS.slice(3).map((form) => canonicalState(form).profile);
    assert.match(profiles[0], /Quyết định áp dụng/iu);
    assert.match(profiles[1], /Quyết định không áp dụng/iu);
    assert.match(profiles[2], /Quyết định thay đổi/iu);
    assert.doesNotMatch(profiles[0], /không áp dụng|biện pháp thay thế/iu);
    assert.doesNotMatch(profiles[1], /biện pháp thay thế/iu);
  });
});
