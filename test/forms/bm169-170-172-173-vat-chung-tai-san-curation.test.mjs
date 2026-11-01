/**
 * BM-169/170/172/173 XỬ LÝ VẬT CHỨNG family curation verification.
 *
 * Family: XỬ LÝ VẬT CHỨNG / TRẢ LẠI TÀI SẢN — prosecution-stage decisions
 * governing the disposition of physical evidence and asset-return orders:
 *   - BM-169 = "QĐ xử lý vật chứng"
 *     (Điều 41, 90, 106, 248 BLTTHS) — 20 fields, 5 sections
 *   - BM-170 = "QĐ huỷ bỏ QĐ xử lý vật chứng"
 *     (Điều 41, 106, 165 BLTTHS) — 17 fields, 5 sections
 *   - BM-172 = "QĐ huỷ bỏ QĐ trả lại tài sản"
 *     (Điều 41, 106, 165 BLTTHS) — 34 fields, 6 sections
 *   - BM-173 = "QĐ chuyển vật chứng"
 *     (Điều 41, 90, 106 BLTTHS) — 16 fields, 5 sections
 *
 * Family grouping rationale:
 *   All four forms are bound to the source folder
 *   `06. XU LY VAT CHUNG` and govern Điều 106 BLTTHS evidence handling.
 *   BM-169 issues the initial evidence-handling decision.
 *   BM-170 rescinds a prior evidence-handling decision.
 *   BM-172 rescinds a prior asset-return decision (the asset-return mirror
 *   of BM-170).
 *   BM-173 transfers evidence to thi hành án.
 *
 * Source contracts: docs/audit/docx/compiled-v2/BM-{169,170,172,173}.compiled.json
 * Source extracts:  docs/audit/docx/extracted/BM-{169,170,172,173}__*.extract.md
 *
 * Curation scope (allowed):
 *   - Section descriptions
 *   - Phantom section id corrections:
 *       BM-169: section-noi-dung-xu-ly → section-noi-dung-quyet-inh
 *       BM-170: section-noi-dung-quyet-dinh ('đ') → section-noi-dung-quyet-inh ('i')
 *       BM-172: section-nguoi-nhan-tai-san → section-thong-tin-nguoi-nhan-tai-san
 *       BM-173: section-noi-dung-chuyen → section-noi-dung-quyet-inh
 *   - Legal-basis / unlawful-reason realignment to DOCX-verbatim values
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled section IDs (must remain canonical)
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 *
 * Run: node --test test/forms/bm169-170-172-173-vat-chung-tai-san-curation.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
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
    code: 'BM-169',
    title: 'QĐ xử lý vật chứng',
    fieldCount: 20,
    sectionCount: 5,
    subfamily: 'QĐ xử lý',
    opVerbToken: 'XỬ LÝ VẬT CHỨNG',
    legalArticles: 'Điều 41, 90, 106 và 248',
  },
  {
    code: 'BM-170',
    title: 'QĐ huỷ bỏ QĐ xử lý vật chứng',
    fieldCount: 17,
    sectionCount: 5,
    subfamily: 'Huỷ bỏ QĐ xử lý',
    opVerbToken: 'HỦY BỎ QUYẾT ĐỊNH XỬ LÝ VẬT CHỨNG',
    legalArticles: 'Điều 41, 106 và 165',
  },
  {
    code: 'BM-172',
    title: 'QĐ huỷ bỏ QĐ trả lại tài sản',
    fieldCount: 34,
    sectionCount: 6,
    subfamily: 'Huỷ bỏ QĐ trả lại tài sản',
    opVerbToken: 'HỦY BỎ QUYẾT ĐỊNH TRẢ LẠI TÀI SẢN',
    legalArticles: 'Điều 41, 106 và 165',
  },
  {
    code: 'BM-173',
    title: 'QĐ chuyển vật chứng',
    fieldCount: 16,
    sectionCount: 5,
    subfamily: 'Chuyển vật chứng',
    opVerbToken: 'CHUYỂN VẬT CHỨNG',
    legalArticles: 'Điều 41, 90 và 106',
  },
];

// SHA fingerprints from the source extracts; provenance row must reference
// each form's own SHA and never a sibling's.
const EXTRACT_SHA = {
  'BM-169': 'bff3da71880c7da30f4eb0066325fe02f26fd4af660fa8a7406f2d564852c4e2',
  'BM-170': '7145e5831eaa57dbd6b8dfe11dd3636cceba06b703e200f62b2f08c8ad34b73e',
  'BM-172': '4b11b83d0d4453d0bda53fe6a9b72e6f35f048ae483ad424956303231e9def65',
  'BM-173': '3ebc94a313f62d6038bc79d96cb465719d4d19f86422a203e028f47443f1c63f',
};

// Phantom section ids that an earlier cursor turn erroneously produced.
// They must NOT appear in any profile source.
const PHANTOM_SECTION_IDS = {
  'BM-169': ['section-noi-dung-xu-ly'],
  'BM-170': ['section-noi-dung-quyet-dinh'],
  'BM-172': ['section-nguoi-nhan-tai-san'],
  'BM-173': ['section-noi-dung-chuyen'],
};

// Compiled-contract section ids (canonical). Source files may only use these.
const CANONICAL_SECTION_IDS = {
  'BM-169': [
    'section-co-quan-va-van-ban',
    'section-can-cu-phap-ly',
    'section-noi-dung-quyet-inh',
    'section-noi-nhan',
    'section-chu-ky',
  ],
  'BM-170': [
    'section-co-quan-va-van-ban',
    'section-can-cu-phap-ly',
    'section-noi-dung-quyet-inh',
    'section-noi-nhan',
    'section-chu-ky',
  ],
  'BM-172': [
    'section-co-quan-va-van-ban',
    'section-can-cu-phap-ly',
    'section-noi-dung-quyet-inh',
    'section-thong-tin-nguoi-nhan-tai-san',
    'section-noi-nhan',
    'section-chu-ky',
  ],
  'BM-173': [
    'section-co-quan-va-van-ban',
    'section-can-cu-phap-ly',
    'section-noi-dung-quyet-inh',
    'section-noi-nhan',
    'section-chu-ky',
  ],
};

// Legacy legal-basis text that previous-turn profiles emitted. It must
// not appear in any current profile or demo block.
const LEGACY_BASIS_TOKENS = ['Điều 76', 'Điều 107'];

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
  return resolve(
    PROFILE_DIR,
    code.replace('BM-', 'bm').replace('-', '') + '-runtime-ux-profile.ts',
  );
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

// ============================================================
// SCOPED ASSERTIONS — per form
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
  // Exact extract SHA must appear in the provenance row.
  const expectedSha = EXTRACT_SHA[form.code];
  if (expectedSha && !row.includes(expectedSha)) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} provenance must reference extract SHA ${expectedSha}`,
    );
  }
  // Sibling SHA swap guard.
  for (const [otherCode, otherSha] of Object.entries(EXTRACT_SHA)) {
    if (otherCode !== form.code && row.includes(otherSha)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance must not reference ${otherCode} extract SHA ${otherSha}`,
      );
    }
  }
  // Operative verb fingerprint.
  if (!row.includes(form.opVerbToken)) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} provenance must reference op-verb "${form.opVerbToken}"`,
    );
  }
  // Sibling op-verb rejection — each BM-XXX has a unique uppercase verb token.
  for (const other of FORMS) {
    if (other.code !== form.code && row.includes(other.opVerbToken)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} provenance must not contain ${other.code} op-verb "${other.opVerbToken}"`,
      );
    }
  }
  // Legal-basis substring guard (every form references Điều 41).
  if (!row.includes('Điều 41')) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} provenance must reference Điều 41 BLTTHS`,
    );
  }
}

function assertPresentationIdentity(form, profile, compiled) {
  const sections = profile.presentationSections ?? [];
  const compiledSectionIds = (compiled.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} section "${sec.id}" has empty description`,
      );
    }
  }
  // No phantom section ids allowed.
  const phantoms = PHANTOM_SECTION_IDS[form.code] ?? [];
  for (const sec of sections) {
    if (phantoms.includes(sec.id)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} contains phantom section "${sec.id}" — use canonical id from CANONICAL_SECTION_IDS`,
      );
    }
    if (compiledSectionIds.length > 0 && !compiledSectionIds.includes(sec.id)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} contains section "${sec.id}" not in compiled contract`,
      );
    }
  }
  // All sections must be of the canonical (compiled) set so a hidden
  // section can never sneak in.
  const compiledSet = new Set(compiledSectionIds);
  for (const sec of sections) {
    if (compiledSectionIds.length > 0 && !compiledSet.has(sec.id)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} section "${sec.id}" is not a compiled-contract section`,
      );
    }
  }
  const src = profile._source + ' ' + JSON.stringify(profile);
  if (/\(m(?:ẫu|áº«u)\s+BM-1\d{2}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} contains generated placeholder marker`);
  }
  if (/Nhap noi dung|Tran Van Binh|Trần Văn Bình/iu.test(src)) {
    throw new Error(
      `SCOPED_ASSERTION: ${form.code} contains generic fabricated values`,
    );
  }
  for (const token of LEGACY_BASIS_TOKENS) {
    if (src.includes(token)) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} source still references legacy token "${token}"`,
      );
    }
  }
  // demo must not contain non-empty strings.
  const demo = profile.demo ?? {};
  for (const [key, value] of Object.entries(demo)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      throw new Error(
        `SCOPED_ASSERTION: ${form.code} demo.${key} must remain empty (got "${value}")`,
      );
    }
  }
}

function loadProfileStub(code) {
  const source = loadProfileSource(code);
  const sections = extractPresentationSections(source);
  return {
    templateCode: code,
    runtimeReady: false,
    demo: {},
    presentationSections: sections,
    _source: source,
  };
}

function extractPresentationSections(source) {
  // Match `BM169_SECTIONS = [ { sectionId: "...", title: "...", description: "..." } , ... ]` blocks
  const out = [];
  const blockRegex =
    /\{\s*sectionId:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]*)"/gu;
  let m;
  while ((m = blockRegex.exec(source)) !== null) {
    out.push({ id: m[1], title: m[2], description: m[3] });
  }
  return out;
}

// ============================================================
// SCOPED MUTATION MATRICES
// ============================================================

const BM169_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-170 (huỷ bỏ QĐ xử lý vật chứng)',
    mutate: (profile) => {
      profile.templateCode = 'BM-170';
    },
    reason: 'BM-169 is initial handling, not rescission',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    reason: 'batch GATE B does not promote runtimeReady',
  },
  {
    label: 'override compiled title to BM-170 title',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'QĐ huỷ bỏ QĐ xử lý vật chứng';
    },
    reason: 'BM-169 is initial handling, not huỷ bỏ',
  },
];

const BM169_PRESENTATION_MUTATIONS = [
  {
    label: 're-introduce phantom section-noi-dung-xu-ly',
    mutate: (profile) => {
      profile.presentationSections = [
        ...(profile.presentationSections ?? []),
        {
          id: 'section-noi-dung-xu-ly',
          title: 'Phantom',
          description: 'should be rejected',
        },
      ];
    },
    reason: 'phantom section id must remain removed',
  },
  {
    label: 'drop section description (empty desc)',
    mutate: (profile) => {
      if (profile.presentationSections?.[2]) profile.presentationSections[2].description = '';
    },
    reason: 'every section must keep source-aligned description',
  },
  {
    label: 're-introduce legacy "Điều 76 / Điều 107" legal-basis placeholder',
    mutate: (profile) => {
      profile._source = profile._source + '\n Điều 76 và Điều 107 năm 2015';
    },
    reason: 'legacy "Điều 76/107" must not reappear',
  },
];

const BM169_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-170 hash',
    mutate: (row) =>
      row.replace(
        /bff3da71880c7da30f4eb0066325fe02f26fd4af660fa8a7406f2d564852c4e2/u,
        '7145e5831eaa57dbd6b8dfe11dd3636cceba06b703e200f62b2f08c8ad34b73e',
      ),
    reason: 'provenance must reference BM-169 own extract SHA',
  },
  {
    label: 'rewrite op-verb "XỬ LÝ VẬT CHỨNG" → "CHUYỂN VẬT CHỨNG" (BM-173)',
    mutate: (row) => row.replace(/XỬ LÝ VẬT CHỨNG/u, 'CHUYỂN VẬT CHỨNG'),
    reason: 'BM-169 is initial handling, not transfer',
  },
];

const BM170_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-169 (QĐ xử lý vật chứng)',
    mutate: (profile) => {
      profile.templateCode = 'BM-169';
    },
    reason: 'BM-170 is huỷ bỏ — must not impersonate BM-169',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    reason: 'batch GATE B does not promote runtimeReady',
  },
  {
    label: 'override compiled title to BM-172 title (asset-return family)',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'QĐ huỷ bỏ QĐ trả lại tài sản';
    },
    reason: 'BM-170 governs vật chứng, not tài sản',
  },
];

const BM170_PRESENTATION_MUTATIONS = [
  {
    label: 're-introduce phantom section-noi-dung-quyet-dinh',
    mutate: (profile) => {
      profile.presentationSections = [
        ...(profile.presentationSections ?? []),
        {
          id: 'section-noi-dung-quyet-dinh',
          title: 'Phantom',
          description: 'should be rejected',
        },
      ];
    },
    reason: 'phantom section id (đ typo) must remain removed',
  },
  {
    label: 'drop section description (empty desc)',
    mutate: (profile) => {
      if (profile.presentationSections?.[2]) profile.presentationSections[2].description = '';
    },
    reason: 'every section must keep source-aligned description',
  },
];

const BM170_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-172 hash',
    mutate: (row) =>
      row.replace(
        /7145e5831eaa57dbd6b8dfe11dd3636cceba06b703e200f62b2f08c8ad34b73e/u,
        '4b11b83d0d4453d0bda53fe6a9b72e6f35f048ae483ad424956303231e9def65',
      ),
    reason: 'provenance must reference BM-170 own extract SHA',
  },
];

const BM172_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-171 (QĐ trả lại tài sản)',
    mutate: (profile) => {
      profile.templateCode = 'BM-171';
    },
    reason: 'BM-172 is huỷ bỏ, not initial QĐ trả lại',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    reason: 'batch GATE B does not promote runtimeReady',
  },
  {
    label: 'override compiled title to BM-169 title',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'QĐ xử lý vật chứng';
    },
    reason: 'BM-172 governs tài sản, not vật chứng',
  },
];

const BM172_PRESENTATION_MUTATIONS = [
  {
    label: 're-introduce phantom section-nguoi-nhan-tai-san',
    mutate: (profile) => {
      profile.presentationSections = [
        ...(profile.presentationSections ?? []),
        {
          id: 'section-nguoi-nhan-tai-san',
          title: 'Phantom',
          description: 'should be rejected',
        },
      ];
    },
    reason: 'phantom section id must be replaced by section-thong-tin-nguoi-nhan-tai-san',
  },
  {
    label: 'drop section description (empty desc)',
    mutate: (profile) => {
      if (profile.presentationSections?.[3]) profile.presentationSections[3].description = '';
    },
    reason: 'every section must keep source-aligned description',
  },
];

const BM172_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-170 hash',
    mutate: (row) =>
      row.replace(
        /4b11b83d0d4453d0bda53fe6a9b72e6f35f048ae483ad424956303231e9def65/u,
        '7145e5831eaa57dbd6b8dfe11dd3636cceba06b703e200f62b2f08c8ad34b73e',
      ),
    reason: 'provenance must reference BM-172 own extract SHA',
  },
];

const BM173_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-169 (QĐ xử lý vật chứng)',
    mutate: (profile) => {
      profile.templateCode = 'BM-169';
    },
    reason: 'BM-173 is transfer, not initial handling',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    reason: 'batch GATE B does not promote runtimeReady',
  },
  {
    label: 'override compiled title to BM-171 title',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'QĐ trả lại tài sản';
    },
    reason: 'BM-173 is chuyển vật chứng, not trả lại tài sản',
  },
];

const BM173_PRESENTATION_MUTATIONS = [
  {
    label: 're-introduce phantom section-noi-dung-chuyen',
    mutate: (profile) => {
      profile.presentationSections = [
        ...(profile.presentationSections ?? []),
        {
          id: 'section-noi-dung-chuyen',
          title: 'Phantom',
          description: 'should be rejected',
        },
      ];
    },
    reason: 'phantom section id must be replaced by section-noi-dung-quyet-inh',
  },
  {
    label: 'drop section description (empty desc)',
    mutate: (profile) => {
      if (profile.presentationSections?.[2]) profile.presentationSections[2].description = '';
    },
    reason: 'every section must keep source-aligned description',
  },
];

const BM173_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-169 hash',
    mutate: (row) =>
      row.replace(
        /3ebc94a313f62d6038bc79d96cb465719d4d19f86422a203e028f47443f1c63f/u,
        'bff3da71880c7da30f4eb0066325fe02f26fd4af660fa8a7406f2d564852c4e2',
      ),
    reason: 'provenance must reference BM-173 own extract SHA',
  },
  {
    label: 'rewrite op-verb "CHUYỂN VẬT CHỨNG" → "XỬ LÝ VẬT CHỨNG" (BM-169)',
    mutate: (row) => row.replace(/CHUYỂN VẬT CHỨNG/u, 'XỬ LÝ VẬT CHỨNG'),
    reason: 'BM-173 is transfer, not initial handling',
  },
];

export const BM169_MUTATION_COUNT = {
  documentIdentity: BM169_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM169_PRESENTATION_MUTATIONS.length,
  provenance: BM169_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export const BM170_MUTATION_COUNT = {
  documentIdentity: BM170_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM170_PRESENTATION_MUTATIONS.length,
  provenance: BM170_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export const BM172_MUTATION_COUNT = {
  documentIdentity: BM172_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM172_PRESENTATION_MUTATIONS.length,
  provenance: BM172_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export const BM173_MUTATION_COUNT = {
  documentIdentity: BM173_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM173_PRESENTATION_MUTATIONS.length,
  provenance: BM173_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export function assertMutationCounts() {
  assert.strictEqual(
    BM169_MUTATION_COUNT.documentIdentity,
    3,
    'BM-169 documentIdentity mutation count must be 3',
  );
  assert.strictEqual(
    BM169_MUTATION_COUNT.presentation,
    3,
    'BM-169 presentation mutation count must be 3',
  );
  assert.strictEqual(
    BM169_MUTATION_COUNT.provenance,
    2,
    'BM-169 provenance mutation count must be 2',
  );
  assert.strictEqual(BM169_MUTATION_COUNT.total, 8, 'BM-169 total mutation count must be 8');

  assert.strictEqual(
    BM170_MUTATION_COUNT.documentIdentity,
    3,
    'BM-170 documentIdentity mutation count must be 3',
  );
  assert.strictEqual(
    BM170_MUTATION_COUNT.presentation,
    2,
    'BM-170 presentation mutation count must be 2',
  );
  assert.strictEqual(
    BM170_MUTATION_COUNT.provenance,
    1,
    'BM-170 provenance mutation count must be 1',
  );
  assert.strictEqual(BM170_MUTATION_COUNT.total, 6, 'BM-170 total mutation count must be 6');

  assert.strictEqual(
    BM172_MUTATION_COUNT.documentIdentity,
    3,
    'BM-172 documentIdentity mutation count must be 3',
  );
  assert.strictEqual(
    BM172_MUTATION_COUNT.presentation,
    2,
    'BM-172 presentation mutation count must be 2',
  );
  assert.strictEqual(
    BM172_MUTATION_COUNT.provenance,
    1,
    'BM-172 provenance mutation count must be 1',
  );
  assert.strictEqual(BM172_MUTATION_COUNT.total, 6, 'BM-172 total mutation count must be 6');

  assert.strictEqual(
    BM173_MUTATION_COUNT.documentIdentity,
    3,
    'BM-173 documentIdentity mutation count must be 3',
  );
  assert.strictEqual(
    BM173_MUTATION_COUNT.presentation,
    2,
    'BM-173 presentation mutation count must be 2',
  );
  assert.strictEqual(
    BM173_MUTATION_COUNT.provenance,
    2,
    'BM-173 provenance mutation count must be 2',
  );
  assert.strictEqual(BM173_MUTATION_COUNT.total, 7, 'BM-173 total mutation count must be 7');
}

// ============================================================
// TEST SUITE
// ============================================================

describe('BM-169/170/172/173 XỬ LÝ VẬT CHỨNG curation', { concurrency: false }, () => {
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
      it(`${form.code} profile uses only canonical compiled section ids`, () => {
        const src = loadProfileSource(form.code);
        const canonical = new Set(CANONICAL_SECTION_IDS[form.code]);
        // Find every literal section id appearing as `sectionId: "..."` and
        // ensure they are all in CANONICAL_SECTION_IDS.
        const idRegex = /sectionId:\s*"([^"]+)"/gu;
        const seen = new Set();
        let m;
        while ((m = idRegex.exec(src)) !== null) seen.add(m[1]);
        for (const id of seen) {
          assert.ok(
            canonical.has(id),
            `${form.code} uses non-canonical section id "${id}"`,
          );
        }
      });
      it(`${form.code} profile excludes phantom section ids`, () => {
        const src = loadProfileSource(form.code);
        // Phantom token must not appear as a declared sectionId OR in the
        // SECTIONS object literal. Allow references inside the doc-comment
        // header so future trace forensics can survive.
        for (const ph of PHANTOM_SECTION_IDS[form.code] ?? []) {
          // Strict: the literal `sectionId: "phantom..."` declaration must
          // not appear anywhere in the source.
          assert.ok(
            !src.includes(`sectionId: "${ph}"`),
            `${form.code} must not declare phantom section ${ph}`,
          );
        }
      });
      it(`${form.code} profile excludes legacy "Điều 76" / "Điều 107" tokens`, () => {
        const src = loadProfileSource(form.code);
        assert.ok(!src.includes('Điều 76'), `${form.code} must not contain legacy token "Điều 76"`);
        assert.ok(!src.includes('Điều 107'), `${form.code} must not contain legacy token "Điều 107"`);
      });
    });
  }

  describe('Family-level', () => {
    it('all four forms are bound to source folder XU LY VAT CHUNG and BLTTHS base', () => {
      for (const form of FORMS) {
        const ext = readFileSync(
          resolve(PROJECT_ROOT, `docs/audit/docx/extracted/${form.code}__${extractInnerHash(form.code)}.extract.md`),
          'utf8',
        );
        // Use a family-diverse but deterministic domain token. Every form
        // in this batch is governed by Bộ luật Tố tụng hình sự.
        assert.ok(
          ext.includes('Bộ luật Tố tụng hình sự'),
          `${form.code} extract must reference Bộ luật Tố tụng hình sự`,
        );
        // Every form in this batch cites Điều 41 (case-insensitive across
        // "Điều 41" and "điều 41" — both appear in the extracts).
        assert.ok(
          /điều\s+41/iu.test(ext),
          `${form.code} extract must reference Điều 41 BLTTHS (case-insensitive)`,
        );
      }
    });
    it('BM-169 and BM-170 govern vật chứng; BM-172 governs tài sản; BM-173 governs vật chứng', () => {
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-169').subfamily, 'QĐ xử lý');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-170').subfamily, 'Huỷ bỏ QĐ xử lý');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-172').subfamily, 'Huỷ bỏ QĐ trả lại tài sản');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-173').subfamily, 'Chuyển vật chứng');
    });
  });

  describe('BM-169/170/172/173 mutation matrix counts', () => {
    it('mutation counts are exact', () => assertMutationCounts());
  });

  // ============================================================
  // SCOPED MUTATION MATRIX EXECUTION
  // ============================================================

  const FAMILY_MATRICES = [
    {
      code: 'BM-169',
      documentIdentity: BM169_DOCUMENT_IDENTITY_MUTATIONS,
      presentation: BM169_PRESENTATION_MUTATIONS,
      provenance: BM169_PROVENANCE_MUTATIONS,
    },
    {
      code: 'BM-170',
      documentIdentity: BM170_DOCUMENT_IDENTITY_MUTATIONS,
      presentation: BM170_PRESENTATION_MUTATIONS,
      provenance: BM170_PROVENANCE_MUTATIONS,
    },
    {
      code: 'BM-172',
      documentIdentity: BM172_DOCUMENT_IDENTITY_MUTATIONS,
      presentation: BM172_PRESENTATION_MUTATIONS,
      provenance: BM172_PROVENANCE_MUTATIONS,
    },
    {
      code: 'BM-173',
      documentIdentity: BM173_DOCUMENT_IDENTITY_MUTATIONS,
      presentation: BM173_PRESENTATION_MUTATIONS,
      provenance: BM173_PROVENANCE_MUTATIONS,
    },
  ];

  for (const { code, documentIdentity, presentation, provenance } of FAMILY_MATRICES) {
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

// Helper used by the family-level "extracted text" check.
function extractInnerHash(code) {
  const dir = resolve(PROJECT_ROOT, 'docs/audit/docx/extracted');
  const list = readdirSync(dir).filter((f) => f.startsWith(`${code}__`));
  if (list.length === 0) throw new Error(`no extract for ${code}`);
  const md = list.find((f) => f.endsWith('.extract.md'));
  if (!md) throw new Error(`no .extract.md for ${code}`);
  const inner = md.split('__')[1];
  return inner.replace(/\.extract\.md$/u, '');
}
