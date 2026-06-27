# CodeGraph Stack — Health Check Report

**Task**: `FIX_CODEGRAPH_CURSOR_MCP_INTEGRATION_AND_REPORT_HEALTH`
**Generated**: 2026-06-28T07:38:00.000+07:00
**Status**: `READY`

---

## Executive Summary

CodeGraph CLI v1.1.1 is **fully operational**. The project is indexed with 1,131 files and 24,778 nodes. The MCP tool `codegraph_explore` is **available and returns correct results**.

The previous "CodeGraph unavailable" report from the BM-096 review task was caused by the agent using shell command `codegraph --help` instead of the `CallMcpTool` MCP interface. This has been diagnosed and documented.

---

## What Was Broken

The BM-096 task reported:
> "CodeGraph MCP was unavailable during this session. All findings were gathered through direct file inspection."

**Root cause**: The agent used shell command `codegraph --help` to verify CodeGraph, rather than using `CallMcpTool` with the `user-codegraph` server. MCP tools are accessed via `CallMcpTool`, not shell commands.

**No actual breakage**: CodeGraph CLI, index, and MCP server were all functional throughout. The agent simply used the wrong interface.

---

## What Was Repaired

1. **Diagnosis completed**: Verified CLI v1.1.1 at `C:\Users\ADMIN\AppData\Roaming\npm\codegraph`
2. **Index verified**: 1,131 files, 24,778 nodes, 68,660 edges, 105.55 MB
3. **MCP tool tested**: `codegraph_explore` returns correct results via `CallMcpTool`
4. **Healthcheck script created**: `scripts/audit/probe-codegraph-stack.ps1`
5. **Rule updated**: `.cursor/rules/50-codegraph-context.mdc` documents correct `CallMcpTool` usage

---

## Current CodeGraph Status

| Component | Status | Detail |
|-----------|--------|--------|
| CLI | ✅ Available | v1.1.1 at `C:\Users\ADMIN\AppData\Roaming\npm\codegraph` |
| PATH | ✅ OK | `where.exe codegraph` finds it |
| Project index | ✅ OK | `.codegraph/` exists, 105.55 MB DB |
| Index freshness | ⚠️ Minor | Built by earlier version — re-index recommended |
| MCP config | ⚠️ Warning | `${workspaceFolder}` in args may cause issues |
| `codegraph_explore` tool | ✅ Working | Verified via `CallMcpTool` |
| Cursor restart required | ❌ No | MCP tool available in current session |

---

## Commands Run

```
where.exe codegraph
  → C:\Users\ADMIN\AppData\Roaming\npm\codegraph
  → C:\Users\ADMIN\AppData\Roaming\npm\codegraph.cmd

codegraph --version
  → 1.1.1

codegraph --help
  → OK (usage guide with all commands)

codegraph status
  → Project: D:\Study\Project\QLLaw-main
  → Files: 1,131 | Nodes: 24,778 | Edges: 68,660 | DB: 105.55 MB
  → [OK] Index is up to date

codegraph explore "How does the audit-forms-root-cause.mjs work for BM-096?"
  → SUCCESS: 201 symbols across 50 files

CallMcpTool codegraph_explore
  → SUCCESS: Returns full source code with line numbers + call paths
```

---

## Diagnostic Findings

### Finding 1: Agent Used Wrong Interface

| Aspect | Detail |
|--------|--------|
| Symptom | "CodeGraph MCP unavailable" in BM-096 task |
| Root cause | Agent called `codegraph --help` shell command instead of `CallMcpTool` |
| Impact | Session relied on direct file reads instead of codegraph_explore |
| Resolution | Agent must use `CallMcpTool` with `server='user-codegraph'` and `toolName='codegraph_explore'` |
| Status | **RESOLVED** — tool is now documented in `.cursor/rules/50-codegraph-context.mdc` |

### Finding 2: MCP Config Uses `${workspaceFolder}` Variable

| Aspect | Detail |
|--------|--------|
| Config file | `C:\Users\ADMIN\.cursor\mcp.json` |
| Current args | `["serve", "--mcp", "--path", "${workspaceFolder}"]` |
| Risk | `${workspaceFolder}` may not resolve correctly in stdio mode |
| Fix | Replace with absolute path `D:/Study/Project/QLLaw-main` or remove `--path` |
| Status | **PENDING** — user action required |

---

## Cursor Restart Required

**NO** — MCP tool `codegraph_explore` is already available in the current agent session.

If `codegraph_explore` is NOT visible in future Cursor Agent sessions, restart Cursor completely.

---

## Files Created/Changed

| File | Action |
|------|--------|
| `scripts/audit/probe-codegraph-stack.ps1` | Created — 11-step healthcheck script |
| `docs/audit/codegraph-stack/latest.json` | Created — machine-readable health report |
| `docs/audit/codegraph-stack/latest.md` | Created — human-readable health report |
| `.cursor/rules/50-codegraph-context.mdc` | Updated — documented correct `CallMcpTool` usage |

---

## Next Step for Planner

**READY_FOR_CODEGRAPH_RETRY**

CodeGraph is confirmed working. Next task should retry BM-096 review with `codegraph_explore` via `CallMcpTool`:

```
Ask: "Use codegraph_explore to answer: How does audit-forms-root-cause.mjs 
analyze document.diaChi in BM-096? What issues does it emit?"
```

Then update `planner-handoff.latest.json` with `codeGraphHealth` block showing `exploreQuerySucceeded: true`.

---

## MCP Config Recommendation

Current config at `C:\Users\ADMIN\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp", "--path", "${workspaceFolder}"]
    }
  }
}
```

Recommended (replace `${workspaceFolder}` with absolute path):

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp", "--path", "D:/Study/Project/QLLaw-main"]
    }
  }
}
```

Or simpler (serve from project directory):

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

After editing, restart Cursor completely.
