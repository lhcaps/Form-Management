/**
 * BM-137 — Biên bản xác minh/làm việc
 * (verification / work session record during investigation stage).
 *
 * Source contract: `docs/audit/docx/compiled-v2/BM-137.compiled.json`
 * Source extract:  `docs/audit/docx/extracted/BM-137__d2c569c61fb7.extract.md`
 *
 * Compatibility presentation policy (authoritative for this curation turn):
 *   - 6 compiled fields, all TEXT.
 *   - Single compiled section `section-thong-tin-bieu-mau`.
 *   - Document identity: `agency.vienKiem` = "Viện kiểm sát tiến hành xác minh/làm việc"
 *     (P0022 + P0023 authority footnotes — FOOTNOTE / MEDIUM).
 *   - Record identity: `document.soBien` = "Số biên bản xác minh/làm việc"
 *     (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no /BB-VKS, no /VKSKV7, no prefix).
 *   - Venue: `document.noiLap` = "Nơi lập biên bản" (P0007 "tại" —
 *     CONTRACT_POSITIONAL_INFERENCE / MEDIUM).
 *   - Time: `document.ngayLap` = "Ngày lập biên bản" (P0007 event-time
 *     sequence — DIRECT_SLOT / HIGH).
 *   - Agency supplementary: `agency.dongDia` = "Dòng địa danh bổ sung
 *     (nếu hồ sơ có)" (CONTRACT_ONLY_NO_DOCX_SLOT / LOW — no source slot).
 *   - Case identity: `document.tenVu` = "Tên vụ án hoặc vụ việc cần xác minh/làm việc"
 *     (P0006 "Về việc:" + P0013 "Tiến hành xác minh/làm việc về việc:" —
 *     DIRECT_SLOT / HIGH).
 *   - Document family: BIÊN BẢN; procedure subfamily: XÁC MINH / LÀM VIỆC.
 *   - Legal workflow basis: CONTEXTUAL_INFERENCE / MEDIUM. BM-137's own
 *     extract contains no literal paragraph citing "Điều 178" or
 *     "Bộ luật Tố tụng hình sự"; the Điều 178 BLTTHS attribution is a
 *     workflow-context inference recorded as `contextualLegalWorkflow`
 *     and NOT as own-extract direct evidence (`legalWorkflowSourceSlots`
 *     contains only real extract paragraphs).
 *
 * Unmapped source slots (recorded in provenance only):
 *   - P0008–P0012: conducting-officer block ("Chúng tôi gồm", "Ông/Bà:",
 *     "Chức danh:", "thuộc Viện kiểm sát2", second "Ông/Bà:") —
 *     no contract field.
 *   - P0014: results heading "KẾT QUẢ XÁC MINH/LÀM VIỆC" —
 *     no contract field.
 *   - P0015: end time of verification ("Việc xác minh/làm việc kết thúc
 *     hồi...giờ...ngày...tháng...năm") — no contract field.
 *   - P0016–P0021: signature blocks — no contract field.
 *   - P0027: "Mẫu số 137/HS" — footer.
 *   - P0024–P0026: footer explanations.
 *
 * Scoped semantic assertions (split into three independent gates):
 *   - assertBm137DocumentIdentity(compiled, provenanceRow, profile) throws
 *     on any mutation of identity-bearing objects (compiled.title,
 *     compiled.templateCode, provenance compiledTitle, provenance
 *     extractHeading, paths).
 *   - assertBm137PresentationIdentity(profile, compiled) throws on any
 *     mutation of presentation labels/sections/demo.
 *   - assertBm137ProvenanceIdentity(provenanceRow) throws on any
 *     mutation of provenance row contents.
 *
 * Run: node --test test/forms/bm137-curation.test.mjs
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

const PROVENANCE_LEDGER_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);

const BM137_CODE = 'BM-137';
const BM137_PROFILE_VAR = 'BM137_RUNTIME_UX_PROFILE';
const BM137_COMPILED_PATH =
  'docs/audit/docx/compiled-v2/BM-137.compiled.json';
const BM137_EXTRACT_PATH =
  'docs/audit/docx/extracted/BM-137__d2c569c61fb7.extract.md';
const BM137_COMPILED_TITLE = 'Biên bản xác minh-làm việc';
const BM137_EXTRACT_HEADING = 'BIÊN BẢN XÁC MINH/LÀM VIỆC';
const BM137_COMPILED_FILE_SHA256 =
  'b76ff61ae76a838024a440f4086852a7a779e1efe46c7386a503ad94c116e17d';
const BM137_EXTRACT_FILE_SHA256 =
  'bbb73a42acab3cd1534d725a1ecf43bf37988cd161125d0a339a829acc203e62';
const BM137_DOCUMENT_FAMILY = 'BIÊN BẢN';
const BM137_PROCEDURE_SUBFAMILY = 'xác-minh-làm-việc';

// BM-134 / BM-135 / BM-136 sibling identity (used as forbidden-target in
// document-identity mutations).
const BM134_TITLE = 'BB ghi lời khai';
const BM134_HEADING = 'BIÊN BẢN GHI LỜI KHAI';
const BM135_TITLE = 'BB hỏi cung bị can';
const BM135_HEADING = 'BIÊN BẢN HỎI CUNG BỊ CAN';
const BM136_TITLE = 'BB đối chất';
const BM136_HEADING = 'BIÊN BẢN ĐỐI CHẤT';

const BM137_EXPECTED_FIELDS = [
  'agency.vienKiem',
  'document.soBien',
  'document.noiLap',
  'document.ngayLap',
  'agency.dongDia',
  'document.tenVu',
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
//
// Operates on identity-bearing objects only:
//   - compiled.title (the document title in the compiled contract)
//   - compiled.templateCode (the form code in the compiled contract)
//   - provenance row compiledTitle substring
//   - provenance row extractHeading substring
//   - compiled/extract paths
//
// Throws with a SCOPED_ASSERTION: prefix whenever a mutation
// slips through. NOT a label/text surface check — only identity
// fields.
// ============================================================

export function assertBm137DocumentIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const row = provenanceRow ?? '';
  const c = compiled ?? {};

  // 1. profile.templateCode must be BM-137.
  if (prof.templateCode !== BM137_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 profile.templateCode is "${prof.templateCode}" — must be "${BM137_CODE}"`,
    );
  }

  // 2. compiled.templateCode must be BM-137.
  if (c.templateCode && c.templateCode !== BM137_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 compiled.templateCode is "${c.templateCode}" — must be "${BM137_CODE}"`,
    );
  }

  // 3. compiled.title must be the BM-137 title verbatim.
  if (c.title && c.title !== BM137_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 compiled.title is "${c.title}" — must be "${BM137_COMPILED_TITLE}"`,
    );
  }

  // 4. compiled.source.title must also be the BM-137 title verbatim.
  if (c.source?.title && c.source.title !== BM137_COMPILED_TITLE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 compiled.source.title is "${c.source.title}" — must be "${BM137_COMPILED_TITLE}"`,
    );
  }

  // 5. provenance row must declare BM-137 compiledTitle exactly.
  if (row) {
    const expectedCompiledTitleMarker = `title="${BM137_COMPILED_TITLE}"`;
    if (!row.includes(expectedCompiledTitleMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 provenance row missing compiledTitle marker "${expectedCompiledTitleMarker}"`,
      );
    }
  }

  // 6. provenance row must declare BM-137 extractHeading exactly.
  if (row) {
    const expectedHeadingMarker = `heading="${BM137_EXTRACT_HEADING}"`;
    if (!row.includes(expectedHeadingMarker)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 provenance row missing extractHeading marker "${expectedHeadingMarker}"`,
      );
    }
  }

  // 7. provenance row must NOT contain any BM-134/135/136 sibling title or heading.
  if (row) {
    const forbiddenIdentityMarkers = [
      BM134_TITLE, BM134_HEADING,
      BM135_TITLE, BM135_HEADING,
      BM136_TITLE, BM136_HEADING,
    ];
    for (const m of forbiddenIdentityMarkers) {
      if (row.includes(m)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-137 provenance row contains sibling identity marker "${m}"`,
        );
      }
    }
  }

  // 8. provenance row must reference own compiled contract path.
  if (row && !row.includes(BM137_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row does not reference own compiled path "${BM137_COMPILED_PATH}"`,
    );
  }

  // 9. provenance row must reference own extract path.
  if (row && !row.includes(BM137_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row does not reference own extract "${BM137_EXTRACT_PATH}"`,
    );
  }

  // 10. provenance row must include own compiled SHA256.
  if (row && !row.includes(BM137_COMPILED_FILE_SHA256)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row does not include own compiled SHA256`,
    );
  }

  // 11. provenance row must include own extract SHA256.
  if (row && !row.includes(BM137_EXTRACT_FILE_SHA256)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row does not include own extract SHA256`,
    );
  }

  // 12. provenance row must NOT reference BM-136's compiled or extract
  //     path (cross-form pointer block).
  if (row) {
    const crossPointers = [
      'docs/audit/docx/compiled-v2/BM-136.compiled.json',
      'docs/audit/docx/extracted/BM-136__f7c2e28ddd12.extract.md',
      'docs/audit/docx/compiled-v2/BM-134.compiled.json',
      'docs/audit/docx/extracted/BM-135__',
    ];
    for (const p of crossPointers) {
      if (row.includes(p)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-137 provenance row contains cross-form pointer "${p}"`,
        );
      }
    }
  }
}

// ============================================================
// SCOPED PRESENTATION-IDENTITY ASSERTION
//
// Operates on the curated profile presentation metadata only:
//   - presentationSections count, id, description
//   - field labels, placeholders, demo values
//   - field count, fields-not-in-contract, duplicates
//
// Throws with SCOPED_ASSERTION: prefix. Does NOT check
// identity-bearing objects (those are validated by
// assertBm137DocumentIdentity).
// ============================================================

export function assertBm137PresentationIdentity(profile, compiled) {
  const prof = profile ?? {};
  const fields = prof.fields ?? {};
  const demo = prof.demo ?? {};
  const sections = prof.presentationSections ?? [];
  const c = compiled ?? {};

  // 1. Compiled contract field count must be exactly 6.
  if (c.source?.fields && c.source.fields.length !== 6) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 compiled contract has ${c.source.fields.length} fields — must be exactly 6`,
    );
  }

  // 2. Single compiled section. Phantom sections like
  //    section-thong-tin-bien-ban or section-dong-dia-danh are forbidden.
  if (sections.length !== 1) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 presentationSections.length is ${sections.length} — must be exactly 1 (the compiled section-thong-tin-bieu-mau)`,
    );
  }
  for (const sec of sections) {
    if (sec.id !== 'section-thong-tin-bieu-mau') {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 presentationSection id is "${sec.id}" — must be "section-thong-tin-bieu-mau" (phantom section detected)`,
      );
    }
    if (!sec.description?.trim()) {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 presentationSection "${sec.id}" has empty description`,
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
          `SCOPED_ASSERTION: BM-137 field "${key}" appears ${count} times in presentationSections — must be exactly 1`,
        );
      }
    }
    for (const key of presented) {
      if (!compiledKeys.includes(key)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-137 presentationSection contains field "${key}" — not in compiled contract`,
        );
      }
    }
  }

  // 4. Compatibility-mapped labels must match exactly.
  const labelExpect = {
    'agency.vienKiem': 'Viện kiểm sát tiến hành xác minh/làm việc',
    'document.soBien': 'Số biên bản xác minh/làm việc',
    'document.noiLap': 'Nơi lập biên bản',
    'document.ngayLap': 'Ngày lập biên bản',
    'agency.dongDia': 'Dòng địa danh bổ sung (nếu hồ sơ có)',
    'document.tenVu': 'Tên vụ án hoặc vụ việc cần xác minh/làm việc',
  };
  for (const [key, expectedLabel] of Object.entries(labelExpect)) {
    if (fields[key]?.label !== expectedLabel) {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 ${key} label is "${fields[key]?.label}" — must be "${expectedLabel}"`,
      );
    }
  }

  // 5. Contract-only fields must keep "(nếu hồ sơ có)" suffix.
  for (const key of ['agency.dongDia']) {
    const lbl = fields[key]?.label ?? '';
    if (!lbl.includes('(nếu hồ sơ có)')) {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 contract-only field "${key}" label "${lbl}" must include "(nếu hồ sơ có)" suffix`,
      );
    }
  }

  // 6. Forbidden surface tokens (labels, placeholders, demo) must
  //    NEVER contain sibling procedural-subfamily headings or
  //    generic decision/issue-day labels.
  const BM137_FORBIDDEN_TOKENS = [
    'BB hỏi cung bị can',
    'BB ghi lời khai',
    'BB đối chất',
    'Tên bị can',
    'Tên bị cáo',
    'Người bị áp dụng',
    'Chủ thể liên quan',
    'Địa danh ban hành',
    'Ngày ban hành',
    'Số quyết định',
    '/BB-VKS',
    'BB-137/VKSKV7',
    '(mẫu BM-137)',
  ];
  const blob = JSON.stringify({ fields, demo, presentationSections: sections });
  for (const token of BM137_FORBIDDEN_TOKENS) {
    if (blob.includes(token)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 profile contains forbidden surface token "${token}"`,
      );
    }
  }

  // 7. Demo must not carry a fabricated case or person identifier.
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
        `SCOPED_ASSERTION: BM-137 demo contains fabricated identifier: "${s}"`,
      );
    }
  }
}

// ============================================================
// SCOPED PROVENANCE-IDENTITY ASSERTION
//
// Operates only on the provenance row text (in-memory clone).
// Verifies the row declares BM-137 self-identity markers and does
// not contain sibling procedural-subfamily headings.
// ============================================================

export function assertBm137ProvenanceIdentity(provenanceRow) {
  const row = provenanceRow ?? '';
  if (!row) {
    throw new Error('SCOPED_ASSERTION: BM-137 provenance row is empty');
  }
  // 1. Row must declare BM-137 workflow signature.
  if (!/xác minh/i.test(row)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-137 provenance row does not mention "xác minh" workflow',
    );
  }
  // 2. Row must NOT introduce BM-134/135/136 identity.
  for (const forbidden of [
    'BB hỏi cung bị can',
    'BB ghi lời khai',
    'BB đối chất',
  ]) {
    if (row.includes(forbidden)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-137 provenance row contains forbidden sibling heading "${forbidden}"`,
      );
    }
  }
  // 3. Row must reference own compiled + extract paths and SHAs.
  if (!row.includes(BM137_COMPILED_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row missing own compiled path "${BM137_COMPILED_PATH}"`,
    );
  }
  if (!row.includes(BM137_EXTRACT_PATH)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row missing own extract path "${BM137_EXTRACT_PATH}"`,
    );
  }
  if (!row.includes(BM137_COMPILED_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-137 provenance row missing own compiled SHA256',
    );
  }
  if (!row.includes(BM137_EXTRACT_FILE_SHA256)) {
    throw new Error(
      'SCOPED_ASSERTION: BM-137 provenance row missing own extract SHA256',
    );
  }
  // 4. Row must declare compiledTitle marker for BM-137.
  if (!row.includes(`title="${BM137_COMPILED_TITLE}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row missing compiledTitle marker title="${BM137_COMPILED_TITLE}"`,
    );
  }
  // 5. Row must declare extractHeading marker for BM-137.
  if (!row.includes(`heading="${BM137_EXTRACT_HEADING}"`)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-137 provenance row missing extractHeading marker heading="${BM137_EXTRACT_HEADING}"`,
    );
  }
  // 6. Row must NOT treat Điều 178 BLTTHS as an own-extract source slot;
  //    contextual legal workflow (Điều 178 BLTTHS) must be a workflow
  //    inference, NOT a literal paragraph citation. Verify the row says
  //    "Điều 178" only inside a workflow-context qualifier (e.g.
  //    "contextualLegalWorkflow" or "workflow-context inference").
  if (row.includes('Điều 178')) {
    // If "Điều 178" is present, it must be qualified as
    // contextual/legalWorkflowOnlySlots/ workflow-context inference.
    const okContextMarkers = [
      'contextualLegalWorkflow',
      'legalWorkflowOnlySlots',
      'workflow-context inference',
      'CONTEXTUAL_INFERENCE',
    ];
    if (!okContextMarkers.some((m) => row.includes(m))) {
      throw new Error(
        'SCOPED_ASSERTION: BM-137 provenance row mentions "Điều 178" without qualifying it as contextual legal workflow',
      );
    }
  }
}

// ============================================================
// SCOPED SEMANTIC IDENTITY (combined, exported for backwards compat)
// ============================================================

export function assertBm137SemanticIdentity(profile, provenanceRow, compiled) {
  assertBm137DocumentIdentity(profile, provenanceRow, compiled);
  assertBm137PresentationIdentity(profile, compiled);
  assertBm137ProvenanceIdentity(provenanceRow);
}

describe('BM-137 invariant tests (Section 11)', () => {
  let profile;
  let provenanceRow;
  let compiled;

  before(() => {
    profile = loadProfileFor(BM137_CODE, BM137_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM137_CODE);
    compiled = loadContract(BM137_CODE);
  });

  it('BM-137 profile.templateCode is "BM-137"', () => {
    assert.equal(profile.templateCode, BM137_CODE);
  });

  it('BM-137 profile has 6 fields matching the compiled contract', () => {
    const keys = Object.keys(profile.fields);
    assert.equal(keys.length, 6);
    for (const k of BM137_EXPECTED_FIELDS) {
      assert.ok(keys.includes(k), `BM-137 profile missing field "${k}"`);
    }
  });

  it('BM-137 demo has 6 values matching the compiled contract', () => {
    const keys = Object.keys(profile.demo);
    assert.equal(keys.length, 6);
  });

  it('BM-137 has exactly one presentationSection: section-thong-tin-bieu-mau', () => {
    const sections = profile.presentationSections;
    assert.ok(Array.isArray(sections), 'presentationSections must be an array');
    assert.equal(sections.length, 1);
    assert.equal(sections[0].id, 'section-thong-tin-bieu-mau');
    assert.ok(
      sections[0].description?.trim(),
      'BM-137 presentationSection must have a non-empty description',
    );
  });

  it('BM-137 no generated "(mẫu BM-137)" markers in placeholders', () => {
    for (const [k, v] of Object.entries(profile.fields)) {
      const ph = String(v.placeholder ?? '');
      assert.ok(
        !/\(m(?:ẫu|áº«u)\s+BM-137\)/iu.test(ph),
        `BM-137 field "${k}" placeholder "${ph}" must not contain generated "(mẫu BM-137)" marker`,
      );
    }
  });

  it('BM-137 demo does not contain /BB-VKS or /VKSKV7 prefix', () => {
    for (const [k, v] of Object.entries(profile.demo)) {
      const s = String(v ?? '');
      assert.ok(
        !/\/BB-VKS/i.test(s) && !/\/VKSKV7/i.test(s),
        `BM-137 demo field "${k}" value "${s}" must not contain /BB-VKS or /VKSKV7 prefix`,
      );
    }
  });

  it('BM-137 profile passes shared validator (validateCuration) with empty issues', () => {
    const issues = validateCuration(profile, compiled, provenanceRow);
    assert.deepEqual(
      issues,
      [],
      `BM-137 shared validator must report zero issues — got: ${JSON.stringify(issues, null, 2)}`,
    );
  });

  it('BM-137 provenance row exists with own extract SHA256', () => {
    assert.ok(provenanceRow, 'BM-137 provenance row must exist');
    assert.ok(provenanceRow.includes(BM137_EXTRACT_PATH));
    assert.ok(provenanceRow.includes(BM137_EXTRACT_FILE_SHA256));
  });

  it('BM-137 scoped document identity passes (no throw)', () => {
    assertBm137DocumentIdentity(profile, provenanceRow, compiled);
  });

  it('BM-137 scoped presentation identity passes (no throw)', () => {
    assertBm137PresentationIdentity(profile, compiled);
  });

  it('BM-137 scoped provenance identity passes (no throw)', () => {
    assertBm137ProvenanceIdentity(provenanceRow);
  });

  it('BM-137 scoped semantic identity passes (no throw)', () => {
    assertBm137SemanticIdentity(profile, provenanceRow, compiled);
  });
});

// ============================================================
// DOCUMENT-IDENTITY MUTATION MATRIX
//
// Each mutation targets an actual identity-bearing object:
//   compiled.title, compiled.templateCode, provenance row
//   compiledTitle substring, provenance row extractHeading
//   substring, compiled/extract path, compiled field count.
// Each must be REJECTED by assertBm137DocumentIdentity (or
// assertBm137ProvenanceIdentity for path/heading/title text mutations).
// ============================================================

describe('BM-137 document-identity mutation matrix (Section 5)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM137_CODE, BM137_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM137_CODE);
    compiled = loadContract(BM137_CODE);
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
      assertBm137SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
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
    // 1. compiled.title → BM-134 title (real title mutation, not label).
    runDocMutation('compiled-title-to-BM-134', ({ compiled: c }) => {
      c.title = BM134_TITLE;
      c.source.title = BM134_TITLE;
    });
    // 2. compiled.title → BM-135 title.
    runDocMutation('compiled-title-to-BM-135', ({ compiled: c }) => {
      c.title = BM135_TITLE;
      c.source.title = BM135_TITLE;
    });
    // 3. compiled.title → BM-136 title.
    runDocMutation('compiled-title-to-BM-136', ({ compiled: c }) => {
      c.title = BM136_TITLE;
      c.source.title = BM136_TITLE;
    });
    // 4. compiled.templateCode → BM-136.
    runDocMutation('compiled-templateCode-to-BM-136', ({ compiled: c }) => {
      c.templateCode = 'BM-136';
    });
    // 5. provenance row compiledTitle substring → BM-136 title.
    runDocMutation('row-compiledTitle-to-BM-136', ({ row }) => {
      const target = `title="${BM137_COMPILED_TITLE}"`;
      const swap = `title="${BM136_TITLE}"`;
      const idx = row.indexOf(target);
      if (idx >= 0) row.replace(target, swap);
      else row + ` title="${BM136_TITLE}"`;
      // Apply via string replace to the clone.
      verdicts[verdicts.length - 1] && (verdicts[verdicts.length - 1].mutation);
      // Use direct replace on the captured string.
      // (cloneRow is a String; assigning via mutator does not affect
      // the test's main provenanceRow variable.)
      return;
    });
    // The mutator above accidentally no-ops. Use a proper inline replace:
    verdicts.pop();
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        `title="${BM137_COMPILED_TITLE}"`,
        `title="${BM136_TITLE}"`,
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm137SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
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
    // 6. provenance row extractHeading substring → BIÊN BẢN ĐỐI CHẤT.
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        `heading="${BM137_EXTRACT_HEADING}"`,
        `heading="${BM136_HEADING}"`,
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm137SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION')
          ? 'SCOPED_ASSERTION'
          : 'OTHER';
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-extractHeading-to-BM-136',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: detector,
        throws,
        errorMessage: errMsg,
        verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 7. provenance row references BM-136 compiled path (cross-form
    //    pointer through provenance).
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        BM137_COMPILED_PATH,
        'docs/audit/docx/compiled-v2/BM-136.compiled.json',
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm137SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION')
          ? 'SCOPED_ASSERTION'
          : 'OTHER';
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-compiledPath-to-BM-136',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: detector,
        throws,
        errorMessage: errMsg,
        verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 8. provenance row references BM-136 extract path (cross-form
    //    pointer through provenance).
    {
      const cloneProfile = JSON.parse(JSON.stringify(profile));
      const cloneRow = String(provenanceRow ?? '').replace(
        BM137_EXTRACT_PATH,
        'docs/audit/docx/extracted/BM-136__f7c2e28ddd12.extract.md',
      );
      const cloneCompiled = JSON.parse(JSON.stringify(compiled));
      let throws = false;
      let detector = 'NONE';
      let errMsg = '';
      try {
        assertBm137SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
      } catch (err) {
        throws = true;
        detector = err.message.startsWith('SCOPED_ASSERTION')
          ? 'SCOPED_ASSERTION'
          : 'OTHER';
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-extractPath-to-BM-136',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: detector,
        throws,
        errorMessage: errMsg,
        verdict: throws && detector === 'SCOPED_ASSERTION' ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 9. compiled field count inflation to 17 (BM-136 family size).
    runDocMutation('compiled-field-count-to-17', ({ compiled: c }) => {
      const filler = { key: 'agency.foo', label: 'Foo', kind: 'TEXT' };
      while (c.source.fields.length < 17) c.source.fields.push(filler);
    });
    // 10. profile.templateCode → BM-134.
    runDocMutation('profile-templateCode-to-BM-134', ({ profile: p }) => {
      p.templateCode = 'BM-134';
    });
    // 11. profile.templateCode → BM-136.
    runDocMutation('profile-templateCode-to-BM-136', ({ profile: p }) => {
      p.templateCode = 'BM-136';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-137 document-identity mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 10,
      `BM-137 must reject at least 10 document-identity mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });

  it('every document-identity rejection starts with SCOPED_ASSERTION', () => {
    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    for (const v of rejected) {
      assert.ok(
        v.errorMessage.startsWith('SCOPED_ASSERTION'),
        `BM-137 doc-identity mutation "${v.mutation}" error message must start with SCOPED_ASSERTION — got: ${v.errorMessage}`,
      );
    }
  });
});

// ============================================================
// PRESENTATION-IDENTITY MUTATION MATRIX
//
// Mutations target presentation metadata only (labels, sections,
// placeholders, demo values). They must NOT mutate identity-bearing
// objects — that would be a document-identity mutation, classified
// separately above.
// ============================================================

describe('BM-137 presentation-identity mutation matrix (Section 6)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM137_CODE, BM137_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM137_CODE);
    compiled = loadContract(BM137_CODE);
    verdicts = [];
  });

  function runPresMutation(name, mutator) {
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
      // Presentation gate alone: do not assert document-identity here
      // (that gate is exercised by the document-identity matrix).
      assertBm137PresentationIdentity(cloneProfile, cloneCompiled);
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
    // 2. document.soBien label → "Số quyết định" (wrong document type).
    runPresMutation('document.soBien-to-So-quyet-dinh', ({ profile: p }) => {
      p.fields['document.soBien'].label = 'Số quyết định';
    });
    // 3. document.ngayLap label → "Ngày ban hành" (generic).
    runPresMutation('document.ngayLap-to-Ngay-ban-hanh', ({ profile: p }) => {
      p.fields['document.ngayLap'].label = 'Ngày ban hành';
    });
    // 4. document.noiLap label → "Địa danh ban hành".
    runPresMutation('document.noiLap-to-Dia-danh', ({ profile: p }) => {
      p.fields['document.noiLap'].label = 'Địa danh ban hành';
    });
    // 5. agency.dongDia suffix dropped.
    runPresMutation('agency.dongDia-suffix-dropped', ({ profile: p }) => {
      p.fields['agency.dongDia'].label = 'Dòng địa danh';
    });
    // 6. document.tenVu label → "Tên bị can" (procedural subject drift).
    runPresMutation('document.tenVu-to-Ten-bi-can', ({ profile: p }) => {
      p.fields['document.tenVu'].label = 'Tên bị can';
    });
    // 7. Reintroduce generated marker in placeholder.
    runPresMutation('placeholder-marker-reintro', ({ profile: p }) => {
      p.fields['agency.vienKiem'].placeholder =
        'Tên cơ quan (mẫu BM-137)';
    });
    // 8. demo value contains /BB-VKS prefix.
    runPresMutation('demo-bbvks-prefix', ({ profile: p }) => {
      p.demo['document.soBien'] = '12/BB-VKS';
    });
    // 9. demo value contains fabricated BB-137/VKSKV7 prefix.
    runPresMutation('demo-vkskv7-prefix', ({ profile: p }) => {
      p.demo['document.soBien'] = 'BB-137/VKSKV7';
    });
    // 10. demo fabricated case "Lừa đảo chiếm đoạt".
    runPresMutation('demo-fabricated-case', ({ profile: p }) => {
      p.demo['document.tenVu'] =
        'Vụ án hình sự Lê Minh K về tội Lừa đảo chiếm đoạt tài sản';
    });
    // 11. demo person-name in date field.
    runPresMutation('demo-person-in-date', ({ profile: p }) => {
      p.demo['document.ngayLap'] = 'Tran Van Binh';
    });
    // 12. demo fabricated person in supplementary field.
    runPresMutation('demo-fabricated-person-supplementary', ({ profile: p }) => {
      p.demo['agency.dongDia'] = 'Nguyen Van A';
    });
    // 13. Phantom section reintroduced.
    runPresMutation('phantom-section-reintro', ({ profile: p }) => {
      p.presentationSections = [
        {
          id: 'section-thong-tin-bien-ban',
          title: 'Thông tin biên bản',
          description: 'phantom',
          fieldKeys: ['agency.vienKiem', 'document.soBien', 'document.noiLap', 'document.ngayLap'],
        },
        {
          id: 'section-dong-dia-danh',
          title: 'Dòng địa danh',
          description: 'phantom',
          fieldKeys: ['agency.dongDia', 'document.tenVu'],
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
    // 18. Inject forbidden surface token "BB hỏi cung bị can" into a label.
    runPresMutation('label-injects-bb-hoi-cung', ({ profile: p }) => {
      p.fields['agency.vienKiem'].label =
        'BB hỏi cung bị can — ban hành';
    });
    // 19. Inject forbidden surface token "BB ghi lời khai" into a label.
    runPresMutation('label-injects-bb-ghi-loi-khai', ({ profile: p }) => {
      p.fields['agency.vienKiem'].label =
        'BB ghi lời khai — ban hành';
    });
    // 20. Inject forbidden surface token "BB đối chất" into a label.
    runPresMutation('label-injects-bb-doi-chat', ({ profile: p }) => {
      p.fields['agency.vienKiem'].label = 'BB đối chất — ban hành';
    });

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-137 presentation mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 18,
      `BM-137 must reject at least 18 presentation mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });

  it('every presentation-identity rejection starts with SCOPED_ASSERTION', () => {
    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    for (const v of rejected) {
      assert.ok(
        v.errorMessage.startsWith('SCOPED_ASSERTION'),
        `BM-137 presentation mutation "${v.mutation}" error message must start with SCOPED_ASSERTION — got: ${v.errorMessage}`,
      );
    }
  });
});

// ============================================================
// PROVENANCE-IDENTITY MUTATION MATRIX
//
// Provenance-row mutations only (the row is a string).
// ============================================================

describe('BM-137 provenance-identity mutation matrix (Section 10)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM137_CODE, BM137_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM137_CODE);
    compiled = loadContract(BM137_CODE);
    verdicts = [];
  });

  function runProvMutation(name, mutator) {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    mutator({ profile: cloneProfile, row: cloneRow, compiled: cloneCompiled });
    let throws = false;
    let detector = 'NONE';
    let errMsg = '';
    try {
      assertBm137ProvenanceIdentity(cloneRow);
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

  it('provenance-identity mutations are all REJECTED by SCOPED_ASSERTION', () => {
    // 1. Strip the workflow signature.
    runProvMutation('row-strip-xac-minh', ({ row }) => {
      row.replace(/xác minh/iu, 'SOMETHING_ELSE');
      return;
    });
    verdicts.pop();
    {
      const clone = String(provenanceRow).replace(/xác minh/iu, 'something_else');
      let throws = false;
      let errMsg = '';
      try {
        assertBm137ProvenanceIdentity(clone);
      } catch (err) {
        throws = true;
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-strip-xac-minh',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: errMsg.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER',
        throws,
        errorMessage: errMsg,
        verdict: throws && errMsg.startsWith('SCOPED_ASSERTION') ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 2. Strip own extract path.
    {
      const clone = String(provenanceRow).replace(BM137_EXTRACT_PATH, 'docs/audit/docx/extracted/__REMOVED__.extract.md');
      let throws = false;
      let errMsg = '';
      try {
        assertBm137ProvenanceIdentity(clone);
      } catch (err) {
        throws = true;
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-strip-extract-path',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: errMsg.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER',
        throws,
        errorMessage: errMsg,
        verdict: throws && errMsg.startsWith('SCOPED_ASSERTION') ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 3. Strip own extract SHA256.
    {
      const clone = String(provenanceRow).replace(BM137_EXTRACT_FILE_SHA256, '0'.repeat(64));
      let throws = false;
      let errMsg = '';
      try {
        assertBm137ProvenanceIdentity(clone);
      } catch (err) {
        throws = true;
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-strip-extract-sha',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: errMsg.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER',
        throws,
        errorMessage: errMsg,
        verdict: throws && errMsg.startsWith('SCOPED_ASSERTION') ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 4. Inject sibling heading "BB hỏi cung bị can".
    {
      const clone = String(provenanceRow) + ' BB hỏi cung bị can';
      let throws = false;
      let errMsg = '';
      try {
        assertBm137ProvenanceIdentity(clone);
      } catch (err) {
        throws = true;
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-injects-BM-135-heading',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: errMsg.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER',
        throws,
        errorMessage: errMsg,
        verdict: throws && errMsg.startsWith('SCOPED_ASSERTION') ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 5. Strip compiledTitle marker.
    {
      const clone = String(provenanceRow).replace(`title="${BM137_COMPILED_TITLE}"`, 'title=""');
      let throws = false;
      let errMsg = '';
      try {
        assertBm137ProvenanceIdentity(clone);
      } catch (err) {
        throws = true;
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-strip-compiledTitle-marker',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: errMsg.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER',
        throws,
        errorMessage: errMsg,
        verdict: throws && errMsg.startsWith('SCOPED_ASSERTION') ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }
    // 6. Strip extractHeading marker.
    {
      const clone = String(provenanceRow).replace(`heading="${BM137_EXTRACT_HEADING}"`, 'heading=""');
      let throws = false;
      let errMsg = '';
      try {
        assertBm137ProvenanceIdentity(clone);
      } catch (err) {
        throws = true;
        errMsg = err.message;
      }
      verdicts.push({
        mutation: 'row-strip-extractHeading-marker',
        expectedDetector: 'SCOPED_ASSERTION',
        actualDetector: errMsg.startsWith('SCOPED_ASSERTION') ? 'SCOPED_ASSERTION' : 'OTHER',
        throws,
        errorMessage: errMsg,
        verdict: throws && errMsg.startsWith('SCOPED_ASSERTION') ? 'REJECTED' : 'PASSED_THROUGH',
      });
    }

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-137 provenance mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
    assert.ok(
      rejected.length >= 6,
      `BM-137 must reject at least 6 provenance mutations — got ${rejected.length}: ${JSON.stringify(verdicts, null, 2)}`,
    );
  });
});



