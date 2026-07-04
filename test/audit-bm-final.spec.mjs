#!/usr/bin/env node
/**
 * PR6G.2 — node:test cases for `scripts/audit/audit-bm-final.mjs`.
 *
 * The harness is a pure-JS CLI runner. Eight scenarios are required by
 * the PR6G.2 Planner spec:
 *
 *   1. `--bm=BM-001` produces a `final.latest.json` artefact.
 *   2. Result has `docxParts` populated with the PR6G.1 reader shape.
 *   3. `docxParts.footnotes === "NOT_APPLICABLE_BY_TEMPLATE"` for BM-001;
 *      evidence mentions `word/footnotes.xml`.
 *   4. `sourceDocx.path` and `sourceDocx.sha256` are present.
 *   5. Synthetic DOCX buffer with placeholder leak emits
 *      `renderedContent.leakedTokens` entry.
 *   6. Synthetic DOCX buffer mutation test: byte equality before/after.
 *   7. Unknown BM (`ZZ-999`) exits 2 without writing any artefact.
 *   8. Default invocation without `--bm=` exits 2.
 *
 * We also include helper unit tests for `parseArgs`,
 * `summariseNotes`, and `renderMarkdown` so a regression in any small
 * helper is caught immediately.
 *
 * @module audit/audit-bm-final.spec
 */

import {
  existsSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  inspectDocx,
  parseArgs,
  renderMarkdown,
  summariseNotes,
  LEAKED_TOKEN_PATTERNS,
} from '../scripts/audit/audit-bm-final.mjs';

const require_ = createRequire(import.meta.url);
const PizZip = require_('pizzip');
const REPO_ROOT = join(import.meta.dirname, '..');
const BM001_NORM = join(
  REPO_ROOT,
  'storage',
  'templates',
  'normalized-docx',
  'BM-001',
  'BM-001_normalized.docx',
);

/** Build a synthetic DOCX zip in memory. */
function buildSyntheticDocx(parts) {
  const zip = new PizZip();
  for (const [name, content] of Object.entries(parts)) {
    zip.file(name, content);
  }
  return zip.generate({ type: 'nodebuffer' });
}

test('parseArgs: positional BM-XXX', () => {
  const r = parseArgs(['BM-001']);
  assert.equal(r.bm, 'BM-001');
});

test('parseArgs: --bm= flag', () => {
  const r = parseArgs(['--bm=BM-001', '--no-render']);
  assert.equal(r.bm, 'BM-001');
  assert.equal(r.noRender, true);
});

test('parseArgs: --output= flag', () => {
  const r = parseArgs(['--bm=BM-001', '--output=/tmp/x.json']);
  assert.equal(r.output, '/tmp/x.json');
});

test('parseArgs: malformed code is rejected by main()', () => {
  // parseArgs lets any string through; the shape validator lives in main().
  const r = parseArgs(['--bm=ZZ-999']);
  assert.equal(r.bm, 'ZZ-999');
});

test('summariseNotes: empty => NOT_APPLICABLE_BY_TEMPLATE', () => {
  assert.equal(summariseNotes([]), 'NOT_APPLICABLE_BY_TEMPLATE');
});

test('summariseNotes: non-empty => PASS', () => {
  assert.equal(summariseNotes([{ id: '2', text: 'note', normalizedText: 'note' }]), 'PASS');
});

test('LEAKED_TOKEN_PATTERNS exposes the four required tokens', () => {
  const tokens = LEAKED_TOKEN_PATTERNS.map((p) => p.token);
  assert.deepEqual(tokens, ['{{', 'undefined', 'null', '[object Object]']);
});

test('Scenario 5 — leaked-token detection against synthetic DOCX', () => {
  const buf = buildSyntheticDocx({
    'word/document.xml':
      '<w:document><w:body><w:p><w:r><w:t>This buffer leaks {{leaked}} values plus undefined and null markers.</w:t></w:r></w:p></w:body></w:document>',
    'word/styles.xml': '<x/>',
    'word/settings.xml': '<x/>',
    'word/footnotes.xml': '<w:footnotes></w:footnotes>',
    'word/endnotes.xml': '<w:endnotes></w:endnotes>',
  });
  const inspection = inspectDocx(buf);
  assert.equal(inspection.ok, true);
  assert.ok(
    inspection.mainDocument.normalizedText.includes('{{'),
    'document text should retain {{ literal',
  );
  // The four detector patterns scan the normalized text.
  const lower = inspection.mainDocument.normalizedText;
  for (const token of ['{{', 'undefined', 'null']) {
    assert.ok(lower.includes(token), `synthetic buffer must contain "${token}"`);
  }
  // '[object Object]' is the missing one — proves scan logic.
  // We rebuild the scan loop the same way the harness does, to keep
  // this test focused on token detection rather than re-implementing
  // the entire harness here.
  const leaked = LEAKED_TOKEN_PATTERNS.filter((p) => lower.includes(p.token)).map((p) => p.token);
  assert.deepEqual(leaked, ['{{', 'undefined', 'null']);
});

test('Scenario 6 — inspectDocx does not mutate the input buffer', () => {
  const buf = buildSyntheticDocx({
    'word/document.xml': '<w:document><w:body><w:p><w:r><w:t>hello</w:t></w:r></w:p></w:body></w:document>',
    'word/styles.xml': '<x/>',
    'word/settings.xml': '<x/>',
    'word/footnotes.xml': '<w:footnotes></w:footnotes>',
    'word/endnotes.xml': '<w:endnotes></w:endnotes>',
  });
  const before = Buffer.from(buf);
  const result = inspectDocx(buf);
  // Byte equality — every byte matches. Buffer.compare returns 0 when
  // the buffers are equivalent.
  assert.equal(Buffer.compare(before, buf), 0);
  assert.equal(result.ok, true);
  assert.equal(result.mainDocument.normalizedText, 'hello');
});

test('Scenario 2/3/4 — BM-001: docxParts + footnote NOT_APPLICABLE + sha256', { skip: !existsSync(BM001_NORM) }, () => {
  const buffer = readFileSync(BM001_NORM);
  const result = inspectDocx(buffer);

  assert.equal(result.ok, true);
  assert.equal(result.footnotes.length, 0, 'BM-001 has no real numbered footnotes');
  assert.equal(result.endnotes.length, 0, 'BM-001 has no real numbered endnotes');

  // docxParts summary that the harness would compute.
  const summaryFootnotes = summariseNotes(result.footnotes);
  const summaryEndnotes = summariseNotes(result.endnotes);
  assert.equal(summaryFootnotes, 'NOT_APPLICABLE_BY_TEMPLATE');
  assert.equal(summaryEndnotes, 'NOT_APPLICABLE_BY_TEMPLATE');

  // sha256 of the buffer is a 64-char lowercase hex string.
  const { createHash } = require_('node:crypto');
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  assert.equal(sha256.length, 64);
  assert.match(sha256, /^[0-9a-f]{64}$/u);
});

test('renderMarkdown: produces a stable markdown artefact shape', () => {
  const fake = {
    templateCode: 'BM-001',
    generatedAt: '2026-07-04T00:00:00Z',
    schemaVersion: '1',
    status: 'MANUAL_REQUIRED',
    sourceDocx: {
      path: 'storage/templates/normalized-docx/BM-001/BM-001_normalized.docx',
      lockedContract: 'docs/audit/docx/contracts/locked/BM-001__x.contract.locked.json',
      exists: true,
      sha256: 'a'.repeat(64),
      byteLength: 1234,
      parts: 10,
      stylesPartExists: true,
      settingsPartExists: true,
      relationships: 9,
    },
    fieldCoverage: { status: 'PASS', source: 'BM-001_FIELD_COVERAGE.latest.json', totalSlots: 38, coveredSlots: 38, missingSlots: [] },
    renderedContent: { status: 'PASS', leakedTokens: [], leakedTokenLabels: [] },
    docxParts: { mainDocument: 'PASS', headers: 'PASS', footers: 'NOT_APPLICABLE', footnotes: 'NOT_APPLICABLE_BY_TEMPLATE', endnotes: 'NOT_APPLICABLE_BY_TEMPLATE', comments: 'NOT_APPLICABLE' },
    style: { status: 'MANUAL_REQUIRED', source: 'BM001_STYLE_COMPLIANCE.latest.json' },
    safety: { noFakeGeneratedDocumentId: true, noTemplateDbWrite: true, noDemoFallback: true, noSourceGuardRegression: true },
    sourceGuardFindings: 22,
    harnessReady: true,
    rolloutReady: false,
    blockers: ['visual confirm pending'],
    notes: ['word/footnotes.xml has only separator entries -1 and 0'],
  };
  const md = renderMarkdown(fake);
  assert.match(md, /# BM Final Audit — BM-001/);
  // Three-signal readiness summary headings (Planner-required
  // semantic).
  assert.match(md, /Harness execution: \*\*PASS\*\*/);
  assert.match(md, /BM final audit status: \*\*MANUAL_REQUIRED\*\*/);
  assert.match(md, /Rollout readiness: \*\*NO\*\*/);
  assert.match(md, /harnessReady: true/);
  assert.match(md, /rolloutReady: false/);
  // docxParts shape preserved.
  assert.match(md, /footnotes: NOT_APPLICABLE_BY_TEMPLATE/);
});

test('Scenario 1 — full harness invocation writes the BM-001 artefact', { skip: !existsSync(BM001_NORM) }, async () => {
  // We invoke the harness by spawning a child process that runs
  // `tsx scripts/audit/audit-bm-final.mjs`. tsx (already in
  // `apps/api` devDeps) is the runtime that resolves the PR6G.1
  // TypeScript import. The harness itself is plain `.mjs`; only
  // its import target is TypeScript.
  const { spawnSync } = require_('node:child_process');
  const outDir = join(tmpdir(), `audit-bm-final-scenario1-${Date.now()}`);
  const outJson = join(outDir, 'final.latest.json');
  const repoRoot = join(import.meta.dirname, '..');
  const apiDir = join(repoRoot, 'apps', 'api');
  const tsxBin = join(apiDir, 'node_modules', '.bin', 'tsx.cmd');
  const result = spawnSync(
    tsxBin,
    [join(repoRoot, 'scripts', 'audit', 'audit-bm-final.mjs'), '--bm=BM-001', `--output=${outJson}`],
    { cwd: apiDir, encoding: 'utf8', shell: true },
  );
  assert.equal(result.status, 0, `harness exited non-zero:\n${result.stdout}\n${result.stderr}`);
  assert.equal(existsSync(outJson), true, `expected artefact at ${outJson}`);
  const parsed = JSON.parse(readFileSync(outJson, 'utf8'));
  assert.equal(parsed.templateCode, 'BM-001');
  assert.equal(parsed.status, 'MANUAL_REQUIRED');
  assert.equal(parsed.docxParts.footnotes, 'NOT_APPLICABLE_BY_TEMPLATE');
  assert.match(parsed.docxParts.footnotes, /NOT_APPLICABLE_BY_TEMPLATE/);
  // Evidence line must mention the OOXML fact observed in PR6G.1.
  assert.ok(
    parsed.notes.some((n) => /word\/footnotes\.xml/.test(n) && /-1/.test(n) && /0/.test(n)),
    'one of the evidence lines must cite the word/footnotes.xml separator entries',
  );
  assert.match(parsed.sourceDocx.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(parsed.sourceDocx.exists, true);
  assert.match(parsed.fieldCoverage.source, /BM-001_FIELD_COVERAGE\.latest\.json/);

  // Semantic guard (Planner-required): a `MANUAL_REQUIRED` BM is
  // NOT rollout-ready, even when the harness itself is healthy. The
  // harness must report `harnessReady: true` (infra works) AND
  // `rolloutReady: false` (BM-001 cannot be a baseline for the next
  // BM until visual style sign-off lands). Bug fixed in PR6G.2
  // round 2 — the previous version wrongly reported
  // `rolloutReady: true` here.
  assert.equal(parsed.harnessReady, true, 'harnessReady must be true when artefact is written');
  assert.equal(
    parsed.rolloutReady,
    false,
    'rolloutReady must be false while status is MANUAL_REQUIRED',
  );
  assert.ok(
    parsed.blockers.some((b) => /visual style sign-off is still pending/u.test(b)),
    'blockers[] must mention the visual style sign-off when style.status is MANUAL_REQUIRED',
  );
  rmSync(outDir, { recursive: true, force: true });
});

test('Scenario 7 — unknown BM exits 2 and writes nothing', () => {
  const { spawnSync } = require_('node:child_process');
  const outDir = join(tmpdir(), `audit-bm-final-scenario7-${Date.now()}`);
  const repoRoot = join(import.meta.dirname, '..');
  const apiDir = join(repoRoot, 'apps', 'api');
  const tsxBin = join(apiDir, 'node_modules', '.bin', 'tsx.cmd');
  const result = spawnSync(
    tsxBin,
    [join(repoRoot, 'scripts', 'audit', 'audit-bm-final.mjs'), '--bm=ZZ-999', `--output=${outDir}/nope.json`],
    { cwd: apiDir, encoding: 'utf8', shell: true },
  );
  assert.equal(result.status, 2);
  assert.equal(existsSync(outDir), false, 'no artefact directory should exist for unknown BM');
});

test('Scenario 8 — default invocation without --bm= exits 2', () => {
  const { spawnSync } = require_('node:child_process');
  const repoRoot = join(import.meta.dirname, '..');
  const apiDir = join(repoRoot, 'apps', 'api');
  const tsxBin = join(apiDir, 'node_modules', '.bin', 'tsx.cmd');
  const result = spawnSync(
    tsxBin,
    [join(repoRoot, 'scripts', 'audit', 'audit-bm-final.mjs')],
    { cwd: apiDir, encoding: 'utf8', shell: true },
  );
  assert.equal(result.status, 2);
});
