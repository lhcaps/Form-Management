#!/usr/bin/env node
/**
 * Wave 04B: Fix stale rawPattern evidence in locked contracts.
 *
 * Root cause: The docxSlots[].evidence.rawPattern values in the locked contracts
 * for scoped BMs still reference generic mustaches ({{document.field1}},
 * {{document.field2}}, etc.) from before Wave 01 DOCX remediation.
 *
 * The actual _normalized.docx files were updated with semantic mustaches
 * (e.g., {{agency.name}}, {{document.fullDocumentCode8}}), but the locked
 * contracts' rawPattern evidence wasn't updated to reflect this.
 *
 * The slotId values are correct. We only update evidence.rawPattern so that
 * the verify-locked quality check correctly identifies which DOCX slots have
 * matching template placeholders.
 *
 * This is a pure metadata fix — no DOCX editing, no mapping changes,
 * no slot/binding creation or deletion.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const NORM_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");
const OUT_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const SCOPE = [
  "BM-051", "BM-052", "BM-060", "BM-061",
  "BM-062", "BM-063", "BM-064", "BM-065",
  "BM-066", "BM-067",
];

function extractAllMustachesFromDocx(docxBuf) {
  const zip = new PizZip(docxBuf);
  const content = zip.file("word/document.xml")?.asText() ?? "";
  const matches = [...content.matchAll(/\{\{([^{}]+)\}\}/g)].map((m) => m[0]);
  return [...new Set(matches)].sort();
}

function extractMustacheCountsFromDocx(docxBuf) {
  const zip = new PizZip(docxBuf);
  const content = zip.file("word/document.xml")?.asText() ?? "";
  const matches = [...content.matchAll(/\{\{([^{}]+)\}\}/g)].map((m) => m[0]);
  const counts = {};
  for (const m of matches) {
    counts[m] = (counts[m] ?? 0) + 1;
  }
  return counts;
}

function findNormalizedDocx(bm) {
  const bmDir = path.join(NORM_DIR, bm);
  if (!fs.existsSync(bmDir)) return null;
  const files = fs.readdirSync(bmDir).filter(
    (f) => f.includes("_normalized") && f.endsWith(".docx"),
  );
  return files.length ? path.join(bmDir, files[0]) : null;
}

function loadLockedContract(bm) {
  const files = fs
    .readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(bm) && f.endsWith(".contract.locked.json"))
    .sort();
  if (!files.length) return null;
  return JSON.parse(
    fs.readFileSync(path.join(LOCKED_DIR, files[files.length - 1]), "utf8"),
  );
}

const GENERIC_RE = /\{\{document\.field\d+\}\}/u;

function buildContextMap(docxBuf) {
  const zip = new PizZip(docxBuf);
  const content = zip.file("word/document.xml")?.asText() ?? "";
  const map = {};
  // Extract text around each mustache for context matching
  const re = /([^\n<>]{0,80}\{\{([^{}]+)\}\}[^\n<>]{0,80})/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const mustache = "{{" + m[2] + "}}";
    if (!map[mustache]) map[mustache] = [];
    map[mustache].push(m[1].trim());
  }
  return map;
}

function main() {
  console.log("\nWave 04B: Fix stale rawPattern evidence in locked contracts\n");
  console.log("Scope: " + SCOPE.join(", ") + "\n");

  const auditResults = [];
  let totalSlotsFixed = 0;
  let totalSlotsClean = 0;

  for (const bm of SCOPE) {
    const normPath = findNormalizedDocx(bm);
    const locked = loadLockedContract(bm);

    if (!normPath) {
      console.log("[" + bm + "] SKIP: no normalized DOCX found");
      auditResults.push({ formCode: bm, status: "skipped", reason: "no normalized DOCX" });
      continue;
    }
    if (!locked) {
      console.log("[" + bm + "] SKIP: no locked contract found");
      auditResults.push({ formCode: bm, status: "skipped", reason: "no locked contract" });
      continue;
    }

    const docxBuf = fs.readFileSync(normPath);
    const templateMustaches = extractAllMustachesFromDocx(docxBuf);
    const mustacheCounts = extractMustacheCountsFromDocx(docxBuf);

    const contextMap = buildContextMap(docxBuf);

    const slotsFixed = [];
    const slotsClean = [];
    const slotsGeneric = [];

    for (const slot of locked.docxSlots ?? []) {
      const rawPattern = slot.evidence?.rawPattern ?? "";
      const mustacheFull = rawPattern.startsWith("{{") ? rawPattern : "{{" + rawPattern + "}}";
      const inDocx = templateMustaches.includes(mustacheFull);

      if (!inDocx) {
        // Fix the unambiguous case: agency.name slot with generic rawPattern.
        // The slotId is "agency.name" and DOCX has {{agency.name}}.
        // We update the stale rawPattern from {{document.field1}} to {{agency.name}}.
        if (
          slot.slotId === "agency.name" &&
          rawPattern.includes("field")
        ) {
          const desiredMustache = "{{" + slot.slotId + "}}";
          if (templateMustaches.includes(desiredMustache)) {
            slotsFixed.push({
              slotId: slot.slotId,
              oldRawPattern: rawPattern,
              newRawPattern: desiredMustache,
              docxCount: mustacheCounts[desiredMustache] ?? 0,
            });
            if (!slot.evidence) slot.evidence = {};
            slot.evidence.rawPattern = desiredMustache;
            // Sync reviewEvidence
            if (slot.reviewEvidence) {
              slot.reviewEvidence.rawPattern = desiredMustache;
            }
          } else {
            slotsGeneric.push({
              slotId: slot.slotId,
              rawPattern,
              reason: "agency.name slot but no {{agency.name}} in DOCX",
            });
          }
        } else {
          // Complex case: semantic slotId with no matching mustache.
          // This requires DOCX template editing, not a metadata fix.
          slotsGeneric.push({
            slotId: slot.slotId,
            rawPattern,
            reason: "semantic slotId with no matching mustache in DOCX",
          });
        }
      } else {
        slotsClean.push({ slotId: slot.slotId, rawPattern });
      }
    }

    // Sync reviewEvidence rawPattern with evidence rawPattern for all slots
    for (const slot of locked.docxSlots ?? []) {
      if (
        slot.reviewEvidence?.rawPattern &&
        slot.evidence?.rawPattern &&
        slot.reviewEvidence.rawPattern !== slot.evidence.rawPattern
      ) {
        slot.reviewEvidence.rawPattern = slot.evidence.rawPattern;
      }
    }

    // Write updated locked contract
    const lockedFiles = fs
      .readdirSync(LOCKED_DIR)
      .filter((f) => f.startsWith(bm) && f.endsWith(".contract.locked.json"))
      .sort();
    const lockedPath = path.join(LOCKED_DIR, lockedFiles[lockedFiles.length - 1]);
    fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2) + "\n", "utf8");

    totalSlotsFixed += slotsFixed.length;
    totalSlotsClean += slotsClean.length;

    console.log("[" + bm + "] fixed=" + slotsFixed.length + " clean=" + slotsClean.length + " skipped=" + slotsGeneric.length);
    for (const f of slotsFixed) {
      console.log(
        "  + " + f.slotId + ": " + f.oldRawPattern + " -> " + f.newRawPattern + " (x" + f.docxCount + ")",
      );
    }
    for (const g of slotsGeneric) {
      console.log("  ~ " + g.slotId + ": " + g.rawPattern + " [" + g.reason + "]");
    }

    auditResults.push({
      formCode: bm,
      status: slotsFixed.length > 0 ? "fixed" : "clean",
      slotsFixed,
      slotsClean,
      slotsGeneric,
      templateMustaches,
    });
  }

  // Write audit report
  const reportData = {
    wave: "04B",
    generated: new Date().toISOString(),
    scope: SCOPE,
    auditResults,
    summary: {
      total: SCOPE.length,
      fixed: auditResults.filter((r) => r.status === "fixed").length,
      clean: auditResults.filter((r) => r.status === "clean").length,
      skipped: auditResults.filter((r) => r.status === "skipped").length,
      totalSlotsFixed,
      totalSlotsClean,
    },
  };

  const reportPath = path.join(OUT_DIR, "wave-04b-rawpattern-fix.json");
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log("\nReport: " + reportPath);
  console.log(
    "\nDone. Slots fixed: " +
      totalSlotsFixed +
      " / Clean: " +
      totalSlotsClean,
  );
}

main();
