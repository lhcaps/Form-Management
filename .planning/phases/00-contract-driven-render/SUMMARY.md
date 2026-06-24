# Phase 0 — Summary: Contract-Driven Render & Form Schema

> Plan: `PLAN.md` v2.3 (locked 2026-06-25)
> Phase A → F → G → H → I → J → C → D
> Tracked here: actual execution results per task.

## Task A1. Initialize canonical `render_payload_snapshot` trong `createBatch`

**Status**: ✅ DONE (2026-06-25)

### Files changed

- `apps/api/src/modules/documents/documents.service.ts` — extended `render_payload_snapshot` in `createBatch` with 4 canonical keys.
- `apps/api/src/modules/documents/documents.service.spec.ts` *(new)* — unit test asserting the 7 contract assertions from PLAN.md v2.3 §A1.

### Snapshot shape implemented

```ts
render_payload_snapshot = {
  case: { id, caseCode, caseTitle, currentStage, currentStatus },     // unchanged
  target: { personId, personName },                                    // unchanged
  template: { id, templateCode, templateNo, templateName, renderScope }, // unchanged
  formats: plan.formats,                                              // unchanged
  formInputs: {},                // new
  payloadOverrides: {},          // new
  renderPayloadOverrides: {},    // new
  contractMeta: {                // new
    templateCode: item.templateCode,
    sourceId: null,
    contractVersionHash: null,
    contractLookupStatus: 'MISSING',
  },
}
```

- Existing `case` / `target` / `template` / `formats` fields preserved exactly — only additive change.
- `updateFormInputs` deep-merge semantics untouched (it writes into `formInputs`, never replaces the whole snapshot).
- `document-renderer.service.ts` not modified (hard constraint #1).

### `contractMeta` lookup decision

Used the **safe fallback** path — `sourceId: null`, `contractVersionHash: null`, `contractLookupStatus: 'MISSING'`.

Reason: the existing `DbFormContractRepository.findByIdentifier()` is NOT a cheap O(1) lookup. It does a `findMany` on all templates and filters in JavaScript, which violates hard constraints #7, #8, #9 of A1 (no scanning 213 contracts, hot path must stay cheap). Wiring a real lookup belongs to a later task:

- `TODO(PLAN.md v2.3 C1/J1)` comment left in the snapshot block pointing to:
  - `prisma.form_contract_versions.findFirst({ where: { template_id, status: 'PUBLISHED' }, orderBy: { updated_at: 'desc' }, take: 1 })` — single-row indexed query that uses `idx_form_contract_template_status` (already exists on the table).
  - Wired once J1 (contract cache) + C1 (startup guard) land.

No logger was added to `DocumentsService` (the service has no existing logger pattern; per task spec we must not introduce a new logging framework).

### Commands run

| Command | Exit | Result |
|---------|------|--------|
| `pnpm test:api -- --testPathPatterns=documents` | 0 | 13 suites, 103 tests pass (100 pre-existing + 3 new) |
| `pnpm typecheck` (api + form-contracts + web) | 0 | clean |
| `pnpm --filter api exec eslint src/modules/documents/documents.service.ts` | 0 | 0 errors (spec file is project-level ignore per `apps/api/eslint.config.mjs:17`) |

### Test result

`src/modules/documents/documents.service.spec.ts` — 3 tests, all green:

1. `initializes render_payload_snapshot with the canonical shape on newly created documents`
   - asserts `formInputs`, `payloadOverrides`, `renderPayloadOverrides` exist and equal `{}`.
2. `initializes contractMeta with the expected envelope`
   - asserts `contractMeta` exists, `templateCode` matches item, `contractLookupStatus` ∈ `{FOUND, MISSING, STALE}` (currently `MISSING` per the fallback).
3. `preserves existing case, target, template, formats fields on the snapshot`
   - asserts legacy keys still present (backward compat for existing 100 tests + 211 historical API tests).

The 3-test split covers the 7 required assertions specified in the task brief.

### Backward compatibility

- `updateFormInputs` (form-studio controller) untouched — it deep-merges into `formInputs`, which is now always present on new snapshots.
- Existing `generated_documents` rows with the old shape (no `formInputs` / `contractMeta`) remain readable because:
  - The renderer defensively handles missing keys (it falls back to existing code paths when these are absent).
  - Phase I (migration of legacy snapshots) will backfill them, but that is out of scope for A1.
- No `forms-contracts` lookup call added in `createBatch` — hot path stays cheap (no DB round-trip per item).

### Risks / Open

- **Risk**: BM-specific code paths reading the snapshot may have been coded assuming the old shape. Mitigated by:
  - Reading the existing renderer + pre-export code: they only consume `case / target / template / formats` and treat any extra keys as opt-in.
  - Out of A1 scope: I did not grep every consumer to confirm.
- **Risk**: The fallback `MISSING` is honest about missing metadata but does not surface it loudly. Per task spec we do NOT add a logger; consumers reading the new `contractMeta` can decide whether to show a warning badge. A2 (structured validation) is the right place to surface contract drift to the user.
- **Open**: Real O(1) lookup will land with J1 (contract cache). Until then, the contract sync guard C1 cannot rely on per-document lookup to fail startup — that is by design and already documented in the TODO.

### Next step

A2 — Structured validation error contract (`contract-form-inputs.service.ts`). Follow PLAN.md v2.3 §A2 exactly. Stop after A2.
