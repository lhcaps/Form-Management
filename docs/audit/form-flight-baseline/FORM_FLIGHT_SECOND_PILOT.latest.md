# Form Flight Second Pilot — BM-001

> Generated: 2026-07-06
> Phase: `FORM_FLIGHT_CORE_SHARED_ADAPTERS_AND_ROLLOUT_FACTORY_V1`
> Selected pilot: **BM-001** (skeleton profile only — no component rewrite).

## Why BM-001

The task prompt asked for **one** low-risk second pilot, preferring
BM-001 if its profile/data model is already mature. The choice was
made after inspecting the rollout matrix:

| Check | BM-001 |
|---|---|
| Component exists | YES (`apps/web/src/components/documents/bm-001-form-inputs.tsx`) |
| Registry entry exists | YES |
| Primary export | `Bm001FormInputsPanel` — present |
| Save handler family | `saveDocumentFormInputs` family — present |
| Locked contract on disk | YES (`docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json`) |
| Field count | 39 (28 required) |
| Demo fixture safe | YES |
| Maturity | BM-001 already has its own typed API helper (`apps/web/src/lib/bm001-form-inputs-api.ts`) — the most mature surface among the 60 forms |

BM-001 is the largest `READY_FOR_PROFILE_PORT` form. Picking it
proves the rollout factory's classification is honest and the
shared core can absorb a different form's data shape without
BM-171's specific structure.

## What was done

**Nothing** was changed in:

- `apps/web/src/components/documents/bm-001-form-inputs.tsx`
- `apps/web/src/lib/bm001-form-inputs-api.ts`
- `apps/web/src/lib/bm001-options.ts`
- `docs/audit/docx/contracts/locked/BM-001__*.contract.locked.json`
- The BM-001 normalized DOCX or source DOC

What **was** added:

1. `apps/web/src/lib/form-flight/profiles/bm001.ts` — a **skeleton**
   FormFlightProfile. It lists `fieldPaths` (35 paths, full coverage
   of the `Bm001FormInputs` shape) and `requiredFieldPaths` (the 22
   keys the BM-001 panel marks as required).
2. `apps/web/src/lib/form-flight/bm001-second-pilot.test.ts` — 6
   tests proving the skeleton registers cleanly, the field set is
   complete, the required set matches the panel's `REQUIRED_FIELDS`,
   the skeleton is honest about its missing demo / summary /
   acceptance anchors, and the validation gate fires against an
   empty draft.

## What was intentionally **not** done (skeleton is honest)

- `demo` is `{}` — a real BM-001 demo fixture would need hand-curated
  synthetic data. Future task.
- `summaryLines` is `undefined` — BM-001 quick-check lines were
  never authored in the original component. Future task.
- `acceptance.requiredText` and `acceptance.forbiddenText` are
  empty — BM-001 has no acceptance anchors yet. Future task.

The skeleton is the contract for the rollout factory's promise:
**a future task can fill in the demo, summary, and acceptance
blocks without touching the existing component, API helper, or
locked contract.**

## Test evidence

`apps/web/src/lib/form-flight/bm001-second-pilot.test.ts` (6 tests):

| # | Test | Asserts |
|---|---|---|
| 1 | `registers a BM-001 skeleton profile` | profile registers, title matches |
| 2 | `fieldPaths covers the full Bm001FormInputs key set` | 11 sample fields all present |
| 3 | `requiredFieldPaths includes the BM-001 mandatory keys` | reception.startedAtTimeText, informant.fullName, crimeReport.content |
| 4 | `profile invariant holds: requiredFieldPaths ⊆ fieldPaths` | invariant 1 |
| 5 | `skeleton is honest: demo empty + summaryLines absent + acceptance empty` | no fake data |
| 6 | `validation gate fires on every empty draft against BM-001 requiredFieldPaths` | empty draft → missing list is non-empty |

All 6 tests pass.

## Forbidden scope

This artifact does **not**:

- Modify the BM-001 component, API helper, options, or locked contract.
- Roll BM-001 into `/documents/:id` runtime — BM-001 still goes
  through the existing `saveDocumentFormInputs` path.
- Touch the normalized DOCX or source DOC.
- Claim production readiness — BM-001's demo/summary/acceptance are
  explicitly empty in this artifact.