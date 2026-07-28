/**
 * BM-015 / BM-017 / BM-018 provenance-quality assertions.
 *
 * Source-independent test: the assertions do NOT copy values from the
 * ledger row. Instead the test independently loads:
 *   - the compiled contract,
 *   - the DOCX extract,
 *   - the BM RuntimeUxProfile,
 * and uses those as the source of truth. The ledger row is then
 * verified to *agree* with those independent sources.
 *
 * Specific required distinctions:
 *   BM-015: "Kế hoạch" vs generic "Quyết định/Thông báo"
 *   BM-017: "Yêu cầu khởi tố vụ án hình sự" vs generic
 *           "phê duyệt/phối hợp"
 *   BM-018: "Yêu cầu ra quyết định" vs "Quyết định"
 *
 * Run: node --test test/forms/bm015-017-018-provenance-quality.test.mjs
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
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

const FORMS = [
  {
    code: 'BM-015',
    headingPids: ['P0012', 'P0013'],
    profilePath: 'apps/web/src/lib/runtime-ux/bm015-runtime-ux-profile.ts',
    profileVariable: 'BM015_RUNTIME_UX_PROFILE',
    compiledTitleRegex: /KH trực tiếp kiểm sát|Kế hoạch|KẾ HOẠCH/u,
    principalDocumentType: 'Kế hoạch trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm',
    legalWorkflowVerb: 'kiểm sát',
    forbiddenDocumentTypes: [/Quyết định tố tụng/iu, /Thông báo về việc/iu, /^Yêu cầu khởi tố vụ án hình sự$/iu],
    operativeActionRange: ['P0019', 'P0022'],
  },
  {
    code: 'BM-017',
    headingPids: ['P0010', 'P0011'],
    profilePath: 'apps/web/src/lib/runtime-ux/bm017-runtime-ux-profile.ts',
    profileVariable: 'BM017_RUNTIME_UX_PROFILE',
    compiledTitleRegex: /Yêu cầu khởi tố vụ án hình sự|YÊU CẦU/u,
    principalDocumentType: 'Yêu cầu khởi tố vụ án hình sự',
    legalWorkflowVerb: 'khởi tố',
    forbiddenDocumentTypes: [/phê duyệt\/phối hợp/iu, /Thông báo phê duyệt/iu, /^Yêu cầu ra Quyết định thay đổi/iu],
    operativeActionRange: ['P0017', 'P0021'],
  },
  {
    code: 'BM-018',
    headingPids: ['P0010', 'P0011'],
    profilePath: 'apps/web/src/lib/runtime-ux/bm018-runtime-ux-profile.ts',
    profileVariable: 'BM018_RUNTIME_UX_PROFILE',
    compiledTitleRegex: /Yêu cầu ra QĐ thay đổi|Yêu cầu ra Quyết định thay đổi|YÊU CẦU/u,
    principalDocumentType:
      'Yêu cầu ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự',
    legalWorkflowVerb: 'thay đổi',
    forbiddenDocumentTypes: [/^Quyết định tố tụng$/iu, /^Quyết định khởi tố vụ án hình sự$/iu, /^Yêu cầu khởi tố vụ án hình sự$/iu],
    operativeActionRange: ['P0024', 'P0033'],
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

function loadCompiled(relativePath) {
  const full = resolveProvenancePath(relativePath);
  return JSON.parse(readFileSync(full, 'utf8'));
}

function loadProfileSourceText(relativePath) {
  const full = resolveProvenancePath(relativePath);
  return readFileSync(full, 'utf8');
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readExtractPIds(extractPath) {
  const fullPath = assertRepositoryLocalPath(extractPath, { requireRoot: 'extract' });
  if (!existsSync(fullPath)) return new Set();
  const text = readFileSync(fullPath, 'utf8');
  const ids = new Set();
  for (const match of text.matchAll(/\*\*P(\d{4})\*\*:/gu)) {
    ids.add(match[1]);
  }
  return ids;
}

function readExtractParagraphText(extractPath, pid) {
  const fullPath = assertRepositoryLocalPath(extractPath, { requireRoot: 'extract' });
  if (!existsSync(fullPath)) return '';
  const text = readFileSync(fullPath, 'utf8');
  const re = new RegExp(`\\*\\*${pid}\\*\\*:\\s+(.+?)\\s*$`, 'mu');
  const m = text.match(re);
  return m ? m[1] : '';
}

function readExtractParagraphRange(extractPath, startPid, endPid) {
  const fullPath = assertRepositoryLocalPath(extractPath, { requireRoot: 'extract' });
  if (!existsSync(fullPath)) return '';
  const text = readFileSync(fullPath, 'utf8');
  const startRe = new RegExp(`\\*\\*${startPid}\\*\\*:`, 'u');
  const endRe = new RegExp(`\\*\\*${endPid}\\*\\*:`, 'u');
  const startIdx = text.search(startRe);
  if (startIdx < 0) return '';
  const endIdx = text.search(endRe);
  if (endIdx < 0) return '';
  return text.substring(startIdx, endIdx);
}

function extractProfileSectionTitles(sourceText) {
  const titles = [];
  for (const m of sourceText.matchAll(/title:\s*"([^"]+)"/gu)) {
    titles.push(m[1]);
  }
  return titles;
}

function extractProfileDescriptions(sourceText) {
  const descs = [];
  for (const m of sourceText.matchAll(/description:\s*"([^"]+)"/gu)) {
    descs.push(m[1]);
  }
  return descs;
}

function extractProfileFieldLabels(sourceText) {
  const labels = {};
  for (const m of sourceText.matchAll(/"([a-zA-Z][\w.]+)":\s*\{\s*label:\s*"([^"]+)"/gu)) {
    labels[m[1]] = m[2];
  }
  return labels;
}

for (const form of FORMS) {
  const provenanceRow = findProvenanceRow(form.code);
  const provenance = parseProvenanceRow(provenanceRow);
  const compiledFullPath = resolveProvenancePath(
    provenance.compiledContractPath,
  );
  const extractFullPath = resolveProvenancePath(provenance.sourceExtractPath);
  const compiledExists = existsSync(compiledFullPath);
  const extractExists = existsSync(extractFullPath);
  const compiled = compiledExists
    ? loadCompiled(provenance.compiledContractPath)
    : {};
  const extractIds = readExtractPIds(provenance.sourceExtractPath);
  const profileSourceText = loadProfileSourceText(form.profilePath);
  const profileSectionTitles = extractProfileSectionTitles(profileSourceText);
  const profileDescriptions = extractProfileDescriptions(profileSourceText);
  const profileLabels = extractProfileFieldLabels(profileSourceText);
  const operativeActionText = readExtractParagraphRange(
    provenance.sourceExtractPath,
    form.operativeActionRange[0],
    form.operativeActionRange[1],
  );
  const extractHeading = form.headingPids
    .map((pid) => readExtractParagraphText(provenance.sourceExtractPath, pid))
    .join(' ');

  describe(`${form.code} — source-independent provenance assertions`, () => {
    it('parses the row formCode from the actual ledger row', () => {
      assert.equal(provenance.formCode, form.code);
    });

    it('resolves both declared source paths without legacy or cross-form extract pointers', () => {
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

    it('matches both declared hashes to the files reached through the ledger paths', () => {
      assert.equal(
        sha256File(compiledFullPath),
        provenance.compiledSHA256.toLowerCase(),
      );
      assert.equal(
        sha256File(extractFullPath),
        provenance.extractSHA256.toLowerCase(),
      );
    });

    it('matches compiled templateCode and title to the actual ledger identity', () => {
      assert.equal(compiled.templateCode, form.code);
      assert.equal(compiled.title, provenance.compiledTitle);
    });

    it('matches the declared extract heading at the ledger path to the document identity', () => {
      const normalizeHeading = (value) =>
        value.replace(/\s*\/\s*/gu, ' ').replace(/\s+/gu, ' ').trim();
      assert.equal(
        normalizeHeading(extractHeading),
        normalizeHeading(provenance.extractHeading),
      );
      assert.match(extractHeading, form.compiledTitleRegex);
    });

    it('compiled contract title aligns with the form-specific operative distinction', () => {
      assert.match(
        compiled.title,
        form.compiledTitleRegex,
        `${form.code} compiled title must contain a form-specific verb (got: "${compiled.title}")`,
      );
      // Compiled title must NOT drift into a forbidden generic category.
      for (const forbidden of form.forbiddenDocumentTypes) {
        assert.doesNotMatch(
          compiled.title,
          forbidden,
          `${form.code} compiled title must not use forbidden generic wording ${forbidden}`,
        );
      }
    });

    it('extract heading contains the expected principal document type', () => {
      assert.ok(
        extractHeading.length > 0,
        `${form.code} heading P-IDs must produce a non-empty heading`,
      );
      assert.match(
        extractHeading,
        form.compiledTitleRegex,
        `${form.code} extract heading must contain the form-specific title verb`,
      );
    });

    it('operative-action paragraph range carries the form-specific verb (not a generic category)', () => {
      assert.ok(
        operativeActionText.length > 0,
        `${form.code} ${form.operativeActionRange[0]}–${form.operativeActionRange[1]} range must exist in extract`,
      );
      assert.match(
        operativeActionText,
        new RegExp(form.legalWorkflowVerb, 'iu'),
        `${form.code} ${form.operativeActionRange[0]}–${form.operativeActionRange[1]} must contain the form-specific verb "${form.legalWorkflowVerb}"`,
      );
    });

    it('profile registers with the same templateCode as the compiled contract', () => {
      assert.match(
        profileSourceText,
        new RegExp(`templateCode:\\s*["']${form.code}["']`, 'u'),
        `${form.code} profile must register templateCode = ${form.code}`,
      );
      assert.equal(compiled.templateCode, form.code);
    });

    it('profile corpus (titles + descriptions + field labels) is consistent with the compiled section title', () => {
      // BM-015/017/018 profiles organize the form into multiple presentation
      // sections, so the form-specific verb may appear in a section
      // description or field label rather than the first section title.
      // The assertion here is that AT LEAST ONE of titles/descriptions/labels
      // carries the form-specific verb.
      const corpus = [
        ...profileSectionTitles,
        ...profileDescriptions,
        ...Object.values(profileLabels),
      ];
      assert.ok(corpus.length > 0, `${form.code} profile corpus must be non-empty`);
      const verbRe = new RegExp(form.legalWorkflowVerb, 'iu');
      const found = corpus.some((text) => verbRe.test(text));
      assert.ok(
        found,
        `${form.code} profile corpus must contain the form-specific verb "${form.legalWorkflowVerb}"`,
      );
      // None of the corpus must drift into a forbidden generic category.
      for (const forbidden of form.forbiddenDocumentTypes) {
        const drifting = corpus.filter((text) => forbidden.test(text));
        assert.deepEqual(
          drifting,
          [],
          `${form.code} profile corpus must not use forbidden generic wording ${forbidden}: ${drifting.join(' | ')}`,
        );
      }
    });

    it('provenance documentType matches the compiled-title semantics', () => {
      assert.match(
        provenanceRow,
        /\*\*DocumentType:\*\*\s*\S/u,
        `${form.code} row must declare a DocumentType`,
      );
      assert.match(
        provenanceRow,
        new RegExp(
          `\\*\\*DocumentType:\\*\\*\\s*${form.compiledTitleRegex.source.replace(/[/u]/g, '')}`,
          'iu',
        ),
        `${form.code} row DocumentType must mention the form-specific verb`,
      );
    });

    it('provenance legalWorkflow carries the form-specific operative action', () => {
      assert.match(
        provenanceRow,
        /\*\*LegalWorkflow:\*\*\s*\S/u,
        `${form.code} row must declare a LegalWorkflow`,
      );
      assert.match(
        provenanceRow,
        new RegExp(form.legalWorkflowVerb, 'iu'),
        `${form.code} row LegalWorkflow must mention "${form.legalWorkflowVerb}"`,
      );
    });

    it('provenance documentType does NOT drift into a forbidden generic category', () => {
      for (const forbidden of form.forbiddenDocumentTypes) {
        assert.doesNotMatch(
          provenanceRow,
          new RegExp(
            `\\*\\*DocumentType:\\*\\*[^|]*${forbidden.source}`,
            'iu',
          ),
          `${form.code} row DocumentType must not use forbidden wording ${forbidden}`,
        );
      }
    });

    it('provenance carries a non-empty SourceParagraphRanges clause', () => {
      assert.match(
        provenanceRow,
        /\*\*SourceParagraphRanges:\*\*\s*P\d{4}/u,
        `${form.code} row must include at least one P-ID in SourceParagraphRanges`,
      );
    });

    it('provenance carries confidence information (ConfidenceBySection OR ConfidenceByField)', () => {
      const hasConfidence =
        /\*\*ConfidenceBySection:\*\*/u.test(provenanceRow) ||
        /\*\*ConfidenceByField:\*\*/u.test(provenanceRow);
      assert.ok(
        hasConfidence,
        `${form.code} row must carry explicit confidence information`,
      );
    });

    it('provenance explicitly enumerates Low-confidence slots', () => {
      assert.match(provenanceRow, /\*\*Low-confidence slots:\*\*/u);
    });

    it('provenance explicitly enumerates Medium-confidence slots', () => {
      assert.match(provenanceRow, /\*\*Medium-confidence slots:\*\*/u);
    });

    it('provenance explicitly enumerates Contract-only fields', () => {
      assert.match(provenanceRow, /\*\*Contract-only fields:\*\*/u);
    });

    it('provenance does not carry the legacy blanket HIGH-without-supporting-ranges wording', () => {
      assert.doesNotMatch(
        provenanceRow,
        /Confidence:\s*HIGH\s+—\s+the\s+contract\s+is\s+self-contained/iu,
      );
    });

    it('every cited P-ID in the row belongs to the form\'s own extract (no cross-form paragraph references)', () => {
      const cited = new Set();
      for (const match of provenanceRow.matchAll(/\bP(\d{4})\b/gu)) {
        cited.add(match[1]);
      }
      const missing = [...cited].filter((id) => !extractIds.has(id));
      assert.deepEqual(
        missing,
        [],
        `${form.code} row cites P-IDs not in ${provenance.sourceExtractPath}: ${missing.join(', ')}`,
      );
    });

    it('profile field labels do not contradict the compiled-contract labels', () => {
      // For BM-015/017/018, the contract fields do not carry a `documentType`
      // metadata field; instead the principal compiled field is
      // `document.documentCode` plus the form-specific operative lines. The
      // profile must not introduce a label that contradicts the compiled title.
      const conflictingLabels = Object.values(profileLabels).filter((label) =>
        form.forbiddenDocumentTypes.some((re) => re.test(label)),
      );
      assert.deepEqual(
        conflictingLabels,
        [],
        `${form.code} profile labels must not use forbidden generic wording: ${conflictingLabels.join(' | ')}`,
      );
    });

    it('is recorded as semantic-PASS / provenance-PRESENT in the maturity report', () => {
      const entry = maturity?.forms?.find((f) => f.templateCode === form.code);
      assert.ok(entry, `${form.code} must appear in maturity report`);
      assert.equal(entry.semanticUi.status, 'PASS');
      assert.equal(entry.provenance.status, 'PRESENT');
    });
  });
}

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
    const declaredInside = `${PROVENANCE_ROOTS.extract}BM-015__symlink-fake.md`;
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
    const sample = `${PROVENANCE_ROOTS.extract}BM-015__08f17df338d2.extract.md`;
    const resolved = assertRepositoryLocalPath(sample, {
      mustExist: true,
      requireRealpathContainment: true,
    });
    assert.equal(existsSync(resolved), true);
  });

  it('accepts a repository-local compiled contract path that resolves inside PROJECT_ROOT', () => {
    const sample = `${PROVENANCE_ROOTS.compiled}BM-015.compiled.json`;
    const resolved = assertRepositoryLocalPath(sample, {
      mustExist: true,
      requireRealpathContainment: true,
    });
    assert.equal(existsSync(resolved), true);
  });
});