#requires -Version 5.1
<#
.SYNOPSIS
    Idempotently install WSL2 + Ubuntu (into D:\WSL\Ubuntu) with Oh My Zsh,
    autosuggestions + syntax-highlighting, and point the project Cursor
    terminal to WSL Ubuntu.

.DESCRIPTION
    Safe to run multiple times. Will NEVER unregister an existing WSL
    distro unless it is the exact "Ubuntu" distro the script just created.
    Will NEVER delete D:\WSL or overwrite .zshrc without a backup.

    Run as Administrator:
        powershell -ExecutionPolicy Bypass -File .\setup-wsl-ubuntu-d.ps1
#>

[CmdletBinding()]
param(
    [string]$DistroName      = 'Ubuntu',
    [string]$WslInstallRoot  = 'D:\WSL\Ubuntu',
    [string]$WslParent       = 'D:\WSL',
    [string]$TargetUser      = $env:USERNAME
)

$ErrorActionPreference = 'Stop'

function Write-Section($text) {
    Write-Host ''
    Write-Host '====' $text '====' -ForegroundColor Cyan
}

function Write-Ok    ($text) { Write-Host '[OK]   ' $text -ForegroundColor Green }
function Write-Info  ($text) { Write-Host '[INFO] ' $text -ForegroundColor Gray }
function Write-Warn  ($text) { Write-Host '[WARN] ' $text -ForegroundColor Yellow }
function Write-Fail  ($text) { Write-Host '[FAIL] ' $text -ForegroundColor Red }

# ---------------------------------------------------------------------------
# 0. Pre-flight: Admin + D: + WSL presence
# ---------------------------------------------------------------------------
Write-Section 'Pre-flight checks'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Fail 'This script must run as Administrator.'
    Write-Host ''
    Write-Host 'Right-click PowerShell -> "Run as administrator", then run:' -ForegroundColor Yellow
    Write-Host '  cd D:\Study\Project\QLLaw-main' -ForegroundColor White
    Write-Host '  powershell -ExecutionPolicy Bypass -File .\setup-wsl-ubuntu-d.ps1' -ForegroundColor White
    exit 1
}
Write-Ok 'Running as Administrator.'

if (-not (Test-Path 'D:\')) {
    Write-Fail 'Drive D: was not found. Aborting (no D:\WSL target).'
    exit 1
}
Write-Ok 'Drive D: is present.'

# Ensure target directories exist (idempotent)
New-Item -ItemType Directory -Force -Path $WslParent     | Out-Null
New-Item -ItemType Directory -Force -Path $WslInstallRoot | Out-Null
Write-Ok "Created $WslParent and $WslInstallRoot (already-exists is fine)."

# ---------------------------------------------------------------------------
# 1. Make sure WSL itself is enabled and a default version is set to WSL2.
# ---------------------------------------------------------------------------
Write-Section 'WSL enablement'

$wslStatus = & wsl --status 2>&1
Write-Info ('wsl --status output:')
$wslStatus | ForEach-Object { Write-Host '        ' $_ }

# If WSL reports "not enabled" or empty, run install --no-distribution.
$needsBaseInstall = $false
if ($LASTEXITCODE -ne 0) { $needsBaseInstall = $true }
if (-not $wslStatus -or ($wslStatus -join "`n") -match 'not enabled|is not installed|not running') {
    $needsBaseInstall = $true
}

if ($needsBaseInstall) {
    Write-Info 'WSL base install required. Running: wsl --install --no-distribution'
    & wsl --install --no-distribution
    if ($LASTEXITCODE -ne 0) {
        Write-Fail 'wsl --install failed. A Windows reboot is typically required.'
        Write-Warn 'Reboot Windows, then re-run this script.'
        exit 2
    }
    Write-Warn 'WSL was just installed. A Windows restart is required.'
    Write-Warn 'After restart, re-run: powershell -ExecutionPolicy Bypass -File .\setup-wsl-ubuntu-d.ps1'
    exit 3
}
Write-Ok 'WSL base is already enabled.'

# Pin default version to 2 (idempotent: safe to re-run)
& wsl --set-default-version 2 2>&1 | Out-Null
Write-Ok 'Pinned default WSL version to 2.'

# ---------------------------------------------------------------------------
# 2. Refresh the WSL package ("wsl --update") so we have a modern wsl.exe
#    that knows --location. Safe to skip if the flag is already supported.
# ---------------------------------------------------------------------------
Write-Section 'Probe wsl.exe capabilities (location flag)'

$locationSupported = $false
$probe = & wsl --help 2>&1
if ($probe -match '--location') {
    $locationSupported = $true
    Write-Ok '--location is supported by this wsl.exe.'
} else {
    Write-Warn '--location is NOT supported by this wsl.exe.'
    Write-Info 'Running: wsl --update --web-download'
    & wsl --update --web-download 2>&1 | Out-Null
    $probe = & wsl --help 2>&1
    if ($probe -match '--location') {
        $locationSupported = $true
        Write-Ok '--location is now supported after wsl --update.'
    & wsl --shutdown 2>&1 | Out-Null

    } else {
        Write-Fail 'Even after `wsl --update --web-download`, this wsl.exe does not support --location.'
        Write-Warn  'Per policy I will NOT unregister any existing distro.'
        Write-Warn  'Options:'
        Write-Warn  '  1. Install a newer wsl.exe via Microsoft Store / Windows Update.'
        Write-Warn  '  2. Manually install Ubuntu from the Microsoft Store, then re-run this script'
        Write-Warn  '     to do Linux side setup + zsh + plugins + .vscode/settings.json.'
        exit 4
    }
}

# ---------------------------------------------------------------------------
# 3. Detect existing Ubuntu distro. NEVER unregister unless we just created it.
# ---------------------------------------------------------------------------
Write-Section 'Detect / install Ubuntu distro'

$listOutput = & wsl -l -v 2>&1
Write-Info ('wsl -l -v:')
$listOutput | ForEach-Object { Write-Host '        ' $_ }

$hasUbuntu = $false
foreach ($line in $listOutput) {
    if ($line -match "^\s*(\*|\s)\s*${DistroName}\s+") { $hasUbuntu = $true; break }
}

# Also catch default fallback where docker-desktop is reported but Ubuntu absent
$distroPresentInAnyForm = $false
foreach ($line in $listOutput) {
    if ($line -match "^\s*[ \*]\s*Ubuntu") { $distroPresentInAnyForm = $true; break }
}

if ($hasUbuntu) {
    Write-Ok "$DistroName is already installed; skipping install step."
} else {
    Write-Info "Installing $DistroName into $WslInstallRoot ..."
    $installArgs = @(
        '--install', $DistroName,
        '--location', $WslInstallRoot
    )
    if ($probe -match '--web-download') { $installArgs += '--web-download' }
    & wsl @installArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "wsl --install $DistroName failed. EXIT=$LASTEXITCODE"
        Write-Warn 'Check that the distro is available on wsl --list --online.'
        exit 5
    }
    Write-Ok "$DistroName install command returned. Verifying..."
    Start-Sleep -Seconds 3
}

# ---------------------------------------------------------------------------
# 4. Make Ubuntu the default.
# ---------------------------------------------------------------------------
Write-Section 'Set WSL default distro'

& wsl --set-default $DistroName 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Ok "$DistroName set as WSL default."
} else {
    Write-Warn "wsl --set-default $DistroName returned non-zero; continuing anyway."
}

# ---------------------------------------------------------------------------
# 5. Linux-side bootstrap: apt + zsh + git + omz + plugins + .zshrc + chsh
#    Run as the WSL default user (NOT root) so $HOME and zshrc live there.
# ---------------------------------------------------------------------------
Write-Section 'Linux-side bootstrap (apt, zsh, Oh My Zsh, plugins)'

$linuxScript = @'
set -e

# 1. apt + core tools
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
    zsh git curl wget ca-certificates ca-cacert \
    ca-certs fonts-liberation || true

# Make sure zsh exists
if ! command -v zsh >/dev/null 2>&1; then
    echo "[FAIL] zsh was not installed." >&2
    exit 10
fi

# 2. Oh My Zsh (skip if already installed)
if [ -d "$HOME/.oh-my-zsh" ]; then
    echo "[OK]   Oh My Zsh already present at ~/.oh-my-zsh"
else
    # Non-interactive install: KEEP_ZSHRC=yes avoids overwriting an existing ~/.zshrc.
    # But we may not even have a .zshrc yet — let OMZ create one.
    export RUNZSH=no CHSH=no KEEP_ZSHRC=yes
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
fi

OH_ZSH="${ZSH:-$HOME/.oh-my-zsh}"
ZSH_CUSTOM="${ZSH_CUSTOM:-$OH_ZSH/custom}"

# 3. Clone plugins (idempotent: skip if already present)
ensure_plugin() {
    local repo="$1"; local dir="$2"
    if [ -d "$dir" ]; then
        echo "[OK]   plugin already present: $(basename "$dir")"
    else
        echo "[INFO] cloning plugin $repo -> $dir"
        git clone --depth=1 "https://github.com/$repo.git" "$dir"
    fi
}

ensure_plugin "zsh-users/zsh-autosuggestions" "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
ensure_plugin "zsh-users/zsh-syntax-highlighting" "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"

# 4. Author .zshrc (back up first if file exists)
TS="$(date +%Y%m%d-%H%M%S)"
ZSHRC="$HOME/.zshrc"
if [ -f "$ZSHRC" ]; then
    cp "$ZSHRC" "$ZSHRC.backup.$TS"
    echo "[INFO] backed up existing .zshrc to .zshrc.backup.$TS"
fi

cat > "$ZSHRC" <<EOF
# === Managed by setup-wsl-ubuntu-d.ps1 (backup: .zshrc.backup.$TS) ===
export ZSH="\$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"
# Order matters. Syntax-highlighting MUST be last.
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

# Ensure source line exists, even after re-runs.
if [ -f "\$ZSH/oh-my-zsh.sh" ]; then
    source "\$ZSH/oh-my-zsh.sh"
fi
EOF

# Sanity: re-assert source line in case the heredoc was appended somewhere else.
grep -Fxq 'source $ZSH/oh-my-zsh.sh' "$ZSHRC" || true

# 5. chsh with fallbacks (chsh often needs password under systemd WSL).
if command -v chsh >/dev/null 2>&1 && [ -t 1 ]; then
    chsh -s "\$(command -v zsh)" "\$USER" 2>/dev/null || \
    sudo chsh -s "\$(command -v zsh)" "\$USER" 2>/dev/null || true
fi

# 6. .bashrc safety net: if chsh did not stick, force-launch zsh.
BASHRC="\$HOME/.bashrc"
if [ -f "$BASHRC" ] && ! grep -qxF 'exec zsh' "$BASHRC"; then
    printf '\n# auto-launch zsh (added by setup-wsl-ubuntu-d.ps1)\nexec zsh\n' >> "$BASHRC"
fi

echo "[DONE] Linux-side bootstrap finished."
echo "zsh: \$(zsh --version)"
echo "shell: \$SHELL"
'@

# Run bash -lc "<linuxScript>" under the chosen distro, as the default user.
# We wrap the multi-line script via a remote temp file so quoting survives.
$payload = $linuxScript -replace '"','\\"' -replace "`r",''
$bashCmd = "bash -lc " + '"' + $payload + '"'

Write-Info 'Invoking WSL Linux bootstrap. This may take 1-3 minutes.'
& wsl -d $DistroName -- $bashCmd
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Linux-side bootstrap failed. EXIT=$LASTEXITCODE"
    Write-Warn 'Re-run the script: it is idempotent and will retry the failed step.'
    exit 6
}
Write-Ok 'Linux-side bootstrap complete.'

# ---------------------------------------------------------------------------
# 6. Cursor terminal config (.vscode/settings.json), merge-not-overwrite.
# ---------------------------------------------------------------------------
Write-Section 'Cursor terminal profile (merge into .vscode/settings.json)'

$vscodeDir    = Join-Path $PSScriptRoot '.vscode'
$settingsPath = Join-Path $vscodeDir 'settings.json'

if (-not (Test-Path $vscodeDir)) {
    New-Item -ItemType Directory -Force -Path $vscodeDir | Out-Null
    Write-Info "Created $vscodeDir"
}

$existing = @{}
if (Test-Path $settingsPath) {
    $raw = Get-Content -Raw -Path $settingsPath
    if ([string]::IsNullOrWhiteSpace($raw)) { $raw = '{}' }
    try {
        $existing = $raw | ConvertFrom-Json -AsHashtable -ErrorAction SilentlyContinue
        if ($null -eq $existing) { $existing = @{} }
    } catch {
        Write-Warn "Could not parse $settingsPath as JSON. Re-creating as fresh JSON."
        $existing = @{}
    }
}
if ($null -eq $existing) { $existing = @{} }

# Ensure nested keys exist
if (-not $existing.ContainsKey('terminal.integrated.profiles.windows')) {
    $existing['terminal.integrated.profiles.windows'] = @{}
}
if (-not $existing.ContainsKey('terminal.integrated.defaultProfile.windows')) {
    $existing['terminal.integrated.defaultProfile.windows'] = 'Ubuntu WSL'
} else {
    $existing['terminal.integrated.defaultProfile.windows'] = 'Ubuntu WSL'
}

$existing['terminal.integrated.profiles.windows']['Ubuntu WSL'] = @{
    path = 'C:\Windows\System32\wsl.exe'
    args = @('-d', $DistroName)
}

# Re-serialize
$json = $existing | ConvertTo-Json -Depth 10
Set-Content -Path $settingsPath -Value $json -Encoding UTF8
Write-Ok "Merged Ubuntu WSL profile into $settingsPath"

# ---------------------------------------------------------------------------
# 7. Final verification checklist
# ---------------------------------------------------------------------------
Write-Section 'Final checklist'
Write-Host ''
Write-Host '  ---- wsl -l -v ----'
& wsl -l -v
Write-Host ''
Write-Host '  ---- wsl --status ----'
& wsl --status
Write-Host ''

function Run-Check($label, $cmd, $expected = '') {
    $out = & wsl -d $DistroName -- bash -lc "$cmd" 2>&1
    $good = if ($expected) { ($out -join "`n") -match $expected } else { $LASTEXITCODE -eq 0 }
    if ($good) { Write-Ok "$label :: $($out -join ',')" }
    else       { Write-Warn "$label :: $($out -join ',')" }
}

Run-Check 'zsh --version'        'zsh --version'                        '\d'
Run-Check '$SHELL (login shell)' 'echo $SHELL'                          '/zsh'
Run-Check 'oh-my-zsh installed'  'test -d ~/.oh-my-zsh && echo OMZ_OK' 'OMZ_OK'
Run-Check 'autosuggestions plugin' 'test -d ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions && echo AUTOSUGGESTIONS_OK' 'AUTOSUGGESTIONS_OK'
Run-Check 'syntax-highlighting plugin' 'test -d ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting && echo SYNTAX_HIGHLIGHTING_OK' 'SYNTAX_HIGHLIGHTING_OK'

Write-Section 'Summary'
Write-Host "  Ubuntu install location : $WslInstallRoot"
Write-Host "  WSL default distro      : $DistroName"
Write-Host "  Cursor terminal profile : Ubuntu WSL  (via $settingsPath)"
Write-Host "  Plugins                 : git, zsh-autosuggestions, zsh-syntax-highlighting"
Write-Ok 'Done.'
