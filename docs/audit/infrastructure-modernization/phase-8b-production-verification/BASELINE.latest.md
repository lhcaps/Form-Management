# Phase 8B — Stage 1 — Isolated Environment Snapshot

**Run ID**: `phase8b-20260711-0100`
**Captured**: 2026-07-11T01:00 (UTC+7)
**Repo root**: `D:/Study/Project/QLLaw-main`

## Repository

- **Branch**: `audit/bm006-visual-fidelity-evidence`
- **HEAD**: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`
- **Staged files**: **0**
- **Modified files (working tree)**: **215**
- **Deleted files (working tree)**: **32**
- **Untracked files**: **1501**

The working tree contains the pre-Phase 8B accumulation documented by Phase 8A. Phase 8B does NOT touch the protected areas: source DOCX, normalized DOCX, locked contracts, compiled contracts, Prisma schema, existing migration files, persistent DB data, canonical status matrix, 12 PARTIAL holdouts, BM-006, BM-130, runtimeReady allowlist, form-studio retirement state, or any `bm-XXX-form-inputs.tsx`. `fidelityComplete=true` remains zero.

## Host

- **OS**: Windows 11 Pro 10.0.26200 (x64)
- **Shell**: PowerShell 5.1.26100 + cmd.exe
- **Node**: v22.23.1
- **pnpm**: 10.33.2
- **npm**: 11.12.1

## Docker

- **Docker version**: 29.5.3, build d1c06ef
- **Compose version**: v5.1.4

### Running containers at baseline

| Name | Image | State | Notes |
|---|---|---|---|
| `quanlyvks-mariadb` | `mariadb:11` | Up 9h (healthy), port `3307→3306` | Persistent user DB. Phase 8B will NOT touch this. |
| `hotpot-mysql` | `mysql:8` | Exited 3d ago, port `3308→3306` | Unrelated project (stopped). |
| `hotpot-redis` | `redis:7` | Exited 3d ago, port `6379→6379` | Unrelated project (stopped). |

### QLLaw-relevant images at baseline

| Repository | Tag | Size |
|---|---|---|
| `quanlyvks-api` | `latest` | 2.52 GB |
| `quanlyvks-web` | `latest` | 1.76 GB |
| `qllaw-infra-api` | `20260710` | 2.52 GB |
| `qllaw-infra-web` | `20260710` | 1.76 GB |
| `qllaw-infra-baseline-api` | `latest` | 2.70 GB |
| `qllaw-infra-baseline-web` | `latest` | 1.76 GB |
| `mariadb` | `11` | 458 MB |

These are pre-existing images from prior phases. Phase 8B will build fresh images with a unique tag suffix `phase8b-20260711-0100` and will NOT consume any of the prior images as production runtime inputs.

## Disk

- D: free: **~450 GB** — ample for parallel Phase 8B builds + disposable DB + log capture.

## Port plan

Phase 8B will **NOT** bind to 3000, 3001, 3306, or 3307 on the host.

- **API**: dynamic / unexposed. Internally `3001`.
- **Web**: dynamic / unexposed. Internally `3000`.
- **MariaDB**: internal `3306`. Not exposed to host. Disposable volume per Stage.

Verification will use `docker exec` for API/Web readiness probes and `docker exec mariadb /usr/bin/mysql` for DB probes. No host port collision with `quanlyvks-mariadb`.

## Isolated-resource naming convention

Every Docker resource Phase 8B creates carries the run ID `phase8b-20260711-0100`:

- Project name: `phase8b-20260711-0100`
- Container prefix: `phase8b-20260711-0100-`
- Network: `phase8b-20260711-0100-net`
- Volume prefix: `phase8b-20260711-0100-`
- Image tag suffix: `phase8b-20260711-0100`

Cleanup in `finally` for every stage.

## Git policy

`NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR`. The pre-Phase 8B baseline shows 0 staged files. This number will be re-verified at the start and end of every stage.

## Outputs created in Stage 1

- `PHASE8A_CLOSEOUT_CORRECTIONS.latest.json`
- `PHASE8A_CLOSEOUT_CORRECTIONS.latest.md`
- `BASELINE.latest.json`
- `BASELINE.latest.md` (this file)