#!/usr/bin/env node
/**
 * Smart Generic Prefill — Field Inventory Audit Script
 *
 * Scans all 213 compiled contracts and classifies each field's suitability
 * for smart generic prefill at runtime.
 *
 * Classification system:
 *   SAFE_RUNTIME_DEFAULT  — SYSTEM/CURRENT_DATE fields that match safe document place/date patterns
 *   SAFE_GENERIC_PREFILL — MANUAL fields that are generic/common boilerplate (agency, recipients, etc.)
 *   REVIEW_REQUIRED      — Ambiguous fields requiring manual classification before auto-fill
 *   NEVER_AUTO           — Case-specific/legal facts that must never be auto-filled
 *
 * This is a READ-ONLY audit. Does NOT mutate any files.
 *
 * Output:
 *   docs/audit/smart-generic-prefill/field-inventory.csv
 *   docs/audit/smart-generic-prefill/field-inventory.json
 *
 * Usage:
 *   node scripts/audit/smart-generic-prefill.mjs
 *   node scripts/audit/smart-generic-prefill.mjs --bm=BM-001
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const COMPILED_DIR = path.join(ROOT, "docs", "audit", "docx", "compiled-v2");
const OUTPUT_DIR = path.join(ROOT, "docs", "audit", "smart-generic-prefill");

// ── Classification constants ─────────────────────────────────────────────────

const SAFE_PLACE_DATE_LABEL_PATTERNS = [
  /^địa điểm,?\s*ngày/i,
  /^địa danh,?\s*ngày/i,
  /^ngày\s+ban\s+hành$/i,
  /^ngày\s+lập(\s+văn\s+bản)?$/i,
  /^nơi\s+ban\s+hành$/i,
];

const SAFE_PLACE_DATE_PATH_PREFIXES = [
  "document.issuePlaceDateLine",
  "document.issuePlaceAndDateLine",
  "document.ngayBan",
];

const SAFE_DATE_PATH_PREFIXES = [
  "document.issueDate",
  "document.issuePlace",
];

const SAFE_GENERIC_PATH_PREFIXES = [
  // Agency-level metadata (safe boilerplate)
  "agency.",
  // Standard document distribution boilerplate
  "recipients.archiveLine",
  "recipients.distributionLine",
  // Legal boilerplate
  "legalBasis.",
  // Signature position boilerplate
  "signature.",
  "signatures.",
  // Note: document.documentCode, document.title, document.number, document.numberLine
  // are CASE-SPECIFIC document identifiers — do NOT prefill. User must enter.
  // Only document.issuePlace*, document.ngayBan (when safe) go to SAFE_RUNTIME_DEFAULT.
];

// Person-type path prefixes — these need real context, not generic prefill.
// All informant.*, receiver.*, accused.*, victim.*, witness.* etc. → NEVER_AUTO
const PERSON_PATH_PREFIXES = [
  "informant.",
  "receiver.",
  "accused.",
  "defendant.",
  "victim.",
  "witness.",
  "reporter.",
  "offender.",
  "person.",
  "assetOwner.",
  "propertyRecipient.",
];

const NEVER_AUTO_PATH_PREFIXES = [
  "accused.",
  "defendant.",
  "victim.",
  "witness.",
  "offense.",
  "case.",
  "measure.",
  "decision.",
  "detentionArrest.",
  "prosecution.",
  "indictment.",
  "person.birth",
  "person.dateOfBirth",
  "person.identityIssue",
  "person.dateOfDeath",
  "investigation.",
  "arrest.",
  "detention.",
  "offender.",
  "assetOwner.",
  "propertyRecipient.",
];

const NEVER_AUTO_LABEL_PATTERNS = [
  /^ngày\s+sinh$/i,
  /^tháng\s+sinh$/i,
  /^năm\s+sinh$/i,
  /^ngày\s+bắt$/i,
  /^ngày\s+tạm\s+giữ$/i,
  /^ngày\s+tạm\s+giam$/i,
  /^ngày\s+phạm\s+tội$/i,
  /^ngày\s+khởi\s+tố$/i,
  /^ngày\s+ra\s+quyết\s+định$/i,
  /^ngày\s+nhận$/i,
  /^ngày\s+giao$/i,
  /^ngày\s+tiếp\s+nhận$/i,
  /^ngày\s+quyết\s+định\s+tạm\s+đình\s+chỉ$/i,
  /^sinh\s+ngày,?\s*tháng,?\s*năm,?\s*nơi\s+sinh$/i,
  /^ngày\s+cấp(?!p)/i,
  /^tội\s+danh$/i,
  /^điều\s+luật$/i,
  /^số\s+vụ\s+án$/i,
  /^số\s+quyết\s+định$/i,
  /^nội\s+dung\s+hành\s+vi$/i,
  /^kết\s+luận\s+pháp\s+lý$/i,
  /^số\s+tiền$/i,
  /^từ\s+ngày$/i,
  /^đến\s+ngày$/i,
  /^ngày\s+quyết\s+định\s+khởi\s+tố\s+ban\s+đầu$/i,
  /^thời\s+hạn\s+đến\s+ngày$/i,
];

const REVIEW_REQUIRED_LABEL_PATTERNS = [
  /^ngày\s+quyết\s+định$/i,
  /^ngày\s+lập(?!(\s+văn\s+bản))($|\s)/i,
  /^ngày\s+nhận$/i,
  /^ngày\s+giao$/i,
  /^ngày\s+tiếp\s+nhận$/i,
  /^ngày\s+phê\s+duyệt$/i,
  /^ngày\s+duyệt$/i,
  /^ngày\s+ban\s+hành\s+quyết\s+định$/i,
  /^thời\s+hạn$/i,
];

const REVIEW_REQUIRED_PATH_PREFIXES = [
  "sourceSuspension.",
  "sourceRecovery.",
  "sourceReport.",
  "initiationRequest.",
  "investigationExtension.",
];

// ── Classification engine ───────────────────────────────────────────────────

function classifyField(field, templateCode) {
  const { key, label, dataSource } = field;
  const lowerLabel = (label || "").toLowerCase();
  const kind = dataSource?.kind ?? "MANUAL";

  // 1. NEVER_AUTO checks
  if (NEVER_AUTO_PATH_PREFIXES.some((p) => key.startsWith(p))) {
    return "NEVER_AUTO";
  }
  if (NEVER_AUTO_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
    return "NEVER_AUTO";
  }
  // System CURRENT_DATE fields with NEVER_AUTO labels
  if (kind === "SYSTEM" && NEVER_AUTO_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
    return "NEVER_AUTO";
  }
  // Person-type fields need real data, not generic prefill
  if (PERSON_PATH_PREFIXES.some((p) => key.startsWith(p))) {
    return "NEVER_AUTO";
  }

  // 2. SAFE_RUNTIME_DEFAULT checks — SYSTEM CURRENT_DATE fields
  if (kind === "SYSTEM" && dataSource?.value === "CURRENT_DATE") {
    if (SAFE_PLACE_DATE_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
      return "SAFE_RUNTIME_DEFAULT";
    }
    if (SAFE_PLACE_DATE_PATH_PREFIXES.some((p) => key.startsWith(p))) {
      return "SAFE_RUNTIME_DEFAULT";
    }
    if (SAFE_DATE_PATH_PREFIXES.some((p) => key.startsWith(p))) {
      return "SAFE_RUNTIME_DEFAULT";
    }
    // System CURRENT_DATE with "ngày" in label but not matching safe patterns → REVIEW_REQUIRED
    if (lowerLabel.includes("ngày")) {
      return "REVIEW_REQUIRED";
    }
  }

  // 3. SAFE_GENERIC_PREFILL checks — truly generic boilerplate
  if (kind === "MANUAL" || kind === "CONSTANT") {
    if (SAFE_GENERIC_PATH_PREFIXES.some((p) => key.startsWith(p))) {
      return "SAFE_GENERIC_PREFILL";
    }
    // Explicit safe labels
    if (lowerLabel.includes("nơi lưu") || lowerLabel.includes("nơi nhận")) {
      return "SAFE_GENERIC_PREFILL";
    }
    if (lowerLabel.includes("căn cứ")) {
      return "SAFE_GENERIC_PREFILL";
    }
    // Safe document date labels
    if (lowerLabel === "ngày ban hành") {
      return "SAFE_GENERIC_PREFILL";
    }
  }

  // 4. REVIEW_REQUIRED checks
  if (REVIEW_REQUIRED_PATH_PREFIXES.some((p) => key.startsWith(p))) {
    return "REVIEW_REQUIRED";
  }
  if (REVIEW_REQUIRED_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
    return "REVIEW_REQUIRED";
  }
  // Ambiguous date fields
  if (lowerLabel.includes("ngày") && !lowerLabel.includes("sinh") && !lowerLabel.includes("bắt") && !lowerLabel.includes("tạm")) {
    return "REVIEW_REQUIRED";
  }

  // 5. REVIEW_REQUIRED for COMPUTED fields with date-like labels
  if (kind === "COMPUTED" && lowerLabel.includes("ngày") && !NEVER_AUTO_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
    return "REVIEW_REQUIRED";
  }

  return "NEVER_AUTO"; // Conservative default
}

function classifyRecommendedPrefill(classification) {
  switch (classification) {
    case "SAFE_RUNTIME_DEFAULT":
      return "DOCUMENT_PLACE_DATE";
    case "SAFE_GENERIC_PREFILL":
      return "GENERIC_TEXT";
    case "REVIEW_REQUIRED":
      return "NONE";
    case "NEVER_AUTO":
      return "NONE";
    default:
      return "NONE";
  }
}

function classifyReason(field, classification) {
  const { key, label, dataSource } = field;
  const kind = dataSource?.kind ?? "MANUAL";
  const lowerLabel = (label || "").toLowerCase();

  switch (classification) {
    case "SAFE_RUNTIME_DEFAULT":
      if (kind === "SYSTEM") return `SYSTEM/CURRENT_DATE field. Label "${label}" matches safe document place/date pattern.`;
      return `Path "${key}" starts with safe document path prefix.`;
    case "SAFE_GENERIC_PREFILL":
      return `Path "${key}" is generic/common boilerplate safe for prefill.`;
    case "REVIEW_REQUIRED":
      return `Label "${label}" is ambiguous — requires manual classification before auto-fill.`;
    case "NEVER_AUTO":
      if (NEVER_AUTO_PATH_PREFIXES.some((p) => key.startsWith(p))) {
        return `Path "${key}" starts with NEVER_AUTO path prefix.`;
      }
      return `Label "${label}" matches NEVER_AUTO pattern.`;
    default:
      return "Unknown classification.";
  }
}

// ── Corpus scanner ────────────────────────────────────────────────────────

function scanCorpus() {
  const files = fs.readdirSync(COMPILED_DIR).filter((f) => f.endsWith(".compiled.json"));

  if (files.length === 0) {
    console.error("No compiled contracts found in", COMPILED_DIR);
    process.exit(1);
  }

  const inventory = [];
  let totalTemplates = 0;
  let totalFields = 0;

  for (const file of files.sort()) {
    const filePath = path.join(COMPILED_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    let contract;
    try {
      contract = JSON.parse(content);
    } catch {
      console.warn(`  Skipping invalid JSON: ${file}`);
      continue;
    }

    const templateCode = contract.templateCode;
    if (!templateCode) {
      console.warn(`  Skipping file without templateCode: ${file}`);
      continue;
    }

    totalTemplates++;
    const fields = contract.source?.fields ?? contract.fields ?? [];

    for (const field of fields) {
      totalFields++;
      const classification = classifyField(field, templateCode);
      const recommendedPrefill = classifyRecommendedPrefill(classification);
      const reason = classifyReason(field, classification);
      const currentSampleValue = getCurrentSampleValue(field, templateCode);

      inventory.push({
        templateCode,
        fieldKey: field.key,
        fieldLabel: field.label,
        required: field.required ?? false,
        dataSourceKind: field.dataSource?.kind ?? "MANUAL",
        dataSourceValue: field.dataSource?.value ?? null,
        classification,
        recommendedPrefillKind: recommendedPrefill,
        reason,
        currentSampleValue,
        controlType: field.control ?? "TEXT",
      });
    }
  }

  return { inventory, totalTemplates, totalFields };
}

function getCurrentSampleValue(field, templateCode) {
  // Return the stale 2026 sample value if known, for documentation
  const DOCUMENT_DEFAULTS = {
    "document.issueDate": "2026-01-01",
    "document.issuePlace": "TP. Hồ Chí Minh",
    "document.issuePlaceDateLine": "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
    "document.issuePlaceAndDateLine": "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
    "document.ngayBan": "01",
  };

  if (field.key in DOCUMENT_DEFAULTS) {
    return DOCUMENT_DEFAULTS[field.key];
  }
  return null;
}

// ── Output generators ────────────────────────────────────────────────────

function buildSummary(inventory) {
  const safeRuntimeDefault = inventory.filter((r) => r.classification === "SAFE_RUNTIME_DEFAULT").length;
  const safeGenericPrefill = inventory.filter((r) => r.classification === "SAFE_GENERIC_PREFILL").length;
  const reviewRequired = inventory.filter((r) => r.classification === "REVIEW_REQUIRED").length;
  const neverAuto = inventory.filter((r) => r.classification === "NEVER_AUTO").length;
  const systemKindFields = inventory.filter((r) => r.dataSourceKind === "SYSTEM").length;

  // Count fields with hardcoded 2026 date in sample data
  const hardcoded2026 = inventory.filter(
    (r) =>
      r.currentSampleValue !== null &&
      (r.currentSampleValue.includes("2026") || r.currentSampleValue.includes("01 tháng 01")),
  ).length;

  // Count document place/date fields
  const safeDocumentPlaceDate = inventory.filter(
    (r) =>
      r.classification === "SAFE_RUNTIME_DEFAULT" &&
      (r.fieldKey.includes("issuePlace") || r.fieldKey.includes("issueDate")),
  ).length;

  const safeDocumentDatePart = inventory.filter(
    (r) => r.classification === "SAFE_RUNTIME_DEFAULT" && r.fieldKey.includes("ngayBan"),
  ).length;

  return {
    totalFieldsScanned: inventory.length,
    totalFieldsInInventory: inventory.length,
    safeRuntimeDefaultFields: safeRuntimeDefault,
    safeGenericPrefillFields: safeGenericPrefill,
    reviewRequiredFields: reviewRequired,
    neverAutoFields: neverAuto,
    systemKindFields,
    hardcoded2026DateFields: hardcoded2026,
    safeDocumentPlaceDateFields: safeDocumentPlaceDate,
    safeDocumentDatePartFields: safeDocumentDatePart,
  };
}

function writeCsv(inventory, outputPath) {
  const header = [
    "templateCode",
    "fieldKey",
    "fieldLabel",
    "required",
    "dataSourceKind",
    "classification",
    "recommendedPrefillKind",
    "reason",
    "currentSampleValue",
    "controlType",
  ];

  const rows = inventory.map((r) => [
    r.templateCode,
    `"${r.fieldKey}"`,
    `"${r.fieldLabel}"`,
    r.required,
    r.dataSourceKind,
    r.classification,
    r.recommendedPrefillKind,
    `"${r.reason.replace(/"/g, '""')}"`,
    r.currentSampleValue ? `"${r.currentSampleValue}"` : "",
    r.controlType,
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  fs.writeFileSync(outputPath, "\ufeff" + csv, "utf8"); // BOM for Excel
}

function writeJson(inventory, summary, outputPath) {
  const obj = {
    generatedAt: new Date().toISOString(),
    source: "Smart Generic Prefill — Field Inventory Audit",
    summary,
    inventory,
  };
  fs.writeFileSync(outputPath, JSON.stringify(obj, null, 2), "utf8");
}

// ── Main ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const BM_FILTER = args.find((a) => a.startsWith("--bm="))?.replace("--bm=", "") || null;

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("Smart Generic Prefill — Field Inventory Audit");
console.log("=".repeat(50));
console.log(`Source: ${COMPILED_DIR}`);
console.log(`Output: ${OUTPUT_DIR}`);
console.log();

const { inventory, totalTemplates, totalFields } = scanCorpus();

console.log(`Scanned: ${totalTemplates} templates, ${totalFields} fields`);
console.log();

// Build summary
const summary = buildSummary(inventory);

console.log("Classification Summary:");
console.log(`  SAFE_RUNTIME_DEFAULT:    ${String(summary.safeRuntimeDefaultFields).padStart(4)} fields`);
console.log(`  SAFE_GENERIC_PREFILL:    ${String(summary.safeGenericPrefillFields).padStart(4)} fields`);
console.log(`  REVIEW_REQUIRED:        ${String(summary.reviewRequiredFields).padStart(4)} fields`);
console.log(`  NEVER_AUTO:             ${String(summary.neverAutoFields).padStart(4)} fields`);
console.log(`  SYSTEM/CURRENT_DATE:     ${String(summary.systemKindFields).padStart(4)} fields`);
console.log(`  Hardcoded 2026 dates:    ${String(summary.hardcoded2026DateFields).padStart(4)} fields`);
console.log();

// Write outputs
const csvPath = path.join(OUTPUT_DIR, "field-inventory.csv");
const jsonPath = path.join(OUTPUT_DIR, "field-inventory.json");

writeCsv(inventory, csvPath);
writeJson(inventory, summary, jsonPath);

console.log(`Written: ${csvPath}`);
console.log(`Written: ${jsonPath}`);
console.log();
console.log("Done.");
