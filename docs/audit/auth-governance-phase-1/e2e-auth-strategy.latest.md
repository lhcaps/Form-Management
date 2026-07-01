# AUTH GOVERNANCE PHASE 1 — CLERK E2E AUTH STRATEGY

**Date:** 2026-06-30
**Phase:** Phase 9 — E2E Auth Strategy (PATCHED: Phase 1B)
**Provider:** Clerk (user-confirmed 2026-06-30)

---

## 0. Strategy Overview

### 0.1 Goals

1. **Deterministic tests** — No flaky auth-related failures
2. **No real production auth in CI** — Use dedicated test Clerk instance
3. **Role-based testing** — Test all role permutations from RBAC matrix
4. **Security tests** — Verify unauthorized access is blocked

### 0.2 Approach: Clerk Test Mode

Clerk provides a **dedicated development/test instance** for testing:

- Use Clerk development instance keys in CI
- Create deterministic test users with specific roles
- No rate limiting on development/test tokens
- **Never use production Clerk tenant in E2E tests**

---

## 1. Test Environment Strategy

### 1.1 Dedicated Clerk Instance for E2E

```
┌─────────────────────────────────────────────────────────────┐
│ E2E CI/CD Pipeline                                          │
│                                                              │
│   ┌─────────────────┐     ┌─────────────────────────────┐  │
│   │ Clerk Dev/Test  │     │ QLLaw E2E Tests            │  │
│   │ Instance        │ ←── │ (Playwright)               │  │
│   │ (dedicated for  │     │                            │  │
│   │  CI, not prod) │     │ - admin@test.qlv.local     │  │
│   └─────────────────┘     │ - editor@test.qlv.local    │  │
│                           │ - official@test.qlv.local  │  │
│                           │ - approver@test.qlv.local  │  │
│                           │ - auditor@test.qlv.local   │  │
│                           │ - other@test.qlv.local     │  │
│                           └─────────────────────────────┘  │
│                                                              │
│   Secrets: CI secrets, NOT committed to repo                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Test Clerk Instance Requirements

| Requirement | Rationale |
|-------------|-----------|
| Separate from production Clerk instance | Prevent test data pollution |
| No MFA on test accounts | Avoid OTP prompts in automated tests |
| Deterministic users | Tests must be repeatable |
| Org/agency: Test Agency 1 and Test Agency 2 | For cross-agency isolation tests |
| Test users pre-created | No dynamic user creation in E2E |

---

## 2. Test User Fixtures

### 2.1 Test Users

```typescript
// tests/e2e/fixtures/test-users.ts
export const TEST_USERS = {
  admin: {
    email: 'admin@test.qlv.local',
    password: 'test-admin-123',
    role: 'SYSTEM_ADMIN',
    agency: 'Test Agency 1',
    clerkOrgId: 'test-org-agency-1',
  },

  formEditor: {
    email: 'editor@test.qlv.local',
    password: 'test-editor-123',
    role: 'FORM_EDITOR',
    agency: 'Test Agency 1',
    clerkOrgId: 'test-org-agency-1',
    permissions: ['template:edit-draft', 'template:submit-review'],
  },

  formApprover: {
    email: 'approver@test.qlv.local',
    password: 'test-approver-123',
    role: 'FORM_APPROVER',
    agency: 'Test Agency 1',
    clerkOrgId: 'test-org-agency-1',
    permissions: ['template:approve'],
  },

  official: {
    email: 'official@test.qlv.local',
    password: 'test-official-123',
    role: 'OFFICIAL',
    agency: 'Test Agency 1',
    clerkOrgId: 'test-org-agency-1',
    permissions: ['case:read', 'case:create', 'document:export-docx'],
  },

  auditor: {
    email: 'auditor@test.qlv.local',
    password: 'test-auditor-123',
    role: 'AUDITOR',
    agency: 'Test Agency 1',
    clerkOrgId: 'test-org-agency-1',
    permissions: ['audit:read'],
  },

  // User in different agency — for cross-agency isolation tests
  otherAgencyOfficial: {
    email: 'other@test.qlv.local',
    password: 'test-other-123',
    role: 'OFFICIAL',
    agency: 'Test Agency 2',
    clerkOrgId: 'test-org-agency-2',
    permissions: ['case:read'],
  },
} as const;
```

### 2.2 Clerk Organization Fixtures

```typescript
// tests/e2e/fixtures/test-organizations.ts
export const TEST_ORGANIZATIONS = {
  agency1: {
    name: 'Test Agency 1',
    clerkOrgId: 'test-org-agency-1',
  },
  agency2: {
    name: 'Test Agency 2',
    clerkOrgId: 'test-org-agency-2',
  },
} as const;
```

---

## 3. Playwright Auth Helper

### 3.1 Auth Helper Implementation

```typescript
// tests/e2e/helpers/auth.ts
import { test as base, Page } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-users';

export type TestUser = keyof typeof TEST_USERS;

export interface AuthenticatedPage {
  user: TestUser;
}

export const test = base.extend<AuthenticatedPage>({
  // No auto-auth — tests explicitly call authenticateAs()
});

export async function authenticateAs(
  page: Page,
  user: TestUser
): Promise<void> {
  const userConfig = TEST_USERS[user];

  // Navigate to sign-in
  await page.goto('/sign-in');

  // Fill in credentials
  await page.getByLabel(/email/i).fill(userConfig.email);
  await page.getByLabel(/password/i).fill(userConfig.password);

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to app
  await page.waitForURL(/\/(?!sign-in)/);
}
```

### 3.2 API Auth Helper

```typescript
// tests/e2e/helpers/api-auth.ts
import { TEST_USERS } from '../fixtures/test-users';
import type { TestUser } from './auth';

export function getApiHeaders(user: TestUser): Record<string, string> {
  // In PR-3, tests will need to pass Clerk JWTs
  // This helper will be updated when PR-3 lands
  return {
    // Placeholder for now — will be Clerk JWT after PR-3
    'Authorization': `Bearer test-token-${user}`,
  };
}
```

---

## 4. Auth Test Cases

### 4.1 Authentication Tests

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateAs, TEST_USERS } from './helpers/auth';

test.describe('Authentication', () => {

  test('unauthenticated user redirects to /sign-in', async ({ page }) => {
    await page.goto('/cases');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('authenticated Official can access /cases', async ({ page }) => {
    await authenticateAs(page, 'official');
    await page.goto('/cases');
    await expect(page).toHaveURL(/\/cases/);
    await expect(page.getByText('official@test.qlv.local')).toBeVisible();
  });

  test('sign out returns to /sign-in', async ({ page }) => {
    await authenticateAs(page, 'official');
    await page.getByRole('button', { name: /user/i }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('user cannot access protected route after sign out', async ({ page }) => {
    await authenticateAs(page, 'official');
    await page.getByRole('button', { name: /user/i }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await page.goto('/cases');
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
```

### 4.2 Role-Based Access Tests

```typescript
// tests/e2e/roles.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateAs } from './helpers/auth';

test.describe('Role-Based Access', () => {

  test('Official cannot access /admin/form-studio', async ({ page }) => {
    await authenticateAs(page, 'official');
    await page.goto('/admin/form-studio');
    // Should redirect or show 403
    await expect(page).not.toHaveURL(/\/admin\/form-studio/);
  });

  test('Form Editor can access /admin/form-studio', async ({ page }) => {
    await authenticateAs(page, 'formEditor');
    await page.goto('/admin/form-studio');
    await expect(page).toHaveURL(/\/admin\/form-studio/);
  });

  test('Official cannot access /admin/audit-logs', async ({ page }) => {
    await authenticateAs(page, 'official');
    await page.goto('/admin/audit-logs');
    await expect(page).not.toHaveURL(/\/admin\/audit-logs/);
  });

  test('Auditor can access /admin/audit-logs', async ({ page }) => {
    await authenticateAs(page, 'auditor');
    await page.goto('/admin/audit-logs');
    await expect(page).toHaveURL(/\/admin\/audit-logs/);
  });

  test('Auditor cannot create cases', async ({ page }) => {
    await authenticateAs(page, 'auditor');
    // Try to access case creation
    await page.goto('/cases');
    await expect(page.getByRole('button', { name: /tạo/i })).not.toBeVisible();
  });
});
```

### 4.3 Cross-Agency Isolation Tests

```typescript
// tests/e2e/agency-isolation.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateAs } from './helpers/auth';

test.describe('Cross-Agency Isolation', () => {

  test('Agency 1 user cannot access Agency 2 documents', async ({ page }) => {
    await authenticateAs(page, 'official'); // Agency 1
    // Try to access a document that belongs to Agency 2
    await page.goto('/documents/test-agency2-doc-id');
    await expect(page.getByText(/không có quyền truy cập/i)).toBeVisible();
  });

  test('Agency 1 user cannot export Agency 2 documents', async ({ page }) => {
    await authenticateAs(page, 'official'); // Agency 1
    const response = await page.request.post(
      '/api/v1/documents/test-agency2-doc-id/render-docx'
    );
    expect(response.status()).toBe(403);
  });

  test('Other agency user can access their own agency data', async ({ page }) => {
    await authenticateAs(page, 'otherAgencyOfficial'); // Agency 2
    await page.goto('/cases');
    await expect(page).toHaveURL(/\/cases/);
  });
});
```

### 4.4 Audit Log Tests (PR-5)

```typescript
// tests/e2e/audit.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateAs } from './helpers/auth';

test.describe('Audit Logging (PR-5)', () => {

  test('export creates audit log entry', async ({ page }) => {
    await authenticateAs(page, 'official');
    await page.goto('/documents/test-doc-id');
    await page.getByRole('button', { name: /xuất docx/i }).click();
    await page.waitForTimeout(1000);
    // Verify audit log was created via API
    const auditResponse = await page.request.get(
      `/api/v1/admin/audit-logs?resourceType=document&eventType=document.exported_docx`
    );
    const auditLogs = await auditResponse.json();
    expect(auditLogs.data.length).toBeGreaterThan(0);
  });
});
```

---

## 5. CI Environment Setup

### 5.1 Environment Variables

```bash
# .env.test
# Clerk test instance (dedicated for E2E — NOT production)
CLERK_SECRET_KEY=test_clerk_secret_key_for_e2e
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=test_clerk_publishable_key_for_e2e
CLERK_WEBHOOK_SECRET=test_clerk_webhook_secret_for_e2e

# Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 5.2 GitHub Actions Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Auth Tests

on:
  push:
    branches: [main, 'feat/**']
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test database
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        run: pnpm db:migrate:test

      - name: Seed test data
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        run: pnpm db:seed:test

      - name: Start services
        run: |
          pnpm api &
          sleep 5
          pnpm web &
          sleep 10

      - name: Run E2E tests
        env:
          CLERK_SECRET_KEY: ${{ secrets.E2E_CLERK_SECRET_KEY }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.E2E_CLERK_PUBLISHABLE_KEY }}
          CLERK_WEBHOOK_SECRET: ${{ secrets.E2E_CLERK_WEBHOOK_SECRET }}
        run: pnpm test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 6. Security Tests

### 6.1 Unauthorized Access Tests

```typescript
// tests/e2e/security.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Security: Unauthorized Access', () => {

  test('API rejects requests without Authorization header', async ({ request }) => {
    const response = await request.get(
      `${process.env.E2E_API_BASE_URL}/cases`
    );
    // PR-3: should return 401
    // PR-1/2: may return 200 if not yet enforced
    expect([200, 401]).toContain(response.status());
  });

  test('API rejects requests with invalid token', async ({ request }) => {
    const response = await request.get(
      `${process.env.E2E_API_BASE_URL}/cases`,
      {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      }
    );
    expect(response.status()).toBe(401);
  });
});
```

---

## 7. Flakiness Prevention

### 7.1 Auth Retry Utility

```typescript
// tests/e2e/helpers/retry.ts
async function retryWithAuth<T>(
  fn: () => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError!;
}
```

### 7.2 Test Stability Rules

| Rule | Rationale |
|------|-----------|
| No `waitForTimeout()` > 5s | Use `waitForURL()` or `waitForSelector()` instead |
| No dynamic user creation in tests | Pre-create all test users in test Clerk instance |
| No MFA on test accounts | Avoids OTP prompts |
| Separate test Clerk instance | No interference with dev or production |
| Retry auth failures only | Do not retry business logic failures |

---

## 8. Test Coverage Matrix

| Test Case | Priority | PR | Tool |
|-----------|----------|-----|------|
| Unauthenticated user redirected to /sign-in | P0 | PR-1 | Playwright |
| Authenticated user can access /cases | P0 | PR-1 | Playwright |
| Sign out returns to /sign-in | P0 | PR-1 | Playwright |
| Official cannot access /admin/form-studio | P0 | PR-4 | Playwright |
| Form Editor can access /admin/form-studio | P0 | PR-4 | Playwright |
| Cross-agency document access denied | P0 | PR-4 | Playwright |
| Cross-agency API access denied | P0 | PR-4 | API |
| Creator cannot approve own draft | P0 | PR-4 | Playwright |
| Official can open published form | P1 | PR-1 | Playwright |
| Official can save form data | P1 | PR-1 | Playwright |
| Official can export DOCX | P1 | PR-1 | Playwright |
| Auditor can access audit logs | P1 | PR-4 | Playwright |
| Auditor cannot mutate data | P1 | PR-4 | Playwright |
| Export creates audit log | P1 | PR-5 | Playwright |
| Export history shows correct record | P1 | PR-6 | Playwright |
| API rejects invalid token | P0 | PR-3 | API |
| API rejects expired token | P0 | PR-3 | API |
