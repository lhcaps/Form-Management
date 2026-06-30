# Baseline Snapshot — QUANLYVKS Frontend Product Audit V1

> Generated: 2026-06-30T17:54:00+07:00

## Git Status

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD | `22eef171` |
| Git Status | CLEAN |
| Last Commit | `chore(audit): refresh post-merge audit snapshots — 0 blockers, 213/213, 100% sample data, 0 root-cause issues` |

## Recent Commits

```
22eef171 chore(audit): refresh post-merge audit snapshots — 0 blockers, 213/213, 100% sample data, 0 root-cause issues
ebeb6938 Merge branch 'fix/documents-canonical-render-payload-snapshot'
4be52355 chore(audit): refresh final workflow acceptance evidence
582c9fe1 chore(audit): refresh decision gate for HEAD 102062e9
102062e9 chore(audit): refresh final readiness verification evidence
00bb8c96 test(reports): add primary workflow acceptance gate
b12494e3 fix(forms): close remaining 213 readiness blockers
86dffc36 fix(forms): remove stale form input hint controls
9c58cce5 feat(forms): complete generated sample data coverage
ee2cfa6e docs(audit): regenerate requirement acceptance matrix as READY_ABSOLUTE
```

## Backend/Form Readiness

| Check | Status |
|-------|--------|
| Form Contracts | 213/213 PASS |
| C2 DB Sync | PASS |
| C3 Locked/Compiled | PASS |
| Sample Data | 1735/1735 PASS (100%) |
| SOT Semantic Issues | 0 |
| Root-cause Issues | 0 |
| Strict Gate | PASS |
| Workflow DOCX Export | PASS |
| Overall | **READY_ABSOLUTE_VERIFIED** |

## Frontend Tests

| Test Suite | Result |
|------------|--------|
| Typecheck | PASS |
| Web Unit Tests | 59/59 PASS |
| Duration | 712.76ms |

### Unit Test Details
- API error handling tests (8 tests)
- Case payload application tests (16 tests)
- BM field mapping tests (25 bespoke + 4 flat)
- Form schema fetch tests (3 tests)
- Error parsing tests (8 tests)
- Report generation tests (2 tests)
- Lifecycle state mapping tests (3 tests)
- Utility function tests (12 tests)

## Website Requirement Acceptance

| Category | Count |
|----------|-------|
| Total | 57 |
| PASS | 54 |
| PARTIAL | 0 |
| FAIL | 0 |
| NOT_DETECTABLE | 3 |
| NOT_TESTED | 0 |
| Overall | **READY_ABSOLUTE** |

## Blocker Burn-down

| Metric | Value |
|--------|-------|
| Total Blockers | 0 |
| Auto-fixable | 0 |
| Human Review Required | 0 |

## Stitch Skills Availability

| Item | Status |
|------|--------|
| Stitch CLI | Available |
| Stitch Plugins | Installed (3 packages) |
| Stitch MCP Server | **Not Configured** |
| CodeGraph MCP | Configured |

**Note**: Stitch skills are installed to Cursor workspace but the Stitch MCP server is not running. Design extraction will proceed manually.

## Current Frontend Routes Checked

From the codebase, the following routes are available:

```
/template-selector        — Template selector workspace
/forms/[templateId]      — Generated form editor (BM-XXX)
/reports                 — Reports dashboard
/login                   — Authentication (if present)
```

## Conclusion

The backend and form-engine layer is **READY_ABSOLUTE**. The focus for this audit is frontend productization.

**Frontend Status: NEEDS_FE_FIXES** (based on observed UI screenshots showing debug/dev labels)
