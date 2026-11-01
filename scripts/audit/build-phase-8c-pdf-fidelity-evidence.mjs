#!/usr/bin/env node
/**
 * Phase 8C — BM-001/BM-006/BM-171 PDF fidelity evidence package.
 *
 * Produces a single operator-readable evidence tree under
 * `docs/audit/infrastructure-modernization/phase-8c-pdf-fidelity/`
 * that satisfies the remaining PDF-fidelity blocker from Phase 8B.
 *
 * Scope:
 *   - BM-001 -> production canonical render path
 *              (`render-bm001-canonical-signoff.mjs`)
 *   - BM-006 -> offline runtime-equivalent render path
 *              (`regenerate-bm006-runtime-docx.mjs`)
 *   - BM-171 -> production canonical render path
 *              (`render-bm171-canonical-signoff.mjs`)
 *
 * Honesty rules:
 *   - If LibreOffice/soffice is unavailable, report `pdfAvailable: false`
 *     and do not fabricate PDF/PNG artifacts.
 *   - Never mutate locked contracts / templates / DB / migrations.
 *
 * Exit codes:
 *   0 - packet produced
 *   1 - infra failure
 *   2 - invalid usage
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const REQUIRE = createRequire(resolve(REPO_ROOT, 'apps/api/package.json'));
const PizZip = REQUIRE('pizzip');
const OUT_DIR = join(
  REPO_ROOT,
  'docs',
  'audit',
  'infrastructure-modernization',
  'phase-8c-pdf-fidelity',
);
const TARGET_ARG = process.argv[2];

if (TARGET_ARG && !['BM-001', 'BM-006', 'BM-171'].includes(TARGET_ARG)) {
  console.error(`[FAIL] Unsupported target: ${TARGET_ARG}`);
  process.exit(2);
}

const TARGETS = TARGET_ARG ? [TARGET_ARG] : ['BM-001', 'BM-006', 'BM-171'];

const REQUIRED_BM001_PRESENT = [
  'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026',
  'Cấp ngày 07 tháng 06 năm 2020',
  'Hồi 08:00',
  'ngày 26 tháng 12 năm 2025',
  'tại TP. Hồ Chí Minh',
  'hồi 10:00 ngày 26 tháng 12 năm 2025',
  'Lưu: HSVA, HSKS, VP.',
];

const REQUIRED_BM001_ABSENT = [
  'Lưu: HSVV, VP.',
  '- Lưu: HSVA, HSKS, VP.',
  'ngày 4 tháng 7 năm 2026',
  'Cấp ngày 7/6/2020',
  '{{',
  'undefined',
  '[object Object]',
  'Invalid Date',
];

const REQUIRED_BM171_PRESENT = [
  'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
  'Độc lập - Tự do - Hạnh phúc',
  'QUYẾT ĐỊNH',
  'TRẢ LẠI TÀI SẢN',
  'Điều 1.',
  'Điều 2.',
  'Sinh ngày 08/09/1985',
  'Cấp ngày 14/12/2021',
  'Lưu: HSVA, HSKS, VP.',
];

const REQUIRED_BM171_ABSENT = [
  'Lưu: HSVV, VP.',
  '- Lưu: HSVA, HSKS, VP.',
  'ngày 04 tháng 7 năm 2026',
  '12 Ghi cụ thể cơ quan',
  '13 Ghi chức danh người ký',
  '{{',
  '}}',
  'undefined',
  '[object Object]',
  'Invalid Date',
];

const REQUIRED_BM006_PRESENT = [
  'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
  'Độc lập - Tự do - Hạnh phúc',
  'YÊU CẦU',
  'Tiếp nhận/kiểm tra, xác minh/ra quyết định giải quyết nguồn tin về tội phạm',
  'Căn cứ các điều 41, 147 và 160',
  'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
];

const REQUIRED_BM006_ABSENT = [
  '{{',
  '}}',
  'undefined',
  '[object Object]',
  'Invalid Date',
];

function normalized(text) {
  return String(text)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t\n]*/g, '\n')
    .trim();
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    shell: true,
    encoding: 'utf-8',
    windowsHide: true,
    ...options,
  });
}

function findSoffice() {
  const where = runCommand('where.exe', ['soffice']);
  if (where.status !== 0 || !where.stdout?.trim()) return null;
  const candidates = where.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().includes('soffice'));
  return candidates[0] ?? null;
}

function tryConvertDocxToPdf(docxPath, pdfPath) {
  const soffice = findSoffice();
  if (!soffice) return { pdfAvailable: false, reason: 'soffice not found on host' };

  const outDir = dirname(pdfPath);
  mkdirSync(outDir, { recursive: true });

  const result = runCommand(soffice, [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    outDir,
    docxPath,
  ]);

  if (result.status !== 0) {
    return {
      pdfAvailable: false,
      reason: `soffice exitCode=${result.status}; ${result.stderr || result.stdout}`.trim(),
    };
  }

  const finalPdf = pdfPath;
  if (!existsSync(finalPdf)) {
    return { pdfAvailable: false, reason: 'converted PDF missing after soffice run' };
  }

  const bytes = readFileSync(finalPdf);
  if (bytes.length === 0 || bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return { pdfAvailable: false, reason: 'soffice produced invalid PDF bytes' };
  }

  return { pdfAvailable: true, pdfPath: finalPdf, reason: null };
}

function renderBm001Evidence() {
  const packetDir = join(OUT_DIR, 'BM-001');
  ensureDir(packetDir);

  const renderEnv = {
    ...process.env,
    BM001_SIGNOFF_DOCX_PATH: join(packetDir, 'rendered.latest.docx'),
    BM001_SIGNOFF_OUT_ROOT: join(REPO_ROOT, 'storage', 'temp', 'phase-8c-bm001-signoff'),
    BM001_SIGNOFF_REPO_ROOT: REPO_ROOT,
  };

  const renderProc = runCommand(
    'pnpm',
    ['--filter', 'api', 'exec', 'tsx', './scripts/render-bm001-canonical-signoff.mjs'],
    { cwd: REPO_ROOT, env: renderEnv },
  );

  if (renderProc.status !== 0) {
    throw new Error(`BM-001 render failed: ${renderProc.stderr || renderProc.stdout}`);
  }

  const lastLine = (renderProc.stdout ?? '').trim().split(/\r?\n/).pop() ?? '{}';
  const renderResult = JSON.parse(lastLine);

  if (!existsSync(renderResult.docxPath)) {
    throw new Error(`BM-001 rendered DOCX missing: ${renderResult.docxPath}`);
  }

  const renderedBuffer = readFileSync(renderResult.docxPath);
  const onDiskSha = createHash('sha256').update(renderedBuffer).digest('hex');
  if (onDiskSha !== renderResult.sha256) {
    throw new Error(`BM-001 sha256 mismatch: ${onDiskSha} !== ${renderResult.sha256}`);
  }

  const visibleText = renderResult.visibleText;
  const normText = normalized(visibleText);
  const checklist = [];
  const autoChecks = { autoOk: 0, autoFail: 0, needsHuman: 0, unverified: 0, total: 0 };

  function check(id, label, evaluateFn, kind, humanOnly = false) {
    autoChecks.total += 1;
    const r = evaluateFn();
    if (r.status === 'AUTO_OK') autoChecks.autoOk += 1;
    else if (r.status === 'FAIL') autoChecks.autoFail += 1;
    else if (r.status === 'NEEDS_HUMAN') autoChecks.needsHuman += 1;
    else autoChecks.unverified += 1;
    checklist.push({ id, label, kind, status: r.status, evidence: r.evidence, humanOnly });
    return r;
  }

  for (const text of REQUIRED_BM001_PRESENT) {
    check(`bm001-present-${text}`, `Required-present: ${text}`, () =>
      normText.includes(text)
        ? { status: 'AUTO_OK', evidence: 'detected in rendered text' }
        : { status: 'FAIL', evidence: 'canonical string not found' },
      'auto-confirmable',
    );
  }

  for (const text of REQUIRED_BM001_ABSENT) {
    check(`bm001-absent-${text}`, `Required-absent: ${text}`, () =>
      normText.includes(text)
        ? { status: 'FAIL', evidence: 'forbidden string present' }
        : { status: 'AUTO_OK', evidence: 'forbidden string absent' },
      'auto-confirmable',
    );
  }

  const pdfProbe = tryConvertDocxToPdf(
    renderResult.docxPath,
    join(packetDir, 'rendered.latest.pdf'),
  );
  check(
    'bm001-pdf-probe',
    'PDF conversion probe',
    () => ({
      status: pdfProbe.pdfAvailable ? 'AUTO_OK' : 'NEEDS_HUMAN',
      evidence: pdfProbe.reason || 'PDF generated successfully',
    }),
    'pdf-fidelity',
  );

  writeFileSync(join(packetDir, 'rendered.latest.docx'), renderedBuffer);
  writeFileSync(join(packetDir, 'extracted-text.latest.txt'), `${visibleText}\n`);
  writeJson(join(packetDir, 'document-xml-inspection.latest.json'), {
    templateCode: 'BM-001',
    generatedAt: new Date().toISOString(),
    source: {
      renderPath: 'production canonical render',
      canonicalFixture: 'post-PR6G.3.1 render-bm001-canonical-signoff.mjs',
      renderedDocxSha256: renderResult.sha256,
      renderedDocxBytes: renderedBuffer.length,
    },
    engineAudit: {
      semanticStatus: renderResult.semanticStatus,
      formatStatus: renderResult.formatStatus,
      packageIntegrityStatus: renderResult.packageIntegrityStatus,
    },
    renderPlan: renderResult.renderPlan,
    textLength: visibleText.length,
    normalizedTextLength: normText.length,
  });

  const autoBlockers = checklist.filter((c) => c.status === 'FAIL').map((c) => `${c.id}: ${c.evidence}`);

  return {
    templateCode: 'BM-001',
    status: autoBlockers.length === 0 ? 'READY_FOR_HUMAN_VISUAL_REVIEW' : 'BLOCKED_PACKET_INVALID',
    autoChecks,
    autoBlockers,
    humanReviewItems: checklist
      .filter((c) => c.status === 'NEEDS_HUMAN')
      .map((c) => `${c.id}: ${c.evidence}`),
    pdfAvailable: pdfProbe.pdfAvailable,
    pdfReason: pdfProbe.reason,
    checklist,
    renderResult,
  };
}

function renderBm006Evidence() {
  const packetDir = join(OUT_DIR, 'BM-006');
  ensureDir(packetDir);

  const renderEnv = { ...process.env, REPO_ROOT };
  const renderProc = runCommand(
    'node',
    ['scripts/audit/regenerate-bm006-runtime-docx.mjs'],
    { cwd: REPO_ROOT, env: renderEnv },
  );

  if (renderProc.status !== 0) {
    throw new Error(`BM-006 render failed: ${renderProc.stderr || renderProc.stdout}`);
  }

  const outDocx = join(REPO_ROOT, '.tmp-bm006-top-right-template-calibration', 'BM-006.docx');
  if (!existsSync(outDocx)) {
    throw new Error(`BM-006 rendered DOCX missing: ${outDocx}`);
  }

  const renderedBuffer = readFileSync(outDocx);
  const sha256 = createHash('sha256').update(renderedBuffer).digest('hex');

  const zip = new PizZip(renderedBuffer);
  const visibleText = Object.values(zip.files)
    .filter((file) => file.name?.startsWith('word/') && file.name?.endsWith('.xml'))
    .map((file) => file.asText?.() || '')
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const normText = normalized(visibleText);
  const checklist = [];
  const autoChecks = { autoOk: 0, autoFail: 0, needsHuman: 0, unverified: 0, total: 0 };

  function check(id, label, evaluateFn, kind) {
    autoChecks.total += 1;
    const r = evaluateFn();
    if (r.status === 'AUTO_OK') autoChecks.autoOk += 1;
    else if (r.status === 'FAIL') autoChecks.autoFail += 1;
    else if (r.status === 'NEEDS_HUMAN') autoChecks.needsHuman += 1;
    else autoChecks.unverified += 1;
    checklist.push({ id, label, kind, status: r.status, evidence: r.evidence });
    return r;
  }

  for (const text of REQUIRED_BM006_PRESENT) {
    check(`bm006-present-${text}`, `Required-present: ${text}`, () =>
      normText.includes(text)
        ? { status: 'AUTO_OK', evidence: 'detected in rendered text' }
        : { status: 'FAIL', evidence: 'canonical string not found' },
      'auto-confirmable',
    );
  }

  for (const text of REQUIRED_BM006_ABSENT) {
    check(`bm006-absent-${text}`, `Required-absent: ${text}`, () =>
      normText.includes(text)
        ? { status: 'FAIL', evidence: 'forbidden string present' }
        : { status: 'AUTO_OK', evidence: 'forbidden string absent' },
      'auto-confirmable',
    );
  }

  const pdfProbe = tryConvertDocxToPdf(outDocx, join(packetDir, 'rendered.latest.pdf'));
  check(
    'bm006-pdf-probe',
    'PDF conversion probe',
    () => ({
      status: pdfProbe.pdfAvailable ? 'AUTO_OK' : 'NEEDS_HUMAN',
      evidence: pdfProbe.reason || 'PDF generated successfully',
    }),
    'pdf-fidelity',
  );

  writeFileSync(join(packetDir, 'rendered.latest.docx'), renderedBuffer);
  writeFileSync(join(packetDir, 'extracted-text.latest.txt'), `${visibleText}\n`);
  writeJson(join(packetDir, 'document-xml-inspection.latest.json'), {
    templateCode: 'BM-006',
    generatedAt: new Date().toISOString(),
    source: {
      renderPath: 'runtime-equivalent offline render',
      renderer: 'docxtemplater with runtime-ux demo bindings',
      renderedDocxSha256: sha256,
      renderedDocxBytes: renderedBuffer.length,
    },
    textLength: visibleText.length,
    normalizedTextLength: normText.length,
  });

  const autoBlockers = checklist.filter((c) => c.status === 'FAIL').map((c) => `${c.id}: ${c.evidence}`);

  return {
    templateCode: 'BM-006',
    status: autoBlockers.length === 0 ? 'READY_FOR_HUMAN_VISUAL_REVIEW' : 'BLOCKED_PACKET_INVALID',
    autoChecks,
    autoBlockers,
    humanReviewItems: checklist
      .filter((c) => c.status === 'NEEDS_HUMAN')
      .map((c) => `${c.id}: ${c.evidence}`),
    pdfAvailable: pdfProbe.pdfAvailable,
    pdfReason: pdfProbe.reason,
    checklist,
  };
}

function renderBm171Evidence() {
  const packetDir = join(OUT_DIR, 'BM-171');
  ensureDir(packetDir);

  const renderEnv = {
    ...process.env,
    BM171_SIGNOFF_DOCX_PATH: join(packetDir, 'rendered.latest.docx'),
    BM171_SIGNOFF_OUT_ROOT: join(REPO_ROOT, 'storage', 'temp', 'phase-8c-bm171-signoff'),
    BM171_SIGNOFF_REPO_ROOT: REPO_ROOT,
  };

  const renderProc = runCommand(
    'pnpm',
    ['--filter', 'api', 'exec', 'tsx', './scripts/render-bm171-canonical-signoff.mjs'],
    { cwd: REPO_ROOT, env: renderEnv },
  );

  if (renderProc.status !== 0) {
    throw new Error(`BM-171 render failed: ${renderProc.stderr || renderProc.stdout}`);
  }

  const lastLine = (renderProc.stdout ?? '').trim().split(/\r?\n/).pop() ?? '{}';
  const renderResult = JSON.parse(lastLine);

  if (!existsSync(renderResult.docxPath)) {
    throw new Error(`BM-171 rendered DOCX missing: ${renderResult.docxPath}`);
  }

  const renderedBuffer = readFileSync(renderResult.docxPath);
  const onDiskSha = createHash('sha256').update(renderedBuffer).digest('hex');
  if (onDiskSha !== renderResult.sha256) {
    throw new Error(`BM-171 sha256 mismatch: ${onDiskSha} !== ${renderResult.sha256}`);
  }

  const visibleText = renderResult.visibleText;
  const normText = normalized(visibleText);
  const checklist = [];
  const autoChecks = { autoOk: 0, autoFail: 0, needsHuman: 0, unverified: 0, total: 0 };

  function check(id, label, evaluateFn, kind, humanOnly = false) {
    autoChecks.total += 1;
    const r = evaluateFn();
    if (r.status === 'AUTO_OK') autoChecks.autoOk += 1;
    else if (r.status === 'FAIL') autoChecks.autoFail += 1;
    else if (r.status === 'NEEDS_HUMAN') autoChecks.needsHuman += 1;
    else autoChecks.unverified += 1;
    checklist.push({ id, label, kind, status: r.status, evidence: r.evidence, humanOnly });
    return r;
  }

  for (const text of REQUIRED_BM171_PRESENT) {
    check(`bm171-present-${text}`, `Required-present: ${text}`, () =>
      normText.includes(text)
        ? { status: 'AUTO_OK', evidence: 'detected in rendered text' }
        : { status: 'FAIL', evidence: 'canonical string not found' },
      'auto-confirmable',
    );
  }

  for (const text of REQUIRED_BM171_ABSENT) {
    check(`bm171-absent-${text}`, `Required-absent: ${text}`, () =>
      normText.includes(text)
        ? { status: 'FAIL', evidence: 'forbidden string present' }
        : { status: 'AUTO_OK', evidence: 'forbidden string absent' },
      'auto-confirmable',
    );
  }

  const pdfProbe = tryConvertDocxToPdf(
    renderResult.docxPath,
    join(packetDir, 'rendered.latest.pdf'),
  );
  check(
    'bm171-pdf-probe',
    'PDF conversion probe',
    () => ({
      status: pdfProbe.pdfAvailable ? 'AUTO_OK' : 'NEEDS_HUMAN',
      evidence: pdfProbe.reason || 'PDF generated successfully',
    }),
    'pdf-fidelity',
  );

  writeFileSync(join(packetDir, 'rendered.latest.docx'), renderedBuffer);
  writeFileSync(join(packetDir, 'extracted-text.latest.txt'), `${visibleText}\n`);
  writeJson(join(packetDir, 'document-xml-inspection.latest.json'), {
    templateCode: 'BM-171',
    generatedAt: new Date().toISOString(),
    source: {
      renderPath: 'production canonical render',
      canonicalFixture: 'render-bm171-canonical-signoff.mjs',
      renderedDocxSha256: renderResult.sha256,
      renderedDocxBytes: renderedBuffer.length,
    },
    engineAudit: {
      semanticStatus: renderResult.semanticStatus,
      formatStatus: renderResult.formatStatus,
      packageIntegrityStatus: renderResult.packageIntegrityStatus,
    },
    renderPlan: renderResult.renderPlan,
    textLength: visibleText.length,
    normalizedTextLength: normText.length,
  });

  const autoBlockers = checklist.filter((c) => c.status === 'FAIL').map((c) => `${c.id}: ${c.evidence}`);

  return {
    templateCode: 'BM-171',
    status: autoBlockers.length === 0 ? 'READY_FOR_HUMAN_VISUAL_REVIEW' : 'BLOCKED_PACKET_INVALID',
    autoChecks,
    autoBlockers,
    humanReviewItems: checklist
      .filter((c) => c.status === 'NEEDS_HUMAN')
      .map((c) => `${c.id}: ${c.evidence}`),
    pdfAvailable: pdfProbe.pdfAvailable,
    pdfReason: pdfProbe.reason,
    checklist,
    renderResult,
  };
}

function buildMarkdown(results) {
  const lines = [];
  lines.push('# Phase 8C PDF fidelity evidence');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  for (const result of results) {
    lines.push(`- ${result.templateCode}: ${result.status}`);
  }
  lines.push('');
  lines.push('## Files');
  lines.push('');
  for (const result of results) {
    lines.push(`- \`${result.templateCode}/rendered.latest.docx\``);
    lines.push(`- \`${result.templateCode}/extracted-text.latest.txt\``);
    lines.push(`- \`${result.templateCode}/document-xml-inspection.latest.json\``);
    lines.push(`- \`${result.templateCode}/visual-signoff.latest.json\``);
    if (result.pdfAvailable) {
      lines.push(`- \`${result.templateCode}/rendered.latest.pdf\``);
    } else {
      lines.push(`- \`${result.templateCode}/rendered.latest.pdf\` — UNAVAILABLE on this host: ${result.pdfReason}`);
    }
  }
  lines.push('');
  lines.push('## Operator notes');
  lines.push('');
  lines.push('- This package never mutates locked contracts, templates, DB, or migrations.');
  lines.push('- Human visual sign-off remains required before any rollout can be granted.');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  ensureDir(OUT_DIR);
  const results = [];

  for (const target of TARGETS) {
    if (target === 'BM-001') results.push(renderBm001Evidence());
    else if (target === 'BM-006') results.push(renderBm006Evidence());
    else if (target === 'BM-171') results.push(renderBm171Evidence());
  }

  for (const result of results) {
    const packetDir = join(OUT_DIR, result.templateCode);
    const autoBlockers = result.checklist.filter((c) => c.status === 'FAIL').map((c) => `${c.id}: ${c.evidence}`);
    const packetStatus = autoBlockers.length === 0 ? 'READY_FOR_HUMAN_VISUAL_REVIEW' : 'BLOCKED_PACKET_INVALID';

    writeJson(join(packetDir, 'visual-signoff.latest.json'), {
      schemaVersion: '1',
      templateCode: result.templateCode,
      generatedAt: new Date().toISOString(),
      packetStatus,
      autoChecks: result.autoChecks,
      autoBlockers,
      humanReviewItems: result.humanReviewItems,
      pdfAvailable: result.pdfAvailable,
      pdfReason: result.pdfReason,
      visualSignoffGranted: false,
      rolloutReady: false,
      checklist: result.checklist,
    });
  }

  writeFileSync(join(OUT_DIR, 'visual-signoff.latest.md'), buildMarkdown(results));
  writeJson(join(OUT_DIR, 'visual-signoff.latest.json'), {
    generatedAt: new Date().toISOString(),
    targets: TARGETS,
    results,
    nextAction:
      'Open each rendered.latest.docx in Word. After human visual sign-off, record approval in docs/audit/infrastructure-modernization/phase-8c-pdf-fidelity/.',
  });

  console.log(`[PASS] Phase 8C PDF fidelity evidence produced for: ${TARGETS.join(', ')}`);
  for (const result of results) {
    console.log(`  ${result.templateCode}: ${result.status}`);
    console.log(`    pdfAvailable=${result.pdfAvailable}${result.pdfReason ? ` reason=${result.pdfReason}` : ''}`);
  }
}

main().catch((err) => {
  console.error('[FAIL]', err && err.stack ? err.stack : String(err));
  process.exit(1);
});
