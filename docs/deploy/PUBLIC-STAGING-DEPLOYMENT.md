# QUANLYVKS Public Staging Deployment Guide

> **Status**: Public staging deployment ready for manual testing.
> **Do not claim**: "Production ready" until full regression + manual smoke pass.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (Next.js 16)                                   │
│  https://<vercel-domain>.vercel.app                     │
│  Serves static frontend, proxies nothing by default     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS (browser)
                     │ Cookie: SameSite=None; Secure
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Backend Host (Node.js 22 LTS / Docker / Render)       │
│  https://<api-domain>                                   │
│  NestJS API + Prisma ORM + DOCX renderer               │
│  Port 3001                                            │
└────────────────────┬────────────────────────────────────┘
                     │ MySQL protocol
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Cloud MySQL (MariaDB 11)                              │
│  Staging DB — persistent disk                          │
│  DB: quanlyvks                                         │
└─────────────────────────────────────────────────────────┘
```

### What goes where

| Component | Host | Notes |
|---|---|---|
| Frontend (Next.js) | Vercel | Static build, reads `NEXT_PUBLIC_API_BASE_URL` |
| Backend (NestJS) | Render/Railway/VPS/Docker | Node host with persistent disk |
| Templates (DOCX) | Backend host disk | Read at render time |
| Generated files | Backend host disk | `/app/storage/generated` |
| Database | Cloud MySQL (PlanetScale, Railway, etc.) | UTF8MB4 |

---

## Prerequisites

- [Vercel](https://vercel.com) account connected to the GitHub repo
- Backend host with:
  - Node.js 22 LTS
  - Docker (optional, see Option A) OR native pnpm 10
  - 2 GB RAM minimum
  - Persistent disk for storage (generated DOCX/PDF files)
- Cloud MySQL database (MariaDB 11 or MySQL 8):
  - `utf8mb4` charset
  - `utf8mb4_unicode_ci` collation
  - `MAX_ALLOWED_PACKET=256M`
- GitHub repo access

---

## Phase 1: Cloud MySQL Staging Setup

### 1.1 Create a cloud MySQL database

Recommended providers:

- **Railway** — MySQL plugin, ~$5/month, easiest
- **PlanetScale** — Free tier available, serverless MySQL
- **Neon** — MySQL-compatible, free tier
- **DigitalOcean Managed MySQL** — $15/month droplet

Required settings:

```sql
-- Character set (required — schema uses multi-byte Vietnamese text)
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci
-- Max packet for DOCX storage (required — generated_documents stores DOCX bytes)
MAX_ALLOWED_PACKET=256M
```

### 1.2 Get connection string

Format:

```
mysql://<user>:<password>@<host>:<port>/<database>?connection_limit=10
```

Example (Railway):

```
mysql://root:xxxxxxxxxxxx@xxx.sql.railway.technology:5432/railway?connection_limit=10
```

### 1.3 Verify connectivity from your local machine

```bash
mysql -h <host> -P <port> -u <user> -p<password> <database> -e "SELECT 1"
```

---

## Phase 2: Backend Deployment

Choose one option.

### Option A — Docker (Recommended)

**Best for**: VPS, Render, Railway with Docker support, any host with Docker.

#### 2A.1 Prepare the `.env.docker` file

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker`:

```env
# ─── MySQL ───────────────────────────────────────────
MYSQL_ROOT_PASSWORD=<strong-password>
MYSQL_DATABASE=quanlyvks
MYSQL_USER=quanlyvks_staging
MYSQL_PASSWORD=<strong-password>

# ─── Backend URL (your actual backend host) ──────────
# Set this to the final public URL where your backend will be accessible
API_BASE_URL=https://your-backend-host.com

# ─── Frontend URL (Vercel domain — for CORS + cookie) ─
WEB_ORIGIN=https://your-app.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://your-backend-host.com/api/v1
TUNNEL_TEST=false

# ─── Cookie (cross-origin from Vercel → backend) ────
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=none
AUTH_SESSION_TTL_DAYS=14
AUTH_SESSION_COOKIE_NAME=qlv_session

# ─── CORS (comma-separated) ───────────────────────────
# Must include the Vercel frontend domain
API_CORS_ORIGIN=https://your-app.vercel.app

# Clerk secrets (store real values in deployment secrets, not git)
CLERK_SECRET_KEY=<set-in-secret-store>
CLERK_WEBHOOK_SECRET=<set-in-secret-store>

# ─── Storage ─────────────────────────────────────────
STORAGE_ROOT=/app/storage
GENERATED_FILES_ROOT=/app/storage/generated
NORMALIZED_DOCX_ROOT=/app/storage/templates/normalized-docx

# ─── PDF (LibreOffice installed in container) ─────────
LIBREOFFICE_PATH=/usr/bin/libreoffice

# ─── Renderer ────────────────────────────────────────
# Keep "off" for staging (no contract rendering hot-path)
DOCUMENT_RENDERER_MODE=off

# ─── Seed admin ──────────────────────────────────────
# Change these before deploying! Default passwords are blocked in production.
SEED_ADMIN_FULL_NAME=Admin
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=<set-in-secret-store>
SEED_ADMIN_POSITION=Quan tri he thong
```

#### 2A.2 Build and run

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start all services (MySQL + API)
docker compose -f docker-compose.prod.yml up -d

# Verify API is running
curl https://your-backend-host.com/api/v1/health
```

#### 2A.3 Backend host with existing MySQL (Docker API only)

If MySQL is managed externally (Railway, PlanetScale, etc.), deploy just the API container:

```bash
# Set environment
export DATABASE_URL="mysql://user:pass@host:port/db?connection_limit=10"
export WEB_ORIGIN="https://your-app.vercel.app"
export API_CORS_ORIGIN="https://your-app.vercel.app"
export AUTH_COOKIE_SECURE="true"
export AUTH_COOKIE_SAMESITE="none"
export STORAGE_ROOT="/app/storage"
export GENERATED_FILES_ROOT="/app/storage/generated"
export NORMALIZED_DOCX_ROOT="/app/storage/templates/normalized-docx"
export NODE_ENV="production"
export PORT="3001"

# Run the API container
docker run -d \
  --name quanlyvks-api \
  -p 3001:3001 \
  -v ./storage:/app/storage \
  -e DATABASE_URL \
  -e WEB_ORIGIN \
  -e API_CORS_ORIGIN \
  -e AUTH_COOKIE_SECURE \
  -e AUTH_COOKIE_SAMESITE \
  -e STORAGE_ROOT \
  -e GENERATED_FILES_ROOT \
  -e NORMALIZED_DOCX_ROOT \
  -e NODE_ENV \
  -e PORT \
  -e LIBREOFFICE_PATH="/usr/bin/libreoffice" \
  ghcr.io/<your-org>/quanlyvks-api:latest
```

### Option B — Render / Railway (Native Node)

**Best for**: Render, Railway, Coolify, or any PaaS that runs Node directly.

#### Build Command

```bash
pnpm install --frozen-lockfile
pnpm --filter @qllaw/form-contracts build
pnpm --filter api prisma generate
pnpm --filter api build
```

#### Start Command

```bash
pnpm --filter api start:prod
```

#### Required Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Required — enables production safety checks |
| `DATABASE_URL` | `mysql://...` | Cloud MySQL connection string |
| `WEB_ORIGIN` | `https://your-app.vercel.app` | Vercel frontend URL |
| `API_CORS_ORIGIN` | `https://your-app.vercel.app` | Allow CORS from this origin |
| `AUTH_COOKIE_SECURE` | `true` | Required in production |
| `AUTH_COOKIE_SAMESITE` | `none` | Required for cross-origin cookie from Vercel |
| `AUTH_SESSION_TTL_DAYS` | `14` | Session lifetime |
| `AUTH_SESSION_COOKIE_NAME` | `qlv_session` | Cookie name |
| `STORAGE_ROOT` | `/app/storage` | Persistent volume path |
| `GENERATED_FILES_ROOT` | `/app/storage/generated` | Where DOCX/PDF files are written |
| `NORMALIZED_DOCX_ROOT` | `/app/storage/templates/normalized-docx` | Template files |
| `LIBREOFFICE_PATH` | `/usr/bin/libreoffice` | For PDF export |
| `DOCUMENT_RENDERER_MODE` | `off` | Keep off for staging |
| `PORT` | `3001` | Port the server listens on |

> **Storage**: The backend needs a persistent volume mounted at `/app/storage` for generated DOCX/PDF files. Without it, generated files will be lost on restart.

### Option C — VPS / Self-hosted (systemd)

```bash
# Install Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@10

# Clone and build
git clone <repo-url>
cd QLLaw-main
pnpm install --frozen-lockfile
pnpm --filter @qllaw/form-contracts build
pnpm --filter api prisma generate
pnpm --filter api build

# Create storage directory
mkdir -p /opt/qlvks/storage/{templates/normalized-docx,generated}

# Create systemd service
sudo tee /etc/systemd/system/qlvks-api.service <<EOF
[Unit]
Description=QUANLYVKS API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/qlvks
ExecStart=/usr/local/bin/node apps/api/dist/src/main.js
Restart=always
Environment=NODE_ENV=production
Environment=DATABASE_URL=mysql://user:pass@host:3306/qlvks
Environment=WEB_ORIGIN=https://your-app.vercel.app
Environment=API_CORS_ORIGIN=https://your-app.vercel.app
Environment=AUTH_COOKIE_SECURE=true
Environment=AUTH_COOKIE_SAMESITE=none
Environment=PORT=3001
Environment=STORAGE_ROOT=/opt/qlvks/storage
Environment=GENERATED_FILES_ROOT=/opt/qlvks/storage/generated
Environment=NORMALIZED_DOCX_ROOT=/opt/qlvks/storage/templates/normalized-docx

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable qlvks-api
sudo systemctl start qlvks-api
```

---

## Phase 3: Database Setup

Run these commands **after** the backend is deployed and reachable:

```bash
# Navigate to repo root
cd QLLaw-main

# 1. Run Prisma migrations
pnpm --filter api prisma migrate deploy

# 2. Seed base data (agency, admin account, offenses, wards, templates)
pnpm --filter api seed

# 3. Publish all 213 forms to database
node scripts/docx-contract/publish-locked-contracts-to-db.mjs

# 4. Migrate compiled contracts to schema v2.0
node scripts/docx-contract/migrate-compiled-json-to-v2.mjs
```

For **PowerShell**:

```powershell
$env:DATABASE_URL="mysql://user:pass@host:port/qlvks"
pnpm --filter api prisma migrate deploy
pnpm --filter api seed
node scripts/docx-contract/publish-locked-contracts-to-db.mjs
node scripts/docx-contract/migrate-compiled-json-to-v2.mjs
```

### Verify DB Setup

```bash
# Using the smoke test against the live API
$env:API_URL="https://your-backend-host.com"
node scripts/smoke-forms-runtime-213.mjs
```

Expected output:

```
Passed: 213/213
Failed: 0/213
[OK] All 213 forms returned valid CompiledFormContract (schemaVersion "2.0",
      uiSchema.sections, renderPlan.bindings, zero generic paths).
```

---

## Phase 4: Vercel Frontend Deploy

### 4.1 Create Vercel project

1. Go to [vercel.com](https://vercel.com) → "Add New" → "Project"
2. Import the GitHub repo
3. **Root Directory**: `.` (repo root — NOT `apps/web`)
4. **Framework Preset**: Next.js
5. **Build Command**: leave empty (use `vercel.json`)
6. **Output Directory**: leave empty (use `vercel.json`)

### 4.2 Set environment variables

In Vercel project settings → Environment Variables:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-backend-host.com/api/v1` | Production, Preview, Development |

> **Important**: `NEXT_PUBLIC_API_BASE_URL` must be set. Without it, the frontend will fall back to `http://localhost:3001/api/v1` and API calls will fail.

Do NOT set `DATABASE_URL` on Vercel.

### 4.3 Deploy

Click "Deploy". The `vercel.json` at repo root provides:

```json
{
  "rootDirectory": "apps/web",
  "buildCommand": "pnpm --filter @qllaw/form-contracts build && pnpm --filter web build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

Vercel will:
1. `pnpm install --frozen-lockfile`
2. Build `@qllaw/form-contracts`
3. Build `apps/web` (Next.js)
4. Deploy static output

### 4.4 Verify deploy

```bash
curl https://your-app.vercel.app/api/v1/auth/me
# Should return 401 (not 404, not localhost)
```

---

## Phase 5: Smoke Tests

### 5.1 API smoke

```bash
# Health check
curl https://your-backend-host.com/api/v1/health

# Runtime smoke — 213 forms
$env:API_URL="https://your-backend-host.com"
node scripts/smoke-forms-runtime-213.mjs
```

### 5.2 Web smoke (manual)

1. Open `https://your-app.vercel.app`
2. Login: `tester` / `tester123`
3. Navigate to "Biểu mẫu đã tạo" or "Hồ sơ vụ án"
4. Test 10 representative forms:
   - BM-001, BM-052, BM-067, BM-085, BM-141
   - BM-168, BM-173, BM-185, BM-200, BM-213
5. For each form:
   - Open the form UI
   - Enter valid data
   - Save
   - Reload — data must persist
   - Open "Tệp đã xuất" tab
   - Generate DOCX
   - Download and open in Word/WPS
   - Verify no `{{placeholder}}` text remains

### 5.3 Manual smoke report

See `docs/audit/manual-smoke/public-staging-10-form-smoke.md` for the report template.

---

## Required Environment Variables Summary

### Backend (Node host)

```env
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:port/qlvks?connection_limit=10
WEB_ORIGIN=https://your-app.vercel.app
API_CORS_ORIGIN=https://your-app.vercel.app
TUNNEL_TEST=false
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=none
AUTH_SESSION_TTL_DAYS=14
AUTH_SESSION_COOKIE_NAME=qlv_session
CLERK_SECRET_KEY=<set-in-secret-store>
CLERK_WEBHOOK_SECRET=<set-in-secret-store>
PORT=3001
STORAGE_ROOT=/app/storage
GENERATED_FILES_ROOT=/app/storage/generated
NORMALIZED_DOCX_ROOT=/app/storage/templates/normalized-docx
LIBREOFFICE_PATH=/usr/bin/libreoffice
DOCUMENT_RENDERER_MODE=off
# Optional:
# REPO_ROOT=/app/repo  # only if templates are bundled
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-host.com/api/v1
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Vercel calls `localhost:3001` | `NEXT_PUBLIC_API_BASE_URL` not set in Vercel env | Set env var and redeploy |
| Login works locally but not on Vercel | CORS blocked OR cookie `SameSite` issue | Set `WEB_ORIGIN`, `API_CORS_ORIGIN`, `AUTH_COOKIE_SAMESITE=none`, `AUTH_COOKIE_SECURE=true` on backend |
| 401 after login | Cookie not sent with request | Check `credentials: "include"` in API calls + cookie `SameSite=None; Secure` |
| Runtime source not `GLOBAL_PUBLISHED` | DB publish scripts not run | Run `pnpm publish:forms:db` and `pnpm migrate-compiled-json-to-v2` |
| DOCX generation fails | Storage path not accessible in container | Mount persistent volume at `STORAGE_ROOT`, verify `/app/storage/templates/normalized-docx` exists |
| PDF export fails | LibreOffice not installed | Install with `apt-get install libreoffice` or set `DOCUMENT_RENDERER_MODE=off` |
| File download 404 | Generated files not persisted | Use persistent disk (not ephemeral container FS); mount `./storage` volume |
| CORS error: origin not allowed | `API_CORS_ORIGIN` missing Vercel domain | Set `API_CORS_ORIGIN=https://your-app.vercel.app` on backend |
| API fails startup | `assertProductionSafety()` blocks insecure config | Ensure `WEB_ORIGIN`, Clerk secrets, `AUTH_COOKIE_SECURE=true`, `TUNNEL_TEST=false`, strong seed password, and no wildcard CORS |
| Prisma generate fails (Windows) | Port 3001 in use by dev server | Stop `pnpm dev` before building |
| Vercel build fails | `NEXT_PUBLIC_API_BASE_URL` missing | Add env var in Vercel dashboard |
| `pnpm install` fails on Vercel | Node version mismatch | Ensure `engines.node >= 20.0.0` in root `package.json` |

---

## Security Notes

- **Do not use** `admin123` as the admin password in staging. `assertProductionSafety()` will block the API if it detects this.
- **Do not set** `DATABASE_URL` on Vercel — it is a frontend-only deploy.
- **Do not use** `API_CORS_ORIGIN=*` in production — it is blocked by `assertProductionSafety()`.
- **Do not use** `TUNNEL_TEST=true` with `NODE_ENV=production`; startup rejects it.
- **Set** `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` in the API secret store before starting production.
- The `tester` account (`tester/tester123`) has `OFFICIAL` role with no destructive permissions. It is safe for public staging.
- The `admin` account uses the password from `SEED_ADMIN_PASSWORD` env var. Change it from the default before going live.
- All staging data should be considered public. Do not use real people's data.
- Cookie is `httpOnly` + `Secure` + `SameSite=None` for cross-origin session auth between Vercel and backend. This is the correct configuration for this architecture.

---

## Definition of Done

| Status | Criteria |
|---|---|
| **Public staging deployment ready for manual testing** | API health OK, 213/213 runtime gate pass, tester account works, Vercel deploys |
| **Ready for controlled public testing** | Above + 10 manual form smoke PASS (DOCX generation + data persistence) |
| **Production ready** | Not claimed in this document — requires full regression, security audit, and separate production deployment |

---

## File Summary

| File | Purpose |
|---|---|
| `docker/api.Dockerfile` | Multi-stage build for NestJS API |
| `docker/web.Dockerfile` | Multi-stage build for Next.js web |
| `docker-compose.prod.yml` | All-in-one Docker deploy (MySQL + API) |
| `.env.docker.example` | Template for `.env.docker` |
| `vercel.json` | Vercel monorepo configuration |
| `scripts/generate-bm-panel-registry.mjs` | Regenerates form panel registry |
| `apps/api/prisma/seed.ts` | Seeds agency, officials, wards, offenses, templates, **tester account** |
