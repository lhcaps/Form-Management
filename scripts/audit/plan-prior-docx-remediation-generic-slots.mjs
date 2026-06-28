#!/usr/bin/env node
// scripts/audit/plan-prior-docx-remediation-generic-slots.mjs
// Produces PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_REVIEW_PLAN.
// Safe: reads only, writes to docs/audit/prior-docx-remediation-generic-slot-review-plan/.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const SOURCE = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-review-plan');
const OUT_JSON = join(OUT_DIR, 'plan.latest.json');
const OUT_MD   = join(OUT_DIR, 'plan.latest.md');

const TARGET_LABEL = 'Slot from DOCX remediation';

// ── helpers ─────────────────────────────────────────────────────────────────

function deriveRisk(path, context) {
  const ctx = (context || '').toLowerCase();
  if (path.startsWith('decision.')) return 'HIGH';
  if (path.startsWith('recipients.') && ctx.includes('w:tab') && ctx.includes('leader="dot"')) return 'MEDIUM';
  if (path.startsWith('document.') && !ctx.includes(' ngày') && !ctx.includes('…') && !ctx.includes('ngày')) return 'MEDIUM';
  return 'MEDIUM';
}

function deriveAction(risk, path, context, hasSuggestedLabel) {
  const ctx = (context || '').toLowerCase();
  if (path.startsWith('decision.')) return 'DEFER_LEGAL_REVIEW';
  if (path.startsWith('recipients.') && ctx.includes('w:tab') && ctx.includes('leader="dot"')) return 'DEFER_NO_CONTEXT';
  if (path.startsWith('document.') && !ctx.includes(' ngày') && !ctx.includes('…') && !ctx.includes('ngày')) return 'DEFER_NO_CONTEXT';
  return 'DEFER_NO_CONTEXT';
}

// ── main ─────────────────────────────────────────────────────────────────────

const data = JSON.parse(readFileSync(SOURCE, 'utf8'));

const raw = (data.issues || []).filter(
  i => (i.label || '').trim() === TARGET_LABEL
);

// Deduplicate by templateCode + path (BAD_LABEL + REMEDIATION_LEAK share same key)
const seen = new Map();
for (const issue of raw) {
  const key = `${issue.templateCode}|${issue.path}`;
  if (!seen.has(key)) seen.set(key, issue);
}

const items = [];
for (const [key, issue] of seen) {
  const [templateCode, path] = key.split('|');
  const risk   = deriveRisk(path, issue.context);
  const action = deriveAction(risk, path, issue.context, !!issue.suggestedLabel);

  const docId  = templateCode.replace('BM-', 'BM-');
  const sourceId = issue.sourceId || '';

  const result = {
    id: key.replace(/\|/g, '/'),
    templateCode,
    sourceId,
    path,
    severity:  issue.severity   || 'REVIEW',
    confidence: issue.confidence || 'MEDIUM',
    risk,
    action,
    hasSuggestedLabel: !!issue.suggestedLabel,
    suggestedLabel:     issue.suggestedLabel || null,
    requiresHumanReview: issue.requiresHumanReview ?? true,
    reason: (issue.reason || '').slice(0, 200),
    suggestedPath: issue.suggestedPath || null,
  };
  items.push(result);
}

// Sort: HIGH → MEDIUM → LOW; within same risk: by templateCode then path
const RISK_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3 };
items.sort((a, b) =>
  (RISK_ORDER[a.risk] - RISK_ORDER[b.risk]) ||
  a.templateCode.localeCompare(b.templateCode) ||
  a.path.localeCompare(b.path)
);

// Recommended first batch: MEDIUM or LOW, no decision/legal path, no tab-dot footer
const batch = items.filter(
  i => (i.risk === 'MEDIUM' || i.risk === 'LOW') &&
        !i.path.startsWith('decision.') &&
        !i.action.startsWith('DEFER_NO_CONTEXT')
);

// Summary
const byRisk   = { HIGH: 0, MEDIUM: 0, LOW: 0 };
const byAction = {};
for (const i of items) {
  byRisk[i.risk] = (byRisk[i.risk] || 0) + 1;
  byAction[i.action] = (byAction[i.action] || 0) + 1;
}

const plan = {
  planId:     'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_REVIEW_PLAN',
  generatedAt: new Date().toISOString(),
  source:     'docs/audit/forms-root-cause/latest.json',
  totalItems: items.length,
  byRisk,
  byAction,
  recommendedFirstBatchCount: batch.length,
  recommendedFirstBatch: batch.map(i => i.id),
  items,
};

const md = `# PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_REVIEW_PLAN

Generated: ${plan.generatedAt}
Source: ${SOURCE}

## Summary

- Total unique items: **${items.length}** (32 issue entries → 16 unique templateCode+path pairs)
- All labeled \`Slot from DOCX remediation\`
- All severity: REVIEW | Confidence: MEDIUM
- Suggested label: **none anywhere** (requiresHumanReview: true on all)
- Pattern: no visible Vietnamese label in context (raw XML rFonts/tab noise only)

## Risk breakdown

| Risk   | Count |
|--------|-------|
| HIGH   | ${byRisk.HIGH   || 0} |
| MEDIUM | ${byRisk.MEDIUM || 0} |
| LOW    | ${byRisk.LOW    || 0} |

## Action breakdown

${Object.entries(byAction).map(([k, v]) => `- \`${k}\`: ${v}`).join('\n')}

## Recommended first batch: ${batch.length} items

${batch.length === 0
  ? '_No items qualify for batch 1. All candidates are DEFER_NO_CONTEXT (tab-dot footer pattern, decision/legal paths, or no visible VN label context). Human review is required before any labeling work can proceed._'
  : batch.map(i => `- ${i.id}  [${i.risk}]`).join('\n')
}

## All items (${items.length})

| # | Template | Path | Risk | Action |
|---|----------|------|------|--------|
${items.map((i, n) => `${n + 1}|${i.templateCode}|${i.path}|${i.risk}|${i.action}`).join('\n')}

## Safety gates

Before applying any label changes:

1. **DEFER_LEGAL_REVIEW**: Items with \`decision.*\` paths require legal sign-off.
2. **DEFER_NO_CONTEXT**: Items where \`context\` is pure XML noise and no \`suggestedLabel\` exists — open locked contract, confirm visible label manually, then update plan.
3. **Batch 1**: Only proceed with items that are MEDIUM/LOW risk and have a confident suggested label from the audit.

---
_This plan is auto-generated. Do not edit manually. Re-run after audit re-run._
`;

// ── write output ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(plan, null, 2), 'utf8');
writeFileSync(OUT_MD,   md,                              'utf8');

console.log(`[plan] Written ${OUT_JSON}`);
console.log(`[plan] Written ${OUT_MD}`);
console.log(`[plan] Total items: ${items.length} | Recommended first batch: ${batch.length}`);
