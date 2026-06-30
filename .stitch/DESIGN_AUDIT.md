# Stitch Design Audit — Manual Extraction

> Generated: 2026-06-30

## Stitch MCP Status

**MCP Server**: NOT CONFIGURED
**Stitch Skills**: Installed to Cursor workspace (3 packages)
**Recommendation**: For Phase 2, configure Stitch MCP for automated design extraction

## Manual Design Inventory

### Colors Used (Slate Palette)
```
Background:   slate-50, slate-100
Surface:     white, slate-50
Borders:     slate-200, slate-300
Text:        slate-950, slate-800, slate-700, slate-600, slate-500, slate-400
Primary:     slate-950
Accent Blue: blue-100, blue-700, blue-800
Success:     emerald-100, emerald-50, emerald-700, emerald-800
Warning:     amber-100, amber-50, amber-700, amber-800
Danger:      rose-100, rose-50, rose-700, rose-800
Neutral:     slate-200, slate-600
Info:        blue-100, blue-700
```

### Typography Scale
```
text-4xl: 36px - Page titles (document workspace)
text-3xl: 30px - Section headings
text-2xl: 24px - Card titles
text-xl:  20px - Subsection headings  
text-lg:  18px - Body emphasis
text-base: 16px - Default body
text-sm:  14px - Secondary text
text-xs:  12px - Badges, captions, metadata
```

### Font Weights
```
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
font-black: 900
```

### Spacing System (Tailwind)
```
space-y-1: 4px
space-y-2: 8px
space-y-3: 12px
space-y-4: 16px
space-y-5: 20px
space-y-6: 24px
space-y-7: 28px (custom)
space-y-8: 32px
space-y-9: 36px (custom)
```

### Shadow
```
shadow-sm: Used on cards (0 1px 2px 0 rgb(0 0 0 / 0.05))
shadow: not used
shadow-md: not used
shadow-lg: not used
```

### Component Patterns

#### Page Header
```
<div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <p class="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
    BREADCRUMB
  </p>
  <h1 class="mt-3 text-3xl font-black text-slate-950">
    Page Title
  </h1>
  <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
    Description
  </p>
</div>
```

#### Stat Card
```
<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <p class="text-xs font-bold uppercase text-slate-500">
    Label
  </p>
  <p class="mt-2 text-2xl font-black text-slate-950">
    Value
  </p>
</div>
```

#### Template Card
```
<article class="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <span class="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">
        BM-001
      </span>
      <h4 class="mt-3 text-sm font-black leading-5 text-slate-950">
        Title
      </h4>
    </div>
  </div>
  <button class="mt-4 w-full rounded-2xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">
    Mở biểu mẫu
  </button>
</article>
```

#### Form Section
```
<div class="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
  <div class="text-sm font-black text-blue-950">
    Section Title
  </div>
</div>
```

#### Action Bar
```
<div class="flex justify-end">
  <button class="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white">
    Primary Action
  </button>
</div>
```

## Design System Recommendations

### 1. Create Shared PageShell Component
```tsx
// apps/web/src/components/common/page-shell.tsx
interface PageShellProps {
  title: string;
  breadcrumb?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageShell({ title, breadcrumb, description, children, actions }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-7 md:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {breadcrumb && <p className="text-xs font-bold uppercase text-blue-700">{breadcrumb}</p>}
          <h1 className="mt-3 text-3xl font-black text-slate-950">{title}</h1>
          {description && <p className="mt-3 text-sm text-slate-600">{description}</p>}
          {actions && <div className="mt-4">{actions}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}
```

### 2. Create Shared Card Component
```tsx
// apps/web/src/components/common/card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }) {
  const paddingClass = { sm: 'p-4', md: 'p-6', lg: 'p-7' }[padding];
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white ${paddingClass} shadow-sm ${className ?? ''}`}>
      {children}
    </div>
  );
}
```

### 3. Create Design Token File
```typescript
// apps/web/src/lib/design-tokens.ts
export const DESIGN_TOKENS = {
  colors: {
    primary: {
      DEFAULT: 'slate-950',
      hover: 'slate-900',
    },
    background: 'slate-50',
    surface: 'white',
    border: 'slate-200',
    text: {
      primary: 'slate-950',
      secondary: 'slate-600',
      muted: 'slate-400',
    },
    success: {
      bg: 'emerald-100',
      DEFAULT: 'emerald-700',
    },
    warning: {
      bg: 'amber-100',
      DEFAULT: 'amber-700',
    },
    danger: {
      bg: 'rose-100',
      DEFAULT: 'rose-700',
    },
  },
  spacing: {
    section: 'p-6',
    page: { x: 'px-6', y: 'py-8' },
  },
  radius: {
    section: 'rounded-3xl',
    card: 'rounded-2xl',
    button: 'rounded-xl',
    badge: 'rounded-full',
  },
} as const;
```

### 4. Fix Color Inconsistencies
Replace all `zinc-*` with `slate-*` in reports/page.tsx:
- `bg-zinc-50` → `bg-slate-50`
- `border-zinc-200` → `border-slate-200`
- `text-zinc-*` → `text-slate-*`
- `bg-zinc-100` → `bg-slate-100`
