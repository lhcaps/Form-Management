/**
 * BM-146, BM-147, BM-150, BM-151 — prosecution-stage ĐÌNH CHỈ VỤ ÁN
 * (case suspension/termination/resumption) family. Four forms issued by the
 * Procuracy during the truy tố (prosecution) stage of a criminal case:
 *   - BM-146 = "QĐ tạm đình chỉ vụ án" (Điều 41, 247 BLTTHS —
 *     temporarily suspend a criminal case; prosecutionCaseSuspension namespace)
 *   - BM-147 = "QĐ huỷ bỏ QĐ tạm đình chỉ vụ án" (Điều 41, 247, 249 BLTTHS —
 *     resume case by overturning initial suspension; single-section form)
 *   - BM-150 = "QĐ đình chỉ vụ án" (Điều 41, 248 BLTTHS —
 *     final termination of a criminal case; prosecutionCaseTermination namespace)
 *   - BM-151 = "QĐ huỷ bỏ QĐ đình chỉ vụ án" (Điều 41, 248 BLTTHS —
 *     resume case by overturning final termination; single-section form)
 *
 * Source contracts:
 *   docs/audit/docx/compiled-v2/BM-146.compiled.json (18 fields, 5 sections)
 *   docs/audit/docx/compiled-v2/BM-147.compiled.json (4 fields, 1 section)
 *   docs/audit/docx/compiled-v2/BM-150.compiled.json (22 fields, 5 sections)
 *   docs/audit/docx/compiled-v2/BM-151.compiled.json (3 fields, 1 section)
 *
 * Source extracts:
 *   docs/audit/docx/extracted/BM-146__59e5d7e21119.extract.md (63 paragraphs)
 *   docs/audit/docx/extracted/BM-147__7bf9bc811cad.extract.md (58 paragraphs)
 *   docs/audit/docx/extracted/BM-150__d19a8665087c.extract.md (77 paragraphs)
 *   docs/audit/docx/extracted/BM-151__d3ead7c40b56.extract.md (69 paragraphs)
 *
 * Family boundary: prosecution-stage QUYẾT ĐỊNH. NOT siblings of:
 *   - BM-141–BM-145 (QĐ prosecution variants: chuyển/nhập/tách/gia hạn/trả hồ sơ)
 *     distinct operative verbs and distinct BLTTHS legal bases (Điều 247/248 vs 239/242/240/245)
 *   - BM-139/BM-140 (KIẾN NGHỊ — recommendation family, distinct family)
 *   - BM-138 (YÊu cầu — request family, distinct family)
 *   - BM-134/BM-135/BM-136 (BIÊN BẢN — procedural records, distinct family)
 *   - BM-001 (BIÊN BẢN TIẾP NHẬN — distinct document type)
 *
 * Within the family the four forms are DISTINCT document types and MUST NOT
 * be presented as siblings of each other. BM-146 and BM-150 share the
 * same five-section structure but the field namespaces differ:
 *   - BM-146 = `prosecutionCaseSuspension.*`
 *   - BM-150 = `prosecutionCaseTermination.*`
 * BM-147 and BM-151 each have a single-section structure (thông tin biểu mẫu)
 * and distinct operative verbs (huỷ tạm đình chỉ vs huỷ đình chỉ).
 *
 * BM-148, BM-149, BM-152, BM-153 are NOT in this batch — they belong
 * to the ĐÌNH CHỈ bị can subfamily (Điều 41, 247/248 BLTTHS + "đối với bị can")
 * and will be handled in a subsequent batch.
 *
 * RED execution before profile mutation: this test file must run RED before
 * any profile edits are made in this turn.
 */

import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strict as assert } from 'node:assert';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const COMPILED_DIR = resolve(PROJECT_ROOT, 'docs', 'audit', 'docx', 'compiled-v2');
const EXTRACT_DIR = resolve(PROJECT_ROOT, 'docs', 'audit', 'docx', 'extracted');
const PROFILE_DIR = resolve(
  PROJECT_ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'runtime-ux',
);
const PROVENANCE_PATH = resolve(
  PROJECT_ROOT,
  'docs',
  'audit',
  'unified-bm-workspace',
  'QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);
const MATURITY_PATH = resolve(
  PROJECT_ROOT,
  'docs',
  'audit',
  'unified-bm-workspace',
  'QLLAW_213_SEMANTIC_UI_MATURITY.latest.json',
);

// Provenance helpers (same as other batch tests)
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

// ============================================================
// Per-form constants — prosecution-stage ĐÌNH CHỈ VỤ ÁN family
// ============================================================
const FORMS = [
  {
    code: 'BM-146',
    profileVar: 'BM146_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-146.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-146__59e5d7e21119.extract.md',
    compiledTitle: 'QĐ tạm đình chỉ vụ án',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      '59e5d7e21119639aa1dd5798a3fb9a571ba800ed871404e5077d64459f21e8cd',
    extractSha256:
      '59e5d7e21119639aa1dd5798a3fb9a571ba800ed871404e5077d64459f21e8cd',
    fieldCount: 18,
    sectionCount: 5,
    sectionIds: [
      'section-co-quan-va-van-ban',
      'section-can-cu-phap-ly',
      'section-noi-dung-quyet-inh',
      'section-noi-nhan',
      'section-chu-ky',
    ],
    familySubTag: 'prosecutionCaseSuspension',
    legalBasis: 'Điều 41, 247 BLTTHS',
    legalBasisParagraph: 'P0013',
  },
  {
    code: 'BM-147',
    profileVar: 'BM147_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-147.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-147__7bf9bc811cad.extract.md',
    compiledTitle: 'QĐ huỷ bỏ QĐ tạm đình chỉ vụ án',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      '7bf9bc811caddb7805b9cbe4808ba56c0794eea044beecac197e03262ab112d8',
    extractSha256:
      '7bf9bc811caddb7805b9cbe4808ba56c0794eea044beecac197e03262ab112d8',
    fieldCount: 4,
    sectionCount: 1,
    sectionIds: ['section-thong-tin-bieu-mau'],
    familySubTag: 'prosecutionCaseResumptionByRevocationOfSuspension',
    legalBasis: 'Điều 41, 247, 249 BLTTHS',
    legalBasisParagraph: 'P0013',
  },
  {
    code: 'BM-150',
    profileVar: 'BM150_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-150.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-150__d19a8665087c.extract.md',
    compiledTitle: 'QĐ đình chỉ vụ án',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      'd19a8665087c9ec2b23a9d9059681a469e609475e7bdde818c2b81ee244f19be',
    extractSha256:
      'd19a8665087c9ec2b23a9d9059681a469e609475e7bdde818c2b81ee244f19be',
    fieldCount: 22,
    sectionCount: 5,
    sectionIds: [
      'section-co-quan-va-van-ban',
      'section-can-cu-phap-ly',
      'section-noi-dung-quyet-inh',
      'section-noi-nhan',
      'section-chu-ky',
    ],
    familySubTag: 'prosecutionCaseTermination',
    legalBasis: 'Điều 41, 248 BLTTHS',
    legalBasisParagraph: 'P0013',
  },
  {
    code: 'BM-151',
    profileVar: 'BM151_RUNTIME_UX_PROFILE',
    compiledPath: 'docs/audit/docx/compiled-v2/BM-151.compiled.json',
    extractPath: 'docs/audit/docx/extracted/BM-151__d3ead7c40b56.extract.md',
    compiledTitle: 'QĐ huỷ bỏ QĐ đình chỉ vụ án',
    extractHeading: 'QUYẾT ĐỊNH',
    compiledSha256:
      'd3ead7c40b56bc80ed61f7b6a5f693941e0bafd2519e573e92915de380119874',
    extractSha256:
      'd3ead7c40b56bc80ed61f7b6a5f693941e0bafd2519e573e92915de380119874',
    fieldCount: 3,
    sectionCount: 1,
    sectionIds: ['section-thong-tin-bieu-mau'],
    familySubTag: 'prosecutionCaseResumptionByRevocationOfTermination',
    legalBasis: 'Điều 41, 248 BLTTHS',
    legalBasisParagraph: 'P0013',
  },
];

// ============================================================
// Provenance ledger presence check
// ============================================================
test('BM-146–BM-147–BM-150–BM-151 provenance rows are present in the CURATION ledger', () => {
  const ledger = readProvenanceLedger(PROVENANCE_PATH);
  for (const form of FORMS) {
    const row = findProvenanceRow(ledger, form.code);
    assert.ok(row, `${form.code}: CURATION row must exist in provenance ledger`);
    assert.match(
      row,
      /CURATION.*reviewed 2026-07-21 16:30:00/,
      `${form.code}: CURATION timestamp must be present`,
    );
    assert.match(
      row,
      new RegExp(form.compiledSha256.slice(0, 16), 'i'),
      `${form.code}: compiled SHA must be cited in provenance`,
    );
  }
});

// ============================================================
// Per-form scoped assertions
// ============================================================
for (const form of FORMS) {
  const profilePath = resolve(
    PROFILE_DIR,
    `${form.code.replace('BM-', 'bm')}-runtime-ux-profile.ts`,
  );
  const compiledPath = resolve(COMPILED_DIR, `${form.code}.compiled.json`);
  const extractPath = resolve(EXTRACT_DIR, form.extractPath.split('/').pop());

  // SCOPED_ASSERTION: presentation identity (title, sections)
  test(`${form.code} scoped presentation identity passes (no throw)`, () => {
    const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
    assert.equal(
      compiled.title,
      form.compiledTitle,
      `${form.code}: compiled title must match`,
    );
    assert.equal(
      compiled.source.sections.length,
      form.sectionCount,
      `${form.code}: section count must match`,
    );
    const sectionIds = compiled.source.sections.map(s => s.id);
    for (const expectedId of form.sectionIds) {
      assert.ok(
        sectionIds.includes(expectedId),
        `${form.code}: section ${expectedId} must be present`,
      );
    }
  });

  // SCOPED_ASSERTION: semantic identity (field count, key namespaces)
  test(`${form.code} scoped semantic identity passes (no throw)`, () => {
    const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
    const fields = compiled.source.fields;
    assert.equal(
      fields.length,
      form.fieldCount,
      `${form.code}: field count must match`,
    );
    const fieldKeys = new Set(fields.map(f => f.key));

    // Check namespace consistency
    if (form.familySubTag === 'prosecutionCaseSuspension') {
      const hasSuspension = [...fieldKeys].some(k => k.includes('CaseSuspension'));
      assert.ok(
        hasSuspension,
        `${form.code}: prosecutionCaseSuspension namespace must be present`,
      );
    }
    if (form.familySubTag === 'prosecutionCaseTermination') {
      const hasTermination = [...fieldKeys].some(k => k.includes('CaseTermination'));
      assert.ok(
        hasTermination,
        `${form.code}: prosecutionCaseTermination namespace must be present`,
      );
    }
  });

  // SCOPED_ASSERTION: provenance identity (SHA, heading, legal basis)
  test(`${form.code} scoped provenance identity passes (no throw)`, () => {
    const ledger = readProvenanceLedger(PROVENANCE_PATH);
    const row = findProvenanceRow(ledger, form.code);
    assert.ok(row, `${form.code}: provenance row must exist`);
    assert.match(
      row,
      new RegExp(form.compiledSha256.slice(0, 16), 'i'),
      `${form.code}: compiled SHA must be cited`,
    );
    assert.match(
      row,
      new RegExp(form.extractHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${form.code}: extract heading must be cited`,
    );
    assert.match(
      row,
      new RegExp(form.legalBasis.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${form.code}: legal basis must be cited`,
    );
    assert.match(
      row,
      /QUYẾT ĐỊNH/,
      `${form.code}: document-type heading QUYẾT ĐỊNH must be present`,
    );
  });

  // Forbidden sibling family document-type headings (anti-sibling assertions)
  // Note: "Yêu cầu" appears as section heading "Điều 4. Yêu cầu" in BM-146 — legitimate
  // legal text. "YÊU CẦU" is too generic (also in BM-138 heading, BM-141+ body sections).
  // We check only distinct sibling-family heading tokens.
  const extractSrc = fs.readFileSync(extractPath, 'utf8');
  const forbiddenSiblingTokens = [
    // KIẾN NGHỊ appears in BM-139/BM-140 as document-type heading
    'KIẾN NGHỊ',
    // BB = Biên bản heading prefix (not a section name)
    'BB hỏi cung',
    'BB ghi lời khai',
    'BB đối chất',
    'Biên bản hỏi cung',
    'Biên bản ghi lời khai',
    // BM-141–BM-145 specific operative verbs must not appear in ĐÌNH CHỈ family
    '(mẫu BM-141)',
    '(mẫu BM-142)',
    '(mẫu BM-143)',
    '(mẫu BM-144)',
    '(mẫu BM-145)',
  ];
  for (const token of forbiddenSiblingTokens) {
    assert.ok(
      !extractSrc.includes(token),
      `${form.code}: forbidden sibling token "${token}" must not appear in extract`,
    );
  }

  // SCOPED_ASSERTION: version label
  test(`${form.code} scoped version label is stable`, () => {
    const profileSrc = fs.readFileSync(profilePath, 'utf8');
    assert.ok(
      profileSrc.includes(`templateCode: "${form.code}"`),
      `${form.code}: profile must register with correct templateCode`,
    );
    assert.ok(
      profileSrc.includes('batch 7'),
      `${form.code}: versionLabel must reference batch 7`,
    );
    // No gate/batch-marker pollution in versionLabel
    const versionMatch = profileSrc.match(/versionLabel:\s*`([^`]+)`/);
    if (versionMatch) {
      const vl = versionMatch[1];
      assert.ok(
        !/gate|batch.*curation|singleton|phase|CHUYỂN|NHẬP|TÁCH|GIA HẠN|TRẢ/.test(vl),
        `${form.code}: versionLabel must not contain polluted tokens`,
      );
    }
  });
}

// ============================================================
// Batch-level invariant: provenance SHA match
// ============================================================
test('BM-146–BM-147–BM-150–BM-151 compiled SHA matches provenance cited SHA', () => {
  for (const form of FORMS) {
    const compiledPath = resolve(COMPILED_DIR, `${form.code}.compiled.json`);
    const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
    const ledger = readProvenanceLedger(PROVENANCE_PATH);
    const row = findProvenanceRow(ledger, form.code);
    assert.ok(row, `${form.code}: provenance row must exist`);
    // templateHash is the SHA of the compiled JSON artifact itself
    const sha = compiled.templateHash ?? compiled.contractHash ?? '';
    assert.ok(
      sha.length > 0,
      `${form.code}: compiled must have templateHash or contractHash`,
    );
    assert.match(
      row,
      new RegExp(sha.slice(0, 16), 'i'),
      `${form.code}: compiled templateHash must be cited in provenance`,
    );
  }
});

// ============================================================
// Batch-level invariant: family boundary
// ============================================================
test('BM-146–BM-147–BM-150–BM-151 provenance rows do NOT cite sibling family tokens', () => {
  const ledger = readProvenanceLedger(PROVENANCE_PATH);
  // All four forms must cite the ĐÌNH CHỈ VỤ ÁN family heading
  for (const form of FORMS) {
    const row = findProvenanceRow(ledger, form.code);
    assert.ok(
      row && /ĐÌNH CHỈ|ĐÌNH CHỈ VỤ ÁN/.test(row),
      `${form.code}: ĐÌNH CHỈ family heading must be cited`,
    );
    // Must NOT cite BM-141–BM-145 operative verbs
    assert.ok(
      !row.includes('CHUYỂN') && !row.includes('NHẬP') && !row.includes('TÁCH') && !row.includes('GIA HẠN') && !row.includes('TRẢ HỒ SƠ'),
      `${form.code}: BM-141–BM-145 operative verbs must not appear in ĐÌNH CHỈ family provenance`,
    );
  }
});

// ============================================================
// Batch-level: runtime-ux registry guard
// ============================================================
test('BM-146–BM-147–BM-150–BM-151 profiles are registered in index.ts', () => {
  const indexPath = resolve(PROFILE_DIR, 'index.ts');
  const indexSrc = fs.readFileSync(indexPath, 'utf8');
  for (const form of FORMS) {
    const importLine = form.code.replace('BM-', 'bm');
    assert.ok(
      indexSrc.includes(`./${importLine.toLowerCase()}-runtime-ux-profile`),
      `${form.code}: profile must be imported in index.ts`,
    );
  }
});
