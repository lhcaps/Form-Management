#!/usr/bin/env node
/**
 * Wave 04D: Triage remaining remediation items.
 *
 * Analyzes all 31 current remediation checks / 58 field-level items and
 * classifies each into one of:
 *   - ADD_PLACEHOLDER_HUMAN_REQUIRED
 *   - ACCEPT_NON_RENDERED_METADATA
 *   - NEEDS_LEGAL_REVIEW
 *   - FIXABLE_BY_SCRIPT
 *   - STALE_AUDIT_METADATA
 *
 * Outputs:
 *   - docs/audit/docx/reports/remaining-remediation-decision-matrix.json
 *   - docs/audit/docx/reports/REMAINING-REMEDIATION-DECISION-MATRIX.md
 *   - docs/audit/docx/reports/WAVE-04D-REMEDIATION-TRIAGE.md
 *
 * Run: node scripts/docx-contract/triage-remaining-remediation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const NORM_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const OUT_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

function getDocxMustaches(buf) {
  const zip = new PizZip(buf);
  const content = zip.file("word/document.xml")?.asText() ?? "";
  return new Set([...content.matchAll(/\{\{([^\}]+)\}\}/g)].map((m) => m[0]));
}

function loadLocked(bm) {
  const files = fs
    .readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(bm) && f.endsWith(".contract.locked.json"))
    .sort();
  if (!files.length) return null;
  return JSON.parse(fs.readFileSync(`${LOCKED_DIR}/${files[files.length - 1]}`, "utf8"));
}

function loadDocx(bm) {
  const dir = `${NORM_DIR}/${bm}`;
  const file = fs.readdirSync(dir).find(
    (f) => f.includes("_normalized") && f.endsWith(".docx"),
  );
  if (!file) return null;
  return getDocxMustaches(fs.readFileSync(`${dir}/${file}`));
}

function getDocxText(bm) {
  const dir = `${NORM_DIR}/${bm}`;
  const file = fs.readdirSync(dir).find(
    (f) => f.includes("_normalized") && f.endsWith(".docx"),
  );
  if (!file) return "";
  const zip = new PizZip(fs.readFileSync(`${dir}/${file}`));
  return zip.file("word/document.xml")?.asText() ?? "";
}

// --------------------------------------------------------------------
// Pre-authored classification rules (verified by inspection):
//
// TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: Orphaned mustaches in DOCX where
//   no corresponding slot/field/binding exists in the locked contract.
//   The locked contract has the authoritative template model. If it has
//   no slot for the mustache, the mustache is a leftover — it does not
//   affect rendering. Classify as ACCEPT_NON_RENDERED_METADATA.
//
// CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER / BINDING_WITHOUT_TEMPLATE_PLACEHOLDER:
//   Slot exists in locked contract but mustache is missing from DOCX.
//   Classify based on the form type:
//   - BM-001/002/003: Generic base forms with orphaned mustaches from
//     wave-01 extraction. The DOCX already has the mustaches (verified).
//     The locked contract just lacks slots for them. These are already
//     ACCEPT_NON_RENDERED_METADATA from the locked-contract perspective.
//   - BM-021/031/036/044: Agency field slots (nameUpper, bodyName,
//     parentNameUpper) where the DOCX may have the agency name mustaches
//     but under a different slotId. Need human review to determine if
//     the slot should be added.
//   - BM-056: person.religion — juvenile procedure form. Legal sensitivity
//     requires human review.
//   - BM-059: recipients.personLine — document model uses personLine directly.
//     Template may not have this recipient slot. Human review needed.
//   - BM-052/060/061/063/064/065/066/067: document.fullDocumentCode variants.
//     Already triaged in Wave 04C — Wave 04C skipped these because no
//     safe DOCX anchor was found. Human authoring required.
// --------------------------------------------------------------------

const DECISIONS = {
  "ACCEPT_NON_RENDERED_METADATA": {
    reason:
      "Orphaned mustache in DOCX — no corresponding slot/field/binding in locked contract. The locked contract is the authoritative template model. If it has no slot for this mustache, the mustache is a leftover and does not affect rendering. No action needed.",
    recommendedAction:
      "Accept as-is. No slot exists in the locked contract for this mustache, so it does not affect runtime rendering.",
    recommendedWave: "accepted",
  },
  ADD_PLACEHOLDER_HUMAN_REQUIRED: {
    reason:
      "Slot exists in locked contract with field and binding, but DOCX is missing the mustache. No safe anchor found by Wave 04C scan. Template modification requires human authoring to determine the correct insertion location.",
    recommendedAction:
      "Human template author must add the mustache to the DOCX template at a semantically correct position. Cannot be done by automated script without safe anchor text.",
    recommendedWave: "legal-review",
  },
  NEEDS_LEGAL_REVIEW: {
    reason:
      "Field is in a sensitive legal domain (juvenile procedure / special measures). Adding or removing it from the template requires legal review to ensure the rendered document meets regulatory requirements.",
    recommendedAction:
      "Require legal/form author review before any template modification. Do not add or remove via automated script.",
    recommendedWave: "legal-review",
  },
};

const GENERIC_FORMS = new Set(["BM-001", "BM-002", "BM-003"]);

// All 31 remediation checks (grouped by BM, per current LOCKED-CONTRACTS-SUMMARY.md)
const REMEDIATION_ITEMS = [
  // BM-001: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT (11 field items)
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "crimeReport.attachedItemsDescription", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "crimeReport.content", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.endedAtDay", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.endedAtMonth", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.endedAtTimeText", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.endedAtYear", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.locationName", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.startedAtDay", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.startedAtMonth", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.startedAtTimeText", risk: "medium" },
  { bm: "BM-001", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "reception.startedAtYear", risk: "medium" },
  // BM-002: 1 field
  { bm: "BM-002", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "sourceTransfer.attachedItemsDescription", risk: "medium" },
  // BM-003: 4 fields
  { bm: "BM-003", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "official.issuerTitle", risk: "medium" },
  { bm: "BM-003", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "sourceAssignment.article1Line", risk: "medium" },
  { bm: "BM-003", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "sourceAssignment.article2Line", risk: "medium" },
  { bm: "BM-003", issue: "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", path: "sourceAssignment.article3Line", risk: "medium" },
  // BM-021: 2 issues (1 path x 2)
  { bm: "BM-021", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.nameUpper", risk: "medium" },
  { bm: "BM-021", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.nameUpper", risk: "medium" },
  // BM-031: 2 issues (1 path x 2)
  { bm: "BM-031", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.bodyName", risk: "medium" },
  { bm: "BM-031", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.bodyName", risk: "medium" },
  // BM-036: 4 issues (2 paths x 2)
  { bm: "BM-036", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.parentNameUpper", risk: "medium" },
  { bm: "BM-036", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.parentNameUpper", risk: "medium" },
  { bm: "BM-036", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.issueDate", risk: "low" },
  { bm: "BM-036", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.issueDate", risk: "low" },
  // BM-044: 2 issues (1 path x 2)
  { bm: "BM-044", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.parentNameUpper", risk: "medium" },
  { bm: "BM-044", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "agency.parentNameUpper", risk: "medium" },
  // BM-052: 4 issues (2 paths x 2) — skipped by Wave 04C
  { bm: "BM-052", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-052", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-052", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode2", risk: "low" },
  { bm: "BM-052", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode2", risk: "low" },
  // BM-056: 2 issues (1 path x 2) — juvenile procedure
  { bm: "BM-056", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "person.religion", risk: "medium" },
  { bm: "BM-056", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "person.religion", risk: "medium" },
  // BM-059: 2 issues (1 path x 2)
  { bm: "BM-059", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "recipients.personLine", risk: "low" },
  { bm: "BM-059", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "recipients.personLine", risk: "low" },
  // BM-060: 2 issues (1 path x 2) — skipped by Wave 04C
  { bm: "BM-060", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-060", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  // BM-061: 2 issues (1 path x 2) — skipped by Wave 04C
  { bm: "BM-061", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-061", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  // BM-063: 2 issues (1 path x 2) — skipped by Wave 04C (document.fullDocumentCode)
  { bm: "BM-063", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-063", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  // BM-064: 2 issues (1 path x 2) — skipped by Wave 04C
  { bm: "BM-064", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-064", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  // BM-065: 4 issues (2 paths x 2) — skipped by Wave 04C
  { bm: "BM-065", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "decision.decisionLine", risk: "low" },
  { bm: "BM-065", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "decision.decisionLine", risk: "low" },
  { bm: "BM-065", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-065", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  // BM-066: 4 issues (2 paths x 2) — skipped by Wave 04C
  { bm: "BM-066", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "decision.decisionLine", risk: "low" },
  { bm: "BM-066", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "decision.decisionLine", risk: "low" },
  { bm: "BM-066", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-066", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  // BM-067: 4 issues (2 paths x 2) — skipped by Wave 04C
  { bm: "BM-067", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-067", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode", risk: "low" },
  { bm: "BM-067", issue: "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode2", risk: "low" },
  { bm: "BM-067", issue: "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", path: "document.fullDocumentCode2", risk: "low" },
];

function classifyItem(item) {
  const { bm, issue, path: slotPath, risk } = item;
  const mustacheFull = "{{" + slotPath + "}}";

  // Load evidence
  const docxMustaches = loadDocx(bm);
  const locked = loadLocked(bm);
  const hasPlaceholder = docxMustaches ? docxMustaches.has(mustacheFull) : false;

  const slot = locked ? (locked.docxSlots ?? []).find((s) => s.slotId === slotPath) : null;
  const hasSlot = !!slot;
  const hasField = locked
    ? (locked.canonicalFields ?? []).some((f) => f.path === slotPath)
    : false;
  const hasBinding = locked
    ? (locked.renderBindings ?? []).some((b) => b.slotId === slotPath)
    : false;

  // Get textBefore context for anchor identification
  const textBefore = slot?.evidence?.textBefore ?? "";
  const rawPattern = slot?.evidence?.rawPattern ?? "";

  // Classification
  let decision = "UNKNOWN";
  let notes = "";

  if (issue === "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT") {
    // Orphaned mustache: DOCX has mustache but locked has no slot.
    // This means the mustache is leftover from a previous extraction or
    // wave-01 remediation. The locked contract (authoritative) does
    // not reference it, so it does not affect runtime rendering.
    decision = "ACCEPT_NON_RENDERED_METADATA";
    notes = `Orphaned mustache. DOCX has "${mustacheFull}" but locked contract has no slot/field/binding for it. No runtime impact.`;
  } else if (issue === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER" || issue === "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER") {
    if (bm === "BM-056") {
      // Juvenile procedure form (Exit Postponement for minors).
      // person.religion field requires legal review — affects personal data.
      decision = "NEEDS_LEGAL_REVIEW";
      notes = `BM-056 is an exit postponement form for minors ("Biện pháp hoãn xuất cảnh"). Collecting religion data requires legal review of regulatory basis.`;
    } else if (bm === "BM-059") {
      // BM-059 detention extension form — recipients.personLine may be
      // intentionally not rendered in DOCX since the recipient is the
      // detention facility (agency), not an individual person.
      decision = "ADD_PLACEHOLDER_HUMAN_REQUIRED";
      notes = `recipients.personLine slot exists but no mustache in DOCX. Human review needed to determine if recipient person line should appear in the template.`;
    } else if (bm === "BM-021" || bm === "BM-031" || bm === "BM-044") {
      // Agency field slots — nameUpper, bodyName, parentNameUpper.
      // These may be alternatives/supplements to the base agency.name
      // mustaches already in the DOCX. Human review needed.
      decision = "ADD_PLACEHOLDER_HUMAN_REQUIRED";
      notes = `Agency field slot (${slotPath}) exists in locked contract but no corresponding mustache in DOCX. Need human review to determine if this variant form should be added.`;
    } else if (bm === "BM-036" && slotPath === "document.issueDate") {
      // document.issueDate — may already be covered by document.documentCode
      // or document.issuePlaceAndDateLine in the DOCX.
      decision = "ADD_PLACEHOLDER_HUMAN_REQUIRED";
      notes = `document.issueDate slot exists but no corresponding mustache in DOCX. May be covered by document.issuePlaceAndDateLine. Human review needed.`;
    } else {
      // All other scoped BMs (BM-052/060/061/063/064/065/066/067):
      // document.fullDocumentCode / decision.decisionLine variants.
      // Already triaged by Wave 04C — no safe anchor found.
      decision = "ADD_PLACEHOLDER_HUMAN_REQUIRED";
      notes = `Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.`;
    }
  }

  return {
    templateCode: bm,
    issueCode: issue,
    path: slotPath,
    risk,
    decision,
    evidence: {
      placeholderExistsInDocx: hasPlaceholder,
      slotExists: hasSlot,
      fieldExists: hasField,
      bindingExists: hasBinding,
      rawPattern,
      textBefore: textBefore.substring(0, 100),
    },
    recommendedAction: DECISIONS[decision]?.recommendedAction ?? "",
    recommendedWave: DECISIONS[decision]?.recommendedWave ?? "",
    notes,
  };
}

function main() {
  console.log("\nWave 04D: Remediation Triage\n");
  console.log(`Total items to classify: ${REMEDIATION_ITEMS.length}\n`);

  const results = [];
  for (const item of REMEDIATION_ITEMS) {
    const classified = classifyItem(item);
    results.push(classified);
    const decision = classified.decision.padEnd(30);
    console.log(
      `${classified.templateCode} | ${classified.issueCode.substring(0, 6).padEnd(6)} | ${classified.path.substring(0, 35).padEnd(35)} | ${decision} | ${classified.notes.substring(0, 60)}`,
    );
  }

  // Aggregate by decision
  const byDecision = {};
  for (const r of results) {
    byDecision[r.decision] = (byDecision[r.decision] ?? 0) + 1;
  }

  // Aggregate by risk
  const byRisk = {};
  for (const r of results) {
    byRisk[r.risk] = (byRisk[r.risk] ?? 0) + 1;
  }

  // Aggregate by form
  const byForm = {};
  for (const r of results) {
    if (!byForm[r.templateCode]) {
      byForm[r.templateCode] = { count: 0, decisions: new Set(), paths: new Set() };
    }
    byForm[r.templateCode].count++;
    byForm[r.templateCode].decisions.add(r.decision);
    byForm[r.templateCode].paths.add(r.path);
  }

  // Summary
  console.log("\n=== Summary ===");
  for (const [decision, count] of Object.entries(byDecision)) {
    console.log(`  ${decision}: ${count}`);
  }
  console.log(`  Total: ${results.length}`);

  // Group paths per BM (unique paths, not per issue)
  const pathsByBm = {};
  for (const r of results) {
    if (!pathsByBm[r.templateCode]) pathsByBm[r.templateCode] = [];
    if (!pathsByBm[r.templateCode].includes(r.path)) {
      pathsByBm[r.templateCode].push(r.path);
    }
  }

  // Build JSON output
  const jsonReport = {
    generated: new Date().toISOString(),
    wave: "04D",
    totalItems: results.length,
    totalUniquePaths: new Set(results.map((r) => r.templateCode + "|" + r.path)).size,
    byDecision,
    byRisk,
    items: results,
  };

  const jsonPath = path.join(OUT_DIR, "remaining-remediation-decision-matrix.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log("\nJSON: " + jsonPath);

  // Build MD table
  const mdLines = [
    "# Remaining Remediation Decision Matrix",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `| Decision | Count |`,
    `|---|---:|`  ,
    ...Object.entries(byDecision).map(([d, c]) => `| ${d} | ${c} |`),
    "",
    `| Risk | Count |`,
    `|---|---:|`  ,
    ...Object.entries(byRisk).map(([r, c]) => `| ${r} | ${c} |`),
    "",
    "## Per-Form Summary",
    "",
    `| BM | Unique Paths | Main Decision |`,
    `|---|---|---|`,
    ...Object.entries(pathsByBm)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bm, paths]) => {
        const item = results.find((r) => r.templateCode === bm);
        return `| ${bm} | ${paths.length} | ${item?.decision ?? "UNKNOWN"} |`;
      }),
    "",
    "## Full Matrix",
    "",
    `| BM | Issue | Path | Risk | Decision |`,
    `|---|---|---|---|---|`,
    ...results.map(
      (r) =>
        `| ${r.templateCode} | ${r.issueCode.substring(0, 6)} | \`${r.path}\` | ${r.risk} | ${r.decision} |`,
    ),
    "",
    "## Wave 04E Candidate List",
    "",
    "_FIXABLE_BY_SCRIPT items (none in current inventory):_",
    "",
    "No items currently classified as FIXABLE_BY_SCRIPT. All CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER",
    "items lack safe anchor text in DOCX. See ADD_PLACEHOLDER_HUMAN_REQUIRED items below.",
    "",
    "_ADD_PLACEHOLDER_HUMAN_REQUIRED items:_",
    "",
    "| BM | Path | Reason |",
    "|---|---|---|",
    ...results
      .filter((r) => r.decision === "ADD_PLACEHOLDER_HUMAN_REQUIRED")
      .map(
        (r) =>
          `| ${r.templateCode} | \`${r.path}\` | ${r.notes.substring(0, 80)} |`,
      ),
    "",
    "## Human / Legal Review List",
    "",
    "| BM | Path | Reason |",
    "|---|---|---|",
    ...results
      .filter((r) => r.decision === "NEEDS_LEGAL_REVIEW")
      .map(
        (r) =>
          `| ${r.templateCode} | \`${r.path}\` | ${r.notes.substring(0, 80)} |`,
      ),
    "",
    "## No-Action / Accepted List",
    "",
    "_ACCEPT_NON_RENDERED_METADATA items:_",
    "",
    "| BM | Path | Reason |",
    "|---|---|---|",
    ...results
      .filter((r) => r.decision === "ACCEPT_NON_RENDERED_METADATA")
      .map(
        (r) =>
          `| ${r.templateCode} | \`${r.path}\` | ${r.notes.substring(0, 80)} |`,
      ),
    "",
    "_STALE_AUDIT_METADATA items:_",
    "",
    "None in current inventory.",
  ];

  const mdPath = path.join(OUT_DIR, "REMAINING-REMEDIATION-DECISION-MATRIX.md");
  fs.writeFileSync(mdPath, mdLines.join("\n") + "\n");
  console.log("MD: " + mdPath);

  return { results, byDecision, byRisk, byForm };
}

main();
