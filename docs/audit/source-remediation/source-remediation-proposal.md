# C3-PREP — Source Remediation Proposal

Generated: 2026-06-25T14:39:43.687Z

## Scope

| Metric | Value |
|--------|-------|
| Contracts scanned | 213 |
| Invalid source fields | 0 |
| Binding review items | 1 |
| **Total issues** | **1** |

## By Original Source

| Original Source | Count |
|----------------|-------|
| constantFromDocx | 0 |
| derived | 0 |
| unknown | 0 |
| bindingReview (BM-021) | 1 |

## By Proposed Source

| Proposed Source | Count |
|----------------|-------|

## Confidence

| Level | Count |
|-------|-------|
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |

## BM-021 Proposals

### F4 Binding Review

Status: **REVIEW_REQUIRED**

- 1 non-required placeholder(s) left unreplaced: {{agency.nameUpper}}. These fields are not required/editable/manual and the mock did not fill them.

**Remediation note:** `agency.nameUpper` (proposedSource=computed) maps to the uppercase of the agency name. This is a 
`derived` field that should be classified as `computed` in the locked contract JSON. The F4 review item will clear automatically once the source is corrected to `computed`.

## All Proposals

| templateCode | path | originalSource | proposedSource | confidence | required |
|--------------|------|---------------|----------------|------------|----------|

## Heuristic Rules Applied

| Pattern | Proposed Source | Confidence |
|---------|----------------|------------|
| constantFromDocx + legalBasis.*Line | officialConfig | HIGH |
| constantFromDocx + agency.*Upper | computed | HIGH |
| constantFromDocx + agency.issuePlace | computed | HIGH |
| constantFromDocx + decision.summaryLine | computed | HIGH |
| constantFromDocx + caseDecision.*Line | officialConfig | HIGH |
| constantFromDocx + accusedDecision.*Line | officialConfig | HIGH |
| constantFromDocx + indictment.*Line | officialConfig | HIGH |
| constantFromDocx + juvenileProtection.*Line | officialConfig | HIGH |
| constantFromDocx + measure.detentionArticle*Line | officialConfig | HIGH |
| constantFromDocx + other *Line patterns | officialConfig | MEDIUM |
| derived + nameUpper | computed | HIGH |
| derived + date patterns | computed | HIGH |
| derived + *Line patterns | computed | HIGH |
| unknown + document.*Code* | manual | HIGH |
| unknown + decision.decisionLine | computed | HIGH |
| unknown + issuePlaceAndDateLine | computed | HIGH |
| unknown + other patterns | manual | LOW |

## Next Steps

1. **User review** this proposal — especially LOW confidence items.
2. If approved, run **C3-APPLY** to patch locked contract JSON files.
3. After C3-APPLY, re-run `pnpm audit:docx-fidelity` to confirm no regressions.
4. Verify F4 binding correctness: BM-021 should no longer appear as REVIEW_REQUIRED.
