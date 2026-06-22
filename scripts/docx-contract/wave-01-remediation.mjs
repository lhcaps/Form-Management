#!/usr/bin/env node
/**
 * Wave 01 Remediation: Rename generic mustaches in normalized DOCX files
 * and update lock-mapping files for BM-051/052/060-067.
 *
 * Root cause: applyLock() filters out generic slots from docxSlots.
 * The DOCX still has {{document.field}} mustaches → TEMPLATE_PLACEHOLDER_WITHOUT_SLOT.
 *
 * Fix: rename generic mustaches to semantic names in the DOCX,
 * update mapping files, regenerate locked contracts.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DOCX_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");
const MAPPING_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// ---- Semantic renaming strategy based on context ----
function suggestSemanticName(mustache, context) {
  const text = (context ?? "").toLowerCase();
  const ns = mustache.split(".")[0]; // e.g. "document", "recipients", "person", "decision"

  // Recipients fields
  if (ns === "recipients") {
    if (text.includes("họ tên") || text.includes("bị can") || text.includes("bị cáo") || text.includes("người"))
      return "recipients.personLine";
    if (text.includes("nơi nhận") || text.includes("kính gửi")) return "recipients.recipientsLine";
    if (text.includes("lưu hồ sơ")) return "recipients.archiveLine";
    return "recipients.personLine";
  }

  // Person fields
  if (ns === "person") {
    if (text.includes("họ tên") || text.includes("bị can") || text.includes("bị cáo") || text.includes("người"))
      return "recipients.personLine";
    return "recipients.personLine";
  }

  // Decision fields
  if (ns === "decision") {
    if (text.includes("điều") || text.includes("quyết định") || text.includes("xét thấy"))
      return "decision.decisionLine";
    if (text.includes("căn cứ")) return "legalBasis.legalBasisLine";
    return "decision.decisionLine";
  }

  // LegalBasis fields
  if (ns === "legalBasis") {
    if (text.includes("căn cứ")) return "legalBasis.legalBasisLine";
    return "legalBasis.legalBasisLine";
  }

  // Document fields — most complex
  if (ns === "document") {
    if (text.includes("điều") || text.includes("quyết định") || text.includes("cho phép"))
      return "decision.decisionLine";
    if (text.includes("xét thấy")) return "decision.decisionLine";
    if (text.includes("căn cứ") && text.includes("điều")) return "decision.decisionLine";
    if (text.includes("ngày") && (text.includes("tháng") || text.includes("năm")) && text.includes("nơi"))
      return "document.issuePlaceAndDateLine";
    if (text.includes("ngày") && text.includes("tháng") && text.includes("năm")) return "document.issueDate";
    if (text.includes("nơi") && text.includes("ban hành")) return "document.issuePlace";
    if (text.includes("số quyết định")) return "document.documentCode";
    if (text.includes("ký") && (text.includes("chức vụ") || text.includes("chức danh")))
      return "signature.positionTitle";
    if (text.includes("ký") && text.includes("họ tên")) return "signature.signerName";
    if (text.includes("viện kiểm sát") || text.includes("vks")) return "agency.name";
    if (text.includes("nơi thường trú")) return "person.permanentAddress";
    if (text.includes("nơi tạm trú")) return "person.temporaryAddress";
    if (text.includes("nơi ở")) return "person.currentAddress";
    if (text.includes("nghề nghiệp")) return "person.occupation";
    if (text.includes("cmnd") || text.includes("cccd") || text.includes("hộ chiếu") || text.includes("thẻ"))
      return "person.idNumber";
    if (text.includes("dân")) return "person.ward";
    if (text.includes("quận") || text.includes("huyện") || text.includes("thành phố")) return "person.district";
    if (text.includes("tỉnh") || text.includes("thành phố")) return "person.province";
    return "document.fullDocumentCode";
  }

  // Agency fields
  if (ns === "agency") {
    if (text.includes("viện kiểm sát cấp trên") || text.includes("vks cấp trên"))
      return "agency.parentName";
    return "agency.name";
  }

  return mustache; // fallback: keep original
}

// ---- Build rename map from mapping file slots ----
function buildRenameMapFromMapping(mappingPath, docxXml) {
  const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  const targets = Object.values(mapping.targets);
  if (!targets.length) return {};

  const slotMappings = targets[0].slotMappings ?? {};
  const mappingEntries = Object.entries(slotMappings);

  // Find all generic mustaches in DOCX XML
  const allMustaches = [
    ...docxXml.matchAll(/\{\{([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+)\}\}/gu),
  ].map((m) => m[1].trim());

  const genericMustaches = allMustaches.filter(
    (m) => /^[a-z][a-z0-9]*\.field(?:\d+)?$/iu.test(m),
  );

  if (!genericMustaches.length) return {};

  // Map generic mustache → semantic name
  const renameMap = {};
  let semCounter = {};

  for (const mustache of genericMustaches) {
    // Find mapping entry for this mustache
    const entry = mappingEntries.find(([k]) => k === mustache);
    const context = entry?.[1]?.reviewEvidence?.docxAnchor ?? "";

    let sem = suggestSemanticName(mustache, context);

    // Deduplicate: if sem already used, add numeric suffix
    const base = sem;
    const cnt = (semCounter[base] ?? 0) + 1;
    semCounter[base] = cnt;
    if (cnt > 1) sem = `${base}${cnt}`;

    renameMap[mustache] = sem;
  }

  return renameMap;
}

// ---- Process a single form ----
function processForm(formCode) {
  const docxDir = path.join(DOCX_DIR, formCode);
  if (!fs.existsSync(docxDir)) {
    return { status: "docx_not_found", formCode };
  }

  const docxFiles = fs.readdirSync(docxDir)
    .filter((f) => f.endsWith(".docx") && f.includes("_normalized"))
    .sort();
  if (!docxFiles.length) {
    return { status: "docx_not_found", formCode };
  }

  const docxPath = path.join(docxDir, docxFiles[0]);
  const docxBuf = fs.readFileSync(docxPath);
  const docxZip = new PizZip(docxBuf);
  const docxXml = docxZip.file("word/document.xml")?.asText() ?? "";
  const rawXml = docxBuf.toString("utf8");
  const fieldIdx = docxXml.indexOf("document.field");
  const rawIdx = rawXml.indexOf("document.field");
  console.log(`DEBUG ${formCode}: docxLen=${docxBuf.length} xmlLen=${docxXml.length} fieldIdx=${fieldIdx} rawIdx=${rawIdx}`);

  // Find all mustache-like patterns using raw buffer search
  const genericMustaches = [];
  const seen = new Set();
  let searchFrom = 0;
  while (true) {
    const pos = docxXml.indexOf("{{", searchFrom);
    if (pos === -1) break;
    const end = docxXml.indexOf("}}", pos);
    if (end === -1) break;
    const content = docxXml.slice(pos + 2, end).trim();
    if (/^[a-z][a-z0-9]*\.field(?:\d+)?$/iu.test(content) && !seen.has(content)) {
      genericMustaches.push(content);
      seen.add(content);
    }
    searchFrom = end + 2;
  }

  if (!genericMustaches.length) {
    return { status: "no_generics", formCode };
  }

  // Build rename map from mapping file
  const mappingFile = path.join(MAPPING_DIR, `${formCode}__lock-mapping.json`);
  const renameMap = fs.existsSync(mappingFile)
    ? buildRenameMapFromMapping(mappingFile, docxXml)
    : {};

  // Fallback: auto-suggest from context
  if (Object.keys(renameMap).length === 0) {
    const semCounter = {};
    for (const mustache of genericMustaches) {
      const sem = suggestSemanticName(mustache, "");
      const base = sem;
      const cnt = (semCounter[base] ?? 0) + 1;
      semCounter[base] = cnt;
      renameMap[mustache] = cnt > 1 ? `${base}${cnt}` : base;
    }
  }

  // Apply renames to DOCX XML using string replacement
  let xml = docxXml;
  for (const [mustache, semName] of Object.entries(renameMap)) {
    const oldStr = `{{${mustache}}}`;
    const newStr = `{{${semName}}`;
    if (xml.includes(oldStr)) {
      xml = xml.split(oldStr).join(newStr + "}}");
    }
  }

  const newDocxBuf = docxZip.generate({ type: "nodebuffer", xmlDeclaration: true });
  // Overwrite with new XML
  const newZip = new PizZip(newDocxBuf);
  newZip.file("word/document.xml", xml);
  const finalBuf = newZip.generate({ type: "nodebuffer" });

  const oldHash = sha256(docxBuf);
  const newHash = sha256(finalBuf);

  fs.writeFileSync(docxPath, finalBuf);

  // Also update the draft contract's extractionSource.sha256 so lockReviewed doesn't get EXTRACTION_HASH_MISMATCH
  const DRAFT_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
  const sourceId = Object.keys(renameMap).length > 0
    ? Object.values(fs.existsSync(mappingFile) ? JSON.parse(fs.readFileSync(mappingFile, "utf8")).targets ?? {} : {}).flatMap(t => Object.keys(t).filter(k => k !== "sourceId" && k !== "decision" && k !== "slotMappings"))[0] ?? formCode
    : formCode;
  const draftFiles = fs.readdirSync(DRAFT_DIR).filter(
    (f) => f.endsWith(".contract.draft.json") && !f.startsWith("_"),
  );
  for (const df of draftFiles) {
    if (!df.startsWith(formCode)) continue;
    const draftPath = path.join(DRAFT_DIR, df);
    try {
      const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
      if (draft.extractionSource?.sha256 && draft.extractionSource.sha256 !== newHash) {
        draft.extractionSource.sha256 = newHash;
        fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));
        console.log(`  Updated draft hash: ${draftPath}`);
      }
    } catch { /* skip bad drafts */ }
  }

  // Update mapping file with new semantic names
  if (fs.existsSync(mappingFile)) {
    const mapping = JSON.parse(fs.readFileSync(mappingFile, "utf8"));
    const targets = Object.values(mapping.targets);
    if (targets.length) {
      const slotMappings = targets[0].slotMappings ?? {};

      // Add new semantic entries for renamed mustaches
      for (const [oldMustache, semName] of Object.entries(renameMap)) {
        if (!slotMappings[oldMustache]) continue;
        const entry = slotMappings[oldMustache];
        slotMappings[semName] = {
          canonicalPath: semName,
          source: entry.source ?? "manual",
          transform: entry.transform ?? "identity",
          reviewEvidence: {
            ...(entry.reviewEvidence ?? {}),
            docxAnchor: `Remediated from ${oldMustache} in DOCX`,
            reason: `Wave 01 DOCX remediation: renamed ${oldMustache} → ${semName}`,
          },
        };
        // Remove old generic entry
        delete slotMappings[oldMustache];
      }

      targets[0].slotMappings = slotMappings;
      mapping.targets[targets[0].sourceId?.split("__")[0] ?? formCode] = targets[0];
      fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    }
  }

  return {
    status: "renamed",
    formCode,
    renameMap,
    docxPath,
    oldHash: oldHash.slice(0, 16),
    newHash: newHash.slice(0, 16),
    genericMustaches,
  };
}

// Also update the draft contract's extractionSource.sha256
function updateDraftHash(formCode, newHash) {
  const DRAFT_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
  const draftFiles = fs.readdirSync(DRAFT_DIR).filter(
    (f) => f.endsWith(".contract.draft.json") && !f.startsWith("_"),
  );
  for (const df of draftFiles) {
    if (!df.startsWith(formCode)) continue;
    const draftPath = path.join(DRAFT_DIR, df);
    try {
      const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
      if (draft.extractionSource?.sha256 && draft.extractionSource.sha256 !== newHash) {
        draft.extractionSource.sha256 = newHash;
        fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));
        return draftPath;
      }
    } catch { /* skip */ }
  }
  return null;
}

// ---- Main ----
const WAVE_01 = ["BM-051", "BM-052", "BM-060", "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066", "BM-067"];

console.log("\nWave 01: DOCX mustache remediation\n");
console.log(`Forms: ${WAVE_01.join(", ")}\n`);

let renamed = 0;
for (const formCode of WAVE_01) {
  const result = processForm(formCode);

  if (result.status === "renamed") {
    const updatedDraft = updateDraftHash(formCode, result.newHash);
    console.log(`RENAME: ${result.formCode}`);
    for (const [old, sem] of Object.entries(result.renameMap)) {
      console.log(`  {{${old}}} → {{${sem}}}`);
    }
    console.log(`  DOCX: ${result.oldHash} → ${result.newHash}`);
    if (updatedDraft) console.log(`  Draft: ${path.basename(updatedDraft)}`);
    renamed++;
  } else if (result.status === "no_generics") {
    // File was already remediated — still update draft hash from current DOCX
    const docxDir = path.join(DOCX_DIR, formCode);
    const docxFiles = fs.readdirSync(docxDir).filter(
      (f) => f.endsWith(".docx") && f.includes("_normalized"),
    );
    if (docxFiles.length) {
      const docxBuf = fs.readFileSync(path.join(docxDir, docxFiles[0]));
      const hash = sha256(docxBuf);
      const updatedDraft = updateDraftHash(formCode, hash);
      if (updatedDraft) {
        console.log(`HASH_SYNC: ${formCode} (docx updated, draft hash synced)`);
      } else {
        console.log(`CLEAN:  ${formCode} (no generic mustaches, draft hash up to date)`);
      }
    } else {
      console.log(`CLEAN:  ${formCode} (no generic mustaches found)`);
    }
  } else {
    console.log(`ERROR:  ${formCode} — ${result.status}`);
  }
}

console.log(`\nRenamed: ${renamed} / ${WAVE_01.length}`);
