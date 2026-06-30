# Test Coverage Audit — QUANLYVKS Frontend Audit V1

> Generated: 2026-06-30

## Current Test Coverage

### Unit Tests

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `api-client.test.ts` | 8 | API error handling, response parsing |
| `central-adapter.test.mjs` | 16 | Case payload application |
| `bm-field-map.test.ts` | 25 bespoke + 4 flat | BM field mappings |
| `form-schema-client.test.ts` | 3 | Form schema fetch |
| `form-validation-errors.test.ts` | 8 | Error parsing |
| `reports-export.test.ts` | 2 | CSV and print HTML generation |
| **TOTAL** | **66** | |

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| None found | — |

### E2E Tests

| Test File | Coverage |
|-----------|----------|
| `tests/e2e/*.spec.ts` | Need to check |

## Test Gaps

### Critical Gaps (P0)

| Gap | Priority | Description | Recommended Test |
|-----|----------|-------------|-----------------|
| Sample prefill button | P0 | No tests for prefill button click | Test button renders, calls mergeWithSampleData |
| Sample preserves user values | P0 | No tests for mergeWithSampleData preserving existing | Test existing values are not overwritten |
| Sample prefill E2E | P0 | No E2E for complete prefill flow | Playwright: click → fill → verify |

### High Priority Gaps (P1)

| Gap | Priority | Description | Recommended Test |
|-----|----------|-------------|-----------------|
| Template selector search | P1 | No tests for search/filter | Test scoring, filtering logic |
| Template selector open | P1 | No tests for open template flow | Test case picker, document creation |
| Form save/reload | P1 | No tests for save → reload | Test save button, payload persistence |
| Export DOCX/PDF | P1 | No tests for export flow | Test export button, download |
| Debug flag behavior | P1 | No tests for debug vs prod mode | Test debug panels hidden in prod |

### Medium Priority Gaps (P2)

| Gap | Priority | Description | Recommended Test |
|-----|----------|-------------|-----------------|
| Section label localization | P2 | No tests for raw vs localized labels | Test labels display correctly |
| Error states | P2 | No tests for error UI | Test error banner, error messages |
| Loading states | P2 | No tests for loading UI | Test loading spinners, skeletons |
| Empty states | P2 | No tests for empty UI | Test empty case list, no results |
| Form validation | P2 | No tests for required field validation | Test validation messages |

### Low Priority Gaps (P3)

| Gap | Priority | Description | Recommended Test |
|-----|----------|-------------|-----------------|
| Mobile layout | P3 | No tests for responsive behavior | Test viewport changes |
| Keyboard navigation | P3 | No tests for tab order | Test focus management |
| Accessibility | P3 | No axe-core tests | Run accessibility scan |

## Recommended Test Additions

### Unit Tests to Add

```typescript
// apps/web/src/features/forms-contracts/sample-data.test.ts
import { describe, it, expect } from 'vitest';
import { getSampleData, mergeWithSampleData } from './sample-data';

describe('getSampleData', () => {
  it('returns sample data for known template code', () => {
    const sample = getSampleData('BM-001');
    expect(sample).toBeDefined();
    expect(Object.keys(sample).length).toBeGreaterThan(0);
  });

  it('returns empty object for unknown template', () => {
    const sample = getSampleData('BM-XXX');
    expect(sample).toEqual({});
  });
});

describe('mergeWithSampleData', () => {
  it('preserves existing user values', () => {
    const existing = { 'person.fullName': 'User Input' };
    const sample = { 'person.fullName': 'Sample Name' };
    const merged = mergeWithSampleData(existing, sample);
    expect(merged['person.fullName']).toBe('User Input');
  });

  it('fills empty fields with sample data', () => {
    const existing = {};
    const sample = { 'person.fullName': 'Sample Name' };
    const merged = mergeWithSampleData(existing, sample);
    expect(merged['person.fullName']).toBe('Sample Name');
  });
});
```

### E2E Tests to Add

```typescript
// tests/e2e/sample-prefill.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sample Prefill', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: create a document
    await page.goto('/templates');
    // ... select template and case
  });

  test('should show sample prefill button', async ({ page }) => {
    await page.goto('/documents/1');
    await expect(page.getByRole('button', { name: /điền dữ liệu mẫu/i })).toBeVisible();
  });

  test('should fill empty fields with sample data', async ({ page }) => {
    await page.goto('/documents/1');
    await page.getByRole('button', { name: /điền dữ liệu mẫu/i }).click();
    // Verify some fields are filled
  });

  test('should preserve user-entered values', async ({ page }) => {
    await page.goto('/documents/1');
    // Enter a value
    await page.locator('input[name="person.fullName"]').fill('My Name');
    // Click sample prefill
    await page.getByRole('button', { name: /điền dữ liệu mẫu/i }).click();
    // Verify my value is preserved
    await expect(page.locator('input[name="person.fullName"]')).toHaveValue('My Name');
  });
});
```

### Accessibility Tests to Add

```typescript
// tests/a11y/template-selector.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('template selector has no accessibility violations', async ({ page }) => {
  await page.goto('/templates');
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Validation Strategy

### Phase 2 Test Additions
1. Add unit tests for `sample-data.ts` functions
2. Add E2E test for sample prefill button
3. Add E2E test for debug flag behavior

### Phase 3 Test Additions
4. Add E2E tests for template selector workflow
5. Add unit tests for form validation
6. Add accessibility tests with axe-core

## Current Test Infrastructure

| Item | Status |
|------|--------|
| Test runner | Vitest (via pnpm test:web-unit) |
| E2E runner | Playwright |
| Coverage tool | Not configured |
| Accessibility scanner | Not configured |
| CI | Not configured |
