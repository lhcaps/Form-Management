# Post-Apply Integrity Check
Generated: 2026-06-25T19:31:45.438Z
**Verdict: PASS**

## Applied Batch Summary

| Metric | Value |
|--------|-------|
| Input AUTO_FIX_CANDIDATE | 141 |
| Applied mutations (reconstructed) | 46 |
| Skipped | 91 |
| Changed contracts | 21 |

## Mutation Integrity
**PASS**

## Dry-Run Mutation Safety
**Finding: REPORTING_BUG**

buildReport() is called in main() BEFORE the "if (WRITE)" guard. In dry-run mode, buildReport() generates its report by calling applyMutation() on cloned objects — but those clones are derived from contracts that are mutated in the write path of the same run. The second invocation of buildReport() (if any) will process already-mutated state. Report before/after diff may be corrupted because cloned objects for the report are derived from already-mutated original contracts. [SECONDARY] buildReport() called 2 times in main().

**Affected:** before/after diff in latest.json, changed-contracts.json

**Fix:** Separate report generation from mutation application. In dry-run mode, never call applyMutation() — only compute planned mutations and report them. In write mode, apply mutations only after all safety checks pass, then regenerate report from actual file reads.

## Remaining Auto-Fix Classification

| Classification | Count |
|----------------|-------|
| ALREADY_APPLIED_IDEMPOTENT | 0 |
| DUPLICATE_OF_APPLIED_MUTATION | 0 |
| SKIPPED_PATH_COLLISION | 6 |
| SKIPPED_CONFLICTING | 66 |
| STILL_ACTIONABLE | 0 |
| INVALID_AUTO_FIX_CANDIDATE | 0 |

### Non-Idempotent Remaining Items

- **BM-021::document.issuePlaceAndDateLine** [SKIPPED_PATH_COLLISION] UPDATE_PATH: Skip reason: Proposed path "legalBasis.procedureArticlesLine" already exists in BM-021
- **BM-026::agency.nameUpper** [SKIPPED_PATH_COLLISION] UPDATE_PATH: Skip reason: Proposed path "document.issueDate" already exists in BM-026
- **BM-036::document.issuePlaceAndDateLine** [SKIPPED_PATH_COLLISION] UPDATE_PATH: Skip reason: Proposed path "person.fullName" already exists in BM-036
- **BM-036::person.fullName** [SKIPPED_PATH_COLLISION] UPDATE_PATH: Skip reason: Proposed path "document.issueDate" already exists in BM-036
- **BM-036::decision.summaryLine** [SKIPPED_PATH_COLLISION] UPDATE_PATH: Skip reason: Proposed path "agency.parentNameUpper" already exists in BM-036
- **BM-041::agency.issuePlace** [SKIPPED_PATH_COLLISION] UPDATE_PATH: Skip reason: Proposed path "document.documentCode" already exists in BM-041
- **BM-002::document.documentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-002::document.documentCode
- **BM-002::document.documentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-002::document.documentCode
- **BM-003::document.documentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-003::document.documentCode
- **BM-003::legalBasis.procedureArticlesLine** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-003::legalBasis.procedureArticlesLine
- **BM-003::document.documentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-003::document.documentCode
- **BM-003::legalBasis.procedureArticlesLine** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-003::legalBasis.procedureArticlesLine
- **BM-068::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.fullDocumentCode
- **BM-068::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.fullDocumentCode
- **BM-068::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.issueDate
- **BM-068::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.issueDate
- **BM-068::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.fullDocumentCode
- **BM-068::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.issueDate
- **BM-068::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.fullDocumentCode
- **BM-068::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-068::document.issueDate
- **BM-069::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.fullDocumentCode
- **BM-069::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.fullDocumentCode
- **BM-069::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.issueDate
- **BM-069::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.issueDate
- **BM-069::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.fullDocumentCode
- **BM-069::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.issueDate
- **BM-069::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.fullDocumentCode
- **BM-069::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-069::document.issueDate
- **BM-073::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.fullDocumentCode
- **BM-073::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.fullDocumentCode
- **BM-073::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.issueDate
- **BM-073::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.issueDate
- **BM-073::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.fullDocumentCode
- **BM-073::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.issueDate
- **BM-073::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.fullDocumentCode
- **BM-073::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-073::document.issueDate
- **BM-075::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-075::document.fullDocumentCode
- **BM-075::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-075::document.fullDocumentCode
- **BM-075::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-075::document.fullDocumentCode
- **BM-075::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-075::document.fullDocumentCode
- **BM-077::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-077::document.fullDocumentCode
- **BM-077::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-077::document.fullDocumentCode
- **BM-077::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-077::document.fullDocumentCode
- **BM-077::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-077::document.fullDocumentCode
- **BM-080::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.fullDocumentCode
- **BM-080::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.fullDocumentCode
- **BM-080::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.issueDate
- **BM-080::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.issueDate
- **BM-080::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.fullDocumentCode
- **BM-080::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.issueDate
- **BM-080::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.fullDocumentCode
- **BM-080::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-080::document.issueDate
- **BM-082::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-082::document.fullDocumentCode
- **BM-082::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-082::document.fullDocumentCode
- **BM-082::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-082::document.fullDocumentCode
- **BM-082::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-082::document.fullDocumentCode
- **BM-162::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.fullDocumentCode
- **BM-162::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.fullDocumentCode
- **BM-162::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.issueDate
- **BM-162::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.issueDate
- **BM-162::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.fullDocumentCode
- **BM-162::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.issueDate
- **BM-162::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.fullDocumentCode
- **BM-162::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-162::document.issueDate
- **BM-163::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.fullDocumentCode
- **BM-163::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.fullDocumentCode
- **BM-163::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.issueDate
- **BM-163::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.issueDate
- **BM-163::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.fullDocumentCode
- **BM-163::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.issueDate
- **BM-163::document.fullDocumentCode** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.fullDocumentCode
- **BM-163::document.issueDate** [SKIPPED_CONFLICTING] UPDATE_LABEL: Skip reason: Multiple different mutations planned for BM-163::document.issueDate

## Issue Delta

| IssueCode | Before | After | Delta |
|-----------|--------|-------|-------|
| BAD_LABEL | 499 | 453 | -46 |
| RAW_PATTERN_DOMAIN_MISMATCH | 323 | 319 | -4 |
| SOURCE_MISMATCH | 339 | 342 | +3 |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 | 422 | 0 |
| GENERIC_FIELD_CANONICALIZATION | 388 | 369 | -19 |
| UI_VISIBLE_BAD_METADATA | 96 | 96 | 0 |
| COMPILED_DRIFT | 765 | 811 | +46 |
| REQUIRED_SUSPICIOUS | 114 | 118 | +4 |
| SHOULD_BE_READONLY | 461 | 457 | -4 |
| REMEDIATION_LEAK | 73 | 73 | 0 |
| total | 3480 | 3460 | -20 |

**Increased issue codes:**
- SOURCE_MISMATCH: 339 → 342 (+3)
- COMPILED_DRIFT: 765 → 811 (+46)
- REQUIRED_SUSPICIOUS: 114 → 118 (+4)

## BM-050 Status
Remaining issues: 13 | Remaining auto-fix: 0

## BM-068 Status
Remaining issues: 49 | Remaining auto-fix: 8

## Validation Commands

| Command | Exit | Result |
|---------|------|--------|
| `pnpm contract:validate` | 0 | PASS |
| `pnpm contract:compile` | 0 | PASS |
| `pnpm gate:forms:213` | 0 | PASS |
| `pnpm audit:forms-root-cause` | 0 | PASS |
| `pnpm plan:forms-root-cause-fixes` | 0 | PASS |
| `pnpm audit:forms-root-cause` | 0 | PASS |
| `pnpm --filter @qllaw/form-contracts test` | 0 | PASS |
| `pnpm typecheck` | 0 | PASS |
| `pnpm audit:docx-fidelity` | 1 | FAIL |
| `pnpm audit:contract-sync` | 0 | PASS |

## Verdict: **PASS**
## Recommended Next Task: **FORMS_ROOT_CAUSE_REVIEW_BATCH_1**
