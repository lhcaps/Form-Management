#!/usr/bin/env node

import { join } from 'node:path';

import {
  ATLAS_SCHEMA_VERSION,
  ATLAS_TASK,
  atlasSafetyAssertions,
  byTemplate,
  countBy,
  lockedContractsRoot,
  markdownTable,
  parseAtlasArgs,
  readJsonIfExists,
  rel,
  runCli,
  selectTemplateCodes,
  writeJson,
  writeText,
} from './lib/docx-atlas-common.mjs';
import {
  buildStructuralMismatches,
  loadLockedContract,
} from './lib/contract-structural-mismatches.mjs';
import { buildDocxAtlas } from './build-docx-atlas-v1.mjs';

const STRUCTURAL_KEYS = [
  'templatePlaceholdersWithoutSlots',
  'contractSlotsWithoutTemplatePlaceholders',
  'bindingsWithoutTemplatePlaceholders',
  'slotsWithoutBindings',
  'bindingsWithoutSlots',
  'slotsWithoutCanonicalFields',
  'fieldsWithoutSlots',
  'bindingsWithoutCanonicalFields',
  'duplicatePlaceholders',
  'duplicateSemanticPlaceholders',
];

function lengthOf(value) {
  return Array.isArray(value) ? value.length : 0;
}

function structuralMismatchCount(mismatches) {
  return STRUCTURAL_KEYS.reduce((sum, key) => sum + lengthOf(mismatches[key]), 0);
}

function reviewRequiredCount(mismatches) {
  return (
    lengthOf(mismatches.reviewRequired?.slots) +
    lengthOf(mismatches.reviewRequired?.fields) +
    lengthOf(mismatches.reviewRequired?.bindings)
  );
}

function docxInputFor(code, docxAtlas) {
  const row = docxAtlas?.byTemplate?.[code];
  if (!row) return null;
  return {
    occurrences: row.occurrences ?? [],
    placeholderRisks: row.placeholderRisks ?? {},
  };
}

function buildContractRow(root, templateCode, docxAtlas) {
  try {
    const contract = loadLockedContract(lockedContractsRoot(root), templateCode);
    const docxInput = docxInputFor(templateCode, docxAtlas) ?? { occurrences: [] };
    const mismatches = buildStructuralMismatches(docxInput, contract.raw ?? contract);
    const structuralCount = structuralMismatchCount(mismatches);
    const reviewCount = reviewRequiredCount(mismatches);
    return {
      templateCode,
      sourceId: contract.sourceId,
      templateTitle: contract.templateTitle,
      contractPath: rel(root, contract.file),
      status: contract.status,
      reviewKind: contract.reviewKind,
      fieldCount: contract.canonicalFields.length,
      slotCount: contract.docxSlots.length,
      bindingCount: contract.renderBindings.length,
      structuralMismatchCount: structuralCount,
      reviewRequiredCount: reviewCount,
      candidateRepairExists: structuralCount > 0,
      reviewRequiredSlots: mismatches.reviewRequired?.slots ?? [],
      reviewRequiredFields: mismatches.reviewRequired?.fields ?? [],
      reviewRequiredBindings: mismatches.reviewRequired?.bindings ?? [],
      mismatches,
    };
  } catch (error) {
    return {
      templateCode,
      sourceId: null,
      templateTitle: templateCode,
      contractPath: null,
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      fieldCount: 0,
      slotCount: 0,
      bindingCount: 0,
      structuralMismatchCount: 1,
      reviewRequiredCount: 0,
      candidateRepairExists: true,
      reviewRequiredSlots: [],
      reviewRequiredFields: [],
      reviewRequiredBindings: [],
      mismatches: {},
    };
  }
}

function buildMarkdown(atlas) {
  return [
    '# Contract Atlas V1',
    '',
    `Generated: ${atlas.generatedAt}`,
    '',
    '## Summary',
    '',
    markdownTable([
      ['Metric', 'Value'],
      ['Templates', atlas.summary.totalTemplates],
      ['Locked', atlas.summary.statusCounts.locked ?? 0],
      ['Structural repair candidates', atlas.summary.candidateRepairExists],
      ['Review required', atlas.summary.reviewRequired],
    ]),
    '',
    '## Rows',
    '',
    markdownTable([
      ['BM', 'Status', 'Fields', 'Slots', 'Bindings', 'Structural mismatches', 'Review required'],
      ...atlas.rows.map((row) => [
        row.templateCode,
        row.status,
        row.fieldCount,
        row.slotCount,
        row.bindingCount,
        row.structuralMismatchCount,
        row.reviewRequiredCount,
      ]),
    ]),
    '',
  ].join('\n');
}

export function buildContractAtlas(root, templateCodes, docxAtlas = null) {
  const effectiveDocxAtlas =
    docxAtlas ??
    readJsonIfExists(join(root, 'docs', 'audit', 'docx-atlas-v1', 'docx-atlas.latest.json')) ??
    buildDocxAtlas(root, templateCodes);
  const generatedAt = new Date().toISOString();
  const rows = templateCodes.map((templateCode) =>
    buildContractRow(root, templateCode, effectiveDocxAtlas),
  );
  const summary = {
    totalTemplates: rows.length,
    statusCounts: countBy(rows, (row) => row.status),
    candidateRepairExists: rows.filter((row) => row.candidateRepairExists).length,
    reviewRequired: rows.filter((row) => row.reviewRequiredCount > 0).length,
    totalStructuralMismatches: rows.reduce((sum, row) => sum + row.structuralMismatchCount, 0),
  };
  return {
    schemaVersion: ATLAS_SCHEMA_VERSION,
    task: ATLAS_TASK,
    atlas: 'CONTRACT',
    generatedAt,
    generatedBy: 'scripts/audit/build-contract-atlas-v1.mjs',
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
  const atlas = buildContractAtlas(args.root, templateCodes);
  const jsonPath = join(args.outDir, 'contract-atlas.latest.json');
  const mdPath = join(args.outDir, 'contract-atlas.latest.md');
  writeJson(jsonPath, atlas);
  writeText(mdPath, buildMarkdown(atlas));
  console.log(`CONTRACT_ATLAS_V1 ${atlas.summary.totalTemplates} templates`);
  console.log(`Report: ${jsonPath}`);
}

runCli(import.meta.url, main);
