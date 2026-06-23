# Phase F-2A — Alias and Metadata Audit Policy Implementation

**Phase**: F-2A (Non-destructive Implementation)
**Branch**: `remediation/phase-f-2a-alias-metadata-policy`
**Generated**: 2026-06-23T14:10:00+07:00
**Status**: Implementation complete

---

## Baseline (from Phase F-1)

| Check | Baseline | After F-2A |
|---|---|---|
| Blocking | 0 | 0 |
| Remediation | 15 | 7 |
| Warning | 58 | 70 |
| Gate | PASS | PASS |
| Smoke | PASS | PASS |
| Runtime Readiness | 213 locked / 0 draft | 213 locked / 0 draft |
| Stable Hash Tests | 25/25 PASS | 25/25 PASS |

**No DOCX modifications were made. No locked contracts were changed. No DB publish.**

---

## Implemented Policy

| Type | Count | Details |
|---|---:|---|
| Alias active | 3 unique fields | BM-063, BM-065, BM-067 canonical → suffixed aliases |
| Metadata-only active | 4 unique fields | BM-031 `agency.bodyName`, BM-036 `document.issueDate`, BM-065 `decision.decisionLine`, BM-052 `document.fullDocumentCode` |
| Remove pending | 2 unique fields | BM-052 `fullDocumentCode2`, BM-067 `fullDocumentCode2` |
| Conflict pending | 1 field | BM-052 `document.fullDocumentCode` (alias ↔ remove conflict) |

---

## Suppressed Audit Items

The following items were **previously flagged as remediation** and are now accepted per active audit policies:

| BM | Field | Previous Issue | Policy | New Classification |
|---|---|---|---|---|
| BM-031 | `agency.bodyName` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | metadata_only_alias | ACCEPTED_METADATA_ONLY_FIELD |
| BM-031 | `agency.bodyName` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | metadata_only_alias | ACCEPTED_METADATA_ONLY_FIELD |
| BM-036 | `document.issueDate` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | metadata_only | ACCEPTED_METADATA_ONLY_FIELD |
| BM-036 | `document.issueDate` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | metadata_only | ACCEPTED_METADATA_ONLY_FIELD |
| BM-063 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | alias_satisfied | FIELD_SATISFIED_BY_ALIAS |
| BM-063 | `document.fullDocumentCode` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | alias_satisfied | FIELD_SATISFIED_BY_ALIAS |
| BM-065 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | alias_satisfied | FIELD_SATISFIED_BY_ALIAS |
| BM-065 | `document.fullDocumentCode` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | alias_satisfied | FIELD_SATISFIED_BY_ALIAS |
| BM-065 | `decision.decisionLine` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | metadata_only_do_not_render | ACCEPTED_METADATA_ONLY_FIELD |
| BM-065 | `decision.decisionLine` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | metadata_only_do_not_render | ACCEPTED_METADATA_ONLY_FIELD |
| BM-067 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | alias_satisfied | FIELD_SATISFIED_BY_ALIAS |
| BM-067 | `document.fullDocumentCode` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | alias_satisfied | FIELD_SATISFIED_BY_ALIAS |

**8 remediation items suppressed** (remediation: 15 → 7).

---

## Remaining Governance Items

| BM | Field | Reason | Required Decision |
|---|---|---|---|
| BM-001 | 11 orphaned mustaches | Accepted no-action set — BM-001 is in the accepted no-action set per Wave 04E decisions | None — accepted |
| BM-002 | `sourceTransfer.attachedItemsDescription` | Accepted no-action set — BM-002 is in the accepted no-action set per Wave 04E decisions | None — accepted |
| BM-003 | 4 orphaned mustaches | Accepted no-action set — BM-003 is in the accepted no-action set per Wave 04E decisions | None — accepted |
| BM-052 | `document.fullDocumentCode2` | Remove-pending (RAR-001/RAR-004). Also: alias target for BM-052 `document.fullDocumentCode`. Removing it would break the alias. | Form-author: APPROVE_REMOVE / REJECT_REMOVE / DEFER |
| BM-052 | `document.fullDocumentCode` | Conflict-pending alias: same field is in both alias policy and remove-pending. Must resolve remove before activating alias. | Form-author: decide RAR-001/RAR-004 first |
| BM-067 | `document.fullDocumentCode2` | Remove-pending (RAR-002/RAR-003). No compound binding dependency. Safe to remove if approved. | Form-author: APPROVE_REMOVE / REJECT_REMOVE / DEFER |

---

## Implementation Details

### Active Policy Files

| File | Purpose |
|---|---|
| `docs/audit/docx/policies/field-alias-policy.json` | Active canonical-to-suffixed alias mappings |
| `docs/audit/docx/policies/metadata-only-policy.json` | Active metadata-only field suppressions |
| `docs/audit/docx/policies/remove-approval-requests.json` | Active remove approval requests |

### New Code

| File | Description |
|---|---|
| `scripts/docx-contract/lib/audit-policy-loader.mjs` | Read-only policy loader: `loadAuditPolicies()`, `createPolicyContext()`, query functions |
| `scripts/docx-contract/lib/form-corpus-quality.mjs` | Added `isSlotPolicySuppressed()`, `getSuppressionNote()`; `evaluateFormArtifact()` accepts optional `policies` parameter |
| `scripts/docx-contract/verify-locked-contracts.mjs` | Loads policies, passes to `evaluateFormArtifact()`, classifies notes separately from warnings |

### Audit Suppression Logic

```
isSlotPolicySuppressed(slotId):
  if remove-pending:    return false  (keep remediation)
  if metadata-only:      return true   (suppress)
  if alias-active:       return true   (suppress)
  if conflict-pending:  return false  (keep remediation)
  return false
```

### Test Files

| File | Tests |
|---|---|
| `test/docx-contract/audit-policy-loader.test.mjs` | 27 tests: policy loading, query functions, immutability |
| `test/docx-contract/audit-policy-behavior.test.mjs` | 14 tests: suppression behavior, edge cases |

---

## Verification

| Check | Result |
|---|---|
| verify locked | 213 locked, Blocking: 0, Remediation: 7 |
| remaining remediation inventory | 22 items (16 no-action + 4 conflict/remove + 2 remove) |
| gate | PASS |
| smoke | PASS |
| runtime readiness | 213 locked / 0 draft |
| audit policy tests | 41/41 PASS |
| stable hash tests | 25/25 PASS |

---

## Next

- **Phase F-2B**: Implement explicit remove approval workflow. Form-author records decisions for RAR-001 through RAR-004. Execute removals for any `APPROVE_REMOVE` items.
- **Phase F-2B**: Execute DOCX alias implementation: update renderBindings, remove orphaned mustaches, update `extractionSource.sha256`, republish contracts.
- **Do not perform destructive removals without `APPROVE_REMOVE`** — all remove requests remain pending until form-author decides.
- **BM-052 sequencing**: Form-author must decide RAR-001/RAR-004 before Phase F-2B implements BM-052 alias.
