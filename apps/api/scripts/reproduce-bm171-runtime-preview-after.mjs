/**
 * BM-171 runtime preview AFTER state.
 *
 * Drives the SAME production render path as
 * `reproduce-bm171-runtime-preview-before.mjs` but with the
 * post-fix canonical-baseline recompute applied to `data`. The
 * baseline recompute is the runtime preview workspace's
 * `buildRuntimePreviewCanonicalBaseline(data, uxProfile)`.
 *
 * That function forces every profile.demo path to the demo value.
 * This script reproduces the same effect (forcing uxProfile.demo onto
 * data) and then drives the production renderer the same way.
 */

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';

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
function parseDemoObject(source) {
  const startIdx = source.indexOf('const BM171_DEMO = {');
  if (startIdx < 0) throw new Error('BM171_DEMO not found');
  const openIdx = source.indexOf('{', startIdx);
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
  let buffer = '';
  for (let raw of body.split('\n')) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('//') || !trimmed) continue;
    buffer += raw + '\n';
    if (!trimmed.endsWith(',') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
      continue;
    }
    const cleaned = buffer.trim();
    if (!cleaned) { buffer = ''; continue; }
    const m = cleaned.match(/^"([^"]+)":\s*([\s\S]+?),\s*$/);
    if (!m) { buffer = ''; continue; }
    const key = m[1];
    let valueLiteral = m[2];
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
console.log(`[OK] Parsed ${Object.keys(BM171_DEMO).length} BM171_DEMO keys`);

// 2. Simulate a stale-draft state: data contains the bad
//    generateFieldValue fallbacks, exactly as the user reports.
const staleData = {
  legalBasis: {
    procedureArticlesLine: 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
  },
  caseDecision: {
    prosecutionDecisionLegalBasisLine: 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
  },
  accusedDecision: {
    prosecutionDecisionLegalBasisLine: 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
  },
  assetReturn: {
    investigationConclusionLegalBasisLine: 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
    caseSuspensionDecisionLegalBasisLine: 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
    accusedSuspensionDecisionLegalBasisLine: 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
    considerationLine: 'Xét thấy cần thiết áp dụng biện pháp theo quy định.',
    assetListLine: 'Tài sản theo quy định pháp luật.',
    executionRequestLine: 'Mô tả vụ việc mẫu.',
  },
  official: {
    issuerTitle: 'Cá nhân/Tổ chức theo quy định.',
  },
};

// 3. Apply the canonical-baseline recompute (mirrors
//    buildRuntimePreviewCanonicalBaseline in the workspace).
function setNestedPath(target, path, value) {
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

let baselineData = staleData;
for (const [path, value] of Object.entries(BM171_DEMO)) {
  baselineData = setNestedPath(baselineData, path, value);
}

writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_AFTER_REQUEST_PAYLOAD.latest.json`,
  JSON.stringify(
    {
      url: '/api/v1/forms/runtime/BM-171/preview-session',
      method: 'POST',
      postedJson: JSON.stringify({ data: baselineData }, null, 2),
      baselineData,
      producedFromProfile: 'apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts BM171_DEMO',
      at: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log('[OK] Wrote after request payload artifact');

// 4. Flatten.
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
const flatFormData = flatten(baselineData);

// 5. Drive the production renderer.
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

// 6. Extract visible text.
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

// 7. Save AFTER artifacts.
const afterDocxPath = `${OUT_DIR}/BM171_RUNTIME_PREVIEW_AFTER.latest.docx`;
writeFileSync(afterDocxPath, rendered);

const afterTextPath = `${OUT_DIR}/BM171_RUNTIME_PREVIEW_AFTER_TEXT.latest.txt`;
writeFileSync(afterTextPath, visibleText);

writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_AFTER_MANIFEST.latest.json`,
  JSON.stringify(
    {
      docxPath: afterDocxPath,
      textPath: afterTextPath,
      sha256: createHash('sha256').update(rendered).digest('hex'),
      byteLength: rendered.byteLength,
      fixtureSource:
        'apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts BM171_DEMO (re-asserted over a simulated stale draft)',
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

// 8. Same acceptance checks.
const mustContain = [
  'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
  'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  '01/QĐ-VKSKV7',
  'TP. Hồ Chí Minh, ngày 04 tháng 7 năm 2026',
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
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_AFTER_CHECKS.latest.json`,
  JSON.stringify(summary, null, 2),
);

console.log(JSON.stringify(summary, null, 2));

if (!summary.mustContainAll || !summary.mustNotContainAll || repeatedC41 > 0) {
  console.error('[FAIL] BM-171 runtime preview AFTER fix does not match production semantics.');
  process.exit(1);
}
console.log('[OK] BM-171 runtime preview AFTER fix matches production semantics.');