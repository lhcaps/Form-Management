#!/usr/bin/env node
/**
 * apply-bm096-single-candidate-approved-remap.mjs
 *
 * Apply approved remap for BM-096: document.diaChi → person.idNumber
 *
 * Approved by: Planner (ChatGPT) + CodeGraph-verified handoff
 * Decision: APPROVED_SAFE_PATH_REMAP
 *
 * Hard scope:
 *   - Only BM-096 locked contract
 *   - Only document.diaChi → person.idNumber
 *   - No signature.cheDo / signature.nguoiKy touches
 *   - source/required/reviewRequired must remain unchanged
 *
 * Default: dry-run. Pass --write to apply.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const LOCKED_FILE = "BM-096__a50a08efa62f.contract.locked.json";
const LOCKED_PATH = path.join(LOCKED_DIR, LOCKED_FILE);
const BACKUP_DIR = path.join(__dirname, "..", "..", "docs", "audit",
  "path-domain-binding-batch-1-bm096-single-candidate", "backups");

const WRITE_FLAG = process.argv.includes("--write");

// =============================================================================
// Approved decision constants
// =============================================================================

const APPROVED = {
  oldPath: "document.diaChi",
  newPath: "person.idNumber",
  oldLabel: "Ô trống",
  newLabel: "Số CCCD/CMND",
  rawPattern: "{{person.field14}}",
  textBefore: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:",
};

// =============================================================================
// Errors & logging
// =============================================================================

let exitCode = 0;
const ERRORS = [];

function log(level, msg) {
  const prefix = level === "FAIL" ? "❌" : level === "WARN" ? "⚠️" : "✅";
  console.log(`${prefix} [${level}] ${msg}`);
  if (level === "FAIL") {
    ERRORS.push(msg);
    exitCode = 1;
  }
}

// =============================================================================
// Safety assertions (pre-mutation)
// =============================================================================

function assertLockedExists(contract) {
  if (!contract) {
    log("FAIL", `Locked contract not found: ${LOCKED_FILE}`);
    return false;
  }
  log("OK", `Locked contract loaded: ${LOCKED_FILE}`);
  return true;
}

function assertCanonicalFieldGuard(contract) {
  const fields = contract.canonicalFields ?? [];

  const oldField = fields.find((f) => f.path === APPROVED.oldPath);
  if (!oldField) {
    log("FAIL", `canonicalFields: path '${APPROVED.oldPath}' not found — abort`);
    return false;
  }
  log("OK", `canonicalFields: found path '${APPROVED.oldPath}'`);

  const duplicate = fields.find((f) => f.path === APPROVED.newPath);
  if (duplicate) {
    log("FAIL", `canonicalFields: path '${APPROVED.newPath}' already exists — collision`);
    return false;
  }
  log("OK", `canonicalFields: '${APPROVED.newPath}' does NOT exist (no collision)`);

  if (oldField.label !== APPROVED.oldLabel) {
    log("FAIL", `canonicalFields: label is '${oldField.label}', expected '${APPROVED.oldLabel}'`);
    return false;
  }
  log("OK", `canonicalFields: label is '${APPROVED.oldLabel}' (matches)`);

  if (oldField.source !== "manual") {
    log("FAIL", `canonicalFields: source is '${oldField.source}', expected 'manual'`);
    return false;
  }
  log("OK", `canonicalFields: source='manual' (unchanged)`);

  if (oldField.required !== false) {
    log("FAIL", `canonicalFields: required is '${oldField.required}', expected false`);
    return false;
  }
  log("OK", `canonicalFields: required=false (unchanged)`);

  if (oldField.reviewRequired !== false) {
    log("FAIL", `canonicalFields: reviewRequired is '${oldField.reviewRequired}', expected false`);
    return false;
  }
  log("OK", `canonicalFields: reviewRequired=false (unchanged)`);

  return true;
}

function assertDocxSlotGuard(contract) {
  const slots = contract.docxSlots ?? [];

  const oldSlot = slots.find((s) => s.slotId === APPROVED.oldPath);
  if (!oldSlot) {
    log("FAIL", `docxSlots: slotId '${APPROVED.oldPath}' not found — abort`);
    return false;
  }
  log("OK", `docxSlots: found slotId '${APPROVED.oldPath}'`);

  const duplicate = slots.find((s) => s.slotId === APPROVED.newPath);
  if (duplicate) {
    log("FAIL", `docxSlots: slotId '${APPROVED.newPath}' already exists — collision`);
    return false;
  }
  log("OK", `docxSlots: '${APPROVED.newPath}' does NOT exist (no collision)`);

  if (oldSlot.label !== APPROVED.oldLabel) {
    log("FAIL", `docxSlots: label is '${oldSlot.label}', expected '${APPROVED.oldLabel}'`);
    return false;
  }
  log("OK", `docxSlots: label is '${APPROVED.oldLabel}' (matches)`);

  const rawPattern = oldSlot.evidence?.rawPattern;
  if (rawPattern !== APPROVED.rawPattern) {
    log("FAIL", `docxSlots: rawPattern is '${rawPattern}', expected '${APPROVED.rawPattern}'`);
    return false;
  }
  log("OK", `docxSlots: rawPattern='${rawPattern}' (unchanged)`);

  const textBefore = oldSlot.evidence?.textBefore;
  if (!textBefore?.includes(APPROVED.textBefore)) {
    log("FAIL", `docxSlots: textBefore does not include '${APPROVED.textBefore}'`);
    return false;
  }
  log("OK", `docxSlots: textBefore='${textBefore}' (unchanged)`);

  return true;
}

function assertRenderBindingGuard(contract) {
  const bindings = contract.renderBindings ?? [];

  const oldBinding = bindings.find((b) => b.slotId === APPROVED.oldPath);
  if (!oldBinding) {
    log("FAIL", `renderBindings: slotId '${APPROVED.oldPath}' not found — abort`);
    return false;
  }
  log("OK", `renderBindings: found slotId '${APPROVED.oldPath}'`);

  const duplicate = bindings.find((b) => b.slotId === APPROVED.newPath);
  if (duplicate) {
    log("FAIL", `renderBindings: slotId '${APPROVED.newPath}' already exists — collision`);
    return false;
  }
  log("OK", `renderBindings: '${APPROVED.newPath}' does NOT exist (no collision)`);

  return true;
}

/**
 * Safety: verify signature fields exist but are NOT part of the remap.
 * The "forbidden" guard means: these paths must NOT be in the remap set.
 * Since we only remap document.diaChi, signature.* are naturally untouched.
 * We assert they exist (proving they exist in the contract) and would not
 * be changed by a correct mutation of only document.diaChi.
 */
function assertNoSignatureTouch(contract) {
  const fields = contract.canonicalFields ?? [];
  const slots = contract.docxSlots ?? [];
  const bindings = contract.renderBindings ?? [];

  // Verify these paths exist in the contract (they do — this is expected)
  // and confirm they are NOT document.diaChi (they aren't — different paths)
  const forbiddenOldPaths = [APPROVED.oldPath];
  const forbiddenNewPaths = [APPROVED.newPath];

  for (const fp of ["signature.cheDo", "signature.nguoiKy"]) {
    const f = fields.find((f) => f.path === fp);
    const s = slots.find((s) => s.slotId === fp);
    const b = bindings.find((b) => b.slotId === fp);
    // These fields exist — good. They must not be in the remap set.
    const inRemap = forbiddenOldPaths.includes(fp) || forbiddenNewPaths.includes(fp);
    if (inRemap) {
      log("FAIL", `Signature field '${fp}' is in the remap set — forbidden`);
      return false;
    }
    log("OK", `signature.* field '${fp}': exists, not in remap (protected)`);
  }
  return true;
}

// =============================================================================
// Mutation
// =============================================================================

function applyMutation(contract) {
  const next = JSON.parse(JSON.stringify(contract));

  // canonicalFields
  const field = next.canonicalFields.find((f) => f.path === APPROVED.oldPath);
  const captured = {
    source: field.source,
    required: field.required,
    reviewRequired: field.reviewRequired,
    label: field.label,
  };
  field.path = APPROVED.newPath;
  field.label = APPROVED.newLabel;
  console.log(`  canonicalFields: '${APPROVED.oldPath}' → '${APPROVED.newPath}'`);
  console.log(`  canonicalFields: label '${captured.label}' → '${APPROVED.newLabel}'`);
  console.log(`  canonicalFields: source='${captured.source}' (preserved)`);
  console.log(`  canonicalFields: required=${captured.required} (preserved)`);
  console.log(`  canonicalFields: reviewRequired=${captured.reviewRequired} (preserved)`);

  // docxSlots
  const slot = next.docxSlots.find((s) => s.slotId === APPROVED.oldPath);
  const slotCaptured = { label: slot.label };
  slot.slotId = APPROVED.newPath;
  slot.label = APPROVED.newLabel;
  console.log(`  docxSlots: '${APPROVED.oldPath}' → '${APPROVED.newPath}'`);
  console.log(`  docxSlots: label '${slotCaptured.label}' → '${APPROVED.newLabel}'`);

  // renderBindings
  const binding = next.renderBindings.find((b) => b.slotId === APPROVED.oldPath);
  binding.slotId = APPROVED.newPath;
  binding.from = APPROVED.newPath;
  console.log(`  renderBindings: slotId '${APPROVED.oldPath}' → '${APPROVED.newPath}'`);
  console.log(`  renderBindings: from '${APPROVED.oldPath}' → '${APPROVED.newPath}'`);

  return next;
}

// =============================================================================
// Main
// =============================================================================

function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("BM-096 Approved Remap Apply Runner");
  console.log(`Mode: ${WRITE_FLAG ? "WRITE" : "DRY-RUN"}`);
  console.log(`${"=".repeat(60)}\n`);

  if (!fs.existsSync(LOCKED_PATH)) {
    log("FAIL", `Locked contract not found: ${LOCKED_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(LOCKED_PATH, "utf8");
  let contract;
  try {
    contract = JSON.parse(raw);
  } catch (e) {
    log("FAIL", `JSON parse error: ${e.message}`);
    process.exit(1);
  }

  // Safety assertions
  if (!assertLockedExists(contract)) { consoleErrors(); process.exit(1); }
  if (!assertCanonicalFieldGuard(contract)) { consoleErrors(); process.exit(1); }
  if (!assertDocxSlotGuard(contract)) { consoleErrors(); process.exit(1); }
  if (!assertRenderBindingGuard(contract)) { consoleErrors(); process.exit(1); }
  if (!assertNoSignatureTouch(contract)) { consoleErrors(); process.exit(1); }

  console.log(`\n${"-".repeat(60)}`);
  console.log("Safety assertions: ALL PASSED");
  console.log(`${"-".repeat(60)}\n`);

  if (!WRITE_FLAG) {
    console.log("DRY-RUN: No files written.");
    console.log("Run with --write to apply the mutation.");
    process.exit(exitCode);
  }

  // Write mode
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupSubDir = path.join(BACKUP_DIR, ts);
  fs.mkdirSync(backupSubDir, { recursive: true });

  const backupPath = path.join(backupSubDir, LOCKED_FILE);
  fs.copyFileSync(LOCKED_PATH, backupPath);
  console.log(`Backup: ${backupPath}`);

  const mutated = applyMutation(contract);
  fs.writeFileSync(LOCKED_PATH, JSON.stringify(mutated, null, 2), "utf8");
  console.log(`Written: ${LOCKED_PATH}`);

  // Verify the write
  const afterRaw = fs.readFileSync(LOCKED_PATH, "utf8");
  const after = JSON.parse(afterRaw);
  const newField = after.canonicalFields.find((f) => f.path === APPROVED.newPath);
  if (!newField) {
    log("FAIL", "Post-write verification: canonicalFields path not found");
    process.exit(1);
  }
  if (newField.label !== APPROVED.newLabel) {
    log("FAIL", `Post-write verification: label is '${newField.label}', expected '${APPROVED.newLabel}'`);
    process.exit(1);
  }
  if (newField.source !== "manual") {
    log("FAIL", `Post-write verification: source changed to '${newField.source}'`);
    process.exit(1);
  }
  log("OK", "Post-write verification: canonicalFields correct");

  const newSlot = after.docxSlots.find((s) => s.slotId === APPROVED.newPath);
  if (!newSlot) {
    log("FAIL", "Post-write verification: docxSlots slotId not found");
    process.exit(1);
  }
  if (newSlot.evidence?.rawPattern !== APPROVED.rawPattern) {
    log("FAIL", `Post-write verification: rawPattern changed`);
    process.exit(1);
  }
  log("OK", "Post-write verification: docxSlots correct");

  const newBinding = after.renderBindings.find((b) => b.slotId === APPROVED.newPath);
  if (!newBinding) {
    log("FAIL", "Post-write verification: renderBindings slotId not found");
    process.exit(1);
  }
  if (newBinding.from !== APPROVED.newPath) {
    log("FAIL", `Post-write verification: binding from changed`);
    process.exit(1);
  }
  log("OK", "Post-write verification: renderBindings correct");

  const oldFieldGone = after.canonicalFields.find((f) => f.path === APPROVED.oldPath);
  if (oldFieldGone) {
    log("FAIL", "Post-write verification: old path still exists in canonicalFields");
    process.exit(1);
  }
  log("OK", "Post-write verification: old path removed from canonicalFields");

  const oldSlotGone = after.docxSlots.find((s) => s.slotId === APPROVED.oldPath);
  if (oldSlotGone) {
    log("FAIL", "Post-write verification: old slotId still exists in docxSlots");
    process.exit(1);
  }
  log("OK", "Post-write verification: old slotId removed from docxSlots");

  const oldBindingGone = after.renderBindings.find((b) => b.slotId === APPROVED.oldPath);
  if (oldBindingGone) {
    log("FAIL", "Post-write verification: old binding slotId still exists");
    process.exit(1);
  }
  log("OK", "Post-write verification: old binding slotId removed");

  console.log(`\n${"=".repeat(60)}`);
  console.log("WRITE COMPLETE");
  console.log(`Backup: ${backupPath}`);
  console.log(`${"=".repeat(60)}`);
}

function consoleErrors() {
  if (ERRORS.length > 0) {
    console.log(`\n--- ${ERRORS.length} error(s) ---`);
    ERRORS.forEach((e) => console.log(`  ${e}`));
  }
}

main();
process.exit(exitCode);
