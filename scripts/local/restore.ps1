# scripts/local/restore.ps1
# Restore a customer-local backup into the database. Validates hash
# before applying. Requires explicit --confirm.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [switch]$Confirm
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

if (-not (Test-Path $BackupPath)) {
  Write-Error "Backup not found: $BackupPath"
  exit 64
}

# Look for sibling manifest
$manifestPath = Join-Path (Split-Path -Parent $BackupPath) "manifest.json"
$expectedHash = $null
if (Test-Path $manifestPath) {
  try {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $expectedHash = $manifest.sha256
    Write-Host "Manifest found. Expected SHA256: $expectedHash"
  } catch {
    Write-Warning "Could not parse manifest.json"
  }
}

$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackupPath).Hash
Write-Host "Backup SHA256: $actualHash"

if ($expectedHash -and $expectedHash -ne $actualHash) {
  Write-Error "Backup hash mismatch — refusing to restore. Use the --confirm flag and re-verify the source."
  exit 65
}

if (-not $Confirm) {
  Write-Host ""
  Write-Host "DRY RUN: pass -Confirm to actually restore."
  Write-Host "  Source: $BackupPath"
  Write-Host "  Target: $($env:MARIADB_DATABASE) on 127.0.0.1:3307"
  Write-Host "  Hash:   $actualHash"
  exit 0
}

Write-Host "==> Restoring backup into $($env:MARIADB_DATABASE)..."
Get-Content -LiteralPath $BackupPath -Raw -Encoding utf8 | & docker compose -f infra/docker-compose.dev.yml exec -T mariadb sh -lc 'exec mariadb --default-character-set=utf8mb4 -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"'
if ($LASTEXITCODE -ne 0) { throw "Restore failed" }

Write-Host "Restore complete."
exit 0
