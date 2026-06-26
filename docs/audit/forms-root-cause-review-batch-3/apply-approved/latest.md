# Review Batch 3 — Approved Apply Report

Generated: 2026-06-26T10:45:51.974Z
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
| B3RG-001 | BM-001 | `informant.currentAddress` | `Nơi ở hiện tại` | `Nơi ở hiện tại` |
| B3RG-002 | BM-001 | `informant.identityIssuedPlace` | `Nơi cấp` | `Nơi cấp` |
| B3RG-003 | BM-001 | `informant.identityNo` | `Số CCCD/CMND` | `Số CCCD/CMND` |
| B3RG-004 | BM-001 | `informant.occupation` | `Nghề nghiệp` | `Nghề nghiệp` |
| B3RG-005 | BM-001 | `informant.permanentAddress` | `Nơi thường trú` | `Nơi thường trú` |
| B3RG-006 | BM-001 | `informant.phone` | `Số điện thoại` | `Số điện thoại` |
| B3RG-007 | BM-001 | `informant.temporaryAddress` | `Nơi tạm trú` | `Nơi tạm trú` |
| B3RG-008 | BM-002 | `reporter.birthPlace` | `Nơi sinh` | `Nơi sinh` |
| B3RG-009 | BM-002 | `reporter.currentResidence` | `Nơi ở hiện tại` | `Nơi ở hiện tại` |
| B3RG-010 | BM-002 | `reporter.ethnicity` | `Dân tộc` | `Dân tộc` |
| B3RG-011 | BM-002 | `reporter.identityIssuePlace` | `Nơi cấp` | `Nơi cấp` |
| B3RG-012 | BM-002 | `reporter.identityNumber` | `Số CCCD/CMND` | `Số CCCD/CMND` |
| B3RG-013 | BM-002 | `reporter.occupation` | `Nghề nghiệp` | `Nghề nghiệp` |
| B3RG-014 | BM-002 | `reporter.permanentResidence` | `Nơi thường trú` | `Nơi thường trú` |
| B3RG-015 | BM-002 | `reporter.phoneNumber` | `Số điện thoại` | `Số điện thoại` |
| B3RG-016 | BM-002 | `reporter.religion` | `Tôn giáo` | `Tôn giáo` |
| B3RG-017 | BM-002 | `reporter.temporaryResidence` | `Nơi tạm trú` | `Nơi tạm trú` |

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