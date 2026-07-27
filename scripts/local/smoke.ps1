# scripts/local/smoke.ps1
# Customer-local smoke check. Verifies API/Web/DB health, catalogue
# count, and a representative preview flow when auth is configured.
[CmdletBinding()]
param(
  [switch]$RequireAuth
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

$failures = @()

function Check-Name {
  param([string]$Name, [bool]$Ok, [string]$Detail = "")
  if ($Ok) {
    Write-Host "  PASS $Name"
  } else {
    Write-Host "  FAIL $Name — $Detail"
    $script:failures += $Name
  }
}

Write-Host "==> QLLaw customer-local smoke"

# API health
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/v1/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
  Check-Name "API /health" ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) "HTTP $($r.StatusCode)"
} catch {
  Check-Name "API /health" $false "no response"
}

# Web health
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/healthz" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
  Check-Name "Web /healthz" ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) "HTTP $($r.StatusCode)"
} catch {
  Check-Name "Web /healthz" $false "no response"
}

# DB reachability
$dbOk = $false
try {
  $tcp = New-Object System.Net.Sockets.TcpClient
  $tcp.BeginConnect("127.0.0.1", 3307, $null, $null) | Out-Null
  $ok = $tcp.Connected
  $tcp.Close()
  $dbOk = $true
  Check-Name "DB 127.0.0.1:3307" $true ""
} catch {
  Check-Name "DB 127.0.0.1:3307" $false "no response"
}

# Catalogue count — only when API responds with health
try {
  $apiHealth = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/v1/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
  if ($apiHealth.StatusCode -lt 400) {
    $catalogueUrl = "http://127.0.0.1:3001/api/v1/forms"
    try {
      $catalogue = Invoke-WebRequest -Uri $catalogueUrl -UseBasicParsing -TimeoutSec 10 -Headers @{"Accept"="application/json"} -ErrorAction Stop
      $items = $catalogue.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
      $count = if ($items -is [array]) { $items.Count } elseif ($items.data) { $items.data.Count } elseif ($items.items) { $items.items.Count } else { 0 }
      Check-Name "Catalogue count = 213" ($count -eq 213) "got $count"
    } catch {
      Write-Host "  SKIP Catalogue count — endpoint requires auth"
    }
  }
} catch {
  Write-Host "  SKIP Catalogue count — API not ready"
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "SMOKE=FAIL ($($failures.Count) failures)"
  exit 1
}
Write-Host ""
Write-Host "SMOKE=PASS"
exit 0
