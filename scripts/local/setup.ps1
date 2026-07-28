# scripts/local/setup.ps1
# Customer-local first-time setup. Copies .env.example if missing,
# installs dependencies, starts the local DB, and runs migrations.
[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipDb,
  [switch]$SkipMigrate
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

if (-not (Test-Path (Join-Path $repoRoot "package.json"))) {
  Write-Error "Repository root not found at $repoRoot"
  exit 64
}

# 1. Ensure .env exists (do NOT overwrite)
$envPath = Join-Path $repoRoot ".env"
$envExample = Join-Path $repoRoot ".env.example"
if (-not (Test-Path $envPath) -and (Test-Path $envExample)) {
  Copy-Item -LiteralPath $envExample -Destination $envPath
  Write-Host "Created .env from .env.example — review and edit before running."
} elseif (Test-Path $envPath) {
  Write-Host ".env already present — not overwriting."
} else {
  Write-Warning "No .env or .env.example found. You must create one before proceeding."
}

# 2. Install dependencies
if (-not $SkipInstall) {
  Write-Host "==> pnpm install --frozen-lockfile"
  pnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
}

# 3. Bring up local DB
if (-not $SkipDb) {
  Write-Host "==> pnpm dev:infra:up"
  pnpm dev:infra:up
  if ($LASTEXITCODE -ne 0) { throw "dev:infra:up failed" }
  Write-Host "==> pnpm dev:infra:wait"
  pnpm dev:infra:wait
  if ($LASTEXITCODE -ne 0) { throw "dev:infra:wait failed" }
}

# 4. Run migrations
if (-not $SkipMigrate) {
  Write-Host "==> pnpm prisma:migrate:deploy"
  pnpm prisma:migrate:deploy
  if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy failed" }
}

# 5. Run smoke healthcheck
Write-Host "==> pnpm dev:health"
pnpm dev:health
if ($LASTEXITCODE -ne 0) { throw "dev:health failed" }

Write-Host "Setup complete."
exit 0
