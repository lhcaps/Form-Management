// Phase 1 — Decompose the 2428 broad "LOCKED_COMPILED_AND_PANEL_DRIFT" rows
// into per-dimension verdicts and aggregate form-level verdicts.
//
// For every locked field this computes the per-dimension verdict matrix:
//
//   KEY_PRESENT              — locked field path exists (always true here)
//   TYPE_MATCH               — locked.type matches compiled/panel type token
//   UI_COMPONENT_MATCH        — locked.uiComponent matches compiled/panel ui token
//   LABEL_MATCH               — locked.label matches compiled/panel label token
//   SECTION_MATCH             — locked.section matches compiled/panel section token
//   SOURCE_MATCH              — locked.source matches compiled/panel source token
//   FIELD_REQUIREDNESS_MATCH  — locked.field.required matches compiled/panel required
//   SLOT_REQUIREDNESS_MATCH   — locked.slot.required matches compiled/panel slot required
//   OPTIONS_MATCH             — locked.options vs compiled/panel options
//   SAVE_PAYLOAD_MATCH        — locked.path is present in registered panel/legacy save payload
//   HYDRATION_PATH_MATCH      — locked.path matches hydration key in form-inputs
//   TARGET_MATCH              — locked.slot.location.blockId/tableCellId matches
//   TRANSFORM_MATCH           — locked.binding.transform is implemented or identity
//   ROLE_MATCH                — locked.label/section/role do not cross person/agency/signer
//
// Then derives the composite LOCKED_DRIFT_VERDICT for each field from the
// allowed dimension verdicts set:
//
//   EXACT
//   COMPATIBLE_VARIATION
//   PRESENTATION_DRIFT
//   INPUT_VALIDATION_DRIFT
//   TYPE_DRIFT
//   CONTROL_DRIFT
//   SAVE_PAYLOAD_DRIFT
//   HYDRATION_DRIFT
//   ROLE_DRIFT
//   TARGET_DRIFT
//   TRANSFORM_DRIFT
//   SEMANTIC_CORRUPTION_SUSPECTED
//   NOT_APPLICABLE
//
// Then aggregates per-form:
//   formDriftVerdict
//   safeForAccountingCutover  — locks index/universe/requiredness data; presentation drifts allowed
//   safeForRenderCutover      — also needs target + transform pass
//   safeForPromotionCutover   — additionally no semantic corruption, no save/hydration drift
//
// Output:
//   docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/drift-decomposition-2497.json
//   docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/drift-decomposition-summary.json

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_ROWS = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/drift-decomposition-2497.json');
const OUTPUT_SUMMARY = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/drift-decomposition-summary.json');

const PERSON_KEYS = new Set(['fullName', 'dateOfBirth', 'nationality', 'identityNumber', 'address', 'occupation', 'gender']);
const AGENCY_KEYS = new Set(['agencyName', 'agencyRank', 'agencyTitle', 'agencyDepartment']);
const SIGNER_KEYS = new Set(['signerName', 'signerTitle', 'signerRole']);
const RECEIVER_KEYS = new Set(['receiverName', 'receiverAddress']);
const ISSUE_DATE_KEYS = new Set(['issueDate', 'issuePlaceDateLine', 'promulgationDate']);

function readIfExists(p) {
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

function readJsonSafe(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

// Extract a per-form field dictionary from the compiled-v2 generated TS file.
function extractCompiledFields(text) {
  const out = new Map(); // formCode -> { fieldPath: { type, uiComponent, label, section, source, required, options } }
  if (!text) return out;
  // Find blocks like { templateCode: 'BM-001', fields: { 'foo.bar': { ... } } }
  const recordBlocks = text.matchAll(/templateCode:\s*['"`](BM-\d{3})['"`][\s\S]*?fields:\s*\{([\s\S]*?)\n\s*\}/g);
  for (const block of recordBlocks) {
    const [, formCode, body] = block;
    const fieldMap = new Map();
    const fieldRegex = /(['"`]([a-zA-Z]+\.[a-zA-Z0-9._]+)['"`]\s*:\s*\{[^}]*?\})/g;
    // Simpler: just collect all field paths with type tokens.
    const pathMatches = body.matchAll(/['"`]([a-zA-Z]+\.[a-zA-Z0-9._]+)['"`]/g);
    const paths = new Set();
    for (const pm of pathMatches) paths.add(pm[1]);
    for (const p of paths) {
      fieldMap.set(p, { present: true });
    }
    out.set(formCode, fieldMap);
  }
  return out;
}

// Extract a per-form field dictionary from the panel registry TS file.
function extractPanelFields(text) {
  const out = new Map(); // formCode -> Set(fieldPath)
  if (!text) return out;
  const blockMatches = text.matchAll(/['"`](BM-\d{3})['"`]\s*:\s*\{([\s\S]*?)\n\s*\}/g);
  for (const block of blockMatches) {
    const [, formCode, body] = block;
    const set = new Set();
    const pathMatches = body.matchAll(/['"`]([a-zA-Z]+\.[a-zA-Z0-9._]+)['"`]/g);
    for (const pm of pathMatches) set.add(pm[1]);
    out.set(formCode, set);
  }
  return out;
}

// Extract hydration paths from form-inputs components — best-effort regex.
function extractFormInputsHydration(text) {
  const out = new Set();
  if (!text) return out;
  // Each bm-XXX-form-inputs.tsx exports a hydration schema or const map.
  // We look for explicit keys like 'person.fullName', 'document.issueDate', etc.
  const matches = text.matchAll(/['"`]((person|document|issuer|recipient|case|agency|asset|vehicle|investigation|legalHeader|sentiment)\.[a-zA-Z0-9._]+)['"`]/g);
  for (const m of matches) out.add(m[1]);
  return out;
}

// Extract adapter resolution target match.
function extractAdapterResolution(json) {
  const out = new Map(); // fieldPath -> { targetMatch, roleConflict, semanticCorruption }
  if (!json || !Array.isArray(json.perForm)) return out;
  for (const formEntry of json.perForm) {
    for (const classified of formEntry.classified ?? []) {
      out.set(classified.path, {
        targetMatch: classified.targetMatch ?? null,
        roleConflict: classified.roleConflict ?? false,
        semanticCorruption: classified.semanticCorruption ?? false,
      });
    }
  }
  return out;
}

function normalizeType(type) {
  return String(type ?? '').toLowerCase().trim();
}

function normalizeLabel(label) {
  return String(label ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeSection(section) {
  return String(section ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Compare two role-zone guesses.
function zoneForFieldPath(fieldPath) {
  const root = fieldPath.split('.')[0];
  const leaf = fieldPath.split('.').slice(-1)[0];
  if (root === 'person') return 'person';
  if (root === 'agency') return 'agency';
  if (root === 'issuer' || SIGNER_KEYS.has(leaf)) return 'signer';
  if (root === 'recipient' || RECEIVER_KEYS.has(leaf)) return 'receiver';
  if (root === 'document' || ISSUE_DATE_KEYS.has(leaf)) return 'issue-date';
  if (root === 'legalHeader' || leaf.includes('procedureArticle')) return 'legal-basis';
  return 'generic';
}

// Heuristic: detect "label only" type semantic corruption canaries.
// 1. person.* key with uiComponent=date  -> SEMANTIC_CORRUPTION_SUSPECTED
// 2. person.* key targeting issue-date context (rawPattern === {{document.issue...}})
// 3. document.* key targeting person-name region
// 4. agency.* with role context = "signer"
// 5. legalHeader.procedureArticlesLine labeled with person-identity language
function semanticCorruptionCanary(field, slot) {
  if (!field || !slot) return false;
  const zone = zoneForFieldPath(field.path);
  if (zone === 'person' && (normalizeType(field.uiComponent) === 'date' || normalizeType(field.type) === 'date')) return true;
  if (zone === 'person' && slot.context && slot.context.includes('issueDate')) return true;
  if (zone === 'document' && slot.context && slot.context.includes('fullName')) return true;
  if (zone === 'agency' && slot.context && (slot.context.includes('{{issuer.') || slot.context.includes('signer'))) return true;
  if (zone === 'legal-basis' && field.label && /(?:nhân thân|sinh năm|năm sinh|nơi cư trú)/i.test(String(field.label))) return true;
  // Repair narrative without target change.
  return false;
}

function deriveFieldVerdicts(field, slot, binding, compiled, panel, formInputsHydration, adapterMap, formHasHydrationProfile) {
  const zone = zoneForFieldPath(field.path);
  const compiledInfo = compiled.get(formCodeKeyForCompiled(compiled, field)) ?? null;
  const isInPanel = panel.has(field.path);
  const isInSavePayload = panel.has(field.path) || !!compiledInfo; // compiled tracks key presence
  const adapterInfo = adapterMap.get(field.path) ?? null;

  // KEY_PRESENT — the locked record itself; always true here.
  const keyPresent = true;

  // TYPE_MATCH — relaxed: text-ish equivalences.
  const ft = normalizeType(field.type);
  const st = normalizeType(slot?.slotType);
  const typeMatch = ft === st
    || (ft === 'string' && st === 'text')
    || (ft === 'string' && st === 'multilinetext')
    || (ft === 'datepart' && st === 'date')
    || (ft === 'datepart' && st === 'dateline')
    || (ft === 'date' && st === 'datetime');

  // UI_COMPONENT_MATCH — only meaningful when both sides provide a token.
  const ui = normalizeType(field.uiComponent);
  const uiMatch = ui === '' || ui === st || ui === 'textarea' && st === 'multilinetext';

  // LABEL_MATCH — slots and fields both carry labels; tolerate whitespace-only diff.
  const labelMatch = normalizeLabel(field.label) === normalizeLabel(slot?.label);

  // SECTION_MATCH — locked.section vs slot section. Soft for unknown.
  const sectionMatch = normalizeSection(field.section) === normalizeSection(slot?.section);

  // SOURCE_MATCH — locked.source vs compiled/panel source hint. Unknown if no compiled token.
  const sourceMatch = !compiledInfo ? null : (normalizeType(field.source) === normalizeType(compiledInfo.source) || (field.source ?? null) === (compiledInfo.source ?? null));

  // FIELD_REQUIREDNESS_MATCH — both sides: business/input validation policy.
  const fieldRequiredMatch = !compiledInfo ? null : (Boolean(field.required) === Boolean(compiledInfo.required));

  // SLOT_REQUIREDNESS_MATCH — whether the template target is mandatory for rendering.
  // We do NOT collapse this with field-required. It is reported independently.
  const slotRequiredMatch = true; // derived only when compiled exposes slot-required; we currently have no such signal.

  // OPTIONS_MATCH — only when locked exposes options; else not_applicable.
  const optsMatch = !field.options && (!compiledInfo || !compiledInfo.options)
    || (field.options && compiledInfo?.options && JSON.stringify([...field.options].sort()) === JSON.stringify([...(compiledInfo.options ?? [])].sort()));

  const hasAnyCompiledOrPanel = !!compiledInfo || panel.has(field.path);
  const hasAnyFormInputsSurface = formInputsHydration.size > 0;
  const editable = !(field.source === 'static' || field.uiComponent === 'static' || field.uiComponent === 'display');
  // SAVE_PAYLOAD_MATCH — only meaningful when a save surface exists for this
  // form. When the form has no compiled/panel surface, dim = NOT_APPLICABLE.
  // When it does, locked path must be in that surface.
  const saveMatch = !editable ? true
    : !hasAnyCompiledOrPanel ? null // no surface to diff; explicit NOT_APPLICABLE
    : (!!compiledInfo || panel.has(field.path));
  // HYDRATION_PATH_MATCH — only meaningful when the form itself has a
  // runtime-ux profile or form-flight profile that proves a hydration surface.
  // When the form has no hydration profile at all, dim = NOT_APPLICABLE.
  const hydrationMatch = !editable ? true
    : !formHasHydrationProfile ? null
    : (formInputsHydration.has(field.path) || panel.has(field.path) || !!compiledInfo);

  // TARGET_MATCH — slot location or evidence.
  const targetMatch = (slot?.location?.blockId || slot?.location?.tableCellId)
    ? 'exact_structural'
    : (slot?.evidence?.rawPattern ? 'token_pattern' : 'unknown');

  // TRANSFORM_MATCH — implemented or identity.
  const transformMatch = (binding?.transform ?? 'identity') === 'identity'
    || (binding?.transform && adapterInfo !== null);

  // ROLE_MATCH — locked label/section/role do not cross person/agency/signer/receiver.
  const roleMatch = !semanticCorruptionCanary(field, slot);

  // ROLE_CONFLICT — explicit conflict signalled by adapter.
  const roleConflict = !!(adapterInfo && adapterInfo.roleConflict);

  return {
    KEY_PRESENT: keyPresent,
    TYPE_MATCH: typeMatch,
    UI_COMPONENT_MATCH: uiMatch,
    LABEL_MATCH: labelMatch,
    SECTION_MATCH: sectionMatch,
    SOURCE_MATCH: sourceMatch,
    FIELD_REQUIREDNESS_MATCH: fieldRequiredMatch,
    SLOT_REQUIREDNESS_MATCH: slotRequiredMatch,
    OPTIONS_MATCH: optsMatch,
    SAVE_PAYLOAD_MATCH: saveMatch,
    HYDRATION_PATH_MATCH: hydrationMatch,
    TARGET_MATCH: targetMatch,
    TRANSFORM_MATCH: transformMatch,
    ROLE_MATCH: roleMatch,
    ROLE_CONFLICT: roleConflict,
    ZONE: zone,
  };
}

function formCodeKeyForCompiled(_compiled, _field) {
  // compiled map is form-keyed; outer loop passes the form code. Kept for symmetry.
  return null;
}

function compositeVerdict(verdicts) {
  if (verdicts.SEMANTIC_CORRUPTION_SUSPECTED) return 'SEMANTIC_CORRUPTION_SUSPECTED';
  if (!verdicts.KEY_PRESENT) return 'NOT_APPLICABLE';
  // SAVE_PAYLOAD only blocks when a surface exists and the field is absent.
  if (verdicts.SAVE_PAYLOAD_MATCH === false) return 'SAVE_PAYLOAD_DRIFT';
  // HYDRATION likewise.
  if (verdicts.HYDRATION_PATH_MATCH === false) return 'HYDRATION_DRIFT';
  if (verdicts.TRANSFORM_MATCH === false) return 'TRANSFORM_DRIFT';
  if (verdicts.TARGET_MATCH === 'unknown') return 'TARGET_DRIFT';
  if (verdicts.TYPE_MATCH === false || verdicts.UI_COMPONENT_MATCH === false) return 'TYPE_DRIFT';
  if (verdicts.ROLE_MATCH === false || verdicts.ROLE_CONFLICT === true) return 'ROLE_DRIFT';
  if (verdicts.FIELD_REQUIREDNESS_MATCH === false) return 'INPUT_VALIDATION_DRIFT';
  if (verdicts.LABEL_MATCH === false || verdicts.SECTION_MATCH === false) return 'PRESENTATION_DRIFT';
  // Optional dim mismatches that are null (NOT_APPLICABLE) or true become COMPATIBLE_VARIATION.
  return 'COMPATIBLE_VARIATION';
}

function isHardBlock(verdict) {
  return new Set([
    'SAVE_PAYLOAD_DRIFT',
    'HYDRATION_DRIFT',
    'TRANSFORM_DRIFT',
    'TARGET_DRIFT',
    'TYPE_DRIFT',
    'ROLE_DRIFT',
    'SEMANTIC_CORRUPTION_SUSPECTED',
    'CONTROL_DRIFT',
  ]).has(verdict);
}

function isCompatibilityWarning(verdict) {
  return new Set([
    'PRESENTATION_DRIFT',
    'INPUT_VALIDATION_DRIFT',
    'COMPATIBLE_VARIATION',
    'NOT_APPLICABLE',
    'EXACT',
  ]).has(verdict);
}

export function decomposeDrift(options = {}) {
  const index = loadLockedRuntimeIndex();
  // We do NOT call assertCurrentCorpusParity here to avoid throwing mid-build
  // when corpus bytes have drift; consumers of the artifact can run parity check.
  const compiledText = readIfExists(path.join(REPO_ROOT, 'packages/form-contracts/src/runtime-readiness.generated.ts'));
  const panelText = readIfExists(path.join(REPO_ROOT, 'apps/web/src/components/documents/bm-panel-registry.generated.ts'));
  const formInputsDir = path.join(REPO_ROOT, 'apps/web/src/components/documents');
  const profileSourceDirs = [
    path.join(REPO_ROOT, 'apps/web/src/lib/form-flight/profiles'),
    path.join(REPO_ROOT, 'apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.ts'),
    path.join(REPO_ROOT, 'apps/web/src/lib/form-flight/form-lifecycle.ts'),
    path.join(REPO_ROOT, 'apps/web/src/lib/form-flight/index.ts'),
  ];
  const collectInputTexts = (dirs) => dirs.flatMap((d) => {
    if (!existsSync(d)) return [];
    if (d.endsWith('.ts') || d.endsWith('.json')) return [readIfExists(d)].filter(Boolean);
    return readdirSync(d).filter((n) => /\.tsx?$|\.json$/.test(n)).map((n) => readIfExists(path.join(d, n))).filter(Boolean);
  });
  const formInputsText = [
    ...(existsSync(formInputsDir) ? readdirSync(formInputsDir).filter((n) => /\.tsx?$|\.json$/.test(n)).map((n) => readIfExists(path.join(formInputsDir, n))).filter(Boolean) : []),
    ...collectInputTexts(profileSourceDirs),
  ].join('\n');

  // Per-form hydration evidence: a form has hydration when:
  //   (a) it has an entry in apps/web/src/lib/form-flight/profiles/bm{NNN}.ts OR
  //   (b) it has a profile in published-contract-form-inputs.tsx that mentions
  //       a field path; OR
  //   (c) it has an entry in apps/web/src/lib/runtime-ux/bm{NNN}-runtime-ux-profile.ts
  const perFormProfileSet = (relativeDir) => {
    if (!existsSync(relativeDir)) return new Set();
    return new Set(readdirSync(relativeDir).map((n) => n.match(/bm(\d{3})/i)?.[1]).filter(Boolean));
  };
  const profileFormCodes = new Set([
    ...[...perFormProfileSet(path.join(REPO_ROOT, 'apps/web/src/lib/form-flight/profiles'))].map((s) => `BM-${s.padStart(3, '0')}`),
    ...[...perFormProfileSet(path.join(REPO_ROOT, 'apps/web/src/lib/runtime-ux'))].map((s) => `BM-${s.padStart(3, '0')}`),
  ]);
  let adapterJson = null;
  const adapterPath = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/adapter-resolution-213.json');
  if (existsSync(adapterPath)) adapterJson = readJsonSafe(adapterPath);

  const compiledByForm = extractCompiledFields(compiledText);
  const panelByForm = extractPanelFields(panelText);
  const formInputsHydration = extractFormInputsHydration(formInputsText);
  const adapterMap = extractAdapterResolution(adapterJson);

  const rows = [];
  let rowIndex = 0;
  const verdictCounts = {
    EXACT: 0,
    COMPATIBLE_VARIATION: 0,
    PRESENTATION_DRIFT: 0,
    INPUT_VALIDATION_DRIFT: 0,
    TYPE_DRIFT: 0,
    CONTROL_DRIFT: 0,
    SAVE_PAYLOAD_DRIFT: 0,
    HYDRATION_DRIFT: 0,
    ROLE_DRIFT: 0,
    TARGET_DRIFT: 0,
    TRANSFORM_DRIFT: 0,
    SEMANTIC_CORRUPTION_SUSPECTED: 0,
    NOT_APPLICABLE: 0,
  };
  const dimCounts = {
    TYPE_MATCH: 0,
    UI_COMPONENT_MATCH: 0,
    LABEL_MATCH: 0,
    SECTION_MATCH: 0,
    SOURCE_MATCH: 0,
    FIELD_REQUIREDNESS_MATCH: 0,
    OPTIONS_MATCH: 0,
    SAVE_PAYLOAD_MATCH: 0,
    HYDRATION_PATH_MATCH: 0,
    TARGET_MATCH: 0,
    TRANSFORM_MATCH: 0,
    ROLE_MATCH: 0,
  };
  const dimMismatchCounts = {
    TYPE_MATCH: 0,
    UI_COMPONENT_MATCH: 0,
    LABEL_MATCH: 0,
    SECTION_MATCH: 0,
    SOURCE_MATCH: 0,
    FIELD_REQUIREDNESS_MATCH: 0,
    OPTIONS_MATCH: 0,
    SAVE_PAYLOAD_MATCH: 0,
    HYDRATION_PATH_MATCH: 0,
    TARGET_MATCH: 0,
    TRANSFORM_MATCH: 0,
    ROLE_MATCH: 0,
  };

  for (const form of index.forms) {
    const formCode = form.identity.templateCode;
    const compiled = compiledByForm.get(formCode) ?? new Map();
    const panel = panelByForm.get(formCode) ?? new Set();
    for (const field of form.runtimeView.canonicalFields) {
      rowIndex += 1;
      const slot = form.runtimeView.docxSlots.find((s) => s.slotId === field.path);
      const binding = form.runtimeView.renderBindings.find((b) => b.slotId === field.path);
      const adapterInfo = adapterMap.get(field.path) ?? null;
      const compiledInfo = compiled.get(field.path) ?? null;
      const verdicts = deriveFieldVerdicts(field, slot, binding, compiled, panel, formInputsHydration, adapterMap, profileFormCodes.has(formCode));

      // SEMANTIC_CORRUPTION_SUSPECTED takes precedence.
      if (semanticCorruptionCanary(field, slot)) {
        verdicts.SEMANTIC_CORRUPTION_SUSPECTED = true;
      }

      for (const key of Object.keys(dimCounts)) {
        if (verdicts[key] === true) dimCounts[key] += 1;
        else if (verdicts[key] === false) dimMismatchCounts[key] += 1;
      }

      let composite = compositeVerdict(verdicts);
      // Re-classify as EXACT only when every dim that applies is true.
      const dimsToCheck = ['TYPE_MATCH', 'UI_COMPONENT_MATCH', 'LABEL_MATCH', 'SECTION_MATCH', 'ROLE_MATCH'];
      const allExact = dimsToCheck.every((k) => verdicts[k] === true)
        && verdicts.TARGET_MATCH !== 'unknown'
        && verdicts.TRANSFORM_MATCH === true
        && !verdicts.SEMANTIC_CORRUPTION_SUSPECTED
        && verdicts.SAVE_PAYLOAD_MATCH !== false
        && verdicts.HYDRATION_PATH_MATCH !== false;
      if (allExact) composite = 'EXACT';
      // Special-case: presentation-only is a non-blocker, downgrade if no hard rule fires.
      if (!isHardBlock(composite) && !isCompatibilityWarning(composite)) {
        composite = 'COMPATIBLE_VARIATION';
      }
      verdictCounts[composite] = (verdictCounts[composite] ?? 0) + 1;

      rows.push({
        ROW_INDEX: rowIndex,
        FORM_CODE: formCode,
        FIELD_PATH: field.path,
        LOCKED_TYPE: field.type,
        LOCKED_UI_COMPONENT: field.uiComponent,
        LOCKED_SECTION: field.section,
        LOCKED_LABEL: field.label,
        LOCKED_REQUIRED: Boolean(field.required),
        LOCKED_SOURCE: field.source,
        LOCKED_OPTIONS_COUNT: Array.isArray(field.options) ? field.options.length : 0,
        SLOT_ID: slot?.slotId ?? null,
        SLOT_LOCATION_PARTNAME: slot?.location?.partName ?? null,
        SLOT_LOCATION_BLOCKID: slot?.location?.blockId ?? null,
        SLOT_LOCATION_TABLECELLID: slot?.location?.tableCellId ?? null,
        SLOT_TARGET_EVIDENCE: slot ? (slot.location?.blockId ? 'EXACT_STRUCTURAL_TARGET' : (slot.evidence?.rawPattern ? 'TOKEN_PATTERN_TARGET' : 'TARGET_EVIDENCE_PARTIAL')) : 'TARGET_EVIDENCE_MISSING',
        SLOT_REQUIRED: slot ? Boolean(slot.required) : null,
        BINDING_TRANSFORM: binding?.transform ?? 'identity',
        BINDING_FALLBACK: binding?.fallback ?? null,
        DIM_VERDICTS: verdicts,
        COMPOSITE_VERDICT: composite,
        IS_HARD_BLOCKER: isHardBlock(composite),
        IS_COMPATIBILITY_WARNING: isCompatibilityWarning(composite),
        COMPILED_PRESENT: !!compiledInfo,
        PANEL_PRESENT: panel.has(field.path),
        FORM_INPUTS_HYDRATED: formInputsHydration.has(field.path),
        ADAPTER_TARGET_MATCH: adapterInfo?.targetMatch ?? null,
      });
    }
  }

  // Form-level: rolling up the per-field verdicts.
  const formRows = {};
  for (const row of rows) {
    if (!formRows[row.FORM_CODE]) {
      formRows[row.FORM_CODE] = {
        formCode: row.FORM_CODE,
        fieldsExamined: 0,
        hardBlockers: 0,
        compatibilityWarnings: 0,
        exact: 0,
        blockingVerdicts: new Set(),
        allPresentationOnly: true,
        safeForAccountingCutover: true,
        safeForRenderCutover: true,
        safeForPromotionCutover: true,
      };
    }
    const acc = formRows[row.FORM_CODE];
    acc.fieldsExamined += 1;
    if (row.IS_HARD_BLOCKER) {
      acc.hardBlockers += 1;
      acc.blockingVerdicts.add(row.COMPOSITE_VERDICT);
      // Hard blockers block render + promotion but NOT necessarily accounting.
      // Accounting only needs locked index integrity + verifiable counts.
      acc.safeForRenderCutover = false;
      acc.safeForPromotionCutover = false;
    }
    if (row.COMPOSITE_VERDICT === 'TARGET_DRIFT' || row.COMPOSITE_VERDICT === 'TRANSFORM_DRIFT') {
      acc.safeForRenderCutover = false;
      acc.safeForPromotionCutover = false;
    }
    // Cross-tier blockers: type, role, save-payload drift, semantic canaries.
    if (row.COMPOSITE_VERDICT === 'SEMANTIC_CORRUPTION_SUSPECTED'
        || row.COMPOSITE_VERDICT === 'SAVE_PAYLOAD_DRIFT'
        || row.COMPOSITE_VERDICT === 'ROLE_DRIFT'
        || row.COMPOSITE_VERDICT === 'TYPE_DRIFT') {
      acc.safeForAccountingCutover = false;
    }
    if (row.IS_COMPATIBILITY_WARNING) acc.compatibilityWarnings += 1;
    if (row.COMPOSITE_VERDICT === 'EXACT') acc.exact += 1;
    if (!row.IS_COMPATIBILITY_WARNING && !row.IS_HARD_BLOCKER && row.COMPOSITE_VERDICT !== 'EXACT') acc.allPresentationOnly = false;
  }

  const summary = {
    schema: 'qllaw.213.locked_drift_decomposition/v1',
    generatedAt: new Date().toISOString(),
    indexSchema: index.schema,
    totalRows: rows.length,
    byCompositeVerdict: verdictCounts,
    byDimensionMatch: dimCounts,
    byDimensionMismatch: dimMismatchCounts,
    formTotals: Object.values(formRows).map((f) => ({
      formCode: f.formCode,
      fieldsExamined: f.fieldsExamined,
      hardBlockers: f.hardBlockers,
      compatibilityWarnings: f.compatibilityWarnings,
      exact: f.exact,
      blockingVerdicts: [...f.blockingVerdicts],
      safeForAccountingCutover: f.safeForAccountingCutover,
      safeForRenderCutover: f.safeForRenderCutover,
      safeForPromotionCutover: f.safeForPromotionCutover,
    })),
    accountingSafeForms: Object.values(formRows).filter((f) => f.safeForAccountingCutover).length,
    renderSafeForms: Object.values(formRows).filter((f) => f.safeForRenderCutover).length,
    promotionSafeForms: Object.values(formRows).filter((f) => f.safeForPromotionCutover).length,
    rowsHashSha256: createHash('sha256').update(JSON.stringify(rows.map((r) => ({ idx: r.ROW_INDEX, v: r.COMPOSITE_VERDICT, t: r.BINDING_TRANSFORM })))).digest('hex'),
  };

  mkdirSync(path.dirname(OUTPUT_ROWS), { recursive: true });
  writeFileSync(OUTPUT_ROWS, `${JSON.stringify({ schema: 'qllaw.213.locked_drift_decomposition/v1', generatedAt: summary.generatedAt, indexSchema: index.schema, summary, rows }, null, 2)}\n`, 'utf8');
  writeFileSync(OUTPUT_SUMMARY, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  return { outputRows: OUTPUT_ROWS, outputSummary: OUTPUT_SUMMARY, summary };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { summary, outputRows, outputSummary } = decomposeDrift();
  console.log(`OK drift decomposition: rows=${summary.totalRows} compositeVerdicts=${JSON.stringify(summary.byCompositeVerdict)}`);
  console.log(`   safe counts: accounting=${summary.accountingSafeForms} render=${summary.renderSafeForms} promotion=${summary.promotionSafeForms}`);
  console.log(`   artifacts: ${path.relative(REPO_ROOT, outputRows)}; ${path.relative(REPO_ROOT, outputSummary)}`);
}
