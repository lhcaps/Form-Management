#!/usr/bin/env node

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path';
import {
  repairStrayClosingBraceRunsInDocxBuffer,
} from './lib/ooxml-stray-brace-repair.mjs';

const TASK = 'APPLY_OOXML_STRAY_BRACE_REPAIR_V1';
const ROOT = resolve(process.cwd());
const REPORT_DIR = join(ROOT, 'docs', 'audit', 'docx-atlas-v1');
const TARGETS = ['BM-031', 'BM-044', 'BM-056'];

function parseArgs(argv) {
  return {
    write: argv.includes('--write'),
  };
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

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function markdown(report) {
  const lines = [
    '# OOXML Stray Brace Repair V1',
    '',
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.write ? 'write' : 'dry-run'}`,
    '',
    '| Template | Changed | Removed runs | Parts |',
    '|---|---:|---:|---|',
  ];
  for (const item of report.items) {
    lines.push(
      `| ${item.templateCode} | ${item.changed ? 'yes' : 'no'} | ${item.removedRuns} | ${item.changes.map((change) => change.fileName).join(', ') || 'none'} |`,
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
    'ooxml-stray-brace-repair-v1',
    'backups',
    generatedAt.replace(/[:.]/g, '-'),
  );
  const items = [];

  for (const templateCode of TARGETS) {
    const filePath = normalizedDocxPath(templateCode);
    const originalBuffer = readFileSync(filePath);
    const repaired = repairStrayClosingBraceRunsInDocxBuffer(originalBuffer);
    const removedRuns = repaired.changes.reduce((sum, change) => sum + change.removedRuns, 0);
    const changed = removedRuns > 0;

    if (args.write && changed) {
      mkdirSync(backupDir, { recursive: true });
      writeFileSync(join(backupDir, basename(filePath)), originalBuffer);
      writeFileSync(filePath, repaired.buffer);
    }

    items.push({
      templateCode,
      filePath,
      changed,
      removedRuns,
      changes: repaired.changes,
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
      removedRuns: items.reduce((sum, item) => sum + item.removedRuns, 0),
    },
    items,
  };

  writeJson(join(REPORT_DIR, 'ooxml-stray-brace-repair-v1.latest.json'), report);
  writeFileSync(join(REPORT_DIR, 'ooxml-stray-brace-repair-v1.latest.md'), markdown(report), 'utf8');
  console.log(JSON.stringify(report.summary, null, 2));
  if (!args.write) {
    console.log('Dry run only. Re-run with --write to repair normalized DOCX files.');
  }
}

run();
