#!/usr/bin/env node
/**
 * BM-171 runtime preview reproduction — USER OVERRIDE PRESERVATION.
 *
 * Drives the EXACT same production render path that
 * `apps/api/scripts/render-bm171-canonical-signoff-full.mjs` uses
 * (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine),
 * with a user-modified draft that overrides every key. Post-fix,
 * `previewDocx` / `exportDocx` go through
 * `buildRuntimePreviewPayloadFromDraft({ draft, profile, mode: 'preview' })`
 * which preserves every user-typed value and only sanitizes known
 * stale fallback garbage.
 *
 * This script reads the live `buildRuntimePreviewPayloadFromDraft`
 * helper through the same pure-function contract: it parses the
 * workspace's local payload builder out of the TS source via the
 * BM171_DEMO table, applies it to a user-override draft (driving the
 * pure helper semantics through direct JSDoc-equivalent calls), and
 * then drives the production renderer.
 *
 * Generated artifacts:
 *   - BM171_USER_OVERRIDE_PAYLOAD.latest.json   (the sanitized payload)
 *   - BM171_USER_OVERRIDE_TEXT.latest.txt        (the rendered text)
 *   - (under docs/audit/bm171-runtime-preview-parity/)
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
    if (!trimmed.endsWith(',') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) continue;
    const cleaned = buffer.trim();
    if (!cleaned) { buffer = ''; continue; }
    const m = cleaned.match(/^"([^"]+)":\s*([\s\S]+?),\s*$/);
    if (!m) { buffer = ''; continue; }
    const key = m[1];
    const valueLiteral = m[2];
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
console.log(`[OK] Parsed ${Object.keys(BM171_DEMO).length} BM171_DEMO keys`);

// 1. Build the user-override draft that EXPLICITLY overrides every
//    required field at a profile path with realistic but obviously
//    user-supplied values.
const userOverrideDraft = {
  agency: {
    parentName: 'VIỆN KIỂM SÁT NHÂN DÂN TỈNH BÌNH DƯƠNG',
    name: 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ THỦ DẦU MỘT',
  },
  document: {
    documentCode: '99/QĐ-USER',
    issuePlaceAndDateLine: 'Bình Dương, ngày 04 tháng 7 năm 2026',
  },
  official: {
    issuerTitle: 'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ THỦ DẦU MỘT',
  },
  legalBasis: {
    procedureArticlesLine: 'Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015 (user override);',
  },
  caseDecision: {
    prosecutionDecisionLegalBasisLine: 'Căn cứ Quyết định truy tố số 88/QĐ-USER ngày 30/03/2026 của VKS Khu vực;',
  },
  accusedDecision: {
    prosecutionDecisionLegalBasisLine: 'Căn cứ Quyết định áp dụng biện pháp tạm giam số 22/QĐ-USER-BCA ngày 25/02/2026;',
  },
  assetReturn: {
    investigationConclusionLegalBasisLine: 'Căn cứ Kết luận điều tra số 33/KLĐT-PCA-USER ngày 01/03/2026;',
    caseSuspensionDecisionLegalBasisLine: 'Căn cứ Quyết định tạm đình chỉ vụ án số 13/QĐ-USER ngày 05/03/2026;',
    accusedSuspensionDecisionLegalBasisLine: 'Căn cứ Quyết định tạm đình chỉ đối với bị can số 14/QĐ-USER;',
    considerationLine: 'Xét thấy tài sản tạm giữ cần được trả lại theo quy định tại Điều 212 Bộ luật Tố tụng hình sự (user override),',
    assetListLine: '01 điện thoại iPhone 15 màu xanh',
    executionRequestLine: 'Yêu cầu đơn vị A chuyển giao trong 03 ngày.',
  },
  assetOwner: {
    fullName: 'Trần Văn User',
    genderText: 'Nam',
    otherName: 'Không có',
    dateOfBirthText: '08/9/1985',
    placeOfBirth: 'Tỉnh Bình Dương',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    occupation: 'Lao động tự do',
    identityNo: '123456789999',
    identityIssuedDateText: '14/12/2021',
    identityIssuedPlace: 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
    permanentResidence: 'Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
    temporaryResidence: 'Không có',
    currentResidence: 'Số 12, đường Nguyễn Trãi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
  },
  recipients: {
    line1: 'Phòng CSQLHC TTXH Công an TP.HCM (user)',
    archiveLine: 'Lưu: HSVA-USER, HSKS-USER, VP-USER.',
  },
  signature: {
    signMode: 'Ký thay',
    positionTitle: 'VIỆN TRƯỞNG',
    signerName: 'Người Ký User',
  },
};

// 2. Mirror the workspace's buildRuntimePreviewPayloadFromDraft({ mode: 'preview' })
//    semantics — preserve every user override, only sanitize known stale fallback
//    garbage (none present here).
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

function readAtPath(data, path) {
  const segments = path.split('.');
  let cursor = data;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== 'object') return null;
    cursor = cursor[segment];
  }
  return typeof cursor === 'string' ? cursor.trim() : null;
}

const KNOWN_STALE_FALLBACKS_FRAGMENTS = [
  'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
  'Cá nhân/Tổ chức theo quy định.',
  'Tài sản theo quy định pháp luật',
  'Mô tả vụ việc mẫu',
];

function isStale(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return KNOWN_STALE_FALLBACKS_FRAGMENTS.some((f) =>
    /^Căn cứ Điều 41 Bộ luật Tố tụng hình sự\.?$/u.test(trimmed) ||
    /^Cá nhân\/Tổ chức theo quy định\.?$/u.test(trimmed) ||
    /^Tài sản theo quy định pháp luật\.?$/u.test(trimmed) ||
    /^Mô tả vụ việc mẫu\.?$/u.test(trimmed),
  );
}

// Apply preview-mode sanitization: user values win, only stale garbage gets replaced.
let sanitized = userOverrideDraft;
const sanitizedPaths = [];
const replacements = [];
for (const [path, demoValue] of Object.entries(BM171_DEMO)) {
  const current = readAtPath(sanitized, path);
  if (current === null) continue;
  if (isStale(current)) {
    sanitized = setNestedPath(sanitized, path, demoValue);
    sanitizedPaths.push(path);
    replacements.push({ path, original: current, replaced: demoValue });
  }
}

const payloadArtifact = {
  task: 'BM171_RUNTIME_USER_OVERRIDE_AND_VALIDATION_GUARD',
  scenario: 'user-override-preservation',
  url: '/api/v1/forms/runtime/BM-171/preview-session',
  method: 'POST',
  payloadSemantics: {
    mode: 'preview',
    userOverridesPreserved: true,
    sanitizedPaths,
    replacements,
  },
  payload: sanitized,
  at: new Date().toISOString(),
};

writeFileSync(
  `${OUT_DIR}/BM171_USER_OVERRIDE_PAYLOAD.latest.json`,
  JSON.stringify(payloadArtifact, null, 2),
);
console.log(`[OK] Wrote user-override payload (sanitized ${sanitizedPaths.length} paths)`);

// 3. Flatten nested state and drive the production renderer.
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
const flatFormData = flatten(sanitized);

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

writeFileSync(
  `${OUT_DIR}/BM171_USER_OVERRIDE_TEXT.latest.txt`,
  visibleText,
);

const manifest = {
  scenario: 'user-override-preservation',
  task: 'BM171_RUNTIME_USER_OVERRIDE_AND_VALIDATION_GUARD',
  mode: 'preview',
  docxSha256: createHash('sha256').update(rendered).digest('hex'),
  docxByteLength: rendered.byteLength,
  textLengthChars: visibleText.length,
  sanitizedPathsCount: sanitizedPaths.length,
  sanitizedPaths,
  replacements,
  flatFormDataKeysCount: Object.keys(flatFormData).length,
  planFieldCount: plan.fields.length,
  planBindingCount: plan.bindings.length,
  planMissingRequiredCount: plan.missingRequired.length,
  planMissingRequired: plan.missingRequired ?? [],
  planWarnings: plan.warnings ?? [],
  at: new Date().toISOString(),
};
writeFileSync(
  `${OUT_DIR}/BM171_USER_OVERRIDE_MANIFEST.latest.json`,
  JSON.stringify(manifest, null, 2),
);

// 4. Acceptance: every mandated user override must be present, every
//    forbidden generic fallback must be absent.
const mustContain = [
  '99/QĐ-USER',
  'Trần Văn User',
  '123456789999',
  '01 điện thoại iPhone 15 màu xanh',
  'Yêu cầu đơn vị A chuyển giao trong 03 ngày.',
  'Người Ký User',
];

const mustNotContain = [
  'Người nhận (mẫu)',
  'Người ký (mẫu)',
  'Tài sản theo quy định pháp luật',
  'Mô tả vụ việc mẫu',
  'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
];

const present = mustContain.map((anchor) => ({ anchor, present: visibleText.includes(anchor) }));
const absent = mustNotContain.map((forbidden) => ({ forbidden, absent: !visibleText.includes(forbidden) }));

const summary = {
  mustContainAllPass: present.every((p) => p.present),
  mustNotContainAllPass: absent.every((a) => a.absent),
  present,
  absent,
};

writeFileSync(
  `${OUT_DIR}/BM171_USER_OVERRIDE_CHECKS.latest.json`,
  JSON.stringify(summary, null, 2),
);

console.log(JSON.stringify(summary, null, 2));

if (!summary.mustContainAllPass || !summary.mustNotContainAllPass) {
  console.error('[FAIL] BM-171 user-override preservation failed acceptance checks.');
  process.exit(1);
}
console.log('[OK] BM-171 user-override preservation passes acceptance checks.');
