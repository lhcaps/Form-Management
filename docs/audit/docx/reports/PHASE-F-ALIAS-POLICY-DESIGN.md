# Phase F-1 — Alias and Metadata Policy Design

**Phase**: F-1 (Non-destructive Design)
**Branch**: `remediation/phase-f-alias-policy-design`
**Generated**: 2026-06-23T12:45:00+07:00
**Status**: Design complete — ready for Phase F-2 implementation

---

## Baseline

| Check | Result |
|---|---|
| Blocking | 0 |
| Remediation | 15 |
| Warning | 58 |
| Gate | PASS |
| Smoke | PASS |
| Runtime Readiness | 213 locked / 0 draft |
| Stable Hash Tests | 25/25 PASS |

No DOCX modifications were made in this phase. No locked contracts were changed. No DB publish.

---

## Residual Classification Summary (from Wave 04E-3)

| Classification | Count | Status |
|---|---|---|
| AUDIT_CLASSIFICATION_ACCEPTED | 16 | No action — accepted no-action set (BM-001/002/003) |
| METADATA_ONLY_APPROVED | 8 | No DOCX change — metadata-only approved |
| ALIAS_PENDING_IMPLEMENTATION | 6 | Alias policy designed below |
| REMOVE_PENDING_EXPLICIT_APPROVAL | 4 | Remove approval requests designed below |

---

## Alias Candidates

**Root cause**: Canonical field has no DOCX slot; a suffixed variant (`fullDocumentCode8`, `fullDocumentCode6`, `fullDocumentCode2`) already renders the same data via a DOCX placeholder.

**Policy**: Alias canonical → suffixed slot. Update renderBinding. Remove orphaned canonical mustache from DOCX.

| BM | Canonical Field | Alias Slot | DOCX Placeholder | Risk | Reason |
|---|---|---|---|---|---|
| BM-063 | `document.fullDocumentCode` | `document.fullDocumentCode8` | `{{document.fullDocumentCode8}}` | low | Lệnh kê biên tài sản reference already rendered via `{{document.fullDocumentCode8}}`. Canonical has no DOCX slot. |
| BM-065 | `document.fullDocumentCode` | `document.fullDocumentCode8` | `{{document.fullDocumentCode8}}` | low | Same pattern as BM-063. Same lệnh kê biên reference. |
| BM-067 | `document.fullDocumentCode` | `document.fullDocumentCode6` | `{{document.fullDocumentCode6}}` | medium | Lệnh phong tỏa reference rendered via `{{document.fullDocumentCode6}}`. Do NOT alias to `fullDocumentCode2` (remove-pending). |
| BM-052 | `document.fullDocumentCode` | `document.fullDocumentCode2` | `{{document.fullDocumentCode2}}` | low | Cited deposit decision rendered via `decision.decisionLine2` which references `fullDocumentCode2`. Canonical has no DOCX slot. Alias keeps citation correct. |

### Contract Evidence

All facts confirmed by inspecting locked contracts:

```
BM-063: canonicalFields = [document.fullDocumentCode, document.fullDocumentCode8]
        renderBindings  = [document.fullDocumentCode→slot, document.fullDocumentCode8→slot]
        canonical document.fullDocumentCode: slotId exists, DOCX placeholder = null (ORPHANED)
        suffixed fullDocumentCode8: slotId exists, DOCX placeholder = {{document.fullDocumentCode8}} (ACTIVE)

BM-065: same pattern as BM-063

BM-067: canonicalFields = [document.fullDocumentCode, document.fullDocumentCode2, document.fullDocumentCode6]
        canonical document.fullDocumentCode: no DOCX placeholder (ORPHANED)
        suffixed fullDocumentCode6: {{document.fullDocumentCode6}} (ACTIVE)
        fullDocumentCode2: no DOCX placeholder (ORPHANED + REMOVE_PENDING)

BM-052: canonicalFields = [document.fullDocumentCode, document.fullDocumentCode2]
        canonical document.fullDocumentCode: no DOCX placeholder (ORPHANED)
        suffixed fullDocumentCode2: {{document.fullDocumentCode2}} (ACTIVE)
```

### Phase F-2 Implementation Steps (Alias)

1. Update renderBindings: canonical slot `document.fullDocumentCode` → change `from` to the suffixed field name.
2. Remove orphaned `{{document.fullDocumentCode}}` mustache from DOCX (4 BMs).
3. Update `extractionSource.sha256` in locked contracts for 4 BMs.
4. Republish locked contracts.
5. Run stable hash tests, gate, runtime readiness.
6. Decision `decision.decisionLine` in BM-065 is `METADATA_ONLY_DO_NOT_RENDER` — no DOCX change needed.

---

## Metadata-only Candidates

**Root cause**: Slot/binding exists but no DOCX placeholder is needed; value already rendered by compound parent field.

**Policy**: No DOCX change. Register suppressions in audit check engine. Slot remains functional for programmatic access.

| BM | Field | Rendered By | Reason |
|---|---|---|---|
| BM-031 | `agency.bodyName` | Compound agency header (parent + issuing agency lines) | Source form has only [1] parent + [2] issuing agency. No third agency-body blank. Adding placeholder would introduce noise. |
| BM-036 | `document.issueDate` | `document.issuePlaceDateLine` compound: `{issuePlace, issueDate}` | Atomic date already part of compound place-date line. Separate placeholder would duplicate date display. |
| BM-052 | `document.fullDocumentCode` | `decision.decisionLine2` + `document.fullDocumentCode2` | Cited decision rendered via compound decision line. Separate atomic field would duplicate citation. |
| BM-065 | `decision.decisionLine` | Static text (not a dynamic blank) | Official form has static description, not a numbered blank. Reviewer decided against dynamic citation unless explicitly requested. |

### Note on Audit Entries

Each field above has **2 audit entries** in the remediation inventory (one for `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`, one for `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`). Both entries are metadata-only approved. Total 8 entries = 4 unique fields × 2.

### Phase F-2 Implementation Steps (Metadata-only)

1. Register metadata-only suppressions in audit check engine.
2. No DOCX changes.
3. No locked contract changes.
4. No DB publish needed.
5. Verification: audit checks show metadata-only fields as suppressed (not blocking).

---

## Remove Approval Requests

**Root cause**: Reviewer flagged `REMOVE_OR_METADATA_ONLY` or `REMOVE_OR_REPEAT_CANONICAL` but explicit destructive approval was not granted.

**Policy**: No removal until `APPROVE_REMOVE` decision is recorded by form-author.

| ID | BM | Field | Slot | Reviewer Decision | Required Approval | Status |
|---|---|---|---|---|---|---|
| RAR-001 | BM-052 | `document.fullDocumentCode2` | CONTRACT_SLOT | `REMOVE_OR_METADATA_ONLY` | form-author | pending |
| RAR-002 | BM-067 | `document.fullDocumentCode2` | CONTRACT_SLOT | `REMOVE_OR_REPEAT_CANONICAL` | form-author | pending |
| RAR-003 | BM-067 | `document.fullDocumentCode2` | BINDING | `REMOVE_OR_REPEAT_CANONICAL` | form-author | pending |
| RAR-004 | BM-052 | `document.fullDocumentCode2` | BINDING | `REMOVE_OR_METADATA_ONLY` | form-author | pending |

### Critical Conflict: RAR-001/RAR-004 vs BM-052 Alias Policy

> **BM-052 alias policy maps `document.fullDocumentCode` → `document.fullDocumentCode2`.**
>
> If Phase F-2 implements the alias before remove approval is granted, removing `fullDocumentCode2` would break the alias.
>
> **Sequence constraint**: Form-author must decide on RAR-001/RAR-004 **before** Phase F-2 implements the BM-052 alias. If `APPROVE_REMOVE` is granted, remove `fullDocumentCode2` first, then alias `fullDocumentCode` to `fullDocumentCode6` (or another existing slot). If `REJECT_REMOVE` is granted, keep `fullDocumentCode2` and implement the alias as designed.

### Pre-removal Checklist

For each approval granted:

- [ ] Verify no runtime DB data exists in the field
- [ ] Verify no downstream compound binding depends on the field
- [ ] Update/remove renderBinding for the field
- [ ] Update DOCX: remove orphaned mustache if present
- [ ] Update `extractionSource.sha256` in locked contract
- [ ] Republish runtime DB
- [ ] Run stable hash tests

### Form-author Decision Record

Record in `remove-approval-requests.proposed.json`:

```json
{
  "id": "RAR-001",
  "approvalDecision": "APPROVE_REMOVE | REJECT_REMOVE | DEFER",
  "approvedBy": "<name>",
  "approvedAt": "<ISO timestamp>",
  "note": "<optional>"
}
```

---

## Proposed Runtime Behavior

### Alias Resolution

When alias policy is active and the alias mechanism is implemented in Phase F-2:

1. Form fills `document.fullDocumentCode` in the authoring UI.
2. At render time, the alias policy loader maps `document.fullDocumentCode` → `document.fullDocumentCode6` (or `fullDocumentCode8` or `fullDocumentCode2` depending on BM).
3. The render binding resolves the data to the suffixed slot.
4. DOCX renders `{{document.fullDocumentCode6}}` (or `{{document.fullDocumentCode8}}` or `{{document.fullDocumentCode2}}`) with the canonical field's data.
5. The orphaned `{{document.fullDocumentCode}}` mustache is removed from DOCX — no double-render.

### Metadata-only Fields

1. Slot and binding remain in contract for programmatic access.
2. Audit engine suppresses `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER` and `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER` for metadata-only fields.
3. Compound rendering field continues to display the data in DOCX.
4. No DOCX changes needed.

### Remove Requests

1. Form-author reviews RAR-001 through RAR-004.
2. If `APPROVE_REMOVE`: Phase F-2 or later executes removal — delete slot, update bindings, clean DOCX.
3. If `REJECT_REMOVE`: field is reclassified as `METADATA_ONLY_APPROVED` and item is closed.
4. If `DEFER`: item remains pending for a future phase.

---

## Proposed Audit Behavior

| Scenario | Current Behavior | Proposed Behavior |
|---|---|---|
| Canonical field aliased to suffixed slot | Remediation flagged (slot without placeholder) | Suppress when alias policy is active |
| Metadata-only field | Remediation flagged (slot without placeholder) | Suppress when metadata-only policy is active |
| Remove-pending field | Remediation flagged | No change — pending approval |
| Accepted no-action (BM-001/002/003) | Not flagged | Remain accepted — no change |
| BM-001/002/003 orphaned mustaches | Accepted as-is | Remain accepted — no change |

Audit suppressions apply only when the corresponding policy is loaded and active. Suppressions are **read-only** — they do not modify contracts or DOCX.

---

## Phase F-2 Implementation Plan

### Pre-F-2 Gate

- Form-author must record decision for RAR-001 through RAR-004 **before** Phase F-2 starts alias implementation for BM-052.
- If `APPROVE_REMOVE` for RAR-001/RAR-004: implement remove before alias for BM-052.

### F-2 Tasks

1. **Implement alias policy loader** (read-only): load `field-alias-policy.proposed.json` at startup, register aliases.
2. **Update renderBindings** for 4 BMs (BM-063, BM-065, BM-067, BM-052): redirect canonical slot bindings to suffixed slot.
3. **Remove orphaned mustaches** from DOCX for 4 BMs: `{{document.fullDocumentCode}}` mustache is orphaned after alias mapping.
4. **Update `extractionSource.sha256`** in locked contracts for 4 BMs.
5. **Republish locked contracts** and runtime DB.
6. **Implement metadata-only policy loader**: register suppressions in audit check engine.
7. **Run tests**: stable hash (25/25), gate, runtime readiness, smoke.
8. **Do NOT delete slots** unless explicit remove approval exists (per RAR workflow).

### F-2 Constraints (from Phase F-1 design)

- Do not delete `document.fullDocumentCode2` in BM-067 without `APPROVE_REMOVE`.
- Do not delete `document.fullDocumentCode2` in BM-052 without `APPROVE_REMOVE`.
- Do not implement BM-052 alias until form-author decides on RAR-001/RAR-004.
- All 213 locked forms must remain stable after changes.

---

## Verification

| Check | Result (Phase F-1 baseline) | Expected after Phase F-2 |
|---|---|---|
| verify locked | Pass: 213 | Pass: 213 |
| gate | PASS | PASS |
| smoke | PASS | PASS |
| runtime readiness | 213 locked / 0 draft | 213 locked / 0 draft |
| stable hash tests | 25/25 PASS | 25/25 PASS |
| remediation count | 15 | Expected to decrease for alias-implemented BMs (exact count depends on alias mechanism implementation) |

---

## Policy Files Generated

| File | Purpose |
|---|---|
| `field-alias-policy.proposed.json` | Canonical-to-suffixed alias mappings for 4 BMs |
| `metadata-only-policy.proposed.json` | Metadata-only field suppressions for 4 BMs (8 audit entries) |
| `remove-approval-requests.proposed.json` | 4 removal requests requiring explicit form-author approval |
| `PHASE-F-ALIAS-POLICY-DESIGN.md` | This report |

All files in `docs/audit/docx/reports/`. Classification: `proposed`. No production code or contracts modified.

---

## Risks and Open Items

| Risk | Severity | Mitigation |
|---|---|---|
| Form-author remove approval not granted before F-2 alias implementation for BM-052 | high | Block BM-052 alias implementation until RAR-001/RAR-004 decision is recorded |
| `document.fullDocumentCode2` in BM-052 is both alias target and remove-pending | high | Coordinate: decide remove vs. alias before implementing either |
| BM-067 `fullDocumentCode6` alias is medium risk because 3 slots exist | medium | Confirmed by contract: `fullDocumentCode6` renders the lệnh phong tỏa. `fullDocumentCode2` is remove-pending. Only alias to `fullDocumentCode6`. |
| Metadata-only suppressions may mask legitimate new issues | low | Suppressions are scoped by field+BM in policy. New fields not covered. |

---

## Next Steps

1. **Form-author**: Review `remove-approval-requests.proposed.json`. Record decision for RAR-001 through RAR-004.
2. **Phase F-2**: Implement alias policy loader, update renderBindings, remove orphaned mustaches, republish contracts.
3. **Phase F-2**: Implement metadata-only policy loader and audit suppressions.
4. **Post F-2**: Re-run verification. Remediation count should reflect resolved alias and metadata-only items.
5. **Future phase**: Execute remove workflow for any `APPROVE_REMOVE` items.
