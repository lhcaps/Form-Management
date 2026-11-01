# Phase 8D Final Infrastructure Closure

Generated: 2026-07-11T20:43:19.591Z
Run ID: `phase8d-finalfix-20260711203313z`
Branch: `audit/bm006-visual-fidelity-evidence`
HEAD: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`

## STATUS

`READY_FOR_OPERATOR`

Technical closure: `COMPLETE`. This is not a `PRODUCTION_READY` declaration.

## STATUS_NOTE

All automated Phase 8D technical gates passed. Only persistent deployment metadata transition, explicit human visual sign-off, and a fresh authenticated throttling collection remain.

## CURRENT_SOURCE_TRUTH

| Item | Current value |
|---|---|
| Squashed migration | `apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql` |
| Migration SHA-256 | `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5` |
| Locked / compiled contracts | 213 / 213 |
| Corpus fingerprint | `ab417791bfa58dbd831fcb33190593c050ba7730f5c6660de4c23bf8d16a4e14` |
| Bootstrap SQL | 6,765,800 UTF-8 bytes; SHA `d6becce48275c49348e475bc4156038a1aed61095becabb4f88c4ba5d022ce81` |
| Closure image ID | `sha256:2f0e7b8447e9ed7d65341708a1e308a6903ab17d528b6ee11f34c417366640f1` |
| Legacy-column drift | Not active |

## BM031_ROOT_CAUSE

The canonical BM-031 draft JSON is valid. The generic serializer escaped apostrophes but did not double backslashes; MariaDB consumed the 12 JSON escape backslashes under standard literal parsing before the JSON constraint evaluated the row. The generic fix doubles backslashes before apostrophes and emits a pre-transaction session statement that removes only `NO_BACKSLASH_ESCAPES`. No global SQL mode, DOCX, locked contract, or compiled contract is mutated.

The official path also resolves the installed API `mariadb` driver, compares table-qualified schema columns, and runs Prisma from `apps/api` with `prisma/schema.prisma`.

Sanitized failed attempts: early shell/ESM/BigInt/URL-driver and guessed-credential probes; an earlier closure-runner migration-order/cleanup regression; review-discovered byte-count, Clerk hydration, SQL-mode, and restart-proof gaps; and one hostile-mode setup that stopped before migration/test because its CLI password environment path was unsupported. Every disposable resource from those attempts was removed.

## BM031_BYTE_COMPARISON

| Representation | JSON valid | Characters | UTF-8 bytes | SHA-256 | Result |
|---|---:|---:|---:|---|---|
| Canonical / parameterized | 1 | 16,230 | 16,617 | `6f0ab9c724e719a797c8412f28d7b1201ddafcecd1de34ee8598d26c4f554f87` | Valid |
| Legacy MariaDB literal | 0 | 16,218 | 16,605 | `803ae88df0b4980fcd35967b8330f04fa124941cf584f245953f904ce511c86d` | Constraint 4025 |
| Fixed MariaDB literal | 1 | 16,230 | 16,617 | `6f0ab9c724e719a797c8412f28d7b1201ddafcecd1de34ee8598d26c4f554f87` | Byte-identical |

First differing byte: 2,369. The final integration also proved both official applies succeed when new connections inherit hostile GLOBAL `NO_BACKSLASH_ESCAPES`, while the generator changes only its own session and leaves the full GLOBAL mode byte-equivalent.

## TRANSACTION_ATOMICITY

| Proof | Result |
|---|---|
| Pre-fix full apply failure | `ER_CONSTRAINT_FAILED` / 4025 at BM-031 |
| New connection after failure | templates 0; versions 0; transaction 0 |
| Synthetic invalid JSON through Prisma | expected exit 1 |
| Rows after synthetic failure | officials 0; templates 0; versions 0 |
| Final guarded disposable integration | PASS 7/7 |
| Partial persistence possible | No on the reproduced official transactional path |

## BOOTSTRAP_FIRST_APPLY

Official command `node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply`: exit 0; templates 213; versions 213; duplicate natural keys 0; BM-001/BM-002/BM-003 present. Semantic fingerprint `321781d738a1edd9b2f19e908efe478276358e0badfe790223410b8e12ea5201`; natural-key fingerprint `d48899b81f94a3566402fb181ba181cbd24acea156694e9142f9bfdbbc0564b1`.

## BOOTSTRAP_SECOND_APPLY

Exit 0; templates 213; versions 213; duplicates 0; semantic and natural-key fingerprints unchanged; result `NO_SEMANTIC_CHANGE`.

## READINESS_BEFORE

HTTP 503; contracts false; locked count 0; `missingLocked=[BM-001,BM-002,BM-003]`; `fonts.ok=true`.

## READINESS_AFTER

HTTP 200; contracts true; locked count 213; `missingLocked=[]`; `fonts.ok=true`.

## RESTART

HTTP 200; templates 213; versions 213; duplicates 0; semantic and natural-key fingerprints unchanged. Migration rows before/after: 1/1; unfinished or failed before/after: 0/0; ordered metadata SHA before/after and initial: `7fa4ec0f5bc38022750bb3ed82f0b3d0bf6f0a2973498a6d5b4c3da03ea6dc9e`.

## FONT

`EXACT_REQUIRED_FONT_PASS`: Times New Roman regular, bold, italic, and bold italic are present through the read-only host bind. Host files were preserved.

## PDF

| Form | Bytes | Pages | PDF SHA-256 | Embedded styles |
|---|---:|---:|---|---|
| BM-001 | 98,600 | 2 | `33f02126e5d6802457f0cdc407ef45d0c49f607f3bbf4fccbf997fb4c11e167a` | regular, bold, italic |
| BM-006 | 112,480 | 1 | `86cd739f7d2ef59088c7ad72617a6c95c10cf14be16139c9e834953d8692c619` | all four |
| BM-171 | 98,468 | 1 | `dc91cefddd2caccee2a49698e7e429d7bbc60b7e270d00b5bf1beeb4d75b201f` | all four |

Status: `TECHNICAL_PASS_WITH_PROVENANCE_LIMITATION`. The prior conversion recorded no immutable image digest; equality with the current closure image is not claimed.

## THROTTLING

`AUTH_STATE=OPERATOR_CREDENTIAL_REQUIRED`. The ignored, untracked auth state was about 149,605,217 ms old against an 86,400,000 ms limit. Collector exit 3 is expected; no stale or unauthenticated evidence was promoted.

| Form | Auth | HTTP | Classifier | Result | Artifact |
|---|---|---:|---|---|---|
| BM-118 | unavailable | — | UNVERIFIED | UNVERIFIED | `phase-8c-throttling/throttling-closure.latest.json` |
| BM-119 | unavailable | — | UNVERIFIED | UNVERIFIED | same |
| BM-120 | unavailable | — | UNVERIFIED | UNVERIFIED | same |
| BM-151 | unavailable | — | UNVERIFIED | UNVERIFIED | same |
| BM-152 | unavailable | — | UNVERIFIED | UNVERIFIED | same |
| BM-153 | unavailable | — | UNVERIFIED | UNVERIFIED | same |
| BM-185 | unavailable | — | UNVERIFIED | UNVERIFIED | same |
| BM-186 | unavailable | — | UNVERIFIED | UNVERIFIED | same |
| BM-187 | unavailable | — | UNVERIFIED | UNVERIFIED | same |

Exact operator command:

```powershell
pnpm exec playwright test --config=playwright.config.ts --project="clerk setup" --workers=1 --reporter=line; if ($LASTEXITCODE -eq 0) { node scripts/audit/build-phase-8c-throttling-closure.mjs }
```

## HUMAN_REVIEW

`HUMAN_VISUAL_REVIEW_PENDING`. Three first-page PNGs and three all-page contact sheets exist; all three signoffs remain false. Artifact: `docs/audit/infrastructure-modernization/phase-8c-pdf-fidelity/PHASE_8D_HUMAN_VISUAL_REVIEW_PACKET.latest.json`.

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

Focused generator PASS 13/13; final hostile-mode integration PASS 7/7; throttling classifier PASS 5/5; official dummy-loopback contract sync `FILE_ONLY` PASS 213/213; current-evidence check PASS with mutation `NONE`, matrix 201 PASS / 12 PARTIAL. Details: `VALIDATION.latest.md`.

## PERSISTENT_DB

Phase 8D writes to operator-controlled persistent DB: 0. Aggregate gates observed a read-only local comparison of matched 213 / missing 0 / stale 0; no deployment-target metadata transition was executed.

## GIT

Branch `audit/bm006-visual-fidelity-evidence`; HEAD `ea3e1c3c53278fad09c8557487ffb1d48d685a65`; staged 0; commits/pushes/PRs 0. Snapshot: 2,044 dirty records = 263 tracked unstaged + 1,781 untracked; tracked numstat +5,128 / -15,446; renames/unmerged 0. Exact allowlist and hashes: `PHASE_8D_GIT_MANIFEST.latest.json`.

## CLEANUP

| Run | Containers | Networks | Images | Volumes |
|---|---:|---:|---:|---:|
| `phase8d-reviewfix-20260711202453z` | 0 | 0 | 0 | 0 |
| `phase8d-finalfix-20260711203313z` | 0 | 0 | 0 | 0 |
| `phase8d-bm031-global-20260711202951154-6474` (stopped setup) | 0 | 0 | 0 | 0 |
| `phase8d-bm031-hardened-20260711203509365-8997` | 0 | 0 | 0 | 0 |

An all-prefix scan also returned `phase8d*` containers/networks/images/volumes = 0/0/0/0. `quanlyvks-mariadb` remains healthy and unchanged. Host fonts and ignored auth state were preserved. Ninety-eight timestamped bootstrap duplicates (331,415,929 bytes) were removed; the canonical latest pair remains.

## REMAINING_OPERATOR_GATES

1. Run the reviewed metadata transition against the intended persistent deployment database.
2. Obtain explicit human visual sign-off for BM-001, BM-006, and BM-171.
3. Refresh the Clerk ticket and execute the authenticated nine-form throttling collector.

No automated technical gate remains failed.
