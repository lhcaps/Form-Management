# Developer verification commands

The repository exposes a small command surface while retaining the existing
focused scripts underneath it.

| Command | Purpose |
| --- | --- |
| `pnpm verify:quick` | Typecheck, runtime-hardcode audit, and infrastructure guard tests. |
| `pnpm verify:full` | Refresh deterministic slot inventory, then run quick checks, lint, all unit tests, build, locked/compiled, contract-sync, and encoding gates. |
| `pnpm verify:ci` | Full verification plus template audit, BM-001 renderer smoke, locked-report refresh, the documented 213-form gate, and read-only evidence consistency check. It explicitly acknowledges only `BM-006:EXTRACTION_HASH_MISMATCH`, the user-approved BM-006 KEEP debt; any other blocker or a stale allowlist entry still fails CI. |
| `pnpm dev:doctor` | Read-only local diagnostic; sensitive prerequisites are shown as SET/UNSET only. |
| `pnpm docker:verify` | Docker/Compose static checks; add `-- --build` to build and probe both images. |

`dev:doctor` reports Node/pnpm/Docker versions, ports 3000/3001, database TCP
reachability, env presence, form-contract build output, Prisma client, writable
storage, LibreOffice, Times New Roman, and Clerk E2E storage-state presence. It
does not print connection strings, keys, cookies, tokens, or passwords.

## Windows, WSL, and containers

- Run project commands from PowerShell at the repository root. Node and pnpm are
  pinned to major 22 and pnpm 10.33.2 for CI/Docker consistency.
- `pnpm db:up` exposes the development database on its configured host port;
  production Compose deliberately does not expose MariaDB.
- Windows LibreOffice is normally under `C:\Program Files\LibreOffice`; the API
  image uses `/usr/bin/libreoffice` through the isolated wrapper.
- WSL path permissions and UID/GID differ from Windows ACLs. Ensure bind-mounted
  `storage/` and `logs/` are writable by UID/GID 1000 before production smoke.
- Times New Roman is normally present on Windows but is not bundled in Debian.
  Do not download proprietary fonts from a build script; use an approved licensed
  mount or package only after an explicit decision.
- A Clerk protected browser run requires the real ticket/storageState strategy.
  Missing `playwright/.clerk/admin.json` is NEED_USER_DECISION, never a reason to
  create a fake cookie or mark browser evidence PASS.

CI uses `CI=true`, bounded job timeouts, one concurrency group per branch/PR, and
uploads the command log plus deterministic audit reports even on failure. Docker
verification is a separate job because it has different caching and failure
characteristics.

The current blank-database migration conflict is an external gate for Docker boot
and readiness. Static checks and image probes can pass while boot remains blocked;
the two results must not be conflated.
