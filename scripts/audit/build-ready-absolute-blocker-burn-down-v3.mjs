/**
 * Phase 1 — Unified Blocker Classifier
 *
 * Inputs:
 *   - docs/audit/sample-data-coverage-v1/latest.json
 *   - docs/audit/213-docx-fidelity-board/latest.json
 *   - docs/audit/sot-rebase-v1/latest.json
 *   - docs/audit/website-requirement-acceptance-v1/latest.json
 *
 * Output:
 *   - docs/audit/ready-absolute-blocker-burn-down-v3/blockers.latest.json
 *   - docs/audit/ready-absolute-blocker-burn-down-v3/blockers.latest.md
 *   - docs/audit/ready-absolute-blocker-burn-down-v3/per-form.csv
 *
 * Schema per row:
 * {
 *   blockerId: string,
 *   templateCode: string | null,
 *   category: "SAMPLE_DATA" | "DOCX_SEMANTIC_FIDELITY" | "SOT_SEMANTIC" | "WORKFLOW" | "FORMAT_VISUAL" | "REPORT_EXPORT" | "UNKNOWN",
 *   severity: "P0" | "P1" | "P2",
 *   currentStatus: "FAIL" | "PARTIAL" | "REVIEW" | "BLOCKED" | "NOT_DETECTABLE",
 *   sourceArtifact: string,
 *   sourceLineOrKey?: string,
 *   rootCause: string,
 *   lane: "RENDER_FAILURE" | "CONTRACT_REPAIR_REQUIRED" | "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT" | "RAW_PATTERN_DOMAIN_MISMATCH" | "SOURCE_MISMATCH" | "BAD_LABEL" | "GENERIC_LABEL" | "MISSING_SAMPLE" | "PARTIAL_SAMPLE" | "SILENT_BLANK" | "HUMAN_LEGAL_REVIEW" | "VISUAL_ONLY" | "UNKNOWN",
 *   safeToAutoFix: boolean,
 *   requiresHumanLegalReview: boolean,
 *   proposedAction: string,
 *   touchedFilesExpected: string[]
 * }
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const ROOT = join(SCRIPT_DIR, "..", "..");
const OUT_DIR = join(ROOT, "docs", "audit", "ready-absolute-blocker-burn-down-v3");

function readJson(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), "utf-8"));
}

function ensureOutDir() {
  mkdirSync(OUT_DIR, { recursive: true });
}

function pad(n, w = 3) {
  return String(n).padStart(w, "0");
}

// ─── Load input artifacts ─────────────────────────────────────────────────────

const sampleCoverage = readJson("docs/audit/sample-data-coverage-v1/latest.json");
const fidelityBoard = readJson("docs/audit/213-docx-fidelity-board/latest.json");
const sotRebase = readJson("docs/audit/sot-rebase-v1/latest.json");
const acceptance = readJson("docs/audit/website-requirement-acceptance-v1/latest.json");

// fidelity-board JSON is too large; read the markdown for summary
const fidelityMd = readFileSync(join(ROOT, "docs/audit/213-docx-fidelity-board/latest.md"), "utf-8");

// The fidelity board JSON has nextCandidates (top ~23) + per-BM rows at end
// We process nextCandidates for top forms, and nextCandidates for CONTRACT_REPAIR
const nextCandidates = fidelityBoard.nextCandidates || [];
const fidelityRows = fidelityBoard.rows || [];
const laneCounts = fidelityBoard.summary?.laneCounts || {};
const renderEvidence = fidelityBoard.summary?.renderEvidence || {};
const baseline = fidelityBoard.summary?.baseline || {};
const rootCauseSummary = fidelityBoard.summary?.rootCause || {};
const notFinalRows = fidelityRows.filter(
  (row) => row.completionStatus !== "READY_FOR_FINAL_REVIEW",
);
const renderFailureRows = fidelityRows.filter(
  (row) => row.renderEvidence?.clean !== true,
);

const blockers = [];
let blockerId = 1;

// ─── 1. SAMPLE-DATA-FULL-FILL blockers ─────────────────────────────────────────

// Compute partial forms count from forms array
const partialFormsCount = (sampleCoverage.forms || []).filter(f => f.coverage > 0 && f.coverage < 100).length;
const sampleSummary = sampleCoverage.summary || {};
const sampleIncomplete =
  (sampleSummary.totalFilledFields || 0) < (sampleSummary.totalManualFields || 0) ||
  partialFormsCount > 0;

// Global summary blocker
if (sampleIncomplete) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: null,
    category: "SAMPLE_DATA",
    severity: "P0",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/sample-data-coverage-v1/latest.json",
    sourceLineOrKey: "summary",
    rootCause: `${sampleSummary.totalFilledFields}/${sampleSummary.totalManualFields} manual fields filled. ${partialFormsCount} forms partially covered.`,
    lane: "PARTIAL_SAMPLE",
    safeToAutoFix: false,
    requiresHumanLegalReview: false,
    proposedAction: "Extend domain dictionaries in sample-generator.ts / sample-data.ts to cover missing field patterns. Add explicit registry entries for forms with complex fields.",
    touchedFilesExpected: [
      "apps/web/src/features/forms-contracts/sample-data.ts",
      "apps/web/src/features/forms-contracts/sample-generator.ts"
    ]
  });
}

// Per-form partial coverage
for (const form of sampleCoverage.forms) {
  if (form.manualFields === 0) continue; // skip zero-coverage (expected)

  const gap = form.manualFields - form.filled;
  if (gap === 0) continue; // fully covered

  const severity = gap >= 10 ? "P0" : gap >= 5 ? "P1" : "P2";

  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: form.templateCode,
    category: "SAMPLE_DATA",
    severity,
    currentStatus: form.coverage === 0 ? "FAIL" : "PARTIAL",
    sourceArtifact: "docs/audit/sample-data-coverage-v1/latest.json",
    sourceLineOrKey: form.templateCode,
    rootCause: `${form.filled}/${form.manualFields} manual fields filled (${form.coverage}% coverage). ${gap} fields missing sample values.`,
    lane: gap >= 10 ? "MISSING_SAMPLE" : "PARTIAL_SAMPLE",
    safeToAutoFix: true,
    requiresHumanLegalReview: false,
    proposedAction: `Extend domain dictionaries with field patterns present in ${form.templateCode}. Check field labels/paths and add to ALL_DEFAULTS or generateFieldValue heuristics.`,
    touchedFilesExpected: [
      "apps/web/src/features/forms-contracts/sample-data.ts",
      "apps/web/src/features/forms-contracts/sample-generator.ts"
    ]
  });
}

// ─── 2. DOCX-SEMANTIC-FIDELITY blockers ───────────────────────────────────────

// Global summary
const hasDocxSemanticBlockers =
  notFinalRows.length > 0 ||
  (rootCauseSummary.totalIssues || 0) > 0 ||
  (baseline.contractRepairRequired || 0) > 0 ||
  renderFailureRows.length > 0;
if (hasDocxSemanticBlockers) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: null,
    category: "DOCX_SEMANTIC_FIDELITY",
    severity: "P0",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/213-docx-fidelity-board/latest.json",
    sourceLineOrKey: "summary",
    rootCause: `${notFinalRows.length} forms not final-review-ready. ${rootCauseSummary.totalIssues || 0} root-cause issues. ${baseline.contractRepairRequired || 0} contract repairs required. ${renderFailureRows.length} render failures (render evidence clean: ${renderEvidence.clean || 0}/${renderEvidence.available || 0}).`,
    lane: "CONTRACT_REPAIR_REQUIRED",
    safeToAutoFix: false,
    requiresHumanLegalReview: false,
    proposedAction: "Phase 3: Fix render failures first, then contract repairs, then remaining forms by lane.",
    touchedFilesExpected: []
  });
}

// CONTRACT_REPAIR lane from nextCandidates
const contractRepairBms = nextCandidates.filter(row => row.primaryLane === "CONTRACT_REPAIR");
for (const row of contractRepairBms) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: row.templateCode,
    category: "DOCX_SEMANTIC_FIDELITY",
    severity: "P0",
    currentStatus: "BLOCKED",
    sourceArtifact: "docs/audit/213-docx-fidelity-board/latest.json",
    sourceLineOrKey: row.templateCode,
    rootCause: `CONTRACT_REPAIR lane. ${row.issueCount} issues. Findings: ${(row.baselineFindings || []).join(", ") || "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT or REVIEW_REQUIRED_REMAINS"}.`,
    lane: (row.baselineFindings || []).includes("TEMPLATE_PLACEHOLDER_WITHOUT_SLOT") ? "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT" : "CONTRACT_REPAIR_REQUIRED",
    safeToAutoFix: false,
    requiresHumanLegalReview: true,
    proposedAction: `Inspect locked contract for ${row.templateCode}. Compare normalized DOCX token context with contract slots. Repair template placeholder / slot / binding mismatches. Do NOT hand-edit compiled-v2.`,
    touchedFilesExpected: [
      `docs/audit/docx/contracts/locked/${row.templateCode}.json`,
      `docs/audit/docx/compiled-v2/${row.templateCode}.json`
    ]
  });
}

// LEGAL_REVIEW lane from nextCandidates
const legalReviewBms = nextCandidates.filter(row => row.primaryLane === "LEGAL_REVIEW");
for (const row of legalReviewBms) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: row.templateCode,
    category: "DOCX_SEMANTIC_FIDELITY",
    severity: "P1",
    currentStatus: "REVIEW",
    sourceArtifact: "docs/audit/213-docx-fidelity-board/latest.json",
    sourceLineOrKey: row.templateCode,
    rootCause: `LEGAL_REVIEW lane. ${row.issueCount} issues. Human DOCX/legal review required.`,
    lane: "HUMAN_LEGAL_REVIEW",
    safeToAutoFix: false,
    requiresHumanLegalReview: true,
    proposedAction: `Human legal review required for ${row.templateCode}. Field roles, antecedent references, and ambiguous labels need legal expert judgment.`,
    touchedFilesExpected: [
      `docs/audit/docx/contracts/locked/${row.templateCode}.json`
    ]
  });
}

// HIGH risk + high issue count from nextCandidates
const highRiskBms = nextCandidates.filter(row => row.risk === "HIGH" && row.issueCount >= 15);
for (const row of highRiskBms) {
  const lane = row.primaryLane || "UNKNOWN";
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: row.templateCode,
    category: "DOCX_SEMANTIC_FIDELITY",
    severity: lane === "SOURCE_POLICY" ? "P1" : lane === "PATH_DOMAIN_BINDING" ? "P1" : "P2",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/213-docx-fidelity-board/latest.json",
    sourceLineOrKey: row.templateCode,
    rootCause: `${lane} lane. HIGH risk. ${row.issueCount} issues. ${row.nextAction || ""}`,
    lane: lane === "SOURCE_POLICY" ? "SOURCE_MISMATCH" : lane === "PATH_DOMAIN_BINDING" ? "RAW_PATTERN_DOMAIN_MISMATCH" : "UNKNOWN",
    safeToAutoFix: false,
    requiresHumanLegalReview: false,
    proposedAction: `${row.nextAction || "Fix by lane."}`,
    touchedFilesExpected: [
      `docs/audit/docx/contracts/locked/${row.templateCode}.json`,
      `docs/audit/docx/compiled-v2/${row.templateCode}.json`
    ]
  });
}

// ─── 3. SOT-SEMANTIC-ISSUES blockers ──────────────────────────────────────────

// CRITICAL issues
const criticalIssues = sotRebase.issueCounts?.critical || 0;
if (criticalIssues > 0) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: null,
    category: "SOT_SEMANTIC",
    severity: "P0",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/sot-rebase-v1/latest.json",
    sourceLineOrKey: "issueCounts.critical",
    rootCause: `${criticalIssues} CRITICAL SOT issues. Compiled-v2 stale vs locked bindings detected. Render atlas PASS and DB sync PASS do NOT validate semantic correctness.`,
    lane: "SOURCE_MISMATCH",
    safeToAutoFix: false,
    requiresHumanLegalReview: false,
    proposedAction: "Phase 4: Fix critical issues first. Regenerate compiled-v2 using official script. Do not hand-edit compiled-v2.",
    touchedFilesExpected: []
  });

  // Per-critical item
  if (sotRebase.specificCounts?.compiledV2Stale > 0) {
    // These come from the SOT rebase data
    const staleBindings = sotRebase.topRisky?.filter(r => r.score > 200) || [];
    for (const bm of staleBindings.slice(0, 5)) {
      blockers.push({
        blockerId: `BLK-${pad(blockerId++)}`,
        templateCode: bm.templateCode,
        category: "SOT_SEMANTIC",
        severity: "P0",
        currentStatus: "FAIL",
        sourceArtifact: "docs/audit/sot-rebase-v1/latest.json",
        sourceLineOrKey: `topRisky:${bm.templateCode}`,
        rootCause: `CRITICAL: High SOT risk score (${bm.score}) with ${bm.issueCount} issues. Classification: ${bm.classification}.`,
        lane: "SOURCE_MISMATCH",
        safeToAutoFix: false,
        requiresHumanLegalReview: false,
        proposedAction: `Inspect ${bm.templateCode} locked contract and compiled-v2. Regenerate compiled artifact. Verify binding targets match locked slots.`,
        touchedFilesExpected: [
          `docs/audit/docx/contracts/locked/${bm.templateCode}.json`,
          `docs/audit/docx/compiled-v2/${bm.templateCode}.json`
        ]
      });
    }
  }
}

// HIGH issues — oTrongAutoApproved
const otrongCount = sotRebase.specificCounts?.oTrongAutoApproved || 0;
if (otrongCount > 0) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: null,
    category: "SOT_SEMANTIC",
    severity: "P1",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/sot-rebase-v1/latest.json",
    sourceLineOrKey: "specificCounts.oTrongAutoApproved",
    rootCause: `${otrongCount} docxSlots/canonicalFields have label "Ô trống" and reviewRequired=false. Auto-approved without human review evidence.`,
    lane: "GENERIC_LABEL",
    safeToAutoFix: false,
    requiresHumanLegalReview: true,
    proposedAction: "Phase 4: Review each Ô trống field. Either replace with proper Vietnamese label (if DOCX context is clear) or mark as requiring human legal review.",
    touchedFilesExpected: []
  });
}

// HIGH issues — rawPattern mismatch
const rawPatternCount = sotRebase.specificCounts?.rawPatternMismatch || 0;
if (rawPatternCount > 0) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: null,
    category: "SOT_SEMANTIC",
    severity: "P1",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/sot-rebase-v1/latest.json",
    sourceLineOrKey: "specificCounts.rawPatternMismatch",
    rootCause: `${rawPatternCount} fields have evidence.rawPattern that does not match their slotId/path.`,
    lane: "RAW_PATTERN_DOMAIN_MISMATCH",
    safeToAutoFix: false,
    requiresHumanLegalReview: false,
    proposedAction: "Phase 4: Fix rawPattern to match slotId/path for each affected field. Auto-fix when mismatch is obvious.",
    touchedFilesExpected: []
  });
}

// HIGH issues — formInputHints stale
const hintsStaleCount = sotRebase.specificCounts?.formInputHintsStale || 0;
if (hintsStaleCount > 0) {
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: null,
    category: "SOT_SEMANTIC",
    severity: "P1",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/sot-rebase-v1/latest.json",
    sourceLineOrKey: "specificCounts.formInputHintsStale",
    rootCause: `${hintsStaleCount} fields have stale formInputHints referencing paths not in locked contract.`,
    lane: "SOURCE_MISMATCH",
    safeToAutoFix: true,
    requiresHumanLegalReview: false,
    proposedAction: "Phase 4: Regenerate formInputHints from current locked contract field paths.",
    touchedFilesExpected: []
  });
}

// Per-BM high-issue forms (top 20 by score)
const topRisky = sotRebase.topRisky || [];
for (const bm of topRisky.slice(0, 20)) {
  if (bm.score < 100) continue;
  blockers.push({
    blockerId: `BLK-${pad(blockerId++)}`,
    templateCode: bm.templateCode,
    category: "SOT_SEMANTIC",
    severity: "P1",
    currentStatus: "FAIL",
    sourceArtifact: "docs/audit/sot-rebase-v1/latest.json",
    sourceLineOrKey: `topRisky:${bm.templateCode}`,
    rootCause: `High SOT risk score (${bm.score}) with ${bm.issueCount} issues. Classification: ${bm.classification}.`,
    lane: "UNKNOWN",
    safeToAutoFix: false,
    requiresHumanLegalReview: false,
    proposedAction: `Phase 4: Prioritize ${bm.templateCode}. Fix auto-fixable lanes first (SOURCE_MISMATCH, RAW_PATTERN_DOMAIN_MISMATCH). Escalate legal ambiguous lanes.`,
    touchedFilesExpected: [
      `docs/audit/docx/contracts/locked/${bm.templateCode}.json`,
      `docs/audit/docx/compiled-v2/${bm.templateCode}.json`
    ]
  });
}

// ─── 4. Website Acceptance Gate failures ──────────────────────────────────────

for (const check of acceptance.checks) {
  if (check.status === "FAIL" && check.group === "ACCEPTANCE") {
    blockers.push({
      blockerId: `BLK-${pad(blockerId++)}`,
      templateCode: null,
      category: check.id === "SAMPLE-DATA-FULL-FILL" ? "SAMPLE_DATA"
           : check.id === "DOCX-SEMANTIC-FIDELITY" ? "DOCX_SEMANTIC_FIDELITY"
           : check.id === "SOT-SEMANTIC-ISSUES" ? "SOT_SEMANTIC"
           : "UNKNOWN",
      severity: "P0",
      currentStatus: "FAIL",
      sourceArtifact: "docs/audit/website-requirement-acceptance-v1/latest.json",
      sourceLineOrKey: check.id,
      rootCause: check.notes || "Acceptance gate failed.",
      lane: "UNKNOWN",
      safeToAutoFix: false,
      requiresHumanLegalReview: false,
      proposedAction: `Resolve underlying blockers for ${check.id} before this gate can pass.`,
      touchedFilesExpected: []
    });
  }
}

// ─── Summary counts ────────────────────────────────────────────────────────────

const byCategory = blockers.reduce((acc, b) => {
  acc[b.category] = acc[b.category] || [];
  acc[b.category].push(b);
  return acc;
}, {});

const bySeverity = blockers.reduce((acc, b) => {
  acc[b.severity] = acc[b.severity] || [];
  acc[b.severity].push(b);
  return acc;
}, {});

const summary = {
  totalBlockers: blockers.length,
  byCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length])),
  bySeverity: Object.fromEntries(Object.entries(bySeverity).map(([k, v]) => [k, v.length])),
  autoFixable: blockers.filter(b => b.safeToAutoFix && !b.requiresHumanLegalReview).length,
  requiresHumanReview: blockers.filter(b => b.requiresHumanLegalReview).length,
  blocked: blockers.filter(b => b.currentStatus === "BLOCKED").length,
  // Align with baseline
  sampleData: {
    manualFieldsTotal: sampleSummary.totalManualFields || 0,
    manualFieldsFilled: sampleSummary.totalFilledFields || 0,
    coverage: sampleSummary.overallCoverage || 0,
    partialForms: sampleSummary.partiallyCovered ?? partialFormsCount,
    zeroForms: sampleSummary.zeroCoverage || 0
  },
  docxFidelity: {
    contractRepairRequired: laneCounts["CONTRACT_REPAIR"] || baseline.contractRepairRequired || 0,
    renderFailures: renderFailureRows.length,
    notFinalReviewReady: notFinalRows.length,
    readyForFinalReview: fidelityRows.length - notFinalRows.length,
    rootCauseIssues: rootCauseSummary.totalIssues || 0,
    rootCauseFailCount: rootCauseSummary.failCount || 0,
    rootCauseReviewCount: rootCauseSummary.reviewCount || 0
  },
  sotSemantic: {
    total: sotRebase.issueCounts?.total || 0,
    critical: sotRebase.issueCounts?.critical || 0,
    high: sotRebase.issueCounts?.high || 0,
    medium: sotRebase.issueCounts?.medium || 0
  }
};

// ─── Write outputs ─────────────────────────────────────────────────────────────

ensureOutDir();

// JSON
writeFileSync(
  join(OUT_DIR, "blockers.latest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), summary, blockers }, null, 2),
  "utf-8"
);

// Markdown
const lines = [
  "# READY_ABSOLUTE_BLOCKER_BURN_DOWN_V3 — Blockers",
  "",
  `**Generated:** ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `| Metric | Value |`,
  `|--------|-------|`,
  `| Total blockers | ${summary.totalBlockers} |`,
  `| Auto-fixable | ${summary.autoFixable} |`,
  `| Requires human review | ${summary.requiresHumanReview} |`,
  `| BLOCKED status | ${summary.blocked} |`,
  "",
  "### By Category",
  "",
  `| Category | Count |`,
  `|---------|-------|`,
  ...Object.entries(summary.byCategory).map(([k, v]) => `| ${k} | ${v} |`),
  "",
  "### By Severity",
  "",
  `| Severity | Count |`,
  `|----------|-------|`,
  ...Object.entries(summary.bySeverity).map(([k, v]) => `| ${k} | ${v} |`),
  "",
  "### Blocker Alignment with Baseline",
  "",
  `| Blocker | Baseline | Current |`,
  `|---------|----------|---------|`,
  `| SAMPLE-DATA | 1576/1735 (91%) | ${summary.sampleData.manualFieldsFilled}/${summary.sampleData.manualFieldsTotal} (${summary.sampleData.coverage}%) |`,
  `| DOCX-FIDELITY | 22 repair + 2 render fail | ${summary.docxFidelity.contractRepairRequired} repair + ${summary.docxFidelity.renderFailures} render fail |`,
  `| SOT-SEMANTIC | 4500 total / 3 crit / 2734 high | ${summary.sotSemantic.total} total / ${summary.sotSemantic.critical} crit / ${summary.sotSemantic.high} high |`,
  "",
  "## Blocker Table",
  "",
  `| ID | BM | Category | Severity | Status | Lane | AutoFix | HumanReview |`,
  `|----|----|----------|----------|--------|------|---------|-------------|`,
  ...blockers.map(b => [
    b.blockerId,
    b.templateCode || "—",
    b.category,
    b.severity,
    b.currentStatus,
    b.lane,
    b.safeToAutoFix ? "YES" : "NO",
    b.requiresHumanLegalReview ? "YES" : "NO"
  ].map(v => `| ${v}`).join("").replace(/^\|/, "|")),
  "",
  "## Detail by Category",
  ""
];

for (const [cat, catBlockers] of Object.entries(byCategory)) {
  lines.push(`### ${cat}`);
  lines.push("");
  for (const b of catBlockers) {
    lines.push(`**${b.blockerId}** — ${b.templateCode || "(global)"}`);
    lines.push(`- Severity: ${b.severity} | Status: ${b.currentStatus} | Lane: ${b.lane}`);
    lines.push(`- Root cause: ${b.rootCause}`);
    lines.push(`- Auto-fix: ${b.safeToAutoFix ? "YES" : "NO"} | Human review: ${b.requiresHumanLegalReview ? "YES" : "NO"}`);
    lines.push(`- Action: ${b.proposedAction}`);
    if (b.touchedFilesExpected.length > 0) {
      lines.push(`- Files: ${b.touchedFilesExpected.join(", ")}`);
    }
    lines.push("");
  }
}

writeFileSync(join(OUT_DIR, "blockers.latest.md"), lines.join("\n"), "utf-8");

// CSV
const csvLines = [
  "blockerId,templateCode,category,severity,currentStatus,rootCause,lane,safeToAutoFix,requiresHumanLegalReview,proposedAction"
];
for (const b of blockers) {
  csvLines.push([
    b.blockerId,
    b.templateCode || "",
    b.category,
    b.severity,
    b.currentStatus,
    `"${(b.rootCause || "").replace(/"/g, '""')}"`,
    b.lane,
    b.safeToAutoFix ? "YES" : "NO",
    b.requiresHumanLegalReview ? "YES" : "NO",
    `"${(b.proposedAction || "").replace(/"/g, '""')}"`
  ].join(","));
}
writeFileSync(join(OUT_DIR, "per-form.csv"), csvLines.join("\n"), "utf-8");

console.log("Blocker classifier complete.");
console.log(`Total blockers: ${blockers.length}`);
console.log(`Auto-fixable: ${summary.autoFixable}`);
console.log(`Requires human review: ${summary.requiresHumanReview}`);
console.log(`Output: ${OUT_DIR}`);
