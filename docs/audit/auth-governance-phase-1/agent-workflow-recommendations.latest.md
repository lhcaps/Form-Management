# AUTH GOVERNANCE PHASE 1 — AGENT WORKFLOW RECOMMENDATIONS

**Date:** 2026-06-30
**Phase:** Phase 11 — Agent Workflow Recommendations

---

## 1. CodeGraph Usage for Auth Work

### 1.1 Recommended Queries

For auth-related code exploration, use these CodeGraph queries:

```
# How is auth handled in the API?
auth JWT middleware guard

# How does the frontend handle authentication?
auth context provider session

# Where are permissions checked?
permission guard role check

# How is agency scoping implemented?
agency filter context
```

### 1.2 CodeGraph Health Check

Every session using CodeGraph should report:

```json
{
  "codeGraphHealth": {
    "cliFound": true,
    "projectInitialized": true,
    "cursorMcpConfigured": true,
    "mcpToolAvailableInAgent": true,
    "exploreQuerySucceeded": true,
    "fallbackUsed": false,
    "errors": []
  }
}
```

### 1.3 When NOT to Use CodeGraph

- For reading specific files you're already looking at
- For making edits to known files
- For running tests or validation commands

---

## 2. GStack/Claude-Code Commands (If Available)

### 2.1 Available Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd-plan-phase` | Create detailed phase plan | Before implementing auth PRs |
| `/gsd-code-review` | Review code changes | After each auth PR |
| `/gsd-debug` | Debug auth issues | When auth breaks |
| `/gsd-execute-phase` | Execute planned phase | Running auth implementation |
| `/gsd-verify-work` | Verify implementation | After auth PR merge |

### 2.2 Recommended Workflow

```
1. /gsd-plan-phase auth-foundation
   → Creates detailed plan for PR-1 through PR-7

2. Implement PRs one by one
   → Use CodeGraph for understanding
   → Use standard editor for changes

3. /gsd-code-review auth-clerk-foundation
   → Review PR-1 changes

4. /gsd-verify-work auth-pr-1
   → Verify PR-1 implementation

5. Repeat for each PR
```

### 2.3 Fallback (Manual Equivalents)

If GStack is not available:

```
1. Read relevant files with CodeGraph
2. Write implementation plan in docs/audit/auth-governance-phase-1/
3. Implement PR by PR
4. Run validation manually
5. Request human code review
```

---

## 3. Vertical Slice Strategy

### 3.1 Auth PRs as Vertical Slices

Each auth PR should be a **vertical slice** — working auth from frontend to backend:

```
PR-1: Clerk Foundation
├── Next.js middleware
├── ClerkProvider
├── Sign-in page
├── Auth context
└── User button

PR-2: User Projection
├── DB migration
├── Webhook handler
├── User sync
└── Test fixtures

PR-3: API JWT Validation
├── JWT guard
├── User context
├── Read protection
└── E2E tests
```

### 3.2 Slice Verification

After each PR, verify:

1. **Frontend works** → Can log in, see user info
2. **API works** → Token validation works
3. **DB works** → User sync works
4. **Security works** → Unauthorized access blocked
5. **Tests pass** → No regressions

---

## 4. Security Review Protocol

### 4.1 Pre-Implementation Review

Before each auth PR:

1. **Read the security matrix** for affected routes
2. **Check for new gaps** introduced
3. **Verify mitigations** for existing gaps
4. **Document any exceptions** or acceptable risks

### 4.2 Post-Implementation Review

After each auth PR:

1. **Run security tests** → Unauthorized access tests
2. **Check audit logs** → Events logged correctly
3. **Verify agency isolation** → Cross-agency blocked
4. **Test permission enforcement** → Roles work correctly

### 4.3 Security Checklist

```markdown
## Security Checklist for Auth PRs

### Authentication
- [ ] Login works with new provider
- [ ] Logout works
- [ ] Session expiry handled
- [ ] MFA (if required) works

### Authorization
- [ ] Unauthenticated access blocked
- [ ] Wrong role access blocked
- [ ] Cross-agency access blocked
- [ ] Admin-only routes protected

### Audit
- [ ] Auth events logged
- [ ] Write operations logged
- [ ] Export operations logged
- [ ] Permission changes logged

### Compliance
- [ ] No PII in logs
- [ ] Retention policy applied
- [ ] Export traceability works
- [ ] Hash integrity verified
```

---

## 5. QA Review Protocol

### 5.1 Test Coverage

Each auth PR should have:

| Test Type | Coverage | Tool |
|-----------|----------|------|
| Unit tests | Core auth logic | Jest |
| Integration tests | API endpoints | Supertest |
| E2E tests | Full flows | Playwright |
| Security tests | Unauthorized access | Playwright |

### 5.2 E2E Test Matrix

| Test Case | Expected | Priority |
|-----------|---------|----------|
| Login with valid credentials | Success | P0 |
| Login with invalid credentials | Error | P0 |
| Access protected route without auth | 401/Redirect | P0 |
| Access admin route as regular user | 403 | P0 |
| Access other agency data | 403 | P0 |
| Export creates audit log | Record exists | P1 |
| Export history shows record | Record exists | P1 |
| Self-approval blocked | Error | P2 |

---

## 6. Context Management

### 6.1 Session Size Limits

Auth implementation is complex. Keep context under control:

```
- Read files only when needed
- Use CodeGraph for structure
- Focus on one PR at a time
- Don't read entire codebase
```

### 6.2 Context Documents

Maintain these for auth work:

```
docs/audit/auth-governance-phase-1/
├── baseline.latest.md           # Current state
├── current-auth-map.latest.md  # What's there
├── security-matrix.latest.md   # Route classification
├── security-gaps.latest.md      # Gap registry
├── provider-decision-matrix.latest.md  # Provider choice
├── target-auth-architecture.latest.md # Target design
├── rbac-permission-matrix.latest.md   # Roles/permissions
├── db-schema-plan.latest.md    # DB changes
├── audit-export-history-design.latest.md  # Audit design
├── e2e-auth-strategy.latest.md   # Testing
├── implementation-roadmap.latest.md  # PR sequence
└── this file (agent-workflow-recommendations.latest.md)
```

### 6.3 Handoff Protocol

When handing off auth work:

```json
{
  "handoff": {
    "currentPhase": "auth-governance-phase-1",
    "completedArtifacts": [
      "baseline.latest.md",
      "current-auth-map.latest.md",
      "security-matrix.latest.md",
      "security-gaps.latest.md",
      "provider-decision-matrix.latest.md",
      "target-auth-architecture.latest.md",
      "rbac-permission-matrix.latest.md",
      "db-schema-plan.latest.md",
      "audit-export-history-design.latest.md",
      "e2e-auth-strategy.latest.md",
      "implementation-roadmap.latest.md"
    ],
    "nextStep": "PR-1: Clerk Foundation",
    "recommendation": "PROCEED_TO_CLERK_FOUNDATION",
    "openQuestions": [
      "MFA requirement?",
      "SSO timeline?",
      "Migration strategy?"
    ]
  }
}
```

---

## 7. Cursor Rules (Recommended)

### 7.1 New Rules to Create

```
.cursor/rules/auth-implementation.mdc
```

```mdc
# Auth Implementation Rules

## Before Making Auth Changes

1. Read security matrix for affected routes
2. Check existing gap registry
3. Verify implementation follows RBAC matrix
4. Test authorization locally

## Auth-Specific Guidelines

- Never weaken auth checks
- Always add audit logs for write operations
- Verify agency scoping on all data queries
- Test role-based access before merging
- No hardcoded credentials or tokens

## Verification

- Run auth-specific E2E tests
- Verify unauthorized access is blocked
- Check audit logs are written correctly
```

---

## 8. Rollback Protocol

### 8.1 Quick Rollback

If auth PR causes issues:

```bash
# Rollback to previous commit
git revert HEAD
git push

# Rollback migration
pnpm db:migrate:rollback --steps 1
```

### 8.2 Feature Flags

Consider feature flags for risky auth changes:

```typescript
// apps/api/src/modules/auth/feature-flags.ts
export const AUTH_FEATURE_FLAGS = {
  useClerkAuth: process.env.AUTH_USE_CLERK === 'true',
  enforceAgencyScoping: process.env.AUTH_ENFORCE_AGENCY_SCOPING === 'true',
  enableAuditLogs: process.env.AUTH_ENABLE_AUDIT === 'true',
};
```

---

## 9. CI/CD Integration

### 9.1 Required Checks

```yaml
# .github/workflows/auth.yml
name: Auth Security

on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run auth unit tests
        run: pnpm test:api --grep "auth"

      - name: Run E2E auth tests
        run: pnpm test:e2e --grep "auth"

      - name: Security scan
        run: pnpm audit

      - name: Dependency check
        run: npx npm-check-updates -d clerk
```

### 9.2 Staging Validation

Before merging to main:

1. Deploy to staging environment
2. Run full E2E suite
3. Verify audit logs
4. Check performance impact
5. Get security sign-off
