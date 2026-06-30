# Handoff Schema Consistency Note

**Date:** 2026-06-28
**Issue:** After-apply handoff `safetyAssertions.noDbPublish` inconsistent with actual DB publish/sync run.

---

## The Problem

The BM-062 after-apply handoff contained:

```json
"safetyAssertions": {
  "noDbPublish": true,
  ...
}
```

But the actual execution did:
1. `pnpm contract:compile` — recompiled all 213 contracts
2. `node scripts/audit/audit-contract-sync.mjs` — detected 1 stale (BM-062)
3. `node .../publish-locked-contracts-to-db.mjs` — synced to DB (1 updated, 212 skipped)
4. `node scripts/audit/audit-contract-sync.mjs` — verified 213/0/0 clean

So `noDbPublish: true` was **incorrect** — the DB was published.

---

## Why This Matters

The `safetyAssertions` block is meant to be a **safety checklist**, not a **task log**. It says "nothing bad happened" — but here it says "I didn't publish" when actually "I did publish." This creates false confidence in audit trails.

If a future agent or human reads the handoff and sees `noDbPublish: true`, they might incorrectly assume the DB was never touched, when in fact it was successfully synced.

---

## Proposed Schema Correction

Replace `noDbPublish: true/false` in after-apply handoffs with granular fields:

```json
{
  "safetyAssertions": {
    "dbPublishRun": true,
    "dbPublishCommand": "node scripts/docx-contract/publish-locked-contracts-to-db.mjs",
    "dbPublishResult": {
      "created": 1,
      "skipped": 212,
      "failed": 0
    },
    "dbSyncRun": true,
    "dbSyncClean": true,
    "dbSyncCounts": {
      "matched": 213,
      "missing": 0,
      "stale": 0
    },
    "compileRun": true,
    "compileStatus": "PASS"
  }
}
```

### Semantic meaning

| Field | Meaning |
|---|---|
| `dbPublishRun` | Did we call publish script? |
| `dbPublishCommand` | What command was used? |
| `dbPublishResult` | Script output (counts) |
| `dbSyncRun` | Did we verify sync after publish? |
| `dbSyncClean` | Were all 3 counts (matched/missing/stale) clean? |
| `dbSyncCounts` | Exact counts at time of check |
| `compileRun` | Did we recompile? |
| `compileStatus` | PASS/FAIL |

### What to do with `noDbPublish`

- **Do NOT backfill** existing handoffs — that would be a retroactive lie
- **Do NOT mutate** existing artifacts — just note the schema issue
- **Use new schema** in all future apply scripts

---

## Action Items

1. Update `apply-bm062-signature-placeholder-renormalization-approved.mjs` to use new schema on next run (or leave as-is since write already happened)
2. Update the apply runner template for future apply tasks to use granular DB fields
3. Document this schema rule in the after-apply handoff template
