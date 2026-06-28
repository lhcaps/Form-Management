#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  ATLAS_SCHEMA_VERSION,
  ATLAS_TASK,
  atlasSafetyAssertions,
  byTemplate,
  countBy,
  highestRiskLevel,
  markdownTable,
  parseAtlasArgs,
  rel,
  runCli,
  selectTemplateCodes,
  writeJson,
  writeText,
} from './lib/docx-atlas-common.mjs';
import { normalizedDocxPath } from './lib/render-gate-cache.mjs';
import { extractPlaceholderOccurrencesFromDocx } from './lib/ooxml-context-extractor.mjs';

function summarizePlaceholderGroups(result) {
  return Object.fromEntries(
    Object.entries(result.byPlaceholder ?? {}).map(([placeholder, occurrences]) => [
      placeholder,
      {
        count: occurrences.length,
        partKinds: [...new Set(occurrences.map((occ) => occ.partKind))].sort(),
        contextSignatures: [...new Set(occurrences.map((occ) => occ.contextSignature))].sort(),
        visibleLabels: [...new Set(occurrences.flatMap((occ) => occ.visibleLabels ?? []))].sort(),
        risk: result.placeholderRisks?.[placeholder] ?? { level: 'NONE' },
      },
    ]),
  );
}

function buildDocxRow(root, templateCode) {
  const docxPath = normalizedDocxPath(root, templateCode);
  if (!existsSync(docxPath)) {
    return {
      templateCode,
      normalizedDocxPath: rel(root, docxPath),
      exists: false,
      error: 'NORMALIZED_DOCX_MISSING',
      totalTextNodes: 0,
      totalPlaceholders: 0,
      uniquePlaceholders: 0,
      highestRiskLevel: 'CRITICAL',
      occurrenceReviewRequired: true,
      placeholderRisks: {},
      byPlaceholder: {},
      occurrences: [],
    };
  }

  try {
    const result = extractPlaceholderOccurrencesFromDocx(docxPath);
    const riskLevels = Object.values(result.placeholderRisks ?? {}).map((risk) => risk.level);
    const highest = highestRiskLevel(riskLevels);
    const placeholderGroups = summarizePlaceholderGroups(result);
    const duplicateMultiContext = Object.entries(placeholderGroups)
      .filter(([, group]) => group.count > 1 && group.contextSignatures.length > 1)
      .map(([placeholder, group]) => ({
        placeholder,
        count: group.count,
        contexts: group.contextSignatures.length,
        riskLevel: group.risk.level,
      }));
    const tableBlankAmbiguities = result.occurrences
      .filter(
        (occ) =>
          occ.tableIndex >= 0 &&
          occ.isRiskyFamily === true &&
          (occ.visibleLabels ?? []).length === 0,
      )
      .map((occ) => ({
        placeholder: occ.placeholder,
        occurrenceIndex: occ.occurrenceIndex,
        tableIndex: occ.tableIndex,
        rowIndex: occ.rowIndex,
        cellIndex: occ.cellIndex,
      }));

    return {
      templateCode,
      normalizedDocxPath: rel(root, docxPath),
      exists: true,
      error: null,
      totalTextNodes: result.totalTextNodes,
      totalPlaceholders: result.totalPlaceholders,
      uniquePlaceholders: result.uniquePlaceholders,
      duplicatePlaceholderCount: Object.values(result.occurrenceCounts ?? {}).filter((count) => count > 1).length,
      duplicateMultiContextCount: duplicateMultiContext.length,
      duplicateMultiContext,
      tableBlankAmbiguityCount: tableBlankAmbiguities.length,
      tableBlankAmbiguities,
      partKindCounts: countBy(result.occurrences, (occ) => occ.partKind),
      riskCounts: countBy(Object.values(result.placeholderRisks ?? {}), (risk) => risk.level ?? 'NONE'),
      highestRiskLevel: highest,
      occurrenceReviewRequired:
        ['HIGH', 'CRITICAL'].includes(highest) ||
        duplicateMultiContext.some((item) => ['HIGH', 'CRITICAL'].includes(item.riskLevel)) ||
        tableBlankAmbiguities.length > 0,
      occurrenceCounts: result.occurrenceCounts,
      placeholderRisks: result.placeholderRisks,
      byPlaceholder: result.byPlaceholder,
      placeholderGroups,
      occurrences: result.occurrences,
    };
  } catch (error) {
    return {
      templateCode,
      normalizedDocxPath: rel(root, docxPath),
      exists: true,
      error: error instanceof Error ? error.message : String(error),
      totalTextNodes: 0,
      totalPlaceholders: 0,
      uniquePlaceholders: 0,
      highestRiskLevel: 'CRITICAL',
      occurrenceReviewRequired: true,
      placeholderRisks: {},
      byPlaceholder: {},
      occurrences: [],
    };
  }
}

function buildMarkdown(atlas) {
  const rows = atlas.rows.map((row) => [
    row.templateCode,
    row.exists ? 'yes' : 'no',
    row.totalPlaceholders,
    row.uniquePlaceholders,
    row.highestRiskLevel,
    row.occurrenceReviewRequired,
    row.duplicateMultiContextCount ?? 0,
    row.tableBlankAmbiguityCount ?? 0,
  ]);
  return [
    '# DOCX Atlas V1',
    '',
    `Generated: ${atlas.generatedAt}`,
    `Templates: ${atlas.summary.totalTemplates}`,
    '',
    '## Summary',
    '',
    markdownTable([
      ['Metric', 'Value'],
      ['Missing DOCX', atlas.summary.missingDocx],
      ['Occurrence review required', atlas.summary.occurrenceReviewRequired],
      ['Total placeholders', atlas.summary.totalPlaceholders],
      ['Unique placeholder total', atlas.summary.uniquePlaceholderTotal],
    ]),
    '',
    '## Risk Counts',
    '',
    markdownTable([
      ['Risk', 'Count'],
      ...Object.entries(atlas.summary.riskCounts).sort().map(([risk, count]) => [risk, count]),
    ]),
    '',
    '## Rows',
    '',
    markdownTable([
      ['BM', 'DOCX', 'Placeholders', 'Unique', 'Risk', 'Review', 'Duplicate contexts', 'Table ambiguity'],
      ...rows,
    ]),
    '',
  ].join('\n');
}

export function buildDocxAtlas(root, templateCodes) {
  const generatedAt = new Date().toISOString();
  const rows = templateCodes.map((templateCode) => buildDocxRow(root, templateCode));
  const summary = {
    totalTemplates: rows.length,
    missingDocx: rows.filter((row) => !row.exists).length,
    occurrenceReviewRequired: rows.filter((row) => row.occurrenceReviewRequired).length,
    totalPlaceholders: rows.reduce((sum, row) => sum + (row.totalPlaceholders ?? 0), 0),
    uniquePlaceholderTotal: rows.reduce((sum, row) => sum + (row.uniquePlaceholders ?? 0), 0),
    riskCounts: countBy(rows, (row) => row.highestRiskLevel),
  };

  return {
    schemaVersion: ATLAS_SCHEMA_VERSION,
    task: ATLAS_TASK,
    atlas: 'DOCX',
    generatedAt,
    generatedBy: 'scripts/audit/build-docx-atlas-v1.mjs',
    scope: templateCodes,
    ...atlasSafetyAssertions(),
    summary,
    byTemplate: byTemplate(rows),
    rows,
  };
}

export async function main() {
  const args = parseAtlasArgs(process.argv.slice(2));
  const templateCodes = selectTemplateCodes(args.root, args);
  const atlas = buildDocxAtlas(args.root, templateCodes);
  const jsonPath = join(args.outDir, 'docx-atlas.latest.json');
  const mdPath = join(args.outDir, 'docx-atlas.latest.md');
  writeJson(jsonPath, atlas);
  writeText(mdPath, buildMarkdown(atlas));
  console.log(`DOCX_ATLAS_V1 ${atlas.summary.totalTemplates} templates`);
  console.log(`Report: ${jsonPath}`);
}

runCli(import.meta.url, main);
