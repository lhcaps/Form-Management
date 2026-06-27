#!/usr/bin/env node
/**
 * apply-remediation-leak-batch-1-approved.mjs
 *
 * Apply runner for REMEDIATION_LEAK_BATCH_1_SAFE_SLOT_LABEL_CLEANUP.
 *
 * Only mutates docxSlots[].label. Does NOT mutate:
 * - canonicalFields
 * - renderBindings
 * - paths
 * - source
 * - required
 * - reviewRequired
 * - context
 * - evidence
 * - rawPattern
 * - compiled artifacts
 * - DB
 *
 * Usage:
 *   node scripts/audit/apply-remediation-leak-batch-1-approved.mjs          # dry-run
 *   node scripts/audit/apply-remediation-leak-batch-1-approved.mjs --write    # apply
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
const OUT_DIR = join(ROOT, 'docs', 'audit', 'remediation-leak-batch-1');
const BACKUP_DIR = join(OUT_DIR, 'backups');

const WRITE_MODE = process.argv.includes('--write');

function log(msg) {
  console.log(`[apply${WRITE_MODE ? '*' : ''}] ${msg}`);
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
  if (!contract?.canonicalFields) return null;
  return contract.canonicalFields.find(f => f.path === path) ?? null;
}

function assertSlotExists(contract, slotId) {
  const slot = contract.docxSlots?.find(s => s.slotId === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }
  return slot;
}

function assertLabelMatches(contract, slotId, expectedLabel) {
  const slot = contract.docxSlots?.find(s => s.slotId === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }
  if (slot.label !== expectedLabel) {
    throw new Error(
      `Label mismatch for ${slotId}: expected "${expectedLabel}", got "${slot.label}"`
    );
  }
}

function assertCanonicalFieldOk(contract, canonicalPath, labelAfter) {
  const field = findCanonicalField(contract, canonicalPath);
  if (!field) {
    throw new Error(`Canonical field not found: ${canonicalPath}`);
  }
  if (field.label !== labelAfter) {
    throw new Error(
      `Canonical field label mismatch: expected "${labelAfter}", got "${field.label}"`
    );
  }
}

function applyMutation(contract, slotId, labelAfter) {
  const slot = contract.docxSlots?.find(s => s.slotId === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }
  slot.label = labelAfter;
  return contract;
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
  const approved = decisions.decisions?.filter(d => d.decision === 'APPROVED_UPDATE_SLOT_LABEL') ?? [];

  if (approved.length === 0) {
    log('No approved decisions found. Edit decisions.approved.json first.');
    process.exit(1);
  }

  log(`Found ${approved.length} approved decision(s)`);

  // Deduplicate
  const seen = new Set();
  const unique = approved.filter(d => {
    const key = `${d.templateCode}__${d.slotId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length !== approved.length) {
    log(`WARNING: ${approved.length - unique.length} duplicate(s) removed`);
  }

  const results = [];
  const errors = [];
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Process each decision
  for (const decision of unique) {
    const { templateCode, slotId, action } = decision;

    if (action !== 'UPDATE_SLOT_LABEL') {
      errors.push({ templateCode, slotId, error: `Unsupported action: ${action}` });
      continue;
    }

    const findResult = findLockedContract(templateCode);
    if (!findResult) {
      errors.push({ templateCode, slotId, error: 'Locked contract not found' });
      continue;
    }

    const { path: contractPath, filename } = findResult;

    try {
      // Read contract
      const contract = readJSON(contractPath);

      // Get expected label from decision or reconstruct from plan
      const planPath = join(OUT_DIR, 'plan.latest.json');
      let labelAfter = decision.labelAfter;
      let labelBefore = decision.labelBefore;

      if (!labelAfter && existsSync(planPath)) {
        const plan = readJSON(planPath);
        const candidate = plan.allCandidates?.find(
          c => c.templateCode === templateCode && c.slotId === slotId
        );
        if (candidate) {
          labelAfter = candidate.labelAfter;
          labelBefore = candidate.labelBefore;
        }
      }

      if (!labelAfter || !labelBefore) {
        errors.push({ templateCode, slotId, error: 'Missing labelAfter/labelBefore in decision' });
        continue;
      }

      // Assertions
      assertSlotExists(contract, slotId);
      assertLabelMatches(contract, slotId, labelBefore);
      assertCanonicalFieldOk(contract, slotId, labelAfter);

      // Mutation
      let beforeSnapshot = null;
      if (WRITE_MODE) {
        beforeSnapshot = { ...contract.docxSlots?.find(s => s.slotId === slotId) };
        const mutated = applyMutation(contract, slotId, labelAfter);
        writeJSON(contractPath, mutated);
      }

      results.push({
        templateCode,
        slotId,
        labelBefore,
        labelAfter,
        contractPath: filename,
        status: WRITE_MODE ? 'APPLIED' : 'DRY-RUN',
        beforeSnapshot,
      });

      log(`  ${WRITE_MODE ? '*' : ' '} ${templateCode}/${slotId}: "${labelBefore}" -> "${labelAfter}"`);
    } catch (e) {
      errors.push({ templateCode, slotId, error: e.message });
      log(`  X ${templateCode}/${slotId}: ERROR - ${e.message}`);
    }
  }

  // Write backup if in write mode
  if (WRITE_MODE && results.length > 0) {
    const backupPath = join(BACKUP_DIR, backupTimestamp);
    mkdirSync(backupPath, { recursive: true });
    for (const r of results) {
      const src = findLockedContract(r.templateCode)?.path;
      if (src) {
        copyFileSync(src, join(backupPath, `${r.templateCode}.contract.locked.json`));
      }
    }
    log(`Backup written to: ${backupPath}`);
  }

  // Write apply report
  const applyReport = {
    applyVersion: '1.0.0',
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
    '# REMEDIATION_LEAK Batch 1 - Apply Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${WRITE_MODE ? 'WRITE' : 'DRY-RUN'}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Decisions | ${unique.length} |`,
    `| Applied/Dry-run | ${results.length} |`,
    `| Errors | ${errors.length} |`,
    '',
    '## Results',
    '',
  ];

  if (results.length === 0) {
    md.push('*No mutations applied.*');
  } else {
    md.push('| Template | Slot | Before | After | Status |');
    md.push('|----------|------|--------|-------|--------|');
    for (const r of results) {
      md.push(`| ${r.templateCode} | ${r.slotId} | ${r.labelBefore} | ${r.labelAfter} | ${r.status} |`);
    }
  }

  if (errors.length > 0) {
    md.push('');
    md.push('## Errors');
    md.push('');
    for (const e of errors) {
      md.push(`- **${e.templateCode}/${e.slotId}**: ${e.error}`);
    }
  }

  writeFileSync(join(OUT_DIR, 'apply.latest.md'), md.join('\n'), 'utf-8');
  log(`Report written to: ${join(OUT_DIR, 'apply.latest.md')}`);

  // Exit code
  if (errors.length > 0) {
    process.exit(1);
  }

  log('Done.');
}

run();
