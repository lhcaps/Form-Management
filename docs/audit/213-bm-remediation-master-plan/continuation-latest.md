# 213 BM Contract Remediation Continuation

Generated: 2026-06-27

## Current Truth

- The 213 locked contracts are structurally present and runtime-synced.
- DB sync gate: PASS, `DB_COMPARE`, matched 213, missing 0, stale 0.
- Contract validation: PASS for all 213 locked contracts.
- Compiled artifacts: regenerated and package compile-sync passed.
- The 213 forms are not yet content-certified against their DOCX. The current root-cause audit still reports 1559 issues: 1218 FAIL and 341 REVIEW.

## Applied In This Pass

Safe label-only write applied 8 canonical label mutations across 5 BMs:

- BM-003: `legalBasis.procedureArticlesLine`
- BM-068: `document.fullDocumentCode`
- BM-080: `document.fullDocumentCode`, `document.issueDate`
- BM-162: `document.fullDocumentCode`, `document.issueDate`
- BM-163: `document.fullDocumentCode`, `document.issueDate`

Backup:

`docs/audit/forms-root-cause-apply/backups/2026-06-27T16-56-50-381Z`

DB publish after write created new published versions for BM-003, BM-068, BM-080, BM-162, and BM-163; 208 unchanged contracts were skipped by hash.

## Why The Old Plan Looked Safer Than It Was

1. Some audit rules were over-reporting false positives. `SHOULD_BE_READONLY` and generic raw `fieldN` domain handling were corrected before this pass.
2. The root-cause apply runner was not strict enough around duplicate candidates and dry-run report mutation. It now groups duplicate issue rows, keeps dry-run report generation clone-only, and does not mutate real contract objects before write mode.
3. KEEP_DEFERRED closure state was not enforced in the root-cause fix planner. It now blocks exact deferred BM/path items and blocks auto-fix on BMs that have unresolved deferred closure items.
4. Some remaining `REMEDIATION_LEAK` rows are slot-label/docx-evidence defects, not canonical field label defects. The planner now reads the real locked `canonicalFields` label and blocks ineffective auto-fixes when the canonical label already matches the proposed label.
5. File-level edits can make SQL/runtime stale. Any contract write must be followed by compile, DB publish, and `audit-contract-sync`.

## Current Issue Counts

- BAD_LABEL: 373
- GENERIC_FIELD_CANONICALIZATION: 352
- WEAK_EVIDENCE_AUTO_LOCKED: 422
- SOURCE_MISMATCH: 121
- REQUIRED_SUSPICIOUS: 115
- REMEDIATION_LEAK: 63
- SHOULD_BE_READONLY: 42
- COMPILED_DRIFT: 37
- UI_VISIBLE_BAD_METADATA: 24
- RAW_PATTERN_DOMAIN_MISMATCH: 10

## Current Planning State

Safe-label batch:

- AUTO_SAFE_APPROVABLE: 0
- REVIEW_NEEDED: 3
- BLOCKED: 351
- EXCLUDED_KEEP_DEFERRED: 19
- Approval command: NONE

Root-cause fix plan:

- AUTO_FIX_CANDIDATE: 0
- REVIEW_FIX_CANDIDATE: 986
- MANUAL_LEGAL_REVIEW: 455
- BLOCKED_BY_DOCX_AUTHORING: 118
- BLOCKED_BY_COMPILED_DRIFT_REBUILD: 0

Master remediation lanes:

- VERIFY_ONLY: 17
- SOURCE_POLICY: 50
- PATH_DOMAIN_BINDING: 127
- REMEDIATION_LEAK: 9
- KEEP_DEFERRED_REVIEW: 8
- EVIDENCE_REVIEW: 2

## Required Guard Sequence For Every Future Batch

1. Review issue group against the original DOCX context and locked contract.
2. Create explicit approved decisions for that batch.
3. Dry-run apply and inspect deep diff.
4. Write only if diff touches the approved fields and allowed properties.
5. Run contract validate.
6. Run contract compile.
7. Run root-cause audit.
8. Regenerate baseline, queue, master plan, and root-cause fix plan.
9. Publish locked contracts to DB.
10. Run `node scripts/audit/audit-contract-sync.mjs`.
11. Confirm `node scripts/audit/apply-forms-root-cause-safe-fixes.mjs` stays at 0 unexpected mutations unless a new explicitly approved auto batch exists.

## Next Work Order

1. Evidence lane: triage `WEAK_EVIDENCE_AUTO_LOCKED` first because it is the largest remaining class at 422 issues and mostly affects later BMs.
2. DOCX/remediation lane: resolve the 63 `REMEDIATION_LEAK` rows by separating canonical field labels from slot labels/raw DOCX evidence. Do not label-mutate these automatically.
3. Path/source lane: handle `SOURCE_MISMATCH`, `SHOULD_BE_READONLY`, and `RAW_PATTERN_DOMAIN_MISMATCH` with reviewer-approved path/source decisions.
4. Required-policy lane: review the 115 `REQUIRED_SUSPICIOUS` fields by BM semantics; do not bulk-toggle required flags.
5. Label/generic lane: after evidence and path decisions, re-run the audit and only then reconsider BAD_LABEL and GENERIC_FIELD_CANONICALIZATION groups.

The target remains: 213/213 forms content-certified against their own DOCX, with locked contracts, compiled artifacts, runtime DB, and audit plans all in sync.
