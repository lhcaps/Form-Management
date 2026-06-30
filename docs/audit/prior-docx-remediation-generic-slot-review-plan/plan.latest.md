# PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_REVIEW_PLAN

Generated: 2026-06-26T18:49:48.343Z
Source: D:\Study\Project\QLLaw-main\docs\audit\forms-root-cause\latest.json

## Summary

- Total unique items: **16** (32 issue entries → 16 unique templateCode+path pairs)
- All labeled `Slot from DOCX remediation`
- All severity: REVIEW | Confidence: MEDIUM
- Suggested label: **none anywhere** (requiresHumanReview: true on all)
- Pattern: no visible Vietnamese label in context (raw XML rFonts/tab noise only)

## Risk breakdown

| Risk   | Count |
|--------|-------|
| HIGH   | 4 |
| MEDIUM | 12 |
| LOW    | 0 |

## Action breakdown

- `DEFER_LEGAL_REVIEW`: 4
- `DEFER_NO_CONTEXT`: 12

## Recommended first batch: 0 items

_No items qualify for batch 1. All candidates are DEFER_NO_CONTEXT (tab-dot footer pattern, decision/legal paths, or no visible VN label context). Human review is required before any labeling work can proceed._

## All items (16)

| # | Template | Path | Risk | Action |
|---|----------|------|------|--------|
1|BM-051|decision.decisionLine3|HIGH|DEFER_LEGAL_REVIEW
2|BM-052|decision.decisionLine2|HIGH|DEFER_LEGAL_REVIEW
3|BM-060|decision.decisionLine10|HIGH|DEFER_LEGAL_REVIEW
4|BM-062|decision.decisionLine11|HIGH|DEFER_LEGAL_REVIEW
5|BM-052|recipients.personLine6|MEDIUM|DEFER_NO_CONTEXT
6|BM-061|recipients.personLine3|MEDIUM|DEFER_NO_CONTEXT
7|BM-062|recipients.personLine5|MEDIUM|DEFER_NO_CONTEXT
8|BM-063|document.fullDocumentCode8|MEDIUM|DEFER_NO_CONTEXT
9|BM-063|recipients.personLine5|MEDIUM|DEFER_NO_CONTEXT
10|BM-064|document.issueDate4|MEDIUM|DEFER_NO_CONTEXT
11|BM-065|document.fullDocumentCode8|MEDIUM|DEFER_NO_CONTEXT
12|BM-065|recipients.personLine3|MEDIUM|DEFER_NO_CONTEXT
13|BM-066|document.fullDocumentCode4|MEDIUM|DEFER_NO_CONTEXT
14|BM-066|recipients.personLine4|MEDIUM|DEFER_NO_CONTEXT
15|BM-067|document.fullDocumentCode6|MEDIUM|DEFER_NO_CONTEXT
16|BM-067|recipients.personLine3|MEDIUM|DEFER_NO_CONTEXT

## Safety gates

Before applying any label changes:

1. **DEFER_LEGAL_REVIEW**: Items with `decision.*` paths require legal sign-off.
2. **DEFER_NO_CONTEXT**: Items where `context` is pure XML noise and no `suggestedLabel` exists — open locked contract, confirm visible label manually, then update plan.
3. **Batch 1**: Only proceed with items that are MEDIUM/LOW risk and have a confident suggested label from the audit.

---
_This plan is auto-generated. Do not edit manually. Re-run after audit re-run._
