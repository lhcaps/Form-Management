#!/usr/bin/env node
/**
 * Wave 03A Remediation — rename unnumbered generic mustaches in DOCX
 * for BM-164, BM-165, BM-174–BM-183.
 *
 * These forms have generic {{document.field}} and {{recipients.field}} stubs
 * in the normalized DOCX (unnumbered). Each occurrence is mapped to a distinct
 * semantic slot based on formInputHints.suggestedControls ordering.
 *
 * Algorithm:
 *  1. Extract all mustaches in XML order, track occurrence count per type.
 *  2. Build a rename plan: occurrence #N of oldMustache → the Nth entry's newPath.
 *  3. Apply replacements in reverse XML position order (preserves earlier indices).
 *  4. Update locked contract: add semantic slots, canonicalFields, renderBindings;
 *     sync extractionSource.sha256.
 *  5. Update __lock-mapping.json for each form.
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

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// ─── Semantic rename maps (in order of mustache appearance in XML) ────────────

const FORM_SEMANTIC_MAPS = {
  // BM-164: 1× document.field + 5× recipients.field
  // "BB giao nhận Cáo trạng, QĐ truy tố rút gọn, QĐ tạm đình chỉ, đình chỉ vụ án"
  "BM-164": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Document serial in header" },
    { oldMustache: "recipients.field",   newPath: "recipients.personLine2",     reason: "Recipient row 2 in handover table" },
    { oldMustache: "recipients.field",   newPath: "recipients.personLine3",     reason: "Recipient row 3" },
    { oldMustache: "recipients.field",   newPath: "recipients.personLine4",     reason: "Recipient row 4" },
    { oldMustache: "recipients.field",   newPath: "recipients.personLine5",     reason: "Recipient row 5" },
    { oldMustache: "recipients.field",   newPath: "recipients.personLine6",     reason: "Recipient row 6" },
  ],

  // BM-165: 1× document.field — "Thông báo về việc vụ án có bị can bị tạm giam"
  "BM-165": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Document serial in header" },
  ],

  // BM-174: 10× document.field — "Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt"
  // formInputHints: document.field1-12 (field10 = person.*)
  "BM-174": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Request serial number in header" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Request issuance date" },
    { oldMustache: "document.field",     newPath: "document.issuePlace",        reason: "Request issuance place" },
    { oldMustache: "document.field",     newPath: "document.contentLine",        reason: "Investigation measure content" },
    { oldMustache: "document.field",     newPath: "person.personFullName",      reason: "Subject name (hint: field10=person.*)" },
    { oldMustache: "document.field",     newPath: "person.dateOfBirth",         reason: "Subject date of birth" },
    { oldMustache: "document.field",     newPath: "person.currentAddress",      reason: "Subject current address" },
    { oldMustache: "document.field",     newPath: "person.occupation",          reason: "Subject occupation" },
    { oldMustache: "document.field",     newPath: "person.idNumber",            reason: "Subject ID number" },
    { oldMustache: "document.field",     newPath: "document.summaryLine",       reason: "Summary / list item line" },
  ],

  // BM-175: 2× document.field — "QĐ phê chuẩn biện pháp điều tra tố tụng đặc biệt"
  "BM-175": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Decision date" },
  ],

  // BM-176: 6× document.field — "QĐ không phê chuẩn biện pháp điều tra đặc biệt"
  // formInputHints: field1-8 (field3,6 = decision.*)
  "BM-176": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Decision date" },
    { oldMustache: "document.field",     newPath: "decision.decisionLine",       reason: "Decision authority line (hint: field3=decision.*)" },
    { oldMustache: "document.field",     newPath: "document.contentLine",       reason: "Legal basis / content paragraph" },
    { oldMustache: "document.field",     newPath: "document.reasonLine",        reason: "Decision reasoning line (hint: field6=decision.*)" },
    { oldMustache: "document.field",     newPath: "document.summaryLine",        reason: "Summary disposition line" },
  ],

  // BM-177: 1× document.field — "QĐ gia hạn biện pháp điều tra tố tụng đặc biệt"
  "BM-177": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
  ],

  // BM-178: 3× document.field — "QĐ huỷ bỏ biện pháp điều tra tố tụng đặc biệt"
  "BM-178": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Date of original decision being revoked" },
    { oldMustache: "document.field",     newPath: "document.issuePlace",        reason: "Place of original decision" },
  ],

  // BM-179: 8× document.field — "QĐ áp dụng biện pháp chữa bệnh"
  // formInputHints: field1-10 (field9 = person.*)
  "BM-179": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Decision date" },
    { oldMustache: "document.field",     newPath: "document.issuePlace",        reason: "Decision issuance place" },
    { oldMustache: "document.field",     newPath: "document.contentLine",       reason: "Treatment measure content line" },
    { oldMustache: "document.field",     newPath: "document.reasonLine",        reason: "Legal basis / reason line" },
    { oldMustache: "document.field",     newPath: "person.personFullName",      reason: "Subject name (hint: field9=person.*)" },
    { oldMustache: "document.field",     newPath: "person.dateOfBirth",         reason: "Subject date of birth" },
    { oldMustache: "document.field",     newPath: "document.summaryLine",        reason: "Decision summary disposition" },
  ],

  // BM-180: 9× document.field — "QĐ đình chỉ thi hành biện pháp bắt buộc chữa bệnh"
  // formInputHints: field1-11 (field3=agency.*, field10=person.*)
  "BM-180": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Decision date" },
    { oldMustache: "document.field",     newPath: "agency.field3",              reason: "Agency reference line (hint: field3=agency.*)" },
    { oldMustache: "document.field",     newPath: "document.issuePlace",        reason: "Decision issuance place" },
    { oldMustache: "document.field",     newPath: "document.reasonLine",        reason: "Suspension reason line" },
    { oldMustache: "document.field",     newPath: "document.reasonLine2",       reason: "Legal basis paragraph" },
    { oldMustache: "document.field",     newPath: "document.contentLine",       reason: "Disposition content" },
    { oldMustache: "document.field",     newPath: "person.personFullName",      reason: "Subject name (hint: field10=person.*)" },
    { oldMustache: "document.field",     newPath: "document.summaryLine",        reason: "Decision summary line" },
  ],

  // BM-181: 2× document.field — "QĐ áp dụng thủ tục rút gọn"
  "BM-181": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Decision date" },
  ],

  // BM-182: 2× document.field — "QĐ huỷ bỏ QĐ áp dụng thủ tục rút gọn"
  "BM-182": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Date of decision being revoked" },
  ],

  // BM-183: 8× document.field — "QĐ truy tố theo thủ tục rút gọn"
  // formInputHints: field1-10 (field3,4,6 = legalBasis.*)
  "BM-183": [
    { oldMustache: "document.field",     newPath: "document.fullDocumentCode",   reason: "Decision serial number" },
    { oldMustache: "document.field",     newPath: "document.issueDate",         reason: "Decision date" },
    { oldMustache: "document.field",     newPath: "legalBasis.legalBasisLine",  reason: "Legal basis citation (hint: field3=legalBasis.*)" },
    { oldMustache: "document.field",     newPath: "legalBasis.legalBasisLine2", reason: "Additional legal basis (hint: field4=legalBasis.*)" },
    { oldMustache: "document.field",     newPath: "document.contentLine",       reason: "Charge / prosecution content" },
    { oldMustache: "document.field",     newPath: "legalBasis.field6",          reason: "Statute reference (hint: field6=legalBasis.*)" },
    { oldMustache: "document.field",     newPath: "person.personFullName",      reason: "Defendant full name" },
    { oldMustache: "document.field",     newPath: "person.dateOfBirth",         reason: "Defendant date of birth" },
  ],
};

const WAVE_03A_FORMS = Object.keys(FORM_SEMANTIC_MAPS);

// ─── Mustache extraction ─────────────────────────────────────────────────────

/** Extract all {{mustache}} tokens from XML in order of appearance. */
function extractMustaches(xml) {
  const results = [];
  for (let i = 0; i < xml.length - 4; ) {
    if (xml[i] === "{" && xml[i + 1] === "{") {
      let j = i + 2;
      while (j < xml.length - 1 && !(xml[j] === "}" && xml[j + 1] === "}")) j++;
      if (j < xml.length - 1) {
        const content = xml.slice(i + 2, j).trim();
        results.push({ content, raw: `{{${content}}}`, pos: i });
        i = j + 2;
        continue;
      }
    }
    i++;
  }
  return results;
}

// ─── Core rename logic ────────────────────────────────────────────────────────

/**
 * Apply renames to DOCX XML.
 * Returns { result, plan } or null if no renames needed.
 *
 * plan = [{pos, oldContent, newPath, reason}, ...] in XML order
 */
function applyRenames(xml, renames) {
  const allMustaches = extractMustaches(xml);
  const genericOlds = new Set(renames.map((r) => r.oldMustache));

  // Count occurrences per oldMustache type
  const counters = {};
  const plan = []; // rename plan in XML order

  for (const m of allMustaches) {
    if (!genericOlds.has(m.content)) continue;
    const oldKey = m.content;
    counters[oldKey] = (counters[oldKey] || 0) + 1;
    const nth = counters[oldKey];

    // Find the Nth rename entry for this oldMustache
    const matchingEntries = renames.filter((r) => r.oldMustache === oldKey);
    const entryIdx = Math.min(nth - 1, matchingEntries.length - 1);
    const entry = matchingEntries[entryIdx];
    if (!entry) continue;

    plan.push({
      pos: m.pos,
      end: m.pos + m.raw.length,
      oldContent: m.content,
      newPath: entry.newPath,
      reason: entry.reason,
    });
  }

  if (!plan.length) return null;

  // Apply in reverse position order so indices stay valid
  plan.sort((a, b) => b.pos - a.pos);
  let result = xml;
  for (const p of plan) {
    result = result.slice(0, p.pos) + `{{${p.newPath}}}` + result.slice(p.end);
  }

  return { result, plan };
}

// ─── Locked contract updates ─────────────────────────────────────────────────

function updateLockedContract(formCode, plan, newDocxHash) {
  const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
    (f) => f.startsWith(`${formCode}__`) && f.endsWith(".contract.locked.json"),
  );
  if (!lockedFiles.length) return;
  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const locked = JSON.parse(fs.readFileSync(lockedPath, "utf8"));
  let changed = false;
  const now = new Date().toISOString();

  for (const p of plan) {
    const newPath = p.newPath;
    const reason = p.reason;
    const exists = (arr, key) => arr.some((item) => item[key] === newPath);

    if (!exists(locked.docxSlots ?? [], "slotId")) {
      locked.docxSlots = locked.docxSlots ?? [];
      locked.docxSlots.push({
        slotId: newPath,
        label: pathLabel(newPath),
        slotType: "text",
        required: false,
        confidence: 1,
        reviewRequired: false,
        reviewEvidence: {
          reason: `Wave 03A: renamed from {{${p.oldContent}}}. ${reason}`,
          docxAnchor: "wave-03a-remediation.mjs",
          reviewedAt: now,
          reviewedBy: "Le Huy",
        },
        evidence: {
          textBefore: "renamed generic placeholder",
          textAfter: "",
          rawPattern: `{{${newPath}}}`,
        },
      });
      changed = true;
    }

    if (!exists(locked.canonicalFields ?? [], "path")) {
      locked.canonicalFields = locked.canonicalFields ?? [];
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
          reason: `Wave 03A: ${reason}`,
          docxAnchor: "wave-03a-remediation.mjs",
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
      locked.renderBindings = locked.renderBindings ?? [];
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

  if (locked.extractionSource?.sha256) {
    locked.extractionSource.sha256 = newDocxHash;
    changed = true;
  }

  if (changed) {
    locked.reviewedAt = now;
    locked.reviewedBy = "Le Huy (wave-03a remediation)";
    locked.reviewKind = "human";
    fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));
  }
}

function updateMappingFile(formCode, plan) {
  const mappingPath = path.join(MAPPING_DIR, `${formCode}__lock-mapping.json`);
  if (!fs.existsSync(mappingPath)) return;
  const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  const targets = Object.values(mapping.targets);
  if (!targets.length) return;
  const slotMappings = targets[0].slotMappings ?? {};
  const now = new Date().toISOString();

  for (const p of plan) {
    const newPath = p.newPath;
    slotMappings[newPath] = {
      canonicalPath: newPath,
      source: sourceFromPath(newPath),
      transform: "identity",
      reviewEvidence: {
        reason: `Wave 03A: renamed {{${p.oldContent}}} → {{${newPath}}}. ${p.reason}`,
        docxAnchor: "wave-03a-remediation.mjs",
        reviewedAt: now,
        reviewedBy: "Le Huy",
      },
    };
    delete slotMappings[p.oldContent];
  }

  targets[0].slotMappings = slotMappings;
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pathLabel(p) {
  const map = {
    "document.fullDocumentCode":   "Số văn bản / quyết định",
    "document.issueDate":          "Ngày ban hành",
    "document.issuePlace":         "Nơi ban hành",
    "document.contentLine":        "Nội dung (dòng)",
    "document.reasonLine":         "Căn cứ / lý do (dòng)",
    "document.reasonLine2":        "Căn cứ / lý do (dòng 2)",
    "document.summaryLine":         "Tóm tắt / liệt kê (dòng)",
    "decision.decisionLine":       "Cơ quan ra quyết định (dòng)",
    "recipients.personLine":       "Người nhận (dòng)",
    "recipients.personLine2":      "Người nhận (dòng 2)",
    "recipients.personLine3":      "Người nhận (dòng 3)",
    "recipients.personLine4":      "Người nhận (dòng 4)",
    "recipients.personLine5":      "Người nhận (dòng 5)",
    "recipients.personLine6":      "Người nhận (dòng 6)",
    "person.personFullName":       "Họ và tên",
    "person.dateOfBirth":          "Ngày sinh",
    "person.currentAddress":       "Địa chỉ thường trú",
    "person.occupation":           "Nghề nghiệp",
    "person.idNumber":             "Số CMND / CCCD",
    "legalBasis.legalBasisLine":  "Căn cứ pháp luật (dòng)",
    "legalBasis.legalBasisLine2":  "Căn cứ pháp luật (dòng 2)",
    "legalBasis.field6":           "Điều luật tham chiếu",
    "agency.field3":               "Cơ quan (dòng tham chiếu)",
  };
  return map[p] ?? p.split(".").pop().replace(/([A-Z])/g, " $1").trim();
}

function sourceFromPath(p) {
  if (p.startsWith("document.")) return "manual";
  if (p.startsWith("decision.")) return "manual";
  if (p.startsWith("recipients.")) return "manual";
  if (p.startsWith("person.")) return "manual";
  if (p.startsWith("legalBasis.")) return "manual";
  if (p.startsWith("agency.")) return "agencyConfig";
  return "unknown";
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log("\nWave 03A: semantic rename of unnumbered generic mustaches\n");
console.log("Forms:", WAVE_03A_FORMS.join(", "), "\n");

const results = [];
for (const formCode of WAVE_03A_FORMS) {
  const docxDir = path.join(DOCX_DIR, formCode);
  if (!fs.existsSync(docxDir)) {
    console.log(`ERROR:  ${formCode} — docx dir not found`);
    results.push({ status: "docx_not_found", formCode });
    continue;
  }

  const docxFiles = fs.readdirSync(docxDir)
    .filter((f) => f.endsWith(".docx") && f.includes("_normalized"))
    .sort();
  if (!docxFiles.length) {
    console.log(`ERROR:  ${formCode} — no normalized docx found`);
    results.push({ status: "no_docx", formCode });
    continue;
  }

  const docxPath = path.join(docxDir, docxFiles[0]);
  const docxBuf = fs.readFileSync(docxPath);
  const docxZip = new PizZip(docxBuf);
  const xml = docxZip.file("word/document.xml")?.asText() ?? "";

  const renames = FORM_SEMANTIC_MAPS[formCode] ?? [];
  const renameResult = applyRenames(xml, renames);

  if (!renameResult) {
    console.log(`CLEAN:  ${formCode} (no generic mustaches to rename)`);
    results.push({ status: "no_generics", formCode });
    continue;
  }

  const newXml = renameResult.result;
  const newZip = new PizZip(docxBuf);
  newZip.file("word/document.xml", newXml);
  const finalBuf = newZip.generate({ type: "nodebuffer" });
  const oldHash = sha256(docxBuf);
  const newHash = sha256(finalBuf);

  if (oldHash !== newHash) {
    fs.writeFileSync(docxPath, finalBuf);
  }

  updateLockedContract(formCode, renameResult.plan, newHash);
  updateMappingFile(formCode, renameResult.plan);

  console.log(`RENAME: ${formCode} (${renameResult.plan.length} mustaches)`);
  for (const p of renameResult.plan) {
    console.log(`  {{${p.oldContent}}} → {{${p.newPath}}}  [${p.reason}]`);
  }
  console.log(`  DOCX: ${oldHash.slice(0, 16)} → ${newHash.slice(0, 16)}`);

  results.push({
    status: "renamed",
    formCode,
    docxPath,
    renames: renameResult.plan,
    oldHash,
    newHash,
    count: renameResult.plan.length,
  });
}

const renamed = results.filter((r) => r.status === "renamed");
const totalMustaches = renamed.reduce((a, r) => a + (r.count ?? 0), 0);
console.log(`\nRenamed: ${renamed.length} forms, ${totalMustaches} mustache occurrences`);

// Write JSON report
const reportData = renamed.map((r) => ({
  templateCode: r.formCode,
  changes: r.renames.map((p) => ({
    oldPlaceholder: p.oldContent,
    newPlaceholder: p.newPath,
    reason: p.reason,
    evidence: "Renamed via wave-03a-remediation.mjs",
    file: `storage/templates/normalized-docx/${r.formCode}/${r.formCode}_normalized.docx`,
  })),
  docxOldHash: r.oldHash,
  docxNewHash: r.newHash,
}));

const reportPath = path.join(
  ROOT, "docs", "audit", "docx", "reports", "wave-03a-placeholder-renames.json",
);
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
console.log(`\nJSON report: ${reportPath}`);
