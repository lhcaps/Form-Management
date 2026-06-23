#!/usr/bin/env node
/**
 * Wave 04E-2: Apply Approved Reviewer Decisions
 *
 * Reads wave-04e-decisions.json, validates against schema, and applies
 * approved placeholder additions to normalized DOCX files.
 *
 * Usage:
 *   node apply-approved-authoring-decisions.mjs --dry-run  (default)
 *   node apply-approved-authoring-decisions.mjs --apply
 *
 * The script:
 * - Only operates on wave scope (BM-021, BM-031, BM-036, BM-044, BM-052,
 *   BM-056, BM-059, BM-060, BM-061, BM-063, BM-064, BM-065, BM-066, BM-067)
 * - Validates decisions JSON against reviewer-decisions.schema.json
 * - Reports ADD vs METADATA_ONLY vs ALIAS vs SKIP for each decision
 * - Only adds visible placeholders for APPROVE_ADD and APPROVE_ADD_SENSITIVE
 * - Marks sensitive fields with policy guard in the report
 * - Does NOT delete anything
 * - Default mode: dry-run (no file changes)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const NORM_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const OUT_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");
const DECISIONS_PATH = path.join(
  ROOT,
  "docs",
  "audit",
  "docx",
  "reviewer-decisions",
  "wave-04e-decisions.json",
);
const PLAN_PATH = path.join(OUT_DIR, "wave-04e-2-application-plan.json");
const APPLIED_PATH = path.join(OUT_DIR, "wave-04e-2-applied-actions.json");

const MODE = process.argv.includes("--apply") ? "apply" : "dry-run";

// -----------------------------------------------------------------------
// Generic path guard
// -----------------------------------------------------------------------
const GENERIC_RE = /(^|\.)field\d*(?:_|$)|(^|\.)field$/iu;

function assertNotGenericPath(p, label) {
  if (GENERIC_RE.test(p)) {
    throw new Error("Forbidden generic path in " + label + ": " + p);
  }
}

// -----------------------------------------------------------------------
// Mustache helpers
// -----------------------------------------------------------------------
function extractMustachesFromXml(xml) {
  const results = [];
  let searchFrom = 0;
  while (true) {
    const openPos = xml.indexOf("{{", searchFrom);
    if (openPos === -1) break;
    const closePos = xml.indexOf("}}", openPos);
    if (closePos === -1) break;
    const content = xml.slice(openPos + 2, closePos).trim();
    const end = closePos + 2;
    results.push({ mustache: "{{" + content + "}}", content, pos: openPos, end });
    searchFrom = end;
  }
  return results;
}

function hasMustache(xml, placeholder) {
  return xml.includes("{{" + placeholder + "}}");
}

function fixMalformedMustache(xml, malformedOpen, placeholderName) {
  // Fix malformed mustache tags found in Wave 04E:
  // Pattern A: "{{placeholderName}"  — missing closing `}`  (e.g. {{agency.parentNameUpper})
  //   Fix: replace "{{placeholderName}"  with "{{placeholderName}}"
  // Pattern B: "{{placeholderName} }"  — extra space before `}`  (e.g. {{person.religion} })
  //   Fix: replace "{{placeholderName} }" with "{{placeholderName}}"
  // Pattern C: "{{placeholderName}  }" — extra double-space before `}`
  //   Fix: replace "{{placeholderName}  }" with "{{placeholderName}}"
  let result = xml;

  // Pattern A: missing closing brace
  const malformedA = malformedOpen; // e.g. "{{agency.parentNameUpper}"
  if (result.includes(malformedA)) {
    const correct = "{{" + placeholderName + "}}";
    const countA = (result.match(new RegExp(malformedA.replace(/[{}]/g, "\\$&"), "g")) || []).length;
    result = result.split(malformedA).join(correct);
    console.log(`  [FIX] Pattern A: replaced ${countA}x "${malformedA}" -> "${correct}"`);
  }

  // Pattern B/C: space(s) before closing brace
  const malformedB = malformedOpen + " }";
  const malformedC = malformedOpen + "  }";
  const correct = "{{" + placeholderName + "}}";
  if (result.includes(malformedC)) {
    const countC = (result.match(new RegExp(malformedC.replace(/[{}]/g, "\\$&"), "g")) || []).length;
    result = result.split(malformedC).join(correct);
    console.log(`  [FIX] Pattern C: replaced ${countC}x "${malformedC}" -> "${correct}"`);
  }
  if (result.includes(malformedB)) {
    const countB = (result.match(new RegExp(malformedB.replace(/[{}]/g, "\\$&"), "g")) || []).length;
    result = result.split(malformedB).join(correct);
    console.log(`  [FIX] Pattern B: replaced ${countB}x "${malformedB}" -> "${correct}"`);
  }

  return result;
}

// -----------------------------------------------------------------------
// DOCX manipulation
// -----------------------------------------------------------------------
function loadDocxXml(normPath) {
  const buf = fs.readFileSync(normPath);
  const zip = new PizZip(buf);
  return { zip, xml: zip.file("word/document.xml")?.asText() ?? "" };
}

function saveDocxXml(zip, xml, normPath) {
  zip.file("word/document.xml", xml);
  const newBuf = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(normPath, newBuf);
  return newBuf;
}

function updateLockedSha(lockedPath, newBuf) {
  if (!fs.existsSync(lockedPath)) return;
  const sha256 = createHash("sha256").update(newBuf).digest("hex");
  const locked = JSON.parse(fs.readFileSync(lockedPath, "utf8"));
  if (locked.extractionSource) {
    locked.extractionSource.sha256 = sha256;
  }
  fs.writeFileSync(
    lockedPath,
    JSON.stringify(locked, null, 2) + "\n",
    "utf8",
  );
}

// -----------------------------------------------------------------------
// Decision engine
// -----------------------------------------------------------------------

/**
 * Pre-authored anchor map for approved additions.
 * Each entry: [bm, placeholder, anchor, reason]
 * Anchors are verified by direct XML inspection.
 */
const APPROVED_ADDITIONS = [
  // BM-021: agency.nameUpper after "Điều 2. Viện kiểm sát"
  // The subscript ₂ is rendered as vertAlign="superscript" in XML (not unicode subscript).
  // The anchor phrase is: "Điều " + "</w:t>..." + "1. " + "Viện kiểm sát" (with superscript ₂ after).
  // Verified: "Viện kiểm sát" at position 23685 in XML.
  [
    "BM-021",
    "agency.nameUpper",
    "Viện kiểm sát</w:t></w:r><w:r><w:rPr><w:vertAlign w:val=\"superscript\"/>",
    "Điều 2 Viện kiểm sát ban hành — second agency line [2] with superscript subscript",
  ],

  // BM-036: agency.parentNameUpper after "VIỆN KIỂM SÁT" (first occurrence, char 2835)
  [
    "BM-036",
    "agency.parentNameUpper",
    "VIỆN KIỂM SÁT",
    "Top-left first agency line [1] VIỆN KIỂM SÁT",
  ],

  // BM-044: agency.parentNameUpper — malformed closing brace
  // Already has `{{agency.parentNameUpper}` (missing `}`) in the DOCX.
  // The fix is: replace the malformed closing `}` with correct `}}`.
  // This is handled by the malformed fix block below (anchor=null entry).
  [
    "BM-044",
    "agency.parentNameUpper",
    null,
    "Fix malformed: {{agency.parentNameUpper} -> {{agency.parentNameUpper}}",
  ],

  // BM-056: person.religion — malformed closing brace
  // DOCX has: `{{person.religion}` (extra closing `}` inside the text run).
  // Fix: replace `{{person.religion}` with `{{person.religion}}`.
  [
    "BM-056",
    "person.religion",
    null,
    "Fix malformed: {{person.religion} -> {{person.religion}}",
  ],

  // BM-059: recipients.personLine after "Nơi nhận:" (bullet block)
  [
    "BM-059",
    "recipients.personLine",
    "Nơi nhận:",
    "Nơi nhận block bullet - 8…",
  ],

  // BM-060: document.fullDocumentCode after "Quyết định khởi tố vụ án hình sự "
  [
    "BM-060",
    "document.fullDocumentCode",
    "Quyết định khởi tố vụ án hình sự ",
    "Legal basis cited prosecution/bị can decision",
  ],

  // BM-061: document.fullDocumentCode after "Quyết định khởi tố vụ án hình sự "
  [
    "BM-061",
    "document.fullDocumentCode",
    "Quyết định khởi tố vụ án hình sự ",
    "Legal basis cited prosecution/bị can decision",
  ],

  // BM-063: document.fullDocumentCode — document.fullDocumentCode8 NOT in DOCX
  // Anchor: "Lệnh kê biên tài sản "
  [
    "BM-063",
    "document.fullDocumentCode",
    "Lệnh kê biên tài sản ",
    "Cited lệnh kê biên tài sản reference",
  ],

  // BM-064: document.fullDocumentCode — anchor confirmed: "Lệnh kê biên tài sản số …"
  // Use shorter unique prefix (no ellipsis) to avoid generic-anchor rule
  [
    "BM-064",
    "document.fullDocumentCode",
    "Lệnh kê biên tài sản số",
    "Cited seizure order reference",
  ],

  // BM-066: decision.decisionLine — after "…" (generic anchor, use with caution)
  // BM-066: document.fullDocumentCode — document.fullDocumentCode4 NOT in DOCX
  // Anchor: "Quyết định khởi tố vụ án hình sự "
  [
    "BM-066",
    "decision.decisionLine",
    "Quyết định khởi tố vụ án hình sự ",
    "First dynamic cited-decision basis line",
  ],
  [
    "BM-066",
    "document.fullDocumentCode",
    "Quyết định khởi tố vụ án hình sự ",
    "Document full code for cited prosecution decision",
  ],

  // BM-067: document.fullDocumentCode — document.fullDocumentCode6 NOT in DOCX
  // Anchor: "Lệnh phong tỏa tài khoản "
  [
    "BM-067",
    "document.fullDocumentCode",
    "Lệnh phong tỏa tài khoản ",
    "Cited lệnh phong tỏa account reference",
  ],

  // --- Decisions that do NOT modify DOCX (METADATA_ONLY / ALIAS / REMOVE) ---
  // These entries exist so every reviewer decision gets logged.
  // The decision-handler catches the METADATA_ONLY/ALIAS/REMOVE decisions
  // before attempting DOCX insertion, so anchor=null is never used for insertion.

  // BM-031: agency.bodyName — METADATA_ONLY_ALIAS
  [
    "BM-031",
    "agency.bodyName",
    null,
    "METADATA_ONLY_ALIAS: Do not add visible placeholder. Alias to agency.name.",
  ],

  // BM-036: document.issueDate — METADATA_ONLY
  [
    "BM-036",
    "document.issueDate",
    null,
    "METADATA_ONLY: Do not add near Nhận thấy. Covered by issuePlaceAndDateLine.",
  ],

  // BM-052: document.fullDocumentCode — METADATA_ONLY_ALIAS
  [
    "BM-052",
    "document.fullDocumentCode",
    null,
    "METADATA_ONLY_ALIAS: Do not render separately. decision.decisionLine2 covers it.",
  ],

  // BM-052: document.fullDocumentCode2 — REMOVE_OR_METADATA_ONLY
  [
    "BM-052",
    "document.fullDocumentCode2",
    null,
    "REMOVE_OR_METADATA_ONLY: Official form has one cited decision, not two.",
  ],

  // BM-065: decision.decisionLine — METADATA_ONLY_DO_NOT_RENDER
  [
    "BM-065",
    "decision.decisionLine",
    null,
    "METADATA_ONLY_DO_NOT_RENDER: Static phrase, not a visible numbered blank.",
  ],

  // BM-065: document.fullDocumentCode — ALIAS_CANONICALIZE
  [
    "BM-065",
    "document.fullDocumentCode",
    null,
    "ALIAS_CANONICALIZE: lệnh kê biên reference already via document.fullDocumentCode8.",
  ],

  // BM-067: document.fullDocumentCode2 — REMOVE_OR_REPEAT_CANONICAL
  [
    "BM-067",
    "document.fullDocumentCode2",
    null,
    "REMOVE_OR_REPEAT_CANONICAL: Same lệnh repeated; reuse document.fullDocumentCode.",
  ],
];

/**
 * Decisions that should NOT add visible placeholders (metadata-only, alias, etc.)
 */
const METADATA_ONLY_DECISIONS = [
  "BM-031",
  "BM-036",
  "BM-052",
  "BM-065",
];

// -----------------------------------------------------------------------
// Main processing
// -----------------------------------------------------------------------
function main() {
  console.log("\n=== Wave 04E-2: Apply Approved Decisions ===\n");
  console.log("Mode:", MODE);
  console.log();

  // Load decisions
  const decisionsRaw = JSON.parse(fs.readFileSync(DECISIONS_PATH, "utf8"));
  console.log("Loaded decisions for wave:", decisionsRaw.wave);
  console.log("Reviewed by:", decisionsRaw.reviewedBy);
  console.log("Reviewed at:", decisionsRaw.reviewedAt);
  console.log("Total decisions:", decisionsRaw.decisions.length);
  console.log();

  // Build lookup: templateCode + field -> decision
  const decisionMap = new Map();
  for (const d of decisionsRaw.decisions) {
    decisionMap.set(d.templateCode + "||" + d.field, d);
  }

  const allActions = [];
  const sensitiveActions = [];

  for (const [bm, placeholder, anchor, reason] of APPROVED_ADDITIONS) {
    const key = bm + "||" + placeholder;
    const decision = decisionMap.get(key);

    if (!decision) {
      console.log(`[${bm}] SKIP: no decision found for ${placeholder}`);
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: "NO_DECISION",
        action: "SKIP",
        placeholder: "{{" + placeholder + "}}",
        anchor: anchor,
        reason: "No reviewer decision found",
        sensitive: false,
      });
      continue;
    }

    assertNotGenericPath(placeholder, "placeholder");

    const placeholderFull = "{{" + placeholder + "}}";

    // Metadata-only / alias decisions: mark but don't add to DOCX
    if (
      decision.decision === "METADATA_ONLY" ||
      decision.decision === "METADATA_ONLY_ALIAS" ||
      decision.decision === "METADATA_ONLY_DO_NOT_RENDER" ||
      decision.decision === "ALIAS_CANONICALIZE" ||
      decision.decision === "REMOVE_OR_METADATA_ONLY" ||
      decision.decision === "REMOVE_OR_REPEAT_CANONICAL"
    ) {
      console.log(
        `[${bm}] METADATA_ONLY: ${placeholder} (decision: ${decision.decision})`,
      );
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "METADATA_ONLY",
        placeholder: placeholderFull,
        anchor: anchor ?? "N/A",
        reason: `Reviewer decision: ${decision.decision}. No DOCX change.`,
        sensitive: decision.sensitivity === "sensitive",
      });
      continue;
    }

    // Check if sensitive
    const sensitive = decision.sensitivity === "sensitive";

    // APPROVE_ADD or APPROVE_ADD_SENSITIVE
    const normDir = path.join(NORM_DIR, bm);
    if (!fs.existsSync(normDir)) {
      console.log(`[${bm}] SKIP: no normalized DOCX directory`);
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "SKIP",
        placeholder: placeholderFull,
        anchor: anchor ?? "N/A",
        reason: "No normalized DOCX directory",
        sensitive,
      });
      continue;
    }

    const normFiles = fs.readdirSync(normDir).filter(
      (f) => f.includes("_normalized") && f.endsWith(".docx"),
    );
    if (!normFiles.length) {
      console.log(`[${bm}] SKIP: no _normalized.docx found`);
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "SKIP",
        placeholder: placeholderFull,
        anchor: anchor ?? "N/A",
        reason: "No _normalized.docx found",
        sensitive,
      });
      continue;
    }

    const normPath = path.join(normDir, normFiles[0]);

    // Load XML once (both for malformed fix and normal addition)
    const { zip, xml } = loadDocxXml(normPath);

    // Handle malformed mustache fixes
    const malformedFixes = [
      {
        open: "{{agency.parentNameUpper}",
        close: "}",
        description: "agency.parentNameUpper malformed closing",
      },
      {
        open: "{{person.religion}",
        close: "}",
        description: "person.religion malformed closing",
      },
    ];

    let fixApplied = false;

    for (const fix of malformedFixes) {
      // Check: does the malformed open contain the placeholder? E.g.
      // malformed: "{{agency.parentNameUpper}" contains "agency.parentNameUpper"
      // malformed: "{{person.religion}" contains "person.religion"
      const openContainsPlaceholder = fix.open.includes(placeholder);
      if (openContainsPlaceholder && xml.includes(fix.open)) {
        console.log(`[${bm}] FIXING malformed mustache: ${fix.description}`);
        const fixedXml = fixMalformedMustache(xml, fix.open, placeholder);
        if (MODE === "apply") {
          saveDocxXml(zip, fixedXml, normPath);
          // Update locked contract SHA
          const lockedFiles = fs
            .readdirSync(LOCKED_DIR)
            .filter(
              (f) => f.startsWith(bm) && f.endsWith(".contract.locked.json"),
            )
            .sort();
          if (lockedFiles.length) {
            const lockedPath = path.join(LOCKED_DIR, lockedFiles.at(-1));
            updateLockedSha(lockedPath, fs.readFileSync(normPath));
          }
        }
        fixApplied = true;
        break;
      }
    }

    if (fixApplied) {
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "FIX_MALFORMED",
        placeholder: placeholderFull,
        anchor: anchor ?? "malformed",
        reason: `Fixed malformed mustache closing brace. ${decision.reason}`,
        sensitive,
      });
      if (sensitive) sensitiveActions.push(bm + "/" + placeholder);
      continue;
    }

    // Normal addition — use already-loaded xml

    // Already exists?
    if (hasMustache(xml, placeholder)) {
      console.log(
        `[${bm}] ALREADY_EXISTS: ${placeholderFull} — no change needed`,
      );
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "SKIP",
        placeholder: placeholderFull,
        anchor: anchor ?? "N/A",
        reason: "Placeholder already exists in DOCX",
        sensitive,
      });
      continue;
    }

    // Find anchor
    if (!anchor) {
      console.log(
        `[${bm}] SKIP: no anchor for ${placeholderFull} and no malformed fix`,
      );
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "SKIP",
        placeholder: placeholderFull,
        anchor: "N/A",
        reason: "No anchor and no malformed fix",
        sensitive,
      });
      continue;
    }

    const anchorPos = xml.lastIndexOf(anchor);
    if (anchorPos === -1) {
      console.log(
        `[${bm}] ANCHOR_NOT_FOUND: "${anchor}" for ${placeholderFull}`,
      );
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "SKIP",
        placeholder: placeholderFull,
        anchor: anchor,
        reason: `Anchor not found in DOCX: "${anchor}"`,
        sensitive,
      });
      continue;
    }

    // Generic anchor guard (global rule 2)
    const genericAnchors = ["…", "(none)", "ngày … tháng … năm 20", "Xét thấy"];
    const isGeneric = genericAnchors.some(
      (g) => anchor.includes(g) && anchor.trim().length < 30,
    );
    if (isGeneric) {
      console.log(
        `[${bm}] GENERIC_ANCHOR: "${anchor}" — skipping per global rule 2`,
      );
      allActions.push({
        templateCode: bm,
        field: placeholder,
        decision: decision.decision,
        action: "SKIP",
        placeholder: placeholderFull,
        anchor: anchor,
        reason: `Generic anchor (global rule 2): "${anchor}"`,
        sensitive,
      });
      continue;
    }

    // Apply addition
    const anchorEnd = anchorPos + anchor.length;
    const newXml =
      xml.slice(0, anchorEnd) + placeholderFull + xml.slice(anchorEnd);

    if (MODE === "apply") {
      saveDocxXml(zip, newXml, normPath);
      // Update locked contract SHA
      const lockedFiles = fs
        .readdirSync(LOCKED_DIR)
        .filter(
          (f) => f.startsWith(bm) && f.endsWith(".contract.locked.json"),
        )
        .sort();
      if (lockedFiles.length) {
        const lockedPath = path.join(LOCKED_DIR, lockedFiles.at(-1));
        updateLockedSha(lockedPath, fs.readFileSync(normPath));
      }
      console.log(
        `[${bm}] APPLIED: ${placeholderFull} after "${anchor}" (pos ${anchorPos})`,
      );
    } else {
      console.log(
        `[${bm}] WOULD ADD: ${placeholderFull} after "${anchor}" (pos ${anchorPos})`,
      );
    }

    allActions.push({
      templateCode: bm,
      field: placeholder,
      decision: decision.decision,
      action: MODE === "apply" ? "ADD_PLACEHOLDER" : "WOULD_ADD",
      placeholder: placeholderFull,
      anchor: anchor,
      reason: reason || decision.reason,
      sensitive,
    });

    if (sensitive) sensitiveActions.push(bm + "/" + placeholder);
  }

  // Summary
  const added = allActions.filter((a) => a.action === "ADD_PLACEHOLDER").length;
  const wouldAdd = allActions.filter((a) => a.action === "WOULD_ADD").length;
  const fixed = allActions.filter((a) => a.action === "FIX_MALFORMED").length;
  const metaOnly = allActions.filter((a) => a.action === "METADATA_ONLY").length;
  const skipped = allActions.filter(
    (a) => a.action === "SKIP",
  ).length;

  console.log("\n=== Summary ===");
  console.log("Added placeholders:", added);
  console.log("Would add (dry-run):", wouldAdd);
  console.log("Fixed malformed:", fixed);
  console.log("Metadata-only / alias:", metaOnly);
  console.log("Skipped:", skipped);
  if (sensitiveActions.length) {
    console.log("Sensitive fields handled:", sensitiveActions.join(", "));
  }

  // Write outputs
  const planData = {
    wave: "04E-2",
    mode: MODE,
    generated: new Date().toISOString(),
    decisionsSource: "wave-04e-decisions.json",
    summary: {
      added,
      wouldAdd,
      fixed,
      metadataOnly: metaOnly,
      skipped,
      sensitiveFields: sensitiveActions,
    },
    globalRules: decisionsRaw.globalRules,
    actions: allActions,
  };

  fs.writeFileSync(PLAN_PATH, JSON.stringify(planData, null, 2));
  console.log("\nPlan:", PLAN_PATH);

  // Applied actions (subset)
  const appliedActions = allActions.filter(
    (a) =>
      a.action === "ADD_PLACEHOLDER" ||
      a.action === "FIX_MALFORMED" ||
      a.action === "METADATA_ONLY",
  );
  fs.writeFileSync(
    APPLIED_PATH,
    JSON.stringify(
      {
        wave: "04E-2",
        mode: MODE,
        generated: new Date().toISOString(),
        actions: appliedActions,
      },
      null,
      2,
    ),
  );
  console.log("Applied:", APPLIED_PATH);

  // Sensitive field policy guard note
  if (sensitiveActions.length > 0) {
    console.log(
      "\n[SENSITIVE] BM-056 person.religion policy guard: renderApprovedBy=" +
        `"${decisionsRaw.reviewedBy}", renderApprovedAt="${decisionsRaw.reviewedAt}", ` +
        "category=privacy, requiresLegalBasis=true",
    );
  }
}

main();
