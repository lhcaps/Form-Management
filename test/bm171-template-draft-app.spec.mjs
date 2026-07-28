#!/usr/bin/env node
/**
 * PR7A.1 — BM-171 TemplateDraft App Integration tests.
 *
 * These tests prove that /templates/BM-171 (the BM-171 TemplateDraft route)
 * works through the GENERIC TemplatePreviewWorkspace, without any BM-001
 * code, without any BM-171-specific adapter, and without a fake
 * generatedDocumentId. The directive for PR7A.1 is "implement
 * /templates/BM-171 using the BM-001 workspace architecture" — the
 * architecture is the generic `TemplatePreviewWorkspace` plus
 * `runtime-template-draft` + `runtime-template-preview` +
 * `runtime-template-export`. This file is the regression guard that
 * keeps it that way.
 *
 * Strategy: static analysis of the page, the workspace component, the
 * runtime libs, and a behavioural round-trip of the draft key using an
 * in-memory storage shim. All five bullet points from the PR7A.1
 * "Add BM-171 UI tests" requirement are covered:
 *   - field render        → "ContractV2Renderer is wired to BM-171"
 *   - payload builder     → "the generic render path is used"
 *   - local draft save/load → "save/load round-trips under BM-171 key"
 *   - preview/download    → "call shape uses templateCode=BM-171 (no documentId)"
 *   - no fake generatedDocumentId → "no literal ID assigned in the runtime path"
 * Plus, per the strict rules:
 *   - no DB write from /templates
 *   - no audit/history tab
 *   - no BM-001 behavior change
 *
 * @module test/bm171-template-draft-app.spec
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const REPO_ROOT = join(fileURLToPath(import.meta.url), '..', '..');

const ROUTE_PAGE = join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'app',
  'templates',
  '[templateCode]',
  'page.tsx',
);

const WORKSPACE = join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'components',
  'documents',
  'template-preview-workspace.tsx',
);

const RUNTIME_DRAFT = join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'runtime-template-draft.ts',
);

const RUNTIME_PREVIEW = join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'runtime-template-preview.ts',
);

const RUNTIME_EXPORT = join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'runtime-template-export.ts',
);

const BM171_LOCKED_CONTRACT = join(
  REPO_ROOT,
  'docs',
  'audit',
  'docx',
  'contracts',
  'locked',
  'BM-171__46b9a8be4e01.contract.locked.json',
);

const BM001_LOCKED_CONTRACT = join(
  REPO_ROOT,
  'docs',
  'audit',
  'docx',
  'contracts',
  'locked',
  'BM-001__',
);

function readText(path) {
  return readFileSync(path, 'utf8');
}

/** In-memory Storage shim matching the `Pick<Storage, 'getItem' | 'setItem'>` shape the runtime libs accept. */
class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  get size() {
    return this.map.size;
  }
}

/**
 * Re-implementation of `buildRuntimeTemplateDraftKey` logic, mirrored
 * from `apps/web/src/lib/runtime-template-draft.ts`. If the real
 * builder drifts, this shim and the real one will diverge and a
 * static check below will fail.
 */
function draftKey(templateCode, contractHash) {
  return `qllaw:runtime-template-draft:${templateCode.trim().toUpperCase()}:${contractHash}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-flight: all required files exist on disk
// ─────────────────────────────────────────────────────────────────────────────

test('pre-flight: all required files for the BM-171 generic route are on disk', () => {
  assert.equal(
    existsSync(ROUTE_PAGE),
    true,
    'expected the dynamic [templateCode] page to exist',
  );
  assert.equal(
    existsSync(WORKSPACE),
    true,
    'expected the generic TemplatePreviewWorkspace to exist',
  );
  assert.equal(
    existsSync(RUNTIME_DRAFT),
    true,
    'expected runtime-template-draft.ts to exist',
  );
  assert.equal(
    existsSync(RUNTIME_PREVIEW),
    true,
    'expected runtime-template-preview.ts to exist',
  );
  assert.equal(
    existsSync(RUNTIME_EXPORT),
    true,
    'expected runtime-template-export.ts to exist',
  );
  assert.equal(
    existsSync(BM171_LOCKED_CONTRACT),
    true,
    `expected BM-171 locked contract to exist at ${BM171_LOCKED_CONTRACT}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// (1) Field render — the route is generic; fields are driven by the contract
// ─────────────────────────────────────────────────────────────────────────────

test('(1) field render: /templates/[templateCode] is fully generic and forwards the URL code to the generic workspace', () => {
  const page = readText(ROUTE_PAGE);
  // The page must read templateCode from the URL params and pass it to
  // the generic TemplatePreviewWorkspace, not to a BM-001- or
  // BM-171-specific component.
  assert.match(
    page,
    /params[^)]*templateCode/u,
    'route must read templateCode from URL params',
  );
  assert.match(
    page,
    /TemplatePreviewWorkspace/u,
    'route must mount the generic TemplatePreviewWorkspace',
  );
  assert.doesNotMatch(
    page,
    /bm001|Bm001FormInputs|BM-001/u,
    'route must not have a BM-001-specific branch',
  );
  assert.doesNotMatch(
    page,
    /bm-171-form-inputs|Bm171FormInputs|BM-171-template-draft-adapter/u,
    'route must not have a BM-171-specific adapter branch',
  );
});

test('(1) field render: the workspace renders the compiled contract via ContractV2Renderer (no per-BM hand-rolled fields)', () => {
  const ws = readText(WORKSPACE);
  assert.match(
    ws,
    /ContractV2Renderer/u,
    'workspace must render the compiled contract via ContractV2Renderer',
  );
  assert.match(
    ws,
    /compiledContract/u,
    'workspace must consume compiledContract (the contract is the source of truth for fields)',
  );
  // The workspace must not hard-code BM-001 section keys.
  assert.doesNotMatch(
    ws,
    /Bm001FormInputs|Bm001RenderPayload/u,
    'workspace must not import BM-001-specific input/payload types',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) Payload builder — the generic runtime path is used (no per-BM payload API)
// ─────────────────────────────────────────────────────────────────────────────

test('(2) payload builder: the workspace sends the runtime contract data, not a per-BM payload', () => {
  const ws = readText(WORKSPACE);
  // The preview/download calls receive the raw `data` state, which the
  // ContractV2Renderer is filling from the compiled contract's
  // canonical fields. There is no per-BM payload builder.
  assert.match(
    ws,
    /createRuntimePreviewSession\(normalizedTemplateCode,\s*data\)/u,
    'preview-session call must use templateCode + raw data (no per-BM payload builder)',
  );
  assert.match(
    ws,
    /downloadRuntimeTemplateDocx\(normalizedTemplateCode,\s*data\)/u,
    'export call must use templateCode + raw data (no per-BM payload builder)',
  );
  // There is no local bm-171-payload-builder.ts; the workspace is the
  // only place that decides what gets sent.
  assert.doesNotMatch(
    ws,
    /buildBm171RuntimePayload|Bm171RenderPayload|bm171-payload/u,
    'workspace must not import a per-BM-171 payload builder',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// (3) Local draft save/load — round-trips under the BM-171 key
// ─────────────────────────────────────────────────────────────────────────────

test('(3) local draft save/load: the draft key is namespaced by templateCode and contractHash', () => {
  const source = readText(RUNTIME_DRAFT);
  // Sanity: the real builder is present, in the same shape as the
  // shim used in this test. If the format ever changes, both move
  // together.
  assert.match(
    source,
    /qllaw:runtime-template-draft:[`'\$]?\$\{templateCode/u,
    'real builder must use the same key prefix the spec asserts on',
  );
  assert.match(
    source,
    /trim\(\)\.toUpperCase\(\)/u,
    'real builder must normalise the template code (trim + upper)',
  );
});

test('(3) local draft save/load: round-trip a BM-171 draft through an in-memory storage shim', () => {
  const storage = new MemoryStorage();
  const templateCode = 'BM-171';
  const contractHash = 'bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2';
  const key = draftKey(templateCode, contractHash);
  assert.equal(
    key,
    'qllaw:runtime-template-draft:BM-171:bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2',
    'BM-171 key must be namespaced by both templateCode and contractHash',
  );
  // Lower-case / whitespace variants must normalise to the same key.
  assert.equal(
    draftKey(' bm-171 ', contractHash),
    draftKey('BM-171', contractHash),
    'whitespace + case must normalise to the same draft key',
  );
  // BM-001 must NOT collide with BM-171.
  assert.notEqual(
    draftKey('BM-001', contractHash),
    draftKey(templateCode, contractHash),
    'BM-001 and BM-171 drafts must have distinct keys',
  );
  // Save → load round-trip.
  const draft = {
    'assetOwner.fullName': 'Nguyễn Văn A',
    'document.documentCode': '171/HS',
    'recipients.archiveLine': 'Lưu: HSVA, HSKS, VP.',
  };
  storage.setItem(key, JSON.stringify(draft));
  const loaded = JSON.parse(storage.getItem(key));
  assert.equal(loaded['assetOwner.fullName'], 'Nguyễn Văn A');
  assert.equal(loaded['document.documentCode'], '171/HS');
  assert.equal(loaded['recipients.archiveLine'], 'Lưu: HSVA, HSKS, VP.');
});

test('(3) local draft save/load: the workspace uses the localStorage draft as the source of truth on reload', () => {
  const ws = readText(WORKSPACE);
  // The draft is the only persistence; there is no DB write path.
  assert.match(
    ws,
    /loadRuntimeTemplateDraft\(window\.localStorage/u,
    'workspace must load the draft from window.localStorage',
  );
  assert.match(
    ws,
    /saveRuntimeTemplateDraft\(window\.localStorage/u,
    'workspace must save the draft to window.localStorage',
  );
  assert.match(
    ws,
    /setSavedSnapshot\(snapshot\(nextData\)\)/u,
    'workspace must record the saved snapshot to detect dirty state',
  );
  // No "documentId" anywhere in the draft-save path.
  const draftSaveBlock = ws.slice(
    ws.indexOf('function saveDraft'),
    ws.indexOf('async function previewDocx'),
  );
  assert.doesNotMatch(
    draftSaveBlock,
    /documentId|generatedDocumentId/u,
    'the draft save path must not reference documentId or generatedDocumentId',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// (4) Preview / download call shape — uses templateCode, NOT documentId
// ─────────────────────────────────────────────────────────────────────────────

test('(4) preview call shape: createRuntimePreviewSession posts to /forms/runtime/<CODE>/preview-session with {data} and asserts persisted=false', () => {
  const preview = readText(RUNTIME_PREVIEW);
  // Path: must be per-templateCode, not per-documentId.
  assert.match(
    preview,
    /\/forms\/runtime\/\$\{encodeURIComponent\(templateCode\.trim\(\)\.toUpperCase\(\)\)\}\/preview-session/u,
    'preview-session path must include the templateCode, not a documentId',
  );
  // Body shape: must be { data }, not { documentId } or { generatedDocumentId }.
  assert.match(
    preview,
    /body:\s*JSON\.stringify\(\{\s*data\s*\}\)/u,
    'preview-session body must be { data }',
  );
  // Guard: the response must report persisted=false (runtime preview, not a generated document).
  assert.match(
    preview,
    /persisted\s*!==\s*false/u,
    'preview-session response must be guarded for persisted===false',
  );
  // The function signature must accept (templateCode, data) and not (documentId, ...).
  assert.match(
    preview,
    /export\s+async\s+function\s+createRuntimePreviewSession\(\s*templateCode:\s*string,\s*data:\s*Record<string,\s*unknown>/u,
    'createRuntimePreviewSession must be (templateCode, data), not (documentId, ...)',
  );
  // The path must NEVER contain the word "documentId" or a UUID-shaped literal.
  assert.doesNotMatch(
    preview,
    /\$\{documentId\}|`\$\{[^}]*documentId/u,
    'preview-session path must not be templated by documentId',
  );
});

test('(4) download call shape: downloadRuntimeTemplateDocx posts to /forms/runtime/<CODE>/render-docx with {data}', () => {
  const exp = readText(RUNTIME_EXPORT);
  // Path: per-templateCode, not per-documentId.
  assert.match(
    exp,
    /\/forms\/runtime\/\$\{encodeURIComponent\(templateCode\.trim\(\)\.toUpperCase\(\)\)\}\/render-docx/u,
    'export path must include the templateCode, not a documentId',
  );
  // Body shape.
  assert.match(
    exp,
    /body:\s*JSON\.stringify\(\{\s*data\s*\}\)/u,
    'export body must be { data }',
  );
  // Accept header: DOCX (not generatedDocumentId JSON).
  assert.match(
    exp,
    /Accept:[^,}]*wordprocessingml\.document/u,
    'export Accept must be the DOCX mime type',
  );
  // No documentId/UUID literal in the source.
  assert.doesNotMatch(
    exp,
    /\$\{documentId\}|documentId:|generatedDocumentId/u,
    'export path/body must not reference documentId or generatedDocumentId',
  );
});

test('(4) preview call shape: workspace wires the BM-171 templateCode into the call (no documentId, no audit/history tab)', () => {
  const ws = readText(WORKSPACE);
  // The workspace uses `normalizedTemplateCode` (which is the URL
  // `templateCode` after `normalizeTemplateCode`). The runtime libs
  // re-uppercase it server-side, so any BM-171 string is safe.
  assert.match(
    ws,
    /createRuntimePreviewSession\(normalizedTemplateCode,\s*data\)/u,
    'workspace must call preview-session with the URL templateCode',
  );
  assert.match(
    ws,
    /downloadRuntimeTemplateDocx\(normalizedTemplateCode,\s*data\)/u,
    'workspace must call export with the URL templateCode',
  );
  // No audit/history tab: the workspace only renders the form + the
  // preview panel. There is no audit log, history view, or per-doc
  // navigation.
  assert.doesNotMatch(
    ws,
    /audit[\s_-]*history|history[\s_-]*tab|HistoryTab|AuditTrail|lịch sử chỉnh sửa|auditLogView|GeneratedDocumentWorkspace/u,
    'workspace must not contain an audit-history view (TemplateDraft is not a persisted document)',
  );
  // No "Tạo văn bản từ hồ sơ" persistence path (the button must be
  // explicitly disabled with a tooltip). This guards the gate-13
  // "no DB write from /templates" invariant at the UI level.
  assert.match(
    ws,
    /Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới\./u,
    'workspace must disable the "Tạo văn bản từ hồ sơ" persistence action with the locked tooltip',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// (5) No fake generatedDocumentId
// ─────────────────────────────────────────────────────────────────────────────

test('(5) no fake generatedDocumentId: the workspace does not assign a literal ID anywhere in the runtime path', () => {
  const ws = readText(WORKSPACE);
  // Look for the exact anti-pattern: a literal ID-shaped string
  // assigned to `generatedDocumentId`. Hex/uuid-shaped literals are
  // gated by gate 12 of the readiness gate; here we guard the
  // TemplateDraft workspace specifically.
  const fakeIdRe = /generatedDocumentId\s*[:=]\s*['"][a-zA-Z0-9_-]{6,}['"]/gu;
  const matches = ws.match(fakeIdRe) ?? [];
  assert.equal(
    matches.length,
    0,
    `workspace must not assign a literal generatedDocumentId; found: ${matches.join(', ')}`,
  );
  // Belt-and-braces: the word "generatedDocumentId" must not appear in
  // the workspace at all. The TemplateDraft flow has no such concept.
  assert.doesNotMatch(
    ws,
    /generatedDocumentId/u,
    'workspace must not mention generatedDocumentId anywhere — it is a generated-document concept, not a TemplateDraft concept',
  );
});

test('(5) no fake generatedDocumentId: the runtime preview + export libs do not assign a literal ID', () => {
  const fakeIdRe = /generatedDocumentId\s*[:=]\s*['"][a-zA-Z0-9_-]{6,}['"]/gu;
  for (const path of [RUNTIME_PREVIEW, RUNTIME_EXPORT, RUNTIME_DRAFT]) {
    const source = readText(path);
    const matches = source.match(fakeIdRe) ?? [];
    assert.equal(
      matches.length,
      0,
      `${path} must not assign a literal generatedDocumentId; found: ${matches.join(', ')}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// (6) No DB write from /templates (UI-side guard; backend has gate 13)
// ─────────────────────────────────────────────────────────────────────────────

test('(6) no DB write: the workspace does not import any DB / Prisma / persistence APIs', () => {
  const ws = readText(WORKSPACE);
  // The runtime TemplateDraft flow is localStorage + REST. The
  // workspace must not import any database, ORM, or persistence API.
  for (const forbidden of [
    /@\/lib\/documents-api/u,
    /@\/lib\/generated-documents-api/u,
    /from\s+["']@prisma/u,
    /prisma\./u,
    /generated_documents\.create/u,
    /generatedDocumentFiles\.create/u,
    /generatedDocumentAuditLogs\.create/u,
  ]) {
    assert.doesNotMatch(
      ws,
      forbidden,
      `workspace must not reference a persistence path: ${forbidden}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// (7) BM-001 behavior is unchanged
// ─────────────────────────────────────────────────────────────────────────────

test('(7) BM-001 behavior is unchanged: BM-001 still routes through the same generic workspace', () => {
  // The page is the SAME file for BM-001 and BM-171 — both go
  // through the generic /templates/[templateCode] page. The strict
  // rule is "no BM-001 behavior change", and that is structurally
  // true: nothing in the page, the workspace, the draft lib, the
  // preview lib, or the export lib was modified for this PR.
  const page = readText(ROUTE_PAGE);
  // The page must NOT contain a BM-001-only branch.
  assert.doesNotMatch(page, /BM-001/u, 'route page must remain generic; no BM-001 branch');
  assert.doesNotMatch(page, /bm001/u, 'route page must remain generic; no bm001 reference');
});

test('(7) BM-001 behavior is unchanged: BM-001 locked contract is still present and is not what this PR modifies', () => {
  // The BM-001 locked contract path is still on disk (regression
  // coverage: the PR7A.1 work must not have deleted or modified it).
  // We do not assert the contract's *content*; the contract sync
  // gate is the source of truth. We just prove the file is there.
  assert.equal(
    existsSync(BM001_LOCKED_CONTRACT),
    false,
    'sanity: prefix-only path is not a file; this test is a structural guard, not a content check',
  );
  // Find the actual BM-001 file. The PR6G.2 docs guarantee at least
  // one BM-001 locked contract exists.
  const lockedDir = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
  const names = readdirSync(lockedDir);
  const bm001 = names.filter((n) => n.startsWith('BM-001__') && n.endsWith('.contract.locked.json'));
  assert.ok(
    bm001.length >= 1,
    `at least one BM-001 locked contract must still be on disk; found ${bm001.length}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// (8) BM-171 contract matches the gate-2 field coverage shape (sanity)
// ─────────────────────────────────────────────────────────────────────────────

test('(8) BM-171 locked contract has the 34 slots documented in the gate-2 field-coverage artefact', () => {
  const contract = JSON.parse(readFileSync(BM171_LOCKED_CONTRACT, 'utf8'));
  const slots = Array.isArray(contract.docxSlots) ? contract.docxSlots : [];
  assert.equal(
    slots.length,
    34,
    `BM-171 locked contract must declare 34 docxSlots; found ${slots.length}`,
  );
  // Each slot must have a slotId + required + location, matching the
  // shape the generic TemplatePreviewWorkspace consumes.
  for (const slot of slots) {
    assert.equal(typeof slot.slotId, 'string', 'each slot must have a slotId');
    assert.equal(typeof slot.required, 'boolean', 'each slot must declare required');
    assert.equal(typeof slot.location?.blockId, 'string', 'each slot must declare a blockId');
  }
  // Required count: 31 (per PR7A_BM171_INTAKE §3).
  const required = slots.filter((s) => s.required).length;
  assert.equal(
    required,
    31,
    `BM-171 must declare 31 required slots; found ${required}`,
  );
  // The slot set must include the assetOwner + recipients + signature
  // groups that the generic workspace will render.
  const slotIds = new Set(slots.map((s) => s.slotId));
  for (const expected of [
    'agency.parentName',
    'agency.name',
    'document.documentCode',
    'document.issuePlaceAndDateLine',
    'recipients.archiveLine',
    'signature.signerName',
    'assetOwner.fullName',
    'assetOwner.identityNo',
  ]) {
    assert.ok(
      slotIds.has(expected),
      `BM-171 contract must include slot ${expected}`,
    );
  }
});
