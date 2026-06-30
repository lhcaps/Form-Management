# Worktree Inventory — INFRA_REBUILD_VERIFICATION_AND_LOCKDOWN

Generated: 2026-06-28T16:09:00.000Z
Branch: `fix/documents-canonical-render-payload-snapshot`

## Summary

| Category | Files | Safety |
|---|---|---|
| PDF export integrity | 1 | GUARD |
| Contract sync guard | 2 | GUARD |
| Render gate infra | 1 | GATE |
| OOXML repair infra | 1 | REPAIR |
| Contract-render binding repair infra | 1 | REPAIR |
| Contract structural cleanup infra | 1 | REPAIR |
| Atlas builders | 4 | BUILD |
| Audit scripts | 2 | SCRIPT |
| Contract compiled-v2 | 19 | MUTATION |
| Contract locked | 19 | MUTATION |
| Normalized DOCX | 6 | HIGH_SCRUTINY |
| Baseline/artifacts | 5 | ARTIFACT |
| Total modified tracked | 55 | |

## Infrastructure Files (READ_ONLY_VERIFICATION scope)

| File | Category | Safety |
|---|---|---|
| `apps/api/src/modules/documents/document-pdf.service.ts` | pdf_export_integrity | GUARD |
| `apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts` | contract_sync_guard | GUARD |
| `apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.spec.ts` | contract_sync_guard | GUARD |
| `scripts/audit/render-form-fidelity-gate.mjs` | render_gate | GATE |
| `scripts/audit/lib/ooxml-stray-brace-repair.mjs` | ooxml_repair | REPAIR |
| `scripts/audit/lib/contract-render-binding-repair.mjs` | binding_repair | REPAIR |
| `scripts/audit/apply-contract-structural-cleanup-v1.mjs` | structural_cleanup | REPAIR |
| `scripts/audit/build-contract-atlas-v1.mjs` | atlas_builder | BUILD |
| `scripts/audit/build-docx-atlas-v1.mjs` | atlas_builder | BUILD |
| `scripts/audit/build-render-atlas-v1.mjs` | atlas_builder | BUILD |
| `scripts/audit/build-smart-remediation-queue-v1.mjs` | atlas_builder | BUILD |
| `scripts/audit/audit-forms-root-cause.mjs` | audit_script | SCRIPT |
| `scripts/audit/refresh-213-docx-fidelity-board.mjs` | audit_script | SCRIPT |

## Corpus Mutations (must be verified separately)

### Contract Locked (19 files)

All 19 are intentional structural cleanup per Codex report:

- BM-001, BM-002, BM-003 (field/slot/binding additions)
- BM-021, BM-065, BM-067 (structural cleanup — claimed by Codex)
- BM-022, BM-025, BM-032, BM-036, BM-064, BM-066, BM-080, BM-167 (slot additions)
- BM-052, BM-062, BM-063, BM-073, BM-096 (path-domain binding + structural changes)

### Compiled-v2 (19 files)

Same 19 BM files — regenerated after locked contract changes. All `contractHash` updated.

### Normalized DOCX (6 files)

⚠️ **CRITICAL — Requires OOXML repair proof before acceptance:**

| BM | Before | After | Reduction | Flag |
|---|---|---|---|---|
| BM-031 | 82,870 B | 19,284 B | -76.7% | CRITICAL |
| BM-052 | 68,046 B | 11,079 B | -83.7% | CRITICAL |
| BM-062 | 92,886 B | 13,077 B | -85.9% | CRITICAL |
| BM-021 | 10,408 B | 10,399 B | -0.09% | OK |
| BM-044 | 20,327 B | 20,311 B | -0.08% | OK |
| BM-056 | 48,247 B | 48,241 B | -0.01% | OK |

BM-031, BM-052, BM-062 massive size reduction → must have OOXML repair evidence before accepting.

## Untracked Files

97 untracked files. Key categories:

- **30 new test files** in `test/` directory
- **40+ new apply/plan scripts** in `scripts/audit/`
- **Atlas artifacts** in `docs/audit/213-docx-fidelity-board/` and `docs/audit/docx-atlas-v1/`
- **Historical audit dirs** (wave-02, path-domain-binding, etc.)

## Flagged Issues

1. **CRITICAL**: 3 DOCX files (BM-031, BM-052, BM-062) have >75% size reduction. Must verify OOXML repair proof.
2. **MUTATION**: 38 contract/corpus files changed (19 locked + 19 compiled-v2). Not purely infrastructure.
3. **LARGE_SCOPE**: 97 untracked files including many new test and apply scripts.
