# QLLAW 213 — Runtime Architecture — `*.latest.md`

> Frozen for the R0/R1 runtime-readiness campaign (2026-07-23). Generated from
> live, read-only inspection of the working tree at `b0e43be`. This document
> does **not** modify any code path. It maps the live implementations of the
> `/templates/:code → /documents/:documentId → DOCX` lifecycle and classifies
> every responsibility as `generic contract-driven`, `form-specific`,
> `allowlist-gated`, `profile-driven`, `registry-driven`, `API-driven`,
> `unsupported`, or `canary / special behavior`.

## 0. Authoritative starting state

```
HEAD = b0e43be3fd7831db42a88ad521384e0608ee6a18
branch = codex/customer-ready-baseline
staged files = 0
pre-existing dirty files = 322
semantic pass = 213/213, semantic incomplete = 0
input-linkage pass = 213/213
provenancePresent = 151, provenanceMissing = 62
runtimeReady (canonical) = ["BM-001","BM-171"]
runtimeReady (candidate profile flags) = 12 profiles set runtimeReady:true on file,
                                         but the canonical list delegates to
                                         STANDALONE_RUNTIME_TEMPLATE_CODES
                                         (packages/form-contracts/src/bridge-eligibility.ts)
DOCUMENT_RENDERER_MODE = active
DOCUMENT_RENDERER_CONTRACT_TEMPLATES = BM-001   (env-gated allowlist #2)
DOCX_TEMPLATE_PROFILES = (separate env-gated allowlist #3 if any)
```

There are **three independent gates** that today collectively control "runtime-readiness". Section 13 of `QLLAW_RUNTIME_READINESS_PILOT.latest.md` describes the small set of coordinated edits a promotion requires. None of those edits is in scope for this architecture document.

## 1. Lifecycle map

```
/templates/:templateCode              apps/web/src/app/templates/[templateCode]/page.tsx
  → case selection                    template-preview-workspace.tsx (selectCase)
  → runtime-ready / bridge eligibility form-lifecycle.ts#decideFormLifecycle
                                       └─ STANDALONE_RUNTIME_TEMPLATE_CODES
                                          (packages/form-contracts/src/bridge-eligibility.ts)
  → document bridge (skeleton only)    createDraftFromTemplate (POST /api/v1/documents/draft-from-template)
                                       api: documents.service.ts#createDraftFromTemplate
                                       The bridge REFUSES STANDALONE_RUNTIME_TEMPLATE
                                       codes by design (BadRequestException).
  → persistence (BM-001/BM-171)        runtime-preview-session.service (60-min TTL session,
                                       session id `runtime_preview_<uuid>`, NO DB row)
                                       api: apps/api/src/modules/documents/runtime-preview-session.service.ts
  → persistence (others)              generated_documents table + audit log

/documents/:documentId                apps/web/src/app/documents/[documentId]/page.tsx
  → edit / save / reload              generated-document-workspace.tsx + ContractV2Renderer
  → preview                           same workspace; preview flag
  → DOCX generation                   document-renderer.service / contract-render-plan.builder
  → DOCX download                     runtime-template-export / docx-files.controller
  → optional PDF conversion           document-pdf.service (calls LibreOffice / soffice if present)
```

## 2. Component / responsibility matrix

| Component / file | Responsibility | Input | Output | Generic vs form-specific | Gate / allowlist | Failure behavior | Static test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/app/templates/[templateCode]/page.tsx` (route) | Route host for `/templates/:code` | URL param `templateCode` | renders `<TemplatePreviewWorkspace>` | generic | none | 404 / sign-in redirect | n/a |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | Template runtime host; smart-generic prefill; ContractV2Renderer mount; runtime save; runtime session creation; draft bridge fallback | templateCode, caseId?, runtimeUxProfile?, compiled contract | React tree, side-effects to runtime-only state | generic | `decideFormLifecycle` + `selectRuntimeReadyTemplatePanel`; `gateRuntimePreview` (BM-001/BM-171 only) | fall back to persisted-draft-bridge / generic; never bypasses gate | `form-lifecycle-wiring.guard.test.mjs`, `bm001-runtime-ready.guard.test.mjs`, `bm001-smart-runtime-ux.guard.test.mjs`, `runtime-ready-template-panel-contract.guard.test.mjs` |
| `apps/web/src/lib/form-flight/form-lifecycle.ts` | `decideFormLifecycle({ lifecycle, templateCode, hasRealGeneratedDocumentId })` pure decision | lifecycle, templateCode, real id? | FormLifecycleDecision (panelKind, useFormFlight, profileStatus, reason) | generic | `STANDALONE_RUNTIME_TEMPLATE_CODES` | panelKind=`unavailable` for unmatched codes | `form-lifecycle-wiring.guard.test.mjs` (items 11–21) |
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.ts` | Maps `FormLifecycleDecision` → `kind: runtime-ready-template-panel | persisted-draft-bridge-panel | legacy-template-panel | unavailable-template-panel | generic-template-panel` | decision | RuntimeReadyTemplatePanelDecision | generic | `diagnosticsEnabled` flag (opt-in, gates `generic-template-panel` from being treated as available) | `unavailable-template-panel` fail-closed | `runtime-ready-template-panel-contract.guard.test.mjs` |
| `apps/web/src/lib/form-flight/profile-status.ts` | `isRuntimeReadyProfile(profile)`: fail-closed AND — must have `runtimeReady === true && profileStatus === "runtime-ready"` | profile | boolean | generic | n/a | returns false for skeleton/audit-only | `bm001-runtime-ready.guard.test.mjs` |
| `apps/web/src/lib/form-flight/registry.ts` | `registerFormFlightProfile`, `getFormFlightProfile` | templateCode | profile | generic | n/a | first-write-wins (deterministic) | profile-registry-guard.test.mjs |
| `apps/web/src/lib/form-flight/profiles/bmXXX.ts` | Hand-authored (BM-001/BM-171) or auto-skeleton (211 others) runtime profile | n/a | `BMxxx_FORM_FLIGHT_PROFILE` registered on import | form-specific authoring; generic import-time side effect | `runtimeReady:true` flag in profile (decorative, advisory) | skeletons export `runtimeReady:false, profileStatus:"skeleton"` → adapter skips | scaffolding tests + per-form guards |
| `apps/web/src/lib/runtime-template-preview.ts` | Create / load / download runtime preview session (60-min TTL, no DB row) | templateCode, contract | session object | generic | `STANDALONE_RUNTIME_TEMPLATE_CODES` allowed | cleans expired sessions on `prune()` | runtime-template-preview.* tests |
| `apps/web/src/lib/draft-bridge-api.ts` | `createDraftFromTemplate(...)` — POST `/api/v1/documents/draft-from-template` | templateCode, caseId, targetPersonId? | `{ documentId, isNew, reused, ... }` | generic | API check `bridgeEligibility` | API: refuses STANDALONE_RUNTIME_TEMPLATE with `BadRequestException('Biểu mẫu runtime-ready phải dùng phiên xem trước độc lập, không tạo draft bridge.')` | `apps/web/src/lib/form-flight/draft-bridge-api.*` tests |
| `apps/api/src/modules/documents/documents.service.ts#createDraftFromTemplate` | Persisted draft creation for non-standalone templates | templateCode, caseId, targetPersonId?, official id/agency | `CreateDraftFromTemplateResponseDto` (documentId etc.) | generic | `getPersistedDraftBridgeIneligibilityReason` (`STANDALONE_RUNTIME_TEMPLATE` is **ineligible**) | `NotFoundException` (case missing) / `BadRequestException` (case access, bridge scope) | `apps/api/src/modules/documents/draft-from-template-auth.integration.spec.ts` |
| `apps/api/src/modules/documents/documents.controller.ts` | HTTP surfaces: `GET /documents/cases/:caseId/available-templates`, `POST /documents/cases/:caseId/plan`, `POST /documents/cases/:caseId/batches`, `POST /documents/draft-from-template`, `GET /documents/batches/:batchId` | DTO bodies + auth | batch / batch-resolved record + audit log row per created document | generic | `CurrentUser` injected via Clerk or legacy session; `AgencyResourceAccessService.assertCanAccessCase` | auth missing → 401; access denied → 403 | `documents.controller.spec.ts`, `draft-from-template-auth.integration.spec.ts` |
| `apps/api/src/modules/documents/rendering/application/document-renderer-routing.policy.ts` | `route(templateCode) → 'off' | 'shadow' | 'active'` | templateCode | DocumentRendererRoute | generic | `DOCUMENT_RENDERER_MODE` env, `DOCUMENT_RENDERER_CONTRACT_TEMPLATES` env-list | `legacy` for unmatched | per-renderer unit tests |
| `apps/api/src/infrastructure/config/app-config.service.ts` (`documentRendererMode`, `documentRendererContractTemplates`) | Single source of truth for env-driven allowlists | env vars | readonly values | generic | n/a | `ConfigurationError` if invalid | env validation tests |
| `apps/api/src/modules/documents/runtime-preview-session.service.ts` | FS-backed session for BM-001 / BM-171 standalone preview (no DB row) | sessionId | preview files + session expiry | generic (only used by STANDALONE_RUNTIME_TEMPLATE codes) | session_id pattern `runtime_preview_<uuid>` | `BadRequestException` on malformed id; prunes expired sessions | `runtime-preview-session.service.spec.ts` |
| `apps/api/src/modules/contract-platform/application/runtime-form-contract.service.ts` | Resolve active contract for templateCode (DB / locked file / legacy adapter) | templateCode, agencyId?, contractHash? | `RuntimeFormContractResponse` (compiledContract, hashes, source) | generic | none directly — template metadata drives renderScope | throws `RUNTIME_CONTRACT_NOT_FOUND` if no published/locked contract | `runtime-form-contract.service.spec.ts` |
| `apps/api/src/modules/documents/rendering/infrastructure/contract-document-renderer.adapter.ts` | DOCX generation via Contract Platform v2 | compiledContract + inputs | DOCX bytes | generic | `DocumentRendererRoutingPolicy` (`active` mode) | `LOCKED_CONTRACT_INVALID` / `RUNTIME_CONTRACT_NOT_FOUND` | adapter spec + parity tests |
| `apps/api/src/modules/documents/document-pdf.service.ts` | Optional PDF conversion via LibreOffice / soffice (env-dependent) | docx file path | PDF bytes | generic | `libreOfficePath` env or `which soffice` probe; absent → graceful degradation | logs `PDF_PREVIEW_UNAVAILABLE` warning + skips | (see runtime-preview-session.service.spec) |
| `apps/api/src/modules/documents/preview/docx-preview.controller.ts` | `GET /documents/preview/:sessionId` for BM-001/BM-171 standalone runtime session | sessionId | streams DOCX | generic | session id pattern | 400 on malformed | per-spec |
| `apps/web/src/components/documents/generated-document-workspace.tsx` | Generated document host; ContractV2Renderer for both runtime and legacy paths | documentId, templateCode | React tree | generic | `registerRuntimeReadyFormFlightProfiles` (one shot), `decideFormLifecycle` | falls back to legacy panel (per legacy BM panel) | lifecycle wiring guard |
| `apps/web/src/features/forms-contracts/ContractV2Renderer.tsx` | Universal contract renderer (section list, fields, controls, demo) | compiledContract + payload + optional uxProfile | React tree | generic | none | unknown controlType → null | renderer unit tests |
| `apps/web/src/components/documents/published-contract-form-inputs.tsx` + `bm-form-section.tsx` | BM-specific generated-document bridge: render read-only BM-defined inputs, hand off to ContractV2Renderer | templateCode, caseId, documentId | React tree | form-specific (renders per BM panel) | `selectRuntimeReadyTemplatePanel` | falls back to legacy panels | per-form guards |

## 3. End-to-end path classification

```
/templates/:code →
  route = generic
  case selection = generic (template-preview-workspace)
  runtime-ready / bridge eligibility = GENERIC DECISION (`decideFormLifecycle`)
                                            on top of
                                            FORM-SPECIFIC PROFILE (profile files)
                                            on top of
                                            CANONICAL ALLOWLIST (STANDALONE_RUNTIME_TEMPLATE_CODES)
  persistence for runtime-ready = RUNTIME PREVIEW SESSION (no DB row), 60-min TTL
  persistence for skeleton = PERSISTED DRAFT BRIDGE (DB row + audit log)

/documents/:documentId →
  route = generic
  edit / save / reload = generic (ContractV2Renderer + generated-document save)
  preview = generic workspace flag
  DOCX generation = ALLOWLIST-GATED (DOCUMENT_RENDERER_MODE + DOCUMENT_RENDERER_CONTRACT_TEMPLATES),
                    or legacy renderer (legacy path)
  DOCX download = generic
  PDF = OPT-IN (LibreOffice present → real PDF; absent → graceful skip)

```

## 4. Authoritative runtime-ready path

BM-001 and BM-171 are the only forms whose pipeline is **independently** wired across:
1. `STANDALONE_RUNTIME_TEMPLATE_CODES` (Form-Flight allowlist)
2. `gateRuntimePreview` (template-preview-workspace gate)
3. `registerRuntimeReadyFormFlightProfiles` (single-shot profile registration in both lifecycle templates)
4. `runtime-preview-session.service` (FS-backed session, no DB row)
5. The generated-document workspace also gets a `registerRuntimeReadyFormFlightProfiles()` call so the same gate resolves in `/documents/:id` when `hasRealGeneratedDocumentId=true`.

Every other BM-XXX lives behind the persisted-draft-bridge or the legacy panel; the Form-Flight helpers stay **fail-closed** (`useFormFlight=false`, `panelKind="legacy" | "generic" | "persisted-draft-bridge"`) for them.

## 5. Canary / special behavior

### BM-200 — `PRESENTATION_CANARY_WITH_SAFE_CURATION_ALLOWED`, `CANARY_POLICY_PRESERVED`

`apps/web/src/lib/form-flight/profiles/bm200.ts` declares:

```ts
runtimeReady: false,
profileStatus: "skeleton",
```

Header comment:

```
AUTO-GENERATED SKELETON — NOT FIDELITY COMPLETE. […] Do NOT set
`runtimeReady: true` or `profileStatus: "runtime-ready"` on this file
until demo, summaryLines, acceptance, and render validation have been
hand-authored.
```

**Conclusion**: BM-200 stays a skeleton on purpose. The canary behavior is the existence of an auto-generated profile + the explicit policy block forbidding promotion. **Removing this block would be a policy change** and is out of scope for the R0/R1 campaign. **Removing BM-200 from allowlists is also out of scope** — it was already not in `STANDALONE_RUNTIME_TEMPLATE_CODES`.

## 6. BM-001 / BM-171 runtime guards (positive controls)

| Guard file | Role |
| --- | --- |
| `apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs` | BM-001-specific runtime-ready invariants (panels, adapter, lifecycle). |
| `apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs` | BM-001 smart-runtime-UX invariants (placeholder imports, prefill, sample merge). |
| `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs` | Cross-cutting wiring — guard items 11–21 are exactly what would have to *change* to allow a third runtime-ready code; the test currently hard-codes `["BM-001","BM-171"]`. |
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs` | Maps decision → panel kind; pure. |
| `apps/web/src/lib/form-flight/profiles/bm171.ts` (and `bm001.ts`) | Profile files — `runtimeReady:true, profileStatus:"runtime-ready"` and `registerFormFlightProfile(...)` self-registration. |

In addition: `test/forms/semantic-ui-maturity.audit.test.mjs` line 755 asserts the canonical `runtimeReady` from the audit JSON exactly equals `["BM-001","BM-171"]`. A promotion would re-fail this assertion until the audit JSON is regenerated for the promoted set.

## 7. Failure modes encountered during inspection (read-only)

None of these required a code edit:

- `app-config.service.ts` is part of the pre-existing dirty list (322 modified files), but its relevant `documentRendererMode` / `documentRendererContractTemplates` API surface is unchanged.
- `form-lifecycle.ts` declares `import * as _runtimeReadyImports from "./profiles/bm001"` and the equivalent for bm171 — these are the **only two** such imports and the guard test pins that count.
- `apps/web/src/lib/form-flight/profiles/bm200.ts` correctly fails closed.

## 8. Findings the R0/R1 pilot must respect

1. **Promotion is not a one-line change.** The smallest *correct* promotion touches:
   - `packages/form-contracts/src/bridge-eligibility.ts` (`STANDALONE_RUNTIME_TEMPLATE_CODES`)
   - `apps/web/src/lib/form-flight/form-lifecycle.ts` (add side-effect import)
   - the candidate's own profile file (flip `runtimeReady:true`, hand-curate `demo`/`acceptance`/`fieldPaths`)
   - the cross-cutting `form-lifecycle-wiring.guard.test.mjs` (lines 327 and 320)
   - `test/forms/semantic-ui-maturity.audit.test.mjs` line 755
   - and (if the contract-driven DOCX renderer should also serve the candidate) `.env`'s `DOCUMENT_RENDERER_CONTRACT_TEMPLATES`.

2. **There is no GET→list helper that decodes "is X eligible for promotion".** The eligibility stack is a federation of three allowlists (canonical policy + env renderer templates + per-profile flag). Any candidate promotion decision has to thread through all three.

3. **Persisted draft bridge ≠ runtime preview session.** A candidate going through promotion does **not** inherit BM-001/BM-171's session model. It uses `POST /documents/draft-from-template` and then `/documents/:documentId`. The audit gate `R3..R5` requires the candidate to satisfy that lifecycle end-to-end.

4. **PDF conversion is environment-dependent.** `document-pdf.service` calls `libreOfficePath` / `which soffice`. If absent, the system records `PDF_PREVIEW_UNAVAILABLE` and continues. The pilot must record `PDF_SMOKE = NOT_SUPPORTED` for any environment where soffice is unavailable — this is **not** a runtime readiness blocker (per Gate R8 wording).

## 9. Open questions for follow-up (out of R0/R1 scope)

- Does the spec intend the R0/R1 phase to also flush `DOCUMENT_RENDERER_CONTRACT_TEMPLATES` past `BM-001` for promoted codes? **The spec text is silent.** Currently only BM-001 is in `.env` for `DOCUMENT_RENDERER_CONTRACT_TEMPLATES`, so a promoted BM-XXX would render with the contract-driven adapter only after env update (otherwise the legacy path takes over). The pilot will record this distinction explicitly per row, without forcing env edits.
- Does BM-171 actually exercise the persisted generated-document path today, given that its template is in `STANDALONE_RUNTIME_TEMPLATE_CODES` (which the bridge explicitly refuses)? **Yes**: BM-171's `documents` route uses the BM-171-specific generated panel via the legacy panel registry, not the bridge. This is what lets BM-001/BM-171 exist in both lifecycles (template-runtime AND a generated-document variant). The pilot leaves this invariant untouched.
