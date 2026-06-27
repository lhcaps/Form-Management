# Planner Handoff: BM096_SIGNATURE_GROUP

**handoffVersion**: 1.0.0
**task**: BM096_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION
**status**: READY_FOR_PLANNER_REVIEW
**mode**: EVIDENCE_ONLY
**canApplyRunNow**: false

## Baseline vs Post-Task Metrics

| Metric | Baseline | Post | Delta |
|--------|----------|------|-------|
| totalIssues | 1476 | 1476 | 0 |
| REMEDIATION_LEAK | 10 | 10 | 0 |
| COMPILED_DRIFT | 37 | 37 | 0 |

## DB Sync

| Status | Count |
|--------|-------|
| matched | 213 |
| missing | 0 |
| stale | 0 |

## Classification Counts

- **DEFER_PATH_DOMAIN_MISMATCH**: 3

## Planner Decision Needed

**Requested**: true
**Reason**: All 3 BM-096 signature fields classified DEFER_PATH_DOMAIN_MISMATCH. Direct DOCX evidence shows address semantics ('Nơi thường trú' / 'Nơi tạm trú') but no safe exact person.* target path can be proposed without cross-BM inference. Planner must decide: (a) DEFER to DOCX authoring fix, (b) DEFER to manual legal review, or (c) identify a safe single-field candidate for next batch.
**Recommendation**: DEFER_MANUAL_LEGAL_REVIEW for all 3 fields. Evidence is compelling (address semantics under signature.*) but legal/form semantics require human domain expert. No apply action should be taken.
**Next candidate**: NONE