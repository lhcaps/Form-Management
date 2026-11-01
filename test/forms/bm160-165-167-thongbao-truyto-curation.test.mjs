/**
 * BM-160/165/167 THÔNG BÁO TỐ TỤNG (truy tố stage) family curation
 * verification.
 *
 * Family: THÔNG BÁO TỐ TỤNG — procedural notices/records issued by
 * Viện kiểm sát during giai đoạn truy tố (folder
 * `05. GIAI DOAN TRUY TO`):
 *   - BM-160 = "Biên bản niêm yết công khai văn bản tố tụng"
 *     (Điều 140 BLTTHS, + Điều 243 nếu niêm yết Cáo trạng) — 2 fields, 1 section
 *   - BM-165 = "Thông báo về việc vụ án có bị can bị tạm giam"
 *     (Điều 42, Điều 244 BLTTHS) — 2 fields, 1 section
 *   - BM-167 = "Thông báo về việc trả hồ sơ, ban hành cáo trạng"
 *     (Điều 42, khoản 2 Điều 240 BLTTHS; Điều 2 Luật Tư pháp NCTN) —
 *     2 fields, 2 sections
 *
 * Family grouping rationale: all three are literal "Biên bản"/"Thông báo"
 * documents (not Quyết định/Yêu cầu) signed by KIỂM SÁT VIÊN in the truy
 * tố stage, each with a single trivial `section-thong-tin-bieu-mau`
 * (plus BM-167's second `section-thong-tin-van-ban`). Pre-patch the only
 * live audit issues were SECTION_DESCRIPTION_MISSING (all three) and, for
 * BM-167, CONTRACT_SECTION_UNREPRESENTED on `section-thong-tin-van-ban`
 * (profile omitted a compiled section entirely).
 *
 * Source contracts: docs/audit/docx/compiled-v2/BM-{160,165,167}.compiled.json
 * Source extracts:  docs/audit/docx/extracted/BM-{160,165,167}__*.extract.md
 *
 * Curation scope (allowed):
 *   - Section descriptions
 *   - Field labels/placeholders where they contradicted the compiled contract
 *   - Removal of fabricated demo data (BM-160 `document.soBien` held the
 *     fabricated name "Tran Van Binh" on a document-number field)
 *   - Adding the missing `section-thong-tin-van-ban` entry to BM-167
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled section IDs
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 *
 * Run: node --test test/forms/bm160-165-167-thongbao-truyto-curation.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const PROFILE_DIR = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux');
const PROVENANCE_LEDGER = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);

const FORMS = [
  {
    code: 'BM-160',
    title: 'Biên bản niêm yết công khai văn bản tố tụng',
    fieldCount: 2,
    sectionCount: 1,
    docLabel: 'BIÊN BẢN',
    opVerbToken: 'niêm yết công khai văn bản tố tụng',
  },
  {
    code: 'BM-165',
    title: 'Thông báo về việc vụ án có bị can bị tạm giam',
    fieldCount: 2,
    sectionCount: 1,
    docLabel: 'THÔNG BÁO',
    opVerbToken: 'vụ án có bị can bị tạm giam',
  },
  {
    code: 'BM-167',
    title: 'Thông báo về việc trả hồ sơ, ban hành cáo trạng',
    fieldCount: 2,
    sectionCount: 2,
    docLabel: 'THÔNG BÁO',
    opVerbToken: 'trả hồ sơ, ban hành cáo trạng',
  },
];

const EXTRACT_SHA = {
  'BM-160': '2f8e7c014448a2535a766099839cb6ab63d777e395125f243f358ec0ff0811ba',
  'BM-165': 'd391dc4d1ffb984a52692733b585663e29f9c5e6bf4351968a27df0fea59c8e6',
  'BM-167': '70817b32537007e44c54ea3bc839d75934f139e168101ae74d2ef50cd9473411',
};

const COMPILED_BY_CODE = Object.fromEntries(
  FORMS.map((form) => [
    form.code,
    JSON.parse(
      readFileSync(
        resolve(PROJECT_ROOT, `docs/audit/docx/compiled-v2/${form.code}.compiled.json`),
        'utf8',
      ),
    ),
  ]),
);

function profilePath(code) {
  return resolve(PROFILE_DIR, code.replace('BM-', 'bm') + '-runtime-ux-profile.ts');
}

function loadProfileSource(code) {
  return readFileSync(profilePath(code), 'utf8');
}

function loadProvenanceRow(code) {
  if (!existsSync(PROVENANCE_LEDGER)) return '';
  const ledger = readFileSync(PROVENANCE_LEDGER, 'utf-8');
  const match = ledger.match(new RegExp(`\\| ${code} \\|[^\\n]*`));
  return match ? match[0] : '';
}

function extractSections(source) {
  const out = [];
  const blockRegex = /\{\s*sectionId:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*\n?\s*"([^"]*)"/gu;
  let m;
  while ((m = blockRegex.exec(source)) !== null) {
    out.push({ sectionId: m[1], title: m[2], description: m[3] });
  }
  return out;
}

function loadProfileStub(code) {
  const source = loadProfileSource(code);
  const sections = extractSections(source);
  return {
    templateCode: code,
    runtimeReady: false,
    demo: {},
    sections,
    _source: source,
  };
}

// ============================================================
// SCOPED ASSERTIONS
// ============================================================

function assertDocumentIdentity(form, profile, row, compiled) {
  if (profile.templateCode !== form.code) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} templateCode mismatch`);
  }
  if (profile.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} must NOT be runtimeReady`);
  }
  if (compiled.templateCode !== form.code) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} compiled.templateCode mismatch`);
  }
  if (compiled.title !== form.title) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} compiled.title mismatch`);
  }
  if (compiled.source?.fields?.length !== form.fieldCount) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} compiled field count ${compiled.source?.fields?.length} != ${form.fieldCount}`);
  }
  if (compiled.source?.sections?.length !== form.sectionCount) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} compiled section count ${compiled.source?.sections?.length} != ${form.sectionCount}`);
  }
  if (!row) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance row missing`);
  }
  const expectedSha = EXTRACT_SHA[form.code];
  if (expectedSha && !row.includes(expectedSha)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must reference extract SHA ${expectedSha}`);
  }
  for (const [otherCode, otherSha] of Object.entries(EXTRACT_SHA)) {
    if (otherCode !== form.code && row.includes(otherSha)) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must not reference ${otherCode} extract SHA ${otherSha}`);
    }
  }
  if (!row.includes(form.docLabel)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} must keep ${form.docLabel} framing`);
  }
  if (!row.includes(form.opVerbToken)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must reference op-verb "${form.opVerbToken}"`);
  }
  for (const other of FORMS) {
    if (other.code !== form.code && row.includes(other.opVerbToken)) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must not contain ${other.code} op-verb "${other.opVerbToken}"`);
    }
  }
}

function assertSectionIdentity(form, profile, compiled) {
  const compiledSectionIds = (compiled.source?.sections ?? []).map((s) => s.id);
  const seen = new Set();
  for (const sec of profile.sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} section "${sec.sectionId}" has empty description`);
    }
    if (!compiledSectionIds.includes(sec.sectionId)) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} contains phantom section "${sec.sectionId}"`);
    }
    seen.add(sec.sectionId);
  }
  for (const id of compiledSectionIds) {
    if (!seen.has(id)) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} compiled section "${id}" unrepresented in profile`);
    }
  }
  const src = profile._source + ' ' + JSON.stringify(profile);
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} contains generated placeholder marker`);
  }
  if (/Tran Van Binh|Trần Văn Bình/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} contains fabricated demo name`);
  }
}﻿
// ============================================================
// SCOPED MUTATION MATRICES
// ============================================================

const BM160_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-165 (sibling)',
    mutate: (profile) => { profile.templateCode = 'BM-165'; },
    reason: 'BM-160 is Biên bản niêm yết — must not impersonate BM-165',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => { profile.runtimeReady = true; },
    reason: 'this batch does not promote runtimeReady',
  },
  {
    label: 'override compiled title to Thông báo (BM-167)',
    target: 'compiled',
    mutate: (compiled) => { compiled.title = 'Thông báo về việc trả hồ sơ, ban hành cáo trạng'; },
    reason: 'BM-160 is a Biên bản, not a Thông báo',
  },
];

const BM160_SECTION_MUTATIONS = [
  {
    label: 'drop section description (empty desc)',
    mutate: (profile) => {
      if (profile.sections?.[0]) profile.sections[0].description = '';
    },
    reason: 'section description must remain source-aligned',
  },
  {
    label: 'inject generated placeholder marker "(mẫu BM-160)"',
    mutate: (profile) => {
      if (profile.sections?.[0]) {
        profile.sections[0].description = `${profile.sections[0].description ?? ''} (mẫu BM-160)`;
      }
    },
    reason: 'no fabricated generated markers',
  },
  {
    label: 're-introduce fabricated demo "Tran Van Binh"',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'document.soBien': 'Tran Van Binh' };
    },
    reason: 'no fabricated demo values on document.soBien',
  },
];

const BM160_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-165 hash',
    mutate: (row) => row.replace(EXTRACT_SHA['BM-160'], EXTRACT_SHA['BM-165']),
    reason: 'provenance must reference BM-160 own extract SHA',
  },
  {
    label: 'rewrite op-verb to BM-165 sibling phrase',
    mutate: (row) => row.replace(/niêm yết công khai văn bản tố tụng/u, 'vụ án có bị can bị tạm giam'),
    reason: "BM-160 is niem-yet-cong-khai-van-ban-to-tung, not BM-165's op-verb",
  },
];

const BM165_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-167 (sibling)',
    mutate: (profile) => { profile.templateCode = 'BM-167'; },
    reason: 'BM-165 must not impersonate BM-167',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => { profile.runtimeReady = true; },
    reason: 'this batch does not promote runtimeReady',
  },
  {
    label: 'override compiled title to Biên bản niêm yết (BM-160)',
    target: 'compiled',
    mutate: (compiled) => { compiled.title = 'Biên bản niêm yết công khai văn bản tố tụng'; },
    reason: 'BM-165 is a Thông báo, not the BM-160 Biên bản',
  },
];

const BM165_SECTION_MUTATIONS = [
  {
    label: 'drop section description (empty desc)',
    mutate: (profile) => {
      if (profile.sections?.[0]) profile.sections[0].description = '';
    },
    reason: 'section description must remain source-aligned',
  },
  {
    label: 'inject generated placeholder marker "(mẫu BM-165)"',
    mutate: (profile) => {
      if (profile.sections?.[0]) {
        profile.sections[0].description = `${profile.sections[0].description ?? ''} (mẫu BM-165)`;
      }
    },
    reason: 'no fabricated generated markers',
  },
];

const BM165_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-167 hash',
    mutate: (row) => row.replace(EXTRACT_SHA['BM-165'], EXTRACT_SHA['BM-167']),
    reason: 'provenance must reference BM-165 own extract SHA',
  },
  {
    label: 'rewrite op-verb to BM-160 sibling phrase',
    mutate: (row) => row.replace(/vụ án có bị can bị tạm giam/u, 'niêm yết công khai văn bản tố tụng'),
    reason: "BM-165 is vu-an-co-bi-can-bi-tam-giam, not BM-160's op-verb",
  },
];

const BM167_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-160 (sibling)',
    mutate: (profile) => { profile.templateCode = 'BM-160'; },
    reason: 'BM-167 must not impersonate BM-160',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => { profile.runtimeReady = true; },
    reason: 'this batch does not promote runtimeReady',
  },
  {
    label: 'override compiled title to Thông báo tạm giam (BM-165)',
    target: 'compiled',
    mutate: (compiled) => { compiled.title = 'Thông báo về việc vụ án có bị can bị tạm giam'; },
    reason: 'BM-167 is "trả hồ sơ, ban hành cáo trạng" — not the BM-165 tạm-giam notice',
  },
];

const BM167_SECTION_MUTATIONS = [
  {
    label: 'drop section-thong-tin-van-ban entirely (phantom-missing)',
    mutate: (profile) => {
      profile.sections = profile.sections.filter((s) => s.sectionId !== 'section-thong-tin-van-ban');
    },
    reason: 'section-thong-tin-van-ban is a compiled section and must be represented',
  },
  {
    label: 'drop section-thong-tin-bieu-mau description (empty desc)',
    mutate: (profile) => {
      const sec = profile.sections.find((s) => s.sectionId === 'section-thong-tin-bieu-mau');
      if (sec) sec.description = '';
    },
    reason: 'section description must remain source-aligned',
  },
  {
    label: 'inject generated placeholder marker "(mẫu BM-167)"',
    mutate: (profile) => {
      const sec = profile.sections.find((s) => s.sectionId === 'section-thong-tin-van-ban');
      if (sec) sec.description = `${sec.description ?? ''} (mẫu BM-167)`;
    },
    reason: 'no fabricated generated markers',
  },
  {
    label: 'inject phantom section not in compiled contract',
    mutate: (profile) => {
      profile.sections.push({
        sectionId: 'section-phantom-not-in-contract',
        title: 'Phantom',
        description: 'Phantom section description.',
      });
    },
    reason: 'every profile section must reference an exact compiled section id',
  },
];

const BM167_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-160 hash',
    mutate: (row) => row.replace(EXTRACT_SHA['BM-167'], EXTRACT_SHA['BM-160']),
    reason: 'provenance must reference BM-167 own extract SHA',
  },
  {
    label: 'rewrite op-verb to BM-165 sibling phrase',
    mutate: (row) => row.replace(/trả hồ sơ, ban hành cáo trạng/u, 'vụ án có bị can bị tạm giam'),
    reason: "BM-167 is tra-ho-so-ban-hanh-cao-trang, not BM-165's op-verb",
  },
];

export const BM160_MUTATION_COUNT = {
  documentIdentity: BM160_DOCUMENT_IDENTITY_MUTATIONS.length,
  section: BM160_SECTION_MUTATIONS.length,
  provenance: BM160_PROVENANCE_MUTATIONS.length,
  get total() { return this.documentIdentity + this.section + this.provenance; },
};

export const BM165_MUTATION_COUNT = {
  documentIdentity: BM165_DOCUMENT_IDENTITY_MUTATIONS.length,
  section: BM165_SECTION_MUTATIONS.length,
  provenance: BM165_PROVENANCE_MUTATIONS.length,
  get total() { return this.documentIdentity + this.section + this.provenance; },
};

export const BM167_MUTATION_COUNT = {
  documentIdentity: BM167_DOCUMENT_IDENTITY_MUTATIONS.length,
  section: BM167_SECTION_MUTATIONS.length,
  provenance: BM167_PROVENANCE_MUTATIONS.length,
  get total() { return this.documentIdentity + this.section + this.provenance; },
};

export function assertMutationCounts() {
  assert.strictEqual(BM160_MUTATION_COUNT.documentIdentity, 3, 'BM-160 documentIdentity mutation count must be 3');
  assert.strictEqual(BM160_MUTATION_COUNT.section, 3, 'BM-160 section mutation count must be 3');
  assert.strictEqual(BM160_MUTATION_COUNT.provenance, 2, 'BM-160 provenance mutation count must be 2');
  assert.strictEqual(BM160_MUTATION_COUNT.total, 8, 'BM-160 total mutation count must be 8');

  assert.strictEqual(BM165_MUTATION_COUNT.documentIdentity, 3, 'BM-165 documentIdentity mutation count must be 3');
  assert.strictEqual(BM165_MUTATION_COUNT.section, 2, 'BM-165 section mutation count must be 2');
  assert.strictEqual(BM165_MUTATION_COUNT.provenance, 2, 'BM-165 provenance mutation count must be 2');
  assert.strictEqual(BM165_MUTATION_COUNT.total, 7, 'BM-165 total mutation count must be 7');

  assert.strictEqual(BM167_MUTATION_COUNT.documentIdentity, 3, 'BM-167 documentIdentity mutation count must be 3');
  assert.strictEqual(BM167_MUTATION_COUNT.section, 4, 'BM-167 section mutation count must be 4');
  assert.strictEqual(BM167_MUTATION_COUNT.provenance, 2, 'BM-167 provenance mutation count must be 2');
  assert.strictEqual(BM167_MUTATION_COUNT.total, 9, 'BM-167 total mutation count must be 9');
}﻿
// ============================================================
// TEST SUITE
// ============================================================

describe('BM-160/165/167 THÔNG BÁO TỐ TỤNG curation', { concurrency: false }, () => {

  for (const form of FORMS) {
    describe(form.code, () => {
      it(`${form.code} profile exists`, () => {
        assert.ok(existsSync(profilePath(form.code)), `${form.code} profile must exist`);
      });
      it(`${form.code} field count matches compiled`, () => {
        const compiled = COMPILED_BY_CODE[form.code];
        assert.strictEqual(compiled.source.fields.length, form.fieldCount);
      });
      it(`${form.code} section count matches compiled`, () => {
        const compiled = COMPILED_BY_CODE[form.code];
        assert.strictEqual(compiled.source.sections.length, form.sectionCount);
      });
      it(`${form.code} every section has a non-empty description`, () => {
        const profile = loadProfileStub(form.code);
        for (const sec of profile.sections) {
          assert.ok(sec.description && sec.description.trim().length > 0, `${form.code} section "${sec.sectionId}" description must be non-empty`);
        }
      });
      it(`${form.code} every compiled section id is represented exactly once in the profile`, () => {
        const compiled = COMPILED_BY_CODE[form.code];
        const profile = loadProfileStub(form.code);
        const compiledSectionIds = compiled.source.sections.map((s) => s.id);
        const profileSectionIds = profile.sections.map((s) => s.sectionId);
        assert.deepStrictEqual(
          [...profileSectionIds].sort(),
          [...compiledSectionIds].sort(),
          `${form.code} profile sections must exactly match compiled sections`,
        );
      });
      it(`${form.code} contains no fabricated demo data`, () => {
        const source = loadProfileSource(form.code);
        assert.ok(!/Tran Van Binh|Trần Văn Bình/iu.test(source), `${form.code} must not contain fabricated demo name`);
      });
      it(`${form.code} contains no generated placeholder marker`, () => {
        const source = loadProfileSource(form.code);
        assert.ok(!/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(source), `${form.code} must not contain generated placeholder marker`);
      });
    });
  }

  describe('Family-level', () => {
    it('BM-160 is a Biên bản; BM-165 and BM-167 are Thông báo', () => {
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-160').docLabel, 'BIÊN BẢN');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-165').docLabel, 'THÔNG BÁO');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-167').docLabel, 'THÔNG BÁO');
    });
    it('BM-160 extract references Điều 140 BLTTHS', () => {
      const ext = readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/extracted/BM-160__2f8e7c014448.extract.md'),
        'utf8',
      );
      assert.ok(ext.includes('Điều 140'), 'BM-160 extract must reference Điều 140');
    });
    it('BM-165 extract references Điều 42 and Điều 244 BLTTHS', () => {
      const ext = readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/extracted/BM-165__d391dc4d1ffb.extract.md'),
        'utf8',
      );
      assert.ok(ext.includes('Điều 42') && ext.includes('Điều 244'), 'BM-165 extract must reference Điều 42 and Điều 244');
    });
    it('BM-167 extract references Điều 42, Điều 240 BLTTHS and Điều 2 Luật Tư pháp NCTN', () => {
      const ext = readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/extracted/BM-167__70817b325370.extract.md'),
        'utf8',
      );
      assert.ok(ext.includes('Điều 42') && ext.includes('Điều 240'), 'BM-167 extract must reference Điều 42 and Điều 240');
      assert.ok(ext.includes('Luật Tư pháp người chưa thành niên'), 'BM-167 extract must reference Luật Tư pháp NCTN');
    });
  });

  describe('BM-160/165/167 mutation matrix counts', () => {
    it('mutation counts are exact', () => assertMutationCounts());
  });

  // ============================================================
  // SCOPED MUTATION MATRIX EXECUTION
  // ============================================================

  const FAMILY_MATRICES = [
    { code: 'BM-160', documentIdentity: BM160_DOCUMENT_IDENTITY_MUTATIONS, section: BM160_SECTION_MUTATIONS, provenance: BM160_PROVENANCE_MUTATIONS },
    { code: 'BM-165', documentIdentity: BM165_DOCUMENT_IDENTITY_MUTATIONS, section: BM165_SECTION_MUTATIONS, provenance: BM165_PROVENANCE_MUTATIONS },
    { code: 'BM-167', documentIdentity: BM167_DOCUMENT_IDENTITY_MUTATIONS, section: BM167_SECTION_MUTATIONS, provenance: BM167_PROVENANCE_MUTATIONS },
  ];

  for (const { code, documentIdentity, section, provenance } of FAMILY_MATRICES) {
    describe(`${code} mutation matrix execution`, () => {
      const form = FORMS.find((f) => f.code === code);
      for (const { label, mutate, reason, target } of documentIdentity) {
        it(`documentIdentity: ${label}`, () => {
          const profile = loadProfileStub(code);
          const compiled = JSON.parse(JSON.stringify(COMPILED_BY_CODE[code]));
          const row = loadProvenanceRow(code);
          assert.throws(
            () => {
              if (target === 'compiled') {
                mutate(compiled, profile);
              } else {
                mutate(profile, compiled);
              }
              assertDocumentIdentity(form, profile, row, compiled);
            },
            (err) => /SCOPED_ASSERTION/u.test(err.message),
            `expected SCOPED_ASSERTION — ${reason}`,
          );
        });
      }
      for (const { label, mutate, reason } of section) {
        it(`section: ${label}`, () => {
          const profile = loadProfileStub(code);
          const compiled = JSON.parse(JSON.stringify(COMPILED_BY_CODE[code]));
          assert.throws(
            () => {
              mutate(profile, compiled);
              assertSectionIdentity(form, profile, compiled);
            },
            (err) => /SCOPED_ASSERTION/u.test(err.message),
            `expected SCOPED_ASSERTION — ${reason}`,
          );
        });
      }
      for (const { label, mutate, reason } of provenance) {
        it(`provenance: ${label}`, () => {
          const profile = loadProfileStub(code);
          const compiled = JSON.parse(JSON.stringify(COMPILED_BY_CODE[code]));
          const row = loadProvenanceRow(code);
          assert.throws(
            () => {
              const mutated = mutate(row);
              assertDocumentIdentity(form, profile, mutated, compiled);
            },
            (err) => /SCOPED_ASSERTION/u.test(err.message),
            `expected SCOPED_ASSERTION — ${reason}`,
          );
        });
      }
    });
  }

});