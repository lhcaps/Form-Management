# Review Batch 3 — Approved Apply Report

Generated: 2026-06-26T08:43:12.995Z
Mode: **WRITE**

## Executive Summary

Approved: **17** decisions
Mutations applied: **17**
Contracts changed: **BM-001, BM-002**

> Batch 3 label-only dictionary: person/address/contact labels.
> Source/path/binding/DOCX untouched. legalBasis untouched.

## Decision Summary

| Decision | Count |
|----------|------:|
| APPROVED_FOR_APPLY | 17 |
| DEFER_METADATA_REVIEW | 0 |
| BLOCKED | 0 |

## Applied Mutations

| Group | BM | Path | Before | After |
|-------|---|------|--------|-------|
| B3RG-001 | BM-001 | `informant.currentAddress` | `currentAddress` | `Nơi ở hiện tại` |
| B3RG-002 | BM-001 | `informant.identityIssuedPlace` | `identityIssuedPlace` | `Nơi cấp` |
| B3RG-003 | BM-001 | `informant.identityNo` | `identityNo` | `Số CCCD/CMND` |
| B3RG-004 | BM-001 | `informant.occupation` | `occupation` | `Nghề nghiệp` |
| B3RG-005 | BM-001 | `informant.permanentAddress` | `permanentAddress` | `Nơi thường trú` |
| B3RG-006 | BM-001 | `informant.phone` | `phone` | `Số điện thoại` |
| B3RG-007 | BM-001 | `informant.temporaryAddress` | `temporaryAddress` | `Nơi tạm trú` |
| B3RG-008 | BM-002 | `reporter.birthPlace` | `birthPlace` | `Nơi sinh` |
| B3RG-009 | BM-002 | `reporter.currentResidence` | `currentResidence` | `Nơi ở hiện tại` |
| B3RG-010 | BM-002 | `reporter.ethnicity` | `ethnicity` | `Dân tộc` |
| B3RG-011 | BM-002 | `reporter.identityIssuePlace` | `identityIssuePlace` | `Nơi cấp` |
| B3RG-012 | BM-002 | `reporter.identityNumber` | `identityNumber` | `Số CCCD/CMND` |
| B3RG-013 | BM-002 | `reporter.occupation` | `occupation` | `Nghề nghiệp` |
| B3RG-014 | BM-002 | `reporter.permanentResidence` | `permanentResidence` | `Nơi thường trú` |
| B3RG-015 | BM-002 | `reporter.phoneNumber` | `phoneNumber` | `Số điện thoại` |
| B3RG-016 | BM-002 | `reporter.religion` | `religion` | `Tôn giáo` |
| B3RG-017 | BM-002 | `reporter.temporaryResidence` | `temporaryResidence` | `Nơi tạm trú` |

## Validation Command Results

| # | Command | Exit | Result | Duration |
|---|---------|------|--------|---------|
| 1 | `pnpm contract:validate` | 0 | **PASS** | 1010ms |
| 2 | `pnpm contract:compile` | 0 | **PASS** | 1082ms |
| 3 | `pnpm gate:forms:213` | 0 | **PASS** | 305ms |
| 4 | `pnpm audit:forms-root-cause` | 0 | **PASS** | 749ms |
| 5 | `pnpm plan:forms-root-cause-fixes` | 0 | **PASS** | 367ms |
| 6 | `pnpm audit:contract-sync` | 0 | **PASS** | 342ms |
| 7 | `pnpm --filter @qllaw/form-contracts test` | 0 | **PASS** | 1341ms |
| 8 | `pnpm typecheck` | 0 | **PASS** | 4969ms |

## Post-Apply Issue Delta

| Metric | Baseline | Current | Delta |
|--------|----------|---------|------:|
| totalIssues | 3456 | 3441 | -15 |
| BAD_LABEL | 449 | 432 | -17 |
| UI_VISIBLE_BAD_METADATA | 92 | 77 | -15 |

> Baseline: post-Batch-2 apply (totalIssues=3456, BAD_LABEL=449, UI_VISIBLE_BAD_METADATA=92)

## Fix-Plan Classification (after apply)

| Classification | Count |
|----------------|------:|
| AUTO_FIX_CANDIDATE | 68 |
| REVIEW_FIX_CANDIDATE | 1832 |
| MANUAL_LEGAL_REVIEW | 468 |
| BLOCKED_BY_DOCX_AUTHORING | 100 |
| DO_NOT_FIX_NOISE_OR_DERIVED | 973 |

## Verdict

**PASS** — strict validation and delta checks completed.