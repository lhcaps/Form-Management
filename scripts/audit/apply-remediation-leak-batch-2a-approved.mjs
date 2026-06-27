#!/usr/bin/env node
/**
 * apply-remediation-leak-batch-2a-approved.mjs
 *
 * Apply runner for REMEDIATION_LEAK Batch 2A: DEFERRED_BAD_CANONICAL_LABEL
 *
 * Actions:
 * - UPDATE_CANONICAL_THEN_SLOT: Update canonicalFields[].label, then docxSlots[].label
 * - UPDATE_SLOT_LABEL_TO_CANONICAL: Update only docxSlots[].label (canonical is already clean)
 *
 * Safety assertions:
 * - No path mutation
 * - No source mutation
 * - No renderBindings mutation
 * - No required/reviewRequired mutation
 * - No rawPattern/evidence/context mutation
 *
 * Usage:
 *   node scripts/audit/apply-remediation-leak-batch-2a-approved.mjs          # dry-run
 *   node scripts/audit/apply-remediation-leak-batch-2a-approved.mjs --write    # apply
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

const WRITE_MODE = process.argv.includes('--write');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'remediation-leak-batch-2a');
const BACKUP_DIR = join(OUT_DIR, 'backups');

function log(msg) {
  console.log(`[apply${WRITE_MODE ? '*' : ''}:2a] ${msg}`);
}

// Bad label patterns that should fail the mutation
const BAD_LABEL_PATTERNS = [
  /^$/, /^Ô trống$/, /Slot from/i, /remediation/i, /TODO/i, /unknown/i, /^field\d+$/i,
];

function isBadLabel(label) {
  if (!label) return true;
  return BAD_LABEL_PATTERNS.some(re => re.test(label));
}

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function findLockedContract(templateCode) {
  try {
    const files = readdirSync(LOCKED_DIR);
    for (const f of files) {
      if (f.startsWith(`${templateCode}__`) && f.endsWith('.contract.locked.json')) {
        return { path: join(LOCKED_DIR, f), filename: f };
      }
    }
  } catch (e) {
    log(`ERROR: Cannot read locked dir: ${e.message}`);
  }
  return null;
}

function findCanonicalField(contract, path) {
  return contract?.canonicalFields?.find(f => f.path === path) ?? null;
}

function assertCanonicalLabelBefore(contract, path, expectedLabel) {
  const cf = findCanonicalField(contract, path);
  if (!cf) {
    throw new Error(`Canonical field not found: ${path}`);
  }
  if (cf.label !== expectedLabel) {
    throw new Error(
      `Canonical label mismatch for ${path}: expected "${expectedLabel}", got "${cf.label}"`
    );
  }
}

function assertSlotLabelBefore(contract, slotId, expectedLabel) {
  const slot = contract.docxSlots?.find(s => s.slotId === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }
  if (slot.label !== expectedLabel) {
    throw new Error(
      `Slot label mismatch for ${slotId}: expected "${expectedLabel}", got "${slot.label}"`
    );
  }
}

function assertLabelAfterClean(labelAfter) {
  if (isBadLabel(labelAfter)) {
    throw new Error(`labelAfter "${labelAfter}" still contains bad pattern`);
  }
}

function run() {
  if (!WRITE_MODE) {
    log('DRY-RUN mode (use --write to apply)');
  } else {
    log('WRITE mode - applying mutations!');
  }

  // Load decisions
  const decisionsPath = join(OUT_DIR, 'decisions.approved.json');
  if (!existsSync(decisionsPath)) {
    log(`ERROR: Decisions file not found: ${decisionsPath}`);
    process.exit(1);
  }

  const decisions = readJSON(decisionsPath);
  const approved = decisions.decisions?.filter(d => d.decision === 'APPROVED') ?? [];

  if (approved.length === 0) {
    log('No approved decisions found.');
    process.exit(1);
  }

  log(`Found ${approved.length} approved decision(s)`);

  // Deduplicate
  const seen = new Set();
  const unique = approved.filter(d => {
    const key = `${d.templateCode}__${d.path}__${d.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = [];
  const errors = [];
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Process each decision
  for (const decision of unique) {
    const { templateCode, path, slotId, action, canonicalLabelBefore, canonicalLabelAfter, slotLabelBefore, slotLabelAfter } = decision;

    const findResult = findLockedContract(templateCode);
    if (!findResult) {
      errors.push({ templateCode, path, error: 'Locked contract not found' });
      continue;
    }

    const { path: contractPath, filename } = findResult;

    try {
      const contract = readJSON(contractPath);

      if (action === 'UPDATE_CANONICAL_THEN_SLOT') {
        // Step 1: Update canonical field label
        assertCanonicalLabelBefore(contract, path, canonicalLabelBefore);
        assertLabelAfterClean(canonicalLabelAfter);

        const cf = findCanonicalField(contract, path);
        if (!cf) throw new Error(`Canonical field not found: ${path}`);

        const beforeCF = { ...cf };

        if (WRITE_MODE) {
          cf.label = canonicalLabelAfter;
        }

        // Step 2: Update slot label
        assertSlotLabelBefore(contract, slotId, slotLabelBefore);

        const slot = contract.docxSlots?.find(s => s.slotId === slotId);
        if (!slot) throw new Error(`Slot not found: ${slotId}`);

        const beforeSlot = { ...slot };

        if (WRITE_MODE) {
          slot.label = slotLabelAfter;
          writeJSON(contractPath, contract);
        }

        results.push({
          templateCode,
          path,
          slotId,
          action,
          canonicalLabelBefore,
          canonicalLabelAfter,
          slotLabelBefore,
          slotLabelAfter,
          contractFile: filename,
          status: WRITE_MODE ? 'APPLIED' : 'DRY-RUN',
        });

        log(`  ${WRITE_MODE ? '*' : ' '} ${templateCode}/${path}: canonical "${canonicalLabelBefore}" -> "${canonicalLabelAfter}", slot "${slotLabelBefore}" -> "${slotLabelAfter}"`);

      } else if (action === 'UPDATE_SLOT_LABEL') {
        // Only update slot label
        assertSlotLabelBefore(contract, slotId, slotLabelBefore);
        assertLabelAfterClean(slotLabelAfter);

        const slot = contract.docxSlots?.find(s => s.slotId === slotId);
        if (!slot) throw new Error(`Slot not found: ${slotId}`);

        if (WRITE_MODE) {
          slot.label = slotLabelAfter;
          writeJSON(contractPath, contract);
        }

        results.push({
          templateCode,
          path,
          slotId,
          action,
          canonicalLabelBefore,
          canonicalLabelAfter: canonicalLabelAfter,
          slotLabelBefore,
          slotLabelAfter,
          contractFile: filename,
          status: WRITE_MODE ? 'APPLIED' : 'DRY-RUN',
        });

        log(`  ${WRITE_MODE ? '*' : ' '} ${templateCode}/${slotId}: slot "${slotLabelBefore}" -> "${slotLabelAfter}"`);
      } else {
        errors.push({ templateCode, path, error: `Unknown action: ${action}` });
        log(`  X ${templateCode}/${path}: Unknown action: ${action}`);
      }
    } catch (e) {
      errors.push({ templateCode, path, error: e.message });
      log(`  X ${templateCode}/${path}: ERROR - ${e.message}`);
    }
  }

  // Write backup
  if (WRITE_MODE && results.length > 0) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backupPath = join(BACKUP_DIR, backupTimestamp);
    mkdirSync(backupPath, { recursive: true });

    for (const r of results) {
      const src = findLockedContract(r.templateCode)?.path;
      if (src) {
        copyFileSync(src, join(backupPath, `${r.templateCode}.contract.locked.json`));
      }
    }
    log(`Backup: ${backupPath}`);
  }

  // Write apply report
  const applyReport = {
    applyVersion: '2a.0.0',
    timestamp: new Date().toISOString(),
    mode: WRITE_MODE ? 'WRITE' : 'DRY-RUN',
    summary: {
      total: unique.length,
      applied: results.length,
      errors: errors.length,
    },
    results,
    errors,
  };

  writeJSON(join(OUT_DIR, 'apply.latest.json'), applyReport);

  // Generate markdown report
  const md = [
    '# REMEDIATION_LEAK Batch 2A - Apply Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${WRITE_MODE ? 'WRITE' : 'DRY-RUN'}`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Total Decisions | ${unique.length} |`,
    `| Applied/Dry-run | ${results.length} |`,
    `| Errors | ${errors.length} |`,
    '',
    '## Results',
    '',
    '| BM | Path | Action | Canonical | Slot | Status |',
    '|---|------|--------|----------|------|--------|',
  ];

  for (const r of results) {
    md.push(`| ${r.templateCode} | ${r.path} | ${r.action} | "${r.canonicalLabelBefore}" -> "${r.canonicalLabelAfter}" | "${r.slotLabelBefore}" -> "${r.slotLabelAfter}" | ${r.status} |`);
  }

  if (errors.length > 0) {
    md.push('');
    md.push('## Errors');
    md.push('');
    for (const e of errors) {
      md.push(`- **${e.templateCode}/${e.path}**: ${e.error}`);
    }
  }

  writeFileSync(join(OUT_DIR, 'apply.latest.md'), md.join('\n'), 'utf-8');

  if (errors.length > 0) {
    process.exit(1);
  }

  log('Done.');
}

run();
