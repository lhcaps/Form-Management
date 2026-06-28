# DOCX Path/Binding P1 Closure Report

Generated: 2026-06-26T20:29:45.555Z

---

## Executive Summary

| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

| Metric | Value |
|--------|-------|
| P0 investigated | 5 |
| P1 Batch 1 investigated | 6 |
| P1 Batch 2 investigated | 7 |
| **Total destructive-pipeline investigated** | **18** |
| P1 total investigated | 13 |
| **Combined proposed removals** | **10** |
| P1 proposed removals | 5 |
| Keep-deferred tracked | 8 |
| Domain-model review notes | 3 |
| Approved for apply | 0 |
| Apply allowed | NO |
| Approval required | YES |

---

## What This Closure Proves

1. **Label-only remediation is no longer sufficient for this lane.**
   BAD_LABEL and UI_VISIBLE_BAD_METADATA count persist because the underlying root cause is
   path/binding pollution in locked contracts — not a missing display label.

2. **The issue is contract-field pollution from prior DOCX remediation.**
   DOCX remediation added slots with wrong semantic paths (person.dateOfBirth in a personnel-change
   form, document metadata slots in footer positions, recipient continuation lines as orphan fields).

3. **Some items are high-confidence destructive remove candidates.**
   All 10 proposed removals have blockId=null and no legitimate canonical equivalent.
   The evidence (paragraph context, Nơi nhận suffix, Điều clause anomaly) is unambiguous.

4. **Other items stay deferred because removal could remove needed data-capture capacity.**
   P1 Batch 1 false-header items: no replacement field exists; orphan-vs-missing.
   P1 Batch 2 body continuation items: free-text capacity may be needed for multi-line recipient data.

---

## Source Breakdown

| Batch | Investigated | Remove Candidates | Keep Deferred | Notes |
|-------|------------|-----------------|-------------|-------|
| P0 investigation | 5 | 5 | 0 | W2R-027/028/036, PRIOR-DXR-001/002 |
| P1 Batch 1 | 6 | 2 | 4 | W2R-025/026 remove; W2R-013/029/033/040 deferred |
| P1 Batch 2 | 7 | 3 | 4 | PRIOR-DXR-008/010/011 remove; 006/007/009/012 deferred |
| **Total** | **18** | **10** | **8** | |

---

## Combined Remove Candidates

| Decision ID | BM | Path | Proposed Action | Confidence |
|------------|----|------|----------------|-----------|
| DOCX-REMOVE-001 | BM-073 | person.dateOfBirth | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-002 | BM-073 | person.idNumber | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-003 | BM-080 | person.personFullName | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-004 | BM-063 | document.fullDocumentCode8 | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-005 | BM-064 | document.issueDate4 | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-006 | BM-073 | document.fullDocumentCode | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-007 | BM-073 | document.issueDate | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-008 | BM-052 | recipients.personLine6 | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-009 | BM-062 | recipients.personLine5 | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| DOCX-REMOVE-010 | BM-066 | recipients.personLine4 | REMOVE_FIELD_FROM_CONTRACT | HIGH |

---

## Keep-Deferred Tracked

These items are **NOT approved**. They must not be applied.
They require future domain-model/path-binding review.

### P1 Batch 1 — False-header/orphan without replacement (4 items)

- **W2R-013 / BM-069 / document.fullDocumentCode**
  Reason: no legitimate fullDocumentCode exists; removing would leave the BM without a current document code field.
  Confidence: MEDIUM.
- **W2R-029 / BM-075 / document.fullDocumentCode**
  Reason: no legitimate fullDocumentCode exists; removing would leave the BM without a current document code field.
  Confidence: MEDIUM.
- **W2R-033 / BM-077 / document.fullDocumentCode**
  Reason: no legitimate fullDocumentCode exists; removing would leave the BM without a current document code field.
  Confidence: MEDIUM.
- **W2R-040 / BM-082 / document.fullDocumentCode**
  Reason: no legitimate fullDocumentCode exists; removing would leave the BM without a current document code field.
  Confidence: MEDIUM.

### P1 Batch 2 — Body continuation/free-text capacity (4 items)

- **PRIOR-DXR-006 / BM-063 / recipients.personLine5**
  Reason: free-text continuation between labeled recipient fields; removal could reduce data-capture capacity.
  Confidence: MEDIUM.
- **PRIOR-DXR-007 / BM-065 / recipients.personLine3**
  Reason: free-text continuation between labeled recipient fields; removal could reduce data-capture capacity.
  Confidence: MEDIUM.
- **PRIOR-DXR-009 / BM-061 / recipients.personLine3**
  Reason: free-text continuation between labeled recipient fields; removal could reduce data-capture capacity.
  Confidence: MEDIUM.
- **PRIOR-DXR-012 / BM-067 / recipients.personLine3**
  Reason: free-text continuation between labeled recipient fields; removal could reduce data-capture capacity.
  Confidence: MEDIUM.

---

## Domain Model Notes

Three tentative domain-model paths were identified. These are **not implementation decisions**.
Destructive remove approval can proceed independently.

| BM | Current Wrong Path | Tentative New Path | Status |
|----|-------------------|-------------------|--------|
| BM-080 | person.personFullName | defender.cardLicenseNumber | DOMAIN_MODEL_REVIEW required |
| BM-063 | document.fullDocumentCode8 | antecedentDocument.fullDocumentCode | DOMAIN_MODEL_REVIEW required |
| BM-064 | document.issueDate4 | antecedentDocument.issueDate | DOMAIN_MODEL_REVIEW required |

---

## ID Integrity Check

| Check | Result |
|-------|--------|
| DOCX-REMOVE-0010 absent | PASS |
| DOCX-REMOVE-001 through 010 all exist | PASS |
| Approval gate uses DOCX-REMOVE-010 | PASS |

---

## Recommended Next Action: LAYERED_APPROVAL_PLAN

**Why layered?**

10 removals across 7 BMs represents meaningful blast radius. Layering:
- Simplifies rollback (one layer at a time)
- Makes delta visible (BM-073 layer = 4 removals on one contract)
- Reduces cognitive load on approval decision

### Layer A — BM-073 only
**4 removals on a single contract.** Rationale: same sourceId (e412fccad227), same form.
Lowest risk: one contract, same family, easy to audit delta.

| Decision ID | Path |
|------------|------|
| DOCX-REMOVE-001 | person.dateOfBirth |
| DOCX-REMOVE-002 | person.idNumber |
| DOCX-REMOVE-006 | document.fullDocumentCode |
| DOCX-REMOVE-007 | document.issueDate |

### Layer B — P0 non-BM-073
**3 removals across 3 BMs.** Rationale: P0 non-BM-073 destructive remove candidates.

| Decision ID | BM | Path |
|------------|----|------|
| DOCX-REMOVE-003 | BM-080 | person.personFullName |
| DOCX-REMOVE-004 | BM-063 | document.fullDocumentCode8 |
| DOCX-REMOVE-005 | BM-064 | document.issueDate4 |

### Layer C — P1 recipients footer suffix
**3 removals across 3 BMs.** Rationale: Nơi nhận suffix / anomalous clause removals.

| Decision ID | BM | Path |
|------------|----|------|
| DOCX-REMOVE-008 | BM-052 | recipients.personLine6 |
| DOCX-REMOVE-009 | BM-062 | recipients.personLine5 |
| DOCX-REMOVE-010 | BM-066 | recipients.personLine4 |

---

## Approval Status

- Combined draft: EXISTS
- applyAllowed: false
- approvalRequired: true
- approvedForApply: 0
- Required approval commands: see docs/audit/docx-path-binding-combined-destructive-decision-draft/decisions.draft.md

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Apply script created: **NO**
- Apply write: **0**

---

_Lane closure auto-generated. Do not edit manually._