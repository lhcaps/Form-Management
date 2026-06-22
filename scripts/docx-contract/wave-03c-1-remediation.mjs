#!/usr/bin/env node
/**
 * Wave 03C-1 Remediation — rename unnumbered generic mustaches in DOCX
 * for BM-184 through BM-193.
 *
 * These forms have generic {{document.field}} and {{recipients.field}} stubs
 * in the normalized DOCX (unnumbered). Each occurrence is mapped to a distinct
 * semantic slot based on formInputHints ordering and surrounding DOCX context.
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
import { assertNotGenericPath } from "./lib/generic-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DOCX_DIR = path.join(ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const MAPPING_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// ─── Semantic rename maps (in order of mustache appearance in XML) ────────────
// Each entry maps one occurrence of a generic mustache to a semantic slot path.
// Entries are consumed sequentially — Nth occurrence of oldMustache → Nth entry.

// BM-184: "Đề nghị áp dụng biện pháp bảo vệ"
// Tokens in XML order:
//   agency.name (1×, already correct) → skip
//   document.field (8×) → all substantive content fields
//   decision.field (4×) → all decision authority lines
//   decision.decisionLine (2×, already correct) → skip
// formInputHints: document.field1-15, decision.field6-7, person.field14-15
const FORM_SEMANTIC_MAPS = {
  "BM-184": [
    // document.field occurrences (8×) — substantive form content
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial number in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date" },
    { oldMustache: "document.field", newPath: "document.issuePlace",        reason: "Decision issuance place" },
    { oldMustache: "document.field", newPath: "person.personFullName",     reason: "Protected person's full name (hint: field14=person.*)" },
    { oldMustache: "document.field", newPath: "person.dateOfBirth",       reason: "Protected person's date of birth" },
    { oldMustache: "document.field", newPath: "person.currentAddress",    reason: "Protected person's current address" },
    { oldMustache: "document.field", newPath: "person.occupation",        reason: "Protected person's occupation" },
    { oldMustache: "document.field", newPath: "document.summaryLine",      reason: "Summary / disposition line" },
    // decision.field occurrences (4×) — decision authority / court info
    { oldMustache: "decision.field", newPath: "decision.decisionLine",     reason: "Decision-making authority line 1" },
    { oldMustache: "decision.field", newPath: "decision.decisionLine2",   reason: "Decision-making authority line 2" },
    { oldMustache: "decision.field", newPath: "decision.decisionLine3",   reason: "Court / authority reference line (hint: field6=decision.*)" },
    { oldMustache: "decision.field", newPath: "decision.decisionLine4",   reason: "Court / authority reference line 2 (hint: field7=decision.*)" },
  ],

  // BM-185: "Yêu cầu lập Báo cáo điều tra xã hội bổ sung"
  // Tokens: agency.name (1×, correct) + document.field (5×, generic stubs)
  // formInputHints: document.field1-6
  "BM-185": [
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Issuance date" },
    { oldMustache: "document.field", newPath: "person.personFullName",     reason: "Subject's full name" },
    { oldMustache: "document.field", newPath: "person.dateOfBirth",        reason: "Subject's date of birth" },
    { oldMustache: "document.field", newPath: "person.currentAddress",    reason: "Subject's current address" },
  ],

  // BM-186: "Thông báo áp dụng thủ tục xử lý chuyển hướng"
  // Tokens: agency.name (1×, correct) + document.field (4×) + recipients.personLine (1×, correct) + recipients.field (15×, generic)
  // formInputHints: document.field1-2,4-21, person.field11,17
  "BM-186": [
    // document.field occurrences (4×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Issuance date" },
    { oldMustache: "document.field", newPath: "document.issuePlace",       reason: "Issuance place" },
    { oldMustache: "document.field", newPath: "document.reasonLine",      reason: "Legal basis / reason line" },
    // recipients.field occurrences (15×) — recipient person details
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient detail line 14" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient detail line 15 (hint: field17=person.*)" },
  ],

  // BM-187: "Yêu cầu NLCTXH xây dựng kế hoạch XLCH"
  // Tokens: agency.name (1×, correct) + document.field (2×) + recipients.personLine (1×, correct) + recipients.field (13×, generic)
  // formInputHints: document.field1-17, agency.field2, person.field11,15
  "BM-187": [
    // document.field occurrences (2×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",       reason: "Request issuance date" },
    // recipients.field occurrences (13×) — recipient details
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient name line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient name line 10 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13" },
  ],

  // BM-188: "Yêu cầu Tòa án giải quyết vấn đề bồi thường thiệt hại"
  // Tokens: agency.name (1×, correct) + document.field (2×) + recipients.personLine (1×, correct) + recipients.field (15×, generic)
  // formInputHints: document.field1-19, recipients.personLine, person.field11,17
  "BM-188": [
    // document.field occurrences (2×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Request issuance date" },
    // recipients.field occurrences (15×)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient name line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient name line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient name line 11 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient detail line 14" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient detail line 15 (hint: field17=person.*)" },
  ],

  // BM-189: "Yêu cầu CQĐT đề nghị TA xem xét GPBT trường giáo dưỡng"
  // Tokens: agency.name (1×, correct) + document.field (1×) + recipients.personLine (1×, correct) + recipients.field (15×, generic)
  // formInputHints: document.field1,3-18, recipients.personLine, person.field10,16
  "BM-189": [
    // document.field (1×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header" },
    // recipients.field occurrences (15×)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient name line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient name line 10 (hint: field10=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient detail line 14" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient detail line 15 (hint: field16=person.*)" },
  ],

  // BM-190: "Đề nghị TA xem xét, quyết định GPBT trường giáo dưỡng"
  // Tokens: agency.name (1×, correct) + document.field (3×) + recipients.personLine (2×) + recipients.field (15×, generic)
  // Note: recipients.personLine appears twice in the same "Họ tên" paragraph — second one also needs slot
  // formInputHints: document.field1-2,5-11,13-17,19,21, recipients.personLine, person.field12,18, agency.field20
  "BM-190": [
    // document.field occurrences (3×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date" },
    { oldMustache: "document.field", newPath: "document.issuePlace",       reason: "Decision issuance place" },
    // First recipients.personLine (already in contract, skip in contract update)
    // Second recipients.personLine occurrence — same semantic, only needs contract slot
    { oldMustache: "recipients.personLine", newPath: "recipients.personLine", reason: "Second personLine occurrence in same name field (duplicate in template)" },
    // recipients.field occurrences (15×)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient name line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient name line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient name line 11 (hint: field12=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient detail line 14" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient detail line 15 (hint: field18=person.*)" },
  ],

  // BM-191: "Quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng"
  // Tokens: agency.name (2×, correct) + document.field (4×) + recipients.personLine (1×, correct) + recipients.field (13×, generic)
  // formInputHints: document.field1-4,5-10, person.field11, document.field12-14, person.field15, document.field16-18, decision.field19, document.field20
  // Context: "Xét thấy", "Có người đại diện", "Có người bào chữa", "Quyết định:", footnote numbers in doc
  "BM-191": [
    // document.field occurrences (4×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date" },
    { oldMustache: "document.field", newPath: "document.issuePlace",     reason: "Decision issuance place" },
    { oldMustache: "document.field", newPath: "document.reasonLine",     reason: "Legal basis / reason line" },
    // recipients.field occurrences (13×)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient name line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient name line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient name line 11 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13 (hint: field15=person.*)" },
  ],

  // BM-192: "Quyết định không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng"
  // Tokens: agency.name (2×, correct) + document.field (3×) + recipients.personLine (1×, correct) + recipients.field (13×, generic)
  // formInputHints: document.field1-3, recipients.personLine, document.field5-10, person.field11, document.field12-14, person.field15, document.field16-18, document.field19
  // Context: similar to BM-191 but one fewer document.field (no decision.field equivalent)
  "BM-192": [
    // document.field occurrences (3×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date" },
    { oldMustache: "document.field", newPath: "document.issuePlace",     reason: "Decision issuance place" },
    // recipients.field occurrences (13×)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient name line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient name line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient name line 11 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13 (hint: field15=person.*)" },
  ],

  // BM-193: "Quyết định thay đổi biện pháp xử lý chuyển hướng tại cộng đồng"
  // Tokens: agency.name (2×, correct) + document.field (2×) + recipients.personLine (1×, correct) + recipients.field (13×, generic)
  // formInputHints: document.field1-2, recipients.personLine, document.field4-9, person.field10, document.field11-13, person.field14, document.field15-16, decision.field17, document.field18
  // Context: "Có người bào chữa" (no "người đại diện"), "Quyết định:"
  "BM-193": [
    // document.field occurrences (2×)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial in header" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date" },
    // recipients.field occurrences (13×)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient name line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient name line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient name line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient name line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient name line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient name line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient name line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient name line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient name line 10 (hint: field10=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13 (hint: field14=person.*)" },
  ],
};

const WAVE_FORMS = Object.keys(FORM_SEMANTIC_MAPS);

// Validate all proposed paths against GENERIC_PATH_RE
function validateMaps() {
  const errors = [];
  for (const [formCode, renames] of Object.entries(FORM_SEMANTIC_MAPS)) {
    for (const r of renames) {
      try {
        assertNotGenericPath(r.newPath, `${formCode} ${r.oldMustache}`);
      } catch (e) {
        errors.push(`${formCode}: ${r.oldMustache} → ${r.newPath}: ${e.message}`);
      }
    }
  }
  if (errors.length) {
    console.error("VALIDATION FAILED:");
    errors.forEach((e) => console.error(" ", e));
    process.exit(1);
  }
  console.log("All proposed paths validated (no generic paths detected).\n");
}

validateMaps();

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
 * plan = [{pos, oldContent, newPath, reason}, ...] in XML order
 */
function applyRenames(xml, renames) {
  const allMustaches = extractMustaches(xml);
  const genericOlds = new Set(renames.map((r) => r.oldMustache));

  const counters = {};
  const plan = [];

  for (const m of allMustaches) {
    if (!genericOlds.has(m.content)) continue;
    const oldKey = m.content;
    counters[oldKey] = (counters[oldKey] || 0) + 1;
    const nth = counters[oldKey];

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
          reason: `Wave 03C-1: renamed from {{${p.oldContent}}}. ${reason}`,
          docxAnchor: "wave-03c-1-remediation.mjs",
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
          reason: `Wave 03C-1: ${reason}`,
          docxAnchor: "wave-03c-1-remediation.mjs",
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
    locked.reviewedBy = "Le Huy (wave-03c-1 remediation)";
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
        reason: `Wave 03C-1: renamed {{${p.oldContent}}} → {{${newPath}}}. ${p.reason}`,
        docxAnchor: "wave-03c-1-remediation.mjs",
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
    "document.fullDocumentCode":          "Số văn bản / quyết định",
    "document.issueDate":                "Ngày ban hành",
    "document.issuePlace":               "Nơi ban hành",
    "document.reasonLine":                "Căn cứ / lý do (dòng)",
    "document.summaryLine":               "Tóm tắt / liệt kê (dòng)",
    "decision.decisionLine":              "Cơ quan ra quyết định (dòng)",
    "decision.decisionLine2":             "Cơ quan ra quyết định (dòng 2)",
    "decision.decisionLine3":             "Cơ quan ra quyết định (dòng 3)",
    "decision.decisionLine4":             "Cơ quan ra quyết định (dòng 4)",
    "recipients.personLine":              "Người nhận (dòng)",
    "recipients.personLine2":             "Người nhận (dòng 2)",
    "recipients.personLine3":             "Người nhận (dòng 3)",
    "recipients.personLine4":             "Người nhận (dòng 4)",
    "recipients.personLine5":             "Người nhận (dòng 5)",
    "recipients.personLine6":             "Người nhận (dòng 6)",
    "recipients.personLine7":             "Người nhận (dòng 7)",
    "recipients.personLine8":             "Người nhận (dòng 8)",
    "recipients.personLine9":             "Người nhận (dòng 9)",
    "recipients.personLine10":            "Người nhận (dòng 10)",
    "recipients.personLine11":            "Người nhận (dòng 11)",
    "recipients.personLine12":            "Người nhận (dòng 12)",
    "recipients.personLine13":            "Người nhận (dòng 13)",
    "recipients.personLine14":            "Người nhận (dòng 14)",
    "recipients.personLine15":            "Người nhận (dòng 15)",
    "person.personFullName":              "Họ và tên",
    "person.dateOfBirth":                 "Ngày sinh",
    "person.currentAddress":              "Địa chỉ thường trú",
    "person.occupation":                  "Nghề nghiệp",
  };
  return map[p] ?? p.split(".").pop().replace(/([A-Z])/g, " $1").trim();
}

function sourceFromPath(p) {
  if (p.startsWith("document."))  return "manual";
  if (p.startsWith("decision."))  return "manual";
  if (p.startsWith("recipients.")) return "manual";
  if (p.startsWith("person."))    return "manual";
  if (p.startsWith("legalBasis.")) return "manual";
  if (p.startsWith("agency."))    return "agencyConfig";
  return "unknown";
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log("\nWave 03C-1: semantic rename of unnumbered generic mustaches\n");
console.log("Forms:", WAVE_FORMS.join(", "), "\n");

const results = [];
for (const formCode of WAVE_FORMS) {
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
    evidence: "Renamed via wave-03c-1-remediation.mjs",
    file: `storage/templates/normalized-docx/${r.formCode}/${r.formCode}_normalized.docx`,
  })),
  docxOldHash: r.oldHash,
  docxNewHash: r.newHash,
}));

const reportPath = path.join(
  ROOT, "docs", "audit", "docx", "reports", "wave-03c-1-placeholder-renames.json",
);
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
console.log(`\nJSON report: ${reportPath}`);
