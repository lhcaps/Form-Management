#!/usr/bin/env node
// scripts/docx-contract/generate-human-authoring-packet.mjs
// Reads remaining-remediation-decision-matrix.json and produces authoring packets.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "..", "..", "docs", "audit", "docx", "reports");

// ── Template metadata (pre-gathered from locked contracts) ────────────────────
const TEMPLATE_META = {
  "BM-001": { title: "BB lấy lời khai", formNumber: "001/HS" },
  "BM-002": { title: "BB khám nghiệm hiện trường", formNumber: "002/HS" },
  "BM-003": { title: "QĐ phê chuẩn/ không phê chuẩn Lệnh khám xét", formNumber: "003/HS" },
  "BM-021": { title: "QĐ không khởi tố vụ án hình sự", formNumber: "021/HS" },
  "BM-031": { title: "QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp", formNumber: "031/HS" },
  "BM-036": { title: "QĐ trả tự do cho người bị tạm giữ", formNumber: "036/HS" },
  "BM-044": { title: "QĐ thay thế biện pháp tạm giam", formNumber: "044/HS" },
  "BM-052": { title: "QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm", formNumber: "052/HS" },
  "BM-056": { title: "QĐ tạm hoãn xuất cảnh", formNumber: "056/HS" },
  "BM-059": { title: "QĐ gia hạn thời hạn tạm giam để truy tố 1", formNumber: "059/HS" },
  "BM-060": { title: "QĐ áp giải bị can", formNumber: "060/HS" },
  "BM-061": { title: "QĐ dẫn giải", formNumber: "061/HS" },
  "BM-063": { title: "Biên bản kê biên tài sản", formNumber: "063/HS" },
  "BM-064": { title: "QĐ huỷ bỏ biện pháp kê biên tài sản", formNumber: "064/HS" },
  "BM-065": { title: "BB về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản", formNumber: "065/HS" },
  "BM-066": { title: "Lệnh phong toả tài khoản", formNumber: "066/HS" },
  "BM-067": { title: "Biên bản phong tỏa tài khoản", formNumber: "067/HS" },
};

// Existing mustaches in each template (pre-gathered)
const EXISTING_MUSTACHES = {
  "BM-021": ["{{agency.issuePlace}}", "{{agency.parentNameUpper}}", "{{decision.decisionLine}}", "{{decision.summaryLine}}", "{{document.documentCode}}", "{{document.issuePlaceAndDateLine}}", "{{legalBasis.procedureArticlesLine}}"],
  "BM-031": ["{{agency.name}}", "{{agency.parentName}}", "{{document.documentCodeLine}}", "{{document.issuePlaceAndDateLine}}", "{{legalBasis.juvenileLegalBasisLine}}", "{{legalBasis.requestApprovalLine}}", "{{measure.article1Line}}", "{{measure.article2Line}}", "{{measure.reasonLine}}", "{{recipients.archiveLine}}", "{{recipients.investigationUnitLine}}", "{{recipients.personLine}}", "{{signature.positionTitle}}", "{{signature.signMode}}", "{{signature.signerName}}"],
  "BM-036": ["{{decision.summaryLine}}", "{{document.documentCode}}", "{{document.issuePlaceAndDateLine}}", "{{legalBasis.procedureArticlesLine}}", "{{person.fullName}}", "{{recipients.archiveLine}}", "{{recipients.executionAgencyLine}}", "{{recipients.personLine}}"],
  "BM-044": ["{{agency.nameUpper}}", "{{detentionReplacement.article1Line}}", "{{detentionReplacement.article2Line}}", "{{detentionReplacement.detentionExtensionLegalBasisLine}}", "{{detentionReplacement.detentionOrderLegalBasisLine}}", "{{detentionReplacement.durationLine}}", "{{detentionReplacement.proposalLine}}", "{{detentionReplacement.reasonLine}}", "{{document.documentCode}}", "{{document.issuePlaceAndDateLine}}", "{{legalBasis.juvenileJusticeLine}}", "{{legalBasis.procedureArticlesLine}}", "{{official.issuingAuthorityLine}}", "{{recipients.archiveLine}}", "{{recipients.executionAgencyLine}}"],
  "BM-052": ["{{agency.name}}", "{{decision.decisionLine2}}", "{{recipients.personLine6}}", "{{recipients.personLine}}"],
  "BM-056": ["{{agency.name}}", "{{agency.parentName}}", "{{document.documentCode}}", "{{document.issuePlaceAndDateLine}}", "{{measure.exitPostponementArticle2Line}}", "{{measure.exitPostponementDurationText}}", "{{measure.exitPostponementFromDateText}}", "{{measure.exitPostponementReasonLine}}", "{{measure.exitPostponementToDateText}}", "{{official.issuerTitle}}", "{{person.currentAddress}}", "{{person.dateOfBirthText}}", "{{person.ethnicity}}", "{{person.fullName}}", "{{person.genderLabel}}"],
  "BM-059": ["{{accusedDecision.legalBasisLine}}", "{{agency.name}}", "{{agency.parentName}}", "{{caseDecision.legalBasisLine}}", "{{delivery.deliveredAtText}}", "{{delivery.receiverTitle}}", "{{document.documentCode}}", "{{document.issuePlaceAndDateLine}}", "{{legalBasis.juvenileJusticeLine}}", "{{legalBasis.procedureArticlesLine}}", "{{measure.detentionExtensionArticle1Line}}", "{{measure.detentionExtensionArticle2Line}}", "{{measure.detentionExtensionDurationText}}", "{{measure.detentionExtensionFromDateText}}", "{{measure.detentionExtensionReasonLine}}"],
  "BM-060": ["{{agency.name}}", "{{decision.decisionLine10}}"],
  "BM-061": ["{{agency.name}}", "{{recipients.personLine3}}", "{{recipients.personLine}}"],
  "BM-063": ["{{agency.name}}", "{{document.fullDocumentCode8}}", "{{document.issuePlaceAndDateLine}}", "{{recipients.personLine5}}", "{{recipients.personLine}}"],
  "BM-064": ["{{agency.name}}", "{{document.issueDate4}}"],
  "BM-065": ["{{agency.name}}", "{{document.fullDocumentCode8}}", "{{recipients.personLine3}}", "{{recipients.personLine}}"],
  "BM-066": ["{{agency.name}}", "{{document.fullDocumentCode4}}", "{{recipients.personLine4}}", "{{recipients.personLine}}"],
  "BM-067": ["{{agency.name}}", "{{document.fullDocumentCode6}}", "{{recipients.personLine3}}", "{{recipients.personLine}}"],
};

// ── Field meanings ─────────────────────────────────────────────────────────────
function fieldMeaning(path) {
  const map = {
    "crimeReport.attachedItemsDescription": "Mô tả các tài liệu đính kèm trong báo cáo vụ án",
    "crimeReport.content": "Nội dung báo cáo vụ án",
    "reception.endedAtDay": "Ngày kết thúc tiếp nhận",
    "reception.endedAtMonth": "Tháng kết thúc tiếp nhận",
    "reception.endedAtTimeText": "Giờ kết thúc tiếp nhận",
    "reception.endedAtYear": "Năm kết thúc tiếp nhận",
    "reception.locationName": "Địa điểm tiếp nhận",
    "reception.startedAtDay": "Ngày bắt đầu tiếp nhận",
    "reception.startedAtMonth": "Tháng bắt đầu tiếp nhận",
    "reception.startedAtTimeText": "Giờ bắt đầu tiếp nhận",
    "reception.startedAtYear": "Năm bắt đầu tiếp nhận",
    "sourceTransfer.attachedItemsDescription": "Mô tả tài liệu đính kèm trong chuyển giao nguồn chứng cứ",
    "official.issuerTitle": "Chức danh người ký",
    "sourceAssignment.article1Line": "Dòng điều khoản Điều 1 trong phân bổ nguồn chứng cứ",
    "sourceAssignment.article2Line": "Dòng điều khoản Điều 2 trong phân bổ nguồn chứng cứ",
    "sourceAssignment.article3Line": "Dòng điều khoản Điều 3 trong phân bổ nguồn chứng cứ",
    "agency.nameUpper": "Tên viết hoa của cơ quan (biến thể viết hoa tên cơ quan)",
    "agency.bodyName": "Tên thực thể của cơ quan (tên đầy đủ/hiệu)",
    "agency.parentNameUpper": "Tên viết hoa của cơ quan cấp trên",
    "document.fullDocumentCode": "Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)",
    "document.fullDocumentCode2": "Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn)",
    "person.religion": "Tôn giáo của cá nhân",
    "recipients.personLine": "Dòng tên người nhận thông báo",
    "document.issueDate": "Ngày ban hành văn bản (ngày cụ thể)",
    "decision.decisionLine": "Dòng trích quyết định (số, ngày tháng năm, cơ quan)",
    "document.documentCode": "Mã số/ký hiệu văn bản",
  };
  return map[path] ?? path;
}

// ── Why human required ────────────────────────────────────────────────────────
function whyHumanRequired(item) {
  const { issueCode, path, notes } = item;
  const hasAnchor = item.evidence?.textBefore && item.evidence.textBefore.length > 3;
  if (notes?.includes("no safe anchor")) {
    return `Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder.`;
  }
  if (notes?.includes("variant form")) {
    return `Đây là biến thể của trường đã có (ví dụ: ${path}). Cần người review xác định xem biến thể viết hoa/đầy đủ có cần xuất hiện trong văn bản gốc hay không.`;
  }
  if (notes?.includes("covered by")) {
    return `Trường ${path} có thể đã được render gián tiếp bởi một trường compound khác. Cần người review xác nhận xem cần render riêng hay không.`;
  }
  if (!hasAnchor) {
    return `Script không tìm được anchor text đáng tin cậy trong DOCX. Người review cần đọc DOCX gốc để xác định vị trí ngữ nghĩa đúng.`;
  }
  return `Script không thể tự xác định vị trí chèn ngữ nghĩa đúng. Cần người có kiến thức pháp lý xác định nơi đặt placeholder trong văn bản.`;
}

// ── Suggested insertion area ────────────────────────────────────────────────────
function suggestedInsertionArea(item) {
  const tb = item.evidence?.textBefore ?? "";
  if (!tb) return "Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý";
  if (tb.length > 80) return `Gần: "${tb.slice(0, 80)}..."`;
  return `Gần: "${tb}"`;
}

// ── Risk label ─────────────────────────────────────────────────────────────────
function riskLabel(risk) {
  return risk === "medium" ? "⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout" : "LOW — sửa an toàn, ít ảnh hưởng layout";
}

// ── Main ───────────────────────────────────────────────────────────────────────
const matrixPath = join(REPORTS_DIR, "remaining-remediation-decision-matrix.json");
const matrix = JSON.parse(await import("node:fs").then(m => m.readFileSync(matrixPath, "utf8")));

const byDecision = {
  ACCEPT: matrix.items.filter(i => i.decision === "ACCEPT_NON_RENDERED_METADATA"),
  HUMAN: matrix.items.filter(i => i.decision === "ADD_PLACEHOLDER_HUMAN_REQUIRED"),
  LEGAL: matrix.items.filter(i => i.decision === "NEEDS_LEGAL_REVIEW"),
};

// ── 1. HUMAN-AUTHORING-PACKET.md ─────────────────────────────────────────────
function buildHumanPacket() {
  const bms = [...new Set(byDecision.HUMAN.map(i => i.templateCode))].sort();

  let md = `# Human Authoring Packet — Wave 04E\n\n`;
  md += `> Generated: ${new Date().toISOString()}\n`;
  md += `> Items: ${byDecision.HUMAN.length} field-level items across ${bms.length} BMs\n\n`;

  md += `## Summary\n\n`;
  md += `| BM | Title | Items |\n|---|---|---:|\n`;
  for (const bm of bms) {
    const items = byDecision.HUMAN.filter(i => i.templateCode === bm);
    const meta = TEMPLATE_META[bm] ?? {};
    md += `| ${bm} | ${meta.title ?? "N/A"} | ${items.length} |\n`;
  }
  md += `\n## Instructions\n\n`;
  md += `1. **Đọc DOCX gốc** cho mỗi BM cần sửa.\n`;
  md += `2. **Mở khóa DOCX** bằng cách unzip, chỉnh sửa \`word/document.xml\`, zip lại.\n`;
  md += `3. **Chèn placeholder** \`{{field.path}}\` tại vị trí được chỉ định trong bảng.\n`;
  md += `4. **Sau khi sửa DOCX**: chạy \`pnpm extract:docx:structure\` và \`pnpm extract:docx:normalize\` để cập nhật baseline.\n`;
  md += `5. **Chạy verify**: \`pnpm audit:docx:verify-locked\` để xác nhận remediation giảm.\n\n`;

  for (const bm of bms) {
    const items = byDecision.HUMAN.filter(i => i.templateCode === bm);
    const meta = TEMPLATE_META[bm] ?? {};
    const existing = EXISTING_MUSTACHES[bm] ?? [];

    md += `---\n\n## ${bm} — ${meta.title ?? "N/A"}\n\n`;
    md += `**Form number:** ${meta.formNumber ?? "N/A"}\n\n`;
    md += `**Existing mustaches in template:**\n`;
    if (existing.length) {
      md += existing.map(m => `- ${m}`).join("\n") + "\n";
    } else {
      md += `*(none found)*\n`;
    }
    md += `\n### Required Human Edits\n\n`;
    md += `| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |\n`;
    md += `|---|---|---|---|---|---|\n`;

    items.forEach((item, idx) => {
      const placeholder = `{{${item.path}}}`;
      md += `| ${idx + 1} | \`${placeholder}\` | ${fieldMeaning(item.path)} | ${whyHumanRequired(item)} | ${suggestedInsertionArea(item)} | ${riskLabel(item.risk)} |\n`;
    });

    md += `\n### Reviewer Questions\n\n`;
    md += items.map((item, idx) => {
      const placeholder = `{{${item.path}}}`;
      return `**Item ${idx + 1}: \`${placeholder}\`**\n` +
        `- Trường "${item.path}" (${fieldMeaning(item.path)}) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?\n` +
        `- Nếu CÓ: đặt \`${placeholder}\` ở đâu trong văn bản là ngữ nghĩa nhất?\n` +
        `- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?\n`;
    }).join("\n");

    md += `\n### Evidence\n\n`;
    items.forEach((item, idx) => {
      md += `**Item ${idx + 1}: \`{{${item.path}}}\`**\n` +
        `- Issue: \`${item.issueCode}\`\n` +
        `- Slot tồn tại: ${item.evidence.slotExists ? "YES" : "NO"}\n` +
        `- Field tồn tại: ${item.evidence.fieldExists ? "YES" : "NO"}\n` +
        `- Binding tồn tại: ${item.evidence.bindingExists ? "YES" : "NO"}\n` +
        `- Placeholder trong DOCX: ${item.evidence.placeholderExistsInDocx ? "YES" : "NO"}\n` +
        `- rawPattern: \`${item.evidence.rawPattern || "(none)"}\`\n` +
        `- Anchor text (textBefore): \`${item.evidence.textBefore || "(none)"}\`\n` +
        `- Notes: ${item.notes ?? "—"}\n\n`;
    });
  }

  md += `\n---\n\n*End of Human Authoring Packet*\n`;
  return md;
}

// ── 2. HUMAN-AUTHORING-PACKET.json ───────────────────────────────────────────
function buildHumanPacketJson() {
  return byDecision.HUMAN.map(item => ({
    templateCode: item.templateCode,
    templateTitle: TEMPLATE_META[item.templateCode]?.title ?? "N/A",
    formNumber: TEMPLATE_META[item.templateCode]?.formNumber ?? "N/A",
    path: item.path,
    placeholder: `{{${item.path}}}`,
    issueCode: item.issueCode,
    decision: item.decision,
    risk: item.risk,
    fieldMeaning: fieldMeaning(item.path),
    whyHumanRequired: whyHumanRequired(item),
    suggestedInsertionArea: suggestedInsertionArea(item),
    reviewerQuestions: [
      `Trường "${item.path}" (${fieldMeaning(item.path)}) đã tồn tại trong locked contract. Có nên xuất hiện trong DOCX không?`,
      `Nếu có: đặt {{${item.path}}} ở đâu trong văn bản là ngữ nghĩa nhất?`,
      `Nếu không: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?`,
    ],
    evidence: {
      slotExists: item.evidence.slotExists,
      fieldExists: item.evidence.fieldExists,
      bindingExists: item.evidence.bindingExists,
      placeholderExistsInDocx: item.evidence.placeholderExistsInDocx,
      rawPattern: item.evidence.rawPattern,
      textBefore: item.evidence.textBefore,
      notes: item.notes,
    },
    suggestedWave: "04E-2 (after approval)",
  }));
}

// ── 3. LEGAL-REVIEW-PACKET.md ─────────────────────────────────────────────────
function buildLegalPacket() {
  let md = `# Legal Review Packet — Wave 04E\n\n`;
  md += `> Generated: ${new Date().toISOString()}\n`;
  md += `> Items: ${byDecision.LEGAL.length} field-level items requiring legal/form-author review\n\n`;
  md += `> **AGENCY POLICY**: Do NOT modify templates without explicit legal reviewer approval.\n\n`;

  md += `## Summary\n\n`;
  md += `| BM | Field | Risk | Why Legal Review Required |\n`;
  md += `|---|---|---|---|\n`;
  byDecision.LEGAL.forEach(item => {
    const why = item.notes?.includes("regulatory basis")
      ? "Privacy/regulatory concern"
      : "Requires legal/form author judgment";
    md += `| ${item.templateCode} | \`${item.path}\` | ${riskLabel(item.risk)} | ${why} |\n`;
  });

  byDecision.LEGAL.forEach((item, idx) => {
    const meta = TEMPLATE_META[item.templateCode] ?? {};
    md += `\n---\n\n## Item ${idx + 1}: ${item.templateCode} — \`${item.path}\`\n\n`;
    md += `**Template:** ${meta.title ?? "N/A"}\n`;
    md += `**Form number:** ${meta.formNumber ?? "N/A"}\n`;
    md += `**Issue code:** \`${item.issueCode}\`\n`;
    md += `**Risk:** ${riskLabel(item.risk)}\n\n`;

    md += `### Why Legal Review Is Required\n\n`;
    md += `${item.notes ?? "No notes available."}\n\n`;

    md += `### Possible Privacy/Regulatory Concern\n\n`;
    if (item.path === "person.religion") {
      md += `- BM-056 là biện pháp tạm hoãn xuất cảnh cho người nước ngoài.\n`;
      md += `- Thu thập dữ liệu tôn giáo (\`person.religion\`) yêu cầu căn cứ pháp lý rõ ràng.\n`;
      md += `- Vietnamese PDPD / GDPR alignment: dữ liệu tôn giáo là dữ liệu nhạy cảm theo quy định.\n`;
      md += `- Cần xác định: trường này có thực sự cần thiết cho mẫu đơn này không?\n`;
    } else {
      md += `- Dữ liệu liên quan đến quyền cá nhân cần được review trước khi đưa vào template.\n`;
    }

    md += `\n### Reviewer Decision Required\n\n`;
    md += `- [ ] **APPROVE_ADD**: Cho phép thêm placeholder \`{{${item.path}}}\` vào DOCX.\n`;
    md += `- [ ] **APPROVE_METADATA_ONLY**: Giữ slot/binding trong locked contract nhưng KHÔNG render vào DOCX.\n`;
    md += `- [ ] **REMOVE**: Xoá slot và binding khỏi contract (yêu cầu form-author action sau).\n`;
    md += `- [ ] **DEFER**: Chuyển sang wave sau.\n\n`;

    md += `### Evidence\n\n`;
    md += `- Slot tồn tại trong locked contract: **${item.evidence.slotExists ? "YES" : "NO"}**\n`;
    md += `- Field tồn tại: **${item.evidence.fieldExists ? "YES" : "NO"}**\n`;
    md += `- Binding tồn tại: **${item.evidence.bindingExists ? "YES" : "NO"}**\n`;
    md += `- Placeholder trong DOCX: **${item.evidence.placeholderExistsInDocx ? "YES" : "NO"}**\n`;
    md += `- rawPattern: \`${item.evidence.rawPattern || "(none)"}\`\n`;
    md += `- textBefore: \`${item.evidence.textBefore || "(none)"}\`\n\n`;
  });

  md += `\n---\n\n*End of Legal Review Packet*\n`;
  return md;
}

// ── 4. LEGAL-REVIEW-PACKET.json ───────────────────────────────────────────────
function buildLegalPacketJson() {
  return byDecision.LEGAL.map(item => ({
    templateCode: item.templateCode,
    templateTitle: TEMPLATE_META[item.templateCode]?.title ?? "N/A",
    formNumber: TEMPLATE_META[item.templateCode]?.formNumber ?? "N/A",
    path: item.path,
    placeholder: `{{${item.path}}}`,
    issueCode: item.issueCode,
    decision: item.decision,
    risk: item.risk,
    fieldMeaning: fieldMeaning(item.path),
    whyLegalReviewRequired: item.notes ?? "Requires legal/form author judgment",
    privacyConcern: item.path === "person.religion"
      ? "Sensitive personal data (religion) — requires regulatory basis under Vietnamese PDPD and GDPR alignment."
      : "General personal data field — requires legal review.",
    possibleActions: [
      "APPROVE_ADD: Add placeholder to DOCX",
      "APPROVE_METADATA_ONLY: Keep slot/binding as non-rendered metadata",
      "REMOVE: Remove slot and binding (requires form-author action)",
      "DEFER: Defer to future wave",
    ],
    evidence: {
      slotExists: item.evidence.slotExists,
      fieldExists: item.evidence.fieldExists,
      bindingExists: item.evidence.bindingExists,
      placeholderExistsInDocx: item.evidence.placeholderExistsInDocx,
      rawPattern: item.evidence.rawPattern,
      textBefore: item.evidence.textBefore,
      notes: item.notes,
    },
    suggestedWave: "04E-2 or later (after reviewer decision)",
  }));
}

// ── 5. ACCEPTED-NON-RENDERED-METADATA.md ──────────────────────────────────────
function buildAcceptedPacket() {
  let md = `# Accepted Non-Rendered Metadata — Wave 04E\n\n`;
  md += `> Generated: ${new Date().toISOString()}\n`;
  md += `> Items: ${byDecision.ACCEPT.length} orphaned mustaches — accepted, no action required\n\n`;
  md += `## Summary\n\n`;
  md += `| BM | Path | Issue | Notes |\n`;
  md += `|---|---|---|---|\n`;
  byDecision.ACCEPT.forEach(item => {
    const notes = item.notes?.replace(/Orphaned mustache\. /g, "").replace(/\. No runtime impact\./g, "") || "—";
    md += `| ${item.templateCode} | \`${item.path}\` | \`${item.issueCode}\` | ${notes} |\n`;
  });

  md += `\n## Policy\n\n`;
  md += `These items are **accepted permanently** under current policy. They represent orphaned mustaches — DOCX has a \`{{placeholder}}\` but the locked contract has no corresponding slot/field/binding. At runtime, the mustache will appear as raw text or be silently dropped depending on the renderer.\n\n`;
  md += `**No action required** unless:\n`;
  md += `- Policy changes to require rendering of these fields.\n`;
  md += `- A future form-author review determines these fields are semantically needed.\n\n`;

  byDecision.ACCEPT.forEach((item, idx) => {
    const meta = TEMPLATE_META[item.templateCode] ?? {};
    md += `\n---\n\n## Item ${idx + 1}: ${item.templateCode} — \`${item.path}\`\n\n`;
    md += `**Template:** ${meta.title ?? "N/A"}\n`;
    md += `**Form number:** ${meta.formNumber ?? "N/A"}\n`;
    md += `**Issue:** \`${item.issueCode}\`\n\n`;
    md += `| Property | Value |\n`;
    md += `|---|---|\n`;
    md += `| Slot exists in locked contract | ${item.evidence.slotExists ? "YES" : "NO"} |\n`;
    md += `| Canonical field exists | ${item.evidence.fieldExists ? "YES" : "NO"} |\n`;
    md += `| Render binding exists | ${item.evidence.bindingExists ? "YES" : "NO"} |\n`;
    md += `| Placeholder in DOCX | ${item.evidence.placeholderExistsInDocx ? "YES" : "NO"} |\n`;
    md += `| Runtime impact | **None** |\n`;
    md += `| Render impact | **None** |\n`;
    md += `| Future action | **None** unless policy changes |\n\n`;
    md += `**Reason accepted:** ${item.recommendedAction?.replace("Accept as-is. ", "") ?? item.notes ?? "—"}\n`;
  });

  md += `\n---\n\n*End of Accepted Non-Rendered Metadata Record*\n`;
  return md;
}

// ── 6. ACCEPTED-NON-RENDERED-METADATA.json ─────────────────────────────────────
function buildAcceptedPacketJson() {
  return byDecision.ACCEPT.map(item => ({
    templateCode: item.templateCode,
    templateTitle: TEMPLATE_META[item.templateCode]?.title ?? "N/A",
    formNumber: TEMPLATE_META[item.templateCode]?.formNumber ?? "N/A",
    path: item.path,
    placeholder: `{{${item.path}}}`,
    issueCode: item.issueCode,
    decision: item.decision,
    risk: item.risk,
    fieldMeaning: fieldMeaning(item.path),
    reasonAccepted: item.recommendedAction?.replace("Accept as-is. ", "") ?? item.notes ?? "—",
    runtimeImpact: "none",
    renderImpact: "none",
    futureAction: "none unless policy changes",
    evidence: {
      slotExists: item.evidence.slotExists,
      fieldExists: item.evidence.fieldExists,
      bindingExists: item.evidence.bindingExists,
      placeholderExistsInDocx: item.evidence.placeholderExistsInDocx,
      rawPattern: item.evidence.rawPattern,
      textBefore: item.evidence.textBefore,
      notes: item.notes,
    },
    suggestedWave: "accepted (no wave)",
  }));
}

// ── Write outputs ─────────────────────────────────────────────────────────────
mkdirSync(REPORTS_DIR, { recursive: true });

const files = [
  ["HUMAN-AUTHORING-PACKET.md", buildHumanPacket()],
  ["human-authoring-packet.json", JSON.stringify(buildHumanPacketJson(), null, 2)],
  ["LEGAL-REVIEW-PACKET.md", buildLegalPacket()],
  ["legal-review-packet.json", JSON.stringify(buildLegalPacketJson(), null, 2)],
  ["ACCEPTED-NON-RENDERED-METADATA.md", buildAcceptedPacket()],
  ["accepted-non-rendered-metadata.json", JSON.stringify(buildAcceptedPacketJson(), null, 2)],
];

for (const [filename, content] of files) {
  const outPath = join(REPORTS_DIR, filename);
  writeFileSync(outPath, content, "utf8");
  console.log(`Written: ${outPath}`);
}

console.log(`\nTotal: ${files.length} files generated.`);
console.log(`  HUMAN: ${byDecision.HUMAN.length} items`);
console.log(`  LEGAL: ${byDecision.LEGAL.length} items`);
console.log(`  ACCEPTED: ${byDecision.ACCEPT.length} items`);
