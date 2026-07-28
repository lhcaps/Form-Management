# scripts/local/doctor.ps1
# Customer-local health doctor. Validates repo root, runs pnpm dev:doctor
# and prints a concise PASS/FAIL summary.
[CmdletBinding()]
param(
  [switch]$Json
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

Set-Location $repoRoot
if (-not (Test-Path (Join-Path $repoRoot "package.json"))) {
  Write-Error "Repository root not found at $repoRoot"
  exit 64
}

$devDoctor = Join-Path $repoRoot "scripts\dev-doctor.mjs"
if (-not (Test-Path $devDoctor)) {
  Write-Error "dev-doctor.mjs not found at $devDoctor"
  exit 65
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Write-Error "node not found on PATH"
  exit 66
}

Write-Host "==> QLLaw customer-local doctor"
Write-Host "Repo root: $repoRoot"
Write-Host "Node: $(& $node --version)"
if ($Json) {
  & $node $devDoctor --json
} else {
  & $node $devDoctor
}
exit $LASTEXITCODE
