# REMEDIATION_LEAK Batch 2B - Investigation Report

**Generated:** 2026-06-27T18:44:00.000Z

## Summary

| Metric | Value |
|--------|-------|
| Total Target Items | 10 |
| **Approved** | **0** |
| **Deferred** | **10** |
| Batch Can Proceed | **NO** |

## Root Cause

All 10 remaining REMEDIATION_LEAK items are blocked by **GENERIC_FIELD_CANONICALIZATION** AND have **insufficient DOCX evidence**:

1. **rawPattern is EMPTY** - no actual DOCX content stored
2. **textBefore contains generic placeholders** - `{{document.field1}}`, `{{document.field3}}`, etc.
3. **Cannot determine correct semantic path** without manual DOCX review

## Classification Result

**All 10 items: DEFERRED_DOCX_EVIDENCE_WEAK**

| BM | Path | textBefore Evidence | Classification | Blocking Issues |
|----|------|-------------------|----------------|----------------|
| BM-069 | document.fullDocumentCode | `{{document.field1}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-069 | document.reasonLine | `{{document.field6}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-069 | document.reasonLine2 | `{{document.field7}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-069 | decision.decisionLine | `{{document.field8}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-069 | document.summaryLine | `{{document.field12}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-075 | document.fullDocumentCode | `{{document.field1}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-077 | document.fullDocumentCode | `{{document.field1}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-082 | document.fullDocumentCode | `{{document.field1}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-162 | person.dateOfBirth | `{{document.field3}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |
| BM-163 | person.dateOfBirth | `{{document.field3}}` | DEFERRED_DOCX_EVIDENCE_WEAK | GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK |

## Why No Items Approved

### Evidence Quality Check

| Criterion | Required | Found |
|-----------|----------|-------|
| rawPattern not empty | YES | NO - all EMPTY |
| textBefore has semantic content | YES | NO - all generic `{{document.fieldN}}` |
| Can determine correct semantic path | YES | NO |

### Blocking Issues Per Item

All 10 items have:
- GENERIC_FIELD_CANONICALIZATION (path contains generic field name)
- REMEDIATION_LEAK (slot/canonical label contains remediation metadata)
- BAD_LABEL (label is generic)
- UI_VISIBLE_BAD_METADATA (metadata visible to user)

## Decision

**Batch 2B CANNOT PROCEED**

No mutations will be applied to any of the 10 items because:
1. No approved decisions generated
2. All items deferred
3. No planner/apply runner created

## Required Next Steps

### 1. DOCX_REVIEW_BATCH: Manual DOCX Review

For each of the 6 BMs (BM-069, BM-075, BM-077, BM-082, BM-162, BM-163), manual review must:
1. Open the actual DOCX file
2. Find the field position marked as `{{document.fieldN}}`
3. Read the surrounding text to determine actual field semantic
4. Document: original placeholder, surrounding context, suggested canonical path

### 2. After DOCX Review

Once DOCX review provides evidence:
1. Update the slots with actual rawPattern from DOCX
2. Re-classify items as APPROVED_SAFE_REMAP_AND_CLEANUP or remain deferred
3. Create new batch with approved items only

## Current State

**REMEDIATION_LEAK: 10** (unchanged)

These items remain in the audit report until DOCX review provides sufficient evidence.

## Metric Gates

| Metric | Baseline | Current | Status |
|--------|----------|---------|--------|
| REMEDIATION_LEAK | 10 | 10 | HOLD |
| COMPILED_DRIFT | 37 | 37 | OK |
| SOURCE_MISMATCH | 121 | 121 | OK |
| SHOULD_BE_READONLY | 42 | 42 | OK |
| REQUIRED_SUSPICIOUS | 115 | 115 | OK |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 | 422 | OK |
| totalIssues | 1477 | 1477 | OK |

## Recommendation

**Do NOT proceed to Batch 2B write mode.**

Required action: Manual DOCX review for all 6 affected BMs to extract field semantics.

---
*Batch 2B investigation completed. All 10 items deferred. No mutations applied.*
