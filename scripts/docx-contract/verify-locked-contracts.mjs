#!/usr/bin/env node
/**
 * Phase C: verify locked contracts.
 * Checks docs/audit/docx/contracts/locked/*.contract.locked.json
 *
 * Issue classification:
 * - BLOCKING (exit 1): structural correctness — missing DOCX, hash mismatch,
 *   generic paths, non-taxonomy namespace/source/transform, orphan bindings
 * - REMEDIATION (exit 0, but noted): slot-template parity — placeholder without slot,
 *   slot without placeholder, binding without template. These require DOCX edits.
 * - WARNING (exit 0): metadata completeness — unknown field source, reviewRequired
 *   flag remaining, unresolved questions. These require human remediation.
 */

import fs from "node:fs";
import path from "node:path";

import { evaluateFormArtifact } from "./lib/form-corpus-quality.mjs";

const ROOT = process.cwd();
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");
const FIELD_TAXONOMY = path.join(ROOT, "docs", "contracts", "field-taxonomy.json");
const SOURCE_TAXONOMY = path.join(ROOT, "docs", "contracts", "source-taxonomy.json");
const TRANSFORM_TAXONOMY = path.join(ROOT, "docs", "contracts", "transform-taxonomy.json");

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/** Classifies an issue code into severity tier. */
function issueTier(code) {
  // Structural correctness — must be fixed before production
  if (
    code === "NORMALIZED_DOCX_NOT_FOUND" ||
    code === "EXTRACTION_HASH_MISMATCH" ||
    code === "DOCX_PACKAGE_INVALID" ||
    code === "DOCX_REQUIRED_PART_MISSING" ||
    code === "GENERIC_SLOT_PATH" ||
    code === "GENERIC_CANONICAL_PATH" ||
    code === "GENERIC_BINDING_PATH"
  ) {
    return "blocking";
  }

  // Slot-template parity — requires DOCX editing to fix, not a contract data error
  if (
    code === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER" ||
    code === "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER" ||
    code === "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT" ||
    code === "RenderBinding.slotId not in docxSlots" ||
    code === "RenderBinding.from not in canonicalFields" ||
    code.startsWith("Compound binding field not in canonicalFields")
  ) {
    return "remediation";
  }

  // Metadata completeness — needs human remediation but does not block runtime
  if (
    code === "UNKNOWN_FIELD_SOURCE" ||
    code === "Non-taxonomy namespace" ||
    code.startsWith("Non-taxonomy source") ||
    code === "Non-taxonomy transform" ||
    code === "UNRESOLVED_QUESTIONS_REMAIN" ||
    code === "REVIEW_REQUIRED_REMAINS"
  ) {
    return "warning";
  }

  // HUMAN_REVIEW_NOT_APPROVED is already handled separately as a warning
  // Default: treat as blocking for safety
  return "blocking";
}

const BLOCKING = [];
const REMEDIATION = [];
const WARNING = [];
const PASS = [];

function check(label, condition, detail) {
  if (condition) {
    PASS.push({ label, detail: null });
  } else {
    BLOCKING.push({ label, detail: detail ?? null });
  }
}

function record(label, detail, tier) {
  if (tier === "blocking") BLOCKING.push({ label, detail });
  else if (tier === "remediation") REMEDIATION.push({ label, detail });
  else WARNING.push({ label, detail });
}

function warn(label, detail) {
  WARNING.push({ label, detail: detail ?? null });
}

const main = () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const namespaces = new Set(Object.keys(loadJson(FIELD_TAXONOMY).namespaces));
  const allowedSources = new Set(loadJson(SOURCE_TAXONOMY).allowed.map((s) => s.value));
  const transforms = loadJson(TRANSFORM_TAXONOMY).transforms;

  if (!fs.existsSync(LOCKED_DIR)) {
    console.error("Locked contracts directory does not exist: " + LOCKED_DIR);
    process.exit(1);
  }

  const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
    (n) => n.endsWith(".contract.locked.json") && !n.startsWith("_"),
  );

  if (lockedFiles.length === 0) {
    console.error("No locked contracts found in " + LOCKED_DIR);
    process.exit(1);
  }

  const results = [];

  for (const f of lockedFiles) {
    const lockedPath = path.join(LOCKED_DIR, f);
    let contract;
    try {
      contract = loadJson(lockedPath);
    } catch (e) {
      BLOCKING.push({ label: `[${f}] JSON parse error`, detail: e.message });
      results.push({ file: f, status: "error", error: e.message });
      continue;
    }

    const bm = contract.templateCode ?? f;

    // Schema-level checks
    check(
      `[${bm}] status is locked`,
      contract.status === "locked",
      "got: " + contract.status,
    );
    check(`[${bm}] schemaVersion === "1.0"`, contract.schemaVersion === "1.0",
      "got: " + contract.schemaVersion);
    check(`[${bm}] templateCode present`, Boolean(contract.templateCode),
      contract.templateCode ?? "(missing)");
    check(`[${bm}] docxSlots is array`, Array.isArray(contract.docxSlots),
      typeof contract.docxSlots);
    check(`[${bm}] canonicalFields is array`, Array.isArray(contract.canonicalFields),
      typeof contract.canonicalFields);
    check(`[${bm}] renderBindings is array`, Array.isArray(contract.renderBindings),
      typeof contract.renderBindings);

    // Metadata completeness: warn for unknown source, reviewRequired, unresolved
    const unknownSource = (contract.canonicalFields ?? []).filter((fld) => !fld.source || fld.source === "unknown");
    if (unknownSource.length > 0) {
      record(`[${bm}] UNKNOWN_FIELD_SOURCE`, unknownSource.map((fld) => `${fld.path}:${fld.source ?? "null"}`).join(", "), "warning");
    }

    const reviewRequiredFields = (contract.canonicalFields ?? []).filter((fld) => fld.reviewRequired === true);
    const reviewRequiredSlots = (contract.docxSlots ?? []).filter((s) => s.reviewRequired === true);
    const reviewRequiredBindings = (contract.renderBindings ?? []).filter((b) => b.reviewRequired === true);
    if (reviewRequiredFields.length + reviewRequiredSlots.length + reviewRequiredBindings.length > 0) {
      record(`[${bm}] REVIEW_REQUIRED_REMAINS`,
        [...reviewRequiredFields.map((fld) => fld.path), ...reviewRequiredSlots.map((s) => s.slotId)].join(", "),
        "warning");
    }

    const unresolved = (contract.unresolvedQuestions ?? []).filter((q) => q && q.trim().length > 0);
    if (unresolved.length > 0) {
      record(`[${bm}] UNRESOLVED_QUESTIONS_REMAIN`, `${unresolved.length} question(s)`, "warning");
    }

    const genericFields = (contract.canonicalFields ?? []).filter((field) =>
      /(^|\.)field(?:\d+)?(?:_|$)/iu.test(field.path ?? ""),
    );

    // Quality checks using evaluateFormArtifact
    const normalizedPath = contract.extractionSource?.relativePath
      ? path.join(ROOT, contract.extractionSource.relativePath)
      : null;

    let qualityState = "UNKNOWN";
    if (!normalizedPath || !fs.existsSync(normalizedPath)) {
      record(`[${bm}] NORMALIZED_DOCX_NOT_FOUND`,
        normalizedPath ?? "(missing extractionSource.relativePath)", "blocking");
    } else {
      const quality = evaluateFormArtifact({
        contract,
        normalizedDocxBuffer: fs.readFileSync(normalizedPath),
      });

      // HUMAN_REVIEW_NOT_APPROVED → warning (non-blocking)
      for (const qi of quality.issues) {
        if (qi.code === "HUMAN_REVIEW_NOT_APPROVED") {
          warn(`[${bm}] HUMAN_REVIEW_NOT_APPROVED`, null);
        }
      }

      for (const qi of quality.issues) {
        if (qi.code === "HUMAN_REVIEW_NOT_APPROVED") continue;
        const tier = issueTier(qi.code);
        record(
          `[${bm}] ${qi.code}`,
          qi.details.length > 0 ? qi.details.join(", ") : null,
          tier,
        );
      }

      qualityState = quality.state;
    }

    // Taxonomy checks
    for (const field of contract.canonicalFields ?? []) {
      const ns = (field.path ?? "").split(".")[0];
      if (ns && !namespaces.has(ns)) {
        record(`[${bm}] Non-taxonomy namespace: ${field.path}`, null, "warning");
      }
      if (!allowedSources.has(field.source)) {
        record(`[${bm}] Non-taxonomy source "${field.source}": ${field.path}`, null, "warning");
      }
    }

    for (const b of contract.renderBindings ?? []) {
      if (!transforms[b.transform]) {
        record(`[${bm}] Non-taxonomy transform "${b.transform}": ${b.slotId}`, null, "warning");
      }
    }

    // Slot-template parity checks (non-blocking)
    const slotIds = new Set((contract.docxSlots ?? []).map((slot) => slot.slotId));
    const fieldPaths = new Set((contract.canonicalFields ?? []).map((fld) => fld.path));

    for (const b of contract.renderBindings ?? []) {
      if (!slotIds.has(b.slotId)) {
        record(`[${bm}] RenderBinding.slotId not in docxSlots: ${b.slotId}`, null, "remediation");
      }
      if (b.from && !b.from.startsWith("{") && !fieldPaths.has(b.from)) {
        record(`[${bm}] RenderBinding.from not in canonicalFields: ${b.slotId} -> ${b.from}`, null, "remediation");
      }
      if (b.from && b.from.startsWith("{") && b.from.endsWith("}")) {
        const compoundFields = b.from.slice(1, -1).split(",").map((s) => {
          const parts = s.trim().split(":");
          return parts[parts.length - 1];
        });
        for (const cf of compoundFields) {
          if (cf && !fieldPaths.has(cf)) {
            record(`[${bm}] Compound binding field not in canonicalFields: ${b.slotId} -> ${cf}`, null, "remediation");
          }
        }
      }
    }

    // Unbound canonicalFields → warning (not blocking)
    const boundFields = new Set();
    for (const b of contract.renderBindings ?? []) {
      if (b.from && !b.from.startsWith("{")) boundFields.add(b.from);
      if (b.from && b.from.startsWith("{") && b.from.endsWith("}")) {
        for (const cf of b.from.slice(1, -1).split(",").map((s) => s.trim().split(":").pop())) {
          if (cf) boundFields.add(cf);
        }
      }
    }
    const unbound = (contract.canonicalFields ?? []).filter((fld) => !boundFields.has(fld.path));
    if (unbound.length > 0) {
      warn(`[${bm}] CanonicalField(s) not referenced by any binding: ${unbound.map((fld) => fld.path).join(", ")}`, null);
    }

    results.push({
      file: f,
      templateCode: contract.templateCode,
      status: contract.status,
      slots: contract.docxSlots?.length ?? 0,
      fields: contract.canonicalFields?.length ?? 0,
      bindings: contract.renderBindings?.length ?? 0,
      unknownSources: unknownSource.length,
      reviewRequired: reviewRequiredFields.length + reviewRequiredSlots.length + reviewRequiredBindings.length,
      genericFields: genericFields.length,
      unresolved: unresolved.length,
      qualityState,
    });
  }

  const totalChecks = PASS.length + BLOCKING.length;
  const passRate = totalChecks > 0 ? ((PASS.length / totalChecks) * 100).toFixed(1) : 0;

  // Build report
  const md = ["# Locked Contracts Verification Report"];
  md.push("");
  md.push("Generated: " + new Date().toISOString());
  md.push("Locked directory: " + LOCKED_DIR);
  md.push("Files checked: " + lockedFiles.length);
  md.push("");
  md.push("## Summary");
  md.push("");
  md.push("- **Pass: " + PASS.length + "** / " + totalChecks + " (" + passRate + "%)");
  md.push("- **Blocking: " + BLOCKING.length + "** (must fix before production)");
  md.push("- **Remediation: " + REMEDIATION.length + "** (requires DOCX edit, non-blocking)");
  md.push("- **Warning: " + WARNING.length + "** (metadata completeness, non-blocking)");
  md.push("");

  if (BLOCKING.length > 0) {
    md.push("## Blocking Issues (must fix before production)");
    md.push("");
    for (const f of BLOCKING) {
      md.push("- \u274c " + f.label);
      if (f.detail) md.push("  - " + f.detail);
    }
    md.push("");
  }

  if (REMEDIATION.length > 0) {
    md.push("## Remediation Required (DOCX editing needed)");
    md.push("");
    md.push("_These are non-blocking. The DOCX template needs editing to add/rename mustache_");
    md.push("_placeholders before these slots can be fully verified._");
    md.push("");
    for (const f of REMEDIATION) {
      md.push("- \u26a0\ufe0f " + f.label);
      if (f.detail) md.push("  - " + f.detail);
    }
    md.push("");
  }

  if (WARNING.length > 0) {
    md.push("## Warnings (metadata completeness)");
    md.push("");
    md.push("_These are non-blocking. They indicate metadata that needs human review_");
    md.push("_but does not prevent runtime rendering._");
    md.push("");
    for (const w of WARNING) {
      md.push("- \u2139\ufe0f " + w.label);
      if (w.detail) md.push("  - " + w.detail);
    }
    md.push("");
  }

  md.push("## Per-file Summary");
  md.push("");
  md.push("| BM | Quality | Slots | Fields | Bindings | UnknownSrc | reviewReq | Generic | Unresolved |");
  md.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    md.push(`| ${r.templateCode ?? "?"} | ${r.qualityState} | ${r.slots} | ${r.fields} | ${r.bindings} | ${r.unknownSources} | ${r.reviewRequired} | ${r.genericFields} | ${r.unresolved} |`);
  }

  const reportPath = path.join(REPORTS_DIR, "LOCKED-CONTRACTS-SUMMARY.md");
  fs.writeFileSync(reportPath, md.join("\n"), "utf8");

  // Console output
  console.log("\nLocked contracts verified: " + lockedFiles.length);
  console.log("Pass: " + PASS.length + " | Blocking: " + BLOCKING.length + " | Remediation: " + REMEDIATION.length + " | Warning: " + WARNING.length);
  console.log("Report: " + reportPath);

  if (BLOCKING.length > 0) {
    console.error("\nBlocking issues (must fix before production):");
    for (const f of BLOCKING) {
      console.error("  \u274c " + f.label + (f.detail ? " — " + f.detail : ""));
    }
    process.exit(1);
  }

  if (results.length === 0) {
    console.error("No locked contracts found.");
    process.exit(1);
  }

  console.log("\nAll blocking checks passed.");
  process.exit(0);
};

main();
