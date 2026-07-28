/**
 * BM-138 — Yêu cầu cung cấp tài liệu (request for evidence).
 *
 * Source contract: `docs/audit/docx/compiled-v2/BM-138.compiled.json`
 * Source extract:  `docs/audit/docx/extracted/BM-138__bf31a1f547b0.extract.md`
 *
 * Compatibility presentation policy (authoritative for this curation turn):
 *   - 7 compiled fields, all TEXT.
 *   - One compiled section `section-thong-tin-bieu-mau`.
 *   - Document identity: `agency.vienKiem` = "Viện kiểm sát ban hành yêu cầu"
 *     (P0058 + P0059 + P0060 authority footnotes — FOOTNOTE / MEDIUM).
 *   - Request number: `document.soQuyet` = "Số yêu cầu cung cấp tài liệu"
 *     (P0005 "Số:" + P0006 "/YC-VKS" — DIRECT_SLOT / HIGH. The DOCX
 *     carries a literal "/YC-VKS" suffix token, distinct from a
 *     fabricated /BB-VKS prefix; this is a real source slot).
 *   - Issuing locality: `agency.diaDanh` = "Địa danh ban hành yêu cầu"
 *     (P0007–P0009 event-date sequence + P0061 "Ghi địa danh là tên
 *     tỉnh/thành phố nơi đặt trụ sở của Viện kiểm sát ban hành" —
 *     DIRECT_SLOT / HIGH).
 *   - Issue date: `document.ngayBan` = "Ngày ban hành yêu cầu"
 *     (P0007 ", ngày" + P0008 "tháng" + P0009 "năm 20" event-date
 *     sequence — DIRECT_SLOT / HIGH).
 *   - Supplementary locality-line: `agency.dongDia` =
 *     "Dòng địa danh bổ sung (nếu hồ sơ có)"
 *     (P0058 + P0061 — FOOTNOTE / MEDIUM, carries "(nếu hồ sơ có)"
 *     suffix per contract-only convention; no combined locality+date
 *     paragraph in extract).
 *   - Requested recipient: `document.chuThe` =
 *     "Cơ quan/tổ chức/cá nhân phải cung cấp" (P0045 "Cơ quan/tổ chức/cá
 *     nhân" + P0046 "cung cấp những tài liệu liên quan đến hành vi, quyết
 *     định tố tụng vi phạm pháp luật trong điều tra" + P0066 "Ghi tên cơ
 *     quan/tổ chức/người có trách nhiệm phải cung cấp tài liệu" —
 *     DIRECT_SLOT / HIGH).
 *   - Accused/suspect subject: `person.tenBi` = "Họ tên người hoặc tên
 *     pháp nhân bị khởi tố" (P0064 "Ghi họ tên người hoặc tên pháp nhân
 *     bị khởi tố" — FOOTNOTE / MEDIUM).
 *   - Document family: YÊU CẦU; procedure subfamily: cung cấp tài liệu
 *     — investigation stage.
 *   - Legal workflow basis: P0014 "Căn cứ các điều 41, 166 và 167 của
 *     Bộ luật Tố tụng hình sự" — Điều 41 + Điều 166 + Điều 167 BLTTHS,
 *     DIRECT_SLOT / HIGH. This is a literal source citation, NOT a
 *     contextual workflow inference, because BM-138's own extract
 *     contains a real paragraph citing these articles.
 *   - Adjacent forms are intentionally NOT siblings: BM-139 and BM-140
 *     are "Kiến nghị" (recommendation) family; BM-141 / BM-142 /
 *     BM-143 are "Quyết định" (decision) family of the prosecution
 *     stage. BM-138 is an ISOLATED SINGLETON request family.
 *
 * Scoped semantic assertions (split into three independent gates):
 *   - assertBm138DocumentIdentity(compiled, provenanceRow, profile)
 *     throws on any mutation of identity-bearing objects.
 *   - assertBm138PresentationIdentity(profile, compiled) throws on
 *     any mutation of presentation labels/sections/demo.
 *   - assertBm138ProvenanceIdentity(provenanceRow) throws on any
 *     mutation of provenance row contents.
 *
 * Run: node --test test/forms/bm138-curation.test.mjs
 */

import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(TEST_DIR, '..', '..');

const helperUrl = pathToFileURL(
  resolve(PROJECT_ROOT, 'test/forms/helpers/runtime-ux-curation-validator.mjs'),
).href;
const { loadProfile, validateCuration } = await import(helperUrl);

const provenanceUrl = pathToFileURL(
  resolve(PROJECT_ROOT, 'test/forms/helpers/provenance-source-integrity.mjs'),
).href;
const {
  readProvenanceLedger,
  findProvenanceRow,
  PROJECT_ROOT: HELPER_PROJECT_ROOT,
} = await import(provenanceUrl);

assert.equal(
  HELPER_PROJECT_ROOT,
  PROJECT_ROOT,
  'PROJECT_ROOT mismatch between provenance helper and test root',
);

const requireFromHere = createRequire(import.meta.url);
const fs = requireFromHere('node:fs');

const BM138_CODE = 'BM-138';
const BM138_PROFILE_VAR = 'BM138_RUNTIME_UX_PROFILE';
const BM138_COMPILED_PATH =
  'docs/audit/docx/compiled-v2/BM-138.compiled.json';
const BM138_EXTRACT_PATH =
  'docs/audit/docx/extracted/BM-138__bf31a1f547b0.extract.md';
const BM138_COMPILED_TITLE =
  'Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng có vi phạm pháp luật trong điều tra';
const BM138_EXTRACT_HEADING = 'YÊU CẦU';
const BM138_COMPILED_FILE_SHA256 =
  'f71babae54230a87a15b8f88e240f9b19aadb99c8a51e3bd50aeadcff2fa29b5';
const BM138_EXTRACT_FILE_SHA256 =
  'e96dff737424760663f7e0fcdbacc01fdec73a7e83f9010cc4e37bfea451e600';

// Sibling-form titles / headings (used as forbidden targets in
// document-identity mutations).
const BM139_TITLE_FRAGMENT = 'Kiến nghị';
const BM139_HEADING_FRAGMENT = 'KIẾN NGHỊ';
const BM141_TITLE_FRAGMENT = 'Quyết định';
const BM141_HEADING_FRAGMENT = 'QUYẾT ĐỊNH';
const BM134_TITLE_FRAGMENT = 'BB ghi lời khai';
const BM135_TITLE_FRAGMENT = 'BB hỏi cung bị can';
const BM136_TITLE_FRAGMENT = 'BB đối chất';

const BM138_EXPECTED_FIELDS = [
  'agency.vienKiem',
  'document.soQuyet',
  'agency.diaDanh',
  'document.ngayBan',
  'agency.dongDia',
  'document.chuThe',
  'person.tenBi',
];

function loadContract(code) {
  const p = resolve(
    PROJECT_ROOT,
    `docs/audit/docx/compiled-v2/${code}.compiled.json`,
  );
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadProfileFor(code, profileVar) {
  const p = resolve(
    PROJECT_ROOT,
    `apps/web/src/lib/runtime-ux/bm${code.slice(3)}-runtime-ux-profile.ts`,
  );
  return loadProfile(p, profileVar);
}

// ============================================================
// SCOPED DOCUMENT-IDENTITY ASSERTION
// ============================================================

export function assertBm138DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  if (prof.templateCode !== BM138_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 profile.templateCode is "${prof.templateCode}" — must be "${BM138_CODE}"`,
    );
  }
  if (c.templateCode && c.templateCode !== BM138_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 compiled.templateCode is "${c.templateCode}" — must be "${BM138_CODE}"`,
    );
  }
  if (c.title && c.title !== BM138_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 compiled.title is "${c.title}" — must be "${BM138_COMPILED_TITLE}"`,
    );
  }
  if (c.source?.title && c.source.title !== BM138_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 compiled.source.title is "${c.source.title}" — must be "${BM138_COMPILED_TITLE}"`,
    );
  }
  if (row) {
    const expectedCompiledTitleMarker = `title="${BM138_COMPILED_TITLE}"`;
    if (!row.includes(expectedCompiledTitleMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 provenance row missing compiledTitle marker "${expectedCompiledTitleMarker}"`,
      );
    }
  }
  if (row) {
    const expectedHeadingMarker = `heading="${BM138_EXTRACT_HEADING}"`;
    if (!row.includes(expectedHeadingMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 provenance row missing extractHeading marker "${expectedHeadingMarker}"`,
      );
    }
  }
  if (row) {
    const forbiddenIdentityMarkers = [
      // Sibling forms must NOT appear as the BM-138 title.
      BM134_TITLE_FRAGMENT,
      BM135_TITLE_FRAGMENT,
      BM136_TITLE_FRAGMENT,
    ];
    for (const m of forbiddenIdentityMarkers) {
      if (row.includes(m)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-138 provenance row contains sibling identity marker "${m}"`,
        );
      }
    }
  }
  if (row && !row.includes(BM138_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 provenance row does not reference own compiled path "${BM138_COMPILED_PATH}"`,
    );
  }
  if (row && !row.includes(BM138_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 provenance row does not reference own extract "${BM138_EXTRACT_PATH}"`,
    );
  }
  if (row && !row.includes(BM138_COMPILED_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-138 provenance row does not include own compiled SHA256',
    );
  }
  if (row && !row.includes(BM138_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-138 provenance row does not include own extract SHA256',
    );
  }
  if (row) {
    const crossPointers = [
      'docs/audit/docx/compiled-v2/BM-134.compiled.json',
      'docs/audit/docx/compiled-v2/BM-135.compiled.json',
      'docs/audit/docx/compiled-v2/BM-136.compiled.json',
      'docs/audit/docx/compiled-v2/BM-139.compiled.json',
      'docs/audit/docx/compiled-v2/BM-141.compiled.json',
      'BM-139__',
      'BM-141__',
    ];
    for (const p of crossPointers) {
      if (row.includes(p)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-138 provenance row contains cross-form pointer "${p}"`,
        );
      }
    }
  }
}

// ============================================================
// SCOPED PRESENTATION-IDENTITY ASSERTION
// ============================================================

export function assertBm138PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const fields = prof.fields ?? {};
  const demo = prof.demo ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  // 1. Compiled contract field count must be exactly 7.
  if (c.source?.fields && c.source.fields.length !== 7) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 compiled contract has ${c.source.fields.length} fields — must be exactly 7`,
    );
  }
  // 2. Single compiled section. Phantom sections like "section-chu-the"
  //    or "section-dong-ngay" are forbidden.
  if (sections.length !== 1) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 presentationSections.length is ${sections.length} — must be exactly 1 (the compiled section-thong-tin-bieu-mau)`,
    );
  }
  for (const sec of sections) {
    if (sec.id !== 'section-thong-tin-bieu-mau') {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 presentationSection id is "${sec.id}" — must be "section-thong-tin-bieu-mau" (phantom section detected)`,
      );
    }
    if (!sec.description?.trim()) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 presentationSection "${sec.id}" has empty description`,
      );
    }
  }
  // 3. Compiled fields must appear exactly once across presentationSections.
  if (c.source?.fields) {
    const compiledKeys = c.source.fields.map((f) => f.key);
    const presented = sections.flatMap((s) => s.fieldKeys ?? []);
    for (const key of compiledKeys) {
      const count = presented.filter((k) => k === key).length;
      if (count !== 1) {
        throw new Error(
          `SCOPED_ASSERTION: BM-138 field "${key}" appears ${count} times in presentationSections — must be exactly 1`,
        );
      }
    }
    for (const key of presented) {
      if (!compiledKeys.includes(key)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-138 presentationSection contains field "${key}" — not in compiled contract`,
        );
      }
    }
  }
  // 4. Compatibility-mapped labels must match.
  const labelExpect = {
    'agency.vienKiem': 'Viện kiểm sát ban hành yêu cầu',
    'document.soQuyet': 'Số yêu cầu cung cấp tài liệu',
    'agency.diaDanh': 'Địa danh ban hành yêu cầu',
    'document.ngayBan': 'Ngày ban hành yêu cầu',
    'agency.dongDia': 'Dòng địa danh bổ sung (nếu hồ sơ có)',
    'document.chuThe': 'Cơ quan/tổ chức/cá nhân phải cung cấp',
    'person.tenBi': 'Họ tên người hoặc tên pháp nhân bị khởi tố',
  };
  for (const [key, expectedLabel] of Object.entries(labelExpect)) {
    if (fields[key]?.label !== expectedLabel) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 ${key} label is "${fields[key]?.label}" — must be "${expectedLabel}"`,
      );
    }
  }
  // 5. Contract-only supplementary field must keep "(nếu hồ sơ có)" suffix.
  for (const key of ['agency.dongDia']) {
    const lbl = fields[key]?.label ?? '';
    if (!lbl.includes('(nếu hồ sơ có)')) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 contract-only field "${key}" label "${lbl}" must include "(nếu hồ sơ có)" suffix`,
      );
    }
  }
  // 6. Forbidden surface tokens.
  const BM138_FORBIDDEN_TOKENS = [
    'BB hỏi cung bị can',
    'BB ghi lời khai',
    'BB đối chất',
    'Tên bị can',
    'Tên bị cáo',
    'Người bị áp dụng',
    'Chủ thể liên quan',
    // 'Địa danh ban hành' would false-positive on the curated
    // 'agency.diaDanh' label "Địa danh ban hành yêu cầu"; instead,
    // forbid the precise compiled-only label fragment.
    'Số quyết định',
    // 'Ngày ban hành' would false-positive on the curated 'document.ngayBan'
    // label "Ngày ban hành yêu cầu"; omit it here.
    '/BB-VKS',
    'BB-138/VKSKV7',
    '/VKSKV7',
    '(mẫu BM-138)',
  ];
  // Empty-token surface: forbid the suffix-only label "Địa danh ban hành"
  // when the curated label keeps the "yêu cầu" suffix. The mutation
  // test below targets the bare suffix.
  const FORBIDDEN_SUFFIX_LABELS = [
    { field: 'agency.diaDanh', forbiddenBare: 'Địa danh ban hành', curatedSuffix: 'yêu cầu' },
    { field: 'document.ngayBan', forbiddenBare: 'Ngày ban hành', curatedSuffix: 'yêu cầu' },
  ];
  const blob = JSON.stringify({ fields, demo, presentationSections: sections });
  for (const token of BM138_FORBIDDEN_TOKENS) {
    if (blob.includes(token)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 profile contains forbidden surface token "${token}"`,
      );
    }
  }
  // Per-field suffix protection: the curated 'agency.diaDanh' / 'document.ngayBan'
  // labels MUST keep their case-specific suffix ("yêu cầu"); the bare
  // generic label fragment "Địa danh ban hành" / "Ngày ban hành"
  // (which would be ambiguous against other forms such as BM-001/
  // BM-171 issuing-locality/issue-date labels) is forbidden.
  for (const { field, forbiddenBare, curatedSuffix } of FORBIDDEN_SUFFIX_LABELS) {
    const lbl = fields[field]?.label ?? '';
    if (lbl && lbl.trim() === forbiddenBare) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 ${field} label "${lbl}" must keep its case-specific suffix "${curatedSuffix}"`,
      );
    }
  }
  // 7. Demo values must NOT carry fabricated identifiers.
  for (const value of Object.values(demo)) {
    const s = String(value ?? '');
    const stripped = s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    if (
      /le minh k/i.test(stripped) ||
      /lua dao/i.test(stripped) ||
      /chiem doat/i.test(stripped) ||
      /tran van/i.test(stripped) ||
      /nguyen van/i.test(stripped)
    ) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 demo contains fabricated identifier: "${s}"`,
      );
    }
  }
  // 8. Demo values must not contain "/YC-VKS" with a fabricated prefix
  //    (e.g. "/VKSKV7"). Empty-string demos are allowed; a non-empty
  //    demo must not fabricate the requested document number.
  for (const [k, v] of Object.entries(demo)) {
    const s = String(v ?? '');
    if (s.length > 0 && /\/(VKSKV7|BB-VKS|VKS-138|VKS)/iu.test(s)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 demo "${k}" contains fabricated prefix: "${s}"`,
      );
    }
  }
}

// ============================================================
// SCOPED PROVENANCE-IDENTITY ASSERTION
// ============================================================

export function assertBm138ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) {
    throw new Error('SCOPED_ASSERTION: BM-138 provenance row is empty');
  }
  if (!/Yêu cầu cung cấp tài liệu/u.test(row)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-138 provenance row does not mention "Yêu cầu cung cấp tài liệu" workflow',
    );
  }
  // BM-138 must NOT claim sibling-document headings as its own identity.
  for (const forbidden of [
    'BB hỏi cung bị can',
    'BB ghi lời khai',
    'BB đối chất',
    'QUYẾT ĐỊNH',
    'KIẾN NGHỊ',
  ]) {
    if (row.includes(`heading="${forbidden}"`)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 provenance row contains forbidden sibling heading "${forbidden}"`,
      );
    }
  }
  if (!row.includes(BM138_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 provenance row missing own compiled path "${BM138_COMPILED_PATH}"`,
    );
  }
  if (!row.includes(BM138_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 provenance row missing own extract path "${BM138_EXTRACT_PATH}"`,
    );
  }
  if (!row.includes(BM138_COMPILED_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-138 provenance row missing own compiled SHA256',
    );
  }
  if (!row.includes(BM138_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-138 provenance row missing own extract SHA256',
    );
  }
  if (!row.includes(`title="${BM138_COMPILED_TITLE}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 provenance row missing compiledTitle marker title="${BM138_COMPILED_TITLE}"`,
    );
  }
  if (!row.includes(`heading="${BM138_EXTRACT_HEADING}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 provenance row missing extractHeading marker heading="${BM138_EXTRACT_HEADING}"`,
    );
  }
  // Exactly ONE heading="..." marker must appear in the row. Multiple
  // headings (e.g. after splicing another form's heading marker) would
  // contradict the document's singular identity.
  const headingMatches = row.match(/heading="([^"]+)"/gu) ?? [];
  if (headingMatches.length > 1) {
    throw new Error(
      `SCOPED_ASSERTION: BM-138 provenance row declares ${headingMatches.length} heading markers — must be exactly 1`,
    );
  }
  // BM-138's legal basis is a direct citation (P0014 cites Điều 41, 166,
  // 167 BLTTHS). Therefore the row must declare P0014 as a workflow source
  // slot AND must mention these article numbers.
  if (!row.includes('P0014')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-138 provenance row must anchor P0014 legal-basis paragraph',
    );
  }
  for (const article of ['Điều 41', 'Điều 166', 'Điều 167']) {
    if (!row.includes(article)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-138 provenance row must mention literal article citation "${article}"`,
      );
    }
  }
}

// ============================================================
// COMBINED SEMANTIC IDENTITY (exported for backwards compat)
// ============================================================

export function assertBm138SemanticIdentity(profile, provenanceRow, compiled) {
  assertBm138DocumentIdentity(profile, provenanceRow, compiled);
  assertBm138PresentationIdentity(profile, compiled);
  assertBm138ProvenanceIdentity(provenanceRow);
}

describe('BM-138 invariant tests (Section 18)', () => {
  let profile;
  let provenanceRow;
  let compiled;

  before(() => {
    profile = loadProfileFor(BM138_CODE, BM138_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM138_CODE);
    compiled = loadContract(BM138_CODE);
  });

  it('BM-138 profile.templateCode is "BM-138"', () => {
    assert.equal(profile.templateCode, BM138_CODE);
  });

  it('BM-138 profile has 7 fields matching the compiled contract', () => {
    const keys = Object.keys(profile.fields);
    assert.equal(keys.length, 7);
    for (const k of BM138_EXPECTED_FIELDS) {
      assert.ok(keys.includes(k), `BM-138 profile missing field "${k}"`);
    }
  });

  it('BM-138 demo has 7 values matching the compiled contract', () => {
    const keys = Object.keys(profile.demo);
    assert.equal(keys.length, 7);
  });

  it('BM-138 has exactly one presentationSection: section-thong-tin-bieu-mau', () => {
    const sections = profile.presentationSections;
    assert.ok(Array.isArray(sections), 'presentationSections must be an array');
    assert.equal(sections.length, 1);
    assert.equal(sections[0].id, 'section-thong-tin-bieu-mau');
    assert.ok(
      sections[0].description?.trim(),
      'BM-138 presentationSection must have a non-empty description',
    );
  });

  it('BM-138 no generated "(mẫu BM-138)" markers in placeholders', () => {
    for (const [k, v] of Object.entries(profile.fields)) {
      const ph = String(v.placeholder ?? '');
      assert.ok(
        !/\(m(?:ẫu|áº«u)\s+BM-138\)/iu.test(ph),
        `BM-138 field "${k}" placeholder "${ph}" must not contain generated "(mẫu BM-138)" marker`,
      );
    }
  });

  it('BM-138 demo does not contain /BB-VKS or /VKSKV7 prefix', () => {
    for (const [k, v] of Object.entries(profile.demo)) {
      const s = String(v ?? '');
      assert.ok(
        !/\/BB-VKS/i.test(s) && !/\/VKSKV7/i.test(s),
        `BM-138 demo field "${k}" value "${s}" must not contain /BB-VKS or /VKSKV7 prefix`,
      );
    }
  });

  it('BM-138 profile passes shared validator (validateCuration) with empty issues', () => {
    const issues = validateCuration(profile, compiled, provenanceRow);
    assert.deepEqual(
      issues,
      [],
      `BM-138 shared validator must report zero issues — got: ${JSON.stringify(issues, null, 2)}`,
    );
  });

  it('BM-138 provenance row exists with own extract SHA256', () => {
    assert.ok(provenanceRow, 'BM-138 provenance row must exist');
    assert.ok(provenanceRow.includes(BM138_EXTRACT_PATH));
    assert.ok(provenanceRow.includes(BM138_EXTRACT_FILE_SHA256));
  });

  it('BM-138 scoped document identity passes (no throw)', () => {
    assertBm138DocumentIdentity(profile, provenanceRow, compiled);
  });

  it('BM-138 scoped presentation identity passes (no throw)', () => {
    assertBm138PresentationIdentity(profile, compiled);
  });

  it('BM-138 scoped provenance identity passes (no throw)', () => {
    assertBm138ProvenanceIdentity(provenanceRow);
  });

  it('BM-138 scoped semantic identity passes (no throw)', () => {
    assertBm138SemanticIdentity(profile, provenanceRow, compiled);
  });
});

// ============================================================
// DOCUMENT-IDENTITY MUTATION MATRIX
// ============================================================

describe('BM-138 document-identity mutation matrix (Section 23)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM138_CODE, BM138_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM138_CODE);
    compiled = loadContract(BM138_CODE);
    verdicts = [];
  });

  function runDocMutation(name, mutator) {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    mutator({
      profile: cloneProfile,
      row: cloneRow,
      compiled: cloneCompiled,
    });
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm138SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION')
        ? 'SCOPED_ASSERTION'
        : 'OTHER';
      errMsg = err.message;
    }
    verdicts.push({
      mutation: name,
      expectedDetector: 'SCOPED_ASSERTION',
      actualDetector: detector,
      throws,
      errorMessage: errMsg,
      verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
    });
  }

  it('document-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 1. compiled.title → BM-134 title.
    runDocMutation('compiled-title-to-BM-134', ({ compiled: c }) => {
      c.title = BM134_TITLE_FRAGMENT;
      c.source.title = BM134_TITLE_FRAGMENT;
    });
    // 2. compiled.title → BM-135 title.
    runDocMutation('compiled-title-to-BM-135', ({ compiled: c }) => {
      c.title = BM135_TITLE_FRAGMENT;
      c.source.title = BM135_TITLE_FRAGMENT;
    });
    // 3. compiled.title → BM-136 title.
    runDocMutation('compiled-title-to-BM-136', ({ compiled: c }) => {
      c.title = BM136_TITLE_FRAGMENT;
      c.source.title = BM136_TITLE_FRAGMENT;
    });
    // 4. compiled.templateCode → BM-139.
    runDocMutation('compiled-templateCode-to-BM-139', ({ compiled: c }) => {
      c.templateCode = 'BM-139';
    });
    // 5. provenance row compiledTitle substring → BM-136 title.
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        `title="${BM138_COMPILED_TITLE}"`,
        `title="${BM136_TITLE_FRAGMENT}"`,
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm138SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION')
          ? 'SCOPED_ASSERTION'
          : 'OTHER';
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-compiledTitle-to-BM-136',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: detector,
        throws,
        errorMessage: errMsg,
        verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 6. provenance row extractHeading substring → Kiến nghị.
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        `heading="${BM138_EXTRACT_HEADING}"`,
        `heading="${BM139_HEADING_FRAGMENT}"`,
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm138SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION')
          ? 'SCOPED_ASSERTION'
          : 'OTHER';
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-extractHeading-to-KIEN-NGHI',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: detector,
        throws,
        errorMessage: errMsg,
        verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 7. provenance row references BM-139 compiled path.
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        BM138_COMPILED_PATH,
        'docs/audit/docx/compiled-v2/BM-139.compiled.json',
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm138SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION')
          ? 'SCOPED_ASSERTION'
          : 'OTHER';
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-compiledPath-to-BM-139',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: detector,
        throws,
        errorMessage: errMsg,
        verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 8. provenance row references BM-139 extract path.
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        BM138_EXTRACT_PATH,
        'docs/audit/docx/extracted/BM-139__23306e6022bd.extract.md',
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm138SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION')
          ? 'SCOPED_ASSERTION'
          : 'OTHER';
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-extractPath-to-BM-139',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: detector,
        throws,
        errorMessage: errMsg,
        verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 9. compiled field count inflation to 17.
    runDocMutation('compiled-field-count-to-17', ({ compiled: c }) => {
      const filler = { key: 'agency.foo', label: 'Foo', kind: 'TEXT' };
      while (c.source.fields.length < 17) c.source.fields.push(filler);
    });
    // 10. profile.templateCode → BM-141 (Quyết định sibling).
    runDocMutation('profile-templateCode-to-BM-141', ({ profile: p }) => {
      p.templateCode = 'BM-141';
    });
    // 11. profile.templateCode → BM-139 (Kiến nghị sibling).
    runDocMutation('profile-templateCode-to-BM-139', ({ profile: p }) => {
      p.templateCode = 'BM-139';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-138 document-identity mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 10,
      `BM-138 must reject at least 10 document-identity mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });

  it('every document-identity rejection starts with SCOPED_ASSERTION', () => {
    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    for (const v of rejected) {
      assert.ok(
        v.errorMessage.startsWith('SCOPED_ASSERTION'),
        `BM-138 doc-identity mutation "${v.mutation}" error message must start with SCOPED_ASSERTION — got: ${v.errorMessage}`,
      );
    }
  });
});

// ============================================================
// PRESENTATION-IDENTITY MUTATION MATRIX
// ============================================================

describe('BM-138 presentation-identity mutation matrix (Section 24)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM138_CODE, BM138_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM138_CODE);
    compiled = loadContract(BM138_CODE);
    verdicts = [];
  });

  function runPresMutation(name, mutator) {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    mutator({ profile: cloneProfile, row: cloneRow, compiled: cloneCompiled });
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm138PresentationIdentity(cloneProfile, cloneCompiled);
    } catch (err) {
      throws = true;
      detector = err.message.startsWith('SCOPED_ASSERTION')
        ? 'SCOPED_ASSERTION'
        : 'OTHER';
      errMsg = err.message;
    }
    verdicts.push({
      mutation: name,
      expectedDetector: 'SCOPED_ASSERTION',
      actualDetector: detector,
      throws,
      errorMessage: errMsg,
      verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
    });
  }

  it('presentation-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 1. agency.vienKiem label → "Tên cơ quan" (generic).
    runPresMutation('agency.vienKiem-to-Ten-co-quan', ({ profile: p }) => {
      p.fields['agency.vienKiem'].label = 'Tên cơ quan';
    });
    // 2. document.soQuyet label → "Số quyết định" (wrong document type).
    runPresMutation('document.soQuyet-to-So-quyet-dinh', ({ profile: p }) => {
      p.fields['document.soQuyet'].label = 'Số quyết định';
    });
    // 3. document.ngayBan label → "Ngày ban hành" (generic).
    runPresMutation('document.ngayBan-to-Ngay-ban-hanh', ({ profile: p }) => {
      p.fields['document.ngayBan'].label = 'Ngày ban hành';
    });
    // 4. agency.diaDanh label → "Địa danh ban hành" (generic).
    runPresMutation('agency.diaDanh-to-Dia-danh', ({ profile: p }) => {
      p.fields['agency.diaDanh'].label = 'Địa danh ban hành';
    });
    // 5. agency.dongDia suffix dropped.
    runPresMutation('agency.dongDia-suffix-dropped', ({ profile: p }) => {
      p.fields['agency.dongDia'].label = 'Dòng địa danh';
    });
    // 6. document.chuThe label → "Tên bị can" (procedural subject drift).
    runPresMutation('document.chuThe-to-Ten-bi-can', ({ profile: p }) => {
      p.fields['document.chuThe'].label = 'Tên bị can';
    });
    // 7. person.tenBi label → "Tên bị cáo".
    runPresMutation('person.tenBi-to-Ten-bi-cao', ({ profile: p }) => {
      p.fields['person.tenBi'].label = 'Tên bị cáo';
    });
    // 8. Reintroduce generated marker in placeholder.
    runPresMutation('placeholder-marker-reintro', ({ profile: p }) => {
      p.fields['agency.vienKiem'].placeholder = 'Tên cơ quan (mẫu BM-138)';
    });
    // 9. Demo value contains /BB-VKS prefix.
    runPresMutation('demo-bbvks-prefix', ({ profile: p }) => {
      p.demo['document.soQuyet'] = '12/BB-VKS';
    });
    // 10. Demo value contains fabricated /VKSKV7 prefix.
    runPresMutation('demo-vkskv7-prefix', ({ profile: p }) => {
      p.demo['document.soQuyet'] = '12/VKSKV7';
    });
    // 11. Demo fabricated person-name in date field.
    runPresMutation('demo-person-in-date', ({ profile: p }) => {
      p.demo['document.ngayBan'] = 'Tran Van Binh';
    });
    // 12. Demo fabricated person-name in tenBi field.
    runPresMutation('demo-fabricated-person-tenBi', ({ profile: p }) => {
      p.demo['person.tenBi'] = 'Le Minh K';
    });
    // 13. Phantom section `section-chu-the` reintroduced.
    runPresMutation('phantom-section-chu-the-reintro', ({ profile: p }) => {
      p.presentationSections = [
        {
          id: 'section-thong-tin-bieu-mau',
          title: 'Thông tin biểu mẫu',
          description: 'Thông tin biểu mẫu yêu cầu cung cấp tài liệu',
          fieldKeys: ['agency.vienKiem', 'document.soQuyet', 'agency.diaDanh', 'document.ngayBan'],
        },
        {
          id: 'section-chu-the',
          title: 'Chủ thể liên quan',
          description: 'Chủ thể phải cung cấp',
          fieldKeys: ['agency.dongDia', 'document.chuThe'],
        },
      ];
    });
    // 14. Duplicate fieldKeys in single section.
    runPresMutation('duplicate-field-in-section', ({ profile: p }) => {
      p.presentationSections[0].fieldKeys.push('agency.vienKiem');
    });
    // 15. Field outside contract added to presentationSection.
    runPresMutation('outside-contract-field', ({ profile: p }) => {
      p.presentationSections[0].fieldKeys.push('signature.nguoiKy');
    });
    // 16. Empty presentationSection description.
    runPresMutation('empty-section-description', ({ profile: p }) => {
      p.presentationSections[0].description = '';
    });
    // 17. Wrong section ID.
    runPresMutation('wrong-section-id', ({ profile: p }) => {
      p.presentationSections[0].id = 'section-fabricated';
    });
    // 18. Inject forbidden sibling heading into a label.
    runPresMutation('label-injects-bb-doi-chat', ({ profile: p }) => {
      p.fields['agency.vienKiem'].label =
        'BB đối chất — cơ quan ban hành';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-138 presentation mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 15,
      `BM-138 must reject at least 15 presentation mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });

  it('every presentation-identity rejection starts with SCOPED_ASSERTION', () => {
    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    for (const v of rejected) {
      assert.ok(
        v.errorMessage.startsWith('SCOPED_ASSERTION'),
        `BM-138 presentation mutation "${v.mutation}" error message must start with SCOPED_ASSERTION — got: ${v.errorMessage}`,
      );
    }
  });
});

// ============================================================
// PROVENANCE-IDENTITY MUTATION MATRIX
// ============================================================

describe('BM-138 provenance-identity mutation matrix (Section 25)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM138_CODE, BM138_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM138_CODE);
    compiled = loadContract(BM138_CODE);
    verdicts = [];
  });

  function checkProvenanceMutation(name, mutatedRow) {
    let throws = false;
    let errMsg = '';
    try {
      assertBm138ProvenanceIdentity(mutatedRow);
    } catch (err) {
      throws = true;
      errMsg = err.message;
    }
    verdicts.push({
      mutation: name,
      expectedDetector: 'SCOPED_ASSERTION',
      actualDetector: errMsg.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER',
      throws,
      errorMessage: errMsg,
      verdict: throws && errMsg.startsWith('SCOPED_ASSERTION') ? 'REJECTED' : 'PASSED_THROUGH',
    });
  }

  it('provenance-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 1. Strip the workflow signature.
    checkProvenanceMutation(
      'row-strip-Yeu-cau-cung-cap',
      String(provenanceRow).replace(/Yêu cầu cung cấp tài liệu/u, 'something_else'),
    );
    // 2. Strip own extract path.
    checkProvenanceMutation(
      'row-strip-extract-path',
      String(provenanceRow).replace(
        BM138_EXTRACT_PATH,
        'docs/audit/docx/extracted/__REMOVED__.extract.md',
      ),
    );
    // 3. Strip own extract SHA256.
    checkProvenanceMutation(
      'row-strip-extract-sha',
      String(provenanceRow).replace(BM138_EXTRACT_FILE_SHA256, '0'.repeat(64)),
    );
    // 4. Strip P0014 (legal-basis anchor).
    checkProvenanceMutation(
      'row-strip-p0014-anchor',
      String(provenanceRow).replace(/P0014/gu, ''),
    );
    // 5. Strip Điều 41 + Điều 166 + Điều 167 literal citation.
    {
      const stripped = String(provenanceRow)
        .replaceAll('Điều 41', '')
        .replaceAll('Điều 166', '')
        .replaceAll('Điều 167', '');
      checkProvenanceMutation('row-strip-Dieu-41-166-167', stripped);
    }
    // 6. Strip compiledTitle marker.
    checkProvenanceMutation(
      'row-strip-compiledTitle-marker',
      String(provenanceRow).replace(`title="${BM138_COMPILED_TITLE}"`, 'title=""'),
    );
    // 7. Strip extractHeading marker.
    checkProvenanceMutation(
      'row-strip-extractHeading-marker',
      String(provenanceRow).replace(
        `heading="${BM138_EXTRACT_HEADING}"`,
        'heading=""',
      ),
    );
    // 8. Inject sibling heading — appending a second heading="..." marker
    //    (different from the BM-138 heading) must be rejected because the
    //    row then declares TWO document headings.
    checkProvenanceMutation(
      'row-injects-second-heading',
      String(provenanceRow) + ' heading="BIÊN BẢN ĐỐI CHẤT"',
    );

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-138 provenance mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 7,
      `BM-138 must reject at least 7 provenance mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});
