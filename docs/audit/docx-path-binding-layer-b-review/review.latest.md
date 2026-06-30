# DOCX Path/Binding — Layer B Review Report

Generated: 2026-06-27T04:25:00.000Z
Review task: REVIEW_LAYER_B_CLOSURE_BEFORE_LAYER_C
Status: **PASS_WITH_STALE_HINTS_TRACKED**

---

## Summary

| Check | Result |
|---|---|
| Preimage vs postimage diff | PASS — exactly 3 paths removed, 9 entries |
| Legitimate fields preserved | PASS — 3 legitimate fields intact |
| KEEP_DEFERRED preserved | PASS — BM-063 recipients.personLine5 untouched |
| Domain-model paths NOT implemented | PASS |
| Cross-layer script change | SAFE — cosmetic hygiene only |
| Stale formInputHints | TRACKED — harmless per PLAN.md v2.3 §B1 |
| Report consistency | PASS |
| Validation (pnpm typecheck) | exit 0 |
| Rollback needed | **NO** |
| Ready for Layer C | **YES** |

---

## Preimage vs Postimage Diff

### BM-080 / person.personFullName (DOCX-REMOVE-003)

| Array | Preimage | Postimage | Removed |
|---|---|---|---|
| docxSlots | 7 | 6 | `person.personFullName` |
| canonicalFields | 7 | 6 | `person.personFullName` |
| renderBindings | 7 | 6 | `person.personFullName` |

**Preserved:** agency.name, document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.currentAddress, legalBasis.legalBasisLine

**Out-of-scope (not Layer B failures):** document.fullDocumentCode (orphan), document.issueDate (orphan), person.dateOfBirth (orphan), person.currentAddress (orphan), legalBasis.legalBasisLine (orphan) — all have blockId=null and label="Slot from Wave 02 DOCX remediation". They require separate review and are NOT removed by Layer B.

---

### BM-063 / document.fullDocumentCode8 (DOCX-REMOVE-004)

| Array | Preimage | Postimage | Removed |
|---|---|---|---|
| docxSlots | 6 | 5 | `document.fullDocumentCode8` |
| canonicalFields | 6 | 5 | `document.fullDocumentCode8` |
| renderBindings | 6 | 5 | `document.fullDocumentCode8` |

**Legitimate field preserved:** `document.fullDocumentCode` (blockId=P0033, label="Số văn bản") — untouched ✓

**KEEP_DEFERRED preserved:** `recipients.personLine5` — KEEP_DEFERRED in PRIOR-DXR-006, NOT in Layer B removal list. Preserved correctly ✓

---

### BM-064 / document.issueDate4 (DOCX-REMOVE-005)

| Array | Preimage | Postimage | Removed |
|---|---|---|---|
| docxSlots | 3 | 2 | `document.issueDate4` |
| canonicalFields | 3 | 2 | `document.issueDate4` |
| renderBindings | 3 | 2 | `document.issueDate4` |

**Legitimate field preserved:** `document.fullDocumentCode` (blockId=P0024, label="Số văn bản") — untouched ✓

---

## Domain-Model Proposals — NOT Implemented

| Tentative Path | BM | Implemented? |
|---|---|---|
| `defender.cardLicenseNumber` | BM-080 | **NO** |
| `antecedentDocument.fullDocumentCode` | BM-063 | **NO** |
| `antecedentDocument.issueDate` | BM-064 | **NO** |

All three tentative paths were verified absent from docxSlots, canonicalFields, renderBindings, and formInputHints of all modified contracts. Domain-model proposals remain as proposals only.

---

## Cross-Layer Script Change

**File:** `scripts/audit/apply-docx-path-binding-layer-a-approved.mjs`

**Change:** Added `[...new Set(removed.map(r => r.path || r.slotId))]` deduplication to `removedPaths` to prevent cosmetic duplicates in apply reports.

**Impact on Layer A:** NONE — Layer A contracts already written, no re-run needed.

**Impact on Layer A reports:** NONE — all reports regenerated after Layer A apply.

**Impact on Layer B:** NONE — Layer B uses a separate script.

**Safety verdict:** SAFE — cosmetic/safety-hygiene change only. Does not affect contract data or historical audit trail.

---

## Stale formInputHints Analysis

All three contracts have `formInputHints.suggestedControls` referencing stale `.field#` paths that do not exist in canonicalFields or fallback arrays.

Per PLAN.md v2.3 §B1 (derive-form-input-schema.ts lines 4-14):
- canonicalFields = priority 1
- renderBindings/docxSlots = priority 2
- formInputHints = priority 3, UI hint refinement only
- formInputHints MUST NEVER create field existence

Stale hints are silently ignored by the form schema generator. No UI orphan controls will appear.

| Contract | Stale hints | Action |
|---|---|---|
| BM-080 | document.field1/2/4/5, person.field3, legalBasis.field6, agency.field7, document.field8 | Track only |
| BM-063 | document.field10/11/12/13, legalBasis.field14, document.field15 | Track only |
| BM-064 | document.field2/4, agency.field5, document.field6 | Track only |

Do NOT clean in this review. Clean in a separate approval-gated task.

---

## Report Consistency

| Check | Result |
|---|---|
| decisions.draft.json — DOCX-REMOVE-001..007 | APPLIED ✓ |
| decisions.draft.json — DOCX-REMOVE-008..010 | PENDING_APPROVAL ✓ |
| approval-plan — Layer A | APPLIED ✓ |
| approval-plan — Layer B | APPLIED ✓ |
| approval-plan — Layer C | PENDING_APPROVAL ✓ |
| Live counts (APPLIED/PENDING) | 7/3 ✓ |

---

## Safety

| Check | Value |
|---|---|
| Locked contracts mutated | 3 (BM-080, BM-063, BM-064) |
| DOCX touched | **0** |
| Source/path/binding directly changed | **0** |
| Compiled artifacts hand-edited | **0** |
| Layer A touched | **0** |
| Layer C touched | **0** |
| Domain-model paths added | **0** |

---

## Validation

| Command | Exit code |
|---|---|
| `pnpm typecheck` | **0** (passed) |

---

## Final Recommendation

**`LAYER_B_REVIEW_PASS_WITH_STALE_HINTS_TRACKED`**

**Rationale:**
- Exactly 3 orphan paths removed from 3 contracts (9 total entries)
- Legitimate fields with blockIds (P0033, P0024) preserved intact
- KEEP_DEFERRED items preserved
- No domain-model paths implemented
- No rollback needed
- Cross-layer script change is cosmetic hygiene only
- Stale formInputHints are harmless per PLAN.md v2.3 §B1
- Reports consistent
- `pnpm typecheck` exit 0

**Next task:** `WAIT_FOR_LAYER_C_APPROVAL`

Layer C approval command (pending):

```
APPROVE_DESTRUCTIVE_LAYER C BM-052 BM-062 BM-066 9919ecdb3971 110961a781fa e3bc56081554 DOCX-REMOVE-008 DOCX-REMOVE-009 DOCX-REMOVE-010
```
