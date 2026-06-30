#!/usr/bin/env node

import { join } from 'node:path';

import {
  ATLAS_SCHEMA_VERSION,
  ATLAS_TASK,
  atlasSafetyAssertions,
  byTemplate,
  collectBoardIssueCodes,
  countBy,
  markdownTable,
  parseAtlasArgs,
  readJsonIfExists,
  runCli,
  selectTemplateCodes,
  writeJson,
  writeText,
} from './lib/docx-atlas-common.mjs';
import {
  BUCKET_PRECEDENCE,
  classifyBmForSmartQueue,
} from './lib/smart-remediation-classifier.mjs';

function loadAtlas(root, fileName) {
  return readJsonIfExists(join(root, 'docs', 'audit', 'docx-atlas-v1', fileName), {
    rows: [],
    byTemplate: {},
  });
}

function loadBoard(root) {
  return readJsonIfExists(join(root, 'docs', 'audit', '213-docx-fidelity-board', 'latest.json'), {
    rows: [],
  });
}

function renderReportFromRow(row) {
  return row?.parsedReport ?? row?.report ?? row ?? null;
}

function augmentContractRow(contractRow, boardRow) {
  const issueCodes = [...new Set(collectBoardIssueCodes(boardRow))];
  return {
    ...(contractRow ?? {}),
    issueCodes,
    baselineFindings: boardRow?.baseline?.findings ?? [],
    rootIssueCodes: Object.keys(boardRow?.rootCause?.issueCounts ?? {}),
    candidateRepairExists:
      contractRow?.candidateRepairExists === true ||
      (contractRow?.structuralMismatchCount ?? 0) > 0 ||
      boardRow?.primaryLane === 'CONTRACT_REPAIR',
  };
}

function bucketOrder(bucket) {
  const index = BUCKET_PRECEDENCE.indexOf(bucket);
  return index >= 0 ? index : BUCKET_PRECEDENCE.length;
}

function buildQueueItem(templateCode, boardRow, docxRow, contractRow, renderRow) {
  const contractInput = augmentContractRow(contractRow, boardRow);
  const renderReport = renderReportFromRow(renderRow);
  const classification = classifyBmForSmartQueue({
    templateCode,
    row: boardRow,
    renderReport,
    docxAtlasRow: docxRow,
    contractAtlasRow: contractInput,
  });
  return {
    templateCode,
    title: boardRow?.title ?? contractRow?.templateTitle ?? templateCode,
    bucket: classification.bucket,
    reasoning: classification.reasoning,
    confidence: classification.confidence,
    board: {
      primaryLane: boardRow?.primaryLane ?? null,
      risk: boardRow?.risk ?? null,
      completionStatus: boardRow?.completionStatus ?? null,
      issueCount: boardRow?.rootCause?.issueCount ?? 0,
      issueCodes: contractInput.issueCodes,
    },
    docx: {
      highestRiskLevel: docxRow?.highestRiskLevel ?? 'UNKNOWN',
      occurrenceReviewRequired: docxRow?.occurrenceReviewRequired ?? false,
      duplicateMultiContextCount: docxRow?.duplicateMultiContextCount ?? 0,
      tableBlankAmbiguityCount: docxRow?.tableBlankAmbiguityCount ?? 0,
    },
    contract: {
      structuralMismatchCount: contractInput.structuralMismatchCount ?? 0,
      reviewRequiredCount: contractInput.reviewRequiredCount ?? 0,
      candidateRepairExists: contractInput.candidateRepairExists === true,
    },
    render: {
      status: renderRow?.status ?? renderReport?.status ?? 'UNKNOWN',
      clean: renderRow?.clean ?? renderReport?.clean ?? false,
      cacheHit: renderRow?.cacheHit ?? false,
      failureReasons: renderRow?.failureReasons ?? [],
    },
  };
}

function buildMarkdown(queue) {
  return [
    '# Smart Remediation Queue V1',
    '',
    `Generated: ${queue.generatedAt}`,
    '',
    '## Summary',
    '',
    markdownTable([
      ['Metric', 'Value'],
      ['Templates', queue.summary.total],
      ['Preserved blockers', queue.summary.preservedBlockers],
      ['Can apply run now', queue.canApplyRunNow],
    ]),
    '',
    '## Bucket Counts',
    '',
    markdownTable([
      ['Bucket', 'Count'],
      ...BUCKET_PRECEDENCE.map((bucket) => [bucket, queue.summary.bucketCounts[bucket] ?? 0]),
    ]),
    '',
    '## Queue',
    '',
    markdownTable([
      ['BM', 'Bucket', 'Lane', 'Render', 'Risk', 'Reason'],
      ...queue.items.map((item) => [
        item.templateCode,
        item.bucket,
        item.board.primaryLane ?? '-',
        item.render.status,
        item.docx.highestRiskLevel,
        item.reasoning.join('; '),
      ]),
    ]),
    '',
  ].join('\n');
}

export function buildSmartQueue(root, templateCodes) {
  const board = loadBoard(root);
  const docxAtlas = loadAtlas(root, 'docx-atlas.latest.json');
  const contractAtlas = loadAtlas(root, 'contract-atlas.latest.json');
  const renderAtlas = loadAtlas(root, 'render-atlas.latest.json');
  const boardByTemplate = byTemplate(board.rows ?? []);
  const generatedAt = new Date().toISOString();
  const items = templateCodes
    .map((templateCode) =>
      buildQueueItem(
        templateCode,
        boardByTemplate[templateCode] ?? { templateCode },
        docxAtlas.byTemplate?.[templateCode] ?? null,
        contractAtlas.byTemplate?.[templateCode] ?? null,
        renderAtlas.byTemplate?.[templateCode] ?? null,
      ),
    )
    .sort(
      (a, b) =>
        bucketOrder(a.bucket) - bucketOrder(b.bucket) ||
        (b.board.issueCount ?? 0) - (a.board.issueCount ?? 0) ||
        a.templateCode.localeCompare(b.templateCode),
    );

  const bucketCounts = Object.fromEntries(BUCKET_PRECEDENCE.map((bucket) => [bucket, 0]));
  for (const item of items) bucketCounts[item.bucket] = (bucketCounts[item.bucket] ?? 0) + 1;

  return {
    schemaVersion: ATLAS_SCHEMA_VERSION,
    task: ATLAS_TASK,
    atlas: 'SMART_REMEDIATION_QUEUE',
    generatedAt,
    generatedBy: 'scripts/audit/build-smart-remediation-queue-v1.mjs',
    scope: templateCodes,
    ...atlasSafetyAssertions(),
    summary: {
      total: items.length,
      bucketCounts,
      preservedBlockers: bucketCounts.DO_NOT_TOUCH_ALREADY_BLOCKED ?? 0,
    },
    topByBucket: Object.fromEntries(
      BUCKET_PRECEDENCE.map((bucket) => [
        bucket,
        items.filter((item) => item.bucket === bucket).slice(0, 20).map((item) => item.templateCode),
      ]),
    ),
    items,
  };
}

export async function main() {
  const args = parseAtlasArgs(process.argv.slice(2));
  const templateCodes = selectTemplateCodes(args.root, args);
  const queue = buildSmartQueue(args.root, templateCodes);
  const jsonPath = join(args.outDir, 'smart-remediation-queue.latest.json');
  const mdPath = join(args.outDir, 'smart-remediation-queue.latest.md');
  writeJson(jsonPath, queue);
  writeText(mdPath, buildMarkdown(queue));
  console.log(`SMART_REMEDIATION_QUEUE_V1 ${queue.summary.total} templates`);
  console.log(`Report: ${jsonPath}`);
}

runCli(import.meta.url, main);
