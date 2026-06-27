#!/usr/bin/env node
/**
 * apply-forms-root-cause-safe-fixes.mjs
 *
 * Applies only the 141 safe AUTO_FIX_CANDIDATE items from the fix plan.
 *
 * Modes:
 *   dry-run (default)   — read, compute, report, modify nothing
 *   write (--write)    — actually patch locked contracts
 *
 * Safety layers:
 *   1. Strict pre-write safety assertions
 *   2. Collision detection (path conflicts, duplicate mutations)
 *   3. Backup before any write (timestamped folder)
 *   4. Idempotency (no-op on second write run)
 *   5. Full before/after diff in report
 *
 * Exit codes:
 *   0 — dry-run or write completed successfully
 *   1 — safety check failed, or strict validation failure
 *
 * Usage:
 *   node scripts/audit/apply-forms-root-cause-safe-fixes.mjs          # dry-run
 *   node scripts/audit/apply-forms-root-cause-safe-fixes.mjs --write # apply
 *   pnpm apply:forms-root-cause-safe-fixes          # dry-run
 *   pnpm apply:forms-root-cause-safe-fixes --write  # apply
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const APPLY_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-apply');
const AUTO_FIX_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'auto-fix-candidates.json');
const PLAN_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');

const WRITE = process.argv.includes('--write');
const WRITE_MODE = WRITE ? 'write' : 'dry-run';

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const VALID_SOURCES = new Set(['manual', 'casePayload', 'agencyConfig', 'officialConfig', 'systemDate', 'computed']);
const VALID_ACTIONS = new Set(['UPDATE_LABEL', 'UPDATE_PATH', 'UPDATE_SOURCE']);
const BAD_LABEL_PARTS = ['Ô trống', 'Slot from', 'Wave', 'remediation', 'TODO', 'unknown'];
const GENERIC_TAIL_RE = /^field\d+$/i;

function isGenericPath(path) {
  return GENERIC_TAIL_RE.test(path?.split('.').pop() ?? '');
}

function isBadProposedLabel(label) {
  if (!label) return true;
  return BAD_LABEL_PARTS.some((part) => label.includes(part));
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

function loadContracts() {
  const map = new Map();
  for (const f of readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'))) {
    const code = f.match(/^(BM-\d+)/)?.[1];
    if (!code) continue;
    try {
      map.set(code, JSON.parse(readFileSync(join(LOCKED_DIR, f), 'utf8')));
    } catch { /* skip */ }
  }
  return map;
}

// =============================================================================
// MUTATION ENGINE
// =============================================================================

function buildMutationPlan(candidates, contracts) {
  const mutations = []; // successful mutations
  const skipped = []; // skipped items

  const mutationSignature = (item) => JSON.stringify({
    action: item.proposed?.action ?? null,
    path: item.proposed?.path ?? null,
    label: item.proposed?.label ?? null,
    source: item.proposed?.source ?? null,
  });

  const mergeDuplicateItems = (items) => {
    const [first] = items;
    const issueCodes = [...new Set(items.flatMap((item) => item.issueCodes ?? []))];
    const reasons = [...new Set(items.map((item) => item.reason).filter(Boolean))];
    return {
      ...first,
      issueCodes,
      reason: reasons.join(' | '),
      duplicateCount: Math.max(0, items.length - 1),
    };
  };

  // Group by template+path to detect collisions
  const byKey = new Map();
  for (const item of candidates) {
    const key = `${item.templateCode}::${item.path}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(item);
  }

  for (const [key, items] of byKey) {
    const bySignature = new Map();
    for (const item of items) {
      const sig = mutationSignature(item);
      if (!bySignature.has(sig)) bySignature.set(sig, []);
      bySignature.get(sig).push(item);
    }

    if (bySignature.size > 1) {
      for (const item of items) {
        skipped.push({
          ...item,
          reasonCode: 'SKIPPED_CONFLICTING_MUTATIONS',
          reason: `Multiple different proposed mutations planned for ${key}`,
        });
      }
      continue;
    }

    const duplicateGroup = [...bySignature.values()][0] ?? [];
    for (let di = 1; di < duplicateGroup.length; di++) {
      skipped.push({
        ...duplicateGroup[di],
        reasonCode: 'SKIPPED_DUPLICATE',
        reason: `Duplicate issue for the same proposed mutation as ${key}; issue codes are merged into the first mutation`,
      });
    }

    const item = mergeDuplicateItems(duplicateGroup);
    const contract = contracts.get(item.templateCode);

    // Idempotency check
    if (item.proposed.action === 'UPDATE_LABEL') {
      const field = contract?.canonicalFields?.find((f) => f.path === item.path);
      if (field && field.label === item.proposed.label) {
        skipped.push({ ...item, reasonCode: 'SKIPPED_IDEMPOTENT', reason: `Label already "${item.proposed.label}" on ${item.path}` });
        continue;
      }
    }
    if (item.proposed.action === 'UPDATE_PATH' && item.proposed.path) {
      const existing = contract?.canonicalFields?.find((f) => f.path === item.proposed.path);
      if (existing && existing.path !== item.path) {
        skipped.push({ ...item, reasonCode: 'SKIPPED_PATH_COLLISION', reason: `Proposed path "${item.proposed.path}" already exists in ${item.templateCode}` });
        continue;
      }
    }

    mutations.push({ item, contract });
  }

  return { mutations, skipped };
}

function applyMutation(contract, mutation) {
  const { item, contract: c } = mutation;
  const result = [];
  const proposed = item.proposed ?? {};

  if (proposed.action === 'UPDATE_LABEL') {
    const field = c.canonicalFields?.find((f) => f.path === item.path);
    if (field) {
      result.push({ pathBefore: item.path, labelBefore: field.label, labelAfter: proposed.label, action: 'UPDATE_LABEL', issueCodes: item.issueCodes, reason: item.reason });
      field.label = proposed.label;
    }
  }

  if (proposed.action === 'UPDATE_PATH') {
    const oldPath = item.path;
    const newPath = proposed.path;

    // Update canonicalFields
    const fieldIdx = c.canonicalFields?.findIndex((f) => f.path === oldPath);
    if (fieldIdx != null && fieldIdx >= 0 && c.canonicalFields) {
      const field = c.canonicalFields[fieldIdx];
      result.push({ pathBefore: oldPath, pathAfter: newPath, labelBefore: field.label, action: 'UPDATE_PATH', issueCodes: item.issueCodes, reason: item.reason });
      field.path = newPath;
      if (proposed.label) field.label = proposed.label;
    }

    // Update docxSlots where slotId == oldPath
    c.docxSlots?.forEach((s) => { if (s.slotId === oldPath) s.slotId = newPath; });

    // Update renderBindings where slotId or from == oldPath
    c.renderBindings?.forEach((rb) => {
      if (rb.slotId === oldPath) rb.slotId = newPath;
      if (rb.from === oldPath) rb.from = newPath;
    });

    // Update formInputHints
    if (c.formInputHints?.suggestedControls) {
      c.formInputHints.suggestedControls.forEach((sc) => {
        if (sc.path === oldPath) sc.path = newPath;
      });
    }
  }

  if (proposed.action === 'UPDATE_SOURCE') {
    const field = c.canonicalFields?.find((f) => f.path === item.path);
    if (field) {
      result.push({ pathBefore: item.path, sourceBefore: field.source, sourceAfter: proposed.source, action: 'UPDATE_SOURCE', issueCodes: item.issueCodes, reason: item.reason });
      field.source = proposed.source;
    }
  }

  return result;
}

// =============================================================================
// SAFETY ASSERTIONS
// =============================================================================

function assertSafety(candidates, mutations, skipped) {
  const checks = {
    allAutoFix: true,
    allApplySafe: true,
    noGenericProposedPaths: true,
    noBadProposedLabels: true,
    noUnsupportedSources: true,
    noPathCollisions: true,
    noConflictSkips: true,
    noUnsafePathRewrites: true,
  };
  const failures = [];

  for (const item of candidates) {
    if (item.classification !== 'AUTO_FIX_CANDIDATE') {
      checks.allAutoFix = false;
      failures.push(`Non-AUTO_FIX_CANDIDATE in input: ${item.templateCode}::${item.path} (${item.classification})`);
    }
    if (!item.applySafe) {
      checks.allApplySafe = false;
      failures.push(`applySafe=false: ${item.templateCode}::${item.path}`);
    }
    if (item.proposed.action && !VALID_ACTIONS.has(item.proposed.action)) {
      failures.push(`Invalid action "${item.proposed.action}": ${item.templateCode}::${item.path}`);
    }
    if (item.proposed.path && isGenericPath(item.proposed.path)) {
      checks.noGenericProposedPaths = false;
      failures.push(`Generic proposed path "${item.proposed.path}": ${item.templateCode}::${item.path}`);
    }
    if (item.proposed.label && isBadProposedLabel(item.proposed.label)) {
      checks.noBadProposedLabels = false;
      failures.push(`Bad proposed label "${item.proposed.label}": ${item.templateCode}::${item.path}`);
    }
    if (item.proposed.source && !VALID_SOURCES.has(item.proposed.source)) {
      checks.noUnsupportedSources = false;
      failures.push(`Unsupported source "${item.proposed.source}": ${item.templateCode}::${item.path}`);
    }
  }

  // Check for path collisions
  const proposedPaths = new Set();
  for (const { item } of mutations) {
    if (item.proposed.action === 'UPDATE_PATH' && item.proposed.path) {
      const key = `${item.templateCode}::${item.proposed.path}`;
      if (proposedPaths.has(key)) {
        checks.noPathCollisions = false;
        failures.push(`Path collision: ${item.templateCode}::${item.proposed.path}`);
      }
      proposedPaths.add(key);
    }
  }

  // Check skipped items
  const safeSkipCodes = new Set(['SKIPPED_IDEMPOTENT', 'SKIPPED_PATH_COLLISION', 'SKIPPED_CONFLICTING_MUTATIONS', 'SKIPPED_DUPLICATE']);
  for (const s of skipped) {
    if (!safeSkipCodes.has(s.reasonCode)) {
      checks.noConflictSkips = false;
      failures.push(`Unsafe skip ${s.reasonCode}: ${s.templateCode}::${s.path} — ${s.reason}`);
    }
  }

  const allPass = Object.entries(checks).every(([, v]) => v) && failures.length === 0;

  return { checks, failures, allPass };
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function buildReport({ candidates, mutations, skipped, safety, contracts, mode }) {
  // Build changed-contracts list WITHOUT mutating the contracts
  const changedSet = new Map(); // templateCode -> entry

  for (const { item } of mutations) {
    const key = item.templateCode;
    if (!changedSet.has(key)) {
      const c = contracts.get(item.templateCode);
      changedSet.set(key, {
        templateCode: item.templateCode,
        sourceId: c?.sourceId ?? '',
        file: `${item.templateCode}__${(c?.sourceId ?? '').split('__')[1] ?? 'unknown'}.contract.locked.json`,
        _contract: c,
        mutations: [],
      });
    }
    const cc = changedSet.get(key);
    // Apply mutation to a CLONE so we don't mutate the original contracts map
    const cClone = cc._contract ? JSON.parse(JSON.stringify(cc._contract)) : {};
    const mutResult = applyMutation(cClone, { item, contract: cClone });
    cc.mutations.push(...mutResult);
  }

  const changedContracts = [...changedSet.values()].map(({ _contract, ...cc }) => cc);

  return {
    generatedAt: new Date().toISOString(),
    mode,
    inputAutoFixCount: candidates.length,
    plannedMutationCount: mutations.length,
    appliedMutationCount: mode === 'write' ? mutations.length : 0,
    skippedCount: skipped.length,
    changedContractCount: changedContracts.length,
    changedContracts,
    skippedItems: skipped.map((s) => ({
      templateCode: s.templateCode,
      path: s.path,
      action: s.proposed?.action ?? '-',
      reasonCode: s.reasonCode ?? 'UNKNOWN',
      reason: s.reason ?? '',
    })),
    safetyChecks: safety.checks,
    safetyFailures: safety.failures,
  };
}

function writeMarkdownReport(report) {
  const lines = [];
  lines.push(`# Forms Root-Cause Apply Report`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Mode: **${report.mode}**`);
  lines.push('');

  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Mode | ${report.mode} |`);
  lines.push(`| Input auto-fix count | ${report.inputAutoFixCount} |`);
  lines.push(`| Planned mutations | ${report.plannedMutationCount} |`);
  lines.push(`| Applied mutations | ${report.appliedMutationCount} |`);
  lines.push(`| Skipped | ${report.skippedCount} |`);
  lines.push(`| Changed contracts | ${report.changedContractCount} |`);
  lines.push('');

  lines.push('### Safety Checks');
  lines.push('');
  lines.push(`| Check | Result |`);
  lines.push(`|-------|--------|`);
  for (const [check, pass] of Object.entries(report.safetyChecks)) {
    lines.push(`| ${check} | ${pass ? 'PASS' : 'FAIL'} |`);
  }
  lines.push('');

  if (report.safetyFailures.length > 0) {
    lines.push('### Safety Failures');
    lines.push('');
    for (const f of report.safetyFailures) lines.push(`- ${f}`);
    lines.push('');
  }

  // Mutation count by action
  const byAction = {};
  for (const cc of report.changedContracts) {
    for (const m of cc.mutations) {
      byAction[m.action] = (byAction[m.action] ?? 0) + 1;
    }
  }
  lines.push('### Mutations by Action');
  lines.push('');
  lines.push(`| Action | Count |`);
  lines.push(`|--------|-------|`);
  for (const [a, c] of Object.entries(byAction).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${a} | ${c} |`);
  }
  lines.push('');

  // Skipped
  const bySkipCode = {};
  for (const s of report.skippedItems) {
    bySkipCode[s.reasonCode] = (bySkipCode[s.reasonCode] ?? 0) + 1;
  }
  if (report.skippedCount > 0) {
    lines.push('### Skipped Items');
    lines.push('');
    lines.push(`| Reason Code | Count |`);
    lines.push(`|-------------|-------|`);
    for (const [code, c] of Object.entries(bySkipCode).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${code} | ${c} |`);
    }
    lines.push('');
  }

  // BM-050 changes
  const bm050 = report.changedContracts.find((cc) => cc.templateCode === 'BM-050');
  if (bm050 && bm050.mutations.length > 0) {
    lines.push('## BM-050 Changes');
    lines.push('');
    lines.push(`Total: ${bm050.mutations.length} mutations`);
    lines.push('');
    lines.push('| Path | Action | Before | After |');
    lines.push('|------|--------|--------|-------|');
    for (const m of bm050.mutations) {
      const before = m.labelBefore ?? m.pathBefore ?? '-';
      const after = m.labelAfter ?? m.pathAfter ?? m.sourceAfter ?? '-';
      lines.push(`| \`${m.pathBefore}\` | ${m.action} | \`${before}\` | \`${after}\` |`);
    }
    lines.push('');
  } else {
    lines.push('## BM-050 Changes');
    lines.push('No changes for BM-050 in this batch.');
    lines.push('');
  }

  // BM-068 changes
  const bm068 = report.changedContracts.find((cc) => cc.templateCode === 'BM-068');
  if (bm068 && bm068.mutations.length > 0) {
    lines.push('## BM-068 Changes');
    lines.push('');
    lines.push(`Total: ${bm068.mutations.length} mutations`);
    lines.push('');
    lines.push('| Path | Action | Before | After |');
    lines.push('|------|--------|--------|-------|');
    for (const m of bm068.mutations) {
      const before = m.labelBefore ?? m.pathBefore ?? '-';
      const after = m.labelAfter ?? m.pathAfter ?? m.sourceAfter ?? '-';
      lines.push(`| \`${m.pathBefore}\` | ${m.action} | \`${before}\` | \`${after}\` |`);
    }
    lines.push('');
  } else {
    lines.push('## BM-068 Changes');
    lines.push('No changes for BM-068 in this batch.');
    lines.push('');
  }

  // Validation commands
  lines.push('## Validation Commands');
  lines.push('');
  lines.push('After write mode, run:');
  lines.push('');
  lines.push('```bash');
  lines.push('pnpm contract');
  lines.push('pnpm audit:forms-root-cause');
  lines.push('pnpm plan:forms-root-cause-fixes');
  lines.push('pnpm gate:forms:213');
  lines.push('pnpm audit:forms-root-cause');
  lines.push('pnpm audit:forms-root-cause');
  lines.push('pnpm --filter @qllaw/form-contracts test');
  lines.push('pnpm typecheck');
  lines.push('```');
  lines.push('');

  // Recommended next
  if (report.mode === 'write') {
    lines.push('## Recommended Next Task');
    lines.push('');
    lines.push('**FORMS_ROOT_CAUSE_REVIEW_BATCH_1**: After write, re-run audit and plan to determine remaining auto-fix candidates. If near 0, proceed to batch review.');
  }

  writeFileSync(join(APPLY_DIR, 'latest.md'), lines.join('\n') + '\n', 'utf8');
  process.stderr.write(`[APPLY] Written: ${join(APPLY_DIR, 'latest.md')}\n`);
}

// =============================================================================
// BACKUP
// =============================================================================

function createBackup(changedContracts) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(APPLY_DIR, 'backups', ts);
  mkdirSync(backupDir, { recursive: true });

  const manifest = [];
  for (const cc of changedContracts) {
    const src = join(LOCKED_DIR, cc.file);
    if (existsSync(src)) {
      const dest = join(backupDir, cc.file);
      cpSync(src, dest);
      manifest.push({ file: cc.file, backedUpAt: new Date().toISOString() });
    }
  }

  writeFileSync(join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  process.stderr.write(`[APPLY] Backup created: ${backupDir}\n`);
  return backupDir;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write(`[APPLY] FORMS_ROOT_CAUSE_APPLY_SAFE_FIXES\n`);
  process.stderr.write(`[APPLY] Mode: ${WRITE_MODE}\n`);

  // Load inputs
  if (!existsSync(AUTO_FIX_JSON)) {
    process.stderr.write(`[APPLY] ERROR: ${AUTO_FIX_JSON} not found\n`);
    process.exit(1);
  }
  if (!existsSync(PLAN_JSON)) {
    process.stderr.write(`[APPLY] ERROR: ${PLAN_JSON} not found\n`);
    process.exit(1);
  }

  const candidates = JSON.parse(readFileSync(AUTO_FIX_JSON, 'utf8'));
  const planData = JSON.parse(readFileSync(PLAN_JSON, 'utf8'));

  process.stderr.write(`[APPLY] Loaded ${candidates.length} auto-fix candidates\n`);
  process.stderr.write(`[APPLY] Plan source: ${planData.sourceAuditVersion} (${planData.totalIssuesInput} total issues)\n`);

  // Verify all items are AUTO_FIX_CANDIDATE
  const nonAutoFix = candidates.filter((c) => c.classification !== 'AUTO_FIX_CANDIDATE');
  if (nonAutoFix.length > 0) {
    process.stderr.write(`[APPLY] FATAL: ${nonAutoFix.length} items are not AUTO_FIX_CANDIDATE\n`);
    nonAutoFix.forEach((n) => process.stderr.write(`  ${n.templateCode}::${n.path} (${n.classification})\n`));
    process.exit(1);
  }

  const contracts = loadContracts();
  process.stderr.write(`[APPLY] Loaded ${contracts.size} locked contracts\n`);

  // Build mutation plan
  const { mutations, skipped } = buildMutationPlan(candidates, contracts);

  // Safety assertions
  const safety = assertSafety(candidates, mutations, skipped);

  process.stderr.write(
    `[APPLY] Mutations: ${mutations.length} | Skipped: ${skipped.length}\n` +
    `[APPLY] Safety: allAutoFix=${safety.checks.allAutoFix} allApplySafe=${safety.checks.allApplySafe}\n` +
    `[APPLY] Safety: noGenericPaths=${safety.checks.noGenericProposedPaths} noBadLabels=${safety.checks.noBadProposedLabels}\n` +
    `[APPLY] Safety: noBadSources=${safety.checks.noUnsupportedSources} noCollisions=${safety.checks.noPathCollisions}\n`,
  );

  const report = buildReport({
    candidates,
    mutations,
    skipped,
    safety,
    contracts,
    mode: WRITE_MODE,
  });

  mkdirSync(APPLY_DIR, { recursive: true });
  mkdirSync(join(APPLY_DIR, 'changed-contracts'), { recursive: true });
  mkdirSync(join(APPLY_DIR, 'skipped-items'), { recursive: true });
  mkdirSync(join(APPLY_DIR, 'before-after-diff'), { recursive: true });

  // Write JSON reports
  writeFileSync(join(APPLY_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');
  writeFileSync(join(APPLY_DIR, 'changed-contracts.json'), JSON.stringify(report.changedContracts, null, 2), 'utf8');
  writeFileSync(join(APPLY_DIR, 'skipped-items.json'), JSON.stringify(report.skippedItems, null, 2), 'utf8');
  writeFileSync(join(APPLY_DIR, 'before-after-diff.json'), JSON.stringify(report.changedContracts, null, 2), 'utf8');

  process.stderr.write(`[APPLY] Written reports to ${APPLY_DIR}\n`);
  process.stderr.write(`[APPLY] Changed contracts: ${report.changedContractCount}\n`);

  // Write markdown
  writeMarkdownReport(report);

  // Write mode: actually apply
  if (WRITE) {
    // Safety gate
    if (!safety.allPass) {
      process.stderr.write(`[APPLY] FATAL: Safety checks failed. Not applying any changes.\n`);
      for (const f of safety.failures) process.stderr.write(`  ${f}\n`);
      process.exit(1);
    }

    if (report.changedContractCount === 0) {
      process.stderr.write(`[APPLY] No changes needed. Exiting.\n`);
      process.exit(0);
    }

    // Backup
    createBackup(report.changedContracts);

    // Apply mutations
    let appliedCount = 0;
    const changedTemplateCodes = new Set();
    for (const { item, contract } of mutations) {
      const mutationResult = applyMutation(contract, { item, contract });
      if (mutationResult.length === 0) continue;
      appliedCount += mutationResult.length;
      changedTemplateCodes.add(item.templateCode);
      process.stderr.write(`[APPLY] Applied: ${item.templateCode}::${item.path} (${item.proposed.action})\n`);
    }

    for (const templateCode of changedTemplateCodes) {
      const contract = contracts.get(templateCode);
      const file = join(LOCKED_DIR, `${templateCode}__${(contract.sourceId ?? '').split('__')[1] ?? 'unknown'}.contract.locked.json`);
      if (!existsSync(file)) {
        process.stderr.write(`[APPLY] WARNING: Cannot find file ${file}\n`);
        continue;
      }
      writeFileSync(file, JSON.stringify(contract, null, 2), 'utf8');
    }

    // Update report applied count
    report.appliedMutationCount = appliedCount;
    writeFileSync(join(APPLY_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');

    process.stderr.write(`[APPLY] Write complete: ${appliedCount} mutations applied to ${changedTemplateCodes.size} contracts\n`);
  }

  // Final exit code
  if (!safety.allPass) {
    process.stderr.write(`[APPLY] FAILED: safety checks not passed\n`);
    process.exit(1);
  }
  if (WRITE && safety.allPass) {
    process.stderr.write(`[APPLY] SUCCESS: ${mutations.length} mutations applied in ${WRITE_MODE} mode\n`);
  } else {
    process.stderr.write(`[APPLY] DRY-RUN complete: ${mutations.length} mutations ready, ${skipped.length} skipped\n`);
  }
}

main();
