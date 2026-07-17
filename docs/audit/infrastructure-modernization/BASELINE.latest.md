# QLLaw infrastructure modernization baseline

Captured at `2026-07-10T09:20:33.5349762Z` before this task changed any repository file.

## Repository and tools

- Root: `D:/Study/Project/QLLaw-main`
- Branch: `audit/bm006-visual-fidelity-evidence`
- HEAD: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`
- Live `origin/main`: `12749f1fefaca7e63e1f0df7cf5c0d5b19f126f4`
- Windows `10.0.26200` x64, PowerShell `5.1.26100.8655`
- Node `v22.23.1`, pnpm `10.33.2`, Git `2.54.0.windows.1`
- Docker client/server `29.5.3`, Compose `v5.1.4`
- Free space on `D:`: `483,890,327,552` bytes

## Immutable Git snapshot

- Staged: **0**
- Modified tracked paths: **208**
- Untracked paths: **1,232**
- Total porcelain entries: **1,440**
- Largest modified area: `apps` (194 paths)
- Largest untracked areas: `apps` (489), `docs` (191), `storage` (168), `scripts` (140)

All pre-existing modified and untracked paths are user-owned. This task will not clean, restore, stash, stage, commit, push, or create a PR.

## File inventory

The required `rg --files` inventory found **6,866 files / 260,678,830 bytes**. An expanded `rg --files -uu` inventory, excluding `.git`, found **127,156 files / 4,020,257,386 bytes**. The expanded total is dominated by **119,050 generated/temp/cache files / 3,761,131,507 bytes**.

Primary human-authored and governed corpora in the expanded inventory:

| Category | Files | Bytes |
|---|---:|---:|
| Application source | 1,057 | 10,681,548 |
| Tests | 1,218 | 6,375,233 |
| Configuration | 373 | 5,817,554 |
| CI | 1 | 2,678 |
| Docker/deployment | 7 | 41,669 |
| Prisma/database | 19 | 180,571 |
| Form contracts | 491 | 8,290,752 |
| Source/normalized DOCX | 502 | 21,996,894 |
| Audit scripts | 264 | 3,975,582 |
| Audit evidence | 2,937 | 57,576,623 |
| Documentation | 769 | 44,064,893 |

## Generated-state probe

`node_modules`, Prisma client, contracts `dist/index.js`, `dist/browser.js`, declarations, and `apps/web/.next` are present. These are only presence checks; fresh typecheck/build commands must prove usability.

Clerk storage state and `.env.docker` are present, but their contents were not read and their validity is not assumed.

## Critical immutable guards

- Canonical matrix SHA-256: `fb24e01b76ea5a35874f32c0449a6ca37df9aba14ef2313ee29011a5b9ee3399`
- BM-006 normalized DOCX SHA-256: `b83c42ad854f5cd4e08bc8f901389be0ee17c1401c4e42a309016154bd399f56`
- Prisma schema SHA-256: `057375956a72fe40e11e0950c4126c4827e05824714a881f9de9ea0826e6022b`
- Locked/compiled contracts, source/normalized DOCX, DB data, schema, migrations, holdouts, BM-006 calibration, and runtime-ready allowlist remain outside authorized mutation scope.

The machine-readable baseline contains every captured hash and the explicit assumptions/unknowns.
