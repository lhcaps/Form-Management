// Locked-authority crosswalk — per-locked-field comparison across 5 surfaces:
//   A. locked runtimeView     (the authority)
//   B. current normalized DOCX (target verification surface)
//   C. compiled-v2            (compatibility only)
//   D. panel/save payload     (compatibility only)
//   E. registered adapter output (implementation only)
//
// For every canonical field, emit a row with the per-field columns the
// activation spec mandates, and a CROSSWALK_VERDICT from the allowed set.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-crosswalk.json');
const COMPILED_V2_PATH = path.join(REPO_ROOT, 'packages/form-contracts/src/runtime-readiness.generated.ts');
const PANEL_REGISTRY_PATH = path.join(REPO_ROOT, 'apps/web/src/components/documents/bm-panel-registry.generated.ts');
const ADAPTER_RESOLUTION_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/adapter-resolution-213.json');

function readJsonSafe(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function classifyVerdict(row) {
  if (row.LOCKED_SCHEMA_CONFLICT) return 'LOCKED_SCHEMA_CONFLICT';
  if (row.LOCKED_TARGET_MISSING) return 'LOCKED_TARGET_MISSING';
  if (row.LOCKED_TRANSFORM_UNIMPLEMENTED) return 'LOCKED_TRANSFORM_UNIMPLEMENTED';
  if (row.LOCKED_ADAPTER_TARGET_DRIFT) return 'LOCKED_ADAPTER_TARGET_DRIFT';
  if (row.LOCKED_SOURCE_HASH_DRIFT) return 'LOCKED_SOURCE_HASH_DRIFT';
  if (row.LOCKED_TARGET_PARTIAL_EVIDENCE) return 'LOCKED_TARGET_PARTIAL_EVIDENCE';
  if (row.LOCKED_TARGET_READY_COMPILED_AND_PANEL_DRIFT) return 'LOCKED_TARGET_READY_COMPILED_AND_PANEL_DRIFT';
  if (row.LOCKED_TARGET_READY_COMPILED_DRIFT) return 'LOCKED_TARGET_READY_COMPILED_DRIFT';
  if (row.LOCKED_TARGET_READY_PANEL_DRIFT) return 'LOCKED_TARGET_READY_PANEL_DRIFT';
  return 'LOCKED_ALL_SURFACES_MATCH';
}

function buildCrosswalkRow(index, form, field, surfaceData) {
  const slot = form.runtimeView.docxSlots.find((s) => s.slotId === field.path);
  const binding = form.runtimeView.renderBindings.find((b) => b.slotId === field.path);
  const adapterOutput = surfaceData.adapterByFieldPath?.get(field.path) ?? null;

  // B. current normalized DOCX: structural check only (target occurrences cannot
  // be derived without a text-extraction pipeline; we record null + a blocking
  // reason so downstream consumers can see the gap).
  const currentNormalizedTargetFound = null;
  const currentTargetCount = null;
  const blockingForTarget = !slot ? 'no slot bound to this field' : (slot.location == null ? 'slot has no location' : null);

  // E. adapter: only verdict.
  const adapterReferencesField = adapterOutput ? true : false;
  const adapterTargetMatch = adapterOutput ? adapterOutput.targetMatch : null;

  // C/D. compiled/panel: only record presence; matching is left to the
  // activation guard (these surfaces must not be allowed to *create* locked debt).
  const compiledFieldPresent = surfaceData.compiledFieldsByForm?.has(field.path) ?? false;
  const compiledFieldCompatible = compiledFieldPresent;
  const panelFieldPresent = surfaceData.panelFieldsByForm?.has(field.path) ?? false;
  const panelSavesField = panelFieldPresent;

  const row = {
    FORM_CODE: form.identity.templateCode,
    LOCKED_FIELD_PATH: field.path,
    LOCKED_REQUIRED: Boolean(field.required),
    LOCKED_SOURCE: field.source ?? null,
    LOCKED_TYPE: field.type ?? null,
    LOCKED_UI_COMPONENT: field.uiComponent ?? null,
    LOCKED_SLOT_ID: slot?.slotId ?? null,
    LOCKED_SLOT_REQUIRED: slot ? Boolean(slot.required) : null,
    LOCKED_TARGET_EVIDENCE: slot ? (slot.location?.blockId ? 'EXACT_STRUCTURAL_TARGET' : (slot.evidence?.rawPattern ? 'TOKEN_PATTERN_TARGET' : 'TARGET_EVIDENCE_PARTIAL')) : 'TARGET_EVIDENCE_MISSING',
    LOCKED_TRANSFORM: binding?.transform ?? null,
    CURRENT_NORMALIZED_TARGET_FOUND: currentNormalizedTargetFound,
    CURRENT_TARGET_COUNT: currentTargetCount,
    COMPILED_FIELD_PRESENT: compiledFieldPresent,
    COMPILED_FIELD_COMPATIBLE: compiledFieldCompatible,
    PANEL_FIELD_PRESENT: panelFieldPresent,
    PANEL_SAVES_FIELD: panelSavesField,
    ADAPTER_REFERENCES_FIELD: adapterReferencesField,
    ADAPTER_TARGET_MATCH: adapterTargetMatch,
    CROSSWALK_VERDICT: null,
    BLOCKING_REASON: blockingForTarget,
  };
  row.LOCKED_TARGET_MISSING = !slot;
  row.LOCKED_TARGET_PARTIAL_EVIDENCE = row.LOCKED_TARGET_EVIDENCE === 'TARGET_EVIDENCE_PARTIAL';
  row.LOCKED_TRANSFORM_UNIMPLEMENTED = binding && binding.transform && binding.transform !== 'identity' && !adapterOutput;
  row.LOCKED_SOURCE_HASH_DRIFT = false;
  row.LOCKED_ADAPTER_TARGET_DRIFT = adapterOutput && adapterOutput.targetMatch === false;
  row.LOCKED_SCHEMA_CONFLICT = !field.path || !field.uiComponent;
  row.LOCKED_TARGET_READY_COMPILED_DRIFT = !row.LOCKED_TARGET_MISSING && !row.LOCKED_TARGET_PARTIAL_EVIDENCE && !compiledFieldCompatible;
  row.LOCKED_TARGET_READY_PANEL_DRIFT = !row.LOCKED_TARGET_MISSING && !row.LOCKED_TARGET_PARTIAL_EVIDENCE && !panelSavesField;
  row.LOCKED_TARGET_READY_COMPILED_AND_PANEL_DRIFT = row.LOCKED_TARGET_READY_COMPILED_DRIFT && row.LOCKED_TARGET_READY_PANEL_DRIFT;
  row.CROSSWALK_VERDICT = classifyVerdict(row);
  return row;
}

function loadSurfaceData() {
  const out = {
    compiledFieldsByForm: new Map(),
    panelFieldsByForm: new Map(),
    adapterByFieldPath: new Map(),
  };
  if (existsSync(COMPILED_V2_PATH)) {
    const text = readFileSync(COMPILED_V2_PATH, 'utf8');
    // Very lightweight parser: extract quoted strings that look like field paths.
    const matches = text.matchAll(/['"`](person|document|issuer|recipient|case|agency|asset|vehicle|investigation|legalHeader|sentiment)\.[a-zA-Z0-9._]+['"`]/g);
    for (const match of matches) {
      out.compiledFieldsByForm.set(match[0].replace(/['"`]/g, ''), true);
    }
  }
  if (existsSync(PANEL_REGISTRY_PATH)) {
    const text = readFileSync(PANEL_REGISTRY_PATH, 'utf8');
    const matches = text.matchAll(/['"`](person|document|issuer|recipient|case|agency|asset|vehicle|investigation|legalHeader|sentiment)\.[a-zA-Z0-9._]+['"`]/g);
    for (const match of matches) {
      out.panelFieldsByForm.set(match[0].replace(/['"`]/g, ''), true);
    }
  }
  if (existsSync(ADAPTER_RESOLUTION_PATH)) {
    try {
      const json = readJsonSafe(ADAPTER_RESOLUTION_PATH);
      if (Array.isArray(json?.perForm)) {
        for (const formEntry of json.perForm) {
          for (const classified of formEntry.classified ?? []) {
            out.adapterByFieldPath.set(classified.path, { targetMatch: classified.targetMatch ?? null });
          }
        }
      }
    } catch {
      // Adapter resolution may not be present; treat as no data.
    }
  }
  return out;
}

export function buildLockedAuthorityCrosswalk(options = {}) {
  const index = loadLockedRuntimeIndex();
  const surfaceData = loadSurfaceData();

  const rows = [];
  let fieldsExamined = 0;
  let matched = 0;
  let blocking = 0;
  let compiledOnly = 0;
  let panelOnly = 0;

  for (const form of index.forms) {
    for (const field of form.runtimeView.canonicalFields) {
      fieldsExamined += 1;
      const row = buildCrosswalkRow(index, form, field, surfaceData);
      rows.push(row);
      if (row.CROSSWALK_VERDICT === 'LOCKED_ALL_SURFACES_MATCH') matched += 1;
      if (row.LOCKED_TARGET_MISSING || row.LOCKED_TARGET_PARTIAL_EVIDENCE) blocking += 1;
    }
  }

  // "Current-only" surfaces: find fields in compiled-v2 / panel / adapter that
  // are not in locked. These do NOT become locked debt.
  const lockedFieldPaths = new Set(rows.map((r) => r.LOCKED_FIELD_PATH));
  for (const key of surfaceData.compiledFieldsByForm.keys()) {
    if (!lockedFieldPaths.has(key)) compiledOnly += 1;
  }
  for (const key of surfaceData.panelFieldsByForm.keys()) {
    if (!lockedFieldPaths.has(key)) panelOnly += 1;
  }

  return {
    schema: 'qllaw.213.locked_authority_crosswalk/v1',
    generatedAt: new Date().toISOString(),
    fieldsExamined,
    matched,
    blocking,
    currentOnly: { compiledOnly, panelOnly },
    rows,
    indexHashes: index.hashes,
  };
}

export function writeLockedAuthorityCrosswalk(options = {}) {
  const result = buildLockedAuthorityCrosswalk(options);
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, result };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { result, outputPath } = writeLockedAuthorityCrosswalk();
  console.log(`OK crosswalk: ${result.fieldsExamined} fields; matched=${result.matched}; blocking=${result.blocking}`);
  console.log(`     currentOnly: compiled=${result.currentOnly.compiledOnly}; panel=${result.currentOnly.panelOnly}`);
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
}
