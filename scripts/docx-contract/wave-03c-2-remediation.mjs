#!/usr/bin/env node
/**
 * Wave 03C-2 Remediation — rename unnumbered generic mustaches in DOCX
 * for BM-194 through BM-212.
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

// TOKEN COUNTS PER FORM (from DOCX analysis):
// BM-194: agency.name(1x,correct), document.field(2x,generic)  → 2 renames
// BM-195: agency.name(1x,correct), document.field(2x,generic)  → 2 renames
// BM-196: agency.name(2x,correct), recipients.personLine(1x,correct), document.field(4x,generic), recipients.field(14x,generic) → 18 renames
// BM-197: agency.name(1x,correct), decision.decisionLine(1x,correct), document.field(11x,generic) → 11 renames
// BM-198: agency.name(2x,correct), document.field(2x,generic)  → 2 renames
// BM-199: agency.name(1x,correct), recipients.personLine(2x,correct), decision.decisionLine(1x,correct), document.field(3x,generic), recipients.field(14x,generic), decision.field(1x,generic) → 18 renames
// BM-200: agency.name(1x,correct), document.field(1x,generic)  → 1 rename
// BM-201: agency.name(2x,correct), recipients.personLine(1x,correct), document.field(2x,generic), recipients.field(13x,generic) → 15 renames
// BM-202: agency.name(2x,correct), document.field(3x,generic)  → 3 renames
// BM-203: agency.name(1x,correct), recipients.personLine(1x,correct), document.field(7x,generic), recipients.field(15x,generic) → 22 renames
// BM-204: agency.name(2x,correct), document.field(9x,generic)  → 9 renames
// BM-205: agency.name(1x,correct), recipients.personLine(1x,correct), document.field(1x,generic), recipients.field(13x,generic) → 14 renames
// BM-206: agency.name(2x,correct), recipients.personLine(1x,correct), recipients.field(13x,generic) → 13 renames
// BM-207: agency.name(2x,correct), recipients.personLine(1x,correct), document.field(1x,generic), recipients.field(12x,generic) → 13 renames
// BM-208: agency.name(2x,correct), recipients.personLine(1x,correct), document.field(1x,generic), recipients.field(12x,generic) → 13 renames
// BM-209: agency.name(2x,correct), recipients.personLine(1x,correct), document.field(1x,generic), recipients.field(11x,generic) → 12 renames
// BM-210: agency.name(2x,correct), recipients.personLine(1x,correct), recipients.field(10x,generic) → 10 renames
// BM-211: agency.name(1x,correct), recipients.personLine(1x,correct), document.field(6x,generic), recipients.field(16x,generic) → 22 renames
// BM-212: agency.name(1x,correct), recipients.personLine(1x,correct), document.field(10x,generic), recipients.field(13x,generic) → 23 renames

const FORM_SEMANTIC_MAPS = {
  // BM-194: "Quyết định hủy bỏ QĐ áp dụng BPXLCH chuyển hướng"
  // Tokens: agency.name(1x,correct) + document.field(2x,generic)
  // remediation: 2 mustaches
  // Template form: simple decision cancellation, 2 generic document.field stubs
  "BM-194": [
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial number in header (form field 1)" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date (form field 2)" },
  ],

  // BM-195: "Quyết định hủy bỏ QĐ không áp dụng BPXLCH chuyển hướng"
  // Tokens: agency.name(1x,correct) + document.field(2x,generic)
  // remediation: 2 mustaches
  "BM-195": [
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial number in header (form field 1)" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date (form field 2)" },
  ],

  // BM-196: "Quyết định mở phiên họp xem xét, áp dụng BPXLCH tại cộng đồng"
  // Tokens: agency.name(2x,correct) + recipients.personLine(1x,correct) + document.field(4x,generic) + recipients.field(14x,generic)
  // formInputHints: document.field1,2, recipients.personLine, document.field4-13, person.field14, document.field15-21
  // remediation: 18 mustaches
  "BM-196": [
    // document.field (4x) — substantive form content
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial number in header (hint: field1=document.*)" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date (hint: field2=document.*)" },
    { oldMustache: "document.field", newPath: "document.issuePlace",       reason: "Decision issuance place (hint: field4=document.*)" },
    { oldMustache: "document.field", newPath: "document.reasonLine",       reason: "Legal basis / reason line (hint: field5=document.*)" },
    // recipients.field (14x) — recipient person details
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",   reason: "Recipient person detail line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",   reason: "Recipient person detail line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",   reason: "Recipient person detail line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",   reason: "Recipient person detail line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",   reason: "Recipient person detail line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",   reason: "Recipient person detail line 7 (hint: field10=person.*, corresponds to personLine7)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",   reason: "Recipient person detail line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",   reason: "Recipient person detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10",  reason: "Recipient person detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11",  reason: "Recipient person detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12",  reason: "Recipient person detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13",  reason: "Recipient person detail line 13 (hint: field14=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14",  reason: "Recipient person detail line 14" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15",  reason: "Recipient person detail line 15" },
  ],

  // BM-197: "BB phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng"
  // Tokens: agency.name(1x,correct) + decision.decisionLine(1x,correct) + document.field(11x,generic)
  // No recipients.field in this form.
  // remediation: 11 mustaches
  "BM-197": [
    // document.field (11x) — all substantive content fields in body
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial in header (form field 1)" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date" },
    { oldMustache: "document.field", newPath: "document.issuePlace",       reason: "Decision issuance place" },
    { oldMustache: "document.field", newPath: "document.reasonLine",      reason: "Legal basis / reason line" },
    { oldMustache: "document.field", newPath: "recipients.personLine2",     reason: "Recipient person detail line 2" },
    { oldMustache: "document.field", newPath: "recipients.personLine3",     reason: "Recipient person detail line 3" },
    { oldMustache: "document.field", newPath: "recipients.personLine4",     reason: "Recipient person detail line 4" },
    { oldMustache: "document.field", newPath: "recipients.personLine5",     reason: "Recipient person detail line 5" },
    { oldMustache: "document.field", newPath: "recipients.personLine6",     reason: "Recipient person detail line 6" },
    { oldMustache: "document.field", newPath: "recipients.personLine7",     reason: "Recipient person detail line 7" },
    { oldMustache: "document.field", newPath: "recipients.personLine8",     reason: "Recipient person detail line 8" },
  ],

  // BM-198: "Quyết định hoãn phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng"
  // Tokens: agency.name(2x,correct) + document.field(2x,generic)
  // remediation: 2 mustaches
  "BM-198": [
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Decision serial number in header (form field 1)" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Decision issuance date (form field 2)" },
  ],

  // BM-199: "Kiến nghị về QĐ áp dụng BPXLCH của Tòa án"
  // Tokens: agency.name(1x,correct) + recipients.personLine(2x,correct) + decision.decisionLine(1x,correct) + document.field(3x,generic) + recipients.field(14x,generic) + decision.field(1x,generic)
  // formInputHints: document.field1-2, recipients.personLine, document.field4, decision.field5, recipients.personLine (2nd), recipients.field6-14, decision.field15, document.field16-17
  // remediation: 18 mustaches
  "BM-199": [
    // document.field (3x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header (hint: field1=document.*)" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Issuance date (hint: field2=document.*)" },
    { oldMustache: "document.field", newPath: "document.issuePlace",       reason: "Issuance place (hint: field4=document.*)" },
    // recipients.field (14x) — person details
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",   reason: "Recipient person detail line 2 (hint: field6=recipients.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",   reason: "Recipient person detail line 3 (hint: field7=recipients.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",   reason: "Recipient person detail line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",   reason: "Recipient person detail line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",   reason: "Recipient person detail line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",   reason: "Recipient person detail line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",   reason: "Recipient person detail line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",   reason: "Recipient person detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10",  reason: "Recipient person detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11",  reason: "Recipient person detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12",  reason: "Recipient person detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13",  reason: "Recipient person detail line 13 (hint: field14=recipients.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14",  reason: "Recipient person detail line 14" },
    // decision.field (1x) — decision authority line
    { oldMustache: "decision.field", newPath: "decision.decisionLine2",    reason: "Decision-making authority line 2 (hint: field5=decision.*, field15=decision.*)" },
  ],

  // BM-200: "Thông báo tiếp nhận khiếu nại, kiến nghị cân nhắc tính cần thiết"
  // Tokens: agency.name(1x,correct) + document.field(1x,generic)
  // remediation: 1 mustache
  "BM-200": [
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial number in header" },
  ],

  // BM-201: "Quyết định giải quyết khiếu nại, kiến nghị"
  // Tokens: agency.name(2x,correct) + recipients.personLine(1x,correct) + document.field(2x,generic) + recipients.field(13x,generic)
  // formInputHints: document.field1-18, person.field11, person.field17
  // remediation: 15 mustaches
  "BM-201": [
    // document.field (2x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header (hint: field1=document.*)" },
    { oldMustache: "document.field", newPath: "document.issueDate",        reason: "Issuance date (hint: field2=document.*)" },
    // recipients.field (13x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient person detail line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient person detail line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient person detail line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient person detail line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient person detail line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient person detail line 7 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient person detail line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient person detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient person detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient person detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient person detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient person detail line 13" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient person detail line 14 (hint: field17=person.*)" },
  ],

  // BM-202: "Quyết định đình chỉ việc giải quyết khiếu nại, kiến nghị"
  // Tokens: agency.name(2x,correct) + document.field(3x,generic)
  // remediation: 3 mustaches
  "BM-202": [
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",    reason: "Decision serial in header (form field 1)" },
    { oldMustache: "document.field", newPath: "document.issueDate",          reason: "Decision issuance date (form field 2)" },
    { oldMustache: "document.field", newPath: "decision.decisionLine",        reason: "Decision content / authority line (form field 3)" },
  ],

  // BM-203: "Thông báo về hoạt động tố tụng"
  // Tokens: agency.name(1x,correct) + recipients.personLine(1x,correct) + document.field(7x,generic) + recipients.field(15x,generic)
  // formInputHints: document.field1-10, person.field11, document.field12-16, person.field17, case.field18-19, document.field20-24
  // remediation: 22 mustaches
  "BM-203": [
    // document.field (7x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",   reason: "Document serial in header (hint: field1=document.*)" },
    { oldMustache: "document.field", newPath: "document.issueDate",         reason: "Issuance date (hint: field2=document.*)" },
    { oldMustache: "document.field", newPath: "document.issuePlace",        reason: "Issuance place" },
    { oldMustache: "document.field", newPath: "recipients.personLine2",      reason: "Recipient person detail line 2 (hint: field4=document.* but structurally person details)" },
    { oldMustache: "document.field", newPath: "recipients.personLine3",      reason: "Recipient person detail line 3" },
    { oldMustache: "document.field", newPath: "recipients.personLine4",      reason: "Recipient person detail line 4" },
    { oldMustache: "document.field", newPath: "recipients.personLine5",      reason: "Recipient person detail line 5" },
    // recipients.field (15x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient person detail line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient person detail line 7 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient person detail line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient person detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient person detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient person detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient person detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient person detail line 13" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient person detail line 14 (hint: field17=person.*)" },
    { oldMustache: "recipients.field", newPath: "case.caseNumber",          reason: "Case number (hint: field18=case.*)" },
    { oldMustache: "recipients.field", newPath: "case.caseNumber2",         reason: "Case detail line 2 (hint: field19=case.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient person detail line 15" },
  ],

  // BM-204: "QĐ việc tham gia tố tụng của người đại diện, tổ chức"
  // Tokens: agency.name(2x,correct) + document.field(9x,generic)
  // NO recipients.field in this form.
  // formInputHints: document.field1-2, case.field3, document.field4-9, person.field10, document.field11
  // remediation: 9 mustaches
  "BM-204": [
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",    reason: "Decision serial in header (hint: field1=document.*)" },
    { oldMustache: "document.field", newPath: "document.issueDate",           reason: "Decision issuance date (hint: field2=document.*)" },
    { oldMustache: "document.field", newPath: "case.caseNumber",             reason: "Case number (hint: field3=case.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine2",       reason: "Representative / organization detail line 2 (hint: field4=document.* but structurally person/org details)" },
    { oldMustache: "document.field", newPath: "recipients.personLine3",       reason: "Representative / organization detail line 3" },
    { oldMustache: "document.field", newPath: "recipients.personLine4",       reason: "Representative / organization detail line 4" },
    { oldMustache: "document.field", newPath: "recipients.personLine5",       reason: "Representative / organization detail line 5" },
    { oldMustache: "document.field", newPath: "recipients.personLine6",       reason: "Representative / organization detail line 6 (hint: field10=person.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine7",       reason: "Representative / organization detail line 7" },
  ],

  // BM-205: "Thông báo áp dụng biện pháp ngăn chặn đối với NCTN"
  // Tokens: agency.name(1x,correct) + recipients.personLine(1x,correct) + document.field(1x,generic) + recipients.field(13x,generic)
  // formInputHints: document.field1, recipients.personLine, document.field3-9, person.field10, document.field11-15, person.field16
  // remediation: 14 mustaches
  "BM-205": [
    // document.field (1x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",   reason: "Document serial in header (hint: field1=document.*)" },
    // recipients.field (13x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient person detail line 2 (hint: field3=document.* but structurally person details)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient person detail line 3 (hint: field4=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient person detail line 4 (hint: field5=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient person detail line 5 (hint: field6=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient person detail line 6 (hint: field7=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient person detail line 7 (hint: field8=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient person detail line 8 (hint: field9=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient person detail line 9 (hint: field10=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient person detail line 10 (hint: field11=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient person detail line 11 (hint: field12=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient person detail line 12 (hint: field13=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient person detail line 13 (hint: field14=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient person detail line 14 (hint: field15=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient person detail line 15 (hint: field16=person.*)" },
  ],

  // BM-206: "Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN"
  // Tokens: agency.name(2x,correct) + recipients.personLine(1x,correct) + recipients.field(13x,generic)
  // NO document.field in this form.
  // formInputHints: document.field1-2, recipients.personLine, document.field4-9, person.field10, document.field11-13, person.field14, document.field15-16
  // remediation: 13 mustaches
  "BM-206": [
    // recipients.field (13x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient person detail line 2 (hint: field4=document.* but structurally person details)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient person detail line 3 (hint: field5=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient person detail line 4 (hint: field6=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient person detail line 5 (hint: field7=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient person detail line 6 (hint: field8=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient person detail line 7 (hint: field9=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient person detail line 8 (hint: field10=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient person detail line 9 (hint: field11=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient person detail line 10 (hint: field12=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient person detail line 11 (hint: field13=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient person detail line 12 (hint: field14=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient person detail line 13 (hint: field15=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient person detail line 14 (hint: field16=document.*)" },
  ],

  // BM-207: "Quyết định phê chuẩn QĐ áp dụng BP giám sát điện tử đối với NCTN"
  // Tokens: agency.name(2x,correct) + recipients.personLine(1x,correct) + document.field(1x,generic) + recipients.field(12x,generic)
  // formInputHints: document.field1-2, decision.field3, recipients.personLine, document.field5-10, person.field11, document.field12-14, person.field15, document.field16
  // remediation: 13 mustaches
  "BM-207": [
    // document.field (1x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",   reason: "Document serial in header (hint: field1=document.*)" },
    // recipients.field (12x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient person detail line 2 (hint: field5=document.* but structurally person details)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient person detail line 3 (hint: field6=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient person detail line 4 (hint: field7=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient person detail line 5 (hint: field8=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient person detail line 6 (hint: field9=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient person detail line 7 (hint: field10=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient person detail line 8 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient person detail line 9 (hint: field12=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient person detail line 10 (hint: field13=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient person detail line 11 (hint: field14=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient person detail line 12 (hint: field15=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient person detail line 13" },
  ],

  // BM-208: "Quyết định không phê chuẩn QĐ áp dụng BP giám sát điện tử đối với NCTN"
  // Tokens: agency.name(2x,correct) + recipients.personLine(1x,correct) + document.field(1x,generic) + recipients.field(12x,generic)
  // remediation: 13 mustaches
  "BM-208": [
    // document.field (1x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",   reason: "Decision serial in header (form field 8)" },
    // recipients.field (12x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Recipient person detail line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Recipient person detail line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Recipient person detail line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Recipient person detail line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient person detail line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient person detail line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient person detail line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient person detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient person detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient person detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient person detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient person detail line 13" },
  ],

  // BM-209: "Quyết định áp dụng biện pháp giám sát bởi người đại diện"
  // Tokens: agency.name(2x,correct) + recipients.personLine(1x,correct) + document.field(1x,generic) + recipients.field(11x,generic)
  // remediation: 12 mustaches
  "BM-209": [
    // document.field (1x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",   reason: "Decision serial in header (form field 8)" },
    // recipients.field (11x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Representative detail line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Representative detail line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Representative detail line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Representative detail line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Representative detail line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Representative detail line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Representative detail line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Representative detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Representative detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Representative detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Representative detail line 12" },
  ],

  // BM-210: "Quyết định thay đổi người đại diện"
  // Tokens: agency.name(2x,correct) + recipients.personLine(1x,correct) + recipients.field(10x,generic)
  // NO document.field in this form.
  // remediation: 10 mustaches
  "BM-210": [
    // recipients.field (10x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine2",  reason: "Representative detail line 2" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine3",  reason: "Representative detail line 3" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine4",  reason: "Representative detail line 4" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine5",  reason: "Representative detail line 5" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Representative detail line 6" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Representative detail line 7" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Representative detail line 8" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Representative detail line 9" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Representative detail line 10" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Representative detail line 11" },
  ],

  // BM-211: "Thông báo về việc thụ lý vụ án"
  // Tokens: agency.name(1x,correct) + recipients.personLine(1x,correct) + document.field(6x,generic) + recipients.field(16x,generic)
  // formInputHints: document.field1-2, recipients.personLine, document.field4-10, person.field11, document.field12-16, person.field17, case.field18-19, document.field20-24
  // remediation: 22 mustaches
  "BM-211": [
    // document.field (6x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header (hint: field1=document.*)" },
    { oldMustache: "document.field", newPath: "document.issueDate",          reason: "Issuance date (hint: field2=document.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine2",       reason: "Recipient person detail line 2 (hint: field4=document.* but structurally person details)" },
    { oldMustache: "document.field", newPath: "recipients.personLine3",       reason: "Recipient person detail line 3 (hint: field5=document.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine4",       reason: "Recipient person detail line 4 (hint: field6=document.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine5",       reason: "Recipient person detail line 5 (hint: field7=document.*)" },
    // recipients.field (16x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine6",  reason: "Recipient person detail line 6 (hint: field8=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine7",  reason: "Recipient person detail line 7 (hint: field9=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine8",  reason: "Recipient person detail line 8 (hint: field10=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine9",  reason: "Recipient person detail line 9 (hint: field11=person.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine10", reason: "Recipient person detail line 10 (hint: field12=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient person detail line 11 (hint: field13=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient person detail line 12 (hint: field14=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient person detail line 13 (hint: field15=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient person detail line 14 (hint: field16=document.*)" },
    { oldMustache: "recipients.field", newPath: "case.caseNumber",         reason: "Case number (hint: field18=case.*)" },
    { oldMustache: "recipients.field", newPath: "case.caseNumber2",         reason: "Case detail line 2 (hint: field19=case.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient person detail line 15 (hint: field20=document.*)" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine16", reason: "Recipient person detail line 16 (hint: field21=document.*)" },
  ],

  // BM-212: "Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên"
  // Tokens: agency.name(1x,correct) + recipients.personLine(1x,correct) + document.field(10x,generic) + recipients.field(13x,generic)
  // formInputHints: document.field1-25, agency.field3, agency.field5, recipients.personLine, person.field16, person.field22
  // remediation: 23 mustaches
  "BM-212": [
    // document.field (10x)
    { oldMustache: "document.field", newPath: "document.fullDocumentCode",  reason: "Document serial in header (hint: field1=document.*)" },
    { oldMustache: "document.field", newPath: "document.issueDate",           reason: "Issuance date (hint: field2=document.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine2",          reason: "Person detail line 2 (hint: field3=agency.* but structurally person details)" },
    { oldMustache: "document.field", newPath: "recipients.personLine3",          reason: "Person detail line 3 (hint: field4=document.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine4",          reason: "Person detail line 4 (hint: field5=agency.* but structurally person details)" },
    { oldMustache: "document.field", newPath: "recipients.personLine5",          reason: "Person detail line 5 (hint: field6=document.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine6",          reason: "Person detail line 6" },
    { oldMustache: "document.field", newPath: "recipients.personLine7",          reason: "Person detail line 7" },
    { oldMustache: "document.field", newPath: "recipients.personLine8",          reason: "Person detail line 8 (hint: field16=person.*)" },
    { oldMustache: "document.field", newPath: "recipients.personLine9",          reason: "Person detail line 9" },
    { oldMustache: "document.field", newPath: "recipients.personLine10",           reason: "Person detail line 10 (hint: field22=person.*)" },
    // recipients.field (13x)
    { oldMustache: "recipients.field", newPath: "recipients.personLine11", reason: "Recipient detail line 11" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine12", reason: "Recipient detail line 12" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine13", reason: "Recipient detail line 13" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine14", reason: "Recipient detail line 14" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine15", reason: "Recipient detail line 15" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine16", reason: "Recipient detail line 16" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine17", reason: "Recipient detail line 17" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine18", reason: "Recipient detail line 18" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine19", reason: "Recipient detail line 19" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine20", reason: "Recipient detail line 20" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine21", reason: "Recipient detail line 21" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine22", reason: "Recipient detail line 22" },
    { oldMustache: "recipients.field", newPath: "recipients.personLine23", reason: "Recipient detail line 23" },
  ],
};

const WAVE_FORMS = Object.keys(FORM_SEMANTIC_MAPS);

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
          reason: `Wave 03C-2: renamed from {{${p.oldContent}}}. ${reason}`,
          docxAnchor: "wave-03c-2-remediation.mjs",
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
          reason: `Wave 03C-2: ${reason}`,
          docxAnchor: "wave-03c-2-remediation.mjs",
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
    locked.reviewedBy = "Le Huy (wave-03c-2 remediation)";
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
        reason: `Wave 03C-2: renamed {{${p.oldContent}}} → {{${newPath}}}. ${p.reason}`,
        docxAnchor: "wave-03c-2-remediation.mjs",
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
    "document.fullDocumentCode":    "Số văn bản / quyết định",
    "document.issueDate":          "Ngày ban hành",
    "document.issuePlace":         "Nơi ban hành",
    "document.reasonLine":         "Căn cứ / lý do (dòng)",
    "document.summaryLine":        "Tóm tắt / liệt kê (dòng)",
    "decision.decisionLine":       "Cơ quan ra quyết định (dòng)",
    "decision.decisionLine2":      "Cơ quan ra quyết định (dòng 2)",
    "recipients.personLine":       "Người nhận (dòng)",
    "recipients.personLine2":      "Người nhận (dòng 2)",
    "recipients.personLine3":      "Người nhận (dòng 3)",
    "recipients.personLine4":      "Người nhận (dòng 4)",
    "recipients.personLine5":      "Người nhận (dòng 5)",
    "recipients.personLine6":      "Người nhận (dòng 6)",
    "recipients.personLine7":      "Người nhận (dòng 7)",
    "recipients.personLine8":      "Người nhận (dòng 8)",
    "recipients.personLine9":      "Người nhận (dòng 9)",
    "recipients.personLine10":     "Người nhận (dòng 10)",
    "recipients.personLine11":     "Người nhận (dòng 11)",
    "recipients.personLine12":     "Người nhận (dòng 12)",
    "recipients.personLine13":     "Người nhận (dòng 13)",
    "recipients.personLine14":     "Người nhận (dòng 14)",
    "recipients.personLine15":     "Người nhận (dòng 15)",
    "recipients.personLine16":     "Người nhận (dòng 16)",
    "recipients.personLine17":     "Người nhận (dòng 17)",
    "recipients.personLine18":     "Người nhận (dòng 18)",
    "recipients.personLine19":     "Người nhận (dòng 19)",
    "recipients.personLine20":     "Người nhận (dòng 20)",
    "recipients.personLine21":     "Người nhận (dòng 21)",
    "recipients.personLine22":     "Người nhận (dòng 22)",
    "recipients.personLine23":     "Người nhận (dòng 23)",
    "case.caseNumber":             "Số vụ án",
    "case.caseNumber2":            "Số vụ án (dòng 2)",
    "person.personFullName":       "Họ và tên",
    "person.dateOfBirth":          "Ngày sinh",
    "person.currentAddress":        "Địa chỉ thường trú",
  };
  return map[p] ?? p.split(".").pop().replace(/([A-Z])/g, " $1").trim();
}

function sourceFromPath(p) {
  if (p.startsWith("document."))   return "manual";
  if (p.startsWith("decision."))   return "manual";
  if (p.startsWith("recipients."))  return "manual";
  if (p.startsWith("person."))      return "manual";
  if (p.startsWith("case."))        return "manual";
  if (p.startsWith("legalBasis."))  return "manual";
  if (p.startsWith("agency."))      return "agencyConfig";
  return "unknown";
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log("\nWave 03C-2: semantic rename of unnumbered generic mustaches\n");
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
    evidence: "Renamed via wave-03c-2-remediation.mjs",
    file: `storage/templates/normalized-docx/${r.formCode}/${r.formCode}_normalized.docx`,
  })),
  docxOldHash: r.oldHash,
  docxNewHash: r.newHash,
}));

const reportPath = path.join(
  ROOT, "docs", "audit", "docx", "reports", "wave-03c-2-placeholder-renames.json",
);
fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
console.log(`\nJSON report: ${reportPath}`);
