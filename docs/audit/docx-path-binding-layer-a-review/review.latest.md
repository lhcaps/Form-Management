# DOCX Path/Binding — Layer A Review Report

Generated: 2026-06-27T04:04:00.000Z
Review task: REVIEW_LAYER_A_CLOSURE_BEFORE_LAYER_B
Status: **PASS_WITH_STALE_HINTS_TRACKED**

---

## Summary

| Check | Result |
|---|---|
| Backup preimage verified | PASS |
| Postimage diff verified | PASS |
| document.fullDocumentCode contradiction | **RESOLVED — SAFE** |
| formInputHints stale reference | TRACKED — harmless |
| Report consistency | FIXED and regenerated |
| Validation (pnpm typecheck) | exit 0 |
| Rollback needed | **NO** |
| Ready for Layer B | **YES** |

---

## Backup Preimage vs Postimage Diff

### Preimage (backup: `backups/2026-06-26T20-55-28-529Z/`)

| Array | Count |
|---|---|
| docxSlots | 5 |
| canonicalFields | 5 |
| renderBindings | 5 |
| **Total** | **15** |

### Postimage (current: `BM-073__e412fccad227.contract.locked.json`)

| Array | Count |
|---|---|
| docxSlots | 1 |
| canonicalFields | 1 |
| renderBindings | 1 |
| **Total** | **3** |

### Diff

| Metric | Value |
|---|---|
| docxSlots removed | 4 |
| canonicalFields removed | 4 |
| renderBindings removed | 4 |
| **Total removed** | **12** |
| Untouched entries | 3 (all `agency.name`) |
| Unexpected removals | 0 |
| `agency.name` preserved | **YES** |

---

## document.fullDocumentCode Contradiction Analysis

### Concern raised

> Evidence for DOCX-REMOVE-006 said: `canonicalEquivalent = "document.fullDocumentCode — legitimate, blockId=P0033 (label=Số văn bản)"`
> But post-apply contract has only `agency.name`.

### Investigation

**Preimage docxSlots for `document.fullDocumentCode`:**

```json
{
  "slotId": "document.fullDocumentCode",
  "label": "Slot from Wave 02 DOCX remediation",
  "blockId": null,
  "reviewRequired": true
}
```

**P0033 reference:** The `blockId=P0033` in the W2R-025 evidence text refers to the LEGITIMATE "Số văn bản" field in the BM-073 header — this is used as a comparison reference in the investigation. It is NOT a blockId on the orphan slot being removed.

**Preimage canonicalFields for `document.fullDocumentCode`:**

```json
{
  "path": "document.fullDocumentCode",
  "label": "Slot from Wave 02 DOCX remediation",
  "source": "manual",
  "reviewRequired": true
}
```

**Conclusion:** The backup preimage shows only ONE `document.fullDocumentCode` entry per array, and ALL have:
- `label = "Slot from Wave 02 DOCX remediation"` (not "Số văn bản")
- `blockId = null` (not P0033)

**No legitimate blockId=P0033 / "Số văn bản" field was removed.**

### Verdict: **SAFE — PASS**

---

## formInputHints Stale Reference Analysis

### Concern raised

Post-apply contract still contains `formInputHints.suggestedControls` referencing `document.field1`, `document.field2`, `document.field3`, `document.field5`, `document.field6` — some pointing to removed fields.

### Investigation

**Runtime priority rules (PLAN.md v2.3 §B1, `derive-form-input-schema.ts` lines 4-14):**

| Priority | Source | Role |
|---|---|---|
| 1 | canonicalFields | Primary source of field existence |
| 2 | renderBindings / docxSlots | Fallback for bound/rendered slots |
| 3 | formInputHints.suggestedControls | **UI hint refinement ONLY** |
| — | rejectedCandidates | Must NEVER become editable |

**Critical constraint:** `formInputHints` MUST NEVER create field existence. A hint pointing to a path not in canonicalFields or fallback arrays is **silently ignored**.

After Layer A removal:
- `document.field1` → not in canonicalFields, not in docxSlots, not in renderBindings → **silently ignored**
- `document.field2` → same
- `document.field3` → same
- `document.field5` → same
- `document.field6` → same (still in suggestedControls but not in any field array)

**Verdict:** Stale hints exist but are **harmless**. They are silently ignored by the form schema generator.

### Recommendation

Clean `formInputHints` in a separate approval-gated task. Do NOT clean in this review.

---

## Report Consistency

| Check | Status |
|---|---|
| decisions.draft.json item status | Consistent (4 APPLIED, 6 PENDING) |
| approval-plan.latest.json | Layer A=APPLIED, B=PENDING, C=PENDING |
| Generator script fixed | **YES** |
| Markdown regenerated | **YES** |
| Live counts in summary | **4 approved, 6 pending** |

### Generator script fixes applied

1. Added `existsSync` import and `APPROVAL_PLAN_JSON` path
2. Added `approvalPlan` + `planLookup` reading from approval-plan.latest.json
3. Added `planInfo` resolution to p0Items, p1b1Items, p1b2Items
4. Added `_liveApprovalProgress` to summary (computes from live item status)
5. Added `liveApproved` / `livePending` to markdown executive summary
6. Fixed `_liveApprovalProgress` filter to include both `APPROVED_FOR_APPLY` and `APPLIED` statuses

---

## Safety

| Check | Value |
|---|---|
| Locked contracts mutated | 1 (BM-073/e412fccad227) |
| DOCX touched | **0** |
| Source/path/binding directly changed | **0** |
| Compiled artifacts hand-edited | **0** |
| Layer B touched | **0** |
| Layer C touched | **0** |
| Backup created | **true** |

---

## Validation

| Command | Exit code |
|---|---|
| `pnpm typecheck` | **0** (passed) |

---

## Final Recommendation

**`LAYER_A_REVIEW_PASS_WITH_STALE_HINTS_TRACKED`**

**Rationale:**
- Layer A removed only orphan slots (blockId=null, label="Slot from Wave 02 DOCX remediation")
- No legitimate blockId=P0033 field was removed
- No rollback needed
- Stale formInputHints are harmless per PLAN.md v2.3 §B1
- Generator script fixed; reports regenerated and consistent
- `pnpm typecheck` exit 0

**Next task:** `WAIT_FOR_LAYER_B_APPROVAL`

Layer B approval command (pending):

```
APPROVE_DESTRUCTIVE_LAYER B BM-080 BM-063 BM-064 a7aa64d4b889 54b73110a34f 4d8cebc3515b DOCX-REMOVE-003 DOCX-REMOVE-004 DOCX-REMOVE-005
```
