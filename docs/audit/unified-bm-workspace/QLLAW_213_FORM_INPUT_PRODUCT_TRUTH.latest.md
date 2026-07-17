# QLLAW 213 Form Input Product Truth — latest snapshot

> **Source of truth for the current, evidence-based state of 213 form input usability in `/templates/BM-NNN`.**
>
> This document is intentionally pessimistic: it records what the user can actually do today,
> not what the form-input scaffolding could in principle do after several more phases of work.
> All counts were derived from a live read of the repository on the snapshot date.
> All claims of the form "BM-NNN is connected" or "BM-NNN is missing" are backed by
> the per-form linkage matrix in
> `QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.md` (sibling file).

## 0. Snapshot metadata

| Key | Value |
|---|---|
| Snapshot date | 2026-07-08 (Asia/Ho_Chi_Minh) |
| Branch | `feat/pr6g2-bm-final-audit-harness` |
| HEAD | `f215a52ab13268700e11bce143eed56f9ea5db76` |
| Dirty files (modified) | 170 |
| Dirty files (deleted) | 32 |
| Untracked (mostly new modules) | 339 |
| `pnpm dev` running | YES — dev server reachable on `http://localhost:3000` |
| `/templates/BM-001` HTTP status | 200 (no global 404) |
| `apps/api/.../health` HTTP status | 200 (terminal log evidence) |
| `pnpm dev:wait-ready` exit | 0 (terminal log evidence) |

## 1. Plain-language truth

1. **213 forms are not yet all input-complete.** The system has the scaffolding
   (compiled contracts, locked contracts, form-flight skeletons, runtime-ux registry)
   for all 213 forms, but the runtime-ux input layer is wired for **only 2** of them:
   `BM-001` and `BM-171`. The remaining 211 forms render the legacy
   `getSampleData(...)` heuristic when the user opens `/templates/BM-NNN`.
2. **BM-001 is not yet production-final** even though it is the most-complete
   example. Visible production bugs (see §3) are real and reproducible.
3. **BM-171 is the reference runtime-ready form.** Its runtime-ux profile is the
   canonical example for future promotions.
4. **211 forms are not yet completed as connected usable inputs.** Each opens,
   but the form input is a generic fallback, not a curated, profile-driven,
   smart-UX-bound input form.

## 2. Counts (evidence-based, not aspirational)

| Count | Value | Evidence |
|---|---|---|
| `docs/audit/docx/compiled-v2/BM-*.compiled.json` | **213** | `Get-ChildItem …Measure-Object` |
| `docs/audit/docx/contracts/locked/BM-*.contract.locked.json` | **213** | `Get-ChildItem …Measure-Object` |
| `apps/web/src/lib/form-flight/profiles/bmNNN.ts` (skeletons) | **213** | `Get-ChildItem …Measure-Object` |
| `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts` (curated UX) | **2** (BM-001, BM-171) | `Get-ChildItem …Measure-Object` |
| `RUNTIME_READY_FORM_FLIGHT_PROFILES` allowlist | **2** (BM-001, BM-171) | `apps/web/src/lib/form-flight/form-lifecycle.ts:115` |
| `bm-NNN-form-inputs.tsx` components (old panel) | **213** | repository scan |
| `FormFlightProfile` registered (all 213, skeleton) | 213 | `apps/web/src/lib/form-flight/registry.ts` |
| Forms with `INPUT_CONNECTED_PASS` (input UI opens, profile linked, fields visible, preview path available) | **2** (BM-001, BM-171) | this audit |
| Forms with `INPUT_CONNECTED_PARTIAL` (route/profile exists but smart controls / labels need human review) | **0** today, will be **213** after Phase 4 generator lands | this audit |

> **Important — the "INPUT_CONNECTED_PASS" definition is conservative.**
> It requires:
>   1. `/templates/BM-NNN` returns 200 (route opens).
>   2. `getRuntimeFormContract` returns the locked compiled contract.
>   3. A populated `RuntimeUxProfile` is registered.
>   4. At least one section renders with at least one visible field.
>   5. No fake `generatedDocumentId` is created.
>   6. No call to the generated-document save endpoint.
>   7. Preview uses runtime preview-session lifecycle.
>
> BM-001 currently fails points 4 (Section 1 "Chưa có trường dữ liệu" is the user-reported
> "empty section" bug — but it actually has a single smart control; the visible UX defect is
> that the stale-draft flow does not let the user click "Xóa bản nháp" to clear the legacy
> data so the smart control populates; see §3).
> BM-001 also fails the "no stale draft values" guarantee: legacy localStorage values
> (`Nguyễn Văn A`, `Trần Thị B`, `1980`) re-appear on every page reload.
>
> This audit therefore marks **BM-001 as INPUT_CONNECTED_PARTIAL** (not PASS) until the
> §3 fixes land, and **BM-171 as INPUT_CONNECTED_PASS** (the cleanest reference).
> After §3 fixes pass, BM-001 also becomes INPUT_CONNECTED_PASS.

## 3. BM-001 visible production bugs (must be fixed before declaring 213 work)

The user reported three concrete defects in the live `/templates/BM-001` page. Each
defect is reproducible; each defect has a specific, minimal patch.

### 3.1 `Xóa bản nháp` button is disabled when stale draft is present

**Symptom:** the localStorage draft contains legacy values
(`Nguyễn Văn A`, `Trần Thị B`, `1980`); the workspace correctly
detects them and shows the stale-draft warning banner; but the
"Xóa bản nháp" button is greyed out because the button is
disabled when `!isDirty`, and `isDirty` is `false` because the
loaded draft IS the saved snapshot.

**Root cause** in
`apps/web/src/components/documents/template-preview-workspace.tsx:1364`:
```tsx
disabled={!isDirty || isSaving || isExporting}
```

**Fix (minimum diff, no new framework):** when `hasStaleDraft`
is true, also enable "Xóa bản nháp" — the user has a clear
right to wipe stale data even if it equals the saved snapshot.
The reset path already wipes the localStorage key (`resetDraft`).

### 3.2 Section 1 (`section-document`) controls

**Symptom:** user reports "Section 1 shows 'Chưa có trường dữ liệu
trong phần này'." On a clean draft the section has one field
(`document.issuePlaceDateLine`) bound to a smart `issue-place-date-line`
control. With the legacy stale draft, the field IS rendered but it
displays the raw legacy string instead of the smart place+date
controls, which can read as "no usable input" to the user.

**Root cause:** the renderer IS rendering the smart control; the
*appearance* of emptiness is a side-effect of (a) the stale draft
loading the legacy line verbatim and (b) `localizeSectionTitle` for
`section.title === "document"` falling back to "Thông tin bổ sung",
which combined with the stale-draft banner makes the section look
broken even though it isn't.

**Fix:** the runtime-ux profile already supplies the proper title
("1. Thông tin chung biên bản"). The fix in this phase is to ensure
the stale-draft reset actually clears localStorage and the demo button
regenerates the smart control's three-part date/place inputs, so a
user who clicks "Dữ liệu demo" or "Xóa bản nháp" sees the smart
control populate correctly. No renderer change is required.

### 3.3 Stale-draft reset does not reload cleanly

**Symptom:** after `Xóa bản nháp`, the data is wiped from state,
but if the page is reloaded before the user types anything,
localStorage still holds the legacy value (the `resetDraft` function
already calls `removeRuntimeTemplateDraft`; this is fine — the
issue is the `hasStaleDraft` state lingers until next reload).

**Root cause:** `resetDraft` already sets `setHasStaleDraft(false)`
and `setData({})`. The issue is the user-reported
"stale draft values visible" perception is partially caused by the
demo button only resetting PROFILE paths, and BM-001 has the
profile-driven demo, so this should already work for BM-001.

The actual cleanest fix: make the "Dữ liệu demo" button apply
the curated `BM001_DEMO_RUNTIME_UX` profile demo (it already does),
which is the safe synthetic data set. Make the "Xóa bản nháp"
button unconditional when `hasStaleDraft` is true (3.1 fix).

### 3.4 Demo values

The BM-001 runtime-ux demo (canonical, curated) uses:
- `receiver.fullName = "Nguyễn Thị Mai"`
- `informant.fullName = "Trần Văn Bình"`
- `informant.birthYear = "1985"`

None of the legacy tokens
(`Nguyễn Văn A`, `Trần Thị B`, `1980`, `Ông  cung cấp`,
`Nguyễn Thị Hồng Hạnh`) appear in the curated demo.

The generic `getSampleData("BM-001", ...)` heuristic in
`apps/web/src/features/forms-contracts/sample-data.ts:531-559`
*does* still contain the legacy tokens in its override table.
This is the path that fires when a runtime-ux profile is NOT
registered. After Phase 4 (conservative runtime-ux profile
generation for all 213 forms), this path stops being hit for
any of the 213 forms. Until then, it is a known stale token
source and it is the user-visible cause of the legacy values
popping up in BM-001 in older sessions.

## 4. 211 other forms

**State:** the 211 forms other than BM-001 and BM-171 do not have
a registered runtime-ux profile. The `TemplatePreviewWorkspace`
component renders `ContractV2Renderer` with `uxProfile = null`,
which means:

- the renderer falls back to the contract's `localizeSectionTitle`,
  which renders unknown Vietnamese section IDs as the generic
  "Thông tin bổ sung" placeholder;
- the renderer renders each contract field as a plain `<input>` or
  `<textarea>` based on the locked `field.control` value;
- the "Dữ liệu demo" button uses the generic
  `getSampleData(templateCode, contract.source.fields)` heuristic,
  which is what produced the user-visible `Nguyễn Văn A` /
  `Trần Thị B` / `1980` tokens in earlier sessions;
- no smart controls (date-parts, time, select, issue-place-date-line,
  year-or-date) are wired — every text field renders as a raw
  text input;
- the "Kiểm tra nhanh" summary card is absent (it is a runtime-ux
  feature).

**What "input-connected" means for these 211 forms, after Phase 4:**

- `/templates/BM-NNN` opens (already true today);
- a `RuntimeUxProfile` is registered (NEW — Phase 4 generates it);
- sections render with proper Vietnamese titles (NEW — title comes
  from the runtime-ux profile, not from `localizeSectionTitle`);
- the "Dữ liệu demo" button uses a SAFE synthetic fixture that
  contains none of the legacy tokens;
- preview-session endpoint still works (already true);
- DOCX export still works (already true).

What Phase 4 does NOT pretend to deliver:
- legal-fidelity / golden-render evidence (separate phase, requires
  per-form DOCX/PDF round-trip);
- hand-curated Vietnamese legal labels for every field (the profile
  generator only ships label overrides for high-confidence keys
  and falls back to the contract's own label for everything else);
- "approval" for any of the 211 forms under the
  `RUNTIME_READY_FORM_FLIGHT_PROFILES` allowlist. That allowlist
  is intentionally strict (2 entries) and stays at 2 in this
  phase.

## 5. Hard refusals honoured in this snapshot

- `pnpm dev` is the user-confirmed start command (no new framework
  introduced; no parallel form system created).
- No source DOCX, normalized DOCX, locked contract, or DB row was
  mutated to produce this snapshot.
- No git commit, push, stage, branch, or PR was created.
- `qlv_session` was not used for web auth.

## 6. Pointer to detail

- Per-form linkage matrix: see
  `QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.md` (sibling file).
- Linkage contract: see
  `QLLAW_FORM_INPUT_LINKAGE_CONTRACT.latest.md` (sibling file).
- BM-001 specific fix record: see
  `QLLAW_BM001_PRODUCTION_FIX.latest.md` (sibling file).
- Browser smoke evidence: see
  `QLLAW_213_TEMPLATE_BROWSER_SMOKE.latest.md` (sibling file).
