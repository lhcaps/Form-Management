#!/usr/bin/env node
// scripts/audit/review-prior-docx-remediation-generic-slot-batch-1.mjs
// Evidence review for PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_1.
// Safe: reads only, writes to docs/audit/prior-docx-remediation-generic-slot-review-batch-1/.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const PLAN_JSON  = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-plan', 'plan.latest.json');
const OUT_DIR    = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-batch-1');
const OUT_REVIEW = join(OUT_DIR, 'review.latest.json');
const OUT_MD     = join(OUT_DIR, 'review.latest.md');
const OUT_DEC    = join(OUT_DIR, 'decisions.approved.json');

// Batch 1 items (from plan)
const BATCH_1 = [
  { templateCode: 'BM-063', path: 'document.fullDocumentCode8' },
  { templateCode: 'BM-063', path: 'recipients.personLine5' },
  { templateCode: 'BM-065', path: 'document.fullDocumentCode8' },
  { templateCode: 'BM-065', path: 'recipients.personLine3' },
];

// ── Evidence ─────────────────────────────────────────────────────────────────
// Source: locked contracts + paragraph extraction
// BM-063 rendered paragraphs (indices):
// [011] __DOCUMENT_FULLDOCUMENTCODE8__ngày … tháng … năm …
// [013] … Kiểm sát viên của Viện kiểm sát2__DOCUMENT_FULLDOCUMENTCODE8__;
// [014] __DOCUMENT_FULLDOCUMENTCODE8__
// [015] __DOCUMENT_FULLDOCUMENTCODE8__y ban nhân dân cấp xã;
// [016] __DOCUMENT_FULLDOCUMENTCODE8__
// [017] __DOCUMENT_FULLDOCUMENTCODE8__
// [033] __DOCUMENT_FULLDOCUMENTCODE8__ngày … tháng … năm ….
// BM-063 paragraph [021]: __RECIPIENTS_PERSONLINE5__
// BM-063 paragraph [022]: __RECIPIENTS_PERSONLINE5__
// BM-063 paragraph [025]: __RECIPIENTS_PERSONLINE5__
// BM-063 paragraph [030]: __RECIPIENTS_PERSONLINE5__
// BM-063 paragraph [031]: __RECIPIENTS_PERSONLINE5__
//
// BM-065 rendered paragraphs:
// [011] __DOCUMENT_FULLDOCUMENTCODE8__
// [013] … Kiểm sát viên của Viện kiểm sát2__DOCUMENT_FULLDOCUMENTCODE8__
// [014] __DOCUMENT_FULLDOCUMENTCODE8__
// [015] __DOCUMENT_FULLDOCUMENTCODE8__y ban nhân dân cấp xã.
// [016] __DOCUMENT_FULLDOCUMENTCODE8__
// [017] __DOCUMENT_FULLDOCUMENTCODE8__
// [029] … các tài sản như sau: __DOCUMENT_FULLDOCUMENTCODE8__
// [030] Ngay sau khi nhận được …5__DOCUMENT_FULLDOCUMENTCODE8__
// BM-065 paragraph [021]: __RECIPIENTS_PERSONLINE3__
// BM-065 paragraph [022]: __RECIPIENTS_PERSONLINE3__
// BM-065 paragraph [025]: __RECIPIENTS_PERSONLINE3__

const DECISIONS = {
  'BM-063/document.fullDocumentCode8': {
    decision: 'DEFER',
    reason: 'Body/procedural reference slot. Appears in paragraphs [011][013][014][015][016][017][033] ' +
            'with context like "ngày … tháng … năm …", "Kiểm sát viên …2", "UBND cấp xã". ' +
            'References the underlying Lệnh kê biên tài sản (procedural antecedent), not the current biên bản\'s document code. ' +
            'No visible Vietnamese label. Legitimate document.fullDocumentCode already exists in contract with label "Số văn bản". ' +
            'Path name is semantically wrong. Label-only fix insufficient.',
    category: 'DOCX_REAUTHOR_REQUIRED',
    hasVisibleLabel: false,
    suggestedLabel: null,
    slotRole: 'body_procedural_reference',
    evidenceParagraphs: ['[011]', '[013]', '[014]', '[015]', '[016]', '[017]', '[033]'],
  },
  'BM-063/recipients.personLine5': {
    decision: 'DEFER',
    reason: 'Body slot. Appears in paragraphs [021][022][025][030][031] interleaved with ' +
            'legitimate recipient fields (Tên gọi khác, Nghề nghiệp, blank placeholder lines). ' +
            'Appears empty or as a secondary blank line in the recipient data block. ' +
            'No visible label. No confident semantic mapping. Multiple instances suggest ' +
            'generic filler slots from DOCX remediation. Cannot approve without understanding ' +
            'what "Tên gọi khác" or "Nghề nghiệp" lines should contain.',
    category: 'DEFER_NO_CONTEXT',
    hasVisibleLabel: false,
    suggestedLabel: null,
    slotRole: 'body_recipient_filler',
    evidenceParagraphs: ['[021]', '[022]', '[025]', '[030]', '[031]'],
  },
  'BM-065/document.fullDocumentCode8': {
    decision: 'DEFER',
    reason: 'Body/procedural reference slot. Appears in paragraphs [011][013][014][015][016][017][029][030] ' +
            'at structural positions with context referencing Kiểm sát viên superscript, ' +
            'UBND cấp xã, and "Ngay sau khi nhận được". ' +
            'References the underlying Lệnh kê biên tài sản / Quyết định hủy bỏ that this biên bản ' +
            'is reporting on — not the current biên bản\'s own document number. ' +
            'No visible label. Legitimate document.fullDocumentCode already exists with label "Số văn bản". ' +
            'Path name is semantically wrong. DOCX_REAUTHOR_REQUIRED.',
    category: 'DOCX_REAUTHOR_REQUIRED',
    hasVisibleLabel: false,
    suggestedLabel: null,
    slotRole: 'body_procedural_reference',
    evidenceParagraphs: ['[011]', '[013]', '[014]', '[015]', '[016]', '[017]', '[029]', '[030]'],
  },
  'BM-065/recipients.personLine3': {
    decision: 'DEFER',
    reason: 'Body slot. Appears in paragraphs [021][022][025] at the same structural positions ' +
            'as BM-063 recipients.personLine5. Interleaved with legitimate recipient fields ' +
            '(Tên gọi khác, Nghề nghiệp, blank lines). No visible label. ' +
            'Multiple instances suggest generic filler slots from DOCX remediation, ' +
            'not actual recipient person data. Cannot approve without understanding ' +
            'semantic purpose of each filler position.',
    category: 'DEFER_NO_CONTEXT',
    hasVisibleLabel: false,
    suggestedLabel: null,
    slotRole: 'body_recipient_filler',
    evidenceParagraphs: ['[021]', '[022]', '[025]'],
  },
};

// ── main ─────────────────────────────────────────────────────────────────────
const plan = JSON.parse(readFileSync(PLAN_JSON, 'utf8'));

const reviewed = BATCH_1.map(({ templateCode, path }) => {
  const id = `${templateCode}/${path}`;
  const planItem = plan.items.find(i => i.id === id);
  const dec = DECISIONS[id];
  return {
    id,
    templateCode,
    sourceId: planItem?.sourceId || '',
    path,
    currentLabel: planItem?.reason?.match(/label is "([^"]+)"/)?.[1] || 'Slot from DOCX remediation',
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

const approved  = reviewed.filter(r => r.decision === 'APPROVED_LABEL');
const deferred  = reviewed.filter(r => r.decision === 'DEFER');
const legal     = reviewed.filter(r => r.decision === 'LEGAL_REVIEW');
const reauthor  = reviewed.filter(r => r.category === 'DOCX_REAUTHOR_REQUIRED');

const counts = {
  total: reviewed.length,
  approved: approved.length,
  deferred: deferred.length,
  legalReview: legal.length,
  docxReauthor: reauthor.length,
};

// decisions.approved.json — only if APPROVED_LABEL exists
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
  reviewId: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_1',
  generatedAt: new Date().toISOString(),
  sourcePlan: PLAN_JSON,
  batch: BATCH_1,
  counts,
  items: reviewed,
};

const md = `# PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_1

Generated: ${review.generatedAt}

## Summary

- Batch: BM-063 × 2, BM-065 × 2 (4 items total)
- Approved: **${counts.approved}**
- Deferred: **${counts.deferred}**
- Legal review: **${counts.legalReview}**
- DOCX reauthor required: **${counts.docxReauthor}**

## Decisions

${reviewed.map(r => `### ${r.id}\n**${r.decision}** [${r.category}]\n**Role:** ${r.slotRole}\n**Visible label:** ${r.hasVisibleLabel ? 'Yes' : 'No'}\n**Evidence paragraphs:** ${r.evidenceParagraphs.join(', ')}\n**Reason:** ${r.reason}`).join('\n\n---\n')}

## Safety

- Locked contracts mutated: **NO**
- DOCX touched: **NO**
- Source/path/binding touched: **NO**
- Compiled artifacts hand-edited: **NO**
- Global decisions modified: **NO**

## Next task

PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_2

---
_This review is auto-generated. Do not edit manually._
`;

// ── write output ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_REVIEW, JSON.stringify(review, null, 2), 'utf8');
writeFileSync(OUT_MD,     md,                              'utf8');

if (approvedDecisions.length > 0) {
  writeFileSync(OUT_DEC, JSON.stringify({ approved: approvedDecisions, generatedAt: review.generatedAt }, null, 2), 'utf8');
  console.log(`[review] Written decisions.approved.json (${approvedDecisions.length} approved)`);
} else {
  console.log('[review] No approvals → decisions.approved.json NOT written (per safety rule)');
}

console.log(`[review] Written ${OUT_REVIEW}`);
console.log(`[review] Written ${OUT_MD}`);
console.log(`[review] Counts: approved=${counts.approved} deferred=${counts.deferred} legal=${counts.legalReview} reauthor=${counts.docxReauthor}`);
