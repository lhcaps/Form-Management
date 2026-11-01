# Phase 8D Exact Validation

Generated: 2026-07-11T20:43:19.591Z
Run ID: `phase8d-finalfix-20260711203313z`
Branch: `audit/bm006-visual-fidelity-evidence`
HEAD: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`

Status: `PASS`

Every named aggregate command below ran after the final implementation changes. Component execution is not used as a substitute for `verify:full` or `verify:ci`.

## Exact aggregate commands

| Command | Exit | Duration ms | Result | Primary artifact |
|---|---:|---:|---|---|
| `pnpm typecheck` | 0 | 7,318 | PASS | terminal evidence / this report |
| `pnpm lint` | 0 | 58,300 | PASS | terminal evidence / this report |
| `pnpm test` | 0 | 25,057 | PASS; contracts, API, Node, and web-unit suites green | terminal evidence / this report |
| `pnpm build` | 0 | 24,522 | PASS; contracts, Nest API, Next web | terminal evidence / this report |
| `pnpm verify:quick` | 0 | 7,381 | PASS | `docs/audit/sot-gates-v1/latest.json` |
| `pnpm verify:full` | 0 | 71,188 | PASS; actual aggregate command | `docs/audit/docx-slot-inventory/latest.json`; `docs/audit/sot-gates-v1/latest.json` |
| `pnpm verify:ci` | 0 | 75,639 | PASS; actual aggregate command | `docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md`; current-evidence check |

`verify:ci` kept the acknowledged `BM-006:EXTRACTION_HASH_MISMATCH` debt explicit. It reported 213/213 locked and human-reviewed, zero generic paths, zero unacknowledged blockers, and 47 metadata warnings; this is not a production-readiness declaration.

## Focused tests

| Command | Exit | Duration ms | Result | Primary artifact |
|---|---:|---:|---|---|
| `node --test "test/infrastructure/*.guard.test.mjs"` | 0 | 246 | PASS 17/17 | `test/infrastructure/` |
| `node --test test/font-policy.test.mjs` | 0 | 145 | PASS 6/6 | `test/font-policy.test.mjs` |
| `node --test test/migration-regression-gate.test.mjs` | 0 | 105 | PASS 4/4; run after final source changes | `test/migration-regression-gate.test.mjs` |
| `node --test test/ci-reproducibility.test.mjs` | 0 | 99 | PASS 3/3 | `test/ci-reproducibility.test.mjs` |
| `node --test test/phase-8c2-bootstrap-generator.test.mjs` | 0 | 1,346 | PASS 13/13 | `test/phase-8c2-bootstrap-generator.test.mjs` |
| `node --test test/phase-8d-bm031-bootstrap.test.mjs` | 0 | 456 | PASS 4; destructive integration skipped without explicit disposable URLs | `test/phase-8d-bm031-bootstrap.test.mjs` |
| same Phase 8D test with guarded user/admin loopback URLs on `phase8d-bm031-hardened-20260711203509365-8997` | 0 | 4,054 | PASS 7/7; hostile GLOBAL SQL mode, exact restore, rollback, 213/213, semantic no-op | `test/phase-8d-bm031-bootstrap.test.mjs` |
| `node --test test/infrastructure/throttling-classifier.test.mjs` | 0 | 101 | PASS 5/5 | `test/infrastructure/throttling-classifier.test.mjs` |

The hostile-mode integration required both URLs to be loopback, on the same non-3306 port and database, with the admin user named `root`. It set GLOBAL `NO_BACKSLASH_ESCAPES`, proved a new official-apply connection inherited it, proved both applies left GLOBAL mode byte-equivalent, and restored the original mode in `finally`.

## Required audits

| Command | Exit | Duration ms | Result | Primary artifact |
|---|---:|---:|---|---|
| `pnpm audit:hardcode` | 0 | 358 | PASS | terminal evidence |
| `pnpm audit:locked-compiled` | 0 | 327 | PASS 213/213 consistent | `docs/audit/sot-gates-v1/latest.json` |
| `pnpm audit:encoding` | 0 | 303 | PASS; no BOM | terminal evidence |
| `pnpm gate:forms:213 --allow-source-unknown` | 0 | 292 | PASS 213/213 | `docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md` |
| `node scripts/audit/apply-all-current-evidence.mjs --check` | 0 | 57 | PASS; mutation `NONE`; matrix 201 PASS / 12 PARTIAL | current-evidence check |
| `CI=true DATABASE_URL=<unreachable dummy loopback> pnpm audit:contract-sync` | 0 | 2,393 | PASS; `FILE_ONLY`, matched 213/213, missing 0, stale 0 | contract-sync terminal evidence |

The aggregate `verify:full` and `verify:ci` runs also made a read-only comparison to the configured local database: matched 213, missing 0, stale 0. No Phase 8D write targeted that database.

## Disposable closure validation

| Check | Result |
|---|---|
| Canonical closure run | `phase8d-finalfix-20260711203313z` |
| Fresh database before migration | 0 user tables |
| Migration deploy #1 / #2 / status / schema diff | 0 / 0 / 0 / 0 |
| Migration state | 1 row, 0 unfinished/failed; ordered metadata SHA `7fa4ec0f5bc38022750bb3ed82f0b3d0bf6f0a2973498a6d5b4c3da03ea6dc9e` |
| Official apply #1 | 213 templates / 213 versions / 0 duplicate keys |
| Official apply #2 | `NO_SEMANTIC_CHANGE` |
| Readiness | 503 before; 200 after; 200 after restart |
| Restart invariants | contract fingerprints and exact migration metadata SHA unchanged and equal to initial proof |
| Fonts | `EXACT_REQUIRED_FONT_PASS`; regular, bold, italic, bold italic |
| Cleanup | containers 0; networks 0; images 0; volumes 0 |

Closure evidence: `.artifacts/phase-8c2-bootstrap/phase8d-finalfix-20260711203313z.latest.json` (`a91bd695bde3e1c7f8aebafa84a5fbd32319d9d6d9917e5add0cef01fd9a6913`).

## Authenticated throttling posture

`node scripts/audit/build-phase-8c-throttling-closure.mjs` exited 3 in 328 ms by design. The ignored, untracked Clerk storage state was about 149,605,217 ms old against the 86,400,000 ms freshness limit. The sanitized packet records `OPERATOR_CREDENTIAL_REQUIRED`, verified 0, unverified 9, and stores no response body, cookie, token, legal payload, or business payload.

Artifact SHA-256: `803d4d8e4d4d511da0dee23e37c26b7c3634cb753f5f6dc952e1a5c2a2633544`.

## Failed attempts retained

- Early forensic probes hit shell quoting, ESM import, BigInt serialization, URL-driver, and guessed-credential failures before the repeatable sanitized probe succeeded.
- Earlier closure-runner passes exposed migration-order, cleanup, byte-count, Clerk hydration, and restart-evidence gaps; each was corrected before the canonical run.
- The first hostile-GLOBAL integration setup used an unsupported CLI password environment path and stopped before migration/test. Its unique container/network/volume were removed before a fresh passing retry.

## Conclusion

All automated technical gates required for Phase 8D passed. Remaining work is explicitly operator/human controlled: persistent deployment metadata transition, visual sign-off, and a fresh authenticated nine-form throttling run.
