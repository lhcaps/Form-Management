#!/usr/bin/env node
/**
 * Phase D - Gate: 213/213 corpus readiness check.
 *
 * Exits 0 only when ALL of the following are true:
 *   - Exactly 213 locked files exist
 *   - All 213 are human-reviewed
 *   - Zero generic paths (docxSlots, canonicalFields, renderBindings)
 *   - Zero blocking verify issues
 *   - Zero remediation verify issues
 *   - No locked contract has canonicalFields with source="unknown"
 *   - No locked contract has reviewRequired=true on fields without a
 *     CONSTANT/DEFAULT/SYSTEM/COMPUTED dataSource (those are auto-resolved)
 *
 * Run with --help-remediation to see remediation details without blocking.
 *
 * Exit codes:
 *   0 = all gates pass
 *   1 = gate failure (reason printed to stderr)
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const LOCKED_DIR = path.join(__dirname, "..", "..", "docs", "audit", "docx", "contracts", "locked");
const REPORTS_DIR = path.join(__dirname, "..", "..", "docs", "audit", "docx", "reports");

// Matches generic placeholder paths: document.field, field1, field_legacy
// Does NOT match: document.documentCode, document.fullName, fieldName
const GENERIC_RE = new RegExp(String.raw`(^|\.)field(?:\d+)?(?:_|$)`, "iu");

const allowRemediation = process.argv.includes("--allow-remediation");
const allowSourceUnknown = process.argv.includes("--allow-source-unknown");
const allowUnresolvedReview = process.argv.includes("--allow-unresolved-review");
const showRemediation = process.argv.includes("--help-remediation");

function isGenericPath(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  return GENERIC_RE.test(value);
}

const lockedFiles = (fs.readdirSync(LOCKED_DIR) ?? [])
  .filter((f) => f.endsWith(".contract.locked.json") && !f.startsWith("_"))
  .sort();

const totalLocked = lockedFiles.length;
const totalExpected = 213;

if (totalLocked !== totalExpected) {
  const gap = totalExpected - totalLocked;
  console.error(
    `\n[GATE FAILED] Locked count: ${totalLocked}/${totalExpected} (gap: ${gap})`,
  );
  process.exit(1);
}

const issues = [];
let humanReviewed = 0;
let genericSlots = 0;
let genericFields = 0;
let genericBindings = 0;

const lockedContracts = [];

for (const file of lockedFiles) {
  const c = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
  lockedContracts.push(c);

  if (c.productMetadata?.reviewKind === "human") {
    humanReviewed++;
  }

  genericSlots += (c.docxSlots ?? []).filter((s) =>
    isGenericPath(s.slotId)
  ).length;

  genericFields += (c.canonicalFields ?? []).filter((f) =>
    isGenericPath(f.path)
  ).length;

  genericBindings += (c.renderBindings ?? []).filter(
    (b) =>
      isGenericPath(b.slotId) ||
      isGenericPath(b.from),
  ).length;
}

console.log(`\n[gate:forms:213]`);
console.log(`  Locked count:    ${totalLocked}/${totalExpected}`);
console.log(`  Human-reviewed:  ${humanReviewed}/${totalLocked}`);
console.log(`  Generic slots:  ${genericSlots}`);
console.log(`  Generic fields: ${genericFields}`);
console.log(`  Generic binds:  ${genericBindings}`);

// Read verify report to surface blocking/remediation/warning counts
const reportPath = path.join(REPORTS_DIR, "LOCKED-CONTRACTS-SUMMARY.md");
let blockingCount = null;
let remediationCount = null;
let warningCount = null;
let reportFresh = false;
if (fs.existsSync(reportPath)) {
  const content = fs.readFileSync(reportPath, "utf8");
  const mBlocking = content.match(/\*\*Blocking:\s+(\d+)\*\*/);
  const mRemediation = content.match(/\*\*Remediation:\s+(\d+)\*\*/);
  const mWarning = content.match(/\*\*Warning:\s+(\d+)\*\*/);
  blockingCount = mBlocking ? parseInt(mBlocking[1], 10) : null;
  remediationCount = mRemediation ? parseInt(mRemediation[1], 10) : null;
  warningCount = mWarning ? parseInt(mWarning[1], 10) : null;
  const genMatch = content.match(/Generated:\s+([\dT:.+-]+)/);
  if (genMatch) {
    const genDate = new Date(genMatch[1]);
    const now = new Date();
    reportFresh = (now - genDate) < 24 * 60 * 60 * 1000;
  }
  console.log(`  Verify report:  ${path.basename(reportPath)}`);
  if (blockingCount !== null) {
    console.log(`  Blocking:       ${blockingCount} (must fix before production)`);
    console.log(`  Remediation:    ${remediationCount} (DOCX edit needed)`);
    console.log(`  Warning:        ${warningCount} (metadata completeness)`);
  }
  if (!reportFresh) {
    console.error(`  WARNING: Verify report is stale. Run: pnpm audit:docx:verify-locked`);
    issues.push(`verify report is stale`);
  }
} else {
  console.error(`  WARNING: Verify report not found. Run: pnpm audit:docx:verify-locked`);
  issues.push(`verify report not found`);
}

// --- NEW checks for reviewRequired and source:unknown ---

// Fields with these dataSources are auto-resolved by the runtime;
// reviewRequired=true on them is acceptable.
const AUTO_RESOLVED_KINDS = new Set(["CONSTANT", "DEFAULT", "SYSTEM", "COMPUTED"]);

const unknownSourceFields = [];
const unresolvedReviewRequiredFields = [];

for (const c of lockedContracts) {
  const code = c.templateCode ?? "unknown";

  for (const field of c.canonicalFields ?? []) {
    if (field.source === "unknown") {
      unknownSourceFields.push(`${code}: ${field.path}`);
    }

    // reviewRequired=true is acceptable only if the field has an auto-resolved dataSource
    if (field.reviewRequired === true) {
      const isAutoResolved = AUTO_RESOLVED_KINDS.has(field.source ?? "");
      if (!isAutoResolved) {
        unresolvedReviewRequiredFields.push(`${code}: ${field.path} (source=${field.source ?? "unknown"})`);
      }
    }
  }
}

// --- Build issue list ---

if (humanReviewed < totalLocked) {
  issues.push(`human-reviewed: ${humanReviewed}/${totalLocked}`);
}
if (genericSlots > 0) {
  issues.push(`generic slots: ${genericSlots}`);
}
if (genericFields > 0) {
  issues.push(`generic fields: ${genericFields}`);
}
if (genericBindings > 0) {
  issues.push(`generic bindings: ${genericBindings}`);
}
if (blockingCount !== null && blockingCount > 0) {
  issues.push(`blocking verify issues: ${blockingCount}`);
}

// NEW: remediation is now a hard failure (not just informational)
if (remediationCount !== null && remediationCount > 0) {
  if (allowRemediation) {
    console.log(`  [INFO] ${remediationCount} remediation items present (--allow-remediation passed — non-blocking)`);
  } else {
    issues.push(`remediation verify issues: ${remediationCount} (pass --allow-remediation to acknowledge)`);
  }
}

if (unknownSourceFields.length > 0) {
  if (allowSourceUnknown) {
    console.log(`  [INFO] ${unknownSourceFields.length} source=unknown fields present (--allow-source-unknown passed — non-blocking)`);
  } else {
    issues.push(`source=unknown fields in locked contracts: ${unknownSourceFields.length}`);
    if (showRemediation) {
      console.log(`\n  source=unknown fields:`);
      for (const f of unknownSourceFields.slice(0, 20)) {
        console.log(`    - ${f}`);
      }
      if (unknownSourceFields.length > 20) {
        console.log(`    ... and ${unknownSourceFields.length - 20} more`);
      }
    }
  }
}

if (unresolvedReviewRequiredFields.length > 0) {
  if (allowUnresolvedReview) {
    console.log(`  [INFO] ${unresolvedReviewRequiredFields.length} unresolved reviewRequired=true fields present (--allow-unresolved-review passed — non-blocking)`);
  } else {
    issues.push(`unresolved reviewRequired=true fields: ${unresolvedReviewRequiredFields.length}`);
    if (showRemediation) {
      console.log(`\n  Unresolved reviewRequired fields (source not in ${[...AUTO_RESOLVED_KINDS].join(", ")}):`);
      for (const f of unresolvedReviewRequiredFields.slice(0, 20)) {
        console.log(`    - ${f}`);
      }
      if (unresolvedReviewRequiredFields.length > 20) {
        console.log(`    ... and ${unresolvedReviewRequiredFields.length - 20} more`);
      }
    }
  }
}

// --- Exit ---

if (issues.length > 0) {
  console.error(`\n[GATE FAILED]`);
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  if (!allowRemediation && remediationCount > 0) {
    console.error(`\n  To acknowledge remediation items (DOCX edits still needed), run:`);
    console.error(`    node scripts/docx-contract/gate-forms-213.cjs --allow-remediation`);
    console.error(`  NOTE: This should only be used after governance acceptance of the DOCX work.`);
  }
  process.exit(1);
}

const passed = `213/213 forms locked, human-reviewed, zero generic paths.`;
console.log(`\n[GATE PASSED] ${passed}`);
process.exit(0);
