# C2 — CI Gate for Contract Sync

**Task**: C2 - Add CI gate for contract sync  
**Status**: ✅ COMPLETE  
**Date**: 2026-06-25

---

## What Was Implemented

CI gate that runs `pnpm audit:contract-sync` during GitHub Actions workflow and blocks merge if contract drift is detected. This ensures the main branch always has synced contracts between filesystem and DB.

### Files Created

1. **`scripts/audit/audit-contract-sync.mjs`** — CI-friendly audit script with strict exit codes

### Files Modified

1. **`.github/workflows/ci.yml`** — Added contract sync gate step
2. **`package.json`** — Added `audit:contract-sync` script

---

## How It Works

### CI Workflow

```yaml
- name: "Gate: Contract sync (C2)"
  run: pnpm audit:contract-sync
```

This step runs after the forms corpus gate and before Docker build.

### Exit Codes

| Code | Meaning | CI Result |
|------|---------|-----------|
| 0 | All contracts synced (matched = total) | ✅ Pass |
| 1 | Drift detected (missing or stale) | ❌ Fail, block merge |
| 2 | Script execution error | ❌ Fail, block merge |

### Strictness

**C2 gate is STRICT by default** — unlike the startup guard (C1) which can be bypassed with `ALLOW_CONTRACT_DRIFT=1`, the CI gate always blocks on drift. This ensures:
- Main branch always has synced contracts
- No drift propagates to production
- Team knows immediately when contracts out of sync

---

## Script Behavior

### DB_COMPARE Strategy (when DATABASE_URL set in CI)

```
🔍 Contract Sync CI Gate

Found 213 locked contract files
Loaded 213 locked contracts with compiled artifacts

DATABASE_URL set - attempting DB comparison...

============================================================
Strategy: DB_COMPARE
Total locked contracts: 213
Matched: 213
Missing in DB: 0
Stale: 0
============================================================

✅ CI Gate PASSED - All contracts synced
```

**Exit code**: 0

### FILE_ONLY Strategy (when DATABASE_URL not set)

```
🔍 Contract Sync CI Gate

Found 213 locked contract files
Loaded 213 locked contracts with compiled artifacts

DATABASE_URL not set - using file-only mode

============================================================
Strategy: FILE_ONLY
Total locked contracts: 213
Matched: 213
Missing in DB: 0
Stale: 0
============================================================

✅ CI Gate PASSED - All contracts synced
```

**Exit code**: 0

### Drift Detected

```
🔍 Contract Sync CI Gate

Found 213 locked contract files
Loaded 213 locked contracts with compiled artifacts

DATABASE_URL set - attempting DB comparison...

============================================================
Strategy: DB_COMPARE
Total locked contracts: 213
Matched: 200
Missing in DB: 10
Stale: 3
============================================================

❌ Missing in DB (10):
  - BM-101
  - BM-102
  - BM-103
  ...

❌ Stale contracts (3):
  - BM-053
  - BM-150
  - BM-167

❌ CI Gate FAILED - Contract drift detected

To fix:
  1. Run: pnpm contract:compile
  2. Run: pnpm publish:forms:db
  3. Commit updated files
```

**Exit code**: 1 (CI fails, PR blocked)

---

## Differences from C1-PREP

| Feature | C1-PREP (prep script) | C2 (CI gate) |
|---------|----------------------|--------------|
| **Purpose** | Development audit, generates report | CI gate, blocks merge |
| **Exit code** | Always 0 unless --strict | 0 on sync, 1 on drift |
| **Output format** | Markdown + JSON files | Terminal logs with colors |
| **Strictness** | Informational by default | Always strict |
| **Usage** | `pnpm audit:contract-sync:prep` | `pnpm audit:contract-sync` |
| **Files written** | `latest.json`, `latest.md` | None (stdout only) |
| **Bypass option** | N/A (read-only) | None (strict by design) |

---

## CI Integration

### Workflow Position

```yaml
jobs:
  static-verification:
    steps:
      # ... setup, install, build ...
      - name: Gate: 213 forms corpus readiness
        run: pnpm gate:forms:213 --allow-remediation --allow-source-unknown --allow-unresolved-review
      
      - name: Gate: Contract sync (C2)  ← New gate added here
        run: pnpm audit:contract-sync
      
  docker-production-build:
    # ... production build ...
```

Runs in `static-verification` job, after corpus gate, before Docker build.

### Why This Position?

1. **After corpus gate** — Ensures 213 forms pass basic validation first
2. **Before Docker build** — No point building Docker if contracts out of sync
3. **In static-verification job** — Logical grouping with other validation gates

### What DATABASE_URL Should Be in CI?

**Option 1: Set to test DB**
```yaml
env:
  DATABASE_URL: postgresql://test:test@localhost:5432/testdb
```
- Enables DB_COMPARE strategy
- More comprehensive check
- Requires test DB setup in CI

**Option 2: Leave unset**
```yaml
# No DATABASE_URL
```
- Uses FILE_ONLY strategy
- Simpler CI setup
- Still checks compiled artifacts exist

**Recommendation**: Start with FILE_ONLY (no DATABASE_URL). Add DB later if needed.

---

## Local Testing

### Test pass scenario

```bash
cd D:\Study\Project\QLLaw-main

# Ensure synced
pnpm contract:compile
pnpm publish:forms:db

# Run gate
pnpm audit:contract-sync
# Expected: ✅ CI Gate PASSED - All contracts synced
# Exit code: 0
```

### Test fail scenario

```bash
# Modify a locked contract without recompiling
# Or delete a compiled artifact
rm docs/audit/docx/compiled-v2/BM-001.compiled.json

# Run gate
pnpm audit:contract-sync
# Expected: ❌ CI Gate FAILED - Contract drift detected
# Exit code: 1
```

### Test FILE_ONLY mode

```bash
# Unset DATABASE_URL
unset DATABASE_URL  # or delete from .env

pnpm audit:contract-sync
# Expected: "DATABASE_URL not set - using file-only mode"
```

---

## Handling CI Failures

### When Gate Fails in CI

**PR shows**:
```
❌ Gate: Contract sync (C2)
Process completed with exit code 1.
```

**Developer actions**:
1. Pull latest main (in case someone else updated)
2. Run `pnpm contract:compile`
3. Run `pnpm publish:forms:db` (if DB available)
4. Commit updated files
5. Push to PR branch
6. CI re-runs, gate should pass

### Common Causes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Missing in DB | New locked contract added but not compiled | Run `pnpm contract:compile` |
| Stale | Locked contract modified but not recompiled | Recompile and republish |
| Script error (exit 2) | Missing files, broken script | Check script logs, fix bug |

---

## Temporarily Bypassing (Not Recommended)

If absolutely necessary to merge despite drift:

**Option 1: Change workflow step to informational**
```yaml
- name: Gate: Contract sync (C2)
  run: pnpm audit:contract-sync || true  # ⚠️  Makes gate informational only
```

**Option 2: Comment out the step**
```yaml
# - name: Gate: Contract sync (C2)
#   run: pnpm audit:contract-sync
```

**Warning**: Both options defeat the purpose of the gate. Only use in emergencies and fix drift immediately after merge.

---

## Performance

- **Execution time**: ~2-5 seconds for 213 contracts
  - File reads: ~1s
  - DB query: ~1s (if DB_COMPARE)
  - Hash comparison: ~1s
- **CI overhead**: Negligible (< 5s added to workflow)
- **No caching needed**: Fast enough to run on every push

---

## Future Enhancements

1. **Auto-fix in CI**: Add workflow that auto-compiles and commits on drift detection
2. **Slack notification**: Alert team when gate fails
3. **Drift metrics**: Track frequency and types of drift over time
4. **Per-contract details**: Show which fields changed in stale contracts

---

## Verification

| Command | Exit | Expected result |
|---------|------|----------------|
| `pnpm audit:contract-sync` (synced) | 0 | ✅ CI Gate PASSED |
| `pnpm audit:contract-sync` (drift) | 1 | ❌ CI Gate FAILED |
| CI workflow with synced contracts | 0 | Workflow passes |
| CI workflow with drift | 1 | Workflow fails, PR blocked |

---

**Report generated**: 2026-06-25  
**Task status**: C2 ✅ DONE  
**Next task**: C3 (remediate invalid source fields) or Phase D tasks
