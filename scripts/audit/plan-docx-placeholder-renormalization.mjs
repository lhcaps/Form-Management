#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { extractDocxPlaceholdersFromFile } from './lib/docx-placeholder-risks.mjs';

const ROOT = process.cwd();
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DOCX_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization');
const OUT_JSON = join(OUT_DIR, 'plan.latest.json');
const OUT_MD = join(OUT_DIR, 'plan.latest.md');

function codeNumber(code) {
  return Number(/^BM-(\d{3})$/.exec(code)?.[1] ?? 0);
}

function canonicalCodes() {
  return Array.from({ length: 213 }, (_, index) =>
    `BM-${String(index + 1).padStart(3, '0')}`,
  );
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

function markdownTable(rows) {
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  const separator = header.map(() => '---');
  return [header, separator, ...body]
    .map(
      (cells) =>
        `| ${cells.map((cell) => String(cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |`,
    )
    .join('\n');
}

function normalizedDocxPath(templateCode) {
  return join(
    NORMALIZED_DOCX_DIR,
    templateCode,
    `${templateCode}_normalized.docx`,
  );
}

function findLockedContract(templateCode) {
  if (!existsSync(LOCKED_DIR)) return null;
  const matches = readdirSync(LOCKED_DIR)
    .filter(
      (file) =>
        file.startsWith(`${templateCode}__`) &&
        file.endsWith('.contract.locked.json'),
    )
    .sort();
  if (matches.length !== 1) return null;
  const file = join(LOCKED_DIR, matches[0]);
  const contract = readJson(file);
  return {
    file,
    sourceId: contract.sourceId ?? basename(file, '.json'),
    title:
      contract.templateTitle ??
      contract.docx?.title ??
      contract.title ??
      templateCode,
    fieldCount: contract.canonicalFields?.length ?? 0,
    slotCount: contract.docxSlots?.length ?? 0,
    bindingCount: contract.renderBindings?.length ?? 0,
  };
}

function buildRows() {
  return canonicalCodes().map((templateCode) => {
    const contract = findLockedContract(templateCode);
    const docx = extractDocxPlaceholdersFromFile(normalizedDocxPath(templateCode));
    const duplicateSemantic = docx.placeholders.risks.duplicateSemantic;

    return {
      templateCode,
      title: contract?.title ?? templateCode,
      sourceId: contract?.sourceId ?? null,
      normalizedPath: docx.normalizedPath,
      normalizedExists: docx.exists,
      normalizedError: docx.error,
      placeholderTotal: docx.placeholders.total,
      placeholderUnique: docx.placeholders.unique.length,
      duplicatePlaceholderCount: docx.placeholders.duplicates.length,
      duplicateSemanticRiskCount: duplicateSemantic.length,
      duplicateSemanticRisks: duplicateSemantic.map((risk) => ({
        placeholder: risk.placeholder,
        count: risk.count,
        severity: risk.severity,
        anchors: risk.anchors,
        occurrenceContexts: risk.occurrenceContexts,
        reason: risk.reason,
      })),
      contract: contract
        ? {
            fieldCount: contract.fieldCount,
            slotCount: contract.slotCount,
            bindingCount: contract.bindingCount,
          }
        : null,
    };
  });
}

function buildPlan() {
  const rows = buildRows();
  const riskyRows = rows.filter((row) => row.duplicateSemanticRiskCount > 0);
  const risks = riskyRows.flatMap((row) =>
    row.duplicateSemanticRisks.map((risk) => ({
      templateCode: row.templateCode,
      title: row.title,
      ...risk,
    })),
  );

  return {
    schemaVersion: 1,
    mode: 'DOCX_PLACEHOLDER_RENORMALIZATION_INVENTORY',
    scope: 'BM-001..BM-213',
    generatedBy: 'scripts/audit/plan-docx-placeholder-renormalization.mjs',
    source: 'storage/templates/normalized-docx/<BM>/<BM>_normalized.docx',
    summary: {
      totalRows: rows.length,
      rowsWithDuplicateSemanticRisks: riskyRows.length,
      duplicateSemanticRiskCount: risks.length,
      topRows: riskyRows
        .slice()
        .sort(
          (a, b) =>
            b.duplicateSemanticRiskCount - a.duplicateSemanticRiskCount ||
            codeNumber(a.templateCode) - codeNumber(b.templateCode),
        )
        .slice(0, 25)
        .map((row) => ({
          templateCode: row.templateCode,
          title: row.title,
          duplicateSemanticRiskCount: row.duplicateSemanticRiskCount,
          placeholders: row.duplicateSemanticRisks.map((risk) => risk.placeholder),
        })),
    },
    safetyAssertions: {
      inventoryOnly: true,
      noDocxMutation: true,
      noContractMutation: true,
      noCompiledMutation: true,
      occurrenceLevelReviewRequired: true,
    },
    rows,
  };
}

function formatMarkdown(plan) {
  const riskyRows = plan.rows.filter((row) => row.duplicateSemanticRiskCount > 0);

  return [
    '# DOCX Placeholder Renormalization Plan',
    '',
    'Mode: DOCX_PLACEHOLDER_RENORMALIZATION_INVENTORY',
    '',
    '## Summary',
    '',
    markdownTable([
      ['Metric', 'Value'],
      ['Rows', plan.summary.totalRows],
      ['Rows with duplicate semantic risks', plan.summary.rowsWithDuplicateSemanticRisks],
      ['Duplicate semantic risk count', plan.summary.duplicateSemanticRiskCount],
    ]),
    '',
    '## Safety',
    '',
    markdownTable([
      ['Assertion', 'Value'],
      ...Object.entries(plan.safetyAssertions).map(([key, value]) => [key, value]),
    ]),
    '',
    '## Top Rows',
    '',
    markdownTable([
      ['BM', 'Risks', 'Placeholders'],
      ...plan.summary.topRows.map((row) => [
        row.templateCode,
        row.duplicateSemanticRiskCount,
        row.placeholders.join(', '),
      ]),
    ]),
    '',
    '## Risk Details',
    '',
    markdownTable([
      ['BM', 'Placeholder', 'Count', 'Anchors'],
      ...riskyRows.flatMap((row) =>
        row.duplicateSemanticRisks.map((risk) => [
          row.templateCode,
          risk.placeholder,
          risk.count,
          risk.anchors.join(', '),
        ]),
      ),
    ]),
    '',
    '## Next Step',
    '',
    'For each risk, split the repeated numbered placeholder into occurrence-level semantic placeholders in the normalized DOCX, then update the locked contract fields, slots, and bindings to match that semantic map.',
    '',
  ].join('\n');
}

function main() {
  const plan = buildPlan();
  writeJson(OUT_JSON, plan);
  writeText(OUT_MD, formatMarkdown(plan));

  console.log('=== plan:docx-placeholder-renormalization ===');
  console.log(`Rows: ${plan.summary.totalRows}`);
  console.log(
    `Rows with duplicate semantic risks: ${plan.summary.rowsWithDuplicateSemanticRisks}`,
  );
  console.log(`Duplicate semantic risks: ${plan.summary.duplicateSemanticRiskCount}`);
  console.log(`Report: ${OUT_MD}`);
}

main();
