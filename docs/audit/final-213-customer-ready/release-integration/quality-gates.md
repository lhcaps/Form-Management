# Quality Gates Report

Executed at: 2026-07-27T15:11:10.835086Z
Total gates: 10
PASS: 9
PASS_WITH_KNOWN_FAILURES: 1
FAIL: 0

## Gates

| ID | Command | Status | Exit | Passed | Failed |
|----|---------|--------|------|--------|--------|
| QG-001 | `pnpm audit --json` | PASS | 0 | Critical=0, High=0 | Critical=0, High=0 (merge gate) |
| QG-002 | `pnpm audit:hardcode` | PASS | 0 | All runtime hardcodes clean | 0 |
| QG-003 | `pnpm audit:locked-compiled` | PASS | 0 | 213/213 consistent | 0 |
| QG-004 | `pnpm audit:contract-sync` | PASS | 0 | Matched: 213, Missing in DB: 0, Stale: 0 | 0 |
| QG-005 | `pnpm audit:encoding` | PASS | 0 | 4 BOM files stripped, no BOM remaining | 0 |
| QG-006 | `pnpm test:contracts` | PASS_WITH_KNOWN_FAILURES | 1 | 184 | 3 |
| QG-007 | `node scripts/release/audit-repository-hygiene.mjs` | PASS | 0 | no tracked auth state; no .env; no tracked preview sessions; canonical DOCX intact | 0 |
| QG-008 | `python scripts/release/audit-secret-scan.py` | PASS | 0 | trackedSecrets=0, authStateTracked=0, customerDataTracked=0 | 0 |
| QG-009 | `pnpm audit:locked-compiled (corpus count)` | PASS | 0 | Locked: 213/213, Compiled: 213/213 | 0 |
| QG-010 | `node --test test/release-repository-hygiene.spec.mjs` | PASS | 0 | hygiene guard spec | 0 |

## Notes

- **QG-001** (security): Applied targeted pnpm.overrides for shell-quote (1.9.0),
  postcss (8.5.18), brace-expansion (5.0.8), form-data (4.0.6), and next (16.2.11).
  Critical and High advisories eliminated. 4 moderate remain (dev-only transitive).
- **QG-006** (form-contracts tests): 3 pre-existing failures confirmed unrelated to
  dependency overrides via git stash comparison.
- Customer-local runtime stack not started in this audit environment (Docker not
  invoked). Stack-ready evidence will be captured during clean-clone rehearsal
  (Phase 20) using scripts/local/start.ps1.
