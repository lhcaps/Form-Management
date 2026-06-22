import { createHash } from "node:crypto";

import PizZip from "pizzip";

const REQUIRED_PARTS = Object.freeze([
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
]);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function inspectDocx(buffer) {
  let zip;
  try {
    zip = new PizZip(buffer);
  } catch (error) {
    throw new Error(
      `Invalid DOCX package: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const missing = REQUIRED_PARTS.filter((partName) => !zip.file(partName));
  if (missing.length > 0) {
    throw new Error(
      `DOCX package is missing required part(s): ${missing.join(", ")}`,
    );
  }

  const documentXml = zip.file("word/document.xml").asText();
  return {
    sha256: sha256(buffer),
    placeholders: new Set(
      [...documentXml.matchAll(/\{\{([^{}]+)\}\}/gu)].map((match) =>
        match[1].trim(),
      ),
    ),
  };
}

function collapseExact(records, keyOf, semanticValue, label) {
  const kept = new Map();
  let removed = 0;

  for (const record of records) {
    const key = keyOf(record);
    const existing = kept.get(key);
    if (!existing) {
      kept.set(key, record);
      continue;
    }
    if (
      JSON.stringify(semanticValue(existing)) !==
      JSON.stringify(semanticValue(record))
    ) {
      throw new Error(`Conflicting duplicate ${label} "${key}".`);
    }
    removed += 1;
  }

  return { records: [...kept.values()], removed };
}

export function reconcileLockedContract(contract, normalizedDocxBuffer) {
  const packageInfo = inspectDocx(normalizedDocxBuffer);
  const reconciled = structuredClone(contract);
  const changes = [];

  if (reconciled.extractionSource?.sha256 !== packageInfo.sha256) {
    reconciled.extractionSource = {
      ...(reconciled.extractionSource ?? {}),
      sha256: packageInfo.sha256,
    };
    changes.push("SYNCED_EXTRACTION_HASH");
  }

  const slots = collapseExact(
    reconciled.docxSlots ?? [],
    (slot) => slot.slotId,
    (slot) => ({
      slotType: slot.slotType ?? null,
      required: Boolean(slot.required),
      reviewRequired: Boolean(slot.reviewRequired),
    }),
    "DOCX slot",
  );
  reconciled.docxSlots = slots.records;
  if (slots.removed > 0) {
    changes.push(`COLLAPSED_EXACT_SLOT_DUPLICATES:${slots.removed}`);
  }

  const bindings = collapseExact(
    reconciled.renderBindings ?? [],
    (binding) => binding.slotId,
    (binding) => ({
      from: binding.from ?? null,
      transform: binding.transform ?? null,
      fallback: binding.fallback ?? null,
      reviewRequired: Boolean(binding.reviewRequired),
    }),
    "render binding",
  );
  const withoutOrphans = bindings.records.filter((binding) =>
    packageInfo.placeholders.has(binding.slotId),
  );
  const orphanCount = bindings.records.length - withoutOrphans.length;
  const existingBindingIds = new Set(
    withoutOrphans.map((binding) => binding.slotId),
  );
  const fieldsByPath = new Map(
    (reconciled.canonicalFields ?? []).map((field) => [field.path, field]),
  );
  const addedBindings = [];
  for (const slot of reconciled.docxSlots) {
    if (
      existingBindingIds.has(slot.slotId) ||
      !packageInfo.placeholders.has(slot.slotId) ||
      !fieldsByPath.has(slot.slotId)
    ) {
      continue;
    }
    const field = fieldsByPath.get(slot.slotId);
    addedBindings.push({
      slotId: slot.slotId,
      from: slot.slotId,
      transform: "identity",
      fallback: "",
      reviewRequired:
        slot.reviewRequired === true || field.reviewRequired === true,
    });
    existingBindingIds.add(slot.slotId);
  }
  reconciled.renderBindings = [...withoutOrphans, ...addedBindings];
  if (bindings.removed > 0) {
    changes.push(
      `COLLAPSED_EXACT_BINDING_DUPLICATES:${bindings.removed}`,
    );
  }
  if (orphanCount > 0) {
    changes.push(`REMOVED_ORPHAN_BINDINGS:${orphanCount}`);
  }
  if (addedBindings.length > 0) {
    changes.push(`ADDED_IDENTITY_BINDINGS:${addedBindings.length}`);
  }

  return {
    contract: reconciled,
    changes,
  };
}
