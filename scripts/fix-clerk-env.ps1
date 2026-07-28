# Fix Clerk env for Next.js web app
Set-Location "D:\Study\Project\QLLaw-main"

# 1. Stop processes holding port 3000
$listeners = Get-NetTCPConnection `
  -LocalPort 3000 `
  -State Listen `
  -ErrorAction SilentlyContinue

foreach ($listener in $listeners) {
    Write-Host "Stopping PID $($listener.OwningProcess) on port 3000..."
    Stop-Process -Id $listener.OwningProcess -Force
}

# 2. Read key from root .env without logging value
function Get-EnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    $escaped = [regex]::Escape($Name)

    $line = Get-Content $Path |
        Where-Object { $_ -match "^\s*$escaped\s*=" } |
        Select-Object -Last 1

    if (-not $line) {
        return $null
    }

    return ($line -split "=", 2)[1].Trim().Trim('"').Trim("'")
}

$rootEnv = Join-Path $PWD ".env"
$publishableKey = Get-EnvValue `
  -Path $rootEnv `
  -Name "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"

$secretKey = Get-EnvValue `
  -Path $rootEnv `
  -Name "CLERK_SECRET_KEY"

if ([string]::IsNullOrWhiteSpace($publishableKey)) {
    throw "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing from root .env"
}

if ([string]::IsNullOrWhiteSpace($secretKey)) {
    throw "CLERK_SECRET_KEY is missing from root .env"
}

if (-not $publishableKey.StartsWith("pk_test_")) {
    throw "Publishable key is not a pk_test_ development key"
}

if (-not $secretKey.StartsWith("sk_test_")) {
    throw "Secret key is not an sk_test_ development key"
}

Write-Host "Keys verified from root .env"
Write-Host "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_... (verified)"
Write-Host "CLERK_SECRET_KEY: sk_test_... (verified)"

# 3. Create env at Next.js app root
$webEnvPath = Join-Path $PWD "apps\web\.env.local"

$lines = @(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$publishableKey",
    "CLERK_SECRET_KEY=$secretKey"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines(
    $webEnvPath,
    $lines,
    $utf8NoBom
)

Write-Host "Created apps\web\.env.local with Clerk variables"

# 4. Remove old Next/Turbopack cache
$nextCache = Join-Path $PWD "apps\web\.next"

if (Test-Path $nextCache) {
    Remove-Item $nextCache -Recurse -Force
    Write-Host "Removed apps\web\.next cache"
}

# 5. Remove empty Playwright auth state
$authState = Join-Path $PWD "playwright\.clerk\admin.json"

if (Test-Path $authState) {
    Remove-Item $authState -Force
    Write-Host "Removed stale Playwright auth state"
}

Write-Host ""
Write-Host "Done. Start web with: pnpm dev:web"
