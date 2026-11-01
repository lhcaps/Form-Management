/** BM-184 through BM-187 protection/diversion frontier closure. */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROVENANCE_PATH = resolve(
  ROOT,
  "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md",
);

const FORMS = [
  {
    code: "BM-184",
    extractId: "fb1c01087fa5",
    extractSha: "fb1c01087fa5d37670d08e2663d542ac94ac76f2bfae2ddd175ef06e94dc5008",
    title: "Đề nghị áp dụng biện pháp bảo vệ",
    operative: "Áp dụng biện pháp bảo vệ",
    legalBasis: "Căn cứ các điều 484, 485, 486 và 487 của Bộ luật Tố tụng hình sự",
    role: "PROTECTION_MEASURE_REQUEST",
    boundary: "BM-184/BM-185 protection domain",
    fieldCount: 13,
    descriptionWords: ["đề nghị", "biện pháp bảo vệ"],
  },
  {
    code: "BM-185",
    extractId: "69c976088827",
    extractSha: "69c9760888272b87abca0b7912bb8406783352f7b2913e649385d695f7006548",
    title: "Yêu cầu lập Báo cáo điều tra xã hội bổ sung",
    operative: "Lập Báo cáo điều tra xã hội bổ sung",
    legalBasis: "Căn cứ khoản 4 Điều 54 của Luật Tư pháp người chưa thành niên",
    role: "OTHER_PROTECTION_ROLE; distinct juvenile social-investigation request",
    boundary: "BM-184/BM-185 protection domain; SHARED_DOMAIN_DISTINCT_DOCUMENTS; pairing verdict DISTINGUISHED",
    fieldCount: 6,
    descriptionWords: ["Báo cáo điều tra xã hội bổ sung"],
  },
  {
    code: "BM-186",
    extractId: "84cb2023273b",
    extractSha: "84cb2023273bc687fa87568ba1957de9c13e8999229614eea7a0a3f5b6e4cb41",
    title: "Thông báo áp dụng thủ tục xử lý chuyển hướng",
    operative: "Áp dụng/không áp dụng thủ tục xử lý chuyển hướng",
    legalBasis: "Căn cứ các điều 35, 37, 38, 39, 52 và 55 của Luật Tư pháp người chưa thành niên",
    role: "JUVENILE_DIVERSION_NOTIFICATION",
    boundary: "BM-186/BM-187 juvenile diversion domain",
    fieldCount: 20,
    descriptionWords: ["thông báo", "xử lý chuyển hướng"],
  },
  {
    code: "BM-187",
    extractId: "e47644149068",
    extractSha: "e476441490680866c4413aed23ed9f23fd12294b9c2b25274464ab5add715ec8",
    title: "Yêu cầu NLCTXH xây dựng kế hoạch XLCH hoặc kế hoạch XLCH bổ sung",
    operative: "Xây dựng Kế hoạch xử lý chuyển hướng/Kế hoạch xử lý chuyển hướng bổ sung",
    legalBasis: "Căn cứ Điều 55 và Điều 58 của Luật Tư pháp người chưa thành niên",
    role: "JUVENILE_DIVERSION_PLAN_REQUEST",
    boundary: "BM-186/BM-187 juvenile diversion domain; plan request is distinct from notification",
    fieldCount: 16,
    descriptionWords: ["người làm công tác xã hội", "kế hoạch xử lý chuyển hướng bổ sung"],
  },
];

function readJson(path) {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
}

function readText(path) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
}

function profilePath(code) {
  return `apps/web/src/lib/runtime-ux/${code.toLowerCase().replace("-", "")}-runtime-ux-profile.ts`;
}

function compiledPath(form) {
  return `docs/audit/docx/compiled-v2/${form.code}.compiled.json`;
}

function extractPath(form) {
  return `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.json`;
}

function profileSections(source) {
  return [...source.matchAll(/sectionId:\s*["']([^"']+)["']/gu)].map((match) => match[1]);
}

function profileFields(source) {
  const block = source.match(/const BM\d+_FIELDS = \{([\s\S]*?)\n\} as const;/u)?.[1] ?? "";
  return [...block.matchAll(/^\s*["']([^"']+)["']:/gmu)].map((match) => match[1]);
}

function profileDescriptions(source) {
  return [...source.matchAll(/description:\s*["']([^"']*)["']/gu)].map((match) => match[1]);
}

function provenanceRow(code, text = readText(PROVENANCE_PATH)) {
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
  const compiledFile = compiledPath(form);
  const extractFile = extractPath(form);
  return {
    compiled: readJson(compiledFile),
    compiledPath: compiledFile,
    compiledSha: sha256(compiledFile),
    extract: readJson(extractFile),
    extractPath: extractFile,
    profile: readText(profilePath(form.code)),
    provenance: provenanceRow(form.code),
  };
}

function assertDocumentIdentity(form, state) {
  const { compiled, extract } = state;
  assert.equal(compiled.templateCode, form.code, `SCOPED_ASSERTION ${form.code} compiled code`);
  assert.equal(compiled.title, form.title, `SCOPED_ASSERTION ${form.code} compiled title`);
  assert.equal(extract.templateCode, form.code, `SCOPED_ASSERTION ${form.code} extract code`);
  assert.equal(extract.detectedTitle, form.title, `SCOPED_ASSERTION ${form.code} extract heading`);
  assert.equal(extract.sha256, form.extractSha, `SCOPED_ASSERTION ${form.code} extract SHA`);
  assert.equal(compiled.source.sections.length, 1, `SCOPED_ASSERTION ${form.code} section count`);
  assert.equal(compiled.source.fields.length, form.fieldCount, `SCOPED_ASSERTION ${form.code} field count`);
  assert.equal(compiled.source.fields.length, Object.keys(compiled.jsonSchema.properties).length, `SCOPED_ASSERTION ${form.code} schema field count`);
  const text = sourceText(extract).toLocaleLowerCase();
  assert.ok(text.includes(form.operative.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} operative phrase`);
  assert.ok(text.includes(form.legalBasis.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} legal basis`);
}

function assertPresentationIdentity(form, state) {
  const compiledFields = state.compiled.source.fields.map((field) => field.key);
  const compiledSections = state.compiled.source.sections.map((section) => section.id);
  assert.ok(state.profile.includes(`templateCode: "${form.code}"`), `SCOPED_ASSERTION ${form.code} profile code`);
  assert.deepEqual(profileSections(state.profile), compiledSections, `SCOPED_ASSERTION ${form.code} exact sections`);
  assert.deepEqual(profileFields(state.profile), compiledFields, `SCOPED_ASSERTION ${form.code} exact fields/order`);
  const descriptions = profileDescriptions(state.profile);
  assert.equal(descriptions.length, 1, `SCOPED_ASSERTION ${form.code} description count`);
  assert.ok(descriptions[0].trim(), `SCOPED_ASSERTION ${form.code} description present`);
  const lowerDescription = descriptions[0].toLocaleLowerCase();
  for (const word of form.descriptionWords) {
    assert.ok(lowerDescription.includes(word.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} semantic description`);
  }
  assert.doesNotMatch(state.profile, /Field\s+\d+|\[GENERATED\]|\(mẫu BM-\d{3}\)/u, `SCOPED_ASSERTION ${form.code} generic/generated marker`);
  assert.doesNotMatch(state.profile, /section-(?:thong-tin-ca-nhan|noi-dung|can-cu-va-noi-dung)/u, `SCOPED_ASSERTION ${form.code} phantom section`);
  const demo = state.profile.match(/const BM\d+_DEMO_RUNTIME_UX = \{([\s\S]*?)\} as const;/u)?.[1] ?? "";
  assert.equal(demo.trim(), "", `SCOPED_ASSERTION ${form.code} fabricated demo`);
  const demoKeys = [...demo.matchAll(/^\s*["']([^"']+)["']:/gmu)].map((match) => match[1]);
  assert.ok(demoKeys.every((key) => compiledFields.includes(key)), `SCOPED_ASSERTION ${form.code} demo keys`);
}

function assertProvenanceIdentity(form, state) {
  const row = state.provenance;
  assert.ok(row, `SCOPED_ASSERTION ${form.code} provenance row`);
  assert.ok(row.includes(state.compiledPath), `SCOPED_ASSERTION ${form.code} compiled path`);
  assert.ok(row.includes(state.compiledSha), `SCOPED_ASSERTION ${form.code} compiled SHA`);
  assert.ok(row.includes(state.extractPath.replace(/\.extract\.json$/u, ".extract.md")), `SCOPED_ASSERTION ${form.code} extract path`);
  assert.ok(row.includes(form.extractSha), `SCOPED_ASSERTION ${form.code} extract SHA`);
  assert.ok(row.includes(form.title), `SCOPED_ASSERTION ${form.code} title provenance`);
  assert.match(row, /fieldEvidenceMap/u, `SCOPED_ASSERTION ${form.code} field evidence map`);
  assert.match(row, /confidenceByField/u, `SCOPED_ASSERTION ${form.code} confidence map`);
  assert.ok(row.includes(form.role), `SCOPED_ASSERTION ${form.code} family role`);
  assert.ok(row.includes(form.boundary), `SCOPED_ASSERTION ${form.code} family boundary`);
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

describe("BM-184 through BM-187 protection/diversion frontier closure", { concurrency: false }, () => {
  for (const form of FORMS) {
    describe(form.code, () => {
      it("matches own document, presentation, and provenance identity", () => assertCanonical(form, canonicalState(form)));
      it("rejects wrong code, heading, hash, and operative source", () => {
        assertMutation(form, (state) => { state.compiled.templateCode = "BM-188"; });
        assertMutation(form, (state) => { state.extract.detectedTitle = "SIBLING_SOURCE"; });
        assertMutation(form, (state) => { state.extract.sha256 = "0".repeat(64); });
        assertMutation(form, (state) => { state.extract.textBlocks = state.extract.textBlocks.map((block) => ({ ...block, text: "SOURCE_TEXT_REMOVED" })); });
      });
      it("rejects phantom, missing, reordered, or generic presentation", () => {
        assertMutation(form, (state) => { state.profile = state.profile.replace("section-thong-tin-bieu-mau", "section-phantom"); });
        assertMutation(form, (state) => { state.profile = state.profile.replace(/description:\s*["'][^"']+["']/u, 'description: ""'); });
        assertMutation(form, (state) => { state.profile = state.profile.replace('const BM', 'const BM'); state.profile = state.profile.replace(/(\n\s*"[^"]+": \{[\s\S]*?\n\s*\},\r?\n)(\s*"[^"]+": \{)/u, "$2$1"); });
        assertMutation(form, (state) => { state.profile = state.profile.replace('label: "', 'label: "Field 1 - '); });
      });
      it("rejects fabricated demo and incomplete provenance", () => {
        assertMutation(form, (state) => { state.profile = state.profile.replace(/(DEMO_RUNTIME_UX = )\{\}/u, '$1{ "agency.name": "Dữ liệu giả" }'); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace("fieldEvidenceMap", "fieldEvidenceRemoved"); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace(form.boundary, "BOUNDARY_REMOVED"); });
        assertMutation(form, (state) => { state.provenance = state.provenance.replace("runtimeReady=NOT_PROMOTED", "runtimeReady=PROMOTED"); });
      });
    });
  }

  it("keeps protection forms distinct without asserting a true pair", () => {
    const protectionRequest = canonicalState(FORMS[0]);
    const socialInvestigationRequest = canonicalState(FORMS[1]);
    assert.match(protectionRequest.profile, /đề nghị/iu);
    assert.match(socialInvestigationRequest.profile, /Báo cáo điều tra xã hội bổ sung/iu);
    assert.notEqual(FORMS[0].operative, FORMS[1].operative);
    assert.match(socialInvestigationRequest.provenance, /SHARED_DOMAIN_DISTINCT_DOCUMENTS/u);
    assert.doesNotMatch(socialInvestigationRequest.provenance, /TRUE_PAIR/u);
  });

  it("keeps diversion notification distinct from plan request", () => {
    const notification = canonicalState(FORMS[2]);
    const planRequest = canonicalState(FORMS[3]);
    assert.match(notification.profile, /Thông báo áp dụng thủ tục xử lý chuyển hướng/u);
    assert.match(planRequest.profile, /kế hoạch xử lý chuyển hướng bổ sung/iu);
    assert.notEqual(FORMS[2].operative, FORMS[3].operative);
    assert.doesNotMatch(notification.profile, /xây dựng kế hoạch/u);
    assert.doesNotMatch(planRequest.profile, /Thông báo áp dụng/u);
  });

  it("keeps cross-domain evidence and family wording isolated", () => {
    const protectionRows = FORMS.slice(0, 2).map((form) => canonicalState(form).provenance).join(" ");
    const diversionRows = FORMS.slice(2).map((form) => canonicalState(form).provenance).join(" ");
    assert.doesNotMatch(protectionRows, /xử lý chuyển hướng/u);
    assert.doesNotMatch(diversionRows, /biện pháp bảo vệ/u);
  });
});
