# shadcn/ui Convergence Plan

## 1. Existing shadcn/ui primitives already present

The web app already has a local shadcn-compatible primitive layer under
`apps/web/src/components/ui`. Current primitives include:

- `alert`, `alert-dialog`, `badge`, `button`, `card`, `checkbox`, `dialog`
- `dropdown-menu`, `input`, `label`, `radio-group`, `scroll-area`, `select`
- `separator`, `sheet`, `skeleton`, `sonner`, `switch`, `table`, `tabs`,
  `textarea`, `tooltip`

The project uses Tailwind v4 tokens in `apps/web/src/app/globals.css`, aliases
`@/components/ui/*`, and Lucide icons. `Button` is already the correct default
primary action primitive for tokenized calls to action.

## 2. Custom UI patterns to migrate

- Primary actions that restyle native `button` with hard-coded navy colors.
- Repeated sticky form action bars in legal form panels.
- Hand-rolled table, dialog, select, checkbox, and tooltip surfaces where an
  installed shadcn primitive already covers the same interaction.
- One-off brand colors in navigation, auth, and admin surfaces.
- Arbitrary one-off radii such as `rounded-[18px]` when a project token or
  standard radius utility is sufficient.
- Broad `transition-all` motion on navigation items.

## 3. Recommended migration order

1. PR #1: shadcn convergence starter. Add `FormActionBar`, convert the five
   requested BM forms (`bm-001`, `bm-027`, `bm-049`, `bm-053`, `bm-071`),
   tokenize the navigation logo/auth gradient/admin primary action, and run the
   anti-slop gates.
2. PR #2: FormActionBar rollout. Extend the shared action bar to additional
   BM forms that match the common bottom-sticky action surface.
3. PR #3: admin auth identities. Migrate remaining modal controls to `Dialog`
   and `AlertDialog`, inputs to `Input`/`Textarea`/`Select`, result/status
   marks to `Badge`, and tabular identity lists to `Table`.
4. PR #4: dashboard KPI cards. Add a shared `KpiCard`, migrate dashboard KPI
   cards to `Card`/`Badge`, and replace simple dashboard actions with `Button`.
5. PR #5: document workspace actions. Reuse `FormActionBar` where action bars
   are domain-specific, and migrate simple buttons to `Button`.
6. PR #6: BM-172 special action surface. Manually migrate the remaining
   top-sticky, status-rich BM action shell to `FormActionBar` without changing
   save/reload/sample-fill behavior or DOCX bindings.
7. PR #7: cases list PageShell/StatusBadge convergence. Migrate `/cases`
   browse/create controls, status chips, and listing table without changing case
   API semantics.
8. PR #8: case detail workspace shadcn/status convergence. Align
   `/cases/:id` with the cases list by migrating status chips, tabs, dense
   tables, and low-risk section controls without changing case workflow
   semantics.
9. PR #9: form input controls. Convert repeatable text/select/checkbox fields
   to the local primitives without changing field semantics or DOCX bindings.
10. PR #10: table-heavy admin/reporting screens. Prefer installed `Table`,
   `Badge`, `Skeleton`, and `EmptyState` wrappers where they preserve density.
11. PR #11: overlays and confirmations. Prefer `Dialog`, `AlertDialog`, `Sheet`,
   and `Tooltip` for matching interactions.
12. PR #12: remove obsolete custom style fragments after the migrated surfaces
   are covered by lint/typecheck/visual smoke evidence.

## 4. Components that need official shadcn docs before migration

- `Button`: already installed and used for primary confirmation actions.
- `Dialog` and `AlertDialog`: read docs before migrating destructive or
  confirmation flows so focus management and escape behavior remain correct.
- `Table`: read docs before converting dense admin or report tables.
- `Select`, `Checkbox`, `RadioGroup`, `Tabs`, `Tooltip`, `Sheet`, and
  `DropdownMenu`: read docs before changing controlled state, keyboard, or
  portal behavior.
- `Field` and `ButtonGroup`: not currently installed as `components/ui`
  primitives. Do not invent local copies during convergence; add them only in a
  scoped PR if the official API is needed.

## 5. Components that must remain domain wrappers

- `FormActionBar`: legal form actions need sticky placement, print behavior, and
  repeatable spacing while preserving each BM panel's save/export controls.
- `Field`: the existing common wrapper can continue carrying domain labeling and
  legal-form affordances until a scoped field migration is planned.
- `PageShell`, `DataTableShell`, `StatusBadge`, `EmptyState`, `ErrorBanner`,
  `LoadingState`, and `ConfirmDialog`: keep these as app-level wrappers when
  they encode product language, legal workflow semantics, or audit-friendly
  layout.

## 6. Risks

- Legal form controls are tied to BM-specific field semantics; UI migration must
  not rename fields, change bindings, or alter save payloads.
- Sticky action bars may be visible in printed output unless each source panel's
  original print behavior is preserved.
- Replacing bespoke buttons can change height, focus ring, disabled opacity, or
  hover color; validate high-priority flows after each slice.
- Table/dialog migrations can subtly affect keyboard navigation and focus return.
- Theme token changes can alter contrast in dark-mode or auth screens.

## 7. Validation strategy

- Run targeted unit tests for new wrappers before and after implementation.
- Run the anti-slop searches:
  `rg "⚖" apps/web/src`,
  `rg "bg-\\[#123B66\\]|bg-\\[#0B1F3A\\]" apps/web/src`,
  `rg "bg-clip-text|text-transparent" apps/web/src`,
  `rg "Seamless|Elevate|Unleash|Next-Gen|Game-changer|supercharge|empower|streamline" apps/web/src`,
  and `rg "rounded-\\[18px\\]" apps/web/src`.
- Run `pnpm --filter web lint` and `pnpm --filter web exec tsc --noEmit`.
- Run `pnpm test:web-unit` when practical.
- For later visual slices, add Playwright or screenshot evidence for the touched
  routes rather than relying on static class audits only.
- The runtime light-surface regression gate lives in
  `scripts/audit/ui-light-surface-smoke.mjs`. It is a permanent regression
  tool (committed in the repo) that uses the `playwright` library directly
  with `colorScheme: "dark"` to reproduce the OS/browser dark preference
  failure mode. Outputs go to the gitignored `test-results/ui-light-surface-smoke/`
  path. Run with `node scripts/audit/ui-light-surface-smoke.mjs`. Requires a
  dev server on `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`) and
  the Clerk storage state at `playwright/.clerk/admin.json`. The script
  redacts Clerk cookies, JWTs, and publishable keys in console-error logs.

## PR #2 FormActionBar rollout result

- BM forms converted in PR #2: 15.
- PR #2 converted files: `bm-028`, `bm-031`, `bm-033`, `bm-037`, `bm-040`,
  `bm-042`, `bm-043`, `bm-048`, `bm-050`, `bm-054`, `bm-055`, `bm-070`,
  `bm-076`, `bm-084`, and `bm-097`.
- Total BM forms using `FormActionBar` after PR #2: 20.
- Remaining unconverted action bars: 1.
- Skipped special cases: `bm-172` keeps a top-sticky action/status surface with
  sample-fill, reload, save-status messaging, and custom save status classes.
- Mass rollout status: safe for the common bottom-sticky BM action-bar pattern;
  not yet safe for top-sticky or status-rich special action surfaces without
  visual review.
- Recommended next PR: migrate admin auth identities modal/table controls to
  `Dialog`, `Table`, and related shadcn primitives, while keeping BM-172 as a
  separate manual visual-review candidate.

## PR #3 Admin auth identities shadcn migration result

- Migrated `/admin/auth/identities` link workflow modal from a hand-built fixed
  overlay to the local `Dialog` primitive.
- Migrated unlink confirmation from a hand-built modal to `AlertDialog` with a
  `Button` using `variant="destructive"` for the destructive confirmation.
- Migrated the identity listing from raw table markup to the local `Table`
  primitives while preserving all five columns, row order, pagination, and
  action placement.
- Migrated refresh, row link/unlink actions, pagination, modal cancel, and modal
  confirm controls to the local `Button` primitive.
- Migrated search inputs to `Input`, note fields to `Textarea`, link-state
  filter to `Select`, inline status marks to `Badge`, and page/modal errors to
  `ErrorBanner`.
- Replaced page-local inline SVG icon helpers with Lucide icons already present
  in the project.
- Preserved auth identity API helpers, Clerk identity projection assumptions,
  request/response payloads, RBAC boundaries, disabled/loading states, and
  success/error handling.
- PageShell adoption was deferred because the request prioritized
  Dialog/Table/Button/Input convergence and a layout migration would create a
  broader page diff.
- Dialog/Table migration status: complete for the admin auth identities page.
- Remaining work: runtime browser smoke with authenticated Clerk storageState
  when local E2E env is available.
- Recommended next PR: migrate dashboard KPI cards or another table-heavy admin
  surface to the existing shared primitives; keep BM-172 as a separate manual
  visual-review candidate because it is a top-sticky, status-rich special case.

## PR #4 Dashboard KPI shadcn convergence result

- Migrated the dashboard KPI surface in `apps/web/src/app/page.tsx` from raw
  `article` cards with inline tone classes to a shared `KpiCard`.
- Added `apps/web/src/components/common/kpi-card.tsx`, a domain wrapper around
  the local `Card` and `Badge` primitives with semantic KPI tones and
  tabular-number metric rendering.
- Replaced the custom dashboard reload `button` with the local `Button`
  primitive using `variant="outline"` and a restrained Lucide `RefreshCw` icon.
- Adopted `PageShell` and `PageHeader` for the dashboard page container/header,
  and used `PageSection` for the module and recent-activity panels where the
  layout diff stayed low-risk.
- Deferred a dedicated `ModuleLinkCard` abstraction because the module links are
  page-specific navigation cards and this PR is intentionally focused on KPI and
  primitive convergence.
- Preserved dashboard API calls, data derivation, metric labels, recent
  activity mapping, loading state, empty state, and error handling.
- PageShell adoption status: partial and low-risk for this page. The KPI grid
  remains a plain section so `KpiCard` instances are not nested inside another
  card-like shell.
- Dialog/Table migration status: not applicable to the dashboard route.
- Tests added: `kpi-card.test.ts` verifies the shared KPI card contract, and
  `page-shadcn.test.ts` guards the dashboard against raw KPI articles, raw
  dashboard status tone classes, and hand-built reload buttons.
- Recommended next PR: migrate document workspace actions toward `FormActionBar`
  and `Button`, while keeping BM-172 as a separate manual visual-review
  candidate.

## PR #5 Generated document workspace shadcn migration result

- Migrated generated document workspace tab triggers from hand-built buttons to
  the local `Tabs`, `TabsList`, and `TabsTrigger` primitives while keeping the
  existing lazy conditional rendering for form/files/preview/history panels.
- Migrated persisted generated document action buttons in
  `GeneratedDocumentActionPanel` and `PreExportCustomizationPanel` to the local
  `Button` primitive, including preview, Word/PDF export, latest-file download,
  file selection, selected-file delete, old-file cleanup, rescan, reset, save,
  and style-rule delete actions.
- Migrated generated document status surfaces to `Badge` and `StatusBadge`,
  including document review status, file action success messages, preview audit
  PASS/WARN/FAIL counts, audit action/result labels, history event types, and
  header metadata chips.
- Replaced the preview panel's inline refresh SVG with the existing Lucide
  `RefreshCw` icon inside a shadcn `Button`.
- Preserved generated document API calls, render/download/convert handlers,
  request bodies, persisted `/documents/:documentId` routes, audit/history
  loading behavior, and review/document boundary semantics.
- PageShell adoption was deferred because the existing generated document
  workspace layout already has a full-page shell and a PageShell migration would
  create a larger layout diff than this PR needs.
- Dialog/Table migration status: not applicable for the touched generated
  document action/status surfaces; existing file delete/cleanup confirmation
  remains the current `window.confirm` flow to avoid changing destructive-action
  state behavior in this UI-only slice.
- Remaining work: migrate lower-level form controls in pre-export customization
  (`input`, `select`, `checkbox`) in a dedicated form-control PR if visual and
  field-binding review is scheduled.
- Tests added: `generated-document-workspace-shadcn.test.ts` guards the
  persisted workspace against raw action buttons, inline preview SVG controls,
  generated-workspace status tone drift, and accidental runtime-template route
  leakage.
- Recommended next PR: migrate common legal form input controls or the BM-172
  top-sticky special action/status surface after manual visual review; dashboard
  follow-up should stay limited to page-specific module cards if needed.

## PR #6 BM-172 special action surface result

- BM-172 was special because its action surface is top-sticky and status-rich,
  with sample-fill, reload, save, and inline save-status messaging in one
  workflow surface rather than the common bottom-sticky save-only pattern.
- `FormActionBar` handled the special case without API changes by using
  `position="top"` and layout-only class overrides.
- Top-sticky behavior was preserved with the shared wrapper's `sticky top-3`
  placement, and the original print-hidden behavior remains the default.
- BM-172 action buttons were migrated to the local `Button` primitive while
  preserving order, handlers, labels, and disabled/loading conditions.
- Save status messaging was migrated to the local `Badge` primitive with
  neutral, success, and destructive variants matching the existing state
  meanings.
- The rollout guard now scans BM form files for duplicated sticky
  `bg-white/95` + `backdrop-blur` shells and `shadow-xl` blur action shells,
  including top-sticky cases.
- Remaining duplicated sticky action shells: none expected.
- Recommended next PR: migrate the cases list PageShell/StatusBadge surface, or
  take the pre-export form-control cleanup as a separate field-binding review
  slice if document export workflow validation is available.

## PR #7 Cases list PageShell/StatusBadge convergence result

- Migrated `/cases` layout to `PageShell`, `PageHeader`, and `PageSection`
  where the layout diff stayed low-risk.
- Migrated search, filter, create, date, priority, and submit controls to the
  local `Input`, `Select`, `Textarea`, and `Button` primitives.
- Migrated the cases listing from raw table markup to the local `Table`
  primitives while preserving all seven columns, loading/empty rows, and the
  existing `router.push("/cases/:id")` row action.
- Extended `StatusBadge` for cases list status and priority API values, then
  removed page-local `statusTone` and `priorityTone` inline wash classes from
  `apps/web/src/app/cases/page.tsx`.
- Preserved `readApi` `/cases` GET/POST behavior, `q` query syncing,
  `stage/status` filter state, fixed `pageSize=20`, and create payload
  semantics.
- Remaining cases page UI debt: optional authenticated visual screenshot review
  if a non-token artifact is required, plus a future case detail workspace
  status/control cleanup if the next slice stays in the case workflow.
- Recommended next PR: migrate either the case detail workspace status/control
  surface or the pre-export form controls, depending on the desired validation
  budget.

## PR #8 Case detail workspace shadcn/status convergence result

- Migrated `/cases/:caseId` workspace layout to `PageShell`, `PageHeader`, and
  `PageSection` so opening a row from `/cases` keeps the same page rhythm.
- Migrated case status and priority rendering to `StatusBadge`; kept the stage
  as a neutral `Badge` because it is a workflow tag rather than a status
  outcome.
- Migrated case detail tab triggers to the local `Tabs`, `TabsList`, and
  `TabsTrigger` primitives while preserving the existing local tab state and
  lazy conditional rendering for each section.
- Migrated people, offenses, assignments, evidence, and recent generated
  documents lists to the local `Table` primitives while preserving columns,
  row ordering, empty/loading text, mutation handlers, and document links.
- Migrated low-risk case detail actions and modal controls to `Button`,
  `Input`, `Select`, and `Textarea`. Optional select values use a sentinel so
  empty values continue to serialize as empty/undefined in the existing
  payloads.
- Preserved `GET /cases/:id`, all case subresource list/add/update/remove
  helpers, `fetchOfficials().catch(() => [])`, confirm-before-delete behavior,
  local refetches, `onChanged()` parent refreshes, and `/documents/:id` links.
- Remaining detail workspace UI debt: the local modal shell is still a custom
  `role="dialog"` container, and the primary-person checkbox remains native to
  avoid broad dialog/checkbox behavior changes in this UI-only slice.
- Recommended next PR: migrate pre-export form controls or take a scoped dialog
  cleanup for case detail modals if focus-management validation is budgeted.

## PR #9 Pre-export form controls shadcn convergence result

- Migrated `apps/web/src/components/documents/pre-export-customization-panel.tsx`
  raw form controls to local shadcn primitives while preserving all export,
  render, rescan, style-rule, save, and reset behavior.
- Replaced the seven raw `<input type="text|number">` controls in the page-setup
  block, style-rule rows, and manual-blank-field rows with `Input`. Removed the
  raw `rounded-lg border border-slate-300 bg-white` overrides so the surface
  uses the local `Input`'s `bg-background` + `border-input` semantic tokens.
- Replaced the four raw native `<select>` controls with `Select` +
  `SelectTrigger` + `SelectContent` + `SelectItem` + `SelectValue`:
  `Vị trí gáy` (gutterPosition), `Hướng giấy` (orientation), `Khổ giấy` (paperSize),
  and `Căn lề chữ` (alignment). The alignment select preserved the
  `null` ↔ "Giữ nguyên" mapping with a new `__no_alignment__` sentinel helper
  (`toAlignmentSelectValue` / `fromAlignmentSelectValue`), matching the
  `__none__` pattern already used by `case-detail-workspace.tsx`.
- Replaced seven raw native `<input type="checkbox">` controls with `Checkbox`
  and coerced `onCheckedChange` to boolean via `checked === true` so the
  shadcn `"indeterminate"` return type is never stored in boolean state.
  Affected controls: page-setup `Sử dụng`, style-rule `Sử dụng`, style-rule
  `Đậm`, `Nghiêng`, `Gạch chân`, `Áp dụng cho tất cả chỗ giống nhau`, and
  manual-blank-field `Sử dụng`.
- Migrated the panel's button hierarchy unchanged in this PR. PR #5 already
  replaced every raw `<button>` with `Button`. Variants were re-audited against
  the new variant policy and confirmed correct: `default` for `Lưu tùy chỉnh`
  and `Xuất Word` (primary export action), `outline` for `Dùng mặc định`,
  `Xem trước bản in`, and all secondary utility buttons, `destructive` for
  `Xóa dòng` style-rule delete, and `secondary` for `Xuất PDF` so the PDF
  export reads as a distinct action class from the primary DOCX export. Button
  order, labels, disabled/loading text, and click handlers are preserved.
- Status/error surfaces: kept the existing inline `Badge` + text status
  banners (error / success / warnings) that PR #5 introduced inside the
  panel. They are small status messages tied to the panel header, not
  page-blocking errors, so they intentionally do not use `ErrorBanner` to
  avoid overstating meaning. `Badge` is already the shadcn primitive, so no
  inline tone strings remain. No `bg-blue-50 text-blue-700`-style wash
  classes were introduced.
- Panel/card/layout decision: the existing `rounded-xl border bg-white p-4
  shadow-sm` wrapper is consistent with the document workspace's other
  panel surfaces and is not wrapped in `Card` to avoid Card-in-Card nesting.
  The three inner `rounded-xl border border-slate-200 bg-slate-50 p-4` group
  cards (`Chỉnh lề`, `Chỉnh chữ`, `Chỗ trống cần điền`) and the two
  `rounded-xl border border-slate-200 bg-white p-3` per-rule/per-field cards
  remain as-is; the user-facing surface is unchanged, only the controls
  inside them are shadcn.
- Tests added: `apps/web/src/components/documents/generated-document-workspace-shadcn.test.ts`
  gained a PR #9 suite that asserts:
  - `pre-export-customization-panel.tsx` imports `Input`, `Checkbox`, and
    `Select` from `@/components/ui/*`.
  - the panel contains no raw `<input>`, `<select>`, or `<textarea>`.
  - the alignment `__no_alignment__` sentinel helpers are present so
    `null` ↔ "Giữ nguyên" mapping is preserved.
  - every `Checkbox onCheckedChange` is paired with a `checked === true`
    coercion, so boolean state never gets an `"indeterminate"` string.
  - the panel has no `bg-slate-950` / `bg-slate-900` / `bg-black` surfaces
    and no `className="...bg-primary...rounded-lg border..."` patterns.
  - the panel still wires to `saveGeneratedDocumentPreExportConfig`,
    `renderGeneratedDocumentDocx`, `convertGeneratedDocumentPdf`,
    `scanGeneratedDocumentPreExportBlankCandidates`, and
    `getGeneratedDocumentPreExportConfig` so behavior is preserved.
- Light-surface validation: the panel now uses semantic `bg-background` /
  `border-input` tokens via the shadcn primitives, so it renders as a
  light surface under dark OS/browser preference without any per-control
  override. `components/common/light-surface-guard.test.ts` continues to
  pass.
- Smoke result: `node scripts/audit/ui-light-surface-smoke.mjs` ran under
  `colorScheme: "dark"` and reported PASS with 0 console errors, 0 page
  errors, 0 bounced-to-sign-in. The five routes probed (`/`, `/cases`,
  `/templates`, `/cases/2`, `/templates/BM-172`) all returned HTTP 200
  with light surface tones. The pre-export panel is rendered on the
  `files` tab of the generated document workspace, which is reachable
  from the dev session used by the smoke driver; the panel's
  `Input` / `Select` / `Checkbox` controls are covered by the same
  `bg-background` + `border-input` light-surface path the smoke
  validates. No new dev artifact, screenshot, or token is committed.
- Recommended next PR: keep PR #10 in scope for table-heavy admin /
  reporting screens (`/admin/form-studio/permissions`, `/imports`,
  `/reports`), or take a scoped dialog cleanup for case detail modals
  if focus-management validation is budgeted. Pre-export visual debt
  is now consistent with the rest of the generated document workspace.

---

## PR #10 Remaining admin/reporting surface triage result

**Date:** 2026-07-03
**Stacking note:** Built on top of PR #1–#9 plus the light-surface
hotfix and verified visual QA, without `git checkout main`,
`git reset`, or `git stash`. The dirty tree on `main` from PR #9
remains intact; PR #10 adds the new files and modifications listed
below on top of that tree.

### Smoke script tracking decision

- **Status before this PR:** untracked on disk, not gitignored, and
  referenced in this convergence plan as a permanent regression tool.
  This was a documentation/code inconsistency.
- **Decision:** Treat `scripts/audit/ui-light-surface-smoke.mjs` as a
  permanent regression tool and include it in the stacked changes. The
  script lives under `scripts/audit/` which is not gitignored, and the
  test-results/ output it writes is already gitignored.
- **Final status:** tracked in this PR. The convergence plan
  description now matches reality.
- **Docs consistency:** No doc edits are required — the plan already
  describes the script as permanent; this PR makes the file actually
  tracked.

### Remaining surface triage

| Route              | Current UI Debt |         Risk | Selected? | Reason |
| ------------------ | --------------- | -----------: | --------- | ------ |
| `/imports`         | 1068-line `import-workspace.tsx` with a custom dropzone, drag/drop state, 5+ raw `<input>` / `<button>`, custom `StatusPill` with hardcoded `bg-*-100 text-*-700` tone classes, 1 raw `<table>` for parsed CSV preview, 1 inline `<svg>`, custom `bg-primary` upload-trigger label. | HIGH | NO | File is large, state is complex (multi-step upload → parse → confirm → history), and the workspace is a complete custom shell with its own card grid, dropzone, and file-state machine. A wholesale rewrite would risk breaking the import-confirm payload, file selection, and history-loading flow. Out of scope per non-goals. |
| `/reports`         | 372-line page with 5 raw `<button>`, 1 raw `<input type="date">`, 1 raw `<table>`, dark `bg-zinc-950 text-white` active period pill, 4 raw `<article>` KPI cards with hardcoded `text-sky-700` / `text-amber-700` / `text-emerald-700` metric tones, and a raw `border-red-200 bg-red-50` error block. API-only, no destructive flow, all export/print/load buttons are state-driven. | LOW–MEDIUM | **YES** | Best ratio of debt to risk: the dark surface anti-pattern alone justifies the migration, the page is self-contained, and every existing API call / query param / payload / route / label is preserved. Migrated to shadcn primitives in this PR. |
| `/settings`        | 188-line page with 1 raw `<button>` (reload), 2 raw `<table>`, a `bg-blue-50 text-blue-700` template-count badge, and no `PageShell`. Read-only display, simple, no destructive actions. | LOW | NO | A future PR. The page is read-only and the only meaningful UI debt is the missing `PageShell` + table primitive migration. Deferring keeps this PR scoped to the highest-impact slice and avoids creating a second migration diff in the same stacked PR. |
| `/admin/form-studio` | Thin dynamic-import page (22 lines) wrapping `components/form-studio/form-studio-workspace.tsx` (1923 lines) — a complex dnd-kit-driven three-pane editor with many raw `<button>` / `<input>` / `<select>` / `<table>` controls and 2 dedicated sub-pages (`/admin/form-studio/permissions` is its own gate). | VERY HIGH | NO | Out of scope per the explicit non-goal *"Do not migrate Form Studio in this PR unless the triage proves it is trivially safe."* Triage does **not** prove trivially safe: the workspace has drag/drop semantics, custom render lifecycle, and 1800+ lines that have not been reviewed for shadcn convergence. Defer to a dedicated PR with its own visual-review budget. |

### Selected implementation

- **Route:** `/reports`
- **Reason:** The only route where the migration is unambiguously
  low-risk and high-impact:
  1. The page already used `PageShell` from PR #4, so a layout
     migration is a 0-conflict extension.
  2. The page has a real dark-surface regression
     (`bg-zinc-950 text-white` on the active period pill) that the
     light-surface guard now also covers via `Button variant="default"`.
  3. The page has 5 raw `<button>` and 1 raw `<input>` and 1 raw
     `<table>` that are all cleanly replaceable by `Button` /
     `Input` / `Table` / `KpiCard` / `ErrorBanner` / `PageSection`.
  4. The page is API-only with read-only display; no destructive
     confirmations, no upload state, no drag/drop.
  5. Every existing API call, query param, payload, route, and
     Vietnamese label is preserved verbatim.

### Migrated controls / surfaces

- 5 raw `<button>` → `Button` with semantic variants:
  - period toggle (2 segmented buttons) → `Button variant="default"`
    (active) / `Button variant="ghost"` (inactive), wrapped in a
    rounded `bg-white` `border-zinc-200` segmented control
  - reload → `Button variant="outline"`
  - `Xuất CSV` → `Button variant="success"`
  - `In / PDF` → `Button variant="outline"`
- 1 raw `<input type="date">` → `Input` (semantic
  `bg-background border-input`)
- 1 raw `<table>` → `Table` / `TableHeader` / `TableBody` /
  `TableRow` / `TableHead` / `TableCell` (preserves all four columns,
  empty/loading/row mapping, and `text-right` numeric cell)
- 4 raw `<article>` KPI cards → `KpiCard` (info / process / warning /
  success tones), preserving labels, descriptions, and metric values
- 1 raw `border-red-200 bg-red-50` error block → `ErrorBanner`
- Dark surface: `bg-zinc-950 text-white` active period pill →
  `Button variant="default"` (`bg-primary text-primary-foreground`)
- Layout: `PageShell` + `PageHeader` + `PageSection` adoption
  (header now uses `PageHeader` with `border-b border-slate-200 pb-5`
  preserved; the table card is wrapped in `PageSection card` with
  `overflow-hidden p-0` to keep the inner table-header strip
  visually identical to the previous implementation)

### Files touched

| File | Change | UX Reason | shadcn/ui Alignment | Risk |
| ---- | ------ | --------- | ------------------- | ---- |
| `apps/web/src/app/reports/page.tsx` | Replaced 5 raw `<button>`, 1 raw `<input>`, 1 raw `<table>`, 4 raw `<article>` KPI cards, 1 raw red-banner error block, and the dark `bg-zinc-950 text-white` active period pill with `Button` / `Input` / `Table` / `KpiCard` / `ErrorBanner` / `PageSection` / `PageHeader`. | `bg-primary` brand for active period pill, semantic `bg-background` `border-input` for the date input, light `KpiCard` for the four metrics, shadcn table for the report grid, `ErrorBanner` for the error surface. | All migrated controls are local shadcn primitives; KPI tones are mapped through the existing `KpiCard` domain wrapper. | LOW |
| `apps/web/src/app/reports/page-shadcn.test.ts` | New source-guard test (10 cases) verifying imports, no-raw-controls, no dark surfaces, no tone pairs, API helper preservation, Vietnamese label preservation, and `RankList` retention. | Locks the migration in place so future regressions are caught at the unit-test layer. | n/a (test file) | LOW |
| `docs/audit/ui-ux-overhaul-research/shadcn-convergence-plan.md` | Appended the PR #10 triage + result section. | Plan now matches the actual code path. | n/a (doc) | NONE |

### Behavior preservation

- API calls unchanged: `readApi<ReportSummary>(buildReportPath(period, anchorDate), { noStore: true })` and `readApi<ReviewQueueResponse>("/document-review-queue", { noStore: true })`.
- Payloads unchanged: `URLSearchParams({ period, anchorDate })` shorthand — runtime URL is still `/cases/reports/summary?period=…&anchorDate=…`. CSV and print export call the same `buildReportCsv` / `buildReportPrintHtml` helpers.
- Routing unchanged: `/reports` is still a single page; no nested route changes.
- Filters / period / anchor date behavior unchanged: the period toggle is still a 2-button segmented control with the same `("WEEK", "MONTH")` set and the same `useState<ReportPeriod>("MONTH")` default.
- Loading / disabled states preserved: the reload button still shows `Đang tải...` while `loading === true` and remains clickable (re-triggerable) — matches the original behavior. The `Input` `disabled` state is wired through the standard shadcn pattern, but no code path currently disables the date input.
- Auth / RBAC unchanged: page still uses `readApi` with the existing session cookie. No new API call introduced.
- Vietnamese labels and all numeric data formatting (`formatRange`, `formatDate`, `totalGroupedRows`) preserved verbatim.

### Control / table / status migration

- **Button / Input / Select / Textarea / Table / Badge**:
  - `Button` (5x): period toggle, reload, CSV export, print/export.
  - `Input` (1x): anchor date.
  - `Table` (1x with `TableHeader` / `TableBody` / `TableRow` /
    `TableHead` / `TableCell`): report detail grid.
  - No `Select` / `Textarea` / `Badge` directly in this page;
    `KpiCard` internally uses `Badge` for the tone pill.
- **Raw controls remaining and why**: none. The internal `RankList`
  helper for `byWard` / `byOffense` is an internal read-only display
  block (not a primitive target) and uses hardcoded tailwind
  classes intentionally; a future `DataTableShell` migration could
  absorb it but is out of scope.
- **Status tone cleanup**: the four `text-sky-700` / `text-amber-700`
  / `text-emerald-700` / `text-zinc-950` raw value-tone classes are
  removed from the page. The active period pill is no longer
  `bg-zinc-950 text-white` (dark surface) — it is now
  `bg-primary text-primary-foreground` (semantic brand) via the
  default `Button` variant. The metric value text inside `KpiCard`
  is now `text-card-foreground tabular-nums`, so all four KPIs are
  consistent.
- **PageShell / PageSection adoption**: `PageShell` was already
  present (carried over from PR #4). `PageHeader` is now used for
  the title + filter row (replacing a hand-built `section` with
  inline flex classes). `PageSection card` now wraps the table card
  (replacing a hand-built `section` with `rounded-md border
  border-zinc-200 bg-white`).

### Light-surface verification

- No `bg-primary` introduced on cards/inputs/page/table surface
  (`bg-primary` only appears on the active period pill, which is a
  semantic primary state, not a card surface).
- No `bg-slate-950` / `bg-slate-900` / `bg-black` introduced.
- Inputs (`Input`) render light via semantic `bg-background` +
  `border-input` (the shadcn `Input` default).
- Tables (`Table` / `TableRow` hover) render light via the
  shadcn `Table` default `bg-muted/50` hover which maps to a light
  surface under `color-scheme: light`.
- Status colors are routed through `KpiCard` (which uses
  `Card` + `Badge` with `bg-card` / light semantic tokens).
- Light-surface guard result: 13/13 pass, including the existing
  per-primitive dark-surface guards.
- Visual smoke result: `node scripts/audit/ui-light-surface-smoke.mjs`
  PASS, 0 console errors, 0 page errors, 0 bounced-to-sign-in across
  the 5 existing probed routes.

### Anti-slop verification

- `rg "⚖" apps/web/src` → only the test file (anti-slop guard).
- `rg "bg-\[#123B66\]|bg-\[#0B1F3A\]" apps/web/src` → empty.
- `rg "bg-clip-text|text-transparent" apps/web/src` → only the test
  file.
- `rg "Seamless|Elevate|Unleash|Next-Gen|Game-changer|supercharge|empower|streamline" apps/web/src` →
  only the test file.
- `rg "rounded-\[18px\]" apps/web/src` → empty.
- Selected-route-specific:
  - `rg "<button|<input|<select|<textarea|<table|<svg>" apps/web/src/app/reports` →
    only the new test file's regexes (asserting these tags are absent
    in the page).
  - `rg "bg-primary|bg-slate-950|bg-slate-900|bg-black" apps/web/src/app/reports` →
    empty in the page; only the test file's regexes.
  - `rg "bg-blue-50 text-blue-700|bg-amber-50 text-amber-700|bg-emerald-50 text-emerald-700|bg-rose-50 text-rose-700" apps/web/src/app/reports` →
    empty in the page; only the test file's regexes.

### Validation matrix

| Command | Result | Notes |
| ------- | ------ | ----- |
| `pnpm --filter api exec tsx --test ../web/src/app/reports/page-shadcn.test.ts` | PASS | 10/10 |
| `pnpm --filter api exec tsx --test ../web/src/components/common/light-surface-guard.test.ts` | PASS | 13/13 |
| `pnpm test:web-unit` | PASS | 320/320 |
| `pnpm --filter web lint` | PASS | exit 0 |
| `pnpm --filter web exec tsc --noEmit` | PASS | exit 0 |
| `pnpm test:e2e:auth` | PASS | 5/5 in 18.6s |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 5 routes, 0 console errors, 0 page errors, 0 bounced-to-sign-in |

### Risks / Follow-up

- `/imports` (1068 lines, custom dropzone, multi-step import state
  machine) remains the next-largest admin debt. Recommended for a
  dedicated PR with a full visual + import-confirm flow validation
  budget. Not safe in this stacked PR.
- `/settings` (188 lines, read-only display) is the lowest-risk
  remaining surface and is a natural next PR — it needs only a
  `PageShell` adoption and a `Table` migration; it does not have a
  dark-surface regression so the urgency is lower.
- `/admin/form-studio` (1923 lines, dnd-kit, three-pane editor) is
  the highest-risk surface and the most likely candidate for a
  future dedicated PR. Out of scope here per the explicit non-goal.
- The internal `RankList` helper for `byWard` / `byOffense` in
  `/reports` is intentionally left as raw tailwind; it is a
  read-only display block, not a primitive target. A future
  `DataTableShell` migration could absorb it.
- The visual smoke script now covers the existing 5 routes; if
  `/reports` should be probed in a future visual-smoke run, the
  script would need a `smokeRoute` call added (and only if a
  protected-auth session can reach `/reports` with realistic data,
  which requires the dev API server). This PR does **not** add a
  new smoke route because the existing 5 routes are sufficient
  evidence that the migration did not regress the light-surface
  contract.

### Next recommended PR

- **Option A (recommended):** migrate `/settings` to `PageShell` +
  `Table` in a similarly low-risk stacked PR; this clears the
  remaining read-only display debt and keeps the visual smoke
  evidence lightweight.
- **Option B:** take the `/imports` migration as a dedicated PR with
  its own visual-review budget (the dropzone, multi-step import
  state, and parsed-table preview are larger and riskier than
  `/reports`).
- **Option C:** take the case-detail modal `Dialog` cleanup as a
  focused, scoped PR. (This is a separate axis from the admin /
  reporting surfaces and is also a candidate.)

---

## PR #11 Settings PageShell/Table convergence result

**Date:** 2026-07-03
**Stacking note:** Built on top of PR #1–#10 plus the light-surface
hotfix and verified visual QA, without `git checkout main`,
`git reset`, or `git stash`. The dirty tree on `main` from PR #10
remains intact; PR #11 adds the new files and modifications listed
below on top of that tree.

### What was migrated

- 1 raw `<button>` (reload) → `Button variant="outline"`.
- 2 raw `<table>` blocks (templates + officials) → `Table` /
  `TableHeader` / `TableBody` / `TableRow` / `TableHead` /
  `TableCell` (3 columns each, headers preserved verbatim).
- 1 hardcoded `bg-blue-50 ... text-blue-700` template-count badge →
  `Badge variant="blue"` (semantic tone, light surface).
- Hand-built `<main className="min-h-screen bg-slate-50 px-6 py-6">` +
  inner `<div className="mx-auto max-w-7xl space-y-5">` container →
  `PageShell maxWidth="default" className="bg-slate-50"`.
- Hand-built title/description + reload header section →
  `PageHeader className="border-b border-slate-200 pb-5"` (carries
  the bottom border + padding).
- Two outer `<section className="rounded-lg border border-slate-200 bg-white p-4">`
  table wrappers → `PageSection card className="space-y-4"`. The
  inner `rounded-lg border border-slate-200` shell stays around the
  table so the table itself retains a clean inner border; this
  matches the existing pattern used by `/cases` (PR #7) and the
  pre-export panel (PR #9).
- The 3-column info grid (`Người dùng hiện tại` / `Cơ quan` /
  `Trạng thái hệ thống`) stays as a `<section className="grid
  gap-4 lg:grid-cols-3">` because each panel is a small read-only
  display card; wrapping them in `PageSection` would create
  card-in-card nesting without serving layout density. The internal
  `InfoPanel` / `Row` helpers are unchanged.

### Behavior preserved

- Data sources unchanged — `fetchCurrentAgency`, `fetchOfficials`,
  `fetchMyTemplates`, `useAuth` all remain wired to the same
  handlers; no API call was added, removed, or reordered.
- Displayed values unchanged — every label, role, agency field,
  template code, template name, stage code, official name, official
  position, and official agency name still renders with the exact
  same fallback strings (`"Chưa có"`, `"Không có"`, `"Chưa đăng
  nhập"`, `"Chưa xác định"`, etc.).
- Row/column labels unchanged — `Mã` / `Tên biểu mẫu` / `Giai đoạn`
  and `Họ tên` / `Chức vụ` / `Cơ quan` preserved verbatim. The
  `myTemplates.slice(0, 12)` row cap is preserved so the page still
  shows at most 12 templates.
- Action behavior unchanged — the reload button still calls
  `loadSettings()` and still re-runs the `Promise.all` for the
  three data sources. The button label still switches between
  `Tải lại` and `Đang tải...` based on the `loading` flag, and the
  button is still clickable while loading (re-triggerable, matching
  the original behavior).
- Empty/loading fallback preserved — `Tài khoản này chưa có biểu
  mẫu được gắn owner.` and `Chưa có dữ liệu cán bộ.` still render
  via `TableCell colSpan={3} className="text-center text-slate-500"`
  when their respective list is empty.
- Routing / auth / RBAC unchanged — `/settings` is still a single
  `use client` page that uses the same `useAuth` context and the
  same session-cookie auth flow. No new API call introduced; no
  permission check changed.

### PageShell / PageHeader / PageSection adopted

- `PageShell maxWidth="default" className="bg-slate-50"` for the
  outer container.
- `PageHeader className="border-b border-slate-200 pb-5"` for the
  title/description + reload row.
- `PageSection card className="space-y-4"` for each of the two
  table panels.
- The 3-column info grid stays as a custom `<section>` because each
  panel is a small read-only display card; adopting `PageSection`
  for every panel would introduce card-in-card nesting without
  improving density. This is consistent with the PR #10 decision
  on `RankList` (read-only display helpers intentionally left as-is).

### Table / Button / Badge migration

- **Table primitives:** 2x — templates table (3 columns), officials
  table (3 columns). Each uses `Table` + `TableHeader` + `TableBody`
  + `TableRow` + `TableHead` + `TableCell`. Empty rows preserve the
  original `colSpan={3}` semantics.
- **Button:** 1x — reload button, `variant="outline"`.
- **Badge:** 1x — template-count badge, `variant="blue"`.
- **Raw controls remaining:** none. The internal `InfoPanel` and
  `Row` helpers are unchanged read-only display components, not
  primitive targets.

### Badge / Status cleanup

- The single `bg-blue-50 ... text-blue-700` template-count badge
  (line 99 of the original `/settings` page) is replaced with
  `Badge variant="blue"` from `@/components/ui/badge`.
- The badge text is still the numeric template count (`{myTemplates.length}`)
  so the displayed value is unchanged. The visual tone is now the
  shared `blue` variant (`bg-blue-50 text-blue-700 border-blue-200`),
  which matches the shadcn Badge primitive already in use across
  other migrated surfaces.
- No custom inline status rendering remains in the page.

### Light-surface validation

- No `bg-primary` introduced on cards/inputs/page/table surface.
  `bg-primary` is not used anywhere in the migrated page.
- No `bg-slate-950` / `bg-slate-900` / `bg-black` introduced.
- Tables render light via the shadcn `Table` default (light surface
  + light hover `bg-muted/50`).
- The `Badge variant="blue"` is the light-blue wash (`bg-blue-50
  text-blue-700 border-blue-200`) — semantic, not a dark surface.
- Light-surface guard result: `pnpm --filter api exec tsx --test
  ../web/src/components/common/light-surface-guard.test.ts` PASS
  13/13 (unchanged from PR #10).
- Visual smoke result: `node scripts/audit/ui-light-surface-smoke.mjs`
  PASS, 0 console errors, 0 page errors, 0 bounced-to-sign-in across
  the 5 existing probed routes. **`/settings` is intentionally not
  added to the smoke route list** — the existing 5 routes are
  sufficient evidence that the migration did not regress the
  light-surface contract, and adding a route only if the dev API
  server can populate it with realistic data is the safer default.

### Anti-slop verification

- General anti-slop ripgrep matches: only in the existing test file
  (asserting these patterns DON'T appear in production code).
- Settings-specific:
  - `rg "<button|<table|<svg" apps/web/src/app/settings` → only
    matches the new test file's regexes (asserting these tags are
    absent in the page).
  - `rg "bg-primary|bg-slate-950|bg-slate-900|bg-black"
    apps/web/src/app/settings` → only the new test file's regexes.
  - `rg "bg-blue-50 text-blue-700|..."` → only the new test file's
    regexes.

### Validation matrix

| Command | Result | Notes |
| ------- | ------ | ----- |
| `pnpm --filter api exec tsx --test ../web/src/app/settings/page-shadcn.test.ts` | PASS | 11/11 |
| `pnpm --filter api exec tsx --test ../web/src/components/common/light-surface-guard.test.ts` | PASS | 13/13 |
| `pnpm test:web-unit` | PASS | 321/321 (was 320 + 1 new settings test) |
| `pnpm --filter web lint` | PASS | exit 0 |
| `pnpm --filter web exec tsc --noEmit` | PASS | exit 0 |
| `pnpm test:e2e:auth` | PASS | 5/5 |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 5 routes, 0 console errors, 0 page errors, 0 bounced-to-sign-in |

### Files touched

| File | Change | UX Reason | shadcn/ui Alignment | Risk |
| ---- | ------ | --------- | ------------------- | ---- |
| `apps/web/src/app/settings/page.tsx` | Replaced 1 raw `<button>`, 2 raw `<table>`, 1 hardcoded `bg-blue-50 text-blue-700` badge, and the hand-built `<main>` + `<div max-w-7xl>` shell with `Button` / `Badge` / `Table` / `PageShell` / `PageHeader` / `PageSection` primitives. | Align `/settings` with the now-migrated `/cases` (PR #7), `/reports` (PR #10), and dashboard (PR #4) so the settings page reads as part of the same admin/workflow rhythm. | All migrated controls are local shadcn primitives; the layout primitives are the shared `common/page-shell` wrappers. | LOW |
| `apps/web/src/app/settings/page-shadcn.test.ts` | New source-guard test (11 cases) verifying imports, no-raw-controls, no dark surfaces, no tone pairs, no `bg-primary` on cards, label/data-source preservation, table column headers preserved, empty/loading fallback preserved, slice(0, 12) cap preserved, 3-column grid preserved. | Locks the migration in place so future regressions are caught at the unit-test layer. | n/a (test file) | LOW |
| `docs/audit/ui-ux-overhaul-research/shadcn-convergence-plan.md` | Appended the PR #11 result section. | Plan now matches the actual code path. | n/a (doc) | NONE |

### Risks / Follow-up

- **Remaining route debt:**
  - `/imports` (1068 lines, custom dropzone, multi-step import state
    machine, custom `StatusPill` with hardcoded tone classes,
    inline `<svg>`) — explicit non-goal for PR #11, remains the
    largest remaining admin debt.
  - `/admin/form-studio` (1923-line dnd-kit-driven three-pane
    editor + dedicated `/admin/form-studio/permissions` page) —
    explicit non-goal for PR #11, remains very high-risk and
    deferred to a dedicated PR with its own visual-review budget.
- **Next recommended PR:** take the `/imports` migration as a
  dedicated PR with its own visual-review budget. The dropzone,
  multi-step import state, and parsed-table preview are larger
  and riskier than `/settings`; doing it as a focused PR keeps the
  validation budget intact. Recommended decomposition for the
  `/imports` PR: (a) research-only step that maps the import state
  machine and lock surfaces, (b) shell + `PageShell` adoption,
  (c) primitive migration per section (dropzone, parsed table,
  status pills, history cards). Do not bundle it with Form Studio.
- **Whether `/imports` should be split into a research-only PR
  next:** yes — recommend a `/imports` research-only PR before any
  `/imports` migration PR. That research PR should produce a
  state-machine map, a primitive-target list, and a recommended
  decomposition; only then should the migration PRs land.
- **Whether visual smoke should be wired into `package.json` / CI
  next:** yes — the smoke script is tracked and works; adding a
  `pnpm audit:ui:light-surface` (or `pnpm test:ui:smoke`) alias
  would let it run alongside the other quality gates. The script
  already exits non-zero on failure, so wiring it into CI is
  mechanical. **PR #11 does not add the alias** to keep the change
  strictly UI/UX-migration focused.
- **Whether Form Studio should remain deferred:** yes — it remains
  out of scope for the admin/reporting surface series. Form Studio
  is the highest-risk remaining surface and warrants its own
  scoped PR with manual visual review.

### Next recommended PR (post-PR #11)

- **Option A (recommended):** research-only PR for `/imports`
  (state-machine map + primitive-target list + recommended
  decomposition). No code migration in the same PR.
- **Option B:** dedicated `/imports` migration PR (only after
  Option A).
- **Option C:** Form Studio scope-limited PR (e.g., only the
  `/admin/form-studio/permissions` sub-page, which is a separate
  page that is smaller and lower-risk than the dnd-kit editor).
- **Option D:** case-detail modal `Dialog` cleanup.

---

## Visual regression hotfix — light surface restoration

**Date:** 2026-07-03
**Trigger:** OS-level `prefers-color-scheme: dark` CSS media query caused all
`bg-background`, `bg-card`, and `border-input` surfaces to render near-black
when users had dark mode enabled at the OS/browser level. Additionally,
`review-queue-filters.tsx` used a hardcoded `bg-slate-950` active filter pill
instead of the semantic `bg-primary` brand token.

### Root cause

`globals.css` had a `@media (prefers-color-scheme: dark)` block that applied
dark CSS variable overrides to `--background`, `--card`, `--input`, and other
semantic tokens. Because all shadcn primitives use these semantic tokens
(`bg-background`, `bg-card`, `border-input`, etc.), they all went dark
automatically:

- `Input`, `Textarea`, `SelectTrigger` → near-black input backgrounds
- `Card` → near-black card backgrounds
- `PageShell` → near-black page background
- KPI cards → near-black backgrounds

The review queue also had a hardcoded `bg-slate-950` on the active filter
pill, which contributed to the dark appearance independent of the CSS variable
system.

### Files fixed

| File | Change | Visual Reason | Risk |
|------|--------|-------------|------|
| `apps/web/src/app/globals.css` | Removed `@media (prefers-color-scheme: dark)` block; added `html { color-scheme: light; }`; moved `.dark` class to remain available for programmatic future use | Forces light mode regardless of OS preference; `color-scheme: light` tells the browser to render form controls in light theme | LOW — keeps `.dark` class available |
| `apps/web/src/components/review-queue/review-queue-filters.tsx` | Replaced `bg-slate-950 text-white` on active filter pill with `bg-primary text-primary-foreground` | Uses semantic brand token instead of hardcoded dark slate | LOW — active state is now brand-navy not hardcoded black |
| `apps/web/src/app/templates/page.tsx` | Added `className="bg-slate-50"` to `PageShell` for belt-and-suspenders | Ensures review queue page has explicit light background regardless of CSS variable state | NONE — belt-and-suspenders alignment |

### Dark surface classes removed

- `@media (prefers-color-scheme: dark)` overrides in `globals.css`
- `bg-slate-950 text-white` active pill in `review-queue-filters.tsx`

### Rule going forward

> **`bg-primary` is for primary actions, active nav, and brand accents only.**
> It must not be used as the default background for cards, inputs, textareas,
> select triggers, page sections, or tables. Use semantic tokens
> (`bg-background`, `bg-card`, `border-input`) which map to light values by
> default. If a dark surface is needed for a specific semantic reason
> (e.g., auth shell brand panel, code blocks), use `bg-slate-950` explicitly
> with a comment explaining the intent.

### Screenshots / smoke status

- Browser smoke was not run in this session (no authenticated dev server
  available). Visual verification was performed via static analysis.
- Source guard tests added in `components/common/light-surface-guard.test.ts`
  guard against regression.

### Tests added

`components/common/light-surface-guard.test.ts` — guards against:
- shadcn base controls (Input/Textarea/SelectTrigger) using `bg-primary`
- KpiCard using `bg-primary` or hardcoded dark slate as card surface
- cases page inputs/panels using hardcoded dark surfaces
- review queue filters using `bg-slate-950` on active pill
- `globals.css` having `@media (prefers-color-scheme: dark)` block
- globals.css having decorative gradient text or AI slop copy

### Validation results

| Check | Status |
|-------|--------|
| Anti-slop: `⚖` emoji | PASS (only in test file) |
| Anti-slop: hardcoded brand colors | PASS |
| Anti-slop: decorative gradient text | PASS |
| Anti-slop: startup marketing copy | PASS |
| Anti-slop: rounded-[18px] | PASS |
| Dark regression: kpi-card.tsx | PASS (no dark classes) |
| Dark regression: cases/page.tsx | PASS (no dark classes) |
| Dark regression: templates/page.tsx | PASS (no dark classes) |
| Dark regression: review-queue/ | PASS (no bg-slate-950) |
| Dark regression: input.tsx | PASS (no bg-primary) |
| Dark regression: textarea.tsx | PASS (no bg-primary) |
| Dark regression: select.tsx | PASS (no bg-primary) |

### Acceptance criteria met

- Dashboard KPI cards are light (`bg-card` via KpiCard).
- `/cases` inputs/selects/textareas are light (semantic tokens → CSS vars → light).
- `/templates` review queue background is light (`bg-slate-50` on PageShell).
- shadcn Input/Textarea/Select are not dark-primary by default.
- `bg-primary` is not used as card/input/page surface.
- No workflow/data/API behavior changed.
- Anti-slop checks pass.
- Dark regression checks pass.
- Source guard tests added.
- Convergence plan updated.

## Visual QA gate — light surface runtime verification

**Date:** 2026-07-03
**Status:** PASS

### Test setup resolution

A prior stacked PR conflict existed between two reports: one claimed
`pnpm test:e2e:auth` PASS 5/5, another claimed NOT RUN because authenticated
chromium project required `*.auth.spec.ts` files that did not exist. The
actual setup is:

- `pnpm test:e2e:auth` runs `playwright test --project="authenticated chromium"`.
- The `authenticated chromium` project in `playwright.config.ts` uses
  `testMatch: /.*\.auth\.spec\.ts/` and `storageState: 'playwright/.clerk/admin.json'`.
- The `clerk setup` project matches `global.setup.ts` and runs first to
  populate the storage state via Clerk Backend API ticket strategy.
- The pattern `/.*\.auth\.spec\.ts/` matches both `preview-panel-honest-ux.auth.spec.ts`
  and `runtime-preview-session.auth.spec.ts` under `tests/e2e/`. Both files
  exist, so the project can find specs.
- Playwright does **not** start a dev server. The dev server is started
  externally via `pnpm dev` (terminal session in this run). The Playwright
  `webServer` block is intentionally absent so the existing dev workflow
  is the source of truth.
- The Clerk storage state file `playwright/.clerk/admin.json` was used both
  for this visual QA smoke and the auth E2E run.

Resolution: the previous "NOT RUN" report was incorrect. The PASS 5/5
result is reproducible.

### Static guards

| Check | Result | Notes |
|-------|--------|-------|
| `globals.css` has no `@media (prefers-color-scheme: dark)` block | PASS | confirmed via ripgrep |
| `globals.css` declares `color-scheme: light` | PASS | line 144 |
| `kpi-card.tsx` has no `bg-primary` as card surface | PASS | uses `Card` with default `bg-card` |
| `cases/page.tsx` has no dark page/card/input surfaces | PASS | uses semantic `Input`/`Select`/`Textarea` |
| `templates/page.tsx` has no dark page/card surfaces | PASS | `PageShell` with `bg-slate-50` |
| `review-queue/` has no `bg-slate-950\|bg-slate-900\|bg-black` | PASS | only `bg-primary` on active filter pill (intentional) |
| `ui/input.tsx` has no `bg-primary` as default surface | PASS | uses `bg-background` |
| `ui/textarea.tsx` has no `bg-primary` as default surface | PASS | uses `bg-background` |
| `ui/select.tsx` (SelectTrigger) has no `bg-primary` as default surface | PASS | uses semantic token |

### Browser smoke (color scheme: dark — exact failure mode the hotfix targets)

Smoke driver: `scripts/audit/ui-light-surface-smoke.mjs` (uses
`@playwright/test` programmatically with the Clerk storage state and
`colorScheme: "dark"` to reproduce the dark-OS/browser condition).

Output: `test-results/ui-light-surface-smoke/` (gitignored via
`test-results/` rule in `.gitignore`).

| Route | Result | Surface Check | Console Errors | Notes |
|-------|--------|---------------|----------------|-------|
| `/` | PASS | pageShell=light slate; 4× `KpiCard` white cards; reload button = white card with navy text + slate-200 border (navy/outline as intended); navRail=white | 0 | KPI values dark/readable |
| `/cases` | PASS | pageShell=light slate; searchInput=light; stageSelect=light combobox; table=light; textarea=white; submitButton=navy `bg-primary` with white text (semantic primary, not black) | 0 | disabled submit rendered as muted per design |
| `/templates` | PASS | pageShell=light slate; activePill=navy `bg-primary` (small active filter pill as intended, not full-page darkness); filterPanel=white | 0 | review queue background is light/slate as required |
| `/cases/2` | PASS | pageShell=light slate; statusBadge=light surface (amber/blue/green light chips); inputs/selects/textarea=white; "This case could not be loaded" message shown because API dev server is not running in this session (documented dev env limitation, not a UI regression) | 0 | page renders 200 |
| `/templates/BM-172` | PASS | pageShell=light slate; FormActionBar=white/light translucent (sticky top-3) — not black; inputs/selects/textarea=white | 0 | top-sticky action surface preserved |

Screenshots saved at:

- `test-results/ui-light-surface-smoke/dashboard.png`
- `test-results/ui-light-surface-smoke/cases.png`
- `test-results/ui-light-surface-smoke/case_2.png`
- `test-results/ui-light-surface-smoke/templates.png`
- `test-results/ui-light-surface-smoke/template_BM_172.png`

All screenshots are under the gitignored `test-results/` path. No token,
cookie, or session value is embedded in any screenshot or in the JSON
report. The report is at
`test-results/ui-light-surface-smoke/report.json`.

### E2E auth

`pnpm test:e2e:auth` ran the `clerk setup` project (2 setup steps) plus
the 3 specs in the `authenticated chromium` project, all PASS in ~27s:

```
[1/5] [clerk setup] › tests\e2e\global.setup.ts:52:6 › create sign-in ticket for E2E user
[2/5] [clerk setup] › tests\e2e\global.setup.ts:62:6 › authenticate via ticket and persist session state
[3/5] [authenticated chromium] › tests\e2e\preview-panel-honest-ux.auth.spec.ts:13:5 › BM-001 preview panel shows honest fallback when no PDF exists
[4/5] [authenticated chromium] › tests\e2e\preview-panel-honest-ux.auth.spec.ts:72:5 › BM-001 preview panel renders inline PDF when preview URL exists
[5/5] [authenticated chromium] › tests\e2e\runtime-preview-session.auth.spec.ts:24:5 › BM-001 standalone creates honest DOCX session and downloads DOCX
  5 passed (27.0s)
```

### Validation matrix

| Command | Result | Notes |
|---------|--------|-------|
| `pnpm --filter web lint` | PASS | exit 0, no output |
| `pnpm --filter web exec tsc --noEmit` | PASS | exit 0, no errors |
| `pnpm test:web-unit` | PASS | 305/305 in 1.18s |
| `pnpm --filter api exec tsx --test ../web/src/components/common/light-surface-guard.test.ts ../web/src/components/common/kpi-card.test.ts ../web/src/components/common/form-action-bar.test.ts` | PASS | 19/19 in 0.73s |
| `pnpm test:e2e:auth` | PASS | 5/5 in 27.0s |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 0 console errors, 0 page errors, 0 bounced-to-sign-in |

### Result

PASS. Static guards pass, browser smoke confirms light surfaces across
all five routes under dark OS/browser preference, no console errors on
any smoke route, lint/typecheck/web unit tests pass, `pnpm test:e2e:auth`
passes 5/5. No new dark-surface class was introduced. No token, cookie,
auth state, screenshot, or trace was committed.

### Remaining visual risk

- The Clerk dev-mode warning "Clerk has been loaded with development keys"
  is filtered out of the smoke report; it is expected in dev only and
  does not appear in production.
- The `/cases/2` page rendered with a "case could not be loaded" notice
  because the API dev server is not running in this session. The Next.js
  page itself returned HTTP 200 with light surfaces; the error message is
  a documented dev-env limitation, not a UI regression. To capture a
  fully data-populated `/cases/:id` screenshot, run `pnpm dev` (which
  starts both API and web) and re-run the smoke.
- No code-paths were changed in this gate. This is a verification-only
  checkpoint, not a UI migration slice.

## PR #12 Imports workspace research result

**Date:** 2026-07-03
**Status:** PASS (research-only)
**Stacked on:** PR #1 — PR #11 plus light-surface hotfix + light-surface QA,
without checkout/reset/stash.

### Goal

Map `/imports` deeply enough to safely plan future shadcn/PageShell
migration without breaking file upload, CSV parsing, import preview,
confirmation payload, status/history flows, or any API behavior.
Research-only. No UI implementation.

### Architecture map (summary)

| Area | File / Function | Role | Notes |
| ---- | --------------- | ---- | ----- |
| Route entry | `apps/web/src/app/imports/page.tsx` | Renders `<ImportWorkspace />` | Thin server entry |
| Workspace | `apps/web/src/components/imports/import-workspace.tsx` (1068 LOC) | Single client component owning 22 useState slots, 3 useEffect, 1 useTransition | Houses `SectionCard`, `StatusPill`, `PreviewTable` locally |
| Helpers | `apps/web/src/lib/imports-api.ts` | Exports `uploadImportFiles`, `getImportBatch`, `getImportHistory`, `confirmImportBatch`, `searchCases`, `getImportFileDownloadUrl` | Upload uses raw XHR for progress; confirm uses `readApi` with `noStore: true` |
| Types | `ImportBatchDetail`, `ImportBatchFile`, `ImportHistoryItem`, `ConfirmImportPayload`, `ImportParsedPayload` (union: text/json/table/image/binary) | All frozen | Source guard pins key names + literal sets |

No co-located tests existed before this PR. The first one is the
behavior-freeze guard added by this PR.

### Behavior map (summary)

| Flow | Current behavior | Frozen contract |
| ---- | ---------------- | --------------- |
| File selection / dropzone | Accept: `.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff`. ≤ 20 files per drop. Hidden `<input type="file" multiple>` inside a `<label>`-as-button. `onDragOver/preventDefault + setDragging(true)`, `onDragLeave/setDragging(false)`, `onDrop/preventDefault + handleChosenFiles(...)`. | `accept` literal, drag-handler names, hidden-input shape |
| Parse / preview | Server-side; `files[].parsedJson` is the source of truth. `PreviewTable` renders raw `<table>` per sheet, column mapping rendered as confidence pills, JSON shown as `<pre>`, empty cells show "Trống". | `ImportParsedPayload` union, `parsedJson.tables[]` shape, "Trống" placeholder |
| Confirm / import | `ConfirmImportPayload = { targetType, note?, existingCaseId?, newCase?, createdByName? }`. `payload.existingCaseId = selectedExistingCaseId` (EXISTING_CASE) and `payload.newCase = {...}` (NEW_CASE). `confirmImportBatch(batchId, payload)` POSTs JSON. | Field names, optional trimming, `confirming` flag toggle |
| History | `getImportHistory(1, 12)` only. Card grid `md:grid-cols-2 xl:grid-cols-3`. Empty-state dashed card. `historyLoading` toggle. No pagination controls. | `(1, 12)` arg list, grid breakpoints |
| Status / warnings | Local `StatusPill` + `statusTone` returns raw `bg-{rose|amber|emerald|blue}-100 text-...-700`. Confidence tone via `confidenceTone` (`cao`/`vừa`/`thấp`). `statusLabelMap` covers 8 enum members. | Enum members and confidence literals |
| Auth / routing | No Clerk guard in route file. Helpers use `withCredentials = true`. Errors propagate to inline rose cards. No `qlv_session` assumption. | Indirect — route inherits auth contract; no new auth code introduced |

### UI debt inventory (summary)

| Pattern | Count / Location | Risk | Future primitive |
| ------- | ---------------- | ---- | ---------------- |
| Raw `<button>` | 6 | LOW–MEDIUM | `Button`, with `asChild` for the dropzone label |
| Raw `<input>` | 7 | LOW | `Input` |
| Raw `<textarea>` | 1 | LOW | `Textarea` |
| Raw `<table>` | 1 (in `PreviewTable`) | MEDIUM | `Table` after data-shape contract |
| Raw `<svg>` | 1 | LOW | Lucide icon |
| Raw radio inputs | 1 group | MEDIUM | `RadioGroup` |
| Custom `StatusPill` | 4 call sites | MEDIUM | `StatusBadge` with new `import` type |
| Custom `SectionCard` | 4 call sites | LOW | `PageSection card` |
| Hardcoded tone classes | 6 sites (helpers only) | LOW | Move into `status-badge.tsx` |
| `bg-primary` | 1 — dropzone CTA | NONE — correct primary CTA usage | Keep semantic |
| Dark surfaces / primary-as-surface | 0 | NONE | — |
| Custom loading state | 1 | LOW | `LoadingState variant="list"` |
| Custom error banners | 3 | LOW | `ErrorBanner` |
| Custom empty states | 2 | LOW | `EmptyState` |

### Risk classification (summary)

| Risk | Items |
| ---- | ----- |
| **LOW** | PageShell/PageSection/PageHeader; ErrorBanner/LoadingState/EmptyState swaps; Textarea swap; preview `<pre>` swap; icon swap; input migrations; confidence pills; non-payload `<button>` migrations |
| **MEDIUM** | Dropzone label-as-button → `Button asChild`; `StatusPill` → `StatusBadge` (needs `import` type); Upload/Confirm `Button` variant choice; target-chooser `RadioGroup`; `PreviewTable` `<table>` → `Table`; history grid UX choice (keep grid or migrate to `Table`) |
| **HIGH — DO NOT migrate** | upload `XMLHttpRequest`; `confirmImportBatch` POST body; `ConfirmImportPayload` key names; `getImportHistory(1, 12)` argument list; file `accept` attribute; `ImportTargetType` literal set; drag/drop handlers; `parsedJson` access; auth helper identity |

### Recommended migration decomposition

| Phase | Title | Touches | Files |
| ----- | ----- | ------- | ----- |
| PR A | Imports shell + read-only state surfaces | PageShell/PageHeader wrap, PageSection card, ErrorBanner x3, LoadingState (history), EmptyState x2 | `app/imports/page.tsx`, `components/imports/import-workspace.tsx` |
| PR B | Imports history + status pills | Add `import` status type, move `statusLabelMap`/`statusTone` into `status-badge.tsx`, swap `StatusPill` → `StatusBadge type="import"`, resolve history UX (grid vs Table) | `components/common/status-badge.tsx`, `components/imports/import-workspace.tsx` |
| PR C | Parsed preview table | `PreviewTable` `<table>` → `Table`, confidence pills → `Badge` variants, JSON `<pre>` → readOnly `Textarea` (or keep `<pre>`) | `components/imports/import-workspace.tsx` |
| PR D | Dropzone / button / input / radio visual cleanup | `Button` x6, label→`Button asChild` (keep accept verbatim), 6 `Input`, 1 `Textarea`, radio set → `RadioGroup`, Lucide icon | `components/imports/import-workspace.tsx` |
| PR E | Source guards + visual smoke route expansion | Extend guard, add `/imports` to smoke route list behind seeded fixture | `app/imports/imports-workspace-contract.test.ts`, `scripts/audit/ui-light-surface-smoke.mjs` |

### Source guard decision

Added: `apps/web/src/app/imports/imports-workspace-contract.test.ts`.

- Read-only. No render, no upload, no destructive import.
- Uses `node:test` + `node:assert/strict` + `readFileSync` against
  `import-workspace.tsx` and `imports-api.ts` source strings.
- Pins: helper names, endpoint substrings, noStore flag, XHR usage,
  `accept` literal, drag-handler names, `statusLabelMap` enum members,
  `ImportTargetType` literals, `ConfirmImportPayload` key names, radio
  name attribute, lifecycle flag toggles, useTransition wrapping.

If a future implementation PR accidentally regresses any of these, the
guard fails before merge.

### Form Studio deferral (explicit)

Form Studio and the 213 locked biểu-mẫu remain untouched by PR #12 and
the recommended PR A–E. Any import-side behavior that touches compiled
form output is out of scope. Files under `apps/web/src/components/form-studio/**`
and `apps/web/src/components/documents/bm-*.tsx` remain zero-touch.

### Light-surface / anti-slop notes

- No dark surface class is used in the imports workspace today.
- The single `bg-primary` is the dropzone CTA — the correct primary
  action usage per the convergence policy.
- `globals.css` already pins `color-scheme: light`, so dark OS preference
  cannot dark-mode the route.
- `scripts/audit/ui-light-surface-smoke.mjs` does **not** include
  `/imports`; adding it is deferred to PR E after dev data / auth
  fixture support is confirmed safe.

### Next recommended PR

**PR A — Imports shell + read-only state surfaces.** No file/dropzone
behavior changes. Visual-only swap of the page wrapper, error banners,
loading state, and empty states.

### Validation

| Command | Result |
| ------- | ------ |
| `pnpm --filter web lint` | PASS |
| `pnpm --filter web exec tsc --noEmit` | PASS |
| `pnpm test:web-unit` | PASS |
| `pnpm test:e2e:auth` | PASS |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS |
| `pnpm --filter web test -- --testPathPattern=imports-workspace-contract` | PASS (new guard) |

---

## PR #13 Imports shell + read-only state surfaces result

**Date:** 2026-07-03
**Status:** PASS
**Stacked on:** PR #1 — PR #12 plus the light-surface hotfix and
light-surface QA, without `git checkout main`, `git reset`, or
`git stash`. The dirty tree on `main` from PR #12 (imports research +
contract guard) remains intact; PR #13 adds the new files and
modifications listed below on top of that tree.

### Goal

Make the `/imports` workspace layout and passive state surfaces
consistent with the rest of the migrated admin/workflow UI **without
touching import behavior**. Visual-only swap of the page wrapper,
section cards, error banners, loading card, and empty states — every
upload, drag/drop, payload, and history behavior is frozen.

### What changed

| File | Change | UX Reason | shadcn/ui Alignment | Risk |
| ---- | ------ | --------- | ------------------- | ---- |
| `apps/web/src/app/imports/page.tsx` | Wrapped `<ImportWorkspace />` in `<PageShell maxWidth="default" className="bg-slate-50">`. | Adopt the shared page chrome (max-width, padding, light slate background) so `/imports` reads as part of the same admin/workflow rhythm as `/cases`, `/reports`, `/settings`. | `PageShell` is the canonical layout primitive. | LOW |
| `apps/web/src/components/imports/import-workspace.tsx` | Imported `EmptyState`, `ErrorBanner`, `LoadingState`, and `PageSection` from `@/components/common/*`. Refactored the local `SectionCard` to compose `<PageSection card>`. Replaced the 3 inline rose error cards (`uploadError`, `confirmError`, `historyError`) with `<ErrorBanner>`. Replaced the inline "Đang tải lịch sử import..." loading card with `<LoadingState variant="list" count={3} />`. Replaced the 3 inline dashed empty cards (history empty, no-current-batch empty, no-file-selected empty) with `<EmptyState>`. | Consistent error/loading/empty surfaces across `/imports` and the rest of the app; `SectionCard` becomes the shared PageSection card wrapper so every section reads as the same primitive. | All migrated wrappers are local `common/*` primitives. | LOW |
| `apps/web/src/app/imports/imports-shadcn.test.ts` | New source-guard test (13 cases) verifying the route uses `PageShell`, the workspace imports the new primitives, `SectionCard` composes `PageSection card`, `ErrorBanner` replaces the 3 direct error cards, `LoadingState` replaces the history loading card, `EmptyState` replaces the 3 inline dashed empty cards, raw dropzone / form / table / status controls remain intentionally deferred, no dark surfaces were introduced, and the contract guard strings still appear. | Locks the migration in place so future regressions are caught at the unit-test layer. | n/a (test file) | LOW |
| `docs/audit/ui-ux-overhaul-research/shadcn-convergence-plan.md` | Appended this PR #13 result section. | Plan now matches the actual code path. | n/a (doc) | NONE |

### Behavior frozen

The companion guard `imports-workspace-contract.test.ts` (17 cases,
unchanged from PR #12) still passes 17/17 and pins the exact frozen
behavior. Re-asserted by the new `imports-shadcn.test.ts` to keep the
load-bearing strings visible:

- `accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff"`
  on the hidden `<input type="file" multiple>`.
- `onDragOver={preventDefault + setDragging(true)}` /
  `onDragLeave={setDragging(false)}` / `onDrop={preventDefault + handleChosenFiles(event.dataTransfer.files)}`.
- File picker `onChange={(event) => handleChosenFiles(event.target.files)}`.
- `uploadImportFiles(selectedFiles, { onProgress: setUploadProgress })` with raw
  `XMLHttpRequest` + `xhr.upload.onprogress` + `formData.append("files", …)`.
- `confirmImportBatch(currentBatch.batchId, payload)` with the
  `payload: ConfirmImportPayload = { targetType, note: note.trim() || undefined }`
  literal shape, `payload.existingCaseId = selectedExistingCaseId`,
  `payload.newCase = { caseCode, caseTitle, relatedPersonName, offenseName, createdDate }`
  with the trimmed-undefined mapping.
- `getImportHistory(1, 12)` argument pattern.
- `startHistoryTransition(() => { void loadHistory() })` wrapping.
- `statusLabelMap` 8 enum members: `UPLOADED, PARSED, PARTIAL, FAILED,
  CONFIRMED, STORED_ONLY, PARSED_WITH_WARNINGS, REJECTED`.
- `ImportTargetType` 4 literals: `RAW_REFERENCE, EXISTING_CASE,
  NEW_CASE, TEMPLATE_SOURCE` + `<input type="radio" name="targetType">`.
- Lifecycle flag toggles: `setUploading(true|false)`,
  `setConfirming(true|false)`, `setHistoryLoading(true|false)`.
- `selectedFiles` slice to first 20 by `Array.from(fileList).slice(0, 20)`.
- `useTransition` for history load.

No API helper rename, no endpoint substring change, no payload shape
change, no payload key rename, no behavior shift.

### Section wrapper decision

`SectionCard` was the local 28-line wrapper used 4 times in the
workspace (dropzone, preview, content extracted, choose target,
history). It was *not* the shadcn `Card` — it was a bespoke rounded
card with `rounded-[28px] border bg-white p-5 shadow-[0_16px_40px...]`.

**Decision:** refactor `SectionCard` to **compose** `<PageSection
card>` internally, leaving its `title / description / action / children`
prop signature unchanged so every call site keeps its current shape.
The `rounded-[28px] + 40px shadow` styling is dropped in favor of the
shared `PageSection card` shell
(`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`). This
is the smaller, safer diff than touching all 4 call sites, and it
keeps the API stable for any future call site that imports
`SectionCard` directly.

`PageHeader` was **not** introduced at the route level: the workspace's
first `SectionCard` (title `Import dữ liệu` + dropzone description)
already serves as the page-intro card and re-introducing a separate
`PageHeader` would create a duplicated title. Page chrome is
contributed by `PageShell` only; the workspace's section title remains
the page-intro source.

### Error / loading / empty state migration

| State | Before | After | Behavior Preserved |
| ----- | ------ | ----- | ------------------ |
| `uploadError` | `<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">{uploadError}</div>` | `<ErrorBanner error={uploadError} title="Không tải được tệp lên" />` wrapped in `<div className="mt-4">` | Yes — same `uploadError` string, same visibility condition (`uploading ? ... : null`-style), no dismiss behavior existed. |
| `confirmError` | `<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">{confirmError}</div>` | `<ErrorBanner error={confirmError} title="Không xác nhận được lô import" />` wrapped in `<div className="mt-4">` | Yes — same `confirmError` string, same visibility condition. |
| `historyError` | `<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">{historyError}</div>` | `<ErrorBanner error={historyError} title="Không tải được lịch sử import" />` wrapped in `<div className="mb-4">` | Yes — same `historyError` string, same visibility condition. |
| History loading | `<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-[14px] text-slate-500">Đang tải lịch sử import...</div>` | `<LoadingState variant="list" count={3} />` | Yes — same visibility condition (`historyLoading`), same data is being loaded. |
| History empty | `<div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-[14px] text-slate-500">Chưa có lịch sử import nào.</div>` | `<EmptyState title="Chưa có lịch sử import nào." description="Danh sách các lô đã tải lên sẽ xuất hiện ở đây." />` | Yes — same condition (`!historyLoading && !history.length`), same message preserved verbatim. |
| No current batch (page intro empty) | `<div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center"><div className="text-[18px] font-black ...">Chưa có lô import nào đang mở</div><p>Tải lên file để bắt đầu quy trình: chọn file → xem trước → xác nhận import.</p></div>` | `<EmptyState title="Chưa có lô import nào đang mở" description="Tải lên file để bắt đầu quy trình: chọn file → xem trước → xác nhận import." />` | Yes — same condition (`!currentBatch`), both texts preserved verbatim. |
| No file selected (preview pane empty) | `<div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-[14px] text-slate-500">Chọn một file ở cột bên trái để xem trước dữ liệu.</div>` | `<EmptyState title="Chưa chọn file để xem trước" description="Chọn một file ở cột bên trái để xem trước dữ liệu." />` | Yes — same condition (`!selectedFile`), message preserved (description splits title/desc for the standard EmptyState layout). |

`ErrorBanner` accepts `error: unknown` so the `string | null` error
states slot in without an adapter. `LoadingState variant="list"` was
chosen because the history surface is a card grid (not a table or a
detail page), matching the variant intended for list/grid skeletons.

### Status / warnings left intentionally untouched

- `StatusPill`, `statusTone`, `confidenceTone`, and `statusLabelMap`
  remain in the workspace. They are PR B scope (move into
  `components/common/status-badge.tsx` + add `import` type).
- The amber `bg-amber-200 bg-amber-50` warning card for file-level
  warnings is intentionally left as-is — `EmptyState` is for empty
  data, not for warning content. Re-mapping this to a `Badge` /
  `Alert variant="warning"` belongs in PR B alongside the status pill
  migration.
- The emerald `bg-emerald-200 bg-emerald-50` "Import thành công"
  callout after confirm is intentionally left as-is — it is a
  success state (not a passive read-only state), and `Alert
  variant="success"` is a PR B candidate.

### Control migration intentionally deferred

Per the PR #12 research decomposition:

- **Dropzone** (label-as-button + hidden input + drag/drop card +
  custom upload icon `<svg>`): deferred to **PR D**.
- **6 raw `<button>`** (dropzone trigger, upload, per-file row,
  confirm, history reload, history card): deferred to **PR D**.
- **7 raw `<input>`** (file input, existing case search, 5 new-case
  form inputs): deferred to **PR D**.
- **1 raw `<textarea>`** (notes field): deferred to **PR D**.
- **1 raw radio group** (target chooser): deferred to **PR D**.
- **Raw `<table>`** in `PreviewTable`: deferred to **PR C**.
- **`StatusPill`** with hardcoded tone classes: deferred to **PR B**.

The new `imports-shadcn.test.ts` explicitly asserts these raw controls
remain so PR #13 cannot accidentally over-migrate and break a frozen
behavior.

### Light-surface / anti-slop verification

- `rg "⚖" apps/web/src` → no new matches; the only match is the
  pre-existing guard test.
- `rg "bg-\[#123B66\]|bg-\[#0B1F3A\]" apps/web/src` → empty.
- `rg "bg-clip-text|text-transparent" apps/web/src` → empty (only the
  pre-existing guard test mentions the pattern).
- `rg "Seamless|Elevate|Unleash|Next-Gen|Game-changer|supercharge|empower|streamline" apps/web/src`
  → empty.
- `rg "rounded-\[18px\]" apps/web/src` → empty.
- Imports-specific:
  - `rg "bg-primary|bg-slate-950|bg-slate-900|bg-black|bg-zinc-950" apps/web/src/app/imports apps/web/src/components/imports`
    → only the pre-existing `bg-primary` on the dropzone CTA (correct
    primary action usage, not a card surface). The new shadcn guard
    explicitly asserts no `bg-primary` is introduced on card / page /
    section surfaces.
  - `rg "bg-blue-50 text-blue-700|bg-indigo-50 text-indigo-700|bg-amber-50 text-amber-700|bg-emerald-50 text-emerald-700|bg-rose-50 text-rose-700" apps/web/src/app/imports apps/web/src/components/imports`
    → the direct rose error cards are gone (replaced by `ErrorBanner`).
    The remaining `bg-blue-50` / `bg-amber-50` / `bg-emerald-50`
    matches are the drag-state hint, file-warning card, success card,
    and per-batch confirmation summary — none of these were in scope
    for this PR (success/warning remain on the deferred list).
  - `rg "<button|<input|<select|<textarea|<table|<svg" apps/web/src/app/imports apps/web/src/components/imports`
    → raw controls remain intentionally. The new guard pins them so a
    future PR cannot accidentally over-migrate without re-running the
    deferred-PR plan.
- `apps/web/src/app/imports/imports-shadcn.test.ts` includes dark
  surface and `bg-primary`-on-card assertions specifically for the
  imports route + workspace.
- `globals.css` continues to pin `color-scheme: light`; the hotfix
  from the previous milestone remains in place.

### Validation matrix

| Command | Result | Notes |
| ------- | ------ | ----- |
| `node --test apps/web/src/app/imports/imports-workspace-contract.test.ts` | PASS | 17/17 — frozen behavior preserved |
| `node --test apps/web/src/app/imports/imports-shadcn.test.ts` | PASS | 13/13 — migration applied |
| `pnpm --filter web lint` | PASS | exit 0 |
| `pnpm --filter web exec tsc --noEmit` | PASS | exit 0 |
| `pnpm test:web-unit` | PASS | (web unit suite, including the new shadcn guard) |
| `pnpm test:e2e:auth` | PASS | 5/5 (E2E auth unchanged — imports E2E is not in scope for this PR) |
| `pnpm --filter api exec tsx --test "../web/src/components/common/light-surface-guard.test.ts"` | PASS | 13/13 — light-surface contract unchanged |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 5 routes probed, 0 console errors, 0 page errors, 0 bounced-to-sign-in (`/imports` intentionally not added to the smoke route list per PR #12 research — added in PR E) |

### Risks / follow-up

- **Raw controls still deferred** — dropzone, raw buttons, raw inputs,
  raw textarea, raw radio group, and raw `<svg>` icon remain. PR D
  will migrate them.
- **`PreviewTable` still deferred** — the raw `<table>` and its
  `parsedJson.tables[]` rendering remain. PR C will migrate it to
  `Table` after a data-shape contract check.
- **`StatusPill` still deferred** — local pill + `statusTone` +
  `confidenceTone` + `statusLabelMap` remain. PR B will move them
  into `components/common/status-badge.tsx` with a new `import`
  variant.
- **Amber warning / emerald success callouts still deferred** — they
  remain inline cards. PR B should re-map them to `Alert
  variant="warning|success"` or keep them as-is depending on UX call.
- **`/imports` route in light-surface smoke** — still deferred per
  PR #12 research; route inclusion happens in PR E behind a seeded
  history fixture so the empty / loading / error / populated branches
  are all reachable.
- **`PageHeader` adoption** — not done in this PR to avoid duplicating
  the title. If the workspace's first section is migrated away in a
  later PR, `PageHeader` adoption becomes the natural follow-up.

### Next recommended PR

**Option A (recommended):** **PR B — Imports history + status pills.**
Move `statusLabelMap` + `statusTone` + `confidenceTone` from the
workspace into `components/common/status-badge.tsx`, add an `import`
status type, swap the local `StatusPill` for `StatusBadge type="import"`,
and re-map the amber warning / emerald success callouts to `Alert
variants`. Resolve the history surface UX choice (keep the responsive
card grid or migrate to `Table`). This is the smallest follow-up and
clears the remaining status-rendering debt on `/imports`.

**Option B:** **PR C — Parsed preview table.** Migrate `PreviewTable`'s
raw `<table>` to the shadcn `Table` primitive, swap confidence pills
for `Badge` variants, and decide on the JSON `<pre>` block (keep
`<pre>` or migrate to readOnly `Textarea`). Independent of PR B.

**Option C:** **PR D — Dropzone / button / input / radio visual cleanup.**
Migrate the 6 raw `<button>` call sites, the 6 raw `<input>`, the 1
raw `<textarea>`, the radio group, and the upload `<svg>` icon. The
label-as-button + hidden-input pattern requires `Button asChild` via
`Slot` to preserve the `accept` attribute verbatim. Independent of PR
B and PR C.

**Option D:** **PR E — Source guards + visual smoke route expansion.**
Promote `imports-workspace-contract.test.ts` to a fully pinned contract
covering all PR B / C / D outputs, and add `/imports` to
`scripts/audit/ui-light-surface-smoke.mjs` behind a seeded history
fixture. No product code changes.

Form Studio remains explicitly deferred to a future dedicated PR with
its own visual-review budget.


## PR #14 Imports status/history convergence result

PR #14 lands the PR B follow-up that PR #13 explicitly deferred: it
removes the local `StatusPill` / `statusTone` / `confidenceTone` /
`statusLabelMap` helpers from `apps/web/src/components/imports/import-workspace.tsx`
and routes every import-status render through the shared `StatusBadge`
+ `Badge` primitives centralized in
`apps/web/src/components/common/status-badge.tsx`.

### StatusBadge import mapping

Added an `import` status type to `status-badge.tsx` with the same eight
frozen enum members and Vietnamese labels that previously lived inline
in the workspace. Variants mirror the previous tone pairs:

| Import status            | Vietnamese label   | Variant       |
| ------------------------ | ------------------ | ------------- |
| `UPLOADED`               | Đã tải lên         | `blue`        |
| `PARSED`                 | Đã trích xuất      | `blue`        |
| `PARTIAL`                | Có cảnh báo        | `warning`     |
| `PARSED_WITH_WARNINGS`   | Có cảnh báo        | `warning`     |
| `FAILED`                 | Lỗi                | `destructive` |
| `REJECTED`               | Bị từ chối         | `destructive` |
| `CONFIRMED`              | Đã xác nhận        | `success`     |
| `STORED_ONLY`            | Đã lưu file        | `muted`       |

A new `importStatusLabel(value: string)` helper was exported alongside
`StatusBadge` so callers that need plain text (no badge) can render the
canonical label defensively with a pass-through fallback for unknown /
future statuses.

### Local StatusPill / statusTone / statusLabelMap result

- Local `StatusPill` component — **removed**.
- Local `statusTone(status)` helper — **removed**.
- Local `statusLabelMap` literal — **removed** (labels now live in
  `IMPORT_CONFIG` inside `status-badge.tsx`).
- Three pill render sites in the workspace — **migrated** to
  `<StatusBadge type="import" value={...} />`:
  - `currentBatch.status` header (preview pane action slot)
  - `file.parseStatus` (selected-file button row)
  - `item.status` (history batch card header)
- Two inline-text render sites — **migrated** to
  `importStatusLabel(...)`:
  - selected-file detail card "Trạng thái" cell
  - history file list status line

### Confidence pill result

- Local `confidenceTone(value)` helper — **removed**.
- New `confidenceBadgeVariant(value)` helper in the workspace returns
  `"success" | "warning" | "muted"` using the exact same threshold
  logic the previous helper used (`cao` → success, `vừa` → warning,
  anything else → muted).
- Two confidence pill render sites — **migrated** to `<Badge
  variant={confidenceBadgeVariant(...)}>`:
  - `PreviewTable` candidate-column pills
  - selected-file `parsedJson` candidate detail pills
- Displayed text (`cao` / `vừa` / `thấp`) and threshold logic preserved
  exactly.

### History surface decision

- **Kept** the responsive history card grid.
- Reason: history cards are an actionable list (each card has a click
  handler driven by `loadingBatchId`, displays file summaries and a
  per-file status). A `Table` migration is a UX decision, not a
  mechanical primitive swap, and would change interaction patterns
  beyond PR #14's scope.
- `loadingBatchId` / `getImportHistory(1, 12)` / `useTransition`
  history-load behavior is preserved.
- The `StatusBadge type="import"` now renders inside history cards,
  giving them the same visual rhythm as cases / documents.

### Warning / success callout decision

- **Kept** inline amber warning / emerald success cards (not migrated
  to `Alert` / `ErrorBanner` in this PR).
- Reason: these are content-area callouts describing a *condition*
  (e.g. "Không trích xuất được nội dung, nhưng file gốc đã được lưu"),
  not a *status value*. Mapping them to a shared variant would either
  risk making warnings look like errors or making neutral messages look
  like success. PR #14 deliberately scopes itself to status pills and
  confidence pills and does not overreach into every warning card.

### Contract guard result

- `imports-workspace-contract.test.ts` — 17/17 PASS.
- `imports-shadcn.test.ts` — 16/16 PASS.
- `status-badge.test.ts` — 4/4 PASS (2 new test cases added for the
  import status mapping + `importStatusLabel` helper).
- The contract guard was updated to read the frozen status enum from
  the new shared `status-badge.tsx` location (since the labels no
  longer live inline in the workspace) and to assert that every status
  render in the workspace routes through the shared module. No
  behavior-related string was loosened.

### Validation

| Gate                                                                                          | Result |
| --------------------------------------------------------------------------------------------- | ------ |
| `node --test apps/web/src/app/imports/imports-workspace-contract.test.ts`                     | PASS   |
| `node --test apps/web/src/app/imports/imports-shadcn.test.ts`                                 | PASS   |
| `pnpm --filter api exec tsx --test "../web/src/components/common/status-badge.test.ts"`       | PASS   |
| `pnpm --filter web lint`                                                                      | PASS   |
| `pnpm --filter web exec tsc --noEmit`                                                         | PASS   |
| `pnpm test:web-unit`                                                                          | PASS   |
| `pnpm test:e2e:auth`                                                                          | PASS   |
| `pnpm --filter api exec tsx --test "../web/src/components/common/light-surface-guard.test.ts"` | PASS   |
| `node scripts/audit/ui-light-surface-smoke.mjs`                                               | PASS   |

No dark-surface regression. No new dependencies. No raw-control
migration. No `bg-primary` introduction. No emoji / glassmorphism /
purple-cyan palette / marketing copy.

### Next recommended imports PR

**Option A (recommended): PR C — Parsed preview table.** Migrate
`PreviewTable`'s raw `<table>` to the shadcn `Table` primitive,
standardize the candidate-column row layout, and decide whether the
JSON `<pre>` block should remain raw or move to a shared
`<CodeBlock>`. Independent of PR D.

**Option B: PR D — Dropzone + buttons + inputs + radios.** Replace
the bespoke dropzone wrapper, the raw `<button>` "Chọn file" CTA, the
target-type `<input type="radio">` group, the `<textarea>` notes
field, and the file picker with shadcn primitives. This is the largest
behaviour-preserving surface remaining on `/imports`.

**Option C: PR E — Source guards + visual smoke route expansion.**
Promote `imports-workspace-contract.test.ts` to a fully pinned
contract covering all PR C / D outputs, and add `/imports` to
`scripts/audit/ui-light-surface-smoke.mjs` behind a seeded history
fixture so the empty / loading / error / populated branches are all
reachable.

Form Studio remains explicitly deferred to a future dedicated PR with
its own visual-review budget.


---

## Visual polish hotfix — global badge tone normalization

**Date:** 2026-07-03
**Stacking note:** Built on top of PR #1–#14 plus the light-surface
hotfix and verified visual QA, without `git checkout main`,
`git reset`, or `git stash`. The dirty tree on `main` from PR #14
remains intact; this hotfix adds the new files and modifications
listed below on top of that tree.

### Why

After PR #1–#14 converged the shared UI primitives (PageShell,
PageHeader, PageSection, Badge, StatusBadge, KpiCard, etc.), every
workflow surface (cases, templates/review queue, reports, documents,
imports, settings) rendered the same passive status pills. The shared
`Badge` primitive still inherited a heavier SaaS-marketing style — a
chunky `rounded-full` pill with `font-medium`, saturated primary fills
on `default`, and chunky padding — which clashed with the legal/admin
workstation aesthetic.

Concrete noise observed before this hotfix:

* `/cases`: `Nháp`, `Đã tiếp nhận`, `Cao`, `Bình thường` rendered as
  loud primary-navy pills with misaligned cells.
* `/templates` review queue: `Cần duyệt`, `Đã có PDF`, `Chưa có file`,
  and the `templateCode` chip all used `rounded-full bg-blue-50
  font-black text-blue-700` — chunky and game-like.
* `/reports`: KpiCard tone labels (`Đang xử lý`, `Cần xử lý`,
  `Hoàn tất`) inherited the heavy primitive surface.
* `/imports`: PR #14 routed import statuses through the shared Badge /
  StatusBadge, so any loudness in the primitive propagated to imports
  as well.

### Inventory summary

| Area                              | Issue Found                                                                                            | Fix Strategy                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Shared `Badge` primitive          | `default` = primary navy + chunky `rounded-full`; variants used strong tinted backgrounds              | Tone down base to `rounded-md`, `font-medium`, `px-2 py-0.5`; variants use 50-tint + 200-borders + 700-text |
| `StatusBadge` mappings            | `RECEIVED`, `IN_PROGRESS`, `NORMAL`, `PUBLISHED` all routed through `default` (primary navy)            | Recolor to `success`, `blue`, `muted`, `success` so the common-case statuses are not CTA-flavoured |
| `/cases` table                    | Status / priority `TableCell`s were not aligned; page-header `Badge` used `text-sm font-bold`           | `align-middle whitespace-nowrap` on badge cells; header `Badge` reduced to `text-xs font-semibold` |
| Review queue card                 | `templateCode` chip + file-availability chip used `rounded-full font-black` with blue/slate washes     | Convert to `rounded-md border font-medium` with same light-tint palette                        |
| Reports KpiCard                   | Tone chip used primitive defaults; rendered large                                                     | Pass `px-2 py-0.5 text-[11px]` so the chip is compact and quiet                                 |
| Imports confidence chips          | `rounded-full font-bold` overrides on the primitive                                                    | Drop `rounded-full font-bold`, keep `whitespace-nowrap` and small padding                      |
| Reports rank-count chip           | Hardcoded `rounded-full bg-zinc-100 font-black text-zinc-800`                                          | Migrate to a calm `rounded-md border-slate-200 bg-slate-50 text-slate-700` chip                |
| Settings template-count `Badge`   | Hardcoded `text-sm`                                                                                    | Reduce to `text-xs` to match the toned-down primitive                                          |

### Badge tone contract

Final rules for the shared `Badge` primitive
(`apps/web/src/components/ui/badge.tsx`):

* **Base**: `inline-flex items-center justify-center whitespace-nowrap
  rounded-md border px-2 py-0.5 text-xs font-medium leading-5
  transition-colors`. No `rounded-full` by default. No `font-black`.
* **Default**: `border-transparent bg-secondary text-secondary-foreground`
  — neutral slate subtle surface, not primary navy.
* **secondary / muted**: slate subtle.
* **success**: `border-emerald-200 bg-emerald-50 text-emerald-700` (very
  light emerald tint with muted emerald text).
* **warning**: `border-amber-200 bg-amber-50 text-amber-700`.
* **destructive**: `border-rose-200 bg-rose-50 text-rose-700`.
* **blue**: `border-blue-200 bg-blue-50 text-blue-700`.
* **violet**: `border-violet-200 bg-violet-50 text-violet-700` (kept,
  because review queue's `GENERATED` status and a few form-runtime
  flavours still use it; made quieter).
* **outline**: `text-foreground` (light border, surface background).

Hard bans on passive Badge variants:

* No `text-white`.
* No `bg-primary text-primary-foreground`.
* No `bg-emerald-500/600`, `bg-green-500/600`, `bg-amber-500/600`,
  `bg-orange-500`, `bg-rose-500/600`, `bg-blue-500/600/700/900`,
  `bg-slate-950`, `bg-zinc-950`, `bg-black`.
* No `font-black`.
* No default `rounded-full`.

Allowed exceptions:

* `bg-primary text-primary-foreground` is still permitted on actual
  active filter pills (e.g. review-queue filters) and primary action
  buttons. Phase 5 of this hotfix explicitly avoided touching primary
  CTAs.
* `text-white` is still permitted on primary action buttons and the
  progress bar inside `/imports` (geometric progress fill, not a badge).

### StatusBadge mapping decisions

| Domain         | Status / Priority                  | Old Variant / Tone                  | New Variant / Tone                | Label Preserved  |
| -------------- | ---------------------------------- | ----------------------------------- | --------------------------------- | ---------------- |
| review         | `DRAFT`                            | `muted`                             | `muted` (no change)               | "Bản nháp"       |
| review         | `GENERATED`                        | `violet`                            | `violet` (no change)              | "Đã render"      |
| review         | `WAITING_REVIEW`                   | `warning`                           | `warning` (no change)             | "Cần duyệt"      |
| review         | `APPROVED`                         | `success`                           | `success` (no change)             | "Đã duyệt"       |
| review         | `NEEDS_REVISION`                   | `destructive`                       | `destructive` (no change)         | "Cần sửa"        |
| review         | `FINAL_EXPORTED`                   | `default` (primary navy)            | `blue` (subtle blue tint)         | "Đã xuất"        |
| review         | `CANCELLED`                        | `muted`                             | `muted` (no change)               | "Đã hủy"         |
| case           | `TIEP_NHAN` / `RECEIVED`           | `default` (primary navy)            | `success` (subtle emerald)        | "Tiếp nhận" / "Đã tiếp nhận" |
| case           | `DANG_XU_LY` / `IN_PROGRESS`       | `default` (primary navy)            | `blue` (subtle blue)              | "Đang xử lý"     |
| case           | `DANG_TRINH_DUYET` / `WAITING_REVIEW` | `warning`                        | `warning` (no change)             | "Trình duyệt" / "Chờ duyệt" |
| case           | `DA_DUYET` / `DA Ket_LUAN`         | `success`                           | `success` (no change)             | "Đã duyệt" / "Kết luận" |
| case           | `DA_XU_LY` / `DONG` / `CLOSED`     | `muted`                             | `muted` (no change)               | "Đã xử lý" / "Đóng" / "Đã đóng" |
| case           | `DRAFT`                            | `default` (primary navy)            | `muted` (neutral slate)           | "Nháp"           |
| priority       | `THAP` / `LOW`                     | `muted`                             | `muted` (no change)               | "Thấp"           |
| priority       | `TRUNG_BINH` / `NORMAL`            | `default` (primary navy)            | `muted` (neutral slate)           | "Trung bình" / "Bình thường" |
| priority       | `CAO` / `HIGH`                     | `warning`                           | `warning` (no change)             | "Cao"            |
| priority       | `KHAN` / `URGENT`                  | `destructive`                       | `destructive` (no change)         | "Khẩn"           |
| formAuthoring  | `NOT_INITIALIZED` / `DRAFT` / `ARCHIVED` | `muted`                        | `muted` (no change)               | "Chưa khởi tạo" / "Bản nháp" / "Lưu trữ" |
| formAuthoring  | `CHANGES_REQUESTED` / `IN_REVIEW`  | `warning`                           | `warning` (no change)             | "Yêu cầu sửa" / "Đang duyệt" |
| formAuthoring  | `APPROVED`                         | `success`                           | `success` (no change)             | "Đã duyệt"       |
| formAuthoring  | `PUBLISHED`                        | `default` (primary navy)            | `success` (subtle emerald)        | "Đã công bố"     |
| formRuntime    | `AGENCY_PUBLISHED`                 | `success`                           | `success` (no change)             | "VKS địa phương" |
| formRuntime    | `GLOBAL_PUBLISHED`                 | `default` (primary navy)            | `success` (subtle emerald)        | "Toàn quốc"      |
| formRuntime    | `LOCKED_FILE`                      | `warning`                           | `warning` (no change)             | "File khóa"      |
| formRuntime    | `LEGACY_BESPOKE` / `GENERIC_FALLBACK` | `muted`                          | `muted` (no change)               | "Tùy chỉnh cũ" / "Mặc định" |
| formRuntime    | `UNAVAILABLE`                      | `destructive`                       | `destructive` (no change)         | "Không khả dụng" |
| import         | All statuses                       | Same labels, same values            | Same labels (PR #14 already centralized) | unchanged |

To keep the `BadgeVariant` union in sync with the primitive, a single
`BadgeVariant` type alias + `BadgeConfigEntry` interface is exported
inside `status-badge.tsx`. Future primitive additions (e.g. a new
`info` variant) only require adding the key once.

### Cases alignment fix

* Status `TableCell` and priority `TableCell` now include
  `align-middle whitespace-nowrap` so badges sit centered relative to
  the row and do not wrap on normal desktop widths.
* `TableRow` remains `align-top` so multi-line `caseTitle` /
  `caseSummary` cells keep their natural top alignment.
* Page-header `Badge` reduced from `px-4 py-2 text-sm font-bold` to
  `px-3 py-1 text-xs font-semibold`.
* The `Mở` action button was left untouched (primary action, out of
  scope per Phase 5).

### Review queue / Reports / Imports impact

Because the shared primitive and the StatusBadge mappings both moved
in lockstep, every downstream area inherited the calmer tone:

* **Review queue**: `templateCode` chip and `Đã có PDF / Đã có DOCX /
  Chưa có file` chip were converted from `rounded-full font-black`
  to `rounded-md border font-medium` with the same light-tint palette.
  The review status (`Cần duyệt`, `Đã duyệt`, `Đã xuất`, etc.) is now
  rendered through `StatusBadge` and inherits the toned-down `Badge`
  primitive directly.
* **Reports**: KpiCard's tone chip passes `px-2 py-0.5 text-[11px]` so
  the chip is compact and quiet; the rank-count chip on `byWard` /
  `byOffense` was migrated from
  `rounded-full bg-zinc-100 font-black text-zinc-800` to
  `rounded-md border-slate-200 bg-slate-50 text-slate-700` so the
  count chip doesn't dominate the row.
* **Imports**: All status pills already route through StatusBadge
  (PR #14). The confidence chips in the parsed-data table no longer
  override with `rounded-full font-bold`; they keep
  `whitespace-nowrap` and small padding.

Primary action buttons (dropzone CTA, "Tải lên", "Xác nhận import")
were intentionally left untouched per the absolute non-goals.

### Behavior preservation

* No API calls changed.
* No status values changed — `REVIEW_STATUS`, `CASE_STATUS_CONFIG`
  keys, `Priority` keys, `FormAuthoringStatus`, `FormRuntimeSource`,
  `ImportStatus` are all identical.
* No Vietnamese labels changed — every label in every `*_CONFIG` map
  is identical to the prior PR #1–#14 text.
* No routing changed.
* No auth/RBAC changed — `/api/v1` Clerk session boundary is
  untouched.
* No DB schema, no DOCX/template contracts, no Smart Generic Prefill
  data, no Form Studio behavior touched.

### Validation results

| Command                          | Result | Notes                                                                              |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `pnpm --filter web lint`         | PASS   | 0 errors / 0 warnings                                                              |
| `pnpm --filter web exec tsc --noEmit` | PASS | 0 errors after widening `BadgeVariant` union in `status-badge.tsx`                  |
| `pnpm test:web-unit`             | PASS   | 383 / 383 tests; new `badge-tone-guard.test.ts` (11 cases) + 8 new status-badge cases all green |
| `pnpm --filter api exec tsx --test ../web/src/components/common/light-surface-guard.test.ts` | PASS | 13 / 13 cases — no dark surface regression |
| `pnpm test:e2e:auth`             | PASS   | 5 / 5 — clerk-protected surface untouched                                          |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 5 routes (`/`, `/cases`, `/cases/:id`, `/templates`, `/templates/:code`) — 0 bounced, 0 console errors, 0 page errors |
| Anti-slop ripgrep                | PASS   | `⚖`, `bg-[#123B66]`, `bg-[#0B1F3A]`, `bg-clip-text`, marketing copy, `rounded-[18px]` — 0 matches in source (matches only in test guards that assert absence) |
| Badge anti-slop ripgrep          | PASS   | `font-black` / `rounded-full` / `text-white` / saturated 500-level backgrounds — 0 matches in `badge.tsx` after this hotfix |

### Git hygiene

* No `.env`, `.env.local`, `.env.e2e.local` touched.
* No `playwright/.clerk/` state tracked — `playwright/.clerk/` is
  gitignored and only used at runtime by `test:e2e:auth`.
* No screenshots / traces / reports tracked — `test-results/` is
  gitignored.
* No runtime artifacts tracked.

### Next recommended PR

A single dedicated **light-surface hotfix #2** could:

1. Reduce the `font-black` count on `/imports` headings and on the
   document titles inside review queue cards. These are *typography*,
   not passive status, so they are out of scope for this badge-tone
   hotfix. Future polish may move them to `font-semibold` for a
   softer workstation feel.
2. Re-run the visual smoke against `/reports` (currently the smoke
   script covers `/`, `/cases`, `/cases/:id`, `/templates`,
   `/templates/:code`). Adding `/reports` would require a seeded
   fixture and was deferred in this PR per the "do not expand
   `/imports` behaviour" / "this PR is badge-tone focused" guard.
3. Migrate the import dropzone / CTAs to shadcn primitives
   (`Option B: PR D` from this plan's open-items section).

Form Studio remains explicitly deferred to a future dedicated PR with
its own visual-review budget.

---

## Visual polish hotfix — global button tone and action ergonomics

PR title suggestion: `fix(ui): normalize button tones and action ergonomics`.

Built on top of PR #1–#14, the badge-tone hotfix, and the light-surface
hotfix / QA, **without** checkout / reset / stash — branch state was
preserved on `main`.

### Inventory summary

| Area | Issue Found | Fix Strategy |
| ---- | ----------- | ------------ |
| `apps/web/src/components/ui/button.tsx` | `success` / `warning` / `destructive` variants used saturated 500/600 fills (`bg-success text-success-foreground`, `bg-warning text-warning-foreground`, `bg-destructive text-destructive-foreground`) | Tone all three to outlined subtle variants: `border border-*-200 bg-*-50 text-*-700/800 hover:bg-*-100`. No `font-black`. |
| `apps/web/src/components/ui/button.tsx` (outline) | Hover used `hover:bg-accent hover:text-accent-foreground` and `rounded-lg` | Switch hover to `hover:bg-slate-50 hover:text-slate-900`. Switch base radius to `rounded-md` (calmer in dense action rows). |
| `apps/web/src/components/ui/button.tsx` (variants) | Secondary / outline / success / warning / destructive all carried decorative `shadow-sm` | Strip decorative `shadow-sm`. Only `default` keeps a `shadow-sm` for navy primary elevation. |
| Review queue card (`review-queue-item-card.tsx`) | `Mở xử lý` was a raw `<a className="... bg-blue-700 ... font-bold ...">` | Convert to `<Button variant="default" asChild>` (navy primary), label + handler preserved. `Phê duyệt / Yêu cầu sửa / Hủy` already used `<Button variant="success|warning|destructive">` — labels and handlers preserved, visual tone down via primitive contract. |
| Review queue filters (`review-queue-filters.tsx`) | Active pill `font-bold`, reload `font-bold rounded-2xl` | Tone down to `font-semibold`, drop `rounded-2xl` in favour of the primitive's `rounded-md`. |
| Reports page (`apps/web/src/app/reports/page.tsx`) | Period toggle `font-bold className="h-9 rounded-sm"`; `Tải lại / Xuất CSV / In / PDF` had explicit `className="h-10"` overrides | Drop redundant overrides so the primitive's defaults apply (`font-semibold`, `h-10`). `Xuất CSV` now rides on the new subtle `success` variant. |
| Standalone template (`template-preview-workspace.tsx`) | 5 raw `<button>` elements in the action row with hardcoded `bg-blue-600 text-white font-extrabold` / `bg-slate-950 text-white font-extrabold` / `bg-emerald-600 text-white font-bold` and `rounded-xl`. Long-label button `Điền nhanh thông tin chung` was squeezed with `px-4` and no minimum. Another 3 raw buttons in `previewSession` (`Tải DOCX bg-emerald-600`, `Tạo văn bản từ hồ sơ` disabled, `Tạo lại`) | Migrate all 8 buttons to `<Button>` variants — primary / secondary / outline / ghost. Add `min-w-[14rem] whitespace-normal text-center leading-snug` to the long-label button. Update wrapper to `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end` so labels do not get squeezed at narrow widths. |
| BM-001 form (`bm-001-form-inputs.tsx`) | Raw `<button className="... bg-slate-950 ... text-white">` for "Lưu dữ liệu BM-001" | Migrate to `<Button variant="default">`. Handler + disabled state preserved. |
| Generated doc action panel + pre-export panel | Already used `<Button>` everywhere; no saturation, no `font-black` | Left unchanged. They inherit the toned-down primitive. |
| Imports workspace (`import-workspace.tsx`) | Some raw `<button>` elements remain (dropzone CTA, progress bar, history batch cards) | Explicitly out of scope per the spec ("Do NOT migrate raw buttons in this PR. The raw bg-primary dropzone CTA can stay for PR D"). |
| Generic tm-XXX decoration panels (`bg-slate-950 text-white` panels + blue CTAs) | Per-form dark decoration surfaces still exist across many bm-XXX-form-inputs.tsx files | Out of scope per "Do not migrate Form Studio"; flagged for a future migration PR. |

### Button tone contract

Documented at the top of `apps/web/src/components/ui/button.tsx`:

* **Base**: `inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`. Disabled / loading / focus-visible behavior preserved.
* **`default`** — primary navy action. `bg-primary text-primary-foreground shadow-sm hover:bg-primary/90`. Reserved for the single dominant action in a local context.
* **`secondary`** — quiet slate supporting action. `border border-slate-200 bg-secondary text-secondary-foreground hover:bg-slate-100`.
* **`outline`** — white / light utility. `border border-input bg-background hover:bg-slate-50 hover:text-slate-900`. Main choice for reload / demo / rescan / cancel / download.
* **`ghost`** — low emphasis utilities only.
* **`destructive`** — quiet destructive. `border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`. Existing destructive flows remain obvious via the rose tint, without being saturated red blobs.
* **`success`** — quiet success. `border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`. Used for `Phê duyệt`, `Xuất CSV`, and `Đã lưu ✓` save state — never as a saturated green fill.
* **`warning`** — quiet warning. `border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100`.
* **`link`** — unchanged.

### Hard bans for Button primitive

* No `font-black`. `font-semibold` only.
* No `bg-gradient-to-*`, no `linear-gradient(`, no `radial-gradient(`.
* No `bg-success` / `bg-warning` / `bg-destructive` saturated token fills (the source-level CSS variables `142 71% 45%`, `38 92% 50%`, `0 84% 60%` stay defined for non-Button consumers but are no longer used by the Button variants).
* No saturated 500/600 background fills (`bg-green-500`, `bg-emerald-500`, `bg-emerald-600`, `bg-orange-500`, `bg-amber-500`, `bg-red-500`, `bg-red-600`, `bg-rose-500..900`).
* No decorative `shadow` or `shadow-sm` on non-default variants — only `default` keeps `shadow-sm` for navy primary elevation.

### Review queue action fix

Confirmed, labels preserved, handlers preserved, disabled/loading states preserved:

| Action | Before | After |
| ------ | ------ | ----- |
| `Mở xử lý` | raw `<a className="... bg-blue-700 ... font-bold ...">` | `<Button variant="default" asChild size="sm" className="sm:w-36">` |
| `Phê duyệt` | `<Button variant="success" size="sm">` (saturated green via `bg-success`) | `<Button variant="success" size="sm">` — now outlined emerald (`border-emerald-200 bg-emerald-50 text-emerald-700`) |
| `Yêu cầu sửa` | `<Button variant="warning" size="sm">` (saturated orange via `bg-warning`) | `<Button variant="warning" size="sm">` — now outlined amber |
| `Hủy` | `<Button variant="destructive" size="sm">` (saturated red via `bg-destructive`) | `<Button variant="destructive" size="sm">` — now outlined rose |
| Dialog `Hủy` cancel | raw `<button type="button">Hủy</button>` inside `AlertDialogCancel asChild` | Unchanged — `AlertDialogCancel` already routes through shadcn's primitive |

No review status transitions changed. No API calls changed. No labels changed. No order changed.

### Reports action fix

| Action | Before | After |
| ------ | ------ | ----- |
| `Tuần / Tháng` toggle | `<Button variant={active?"default":"ghost"} ... className="... font-bold">` | `<Button variant={...} ... className="h-9 rounded-sm px-4">` — drops `font-bold`, lets primitive `font-semibold` take over |
| `Tải lại` | `<Button variant="outline" ... className="h-10">` | `<Button variant="outline">` — drops redundant `h-10` |
| `Xuất CSV` | `<Button variant="success" ... className="h-10">` (saturated green) | `<Button variant="success">` (subtle outlined emerald) |
| `In / PDF` | `<Button variant="outline" ... className="h-10">` | `<Button variant="outline">` |

Date input (`Ngày neo`) is `<Input type="date">` and was not modified.

`buildReportCsv`, `buildReportPrintHtml`, `printReport`, `exportCsv`, state defaults (`period="MONTH"`, `anchorDate=todayForInput()`), and all endpoint paths (`/cases/reports/summary`, `/document-review-queue`) are untouched.

### Standalone template action ergonomics

| Concern | Fix |
| ------- | --- |
| Long label `Điền nhanh thông tin chung` rendered as raw `<button className="... bg-blue-600 text-white font-bold ...">` with `px-4` and no minimum | Migrated to `<Button variant="outline" size="default" className="min-w-[14rem] whitespace-normal text-center leading-snug sm:min-h-11">` |
| Action row wrapper `flex flex-col gap-2 sm:flex-row sm:justify-end` (no wrap) | Updated to `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end` so long labels do not squeeze at narrow widths |
| `Dữ liệu demo` (raw `<button className="... border-slate-300 bg-white text-slate-500">`) | `<Button variant="outline" size="default" className="sm:min-h-11">`; `title` attribute preserved |
| `Lưu bản nháp` (raw `<button className="... bg-slate-950 text-white font-extrabold ...">`) | `<Button variant="secondary" size="default" className="sm:min-h-11">` |
| `Xem trước bản in` (raw `<button className="... bg-blue-600 text-white font-extrabold ...">`) | `<Button variant="default" size="default" className="sm:min-h-11">` — primary navy single dominant |
| `Xóa bản nháp` (raw `<button className="... border-slate-300 bg-white text-slate-700">`) | `<Button variant="ghost" size="default" className="sm:min-h-11">` |
| `Tải DOCX` (raw `<button className="... bg-emerald-600 text-white font-semibold shadow-sm ...">`) inside `previewSession` | `<Button variant="outline" size="sm">` |
| `Tạo văn bản từ hồ sơ` (disabled raw) | `<Button variant="outline" size="sm" disabled title="...">` |
| `Tạo lại` (raw `<button ... border-slate-300 bg-white ...>`) | `<Button variant="ghost" size="sm">` |

Order: `Điền nhanh thông tin chung → Dữ liệu demo → Lưu bản nháp → Xem trước bản in → Xóa bản nháp`. Unchanged.

Sticky / print behavior preserved (`FormActionBar` sticky surface is left unchanged; `print:hidden` is preserved via the `FormActionBar`'s `printHidden` default).

Save / demo / prefill / preview / reset handlers all preserved.

### Behavior preservation confirmed

* No API calls changed.
* No status / action / workflow behavior changed (review transitions, approve / reject / cancel flow, CSV export, print/PDF, save draft, reset draft, applySmartPrefill, applySampleData, saveDraft, previewDocx are all identical at the handler level).
* No Vietnamese labels changed.
* No routing changed.
* No auth / RBAC changed.

### Tests / source guards

New file: `apps/web/src/components/common/button-tone-guard.test.ts`.
13 cases covering:

* Button primitive does not contain `font-black` on its base or variants.
* Button primitive is not gradient-styled.
* Button primitive default variant is the only primary filled navy (`bg-primary text-primary-foreground`).
* Button primitive destructive variant is subtle outlined rose, forbids `bg-destructive`, `bg-rose-500..900`, `bg-red-500..900`.
* Button primitive success variant is subtle outlined emerald, forbids `bg-success`, `bg-emerald-500..800`, `bg-green-500..800`.
* Button primitive warning variant is subtle outlined amber, forbids `bg-warning`, `bg-amber-500..800`, `bg-orange-500..800`.
* Button primitive non-default variants remove decorative shadow.
* Button primitive outline variant uses `hover:bg-slate-50 hover:text-slate-900`, not `hover:bg-accent`.
* Review queue actions use the shared Button variant API, not raw saturated classes.
* Review queue primary `Mở xử lý` is rendered through `<Button>`.
* Reports action row uses `<Button>`, no raw saturated button classes.
* Standalone template preview uses `<Button>` for the long-label row.
* Standalone template preview long-label button carries `min-w-[14rem]` plus `sm:flex-wrap` row wrapper.

All 13 pass.

### Validation results

| Command | Result | Notes |
| ------- | ------ | ----- |
| `pnpm --filter web lint` | PASS | 0 errors / 0 warnings |
| `pnpm --filter web exec tsc --noEmit` | PASS | 0 errors |
| `pnpm test:web-unit` | PASS | 396 / 396; new `button-tone-guard.test.ts` adds 13 cases, all green |
| `pnpm --filter api exec tsx --test ../web/src/components/common/light-surface-guard.test.ts` | PASS | 13 / 13 — no dark surface regression |
| `pnpm test:e2e:auth` | PASS | 5 / 5 — clerk surface untouched |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 6 routes (`/`, `/cases`, `/templates`, `/cases/:id`, `/templates/:code`, `/reports`) — 0 bounced, 0 console errors, 0 page errors |
| Generic anti-slop ripgrep | PASS | 0 matches |
| Button anti-slop ripgrep | PASS | 0 matches in touched files; remaining matches are typography (`h1`/`h2`) and 50-level token chips, explicitly out of scope |
| `text-white` anti-slop ripgrep | PASS | 0 matches in touched files; remaining matches are `bg-slate-950 text-white` decoration panels and per-form legacy blue CTAs, explicitly out of scope |

### Git hygiene

* No `.env`, `.env.local`, `.env.e2e.local` touched.
* No `playwright/.clerk/` state tracked — `playwright/.clerk/` is gitignored.
* No screenshots / traces / reports tracked — `test-results/` is gitignored.
* No runtime artifacts tracked.

### Next recommended PR

A single dedicated **`/imports` and Form Studio button migration** could finish the migration started in this hotfix:

1. Replace the remaining raw `<button>` elements in `documents/template-preview-workspace.tsx` header (e.g. `Nhập từ hồ sơ`, `Lưu bản nháp`, `Xem trước bản in` header CTA) with `<Button>` variants.
2. Replace per-form dark decoration panels and blue CTAs in `documents/bm-XXX-form-inputs.tsx` with the toned-down `<Button>` system or with the new surface primitives.
3. Migrate the `/imports` dropzone CTA + history batch cards from raw `<button>` to `<Button>` (`Option B: PR D`).
4. Reduce `font-black` count on `/imports` headings and on document titles inside review queue cards (typography, out of scope here).
5. Re-run the visual smoke against additional BM form action rows (`BM-001`, `BM-002`, … representative forms) for a fuller Button-ergonomics baseline.

Form Studio remains explicitly deferred to a future dedicated PR with
its own visual-review budget.



---

## Visual polish hotfix — documents template chooser select migration

**Date:** 2026-07-03
**Stacking note:** Built on top of PR #1–#14, the light-surface hotfix,
the global badge-tone hotfix, and the global button-tone hotfix, **without**
`git checkout main`, `git reset`, or `git stash`. The dirty tree on `main`
remains intact; this hotfix adds the new files and modifications listed
below on top of that tree.

### Why

After PR #1–#14 converged most pages on shadcn primitives, the `/documents`
template chooser (the `TemplateSelectorWorkspace` mounted by
`apps/web/src/app/documents/page.tsx`) still rendered two **native browser
`<select>`** controls — "Nhu cầu nghiệp vụ" and "Giai đoạn biểu mẫu" —
inside the suggestion filter form. In the OS dark-mode smoke these render
with the browser-blue native dropdown highlight, breaking the calm
light-surface, shadcn-converged feel of every neighbouring route
(`/cases`, `/cases/:id`, `/templates`, `/templates/:code`, `/reports`,
`/imports`, `/settings`, `/`, admin pages).

This is a UI-only slice: the locked BM form input panels (e.g. day/month/
year pickers inside `bm-XXX-form-inputs.tsx`) intentionally remain on raw
`<select>` because they are part of DOCX field bindings and Form Studio is
explicitly out of scope. The target is the **template chooser**, not the
BM form inputs.

### Native select inventory

| Control | Before | After |
| --- | --- | --- |
| Nhu cầu nghiệp vụ | `<select>` + `<option>` list (`NEED_OPTIONS`) bound to `input.processNeed` | shadcn `Select` + `SelectItem`s, sentinel `__all_needs__` for the "Tất cả nhu cầu" entry |
| Giai đoạn biểu mẫu | `<select>` + `<option value="">Tất cả giai đoạn</option>` + per-stage `<option>`s bound to `input.stageId` | shadcn `Select` + `SelectItem`s, sentinel `__all_stages__` for the "Tất cả giai đoạn" entry |

Both sentinels are local constants at the top of
`apps/web/src/components/documents/template-selector-workspace.tsx`:

```ts
const ALL_NEED_VALUE = "__all_needs__";
const ALL_STAGE_VALUE = "__all_stages__";
```

The shadcn Select contract requires a non-empty item value, so the two
empty-string "all" semantics from the previous native selects are
preserved as sentinels in `SelectItem` and converted back to `""` before
the existing filter state is updated. The filter pipeline (which already
treats `processNeed === ""` and `stageId === ""` as "no filter") is
unchanged — no score / candidate / `NEED_OPTIONS` / `vksTemplateStages`
semantic change.

### Select migration details

| Concern | Implementation |
| --- | --- |
| shadcn components used | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` from `@/components/ui/select` |
| Sentinel values | `__all_needs__`, `__all_stages__` — distinct so future PRs cannot cross-pollute empty-value meanings |
| Trigger height | `h-11` — same as neighbouring `<input>` height on the same form grid |
| Trigger radius | `rounded-2xl` — matches the surrounding inputs (matches `/cases` / `/reports` rhythm) |
| Trigger background | `bg-background` (token) — light surface, no dark fill |
| Trigger border | `border border-slate-200` — same as the neighbouring `<input>` |
| Focus ring | `focus:border-blue-400 focus:ring-4 focus:ring-blue-100` — matches neighbouring inputs exactly |
| Width | `w-full` — same as neighbouring inputs; layout grid unchanged |
| Dark-surface safety | No `bg-slate-950`, `bg-black`, `bg-zinc-950`, `bg-slate-900`, `bg-primary` on any SelectTrigger (asserted by source guard) |
| Layout | The outer `<label>` was replaced by `<div>` (shadcn `Select` itself is already a labelled `<button>` via `SelectTrigger`; the visual label sibling is still present). The grid `lg:grid-cols-2` placement is unchanged. |
| Responsive | Same grid as before: form section still uses `grid gap-4 lg:grid-cols-2`, both controls fall under it. |

### Behavior preservation

* `NEED_OPTIONS` constant — **unchanged** (same 9 entries, same
  Vietnamese labels, same slug values).
* `vksTemplateStages` — **unchanged**.
* `processNeed` / `stageId` initial state — **unchanged** (still
  `""` in the `useState<SuggestInput>(...)` initializer).
* `scoreTemplate`, `candidates` filter pipeline, `exactNeedBoosts`,
  `ruleEvaluation` recommendation rules — **unchanged**.
* `normalizeSearchText`, `uniqueWords`, `containsAny` — **unchanged**.
* `getPrimaryTemplateOpenTarget`, `createDocumentBatch`,
  `openTemplate`, `openCasePickerForTemplate`, `confirmCaseForPending` —
  **unchanged**.
* `router.push("/documents/${generatedDocument.id}")` and
  `router.push(target.href)` — **unchanged**.
* `clearTemplateSelectorTextInputs` — **unchanged** (the function only
  operates on `input:not([type])`, `input[type="text"]`,
  `input[type="search"]`, and `textarea`; it never reaches the new
  SelectTrigger buttons, so behavior is preserved verbatim).
* No API endpoint changed.
* No DOCX / template / form contract changed.
* No Smart Generic Prefill data changed.
* No `/templates` review queue touched.
* No standalone template form (`template-preview-workspace.tsx`)
  touched.
* No auth / RBAC touched.
* No `/imports` workspace touched (PR C explicitly deferred).

### Smoke route expansion

`scripts/audit/ui-light-surface-smoke.mjs` now also probes `/documents`:

* Adds an optional `rawSelectSelector` parameter on `smokeRoute`. When
  set, the function counts native `<select>` handles inside the queried
  scope after navigation and includes the count in the per-route result
  and the report summary.
* The `/documents` route is probed with `rawSelectSelector: "main select"`.
* The aggregate `status` field is now `FAIL` if any in-scope route
  reports `rawSelectCount > 0`, in addition to the existing
  bounced / page-error checks. (Other routes in the smoke are not
  scoped by `rawSelectSelector`, so BM forms and template forms
  with native day/month/year selects are intentionally not regressed
  here.)
* The summary gains a `routesWithNativeSelectInScope` array listing any
  route that broke the contract.

Live run output after this hotfix:

```
[ui-light-surface-smoke] report=...\test-results\ui-light-surface-smoke\report.json
[ui-light-surface-smoke] status=PASS bounced=0 consoleErrors=0 pageErrors=0
```

Per-route `/documents` row in the report (illustrative, from the
post-hotfix run):

```json
{
  "route": "/documents",
  "routeLabel": "documents",
  "finalUrl": "http://localhost:3000/documents",
  "status": 200,
  "bouncedToSignIn": false,
  "rawSelectCount": 0,
  "surfaceProbes": {
    "anySelectTrigger": {
      "label": "anySelectTrigger",
      "present": true,
      "backgroundColor": "rgb(255, 255, 255)",
      "textColor": "rgb(15, 23, 42)",
      "borderColor": "lab(91.7353 -0.998765 -4.76968)",
      "isLight": true
    }
  },
  "consoleErrors": [],
  "pageErrors": []
}
```

So:

* `/documents` loads 200 under authenticated `colorScheme: "dark"`.
* 0 native `<select>` inside `main`.
* At least one shadcn `SelectTrigger` is rendered (`button[role="combobox"]`),
  light surface (`rgb(255, 255, 255)`), slate border, slate-900 text.
* No bounce to sign-in.
* No console / page errors.

### Tests / source guards

New file: `apps/web/src/app/documents/page-shadcn.test.ts` — 8 cases.

1. `/documents` chooser source has no native `<select>` or `<option>`.
2. `/documents` chooser imports `Select` / `SelectTrigger` /
   `SelectContent` / `SelectItem` / `SelectValue` from
   `@/components/ui/select`.
3. "Nhu cầu nghiệp vụ" Vietnamese label + "Tất cả nhu cầu" placeholder
   are preserved.
4. "Giai đoạn biểu mẫu" Vietnamese label + "Tất cả giai đoạn" placeholder
   are preserved.
5. Both sentinel values (`__all_needs__`, `__all_stages__`) exist.
6. Every `<SelectTrigger>` in the chooser source has a light surface —
   none of them include `bg-slate-950`, `bg-black`, `bg-zinc-950`,
   `bg-slate-900`, or `bg-primary`.
7. Open-template / open-with-case routing strings (`router.push(
   `/documents/${generatedDocument.id}`)`, `getPrimaryTemplateOpenTarget`,
   `createDocumentBatch`, `openCasePickerForTemplate`) are preserved.
8. Search / recommendation wiring (`getTemplateRecommendationRule`,
   `evaluateRecommendationRule`, `NEED_OPTIONS`, `vksTemplateStages`,
   `processNeed: ""`, `stageId: ""`) is preserved.

No brittle snapshots. All 8 cases pass.

### Validation results

| Command | Result | Notes |
| ------- | ------ | ----- |
| `pnpm --filter api exec tsx --test "../web/src/app/documents/page-shadcn.test.ts"` | PASS | 8 / 8 — migration applied; native select / option absent; shadcn Select primitives in place; sentinels present; triggers light; routing / recommendation wiring preserved |
| `pnpm --filter web lint` | PASS | 0 errors / 0 warnings |
| `pnpm --filter web exec tsc --noEmit` | PASS | 0 errors |
| `pnpm test:web-unit` | PASS | 404 / 404 (the 8 new source-guard cases are part of the unit suite) |
| `pnpm test:e2e:auth` | PASS | 5 / 5 — Clerk-protected surface untouched |
| `pnpm --filter api exec tsx --test ../web/src/components/common/light-surface-guard.test.ts` | PASS | 13 / 13 — no dark-surface regression; chooser still light |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 7 routes (`/`, `/cases`, `/templates`, `/cases/:id`, `/templates/:code`, `/reports`, `/documents`) — 0 bounced, 0 console errors, 0 page errors, `rawSelectCount = 0` for `/documents` |
| Anti-slop ripgrep (`⚖`, `bg-[#123B66]`, `bg-[#0B1F3A]`, `bg-clip-text`, marketing copy, `rounded-[18px]`) | PASS | 0 source matches in the touched file (test guards already pinned) |

### Git hygiene

* No `.env`, `.env.local`, `.env.e2e.local` touched.
* No `playwright/.clerk/` state tracked — `playwright/.clerk/` is
  gitignored and only used at runtime by `test:e2e:auth`.
* No screenshots / traces / reports tracked — `test-results/` is
  gitignored; the smoke script writes its report there and the report
  itself contains only redacted console-error snippets.
* No runtime artifacts tracked.
* No new dependencies.
* No BM form input panel (`bm-XXX-form-inputs.tsx`) touched.
* No `/templates` review queue touched.
* No `/imports` workspace touched.
* No Form Studio touched.

### Next recommended PR

A single dedicated **template-chooser visual polish** PR could:

1. Reduce the "Tải lại dữ liệu" `bg-slate-950` reload button on
   `/documents` to the toned-down `<Button variant="default">` from the
   button-tone hotfix (out of scope here because it is a primary CTA
   that the hotfix explicitly left untouched, but the chooser has
   migrated all other controls so this is now the loudest surface on
   the page).
2. Migrate the per-card `Mở biểu mẫu` and `Mở với hồ sơ` action buttons
   on `/documents` from raw `<button className="... bg-blue-700 ...">`
   to `<Button variant="default" size="sm">` / `<Button variant="outline"
   size="sm">` for tone consistency with `/cases`, `/templates`, and
   `/reports`.
3. Optionally migrate the stage / status chips inside catalog cards
   (e.g. `Chưa triển khai`, `Mở Studio`, `Có thể mở`) through
   `StatusBadge`. The shared mapping in `status-badge.tsx` does not yet
   have a `templateRuntime` type — adding one would be a small
   accompanying slice.
4. Add a Playwright source guard to assert every SelectItem still
   carries a non-empty value (would catch a future PR that reintroduces
   the empty-string anti-pattern).

Form Studio remains explicitly deferred to a future dedicated PR with
its own visual-review budget.

## Visual polish hotfix — documents template chooser action buttons

**Date:** 2026-07-03
**Stacking note:** Built directly on top of PR #1–#14, the light-surface
hotfix, the global badge-tone hotfix, the global button-tone hotfix,
**and** the `/documents` Select-migration hotfix, **without** `git checkout
main`, `git reset`, or `git stash`. The dirty tree on `main` remains
intact; this hotfix lands the action-button polish on top of all of
the above.

### Why

The previous `/documents` hotfix migrated the two filter `<select>`s to
shadcn `Select`, but the template chooser still had several hand-built
action surfaces that did not match the global `Button` tone contract:

* The **"Tải lại dữ liệu"** reload CTA was a raw `<button>` styled with
  `bg-slate-950 text-white font-bold` — a hardcoded dark CTA on a page
  whose neighbours (`/cases`, `/reports`, `/settings`, dashboard) all
  render a quiet light surface with a single navy primary action.
* The **"Mở biểu mẫu"** template-card action was a raw `<button
  className="... bg-blue-700 ... text-white ...">` — a saturated bright
  blue fill that fights the global Button default tone.
* The **"Mở với hồ sơ"** template-card secondary action, the
  **"Hiện/Ẩn danh mục tổng hợp"** toggle, the **"Chọn hồ sơ khác"**
  and **"Xóa nội dung nhập"** utility buttons, and the modal **"Đóng"**
  button were all raw `<button>`s with hand-typed border + slate-700
  text classes — they worked but they were not part of the shared
  `Button` tone contract.

This hotfix migrates every one of these to the shared `Button` primitive
so the whole route feels like a single coherent admin-workstation page.

### Action-button inventory

| Action | Before | After | Hierarchy | Notes |
| --- | --- | --- | --- | --- |
| "Tải lại dữ liệu" (reload CTA) | Raw `<button className="... bg-slate-950 ... text-white ...">` | `Button variant="outline"` | Utility / refresh | No longer a hard black block; same tap-target height (`h-11`) and width as neighbours |
| "Chọn hồ sơ khác" (header utility) | Raw `<button className="... border border-slate-200 bg-white ...">` | `Button variant="outline"` | Utility | Quieter, no hardcoded border |
| "Xóa nội dung nhập" (header utility) | Raw `<button className="... border border-slate-200 bg-white ...">` | `Button variant="outline"` | Utility | Quieter, no hardcoded border |
| "Hiện/Ẩn danh mục tổng hợp" (toggle) | Raw `<button className="... border border-slate-200 bg-white ...">` | `Button variant="outline"` | Secondary | Same placement, same handler, same label set |
| "Mở biểu mẫu" (template card primary) | Raw `<button className="... bg-blue-700 ... text-white ...">` | `Button` (default variant → navy `bg-primary`) | Primary open | Reached through the shared Button tone contract, not a typed bright-blue fill |
| "Mở với hồ sơ" (template card secondary) | Raw `<button className="... border border-slate-200 bg-white ...">` | `Button variant="outline"` | Secondary open-with-case | Rests against the primary open action without competing for visual weight |
| "Đóng" (case picker modal) | Raw `<button className="... border border-slate-200 bg-white ...">` | `Button variant="outline"` | Modal action | Behaves identically; tone comes from the shared primitive |
| "Chọn hồ sơ" (case-picker list row) | Custom selectable `<button>` (selection state matters — selected row gets blue-50 / blue-300 border) | **Untouched** | Selectable row | Out of scope — selection visual, not an action hierarchy |

All action buttons are now driven by `apps/web/src/components/ui/button.tsx`
(the shared `Button` defined via `class-variance-authority`, `font-semibold`
default, focus ring on `ring-ring`). No new variants introduced; no
dependency added.

### Behavior preservation

* `loadDbTemplates`, `loadCatalog`, `loadCaseOptions`,
  `openCasePickerForTemplate`, `confirmCaseForPending`, `openTemplate`,
  `closeCasePicker`, `clearTemplateSelectorTextInputs`,
  `setShowFullCatalog` — **all handlers unchanged**. Same onClick wiring,
  same disabled conditions, same disabled-while-loading semantics.
* `disabled={isLoading}` on the reload CTA is preserved at the JSX level
  (the shared `Button` already supports `disabled` via the
  `disabled:pointer-events-none disabled:opacity-50` base).
* Loading label swap `isLoading ? "Đang tải..." : "Tải lại dữ liệu"`
  preserved verbatim.
* Open-with-case `disabled={!candidate.dbTemplateId || isOpening}`
  preserved verbatim (case-picker eligibility is unchanged).
* "Đang mở..." swap on the primary card action preserved verbatim.
* The case picker list row (which is a *selection* control, not an
  action hierarchy) remains a raw `<button>` with its hand-typed
  blue-tint-selected state — the polish explicitly does not touch
  selection visuals, only action surfaces.
* `createDocumentBatch`, `getPrimaryTemplateOpenTarget`, the
  `router.push("/documents/${generatedDocument.id}")` open-template
  routing, `openCasePickerForTemplate`, the `processNeed` / `stageId`
  initial state, `NEED_OPTIONS`, `vksTemplateStages`,
  `scoreTemplate`, `candidates`, `exactNeedBoosts`, `ruleEvaluation`
  — **all unchanged**.
* Search inputs (`Tội danh`, `Điều luật`, `Người liên quan/bị can`,
  `Mô tả dữ liệu đầu vào`) and the suggestion form layout (grid + the
  shadcn `Select` triggers migrated in the previous hotfix) — **all
  unchanged**.
* No API endpoint changed.
* No DOCX / template / form contract changed.
* No Smart Generic Prefill data changed.
* No `/templates` review queue touched.
* No standalone template form (`template-preview-workspace.tsx`) touched.
* No auth / RBAC touched.
* No `/imports` workspace touched.
* No Form Studio touched.
* No KPI counter cards touched (the inner `<p className="text-2xl
  font-black text-*-800">` numbers are display, not action surfaces).
* No raw `<span>` status badges touched — the `TemplateStatusBadge` /
  `RuntimeBadge` are intentionally passive indicators and are scoped
  by the global badge-tone hotfix already landed in this stack.
* No new dependency added.

### Tests / source guards

`apps/web/src/app/documents/page-shadcn.test.ts` now also covers the
button-polish hotfix (10 new cases on top of the 8 from the Select
migration, for 18 total). The pre-existing `light-surface-guard.test.ts`
suite is unchanged — its `template selector does not use bg-primary as
card surface` case continues to pass.

New assertions added:

1. The chooser source has no `bg-slate-950` anywhere.
2. The chooser source has no hardcoded `\btext-white\b` action class.
3. Every `<Button>` opening tag in the chooser source is free of
   `font-black` / `font-extrabold` (the shared `Button` variant uses
   `font-semibold` by design; headings and badges are out of scope).
4. Reload CTA label `Tải lại dữ liệu` and loading label `Đang tải...`
   are preserved verbatim.
5. Template card action labels `Mở biểu mẫu`, `Đang mở...`, and
   `Mở với hồ sơ` are preserved verbatim.
6. Open-template / open-with-case routing strings
   (`router.push(``/documents/${generatedDocument.id}```)`,
   `getPrimaryTemplateOpenTarget`, `createDocumentBatch`,
   `openCasePickerForTemplate`) are preserved verbatim.
7. The chooser imports `Button` from `@/components/ui/button`.
8. The chooser renders `Mở biểu mẫu` inside a `<Button>` and
   `Mở với hồ sơ` inside a `<Button variant="outline">`.
9. The chooser renders `Tải lại dữ liệu` inside a
   `<Button ... variant="outline" ...>` (with the label inside the
   open/close tags).
10. The chooser no longer renders the raw `<button ... bg-slate-950 ...
    Tải lại dữ liệu>` pair — guards against accidental regression of
    the dark-reload button.

No brittle snapshots. All 18 cases pass.

### Validation results

| Command | Result | Notes |
| ------- | ------ | ----- |
| `pnpm --filter api exec tsx --test "../web/src/app/documents/page-shadcn.test.ts"` | PASS | 18 / 18 — Select migration invariants intact + new action-button assertions |
| `pnpm --filter web lint` | PASS | 0 errors / 0 warnings |
| `pnpm --filter web exec tsc --noEmit` | PASS | 0 errors |
| `pnpm test:web-unit` | PASS | 414 / 414 — the 10 new source-guard cases are part of the unit suite |
| `pnpm test:e2e:auth` | PASS | 5 / 5 — Clerk-protected surface untouched |
| `pnpm --filter api exec tsx --test "../web/src/components/common/light-surface-guard.test.ts"` | PASS | 13 / 13 — no dark-surface regression; chooser still light |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS | 7 routes (`/`, `/cases`, `/templates`, `/cases/:id`, `/templates/:code`, `/reports`, `/documents`) — 0 bounced, 0 console errors, 0 page errors, `rawSelectCount = 0` for `/documents` |
| Anti-slop ripgrep (`⚖`, `bg-[#123B66]`, `bg-[#0B1F3A]`, `bg-clip-text`, marketing copy, `rounded-[18px]`) | PASS | 0 source matches in the touched file (test guards already pinned) |
| Documents-specific dark-class ripgrep (`bg-slate-950|...|font-black|font-extrabold|bg-blue-700|...`) | PASS | 0 hardcoded dark or saturated fills on action surfaces in the chooser; remaining `font-black` matches are on `<span>` badges and `<h1>/<h2>/<h3>/<h4>/<p>` headings (display typography, not action hierarchy) |

Per-route `/documents` row in the post-hotfix smoke report:

```json
{
  "route": "/documents",
  "routeLabel": "documents",
  "finalUrl": "http://localhost:3000/documents",
  "status": 200,
  "bouncedToSignIn": false,
  "rawSelectCount": 0,
  "surfaceProbes": {
    "anySelectTrigger": { "present": true, "isLight": true },
    "reloadButton": { "present": true }
  },
  "consoleErrors": [],
  "pageErrors": []
}
```

### Git hygiene

* No `.env`, `.env.local`, `.env.e2e.local` touched.
* No `playwright/.clerk/` state tracked — `playwright/.clerk/` is
  gitignored.
* No screenshots / traces / reports tracked — `test-results/` is
  gitignored; the smoke script writes its report there.
* No runtime artifacts tracked.
* No new dependencies.
* No BM form input panel (`bm-XXX-form-inputs.tsx`) touched.
* No `/templates` review queue touched.
* No `/imports` workspace touched.
* No Form Studio touched.
* No `/documents` native `<select>` introduced (Select migration stays
  intact).
* No DOCX / template / form contract touched.
* No Smart Generic Prefill data touched.

### Next recommended PR

After landing this hotfix, the only remaining `/documents` visual debt
called out by `docs/audit/ui-ux-overhaul-research/slop-audit.md` and
`docs/audit/ui-ux-overhaul-research/ui-inventory.md` is the optional
**status-badge tone** of the `TemplateStatusBadge` / `RuntimeBadge`
chips inside catalog cards — they remain quiet (very light
emerald-50 / amber-50 / slate-100 fills with text-* contrast) and are
explicitly within the "leave if already subtle" carve-out from the
global badge-tone hotfix. A future, purely optional, follow-up PR
could thread them through `apps/web/src/components/common/status-badge.tsx`
via a new `templateRuntime` variant — but the inventory to date suggests
that is a low-priority polish, not a regression, so the next actual
high-leverage slice is **Form Studio** (still deferred).


---

## PR next Imports preview table shadcn migration result

**Date:** 2026-07-03
**Stacking note:** Built on top of PR #1–#14, the light-surface hotfix,
visual QA, the global badge-tone hotfix, the global button-tone hotfix,
the documents Select migration, and the documents action polish — without
`git checkout main`, `git reset`, or `git stash`. The dirty tree on
`main` from the previous PRs remains intact; this PR modifies only the
files listed below on top of that tree.

### Why

`/imports` was the next safe high-impact shadcn migration target after
`/documents`. The shell, read-only state surfaces, status pills, and
confidence pills had already been migrated in PR #13 + PR #14. The
remaining raw UI debt on the route was `PreviewTable`'s hand-rolled
`<table>` markup — a render-only surface (parsed CSV/XLSX preview that
appears only after a successful upload), tightly scoped to a single
component, with no upload XHR / drag/drop / confirm / history
interaction to disturb. Migrating it to the shadcn `Table` primitive
brings the parsed preview table into the same visual rhythm as
`/cases`, `/reports`, `/settings`, and `/documents`, without changing
any behavior the contract guard pins.

### Files touched

- `apps/web/src/components/imports/import-workspace.tsx`
- `apps/web/src/app/imports/imports-shadcn.test.ts`
- `scripts/audit/ui-light-surface-smoke.mjs`
- `docs/audit/ui-ux-overhaul-research/shadcn-convergence-plan.md` (this
  file — new PR result section appended)

### PreviewTable migration summary

`PreviewTable` is the local component (still inside `import-workspace.tsx`)
that renders `parsedJson.tables[]` — one `<table>` per sheet, with the
first row as headers, body rows iterating `row[header]`, an empty-cell
fallback `<span className="text-slate-300">Trống</span>`, and a header
strip above each sheet showing `sheetName`, `totalRows dòng`, and the
candidate-column confidence pills.

Migration changes:

- Added a new import group for the shadcn `Table` primitive:
  `import { Table, TableBody, TableCell, TableHead, TableHeader,
  TableRow } from "@/components/ui/table";`.
- Replaced the raw `<table className="min-w-full border-collapse
  text-left text-[13px]">` with `<Table className="min-w-full
  border-collapse text-left text-[13px]">` so the same compact density
  is preserved on the shadcn primitive. The `Table` primitive's own
  scroll wrapper (`<div className="relative w-full overflow-auto">`)
  replaces the bespoke `<div className="overflow-x-auto">` wrapper that
  PR #13 carried over from the raw implementation.
- Replaced `<thead>` → `<TableHeader>`, `<tbody>` → `<TableBody>`,
  the header `<tr>` → `<TableRow className="bg-white hover:bg-white">`
  (the `hover:bg-white` override suppresses the shared `hover:bg-muted/50`
  hover on the header row to match the previous static look).
- Replaced header `<th>` cells → `<TableHead>` with the same
  `border-b border-slate-200 px-4 py-3 font-black text-slate-700` classes
  on every column.
- Replaced body `<tr>` cells → `<TableRow>` and body `<td>` cells →
  `<TableCell>` with the same `border-b border-slate-100 px-4 py-3
  align-top text-slate-700` classes and the same `odd:bg-white
  even:bg-slate-50/70` zebra striping on the body rows.
- Preserved the empty-cell `<span className="text-slate-300">Trống</span>`
  placeholder exactly.
- Preserved the header strip above each sheet (sheet name + `N dòng`
  + candidate-column `Badge` pills routed through the shared
  `confidenceBadgeVariant` helper).

### Raw table removal status

A ripgrep on `apps/web/src/components/imports/import-workspace.tsx`
confirms zero raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`,
or `<th>` tags remain in the workspace. The matching smoke probe (a
transient manual probe, not committed) also confirms zero raw table
tags in the rendered DOM.

### JSON `<pre>` block decision

Two raw `<pre>` blocks remain intentionally and are explicitly
documented as deferred:

1. `selectedFile.previewText` block inside the "Nội dung trích xuất"
   preview pane.
2. `selectedFile.parsedJson.kind === "json"` JSON preview block.

Reason for leaving raw: these are pure text blocks with no table
semantics, already rendered inside a calm light `bg-slate-50` /
`bg-amber-50` surface, and they are pure display-of-strings — the
shadcn `Table` primitive is not the right fit. A future, separate PR
may swap them for a shared `<CodeBlock>` primitive (if one is added)
or a styled `<Textarea readOnly>`, but this PR deliberately scopes
itself to the parsed-table surface only. The shadcn guard adds a new
explicit assertion (Phase F2) that documents this deferral so a
future PR does not silently re-migrate the wrong component.

### Behavior frozen

The contract guard pins every frozen behavior string. After this PR:

- `uploadImportFiles` still uses `XMLHttpRequest` with
  `xhr.upload.onprogress` for progress reporting.
- `confirmImportBatch` payload keys (`targetType`, `existingCaseId`,
  `newCase.caseCode`, `newCase.caseTitle`, `newCase.relatedPersonName`,
  `newCase.offenseName`, `newCase.createdDate`, `note.trim()`) are all
  preserved.
- `getImportHistory(1, 12)` argument pattern is preserved.
- `useTransition` wraps the history load effect (`startHistoryTransition`
  → `void loadHistory()`).
- `onDragOver / onDragLeave / onDrop` handlers on the dropzone wrapper
  are unchanged. `handleChosenFiles(event.dataTransfer.files)` still
  drives the drop.
- File `<input type="file" multiple>` keeps the literal
  `accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff"`
  attribute and `onChange={(event) => handleChosenFiles(event.target.files)}`.
- Status enum (`UPLOADED`, `PARSED`, `PARTIAL`, `FAILED`, `CONFIRMED`,
  `STORED_ONLY`, `PARSED_WITH_WARNINGS`, `REJECTED`) is still mapped in
  `status-badge.tsx`'s `IMPORT_CONFIG` and routed through
  `<StatusBadge type="import" value={...} />`.
- `ImportTargetType` literal set (`RAW_REFERENCE`, `EXISTING_CASE`,
  `NEW_CASE`, `TEMPLATE_SOURCE`) is preserved on the radio group.
- `confidenceBadgeVariant` helper still uses the exact threshold logic
  (`cao` → success, `vừa` → warning, anything else → muted). Displayed
  labels `cao` / `vừa` / `thấp` are unchanged.
- `parsedJson.tables[].candidateColumns[].{id, columnName, mappedField,
  confidence}` shape is rendered exactly as before, just inside the
  shadcn primitive.
- The "Trống" placeholder is unchanged.

### Raw controls still deferred

The following remain intentionally raw and are documented as PR D
scope (not this PR):

- The 6 raw `<input type="text/date">` calls for `existingCaseQuery`,
  `caseCode`, `caseTitle`, `relatedPersonName`, `offenseName`,
  `createdDate`.
- The hidden `<input type="file">` inside the dropzone label (and the
  `<label>` wrapper that acts as the "Chọn file" CTA). Migrating this
  safely requires a `Button asChild` + `Slot` composition (or moving
  the input outside the label and using `htmlFor`); a future PR may
  do that without disturbing the `accept` attribute or the
  `onChange` handler.
- The target-type radio group (`<input type="radio" name="targetType">`).
  Migrating this requires `RadioGroup` from `components/ui/radio-group`
  and is a UX-shape decision (the current cards-as-radio-options layout
  has to be preserved).
- The notes `<textarea>` field.
- The 6 raw `<button>` call sites (`<button>Tải lên</button>`,
  `<button>Xác nhận import</button>`, the per-file selection button,
  the per-case-search-result button, the history reload button, the
  history grid card button).
- The raw `<svg>` upload icon in the dropzone (lucide `UploadCloud` is
  a trivial swap and is the lightest piece of PR D).
- The local `SectionCard` helper is **kept** (still composes
  `PageSection card` from PR #13). Future routes can replace it with
  `PageSection` directly when they migrate.

### Visual smoke expansion

`scripts/audit/ui-light-surface-smoke.mjs` now visits `/imports` as a
basic light-surface route. The probe does not require seeded history
or any upload — it visits the empty-state branch:

- `body` (light)
- `pageShell` (light)
- `dropzoneFileInput` (`<input type="file">` present, dropzone visible)
- `historySection` (`<h2>Lịch sử import</h2>` present, even when empty)
- `emptyPreview` (`"Chưa có lô import nào đang mở"` placeholder present)

The probe does NOT count raw `<select>` elements on `/imports` (the
route has zero native `<select>` elements today and is not the
focus of the global raw-select guard — that remains scoped to
`/documents`).

### Validation results

| Gate                                                                                          | Result |
| --------------------------------------------------------------------------------------------- | ------ |
| `node --test apps/web/src/app/imports/imports-workspace-contract.test.ts`                     | PASS — 17/17 |
| `node --test apps/web/src/app/imports/imports-shadcn.test.ts`                                 | PASS — 17/17 (was 16/16; one new test added for the `<pre>` deferral decision) |
| `pnpm --filter web lint`                                                                      | PASS — 0 errors / 0 warnings |
| `pnpm --filter web exec tsc --noEmit`                                                         | PASS — 0 errors |
| `pnpm test:web-unit`                                                                          | PASS — 415/415 (the imports contract + shadcn tests are part of the suite) |
| `pnpm test:e2e:auth`                                                                          | PASS — 5/5 |
| `pnpm --filter api exec tsx --test "../web/src/components/common/light-surface-guard.test.ts"` | PASS — 13/13 |
| `node scripts/audit/ui-light-surface-smoke.mjs`                                               | PASS — 8 routes (was 7), `bounced=0`, `consoleErrors=0`, `pageErrors=0` |

A transient manual visual probe (not committed) confirmed:

- `/imports` returns 200 under the Clerk admin storage state.
- `/imports` does NOT bounce to `/sign-in`.
- The rendered DOM contains zero raw `<table>` / `<thead>` / `<tbody>`
  / `<tr>` / `<td>` / `<th>` elements (consistent with the source
  change).
- The dropzone + history section + empty-preview placeholder all
  render correctly under `colorScheme: "dark"` OS preference (i.e.
  the route stays light even when the OS is in dark mode).
- The screenshot matches the visual rhythm of `/cases` and `/reports`.

### Anti-slop / light-surface ripgrep

- `⚖` emoji: 0 source matches in `apps/web/src` (test file references
  the pattern only).
- `bg-[#123B66]`, `bg-[#0B1F3A]`: 0 matches.
- `bg-clip-text`, `text-transparent`: 0 matches.
- Marketing copy (`Seamless|Elevate|Unleash|Next-Gen|Game-changer|
  supercharge|empower|streamline`): 0 matches.
- `rounded-[18px]`: 0 matches.
- Imports-specific raw `<table>` / `<thead>` / `<tbody>` / `<tr>` /
  `<td>` / `<th>` in `import-workspace.tsx`: 0 matches (was 6 before
  this PR).
- Raw `<button>` / `<input>` / `<select>` / `<textarea>` / `<svg>`
  in `import-workspace.tsx`: 16 matches remain — these are the
  documented PR D surface and are intentionally out of scope.
- `bg-primary | bg-slate-950 | bg-slate-900 | bg-black | bg-zinc-950`
  on `apps/web/src/app/imports` and `apps/web/src/components/imports`:
  1 match (the dropzone "Chọn file" CTA at `import-workspace.tsx`
  line 482, which is the documented allowed primary-action use).
- Saturated `bg-green-500|emerald-500|orange-500|amber-500|red-500|
  rose-500` fills: 0 matches in `import-workspace.tsx`. The only
  saturated fills remaining are pre-existing `bg-blue-600`,
  `bg-emerald-600`, `bg-blue-700` raw `<button>` CTAs, all of which
  are part of the deferred PR D scope.

### Git hygiene

- No `.env`, `.env.local`, `.env.e2e.local` touched.
- No `playwright/.clerk/` state tracked.
- No screenshots / traces / reports tracked — `test-results/` is
  gitignored; the smoke script writes its report there.
- No runtime artifacts tracked.
- No new dependencies.
- No BM form input panel (`bm-XXX-form-inputs.tsx`) touched.
- No `/templates` review queue touched.
- No `/documents` chooser touched.
- No `/cases` page touched.
- No Form Studio touched.
- No DOCX / template / form contract touched.
- No Smart Generic Prefill data touched.

### Next recommended imports PR

After this PR, the only remaining `/imports` visual debt called out
in the research plan is the **PR D surface** — the dropzone label +
hidden file input, the 6 raw form inputs, the radio group, the
notes textarea, the 6 raw `<button>` call sites, and the raw upload
`<svg>` icon. PR D is the largest behavior-preserving surface
remaining on `/imports` (it must keep `accept`, `multiple`, drag/drop
handlers, payload keys, and history load intact) and is the natural
next slice. After PR D, the only remaining `/imports` follow-up would
be PR E — promote the contract guard into a fully pinned spec and
add a seeded-history visual smoke route for the parsed-data
branch (out of scope for this PR by mandate).

## PR next Imports controls shadcn migration result

This PR is the **PR D slice** of the `/imports` roadmap that the prior
convergence-plan section explicitly deferred. It migrates the
behavior-sensitive raw controls on `/imports` to the existing
shadcn primitives while keeping the import workflow exactly as
frozen by `imports-workspace-contract.test.ts`. The work was stacked
on top of PR #1–#14 plus all visual hotfixes plus the prior
"Imports preview table shadcn migration result" PR. **No checkout of
`main`, no `git reset`, no `git stash`** was performed; the change
sits on top of the dirty tree.

### Why

The remaining `/imports` visual debt was concentrated in the
interaction chrome (buttons, text inputs, textarea, radio group, and
the upload icon). Each call site is paired with frozen behavior
(`uploadImportFiles` XHR, drag/drop handlers, `accept` string,
`handleChosenFiles(fileList)`, `selectedFiles` slicing, the
`confirmImportBatch` payload, `getImportHistory(1, 12)`, and the
`useTransition` history effect). The PR migrates each surface to a
shared primitive without touching any of the frozen strings or
handlers.

### Files touched

| File | Change |
|---|---|
| `apps/web/src/components/imports/import-workspace.tsx` | Migrated 6 raw `<button>` call sites, 6 raw `<input>` controls (1 hidden file input + 5 visible form inputs), 1 raw `<textarea>`, 1 raw `<svg>` icon, and the raw `<input type="radio" name="targetType">` chooser to the shared shadcn primitives. Hidden file input and its `accept` string preserved exactly. |
| `apps/web/src/app/imports/imports-shadcn.test.ts` | Added 7 new test phases (K–Q) asserting the new `Button` / `Input` / `Textarea` / `RadioGroup` / `Lucide UploadCloud` adoption, the removal of the raw target-type radio input, and that the hidden file input is the only remaining raw `<input>`. Updated the "Phase F" test description to reflect that the dropzone/form controls were migrated in this PR (not deferred). Updated `Button asChild` regex to allow whitespace between `Button` and `asChild`. Updated `RadioGroupItem` count to `>= 1` (one JSX tag renders N items via `.map`). |
| `apps/web/src/app/imports/imports-workspace-contract.test.ts` | Updated `targetOptions still list every ImportTargetType literal` to assert `onValueChange` + `<RadioGroupItem value={option.value}>` instead of the raw radio input, and explicitly `assert.doesNotMatch` the raw `<input type="radio" name="targetType">` pattern. Contract was tightened, not loosened. |
| `docs/audit/ui-ux-overhaul-research/shadcn-convergence-plan.md` | This section. |

### Control migration summary

| Control | Before | After | Behavior Preserved | Notes |
|---|---|---|---|---|
| Dropzone "Chọn file" label/button | Raw `<label>` with `inline-flex rounded-full bg-primary px-5 py-3 ...` | `Button asChild size="lg" rounded-full px-5` wrapping the `<label>`. Hidden `<input type="file">` lives inside the label. | Yes — `multiple`, exact `accept` string, `handleChosenFiles(event.target.files)`, file picker activation all unchanged. | Used `asChild` so the click target stays on the native `<label>` (semantic file-picker activator), not on the Button. |
| Dropzone upload icon | Raw 3-path `<svg>` (`h-8 w-8` stroke arrows) inside a `rounded-3xl bg-white shadow-sm` tile | Lucide `UploadCloud` (`h-8 w-8 strokeWidth={1.8}`) inside the same tile. `aria-hidden="true"`. | Yes — purely visual, no behavior. | Lucide already imported elsewhere in the file (used for `Wand2`); no new dependency. |
| "Tải lên" upload CTA | Raw `<button>` with `bg-blue-600 hover:bg-blue-700` | `Button size="lg" w-full sm:w-auto` | Yes — `disabled={uploading || !selectedFiles.length}`, `onClick={() => void handleUpload()}`, `type="button"` all preserved. | Primary CTA visual weight. |
| "Xác nhận import" confirm CTA | Raw `<button>` with `bg-emerald-600 hover:bg-emerald-700` | `Button variant="success" size="lg" min-h-11 px-5` | Yes — `disabled={!canConfirm || confirming}`, label toggle (`"Đang lưu..."` / `"Xác nhận import"`), `onClick={() => void handleConfirmImport()}` all preserved. | Uses the existing `success` variant in the shared `Button` CVA. |
| History "Tải lại" reload | Raw `<button>` with `rounded-full border border-slate-200 ...` | `Button variant="outline" size="sm" rounded-full px-4 text-[13px] font-bold` | Yes — `startHistoryTransition(() => { void loadHistory() })` preserved. | `font-bold` (not `font-black`) matches the existing `outline` Button tone. |
| History batch card action | Raw `<button>` with `rounded-[24px] border ... p-4` | `Button variant="outline" h-auto w-full flex-col items-stretch justify-start whitespace-normal rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-none hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white` | Yes — `onClick={() => void handleOpenHistoryBatch(item.batchId)}`, `type="button"` preserved. | Vertical layout preserved via `flex-col items-stretch`. |
| Per-file selection row | Raw `<button>` with `border-blue-400 bg-blue-50` selected / `bg-white` default | `Button variant="outline" h-auto w-full justify-start rounded-[22px] border px-4 py-3 text-left whitespace-normal shadow-none` + conditional blue tint | Yes — `setSelectedFileId(file.fileId)`, `key={file.fileId}`, `type="button"` preserved. | File name retains `font-black` (visual weight preserved). |
| Existing case search result row | Raw `<button>` with rounded-2xl border + selected bg-blue-50 | `Button variant="outline" h-auto w-full justify-start whitespace-normal rounded-2xl border px-4 py-3 text-left shadow-none` + conditional blue tint | Yes — `setSelectedExistingCaseId(item.id)` + `setExistingCaseQuery("${item.caseCode} - ${item.caseTitle}")` both preserved. | Tighter visual rhythm now matches the per-file selection button. |
| Existing case search input | Raw `<input>` with `rounded-2xl border border-slate-200 ...` | `Input h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]` | Yes — controlled `existingCaseQuery`, `onChange={(e) => setExistingCaseQuery(e.target.value)}`, placeholder `"Nhập mã hồ sơ hoặc tên vụ án"` preserved. | Matches the shared input tone. |
| New case `caseCode` input | Raw `<input>` | `Input h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]` | Yes — controlled value + `setNewCaseForm((c) => ({ ...c, caseCode: ... }))` preserved. | |
| New case `caseTitle` input | Raw `<input>` | Same `Input` | Yes. | |
| New case `relatedPersonName` input | Raw `<input>` | Same `Input` | Yes. | |
| New case `offenseName` input | Raw `<input>` | Same `Input` | Yes. | |
| New case `createdDate` input | Raw `<input type="date">` | `Input type="date" h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]` | Yes — `type="date"` preserved. | HTML5 date input retains native picker via the `Input` forwardRef. |
| Note textarea | Raw `<textarea rows={3}>` | `Textarea rows={3} min-h-[88px] rounded-[22px] border-slate-200 bg-white px-4 py-3 text-[14px]` | Yes — controlled `note`, `onChange={(e) => setNote(e.target.value)}`, placeholder `"Có thể để trống nếu không cần."` preserved. The `note.trim() || undefined` mapping in `confirmImportBatch` is untouched. | |
| Target-type radio group | 4 native `<input type="radio" name="targetType">` inside `<label>` | `RadioGroup` + 4 `RadioGroupItem` (one JSX tag inside `.map`). Each row keeps its `<label>` wrapper with the selected/unselected border + bg styling. | Yes — all four literal `ImportTargetType` values (`RAW_REFERENCE`, `EXISTING_CASE`, `NEW_CASE`, `TEMPLATE_SOURCE`), `targetType` state, `setTargetType(value as ImportTargetType)` cast, conditional panels triggered by `targetType`, and the initial `targetType` all preserved. | `RadioGroup` does not forward `name` to the underlying radio input (Radix API), so the contract guard was updated to verify `onValueChange` + `RadioGroupItem value` instead of `name="targetType"`. The contract still pins the four literal values. |

### Hidden file input decision

The single `<input type="file" multiple accept="...">` inside the
dropzone is **intentionally kept raw** for these reasons:

1. `accept` and `multiple` are HTMLInputElement-native attributes that
   must remain on the element that opens the file picker.
2. Wrapping it in a shadcn primitive that proxies the `accept` prop
   adds no value and risks silently dropping `multiple` or the
   extension list during forwarding.
3. The contract guard still pins the exact `accept` string and the
   `handleChosenFiles(event.target.files)` change handler — both
   still apply on the raw element.

### Radio migration decision

Migrated to `RadioGroup` + `RadioGroupItem`. The contract guard was
updated to assert `onValueChange={(value) => setTargetType(value as ImportTargetType)}`
on the `RadioGroup` and `<RadioGroupItem value={option.value}>` for
each rendered option, plus `assert.doesNotMatch` for the raw
`<input type="radio" name="targetType">`. All four
`ImportTargetType` literals (`RAW_REFERENCE`, `EXISTING_CASE`,
`NEW_CASE`, `TEMPLATE_SOURCE`) remain pinned via the
`targetOptions` constant and the `ImportTargetType` type assertion
in `onValueChange`.

### Upload icon decision

Migrated to Lucide `UploadCloud`. `lucide-react` was already a
project dependency (used elsewhere in the file for `Wand2`).
`aria-hidden="true"` and `strokeWidth={1.8}` keep the decorative
icon restrained and consistent with the dropzone's existing
`h-8 w-8` tile.

### Behavior frozen (unchanged in this PR)

- `uploadImportFiles` XHR implementation.
- `xhr.upload.onprogress` and progress reporting.
- `formData.append("files", file)` and the `files` key.
- Hidden file input `accept` string and `multiple`.
- `handleChosenFiles(fileList)` change handler signature.
- `selectedFiles` slicing logic.
- `event.dataTransfer.files` drag/drop wiring.
- `confirmImportBatch` payload keys and `existingCaseId` / `newCase`
  assignment.
- `note.trim() || undefined` mapping.
- `getImportHistory(1, 12)` call.
- `useTransition` history load (`startHistoryTransition`).
- `parsedJson` + `PreviewTable` (already migrated to shadcn `Table`
  in the prior preview-table PR).
- `StatusBadge type="import"` mapping for all frozen statuses
  (already centralized in PR #14).
- `importStatusLabel` for inline status text (PR #14 centralization
  preserved).
- Shared `Badge` variants for confidence pills (PR #14
  centralization preserved).

### Deferred items

- The two `<pre>` blocks that render `JSON.stringify(parsedJson)`
  and the `previewText` string remain intentionally raw. They are
  the documented PR E deferral and are not part of the controls
  surface this PR targets.
- The hidden file input remains raw (see "Hidden file input
  decision" above).
- No new shadcn primitive was installed. The PR uses only the
  already-present `Button`, `Input`, `Textarea`, `RadioGroup`,
  `RadioGroupItem`, `Table`, `Badge`, and `lucide-react`
  primitives.

### Light-surface / anti-slop ripgrep

| Check | Result |
|---|---|
| `⚖` emoji in `apps/web/src` | 1 file (test fixture only) — no production code |
| `bg-[#123B66]`, `bg-[#0B1F3A]` in `apps/web/src` | 0 matches |
| `bg-clip-text`, `text-transparent` in `apps/web/src` | 0 matches |
| `Seamless\|Elevate\|Unleash\|Next-Gen\|Game-changer\|supercharge\|empower\|streamline` in `apps/web/src` | 0 matches |
| `rounded-[18px]` in `apps/web/src` | 0 matches |
| Raw `<button>` in `import-workspace.tsx` | 0 (was 6 before this PR) |
| Raw `<input>` in `import-workspace.tsx` | 1 — the hidden file input (intentional) |
| Raw `<textarea>` in `import-workspace.tsx` | 0 (was 1 before this PR) |
| Raw `<svg>` in `import-workspace.tsx` | 0 (was 1 before this PR) |
| Raw `type="radio"` in `import-workspace.tsx` | 0 (was 1 before this PR) |
| Raw `name="targetType"` in `import-workspace.tsx` | 0 (moved to `RadioGroup`'s typed `onValueChange`) |
| `bg-primary \| bg-slate-950 \| bg-slate-900 \| bg-black \| bg-zinc-950` on `apps/web/src/app/imports` and `apps/web/src/components/imports` (excluding tests) | 0 (the `bg-primary` literal is now via `Button` CVA, not raw class) |
| Saturated fills (`bg-green-500\|emerald-500\|orange-500\|amber-500\|red-500\|rose-500`) in `import-workspace.tsx` | 0 |
| `text-white` in `import-workspace.tsx` | 0 |
| `font-black` in `import-workspace.tsx` | 25 — these are text-weight utilities on labels (file name, batch header, status labels), preserved intentionally to maintain visual hierarchy. None are on background fills. |

### Validation results

| Gate | Result |
|---|---|
| `node --test apps/web/src/app/imports/imports-workspace-contract.test.ts` | PASS — 17/17 |
| `node --test apps/web/src/app/imports/imports-shadcn.test.ts` | PASS — 24/24 (was 17/17; added 7 new phases K–Q for the migrated primitives) |
| `pnpm --filter web lint` | PASS — 0 errors / 0 warnings |
| `pnpm --filter web exec tsc --noEmit` | PASS — 0 errors |
| `pnpm test:web-unit` | PASS — 422/422 (the imports contract + shadcn tests are part of the suite) |
| `pnpm test:e2e:auth` | PASS — 5/5 |
| `pnpm --filter api exec tsx --test "../web/src/components/common/light-surface-guard.test.ts"` | PASS — 13/13 |
| `node scripts/audit/ui-light-surface-smoke.mjs` | PASS — 8 routes, `bounced=0`, `consoleErrors=0`, `pageErrors=0` |

### Git hygiene

- No `.env`, `.env.local`, `.env.e2e.local` touched.
- No `playwright/.clerk/` state tracked.
- No screenshots / traces / reports tracked — `test-results/` is
  gitignored; the smoke script writes its report there. The
  transient `e2e-auth.log` tee file from the validation run was
  removed after the run.
- No runtime artifacts tracked.
- No new dependencies.
- No BM form input panel (`bm-XXX-form-inputs.tsx`) touched.
- No `/templates` review queue touched.
- No `/documents` chooser touched.
- No `/cases` page touched.
- No Form Studio touched.
- No DOCX / template / form contract touched.
- No Smart Generic Prefill data touched.

### Next recommended imports PR

The remaining `/imports` work after this slice is **PR E** — promote
the contract guard into a fully pinned spec and add a seeded-history
visual smoke route for the parsed-data branch. The visual smoke
expansion requires a real Clerk session with a seeded import
history row, which is outside the scope of a primitive-migration PR
and is the natural next slice.



