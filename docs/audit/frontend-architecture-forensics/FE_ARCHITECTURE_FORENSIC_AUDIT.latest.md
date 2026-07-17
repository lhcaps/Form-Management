# FE Architecture Forensic Audit — Phase 0

## Executive Verdict

STATUS: `PASS`

QLLaw frontend currently preserves the product lifecycle split at the route/API-family level, but the UI selector model is not explicit enough. BM-001 generated workspace is protected by `BM_PANEL_BY_CODE`, while BM-001 runtime `/templates/BM-001` is rendered by the generic `ContractV2Renderer` because the runtime route has no BM-specific UI selector. The current Form Flight skeleton/audit-only profile is guarded by helper functions, but PR-A must make that guard a selector-level contract before any more profile-driven rollout.

## Product Boundary

| Lifecycle | Route | Workspace | API Family | Persistence |
|---|---|---|---|---|
| Runtime template | `/templates/:templateCode` | `TemplatePreviewWorkspace` | `/forms/runtime/*` | local draft + preview-session only; no generated document DB rows |
| Generated document | `/documents/:id` | `GeneratedDocumentWorkspace` | `/documents/generated/*` | generated document rows/files/history/audit |

The boundary is mostly respected in active FE calls. Runtime template helpers call runtime endpoints; generated document panels call generated endpoints. The confusion is UI-selector ownership, not a route merge.

## Route / Component Ownership Map

### `/templates/:templateCode`

- Entry: `apps/web/src/app/templates/[templateCode]/page.tsx`
- Workspace: `apps/web/src/components/documents/template-preview-workspace.tsx`
- Contract load: `getRuntimeFormContract(templateCode)`
- Renderer: `ContractV2Renderer`
- Optional UI profile: `getRuntimeUxProfile(compiledContract.templateCode)`
- Form Flight: imports BM-171 profile and uses `gateRuntimePreview`/`buildRuntimePreviewPayload` helper paths for parity/gating, not a full adapter instance.
- API family: `/forms/runtime/:templateCode/preview-session`, `/forms/runtime/preview-sessions/:sessionId/docx`, `/forms/runtime/preview-sessions/:sessionId/pdf`, `/forms/runtime/:templateCode/render-docx`.

### `/documents/:id`

- Entry: `apps/web/src/app/documents/[documentId]/page.tsx`
- Workspace: `apps/web/src/components/documents/generated-document-workspace.tsx`
- Payload load: `getDocumentRenderPayload(documentId)`
- Selector branch:
  1. `publishedRuntime` from `getRuntimeFormContract(templateCode)` when source is not `LOCKED_FILE`
  2. `PublishedContractFormInputsPanel` if `publishedRuntime` exists
  3. `BM_PANEL_BY_CODE[templateCode]` if no `publishedRuntime`
  4. `GenericTemplateFormInputsPanel` fallback
- API family: `/documents/generated/*`.

## Selector Flow Before

```text
/templates/:templateCode
  -> TemplatePreviewWorkspace
  -> getRuntimeFormContract
  -> getRuntimeUxProfile (optional)
  -> ContractV2Renderer
  -> /forms/runtime/*
```

```text
/documents/:id
  -> GeneratedDocumentWorkspace
  -> getDocumentRenderPayload
  -> getRuntimeFormContract(templateCode)
  -> if publishedRuntime: PublishedContractFormInputsPanel
  -> else BM_PANEL_BY_CODE[templateCode] ?? GenericTemplateFormInputsPanel
  -> /documents/generated/*
```

## Selector Flow Risk

1. Runtime route has no existing-good BM selector. BM-001 therefore appears as generic `ContractV2Renderer` on `/templates/BM-001` regardless of its generated workspace bespoke UI.
2. Form Flight guard exists in `isRuntimeReadyProfile`, but only consumers that call the helper are protected. A future selector that reads `getFormFlightProfile` directly could promote `audit-only`/`skeleton` metadata.
3. Generated route has a second override path: `PublishedContractFormInputsPanel` renders before `BM_PANEL_BY_CODE` when `publishedRuntime` is non-null.
4. Many registry entries are stub wrappers around `GenericTemplateFormInputsPanel`, so registry presence does not always mean existing-good bespoke UI.

## Recommended Selector Flow After

```text
route
  -> normalize templateCode
  -> determine lifecycle (runtime-template | generated-document)
  -> existing-good BM UI wins where registered and classified as existing-good
  -> profile-driven renderer only if isRuntimeReadyProfile(profile)
  -> published/generated renderer only if explicit generated-ready status allows it
  -> generic renderer/panel fallback last
```

PR-A should implement the minimum guard contract and tests; it should not migrate all duplicate panels or API helpers.

## BM-001 Trace

| Item | Finding |
|---|---|
| Runtime route | `/templates/BM-001 -> TemplatePreviewWorkspace -> ContractV2Renderer` |
| Generated route | `/documents/:id` with BM-001 -> `BM_PANEL_BY_CODE["BM-001"] -> Bm001FormInputsPanel` when no `publishedRuntime` |
| Candidate UI/profile | `ContractV2Renderer`, `Bm001FormInputsPanel`, `GenericTemplateFormInputsPanel`, `PublishedContractFormInputsPanel`, `BM001_FORM_FLIGHT_PROFILE` |
| Current likely runtime winner | `ContractV2Renderer` generic runtime UI |
| Current likely generated winner | `Bm001FormInputsPanel` unless published contract branch overrides |
| Existing good UI | `apps/web/src/components/documents/bm-001-form-inputs.tsx` for generated workspace |
| Skeleton entry | `apps/web/src/lib/form-flight/profiles/bm001.ts` is registered but `profileStatus: "audit-only"`, `runtimeReady: false` |
| Current guard | `isRuntimeReadyProfile` denies BM-001 in Form Flight helpers |
| Takeover mechanism | Runtime route lacks a BM-specific selector; future risk is raw `getFormFlightProfile` use bypassing readiness guard |
| Guard insertion point | `TemplatePreviewWorkspace` selector layer plus mandatory `isRuntimeReadyProfile` use |

## BM-171 Trace

| Item | Finding |
|---|---|
| Runtime route | `/templates/BM-171 -> TemplatePreviewWorkspace -> ContractV2Renderer + BM-171 runtime-ux metadata` |
| Generated route | `/documents/:id` with BM-171 -> `BM_PANEL_BY_CODE["BM-171"] -> Bm171FormInputsPanel` when no `publishedRuntime` |
| Candidate UI/profile | `ContractV2Renderer`, `BM171_PROFILE`, `BM171_FORM_FLIGHT_PROFILE`, `Bm171FormInputsPanel` |
| Current likely runtime winner | `ContractV2Renderer` with runtime-ux profile and Form Flight gate parity |
| Current likely generated winner | `Bm171FormInputsPanel` with Form Flight generated save/gate helpers |
| Must preserve | `profileStatus: "runtime-ready"` and `runtimeReady: true` behavior; required placeholder gate; stale fallback sanitization |
| PR-A expected impact | No regression because BM-171 passes readiness guard |

## Duplicate UI Systems

| ID | Status | Path/Symbol | Lifecycle | Risk | Recommendation |
|---|---|---|---|---|---|
| UI-001 | `EXISTING_GOOD_UI` | `BM_PANEL_REGISTRY` / `BM_PANEL_BY_CODE` | generated | Low/Medium | Keep; selector tests for BM-001/BM-171 |
| UI-002 | `ACTIVE_BUT_DUPLICATIVE` | `GenericTemplateFormInputsPanel` | generated | High if it overrides bespoke UI | Keep fallback only |
| UI-003 | `ACTIVE_BUT_DUPLICATIVE` | `PublishedContractFormInputsPanel` | generated | High override risk | Gate with generated-ready status |
| UI-004 | `ACTIVE` | `ContractV2Renderer` | runtime + generated published | Medium generic takeover perception | Keep behind selector guard |
| UI-005 | `RUNTIME_READY` | `BM171_PROFILE` runtime-ux | runtime | Medium if copied without status | Keep BM-171 only |
| UI-006 | `RUNTIME_READY` | `BM171_FORM_FLIGHT_PROFILE` | both metadata | Low if guarded | Keep |
| UI-007 | `AUDIT_ONLY` | `BM001_FORM_FLIGHT_PROFILE` | audit | Critical if selected | Keep audit-only; deny in selectors |
| UI-008 | `ACTIVE_BUT_DUPLICATIVE` | `sample-data.ts` | runtime demo | Medium stale/demo leakage | Keep demo-only |
| UI-009 | `DANGEROUS_DUPLICATE` | raw fetch per-BM helpers | generated | High auth/helper drift | Deprecate later |

## Unsupported API Callers

| File | Symbol | Method | Path | Backend route confirmed? | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `apps/web/src/lib/document-form-api.ts` | `patchDocumentFormInputs` | PATCH | `/documents/generated/:id/form-inputs` | No | High | Delete later or add backend route |
| `apps/web/src/lib/document-form-api.ts` | `replaceDocumentFormInputs` | PUT | `/documents/generated/:id/form-inputs` | No | High | Delete later or add backend route |
| `apps/web/src/lib/document-form-api.ts` | `patchBm031DirectFormInputs` | PATCH | `/documents/generated/:id/bm031-direct-form-inputs` | No | High | Delete later or add backend route |
| `apps/web/src/components/documents/bm-0xx-form-inputs.tsx` | raw fetch family | GET/POST | `/documents/generated/:id/*` | Yes for common GET/POST | High | Migrate to central helpers later |

## UX Truthfulness Risks

| File/Symbol | Risk | Recommendation |
|---|---|---|
| `template-preview-workspace.tsx` status/message | Mostly mitigated: distinguishes PDF preview from DOCX-only fallback, but message still says `Đã tạo bản xem trước` for WARN with PDF | Keep current mitigation; add regression tests |
| `generated-document-action-panel.tsx` success badge | `Đã tạo bản xem trước` may describe file generation rather than browser/PDF visual preview | Consider relabel to `Đã tạo tệp` or gate on actual preview metadata |
| `template-preview-workspace.tsx` case import CTA | Runtime route offers case import but disabled `Tạo văn bản từ hồ sơ`; boundary is clear | Keep disabled until real case-bound creation flow exists |
| `generated-document-workspace.tsx` history tab | Correctly scoped to `/documents/:id`; no standalone runtime history tab found | Keep generated-only |

## Security/Auth FE Risks

| File/Symbol | Risk | Recommendation |
|---|---|---|
| raw BM panel fetch family | Direct `fetch` and local `API_BASE_URL` duplicate auth behavior; may rely on global fetch patch for Bearer token | Migrate to `document-form-api` later |
| `runtime-template-preview.ts` / `runtime-template-export.ts` | Uses `credentials: "include"` but wraps with `withApiFetchAuthDefaults`, so Bearer token bridge is applied | Keep; no immediate issue |
| `file-download.ts` | Uses explicit token bridge and `credentials: "include"` | Keep |
| `api-client.ts` | Centralized token bridge; legacy comments mention cookies/session | Keep; no secret output observed |
| Playwright auth state | Static FE search found tests referencing auth behavior, no secrets printed in audited source | No action in PR-A |

## Test Coverage Map

| Area | Existing Coverage | Gap |
|---|---|---|
| BM-001 Form Flight audit-only | `bm001-second-pilot.test.ts`, `profile-status.test.ts` | Add route/component selector test |
| BM-171 Form Flight runtime-ready | `bm171-shared-core.test.ts`, `bm171-required-placeholder-gate.test.ts` | Add route-level no-regression test |
| runtime-ux profile | `runtime-ux/*test.ts` | Add selector contract that runtime-ux is metadata only |
| template preview workspace | `runtime-template-preview.test.ts`, `template-preview-workspace.prefill.test.ts` | Add BM-001/BM-171 selector tests |
| generated document workspace | `generated-document-workspace-shadcn.test.ts` | Add BM_PANEL_BY_CODE vs published/generic priority tests |
| document-form-api helpers | No direct full route-confirmation test found | Add unsupported helper guard or delete unused helpers later |
| Clerk E2E | Static search only in this phase | No PR-A E2E required unless planner asks |

## PR-A Required Tests

- BM-001 runtime selector/gate test proving audit-only profile is a no-op for summary/gate/payload/UI authority.
- BM-001 generated selector test proving existing-good `Bm001FormInputsPanel` wins over generic fallback.
- BM-171 regression test proving runtime-ready profile still affects gates and payload sanitization.
- Published contract precedence test documenting when `PublishedContractFormInputsPanel` can supersede BM panel.
- Static guard test proving runtime-authoritative Form Flight consumers use `isRuntimeReadyProfile`.

## Artifacts

- `docs/audit/frontend-architecture-forensics/FE_ARCHITECTURE_FORENSIC_AUDIT.latest.md`
- `docs/audit/frontend-architecture-forensics/FE_ARCHITECTURE_FORENSIC_AUDIT.latest.json`
- `docs/audit/frontend-architecture-forensics/FE_SELECTOR_AND_ADAPTER_GRAPH.latest.json`
- `docs/audit/frontend-architecture-forensics/FE_DUPLICATION_AND_DEAD_CODE.latest.json`
- `docs/audit/frontend-architecture-forensics/FE_API_CALLER_INVENTORY.latest.csv`
- `docs/audit/frontend-architecture-forensics/FE_PR_A_RECOMMENDATION.latest.md`
- `docs/audit/frontend-architecture-forensics/codegraph-findings/FE_CODEGRAPH_FINDINGS.latest.md`

## Next Recommended Task

PR-A: make frontend runtime/generated UI selectors deny `audit-only` and `skeleton` Form Flight profiles while preserving BM-001 existing-good UI and BM-171 runtime-ready profile behavior.
