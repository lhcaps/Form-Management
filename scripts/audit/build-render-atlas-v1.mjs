#!/usr/bin/env node

import { join } from 'node:path';

import {
  ATLAS_SCHEMA_VERSION,
  ATLAS_TASK,
  atlasSafetyAssertions,
  byTemplate,
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
  readRenderDiff,
  renderDiffPath,
  runRenderGateBatch,
} from './lib/render-gate-cache.mjs';

function statusOf(value) {
  return String(value ?? 'UNKNOWN').toUpperCase();
}

function statusFromReport(report, fallback = null) {
  if (!report) return statusOf(fallback);
  if (report.status || report.verdict || report.renderAuditResult) {
    return statusOf(report.status ?? report.verdict ?? report.renderAuditResult);
  }
  if (report.clean === true || report.ok === true || report.pass === true) return 'PASS';
  const dimensionStatuses = [
    report.render?.status,
    report.literalFidelity?.status,
    report.textFidelity?.status,
    report.bindingFidelity?.status,
    report.structureFidelity?.status,
    report.renderDimensions?.textFidelity?.status,
    report.renderDimensions?.fieldPlacementFidelity?.status,
    report.renderDimensions?.bindingFidelity?.status,
    report.renderDimensions?.layoutHints?.status,
  ].filter(Boolean).map(statusOf);
  if (dimensionStatuses.length > 0 && dimensionStatuses.every((status) => status === 'PASS')) {
    return 'PASS';
  }
  if (dimensionStatuses.some((status) => status === 'FAIL')) return 'FAIL';
  return statusOf(fallback);
}

function normalizeRenderResult(root, templateCode, result, cacheOnly = false) {
  const parsedReport = result?.parsedReport ?? result?.data ?? null;
  const status = statusFromReport(parsedReport, result?.status);
  return {
    templateCode,
    status,
    clean: parsedReport?.clean === true || status === 'PASS',
    exitCode: result?.exitCode ?? (status === 'PASS' ? 0 : status === 'FAIL' ? 1 : null),
    cacheHit: result?.cacheHit === true || cacheOnly,
    cacheOnly,
    stdout: result?.stdout ?? '',
    stderr: result?.stderr ?? '',
    reportJson: result?.reportJson ?? result?.path ?? renderDiffPath(root, templateCode),
    parsedReport,
    failureReasons: buildFailureReasons(parsedReport, status),
    error: result?.error ?? null,
  };
}

function buildFailureReasons(report, status) {
  const reasons = [];
  if (status !== 'PASS') reasons.push(`status=${status}`);
  if (report?.render?.status === 'FAIL') reasons.push('render failed');
  if ((report?.literalFidelity?.undefinedOrNullLiterals ?? 0) > 0) {
    reasons.push(`undefined/null literals=${report.literalFidelity.undefinedOrNullLiterals}`);
  }
  if ((report?.textFidelity?.unreplacedPlaceholders ?? 0) > 0) {
    reasons.push(`unreplaced placeholders=${report.textFidelity.unreplacedPlaceholders}`);
  }
  if (report?.bindingFidelity?.status === 'FAIL') reasons.push('binding fidelity failed');
  if (report?.structureFidelity?.status === 'FAIL') reasons.push('structure fidelity failed');
  return reasons;
}

function cachedResult(root, templateCode) {
  const cached = readRenderDiff(root, templateCode);
  if (!cached?.data) {
    return {
      templateCode,
      status: 'MISSING',
      exitCode: null,
      cacheHit: false,
      reportJson: renderDiffPath(root, templateCode),
      parsedReport: null,
      error: cached?.error ?? 'render-diff missing',
    };
  }
  return {
    templateCode,
    status: statusFromReport(cached.data),
    exitCode: statusFromReport(cached.data) === 'PASS' ? 0 : 1,
    cacheHit: true,
    reportJson: cached.path,
    parsedReport: cached.data,
    error: null,
  };
}

function buildMarkdown(atlas) {
  return [
    '# Render Atlas V1',
    '',
    `Generated: ${atlas.generatedAt}`,
    '',
    '## Summary',
    '',
    markdownTable([
      ['Metric', 'Value'],
      ['Templates', atlas.summary.total],
      ['PASS', atlas.summary.statusCounts.PASS ?? 0],
      ['FAIL', atlas.summary.statusCounts.FAIL ?? 0],
      ['ERROR', atlas.summary.statusCounts.ERROR ?? 0],
      ['MISSING', atlas.summary.statusCounts.MISSING ?? 0],
      ['Cache hits', atlas.summary.cacheHits],
    ]),
    '',
    '## Rows',
    '',
    markdownTable([
      ['BM', 'Status', 'Exit', 'Cache', 'Reasons'],
      ...atlas.rows.map((row) => [
        row.templateCode,
        row.status,
        row.exitCode ?? '-',
        row.cacheHit,
        row.failureReasons.join('; ') || '-',
      ]),
    ]),
    '',
  ].join('\n');
}

export async function buildRenderAtlas(root, templateCodes, options = {}) {
  const generatedAt = new Date().toISOString();
  let rows;
  if (options.cacheOnly) {
    rows = templateCodes.map((templateCode) =>
      normalizeRenderResult(root, templateCode, cachedResult(root, templateCode), true),
    );
  } else {
    const batch = await runRenderGateBatch(root, templateCodes, {
      concurrency: options.concurrency ?? 2,
      force: options.force === true,
    });
    rows = batch.results.map((result) =>
      normalizeRenderResult(root, result.templateCode, result, false),
    );
  }

  const summary = {
    total: rows.length,
    statusCounts: countBy(rows, (row) => row.status),
    pass: rows.filter((row) => row.status === 'PASS').length,
    fail: rows.filter((row) => row.status === 'FAIL').length,
    error: rows.filter((row) => row.status === 'ERROR').length,
    missing: rows.filter((row) => row.status === 'MISSING').length,
    cacheHits: rows.filter((row) => row.cacheHit).length,
  };
  return {
    schemaVersion: ATLAS_SCHEMA_VERSION,
    task: ATLAS_TASK,
    atlas: 'RENDER',
    generatedAt,
    generatedBy: 'scripts/audit/build-render-atlas-v1.mjs',
    scope: templateCodes,
    ...atlasSafetyAssertions(),
    summary,
    byTemplate: byTemplate(rows),
    rows,
  };
}

export async function main() {
  const args = parseAtlasArgs(process.argv.slice(2), { defaultConcurrency: 2 });
  const templateCodes = selectTemplateCodes(args.root, args);
  const atlas = await buildRenderAtlas(args.root, templateCodes, args);
  const jsonPath = join(args.outDir, 'render-atlas.latest.json');
  const mdPath = join(args.outDir, 'render-atlas.latest.md');
  writeJson(jsonPath, atlas);
  writeText(mdPath, buildMarkdown(atlas));
  console.log(`RENDER_ATLAS_V1 ${atlas.summary.total} templates`);
  console.log(`Report: ${jsonPath}`);
}

runCli(import.meta.url, main);
