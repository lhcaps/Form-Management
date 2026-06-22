#!/usr/bin/env node
/**
 * Fix locked contracts after Wave 02 DOCX mustache remediation — Phase 2.
 *
 * Problem: sequential names like document.field1, document.field2 still match
 * the generic path regex: (^|\.)field(?:\d+)?(?:_|$)
 *
 * Fix: rename remaining document.fieldN slots to fully semantic paths
 * that do NOT contain "field" anywhere in the path.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const DOCX_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// Mustache → semantic slot rename map (no "field" anywhere in path)
const WAVE_02_RENAME_MAP = {
  // BM-068
  "document.field1": "signature.positionTitle",
  "document.field2": "legalBasis.legalBasisLine",
  "document.field3": "document.fullDocumentCode",
  "document.field5": "document.summaryLine",
  // BM-069
  "document.field1": "agency.name",
  "document.field2": "document.fullDocumentCode",
  "document.field3": "document.fullDocumentCode2",
  "document.field4": "document.issueDate",
  "document.field5": "document.issuePlace",
  "document.field6": "document.reasonLine",
  "document.field7": "document.reasonLine2",
  "document.field8": "decision.decisionLine",
  "document.field9": "person.currentAddress",
  "document.field10": "person.occupation",
  "document.field11": "person.dateOfBirthLine",
  "document.field12": "document.summaryLine",
  // BM-073
  "document.field1": "document.issuePlace",
  "document.field2": "document.issueDate",
  "document.field3": "person.currentAddress",
  "document.field4": "person.occupation",
  "document.field5": "person.idNumber",
  // BM-075
  "document.field1": "person.personFullName",
  // BM-077
  "document.field1": "document.contentLine",
  // BM-080
  "document.field1": "document.fullDocumentCode",
  "document.field2": "person.dateOfBirth",
  // BM-082
  "document.field1": "document.contentLine",
  // BM-162
  "document.field1": "document.fullDocumentCode",
  "document.field2": "document.issueDate",
  "document.field3": "document.issuePlace",
  "document.field4": "person.dateOfBirthLine",
  // BM-163
  "document.field1": "document.fullDocumentCode",
  "document.field2": "document.issueDate",
  "document.field3": "person.dateOfBirthLine",
};

function applyRenameInContract(contract, renames) {
  let changed = false;

  // Pass 1: check for collision targets (slots that already exist semantically)
  const existingSlotIds = new Set((contract.docxSlots ?? []).map((s) => s.slotId));
  const existingFieldPaths = new Set((contract.canonicalFields ?? []).map((f) => f.path));

  // For each rename, skip if target already exists (collision)
  const skippedRenames = new Set();
  for (const [old, newPath] of Object.entries(renames)) {
    if (existingSlotIds.has(newPath) || existingFieldPaths.has(newPath)) {
      skippedRenames.add(old);
    }
  }

  // Pass 2: process renames
  for (const [old, newPath] of Object.entries(renames)) {
    if (skippedRenames.has(old)) continue;

    // Rename docxSlots
    for (const slot of contract.docxSlots ?? []) {
      if (slot.slotId === old) {
        slot.slotId = newPath;
        changed = true;
      }
    }
    // Rename canonicalFields
    for (const field of contract.canonicalFields ?? []) {
      if (field.path === old) {
        field.path = newPath;
        changed = true;
      }
    }
    // Rename renderBindings
    for (const binding of contract.renderBindings ?? []) {
      if (binding.slotId === old) {
        binding.slotId = newPath;
        binding.from = newPath;
        changed = true;
      }
    }
  }

  return changed;
}

const WAVE_02 = [
  "BM-068", "BM-069", "BM-073", "BM-075",
  "BM-077", "BM-080", "BM-082", "BM-162", "BM-163",
];

console.log("\nPhase 2: Rename generic fieldN paths to semantic paths\n");

let fixed = 0;
for (const code of WAVE_02) {
  const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
    (f) => f.startsWith(`${code}__`) && f.endsWith(".contract.locked.json"),
  );
  if (!lockedFiles.length) { console.log(`SKIP: ${code} — no locked file`); continue; }

  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const locked = JSON.parse(fs.readFileSync(lockedPath, "utf8"));

  // Find which renames apply to this form
  const formRenames = {};
  for (const [old, newPath] of Object.entries(WAVE_02_RENAME_MAP)) {
    // Check if this slot exists in the locked contract
    const hasSlot = (locked.docxSlots ?? []).some((s) => s.slotId === old);
    const hasField = (locked.canonicalFields ?? []).some((f) => f.path === old);
    const hasBinding = (locked.renderBindings ?? []).some((b) => b.slotId === old);
    if (hasSlot || hasField || hasBinding) {
      formRenames[old] = newPath;
    }
  }

  if (!Object.keys(formRenames).length) {
    console.log(`OK:     ${code} (no generic fieldN slots found)`);
    continue;
  }

  const changed = applyRenameInContract(locked, formRenames);

  if (changed) {
    locked.reviewedAt = new Date().toISOString();
    locked.reviewedBy = "Le Huy (wave-02 phase-2 fix)";
    locked.reviewKind = "human";
    fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));
    console.log(`FIX:    ${code} — renamed: ${Object.entries(formRenames).map(([o, n]) => `${o} → ${n}`).join(", ")}`);
    fixed++;
  } else {
    console.log(`OK:     ${code} (no changes needed)`);
  }
}

console.log(`\nFixed: ${fixed} forms`);
console.log("\nDone.");
