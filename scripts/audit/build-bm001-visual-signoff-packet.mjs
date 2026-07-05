#!/usr/bin/env node
/**
 * PR6G.5.1 — BM-001 Visual Sign-off Packet Builder
 *
 * Goal: compose a single folder of evidence so a human/Planner can eyeball
 * the canonical rendered BM-001 DOCX and decide whether visual style
 * sign-off is granted.
 *
 * Pipeline:
 *   1. Shell out to apps/api/scripts/render-bm001-canonical-signoff.mjs which
 *      invokes the PRODUCTION render path:
 *        - ContractRenderPlanBuilder
 *        - DocxtemplaterContractRenderEngine (renderShadow)
 *        - shared mapping toolkit (@qllaw/form-contracts)
 *        - BM-001 style profile engine
 *      Canonical fixture (post-PR6G.3.1) renders:
 *        - "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026"
 *        - "Hồi 08:00 , ngày 26 tháng 12 năm 2025, tại TP. Hồ Chí Minh"
 *        - "Cấp ngày 07 tháng 06 năm 2020"
 *        - "Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi 10:00 ngày 26 tháng 12 năm 2025."
 *        - "Lưu: HSVA, HSKS, VP."
 *      and ABSENT:
 *        - "Lưu: HSVV, VP." (legacy hardcode)
 *        - "- Lưu: HSVA, HSKS, VP." (dash prefix)
 *        - "ngày 4 tháng 7 năm 2026" (zero-stripped)
 *        - "{{" / undefined / null / [object Object] / Invalid Date (placeholder leak)
 *
 *   2. Verify every REQUIRED_PRESENT and REQUIRED_ABSENT string in the actual
 *      rendered text. Failures → AUTO_FAIL in the visual-signoff packet.
 *
 *   3. Probe soffice/libreoffice + pdftoppm. If unavailable, record
 *      pdfAvailable:false / pngAvailable:false honestly.
 *
 *   4. Emit the packet under docs/audit/bm-visual-signoff/BM-001/.
 *
 *   5. visualSignoffGranted is ALWAYS false from this script.
 *      rolloutReady is ALWAYS false from this script.
 *      BM-171 / mass rollout / locked mutation never happen.
 *
 * Exit codes:
 *   0 — packet produced (canonical render OK)
 *   1 — infra failure (template / locked contract / render error)
 *   2 — invalid usage (no / wrong target)
 *
 * Refusal-first: refuses to run for any target other than BM-001. Refuses
 * to write artefacts for BM-002..BM-213.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const ALLOWED_TARGETS = new Set(['BM-001']);
const TARGET = process.argv[2] ?? '';

if (!TARGET) {
  console.error(
    '[FAIL] Missing target. Usage: node scripts/audit/build-bm001-visual-signoff-packet.mjs BM-001',
  );
  process.exit(2);
}
if (!ALLOWED_TARGETS.has(TARGET)) {
  console.error(
    `[FAIL] PR6G.5.1 only prepares evidence for ${Array.from(
      ALLOWED_TARGETS,
    ).join(', ')}. Refusing to run for ${TARGET} (no mass rollout, no BM-002..BM-213).`,
  );
  process.exit(2);
}

const OUTPUT_DIR = join(REPO_ROOT, 'docs', 'audit', 'bm-visual-signoff', TARGET);
const TEMP_SHADOW_ROOT = join(
  REPO_ROOT,
  'storage',
  'temp',
  'pr6g51-bm001-canonical-signoff',
);
const RENDERED_DOCX_PATH = join(OUTPUT_DIR, 'rendered.latest.docx');

const TEMPLATE_PATH = join(
  REPO_ROOT,
  'storage',
  'templates',
  'normalized-docx',
  TARGET,
  `${TARGET}_normalized.docx`,
);
const LOCKED_CONTRACT_PATH = join(
  REPO_ROOT,
  'docs',
  'audit',
  'docx',
  'contracts',
  'locked',
  `${TARGET}__f4c2aa3682d3.contract.locked.json`,
);

if (!existsSync(TEMPLATE_PATH)) {
  console.error(`[FAIL] Normalized template missing: ${TEMPLATE_PATH}`);
  process.exit(1);
}
if (!existsSync(LOCKED_CONTRACT_PATH)) {
  console.error(`[FAIL] Locked contract missing: ${LOCKED_CONTRACT_PATH}`);
  process.exit(1);
}

// ─── Canonical fixture (mirrors pr6g31-bm001-rendered-docx-parity.spec.ts) ─

const CANONICAL_REQUIRED_PRESENT = [
  'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026',
  'Cấp ngày 07 tháng 06 năm 2020',
  'Hồi 08:00',
  'ngày 26 tháng 12 năm 2025',
  'tại TP. Hồ Chí Minh',
  'hồi 10:00 ngày 26 tháng 12 năm 2025',
  'Lưu: HSVA, HSKS, VP.',
];

const CANONICAL_REQUIRED_ABSENT = [
  'Lưu: HSVV, VP.',
  '- Lưu: HSVA, HSKS, VP.',
  'ngày 4 tháng 7 năm 2026',
  'Cấp ngày 7/6/2020',
  '{{',
  'undefined',
  '[object Object]',
  'Invalid Date',
];

// ─── Invoke production render path via tsx in apps/api workspace ────────────

console.log('[INFO] Triggering production render path (canonical fixture)...');
const renderEnv = {
  ...process.env,
  BM001_SIGNOFF_DOCX_PATH: RENDERED_DOCX_PATH,
  BM001_SIGNOFF_OUT_ROOT: TEMP_SHADOW_ROOT,
  BM001_SIGNOFF_REPO_ROOT: REPO_ROOT,
};

const renderProc = spawnSync(
  'pnpm',
  ['--filter', 'api', 'exec', 'tsx', './scripts/render-bm001-canonical-signoff.mjs'],
  {
    cwd: REPO_ROOT,
    env: renderEnv,
    encoding: 'utf-8',
    shell: true,
  },
);

if (renderProc.status !== 0) {
  console.error(
    '[FAIL] production render path failed:\n' + (renderProc.stderr || renderProc.stdout || '<no output>'),
  );
  process.exit(1);
}

const lastLine = (renderProc.stdout ?? '').trim().split(/\r?\n/).pop() ?? '{}';
let renderResult;
try {
  renderResult = JSON.parse(lastLine);
} catch (err) {
  console.error('[FAIL] Could not parse render helper stdout as JSON:', err.message);
  console.error('stdout:', renderProc.stdout);
  process.exit(1);
}

if (!existsSync(renderResult.docxPath)) {
  console.error(`[FAIL] Rendered DOCX missing: ${renderResult.docxPath}`);
  process.exit(1);
}

const renderedBuffer = readFileSync(renderResult.docxPath);
const onDiskSha = createHash('sha256').update(renderedBuffer).digest('hex');
if (onDiskSha !== renderResult.sha256) {
  console.error(
    `[FAIL] sha256 mismatch after write: in-memory=${renderResult.sha256}, on-disk=${onDiskSha}`,
  );
  process.exit(1);
}

console.log('[PASS] Renderer: production (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine)');
console.log(`[PASS] Scenario: canonical final-evidence fixture (post-PR6G.3.1)`);
console.log(`[PASS] Rendered DOCX sha256: ${renderResult.sha256}`);
console.log(`[PASS] Rendered DOCX bytes:  ${renderResult.byteLength}`);
console.log(`[PASS] Semantic: ${renderResult.semanticStatus}, Format: ${renderResult.formatStatus}, Package: ${renderResult.packageIntegrityStatus}`);

// ─── Verify canonical strings against actual rendered text ─────────────────

const visibleText = renderResult.visibleText;
function normalized(s) {
  return s.replace(/[ \t]+/g, ' ').replace(/\n[ \t\n]*/g, '\n').trim();
}
const normText = normalized(visibleText);

function check(id, label, evaluateFn, kind) {
  const r = evaluateFn();
  return { id, label, kind, status: r.status, evidence: r.evidence };
}

// Required-present (canonical)
const presentChecks = CANONICAL_REQUIRED_PRESENT.map((s, idx) =>
  check(
    `required-present-${idx + 1}`,
    `Canonical required-present: "${s}"`,
    () =>
      normText.includes(s)
        ? { status: 'AUTO_OK', evidence: 'detected in rendered DOCX visible text' }
        : {
            status: 'FAIL',
            evidence: `canonical string NOT FOUND in rendered DOCX text`,
          },
    'auto-confirmable',
  ),
);

// Required-absent (drift)
const absentChecks = CANONICAL_REQUIRED_ABSENT.map((s, idx) =>
  check(
    `required-absent-${idx + 1}`,
    `Canonical forbidden: "${s}"`,
    () =>
      normText.includes(s)
        ? {
            status: 'FAIL',
            evidence: `FORBIDDEN drift string PRESENT in rendered DOCX`,
          }
        : {
            status: 'AUTO_OK',
            evidence: 'forbidden drift string not present',
          },
    'auto-confirmable',
  ),
);

// null token check (whitespace-bounded so "Lưu: HSVA, HSKS, VP." doesn't match \bnull\b)
const nullTokenCheck = check(
  'required-absent-null-bounded',
  'Canonical forbidden: literal "null" as standalone token',
  () => {
    const m = visibleText.match(/(^|[^A-Za-zÀ-ỹ])null([^A-Za-zÀ-ỹ]|$)/u);
    return m
      ? { status: 'FAIL', evidence: `literal "null" token detected at offset ${m.index}` }
      : { status: 'AUTO_OK', evidence: 'no standalone "null" token' };
  },
  'auto-confirmable',
);

// Human-only visual style checks (Planner eyeball still required)
const humanOnlyChecks = [
  {
    id: 'human-right-align',
    label: 'Header date line is right-aligned (visual)',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual paragraph alignment — open rendered.latest.docx in Word',
  },
  {
    id: 'human-vks-underline',
    label: 'VKS underline length is visually correct',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual underline width — open rendered.latest.docx in Word',
  },
  {
    id: 'human-thong-tu-size-8',
    label: '"Ban hành theo Thông tư…" remains size 8',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual font size — open rendered.latest.docx in Word',
  },
  {
    id: 'human-bien-ban-bold-14',
    label: 'Title "BIÊN BẢN" bold + 14pt',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual weight + size — open rendered.latest.docx in Word',
  },
  {
    id: 'human-subtitle-bold-14',
    label: 'Subtitle "Tiếp nhận nguồn tin về tội phạm" bold + 14pt',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual weight + size — open rendered.latest.docx in Word',
  },
  {
    id: 'human-headings-i-ii-bold-14',
    label: 'I. NỘI DUNG / II. CÁC TÀI LIỆU bold + 14pt',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual weight + size — open rendered.latest.docx in Word',
  },
  {
    id: 'human-signature-titles-bold-14',
    label: 'Signature titles bold + 14pt',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual weight + size — open rendered.latest.docx in Word',
  },
  {
    id: 'human-page-numbers',
    label: 'Page numbers visually acceptable',
    kind: 'human-only',
    status: 'NEEDS_HUMAN',
    evidence: 'visual — open rendered.latest.docx in Word',
  },
];

// Structural presence checks (auto-confirmable, was NEEDS_HUMAN in v1)
const structuralPresenceChecks = [
  {
    id: 'structural-quoc-hieu',
    label: 'Quốc hiệu "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" present',
    kind: 'auto-confirmable',
    status: /CỘNG\s+HÒA\s+XÃ\s+HỘI\s+CHỦ\s+NGHĨA\s+VIỆT\s+NAM/u.test(
      visibleText,
    )
      ? 'AUTO_OK'
      : 'FAIL',
    evidence: 'auto-detected from rendered DOCX visible text',
  },
  {
    id: 'structural-tieu-ngu',
    label: 'Tiêu ngữ "Độc lập – Tự do – Hạnh phúc" present',
    kind: 'auto-confirmable',
    status: /Độc\s*lập\s*[-–—]\s*Tự\s*do\s*[-–—]\s*Hạnh\s*phúc/u.test(
      visibleText,
    ) || /Độc\s*lập\s*-\s*Tự\s*do\s*-\s*Hạnh\s*phúc/u.test(
      visibleText,
    )
      ? 'AUTO_OK'
      : 'NEEDS_HUMAN',
    evidence: 'auto-detected from rendered DOCX visible text (tolerates both – and -)',
  },
  {
    id: 'structural-bien-ban-title',
    label: 'Title "BIÊN BẢN" present',
    kind: 'auto-confirmable',
    status: /BIÊN\s+BẢN/u.test(visibleText) ? 'AUTO_OK' : 'FAIL',
    evidence: 'auto-detected from rendered DOCX visible text',
  },
  {
    id: 'structural-subtitle',
    label: 'Subtitle "Tiếp nhận nguồn tin về tội phạm" present',
    kind: 'auto-confirmable',
    status: /Tiếp\s+nhận\s+nguồn\s+tin\s+về\s+tội\s+phạm/u.test(visibleText)
      ? 'AUTO_OK'
      : 'FAIL',
    evidence: 'auto-detected from rendered DOCX visible text',
  },
  {
    id: 'structural-end-line',
    label: 'End-of-reception line present',
    kind: 'auto-confirmable',
    status: /Việc\s+tiếp\s+nhận\s+nguồn\s+tin\s+về\s+tội\s+phạm\s+kết\s+thúc/u.test(
      visibleText,
    )
      ? 'AUTO_OK'
      : 'FAIL',
    evidence: 'auto-detected from rendered DOCX visible text',
  },
  {
    id: 'structural-no-noi-nhan',
    label: 'No "Nơi nhận:" because BM-001 is NOT_APPLICABLE_BY_TEMPLATE',
    kind: 'auto-confirmable',
    status: /Nơi\s+nhận:/u.test(visibleText) ? 'FAIL' : 'AUTO_OK',
    evidence: 'auto-detected from rendered DOCX visible text',
  },
];

const checklist = [
  ...presentChecks,
  ...absentChecks,
  nullTokenCheck,
  ...structuralPresenceChecks,
  ...humanOnlyChecks,
];

const autoOk = checklist.filter((c) => c.status === 'AUTO_OK').length;
const autoFail = checklist.filter((c) => c.status === 'FAIL').length;
const needsHuman = checklist.filter((c) => c.status === 'NEEDS_HUMAN').length;
const unverified = checklist.filter((c) => c.status === 'UNVERIFIED').length;

// ─── Best-effort PDF / PNG probe ────────────────────────────────────────────

function sofficePath() {
  for (const candidate of ['soffice', 'libreoffice']) {
    const probe = spawnSync('where.exe', [candidate], {
      shell: true,
      encoding: 'utf-8',
    });
    if (probe.status === 0) return candidate;
  }
  return null;
}

function tryRenderPdfAndPng(docxPath, outputDir) {
  const binary = sofficePath();
  if (!binary) {
    return {
      pdfAvailable: false,
      pngAvailable: false,
      reason: 'soffice/libreoffice not available in PATH on this Windows host',
    };
  }
  mkdirSync(outputDir, { recursive: true });
  const pdfOut = spawnSync(
    binary,
    ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, docxPath],
    { shell: true, encoding: 'utf-8' },
  );
  const pdfCandidates = readdirSync(outputDir).filter((f) =>
    f.toLowerCase().endsWith('.pdf'),
  );
  if (pdfCandidates.length === 0) {
    return {
      pdfAvailable: false,
      pngAvailable: false,
      reason: `soffice invocation failed: ${(pdfOut.stderr ?? '').slice(0, 200)}`,
    };
  }
  const pdfPath = join(outputDir, pdfCandidates[0]);
  const pdftoppm = spawnSync('where.exe', ['pdftoppm'], {
    shell: true,
    encoding: 'utf-8',
  });
  let pngAvailable = false;
  if (pdftoppm.status === 0) {
    spawnSync('pdftoppm', ['-png', '-r', '120', pdfPath, join(outputDir, 'page')], {
      shell: true,
      encoding: 'utf-8',
    });
    pngAvailable = readdirSync(outputDir).filter((f) => f.toLowerCase().endsWith('.png'))
      .length > 0;
  }
  return {
    pdfAvailable: true,
    pngAvailable,
    reason: pngAvailable
      ? null
      : 'PDF generated but pdftoppm not available; PNG skipped honestly',
  };
}

const pdfProbe = tryRenderPdfAndPng(RENDERED_DOCX_PATH, OUTPUT_DIR);

// ─── Emit packet ────────────────────────────────────────────────────────────

mkdirSync(OUTPUT_DIR, { recursive: true });

// rendered DOCX (already copied by helper)
writeFileSync(join(OUTPUT_DIR, 'rendered.latest.docx'), renderedBuffer);

// extracted text
writeFileSync(
  join(OUTPUT_DIR, 'extracted-text.latest.txt'),
  `${visibleText}\n`,
);

// document xml inspection (lightweight summary)
const documentXmlInspection = {
  templateCode: TARGET,
  generatedAt: new Date().toISOString(),
  source: {
    renderPath: 'production (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine)',
    canonicalFixture: 'post-PR6G.3.1 (matches pr6g31-bm001-rendered-docx-parity.spec.ts)',
    shadowPath: renderResult.shadowPath,
    manifestPath: renderResult.manifestPath,
    renderedDocxSha256: renderResult.sha256,
    renderedDocxBytes: renderResult.byteLength,
  },
  engineAudit: {
    semanticStatus: renderResult.semanticStatus,
    formatStatus: renderResult.formatStatus,
    packageIntegrityStatus: renderResult.packageIntegrityStatus,
  },
  renderPlan: renderResult.renderPlan,
  textLength: visibleText.length,
  normalizedTextLength: normText.length,
};
writeFileSync(
  join(OUTPUT_DIR, 'document-xml-inspection.latest.json'),
  `${JSON.stringify(documentXmlInspection, null, 2)}\n`,
);

// visual signoff JSON
const autoBlockers = checklist
  .filter((c) => c.status === 'FAIL')
  .map((c) => `${c.id}: ${c.evidence}`);

const packetStatus = autoBlockers.length === 0
  ? 'READY_FOR_HUMAN_VISUAL_REVIEW'
  : 'BLOCKED_PACKET_INVALID';

const visualSignoff = {
  schemaVersion: '1',
  templateCode: TARGET,
  generatedAt: new Date().toISOString(),
  packetStatus,
  packetSource: 'production render via DocxtemplaterContractRenderEngine + canonical fixture',
  packetProvenance: {
    renderPath: 'apps/api/scripts/render-bm001-canonical-signoff.mjs',
    canonicalFixture:
      'matches apps/api/src/.../pr6g31-bm001-rendered-docx-parity.spec.ts',
    renderedDocxSha256: renderResult.sha256,
    renderedDocxBytes: renderResult.byteLength,
    manifestPath: renderResult.manifestPath,
    shadowPath: renderResult.shadowPath,
    semanticStatus: renderResult.semanticStatus,
    formatStatus: renderResult.formatStatus,
    packageIntegrityStatus: renderResult.packageIntegrityStatus,
  },
  pdfAvailable: pdfProbe.pdfAvailable,
  pngAvailable: pdfProbe.pngAvailable,
  pdfReason: pdfProbe.reason ?? null,
  autoChecks: { autoOk, autoFail, needsHuman, unverified, total: checklist.length },
  checklist,
  autoBlockers,
  humanReviewItems: checklist
    .filter((c) => c.status === 'NEEDS_HUMAN')
    .map((c) => `${c.id}: ${c.evidence}`),
  visualSignoffGranted: false,
  rolloutReady: false,
  nextAction: packetStatus === 'READY_FOR_HUMAN_VISUAL_REVIEW'
    ? 'Open docs/audit/bm-visual-signoff/BM-001/rendered.latest.docx (or PDF/PNG if available) in Word. Walk the 8 NEEDS_HUMAN visual checks (bold/size/alignment/underline/page-numbers). Only Planner eyeball can flip visualSignoffGranted=true. After sign-off, re-run `pnpm audit:bm-rollout-ready -- BM-001`.'
    : 'Packet is INVALID_FOR_SIGNOFF. Auto-failures detected in the canonical render output. Investigate the autoBlockers list and fix the underlying regression before requesting sign-off.',
};
writeFileSync(
  join(OUTPUT_DIR, 'visual-signoff.latest.json'),
  `${JSON.stringify(visualSignoff, null, 2)}\n`,
);

// markdown
const md = [];
md.push(`# ${TARGET} Visual Sign-off Packet`);
md.push('');
md.push(`**STATUS**: \`${packetStatus}\``);
md.push(`**visualSignoffGranted**: false (this script NEVER grants sign-off)`);
md.push(`**rolloutReady**: false (PR6G.5 gate stays at BLOCKED_MANUAL_REVIEW)`);
md.push(`**Generated**: ${new Date().toISOString()}`);
md.push(`**Render path**: production (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine)`);
md.push(`**Canonical fixture**: post-PR6G.3.1 — matches \`pr6g31-bm001-rendered-docx-parity.spec.ts\``);
md.push(`**Rendered DOCX sha256**: \`${renderResult.sha256}\``);
md.push(`**Engine audit**: semantic=${renderResult.semanticStatus}, format=${renderResult.formatStatus}, package=${renderResult.packageIntegrityStatus}`);
md.push('');
md.push('## Packet Files');
md.push('');
md.push('- `rendered.latest.docx` — fresh canonical render, open this in Word');
md.push('- `extracted-text.latest.txt` — flat visible text');
md.push('- `document-xml-inspection.latest.json` — render provenance + engine audit');
md.push('- `visual-signoff.latest.json` — full checklist (auto / human / canonical)');
md.push('- `visual-signoff.latest.md` — this file');
if (pdfProbe.pdfAvailable) md.push('- `rendered.latest.pdf` — soffice-converted (best-effort)');
else md.push('- `rendered.latest.pdf` — UNAVAILABLE on this host');
if (pdfProbe.pngAvailable) md.push('- `page-*.latest.png` — pdftoppm rasterised pages');
else md.push('- `page-*.png` — UNAVAILABLE on this host');
md.push('');
if (!pdfProbe.pdfAvailable || !pdfProbe.pngAvailable) {
  md.push('## Honest Report — PDF / PNG availability');
  md.push('');
  md.push(`This host lacks LibreOffice / soffice${pdfProbe.pngAvailable ? '' : ' and pdftoppm'}.`);
  md.push('DOCX + OOXML inspection is the only visual evidence available.');
  md.push('Planner must open the DOCX in Microsoft Word to complete visual sign-off.');
  md.push('');
}
md.push('## Canonical Required-Present checks (auto-confirmable)');
md.push('');
md.push('| # | Check | Status | Evidence |');
md.push('|---|---|---|---|');
presentChecks.forEach((c, idx) => md.push(
  `| ${idx + 1} | ${c.label} | \`${c.status}\` | ${c.evidence} |`,
));
md.push('');
md.push('## Canonical Forbidden-Drift checks (auto-confirmable)');
md.push('');
md.push('| # | Check | Status | Evidence |');
md.push('|---|---|---|---|');
[...absentChecks, nullTokenCheck].forEach((c, idx) => md.push(
  `| ${idx + 1} | ${c.label} | \`${c.status}\` | ${c.evidence} |`,
));
md.push('');
md.push('## Structural Presence checks (auto-confirmable)');
md.push('');
md.push('| Check | Status | Evidence |');
md.push('|---|---|---|');
structuralPresenceChecks.forEach((c) => md.push(
  `| ${c.label} | \`${c.status}\` | ${c.evidence} |`,
));
md.push('');
md.push('## Human-Only Visual checks (Planner eyeball required)');
md.push('');
md.push('| Check | Status | Evidence |');
md.push('|---|---|---|');
humanOnlyChecks.forEach((c) => md.push(
  `| ${c.label} | \`${c.status}\` | ${c.evidence} |`,
));
md.push('');
md.push('## Auto vs Human split');
md.push('');
md.push(`- AUTO_OK: **${autoOk}**`);
md.push(`- AUTO_FAIL: **${autoFail}**`);
md.push(`- NEEDS_HUMAN: **${needsHuman}**`);
md.push(`- UNVERIFIED: **${unverified}**`);
md.push('');
if (autoBlockers.length > 0) {
  md.push('## Auto Blockers');
  md.push('');
  for (const b of autoBlockers) md.push(`- ${b}`);
  md.push('');
}
md.push('## Visual Sign-off Reminder');
md.push('');
md.push('- This script never flips `visualSignoffGranted` to true.');
md.push('- The PR6G.5 rollout gate (`pnpm audit:bm-rollout-ready -- BM-001`) stays `BLOCKED_MANUAL_REVIEW` until a Planner eyeball confirms.');
md.push('- No BM-171 implementation, no mass rollout, no locked DOCX/template mutation.');
md.push('');
writeFileSync(join(OUTPUT_DIR, 'visual-signoff.latest.md'), `${md.join('\n')}\n`);

console.log('');
console.log(`[INFO] Packet built under: ${OUTPUT_DIR}`);
console.log(`[INFO] Packet status: ${packetStatus}`);
console.log(`[INFO] Auto OK ${autoOk} / FAIL ${autoFail} / NEEDS_HUMAN ${needsHuman} / UNVERIFIED ${unverified}`);
console.log(`[INFO] PDF available: ${pdfProbe.pdfAvailable}, PNG available: ${pdfProbe.pngAvailable}`);
console.log(`[INFO] Visual sign-off NOT granted by this script.`);
console.log(`[INFO] rolloutReady reflected: false.`);
console.log(`[INFO] BM-171 remains blocked.`);
console.log('');

if (packetStatus === 'BLOCKED_PACKET_INVALID') {
  console.error(
    '[FAIL] Packet is BLOCKED_PACKET_INVALID due to auto-failures; refusing to claim sign-off readiness.',
  );
  process.exit(1);
}

process.exit(0);