# probe-codegraph-stack.ps1
# Healthcheck script for CodeGraph Cursor MCP integration
# Run: cd D:\Study\Project\QLLaw-main; powershell -ExecutionPolicy Bypass -File scripts/audit/probe-codegraph-stack.ps1

param(
    [string]$ProjectRoot = "D:\Study\Project\QLLaw-main"
)

$ErrorActionPreference = "Continue"

Write-Host "=== CodeGraph Stack Probe ===" -ForegroundColor Cyan
Write-Host ("Project: " + $ProjectRoot)
Write-Host ("Time: " + (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffzzz"))
Write-Host ""

# 1. PATH lookup
Write-Host "[1] PATH lookup" -ForegroundColor Yellow
$whereResult = where.exe codegraph 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ("  FOUND: " + $whereResult) -ForegroundColor Green
} else {
    Write-Host "  NOT FOUND in PATH" -ForegroundColor Red
}
Write-Host ""

# 2. Version
Write-Host "[2] Version" -ForegroundColor Yellow
try {
    $version = & codegraph --version 2>&1
    Write-Host ("  " + $version)
} catch {
    Write-Host ("  ERROR: " + $_.Exception.Message) -ForegroundColor Red
}
Write-Host ""

# 3. Help smoke
Write-Host "[3] Help smoke test" -ForegroundColor Yellow
try {
    $help = & codegraph --help 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - help command works" -ForegroundColor Green
    } else {
        Write-Host ("  FAIL - exit code " + $LASTEXITCODE) -ForegroundColor Red
    }
} catch {
    Write-Host ("  ERROR: " + $_.Exception.Message) -ForegroundColor Red
}
Write-Host ""

# 4. Current directory
Write-Host "[4] Current working directory" -ForegroundColor Yellow
Write-Host ("  " + (Get-Location))
Write-Host ""

# 5. .codegraph folder
Write-Host "[5] .codegraph folder" -ForegroundColor Yellow
$cgDir = Join-Path $ProjectRoot ".codegraph"
if (Test-Path $cgDir) {
    Write-Host ("  EXISTS: " + $cgDir) -ForegroundColor Green
    $items = Get-ChildItem $cgDir -Force | Where-Object { $_.Name -notmatch "^codegraph\.db" }
    foreach ($item in $items) {
        $size = $item.Length.ToString().PadLeft(15)
        $time = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host ("    " + $item.Name.PadRight(35) + " " + $size + " bytes  " + $time)
    }
    $dbFile = Join-Path $cgDir "codegraph.db"
    if (Test-Path $dbFile) {
        $sizeMb = [math]::Round((Get-Item $dbFile).Length / 1MB, 2)
        $color = if ($sizeMb -gt 0) { "Green" } else { "Red" }
        Write-Host ("  DB size: " + $sizeMb + " MB") -ForegroundColor $color
    }
} else {
    Write-Host "  NOT FOUND - run: codegraph init" -ForegroundColor Red
}
Write-Host ""

# 6. Cursor MCP config
Write-Host "[6] Cursor MCP config" -ForegroundColor Yellow
$mcpConfig = Join-Path $env:USERPROFILE ".cursor\mcp.json"
if (Test-Path $mcpConfig) {
    Write-Host ("  EXISTS: " + $mcpConfig) -ForegroundColor Green
    $content = Get-Content $mcpConfig -Raw
    try {
        $json = $content | ConvertFrom-Json
        $servers = $json.mcpServers.PSObject.Properties.Name
        Write-Host ("  Servers registered: " + ($servers -join ", "))
        foreach ($server in $servers) {
            $cfg = $json.mcpServers.$server
            Write-Host ("  --- " + $server + " ---")
            Write-Host ("    type:    " + $cfg.type)
            Write-Host ("    command: " + $cfg.command)
            Write-Host ("    args:    " + ($cfg.args -join " "))
            if ($cfg.args -contains '${workspaceFolder}') {
                Write-Host "    WARNING: backslash${'$'}{workspaceFolder} in args may cause stdio issues" -ForegroundColor Magenta
            }
        }
    } catch {
        Write-Host ("  PARSE ERROR: " + $_.Exception.Message) -ForegroundColor Red
    }
} else {
    Write-Host "  NOT FOUND - run: codegraph install --target=cursor --location=global --yes" -ForegroundColor Red
}
Write-Host ""

# 7. Project-level MCP config
Write-Host "[7] Project MCP config" -ForegroundColor Yellow
$projMcp = Join-Path $ProjectRoot ".cursor\mcp.json"
if (Test-Path $projMcp) {
    Write-Host ("  EXISTS: " + $projMcp) -ForegroundColor Green
} else {
    Write-Host "  NOT FOUND (OK if global config used)"
}
Write-Host ""

# 8. codegraph status
Write-Host "[8] codegraph status" -ForegroundColor Yellow
try {
    $status = & codegraph status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK" -ForegroundColor Green
        $status | ForEach-Object { Write-Host ("  " + $_) }
    } else {
        Write-Host ("  FAIL - exit " + $LASTEXITCODE) -ForegroundColor Red
        $status | ForEach-Object { Write-Host ("  " + $_) }
    }
} catch {
    Write-Host ("  ERROR: " + $_.Exception.Message) -ForegroundColor Red
}
Write-Host ""

# 9. MCP serve smoke (simple timeout test)
Write-Host "[9] MCP serve smoke (timeout 3s)" -ForegroundColor Yellow
$tempErr = [System.IO.Path]::GetTempFileName()
$tempOut = [System.IO.Path]::GetTempFileName()
try {
    $job = Start-Job -ScriptBlock {
        param($out, $err, $proj)
        $null = & codegraph serve --mcp --path $proj 2>$err >$out
    } -ArgumentList $tempOut, $tempErr, $ProjectRoot
    $completed = Wait-Job $job -Timeout 3
    if ($completed) {
        Write-Host "  STARTS OK - server alive" -ForegroundColor Green
    } else {
        Write-Host "  HUNG (expected for stdio server) - killing" -ForegroundColor Yellow
    }
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host ("  ERROR: " + $_.Exception.Message) -ForegroundColor Red
} finally {
    if (Test-Path $tempErr) { Remove-Item $tempErr -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tempOut) { Remove-Item $tempOut -Force -ErrorAction SilentlyContinue }
}
Write-Host ""

# 10. MCP tool availability note
Write-Host "[10] MCP tool availability" -ForegroundColor Yellow
Write-Host "  This script cannot call MCP tools directly (not an MCP client)."
Write-Host "  To test MCP tools, open Cursor Agent and call codegraph_explore."
Write-Host "  If NOT visible in agent tool list:"
Write-Host "    1. Restart Cursor completely"
Write-Host ("    2. Re-open project: " + $ProjectRoot)
Write-Host "    3. In Agent: use CallMcpTool with server=user-codegraph, toolName=codegraph_explore"
Write-Host ""

# 11. Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
$cliOk = ($whereResult -and $LASTEXITCODE -eq 0)
$indexOk = Test-Path (Join-Path $ProjectRoot ".codegraph\codegraph.db")
$mcpOk = Test-Path $mcpConfig
Write-Host ("CLI available:   " + $(if ($cliOk) { "YES" } else { "NO" }))
Write-Host ("Project indexed: " + $(if ($indexOk) { "YES" } else { "NO" }))
Write-Host ("MCP configured:  " + $(if ($mcpOk) { "YES" } else { "NO" }))
Write-Host ""
Write-Host "If MCP tools NOT visible in Cursor Agent:"
Write-Host "  1. Restart Cursor (close ALL windows)"
Write-Host "  2. In Agent, type: List your available tools"
Write-Host "  3. If still missing: codegraph install --target=cursor --location=global --yes"
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
