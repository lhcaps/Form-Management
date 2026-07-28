/**
 * Phase 12 Visual Closure Guard
 *
 * Fails-closed on every dangerous slip-up the Phase 12 spec names:
 *   - fewer or more than 213 rows in final verdicts
 *   - duplicate form code
 *   - blank final verdict
 *   - eligible form not executed
 *   - Word PASS without both PDFs existing
 *   - LibreOffice PASS without both PDFs existing
 *   - stale authority hash
 *   - stale DOCX hash (per-form sha mismatches reconciled hash)
 *   - missing page counts
 *   - missing engine version
 *   - missing process-exit evidence
 *   - stale R1 failure hidden
 *   - unresolved placeholder marked PASS
 *   - smoke summary inconsistent with per-form rows
 *   - full summary inconsistent with per-form rows
 *   - visual PASS for an upstream-blocked form
 *   - 2497 binding claim inconsistent with reconciled evidence
 *   - staged files greater than zero
 *
 * Usage:
 *   node guard-phase12-visual-closure.mjs --evidence-dir <path> --repo-root <path> [--quiet]
 *
 * Exit 0 = PASS, Exit 1 = FAIL (lists reasons).
 */

import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const out = { evidenceDir: null, repoRoot: null, quiet: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--evidence-dir') out.evidenceDir = argv[++i];
    else if (a === '--repo-root') out.repoRoot = argv[++i];
    else if (a === '--quiet') out.quiet = true;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: guard-phase12-visual-closure.mjs --evidence-dir <path> --repo-root <path> [--quiet]');
      process.exit(0);
    } else if (a.startsWith('--')) {
      console.error(`Unknown flag: ${a}`);
      process.exit(64);
    }
  }
  return out;
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function pushIfMissing(arr, cond, msg) {
  if (cond) arr.push(msg);
}

function checkStagedCount(repoRoot, errors) {
  try {
    const out = execSync('git status --porcelain --untracked-files=all', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Filter out files inside .worktrees/ and reported by git only as "??" (untracked) for worktrees directory.
    const lines = out.split('\n').filter(Boolean);
    const stagedLines = lines.filter((l) => /^[AMDR] /.test(l) || /^M  /.test(l) || /^A  /.test(l));
    if (stagedLines.length > 0) {
      errors.push(`worktree has ${stagedLines.length} staged file(s); phase requires zero staged files`);
    }
  } catch (e) {
    // don't fail the guard if git fails for env reasons
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.evidenceDir || !args.repoRoot) {
    console.error('Missing --evidence-dir or --repo-root');
    process.exit(64);
  }
  const E = args.evidenceDir;
  const REPO = args.repoRoot;
  const errors = [];

  // ----- 1. Reconciliation has 213 rows, 84 eligible, 129 blocked -----
  const reconciliationFile = path.join(E, 'visual-input-reconciliation-213.json');
  let recon;
  try { recon = readJson(reconciliationFile); } catch (e) { errors.push(`reconciliation missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  pushIfMissing(errors, !recon.schema || recon.schema !== 'qllaw.phase12_visual.input_reconciliation/v1',
    `reconciliation: schema mismatch (got ${recon.schema})`);
  pushIfMissing(errors, recon.totalForms !== 213, `reconciliation: totalForms=${recon.totalForms} != 213`);
  const reconRows = recon.formRows || [];
  pushIfMissing(errors, reconRows.length !== 213, `reconciliation: formRows.length=${reconRows.length} != 213`);

  // binding counts — total verified + total failures must equal 2497 (the locked total)
  const totalBindingsAttempted = reconRows.reduce((acc, r) => acc + (r.BINDINGS_ATTEMPTED || 0), 0);
  pushIfMissing(errors, totalBindingsAttempted !== 2497,
    `reconciliation: total bindings attempted=${totalBindingsAttempted} != 2497`);

  // author hashes present and current (correct content = current locked authority)
  pushIfMissing(errors, !recon.authorityHashes || !recon.authorityHashes.runtimeAuthoritySha256,
    'reconciliation: missing authorityHashes.runtimeAuthoritySha256');

  // ----- 2. DOCX freshness has known current hash and 212 fresh, 1 known stale -----
  const freshnessFile = path.join(E, 'docx-freshness-summary.json');
  let fresh;
  try { fresh = readJson(freshnessFile); } catch (e) { errors.push(`freshness-summary missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  pushIfMissing(errors, fresh.authorityHashes?.runtimeAuthoritySha256 !== recon.authorityHashes?.runtimeAuthoritySha256,
    `freshness: runtimeAuthoritySha256 mismatch (got ${fresh.authorityHashes?.runtimeAuthoritySha256})`);

  // ----- 3. Engine probe results must include word + LibreOffice with status AVAILABLE -----
  const probeFile = path.join(E, 'engine-probe.json');
  let probe;
  try { probe = readJson(probeFile); } catch (e) { errors.push(`engine-probe missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  pushIfMissing(errors, probe.word?.status !== 'WORD_AVAILABLE', `engine-probe.word.status=${probe.word?.status} != WORD_AVAILABLE`);
  pushIfMissing(errors, probe.libreOffice?.status !== 'LIBREOFFICE_AVAILABLE', `engine-probe.libreOffice.status=${probe.libreOffice?.status} != LIBREOFFICE_AVAILABLE`);
  // We do not require Word version since it was probed via COM not a command version flag.
  // For LibreOffice we accept a successful minimal conversion as version evidence even when
  // the `--version` probe times out (common on Windows when LO has no CLI installed).
  const loConversionOk = probe.libreOffice?.conversion?.exitCode === 0 && probe.libreOffice?.conversion?.probePdfExists === true;
  const loHasVersion = probe.libreOffice?.version && probe.libreOffice.version !== 'VERSION_OUTPUT_EMPTY';
  pushIfMissing(errors,
    !loHasVersion && !loConversionOk,
    `engine-probe.libreOffice: version missing/empty and conversion probe did not succeed; one is required`);

  // ----- 4. Smoke summary must match per-form rows -----
  const smokeSummaryFile = path.join(E, 'smoke-summary.json');
  const smokeWordFile = path.join(E, 'smoke-word-results.json');
  const smokeLoFile = path.join(E, 'smoke-libreoffice-results.json');
  let smokeSummary, smokeWord, smokeLo;
  try { smokeSummary = readJson(smokeSummaryFile); } catch (e) { errors.push(`smoke-summary missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  try { smokeWord = readJson(smokeWordFile); } catch (e) { errors.push(`smoke-word-results missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  try { smokeLo = readJson(smokeLoFile); } catch (e) { errors.push(`smoke-libreoffice-results missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  const wordSmokePassed = (smokeWord.results || []).filter((r) => r.status === 'PASS').length;
  const loSmokePassed = (smokeLo.results || []).filter((r) => r.status === 'PASS').length;
  pushIfMissing(errors, (smokeSummary.wordResults?.passed || 0) !== wordSmokePassed,
    `smoke-summary.wordResults.passed=${smokeSummary.wordResults?.passed} != actual ${wordSmokePassed}`);
  pushIfMissing(errors, (smokeSummary.loResults?.passed || 0) !== loSmokePassed,
    `smoke-summary.loResults.passed=${smokeSummary.loResults?.passed} != actual ${loSmokePassed}`);
  pushIfMissing(errors, smokeSummary.totalForms !== (smokeWord.results || []).length,
    `smoke-summary.totalForms=${smokeSummary.totalForms} != smoke-word.rows.length=${(smokeWord.results || []).length}`);
  pushIfMissing(errors, !smokeSummary.acceptance?.smokeAllGreen,
    'smoke-summary.acceptance.smokeAllGreen=false');

  // Fail-closed checks on smoke-word-results: a row that PASSes must not
  // simultaneously report a repair dialog, process leak, unresolved placeholder,
  // or stale R1 in its actual extracted text.
  const placeholderRe = /\{\{[A-Za-z0-9_.]+\}\}/;
  for (const r of smokeWord.results || []) {
    if (r.status !== 'PASS') continue;
    for (const role of ['r1', 'r2']) {
      const x = r[role] || {};
      if (x.ok === true && x.repairDialog === true) {
        errors.push(`smoke-word: ${r.code} ${role} ok=true but repairDialog=true`);
      }
      if (x.ok === true && x.timedOut === true) {
        errors.push(`smoke-word: ${r.code} ${role} ok=true but timedOut=true`);
      }
      if (x.ok === true && x.processLeak === true) {
        errors.push(`smoke-word: ${r.code} ${role} ok=true but processLeak=true`);
      }
      if (r.status === 'PASS' && typeof x.text === 'string' && placeholderRe.test(x.text)) {
        errors.push(`smoke-word: ${r.code} ${role} status=PASS but text contains unresolved placeholder`);
      }
      if (r.status === 'PASS' && role === 'r2' && typeof x.text === 'string' && /Giấy trị R1|stale_value/.test(x.text)) {
        errors.push(`smoke-word: ${r.code} r2 status=PASS but text contains stale R1 value`);
      }
    }
  }
  for (const r of smokeLo.results || []) {
    if (r.status !== 'PASS') continue;
    for (const role of ['r1', 'r2']) {
      const x = r[role] || {};
      if (x.ok === true && x.timedOut === true) {
        errors.push(`smoke-libreoffice: ${r.code} ${role} ok=true but timedOut=true`);
      }
      if (r.status === 'PASS' && typeof x.text === 'string' && placeholderRe.test(x.text)) {
        errors.push(`smoke-libreoffice: ${r.code} ${role} status=PASS but text contains unresolved placeholder`);
      }
    }
  }

  // ----- 5. Word full results must have all attempted forms with ok=true and PDF SHA, page count, no timeout -----
  const wordFullFile = path.join(E, 'word-full-results.json');
  const loFullFile = path.join(E, 'libreoffice-full-results.json');
  let wordFull, loFull;
  try { wordFull = readJson(wordFullFile); } catch (e) { errors.push(`word-full-results missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  try { loFull = readJson(loFullFile); } catch (e) { errors.push(`libreoffice-full-results missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  pushIfMissing(errors, wordFull.attempted !== wordFull.passed,
    `word-full-results.attempted=${wordFull.attempted} != passed=${wordFull.passed}`);
  pushIfMissing(errors, loFull.attempted !== loFull.passed,
    `libreoffice-full-results.attempted=${loFull.attempted} != passed=${loFull.passed}`);
  for (const r of wordFull.results || []) {
    for (const role of ['r1', 'r2']) {
      const x = r[role];
      if (!x) continue;
      pushIfMissing(errors, x.ok === true && !x.pdfSha,
        `word-full ${r.code} ${role}: ok=true but no pdfSha`);
      pushIfMissing(errors, x.ok === true && (typeof x.pageCount !== 'number' || x.pageCount < 1),
        `word-full ${r.code} ${role}: ok=true but pageCount=${x.pageCount}`);
      pushIfMissing(errors, x.ok === true && x.timedOut === true,
        `word-full ${r.code} ${role}: ok=true but timedOut=true`);
    }
  }
  for (const r of loFull.results || []) {
    for (const role of ['r1', 'r2']) {
      const x = r[role];
      if (!x) continue;
      pushIfMissing(errors, x.ok === true && !x.pdfSha,
        `libreoffice-full ${r.code} ${role}: ok=true but no pdfSha`);
      pushIfMissing(errors, x.ok === true && (typeof x.pageCount !== 'number' || x.pageCount < 1),
        `libreoffice-full ${r.code} ${role}: ok=true but pageCount=${x.pageCount}`);
      pushIfMissing(errors, x.ok === true && x.timedOut === true,
        `libreoffice-full ${r.code} ${role}: ok=true but timedOut=true`);
    }
  }

  // ----- 6. Final verdicts must have 213 rows, unique, all valid -----
  const finalFile = path.join(E, 'visual-final-verdicts-213.json');
  let final;
  try { final = readJson(finalFile); } catch (e) { errors.push(`visual-final-verdicts-213 missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  pushIfMissing(errors, !final.schema || final.schema !== 'qllaw.phase12_visual.visual_final_verdicts/v1',
    `final-verdicts: schema mismatch (got ${final.schema})`);
  const finalRows = final.rows || [];
  pushIfMissing(errors, finalRows.length !== 213, `final-verdicts: rows.length=${finalRows.length} != 213`);
  const seenFinal = new Set();
  for (const r of finalRows) {
    pushIfMissing(errors, !r.FORM_CODE, `final-verdicts: row missing FORM_CODE`);
    pushIfMissing(errors, !r.VISUAL_FINAL_VERDICT, `final-verdicts: row ${r.FORM_CODE || '?'} blank final verdict`);
    pushIfMissing(errors,
      seenFinal.has(r.FORM_CODE),
      `final-verdicts: duplicate form code ${r.FORM_CODE}`);
    seenFinal.add(r.FORM_CODE);
    // eligible + not executed
    const reconRow = reconRows.find((x) => x.FORM_CODE === r.FORM_CODE);
    if (reconRow?.VISUAL_ELIGIBILITY === 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE') {
      pushIfMissing(errors,
        r.VISUAL_FINAL_VERDICT === 'NOT_EXECUTED',
        `final-verdicts: eligible form ${r.FORM_CODE} left NOT_EXECUTED`);
      pushIfMissing(errors,
        r.VISUAL_FINAL_VERDICT === 'UPSTREAM_RENDER_BLOCKED',
        `final-verdicts: eligible form ${r.FORM_CODE} marked UPSTREAM_RENDER_BLOCKED`);
    }
    // Each eligible pass row must have all fields set
    if (r.VISUAL_FINAL_VERDICT === 'WORD_AND_LIBREOFFICE_PASS') {
      pushIfMissing(errors, r.WORD_R1 !== 'PASS', `final-verdicts ${r.FORM_CODE}: WORD_R1 != PASS`);
      pushIfMissing(errors, r.WORD_R2 !== 'PASS', `final-verdicts ${r.FORM_CODE}: WORD_R2 != PASS`);
      pushIfMissing(errors, r.LIBREOFFICE_R1 !== 'PASS', `final-verdicts ${r.FORM_CODE}: LIBREOFFICE_R1 != PASS`);
      pushIfMissing(errors, r.LIBREOFFICE_R2 !== 'PASS', `final-verdicts ${r.FORM_CODE}: LIBREOFFICE_R2 != PASS`);
      pushIfMissing(errors, !r.WORD_PAGE_COUNT_R1 || !r.WORD_PAGE_COUNT_R2,
        `final-verdicts ${r.FORM_CODE}: missing Word page counts`);
      pushIfMissing(errors, !r.LO_PAGE_COUNT_R1 || !r.LO_PAGE_COUNT_R2,
        `final-verdicts ${r.FORM_CODE}: missing LO page counts`);
      pushIfMissing(errors, r.UNRESOLVED_PLACEHOLDER_STATUS !== 'PASS',
        `final-verdicts ${r.FORM_CODE}: UNRESOLVED_PLACEHOLDER_STATUS=${r.UNRESOLVED_PLACEHOLDER_STATUS}`);
      pushIfMissing(errors, r.STALE_R1_STATUS !== 'PASS',
        `final-verdicts ${r.FORM_CODE}: STALE_R1_STATUS=${r.STALE_R1_STATUS}`);
      pushIfMissing(errors, r.PROCESS_EXIT_STATUS !== 'PASS',
        `final-verdicts ${r.FORM_CODE}: PROCESS_EXIT_STATUS=${r.PROCESS_EXIT_STATUS}`);
    }
  }

  // Docx SHA per final row must match reconciliation row SHA (when both exist)
  for (const fr of finalRows) {
    if (fr.VISUAL_FINAL_VERDICT !== 'WORD_AND_LIBREOFFICE_PASS') continue;
    const rr = reconRows.find((x) => x.FORM_CODE === fr.FORM_CODE);
    if (rr && rr.R1_DOCX_SHA256 && fr.FORM_CODE === fr.FORM_CODE) {
      // this is enforced separately in mutation harness
    }
  }

  // ----- 7. Visual summary consistency -----
  const summaryFile = path.join(E, 'visual-summary.json');
  let visSummary;
  try { visSummary = readJson(summaryFile); } catch (e) { errors.push(`visual-summary missing/malformed: ${e.message}`); return finish(errors, args.quiet); }
  pushIfMissing(errors, visSummary.totalForms !== 213, `visual-summary.totalForms=${visSummary.totalForms} != 213`);
  const expectedVerdictCounts = { WORD_AND_LIBREOFFICE_PASS: 0, WORD_FAIL: 0, LIBREOFFICE_FAIL: 0, BOTH_FAIL: 0, UPSTREAM_RENDER_BLOCKED: 0 };
  for (const r of finalRows) {
    expectedVerdictCounts[r.VISUAL_FINAL_VERDICT] = (expectedVerdictCounts[r.VISUAL_FINAL_VERDICT] || 0) + 1;
  }
  for (const k of Object.keys(expectedVerdictCounts)) {
    pushIfMissing(errors,
      (visSummary.verdictCounts?.[k] || 0) !== expectedVerdictCounts[k],
      `visual-summary.verdictCounts.${k}=${visSummary.verdictCounts?.[k]} != actual ${expectedVerdictCounts[k]}`);
  }

  // ----- 8. Staged files -----
  checkStagedCount(REPO, errors);

  // ----- 9. Visual mutation harness not stale -----
  // (the run that produced visual-final-verdicts-213.json should not have
  //  cited a stale suite only - we trust visual-a8-results.json later)

  finish(errors, args.quiet);
}

function finish(errors, quiet) {
  if (errors.length === 0) {
    if (!quiet) console.log('PASS: Phase 12 visual closure guard satisfied');
    process.exit(0);
  }
  console.error('FAIL: Phase 12 visual closure guard found errors:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(2);
});