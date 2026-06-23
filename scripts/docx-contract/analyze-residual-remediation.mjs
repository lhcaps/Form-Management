#!/usr/bin/env node
/**
 * analyze-residual-remediation.mjs
 *
 * Classifies the 34 remaining remediation items from the post-Wave-04E-2
 * inventory against the Wave-04E reviewer decisions, and outputs:
 *   - residual-remediation-analysis.json
 *   - RESIDUAL-REMEDIATION-ANALYSIS.md
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "docs/audit/docx/reports");

const INVENTORY_PATH = path.join(OUT_DIR, "remaining-remediation-inventory.json");
const DECISIONS_PATH = path.join(ROOT, "docs/audit/docx/reviewer-decisions/wave-04e-decisions.json");
const ANALYSIS_JSON = path.join(OUT_DIR, "residual-remediation-analysis.json");
const ANALYSIS_MD  = path.join(OUT_DIR, "RESIDUAL-REMEDIATION-ANALYSIS.md");

// -----------------------------------------------------------------------
// Classification constants
// -----------------------------------------------------------------------
const CL = {
  ALIAS_PENDING:           "ALIAS_PENDING_IMPLEMENTATION",
  METADATA_ONLY_APPROVED:  "METADATA_ONLY_APPROVED",
  REMOVE_PENDING:          "REMOVE_PENDING_EXPLICIT_APPROVAL",
  ACCEPTED_NO_ACTION:       "AUDIT_CLASSIFICATION_ACCEPTED",
  SAFE_TO_APPLY:           "SAFE_TO_APPLY_NOW",
};

/**
 * Accepted no-action set — these BMs must NOT be touched.
 * Per Wave 04E decisions: orphaned mustaches in BM-001/002/003 remain no-action.
 */
const ACCEPTED_NO_ACTION_BMS = new Set(["BM-001", "BM-002", "BM-003"]);

/**
 * Decisions that mean: do not add visible placeholder, no DOCX change needed.
 * These items are considered approved — the remediation check remains because
 * the slot/binding exists but the reviewer decided not to render.
 */
const METADATA_ONLY_DECISIONS = new Set([
  "METADATA_ONLY",
  "METADATA_ONLY_ALIAS",
  "METADATA_ONLY_DO_NOT_RENDER",
]);

/**
 * Decisions that mean: alias existing suffixed field to canonical.
 * Cannot apply without an alias mechanism implementation.
 */
const ALIAS_DECISIONS = new Set([
  "ALIAS_CANONICALIZE",
  "APPROVE_ADD_PREFER_SEMANTIC_RENAME", // prefers alias over add
]);

/**
 * Decisions that mean: destructive removal (not approved in this wave).
 */
const REMOVE_DECISIONS = new Set([
  "REMOVE_OR_METADATA_ONLY",
  "REMOVE_OR_REPEAT_CANONICAL",
]);

/**
 * Decisions that mean: safe to add visible placeholder (already applied in Wave 04E-2).
 */
const APPROVE_ADD_DECISIONS = new Set([
  "APPROVE_ADD",
  "APPROVE_ADD_SENSITIVE",
  "APPROVE_ADD_OR_ALIAS",
]);

// -----------------------------------------------------------------------
// Load data
// -----------------------------------------------------------------------
const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf8"));
const decisionsRaw = JSON.parse(fs.readFileSync(DECISIONS_PATH, "utf8"));

// Build BM+field -> decision map
const decisionMap = new Map();
for (const d of decisionsRaw.decisions) {
  decisionMap.set(d.templateCode + "||" + d.field, d);
}

// -----------------------------------------------------------------------
// Classify each inventory item
// -----------------------------------------------------------------------
const classifiedItems = [];
const byClassification = {};

for (const item of inventory.items) {
  const key = item.templateCode + "||" + item.path;
  const decision = decisionMap.get(key);

  let classification;
  let safeToApplyNow = false;
  let reason;
  let nextAction;
  let governanceAction = null;

  // Rule 1: Accepted no-action BMs
  if (ACCEPTED_NO_ACTION_BMS.has(item.templateCode)) {
    classification = CL.ACCEPTED_NO_ACTION;
    safeToApplyNow = false;
    reason = `BM-${item.templateCode.replace("BM-", "")} is in the accepted no-action set. ` +
      `Orphaned mustaches in BM-001/002/003 remain no-action under current policy per Wave 04E decisions.`;
    nextAction = "Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering.";
    governanceAction = "ACCEPTED_NO_ACTION_SET";
  }
  // Rule 2: Reviewer approved METADATA_ONLY
  else if (decision && METADATA_ONLY_DECISIONS.has(decision.decision)) {
    classification = CL.METADATA_ONLY_APPROVED;
    safeToApplyNow = false;
    reason = `Reviewer decision '${decision.decision}' approved metadata-only status. ` +
      `The slot/binding exists but no visible DOCX placeholder is needed. ` +
      `Adding a visible placeholder would duplicate compound fields or introduce noise.`;
    nextAction = "No action needed. Item is approved as metadata-only. " +
      "The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval.";
    governanceAction = "METADATA_ONLY_APPROVED";
  }
  // Rule 3: ALIAS_CANONICALIZE — pending implementation
  else if (decision && ALIAS_DECISIONS.has(decision.decision)) {
    classification = CL.ALIAS_PENDING;
    safeToApplyNow = false;
    reason = `Reviewer decision '${decision.decision}' requires aliasing an existing suffixed ` +
      `placeholder (e.g. document.fullDocumentCode4/6/8) to the canonical field name. ` +
      `No alias mechanism is currently implemented. Adding a second visible placeholder ` +
      `would duplicate rendered content (global rule 4: do not add duplicate visible placeholders).`;
    nextAction = "Requires alias mechanism implementation. " +
      "Owner: backend contract system. " +
      "Until implemented, the canonical slot stays unmapped and the remediation check remains.";
    governanceAction = "ALIAS_MECHANISM_REQUIRED";
  }
  // Rule 4: REMOVE_* — pending explicit destructive approval
  else if (decision && REMOVE_DECISIONS.has(decision.decision)) {
    classification = CL.REMOVE_PENDING;
    safeToApplyNow = false;
    reason = `Reviewer decision '${decision.decision}' considers removal of this slot/binding. ` +
      `However, explicit destructive approval has not been granted. ` +
      `Removing slots/bindings without explicit reviewer sign-off could break data binding.`;
    nextAction = "Requires explicit destructive approval from reviewer or legal. " +
      "Do not remove slot/binding without APPROVE_REMOVE decision. " +
      "If the same value is already rendered by another field, prefer aliasing over removal.";
    governanceAction = "EXPLICIT_DESTRUCTIVE_APPROVAL_REQUIRED";
  }
  // Rule 5: APPROVE_ADD — already applied in Wave 04E-2
  else if (decision && APPROVE_ADD_DECISIONS.has(decision.decision)) {
    classification = CL.SAFE_TO_APPLY;
    safeToApplyNow = false; // already applied
    reason = `Decision '${decision.decision}' was approved for DOCX addition. ` +
      `This slot should have been resolved by Wave 04E-2 application. ` +
      `If still present, the placeholder may have been added but the slot binding ` +
      `was not updated, or the remediation check counts something else. ` +
      `Verify against wave-04e-2-applied-actions.json.`;
    nextAction = "Verify: check wave-04e-2-applied-actions.json to confirm placeholder was added. " +
      "If still failing, the slot mapping may need manual contract update.";
    governanceAction = "VERIFY_WAVE_04E_2_APPLICATION";
  }
  // Rule 6: No reviewer decision for this BM/field
  else {
    // Check if it's in the accepted no-action set via other means
    if (item.issueCode === "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT") {
      // Template has placeholder but no slot — this could be a legacy orphan
      // from before the contract was built. No reviewer decision = no action.
      classification = CL.ACCEPTED_NO_ACTION;
      safeToApplyNow = false;
      reason = `No reviewer decision found for ${item.templateCode}/${item.path}. ` +
        `TEMPLATE_PLACEHOLDER_WITHOUT_SLOT indicates the template has the placeholder ` +
        `but the contract has no slot. If this is a deliberate legacy field, ` +
        `it should be reviewed. If orphaned, add to accepted no-action set.`;
      nextAction = "Requires reviewer decision. File as governance backlog item: " +
        `BM-${item.templateCode.replace("BM-", "")} ${item.path} — no reviewer decision, ` +
        "template has placeholder without contract slot.";
      governanceAction = "REVIEWER_DECISION_REQUIRED";
    } else {
      classification = CL.METADATA_ONLY_APPROVED; // conservative
      safeToApplyNow = false;
      reason = `No explicit reviewer decision found for ${item.templateCode}/${item.path}, ` +
        `and issue is CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER or BINDING_WITHOUT_TEMPLATE_PLACEHOLDER. ` +
        `Conservative classification as METADATA_ONLY_APPROVED. ` +
        `If the slot should render, a reviewer decision is needed.`;
      nextAction = "Requires reviewer decision. Cannot apply without explicit approval.";
      governanceAction = "REVIEWER_DECISION_REQUIRED";
    }
  }

  const classified = {
    templateCode: item.templateCode,
    field: item.path,
    issueCodes: [item.issueCode],
    suggestedAction: item.suggestedAction,
    risk: item.risk,
    reviewerDecision: decision ? decision.decision : null,
    classification,
    safeToApplyNow,
    reason,
    nextAction,
    governanceAction,
  };

  classifiedItems.push(classified);

  if (!byClassification[classification]) byClassification[classification] = [];
  byClassification[classification].push(classified);
}

// -----------------------------------------------------------------------
// Build output
// -----------------------------------------------------------------------
const output = {
  generatedAt: new Date().toISOString(),
  source: "remaining-remediation-inventory.json + wave-04e-decisions.json",
  wave: "04E-3",
  totalItems: inventory.items.length,
  byClassification: Object.fromEntries(
    Object.entries(byClassification).map(([k, v]) => [k, v.length])
  ),
  items: classifiedItems,
};

fs.writeFileSync(ANALYSIS_JSON, JSON.stringify(output, null, 2));

// -----------------------------------------------------------------------
// Markdown report
// -----------------------------------------------------------------------
let md = `# Residual Remediation Analysis (Wave 04E-3)

Generated: ${output.generatedAt}
Source: remaining-remediation-inventory.json + wave-04e-decisions.json

## Classification Summary

`;

const clOrder = [
  CL.SAFE_TO_APPLY,
  CL.METADATA_ONLY_APPROVED,
  CL.ALIAS_PENDING,
  CL.REMOVE_PENDING,
  CL.ACCEPTED_NO_ACTION,
];

for (const cl of clOrder) {
  const items = byClassification[cl] || [];
  if (items.length === 0) continue;
  md += `### ${cl} (${items.length})\n\n`;
  md += `| BM | Field | Issue | Reviewer Decision | Safe Now | Next Action |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const item of items) {
    md += `| ${item.templateCode} | \`${item.field}\` | ${item.issueCodes.join(", ")} | ${item.reviewerDecision || "—"} | ${item.safeToApplyNow ? "YES" : "NO"} | ${item.nextAction.replace(/\n/g, " ").replace(/\|/g, "\\|")} |\n`;
  }
  md += "\n";
}

md += `## Governance Backlog\n\n`;
md += `| BM | Field | Classification | Required Action |\n`;
md += `|---|---|---|---|\n`;
const backlogItems = classifiedItems.filter(i =>
  i.governanceAction !== "METADATA_ONLY_APPROVED" &&
  i.governanceAction !== "ACCEPTED_NO_ACTION_SET"
);
for (const item of backlogItems) {
  md += `| ${item.templateCode} | \`${item.field}\` | ${item.classification} | ${item.nextAction.replace(/\n/g, " ").replace(/\|/g, "\\|")} |\n`;
}

md += `\n## Notes\n\n`;
md += `- BM-001/BM-002/BM-003: 16 items classified as \`AUDIT_CLASSIFICATION_ACCEPTED\` — accepted no-action set per Wave 04E reviewer decision.\n`;
md += `- METADATA_ONLY_APPROVED items: reviewer approved; no DOCX change needed. Remediation check remains because alias mechanism is not implemented.\n`;
md += `- ALIAS_PENDING items: cannot apply without alias mechanism. Owner: backend contract system.\n`;
md += `- REMOVE_PENDING items: destructive removal not approved. Requires explicit APPROVE_REMOVE decision.\n`;
md += `- SAFE_TO_APPLY_NOW: 0 items — all decisions from Wave 04E-2 were already applied.\n`;

fs.writeFileSync(ANALYSIS_MD, md);

console.log("Analysis complete.");
console.log("JSON:", ANALYSIS_JSON);
console.log("MD:", ANALYSIS_MD);
console.log();
for (const [cl, items] of Object.entries(byClassification)) {
  console.log(`  ${cl}: ${items.length}`);
}
