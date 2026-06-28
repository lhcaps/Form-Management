# Planner Handoff: DOCX Atlas V1 Phase 1-4

Generated: 2026-06-28T15:27:04.107Z
Mode: EVIDENCE_ONLY_ATLAS_BUILD

## Atlas Summaries

| Atlas | Key result |
|---|---|
| DOCX | 213 templates, 76 occurrence-review required, risk {"LOW":87,"MEDIUM":115,"HIGH":11} |
| Contract | 213 locked, 13 structural candidates, 18 reviewRequired |
| Render | 213 processed, 179 PASS, 34 FAIL, 0 ERROR, 0 missing |
| Smart Queue | 213 total, 12 blockers preserved |

## Queue Buckets

| Bucket | Count | Top candidates |
|---|---:|---|
| DO_NOT_TOUCH_ALREADY_BLOCKED | 12 | BM-096, BM-155, BM-136, BM-212, BM-069, BM-117, BM-118, BM-203, BM-052, BM-062 |
| RENDER_FAIL_REQUIRES_REPAIR | 30 | BM-058, BM-044, BM-070, BM-071, BM-172, BM-213, BM-039, BM-059, BM-148, BM-010 |
| DOCX_REQUIRES_OCCURRENCE_REVIEW | 48 | BM-186, BM-190, BM-188, BM-191, BM-192, BM-187, BM-189, BM-193, BM-003, BM-014 |
| PLANNER_REVIEW_CANDIDATE | 0 | - |
| DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER | 34 | BM-205, BM-130, BM-197, BM-048, BM-087, BM-127, BM-131, BM-027, BM-094, BM-102 |
| LOW_PRIORITY_RENDER_PASS_SEMANTIC_REVIEW | 89 | BM-211, BM-126, BM-196, BM-199, BM-106, BM-028, BM-201, BM-036, BM-134, BM-135 |

## Verification

- Tests: `34 tests, 34 passed, 0 failed`.
- DB sync: `213 matched / 0 missing / 0 stale`.
- Board refresh: `213 rows`, `12 blockers preserved`, render evidence `213 available / 179 clean / 0 missing`.
- Render Atlas full run completed: `179 PASS`, `34 FAIL`, `0 ERROR`.

## Safety

- `canApplyRunNow`: false
- `canMarkDone`: false
- No `decisions.approved.json` created.
- No Atlas apply runner created.
- Forbidden diffs remain pre-existing and are listed in the JSON handoff.

## Next Planner Decision

Review smart-remediation-queue.latest.json and approve the first evidence-only repair packet. Do not apply mutations until per-BM legal/DOCX review is approved.
