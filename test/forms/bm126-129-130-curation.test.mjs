/**
 * BM-126/129/130 family: QĐ trưng cầu giám định
 *   - BM-126 (initial)
 *   - BM-129 (bổ sung)
 *   - BM-130 (lại)
 *
 * Shared invariant: every curated profile in this family must
 *   - be registered with its compiled templateCode,
 *   - expose every compiled field exactly once via presentationSections,
 *   - not expose fields outside the compiled contract,
 *   - use only compiled-contract section IDs in profile.sections and
 *     presentationSections,
 *   - provide a description for every section it presents,
 *   - carry no generated "(mẫu BM-NNN)" placeholder marker,
 *   - have a provenance row in the curation ledger,
 *   - not be promoted to runtimeReady,
 *   - pass the shared curator validator with zero issues.
 *
 * Run: node --test test/forms/bm126-129-130-curation.test.mjs
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  loadProfile,
  mutateProfile,
  validateCuration,
} from './helpers/runtime-ux-curation-validator.mjs';
import {
  assertRepositoryLocalPath,
  PROJECT_ROOT,
  PROVENANCE_ROOTS,
} from './helpers/provenance-source-integrity.mjs';

const WEB_ROOT = resolve(PROJECT_ROOT, 'apps', 'web');

const PROVENANCE_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);
const MATURITY_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_MATURITY.latest.json',
);

const PROFILE_DIR = resolve(WEB_ROOT, 'src/lib/runtime-ux');

const FORMS = [
  {
    code: 'BM-126',
    profileVariable: 'BM126_RUNTIME_UX_PROFILE',
    compiledTitle: /QĐ trưng cầu giám định/iu,
    documentType: 'QĐ trưng cầu giám định',
    headingPids: ['P0010', 'P0011'],
    extractHeadingRegex: /QUYẾT ĐỊNH\s+TRƯNG CẦU GIÁM ĐỊNH$/iu,
    // Exact-source-quote references appear as literal substrings in the new
    // BM-126 provenance row (each P-ID is quoted verbatim with the DOCX
    // text). The chosen substrings are the unambiguous single P-IDs used
    // in the field-by-field evidence map, plus the row-header range.
    expectedReferences: [
      'P0001',
      'P0003',
      'P0004',
      'P0007',
      'P0011',
      'P0013',
      'P0064',
      'P0069',
      'P0072',
    ],
    numberLabel: /Số quyết định trưng cầu giám định/iu,
    demoNumberMustMatch: /\/QĐ-/iu,
  },
  {
    code: 'BM-129',
    profileVariable: 'BM129_RUNTIME_UX_PROFILE',
    compiledTitle: /QĐ trưng cầu giám định bổ sung/iu,
    documentType: 'QĐ trưng cầu giám định bổ sung',
    headingPids: ['P0010', 'P0011'],
    extractHeadingRegex: /QUYẾT ĐỊNH\s+TRƯNG CẦU GIÁM ĐỊNH BỔ SUNG$/iu,
    expectedReferences: [
      'P0001',
      'P0011',
      'P0013',
      'P0067',
      'P0073',
      'P0076',
    ],
    numberLabel: /Số quyết định trưng cầu giám định bổ sung/iu,
    demoNumberMustMatch: /\/QĐ-/iu,
  },
  {
    code: 'BM-130',
    profileVariable: 'BM130_RUNTIME_UX_PROFILE',
    compiledTitle: /QĐ trưng cầu giám định lại/iu,
    documentType: 'QĐ trưng cầu giám định lại',
    headingPids: ['P0010', 'P0011'],
    extractHeadingRegex: /QUYẾT ĐỊNH\s+TRƯNG CẦU GIÁM ĐỊNH LẠI$/iu,
    expectedReferences: [
      'P0001',
      'P0011',
      'P0013',
      'P0065',
      'P0074',
      'P0077',
    ],
    numberLabel: /Số quyết định trưng cầu giám định lại/iu,
    demoNumberMustMatch: /\/QĐ-/iu,
  },
];

const provenanceText = existsSync(PROVENANCE_PATH)
  ? readFileSync(PROVENANCE_PATH, 'utf8')
  : '';
const maturity = existsSync(MATURITY_PATH)
  ? JSON.parse(readFileSync(MATURITY_PATH, 'utf8'))
  : null;

function findProvenanceRow(code) {
  return provenanceText
    .split(/\r?\n/u)
    .find((line) => new RegExp(`^\\|\\s*${code}\\s*\\|`, 'u').test(line));
}

function parseProvenanceRow(row) {
  const match = row?.match(
    /^\|\s*(BM-\d{3})\s*\|\s*`([^`]+)`\s*\(sha256=([^,]+),\s*title="([^"]+)"\);\s*`([^`]+)`\s*\(sha256=([^,]+),\s*heading="([^"]+)"/u,
  );
  assert.ok(match, 'provenance row must carry parseable source identity metadata');
  return {
    formCode: match[1],
    compiledContractPath: match[2],
    compiledSHA256: match[3],
    compiledTitle: match[4],
    sourceExtractPath: match[5],
    extractSHA256: match[6],
    extractHeading: match[7],
  };
}

function resolveProvenancePath(relativePath) {
  return assertRepositoryLocalPath(relativePath, {
    mustExist: true,
    requireRealpathContainment: true,
  });
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readExtractParagraphText(extractPath, pid) {
  const fullPath = assertRepositoryLocalPath(extractPath, {
    mustExist: true,
    requireRoot: 'extract',
  });
  const text = readFileSync(fullPath, 'utf8');
  const match = text.match(new RegExp(`\\*\\*${pid}\\*\\*:\\s+(.+?)\\s*$`, 'mu'));
  return match ? match[1] : '';
}

function normalizeHeading(value) {
  return value.replace(/\s*\/\s*/gu, ' ').replace(/\s+/gu, ' ').trim();
}

describe('BM-126/129/130 family — QĐ trưng cầu giám định', () => {
  for (const form of FORMS) {
    const provenanceRow = findProvenanceRow(form.code);
    const provenance = parseProvenanceRow(provenanceRow);
    const compiledPath = resolveProvenancePath(
      provenance.compiledContractPath,
    );
    const extractPath = resolveProvenancePath(provenance.sourceExtractPath);
    const compiledExists = existsSync(compiledPath);
    const extractExists = existsSync(extractPath);
    const compiled = compiledExists
      ? JSON.parse(readFileSync(compiledPath, 'utf8'))
      : {};
    const extractHeading = form.headingPids
      .map((pid) => readExtractParagraphText(provenance.sourceExtractPath, pid))
      .join(' ');
    const profilePath = resolve(
      PROFILE_DIR,
      `${form.code.replace('BM-', 'bm').replace('-', '')}-runtime-ux-profile.ts`,
    );
    const profile = loadProfile(profilePath, form.profileVariable);

    describe(`${form.code} — source binding`, () => {
      it('parses the row formCode from the actual ledger row', () => {
        assert.equal(provenance.formCode, form.code);
      });

      it('resolves both declared paths without legacy or cross-form extract pointers', () => {
        assert.equal(compiledExists, true, provenance.compiledContractPath);
        assert.equal(extractExists, true, provenance.sourceExtractPath);
        assert.doesNotMatch(
          provenance.sourceExtractPath,
          /docs\/audit\/extracted\//u,
        );
        assert.match(
          provenance.sourceExtractPath.split('/').at(-1) ?? '',
          new RegExp(`^${form.code}__`, 'u'),
          `${form.code} must not reference another form's extract`,
        );
      });

      it('declares full 64-character hexadecimal source hashes', () => {
        assert.match(provenance.compiledSHA256, /^[0-9a-f]{64}$/iu);
        assert.match(provenance.extractSHA256, /^[0-9a-f]{64}$/iu);
      });

      it('matches both hashes to files reached through the ledger paths', () => {
        assert.equal(
          sha256File(compiledPath),
          provenance.compiledSHA256.toLowerCase(),
        );
        assert.equal(
          sha256File(extractPath),
          provenance.extractSHA256.toLowerCase(),
        );
      });

      it('matches the compiled title to the actual ledger identity', () => {
        assert.equal(compiled.title, provenance.compiledTitle);
      });

      it('matches the extract heading at the ledger path to the document identity', () => {
        assert.equal(
          normalizeHeading(extractHeading),
          normalizeHeading(provenance.extractHeading),
        );
        assert.match(extractHeading, form.extractHeadingRegex);
      });

      it('uses BM-126/129/130 as the compiled contract code', () => {
        assert.equal(compiled.templateCode, form.code);
        assert.equal(compiled.source.templateCode, form.code);
      });

      it('compiled title identifies the document type', () => {
        assert.match(compiled.title, form.compiledTitle);
        assert.match(compiled.source.title, form.compiledTitle);
      });

      it('profile registers with its templateCode', () => {
        assert.equal(profile.templateCode, form.code);
      });

      it('number label is a decision number (QĐ), not a notification (TB)', () => {
        const label = profile.fields['document.soQuyet'].label;
        assert.doesNotMatch(label, /Số thông báo/iu);
        assert.match(label, form.numberLabel);
      });

      it('demo number uses the QĐ prefix (not TB)', () => {
        assert.match(
          profile.demo['document.soQuyet'],
          form.demoNumberMustMatch,
        );
      });

      it('profile source contains the extract path declared by provenance', () => {
        const sourceText = readFileSync(profilePath, 'utf8');
        assert.match(
          sourceText,
          new RegExp(provenance.sourceExtractPath, 'u'),
        );
      });
    });

    describe(`${form.code} — invariant gate`, () => {
      it('presents every compiled field exactly once', () => {
        const compiledFieldKeys = compiled.source.fields.map((f) => f.key);
        const presentedKeys = profile.presentationSections.flatMap(
          (section) => section.fieldKeys,
        );
        assert.deepEqual(
          [...presentedKeys].sort(),
          [...compiledFieldKeys].sort(),
        );
        assert.equal(new Set(presentedKeys).size, presentedKeys.length);
      });

      it('does not present fields outside the compiled contract', () => {
        const compiledFieldKeys = new Set(
          compiled.source.fields.map((f) => f.key),
        );
        const outside = profile.presentationSections
          .flatMap((section) => section.fieldKeys)
          .filter((key) => !compiledFieldKeys.has(key));
        assert.deepEqual(outside, []);
      });

      it('uses only compiled contract section IDs', () => {
        const contractSectionIds = new Set(
          compiled.source.sections.map((section) => section.id),
        );
        assert.equal(
          profile.sections.every((section) =>
            contractSectionIds.has(section.sectionId),
          ) &&
            profile.presentationSections.every((section) =>
              contractSectionIds.has(section.id),
            ),
          true,
        );
      });

      it('provides descriptions for every displayed section', () => {
        assert.equal(
          profile.sections.every((section) =>
            section.description?.trim(),
          ) &&
            profile.presentationSections.every((section) =>
              section.description?.trim(),
            ),
          true,
        );
      });

      it('contains no generated BM-NNN placeholder marker', () => {
        const placeholders = Object.values(profile.fields).map(
          (field) => field.placeholder ?? '',
        );
        assert.equal(
          placeholders.some((placeholder) =>
            /\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(placeholder),
          ),
          false,
        );
      });

      it('does not promote the form to runtimeReady', () => {
        // Phase 15B.1: 11 forms have curated semantic UI maturity —
        // the form-flight standalone baseline. The form being tested
        // (BM-126 / BM-129 / BM-130) is intentionally NOT in this list
        // because it has no hand-curated semantic UI profile.
        assert.equal(
          maturity.summary.runtimeReady.includes(form.code),
          false,
        );
      });

      it('records CURATION provenance with the reviewed extract references', () => {
        assert.ok(
          provenanceRow,
          `${form.code} provenance row must exist`,
        );
        assert.match(
          provenanceRow,
          new RegExp(provenance.sourceExtractPath, 'u'),
        );
        for (const reference of form.expectedReferences) {
          assert.ok(
            provenanceRow.includes(reference),
            `${form.code} provenance must cite ${reference}`,
          );
        }
      });

      it('passes the complete shared curator validator', () => {
        assert.deepEqual(
          validateCuration(profile, compiled, provenanceRow),
          [],
        );
      });

      // Provenance-quality assertion (evidence closure): the BM-126/129/130
      // family must record `agency.dongDia` as MEDIUM (CONTRACT_POSITIONAL_INFERENCE)
      // because none of the three DOCX extracts carries an explicit
      // "Địa danh, ngày … tháng … năm …" combined-line paragraph; the
      // locality-line slot is assembled from `agency.diaDanh` + `document.ngayBan`.
      it('records agency.dongDia as MEDIUM (CONTRACT_POSITIONAL_INFERENCE)', () => {
        assert.match(
          provenanceRow,
          /`agency\.dongDia`\s*=\s*MEDIUM\s*\(CONTRACT_POSITIONAL_INFERENCE/iu,
        );
        assert.match(
          provenanceRow,
          /no explicit "Địa danh, ngày/iu,
        );
        assert.match(
          provenanceRow,
          /\*\*Medium-confidence slots:\*\*\s*`agency\.dongDia`/iu,
        );
      });

      // Provenance-quality assertion: the row must NOT carry the legacy
      // blanket "HIGH on all N fields" wording after the source-of-truth
      // correction for the dongDia slot.
      it('does not carry the legacy blanket "HIGH on all N fields" wording for the dongDia slot', () => {
        // The legacy wording was:
        //   "Confidence: HIGH on all seven fields." (BM-129/130)
        //   "Confidence: HIGH on all eleven fields." (BM-126)
        // After evidence closure, the row must record a MEDIUM slot.
        assert.doesNotMatch(
          provenanceRow,
          /Confidence:\s*HIGH\s+on\s+all\s+(seven|eleven)\s+fields/iu,
        );
      });
    });

    describe(`${form.code} — mutation proof (mutation surfaces a red issue)`, () => {
      const provenanceRow = findProvenanceRow(form.code);

      it('detects a profile section outside the compiled contract', () => {
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.sections.push({
            sectionId: 'section-fabricated',
            title: 'Hư cấu',
            description: 'Mục không thuộc hợp đồng.',
          });
        });
        const issues = validateCuration(mutated, compiled, provenanceRow);
        assert.ok(
          issues.some((issue) =>
            issue.startsWith('PROFILE_SECTION_OUTSIDE_CONTRACT:'),
          ),
        );
      });

      it('detects a missing presentation section description', () => {
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.presentationSections[0].description = '';
        });
        assert.ok(
          validateCuration(mutated, compiled, provenanceRow).some((issue) =>
            issue.startsWith('PRESENTATION_SECTION_DESCRIPTION_MISSING:'),
          ),
        );
      });

      it('detects a generated (mẫu BM-NNN) placeholder marker', () => {
        const mutated = mutateProfile(profile, (candidate) => {
          candidate.fields[
            Object.keys(candidate.fields)[0]
          ].placeholder = `Tên cơ quan (mẫu ${form.code})`;
        });
        assert.ok(
          validateCuration(mutated, compiled, provenanceRow).includes(
            'GENERATED_MARKER_PRESENT',
          ),
        );
      });
    });
  }

  describe('BM-126/129/130 family — full audit gate', () => {
    it('every family member is semantic-pass and provenance-present after curation', () => {
      const codes = FORMS.map((form) => form.code);
      assert.ok(maturity, 'maturity report must exist');
      for (const code of codes) {
        const form = maturity.forms.find((entry) => entry.templateCode === code);
        assert.ok(form, `${code} must appear in maturity report`);
        assert.equal(
          form.semanticUi.status,
          'PASS',
          `${code} must reach semantic PASS`,
        );
        assert.deepEqual(form.semanticUi.issues, []);
        assert.deepEqual(form.provenance, {
          status: 'PRESENT',
          evidenceKind: 'CURATION',
        });
      }
    });
  });

  // Exact semantic assertions for BM-126. The label-rationale tests are
  // independent of any single DOCX slot: each test loads the compiled
  // contract directly, finds the exact field, and compares the profile
  // label/placeholder against the compiled label/description. The
  // provenance-row assertions then verify the curated row's honest
  // classification (the row itself must NOT promote document.tenVu to a
  // DIRECT_SLOT evidence based on P0066, because P0066 is the
  // case-initiation-authority line, not the case-name fill-in line).
  describe('BM-126 — exact semantic assertions', () => {
    const profile = loadProfile(
      resolve(
        PROFILE_DIR,
        'bm126-runtime-ux-profile.ts',
      ),
      'BM126_RUNTIME_UX_PROFILE',
    );
    const provenanceRow = findProvenanceRow('BM-126');
    const provenance = parseProvenanceRow(provenanceRow);
    const compiled = JSON.parse(
      readFileSync(
        assertRepositoryLocalPath(provenance.compiledContractPath, {
          mustExist: true,
          requireRoot: 'compiled',
        }),
        'utf8',
      ),
    );
    const compiledFieldByKey = new Map(
      compiled.source.fields.map((field) => [field.key, field]),
    );

    it('person.tenNguoi is rendered as the charged/accused party ("người hoặc pháp nhân bị khởi tố"), not as the appraisal subject', () => {
      const fieldKey = 'person.tenNguoi';
      const compiledField = compiledFieldByKey.get(fieldKey);
      assert.ok(compiledField, `${fieldKey} must exist in compiled contract`);
      const label = profile.fields[fieldKey].label;
      const placeholder = profile.fields[fieldKey].placeholder ?? '';
      // Person is the charged/accused party (the case-initiation target),
      // NOT the appraisal organization/person. The label and placeholder
      // must align with the compiled field and not contradict it.
      assert.match(label, /bị khởi tố/iu);
      assert.doesNotMatch(label, /được trưng cầu/iu);
      assert.doesNotMatch(label, /đối tượng giám định/iu);
      assert.match(placeholder, /bị khởi tố|khởi tố/iu);
      // The provenance row anchors this slot to P0069 (charged/accused).
      assert.match(
        provenanceRow,
        /P0069 quote "Ghi họ tên người hoặc tên pháp nhân bị khởi tố"/u,
      );
    });

    it('document.tenVu is rendered as the case name, not as the document title', () => {
      const fieldKey = 'document.tenVu';
      const compiledField = compiledFieldByKey.get(fieldKey);
      assert.ok(compiledField, `${fieldKey} must exist in compiled contract`);
      const label = profile.fields[fieldKey].label;
      const placeholder = profile.fields[fieldKey].placeholder ?? '';
      // Profile label must align with the compiled-contract label and must
      // not contradict it. The compiled label is "Tên vụ án / vụ việc";
      // the profile label must be a wording that maps to "Tên vụ án" (the
      // case-name slot), NOT "Tên văn bản" (the document-title slot).
      assert.match(label, /tên vụ án/iu);
      assert.doesNotMatch(label, /tên văn bản/iu);
      // Placeholder must not contradict the compiled field description.
      // The compiled contract has no description; the placeholder must
      // remain in the case-name vocabulary and not drift into document
      // title vocabulary.
      assert.match(placeholder, /vụ án/iu);
      assert.doesNotMatch(placeholder, /văn bản/iu);
      // Provenance-row correctness: document.tenVu is classified MEDIUM
      // (CONTRACT_DIRECT_BUT_DOCX_INDIRECT) because the BM-126 extract
      // contains no explicit "Ghi tên vụ án" fill-in paragraph.
      assert.match(
        provenanceRow,
        /`document\.tenVu`\s*=\s*MEDIUM\s*\(CONTRACT_DIRECT_BUT_DOCX_INDIRECT/u,
      );
      assert.match(
        provenanceRow,
        /no explicit "Ghi tên vụ án" fill-in paragraph/u,
      );
      // P0066 is the case-initiation-authority line, NOT a case-name
      // slot — the row must explicitly say so, and must NOT use P0066 as
      // DIRECT_SLOT evidence for document.tenVu.
      assert.match(
        provenanceRow,
        /P0066 is the case-initiation-authority line, not the case-name line/u,
      );
      assert.doesNotMatch(
        provenanceRow,
        /`document\.tenVu`[\s\S]{0,400}?P0066[\s\S]{0,400}?DIRECT_SLOT/u,
      );
    });

    it('document.chuThe is rendered as the appraisal organization/person', () => {
      const fieldKey = 'document.chuThe';
      const compiledField = compiledFieldByKey.get(fieldKey);
      assert.ok(compiledField, `${fieldKey} must exist in compiled contract`);
      const label = profile.fields[fieldKey].label;
      const placeholder = profile.fields[fieldKey].placeholder ?? '';
      // document.chuThe is the appraisal organization/person (tổ chức
      // hoặc cá nhân được trưng cầu thực hiện giám định) — NOT a generic
      // signer, NOT "đối tượng giám định" (appraisal subject), and NOT
      // justified by Điều 207 BLTTHS in the curated label (the direct
      // source for document.chuThe is P0072, which does not cite Điều 207).
      assert.match(label, /trưng cầu giám định/iu);
      assert.doesNotMatch(label, /ký tên/iu);
      assert.doesNotMatch(label, /đối tượng giám định/iu);
      assert.doesNotMatch(label, /Điều 207/iu);
      assert.match(placeholder, /trưng cầu giám định/iu);
      // The direct source for document.chuThe is P0072 (appraisal
      // organization/person fill-in instruction). P0072 must remain
      // cited as evidence.
      assert.match(
        provenanceRow,
        /P0072 quote "Ghi tên tổ chức, họ tên cá nhân được trưng cầu giám định/u,
      );
    });

    it('agency.dongDia is NOT mislabelled as a fabricated locality string', () => {
      const label = profile.fields['agency.dongDia'].label;
      // The locality/địa danh label belongs on agency.diaDanh, NOT on
      // agency.dongDia. The dongDia slot is the locality-line in the
      // signature block and must use neutral source-backed wording.
      assert.doesNotMatch(label, /^Địa danh$/u);
      assert.match(label, /[Dd]òng địa danh/u);
      assert.match(
        provenanceRow,
        /`agency.dongDia`/u,
      );
    });

    it('agency.diaDanh is the issuing-locality slot, distinct from agency.dongDia', () => {
      const diaDanhLabel = profile.fields['agency.diaDanh'].label;
      const dongDiaLabel = profile.fields['agency.dongDia'].label;
      assert.notEqual(diaDanhLabel, dongDiaLabel);
      assert.match(diaDanhLabel, /[Đđ]ịa danh/u);
    });
  });

  // Provenance-quality assertions — these guard the EVIDENCE QUALITY of the
  // ledger row, not just whether the row exists. Honest classification rules:
  //   - document.tenVu must be marked MEDIUM (CONTRACT_DIRECT_BUT_DOCX_INDIRECT)
  //     because the BM-126 extract contains no explicit "Ghi tên vụ án" fill-in
  //     paragraph; P0066 is the case-initiation-authority line, not a
  //     case-name slot.
  //   - agency.dongDia must be marked MEDIUM (CONTRACT_POSITIONAL_INFERENCE)
  //     because the BM-126 extract carries only ONE locality-only footnote
  //     (P0064, already cited for agency.diaDanh) and no explicit
  //     "Địa danh, ngày … tháng … năm …" combined-line paragraph.
  //   - The row must NOT carry a blanket "Confidence: HIGH on all eleven
  //     fields" wording after the source-of-truth correction.
  describe('BM-126 — provenance-quality assertions (evidence closure)', () => {
    const provenanceRow = findProvenanceRow('BM-126');

    it('document.tenVu is recorded as MEDIUM (CONTRACT_DIRECT_BUT_DOCX_INDIRECT)', () => {
      assert.match(
        provenanceRow,
        /`document\.tenVu`\s*=\s*MEDIUM\s*\(CONTRACT_DIRECT_BUT_DOCX_INDIRECT/u,
      );
      assert.match(
        provenanceRow,
        /no explicit "Ghi tên vụ án" fill-in paragraph/u,
      );
    });

    it('agency.dongDia is recorded as MEDIUM (CONTRACT_POSITIONAL_INFERENCE)', () => {
      assert.match(
        provenanceRow,
        /`agency\.dongDia`\s*=\s*MEDIUM\s*\(CONTRACT_POSITIONAL_INFERENCE/iu,
      );
      assert.match(
        provenanceRow,
        /no paragraph in the BM-126 extract carries an explicit "Địa danh, ngày/iu,
      );
    });

    it('medium-confidence slots are explicitly enumerated', () => {
      assert.match(
        provenanceRow,
        /\*\*Medium-confidence slots:\*\*\s*`agency\.dongDia`,\s*`document\.tenVu`/u,
      );
    });

    it('low-confidence slots are explicitly enumerated as "none"', () => {
      assert.match(
        provenanceRow,
        /\*\*Low-confidence slots:\*\*\s*none/u,
      );
    });

    it('does not carry the legacy blanket "HIGH on all eleven fields" wording', () => {
      assert.doesNotMatch(
        provenanceRow,
        /Confidence:\s*HIGH\s+on\s+all\s+eleven\s+fields/iu,
      );
    });
  });

  // In-memory mutation proofs for BM-126 semantic assertions. Each test
  // takes the curated profile, applies a labelling change to a single
  // field, and verifies that the change is detectable — either by failing
  // the compiled-contract label/description alignment, or by failing the
  // provenance-row MEDIUM/CONTRACT_DIRECT_BUT_DOCX_INDIRECT classification
  // assertion. None of these proofs rely on P0066 as evidence for
  // document.tenVu.
  describe('BM-126 — in-memory mutation proof', () => {
    const profile = loadProfile(
      resolve(
        PROFILE_DIR,
        'bm126-runtime-ux-profile.ts',
      ),
      'BM126_RUNTIME_UX_PROFILE',
    );
    const provenanceRow = findProvenanceRow('BM-126');
    const provenance = parseProvenanceRow(provenanceRow);
    const compiled = JSON.parse(
      readFileSync(
        assertRepositoryLocalPath(provenance.compiledContractPath, {
          mustExist: true,
          requireRoot: 'compiled',
        }),
        'utf8',
      ),
    );
    const compiledFieldByKey = new Map(
      compiled.source.fields.map((field) => [field.key, field]),
    );

    it('detects person.tenNguoi mis-labelled as the appraisal subject', () => {
      const mutated = mutateProfile(profile, (candidate) => {
        candidate.fields['person.tenNguoi'].label =
          'Người được trưng cầu giám định';
      });
      const mutatedLabel = mutated.fields['person.tenNguoi'].label;
      // The mutation removes "bị khởi tố" and inserts "được trưng cầu",
      // which contradicts the compiled-contract field meaning (charged/
      // accused party). Detect via label misalignment.
      assert.ok(
        !/bị khởi tố/iu.test(mutatedLabel),
        'mutation should remove "bị khởi tố"',
      );
      assert.ok(
        /được trưng cầu/iu.test(mutatedLabel),
        'mutation should insert "được trưng cầu"',
      );
      // Provenance-row evidence for the curated slot remains P0069.
      assert.match(
        provenanceRow,
        /P0069 quote "Ghi họ tên người hoặc tên pháp nhân bị khởi tố"/u,
      );
    });

    it('detects document.tenVu mis-labelled as the document title', () => {
      const mutated = mutateProfile(profile, (candidate) => {
        candidate.fields['document.tenVu'].label = 'Tên văn bản';
      });
      const mutatedLabel = mutated.fields['document.tenVu'].label;
      const compiledField = compiledFieldByKey.get('document.tenVu');
      assert.ok(compiledField, 'document.tenVu must exist in compiled contract');
      // Detect via compiled-contract label/description alignment: the
      // compiled label is "Tên vụ án / vụ việc" (case-name vocabulary);
      // the mutated label "Tên văn bản" (document-title vocabulary) does
      // NOT match the compiled field meaning.
      assert.equal(mutatedLabel, 'Tên văn bản');
      assert.ok(
        !/tên vụ án/iu.test(mutatedLabel),
        'mutation should remove "tên vụ án"',
      );
      assert.match(compiledField.label, /tên vụ án/iu);
      // Provenance-row MEDIUM classification remains in place; the row
      // records document.tenVu as MEDIUM (CONTRACT_DIRECT_BUT_DOCX_INDIRECT)
      // precisely because no DOCX paragraph anchors the case-name slot.
      assert.match(
        provenanceRow,
        /`document\.tenVu`\s*=\s*MEDIUM\s*\(CONTRACT_DIRECT_BUT_DOCX_INDIRECT/u,
      );
      // The row explicitly states that P0066 is the case-initiation-
      // authority line, NOT the case-name line.
      assert.match(
        provenanceRow,
        /P0066 is the case-initiation-authority line, not the case-name line/u,
      );
    });

    it('detects an unsupported "Địa danh" label on agency.dongDia', () => {
      const mutated = mutateProfile(profile, (candidate) => {
        candidate.fields['agency.dongDia'].label = 'Địa danh';
      });
      assert.equal(mutated.fields['agency.dongDia'].label, 'Địa danh');
      // The provenance row uses "Dòng địa danh" wording for the locality-
      // line slot; relabelling the slot as a plain "Địa danh" duplicates
      // agency.diaDanh and breaks the slot-context evidence.
      assert.ok(
        !/Địa danh/u.test(profile.fields['agency.dongDia'].label),
        'curated profile must keep neutral locality-line wording on agency.dongDia',
      );
    });
  });
});

// In-memory/table-driven containment proofs. Each case MUST be rejected by
// `assertRepositoryLocalPath` BEFORE any read/hash call touches the
// filesystem. The cases cover the traversal, absolute, and root-prefixed
// shapes a hostile or buggy caller might emit.
describe('assertRepositoryLocalPath — path-escape containment proofs', () => {
  const escapeCases = [
    { label: 'parent-traversal (Unix-style)', declared: '../../outside.json' },
    { label: 'parent-traversal inside docs', declared: '../compiled.json' },
    { label: 'Windows absolute path', declared: 'C:\\outside\\file.json' },
    { label: 'POSIX absolute path', declared: '/docs/outside.json' },
    {
      label: 'multiple-traversal that escapes docs/audit/docx/extracted/',
      declared: 'docs/audit/docx/extracted/../../../../outside.md',
    },
    { label: 'absolute path to compile-v2', declared: 'D:\\compiled.json' },
    { label: 'empty string', declared: '' },
  ];

  for (const escapeCase of escapeCases) {
    it(`rejects ${escapeCase.label}`, () => {
      assert.throws(
        () => assertRepositoryLocalPath(escapeCase.declared),
        (err) => err instanceof assert.AssertionError,
        `path "${escapeCase.declared}" must be rejected`,
      );
    });
  }

  it('rejects a path that lexically stays inside but realpath-resolves outside (symlink escape)', () => {
    // We simulate a symlink escape by giving the helper a fake realpath
    // pointing outside PROJECT_ROOT. The lexical containment check must
    // pass (the declared path is inside PROJECT_ROOT), but the realpath
    // containment check must reject the escape.
    const declaredInside = `${PROVENANCE_ROOTS.extract}BM-126__symlink-fake.md`;
    const fakeOutside = resolve(PROJECT_ROOT, '..', 'fake-outside-target.md');
    const realpathMap = new Map([[declaredInside, fakeOutside]]);
    assert.throws(
      () =>
        assertRepositoryLocalPath(declaredInside, {
          mustExist: true,
          requireRealpathContainment: true,
          realpathMap,
        }),
      (err) => err instanceof assert.AssertionError,
      'simulated symlink escape must be rejected by realpath containment',
    );
  });

  it('accepts a repository-local extract path that resolves inside PROJECT_ROOT', () => {
    const sample = `${PROVENANCE_ROOTS.extract}BM-126__2d8c3d38368b.extract.md`;
    const resolved = assertRepositoryLocalPath(sample, {
      mustExist: true,
      requireRealpathContainment: true,
    });
    assert.equal(existsSync(resolved), true);
  });

  it('accepts a repository-local compiled contract path that resolves inside PROJECT_ROOT', () => {
    const sample = `${PROVENANCE_ROOTS.compiled}BM-126.compiled.json`;
    const resolved = assertRepositoryLocalPath(sample, {
      mustExist: true,
      requireRealpathContainment: true,
    });
    assert.equal(existsSync(resolved), true);
  });
});
