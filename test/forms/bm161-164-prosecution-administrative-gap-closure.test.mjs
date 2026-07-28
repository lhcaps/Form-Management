/**
 * Scoped contract, presentation, and provenance guards for BM-161--BM-164.
 * These profiles remain presentation-curated only: none are runtimeReady.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const PROVENANCE_PATH = join(ROOT, "docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md");
const PROVENANCE_LEDGER = readFileSync(PROVENANCE_PATH, "utf8");

// BM-162/BM-163 are a legally distinct appearance-request pair (voluntary
// invitation vs mandatory summons); BM-161/BM-164 are isolated singletons.
// Sibling selection must stay inside the correct semantic scope (9.3.G).
const SIBLING = { "BM-161": "BM-164", "BM-162": "BM-163", "BM-163": "BM-162", "BM-164": "BM-161" };

const FORM_SPECS = {
  "BM-161": {
    title: "Phiếu yêu cầu trích xuất", extractHeading: "Phiếu yêu cầu trích xuất", fields: 8,
    extract: "BM-161__5c910ef4adf5.extract.json", legalText: "Căn cứ Điều 159",
    operativePhrase: "Đề nghị cơ sở giam giữ",
    requiredLabel: "Tên Viện Kiểm sát", forbiddenSections: ["section-co-quan-ban-hanh", "section-nguoi-bi-trich-xuat"],
    hasExplicitLegalBasis: true,
    fieldEvidence: { field: "agency.vienKiem", classification: "CONTRACT_ONLY_NO_DOCX_SLOT / LOW" },
    provenance: ["agency.vienKiem\u2192P0001", "Field evidence"],
  },
  "BM-162": {
    title: "Giấy mời", extractHeading: "Giấy mời", fields: 8,
    extract: "BM-162__6e7e16348066.extract.json", legalText: "Kính mời",
    operativePhrase: "Kính mời ông/bà",
    requiredLabel: "Tên Viện Kiểm sát", forbiddenSections: ["section-thong-tin-ca-nhan"],
    hasExplicitLegalBasis: false,
    fieldEvidence: { field: "agency.vienKiem", classification: "CONTRACT_ONLY_NO_DOCX_SLOT / LOW" },
    provenance: ["agency.vienKiem\u2192P0002", "Kính mời"],
    distinguishingPhrase: "**Kính mời**",
  },
  "BM-163": {
    title: "Giấy triệu tập", extractHeading: "Giấy triệu tập", fields: 11,
    extract: "BM-163__61941122b9e4.extract.json", legalText: "Yêu cầu",
    operativePhrase: "Yêu cầu ông/bà",
    requiredLabel: "Tên Viện Kiểm sát", forbiddenSections: ["section-thong-tin-ca-nhan", "section-vu-an"],
    hasExplicitLegalBasis: false,
    fieldEvidence: { field: "agency.vienKiem", classification: "CONTRACT_ONLY_NO_DOCX_SLOT / LOW" },
    provenance: ["agency.vienKiem\u2192P0002", "Yêu cầu"],
    distinguishingPhrase: "**Yêu cầu**",
  },
  "BM-164": {
    title: "BB giao nhận Cáo trạng, QĐ truy tố theo thủ tục rút gọn, QĐ tạm đình chỉ vụ án, đình chỉ vụ án",
    extractHeading: "BB giao nhận Cáo trạng, QĐ truy tố theo thủ tục rút gọn, QĐ tạm đình chỉ vụ án, đình chỉ vụ án",
    fields: 9,
    extract: "BM-164__04fa37dd8384.extract.json", legalText: "Điều 60",
    operativePhrase: "Tiến hành lập biên bản giao, nhận",
    requiredLabel: "Tên Viện Kiểm sát", forbiddenSections: ["section-co-quan-va-nguoi-giao-nhan"],
    hasExplicitLegalBasis: true,
    fieldEvidence: { field: "document.loaiVanBan", classification: "FOOTNOTE / MEDIUM" },
    provenance: ["document.loaiVanBan\u2192P0015+footnote3", "Field evidence"],
  },
};

function loadProfile(code) {
  const source = readFileSync(join(ROOT, `apps/web/src/lib/runtime-ux/${code.toLowerCase().replace("-", "")}-runtime-ux-profile.ts`), "utf8");
  const expression = source
    .replace(/import\s+\{[\s\S]*?\}\s+from\s+"\.\/runtime-ux-profile";\s*/, "")
    .replace(/\s+as const/g, "")
    .replace(/: RuntimeUxProfile/g, "")
    .replace(/registerRuntimeUxProfile\([^;]+\);/, "");
  const variable = `${code.replace("-", "")}_RUNTIME_UX_PROFILE`;
  return new Function(`${expression}\nreturn ${variable};`)();
}

const LIVE_CACHE = new Map();

function loadLive(code) {
  const cached = LIVE_CACHE.get(code);
  if (cached) return structuredClone(cached);
  const spec = FORM_SPECS[code];
  const compiledPath = join(ROOT, `docs/audit/docx/compiled-v2/${code}.compiled.json`);
  const extractPath = join(ROOT, "docs/audit/docx/extracted", spec.extract);
  const live = {
    profile: loadProfile(code),
    compiled: JSON.parse(readFileSync(compiledPath, "utf8")),
    extract: JSON.parse(readFileSync(extractPath, "utf8")),
    paths: { compiledPath, extractPath },
    provenance: provenanceRow(code),
  };
  LIVE_CACHE.set(code, live);
  return structuredClone(live);
}

function provenanceRow(code) {
  return PROVENANCE_LEDGER.split(/\r?\n/).find((line) => line.startsWith(`| ${code} |`)) ?? "";
}

function scoped(condition, message) {
  assert.ok(condition, `SCOPED_ASSERTION: ${message}`);
}

function normalized(value) {
  return String(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertDocumentIdentity(code, { compiled, extract, paths }) {
  const spec = FORM_SPECS[code];
  scoped(compiled.templateCode === code, `${code} templateCode`);
  scoped(compiled.title.includes(spec.title), `${code} compiled title`);
  scoped(compiled.source.fields.length === spec.fields, `${code} compiled field count`);
  scoped(extract.templateCode === code, `${code} extract templateCode`);
  scoped(normalized(extract.detectedTitle).includes(normalized(spec.extractHeading)), `${code} extract heading`);
  scoped(extract.textBlocks.some((block) => block.text.includes(spec.operativePhrase)), `${code} operative phrase`);
  if (spec.hasExplicitLegalBasis) {
    scoped(extract.textBlocks.some((block) => block.text.includes(spec.legalText)), `${code} explicit legal basis`);
  } else {
    scoped(!extract.textBlocks.some((block) => /Điều\s*\d+/.test(block.text)), `${code} no explicit statutory citation in own source`);
    scoped(extract.textBlocks.some((block) => block.text.includes(spec.legalText)), `${code} operative/legal text`);
  }
  scoped(paths.compiledPath.endsWith(`${code}.compiled.json`), `${code} compiled path`);
  scoped(paths.extractPath.endsWith(spec.extract), `${code} extract path`);
  scoped(/^[a-f0-9]{64}$/.test(compiled.templateHash) && compiled.templateHash !== "0".repeat(64), `${code} compiled SHA`);
  scoped(/^[a-f0-9]{64}$/.test(extract.sha256) && extract.sha256 !== "0".repeat(64), `${code} extract SHA`);
}

function assertPresentationIdentity(code, { profile, compiled }) {
  const spec = FORM_SPECS[code];
  const compiledKeys = compiled.source.fields.map((field) => field.key);
  const profileKeys = Object.keys(profile.fields);
  scoped(profile.templateCode === code, `${code} profile templateCode`);
  scoped(profile.sections.length === compiled.source.sections.length, `${code} section count`);
  scoped(compiledKeys.length === spec.fields, `${code} contract field count matches spec.fields`);
  scoped(profileKeys.length === spec.fields, `${code} profile field count matches spec.fields`);
  scoped(profile.sections.every((section) => section.description?.trim().length >= 3), `${code} non-empty section descriptions`);
  scoped(profile.sections.every((section) => compiled.source.sections.some((compiledSection) => compiledSection.id === section.sectionId)), `${code} compiled section IDs`);
  scoped(profileKeys.every((key) => compiledKeys.includes(key)), `${code} contract field membership`);
  // 9.3.E: `new Set(keys).size === keys.length` is always true for an object's
  // own keys and proves nothing about duplication. The real invariant is an
  // exact one-to-one key set between the profile and the compiled contract.
  scoped(
    profileKeys.length === compiledKeys.length &&
      new Set(profileKeys).size === new Set(compiledKeys).size &&
      compiledKeys.every((key) => profileKeys.includes(key)),
    `${code} exact one-to-one field set (no duplicate/outside-contract mapping)`,
  );
  // 9.3.D: field order lives in the canonical presentation assertion, not in
  // a mutation-only side callback.
  scoped(JSON.stringify(profileKeys) === JSON.stringify(compiledKeys), `${code} field order`);
  // 9.3.C: requiredLabel must actually be asserted against the curated profile.
  scoped(
    Object.values(profile.fields).some((field) => normalized(field.label).includes(normalized(spec.requiredLabel))),
    `${code} required curated label`,
  );
  scoped(Object.values(profile.fields).every((field) => field.label !== "Field 1" && !field.label.includes("[GENERATED]")), `${code} curated labels`);
  scoped(Object.keys(profile.demo).every((key) => key in profile.fields), `${code} demo keys`);
  scoped(!Object.values(profile.demo).some((value) => String(value).includes("[GENERATED]")), `${code} generated marker`);
  scoped(spec.forbiddenSections.every((id) => !profile.sections.some((section) => section.sectionId === id)), `${code} no phantom sections`);
}

function toPosixPath(value) {
  return value.split("\\").join("/");
}

function assertProvenanceIdentity(code, { provenance, profile, paths, extract }) {
  const spec = FORM_SPECS[code];
  scoped(Boolean(provenance), `${code} provenance row exists`);
  scoped(provenance.startsWith(`| ${code} |`), `${code} provenance row is the single canonical row for this code`);
  const compiledRelPath = toPosixPath(paths.compiledPath).slice(toPosixPath(paths.compiledPath).indexOf("docs/"));
  const extractRelPath = toPosixPath(paths.extractPath).slice(toPosixPath(paths.extractPath).indexOf("docs/"));
  scoped(provenance.includes(compiledRelPath), `${code} provenance compiled path`);
  scoped(provenance.includes(extractRelPath), `${code} provenance extract path`);
  // Ledger convention (cross-checked against BM-159/160/165/167/169): the
  // compiled SHA is the raw file hash of compiled.json; the extract SHA is
  // the extract JSON's own `sha256` field (the source .doc/.docx hash it
  // carries forward), not a hash of the extract JSON file's bytes.
  const compiledFileHash = createHash("sha256").update(readFileSync(paths.compiledPath)).digest("hex");
  const extractSourceHash = extract.sha256;
  scoped(new RegExp(`${escapeRegExp(compiledRelPath)}.{0,10}sha256=${escapeRegExp(compiledFileHash)}`).test(provenance), `${code} provenance compiled SHA`);
  scoped(new RegExp(`${escapeRegExp(extractRelPath)}.{0,10}sha256=${escapeRegExp(extractSourceHash)}`).test(provenance), `${code} provenance extract SHA`);
  scoped(provenance.includes("fieldEvidenceMap") || provenance.includes("Field evidence"), `${code} field evidence map`);
  scoped(provenance.includes("confidenceByField"), `${code} confidence map`);
  scoped(provenance.includes("Semantic distinction") || provenance.includes("Isolated singleton"), `${code} semantic scope`);
  scoped(provenance.includes("CURATION, reviewed"), `${code} review/source identity marker present`);
  // 9.3.G: the singleton/pair boundary must be stated explicitly and must
  // match this code's actual scope (BM-161/BM-164 isolated; BM-162/BM-163 paired).
  const isPaired = code === "BM-162" || code === "BM-163";
  scoped(
    isPaired ? provenance.includes("Paired with") : provenance.includes("Isolated singleton"),
    `${code} singleton/pair boundary marker present`,
  );
  for (const required of spec.provenance) scoped(provenance.includes(required), `${code} provenance ${required}`);
  // 9.3.I: field-evidence classification for the locked field must be present
  // verbatim and must not have been silently promoted to a higher-confidence tier.
  const evidencePattern = new RegExp(
    `${escapeRegExp(spec.fieldEvidence.field)}\u2192[^()]*\\(${escapeRegExp(spec.fieldEvidence.classification)}\\b`,
  );
  scoped(evidencePattern.test(provenance), `${code} ${spec.fieldEvidence.field} field-evidence classification`);
  const evidenceClauseMatch = provenance.match(new RegExp(`${escapeRegExp(spec.fieldEvidence.field)}\u2192[^;]*`));
  scoped(!/DIRECT_SLOT\s*\/\s*HIGH/.test(evidenceClauseMatch?.[0] ?? ""), `${code} ${spec.fieldEvidence.field} not promoted to DIRECT_SLOT/HIGH`);
  // 9.3.H: BM-162/BM-163 own source has no explicit statutory citation; the
  // provenance row must not fabricate one.
  if (!spec.hasExplicitLegalBasis) {
    scoped(!/literalLegalBasis\*\*=Căn cứ Điều\s*\d+/.test(provenance), `${code} no fabricated legal basis`);
  }
  // 9.3.J: runtimeReady guard must require the exact NOT_PROMOTED marker and
  // reject every promoted/ready/true/promotion variant, not just one literal string.
  scoped(/runtimeReady=NOT_PROMOTED\b/.test(provenance), `${code} runtimeReady=NOT_PROMOTED marker present`);
  scoped(!/runtimeReady=(PROMOTED|READY|true)\b/i.test(provenance), `${code} runtimeReady not promoted/ready/true`);
  scoped(!/runtimeReady promotion/i.test(provenance), `${code} no runtimeReady promotion phrase`);
  if (spec.distinguishingPhrase) {
    scoped(provenance.includes(spec.distinguishingPhrase), `${code} distinguishing phrase (invitation vs summons semantics)`);
  }
  scoped(profile.templateCode === code, `${code} profile belongs to provenance row`);
}

function mutation(label, actual, mutate, assertion) {
  const changed = structuredClone(actual);
  mutate(changed);
  // 9.3.A: assert.notDeepStrictEqual ignores object key order, so an
  // order-only mutation (e.g. reversing field order) would falsely read as
  // a no-op. Compare JSON serializations instead: they preserve insertion
  // order for plain-object keys, so both value and order changes are caught.
  assert.notStrictEqual(JSON.stringify(changed), JSON.stringify(actual), `MUTATION_NO_OP: ${label}`);
  assert.throws(() => assertion(changed), /SCOPED_ASSERTION/, label);
}

for (const code of Object.keys(FORM_SPECS)) {
  describe(`${code} scoped identity and mutation matrix`, () => {
    test("live document, presentation, and provenance identity", () => {
      const live = loadLive(code);
      assertDocumentIdentity(code, live);
      assertPresentationIdentity(code, live);
      assertProvenanceIdentity(code, live);
    });

    test("document mutation matrix", () => {
      const live = loadLive(code);
      const sibling = SIBLING[code];
      const siblingSpec = FORM_SPECS[sibling];
      mutation("wrong templateCode", live, (x) => { x.compiled.templateCode = sibling; }, (x) => assertDocumentIdentity(code, x));
      mutation("wrong compiled title", live, (x) => { x.compiled.title = siblingSpec.title; }, (x) => assertDocumentIdentity(code, x));
      mutation("wrong extract templateCode", live, (x) => { x.extract.templateCode = sibling; }, (x) => assertDocumentIdentity(code, x));
      mutation("wrong extract heading", live, (x) => { x.extract.detectedTitle = siblingSpec.extractHeading; }, (x) => assertDocumentIdentity(code, x));
      mutation("sibling compiled path", live, (x) => { x.paths.compiledPath = x.paths.compiledPath.replace(code, sibling); }, (x) => assertDocumentIdentity(code, x));
      mutation("sibling extract path", live, (x) => { x.paths.extractPath = x.paths.extractPath.replace(code, sibling); }, (x) => assertDocumentIdentity(code, x));
      mutation("wrong compiled SHA", live, (x) => { x.compiled.templateHash = "0".repeat(64); }, (x) => assertDocumentIdentity(code, x));
      mutation("wrong extract SHA", live, (x) => { x.extract.sha256 = "0".repeat(64); }, (x) => assertDocumentIdentity(code, x));
      mutation("wrong operative phrase/role", live, (x) => { x.extract.textBlocks = x.extract.textBlocks.filter((block) => !block.text.includes(FORM_SPECS[code].operativePhrase)); }, (x) => assertDocumentIdentity(code, x));
      if (FORM_SPECS[code].hasExplicitLegalBasis) {
        mutation("wrong explicit legal basis", live, (x) => { x.extract.textBlocks = x.extract.textBlocks.filter((block) => !block.text.includes(FORM_SPECS[code].legalText)); }, (x) => assertDocumentIdentity(code, x));
      }
      if (code === "BM-162" || code === "BM-163") {
        mutation("invitation/summons title swap", live, (x) => { x.compiled.title = siblingSpec.title; }, (x) => assertDocumentIdentity(code, x));
        mutation("operative phrase swap", live, (x) => {
          x.extract.textBlocks = x.extract.textBlocks.map((block) => block.text.includes(FORM_SPECS[code].operativePhrase.split(" ")[0])
            ? { ...block, text: block.text.replace(FORM_SPECS[code].operativePhrase.split(" ")[0], siblingSpec.operativePhrase.split(" ")[0]) }
            : block);
        }, (x) => assertDocumentIdentity(code, x));
      }
    });

    test("presentation mutation matrix", () => {
      const live = loadLive(code);
      mutation("phantom section", live, (x) => { x.profile.sections.push({ sectionId: "section-phantom", title: "Phantom", description: "phantom" }); }, (x) => assertPresentationIdentity(code, x));
      mutation("wrong compiled section ID", live, (x) => { x.profile.sections[0].sectionId = "section-wrong"; }, (x) => assertPresentationIdentity(code, x));
      mutation("missing section", live, (x) => { x.profile.sections = []; }, (x) => assertPresentationIdentity(code, x));
      mutation("outside-contract field", live, (x) => { x.profile.fields["outside.contract"] = { label: "Outside", placeholder: "Outside" }; }, (x) => assertPresentationIdentity(code, x));
      mutation("missing contract field", live, (x) => { delete x.profile.fields[Object.keys(x.profile.fields)[0]]; }, (x) => assertPresentationIdentity(code, x));
      mutation("semantic duplicate mapping", live, (x) => {
        const firstKey = Object.keys(x.profile.fields)[0];
        const lastEntry = structuredClone(x.profile.fields[firstKey]);
        delete x.profile.fields[Object.keys(x.profile.fields).at(-1)];
        x.profile.fields[firstKey + ".duplicate"] = lastEntry;
      }, (x) => assertPresentationIdentity(code, x));
      mutation("wrong field order", live, (x) => { x.profile.fields = Object.fromEntries(Object.entries(x.profile.fields).reverse()); }, (x) => assertPresentationIdentity(code, x));
      mutation("required label removed", live, (x) => {
        for (const field of Object.values(x.profile.fields)) {
          if (normalized(field.label).includes(normalized(FORM_SPECS[code].requiredLabel))) field.label = "Generic label";
        }
      }, (x) => assertPresentationIdentity(code, x));
      mutation("generic Field 1 label", live, (x) => { Object.values(x.profile.fields)[0].label = "Field 1"; }, (x) => assertPresentationIdentity(code, x));
      mutation("generated marker in label", live, (x) => { Object.values(x.profile.fields)[0].label += " [GENERATED]"; }, (x) => assertPresentationIdentity(code, x));
      mutation("generated marker in demo", live, (x) => { x.profile.demo[Object.keys(x.profile.demo)[0]] = "[GENERATED]"; }, (x) => assertPresentationIdentity(code, x));
      mutation("fabricated demo key", live, (x) => { x.profile.demo["fabricated.demo"] = "not a contract field"; }, (x) => assertPresentationIdentity(code, x));
      mutation("demo key outside fields", live, (x) => { x.profile.demo["outside.demo.key"] = "orphan"; }, (x) => assertPresentationIdentity(code, x));
      mutation("empty section description", live, (x) => { x.profile.sections[0].description = ""; }, (x) => assertPresentationIdentity(code, x));
    });

    test("provenance mutation matrix", () => {
      const live = loadLive(code);
      const requireProvenance = (provenance) => assertProvenanceIdentity(code, { ...live, provenance });
      mutation("missing provenance row", { provenance: live.provenance }, (x) => { x.provenance = ""; }, (x) => requireProvenance(x.provenance));
      mutation("sibling compiled path", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace(`${code}.compiled.json`, `${SIBLING[code]}.compiled.json`); }, (x) => requireProvenance(x.provenance));
      mutation("sibling extract path", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace(FORM_SPECS[code].extract, FORM_SPECS[SIBLING[code]].extract); }, (x) => requireProvenance(x.provenance));
      mutation("wrong compiled SHA", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace(/compiled\.json`\s*\(sha256=[a-f0-9]{64}/, (m) => m.replace(/[a-f0-9]{64}$/, "0".repeat(64))); }, (x) => requireProvenance(x.provenance));
      mutation("wrong extract SHA", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace(/extract\.json`\s*\(sha256=[a-f0-9]{64}/, (m) => m.replace(/[a-f0-9]{64}$/, "0".repeat(64))); }, (x) => requireProvenance(x.provenance));
      mutation("fieldEvidenceMap removed", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace("Field evidence", "Evidence removed"); }, (x) => requireProvenance(x.provenance));
      mutation("confidenceByField removed", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace("confidenceByField", "confidence removed"); }, (x) => requireProvenance(x.provenance));
      mutation("semantic scope removed", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace(/Semantic distinction|Isolated singleton/, "scope removed"); }, (x) => requireProvenance(x.provenance));
      mutation("singleton/pair boundary removed", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace(/Paired with|Isolated singleton/, "boundary removed"); }, (x) => requireProvenance(x.provenance));
      mutation(`${FORM_SPECS[code].fieldEvidence.field} promoted to DIRECT_SLOT/HIGH`, { provenance: live.provenance }, (x) => {
        const classification = FORM_SPECS[code].fieldEvidence.classification;
        x.provenance = x.provenance.replace(new RegExp(escapeRegExp(classification)), "DIRECT_SLOT/HIGH");
      }, (x) => requireProvenance(x.provenance));
      mutation("runtimeReady promoted", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace("runtimeReady=NOT_PROMOTED", "runtimeReady=PROMOTED"); }, (x) => requireProvenance(x.provenance));
      mutation("review/source identity removed where present", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace("CURATION, reviewed", "removed"); }, (x) => requireProvenance(x.provenance));
      if (code === "BM-162" || code === "BM-163") {
        mutation("BM-162/BM-163 fabricated legal basis", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace("**literalLegalBasis**=", "**literalLegalBasis**=Căn cứ Điều 999 của Bộ luật Tố tụng hình sự; "); }, (x) => requireProvenance(x.provenance));
        mutation("BM-162/BM-163 distinction removed", { provenance: live.provenance }, (x) => { x.provenance = x.provenance.replace(FORM_SPECS[code].distinguishingPhrase, "removed"); }, (x) => requireProvenance(x.provenance));
      }
    });
  });
}
