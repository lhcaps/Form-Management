#!/usr/bin/env node
/**
 * Wave 04C: Add missing DOCX placeholders for scoped BMs.
 *
 * Scope: BM-051, BM-052, BM-060, BM-061, BM-062, BM-063,
 *        BM-064, BM-065, BM-066, BM-067
 *
 * Root cause: CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER and
 * BINDING_WITHOUT_TEMPLATE_PLACEHOLDER mean the locked contract has a slot/binding
 * but the DOCX template lacks the corresponding {{mustache}}.
 *
 * Approach: Use text-level XML replacement to add missing mustaches.
 * Uses the same approach as Wave 01/03 series:
 *   1. Walk XML string in order, collect all mustache positions
 *   2. Build an ordered plan
 *   3. Sort by reverse position (so earlier indices stay valid)
 *   4. Apply with slice()
 *
 * Each addition is anchored to specific Vietnamese text found in the DOCX.
 * No appending to end of file. No replacing unrelated text.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const NORM_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const OUT_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const SCOPE = [
  "BM-051", "BM-052", "BM-060", "BM-061",
  "BM-062", "BM-063", "BM-064", "BM-065",
  "BM-066", "BM-067",
];

const GENERIC_RE = /(^|\.)field\d*(?:_|$)|(^|\.)field$/iu;

function assertNotGenericPath(p, label) {
  if (GENERIC_RE.test(p)) {
    throw new Error("Generic path forbidden in " + label + ": " + p);
  }
}

/**
 * Extract all mustache occurrences from XML, in document order.
 * Returns array of { mustache, pos, end } objects.
 */
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

/**
 * Add a mustache to the XML using the reverse-sorted plan approach
 * (same as Wave 03 series).
 * Returns { newXml, added } or { newXml, added: false, reason }.
 */
function addMustacheToXml(xml, placeholder, anchorText) {
  assertNotGenericPath(placeholder, "placeholder");

  const mustacheFull = "{{" + placeholder + "}}";

  // Already exists?
  if (xml.includes(mustacheFull)) {
    return { newXml: xml, added: false, reason: "already exists in DOCX" };
  }

  // Find anchor position (last occurrence so we insert at the right location)
  const anchorPos = xml.lastIndexOf(anchorText);
  if (anchorPos === -1) {
    return { newXml: xml, added: false, reason: "anchor not found in DOCX: " + anchorText };
  }

  const anchorEnd = anchorPos + anchorText.length;
  const newXml =
    xml.slice(0, anchorEnd) + mustacheFull + xml.slice(anchorEnd);
  return { newXml, added: true };
}

/**
 * Walk all mustaches in XML to count occurrences of a given mustache.
 */
function countMustachesInXml(xml, mustache) {
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = xml.indexOf(mustache, pos);
    if (idx === -1) break;
    count++;
    pos = idx + mustache.length;
  }
  return count;
}

// --------------------------------------------------------------------
// Pre-authored additions: [bm, placeholder, anchor, reason]
// These are verified by examining the actual DOCX XML content.
// --------------------------------------------------------------------
const ADDITIONS = [
  // BM-051: Replace document serial number placeholder
  // Anchor: "Số: …/QĐ-VKS…-" appears once in the header
  ["BM-051", "document.fullDocumentCode", "Số: …/QĐ-VKS…-",
   "Document serial number in header — replaces generic Số placeholder"],

  // BM-062: Two additions
  // 1. Decision line placeholder after "Xét thấy"
  ["BM-062", "decision.decisionLine", "Xét thấy",
   "Decision provision text after 'Xét thấy'"],
  // 2. Replace document serial number placeholder
  ["BM-062", "document.fullDocumentCode", "Số: …/LKB-VKS…-",
   "Document serial number in header — replaces generic Số placeholder"],

  // BM-063: Two additions
  // 1. Insert before date line "ngày … tháng … năm …"
  ["BM-063", "document.issuePlaceAndDateLine", "ngày … tháng … năm …",
   "Issue place and date line — date pattern in document body"],
  // 2. document.fullDocumentCode: No anchor found in template (no serial number header pattern)
  //    SKIPPED — requires human review of document structure
];

function main() {
  console.log("\nWave 04C: Add missing DOCX placeholders\n");
  console.log("Scope: " + SCOPE.join(", ") + "\n");

  const auditResults = [];

  for (const bm of SCOPE) {
    const normDir = path.join(NORM_DIR, bm);
    if (!fs.existsSync(normDir)) {
      console.log("[" + bm + "] SKIP: no normalized DOCX directory");
      auditResults.push({ formCode: bm, status: "skipped", reason: "no DOCX dir" });
      continue;
    }

    const normFiles = fs.readdirSync(normDir).filter(
      (f) => f.includes("_normalized") && f.endsWith(".docx"),
    );
    if (!normFiles.length) {
      console.log("[" + bm + "] SKIP: no _normalized.docx found");
      auditResults.push({ formCode: bm, status: "skipped", reason: "no _normalized.docx" });
      continue;
    }

    const normPath = path.join(normDir, normFiles[0]);
    const docxBuf = fs.readFileSync(normPath);

    // Load ZIP and extract document.xml
    let zip;
    try {
      zip = new PizZip(docxBuf);
    } catch (err) {
      console.log("[" + bm + "] ERROR: cannot load DOCX: " + err.message);
      auditResults.push({ formCode: bm, status: "error", reason: err.message });
      continue;
    }

    const docXml = zip.file("word/document.xml")?.asText() ?? "";

    // Current mustaches
    const existingMustaches = extractMustachesFromXml(docXml);
    const existingSet = new Set(existingMustaches.map((m) => m.mustache));

    // Get additions for this BM
    const bmAdditions = ADDITIONS.filter((a) => a[0] === bm);

    const addedList = [];
    const skippedList = [];

    let currentXml = docXml;

    for (const [bmCode, placeholder, anchor, reason] of bmAdditions) {
      assertNotGenericPath(placeholder, "placeholder");

      const mustacheFull = "{{" + placeholder + "}}";

      if (existingSet.has(mustacheFull)) {
        skippedList.push({
          placeholder,
          anchor,
          reason,
          decision: "skip",
          note: "already exists in DOCX",
        });
        continue;
      }

      // Find anchor position (walk XML in order to find first occurrence)
      const anchorPos = currentXml.indexOf(anchor);
      if (anchorPos === -1) {
        skippedList.push({
          placeholder,
          anchor,
          reason,
          decision: "skip",
          note: "anchor not found",
        });
        continue;
      }

      // Apply: insert mustacheFull immediately after the anchor
      const anchorEnd = anchorPos + anchor.length;
      currentXml =
        currentXml.slice(0, anchorEnd) +
        mustacheFull +
        currentXml.slice(anchorEnd);

      addedList.push({
        placeholder,
        anchor,
        reason,
        anchorPos,
      });
    }

    // Write updated DOCX
    if (addedList.length > 0) {
      zip.file("word/document.xml", currentXml);
      const newDocxBuf = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
      fs.writeFileSync(normPath, newDocxBuf);

      // Update extraction SHA256 in locked contract
      const sha256 = createHash("sha256").update(newDocxBuf).digest("hex");

      const lockedFiles = fs
        .readdirSync(LOCKED_DIR)
        .filter((f) => f.startsWith(bm) && f.endsWith(".contract.locked.json"))
        .sort();
      if (lockedFiles.length) {
        const lockedPath = path.join(LOCKED_DIR, lockedFiles[lockedFiles.length - 1]);
        const locked = JSON.parse(fs.readFileSync(lockedPath, "utf8"));
        if (locked.extractionSource) {
          locked.extractionSource.sha256 = sha256;
        }
        fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2) + "\n", "utf8");
      }
    }

    // Count mustaches in final DOCX
    const finalMustaches = extractMustachesFromXml(currentXml);
    const finalSet = new Set(finalMustaches.map((m) => m.mustache));

    const addedMustaches = addedList.map((a) => "{{" + a.placeholder + "}}");
    const confirmedAdded = addedMustaches.filter((m) => finalSet.has(m));

    const status =
      addedList.length > 0 && confirmedAdded.length === addedList.length
        ? "fixed"
        : addedList.length > 0
          ? "partial"
          : "skipped";

    console.log(
      "[" +
        bm +
        "] " +
        status +
        " — added=" +
        addedList.length +
        " skipped=" +
        skippedList.length,
    );
    for (const a of addedList) {
      console.log("  + " + a.placeholder + " at anchor: " + a.anchor);
    }
    for (const s of skippedList) {
      console.log("  ~ " + s.placeholder + " [" + s.note + "]: " + s.anchor);
    }

    auditResults.push({
      formCode: bm,
      status,
      additions: addedList,
      skipped: skippedList,
      mustachesAfter: finalMustaches.map((m) => m.mustache),
    });
  }

  // Write audit report
  const reportData = {
    wave: "04C",
    generated: new Date().toISOString(),
    scope: SCOPE,
    auditResults,
    summary: {
      total: SCOPE.length,
      fixed: auditResults.filter((r) => r.status === "fixed").length,
      partial: auditResults.filter((r) => r.status === "partial").length,
      skipped: auditResults.filter((r) => r.status === "skipped").length,
      error: auditResults.filter((r) => r.status === "error").length,
      totalAdded: auditResults.reduce(
        (s, r) => s + (r.additions?.length ?? 0),
        0,
      ),
      totalSkipped: auditResults.reduce(
        (s, r) => s + (r.skipped?.length ?? 0),
        0,
      ),
    },
  };

  const reportPath = path.join(OUT_DIR, "wave-04c-added-placeholders.json");
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log("\nReport: " + reportPath);
  console.log(
    "\nDone. Additions: " +
      reportData.summary.totalAdded +
      " / Skipped: " +
      reportData.summary.totalSkipped,
  );
}

main();
