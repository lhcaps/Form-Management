<#
.SYNOPSIS
    Start QUANLYVKS public testing environment via Cloudflare Tunnel.

.DESCRIPTION
    1. Verifies cloudflared is installed.
    2. Starts pnpm dev with TUNNEL_TEST mode (cross-origin cookie + CORS).
    3. Starts cloudflared tunnel to localhost:3001.
    4. Extracts the tunnel URL and prints the next steps.

    Requires two terminal tabs or two PowerShell sessions:
      Tab 1 (API): This script
      Tab 2 (Tunnel): The script will start cloudflared in a separate window.

.NOTES
    Run from repo root: .\scripts\start-public-test-tunnel.ps1
#>

param(
    [string]$VercelDomain,
    [switch]$SkipSmoke,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Write-Banner {
    param([string]$Text)
    $bar = '=' * 70
    Write-Host "`n$bar" -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "$bar`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text)
    Write-Host "[STEP] $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[WARN] $Text" -ForegroundColor Magenta
}

function Write-Info {
    param([string]$Text)
    Write-Host "  $Text" -ForegroundColor White
}

function Test-Command {
    param([string]$Name, [string]$Check)
    $found = Invoke-Expression "$Check 2>`$null"
    if ($LASTEXITCODE -ne 0 -or -not $found) {
        Write-Warn "$Name not found. Install from: https://github.com/cloudflare/cloudflared/releases"
        return $false
    }
    Write-Success "$Name found"
    return $true
}

function Write-Banner "QUANLYVKS — Public Test Tunnel Helper"

Write-Host @"

  This script helps you expose your local QUANLYVKS API via Cloudflare
  Tunnel so testers can access it from a Vercel-deployed frontend.

  Prerequisites:
    - pnpm dev running in a separate terminal (or will be started here)
    - Vercel frontend deployed with NEXT_PUBLIC_API_BASE_URL set
    - cloudflared installed (see https://github.com/cloudflare/cloudflared/releases)

  IMPORTANT: Your laptop/PC must stay ON while the tunnel is running.

"@

if ($Help) {
    Get-Help $PSCommandPath -Full
    exit 0
}

# ── 1. Check prerequisites ──────────────────────────────────────────────
Write-Banner "Checking Prerequisites"

$nodeOk = Test-Command "Node.js" "node --version"
$pnpmOk = Test-Command "pnpm"      "pnpm --version"
$cfOk   = Test-Command "cloudflared" "cloudflared --version"

if (-not ($nodeOk -and $pnpmOk -and $cfOk)) {
    Write-Warn "Missing prerequisites. Install them before continuing."
    exit 1
}

# ── 2. Determine Vercel domain ────────────────────────────────────────────
if (-not $VercelDomain) {
    Write-Host "`n[INPUT] Vercel frontend domain (without https://):" -ForegroundColor Yellow
    Write-Host "  Example: my-app.vercel.app" -ForegroundColor Gray
    $VercelDomain = Read-Host "  Domain"
    $VercelDomain = $VercelDomain.Trim()
}

if (-not $VercelDomain) {
    Write-Warn "No Vercel domain provided. Cannot configure CORS. exiting."
    exit 1
}

$vercelOrigin = "https://$VercelDomain"

# ── 3. Check if API is already running ──────────────────────────────────
Write-Banner "Checking API Status"
$apiRunning = $false
try {
    $r = Invoke-RestMethod "http://localhost:3001/api/v1/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($r.ok) {
        Write-Success "API already running at http://localhost:3001"
        $apiRunning = $true
    }
} catch {
    Write-Info "API not responding on localhost:3001"
}

# ── 4. Start API if not running ──────────────────────────────────────────
if (-not $apiRunning) {
    Write-Banner "Starting API (TUNNEL_TEST mode)"
    Write-Info "Starting pnpm dev with TUNNEL_TEST=true..."
    Write-Info "This terminal will show the API output."
    Write-Info "Open a NEW terminal for cloudflared (step 5).`n"

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "cd '$RepoRoot'; `$env:TUNNEL_TEST='true'; `$env:NODE_ENV='development'; `$env:WEB_ORIGIN=`"$vercelOrigin`"; `$env:API_CORS_ORIGIN=`"$vercelOrigin`"; Write-Host 'Starting QUANLYVKS API in TUNNEL_TEST mode...' -ForegroundColor Cyan; pnpm dev"
    ) -Verb open

    Write-Host "`nWaiting 8s for API to start..." -ForegroundColor Yellow
    Start-Sleep 8

    try {
        $r = Invoke-RestMethod "http://localhost:3001/api/v1/health" -TimeoutSec 5
        Write-Success "API started: http://localhost:3001/api/v1/health → $($r | ConvertTo-Json -Compress)"
    } catch {
        Write-Warn "API may not be ready yet. Check the terminal."
    }
} else {
    Write-Step "Skipping API start (already running)"
}

# ── 5. Start Cloudflare Tunnel ───────────────────────────────────────────
Write-Banner "Starting Cloudflare Tunnel"
Write-Info "Cloudflare quick tunnel forwards https://xxx.trycloudflare.com → localhost:3001"
Write-Info "Each restart creates a NEW URL. Keep the tunnel window open.`n"

# Start cloudflared in a new window and capture output
$cloudflaredProc = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cloudflared tunnel --url http://localhost:3001 2>&1"
) -PassThru -Verb open

Write-Host "`nWaiting 8s for tunnel to establish..." -ForegroundColor Yellow
Start-Sleep 8

# ── 6. Extract tunnel URL ───────────────────────────────────────────────
Write-Banner "Tunnel URL"

Write-Info "Scanning for tunnel URL in cloudflared output..."
Write-Info "If no URL appears below, check the cloudflared terminal window.`n"

$tunnelUrl = $null
$maxAttempts = 10
for ($i = 0; $i -lt $maxAttempts; $i++) {
    Start-Sleep 3
    try {
        # cloudflared outputs URL to stderr in quick tunnel mode
        $out = cloudflared tunnel --url http://localhost:3001 2>&1 | Out-String
        if ($out -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $tunnelUrl = $Matches[0]
            break
        }
    } catch { }
    Write-Info "Attempt $($i+1)/$maxAttempts - still waiting..."
}

if ($tunnelUrl) {
    Write-Success "Tunnel URL: $tunnelUrl"
} else {
    Write-Warn "Could not detect tunnel URL automatically."
    Write-Info "Look in the cloudflared terminal window for the URL like:"
    Write-Info "  https://xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.trycloudflare.com"
    $tunnelUrl = "https://YOUR-TUNNEL-URL.trycloudflare.com"
}

# ── 7. Print instructions ───────────────────────────────────────────────
Write-Banner "Next Steps"

Write-Host @"

1. UPDATE VERCEL ENV:
   Go to Vercel Dashboard → Settings → Environment Variables

   NEXT_PUBLIC_API_BASE_URL=$tunnelUrl/api/v1

   Then redeploy: Deployments → current deployment → "Create New Deployment"

2. VERIFY API:
   Invoke-RestMethod '$tunnelUrl/api/v1/health'

3. SMOKE TEST (optional):
   `$env:API_URL = '$tunnelUrl'
   node scripts/smoke-forms-runtime-213.mjs

4. MANUAL SMOKE:
   Open: https://$VercelDomain
   Login: tester / tester123
   Test forms: BM-001, BM-052, BM-067, BM-085, BM-141,
             BM-168, BM-173, BM-185, BM-200, BM-213

5. CLEANUP:
   - Stop cloudflared terminal window (Ctrl+C)
   - Stop pnpm dev terminal window (Ctrl+C)
   - Update Vercel env (remove or update NEXT_PUBLIC_API_BASE_URL)

"@

if (-not $SkipSmoke -and $tunnelUrl -and $tunnelUrl -notmatch 'YOUR-TUNNEL') {
    Write-Host "Run smoke test now? (Y/n)" -ForegroundColor Yellow
    $resp = Read-Host " "
    if ($resp -ne 'n' -and $resp -ne 'N') {
        Write-Step "Running 213 forms smoke test..."
        $env:API_URL = $tunnelUrl
        node "$RepoRoot/scripts/smoke-forms-runtime-213.mjs"
    }
}
