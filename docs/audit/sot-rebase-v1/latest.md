# SOT_REBASE_V1 — Source of Truth Rebase Audit

**Generated:** 2026-06-30T08:25:43.434Z

## SOT Policy

- **normalized DOCX** = structural/placeholder SOT
- **locked contract JSON** = current semantic working SOT (semantic-suspect until audit passes)
- **compiled-v2** = derived artifact, NOT SOT
- **DB compiled_json** = runtime published copy, NOT SOT

## Summary

| Metric | Value |
|--------|-------|
| Total BMs | 213 |
| Total issues | 0 |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |

## Specific Issue Counts

| Issue | Count | Severity |
|-------|-------|----------|
| Ô trống auto-approved | 0 | HIGH |
| rawPattern mismatch | 0 | HIGH/MEDIUM |
| formInputHints stale | 0 | HIGH |
| compiled-v2 stale vs locked | 0 | CRITICAL |
| generic path leakage | 0 | HIGH |
| auto-generated auto-approved | 0 | MEDIUM |

## By Classification

| Classification | BMs |
|----------------|-----|
| LOCKED_CONTRACT_STRUCTURALLY_MATCHED | 213 |

## Top 30 Riskiest BMs

| Rank | BM | Score | Issues | Classification |
|------|----|-------|--------|----------------|

## CRITICAL: compiled-v2 Stale vs Locked

⚠️ **BM-063/BM-066 style stale bindings detected: 0**

Render Atlas PASS and DB sync PASS prove runtime fidelity only — they do NOT validate semantic correctness.


## HIGH: Ô trống Auto-Approved

0 docxSlots/canonicalFields with label "Ô trống" and reviewRequired=false.
These were auto-approved without human review evidence.


## HIGH: Generic Path Leakage

0 fields still use generic paths (document.fieldN, decision.fieldN, etc.).
These should be semanticized but were auto-approved.


## HIGH: rawPattern Mismatch

0 fields have evidence.rawPattern that does not match their slotId/path.


## Notes

- Render Atlas PASS = runtime render fidelity only, NOT semantic correctness.
- DB sync PASS = compiled-v2 matches DB, NOT that compiled-v2 matches locked.
- This audit determines SOT trust and semantic/evidence consistency.
