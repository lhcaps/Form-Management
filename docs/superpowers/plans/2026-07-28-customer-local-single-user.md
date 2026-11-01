# Customer-local single-user Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a loopback-only Docker installation that binds one Clerk user to a database administrator and verifies the current supported document workflows.

**Architecture:** Add a fail-closed customer-local configuration mode rather than reuse demo mode. Compose uses production images plus a local overlay; a pre-provisioned Clerk user ID is seeded into `auth_identities`, so authorization stays database-backed and no webhook or JIT account creation is needed.

**Tech Stack:** Docker Compose v2, MariaDB 11, NestJS 11, Next.js 16, Prisma, Clerk Development, PowerShell 5.1+.

## Global Constraints

- Bind only to `127.0.0.1`; no customer-local LAN/public exposure.
- Never commit Clerk keys, user IDs, passwords, database credentials, or fonts.
- Require a licensed four-style Times New Roman mount for the acceptance render.
- Keep `/templates` temporary-preview flow separate from persisted `/documents` flow.
- Do not modify locked DOCX contracts or claim unfinished forms are supported.

---

### Task 1: Fail-closed customer-local configuration

**Files:**
- Modify: `apps/api/src/infrastructure/config/app-config.service.ts`
- Modify: `apps/api/src/infrastructure/config/app-config.service.spec.ts`

**Interfaces:**
- Consumes: `QLLAW_DEPLOYMENT_MODE=customer-local`, `WEB_ORIGIN`, `API_CORS_ORIGIN`
- Produces: `isCustomerLocalMode` and startup validation that permits only loopback HTTP origins.

- [ ] **Step 1: Write the failing test**

```ts
expect(() => new AppConfigService(customerLocalEnv).validateProductionEnvironment()).not.toThrow();
expect(() => new AppConfigService({ ...customerLocalEnv, WEB_ORIGIN: 'http://192.168.1.2:3000' }).validateProductionEnvironment()).toThrow();
```

- [ ] **Step 2: Run the focused test**

Run: `CI=true pnpm --filter api test -- app-config.service.spec.ts --runInBand`
Expected: FAIL until the customer-local policy exists.

- [ ] **Step 3: Implement the narrow mode**

Add `isCustomerLocalMode`, validate exact loopback origins, retain Clerk key and seed-secret checks, allow a missing webhook secret only in this mode, and do not set demo mode.

- [ ] **Step 4: Re-run the focused test**

Run: `CI=true pnpm --filter api test -- app-config.service.spec.ts --runInBand`
Expected: PASS.

### Task 2: Docker and bootstrap contract

**Files:**
- Create: `docker-compose.customer-local.yml`
- Create: `.env.docker.customer-local.example`
- Modify: `package.json`
- Test: `test/infrastructure/customer-local-compose.guard.test.mjs`

**Interfaces:**
- Consumes: local env file, exact Clerk user ID, licensed font mount.
- Produces: `pnpm docker:customer-local:*` commands and a Compose stack bound to loopback.

- [ ] **Step 1: Write the failing static Compose guard**

```js
assert.equal(customer.api.environment.QLLAW_DEPLOYMENT_MODE, 'customer-local');
assert.match(customer.web.ports[0], /^127\\.0\\.0\\.1:/);
assert.equal(customer.api.environment.QLLAW_DOCKER_MODE, undefined);
```

- [ ] **Step 2: Run the guard and confirm it fails**

Run: `node --test test/infrastructure/customer-local-compose.guard.test.mjs`
Expected: FAIL before the overlay/env profile exists.

- [ ] **Step 3: Add the overlay and commands**

Use the production services and font mount. Set `QLLAW_DEPLOYMENT_MODE=customer-local`, local HTTP cookie policy, loopback port bindings, and the pre-seed Clerk user variables. Do not expose MariaDB.

- [ ] **Step 4: Re-run static validation**

Run: `node --test test/infrastructure/customer-local-compose.guard.test.mjs; docker compose --env-file .env.docker.customer-local.example -f docker-compose.prod.yml -f docker-compose.customer-local.yml config --quiet`
Expected: PASS.

### Task 3: Operator workflow and documentation

**Files:**
- Create: `scripts/customer-local/setup.ps1`
- Create: `scripts/customer-local/start.ps1`
- Create: `scripts/customer-local/status.ps1`
- Create: `scripts/customer-local/smoke.ps1`
- Modify: `docs/CUSTOMER_LOCAL_INSTALLATION.md`
- Modify: `docs/CUSTOMER_LOCAL_ACCEPTANCE_CHECKLIST.md`
- Modify: `docs/CUSTOMER_LOCAL_TROUBLESHOOTING.md`

**Interfaces:**
- Consumes: `.env.docker.customer-local`, Docker Compose commands, user-created Clerk ID.
- Produces: non-interactive setup/start/status/smoke commands with non-zero failure exits.

- [ ] **Step 1: Write command-shape tests**

```js
assert.match(read('scripts/customer-local/setup.ps1'), /contract-bootstrap/);
assert.match(read('scripts/customer-local/smoke.ps1'), /render-docx/);
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --test test/infrastructure/customer-local-operator.guard.test.mjs`
Expected: FAIL before the scripts are added.

- [ ] **Step 3: Implement operator scripts and docs**

Scripts must avoid printing secrets, require the explicit env file, run bootstrap only by operator request, wait for health/readiness, and preserve named volumes on stop. Docs must explain creation of a new Clerk Development application/user before bootstrap, and distinguish DOCX/PDF acceptance from incomplete form UI coverage.

- [ ] **Step 4: Run static tests**

Run: `node --test test/infrastructure/customer-local-*.guard.test.mjs`
Expected: PASS.

### Task 4: Disposable delivery verification

**Files:**
- Create: `scripts/customer-local/verify-delivery.mjs`
- Test: `test/infrastructure/customer-local-delivery-verify.test.mjs`

**Interfaces:**
- Consumes: customer-local Compose profile and operator-provided real Clerk/font inputs.
- Produces: a JSON result that distinguishes static configuration from live auth/render/backup evidence.

- [ ] **Step 1: Write a test for fail-closed missing inputs**

```js
assert.equal(runVerify({ envFile: missingClerk }).status, 2);
assert.match(runVerify({ envFile: missingFont }).stderr, /QLLAW_TNR_FONT_DIR/);
```

- [ ] **Step 2: Run it and confirm failure**

Run: `node --test test/infrastructure/customer-local-delivery-verify.test.mjs`
Expected: FAIL before verifier implementation.

- [ ] **Step 3: Implement the live verifier**

Verify Compose configuration, migration/bootstrap, API health/ready, explicit user sign-in checkpoint, a persisted DOCX and PDF render, restart, and backup manifest. Redact credentials and classify missing real Clerk interaction as `NOT_RUN`, never `PASS`.

- [ ] **Step 4: Run verification layers**

Run: `CI=true pnpm --filter api test -- app-config.service.spec.ts --runInBand; node --test test/infrastructure/customer-local-*.test.mjs; pnpm docker:customer-local:verify`
Expected: static gates PASS; live gate PASS only with supplied real Clerk account and font mount.

### Task 5: Review and delivery commit

**Files:**
- Modify: only files from Tasks 1-4.

- [ ] **Step 1: Inspect staged diff and secret scan**

Run: `git diff --check; git diff --cached --name-only; node scripts/release/audit-repository-hygiene.mjs`
Expected: no formatting errors and no secret-bearing env file staged.

- [ ] **Step 2: Run the scoped validation suite**

Run: `CI=true pnpm typecheck; CI=true pnpm test:node`
Expected: PASS, or record exact unrelated pre-existing failures.

- [ ] **Step 3: Commit only the customer-local delivery files**

```bash
git add apps/api/src/infrastructure/config/app-config.service.ts apps/api/src/infrastructure/config/app-config.service.spec.ts docker-compose.customer-local.yml .env.docker.customer-local.example package.json scripts/customer-local docs/CUSTOMER_LOCAL_INSTALLATION.md docs/CUSTOMER_LOCAL_ACCEPTANCE_CHECKLIST.md docs/CUSTOMER_LOCAL_TROUBLESHOOTING.md test/infrastructure/customer-local-*.test.mjs
git commit -m "feat: add hardened customer-local Docker delivery"
```
