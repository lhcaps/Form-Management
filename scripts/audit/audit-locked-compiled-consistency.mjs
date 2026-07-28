#!/usr/bin/env node
/**
 * C3 — Locked vs Compiled Consistency Gate
 *
 * Reads-only. Does NOT mutate any files.
 *
 * Purpose: Detect when compiled-v2 artifacts are stale vs their locked contract.
 * This is the gap that audit-contract-sync misses — it compares compiled-v2 ↔ DB,
 * but this gate compares compiled-v2 ↔ LOCKED contract directly.
 *
 * SOT Policy:
 * - locked contract JSON = semantic working SOT
 * - compiled-v2 = derived artifact, generated from locked by compile-contracts.ts
 * - compiled-v2 is stale when: hash mismatch OR binding references non-existent slots
 *
 * Exit codes:
 *   0 — consistency verified (stale/missing exist but --strict not set)
 *   1 — --strict and blocking issues detected
 *   2 — script error
 *
 * Usage:
 *   node scripts/audit/audit-locked-compiled-consistency.mjs
 *   node scripts/audit/audit-locked-compiled-consistency.mjs --strict
 *   node scripts/audit/audit-locked-compiled-consistency.mjs --bm=BM-063
 *   node scripts/audit/audit-locked-compiled-consistency.mjs --strict --json-only
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const COMPILED_V2_DIR = path.join(ROOT, "docs", "audit", "docx", "compiled-v2");
const OUTPUT_DIR = path.join(ROOT, "docs", "audit", "sot-gates-v1");

// ── Argument parsing ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const JSON_ONLY = args.includes("--json-only");
const BM_FILTER = (args.find((a) => a.startsWith("--bm=")) || "").replace("--bm=", "") || null;
const CUSTOM_OUTPUT = (args.find((a) => a.startsWith("--output=")) || "").replace("--output=", "") || null;

// Only write output file when not filtering (full run) or when an explicit --output is given.
// This prevents --bm= filtered runs from clobbering latest.json.
// Machine-readable invocations must be side-effect free: Node's test runner
// executes these probes concurrently, and writing shared latest.* evidence
// from --json-only races with the normal report-producing gate.
const WRITE_OUTPUT = (!BM_FILTER || CUSTOM_OUTPUT) && !STRICT && !JSON_ONLY;

// ── Stable hash of locked contract (V1 schema) ──────────────────────────────
function stableHashLocked(contract) {
  const compilationInputs = {
    templateCode: contract.templateCode,
    docxSlots: (contract.docxSlots || []).map((s) => ({
      slotId: s.slotId,
      label: s.label,
    })),
    canonicalFields: (contract.canonicalFields || []).map((f) => ({
      path: f.path,
      label: f.label,
      source: f.source,
    })),
    renderBindings: (contract.renderBindings || []).map((b) => ({
      slotId: b.slotId,
      from: b.from,
    })),
  };
  return createHash("sha256").update(JSON.stringify(compilationInputs)).digest("hex");
}

// ── Load all locked contracts ──────────────────────────────────────────────────
function loadLockedContracts() {
  const files = fs.readdirSync(LOCKED_DIR)
    .filter((f) => f.endsWith(".contract.locked.json"))
    .sort();
  const m = new Map();
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
      m.set(raw.templateCode, raw);
    } catch (e) {
      console.error(`[C3] Error reading locked contract ${file}: ${e.message}`);
    }
  }
  return m;
}

// ── Load all compiled artifacts ────────────────────────────────────────────────
function loadCompiledContracts() {
  if (!fs.existsSync(COMPILED_V2_DIR)) {
    return new Map();
  }
  const files = fs.readdirSync(COMPILED_V2_DIR)
    .filter((f) => f.endsWith(".compiled.json"))
    .sort();
  const m = new Map();
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(COMPILED_V2_DIR, file), "utf8"));
      const templateCode = file.replace(".compiled.json", "");
      m.set(templateCode, raw);
    } catch (e) {
      console.error(`[C3] Error reading compiled artifact ${file}: ${e.message}`);
    }
  }
  return m;
}

// ── Analyze one contract ──────────────────────────────────────────────────────
function analyze(templateCode, locked, compiled) {
  const issues = [];
  const warnings = [];

  if (!compiled) {
    issues.push({
      type: "MISSING_COMPILED",
      severity: "HIGH",
      message: `No compiled artifact for ${templateCode}`,
    });
    return { templateCode, status: "MISSING_COMPILED", issues, warnings };
  }

  // 1. Check if locked hash changed (stale detection via compilation inputs hash)
  const lockedHash = stableHashLocked(locked);
  const compiledSource = compiled.source || {};
  const compiledInputsHash = compiledSource.compilationInputsHash;

  if (compiledInputsHash && compiledInputsHash !== lockedHash) {
    issues.push({
      type: "STALE_CONTRACT_HASH",
      severity: "HIGH",
      message: `Locked contract hash changed since compilation (InputsHash=${compiledInputsHash?.slice(0, 8)}... → current=${lockedHash.slice(0, 8)}...)`,
      detail: {
        compiledInputsHash,
        currentInputsHash: lockedHash,
      },
    });
  }

  // 2. Check compiled renderPlan.bindings against locked docxSlots
  const compiledBindings = compiled.renderPlan?.bindings || [];
  const lockedSlotIds = new Set((locked.docxSlots || []).map((s) => s.slotId));
  const lockedFieldPaths = new Set((locked.canonicalFields || []).map((f) => f.path));

  for (const binding of compiledBindings) {
    const targetSlotId = binding.target?.slotId || binding.slotId;
    const sourceFieldKey = binding.source?.fieldKey || binding.from;

    if (targetSlotId && !lockedSlotIds.has(targetSlotId)) {
      issues.push({
        type: "ORPHAN_BINDING_TARGET",
        severity: "CRITICAL",
        message: `Compiled binding "${binding.id}" targets slot "${targetSlotId}" NOT in locked docxSlots`,
        detail: { bindingId: binding.id, targetSlotId, sourceFieldKey },
      });
    }

    if (sourceFieldKey && !lockedFieldPaths.has(sourceFieldKey)) {
      issues.push({
        type: "ORPHAN_BINDING_SOURCE",
        severity: "HIGH",
        message: `Compiled binding "${binding.id}" sources from field "${sourceFieldKey}" NOT in locked canonicalFields`,
        detail: { bindingId: binding.id, sourceFieldKey },
      });
    }
  }

  // 3. Check that all locked slots have a binding
  const boundSlotIds = new Set(compiledBindings.map((b) => b.target?.slotId || b.slotId));
  const unboundSlots = (locked.docxSlots || []).filter((s) => !boundSlotIds.has(s.slotId));
  if (unboundSlots.length > 0) {
    warnings.push({
      type: "UNBOUND_SLOTS",
      severity: "MEDIUM",
      message: `${unboundSlots.length} locked slot(s) have no compiled binding`,
      detail: { unboundSlots: unboundSlots.map((s) => s.slotId) },
    });
  }

  // 4. Check contractHash match (informational)
  const lockedContractHash = stableHashLocked(locked);
  const compiledContractHash = compiled.source?.contractHash;
  if (compiledContractHash && compiledContractHash !== lockedContractHash) {
    warnings.push({
      type: "CONTRACT_HASH_MISMATCH",
      severity: "LOW",
      message: `Contract hash mismatch (compiled=${compiledContractHash?.slice(0, 8)}... → current=${lockedContractHash.slice(0, 8)}...)`,
      detail: { compiledContractHash, currentContractHash: lockedContractHash },
    });
  }

  const status = issues.length > 0
    ? (issues.some((i) => i.severity === "CRITICAL") ? "CRITICAL" : "STALE")
    : "CONSISTENT";

  return { templateCode, status, issues, warnings, lockedHash: lockedContractHash.slice(0, 16) };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const log = (...msg) => {
    if (!JSON_ONLY) console.error(...msg);
  };

  log(`[C3] Locked vs Compiled Consistency Gate`);
  log(`[C3] STRICT=${STRICT} JSON_ONLY=${JSON_ONLY} BM_FILTER=${BM_FILTER || 'ALL'}`);
  log(`[C3] LOCKED_DIR=${LOCKED_DIR}`);
  log(`[C3] COMPILED_V2_DIR=${COMPILED_V2_DIR}`);

  const lockedContracts = loadLockedContracts();
  const compiledContracts = loadCompiledContracts();

  const results = [];

  // BM-level counts (one per BM regardless of issue count)
  let consistentBmCount = 0;
  let staleBmCount = 0;
  let missingCompiledBmCount = 0;
  let criticalBmCount = 0;

  // Issue-level counts (sum across all BMs)
  let criticalIssueCount = 0;
  let highIssueCount = 0;
  let mediumWarningCount = 0;
  let lowWarningCount = 0;

  const blockingIssues = [];
  const warningIssues = [];
  const affectedBms = [];

  const codes = BM_FILTER
    ? [BM_FILTER]
    : Array.from(lockedContracts.keys()).sort();

  for (const code of codes) {
    const locked = lockedContracts.get(code);
    const compiled = compiledContracts.get(code) || null;

    if (!locked && !compiled) {
      log(`[C3] WARNING: Neither locked nor compiled found for ${code}`);
      continue;
    }

    const result = analyze(code, locked || {}, compiled);
    results.push(result);

    if (result.status === "MISSING_COMPILED") {
      missingCompiledBmCount++;
    } else if (result.status === "CRITICAL") {
      criticalBmCount++;
    } else if (result.status === "STALE") {
      staleBmCount++;
    } else {
      consistentBmCount++;
    }

    for (const issue of result.issues) {
      if (issue.severity === "CRITICAL") criticalIssueCount++;
      else if (issue.severity === "HIGH") highIssueCount++;

      blockingIssues.push({
        templateCode: result.templateCode,
        status: result.status,
        ...issue,
      });
    }

    for (const warn of result.warnings) {
      if (warn.severity === "MEDIUM") mediumWarningCount++;
      else if (warn.severity === "LOW") lowWarningCount++;

      warningIssues.push({
        templateCode: result.templateCode,
        ...warn,
      });
    }

    if (result.status !== "CONSISTENT") {
      affectedBms.push({
        templateCode: result.templateCode,
        status: result.status,
        issueCount: result.issues.length,
        warningCount: result.warnings.length,
      });
    }
  }

  const summary = {
    total: results.length,
    consistentBmCount,
    staleBmCount,
    missingCompiledBmCount,
    criticalBmCount,
    criticalIssueCount,
    highIssueCount,
    mediumWarningCount,
    lowWarningCount,
    affectedBmCount: affectedBms.length,
    blockingIssuesCount: blockingIssues.length,
    warningIssuesCount: warningIssues.length,
  };

  log(`[C3] Summary: ${consistentBmCount}/${results.length} consistent`);
  if (staleBmCount > 0) log(`[C3]   BMs STALE: ${staleBmCount}`);
  if (missingCompiledBmCount > 0) log(`[C3]   BMs MISSING_COMPILED: ${missingCompiledBmCount}`);
  if (criticalBmCount > 0) log(`[C3]   BMs CRITICAL: ${criticalBmCount}`);
  if (criticalIssueCount > 0) log(`[C3]   CRITICAL issues: ${criticalIssueCount}`);
  if (highIssueCount > 0) log(`[C3]   HIGH issues: ${highIssueCount}`);

  // Show critical/stale details
  for (const r of results) {
    if (r.status === "CRITICAL" || r.status === "STALE" || r.status === "MISSING_COMPILED") {
      log(`\n[C3] ${r.templateCode}: ${r.status}`);
      for (const issue of r.issues) {
        log(`[C3]   [${issue.severity}] ${issue.type}: ${issue.message}`);
      }
      for (const warn of r.warnings) {
        log(`[C3]   [${warn.severity}-WARN] ${warn.type}: ${warn.message}`);
      }
    }
  }

  const outputData = {
    generated: new Date().toISOString(),
    gate: "C3_LOCKED_COMPILED_CONSISTENCY",
    strict: STRICT,
    jsonOnly: JSON_ONLY,
    bmFilter: BM_FILTER,
    summary,
    blockingIssues,
    warningIssues,
    affectedBms,
    results,
    policy: {
      lockedContract: "semantic working SOT",
      compiledV2: "derived artifact, NOT SOT",
      staleDefinition: "compiled artifact hash or bindings do not match locked contract",
    },
  };

  // Write output report (unless --strict --no-json)
  if (WRITE_OUTPUT) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const jsonPath = CUSTOM_OUTPUT
      ? path.resolve(CUSTOM_OUTPUT)
      : path.join(OUTPUT_DIR, "latest.json");
    const mdPath = CUSTOM_OUTPUT
      ? CUSTOM_OUTPUT.replace(/\.json$/, ".md")
      : path.join(OUTPUT_DIR, "latest.md");

    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(outputData, null, 2), "utf8");
    if (!JSON_ONLY) log(`[C3] Written: ${jsonPath}`);

    const md = buildMarkdown(outputData);
    fs.writeFileSync(mdPath, md, "utf8");
    if (!JSON_ONLY) log(`[C3] Written: ${mdPath}`);
  }

  // In JSON-only mode, also emit JSON to stdout
  if (JSON_ONLY) {
    process.stdout.write(JSON.stringify(outputData, null, 2));
  }

  // Exit code logic for --strict
  const hasBlocking = blockingIssues.length > 0;
  if (STRICT && hasBlocking) {
    log(`[C3] EXIT 1 — --strict and ${blockingIssues.length} blocking issue(s) detected`);
    process.exit(1);
  }
  log(`[C3] EXIT 0 — gate complete`);
  process.exit(0);
}

function buildMarkdown(data) {
  const s = data.summary;
  const lines = [
    "# C3 — Locked vs Compiled Consistency Gate",
    "",
    `**Generated:** ${data.generated}`,
    `**Strict:** ${data.strict}`,
    "",
    "## SOT Policy",
    "",
    "- **locked contract JSON** = semantic working SOT",
    "- **compiled-v2** = derived artifact, NOT SOT",
    "- **stale** = compiled artifact hash or bindings do not match locked contract",
    "",
    "## Summary",
    "",
    "### BM-level counts",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Total BMs checked | ${s.total} |`,
    `| BMs CONSISTENT | ${s.consistentBmCount} |`,
    `| BMs STALE | ${s.staleBmCount} |`,
    `| BMs MISSING_COMPILED | ${s.missingCompiledBmCount} |`,
    `| BMs CRITICAL | ${s.criticalBmCount} |`,
    "",
    "### Issue-level counts",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| CRITICAL issues | ${s.criticalIssueCount} |`,
    `| HIGH issues | ${s.highIssueCount} |`,
    `| MEDIUM warnings | ${s.mediumWarningCount} |`,
    `| LOW warnings | ${s.lowWarningCount} |`,
    "",
    `**Note:** BM-level and issue-level counts are separate. One BM may have multiple issues.`,
    "",
  ];

  // Blocking issues section
  if (data.blockingIssues.length > 0) {
    lines.push("## Blocking Issues", "");
    lines.push("| BM | Severity | Type | Detail |");
    lines.push("|---|----------|------|--------|");

    for (const issue of data.blockingIssues) {
      const detail = issue.detail
        ? JSON.stringify(issue.detail).slice(0, 60)
        : "—";
      lines.push(
        `| ${issue.templateCode} | ${issue.severity} | ${issue.type} | ${detail} |`,
      );
    }
    lines.push("");
  }

  // Warning issues section
  if (data.warningIssues.length > 0) {
    lines.push("## Warnings", "");
    lines.push("| BM | Severity | Type | Detail |");
    lines.push("|---|----------|------|--------|");

    for (const warn of data.warningIssues) {
      const detail = warn.detail
        ? JSON.stringify(warn.detail).slice(0, 60)
        : "—";
      lines.push(
        `| ${warn.templateCode} | ${warn.severity} | ${warn.type} | ${detail} |`,
      );
    }
    lines.push("");
  }

  if (data.affectedBms.length === 0) {
    lines.push("## Result");
    lines.push("");
    lines.push("All checked contracts are consistent.");
  }

  return lines.join("\n");
}

main().catch((e) => {
  console.error(`[C3] FATAL: ${e.message}`);
  process.exit(2);
});
