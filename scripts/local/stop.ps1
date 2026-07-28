# scripts/local/stop.ps1
# Stop the local customer stack (DB container retained).
[CmdletBinding()]

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

Write-Host "==> Freeing dev ports 3000, 3001"
& pnpm dev:clean
if ($LASTEXITCODE -ne 0) {
  Write-Warning "dev:clean returned non-zero — continuing anyway"
}

Write-Host "==> Stopping MariaDB container (volume retained)"
& pnpm dev:infra:down
if ($LASTEXITCODE -ne 0) {
  Write-Warning "dev:infra:down returned non-zero"
}

Write-Host "Stack stopped. Customer database volumes are intact."
exit 0
