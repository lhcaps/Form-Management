/**
 * BM-166 / BM-168 frontier-leap gap closure verification.
 *
 * Scope: two isolated singletons, NOT a legal family. They are numerically
 * adjacent but govern unrelated workflows with disjoint field namespaces:
 *   - BM-166 = "QĐ trả hồ sơ vụ án để điều tra lại"
 *     (Điều 41, 174 BLTTHS) — 14 fields, 5 sections, `returnInvestigation.*`
 *   - BM-168 = "BB giao nhận hồ sơ vụ án, vụ việc"
 *     (no explicit statutory citation; factual handover record) —
 *     14 fields, 2 sections, `caseFileHandover.*`
 *
 * Boundary rule: BM-166 is a QUYẾT ĐỊNH (decision) resolved by a court
 * ordering re-investigation. BM-168 is a BIÊN BẢN (record) documenting a
 * physical case-file handover between two custodians. No shared legal
 * basis, no shared operative phrase, no shared field namespace.
 *
 * Source contracts: docs/audit/docx/compiled-v2/BM-{166,168}.compiled.json
 * Source extracts:  docs/audit/docx/extracted/BM-{166,168}__*.extract.md
 *
 * Curation scope (allowed):
 *   - Section descriptions
 *   - Phantom section id corrections:
 *       BM-166: section-noi-dung-quyet-dinh ('đ') → section-noi-dung-quyet-inh ('i')
 *       BM-168: section-co-quan / section-ben-giao-va-ben-nhan /
 *               section-thong-tin-ho-so / section-thoi-gian
 *               → section-co-quan-va-van-ban / section-bien-ban-ban-giao
 *   - BM-166 legal-basis/title drift correction: profile previously framed
 *     the form as "điều tra bổ sung" (supplementary investigation) with
 *     legal basis "Điều 245 và Điều 247"; corrected to the DOCX-verbatim
 *     "để điều tra lại" (re-investigation) framing and "Điều 41 và Điều 174".
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled section IDs (must remain canonical)
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 *
 * Run: node --test test/forms/bm166-168-frontier-leap-gap-closure.test.mjs
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
    code: 'BM-166',
    title: 'QĐ trả hồ sơ vụ án để điều tra lại',
    fieldCount: 14,
    sectionCount: 5,
    docLabel: 'QUYẾT ĐỊNH',
    opVerbToken: 'TRẢ HỒ SƠ VỤ ÁN ĐỂ ĐIỀU TRA LẠI',
    legalArticles: 'Điều 41 và Điều 174',
  },
  {
    code: 'BM-168',
    title: 'BB giao nhận hồ sơ vụ án, vụ việc',
    fieldCount: 14,
    sectionCount: 2,
    docLabel: 'BIÊN BẢN',
    opVerbToken: 'Giao, nhận hồ sơ vụ việc/vụ án',
    legalArticles: null,
  },
];

const EXTRACT_SHA = {
  'BM-166': 'd0762a0ffb28db2c90da893f7b1b859052602e42aac54c2d18990ebb702e3451',
  'BM-168': '3369df5870b270e722bbf4bf395ecb7db79b2fe8e65b9674033916f09cb0540f',
};

// Phantom section ids that an earlier cursor turn erroneously produced.
// They must NOT appear in any profile source.
const PHANTOM_SECTION_IDS = {
  'BM-166': ['section-noi-dung-quyet-dinh'],
  'BM-168': [
    'section-co-quan',
    'section-ben-giao-va-ben-nhan',
    'section-thong-tin-ho-so',
    'section-thoi-gian',
  ],
};

// Compiled-contract section ids (canonical). Source files may only use these.
const CANONICAL_SECTION_IDS = {
  'BM-166': [
    'section-co-quan-va-van-ban',
    'section-can-cu-phap-ly',
    'section-noi-dung-quyet-inh',
    'section-noi-nhan',
    'section-chu-ky',
  ],
  'BM-168': ['section-co-quan-va-van-ban', 'section-bien-ban-ban-giao'],
};

// Legacy legal-basis / framing tokens that the pre-patch profile emitted.
// They must not appear in the current BM-166 profile.
const BM166_LEGACY_TOKENS = ['Điều 245', 'Điều 247', 'điều tra bổ sung'];

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
  return resolve(PROFILE_DIR, code.replace('BM-', 'bm').replace('-', '') + '-runtime-ux-profile.ts');
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
  const blockRegex =
    /\{\s*sectionId:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]*)"/gu;
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
// SCOPED ASSERTIONS — assertDocumentIdentity / assertPresentationIdentity /
// assertProvenanceIdentity, as required by the frontier-leap gap-closure
// contract for BM-166/BM-168.
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
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} compiled field count ${compiled.source?.fields?.length} != ${form.fieldCount}`,
    );
  }
  if (compiled.source?.sections?.length !== form.sectionCount) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} compiled section count ${compiled.source?.sections?.length} != ${form.sectionCount}`,
    );
  }
  if (!row) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance row missing`);
  }
  const expectedSha = EXTRACT_SHA[form.code];
  if (expectedSha && !row.includes(expectedSha)) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} provenance must reference extract SHA ${expectedSha}`,
    );
  }
  for (const [otherCode, otherSha] of Object.entries(EXTRACT_SHA)) {
    if (otherCode !== form.code && row.includes(otherSha)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance must not reference ${otherCode} extract SHA ${otherSha}`,
      );
    }
  }
  if (!row.includes(form.docLabel)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} must keep ${form.docLabel} framing`);
  }
  if (!row.includes(form.opVerbToken)) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} provenance must reference op-verb "${form.opVerbToken}"`,
    );
  }
  for (const other of FORMS) {
    if (other.code !== form.code && row.includes(other.opVerbToken)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance must not contain ${other.code} op-verb "${other.opVerbToken}"`,
      );
    }
  }
  if (form.legalArticles && !row.includes(form.legalArticles)) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} provenance must reference legal basis "${form.legalArticles}"`,
    );
  }
}

function assertPresentationIdentity(form, profile, compiled) {
  const compiledSectionIds = (compiled.source?.sections ?? []).map((s) => s.id);
  const seen = new Set();
  for (const sec of profile.sections) {
    if (!sec.description?.trim()) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} section "${sec.sectionId}" has empty description`,
      );
    }
    if (!compiledSectionIds.includes(sec.sectionId)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} contains phantom section "${sec.sectionId}"`,
      );
    }
    seen.add(sec.sectionId);
  }
  for (const id of compiledSectionIds) {
    if (!seen.has(id)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} compiled section "${id}" unrepresented in profile`,
      );
    }
  }
  const src = profile._source + ' ' + JSON.stringify(profile);
  if (/\(m(?:ẫu|áº«u)\s+BM-1\d{2}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} contains generated placeholder marker`);
  }
  if (/Tran Van Binh|Trần Văn Bình/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} contains fabricated demo name`);
  }
  if (form.code === 'BM-166') {
    for (const token of BM166_LEGACY_TOKENS) {
      if (src.includes(token)) {
        throw new Error(
          `SCOPED_ASSERTION: ${form.code} source still references legacy token "${token}"`,
        );
      }
    }
  }
}

function assertProvenanceIdentity(form, row) {
  if (!row) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance row missing`);
  }
  if (!/runtimeReady=NOT_PROMOTED/u.test(row)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must record runtimeReady=NOT_PROMOTED`);
  }
  if (!/fieldEvidenceMap/u.test(row) && !/Field evidence/u.test(row)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must record field evidence`);
  }
  if (!/confidenceByField/u.test(row)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must record confidenceByField`);
  }
  if (!/reviewed \d{4}-\d{2}-\d{2}/u.test(row)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must record a review timestamp`);
  }
}

// ============================================================
// SCOPED MUTATION MATRICES
// ============================================================

const BM166_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-168 (sibling by number, not by workflow)',
    mutate: (profile) => {
      profile.templateCode = 'BM-168';
    },
    reason: 'BM-166 is a QUYẾT ĐỊNH, not the BM-168 BIÊN BẢN',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    reason: 'this batch does not promote runtimeReady',
  },
  {
    label: 'override compiled title to BM-168 title',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'BB giao nhận hồ sơ vụ án, vụ việc';
    },
    reason: 'BM-166 governs re-investigation return, not case-file handover',
  },
];

const BM166_PRESENTATION_MUTATIONS = [
  {
    label: 're-introduce phantom section-noi-dung-quyet-dinh (đ typo)',
    mutate: (profile) => {
      profile.sections = [
        ...profile.sections,
        {
          sectionId: 'section-noi-dung-quyet-dinh',
          title: 'Phantom',
          description: 'should be rejected',
        },
      ];
    },
    reason: 'phantom section id (đ typo) must remain removed',
  },
  {
    label: 'drop section-co-quan-va-van-ban description (empty desc)',
    mutate: (profile) => {
      const sec = profile.sections.find((s) => s.sectionId === 'section-co-quan-va-van-ban');
      if (sec) sec.description = '';
    },
    reason: 'every section must keep a source-aligned description',
  },
  {
    label: 're-introduce legacy legal-basis "Điều 245 và Điều 247"',
    mutate: (profile) => {
      profile._source = profile._source + '\nCăn cứ Điều 245 và Điều 247 Bộ luật Tố tụng hình sự';
    },
    reason: 'legacy "Điều 245/247" legal basis must not reappear',
  },
  {
    label: 're-introduce drifted "điều tra bổ sung" framing',
    mutate: (profile) => {
      profile._source = profile._source + '\nQuyết định trả hồ sơ điều tra bổ sung';
    },
    reason: 'BM-166 is "để điều tra lại", not "điều tra bổ sung"',
  },
];

const BM166_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-168 hash',
    mutate: (row) => row.replace(EXTRACT_SHA['BM-166'], EXTRACT_SHA['BM-168']),
    reason: 'provenance must reference BM-166 own extract SHA',
  },
  {
    label: 'rewrite op-verb to BM-168 sibling phrase',
    mutate: (row) =>
      row.replace(/TRẢ HỒ SƠ VỤ ÁN ĐỂ ĐIỀU TRA LẠI/u, 'Giao, nhận hồ sơ vụ việc/vụ án'),
    reason: "BM-166 is tra-ho-so-de-dieu-tra-lai, not BM-168's handover op-verb",
  },
];

const BM168_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-166 (sibling by number, not by workflow)',
    mutate: (profile) => {
      profile.templateCode = 'BM-166';
    },
    reason: 'BM-168 is a BIÊN BẢN, not the BM-166 QUYẾT ĐỊNH',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    reason: 'this batch does not promote runtimeReady',
  },
  {
    label: 'override compiled title to BM-166 title',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'QĐ trả hồ sơ vụ án để điều tra lại';
    },
    reason: 'BM-168 governs case-file handover, not re-investigation return',
  },
];

const BM168_PRESENTATION_MUTATIONS = [
  {
    label: 're-introduce phantom section-co-quan',
    mutate: (profile) => {
      profile.sections = [
        ...profile.sections,
        { sectionId: 'section-co-quan', title: 'Phantom', description: 'should be rejected' },
      ];
    },
    reason: 'phantom section id must be replaced by canonical section-co-quan-va-van-ban',
  },
  {
    label: 're-introduce phantom section-thoi-gian',
    mutate: (profile) => {
      profile.sections = [
        ...profile.sections,
        { sectionId: 'section-thoi-gian', title: 'Phantom', description: 'should be rejected' },
      ];
    },
    reason: 'phantom section id must be folded into canonical section-bien-ban-ban-giao',
  },
  {
    label: 'drop section-bien-ban-ban-giao description (empty desc)',
    mutate: (profile) => {
      const sec = profile.sections.find((s) => s.sectionId === 'section-bien-ban-ban-giao');
      if (sec) sec.description = '';
    },
    reason: 'every section must keep a source-aligned description',
  },
];

const BM168_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-166 hash',
    mutate: (row) => row.replace(EXTRACT_SHA['BM-168'], EXTRACT_SHA['BM-166']),
    reason: 'provenance must reference BM-168 own extract SHA',
  },
  {
    label: 'rewrite op-verb to BM-166 sibling phrase',
    mutate: (row) =>
      row.replace(/Giao, nhận hồ sơ vụ việc\/vụ án/u, 'TRẢ HỒ SƠ VỤ ÁN ĐỂ ĐIỀU TRA LẠI'),
    reason: "BM-168 is a handover record, not BM-166's re-investigation-return op-verb",
  },
];

export const BM166_MUTATION_COUNT = {
  documentIdentity: BM166_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM166_PRESENTATION_MUTATIONS.length,
  provenance: BM166_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export const BM168_MUTATION_COUNT = {
  documentIdentity: BM168_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM168_PRESENTATION_MUTATIONS.length,
  provenance: BM168_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export function assertMutationCounts() {
  assert.strictEqual(BM166_MUTATION_COUNT.documentIdentity, 3, 'BM-166 documentIdentity mutation count must be 3');
  assert.strictEqual(BM166_MUTATION_COUNT.presentation, 4, 'BM-166 presentation mutation count must be 4');
  assert.strictEqual(BM166_MUTATION_COUNT.provenance, 2, 'BM-166 provenance mutation count must be 2');
  assert.strictEqual(BM166_MUTATION_COUNT.total, 9, 'BM-166 total mutation count must be 9');

  assert.strictEqual(BM168_MUTATION_COUNT.documentIdentity, 3, 'BM-168 documentIdentity mutation count must be 3');
  assert.strictEqual(BM168_MUTATION_COUNT.presentation, 3, 'BM-168 presentation mutation count must be 3');
  assert.strictEqual(BM168_MUTATION_COUNT.provenance, 2, 'BM-168 provenance mutation count must be 2');
  assert.strictEqual(BM168_MUTATION_COUNT.total, 8, 'BM-168 total mutation count must be 8');
}

// ============================================================
// TEST SUITE
// ============================================================

describe('BM-166/BM-168 frontier-leap gap closure', { concurrency: false }, () => {
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
          assert.ok(
            sec.description && sec.description.trim().length > 0,
            `${form.code} section "${sec.sectionId}" description must be non-empty`,
          );
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
      it(`${form.code} profile uses only canonical compiled section ids`, () => {
        const src = loadProfileSource(form.code);
        const canonical = new Set(CANONICAL_SECTION_IDS[form.code]);
        const idRegex = /sectionId:\s*"([^"]+)"/gu;
        const seen = new Set();
        let m;
        while ((m = idRegex.exec(src)) !== null) seen.add(m[1]);
        for (const id of seen) {
          assert.ok(canonical.has(id), `${form.code} uses non-canonical section id "${id}"`);
        }
      });
      it(`${form.code} profile excludes phantom section ids`, () => {
        const src = loadProfileSource(form.code);
        for (const ph of PHANTOM_SECTION_IDS[form.code] ?? []) {
          assert.ok(
            !src.includes(`sectionId: "${ph}"`),
            `${form.code} must not declare phantom section ${ph}`,
          );
        }
      });
      it(`${form.code} contains no fabricated demo data`, () => {
        const source = loadProfileSource(form.code);
        assert.ok(!/Tran Van Binh|Trần Văn Bình/iu.test(source), `${form.code} must not contain fabricated demo name`);
      });
      it(`${form.code} contains no generated placeholder marker`, () => {
        const source = loadProfileSource(form.code);
        assert.ok(
          !/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(source),
          `${form.code} must not contain generated placeholder marker`,
        );
      });
      it(`${form.code} provenance row is present with required fields`, () => {
        const row = loadProvenanceRow(form.code);
        assertProvenanceIdentity(form, row);
      });
    });
  }

  describe('BM-166 boundary: no legacy drift', () => {
    it('BM-166 profile excludes legacy "điều tra bổ sung" framing and Điều 245/247 legal basis', () => {
      const src = loadProfileSource('BM-166');
      for (const token of BM166_LEGACY_TOKENS) {
        assert.ok(!src.includes(token), `BM-166 must not contain legacy token "${token}"`);
      }
    });
    it('BM-166 extract references Điều 41 and Điều 174 BLTTHS', () => {
      const ext = readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/extracted/BM-166__d0762a0ffb28.extract.md'),
        'utf8',
      );
      assert.ok(ext.includes('Điều 41') && ext.includes('Điều 174'), 'BM-166 extract must reference Điều 41 and Điều 174');
    });
  });

  describe('BM-168 boundary: isolated singleton', () => {
    it('BM-168 extract references case-file handover framing distinct from BM-166', () => {
      const ext = readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/extracted/BM-168__3369df5870b2.extract.md'),
        'utf8',
      );
      assert.ok(ext.includes('Giao, nhận hồ sơ vụ việc/vụ án'), 'BM-168 extract must reference handover op-verb');
      assert.ok(!ext.includes('điều tra lại'), 'BM-168 extract must not reference BM-166 re-investigation framing');
    });
  });

  describe('Family/boundary rule', () => {
    it('BM-166 and BM-168 are isolated singletons, not a shared legal family', () => {
      const bm166 = FORMS.find((f) => f.code === 'BM-166');
      const bm168 = FORMS.find((f) => f.code === 'BM-168');
      assert.notStrictEqual(bm166.docLabel, bm168.docLabel, 'BM-166 (QUYẾT ĐỊNH) and BM-168 (BIÊN BẢN) must differ in document type');
      assert.notStrictEqual(bm166.opVerbToken, bm168.opVerbToken, 'operative phrases must not be shared');
    });
  });

  describe('BM-166/BM-168 mutation matrix counts', () => {
    it('mutation counts are exact', () => assertMutationCounts());
  });

  // ============================================================
  // SCOPED MUTATION MATRIX EXECUTION
  // ============================================================

  const GAP_MATRICES = [
    {
      code: 'BM-166',
      documentIdentity: BM166_DOCUMENT_IDENTITY_MUTATIONS,
      presentation: BM166_PRESENTATION_MUTATIONS,
      provenance: BM166_PROVENANCE_MUTATIONS,
    },
    {
      code: 'BM-168',
      documentIdentity: BM168_DOCUMENT_IDENTITY_MUTATIONS,
      presentation: BM168_PRESENTATION_MUTATIONS,
      provenance: BM168_PROVENANCE_MUTATIONS,
    },
  ];

  for (const { code, documentIdentity, presentation, provenance } of GAP_MATRICES) {
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
      for (const { label, mutate, reason } of presentation) {
        it(`presentation: ${label}`, () => {
          const profile = loadProfileStub(code);
          const compiled = JSON.parse(JSON.stringify(COMPILED_BY_CODE[code]));
          assert.throws(
            () => {
              mutate(profile, compiled);
              assertPresentationIdentity(form, profile, compiled);
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
              const broken = mutate(row);
              assertDocumentIdentity(form, profile, broken, compiled);
            },
            (err) => /SCOPED_ASSERTION/u.test(err.message),
            `expected SCOPED_ASSERTION — ${reason}`,
          );
        });
      }
    });
  }
});
