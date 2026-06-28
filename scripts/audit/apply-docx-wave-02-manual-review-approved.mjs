#!/usr/bin/env node
/**
 * apply-docx-wave-02-manual-review-approved.mjs
 *
 * Applies label-only fixes for Wave 02 items that have been human-reviewed
 * and marked as APPROVED_LABEL in decisions.approved.json.
 *
 * Modes:
 *   dry-run (default)  — read, compute, report, modify nothing
 *   write (--write)    — actually patch locked contracts
 *
 * Safety layers:
 *   1. Guards against write mode without decisions file
 *   2. Requires decision === "APPROVED_LABEL" for each item
 *   3. Requires non-empty approvedLabel
 *   4. Validates current label exactly equals "Slot from Wave 02 DOCX remediation"
 *   5. Blocks legalBasis.* unless explicitly approved with legalReviewer field
 *   6. Idempotency check (no double-apply)
 *   7. Backup before any write
 *   8. Label-only mutation (no path/source/binding change)
 *
 * Exit codes:
 *   0 — dry-run or write completed successfully (no-op if no approvals)
 *   1 — safety check failed or unexpected error
 *
 * Usage:
 *   node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs          # dry-run
 *   node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs --write # apply
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const PACK_DIR = join(ROOT, 'docs', 'audit', 'docx-wave-02-manual-review-pack');
const DECISIONS_FILE = join(PACK_DIR, 'decisions.approved.json');
const TEMPLATE_FILE = join(PACK_DIR, 'decisions.template.json');
const APPLY_DIR = join(PACK_DIR, 'apply');

const WRITE = process.argv.includes('--write');
const WRITE_MODE = WRITE ? 'write' : 'dry-run';

// =============================================================================
// CONSTANTS
// =============================================================================

const BAD_LABEL = 'Slot from Wave 02 DOCX remediation';
const VALID_DECISIONS = new Set(['PENDING_REVIEW', 'APPROVED_LABEL', 'DEFER', 'LEGAL_REVIEW', 'DOCX_REAUTHOR_REQUIRED']);

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(filepath) {
  return JSON.parse(readFileSync(filepath, 'utf8'));
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a), bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (!bk.includes(k) || !deepEqual(a[k], b[k])) return false;
  return true;
}

// =============================================================================
// CONTRACT LOADING
// =============================================================================

function loadContracts(contractIds) {
  const map = new Map();
  for (const { templateCode, sourceId } of contractIds) {
    const filename = `${templateCode}__${sourceId}.contract.locked.json`;
    const filepath = join(LOCKED_DIR, filename);
    if (existsSync(filepath)) {
      map.set(`${templateCode}__${sourceId}`, {
        templateCode,
        sourceId,
        filename,
        contract: JSON.parse(readFileSync(filepath, 'utf8')),
      });
    }
  }
  return map;
}

// Lazy-load a contract entry (avoids loading all 200+ contracts on startup)
function getContract(entry) {
  if (!entry.contract) {
    entry.contract = JSON.parse(readFileSync(join(LOCKED_DIR, entry.filename), 'utf8'));
  }
  return entry.contract;
}

// =============================================================================
// DECISIONS LOADING
// =============================================================================

function loadDecisions() {
  if (!existsSync(DECISIONS_FILE)) {
    if (existsSync(TEMPLATE_FILE)) {
      process.stderr.write(`[APPLY] decisions.approved.json not found in ${PACK_DIR}\n`);
      process.stderr.write(`[APPLY] Template exists at ${TEMPLATE_FILE} — copy it and fill in decisions.\n`);
      process.stderr.write(`[APPLY] Run dry-run without decisions.approved.json: exit 0 (no-op)\n`);
      return null;
    }
    process.stderr.write(`[APPLY] FATAL: Neither decisions.approved.json nor decisions.template.json found.\n`);
    process.exit(1);
  }
  return loadJson(DECISIONS_FILE);
}

// =============================================================================
// MUTATION PLANNING
// =============================================================================

function buildMutationPlan(decisions, contractsMap) {
  const mutations = [];
  const skipped = [];
  const failed = [];

  for (const item of decisions.items ?? []) {
    const { reviewItemId, templateCode, path, decision, approvedLabel, sourceId, evidence } = item;

    // Skip non-approved
    if (decision !== 'APPROVED_LABEL') {
      skipped.push({
        reviewItemId,
        templateCode,
        path,
        decision,
        reason: `Decision is "${decision}", not APPROVED_LABEL`,
      });
      continue;
    }

    // Require approved label
    if (!approvedLabel || approvedLabel.trim() === '') {
      failed.push({
        reviewItemId,
        templateCode,
        path,
        reason: 'APPROVED_LABEL decision but approvedLabel is empty',
      });
      continue;
    }

    // Require legal reviewer for legalBasis.*
    if (path.startsWith('legalBasis.') && !item.legalReviewer) {
      failed.push({
        reviewItemId,
        templateCode,
        path,
        reason: 'legalBasis.* path requires legalReviewer field in decisions file',
      });
      continue;
    }

    // Load contract via pre-resolved map (hardened sourceId resolution above)
    const contractEntry = contractsMap.get(templateCode);

    if (!contractEntry) {
      failed.push({
        reviewItemId,
        templateCode,
        path,
        reason: `Contract not found for ${templateCode}`,
      });
      continue;
    }

    const { filename } = contractEntry;
    const contract = getContract(contractEntry);
    const field = contract.canonicalFields?.find((f) => f.path === path);

    if (!field) {
      failed.push({
        reviewItemId,
        templateCode,
        path,
        reason: `Field not found: ${path}`,
      });
      continue;
    }

    // Idempotency check
    if (field.label === approvedLabel) {
      skipped.push({
        reviewItemId,
        templateCode,
        path,
        decision,
        approvedLabel,
        reason: `SKIPPED_IDEMPOTENT: label already "${approvedLabel}"`,
      });
      continue;
    }

    // Label mismatch check (field was edited by another process)
    if (field.label !== BAD_LABEL) {
      failed.push({
        reviewItemId,
        templateCode,
        path,
        reason: `LABEL_MISMATCH: expected "${BAD_LABEL}" but found "${field.label}"`,
      });
      continue;
    }

    mutations.push({
      reviewItemId,
      templateCode,
      sourceId: contractEntry.sourceId,
      filename,
      path,
      labelBefore: field.label,
      labelAfter: approvedLabel,
      legalReviewer: item.legalReviewer ?? null,
      evidence,
    });
  }

  return { mutations, skipped, failed };
}

// =============================================================================
// BACKUP
// =============================================================================

function createBackups(contractEntries) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(APPLY_DIR, 'backups', ts);
  mkdirSync(backupDir, { recursive: true });
  const manifest = [];
  for (const { filename } of contractEntries) {
    const src = join(LOCKED_DIR, filename);
    const dest = join(backupDir, filename);
    cpSync(src, dest);
    manifest.push({ file: filename, backedUpAt: new Date().toISOString() });
  }
  writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  process.stderr.write(`[APPLY] Backup created: ${backupDir}\n`);
  return backupDir;
}

// =============================================================================
// REPORT
// =============================================================================

function writeReports({ decisions, mutations, skipped, failed, contractsMap, mode }) {
  mkdirSync(APPLY_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    task: 'DOCX_WAVE_02_MANUAL_REVIEW_APPLY',
    mode,
    planned: mutations.length,
    applied: mode === 'write' ? mutations.length : 0,
    skippedIdempotent: skipped.filter((s) => s.reason?.startsWith('SKIPPED_IDEMPOTENT')).length,
    skippedDecision: skipped.filter((s) => !s.reason?.startsWith('SKIPPED_IDEMPOTENT')).length,
    failed: failed.length,
    changedContracts: [...new Set(mutations.map((m) => m.filename))],
    mutations: mutations.map((m) => ({
      reviewItemId: m.reviewItemId,
      templateCode: m.templateCode,
      path: m.path,
      labelBefore: m.labelBefore,
      labelAfter: m.labelAfter,
      legalReviewer: m.legalReviewer,
    })),
    skippedItems: skipped.map((s) => ({
      reviewItemId: s.reviewItemId,
      templateCode: s.templateCode,
      path: s.path,
      decision: s.decision ?? s.reason,
      reason: s.reason,
    })),
    failedItems: failed.map((f) => ({
      reviewItemId: f.reviewItemId,
      templateCode: f.templateCode,
      path: f.path,
      reason: f.reason,
    })),
    safety: {
      decisionsFileRequired: true,
      approvedLabelRequired: true,
      legalBasisRequiresLegalReviewer: true,
      idempotencyChecked: true,
      backupCreated: mode === 'write' && mutations.length > 0,
    },
  };

  writeFileSync(join(APPLY_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');

  // Markdown report
  const lines = [];
  lines.push(`# Wave 02 Manual Review Apply Report`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Mode: **${mode}**`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Planned | ${report.planned} |`);
  lines.push(`| Applied | ${report.applied} |`);
  lines.push(`| Skipped (idempotent) | ${report.skippedIdempotent} |`);
  lines.push(`| Skipped (decision) | ${report.skippedDecision} |`);
  lines.push(`| Failed | ${report.failed} |`);
  lines.push(`| Changed contracts | ${report.changedContracts.length} |`);
  lines.push('');

  if (report.failed > 0) {
    lines.push('## Failed Items');
    lines.push('');
    lines.push(`| ID | BM | Path | Reason |`);
    lines.push(`|----|-----|------|--------|`);
    for (const f of report.failedItems) {
      lines.push(`| ${f.reviewItemId} | ${f.templateCode} | \`${f.path}\` | ${f.reason} |`);
    }
    lines.push('');
  }

  if (report.skippedIdempotent > 0) {
    lines.push('## Skipped (Idempotent)');
    lines.push('');
    for (const s of report.skippedItems.filter((x) => x.reason?.startsWith('SKIPPED_IDEMPOTENT'))) {
      lines.push(`- ${s.reviewItemId} ${s.templateCode}::${s.path}: ${s.reason}`);
    }
    lines.push('');
  }

  if (report.mutations.length > 0) {
    lines.push('## Approved Mutations');
    lines.push('');
    lines.push(`| ID | BM | Path | Before | After |`);
    lines.push(`|----|-----|------|--------|-------|`);
    for (const m of report.mutations) {
      lines.push(`| ${m.reviewItemId} | ${m.templateCode} | \`${m.path}\` | \`${m.labelBefore}\` | \`${m.labelAfter}\` |`);
    }
    lines.push('');
  }

  lines.push('## Validation Commands');
  lines.push('');
  lines.push('After write mode, run:');
  lines.push('');
  lines.push('```bash');
  lines.push('pnpm audit:forms-root-cause');
  lines.push('pnpm typecheck');
  lines.push('```');
  lines.push('');

  writeFileSync(join(APPLY_DIR, 'latest.md'), lines.join('\n') + '\n', 'utf8');
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write(`[APPLY] DOCX_WAVE_02_MANUAL_REVIEW_APPLY\n`);
  process.stderr.write(`[APPLY] Mode: ${WRITE_MODE}\n`);

  const decisions = loadDecisions();

  if (decisions === null) {
    // No decisions.approved.json — no-op
    mkdirSync(APPLY_DIR, { recursive: true });
    const noopReport = {
      generatedAt: new Date().toISOString(),
      task: 'DOCX_WAVE_02_MANUAL_REVIEW_APPLY',
      mode: WRITE_MODE,
      planned: 0,
      applied: 0,
      status: 'NO_DECISIONS_FILE',
      message: `decisions.approved.json not found. Copy decisions.template.json, fill in decisions, then re-run.`,
    };
    writeFileSync(join(APPLY_DIR, 'latest.json'), JSON.stringify(noopReport, null, 2), 'utf8');
    const lines = [
      `# Wave 02 Manual Review Apply Report`,
      `Generated: ${noopReport.generatedAt}`,
      `Mode: **${WRITE_MODE}**`,
      '',
      `## Status: NO_DECISIONS_FILE`,
      '',
      `**${noopReport.message}**`,
      '',
      `Run with --write has no effect without decisions.approved.json.`,
    ];
    writeFileSync(join(APPLY_DIR, 'latest.md'), lines.join('\n') + '\n', 'utf8');
    process.stderr.write(`[APPLY] No decisions.approved.json — no-op.\n`);
    process.exit(0);
  }

  // =============================================================================
  // SOURCEID RESOLUTION (hardened)
  // =============================================================================
  //
  // Resolution rules:
  //   - If item.sourceId is a full suffix (e.g. "6c1275cc752e"), try exact match first.
  //   - If item.sourceId is absent or equals templateCode (e.g. "BM-068"), scan.
  //   - Exactly 1 locked contract for templateCode  → use it, report sourceId
  //   - 0 matches                               → fail: no contract for this template
  //   - >1 matches                              → fail: ambiguous templateCode
  //   - Provided sourceId not found              → fail: sourceId does not exist
  // Never silently pick first match.
  // =============================================================================

  const allContracts = new Map();
  // Key by full "BM-068__6c1275cc752e" form
  // Also index by templateCode for multi-match detection
  const byTemplateCode = new Map();
  for (const f of readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'))) {
    const m = f.match(/^(BM-\d+)__(.+)\.contract\.locked\.json$/);
    if (!m) continue;
    const [templateCode, sourceId] = [m[1], m[2]];
    const fullKey = `${templateCode}__${sourceId}`;
    const entry = { templateCode, sourceId, filename: f, contract: null };
    allContracts.set(fullKey, entry);
    if (!byTemplateCode.has(templateCode)) byTemplateCode.set(templateCode, []);
    byTemplateCode.get(templateCode).push(entry);
  }

  // Lazy-load contracts only for entries we actually need (avoids loading all 200+)
  function getContract(entry) {
    if (!entry.contract) {
      entry.contract = JSON.parse(readFileSync(join(LOCKED_DIR, entry.filename), 'utf8'));
    }
    return entry.contract;
  }

  // For each decision item, resolve sourceId deterministically
  const contractsMap = new Map();
  const sourceIdErrors = [];

  for (const item of decisions.items ?? []) {
    const { reviewItemId, templateCode, sourceId: providedSourceId } = item;
    let entry = null;
    let resolution = '';

    if (providedSourceId && providedSourceId !== templateCode) {
      // Explicit sourceId provided — must exactly match a contract
      const fullKey = `${templateCode}__${providedSourceId}`;
      if (allContracts.has(fullKey)) {
        entry = allContracts.get(fullKey);
        resolution = `explicit-sourceId-exact-match:${providedSourceId}`;
      } else {
        sourceIdErrors.push(
          `  [${reviewItemId}] sourceId "${providedSourceId}" for ${templateCode} not found in locked contracts`
        );
        continue;
      }
    } else {
      // No explicit sourceId or only templateCode — scan by templateCode
      const candidates = byTemplateCode.get(templateCode) ?? [];
      if (candidates.length === 0) {
        sourceIdErrors.push(
          `  [${reviewItemId}] No locked contract found for ${templateCode}`
        );
        continue;
      }
      if (candidates.length > 1) {
        sourceIdErrors.push(
          `  [${reviewItemId}] AMBIGUOUS: ${candidates.length} locked contracts for ${templateCode}. ` +
          `Provide explicit sourceId: ${candidates.map((c) => c.sourceId).join(', ')}`
        );
        continue;
      }
      entry = candidates[0];
      resolution = `scan-unique:${entry.sourceId}`;
    }

    if (entry) {
      contractsMap.set(item.templateCode, entry);
      process.stderr.write(
        `[APPLY] [${reviewItemId}] ${templateCode} resolved via ${resolution} -> ${entry.filename}\n`
      );
    }
  }

  if (sourceIdErrors.length > 0) {
    process.stderr.write(`[APPLY] FATAL: sourceId resolution failed:\n`);
    for (const e of sourceIdErrors) process.stderr.write(`${e}\n`);
    process.stderr.write(`[APPLY] Fix decisions.approved.json with correct sourceIds.\n`);
    process.exit(1);
  }

  const { mutations, skipped, failed } = buildMutationPlan(decisions, contractsMap);

  process.stderr.write(`[APPLY] Decisions loaded: ${decisions.items?.length ?? 0} items\n`);
  process.stderr.write(`[APPLY] Mutations: ${mutations.length} | Skipped: ${skipped.length} | Failed: ${failed.length}\n`);

  if (WRITE && failed.length > 0) {
    process.stderr.write(`[APPLY] FATAL: ${failed.length} failed items. Fix decisions before applying.\n`);
    for (const f of failed) {
      process.stderr.write(`  FAIL: ${f.templateCode}::${f.path} — ${f.reason}\n`);
    }
    writeReports({ decisions, mutations, skipped, failed, contractsMap, mode: WRITE_MODE });
    process.exit(1);
  }

  if (mutations.length === 0 && skipped.length > 0 && failed.length === 0) {
    process.stderr.write(`[APPLY] No applicable mutations (all skipped or already applied).\n`);
    writeReports({ decisions, mutations, skipped, failed, contractsMap, mode: WRITE_MODE });
    process.exit(0);
  }

  if (WRITE) {
    // Backup
    const uniqueContracts = [...new Map(mutations.map((m) => [m.filename, m])).values()];
    const backupDir = createBackups(uniqueContracts);

    // Apply mutations
    let applied = 0;
    for (const mut of mutations) {
      // Use pre-resolved contractsMap (lazy-loaded via getContract)
      const entry = contractsMap.get(mut.templateCode);
      if (!entry) continue;
      const field = getContract(entry).canonicalFields?.find((f) => f.path === mut.path);
      if (!field) continue;
      field.label = mut.labelAfter;
      writeFileSync(join(LOCKED_DIR, mut.filename), JSON.stringify(entry.contract, null, 2), 'utf8');
      applied++;
      process.stderr.write(`[APPLY] Applied: ${mut.templateCode}::${mut.path}\n`);
      process.stderr.write(`[APPLY]   "${mut.labelBefore}" -> "${mut.labelAfter}"\n`);
    }

    process.stderr.write(`[APPLY] Write complete: ${applied} mutations applied\n`);
  }

  writeReports({ decisions, mutations, skipped, failed, contractsMap, mode: WRITE_MODE });
  process.stderr.write(`[APPLY] Reports written to ${APPLY_DIR}\n`);
  process.stderr.write(`[APPLY] ${WRITE ? 'WRITE' : 'DRY-RUN'} complete.\n`);
}

main();
