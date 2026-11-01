# Remediation Plan — Post-Codex Independent Audit

This plan is **read-only**. No code or configuration will change until the user has approved each item. Items are prioritized and each includes a recommended execution order. Some items are gated on user decisions.

---

## P0 — BLOCKING ITEMS

### R-01: Restore or document form-studio module deletion

* **findingId:** CRIT-01
* **priority:** P0
* **affected subsystem:** apps/api/src/modules/form-studio/, apps/web/src/{app/admin/(shared)/form-studio/, components/form-studio/}, apps/web/src/lib/form-studio-api.ts
* **confirmed root cause:** 32 API files + 3 Web UI files deleted during Codex phase without disclosure in FILES_CHANGED table
* **exact affected files:**
  * `apps/api/src/modules/form-studio/` (entire directory, 32 files)
  * `apps/web/src/app/admin/(shared)/form-studio/page.tsx`
  * `apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx`
  * `apps/web/src/components/form-studio/form-studio-workspace.tsx`
  * `apps/web/src/lib/form-studio-api.ts` (modified)
* **required behavior:** If form-studio is intended to remain a feature, restore from git history; if deletion is intentional, update CHANGELOG and document in user-facing release notes.
* **smallest safe fix:** `git checkout HEAD~N -- apps/api/src/modules/form-studio/ apps/web/src/app/admin/\(shared\)/form-studio/ apps/web/src/components/form-studio/ apps/web/src/lib/form-studio-api.ts` where N is the commit prior to deletion. Then run typecheck and form-studio-related tests.
* **regression test required:** Yes — re-run any test that depends on the form-studio API or UI. Add a CI guard that fails if the form-studio module is missing.
* **focused validation:** `pnpm --filter api test | grep form-studio`
* **full validation:** `pnpm verify:ci` (with R-02 fix applied first)
* **rollback approach:** `git revert <restoration-commit>` plus `pnpm install` if package.json changed.
* **risk:** If the deletion was intentional, restoration reintroduces dead code. **USER DECISION REQUIRED.**
* **user decision required:** YES — does the user want form-studio restored, or was the deletion intentional?
* **recommended execution order:** 1 (do this FIRST)

### R-02: Fix `verify:ci` to surface `verify:full` failures

* **findingId:** CRIT-02
* **priority:** P0
* **affected subsystem:** package.json (verify:ci script), .github/workflows/ci.yml
* **confirmed root cause:** `verify:ci` chain does not propagate `verify:full` failure exit code under PowerShell or under some test ordering
* **exact affected files:**
  * `package.json` — verify:ci script
  * `.github/workflows/ci.yml` — verify:ci step
* **required behavior:** `verify:ci` MUST exit 1 if any constituent step fails
* **smallest safe fix:** Replace `&&` chain in `verify:ci` with explicit sequential calls inside a shell function that propagates exit codes. Alternatively, make `verify:full` a single script that returns the right exit code. Verify in PowerShell and in CI.
* **regression test required:** Yes — add a CI test that runs `verify:full --fail-fast` and confirms `verify:ci` propagates the failure.
* **focused validation:** manually break one test in verify:full, run verify:ci, confirm exit 1.
* **full validation:** `pnpm verify:ci` (clean state)
* **rollback approach:** Revert script change.
* **risk:** PowerShell and bash have different `&&` semantics; verify the fix works on both.
* **user decision required:** NO
* **recommended execution order:** 2

### R-03: Fix BM-001 / BM-171 shadow DOCX state race in `verify:full`

* **findingId:** CRIT-03
* **priority:** P0
* **affected subsystem:** `pnpm audit:docx-slot-inventory`, docxtemplater-contract-render-engine-style-profile test, BM-001 / BM-171 source DOCX shadow files
* **confirmed root cause:** `audit:docx-slot-inventory` (run first in `verify:full`) regenerates a slot inventory file; subsequent tests that depend on shadow source DOCX state find files missing
* **exact affected files:**
  * `scripts/audit/docx-slot-inventory.mjs` (likely)
  * `test/contracts/docxtemplater-contract-render-engine-style-profile.test.*`
  * `test/contracts/pr6g31-bm001-rendered-docx-parity.test.*`
  * `test/contracts/pr6g31-bm171-rendered-docx-parity.test.*`
* **required behavior:** Tests pass regardless of inventory order
* **smallest safe fix:** Make `audit:docx-slot-inventory` idempotent and ensure tests can re-acquire shadow DOCX state from canonical sources, not from a transient inventory file.
* **regression test required:** Yes — add a test that runs `verify:full` twice in a row and confirms both pass.
* **focused validation:** Run `pnpm verify:full` twice consecutively; both must exit 0.
* **full validation:** `pnpm verify:ci`
* **rollback approach:** Revert the inventory script change.
* **risk:** Medium — the shadow DOCX is likely a generated artifact; need to ensure tests have a deterministic way to recreate it.
* **user decision required:** NO
* **recommended execution order:** 3

### R-04: Determine migration root cause (P3018 / MariaDB 1060)

* **findingId:** CRIT-04
* **priority:** P0
* **affected subsystem:** apps/api/prisma/migrations/, apps/api/src/database/prisma.service.ts, docker/api-entrypoint.sh
* **confirmed root cause:** UNKNOWN — could be MIGRATION_CODE_DEFECT or PERSISTENT_DB_DRIFT
* **exact affected files:**
  * `apps/api/prisma/migrations/` (read-only inspection)
  * `docker/api-entrypoint.sh` (read-only inspection)
* **required behavior:** `prisma migrate deploy` succeeds on fresh empty DB; can determine if user's DB is drifted.
* **smallest safe fix:**
  1. Create a disposable MariaDB container.
  2. Run `prisma migrate deploy` against it.
  3. If fresh DB succeeds → user's DB is drifted → safe repair with `migrate resolve --applied <failing-migration-name>` (after user confirms).
  4. If fresh DB fails → MIGRATION_CODE_DEFECT → identify duplicate column and consolidate migration history.
* **regression test required:** Yes — add a CI smoke test that runs `prisma migrate deploy` against a disposable DB.
* **focused validation:** disposable DB test as above.
* **full validation:** full migration suite + `pnpm verify:ci`.
* **rollback approach:** Do not run any repair command without first establishing the root cause.
* **risk:** CRITICAL — running the wrong repair command could damage the user's persistent database.
* **user decision required:** YES — confirm disposable DB test is acceptable; confirm user is OK with running `migrate resolve --applied` after fresh-DB success.
* **recommended execution order:** 4

---

## P1 — HIGH PRIORITY ITEMS

### R-05: Document or replace Liberation Serif fallback

* **findingId:** CRIT-05
* **priority:** P1
* **affected subsystem:** docker/api.Dockerfile (fonts), docs/audit/docx/font-policy.md
* **confirmed root cause:** Times New Roman is not available; Liberation Serif substitutes automatically. x-height difference causes potential page count drift.
* **exact affected files:**
  * `docker/api.Dockerfile` — currently installs `fonts-dejavu-core fonts-liberation`
  * new file: `docs/audit/docx/font-policy.md` (recommendation)
* **required behavior:** Production-fidelity claims are not made for forms that depend on Times New Roman when Liberation Serif is used.
* **smallest safe fix:**
  1. Add a guard test that asserts `fc-match "Times New Roman"` in the production image and fails if not "Liberation Serif" or better.
  2. Document the policy: "Vietnamese legal documents using Times New Roman are NOT fidelity-complete when the production image lacks Times New Roman. Fidelity is downgraded to PARTIAL."
* **regression test required:** Yes.
* **focused validation:** `docker run --rm <api-image> fc-match "Times New Roman"`.
* **full validation:** `pnpm verify:ci`.
* **rollback approach:** Revert font-policy.md.
* **risk:** Low — this is documentation + guard.
* **user decision required:** YES — confirm Liberation Serif is acceptable as production fallback.
* **recommended execution order:** 5

### R-06: Verify P0-06 throttling remediation

* **findingId:** CRIT-06
* **priority:** P1
* **affected subsystem:** scripts/audit/playwright/* (browser sweep), evidence rows for BM-118/119/120/151/152/153/185/186/187
* **confirmed root cause:** UNVERIFIED — disposition of these 9 forms not explicitly classified.
* **exact affected files:**
  * evidence rows for the 9 forms in canonical matrix JSON
* **required behavior:** Each form's evidence row indicates whether classification was by HTTP 429 detection or by timeout fallback.
* **smallest safe fix:**
  1. Read each of the 9 evidence rows.
  2. Confirm `classificationReason` is not `timeout-fallback`.
  3. If any is `timeout-fallback`, rerun that form's evidence collection with explicit 429 detection enabled.
* **regression test required:** Yes — add a guard test that asserts no evidence row has `classificationReason: timeout-fallback`.
* **focused validation:** read 9 evidence rows.
* **full validation:** `pnpm verify:ci`.
* **rollback approach:** none needed.
* **risk:** Low.
* **user decision required:** NO.
* **recommended execution order:** 6

---

## P2 — MEDIUM PRIORITY ITEMS

### R-07: Reproduce Docker verifier end-to-end on disposable volumes

* **findingId:** none (independent verification gap)
* **priority:** P2
* **affected subsystem:** scripts/docker-verify.mjs
* **confirmed root cause:** NOT independently reproduced
* **exact affected files:**
  * `scripts/docker-verify.mjs`
* **required behavior:** Verify exit code is consistent with internal state
* **smallest safe fix:** Run `node scripts/docker-verify.mjs` with disposable volumes; record output
* **regression test required:** No (already covered by CI docker job)
* **focused validation:** disposable docker verify run
* **full validation:** `pnpm verify:ci`
* **rollback approach:** none
* **risk:** Low — uses disposable volumes
* **user decision required:** NO
* **recommended execution order:** 7

### R-08: Independently verify apply-mode idempotence

* **findingId:** NOT_RUN
* **priority:** P2
* **affected subsystem:** scripts/audit/apply-all-current-evidence.mjs
* **confirmed root cause:** NOT independently verified
* **exact affected files:**
  * `scripts/audit/apply-all-current-evidence.mjs`
* **required behavior:** Re-running apply on a disposable copy of the workspace produces byte-identical outputs.
* **smallest safe fix:** Copy `docs/audit/infrastructure-modernization/evidence/*` to a disposable directory under `%TEMP%`, run apply twice, hash outputs, confirm identical.
* **regression test required:** Yes — add a guard test that creates a disposable workspace, runs apply twice, asserts byte-identical outputs.
* **focused validation:** disposable workspace test
* **full validation:** `pnpm verify:ci`
* **rollback approach:** none
* **risk:** Low — uses disposable workspace
* **user decision required:** NO
* **recommended execution order:** 8

### R-09: Document the wrapper-truthfulness contract

* **findingId:** CRIT-02 (follow-up)
* **priority:** P2
* **affected subsystem:** docs/runbooks/wrapper-truthfulness.md
* **confirmed root cause:** No documentation of when wrappers should propagate failures vs exit 0 with internal blocker
* **exact affected files:**
  * new file: `docs/runbooks/wrapper-truthfulness.md` (recommendation)
* **required behavior:** Each wrapper script documents its exit-code policy.
* **smallest safe fix:** Add a header comment to each verify:* script describing when it returns 0.
* **regression test required:** No.
* **focused validation:** static inspection.
* **full validation:** `pnpm verify:ci`.
* **rollback approach:** none.
* **risk:** None — documentation.
* **user decision required:** NO.
* **recommended execution order:** 9

---

## Execution Gate

Before Phase 8 (Remediation) begins, the user must decide on:

1. **R-01 (form-studio deletion intent):** restore or document.
2. **R-04 (migration repair strategy):** accept disposable DB test; accept `migrate resolve --applied` if drift is confirmed.
3. **R-05 (font policy):** accept Liberation Serif fallback for production.

If the user rejects any of these, remediation cannot proceed safely.

---

## Honesty Acknowledgements

- All evidence in this audit is independently observed where marked VERIFIED.
- NOT_RUN items are clearly marked; nothing is inferred to be PASS without evidence.
- The single CONTRADICTED finding (form-studio deletion) is documented with file-level evidence.
- No source, test, CI, Docker, contract, schema, migration, or persistent DB file was modified during this audit.
- No commit, push, or PR was created during this audit.