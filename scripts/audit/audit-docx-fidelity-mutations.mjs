#!/usr/bin/env node
/**
 * audit-docx-fidelity-mutations.mjs — K0 Step 3
 *
 * Mutation testing: prove that F1/F2/F3/F4/F5 audits are capable of catching
 * known defects by deliberately breaking test fixtures and asserting audits fail.
 *
 * CRITICAL RULE: All mutations use IN-PLACE changes with POST-RUN RESTORE.
 * Real source files are always returned to their original state.
 *
 * Mutation strategy — mutate what each audit reads:
 *   F1: reads locked contract JSON + normalized DOCX → inject TRIPLE_BRACE
 *   F2: adds paragraphs to normalized DOCX → excessive paragraph delta
 *   F3: reads normalized DOCX + renders → inject {{fake.unresolved}}
 *   F4: reads normalized DOCX + renders → corrupt slot key casing
 *   F5: reads contract JSON → add synthetic repeat slot → check report classification
 *
 * Exit codes:
 *   0 — all audits correctly fail / detect their mutations
 *   1 — one or more mutations not detected
 *
 * Usage:
 *   node scripts/audit/audit-docx-fidelity-mutations.mjs
 */

import {
  readFileSync, writeFileSync, copyFileSync,
  rmSync, existsSync, readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const $require = createRequire(import.meta.url);
const ROOT = process.cwd();

const log = (msg) => process.stderr.write(`[MUTATION] ${msg}\n`);
const PASS_EXIT = () => { process.exitCode = 0; };
const FAIL_EXIT = () => { process.exitCode = 1; };

const LOCKED_DIR    = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORM_DIR      = join(ROOT, 'storage', 'templates', 'normalized-docx');
const F2_CACHE_DIR  = join(ROOT, '.cache', 'f2-rendered-docx');
const F4_CACHE_DIR  = join(ROOT, '.cache', 'f4-binding-docx');
const F5_CACHE_DIR  = join(ROOT, '.cache', 'f5-repeat-scan');

// ──────────────────────────────────────────────────────────────────────────────
// Audit runner
// ──────────────────────────────────────────────────────────────────────────────

const runAudit = (pnpmScript, extraArgs = []) => {
  const { execSync } = $require('node:child_process');
  try {
    execSync(
      `pnpm ${pnpmScript} ${extraArgs.join(' ')}`,
      { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], timeout: 120_000 },
    );
    return 0;
  } catch (err) {
    return err.status ?? 1;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// DOCX manipulation
// ──────────────────────────────────────────────────────────────────────────────

const injectIntoDocx = (srcBuf, transform) => {
  const PizZip = $require('pizzip');
  const zip = new PizZip(srcBuf);
  const newZip = new PizZip();
  for (const name of Object.keys(zip.files)) {
    const content = zip.file(name)?.asText();
    if (content !== undefined) {
      const transformed = transform(content, name);
      if (transformed === '__K0_DELETE__') continue;
      newZip.file(name, transformed);
    } else {
      newZip.file(name, zip.files[name].asUint8Array());
    }
  }
  return newZip.generate({ type: 'nodebuffer' });
};

// ──────────────────────────────────────────────────────────────────────────────
// Contract helpers
// ──────────────────────────────────────────────────────────────────────────────

const loadContractFile = (code) => {
  const files = readdirSync(LOCKED_DIR).filter(
    (f) => f.startsWith(`${code}__`) && f.endsWith('.contract.locked.json'),
  );
  if (!files.length) throw new Error(`Contract not found: ${code}`);
  return join(LOCKED_DIR, files[0]);
};

const clearCache = (path) => {
  if (existsSync(path)) rmSync(path);
};

const primeF2Cache = (templateCode) => {
  const cachePath = join(F2_CACHE_DIR, `${templateCode}.bin`);
  clearCache(cachePath);
  const exitCode = runAudit('test:docx-structural-fidelity', [
    '--template-code', templateCode,
  ]);
  if (exitCode !== 0 || !existsSync(cachePath)) {
    throw new Error(`could not create a clean F2 render cache for ${templateCode}`);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// M1: F1 — inject TRIPLE_BRACE into normalized DOCX
// F1 inspects raw XML for malformed placeholders via detectPlaceholderSyntaxDefects.
// }}}}}}} → TRIPLE_BRACE → F1 FAIL.
// ──────────────────────────────────────────────────────────────────────────────

const M1 = () => {
  log('');
  log('M1: F1 — injecting TRIPLE_BRACE into normalized DOCX');
  const BM = 'BM-001';
  const normPath = join(NORM_DIR, BM, `${BM}_normalized.docx`);
  const buf = readFileSync(normPath);

  const mutatedBuf = injectIntoDocx(buf, (xml, name) => {
    if (!name.endsWith('.xml')) return xml;
    return xml.replace(/(\{\{[^}]{1,20})\}\}/, '$1}}}}}');
  });

  const bak = normPath + '.k0bak';
  copyFileSync(normPath, bak);
  writeFileSync(normPath, mutatedBuf);

  const exitCode = runAudit('audit:docx-slot-inventory');

  copyFileSync(bak, normPath);
  rmSync(bak);

  const passed = exitCode !== 0;
  log(`  F1 expected FAIL, got exit=${exitCode}  ${passed ? '✓' : '✗'}`);
  return { passed, detail: `F1 exit=${exitCode}` };
};

// ──────────────────────────────────────────────────────────────────────────────
// M2: F2 — add paragraphs to normalized DOCX, then compare with a clean cache
//
// In --report-only mode, F2 compares:
//   original = cached DOCX (from the latest F2 run)
//   rendered = current normalized DOCX
//
// After C3-APPLY F2 run, the cache has 49 paragraphs for BM-001.
// Adding 8 paragraphs → normalized has 57.
// delta = |49-57|/49 = 14.04% < 15% (FAILS to cross threshold).
// Adding 10 paragraphs → normalized has 59.
// delta = |49-59|/49 = 17.05% > 15% → FAIL.
// ──────────────────────────────────────────────────────────────────────────────

const M2 = () => {
  log('');
  log('M2: F2 — adding 10 paragraphs to normalized DOCX (--report-only mode)');
  const BM = 'BM-001';
  const normPath = join(NORM_DIR, BM, `${BM}_normalized.docx`);
  primeF2Cache(BM);
  const buf = readFileSync(normPath);

  // Add 10 paragraphs to ensure delta > 15% (cache=49p, norm+10=59p → delta=17.05%)
  const ADD_COUNT = 10;
  const EXTRA_PARA =
    '<w:p w:rsidR="K0MUTATION"><w:r><w:t>K0_MUTATION_PLACEHOLDER_TEXT</w:t></w:r></w:p>';

  const mutatedBuf = injectIntoDocx(buf, (xml, name) => {
    if (name !== 'word/document.xml') return xml;
    return xml.replace(/(<\/w:body>)/, EXTRA_PARA.repeat(ADD_COUNT) + '$1');
  });

  const bak = normPath + '.k0bak';
  copyFileSync(normPath, bak);
  writeFileSync(normPath, mutatedBuf);

  // --report-only: original=cached(49p), rendered=normalized+10(59p) → delta=17.05%>15% → FAIL
  const exitCode = runAudit('test:docx-structural-fidelity', [
    '--template-code', BM, '--report-only',
  ]);

  let result = null;
  try {
    const report = JSON.parse(
      readFileSync(
        join(ROOT, 'docs', 'audit', 'docx-structural-fidelity', 'latest.json'),
        'utf8',
      ),
    );
    result = (report.results ?? [])[0] ?? null;
    if (result) {
      log(
        `  Report: status=${result.status} origP=${result.original?.paragraphCount} ` +
        `rendP=${result.rendered?.paragraphCount} delta=${result.deltas?.paragraphDeltaPercent}%`,
      );
    }
  } catch { /* ok */ }

  copyFileSync(bak, normPath);
  rmSync(bak);

  const passed =
    exitCode !== 0 &&
    result?.status === 'FAIL' &&
    typeof result.deltas?.paragraphDeltaPercent === 'number' &&
    result.deltas.paragraphDeltaPercent > 15;
  log(`  F2 expected FAIL, got exit=${exitCode}  ${passed ? '✓' : '✗'}`);
  return {
    passed,
    detail: `F2 exit=${exitCode}, delta=${result?.deltas?.paragraphDeltaPercent ?? 'missing'}`,
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// M3: F3 — inject {{fake.unresolved}} into normalized DOCX
// F3 re-renders and checks for unreplaced placeholders.
// Unknown key → unreplaced → F3 FAIL.
// ──────────────────────────────────────────────────────────────────────────────

const M3 = () => {
  log('');
  log('M3: F3 — injecting {{fake.unresolved}} into normalized DOCX');
  const BM = 'BM-001';
  const normPath = join(NORM_DIR, BM, `${BM}_normalized.docx`);
  const buf = readFileSync(normPath);

  const mutatedBuf = injectIntoDocx(buf, (xml, name) => {
    if (!name.endsWith('.xml')) return xml;
    return xml.replace(/(<w:p\b[^>]*>)/, '$1<w:r><w:t>{{fake.unresolved}}</w:t></w:r>');
  });

  const bak = normPath + '.k0bak';
  copyFileSync(normPath, bak);
  writeFileSync(normPath, mutatedBuf);

  clearCache(join(F2_CACHE_DIR, `${BM}.bin`));
  const exitCode = runAudit('audit:rendered-text-fidelity', ['--template-code', BM]);

  copyFileSync(bak, normPath);
  rmSync(bak);

  const passed = exitCode !== 0;
  log(`  F3 expected FAIL, got exit=${exitCode}  ${passed ? '✓' : '✗'}`);
  return { passed, detail: `F3 exit=${exitCode}` };
};

// ──────────────────────────────────────────────────────────────────────────────
// M4: F4 — corrupt slot key casing in normalized DOCX
// F4 uses schema-derived markers. Corrupted key → wrong marker → F4 FAIL.
// ──────────────────────────────────────────────────────────────────────────────

const M4 = () => {
  log('');
  log('M4: F4 — corrupting slot key casing in normalized DOCX');
  const BM = 'BM-001';
  const normPath = join(NORM_DIR, BM, `${BM}_normalized.docx`);
  const buf = readFileSync(normPath);

  const mutatedBuf = injectIntoDocx(buf, (xml, name) => {
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) return xml;
    return xml.replace(/\{\{receiver\.fullName\}\}/g, '{{RECEIVER_FULLNAME_BROKEN}}');
  });

  const bak = normPath + '.k0bak';
  copyFileSync(normPath, bak);
  writeFileSync(normPath, mutatedBuf);

  clearCache(join(F4_CACHE_DIR, `${BM}.bin`));
  const exitCode = runAudit('test:docx-binding-correctness', ['--template-code', BM]);

  copyFileSync(bak, normPath);
  rmSync(bak);

  const passed = exitCode !== 0;
  log(`  F4 expected FAIL, got exit=${exitCode}  ${passed ? '✓' : '✗'}`);
  return { passed, detail: `F4 exit=${exitCode}` };
};

// ──────────────────────────────────────────────────────────────────────────────
// M5: F5 — add synthetic repeat slot to contract JSON
// F5 detects CONFIRMED classification from slotType='repeat'.
// F5 exits 0 even for CONFIRMED — check report classification.
// A confirmed repeat slot means F5 DETECTED the mutation.
// ──────────────────────────────────────────────────────────────────────────────

const M5 = () => {
  log('');
  log('M5: F5 — adding synthetic repeat slot to contract JSON');
  const BM = 'BM-001';
  const contractPath = loadContractFile(BM);
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));

  contract.docxSlots = contract.docxSlots ?? [];
  contract.docxSlots.push({
    slotId: 'k0Synthetic.repeatSlot',
    slotType: 'repeat',
    source: 'mutation-test',
    required: false,
    rejected: false,
  });
  log('  Added k0Synthetic.repeatSlot (slotType=repeat)');

  const bak = contractPath + '.k0bak';
  copyFileSync(contractPath, bak);
  writeFileSync(contractPath, JSON.stringify(contract, null, 2));

  // Clear all caches
  clearCache(join(F2_CACHE_DIR, `${BM}.bin`));
  clearCache(join(F4_CACHE_DIR, `${BM}.bin`));
  clearCache(join(F5_CACHE_DIR, 'scan-results.json'));

  runAudit('test:docx-repeat-blocks', ['--template-code', BM]);

  // Read report: check if F5 classified the mutation
  let detected = false;
  let actualStatus = 'UNKNOWN';
  try {
    const report = JSON.parse(
      readFileSync(
        join(ROOT, 'docs', 'audit', 'docx-repeat-blocks', 'latest.json'),
        'utf8',
      ),
    );
    const bmResult = (report.results ?? []).find((r) => r.templateCode === BM);
    if (bmResult) {
      actualStatus = bmResult.status;
      // Detection = status !== NO_REPEAT_CANDIDATES OR confirmed candidates exist
      detected =
        bmResult.status !== 'NO_REPEAT_CANDIDATES' ||
        (bmResult.repeatCandidates ?? []).some((c) => c.key === 'k0Synthetic.repeatSlot');
      log(`  F5 classified: ${bmResult.status}`);
      for (const c of (bmResult.repeatCandidates ?? [])) {
        log(`    • ${c.key} → ${c.classification}`);
      }
    }
  } catch (err) {
    log(`  Could not read F5 report: ${err.message}`);
  }

  copyFileSync(bak, contractPath);
  rmSync(bak);

  const passed = detected;
  log(`  F5 ${detected ? 'CORRECTLY DETECTED' : 'MISSED'} mutation  ${passed ? '✓' : '✗'}`);
  return { passed, detail: `F5 status=${actualStatus}, detected=${detected}` };
};

// ──────────────────────────────────────────────────────────────────────────────
// Cleanup
// ──────────────────────────────────────────────────────────────────────────────

const cleanup = () => {
  for (const dir of [NORM_DIR, LOCKED_DIR, F2_CACHE_DIR, F4_CACHE_DIR, F5_CACHE_DIR]) {
    try {
      for (const f of readdirSync(dir)) {
        if (f.endsWith('.k0bak')) rmSync(join(dir, f), { force: true });
      }
    } catch { /* ok */ }
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

const MUTATIONS = [
  { id: 'M1', name: 'F1 — TRIPLE_BRACE injection',           fn: M1 },
  { id: 'M2', name: 'F2 — excessive paragraph delta',      fn: M2 },
  { id: 'M3', name: 'F3 — unresolved placeholder injection', fn: M3 },
  { id: 'M4', name: 'F4 — slot key corruption',            fn: M4 },
  { id: 'M5', name: 'F5 — synthetic repeat slot injection',  fn: M5 },
];

const main = () => {
  log('');
  log('═'.repeat(60));
  log('K0 Step 3 — Mutation Testing');
  log('═'.repeat(60));
  log('All mutations use in-place changes with post-run RESTORE.');
  log('');

  const results = [];
  let allPassed = true;

  for (const m of MUTATIONS) {
    try {
      const result = m.fn();
      results.push({ id: m.id, name: m.name, ...result });
      if (!result.passed) allPassed = false;
    } catch (err) {
      log(`  ✗ EXCEPTION in ${m.id}: ${err.message}`);
      results.push({ id: m.id, name: m.name, passed: false, detail: `EXCEPTION: ${err.message}` });
      allPassed = false;
    }
  }

  cleanup();

  log('');
  log('─'.repeat(60));
  log('Mutation Test Summary');
  log('─'.repeat(60));

  for (const r of results) {
    const mark = r.passed ? '✓' : '✗';
    log(`  ${mark} ${r.id} ${r.name}: ${r.detail}`);
  }

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;

  log('');
  if (allPassed) {
    log(`All ${MUTATIONS.length} mutation tests passed.`);
    log('The audits correctly detect known defects.');
    PASS_EXIT();
  } else {
    log(`${passCount}/${MUTATIONS.length} passed. ${failCount} failed.`);
    log('One or more audits INCORRECTLY PASS on broken fixtures.');
    FAIL_EXIT();
  }
};

main();
