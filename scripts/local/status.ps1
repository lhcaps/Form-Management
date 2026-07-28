# scripts/local/status.ps1
# Print service / DB / build status of the local customer stack.
[CmdletBinding()]

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

Write-Host "==> QLLaw customer-local status"
Write-Host ""

Write-Host "[Versions]"
& node --version
& pnpm --version
$dv = (& docker --version) 2>$null
if ($dv) { Write-Host $dv } else { Write-Host "docker: UNAVAILABLE" }

Write-Host ""
Write-Host "[Containers]"
try {
  & docker compose -f infra/docker-compose.dev.yml ps
} catch {
  Write-Host "docker compose ps failed: $_"
}

Write-Host ""
Write-Host "[API health]"
try {
  $apiHealth = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/v1/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
  Write-Host "API /health: $($apiHealth.StatusCode)"
} catch {
  Write-Host "API /health: NOT_RESPONDING"
}

Write-Host ""
Write-Host "[Web health]"
try {
  $webHealth = Invoke-WebRequest -Uri "http://127.0.0.1:3000/healthz" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
  Write-Host "Web /healthz: $($webHealth.StatusCode)"
} catch {
  Write-Host "Web /healthz: NOT_RESPONDING"
}

Write-Host ""
Write-Host "[Migration status]"
& pnpm prisma:migrate:status 2>&1 | Out-String | Write-Host

exit 0
