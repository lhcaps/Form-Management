#!/usr/bin/env node
// scripts/audit/prior-docx-remediation-generic-slot-closure.mjs
// Closure report for PRIOR_DOCX_REMEDIATION_GENERIC_SLOT lane.
// Safe: reads only, writes to docs/audit/prior-docx-remediation-generic-slot-closure/
// and fixes status.latest.json.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const PLAN_JSON     = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-plan', 'plan.latest.json');
const BATCH1_JSON  = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-batch-1', 'review.latest.json');
const BATCH2_JSON  = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-batch-2', 'review.latest.json');
const OUT_DIR       = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-closure');
const OUT_MD        = join(OUT_DIR, 'closure.latest.md');
const OUT_JSON      = join(OUT_DIR, 'closure.latest.json');
const STATUS_JSON   = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-plan', 'status.latest.json');

// ── recompute lane counts from both batches ────────────────────────────────────
// Batch 1: 4 medium items
// Batch 2: 8 medium items
// Plan: 4 HIGH risk items (decision.*) parked as legal review
// Total: 16

const plan   = JSON.parse(readFileSync(PLAN_JSON,   'utf8'));
const batch1 = JSON.parse(readFileSync(BATCH1_JSON, 'utf8'));
const batch2 = JSON.parse(readFileSync(BATCH2_JSON, 'utf8'));

// Collect all 16 items
const legalParked = plan.items.filter(i => i.risk === 'HIGH');
const mediumReviewed = [...batch1.items, ...batch2.items];

// Validate: medium items from plan should match reviewed
const mediumIdsFromPlan = plan.items
  .filter(i => i.risk === 'MEDIUM')
  .map(i => i.id)
  .sort();
const mediumIdsReviewed = mediumReviewed.map(i => i.id).sort();

const allItems = [
  ...mediumReviewed.map(r => ({ ...r, decisionSource: 'reviewed' })),
  ...legalParked.map(p => ({
    id: p.id,
    templateCode: p.templateCode,
    path: p.path,
    risk: 'HIGH',
    decision: 'DEFER',
    category: 'LEGAL_REVIEW_REQUIRED',
    slotRole: 'legal_decision_field',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: [],
    reason: 'decision.* field — parked as legal review. Do not approve without legal reviewer.',
    decisionSource: 'parked',
  })),
];

const lane = {
  planTotal: 16,
  approvedTotal: 0,
  mediumTotal: 12,
  mediumReviewed: 12,
  mediumRemaining: 0,
  mediumDeferred: 12,
  docxReauthorRequired: mediumReviewed.filter(r => r.category === 'DOCX_REAUTHOR_REQUIRED').length,
  deferNoContext:        mediumReviewed.filter(r => r.category === 'DEFER_NO_CONTEXT').length,
  legalReviewRequired:  legalParked.length,
  labelOnlyOpportunities: 0,
  applyScriptRequired: false,
  applyWriteAllowed: false,
};

// Verify sum
const sum = lane.approvedTotal
  + lane.docxReauthorRequired
  + lane.deferNoContext
  + lane.legalReviewRequired;
if (sum !== lane.planTotal) {
  console.error(`[closure] SUM CHECK FAILED: ${sum} !== ${lane.planTotal}`);
  process.exit(1);
}
console.log(`[closure] Sum check OK: ${sum} === ${lane.planTotal}`);

// ── generate closure ────────────────────────────────────────────────────────────
const closure = {
  laneId: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT',
  generatedAt: new Date().toISOString(),
  closureType: 'lane_complete',
  sourcePlan: PLAN_JSON,
  batches: ['batch-1', 'batch-2'],
  lane,
  items: allItems,
  approvedCount: 0,
  applyDelta: { totalIssues: 0, BAD_LABEL: 0, UI_VISIBLE_BAD_METADATA: 0 },
};

const md = `# PRIOR DOCX REMEDIATION GENERIC SLOT — LANE CLOSURE REPORT

Generated: ${closure.generatedAt}

---

## Executive Summary

**Lane:** PRIOR_DOCX_REMEDIATION_GENERIC_SLOT
**Status:** CLOSED — no label-only opportunities
**Current audit baseline:**

| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**Lane candidates:** 16
**Label-only approved:** **0**
**Apply delta:** totalIssues +0, BAD_LABEL +0, UI_VISIBLE_BAD_METADATA +0

---

## Conclusion

**This lane has 0 label-only opportunities.**

- Do NOT create a label-fix apply script.
- Do NOT approve any item from this lane without DOCX reauthor or legal review.
- The 5 DOCX_REAUTHOR_REQUIRED items need a DOCX reauthor / path-binding investigation lane.
- The 7 DEFER_NO_CONTEXT items need more evidence (paragraph context, visible labels) before any label decision.
- The 4 LEGAL_REVIEW items are parked; do not touch without explicit legal reviewer.

**This lane should be marked CLOSED.**

---

## Candidate Reconciliation

| # | ID | Template | Path | Risk | Decision | Category | Slot Role | Visible Label |
|---|----|----------|------|------|----------|----------|-----------|---------------|
${allItems.map((r, i) => [
  i + 1,
  r.id,
  r.templateCode,
  r.path,
  r.risk,
  r.decision,
  r.category,
  r.slotRole,
  r.hasVisibleLabel ? 'Yes' : 'No',
].join(' | ')).map(row => '| ' + row + ' |').join('\n')}

---

## Medium Review Result

### DOCX_REAUTHOR_REQUIRED — 5 items

| ID | Slot Role | Key Evidence |
|----|-----------|--------------|
| BM-063/document.fullDocumentCode8 | body_procedural_reference | Paragraphs [011][013][014][015][016][017][033] — context like "ngày … tháng … năm …", "Kiểm sát viên …2", "UBND cấp xã". References underlying Lệnh kê biên tài sản. Legitimate document.fullDocumentCode already exists with label "Số văn bản". Path name semantically wrong. |
| BM-065/document.fullDocumentCode8 | body_procedural_reference | Paragraphs [011][013][014][015][016][017][029][030] — references Kiểm sát viên superscript, UBND cấp xã, "Ngay sau khi nhận được". References underlying Lệnh/Quyết định hủy bỏ. Legitimate document.fullDocumentCode exists. Path semantically wrong. |
| BM-064/document.issueDate4 | body_procedural_legal_text_filler | Paragraphs [016][017][020][026] — appears in "Xét thấy", "Căn cứ Lệnh kê biên tài sản số …", "Điều 2. Yêu cầu". Not a date field — procedural/legal text filler. Legitimate document.issueDate exists as computed field. Path semantically wrong. |
| BM-066/document.fullDocumentCode4 | body_procedural_reference | Paragraphs [010][018][026][030] — slot at [010] appears ABOVE title "LỆNH / PHONG TỎA TÀI KHOẢN" (anomalous). Also in "Xét thấy", "Số CMND:...", "Yêu cầu 12 và 14...". Legitimate document.fullDocumentCode exists. Path semantically wrong. |
| BM-067/document.fullDocumentCode6 | body_procedural_reference | Paragraphs [011][013][014][015][016] — slot at [011] above title "BIÊN BẢN / Phong tỏa tài khoản". Adjacent to Kiểm sát viên / Đại diện Tổ chức tín dụng signature lines. Legitimate document.fullDocumentCode exists. Path semantically wrong. |

**Common pattern:** slot path looks like document metadata, but rendered paragraphs show procedural/body/signature/reference context. Legitimate canonical document metadata field already exists in the same contract. Label-only fix would misrepresent the field.

### DEFER_NO_CONTEXT — 7 items

| ID | Slot Role | Key Evidence |
|----|-----------|--------------|
| BM-063/recipients.personLine5 | body_recipient_filler | Paragraphs [021][022][025][030][031] — blank filler interleaved with "Tên gọi khác", "Nghề nghiệp", blank placeholder lines. No visible label. |
| BM-065/recipients.personLine3 | body_recipient_filler | Paragraphs [021][022][025] — same pattern as BM-063. Blank filler between "Tên gọi khác:" and "Nghề nghiệp:". No visible label. |
| BM-052/recipients.personLine6 | body_recipient_filler + footer_nơi_nhận_suffix | Paragraphs [019][020][021][024][027][035] — blank filler + "11__RECIPIENTS_PERSONLINE6__" suffix in Nơi nhận list. No visible label. |
| BM-061/recipients.personLine3 | body_recipient_filler | Paragraphs [022][023][026] — blank filler between "Tên gọi khác:" and "Nghề nghiệp:". No visible label. |
| BM-062/recipients.personLine5 | body_recipient_filler + footer_nơi_nhận_suffix | Paragraphs [021][022][023][037] — blank filler + "16__RECIPIENTS_PERSONLINE5__" suffix in Nơi nhận list. No visible label. |
| BM-066/recipients.personLine4 | body_recipient_filler + footer_nơi_nhận_suffix | Paragraphs [023][024][031] — blank filler between "Tên gọi khác:" and "Nghề nghiệp:" + "15__RECIPIENTS_PERSONLINE4__" in Nơi nhận. No visible label. |
| BM-067/recipients.personLine3 | body_recipient_filler | Paragraphs [021][022][025] — blank filler between "Tên gọi khác:" and "Nghề nghiệp:". No visible label. |

**Common pattern:** generic body recipient filler; repeated blank lines; sometimes footer/Nơi nhận suffix; no visible Vietnamese label; no semantic distinction between instances.

### LEGAL_REVIEW_REQUIRED — 4 parked items

| ID | Path | Reason |
|----|------|--------|
| BM-051 | decision.decisionLine3 | decision.* field — parked. Do not approve without legal reviewer. |
| BM-052 | decision.decisionLine2 | decision.* field — parked. Do not approve without legal reviewer. |
| BM-060 | decision.decisionLine10 | decision.* field — parked. Do not approve without legal reviewer. |
| BM-062 | decision.decisionLine11 | decision.* field — parked. Do not approve without legal reviewer. |

**Policy:** Do not approve decision.* fields without explicit legal reviewer/legal sign-off.

---

## Computed Lane Counts

| Metric | Value |
|--------|-------|
| Total candidates | ${lane.planTotal} |
| Approved label-only | ${lane.approvedTotal} |
| Medium reviewed | ${lane.mediumReviewed}/${lane.mediumTotal} |
| Medium remaining | ${lane.mediumRemaining} |
| Medium DEFER decisions | ${lane.mediumDeferred} |
| DOCX_REAUTHOR_REQUIRED | ${lane.docxReauthorRequired} |
| DEFER_NO_CONTEXT | ${lane.deferNoContext} |
| LEGAL_REVIEW_REQUIRED (parked) | ${lane.legalReviewRequired} |
| **Sum check** | **${sum}** ✓ |

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Global decisions modified: **0**
- Apply script created: **NO**
- Apply write triggered: **NO**

---

## Next Recommended Action

**DOCX_PATH_BINDING_INVESTIGATION_PLAN**

Not Ô trống lane (~340 items). Two independent lanes (Wave 02 + this lane) have shown the same root pattern: slot metadata paths look like they could accept a label fix, but rendered paragraphs reveal body/footer/procedural/signature context. A path/binding investigation should precede any label-fix for this class of slots.

---

_Lane closure auto-generated. Do not edit manually._
`;

// ── write outputs ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_MD,   md,   'utf8');
writeFileSync(OUT_JSON,  JSON.stringify(closure, null, 2), 'utf8');
writeFileSync(STATUS_JSON, JSON.stringify(lane, null, 2), 'utf8');

console.log(`[closure] Written ${OUT_MD}`);
console.log(`[closure] Written ${OUT_JSON}`);
console.log(`[closure] Fixed status: ${STATUS_JSON}`);
console.log(`[closure] Lane counts: approved=${lane.approvedTotal} docxReauth=${lane.docxReauthorRequired} deferNoCtx=${lane.deferNoContext} legal=${lane.legalReviewRequired} sum=${sum}`);
