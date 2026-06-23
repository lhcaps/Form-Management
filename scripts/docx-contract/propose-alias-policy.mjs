/**
 * propose-alias-policy.mjs
 *
 * Generates policy proposal files from residual-remediation-analysis.json and
 * wave-04e-decisions.json. This script is READ-ONLY — it does not modify
 * any contracts, DOCX files, or runtime data.
 *
 * Outputs:
 *   - field-alias-policy.proposed.json
 *   - metadata-only-policy.proposed.json
 *   - remove-approval-requests.proposed.json
 *
 * Usage: node scripts/docx-contract/propose-alias-policy.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, "..", "..", "docs", "audit", "docx", "reports");

const ANALYSIS_FILE = path.join(REPORTS_DIR, "residual-remediation-analysis.json");
const DECISIONS_FILE = path.join(REPORTS_DIR, "..", "reviewer-decisions", "wave-04e-decisions.json");
const NOW = new Date().toISOString();

function loadJson(file) {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Written: ${file}`);
}

// ── Load source data ──────────────────────────────────────────────────────────
const analysis = loadJson(ANALYSIS_FILE);
const decisions = loadJson(DECISIONS_FILE);

// Build a quick lookup: {BM}/{field} → decision
const decisionMap = new Map();
for (const d of decisions.decisions) {
  decisionMap.set(`${d.templateCode}/${d.field}`, d);
}

// ── Classify items ───────────────────────────────────────────────────────────
const aliasItems   = analysis.items.filter(i => i.classification === "ALIAS_PENDING_IMPLEMENTATION");
const metadataItems = analysis.items.filter(i => i.classification === "METADATA_ONLY_APPROVED");
const removeItems  = analysis.items.filter(i => i.classification === "REMOVE_PENDING_EXPLICIT_APPROVAL");

// Deduplicate by BM + field (2 audit entries per field: slot-level + binding-level)
function dedupeByField(items) {
  const seen = new Map();
  for (const item of items) {
    const key = `${item.templateCode}/${item.field}`;
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

const uniqueAlias    = dedupeByField(aliasItems);
const uniqueMeta    = dedupeByField(metadataItems);
const uniqueRemove  = dedupeByField(removeItems);

// ── Build field-alias-policy.proposed.json ────────────────────────────────────
const aliasPolicy = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Field Alias Policy — Phase F",
  description:
    "Canonical-to-alias mapping for fields whose data is already rendered " +
    "via a differently-named slot. No DOCX structural change beyond removing " +
    "orphaned canonical mustaches.",
  version: "1.0.0",
  phase: "F-1",
  generatedAt: NOW,
  classification: "proposed",
  status: "pending_implementation",
  owner: "backend-contract-system",
  policy: {
    description: [
      "A canonical field has a slot but no DOCX placeholder. A suffixed variant ",
      "(e.g., document.fullDocumentCode8) already renders the same data. ",
      "Aliasing redirects the canonical slot binding to the suffixed slot, ",
      "then removes the orphaned canonical mustache from DOCX.",
    ].join(""),
    constraints: [
      "Suffixed slot must have a verified DOCX placeholder in the locked contract.",
      "Both fields must have the same semantic type.",
      "No new slots or bindings are created — only re-mapped.",
      "Must not alias fields with different semantic meanings.",
    ],
    auditSuppression: {
      description:
        "Suppress CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER and " +
        "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER when alias policy is active.",
      suppressedIssueCodes: [
        "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER",
        "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER",
      ],
    },
  },
  aliases: uniqueAlias.map(item => {
    const key = `${item.templateCode}/${item.field}`;
    const decision = decisionMap.get(key) || {};
    // Determine suffixed alias based on template code and field
    const suffixedMap = {
      "BM-063/document.fullDocumentCode": "document.fullDocumentCode8",
      "BM-065/document.fullDocumentCode": "document.fullDocumentCode8",
      "BM-067/document.fullDocumentCode": "document.fullDocumentCode6",
      "BM-052/document.fullDocumentCode": "document.fullDocumentCode2",
    };
    const suffixed = suffixedMap[key] || null;
    return {
      templateCode: item.templateCode,
      canonicalField: item.field,
      aliases: suffixed ? [suffixed] : [],
      direction: "canonical_aliases_to_suffixed_slot",
      suffixedSlotId: suffixed,
      suffixedSlotPlaceholder: suffixed ? `{{${suffixed}}}` : null,
      orphanedCanonicalSlotPlaceholder: `{{${item.field}}}`,
      dataPath: item.field,
      renderedBy: suffixed ? `${suffixed} DOCX slot` : "unknown",
      runtimeBehavior: [
        `Form fills ${item.field}. Render binding aliases it to ${suffixed || "suffixed slot"}. `,
        `Orphaned {{${item.field}}} mustache is removed from DOCX.`,
      ].join(""),
      auditBehavior: [
        `Suppress CONFLICTING_SLOT_PLACEHOLDER for ${item.field} `,
        `when alias policy is active and suffixed slot has verified DOCX placeholder.`,
      ].join(""),
      risk: item.risk,
      reason: item.reason,
      reviewerDecision: decision.decision || null,
      governanceAction: item.governanceAction,
    };
  }),
  phaseF2Deliverables: [
    "Implement read-only alias policy loader.",
    "Update renderBindings for canonical→suffixed mapping.",
    "Remove orphaned {{canonical}} mustaches from DOCX.",
    "Update extractionSource.sha256 in locked contracts.",
    "Republish locked contracts and runtime DB.",
    "Run stable hash tests, gate, runtime readiness.",
  ],
};

// ── Build metadata-only-policy.proposed.json ─────────────────────────────────
const metadataPolicy = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Metadata-only Policy — Phase F",
  description:
    "Fields with approved metadata-only status: slot/binding exists but no " +
    "separate DOCX placeholder is needed because the value is already rendered " +
    "by a compound parent field.",
  version: "1.0.0",
  phase: "F-1",
  generatedAt: NOW,
  classification: "proposed",
  status: "pending_implementation",
  owner: "backend-contract-system",
  policy: {
    description:
      "A metadata-only field has a slot and binding but no DOCX placeholder. " +
      "The value is rendered by a compound field. No DOCX change needed. " +
      "Audit suppressions apply when this policy is active.",
    constraints: [
      "Compound rendering field must have a verified DOCX placeholder.",
      "No DOCX structural changes.",
      "Slot and binding remain functional for programmatic access.",
      "Must not add a visible placeholder — that would duplicate rendered content.",
    ],
    auditSuppression: {
      description:
        "Suppress CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER and " +
        "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER when metadata-only policy is active.",
      suppressedIssueCodes: [
        "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER",
        "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER",
      ],
    },
  },
  fields: uniqueMeta.map(item => {
    const key = `${item.templateCode}/${item.field}`;
    const decision = decisionMap.get(key) || {};
    const renderedByMap = {
      "BM-031/agency.bodyName": "compound agency header (parent + issuing agency lines)",
      "BM-036/document.issueDate": "document.issuePlaceDateLine compound ({issuePlace, issueDate})",
      "BM-052/document.fullDocumentCode":
        "decision.decisionLine2 + document.fullDocumentCode2 slot",
      "BM-065/decision.decisionLine":
        "static text (official form has no dynamic decision citation)",
    };
    return {
      templateCode: item.templateCode,
      field: item.field,
      classification: item.reviewerDecision || item.classification,
      renderedBy: renderedByMap[key] || "compound parent field",
      risk: item.risk,
      reason: item.reason,
      reviewerDecision: decision.decision || null,
      governanceAction: item.governanceAction,
    };
  }),
  phaseF2Deliverables: [
    "Implement read-only metadata-only policy loader.",
    "Register suppressions in audit check engine.",
    "No DOCX changes.",
    "No locked contract changes.",
    "No DB publish needed.",
    "Verification: metadata-only fields do not appear as blocking.",
  ],
};

// ── Build remove-approval-requests.proposed.json ─────────────────────────────
const removePolicy = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Remove Approval Requests — Phase F",
  description:
    "Slots and bindings flagged for potential removal but awaiting explicit " +
    "destructive approval. No removal until APPROVE_REMOVE is granted.",
  version: "1.0.0",
  phase: "F-1",
  generatedAt: NOW,
  classification: "proposed",
  status: "pending_explicit_approval",
  owner: "form-author",
  policy: {
    description:
      "No slot or binding may be deleted without APPROVE_REMOVE. " +
      "Prefer aliasing over removal when the same data is rendered elsewhere.",
    constraints: [
      "No deletion without APPROVE_REMOVE from form-author.",
      "Verify no downstream dependencies before approving.",
      "Prefer aliasing over removal.",
      "After removal: update locked contract, republish DB, pass stable hash tests.",
    ],
    noActionRules: [
      "Do not remove based on REMOVE_OR_* decisions alone.",
      "Do not remove while any remediation check is blocking.",
      "Do not remove slots with runtime data unless migration plan exists.",
    ],
  },
  removalRequests: uniqueRemove.map((item, idx) => {
    const key = `${item.templateCode}/${item.field}`;
    const decision = decisionMap.get(key) || {};
    return {
      id: `RAR-${String(idx + 1).padStart(3, "0")}`,
      templateCode: item.templateCode,
      field: item.field,
      slotId: item.field,
      placeholder: `{{${item.field}}}`,
      reviewerDecision: decision.decision || null,
      recommendedAction: "remove_slot_and_binding",
      status: "pending_explicit_approval",
      requiredApproval: "form-author",
      reason: item.reason,
      governanceAction: item.governanceAction,
      // Placeholder for form-author decision (fill in when decided)
      approvalDecision: null,
      approvedBy: null,
      approvedAt: null,
      note: null,
    };
  }),
  summary: {
    totalRequests: uniqueRemove.length,
    uniqueFields: [...new Map(
      uniqueRemove.map(i => [`${i.templateCode}/${i.field}`, {
        templateCode: i.templateCode,
        field: i.field,
        requests: uniqueRemove.filter(r =>
          r.templateCode === i.templateCode && r.field === i.field
        ).length,
      }])
    ).values()],
    approvalRequired: "form-author",
    status: "All pending — no removal until APPROVE_REMOVE is granted",
  },
  phaseF2Deliverables: [
    "Form-author reviews RAR-001 through RAR-004.",
    "Form-author records APPROVE_REMOVE, REJECT_REMOVE, or DEFER.",
    "If APPROVE_REMOVE: execute removal in Phase F-2 or later.",
    "If REJECT_REMOVE: reclassify as METADATA_ONLY_APPROVED.",
    "No DOCX, slot, or binding changes in Phase F-1.",
  ],
};

// ── Write output files ────────────────────────────────────────────────────────
writeJson(path.join(REPORTS_DIR, "field-alias-policy.proposed.json"), aliasPolicy);
writeJson(path.join(REPORTS_DIR, "metadata-only-policy.proposed.json"), metadataPolicy);
writeJson(path.join(REPORTS_DIR, "remove-approval-requests.proposed.json"), removePolicy);

console.log(`\nGenerated ${uniqueAlias.length} alias entries, ${uniqueMeta.length} metadata-only entries, ${uniqueRemove.length} remove approval requests.`);
console.log("All files are proposed — no production changes made.");
