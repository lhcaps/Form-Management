# Runtime Contract Stack Probe

Generated: 2026-06-27T16:22:31.375Z

## Summary

| Check | Result | Evidence |
|-------|--------|----------|
| Docker daemon | PASS | Docker daemon reachable. |
| Dev compose config | PASS | docker compose config --quiet |
| Prod compose config | PASS | docker compose config --quiet |
| DB TCP 127.0.0.1:3307 | PASS | TCP connection succeeded. |
| Prisma migrate status | PASS | Prisma migrate status completed. |
| Contract sync | PASS | Strategy=DB_COMPARE, matched=213, stale=0. |
| Publish forms DB plan | PASS | Publish plan generated successfully. |

## Database URL Evidence

| Source | Present | Target |
|--------|---------|--------|
| process.env.DATABASE_URL | NO | - |
| .env DATABASE_URL | YES | mysql://127.0.0.1:3307/quanlyvks |

## Command Results

### docker version

- Command: `docker version`
- Exit: 0
- Timed out: NO

```text
Client:
 Version:           29.5.3
 API version:       1.54
 Go version:        go1.26.4
 Git commit:        d1c06ef
 Built:             Wed Jun  3 18:03:06 2026
 OS/Arch:           windows/amd64
 Context:           desktop-linux

Server: Docker Desktop 4.78.0 (229452)
 Engine:
  Version:          29.5.3
  API version:      1.54 (minimum version 1.40)
  Go version:       go1.26.4
  Git commit:       285b471
  Built:            Wed Jun  3 17:59:56 2026
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          v2.2.4
  GitCommit:        193637f7ee8ae5f5aa5248f49e7baa3e6164966e
 runc:
  Version:          1.3.5
  GitCommit:        v1.3.5-0-g488fc13e
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

### docker context ls

- Command: `docker context ls`
- Exit: 0
- Timed out: NO

```text
NAME              DESCRIPTION                               DOCKER ENDPOINT                             ERROR
default           Current DOCKER_HOST based configuration   npipe:////./pipe/docker_engine              
desktop-linux *   Docker Desktop                            npipe:////./pipe/dockerDesktopLinuxEngine
```

### dev compose config

- Command: `docker compose -f infra\docker-compose.dev.yml config --quiet`
- Exit: 0
- Timed out: NO

### prod compose config

- Command: `docker compose --env-file .env.docker.example -f docker-compose.prod.yml config --quiet`
- Exit: 0
- Timed out: NO

### prisma migrate status

- Command: `node --env-file=.env apps\api\node_modules\prisma\build\index.js migrate status --schema apps\api\prisma\schema.prisma`
- Exit: 0
- Timed out: NO

```text
Prisma schema loaded from apps\api\prisma\schema.prisma
Datasource "db": MySQL database "quanlyvks" at "127.0.0.1:3307"

10 migrations found in prisma/migrations

Database schema is up to date!
```

```text
Environment variables loaded from .env
```

### contract sync gate

- Command: `node scripts\audit\audit-contract-sync.mjs`
- Exit: 0
- Timed out: NO

```text
[36m
🔍 Contract Sync CI Gate
[0m
[0mFound 213 locked contract files[0m
[0mLoaded 213 locked contracts with compiled artifacts
[0m
[0mDATABASE_URL resolved from .env - attempting DB comparison...[0m
[0m
============================================================[0m
[0mStrategy: DB_COMPARE[0m
[0mTotal locked contracts: 213[0m
[32mMatched: 213[0m
[32mMissing in DB: 0[0m
[32mStale: 0[0m
[0m============================================================
[0m
[32m
✅ CI Gate PASSED - All contracts synced
[0m
```

### forms DB publish plan

- Command: `set OFFICIAL_ID=1&& set AGENCY_ID=&& node apps\api\node_modules\tsx\dist\cli.mjs scripts\docx-contract\publish-locked-contracts-to-db.mjs --plan`
- Exit: 0
- Timed out: NO

```text
=== Phase D: Publish Locked Contracts to DB ===

Hash mode: stable-semantic-v1

Locked contracts found: 213
  Ready to publish: 213
  Skipped (generic/non-human): 0

Plan written: D:\Study\Project\QLLaw-main\scripts\docx-contract\phase-d-publish-plan.txt
Report written: D:\Study\Project\QLLaw-main\docs\audit\docx\reports\FORM-CONTRACT-DB-PUBLISH.md
```

