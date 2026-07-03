# QLLaw UI Inventory

**Audit Date:** 2026-07-03
**Purpose:** Comprehensive inventory of all UI primitives, patterns, and components

---

## 1. Buttons / Actions

### Shared Component: `Button`
**File:** `apps/web/src/components/ui/button.tsx`
**Type:** CVA (class-variance-authority)

**Variants:**
| Variant | CSS | Use Case |
|---------|-----|---------|
| `default` | `bg-primary text-primary-foreground shadow hover:bg-primary/90` | Primary actions |
| `destructive` | `bg-destructive text-destructive-foreground shadow-sm` | Destructive actions |
| `outline` | `border border-input bg-background shadow-sm` | Secondary actions |
| `secondary` | `bg-secondary text-secondary-foreground shadow-sm` | Less prominent actions |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | Tertiary actions |
| `link` | `text-primary underline-offset-4 hover:underline` | Text links |
| `success` | `bg-success text-success-foreground shadow-sm` | Success confirmations |
| `warning` | `bg-warning text-warning-foreground shadow-sm` | Warning actions |

**Sizes:**
| Size | CSS | Use Case |
|------|-----|---------|
| `default` | `h-10 px-4 py-2` | Standard button |
| `sm` | `h-9 rounded-md px-3` | Small actions |
| `lg` | `h-11 rounded-lg px-8` | Prominent actions |
| `icon` | `h-10 w-10` | Icon-only button |
| `icon-sm` | `h-9 w-9` | Small icon button |

**State Handling:**
- `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — correct
- `disabled:pointer-events-none disabled:opacity-50` — correct
- All variants support disabled state

### Inline Buttons (Non-Button Component)

| Location | Pattern | Issue |
|----------|---------|-------|
| `admin/auth/identities/page.tsx:341` | `bg-[#123B66]` | Hardcoded color — should use `variant="default"` |
| `admin/auth/identities/page.tsx:462` | `bg-rose-600` | Hardcoded color — should use `variant="destructive"` |
| `admin/auth/identities/page.tsx` | Refresh, pagination buttons | Custom inline `<button>` — should use `Button` component |
| `app/page.tsx:173` | Dashboard reload button | Custom inline `<button>` |
| `app/cases/page.tsx` | Filter buttons | Custom inline `<button>` |
| `review-queue-item-card.tsx:80` | Download link button | Custom `<button>` with `aria-label` — functional |

---

## 2. Form Inputs / Selects / Textareas

### Shared Components

| Component | File | Base Styles |
|----------|-------|-------------|
| `Input` | `components/ui/input.tsx` | shadcn pattern |
| `Textarea` | `components/ui/textarea.tsx` | shadcn pattern |
| `Select` | `components/ui/select.tsx` | Radix Select with shadcn styling |
| `Checkbox` | `components/ui/checkbox.tsx` | Radix Checkbox |
| `RadioGroup` | `components/ui/radio-group.tsx` | Radix RadioGroup |
| `Switch` | `components/ui/switch.tsx` | Radix Switch |

### Global Overrides (globals.css)
```css
input[type="date"],
input[type="datetime-local"],
select {
  min-height: 44px;
  font-size: 16px;
}
```

### Custom Input Patterns Found

| File | Pattern | Issue |
|------|---------|-------|
| `bm-016-form-inputs.tsx:95` | Custom input with `focus:border-slate-500 focus:ring-2 focus:ring-slate-200` | Redefines input styling inline |
| `bm-016-form-inputs.tsx:98` | Custom textarea with same pattern | Redefines textarea styling inline |
| `bm-171-form-inputs.tsx:602` | Custom textarea with `focus:border-slate-500 focus:ring-2 focus:ring-slate-200` | Custom focus states |
| `bm-171-form-inputs.tsx:609` | Custom select with same pattern | Custom focus states |
| `admin/auth/identities/page.tsx:247` | Search input with `focus:border-blue-500 focus:ring-2 focus:ring-blue-100` | Custom focus ring color |

### Label Styling Inconsistency

| File | Label Pattern |
|------|--------------|
| `bm-016-form-inputs.tsx:100` | `text-xs font-semibold text-slate-600` |
| `bm-171-form-inputs.tsx:633` | `text-sm font-semibold text-slate-800` |
| `admin/auth/identities/page.tsx:233` | `text-sm font-bold text-slate-700` |

---

## 3. Navigation

### Shared Component: `NavItems`
**File:** `apps/web/src/components/layout/nav-items.tsx`
**Exports:** `Sidebar`, `MobileNav`

### Structure
```
QUANLYVKS Logo (⚖ emoji + brand name)
  ├─ Section: Nghiệp vụ
  │   ├─ Tổng quan (/)
  │   ├─ Hồ sơ vụ án (/cases)
  │   ├─ Tạo biểu mẫu (/documents)
  │   ├─ Duyệt biểu mẫu (/templates)
  │   ├─ Import dữ liệu (/imports)
  │   ├─ Báo cáo (/reports)
  │   └─ Cấu hình (/settings)
  └─ Section: Quản trị (conditional)
      ├─ Form Studio (/admin/form-studio) — admin only
      └─ Liên kết tài khoản (/admin/auth/identities) — admin only
User Profile (Clerk user info)
```

### Visual Issues Found

| Issue | Location | Severity |
|-------|----------|----------|
| `⚖` emoji in logo | `nav-items.tsx:59` | HIGH — emoji in nav |
| `rounded-[18px]` on nav items | `nav-items.tsx:268, 297` | MEDIUM — inconsistent radius |
| `rounded-2xl` on logo container | `nav-items.tsx:58` | LOW — radius mismatch with nav items |
| Custom `SvgIcon` helper | `nav-items.tsx:21-36` | MEDIUM — Lucide is installed but not used |
| `bg-[#0B1F3A]` hardcoded | `nav-items.tsx:58` | MEDIUM — brand color not using CSS variable |
| `transition-all duration-200` | `nav-items.tsx:268, 297` | LOW — no prefers-reduced-motion |

---

## 4. Cards / Panels / Surfaces

### Canonical Pattern: PageSection
**File:** `common/page-shell.tsx`
```css
rounded-3xl border border-slate-200 bg-white p-6 shadow-sm
```

### Surface Patterns Found

| Pattern | Radius | Border | Shadow | Padding | Used In |
|--------|--------|--------|--------|---------|---------|
| `rounded-3xl border shadow-sm` | 16px | slate-200 | shadow-sm | p-6 | PageSection, EmptyState, LoadingState, TemplatePreviewWorkspace header |
| `rounded-2xl border shadow-sm` | 12px | slate-200 | shadow-sm | p-5 | ReviewQueueItemCard |
| `rounded-2xl border shadow-lg` | 12px | slate-200 | shadow-lg | p-5 | BM form meta bar |
| `rounded-2xl border shadow-xl` | 12px | slate-200 | shadow-xl | p-3 | BM form sticky action bar |
| `rounded-lg border` | 8px | slate-200 | none | p-4 | Dashboard KPI cards, module links |
| `rounded-3xl bg-slate-50 shadow-sm` | 16px | slate-200 | shadow-sm | p-5 | GenericTemplateFormInputs section |

### Card Padding Inconsistency

| Padding | Components |
|---------|------------|
| `p-4` | Dashboard KPI cards, module links |
| `p-5` | Review queue item cards |
| `p-6` | PageSection, EmptyState |
| `p-7` | Template preview workspace header |
| `p-3` | Sticky action bars |

---

## 5. Tables / Lists

### Shared Component: `DataTableShell`
**File:** `common/data-table-shell.tsx`

### Custom Tables Found

| Location | Pattern | Issue |
|----------|---------|-------|
| `admin/auth/identities/page.tsx` | Native `<table>` | No `scope` on headers; no `<caption>` |
| `app/cases/page.tsx` | Custom table styling | Hardcoded status tones |

---

## 6. Tabs / Dialogs / Popovers / Sheets

### Shared Components

| Component | File | Notes |
|----------|------|-------|
| `Dialog` | `components/ui/dialog.tsx` | Radix Dialog, `shadow-lg`, `rounded-xl` |
| `Sheet` | `components/ui/sheet.tsx` | Mobile nav drawer |
| `AlertDialog` | `components/ui/alert-dialog.tsx` | Confirmation dialogs |
| `Tooltip` | `components/ui/tooltip.tsx` | Radix Tooltip |
| `Tabs` | `components/ui/tabs.tsx` | Radix Tabs |

### Overlay Pattern
```css
bg-black/60 backdrop-blur-sm
```
Functional backdrop — acceptable.

### Custom Dialogs Found

| Location | Pattern | Issue |
|----------|---------|-------|
| `admin/auth/identities/page.tsx:200` | Hand-built modal with `bg-black/40` | Not using shared `Dialog` component |
| `admin/auth/identities/page.tsx:388` | Hand-built unlink modal | Not using shared `Dialog` component |

---

## 7. Status Banners / Toasts

### Shared Component: `Sonner`
**File:** `components/ui/sonner.tsx`
Toast notifications.

### Custom Banners Found

| Location | Pattern | Issue |
|----------|---------|-------|
| `common/error-banner.tsx` | ErrorBanner component | Correct — shared |
| `admin/auth/identities/page.tsx:592` | Inline success banner | Not using shared component |
| `admin/auth/identities/page.tsx:599` | Inline error banner | Not using shared component |

---

## 8. Empty / Loading / Error / Forbidden States

### Shared Components

| Component | File | Pattern |
|----------|------|---------|
| `EmptyState` | `common/empty-state.tsx` | `rounded-3xl border shadow-sm p-10` |
| `LoadingState` | `common/loading-state.tsx` | Skeleton with `rounded-3xl border shadow-sm` |
| `ErrorBanner` | `common/error-banner.tsx` | Error display component |

### Usage Issues

| Location | Issue |
|----------|-------|
| `app/page.tsx:234` | Custom empty message — should use `EmptyState` |
| `admin/auth/identities/page.tsx:647` | Custom loading/empty in table — partially OK |
| `cases/page.tsx` | Custom loading patterns |

---

## 9. Preview / Document Components

### Core Components

| Component | File | Purpose |
|----------|------|---------|
| `TemplatePreviewWorkspace` | `documents/template-preview-workspace.tsx` | Runtime DOCX/Preview session |
| `GeneratedDocumentWorkspace` | `documents/generated-document-workspace.tsx` | Persisted document workspace |
| `RuntimePdfPreview` | `documents/runtime-pdf-preview.tsx` | Inline PDF preview |
| `GeneratedDocumentPreviewPanel` | `documents/generated-document-preview-panel.tsx` | PDF/DOCX preview |
| `GeneratedDocumentAuditPanel` | `documents/generated-document-audit-panel.tsx` | Audit history |
| `GeneratedDocumentActionPanel` | `documents/generated-document-action-panel.tsx` | Document actions |

### Visual Observations

| Component | Pattern | Issue |
|-----------|---------|-------|
| `TemplatePreviewWorkspace` header | `rounded-3xl border bg-white p-7 shadow-sm` | Large padding; use consistent with PageSection |
| `GeneratedDocumentWorkspace` | `rounded-2xl border bg-white p-6 shadow-sm` | Consistent with PageSection |
| `RuntimePdfPreview` | Custom with `uppercase tracking-wide` | Consistent typography |

---

## 10. Icon Usage

### Two Systems Found

| System | Locations | Status |
|--------|-----------|--------|
| `lucide-react` | Auth shell TrustBadge, review queue | Installed v1.21.0 |
| Custom `SvgIcon` helper | `nav-items.tsx` | Inline SVG paths |
| Hardcoded `<svg>` | `admin/auth/identities/page.tsx` | Inline SVGs |

### Issue: Icon Inconsistency

The project has `lucide-react` installed but uses custom inline SVGs in:
- `nav-items.tsx` — nav menu icons
- `admin/auth/identities/page.tsx` — refresh, search, link, unlink icons
- `review-queue-item-card.tsx` — download icon (hardcoded SVG)

### Recommended: Standardize on Lucide

Lucide is already installed. The `SvgIcon` helper and hardcoded SVGs should be replaced with Lucide components.

---

## 11. Status Badge System

### Centralized Component: `StatusBadge`
**File:** `common/status-badge.tsx`

### Config Maps

| Type | Config | Variants |
|------|--------|----------|
| `review` | 8 statuses | `default/secondary/destructive/success/warning/muted/outline/blue/violet` |
| `case` | 7 statuses | `default/secondary/destructive/success/warning/muted/outline` |
| `priority` | 4 priorities | `muted/default/warning/destructive` |
| `formAuthoring` | 7 statuses | `muted/warning/success/default/outline` |
| `formRuntime` | 6 statuses | `success/default/warning/muted/destructive` |

### Badge Component: `Badge`
**File:** `components/ui/badge.tsx`
CVA with 9 variants including `blue` and `violet`.

### Hardcoded Status Patterns (Not Using StatusBadge)

| Location | Pattern |
|----------|---------|
| `app/page.tsx:189` | `bg-blue-50 text-blue-700` inline on KPI |
| `app/page.tsx:295` | `bg-indigo-50 text-indigo-700` inline on cases |
| `app/page.tsx:300` | Priority tone inline |
| `cases/page.tsx:295` | Status tone inline |
| `case-detail-workspace.tsx:222` | Case status inline |
| `generated-document-audit-panel.tsx:72` | Event type icons |

---

## 12. Shared Component Inventory

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| `Button` | `ui/button.tsx` | 63 | CVA, correct focus-visible |
| `Badge` | `ui/badge.tsx` | 45 | CVA, 9 variants |
| `Input` | `ui/input.tsx` | — | shadcn |
| `Textarea` | `ui/textarea.tsx` | — | shadcn |
| `Select` | `ui/select.tsx` | — | Radix |
| `Checkbox` | `ui/checkbox.tsx` | — | Radix |
| `RadioGroup` | `ui/radio-group.tsx` | — | Radix |
| `Switch` | `ui/switch.tsx` | — | Radix |
| `Dialog` | `ui/dialog.tsx` | — | Radix |
| `Sheet` | `ui/sheet.tsx` | — | Radix |
| `AlertDialog` | `ui/alert-dialog.tsx` | — | Radix |
| `Tooltip` | `ui/tooltip.tsx` | — | Radix |
| `Tabs` | `ui/tabs.tsx` | — | Radix |
| `Separator` | `ui/separator.tsx` | — | Radix |
| `ScrollArea` | `ui/scroll-area.tsx` | — | Radix |
| `Skeleton` | `ui/skeleton.tsx` | — | shadcn |
| `Sonner` | `ui/sonner.tsx` | — | toaster |
| `Avatar` | `ui/avatar.tsx` | — | Radix |
| `Label` | `ui/label.tsx` | — | Radix |
| `Progress` | `ui/progress.tsx` | — | Radix |
| `PageShell` | `common/page-shell.tsx` | 110 | Underused |
| `PageHeader` | `common/page-shell.tsx` | 110 | Underused |
| `PageSection` | `common/page-shell.tsx` | 110 | Underused |
| `PageActions` | `common/page-shell.tsx` | 110 | Underused |
| `StatusBadge` | `common/status-badge.tsx` | 150 | Centralized |
| `EmptyState` | `common/empty-state.tsx` | 56 | Shared |
| `LoadingState` | `common/loading-state.tsx` | ~100 | Shared |
| `ErrorBanner` | `common/error-banner.tsx` | — | Shared |
| `ConfirmDialog` | `common/confirm-dialog.tsx` | — | Shared |
| `DataTableShell` | `common/data-table-shell.tsx` | — | Shared |
| `Field` | `common/field.tsx` | — | Shared |
| `AppShell` | `layout/app-shell.tsx` | — | Layout |
| `Sidebar` | `layout/nav-items.tsx` | ~550 | Layout |
| `Topbar` | `layout/topbar.tsx` | — | Layout |
| `AuthGate` | `auth/auth-gate.tsx` | — | Auth |
| `AuthShell` | `auth/auth-shell.tsx` | 88 | Auth |
