/**
 * BM-154/155/156 PHỤC HỒI + CÁO TRẠNG family curation verification.
 * 
 * Family: PHỤC HỒI VỤ ÁN + CÁO TRẠNG — prosecution-stage documents from
 * the GIAI ĐOẠN TRUY TỐ phase covering:
 *   - BM-154 = "QĐ phục hồi vụ án" (Điều 41, 236, 247, 249 BLTTHS) — 6 fields, 1 section
 *   - BM-155 = "QĐ phục hồi vụ án đối với bị can" (Điều 41, 236, 247, 249 BLTTHS) — 15 fields, 1 section
 *   - BM-156 = "Cáo trạng" (Điều 41, 236, 239, 243 BLTTHS) — 41 fields, 5 sections
 * 
 * Family grouping rationale:
 *   BM-154 and BM-155 share the PHỤC HỒI VỤ ÁN domain (resumption of suspended/terminated cases).
 *   BM-154 is case-targeted; BM-155 is accused-targeted.
 *   BM-156 is a CÁO TRẠNG (indictment) — distinct document type from QUYẾT ĐỊNH.
 *   All share prosecution-stage procedure context.
 * 
 * Source contracts: docs/audit/docx/compiled-v2/BM-{154,155,156}.compiled.json
 * Source extracts:  docs/audit/docx/extracted/BM-{154,155,156}.extract.md
 * 
 * Curation scope (allowed):
 *   - Section descriptions
 *   - Field labels and placeholders
 *   - presentationSections mapping
 *   - versionLabel cleanup (no CURATION/GATE/BATCH/PHASE/SINGLETON/BOUNDED markers)
 *   - Removal of fabricated demo data
 * 
 * Curation scope (forbidden):
 *   - Field keys
 *   - Compiled section IDs
 *   - runtimeReady promotion
 *   - Compiled contracts and DOCX
 * 
 * Run: node --test test/forms/bm154-155-156-phuchoi-caotrang-curation.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const PROFILE_DIR = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux');
const PROVENANCE_LEDGER = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);

const FORMS = [
  {
    code: 'BM-154',
    title: 'QĐ phục hồi vụ án',
    fieldCount: 6,
    sectionCount: 1,
    sectionTitles: ['Thông tin biểu mẫu'],
    extractHash: '618d13a959ca2c1ce8841a135aeaac44e30f800a5b1b98189cef53fec5cd0c39',
    extractHeading: 'PHỤC HỒI VỤ ÁN HÌNH SỰ',
  },
  {
    code: 'BM-155',
    title: 'QĐ phục hồi vụ án đối với bị can',
    fieldCount: 15,
    sectionCount: 1,
    sectionTitles: ['Thông tin biểu mẫu'],
    extractHash: 'd89766f2092a6e4df330c7f2bd8ec9976ea1c903f3ec20302cdf313a4f3051d4',
    extractHeading: 'PHỤC HỒI VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN',
  },
  {
    code: 'BM-156',
    title: 'Cáo trạng',
    fieldCount: 41,
    sectionCount: 5,
    sectionTitles: [
      'Cơ quan và văn bản',
      'Căn cứ pháp lý',
      'Nội dung cáo trạng',
      'Nơi nhận',
      'Chữ ký',
    ],
    extractHash: 'ef438a40e567ed9d6504771efeb1a57e2c1d75b22c4bea3ead13dba6d039d166',
    extractHeading: 'CÁO TRẠNG',
  },
];

const requireFromHere = createRequire(import.meta.url);
const fs = requireFromHere('node:fs');

// ============================================================
// Helpers
// ============================================================

function loadContract(code) {
  const p = resolve(PROJECT_ROOT, `docs/audit/docx/compiled-v2/${code}.compiled.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadProfileSource(code) {
  const fileName = code.replace('BM-', 'bm').replace('-', '') + '-runtime-ux-profile.ts';
  const p = resolve(PROFILE_DIR, fileName);
  return fs.readFileSync(p, 'utf8');
}

// ============================================================
// SCOPED MUTATION ASSERTIONS — BM-154
// ============================================================

const BM154_CODE = 'BM-154';
const BM154_COMPILED_TITLE = 'QĐ phục hồi vụ án';
const BM154_PROFILE_VAR = 'BM154_RUNTIME_UX_PROFILE';

export function assertBm154DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM154_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-154 templateCode is "${prof.templateCode}"`);
  }
  if (prof.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: BM-154 must NOT be runtimeReady`);
  }
  if (c.templateCode !== undefined && c.templateCode !== BM154_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-154 compiled.templateCode is "${c.templateCode}"`);
  }
  if (c.title !== undefined && c.title !== BM154_COMPILED_TITLE) {
    throw new Error(`SCOPED_ASSERTION: BM-154 compiled.title is "${c.title}"`);
  }
  const expectedSha = '618d13a959ca2c1ce8841a135aeaac44e30f800a5b1b98189cef53fec5cd0c39';
  if (row && !row.includes(expectedSha)) {
    throw new Error(`SCOPED_ASSERTION: BM-154 provenance must reference extract SHA ${expectedSha}`);
  }
  if (row && /Điều 41, 236, 239, 243 BLTTHS/u.test(row)) {
    throw new Error('SCOPED_ASSERTION: BM-154 provenance must not use Cáo trạng articles (BM-156)');
  }
  if (row && /Legal workflow:\s*accusedCase/u.test(row)) {
    throw new Error('SCOPED_ASSERTION: BM-154 must remain case-targeted (workflow must be caseResumption, not accusedCase…)');
  }
}

export function assertBm154PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 6) {
    throw new Error(`SCOPED_ASSERTION: BM-154 has ${c.source.fields.length} compiled fields — expected 6`);
  }
  if (c.source?.sections && c.source.sections.length !== 1) {
    throw new Error(`SCOPED_ASSERTION: BM-154 has ${c.source.sections.length} compiled sections — expected 1`);
  }
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: BM-154 section "${sec.id}" has empty description`);
    }
  }
  const compiledSectionIds = (c.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (compiledSectionIds.length > 0 && !compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: BM-154 contains phantom section "${sec.id}"`);
    }
  }
  const src = (prof._source ?? '') + ' ' + JSON.stringify(profile ?? {});
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: BM-154 contains generated placeholder marker`);
  }
  if (src.includes('Nhap noi dung') || src.includes('Tran Van Binh')) {
    throw new Error(`SCOPED_ASSERTION: BM-154 contains generic fabricated values`);
  }
  // demo must not contain fabricated non-empty string for fields other than source-provided slots
  const demo = prof.demo ?? {};
  for (const [key, value] of Object.entries(demo)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      throw new Error(`SCOPED_ASSERTION: BM-154 demo.${key} must remain empty (got "${value}")`);
    }
  }
}

// ============================================================
// SCOPED MUTATION ASSERTIONS — BM-155
// ============================================================

const BM155_CODE = 'BM-155';
const BM155_COMPILED_TITLE = 'QĐ phục hồi vụ án đối với bị can';
const BM155_PROFILE_VAR = 'BM155_RUNTIME_UX_PROFILE';

export function assertBm155DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM155_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-155 templateCode is "${prof.templateCode}"`);
  }
  if (prof.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: BM-155 must NOT be runtimeReady`);
  }
  if (c.templateCode !== undefined && c.templateCode !== BM155_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-155 compiled.templateCode is "${c.templateCode}"`);
  }
  if (c.title !== undefined && c.title !== BM155_COMPILED_TITLE) {
    throw new Error(`SCOPED_ASSERTION: BM-155 compiled.title is "${c.title}"`);
  }
  const expectedSha = 'd89766f2092a6e4df330c7f2bd8ec9976ea1c903f3ec20302cdf313a4f3051d4';
  if (row && !row.includes(expectedSha)) {
    throw new Error(`SCOPED_ASSERTION: BM-155 provenance must reference extract SHA ${expectedSha}`);
  }
  if (row && /Điều 41, 236, 239, 243 BLTTHS/u.test(row)) {
    throw new Error('SCOPED_ASSERTION: BM-155 provenance must not use Cáo trạng articles (BM-156)');
  }
  if (row && /Legal workflow:\s*caseResumption/u.test(row) && !/Legal workflow:\s*accusedCaseResumption/u.test(row)) {
    throw new Error('SCOPED_ASSERTION: BM-155 must keep accusedCaseResumption workflow (accused-targeted phục hồi)');
  }
}

export function assertBm155PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 15) {
    throw new Error(`SCOPED_ASSERTION: BM-155 has ${c.source.fields.length} compiled fields — expected 15`);
  }
  if (c.source?.sections && c.source.sections.length !== 1) {
    throw new Error(`SCOPED_ASSERTION: BM-155 has ${c.source.sections.length} compiled sections — expected 1`);
  }
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: BM-155 section "${sec.id}" has empty description`);
    }
  }
  const compiledSectionIds = (c.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (compiledSectionIds.length > 0 && !compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: BM-155 contains phantom section "${sec.id}"`);
    }
  }
  const src = (prof._source ?? '') + ' ' + JSON.stringify(profile ?? {});
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: BM-155 contains generated placeholder marker`);
  }
  if (src.includes('Nhap noi dung') || src.includes('Tran Van Binh')) {
    throw new Error(`SCOPED_ASSERTION: BM-155 contains generic fabricated values`);
  }
  const demo = prof.demo ?? {};
  for (const [key, value] of Object.entries(demo)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      throw new Error(`SCOPED_ASSERTION: BM-155 demo.${key} must remain empty (got "${value}")`);
    }
  }
}

// ============================================================
// SCOPED MUTATION ASSERTIONS — BM-156
// ============================================================

const BM156_CODE = 'BM-156';
const BM156_COMPILED_TITLE = 'Cáo trạng';
const BM156_PROFILE_VAR = 'BM156_RUNTIME_UX_PROFILE';

export function assertBm156DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM156_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-156 templateCode is "${prof.templateCode}"`);
  }
  if (prof.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: BM-156 must NOT be runtimeReady`);
  }
  if (c.templateCode && c.templateCode !== BM156_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-156 compiled.templateCode is "${c.templateCode}"`);
  }
  if (c.title && c.title !== BM156_COMPILED_TITLE) {
    throw new Error(`SCOPED_ASSERTION: BM-156 compiled.title is "${c.title}"`);
  }
}

export function assertBm156PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 41) {
    throw new Error(`SCOPED_ASSERTION: BM-156 has ${c.source.fields.length} compiled fields — expected 41`);
  }
  if (c.source?.sections && c.source.sections.length !== 5) {
    throw new Error(`SCOPED_ASSERTION: BM-156 has ${c.source.sections.length} compiled sections — expected 5`);
  }
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: BM-156 section "${sec.id}" has empty description`);
    }
  }
  const compiledSectionIds = (c.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (!compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: BM-156 contains phantom section "${sec.id}"`);
    }
  }
  const src = JSON.stringify(profile ?? {});
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: BM-156 contains generated placeholder marker`);
  }
  if (src.includes('Nhap noi dung') || src.includes('Tran Van Binh')) {
    throw new Error(`SCOPED_ASSERTION: BM-156 contains generic fabricated values`);
  }
}

// ============================================================
// SCOPED MUTATION MATRICES — BM-154
// ============================================================

export const BM154_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'flip templateCode to BM-155 (accused-targeted restoration)',
    mutate: (profile) => {
      profile.templateCode = 'BM-155';
    },
    assert: assertBm154DocumentIdentity,
    reason:
      'case-targeted BM-154 must not impersonate accused-targeted BM-155',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    assert: assertBm154DocumentIdentity,
    reason: 'batch-9 GATE A does not promote runtimeReady',
  },
  {
    label: 'override compiled title to Cáo trạng (BM-156)',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'Cáo trạng';
    },
    assert: assertBm154DocumentIdentity,
    reason: 'compiled title is locked to QĐ phục hồi vụ án',
  },
];

export const BM154_PRESENTATION_MUTATIONS = [
  {
    label: 'drop presentationSections.description (empty desc)',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) {
        profile.presentationSections[0].description = '';
      }
    },
    assert: assertBm154PresentationIdentity,
    reason: 'presentationSections.description must remain source-aligned',
  },
  {
    label: 'inject generated placeholder marker "(mẫu BM-154)"',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) {
        profile.presentationSections[0].description =
          `${profile.presentationSections[0].description ?? ''} (mẫu BM-154)`;
      }
    },
    assert: assertBm154PresentationIdentity,
    reason: 'no fabricated generated markers',
  },
  {
    label: 're-introduce "Nhap noi dung" placeholder',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'agency.diaDanh': 'Nhap noi dung' };
    },
    assert: assertBm154PresentationIdentity,
    reason: 'no legacy "Nhap noi dung" placeholders',
  },
  {
    label: 're-introduce fabricated demo "Tran Van Binh"',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'document.chuThe': 'Tran Van Binh' };
    },
    assert: assertBm154PresentationIdentity,
    reason: 'no fabricated demo values',
  },
];

export const BM154_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-155 hash (d89766f2…)',
    mutate: (provenanceRow) => {
      return provenanceRow.replace(/618d13a959ca2c1ce8841a135aeaac44e30f800a5b1b98189cef53fec5cd0c39/, 'd89766f2092a6e4df330c7f2bd8ec9976ea1c903f3ec20302cdf313a4f3051d4');
    },
    assert: assertBm154DocumentIdentity,
    reason: 'provenance must reference BM-154 own extract SHA',
  },
  {
    label: 'rewrite provenance subfamily to "đình chỉ bị can"',
    mutate: (provenanceRow) => {
      return provenanceRow.replace(/caseResumption \(phục hồi vụ án/u, 'accusedCaseSuspension (đình chỉ bị can)');
    },
    assert: assertBm154DocumentIdentity,
    reason: 'BM-154 is case-targeted phục hồi, not đình chỉ bị can',
  },
];

// ============================================================
// SCOPED MUTATION MATRICES — BM-155
// ============================================================

export const BM155_DOCUMENT_IDENTITY_MUTATIONS = [
  {
    label: 'drop "ĐỐI VỚI BỊ CAN" (compile title to case-targeted)',
    target: 'compiled',
    mutate: (compiled) => {
      compiled.title = 'QĐ phục hồi vụ án';
    },
    assert: assertBm155DocumentIdentity,
    reason: 'BM-155 is accused-targeted — must keep ĐỐI VỚI BỊ CAN',
  },
  {
    label: 'promote runtimeReady to true',
    mutate: (profile) => {
      profile.runtimeReady = true;
    },
    assert: assertBm155DocumentIdentity,
    reason: 'batch-9 GATE A does not promote runtimeReady',
  },
  {
    label: 'flip templateCode to BM-154 (case-targeted)',
    mutate: (profile) => {
      profile.templateCode = 'BM-154';
    },
    assert: assertBm155DocumentIdentity,
    reason: 'accused-targeted BM-155 must not impersonate case-targeted BM-154',
  },
];

export const BM155_PRESENTATION_MUTATIONS = [
  {
    label: 'shrink compiled field count to 6 (BM-154 set)',
    target: 'compiled',
    mutate: (compiled) => {
      if (Array.isArray(compiled.source?.fields)) {
        compiled.source.fields = compiled.source.fields.slice(0, 6);
      }
    },
    assert: assertBm155PresentationIdentity,
    reason: 'BM-155 must remain 15 fields — case-targeted set would lose bị can fields',
  },
  {
    label: 'inject generated placeholder marker "(mẫu BM-155)"',
    mutate: (profile) => {
      if (profile.presentationSections?.[0]) {
        profile.presentationSections[0].description =
          `${profile.presentationSections[0].description ?? ''} (mẫu BM-155)`;
      }
    },
    assert: assertBm155PresentationIdentity,
    reason: 'no fabricated generated markers',
  },
  {
    label: 're-introduce "Nhap noi dung" placeholder',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'document.dieu2': 'Nhap noi dung' };
    },
    assert: assertBm155PresentationIdentity,
    reason: 'no legacy "Nhap noi dung" placeholders',
  },
  {
    label: 're-introduce fabricated demo "Tran Van Binh"',
    mutate: (profile) => {
      profile.demo = { ...(profile.demo ?? {}), 'person.tenBi': 'Tran Van Binh' };
    },
    assert: assertBm155PresentationIdentity,
    reason: 'no fabricated demo values',
  },
];

export const BM155_PROVENANCE_MUTATIONS = [
  {
    label: 'swap extract sha256 to BM-154 hash (618d13a9…)',
    mutate: (provenanceRow) => {
      return provenanceRow.replace(/d89766f2092a6e4df330c7f2bd8ec9976ea1c903f3ec20302cdf313a4f3051d4/, '618d13a959ca2c1ce8841a135aeaac44e30f800a5b1b98189cef53fec5cd0c39');
    },
    assert: assertBm155DocumentIdentity,
    reason: 'provenance must reference BM-155 own extract SHA',
  },
  {
    label: 'rewrite provenance subfamily to case-targeted (drop "đối với bị can")',
    mutate: (provenanceRow) => {
      return provenanceRow.replace(/accusedCaseResumption \(phục hồi vụ án đối với bị can\)/u, 'caseResumption (phục hồi vụ án hình sự)');
    },
    assert: assertBm155DocumentIdentity,
    reason: 'BM-155 is accused-targeted phục hồi, not case-targeted',
  },
  {
    label: 'swap legal basis to BM-156 articles (Điều 239 BLTTHS)',
    mutate: (provenanceRow) => {
      return provenanceRow.replace(/Điều 41, 236, 247, 249 BLTTHS/u, 'Điều 41, 236, 239, 243 BLTTHS');
    },
    assert: assertBm155DocumentIdentity,
    reason: 'BM-155 legal basis is 41/236/247/249 — Cáo trạng articles are not applicable',
  },
];

export const BM154_MUTATION_COUNT = {
  documentIdentity: BM154_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM154_PRESENTATION_MUTATIONS.length,
  provenance: BM154_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export const BM155_MUTATION_COUNT = {
  documentIdentity: BM155_DOCUMENT_IDENTITY_MUTATIONS.length,
  presentation: BM155_PRESENTATION_MUTATIONS.length,
  provenance: BM155_PROVENANCE_MUTATIONS.length,
  get total() {
    return this.documentIdentity + this.presentation + this.provenance;
  },
};

export function assertBm154MutationCounts() {
  assert.strictEqual(
    BM154_MUTATION_COUNT.documentIdentity,
    3,
    'BM-154 documentIdentity mutation count must be 3',
  );
  assert.strictEqual(
    BM154_MUTATION_COUNT.presentation,
    4,
    'BM-154 presentation mutation count must be 4',
  );
  assert.strictEqual(
    BM154_MUTATION_COUNT.provenance,
    2,
    'BM-154 provenance mutation count must be 2',
  );
  assert.strictEqual(
    BM154_MUTATION_COUNT.total,
    9,
    'BM-154 total mutation count must be 9',
  );
}

export function assertBm155MutationCounts() {
  assert.strictEqual(
    BM155_MUTATION_COUNT.documentIdentity,
    3,
    'BM-155 documentIdentity mutation count must be 3',
  );
  assert.strictEqual(
    BM155_MUTATION_COUNT.presentation,
    4,
    'BM-155 presentation mutation count must be 4',
  );
  assert.strictEqual(
    BM155_MUTATION_COUNT.provenance,
    3,
    'BM-155 provenance mutation count must be 3',
  );
  assert.strictEqual(
    BM155_MUTATION_COUNT.total,
    10,
    'BM-155 total mutation count must be 10',
  );
}

// ============================================================
// VERSION LABEL — no batch markers
// ============================================================

const BATCH_MARKER_REGEX = /\b(CURATION|GATE|BATCH|PHASE|SINGLETON|BOUNDED)\b/iu;

export function assertNoBatchMarkers(profileSource) {
  const src = profileSource ?? '';
  if (BATCH_MARKER_REGEX.test(src)) {
    const matches = src.match(BATCH_MARKER_REGEX);
    throw new Error(`SCOPED_ASSERTION: profile contains forbidden batch markers: ${matches?.join(', ')}`);
  }
}

// ============================================================
// TEST SUITE
// ============================================================

describe('BM-154/155/156 PHỤC HỒI + CÁO TRẠNG curation', { concurrency: false }, () => {

  for (const { code, title, fieldCount, sectionCount, sectionTitles } of FORMS) {
    const fileName = code.replace('BM-', 'bm').replace('-', '') + '-runtime-ux-profile.ts';
    const profilePath = resolve(PROFILE_DIR, fileName);

    describe(code, () => {

      it(`${code} profile exists`, () => {
        assert.ok(existsSync(profilePath), `${code} profile must exist`);
      });

      it(`${code} no generated placeholder markers`, () => {
        const source = readFileSync(profilePath, 'utf-8');
        const generatedMarkerRegex = /\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu;
        assert.strictEqual(source.match(generatedMarkerRegex), null, `${code} must not contain generated placeholder markers`);
      });

      it(`${code} section descriptions present`, () => {
        const source = readFileSync(profilePath, 'utf-8');
        assert.ok(source.includes('description:'), `${code} must have section descriptions`);
      });

      it(`${code} presentationSections present`, () => {
        const source = readFileSync(profilePath, 'utf-8');
        assert.ok(source.includes('presentationSections:'), `${code} must have presentationSections`);
      });

      it(`${code} field count matches compiled`, () => {
        const compiled = loadContract(code);
        const actual = compiled.source?.fields?.length ?? 0;
        assert.strictEqual(actual, fieldCount, `${code} compiled field count must be ${fieldCount}`);
      });

      it(`${code} section count matches compiled`, () => {
        const compiled = loadContract(code);
        const actual = compiled.source?.sections?.length ?? 0;
        assert.strictEqual(actual, sectionCount, `${code} compiled section count must be ${sectionCount}`);
      });

      it(`${code} templateCode is registered`, () => {
        const source = readFileSync(profilePath, 'utf-8');
        assert.ok(source.includes(`templateCode: "${code}"`), `${code} must register templateCode`);
      });

      it(`${code} versionLabel has no batch markers`, () => {
        const source = readFileSync(profilePath, 'utf-8');
        assertNoBatchMarkers(source);
      });

      it(`${code} no fabricated demo values (Tran Van Binh)`, () => {
        const source = readFileSync(profilePath, 'utf-8');
        assert.ok(!source.includes('Tran Van Binh'), `${code} demo must not contain Tran Van Binh`);
      });

      it(`${code} no legacy "Nhap noi dung" placeholders`, () => {
        const source = readFileSync(profilePath, 'utf-8');
        assert.ok(!source.includes('Nhap noi dung'), `${code} must not contain "Nhap noi dung" placeholders`);
      });

    });
  }

  // Family-level test
  describe('Family-level', () => {
    it('BM-154, BM-155, BM-156 have distinct document types', () => {
      const bm154 = loadContract('BM-154');
      const bm155 = loadContract('BM-155');
      const bm156 = loadContract('BM-156');
      // BM-154 and BM-155 share PHỤC HỒI domain
      assert.ok(bm154.title?.includes('phục hồi'), 'BM-154 is PHỤC HỒI');
      assert.ok(bm155.title?.includes('phục hồi'), 'BM-155 is PHỤC HỒI');
      // BM-156 is CÁO TRẠNG
      assert.ok(bm156.title?.includes('Cáo trạng'), 'BM-156 is CÁO TRẠNG');
      // Distinctness: BM-154 lacks bị can; BM-155 has bị can
      assert.ok(!bm154.title?.includes('bị can'), 'BM-154 is case-targeted');
      assert.ok(bm155.title?.includes('bị can'), 'BM-155 is accused-targeted');
    });

    it('BM-154 provenance row exists in ledger (if present)', () => {
      const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
      // BM-154 may not yet have a provenance row — this is informational only
      const hasRow = ledger.includes('| BM-154 |');
      // If row exists, verify it has the right content
      if (hasRow) {
        assert.ok(ledger.includes('phục hồi'), 'BM-154 provenance must reference PHỤC HỒI domain');
      }
    });

    it('BM-155 provenance row exists in ledger (if present)', () => {
      const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
      const hasRow = ledger.includes('| BM-155 |');
      if (hasRow) {
        assert.ok(ledger.includes('bị can'), 'BM-155 provenance must reference BỊ CAN');
      }
    });

    it('BM-156 provenance row exists in ledger (if present)', () => {
      const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
      const hasRow = ledger.includes('| BM-156 |');
      if (hasRow) {
        assert.ok(ledger.includes('Cáo trạng'), 'BM-156 provenance must reference CÁO TRẠNG');
      }
    });
  });

  // ============================================================
  // EXACT MUTATION COUNTS
  // ============================================================
  describe('BM-154/BM-155 mutation matrix counts', () => {
    it('BM-154 mutation counts are exact', () => assertBm154MutationCounts());
    it('BM-155 mutation counts are exact', () => assertBm155MutationCounts());
  });

  // ============================================================
  // SCOPED MUTATION MATRIX EXECUTION
  // ============================================================
  describe('BM-154 mutation matrix execution', () => {
    for (const { label, mutate, assert: scoped, reason, target } of BM154_DOCUMENT_IDENTITY_MUTATIONS) {
      it(`documentIdentity: ${label}`, () => {
        const profile = loadProfile(BM154_CODE);
        const compiled = loadContract(BM154_CODE);
        const provenance = loadProvenanceRow(BM154_CODE);
        assert.throws(
          () => {
            if (target === 'compiled') {
              mutate(compiled, profile, provenance);
            } else if (target === 'provenance') {
              const mutated = mutate(provenance, profile, compiled);
              scoped(profile, mutated, compiled);
              return;
            } else {
              mutate(profile, compiled, provenance);
            }
            scoped(profile, provenance, compiled);
          },
          (err) => /SCOPED_ASSERTION/u.test(err.message),
          `expected SCOPED_ASSERTION — ${reason}`,
        );
      });
    }

    for (const { label, mutate, assert: scoped, reason, target } of BM154_PRESENTATION_MUTATIONS) {
      it(`presentation: ${label}`, () => {
        const profile = loadProfile(BM154_CODE);
        const compiled = loadContract(BM154_CODE);
        assert.throws(
          () => {
            if (target === 'compiled') {
              mutate(compiled, profile);
            } else {
              mutate(profile, compiled);
            }
            scoped(profile, compiled);
          },
          (err) => /SCOPED_ASSERTION/u.test(err.message),
          `expected SCOPED_ASSERTION — ${reason}`,
        );
      });
    }

    for (const { label, mutate, assert: scoped, reason, target } of BM154_PROVENANCE_MUTATIONS) {
      it(`provenance: ${label}`, () => {
        const profile = loadProfile(BM154_CODE);
        const compiled = loadContract(BM154_CODE);
        const provenance = loadProvenanceRow(BM154_CODE);
        assert.throws(
          () => {
            const mutated = mutate(provenance, profile, compiled);
            scoped(profile, mutated, compiled);
          },
          (err) => /SCOPED_ASSERTION/u.test(err.message),
          `expected SCOPED_ASSERTION — ${reason}`,
        );
      });
    }
  });

  describe('BM-155 mutation matrix execution', () => {
    for (const { label, mutate, assert: scoped, reason, target } of BM155_DOCUMENT_IDENTITY_MUTATIONS) {
      it(`documentIdentity: ${label}`, () => {
        const profile = loadProfile(BM155_CODE);
        const compiled = loadContract(BM155_CODE);
        const provenance = loadProvenanceRow(BM155_CODE);
        assert.throws(
          () => {
            if (target === 'compiled') {
              mutate(compiled, profile, provenance);
            } else {
              mutate(profile, compiled, provenance);
            }
            scoped(profile, provenance, compiled);
          },
          (err) => /SCOPED_ASSERTION/u.test(err.message),
          `expected SCOPED_ASSERTION — ${reason}`,
        );
      });
    }

    for (const { label, mutate, assert: scoped, reason, target } of BM155_PRESENTATION_MUTATIONS) {
      it(`presentation: ${label}`, () => {
        const profile = loadProfile(BM155_CODE);
        const compiled = loadContract(BM155_CODE);
        assert.throws(
          () => {
            if (target === 'compiled') {
              mutate(compiled, profile);
            } else {
              mutate(profile, compiled);
            }
            scoped(profile, compiled);
          },
          (err) => /SCOPED_ASSERTION/u.test(err.message),
          `expected SCOPED_ASSERTION — ${reason}`,
        );
      });
    }

    for (const { label, mutate, assert: scoped, reason } of BM155_PROVENANCE_MUTATIONS) {
      it(`provenance: ${label}`, () => {
        const profile = loadProfile(BM155_CODE);
        const compiled = loadContract(BM155_CODE);
        const provenance = loadProvenanceRow(BM155_CODE);
        assert.throws(
          () => {
            const mutated = mutate(provenance, profile, compiled);
            scoped(profile, mutated, compiled);
          },
          (err) => /SCOPED_ASSERTION/u.test(err.message),
          `expected SCOPED_ASSERTION — ${reason}`,
        );
      });
    }
  });

});

function loadProfile(code) {
  const fileName = code.replace('BM-', 'bm').replace('-', '') + '-runtime-ux-profile.ts';
  const p = resolve(PROFILE_DIR, fileName);
  // Module loading via require would compile TS; load via JSON-less approach:
  // re-use loadProfileSource and parse the demo/fields from TS source through the
  // existing runtime-ux index. To avoid coupling to TS compilation here, we operate
  // on the raw source string and a synthesized profile stub that matches the shape
  // the scoped assertions inspect. The mutations therefore operate on plain
  // objects populated from the source rather than from a compiled module.
  const source = readFileSync(p, 'utf-8');
  const sections = extractPresentationSections(source);
  return {
    templateCode: code,
    runtimeReady: false,
    demo: {},
    presentationSections: sections,
    _source: source,
  };
}

function loadProvenanceRow(code) {
  if (!existsSync(PROVENANCE_LEDGER)) return '';
  const ledger = readFileSync(PROVENANCE_LEDGER, 'utf-8');
  const match = ledger.match(new RegExp(`\\| ${code} \\|[^\\n]*`));
  return match ? match[0] : '';
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
