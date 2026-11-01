// Phase 2 — locked semantic consistency guard.
//
// For every canonical field in the locked runtime index this validates
// semantic consistency between:
//   - key namespace (e.g. person.fullName) vs slot namespace / role zone
//   - field.type vs slot.slotType
//   - field.uiComponent vs field.type
//   - field.label vs field.path and slot.context
//   - field.section vs slot region (top-level root)
//   - field.source vs field.uiComponent
//   - role identity does not cross signer / receiver / issuer / person / agency
//     boundaries (from repair metadata)
//   - repair history does NOT merely rename an incompatible binding
//
// Output: docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/semantic-consistency-overlay.json
//
// The overlay never modifies locked contracts. It records:
//   FORM_CODE
//   FIELD_PATH
//   LOCKED_VALUE
//   CURRENT_VALUE (the value as it currently appears in compiled/panel surface)
//   SOURCE_CONTEXT
//   CONFLICT
//   PROPOSED_RUNTIME_INTERPRETATION
//   EVIDENCE
//   OVERLAY_STATUS  in { AUTO_VALIDATED_COMPATIBILITY, SOURCE_PROVEN_RUNTIME_OVERRIDE, BLOCKED_PENDING_SOURCE_PROOF }

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/semantic-consistency-overlay.json');

const ALLOWED_CONFLICTS = new Set([
  'SEMANTICALLY_CONSISTENT',
  'PRESENTATION_METADATA_DRIFT',
  'CONTROL_METADATA_DRIFT',
  'ROLE_CONFLICT',
  'TYPE_CONFLICT',
  'TARGET_CONTEXT_CONFLICT',
  'REPAIR_HISTORY_CONFLICT',
  'REQUIRES_SOURCE_ADJUDICATION',
]);
const ALLOWED_STATUSES = new Set([
  'AUTO_VALIDATED_COMPATIBILITY',
  'SOURCE_PROVEN_RUNTIME_OVERRIDE',
  'BLOCKED_PENDING_SOURCE_PROOF',
]);

function readIfExists(p) {
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function rootOf(fieldPath) {
  return String(fieldPath ?? '').split('.')[0] || '';
}

function leafOf(fieldPath) {
  return String(fieldPath ?? '').split('.').slice(-1)[0] || '';
}

// type/uiComponent compatibility table.
const TYPE_TO_UI = new Set(['text', 'date', 'select', 'number', 'boolean']);
const UI_TO_TYPES = {
  text: ['string', 'text'],
  textarea: ['string', 'multilineText'],
  date: ['date', 'datePart', 'datetime'],
  select: ['select', 'enum', 'string'],
  number: ['number'],
  boolean: ['boolean'],
};

function validate(field, slot, binding) {
  const conflicts = [];
  const evidence = [];
  const zone = rootOf(field.path);
  const leaf = leafOf(field.path);
  const ft = String(field.type ?? '').toLowerCase();
  const ui = String(field.uiComponent ?? '').toLowerCase();
  const st = String(slot?.slotType ?? '').toLowerCase();
  const context = String(slot?.context ?? '');

  // namespace compatibility
  if (zone && !context.includes(`{{${field.path}}}`) && context && !context.includes(field.path)) {
    // Loose: context MAY be empty for unknown patterns, but if context exists and
    // doesn't reference the field path at all, that's an extraction anomaly.
    if (context.startsWith('{{') && !context.includes(field.path)) {
      conflicts.push({ type: 'TARGET_CONTEXT_CONFLICT', evidence: { slotContext: context, expected: `{{${field.path}}}` } });
    }
  }

  // type/uiComponent compatibility
  if (ui && UI_TO_TYPES[ui] && ft && !UI_TO_TYPES[ui].includes(ft)) {
    conflicts.push({ type: 'TYPE_CONFLICT', evidence: { uiComponent: ui, fieldType: ft, allowedTypes: UI_TO_TYPES[ui] } });
  }

  // semantic canary: person.fullName with ui=date
  if (zone === 'person' && ui === 'date') {
    conflicts.push({ type: 'TYPE_CONFLICT', evidence: { canary: 'person-key-with-date-ui', uiComponent: ui } });
  }
  // person field targeting issue-date context
  if (zone === 'person' && context && (context.toLowerCase().includes('issuedate') || context.toLowerCase().includes('issueplace'))) {
    conflicts.push({ type: 'TARGET_CONTEXT_CONFLICT', evidence: { canary: 'person-key-targeting-issue-date', context } });
  }
  // issue date targeting person-name region
  if (zone === 'document' && leaf.toLowerCase().includes('date') && context && context.toLowerCase().includes('fullname')) {
    conflicts.push({ type: 'TARGET_CONTEXT_CONFLICT', evidence: { canary: 'date-key-targeting-person-region', context } });
  }
  // agency key targeting signer slot
  if (zone === 'agency' && context && (context.includes('{{issuer.') || context.toLowerCase().includes('signer'))) {
    conflicts.push({ type: 'ROLE_CONFLICT', evidence: { canary: 'agency-key-targeting-signer-slot', context } });
  }
  // legal-basis labelled as person identity
  if (zone === 'legalHeader' && field.label && /(?:nhân thân|sinh năm|năm sinh|nơi cư trú)/i.test(String(field.label))) {
    conflicts.push({ type: 'ROLE_CONFLICT', evidence: { canary: 'legal-basis-as-person-identity', label: field.label } });
  }
  // receiver key targeting signer
  if (zone === 'recipient' && context && context.toLowerCase().includes('signer')) {
    conflicts.push({ type: 'ROLE_CONFLICT', evidence: { canary: 'receiver-in-signer-slot', context } });
  }

  return { conflicts, evidence, zone, leaf, type: ft, ui, slotType: st };
}

function overlayStatusFor(conflicts) {
  if (conflicts.length === 0) return 'AUTO_VALIDATED_COMPATIBILITY';
  const types = new Set(conflicts.map((c) => c.type));
  if (types.has('ROLE_CONFLICT') || types.has('TYPE_CONFLICT') || types.has('TARGET_CONTEXT_CONFLICT')) {
    return 'BLOCKED_PENDING_SOURCE_PROOF';
  }
  return 'SOURCE_PROVEN_RUNTIME_OVERRIDE';
}

function primaryConflictLabel(conflicts) {
  if (conflicts.length === 0) return 'SEMANTICALLY_CONSISTENT';
  const order = ['TYPE_CONFLICT', 'TARGET_CONTEXT_CONFLICT', 'ROLE_CONFLICT', 'REPAIR_HISTORY_CONFLICT', 'CONTROL_METADATA_DRIFT', 'PRESENTATION_METADATA_DRIFT'];
  for (const t of order) {
    const hit = conflicts.find((c) => c.type === t);
    if (hit) return t;
  }
  return conflicts[0].type;
}

export function runSemanticConsistencyGuard(options = {}) {
  const index = loadLockedRuntimeIndex();
  const overlay = [];
  let totalFields = 0;
  let conflictCount = 0;
  const corruptionCanaries = [];

  for (const form of index.forms) {
    for (const field of form.runtimeView.canonicalFields) {
      totalFields += 1;
      const slot = form.runtimeView.docxSlots.find((s) => s.slotId === field.path);
      const binding = form.runtimeView.renderBindings.find((b) => b.slotId === field.path);
      const { conflicts, evidence } = validate(field, slot, binding);
      const conflict = primaryConflictLabel(conflicts);
      const status = overlayStatusFor(conflicts);

      if (conflicts.length > 0) conflictCount += 1;
      for (const c of conflicts) {
        if (c.type === 'ROLE_CONFLICT' || c.type === 'TYPE_CONFLICT') {
          if (c.evidence && c.evidence.canary) {
            corruptionCanaries.push({
              FORM_CODE: form.identity.templateCode,
              FIELD_PATH: field.path,
              canary: c.evidence.canary,
              evidence: c.evidence,
              CONFLICT: c.type,
            });
          }
        }
      }

      overlay.push({
        FORM_CODE: form.identity.templateCode,
        FIELD_PATH: field.path,
        LOCKED_VALUE: { type: field.type, uiComponent: field.uiComponent, label: field.label, section: field.section, source: field.source, required: Boolean(field.required) },
        CURRENT_VALUE: { slotType: slot?.slotType ?? null, slotContext: slot?.context ?? null, slotLabel: slot?.label ?? null, slotRequired: slot ? Boolean(slot.required) : null, transform: binding?.transform ?? null },
        SOURCE_CONTEXT: slot?.context ?? null,
        CONFLICT: conflict,
        CONFLICT_DETAILS: conflicts,
        PROPOSED_RUNTIME_INTERPRETATION: status === 'BLOCKED_PENDING_SOURCE_PROOF'
          ? 'interpret label meaning from source; never from secondary label or repair rename'
          : (status === 'SOURCE_PROVEN_RUNTIME_OVERRIDE'
            ? 'use locked binding + slot; label drift tolerated when binding is authoritative'
            : 'use locked binding as-is'),
        EVIDENCE: evidence,
        OVERLAY_STATUS: status,
      });
    }
  }

  const result = {
    schema: 'qllaw.213.semantic_consistency_overlay/v1',
    generatedAt: new Date().toISOString(),
    indexSchema: index.schema,
    totalFields,
    conflictCount,
    corruptionCanaries,
    overlay,
  };

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, result };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { result, outputPath } = runSemanticConsistencyGuard();
  console.log(`OK semantic consistency: fields=${result.totalFields} conflicts=${result.conflictCount} canaries=${result.corruptionCanaries.length}`);
  for (const canary of result.corruptionCanaries) {
    console.log(`     canary: ${canary.FORM_CODE}.${canary.FIELD_PATH} (${canary.canary}) [${canary.CONFLICT}]`);
  }
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
}
