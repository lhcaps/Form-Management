# scripts/local/start.ps1
# Start the local customer stack and wait for health.
[CmdletBinding()]
param(
  [int]$ApiTimeoutSeconds = 90,
  [int]$WebTimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

Write-Host "==> pnpm dev"
$proc = Start-Process -FilePath "pnpm" -ArgumentList @("dev") -NoNewWindow -PassThru
Write-Host "Started pnpm dev (PID $($proc.Id))"
Write-Host "Waiting for API/Web health..."

# Reuse existing healthcheck
& pnpm dev:wait-ready
if ($LASTEXITCODE -ne 0) {
  Write-Error "Stack did not become ready in time"
  exit 1
}

# Print endpoints
Write-Host ""
Write-Host "Local customer stack is healthy."
Write-Host "Web:    http://127.0.0.1:3000"
Write-Host "API:    http://127.0.0.1:3001/api/v1/health"
Write-Host "DB:     127.0.0.1:3307 (MariaDB)"
exit 0
