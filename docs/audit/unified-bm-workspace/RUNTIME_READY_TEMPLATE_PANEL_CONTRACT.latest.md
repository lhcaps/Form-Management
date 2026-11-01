# Runtime-Ready Template Panel Contract

> Phase: **BM-001 TEMPLATE RUNTIME VISUAL PARITY + GENERALIZABLE RUNTIME-READY FORM CONTRACT**
> Generated: 2026-07-07
> Status: **PASS**
> Approved runtime-ready codes (today): **BM-001, BM-171**
> Skeleton / missing: **211**
> Total forms: **213**

## 1. Purpose

This contract is the small, generalizable bridge between the
form-lifecycle decision (`decideFormLifecycle(...)`) and the *visible*
template panel rendered on `/templates/:templateCode`. Without it,
BM-001 has a runtime-ready Form Flight profile but still renders the
legacy `ContractV2Renderer` with the generic `getSampleData(...)`
heuristic — exactly the regression this phase fixes.

Two lifecycles use this contract:

- `template-runtime` → `/templates/:templateCode`
- `generated-document` → `/documents/:id` (for completeness — same
  `decideFormLifecycle(...)` helper)

## 2. Runtime-ready template panel selector

A single pure helper (`apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.ts`)
exposes one function:

```ts
export type RuntimeReadyTemplatePanelKind =
  | "runtime-ready-template-panel"  // new shared runtime-ready UI path
  | "legacy-template-panel"          // legacy UI that already works for BM-171
  | "generic-template-panel";        // skeleton / fail-closed fallback

export function selectRuntimeReadyTemplatePanel(input: {
  templateCode: string;
  lifecycleDecision: FormLifecycleDecision;
  isRuntimeReadyProfileCode: (code: string) => boolean;
}): { kind: RuntimeReadyTemplatePanelKind; reason: string };
```

### Decision matrix

| `lifecycleDecision.profileStatus` | `lifecycleDecision.lifecycle` | `isRuntimeReadyProfileCode(code)` | Selected `kind` |
|---|---|---|---|
| `runtime-ready` | `template-runtime` | `true` | `runtime-ready-template-panel` |
| `runtime-ready` | `template-runtime` | `false` (drift) | `runtime-ready-template-panel` *(helper still routes; allowlist test catches drift)* |
| `runtime-ready` | `template-runtime` (no profile, profileStatus="missing") | `false` | `legacy-template-panel` |
| `skeleton` | `template-runtime` | `false` | `generic-template-panel` |
| `invalid` / `missing` | `template-runtime` | `false` | `generic-template-panel` |
| any | `generated-document` | any | `legacy-template-panel` *(template-runtime not in scope)* |

## 3. Required behaviour

1. `BM-001` AND `BM-171` resolve to the **same** `kind` — the
   `runtime-ready-template-panel`. Today this is rendered by
   `<ContractV2Renderer uxProfile={getRuntimeUxProfile(templateCode)} />`,
   which is the single component the runtime workspace mounts.
2. `BM-002` (and all other skeletons) resolve to `generic-template-panel`.
3. The `/templates` route MUST NOT require `generatedDocumentId`.
4. The `/templates` route MUST NOT call the generated-document save
   endpoint (`saveDocumentFormInputs`, `saveGeneratedDocumentFormInputs`).
5. Preview uses the runtime preview lifecycle
   (`createRuntimePreviewSession`) — unchanged.
6. Generated document save / read / export remains only under
   `/documents/:id` — unchanged.
7. The selector is **pure**. No React, no fetch, no DOM, no side-effects.
8. The selector is the only thing that decides which kind of panel the
   host renders. The guard test `runtime-ready-template-panel-contract.guard.test.mjs`
   enforces this single-source-of-truth invariant.

## 4. Future BM-NNN promotion checklist

A future form code (e.g. `BM-002`) can use the same path **only** when
every item below holds:

- [ ] `profiles/bmNNN.ts` declares `runtimeReady: true` and
      `profileStatus: "runtime-ready"`.
- [ ] `profiles/bmNNN.ts` has a non-empty `demo:` (synthetic, no real
      PII, matches the locked contract).
- [ ] `profiles/bmNNN.ts` has at least one `summaryLines` entry.
- [ ] `profiles/bmNNN.ts` has `acceptance.requiredText` non-empty.
- [ ] A `runtime-ux` profile exists at
      `lib/runtime-ux/bmNNN-runtime-ux-profile.ts` with sections,
      field overrides, demo aligned to `BMNNN_FORM_FLIGHT_PROFILE.demo`,
      and summary aligned to `BMNNN_FORM_FLIGHT_PROFILE.summaryLines`.
- [ ] `BM-NNN` is appended to `RUNTIME_READY_FORM_FLIGHT_PROFILES`
      (in `apps/web/src/lib/form-flight/form-lifecycle.ts`).
- [ ] `bmNNN-runtime-ux-profile.ts` is imported in
      `apps/web/src/lib/runtime-ux/index.ts` (side-effect registration).
- [ ] `bmNNN.ts` profile is imported by
      `registerRuntimeReadyFormFlightProfiles()` in
      `apps/web/src/lib/form-flight/form-lifecycle.ts`.
- [ ] `selectRuntimeReadyTemplatePanel({ templateCode: "BM-NNN", ... })`
      returns `kind: "runtime-ready-template-panel"` (asserted by
      guard test #4).
- [ ] `decideFormLifecycle({ lifecycle: "generated-document",
      templateCode: "BM-NNN", hasRealGeneratedDocumentId: true })`
      returns `useFormFlight: true`.
- [ ] Render / export golden validation passes (the
      `bm001-render-export-golden.guard.test.mjs` shape, generalised).
- [ ] Browser verification on `/templates/BM-NNN` actually shows the
      runtime-ready UI pattern, not the legacy screenshot.

## 5. Guard test enforcement

`apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs`
asserts (12 invariants):

1. A single canonical selector file exists.
2. The selector is a pure function (no React, no DOM, no fetch).
3. BM-001 resolves to `runtime-ready-template-panel`.
4. BM-171 resolves to `runtime-ready-template-panel`.
5. BM-002 resolves to `generic-template-panel`.
6. BM-002 does NOT resolve to `runtime-ready-template-panel`.
7. Every code in the runtime-ready allowlist resolves to
   `runtime-ready-template-panel`.
8. No skeleton profile resolves to `runtime-ready-template-panel`.
9. The selector never asks for `generatedDocumentId`.
10. The selector never calls the generated-document save endpoint.
11. The `/documents` selector requires real `generatedDocumentId` for the
    generated Form Flight path (mirrored from `decideFormLifecycle`).
12. The selector file is NOT a 213-wide framework: it imports 0
    profile files. Profile registration is the existing barrel's job.

## 6. Explicit non-goals

- Do NOT convert skeletons.
- Do NOT auto-import 213 profiles into the runtime route.
- Do NOT create a full 213-runtime-UI framework in this phase.
- Do NOT touch BM-171 source code.
- Do NOT touch BM-002 source code.
- Do NOT touch the Form Flight `form-lifecycle.ts` allowlist mechanism —
  this contract reuses it.

## 7. Files implementing this contract

| File | Role |
|---|---|
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.ts` | **NEW** — pure selector |
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs` | **NEW** — 12-assertion guard |
| `apps/web/src/lib/runtime-ux/bm001-runtime-ux-profile.ts` | **NEW** — BM-001 runtime-ux profile (sections/fields/demo/summary) |
| `apps/web/src/lib/runtime-ux/index.ts` | MODIFIED — single-line import of BM-001 profile (side-effect register) |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | MODIFIED — uses selector at preview-time and surfaces a banner (no UI regression) |
| `docs/audit/unified-bm-workspace/RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.json` | **NEW** — machine-readable companion |
