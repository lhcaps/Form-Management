# Form Flight Baseline V1

**Task**: `BM171_VISUAL_SIGNOFF_AND_FORM_FLIGHT_BASELINE_V1`
**Date**: 2026-07-06
**Owner**: Cursor Executor (this commit), ChatGPT Planner/Gatekeeper
**Scope**: Codify the BM-171 `/templates/BM-171` runtime preview + demo flow
as the single route + core future templates must follow. No 213-form
mass rollout, no locked-contract mutation.

---

## Why this document exists

Before BM-171 visual signoff, every per-BM problem (preview staleness,
demo fallback leakage, summary card lies, missing-required bypass,
stale localStorage draft collision) was being patched with bespoke,
per-template prompt loops. Each fix touched a different file, used
slightly different field semantics, and was forgotten within a sprint.
This document freezes the **route** (the user-facing surface on
`/templates/:code`) and the **core** (the pure-function helpers that
back it) so future templates — BM-001, BM-023, BM-053, etc. — plug in
without re-deriving the same primitives.

The same baseline must apply to:

- The Next.js workspace shell (`template-preview-workspace.tsx`).
- The pure-function payload builder (`runtime-preview-payload.ts`).
- The runtime UX profile module (`bm171-runtime-ux-profile.ts` and
  any future `bmNNN-runtime-ux-profile.ts`).
- The browser-truth artifact pattern
  (`docs/audit/bm171-visual-browser-signoff/*.latest.*`).

---

## The route

```
/templates/[code]            — TemplatePreviewWorkspace, "use client"
   │
   ├── /templates/[code]?demo=1  — same route, demo state pre-loaded
   │
   └── POST /api/v1/forms/runtime/[code]/preview-session  — backend
```

The route is one URL per template. `/documents/:id` is a **separate
flow** — generated documents persist, audit-log, and have a
`generatedDocumentId`. The two flows must NEVER merge. This is the
hard boundary from `AGENTS.md`.

---

## The core (pure functions)

Six primitives, each testable in isolation, each with a single
responsibility:

| # | Symbol | File | Purpose |
|---|---|---|---|
| 1 | `RuntimeUxProfile` | `apps/web/src/lib/runtime-ux/runtime-ux-profile.ts` | Per-template UX metadata. UI-only — never touches contracts. |
| 2 | `getRuntimeUxProfile(templateCode)` | same | Returns a defensive deep-clone of the registered profile, or `null`. |
| 3 | `registerRuntimeUxProfile(profile)` | same | Side-effect registration. Called at module top-level of each `bmNNN-runtime-ux-profile.ts`. |
| 4 | `buildRuntimePreviewPayloadFromDraft({ draft, profile, mode })` | `apps/web/src/lib/runtime-ux/runtime-preview-payload.ts` | Pure payload builder. Three modes: `preview`, `export`, `demo-reset`. Returns `{ payload, sanitizedPaths, warnings }`. |
| 5 | `setNestedPath(data, path, value)` | same | Pure dot-path writer. Returns a fresh object. Used by all UI helpers. |
| 6 | `collectMissingRequired(data, requiredFieldKeys)` | `apps/web/src/components/documents/template-preview-workspace.tsx` | Pure validator. Returns the list of required-field paths whose value is empty / missing. Used by `previewDocx` / `exportDocx` to short-circuit the render endpoint. |

If a future template adds a 7th primitive, it must:

- Be a pure function (no React, no DOM, no fetch).
- Have a unit test under `apps/web/src/lib/runtime-ux/*.test.ts`.
- Be invoked from exactly one place in the workspace shell.
- Be invoked identically from preview AND export paths (parity).

---

## The 10 invariants

Each future template that lands in `/templates/[code]` MUST satisfy:

### Invariant 1 — Required fields gate the render endpoint

The workspace must call `collectMissingRequired(data, requiredFieldKeys)`
BEFORE posting to `/api/v1/forms/runtime/[code]/preview-session` or
`/api/v1/forms/runtime/[code]/export-docx`. If `missing.length > 0`:
- Set the `ErrorBanner` with the missing-field list.
- Do NOT call the render endpoint.
- Do NOT set `previewSession`.
- Do NOT show a green "Đã tạo bản xem trước" success state.

`requiredFieldKeys` MUST come from the locked contract JSON's
`canonicalFields.filter(f => f.required === true).map(f => f.path)`,
not from the UX profile.

### Invariant 2 — User-typed values win on preview/export

`buildRuntimePreviewPayloadFromDraft({ mode: 'preview' | 'export' })`
MUST preserve every non-empty user-typed value at a profile path.
The only sanitization permitted on these modes is whole-value exact
match against the known stale fallback fragments. No broad-substring
replacement. User-typed text that merely mentions a fragment (e.g.
"Căn cứ Điều 41 Bộ luật Tố tụng hình sự năm 2015; (đoạn do VKS bổ
sung)") MUST survive untouched.

### Invariant 3 — Empty required fields stay empty

`buildRuntimePreviewPayloadFromDraft({ mode: 'preview' | 'export' })`
MUST NEVER silently auto-fill an empty path with the demo value. The
required-field gate (Invariant 1) handles the user-visible error.
The payload builder must return the empty value as-is.

### Invariant 4 — `demo-reset` is the ONLY mode that overwrites

`buildRuntimePreviewPayloadFromDraft({ mode: 'demo-reset' })` is the
ONLY mode where `profile.demo` is forced onto user input. This is
the semantics the "Dữ liệu demo" button must trigger. All other
buttons (Xem trước bản in, Tải DOCX, Điền nhanh thông tin chung,
Nhập từ hồ sơ) MUST use `preview` / `export` modes and respect
Invariants 2 and 3.

### Invariant 5 — `preview` and `export` use the same sanitized payload

`exportDocx` and `previewDocx` MUST both call
`buildRuntimePreviewPayloadFromDraft` with their respective mode
(`preview` / `export`) and use the SAME sanitized payload semantics.
A unit test must prove the two modes produce identical payloads for
the same draft.

### Invariant 6 — Stale fallback fragments list is centralised

The list of stale fallback fragments (currently `Căn cứ Điều 41 Bộ
luật Tố tụng hình sự`, `Cá nhân/Tổ chức theo quy định.`, etc.)
lives in **one** file: `runtime-preview-payload.ts`. Other files
refer to the list through `buildRuntimePreviewPayloadFromDraft`'s
return value (`result.warnings`), never via a duplicated literal.
When a new fragment is identified, it is added there ONCE with a
whole-value exact-match regex.

### Invariant 7 — Summary card is data-driven

`uxProfile.summaryLines[i].value` is EITHER a `(data: Record<string,
unknown>) => string` function OR a literal string that is genuinely
constant for the document type (e.g. "QUYẾT ĐỊNH — TRẢ LẠI TÀI
SẢN"). Per-case fields (recipient name, document number, signer
name, asset list, archive line) MUST be functions. Functions MUST
return `—` (em-dash) when the path is empty — never a stale demo
label. A unit test must assert each data-driven line returns `—`
for an empty draft and the typed value for a populated draft.

### Invariant 8 — Preview session is invalidated on edit

When the operator edits the form after a `previewSession` was
created, the workspace MUST:
- Compare the new data snapshot against `lastPreviewSnapshotRef.current`.
- On mismatch: clear `previewSession`, set `prevPreviewWasStale: true`.
- Show a non-blocking amber hint: "Bản xem trước cũ đã bị vô hiệu do bạn vừa chỉnh sửa".
- Update `statusText` to: "Bản xem trước cũ đã bị vô hiệu — nhấn Xem trước bản in để tạo lại".
- The same logic fires when `applySampleData` is clicked.

This invariant is what closed the BM-171 "form is empty while PDF
preview still shows demo" class of bugs.

### Invariant 9 — UI truthfulness

The workspace must never show green "Đã tạo bản xem trước" when:
- `previewSession.audit.status === 'WARN'`.
- `previewSession.audit.status === 'FAIL'`.
- The PDF preview URL is missing (DOCX-only fallback).

Truthful wording:
- `PASS` + PDF available → "Đã tạo bản xem trước" (green).
- `PASS` + no PDF → "Đã tạo file DOCX tạm thời (không có bản xem trước PDF)" (amber).
- `WARN` + PDF → "Đã tạo bản xem trước với N cảnh báo" (amber).
- `WARN` + no PDF → "Đã tạo file DOCX tạm thời với N cảnh báo (không có bản xem trước PDF)" (amber).
- `FAIL` → "Tạo bản xem trước không thành công" (red).

### Invariant 10 — Browser-truth artifacts

Every visual signoff MUST be backed by an artifact pack under
`docs/audit/<templateCode>-visual-browser-signoff/`:

```
BM171_BROWSER_FORM_STATE.latest.json       — current draft + visible fields
BM171_BROWSER_PREVIEW_PAYLOAD.latest.json  — request payload posted to backend
BM171_BROWSER_PREVIEW_TEXT.latest.txt      — extracted visible text from rendered DOCX
BM171_BROWSER_PREVIEW_SCREENSHOT.latest.png — screenshot (Playwright when Chromium available;
                                                 1×1 PNG stub otherwise)
BM171_BROWSER_SIGN_OFF.latest.json         — per-blocker acceptance report
BM171_BROWSER_SIGN_OFF_CHECKS.latest.json  — must-contain / must-not-contain summary
```

The script lives at `apps/api/scripts/reproduce-bmNNN-visual-browser-signoff.mjs`
and is invoked via `pnpm --filter api exec tsx ./scripts/...`. The
script does NOT call the live HTTP endpoint — it drives the production
renderer (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine)
directly so it can run offline.

---

## The shape of a profile module

Every future `bmNNN-runtime-ux-profile.ts` must export a single
`registerRuntimeUxProfile` side-effect and conform to the
`RuntimeUxProfile` type. Required fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `templateCode` | `string` | yes | Must match the locked contract's `templateCode`. |
| `versionLabel` | `string` | yes | Surface this in audit artifacts. Bump on breaking changes. |
| `sections` | `Array<{ sectionId, title, description? }>` | yes | Section IDs MUST match the compiled contract's `sectionId`. |
| `fields` | `Record<path, { label?, placeholder?, helpText?, control? }>` | yes | `control` limited to `"TEXT" \| "TEXTAREA" \| "DATE_TEXT"`. |
| `demo` | `Record<path, string>` | yes | Every demo value MUST be recognisably synthetic (e.g. labelled "(mẫu)"). |
| `summaryLines` | `Array<{ label, value: string \| (data) => string }>` | recommended | Per-case values MUST be functions, not strings (Invariant 7). |

Profile modules MUST NOT:
- Mutate the locked contract.
- Mutate the normalized DOCX.
- Touch `generatedDocumentId` or any DB row.
- Pull in `generateFieldValue` heuristic fallbacks (those belong to
  the no-profile path only).

---

## What "DONE" looks like for a new template

A template is considered "Form-Flight-Baseline-V1 compliant" when:

1. The profile module exists at
   `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts` and is
   side-effect-imported by `apps/web/src/lib/runtime-ux/index.ts`.
2. All 10 invariants above pass an audit pass run by
   `apps/web/src/lib/runtime-ux/runtime-preview-payload.test.ts`
   (existing tests cover preview/export/demo-reset; new tests should
   pin per-template behaviour).
3. A visual signoff artifact pack exists at
   `docs/audit/bmNNN-visual-browser-signoff/`.
4. `pnpm audit:bm-final -- BM-NNN` and `pnpm audit:bm-rollout-ready
   -- BM-NNN` exit 0.
5. The locked contract is byte-identical before and after the change
   (verify via `git diff --stat docs/audit/docx/contracts/locked/BM-NNN*`).
6. The normalized DOCX is byte-identical before and after the change
   (verify via `git diff --stat storage/templates/normalized-docx/BM-NNN*`).

A template that does NOT satisfy items 1–6 is **not** rollout-ready.

---

## Out of scope (NOT done)

- No mutation of locked DOCX contracts (any of 213).
- No mutation of normalized DOCX (any of 213).
- No mutation of source DOC/DOCX (any of 213).
- No mass rollout to all 213 forms.
- No canonicalization of 55 non-canonical forms.
- No stabilization of 60 forms.
- No auth/RBAC/middleware changes.
- No `/templates/BM-NNN` → `/documents/:id` reroute.
- No `generatedDocumentId` fabrication.
- No commits / pushes / PRs.
- No style-profile engine rewrite (replaceText rule is out of scope).

---

## Future work (explicit next steps)

| Priority | Item | Why |
|---|---|---|
| High | Add a `replaceText` rule type to the style-profile engine | Currently the `Số:` no-space rendering issue can only be solved via font-kerning tolerance, since the locked contract text is `Số:{{document.documentCode}}` and locked-contract mutation is forbidden. A `replaceText` rule would let BM-171 rewrite `Số:` → `Số: ` at render time without touching the locked contract. |
| High | Generalise the visual-browser-signoff script into `reproduce-template-visual-browser-signoff.mjs -- BM-NNN` | Right now BM-171 has a bespoke script. Any template that ships a UX profile should be able to opt into the same evidence pack with a one-line invocation. |
| Medium | Replace the 1×1 PNG screenshot stub with a real Playwright session | When Chromium is available, the script should drive `playwright` to load `/templates/BM-NNN`, fill the demo, click Xem trước, and save the rendered panel. |
| Medium | Extend `summaryLines` support to `Record<label, { path, format? }>` | Today each line is a hand-written `(data) => string`. A declarative `{ path, format?: 'currency' \| 'date' \| 'plain' }` shape would cut per-template boilerplate in half. |
| Low | Promote the 10 invariants into `apps/web/AGENTS.md` | The workspace AGENTS file already pins the hard-boundary rules. Adding the 10 invariants next to them makes them harder to silently break. |

---

## Acceptance gates (this document is "live" when…)

- ✅ All 6 prior `bm171-runtime-preview-parity` artifacts exist and pass.
- ✅ `apps/web/src/lib/runtime-ux/runtime-preview-payload.test.ts` runs green (≥8 cases).
- ✅ `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.test.ts` runs green with the new summary-line tests.
- ✅ `docs/audit/bm171-visual-browser-signoff/*.latest.*` artifacts exist and pass.
- ✅ No locked contract diff (`git diff --stat docs/audit/docx/contracts/locked/`).
- ✅ No normalized DOCX diff (`git diff --stat storage/templates/normalized-docx/`).
- ✅ No commit / push / PR was performed.