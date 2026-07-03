# QLLaw UX/UI Recommendations

**Audit Date:** 2026-07-03
**Purpose:** Detailed recommendations for future implementation

---

## Strategic Direction

### Design Read (Correct Interpretation)

**"Premium utilitarian minimalism" for QLLaw means:**

1. **Dense-but-calm workstation UI** — Every element earns its space. Dense legal forms are appropriate; decorative whitespace is not.

2. **Restrained motion** — Animations clarify state, not decorate. 200-360ms for transitions. `prefers-reduced-motion` respected.

3. **High legibility** — 16px body text, 15px labels. Minimum 44px touch targets. High contrast throughout.

4. **Semantic status colors** — Amber for warnings, red for blocking, green for verified. Never decorative purple/cyan.

5. **Strong hierarchy** — Typography scale: 30px h1 → 22px h2 → 18px h3. Black → semibold → medium weights.

6. **Crisp 1px borders** — No thick accent borders. No hairline + huge shadow combos.

7. **Professional restraint** — No gradients in product surfaces (except auth shell brand panel). No glassmorphism. No emoji. No buzzword copy.

### Why This Is Product UI, Not Landing Page UI

| Landing Page | QLLaw Product UI |
|--------------|-------------------|
| Hero section with gradient | Dashboard with KPIs |
| Decorative images | Data tables and forms |
| CTA buttons with hover animations | Action buttons with loading states |
| "Get Started" flows | "Save" and "Submit for Review" flows |
| Minimal content, maximum whitespace | Dense forms, maximum information |
| Emotional appeal | Functional precision |
| First-time user experience | Repeated daily use |

QLLaw is used by legal administrators for hours at a time, processing 213+ form templates. The UI must support:
- Rapid form entry
- Clear status identification
- Efficient navigation between cases and documents
- Low cognitive load over long sessions
- Trust signals through predictability

### Why "Minimal" Means Calm Precision

"Minimal" in QLLaw context does NOT mean:
- Empty whitespace
- Single-column layouts
- Minimal information display
- Decorative minimalism

"Minimal" in QLLaw context DOES mean:
- No gratuitous decoration
- No redundant UI chrome
- Consistent patterns that become invisible through familiarity
- Typography and spacing that support scanning
- Status indicators that communicate at a glance

---

## Specific Recommendations

### 1. Design Token System

#### 1.1 Radius Scale

**Current state:** Inconsistent usage of `rounded-3xl`, `rounded-2xl`, `rounded-[18px]`

**Recommended scale:**
```css
/* Semantic radius tokens */
--radius-sm: 4px;      /* Buttons, inputs */
--radius-md: 8px;       /* Cards, panels */
--radius-lg: 12px;      /* Modals, large cards */
--radius-xl: 16px;      /* Page sections */

/* Map to Tailwind */
.rounded-surface { border-radius: var(--radius-lg); }
.rounded-card { border-radius: var(--radius-md); }
.rounded-input { border-radius: var(--radius-sm); }
```

**Action:** Define `--radius-nav` if nav-specific radius is needed, or standardize on `rounded-2xl` (12px) for consistency.

#### 1.2 Shadow Scale

**Current state:** `shadow-sm`, `shadow-lg`, `shadow-xl` used arbitrarily

**Recommended scale:**
```css
/* Semantic shadow tokens */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);      /* Card resting */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);    /* Card hover */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);  /* Overlay, menu */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1); /* Modal, sticky bar */

/* Semantic aliases */
--shadow-card: var(--shadow-sm);
--shadow-card-hover: var(--shadow-md);
--shadow-menu: var(--shadow-lg);
--shadow-overlay: var(--shadow-xl);
```

**Action:** Review `shadow-xl` usage on sticky action bars — is it necessary?

#### 1.3 Brand Colors

**Current state:** `#173E86` and `#0B1F3A` hardcoded

**Recommended:**
```css
/* Already correct in globals.css */
--primary: 222 70% 26%;  /* Deep navy */

/* Action: Replace hardcoded values with CSS variable */
.bg-brand { background-color: hsl(var(--primary)); }
```

#### 1.4 Status Colors

**Current state:** Inline `bg-blue-50 text-blue-700` patterns

**Recommended:**
```css
/* Status tokens */
--status-info-bg: blue-50;
--status-info-text: blue-700;
--status-success-bg: emerald-50;
--status-success-text: emerald-700;
--status-warning-bg: amber-50;
--status-warning-text: amber-700;
--status-error-bg: rose-50;
--status-error-text: rose-700;
```

**Action:** Create `StatusTone` component or CSS utility for non-badge status display.

---

### 2. Shared Components

#### 2.1 FormActionBar (HIGH PRIORITY)

**Current state:** Duplicated in 100+ files

**Proposed:**
```tsx
interface FormActionBarProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

function FormActionBar({ children, className, sticky = true }: FormActionBarProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur",
      sticky && "sticky bottom-4 z-10",
      className
    )}>
      {children}
    </div>
  );
}
```

**Priority:** CRITICAL — highest impact, lowest risk

#### 2.2 KpiCard

**Current state:** Inline in dashboard

**Proposed:**
```tsx
interface KpiCardProps {
  label: string;
  value: string | number;
  tone: "blue" | "indigo" | "amber" | "emerald" | "violet";
  icon?: React.ReactNode;
}

function KpiCard({ label, value, tone, icon }: KpiCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", toneClasses[tone])}>
        {label}
      </span>
      <div className="mt-4 text-3xl font-black text-slate-950">
        {value}
      </div>
    </div>
  );
}
```

**Priority:** MEDIUM — reduces hardcoded patterns

#### 2.3 ModuleLinkCard

**Current state:** Inline in dashboard

**Proposed:** Migrate to use `PageSection` + link styling

**Priority:** LOW — cosmetic improvement

---

### 3. Navigation

#### 3.1 Fix Emoji

**Current:** `⚖` in logo

**Proposed:**
```tsx
import { Scale } from "lucide-react";

<div className="grid h-11 w-11 place-items-center rounded-2xl bg-[--primary] text-lg font-black text-white shadow-sm">
  <Scale className="h-5 w-5" aria-hidden="true" />
</div>
```

**Priority:** HIGH — quick win

#### 3.2 Fix Radius

**Current:** `rounded-[18px]`

**Proposed:** Standardize on `rounded-2xl` (12px) for consistency

**Priority:** MEDIUM — visual consistency

#### 3.3 Standardize Icons

**Current:** Custom `SvgIcon` helper with inline paths

**Proposed:** Use Lucide components throughout

**Priority:** MEDIUM — code cleanliness

---

### 4. Accessibility

#### 4.1 Focus States

**Current:** `focus:border-slate-500 focus:ring-2 focus:ring-slate-200` in BM forms

**Proposed:** Standardize on shadcn `focus-visible:ring-2 focus-visible:ring-ring`

**Priority:** MEDIUM — consistency

#### 4.2 Reduced Motion

**Current:** `@media (prefers-reduced-motion)` only on auth animations

**Proposed:** Add to all `transition` and `animate` utilities

**Priority:** LOW — browser fallback is usually acceptable

#### 4.3 Form Errors

**Current:** `aria-describedby` implemented in some forms, not all

**Proposed:** Audit all BM forms and ensure consistent error association

**Priority:** MEDIUM — legal form importance

---

### 5. Implementation Order

```
Phase 1: Quick Wins (1-2 days)
  □ Replace ⚖ emoji with Lucide icon
  □ Replace bg-[#123B66] with Button variant
  □ Convert auth shell gradient to CSS variable
  □ Fix nav radius: rounded-[18px] → rounded-2xl

Phase 2: Shared Components (1 week)
  □ Extract FormActionBar from 5 representative BM forms
  □ Test FormActionBar with Playwright screenshots
  □ Apply FormActionBar to all BM forms
  □ Create KpiCard component
  □ Migrate dashboard to KpiCard

Phase 3: Token System (1 week)
  □ Define semantic shadow tokens
  □ Define status color tokens
  □ Audit shadow usage across surfaces
  □ Audit status color usage across surfaces

Phase 4: Accessibility (1 week)
  □ Audit focus states in BM forms
  □ Add aria-describedby to all form errors
  □ Test with axe-core

Phase 5: Polish (ongoing)
  □ Migrate pages to PageShell
  □ Replace custom modals with Dialog
  □ Standardize Lucide usage throughout
  □ Visual regression testing
```

---

### 6. Anti-Slop Checklist

Before shipping any UI change, verify:

- [ ] No decorative gradient text
- [ ] No purple/cyan color palette
- [ ] No glassmorphism without purpose
- [ ] No card inside card inside card
- [ ] No equal-weight 3-card layouts as decoration
- [ ] No generic icon tiles above headings
- [ ] No excessive rounded blobs
- [ ] No hairline border + huge shadow
- [ ] No thick side-tab accent borders
- [ ] No inconsistent shadows
- [ ] No low-contrast text
- [ ] No flat typography hierarchy
- [ ] No Inter-only font usage
- [ ] No generic dashboard card overload
- [ ] No redundant helper text
- [ ] No vague copy (seamless, empower, streamline)
- [ ] No emoji in legal/admin UI
- [ ] No overanimated hover/motion
- [ ] No layout animation (width/height/top/left)

---

### 7. Validation Plan

#### Before Implementation
```bash
# Capture baseline screenshots
pnpm playwright screenshot baseline

# Run lint
pnpm --filter web lint

# Run typecheck
pnpm --filter web exec tsc --noEmit
```

#### After Implementation
```bash
# Compare screenshots
pnpm playwright screenshot compare --baseline=baseline

# Re-run lint and typecheck
pnpm --filter web lint
pnpm --filter web exec tsc --noEmit

# Accessibility check
pnpm playwright test --project=a11y

# Manual review checklist
□ All surfaces render correctly
□ Focus states visible on keyboard navigation
□ Status colors match intent (amber=warning, red=error, green=success)
□ No decorative elements added
□ Consistent radius across surfaces
□ Consistent shadow across surfaces
```

---

### 8. Rollback Plan

If any change introduces visual regression:

```bash
# Identify the problematic change
git log --oneline -20

# Revert specific file
git checkout <commit-hash> -- <file>

# Run tests
pnpm --filter web exec tsc --noEmit

# Restore baseline screenshots
pnpm playwright screenshot restore-baseline
```

---

### 9. Open Questions

1. **Dark mode priority:** Should dark mode be implemented in Phase 1 or deferred?
   - Recommendation: Defer to Phase 3+ (after token system is established)

2. **Responsive behavior for BM forms:** DESIGN.md says "desktop-first, tablet and mobile provide review and read-only inspection, not structural editing." Is this currently enforced?
   - Recommendation: Audit current mobile behavior and implement review-only mode if needed

3. **Form validation UX:** Should validation errors appear inline below fields or in a summary panel?
   - Current state: Mixed implementations
   - Recommendation: Standardize on inline field-level errors + summary panel

4. **Loading states:** Should skeleton loaders be used for all loading states?
   - Current state: Mixed (some use skeleton, some use text)
   - Recommendation: Standardize on skeleton for content, text for actions

---

### 10. Reference Materials

For implementation, consult:

- [PixelPoint: UI/UX Talks](https://pixelpoint.io/blog/hear-me-my-young-padawan-or-ui-ux-talks/)
- [Impeccable Style](https://impeccable.style/)
- [Impeccable: AI Slop](https://impeccable.style/slop)
- [Emil Kowalski: Animation Principles](https://emilkowal.ski/)
- [QLLaw DESIGN.md](d:\Study\Project\QLLaw-main\DESIGN.md)
- [QLLaw PROJECT_SPEC.md](d:\Study\Project\QLLaw-main\docs\PROJECT_SPEC.md)
