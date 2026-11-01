# scripts/local/backup.ps1
# Take a timestamped backup of the customer-local MariaDB database.
# Produces SHA256 manifest and excludes secrets from stdout.
[CmdletBinding()]
param(
  [string]$OutputDir = "backups",
  [switch]$NoGzip
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir
} else {
  Join-Path $repoRoot $OutputDir
}
$backupDir = Join-Path $backupRoot "qllaw-$stamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$dumpFile = Join-Path $backupDir "qllaw-$stamp.sql"

Write-Host "==> Dumping MariaDB to $dumpFile"
& docker compose -f infra/docker-compose.dev.yml exec -T mariadb sh -lc 'exec mariadb-dump --single-transaction --quick --routines --triggers --events --hex-blob --default-character-set=utf8mb4 -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' | Set-Content -LiteralPath $dumpFile -Encoding utf8NoBOM
if ($LASTEXITCODE -ne 0) { throw "mariadb-dump failed" }

$dumpSize = (Get-Item $dumpFile).Length
if ($dumpSize -le 0) {
  throw "Backup is zero bytes — aborting"
}

Write-Host "==> Computing SHA256"
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $dumpFile).Hash
$manifest = [ordered]@{
  backupFile = $dumpFile
  backupSizeBytes = $dumpSize
  sha256 = $hash
  timestamp = $stamp
  database = $env:MARIADB_DATABASE
  composeProject = "quanlyvks-dev"
}
$manifestFile = Join-Path $backupDir "manifest.json"
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestFile -Encoding utf8

Write-Host ""
Write-Host "Backup complete:"
Write-Host "  file:     $dumpFile"
Write-Host "  size:     $dumpSize bytes"
Write-Host "  sha256:   $hash"
Write-Host "  manifest: $manifestFile"
exit 0
