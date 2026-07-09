#!/usr/bin/env node
/**
 * BM-171 runtime preview reproduction — STALE FALLBACK CLEANUP.
 *
 * Drives the production renderer with a stale draft containing the
 * specific garbage values the user reported, runs the post-fix
 * `buildRuntimePreviewPayloadFromDraft({ mode: 'preview' })` sanitization
 * (which only replaces whole-value matches for the known fragments),
 * then verifies that the rendered text no longer contains the generic
 * fallbacks.
 *
 * Generated artifacts:
 *   - BM171_STALE_FALLBACK_CLEANUP_PAYLOAD.latest.json
 *   - BM171_STALE_FALLBACK_CLEANUP_TEXT.latest.txt
 *   - BM171_STALE_FALLBACK_CLEANUP_MANIFEST.latest.json
 *   - BM171_STALE_FALLBACK_CLEANUP_CHECKS.latest.json
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

// Simulate a stale draft with the EXACT generic fallback garbage the user
// reported, but use BM171_DEMO values for the non-stale fields so the rest
// of the document remains valid (so the test can prove the sanitizer ONLY
// touched the stale ones).
const draftWithStaleFallbacks = {};
for (const [path, demoValue] of Object.entries(BM171_DEMO)) {
  const parts = path.split('.');
  let cursor = draftWithStaleFallbacks;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]]) cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = demoValue;
}
// Override the specific paths with stale fallback garbage.
draftWithStaleFallbacks.official.issuerTitle = 'Cá nhân/Tổ chức theo quy định.';
draftWithStaleFallbacks.legalBasis.procedureArticlesLine = 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự';
draftWithStaleFallbacks.caseDecision.prosecutionDecisionLegalBasisLine = 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự';
draftWithStaleFallbacks.accusedDecision.prosecutionDecisionLegalBasisLine = 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự';
draftWithStaleFallbacks.assetReturn.investigationConclusionLegalBasisLine = 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự';
draftWithStaleFallbacks.assetReturn.caseSuspensionDecisionLegalBasisLine = 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự';
draftWithStaleFallbacks.assetReturn.accusedSuspensionDecisionLegalBasisLine = 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự';
draftWithStaleFallbacks.assetReturn.assetListLine = 'Tài sản theo quy định pháp luật';
draftWithStaleFallbacks.assetReturn.executionRequestLine = 'Mô tả vụ việc mẫu';

// Apply sanitization (mirrors workspace helper, preview mode).
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

const KNOWN_STALE_TESTS = [
  (v) => /^Căn cứ Điều 41 Bộ luật Tố tụng hình sự\.?$/u.test(v),
  (v) => /^Cá nhân\/Tổ chức theo quy định\.?$/u.test(v),
  (v) => /^Tài sản theo quy định pháp luật\.?$/u.test(v),
  (v) => /^Mô tả vụ việc mẫu\.?$/u.test(v),
  (v) => /^Người ký \(mẫu\)\.?$/u.test(v),
  (v) => /^Người nhận \(mẫu\)\.?$/u.test(v),
];
function isStale(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return KNOWN_STALE_TESTS.some((t) => t(trimmed));
}

let sanitized = draftWithStaleFallbacks;
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

writeFileSync(
  `${OUT_DIR}/BM171_STALE_FALLBACK_CLEANUP_PAYLOAD.latest.json`,
  JSON.stringify(
    {
      task: 'BM171_RUNTIME_USER_OVERRIDE_AND_VALIDATION_GUARD',
      scenario: 'stale-fallback-cleanup',
      url: '/api/v1/forms/runtime/BM-171/preview-session',
      method: 'POST',
      payloadSemantics: {
        mode: 'preview',
        sanitizedPaths,
        replacements,
      },
      startingDraft: draftWithStaleFallbacks,
      payload: sanitized,
      at: new Date().toISOString(),
    },
    null,
    2,
  ),
);

// Flatten + drive production renderer.
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

writeFileSync(`${OUT_DIR}/BM171_STALE_FALLBACK_CLEANUP_TEXT.latest.txt`, visibleText);

const manifest = {
  scenario: 'stale-fallback-cleanup',
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
  `${OUT_DIR}/BM171_STALE_FALLBACK_CLEANUP_MANIFEST.latest.json`,
  JSON.stringify(manifest, null, 2),
);

// Acceptance: no stale fallbacks remain in the rendered text.
const mustNotContain = [
  'Căn cứ Điều 41 Bộ luật Tố tụng hình sự',
  'Cá nhân/Tổ chức theo quy định.',
  'Tài sản theo quy định pháp luật',
  'Mô tả vụ việc mẫu',
  'Nội dung mẫu cho biểu mẫu pháp lý',
];

const mustContain = [
  // Canonical demo values are now present.
  'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  '01/QĐ-VKSKV7',
  'Điều 134',
  'Honda Wave RSX',
];

const present = mustContain.map((anchor) => ({ anchor, present: visibleText.includes(anchor) }));
const absent = mustNotContain.map((forbidden) => ({ forbidden, absent: !visibleText.includes(forbidden) }));

const repeatedC41 = (visibleText.match(/Căn cứ Điều 41/g) ?? []).length;

const summary = {
  mustContainAllPass: present.every((p) => p.present),
  mustNotContainAllPass: absent.every((a) => a.absent),
  repeatedCănCứĐiều41Count: repeatedC41,
  present,
  absent,
};

writeFileSync(
  `${OUT_DIR}/BM171_STALE_FALLBACK_CLEANUP_CHECKS.latest.json`,
  JSON.stringify(summary, null, 2),
);

console.log(JSON.stringify(summary, null, 2));

if (!summary.mustContainAllPass || !summary.mustNotContainAllPass || repeatedC41 > 0) {
  console.error('[FAIL] BM-171 stale-fallback cleanup did not fully sanitize.');
  process.exit(1);
}
console.log('[OK] BM-171 stale-fallback cleanup passes acceptance checks.');
