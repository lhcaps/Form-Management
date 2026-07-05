# Form Flight Core V1

> Generated: 2026-07-06
> Phase: `FORM_FLIGHT_CORE_SHARED_ADAPTERS_AND_ROLLOUT_FACTORY_V1`
> Scope: **code module** — turns the Form Flight Baseline V1 spec into a real reusable core with two adapters.

## What this artifact is

This is the contract document for the **Form Flight Core V1** code module
(see `apps/web/src/lib/form-flight/`). It records:

1. The shared core surface (profile, payload, validation, summary,
   acceptance, registry).
2. The two adapters (template-runtime, generated-document).
3. The route boundary that protects `/templates/:code` and
   `/documents/:id` from collapsing into one flow.
4. The semantic invariants every adapter and every future profile
   must preserve.

This artifact is read-only. The actual modules live under
`apps/web/src/lib/form-flight/`. The module file paths referenced
here are the source of truth.

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│ apps/web/src/lib/form-flight/                                 │
│                                                               │
│  types.ts          FormFlightMode / FormFlightProfile /      │
│                    FormFlightAdapter / FormFlightPayloadMode  │
│                                                               │
│  payload.ts        buildFormFlightPayload                     │
│                    setFormFlightPath / readFormFlightPath     │
│                                                               │
│  validation.ts     collectFormFlightMissingRequired           │
│                    listFormFlightMissingPaths                 │
│                    snapshotFormFlightFields                   │
│                                                               │
│  summary.ts        resolveFormFlightLine / resolveFormFlight  │
│                                                               │
│  acceptance.ts     scanFormFlightAcceptance                   │
│                                                               │
│  registry.ts       registerFormFlightProfile                  │
│                    getFormFlightProfile                       │
│                    listFormFlightProfiles                     │
│                                                               │
│  profiles/         bm171.ts        (production reference)     │
│                    bm001.ts        (skeleton — second pilot)  │
│                                                               │
│  adapters/                                                    │
│    template-runtime-adapter.ts                                │
│      createTemplateRuntimeAdapter                             │
│      gateRuntimePreview                                       │
│      buildRuntimePreviewPayload                               │
│      resolveRuntimeSummary                                    │
│      acceptRuntimeRenderedText                                │
│      listRuntimeMissingFields                                 │
│                                                               │
│    generated-document-adapter.ts                              │
│      createGeneratedDocumentAdapter                           │
│      gateGeneratedDocumentSave                                │
│      buildGeneratedDocumentSavePayload                        │
│      buildGeneratedDocumentDemoPayload                        │
│      resolveGeneratedDocumentSummary                          │
│      acceptGeneratedDocumentRenderedText                      │
│      listGeneratedDocumentMissingFields                       │
│      assertProfileInvariant                                   │
│                                                               │
│  index.ts         barrel — public surface                     │
└───────────────────────────────────────────────────────────────┘
```

## Core invariants

These are tested by `bm171-shared-core.test.ts`. The same invariants
apply to every future `FormFlightProfile`.

1. `requiredFieldPaths ⊆ fieldPaths` (profile shape).
2. Runtime template adapter and generated document adapter return
   the **same** `fieldPaths` for the same template code.
3. Runtime and document adapters return the **same sanitized
   payload** for the same draft under the same mode.
4. Runtime and document adapters agree on the **missing-required
   list** for the same draft.
5. Missing required fields block both runtime preview/export AND
   generated-document save/render — neither path silently auto-fills.
6. User-typed values at profile paths are preserved by preview,
   export, and save (no silent overwrites).
7. `demo-reset` is the only mode that intentionally overwrites user
   values; it must produce the same result in both adapters.
8. Summary lines for owner-name-style fields render as `—` when
   empty and the typed value when filled (no hardcoded demo strings
   leaking into the quick-check view).
9. Acceptance scanner flags known stale-fallback garbage AND
   missing required anchors; both adapters share the scanner.
10. No route boundary violation: `/templates/:code` writes nothing
    to `generated_documents`, `generated_document_files`, or
    `generated_document_audit_logs`; `/documents/:id` keeps the
    existing DB / file / audit path through the existing backend
    APIs.

## Adapter contract

| Aspect | `TemplateRuntimeAdapter` | `GeneratedDocumentAdapter` |
|---|---|---|
| Persistence | none (local draft) | DB / file / audit through existing backend |
| Save destination | `localStorage` keyed by `templateCode` | `saveDocumentFormInputs(documentId, body)` |
| Draft source | `localStorage` | `getDocumentFormInputs(documentId)` |
| Preview destination | runtime preview session (no DB row) | generated document render call (writes DB row + audit log) |
| Export destination | runtime DOCX export (no file row) | generated document DOCX export (writes file row) |
| Routes it serves | `/templates/:code` | `/documents/:id` |

The two adapters are intentionally **not** interchangeable. They are
the *same shape* so the shared core can drive both. The semantics
above are the only things that differ.

## Public API surface

Everything below is exported from `apps/web/src/lib/form-flight/index.ts`:

```typescript
// types
export type { FormFlightMode, FormFlightProfile, FormFlightAdapter, FormFlightPayloadMode };

// payload
export { buildFormFlightPayload, readFormFlightPath, setFormFlightPath };

// validation
export { collectFormFlightMissingRequired, listFormFlightMissingPaths, snapshotFormFlightFields };

// summary
export { resolveFormFlightLine, resolveFormFlightSummary };

// acceptance
export { scanFormFlightAcceptance };

// registry
export { registerFormFlightProfile, getFormFlightProfile, listFormFlightProfiles };

// adapters — template runtime
export {
  createTemplateRuntimeAdapter,
  gateRuntimePreview,
  buildRuntimePreviewPayload,
  resolveRuntimeSummary,
  acceptRuntimeRenderedText,
  listRuntimeMissingFields,
};

// adapters — generated document
export {
  createGeneratedDocumentAdapter,
  gateGeneratedDocumentSave,
  buildGeneratedDocumentSavePayload,
  buildGeneratedDocumentDemoPayload,
  resolveGeneratedDocumentSummary,
  acceptGeneratedDocumentRenderedText,
  listGeneratedDocumentMissingFields,
  assertProfileInvariant,
};
```

## Forbidden scope

This artifact explicitly does **not**:

- Commit anything.
- Push to any remote.
- Open a PR.
- Mass-rollout the 213 locked contracts.
- Deep-fix any of the 60 legacy forms.
- Canonicalize any of the 55 non-canonical forms.
- Mutate locked DOCX contracts.
- Mutate normalized DOCX.
- Mutate source DOC / DOCX.
- Rewrite auth / RBAC.
- Merge `/templates/:code` and `/documents/:id` into one route.
- Fake a `generatedDocumentId`.
- Claim live browser / Playwright visual signoff without an
  actually-run capture.