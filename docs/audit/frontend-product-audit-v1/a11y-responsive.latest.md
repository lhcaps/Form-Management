# Accessibility & Responsive Audit — QUANLYVKS Frontend Audit V1

> Generated: 2026-06-30

## Accessibility Findings

### Keyboard Navigation

| Check | Status | Issue | Location |
|-------|--------|-------|----------|
| Tab navigation | PARTIAL | Form inputs have focus styles | template-selector, form editor |
| Focus visible | PASS | `focus:ring-4 focus:ring-blue-100` | Most inputs |
| Skip to content | MISSING | No skip link | All pages |
| Escape closes modals | PARTIAL | Case picker has close on outside click | template-selector |
| Enter submits forms | PASS | Buttons respond to Enter | Most places |

### ARIA Support

| Check | Status | Issue | Location |
|-------|--------|-------|----------|
| Button accessible names | PASS | Clear button text | Most buttons |
| Input labels | PARTIAL | Some inputs use placeholder only | template-selector inputs |
| Error association | PARTIAL | No `aria-describedby` | published-contract-form-inputs |
| Modal focus trap | PARTIAL | No explicit focus management | Case picker modal |
| Live regions | MISSING | No aria-live for toasts | Global |

### Color Contrast

| Check | Status | Issue | Location |
|-------|--------|-------|----------|
| Text contrast | PASS | slate-950 on white | Most text |
| Badge contrast | PASS | Badge colors have good contrast | Badges |
| Button contrast | PASS | White text on dark backgrounds | Buttons |
| Link contrast | N/A | No links visible | N/A |

### Forms

| Check | Status | Issue | Location |
|-------|--------|-------|----------|
| Required field indication | PARTIAL | Red error message on save | published-contract-form-inputs |
| Error message association | MISSING | No aria-describedby | All forms |
| Field labels | PARTIAL | Some inputs lack explicit labels | template-selector |
| Placeholder text contrast | PASS | Placeholder is muted | Most inputs |

### Issues Found

| Issue ID | Severity | Category | File | Evidence | Recommended Fix |
|----------|----------|----------|------|----------|-----------------|
| A11Y-01 | P2 | ACCESSIBILITY | template-selector-workspace.tsx | Inputs use only placeholder, no `<label>` elements | Add proper `<label>` elements |
| A11Y-02 | P3 | ACCESSIBILITY | template-selector-workspace.tsx | No skip to content link | Add skip link |
| A11Y-03 | P2 | ACCESSIBILITY | published-contract-form-inputs.tsx | No `aria-describedby` for error messages | Add error association |
| A11Y-04 | P3 | ACCESSIBILITY | generated-document-workspace.tsx | Modal lacks focus trap | Add focus trap to case picker |
| A11Y-05 | P2 | ACCESSIBILITY | template-selector-workspace.tsx | No `role="alert"` for error messages | Add live region |

## Responsive Behavior

### Breakpoints

The app uses Tailwind responsive prefixes:
- `md:` for medium screens (768px+)
- `lg:` for large screens (1024px+)
- `xl:` for extra large (1280px+)

### Responsive Issues

| Issue ID | Severity | Category | Evidence | Recommended Fix |
|----------|----------|----------|----------|-----------------|
| RESP-01 | P2 | RESPONSIVE | Template cards: `md:grid-cols-2 xl:grid-cols-3` — 3 columns on mobile in landscape | Add `sm:grid-cols-1` |
| RESP-02 | P2 | RESPONSIVE | Form inputs use `h-11` — too tall on mobile | Consider `h-10` on mobile |
| RESP-03 | P3 | RESPONSIVE | Case picker modal: `max-w-2xl` may overflow on small screens | Add responsive width |
| RESP-04 | P3 | RESPONSIVE | Stat cards: single column stack may cause long page on mobile | Already using grid, acceptable |

### Mobile Behavior

| Page | Status | Notes |
|------|--------|-------|
| Template Selector | GOOD | Responsive grid, stacked layout |
| Document Editor | GOOD | Scrollable form, responsive tabs |
| Reports | GOOD | Horizontal scroll on table, stacked cards |

### Tablet Behavior

| Page | Status | Notes |
|------|--------|-------|
| Template Selector | GOOD | 2-column grid |
| Document Editor | GOOD | Full layout preserved |
| Reports | GOOD | Table fits, cards stack |

### Desktop Behavior

| Page | Status | Notes |
|------|--------|-------|
| Template Selector | GOOD | 3-column grid, full stats |
| Document Editor | GOOD | Wide form, full action bar |
| Reports | GOOD | Full table, side-by-side rank lists |

## Accessibility Recommendations

### High Priority (Phase 2)
1. Add proper `<label>` elements for all form inputs in template selector
2. Add `aria-describedby` for error messages in forms
3. Add `role="alert"` for dynamic error messages

### Medium Priority (Phase 3)
4. Add skip to content link
5. Implement focus trap for modals
6. Add `aria-live` regions for async updates

### Low Priority (Nice to Have)
7. Add `role="status"` for success messages
8. Consider `aria-current` for navigation
9. Add keyboard shortcuts for common actions

## Responsive Recommendations

### High Priority (Phase 2)
1. Fix template card grid for mobile portrait mode
2. Ensure form inputs are touch-friendly on mobile

### Medium Priority (Phase 3)
3. Optimize case picker modal for small screens
4. Test table horizontal scroll behavior

## Playwright/axe Integration

Currently no automated accessibility testing is configured. Recommend adding:

```typescript
// tests/a11y/template-selector.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('template selector has no accessibility violations', async ({ page }) => {
  await page.goto('/templates');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```
