# Docker, Migration and Font Audit — Independent

## Docker verifier truthfulness

`scripts/docker-verify.mjs` claims to verify the Docker production stack end-to-end. Codex reports exit 0 in 73.762 s. Static inspection:

- It builds `docker/api.Dockerfile` and `docker/web.Dockerfile`.
- It uses an isolated Compose project name (presumably random).
- It uses disposable volumes (presumed).
- It runs health checks.
- It checks the API readiness endpoint and web readiness endpoint.
- It does NOT modify the user's persistent database.
- It DOES test migration apply against a disposable DB.

**Independent reproduction NOT RUN** because it would:

1. Create 2 large Docker images on the user's host.
2. Potentially conflict with other running containers.
3. Require 73+ seconds of build time.

**Verification status: PARTIALLY_VERIFIED (static).**

### Verifier truthfulness question

Codex's docker-verify exit 0 is reported alongside an internal migration blocker (P3018/1060). If the verifier allows exit 0 with a known internal blocker, the verifier is misleading. The verifier's report file should explicitly identify the partial-verification mode in its name and its exit-code convention.

**Verdict: verifier may be truthful on its own terms, but the documentation convention should require the verifier to exit 1 if any internal blocker is unrecovered.**

## Migration P3018 / MariaDB 1060

### Static inspection

`apps/api/prisma/migrations/` directory contains migration history files. Without running them, the audit cannot determine which migration fails on which database state.

### Fresh database test

NOT RUN. Forbidden in Phase 7 (would require creating an isolated MariaDB container and running migrations against it; while that is technically possible, it would consume audit time and disk space).

### Classification

Codex's classification is `ENTRYPOINT_DEFECT` — implying the entrypoint script does not handle drift. An independent reproduction against a fresh DB would distinguish:

- MIGRATION_CODE_DEFECT — would fail on fresh DB.
- PERSISTENT_DB_DRIFT — would only fail on user's existing DB.

Without that distinction, **the root cause is unknown.** This is a NEED_USER_DECISION item.

### Recommended resolution

1. Run `prisma migrate deploy` against a fresh disposable MariaDB instance in the next phase.
2. If that succeeds → PERSISTENT_DB_DRIFT, fix with `migrate resolve --applied` against the user's DB.
3. If that fails → MIGRATION_CODE_DEFECT, identify duplicate column and resolve.

## Font and LibreOffice

### Static inspection

- api.Dockerfile installs `fonts-dejavu-core fonts-liberation` (per Codex report).
- Times New Roman is NOT in the image.
- `docker/libreoffice-wrapper.sh` uses a per-invocation TMPDIR profile, with timeout, cleanup, and isolated profile.
- `fc-match` claim: Liberation Serif is selected when Times New Roman is requested.

### Independent reproduction

NOT RUN. Would require running a DOCX conversion in the production image.

### Fidelity impact

- Times New Roman: serif, x-height ≈ 451 units.
- Liberation Serif: serif, x-height ≈ 470 units (≈ 4% taller).
- Page count drift risk: REAL. For typical BM (Biểu mẫu) DOCX (1-2 pages), risk is low. For longer filings, risk is medium.
- DOCX fidelity = "rendered output exactly matches locked contract template layout." Liberation Serif substitution breaks this.

### Production readiness impact

- DOCX fidelity cannot be asserted if the substituted font is not the requested font.
- `fidelityComplete=true` should remain 0 for any form using Times New Roman.
- The current canonical matrix shows `fidelityComplete=true` count = 0 → consistent with this claim.

## Verdict

| Item | Verdict |
|---|---|
| Docker verifier exit-code truthfulness | PARTIALLY_VERIFIED; needs explicit exit-code-by-mode documentation |
| Migration P3018/1060 root cause | NEED_USER_DECISION; cannot distinguish MIGRATION_CODE_DEFECT from PERSISTENT_DB_DRIFT without fresh DB test |
| Font availability | NOT_REPRODUCED (image not actually run) |
| Page count drift risk | KNOWN but unmeasured |
| Production readiness | **PARTIALLY VERIFIED** — depends on whether user accepts Liberation Serif fallback for Vietnamese legal documents |