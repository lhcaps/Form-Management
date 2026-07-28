# Local-only unlock for all 213 BM forms

This document describes the **local-development only** mode that opens every
registered BM form in the local environment. It is explicitly **not** a
production promotion.

## What this mode does

When `NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS=true` in a non-CI local
development shell:

- All 213 registered BM forms appear in `/documents` selector and search.
- Every registered form can open `/templates/<code>` and load the editor
  workspace.
- The 11 golden runtime-ready forms (`BM-001`, `BM-136`, `BM-148`,
  `BM-156`, `BM-157`, `BM-168`, `BM-171`, `BM-174`, `BM-181`, `BM-206`,
  `BM-213`) keep their full DOCX preview capability.
- The remaining 202 forms render in **local skeleton** mode: source-derived
  contract sections and fields load, a persistent warning banner is shown,
  DOCX preview / save are visibly disabled, and the tier badge is labelled
  `Local skeleton · Chưa runtime-ready`.
- Unknown codes (including the synthetic canary
  `__UNREGISTERED_FORM_CANARY__`) remain rejected with `404` /
  `UNREGISTERED_FORM`.

## What this mode does NOT do

- It does **not** promote any of the 202 forms to runtime-ready.
- It does **not** expand the production runtime allowlist, draft-bridge
  eligibility, or standalone runtime template list.
- It does **not** alter `runtimeReadyCount = 11` or `skeletonCount = 202`
  in `.cursor/qllaw-goal-state.json`.
- It does **not** make any of the 213 forms production-safe, customer-ready,
  deployment-ready, or DOCX-fidelity-verified.
- It does **not** write skeleton form data to authoritative persistence.

## Activation rules

The flag is honoured **only** when **all** of these are true:

1. `NODE_ENV=development`
2. `NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS="true"`
3. `CI` is unset or `false`

In any other configuration (production, CI, missing flag, flag ≠ `"true"`)
the application behaves exactly as before: 11 runtime-ready forms retain
their proven path, the 202 unregistered runtime forms remain fail-closed,
and unknown codes remain rejected.

## Local startup

1. Copy `.env.example` to `.env` (do not commit `.env`).
2. Ensure the standard local database stack is running (`pnpm db:up` or
   the equivalent).
3. Enable the flag for the web dev server only:
   ```env
   NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS=true
   ```
4. Start the web app in dev mode:
   ```bash
   pnpm --filter web dev
   ```
5. Open `http://localhost:3000/documents` and use the
   **Tất cả / Runtime-ready / Local skeleton** tier filter to switch
   between the 213 forms.

To exit this mode, remove the line from `.env` (or set it to `false`) and
restart the dev server.

## Verification

Run the dedicated guard before declaring success:

```bash
node --test test/stage-a/local-all-forms-unlock.guard.test.mjs
```

This guard enforces:

- `flag default is false`
- `production NODE_ENV cannot enable local unlock on its own`
- `CI mode keeps local unlock disabled even with flag set`
- `registry and promotion accounting remain 213 and 11`
- `synthetic canary code is never registered and always rejected`
- `no real BM code is used as the failure canary`
- `policy keeps skeleton output capabilities fail-closed`
- `policy does not expand production runtime or bridge lists`
- `template preview page wires unlock from explicit env + CI flag`
- `selector surfaces tier badge and filter for unlocked forms`

When the dev server is running, run the bounded browser smoke (4–8
workers, default 6):

```bash
pnpm smoke:local-unlock:213
```

The smoke:

- visits every registered BM code with controlled concurrency,
- verifies the tier badge (`runtime-ready` / `local-skeleton`),
- verifies the local-only warning banner is visible,
- verifies the canary code is rejected,
- writes a per-form verdict matrix to `.tmp-local-unlock-213-matrix.tsv`
  (`PASS` / `PASS_MINIMAL_FORM` / `FAIL` / `NOT_EXECUTED`),
- exits non-zero if any form fails or the canary is not rejected.

## Production safety

The following are explicitly **not** changed:

- `STANDALONE_RUNTIME_TEMPLATE_CODES`
- `RUNTIME_READY_FORM_FLIGHT_PROFILES`
- Production Docker Compose, deployment manifests, production env defaults
- `.env.docker.example`, `.env.e2e.example`
- Source DOCX contracts and compiled normalized DOCX files

The flag must remain unset in production and CI. Any release pipeline that
finds `NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS=true` outside a local
development shell is an incident, not a feature.
