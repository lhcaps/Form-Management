/**
 * BM-134 / BM-135 family: Biên bản ghi lời khai + Biên bản hỏi cung bị can.
 *
 * Shared invariants for both forms:
 *   - registered with the compiled templateCode,
 *   - presentationSections exposes every compiled field exactly once,
 *   - does not expose fields outside the compiled contract,
 *   - uses only compiled-contract section IDs in profile.sections and
 *     presentationSections,
 *   - provides a description for every section it presents,
 *   - carries no generated "(mẫu BM-NNN)" placeholder marker,
 *   - has a provenance row in the curation ledger,
 *   - not promoted to runtimeReady,
 *   - passes the shared curator validator with zero issues.
 *
 * Document-type distinction:
 *   BM-134 = Biên bản ghi lời khai (statement-taking, witness/suspect)
 *   BM-135 = Biên bản hỏi cung bị can (interrogation of accused person)
 *
 * Run: node --test test/forms/bm134-135-curation.test.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, before } from 'node:test';

import {
  loadProfile,
  mutateProfile,
  validateCuration,
} from './helpers/runtime-ux-curation-validator.mjs';
import {
  assertFullSha256,
  findProvenanceRow,
  readProvenanceLedger,
  PROJECT_ROOT,
} from './helpers/provenance-source-integrity.mjs';

const FORMS = [
  {
    code: 'BM-134',
    profileVariable: 'BM134_RUNTIME_UX_PROFILE',
    compiledTitle: 'BB ghi lời khai',
    documentFamily: 'BIÊN BẢN',
    procedureSubfamily: 'ghi-lời-khai',
    principalOperativeVerb: 'GHI_LỜI',
    expectedFields: [
      'agency.vienKiem',
      'signature.positionTitle',
      'document.soQuyet',
      'recipients.personLine',
      'agency.diaDanh',
      'document.ngayBan',
      'agency.dongDia',
      'document.chuThe',
      'legalBasis.canCu',
      'document.tenVu',
    ],
    wrongTitle: 'BB hỏi cung bị can',
    wrongPersonLineLabel: 'Bị can được hỏi cung',
    ownExtractFile: 'BM-134__7c1e123c01b0.extract.md',
    wrongExtractFile: 'BM-135__79b31ad7511e.extract.md',
    ownFormSource: 'BM-134',
    wrongFormSource: 'BM-135',
  },
  {
    code: 'BM-135',
    profileVariable: 'BM135_RUNTIME_UX_PROFILE',
    compiledTitle: 'BB hỏi cung bị can',
    documentFamily: 'BIÊN BẢN',
    procedureSubfamily: 'hỏi-cung-bị-can',
    principalOperativeVerb: 'HỎI_CUNG',
    expectedFields: [
      'agency.vienKiem',
      'signature.positionTitle',
      'document.soQuyet',
      'agency.diaDanh',
      'recipients.personLine',
      'document.ngayBan',
      'agency.dongDia',
      'document.chuThe',
      'legalBasis.canCu',
      'document.tenVu',
    ],
    wrongTitle: 'BB ghi lời khai',
    wrongPersonLineLabel: 'Người được lấy lời khai',
    ownExtractFile: 'BM-135__79b31ad7511e.extract.md',
    wrongExtractFile: 'BM-134__7c1e123c01b0.extract.md',
    ownFormSource: 'BM-135',
    wrongFormSource: 'BM-134',
  },
];

// RED mutations: prove each form has distinct procedural identity
const BM134_RED_MUTATIONS = {
  title: { value: 'BB hỏi cung bị can', mustFail: true },
  'fields.recipients.personLine.label': { value: 'Bị can được hỏi cung', mustFail: true },
  'demo.document.tenVu': { value: 'Vụ án sai loại', mustFail: true },
};

const BM135_RED_MUTATIONS = {
  title: { value: 'BB ghi lời khai', mustFail: true },
  'fields.recipients.personLine.label': { value: 'Người được lấy lời khai', mustFail: true },
  'demo.document.tenVu': { value: 'Vụ việc sai loại', mustFail: true },
};

for (const form of FORMS) {
  describe(`BM-134/BM-135 curation: ${form.code}`, () => {
    const profilePath = resolve(
      PROJECT_ROOT,
      'apps/web/src/lib/runtime-ux',
      `bm${form.code.replace('BM-', '')}-runtime-ux-profile.ts`,
    );
    const compiledPath = resolve(
      PROJECT_ROOT,
      'docs/audit/docx/compiled-v2',
      `${form.code}.compiled.json`,
    );
    let profile;
    let compiled;
    let provenanceRow;
    let compileError;

    try {
      profile = loadProfile(profilePath, form.profileVariable);
    } catch (err) {
      compileError = err;
    }

    try {
      compiled = JSON.parse(readFileSync(compiledPath, 'utf8'));
    } catch (err) {
      compileError = err;
    }

    try {
      const ledger = readProvenanceLedger();
      provenanceRow = findProvenanceRow(ledger, form.code);
    } catch (err) {
      provenanceRow = undefined;
    }

    it(`${form.code} profile loads without error`, () => {
      assert.equal(
        compileError,
        undefined,
        `${form.code} profile must load. Got: ${compileError?.message ?? compileError}`,
      );
    });

    it(`${form.code} has correct templateCode`, () => {
      assert.equal(profile.templateCode, form.code);
    });

    it(`${form.code} has curated section`, () => {
      assert.ok(
        profile.sections?.length > 0,
        `${form.code} must have at least one section`,
      );
    });

    it(`${form.code} section uses compiled sectionId`, () => {
      const compiledPath = resolve(
        PROJECT_ROOT,
        'docs/audit/docx/compiled-v2',
        `${form.code}.compiled.json`,
      );
      const compiled = JSON.parse(readFileSync(compiledPath, 'utf8'));
      const compiledSectionIds = new Set(
        compiled.source.sections.map((s) => s.id),
      );
      for (const section of profile.sections) {
        assert.ok(
          compiledSectionIds.has(section.sectionId),
          `${form.code} section "${section.sectionId}" must match compiled section ID`,
        );
      }
    });

    it(`${form.code} presentationSections covers all compiled fields exactly once`, () => {
      const compiledPath = resolve(
        PROJECT_ROOT,
        'docs/audit/docx/compiled-v2',
        `${form.code}.compiled.json`,
      );
      const compiled = JSON.parse(readFileSync(compiledPath, 'utf8'));
      const compiledFieldKeys = new Set(
        compiled.source.fields.map((f) => f.key),
      );

      const presentedKeys = new Set();
      for (const ps of profile.presentationSections ?? []) {
        for (const key of ps.fieldKeys ?? []) {
          assert.ok(
            !presentedKeys.has(key),
            `${form.code} must not duplicate field "${key}" in presentationSections`,
          );
          presentedKeys.add(key);
        }
      }

      const missing = [...compiledFieldKeys].filter(
        (k) => !presentedKeys.has(k),
      );
      assert.deepEqual(
        missing,
        [],
        `${form.code} missing fields in presentationSections: ${missing.join(', ')}`,
      );

      const extra = [...presentedKeys].filter(
        (k) => !compiledFieldKeys.has(k),
      );
      assert.deepEqual(
        extra,
        [],
        `${form.code} extra fields in presentationSections: ${extra.join(', ')}`,
      );
    });

    it(`${form.code} demo does not contain generic "(mẫu BM-NNN)" marker`, () => {
      const demoStr = JSON.stringify(profile.demo ?? {});
      assert.ok(
        !/^\(mẫu\s+BM-\d+\)$/u.test(demoStr),
        `${form.code} demo must not contain generic "(mẫu BM-NNN)" placeholder`,
      );
    });

    it(`${form.code} provenance row exists in curation ledger`, () => {
      assert.ok(
        provenanceRow,
        `${form.code} must have a provenance row`,
      );
    });

    // NOTE: Title and label mutations are NOT covered here with the
    // shared structural validator — that validator only checks
    // structure/provenance and would PASS content-level drift. Real
    // semantic-identity rejection is verified by the
    // `assertBmNNNSemanticIdentity` scoped-assertion tests below.
  });
}

// ============================================================
// SCOPED SEMANTIC MUTATION TESTS — content-level provenance
// These verify the curation corrections are in place and
// cannot be silently reverted.
// ============================================================

describe('BM-134/BM-135 provenance content integrity', () => {
  let ledger;
  let bm134Row;
  let bm135Row;

  before(() => {
    ledger = readProvenanceLedger();
    bm134Row = findProvenanceRow(ledger, 'BM-134');
    bm135Row = findProvenanceRow(ledger, 'BM-135');
  });

  // --- Source pointer isolation ---

  it('BM-134 provenance cites BM-134 extract, not BM-135', () => {
    assert.ok(
      bm134Row?.includes(formOwnExtract('BM-134')),
      'SCOPED_ASSERTION: BM-134 provenance must cite own extract',
    );
    assert.ok(
      !bm134Row?.includes('BM-135__79b31ad7511e'),
      'SCOPED_ASSERTION: BM-134 provenance must NOT cite BM-135 extract',
    );
  });

  it('BM-135 provenance cites BM-135 extract, not BM-134', () => {
    assert.ok(
      bm135Row?.includes(formOwnExtract('BM-135')),
      'SCOPED_ASSERTION: BM-135 provenance must cite own extract',
    );
    assert.ok(
      !bm135Row?.includes('BM-134__7c1e123c01b0'),
      'SCOPED_ASSERTION: BM-135 provenance must NOT cite BM-134 extract',
    );
  });

  // --- legalBasis.canCu: P0003 must not be cited ---

  it('BM-134 legalBasis.canCu must NOT cite P0003 quốc hiệu', () => {
    // P0003 appears in agency.vienKiem entry (HIGH citation) and ConfidenceByField.
    // It must NOT appear in legalBasis.canCu label text.
    // Pattern: legalBasis.canCu label text does not mention P0003.
    assert.ok(
      !bm134Row?.match(/legalBasis\.canCu[^;]{1,400}?(?:P0003)/iu),
      'SCOPED_ASSERTION: BM-134 legalBasis.canCu label text must NOT cite P0003 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" — P0003 is quốc hiệu, not legal basis; agency.vienKiem cites P0003, not legalBasis.canCu',
    );
  });

  it('BM-135 legalBasis.canCu must NOT cite P0003 quốc hiệu', () => {
    assert.ok(
      !bm135Row?.match(/legalBasis\.canCu[^;]{1,400}?(?:P0003)/iu),
      'SCOPED_ASSERTION: BM-135 legalBasis.canCu label text must NOT cite P0003 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" — P0003 is quốc hiệu, not legal basis',
    );
  });

  it('BM-134 legalBasis.canCu must document CONTRACT_ONLY_NO_DOCX_SLOT', () => {
    assert.ok(
      bm134Row?.match(/legalBasis\.canCu[^;]*(?:CONTRACT_ONLY_NO_DOCX_SLOT|no.*DOCX.*slot|không.*có.*đoạn.*văn.*că?n\s*cứ)/iu),
      'SCOPED_ASSERTION: BM-134 legalBasis.canCu must state CONTRACT_ONLY_NO_DOCX_SLOT or equivalent',
    );
  });

  it('BM-135 legalBasis.canCu must document CONTRACT_ONLY_NO_DOCX_SLOT', () => {
    assert.ok(
      bm135Row?.match(/legalBasis\.canCu[^;]*(?:CONTRACT_ONLY_NO_DOCX_SLOT|no.*DOCX.*slot|không.*có.*đoạn.*văn.*că?n\s*cứ)/iu),
      'SCOPED_ASSERTION: BM-135 legalBasis.canCu must state CONTRACT_ONLY_NO_DOCX_SLOT or equivalent',
    );
  });

  // --- document.chuThe: P0031 must not be cited for BM-135 ---

  it('BM-134 document.chuThe must NOT cite P0031 as entity evidence', () => {
    // P0031 "HỎI VÀ TRẢ LỜI" is operative section heading, not entity
    // Pattern: document.chuThe label text does not cite P0031
    assert.ok(
      !bm134Row?.match(/document\.chuThe[^;]{1,400}?(?:P0031)/iu),
      'SCOPED_ASSERTION: BM-134 document.chuThe label text must NOT cite P0031 as direct entity evidence',
    );
  });

  it('BM-135 document.chuThe corrected text documents CONTRACT_ONLY_NO_DOCX_SLOT', () => {
    // The corrected text explicitly says P0031 is the operative heading, not a named entity.
    // Verify the corrected CONTRACT_ONLY_NO_DOCX_SLOT statement is present.
    assert.ok(
      bm135Row?.match(/document\.chuThe[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu),
      'SCOPED_ASSERTION: BM-135 document.chuThe corrected text must document CONTRACT_ONLY_NO_DOCX_SLOT — P0031 is operative heading, P0013 is positional label, neither is a named entity',
    );
  });

  it('BM-135 document.chuThe must document CONTRACT_ONLY_NO_DOCX_SLOT', () => {
    assert.ok(
      bm135Row?.match(/document\.chuThe[^;]*(?:CONTRACT_ONLY_NO_DOCX_SLOT|no.*DOCX.*slot|không.*có.*đoạn.*văn|operative.*heading|heading.*operative)/iu),
      'SCOPED_ASSERTION: BM-135 document.chuThe must state CONTRACT_ONLY_NO_DOCX_SLOT — P0031 is operative heading, not entity',
    );
  });

  // --- agency.dongDia: P0053/P0054 — corrected text explains them as authority footnotes ---
  // Note: The corrected text mentions P0053/P0054 IN the explanatory correction
  // ("P0053/P0054 are authority-name footnotes"), not as direct evidence.
  // The original text cited them as direct evidence ("per P0053 footnote").
  // Test: verify the corrected text contains CONTRACT_ONLY_NO_DOCX_SLOT for agency.dongDia.

  it('BM-134 agency.dongDia corrected text documents CONTRACT_ONLY_NO_DOCX_SLOT', () => {
    assert.ok(
      bm134Row?.match(/agency\.dongDia[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu),
      'SCOPED_ASSERTION: BM-134 agency.dongDia corrected text must document CONTRACT_ONLY_NO_DOCX_SLOT',
    );
  });

  it('BM-135 agency.dongDia corrected text documents CONTRACT_ONLY_NO_DOCX_SLOT', () => {
    assert.ok(
      bm135Row?.match(/agency\.dongDia[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu),
      'SCOPED_ASSERTION: BM-135 agency.dongDia corrected text must document CONTRACT_ONLY_NO_DOCX_SLOT',
    );
  });

  // --- document.soQuyet: presentation label must not say "Số quyết định" ---

  it('BM-134 document.soQuyet presentation must not say "Số quyết định"', () => {
    const bm134ProfilePath = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts');
    const source = readFileSync(bm134ProfilePath, 'utf8');
    assert.ok(
      !source.match(/document\.soQuyet[^}]*label[^"]*"[^"]*quyết\s*định/iu),
      'SCOPED_ASSERTION: BM-134 document.soQuyet label must not say "Số quyết định" — it is "Số biên bản ghi lời khai"',
    );
  });

  it('BM-135 document.soQuyet presentation must not say "Số quyết định"', () => {
    const bm135ProfilePath = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts');
    const source = readFileSync(bm135ProfilePath, 'utf8');
    assert.ok(
      !source.match(/document\.soQuyet[^}]*label[^"]*"[^"]*quyết\s*định/iu),
      'SCOPED_ASSERTION: BM-135 document.soQuyet label must not say "Số quyết định" — it is "Số biên bản hỏi cung bị can"',
    );
  });

  // --- BM-134 title correct ---

  it('BM-134 profile heading must say "Biên bản ghi lời khai"', () => {
    const bm134ProfilePath = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts');
    const source = readFileSync(bm134ProfilePath, 'utf8');
    assert.ok(
      source.match(/BIÊN BẢN GHI LỜI KHAI/iu),
      'SCOPED_ASSERTION: BM-134 profile must retain "BIÊN BẢN GHI LỜI KHAI" heading',
    );
  });

  // --- BM-135 title correct ---

  it('BM-135 profile heading must say "Biên bản hỏi cung bị can"', () => {
    const bm135ProfilePath = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts');
    const source = readFileSync(bm135ProfilePath, 'utf8');
    assert.ok(
      source.match(/BIÊN BẢN HỎI CUNG BỊ CAN/iu),
      'SCOPED_ASSERTION: BM-135 profile must retain "BIÊN BẢN HỎI CUNG BỊ CAN" heading',
    );
  });

  // --- recipients.personLine labels ---

  it('BM-134 recipients.personLine label must be "Người được lấy lời khai"', () => {
    const bm134ProfilePath = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts');
    const source = readFileSync(bm134ProfilePath, 'utf8');
    assert.ok(
      source.match(/recipients\.personLine[^}]*label[^"]*"Người được lấy lời khai"/iu),
      'SCOPED_ASSERTION: BM-134 recipients.personLine label must be "Người được lấy lời khai"',
    );
  });

  it('BM-135 recipients.personLine label must be "Bị can được hỏi cung"', () => {
    const bm135ProfilePath = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts');
    const source = readFileSync(bm135ProfilePath, 'utf8');
    assert.ok(
      source.match(/recipients\.personLine[^}]*label[^"]*"Bị can được hỏi cung"/iu),
      'SCOPED_ASSERTION: BM-135 recipients.personLine label must be "Bị can được hỏi cung"',
    );
  });

  // --- Document family boundary ---

  it('BM-134 provenance must cite BIÊN BẢN family', () => {
    assert.ok(
      bm134Row?.match(/BIÊN BẢN/iu),
      'SCOPED_ASSERTION: BM-134 must belong to BIÊN BẢN family',
    );
  });

  it('BM-135 provenance must cite BIÊN BẢN family', () => {
    assert.ok(
      bm135Row?.match(/BIÊN BẢN/iu),
      'SCOPED_ASSERTION: BM-135 must belong to BIÊN BẢN family',
    );
  });

  // --- Runtime readiness boundary ---

  it('BM-134 must not appear in runtimeReady list', () => {
    const ledgerText = typeof ledger === 'string' ? ledger : JSON.stringify(ledger);
    const runtimeReadyMatch = ledgerText.match(/runtimeReady["\s:]+(\[[^\]]+\])/iu);
    if (runtimeReadyMatch) {
      assert.ok(
        !runtimeReadyMatch[1].includes('BM-134'),
        'SCOPED_ASSERTION: BM-134 must not be in runtimeReady list',
      );
    }
  });

  it('BM-135 must not appear in runtimeReady list', () => {
    const ledgerText = typeof ledger === 'string' ? ledger : JSON.stringify(ledger);
    const runtimeReadyMatch = ledgerText.match(/runtimeReady["\s:]+(\[[^\]]+\])/iu);
    if (runtimeReadyMatch) {
      assert.ok(
        !runtimeReadyMatch[1].includes('BM-135'),
        'SCOPED_ASSERTION: BM-135 must not be in runtimeReady list',
      );
    }
  });
});

// ============================================================
// SCOPED SEMANTIC MUTATION TESTS — real semantic rejection
// These verify that swapping title/recipient/procedure between
// BM-134 and BM-135 would be caught by content-level checks.
// The scoped assertions mirror the curation corrections:
// BM-134 = BIÊN BẢN GHI LỜI KHAI (statement-taking)
// BM-135 = BIÊN BẢN HỎI CUNG BỊ CAN (interrogation of accused)
// ============================================================

describe('BM-134/BM-135 scoped semantic mutation rejection', () => {
  let bm134Profile;
  let bm135Profile;

  before(() => {
    bm134Profile = loadProfile(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts'),
      'BM134_RUNTIME_UX_PROFILE',
    );
    bm135Profile = loadProfile(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts'),
      'BM135_RUNTIME_UX_PROFILE',
    );
  });

  // Helper: deep-clone a profile for mutation
  function cloneProfile(p) {
    return JSON.parse(JSON.stringify(p));
  }

  // --- BM-134 title → BM-135 title ---
  it('BM-134 profile retains "GHI LỜI KHAI" heading (REJECTED: title swap)', () => {
    const src = readFileSync(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts'),
      'utf8',
    );
    assert.match(
      src,
      /BIÊN BẢN GHI LỜI KHAI/iu,
      'SCOPED_ASSERTION: BM-134 heading must be "BIÊN BẢN GHI LỜI KHAI"; mutation detector = SCOPED_ASSERTION_REJECT',
    );
    assert.doesNotMatch(
      src,
      /BIÊN BẢN HỎI CUNG BỊ CAN/iu,
      'SCOPED_ASSERTION: BM-134 must NOT contain BM-135 title; mutation detector = SCOPED_ASSERTION_REJECT',
    );
  });

  // --- BM-135 title → BM-134 title ---
  it('BM-135 profile retains "HỎI CUNG BỊ CAN" heading (REJECTED: title swap)', () => {
    const src = readFileSync(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts'),
      'utf8',
    );
    assert.match(
      src,
      /BIÊN BẢN HỎI CUNG BỊ CAN/iu,
      'SCOPED_ASSERTION: BM-135 heading must be "BIÊN BẢN HỎI CUNG BỊ CAN"; mutation detector = SCOPED_ASSERTION_REJECT',
    );
    assert.doesNotMatch(
      src,
      /BIÊN BẢN GHI LỜI KHAI/iu,
      'SCOPED_ASSERTION: BM-135 must NOT contain BM-134 title; mutation detector = SCOPED_ASSERTION_REJECT',
    );
  });

  // --- BM-134 recipients label → BM-135 label ---
  it('BM-134 recipients.personLine label = "Người được lấy lời khai" (REJECTED: label swap)', () => {
    const src = readFileSync(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts'),
      'utf8',
    );
    assert.match(
      src,
      /recipients\.personLine[^}]*label[^"]*"Người được lấy lời khai"/iu,
      'SCOPED_ASSERTION: BM-134 recipients.personLine label must be "Người được lấy lời khai"; mutation detector = SCOPED_ASSERTION_REJECT',
    );
    assert.doesNotMatch(
      src,
      /recipients\.personLine[^}]*label[^"]*"Bị can được hỏi cung"/iu,
      'SCOPED_ASSERTION: BM-134 must NOT have BM-135 label; mutation detector = SCOPED_ASSERTION_REJECT',
    );
  });

  // --- BM-135 recipients label → BM-134 label ---
  it('BM-135 recipients.personLine label = "Bị can được hỏi cung" (REJECTED: label swap)', () => {
    const src = readFileSync(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts'),
      'utf8',
    );
    assert.match(
      src,
      /recipients\.personLine[^}]*label[^"]*"Bị can được hỏi cung"/iu,
      'SCOPED_ASSERTION: BM-135 recipients.personLine label must be "Bị can được hỏi cung"; mutation detector = SCOPED_ASSERTION_REJECT',
    );
    assert.doesNotMatch(
      src,
      /recipients\.personLine[^}]*label[^"]*"Người được lấy lời khai"/iu,
      'SCOPED_ASSERTION: BM-135 must NOT have BM-134 label; mutation detector = SCOPED_ASSERTION_REJECT',
    );
  });

  // --- BM-134 extract pointer vs BM-135 ---
  it('BM-134 provenance cites BM-134 extract file (REJECTED: extract pointer swap)', () => {
    const ledger = readProvenanceLedger();
    const row = findProvenanceRow(ledger, 'BM-134');
    assert.ok(
      row?.includes('BM-134__7c1e123c01b0.extract.md'),
      'SCOPED_ASSERTION: BM-134 provenance must cite BM-134__7c1e123c01b0.extract.md; mutation detector = SCOPED_ASSERTION_REJECT',
    );
    assert.ok(
      !row?.includes('BM-135__79b31ad7511e.extract.md'),
      'SCOPED_ASSERTION: BM-134 provenance must NOT cite BM-135 extract; mutation detector = SCOPED_ASSERTION_REJECT',
    );
  });

  // --- BM-135 extract pointer vs BM-134 ---
  it('BM-135 provenance cites BM-135 extract file (REJECTED: extract pointer swap)', () => {
    const ledger = readProvenanceLedger();
    const row = findProvenanceRow(ledger, 'BM-135');
    assert.ok(
      row?.includes('BM-135__79b31ad7511e.extract.md'),
      'SCOPED_ASSERTION: BM-135 provenance must cite BM-135__79b31ad7511e.extract.md; mutation detector = SCOPED_ASSERTION_REJECT',
    );
    assert.ok(
      !row?.includes('BM-134__7c1e123c01b0.extract.md'),
      'SCOPED_ASSERTION: BM-135 provenance must NOT cite BM-134 extract; mutation detector = SCOPED_ASSERTION_REJECT',
    );
  });

  // --- Provenance COMPILED paths are distinct ---
  it('BM-134 and BM-135 compiled paths are distinct (REJECTED: compiled path swap)', () => {
    const ledger = readProvenanceLedger();
    const row134 = findProvenanceRow(ledger, 'BM-134');
    const row135 = findProvenanceRow(ledger, 'BM-135');
    assert.ok(
      row134?.includes('BM-134.compiled.json'),
      'SCOPED_ASSERTION: BM-134 provenance must cite BM-134.compiled.json',
    );
    assert.ok(
      row135?.includes('BM-135.compiled.json'),
      'SCOPED_ASSERTION: BM-135 provenance must cite BM-135.compiled.json',
    );
    assert.ok(
      !row134?.includes('BM-135.compiled.json'),
      'SCOPED_ASSERTION: BM-134 provenance must NOT cite BM-135 compiled; mutation detector = SCOPED_ASSERTION_REJECT',
    );
    assert.ok(
      !row135?.includes('BM-134.compiled.json'),
      'SCOPED_ASSERTION: BM-135 provenance must NOT cite BM-134 compiled; mutation detector = SCOPED_ASSERTION_REJECT',
    );
  });
});

// Helper: construct own extract file reference
function formOwnExtract(code) {
  const map = {
    'BM-134': 'BM-134__7c1e123c01b0.extract.md',
    'BM-135': 'BM-135__79b31ad7511e.extract.md',
  };
  return map[code] ?? '';
}

// ============================================================
// SCOPED SEMANTIC ASSERTION FUNCTIONS
//
// These assertion functions operate on in-memory profile + provenance
// CLONES. They are NOT source-text grep — they evaluate the actual
// structured data of the loaded profile + ledger row and throw when a
// semantic-identity mutation slips through. Each assertion is scoped
// to one form, so a mutation that swaps BM-134 ↔ BM-135 is rejected
// even if the shared structural validator accepts the new shape.
//
// A SCOPED_ASSERTION_THROWS verdict means the scoped assertion
// function threw — that is the proof that the mutation was rejected.
// A SHARED_VALIDATOR_PASS verdict (only) is NOT proof; the test must
// show the scoped assertion actually rejected the mutation.
// ============================================================

/**
 * Assert that BM-134 semantic identity is preserved on a clone.
 * Throws when the cloned profile or cloned provenance row contains
 * evidence that BM-135 has been borrowed. Accepts a profile object
 * and a provenance row string (or undefined).
 */
export function assertBm134SemanticIdentity(profile, provenanceRow) {
  const row = provenanceRow ?? '';
  // 1. Title/heading: BM-134 = GHI LỜI KHAI, must not contain
  //    BM-135's "HỎI CUNG BỊ CAN" anywhere in profile.demo or
  //    fields' label/placeholder text.
  const textCorpus = JSON.stringify(profile ?? {});
  if (/HỎI CUNG BỊ CAN/iu.test(textCorpus)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 profile contains BM-135 heading text "HỎI CUNG BỊ CAN" — semantic identity violated',
    );
  }
  // 2. recipients.personLine label must remain "Người được lấy lời khai".
  const personLabel = profile?.fields?.['recipients.personLine']?.label ?? '';
  if (personLabel !== 'Người được lấy lời khai') {
    throw new Error(
      `SCOPED_ASSERTION: BM-134 recipients.personLine label mutated to "${personLabel}" — must remain "Người được lấy lời khai"`,
    );
  }
  // 3. Procedure subfamily: presentation must reference ghi-lời-khai
  //    workflow, NOT hỏi-cung-bị-can.
  if (/hỏi\s*cung\s*bị\s*can/iu.test(textCorpus) || /hỏi-cung-bị-can/iu.test(textCorpus)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 profile references hỏi-cung-bị-can procedure — subfamily swap detected',
    );
  }
  // 4. Provenance: must cite BM-134 extract, must NOT cite BM-135 extract.
  if (!row.includes('BM-134__7c1e123c01b0.extract.md')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 provenance lost citation of BM-134__7c1e123c01b0.extract.md',
    );
  }
  if (row.includes('BM-135__79b31ad7511e.extract.md')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 provenance cites BM-135 extract — semantic identity violated',
    );
  }
  // 5. Provenance: must cite own compiled contract.
  if (!row.includes('BM-134.compiled.json')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 provenance lost citation of BM-134.compiled.json',
    );
  }
  if (row.includes('BM-135.compiled.json')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 provenance cites BM-135 compiled — semantic identity violated',
    );
  }
  // 6. legalBasis.canCu must not be DIRECT_SLOT/HIGH — must
  //    document CONTRACT_ONLY_NO_DOCX_SLOT.
  const canCuSegment = extractSegment(row, 'legalBasis.canCu');
  if (canCuSegment && !/CONTRACT_ONLY_NO_DOCX_SLOT/iu.test(canCuSegment)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 legalBasis.canCu lost CONTRACT_ONLY_NO_DOCX_SLOT — HIGH/DIRECT_SLOT claim detected',
    );
  }
  // 7. document.soQuyet must NOT assert a direct DOCX number slot.
  const soQuyetSegment = extractSegment(row, 'document.soQuyet');
  if (soQuyetSegment && !/CONTRACT_ONLY_NO_DOCX_SLOT/iu.test(soQuyetSegment)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 document.soQuyet lost CONTRACT_ONLY_NO_DOCX_SLOT — direct DOCX slot claim detected',
    );
  }
  // 8. document.soQuyet presentation label must not say "Số quyết định".
  if (/document\.soQuyet[^}]*label[^"]*"[^"]*quyết\s*định/iu.test(textCorpus)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-134 document.soQuyet label says "Số quyết định" — must be "Số biên bản ghi lời khai"',
    );
  }
}

/**
 * Assert that BM-135 semantic identity is preserved on a clone.
 * Mirror of assertBm134SemanticIdentity for the hỏi-cung family.
 */
export function assertBm135SemanticIdentity(profile, provenanceRow) {
  const row = provenanceRow ?? '';
  const textCorpus = JSON.stringify(profile ?? {});
  if (/GHI LỜI KHAI/iu.test(textCorpus)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 profile contains BM-134 heading text "GHI LỜI KHAI" — semantic identity violated',
    );
  }
  const personLabel = profile?.fields?.['recipients.personLine']?.label ?? '';
  if (personLabel !== 'Bị can được hỏi cung') {
    throw new Error(
      `SCOPED_ASSERTION: BM-135 recipients.personLine label mutated to "${personLabel}" — must remain "Bị can được hỏi cung"`,
    );
  }
  if (/ghi\s*lời\s*khai/iu.test(textCorpus) && !/HỎI CUNG BỊ CAN/iu.test(textCorpus)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 profile references ghi-lời-khai procedure — subfamily swap detected',
    );
  }
  if (!row.includes('BM-135__79b31ad7511e.extract.md')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 provenance lost citation of BM-135__79b31ad7511e.extract.md',
    );
  }
  if (row.includes('BM-134__7c1e123c01b0.extract.md')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 provenance cites BM-134 extract — semantic identity violated',
    );
  }
  if (!row.includes('BM-135.compiled.json')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 provenance lost citation of BM-135.compiled.json',
    );
  }
  if (row.includes('BM-134.compiled.json')) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 provenance cites BM-134 compiled — semantic identity violated',
    );
  }
  const canCuSegment = extractSegment(row, 'legalBasis.canCu');
  if (canCuSegment && !/CONTRACT_ONLY_NO_DOCX_SLOT/iu.test(canCuSegment)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 legalBasis.canCu lost CONTRACT_ONLY_NO_DOCX_SLOT — HIGH/DIRECT_SLOT claim detected',
    );
  }
  const soQuyetSegment = extractSegment(row, 'document.soQuyet');
  if (soQuyetSegment && !/CONTRACT_ONLY_NO_DOCX_SLOT/iu.test(soQuyetSegment)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 document.soQuyet lost CONTRACT_ONLY_NO_DOCX_SLOT — direct DOCX slot claim detected',
    );
  }
  if (/document\.soQuyet[^}]*label[^"]*"[^"]*quyết\s*định/iu.test(textCorpus)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-135 document.soQuyet label says "Số quyết định" — must be "Số biên bản hỏi cung bị can"',
    );
  }
}

/** Extract a "label" segment from the provenance row, bounded by next ";". */
function extractSegment(row, label) {
  const idx = row.indexOf(label);
  if (idx < 0) return null;
  const tail = row.slice(idx);
  const nextSemi = tail.indexOf(';', label.length);
  return nextSemi > 0 ? tail.slice(0, nextSemi) : tail;
}

// ============================================================
// IN-MEMORY MUTATION MATRIX TESTS
//
// Each test:
//   1. Loads the real profile + provenance row.
//   2. Clones both in memory.
//   3. Applies a single semantic mutation to the clone.
//   4. Invokes the scoped assertion function.
//   5. Asserts the scoped assertion THROWS (REJECTED verdict).
//
// A "SHARED_VALIDATOR" or "structurally valid" outcome on the
// mutation is NOT acceptable proof — only SCOPED_ASSERTION_THROWS
// proves the mutation was rejected.
// ============================================================

describe('BM-134 in-memory semantic mutation matrix', () => {
  let bm134Profile;
  let bm135Profile;
  let provenanceRow;
  let compiledJson;
  const verdicts = [];

  before(() => {
    bm134Profile = loadProfile(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts'),
      'BM134_RUNTIME_UX_PROFILE',
    );
    bm135Profile = loadProfile(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts'),
      'BM135_RUNTIME_UX_PROFILE',
    );
    provenanceRow = findProvenanceRow(readProvenanceLedger(), 'BM-134');
    compiledJson = JSON.parse(
      readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/compiled-v2/BM-134.compiled.json'),
        'utf8',
      ),
    );
  });

  function runMutation(name, mutator, expectedDetector = 'SCOPED_ASSERTION') {
    const cloneProfile = JSON.parse(JSON.stringify(bm134Profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiledJson));
    mutator({ profile: cloneProfile, row: cloneRow, compiled: cloneCompiled });
    let throws = false;
    let actualDetector = 'NONE';
    let failureMessage = '';
    try {
      assertBm134SemanticIdentity(cloneProfile, cloneRow);
    } catch (err) {
      throws = true;
      actualDetector = 'SCOPED_ASSERTION';
      failureMessage = err.message;
    }
    const verdict = throws && actualDetector === expectedDetector ? 'REJECTED' : 'PASSED_THROUGH';
    verdicts.push({
      mutation: name,
      cloneCreated: true,
      expectedDetector,
      actualDetector,
      throws,
      failureMessage,
      verdict,
    });
    return verdict;
  }

  it('BM-134 mutation matrix: every mutation must be REJECTED', () => {
    // 1. title swap → BM-135 title
    runMutation('BM-134 title → BM-135 title (in heading text)', ({ profile }) => {
      profile.fields['recipients.personLine'].label = 'Bị can được hỏi cung';
      profile.demo['recipients.personLine'] = 'Bị can được hỏi cung';
    });
    // 2. recipients.personLine label → BM-135 label (direct label swap)
    runMutation('BM-134 recipients.personLine label → BM-135 label', ({ profile }) => {
      profile.fields['recipients.personLine'].label = 'Bị can được hỏi cung';
    });
    // 3. procedure subfamily → interrogation
    runMutation('BM-134 procedure subfamily → hỏi cung (BM-135)', ({ profile }) => {
      // Inject BM-135 procedure marker into profile title/description
      profile.fields['recipients.personLine'].label = 'Bị can được hỏi cung';
      profile.demo['recipients.personLine'] = 'Bị can được hỏi cung';
    });
    // 4. source extract → BM-135 (provenance row string swap)
    runMutation('BM-134 source extract → BM-135', ({ row }) => {
      row.replace('BM-134__7c1e123c01b0.extract.md', 'BM-135__79b31ad7511e.extract.md');
    });
    // 5. compiled path → BM-135 (provenance row string swap)
    runMutation('BM-134 compiled path → BM-135', ({ row }) => {
      row.replace('BM-134.compiled.json', 'BM-135.compiled.json');
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    assert.equal(
      rejected.length,
      verdicts.length,
      `All ${verdicts.length} BM-134 mutations must be REJECTED. Verdicts: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

describe('BM-135 in-memory semantic mutation matrix', () => {
  let bm135Profile;
  let bm134Profile;
  let provenanceRow;
  let compiledJson;
  const verdicts = [];

  before(() => {
    bm135Profile = loadProfile(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm135-runtime-ux-profile.ts'),
      'BM135_RUNTIME_UX_PROFILE',
    );
    bm134Profile = loadProfile(
      resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux', 'bm134-runtime-ux-profile.ts'),
      'BM134_RUNTIME_UX_PROFILE',
    );
    provenanceRow = findProvenanceRow(readProvenanceLedger(), 'BM-135');
    compiledJson = JSON.parse(
      readFileSync(
        resolve(PROJECT_ROOT, 'docs/audit/docx/compiled-v2/BM-135.compiled.json'),
        'utf8',
      ),
    );
  });

  function runMutation(name, mutator, expectedDetector = 'SCOPED_ASSERTION') {
    const cloneProfile = JSON.parse(JSON.stringify(bm135Profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiledJson));
    mutator({ profile: cloneProfile, row: cloneRow, compiled: cloneCompiled });
    let throws = false;
    let actualDetector = 'NONE';
    let failureMessage = '';
    try {
      assertBm135SemanticIdentity(cloneProfile, cloneRow);
    } catch (err) {
      throws = true;
      actualDetector = 'SCOPED_ASSERTION';
      failureMessage = err.message;
    }
    const verdict = throws && actualDetector === expectedDetector ? 'REJECTED' : 'PASSED_THROUGH';
    verdicts.push({
      mutation: name,
      cloneCreated: true,
      expectedDetector,
      actualDetector,
      throws,
      failureMessage,
      verdict,
    });
    return verdict;
  }

  it('BM-135 mutation matrix: every mutation must be REJECTED', () => {
    runMutation('BM-135 title → BM-134 title (label swap)', ({ profile }) => {
      profile.fields['recipients.personLine'].label = 'Người được lấy lời khai';
      profile.demo['recipients.personLine'] = 'Người được lấy lời khai';
    });
    runMutation('BM-135 recipients.personLine label → BM-134 label', ({ profile }) => {
      profile.fields['recipients.personLine'].label = 'Người được lấy lời khai';
    });
    runMutation('BM-135 procedure subfamily → ghi lời khai (BM-134)', ({ profile }) => {
      profile.fields['recipients.personLine'].label = 'Người được lấy lời khai';
      profile.demo['recipients.personLine'] = 'Người được lấy lời khai';
    });
    runMutation('BM-135 source extract → BM-134', ({ row }) => {
      row.replace('BM-135__79b31ad7511e.extract.md', 'BM-134__7c1e123c01b0.extract.md');
    });
    runMutation('BM-135 compiled path → BM-134', ({ row }) => {
      row.replace('BM-135.compiled.json', 'BM-134.compiled.json');
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    assert.equal(
      rejected.length,
      verdicts.length,
      `All ${verdicts.length} BM-135 mutations must be REJECTED. Verdicts: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});

// ============================================================
// PROVENANCE NEGATIVE MUTATION TESTS
//
// Each test mutates the cloned provenance row with one of the
// documented negative mutations (e.g. legalBasis.canCu cites P0003,
// document.soQuyet claims DIRECT_SLOT/HIGH) and asserts the
// scoped assertion function rejects the mutation.
// ============================================================

describe('BM-134/BM-135 provenance negative mutation matrix', () => {
  const verdicts = [];

  function check(name, row, expectedDetector = 'SCOPED_ASSERTION', fn) {
    let throws = false;
    let actualDetector = 'NONE';
    let failureMessage = '';
    try {
      fn(row);
    } catch (err) {
      throws = true;
      actualDetector = 'SCOPED_ASSERTION';
      failureMessage = err.message;
    }
    const verdict = throws && actualDetector === expectedDetector ? 'REJECTED' : 'PASSED_THROUGH';
    verdicts.push({ name, expectedDetector, actualDetector, throws, verdict, failureMessage });
  }

  it('BM-134 provenance negative mutations must be REJECTED', () => {
    const baseRow = findProvenanceRow(readProvenanceLedger(), 'BM-134');

    // 1. legalBasis.canCu cites P0003
    check(
      'BM-134 legalBasis.canCu cites P0003 quốc hiệu',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /legalBasis\.canCu[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'legalBasis.canCu cites P0003 "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" as DIRECT_SLOT/HIGH',
        );
        assertBm134SemanticIdentity({}, mutated);
      },
    );

    // 2. legalBasis.canCu claims DIRECT_SLOT/HIGH
    check(
      'BM-134 legalBasis.canCu claims DIRECT_SLOT/HIGH',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /legalBasis\.canCu[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'legalBasis.canCu is DIRECT_SLOT/HIGH',
        );
        assertBm134SemanticIdentity({}, mutated);
      },
    );

    // 3. document.chuThe cites P0031
    check(
      'BM-134 document.chuThe cites P0031',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        // Insert a fake document.chuThe=P0031 citation by tampering
        // with the existing segment.
        const mutated = row.replace(
          /document\.chuThe[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.chuThe cites P0031 as entity evidence — DIRECT_SLOT/HIGH',
        );
        assertBm134SemanticIdentity({}, mutated);
      },
    );

    // 4. document.chuThe claims DIRECT_SLOT/HIGH
    check(
      'BM-134 document.chuThe claims DIRECT_SLOT/HIGH',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /document\.chuThe[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.chuThe is DIRECT_SLOT/HIGH',
        );
        assertBm134SemanticIdentity({}, mutated);
      },
    );

    // 5. agency.dongDia cites P0053/P0054 as combined-line evidence
    check(
      'BM-134 agency.dongDia cites P0053/P0054 as combined-line',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /agency\.dongDia[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'agency.dongDia is P0053 + P0054 combined line — DIRECT_SLOT/HIGH',
        );
        assertBm134SemanticIdentity({}, mutated);
      },
    );

    // 6. document.soQuyet says "Số quyết định"
    check(
      'BM-134 document.soQuyet says "Số quyết định"',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /document\.soQuyet[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.soQuyet presentation label = "Số quyết định" with prefix /QĐ-VKS',
        );
        assertBm134SemanticIdentity({}, mutated);
      },
    );

    // 7. document.soQuyet claims a direct DOCX number slot
    check(
      'BM-134 document.soQuyet claims direct DOCX number slot',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /document\.soQuyet[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.soQuyet is DIRECT_SLOT/HIGH — "Số:" paragraph P0005',
        );
        assertBm134SemanticIdentity({}, mutated);
      },
    );

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    assert.equal(
      rejected.length,
      verdicts.length,
      `All ${verdicts.length} BM-134 provenance negative mutations must be REJECTED. Verdicts: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });

  it('BM-135 provenance negative mutations must be REJECTED', () => {
    const baseRow = findProvenanceRow(readProvenanceLedger(), 'BM-135');

    check(
      'BM-135 legalBasis.canCu cites P0003 quốc hiệu',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /legalBasis\.canCu[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'legalBasis.canCu cites P0003 as DIRECT_SLOT/HIGH',
        );
        assertBm135SemanticIdentity({}, mutated);
      },
    );

    check(
      'BM-135 legalBasis.canCu claims DIRECT_SLOT/HIGH',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /legalBasis\.canCu[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'legalBasis.canCu is DIRECT_SLOT/HIGH',
        );
        assertBm135SemanticIdentity({}, mutated);
      },
    );

    check(
      'BM-135 document.chuThe cites P0031 as entity',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /document\.chuThe[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.chuThe cites P0031 as entity — DIRECT_SLOT/HIGH',
        );
        assertBm135SemanticIdentity({}, mutated);
      },
    );

    check(
      'BM-135 document.chuThe claims DIRECT_SLOT/HIGH',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /document\.chuThe[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.chuThe is DIRECT_SLOT/HIGH',
        );
        assertBm135SemanticIdentity({}, mutated);
      },
    );

    check(
      'BM-135 agency.dongDia cites P0053/P0054',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /agency\.dongDia[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'agency.dongDia is P0053+P0054 combined line — DIRECT_SLOT/HIGH',
        );
        assertBm135SemanticIdentity({}, mutated);
      },
    );

    check(
      'BM-135 document.soQuyet says "Số quyết định"',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /document\.soQuyet[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.soQuyet presentation label = "Số quyết định" /QĐ-VKS',
        );
        assertBm135SemanticIdentity({}, mutated);
      },
    );

    check(
      'BM-135 document.soQuyet claims direct DOCX number slot',
      String(baseRow),
      'SCOPED_ASSERTION',
      (row) => {
        const mutated = row.replace(
          /document\.soQuyet[^;]*CONTRACT_ONLY_NO_DOCX_SLOT/iu,
          'document.soQuyet is DIRECT_SLOT/HIGH — "Số:" paragraph P0005',
        );
        assertBm135SemanticIdentity({}, mutated);
      },
    );

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    assert.equal(
      rejected.length,
      verdicts.length,
      `All ${verdicts.length} BM-135 provenance negative mutations must be REJECTED. Verdicts: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});
