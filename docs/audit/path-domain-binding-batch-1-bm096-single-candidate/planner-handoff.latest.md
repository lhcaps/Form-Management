# Planner Handoff — BM-096 Single Candidate Review

**Task**: `BM096_SINGLE_CANDIDATE_REVIEW_PACKET_FOR_PLANNER_HANDOFF`
**Status**: `READY_FOR_PLANNER_REVIEW`
**Can Apply Now**: **NO**
**Requires Human Approval**: YES

---

## Decision Needed

> **Should planner approve creating an apply batch for BM-096 `document.diaChi` → `person.idNumber`?**

| Option | Description |
|--------|-------------|
| **APPROVE_APPLY_PROMPT** | Proceed with apply batch generation |
| **REQUEST_MORE_EVIDENCE** | Gather additional evidence before decision |
| **DEFER_CANDIDATE** | Defer to future batch |
| **REJECT_CANDIDATE** | Reject this candidate |

**Executor Recommendation**: `APPROVE_APPLY_PROMPT`

---

## Candidate Summary

| Field | Value |
|-------|-------|
| templateCode | BM-096 |
| oldPath | `document.diaChi` |
| newPath | `person.idNumber` |
| oldLabel | Ô trống |
| newLabel | Số CCCD/CMND |
| rawPattern | `{{person.field14}}` |
| evidenceTextBefore | `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:` |
| recommendation | `PROPOSE_APPROVE_SAFE_REMAP` |
| risk | MEDIUM |
| approved | false |
| reviewerRequired | true |

---

## Collision Check Summary

| Check | Result |
|-------|--------|
| canonicalFields | `NO_COLLISION` |
| docxSlots | `NO_COLLISION` |
| renderBindings | `NO_COLLISION` |

---

## Excluded Candidates

| Path | Reason |
|------|--------|
| `signature.cheDo` | `DEFER_PATH_DOMAIN_MISMATCH` — cannot assign person-address label to `signature.*` namespace |
| `signature.nguoiKy` | `DEFER_PATH_DOMAIN_MISMATCH` — cannot assign person-address label to `signature.*` namespace |

---

## Baseline Metrics

| Metric | Value |
|--------|-------|
| totalIssues | 1477 |
| FAIL | 1156 |
| REVIEW | 321 |
| REMEDIATION_LEAK | 10 |
| COMPILED_DRIFT | 37 |
| SOURCE_MISMATCH | 121 |

**Post-task**: Unchanged (no mutations applied).

---

## Safety Assertions

| Assertion | Value |
|-----------|-------|
| noLockedContractMutation | true |
| noCompiledV2Mutation | true |
| noApprovedDecision | true |
| noSignatureCandidateLeakage | true |
| metricsUnchanged | true |

---

## Files Created

- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/review.latest.json`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/review.latest.md`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/decision.proposed.json`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/planner-handoff.latest.json`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/planner-handoff.latest.md`
- `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/codegraph.findings.md`

---

## Next Prompt

`BM096_SINGLE_CANDIDATE_APPLY_APPROVED_REMAP` — only if planner approves.
