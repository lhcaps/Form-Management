#!/usr/bin/env node
/**
 * SOT_REBASE_V1 — Source of Truth Rebase Audit
 *
 * Reads-only. Does NOT mutate any files.
 *
 * Purpose: Rebase SOT trust policy after discovering:
 * - compiled-v2 is no longer trustworthy as SOT (BM-063/BM-066 stale bindings)
 * - Render Atlas proves runtime fidelity only, not semantic correctness
 * - Many locked contracts have evidence/label/rawPattern inconsistencies
 *
 * SOT Policy:
 * - normalized DOCX = structural/placeholder SOT (placeholder audit deferred to Phase 2)
 * - locked contract JSON = current semantic working SOT (semantic-suspect until audit passes)
 * - compiled-v2 = derived artifact, NOT SOT
 * - DB compiled_json = runtime published copy, NOT SOT
 *
 * Exit codes:
 *   0 — audit completed (issues flagged, no errors)
 *   1 — --strict and issues found
 *   2 — script error
 *
 * Usage:
 *   node scripts/audit/audit-sot-rebase-v1.mjs
 *   node scripts/audit/audit-sot-rebase-v1.mjs --strict
 *   node scripts/audit/audit-sot-rebase-v1.mjs --bm=BM-050
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const COMPILED_V2_DIR = path.join(ROOT, "docs", "audit", "docx", "compiled-v2");
const OUTPUT_DIR = path.join(ROOT, "docs", "audit", "sot-rebase-v1");

// ── Generic placeholder patterns ──────────────────────────────────────────────
const GENERIC_PATH_RE = /^(document|decision|person|agency|recipients|crimeReport)\.field\d+$/i;
const GENERIC_RAW_RE = /^\{\{(document|decision|person|agency|recipients|crimeReport)\.field\d+\}\}$/;

function isGenericPath(p) { return GENERIC_PATH_RE.test(p); }
function isGenericRaw(r) { return GENERIC_RAW_RE.test(r); }

// ── Argument parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const BM_FILTER = (args.find((a) => a.startsWith("--bm=")) || "").replace("--bm=", "") || null;

// ── Load contracts ──────────────────────────────────────────────────────────────
function loadLockedContracts() {
  const files = fs.readdirSync(LOCKED_DIR)
    .filter((f) => f.endsWith(".contract.locked.json")).sort();
  const m = new Map();
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
      m.set(raw.templateCode, raw);
    } catch {}
  }
  return m;
}

function loadCompiledContracts() {
  const files = fs.readdirSync(COMPILED_V2_DIR)
    .filter((f) => f.endsWith(".compiled.json")).sort();
  const m = new Map();
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(COMPILED_V2_DIR, file), "utf8"));
      m.set(file.replace(".compiled.json", ""), raw);
    } catch {}
  }
  return m;
}

// ── Analysis ──────────────────────────────────────────────────────────────────
function analyzeContract(templateCode, locked, compiled) {
  const issues = [];
  const flags = new Set();

  // 1. docxSlots: label "Ô trống" + reviewRequired=false
  for (const slot of (locked.docxSlots || [])) {
    if (slot.label === "Ô trống" && slot.reviewRequired === false) {
      issues.push({
        severity: "HIGH", type: "OTRONG_AUTOAPPROVED",
        field: "docxSlot", slotId: slot.slotId,
        label: slot.label, reviewRequired: slot.reviewRequired,
        reason: `docxSlot "${slot.slotId}" has label "Ô trống" with reviewRequired=false — was auto-approved without human review`,
      });
      flags.add("OTRONG_AUTOAPPROVED");
    }
  }

  // 2. canonicalFields: label "Ô trống" + reviewRequired=false
  for (const field of (locked.canonicalFields || [])) {
    if (field.label === "Ô trống" && field.reviewRequired === false) {
      issues.push({
        severity: "HIGH", type: "OTRONG_AUTOAPPROVED",
        field: "canonicalField", path: field.path,
        label: field.label, reviewRequired: field.reviewRequired,
        reason: `canonicalField "${field.path}" has label "Ô trống" with reviewRequired=false`,
      });
      flags.add("OTRONG_AUTOAPPROVED");
    }
  }

  // 3. docxSlots: rawPattern mismatch vs slotId
  for (const slot of (locked.docxSlots || [])) {
    const expected = `{{${slot.slotId}}}`;

    if (slot.evidence?.rawPattern && slot.evidence.rawPattern !== expected) {
      const generic = isGenericRaw(slot.evidence.rawPattern);
      issues.push({
        severity: generic ? "HIGH" : "MEDIUM",
        type: "RAW_PATTERN_MISMATCH",
        field: "docxSlot.evidence.rawPattern",
        slotId: slot.slotId, expected, actual: slot.evidence.rawPattern,
        generic,
        reason: `docxSlot "${slot.slotId}" evidence.rawPattern="${slot.evidence.rawPattern}" ≠ slotId (expected "${expected}")`,
      });
      flags.add(generic ? "RAW_PATTERN_MISMATCH_GENERIC" : "RAW_PATTERN_MISMATCH");
    }

    if (slot.reviewEvidence?.rawPattern && slot.reviewEvidence.rawPattern !== expected) {
      const generic = isGenericRaw(slot.reviewEvidence.rawPattern);
      issues.push({
        severity: generic ? "HIGH" : "MEDIUM",
        type: "RAW_PATTERN_MISMATCH",
        field: "docxSlot.reviewEvidence.rawPattern",
        slotId: slot.slotId, expected, actual: slot.reviewEvidence.rawPattern,
        generic,
        reason: `docxSlot "${slot.slotId}" reviewEvidence.rawPattern="${slot.reviewEvidence.rawPattern}" ≠ slotId (expected "${expected}")`,
      });
      flags.add(generic ? "RAW_PATTERN_MISMATCH_GENERIC" : "RAW_PATTERN_MISMATCH");
    }
  }

  // 4. canonicalFields: rawPattern mismatch vs path
  for (const field of (locked.canonicalFields || [])) {
    if (field.rawPattern) {
      const expected = `{{${field.path}}}`;
      if (field.rawPattern !== expected) {
        const generic = isGenericRaw(field.rawPattern);
        issues.push({
          severity: generic ? "HIGH" : "MEDIUM",
          type: "RAW_PATTERN_MISMATCH",
          field: "canonicalField.rawPattern",
          path: field.path, expected, actual: field.rawPattern,
          generic,
          reason: `canonicalField "${field.path}" rawPattern="${field.rawPattern}" ≠ path (expected "${expected}")`,
        });
        flags.add(generic ? "RAW_PATTERN_MISMATCH_GENERIC" : "RAW_PATTERN_MISMATCH");
      }
    }
  }

  // 5. auto-generated evidence with reviewRequired=false
  for (const slot of (locked.docxSlots || [])) {
    const ctx = slot.reviewEvidence?.context || slot.evidence?.context || "";
    if (ctx.includes("[Auto-generated]") && slot.reviewRequired === false) {
      issues.push({
        severity: "MEDIUM", type: "AUTO_GENERATED_AUTOAPPROVED",
        field: "docxSlot", slotId: slot.slotId,
        context: ctx.slice(0, 100),
        reason: `docxSlot "${slot.slotId}" has [Auto-generated] context with reviewRequired=false`,
      });
      flags.add("AUTO_GENERATED_AUTOAPPROVED");
    }
  }

  // 6. formInputHints stale generic paths
  const canonicalPaths = new Set((locked.canonicalFields || []).map((f) => f.path));
  for (const ctrl of (locked.formInputHints?.suggestedControls || [])) {
    if (!canonicalPaths.has(ctrl.path) && isGenericPath(ctrl.path)) {
      issues.push({
        severity: "MEDIUM", type: "FORM_INPUT_HINTS_STALE",
        field: "formInputHints.suggestedControls", path: ctrl.path, control: ctrl.control,
        reason: `formInputHints suggests "${ctrl.path}" not in canonicalFields — stale post-semanticization`,
      });
      flags.add("FORM_INPUT_HINTS_STALE");
    }
  }

  // 7. generic path leakage: canonicalFields, docxSlots, renderBindings
  for (const field of (locked.canonicalFields || [])) {
    if (isGenericPath(field.path)) {
      issues.push({ severity: "HIGH", type: "GENERIC_PATH_LEAKAGE", field: "canonicalField", path: field.path, reason: `canonicalField still has generic path "${field.path}"` });
      flags.add("GENERIC_PATH_LEAKAGE");
    }
  }
  for (const slot of (locked.docxSlots || [])) {
    if (isGenericPath(slot.slotId)) {
      issues.push({ severity: "HIGH", type: "GENERIC_PATH_LEAKAGE", field: "docxSlot", slotId: slot.slotId, reason: `docxSlot still has generic slotId "${slot.slotId}"` });
      flags.add("GENERIC_PATH_LEAKAGE");
    }
  }
  for (const binding of (locked.renderBindings || [])) {
    if (isGenericPath(binding.slotId)) {
      issues.push({ severity: "HIGH", type: "GENERIC_PATH_LEAKAGE", field: "renderBindings", slotId: binding.slotId, from: binding.from, reason: `renderBinding has generic slotId "${binding.slotId}"` });
      flags.add("GENERIC_PATH_LEAKAGE");
    }
    if (binding.from && isGenericPath(binding.from)) {
      issues.push({ severity: "HIGH", type: "GENERIC_PATH_LEAKAGE", field: "renderBindings", slotId: binding.slotId, from: binding.from, reason: `renderBinding "from" is generic path "${binding.from}"` });
      flags.add("GENERIC_PATH_LEAKAGE");
    }
  }

  // 8. compiled-v2 stale vs locked (BM-063/BM-066 style)
  if (compiled) {
    const lockedSlotIds = new Set((locked.docxSlots || []).map((s) => s.slotId));
    const lockedCanonicalPaths = new Set((locked.canonicalFields || []).map((f) => f.path));
    const bindings = compiled.renderPlan?.bindings || [];

    for (const binding of bindings) {
      const targetSlotId = binding.target?.slotId;
      const sourceFieldKey = binding.source?.fieldKey;

      if (targetSlotId && !lockedSlotIds.has(targetSlotId)) {
        issues.push({
          severity: "CRITICAL", type: "COMPILED_V2_STALE_VS_LOCKED",
          field: "compiled.renderPlan.bindings",
          bindingId: binding.id, targetSlotId, sourceFieldKey,
          reason: `compiled binding "${binding.id}" targets slot "${targetSlotId}" NOT in locked docxSlots — BM-063/BM-066 style stale`,
        });
        flags.add("COMPILED_V2_STALE_VS_LOCKED");
      }

      if (sourceFieldKey && !lockedCanonicalPaths.has(sourceFieldKey)) {
        issues.push({
          severity: "CRITICAL", type: "COMPILED_V2_STALE_VS_LOCKED",
          field: "compiled.renderPlan.bindings",
          bindingId: binding.id, targetSlotId, sourceFieldKey,
          reason: `compiled binding "${binding.id}" sources from "${sourceFieldKey}" NOT in locked canonicalFields`,
        });
        flags.add("COMPILED_V2_STALE_VS_LOCKED");
      }
    }
  }

  // ── Classification ────────────────────────────────────────────────────────
  let classification = "LOCKED_CONTRACT_STRUCTURALLY_MATCHED";

  if (flags.has("COMPILED_V2_STALE_VS_LOCKED")) {
    classification = "COMPILED_V2_STALE_VS_LOCKED";
  } else if (flags.has("GENERIC_PATH_LEAKAGE") || flags.has("RAW_PATTERN_MISMATCH_GENERIC")) {
    classification = "LOCKED_CONTRACT_EVIDENCE_INCONSISTENT";
  } else if (flags.has("FORM_INPUT_HINTS_STALE") || flags.has("OTRONG_AUTOAPPROVED") || flags.has("AUTO_GENERATED_AUTOAPPROVED")) {
    classification = "LOCKED_CONTRACT_EVIDENCE_INCONSISTENT";
  } else if (flags.has("RAW_PATTERN_MISMATCH")) {
    classification = "LOCKED_CONTRACT_EVIDENCE_INCONSISTENT";
  }

  return { templateCode, classification, flags: [...flags], issues };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  console.error("[SOT_REBASE_V1] Starting source-of-truth rebase audit...");
  console.error(`[SOT_REBASE_V1] Output: ${OUTPUT_DIR}`);
  if (BM_FILTER) console.error(`[SOT_REBASE_V1] BM filter: ${BM_FILTER}`);
  if (STRICT)    console.error("[SOT_REBASE_V1] Mode: STRICT");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const locked = loadLockedContracts();
  const compiled = loadCompiledContracts();
  console.error(`[SOT_REBASE_V1] Loaded ${locked.size} locked, ${compiled.size} compiled`);

  const results = [];
  const allIssues = [];
  const byClassification = {};
  const byType = {};

  const templates = BM_FILTER
    ? [[BM_FILTER, locked.get(BM_FILTER)]].filter(([, v]) => v)
    : [...locked.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [templateCode, contract] of templates) {
    const comp = compiled.get(templateCode) || null;
    const result = analyzeContract(templateCode, contract, comp);
    results.push(result);
    allIssues.push(...result.issues);
    byClassification[result.classification] = (byClassification[result.classification] || 0) + 1;
    for (const flag of result.flags) byType[flag] = (byType[flag] || 0) + 1;
  }

  // Severity buckets
  const critical = allIssues.filter((i) => i.severity === "CRITICAL");
  const high = allIssues.filter((i) => i.severity === "HIGH");
  const medium = allIssues.filter((i) => i.severity === "MEDIUM");

  // Top 30 by risk score
  const bmRisk = new Map();
  for (const r of results) {
    let score = 0;
    for (const i of r.issues) {
      if (i.severity === "CRITICAL") score += 10;
      else if (i.severity === "HIGH") score += 3;
      else score += 1;
    }
    if (score > 0) bmRisk.set(r.templateCode, {
      templateCode: r.templateCode, score, issueCount: r.issues.length,
      classification: r.classification,
    });
  }
  const topRisky = [...bmRisk.values()].sort((a, b) => b.score - a.score).slice(0, 30);

  // Specific subsets
  const oTrong = allIssues.filter((i) => i.type === "OTRONG_AUTOAPPROVED");
  const rawMismatch = allIssues.filter((i) => i.type === "RAW_PATTERN_MISMATCH");
  const hintsStale = allIssues.filter((i) => i.type === "FORM_INPUT_HINTS_STALE");
  const compiledStale = allIssues.filter((i) => i.type === "COMPILED_V2_STALE_VS_LOCKED");
  const genericLeak = allIssues.filter((i) => i.type === "GENERIC_PATH_LEAKAGE");
  const autoGen = allIssues.filter((i) => i.type === "AUTO_GENERATED_AUTOAPPROVED");

  // Per-BM CSV
  const csv = [
    "templateCode,classification,total,crt,hi,med,otrong,rawMismatch,hintsStale,compStale,genericLeak,autoGen",
  ];
  for (const r of results) {
    csv.push([
      r.templateCode, r.classification, r.issues.length,
      r.issues.filter((i) => i.severity === "CRITICAL").length,
      r.issues.filter((i) => i.severity === "HIGH").length,
      r.issues.filter((i) => i.severity === "MEDIUM").length,
      r.issues.filter((i) => i.type === "OTRONG_AUTOAPPROVED").length,
      r.issues.filter((i) => i.type === "RAW_PATTERN_MISMATCH").length,
      r.issues.filter((i) => i.type === "FORM_INPUT_HINTS_STALE").length,
      r.issues.filter((i) => i.type === "COMPILED_V2_STALE_VS_LOCKED").length,
      r.issues.filter((i) => i.type === "GENERIC_PATH_LEAKAGE").length,
      r.issues.filter((i) => i.type === "AUTO_GENERATED_AUTOAPPROVED").length,
    ].join(","));
  }

  const bm050 = results.find((r) => r.templateCode === "BM-050");

  // Write outputs
  const latestJson = {
    generated: new Date().toISOString(), totalBms: results.length,
    classificationCounts: byClassification, flagCounts: byType,
    issueCounts: { critical: critical.length, high: high.length, medium: medium.length, total: allIssues.length },
    specificCounts: {
      oTrongAutoApproved: oTrong.length, rawPatternMismatch: rawMismatch.length,
      formInputHintsStale: hintsStale.length, compiledV2Stale: compiledStale.length,
      genericPathLeakage: genericLeak.length, autoGeneratedAutoApproved: autoGen.length,
    },
    topRisky,
    blockersPreserved: results.filter((r) =>
      r.classification === "COMPILED_V2_STALE_VS_LOCKED" ||
      (r.classification === "LOCKED_CONTRACT_EVIDENCE_INCONSISTENT" && r.issues.some((i) => i.type === "GENERIC_PATH_LEAKAGE"))
    ).length,
  };

  write(path.join(OUTPUT_DIR, "latest.json"), latestJson);
  write(path.join(OUTPUT_DIR, "top-critical.latest.json"), { critical, high: high.slice(0, 50) });
  write(path.join(OUTPUT_DIR, "compiled-v2-stale.latest.json"), compiledStale);
  write(path.join(OUTPUT_DIR, "evidence-inconsistent.latest.json"), results.filter((r) => r.classification === "LOCKED_CONTRACT_EVIDENCE_INCONSISTENT"));
  write(path.join(OUTPUT_DIR, "otrong-autoapproved.latest.json"), oTrong);
  write(path.join(OUTPUT_DIR, "raw-pattern-mismatch.latest.json"), rawMismatch);
  write(path.join(OUTPUT_DIR, "generic-path-leakage.latest.json"), genericLeak);
  write(path.join(OUTPUT_DIR, "auto-generated-autoapproved.latest.json"), autoGen);
  write(path.join(OUTPUT_DIR, "form-input-hints-stale.latest.json"), hintsStale);

  if (bm050) {
    write(path.join(OUTPUT_DIR, "bm050-focus.latest.json"), bm050);
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "per-bm.csv"), csv.join("\n"), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "latest.md"), buildMd(results, byClassification, byType, topRisky, {
    critical, high, medium,
    oTrong, rawMismatch, hintsStale, compiledStale, genericLeak, autoGen,
  }), "utf8");

  if (bm050) {
    fs.writeFileSync(path.join(OUTPUT_DIR, "bm050-focus.latest.md"), buildBm050Md(bm050), "utf8");
  }

  console.error(`[SOT_REBASE_V1] Done. ${results.length} BMs, ${allIssues.length} issues`);
  console.error(`  CRITICAL:${critical.length}  HIGH:${high.length}  MEDIUM:${medium.length}`);
  console.error(`  O trong auto-approved:${oTrong.length}  rawPattern mismatch:${rawMismatch.length}  hintsStale:${hintsStale.length}`);
  console.error(`  compiled-v2 stale:${compiledStale.length}  genericLeak:${genericLeak.length}  autoGen:${autoGen.length}`);
  console.error(`  Top risky: ${topRisky.slice(0, 5).map((r) => r.templateCode).join(", ")}`);

  if (STRICT && allIssues.length > 0) process.exit(1);
  process.exit(0);
}

function write(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  console.error(`[SOT_REBASE_V1] Written: ${p}`);
}

function buildMd(results, byClassification, byType, topRisky, s) {
  return [
    "# SOT_REBASE_V1 — Source of Truth Rebase Audit",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    "",
    "## SOT Policy",
    "",
    "- **normalized DOCX** = structural/placeholder SOT",
    "- **locked contract JSON** = current semantic working SOT (semantic-suspect until audit passes)",
    "- **compiled-v2** = derived artifact, NOT SOT",
    "- **DB compiled_json** = runtime published copy, NOT SOT",
    "",
    "## Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total BMs | ${results.length} |`,
    `| Total issues | ${s.critical.length + s.high.length + s.medium.length} |`,
    `| CRITICAL | ${s.critical.length} |`,
    `| HIGH | ${s.high.length} |`,
    `| MEDIUM | ${s.medium.length} |`,
    "",
    "## Specific Issue Counts",
    "",
    `| Issue | Count | Severity |`,
    `|-------|-------|----------|`,
    `| Ô trống auto-approved | ${s.oTrong.length} | HIGH |`,
    `| rawPattern mismatch | ${s.rawMismatch.length} | HIGH/MEDIUM |`,
    `| formInputHints stale | ${s.hintsStale.length} | HIGH |`,
    `| compiled-v2 stale vs locked | ${s.compiledStale.length} | CRITICAL |`,
    `| generic path leakage | ${s.genericLeak.length} | HIGH |`,
    `| auto-generated auto-approved | ${s.autoGen.length} | MEDIUM |`,
    "",
    "## By Classification",
    "",
    `| Classification | BMs |`,
    `|----------------|-----|`,
    ...Object.entries(byClassification).map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Top 30 Riskiest BMs",
    "",
    `| Rank | BM | Score | Issues | Classification |`,
    `|------|----|-------|--------|----------------|`,
    ...topRisky.map((r, i) => `| ${i+1} | ${r.templateCode} | ${r.score} | ${r.issueCount} | ${r.classification} |`),
    "",
    "## CRITICAL: compiled-v2 Stale vs Locked",
    "",
    `⚠️ **BM-063/BM-066 style stale bindings detected: ${s.compiledStale.length}**`,
    "",
    `Render Atlas PASS and DB sync PASS prove runtime fidelity only — they do NOT validate semantic correctness.`,
    "",
    ...(s.compiledStale.length > 0 ? [
      "| BM | binding | targetSlotId | reason |",
      "|---|--------|-------------|--------|",
      ...s.compiledStale.map((i) => `| ${i.bindingId} | ${i.targetSlotId} | ${i.reason.slice(0, 80)} |`),
    ] : []),
    "",
    "## HIGH: Ô trống Auto-Approved",
    "",
    `${s.oTrong.length} docxSlots/canonicalFields with label "Ô trống" and reviewRequired=false.`,
    "These were auto-approved without human review evidence.",
    "",
    ...(s.oTrong.length > 0 ? [
      "| BM | field | path/slotId | label |",
      "|---|------|------------|-------|",
      ...s.oTrong.slice(0, 30).map((i) => `| ${i.slotId || i.path} | ${i.field} | ${i.slotId || i.path} | ${i.label} |`),
    ] : []),
    "",
    "## HIGH: Generic Path Leakage",
    "",
    `${s.genericLeak.length} fields still use generic paths (document.fieldN, decision.fieldN, etc.).`,
    "These should be semanticized but were auto-approved.",
    "",
    ...(s.genericLeak.length > 0 ? [
      "| BM | field | path |",
      "|---|------|-----|",
      ...s.genericLeak.slice(0, 30).map((i) => `| ${i.templateCode || ""} | ${i.field} | ${i.path || i.slotId || i.slotId} |`),
    ] : []),
    "",
    "## HIGH: rawPattern Mismatch",
    "",
    `${s.rawMismatch.length} fields have evidence.rawPattern that does not match their slotId/path.`,
    "",
    ...(s.rawMismatch.length > 0 ? [
      "| BM | field | expected | actual |",
      "|---|------|---------|--------|",
      ...s.rawMismatch.slice(0, 20).map((i) => `| ${i.templateCode || ""} | ${i.field} | ${i.expected} | ${i.actual} |`),
    ] : []),
    "",
    "## Notes",
    "",
    "- Render Atlas PASS = runtime render fidelity only, NOT semantic correctness.",
    "- DB sync PASS = compiled-v2 matches DB, NOT that compiled-v2 matches locked.",
    "- This audit determines SOT trust and semantic/evidence consistency.",
    "",
  ].join("\n");
}

function buildBm050Md(bm050) {
  return [
    "# BM-050 Focus Analysis",
    "",
    `**Template Code:** ${bm050.templateCode}`,
    `**Classification:** ${bm050.classification}`,
    `**Issues:** ${bm050.issues.length}`,
    "",
    "## Issues",
    "",
    ...bm050.issues.map((i) => [
      `### [${i.severity}] ${i.type} — ${i.field}`,
      "",
      i.slotId ? `- **slotId:** ${i.slotId}` : "",
      i.path ? `- **path:** ${i.path}` : "",
      i.label ? `- **label:** ${i.label}` : "",
      i.expected ? `- **expected:** ${i.expected}` : "",
      i.actual ? `- **actual:** ${i.actual}` : "",
      i.control ? `- **control:** ${i.control}` : "",
      i.reason ? `- **reason:** ${i.reason}` : "",
      "",
    ].filter(Boolean).join("\n")),
  ].join("\n");
}

main().catch((err) => {
  console.error(`[SOT_REBASE_V1] ERROR: ${err.message}`);
  console.error(err.stack);
  process.exit(2);
});
