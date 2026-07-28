# Form Flight Rollout Matrix

> Generated: 2026-07-05T17:56:22.996Z
> Scope: **classification only** — no deep fix, no locked contract mutation.
> Total forms: 60

## Summary

| Bucket | Count |
|---|---:|
| READY_FOR_PROFILE_PORT | 27 |
| NEEDS_PROFILE_FIELDS | 5 |
| NEEDS_SAVE_ADAPTER | 27 |
| NEEDS_RENDER_PAYLOAD_MAPPING | 0 |
| NEEDS_DOCX_CONTRACT_REVIEW | 0 |
| NEEDS_LEGAL_REVIEW | 0 |
| BLOCKED | 1 |

## Per-form classification

| BM | Status | Complexity | Fields (req) | Next action |
|---|---|---|---|---|
| BM-001 | READY_FOR_PROFILE_PORT | M | 39 (28) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-002 | NEEDS_PROFILE_FIELDS | M | 30 (29) | Fix demo fixture leaks, then generate FormFlightProfile skeleton. |
| BM-003 | NEEDS_SAVE_ADAPTER | M | 14 (14) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-005 | NEEDS_SAVE_ADAPTER | M | 16 (13) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-006 | NEEDS_SAVE_ADAPTER | M | 15 (15) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-007 | NEEDS_SAVE_ADAPTER | M | 17 (14) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-008 | NEEDS_PROFILE_FIELDS | M | 14 (14) | Fix demo fixture leaks, then generate FormFlightProfile skeleton. |
| BM-009 | NEEDS_SAVE_ADAPTER | M | 16 (16) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-010 | NEEDS_PROFILE_FIELDS | M | 15 (15) | Fix demo fixture leaks, then generate FormFlightProfile skeleton. |
| BM-011 | NEEDS_SAVE_ADAPTER | M | 15 (15) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-012 | NEEDS_PROFILE_FIELDS | M | 14 (14) | Fix demo fixture leaks, then generate FormFlightProfile skeleton. |
| BM-014 | NEEDS_SAVE_ADAPTER | M | 19 (17) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-015 | NEEDS_SAVE_ADAPTER | M | 28 (27) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-016 | NEEDS_SAVE_ADAPTER | M | 30 (29) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-017 | NEEDS_SAVE_ADAPTER | M | 14 (14) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-018 | NEEDS_SAVE_ADAPTER | M | 17 (17) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-023 | READY_FOR_PROFILE_PORT | S | 17 (17) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-030 | NEEDS_SAVE_ADAPTER | M | 14 (14) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-031 | NEEDS_SAVE_ADAPTER | M | 16 (15) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-033 | READY_FOR_PROFILE_PORT | S | 21 (20) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-037 | READY_FOR_PROFILE_PORT | S | 19 (18) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-038 | READY_FOR_PROFILE_PORT | S | 20 (19) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-039 | READY_FOR_PROFILE_PORT | M | 40 (37) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-040 | READY_FOR_PROFILE_PORT | S | 20 (19) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-042 | READY_FOR_PROFILE_PORT | S | 23 (22) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-043 | READY_FOR_PROFILE_PORT | S | 19 (18) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-044 | READY_FOR_PROFILE_PORT | S | 21 (20) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-045 | READY_FOR_PROFILE_PORT | S | 20 (19) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-046 | NEEDS_SAVE_ADAPTER | M | 20 (19) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-047 | NEEDS_SAVE_ADAPTER | M | 34 (31) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-053 | READY_FOR_PROFILE_PORT | M | 34 (27) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-054 | READY_FOR_PROFILE_PORT | M | 28 (25) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-055 | READY_FOR_PROFILE_PORT | M | 33 (30) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-056 | READY_FOR_PROFILE_PORT | M | 29 (26) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-057 | READY_FOR_PROFILE_PORT | M | 28 (25) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-058 | READY_FOR_PROFILE_PORT | M | 36 (31) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-059 | READY_FOR_PROFILE_PORT | M | 40 (37) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-070 | NEEDS_SAVE_ADAPTER | M | 17 (17) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-071 | NEEDS_PROFILE_FIELDS | M | 19 (18) | Fix demo fixture leaks, then generate FormFlightProfile skeleton. |
| BM-085 | NEEDS_SAVE_ADAPTER | M | 19 (17) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-086 | NEEDS_SAVE_ADAPTER | M | 18 (18) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-090 | NEEDS_SAVE_ADAPTER | M | 18 (17) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-097 | READY_FOR_PROFILE_PORT | M | 32 (26) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-103 | NEEDS_SAVE_ADAPTER | M | 21 (21) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-104 | NEEDS_SAVE_ADAPTER | M | 18 (18) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-141 | NEEDS_SAVE_ADAPTER | M | 19 (19) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-144 | NEEDS_SAVE_ADAPTER | M | 17 (17) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-145 | NEEDS_SAVE_ADAPTER | M | 21 (20) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-146 | NEEDS_SAVE_ADAPTER | M | 18 (17) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-148 | READY_FOR_PROFILE_PORT | M | 30 (27) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-150 | NEEDS_SAVE_ADAPTER | M | 22 (22) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-156 | NEEDS_SAVE_ADAPTER | M | 41 (28) | Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile. |
| BM-159 | READY_FOR_PROFILE_PORT | S | 15 (15) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-166 | READY_FOR_PROFILE_PORT | S | 14 (14) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-168 | READY_FOR_PROFILE_PORT | S | 14 (14) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-169 | READY_FOR_PROFILE_PORT | S | 20 (20) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-170 | READY_FOR_PROFILE_PORT | S | 17 (17) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-171 | READY_FOR_PROFILE_PORT | M | 34 (31) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| BM-172 | BLOCKED | XL | 34 (31) | Create component + registry entry first; port later. |
| BM-173 | READY_FOR_PROFILE_PORT | S | 16 (16) | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |

## Forbidden scope check

- No commit. No push. No PR.
- No mass rollout of 213 forms.
- No deep fix performed on any of the 60 forms.
- No canonicalization of 55 non-canonical forms.
- No mutation of locked contracts or normalized DOCX or source DOCX.
- No auth/RBAC rewrite. No route merging. No fake generatedDocumentId.

## Rollout plan

1. **Batch 1 — READY + small**: the `S` complexity READY forms. ~30-45 min per form.
2. **Batch 2 — READY + medium/large**: `M` and `L` complexity READY forms.
3. **Batch 3 — NEEDS_SAVE_ADAPTER** (shared refactor of save handler, then per-form port).
4. **Batch 4 — NEEDS_RENDER_PAYLOAD_MAPPING** (mapper per domain group).
5. **Batch 5 — NEEDS_PROFILE_FIELDS / NEEDS_DOCX_CONTRACT_REVIEW / NEEDS_LEGAL_REVIEW** (each batch gates the next).
6. **Batch 6 — BLOCKED** (write the missing component first; do not roll into shared core).

