# DOCX Path/Binding — Layer C Apply Report

Generated: 2026-06-26T21:32:43.627Z
Task: DOCX_PATH_BINDING_LAYER_C_APPLY
Mode: **WRITE**

Approval command:

```
APPROVE_DESTRUCTIVE_LAYER C BM-052 BM-062 BM-066 9919ecdb3971 110961a781fa e3bc56081554 DOCX-REMOVE-008 DOCX-REMOVE-009 DOCX-REMOVE-010
```

---

## Decisions Applied

| Decision | BM | SourceId | Path Removed |
|---|---|---|---|
| DOCX-REMOVE-008 | BM-052 | 9919ecdb3971 | recipients.personLine6 |
| DOCX-REMOVE-009 | BM-062 | 110961a781fa | recipients.personLine5 |
| DOCX-REMOVE-010 | BM-066 | e3bc56081554 | recipients.personLine4 |

---

## Diff Summary

### BM-052 / recipients.personLine6

| Array | Before | After | Removed |
|---|---|---|---|
| docxSlots | 6 | 5 | recipients.personLine6 |
| canonicalFields | 6 | 5 | recipients.personLine6 |
| renderBindings | 6 | 5 | recipients.personLine6 |

### BM-062 / recipients.personLine5

| Array | Before | After | Removed |
|---|---|---|---|
| docxSlots | 6 | 5 | recipients.personLine5 |
| canonicalFields | 6 | 5 | recipients.personLine5 |
| renderBindings | 6 | 5 | recipients.personLine5 |

### BM-066 / recipients.personLine4

| Array | Before | After | Removed |
|---|---|---|---|
| docxSlots | 6 | 5 | recipients.personLine4 |
| canonicalFields | 6 | 5 | recipients.personLine4 |
| renderBindings | 6 | 5 | recipients.personLine4 |

---

## Safety

| Check | Value |
|---|---|
| Locked contracts mutated | 3 |
| DOCX touched | **0** |
| Source/path/binding directly touched | **0** |
| Domain-model paths added | **0** |
| Keep-deferred paths touched | **0** |
| Layer A/B contracts touched | **0** |
| Backup created | YES |

**Backup path:** `docs/audit/docx-path-binding-layer-c-approved/backups/2026-06-26T21-32-43-625Z/`

---

## Dry-run vs Write

| Metric | Dry-run | Write |
|---|---|---|
| Contracts processed | 3 | 3 |
| Total entries removed | 9 | 9 |
| Locked contracts mutated | 0 | 3 |
| Errors | 0 | 0 |

---

## Next Task

`REVIEW_LAYER_C_CLOSURE_AND_COMBINED_DESTRUCTIVE_LANE_CLOSURE`
