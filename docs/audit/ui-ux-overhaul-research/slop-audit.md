# QLLaw AI Slop Audit

**Audit Date:** 2026-07-03
**Purpose:** Detect and document AI slop patterns in the QLLaw frontend codebase

---

## Definition: AI Slop

AI slop refers to visual and textual patterns that are characteristic of AI-generated UI, including:
- Generic gradient text
- Purple/cyan AI color palettes
- Frosted glass (glassmorphism) without purpose
- Card inside card inside card layouts
- Equal-weight 3-card layouts
- Generic icon tiles above headings
- Excessive rounded blobs
- Hairline border + huge shadow combos
- Thick side-tab accent borders
- Inconsistent shadows
- Low-contrast text
- Flat typography hierarchy
- Inter font everywhere without hierarchy
- Generic dashboard card overload
- Redundant helper text
- Vague copy ("seamless", "empower", "streamline", "next-gen")
- Emoji in non-fun UI
- Overanimated hover/motion
- Layout animation using width/height/top/left

---

## Audit Results Summary

| Category | Status | Count |
|----------|--------|-------|
| Confirmed AI Slop | FOUND | 8 |
| Suspected AI Slop | NEEDS REVIEW | 3 |
| Clean (No Slop) | CLEAN | 11 |

---

## Confirmed Findings

### 1. Sticky Action Bar Duplication (HIGH PRIORITY)

**Pattern:** `bg-white/95 backdrop-blur shadow-xl` repeated 100+ times

**Files:** All `bm-*-form-inputs.tsx` files (bm-001, bm-027, bm-028, bm-031, bm-033, bm-037, bm-040, bm-042, bm-043, bm-048-055, bm-070-071, bm-076, bm-084, bm-097, bm-172, and many more)

**Evidence:**
```
bm-001-form-inputs.tsx:1013:  className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur print:hidden"
bm-027-form-inputs.tsx:405:   className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur"
bm-033-form-inputs.tsx:1791:  className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
bm-037-form-inputs.tsx:1872:  className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
bm-172-form-inputs.tsx:589:   className="sticky top-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur"
```

**Why this is slop:** The identical pattern copied across 100+ files is a hallmark of AI-generated code that didn't consolidate into a shared component.

**Remediation:** Extract to `FormActionBar` shared component.

---

### 2. Emoji in Navigation Logo (HIGH PRIORITY)

**Pattern:** `⚖` emoji in nav-items.tsx

**File:** `apps/web/src/components/layout/nav-items.tsx:59`

**Evidence:**
```tsx
<div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0B1F3A] text-lg font-black text-white shadow-sm">
  ⚖
</div>
```

**Why this is slop:** Emoji in a legal/government admin product is unprofessional. Single-character emoji is often an AI shortcut.

**Remediation:** Replace with SVG scales icon.

---

### 3. Hardcoded Brand Colors (MEDIUM)

**Pattern:** `#123B66` and `#0B1F3A` hardcoded instead of CSS variables

**Files:**
- `apps/web/src/components/layout/nav-items.tsx:58` — `bg-[#0B1F3A]`
- `apps/web/src/app/admin/(shared)/auth/identities/page.tsx:341` — `bg-[#123B66]`

**Evidence:**
```tsx
// nav-items.tsx:58
<div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0B1F3A] text-lg font-black text-white shadow-sm">

// admin auth identities:341
className="min-h-10 rounded-xl bg-[#123B66] px-5 text-sm font-extrabold text-white transition hover:bg-[#0d2f52] disabled:cursor-not-allowed disabled:opacity-50"
```

**Why this is slop:** Hardcoded brand colors suggest copy-paste from design tools without adopting design tokens.

**Remediation:** Use `--primary` CSS variable or `variant="default"` on Button component.

---

### 4. Hardcoded Dark Gradient (MEDIUM)

**Pattern:** Linear gradient hardcoded in auth shell

**File:** `apps/web/src/components/auth/auth-shell.tsx:24`

**Evidence:**
```tsx
className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#07111f_0%,#0b1730_58%,#103257_100%)]"
```

**Why this is slop:** Single hardcoded exception to the "no decorative gradients" rule. Also won't adapt to dark mode.

**Remediation:** Convert to CSS variable for dark mode support.

---

### 5. Inline SVG vs Lucide Inconsistency (MEDIUM)

**Pattern:** Custom `SvgIcon` helper in nav-items.tsx vs Lucide used elsewhere

**File:** `apps/web/src/components/layout/nav-items.tsx:21-36`

**Evidence:**
```tsx
function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" ...>
      {children}
    </svg>
  );
}
```

**Why this is slop:** Lucide is already installed (`lucide-react v1.21.0`) but not used consistently. Custom SVG helpers are an AI pattern for avoiding dependency.

**Remediation:** Replace with Lucide components.

---

### 6. Inline Status Color Tones (MEDIUM)

**Pattern:** `bg-blue-50 text-blue-700`, `bg-indigo-50 text-indigo-700`, etc. scattered inline

**Files:**
- `apps/web/src/app/page.tsx:113-131` — Dashboard KPI cards
- `app/cases/page.tsx` — Cases status
- `admin/auth/identities/page.tsx` — Status badges

**Evidence:**
```tsx
// page.tsx:113
{ label: "Tổng hồ sơ", value: String(casesData?.pagination.total ?? 0), tone: "bg-blue-50 text-blue-700" }

// page.tsx:121
{ label: "Đang xử lý", value: String(...), tone: "bg-indigo-50 text-indigo-700" }

// page.tsx:126
{ label: "Biểu mẫu chờ duyệt", value: String(...), tone: "bg-amber-50 text-amber-700" }

// page.tsx:131
{ label: "Đã duyệt", value: String(...), tone: "bg-emerald-50 text-emerald-700" }
```

**Why this is slop:** This is the "generic dashboard KPI card" pattern characteristic of AI-generated admin dashboards.

**Remediation:** Create `KpiCard` shared component with semantic color tokens.

---

### 7. Inconsistent Radius Scale (LOW-MEDIUM)

**Pattern:** `rounded-3xl`, `rounded-2xl`, `rounded-[18px]` used interchangeably

**Files:**
- `nav-items.tsx:268,297` — `rounded-[18px]`
- `page-shell.tsx` — `rounded-3xl`
- Various BM forms — `rounded-2xl`

**Evidence:**
```tsx
// nav-items.tsx:268
className="group flex min-h-[52px] items-center gap-3 rounded-[18px] px-3.5 text-[15px] font-bold tracking-[-0.01em] transition-all duration-200"

// page-shell.tsx:84
card && "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
```

**Why this is slop:** Inconsistent radius suggests design was not systematized. AI often generates with random-looking radius values.

**Remediation:** Establish consistent radius scale; use `--radius` tokens.

---

### 8. Inconsistent Shadow Scale (LOW-MEDIUM)

**Pattern:** `shadow-sm`, `shadow-lg`, `shadow-xl` used without semantic meaning

**Evidence:**
```tsx
// page-shell.tsx
"rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"

// bm-033-form-inputs.tsx
"rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"

// bm-097-form-inputs.tsx
"rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur"
```

**Why this is slop:** Shadow scale should be semantic (card, menu, overlay, sticky). Using arbitrary shadow sizes suggests lack of design system.

**Remediation:** Define semantic shadow tokens: `--shadow-card`, `--shadow-menu`, `--shadow-overlay`, `--shadow-sticky`.

---

## Suspected Findings (Require Runtime Review)

### 1. Excessive `shadow-xl` on Sticky Action Bars

**Pattern:** `shadow-xl` on sticky bottom bars may be over-elevated

**Files:** bm-033, bm-037, bm-040, bm-042, bm-043, bm-054, bm-076, bm-084, bm-097, bm-172

**Remediation:** Review if `shadow-lg` would suffice for consistent elevation.

---

### 2. `rounded-full` Overuse on Badges

**Pattern:** `rounded-full` used on template code badges, status badges

**Evidence:**
```tsx
// template-preview-workspace.tsx
<span className="rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-bold text-white">
  {normalizedTemplateCode}
</span>

// review-queue-item-card.tsx
<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
  {item.templateCode}
</span>
```

**Why potentially slop:** `rounded-full` can look heavy on dense surfaces. Pill-shaped badges are common in AI-generated dashboards.

**Remediation:** Review if `rounded-md` or `rounded-lg` would be more appropriate for dense surfaces.

---

### 3. Card Shadow Inconsistency

**Pattern:** Some cards use `shadow-sm`, others `shadow-none`

**Files:** Multiple surfaces

**Remediation:** Audit all card surfaces and standardize shadow usage.

---

## Clean (No AI Slop Found)

| Category | Status | Notes |
|----------|--------|-------|
| Decorative gradient text | CLEAN | No `bg-clip-text text-transparent` found |
| Purple/cyan AI palette | CLEAN | `--primary` is deep navy (222 70% 26%), not purple/cyan |
| Glassmorphism | CLEAN | `backdrop-blur` only on functional overlays (dialogs, sheets), not decorative |
| Generic copy | CLEAN | No "Seamless", "Elevate", "Unleash", "Next-Gen", "Game-changer" found |
| Card nesting | CLEAN | No excessive card-inside-card patterns |
| Generic icon tiles | CLEAN | Icons serve function, not decoration |
| Excessive rounded blobs | CLEAN | Radius usage is constrained to `rounded-lg` to `rounded-3xl` |
| Hairline + huge shadow | CLEAN | Border and shadow are proportional |
| Thick side-tab borders | CLEAN | No `border-l-4` or `border-l-8` patterns found (one exception in grep) |
| Empty decorative images | CLEAN | No decorative images in product surfaces |
| Overanimated motion | CLEAN | Animations are restrained (200-360ms) |
| Layout animation (width/height) | CLEAN | No layout-triggering animations found |
| Purple/blue AI gradients | CLEAN | Auth shell gradient is dark slate, not purple/blue |

---

## Recommendations

### Immediate Actions (PR #1)

1. Replace `⚖` emoji with SVG icon in nav-items.tsx
2. Replace `bg-[#123B66]` with `variant="default"` button
3. Convert auth shell gradient to CSS variable

### Short-term Actions (PR #2-3)

4. Extract `FormActionBar` to shared component
5. Create `KpiCard` shared component
6. Fix nav radius: `rounded-[18px]` → `rounded-2xl`
7. Standardize on Lucide icons throughout

### Medium-term Actions (Phase 2)

8. Define semantic shadow tokens
9. Consolidate status color tones to CSS variables
10. Establish consistent radius scale

---

## Verification Commands

```bash
# Check for emoji
rg "⚖" apps/web/src

# Check for decorative gradients
rg "bg-clip-text|text-transparent" apps/web/src

# Check for AI copy
rg "Seamless|Elevate|Unleash|Next-Gen" apps/web/src

# Check for purple/cyan palette
rg "purple|cyan|violet" apps/web/src
```

**Results:**
- `⚖`: FOUND (nav-items.tsx)
- `bg-clip-text|text-transparent`: CLEAN
- `Seamless|Elevate|Unleash|Next-Gen`: CLEAN
- `purple|cyan` (in non-status context): CLEAN (violet only found in badge variant, which is legitimate)
