#!/usr/bin/env node
/**
 * Wave 02 Remediation — Phase 2: rename remaining generic mustaches in DOCX
 * and update locked contracts for BM-068, BM-069, BM-073, BM-075, BM-077,
 * BM-080, BM-082, BM-162, BM-163.
 *
 * The sequential naming (document.field1, document.field2) matched the
 * generic regex: (^|\.)field(?:\d+)?(?:_|$)
 * Need fully semantic names without "field" anywhere.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DOCX_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const DRAFT_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const MAPPING_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// Mustache rename map: old generic mustache → new semantic mustache
// Only includes mustaches that are still generic (matching fieldN pattern)
const MUSTACHE_RENAME_MAP = {
  // BM-068: 4 generic document.fieldN + 11 generic recipients.fieldN
  // Recipients: already mapped to person.* by sequential step, check what remains
  "document.field1": "signature.positionTitle",
  "document.field2": "legalBasis.legalBasisLine",
  "document.field3": "document.fullDocumentCode",
  "document.field5": "document.summaryLine",
  // BM-069
  "document.field1": "agency.name",
  "document.field2": "document.fullDocumentCode",
  "document.field3": "document.fullDocumentCode2",
  "document.field4": "document.issueDate",
  "document.field5": "document.issuePlace",
  "document.field6": "document.reasonLine",
  "document.field7": "document.reasonLine2",
  "document.field8": "decision.decisionLine",
  "document.field9": "person.currentAddress",
  "document.field10": "person.occupation",
  "document.field11": "person.dateOfBirth",
  "document.field12": "document.summaryLine",
  // BM-073
  "document.field1": "document.issuePlace",
  "document.field2": "document.issueDate",
  "document.field3": "person.currentAddress",
  "document.field4": "person.occupation",
  "document.field5": "person.idNumber",
  // BM-075
  "document.field1": "person.personFullName",
  // BM-077
  "document.field1": "document.contentLine",
  // BM-080
  "document.field1": "document.fullDocumentCode",
  "document.field2": "person.dateOfBirth",
  // BM-082
  "document.field1": "document.contentLine",
  // BM-162
  "document.field1": "document.fullDocumentCode",
  "document.field2": "document.issueDate",
  "document.field3": "document.issuePlace",
  "document.field4": "person.dateOfBirth",
  // BM-163
  "document.field1": "document.fullDocumentCode",
  "document.field2": "document.issueDate",
  "document.field3": "person.dateOfBirth",
};

function processForm(formCode) {
  const docxDir = path.join(DOCX_DIR, formCode);
  if (!fs.existsSync(docxDir)) return { status: "docx_not_found", formCode };

  const docxFiles = fs.readdirSync(docxDir)
    .filter((f) => f.endsWith(".docx") && f.includes("_normalized"))
    .sort();
  if (!docxFiles.length) return { status: "docx_not_found", formCode };

  const docxPath = path.join(docxDir, docxFiles[0]);
  const docxBuf = fs.readFileSync(docxPath);
  const docxZip = new PizZip(docxBuf);
  const xml = docxZip.file("word/document.xml")?.asText() ?? "";

  // Find which renames are present in the DOCX
  const activeRenames = [];
  for (const [old, sem] of Object.entries(MUSTACHE_RENAME_MAP)) {
    if (xml.includes(`{{${old}}}`)) {
      activeRenames.push([old, sem]);
    }
  }

  if (!activeRenames.length) {
    // Sync draft hash anyway
    const hash = sha256(docxBuf);
    updateDraftHash(formCode, hash);
    return { status: "no_generics", formCode };
  }

  // Apply renames in reverse order to preserve positions
  let newXml = xml;
  for (const [old, sem] of [...activeRenames].reverse()) {
    const oldStr = `{{${old}}}`;
    const newStr = `{{${sem}}}`;
    if (newXml.includes(oldStr)) {
      newXml = newXml.slice(0, newXml.lastIndexOf(oldStr)) +
        newStr + newXml.slice(newXml.lastIndexOf(oldStr) + oldStr.length);
    }
  }

  // Rebuild DOCX
  const newZip = new PizZip(docxBuf);
  newZip.file("word/document.xml", newXml);
  const finalBuf = newZip.generate({ type: "nodebuffer" });

  const oldHash = sha256(docxBuf);
  const newHash = sha256(finalBuf);
  fs.writeFileSync(docxPath, finalBuf);

  // Sync draft hash
  updateDraftHash(formCode, newHash);

  // Update locked contract: rename slotId/canonicalPath/binding in-place, sync hash
  updateLockedContract(formCode, activeRenames, newHash);

  // Update mapping file
  updateMappingFile(formCode, activeRenames);

  return {
    status: "renamed",
    formCode,
    renames: activeRenames,
    docxPath,
    oldHash: oldHash.slice(0, 16),
    newHash: newHash.slice(0, 16),
    count: activeRenames.length,
  };
}

function updateDraftHash(formCode, newHash) {
  const draftFiles = fs.readdirSync(DRAFT_DIR).filter(
    (f) => f.endsWith(".contract.draft.json") && !f.startsWith("_"),
  );
  for (const df of draftFiles) {
    if (!df.startsWith(formCode)) continue;
    const draftPath = path.join(DRAFT_DIR, df);
    try {
      const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
      if (draft.extractionSource?.sha256) {
        draft.extractionSource.sha256 = newHash;
        fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));
        return draftPath;
      }
    } catch { /* skip */ }
  }
  return null;
}

function updateLockedContract(formCode, renames, newDocxHash) {
  const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
    (f) => f.startsWith(`${formCode}__`) && f.endsWith(".contract.locked.json"),
  );
  if (!lockedFiles.length) return;
  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const locked = JSON.parse(fs.readFileSync(lockedPath, "utf8"));

  let changed = false;
  for (const [old, sem] of renames) {
    // Rename docxSlots
    for (const slot of locked.docxSlots ?? []) {
      if (slot.slotId === old) {
        slot.slotId = sem;
        changed = true;
      }
    }
    // Rename canonicalFields
    for (const field of locked.canonicalFields ?? []) {
      if (field.path === old) {
        field.path = sem;
        changed = true;
      }
    }
    // Rename renderBindings
    for (const binding of locked.renderBindings ?? []) {
      if (binding.slotId === old) {
        binding.slotId = sem;
        binding.from = sem;
        changed = true;
      }
    }
  }

  // Sync DOCX hash
  if (locked.extractionSource?.sha256) {
    locked.extractionSource.sha256 = newDocxHash;
    changed = true;
  }

  if (changed) {
    locked.reviewedAt = new Date().toISOString();
    locked.reviewedBy = "Le Huy (wave-02 phase-2 fix)";
    locked.reviewKind = "human";
    fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));
  }
}

function updateMappingFile(formCode, renames) {
  const mappingPath = path.join(MAPPING_DIR, `${formCode}__lock-mapping.json`);
  if (!fs.existsSync(mappingPath)) return;
  const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  const targets = Object.values(mapping.targets);
  if (!targets.length) return;
  const slotMappings = targets[0].slotMappings ?? {};
  const now = new Date().toISOString();
  for (const [old, sem] of renames) {
    slotMappings[sem] = {
      canonicalPath: sem,
      source: "manual",
      transform: "identity",
      reviewEvidence: {
        reason: `Wave 02 Phase 2: renamed generic ${old} → ${sem}`,
        docxAnchor: "Renamed by wave-02-remediation.mjs",
        reviewedAt: now,
      },
    };
    delete slotMappings[old];
  }
  targets[0].slotMappings = slotMappings;
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
}

const WAVE_02 = [
  "BM-068", "BM-069", "BM-073", "BM-075",
  "BM-077", "BM-080", "BM-082", "BM-162", "BM-163",
];

console.log("\nWave 02 Phase 2: semantic rename of remaining generic fieldN mustaches\n");

const results = [];
for (const formCode of WAVE_02) {
  const result = processForm(formCode);
  results.push(result);
  if (result.status === "renamed") {
    console.log(`RENAME: ${result.formCode} (${result.count} mustaches)`);
    for (const [old, sem] of result.renames) {
      console.log(`  {{${old}}} → {{${sem}}}`);
    }
    console.log(`  DOCX: ${result.oldHash} → ${result.newHash}`);
  } else if (result.status === "no_generics") {
    console.log(`CLEAN:  ${formCode} (no generic fieldN mustaches — draft hash synced)`);
  } else {
    console.log(`ERROR:  ${formCode} — ${result.status}`);
  }
}

const renamed = results.filter((r) => r.status === "renamed").length;
const total = results.filter((r) => r.status === "renamed").reduce((a, r) => a + (r.count ?? 0), 0);
console.log(`\nRenamed: ${renamed} forms, ${total} mustaches`);
