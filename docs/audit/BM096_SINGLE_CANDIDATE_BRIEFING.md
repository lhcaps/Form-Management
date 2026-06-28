# BM-096 Single Candidate Review - Briefing Document

> Tài liệu này chứa prompt chi tiết và workflow cho lần làm việc tiếp theo với Cursor Agent.

## Current State (Nhớ kỹ)

```
BM-096: NOT APPLIED
Excluded:
  - signature.cheDo → Nơi thường trú (DEFER_PATH_DOMAIN_MISMATCH)
  - signature.nguoiKy → Nơi tạm trú (DEFER_PATH_DOMAIN_MISMATCH)

Active candidate:
  - document.diaChi → person.idNumber (PENDING REVIEW)

Metrics baseline:
  totalIssues: 1477
  REMEDIATION_LEAK: 10 (BLOCKED)
  COMPILED_DRIFT: 37
```

## Prompt cho Cursor Agent

```
You are working in D:\Study\Project\QLLaw-main.

Task: BM096_SINGLE_CANDIDATE_REVIEW_AND_APPLY_PLAN

Do not apply mutations yet.
Do not write locked contracts.
Do not edit compiled-v2.
Do not publish DB.

Current context:

REMEDIATION_LEAK is blocked at 10 items and must remain deferred.
BM-096 PATH_DOMAIN_BINDING Batch 1 plan was integrity-fixed.
signature.cheDo and signature.nguoiKy were downgraded from SAFE_LABEL_CLEANUP to DEFER_PATH_DOMAIN_MISMATCH.
Only one BM-096 candidate remains:
document.diaChi -> person.idNumber
proposed label: Số CCCD/CMND
evidence textBefore: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:
This candidate is not approved for apply yet. It requires a focused review and proposed decision packet.

Global metric baseline:

totalIssues: 1477
FAIL: 1156
REVIEW: 321
REMEDIATION_LEAK: 10
BAD_LABEL: 353
GENERIC_FIELD_CANONICALIZATION: 352
SOURCE_MISMATCH: 121
REQUIRED_SUSPICIOUS: 115
SHOULD_BE_READONLY: 42
COMPILED_DRIFT: 37
UI_VISIBLE_BAD_METADATA: 15
RAW_PATTERN_DOMAIN_MISMATCH: 10
WEAK_EVIDENCE_AUTO_LOCKED: 422

Required skill/tool behavior:

Use CodeGraph or user-codegraph to inspect relationships before making a plan.
Use review-bugbot style reasoning for safety checks.
Use unittest-skill style coverage for any guard script.
Use output-skill behavior: do not truncate final tables or validation logs.

CodeGraph exploration:
First inspect available CodeGraph commands:
codegraph --help

Then index or query the project using the actual supported syntax. Do not guess unsupported syntax.
Explore these files or their graph equivalents:

scripts/audit/audit-forms-root-cause.mjs
scripts/audit/validate-path-domain-batch-1-bm096-plan.mjs
scripts/audit/apply-remediation-leak-batch-2a-approved.mjs
packages/form-contracts/src/v1-adapter.ts
packages/form-contracts/scripts/compile-contracts.ts
docs/audit/docx/contracts/locked/BM-096*.contract.locked.json
docs/audit/path-domain-binding-batch-1-bm096/latest.json
docs/audit/path-domain-binding-batch-1-bm096/latest.md

Primary goal:
Create a focused review packet for the single remaining candidate:

old path: document.diaChi
proposed path: person.idNumber
proposed label: Số CCCD/CMND

No mutation should happen in this task.

Required output files:

docs/audit/path-domain-binding-batch-1-bm096-single-candidate/review.latest.json
docs/audit/path-domain-binding-batch-1-bm096-single-candidate/review.latest.md
docs/audit/path-domain-binding-batch-1-bm096-single-candidate/decision.proposed.json
scripts/audit/validate-bm096-single-candidate-review.mjs
test/bm096-single-candidate-review.test.mjs

Review packet must include:

templateCode
templateTitle
locked contract path
current canonical field entry for document.diaChi
proposed canonical field entry for person.idNumber
docxSlot entry
renderBinding entry
rawPattern
rawDomain
rawTail
textBefore
context if available
200 chars before/after if available
source
required
reviewRequired
all co-occurring issue codes for old path
collision check result for person.idNumber
whether person.idNumber already exists
whether any renderBinding already targets person.idNumber
whether any docxSlot already uses person.idNumber
whether source kind remains valid after remap
whether required/reviewRequired remains unchanged
risk: LOW | MEDIUM | HIGH
recommendation:
PROPOSE_APPROVE_SAFE_REMAP
DEFER_PATH_COLLISION
DEFER_SOURCE_POLICY_CONFLICT
DEFER_RENDER_BINDING_CONFLICT
DEFER_DOCX_EVIDENCE_WEAK

Safety criteria for PROPOSE_APPROVE_SAFE_REMAP:
All must be true:

textBefore or context directly supports ID number semantics.
proposed path person.idNumber does not already exist in BM-096 canonicalFields, or merge is explicitly safe.
No docxSlot collision.
No renderBinding collision.
rawPattern domain is person or clearly person-specific. If rawPattern is {{person.field14}}, this supports person domain but still document current path must be remapped.
labelAfter does not contain bad/internal text.
source/required/reviewRequired do not need mutation.
No COMPILED_DRIFT-related field is touched.
This remap does not hide a separate source-policy issue.

decision.proposed.json format:
{
"version": "1.0.0",
"mode": "PROPOSED_ONLY_NOT_APPROVED",
"templateCode": "BM-096",
"decisions": [
{
"decision": "PROPOSE_APPROVE_SAFE_PATH_REMAP",
"templateCode": "BM-096",
"oldPath": "document.diaChi",
"newPath": "person.idNumber",
"oldLabel": "Ô trống",
"newLabel": "Số CCCD/CMND",
"rawPattern": "{{person.field14}}",
"evidenceTextBefore": "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:",
"collisionCheck": {
"canonicalFields": "NO_COLLISION",
"docxSlots": "NO_COLLISION",
"renderBindings": "NO_COLLISION"
},
"mutationsNeededIfApprovedLater": [
"UPDATE_CANONICAL_PATH",
"UPDATE_CANONICAL_LABEL",
"UPDATE_DOCX_SLOT_ID",
"UPDATE_DOCX_SLOT_LABEL",
"UPDATE_RENDER_BINDING_SLOT_ID",
"UPDATE_RENDER_BINDING_FROM_IF_NEEDED"
],
"reviewerRequired": true,
"approved": false
}
]
}

Guard script requirements:
scripts/audit/validate-bm096-single-candidate-review.mjs must verify:

decision.proposed.json is proposed-only, not approved.
No approved decisions exist.
Candidate is exactly BM-096 document.diaChi -> person.idNumber.
person.idNumber collision checks are explicitly recorded.
No signature.* candidate is present.
No mutation report exists in this folder.
No locked contract files changed.
No compiled-v2 files changed.

Test requirements:
test/bm096-single-candidate-review.test.mjs must cover:

proposed-only mode
no approved decisions
exact candidate path
no signature.cheDo/signature.nguoiKy leakage
collision checks required
bad label rejection
cross-domain label-only rejection
no write/apply artifacts

Validation commands:
node scripts/audit/validate-bm096-single-candidate-review.mjs
node --test test/bm096-single-candidate-review.test.mjs
node scripts/audit/audit-forms-root-cause.mjs
git diff -- docs/audit/docx/contracts/locked docs/audit/docx/compiled-v2

Expected:

no locked contract diff
no compiled-v2 diff
totalIssues remains 1477
REMEDIATION_LEAK remains 10
COMPILED_DRIFT remains 37

Commit:
docs(audit): propose BM-096 single path-domain remap review

Final response format:

Executive summary
CodeGraph findings
Exact candidate review table
Collision check table
Why signature.cheDo and signature.nguoiKy are excluded
Proposed decision packet summary
Safety assertions
Validation outputs
Git commit hash and push result
Clear yes/no: can apply run now?
```

## Safety Gates (ABS Brakes)

Check trước khi bất kỳ mutation nào:

1. No cross-BM evidence
2. No label-only nếu domain label ≠ domain path
3. No approved decision risk > MEDIUM without reviewer approval
4. No rawPattern EMPTY approved
5. No textBefore only `{{document.fieldN}}` approved
6. No compiled-v2 manual edit
7. No locked contract mutation outside approved decisions
8. COMPILED_DRIFT not increased
9. SOURCE_MISMATCH not increased
10. totalIssues not increased

## Apply Workflow (sau khi review pass)

```
BM096_SINGLE_CANDIDATE_APPLY_APPROVED_REMAP

Chỉ mutate đúng 1 field:
- document.diaChi → person.idNumber
- label: Ô trống → Số CCCD/CMND
- docxSlots slotId update
- renderBindings update

Phải có:
- backup
- exact-value assertion
- validate
- compile
- audit
- publish
- sync
```

## Files đã tạo

| File | Mục đích |
|------|----------|
| `.cursor/rules/qllaw-contract-remediation.mdc` | Project rules |
| `scripts/audit/validate-remediation-batch-safety-gates.mjs` | Safety gates |
| `scripts/audit/validate-bm096-single-candidate-review.mjs` | BM096 validator |
| `test/bm096-single-candidate-review.test.mjs` | Test suite |
| `docs/audit/.../README.md` | Workflow documentation |
