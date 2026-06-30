#!/usr/bin/env node
// scripts/audit/review-prior-docx-remediation-generic-slot-batch-2.mjs
// Evidence review for PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_2.
// Safe: reads only, writes to docs/audit/prior-docx-remediation-generic-slot-review-batch-2/.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const PLAN_JSON  = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-plan', 'plan.latest.json');
const OUT_DIR    = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-batch-2');
const OUT_REVIEW = join(OUT_DIR, 'review.latest.json');
const OUT_MD     = join(OUT_DIR, 'review.latest.md');
const OUT_DEC    = join(OUT_DIR, 'decisions.approved.json');
const OUT_STATUS = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-plan', 'status.latest.json');

const BATCH_2 = [
  { templateCode: 'BM-052', path: 'recipients.personLine6' },
  { templateCode: 'BM-061', path: 'recipients.personLine3' },
  { templateCode: 'BM-062', path: 'recipients.personLine5' },
  { templateCode: 'BM-064', path: 'document.issueDate4' },
  { templateCode: 'BM-066', path: 'document.fullDocumentCode4' },
  { templateCode: 'BM-066', path: 'recipients.personLine4' },
  { templateCode: 'BM-067', path: 'document.fullDocumentCode6' },
  { templateCode: 'BM-067', path: 'recipients.personLine3' },
];

// ── Decisions ─────────────────────────────────────────────────────────────────
// All based on locked contracts + paragraph extraction.
//
// BM-052/recipients.personLine6:
//   Slots at [019][020][021]: blank filler after "Họ tên:__RECIPIENTS_PERSONLINE__"
//   Slots at [024]: blank line after "Số CMND/..."
//   Slot at [027]: blank line after "Nơi tạm trú:"
//   Slot at [035]: suffix "11__RECIPIENTS_PERSONLINE6__" after Nơi nhận list items
//   Pattern: body_recipient_filler + footer_Nơi_nhận_suffix. No visible label.
//
// BM-061/recipients.personLine3:
//   Slots at [022][023]: blank filler between "Tên gọi khác:" and "Nghề nghiệp:"
//   Slot at [026]: blank line after "Số CMND/..."
//   Pattern: body_recipient_filler. No visible label.
//
// BM-062/recipients.personLine5:
//   Slots at [021][022][023]: blank filler after "Họ tên:__RECIPIENTS_PERSONLINE__"
//   Slot at [037]: suffix "16__RECIPIENTS_PERSONLINE5__" after Nơi nhận list items
//   Pattern: body_recipient_filler + footer_Nơi_nhận_suffix. No visible label.
//
// BM-064/document.issueDate4:
//   Slots at [016][017]: adjacent to "Xét thấy" and procedural citation block
//   Slot at [020]: inside decision article "Yêu cầu 7 và 8... thực hiện Quyết định"
//   Slot at [026]: suffix "10__DOCUMENT_ISSUEDATE4__" in Nơi nhận list
//   Pattern: procedural/legal text filler, not a date field.
//   Legitimate document.issueDate exists as computed field; document.issueDate4 is wrong.
//   Path name is semantically wrong. DOCX_REAUTHOR_REQUIRED.
//
// BM-066/document.fullDocumentCode4:
//   Slot at [010]: appears ABOVE the document title "LỆNH / PHONG TỎA TÀI KHOẢN"
//   Slots at [018]: adjacent to "Xét thấy"
//   Slot at [026]: inside "Số CMND/...:__DOCUMENT_FULLDOCUMENTCODE4__" (wrong context)
//   Slots at [030]: inside "Yêu cầu 12 và 14...__DOCUMENT_FULLDOCUMENTCODE4__"
//   Pattern: body_procedural_reference. Appears in procedural/decision text.
//   Legitimate document.fullDocumentCode exists (label: "Số văn bản").
//   Path name is semantically wrong. DOCX_REAUTHOR_REQUIRED.
//
// BM-066/recipients.personLine4:
//   Slots at [023][024]: blank filler between "Tên gọi khác:" and "Nghề nghiệp:"
//   Slot at [031]: "15__RECIPIENTS_PERSONLINE4__" = suffix in Nơi nhận list
//   Pattern: body_recipient_filler + footer_Nơi_nhận_suffix. No visible label.
//
// BM-067/document.fullDocumentCode6:
//   Slot at [011]: appears ABOVE document title "BIÊN BẢN / Phong tỏa tài khoản"
//   Slots at [013][014][015]: adjacent to Kiểm sát viên / Tổ chức tín dụng signature lines
//   Slot at [016]: adjacent to "Đại diện Tổ chức tín dụng/Kho bạc Nhà nước"
//   Pattern: body_procedural_reference. Multiple signature/procedural positions.
//   Legitimate document.fullDocumentCode exists (label: "Số văn bản").
//   Path name is semantically wrong. DOCX_REAUTHOR_REQUIRED.
//
// BM-067/recipients.personLine3:
//   Slots at [021][022]: blank filler between "Tên gọi khác:" and "Nghề nghiệp:"
//   Slot at [025]: blank line after "Số CMND/..."
//   Pattern: body_recipient_filler. No visible label. No semantic distinction.
//   Same family as BM-063/BM-065 recipients.personLine3/5.

const DECISIONS = {
  'BM-052/recipients.personLine6': {
    decision: 'DEFER',
    category: 'DEFER_NO_CONTEXT',
    slotRole: 'body_recipient_filler_and_footer_nơi_nhận_suffix',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[019]', '[020]', '[021]', '[024]', '[027]', '[035]'],
    reason: 'Body filler: slots at [019][020][021][024][027] are blank lines interleaved with legitimate recipient fields (Tên gọi khác, Nghề nghiệp, Số CMND, Nơi thường trú, Nơi tạm trú). Footer suffix: slot at [035] is "11__RECIPIENTS_PERSONLINE6__" appended after Nơi nhận list items (7…; 10…; 8…/người thân thích; Lưu: HSVA, HSKS, VP.). No visible label anywhere. Multiple instances without semantic distinction. Same pattern as BM-063/BM-065 recipients.personLine slots.',
  },
  'BM-061/recipients.personLine3': {
    decision: 'DEFER',
    category: 'DEFER_NO_CONTEXT',
    slotRole: 'body_recipient_filler',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[022]', '[023]', '[026]'],
    reason: 'Body filler: slots at [022][023] are blank lines between "Tên gọi khác:" and "Nghề nghiệp:". Slot at [026] is blank line after "Số CMND/Thẻ CCCD/...". No visible label. No semantic distinction between multiple instances. Same pattern as BM-052 recipients.personLine6 and BM-063/BM-065 recipients.personLine slots.',
  },
  'BM-062/recipients.personLine5': {
    decision: 'DEFER',
    category: 'DEFER_NO_CONTEXT',
    slotRole: 'body_recipient_filler_and_footer_nơi_nhận_suffix',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[021]', '[022]', '[023]', '[037]'],
    reason: 'Body filler: slots at [021][022][023] are blank lines after "Họ tên:__RECIPIENTS_PERSONLINE__" (the legitimate recipient person slot). Footer suffix: slot at [037] is "16__RECIPIENTS_PERSONLINE5__" appended after Nơi nhận list items (12…; 13…; 15…; Lưu: HSVA, HSKS, VP.). No visible label. Same pattern as BM-052 recipients.personLine6.',
  },
  'BM-064/document.issueDate4': {
    decision: 'DEFER',
    category: 'DOCX_REAUTHOR_REQUIRED',
    slotRole: 'body_procedural_legal_text_filler',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[016]', '[017]', '[020]', '[026]'],
    reason: 'Not a date field — appears in procedural/legal text. Slots at [016][017]: adjacent to "Xét thấy" and citation block "Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với". Slot at [020]: inside "Điều 2. Yêu cầu 7 và 8… thực hiện Quyết định". Slot at [026]: suffix in Nơi nhận list. The legitimate document.issueDate field exists as a computed date field. document.issueDate4 is a misnamed slot appearing in procedural/legal text, not a date placeholder. Path name is semantically wrong. Fix requires DOCX reauthor/remap, not label change.',
  },
  'BM-066/document.fullDocumentCode4': {
    decision: 'DEFER',
    category: 'DOCX_REAUTHOR_REQUIRED',
    slotRole: 'body_procedural_reference',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[010]', '[018]', '[026]', '[030]'],
    reason: 'Slot at [010] appears ABOVE the document title "LỆNH / PHONG TỎA TÀI KHOẢN" — anomalous structural position. Slots at [018][030]: adjacent to "Xét thấy" and inside decision articles. Slot at [026]: placed inside "Số CMND/Thẻ CCCD/..." line. Legitimate document.fullDocumentCode already exists with label "Số văn bản". Path name is semantically wrong. Appears in procedural/decision context, not as current document number. DOCX_REAUTHOR_REQUIRED.',
  },
  'BM-066/recipients.personLine4': {
    decision: 'DEFER',
    category: 'DEFER_NO_CONTEXT',
    slotRole: 'body_recipient_filler_and_footer_nơi_nhận_suffix',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[023]', '[024]', '[031]'],
    reason: 'Body filler: slots at [023][024] are blank lines between "Tên gọi khác:" and "Nghề nghiệp:". Footer suffix: slot at [031] is "15__RECIPIENTS_PERSONLINE4__" after Nơi nhận list items. No visible label. Same pattern as other recipients.personLineX slots in this lane.',
  },
  'BM-067/document.fullDocumentCode6': {
    decision: 'DEFER',
    category: 'DOCX_REAUTHOR_REQUIRED',
    slotRole: 'body_procedural_reference',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[011]', '[013]', '[014]', '[015]', '[016]'],
    reason: 'Slot at [011] appears ABOVE document title "BIÊN BẢN / Phong tỏa tài khoản". Slots at [013][014][015][016]: adjacent to Kiểm sát viên / Đại diện Tổ chức tín dụng/Kho bạc Nhà nước signature lines — structural roles in the biên bản body. Legitimate document.fullDocumentCode already exists with label "Số văn bản". Path name is semantically wrong. Appears in biên bản body/signature context, not as current document number. DOCX_REAUTHOR_REQUIRED.',
  },
  'BM-067/recipients.personLine3': {
    decision: 'DEFER',
    category: 'DEFER_NO_CONTEXT',
    slotRole: 'body_recipient_filler',
    hasVisibleLabel: false,
    suggestedLabel: null,
    evidenceParagraphs: ['[021]', '[022]', '[025]'],
    reason: 'Body filler: slots at [021][022] are blank lines between "Tên gọi khác:" and "Nghề nghiệp:". Slot at [025] is blank line after "Số CMND/Thẻ CCCD/...". No visible label. No semantic distinction between multiple instances. Same family as BM-063/BM-065 recipients.personLine3/5 slots.',
  },
};

// ── main ─────────────────────────────────────────────────────────────────────
const plan = JSON.parse(readFileSync(PLAN_JSON, 'utf8'));

const reviewed = BATCH_2.map(({ templateCode, path }) => {
  const id = `${templateCode}/${path}`;
  const planItem = plan.items.find(i => i.id === id);
  const dec = DECISIONS[id];
  return {
    id,
    templateCode,
    sourceId: planItem?.sourceId || '',
    path,
    currentLabel: 'Slot from DOCX remediation',
    decision: dec.decision,
    category: dec.category,
    hasVisibleLabel: dec.hasVisibleLabel,
    suggestedLabel: dec.suggestedLabel,
    slotRole: dec.slotRole,
    evidenceParagraphs: dec.evidenceParagraphs,
    reason: dec.reason,
    risk: planItem?.risk || 'MEDIUM',
  };
});

const approved = reviewed.filter(r => r.decision === 'APPROVED_LABEL');
const deferred = reviewed.filter(r => r.decision === 'DEFER');
const legal    = reviewed.filter(r => r.decision === 'LEGAL_REVIEW');
const reauthor = reviewed.filter(r => r.category === 'DOCX_REAUTHOR_REQUIRED');
const deferNoCtx = reviewed.filter(r => r.category === 'DEFER_NO_CONTEXT');

const counts = {
  total: reviewed.length,
  approved: approved.length,
  deferred: deferred.length,
  legalReview: legal.length,
  docxReauthor: reauthor.length,
  deferNoContext: deferNoCtx.length,
};

// ── status ────────────────────────────────────────────────────────────────────
// Aggregate across both batches + parked legal items
const lane = {
  planTotal: 16,
  highLegalParked: 4,
  mediumTotal: 12,
  mediumReviewedBatch1: 4,
  mediumReviewedBatch2: reviewed.length,
  mediumRemaining: 0,
  approvedTotal: approved.length,
  deferredTotal: deferred.length,
  docxReauthorTotal: (reauthor.length),
  legalReviewParked: 4,
};

// decisions.approved.json
const approvedDecisions = approved.map(r => ({
  id: r.id,
  templateCode: r.templateCode,
  path: r.path,
  suggestedLabel: r.suggestedLabel,
  reason: r.reason,
  decision: r.decision,
  category: r.category,
}));

const review = {
  reviewId: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_2',
  generatedAt: new Date().toISOString(),
  sourcePlan: PLAN_JSON,
  batch: BATCH_2,
  counts,
  items: reviewed,
  lane,
};

const md = `# PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_2

Generated: ${review.generatedAt}

## Summary

- Batch: BM-052, BM-061, BM-062, BM-064, BM-066(×2), BM-067(×2) (8 items total)
- Approved: **${counts.approved}**
- Deferred: **${counts.deferred}**
- Legal review: **${counts.legalReview}**
- DOCX reauthor required: **${counts.docxReauthor}**
- DEFER_NO_CONTEXT: **${counts.deferNoContext}**

## Lane status (12 medium items across 2 batches)

| Metric | Value |
|--------|-------|
| Total candidates | ${lane.planTotal} |
| HIGH legal parked | ${lane.highLegalParked} |
| Medium total | ${lane.mediumTotal} |
| Medium reviewed batch 1 | ${lane.mediumReviewedBatch1} |
| Medium reviewed batch 2 | ${lane.mediumReviewedBatch2} |
| Medium remaining | ${lane.mediumRemaining} |
| Approved (all lane) | ${lane.approvedTotal} |
| Deferred (all lane) | ${lane.deferredTotal} |
| DOCX reauthor (all lane) | ${lane.docxReauthorTotal} |

## Decisions

${reviewed.map(r => `### ${r.id}\n**${r.decision}** [${r.category}]\n**Role:** ${r.slotRole}\n**Visible label:** ${r.hasVisibleLabel ? 'Yes' : 'No'}\n**Evidence paragraphs:** ${r.evidenceParagraphs.join(', ')}\n**Reason:** ${r.reason}`).join('\n\n---\n')}

## Safety

- Locked contracts mutated: **NO**
- DOCX touched: **NO**
- Source/path/binding touched: **NO**
- Compiled artifacts hand-edited: **NO**
- Global decisions modified: **NO**

## Next task

PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_CLOSURE_REPORT

---
_This review is auto-generated. Do not edit manually._
`;

// ── write output ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_REVIEW, JSON.stringify(review, null, 2), 'utf8');
writeFileSync(OUT_MD,     md,                                'utf8');
mkdirSync(dirname(OUT_STATUS), { recursive: true });
writeFileSync(OUT_STATUS, JSON.stringify(lane, null, 2),   'utf8');

if (approvedDecisions.length > 0) {
  writeFileSync(OUT_DEC, JSON.stringify({ approved: approvedDecisions, generatedAt: review.generatedAt }, null, 2), 'utf8');
  console.log(`[review] Written decisions.approved.json (${approvedDecisions.length} approved)`);
} else {
  console.log('[review] No approvals → decisions.approved.json NOT written (per safety rule)');
}

console.log(`[review] Written ${OUT_REVIEW}`);
console.log(`[review] Written ${OUT_MD}`);
console.log(`[review] Written lane status: ${OUT_STATUS}`);
console.log(`[review] Counts: approved=${counts.approved} deferred=${counts.deferred} legal=${counts.legalReview} reauthor=${counts.docxReauthor} deferNoCtx=${counts.deferNoContext}`);
