#!/usr/bin/env node
/**
 * Generates the forms-213 baseline exceptions ledger.
 * Documents the 8 remediation items and 61 unresolved reviewRequired fields
 * that are acknowledged via --allow-remediation and --allow-unresolved-review.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const REPORT_DIR = path.join(ROOT, "docs", "audit", "forms-213-baseline-exceptions");

// 8 remediation items parsed from LOCKED-CONTRACTS-SUMMARY.md
const REMEDIATION_ITEMS = [
  {
    templateCode: "BM-001",
    pathOrSlot: "crimeReport.attachedItemsDescription",
    category: "REMEDIATION",
    reason: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: crimeReport.attachedItemsDescription exists in template but not in docxSlots",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
  {
    templateCode: "BM-001",
    pathOrSlot: "crimeReport.content",
    category: "REMEDIATION",
    reason: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: crimeReport.content exists in template but not in docxSlots",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
  {
    templateCode: "BM-002",
    pathOrSlot: "sourceTransfer.attachedItemsDescription",
    category: "REMEDIATION",
    reason: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: sourceTransfer.attachedItemsDescription exists in template but not in docxSlots",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
  {
    templateCode: "BM-003",
    pathOrSlot: "official.issuerTitle",
    category: "REMEDIATION",
    reason: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: official.issuerTitle exists in template but not in docxSlots",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
  {
    templateCode: "BM-052",
    pathOrSlot: "document.fullDocumentCode",
    category: "REMEDIATION",
    reason: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER + BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode in contract but not in template",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
  {
    templateCode: "BM-052",
    pathOrSlot: "document.fullDocumentCode2",
    category: "REMEDIATION",
    reason: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER + BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2 in contract but not in template",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
  {
    templateCode: "BM-067",
    pathOrSlot: "document.fullDocumentCode2",
    category: "REMEDIATION",
    reason: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER + BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2 in contract but not in template",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
  {
    templateCode: "BM-167",
    pathOrSlot: "document.fullDocumentCode2",
    category: "REMEDIATION",
    reason: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: document.fullDocumentCode2 exists in template but not in docxSlots",
    ownerPhase: "DOCX_AUTHORING",
    blocksRuntime: false,
  },
];

// Load locked contracts and find unresolved reviewRequired fields
const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
  (f) => f.endsWith(".contract.locked.json") && !f.startsWith("_"),
);

const unresolvedReviewItems = [];
const AUTO_RESOLVED_KINDS = new Set(["CONSTANT", "DEFAULT", "SYSTEM", "COMPUTED"]);

for (const file of lockedFiles) {
  const templateCode = file.replace(/^(BM-\d+)__[^.]+\.contract\.locked\.json$/, "$1");
  const c = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));

  for (const field of c.canonicalFields || []) {
    if (field.reviewRequired === true && !AUTO_RESOLVED_KINDS.has(field.source || "")) {
      unresolvedReviewItems.push({
        templateCode,
        pathOrSlot: field.path,
        category: "UNRESOLVED_REVIEW",
        reason: `reviewRequired=true with source=${field.source}. These fields exist in the locked DOCX but reviewRequired flag was not cleared.`,
        ownerPhase: "MANUAL_REVIEW",
        blocksRuntime: false,
      });
    }
  }
}

// Build the ledger
const report = {
  generatedAt: new Date().toISOString(),
  gateFlags: {
    allowRemediation: true,
    allowUnresolvedReview: true,
    since: "2026-06-25",
    commit: "5edf4be7",
  },
  summary: {
    remediationItems: REMEDIATION_ITEMS.length,
    unresolvedReviewRequired: unresolvedReviewItems.length,
    total: REMEDIATION_ITEMS.length + unresolvedReviewItems.length,
    blocksRuntime: false,
    gateStatus: "PASS_WITH_ACKNOWLEDGED_BASELINE_EXCEPTIONS",
  },
  items: [...REMEDIATION_ITEMS, ...unresolvedReviewItems],
};

// Write JSON
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, "latest.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);

// Write Markdown
const mdLines = [
  "# Forms-213 Baseline Exceptions Ledger",
  "",
  `Generated: ${report.generatedAt}`,
  `Gate flags: --allow-remediation --allow-unresolved-review (since ${report.gateFlags.since})`,
  `Commit: ${report.gateFlags.commit}`,
  "",
  "## Gate Status",
  "",
  "**PASS_WITH_ACKNOWLEDGED_BASELINE_EXCEPTIONS**",
  "",
  "This is NOT a zero-exception pass. The gate passes because these",
  "exceptions are documented and acknowledged. Removing the flags",
  "without resolving the items below will make the gate fail again.",
  "",
  `| Category | Count |`,
  `|---|---|`,
  `| Remediation items (DOCX authoring needed) | ${REMEDIATION_ITEMS.length} |`,
  `| Unresolved reviewRequired (manual review) | ${unresolvedReviewItems.length} |`,
  "",
  "## Remediation Items (8) — DOCX authoring needed",
  "",
  "| Template | Path/Slot | Reason |",
  "|---|---|---|",
];

for (const item of REMEDIATION_ITEMS) {
  mdLines.push(`| ${item.templateCode} | ${item.pathOrSlot} | ${item.reason} |`);
}

mdLines.push("");
mdLines.push("## Unresolved reviewRequired Fields (61) — Manual review needed");
mdLines.push("");
mdLines.push("These fields have `reviewRequired: true` on non-auto-resolved sources.");
mdLines.push("They exist in locked DOCX but the review flag was never cleared.");
mdLines.push("");
mdLines.push("| Template | Count | Fields |");
mdLines.push("|---|---|---|");

// Group by template
const byTemplate = {};
for (const item of unresolvedReviewItems) {
  if (!byTemplate[item.templateCode]) byTemplate[item.templateCode] = [];
  byTemplate[item.templateCode].push(item.pathOrSlot);
}

for (const [code, fields] of Object.entries(byTemplate)) {
  mdLines.push(`| ${code} | ${fields.length} | ${fields.join(", ")} |`);
}

mdLines.push("");
mdLines.push("## Policy");
mdLines.push("");
mdLines.push("- Remediation items require DOCX template editing to add/rename placeholders.");
mdLines.push("- Unresolved reviewRequired fields require human review to clear the flag.");
mdLines.push("- Neither category blocks runtime rendering.");
mdLines.push("- Removing `--allow-remediation` or `--allow-unresolved-review` from `package.json`");
mdLines.push("  will make `pnpm gate:forms:213` fail until these items are resolved.");
mdLines.push("");
mdLines.push("## History");
mdLines.push("");
mdLines.push("- 2026-06-25: Acknowledged baseline exceptions introduced during GATE_FIX (5edf4be7).");
mdLines.push("");

fs.writeFileSync(
  path.join(REPORT_DIR, "latest.md"),
  mdLines.join("\n"),
  "utf8",
);

console.log(`Written: ${REPORT_DIR}/latest.json (${report.items.length} items)`);
console.log(`Written: ${REPORT_DIR}/latest.md`);
console.log(`Total: ${report.summary.total} exceptions (${REMEDIATION_ITEMS.length} remediation + ${unresolvedReviewItems.length} unresolved review)`);
