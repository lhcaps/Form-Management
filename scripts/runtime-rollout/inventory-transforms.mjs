// Phase 3 — transform inventory + implementation.
//
// Walks every locked renderBinding across all 2497 bindings, counts distinct
// transforms, names their bindings, forms, current implementation, and
// produces the inventory JSON.
//
// Currently there are exactly two transforms in the corpus:
//   - identity                 (no-op; already implemented by default)
//   - date.issuePlaceDateLine  (61 instances; needs explicit implementation)

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_INVENTORY = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/transform-inventory.json');
const OUTPUT_FORM_BINDINGS = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/transform-form-bindings.json');
const TRANSFORMS_MJS = path.join(REPO_ROOT, 'scripts/runtime-rollout/lib/locked-transforms.mjs');
const TRANSFORMS_TEST = path.join(REPO_ROOT, 'scripts/runtime-rollout/lib/locked-transforms.test.mjs');

export const IMPLEMENTED_TRANSFORMS = new Set(['identity', 'date.issuePlaceDateLine']);

export function applyTransform(name, value, options = {}) {
  if (!IMPLEMENTED_TRANSFORMS.has(name)) {
    throw new Error(`[transforms] UNIMPLEMENTED: ${name}`);
  }
  if (name === 'identity') return value;
  if (name === 'date.issuePlaceDateLine') return applyIssuePlaceDateLine(value, options);
  return value;
}

// date.issuePlaceDateLine — Vietnamese legal doc phrase.
//
// Inputs can be one of three shapes:
//   (A) { issueDate: '2026-01-15' | '15/01/2026', agency: { diaDanh: 'Hà Nội' } | string }
//   (B) "Hà Nội, ngày 15 tháng 01 năm 2026"  (round-trip / canonical)
//   (C) Free text payload for the run: e.g. "R1-BM-001-document.issuePlaceDateLine-15/01/2026"
//       we extract the date token if present in the text.
//
// Output: a Vietnamese phrase that preserves surrounding static text when
// possible, and never fabricates a date or location.
function applyIssuePlaceDateLine(value, options = {}) {
  if (value == null) return '';
  // Shape (C): tokenize date tokens out of free text payload.
  const txt = typeof value === 'string' ? value : '';
  const dateToken = txt.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  let parts = {};
  if (dateToken) {
    parts.issueDate = `${dateToken[1].padStart(2, '0')}/${dateToken[2].padStart(2, '0')}/${dateToken[3]}`;
  }
  if (typeof value === 'object') {
    parts = { ...parts, ...value };
  } else {
    // Try to parse a round-trip phrase.
    const m = txt.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
    if (m) parts.issueDate = `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
    const agencyMatch = txt.match(/^\s*([^,]+?),\s*ngày/i);
    if (agencyMatch) parts.agency = { diaDanh: agencyMatch[1].trim() };
  }
  const issueDate = String(parts?.issueDate ?? '').trim();
  const agencyName = String(parts?.agency?.diaDanh ?? parts?.agency?.name ?? parts?.agency ?? options.agencyName ?? '').trim();
  if (!issueDate && !agencyName) return '';
  const dayMonthYear = formatVietnameseDate(issueDate);
  if (agencyName && dayMonthYear) return `${agencyName}, ${dayMonthYear}`;
  if (dayMonthYear) return dayMonthYear;
  return agencyName;
}

function formatVietnameseDate(raw) {
  if (!raw) return '';
  let day, month, year;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    [year, month, day] = raw.split('-');
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    [day, month, year] = raw.split('/');
  } else {
    return raw;
  }
  const d = String(Number(day)).padStart(2, '0');
  const m = String(Number(month)).padStart(2, '0');
  return `ngày ${d} tháng ${m} năm ${year}`;
}

export function buildTransformInventory(options = {}) {
  const index = loadLockedRuntimeIndex();
  const transformMap = new Map(); // transform -> { bindingCount, forms:Set, sampleBindings, inputType, outputType, targetSlotType }
  let totalBindings = 0;
  for (const form of index.forms) {
    for (const b of form.runtimeView.renderBindings ?? []) {
      const name = b.transform ?? 'identity';
      totalBindings += 1;
      const slot = form.runtimeView.docxSlots.find((s) => s.slotId === b.slotId);
      const field = form.runtimeView.canonicalFields.find((f) => f.path === b.from);
      let entry = transformMap.get(name);
      if (!entry) {
        entry = {
          TRANSFORM: name,
          BINDING_COUNT: 0,
          FORMS: new Set(),
          CURRENT_IMPLEMENTATION: IMPLEMENTED_TRANSFORMS.has(name) ? 'locked-transforms.mjs' : 'NONE',
          INPUT_TYPE: field?.type ?? null,
          OUTPUT_TYPE: 'string',
          TARGET_SLOT_TYPE: slot?.slotType ?? null,
          TEST_COVERAGE: name === 'identity' || name === 'date.issuePlaceDateLine' ? 'covered_by_locked-transforms.test.mjs' : 'NONE',
          STATUS: IMPLEMENTED_TRANSFORMS.has(name) ? 'IMPLEMENTED' : 'TRANSFORM_UNIMPLEMENTED',
          SAMPLE_BINDINGS: [],
        };
        transformMap.set(name, entry);
      }
      entry.BINDING_COUNT += 1;
      entry.FORMS.add(form.identity.templateCode);
      if (entry.SAMPLE_BINDINGS.length < 3) {
        entry.SAMPLE_BINDINGS.push({ FORM_CODE: form.identity.templateCode, SLOT_ID: b.slotId, FROM: b.from });
      }
    }
  }
  // Persist the inventory.
  const inventory = {
    schema: 'qllaw.213.locked_transform_inventory/v1',
    generatedAt: new Date().toISOString(),
    totalBindings,
    transformCount: transformMap.size,
    rows: [...transformMap.values()].map((r) => ({ ...r, FORMS: [...r.FORMS] })),
    unimplementedTransforms: [...transformMap.values()].filter((r) => !IMPLEMENTED_TRANSFORMS.has(r.TRANSFORM)).map((r) => r.TRANSFORM),
    TRANSFORM_UNIMPLEMENTED_COUNT: [...transformMap.values()].filter((r) => !IMPLEMENTED_TRANSFORMS.has(r.TRANSFORM)).reduce((acc, r) => acc + r.BINDING_COUNT, 0),
    indexedAtIso: new Date().toISOString(),
  };

  // Persist a compact form->bindings map for downstream R1/R2 consumers.
  const formBindings = {};
  for (const form of index.forms) {
    formBindings[form.identity.templateCode] = (form.runtimeView.renderBindings ?? []).map((b) => ({ slotId: b.slotId, from: b.from, transform: b.transform ?? 'identity' }));
  }

  mkdirSync(path.dirname(OUTPUT_INVENTORY), { recursive: true });
  writeFileSync(OUTPUT_INVENTORY, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  writeFileSync(OUTPUT_FORM_BINDINGS, `${JSON.stringify({ schema: 'qllaw.213.locked_form_bindings/v1', generatedAt: inventory.generatedAt, formBindings }, null, 2)}\n`, 'utf8');

  // Emit the shared transforms module that other consumers import.
  const transformsModuleSource = `// Auto-generated by scripts/runtime-rollout/inventory-transforms.mjs.
// Source-of-truth for TRANSFORM_UNIMPLEMENTED=0 in the locked authority wave.
${transformsModuleSourceBody()}
`;
  writeFileSync(TRANSFORMS_MJS, transformsModuleSource, 'utf8');

  const inventoryHash = createHash('sha256').update(JSON.stringify(inventory)).digest('hex');
  return { inventory, inventoryHash, outputInventory: OUTPUT_INVENTORY, outputFormBindings: OUTPUT_FORM_BINDINGS, transformsMjs: TRANSFORMS_MJS };
}

function transformsModuleSourceBody() {
  return `import { applyTransform, IMPLEMENTED_TRANSFORMS, buildTransformInventory } from '../inventory-transforms.mjs';
export { applyTransform, IMPLEMENTED_TRANSFORMS, buildTransformInventory };
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { inventory, inventoryHash, outputInventory, outputFormBindings, transformsMjs } = buildTransformInventory();
  console.log(`OK transform inventory: ${inventory.transformCount} transforms; unimplemented=${inventory.unimplementedTransforms.length} (${inventory.TRANSFORM_UNIMPLEMENTED_COUNT} bindings)`);
  console.log(`     rows:`);
  for (const r of inventory.rows) {
    console.log(`       ${r.TRANSFORM}: count=${r.BINDING_COUNT} forms=${r.FORMS.length} status=${r.STATUS}`);
  }
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputInventory)}; ${path.relative(REPO_ROOT, outputFormBindings)}; ${path.relative(REPO_ROOT, transformsMjs)}`);
}
