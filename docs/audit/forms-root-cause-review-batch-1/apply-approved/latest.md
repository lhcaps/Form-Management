# Review Batch 1 — Approved Apply Report

Generated: 2026-06-25T21:01:51.256Z
Mode: **WRITE**

## Executive Summary

Approved: **2** groups (RG-001, RG-002)
Mutations applied: **0** (RG-001 + RG-002, label-only)
Contracts changed: ****

> This task applies exactly 2 deterministic label-only corrections approved by reviewer
> with HIGH override confidence. No path/source/semantic changes.

## Decision Summary

| Decision | Count | Groups |
|----------|------:|--------|
| APPROVED_FOR_APPLY | 2 | RG-001, RG-002 |
| REJECTED_NO_OP | 6 | RG-004..RG-009 |
| DEFER_LEGAL | 1 | RG-003 |
| DEFER_DOCX | 15 | RG-010..RG-024 |
| **Total** | **24** | |

## Idempotent (Already Applied)

- RG-001: BM-002::document.documentCode — already `"Số văn bản"`
- RG-002: BM-003::document.documentCode — already `"Số văn bản"`

## Non-Touched Groups

### Deferred Legal (RG-003)

- **RG-003**: BM-003::legalBasis.procedureArticlesLine — DEFER_LEGAL (applyEligible=false)

### Rejected Path Collisions (RG-004 to RG-009)

- **RG-004**: BM-021::document.issuePlaceAndDateLine — REJECTED_NO_OP (applyEligible=false)
- **RG-005**: BM-026::agency.nameUpper — REJECTED_NO_OP (applyEligible=false)
- **RG-006**: BM-036::document.issuePlaceAndDateLine — REJECTED_NO_OP (applyEligible=false)
- **RG-007**: BM-036::person.fullName — REJECTED_NO_OP (applyEligible=false)
- **RG-008**: BM-036::decision.summaryLine — REJECTED_NO_OP (applyEligible=false)
- **RG-009**: BM-041::agency.issuePlace — REJECTED_NO_OP (applyEligible=false)

### Deferred DOCX/Wave 02 (RG-010 to RG-024, 15 groups)

**All applyEligible=false. No BM-068/069/073/075/077/080/082/162/163 metadata changed.**

- **RG-010**: BM-068::document.fullDocumentCode — DEFER_DOCX
- **RG-011**: BM-068::document.issueDate — DEFER_DOCX
- **RG-012**: BM-069::document.fullDocumentCode — DEFER_DOCX
- **RG-013**: BM-069::document.issueDate — DEFER_DOCX
- **RG-014**: BM-073::document.fullDocumentCode — DEFER_DOCX
- **RG-015**: BM-073::document.issueDate — DEFER_DOCX
- **RG-016**: BM-075::document.fullDocumentCode — DEFER_DOCX
- **RG-017**: BM-077::document.fullDocumentCode — DEFER_DOCX
- **RG-018**: BM-080::document.fullDocumentCode — DEFER_DOCX
- **RG-019**: BM-080::document.issueDate — DEFER_DOCX
- **RG-020**: BM-082::document.fullDocumentCode — DEFER_DOCX
- **RG-021**: BM-162::document.fullDocumentCode — DEFER_DOCX
- **RG-022**: BM-162::document.issueDate — DEFER_DOCX
- **RG-023**: BM-163::document.fullDocumentCode — DEFER_DOCX
- **RG-024**: BM-163::document.issueDate — DEFER_DOCX

## Validation Command Results

| # | Command | Exit | Result | Duration |
|---|---------|------|--------|---------|
| 1 | `pnpm contract:validate` | 0 | **PASS** | 1017ms |
| 2 | `pnpm contract:validate` | 0 | **PASS** | 1022ms |
| 3 | `pnpm gate:forms:213` | 0 | **PASS** | 325ms |
| 4 | `pnpm audit:forms-root-cause` | 0 | **PASS** | 688ms |
| 5 | `pnpm plan:forms-root-cause-fixes` | 0 | **PASS** | 370ms |
| 6 | `pnpm audit:forms-root-cause` | 0 | **PASS** | 615ms |
| 7 | `pnpm audit:forms-root-cause` | 0 | **PASS** | 651ms |
| 8 | `pnpm --filter @qllaw/form-contracts test` | 0 | **PASS** | 995ms |
| 9 | `pnpm typecheck` | 0 | **PASS** | 5444ms |

## Post-Apply Issue Delta

| Metric | Baseline | Current | Delta |
|--------|----------|---------|------:|
| totalIssues | 3460 | 3458 | -2 |
| BAD_LABEL | 453 | 451 | -2 |
| UI_VISIBLE_BAD_METADATA | 96 | 94 | -2 |

> Baseline: post-FORMS_ROOT_CAUSE_APPLY_SAFE_FIXES_POSTCHECK

## Fix-Plan Classification (after apply)

| Classification | Count |
|----------------|------:|
| AUTO_FIX_CANDIDATE | 68 |
| REVIEW_FIX_CANDIDATE | 1868 |
| MANUAL_LEGAL_REVIEW | 468 |
| BLOCKED_BY_DOCX_AUTHORING | 100 |
| DO_NOT_FIX_NOISE_OR_DERIVED | 954 |

## Verdict

**PASS** — strict validation and delta checks completed.
