/**
 * BM-148/149/152/153 ĐÌNH CHỈ BỊ CAN curation verification.
 * 
 * Family: ĐÌNH CHỈ BỊ CAN — four prosecution-stage QUYẾT ĐỊNH forms covering
 * accused-targeted case suspension/termination/resumption:
 *   - BM-148 = "QĐ tạm đình chỉ vụ án đối với bị can" (Điều 41 BLTTHS) — 31 fields, 6 sections
 *   - BM-149 = "QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can" (Điều 41, 247 BLTTHS) — 6 fields, 1 section
 *   - BM-152 = "QĐ đình chỉ vụ án đối với bị can" (Điều 41 BLTTHS) — 9 fields, 1 section
 *   - BM-153 = "QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can" (Điều 41 BLTTHS) — 5 fields, 1 section
 * 
 * Family grouping rationale:
 *   All four share the "đối với bị can" (accused-targeted) procedure subfamily.
 *   Distinct from BM-146/147/150/151 (ĐÌNH CHỈ VỤ ÁN — case-targeted, no bị can).
 *   All share QUYẾT ĐỊNH document type and ĐÌNH CHỈ operative domain.
 * 
 * Source contracts: docs/audit/docx/compiled-v2/BM-{148,149,152,153}.compiled.json
 * Source extracts:  docs/audit/docx/extracted/BM-{148,149,152,153}.extract.md
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
 * Run: node --test test/forms/bm148-149-152-153-dinhchi-bi-can-curation.test.mjs
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
    code: 'BM-148',
    title: 'QĐ tạm đình chỉ vụ án đối với bị can',
    fieldCount: 30,
    sectionCount: 6,
    sectionTitles: [
      'Cơ quan và văn bản',
      'Căn cứ pháp lý',
      'Nội dung quyết định',
      'Thông tin bị can',
      'Nơi nhận',
      'Chữ ký',
    ],
    extractHash: 'cd95b9803ea4eadca4290066503a3cbc0049958dc3731b41c8913eba736a5c98',
    extractHeading: 'QUYẾT ĐỊNH',
    operativeVerb: 'TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN',
  },
  {
    code: 'BM-149',
    title: 'QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can',
    fieldCount: 6,
    sectionCount: 1,
    sectionTitles: ['Thông tin biểu mẫu'],
    extractHash: '0331fe48efc3a1923bc83ff8b3246f2e9758cf39fb86eaf0da5fb65b03ec38c6',
    extractHeading: 'QUYẾT ĐỊNH',
    operativeVerb: 'HỦY BỎ QUYẾT ĐỊNH TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN',
  },
  {
    code: 'BM-152',
    title: 'QĐ đình chỉ vụ án đối với bị can',
    fieldCount: 9,
    sectionCount: 1,
    sectionTitles: ['Thông tin biểu mẫu'],
    extractHash: '9e40bba7a228f23e9316f5438f4f3f7ab0fe4cacf4d291cff336b0e77e9c3a1b',
    extractHeading: 'QUYẾT ĐỊNH',
    operativeVerb: 'ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN',
  },
  {
    code: 'BM-153',
    title: 'QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can',
    fieldCount: 5,
    sectionCount: 1,
    sectionTitles: ['Thông tin biểu mẫu'],
    extractHash: 'a201f738724cb5dde861ae60413f534116d96fc9de4cd67d9a1ff8bc11005f49',
    extractHeading: 'QUYẾT ĐỊNH',
    operativeVerb: 'HỦY BỎ QUYẾT ĐỊNH ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN',
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
// SCOPED MUTATION ASSERTIONS — BM-148
// ============================================================

const BM148_CODE = 'BM-148';
const BM148_COMPILED_TITLE = 'QĐ tạm đình chỉ vụ án đối với bị can';
const BM148_PROFILE_VAR = 'BM148_RUNTIME_UX_PROFILE';

export function assertBm148DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM148_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-148 templateCode is "${prof.templateCode}"`);
  }
  if (prof.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: BM-148 must NOT be runtimeReady`);
  }
  if (c.templateCode && c.templateCode !== BM148_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-148 compiled.templateCode is "${c.templateCode}"`);
  }
  if (c.title && c.title !== BM148_COMPILED_TITLE) {
    throw new Error(`SCOPED_ASSERTION: BM-148 compiled.title is "${c.title}"`);
  }
  if (row) {
    if (!row.includes(`title="${BM148_COMPILED_TITLE}"`)) {
      throw new Error(`SCOPED_ASSERTION: BM-148 provenance missing compiledTitle`);
    }
    if (!row.includes('BM-148__')) {
      throw new Error(`SCOPED_ASSERTION: BM-148 provenance missing own extract reference`);
    }
    if (!row.includes(BM148_CODE + '.compiled.json')) {
      throw new Error(`SCOPED_ASSERTION: BM-148 provenance missing own compiled reference`);
    }
    // Sibling cross-references must not appear
    const crossPointers = ['BM-146', 'BM-147', 'BM-149', 'BM-150', 'BM-151', 'BM-152', 'BM-153'];
    for (const sibling of crossPointers) {
      if (sibling !== BM148_CODE && row.includes(sibling + '.compiled.json')) {
        throw new Error(`SCOPED_ASSERTION: BM-148 provenance contains sibling pointer "${sibling}"`);
      }
    }
  }
}

export function assertBm148PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  // Field count invariant
  if (c.source?.fields && c.source.fields.length !== 30) {
    throw new Error(`SCOPED_ASSERTION: BM-148 has ${c.source.fields.length} compiled fields — expected 30`);
  }
  // Section count invariant
  if (c.source?.sections && c.source.sections.length !== 6) {
    throw new Error(`SCOPED_ASSERTION: BM-148 has ${c.source.sections.length} compiled sections — expected 6`);
  }
  // Every section must have a description
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: BM-148 section "${sec.id}" has empty description`);
    }
  }
  // Phantom sections forbidden
  const compiledSectionIds = (c.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (!compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: BM-148 contains phantom section "${sec.id}"`);
    }
  }
  // Generated placeholder markers forbidden
  const src = JSON.stringify(profile ?? {});
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: BM-148 contains generated placeholder marker`);
  }
  // Generic fabricated values forbidden
  if (src.includes('Nhap noi dung') || src.includes('Tran Van Binh')) {
    throw new Error(`SCOPED_ASSERTION: BM-148 contains generic fabricated values`);
  }
}

export function assertBm148ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) return;
  if (!row.includes(BM148_CODE)) {
    throw new Error(`SCOPED_ASSERTION: BM-148 provenance row missing form code`);
  }
  if (!row.includes('DÌNH CHỈ BỊ CAN')) {
    throw new Error(`SCOPED_ASSERTION: BM-148 provenance row missing procedure subfamily marker`);
  }
  if (!row.includes('Điều 41')) {
    throw new Error(`SCOPED_ASSERTION: BM-148 provenance row missing legal basis`);
  }
}

// ============================================================
// SCOPED MUTATION ASSERTIONS — BM-149
// ============================================================

const BM149_CODE = 'BM-149';
const BM149_COMPILED_TITLE = 'QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can';
const BM149_PROFILE_VAR = 'BM149_RUNTIME_UX_PROFILE';

export function assertBm149DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM149_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-149 templateCode is "${prof.templateCode}"`);
  }
  if (prof.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: BM-149 must NOT be runtimeReady`);
  }
  if (c.templateCode && c.templateCode !== BM149_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-149 compiled.templateCode is "${c.templateCode}"`);
  }
  if (c.title && c.title !== BM149_COMPILED_TITLE) {
    throw new Error(`SCOPED_ASSERTION: BM-149 compiled.title is "${c.title}"`);
  }
  if (row) {
    if (!row.includes(`title="${BM149_COMPILED_TITLE}"`)) {
      throw new Error(`SCOPED_ASSERTION: BM-149 provenance missing compiledTitle`);
    }
    if (!row.includes('BM-149__')) {
      throw new Error(`SCOPED_ASSERTION: BM-149 provenance missing own extract reference`);
    }
    if (!row.includes(BM149_CODE + '.compiled.json')) {
      throw new Error(`SCOPED_ASSERTION: BM-149 provenance missing own compiled reference`);
    }
    const crossPointers = ['BM-146', 'BM-147', 'BM-148', 'BM-150', 'BM-151', 'BM-152', 'BM-153'];
    for (const sibling of crossPointers) {
      if (sibling !== BM149_CODE && row.includes(sibling + '.compiled.json')) {
        throw new Error(`SCOPED_ASSERTION: BM-149 provenance contains sibling pointer "${sibling}"`);
      }
    }
  }
}

export function assertBm149PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 6) {
    throw new Error(`SCOPED_ASSERTION: BM-149 has ${c.source.fields.length} compiled fields — expected 6`);
  }
  if (c.source?.sections && c.source.sections.length !== 1) {
    throw new Error(`SCOPED_ASSERTION: BM-149 has ${c.source.sections.length} compiled sections — expected 1`);
  }
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: BM-149 section "${sec.id}" has empty description`);
    }
  }
  const compiledSectionIds = (c.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (!compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: BM-149 contains phantom section "${sec.id}"`);
    }
  }
  const src = JSON.stringify(profile ?? {});
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: BM-149 contains generated placeholder marker`);
  }
  if (src.includes('Nhap noi dung') || src.includes('Tran Van Binh')) {
    throw new Error(`SCOPED_ASSERTION: BM-149 contains generic fabricated values`);
  }
}

export function assertBm149ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) return;
  if (!row.includes(BM149_CODE)) {
    throw new Error(`SCOPED_ASSERTION: BM-149 provenance row missing form code`);
  }
  if (!row.includes('DÌNH CHỈ BỊ CAN')) {
    throw new Error(`SCOPED_ASSERTION: BM-149 provenance row missing procedure subfamily marker`);
  }
  if (!row.includes('Điều 41')) {
    throw new Error(`SCOPED_ASSERTION: BM-149 provenance row missing legal basis`);
  }
}

// ============================================================
// SCOPED MUTATION ASSERTIONS — BM-152
// ============================================================

const BM152_CODE = 'BM-152';
const BM152_COMPILED_TITLE = 'QĐ đình chỉ vụ án đối với bị can';
const BM152_PROFILE_VAR = 'BM152_RUNTIME_UX_PROFILE';

export function assertBm152DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM152_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-152 templateCode is "${prof.templateCode}"`);
  }
  if (prof.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: BM-152 must NOT be runtimeReady`);
  }
  if (c.templateCode && c.templateCode !== BM152_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-152 compiled.templateCode is "${c.templateCode}"`);
  }
  if (c.title && c.title !== BM152_COMPILED_TITLE) {
    throw new Error(`SCOPED_ASSERTION: BM-152 compiled.title is "${c.title}"`);
  }
  if (row) {
    if (!row.includes(`title="${BM152_COMPILED_TITLE}"`)) {
      throw new Error(`SCOPED_ASSERTION: BM-152 provenance missing compiledTitle`);
    }
    if (!row.includes('BM-152__')) {
      throw new Error(`SCOPED_ASSERTION: BM-152 provenance missing own extract reference`);
    }
    if (!row.includes(BM152_CODE + '.compiled.json')) {
      throw new Error(`SCOPED_ASSERTION: BM-152 provenance missing own compiled reference`);
    }
    const crossPointers = ['BM-146', 'BM-147', 'BM-148', 'BM-149', 'BM-150', 'BM-151', 'BM-153'];
    for (const sibling of crossPointers) {
      if (sibling !== BM152_CODE && row.includes(sibling + '.compiled.json')) {
        throw new Error(`SCOPED_ASSERTION: BM-152 provenance contains sibling pointer "${sibling}"`);
      }
    }
  }
}

export function assertBm152PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 9) {
    throw new Error(`SCOPED_ASSERTION: BM-152 has ${c.source.fields.length} compiled fields — expected 9`);
  }
  if (c.source?.sections && c.source.sections.length !== 1) {
    throw new Error(`SCOPED_ASSERTION: BM-152 has ${c.source.sections.length} compiled sections — expected 1`);
  }
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: BM-152 section "${sec.id}" has empty description`);
    }
  }
  const compiledSectionIds = (c.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (!compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: BM-152 contains phantom section "${sec.id}"`);
    }
  }
  const src = JSON.stringify(profile ?? {});
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: BM-152 contains generated placeholder marker`);
  }
  if (src.includes('Nhap noi dung') || src.includes('Tran Van Binh')) {
    throw new Error(`SCOPED_ASSERTION: BM-152 contains generic fabricated values`);
  }
}

export function assertBm152ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) return;
  if (!row.includes(BM152_CODE)) {
    throw new Error(`SCOPED_ASSERTION: BM-152 provenance row missing form code`);
  }
  if (!row.includes('DÌNH CHỈ BỊ CAN')) {
    throw new Error(`SCOPED_ASSERTION: BM-152 provenance row missing procedure subfamily marker`);
  }
  if (!row.includes('Điều 41')) {
    throw new Error(`SCOPED_ASSERTION: BM-152 provenance row missing legal basis`);
  }
}

// ============================================================
// SCOPED MUTATION ASSERTIONS — BM-153
// ============================================================

const BM153_CODE = 'BM-153';
const BM153_COMPILED_TITLE = 'QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can';
const BM153_PROFILE_VAR = 'BM153_RUNTIME_UX_PROFILE';

export function assertBm153DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode && prof.templateCode !== BM153_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-153 templateCode is "${prof.templateCode}"`);
  }
  if (prof.runtimeReady === true) {
    throw new Error(`SCOPED_ASSERTION: BM-153 must NOT be runtimeReady`);
  }
  if (c.templateCode && c.templateCode !== BM153_CODE) {
    throw new Error(`SCOPED_ASSERTION: BM-153 compiled.templateCode is "${c.templateCode}"`);
  }
  if (c.title && c.title !== BM153_COMPILED_TITLE) {
    throw new Error(`SCOPED_ASSERTION: BM-153 compiled.title is "${c.title}"`);
  }
  if (row) {
    if (!row.includes(`title="${BM153_COMPILED_TITLE}"`)) {
      throw new Error(`SCOPED_ASSERTION: BM-153 provenance missing compiledTitle`);
    }
    if (!row.includes('BM-153__')) {
      throw new Error(`SCOPED_ASSERTION: BM-153 provenance missing own extract reference`);
    }
    if (!row.includes(BM153_CODE + '.compiled.json')) {
      throw new Error(`SCOPED_ASSERTION: BM-153 provenance missing own compiled reference`);
    }
    const crossPointers = ['BM-146', 'BM-147', 'BM-148', 'BM-149', 'BM-150', 'BM-151', 'BM-152'];
    for (const sibling of crossPointers) {
      if (sibling !== BM153_CODE && row.includes(sibling + '.compiled.json')) {
        throw new Error(`SCOPED_ASSERTION: BM-153 provenance contains sibling pointer "${sibling}"`);
      }
    }
  }
}

export function assertBm153PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  if (c.source?.fields && c.source.fields.length !== 5) {
    throw new Error(`SCOPED_ASSERTION: BM-153 has ${c.source.fields.length} compiled fields — expected 5`);
  }
  if (c.source?.sections && c.source.sections.length !== 1) {
    throw new Error(`SCOPED_ASSERTION: BM-153 has ${c.source.sections.length} compiled sections — expected 1`);
  }
  for (const sec of sections) {
    if (!sec.description?.trim()) {
      throw new Error(`SCOPED_ASSERTION: BM-153 section "${sec.id}" has empty description`);
    }
  }
  const compiledSectionIds = (c.source?.sections ?? []).map((s) => s.id);
  for (const sec of sections) {
    if (!compiledSectionIds.includes(sec.id)) {
      throw new Error(`SCOPED_ASSERTION: BM-153 contains phantom section "${sec.id}"`);
    }
  }
  const src = JSON.stringify(profile ?? {});
  if (/\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(src)) {
    throw new Error(`SCOPED_ASSERTION: BM-153 contains generated placeholder marker`);
  }
  if (src.includes('Nhap noi dung') || src.includes('Tran Van Binh')) {
    throw new Error(`SCOPED_ASSERTION: BM-153 contains generic fabricated values`);
  }
}

export function assertBm153ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) return;
  if (!row.includes(BM153_CODE)) {
    throw new Error(`SCOPED_ASSERTION: BM-153 provenance row missing form code`);
  }
  if (!row.includes('DÌNH CHỈ BỊ CAN')) {
    throw new Error(`SCOPED_ASSERTION: BM-153 provenance row missing procedure subfamily marker`);
  }
  if (!row.includes('Điều 41')) {
    throw new Error(`SCOPED_ASSERTION: BM-153 provenance row missing legal basis`);
  }
}

// ============================================================
// FAMILY-LEVEL ASSERTIONS
// ============================================================

export function assertFamilyBoundary(provenanceContent) {
  const src = provenanceContent ?? '';
  // ĐÌNH CHỈ BỊ CAN forms must NOT cross-reference ĐÌNH CHỈ VỤ ÁN forms
  const dinhChiVuAnForms = ['BM-146', 'BM-147', 'BM-150', 'BM-151'];
  const dinhChiBiCanForms = ['BM-148', 'BM-149', 'BM-152', 'BM-153'];
  
  for (const vuAn of dinhChiVuAnForms) {
    if (src.includes(`| ${vuAn} |`) && src.includes('| BM-148 |')) {
      // Check if BM-148 row references a ĐÌNH CHỈ VỤ ÁN form
      const bm148Section = src.substring(src.indexOf('| BM-148 |'), src.indexOf('| BM-149 |') || src.indexOf('| BM-152 |') || src.length);
      if (bm148Section.includes(vuAn + '.compiled.json')) {
        throw new Error(`SCOPED_ASSERTION: ĐÌNH CHỈ BỊ CAN family contains cross-family pointer`);
      }
    }
  }
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

describe('BM-148/149/152/153 ĐÌNH CHỈ BỊ CAN curation', { concurrency: false }, () => {

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

      it(`${code} provenance row exists in ledger`, () => {
        const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
        assert.ok(ledger.includes(`| ${code} |`), `${code} must have a provenance row`);
      });

      it(`${code} provenance row contains compiled title`, () => {
        const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
        assert.ok(ledger.includes(`title="${title}"`), `${code} provenance must include compiled title`);
      });

      it(`${code} provenance row contains extract reference`, () => {
        const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
        assert.ok(ledger.includes(`${code}__`), `${code} provenance must reference own extract`);
      });

      it(`${code} provenance row contains compiled reference`, () => {
        const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
        assert.ok(ledger.includes(`${code}.compiled.json`), `${code} provenance must reference own compiled`);
      });

      it(`${code} provenance row contains procedure subfamily`, () => {
        const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
        assert.ok(ledger.includes('ĐÌNH CHỈ BỊ CAN'), `${code} provenance must include procedure subfamily`);
      });

      it(`${code} provenance row contains legal basis`, () => {
        const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
        assert.ok(ledger.includes('Điều 41'), `${code} provenance must include legal basis`);
      });

      it(`${code} provenance row has no cross-family sibling pointers`, () => {
        const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
        const start = ledger.indexOf(`| ${code} |`);
        const nextStart = ledger.indexOf('| BM-', start + 3);
        const rowContent = ledger.substring(start, nextStart > 0 ? nextStart : ledger.length);
        
        const crossFamily = ['BM-146', 'BM-147', 'BM-150', 'BM-151'];
        for (const sibling of crossFamily) {
          assert.ok(
            !rowContent.includes(sibling + '.compiled.json'),
            `${code} provenance must not cross-reference ${sibling}`,
          );
        }
      });

    });
  }

  // Family-level test
  describe('Family-level', () => {
    it('ĐÌNH CHỈ BỊ CAN family has 4 forms in provenance', () => {
      const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
      const count = (ledger.match(/\| BM-(148|149|152|153) \|/g) ?? []).length;
      assert.strictEqual(count, 4, 'Expected 4 ĐÌNH CHỈ BỊ CAN forms in provenance');
    });

    it('ĐÌNH CHỈ BỊ CAN family has distinct operative verbs', () => {
      const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
      // Each form must have its distinct operative verb
      assert.ok(ledger.includes('TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN'), 'BM-148 operative verb present');
      assert.ok(ledger.includes('HỦY BỎ QUYẾT ĐỊNH TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN'), 'BM-149 operative verb present');
      assert.ok(ledger.includes('ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN'), 'BM-152 operative verb present');
      assert.ok(ledger.includes('HỦY BỎ QUYẾT ĐỊNH ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN'), 'BM-153 operative verb present');
    });

    it('ĐÌNH CHỈ BỊ CAN family is distinct from ĐÌNH CHỈ VỤ ÁN family', () => {
      const ledger = fs.readFileSync(PROVENANCE_LEDGER, 'utf8');
      // ĐÌNH CHỈ VỤ ÁN family (BM-146/147/150/151) must NOT contain BỊ CAN markers
      const bm146Section = ledger.substring(
        ledger.indexOf('| BM-146 |'),
        ledger.indexOf('| BM-147 |') || ledger.length,
      );
      const bm147Section = ledger.substring(
        ledger.indexOf('| BM-147 |'),
        ledger.indexOf('| BM-150 |') || ledger.length,
      );
      assert.ok(!bm146Section.includes('ĐỐI VỚI BỊ CAN'), 'BM-146 must not contain BỊ CAN');
      assert.ok(!bm147Section.includes('ĐỐI VỚI BỊ CAN'), 'BM-147 must not contain BỊ CAN');
    });
  });

});
