#!/usr/bin/env node

import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path';
import {
  applyRenderBindingRepair,
} from './lib/contract-render-binding-repair.mjs';
import {
  repairRunPropertyPlaceholdersInDocxBuffer,
} from './lib/ooxml-stray-brace-repair.mjs';

const TASK = 'APPLY_CONTRACT_STRUCTURAL_CLEANUP_V1';
const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const REPORT_DIR = join(ROOT, 'docs', 'audit', 'docx-atlas-v1');

const CONTRACT_REPAIRS = {
  'BM-021': {
    reason: 'Remove hidden run-property agency.nameUpper placeholder and matching invisible contract slot.',
    removeSlotIds: ['agency.nameUpper'],
    removeFieldIfUnbound: ['agency.nameUpper'],
    clearReviewRequired: [],
  },
  'BM-065': {
    reason: 'Remove orphan slots no longer present in DOCX and clear reviewed visible slots.',
    removeSlotIds: ['decision.decisionLine', 'document.fullDocumentCode'],
    removeFieldIfUnbound: ['decision.decisionLine', 'document.fullDocumentCode'],
    clearReviewRequired: ['document.fullDocumentCode8', 'recipients.personLine3'],
  },
  'BM-067': {
    reason: 'Remove orphan document code slots no longer present in DOCX and clear reviewed visible slots.',
    removeSlotIds: ['document.fullDocumentCode', 'document.fullDocumentCode2'],
    removeFieldIfUnbound: ['document.fullDocumentCode', 'document.fullDocumentCode2'],
    clearReviewRequired: ['document.fullDocumentCode6', 'recipients.personLine3'],
  },
};

const DOCX_REPAIRS = {
  'BM-021': {
    runPropertyPlaceholders: ['agency.nameUpper'],
  },
};

function parseArgs(argv) {
  return {
    write: argv.includes('--write'),
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function findLockedContractFile(templateCode) {
  const matches = readdirSync(LOCKED_DIR)
    .filter((file) => file.startsWith(`${templateCode}__`) && file.endsWith('.contract.locked.json'))
    .sort();
  if (matches.length !== 1) {
    throw new Error(`Expected one locked contract for ${templateCode}, found ${matches.length}`);
  }
  return join(LOCKED_DIR, matches[0]);
}

function normalizedDocxPath(templateCode) {
  return join(
    ROOT,
    'storage',
    'templates',
    'normalized-docx',
    templateCode,
    `${templateCode}_normalized.docx`,
  );
}

function clearReviewRequired(contract, slotIds, changes) {
  const targets = new Set(slotIds);
  for (const slot of contract.docxSlots ?? []) {
    if (!targets.has(slot.slotId) || slot.reviewRequired !== true) continue;
    slot.reviewRequired = false;
    changes.clearedSlotReviewRequired.push(slot.slotId);
  }
  for (const binding of contract.renderBindings ?? []) {
    if (!targets.has(binding.slotId) || binding.reviewRequired !== true) continue;
    binding.reviewRequired = false;
    changes.clearedBindingReviewRequired.push(binding.slotId);
  }
  for (const field of contract.canonicalFields ?? []) {
    if (!targets.has(field.path) || field.reviewRequired !== true) continue;
    field.reviewRequired = false;
    changes.clearedFieldReviewRequired.push(field.path);
  }
}

function markdown(report) {
  const lines = [
    '# Contract Structural Cleanup V1',
    '',
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.write ? 'write' : 'dry-run'}`,
    '',
    '| Template | Contract changed | DOCX changed | Slots - | Bindings - | Fields - | Review cleared |',
    '|---|---:|---:|---:|---:|---:|---:|',
  ];
  for (const item of report.items) {
    const reviewCleared =
      item.contractChanges.clearedSlotReviewRequired.length +
      item.contractChanges.clearedBindingReviewRequired.length +
      item.contractChanges.clearedFieldReviewRequired.length;
    lines.push(
      `| ${item.templateCode} | ${item.contractChanged ? 'yes' : 'no'} | ${item.docxChanged ? 'yes' : 'no'} | ${item.contractChanges.removedSlots.length} | ${item.contractChanges.removedBindings.length} | ${item.contractChanges.removedFields.length} | ${reviewCleared} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const backupDir = join(
    REPORT_DIR,
    'contract-structural-cleanup-v1',
    'backups',
    generatedAt.replace(/[:.]/g, '-'),
  );
  const items = [];

  for (const [templateCode, repair] of Object.entries(CONTRACT_REPAIRS)) {
    const lockedPath = findLockedContractFile(templateCode);
    const originalContract = readJson(lockedPath);
    const repaired = applyRenderBindingRepair(originalContract, repair, {
      meta: { reviewedAt: generatedAt },
    });
    const contract = repaired.contract;
    const contractChanges = {
      ...repaired.changes,
      clearedSlotReviewRequired: [],
      clearedBindingReviewRequired: [],
      clearedFieldReviewRequired: [],
    };
    clearReviewRequired(contract, repair.clearReviewRequired ?? [], contractChanges);

    const contractChanged = JSON.stringify(originalContract) !== JSON.stringify(contract);

    let docxChanged = false;
    let docxChanges = [];
    const docxRepair = DOCX_REPAIRS[templateCode];
    let originalDocxBuffer = null;
    let repairedDocxBuffer = null;
    if (docxRepair) {
      const filePath = normalizedDocxPath(templateCode);
      originalDocxBuffer = readFileSync(filePath);
      const docxResult = repairRunPropertyPlaceholdersInDocxBuffer(
        originalDocxBuffer,
        docxRepair.runPropertyPlaceholders ?? [],
      );
      docxChanges = docxResult.changes;
      repairedDocxBuffer = docxResult.buffer;
      docxChanged = docxChanges.length > 0;
    }

    if (args.write && (contractChanged || docxChanged)) {
      mkdirSync(backupDir, { recursive: true });
      if (contractChanged) {
        writeFileSync(
          join(backupDir, basename(lockedPath)),
          `${JSON.stringify(originalContract, null, 2)}\n`,
          'utf8',
        );
        writeJson(lockedPath, contract);
      }
      if (docxChanged) {
        const filePath = normalizedDocxPath(templateCode);
        writeFileSync(join(backupDir, basename(filePath)), originalDocxBuffer);
        writeFileSync(filePath, repairedDocxBuffer);
      }
    }

    items.push({
      templateCode,
      lockedPath,
      contractChanged,
      docxChanged,
      reason: repair.reason,
      contractChanges,
      docxChanges,
    });
  }

  const report = {
    schemaVersion: 1,
    task: TASK,
    generatedAt,
    write: args.write,
    backupDir: args.write ? backupDir : null,
    summary: {
      totalTemplates: items.length,
      changedContracts: items.filter((item) => item.contractChanged).length,
      changedDocx: items.filter((item) => item.docxChanged).length,
      removedSlots: items.reduce((sum, item) => sum + item.contractChanges.removedSlots.length, 0),
      removedBindings: items.reduce((sum, item) => sum + item.contractChanges.removedBindings.length, 0),
      removedFields: items.reduce((sum, item) => sum + item.contractChanges.removedFields.length, 0),
    },
    items,
  };

  writeJson(join(REPORT_DIR, 'contract-structural-cleanup-v1.latest.json'), report);
  writeFileSync(join(REPORT_DIR, 'contract-structural-cleanup-v1.latest.md'), markdown(report), 'utf8');
  console.log(JSON.stringify(report.summary, null, 2));
  if (!args.write) {
    console.log('Dry run only. Re-run with --write to apply structural cleanup.');
  }
}

run();
