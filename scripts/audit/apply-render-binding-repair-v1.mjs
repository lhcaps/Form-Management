#!/usr/bin/env node

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  applyRenderBindingRepair,
} from './lib/contract-render-binding-repair.mjs';

const TASK = 'APPLY_RENDER_BINDING_REPAIR_V1';
const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const REPORT_DIR = join(ROOT, 'docs', 'audit', 'docx-atlas-v1');

const REPAIRS = {
  'BM-001': {
    reason: 'BM-001 render gate missing reception and crime-report bindings.',
    add: [
      {
        slotId: 'reception.startedAtTimeText',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'reception.startedAtDay',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'reception.startedAtMonth',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'reception.startedAtYear',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'reception.locationName',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'crimeReport.content',
        field: { section: 'Nội dung nguồn tin', required: true },
      },
      {
        slotId: 'crimeReport.attachedItemsDescription',
        field: { section: 'Nội dung nguồn tin', required: false },
      },
      {
        slotId: 'reception.endedAtTimeText',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'reception.endedAtDay',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'reception.endedAtMonth',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
      {
        slotId: 'reception.endedAtYear',
        field: { section: 'Tiếp nhận nguồn tin', required: true },
      },
    ],
  },
  'BM-002': {
    reason: 'BM-002 render gate missing source-transfer attachment binding.',
    add: [
      {
        slotId: 'sourceTransfer.attachedItemsDescription',
        field: { section: 'Chuyển nguồn tin', required: false },
      },
    ],
  },
  'BM-064': {
    reason: 'BM-064 DOCX uses suffixed issueDate4 slot.',
    add: [
      {
        slotId: 'document.issueDate4',
        from: 'document.issueDate',
        field: { section: 'Thông tin văn bản', required: false },
      },
    ],
  },
  'BM-073': {
    reason: 'BM-073 contract only had agency.name; DOCX requires document/person fields.',
    add: [
      {
        slotId: 'document.fullDocumentCode',
        field: { section: 'Thông tin văn bản', required: false },
      },
      {
        slotId: 'document.issueDate',
        field: { section: 'Thông tin văn bản', required: false },
      },
      {
        slotId: 'person.dateOfBirth',
        field: { section: 'Thông tin cá nhân', required: false },
      },
      {
        slotId: 'person.idNumber',
        field: { section: 'Thông tin cá nhân', required: false },
      },
    ],
  },
  'BM-080': {
    reason: 'BM-080 DOCX uses person.personFullName; bind it from canonical person.fullName.',
    add: [
      {
        slotId: 'person.personFullName',
        from: 'person.fullName',
        field: { section: 'Thông tin cá nhân', required: false },
      },
    ],
  },
  'BM-167': {
    reason: 'BM-167 DOCX uses suffixed fullDocumentCode2 slot.',
    add: [
      {
        slotId: 'document.fullDocumentCode2',
        from: 'document.fullDocumentCode',
        field: { section: 'Thông tin văn bản', required: false },
      },
    ],
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

function markdown(report) {
  const lines = [
    '# Render Binding Repair V1',
    '',
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.write ? 'write' : 'dry-run'}`,
    `Changed templates: ${report.summary.changedTemplates}`,
    '',
    '| Template | Fields + | Slots + | Bindings + | Slots - | Bindings - | Fields - |',
    '|---|---:|---:|---:|---:|---:|---:|',
  ];
  for (const item of report.items) {
    lines.push(
      `| ${item.templateCode} | ${item.changes.addedFields.length} | ${item.changes.addedSlots.length} | ${item.changes.addedBindings.length} | ${item.changes.removedSlots.length} | ${item.changes.removedBindings.length} | ${item.changes.removedFields.length} |`,
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
    'render-binding-repair-v1',
    'backups',
    generatedAt.replace(/[:.]/g, '-'),
  );
  const items = [];

  for (const [templateCode, repair] of Object.entries(REPAIRS)) {
    const lockedPath = findLockedContractFile(templateCode);
    const original = readJson(lockedPath);
    const { contract, changes } = applyRenderBindingRepair(original, repair, {
      meta: {
        reviewedAt: generatedAt,
      },
    });
    const changed =
      JSON.stringify(original.canonicalFields) !== JSON.stringify(contract.canonicalFields) ||
      JSON.stringify(original.docxSlots) !== JSON.stringify(contract.docxSlots) ||
      JSON.stringify(original.renderBindings) !== JSON.stringify(contract.renderBindings) ||
      JSON.stringify(original.rejectedCandidates ?? []) !== JSON.stringify(contract.rejectedCandidates ?? []);

    if (args.write && changed) {
      mkdirSync(backupDir, { recursive: true });
      writeFileSync(join(backupDir, basename(lockedPath)), `${JSON.stringify(original, null, 2)}\n`, 'utf8');
      writeJson(lockedPath, contract);
    }

    items.push({
      templateCode,
      lockedPath,
      changed,
      reason: repair.reason,
      changes,
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
      changedTemplates: items.filter((item) => item.changed).length,
      addedFields: items.reduce((sum, item) => sum + item.changes.addedFields.length, 0),
      addedSlots: items.reduce((sum, item) => sum + item.changes.addedSlots.length, 0),
      addedBindings: items.reduce((sum, item) => sum + item.changes.addedBindings.length, 0),
      removedSlots: items.reduce((sum, item) => sum + item.changes.removedSlots.length, 0),
      removedBindings: items.reduce((sum, item) => sum + item.changes.removedBindings.length, 0),
      removedFields: items.reduce((sum, item) => sum + item.changes.removedFields.length, 0),
    },
    items,
  };

  writeJson(join(REPORT_DIR, 'render-binding-repair-v1.latest.json'), report);
  writeFileSync(join(REPORT_DIR, 'render-binding-repair-v1.latest.md'), markdown(report), 'utf8');
  console.log(JSON.stringify(report.summary, null, 2));
  if (!args.write) {
    console.log('Dry run only. Re-run with --write to apply locked-contract repairs.');
  }
}

run();
