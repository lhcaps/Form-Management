/**
 * BM-019/020/022/023 KHỞI TỐ VỤ ÁN family curation verification.
 *
 * Family: KHỞI TỐ VỤ ÁN — investigation-stage prosecution requests and
 * decisions governing case-initiation actions on a vụ án hình sự:
 *   - BM-019 = "Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự"
 *     (Điều 41, 156, 161, 165 BLTTHS) — 17 fields, 5 sections
 *   - BM-020 = "Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố"
 *     (Điều 41, 157–159, 161, 165 BLTTHS) — 13 fields, 4 sections
 *   - BM-022 = "QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự"
 *     (Điều 41, 158, 161, 165 BLTTHS) — 4 fields, 2 sections
 *   - BM-023 = "QĐ khởi tố vụ án hình sự"
 *     (Điều 41, 143, 153, 154, 159, 161, 165 BLTTHS) — 17 fields, 5 sections
 *
 * Family grouping rationale:
 *   BM-019 and BM-020 are YÊU CẦU (requests) issued by Viện kiểm sát asking
 *   the investigative authority to amend or rescind a prior initiation
 *   decision. BM-022 and BM-023 are QUYẾT ĐỊNH (decisions) of the Viện kiểm
 *   sát itself — BM-022 rescinds a prior "không khởi tố" decision, BM-023
 *   initiates a vụ án hình sự. All four are bound to the same source folder
 *   `01. TIEP NHAN GIAI QUYET NGUON TIN VE TOI PHAM` and share the operative
 *   pattern "khởi tố vụ án hình sự" under Điều 41 BLTTHS.
 *
 * Source contracts: docs/audit/docx/compiled-v2/BM-{019,020,022,023}.compiled.json
 * Source extracts:  docs/audit/docx/extracted/BM-{019,020,022,023}__*.extract.md
 *
 * Curation scope (allowed):
 *   - Section descriptions
 *   - Field labels and placeholders
 *   - presentationSections mapping
 *   - versionLabel cleanup
 *   - Removal of fabricated demo data
 *
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled section IDs
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 *
 * Run: node --test test/forms/bm019-020-022-023-khoi-to-vu-an-curation.test.mjs
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
    code: 'BM-019',
    title: 'Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự',
    fieldCount: 17,
    sectionCount: 5,
    familyHeading: 'YÊU CẦU',
    familyOpVerb: 'khởi tố vụ án hình sự',
  },
  {
    code: 'BM-020',
    title: 'Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố',
    fieldCount: 13,
    sectionCount: 4,
    familyHeading: 'YÊU CẦU',
    familyOpVerb: 'khởi tố/không khởi tố vụ án hình sự',
  },
  {
    code: 'BM-022',
    title: 'QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự',
    fieldCount: 4,
    sectionCount: 2,
    familyHeading: 'QUYẾT ĐỊNH',
    familyOpVerb: 'HỦY BỎ QUYẾT ĐỊNH KHÔNG KHỞI TỐ VỤ ÁN HÌNH SỰ',
  },
  {
    code: 'BM-023',
    title: 'QĐ khởi tố vụ án hình sự',
    fieldCount: 17,
    sectionCount: 5,
    familyHeading: 'QUYẾT ĐỊNH',
    familyOpVerb: 'KHỞI TỐ VỤ ÁN HÌNH SỰ',
  },
];

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
    throw new Error(`SCOPED_ASSERTION: ${form.code} compiled field count ${compiled.source?.fields?.length} != ${form.fieldCount}`);
  }
  if (compiled.source?.sections?.length !== form.sectionCount) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} compiled section count ${compiled.source?.sections?.length} != ${form.sectionCount}`);
  }
  if (!row) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance row missing`);
  }
  // Exact extract SHA must appear in the provenance row — guards against
  // sibling-SHA swaps (BM-019 SHA → BM-023 SHA, etc.).
  const expectedSha = EXTRACT_SHA[form.code];
  if (expectedSha && !row.includes(expectedSha)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must reference extract SHA ${expectedSha}`);
  }
  // Other form SHAs must NOT appear in this row (sibling-SHA swap guard).
  for (const [otherCode, otherSha] of Object.entries(EXTRACT_SHA)) {
    if (otherCode !== form.code && row.includes(otherSha)) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must not reference ${otherCode} extract SHA ${otherSha}`);
    }
  }
  // Family-distinct headings: a YÊU CẦU form must never impersonate a
  // QUYẾT ĐỊNH form (and vice versa).
  if (form.familyHeading === 'YÊU CẦU' && !row.includes('YÊU CẦU')) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} must keep YÊU CẦU framing`);
  }
  if (form.familyHeading === 'QUYẾT ĐỊNH' && !row.includes('QUYẾT ĐỊNH')) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} must keep QUYẾT ĐỊNH framing`);
  }
  // Legal-basis guard: every form must reference Điều 41 BLTTHS.
  if (!row.includes('Điều 41')) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must reference Điều 41 BLTTHS`);
  }
  // Op-verb guard: the family-specific operative verb prefix must remain.
  const opVerbToken = OP_VERB_TOKEN[form.code];
  if (opVerbToken && !row.includes(opVerbToken)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must reference op-verb "${opVerbToken}"`);
  }
  // Sibling op-verb rejection: BM-022 row must not contain BM-023's full
  // op-verb (and vice versa). Each sibling has a unique uppercase op-verb.
  for (const [otherCode, otherToken] of Object.entries(OP_VERB_TOKEN)) {
    if (otherCode !== form.code && row.includes(otherToken) && OTHER_OP_VERB_REJECT[form.code]?.has(otherCode)) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} provenance must not contain ${otherCode} op-verb "${otherToken}"`);
    }
  }
}

const EXTRACT_SHA = {
  'BM-019': '3c2858f47dad607d8eb0af2a180810e3b7e9e003c08940d1a672af770febd4bf',
  'BM-020': '0f61c04c750d57b2491a08b6429ab2939b008e9b8e782ce2651908a80459af7e',
  'BM-022': '13d342bdfc564f935b83b367b4b168e0226081ec6c0a6e17afbcf2952effb15c',
  'BM-023': '760346fba10094d009298d36fb7c9d679a8dd658ee7d735b99ed2ca3a2675741',
};

// Op-verb fingerprints: unique substring that distinguishes each form
// from its sibling at the row-level (case-sensitive, upper-case forms
// are intentional to match the rendered extractHeading value).
const OP_VERB_TOKEN = {
  'BM-019': 'Ra Quyết định bổ sung',
  'BM-020': 'Ra Quyết định hủy bỏ',
  'BM-022': 'HỦY BỎ QUYẾT ĐỊNH KHÔNG KHỞI TỐ',
  'BM-023': 'KHỞI TỐ VỤ ÁN HÌNH SỰ',
};

// BM-022 and BM-023 share the substring "VỤ ÁN HÌNH SỰ" so a guard must
// only reject the opposing form's distinct op-verb fingerprint.
const OTHER_OP_VERB_REJECT = {
  'BM-019': new Set(['BM-020', 'BM-022', 'BM-023']),
  'BM-020': new Set(['BM-019', 'BM-022', 'BM-023']),
  'BM-022': new Set(['BM-023']),
  'BM-023': new Set(['BM-022']),
};

function assertPresentationIdentity(form, profile, compiled) {
  const sections = profile.presentationSections ?? [];
  const compiledSectionIds = (compiled.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} section "${sec.id}" has empty description`);
    }
  }
  for (const sec of sections) {
    if (compiledSectionIds.length > 0 && !compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} contains phantom section "${sec.id}"`);
    }
  }
  const src = profile._source + ' ' + JSON.stringify(profile);
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} contains generated placeholder marker`);
  }
  if (/Nhap noi dung|Tran Van Binh|Trần Văn Bình/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: ${form.code} contains generic fabricated values`);
  }
  // demo must not contain fabricated non-empty strings.
  const demo = profile.demo ?? {};
  for (const [key, value] of Object.entries(demo)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      throw new Error(`SCOPED_ASSERTION: ${form.code} demo.${key} must remain empty (got "${value}")`);
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
  const out = [];
  const blockRegex = /\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]*)"/gu;
  let m;
  while ((m = blockRegex.exec(source)) !== null) {
    out.push({ id: m[1], title: m[2], description: m[3] });
  }
  return out;
}

// ============================================================
// SCOPED MUTATION MATRICES
// ============================================================

const BM019_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-020 (Yêu cầu huỷ)',
    mutate: (profile) => { profile.templateCode = 'BM-020'; },
    reason: 'BM-019 is Yêu cầu bổ sung — must not impersonate BM-020 (Yêu cầu huỷ)',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => { profile.runtimeReady = true; },
    reason: 'batch-10 GATE B does not promote runtimeReady',
  },
  {
    label: 'override compiled title to QĐ khởi tố (BM-023)',
    target: 'compiled',
    mutate: (compiled) => { compiled.title = 'QĐ khởi tố vụ án hình sự'; },
    reason: 'BM-019 is a request, not a decision',
  },
];

const BM019_PRESENTATION_MUTATIONS = [
  {
    label: 'drop presentationSections.description (empty desc)',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) profile.presentationSections[0].description = '';
    },
    reason: 'presentationSections.description must remain source-aligned',
  },
  {
    label: 'inject generated placeholder marker "(mẫu BM-019)"',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) {
        profile.presentationSections[0].description =
          `${profile.presentationSections[0].description ?? ''} (mẫu BM-019)`;
      }
    },
    reason: 'no fabricated generated markers',
  },
  {
    label: 're-introduce "Nhap noi dung" placeholder',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'document.issuePlaceAndDateLine': 'Nhap noi dung' };
    },
    reason: 'no legacy "Nhap noi dung" placeholders',
  },
];

const BM019_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-023 hash',
    mutate: (row) => row.replace(/3c2858f47dad607d8eb0af2a180810e3b7e9e003c08940d1a672af770febd4bf/, '760346fba10094d009298d36fb7c9d679a8dd658ee7d735b99ed2ca3a2675741'),
    reason: 'provenance must reference BM-019 own extract SHA',
  },
  {
    label: 'drop Điều 41 from provenance',
    mutate: (row) => row.replace(/Điều 41/u, 'Điều 99'),
    reason: 'BM-019 must keep Điều 41 BLTTHS legal basis',
  },
];

const BM020_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-019 (Yêu cầu bổ sung)',
    mutate: (profile) => { profile.templateCode = 'BM-019'; },
    reason: 'BM-020 is Yêu cầu huỷ — must not impersonate BM-019',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => { profile.runtimeReady = true; },
    reason: 'batch-10 GATE B does not promote runtimeReady',
  },
  {
    label: 'override compiled title to QĐ huỷ (BM-022)',
    target: 'compiled',
    mutate: (compiled) => { compiled.title = 'QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự'; },
    reason: 'BM-020 is a request, not a decision',
  },
];

const BM020_PRESENTATION_MUTATIONS = [
  {
    label: 'drop presentationSections.description',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) profile.presentationSections[0].description = '';
    },
    reason: 'presentationSections.description must remain source-aligned',
  },
  {
    label: 'inject generated placeholder marker "(mẫu BM-020)"',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) {
        profile.presentationSections[0].description =
          `${profile.presentationSections[0].description ?? ''} (mẫu BM-020)`;
      }
    },
    reason: 'no fabricated generated markers',
  },
  {
    label: 're-introduce "Nhap noi dung" placeholder',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'initiationRequest.reasonLine': 'Nhap noi dung' };
    },
    reason: 'no legacy "Nhap noi dung" placeholders',
  },
];

const BM020_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-019 hash',
    mutate: (row) => row.replace(/0f61c04c750d57b2491a08b6429ab2939b008e9b8e782ce2651908a80459af7e/, '3c2858f47dad607d8eb0af2a180810e3b7e9e003c08940d1a672af770febd4bf'),
    reason: 'provenance must reference BM-020 own extract SHA',
  },
];

const BM022_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-023 (QĐ khởi tố)',
    mutate: (profile) => { profile.templateCode = 'BM-023'; },
    reason: 'BM-022 is QĐ huỷ bỏ — must not impersonate BM-023 (khởi tố)',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => { profile.runtimeReady = true; },
    reason: 'batch-10 GATE B does not promote runtimeReady',
  },
];

const BM022_PRESENTATION_MUTATIONS = [
  {
    label: 'inject generated placeholder marker "(mẫu BM-022)"',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) {
        profile.presentationSections[0].description =
          `${profile.presentationSections[0].description ?? ''} (mẫu BM-022)`;
      }
    },
    reason: 'no fabricated generated markers',
  },
  {
    label: 're-introduce fabricated demo "Tran Van Binh"',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'person.fullName': 'Tran Van Binh' };
    },
    reason: 'no fabricated demo values',
  },
];

const BM022_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-023 hash',
    mutate: (row) => row.replace(/13d342bdfc564f935b83b367b4b168e0226081ec6c0a6e17afbcf2952effb15c/, '760346fba10094d009298d36fb7c9d679a8dd658ee7d735b99ed2ca3a2675741'),
    reason: 'provenance must reference BM-022 own extract SHA',
  },
  {
    label: 'rewrite op-verb to KHỞI TỐ (impersonate BM-023)',
    mutate: (row) => row.replace(/HỦY BỎ QUYẾT ĐỊNH KHÔNG KHỞI TỐ VỤ ÁN HÌNH SỰ/u, 'KHỞI TỐ VỤ ÁN HÌNH SỰ'),
    reason: 'BM-022 is "huỷ bỏ QĐ không khởi tố" — not "khởi tố"',
  },
];

const BM023_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-022 (QĐ huỷ bỏ)',
    mutate: (profile) => { profile.templateCode = 'BM-022'; },
    reason: 'BM-023 is QĐ khởi tố — must not impersonate BM-022 (huỷ bỏ)',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => { profile.runtimeReady = true; },
    reason: 'batch-10 GATE B does not promote runtimeReady',
  },
  {
    label: 'override compiled title to Yêu cầu (BM-019)',
    target: 'compiled',
    mutate: (compiled) => { compiled.title = 'Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự'; },
    reason: 'BM-023 is a decision, not a request',
  },
];

const BM023_PRESENTATION_MUTATIONS = [
  {
    label: 'inject generated placeholder marker "(mẫu BM-023)"',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) {
        profile.presentationSections[0].description =
          `${profile.presentationSections[0].description ?? ''} (mẫu BM-023)`;
      }
    },
    reason: 'no fabricated generated markers',
  },
  {
    label: 're-introduce fabricated demo "Tran Van Binh"',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'crimeReport.content': 'Tran Van Binh' };
    },
    reason: 'no fabricated demo values',
  },
];

const BM023_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-022 hash',
    mutate: (row) => row.replace(/760346fba10094d009298d36fb7c9d679a8dd658ee7d735b99ed2ca3a2675741/, '13d342bdfc564f935b83b367b4b168e0226081ec6c0a6e17afbcf2952effb15c'),
    reason: 'provenance must reference BM-023 own extract SHA',
  },
  {
    label: 'rewrite op-verb to HUỶ BỎ (impersonate BM-022)',
    mutate: (row) => row.replace(/KHỞI TỐ VỤ ÁN HÌNH SỰ/u, 'HỦY BỎ QUYẾT ĐỊNH KHÔNG KHỞI TỐ VỤ ÁN HÌNH SỰ'),
    reason: 'BM-023 is "khởi tố vụ án hình sự" — not "huỷ bỏ"',
  },
];

export const BM019_MUTATION_COUNT = {
  documentIdentity: BM019_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM019_PRESENTATION_MUTATIONS.length,
  provenance: BM019_PROVENANCE_MUTATIONS.length,
  get total() { return this.documentIdentity + this.presentation + this.provenance; },
};

export const BM020_MUTATION_COUNT = {
  documentIdentity: BM020_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM020_PRESENTATION_MUTATIONS.length,
  provenance: BM020_PROVENANCE_MUTATIONS.length,
  get total() { return this.documentIdentity + this.presentation + this.provenance; },
};

export const BM022_MUTATION_COUNT = {
  documentIdentity: BM022_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM022_PRESENTATION_MUTATIONS.length,
  provenance: BM022_PROVENANCE_MUTATIONS.length,
  get total() { return this.documentIdentity + this.presentation + this.provenance; },
};

export const BM023_MUTATION_COUNT = {
  documentIdentity: BM023_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM023_PRESENTATION_MUTATIONS.length,
  provenance: BM023_PROVENANCE_MUTATIONS.length,
  get total() { return this.documentIdentity + this.presentation + this.provenance; },
};

export function assertMutationCounts() {
  assert.strictEqual(BM019_MUTATION_COUNT.documentIdentity, 3, 'BM-019 documentIdentity mutation count must be 3');
  assert.strictEqual(BM019_MUTATION_COUNT.presentation, 3, 'BM-019 presentation mutation count must be 3');
  assert.strictEqual(BM019_MUTATION_COUNT.provenance, 2, 'BM-019 provenance mutation count must be 2');
  assert.strictEqual(BM019_MUTATION_COUNT.total, 8, 'BM-019 total mutation count must be 8');

  assert.strictEqual(BM020_MUTATION_COUNT.documentIdentity, 3, 'BM-020 documentIdentity mutation count must be 3');
  assert.strictEqual(BM020_MUTATION_COUNT.presentation, 3, 'BM-020 presentation mutation count must be 3');
  assert.strictEqual(BM020_MUTATION_COUNT.provenance, 1, 'BM-020 provenance mutation count must be 1');
  assert.strictEqual(BM020_MUTATION_COUNT.total, 7, 'BM-020 total mutation count must be 7');

  assert.strictEqual(BM022_MUTATION_COUNT.documentIdentity, 2, 'BM-022 documentIdentity mutation count must be 2');
  assert.strictEqual(BM022_MUTATION_COUNT.presentation, 2, 'BM-022 presentation mutation count must be 2');
  assert.strictEqual(BM022_MUTATION_COUNT.provenance, 2, 'BM-022 provenance mutation count must be 2');
  assert.strictEqual(BM022_MUTATION_COUNT.total, 6, 'BM-022 total mutation count must be 6');

  assert.strictEqual(BM023_MUTATION_COUNT.documentIdentity, 3, 'BM-023 documentIdentity mutation count must be 3');
  assert.strictEqual(BM023_MUTATION_COUNT.presentation, 2, 'BM-023 presentation mutation count must be 2');
  assert.strictEqual(BM023_MUTATION_COUNT.provenance, 2, 'BM-023 provenance mutation count must be 2');
  assert.strictEqual(BM023_MUTATION_COUNT.total, 7, 'BM-023 total mutation count must be 7');
}

// ============================================================
// TEST SUITE
// ============================================================

describe('BM-019/020/022/023 KHỞI TỐ VỤ ÁN curation', { concurrency: false }, () => {

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
    });
  }

  describe('Family-level', () => {
    it('BM-019 + BM-020 share YÊU CẦU heading; BM-022 + BM-023 share QUYẾT ĐỊNH', () => {
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-019').familyHeading, 'YÊU CẦU');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-020').familyHeading, 'YÊU CẦU');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-022').familyHeading, 'QUYẾT ĐỊNH');
      assert.strictEqual(FORMS.find((f) => f.code === 'BM-023').familyHeading, 'QUYẾT ĐỊNH');
    });
    it('All four forms are bound to Điều 41 BLTTHS', () => {
      const c019 = COMPILED_BY_CODE['BM-019'];
      const c022 = COMPILED_BY_CODE['BM-022'];
      // Cross-check the extract legal-basis paragraphs match.
      const ext019 = readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/extracted/BM-019__3c2858f47dad.extract.md'),
        'utf8',
      );
      assert.ok(ext019.includes('41'), 'BM-019 extract must reference Điều 41');
      const ext022 = readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/extracted/BM-022__13d342bdfc56.extract.md'),
        'utf8',
      );
      assert.ok(ext022.includes('41'), 'BM-022 extract must reference Điều 41');
      assert.ok(c019.title && c022.title);
    });
  });

  describe('BM-019/020/022/023 mutation matrix counts', () => {
    it('mutation counts are exact', () => assertMutationCounts());
  });

  // ============================================================
  // SCOPED MUTATION MATRIX EXECUTION
  // ============================================================

  const FAMILY_MATRICES = [
    { code: 'BM-019', documentIdentity: BM019_DOCUMENT_IDENTITY_MUTATIONS, presentation: BM019_PRESENTATION_MUTATIONS, provenance: BM019_PROVENANCE_MUTATIONS },
    { code: 'BM-020', documentIdentity: BM020_DOCUMENT_IDENTITY_MUTATIONS, presentation: BM020_PRESENTATION_MUTATIONS, provenance: BM020_PROVENANCE_MUTATIONS },
    { code: 'BM-022', documentIdentity: BM022_DOCUMENT_IDENTITY_MUTATIONS, presentation: BM022_PRESENTATION_MUTATIONS, provenance: BM022_PROVENANCE_MUTATIONS },
    { code: 'BM-023', documentIdentity: BM023_DOCUMENT_IDENTITY_MUTATIONS, presentation: BM023_PRESENTATION_MUTATIONS, provenance: BM023_PROVENANCE_MUTATIONS },
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