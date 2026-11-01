# QLLaw Production Infrastructure Modernization Implementation Plan

> **Execution mode:** local-only, no stage/commit/push/PR. TDD is mandatory for behavior changes. Existing user changes are preserved.

**Goal:** Eliminate every confirmed in-scope P0 blocker, implement measured P1 hardening without product-contract drift, and finish with reproducible evidence plus an honest report.

**Architecture:** Keep the monorepo and current Nest/Next/pnpm/Prisma/Docker architecture. Repairs are organized around explicit seams: canonical evidence reduction, API bootstrap/config, import storage containment, Docker packaging/runtime, and verification command orchestration. No new production dependency or infrastructure platform is introduced.

**Tech stack:** Node 22, pnpm 10, TypeScript, NestJS 11, Next.js 16, Prisma 6, MariaDB 11, Docker Compose, Node test/Jest.

## Global constraints

- Do not mutate source/normalized DOCX, locked/compiled contracts, Prisma schema, DB user data, migrations, public API paths, 12 holdouts, BM-006 calibration, or runtimeReady allowlist.
- Do not stage, commit, push, create/switch branch, open PR, merge, reset, clean, stash, or restore user files.
- Platform env wins; no secret values in logs or artifacts.
- Missing execution remains NOT_RUN/NEED_USER_DECISION, never PASS.

---

### Task 1: Evidence reducer and apply orchestration integrity

- [x] **Goal:** preserve 201/12 plus all historical downstream evidence and make apply-existing reproducible without a live browser rerun.
- **Confirmed root cause:** status/sourceRender and top-level apply summaries are discarded by standalone reduction; apply-all mixes selection/smoke/Playwright with application, has no bounded timeout/transaction, and changes timestamps on every rerun.
- **Files:** modify `scripts/audit/status-matrix-213.mjs`, `scripts/audit/apply-all-current-evidence.mjs`, `scripts/audit/status-matrix-preserves-evidence.guard.test.mjs`; create focused Node tests/helper only if required.
- **Interfaces affected:** audit CLI only; canonical matrix schema remains additive/backward-compatible.
- **Failing reproduction:** standalone reducer changed 201/12 to 177/36.
- **Minimal implementation:** preserve explicit apply-owned promotion/top-level summaries; separate check/apply-existing step plans; preflight artifacts; exclude selectors/smokes/browser collector; add lock, rollback, bounded children, semantic no-op restoration.
- **Focused validation:** Node tests and temp-copy reducer/apply proof.
- **Full regression:** apply-existing twice; direct hash stable on second run; guards PASS; 201/12, browser 201, fidelity 0.
- **Rollback:** orchestrator restores canonical JSON/MD bytes on failure.
- **Risk:** legacy child scripts still write auxiliary artifacts.
- **Status:** COMPLETED — 201/12 preserved; two apply-existing runs were byte-idempotent and rollback/lock guards pass.

### Task 2: Production environment precedence and API lifecycle

- [x] **Goal:** platform env precedence, production env-file isolation, PORT compatibility, graceful shutdown.
- **Confirmed root cause:** main.ts uses dotenv override=true while ConfigModule also loads cwd env; shutdown hooks absent.
- **Files:** create `apps/api/src/infrastructure/config/load-api-environment.ts` and spec; modify `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/src/infrastructure/config/app-config.service.ts` and spec.
- **Interfaces affected:** environment loading only; public HTTP schemas unchanged.
- **Failing reproduction:** temp local env overwrites a platform value.
- **Minimal implementation:** local-only loader with override=false and production skip; ConfigModule ignoreEnvFile; API_PORT then PORT; enableShutdownHooks.
- **Focused validation:** config Jest tests.
- **Full regression:** API/root typecheck, API tests, build.
- **Rollback:** remove loader and restore prior imports/config.
- **Risk:** development env precedence changes; test exact order.
- **Status:** COMPLETED — focused config/lifecycle tests, typecheck, test and build pass.

### Task 3: Import path and upload hardening

- [x] **Goal:** contain import downloads/deletes inside governed import storage and reject oversize uploads before disk write.
- **Confirmed root cause:** absolute/../ stored paths are accepted; Multer has no file-size limit.
- **Files:** modify `apps/api/src/modules/imports/import-storage.service.ts`, `apps/api/src/modules/imports/imports.module.ts`; add/update focused specs.
- **Interfaces affected:** invalid stored paths now fail closed; route shape unchanged.
- **Failing reproduction:** absolute and traversal paths resolve outside storage.
- **Minimal implementation:** normalized containment guard using existing path-relative pattern; 50 MiB Multer limit matching current service rule.
- **Focused validation:** imports Jest specs RED then GREEN.
- **Full regression:** API/root tests and typecheck.
- **Rollback:** revert service/module changes.
- **Risk:** legacy absolute-path DB rows may be rejected and reported as residual compatibility debt.
- **Status:** COMPLETED — traversal/absolute-path tests and 50 MiB pre-write limit guard pass.

### Task 4: Docker boot, assets, seed, context, rendering and non-root runtime

- [x] **Goal:** bootable API image with governed assets, safe context, explicit seed behavior, healthchecks, non-root writes, bounded isolated LibreOffice profiles.
- **Confirmed root cause:** CRLF entrypoint, missing contracts/seed dependencies, wrong seed script, forced false seed flag, root user, missing healthchecks, broad build context.
- **Files:** modify `.gitattributes`, `.dockerignore`, `docker/api-entrypoint.sh`, `docker/api.Dockerfile`, `docker/web.Dockerfile`, `docker-compose.prod.yml`; create `test/infrastructure/production-runtime.guard.test.mjs`.
- **Interfaces affected:** container/runtime operations only.
- **Failing reproduction:** API restart loop with missing entrypoint; image asset/UID/seed probes fail.
- **Minimal implementation:** LF guard; copy exact governed assets and seed inputs; fail on missing corpus; seed command fix; externally selectable default-false seed; non-root owned dirs; Node healthchecks; DB internal; unique LibreOffice profile + timeout; sensitive context exclusions.
- **Focused validation:** infrastructure guard RED then GREEN; image probes.
- **Full regression:** fresh no-cache build, isolated boot/readiness, migration outcome, web smoke, SIGTERM, cleanup.
- **Rollback:** revert container files; no persistent verification volume retained.
- **Risk:** migration history remains a separate prohibited blocker; proprietary font remains decision-gated.
- **Status:** IMPLEMENTED / VALIDATION PARTIAL — image build/probes, web health and SIGTERM pass; full API boot/seed/restart remain blocked by the prohibited migration-history decision.

### Task 5: Deterministic audit/test and hardcode gates

- [x] **Goal:** remove clock-only CI failure and make intentional legacy detector markers fail-closed by path/count.
- **Confirmed root cause:** Jest consumes a timestamped report without preparing it; raw hardcode substring scan cannot distinguish detector from default.
- **Files:** modify `apps/api/src/modules/documents/rendering/infrastructure/docx-slot-inventory.spec.ts`, `scripts/audit/audit-docx-slot-inventory.mjs`, `scripts/audit-runtime-hardcodes.mjs`, two web comment/copy sites, and focused tests.
- **Interfaces affected:** audit/report schema additive only.
- **Failing reproduction:** root test 695/696 and hardcode audit fail.
- **Minimal implementation:** content/input provenance instead of wall-clock-only assertion; exact allowlist for one intentional detector occurrence and remove explanatory literal duplication.
- **Focused validation:** failing focused tests then audit PASS.
- **Full regression:** pnpm test, gate:forms:213, hardcode/encoding/contracts gates.
- **Rollback:** revert gate/test changes; regenerated reports are derived.
- **Risk:** provenance computation must remain fast across 213 files.
- **Status:** COMPLETED — deterministic 213/213 inventory and exact hardcode guard pass.

### Task 6: CI, verification commands, dev doctor and operations runbooks

- [x] **Goal:** align local and CI verification with deployability and provide safe operator checks.
- **Confirmed root cause:** CI builds images but does not boot them; root command surface omits deterministic prerequisite/order and diagnostics.
- **Files:** modify `package.json`, `.github/workflows/ci.yml`; create narrow scripts under `scripts/infrastructure/`; update deployment/backup/restore documentation and required modernization reports.
- **Interfaces affected:** developer/CI commands only.
- **Failing reproduction:** latest CI Docker job passed while full run failed stale report and image boot is broken.
- **Minimal implementation:** verify:quick/full/ci, dev:doctor, docker:verify composed from existing commands; concurrency/timeouts/cache; machine-readable failure artifacts; isolated Docker boot job; SET/UNSET-only diagnostics; backup/restore runbook.
- **Focused validation:** command dry-runs and YAML/JSON parsing.
- **Full regression:** verify:ci plus Docker verification where authorized.
- **Rollback:** remove scripts/workflow entries; application behavior unchanged.
- **Risk:** GitHub runner duration increases; split independent jobs.
- **Status:** COMPLETED — unified commands, CI jobs, doctor, Docker verifier and runbooks are present and exercised.

### Task 7: Performance and final invariants

- [x] **Goal:** record before/after metrics and close only with fresh evidence.
- **Confirmed root cause:** no single current report ties command durations, image sizes, context size, readiness and invariants together.
- **Files:** update all required files under `docs/audit/infrastructure-modernization/`.
- **Interfaces affected:** documentation/evidence only.
- **Failing reproduction:** baseline report is PARTIAL with explicit blockers.
- **Minimal implementation:** measure same commands before/after; final hashes for forbidden assets; exact Git counts; residual decisions for migrations/fonts/auth.
- **Focused validation:** JSON parse and report schema check.
- **Full regression:** all allowed quality gates, apply idempotence, Docker build/boot/shutdown, no staged files.
- **Rollback:** derived reports can be regenerated from recorded commands.
- **Risk:** migration and font decisions may keep final status PARTIAL.
- **Status:** COMPLETED AS PARTIAL — metrics and invariants are recorded; migration history and licensed font policy remain explicit user decisions.
