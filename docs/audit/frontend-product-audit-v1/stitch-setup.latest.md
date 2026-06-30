# STITCH Skills Setup Report

> Generated: 2026-06-30

## Installation Status

| Item | Status | Details |
|------|--------|---------|
| Stitch CLI (plugins) | Available | v1.3.1 |
| Stitch CLI (skills) | Available | v1.5.14 |
| Stitch Repository | Discovered | google-labs-code/stitch-skills |
| Stitch Plugins Installed | Yes | 3 plugin packages installed |
| Cursor MCP Server | Not Configured | Only CodeGraph MCP is configured |

## Plugins Installed

```
stitch-build      — 4 skills  — Code generation and build tools
stitch-design     — 6 skills  — Design workflows (code-to-design, etc.)
stitch-utilities  — 4 skills  — Design utilities (generate DESIGN.md, etc.)
```

## Installation Command

```bash
npx plugins add google-labs-code/stitch-skills --target cursor --scope workspace --yes
```

## MCP Server Status

### Current Configuration (C:\Users\ADMIN\.cursor\mcp.json)

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

### Missing: Stitch MCP Server

Stitch skills were installed to Cursor workspace directory but the Stitch MCP server is not configured in `mcp.json`. The Stitch MCP would provide real-time design extraction capabilities.

## Available Stitch Skills

Based on the 3 installed plugin packages, the following skills are available:

### stitch-build (4 skills)
- Code generation tools
- Build workflow integration

### stitch-design (6 skills)
- `stitch::extract-design-md` — Extract design documentation from code
- `stitch::extract-static-html` — Extract static HTML snapshots
- `stitch::code-to-design` — Convert code to design documentation
- `stitch::manage-design-system` — Manage design system tokens
- `stitch::generate-design` — Generate design from specifications
- `stitch::react-components` — React component generation

### stitch-utilities (4 skills)
- Design utilities
- DESIGN.md generation

## Impact on Audit

### Can Use Now
- Manual design system audit (without Stitch MCP)
- Code analysis via CodeGraph MCP
- Static file inspection

### Cannot Use (MCP not configured)
- `stitch::extract-design-md` — Requires Stitch MCP server
- `stitch::extract-static-html` — Requires running dev server + Stitch MCP
- `stitch::code-to-design` — Requires Stitch MCP server

### Recommendation for Implementation Phase

To fully leverage Stitch in Phase 2, add the Stitch MCP server to `mcp.json`:

```json
{
  "mcpServers": {
    "codegraph": { ... },
    "stitch": {
      "type": "stdio",
      "command": "stitch",
      "args": ["serve", "--mcp"]
    }
  }
}
```

However, the Stitch MCP server binary may not be available locally (it would need to be installed separately). The Stitch skills installed are Cursor workspace skills, not MCP tools.

## STITCH_AVAILABLE Flag

```
STITCH_AVAILABLE=false
reason=MCP server not configured. CLI tools available but real-time design extraction requires Stitch MCP server.
canUseForImplementation=false
```

The manual design-system audit will proceed using:
1. CodeGraph for architecture mapping
2. Direct file inspection
3. Component/style analysis
4. User workflow trace
