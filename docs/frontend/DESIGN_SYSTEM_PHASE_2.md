# Design System — Phase 2

Internal design system setup for QUANLYVKS frontend (`apps/web`).

## What Was Done

### Stack

- **shadcn/ui** v1 — component library built on Radix UI primitives + Tailwind CSS
- **Tailwind CSS v4** — already present, no config file needed (uses `@theme inline`)
- **Radix UI** — unstyled, accessible primitives
- **lucide-react** — icon library
- **class-variance-authority (cva)** — component variant management
- **clsx + tailwind-merge** — className utility (`cn()`)

### Setup Commands Used

```bash
# Install dependencies
pnpm --filter web add clsx tailwind-merge tailwindcss-animate
pnpm --filter web add lucide-react
pnpm --filter web add class-variance-authority
pnpm --filter web add @radix-ui/react-alert-dialog @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-switch @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-progress
pnpm --filter web add sonner
```

### Generated Files

```
apps/web/
  components.json           # shadcn CLI config
  src/
    lib/
      utils.ts              # cn() helper (clsx + tailwind-merge)
      permissions.ts        # isAdmin, canOpenFormStudio, etc.
    components/
      ui/
        button.tsx
        input.tsx
        label.tsx
        textarea.tsx
        select.tsx
        card.tsx
        badge.tsx
        alert.tsx
        dialog.tsx
        alert-dialog.tsx
        sheet.tsx
        dropdown-menu.tsx
        separator.tsx
        skeleton.tsx
        table.tsx
        tabs.tsx
        tooltip.tsx
        sonner.tsx
        checkbox.tsx
        radio-group.tsx
        switch.tsx
        scroll-area.tsx
      common/
        README.md           # this doc
        page-shell.tsx     # PageShell, PageHeader, PageSection, PageActions
        status-badge.tsx   # Domain status badges
        error-banner.tsx    # Structured ApiError display
        empty-state.tsx     # Empty list/search state
        loading-state.tsx    # Skeleton placeholders
        confirm-dialog.tsx   # AlertDialog wrapper
        field.tsx           # Label + control + error wrapper
        data-table-shell.tsx # Table wrapper
```

### CSS Variables Added

Added to `src/app/globals.css` under `@layer base :root`:

- `--background`, `--foreground` — base surface
- `--card`, `--card-foreground`
- `--primary` (deep navy `hsl(222 70% 26%)`), `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive` (red), `--destructive-foreground`
- `--success` (emerald), `--success-foreground`
- `--warning` (amber), `--warning-foreground`
- `--border`, `--input`, `--ring`
- `--sidebar*` tokens
- `--chart*` tokens
- `--qvks-*` tokens (preserved from original: font sizes, input heights, card radius)
- Dark mode variables

Tailwind v4 `@theme inline` maps these to standard utilities (`bg-primary`, `text-destructive`, etc.).

## Migration Strategy for Phase 3

### Page Layout (Priority 1)

Replace self-defined `<main className="min-h-screen bg-slate-50 px-6 py-8">` patterns:

```tsx
// Before
<main className="min-h-screen bg-slate-50 px-6 py-8">
  <div className="mx-auto max-w-7xl space-y-6">
    ...
  </div>
</main>

// After
<PageShell>
  <PageHeader>...</PageHeader>
  <PageSection>...</PageSection>
</PageShell>
```

Pages to migrate first:
1. Dashboard (`app/page.tsx`)
2. Cases list (`app/cases/page.tsx`)
3. Templates review (`app/templates/page.tsx`) — already migrated in Phase 1

### Error Display (Priority 2)

Add `ErrorBanner` to pages with async data fetching:

```tsx
import { ErrorBanner } from "@/components/common/error-banner";

{error && <ErrorBanner error={error} />}
```

### Status Badges (Priority 3)

Replace inline `statusTone()` or `variant` mapping with `StatusBadge`:

```tsx
import { StatusBadge } from "@/components/common/status-badge";

// Before: <span className={statusTone(status)}>{label}</span>
// After: <StatusBadge value={status} type="review" />
```

### Loading States (Priority 4)

Replace manual skeleton divs with `LoadingState`:

```tsx
import { LoadingState } from "@/components/common/loading-state";

// Before: isLoading ? <div className="space-y-3">{skeleton divs}</div> : items
// After: isLoading ? <LoadingState variant="list" count={3} /> : items
```

### Mobile Navigation (Priority 5)

Add Sheet-based mobile drawer to `AppShell`:

```tsx
// In AppShell, wrap Sidebar in Sheet triggered by hamburger icon
<Sheet>
  <SheetContent side="left">
    <Sidebar />
  </SheetContent>
</Sheet>
```

## Non-Goals (Not Done in Phase 2)

- Dark mode toggle — CSS variables already support it, but no UI toggle added
- Form Studio redesign — too complex for this phase
- TanStack Table — current tables are simple
- Feature flag service
- Rive / Lottie animations
- Replacing all buttons/inputs across the app
- Rebuilding the dashboard

## Known Limitations

- shadcn "new-york" style uses `rounded-xl` by default; QUANLYVKS uses `rounded-lg` for buttons to match existing app feel. This is intentional.
- Senior-friendly document input sizing (`--qvks-input-height: 46px`) is preserved in `.qvks-document-workspace` CSS rules — not all `ui/` components use these tokens.
- Mobile navigation is planned for Phase 3, not this phase.
