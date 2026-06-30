# Design System Audit — QUANLYVKS Frontend Audit V1

> Generated: 2026-06-30

## Overview

The current frontend uses a mix of Tailwind CSS with inconsistent color palettes and inconsistent component patterns. The design is functional but needs unification for a professional legal/government SaaS product.

## Current Design State

### Typography

| Element | Current | Issue |
|---------|---------|--------|
| Font Family | System default (Tailwind default) | No custom font |
| Headings | Various sizes (text-3xl, text-4xl) | Inconsistent hierarchy |
| Body | text-sm, text-base | Mix of sizes |
| Labels | text-sm font-bold | Mostly consistent |
| Small Text | text-xs | Mostly consistent |
| Code/Hash | font-mono | Used for technical data only |

### Colors

#### Primary Palette (Slate-based)
| Token | Usage | Status |
|-------|-------|--------|
| `slate-950` | Primary text, dark backgrounds | ✓ |
| `slate-900` | Headings | ✓ |
| `slate-700` | Secondary text | ✓ |
| `slate-500` | Muted text | ✓ |
| `slate-200` | Borders | ✓ |
| `slate-100` | Backgrounds | ✓ |
| `slate-50` | Light backgrounds | ✓ |

#### Accent Colors
| Token | Usage | Status |
|-------|-------|--------|
| `blue-700` | Primary CTA | ✓ |
| `blue-800` | CTA hover | ✓ |
| `blue-100` | CTA light background | ✓ |
| `emerald-700/800` | Success states | ✓ |
| `amber-700/800` | Warning states | ✓ |
| `rose-700/800` | Error states | ✓ |

#### Inconsistent Palette Usage
| Location | Current | Should Be |
|----------|---------|-----------|
| `reports/page.tsx` | `bg-zinc-50` | `bg-slate-50` |
| Reports cards | `border-zinc-200` | `border-slate-200` |
| Reports text | `text-zinc-*` | `text-slate-*` |

### Layout System

#### Page Layout
- Template Selector: `max-w-7xl mx-auto space-y-6 px-6 py-8`
- Document Workspace: `max-w-[1500px] w-full space-y-7 px-5 py-7 md:px-10`
- Reports: `max-w-7xl mx-auto space-y-5 px-4 py-5 sm:px-6`

**Issue**: Inconsistent max-width and padding

#### Card Patterns
- Template selector cards: `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm`
- Document workspace: `rounded-3xl border border-slate-200 bg-white p-7 shadow-sm`
- Reports cards: `rounded-md border border-zinc-200 bg-white p-4`

**Issue**: Mix of `rounded-3xl` and `rounded-md`

### Components

#### Buttons
| Type | Current | Status |
|------|---------|--------|
| Primary CTA | `rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm` | ✓ Consistent |
| Secondary | `rounded-2xl border border-slate-200 bg-white px-4 py-2` | ✓ Consistent |
| Danger | N/A visible | — |

#### Badges/Chips
- Status badges: `rounded-full px-2.5 py-1 text-xs font-black`
- Color variants for: success, warning, danger, info, neutral

#### Form Inputs
- Height: `h-11` (44px) for main inputs
- Border: `rounded-2xl border border-slate-200`
- Focus: `focus:border-blue-400 focus:ring-4 focus:ring-blue-100`

#### Cards
- Template cards: `rounded-2xl border border-slate-200 bg-white p-4`
- Dashboard cards: `rounded-md border border-zinc-200 bg-white p-4`

## Inconsistencies Found

### Color Palette Mixing
The `reports/page.tsx` uses `zinc-*` tokens while other pages use `slate-*`. This creates visual inconsistency across the application.

### Border Radius Mixing
- Template selector: `rounded-3xl` for sections, `rounded-2xl` for inner elements
- Reports: `rounded-md` throughout
- Document workspace: `rounded-3xl` for sections, `rounded-2xl` for tabs

### Padding Inconsistency
- Template selector: `p-6` on sections
- Document workspace: `p-7` on header
- Reports: `p-4` on cards

## Recommended Design System

### Color Tokens (Maintain Slate-based)
```css
/* Primary */
--color-primary: #0f172a;        /* slate-950 */
--color-primary-hover: #020617;   /* slate-975 */

/* Success */
--color-success: #166534;         /* emerald-800 */
--color-success-bg: #dcfce7;     /* emerald-100 */

/* Warning */
--color-warning: #b45309;        /* amber-700 */
--color-warning-bg: #fef3c7;     /* amber-100 */

/* Danger */
--color-danger: #be123c;          /* rose-700 */
--color-danger-bg: #ffe4e6;      /* rose-100 */

/* Background */
--color-bg: #f8fafc;            /* slate-50 */
--color-surface: #ffffff;        /* white */

/* Text */
--color-text-primary: #0f172a;  /* slate-950 */
--color-text-secondary: #475569; /* slate-600 */
--color-text-muted: #94a3b8;    /* slate-400 */

/* Border */
--color-border: #e2e8f0;        /* slate-200 */
```

### Typography Scale
```css
/* Font sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-black: 900;
```

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;      /* 32px */
```

### Border Radius Scale
```css
--radius-sm: 0.5rem;   /* 8px - rounded-lg */
--radius-md: 0.75rem;  /* 12px - rounded-xl */
--radius-lg: 1rem;     /* 16px - rounded-2xl */
--radius-xl: 1.5rem;   /* 24px - rounded-3xl */
```

### Component Specifications

#### Page Shell
```css
.page-shell {
  max-width: 1280px;  /* max-w-7xl */
  margin: 0 auto;
  padding: 2rem;       /* py-8 */
}

@media (max-width: 640px) {
  .page-shell {
    padding: 1rem;    /* px-4 py-5 */
  }
}
```

#### Card
```css
.card {
  border-radius: var(--radius-xl);  /* rounded-3xl */
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 1.5rem;     /* p-6 */
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.card-header {
  padding: 1.5rem 1.5rem 0;
}

.card-content {
  padding: 1.5rem;
}
```

#### Button Primary
```css
.btn-primary {
  height: 44px;           /* h-11 */
  padding: 0 1.25rem;     /* px-5 */
  border-radius: var(--radius-lg);  /* rounded-xl */
  background: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: white;
  transition: background 150ms;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Input
```css
.input {
  height: 44px;           /* h-11 */
  padding: 0 1rem;        /* px-4 */
  border-radius: var(--radius-lg);  /* rounded-xl */
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
}

.input:focus {
  border-color: #3b82f6;  /* blue-400 */
  ring: 4px;
  ring-color: #dbeafe;    /* blue-100 */
}
```

#### Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;  /* py-1 px-2.5 */
  border-radius: 9999px;      /* rounded-full */
  font-size: 0.75rem;          /* text-xs */
  font-weight: var(--font-black);
}
```

## Stitch Availability

**Status**: MCP server not configured. Manual audit completed.

**Available Skills** (after Stitch MCP installation):
- `stitch::extract-design-md` — Extract design documentation
- `stitch::extract-static-html` — Extract HTML snapshots
- `stitch::code-to-design` — Convert code to design docs
- `stitch::manage-design-system` — Manage design tokens

**Recommendation**: For Phase 2, install Stitch MCP and use these skills to maintain design system consistency.

## Implementation Plan for Design System

### Phase 2 Tasks
1. Create shared `PageShell` component with consistent layout
2. Create shared `Card` component with consistent styling
3. Create shared `Button` component variants
4. Create shared `Badge` component variants
5. Standardize border-radius across all pages
6. Fix color palette inconsistency (zinc → slate)
7. Create design token file

### Files to Create
```
apps/web/src/components/common/
├── page-shell.tsx       # Shared page wrapper
├── card.tsx            # Shared card (already exists as UI component)
└── design-tokens.ts     # Design token constants
```

### Files to Modify
```
apps/web/src/app/reports/page.tsx          # Fix zinc → slate
apps/web/src/components/documents/          # Use shared components
apps/web/src/app/                          # Use shared page shell
```
