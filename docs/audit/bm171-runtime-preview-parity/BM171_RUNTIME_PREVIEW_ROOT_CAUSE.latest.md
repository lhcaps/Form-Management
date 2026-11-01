# BM-171 Runtime Preview Root Cause

**Task**: `BM171_RUNTIME_PREVIEW_PARITY_FIX_AND_UI_TRUTHFULNESS`
**Date**: 2026-07-05
**Status**: ROOT_CAUSE_IDENTIFIED

## Symptom (verbatim from user)

The visible `/templates/BM-171` runtime PDF preview still shows:
- repeated `Căn cứ Điều 41 Bộ luật Tố tụng hình sự` (multiple legal-basis slots)
- wrong issuer title: `Cá nhân/Tổ chức theo quy định.`
- generic asset line: `Tài sản theo quy định pháp luật`
- wrong Điều 2: `Mô tả vụ việc mẫu`

The production render path (`apps/api/scripts/render-bm171-canonical-signoff-full.mjs`)
renders the canonical fixture to 34/34 slots with all of the correct anchors present.

## Investigation

### Step 1 — Reproduction script drives the SAME render pipeline

`apps/api/scripts/reproduce-bm171-runtime-preview-before.mjs` exercises
the exact `ContractRenderPlanBuilder` + `DocxtemplaterContractRenderEngine`
path that `StandaloneTemplateRenderService.renderDocx` and therefore
`RuntimePreviewSessionService.createPreviewSession` use. The only
variable is the input `data`.

When the script feeds the BM-171 runtime UX profile's `BM171_DEMO`
fixture (33 keys) — nested via `setPath` and then re-flattened the same
way `flattenRuntimeTemplateData` does — every required anchor is
present, no forbidden placeholder appears, and `Căn cứ Điều 41` count
is `0`.

```
[OK] Parsed 33 BM171_DEMO keys
[OK] Wrote request payload artifact
[OK] BM-171 runtime preview BEFORE fix matches production semantics.
```

Artifact: `docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_BEFORE.latest.docx`

### Step 2 — Where do the bad values come from then?

The bad values (`Căn cứ Điều 41...`, `Cá nhân/Tổ chức theo quy định.`,
`Tài sản theo quy định pháp luật`, `Mô tả vụ việc mẫu`) are **literal
return values of `generateFieldValue` in
`apps/web/src/features/forms-contracts/sample-data.ts` lines 475-511**.
They are produced when `applySampleData` calls
`getSampleData(contract.templateCode, contract.source.fields)` for a
template that is not in `SAMPLE_REGISTRY` (BM-171 is not), which then
falls through to `generateSampleFromFields(fields)` → `generateFieldValue`.

`applySampleData` is currently:

```ts
function applySampleData() {
  if (!contract) return;
  const profileSample = uxProfile?.demo;
  const generatedSample = getSampleData(
    contract.templateCode,
    contract.source.fields,
  );
  const sample = { ...generatedSample, ...(profileSample ?? {}) };  // ← profile wins on flat spread ✓
  if (Object.keys(sample).length === 0) { … }
  const next = mergeWithSampleData(data, sample);
  setData(next);
  …
}
```

**The flat spread correctly prefers profile.demo over generatedSample.**
So when `data = {}` and the user clicks demo first, `data` correctly
gets the profile values.

### Step 3 — But `previewDocx` posts `data` as-is

```ts
async function previewDocx() {
  …
  const session = await createRuntimePreviewSession(normalizedTemplateCode, data);  // raw `data`
  …
}
```

There are **two distinct paths** by which `data` reaches the backend with
the bad values from `generateFieldValue`:

#### Path A: Stale localStorage draft

`useEffect` loads `loadRuntimeTemplateDraft(localStorage, templateCode, contractHash)`.
If the user (or a prior session) clicked "Dữ liệu demo" when the BM-171
profile did not yet exist, or when the profile's `BM171_DEMO` was
incomplete, then `data` was set with the `generateFieldValue`
fallbacks and saved to localStorage. On subsequent loads, `data`
rehydrates with the bad values. `mergeWithSampleData` only fills
**empty** slots, so re-clicking "Dữ liệu demo" with `profileSample`
present does **not** overwrite the stale bad values — the stale values
remain and get posted to the backend unchanged.

#### Path B: User clicks preview without clicking demo

With fresh `data = {}`, the renderer uses each slot's `fallback: ""`
from `renderBindings`, so empty slots render as blanks (or, in the DOCX,
as paragraph with no content). The PDF preview would show a largely
empty form — not the bad fallback strings. So this path alone does
**not** explain the symptom. It does, however, explain why the UI is
"Đã tạo bản xem trước" (green) while the rendered DOCX is empty: a
misleading success state.

#### Path C: UI status does not reflect audit WARN

When the rendered DOCX does have content warnings (e.g. style-profile
drops the drafter notes 12/13, or the BM-171 `drop_legal_basis_blank_block`
triggers), the audit object returns `status: "WARN"`. The current UI
status text on line 184 still shows
`Đã tạo bản xem trước` whenever `pdfPreviewUrl` is present, regardless
of `audit.status`. That is the UI-truthfulness gap.

### Step 4 — Coverage gap in `BM171_DEMO`

`BM171_DEMO` covers 33 of 34 contract canonical fields. The missing
field is `document.issuePlaceAndDateLine` (intentional in the existing
profile because smart-generic-prefill is supposed to fill it).
Smart-generic-prefill only fills empty slots, so on a stale-draft
session this field would also be stale — currently harmless because
it is not in the user's complaint list, but it leaves the runtime
preview one slot short of full coverage. The fix should include this
slot in `BM171_DEMO` with a recognisably-synthetic value to match the
rest of the demo.

## Root Cause

| # | Issue | File / Function | Evidence |
|---|---|---|---|
| 1 | `applySampleData` does not overwrite **non-empty** stale slots at profile.demo paths when re-clicking demo, so a stale localStorage draft containing `generateFieldValue` fallbacks (e.g. `"Căn cứ Điều 41..."`) survives the merge and is posted to the backend. | `apps/web/src/components/documents/template-preview-workspace.tsx` :: `applySampleData` | `mergeWithSampleData` skips non-empty values; lines 703-716 of `sample-data.ts`. |
| 2 | `previewDocx` posts `data` to the backend as-is. There is no canonical-baseline re-assertion step before the request, so any path that produced bad values in `data` (stale draft, prior bad demo click) leaks straight through. | `apps/web/src/components/documents/template-preview-workspace.tsx` :: `previewDocx` (line 223). | Reproduction script proves that with `BM171_DEMO` values as input the render is correct; therefore the bug is upstream of the renderer. |
| 3 | UI status text shows "Đã tạo bản xem trước" (green) whenever `pdfPreviewUrl` is present, ignoring `previewSession.audit.status === "WARN"` and not distinguishing DOCX-only fallbacks. | `apps/web/src/components/documents/template-preview-workspace.tsx` :: `statusText` (lines 176-186). | Reading the JSX shows status depends only on `hasVisualPreview` and `isDirty`, not on `audit.status` or `warnings.length`. |
| 4 | `BM171_DEMO` is missing `document.issuePlaceAndDateLine` so smart-generic-prefill is the only thing that can fill it — leaving the runtime preview one slot short on stale drafts. | `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` :: `BM171_DEMO`. | `check-keys.mjs`: 33 BM171_DEMO keys vs 34 contract canonicalFields; only path not covered is `document.issuePlaceAndDateLine`. |

## Fix Shape

| # | File | Change | Why |
|---|---|---|---|
| 1 | `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` | Add `document.issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày … tháng … năm …"` to `BM171_DEMO` (synthetic, recognisably demo) so all 34 canonical paths are covered by the canonical baseline. | Closes the coverage gap; stale drafts at this path also get a clean value. |
| 2 | `apps/web/src/components/documents/template-preview-workspace.tsx` :: `applySampleData` | When `profileSample` is present, skip the `generatedSample` step (do not pull in `generateFieldValue` fallbacks). Continue to use `mergeWithSampleData` for **empty** slots so user-typed values are preserved. | Removes the noise vector for profile-equipped templates. Generic templates retain heuristic sample data. |
| 3 | `apps/web/src/components/documents/template-preview-workspace.tsx` :: `previewDocx` | Compute the request data as `data` re-asserted against `profile.demo` for **all** paths the profile covers. User edits at profile paths are preserved only if they were entered after a profile demo — but to be conservative and match the user-visible expectation ("preview shows what the demo button produces"), the baseline is profile.demo, and any **non-empty** value the user typed at a profile path is **kept** (override). If the user typed something different, the next click of "Dữ liệu demo" resets it. | Stops stale-draft leakage to the backend; preserves user overrides for typed values. |
| 4 | `apps/web/src/components/documents/template-preview-workspace.tsx` :: `statusText` | When `previewSession` exists, branch on `audit.status`: PASS + visual PDF → "Đã tạo bản xem trước" (green); PASS + DOCX-only → "Đã tạo file DOCX tạm thời (không có bản xem trước PDF)" (amber); WARN (any) → "Đã tạo bản xem trước với cảnh báo (N cảnh báo)" (amber); FAIL → "Tạo bản xem trước không thành công" (red). | UI truthfulness: never show green success when audit is WARN or PDF missing. |

The fix is intentionally **narrow**:
- No mutation of locked contracts (`docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json`).
- No mutation of normalized DOCX (`storage/templates/normalized-docx/...`).
- No mutation of source DOC/DOCX.
- No mass rollout to all 213 forms — fix is scoped to UX-profile-equipped runtime preview path.
- No `generatedDocumentId` fabrication; no auth/RBAC/middleware changes; no `/documents/:id` route.

## Required Out-of-Scope Items

- 55 non-canonical forms are NOT touched.
- 60 stabilization forms are NOT touched.
- PR7B / PR7C are NOT started.
- No commits, pushes, or PRs.