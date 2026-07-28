/** BM-194 through BM-199 semantic frontier closure guards. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROVENANCE_PATH = "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md";
const FORMS = [
  {
    code: "BM-194",
    extractId: "946009a4f0e0",
    extractSha: "946009a4f0e0dc89b1b4ffde2b5aaae1fada2dc74db7575bd0390b101c4a67a6",
    title: "Quyết định hủy bỏ quyết định áp dụng biện pháp xử lý chuyển hướng",
    operative: "Hủy bỏ Quyết định áp dụng biện pháp xử lý chuyển hướng",
    legalBasis: "khoản 4 Điều 56 của Luật Tư pháp người chưa thành niên",
    role: "COMMUNITY_DIVERSION_CANCELLATION_PAIR application-cancellation member",
    boundary: "TRUE_PAIR BM-194/BM-195",
    words: ["hủy bỏ biện pháp xử lý chuyển hướng đã được áp dụng", "tiếp tục giải quyết vụ án"],
  },
  {
    code: "BM-195",
    extractId: "0b409423eb38",
    extractSha: "0b409423eb38082c6d1e54e235514d4f0af0bea5f54ce8b30046bdfaaad885c9",
    title: "Quyết định hủy bỏ quyết định không áp dụng biện pháp xử lý chuyển hướng",
    operative: "Hủy bỏ Quyết định không áp dụng biện pháp xử lý chuyển hướng",
    legalBasis: "khoản 4 Điều 56 của Luật Tư pháp người chưa thành niên",
    role: "COMMUNITY_DIVERSION_CANCELLATION_PAIR non-application-cancellation member",
    boundary: "TRUE_PAIR BM-194/BM-195",
    words: ["hủy bỏ việc không áp dụng biện pháp xử lý chuyển hướng", "mở lại phiên họp"],
  },
  {
    code: "BM-196",
    extractId: "0c6aec084a26",
    extractSha: "0c6aec084a264f8172fc90e8686626c5590cfdec2b858fea109a90eb1f7c4a0c",
    title: "Quyết định mở phiên họp xem xét, áp dụng biện pháp xử lý chuyển hướng tại cộng đồng - Copy",
    operative: "Mở phiên họp xem xét, quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng",
    legalBasis: "Căn cứ Điều 59 của Luật Tư pháp người chưa thành niên",
    role: "COMMUNITY_DIVERSION_MEETING_LIFECYCLE opening member",
    boundary: "TRUE_FAMILY BM-196/BM-197/BM-198",
    words: ["mở phiên họp", "thời gian, địa điểm và hình thức"],
  },
  {
    code: "BM-197",
    extractId: "37dda9913570",
    extractSha: "37dda9913570caed2db65ab32ac87138b1a0703b6989a547ff3190ecefde9590",
    title: "BB phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng",
    operative: "Người chủ trì phiên họp quyết định:",
    legalBasis: null,
    role: "COMMUNITY_DIVERSION_MEETING_LIFECYCLE record member",
    boundary: "TRUE_FAMILY BM-196/BM-197/BM-198",
    words: ["biên bản ghi", "công bố tại phiên họp"],
  },
  {
    code: "BM-198",
    extractId: "269efb9590af",
    extractSha: "269efb9590af7f82a71da1321848277ab349be894b0c596b7f584279518628cc",
    title: "Quyết định hoãn phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng - Copy - Copy",
    operative: "Hoãn phiên họp xem xét, quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng",
    legalBasis: "khoản 4 và khoản 5 Điều 60 của Luật Tư pháp người chưa thành niên",
    role: "COMMUNITY_DIVERSION_MEETING_LIFECYCLE postponement member",
    boundary: "TRUE_FAMILY BM-196/BM-197/BM-198",
    words: ["hoãn phiên họp", "ấn định hoặc thông báo lịch mở lại"],
  },
  {
    code: "BM-199",
    extractId: "e4724bd967ad",
    extractSha: "e4724bd967ad5809d237840b79994e2292f05904ff6b16e3c1a88bec84657fa4",
    title: "Kiến nghị về quyết định áp dụng BPXLCH của Tòa án - Copy",
    operative: "kiến nghị hủy bỏ/sửa đổi/xem xét lại Quyết định",
    legalBasis: "khoản 1 Điều 69 và khoản 3 Điều 71 của Luật Tư pháp người chưa thành niên",
    role: "COURT_DIVERSION_DECISION_RECOMMENDATION_SINGLETON",
    boundary: "ISOLATED_SINGLETON",
    words: ["kiến nghị người có thẩm quyền", "của Tòa án"],
  },
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
  const ownCompiledPath = compiledPath(form);
  return {
    compiled: readJson(ownCompiledPath),
    compiledPath: ownCompiledPath,
    compiledSha: sha256(ownCompiledPath),
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
  if (form.legalBasis) {
    assert.ok(text.includes(form.legalBasis.toLocaleLowerCase()), `SCOPED_ASSERTION ${form.code} legal basis`);
  } else {
    assert.ok(state.provenance.includes("NO_EXPLICIT_LEGAL_BASIS_IN_EXTRACT"), `SCOPED_ASSERTION ${form.code} legal basis absence`);
  }
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
  assert.match(state.provenance, /excluded neighbors/u, `SCOPED_ASSERTION ${form.code} excluded neighbors`);
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

describe("BM-194 through BM-199 semantic frontier closure", { concurrency: false }, () => {
  for (const form of FORMS) {
    describe(form.code, () => {
      it("matches own document, presentation, and provenance identity", () => assertCanonical(form, canonicalState(form)));
      it("rejects document identity mutations", () => {
        assertMutation(form, (state) => { state.compiled.templateCode = "BM-200"; });
        assertMutation(form, (state) => { state.compiled.title = "SIBLING_TITLE"; });
        assertMutation(form, (state) => { state.extract.detectedTitle = "SIBLING_HEADING"; });
        assertMutation(form, (state) => { state.extract.sha256 = "0".repeat(64); });
        assertMutation(form, (state) => { state.extract.textBlocks = [{ text: "SOURCE_REMOVED" }]; });
      });
      it("rejects presentation mutations", () => {
        assertMutation(form, (state) => { state.profile = state.profile.replace("section-thong-tin-bieu-mau", "section-phantom"); });
        assertMutation(form, (state) => { state.profile = state.profile.replace(/description:\s*\n?\s*["'][^"']+["']/u, 'description: ""'); });
        assertMutation(form, (state) => {
          const [firstField, secondField] = state.compiled.source.fields;
          state.profile = state.profile
            .replace(`"${firstField.key}"`, '"__FIRST_FIELD__"')
            .replace(`"${secondField.key}"`, `"${firstField.key}"`)
            .replace('"__FIRST_FIELD__"', `"${secondField.key}"`);
        });
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

  it("distinguishes cancellation of application from cancellation of non-application", () => {
    const applicationCancellation = canonicalState(FORMS[0]).profile;
    const nonApplicationCancellation = canonicalState(FORMS[1]).profile;
    assert.match(applicationCancellation, /đã được áp dụng/iu);
    assert.doesNotMatch(applicationCancellation, /mở lại phiên họp xem xét, quyết định áp dụng/iu);
    assert.match(nonApplicationCancellation, /không áp dụng/iu);
    assert.match(nonApplicationCancellation, /mở lại phiên họp xem xét, quyết định áp dụng/iu);
  });

  it("distinguishes opening, recording, and postponing the meeting", () => {
    const [opening, record, postponement] = FORMS.slice(2, 5).map((form) => canonicalState(form).profile);
    assert.match(opening, /Mở phiên họp/iu);
    assert.match(record, /Biên bản ghi/iu);
    assert.match(postponement, /hoãn phiên họp/iu);
    assert.doesNotMatch(record, /ấn định hoặc thông báo lịch mở lại/iu);
    assert.doesNotMatch(postponement, /Biên bản ghi/iu);
  });

  it("keeps the Court recommendation outside the meeting lifecycle", () => {
    const recommendation = canonicalState(FORMS[5]).profile;
    assert.match(recommendation, /kiến nghị người có thẩm quyền/iu);
    assert.match(recommendation, /của Tòa án/iu);
    assert.doesNotMatch(recommendation, /Mở phiên họp|Biên bản ghi|hoãn phiên họp/iu);
  });
});
