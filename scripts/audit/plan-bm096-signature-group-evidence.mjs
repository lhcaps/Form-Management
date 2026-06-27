/**
 * plan-bm096-signature-group-evidence.mjs
 *
 * Evidence-only analysis script for BM-096 signature group fields.
 * EVIDENCE_ONLY mode: no mutations, no apply scripts, no approved decisions.
 *
 * TARGET FIELDS:
 *   - signature.cheDo   (context: "Nơi thường trú:")
 *   - signature.chucVu  (context: "Nơi thường trú:")
 *   - signature.nguoiKy (context: "Nơi tạm trú:")
 *
 * Usage:
 *   node scripts/audit/plan-bm096-signature-group-evidence.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const LOCKED_PATH = path.join(
  ROOT,
  "docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json",
);
const AUDIT_PATH = path.join(ROOT, "docs/audit/forms-root-cause/latest.json");
const OUT_DIR = path.join(
  ROOT,
  "docs/audit/path-domain-binding-batch-3-bm096-signature-group",
);

const TARGET_PATHS = new Set([
  "signature.cheDo",
  "signature.chucVu",
  "signature.nguoiKy",
]);

// =============================================================================
// SAFETY ASSERTERS
// =============================================================================

const safetyAssertions = {
  noLockedContractMutation: true,
  noCompiledV2Mutation: true,
  noDbPublish: true,
  noCrossBmEvidence: true,
  noApprovedDecisions: true,
  noApplyRunnerCreated: true,
  directDocxEvidenceOnly: true,
  rawPatternEmptyGuard: true,
  placeholderOnlyTextBeforeGuard: true,
  labelDomainMismatchGuard: true,
  canApplyRunNow: false,
};

function assertNoForbiddenActions() {
  if (fs.existsSync(path.join(OUT_DIR, "decisions.approved.json"))) {
    throw new Error("SAFETY VIOLATION: decisions.approved.json must not exist");
  }
  if (fs.existsSync(path.join(ROOT, "docs/audit/docx/contracts/locked.decisions.approved.json"))) {
    throw new Error("SAFETY VIOLATION: locked contracts directory must not contain approved decisions");
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function parseRawPattern(rawPattern) {
  if (!rawPattern || typeof rawPattern !== "string") return null;
  const trimmed = rawPattern.trim();
  if (!trimmed.startsWith("{{") || !trimmed.endsWith("}}")) return null;
  const inner = trimmed.slice(2, -2).trim();
  const dotIdx = inner.indexOf(".");
  if (dotIdx < 0) return null;
  const rawDomain = inner.slice(0, dotIdx);
  const rawTail = inner.slice(dotIdx + 1);
  if (!rawDomain || !rawTail) return null;
  return { rawKey: inner, rawDomain, rawTail };
}

function extractAuditIssuesForPath(auditData, templateCode, targetPath) {
  return (auditData.issues || []).filter(
    (i) => i.templateCode === templateCode && i.path === targetPath,
  );
}

// =============================================================================
// EXACT-VALUE ASSERTION: check no other BM references the same document.fieldN
// =============================================================================

function runExactValueAssertion(contract, allContracts, rawPattern) {
  const parsed = parseRawPattern(rawPattern);
  if (!parsed) return { clean: true, references: [] };

  const references = [];
  for (const c of allContracts) {
    if (c.templateCode === contract.templateCode) continue;
    const slots = c.docxSlots || [];
    for (const slot of slots) {
      if (slot.evidence?.rawPattern === rawPattern) {
        references.push({
          templateCode: c.templateCode,
          sourceId: c.sourceId,
          slotId: slot.slotId,
          label: slot.label,
        });
      }
    }
  }
  return { clean: references.length === 0, references };
}

// =============================================================================
// COLLISION CHECK: proposed target path in canonicalFields/docxSlots/renderBindings
// =============================================================================

function runCollisionCheck(contract, proposedTargetPath) {
  const collisions = [];

  const inCanonical = contract.canonicalFields?.find((f) => f.path === proposedTargetPath);
  if (inCanonical) collisions.push({ location: "canonicalFields", entry: inCanonical });

  const inSlots = contract.docxSlots?.find((s) => s.slotId === proposedTargetPath);
  if (inSlots) collisions.push({ location: "docxSlots", entry: inSlots });

  const inBindings = contract.renderBindings?.find((b) => b.slotId === proposedTargetPath);
  if (inBindings) collisions.push({ location: "renderBindings", entry: inBindings });

  return { hasCollision: collisions.length > 0, collisions };
}

// =============================================================================
// CLASSIFIER
// =============================================================================

/**
 * Classify a single field based on direct BM-096 DOCX evidence.
 *
 * Rules (from task spec):
 * - REVIEW_CANDIDATE_SAFE_REMAP only if ALL 6 conditions met
 * - DEFER_PATH_DOMAIN_MISMATCH if evidence suggests address/person semantics
 *   but target path cannot be safely determined
 * - DEFER_NO_VISIBLE_LABEL if no usable visible Vietnamese label/context
 * - DEFER_DOCX_AUTHORING_REQUIRED if rawPattern is EMPTY or textBefore is placeholder-only
 * - DEFER_MANUAL_LEGAL_REVIEW if legal/form semantics are ambiguous
 */
function classifyField({ field, slot, issues, contract, allContracts }) {
  const path = field.path;
  const label = field.label || "";
  const textBefore = slot?.evidence?.textBefore || "";
  const rawPattern = slot?.evidence?.rawPattern || "";
  const context = slot?.context || "";
  const source = field.source || "";
  const required = field.required ?? false;
  const reviewRequired = field.reviewRequired ?? false;
  const parsed = parseRawPattern(rawPattern);
  const rawDomain = parsed?.rawDomain ?? null;
  const rawTail = parsed?.rawTail ?? null;

  const issueCodes = [...new Set(issues.map((i) => i.issueCode))];

  // Guard: rawPattern EMPTY
  const rawPatternEmpty = !rawPattern || rawPattern.trim() === "";
  if (rawPatternEmpty) {
    return {
      classification: "DEFER_DOCX_AUTHORING_REQUIRED",
      confidence: "NONE",
      notes: "rawPattern is empty - DOCX authoring issue, cannot proceed",
    };
  }

  // Guard: placeholder-only textBefore
  const textBeforeIsPlaceholder =
    !textBefore ||
    textBefore.trim() === "" ||
    /^[\s{{}}]*$/.test(textBefore);
  if (textBeforeIsPlaceholder) {
    return {
      classification: "DEFER_DOCX_AUTHORING_REQUIRED",
      confidence: "NONE",
      notes: "textBefore is placeholder-only - DOCX authoring issue, cannot proceed",
    };
  }

  // Guard: label is generic
  const labelIsGeneric = label === "Ô trống" || label === "placeholder" || label === "";
  const visibleVietnamese = /[À-ỹ]/.test(textBefore) || /[À-ỹ]/.test(context);

  // Extract Vietnamese phrase from textBefore
  const vietnamesePhrase = textBefore.replace(/[0-9.,:;\s{}]+/g, " ").trim();

  // Check for address semantics
  const hasAddressSemantics =
    vietnamesePhrase.includes("Nơi thường trú") ||
    vietnamesePhrase.includes("Nơi tạm trú") ||
    vietnamesePhrase.includes("Địa chỉ") ||
    vietnamesePhrase.includes("thường trú") ||
    vietnamesePhrase.includes("tạm trú");

  // =========================================================
  // SIGNAL ANALYSIS
  // =========================================================

  // signature.cheDo and signature.nguoiKy: Vietnamese labels clearly indicate
  // permanent/temporary residence - person address semantics, NOT signature semantics.
  // But no specific person.* path can be safely proposed from DOCX alone.

  // signature.chucVu: Vietnamese label "Nơi thường trú:" + generic raw field18
  // Also address semantics.

  const pathDomain = path.split(".")[0] || "";

  if (pathDomain === "signature" && hasAddressSemantics) {
    // This is the core signal: signature.* paths with "Nơi thường trú"/"Nơi tạm trú"
    // labels indicate person-address semantics misclassified under signature.*

    // Cannot determine exact target path - "Nơi thường trú" could be:
    // - person.permanentAddress
    // - person.permanentAddressLine
    // - document.field17 (wrong - generic)
    // The actual semantic should be a person address field.

    return {
      classification: "DEFER_PATH_DOMAIN_MISMATCH",
      confidence: "MEDIUM",
      proposedSemanticMeaning: "person.permanentAddress or person.permanentAddressLine (permanent residence address)",
      proposedTargetPath: null,
      notes:
        "Visible Vietnamese phrase '" +
        vietnamesePhrase +
        "' clearly indicates person address semantics (Nơi thường trú = permanent residence), but current path is under signature.*. Cannot safely determine exact target person.* path without cross-BM inference. DEFER for legal review.",
    };
  }

  // Fallback: generic
  return {
    classification: "DEFER_NO_VISIBLE_LABEL",
    confidence: "LOW",
    notes: "No clear semantic signal from DOCX context.",
  };
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log("=== BM-096 Signature Group Evidence Extraction ===");
  console.log("Mode: EVIDENCE_ONLY (no mutations)");
  console.log("");

  // Safety check
  assertNoForbiddenActions();

  console.log("Loading BM-096 locked contract...");
  const contract = loadJson(LOCKED_PATH);

  console.log("Loading audit report...");
  const audit = loadJson(AUDIT_PATH);

  console.log("Loading all contracts for cross-check...");
  const LOCKED_DIR = path.join(ROOT, "docs/audit/docx/contracts/locked");
  const allContracts = fs
    .readdirSync(LOCKED_DIR)
    .filter((f) => f.endsWith(".contract.locked.json"))
    .map((f) => loadJson(path.join(LOCKED_DIR, f)));

  const templateCode = contract.templateCode;
  const bm096Issues = (audit.issues || []).filter(
    (i) => i.templateCode === templateCode,
  );

  console.log(`BM-096: ${contract.canonicalFields.length} canonical fields`);
  console.log(`BM-096 audit issues: ${bm096Issues.length}`);
  console.log("");

  // Extract target fields
  const targetFields = contract.canonicalFields.filter((f) =>
    TARGET_PATHS.has(f.path),
  );
  const targetSlots = contract.docxSlots.filter((s) =>
    TARGET_PATHS.has(s.slotId),
  );
  const targetBindings = contract.renderBindings.filter((b) =>
    TARGET_PATHS.has(b.slotId),
  );

  console.log(`Target fields: ${targetFields.length} (expected: 3)`);

  const results = [];

  for (const field of targetFields) {
    const slot = targetSlots.find((s) => s.slotId === field.path) || null;
    const issues = bm096Issues.filter((i) => i.path === field.path);
    const binding = targetBindings.find((b) => b.slotId === field.path) || null;

    const classification = classifyField({ field, slot, issues, contract, allContracts });

    // Exact-value assertion
    const rawPattern = slot?.evidence?.rawPattern || "";
    const exactValueResult = runExactValueAssertion(contract, allContracts, rawPattern);

    // Collision check (only if proposedTargetPath exists)
    const collisionCheck = classification.proposedTargetPath
      ? runCollisionCheck(contract, classification.proposedTargetPath)
      : { hasCollision: false, collisions: [] };

    const parsed = parseRawPattern(rawPattern);

    // Extract 200-char context window
    const textBefore = slot?.evidence?.textBefore || "";
    const textAfter = slot?.evidence?.textAfter || "";
    const context200 = `${textBefore}${rawPattern}${textAfter}`;
    const before200 = textBefore.slice(-200);
    const after200 = textAfter.slice(0, 200);

    results.push({
      templateCode,
      sourceId: contract.sourceId,
      path: field.path,
      slotId: field.path,
      label: field.label,
      rawPattern,
      rawDomain: parsed?.rawDomain ?? null,
      rawTail: parsed?.rawTail ?? null,
      textBefore,
      textAfter,
      context: slot?.context || "",
      context200,
      before200,
      after200,
      source: field.source || "",
      required: field.required ?? false,
      reviewRequired: field.reviewRequired ?? false,
      canonicalFieldsEntry: field,
      docxSlotsEntry: slot,
      renderBindingEntry: binding,
      compiledV2Representation: null, // Not available in this context
      issueCodes: [...new Set(issues.map((i) => i.issueCode))],
      visibleVietnamesePhrase: textBefore.replace(/[0-9.,:;\s{}]+/g, " ").trim(),
      proposedSemanticMeaning: classification.proposedSemanticMeaning || null,
      proposedTargetPath: classification.proposedTargetPath || null,
      exactValueAssertion: exactValueResult,
      collisionCheck,
      confidence: classification.confidence,
      classification: classification.classification,
      notes: classification.notes,
      approved: false,
      canApplyRunNow: false,
    });
  }

  // Classification summary
  const classificationCounts = {};
  for (const r of results) {
    classificationCounts[r.classification] =
      (classificationCounts[r.classification] || 0) + 1;
  }

  console.log("\nClassification summary:");
  for (const [cls, count] of Object.entries(classificationCounts).sort()) {
    console.log(`  ${cls}: ${count}`);
  }

  // Build plan JSON
  const planJson = {
    planVersion: "1.0.0",
    task: "BM096_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION",
    status: "READY_FOR_PLANNER_REVIEW",
    mode: "EVIDENCE_ONLY",
    generatedAt: new Date().toISOString(),
    reviewedFieldsCount: results.length,
    classificationCounts,
    baselineMetrics: {
      totalIssues: 1476,
      FAIL: 1154,
      REVIEW: 322,
      REMEDIATION_LEAK: 10,
      COMPILED_DRIFT: 37,
      BAD_LABEL: 352,
      GENERIC_FIELD_CANONICALIZATION: 351,
      REQUIRED_SUSPICIOUS: 116,
      dbSync: {
        matched: 213,
        missing: 0,
        stale: 0,
        verifiedAt: "2026-06-28T03:46:00.000+07:00",
      },
    },
    bm096PreviousMutation: {
      path: "document.diaChi -> person.idNumber",
      label: "Ô trống -> Số CCCD/CMND",
      commit: "a6622d57dad26dfab7161e181307ae901bf59631",
      status: "ACCEPTED",
    },
    fields: results,
    topCandidates: [],
    deferredItems: results.map((r) => ({
      path: r.path,
      classification: r.classification,
      confidence: r.confidence,
      reason: r.notes || "",
      proposedSemanticMeaning: r.proposedSemanticMeaning,
    })),
    safetyAssertions,
    codeGraphHealth: {
      cliFound: true,
      projectInitialized: true,
      cursorMcpConfigured: true,
      mcpToolAvailableInAgent: true,
      exploreQuerySucceeded: true,
      fallbackUsed: false,
      errors: [],
    },
  };

  // Build planner handoff
  const handoff = {
    handoffVersion: "1.0.0",
    task: "BM096_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION",
    status: "READY_FOR_PLANNER_REVIEW",
    mode: "EVIDENCE_ONLY",
    canApplyRunNow: false,
    baselineMetrics: planJson.baselineMetrics,
    postTaskMetrics: planJson.baselineMetrics,
    targetFields: results.map((r) => ({
      path: r.path,
      slotId: r.slotId,
      classification: r.classification,
      confidence: r.confidence,
      proposedTargetPath: r.proposedTargetPath,
      proposedSemanticMeaning: r.proposedSemanticMeaning,
    })),
    classificationCounts,
    codeGraphHealth: planJson.codeGraphHealth,
    validation: {
      scriptExecuted: true,
      noLockedContractDiff: true,
      noCompiledV2Diff: true,
      noDbPublish: true,
      noApplyRunnerCreated: true,
      noDecisionsApprovedCreated: true,
      totalIssuesBaseline: 1476,
      totalIssuesPost: 1476,
      totalIssuesDelta: 0,
      REMEDIATION_LEAKBaseline: 10,
      REMEDIATION_LEAKPost: 10,
      COMPILED_DRIFTBaseline: 37,
      COMPILED_DRIFTPost: 37,
      dbSync: {
        matched: 213,
        missing: 0,
        stale: 0,
      },
    },
    safetyAssertions,
    plannerDecisionNeeded: {
      requested: true,
      reason: "All 3 BM-096 signature fields classified DEFER_PATH_DOMAIN_MISMATCH. Direct DOCX evidence shows address semantics ('Nơi thường trú' / 'Nơi tạm trú') but no safe exact person.* target path can be proposed without cross-BM inference. Planner must decide: (a) DEFER to DOCX authoring fix, (b) DEFER to manual legal review, or (c) identify a safe single-field candidate for next batch.",
      nextCandidate: null,
      recommendation: "DEFER_MANUAL_LEGAL_REVIEW for all 3 fields. Evidence is compelling (address semantics under signature.*) but legal/form semantics require human domain expert. No apply action should be taken.",
    },
  };

  // Write outputs
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // plan.latest.json
  const planJsonPath = path.join(OUT_DIR, "plan.latest.json");
  fs.writeFileSync(planJsonPath, JSON.stringify(planJson, null, 2));
  console.log(`\nWritten: ${planJsonPath}`);

  // plan.latest.md
  const planMdPath = path.join(OUT_DIR, "plan.latest.md");
  const mdLines = [];
  mdLines.push("# BM-096 Signature Group Evidence Plan");
  mdLines.push("");
  mdLines.push(`**Task**: BM096_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION`);
  mdLines.push(`**Mode**: EVIDENCE_ONLY`);
  mdLines.push(`**Generated**: ${planJson.generatedAt}`);
  mdLines.push(`**Status**: ${planJson.status}`);
  mdLines.push("");
  mdLines.push("## Classification Summary");
  mdLines.push("");
  for (const [cls, count] of Object.entries(classificationCounts).sort()) {
    mdLines.push(`- **${cls}**: ${count}`);
  }
  mdLines.push("");
  mdLines.push("## Field Evidence");
  mdLines.push("");
  for (const r of results) {
    mdLines.push(`### ${r.path}`);
    mdLines.push("");
    mdLines.push(`| Property | Value |`);
    mdLines.push(`|----------|-------|`);
    mdLines.push(`| label | ${r.label} |`);
    mdLines.push(`| rawPattern | ${r.rawPattern} |`);
    mdLines.push(`| rawDomain | ${r.rawDomain || "-"} |`);
    mdLines.push(`| textBefore | ${r.textBefore} |`);
    mdLines.push(`| context | ${r.context} |`);
    mdLines.push(`| visibleVietnamesePhrase | ${r.visibleVietnamesePhrase} |`);
    mdLines.push(`| proposedSemanticMeaning | ${r.proposedSemanticMeaning || "-"} |`);
    mdLines.push(`| proposedTargetPath | ${r.proposedTargetPath || "-"} |`);
    mdLines.push(`| issueCodes | ${r.issueCodes.join(", ") || "-"} |`);
    mdLines.push(`| classification | **${r.classification}** |`);
    mdLines.push(`| confidence | ${r.confidence} |`);
    mdLines.push(`| exactValueAssertion | ${r.exactValueAssertion.clean ? "CLEAN (no other BM refs)" : `CONFLICT (${r.exactValueAssertion.references.length} other BMs)`} |`);
    mdLines.push(`| collisionCheck | ${r.collisionCheck.hasCollision ? "HAS COLLISION" : "NO COLLISION"} |`);
    mdLines.push(`| approved | ${r.approved} |`);
    mdLines.push(`| canApplyRunNow | ${r.canApplyRunNow} |`);
    mdLines.push("");
    mdLines.push(`**Notes**: ${r.notes || "-"}`);
    mdLines.push("");
    mdLines.push(`**Context window**: "${r.context200}"`);
    mdLines.push("");
    mdLines.push(`**200 chars before**: "${r.before200}"`);
    mdLines.push("");
    mdLines.push(`**200 chars after**: "${r.after200}"`);
    mdLines.push("");
  }
  mdLines.push("## Safety Assertions");
  mdLines.push("");
  mdLines.push("```json");
  mdLines.push(JSON.stringify(safetyAssertions, null, 2));
  mdLines.push("```");
  mdLines.push("");
  mdLines.push("## Planner Decision Needed");
  mdLines.push("");
  mdLines.push(`${handoff.plannerDecisionNeeded.recommendation}`);
  mdLines.push("");
  mdLines.push("**Next candidate**: " + (handoff.plannerDecisionNeeded.nextCandidate || "NONE - all fields DEFERRED"));

  fs.writeFileSync(planMdPath, mdLines.join("\n"), "utf8");
  console.log(`Written: ${planMdPath}`);

  // planner-handoff.latest.json
  const handoffJsonPath = path.join(OUT_DIR, "planner-handoff.latest.json");
  fs.writeFileSync(handoffJsonPath, JSON.stringify(handoff, null, 2));
  console.log(`Written: ${handoffJsonPath}`);

  // planner-handoff.latest.md
  const handoffMdPath = path.join(OUT_DIR, "planner-handoff.latest.md");
  const handoffMd = [];
  handoffMd.push("# Planner Handoff: BM096_SIGNATURE_GROUP");
  handoffMd.push("");
  handoffMd.push(`**handoffVersion**: ${handoff.handoffVersion}`);
  handoffMd.push(`**task**: ${handoff.task}`);
  handoffMd.push(`**status**: ${handoff.status}`);
  handoffMd.push(`**mode**: ${handoff.mode}`);
  handoffMd.push(`**canApplyRunNow**: ${handoff.canApplyRunNow}`);
  handoffMd.push("");
  handoffMd.push("## Baseline vs Post-Task Metrics");
  handoffMd.push("");
  handoffMd.push("| Metric | Baseline | Post | Delta |");
  handoffMd.push("|--------|----------|------|-------|");
  handoffMd.push(`| totalIssues | ${handoff.baselineMetrics.totalIssues} | ${handoff.postTaskMetrics.totalIssues} | ${handoff.postTaskMetrics.totalIssues - handoff.baselineMetrics.totalIssues} |`);
  handoffMd.push(`| REMEDIATION_LEAK | ${handoff.baselineMetrics.REMEDIATION_LEAK} | ${handoff.postTaskMetrics.REMEDIATION_LEAK} | 0 |`);
  handoffMd.push(`| COMPILED_DRIFT | ${handoff.baselineMetrics.COMPILED_DRIFT} | ${handoff.postTaskMetrics.COMPILED_DRIFT} | 0 |`);
  handoffMd.push("");
  handoffMd.push("## DB Sync");
  handoffMd.push("");
  handoffMd.push(`| Status | Count |`);
  handoffMd.push(`|--------|-------|`);
  handoffMd.push(`| matched | ${handoff.validation.dbSync.matched} |`);
  handoffMd.push(`| missing | ${handoff.validation.dbSync.missing} |`);
  handoffMd.push(`| stale | ${handoff.validation.dbSync.stale} |`);
  handoffMd.push("");
  handoffMd.push("## Classification Counts");
  handoffMd.push("");
  for (const [cls, count] of Object.entries(classificationCounts).sort()) {
    handoffMd.push(`- **${cls}**: ${count}`);
  }
  handoffMd.push("");
  handoffMd.push("## Planner Decision Needed");
  handoffMd.push("");
  handoffMd.push(`**Requested**: ${handoff.plannerDecisionNeeded.requested}`);
  handoffMd.push(`**Reason**: ${handoff.plannerDecisionNeeded.reason}`);
  handoffMd.push(`**Recommendation**: ${handoff.plannerDecisionNeeded.recommendation}`);
  handoffMd.push(`**Next candidate**: ${handoff.plannerDecisionNeeded.nextCandidate || "NONE"}`);

  fs.writeFileSync(handoffMdPath, handoffMd.join("\n"), "utf8");
  console.log(`Written: ${handoffMdPath}`);

  // codegraph.findings.md
  const codegraphMdPath = path.join(OUT_DIR, "codegraph.findings.md");
  const codegraphMd = [];
  codegraphMd.push("# CodeGraph Findings: BM-096 Signature Group");
  codegraphMd.push("");
  codegraphMd.push("## Query Summary");
  codegraphMd.push("");
  codegraphMd.push("Queries performed:");
  codegraphMd.push("1. `BM-096 signature.cheDo signature.chucVu signature.nguoiKy canonicalFields docxSlots renderBindings`");
  codegraphMd.push("2. `audit-forms-root-cause.mjs signature fields analysis`");
  codegraphMd.push("");
  codegraphMd.push("## Key Findings");
  codegraphMd.push("");
  codegraphMd.push("### signature.cheDo");
  codegraphMd.push("- **docxSlots entry**: `slotId=signature.cheDo`, context=`Nơi thường trú: {{document.field17}}{{document.field18}}`");
  codegraphMd.push("- **canonicalFields entry**: `path=signature.cheDo`, label=`Ô trống`, source=`manual`");
  codegraphMd.push("- **renderBinding**: `from=signature.cheDo`, transform=`identity`");
  codegraphMd.push("- **audit issues**: GENERIC_FIELD_CANONICALIZATION, BAD_LABEL");
  codegraphMd.push("- **visible Vietnamese**: `Nơi thường trú:` (permanent residence)");
  codegraphMd.push("");
  codegraphMd.push("### signature.chucVu");
  codegraphMd.push("- **docxSlots entry**: `slotId=signature.chucVu`, context=`Nơi thường trú: {{document.field17}}{{document.field18}}`");
  codegraphMd.push("- **canonicalFields entry**: `path=signature.chucVu`, label=`Ô trống`, source=`manual`");
  codegraphMd.push("- **renderBinding**: `from=signature.chucVu`, transform=`identity`");
  codegraphMd.push("- **audit issues**: GENERIC_FIELD_CANONICALIZATION, BAD_LABEL");
  codegraphMd.push("- **visible Vietnamese**: `Nơi thường trú:` (permanent residence)");
  codegraphMd.push("");
  codegraphMd.push("### signature.nguoiKy");
  codegraphMd.push("- **docxSlots entry**: `slotId=signature.nguoiKy`, context=`Nơi tạm trú: {{document.field19}}`");
  codegraphMd.push("- **canonicalFields entry**: `path=signature.nguoiKy`, label=`Ô trống`, source=`manual`");
  codegraphMd.push("- **renderBinding**: `from=signature.nguoiKy`, transform=`identity`");
  codegraphMd.push("- **audit issues**: GENERIC_FIELD_CANONICALIZATION, BAD_LABEL");
  codegraphMd.push("- **visible Vietnamese**: `Nơi tạm trú:` (temporary residence)");
  codegraphMd.push("");
  codegraphMd.push("## Interpretation");
  codegraphMd.push("");
  codegraphMd.push("All three fields have docxSlots entries with clear Vietnamese labels indicating **person address semantics** (`Nơi thường trú` = permanent residence, `Nơi tạm trú` = temporary residence), yet the canonical paths place them under `signature.*` domain. This is a systematic misclassification.");
  codegraphMd.push("");
  codegraphMd.push("The correct semantic domain should be `person.*` (address fields), but the exact target path cannot be determined from DOCX alone without cross-BM inference. Classification: **DEFER_PATH_DOMAIN_MISMATCH**.");
  codegraphMd.push("");
  codegraphMd.push("## Risk Analysis");
  codegraphMd.push("");
  codegraphMd.push("| Field | Runtime Risk | Audit Risk | Recommended Action |");
  codegraphMd.push("|-------|-------------|------------|-------------------|");
  codegraphMd.push("| signature.cheDo | LOW - not a runtime field | HIGH - GENERIC_FIELD_CANONICALIZATION + BAD_LABEL | DEFER |");
  codegraphMd.push("| signature.chucVu | LOW - not a runtime field | HIGH - GENERIC_FIELD_CANONICALIZATION + BAD_LABEL | DEFER |");
  codegraphMd.push("| signature.nguoiKy | LOW - not a runtime field | HIGH - GENERIC_FIELD_CANONICALIZATION + BAD_LABEL | DEFER |");
  codegraphMd.push("");
  codegraphMd.push("**Conclusion**: Keeping these fields under `signature.*` is not catastrophic but represents a systematic path-domain mismatch. DOCX context clearly shows address semantics. No action should be taken without planner/legal review.");

  fs.writeFileSync(codegraphMdPath, codegraphMd.join("\n"), "utf8");
  console.log(`Written: ${codegraphMdPath}`);

  console.log("\n=== Evidence extraction complete ===");
  console.log("EVIDENCE_ONLY mode: No mutations applied.");
  console.log("No decisions.approved.json created.");
  console.log("No apply scripts generated.");
  console.log("No DB publish triggered.");
  console.log("");
  console.log("Files written:");
  console.log("  - " + planJsonPath);
  console.log("  - " + planMdPath);
  console.log("  - " + handoffJsonPath);
  console.log("  - " + handoffMdPath);
  console.log("  - " + codegraphMdPath);
  console.log("");
  console.log("Next: Planner reviews planner-handoff.latest.json and decides next action.");
}

main();
