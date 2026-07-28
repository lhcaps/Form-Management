#!/usr/bin/env node
/**
 * BM-171 runtime preview reproduction — BEFORE fix.
 *
 * Drives the EXACT same production render path that
 * `apps/api/scripts/render-bm171-canonical-signoff-full.mjs` uses
 * (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine)
 * but with the input that the BM-171 runtime preview UI actually
 * posts: the BM-171 runtime UX profile's `demo` fixture,
 * nested into objects as `ContractV2Renderer.setPath` produces,
 * then flattened back server-side just like
 * `StandaloneTemplateRenderService.flattenRuntimeTemplateData`.
 */

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

import PizZip from 'pizzip';
import { ContractRenderPlanBuilder } from '../src/modules/documents/rendering/application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from '../src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine';

const REPO_ROOT =
  process.env.BM171_PARITY_REPO_ROOT ??
  process.env.BM171_SIGNOFF_REPO_ROOT ??
  `${process.cwd()}/../..`;
const OUT_DIR = `${REPO_ROOT}/docs/audit/bm171-runtime-preview-parity`;
mkdirSync(OUT_DIR, { recursive: true });

const workspacePaths = {
  contractsRoot: `${REPO_ROOT}/docs/audit/docx/contracts`,
  normalizedTemplatesRoot: `${REPO_ROOT}/storage/templates/normalized-docx`,
  repoRoot: REPO_ROOT,
};

function makePrismaService() {
  return { $connect: () => undefined, $disconnect: () => undefined };
}

// 1. Read the runtime UX profile source and pull BM171_DEMO out.
// We parse line-by-line: every line inside `const BM171_DEMO = { … } as
// const` looks like `  "key": "value",` or multi-line string with `\n`
// continuations.
function parseDemoObject(source) {
  const startIdx = source.indexOf('const BM171_DEMO = {');
  if (startIdx < 0) throw new Error('BM171_DEMO not found');
  const openIdx = source.indexOf('{', startIdx);
  // Walk to matching closing brace at column 0.
  let depth = 0;
  let endIdx = -1;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }
  const body = source.slice(openIdx + 1, endIdx);

  const result = {};
  // Each entry:   "key.with.dots": "...value..."[,]
  const lines = body.split('\n');
  let buffer = '';
  for (let raw of lines) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('//') || !trimmed) continue;
    buffer += raw + '\n';
    // Heuristic: line ends with `,` or `},` and no open quote dangling.
    if (!trimmed.endsWith(',') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
      continue;
    }
    // Try parsing the buffer as a JSON-ish `key: value` pair.
    const cleaned = buffer.trim();
    if (!cleaned) { buffer = ''; continue; }
    const m = cleaned.match(/^"([^"]+)":\s*([\s\S]+?),\s*$/);
    if (!m) { buffer = ''; continue; }
    const key = m[1];
    let valueLiteral = m[2];
    // valueLiteral is a double-quoted JS string; eval it back to a string.
    // eslint-disable-next-line no-eval
    const value = (0, eval)(`(${valueLiteral})`);
    result[key] = value;
    buffer = '';
  }
  return result;
}

const profileSrc = readFileSync(
  `${REPO_ROOT}/apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts`,
  'utf8',
);
const BM171_DEMO = parseDemoObject(profileSrc);
if (Object.keys(BM171_DEMO).length === 0) {
  console.error('[FAIL] BM171_DEMO parsed empty');
  process.exit(2);
}
console.log(`[OK] Parsed ${Object.keys(BM171_DEMO).length} BM171_DEMO keys`);

// 2. Build the nested UI state (mirrors ContractV2Renderer.setPath).
function setPath(target, path, value) {
  const next = JSON.parse(JSON.stringify(target));
  const parts = path.split('.');
  let cursor = next;
  for (const p of parts.slice(0, -1)) {
    if (!cursor[p] || typeof cursor[p] !== 'object') cursor[p] = {};
    cursor = cursor[p];
  }
  cursor[parts[parts.length - 1]] = value;
  return next;
}

let nestedState = {};
for (const [k, v] of Object.entries(BM171_DEMO)) {
  nestedState = setPath(nestedState, k, v);
}

writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_REQUEST_PAYLOAD.latest.json`,
  JSON.stringify(
    {
      url: '/api/v1/forms/runtime/BM-171/preview-session',
      method: 'POST',
      postedJson: JSON.stringify({ data: nestedState }, null, 2),
      nestedState,
      producedFromProfile: 'apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts BM171_DEMO',
      at: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log('[OK] Wrote request payload artifact');

// 3. Flatten back to dot-keys (mirrors flattenRuntimeTemplateData).
function flatten(value, prefix = '', out = {}) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) out[prefix] = value;
    return out;
  }
  for (const [k, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${k}` : k;
    flatten(v, path, out);
  }
  return out;
}
const flatFormData = flatten(nestedState);

// 4. Drive the production renderer.
const plan = new ContractRenderPlanBuilder(
  makePrismaService(),
  workspacePaths,
).build({
  documentId: 'standalone:BM-171',
  templateCode: 'BM-171',
  sourceId: 'standalone:BM-171',
  formData: flatFormData,
});

const rendered = await new DocxtemplaterContractRenderEngine(
  workspacePaths,
).renderActiveDocx(plan, flatFormData);

// 5. Extract visible text.
const zip = new PizZip(rendered);
const xml = zip.file('word/document.xml')?.asText() ?? '';
const visibleText = xml
  .replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// 6. Save BEFORE artifacts.
const beforeDocxPath = `${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE.latest.docx`;
mkdirSync(dirname(beforeDocxPath), { recursive: true });
writeFileSync(beforeDocxPath, rendered);

const beforeTextPath = `${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE_TEXT.latest.txt`;
writeFileSync(beforeTextPath, visibleText);

writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE_MANIFEST.latest.json`,
  JSON.stringify(
    {
      docxPath: beforeDocxPath,
      textPath: beforeTextPath,
      sha256: createHash('sha256').update(rendered).digest('hex'),
      byteLength: rendered.byteLength,
      fixtureSource:
        'apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts BM171_DEMO',
      flatFormDataKeysCount: Object.keys(flatFormData).length,
      flatFormDataKeys: Object.keys(flatFormData),
      planFieldCount: plan.fields.length,
      planBindingCount: plan.bindings.length,
      planMissingRequiredCount: plan.missingRequired.length,
      planMissingRequired: plan.missingRequired ?? [],
      planWarnings: plan.warnings ?? [],
      at: new Date().toISOString(),
    },
    null,
    2,
  ),
);

// 7. Acceptance checks.
const mustContain = [
  'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
  'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  '01/QĐ-VKSKV7',
  'QUYẾT ĐỊNH',
  'TRẢ LẠI TÀI SẢN',
  'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  'Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015',
  'Căn cứ Quyết định truy tố',
  'Căn cứ Quyết định áp dụng biện pháp tạm giam',
  'Căn cứ Kết luận điều tra',
  'Căn cứ Quyết định tạm đình chỉ vụ án',
  'Căn cứ Quyết định tạm đình chỉ đối với bị can',
  'Xét thấy tài sản bị tạm giữ',
  'Điều 1.',
  '01 chiếc xe máy Honda Wave RSX',
  '01 sổ tiết kiệm',
  'Cho ông/bà:',
  '08/09/1985',
  '14/12/2021',
  'Điều 2.',
  'Yêu cầu Phòng Cảnh sát Quản lý hành chính',
  'Lưu: HSVA, HSKS, VP.',
  'Ký thay',
  'VIỆN TRƯỞNG',
  // BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX —
  // demo reset must produce real synthetic owner/signer names, never
  // placeholder labels.
  'Nguyễn Văn A',
  'Trần Thị B',
];

const mustNotContain = [
  'undefined',
  '[object Object]',
  '{{',
  '}}',
  '{{{',
  '}}}',
  'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
  'Cá nhân/Tổ chức theo quy định.',
  'Tài sản theo quy định pháp luật',
  'Mô tả vụ việc mẫu',
  '12 Ghi cụ thể cơ quan',
  '13 Ghi chức danh người ký',
  // BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX —
  // placeholder required values must NEVER leak into the render text.
  'Người nhận (mẫu)',
  'Người ký (mẫu)',
  'người nhận (mẫu)',
];

const presentReport = mustContain.map((a) => ({
  anchor: a,
  present: visibleText.includes(a),
}));
const absentReport = mustNotContain.map((a) => ({
  forbidden: a,
  absent: !visibleText.includes(a),
}));

const repeatedC41 = (visibleText.match(/Căn cứ Điều 41/g) ?? []).length;
const summary = {
  mustContainAll: presentReport.every((r) => r.present),
  mustNotContainAll: absentReport.every((r) => r.absent),
  repeatedCănCứĐiều41Count: repeatedC41,
  presentReport,
  absentReport,
};

writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE_CHECKS.latest.json`,
  JSON.stringify(summary, null, 2),
);

console.log(JSON.stringify(summary, null, 2));

if (!summary.mustContainAll || !summary.mustNotContainAll || repeatedC41 > 0) {
  console.error('[FAIL] BM-171 runtime preview BEFORE fix does not match production semantics.');
  process.exit(1);
}
console.log('[OK] BM-171 runtime preview BEFORE fix matches production semantics.');
