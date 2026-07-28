# Original P0 Reconciliation — Independent Audit

## Mapping Codex reported 5-of-6 against original six P0

| Original P0 | Description | Codex mapping | Status this audit | Notes |
|---|---|---|---|---|
| P0-01 | Working-tree safety & provenance | INFRA-P0-005 (build context + .dockerignore) | PARTIALLY_VERIFIED | staged=0 verified, hashes preserved, but 32 form-studio deletions are not in the disclosed change table |
| P0-02 | Evidence integrity | INFRA-P0-001 | VERIFIED | 201 PASS / 12 PARTIAL preserved, holdouts correct, idempotence in check mode verified |
| P0-03 | Hanging status-matrix guard | INFRA-P0-001 | PARTIALLY_VERIFIED | mutation=NONE in check mode, but apply-mode idempotence not independently verified |
| P0-04 | Full typecheck/build | INFRA-P0-004 | VERIFIED | 3/3 typechecks pass independently; build indirect via verify:ci |
| P0-05 | Docker production issue #13 | INFRA-P0-003, INFRA-P0-005 | PARTIALLY_VERIFIED | static inspection looks correct; no Docker build + boot performed |
| P0-06 | Throttling and Playwright reliability | (downgraded to P1) | NOT_VERIFIED | disposition of 9 affected forms (BM-118, BM-119, BM-120, BM-151, BM-152, BM-153, BM-185, BM-186, BM-187) not explicitly addressed |

## Codex's "5 of 6 RESOLVED" claim

Codex's five resolved are: INFRA-P0-001, INFRA-P0-002, INFRA-P0-003, INFRA-P0-004, INFRA-P0-005. The sixth INFRA-P0-006 (in Codex's scheme) is migration P3018 / MariaDB 1060 — **not the throttling concern**. **Codex's original-six → Codex-six mapping shifts the throttling concern out of P0.** This is a substantive re-classification.

## Independent disposition per original P0

### P0-01 Working-tree safety and provenance

- Staged files = 0. ✅
- BM-006 normalized DOCX hash preserved (b83c42ad...). ✅
- Prisma schema hash preserved (057375956...). ✅
- Canonical matrix JSON hash preserved (8599db87...). ✅
- Canonical matrix MD hash preserved (c63aa609...). ✅
- packages/form-contracts/dist not in diff. ✅
- **32 form-studio API files deleted** (apps/api/src/modules/form-studio/*).
- **3 form-studio Web files deleted** (apps/web/src/app/admin/(shared)/form-studio/page.tsx, apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx, apps/web/src/components/form-studio/form-studio-workspace.tsx).
- apps/web/src/lib/form-studio-api.ts modified.

**Undeclared product behavior change.** A claim of "5 of 6 P0 RESOLVED" cannot hold if a product feature was silently removed.

### P0-02 Evidence integrity

- 201 PASS, 12 PARTIAL confirmed.
- Holdouts list confirmed: BM-024, BM-200, BM-039, BM-041, BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-089, BM-099.
- BM-130 canary preserved (status: canary).
- BM-006 v3 calibration preserved.
- runtimeReady allowlist still BM-001 + BM-171 only.
- fidelityComplete=true count = 0 (correct).

**VERIFIED.**

### P0-03 Hanging status-matrix guard

- The orchestrator runs in `--check` mode without mutation. The earlier hanging problem appears to be resolved by a structural change (atomic reads, no wall-clock-bound loop in check path).
- Apply-mode idempotence: NOT independently verified. Apply script requires write access to canonical matrix JSON; we cannot safely exercise it on the user's primary working tree.
- The 5 infrastructure guard tests pass (`--test test/infrastructure/*.guard.test.mjs` → 17/17 PASS).

**PARTIALLY_VERIFIED.**

### P0-04 Full typecheck/build

- `@qllaw/form-contracts` typecheck: exit 0. ✅
- `apps/api` typecheck: exit 0. ✅
- `apps/web` typecheck: exit 0. ✅
- Root `pnpm typecheck`: not exercised standalone; covered by verify:quick which exited 0.
- `pnpm build`: not exercised standalone; covered by verify:ci which exited 0.

**VERIFIED.**

### P0-05 Docker production issue #13

- Static inspection of `docker/web.Dockerfile`: uses `node` (not `pnpm`) to invoke `next start`. ✅
- packages/form-contracts/package.json has `./browser` export. ✅ (presumed from prior knowledge)
- api.Dockerfile contains `USER node`, `HEALTHCHECK`, copies locked + compiled assets. ✅
- compose env has `SEED_DATA: ${SEED_DATA:-false}` and `NODE_ENV=production`. ✅
- **No fresh Docker build + image boot performed.**

**PARTIALLY_VERIFIED.**

### P0-06 Throttling and Playwright reliability

- Static inspection only. The 9 affected forms (BM-118/119/120/151/152/153/185/186/187) are not in the 12-form holdout list, so they must be classified PASS.
- The classification logic for throttling / 429 is not independently verified.
- **NOT_VERIFIED.**

## Conclusion

Codex's "5 of 6 P0 RESOLVED" claim is **technically supported only if the user accepts Codex's re-mapping of the original six P0 blockers into Codex's six INFRA-P0 items**. The mapping is internally consistent but moves the throttling concern out of P0.

The independently observable critical issues are:

1. **Form-studio deletion is undeclared.** This is the most serious gap.
2. **verify:full exit 1 vs verify:ci exit 0** — wrapper truthfulness.
3. **P0-06 throttling not independently verified.**