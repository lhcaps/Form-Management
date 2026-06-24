# Component Library — QUANLYVKS

Internal design system built on shadcn/ui for the QUANLYVKS frontend.

## Design Goals

- **Professional legal/government admin UI** — dense enough for nghiệp vụ, readable for senior users
- **Restrained aesthetic** — no decorative noise, no generic SaaS dashboard look
- **Vietnamese-first** — text sizing and spacing tuned for Vietnamese language legibility
- **Predictable** — same components behave the same way across all pages
- **Accessible** — keyboard nav, ARIA labels, focus rings, sufficient color contrast

## Structure

```
src/components/
  ui/          # shadcn primitives (button, dialog, select, etc.)
  common/       # QUANLYVKS wrappers (PageShell, StatusBadge, ErrorBanner, etc.)
  layout/      # Sidebar, Topbar, AppShell
  documents/    # BM form inputs, generated document workspace
```

## Components

### `ui/` — shadcn Primitives

Use these directly when you need a primitive. Prefer `common/` wrappers when available.

| Component | When to use |
|---|---|
| `Button` | All clickable actions |
| `Input` | Text, number, email fields |
| `Label` | Form field labels |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown selection |
| `Card` | Card containers |
| `Badge` | Status indicators (prefer `StatusBadge` for domain types) |
| `Alert` | Inline alerts (prefer `ErrorBanner` for errors) |
| `Dialog` | Modal overlays |
| `AlertDialog` | Confirm/cancel modals |
| `Sheet` | Mobile drawer, side panel |
| `DropdownMenu` | Context menus |
| `Separator` | Visual dividers |
| `Skeleton` | Loading placeholders (prefer `LoadingState`) |
| `Table` | Data tables |
| `Tabs` | Tabbed interfaces |
| `Tooltip` | Hover tooltips |
| `Sonner` | Toast notifications |
| `Checkbox` | Boolean checkboxes |
| `RadioGroup` | Single-choice radio groups |
| `Switch` | Toggle switches |
| `ScrollArea` | Custom scroll containers |

### `common/` — QUANLYVKS Wrappers

These are built on top of `ui/` and carry domain knowledge.

| Component | Purpose |
|---|---|
| `PageShell` | Page layout container — use in Phase 3 migration |
| `PageHeader` | Header inside PageShell |
| `PageSection` | Card-like section wrapper |
| `PageActions` | Action buttons in header |
| `StatusBadge` | Domain status (case, review, form authoring, etc.) |
| `ErrorBanner` | Structured API error display |
| `EmptyState` | Empty list/search result |
| `LoadingState` | Loading placeholders |
| `ConfirmDialog` | Confirm/cancel modal |
| `Field` | Label + control + description + error wrapper |
| `DataTableShell` | Table wrapper with empty/loading states |

## Token Rules

### Spacing

Use Tailwind standard spacing (`gap-2`, `p-4`, `space-y-4`) — do not invent new spacing scales.

### Border Radius

- Default shadcn radius: `0.5rem` (8px) — use `rounded-lg`
- Senior-friendly document inputs: `rounded-xl` (12px) via `.qvks-document-workspace`
- Buttons: `rounded-lg` (inherits from Button component)

### Typography

- **Base**: 16px (html font-size)
- **Senior-friendly label**: 15px (in document workspace)
- **Senior-friendly input**: 16px (in document workspace)
- Headings: use Tailwind `text-*` scale. Do not invent arbitrary font sizes.

### Status Colors

| Semantic meaning | shadcn token |
|---|---|
| Destructive / error | `--destructive` → red |
| Success / approved | `--success` → emerald |
| Warning / pending | `--warning` → amber |
| Default / neutral | `--primary` → deep navy |
| Muted / disabled | `--muted` → slate |

## Accessibility Rules

1. Every interactive element must have a visible focus ring (`focus-visible:ring-2`)
2. All icons used as interactive triggers need `aria-label`
3. All dialogs/modals need proper `role`, `aria-modal`, and focus trap
4. Color alone must not convey meaning — use labels/icons alongside color
5. Minimum touch target: 44x44px for mobile
6. Contrast ratio: 4.5:1 minimum for body text, 3:1 for large text

## API Error Display

Use `ErrorBanner` for structured API errors (from `ApiError`):

```tsx
import { ErrorBanner } from "@/components/common/error-banner";
import { ApiError } from "@/lib/api-client";

// In your component:
try {
  await fetchSomething();
} catch (err) {
  if (err instanceof ApiError) {
    setError(err);
  }
}

{error && <ErrorBanner error={error} />}
```

`ErrorBanner` shows:
- Title (optional, defaults to "Lỗi")
- `ApiError.message` — user-facing message
- `ApiError.code` — semantic error code (small, muted)
- `ApiError.requestId` — traceable ID (small, muted)

## Responsive Rules

- **Mobile**: < 768px — single column, touch targets 44px min
- **Tablet**: 768px–1024px — 2 columns where appropriate
- **Desktop**: > 1024px — full layout

Sidebar is `hidden lg:flex` — mobile navigation (Sheet-based) will be added in Phase 3.

## When to Use shadcn vs Custom

**Use shadcn (`ui/`) when:**
- The component is a standard HTML primitive (button, input, dialog)
- Radix accessibility behavior is needed

**Use `common/` when:**
- The component has QUANLYVKS domain knowledge (StatusBadge, ErrorBanner)
- The component has consistent Vietnamese labels/behavior

**Write custom when:**
- shadcn + common don't cover the use case
- The component is highly domain-specific (BM form inputs, document workspace)

## Phase Boundaries

| Phase | Scope |
|---|---|
| Phase 1 | API cleanup — completed |
| Phase 2 | Design system infrastructure — this doc |
| Phase 3 | Layout polish — PageShell migration, mobile nav |
| Phase 4 | UX nghiệp vụ — Form Studio, review queue, case detail |

## Migration Checklist (Phase 3)

- [ ] Replace `<main className="min-h-screen bg-slate-50 px-6 py-8">` with `<PageShell>`
- [ ] Add `ErrorBanner` to pages that do API calls
- [ ] Replace inline `statusTone()` calls with `StatusBadge`
- [ ] Replace `window.confirm` / `window.prompt` with `ConfirmDialog`
- [ ] Add mobile nav (Sheet-based sidebar on small screens)
- [ ] Add `DataTableShell` to list pages
