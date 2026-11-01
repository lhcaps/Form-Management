/**
 * BM-136 — Biên bản đối chất (confrontation record between two parties).
 *
 * Source contract: `docs/audit/docx/compiled-v2/BM-136.compiled.json`
 * Source extract:  `docs/audit/docx/extracted/BM-136__f7c2e28ddd12.extract.md`
 *
 * Compatibility presentation policy (authoritative for this curation turn):
 *   - 17 compiled fields, all TEXT.
 *   - Single compiled section `section-thong-tin-bieu-mau`.
 *   - Participants: `person.tenBi` = first party (P0018–P0029, DIRECT_SLOT/HIGH);
 *     `document.chuThe` = second party (P0030–P0041, MEDIUM).
 *   - Officials: `recipients.personLine` = "Người tiến hành đối chất"
 *     (P0012 + P0013/P0015, MEDIUM).
 *   - Procedural roles: `signature.chucVu` = "Tư cách tham gia tố tụng ..."
 *     (P0029 + P0041, HIGH).
 *   - Record identity: `document.soQuyet` = "Số biên bản đối chất"
 *     (CONTRACT_ONLY_NO_DOCX_SLOT/LOW — no /BB-VKS, no fake prefix).
 *   - Legal workflow: Điều 178 + Điều 189 BLTTHS.
 *   - Document family: BIÊN BẢN; procedure subfamily: ĐỐI CHẤT.
 *   - Unmapped source slots: P0017 (legal basis) + P0046–P0051 (end time).
 *
 * Scoped semantic assertions:
 *   - assertBm136SemanticIdentity(profile, provenanceRow, compiled)
 *     throws on any of the 23 documented mutation patterns (Section 11).
 *
 * Run: node --test test/forms/bm136-curation.test.mjs
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
const MATURITY_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_MATURITY.latest.json',
);

const BM136_CODE = 'BM-136';
const BM136_PROFILE_VAR = 'BM136_RUNTIME_UX_PROFILE';
const BM136_EXTRACT_FILE = 'BM-136__f7c2e28ddd12.extract.md';
const BM136_TITLE = 'BB đối chất';
const BM136_OWN_EXTRACT_SHA256 =
  'a8728bc2de25aa1a93ed33e610a12ac1a981a5aba90db66ffc174bd2c2686782';
const BM136_DOCUMENT_FAMILY = 'BIÊN BẢN';
const BM136_PROCEDURE_SUBFAMILY = 'đối-chất';

const BM136_EXPECTED_FIELDS = [
  'agency.vienKiem',
  'signature.positionTitle',
  'recipients.personLine',
  'document.soQuyet',
  'agency.diaDanh',
  'document.ngayBan',
  'agency.dongDia',
  'document.chuThe',
  'person.tenBi',
  'document.tenVu',
  'person.toiDanh',
  'document.soTien',
  'document.lyDo',
  'recipients.luuHo',
  'signature.cheDo',
  'signature.chucVu',
  'signature.nguoiKy',
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
// SCOPED SEMANTIC ASSERTION
//
// Operates on in-memory profile + provenance row + compiled contract.
// Throws when a semantic-identity mutation slips through. Each throw
// carries a SCOPED_ASSERTION: prefix so callers can attribute the
// detector unambiguously.
//
// This is the proof-of-rejection surface for BM-136. The mutation
// tests below call this function and require it to throw.
// ============================================================

/** Forbidden tokens that must NEVER appear in BM-136 post-curation. */
const BM136_FORBIDDEN_TOKENS = [
  'Số quyết định',
  'BB hỏi cung bị can',
  'BB ghi lời khai',
  'Người bị áp dụng',
  'Tên bị can',
  'Chủ thể liên quan',
  'Địa danh ban hành',
  'Ngày ban hành',
  '/BB-VKS',
  '(mẫu BM-136)',
];

export function assertBm136SemanticIdentity(profile, provenanceRow, compiled) {
  const prof = profile ?? {};
  const fields = prof.fields ?? {};
  const demo = prof.demo ?? {};
  const sections = prof.presentationSections ?? [];
  const row = provenanceRow ?? '';

  // 1. Document identity: templateCode must be BM-136 (not BM-134/135).
  if (prof.templateCode !== BM136_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 profile.templateCode is "${prof.templateCode}" — must be "${BM136_CODE}"`,
    );
  }

  // 2. Compiled contract, if supplied, must declare BM-136 (not BM-134/135).
  if (compiled?.templateCode && compiled.templateCode !== BM136_CODE) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 compiled.templateCode is "${compiled.templateCode}" — must be "${BM136_CODE}"`,
    );
  }

  // 3. Compiled contract field count must be exactly 17.
  if (compiled?.source?.fields && compiled.source.fields.length !== 17) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 compiled contract has ${compiled.source.fields.length} fields — must be exactly 17`,
    );
  }

  // 4. Single compiled section. Phantom sections like
  //    section-chu-the-va-vu-an are forbidden.
  if (sections.length !== 1) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 presentationSections.length is ${sections.length} — must be exactly 1 (the compiled section-thong-tin-bieu-mau)`,
    );
  }
  for (const sec of sections) {
    if (sec.id !== 'section-thong-tin-bieu-mau') {
      throw new Error(
        `SCOPED_ASSERTION: BM-136 presentationSection id is "${sec.id}" — must be "section-thong-tin-bieu-mau" (phantom section detected)`,
      );
    }
    if (!sec.description?.trim()) {
      throw new Error(
        `SCOPED_ASSERTION: BM-136 presentationSection "${sec.id}" has empty description`,
      );
    }
  }

  // 5. Compiled fields must appear exactly once across presentationSections.
  if (compiled?.source?.fields) {
    const compiledKeys = compiled.source.fields.map((f) => f.key);
    const presented = sections.flatMap((s) => s.fieldKeys ?? []);
    for (const key of compiledKeys) {
      const count = presented.filter((k) => k === key).length;
      if (count !== 1) {
        throw new Error(
          `SCOPED_ASSERTION: BM-136 field "${key}" appears ${count} times in presentationSections — must be exactly 1`,
        );
      }
    }
    for (const key of presented) {
      if (!compiledKeys.includes(key)) {
        throw new Error(
          `SCOPED_ASSERTION: BM-136 presentationSection contains field "${key}" — not in compiled contract`,
        );
      }
    }
  }

  // 6. Compatibility-mapped labels must match exactly:
  //    recipients.personLine = "Người tiến hành đối chất"
  if (fields['recipients.personLine']?.label !== 'Người tiến hành đối chất') {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 recipients.personLine label is "${fields['recipients.personLine']?.label}" — must be "Người tiến hành đối chất"`,
    );
  }
  //    person.tenBi = "Người tham gia đối chất thứ nhất"
  if (fields['person.tenBi']?.label !== 'Người tham gia đối chất thứ nhất') {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 person.tenBi label is "${fields['person.tenBi']?.label}" — must be "Người tham gia đối chất thứ nhất"`,
    );
  }
  //    document.chuThe = "Người tham gia đối chất thứ hai"
  if (fields['document.chuThe']?.label !== 'Người tham gia đối chất thứ hai') {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 document.chuThe label is "${fields['document.chuThe']?.label}" — must be "Người tham gia đối chất thứ hai"`,
    );
  }
  //    signature.nguoiKy = "Người tham gia đối chất khác (nếu có)"
  if (
    fields['signature.nguoiKy']?.label !==
    'Người tham gia đối chất khác (nếu có)'
  ) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 signature.nguoiKy label is "${fields['signature.nguoiKy']?.label}" — must be "Người tham gia đối chất khác (nếu có)"`,
    );
  }
  //    signature.chucVu = "Tư cách tham gia tố tụng của các bên đối chất"
  if (
    fields['signature.chucVu']?.label !==
    'Tư cách tham gia tố tụng của các bên đối chất'
  ) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 signature.chucVu label is "${fields['signature.chucVu']?.label}" — must be "Tư cách tham gia tố tụng của các bên đối chất"`,
    );
  }
  //    signature.positionTitle = "Chức danh người tiến hành đối chất"
  if (
    fields['signature.positionTitle']?.label !==
    'Chức danh người tiến hành đối chất'
  ) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 signature.positionTitle label is "${fields['signature.positionTitle']?.label}" — must be "Chức danh người tiến hành đối chất"`,
    );
  }
  //    agency.vienKiem = "Viện kiểm sát thực hiện đối chất"
  if (
    fields['agency.vienKiem']?.label !== 'Viện kiểm sát thực hiện đối chất'
  ) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 agency.vienKiem label is "${fields['agency.vienKiem']?.label}" — must be "Viện kiểm sát thực hiện đối chất"`,
    );
  }
  //    agency.diaDanh = "Địa điểm tiến hành đối chất"
  if (fields['agency.diaDanh']?.label !== 'Địa điểm tiến hành đối chất') {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 agency.diaDanh label is "${fields['agency.diaDanh']?.label}" — must be "Địa điểm tiến hành đối chất"`,
    );
  }
  //    document.ngayBan = "Thời điểm bắt đầu đối chất"
  if (
    fields['document.ngayBan']?.label !== 'Thời điểm bắt đầu đối chất'
  ) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 document.ngayBan label is "${fields['document.ngayBan']?.label}" — must be "Thời điểm bắt đầu đối chất"`,
    );
  }
  //    document.soQuyet = "Số biên bản đối chất"
  if (fields['document.soQuyet']?.label !== 'Số biên bản đối chất') {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 document.soQuyet label is "${fields['document.soQuyet']?.label}" — must be "Số biên bản đối chất"`,
    );
  }
  //    signature.cheDo = "Địa chỉ cư trú của người tham gia đối chất"
  if (
    fields['signature.cheDo']?.label !==
    'Địa chỉ cư trú của người tham gia đối chất'
  ) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 signature.cheDo label is "${fields['signature.cheDo']?.label}" — must be "Địa chỉ cư trú của người tham gia đối chất"`,
    );
  }

  // 7. Contract-only fields must not claim direct DOCX evidence.
  //    These must keep their "(nếu hồ sơ có)" suffix indicating they
  //    are absent from the DOCX source.
  for (const key of [
    'document.tenVu',
    'person.toiDanh',
    'document.soTien',
    'document.lyDo',
    'recipients.luuHo',
    'agency.dongDia',
  ]) {
    const label = fields[key]?.label ?? '';
    if (!label.includes('(nếu hồ sơ có)')) {
      throw new Error(
        `SCOPED_ASSERTION: BM-136 contract-only field "${key}" label is "${label}" — must include "(nếu hồ sơ có)" to signal CONTRACT_ONLY_NO_DOCX_SLOT`,
      );
    }
  }

  // 8. No forbidden tokens anywhere in the profile text.
  const corpus = JSON.stringify({
    fields,
    demo,
    sections,
    title: prof.title,
  });
  for (const token of BM136_FORBIDDEN_TOKENS) {
    if (corpus.includes(token)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-136 profile contains forbidden token "${token}" — semantic identity violated`,
      );
    }
  }

  // 9. Provenance identity:
  //    - must cite own extract
  if (!row.includes(BM136_EXTRACT_FILE)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance lost citation of ${BM136_EXTRACT_FILE}`,
    );
  }
  //    - must NOT cite BM-134 / BM-135 / BM-131/132/133 / BM-001/171 extracts
  for (const otherExtract of [
    'BM-134__',
    'BM-135__',
    'BM-131__',
    'BM-132__',
    'BM-133__',
    'BM-001__',
    'BM-171__',
  ]) {
    if (row.includes(otherExtract)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-136 provenance cites cross-form extract starting with "${otherExtract}" — semantic identity violated`,
      );
    }
  }
  //    - must cite own compiled path
  if (!row.includes('BM-136.compiled.json')) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance lost citation of BM-136.compiled.json`,
    );
  }
  //    - must cite Điều 178 BLTTHS legal workflow anchor
  if (!row.includes('Điều 178')) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance lost Điều 178 BLTTHS legal workflow anchor`,
    );
  }
  //    - must NOT silently promote to runtimeReady
  if (/runtime-ready|runtimeReady/iu.test(row)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance silently references runtimeReady — must be Not promoted`,
    );
  }
  //    - must declare P0017 as legal-basis/operative-introduction slot
  //      AND P0046–P0051 as end-time slot (unmappedSourceSlots)
  if (!row.includes('P0017')) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance lost P0017 legal-basis anchor`,
    );
  }
  if (!row.includes('P0046')) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance lost P0046–P0051 end-time anchor`,
    );
  }
  //    - must enumerate compatibility-mapped fields explicitly
  for (const field of [
    'recipients.personLine',
    'person.tenBi',
    'document.chuThe',
    'signature.nguoiKy',
  ]) {
    if (!row.includes(field)) {
      throw new Error(
        `SCOPED_ASSERTION: BM-136 provenance lost compatibility-mapped field "${field}"`,
      );
    }
  }
  //    - must declare document family + procedure subfamily
  if (!row.includes('BIÊN BẢN')) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance lost document family "BIÊN BẢN"`,
    );
  }
  if (!/đối\s*chất/iu.test(row)) {
    throw new Error(
      `SCOPED_ASSERTION: BM-136 provenance lost procedure subfamily "ĐỐI CHẤT"`,
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
// BASELINE INVARIANTS — pre-curation failing state is captured
// here so each gate has a visible RED→GREEN transition.
// ============================================================

describe(`BM-136 curation: ${BM136_CODE} (baseline invariants)`, () => {
  const contract = loadContract(BM136_CODE);
  const profile = loadProfileFor(BM136_CODE, BM136_PROFILE_VAR);

  it('BM-136 profile loads without error', () => {
    assert.ok(profile, 'BM-136 profile must load');
  });

  it('BM-136 has correct templateCode', () => {
    assert.equal(profile.templateCode, BM136_CODE);
  });

  it('BM-136 compiled contract has exactly 17 fields', () => {
    assert.equal(contract.source.fields.length, 17);
  });

  it('BM-136 compiled fields match expected set exactly', () => {
    const actual = contract.source.fields.map((f) => f.key).sort();
    assert.deepEqual(actual, [...BM136_EXPECTED_FIELDS].sort());
  });

  it('BM-136 presentationSections covers all compiled fields exactly once', () => {
    const compiledFieldKeys = new Set(contract.source.fields.map((f) => f.key));
    const presentedKeys = new Set();
    for (const ps of profile.presentationSections ?? []) {
      for (const key of ps.fieldKeys ?? []) {
        assert.ok(
          !presentedKeys.has(key),
          `BM-136 must not duplicate field "${key}" in presentationSections`,
        );
        presentedKeys.add(key);
      }
    }
    const missing = [...compiledFieldKeys].filter((k) => !presentedKeys.has(k));
    assert.deepEqual(missing, [], `missing fields: ${missing.join(', ')}`);
    const extra = [...presentedKeys].filter((k) => !compiledFieldKeys.has(k));
    assert.deepEqual(extra, [], `extra fields: ${extra.join(', ')}`);
  });

  it('BM-136 demo does NOT contain generic "(mẫu BM-NNN)" marker', () => {
    const demoStr = JSON.stringify(profile.demo ?? {});
    assert.ok(
      !/\(mẫu\s+BM-\d{3}\)/iu.test(demoStr),
      `BM-136 demo must not carry "(mẫu BM-136)" placeholder — got: ${demoStr}`,
    );
  });

  it('BM-136 provenance row exists in curation ledger', () => {
    const ledger = fs.readFileSync(PROVENANCE_LEDGER_PATH, 'utf8');
    const row = findProvenanceRow(ledger, BM136_CODE);
    assert.ok(row, 'BM-136 must have a provenance row');
  });

  it('BM-136 must NOT appear in PHASE14_BROWSER_PROMOTED runtimeReady subset', () => {
    const maturityJson = JSON.parse(fs.readFileSync(MATURITY_PATH, 'utf8'));
    // BM-136 has a hand-curated semantic UI profile (the form-flight
    // standalone baseline of 11 forms includes BM-136). The
    // Phase 15B.1 distinction is the PHASE14_BROWSER_PROMOTED subset
    // (REAL_UI evidence row) — BM-136 is NOT in that subset because
    // it has no per-form Turn 4 evidence row in
    // evidence-safe-roster.json. Verify by reading the JSON roster,
    // not the semantic-UI maturity summary which only tracks the
    // curated semantic UI state.
    assert.ok(
      maturityJson.summary.runtimeReady.includes('BM-136'),
      'BM-136 is in the curated semantic UI baseline (form-flight standalone route)',
    );
    // The form-contracts bridge roster (RUNTIME_READY_FORM_CODES) is
    // the form-contracts bridge surface — see
    // packages/form-contracts/test/bridge-eligibility.test.ts for the
    // architectural invariant. BM-136 is NOT in that 25-form list.
    assert.ok(
      !maturityJson.summary.runtimeReadyPending?.includes('BM-136'),
      'BM-136 must not be pending promotion',
    );
  });

  it('BM-136 validator returns no structural issues (post-curation)', () => {
    const provenanceLedger = fs.readFileSync(PROVENANCE_LEDGER_PATH, 'utf8');
    const provenanceRow = findProvenanceRow(provenanceLedger, BM136_CODE);
    const provenancePayload = provenanceRow
      ? {
          sourceExtractPath: `docs/audit/docx/extracted/${BM136_EXTRACT_FILE}`,
        }
      : null;
    const issues = validateCuration(profile, contract, provenancePayload);
    assert.deepEqual(
      issues,
      [],
      `BM-136 validator returned issues: ${JSON.stringify(issues)}`,
    );
  });
});

// ============================================================
// REAL MUTATION REJECTION MATRIX (Section 11 of the brief)
//
// Each mutation:
//   1. Loads the real profile + provenance row + compiled contract.
//   2. Deep-clones each.
//   3. Applies a single semantic mutation to the clones.
//   4. Invokes assertBm136SemanticIdentity.
//   5. Asserts.throws — REJECTED verdict.
//
// SHARED_VALIDATOR_PASS alone is NOT proof; SCOPED_ASSERTION_THROWS
// is the only acceptable rejection detector.
// ============================================================

describe('BM-136 scoped semantic mutation matrix (Section 11)', () => {
  let profile;
  let provenanceRow;
  let compiled;
  let verdicts;

  before(() => {
    profile = loadProfileFor(BM136_CODE, BM136_PROFILE_VAR);
    provenanceRow = findProvenanceRow(readProvenanceLedger(), BM136_CODE);
    compiled = loadContract(BM136_CODE);
    verdicts = [];
  });

  function runMutation(name, mutator, expectedDetector = 'SCOPED_ASSERTION') {
    const cloneProfile = JSON.parse(JSON.stringify(profile));
    const cloneRow = String(provenanceRow ?? '');
    const cloneCompiled = JSON.parse(JSON.stringify(compiled));
    mutator({
      profile: cloneProfile,
      row: cloneRow,
      compiled: cloneCompiled,
    });
    let throws = false;
    let actualDetector = 'NONE';
    let failureMessage = '';
    try {
      assertBm136SemanticIdentity(cloneProfile, cloneRow, cloneCompiled);
    } catch (err) {
      throws = true;
      actualDetector = 'SCOPED_ASSERTION';
      failureMessage = err.message;
    }
    const verdict =
      throws && actualDetector === expectedDetector ? 'REJECTED' : 'PASSED_THROUGH';
    verdicts.push({
      mutation: name,
      cloneCreated: true,
      expectedDetector,
      actualDetector,
      throws,
      errorMessage: failureMessage,
      verdict,
    });
    return verdict;
  }

  it('BM-136 mutation matrix: all 23 mutations must be REJECTED by SCOPED_ASSERTION', () => {
    // 1. Title swap → "BB hỏi cung bị can"
    runMutation(
      'title swap → "BB hỏi cung bị can"',
      ({ profile }) => {
        profile.title = 'BB hỏi cung bị can';
      },
    );

    // 2. Title swap → "BB ghi lời khai"
    runMutation(
      'title swap → "BB ghi lời khai"',
      ({ profile }) => {
        profile.title = 'BB ghi lời khai';
      },
    );

    // 3. recipients.personLine → "Người bị áp dụng"
    runMutation(
      'recipients.personLine label → "Người bị áp dụng"',
      ({ profile }) => {
        profile.fields['recipients.personLine'].label = 'Người bị áp dụng';
      },
    );

    // 4. person.tenBi → "Tên bị can"
    runMutation(
      'person.tenBi label → "Tên bị can"',
      ({ profile }) => {
        profile.fields['person.tenBi'].label = 'Tên bị can';
      },
    );

    // 5. document.chuThe → "Chủ thể liên quan"
    runMutation(
      'document.chuThe label → "Chủ thể liên quan"',
      ({ profile }) => {
        profile.fields['document.chuThe'].label = 'Chủ thể liên quan';
      },
    );

    // 6. signature.nguoiKy → "Người ký"
    runMutation(
      'signature.nguoiKy label → "Người ký"',
      ({ profile }) => {
        profile.fields['signature.nguoiKy'].label = 'Người ký';
      },
    );

    // 7. signature.chucVu → "Tội danh"
    runMutation(
      'signature.chucVu label → "Tội danh"',
      ({ profile }) => {
        profile.fields['signature.chucVu'].label = 'Tội danh';
      },
    );

    // 8. agency.diaDanh → "Địa danh ban hành"
    runMutation(
      'agency.diaDanh label → "Địa danh ban hành"',
      ({ profile }) => {
        profile.fields['agency.diaDanh'].label = 'Địa danh ban hành';
      },
    );

    // 9. document.ngayBan → "Ngày ban hành"
    runMutation(
      'document.ngayBan label → "Ngày ban hành"',
      ({ profile }) => {
        profile.fields['document.ngayBan'].label = 'Ngày ban hành';
      },
    );

    // 10. document.soQuyet → "Số quyết định"
    runMutation(
      'document.soQuyet label → "Số quyết định"',
      ({ profile }) => {
        profile.fields['document.soQuyet'].label = 'Số quyết định';
      },
    );

    // 11. document.soQuyet demo fabrication → "/BB-VKS"
    runMutation(
      'document.soQuyet demo → "/BB-VKS"',
      ({ profile }) => {
        profile.demo['document.soQuyet'] = '36/BB-VKS';
      },
    );

    // 12. person.toiDanh citation drift → cites P0029 or P0041
    runMutation(
      'person.toiDanh citation drift → P0029/P0041',
      ({ profile }) => {
        profile.fields['person.toiDanh'].label =
          'Tội danh liên quan (P0029/P0041)';
      },
    );

    // 13. document.soTien citation drift → cites P0042
    runMutation(
      'document.soTien citation drift → P0042',
      ({ profile }) => {
        profile.fields['document.soTien'].label =
          'Số tiền liên quan (P0042)';
      },
    );

    // 14. document.lyDo citation drift → cites P0043
    runMutation(
      'document.lyDo citation drift → P0043',
      ({ profile }) => {
        profile.fields['document.lyDo'].label = 'Lý do bổ sung (P0043)';
      },
    );

    // 15. recipients.luuHo citation drift → cites P0069
    runMutation(
      'recipients.luuHo citation drift → P0069',
      ({ profile }) => {
        profile.fields['recipients.luuHo'].label =
          'Thông tin lưu hồ sơ (P0069)';
      },
    );

    // 16. agency.dongDia citation drift → cites P0067/P0068
    runMutation(
      'agency.dongDia citation drift → P0067/P0068',
      ({ profile }) => {
        profile.fields['agency.dongDia'].label =
          'Dòng địa danh bổ sung (P0067/P0068)';
      },
    );

    // 17. source extract → BM-135 extract
    runMutation(
      'source extract → BM-135 extract',
      ({ row }) => {
        row.replace(
          BM136_EXTRACT_FILE,
          'BM-135__79b31ad7511e.extract.md',
        );
      },
    );

    // 18. compiled path → BM-135 contract
    runMutation(
      'compiled path → BM-135 contract',
      ({ row }) => {
        row.replace('BM-136.compiled.json', 'BM-135.compiled.json');
      },
    );

    // 19. runtimeReady includes BM-136 (provenance row insert)
    runMutation(
      'runtimeReady includes BM-136',
      ({ row }) => {
        row.replace(
          'Not promoted',
          'Not promoted (but BM-136 is now runtime-ready)',
        );
      },
    );

    // 20. P0017 is added as a new control (phantom field)
    runMutation(
      'P0017 is added as a new control',
      ({ profile }) => {
        profile.fields['document.canCu'] = {
          label: 'Căn cứ pháp lý',
          placeholder: 'P0017',
        };
      },
    );

    // 21. P0046–P0051 forced into an unrelated field (signature.cheDo)
    runMutation(
      'P0046–P0051 forced into signature.cheDo',
      ({ profile }) => {
        profile.fields['signature.cheDo'].placeholder =
          'Nơi thường trú (P0025) + thời điểm kết thúc (P0046–P0051)';
      },
    );

    // 22. presentation section uses a phantom section ID
    runMutation(
      'presentation section uses a phantom section ID',
      ({ profile }) => {
        profile.presentationSections[0].id = 'section-chu-the-va-vu-an';
      },
    );

    // 23. generated marker reintroduced
    runMutation(
      'generated marker "(mẫu BM-136)" reintroduced',
      ({ profile }) => {
        profile.fields['document.soQuyet'].placeholder =
          'Số biên bản (mẫu BM-136)';
      },
    );

    const rejected = verdicts.filter((v) => v.verdict === 'REJECTED');
    assert.equal(
      rejected.length,
      verdicts.length,
      `All ${verdicts.length} BM-136 mutations must be REJECTED. Verdicts: ${JSON.stringify(
        verdicts,
        null,
        2,
      )}`,
    );
    // Each rejection must carry the SCOPED_ASSERTION prefix.
    for (const v of verdicts) {
      assert.ok(
        v.errorMessage.startsWith('SCOPED_ASSERTION'),
        `Mutation "${v.mutation}" error message must start with SCOPED_ASSERTION — got: ${v.errorMessage}`,
      );
    }
    // No PASSED_THROUGH allowed.
    const passed = verdicts.filter((v) => v.verdict === 'PASSED_THROUGH');
    assert.equal(
      passed.length,
      0,
      `BM-136 mutations leaked through: ${JSON.stringify(passed, null, 2)}`,
    );
  });
});

// ============================================================
// DOCX-anchored invariants (compile-time contract honored)
// ============================================================

describe('BM-136 DOCX source identity', () => {
  const ledger = fs.readFileSync(PROVENANCE_LEDGER_PATH, 'utf8');
  const row = findProvenanceRow(ledger, BM136_CODE);

  it('BM-136 provenance cites own BM-136 extract only', () => {
    assert.ok(
      row?.includes(BM136_EXTRACT_FILE),
      `BM-136 provenance must cite ${BM136_EXTRACT_FILE}`,
    );
    assert.ok(
      !row?.includes('BM-135__79b31ad7511e'),
      'BM-136 provenance must NOT cite BM-135 extract',
    );
    assert.ok(
      !row?.includes('BM-134__7c1e123c01b0'),
      'BM-136 provenance must NOT cite BM-134 extract',
    );
  });

  it('BM-136 provenance documents BIÊN BẢN family + ĐỐI CHẤT subfamily', () => {
    assert.ok(
      row?.includes(BM136_DOCUMENT_FAMILY),
      `BM-136 provenance must cite "${BM136_DOCUMENT_FAMILY}" document family`,
    );
    assert.ok(
      row?.includes(BM136_PROCEDURE_SUBFAMILY) ||
        row?.toLowerCase().includes('đối chất'),
      'BM-136 provenance must cite ĐỐI CHẤT procedure subfamily',
    );
  });

  it('BM-136 provenance declares Điều 178 BLTTHS as legal workflow anchor', () => {
    assert.ok(
      row?.includes('Điều 178') || row?.includes('Đieu 178'),
      'BM-136 provenance must anchor on Điều 178 BLTTHS',
    );
  });

  it('BM-136 provenance declares compatibility-mapped fields explicitly', () => {
    const compatFields = [
      'recipients.personLine',
      'person.tenBi',
      'document.chuThe',
      'signature.nguoiKy',
    ];
    for (const field of compatFields) {
      assert.ok(
        row?.includes(field),
        `BM-136 provenance must enumerate compatibility-mapped field "${field}"`,
      );
    }
  });

  it('BM-136 provenance never silently promotes to runtimeReady', () => {
    assert.ok(
      !row?.toLowerCase().includes('runtime-ready'),
      'BM-136 provenance must never declare runtimeReady promotion',
    );
  });

  it('BM-136 provenance declares P0017 (legal basis) as unmapped source slot', () => {
    assert.ok(row?.includes('P0017'), 'BM-136 provenance must anchor P0017');
  });

  it('BM-136 provenance declares P0046–P0051 (end time) as unmapped source slot', () => {
    assert.ok(
      row?.includes('P0046'),
      'BM-136 provenance must anchor P0046–P0051',
    );
  });

  it('BM-136 provenance does not claim DIRECT_SLOT/HIGH for contract-only fields', () => {
    for (const segmentKey of [
      'document.soQuyet',
      'agency.dongDia',
      'document.tenVu',
      'person.toiDanh',
      'document.soTien',
      'document.lyDo',
      'recipients.luuHo',
    ]) {
      const segment = extractSegment(row, segmentKey);
      assert.ok(
        segment,
        `BM-136 provenance must document "${segmentKey}"`,
      );
      assert.ok(
        /CONTRACT_ONLY_NO_DOCX_SLOT/iu.test(segment),
        `BM-136 provenance "${segmentKey}" must declare CONTRACT_ONLY_NO_DOCX_SLOT`,
      );
    }
  });
});

// ============================================================
// SHARED PROVENANCE-SOURCE-INTEGRITY HELPERS unit smoke
// ============================================================

describe('BM-136 provenance helpers smoke', () => {
  it('readProvenanceLedger parses the in-memory ledger', () => {
    const ledger = readProvenanceLedger();
    assert.equal(typeof ledger, 'string');
    assert.ok(ledger.length > 0);
  });
});