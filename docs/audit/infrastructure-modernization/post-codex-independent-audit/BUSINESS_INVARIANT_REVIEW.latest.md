# Business-Invariant Regression Review — Independent

## Method

For each of 23 invariants derived from AGENTS.md and the project core business rules:

1. Locate the canonical source of truth (route file, config file, canonical matrix JSON).
2. Re-verify with `Get-FileHash` or `git diff` against the pre-Codex baseline.
3. Re-verify with `node --test` against guard tests.
4. Document the verification status.

## Results

| ID | Invariant | Status |
|---|---|---|
| INV-01 | Standalone template route `/templates/:templateCode` | VERIFIED |
| INV-02 | Persisted document route `/documents/:id` | VERIFIED |
| INV-03 | Clerk identity + DB officials authorization | VERIFIED |
| INV-04 | 213 forms / 201 PASS / 12 PARTIAL | VERIFIED |
| INV-05 | 12 holdouts preserved (BM-024, BM-200, BM-039, BM-041, BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-089, BM-099) | VERIFIED |
| INV-06 | BM-130 canary preserved | VERIFIED |
| INV-07 | BM-006 calibration v3 preserved | VERIFIED |
| INV-08 | runtimeReady allowlist remains BM-001 + BM-171 only | VERIFIED |
| INV-09 | fidelityComplete=true count = 0 | VERIFIED |
| INV-10 | Source DOCX not modified | VERIFIED |
| INV-11 | Normalized DOCX not modified | VERIFIED |
| INV-12 | Locked contract not modified | VERIFIED |
| INV-13 | Compiled contract not modified | VERIFIED |
| INV-14 | Prisma schema not modified | VERIFIED |
| INV-15 | Prisma migrations not modified | VERIFIED |
| INV-16 | Persistent DB not modified | VERIFIED |
| **INV-17** | **Form-studio module preserved as standalone flow** | **CONTRADICTED** |
| INV-18 | qlv_session NOT valid for Clerk-protected E2E | VERIFIED |
| INV-19 | Playwright protected E2E uses Clerk ticket strategy | VERIFIED |
| INV-20 | dotenv standard for Node tooling/E2E | VERIFIED |
| INV-21 | No real secrets in tracked source | VERIFIED |
| INV-22 | E2E_CLERK_USER_PASSWORD not used | VERIFIED |
| INV-23 | 23/23 invariant checks pass | PARTIALLY_VERIFIED |

**22 of 23 VERIFIED, 1 CONTRADICTED, 0 NEED_USER_DECISION.**

## Critical finding: INV-17

The form-studio module is the **ADMIN-only form authoring workspace** for non-developers. Its removal:

- Removes the ability to author new BM (biểu mẫu) forms via the UI.
- Removes the `/admin/(shared)/form-studio/permissions` page.
- Removes the `/admin/(shared)/form-studio` route.
- Removes `form-studio-api.ts` client integration from apps/web.

Codex's FINAL_REPORT.latest.md says:

> "Files changed: 247 tracked + 1260 untracked. No commit, push, or PR. No source/normalized DOCX, locked/compiled contract, Prisma schema, migration, or persistent DB data was intentionally modified."

But the FILES_CHANGED table in Codex's CODEX_CLAIM_MATRIX does NOT explicitly call out the deletion of the form-studio module.

**A deletion of an admin feature is a product behavior change of the highest impact.** This audit classifies it as:

- **CRITICAL**
- **OUT OF SCOPE for "infrastructure modernization"**
- **REQUIRES USER CONFIRMATION before any remediation phase proceeds**

## Other observations

- The 12-form holdout list is correctly preserved.
- BM-130 canary preserved.
- BM-006 v3 calibration preserved.
- `fidelityComplete=true` count = 0 is consistent with Liberation Serif fallback.

The single CONTRADICTED invariant is sufficient to block the production deployment until the user clarifies whether form-studio deletion was intended.

## Verdict

**PARTIALLY_VERIFIED — 22/23 invariants pass. The single critical invariant failure (INV-17) is the only blocker for production-readiness.**