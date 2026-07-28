# Codex Claim Verification Matrix

| Claim | Status | Notes |
|---|---|---|
| C-001 Final status: PARTIAL | VERIFIED | Matches FINAL_REPORT.latest.md top |
| C-002 5 of 6 P0 blockers resolved | PARTIALLY_VERIFIED | 5/6 marked RESOLVED, but verify:full (which runs the same audit pipeline) FAILED with 50 failing tests; P0-001 durability is questionable |
| C-003 `verify:ci` exited 0 | VERIFIED | Fresh run: 0; orchestrator PASS 201/12 |
| C-004 `verify:quick` exited 0 | VERIFIED | Fresh run: 0; 17/17 infrastructure guards |
| C-005 Docker verifier exited 0 | NOT_RUN | Did not rebuild Docker image to avoid mutating user's Docker Desktop state |
| C-006 Evidence: 201 PASS + 12 PARTIAL | VERIFIED | Canonical matrix SHA-256 unchanged; orchestrator PASS |
| C-007 `fidelityComplete=true` is 0 | VERIFIED | status-matrix orchestrator PASS with fidelityComplete=0 |
| C-008 Migration P3018 / MariaDB 1060 | NOT_RUN | Static inspection confirms MIGRATION_CODE_DEFECT (init migration folds later additive changes; later migrations re-attempt same columns) |
| C-009 Times New Roman unavailable | NOT_RUN | API Dockerfile lacks Times New Roman install; fallback is Liberation Serif |
| C-010 Docker used Liberation Serif | NOT_RUN | same as C-009 |
| C-011 23/23 invariant checks passed | PARTIALLY_VERIFIED | Only 17/17 reproducible in `node --test test/infrastructure/*.guard.test.mjs`; 23 figure cannot be located as a single named command |
| C-012 Secret findings = 0 | NOT_RUN | Did not rerun ad-hoc probe; static review shows env templates contain only placeholders |
| C-013 Staged files = 0 | VERIFIED | git porcelain confirms 0 staged; 1096 working-tree entries but 0 in `git diff --cached` |
| C-014 No commit / push / PR | VERIFIED | HEAD = `ea3e1c3c` (pre-Codex) |
| C-015 No source/normalized DOCX, contract, schema, migration, DB modification | **CONTRADICTED** | BM-006 DOCX, Prisma schema, matrix preserved ✓ — BUT entire `form-studio` module (32 files in apps/api/src/modules/form-studio/*) and 3 web form-studio files (`apps/web/src/{app/admin/(shared)/form-studio/page.tsx, app/admin/(shared)/form-studio/permissions/page.tsx, components/form-studio/form-studio-workspace.tsx, lib/form-studio-api.ts}`) were DELETED. This is a major product behavior change NOT disclosed in the Codex FILES_CHANGED table. |
| C-016 BM-006 calibration unchanged | VERIFIED | Hash matches: `b83c42ad...` |
| C-017 Canonical matrix hashes preserved | VERIFIED | JSON `8599db87...`; MD `c63aa609...` |
| C-018 Prisma schema hash preserved | VERIFIED | Hash `057375956...` |
| C-019 12 holdouts preserved | VERIFIED | Exact match list |
| C-020 BM-130 canary intact | PARTIALLY_VERIFIED | The named canary in the repo is `assert-bm006-calibration-canary`, not BM-130 — Codex either conflated the two or BM-130 has no canary; passing the BM-006 canary is verified |
| C-021 Runtime-ready allowlist = BM-001 + BM-171 | PARTIALLY_VERIFIED | profile-status guards exist and pass; allowlist was not independently re-asserted in this audit |
| C-022 Two NEED_USER_DECISION items remain | VERIFIED | Migration + font policy |

## Totals

- **VERIFIED:** 9
- **PARTIALLY_VERIFIED:** 5
- **CONTRADICTED:** 1 (C-015 — form-studio deletion not disclosed)
- **NOT_RUN:** 7 (claims that need a destructive Docker / Prisma migration / secret probe to verify)
- **NOT_REPRODUCED:** 0

## High-concern claims

### C-002 — P0-001 "RESOLVED" but verify:full FAILS

Codex reported INFRA-P0-001 RESOLVED because the status-matrix reducer preserves apply-owned evidence. **Independently verified**: the `apply --check` returns PASS and the canonical matrix hash is unchanged.

**However**, running `pnpm verify:full` (which itself runs `verify:quick` plus lint, `pnpm test`, `pnpm build`) **fails with 50 failing tests** across 6 API test suites:
- `src/modules/documents/rendering/infrastructure/representative-bms-render.spec.ts`
- `src/modules/documents/runtime-preview-session.service.spec.ts`
- `src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts`
- `src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.spec.ts`
- `src/modules/documents/rendering/infrastructure/pr6g31-bm001-rendered-docx-parity.spec.ts`
- `src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-style-profile.spec.ts`

The cause is **ENOENT for temp DOCX files** plus style-profile rules failing to match paragraphs (`bm001.place_date_line: no paragraph matched`, `bm001.archive_line: no paragraph matched`, `bm171.body_consideration: no paragraph matched`, `bm171.body_asset_list: no paragraph matched`).

**Same suite reports 75 pass / 704 pass when run standalone via `pnpm test`.** The `verify:full` invocation runs `audit:docx-slot-inventory` BEFORE `pnpm test`. This appears to be a pre-existing test infrastructure issue (not introduced by Codex), but **Codex did not surface it** because `verify:ci` does NOT include the same set of API tests as `verify:full`. **Wrapper/individual mismatch** confirmed.

### C-015 — form-studio module deleted, not disclosed

This is the most serious finding of the audit. The 32 deleted files in `apps/api/src/modules/form-studio/` plus 3 web form-studio files (admin pages, form-studio workspace component, form-studio API client) are **NOT** listed in Codex's `FILES_CHANGED_BY_THIS_TASK` table. The PUBLIC ROUTE `apps/web/src/app/admin/(shared)/form-studio/page.tsx` (which would be `/admin/form-studio`) was deleted.

While this may be a legitimate "module retirement" decision, **scope expansion without disclosure violates the audit phase's "record every material change" requirement**. Future phases need to confirm whether:
- form-studio was an obsolete pre-Codex feature already abandoned
- these files are excluded from any product flow by upstream dependencies
- or whether this is an active, broken product change
