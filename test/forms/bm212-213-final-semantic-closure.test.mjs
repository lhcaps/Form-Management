/** BM-212/BM-213 final semantic closure guards with identity-bound mutation coverage. */
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
    code: "BM-212",
    title: "Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên",
    extractId: "b1bab1e5a854",
    compiledSha: "912c3851aabcd8120260f63c7e3de5e3d2f23642bb8cc9ae03ea57169117f1bb",
    extractMdSha: "0cc54b4d1987aeda706b5bb4f76cdc301b1aa59c03128968cf81db6daa80b193",
    operative: "Tham gia tố tụng để hướng dẫn/hỗ trợ đối với:",
    legalBasis: "Căn cứ Điều 154 của Luật Tư pháp người chưa thành niên",
    documentType: "CÔNG VĂN",
    role: "JUVENILE_GUIDANCE_SUPPORT_FAMILY request member",
    boundary: "BM-212 is a guidance/support request under Điều 154",
    sectionIds: ["section-thong-tin-bieu-mau"],
    fieldKeys: [
      "agency.name", "recipients.personLine", "recipients.personLine9", "recipients.personLine8",
      "recipients.personLine7", "recipients.personLine23", "recipients.personLine22", "recipients.personLine6",
      "recipients.personLine21", "recipients.personLine20", "recipients.personLine19", "recipients.personLine18",
      "recipients.personLine17", "recipients.personLine16", "recipients.personLine15", "recipients.personLine14",
      "recipients.personLine13", "recipients.personLine12", "recipients.personLine11", "recipients.personLine5",
      "recipients.personLine4", "recipients.personLine3", "recipients.personLine2", "document.issueDate",
      "document.fullDocumentCode",
    ],
  },
  {
    code: "BM-213",
    title: "Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN",
    extractId: "33383be18132",
    compiledSha: "4916e02e98a4452703665b7996f44a3bf97e8d0d9b221b3a2f59196f11c0a1a0",
    extractMdSha: "893d6a62f866933f53def669dfad0db022347ff92c49059e45729f1758a5d70a",
    operative: "Áp dụng các biện pháp kỹ thuật để bảo vệ thông tin cá nhân",
    legalBasis: "Căn cứ Điều 155 của Luật Tư pháp người chưa thành niên",
    documentType: "YÊU CẦU",
    role: "JUVENILE_TECHNICAL_PROTECTION_FAMILY technical-protection request member",
    boundary: "BM-213 is a technical-protection request under Điều 155",
    sectionIds: [
      "section-co-quan-va-van-ban", "section-thong-tin-nguoi-chua-thanh-nien",
      "section-noi-dung-yeu-cau-bao-ve", "section-noi-nhan", "section-chu-ky",
    ],
    fieldKeys: [
      "agency.parentName", "agency.name", "document.documentCode", "document.issuePlaceAndDateLine",
      "official.issuerTitle", "person.fullName", "person.genderLabel", "person.otherName",
      "person.dateOfBirthText", "person.placeOfBirth", "person.nationality", "person.ethnicity",
      "person.religion", "person.occupation", "person.identityDocumentLine", "person.identityIssueLine",
      "person.permanentAddress", "person.temporaryAddress", "person.currentAddress", "juvenileProtection.contextLine",
      "juvenileProtection.article1Line", "juvenileProtection.resultDeadlineLine", "juvenileProtection.article2Line",
      "recipients.primaryLine", "recipients.investigationAuthorityLine", "recipients.otherRecipientsLine",
      "recipients.archiveLine", "signature.signerName",
    ],
  },
];

const readText = (path) => readFileSync(resolve(ROOT, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const sha256File = (path) => createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
const compiledPath = (form) => `docs/audit/docx/compiled-v2/${form.code}.compiled.json`;
const extractJsonPath = (form) => `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.json`;
const extractMdPath = (form) => `docs/audit/docx/extracted/${form.code}__${form.extractId}.extract.md`;
const profilePath = (form) => `apps/web/src/lib/runtime-ux/${form.code.replaceAll("-", "").toLowerCase()}-runtime-ux-profile.ts`;
const sourceText = (extract) => extract.textBlocks.map((block) => block.text).join(" ").replace(/\s+/gu, " ");
const provenanceRow = (code, ledger = readText(PROVENANCE_PATH)) => ledger.match(new RegExp(`^\\| ${code} \\|[^\\n]*`, "mu"))?.[0] ?? "";

function canonicalState(form) {
  return {
    compiled: readJson(compiledPath(form)),
    extract: readJson(extractJsonPath(form)),
    profile: readText(profilePath(form)),
    provenance: provenanceRow(form.code),
  };
}

function profileSections(profile) {
  return [...profile.matchAll(/sectionId:\s*["']([^"']+)["']/gu)].map((match) => match[1]);
}

function profileFields(profile) {
  const match = profile.match(/const BM\d+_FIELDS = \{([\s\S]*?)\n\} as const;/u);
  return match ? [...match[1].matchAll(/^\s*["']([^"']+)["']:/gmu)].map((match) => match[1]) : [];
}

function assertDocumentIdentity(form, state) {
  assert.equal(state.compiled.templateCode, form.code, `SCOPED_ASSERTION ${form.code} compiled code`);
  assert.equal(state.compiled.title, form.title, `SCOPED_ASSERTION ${form.code} compiled title`);
  assert.equal(sha256File(compiledPath(form)), form.compiledSha, `SCOPED_ASSERTION ${form.code} compiled hash`);
  assert.equal(sha256File(extractMdPath(form)), form.extractMdSha, `SCOPED_ASSERTION ${form.code} extract hash`);
  assert.equal(state.extract.templateCode, form.code, `SCOPED_ASSERTION ${form.code} extract code`);
  assert.equal(state.extract.detectedTitle, form.title, `SCOPED_ASSERTION ${form.code} extract heading`);
  assert.ok(state.extract.sourceId.includes(form.extractId), `SCOPED_ASSERTION ${form.code} extract identity`);
  assert.deepEqual(state.compiled.source.sections.map((section) => section.id), form.sectionIds, `SCOPED_ASSERTION ${form.code} compiled section set/order`);
  assert.deepEqual(state.compiled.source.fields.map((field) => field.key), form.fieldKeys, `SCOPED_ASSERTION ${form.code} compiled field set/order`);
  assert.equal(state.compiled.source.fields.length, form.fieldKeys.length, `SCOPED_ASSERTION ${form.code} field count`);
  const text = sourceText(state.extract);
  assert.match(text, new RegExp(form.operative, "iu"), `SCOPED_ASSERTION ${form.code} operative phrase`);
  assert.match(text, new RegExp(form.legalBasis, "iu"), `SCOPED_ASSERTION ${form.code} legal basis`);
  assert.ok(form.documentType, `SCOPED_ASSERTION ${form.code} document type`);
}

function assertPresentationIdentity(form, state) {
  assert.match(state.profile, new RegExp(`templateCode:\\s*["']${form.code}["']`, "u"), `SCOPED_ASSERTION ${form.code} profile code`);
  assert.deepEqual(profileSections(state.profile), form.sectionIds, `SCOPED_ASSERTION ${form.code} section set/order`);
  assert.deepEqual(profileFields(state.profile), form.fieldKeys, `SCOPED_ASSERTION ${form.code} field set/order`);
  const descriptions = [...state.profile.matchAll(/description:\s*\n?\s*"([^"]*)"/gu)].map((match) => match[1]);
  assert.equal(descriptions.length, form.sectionIds.length * 2, `SCOPED_ASSERTION ${form.code} description count`);
  assert.ok(descriptions.every((description) => description.trim().length > 0), `SCOPED_ASSERTION ${form.code} non-empty descriptions`);
  for (const fieldKey of form.fieldKeys) {
    assert.match(state.profile, new RegExp(`^[ \\t]*["']${fieldKey.replaceAll(".", "\\.")}["']:\\s*\\{[\\s\\S]*?label:`, "mu"), `SCOPED_ASSERTION ${form.code} field override ${fieldKey}`);
  }
  assert.doesNotMatch(state.profile, /Field\s+\d+|\[GENERATED\]|auto-generated|safe synthetic demo|\(mẫu BM-\d{3}\)/iu, `SCOPED_ASSERTION ${form.code} forbidden markers`);
  const presentationIds = [...state.profile.matchAll(/^\s*id:\s*["']([^"']+)["']/gmu)].map((match) => match[1]);
  assert.deepEqual(presentationIds, form.sectionIds, `SCOPED_ASSERTION ${form.code} presentation section set/order`);
  assert.match(state.profile, /presentationSections:/u, `SCOPED_ASSERTION ${form.code} presentation layout`);
  assert.match(state.profile, /demo:\s*\{\}/u, `SCOPED_ASSERTION ${form.code} no fabricated demo`);
}

function assertProvenanceIdentity(form, state) {
  const rows = state.provenance ? state.provenance.split("\n").filter((line) => line.startsWith(`| ${form.code} |`)) : [];
  assert.equal(rows.length, 1, `SCOPED_ASSERTION ${form.code} effective provenance row count`);
  for (const value of [compiledPath(form), form.compiledSha, extractMdPath(form), form.extractMdSha, form.role, form.boundary]) {
    assert.ok(state.provenance.includes(value), `SCOPED_ASSERTION ${form.code} provenance value ${value}`);
  }
  for (const marker of ["fieldEvidenceMap", "confidenceByField", "family role=", "family boundary=", "runtimeReady=NOT_PROMOTED", "reviewedAt="]) {
  assert.ok(state.provenance.includes(marker), `SCOPED_ASSERTION ${form.code} provenance marker ${marker}`);
  }
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
  const after = JSON.stringify(state);
  assert.notEqual(after, before, `${form.code} mutation changes serialized state`);
  assert.throws(() => assertCanonical(form, state), /SCOPED_ASSERTION/u);
}

const mutationsFor = (form) => [
  (state) => { state.compiled.templateCode = form.code === "BM-212" ? "BM-213" : "BM-212"; },
  (state) => { state.compiled.title = "SIBLING_TITLE"; },
  (state) => { state.compiled.source.sections[0].id = "section-mutated"; },
  (state) => { state.compiled.source.fields.pop(); },
  (state) => { state.extract.detectedTitle = "SIBLING_TITLE"; },
  (state) => { state.extract.templateCode = form.code === "BM-212" ? "BM-213" : "BM-212"; },
  (state) => { state.profile = state.profile.replace("presentationSections:", "presentationSectionsBroken:"); },
  (state) => { state.profile = state.profile.replace(/description:\s*\n\s*"[^"]*"/u, 'description:\n      ""'); },
  (state) => { state.profile = state.profile.replace(/"agency\.name"/u, '"technical.agency"'); },
  (state) => { state.profile = state.profile.replace("demo: {}", "demo: { fabricated: \"demo\" }"); },
  (state) => { state.provenance = ""; },
  (state) => { state.provenance = state.provenance.replace(compiledPath(form), "wrong.compiled.json"); },
  (state) => { state.provenance = state.provenance.replace(/fieldEvidenceMap/gu, "fieldEvidenceRemoved"); },
  (state) => { state.provenance = state.provenance.replace(/confidenceByField/gu, "confidenceRemoved"); },
  (state) => { state.provenance = state.provenance.replace(/family role=/gu, "roleRemoved="); },
  (state) => { state.provenance = state.provenance.replace(/family boundary=/gu, "boundaryRemoved="); },
  (state) => { state.provenance = state.provenance.replace("runtimeReady=NOT_PROMOTED", "runtimeReady=PROMOTED"); },
  (state) => { state.provenance += `\n| ${form.code} | duplicate effective row`; },
];

describe("BM-212/BM-213 final semantic closure", { concurrency: false }, () => {
  for (const form of FORMS) {
    describe(form.code, () => {
      it("matches own document, presentation, and provenance identity", () => assertCanonical(form, canonicalState(form)));
      it("rejects the bounded identity mutation matrix", () => {
        const mutations = mutationsFor(form);
        const verdicts = mutations.map((mutate, mutationIndex) => {
          try {
            assertMutation(form, mutate);
            return "REJECTED";
          } catch (error) {
            throw new Error(`${form.code} mutation matrix defect [${mutationIndex}]: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
        assert.equal(verdicts.filter((verdict) => verdict === "REJECTED").length, mutations.length, `SCOPED_ASSERTION ${form.code} mutation rejection count`);
      });
    });
  }

  it("keeps BM-212 and BM-213 distinct despite numeric adjacency", () => {
    const bm212 = canonicalState(FORMS[0]);
    const bm213 = canonicalState(FORMS[1]);
    assert.doesNotMatch(bm212.profile, /biện pháp kỹ thuật để bảo vệ/iu, "SCOPED_ASSERTION BM-212 distinct role");
    assert.match(bm213.profile, /biện pháp kỹ thuật để bảo vệ/iu, "SCOPED_ASSERTION BM-213 technical-protection role");
    assert.match(bm212.provenance, /JUVENILE_GUIDANCE_SUPPORT_FAMILY/iu);
    assert.match(bm213.provenance, /JUVENILE_TECHNICAL_PROTECTION_FAMILY/iu);
  });
});
