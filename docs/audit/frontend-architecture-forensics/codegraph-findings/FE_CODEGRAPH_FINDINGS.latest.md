# FE CodeGraph Findings — Frontend Architecture Forensic Audit Phase 0

## CodeGraph Health

```json
{
  "initialized": true,
  "querySucceeded": true,
  "fallbackUsed": false,
  "errors": []
}
```

## Queries Executed

1. `Frontend architecture routes and selector graph for /templates/:templateCode /documents/:id BM_PANEL_BY_CODE ContractV2Renderer PublishedContractFormInputsPanel GenericTemplateFormInputsPanel FormFlight TemplateRuntimeAdapter GeneratedDocumentAdapter runtime-ux RuntimeUxProfile profileStatus BM-001 BM-171`
2. `BM-001 BM-171 runtime template generated document trace bm-001-form-inputs bm-171-form-inputs bm001 form-flight profile bm171 runtime-ux profile TemplatePreviewWorkspace GeneratedDocumentWorkspace selector priority skeleton audit-only runtime-ready`

## High-Value CodeGraph Results

### ContractV2Renderer

- Path: `apps/web/src/features/forms-contracts/ContractV2Renderer.tsx`
- Classification: `ACTIVE`
- Consumers reported by CodeGraph:
  - `apps/web/src/components/documents/published-contract-form-inputs.tsx`
  - `apps/web/src/components/form-studio/form-studio-workspace.tsx`
  - `apps/web/src/components/documents/template-preview-workspace.tsx`
- Finding: This is the generic renderer used by runtime template pages and published-contract generated panels.
- PR-A implication: Generic renderer is not bad by itself, but selector priority must stop audit-only/skeleton profiles from becoming renderer authority.

### GenericTemplateFormInputsPanel

- Path: `apps/web/src/components/documents/generic-template-form-inputs.tsx`
- Classification: `ACTIVE_BUT_DUPLICATIVE`
- Consumers reported by CodeGraph: many BM stub panels and generated workspace fallback.
- Finding: This is an active fallback/generic generated-document input panel.
- PR-A implication: Keep as fallback; do not allow it to override existing-good BM UI.

### BM_PANEL_BY_CODE / BM_PANEL_REGISTRY

- Paths:
  - `apps/web/src/components/documents/generated-document-workspace.tsx`
  - `apps/web/src/components/documents/bm-panel-registry.generated.ts`
- Classification: `EXISTING_GOOD_UI`
- Finding: Generated workspace uses the generated BM panel registry for per-BM generated-document forms.
- PR-A implication: BM-001 generated workspace should continue to use `Bm001FormInputsPanel` when no explicit generated-ready published contract override exists.

### PublishedContractFormInputsPanel

- Path: `apps/web/src/components/documents/published-contract-form-inputs.tsx`
- Classification: `ACTIVE_BUT_DUPLICATIVE`
- Finding: Generated workspace renders this before BM panel fallback when `publishedRuntime` is non-null.
- PR-A implication: This is a second possible takeover path: published compiled contract UI can supersede existing BM panel unless guarded by explicit generated-ready semantics.

### RuntimeUxProfile / BM-171 Runtime UX

- Paths:
  - `apps/web/src/lib/runtime-ux/runtime-ux-profile.ts`
  - `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts`
- Classification: `RUNTIME_READY` for BM-171 profile usage.
- Finding: Runtime-UX is UI metadata for `ContractV2Renderer`, not a lifecycle selector by itself.
- PR-A implication: Do not treat existence of runtime-ux profile as proof a template is ready to replace existing-good UI globally.

### Form Flight Profiles and Guards

- Paths:
  - `apps/web/src/lib/form-flight/registry.ts`
  - `apps/web/src/lib/form-flight/profile-status.ts`
  - `apps/web/src/lib/form-flight/profiles/bm001.ts`
  - `apps/web/src/lib/form-flight/profiles/bm171.ts`
  - `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts`
  - `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts`
- Classifications:
  - BM-001: `AUDIT_ONLY`
  - BM-171: `RUNTIME_READY`
  - adapters: `ACTIVE` exports but partially unused as full adapter instances
- Finding: `isRuntimeReadyProfile` is the strict gate. BM-001 has `profileStatus: "audit-only"` and `runtimeReady: false`; BM-171 has `profileStatus: "runtime-ready"` and `runtimeReady: true`.
- PR-A implication: Make `isRuntimeReadyProfile` mandatory for every selector path that treats a profile as authoritative.

## CodeGraph Caveat

The second CodeGraph query also returned historical backup code under `docs/templates/BM-171/_fe_backup/*`. That code is not active application source and is classified as `AUDIT_ONLY`. It should not be used to infer current runtime behavior except as history of how older selectors worked.

## Final CodeGraph-Derived Selector Summary

```text
/templates/:templateCode
  -> TemplatePreviewWorkspace
  -> getRuntimeFormContract
  -> getRuntimeUxProfile (optional metadata)
  -> ContractV2Renderer
  -> /forms/runtime/*
```

```text
/documents/:id
  -> GeneratedDocumentWorkspace
  -> getDocumentRenderPayload
  -> getRuntimeFormContract(templateCode) for publishedRuntime check
  -> if publishedRuntime: PublishedContractFormInputsPanel
  -> else BM_PANEL_BY_CODE[templateCode]
  -> else GenericTemplateFormInputsPanel
  -> /documents/generated/*
```
