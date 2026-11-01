# Phase 8B - Independent validation

## Verdict

`PASS` for every executed validation command. The phase remains `PARTIAL` overall because font fidelity and the nine-form throttling evidence are not fully resolved, and no persistent transition was authorized.

## Environment safety

Final Node-side wrappers ran with `CI=true` and a deliberately unreachable loopback `DATABASE_URL`, so contract synchronization used its documented `FILE_ONLY` fallback. Docker and database mutation tests used unique disposable resources only.

One earlier standalone `pnpm audit:contract-sync` invocation inherited the repository root environment and performed a metadata-only comparison of 213 contract rows against the persistent database. It made no writes, emitted no business-row contents, and was immediately replaced by the isolated official run. Final persistent structure and migration-metadata hashes remained byte-identical.

## Results

| Command | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| `pnpm --filter @qllaw/form-contracts typecheck` | `0` | `3,136 ms` | PASS |
| `pnpm --filter api exec tsc --noEmit` | `0` | `13,832 ms` | PASS |
| `pnpm --filter web exec tsc --noEmit` | `0` | `8,734 ms` | PASS |
| `pnpm typecheck` | `0` | `5,756 ms` | PASS (warm cache) |
| `pnpm lint` | `0` | `~62,050 ms` | PASS |
| `pnpm test` | `0` | `~50,000 ms` | PASS across contracts, API, Node, and Web unit suites |
| `pnpm build` | `0` | `~50,000 ms` | PASS across contracts, Nest API, and Next Web |
| `node --test "test/infrastructure/*.guard.test.mjs"` | `0` | `327 ms` | `17/17` PASS |
| `pnpm audit:hardcode` | `0` | `450 ms` | PASS |
| `pnpm audit:locked-compiled` | `0` | `420 ms` | `213/213` PASS |
| `pnpm audit:contract-sync` with unreachable loopback DB | `0` | `1,470 ms` | `FILE_ONLY`, `213/213` PASS |
| `pnpm audit:encoding` | `0` | `477 ms` | PASS |
| `pnpm gate:forms:213 --allow-source-unknown` | `0` | `391 ms` | `213/213` PASS under documented allowances |
| `node scripts/audit/apply-all-current-evidence.mjs --check` | `0` | `100 ms` | `201 PASS / 12 PARTIAL`, 36 steps |
| `node --test test/migration-regression-gate.test.mjs test/ci-reproducibility.test.mjs` | `0` | not separately retained | `7/7` PASS |
| `node --test test/infrastructure/docker-verifier-truthfulness.test.mjs test/infrastructure/developer-command-surface.guard.test.mjs` | `0` | not separately retained | `10/10` PASS |
| `node --test test/infrastructure/throttling-classifier.test.mjs` | `0` | not separately retained | `3/3` PASS |
| Combined final focused closure suite (migration, CI, verifier, command surface, throttling) | `0` | `91.815 ms` | `20/20` PASS |
| `node scripts/audit/migration-regression-gate.mjs --output-dir .artifacts/migration-regression-gate` | `0` | `11,422 ms` | fresh DB, deploy `0/0`, status `0`, empty diff, cleanup PASS |
| API production image build, no cache | `0` | `88,894 ms` | PASS |
| Web production image build | `0` | `69,084 ms` | PASS |
| Disposable production-stack boot | `0` | `38,230 ms` | PASS |
| `pnpm docker:verify` with exact images + boot artifact | `0` | `3,777 ms` | `DOCKER_VERIFY=PASS` |
| `pnpm verify:quick` | `0` | `8,866 ms` | PASS |
| `pnpm verify:full` | `0` | `~90,000 ms` | PASS |
| `pnpm verify:ci` | `0` | `~95,100 ms` | PASS; known BM-006 acknowledgement retained |

## Final independent evidence

- Latest migration-gate run ID: `phase8b-migration-gate-20260711083713-371f87ae`.
- Initially empty: yes.
- Deploy 1 / deploy 2 / status: `0 / 0 / 0`.
- Failed migration rows: `0`.
- Schema diff: empty.
- Structure: `40` tables / `490` columns including `_prisma_migrations`.
- Gate leftovers: `0`.
- Persistent final read-only snapshot: `phase8b-codex-c1-20260711084214`.
- Persistent structure SHA-256: `1ea4e8e74fc4273b52c373937619141ea865ac7219f4d7977e8048c6f51bf2ae`, unchanged.
- Persistent migration metadata SHA-256: `c526a1cdaa2c534a4758fc3d1e0884ef75f241a402bb06c0c57d8ce4c37b1f11`, unchanged.
- Final protected-invariant comparison: `allEqual=true`, `semanticsEqual=true`.
- Final staged files: `0`.
- Final report integrity audit: 9/9 required reports present and non-empty; all 25 required final-report sections present in order; status is `PARTIAL`.
