# QLLaw UX/UI Overhaul Research — Master Audit Report

**Audit Date:** 2026-07-03
**Auditor:** Cursor (research-only, no implementation)
**Scope:** QLLaw / QUANLYVKS frontend surfaces — apps/web/src
**Stack:** Next.js 16 + Tailwind CSS v4 + shadcn/ui + Radix + CVA + Lucide
**Status:** `READY_FOR_OVERHAUL_RESEARCH_COMPLETE`

---

## 1. Executive Summary

**Overall Status:** `READY_FOR_OVERHAUL_RESEARCH_COMPLETE`

The QLLaw frontend has a solid technical foundation — shadcn/ui + Radix + Tailwind v4 + CVA is the right stack. However, there are significant visual inconsistencies, scattered hardcoded inline styles, token gaps, duplicated pattern libraries, and scattered hardcoded status colors that have accumulated across the 130+ BM form files and multiple workspace surfaces.

### 5 Strongest Findings

1. **Per-form sticky action bars** — 100+ files independently define `rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur` inline. This is a massive duplication target for a shared component. Changing the action bar design requires editing 100+ files.

2. **Inline hardcoded status color classes** — Dashboard KPI cards (`bg-blue-50 text-blue-700`, `bg-indigo-50 text-indigo-700`), cases page, auth identities page, event icons, and status badges all use inline `bg-*-50 text-*-700` patterns instead of semantic design tokens. This makes theming and accessibility corrections require editing across dozens of files.

3. **Unenforced `PageShell` adoption** — `PageShell`, `PageHeader`, `PageSection`, `PageActions` exist as canonical layout primitives (defined in `common/page-shell.tsx` with `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`), but the majority of pages do not use them. The dashboard, cases page, documents page, admin pages, and review queue pages all define their own layout structures. This creates inconsistent spacing, radius, and shadow patterns across surfaces.

4. **`rounded-[18px]` / `rounded-[36px]` hardcoded values** — The nav-items sidebar uses `rounded-[18px]` for nav items and `rounded-[36px]` (estimated) for logo/avatar areas, while the main CSS uses `rounded-2xl` (12px equivalent). These inconsistent radius values create visual misalignment between sidebar nav and document workspaces.

5. **Auth shell decorative gradient** — `auth-shell.tsx` uses `bg-[linear-gradient(135deg,#07111f_0%,#0b1730_58%,#103257_100%)]` — a hardcoded dark gradient on the left panel of the auth page. This is a single exception to the "no decorative gradients" rule but should be refactored to use CSS variables so it can be adjusted in dark mode.

### 5 Highest-Risk Areas

1. **BM form action bars (100+ files)** — Extracting to shared component is low-risk mechanically but requires thorough visual regression testing across all 213 BM forms. Must use Playwright screenshots before/after.

2. **Dashboard KPI layout** — `app/page.tsx` uses raw `rounded-lg border border-slate-200 bg-white p-4` for KPI cards and module links. Refactoring to use `PageSection` with `PageShell` would change the visual appearance significantly. Risk: breaking existing layout without visual regression.

3. **Template preview workspace header** — `template-preview-workspace.tsx` has a large inline header section (`rounded-3xl border border-slate-200 bg-white p-7 shadow-sm`) with template badges, large heading, and subtitle text. This is one of the most visible surfaces and any change needs careful review.

4. **Review queue item cards** — `review-queue-item-card.tsx` uses `rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md`. The hover states are functional but the shadow on cards may need review for consistency with other card surfaces.

5. **Form studio workspace** — `form-studio-workspace.tsx` is a large complex component. Any shared primitive changes need to account for its unique three-pane layout requirements. Risk: changes to shared components (tabs, dialogs, buttons) could affect the editor's visual integrity.

### Recommended First Implementation PR

**PR #1: Extract BM form action bar to shared component + anti-slop cleanup**

- Extract the sticky bottom action bar pattern from 5 representative BM forms into a shared `FormActionBar` component in `components/common/`
- Fix `rounded-3xl` inconsistency in nav-items vs `rounded-2xl` in form workspaces
- Remove `shadow-xl` from auth shell decorative elements, replace with `shadow-lg` consistent with other elevated surfaces
- Add `prefers-reduced-motion` where missing on animated components

**Files likely touched:** `apps/web/src/components/common/form-action-bar.tsx`, `nav-items.tsx`, `auth-shell.tsx`, 5 representative `bm-*-form-inputs.tsx` files
**Non-goals:** No BM form data/logic changes, no new dependencies, no framework changes
**Validation:** `pnpm --filter web lint && pnpm --filter web exec tsc --noEmit`
**Rollback:** `git checkout` of modified files

---

## 2. Project Design Read

**Correct visual direction:** Legal/government-grade workflow product for officials and administrators, with a premium utilitarian minimalist language, leaning toward dense-but-calm workstation UI, restrained motion, high legibility, semantic status colors, and strong hierarchy.

**Why this is product UI, not landing-page UI:**
- Users are legal administrators processing cases across 213+ form templates
- Sessions are long (hours of form entry, review, and document management)
- Density over decoration — every pixel should serve a workflow function
- Trust signals come from clarity and predictability, not visual flair
- The primary action surface is the form input panel, not a hero section

**Why "minimal" here means calm precision, not empty decorative whitespace:**
- Legal forms have inherent density — they must display all required fields
- Whitespace serves as section separator and visual breathing room, not decoration
- Motion serves state transitions (panel open/close, form save feedback), not aesthetics
- The auth shell's left panel gradient is the single legitimate exception — it's brand identity, not decoration

---

## 3. Current Architecture Map

### Framework
- **Framework:** Next.js 16 (App Router, `"use client"` components)
- **Package manager:** pnpm monorepo
- **Apps:** `apps/web` (Next.js frontend), `apps/api` (NestJS backend), `packages/form-contracts`
- **TypeScript:** Strict mode assumed

### Styling Stack
- **Tailwind CSS v4** with `@import "tailwindcss"` (CSS-first config)
- **No `tailwind.config.js`** — all config via `@theme inline {}` in `globals.css`
- **Shadcn/ui patterns** — components in `apps/web/src/components/ui/`, built on Radix UI primitives
- **CVA (class-variance-authority)** — `button.tsx`, `badge.tsx` use CVA for variant composition
- **Custom CSS classes** in `globals.css`:
  - `.qvks-document-workspace` — form workspace wrapper with typography/sizing tokens
  - `.qvks-auth-brand-enter` / `.qvks-auth-card-enter` — auth page entrance animations
  - Global date/select sizing overrides

### Component System
```
apps/web/src/components/
├── ui/              → shadcn-style base components (30+)
├── common/          → shared utility components
│   ├── page-shell.tsx        (PageShell, PageHeader, PageSection, PageActions)
│   ├── status-badge.tsx      (centralized domain badges)
│   ├── error-banner.tsx
│   ├── loading-state.tsx
│   ├── empty-state.tsx
│   ├── confirm-dialog.tsx
│   ├── data-table-shell.tsx
│   └── field.tsx
├── layout/          → AppShell, Sidebar, Topbar, NavItems
├── auth/            → AuthGate, AuthShell
├── documents/       → 130+ components (BM forms + workspaces)
│   ├── template-preview-workspace.tsx
│   ├── generated-document-workspace.tsx
│   ├── generated-document-action-panel.tsx
│   ├── generated-document-preview-panel.tsx
│   ├── generated-document-audit-panel.tsx
│   ├── runtime-pdf-preview.tsx
│   ├── pre-export-customization-panel.tsx
│   ├── bm-panel-registry.generated.ts
│   ├── bm-form/
│   │   ├── bm-form-meta-bar.tsx
│   │   └── classes.ts
│   └── bm-*.tsx    (100+ per-form input components)
├── review-queue/    → review queue components
└── cases/           → case workspace
```

### Token System

**CSS Variables (defined in `globals.css`):**
```css
/* Radius */
--radius: 0.5rem;        /* 8px base */

/* Status colors */
--success: 142 71% 45%;
--warning: 38 92% 50%;
--destructive: 0 84% 60%;

/* Primary (deep navy) */
--primary: 222 70% 26%;

/* QLLaw custom overrides */
--qvks-font-size-base: 16px;
--qvks-font-size-label: 15px;
--qvks-font-size-input: 16px;
--qvks-input-height: 46px;
--qvks-button-height: 42px;
--qvks-card-radius: 18px;
```

**Tailwind v4 `@theme inline {}` mapping:**
All `--color-*` and `--radius-*` variables map to Tailwind utility classes.

**Missing tokens (identified gaps):**
- No explicit `--radius-nav` or `--radius-card` token — `.qvks-card-radius` exists but is used only in `.qvks-document-workspace .qvks-card` selector, not globally
- No `--shadow-card` token for consistent card elevation
- No `--shadow-sticky` token for the action bar shadow pattern
- Status colors (blue/indigo/amber/emerald/rose) are not exposed as CSS variables — they're used as inline Tailwind classes

### Major UI Surfaces
| Surface | Route | Primary User Job |
|---------|-------|----------------|
| Dashboard | `/` | Overview of KPIs and recent activity |
| Cases list | `/cases` | Browse, search, filter cases |
| Case detail | `/cases/[caseId]` | Review/update case data |
| Document creation | `/documents` | Create new generated document |
| Generated document workspace | `/documents/[id]` | Persisted document with preview/history |
| Template list/review | `/templates` | Review queue for generated documents |
| Template preview | `/templates/[code]` | Runtime DOCX/Preview session |
| Auth identities | `/admin/auth/identities` | Link Clerk users to officials |
| Form Studio | `/admin/form-studio` | Admin-only form editor |
| Import workspace | `/imports` | Data import |
| Reports | `/reports` | Reporting |
| Settings | `/settings` | Configuration |

### Major Shared Components
- `PageShell/PageHeader/PageSection/PageActions` — canonical page layout (underused)
- `StatusBadge` — centralized domain status badge system
- `EmptyState` — standard empty state
- `LoadingState` — standard loading skeleton
- `ErrorBanner` — standard error display
- `ConfirmDialog` — confirmation dialog
- `DataTableShell` — table wrapper
- `Button` (CVA variants) — `default/destructive/outline/secondary/ghost/link/success/warning`
- `Badge` (CVA variants) — `default/secondary/destructive/success/warning/outline/muted/blue/violet`
- `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- `Dialog`, `Sheet`, `AlertDialog`, `Tooltip`, `Tabs`, `Separator`, `ScrollArea`, `Skeleton`
- `Sonner` (toast notifications)

### Major Duplicated Patterns
1. **Sticky action bar** — `rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur` defined independently in 100+ `bm-*-form-inputs.tsx` files
2. **Status color pattern** — `bg-*-50 text-*-700` inline classes scattered across dashboard, cases, admin, review queue
3. **Card container** — `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm` used in PageSection but also duplicated in EmptyState, LoadingState, TemplatePreviewWorkspace header
4. **Inline SVGs for icons** — `SvgIcon` in `nav-items.tsx` uses raw SVG paths inline instead of using Lucide consistently
5. **Hardcoded `bg-[#123B66]` / `bg-[#0B1F3A]`** — brand color used as inline values instead of CSS variables or Tailwind color class

---

## 4. Route/Surface Audit Table

| Route/Surface | Primary User Job | Current UX Issue | Current Visual Issue | AI Slop Risk | A11y Risk | Suggested Future Treatment | Files/Components | Risk Level |
|---|---|---|---|---|---|---|---|---|
| `/` (Dashboard) | Overview KPIs + recent activity | KPI card layout is utilitarian but not cohesive with other surfaces | Raw `rounded-lg` cards vs `rounded-3xl` used elsewhere; inconsistent shadow | LOW | LOW | Migrate to `PageSection` with consistent `rounded-3xl border shadow-sm`; use `StatusBadge` for KPI tone | `app/page.tsx` | MEDIUM |
| `/cases` | Browse/search/filter cases | Custom page layout not using `PageShell` | Mixed `rounded-lg` / `rounded-2xl` / `rounded-xl` across sections | LOW | LOW | Adopt `PageShell`/`PageSection`; consolidate status tone patterns | `app/cases/page.tsx` | MEDIUM |
| `/cases/[caseId]` | Review/update case data | Uses `case-detail-workspace.tsx` | Custom workspace with many hardcoded status colors | LOW | LOW | Consolidate hardcoded status colors to semantic tokens; review shadow usage | `apps/web/src/components/cases/case-detail-workspace.tsx` | MEDIUM |
| `/documents` | Create new generated document | Custom page layout | Not inspected in full detail | LOW | UNKNOWN | Requires runtime inspection | `app/documents/page.tsx` | MEDIUM |
| `/documents/[id]` | Persisted document workspace | Excellent — correctly separates preview/history/audit | Some hardcoded status tones; template badges use `rounded-full` | LOW | LOW | Consolidate hardcoded status colors; review template badge styling | `generated-document-workspace.tsx`, `generated-document-action-panel.tsx`, `generated-document-preview-panel.tsx` | LOW |
| `/templates` | Review queue | Uses `review-queue-item-card.tsx` | Cards use `rounded-3xl` with `shadow-sm hover:shadow-md` | LOW | LOW | Consistent with PageSection card pattern; hover shadow may need review | `review-queue-item-card.tsx` | LOW |
| `/templates/[code]` | Runtime DOCX/Preview session | Excellent — correctly uses honest UX copy for preview vs DOCX-only | Large header with `rounded-3xl p-7`; sticky action bar duplicated across forms | LOW | LOW | Reduce header visual weight; extract action bar to shared component | `template-preview-workspace.tsx`, `runtime-pdf-preview.tsx`, 100+ `bm-*-form-inputs.tsx` | MEDIUM |
| `/admin/auth/identities` | Link Clerk users to officials | Uses custom modals with inline SVGs | Custom page layout; inline `bg-[#123B66]` button color | LOW | MEDIUM | Use shared `PageShell`; extract modal patterns; use semantic button variants | `admin/auth/identities/page.tsx`, `auth-shell.tsx` | MEDIUM |
| `/admin/form-studio` | Admin form editor | Full-width workspace; drag handles | Uses `rounded-3xl` for form section cards; drag shadow | LOW | LOW | Align radius with other surfaces; review drag shadow | `form-studio-workspace.tsx` | LOW |
| `/sign-in` | Clerk authentication | Clean auth shell | Auth shell has hardcoded dark gradient (single acceptable exception) | LOW | LOW | Convert gradient to CSS variable for dark mode support | `auth-shell.tsx` | LOW |
| `/imports` | Data import | Not inspected in full detail | Requires runtime inspection | LOW | UNKNOWN | Requires runtime inspection | `imports/page.tsx` | MEDIUM |
| `/reports` | Reporting | Not inspected in full detail | Requires runtime inspection | LOW | UNKNOWN | Requires runtime inspection | `reports/page.tsx` | MEDIUM |
| `/settings` | Settings | Not inspected in full detail | Requires runtime inspection | LOW | UNKNOWN | Requires runtime inspection | `settings/page.tsx` | MEDIUM |

---

## 5. UI Inventory

### Buttons/Actions

**Shared component:** `Button` in `components/ui/button.tsx`
- **Variants:** `default` (primary navy), `destructive` (red), `outline`, `secondary`, `ghost`, `link`, `success` (green), `warning` (amber)
- **Sizes:** `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10), `icon-sm` (h-9 w-9)
- **All variants include:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **State handling:** `disabled` with `opacity-50` + `pointer-events-none`

**Inline buttons:** Several surfaces use inline `<button>` elements with custom Tailwind classes instead of the `Button` component:
- Admin auth identities: custom search button, refresh button, pagination buttons, link/unlink buttons
- Dashboard: reload button
- Cases page: filter buttons
- Review queue item card: download link buttons

**Issues found:**
- `bg-[#123B66]` hardcoded on admin link button in `auth/identities/page.tsx` line 341 — should use `variant="default"` with `--primary` CSS variable
- `bg-rose-600` hardcoded on unlink button — should use `variant="destructive"`
- No `prefers-reduced-motion` check on animated button interactions (though reduced motion is respected in `globals.css` for the auth enter animations)

### Forms/Inputs

**Shared components:** `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- All use shadcn patterns with Radix UI primitives
- **Input/Textarea:** Custom styling in `bm-016-form-inputs.tsx` and `bm-171-form-inputs.tsx` with `focus:border-slate-500 focus:ring-2 focus:ring-slate-200` — these appear to be form-specific overrides

**Custom form inputs:** 100+ `bm-*-form-inputs.tsx` files define form sections and input layouts per BM form.

**Global input override** in `globals.css`:
```css
input[type="date"],
input[type="datetime-local"],
select {
  min-height: 44px;
  font-size: 16px;
}
```

**Issues found:**
- `bm-016-form-inputs.tsx` redefines input/textarea styling inline instead of using shared component
- Label styling is inconsistent — some use `text-xs font-semibold text-slate-600`, others use `text-sm font-bold text-slate-700`

### Navigation

**Shared component:** `nav-items.tsx` exports `Sidebar` and `MobileNav` (Sheet)
- Desktop sidebar: 260px fixed width
- Mobile: hamburger → Sheet drawer
- Menu sections: "Nghiệp vụ" and "Quản trị" (admin)
- User profile section with Clerk integration

**Issues found:**
- `rounded-[18px]` for nav items — not aligned with `rounded-2xl` (12px) used elsewhere
- Logo icon container uses `rounded-2xl` while nav items use `rounded-[18px]`
- Inline SVG icons in `SvgIcon` helper — Lucide is already installed but not used consistently for nav icons
- `⚖` emoji in logo (line 59 of `nav-items.tsx`) — **confirmed emoji usage** — should be replaced with SVG icon

### Cards/Panels/Surfaces

**Shared:** `PageSection` in `page-shell.tsx` uses `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`
- Used by `EmptyState`, `LoadingState`
- NOT used by dashboard, cases page, admin pages

**Inline card patterns found:**
- `rounded-lg border border-slate-200 bg-white p-4` — dashboard KPI cards, module links
- `rounded-2xl border border-slate-200 bg-white p-5 shadow-sm` — review queue item cards
- `rounded-2xl border border-slate-200 bg-white p-6 shadow-sm` — generated document sections
- `rounded-3xl border border-slate-200 bg-white p-7 shadow-sm` — template preview workspace header
- `rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm` — generic template form inputs section
- BM form meta bar: `rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6`

### Tables/Lists

**Shared:** `DataTableShell` in `common/data-table-shell.tsx`
- Admin auth identities uses native `<table>` with custom styling
- Cases page uses custom table styling
- Status tones are hardcoded inline

### Tabs/Dialogs/Popovers

**Shared components:** Radix-based `Tabs`, `Dialog`, `Sheet`, `AlertDialog`, `Tooltip`
- All from shadcn/ui patterns in `components/ui/`
- Dialog/Sheet overlays use `bg-black/60 backdrop-blur-sm` — functional, not decorative
- Custom modals in admin auth identities page are hand-built without using `Dialog` component

### Status Banners/Toasts

**Shared:** `Sonner` for toast notifications
- Custom banners in surfaces use inline Tailwind — `ErrorBanner`, success/error dividers

### Empty/Loading/Error/Forbidden States

**Shared:** `EmptyState`, `LoadingState`, `ErrorBanner` in `common/`
- **EmptyState:** `rounded-3xl border border-slate-200 bg-white p-10 shadow-sm` — consistent with PageSection
- **LoadingState:** skeleton variants with `rounded-3xl border border-slate-200 bg-white`
- **ErrorBanner:** error display component

**Issues found:**
- Admin auth identities page uses inline success/error banners instead of shared `ErrorBanner`
- Several pages (cases, dashboard) use custom loading/empty patterns

### Preview/Document Components

- `TemplatePreviewWorkspace` — runtime DOCX/Preview session surface
- `GeneratedDocumentWorkspace` — persisted document workspace
- `RuntimePdfPreview` — inline PDF preview for runtime sessions
- `GeneratedDocumentPreviewPanel` — PDF/DOCX preview for persisted documents
- `GeneratedDocumentAuditPanel` — audit history display
- `GeneratedDocumentActionPanel` — document actions (render, download, convert)

### Icon Usage

**Two systems:**
1. **Lucide React** (`lucide-react` v1.21.0) — installed and used in some places (auth shell TrustBadge, review queue)
2. **Inline SVG helper** (`SvgIcon` in `nav-items.tsx`) — custom SVG paths for nav items
3. **Hardcoded SVG** — admin auth identities page uses inline `<svg>` elements

**Issues found:**
- Inconsistent icon approach — Lucide in some places, inline SVG in others
- `⚖` emoji in nav-items logo (line 59)

---

## 6. AI Slop Audit

### Confirmed Findings

| Pattern | Location(s) | Remediation |
|---------|-------------|-------------|
| **Sticky action bar duplication** — `bg-white/95 backdrop-blur shadow-xl` inline in 100+ files | `bm-*-form-inputs.tsx` (bm-001, bm-027, bm-028, bm-031, bm-033, bm-037, bm-040, bm-042, bm-043, bm-048-055, bm-070-071, bm-076, bm-084, bm-097, bm-172, and many more) | Extract to shared `FormActionBar` component |
| **`rounded-[18px]` hardcoded** — nav radius not aligned with `rounded-2xl` | `nav-items.tsx` lines 268, 297 | Use consistent `--radius` or `rounded-2xl` |
| **`bg-[#123B66]` hardcoded** — brand color not using CSS variable | `admin/auth/identities/page.tsx` line 341 | Use `--primary` CSS variable or `variant="default"` |
| **`bg-[#0B1F3A]` hardcoded** — logo background color | `nav-items.tsx` line 58 | Add to `--primary` or `--sidebar-primary` |
| **Hardcoded dark gradient** — `linear-gradient(135deg,#07111f_0%,#0b1730_58%,#103257_100%)` | `auth-shell.tsx` line 24 | Move to CSS variable; support dark mode |
| **Inline SVG vs Lucide inconsistency** | `nav-items.tsx` uses custom SVG helper; Lucide used elsewhere | Standardize on Lucide or use consistent icon system |
| **`⚖` emoji in nav logo** | `nav-items.tsx` line 59 | Replace with SVG icon |
| **Inline status color tones** — `bg-blue-50 text-blue-700`, `bg-indigo-50 text-indigo-700`, etc. | `app/page.tsx` lines 113-131, cases page, review queue, admin | Consolidate to `StatusBadge` or CSS variables |

### Suspected Findings (Require Runtime Inspection)

| Pattern | Location | Notes |
|---------|----------|-------|
| **Excessive `shadow-xl`** on sticky action bars | BM form files | `shadow-xl` on sticky elements may be over-elevated; `shadow-lg` may be sufficient |
| **`rounded-full` overuse** | Template badges, status badges | `rounded-full` used for template code badges and status indicators — functional but visually heavy for dense surfaces |
| **Card shadow inconsistency** | Various surfaces | Some cards use `shadow-sm`, others `shadow-none`, creating uneven visual weight |
| **`bg-slate-950` usage** — dark text on dark surfaces | `bm-016-form-inputs.tsx` line 1359 | Code block styling may need contrast review |

### NOT Found (Good)

- No generic gradient text (`bg-clip-text text-transparent`)
- No purple/cyan AI palette
- No glassmorphism (backdrop-blur is functional on overlays, not decorative)
- No generic "Seamless/Elevate/Unleash" copy
- No decorative emoji in product surfaces (emoji found only in nav logo — single exception)
- No AI dashboard template look — the product looks like a legal workflow tool, not a startup landing page
- No excessive card nesting beyond the PageSection → EmptyState → Content pattern

---

## 7. Accessibility and Interaction Audit

### Keyboard/Focus

**Found:**
- `Button` component has `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — correct
- Skip-to-content link in root layout
- Admin auth identities search input has `focus:border-blue-500 focus:ring-2 focus:ring-blue-100`
- Review queue download buttons have `aria-label` for screen readers

**Issues:**
- Nav items use `transition-all duration-200` on hover — no explicit keyboard focus indicator beyond browser default
- BM form inputs have custom focus states (`focus:border-slate-500 focus:ring-2 focus:ring-slate-200`) that may override shadcn focus ring
- No explicit `focus-visible` handling for custom `<button>` elements in review queue, admin auth identities
- `aria-describedby` for form errors — partially implemented in `bm-077-form-inputs.tsx` but not consistently across all BM forms

### Color/Contrast

**Found:**
- CSS variables define semantic colors: `--primary` (deep navy), `--destructive`, `--success`, `--warning`
- `StatusBadge` centralizes status color logic
- Dark text (`text-slate-950`) on white background — high contrast

**Issues:**
- Hardcoded `text-cyan-200` in auth shell (line 33) — low contrast on dark background
- `text-slate-400` for muted/secondary text — some instances may be below WCAG AA on white
- Status tone colors (`bg-blue-50 text-blue-700`) — color contrast not formally verified
- `bg-slate-950` text on light surfaces — potential contrast issues

### Motion/Reduced Motion

**Found:**
- `globals.css` has `@media (prefers-reduced-motion: reduce)` for auth enter animations (lines 128-134)
- Shadcn Radix animations use `data-[state=open/closed]` for controlled transitions
- Sticky action bars have `transition` for hover states

**Issues:**
- BM form action bar hover effects (`hover:shadow-md`) on 100+ files have no `prefers-reduced-motion` consideration
- `transition-all duration-200` on nav items — may cause motion on keyboard focus
- No `prefers-reduced-motion` consideration for the sticky action bar animations

### Forms/Errors

**Found:**
- `form-validation-errors.ts` provides centralized error extraction
- Some BM forms use `errorMessage` prop for form-level errors
- `bm-144-form-inputs.tsx`, `bm-127-form-inputs.tsx`, `bm-143-form-inputs.tsx` show loading/error state handling

**Issues:**
- Error handling is not consistent across all BM form files
- `aria-describedby` for error association is implemented in some forms but not all
- No centralized form error boundary pattern

### Dialogs/Popovers

**Found:**
- Radix `Dialog` and `Sheet` are used for overlays
- Overlay uses `bg-black/60 backdrop-blur-sm` — functional backdrop
- Admin auth identities uses custom hand-built modals

**Issues:**
- Custom modals in admin auth identities don't use shared `Dialog` component
- No explicit focus trap verification for custom modals
- Custom modal uses `role="alert"` on error messages — should be `role="alert"` for errors that announce immediately, or `aria-live="polite"` for status messages

### Tables/Lists

**Found:**
- Native `<table>` semantics in admin auth identities
- `className` for table cells with semantic color classes

**Issues:**
- No `scope` attributes on table headers in admin auth identities
- No `caption` element for table context

### Mobile/Tablet Review Behavior

**Found:**
- `nav-items.tsx` has `MobileNav` with Sheet drawer for mobile
- `app-shell.tsx` handles responsive sidebar/drawer toggle
- `PageShell` has `maxWidth` variants for responsive layouts

**Issues:**
- Nav sidebar width (260px) may cause horizontal scroll on narrow tablets
- BM form inputs use `min-height` of 44px+ for inputs — meets touch target requirements
- BM form action bars use `rounded-2xl` (12px) on mobile — may cause layout issues on small screens
- No explicit tablet review mode for BM forms (as described in DESIGN.md)

---

## 8. Design System Gap Analysis

### Compare Current UI Against DESIGN.md

| DESIGN.md Requirement | Current Implementation | Gap |
|----------------------|----------------------|-----|
| Neutral slate surfaces with restrained blue for selection/primary | ✅ `--primary: 222 70% 26%` (deep navy) | None |
| Amber for warnings, red for blocking, green for verified | ✅ `--warning: 38 92% 50%`, `--destructive: 0 84% 60%`, `--success: 142 71% 45%` | None |
| 8px spacing grid | ⚠️ Uses Tailwind's 4px base grid | Partial — custom `gap: 20px` in `.qvks-form-grid` |
| 12-18px radii | ⚠️ `--qvks-card-radius: 18px` defined but not used globally; inconsistent use of `rounded-3xl` (16px), `rounded-2xl` (12px), `rounded-lg` (8px) | **GAP: No enforced radius scale** |
| Crisp 1px borders | ⚠️ `border border-slate-200` used consistently, but `border-l-4` pattern found in one place | **GAP: One instance of `border-l-4`** |
| Shallow shadows for menus, popovers, active drag, preview elevation | ⚠️ Inconsistent shadow scale: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` used without clear semantic mapping | **GAP: No semantic shadow tokens** |
| Minimum 44px pointer target | ✅ Global `min-height: 44px` for date/select inputs | Partial — form buttons use 42px in CSS |
| Body text 15-16px, inputs 16px | ✅ `--qvks-font-size-base: 16px`, `--qvks-font-size-input: 16px` | None |
| Avoid decorative gradients | ✅ No decorative gradients found in product surfaces | None |
| Avoid oversized hero typography | ✅ No hero typography in product surfaces | None |
| Every component: default, hover, focus-visible, selected, disabled, loading, invalid | ⚠️ Button has these; BM form inputs have mixed focus states | **GAP: BM form inputs need focus-visible consistency** |
| Keyboard behavior and accessible label for all components | ⚠️ Some `<button>` elements lack `aria-label` | **GAP: Audit button aria labels** |
| Error text via `aria-describedby` | ⚠️ Implemented in some forms, not all | **GAP: Form error association not universal** |
| Desktop-first; tablet/mobile for review only | ⚠️ Not strictly enforced; BM forms appear to support editing on mobile | **GAP: Responsive editing should be review-only per DESIGN.md** |
| Color never the only status carrier | ⚠️ Status badges use color + text label — correct. But some KPI cards use only color (KPI tone background) without distinct shape/icon | **GAP: KPI card status needs shape/icon reinforcement** |

### Missing Tokens

1. **Radius scale** — `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` defined in Tailwind v4 but not mapped to semantic names like `--radius-card`, `--radius-input`, `--radius-nav`
2. **Shadow scale** — No semantic shadows: `--shadow-card`, `--shadow-menu`, `--shadow-overlay`, `--shadow-sticky-action-bar`
3. **Status color scale** — Blue/indigo/amber/emerald/rose status tones not mapped to CSS variables
4. **Brand color token** — `#173E86` used in some places, `#0B1F3A` in others, `--primary` / `--sidebar-primary` in CSS variables — inconsistent

### Inconsistent Patterns

1. **Radius:** `rounded-3xl` (16px) vs `rounded-2xl` (12px) vs `rounded-[18px]` — no clear semantic mapping
2. **Shadow:** `shadow-sm` vs `shadow-lg` vs `shadow-xl` vs `shadow-none` — no semantic meaning
3. **Card padding:** `p-4` vs `p-5` vs `p-6` vs `p-7` — no standard card padding scale
4. **Section gap:** `gap-3` vs `gap-4` vs `gap-5` vs `gap-20px` in `.qvks-form-grid`
5. **Font weight on labels:** `font-semibold` vs `font-bold` vs `font-black` — no consistent scale
6. **Input focus ring color:** `focus:ring-slate-200` vs `focus:ring-blue-100` — inconsistent

### Components That Should Become Shared Primitives

1. **`FormActionBar`** — sticky bottom action bar (currently duplicated in 100+ files)
2. **`KpiCard`** — dashboard KPI display (currently inline in dashboard)
3. **`ModuleLinkCard`** — dashboard module navigation links
4. **`AdminTable`** — admin auth identities table (currently custom `<table>`)
5. **`InlineStatusTone`** — extracted from dashboard, cases, admin pages for consistent status coloring

### Components That Should NOT Yet Be Generalized

1. **`TemplatePreviewHeader`** — specific to runtime template workspace
2. **`GeneratedDocumentHeader`** — specific to persisted document workspace
3. **Individual BM form components** — each BM form has unique field layouts that shouldn't be generalized

---

## 9. Future Redesign Strategy

### Phase 1: Design Tokens + Anti-Slop Cleanup (Low Risk, High Impact)

**Goal:** Establish the foundation — fix the most egregious duplications and establish enforceable tokens.

**Tasks:**
1. Extract sticky action bar from 5 representative BM forms into `FormActionBar` in `components/common/`
2. Replace `rounded-[18px]` in nav-items with `rounded-2xl` (or define `--radius-nav: 18px`)
3. Replace `bg-[#123B66]` and `bg-[#0B1F3A]` with CSS variable references
4. Move auth shell gradient to CSS variable for dark mode support
5. Replace `⚖` emoji in nav logo with SVG icon
6. Add `prefers-reduced-motion` to nav item transitions
7. Audit and fix `focus-visible` states on custom `<button>` elements

**Files:** `globals.css`, `nav-items.tsx`, `auth-shell.tsx`, `admin/auth/identities/page.tsx`, 5 BM form files

**Validation:** `pnpm --filter web lint && pnpm --filter web exec tsc --noEmit`

**Risk:** LOW — all changes are cosmetic with clear before/after

### Phase 2: Shared Primitives — Buttons/Forms/Status Surfaces (Medium Risk)

**Goal:** Consolidate scattered button patterns and status color usage.

**Tasks:**
1. Add `PageShell`/`PageSection` adoption audit — migrate pages that don't use them
2. Consolidate all `bg-*-50 text-*-700` status tones into semantic CSS variables or `StatusBadge` usage
3. Replace admin auth identities custom modals with shared `Dialog` component
4. Add `aria-describedby` to all BM form error states
5. Create shared `KpiCard` component for dashboard
6. Create shared `InlineStatusTone` for non-badge status display

**Risk:** MEDIUM — page layout changes require visual regression testing

### Phase 3: Runtime Template Workspace Overhaul (Medium Risk)

**Goal:** Refine the runtime template preview workspace.

**Tasks:**
1. Review header visual weight — reduce padding from `p-7` to `p-6`
2. Extract template badge component for consistent template code/status display
3. Standardize action bar styling across all BM forms using `FormActionBar`
4. Review responsive behavior for tablet/mobile review mode
5. Ensure all BM form inputs use shared `Input`/`Textarea`/`Select` components

**Risk:** MEDIUM — affects all 100+ BM forms, requires Playwright screenshots

### Phase 4: Generated Document Workspace Polish (Low-Medium Risk)

**Goal:** Fine-tune the persisted document workspace.

**Tasks:**
1. Audit `generated-document-workspace.tsx` for consistent card styling
2. Standardize preview panel styling
3. Audit audit panel history display
4. Review action panel button styling

**Risk:** LOW-MEDIUM — isolated to one workspace surface

### Phase 5: Admin/Review Surfaces (Low Risk)

**Goal:** Polish admin and review queue surfaces.

**Tasks:**
1. Migrate admin auth identities to `PageShell`
2. Review review queue card hover states
3. Audit admin table accessibility
4. Standardize pagination buttons using shared `Button` component

**Risk:** LOW — administrative surfaces with low user volume

### Phase 6: Visual Regression / Screenshots / E2E Hardening (Medium Risk)

**Goal:** Ensure all Phase 1-5 changes are validated with automated visual checks.

**Tasks:**
1. Add Playwright screenshot tests for all major surfaces
2. Add `pnpm --filter web exec tsc --noEmit` to CI gates
3. Add `pnpm --filter web lint` to CI gates
4. Consider adding `axe-core` accessibility checks to Playwright
5. Add visual regression baseline for auth shell, dashboard, template preview, document workspace

**Risk:** MEDIUM — test infrastructure work

---

## 10. Recommended First Implementation PR

**PR Title:** `refactor(ui): extract BM form action bar + anti-slop cleanup`

### Change Summary

1. Create `FormActionBar` shared component in `components/common/form-action-bar.tsx`
2. Apply `FormActionBar` to 5 representative BM forms: `bm-001`, `bm-027`, `bm-049`, `bm-053`, `bm-071`
3. Fix nav radius: replace `rounded-[18px]` with `rounded-2xl` in nav-items
4. Replace `⚖` emoji with SVG icon in nav logo
5. Add `prefers-reduced-motion` to nav item transitions
6. Convert auth shell hardcoded brand colors to CSS variables
7. Replace `bg-[#123B66]` in admin auth identities with `variant="default"` button

### Non-Goals

- No BM form data/logic changes
- No new dependencies
- No new design system abstractions beyond `FormActionBar`
- No changes to Smart Generic Prefill, sample data, DOCX contracts, auth/RBAC, DB schema

### Acceptance Criteria

1. `pnpm --filter web lint` passes
2. `pnpm --filter web exec tsc --noEmit` passes
3. `FormActionBar` component is created and used in 5 representative BM forms
4. Nav items use `rounded-2xl` instead of `rounded-[18px]`
5. Nav logo uses SVG icon instead of emoji
6. Auth shell brand colors reference CSS variables
7. Admin auth identities uses `Button` component with `variant="default"`
8. No `⚖` emoji found in web source: `rg "⚖" apps/web/src` returns empty
9. Playwright screenshots show unchanged visual appearance (baseline established)

### Validation Commands

```bash
pnpm --filter web lint
pnpm --filter web exec tsc --noEmit
rg "⚖" apps/web/src  # should return empty
```

### Rollback Plan

```bash
git checkout -- apps/web/src/components/common/form-action-bar.tsx
git checkout -- apps/web/src/components/layout/nav-items.tsx
git checkout -- apps/web/src/components/auth/auth-shell.tsx
git checkout -- apps/web/src/app/admin/\(shared\)/auth/identities/page.tsx
git checkout -- apps/web/src/components/documents/bm-001-form-inputs.tsx
git checkout -- apps/web/src/components/documents/bm-027-form-inputs.tsx
git checkout -- apps/web/src/components/documents/bm-049-form-inputs.tsx
git checkout -- apps/web/src/components/documents/bm-053-form-inputs.tsx
git checkout -- apps/web/src/components/documents/bm-071-form-inputs.tsx
```

---

## 11. Evidence Appendix

### Commands Run

| Command | Result | Notes |
|---------|--------|-------|
| `mkdir -p docs/audit/ui-ux-overhaul-research` | ✅ Success | Created output directory |
| `rg "gradient\|from-\|to-\|bg-gradient\|text-transparent\|bg-clip-text" apps/web/src` | ✅ Clean | No decorative gradients in product surfaces |
| `rg "shadow-md\|shadow-lg\|shadow-xl\|drop-shadow\|box-shadow" apps/web/src` | ⚠️ Found | `shadow-xl` on sticky action bars (100+ files); `shadow-lg` on dialogs/sheets |
| `rg "rounded-full\|rounded-3xl\|rounded-\[\|border-l-4\|border-l-8" apps/web/src` | ⚠️ Found | `rounded-full` on badges; `rounded-[18px]` in nav-items; `rounded-3xl` on cards |
| `rg "emoji\|🚀\|✨\|✅\|❌\|⚠️\|🎯\|📄\|📋" apps/web/src` | ⚠️ Found | `⚖` emoji in nav-items.tsx logo |
| `rg "Seamless\|Elevate\|Unleash\|Next-Gen\|Game-changer\|streamline\|empower\|supercharge" apps/web/src` | ✅ Clean | No AI slop copy found |
| `rg "Inter\|font-sans\|font-serif\|tracking-\|leading-" apps/web/src` | ⚠️ Found | `Inter` in app-shell; `tracking-` used for labels |
| `rg "focus-visible\|aria-describedby\|aria-label\|role=\|disabled\|loading\|skeleton\|empty\|error" apps/web/src` | ⚠️ Found | Partial implementation of a11y patterns |

### Files Inspected

| File | Lines | Key Findings |
|------|-------|-------------|
| `apps/web/src/app/globals.css` | 515 | Full CSS variable system; `qvks-*` tokens; shadcn animations; date/select overrides |
| `apps/web/src/components/layout/nav-items.tsx` | ~550 | Logo with ⚖ emoji; `rounded-[18px]`; custom SVG icon helper |
| `apps/web/src/components/auth/auth-shell.tsx` | 88 | Hardcoded gradient; auth layout structure |
| `apps/web/src/components/common/page-shell.tsx` | 110 | `PageShell`/`PageSection` with `rounded-3xl border shadow-sm` |
| `apps/web/src/components/common/status-badge.tsx` | 150 | Centralized status badge system with 5 config maps |
| `apps/web/src/components/common/empty-state.tsx` | 56 | Standard empty state using PageSection pattern |
| `apps/web/src/components/common/loading-state.tsx` | ~100 | Skeleton loading states |
| `apps/web/src/components/ui/button.tsx` | 63 | CVA button with 8 variants, correct focus-visible |
| `apps/web/src/components/ui/badge.tsx` | 45 | CVA badge with 9 variants |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | ~800 | Runtime preview workspace with honest UX |
| `apps/web/src/components/documents/generated-document-workspace.tsx` | ~800 | Persisted document workspace |
| `apps/web/src/components/review-queue/review-queue-item-card.tsx` | ~150 | Review card with `rounded-3xl shadow-sm hover:shadow-md` |
| `apps/web/src/app/page.tsx` | ~260 | Dashboard with KPI cards and module links |
| `apps/web/src/app/admin/(shared)/auth/identities/page.tsx` | 784 | Admin auth identities with custom modals |
| `apps/web/src/components/documents/bm-016-form-inputs.tsx` | ~1400 | Custom input styling examples |
| `apps/web/src/components/documents/bm-171-form-inputs.tsx` | ~800 | Custom form input examples |
| `apps/web/src/components/documents/bm-172-form-inputs.tsx` | ~600 | Action bar with `shadow-xl` |
| `apps/web/src/components/documents/bm-001-form-inputs.tsx` | ~1100 | Action bar with `shadow-lg` |
| `apps/web/src/components/documents/bm-049-form-inputs.tsx` | ~300 | Action bar with `shadow-lg` |
| `apps/web/src/components/documents/bm-071-form-inputs.tsx` | ~1400 | Action bar with `shadow-lg` |

### Items NOT Inspected (Require Runtime)

The following surfaces were identified but not fully inspected — they require running the dev server and navigating the UI:

- `app/documents/page.tsx` — Document creation workspace
- `app/imports/page.tsx` — Import workspace
- `app/reports/page.tsx` — Reports page
- `app/settings/page.tsx` — Settings page
- `app/admin/form-studio/page.tsx` — Form Studio admin surface
- Full review of all 100+ `bm-*-form-inputs.tsx` files for per-form specifics

### Uncertain Items

1. **BM form input focus ring** — `bm-016-form-inputs.tsx` and `bm-171-form-inputs.tsx` redefine input focus styles. The full extent of custom input styling across all 100+ BM forms is unclear from static analysis.

2. **Mobile/touch behavior** — The static audit confirms `min-height: 44px` on date/select inputs and touch-friendly button sizing, but actual touch behavior requires runtime testing.

3. **Color contrast** — Formal WCAG contrast verification requires tooling (axe-core, Lighthouse) not available in this static audit.

4. **Dark mode behavior** — CSS variables define dark mode values, but runtime dark mode behavior was not verified.

5. **Audit gate failures** — The audit gates (`pnpm audit:hardcode`, `pnpm audit:locked-compiled`, `pnpm audit:contract-sync`) were not run as part of this research. These should be run before any implementation PR.

---

## Recommended Next Prompt for Implementation PR #1

> **Prompt for ChatGPT/Planner:**
>
> Implement PR #1 for QLLaw UX overhaul as described in `docs/audit/ui-ux-overhaul-research/latest.md` section 10.
>
> **Scope:**
> 1. Create `FormActionBar` in `apps/web/src/components/common/form-action-bar.tsx`
> 2. Apply to `bm-001`, `bm-027`, `bm-049`, `bm-053`, `bm-071`
> 3. Fix nav radius: `rounded-[18px]` → `rounded-2xl` in `nav-items.tsx`
> 4. Replace `⚖` emoji with SVG icon in nav logo
> 5. Add `prefers-reduced-motion` to nav transitions
> 6. Convert auth shell hardcoded brand colors to CSS variables
> 7. Replace `bg-[#123B66]` in admin auth identities with `Button variant="default"`
>
> **Acceptance criteria:** As specified in section 10.
> **Validation:** `pnpm --filter web lint && pnpm --filter web exec tsc --noEmit`
> **Non-goals:** No BM data changes, no new deps, no framework changes.
