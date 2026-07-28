/** BM-200 through BM-205 semantic frontier closure guards. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROVENANCE_PATH = "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md";
const HOLDOUT_POLICY_PATH = "scripts/audit/holdout-runtime-evidence.mjs";
const HOLDOUT_ARTIFACT_PATH = "docs/audit/unified-bm-workspace/QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json";

const FORMS = [
  {
    code: "BM-200", extractId: "d340f628394e", compiledSha: "daf25d41d8098c7e07e9591f2198ae84e59f8f99be607b1ffa4b5df617a7ae79", extractMdSha: "84efd7a23f711da38045f62e711e03e9677eae6ad140121b9ffc314e6102e394",
    title: "Thông báo tiếp nhận khiếu nại, kiến nghị cân nhắc tính cần thiết", operative: "tiếp nhận để xem xét, giải quyết theo quy định của pháp luật", legalBasis: "Điều 69 và Điều 71 của Luật Tư pháp người chưa thành niên",
    role: "SPECIAL_CANARY_SINGLETON complaint-receipt notice", boundary: "PRESENTATION_CANARY_WITH_SAFE_CURATION_ALLOWED", words: ["tiếp nhận khiếu nại hoặc kiến nghị", "xử lý chuyển hướng tại cộng đồng"], special: true,
  },
  {
    code: "BM-201", extractId: "2d0aab05928d", compiledSha: "b54176c7da6c523226361b47d082db96c8b99af754b7a1a6e9b140429eba5cf3", extractMdSha: "65d21624d75a104d249042e64179ba44615124a5b91bea1e0a5485c06a42f5fd",
    title: "Quyết định giải quyết khiếu nại, kiến nghị", operative: "Chấp nhận/không chấp nhận khiếu nại/kiến nghị", legalBasis: "các điều 69, 70, 71 và 72 của Luật Tư pháp người chưa thành niên",
    role: "SHARED_DOMAIN_DISTINCT_DOCUMENTS complaint disposition", boundary: "BM-201/BM-202 share complaint domain but resolve versus discontinue", words: ["chấp nhận hoặc không chấp nhận", "hủy bỏ hoặc giữ nguyên"],
  },
  {
    code: "BM-202", extractId: "0c74f6ae9727", compiledSha: "7e97a72c78a2d0d17495ce295940ae1c2bb4a233bb8d6d0c87944e6fce7ff086", extractMdSha: "428d5c7e42924f7925d4d26349124026d9737dc77fbe48bbed50badaca9a8a66",
    title: "Quyết định đình chỉ việc giải quyết khiếu nại, kiến nghị", operative: "Đình chỉ việc giải quyết khiếu nại/kiến nghị", legalBasis: "các điều 69, 70, 71 và 72 của Luật Tư pháp người chưa thành niên",
    role: "SHARED_DOMAIN_DISTINCT_DOCUMENTS complaint discontinuance", boundary: "BM-201/BM-202 share complaint domain but resolve versus discontinue", words: ["đình chỉ", "khiếu nại hoặc kiến nghị"],
  },
  {
    code: "BM-203", extractId: "7572e687ae0f", compiledSha: "0d5ae5edb59ad7af6f311875173e69aea48f263d9651886790057aba18743710", extractMdSha: "a3aaf0afe40149c9f6023586e9ebd6c40bde2d1432a03762f1ae433565dde26d",
    title: "Thông báo về hoạt động tố tụng", operative: "Về hoạt động tố tụng", legalBasis: "Điều 131 của Luật Tư pháp người chưa thành niên",
    role: "ISOLATED_SINGLETON procedural-activity notice", boundary: "not a complaint decision, representative-participation decision or preventive-measure notice", words: ["người bào chữa", "thời gian, địa điểm"],
  },
  {
    code: "BM-204", extractId: "f334b93daabe", compiledSha: "e83d741bb308e06ea539e0bf4683ef60ecb48e38ebaad44660f70f1bd7645540", extractMdSha: "b4d8cfd67bb77aee967abb3943430c7670762a82be1801f8952756134abb6004",
    title: "QĐ việc tham gia tố tụng của người đại diện, tổ chức", operative: "Tham gia tố tụng với tư cách là", legalBasis: "Điều 132 và Điều 133 của Luật Tư pháp người chưa thành niên",
    role: "ISOLATED_SINGLETON representative/organization participation decision", boundary: "distinct from BM-203 notice and BM-205 preventive-measure notice", words: ["cá nhân đại diện", "tổ chức nơi người chưa thành niên"],
  },
  {
    code: "BM-205", extractId: "e6427663d551", compiledSha: "65a09bb873b22611ff53a302fecb295b8711d39ebdfc78d416a2d904ec1f9c7b", extractMdSha: "06a9657ccdfbdb06b3d1b5cbf900d0a07f600d22aa3de929c1900996e3559b65",
    title: "Thông báo áp dụng biện pháp ngăn chặn đối với NCTN", operative: "Về việc áp dụng biện pháp ngăn chặn", legalBasis: "Điều 135 của Luật Tư pháp người chưa thành niên",
    role: "ISOLATED_SINGLETON juvenile preventive-measure notice", boundary: "not diversion, social investigation, community supervision, protection request or BM-206/BM-207 electronic-monitoring decision", words: ["biện pháp ngăn chặn", "người chưa thành niên"],
  },
];

const readText = (path) => readFileSync(resolve(ROOT, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const sha256 = (path) => createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
const compiledPath = (form) => `docs/audit/docx/compiled-v2/${form.code}.compiled.json`;
const extractJsonPath = (form) => `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.json`;
const extractMdPath = (form) => `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.md`;
const profilePath = (form) => `apps/web/src/lib/runtime-ux/${form.code.toLowerCase().replace("-", "")}-runtime-ux-profile.ts`;
const profileSections = (source) => [...source.matchAll(/sectionId:\s*["']([^"']+)["']/gu)].map((match) => match[1]);
const profileFields = (source) => [...(source.match(/const BM\d+_FIELDS = \{([\s\S]*?)\n\} as const;/u)?.[1] ?? "").matchAll(/^\s*["']([^"']+)["']:/gmu)].map((match) => match[1]);
const sourceText = (extract) => extract.textBlocks.map((block) => block.text).join(" ").replace(/\s+/gu, " ");
const provenanceRow = (code, text = readText(PROVENANCE_PATH)) => text.match(new RegExp(`^\\| ${code} \\|[^\\n]*`, "mu"))?.[0] ?? "";

function canonicalState(form) {
  return {
    compiled: readJson(compiledPath(form)),
    extract: readJson(extractJsonPath(form)),
    profile: readText(profilePath(form)),
    provenance: provenanceRow(form.code),
    holdoutPolicy: readText(HOLDOUT_POLICY_PATH),
    holdoutArtifact: readJson(HOLDOUT_ARTIFACT_PATH),
  };
}

function assertDocumentIdentity(form, state) {
  assert.equal(state.compiled.templateCode, form.code, `SCOPED_ASSERTION ${form.code} compiled code`);
  assert.equal(state.compiled.title, form.title, `SCOPED_ASSERTION ${form.code} compiled title`);
  assert.equal(sha256(compiledPath(form)), form.compiledSha, `SCOPED_ASSERTION ${form.code} compiled hash`);
  assert.equal(state.extract.templateCode, form.code, `SCOPED_ASSERTION ${form.code} extract code`);
  assert.equal(state.extract.detectedTitle, form.title, `SCOPED_ASSERTION ${form.code} extract heading`);
  assert.ok(state.extract.sourceId.includes(form.extractId), `SCOPED_ASSERTION ${form.code} extract identity`);
  assert.equal(sha256(extractMdPath(form)), form.extractMdSha, `SCOPED_ASSERTION ${form.code} extract hash`);
  assert.equal(state.compiled.source.sections.length, 1, `SCOPED_ASSERTION ${form.code} section count`);
  assert.equal(state.compiled.source.fields.length, Object.keys(state.compiled.jsonSchema.properties).length, `SCOPED_ASSERTION ${form.code} field count`);
  const text = sourceText(state.extract).toLocaleLowerCase();
  assert.ok(text.includes(form.operative.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} operative phrase`);
  assert.ok(text.includes(form.legalBasis.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} legal basis`);
}

function assertPresentationIdentity(form, state) {
  assert.ok(state.profile.includes(`templateCode: "${form.code}"`), `SCOPED_ASSERTION ${form.code} profile code`);
  assert.deepEqual(profileSections(state.profile), state.compiled.source.sections.map((section) => section.id), `SCOPED_ASSERTION ${form.code} section set/order`);
  assert.deepEqual(profileFields(state.profile), state.compiled.source.fields.map((field) => field.key), `SCOPED_ASSERTION ${form.code} field set/order`);
  const description = state.profile.match(/description:\s*\n?\s*["']([^"']+)["']/u)?.[1] ?? "";
  assert.ok(description, `SCOPED_ASSERTION ${form.code} description`);
  for (const word of form.words) assert.ok(description.toLocaleLowerCase().includes(word.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} role wording`);
  assert.doesNotMatch(state.profile, /Field\s+\d+|Người nhận \(dòng|personLine\d*\)|\[GENERATED\]|auto-generated|safe synthetic demo|\(mẫu BM-\d{3}\)/iu, `SCOPED_ASSERTION ${form.code} generic marker`);
  assert.doesNotMatch(state.profile, /section-(?:thong-tin-ca-nhan|noi-dung|can-cu-va-noi-dung)/u, `SCOPED_ASSERTION ${form.code} phantom section`);
  assert.match(state.profile, /demo:\s*\{\},/u, `SCOPED_ASSERTION ${form.code} fabricated demo`);
}

function assertProvenanceIdentity(form, state) {
  assert.ok(state.provenance, `SCOPED_ASSERTION ${form.code} provenance row`);
  assert.ok(state.provenance.includes(compiledPath(form)), `SCOPED_ASSERTION ${form.code} compiled path`);
  assert.ok(state.provenance.includes(form.compiledSha), `SCOPED_ASSERTION ${form.code} compiled hash provenance`);
  assert.ok(state.provenance.includes(extractMdPath(form)), `SCOPED_ASSERTION ${form.code} extract path`);
  assert.ok(state.provenance.includes(form.extractMdSha), `SCOPED_ASSERTION ${form.code} extract hash provenance`);
  assert.match(state.provenance, /fieldEvidenceMap/u, `SCOPED_ASSERTION ${form.code} evidence map`);
  assert.match(state.provenance, /confidenceByField/u, `SCOPED_ASSERTION ${form.code} confidence map`);
  assert.ok(state.provenance.includes(form.role), `SCOPED_ASSERTION ${form.code} family role`);
  assert.ok(state.provenance.includes(form.boundary), `SCOPED_ASSERTION ${form.code} family boundary`);
  assert.match(state.provenance, /excluded neighbors/u, `SCOPED_ASSERTION ${form.code} excluded neighbors`);
  assert.ok(state.provenance.includes("runtimeReady=NOT_PROMOTED"), `SCOPED_ASSERTION ${form.code} runtime boundary`);
}

function assertBm200CanaryInvariant(state) {
  assert.match(state.holdoutPolicy, /HOLDOUT_PARTIAL_CODES[\s\S]*"BM-200"/u, "SCOPED_ASSERTION BM-200 holdout membership");
  assert.match(state.provenance, /CANARY_POLICY_PRESERVED/u, "SCOPED_ASSERTION BM-200 canary marker");
  const form = state.holdoutArtifact.forms.find((entry) => entry.templateCode === "BM-200");
  assert.equal(form?.persisted, false, "SCOPED_ASSERTION BM-200 persisted false");
  assert.equal(state.holdoutArtifact.formFlightRuntimeReadyPromoted, 0, "SCOPED_ASSERTION BM-200 no runtime promotion");
  assert.doesNotMatch(state.profile, /runtimeReady:\s*true|profileStatus:\s*["']runtime-ready["']/u, "SCOPED_ASSERTION BM-200 profile readiness");
}

function assertCanonical(form, state) {
  assertDocumentIdentity(form, state);
  assertPresentationIdentity(form, state);
  assertProvenanceIdentity(form, state);
  if (form.special) assertBm200CanaryInvariant(state);
}

function assertMutation(form, mutate) {
  const state = structuredClone(canonicalState(form));
  const before = JSON.stringify(state);
  mutate(state);
  assert.notEqual(JSON.stringify(state), before, `${form.code} mutation changes serialized state`);
  assert.throws(() => assertCanonical(form, state), /SCOPED_ASSERTION/u);
}

describe("BM-200 through BM-205 semantic frontier closure", { concurrency: false }, () => {
  for (const form of FORMS) {
    describe(form.code, () => {
      it("matches own document, presentation, and provenance identity", () => assertCanonical(form, canonicalState(form)));
      it("rejects five document identity mutations", () => {
        assertMutation(form, (state) => { state.compiled.templateCode = "BM-206"; });
        assertMutation(form, (state) => { state.compiled.title = "SIBLING_TITLE"; });
        assertMutation(form, (state) => { state.extract.detectedTitle = "SIBLING_HEADING"; });
        assertMutation(form, (state) => { state.extract.sourceId = "SIBLING_SOURCE"; });
        assertMutation(form, (state) => { state.extract.textBlocks = [{ text: "SOURCE_REMOVED" }]; });
      });
      it("rejects five presentation mutations", () => {
        assertMutation(form, (state) => { state.profile = state.profile.replace("section-thong-tin-bieu-mau", "section-phantom"); });
        assertMutation(form, (state) => { state.profile = state.profile.replace(/description:\s*\n?\s*["'][^"']+["']/u, 'description: ""'); });
        assertMutation(form, (state) => { state.profile = state.profile.replace(state.compiled.source.fields[0].key, "outside.contract.field"); });
        assertMutation(form, (state) => { state.profile = state.profile.replace('label: "', 'label: "Field 1 - '); });
        assertMutation(form, (state) => { state.profile = state.profile.replace("demo: {},", 'demo: { "agency.name": "Dữ liệu giả" },'); });
      });
      it("rejects six provenance mutations", () => {
        assertMutation(form, (state) => { state.provenance = ""; });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace(form.compiledSha, "0".repeat(64)); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace(form.extractMdSha, "1".repeat(64)); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace("fieldEvidenceMap", "fieldEvidenceRemoved"); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace(form.boundary, "BOUNDARY_REMOVED"); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace("runtimeReady=NOT_PROMOTED", "runtimeReady=PROMOTED"); });
      });
    });
  }

  it("preserves BM-200 canary behavior against dedicated mutations", () => {
    const form = FORMS[0];
    assertMutation(form, (state) => { state.provenance = state.provenance.replace("CANARY_POLICY_PRESERVED", "HISTORICAL_CANARY_STATUS_SUPERSEDED"); });
    assertMutation(form, (state) => { state.holdoutPolicy = state.holdoutPolicy.replace(', "BM-200"', ""); });
    assertMutation(form, (state) => { state.holdoutArtifact.forms.find((entry) => entry.templateCode === "BM-200").persisted = true; });
    assertMutation(form, (state) => { state.holdoutArtifact.formFlightRuntimeReadyPromoted = 1; });
    assertMutation(form, (state) => { state.profile += '\nruntimeReady: true;'; });
  });

  it("distinguishes complaint receipt, disposition, and discontinuance", () => {
    const [receipt, disposition, discontinuance] = FORMS.slice(0, 3).map((form) => canonicalState(form).profile);
    assert.match(receipt, /tiếp nhận khiếu nại hoặc kiến nghị/iu);
    assert.match(disposition, /hủy bỏ hoặc giữ nguyên/iu);
    assert.match(discontinuance, /đình chỉ/iu);
    assert.doesNotMatch(receipt, /hủy bỏ hoặc giữ nguyên|đình chỉ/iu);
  });

  it("keeps procedural notice, representative decision, and preventive notice distinct", () => {
    const [activity, representative, preventive] = FORMS.slice(3).map((form) => canonicalState(form).profile);
    assert.match(activity, /hoạt động tố tụng/iu);
    assert.match(representative, /người đại diện hoặc tổ chức/iu);
    assert.match(preventive, /biện pháp ngăn chặn/iu);
    assert.doesNotMatch(preventive, /giám sát điện tử|xử lý chuyển hướng|điều tra xã hội/iu);
  });
});
