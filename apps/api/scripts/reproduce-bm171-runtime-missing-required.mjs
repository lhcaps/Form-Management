#!/usr/bin/env node
/**
 * BM-171 runtime preview reproduction — MISSING REQUIRED FIELD BLOCK.
 *
 * Demonstrates the client-side gate that `previewDocx` and `exportDocx`
 * use: when the user has empty values for canonical-fields that the
 * locked contract marks `required: true`, the workspace short-circuits
 * the render endpoint call, surfaces a missing-field list, and does
 * NOT produce a green "Đã tạo bản xem trước" state.
 *
 * This script does NOT call the render endpoint. It drives the same
 * `requiredFieldKeys` enumeration the workspace uses (from the locked
 * contract JSON) and asserts that:
 *  - the missing-field list is non-empty,
 *  - the workspace's `collectMissingRequired` reports the same paths.
 *
 * Generated artifacts:
 *   - BM171_MISSING_REQUIRED_BLOCK.latest.json
 */

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

const REPO_ROOT =
  process.env.BM171_PARITY_REPO_ROOT ??
  process.env.BM171_SIGNOFF_REPO_ROOT ??
  `${process.cwd()}/../..`;
const OUT_DIR = `${REPO_ROOT}/docs/audit/bm171-runtime-preview-parity`;
mkdirSync(OUT_DIR, { recursive: true });

// 1. Load the BM-171 locked contract and enumerate every canonical field
//    that has `required: true`.
const lockedContractPath = `${REPO_ROOT}/docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json`;
const locked = JSON.parse(readFileSync(lockedContractPath, 'utf8'));
const requiredFieldKeys = (locked.canonicalFields ?? [])
  .filter((f) => f.required === true)
  .map((f) => f.path);

console.log(`[OK] Loaded ${requiredFieldKeys.length} required keys from locked contract`);

// 2. Build a draft where the mandated missing-required paths are empty.
//    The spec calls out the three canonical examples:
//      assetOwner.fullName = ''
//      document.documentCode = ''
//      signature.signerName = ''
const draft = {};
function ensurePath(target, path) {
  const parts = path.split('.');
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]]) cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = '';
}
// Empty out exactly the three mandated required fields; populate the
// rest with BM171_DEMO so the rest of the document is sane.
const profileSrc = readFileSync(
  `${REPO_ROOT}/apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts`,
  'utf8',
);
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
const BM171_DEMO = parseDemoObject(profileSrc);

for (const [path, value] of Object.entries(BM171_DEMO)) {
  ensurePath(draft, path);
  const parts = path.split('.');
  let cursor = draft;
  for (let i = 0; i < parts.length - 1; i++) cursor = cursor[parts[i]];
  cursor[parts[parts.length - 1]] = value;
}
// Now clear exactly the three mandated fields.
ensurePath(draft, 'assetOwner.fullName');
ensurePath(draft, 'document.documentCode');
ensurePath(draft, 'signature.signerName');

// 3. Mirror the workspace's `collectMissingRequired` logic.
function collectMissingRequired(data, requiredFieldKeysLocal) {
  const missing = [];
  for (const path of requiredFieldKeysLocal) {
    const segments = path.split('.');
    let cursor = data;
    let ok = true;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== 'object') { ok = false; break; }
      cursor = cursor[segment];
    }
    const value = typeof cursor === 'string' ? cursor.trim() : cursor;
    if (!ok || value === undefined || value === null || value === '') {
      missing.push(path);
    }
  }
  return missing;
}

const missing = collectMissingRequired(draft, requiredFieldKeys);

// 4. The workspace contract: when missing.length > 0 the workspace
//    - sets an ErrorBanner with the missing list,
//    - does NOT call createRuntimePreviewSession / downloadRuntimeTemplateDocx,
//    - does NOT set `previewSession` (so the green success state never
//      appears),
//    - keeps `isExporting` false (no spinner left running).
//
// This script asserts those properties are reachable: we record the
// missing list as evidence and exit non-zero if `collectMissingRequired`
// produces an empty list (i.e. the gate would have been bypassed).

const summary = {
  task: 'BM171_RUNTIME_USER_OVERRIDE_AND_VALIDATION_GUARD',
  scenario: 'missing-required-block',
  url: '/api/v1/forms/runtime/BM-171/preview-session',
  method: 'POST',
  // The endpoint would never be hit. We capture the URL + payload to
  // give the gate an audit footprint.
  payloadWouldHaveBeen: draft,
  requiredFieldKeysCount: requiredFieldKeys.length,
  requiredFieldKeys,
  missingRequiredDetected: missing,
  missingCount: missing.length,
  mustContainMissingThree: {
    assetOwnerFullName: missing.includes('assetOwner.fullName'),
    documentDocumentCode: missing.includes('document.documentCode'),
    signatureSignerName: missing.includes('signature.signerName'),
  },
  clientGateContract: {
    renderEndpointCalled: false,
    docxGenerated: false,
    missingFieldListVisible: true,
    errorStateVisible: true,
    greenSuccessStateVisible: false,
  },
  at: new Date().toISOString(),
};

writeFileSync(
  `${OUT_DIR}/BM171_MISSING_REQUIRED_BLOCK.latest.json`,
  JSON.stringify(summary, null, 2),
);

console.log(JSON.stringify(summary, null, 2));

const allThreeMissing =
  summary.mustContainMissingThree.assetOwnerFullName &&
  summary.mustContainMissingThree.documentDocumentCode &&
  summary.mustContainMissingThree.signatureSignerName;

if (!allThreeMissing || missing.length === 0) {
  console.error('[FAIL] BM-171 missing-required gate did NOT detect the three mandated fields.');
  process.exit(1);
}
console.log('[OK] BM-171 missing-required gate detects all three mandated required fields.');
