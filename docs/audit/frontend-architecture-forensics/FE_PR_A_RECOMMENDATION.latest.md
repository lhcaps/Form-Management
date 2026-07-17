# FE PR-A Recommendation — Guard Runtime Selector From Skeleton Profile Takeover

## Verdict

PR-A should be a narrow frontend selector-guard PR. Do not start API unification, Form Flight rollout, or BM panel migration in PR-A.

The current code already has a strong Form Flight readiness guard in `apps/web/src/lib/form-flight/profile-status.ts`, but that guard is only effective for consumers that call Form Flight helper functions. The runtime template page itself has no explicit UI selector contract: `/templates/:templateCode` always renders `ContractV2Renderer` with optional `runtime-ux` metadata. That explains why BM-001 can look like it was taken over by a generic runtime UI even though its Form Flight profile is audit-only.

## Exact Selector To Change

Primary PR-A target:

- `apps/web/src/components/documents/template-preview-workspace.tsx`

Supporting guard target:

- `apps/web/src/lib/form-flight/profile-status.ts`

Generated workspace test/documentation target:

- `apps/web/src/components/documents/generated-document-workspace.tsx`

## Guard Rule

A profile can influence runtime UI, payload, summary, acceptance, or required-field gates only when both conditions are true:

1. `runtimeReady === true`
2. `profileStatus === "runtime-ready"`

Everything else is denied:

- missing flags
- `profileStatus: "audit-only"`
- `profileStatus: "skeleton"`
- `runtimeReady: false`
- mismatched `runtimeReady: true` plus non-runtime status

## Recommended Selector Flow After PR-A

```text
route /templates/:templateCode
  -> normalize templateCode
  -> load runtime contract
  -> check existing-good runtime UI registry (if introduced)
  -> else check Form Flight profile through isRuntimeReadyProfile only
  -> else allow runtime-ux only as renderer metadata, not authority
  -> else ContractV2Renderer generic fallback
  -> /forms/runtime/* only
```

```text
route /documents/:id
  -> getDocumentRenderPayload
  -> templateCode
  -> if existing-good BM panel: prefer BM_PANEL_BY_CODE
  -> published contract renderer only if explicit generated-ready/published override is allowed
  -> else GenericTemplateFormInputsPanel
  -> /documents/generated/* only
```

## BM-001 Expected Behavior

- `/templates/BM-001`: must not read BM001 Form Flight audit-only profile as authoritative.
- `/documents/:id` with `templateCode=BM-001`: must keep `BM_PANEL_BY_CODE["BM-001"] -> Bm001FormInputsPanel` as the existing-good UI unless an explicit generated-ready override is added later.
- `BM001_FORM_FLIGHT_PROFILE`: remains registered for audit/rollout factory only; still `runtimeReady: false` and `profileStatus: "audit-only"`.

## BM-171 Expected Behavior

- `/templates/BM-171`: keeps `ContractV2Renderer` plus BM-171 `runtime-ux` metadata and Form Flight runtime-ready gates.
- `/documents/:id` with `templateCode=BM-171`: keeps `Bm171FormInputsPanel` and Form Flight generated save/gate helpers.
- `BM171_FORM_FLIGHT_PROFILE`: remains active because `runtimeReady: true` and `profileStatus: "runtime-ready"`.

## Tests PR-A Must Add

1. BM-001 runtime selector/gate test: audit-only profile does not produce runtime summary, missing-field gate, demo reset, or payload mutation.
2. BM-001 generated selector test: `BM_PANEL_BY_CODE["BM-001"]` is selected over generic fallback.
3. BM-171 regression test: runtime-ready profile still blocks missing required fields and still sanitizes stale fallback values.
4. Published contract precedence test: document when `PublishedContractFormInputsPanel` may override a BM-specific panel.
5. Static consumer test: runtime-authoritative Form Flight code paths must call `isRuntimeReadyProfile`.

## Do Not Do In PR-A

- Do not migrate raw fetch BM panels.
- Do not delete stub panels.
- Do not change backend routes.
- Do not merge `/templates/:code` with `/documents/:id`.
- Do not mutate locked DOCX or generated artifacts.
- Do not promote BM-001 to runtime-ready.

## One-Line PR-A Task

PR-A: make frontend runtime/generated UI selectors deny `audit-only` and `skeleton` Form Flight profiles while preserving BM-001 existing-good UI and BM-171 runtime-ready profile behavior.
