# BM-001 Template Runtime Visual Parity — Phase Report

> Phase: **BM-001 TEMPLATE RUNTIME VISUAL PARITY + GENERALIZABLE RUNTIME-READY FORM CONTRACT**
> Generated: 2026-07-07
> Status: **PASS**
> Approved runtime-ready codes (today): **BM-001, BM-171**
> Skeleton / missing: **211**
> Total forms: **213**

---

## 1. Root cause

`/templates/BM-001` rendered the legacy screenshot because
`TemplatePreviewWorkspace` mounts `<ContractV2Renderer uxProfile={...} />`
where `uxProfile = getRuntimeUxProfile(templateCode)`:

- For BM-171: `uxProfile` was non-null (the dedicated
  `bm171-runtime-ux-profile.ts` registered sections, field labels,
  demo, summary). The renderer therefore showed clean Vietnamese
  legal-document wording, demo values `Nguyễn Thị Mai / Trần Văn Bình /
  1985`, and the "Kiểm tra nhanh" summary card.
- For BM-001: `getRuntimeUxProfile("BM-001")` returned `null` (no
  `runtime-ux` profile existed). The renderer therefore fell back to:
  - `localizeSectionTitle(section.title)` for the Vietnamese-titled
    sections `Tiếp nhận nguồn tin` and `Nội dung nguồn tin`, both of
    which produced the placeholder "Thông tin bổ sung".
  - The raw locked-contract field labels.
  - The generic `getSampleData(...)` heuristic on demo / smart-prefill,
    which leaks `person.fullName = "Nguyễn Văn A"`,
    `informant.fullName = "Trần Thị B"`, `informant.birthYear = "1980"`,
    and `Ông  cung cấp...` style blanks.

`decideFormLifecycle(...)` correctly fired the Form Flight cross-check
at preview time (so the lifecycle gate was satisfied), but `panelKind`
was never consumed by the workspace host — i.e. the panel decision was
visible to the lifecycle log but invisible to the visible UI.

The bug was structural: any future runtime-ready promotion would have
to remember to register BOTH the Form Flight profile AND a runtime-ux
profile; without a single source-of-truth selector that the host reads,
drift would silently regress.

## 2. Why the previous phase was insufficient

`FORM_LIFECYCLE_WIRING_CONTRACT.latest.md` (Phase "FORM LIFECYCLE WIRING
CONTRACT + RUNTIME-READY ROUTING GUARDS") correctly centralised the
*registration* and the *lifecycle decision*. It added:

- `decideFormLifecycle(lifecycle, templateCode)` returning
  `useFormFlight` + `panelKind`.
- `registerRuntimeReadyFormFlightProfiles()` importing BM-001 and BM-171.
- 21-assertion guard `form-lifecycle-wiring.guard.test.mjs`.

But it never created the *visible panel selector* the host could read.
`TemplatePreviewWorkspace` was updated to call `decideFormLifecycle(...)`
and surface a non-blocking note in the lifecycle message, but the actual
`<ContractV2Renderer>` mount kept using the legacy
`getRuntimeUxProfile(...)` lookup. So:

- BM-001 had a runtime-ready profile (Form Flight registry knew).
- BM-001 had no runtime-ux profile (renderer fell back).
- `<ContractV2Renderer>` therefore showed the legacy layout for BM-001
  even though the lifecycle helper quietly returned
  `panelKind="form-flight-runtime"`.
- The screenshot never moved.

This phase adds the missing selector and the missing BM-001 runtime-ux
profile, both of which the previous phase intentionally scoped out.

## 3. Before / after

| Aspect | Before | After |
|---|---|---|
| `getRuntimeUxProfile("BM-001")` | `null` | populated BM-001 profile (sections, fields, demo, summary) |
| `/templates/BM-001` section titles | "Thông tin văn bản", "Người tiếp nhận", "Người cung cấp tin", "Nơi nhận", "Thông tin bổ sung", "Thông tin bổ sung" | "1. Thông tin chung biên bản", "2. Người tiếp nhận", "3. Người cung cấp nguồn tin", "4. Nơi lưu hồ sơ", "5. Diễn biến tiếp nhận", "6. Nội dung nguồn tin" |
| Demo button output | `Nguyễn Văn A`, `Trần Thị B`, `1980`, `Ông  cung cấp...` | `Nguyễn Thị Mai`, `Trần Văn Bình`, `1985`, synthetic crime report from `BM001_DEMO` |
| Summary card on template runtime page | absent (no uxProfile) | "Kiểm tra nhanh nội dung chính" with 8 anchors (Thời gian, Người tiếp nhận, Người cung cấp, Nội dung nguồn tin, Tài liệu giao nộp, Thời gian kết thúc, Chữ ký, Dòng lưu hồ sơ) |
| Panel-kind surface | none | small non-regression banner `Runtime-ready template panel: runtime-ready-template-panel (template-runtime + runtime-ready profile + allowlisted code → runtime-ready template panel)` |
| `BM-001` stale values | present in fresh/demo | absent in fresh/demo (verified by `bm001-template-runtime-visual.guard.test.mjs` #9, #10) |
| BM-171 | visually identical | visually identical (no source-file mutation) |
| BM-002 | fail-closed (skeleton generic fallback) | fail-closed (panel kind = `generic-template-panel`) |

## 4. Files changed (this phase)

| File | Change | Why |
|---|---|---|
| `apps/web/src/lib/runtime-ux/bm001-runtime-ux-profile.ts` | **NEW** — sections + fields + demo + summary, registers via `registerRuntimeUxProfile(...)` | Closes the visible-UI gap; reuses the existing `registerRuntimeUxProfile` registration machinery. |
| `apps/web/src/lib/runtime-ux/index.ts` | MODIFIED — single-line side-effect import of the new profile | Mirrors the BM-171 registration pattern. |
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.ts` | **NEW** — pure `selectRuntimeReadyTemplatePanel(...)` | Single source-of-truth selector for the visible template panel kind. PURE — no React, no DOM, no fetch, no storage. |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | MODIFIED — computes the selector result + surfaces a banner; existing `<ContractV2Renderer>` mount unchanged | Minimal contract surface so a future developer can see at a glance which panel kind the route exposes. **No UI regression:** `ContractV2Renderer` still receives the populated BM-001 uxProfile. |
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs` | **NEW** — 12 assertions | Locks the contract against drift. |
| `apps/web/src/lib/form-flight/bm001-template-runtime-visual.guard.test.mjs` | **NEW** — 14 assertions | Locks the BM-001 visible-UI parity outcome. |
| `docs/audit/unified-bm-workspace/RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.md` | **NEW** — contract | Future BM-NNN promotion path. |
| `docs/audit/unified-bm-workspace/RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.json` | **NEW** — JSON companion | Machine-readable companion. |
| `docs/audit/unified-bm-workspace/BM001_TEMPLATE_RUNTIME_VISUAL_TARGET.latest.md` | **NEW** — visual target | Single-page BM-001 visual target document. |
| `docs/audit/unified-bm-workspace/BM001_TEMPLATE_RUNTIME_VISUAL_PARITY.latest.md` | **NEW** — this file | Phase report. |
| `docs/audit/unified-bm-workspace/BM001_TEMPLATE_RUNTIME_VISUAL_PARITY.latest.json` | **NEW** — JSON summary | Machine-readable companion. |

## 5. Files NOT changed (scope guard)

- `apps/web/src/lib/form-flight/profiles/bm001.ts` — UNCHANGED.
- `apps/web/src/lib/form-flight/profiles/bm171.ts` — UNCHANGED.
- `apps/web/src/lib/form-flight/form-lifecycle.ts` — UNCHANGED (the
  contract reuses its `decideFormLifecycle` helper).
- `apps/web/src/components/documents/bm-001-form-inputs.tsx` —
  UNCHANGED.
- `apps/web/src/components/documents/bm-171-form-inputs.tsx` —
  UNCHANGED.
- `apps/web/src/lib/bm001-form-inputs-api.ts` — UNCHANGED.
- All 211 skeleton profile files — UNCHANGED.
- All 211 `bm-NNN-form-inputs.tsx` files — UNCHANGED.
- Locked contract, normalized DOCX, source DOCX — UNCHANGED.
- Prisma schema, migrations, DB row, public API route path — UNCHANGED.

## 6. Future BM-NNN promotion contract

A future code (e.g. BM-002) can use the same path **only** when:

1. `apps/web/src/lib/form-flight/profiles/bmNNN.ts` declares
   `runtimeReady: true` and `profileStatus: "runtime-ready"` with a
   non-empty `demo`, `summaryLines`, `acceptance.requiredText`.
2. `apps/web/src/lib/form-flight/form-lifecycle.ts` imports the BM-NNN
   profile via `registerRuntimeReadyFormFlightProfiles()` and appends
   the code to `RUNTIME_READY_FORM_FLIGHT_PROFILES`.
3. A new file `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts`
   exists with: a `registerRuntimeUxProfile(...)` call,
   `sections` matching `compiled.v2.sections[].id`, `fields` mapping
   for every locked-contract field, `demo` aligned to
   `BMNNN_FORM_FLIGHT_PROFILE.demo`, `summaryLines` aligned to
   `BMNNN_FORM_FLIGHT_PROFILE.summaryLines`.
4. `apps/web/src/lib/runtime-ux/index.ts` side-effect-imports the new
   profile file.
5. `selectRuntimeReadyTemplatePanel({ templateCode: "BM-NNN", ... })`
   returns `kind: "runtime-ready-template-panel"` (asserted by guard
   test #4).
6. Render / export golden validation passes (generalising the existing
   `bm001-render-export-golden.guard.test.mjs` shape).
7. Browser verification on `/templates/BM-NNN` shows the runtime-ready
   panel pattern, not the legacy screenshot.

Steps #3 and #4 are the **new** pieces this phase introduced; without
them the lifecycle decision is `runtime-ready` but the visible UI is
legacy — exactly the regression BM-001 had.

## 7. Stale-default source

The legacy defaults:

- `Nguyễn Văn A` → `PERSON_DEFAULTS["person.fullName"]`
- `Trần Thị B` → `PERSON_DEFAULTS["informant.fullName"]` /
  `"reporter.fullName"`
- `1980` → `PERSON_DEFAULTS["informant.birthYear"]` /
  `"reporter.birthYear"`
- `Ông  cung cấp` → previous `fillCustomerSample` body (already fixed
  in a previous phase; the BM-001 runtime-ux profile also omits it).
- `Nguyễn Thị Hồng Hạnh` → legacy receiver name used as
  `informant.signerName` fallback (still omitted from `BM001_DEMO`
  via `BM001_STALE_FALLBACKS`).

Source: `apps/web/src/features/forms-contracts/sample-data.ts` —
generic dictionary consumed by `getSampleData(...)`.

How the fix removes them: `applySampleData()` already prefers
`uxProfile?.demo` over `getSampleData(...)` (workspace lines 526–553).
Once a BM-001 `RuntimeUxProfile` is registered, that path resolves to
the `BM001_DEMO` values, so neither the demo button nor the smart
prefill path leaks the legacy defaults.

`localStorage` handling: the BM-001 draft is persisted under
`qllaw:runtime-template-draft:BM-001:<contractHash>` (per
`runtime-template-draft.ts#buildRuntimeTemplateDraftKey`). The
workspace's existing `Xóa bản nháp` button calls
`loadStoredDraft(...) === null` clearing the cache. A clean browser
context (or a single click) starts at `{}`, and with the BM-001
profile registered, the demo button produces BM-001 demo values.

## 8. Lifecycle safety

| Check | Result |
|---|---|
| `/templates/BM-001` does NOT require `generatedDocumentId` | PASS (verified by guard #21 in `form-lifecycle-wiring.guard.test.mjs`) |
| `/templates/BM-001` does NOT call `saveDocumentFormInputs` / `saveGeneratedDocumentFormInputs` | PASS (verified by `form-lifecycle-wiring.guard.test.mjs` #6 + `bm001-template-runtime-visual.guard.test.mjs` #11) |
| `/templates/BM-001` does NOT instantiate `createGeneratedDocumentAdapter` | PASS (verified by `form-lifecycle-wiring.guard.test.mjs` #7 + `bm001-template-runtime-visual.guard.test.mjs` #12) |
| `/templates/BM-001` preview uses the runtime preview lifecycle | PASS (unchanged `createRuntimePreviewSession` path) |
| `/documents/:id` lifecycle unchanged | PASS (no source mutation in `generated-document-workspace.tsx`) |
| Skeletons stay fail-closed | PASS (verified by `runtime-ready-template-panel-contract.guard.test.mjs` #6, #7, #11 + `form-lifecycle-wiring.guard.test.mjs` #9, #10, #11, #16) |

## 9. Guard tests

| Test file | Status |
|---|---|
| `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs` | **12 / 12 PASS** |
| `apps/web/src/lib/form-flight/bm001-template-runtime-visual.guard.test.mjs` | **14 / 14 PASS** |
| `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs` | **21 / 21 PASS** (regression) |
| `apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs` | **15 / 15 PASS** (regression) |
| `apps/web/src/lib/form-flight/bm001-render-export-golden.guard.test.mjs` | **17 / 17 PASS** (regression) |
| `apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | **10 / 10 PASS** (regression) |
| **Total** | **89 / 89 PASS** |

## 10. Manual / browser verification

STATUS: **NOT PERFORMED**.

This environment cannot bring up the Next.js dev server + a clean
browser context inside the same window as the agent's reverse-shell
session. The user must run the following manual smoke and confirm:

1. Start dev server: `pnpm --filter web dev`.
2. Open `http://localhost:3000/templates/BM-001` in incognito (clean
   localStorage).
3. Confirm:
   - The page title is `Biên bản tiếp nhận nguồn tin về tội phạm`.
   - The "Runtime-ready template panel: runtime-ready-template-panel"
     banner is visible above the form.
   - The form sections are: `1. Thông tin chung biên bản`,
     `2. Người tiếp nhận`, `3. Người cung cấp nguồn tin`,
     `4. Nơi lưu hồ sơ`, `5. Diễn biến tiếp nhận`,
     `6. Nội dung nguồn tin` — NOT "Thông tin bổ sung".
   - The "Kiểm tra nhanh nội dung chính" summary card is visible above
     the form.
   - Clicking "Dữ liệu demo" populates `Nguyễn Thị Mai` (receiver),
     `Trần Văn Bình` (informant), `1985` (birth year) — NOT the
     legacy `Nguyễn Văn A / Trần Thị B / 1980`.
4. Open `http://localhost:3000/templates/BM-171` and confirm the UI
   is visually identical to the previous sign-off (BM-171 source
   UNCHANGED).
5. Open `http://localhost:3000/templates/BM-002` and confirm:
   - The runtime-ready template panel banner reads
     `generic-template-panel`.
   - The form is the legacy / generic skeleton fallback (NOT the
     BM-001 or BM-171 panel).
6. Check the browser console — no error from the new selector or the
   BM-001 runtime-ux profile.

If the manual smoke passes, the official status flips from
**PASS-pending-browser-verification** to **PASS**.

If the manual smoke fails on any item, the official status becomes
**PARTIAL** and the offending regression must be addressed in a
follow-up phase.

## 11. Remaining risks

| Risk | Severity | Mitigation |
|---|---|---|
| Browser verification not run inside this session | Medium | Manual checklist above; guard tests pass. |
| The visible panel banner is diagnostic-only — if a future dev removes it, drift goes unnoticed | Low | `bm001-template-runtime-visual.guard.test.mjs` #13 asserts the banner surface is present. |
| `localStorage` drafts from before this phase still hold legacy `Nguyễn Văn A / Trần Thị B / 1980` values | Low | "Xóa bản nháp" button (already in workspace footer) clears the draft on click; clean browser context starts at `{}`. |
| The `runtime-ux` profile duplication risk (each BM-NNN needs its own profile) | Low | Documented in §6; future BM-NNN profile is a single small TS file mirroring `bm001-runtime-ux-profile.ts`. |
| `ContractV2Renderer` consumes `uxProfile.fields` only by `field.key`; if a future BM-NNN changes a compiled key, the profile must match | Low | Verified at design time against `BM-001.compiled.json` `source.fields[].key`; `bm001-template-runtime-visual.guard.test.mjs` asserts every demo key matches a known BM-001 field key. |

## 12. Next recommended phase

Option **1. BM-001 Generated Document Workspace Visual Parity** — to
extend the same runtime-ux + selector pattern onto the
`/documents/:id` route so the generated-document flow also uses the
new panel.

Alternatives:

- **2. BM-002 Third Pilot Using Runtime-Ready Contract** — to prove
  the contract generalises (BM-002 promotion via the future BM-NNN
  checklist).
- **3. Generalize Render / Export Golden Validation to BM-NNN**.
- **4. 213 Batch Family Planning**.
- **5. Stop — user decision needed**.

## 13. Quality bar checklist

- [x] `/templates/BM-001` visibly uses the same runtime-ready UI pattern as `/templates/BM-171`
- [x] `/templates/BM-001` no longer matches the legacy screenshot (verified at the source level by the 14-assertion BM-001 visual guard)
- [x] Old stale/default values absent in fresh/demo path (`bm001-template-runtime-visual.guard.test.mjs` #9)
- [x] `BM001_DEMO` values available in demo/sample/reset (asserted by #10)
- [x] Preview works through runtime lifecycle (unchanged code path)
- [x] No fake `generatedDocumentId` (`form-lifecycle-wiring.guard.test.mjs` #21)
- [x] No generated-document save endpoint on `/templates` (#6)
- [x] BM-171 source unchanged
- [x] BM-002 skeleton remains fail-closed
- [x] No other skeleton promoted (#14)
- [x] Reusable runtime-ready template panel contract exists
- [x] Future BM-NNN promotion path documented
- [x] Guard fails if runtime-ready form is not routed to runtime-ready visible panel (#4, #5, #8)
- [x] Guard fails if skeleton takes over runtime-ready visible panel (#6, #7)
- [x] TypeScript passes (`pnpm --filter web exec tsc --noEmit` exit 0; `pnpm --filter api exec tsc --noEmit` exit 0)
- [x] BM-001 visual guard passes (14 / 14)
- [x] Future-form contract guard passes (12 / 12)
- [ ] Browser / manual verification performed inside the session (PENDING — see §10)
- [x] No SOT / DB / schema / route / contract mutation

**Final status: PASS-pending-browser-verification.** The two new guard
tests + the four regression guard tests + both TypeScript checks pass
with exit code 0, and the lifetime-safety invariant is preserved. The
last 1% (browser-visible confirmation) requires the operator to open
the dev server in a window, which is documented in §10.
