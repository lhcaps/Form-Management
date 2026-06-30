# QUANLYVKS Frontend Productization Phase 2 — Implementation Plan

> Generated: 2026-06-30
> Based on: `docs/audit/frontend-product-audit-v1/`

## Overview

This plan implements the frontend fixes identified in the Phase 1 audit. The goal is to make the app look and feel like a professional legal/government SaaS product while maintaining all existing functionality.

## Pre-Implementation Checklist

- [ ] Read `docs/audit/frontend-product-audit-v1/backlog.latest.md`
- [ ] Read `docs/audit/frontend-product-audit-v1/debug-hardcode-leakage.latest.md`
- [ ] Read `docs/audit/frontend-product-audit-v1/workflows.latest.md`
- [ ] Verify `pnpm typecheck` passes
- [ ] Verify `pnpm test:web-unit` passes

---

## Phase 2A: P0 Fixes (Critical Blockers)

### Task 1: Add Sample Prefill Button

**Files to Create:**
```
apps/web/src/components/documents/sample-prefill-button.tsx  (new)
```

**Files to Modify:**
```
apps/web/src/components/documents/generated-document-workspace.tsx
```

**Implementation:**

1. Create `SamplePrefillButton` component:

```tsx
// apps/web/src/components/documents/sample-prefill-button.tsx
"use client";

import { useState } from "react";
import { getSampleData, mergeWithSampleData } from "@/features/forms-contracts/sample-data";
import type { CompiledFormContract } from "@qllaw/form-contracts";

interface SamplePrefillButtonProps {
  templateCode: string;
  contract?: CompiledFormContract;
  existingData: Record<string, unknown>;
  onApply: (data: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function SamplePrefillButton({
  templateCode,
  contract,
  existingData,
  onApply,
  disabled,
}: SamplePrefillButtonProps) {
  const [loading, setLoading] = useState(false);
  
  async function handleClick() {
    setLoading(true);
    try {
      const sample = getSampleData(templateCode, contract?.source.fields);
      const merged = mergeWithSampleData(existingData, sample);
      onApply(merged);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="min-h-11 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
    >
      {loading ? "Đang điền..." : "Điền dữ liệu mẫu"}
    </button>
  );
}
```

2. Add to `GeneratedDocumentWorkspace` in action area:

```tsx
// In generated-document-workspace.tsx, add import and use
import { SamplePrefillButton } from "./sample-prefill-button";

// Add after loading state resolves, in the form section:
{!isInitialPayloadLoading && (
  <div className="flex justify-between items-center mb-4">
    <SamplePrefillButton
      templateCode={templateCode}
      contract={publishedRuntime?.compiledContract}
      existingData={/* pass current form data via state */}
      onApply={(data) => {/* update form state */}}
    />
  </div>
)}
```

**Data Flow:**
```
User clicks "Điền dữ liệu mẫu"
    ↓
getSampleData(templateCode, contractFields)
    ↓
mergeWithSampleData(existingData, sample)
    ↓
existing user values preserved
empty fields filled with sample
    ↓
Update form state with merged data
```

**Validation:**
```bash
pnpm test:web-unit  # Should pass
pnpm typecheck      # Should pass
# Manual: Open a form, click button, verify empty fields are filled
```

---

### Task 2: Add Sample Mode Indicator

**Files to Modify:**
```
apps/web/src/components/documents/generated-document-workspace.tsx
```

**Implementation:**

Add state to track if sample was applied:

```tsx
const [isSampleMode, setIsSampleMode] = useState(false);

// In SamplePrefillButton onApply:
onApply={(data) => {
  setIsSampleMode(true);
  updateFormData(data);
}}
```

Add banner when in sample mode:

```tsx
{isSampleMode && (
  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    <strong>Chế độ xem trước:</strong> Dữ liệu mẫu đang hiển thị. Vui lòng kiểm tra và lưu để áp dụng.
    <button
      type="button"
      onClick={() => setIsSampleMode(false)}
      className="ml-2 underline"
    >
      Đóng
    </button>
  </div>
)}
```

---

## Phase 2B: P1 Fixes (Debug Leakage)

### Task 3: Create Debug Flag System

**Files to Create:**
```
apps/web/src/lib/debug.ts  (new)
```

**Implementation:**

```typescript
// apps/web/src/lib/debug.ts
export const IS_DEBUG = 
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEBUG === "true";

export const SHOW_DEBUG_INFO = IS_DEBUG && 
  process.env.NEXT_PUBLIC_SHOW_DEBUG !== "false";
```

### Task 4: Hide Contract Runtime Debug Panel

**Files to Modify:**
```
apps/web/src/components/documents/published-contract-form-inputs.tsx
```

**Implementation:**

```tsx
import { IS_DEBUG } from "@/lib/debug";

{IS_DEBUG && (
  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
    <div className="text-sm font-black text-blue-950">
      Contract runtime · {contract.templateCode} · v{contract.version}
    </div>
    <div className="mt-1 break-all font-mono text-xs text-blue-700">
      {contractHash}
    </div>
  </div>
)}
```

### Task 5: Clean Template Selector Labels

**Files to Modify:**
```
apps/web/src/components/documents/template-selector-workspace.tsx
```

**Changes:**

| Line | Current | Change To |
|------|---------|----------|
| 788 | "QUANLYVKS / TEMPLATE SELECTOR" | "CHỌN BIỂU MẪU" |
| 852 | "Biểu mẫu trong DB" | "Đã triển khai" |
| 879 | "Catalog API" | "Danh mẫu nền tảng" |
| 1003 | `{templateCatalogMeta.sourceZip}` | Remove entirely or wrap in `{IS_DEBUG && ...}` |

### Task 6: Clean Internal ID Display

**Files to Modify:**
```
apps/web/src/components/documents/generated-document-workspace.tsx
```

**Changes:**

Remove or replace lines 643-647:
```tsx
// Before:
<div className="... text-slate-500">
  Mã biểu mẫu
  <div className="mt-1 font-mono text-lg font-bold text-slate-950">
    #{documentId}
  </div>
</div>

// After (remove entirely or replace with):
<div className="... text-slate-500">
  Số định danh
  <div className="mt-1 font-mono text-lg font-bold text-slate-950">
    {documentId.slice(0, 8)}...
  </div>
</div>
```

### Task 7: Clean Badge Labels

**Files to Modify:**
```
apps/web/src/lib/form-platform-catalog.ts
```

**Changes:**

| Line | Current | Change To |
|------|---------|----------|
| 83 | "Published contract" | "Đã xuất bản" |
| 85 | "Published contract" | "Đã xuất bản" |

---

## Phase 2C: P2 Fixes (Design System)

### Task 8: Create Design Token File

**Files to Create:**
```
apps/web/src/lib/design-tokens.ts
```

```typescript
// apps/web/src/lib/design-tokens.ts
export const DESIGN_TOKENS = {
  colors: {
    primary: "slate-950",
    primaryHover: "slate-900",
    background: "slate-50",
    surface: "white",
    border: "slate-200",
    text: {
      primary: "slate-950",
      secondary: "slate-600",
      muted: "slate-400",
    },
    success: {
      bg: "emerald-100",
      DEFAULT: "emerald-700",
    },
    warning: {
      bg: "amber-100",
      DEFAULT: "amber-700",
    },
    danger: {
      bg: "rose-100",
      DEFAULT: "rose-700",
    },
  },
  spacing: {
    sectionPadding: "p-6",
    pagePadding: {
      x: "px-6",
      y: "py-8",
    },
  },
  radius: {
    section: "rounded-3xl",
    card: "rounded-2xl",
    button: "rounded-xl",
    badge: "rounded-full",
  },
} as const;
```

### Task 9: Create PageShell Component

**Files to Create:**
```
apps/web/src/components/common/page-shell.tsx
```

```tsx
// apps/web/src/components/common/page-shell.tsx
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  breadcrumb?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PageShell({
  breadcrumb,
  title,
  description,
  children,
  className,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-7 md:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {breadcrumb && (
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              {breadcrumb}
            </p>
          )}
          <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </header>
        <div className={className}>{children}</div>
      </div>
    </main>
  );
}
```

### Task 10: Fix Color Palette Inconsistency

**Files to Modify:**
```
apps/web/src/app/reports/page.tsx
```

**Changes:**

Replace all `zinc-*` with `slate-*`:
- `bg-zinc-50` → `bg-slate-50`
- `border-zinc-200` → `border-slate-200`
- `text-zinc-*` → `text-slate-*`
- `bg-zinc-100` → `bg-slate-100`

---

## Phase 2D: P2 Fixes (Accessibility)

### Task 11: Add Form Input Labels

**Files to Modify:**
```
apps/web/src/components/documents/template-selector-workspace.tsx
```

**Changes:**

Wrap inputs in `<label>` elements:
```tsx
// Before:
<input
  value={input.offenseName}
  placeholder="Ví dụ: Đánh bạc..."
  className="h-11 w-full rounded-2xl..."
/>

// After:
<label className="block space-y-1.5">
  <span className="text-sm font-bold text-slate-700">Tội danh</span>
  <input
    value={input.offenseName}
    placeholder="Ví dụ: Đánh bạc..."
    className="h-11 w-full rounded-2xl..."
  />
</label>
```

---

## Tests to Add

### Unit Tests

```typescript
// apps/web/src/features/forms-contracts/sample-data.test.ts
import { describe, it, expect } from 'vitest';
import { getSampleData, mergeWithSampleData } from './sample-data';

describe('Sample Prefill', () => {
  it('getSampleData returns data for BM-001', () => {
    const sample = getSampleData('BM-001');
    expect(Object.keys(sample).length).toBeGreaterThan(0);
  });
  
  it('mergeWithSampleData preserves existing values', () => {
    const existing = { 'person.fullName': 'User Name' };
    const sample = { 'person.fullName': 'Sample Name', 'agency.name': 'Sample Agency' };
    const merged = mergeWithSampleData(existing, sample);
    expect(merged['person.fullName']).toBe('User Name');
    expect(merged['agency.name']).toBe('Sample Agency');
  });
  
  it('mergeWithSampleData fills empty fields', () => {
    const existing = {};
    const sample = { 'person.fullName': 'Sample Name' };
    const merged = mergeWithSampleData(existing, sample);
    expect(merged['person.fullName']).toBe('Sample Name');
  });
});
```

### E2E Tests

```typescript
// tests/e2e/sample-prefill.spec.ts
import { test, expect } from '@playwright/test';

test('sample prefill fills empty fields', async ({ page }) => {
  await page.goto('/documents/1');
  await page.click('text=Điền dữ liệu mẫu');
  // Verify some field has a value
  const agencyName = page.locator('input[name="agency.name"]');
  await expect(agencyName).not.toBeEmpty();
});
```

---

## Validation Commands

After each task:

```bash
# 1. Type check
pnpm typecheck

# 2. Unit tests
pnpm test:web-unit

# 3. Lint
pnpm --filter web lint

# 4. Manual verification
# - Open /templates, verify no debug labels
# - Open /documents/1, click sample prefill, verify fields filled
# - Open /documents/1, verify no contract hash visible
```

Final validation:

```bash
# Run all checks
pnpm typecheck && pnpm test:web-unit && pnpm --filter web lint

# Verify no new issues
git diff --stat
```

---

## Rollback Plan

If any change breaks functionality:

```bash
# Revert specific file
git checkout HEAD -- apps/web/src/components/documents/generated-document-workspace.tsx

# Or revert all changes
git checkout HEAD -- apps/web/src/
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sample prefill overwrites user data | Low | High | `mergeWithSampleData` preserves existing values |
| Debug flag affects production | Low | Medium | Only enabled in development mode |
| Design token changes break layout | Medium | Low | Incremental changes with validation |
| Missing label breaks screen reader | Low | Medium | Only affects template selector inputs |

---

## Files Summary

### New Files to Create
```
apps/web/src/lib/debug.ts
apps/web/src/lib/design-tokens.ts
apps/web/src/components/common/page-shell.tsx
apps/web/src/components/documents/sample-prefill-button.tsx
```

### Files to Modify
```
apps/web/src/components/documents/generated-document-workspace.tsx
apps/web/src/components/documents/published-contract-form-inputs.tsx
apps/web/src/components/documents/template-selector-workspace.tsx
apps/web/src/lib/form-platform-catalog.ts
apps/web/src/app/reports/page.tsx
```

### Files to Create Tests For
```
apps/web/src/features/forms-contracts/sample-data.test.ts
tests/e2e/sample-prefill.spec.ts
```

---

## Next Steps

1. Create new branch: `feat/frontend-productization-phase-2`
2. Implement Phase 2A (P0 fixes) first
3. Test each task incrementally
4. Create PR when all P0 and P1 issues are resolved
5. Plan Phase 2B for P2 fixes
