# QLLAW Form Input Linkage Contract — latest

> This document records the **existing** flow that a user follows to open a form
> and provide input. It is not a new framework. It enumerates the eight links that
> connect a BM code to a usable, preview-able input form, and records what each
> link must guarantee in order for a form to be declared
> `INPUT_CONNECTED_PASS` (or `INPUT_CONNECTED_PARTIAL`).
>
> Read alongside `QLLAW_213_FORM_INPUT_PRODUCT_TRUTH.latest.md` for the
> snapshot count and the explicit per-form classification rules.

## 1. The eight links

The full chain, in order:

```text
BM code
  → locked compiled runtime contract
  → RuntimeUxProfile
  → ContractV2Renderer
  → runtime draft localStorage key
  → runtime preview payload
  → preview-session endpoint
  → DOCX download
```

Each link has a concrete existing implementation in the repository. The links
must be ordered; if any link is broken the form cannot be declared
`INPUT_CONNECTED_PASS`.

### 1.1 `BM code` → `locked compiled runtime contract`

- Source of truth: `docs/audit/docx/contracts/locked/BM-<NNN>__<hash12>.contract.locked.json`
  (213 files, immutable).
- Compiled equivalent: `docs/audit/docx/compiled-v2/BM-<NNN>.compiled.json`.
- Loader: `apps/web/src/lib/contract-platform-api.ts:getRuntimeFormContract`
  → `GET /api/v1/forms/runtime/<BM-NNN>` (server route in `apps/api/`).
- Guarantee: the server returns a payload whose `compiledContract.templateCode`
  equals `BM-NNN` and whose `compiledContract.source.fields[].key` is the same
  set the locked contract declares.
- Failure mode: `CONTRACT_BLOCKED` if the API returns 404 or 5xx, or the
  compiled hash changes between sessions (the localStorage key changes,
  throwing away the in-progress draft).

### 1.2 `locked compiled runtime contract` → `RuntimeUxProfile`

- Source of truth: `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts`
  (currently 2 files: `bm001-runtime-ux-profile.ts`,
  `bm171-runtime-ux-profile.ts`).
- Registry: `apps/web/src/lib/runtime-ux/index.ts` re-exports
  `registerRuntimeUxProfile` + `getRuntimeUxProfile`. New profiles are
  registered by adding one side-effect `import` line to the index barrel.
- Shape: see `apps/web/src/lib/runtime-ux/runtime-ux-profile.ts`. Sections,
  Fields, Demo, SummaryLines. Field overrides declare either `label` /
  `placeholder` / `control` (text-only overrides) or a `smart` block
  (one of `text | textarea | date | time | select | date-parts |
  year-or-date | issue-place-date-line`).
- Guarantee: profile `templateCode` matches the rendered contract's
  `templateCode`; sectionIds match the compiled `source.sections[].id`;
  field-keys match the compiled `source.fields[].key` (derived targets are
  acceptable as long as they are also declared in `derivedTargets`, not as
  standalone fields).
- Failure mode (without a profile): 211 of 213 forms. The renderer falls
  back to `getSampleData(templateCode, contract.source.fields)` for the
  "Dữ liệu demo" button, which is the legacy path that produces the
  `Nguyễn Văn A` / `Trần Thị B` / `1980` stale tokens.

### 1.3 `RuntimeUxProfile` → `ContractV2Renderer`

- Renderer: `apps/web/src/features/forms-contracts/ContractV2Renderer.tsx`.
- Workspace wires the profile in:
  `apps/web/src/components/documents/template-preview-workspace.tsx`
  (`getRuntimeUxProfile(runtime.compiledContract.templateCode)`)
  → `<ContractV2Renderer uxProfile={uxProfile} …>`.
- Guarantee: when a profile is supplied, every sectionId in the profile is
  matched against the compiled contract's section IDs, and every
  field-key in the profile is matched against the compiled fields. Smart
  controls route through `SmartControl` in `ContractV2Renderer.tsx` and
  the helper pipeline in
  `apps/web/src/lib/runtime-ux/smart-field-helpers.ts`.
- Failure mode: a profile whose sectionId is misspelled (e.g.
  `section-noi-dung-quyet-dinh` instead of the compiled contract's
  `section-noi-dung-quyet-inh`) silently falls through to
  `localizeSectionTitle`, which renders "Thông tin bổ sung" for the
  unmapped section.

### 1.4 `ContractV2Renderer` → `runtime draft localStorage key`

- Local storage module:
  `apps/web/src/lib/runtime-template-draft.ts`.
- Key shape: `qllaw:runtime-template-draft:<BM-NNN>:<contractHash>` —
  see `buildRuntimeTemplateDraftKey`. The contractHash is the hash returned
  by `getRuntimeFormContract` (§1.1).
- Reader: `loadRuntimeTemplateDraft(window.localStorage,
  templateCode, contractHash)`.
- Writer: `saveRuntimeTemplateDraft(window.localStorage,
  templateCode, contractHash, data)`.
- Remover: `removeRuntimeTemplateDraft(window.localStorage,
  templateCode, contractHash)`.
- Guarantee: the localStorage entry is per-form AND per-contract-hash.
  When the contract hash changes the in-progress draft is effectively
  discarded (a new key is used), which is intended.
- Failure mode: cross-form leakage happens only if the localStorage
  implementation is changed to drop the contract-hash segment.

### 1.5 `runtime draft localStorage key` → `runtime preview payload`

- Builder: `buildRuntimePreviewPayloadFromDraft` in
  `apps/web/src/lib/runtime-ux/runtime-preview-payload.ts`. Modes:
  `demo-reset | preview | export`.
- Guarantee:
  - `demo-reset` overwrites every `profile.demo` path with the demo
    value, even if the user typed something there. (This is the
    "Dữ liệu demo" button path.)
  - `preview | export` PRESERVES every user-typed value at a
    `profile.demo` path. Empty values are kept empty (server-side
    required validation blocks render). Values matching a known
    stale fallback (placeholder labels, legacy demo garbage) are
    CLEARED to `undefined`, treated as missing required.
- Failure mode: empty/stale values silently auto-replaced with demo.

### 1.6 `runtime preview payload` → `preview-session endpoint`

- Endpoint: `apps/api/...` runtime preview session route (called from
  `apps/web/src/lib/runtime-template-preview.ts`).
- Client helper: `createRuntimePreviewSession(templateCode, baseline)`.
- Lifetime: the session is a temporary object — no DB row is created,
  no `generatedDocumentId` is fabricated.
- Guarantee: no call to the generated-document save endpoint from this
  path. Verified by `apps/web/src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs`
  test #18.

### 1.7 `preview-session endpoint` → preview UI

- Renderer: `RuntimePdfPreview` in
  `apps/web/src/components/documents/runtime-pdf-preview.tsx`.
- Behaviour: shows the PDF preview if the session produced one, OR
  surfaces a "DOCX-only" message ("Đã tạo file DOCX tạm thời (không
  có bản xem trước PDF)") when the PDF pipeline is unavailable. The
  DOCX file is downloadable via the runtime-template-export path.

### 1.8 `preview-session endpoint` → `DOCX download`

- Client helper: `downloadRuntimeTemplateDocx(templateCode, baseline)` in
  `apps/web/src/lib/runtime-template-export.ts`, or
  `downloadRuntimePreviewDocxByUrl(...)` when the session exposes a
  direct download URL.
- Server: reuses the runtime preview render pipeline (no DB persist).
- Guarantee: DOCX download works whenever the preview-session endpoint
  returns a valid session. If it does not, the exact blocker is
  surfaced as a user-facing message.

## 2. `INPUT_CONNECTED_PASS` requires all eight links

A form is `INPUT_CONNECTED_PASS` when ALL of the following are observable:

1. `/templates/BM-NNN` returns HTTP 200.
2. The locked contract + compiled contract are loadable (1.1 ✓).
3. A populated `RuntimeUxProfile` is registered (1.2 ✓).
4. The renderer consumes the profile (1.3 ✓) and renders at least
   one section with at least one visible field.
5. Per-form localStorage key works (1.4 ✓).
6. `buildRuntimePreviewPayloadFromDraft` runs (1.5 ✓) without
   silently auto-replacing empty/stale values with demo data.
7. `createRuntimePreviewSession` returns a valid session (1.6 ✓).
8. DOCX download succeeds (1.8 ✓) OR the exact backend blocker is
   recorded in the per-form matrix.

A form is `INPUT_CONNECTED_PARTIAL` when (1)-(5) hold but (6)-(8) have
a known blocker that is recorded in the matrix.

A form is `ROUTE_BLOCKED` when (1) fails.
A form is `CONTRACT_BLOCKED` when (1) succeeds but (2) fails (API 404/5xx
or hash mismatch).
A form is `PREVIEW_BLOCKED` when (1)-(7) hold but (8) fails (DOCX pipeline
broke).

## 3. Required invariants

These invariants apply to every form input that claims to be
`INPUT_CONNECTED_PASS` or `INPUT_CONNECTED_PARTIAL`. Violating any of them
demotes the form to its correct status.

### 3.1 No fake `generatedDocumentId`

`/templates/:templateCode` MUST NOT fabricate a `generatedDocumentId`. The
runtime-ux preview-session lifecycle is a real, temporary, run-once endpoint
that DOES NOT touch the `generated_documents` table. Verified by
`runtime-ux-smart-field-contract.guard.test.mjs` test #18.

### 3.2 No call to the generated-document save endpoint

`/templates/:templateCode` MUST NOT call `saveDocumentFormInputs`, the
`POST /documents/:id/inputs` endpoint, or any equivalent persist-to-DB
endpoint. Same guard test as 3.1.

### 3.3 RuntimeUxProfile is allowed for all 213 input usability

The runtime-ux registry is open: any BM code can have a populated
profile. The `RUNTIME_READY_FORM_FLIGHT_PROFILES` allowlist stays strict
(Bit-2: BM-001 + BM-171 today) because that allowlist gates a STRONGER
guarantee (golden-render evidence, legal fidelity). Adding a new entry to
the allowlist is a hand-curated decision backed by golden-render evidence.
Registering a runtime-ux profile, by contrast, is allowed and encouraged.

### 3.4 All form inputs use locked contract keys only

Field override keys MUST be drawn from the compiled contract's
`source.fields[].key` set. A profile that declares a field not in the
contract is silently ignored by the renderer (the field override map
is never consulted for unknown keys), but it can confuse later audits.
Profiles generated by the Phase-4 generator script
(`scripts/audit/generate-213-runtime-ux-profiles.mjs`) are required to
emit only keys present in the compiled contract.

### 3.5 No duplicate disconnected field names

A profile MAY NOT declare two overrides at the same field key. The TypeScript
type itself enforces this (`Record<string, {…}>`), so a duplicate is a
compile-time error, not a runtime error.

### 3.6 No profile field declared unless profile.registered

The Phase-4 generator writes one `bmNNN-runtime-ux-profile.ts` per BM code.
A profile file MUST end with `registerRuntimeUxProfile(<profile>)` so
`getRuntimeUxProfile("BM-NNN")` returns non-null at runtime. The
`runtime-ux-smart-field-contract.guard.test.mjs` test #19 enforces "no
other skeleton file declares smart metadata" — this is the matching
invariant for the runtime-ux layer.

### 3.7 Sections with fields render fields

The renderer filters out hidden-by-smart fields before sorting. If a
section ends up with zero visible fields after filtering, the renderer
renders the "Chưa có trường dữ liệu trong phần này" placeholder. This is
intentional for legitimate empty sections (e.g. a section whose every
field is a derived target of a smart control). For BM-001 this is NOT a
bug — the section has the smart `document.issuePlaceDateLine` control,
which renders fine when the demo is applied or the legacy draft is
wiped.

### 3.8 Sections with no fields must be intentionally empty

If a profile declares a section whose every field is a derived target of
some smart control in the same profile, the section is allowed to render
empty. The Phase-4 generator records every such section as
`section_has_only_derived_fields: true` in the per-form matrix.

## 4. Status codex

| Status | Meaning | Promotion path |
|---|---|---|
| `INPUT_CONNECTED_PASS` | 1.1 - 1.5 ✓, 1.6 - 1.8 either ✓ or recorded | n/a (already passed) |
| `INPUT_CONNECTED_PARTIAL` | 1.1 - 1.5 ✓, 1.6 - 1.8 has blocker recorded | resolve blocker, re-run audit |
| `ROUTE_BLOCKED` | 1 fails (HTTP 404/5xx) | fix route, re-run audit |
| `CONTRACT_BLOCKED` | 1 succeeds, 2 fails | fix contract API, re-run audit |
| `PREVIEW_BLOCKED` | 1-7 ✓, 8 fails | fix DOCX pipeline, re-run audit |
| `FIDELITY_PENDING` | `INPUT_CONNECTED_PASS` but no golden-render evidence | add golden + smoke evidence |
| `FIDELITY_COMPLETE_EVIDENCED` | `FIDELITY_PENDING` cleared with render + browser evidence | hand-curated, allowlist-ready |

## 5. Pointer to detail

- Per-form linkage matrix: `QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.md`
- Per-form render smoke: `QLLAW_213_FORM_INPUT_RENDER_SMOKE.latest.md`
- Per-form browser smoke: `QLLAW_213_TEMPLATE_BROWSER_SMOKE.latest.md`
- Per-form completion matrix:
  `QLLAW_213_FORM_INPUT_COMPLETION_MATRIX.latest.md`
