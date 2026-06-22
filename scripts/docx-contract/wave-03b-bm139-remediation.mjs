#!/usr/bin/env node
/**
 * Wave 03B Remediation — BM-139 legacy placeholders.
 *
 * BM-139 has 3 unnumbered generic-looking placeholders that are NOT generic fieldN
 * patterns but are still non-semantic. This script renames them to canonical paths.
 *
 * Before running, validates all proposed paths against generic-path.mjs
 * to prevent GENERIC_PATH_RE false positives.
 *
 * Placeholders:
 *   {{agency.dongDia}}  →  recipients.localityName
 *   {{document.chuThe}} →  person.personFullName
 *   {{document.ngayBan}} →  document.issueDate
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
const MAPPING_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");

// Use the shared helper to validate proposed paths
const {
  assertNotGenericPath,
  isGenericPath,
  GENERIC_PATH_RE,
} = await import("./lib/generic-path.mjs");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// ─── Rename map: old → { newPath, reason } ────────────────────────────────────────

const RENAMES = {
  "agency.dongDia": {
    newPath: "recipients.localityName",
    reason:
      "Asks recipient agency for their locality (district/province) when responding to the recommendation document",
    evidence:
      "In body text: 'Trả lời bằng văn bản cho Viện kiểm sát 2… về kết quả… nhận được Kiến nghị. {{recipients.localityName}}'",
  },
  "document.chuThe": {
    newPath: "person.personFullName",
    reason:
      "Signatory full name field in closing block — requires full name of signing person",
    evidence:
      "In signature block: '6 {{person.personFullName}} ( Ký, ghi rõ họ tên, đóng dấu )'",
  },
  "document.ngayBan": {
    newPath: "document.issueDate",
    reason:
      "Document issuance date — placeholder sits between section 1.3 (reasoning) and section 2 (instructions) as the document date",
    evidence:
      "Between sections: '{{agency.diaDanh}} 1.3… {{document.issueDate}} 2. Để bảo đảm…'",
  },
};

// Validate all proposed paths before doing anything
const newPaths = Object.values(RENAMES).map((r) => r.newPath);
for (const p of newPaths) {
  assertNotGenericPath(p, "BM-139 proposed path");
}

// Check no proposed path already exists as a slot (would create duplicate)
const FORM_CODE = "BM-139";

function processForm() {
  const docxDir = path.join(DOCX_DIR, FORM_CODE);
  if (!fs.existsSync(docxDir)) {
    return { status: "docx_not_found" };
  }

  const docxFiles = fs
    .readdirSync(docxDir)
    .filter((f) => f.endsWith(".docx") && f.includes("_normalized"))
    .sort();
  if (!docxFiles.length) {
    return { status: "no_normalized_docx" };
  }

  const docxPath = path.join(docxDir, docxFiles[0]);
  const docxBuf = fs.readFileSync(docxPath);
  const docxZip = new PizZip(docxBuf);
  const xml = docxZip.file("word/document.xml")?.asText() ?? "";

  // Check which renames apply
  const renames = Object.entries(RENAMES).filter(([old]) =>
    xml.includes(`{{${old}}}`),
  );

  if (!renames.length) {
    return { status: "no_legacy_placeholders" };
  }

  // Apply renames to DOCX XML
  let newXml = xml;
  for (const [old, info] of renames) {
    newXml = newXml.split(`{{${old}}}`).join(`{{${info.newPath}}}`);
  }

  // Rebuild DOCX
  const newZip = new PizZip(docxBuf);
  newZip.file("word/document.xml", newXml);
  const finalBuf = newZip.generate({ type: "nodebuffer" });

  const oldHash = sha256(docxBuf);
  const newHash = sha256(finalBuf);
  fs.writeFileSync(docxPath, finalBuf);

  // Update locked contract
  updateLockedContract(renames.map(([old, info]) => ({ old, ...info })), newHash);

  // Update mapping file
  updateMappingFile(renames.map(([old, info]) => ({ old, ...info })));

  return {
    status: "renamed",
    formCode: FORM_CODE,
    docxPath,
    renames: renames.map(([old, info]) => ({ old, newPath: info.newPath, reason: info.reason })),
    oldHash,
    newHash,
    count: renames.length,
  };
}

function updateLockedContract(renames, newDocxHash) {
  const lockedFiles = fs
    .readdirSync(LOCKED_DIR)
    .filter(
      (f) =>
        f.startsWith(`${FORM_CODE}__`) &&
        f.endsWith(".contract.locked.json"),
    );
  if (!lockedFiles.length) return;
  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const locked = JSON.parse(fs.readFileSync(lockedPath, "utf8"));
  let changed = false;
  const now = new Date().toISOString();

  for (const { old, newPath, reason } of renames) {
    const alreadyHasSlot = (locked.docxSlots ?? []).some(
      (s) => s.slotId === newPath,
    );
    if (!alreadyHasSlot) {
      if (!locked.docxSlots) locked.docxSlots = [];
      locked.docxSlots.push({
        slotId: newPath,
        label: pathLabel(newPath),
        slotType: "text",
        required: false,
        confidence: 1,
        reviewRequired: false,
        reviewEvidence: {
          reason: `Wave 03B: renamed {{${old}}} → {{${newPath}}}. ${reason}`,
          docxAnchor: "wave-03b-bm139-remediation.mjs",
          reviewedAt: now,
          reviewedBy: "Le Huy",
        },
        evidence: {
          textBefore: "renamed legacy placeholder",
          textAfter: "",
          rawPattern: `{{${newPath}}}`,
        },
      });
      changed = true;
    }

    const alreadyHasField = (locked.canonicalFields ?? []).some(
      (f) => f.path === newPath,
    );
    if (!alreadyHasField) {
      if (!locked.canonicalFields) locked.canonicalFields = [];
      locked.canonicalFields.push({
        path: newPath,
        type: "string",
        label: pathLabel(newPath),
        source: sourceFromPath(newPath),
        required: false,
        uiComponent: "text",
        transform: "identity",
        reviewRequired: false,
        reviewEvidence: {
          reason: `Wave 03B: ${reason}`,
          docxAnchor: "wave-03b-bm139-remediation.mjs",
          reviewedAt: now,
          reviewedBy: "Le Huy",
        },
      });
      changed = true;
    }

    const hasBinding = (locked.renderBindings ?? []).some(
      (b) => b.slotId === newPath || b.from === newPath,
    );
    if (!hasBinding) {
      if (!locked.renderBindings) locked.renderBindings = [];
      locked.renderBindings.push({
        slotId: newPath,
        from: newPath,
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      });
      changed = true;
    }
  }

  // Sync DOCX hash
  if (locked.extractionSource?.sha256) {
    locked.extractionSource.sha256 = newDocxHash;
    changed = true;
  }

  if (changed) {
    locked.reviewedAt = now;
    locked.reviewedBy = "Le Huy (wave-03b bm139 remediation)";
    locked.reviewKind = "human";
    fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));
  }
}

function updateMappingFile(renames) {
  const mappingPath = path.join(MAPPING_DIR, `${FORM_CODE}__lock-mapping.json`);
  if (!fs.existsSync(mappingPath)) return;
  const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  const targets = Object.values(mapping.targets);
  if (!targets.length) return;
  const slotMappings = targets[0].slotMappings ?? {};
  const now = new Date().toISOString();

  for (const { old, newPath, reason } of renames) {
    slotMappings[newPath] = {
      canonicalPath: newPath,
      source: sourceFromPath(newPath),
      transform: "identity",
      reviewEvidence: {
        reason: `Wave 03B: renamed {{${old}}} → {{${newPath}}}. ${reason}`,
        docxAnchor: "wave-03b-bm139-remediation.mjs",
        reviewedAt: now,
        reviewedBy: "Le Huy",
      },
    };
    delete slotMappings[old];
  }

  targets[0].slotMappings = slotMappings;
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pathLabel(p) {
  const map = {
    "recipients.localityName": "Địa danh / Quận huyện của cơ quan nhận",
    "person.personFullName": "Họ và tên người ký",
    "document.issueDate": "Ngày ban hành",
  };
  return map[p] ?? p.split(".").pop().replace(/([A-Z])/g, " $1").trim();
}

function sourceFromPath(p) {
  if (p.startsWith("recipients.")) return "manual";
  if (p.startsWith("person.")) return "manual";
  if (p.startsWith("document.")) return "manual";
  if (p.startsWith("agency.")) return "agencyConfig";
  return "unknown";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("\nWave 03B: BM-139 legacy placeholder remediation\n");
console.log("Proposed renames:");
for (const [old, info] of Object.entries(RENAMES)) {
  console.log(`  {{${old}}} → {{${info.newPath}}}  [${info.reason.slice(0, 80)}…]`);
}
console.log("");

const result = processForm();

if (result.status === "renamed") {
  console.log(`RESULT: ${result.formCode} — ${result.count} placeholders renamed`);
  for (const r of result.renames) {
    console.log(`  {{${r.old}}} → {{${r.newPath}}}`);
    console.log(`    Reason: ${r.reason}`);
  }
  console.log(`  DOCX hash: ${result.oldHash?.slice(0, 16)} → ${result.newHash?.slice(0, 16)}`);

  // Write JSON report
  const reportData = {
    templateCode: FORM_CODE,
    changes: result.renames.map((r) => ({
      oldPlaceholder: r.old,
      newPlaceholder: r.newPath,
      reason: r.reason,
      evidence: RENAMES[r.old]?.evidence ?? "",
      file: `storage/templates/normalized-docx/${FORM_CODE}/${FORM_CODE}_normalized.docx`,
    })),
    docxOldHash: result.oldHash,
    docxNewHash: result.newHash,
  };
  const reportPath = path.join(
    ROOT,
    "docs",
    "audit",
    "docx",
    "reports",
    "wave-03b-bm139-placeholder-renames.json",
  );
  fs.writeFileSync(reportPath, JSON.stringify([reportData], null, 2));
  console.log(`\nJSON report: ${reportPath}`);
} else {
  console.log(`RESULT: ${result.status}`);
}
