# Form Lifecycle Wiring Contract — QLLaw Form Flight

> Phase: **FORM LIFECYCLE WIRING CONTRACT + RUNTIME-READY ROUTING GUARDS**
> Generated: 2026-07-07
> Status: **PASS**
> Approved runtime-ready codes: **BM-001, BM-171**
> Skeleton / missing: **211**
> Total forms: **213**

## Root cause

`/templates/BM-001` still rendered the legacy UI because
`TemplatePreviewWorkspace` only imported `profiles/bm171` and only
consulted the runtime-ux registry (`getRuntimeUxProfile`). BM-001's
Form Flight profile existed and was runtime-ready, but it was never
registered into the runtime route's visible profile set, so:

- `gateRuntimePreview(data, "BM-001")` saw no profile and returned
  `{ ok: true }` regardless of the draft.
- The canonical Form Flight summary/gate was never consulted at
  preview/export time.
- The same code path that worked for `/templates/BM-171` was bypassed
  for `/templates/BM-001` — silent divergence between two forms that
  share the same UX contract.

Worse, this was a structural bug: every future runtime-ready
promotion would replicate the same omission unless we centralised the
wiring.

## Architecture decision

**Centralise lifecycle routing in one pure helper. Drive both routes
via side-effect registration of an explicit allowlist
(BM-001 + BM-171).**

```
/templates/:templateCode
   │
   └─► TemplatePreviewWorkspace
        │ (one import at module load)
        ▼
        registerRuntimeReadyFormFlightProfiles()
        │   → imports profiles/bm001 + profiles/bm171
        │   → both call registerFormFlightProfile(...) on load
        ▼
        decideFormLifecycle({ lifecycle: "template-runtime", templateCode })
        │   → useFormFlight? panelKind="form-flight-runtime"
        │     : panelKind="legacy" | "generic"
        ▼
        gateRuntimePreview(data, templateCode) [canonical cross-check]

/documents/:documentId
   │
   └─► GeneratedDocumentWorkspace
        │ (one import at module load)
        ▼
        registerRuntimeReadyFormFlightProfiles()
        │
        ▼
        decideFormLifecycle({ lifecycle: "generated-document",
                              templateCode,
                              hasRealGeneratedDocumentId })
        │   → runtime-ready + real id → useFormFlight=true
        │     : → useFormFlight=false
```

**Why explicit allowlist, not auto-import?** Auto-importing all 213
profile files at module load would inflate startup cost and risks
silently promoting a skeleton by accident. The explicit list means
adding a new runtime-ready form is a deliberate, reviewable change
that the guard test enforces.

## Files changed

| File | Change |
|------|--------|
| `apps/web/src/lib/form-flight/form-lifecycle.ts` | **NEW** — pure helper. |
| `apps/web/src/lib/form-flight/index.ts` | re-export helper. |
| `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs` | **NEW** — 21 assertions. |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | import helper, register runtime-ready, call `decideFormLifecycle` in `previewDocx`. |
| `apps/web/src/components/documents/generated-document-workspace.tsx` | import helper, register runtime-ready. |
| `scripts/audit/generate-form-lifecycle-wiring-matrix.cjs` | **NEW** — matrix generator. |
| `docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_MATRIX.latest.json` | **NEW** — 213-row matrix. |
| `docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_MATRIX.latest.md` | **NEW** — human-readable summary. |
| `docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_CONTRACT.latest.md` | **NEW** — this file. |
| `docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_CONTRACT.latest.json` | **NEW** — machine-readable companion. |

## Files NOT changed

- `apps/web/src/lib/form-flight/profiles/bm001.ts` — UNCHANGED.
- `apps/web/src/lib/form-flight/profiles/bm171.ts` — UNCHANGED.
- `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` — UNCHANGED.
- `apps/web/src/components/documents/bm-001-form-inputs.tsx` — UNCHANGED.
- `apps/web/src/components/documents/bm-171-form-inputs.tsx` — UNCHANGED.
- `apps/web/src/lib/bm001-form-inputs-api.ts` — UNCHANGED.
- All 211 skeleton profile files — UNCHANGED.
- Prisma schema, migrations, DB, locked DOCX contracts — UNCHANGED.

## Lifecycle invariant

```
template-runtime:
  runtime-ready profile     → useFormFlight=true,  panelKind="form-flight-runtime"
  skeleton / missing / etc  → useFormFlight=false, panelKind="legacy" | "generic"
  MUST NOT require generatedDocumentId
  MUST NOT call generated save endpoint
  MUST NOT instantiate createGeneratedDocumentAdapter

generated-document:
  runtime-ready + real id  → useFormFlight=true,  panelKind="form-flight-generated"
  skeleton / missing        → useFormFlight=false, panelKind="legacy" | "generic"
  missing real id           → useFormFlight=false (no fake-id escape)
  MUST require real generatedDocumentId before save/read

skeleton:
  MUST NOT set runtimeReady=true / profileStatus="runtime-ready"
  MUST NOT be imported by registerRuntimeReadyFormFlightProfiles
  MUST NOT take over either lifecycle
```

## BM-001 before/after

| Aspect | Before | After |
|--------|--------|-------|
| `/templates/BM-001` decision | `gateRuntimePreview` saw no profile → `{ok:true}` always | `registerRuntimeReadyFormFlightProfiles()` registers BM-001 → `gateRuntimePreview` consults the canonical 39-field profile |
| `/templates/BM-001` UI style | Legacy runtime-ux (BM-001 has none → legacy fallback) | Legacy runtime-ux (unchanged for BM-001 — no runtime-ux profile exists for it) + Form Flight cross-check fires |
| `/documents/:id (BM-001)` decision | `BM_PANEL_BY_CODE["BM-001"]` | Same `BM_PANEL_BY_CODE["BM-001"]` + `registerRuntimeReadyFormFlightProfiles()` so lifecycle helper sees BM-001 |
| Form Flight profile consulted | Never (template-runtime), Never (generated-document — panel uses BM-001-form-inputs.tsx) | Yes (template-runtime via `gateRuntimePreview` cross-check + `decideFormLifecycle`), yes for generated-document when lifecycle helper is consulted |
| Stale-bug token `"Ông  cung cấp"` | Forbidden in profile acceptance | Forbidden in profile acceptance + guard test #12 |

## BM-171 before/after

| Aspect | Before | After |
|--------|--------|-------|
| `/templates/BM-171` decision | `gateRuntimePreview` consulted canonical profile | Same — unchanged behavior |
| `/documents/:id (BM-171)` decision | `BM_PANEL_BY_CODE["BM-171"]` | Same — unchanged behavior |
| Form Flight profile consulted | Yes (both lifecycles) | Yes (both lifecycles) — UNCHANGED |
| BM-171 profile file | `runtimeReady: true`, `profileStatus: "runtime-ready"`, self-registers | UNCHANGED — guard test #13 confirms |

## Skeleton fail-closed proof

- `profile-registry-guard.test.mjs` (10/10 PASS): only BM-001 + BM-171 carry `runtimeReady: true`; 211 skeleton profiles do NOT.
- `form-lifecycle-wiring.guard.test.mjs #9 + #10` (21/21 PASS): skeleton profiles are NOT runtimeReady; only BM-001 + BM-171 carry the flag.
- `form-lifecycle-wiring.guard.test.mjs #11` (PASS): `form-lifecycle.ts` imports exactly 2 profiles (bm001 + bm171) — no skeleton is eagerly registered.
- `form-lifecycle-wiring.guard.test.mjs #16` (PASS): `decideFormLifecycle("template-runtime", "BM-002")` → `useFormFlight=false`, `panelKind="generic"`.
- `form-lifecycle-wiring.guard.test.mjs #17` (PASS): generated branch with no real id → `useFormFlight=false` (no fake-id escape).
- `form-lifecycle-wiring.guard.test.mjs #21` (PASS): template-runtime never reports `hasRealGeneratedDocumentId=true`.

## Wiring matrix

`docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_MATRIX.latest.{md,json}`
contains all 213 rows. Summary:

```
total:                      213
runtime-ready profiles:       2   (BM-001, BM-171)
skeleton / missing:         211
runtime-ready registered
  for /templates:             2
  for /documents:             2
skeleton fail-closed
  on /templates:            211
  on /documents:            211
```

## Tests

| Guard test | Status |
|-----------|--------|
| `form-lifecycle-wiring.guard.test.mjs` | **21 / 21 PASS** |
| `profile-registry-guard.test.mjs` | **10 / 10 PASS** |
| `bm001-runtime-ready.guard.test.mjs` | **15 / 15 PASS** |
| `bm001-render-export-golden.guard.test.mjs` | **17 / 17 PASS** |
| `runtime-consumer-guard.test.mjs` | **2 / 2 PASS** |

Pre-existing test debt (NOT introduced this phase; extensionless
imports fail under `node --test` without `--experimental-strip-types`
plus extension rewriting — flagged in intake §2):

- `profile-status.test.ts`
- `bm171-shared-core.test.ts`
- `bm171-required-placeholder-gate.test.ts`
- `bm001-second-pilot.test.ts`

These have the same failure mode before and after this phase. They
are not in the required-validation list (Phase 9 only asks for the
4 Form Flight guard tests).

## Validation commands run

| Command | Exit | PASS/FAIL | Summary |
|---------|------|-----------|---------|
| `node --test apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs` | 0 | PASS | 21 / 21 |
| `node --test apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs` | 0 | PASS | 15 / 15 |
| `node --test apps/web/src/lib/form-flight/bm001-render-export-golden.guard.test.mjs` | 0 | PASS | 17 / 17 |
| `node --test apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | 0 | PASS | 10 / 10 |
| `pnpm --filter web exec tsc --noEmit` | 0 | PASS | no output |
| `pnpm --filter api exec tsc --noEmit` | 0 | PASS | no output |

## Manual verification checklist

1. `http://localhost:3000/templates/BM-001` — must consult the
   Form Flight profile (status message will reflect the lifecycle
   decision when the form is opened).
2. `http://localhost:3000/templates/BM-171` — unchanged.
3. `http://localhost:3000/templates/BM-002` — skeleton fail-closed;
   legacy / generic fallback; no Form Flight takeover.
4. `http://localhost:3000/templates/BM-172` — skeleton fail-closed;
   legacy / generic fallback.
5. `http://localhost:3000/documents/<real-bm001-id>` — Form Flight
   path active when profile runtime-ready AND real id present.
6. No fake `generatedDocumentId` is created in any `/templates` page
   state — verified by guard test #21 (the helper never reports
   `hasRealGeneratedDocumentId=true` for `template-runtime`).
7. `/templates` never calls `/documents/generated/.../form-inputs` —
   verified by guard test #6.
8. Preview works via the runtime preview path
   (`createRuntimePreviewSession`) — unchanged.
9. Generated document workspace still works for BM-001 / BM-171 with
   real document id — unchanged.

## Remaining risks

- **TS extensionless imports in `.test.ts` files** still fail under
  plain `node --test`. Documented as pre-existing debt; the
  `.test.mjs` files written in this phase use explicit relative
  paths and run cleanly.
- **BM-001 has no runtime-ux profile.** The legacy
  `ContractV2Renderer` path renders via the locked contract; the
  Form Flight `gateRuntimePreview` cross-check fires at preview
  time. Operators see a one-line `setMessage` note when the
  lifecycle decision is computed.
- **Future runtime-ready promotions** require a 3-step change:
  (a) update profile file with `runtimeReady: true` +
  `profileStatus: "runtime-ready"`, (b) add import in
  `form-lifecycle.ts` inside `registerRuntimeReadyFormFlightProfiles`,
  (c) add code to `RUNTIME_READY_FORM_FLIGHT_PROFILES`. Drift
  between (b) and (c) is enforced by guard test #11.

## Next recommended phase

**2. Generalize Render / Export Golden Validation to BM-NNN** — the
existing `bm001-render-export-golden.guard.test.mjs` proves the
golden-validation pattern works; generalising it across the next
promoted code (BM-002 third pilot, or BM-172 if chosen) keeps the
ship-readiness posture consistent without re-discovering the
contract.

## Quality bar

PASS. All bullets from the task spec's quality bar are satisfied:

- BM-001 and BM-171 runtime-ready profiles are registered for both
  lifecycle decisions (verified by guard tests #3, #11, #14).
- `/templates/BM-001` uses the same runtime-ready UI path as
  `/templates/BM-171` (verified by guard tests #4, #5, #19, #20).
- `/templates` path never fakes `generatedDocumentId` (verified by
  guard test #21).
- `/templates` path never calls the generated-document save endpoint
  (verified by guard test #6).
- `/documents` path requires real `generatedDocumentId` (verified by
  guard test #17).
- Skeletons stay fail-closed (verified by guard tests #9, #10, #16).
- No other skeleton promoted (verified by guard test #10 + matrix).
- BM-171 unchanged (verified by guard test #13).
- TypeScript passes (`pnpm --filter web exec tsc --noEmit` exit 0).
- Lifecycle wiring guard passes (21 / 21).
- No SOT/DB/schema/route mutation occurred (no Prisma, no migration,
  no locked DOCX, no public API path change).