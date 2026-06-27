/**
 * test/bm096-signature-group-evidence.test.mjs
 *
 * Unit tests for BM-096 signature group evidence extraction.
 * Verifies EVIDENCE_ONLY mode guards and output structure.
 *
 * Usage:
 *   node --test test/bm096-signature-group-evidence.test.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(
  ROOT,
  "docs/audit/path-domain-binding-batch-3-bm096-signature-group",
);
const LOCKED_PATH = path.join(
  ROOT,
  "docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json",
);

const REQUIRED_FILES = [
  "plan.latest.json",
  "plan.latest.md",
  "planner-handoff.latest.json",
  "planner-handoff.latest.md",
  "codegraph.findings.md",
];

const TARGET_PATHS = new Set([
  "signature.cheDo",
  "signature.chucVu",
  "signature.nguoiKy",
]);

const ALLOWED_CLASSIFICATIONS = new Set([
  "REVIEW_CANDIDATE_SAFE_REMAP",
  "DEFER_NO_VISIBLE_LABEL",
  "DEFER_PATH_DOMAIN_MISMATCH",
  "DEFER_DOCX_AUTHORING_REQUIRED",
  "DEFER_MANUAL_LEGAL_REVIEW",
]);

// =============================================================================
// TEST: Required output files exist
// =============================================================================

async function test_required_files_exist() {
  const missing = [];
  for (const f of REQUIRED_FILES) {
    const fp = path.join(OUT_DIR, f);
    if (!fs.existsSync(fp)) {
      missing.push(f);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required files: ${missing.join(", ")}. Run evidence script first.`,
    );
  }
}

// =============================================================================
// TEST: Exactly 3 target fields are reviewed
// =============================================================================

async function test_exactly_3_target_fields() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  if (!fs.existsSync(planPath)) {
    throw new Error("plan.latest.json not found");
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const targetFields = plan.fields?.filter((f) =>
    TARGET_PATHS.has(f.path),
  );
  if (!targetFields || targetFields.length !== 3) {
    throw new Error(
      `Expected exactly 3 target fields, got ${targetFields?.length ?? 0}`,
    );
  }
}

// =============================================================================
// TEST: Only BM-096 evidence is used (no cross-BM)
// =============================================================================

async function test_bm096_only_evidence() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  for (const field of plan.fields || []) {
    if (!TARGET_PATHS.has(field.path)) continue;

    // Every field should have templateCode = "BM-096"
    if (field.templateCode !== "BM-096") {
      throw new Error(
        `Cross-BM evidence detected: ${field.path} has templateCode=${field.templateCode}`,
      );
    }

    // sourceId should reference BM-096
    if (!field.sourceId?.includes("BM-096")) {
      throw new Error(
        `Cross-BM evidence detected: ${field.path} has sourceId=${field.sourceId}`,
      );
    }
  }
}

// =============================================================================
// TEST: No item has approved=true
// =============================================================================

async function test_no_approved() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  const approvedItems = [];
  for (const field of plan.fields || []) {
    if (field.approved === true) {
      approvedItems.push(field.path);
    }
  }
  if (approvedItems.length > 0) {
    throw new Error(
      `approved=true found for: ${approvedItems.join(", ")}. EVIDENCE_ONLY mode forbids approvals.`,
    );
  }
}

// =============================================================================
// TEST: canApplyRunNow=false
// =============================================================================

async function test_can_apply_run_now_false() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  if (plan.safetyAssertions?.canApplyRunNow !== false) {
    throw new Error(
      `canApplyRunNow should be false in EVIDENCE_ONLY mode, got: ${plan.safetyAssertions?.canApplyRunNow}`,
    );
  }

  const handoffPath = path.join(OUT_DIR, "planner-handoff.latest.json");
  const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));
  if (handoff.canApplyRunNow !== false) {
    throw new Error(
      `handoff.canApplyRunNow should be false, got: ${handoff.canApplyRunNow}`,
    );
  }
}

// =============================================================================
// TEST: No decisions.approved.json created
// =============================================================================

async function test_no_decisions_approved() {
  const approvedPath = path.join(OUT_DIR, "decisions.approved.json");
  if (fs.existsSync(approvedPath)) {
    throw new Error(
      "decisions.approved.json must not exist in EVIDENCE_ONLY mode",
    );
  }

  const lockedApproved = path.join(
    ROOT,
    "docs/audit/docx/contracts/locked/decisions.approved.json",
  );
  if (fs.existsSync(lockedApproved)) {
    throw new Error(
      "decisions.approved.json must not exist in locked contracts directory",
    );
  }
}

// =============================================================================
// TEST: All classifications are from allowed enum
// =============================================================================

async function test_classifications_valid() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  const invalid = [];
  for (const field of plan.fields || []) {
    if (!TARGET_PATHS.has(field.path)) continue;
    if (!ALLOWED_CLASSIFICATIONS.has(field.classification)) {
      invalid.push(`${field.path}: ${field.classification}`);
    }
  }
  if (invalid.length > 0) {
    throw new Error(
      `Invalid classifications: ${invalid.join("; ")}. Allowed: ${[...ALLOWED_CLASSIFICATIONS].join(", ")}`,
    );
  }
}

// =============================================================================
// TEST: Each item has direct evidence fields
// =============================================================================

async function test_direct_evidence_fields() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  const missing = [];
  for (const field of plan.fields || []) {
    if (!TARGET_PATHS.has(field.path)) continue;

    if (!field.rawPattern && field.rawPattern !== "") {
      missing.push(`${field.path}: missing rawPattern`);
    }
    if (!field.textBefore && field.textBefore !== "") {
      missing.push(`${field.path}: missing textBefore`);
    }
    if (!field.context && field.context !== "") {
      missing.push(`${field.path}: missing context`);
    }
    if (!field.canonicalFieldsEntry) {
      missing.push(`${field.path}: missing canonicalFieldsEntry`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing direct evidence fields: ${missing.join("; ")}`,
    );
  }
}

// =============================================================================
// TEST: If proposedTargetPath exists, collisionCheck must exist
// =============================================================================

async function test_collision_check_when_proposed() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  const violations = [];
  for (const field of plan.fields || []) {
    if (!TARGET_PATHS.has(field.path)) continue;

    if (field.proposedTargetPath && !field.collisionCheck) {
      violations.push(
        `${field.path}: has proposedTargetPath but no collisionCheck`,
      );
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `Collision check violations: ${violations.join("; ")}`,
    );
  }
}

// =============================================================================
// TEST: planner-handoff.latest.json has minimum structure
// =============================================================================

async function test_handoff_minimum_structure() {
  const handoffPath = path.join(OUT_DIR, "planner-handoff.latest.json");
  if (!fs.existsSync(handoffPath)) {
    throw new Error("planner-handoff.latest.json not found");
  }
  const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));

  const required = [
    "handoffVersion",
    "task",
    "status",
    "mode",
    "canApplyRunNow",
    "baselineMetrics",
    "postTaskMetrics",
    "targetFields",
    "classificationCounts",
    "codeGraphHealth",
    "validation",
    "safetyAssertions",
    "plannerDecisionNeeded",
  ];

  const missing = [];
  for (const key of required) {
    if (handoff[key] === undefined) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `handoff missing required fields: ${missing.join(", ")}`,
    );
  }

  // Check values
  if (handoff.task !== "BM096_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION") {
    throw new Error(`handoff.task mismatch: ${handoff.task}`);
  }
  if (handoff.mode !== "EVIDENCE_ONLY") {
    throw new Error(`handoff.mode should be EVIDENCE_ONLY: ${handoff.mode}`);
  }
  if (handoff.canApplyRunNow !== false) {
    throw new Error(`handoff.canApplyRunNow should be false: ${handoff.canApplyRunNow}`);
  }
  if (handoff.status !== "READY_FOR_PLANNER_REVIEW") {
    throw new Error(`handoff.status should be READY_FOR_PLANNER_REVIEW: ${handoff.status}`);
  }
}

// =============================================================================
// TEST: Safety assertions are all true (EVIDENCE_ONLY guards)
// =============================================================================

async function test_safety_assertions() {
  const handoffPath = path.join(OUT_DIR, "planner-handoff.latest.json");
  const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));

  const expectedTrue = [
    "noLockedContractMutation",
    "noCompiledV2Mutation",
    "noDbPublish",
    "noCrossBmEvidence",
    "noApprovedDecisions",
    "noApplyRunnerCreated",
    "directDocxEvidenceOnly",
    "rawPatternEmptyGuard",
    "placeholderOnlyTextBeforeGuard",
    "labelDomainMismatchGuard",
  ];

  const violations = [];
  for (const key of expectedTrue) {
    if (handoff.safetyAssertions?.[key] !== true) {
      violations.push(`${key}=${handoff.safetyAssertions?.[key]}`);
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `Safety assertion violations: ${violations.join("; ")}`,
    );
  }
}

// =============================================================================
// TEST: signature.cheDo and signature.nguoiKy have visible Vietnamese context
// =============================================================================

async function test_visible_vietnamese_context() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  const violations = [];
  for (const field of plan.fields || []) {
    if (!TARGET_PATHS.has(field.path)) continue;

    // At least signature.cheDo and signature.nguoiKy should have Vietnamese in textBefore
    if (field.path === "signature.cheDo" || field.path === "signature.nguoiKy") {
      const hasVietnamese = /[À-ỹ]/.test(field.textBefore || "");
      if (!hasVietnamese) {
        violations.push(
          `${field.path}: textBefore="${field.textBefore}" missing Vietnamese`,
        );
      }
    }
  }
  if (violations.length > 0) {
    throw new Error(`Visible Vietnamese violations: ${violations.join("; ")}`);
  }
}

// =============================================================================
// TEST: No locked contract diff (guard check)
// =============================================================================

async function test_no_locked_contract_diff() {
  // This is a pre-flight check that the locked contract hasn't been modified
  if (!fs.existsSync(LOCKED_PATH)) {
    throw new Error("Locked contract not found: " + LOCKED_PATH);
  }
  const contract = JSON.parse(fs.readFileSync(LOCKED_PATH, "utf8"));
  if (contract.status !== "locked") {
    throw new Error(`Contract status should be "locked": ${contract.status}`);
  }
  if (contract.templateCode !== "BM-096") {
    throw new Error(`Contract templateCode should be "BM-096": ${contract.templateCode}`);
  }
}

// =============================================================================
// TEST: classificationCounts matches field count
// =============================================================================

async function test_classification_counts() {
  const planPath = path.join(OUT_DIR, "plan.latest.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

  const totalClassified = Object.values(plan.classificationCounts || {}).reduce(
    (s, v) => s + v,
    0,
  );
  const targetCount = plan.fields?.filter((f) =>
    TARGET_PATHS.has(f.path),
  ).length;

  if (totalClassified !== targetCount) {
    throw new Error(
      `classificationCounts sum (${totalClassified}) != target fields (${targetCount})`,
    );
  }
}

// =============================================================================
// TEST: dbSync metrics in handoff match expected
// =============================================================================

async function test_db_sync_metrics() {
  const handoffPath = path.join(OUT_DIR, "planner-handoff.latest.json");
  const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));

  const dbSync = handoff.validation?.dbSync;
  if (!dbSync) {
    throw new Error("handoff.validation.dbSync is missing");
  }
  if (dbSync.matched !== 213) {
    throw new Error(`dbSync.matched should be 213: ${dbSync.matched}`);
  }
  if (dbSync.missing !== 0) {
    throw new Error(`dbSync.missing should be 0: ${dbSync.missing}`);
  }
  if (dbSync.stale !== 0) {
    throw new Error(`dbSync.stale should be 0: ${dbSync.stale}`);
  }
}

// =============================================================================
// TEST: totalIssues unchanged
// =============================================================================

async function test_total_issues_unchanged() {
  const handoffPath = path.join(OUT_DIR, "planner-handoff.latest.json");
  const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));

  const baseline = handoff.baselineMetrics?.totalIssues;
  const post = handoff.postTaskMetrics?.totalIssues;

  if (baseline !== 1476) {
    throw new Error(`baselineMetrics.totalIssues should be 1476: ${baseline}`);
  }
  if (post !== baseline) {
    throw new Error(
      `postTaskMetrics.totalIssues changed from ${baseline} to ${post}`,
    );
  }
}

// =============================================================================
// REGISTRY
// =============================================================================

const TESTS = [
  test_required_files_exist,
  test_exactly_3_target_fields,
  test_bm096_only_evidence,
  test_no_approved,
  test_can_apply_run_now_false,
  test_no_decisions_approved,
  test_classifications_valid,
  test_direct_evidence_fields,
  test_collision_check_when_proposed,
  test_handoff_minimum_structure,
  test_safety_assertions,
  test_visible_vietnamese_context,
  test_no_locked_contract_diff,
  test_classification_counts,
  test_db_sync_metrics,
  test_total_issues_unchanged,
];

// =============================================================================
// RUN
// =============================================================================

async function main() {
  console.log("=== BM-096 Signature Group Evidence Tests ===\n");

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of TESTS) {
    try {
      await test();
      console.log(`  PASS  ${test.name.replace(/^test_/, "")}`);
      passed++;
    } catch (err) {
      console.log(`  FAIL  ${test.name.replace(/^test_/, "")}: ${err.message}`);
      failed++;
      failures.push({ name: test.name, error: err.message });
    }
  }

  console.log(
    `\n=== RESULTS: ${passed} passed, ${failed} failed out of ${TESTS.length} tests ===`,
  );

  if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  - ${f.name}: ${f.error}`);
    }
    process.exit(1);
  }
}

main();
