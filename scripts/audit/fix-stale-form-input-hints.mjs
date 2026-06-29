#!/usr/bin/env node
/**
 * Fix BLK-008: Remove stale formInputHints.suggestedControls from locked contracts.
 * 
 * Stale hints reference generic document.fieldN paths that no longer exist
 * after semanticization. These are HIGH severity in the SOT rebase but safe
 * to auto-fix: removing them does not affect form functionality (suggestedControls
 * are UI hints only; selectOptions are preserved).
 * 
 * Run: node scripts/audit/fix-stale-form-input-hints.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCKED_DIR = join(__dirname, '..', '..', 'docs', 'audit', 'docx', 'contracts', 'locked');

// Generic path patterns that are stale (no longer in semanticized contracts)
const STALE_PATTERNS = [
  /^document\.field\d+$/,
  /^decision\.field\d+$/,
  /^person\.field\d+$/,
  /^agency\.field\d+$/,
  /^case\.field\d+$/,
  /^offense\.field\d+$/,
  /^signature\.field\d+$/,
  /^recipients\.field\d+$/,
  /^evidence\.field\d+$/,
  /^measure\.field\d+$/,
];

function isStalePath(path) {
  return STALE_PATTERNS.some(re => re.test(path));
}

function fixContract(contractPath) {
  const content = readFileSync(contractPath, 'utf8');
  let contract;
  try {
    contract = JSON.parse(content);
  } catch (e) {
    console.error(`  SKIP (parse error): ${contractPath}`);
    return { status: 'skip', reason: 'parse error' };
  }

  if (!contract.formInputHints?.suggestedControls?.length) {
    return { status: 'skip', reason: 'no hints' };
  }

  const originalCount = contract.formInputHints.suggestedControls.length;
  const staleControls = contract.formInputHints.suggestedControls.filter(
    ctrl => isStalePath(ctrl.path)
  );
  
  if (staleControls.length === 0) {
    return { status: 'skip', reason: 'no stale hints' };
  }

  // Remove stale controls
  const remainingControls = contract.formInputHints.suggestedControls.filter(
    ctrl => !isStalePath(ctrl.path)
  );

  // If all controls are stale, remove the entire formInputHints or keep empty
  if (remainingControls.length === 0) {
    delete contract.formInputHints;
  } else {
    contract.formInputHints.suggestedControls = remainingControls;
  }

  // Write back
  writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');
  
  return {
    status: 'fixed',
    originalCount,
    removedCount: staleControls.length,
    remainingCount: remainingControls.length,
    removedPaths: staleControls.map(c => c.path),
  };
}

function main() {
  console.log('=== FIX STALE FORM INPUT HINTS ===\n');
  
  const files = readdirSync(LOCKED_DIR).filter(f => f.endsWith('.contract.locked.json'));
  console.log(`Scanning ${files.length} locked contracts...\n`);

  let fixed = 0, skipped = 0, errors = 0;
  const report = [];

  for (const file of files) {
    const path = join(LOCKED_DIR, file);
    const result = fixContract(path);
    
    if (result.status === 'fixed') {
      fixed++;
      report.push({
        file,
        removed: result.removedCount,
        remaining: result.remainingCount,
        paths: result.removedPaths.slice(0, 5), // first 5 paths
      });
      process.stdout.write(`  FIXED: ${file} (-${result.removedCount} stale hints)\n`);
    } else if (result.status === 'skip') {
      skipped++;
    } else {
      errors++;
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Fixed: ${fixed} contracts`);
  console.log(`Skipped: ${skipped} contracts`);
  console.log(`Errors: ${errors} contracts`);

  const totalRemoved = report.reduce((sum, r) => sum + r.removed, 0);
  console.log(`Total stale hints removed: ${totalRemoved}`);

  // Write report
  const reportPath = join(__dirname, '..', '..', 'docs', 'audit', 'ready-absolute-blocker-burn-down-v3', 'stale-hints-fix.latest.json');
  import('fs').then(({ writeFileSync: ws }) => {
    ws(reportPath, JSON.stringify({ fixed, skipped, errors, totalRemoved, report }, null, 2), 'utf8');
    console.log(`\nReport: ${reportPath}`);
  });

  return { fixed, skipped, errors, totalRemoved };
}

main();
