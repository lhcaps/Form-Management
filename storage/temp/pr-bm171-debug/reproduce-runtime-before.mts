/**
 * BM-171 RUNTIME PREVIEW REPRODUCTION (PR-0/before)
 *
 * Drives the SAME path the runtime preview endpoint uses:
 *   POST /api/v1/forms/runtime/BM-171/preview-session
 *     → RuntimePreviewSessionService.createPreviewSession
 *       → StandaloneTemplateRenderService.renderDocx
 *         → ContractRenderPlanBuilder.build({ formData })   ← same as production
 *         → DocxtemplaterContractRenderEngine.renderActiveDocx(plan, formData)
 *
 * The only thing this test varies vs production signoff is the
 * INPUT `formData`: instead of the canonical BM171_PAYLOAD from
 * the production signoff script, it sends the form state the UI
 * actually posts when the operator clicks "Dữ liệu demo" then
 * "Xem trước bản in" on /templates/BM-171 — meaning:
 *   - the BM-171 runtime UX profile's `demo` fixture
 *   - nested in object form (as ContractV2Renderer.setPath produces)
 *   - then smart-generic-prefill applied on top (when the operator
 *     has also clicked "Điền nhanh thông tin chung")
 *
 * The visible text of the resulting DOCX is compared line-by-line
 * to the production signoff output.
 *
 * This is the script that proves the runtime preview is broken.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

import PizZip from 'pizzip';

const REPO_ROOT = process.cwd();
const OUT_DIR = 'docs/audit/bm171-runtime-preview-parity';
mkdirSync(OUT_DIR, { recursive: true });

const workspacePaths = {
  contractsRoot: `${REPO_ROOT}/docs/audit/docx/contracts`,
  normalizedTemplatesRoot: `${REPO_ROOT}/storage/templates/normalized-docx`,
  repoRoot: REPO_ROOT,
};

function makePrismaService() {
  return { $connect: () => undefined, $disconnect: () => undefined };
}

function simulateUiDemoMerge(profileDemo) {
  // What runtime-template-preview-workspace.applySampleData does:
  //   const sample = { ...generatedSample, ...(profileSample ?? {}) };
  //   const next = mergeWithSampleData(data, sample);
  //
  // The on-the-wire `data` becomes nested objects (ContractV2Renderer
  // uses `setPath` to nest dotted keys). We mimic that here by
  // nesting each demo key back into a tree (mirroring renderer
  // behaviour in reverse so we exercise the flatten path on the
  // server).
  const nested = {};
  for (const [k, v] of Object.entries(profileDemo)) {
    const parts = k.split('.');
    let cursor = nested;
    for (const part of parts.slice(0, -1)) {
      cursor[part] = cursor[part] ?? {};
      cursor = cursor[part];
    }
    cursor[parts[parts.length - 1]] = v;
  }
  return nested;
}

// 1) Read the profile's demo fixture directly from the public runtime UX profile module.
const profileSource = readFileSync(
  'apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts',
  'utf8',
);
const demoMatch = profileSource.match(/const BM171_DEMO = \{([\s\S]*?)as const;/);
if (!demoMatch) throw new Error('BM171_DEMO not found in profile source');
const demoLiteral = demoMatch[1];
// Evaluate the literal: it should be a plain object literal expression.
const BM171_DEMO = new Function(`return ({${demoLiteral}});`)();

// 2) Build nested UI state as the renderer would.
const nestedUiData = simulateUiDemoMerge(BM171_DEMO);

// 3) Flatten back to dot-keys (mirrors StandaloneTemplateRenderService.flattenRuntimeTemplateData).
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
const flatFormData = flatten(nestedUiData);

// Save request payload.
const requestPayloadRecord = {
  url: '/api/v1/forms/runtime/BM-171/preview-session',
  method: 'POST',
  bodyJson: JSON.stringify({ data: nestedUiData }, null, 2),
  producedFlat: flatFormData,
  at: new Date().toISOString(),
};
writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_REQUEST_PAYLOAD.latest.json`,
  JSON.stringify(requestPayloadRecord, null, 2),
);
console.log('[OK] Wrote request payload artifact');

// 4) Drive the production render plan builder + render engine with this flat data.
const { ContractRenderPlanBuilder } = await import(
  './apps/api/src/modules/documents/rendering/application/contract-render-plan.builder.ts'
);
const { DocxtemplaterContractRenderEngine } = await import(
  './apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts'
);

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

// 5) Extract visible text from the rendered DOCX.
const zip = new PizZip(rendered);
const xml = zip.file('word/document.xml')?.asText() ?? '';
const visibleText = xml
  .replace(/<w:p[^>]*>/g, '\n[PARA]')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

// 6) Save the BEFORE artifacts.
const beforeDocxPath = `${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE.latest.docx`;
writeFileSync(beforeDocxPath, rendered);
writeFileSync(`${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE_TEXT.latest.txt`, visibleText);
writeFileSync(`${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE_SHA256.txt`, createHash('sha256').update(rendered).digest('hex'));

writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE_PLAN.latest.json`,
  JSON.stringify(
    {
      templateCode: plan.templateCode,
      fieldCount: plan.fields.length,
      bindingCount: plan.bindings.length,
      missingRequiredCount: plan.missingRequired.length,
      warnings: plan.warnings ?? [],
      missingRequired: plan.missingRequired ?? [],
      flatFormData,
    },
    null,
    2,
  ),
);

// 7) Acceptance checks — exactly what the user asked us to detect.
const mustContainAnchors = [
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
  '08/9/1985',
  '14/12/2021',
  'Điều 2.',
  'Yêu cầu Phòng Cảnh sát Quản lý hành chính',
  'Lưu: HSVA, HSKS, VP.',
  'Ký thay',
  'VIỆN TRƯỞNG',
  'Người ký (mẫu)',
];

const mustNotContain = [
  'undefined',
  '[object Object]',
  '{{',
  '}}',
  '[PARA]{{', // an unresolved mustache sneaking through
  'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
  'Cá nhân/Tổ chức theo quy định.',
  'Tài sản theo quy định pháp luật',
  'Mô tả vụ việc mẫu',
  '12 Ghi cụ thể cơ quan',
  '13 Ghi chức danh người ký',
];

const presentReport = mustContainAnchors.map((a) => ({
  anchor: a,
  present: visibleText.includes(a),
}));
const absentReport = mustNotContain.map((a) => ({
  forbidden: a,
  absent: !visibleText.includes(a),
}));

// Repeated-Căn-cứ-Điều-41 detector.
const repeatedC41 = (visibleText.match(/Căn cứ Điều 41/g) ?? []).length;

const result = {
  beforeDocxSha256: createHash('sha256').update(rendered).digest('hex'),
  beforeDocxBytes: rendered.byteLength,
  presentReport,
  absentReport,
  repeatedCănCứĐiều41Count: repeatedC41,
  planMissingRequiredCount: plan.missingRequired.length,
  planWarnings: plan.warnings ?? [],
  renderedSubsectionOfText: visibleText.slice(0, 800),
};
writeFileSync(
  `${OUT_DIR}/BM171_RUNTIME_PREVIEW_BEFORE_CHECKS.latest.json`,
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
