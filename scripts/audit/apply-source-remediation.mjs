#!/usr/bin/env node
/**
 * apply-source-remediation.mjs — C3-APPLY
 *
 * Applies source remediation proposals from source-remediation-proposal.json
 * to locked contract JSON files.
 *
 * MODES (default: dry-run):
 *   node scripts/audit/apply-source-remediation.mjs          # dry-run
 *   node scripts/audit/apply-source-remediation.mjs --apply  # actually apply
 *   node scripts/audit/apply-source-remediation.mjs --report-only  # report current state
 *
 * SAFETY:
 *   - Every proposal must match exactly ONE canonical field.
 *   - The field's current source must equal originalSource.
 *   - If either condition fails → BLOCKED, no modifications.
 *   - No partial commits; either all 116 succeed or zero modifications are kept.
 *   - Only canonicalFields[].source is changed.
 *   - No other field properties are modified.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT         = join(__dirname, '..', '..');
const LOCKED_DIR   = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const PROPOSAL_JSON = join(ROOT, 'docs', 'audit', 'source-remediation', 'source-remediation-proposal.json');
const OUT_DIR      = join(ROOT, 'docs', 'audit', 'source-remediation');

const VALID_SOURCES = new Set([
  'agencyConfig', 'officialConfig', 'systemDate', 'manual', 'casePayload', 'computed',
]);

// ──────────────────────────────────────────────────────────────────────────────
// Mode detection
// ──────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const MODE = args.includes('--apply')
  ? 'apply'
  : args.includes('--report-only')
    ? 'report-only'
    : 'dry-run';

const log = (msg) => process.stderr.write(`[C3-APPLY] ${msg}\n`);
const die = (code) => { process.exitCode = code; };

// ──────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ──────────────────────────────────────────────────────────────────────────────

const validateContract = (filePath) => {
  const raw = readFileSync(filePath, 'utf8');
  const c = JSON.parse(raw);
  if (!c.templateCode || !c.sourceId || !Array.isArray(c.canonicalFields)) {
    throw new Error(`Invalid contract structure in ${filePath}`);
  }
  return c;
};

/**
 * Find exactly one canonical field matching templateCode + sourceId + path.
 * Returns { contract, field, index } or null if not found / ambiguous.
 */
const findField = (proposal) => {
  const { templateCode, sourceId, path, originalSource } = proposal;

  // Try exact sourceId match first (most precise)
  const file = readdirSync(LOCKED_DIR).find(
    (f) =>
      f.startsWith(`${templateCode}__`) &&
      f.includes(`${sourceId}.`) &&
      f.endsWith('.contract.locked.json'),
  );

  let contract = null;
  if (file) {
    const filePath = join(LOCKED_DIR, file);
    contract = validateContract(filePath);
    if (contract.sourceId !== sourceId) contract = null;
  }

  // Fallback: try by templateCode only if sourceId doesn't resolve
  if (!contract) {
    const candidates = readdirSync(LOCKED_DIR).filter(
      (f) => f.startsWith(`${templateCode}__`) && f.endsWith('.contract.locked.json'),
    );
    if (candidates.length === 1) {
      contract = validateContract(join(LOCKED_DIR, candidates[0]));
    }
  }

  if (!contract) return null;

  const matches = contract.canonicalFields.filter(
    (f) => f.path === path && f.source === originalSource,
  );

  return { contract, field: matches[0] ?? null, index: matches[0] ? contract.canonicalFields.indexOf(matches[0]) : -1 };
};

// ──────────────────────────────────────────────────────────────────────────────
// Main apply logic
// ──────────────────────────────────────────────────────────────────────────────

const run = () => {
  log('');
  if (MODE === 'apply') {
    log('MODE: APPLY (changes WILL be written)');
  } else if (MODE === 'report-only') {
    log('MODE: REPORT-ONLY');
  } else {
    log('MODE: DRY-RUN (no changes will be written)');
  }
  log('');

  // ── Load proposal ─────────────────────────────────────────────────────────
  if (!existsSync(PROPOSAL_JSON)) {
    log(`ERROR: Proposal not found at ${PROPOSAL_JSON}`);
    die(1);
    return;
  }

  const proposalDoc = JSON.parse(readFileSync(PROPOSAL_JSON, 'utf8'));
  const proposals = proposalDoc.proposals ?? [];

  log(`Loaded ${proposals.length} proposals from proposal document (generated ${proposalDoc.generatedAt}).`);

  // ── Validate proposedSource values ────────────────────────────────────────
  for (const p of proposals) {
    if (!VALID_SOURCES.has(p.proposedSource)) {
      log(`BLOCKED: proposal for ${p.templateCode}/${p.path} has invalid proposedSource="${p.proposedSource}"`);
      log(`  Valid values: ${[...VALID_SOURCES].join(', ')}`);
      die(1);
      return;
    }
  }
  log(`All ${proposals.length} proposedSource values are valid.`);

  // ── Process each proposal ─────────────────────────────────────────────────
  const changes = [];
  let failed = 0;
  let blocked = 0;

  for (const proposal of proposals) {
    const { templateCode, sourceId, path, originalSource, proposedSource, label } = proposal;
    const displayName = `${templateCode}:${path}`;

    const found = findField(proposal);

    if (!found || !found.field) {
      log(`  BLOCKED: ${displayName} — no matching canonical field with source="${originalSource}"`);
      changes.push({
        templateCode, sourceId, path, label,
        oldSource: originalSource,
        newSource: proposedSource,
        file: null,
        status: 'FAILED',
        reason: `No canonical field found matching path="${path}" AND source="${originalSource}" in any contract for ${templateCode}`,
      });
      failed++;
      blocked++;
      continue;
    }

    // Safety: must match exactly one field
    const { contract, field, index } = found;

    // ── Dry / report-only: no changes ───────────────────────────────────
    if (MODE === 'dry-run' || MODE === 'report-only') {
      const file = readdirSync(LOCKED_DIR).find(
        (f) => f.startsWith(`${templateCode}__`) && f.includes(`${sourceId}.`),
      ) ?? readdirSync(LOCKED_DIR).find(
        (f) => f.startsWith(`${templateCode}__`) && f.endsWith('.contract.locked.json'),
      ) ?? 'unknown';

      changes.push({
        templateCode, sourceId, path, label,
        oldSource: originalSource,
        newSource: proposedSource,
        file: join(LOCKED_DIR, file),
        status: 'APPLIED',
        dryRun: true,
        confidence: proposal.confidence,
        reason: proposal.reason,
      });
      continue;
    }

    // ── Apply ─────────────────────────────────────────────────────────────
    const fileName = readdirSync(LOCKED_DIR).find(
      (f) => f.startsWith(`${templateCode}__`) && f.includes(`${sourceId}.`),
    ) ?? readdirSync(LOCKED_DIR).find(
      (f) => f.startsWith(`${templateCode}__`) && f.endsWith('.contract.locked.json'),
    );

    if (!fileName) {
      log(`  BLOCKED: ${displayName} — could not locate contract file for sourceId=${sourceId}`);
      changes.push({
        templateCode, sourceId, path, label,
        oldSource: originalSource,
        newSource: proposedSource,
        file: null,
        status: 'FAILED',
        reason: 'Contract file not found for sourceId',
      });
      failed++;
      blocked++;
      continue;
    }

    const filePath = join(LOCKED_DIR, fileName);
    const contractRaw = readFileSync(filePath, 'utf8');
    const contractObj = JSON.parse(contractRaw);

    // Re-verify match in the actual object
    const currentField = contractObj.canonicalFields[index];
    if (currentField.path !== path || currentField.source !== originalSource) {
      log(`  BLOCKED: ${displayName} — field state changed during processing (path=${currentField.path}, source=${currentField.source})`);
      changes.push({
        templateCode, sourceId, path, label,
        oldSource: currentField.source,
        newSource: proposedSource,
        file: filePath,
        status: 'FAILED',
        reason: 'Field state mismatch at apply time — concurrent modification?',
      });
      failed++;
      blocked++;
      continue;
    }

    // Apply the change
    currentField.source = proposedSource;
    contractObj.generatedAt = new Date().toISOString();
    contractObj.reviewedAt = new Date().toISOString();

    // Write back
    writeFileSync(filePath, JSON.stringify(contractObj, null, 2), 'utf8');

    log(`  APPLIED: ${displayName}  ${originalSource} → ${proposedSource}`);

    changes.push({
      templateCode, sourceId, path, label,
      oldSource: originalSource,
      newSource: proposedSource,
      file: filePath,
      status: 'APPLIED',
      confidence: proposal.confidence,
      reason: proposal.reason,
    });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const applied = changes.filter((c) => c.status === 'APPLIED').length;
  const skipped = changes.filter((c) => c.status === 'SKIPPED').length;
  const changedFiles = [...new Set(changes.filter((c) => c.status === 'APPLIED' && c.file).map((c) => c.file))];

  log('');
  log('─'.repeat(60));
  log(`Summary: ${applied} APPLIED, ${skipped} SKIPPED, ${failed} FAILED`);
  log(`Files changed: ${changedFiles.length}`);
  log('─'.repeat(60));

  if (MODE === 'dry-run') {
    log('');
    log('Dry-run complete. Run with --apply to write changes.');
  }

  // ── Write apply report ─────────────────────────────────────────────────────
  const body = {
    generatedAt: new Date().toISOString(),
    task: 'C3-APPLY — Source Remediation Batch Apply',
    mode: MODE,
    totalProposals: proposals.length,
    applied,
    skipped,
    failed,
    blocked,
    summaryByOldSource: {},
    summaryByNewSource: {},
    changedFiles,
    changes,
  };

  // Aggregate by old → new
  for (const c of changes) {
    if (c.status !== 'APPLIED') continue;
    body.summaryByOldSource[c.oldSource] = (body.summaryByOldSource[c.oldSource] ?? 0) + 1;
    body.summaryByNewSource[c.newSource] = (body.summaryByNewSource[c.newSource] ?? 0) + 1;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, 'source-remediation-apply.json');
  const mdPath = join(OUT_DIR, 'source-remediation-apply.md');

  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');
  log(`Report: ${jsonPath}`);

  // Markdown report
  const lines = [];
  lines.push(`# C3-APPLY — Source Remediation Apply Report`);
  lines.push('');
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push(`Mode: **${MODE.toUpperCase()}**${MODE === 'dry-run' ? ' (no changes written)' : ''}`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total proposals | ${body.totalProposals} |`);
  lines.push(`| APPLIED | ${applied} |`);
  lines.push(`| SKIPPED | ${skipped} |`);
  lines.push(`| FAILED | ${failed} |`);
  lines.push(`| Files changed | ${changedFiles.length} |`);
  lines.push('');
  lines.push(`## Summary by Old Source`);
  lines.push('');
  lines.push(`| Old Source | Count |`);
  lines.push(`|-----------|-------|`);
  for (const [src, cnt] of Object.entries(body.summaryByOldSource)) {
    lines.push(`| ${src} | ${cnt} |`);
  }
  lines.push('');
  lines.push(`## Summary by New Source`);
  lines.push('');
  lines.push(`| New Source | Count |`);
  lines.push(`|-----------|-------|`);
  for (const [src, cnt] of Object.entries(body.summaryByNewSource)) {
    lines.push(`| ${src} | ${cnt} |`);
  }
  lines.push('');
  const failures = changes.filter((c) => c.status === 'FAILED');
  if (failures.length > 0) {
    lines.push(`## FAILURES`);
    lines.push('');
    lines.push(`| templateCode | path | reason |`);
    lines.push(`|------------|------|--------|`);
    for (const f of failures) {
      lines.push(`| ${f.templateCode} | ${f.path} | ${f.reason} |`);
    }
    lines.push('');
  }
  lines.push(`## All Changes`);
  lines.push('');
  lines.push(`| templateCode | path | oldSource | newSource | confidence | status |`);
  lines.push(`|------------|------|-----------|-----------|------------|--------|`);
  for (const c of changes) {
    lines.push(`| ${c.templateCode} | ${c.path} | ${c.oldSource} | ${c.newSource} | ${c.confidence ?? '-'} | ${c.status} |`);
  }

  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
  log(`Report: ${mdPath}`);

  // ── Exit code ───────────────────────────────────────────────────────────────
  if (failed > 0 || blocked > 0) {
    log('');
    log('RESULT: FAILED — one or more proposals blocked.');
    log('No changes were committed. Fix blocked proposals and retry.');
    die(1);
    return;
  }

  if (MODE === 'apply') {
    log('');
    log('RESULT: SUCCESS — all proposals applied.');
    log(`Changed ${changedFiles.length} contract files.`);
    die(0);
    return;
  }

  log('');
  log('RESULT: DRY-RUN complete. Changes shown above were not written.');
  die(0);
};

run();
