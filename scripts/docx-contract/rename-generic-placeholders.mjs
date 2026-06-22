#!/usr/bin/env node
/**
 * Phase D — Rename generic DOCX placeholders to semantic names.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const DRAFT_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const DOCX_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");

// Matches: document.field, recipients.field (word "field" at end of path)
// Does NOT match: document.documentCode, document.field2
const GENERIC_RE = /field$/iu;

function isGenericExact(v) {
  return typeof v === "string" && v.trim().length > 0 && GENERIC_RE.test(v);
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function suggestSemanticPath(ctx, templateTitle) {
  const text = (ctx ?? "").toLowerCase();
  if (text.includes("điều 1") || text.includes("điều1")) return "decision.decisionLine";
  if (text.includes("quyết định") || text.includes("qđ số") || text.includes("số qđ")) return "decision.decisionLine";
  if (text.includes("căn cứ") && text.includes("điều")) return "decision.decisionLine";
  if (text.includes("người") || text.includes("bị can") || text.includes("bị cáo")) return "recipients.personLine";
  if (text.includes("lưu hồ sơ")) return "recipients.archiveLine";
  if (text.includes("nơi nhận") || text.includes("kính gửi")) return "recipients.recipientsLine";
  if (text.includes("viện kiểm sát cấp trên") || text.includes("vks cấp trên")) return "agency.parentName";
  if (text.includes("viện kiểm sát") || text.includes("vks")) return "agency.name";
  if (text.includes("ngày") && text.includes("tháng")) return "document.issuePlaceAndDateLine";
  if (text.includes("ngày") || text.includes("tháng")) return "document.issueDate";
  if (text.includes("số quyết định")) return "document.documentCode";
  if (text.includes("nơi") && text.includes("ban hành")) return "document.issuePlace";
  if (text.includes("ký") && (text.includes("chức vụ") || text.includes("chức danh"))) return "signature.positionTitle";
  if (text.includes("ký") && text.includes("họ tên")) return "signature.signerName";
  if (text.includes("căn cứ")) return "legalBasis.legalBasisLine";
  return "document.fullDocumentCode";
}

function processDraft(formCode, draftFile, draft) {
  const allSlots = draft.docxSlots ?? [];

  // Log ALL slotIds for debugging
  const slotIds = allSlots.map(s => s?.slotId ?? "(null)").filter(Boolean);
  const genericSlotIds = slotIds.filter(id => isGenericExact(id));

  console.log(`DEBUG ${formCode}: total=${allSlots.length} generic=${genericSlotIds.length} file=${draftFile}`);
  if (genericSlotIds.length > 0) {
    console.log(`  generic slots: ${genericSlotIds.join(", ")}`);
  }

  if (genericSlotIds.length === 0) return { status: "no_generic" };

  const genericSlots = allSlots.filter(s => isGenericExact(s?.slotId));

  // Find DOCX
  const docxDir = path.join(DOCX_DIR, formCode);
  if (!fs.existsSync(docxDir)) return { status: "docx_not_found" };
  const docxFiles = fs.readdirSync(docxDir).filter(f => f.endsWith(".docx"));
  if (!docxFiles.length) return { status: "docx_not_found" };

  const docxPath = path.join(docxDir, docxFiles[0]);
  const docxBuf = fs.readFileSync(docxPath);
  const docxZip = new PizZip(docxBuf);
  const docxXml = docxZip.file("word/document.xml")?.asText() ?? "";

  // Find generic mustaches
  const allMustachesRaw = [...docxXml.matchAll(/\{\{([^}]+)\}\}/gu)].map(m => m[1].trim());
  const allMustaches = [...docxXml.matchAll(/\{\{([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+)\}\}/gu)].map(m => m[1].trim());
  const docxGenericMustaches = allMustaches.filter(m => isGenericExact(m));

  console.log(`  DOCX raw mustaches: ${allMustachesRaw.slice(0,5).join(", ")}`);
  console.log(`  DOCX mustaches (total=${allMustaches.length}): ${allMustaches.slice(0,5).join(", ")}`);
  console.log(`  DOCX generic mustaches: ${docxGenericMustaches.join(", ")}`);

  if (docxGenericMustaches.length === 0) {
    return { status: "docx_no_generics" };
  }

  // Build rename map
  const mustacheRename = {};
  const semUsed = new Map();

  for (let i = 0; i < docxGenericMustaches.length; i++) {
    const mustache = docxGenericMustaches[i];
    const slotIdx = Math.min(i, genericSlots.length - 1);
    const slot = genericSlots[slotIdx] ?? genericSlots[0];
    const ctx = slot?.context ?? slot?.evidence?.textBefore ?? "";
    const semBase = suggestSemanticPath(ctx, draft.templateTitle);
    const cnt = (semUsed.get(semBase) ?? 0) + 1;
    semUsed.set(semBase, cnt);
    const semPath = cnt > 1 ? `${semBase}${cnt}` : semBase;
    mustacheRename[mustache] = semPath;
  }

  // Apply DOCX renames
  let newDocxBuf = docxBuf;
  let docxChanged = false;

  for (const [mustache, semPath] of Object.entries(mustacheRename)) {
    const oldStr = `{{${mustache}}}`;
    const newStr = `{{${semPath}}`;
    if (docxXml.includes(oldStr)) {
      const zip = new PizZip(newDocxBuf);
      let xml = zip.file("word/document.xml")?.asText() ?? "";
      xml = xml.split(oldStr).join(newStr);
      zip.file("word/document.xml", xml);
      newDocxBuf = zip.generate({ type: "nodebuffer" });
      docxChanged = true;
    }
  }

  const newHash = sha256(newDocxBuf);

  // Update draft slots
  for (let i = 0; i < genericSlots.length; i++) {
    const slot = genericSlots[i];
    const mustache = docxGenericMustaches[i];
    if (!mustache || !mustacheRename[mustache]) continue;
    const newPath = mustacheRename[mustache];

    const draftSlot = draft.docxSlots?.find(s => s.slotId === slot.slotId);
    if (draftSlot) draftSlot.slotId = newPath;

    const draftField = draft.canonicalFields?.find(f => f.path === slot.slotId);
    if (draftField) draftField.path = newPath;

    for (const binding of draft.renderBindings ?? []) {
      if (binding.slotId === slot.slotId) {
        binding.slotId = newPath;
        binding.from = newPath;
      }
    }
  }

  // Update extraction hash
  if (draft.extractionSource?.sha256) {
    draft.extractionSource.sha256 = newHash;
  }

  if (docxChanged) {
    fs.writeFileSync(docxPath, newDocxBuf);
  }
  fs.writeFileSync(path.join(DRAFT_DIR, draftFile), JSON.stringify(draft, null, 2));

  return { status: "renamed", formCode, mustacheRename, docxChanged,
    oldHash: sha256(docxBuf).slice(0, 16), newHash: newHash.slice(0, 16) };
}

// Find draft contracts without locked file
const draftFiles = (fs.readdirSync(DRAFT_DIR) ?? [])
  .filter(f => f.endsWith(".contract.draft.json") && !f.startsWith("_"))
  .sort();

const lockedFiles = new Set(
  (fs.readdirSync(LOCKED_DIR) ?? [])
    .filter(f => f.endsWith(".contract.locked.json"))
    .map(f => f.replace(/__[^.]+\.contract\.locked\.json$/, "")),
);

console.log("\nPhase D: Rename generic DOCX placeholders\n");

let renamed = 0, skipped = 0;

for (const file of draftFiles) {
  const formCode = file.replace(/__.*$/, "");
  if (lockedFiles.has(formCode)) { skipped++; continue; }

  let draft;
  try {
    const draftPath = path.join(DRAFT_DIR, file);
    draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));
    console.log(`  reading: ${draftPath}`);
  } catch { skipped++; continue; }

  const result = processDraft(formCode, file, draft);

  if (result.status === "renamed") {
    if (result.docxChanged) {
      console.log(`RENAME: ${result.formCode}`);
      for (const [old, sem] of Object.entries(result.mustacheRename)) {
        console.log(`  {{${old}}} → {{${sem}}}`);
      }
      console.log(`  DOCX: ${result.oldHash} → ${result.newHash}`);
      renamed++;
    } else {
      console.log(`NOCHANGE: ${result.formCode}`);
      skipped++;
    }
  } else if (result.status === "docx_no_generics") {
    console.log(`DOCX_CLEAN: ${formCode}`);
    skipped++;
  } else {
    console.log(`SKIP: ${formCode} — ${result.status}`);
    skipped++;
  }
}

console.log(`\nRenamed: ${renamed} | Skipped: ${skipped}`);
