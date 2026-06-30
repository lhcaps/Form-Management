/**
 * Contract Structural Mismatches for DOCX Atlas V1
 *
 * Analyzes mismatches between DOCX placeholders, docxSlots, canonicalFields,
 * and renderBindings. Reused logic from plan-contract-repair-batch-1-evidence.mjs.
 *
 * IMPORTANT: Does NOT assume canonicalFields.path == docxSlots.slotId.
 * These are separate namespaces.
 *
 * @module contract-structural-mismatches
 */

import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readFileSync } from 'node:fs';

// ─── Slot ID extraction ────────────────────────────────────────────────────────

/**
 * Extract slot ID from a slot object (handles slotId or id field).
 */
export function slotId(slot) {
  return slot.slotId ?? slot.id ?? '';
}

/**
 * Extract slot ID from a binding object (handles slotId or id field).
 */
export function bindingSlotId(binding) {
  return binding.slotId ?? binding.id ?? '';
}

// ─── Simplification ────────────────────────────────────────────────────────────

/**
 * Simplify a docxSlot for comparison.
 */
export function simplifySlot(slot) {
  return {
    slotId: slotId(slot),
    label: slot.label ?? null,
    rawPattern: slot.rawPattern ?? null,
    required: slot.required ?? null,
    reviewRequired: slot.reviewRequired ?? null,
    context: slot.context ?? null,
    location: slot.location ?? null,
    confidence: slot.confidence ?? null,
  };
}

/**
 * Simplify a canonicalField for comparison.
 */
export function simplifyField(field) {
  return {
    path: field.path ?? null,
    label: field.label ?? null,
    source: field.source ?? null,
    required: field.required ?? null,
    reviewRequired: field.reviewRequired ?? null,
    rawPattern: field.rawPattern ?? null,
    type: field.type ?? null,
    uiComponent: field.uiComponent ?? null,
    section: field.section ?? null,
  };
}

/**
 * Simplify a renderBinding for comparison.
 */
export function simplifyBinding(binding) {
  return {
    slotId: bindingSlotId(binding),
    from: binding.from ?? null,
    transform: binding.transform ?? null,
    reviewRequired: binding.reviewRequired ?? null,
    fallback: binding.fallback ?? null,
  };
}

// ─── Mismatch Detection ───────────────────────────────────────────────────────

/**
 * Build structural mismatches between DOCX placeholders and contract metadata.
 *
 * @param {object} docxAtlas - Either a set of unique placeholders or a full DOCX atlas
 * @param {object} contract - The locked contract object
 * @returns {object} Structural mismatches
 */
export function buildStructuralMismatches(docxPlaceholderSetOrAtlas, contract) {
  // Support both formats:
  // 1. docxPlaceholderSetOrAtlas = Set or array of unique placeholder strings
  // 2. docxPlaceholderSetOrAtlas = { unique: string[] } (like render gate output)
  // 3. docxPlaceholderSetOrAtlas = { occurrences: [...], byPlaceholder: {...} } (full atlas)
  let docxPlaceholders;

  if (docxPlaceholderSetOrAtlas instanceof Set) {
    docxPlaceholders = docxPlaceholderSetOrAtlas;
  } else if (Array.isArray(docxPlaceholderSetOrAtlas)) {
    docxPlaceholders = new Set(docxPlaceholderSetOrAtlas);
  } else if (docxPlaceholderSetOrAtlas.unique) {
    docxPlaceholders = new Set(docxPlaceholderSetOrAtlas.unique);
  } else if (docxPlaceholderSetOrAtlas.occurrences) {
    // Full atlas: extract unique placeholders from occurrences
    docxPlaceholders = new Set(
      docxPlaceholderSetOrAtlas.occurrences.map((o) => o.placeholder)
    );
  } else if (docxPlaceholderSetOrAtlas.placeholderRisks) {
    docxPlaceholders = new Set(
      Object.keys(docxPlaceholderSetOrAtlas.placeholderRisks)
    );
  } else {
    docxPlaceholders = new Set();
  }

  const slots = contract.docxSlots ?? [];
  const fields = contract.canonicalFields ?? [];
  const bindings = contract.renderBindings ?? [];

  const slotIds = new Set(slots.map(slotId).filter(Boolean));
  const bindingSlotIds = new Set(bindings.map(bindingSlotId).filter(Boolean));
  const fieldPaths = new Set(fields.map((f) => f.path).filter(Boolean));

  // Build binding lookup maps
  const bindingFromBySlotId = new Map();
  const bindingSlotIdsByFrom = new Map();

  for (const binding of bindings) {
    const sid = bindingSlotId(binding);
    const from = binding.from ?? null;
    if (sid && from && !bindingFromBySlotId.has(sid)) {
      bindingFromBySlotId.set(sid, from);
    }
    if (from && sid) {
      const current = bindingSlotIdsByFrom.get(from) ?? [];
      current.push(sid);
      bindingSlotIdsByFrom.set(from, current);
    }
  }

  // Helper: check if slot has canonical source
  function slotHasCanonicalSource(id) {
    if (fieldPaths.has(id)) return true;
    const from = bindingFromBySlotId.get(id);
    return Boolean(from && fieldPaths.has(from));
  }

  // Helper: check if field has slot target
  function fieldHasSlotTarget(path) {
    if (slotIds.has(path)) return true;
    return (bindingSlotIdsByFrom.get(path) ?? []).some((id) => slotIds.has(id));
  }

  // Build mismatches
  const templatePlaceholdersWithoutSlots = [...docxPlaceholders]
    .filter((placeholder) => !slotIds.has(placeholder))
    .sort();

  const contractSlotsWithoutTemplatePlaceholders = [...slotIds]
    .filter((id) => !docxPlaceholders.has(id))
    .sort();

  const bindingsWithoutTemplatePlaceholders = bindings
    .filter((binding) => !docxPlaceholders.has(bindingSlotId(binding)))
    .map((binding) => bindingSlotId(binding))
    .filter(Boolean)
    .sort();

  const slotsWithoutBindings = [...slotIds]
    .filter((id) => !bindingSlotIds.has(id))
    .sort();

  const bindingsWithoutSlots = [...bindingSlotIds]
    .filter((id) => !slotIds.has(id))
    .sort();

  const slotsWithoutCanonicalFields = [...slotIds]
    .filter((id) => !slotHasCanonicalSource(id))
    .sort();

  const fieldsWithoutSlots = [...fieldPaths]
    .filter((path) => !fieldHasSlotTarget(path))
    .sort();

  const bindingsWithoutCanonicalFields = bindings
    .filter((binding) => binding.from && !fieldPaths.has(binding.from))
    .map((binding) => ({
      slotId: bindingSlotId(binding),
      from: binding.from,
    }))
    .filter((b) => b.slotId && b.from);

  // Duplicate semantic placeholders detection
  // Note: "duplicate" here means the same placeholder used multiple times in DOCX
  const duplicateSemanticPlaceholders = docxPlaceholderSetOrAtlas?.placeholders?.risks?.duplicateSemantic
    ?.map((risk) => risk.placeholder)
    ?.filter(Boolean) ?? [];
  const duplicatePlaceholders = duplicateSemanticPlaceholders.length > 0
    ? duplicateSemanticPlaceholders
    : [...docxPlaceholders].filter((placeholder) => {
    // A placeholder is "duplicate" if it maps to multiple bindings
    // or if it's a slot without clear binding
    const bindingsForSlot = bindings.filter((b) => bindingSlotId(b) === placeholder);
    return bindingsForSlot.length === 0 && slotIds.has(placeholder);
  });

  // Review-required items
  const reviewRequiredSlots = slots
    .filter((slot) => slot.reviewRequired === true)
    .map((slot) => slotId(slot))
    .filter(Boolean);

  const reviewRequiredFields = fields
    .filter((field) => field.reviewRequired === true)
    .map((field) => field.path)
    .filter(Boolean);

  const reviewRequiredBindings = bindings
    .filter((binding) => binding.reviewRequired === true)
    .map((binding) => bindingSlotId(binding))
    .filter(Boolean);

  return {
    templatePlaceholdersWithoutSlots,
    contractSlotsWithoutTemplatePlaceholders,
    bindingsWithoutTemplatePlaceholders,
    slotsWithoutBindings,
    bindingsWithoutSlots,
    slotsWithoutCanonicalFields,
    fieldsWithoutSlots,
    bindingsWithoutCanonicalFields,
    duplicateSemanticPlaceholders: duplicatePlaceholders,
    duplicatePlaceholders,
    reviewRequired: {
      slots: reviewRequiredSlots,
      fields: reviewRequiredFields,
      bindings: reviewRequiredBindings,
    },
    // Summary counts
    counts: {
      templatePlaceholdersWithoutSlots:
        templatePlaceholdersWithoutSlots.length,
      contractSlotsWithoutTemplatePlaceholders:
        contractSlotsWithoutTemplatePlaceholders.length,
      bindingsWithoutTemplatePlaceholders:
        bindingsWithoutTemplatePlaceholders.length,
      slotsWithoutBindings: slotsWithoutBindings.length,
      bindingsWithoutSlots: bindingsWithoutSlots.length,
      slotsWithoutCanonicalFields: slotsWithoutCanonicalFields.length,
      fieldsWithoutSlots: fieldsWithoutSlots.length,
      bindingsWithoutCanonicalFields: bindingsWithoutCanonicalFields.length,
      duplicateSemanticPlaceholders: duplicatePlaceholders.length,
      duplicatePlaceholders: duplicatePlaceholders.length,
      reviewRequiredSlots: reviewRequiredSlots.length,
      reviewRequiredFields: reviewRequiredFields.length,
      reviewRequiredBindings: reviewRequiredBindings.length,
    },
  };
}

/**
 * Summarize structural mismatches into human-readable format.
 */
export function summarizeStructuralMismatches(mismatches) {
  const lines = [];

  if (mismatches.templatePlaceholdersWithoutSlots.length > 0) {
    lines.push(
      `Template placeholders without slots: ${mismatches.templatePlaceholdersWithoutSlots.length}`
    );
    mismatches.templatePlaceholdersWithoutSlots.slice(0, 10).forEach((p) => {
      lines.push(`  - ${p}`);
    });
    if (mismatches.templatePlaceholdersWithoutSlots.length > 10) {
      lines.push(
        `  ... and ${mismatches.templatePlaceholdersWithoutSlots.length - 10} more`
      );
    }
  }

  if (mismatches.slotsWithoutBindings.length > 0) {
    lines.push(
      `Slots without bindings: ${mismatches.slotsWithoutBindings.length}`
    );
    mismatches.slotsWithoutBindings.slice(0, 10).forEach((s) => {
      lines.push(`  - ${s}`);
    });
    if (mismatches.slotsWithoutBindings.length > 10) {
      lines.push(
        `  ... and ${mismatches.slotsWithoutBindings.length - 10} more`
      );
    }
  }

  if (mismatches.slotsWithoutCanonicalFields.length > 0) {
    lines.push(
      `Slots without canonical fields: ${mismatches.slotsWithoutCanonicalFields.length}`
    );
    mismatches.slotsWithoutCanonicalFields.slice(0, 10).forEach((s) => {
      lines.push(`  - ${s}`);
    });
    if (mismatches.slotsWithoutCanonicalFields.length > 10) {
      lines.push(
        `  ... and ${mismatches.slotsWithoutCanonicalFields.length - 10} more`
      );
    }
  }

  if (mismatches.bindingsWithoutCanonicalFields.length > 0) {
    lines.push(
      `Bindings without canonical fields: ${mismatches.bindingsWithoutCanonicalFields.length}`
    );
    mismatches.bindingsWithoutCanonicalFields.slice(0, 10).forEach((b) => {
      lines.push(`  - ${b.slotId} -> ${b.from}`);
    });
    if (mismatches.bindingsWithoutCanonicalFields.length > 10) {
      lines.push(
        `  ... and ${mismatches.bindingsWithoutCanonicalFields.length - 10} more`
      );
    }
  }

  if (mismatches.reviewRequired.slots.length > 0) {
    lines.push(
      `Slots requiring review: ${mismatches.reviewRequired.slots.length}`
    );
  }

  return lines.length > 0 ? lines.join('\n') : 'No structural mismatches found.';
}

/**
 * Load a locked contract from disk.
 */
export function loadLockedContract(lockedDir, templateCode) {
  if (!existsSync(lockedDir)) {
    throw new Error(`Locked contracts directory not found: ${lockedDir}`);
  }

  const matches = readdirSync(lockedDir)
    .filter(
      (file) =>
        file.startsWith(`${templateCode}__`) &&
        file.endsWith('.contract.locked.json')
    )
    .sort();

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one locked contract for ${templateCode}, found ${matches.length}`
    );
  }

  const filePath = join(lockedDir, matches[0]);
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));

  return {
    file: filePath,
    sourceId: raw.sourceId ?? basename(filePath, '.json'),
    templateCode: raw.templateCode ?? templateCode,
    templateTitle: raw.templateTitle ?? raw.title ?? templateCode,
    status: raw.status ?? null,
    reviewKind: raw.reviewKind ?? null,
    canonicalFields: (raw.canonicalFields ?? []).map(simplifyField),
    docxSlots: (raw.docxSlots ?? []).map(simplifySlot),
    renderBindings: (raw.renderBindings ?? []).map(simplifyBinding),
    raw,
  };
}
