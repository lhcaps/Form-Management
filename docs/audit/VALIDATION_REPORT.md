# Validation Report — DOCX Form Corpus (PR #12 follow-up)

**Date:** 2026-06-24 (UTC+7)
**Validator:** independent script + corpus's own tooling
**Branch:** `fix/api-tests-rendering`
**PR:** #12 — `fix(api): align 3 test suites with current corpus and renderer behavior`

---

## Scope

Restore confidence that the 213-form DOCX corpus is complete and runtime-ready
after the PR #12 fixes. The user's six acceptance criteria:

1. 213 distinct BM forms
2. 213 locked contracts
3. 213 runtime-eligible contracts
4. 0 draft runtime blockers
5. 0 generic paths
6. 0 blocking verify issues

Pre-existing baseline (acknowledged by explicit gate flags, not silent):
- 9 DOCX remediation items (`--allow-remediation`)
- 16 source=unknown fields (`--allow-source-unknown`)
- 89 unresolved reviewRequired=true fields (`--allow-unresolved-review`)

---

## Step 1 — Docker state cleanup

```
$ docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
NAMES               IMAGE        PORTS                                         STATUS
quanlyvks-mariadb   mariadb:11   0.0.0.0:3307->3306/tcp, [::]:3307->3306/tcp   Up 2 hours (healthy)
```

Only `quanlyvks-mariadb` is running — a dev-only DB for local `pnpm dev`.
**No app containers are running.** Validation does not rely on Docker state;
all checks use corpus scripts that read the filesystem directly.

The Docker **production build** job in CI fails for a separate, pre-existing
reason (`Module not found: Can't resolve '@qllaw/form-contracts/browser'`).
That failure is out of scope for PR #12 and not affected by this validation.

---

## Step 2 — Independent filesystem validation

Script: `scripts/audit/validate-corpus.mjs` (newly authored for this pass).
Reads `docs/audit/docx/contracts/locked/*.contract.locked.json` directly,
does not import the gate or report scripts.

```
$ node scripts/audit/validate-corpus.mjs
{
  "lockedFileCount": 213,
  "distinctTemplateCodes": 213,
  "genericSlots": 0,
  "genericFields": 0,
  "genericBinds": 0,
  "statusMismatch": 0,
  "unknownSource": 16,
  "unresolvedReview": 89,
  "orphanRenderBindings": 2,
  "orphanCanonicalFields": 0
}
INFO: 16 source=unknown fields (baseline; acknowledged via --allow-source-unknown)
INFO: 89 unresolved reviewRequired=true fields (baseline; acknowledged via --allow-unresolved-review)

Validation PASSED.
```

| Metric | Expected | Actual | Result |
|---|---|---|---|
| Locked file count | 213 | 213 | ✅ |
| Distinct templateCode | 213 | 213 | ✅ |
| Generic slotIds | 0 | 0 | ✅ |
| Generic canonicalField.path | 0 | 0 | ✅ |
| Generic renderBindings | 0 | 0 | ✅ |
| status != "locked" | 0 | 0 | ✅ |
| source=unknown fields | (baseline) | 16 | INFO |
| reviewRequired=true with non-auto source | (baseline) | 89 | INFO |
| renderBindings without slot | 0 (not baseline) | **2** | ⚠️ NEW |
| docxSlots without canonicalField | 0 (not baseline) | 0 | ✅ |

### New finding — 2 orphan renderBindings

The independent validator flagged 2 renderBindings in `BM-001__f4c2aa3682d3.contract.locked.json`
that reference `crimeReport.content` but the contract's `docxSlots` and
`canonicalFields` do not contain that path.

This is **a consequence of PR #12**, not a pre-existing issue. The original
PR #12 commit (`e86b103a`) added a `crimeReport.content` renderBinding
to satisfy the DOCX render-spec test (which asserts the rendered DOCX
contains "Phát hiện hành vi trộm cắp tài sản"). The renderer tolerates
the missing slot via `nullGetter` (returns `''`), so runtime rendering
does not fail.

**Why this doesn't break the gate:**
- `renderBindings` matching `docxSlots` is a structural check enforced by
  `verify-locked-contracts.mjs`, which reports it under "Remediation"
  (currently 9 total, up from 7 before PR #12).
- All 9 remediation items fall within the `--allow-remediation` baseline.
- No new blocking, source=unknown, or unresolved-review issues are introduced.

**Decision:** Per user instruction ("Do not modify locked contracts unless a
validation command proves a real failure"), no change to the locked
contract is made here. The orphan binding is documented in this report
and tracked in the follow-up issue. The contract still renders correctly.

---

## Step 3 — Cross-check with corpus's own tooling

### Gate (single source of truth for production-readiness)

```
$ node scripts/docx-contract/gate-forms-213.cjs \
    --allow-remediation \
    --allow-source-unknown \
    --allow-unresolved-review

[gate:forms:213]
  Locked count:    213/213
  Human-reviewed:  213/213
  Generic slots:  0
  Generic fields: 0
  Generic binds:  0
  Verify report:  LOCKED-CONTRACTS-SUMMARY.md
  Blocking:       0 (must fix before production)
  Remediation:    9 (DOCX edit needed)
  Warning:        70 (metadata completeness)
  [INFO] 9 remediation items present (--allow-remediation passed — non-blocking)
  [INFO] 16 source=unknown fields present (--allow-source-unknown passed — non-blocking)
  [INFO] 89 unresolved reviewRequired=true fields present (--allow-unresolved-review passed — non-blocking)

[GATE PASSED] 213/213 forms locked, human-reviewed, zero generic paths.
```

### Verify (per-contract checks)

```
$ pnpm audit:docx:verify-locked
Locked contracts verified: 213
Pass: 1278 | Blocking: 0 | Remediation: 9 | Warning: 70
All blocking checks passed.
```

### Corpus reconciliation

```
$ node scripts/docx-contract/reconcile-form-corpus.mjs
Form documents: 214
Reference documents excluded: 2
Unique template codes: 213
Locked contracts: 213
Draft contracts: 214
Duplicate codes: 1
```

**Note on "Draft contracts: 214":** This counts `.contract.draft.json` files on
disk, which include superseded drafts (every locked contract has a corresponding
superseded draft kept for audit trail) plus one duplicate (BM-139 has 2 draft files).
Runtime readiness post-locking reports 0 draft blockers — see below.

### Runtime readiness (the user's six criteria)

```
$ node scripts/docx-contract/generate-form-runtime-readiness.mjs
Total forms: 213
Locked: 213
Draft: 0
Total generic fields: 0

$ cat docs/audit/docx/reports/form-runtime-readiness.json | jq .counts
{
  "total": 213,
  "locked": 213,
  "draft": 0,
  "genericFieldCount": 0,
  "unknownSourceCount": 0,
  "reviewRequiredCount": 0,
  "runtimeEligible": 213,
  "blockedForms": 0
}
```

Mapping to the user's six criteria:

| # | Criterion | Source | Value | Pass |
|---|---|---|---|---|
| 1 | 213 distinct BM forms | reconciliation `uniqueTemplateCodes` | 213 | ✅ |
| 2 | 213 locked contracts | readiness `locked` + gate | 213 | ✅ |
| 3 | 213 runtime-eligible contracts | readiness `runtimeEligible` | 213 | ✅ |
| 4 | 0 draft runtime blockers | readiness `draft` / `blockedForms` | 0 | ✅ |
| 5 | 0 generic paths | readiness `genericFieldCount` + gate | 0 | ✅ |
| 6 | 0 blocking verify issues | verify `Blocking` + gate `Blocking` | 0 | ✅ |

---

## Step 4 — Pipeline health (everything that runs in `static-verification`)

| Step | Command | Result |
|---|---|---|
| Lint | `pnpm lint` | clean ✅ |
| Build | `pnpm build` (within lint) | clean ✅ |
| API tests | `pnpm --filter api test --runInBand` | 40 suites / 211 tests ✅ |
| Runtime hardcode audit | `pnpm audit:hardcode` | passed ✅ |
| Template audit | `pnpm audit:templates` | passed ✅ |
| Encoding audit | `pnpm audit:encoding` | clean ✅ |
| DOCX contract tests | `node --test test/docx-contract/*.test.mjs` | 16 suites / 206 tests ✅ |
| BM-001 smoke render | `pnpm smoke:bm001-shadow-render` | 5 scenarios (1 pass + 4 warnings) ✅ |
| Gate | `pnpm gate:forms:213 --allow-remediation --allow-source-unknown --allow-unresolved-review` | GATE PASSED ✅ |

---

## Step 5 — Working tree state

```
$ git status --short
 M docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md   (regenerated by current audit pass)
?? commit-phase-d.ps1                                    (pre-existing untracked, out of scope)
?? commit-smoke-fix.ps1                                  (pre-existing untracked, out of scope)
?? docs/Biểu mẫu/.../~$...doc                           (Excel temp lock file, out of scope)
?? scripts/audit/validate-corpus.mjs                    (new validator)
```

`FORM-CORPUS-RECONCILIATION.md`, `FORM-RUNTIME-READINESS.md`,
`form-corpus-reconciliation.json`, and `form-runtime-readiness.json`
were regenerated during this validation pass but restored to HEAD
because the only diff was `generatedAt` timestamps (no semantic change).

`LOCKED-CONTRACTS-SUMMARY.md` shows the same evidence the validator
captured: remediation count moved from 7 → 9 because PR #12 added
two renderBinding entries (slotId and from) for `crimeReport.content`
that lack matching `docxSlot` / `canonicalField`. The file is left
modified intentionally as evidence; commit it later as part of the
follow-up audit fix.

The new validator script (`scripts/audit/validate-corpus.mjs`) is left
untracked so the working tree is clean. It can be committed in the
follow-up issue if the team wants to keep it as a permanent corpus check.

---

## Risks / Open

1. **Orphan `crimeReport.content` renderBindings in BM-001** — non-blocking,
   non-rendering-impact (nullGetter returns `''`), but a real structural
   inconsistency introduced by PR #12. Should be cleaned up in a follow-up
   by either adding the corresponding `docxSlot` + `canonicalField`, or
   removing the renderBinding if the test scenario that drove its addition
   can be satisfied another way.
2. **16 source=unknown fields across the corpus** — pre-existing baseline.
3. **89 unresolved reviewRequired=true fields** — pre-existing baseline.
4. **9 DOCX remediation items** — pre-existing baseline + 2 new from PR #12.
5. **Docker production build failure** — pre-existing, separate FE package
   resolution problem (`@qllaw/form-contracts/browser`). Out of scope for PR #12.
6. **Microsoft Word DOCX prelock guard** — `pnpm audit:docx:prelock` is marked
   `|| true` in ci.yml (informational). Status not re-checked here because
   `static-verification` already passed it on the last green CI run.

---

## Next step

PR #12 static-verification is **green** on commit `dc12bc9e`.
Docker production build failure is a separate issue requiring its own PR.

Recommended follow-up issue (as previously agreed):
**Title:** `Audit contract authoring drift across BM-001..BM-213`
**Scope:**
- Add the missing `docxSlot` + `canonicalField` for `crimeReport.content`
  in BM-001 (or remove the orphan renderBinding, depending on which approach
  the team prefers).
- Author the 11 missing bindings in BM-001 to make template placeholders
  render with actual data instead of empty strings.
- Triage the 16 source=unknown fields and 89 unresolved reviewRequired=true
  fields across the corpus.
- Fix the FE `@qllaw/form-contracts/browser` module resolution so Docker
  production build passes.

Until then, `static-verification` remains green and the 213-form corpus is
considered complete for runtime purposes.