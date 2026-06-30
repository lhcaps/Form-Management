# .gitignore Review — REPO_HYGIENE_AND_SOT_GATES_V1

**Generated:** 2026-06-29T00:00:00.000Z

---

## Current .gitignore Assessment

The current `.gitignore` is **adequate** for audit artifacts. No changes are needed at this time.

### Audit-relevant existing rules:

| Pattern | Assessment |
|---------|------------|
| `storage/generated/` | SAFE — generated test artifacts |
| `audit_renders/` | SAFE — temp render outputs |
| `.harness/` | SAFE — harness local state |
| `.codegraph/` | SAFE — per-machine index |
| `.cache/`, `.gsd/`, `.planning/` | SAFE — local build artifacts |
| `*.tmp` | SAFE — temp files |

---

## NEVER Add to .gitignore

These paths are **FORBIDDEN** to add to `.gitignore`:

| Path | Reason |
|------|--------|
| `docs/audit/docx/contracts/locked/` | **Semantic SOT** — losing these loses canonical data |
| `docs/audit/docx/compiled-v2/` | **Derived artifact** — must stay committed to detect stale (BM-063, BM-066) |
| `docs/audit/form-authoring-baselines/` | **Human-reviewed ledger** — do NOT lose |
| `docs/audit/sot-rebase-v1/` | **SOT gate output** with CRITICAL findings |
| `docs/audit/sot-gates-v1/` | **SOT gate** created by this task |
| `docs/audit/forms-root-cause/` | **Active remediation gate** |
| `docs/audit/docx-atlas-v1/` | **Active structural atlas** |

---

## Safe Candidates (after move)

After moving folders to `docs/audit/_archive/`, the following can be added to `.gitignore`:

| Pattern | Source Folder | Size | Rationale |
|---------|--------------|------|-----------|
| `docs/audit/_archive/` | `per-form-render-accurate/` | 2.19 MB | Regeneratable |
| `docs/audit/_archive/` | `compiled-v2-reconciliation/` | 0.02 MB | One-off |
| `docs/audit/_archive/` | `infra-rebuild-verification/` | 0.05 MB | One-off |

**However:** Cannot add `docs/audit/_archive/` until:
1. All GENERATED_REPORT folders are moved to `_archive/`
2. Hardcoded paths in 12 scripts are updated
3. Planner approves the move

---

## Recommended Future Addition

After folder migration is complete:

```gitignore
# Archived audit artifacts (moved from docs/audit/)
docs/audit/_archive/
```

**Rationale:** Once one-off/completed report folders are safely moved to `_archive/`, the archive directory can be ignored since it contains only regenerated or expendable data.

---

## Decision

**Change .gitignore:** `NO`

**Reason:** No safe changes available. All audit artifacts are either:
- Canonical SOT (never ignore), or
- GENERATED_REPORT (must move first before ignoring)

**Required next step:** Planner task to move folders → then add `docs/audit/_archive/` to `.gitignore`.
