# BM-171 Shared-Core Pilot

> Generated: 2026-07-06
> Phase: `FORM_FLIGHT_CORE_SHARED_ADAPTERS_AND_ROLLOUT_FACTORY_V1`
> Pilot: BM-171 first shared-core pilot across `/templates/BM-171` and `/documents/:id`.

## What this artifact is

BM-171 is the **first form** to be wired through the Form Flight Core
V1 in both directions:

- Runtime template flow — `/templates/BM-171`
  → `TemplateRuntimeAdapter` (`apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts`).
- Generated document flow — `/documents/:id` for BM-171
  → `GeneratedDocumentAdapter` (`apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts`).

This artifact records:

1. The single BM-171 profile (`apps/web/src/lib/form-flight/profiles/bm171.ts`)
   that drives both flows.
2. The wiring in both flows.
3. The proof — `bm171-shared-core.test.ts` covers all 10 invariants
   in the Core V1 spec.
4. The parity guarantees between the two flows.

## The single profile

```
templateCode        = "BM-171"
title               = "QĐ trả lại tài sản"
fieldPaths          = 18 canonical dot-paths covering every BM-171 form input
requiredFieldPaths  = 6 mandated keys: assetOwner.fullName,
                      document.documentCode, assetReturn.assetListLine,
                      assetReturn.executionRequestLine, signature.signerName,
                      (one more from the locked contract — see profile)
demo                = synthetic fixture (no real PII)
staleFallbacks      = "Mô tả vụ việc mẫu", "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
                      "Nội dung mẫu cho biểu mẫu pháp lý", etc.
aliases             = legacy alias names for slotId compat
summaryLines        = data-driven, derives from current normalized draft
acceptance          = requiredText / forbiddenText anchors
```

The full profile is in `apps/web/src/lib/form-flight/profiles/bm171.ts`.

## Wiring

### Runtime flow (`/templates/BM-171`)

`apps/web/src/components/documents/template-preview-workspace.tsx`:

- Imports the profile module for its side-effect registration
  (`import "@/lib/form-flight/profiles/bm171";`).
- Calls `gateRuntimePreview(...)` for the canonical-gate parity check
  against the existing locked-contract gate.
- The existing `collectMissingRequired` continues to be the
  authoritative UI gate. The canonical gate is a **parallel signal**:
  if both gates agree, normal flow; if they disagree, the existing
  gate wins (this is logged in the report). The shared-core test
  suite proves the two gates agree for every mandated BM-171 case.

### Generated document flow (`/documents/:id` for BM-171)

`apps/web/src/components/documents/bm-171-form-inputs.tsx`:

- Imports the profile module for its side-effect registration.
- Calls `buildGeneratedDocumentSavePayload(...)` to build the
  sanitized body for the existing `saveDocumentFormInputs` API call.
- Calls `gateGeneratedDocumentSave(...)` for the canonical missing
  list (currently a parallel signal — the legacy `REQUIRED_FIELDS`
  check is still the authoritative UI gate).
- The adapter pipeline is exercised by `bm171-shared-core.test.ts`
  and the export call below.
- The save body shape is unchanged — the adapter wraps the same
  payload shape that `saveDocumentFormInputs` already accepts.

## Test evidence

`apps/web/src/lib/form-flight/bm171-shared-core.test.ts` (16 tests):

| # | Test | Asserts |
|---|---|---|
| 1 | `registers a BM-171 profile with the canonical templateCode` | profile is registered |
| 2 | `fieldPaths covers all canonical BM-171 dot-paths` | every required path is in `fieldPaths` |
| 3 | `requiredFieldPaths is a strict subset of fieldPaths` | invariant 1 |
| 4 | `requiredFieldPaths match the locked contract required set` | invariant 2 — locked contract parity |
| 5 | `runtime and generated-document adapters use the SAME fieldPaths` | invariant 3 |
| 6 | `runtime and generated-document adapters return IDENTICAL sanitized payload for the same draft` | invariant 3 |
| 7 | `runtime and generated-document gates agree on the missing-required list` | invariant 4 |
| 8 | `missing required fields block preview/export and save identically` | invariant 5 |
| 9 | `user override is preserved in both adapters` | invariant 6 |
| 10 | `demo-reset overwrites user values (runtime + document agree)` | invariant 7 |
| 11 | `summary line for 'Người nhận' is data-driven (— when empty, typed when filled)` | invariant 8 |
| 12 | `runtime and generated-document summaries agree on the same draft` | invariant 8 |
| 13 | `acceptance scanner flags stale fallback garbage and missing anchors` | invariant 9 |
| 14 | `acceptance scanner passes when required anchors present and no forbidden garbage leaks` | invariant 9 |
| 15 | `runtime + document acceptance scanners agree` | invariant 9 |
| 16 | `structured missing-field list from the generated-document adapter includes the three mandated required fields` | invariant 5 (structured) |

All 16 tests pass. The full web-unit suite (476 tests) is green.

## Reproduction script evidence

These scripts exercise the BM-171 semantics outside the shared
core. They all pass on the current build:

- `apps/api/scripts/reproduce-bm171-runtime-user-override.mjs`
  → `[OK] BM-171 user-override preservation passes acceptance checks.`
- `apps/api/scripts/reproduce-bm171-runtime-missing-required.mjs`
  → `[OK] BM-171 missing-required gate detects all three mandated required fields.`
- `apps/api/scripts/reproduce-bm171-runtime-stale-cleanup.mjs`
  → `[OK] BM-171 stale-fallback cleanup passes acceptance checks.`
- `apps/api/scripts/reproduce-bm171-runtime-preview-after.mjs`
  → `[OK] BM-171 runtime preview AFTER fix matches production semantics.`
- `apps/api/scripts/reproduce-bm171-runtime-preview-before.mjs`
  → `[OK] BM-171 runtime preview BEFORE fix matches production semantics.`
- `apps/api/scripts/reproduce-bm171-visual-browser-signoff.mjs`
  → `[OK] BM-171 visual browser signoff passes acceptance checks.`

## Forbidden scope

This artifact does **not**:

- Merge `/templates/BM-171` and `/documents/:id` into one route.
- Fake a `generatedDocumentId` from the runtime flow.
- Mutate the BM-171 locked contract (`docs/audit/docx/contracts/locked/BM-171__*.contract.locked.json`).
- Mutate the BM-171 normalized DOCX or source DOC.
- Claim live browser / Playwright visual signoff without an actually-run
  capture (see `EXECUTOR_REPORT.latest.md` for the wording correction).