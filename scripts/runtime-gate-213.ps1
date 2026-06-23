# Runtime gate: verify all 213 forms have valid compiled contracts at runtime.
# Requires: API running on localhost:3001, admin user seeded.
# Usage: powershell -File scripts/runtime-gate-213.ps1

$ErrorActionPreference = "Stop"
$base = "http://localhost:3001/api/v1"

# ── 1. Login ──────────────────────────────────────────────────────────────────
Write-Host "[1/3] Logging in as admin..." -ForegroundColor Cyan

try {
    $webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $loginResp = Invoke-RestMethod -Uri "$base/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{ username = "admin"; password = "admin123" }) `
        -WebSession $webSession `
        -TimeoutSec 15

    Write-Host "  Logged in OK (user: $($loginResp.user.fullName))" -ForegroundColor Green
} catch {
    Write-Error "Login error: $($_.Exception.Message)"
    exit 1
}

# ── 2. Health check ───────────────────────────────────────────────────────────
Write-Host "[2/3] Verifying API health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod "$base/health" -WebSession $webSession -TimeoutSec 10
    Write-Host "  API healthy" -ForegroundColor Green
} catch {
    Write-Error "Health check failed: $($_.Exception.Message)"
    exit 1
}

# ── 3. Runtime gate for 213 forms ─────────────────────────────────────────────
Write-Host "[3/3] Running runtime gate for BM-001..BM-213..." -ForegroundColor Cyan

$bad = @()
$okCount = 0

foreach ($n in 1..213) {
    $code = "BM-{0:D3}" -f $n
    $url = "$base/forms/runtime/$code"
    try {
        $r = Invoke-RestMethod $url -WebSession $webSession -TimeoutSec 15 -ErrorAction Stop
        Start-Sleep -Milliseconds 500

        $issues = @()

        if ($r.source -ne "GLOBAL_PUBLISHED") {
            $issues += "source=$($r.source)"
        }
        if ($r.compiledContract.schemaVersion -ne "2.0") {
            $issues += "schemaVersion=$($r.compiledContract.schemaVersion)"
        }
        if (-not $r.compiledContract.source) {
            $issues += "missing compiledContract.source"
        }
        if (-not $r.compiledContract.source.fields) {
            $issues += "missing source.fields"
        }
        if (-not $r.compiledContract.uiSchema.sections) {
            $issues += "missing uiSchema.sections"
        }
        if (-not $r.compiledContract.renderPlan.bindings) {
            $issues += "missing renderPlan.bindings"
        }

        if ($issues.Count -gt 0) {
            $bad += [PSCustomObject]@{
                Code = $code
                Issues = ($issues -join "; ")
            }
            Write-Host "[FAIL] $code : $($issues -join '; ')" -ForegroundColor Red
        } else {
            $okCount++
            Write-Host "[OK] $code" -ForegroundColor Green
        }
    } catch {
        $bad += [PSCustomObject]@{
            Code = $code
            Issues = $_.Exception.Message
        }
        Write-Host "[FAIL] $code : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ── 4. Report ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor White
if ($bad.Count -eq 0) {
    Write-Host "RUNTIME GATE PASSED: 213/213 forms OK" -ForegroundColor Green
    exit 0
} else {
    Write-Host "RUNTIME GATE FAILED: $($bad.Count)/213 forms failed, $($okCount)/213 passed" -ForegroundColor Red
    Write-Host ""
    $bad | Format-Table -AutoSize
    exit 1
}
