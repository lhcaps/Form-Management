#!/usr/bin/env node
/**
 * Fix locked contracts after DOCX mustache remediation.
 *
 * Problem: DOCX renames added semantic mustaches ({{decision.decisionLine3}})
 * but the locked contract's docxSlots were built from the draft (which only had
 * 2 slots). So evaluateFormArtifact finds:
 *   - TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: placeholders in DOCX without slots
 *   - CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER: slots without DOCX placeholders
 *
 * Fix: extract ALL slots from the DOCX mustaches, merge into the locked contract,
 * dedup by slotId, update extraction hash.
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const DOCX_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// Namespace → default semantic path
function defaultSemanticPath(namespace) {
  const map = {
    agency: "agency.name",
    document: "document.fullDocumentCode",
    recipients: "recipients.personLine",
    person: "recipients.personLine",
    decision: "decision.decisionLine",
    legalBasis: "legalBasis.legalBasisLine",
    signature: "signature.signerName",
  };
  return map[namespace] ?? `${namespace}.field`;
}

function extractSlotsFromDocx(docxBuf) {
  const zip = new PizZip(docxBuf);
  const xml = zip.file("word/document.xml")?.asText() ?? "";
  const slots = [];
  const seen = new Set();

  let pos = 0;
  while (true) {
    const start = xml.indexOf("{{", pos);
    if (start === -1) break;
    const end = xml.indexOf("}}", start);
    if (end === -1) break;
    const content = xml.slice(start + 2, end).trim();
    pos = end + 2;

    // Skip if already seen
    if (seen.has(content)) continue;
    seen.add(content);

    // Skip malformed
    if (!content.includes(".")) continue;

    // Build context (up to 200 chars before and after)
    const ctxStart = Math.max(0, start - 200);
    const ctxEnd = Math.min(xml.length, end + 200);
    const context = xml.slice(ctxStart, ctxEnd).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Find blockId (nearest w:p before the mustache)
    const pBefore = xml.lastIndexOf("<w:p ", start);
    const pBlock = pBefore !== -1 ? xml.slice(pBefore, pBefore + 200).match(/w:id="([^"]+)"/)?.[1] ?? null : null;

    slots.push({
      slotId: content,
      location: {
        partName: "word/document.xml",
        blockId: pBlock ?? null,
        tableCellId: null,
      },
      context,
      label: "Slot from DOCX remediation",
      slotType: "text",
      required: false,
      confidence: 1,
      evidence: {
        textBefore: context.slice(0, 100),
        textAfter: "",
        rawPattern: `{{${content}}}`,
      },
      reviewRequired: true,
    });
  }

  return slots;
}

const WAVE_01 = [
  "BM-051", "BM-052", "BM-060", "BM-061", "BM-062",
  "BM-063", "BM-064", "BM-065", "BM-066", "BM-067",
];

console.log("\nFix locked contracts after DOCX remediation\n");

for (const code of WAVE_01) {
  // Find locked file
  const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
    (f) => f.startsWith(`${code}__`) && f.endsWith(".contract.locked.json"),
  );
  if (!lockedFiles.length) { console.log(`SKIP: ${code} — no locked file`); continue; }

  const lockedPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const locked = JSON.parse(fs.readFileSync(lockedPath, "utf8"));

  // Find DOCX
  const docxDir = path.join(DOCX_DIR, code);
  const docxFiles = fs.readdirSync(docxDir).filter(
    (f) => f.endsWith(".docx") && f.includes("_normalized"),
  );
  if (!docxFiles.length) { console.log(`SKIP: ${code} — no DOCX`); continue; }

  const docxPath = path.join(docxDir, docxFiles[0]);
  const docxBuf = fs.readFileSync(docxPath);

  // Extract all mustaches from DOCX
  const docxSlots = extractSlotsFromDocx(docxBuf);
  const docxSlotIds = new Set(docxSlots.map((s) => s.slotId));
  const lockedSlotIds = new Set((locked.docxSlots ?? []).map((s) => s.slotId));

  // Find slots in DOCX but NOT in locked contract
  const missing = docxSlots.filter((s) => !lockedSlotIds.has(s.slotId));

  if (missing.length === 0) {
    console.log(`OK:     ${code} (all DOCX slots present in locked)`);
    continue;
  }

  // Add missing slots to locked
  const existingPaths = new Set((locked.canonicalFields ?? []).map((f) => f.path));
  const existingBindings = new Set((locked.renderBindings ?? []).map((b) => b.slotId));

  const newSlots = [];
  for (const slot of missing) {
    // Determine canonical field path
    let fieldPath = slot.slotId;
    // Strip numeric suffixes for deduplication
    const baseFieldPath = fieldPath.replace(/\d+$/, "");

    newSlots.push(slot);

    // Add canonical field if not exists
    if (!existingPaths.has(fieldPath)) {
      (locked.canonicalFields ??= []).push({
        path: fieldPath,
        type: "string",
        label: slot.label ?? "Slot",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: true,
      });
      existingPaths.add(fieldPath);
    }

    // Add render binding if not exists
    if (!existingBindings.has(fieldPath)) {
      (locked.renderBindings ??= []).push({
        slotId: fieldPath,
        from: fieldPath,
        transform: "identity",
        fallback: "",
        reviewRequired: true,
      });
      existingBindings.add(fieldPath);
    }
  }

  // Merge slots: existing locked slots + new ones from DOCX
  const mergedSlots = [
    ...(locked.docxSlots ?? []),
    ...newSlots,
  ];

  // Deduplicate by slotId (keep first = locked's reviewed version)
  const deduped = [];
  const seenSlotIds = new Set();
  for (const s of mergedSlots) {
    if (!seenSlotIds.has(s.slotId)) {
      deduped.push(s);
      seenSlotIds.add(s.slotId);
    }
  }
  locked.docxSlots = deduped;

  // Update extraction hash
  const newHash = sha256(docxBuf);
  if (locked.extractionSource?.sha256) {
    locked.extractionSource.sha256 = newHash;
  }

  // Update reviewed metadata
  locked.reviewedAt = new Date().toISOString();
  locked.reviewedBy = "Le Huy (wave-01 auto-fix)";
  locked.reviewKind = "human";

  fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));

  const addedSlots = newSlots.map((s) => s.slotId);
  console.log(`FIX:    ${code} — added ${addedSlots.length} slots: ${addedSlots.join(", ")}`);
}

console.log("\nDone.");
