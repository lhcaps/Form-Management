# QLLaw Infrastructure Modernization - Canonical Current Report

Generated: 2026-07-11T20:43:19.591Z
Canonical run: `phase8d-finalfix-20260711203313z`
Branch: `audit/bm006-visual-fidelity-evidence`
HEAD: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`

This file is the single current-state report. Older Phase 8C/8C.2 reports remain historical evidence and do not override this result.

## STATUS

`READY_FOR_OPERATOR`

Phase 8D technical closure: `COMPLETE`. This is not a `PRODUCTION_READY` declaration.

## STATUS_NOTE

Bootstrap, hostile-SQL-mode handling, transaction atomicity, fresh migration, readiness, restart, exact validation, reporting, and cleanup passed. The only remaining work is the operator-controlled persistent metadata transition, human visual sign-off, and a fresh authenticated nine-form throttling collection.

## CURRENT_SOURCE_TRUTH

- Migration: `apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql`; SHA-256 `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`.
- Contracts: 213 locked / 213 compiled / 213 bootstrap rows per table.
- Corpus fingerprint: `ab417791bfa58dbd831fcb33190593c050ba7730f5c6660de4c23bf8d16a4e14`.
- Bootstrap SQL: 6,765,800 UTF-8 bytes; SHA-256 `d6becce48275c49348e475bc4156038a1aed61095becabb4f88c4ba5d022ce81`.
- Production-equivalent closure image: `sha256:2f0e7b8447e9ed7d65341708a1e308a6903ab17d528b6ee11f34c417366640f1`.
- Legacy-column drift is not active.

## BM031_ROOT_CAUSE

BM-031 is not a source-data-quality failure. Its canonical draft JSON is valid and contains 12 escaped double quotes. The legacy generic SQL serializer doubled apostrophes but not backslashes, so MariaDB's default literal parser consumed those escape backslashes before the JSON constraint ran. The fix doubles backslashes before apostrophes and explicitly removes `NO_BACKSLASH_ESCAPES` from only the apply session before any literals or transaction begin. All other session modes are preserved; server-global SQL mode is never changed by the generator.

The official apply also uses the installed API `mariadb` driver, table-qualified schema probes, and the API-relative Prisma schema path. No BM-031 special case and no locked DOCX/contract mutation were introduced.

Sanitized failed attempts retained: early probes hit shell quoting, ESM import, BigInt serialization, URL-driver, and guessed-credential failures; an earlier runner exposed migration-order/cleanup gaps; review then exposed byte-count, Clerk hydration, SQL-mode portability, and restart-evidence gaps. The first hostile-mode setup used an unsupported CLI password environment path and stopped before migration/test; its disposable resources were removed before the passing retry.

## BM031_BYTE_COMPARISON

| Value | Canonical / parameterized | Legacy literal | Fixed literal |
|---|---:|---:|---:|
| JSON valid | 1 | 0 | 1 |
| Characters | 16,230 | 16,218 | 16,230 |
| UTF-8 bytes | 16,617 | 16,605 | 16,617 |
| SHA-256 | `6f0ab9c724e719a797c8412f28d7b1201ddafcecd1de34ee8598d26c4f554f87` | `803ae88df0b4980fcd35967b8330f04fa124941cf584f245953f904ce511c86d` | `6f0ab9c724e719a797c8412f28d7b1201ddafcecd1de34ee8598d26c4f554f87` |

First differing byte: 2,369. Legacy insert: constraint 4025. The fixed SQL literal and parameterized value are byte-identical.

## TRANSACTION_ATOMICITY

- Reproduced pre-fix full apply failure: a new connection saw templates 0, versions 0, transaction 0.
- Synthetic invalid JSON through Prisma `db execute --stdin` exited 1 and left officials/templates/versions at 0/0/0.
- Final guarded integration `phase8d-bm031-hardened-20260711203509365-8997` passed 7/7 under hostile GLOBAL `NO_BACKSLASH_ESCAPES`, restored the original global mode exactly, applied 213/213, and proved second-apply semantic no-op.
- Partial persistence on the reproduced official transactional path is not possible; the historical 212-row statement is superseded.

## BOOTSTRAP_FIRST_APPLY

`node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply` exited 0: 213 templates, 213 published versions, zero duplicate natural keys, and BM-001/BM-002/BM-003 present. Semantic fingerprint: `321781d738a1edd9b2f19e908efe478276358e0badfe790223410b8e12ea5201`; natural-key fingerprint: `d48899b81f94a3566402fb181ba181cbd24acea156694e9142f9bfdbbc0564b1`.

## BOOTSTRAP_SECOND_APPLY

The same official command exited 0. Counts stayed 213/213, duplicates stayed zero, and both fingerprints were unchanged: `NO_SEMANTIC_CHANGE`.

## READINESS_BEFORE

HTTP 503; contracts false; locked count 0; exact missing list BM-001/BM-002/BM-003; `fonts.ok=true`.

## READINESS_AFTER

HTTP 200; contracts true; locked count 213; missing list `[]`; `fonts.ok=true`.

## RESTART

HTTP 200 after restart without drift bypass. Counts and both contract fingerprints were unchanged. Migration state stayed exactly 1 row / 0 unfinished or failed, and the ordered metadata SHA stayed `7fa4ec0f5bc38022750bb3ed82f0b3d0bf6f0a2973498a6d5b4c3da03ea6dc9e` before and after restart and matched the initial proof.

## FONT

`EXACT_REQUIRED_FONT_PASS`: Times New Roman regular, bold, italic, and bold italic. The host font directory remained read-only and was preserved.

## PDF

Technical artifacts remain for BM-001 (98,600 bytes, 2 pages, SHA `33f02126e5d6802457f0cdc407ef45d0c49f607f3bbf4fccbf997fb4c11e167a`), BM-006 (112,480 bytes, 1 page, SHA `86cd739f7d2ef59088c7ad72617a6c95c10cf14be16139c9e834953d8692c619`), and BM-171 (98,468 bytes, 1 page, SHA `dc91cefddd2caccee2a49698e7e429d7bbc60b7e270d00b5bf1beeb4d75b201f`), with Times New Roman embedded. Status: `TECHNICAL_PASS_WITH_PROVENANCE_LIMITATION`; the prior conversion recorded no immutable image digest, so equality with the current closure image is not asserted.

## THROTTLING

`AUTH_STATE=OPERATOR_CREDENTIAL_REQUIRED`. The ignored, untracked Clerk storage state was approximately 149,605,217 ms old against the 86,400,000 ms limit. The collector exited 3 by design; all nine target forms remain `UNVERIFIED`. The collector now waits for complete Clerk user/session hydration and stores no response body, token, cookie, legal payload, or business payload.

Exact one-shot operator command after the documented local `pnpm dev` flow is healthy:

```powershell
pnpm exec playwright test --config=playwright.config.ts --project="clerk setup" --workers=1 --reporter=line; if ($LASTEXITCODE -eq 0) { node scripts/audit/build-phase-8c-throttling-closure.mjs }
```

Packet SHA-256: `803d4d8e4d4d511da0dee23e37c26b7c3634cb753f5f6dc952e1a5c2a2633544`.

## HUMAN_REVIEW

`HUMAN_VISUAL_REVIEW_PENDING`. Three first-page PNGs and three all-page contact sheets exist for BM-001/BM-006/BM-171. All per-form signoffs remain false; no approval was fabricated. The packet references the current closure image while preserving the explicit image-equality limitation.

## FULL_VALIDATION

| Command | Exit | Duration ms |
|---|---:|---:|
| `pnpm typecheck` | 0 | 7,318 |
| `pnpm lint` | 0 | 58,300 |
| `pnpm test` | 0 | 25,057 |
| `pnpm build` | 0 | 24,522 |
| `pnpm verify:quick` | 0 | 7,381 |
| `pnpm verify:full` | 0 | 71,188 |
| `pnpm verify:ci` | 0 | 75,639 |

Focused tests and required audits passed. The official unreachable dummy-loopback contract-sync probe used `FILE_ONLY` and matched 213/213. Current-evidence check: PASS, mutation `NONE`, matrix 201 PASS / 12 PARTIAL. Full evidence: `VALIDATION.latest.md`.

## PERSISTENT_DB

No Phase 8D write targeted an operator-controlled persistent database. Aggregate gates made a read-only comparison to the configured local DB and observed matched 213, missing 0, stale 0; that neither proves nor performs the intended deployment transition. Persistent metadata transition remains `READY_FOR_OPERATOR`.

## GIT

- Branch `audit/bm006-visual-fidelity-evidence`; HEAD `ea3e1c3c53278fad09c8557487ffb1d48d685a65`.
- Staged 0; commits 0; pushes 0; pull requests 0.
- Dirty records 2,044: 263 tracked unstaged and 1,781 untracked; tracked numstat +5,128 / -15,446; renames/unmerged 0.
- Delivery remains allowlist-only: bootstrap correctness, authenticated throttling, human-review packet, and canonical reports. The repository was heavily dirty before Phase 8D; unrelated files were not reclassified manually.
- `PHASE_8D_GIT_MANIFEST.latest.json` records exact path/hash/diff/reason/group and excludes its own self-hash.

## CLEANUP

All `phase8d*` Docker resource counts are zero: containers 0, networks 0, images 0, volumes 0. The canonical closure run, final hardened integration, review run, and stopped setup attempt all cleaned their unique resources. `quanlyvks-mariadb` remains healthy and unchanged; Times New Roman host files and ignored auth state were preserved. Ninety-eight timestamped bootstrap duplicates (331,415,929 bytes) were removed; `bootstrap.latest.sql/json` remain.

## REMAINING_OPERATOR_GATES

1. Execute the reviewed metadata transition against the intended persistent deployment database.
2. Obtain explicit human visual sign-off for BM-001, BM-006, and BM-171.
3. Refresh the Clerk ticket once and run the authenticated nine-form throttling collector.

No automated technical failure remains.
