#!/usr/bin/env node
/**
 * PR7A.4 — BM-171 source-vs-render parity audit.
 *
 * Read-only. Does NOT mutate the normalized DOCX, the locked
 * contract, or any other template. Reads:
 *
 *   - The BM-171 source normalized DOCX at
 *     `storage/templates/normalized-docx/BM-171/BM-171_normalized.docx`.
 *   - The BM-171 latest visual-signoff rendered DOCX at
 *     `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx`.
 *
 * Emits:
 *
 *   - docs/audit/unified-bm-workspace/PR7A4_BM171_SOURCE_RENDER_PARITY.latest.md
 *   - docs/audit/unified-bm-workspace/PR7A4_BM171_SOURCE_RENDER_PARITY.latest.json
 *
 * 37 required-present assertions are run against the rendered DOCX
 * visible text — every one of them must pass for the PR7A.4 packet to
 * remain `READY_FOR_PLANNER_REVIEW`. The required-absent assertions
 * also include the drafter-note residue guard (`12 Ghi …`, `13 Ghi
 * …`) and the standard PR6G.2 drift guards (`undefined`,
 * `[object Object]`, `Invalid Date`, etc.).
 *
 * Refusal-first: refuses to run for any target other than BM-171.
 *
 * Exit codes:
 *   0 — every required-present PASS and every required-absent PASS
 *   1 — at least one assertion FAIL
 *   2 — usage error
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const ALLOWED_TARGETS = new Set(['BM-171']);
const TARGET = process.argv[2] ?? '';

if (!ALLOWED_TARGETS.has(TARGET)) {
  console.error(
    `[FAIL] PR7A.4 parity audit only supports ${Array.from(
      ALLOWED_TARGETS,
    ).join(', ')}. Refusing to run for ${TARGET}.`,
  );
  process.exit(2);
}

const FIXTURE_VARIANT = process.argv[3] ?? 'full';
const SOURCE_DOCX = join(
  REPO_ROOT,
  'storage',
  'templates',
  'normalized-docx',
  TARGET,
  `${TARGET}_normalized.docx`,
);
const RENDERED_DOCX = join(
  REPO_ROOT,
  'docs',
  'audit',
  'bm-visual-signoff',
  TARGET,
  'rendered.latest.docx',
);
const OUT_DIR = join(REPO_ROOT, 'docs', 'audit', 'unified-bm-workspace');
const OUT_MD = join(OUT_DIR, `PR7A4_${TARGET}_SOURCE_RENDER_PARITY.latest.md`);
const OUT_JSON = join(OUT_DIR, `PR7A4_${TARGET}_SOURCE_RENDER_PARITY.latest.json`);

if (!existsSync(SOURCE_DOCX)) {
  console.error(`[FAIL] Source normalized DOCX missing: ${SOURCE_DOCX}`);
  process.exit(1);
}
if (!existsSync(RENDERED_DOCX)) {
  console.error(`[FAIL] Rendered DOCX missing: ${RENDERED_DOCX}`);
  process.exit(1);
}

// ─── helpers ───────────────────────────────────────────────────────────────

function extractDocXmlText(buffer) {
  const zip = new PizZip(buffer);
  const entry = zip.file('word/document.xml');
  if (!entry) return { text: '', docXml: null };
  const docXml = entry.asText();
  const text = docXml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, docXml };
}

function listZipParts(buffer) {
  const zip = new PizZip(buffer);
  return Object.keys(zip.files).sort();
}

function sha256hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

const REQUIRED_PRESENT = [
  'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
  'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  '01/QĐ-VKSKV7',
  'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026',
  'QUYẾT ĐỊNH',
  'TRẢ LẠI TÀI SẢN',
  'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  'Căn cứ Điều 134',
  'Căn cứ Quyết định truy tố số 02/QĐ-VKS-KV7',
  'Căn cứ Quyết định áp dụng biện pháp tạm giam',
  'Căn cứ Kết luận điều tra số 21/KLĐT-PCA',
  'Căn cứ Quyết định tạm đình chỉ vụ án',
  'Căn cứ Quyết định tạm đình chỉ đối với bị can',
  'Xét thấy tài sản bị tạm giữ',
  'QUYẾT ĐỊNH',
  'Điều 1. Trả lại tài sản',
  'Điều 1',
  'xe máy Honda Wave RSX',
  'sổ tiết kiệm Ngân hàng TMCP Ngoại thương Việt Nam',
  'Nguyễn Văn A',
  'Giới tính',
  'Nam',
  'Sinh ngày 08/09/1985',
  'Tỉnh Bình Dương',
  'Quốc tịch',
  'Việt Nam',
  'Dân tộc',
  'Kinh',
  'Nghề nghiệp',
  'Lao động tự do',
  '079085001234',
  'Cấp ngày 14/12/2021',
  'Phường Bến Nghé',
  'Điều 2',
  'Yêu cầu Phòng Cảnh sát',
  'Nơi nhận',
  'Lưu: HSVA, HSKS, VP.',
  'Ký thay',
  'Trần Thị B',
];

const REQUIRED_ABSENT = [
  '12 Ghi cụ thể cơ quan',
  '13 Ghi chức danh người ký',
  'Lưu: HSVV, VP.',
  '- Lưu: HSVA, HSKS, VP.',
  'ngày 04 tháng 7 năm 2026',
  '{{assetOwner.fullName}}',
  '{{document.issuePlaceAndDateLine}}',
  '{{recipients.archiveLine}}',
  '{{{',
  '}}}',
  'undefined',
  'null',
  '[object Object]',
  'Invalid Date',
];

const HEADER_STRUCTURE_PRESERVED = [
  'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
  'Độc lập',
  'Tự do',
  'Hạnh phúc',
];

const XML_PARTS_EXPECTED = [
  '[Content_Types].xml',
  '_rels/.rels',
  'word/document.xml',
  'word/styles.xml',
  'word/settings.xml',
];

// ─── main ──────────────────────────────────────────────────────────────────

const sourceBuffer = readFileSync(SOURCE_DOCX);
const sourceSha = sha256hex(sourceBuffer);
const sourceParts = listZipParts(sourceBuffer);
const { text: sourceText, docXml: sourceDocXml } = extractDocXmlText(sourceBuffer);

const renderedBuffer = readFileSync(RENDERED_DOCX);
const renderedSha = sha256hex(renderedBuffer);
const renderedParts = listZipParts(renderedBuffer);
const { text: renderedText, docXml: renderedDocXml } = extractDocXmlText(renderedBuffer);

const presentResults = REQUIRED_PRESENT.map((needle) => {
  const sourceHas = sourceText.includes(needle);
  const renderedHas = renderedText.includes(needle);
  return {
    needle,
    sourceHas,
    renderedHas,
    pass: renderedHas,
    note: sourceHas
      ? `also present in source DOCX`
      : `not present in source DOCX — comes from fixture payload`,
  };
});

const absentResults = REQUIRED_ABSENT.map((needle) => {
  const sourceHas = sourceText.includes(needle);
  const renderedHas = renderedText.includes(needle);
  return {
    needle,
    sourceHas,
    renderedHas,
    pass: !renderedHas,
    note: sourceHas
      ? `present in source DOCX (template residue — suppression must drop it)`
      : `not present in source DOCX — synthetic check`,
  };
});

const headerPreserved = HEADER_STRUCTURE_PRESERVED.map((needle) => ({
  needle,
  renderedHas: renderedText.includes(needle),
  pass: renderedText.includes(needle),
}));

const superscriptPattern = /<w:vertAlign\s+w:val="superscript"/g;
const superscriptMatches =
  (renderedDocXml ?? '').match(superscriptPattern) ?? [];

const xmlPartsChecks = XML_PARTS_EXPECTED.map((partName) => {
  const present = renderedParts.includes(partName);
  return { partName, present, pass: present };
});

const openabilityHints = {
  contentTypesXml: renderedParts.includes('[Content_Types].xml'),
  rels: renderedParts.includes('_rels/.rels'),
  wordDocument: renderedParts.includes('word/document.xml'),
  wordStyles: renderedParts.includes('word/styles.xml'),
  wordSettings: renderedParts.includes('word/settings.xml'),
  totalPartCount: renderedParts.length,
  byteLength: renderedBuffer.byteLength,
  sha256: renderedSha,
};

const presentPass = presentResults.filter((r) => r.pass).length;
const presentFail = presentResults.filter((r) => !r.pass).length;
const absentPass = absentResults.filter((r) => r.pass).length;
const absentFail = absentResults.filter((r) => !r.pass).length;
const headerPass = headerPreserved.filter((h) => h.pass).length;
const xmlPartsPass = xmlPartsChecks.filter((p) => p.pass).length;

const superscriptAbsentInBody =
  !renderedDocXml || superscriptMatches.length === 0;

const overallPass =
  presentFail === 0 &&
  absentFail === 0 &&
  headerPass === headerPreserved.length &&
  superscriptAbsentInBody &&
  xmlPartsPass === xmlPartsChecks.length;

const report = {
  schemaVersion: '1',
  templateCode: TARGET,
  fixtureVariant: FIXTURE_VARIANT,
  generatedAt: new Date().toISOString(),
  source: {
    path: SOURCE_DOCX,
    sha256: sourceSha,
    byteLength: sourceBuffer.byteLength,
    partCount: sourceParts.length,
    visibleTextLength: sourceText.length,
    documentXmlByteLength: (sourceDocXml ?? '').length,
  },
  rendered: {
    path: RENDERED_DOCX,
    sha256: renderedSha,
    byteLength: renderedBuffer.byteLength,
    partCount: renderedParts.length,
    visibleTextLength: renderedText.length,
    documentXmlByteLength: (renderedDocXml ?? '').length,
    ...openabilityHints,
  },
  requiredPresentAssertions: {
    total: presentResults.length,
    pass: presentPass,
    fail: presentFail,
    results: presentResults,
  },
  requiredAbsentAssertions: {
    total: absentResults.length,
    pass: absentPass,
    fail: absentFail,
    results: absentResults,
  },
  headerStructurePreserved: headerPreserved,
  superscriptCountInRenderedBody: superscriptMatches.length,
  xmlPartsHealth: xmlPartsChecks,
  overallPass,
  packetStatus: overallPass
    ? 'READY_FOR_PLANNER_REVIEW'
    : 'BLOCKED_PARITY_FAILED',
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

const md = [];
md.push(`# PR7A.4 — ${TARGET} Source-vs-Render Parity Audit`);
md.push('');
md.push(`**STATUS**: \`${report.packetStatus}\``);
md.push(`**Generated**: ${report.generatedAt}`);
md.push(`**Fixture variant**: ${FIXTURE_VARIANT}`);
md.push('');
md.push(`## Source DOCX`);
md.push('');
md.push(`- Path: \`${SOURCE_DOCX}\``);
md.push(`- sha256: \`${sourceSha}\``);
md.push(`- bytes: ${sourceBuffer.byteLength}`);
md.push(`- parts: ${sourceParts.length}`);
md.push('');
md.push(`## Rendered DOCX`);
md.push('');
md.push(`- Path: \`${RENDERED_DOCX}\``);
md.push(`- sha256: \`${renderedSha}\``);
md.push(`- bytes: ${renderedBuffer.byteLength}`);
md.push(`- parts: ${renderedParts.length}`);
md.push(`- visible-text length: ${renderedText.length}`);
md.push('');
md.push(`## Required-Present assertions (auto-confirmable)`);
md.push('');
md.push(`Total: **${presentResults.length}**, pass: **${presentPass}**, fail: **${presentFail}**`);
md.push('');
md.push('| # | needle | rendered has? | pass | note |');
md.push('|---|---|---|---|---|');
presentResults.forEach((r, idx) =>
  md.push(`| ${idx + 1} | ${r.needle.slice(0, 80)} | ${r.renderedHas ? 'yes' : 'NO'} | ${r.pass ? 'PASS' : '**FAIL**'} | ${r.note} |`),
);
md.push('');
md.push(`## Required-Absent assertions (auto-confirmable)`);
md.push('');
md.push(`Total: **${absentResults.length}**, pass: **${absentPass}**, fail: **${absentFail}**`);
md.push('');
md.push('| # | forbidden | rendered has? | pass | note |');
md.push('|---|---|---|---|---|');
absentResults.forEach((r, idx) =>
  md.push(`| ${idx + 1} | ${r.needle} | ${r.renderedHas ? '**YES (leak)**' : 'no'} | ${r.pass ? 'PASS' : '**FAIL**'} | ${r.note} |`),
);
md.push('');
md.push(`## Header structure preservation`);
md.push('');
md.push('| needle | rendered has? | pass |');
md.push('|---|---|---|');
headerPreserved.forEach((h) => md.push(`| ${h.needle} | ${h.renderedHas ? 'yes' : 'NO'} | ${h.pass ? 'PASS' : '**FAIL**'} |`));
md.push('');
md.push(`## XML / package parts health`);
md.push('');
md.push('| part | present | pass |');
md.push('|---|---|---|');
xmlPartsChecks.forEach((p) => md.push(`| ${p.partName} | ${p.present ? 'yes' : 'NO'} | ${p.pass ? 'PASS' : '**FAIL**'} |`));
md.push('');
md.push(`## Superscript marker audit (PR7A.3 drafter-note signature)`);
md.push('');
md.push(`- body-level &lt;w:vertAlign w:val="superscript"/&gt; runs in rendered DOCX: **${superscriptMatches.length}**`);
md.push(`- expected: 0 (the drafter-note paragraphs are suppression-eligible)`);
md.push(`- ${superscriptAbsentInBody ? 'PASS' : '**FAIL**'}`);
md.push('');
md.push(`## Acceptance`);
md.push('');
md.push(`- Required-present: ${presentFail === 0 ? 'PASS' : '**FAIL**'} (${presentPass}/${presentResults.length})`);
md.push(`- Required-absent:  ${absentFail === 0 ? 'PASS' : '**FAIL**'} (${absentPass}/${absentResults.length})`);
md.push(`- Header structure: ${headerPass === headerPreserved.length ? 'PASS' : '**FAIL**'} (${headerPass}/${headerPreserved.length})`);
md.push(`- Superscript absent in body: ${superscriptAbsentInBody ? 'PASS' : '**FAIL**'}`);
md.push(`- XML parts health: ${xmlPartsPass === xmlPartsChecks.length ? 'PASS' : '**FAIL**'} (${xmlPartsPass}/${xmlPartsChecks.length})`);
md.push('');
writeFileSync(OUT_MD, `${md.join('\n')}\n`);

console.log(`[INFO] wrote ${OUT_JSON}`);
console.log(`[INFO] wrote ${OUT_MD}`);
console.log(
  `[INFO] present ${presentPass}/${presentResults.length}, absent ${absentPass}/${absentResults.length}, header ${headerPass}/${headerPreserved.length}, superscript ${superscriptAbsentInBody ? 0 : 'LEAK'}, xml parts ${xmlPartsPass}/${xmlPartsChecks.length}, overall ${overallPass ? 'PASS' : 'FAIL'}`,
);
process.exit(overallPass ? 0 : 1);
