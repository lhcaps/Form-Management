# Form Lifecycle Wiring Matrix — QLLaw Form Flight

> Phase: **FORM LIFECYCLE WIRING CONTRACT + RUNTIME-READY ROUTING GUARDS**
> Generated: 2026-07-07
> Source: `docs/audit/unified-bm-workspace/QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json`
> Profiles dir: `apps/web/src/lib/form-flight/profiles`
> Approved runtime-ready codes (this phase): **BM-001, BM-171**
> Guard test: `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs`

This matrix is the operational record of which lifecycle path is
selected for every template. It is the single source of truth used by
the guard tests and by the human auditors when they need to confirm a
specific form is wired correctly.

## Lifecycle paths

```
/templates/:templateCode  → template-runtime    → decideFormLifecycle(...)
                                                → useFormFlight? form-flight-runtime : legacy|generic
/documents/:documentId    → generated-document  → decideFormLifecycle(..., hasRealGeneratedDocumentId)
                                                → useFormFlight? form-flight-generated : legacy|generic
```

Both lifecycles call the same pure helper. The helper reads the Form
Flight registry (`getFormFlightProfile(templateCode)`), the
runtime-readiness guard (`isRuntimeReadyProfile`), and the explicit
`RUNTIME_READY_FORM_FLIGHT_PROFILES` allowlist.

## Summary

| Metric                                  | Count |
|-----------------------------------------|-------|
| Total forms in the verified extract     | **213** |
| Runtime-ready profiles (BM-001, BM-171) | **2** |
| Skeleton / no-profile (fail-closed)     | **211** |
| Runtime-ready registered for `/templates` | **2** |
| Runtime-ready registered for `/documents` | **2** |
| Skeletons fail-closed on `/templates`   | **211** |
| Skeletons fail-closed on `/documents`   | **211** |

## Required rows (BM-001 / BM-171 / BM-002 / BM-003 / BM-172)

| Code | Profile Status | Template Runtime Panel | Generated Document Panel | Registered Runtime | Registered Generated | Safe? | Notes |
|------|----------------|------------------------|--------------------------|--------------------|----------------------|-------|-------|
| BM-001 | runtime-ready | form-flight-runtime | form-flight-generated | YES | YES | YES | BM-001 second pilot — runtime-ready (Form Flight + runtime-ux-free). Template path now imports Form Flight profile via form-lifecycle helper. |
| BM-002 | skeleton | legacy/generic fallback | legacy/generic fallback (BM panel or generic) | NO | NO | YES | Skeleton / no profile — fail-closed; legacy / generic UI. |
| BM-003 | skeleton | legacy/generic fallback | legacy/generic fallback (BM panel or generic) | NO | NO | YES | Skeleton / no profile — fail-closed; legacy / generic UI. |
| BM-171 | runtime-ready | form-flight-runtime | form-flight-generated | YES | YES | YES | BM-171 canonical — runtime-ready (Form Flight + runtime-ux profile). Unchanged behavior. |
| BM-172 | skeleton | legacy/generic fallback | legacy/generic fallback (BM panel or generic) | NO | NO | YES | Skeleton / no profile — fail-closed; legacy / generic UI. |

## Wiring invariants

1. **No skeleton takeover.** Skeleton profiles NEVER set
   `runtimeReady: true` / `profileStatus: "runtime-ready"`. The
   `isRuntimeReadyProfile` guard returns false, the lifecycle helper
   returns `useFormFlight: false`, and the legacy / generic path
   renders instead. Verified by `profile-registry-guard.test.mjs`.
2. **No template fakes generatedDocumentId.** The template-runtime
   branch in `decideFormLifecycle` returns
   `hasRealGeneratedDocumentId: false` unconditionally. The
   `template-preview-workspace.tsx` does NOT import the generated
   save API and does NOT instantiate `createGeneratedDocumentAdapter`.
3. **Generated requires real id.** The generated-document branch only
   sets `useFormFlight: true` when `hasRealGeneratedDocumentId` is
   truthy AND the profile is runtime-ready. False-positive ids
   (empty string, `"unknown"`, `"UNKNOWN"`) are rejected because the
   helper treats only truthy values as "real".
4. **BM-171 unchanged.** The BM-171 profile file, the BM-171 UX
   profile, and the BM-171 panel are NOT modified in this phase.
5. **No other skeleton promoted.** Adding a new runtime-ready form
   means: (a) update the profile file with `runtimeReady: true` +
   `profileStatus: "runtime-ready"`, (b) append the import to
   `apps/web/src/lib/form-flight/form-lifecycle.ts`,
   `registerRuntimeReadyFormFlightProfiles`, (c) add the code to
   `RUNTIME_READY_FORM_FLIGHT_PROFILES`. The guard test fails the
   build when (b) and (c) drift.

## Files involved

- `apps/web/src/lib/form-flight/form-lifecycle.ts` — new pure helper.
- `apps/web/src/lib/form-flight/index.ts` — re-exports.
- `apps/web/src/lib/form-flight/profiles/bm001.ts` — registered.
- `apps/web/src/lib/form-flight/profiles/bm171.ts` — registered.
- `apps/web/src/components/documents/template-preview-workspace.tsx`
  — registers the runtime-ready set at module load, calls
  `decideFormLifecycle(...)` in `previewDocx`.
- `apps/web/src/components/documents/generated-document-workspace.tsx`
  — registers the runtime-ready set at module load so the
  `generated-document` branch of the lifecycle helper sees BM-001
  / BM-171 too.
- `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs`
  — new guard test (source-text + registry).

## How to verify a specific form

```bash
# 1. Is the form registered runtime-ready?
node -e "const f=require('fs').readFileSync('apps/web/src/lib/form-flight/profiles/bmXXX.ts','utf8'); console.log(/runtimeReady:\s*true/.test(f),/profileStatus:\s*\"runtime-ready\"/.test(f));"

# 2. Does the template route see it?
grep -c "registerRuntimeReadyFormFlightProfiles" apps/web/src/components/documents/template-preview-workspace.tsx

# 3. Does the lifecycle helper return useFormFlight=true?
node --test apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs
```

## Next-action decision

The wiring is centralized and tested. Adding a new runtime-ready
form requires only the three-step change listed in invariant #5 —
no per-route rewrite, no per-panel rewrite.