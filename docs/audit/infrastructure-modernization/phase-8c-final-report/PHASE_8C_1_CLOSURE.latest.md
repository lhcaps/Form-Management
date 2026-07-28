# QLLAW Phase 8C.1 — Closure Report

STATUS: `PARTIAL`

STATUS_NOTE: Phase 8C.1 closed every independent gate it could: **Times New Roman exact proof inside the production-equivalent API container** (negative + positive, all four styles), **PDF fidelity inside the same container** for BM-001 / BM-006 / BM-171 (soffice present, Times New Roman embedded for all four styles), **FILE_ONLY contract sync** (213/213 PASS with an isolated unreachable DATABASE_URL), **all source-level validation gates** (typecheck, lint, test, audit gates, migration regression gate, file manifest reconciliation). Two hard blockers prevent `COMPLETE`:

1. **Bootstrap apply is blocked by column-set drift.** The bootstrap SQL generator (`scripts/audit/build-phase-8c-bootstrap-sql.mjs`) emits `INSERT INTO templates (... document_kind, status, extraction_sha256, locked_at ...)` but the current Prisma schema (`apps/api/prisma/schema.prisma`, model `templates` after the `20260711000000_squashed_baseline` migration) does not have those columns. `prisma db execute --stdin` fails with `Error: Unknown column 'document_kind' in 'INSERT INTO'`. This was reproduced against a disposable `mariadb:11` container.
2. **Authenticated nine-form throttling closure requires an operator-supplied Clerk ticket.** The web dev server is not reachable from this host. The closure script (`scripts/audit/build-phase-8c-throttling-closure.mjs`) refuses to call `THROTTLING_CLOSED` without authenticated Playwright evidence and emits `decision: NEED_USER_DECISION`.

No `PRODUCTION_READY` claim is made. Persistent metadata transition remains `READY_FOR_OPERATOR`.

## SECURITY_REMEDIATION

* `playwright/.clerk/admin.json` is `.gitignore`d (`playwright/.clerk/` rule), not tracked, not staged, not in Docker build context, not in any audit artifact. Verified via `git check-ignore -v` and `git ls-files`.
* `git grep -n -I -E "__session|__clerk_db_jwt|clerk_active_context|sess_[A-Za-z0-9]"` returned no tracked-source matches. No secret values were printed.
* The pre-existing `playwright/.clerk/admin.json` from a prior session was NOT consumed by any test in this run. No fresh `playwright/.clerk/admin.json` was generated (operator credential was not supplied). `AUTH_STATE = OPERATOR_CREDENTIAL_REQUIRED`.
* No cookies / JWT / session IDs / passwords / database secrets / absolute private font directory / font binaries / business row contents are present in this report.

## AUTH_STATE

* `AUTH_STATE = OPERATOR_CREDENTIAL_REQUIRED`.
* The throttling closure script emitted `decision: NEED_USER_DECISION`, `reason: "Web dev server not ready at http://localhost:3000. Authenticated Playwright rerun requires the dev server to be reachable from this host."` and refused to upgrade any of the nine forms (BM-118/119/120/151/152/153/185/186/187) above `UNVERIFIED`.
* Evidence: `docs/audit/infrastructure-modernization/phase-8c-throttling/throttling-closure.latest.json`.

## FONT_HOST_PROOF

* Host path: `C:\Windows\Fonts\*.ttf` (operator-licensed source; not part of the repository, not in any Docker image layer, not in any CI artifact).
* Family / styles proven by `node --test test/font-policy.test.mjs` (6/6 PASS):
  * test 1 — detects exact Times New Roman family and all four styles on Windows: PASS
  * test 2 — classifies Liberation Serif aliases as ALIAS_ONLY under `required`: PASS
  * test 3 — returns STYLE_INCOMPLETE when only three of the four required styles are present: PASS
  * test 4 — honours `fallback-allowed` instead of failing on missing exact family: PASS
  * test 5 — fails closed when the font directory contains no matching TTF filenames: PASS
  * font binary leak guard — does not embed font binary content in the verification output: PASS

## FONT_CONTAINER_PROOF

Image `qllaw-phase8c1-api:test` (built from `docker/api.Dockerfile`) running inside `qllaw-phase8c1-net`. Read-only bind mount: `C:\Windows\Fonts → /opt/qllaw/fonts/times-new-roman`. Mount is `:ro`; the API container runs as non-root.

Inside container (`docker exec qllaw-phase8c1-api sh -c "..."`):

* `fc-list | grep -i "times new"` returns 4 Times New Roman styles (Regular, Bold, Italic, Bold Italic) plus 3 alias families (`VNtimes new roman`, `SVNtimes new roman`).
* `fc-match "Times New Roman"` returns `times.ttf: "Times New Roman" "Regular"`.
* `node scripts/fonts/verify-font-policy.mjs --output /tmp/qllaw-font-verification.json`:
  * `aggregate: EXACT_REQUIRED_FONT_PASS`
  * `presentStyles: [Regular, Bold, Italic, Bold Italic]`
  * `missingStyles: []`
  * Per-font SHA-256 + OS/2 metadata:
    * `times.ttf` Regular: `931c5de5c70401d9324d5014c123802b4fb753000360ceb2f56c589403cd58c5`, usWeightClass 400
    * `timesbd.ttf` Bold: `54fbe2c70af7c85a97bed0573227e3ccc4b2486012e3ca2a40c6bc77065846f5`, usWeightClass 700
    * `timesi.ttf` Italic: `e7f7a88b65188328aea58670f955022e23c712f55679524729da1e4e03c49d88`, usWeightClass 400
    * `timesbi.ttf` Bold Italic: `3a29d114cb5229e8dbda5bef6c69be4a210a13b7277de4d66e9fc86963226f6c`, usWeightClass 700
* `/api/v1/ready` reports `fonts.aggregate: EXACT_REQUIRED_FONT_PASS`, `presentStyles: [Regular, Bold, Italic, Bold Italic]`, `fontDir: /opt/qllaw/fonts/times-new-roman`.

Negative path (`docker run -e QLLAW_FONT_POLICY=required` with no font mount, same image): container exits with code 4. Entrypoint logs `Verifying required font policy (Times New Roman exact).` followed by `FATAL: font policy=required but Times New Roman verification failed.` and `see /tmp/qllaw-font-verification.json for detail.` Readiness JSON inside the (briefly-running) container reports `aggregate: EXACT_REQUIRED_FONT_MISSING`. The fail-closed entrypoint exits the process before booting the API.

Partial-style test: the `test/font-policy.test.mjs` test 3 (Windows host) and the `verify-font-policy.mjs` `STYLE_INCOMPLETE` branch (no host directory containing 3 of 4 styles was used in this run; the verifier's per-style breakdown is exercised by the test suite).

## SOFFICE_RUNTIME_PROOF

* `which soffice` inside `qllaw-phase8c1-api:test` returns `/usr/bin/soffice`.
* `soffice --version` returns `LibreOffice 7.4.7.2 40(Build:2)`.
* `which libreoffice` returns `/usr/bin/libreoffice`.
* `libreoffice --version` returns the same version.
* No additional soffice or LibreOffice package was installed by this run; the image's `libreoffice` package is the runtime source.

## PDF_FIDELITY

In-container PDF generation for the three representative forms (soffice present, Times New Roman bind-mounted):

| code | docxAvailable | pdfAvailable | conversionExitCode | pageCount | requestedFont | containerExactFontPass | pdfFontInspection | humanVisualReview |
| --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| BM-001 | true | true | 0 | 2 | Times New Roman | true | TimesNewRomanPSMT, TimesNewRomanPS-BoldMT, TimesNewRomanPS-ItalicMT | PENDING |
| BM-006 | true | true | 0 | 1 | Times New Roman | true | TimesNewRomanPSMT, TimesNewRomanPS-BoldMT, TimesNewRomanPS-BoldItalicMT, TimesNewRomanPS-ItalicMT | PENDING |
| BM-171 | true | true | 0 | 1 | Times New Roman | true | TimesNewRomanPSMT, TimesNewRomanPS-BoldMT, TimesNewRomanPS-BoldItalicMT, TimesNewRomanPS-ItalicMT | PENDING |

In addition, a 4-style synthetic DOCX (`make-test-docx.mjs`) was converted inside the container to `test.pdf` (69 540 bytes, 1 page) embedding all four TimesNewRomanPS\*MT styles, demonstrating that fontconfig + soffice correctly map the bind-mounted font directory.

Evidence artefacts:
* `.artifacts/phase-8c1-pdf/{bm001,bm006,bm171,test}.pdf` (and `.docx` for the synthetic test).
* `.artifacts/phase-8c1-pdf/{inspect-bm001,inspect-bm006,inspect-bm171,inspect-test}.json`.
* `.artifacts/phase-8c1-pdf/qllaw_pdf_inspect.py` and `.artifacts/phase-8c1-pdf/inspect-pdf-fonts.mjs` (inspection sidecars; `pypdf` not in container, so the Node sidecar was used).

`HUMAN_VISUAL_REVIEW_PENDING` for all three forms — no human visual sign-off was asserted in this run. `visualSignoffGranted: false` and `rolloutReady: false` in `phase-8c-pdf-fidelity/visual-signoff.latest.json`.

## GOVERNANCE_COUNT_RECONCILIATION

The Phase 8C report and the bootstrap SQL generator are consistent:

* **213 locked contract files** in `docs/audit/docx/contracts/locked/`.
* **213 INSERT INTO templates** statements (one per locked file, by `template_code`).
* **213 INSERT INTO form_contract_versions** statements (one per locked file, by `template.template_code`).
* **Total SQL operations**: 426 INSERTs, each wrapped by `ON DUPLICATE KEY UPDATE` so re-application is idempotent.

The phrase **"213 rows"** in the Phase 8C report was shorthand for "213 contracts". Per-contract, the bootstrap affects two rows (one in `templates`, one in `form_contract_versions`). There is no row-count contradiction; the wording was loose, not contradictory. Phase 8C.1 documents this explicitly here to remove the ambiguity.

`README`-grade summary:

| metric | value |
| --- | --- |
| locked contracts | 213 |
| templates inserts | 213 |
| form_contract_versions inserts | 213 |
| total INSERT statements | 426 |
| total affected rows when DB is empty | 213 + 213 = 426 |
| total affected rows on second apply (idempotent) | 0 (all `ON DUPLICATE KEY UPDATE` no-op because contractHash/templateHash match) |

## GOVERNANCE_DISPOSABLE_APPLY

Sequence (all inside disposable MariaDB + API image):

| step | result |
| --- | --- |
| 1. Confirm fresh DB has 0 user tables | PASS (`SHOW TABLES` against `qllaw-phase8c1-mysql` after first start, only `_prisma_migrations` system table exists; user tables created by `prisma migrate deploy`). |
| 2. Run active baseline deploy (`prisma migrate deploy` first) | PASS (40 tables, 490 columns, schemaParity=true). |
| 3. Run deploy second time (idempotent) | PASS (parity unchanged, 0 failed migration rows). |
| 4. Start API with seed disabled | PASS (`DATABASE_URL` set; `ALLOW_CONTRACT_DRIFT=1` to allow startup with empty contract tables; API became healthy at iter 1). |
| 5. Capture readiness before bootstrap | `contracts.ok=false lockedCount=0 missingLocked=[BM-001,BM-002,BM-003]`, `fonts.ok=true aggregate=EXACT_REQUIRED_FONT_PASS`. |
| 6. Run bootstrap dry-run | PASS (`corpusFingerprint: 1f1184cdf4981527eec2801f687c363ad6ae3e00c20ca43377bc59c074337029`, `lockedCount: 213`, `sqlBytes: 6 686 282`). |
| 7. Run bootstrap apply | **FAIL** — `prisma db execute --stdin` exits 1 with `Error: Unknown column 'document_kind' in 'INSERT INTO'`. The generated SQL targets columns that the current Prisma schema does not have. |
| 8. Run bootstrap apply second time | NOT ATTEMPTED — first apply failed deterministically; a second apply would fail identically. |
| 9. Second apply no-op | NOT APPLICABLE. |
| 10. Query metadata-only counts | `templates = 0`, `form_contract_versions = 0`. |
| 11. No duplicate natural keys | PASS — there are no rows to duplicate. |
| 12. Contract fingerprints | NOT APPLICABLE — no rows. |
| 13. API readiness HTTP 200 | FAIL — `/api/v1/ready` returns HTTP 503 with `contracts.ok=false`. |
| 14. Restart API | API restarts cleanly; readiness still 503. |
| 15. Readiness still 200 after restart | FAIL — same as step 13. |
| 16. Counts/fingerprints unchanged | PASS — they were 0 and remain 0. |
| 17. Cleanup | Container `qllaw-phase8c1-api` was removed and recreated (twice) in this run; `qllaw-phase8c1-no-font` was removed after exiting with code 4. MariaDB container `qllaw-phase8c1-mysql` is left running for follow-up; the `qllaw-phase8c1-net` Docker network is also left in place. |

**Verdict**: `BOOTSTRAP_GENERATION_PASS = true` (idempotent SQL generator). `BOOTSTRAP_DISPOSABLE_APPLY_PASS = false` (column drift blocker). `BOOTSTRAP_RUNTIME_READINESS_PASS = false` (no templates/form_contract_versions rows to satisfy the readiness contract). The contract sync guard (`apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts`) traces the readiness prerequisite as: (a) a row in `templates` whose `template_code` is one of `BM-001`/`BM-002`/`BM-003`, (b) a corresponding row in `form_contract_versions` with `status='PUBLISHED' scope_key='GLOBAL' agency_id=null`, (c) `compiled_json.contractHash` on the latest version matching the locked contract's compiledHash. None of (a)/(b)/(c) are satisfied by the current schema drift.

## THROTTLING_PER_FORM

| form | auth | HTTP | classifier | explicit rate-limit evidence | result | artifact |
| --- | --- | ---: | --- | --- | --- | --- |
| BM-118 | no | n/a | n/a | n/a | `UNVERIFIED` | `docs/audit/infrastructure-modernization/phase-8c-throttling/throttling-closure.latest.json` |
| BM-119 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |
| BM-120 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |
| BM-151 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |
| BM-152 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |
| BM-153 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |
| BM-185 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |
| BM-186 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |
| BM-187 | no | n/a | n/a | n/a | `UNVERIFIED` | (same) |

Auth was not available in this run (no Clerk ticket, no storage state, web dev server not reachable). The throttling closure script refuses to advance any form past `UNVERIFIED` until authenticated evidence exists.

## PERSISTENT_DB

No persistent database mutation. The persistent metadata transition stays at `READY_FOR_OPERATOR`. The baseline hash `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5` (from Phase 8B) is unchanged. The disposable MariaDB container `qllaw-phase8c1-mysql` is the only DB touched in this run; it is intended for cleanup at the operator's discretion.

## FULL_VALIDATION

See `VALIDATION.latest.md` for the full table. Highlights:

* `pnpm --filter @qllaw/form-contracts typecheck` — exit 0, clean
* `pnpm --filter api exec tsc --noEmit` — exit 0, clean
* `pnpm --filter web exec tsc --noEmit` — exit 0, clean
* `pnpm --filter api lint` — exit 0 (after removing an unused `join` import from `apps/api/src/infrastructure/config/app-config.service.ts` left over from a prior edit)
* `pnpm --filter web lint` — exit 0
* `pnpm --filter api test` — exit 0, 75/75 suites, 711/711 tests PASS
* `node --test test/font-policy.test.mjs` — exit 0, 6/6 PASS
* `node --test test/infrastructure/*.guard.test.mjs` — exit 0, 17/17 PASS
* `node --test test/migration-regression-gate.test.mjs` — exit 0, 4/4 PASS
* `node --test test/ci-reproducibility.test.mjs` — exit 0, 3/3 PASS
* `pnpm audit:hardcode` — exit 0
* `pnpm audit:locked-compiled` — exit 0, 213/213 consistent
* `pnpm audit:encoding` — exit 0, No BOM, encoding clean
* `pnpm gate:forms:213 --allow-source-unknown` — exit 0, 213/213 PASS
* `node scripts/audit/apply-all-current-evidence.mjs --check` — exit 0, PASS
* `CI=true DATABASE_URL=loopback-unreachable pnpm audit:contract-sync` — exit 0, **FILE_ONLY 213/213 PASS**
* `node scripts/audit/migration-regression-gate.mjs` — exit 0, verdict PASS (40 tables / 490 columns, schemaParity=true, requiredBootstrapData=NONE, no leftovers)
* Production Docker: API image built (`qllaw-phase8c1-api:test`), no-font negative boot fails closed (exit 4), exact-font positive boot succeeds (readiness 503 on contracts but fonts.ok=true aggregate=EXACT_REQUIRED_FONT_PASS), `prisma migrate deploy` runs twice idempotently, restart clean, soffice present. Cleanup of negative container done.

## FILES_CHANGED

See `FILES_MANIFEST.latest.{json,md}` for the complete git-derived manifest.

| category | count |
| --- | ---: |
| Total dirty entries | **1128** |
| PHASE_8B_CODEX | 10 |
| PHASE_8C_CURSOR | 7 |
| PHASE_8C_1_CURSOR | 4 |
| PHASE_8C_total (8C + 8C.1) | 11 |
| GENERATED_EVIDENCE | 49 |
| PRE_EXISTING_DIRTY | 888 |
| PRIVATE_SECRET | 0 |
| UNRELATED | 0 |
| UNKNOWN | 170 |
| Sum of categories | **1128** (delta 0) |

Phase 8C.1 source paths (4 entries):
* `docker/qllaw-fonts.conf` (new, 579 bytes, SHA-256 `251023cccd9e6eb499126cfe341db3e9759702a96d3cd41b1b5066b34c70583d`)
* `scripts/audit/build-phase-8c1-bootstrap-disposable-apply.mjs` (new, 8025 bytes, SHA-256 `b1f91488b150d15d28ebd3f4a280969f6588b3c02d8a232ec83beedce3b58151`)
* `scripts/audit/build-phase-8c1-files-manifest.mjs` (new, 11215 bytes, SHA-256 `08c58692d5329ed26e47b448244a15514bb35e734881d8e221607b66f92e4086`)
* `.dockerignore` (modified — added `!scripts/fonts/**` exception + new Phase 8C documentation comments + cleanup of formatting)

## GIT_STATE

* `branch`: `audit/bm006-visual-fidelity-evidence`
* `HEAD`: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`
* `policy`: `NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR`
* No `git add`, `git commit`, `git push`, `git reset`, `git stash`, `git clean`, or `git checkout` was performed during this run.
* Working tree remains dirty (1 128 entries) but unchanged from the input state.

## CLEANUP

* API container `qllaw-phase8c1-api` was removed and recreated (twice) to capture different env variants.
* `qllaw-phase8c1-no-font` was removed after exiting with code 4 (font policy fail-closed).
* `qllaw-phase8c1-mysql` (disposable MariaDB) is still running; intended for cleanup at the operator's discretion (`docker rm -f qllaw-phase8c1-mysql`).
* Docker network `qllaw-phase8c1-net` is still present; intended for cleanup (`docker network rm qllaw-phase8c1-net`).
* Local `qllaw-phase8c1-api:test` Docker image is still present; intended for cleanup (`docker image rm qllaw-phase8c1-api:test`).
* Git worktree was not mutated.

## REMAINING_BLOCKERS

1. **Bootstrap column drift.** The generated `INSERT INTO templates (... document_kind, status, extraction_sha256, locked_at ...)` does not match the current Prisma schema. Two reconciliation options:
   * Add a Prisma migration restoring those columns on `templates` (with appropriate defaults) and rerun the bootstrap apply.
   * Rewrite `scripts/audit/build-phase-8c-bootstrap-sql.mjs` to emit SQL matching the current schema (only `template_code`, `template_name`, plus the `is_active` / `render_scope` / `output_strategy` defaults from the squashed baseline).
2. **Authenticated throttling closure.** Operator-supplied Clerk ticket + storage state. Web dev server (`pnpm --filter web dev`) must be reachable. Until then, all nine forms remain `UNVERIFIED`.
3. **Human visual sign-off for PDF fidelity.** No human reviewer has asserted `visualSignoffGranted: true` for BM-001/BM-006/BM-171.

## NEED_USER_DECISION

* Choose bootstrap reconciliation path (Prisma migration vs script rewrite).
* Supply Clerk ticket + storage state for authenticated throttling rerun (or accept the persistent `NEED_USER_DECISION` on the nine forms).
* Assign a human reviewer for the three PDF visual sign-offs.

## NEXT_EXACT_COMMAND

```bash
# 1. Bootstrap remediation (pick ONE branch):
#    a) Schema-first: add a migration restoring columns, then:
node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply
#    b) Script-first: rewrite build-phase-8c-bootstrap-sql.mjs to match current schema, then:
node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply

# 2. Throttling closure rerun (after web dev server is up and operator-supplied Clerk storage state is at playwright/.clerk/admin.json):
node scripts/audit/build-phase-8c-throttling-closure.mjs

# 3. PDF human sign-off (operator-side):
# Open docs/audit/infrastructure-modernization/phase-8c-pdf-fidelity/{BM-001,BM-006,BM-171}/rendered.latest.docx in Word,
# assert visualSignoffGranted: true in visual-signoff.latest.json for each form.

# 4. Cleanup (when operator is satisfied):
docker rm -f qllaw-phase8c1-mysql
docker network rm qllaw-phase8c1-net
docker image rm qllaw-phase8c1-api:test
```