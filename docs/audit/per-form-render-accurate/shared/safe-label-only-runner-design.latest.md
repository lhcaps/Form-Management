# SAFE_LABEL_ONLY One-BM Runner — Design

Generated: 2026-06-06-27T16:45:00.000Z
Task: SAFE_LABEL_ONLY_RUNNER_DESIGN

---

## Pilot Baseline

| Item | Value |
|------|-------|
| Pilot BM | BM-002 |
| Source ID | `BM-002__f78301178da7` |
| Applied | 2026-06-27T09:10:56 |
| BAD_LABEL delta | -10 (10 → 0) ✅ exact |
| UI_VISIBLE delta | -9 (9 → 0) ✅ exact |
| Pattern | **Validated** |

---

## Principle

> One BM per invocation. Reads approved decisions. Dry-run default. Explicit `--write`.

Do NOT create a BM-specific apply script for every BM. Instead, create one generic runner that reads a structured approved-decision file.

---

## Architecture

```
Entry:     scripts/audit/apply-safe-label-only.mjs
Input:     docs/audit/per-form-render-accurate/<BM>/approved/decisions.approved.json
Output:    docs/audit/per-form-render-accurate/<BM>/apply-reports/apply.latest.json
Closure:   docs/audit/per-form-render-accurate/<BM>/closure/closure.latest.json
Backup:    docs/audit/per-form-render-accurate/<BM>/backups/<timestamp>/
```

### Usage

```bash
# Dry-run (default)
node scripts/audit/apply-safe-label-only.mjs BM-001

# Apply
node scripts/audit/apply-safe-label-only.mjs BM-001 --write

# Verbose
node scripts/audit/apply-safe-label-only.mjs BM-001 --verbose
```

---

## Hygiene Requirements

| Issue | Rule |
|-------|------|
| Array count logging | **Dynamic** — log actual `contract.canonicalFields.length`, never hardcoded literals |
| sourceId guard | **Exact match** — no `startsWith` |
| Unused imports | **None allowed** — all imports must be used |
| Guard failure messages | Include expected vs actual values |
| Count guards | Assert actual counts match approved decision |

---

## Guards (in order)

| # | Guard | Check | Abort on fail |
|---|-------|-------|--------------|
| 1 | templateCode exact | `contract.templateCode === approved.templateCode` | Yes |
| 2 | sourceId exact | `contract.sourceId === approved.sourceId` | Yes |
| 3 | Approved decision file exists | File read succeeds | Yes |
| 4 | canonicalFields count | Pre-read count matches post-change count | Yes |
| 5 | docxSlots count unchanged | Pre-read count === post-read count | Yes |
| 6 | renderBindings count unchanged | Pre-read count === post-read count | Yes |
| 7 | No path changes | Every `canonicalFields[N].path === approved.path` | Yes |
| 8 | No old label mismatch | Every `canonicalFields[N].label === approved.oldValue` | Yes |
| 9 | Only label fields changed | Proposed JSON === original except `canonicalFields[N].label` | Yes |

---

## Pre-Write Checklist

Before writing, verify ALL of:

- [ ] Approved decision file exists and parses
- [ ] templateCode matches exactly
- [ ] sourceId matches exactly (full form)
- [ ] canonicalFields count unchanged
- [ ] docxSlots count unchanged
- [ ] renderBindings count unchanged
- [ ] All paths match approved
- [ ] All old labels match approved
- [ ] No docxSlots label changes in approved decisions
- [ ] No renderBindings changes in approved decisions
- [ ] Backup created successfully

---

## Backup Manifest Fields

```json
{
  "templateCode": "BM-001",
  "sourceId": "BM-001__<sha>",
  "originalContract": "<absolute path>",
  "backupFile": "<absolute path>",
  "backupSha256": "<sha>",
  "timestamp": "<ISO>",
  "approvedCommand": "APPROVE_RENDER_ACCURATE_FORM BM-001 <sourceId> SAFE_LABEL_ONLY",
  "expectedChangesCount": 10,
  "changes": [
    { "index": 3, "path": "...", "array": "canonicalFields", "field": "label", "before": "...", "after": "..." }
  ]
}
```

---

## Post-Apply Validation

After write, run:

```bash
node scripts/audit/audit-rendered-text-fidelity.mjs --template-code <BM>
node scripts/audit/audit-forms-root-cause.mjs --template-code <BM>
```

Report both expected and actual deltas for:

- `BAD_LABEL`
- `UI_VISIBLE_BAD_METADATA`

---

## Approved Decision File Format

See `docs/audit/per-form-render-accurate/<BM>/approved/decisions.approved.json` for the exact schema.

Required fields:
- `templateCode`
- `sourceId` (full form: `BM-XXX__<sha256>`)
- `patchType` (`SAFE_LABEL_ONLY`)
- `changes[].canonicalFieldIndex`
- `changes[].path`
- `changes[].oldValue`
- `changes[].newValue`
- `expectedAuditDelta`

---

## Migration Plan

| From | To | Status |
|------|----|--------|
| `apply-bm002-safe-label-only-render-accurate.mjs` | Generic `apply-safe-label-only.mjs` | **In design** |

The BM-002 script is **preserved as-is** — it is already applied and should not be modified except for hygiene fixes.

All future SAFE_LABEL_ONLY applies use the generic runner.

---

_Design artifact. Do not apply until reviewed._
