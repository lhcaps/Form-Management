# Review Batch 2 — Approved Apply Report

Generated: 2026-06-25T23:16:18.622Z
Mode: **WRITE**

## Executive Summary

Approved: **2** groups (B2RG-015, B2RG-037)
Mutations applied: **2** (B2RG-015 + B2RG-037, label-only)
Contracts changed: **BM-002, BM-003**

> This task applies exactly 2 deterministic label-only corrections approved by reviewer
> with HIGH override confidence. No path/source/semantic changes.

## Decision Summary

| Decision | Count | Groups |
|----------|------:|--------|
| APPROVED_FOR_APPLY | 2 | B2RG-015, B2RG-037 |
| DEFER_METADATA_REVIEW | 48 | B2RG-001..B2RG-050 (excl. approved) |
| **Total** | **50** | |

## Applied Mutations

| Group | BM | Path | Before | After |
|-------|---|------|--------|-------|

## Deferred Groups (DEFER_METADATA_REVIEW — not applyEligible)

48 groups deferred for human review.
All RAW_PATTERN_DOMAIN_MISMATCH, SOURCE_MISMATCH, COMPILED_DRIFT, SHOULD_BE_READONLY deferred. No DOCX reauthoring. No legal interpretation. All applyEligible=false.

## Validation Command Results

| # | Command | Exit | Result | Duration |
|---|---------|------|--------|---------|
| 1 | `pnpm contract:validate` | 0 | **PASS** | 921ms |
| 2 | `pnpm contract:compile` | 0 | **PASS** | 967ms |
| 3 | `pnpm gate:forms:213` | 0 | **PASS** | 291ms |
| 4 | `pnpm audit:forms-root-cause` | 0 | **PASS** | 514ms |
| 5 | `pnpm plan:forms-root-cause-fixes` | 0 | **PASS** | 329ms |
| 6 | `pnpm audit:docx-fidelity` | 0 | **PASS** | 376126ms |
| 7 | `pnpm audit:contract-sync` | 0 | **PASS** | 299ms |
| 8 | `pnpm --filter @qllaw/form-contracts test` | 0 | **PASS** | 1023ms |
| 9 | `pnpm typecheck` | 0 | **PASS** | 4493ms |

## Post-Apply Issue Delta

| Metric | Baseline | Current | Delta |
|--------|----------|---------|------:|
| totalIssues | 3458 | 3456 | -2 |
| BAD_LABEL | 451 | 449 | -2 |
| UI_VISIBLE_BAD_METADATA | 94 | 92 | -2 |

> Baseline: post-Batch-1 apply (totalIssues=3458, BAD_LABEL=451, UI_VISIBLE_BAD_METADATA=94)

## Fix-Plan Classification (after apply)

| Classification | Count |
|----------------|------:|
| AUTO_FIX_CANDIDATE | 68 |
| REVIEW_FIX_CANDIDATE | 1864 |
| MANUAL_LEGAL_REVIEW | 468 |
| BLOCKED_BY_DOCX_AUTHORING | 100 |
| DO_NOT_FIX_NOISE_OR_DERIVED | 956 |

## Verdict

**PASS** — strict validation and delta checks completed.
