# AUTH GOVERNANCE PHASE 1 — SECURITY GAP AUDIT

**Date:** 2026-06-30
**Phase:** Phase 3 — Security Gap Audit

---

## 1. Gap Registry

### 1.1 Authentication Gaps (AUTH_GAP)

| Gap ID | Severity | File/Route | Description | Exploit Scenario | User Impact | Provider Relevance |
|--------|----------|-----------|-------------|-----------------|-------------|-------------------|
| AUTH_GAP_001 | P0 | `/cases/*`, `/documents/*` | **No cross-agency data isolation.** All case/document endpoints lack `currentUser.agencyId` filter. | Any authenticated user can read/update ALL agencies' cases and documents by directly calling the API. | Data leakage across agencies; unauthorized modification of other agencies' data. | All providers - this is an API-level issue |
| AUTH_GAP_002 | P0 | `/documents/*/render-docx`, `/documents/*/convert-pdf` | **No audit log on document export.** | Exported documents are not traceable to actors. | Cannot fulfill legal/government audit requirements. | All providers - audit event injection needed |
| AUTH_GAP_003 | P0 | All export endpoints | **No export history.** No tracking of exported files, hashes, or actors. | Cannot prove document lineage for legal compliance. | Non-repudiation risk for exported documents. | All providers - export history table needed |
| AUTH_GAP_004 | P0 | `/documents/*/files/*/download` | **No agency ownership verification on file download.** | Any user can download any agency's exported files. | Critical data leakage of legal documents. | All providers - agency check needed |
| AUTH_GAP_005 | P1 | All web routes | **Frontend-only auth check via `AuthGate`.** | Client-side protection can be bypassed by direct API calls or React manipulation. | Backend is authoritative but frontend shows wrong UI. | Clerk/Auth0 - use provider middleware |
| AUTH_GAP_006 | P1 | `/forms/runtime/:templateCode` | **No agency check on runtime form resolution.** | User can access forms from other agencies. | Cross-agency form access. | All providers - agency context needed |
| AUTH_GAP_007 | P2 | `/cases/reports/summary` | **No user context in report summary endpoint.** | Report data may include other agencies' statistics. | Information disclosure. | All providers |
| AUTH_GAP_008 | P2 | `apps/api/src/modules/cases/cases.service.ts` | **`findAll` lacks agency filter.** | No `where: { agency_id: user.agencyId }` clause. | Cross-agency case visibility. | All providers |

### 1.2 Authorization Gaps (AUTHZ_GAP)

| Gap ID | Severity | File/Route | Description | Exploit Scenario | User Impact | Provider Relevance |
|--------|----------|-----------|-------------|-----------------|-------------|-------------------|
| AUTHZ_GAP_001 | P2 | `/admin/form-reviews/*/approve` | **No self-approval prevention.** Creator of a form draft can approve their own submission. | Form editor submits their draft and immediately approves it. | Separation of duties violation. | All providers - business rule |
| AUTHZ_GAP_002 | P2 | `apps/api/src/modules/auth/auth.service.ts` | **`VIEWER` role defined but not enforced anywhere.** | All authenticated users have at least OFFICIAL-level access. | Role model is incomplete. | All providers - role guard needed |
| AUTHZ_GAP_003 | P2 | `/admin/form-versions/*/publish` | **Approver can silently publish without explicit permission.** | Someone with FORM_TEMPLATE_APPROVE can publish without separate publish permission. | Over-privileged role. | All providers - separate publish permission |
| AUTHZ_GAP_004 | P2 | `/admin/form-*` | **No agency filter on form-studio endpoints.** | User with FORM_TEMPLATE_EDIT can edit all agencies' forms. | Cross-agency form editing. | All providers |
| AUTHZ_GAP_005 | P2 | `apps/api/src/modules/auth/auth.guard.ts` | **Admin role bypasses all permission checks.** | Admin can do anything without granular permissions. | Break-glass is too broad. | All providers - consider audit for admin actions |

### 1.3 Audit Gaps (AUDIT_GAP)

| Gap ID | Severity | File/Route | Description | Exploit Scenario | User Impact | Provider Relevance |
|--------|----------|-----------|-------------|-----------------|-------------|-------------------|
| AUDIT_GAP_001 | P0 | `/auth/login`, `/auth/logout` | **Auth events not logged.** Login/logout/password-change not in audit_logs. | Cannot audit who logged in when. | Non-compliance with security audit requirements. | Clerk/Auth0 - webhook event logging |
| AUDIT_GAP_002 | P0 | `/documents/*/render-docx`, `/documents/*/convert-pdf` | **Export operations not logged.** | Cannot prove who exported which document. | Legal document non-repudiation failure. | All providers |
| AUDIT_GAP_003 | P0 | `/documents/*/form-inputs` | **Form input save not logged.** | Cannot audit form data changes. | Audit trail gap for legal documents. | All providers |
| AUDIT_GAP_004 | P1 | `/admin/form-drafts/*` | **Draft save/update not logged.** | Cannot audit form content changes. | Audit trail gap. | All providers |
| AUDIT_GAP_005 | P1 | `/admin/form-permissions/*` | **Permission changes partially logged.** | Some permission operations may not be audited. | Security audit gap. | All providers |
| AUDIT_GAP_006 | P1 | `/admin/form-templates/*` | **Template creation/editing not logged.** | Cannot audit who created/modified templates. | Compliance gap. | All providers |

### 1.4 Export Gaps (EXPORT_GAP)

| Gap ID | Severity | File/Route | Description | Exploit Scenario | User Impact | Provider Relevance |
|--------|----------|-----------|-------------|-----------------|-------------|-------------------|
| EXPORT_GAP_001 | P0 | All export endpoints | **No export permission model.** Any authenticated user can export. | No granular control over who can export legal documents. | Access control gap. | All providers - export permission needed |
| EXPORT_GAP_002 | P0 | All export endpoints | **No export history tracking.** | No record of what was exported, when, by whom. | Legal compliance failure. | All providers - export_history table |
| EXPORT_GAP_003 | P1 | `/documents/*/render-docx` | **No input snapshot hash recorded.** | Cannot verify form data at time of export. | Document integrity gap. | All providers |
| EXPORT_GAP_004 | P1 | `/documents/*/render-docx` | **No contract hash recorded.** | Cannot verify which form contract version was used. | Document integrity gap. | All providers |
| EXPORT_GAP_005 | P2 | `/documents/*/files/*/download` | **No file storage trace in audit.** | Cannot prove file was downloaded. | Non-repudiation gap. | All providers |

### 1.5 Operational Gaps (OPS_GAP)

| Gap ID | Severity | File/Route | Description | Exploit Scenario | User Impact | Provider Relevance |
|--------|----------|-----------|-------------|-----------------|-------------|-------------------|
| OPS_GAP_001 | P1 | `.env.example` | **Seed credentials (`admin/admin123`) in environment files.** | Default password may be used in production. | Credential compromise risk. | All providers - rotation needed |
| OPS_GAP_002 | P1 | `apps/api/src/modules/auth/auth.guard.ts` | **No account lockout after failed login.** | Brute-force attack possible (though rate limited to 5/min). | Credential attack surface. | Clerk/Auth0 - built-in protection |
| OPS_GAP_003 | P2 | `apps/api/src/modules/auth/auth.service.ts` | **No MFA capability.** | Accounts cannot require multi-factor authentication. | Elevated account compromise risk. | Clerk/Auth0 - MFA support |
| OPS_GAP_004 | P2 | `apps/api/src/modules/auth/auth.service.ts` | **No refresh token rotation.** | Long-lived sessions without renewal. | Session security gap. | Clerk/Auth0 - built-in rotation |
| OPS_GAP_005 | P3 | All endpoints | **No webhook sync capability.** | Cannot sync user changes to external systems. | IdP integration gap. | Clerk/Auth0 - webhook support |
| OPS_GAP_006 | P3 | All endpoints | **No SSO/SAML support.** | Cannot integrate with government IdP. | Enterprise integration blocker. | Auth0/Okta - SSO support |

---

## 2. STRIDE Analysis Detail

### 2.1 Spoofing (Authentication)

**Threat:** An attacker impersonates a legitimate user.

**Current Mitigations:**
- Session tokens are cryptographically random (32-byte, SHA-256 hashed)
- Passwords hashed with scrypt
- Rate limiting on login (5/min)

**Gaps:**
- No MFA capability
- No SSO/SAML integration
- Seed credentials in environment files
- No account lockout after failed attempts

**Exploit:** If password is compromised, attacker has full access. No second factor to prevent this.

**Recommended Fix:** Implement MFA via Clerk or Auth0. Both support TOTP and SMS MFA out of the box.

---

### 2.2 Tampering (Integrity)

**Threat:** An attacker modifies data in transit or at rest.

**Current Mitigations:**
- HTTPS recommended for production
- Cookie has HttpOnly flag

**Gaps:**
- No request signing
- No integrity verification for form inputs
- No input snapshot hash for exports

**Exploit:** Man-in-the-middle could modify API requests. No way to verify document integrity.

**Recommended Fix:** Add input snapshot hashing for exports. Consider request signing for high-value operations.

---

### 2.3 Repudiation (Non-Repudiation)

**Threat:** A user denies having performed an action.

**Current Mitigations:**
- Partial audit_logs table exists
- Session has IP address and user agent

**Gaps:**
- Auth events (login/logout/password-change) not logged
- Form save operations not logged
- Export operations not logged
- Permission changes partially logged

**Exploit:** User claims they didn't export a document. No proof exists.

**Recommended Fix:** Comprehensive audit event logging. Clerk/Auth0 webhooks can capture auth events. Custom logging needed for business events.

---

### 2.4 Information Disclosure (Confidentiality)

**Threat:** An attacker gains access to sensitive information.

**Current Mitigations:**
- AuthGuard requires authentication
- HttpOnly cookie prevents XSS token theft

**Gaps:**
- No cross-agency data isolation
- Any authenticated user can access all agencies' data
- Client-side only route protection

**Exploit:** Official from Agency A can access all of Agency B's cases and documents via direct API calls.

**Recommended Fix:** Add `currentUser.agencyId` filter to ALL data queries. Implement server-side middleware for route protection.

---

### 2.5 Denial of Service (Availability)

**Threat:** An attacker prevents legitimate users from accessing the system.

**Current Mitigations:**
- Rate limiting on login (5/min)
- Rate limiting on password change (3/min)

**Gaps:**
- No account lockout after failed attempts
- No rate limiting on other endpoints

**Exploit:** Repeated login attempts could slow the service. No lockout prevents sustained attacks.

**Recommended Fix:** Account lockout after N failed attempts. Rate limiting on all sensitive endpoints.

---

### 2.6 Elevation of Privilege (Authorization)

**Threat:** An attacker gains more permissions than intended.

**Current Mitigations:**
- FormPermissionGuard enforces FORM_TEMPLATE_* permissions
- ADMIN role bypasses all checks

**Gaps:**
- VIEWER role defined but not enforced
- No self-approval prevention
- Approver can publish without separate permission
- ADMIN can do anything (too broad)

**Exploit:** A form editor can approve their own form and publish it without proper review.

**Recommended Fix:** Self-approval prevention. Separate publish permission. Admin action auditing.

---

## 3. Gap Summary by Severity

### P0 — Critical (Before Production)

1. **AUTH_GAP_001:** No cross-agency data isolation (cases, documents)
2. **AUTH_GAP_002:** No audit log on document export
3. **AUTH_GAP_003:** No export history tracking
4. **AUTH_GAP_004:** No agency ownership on file download
5. **AUDIT_GAP_001:** Auth events not logged
6. **EXPORT_GAP_001:** No export permission model
7. **EXPORT_GAP_002:** No export history table

### P1 — High Priority

1. **AUTH_GAP_005:** Client-side route protection only
2. **AUTH_GAP_006:** No agency check on runtime form
3. **OPS_GAP_001:** Seed credentials in env
4. **OPS_GAP_002:** No account lockout
5. **AUDIT_GAP_002:** Export operations not logged
6. **AUDIT_GAP_003:** Form save not logged
7. **EXPORT_GAP_003:** No input snapshot hash
8. **EXPORT_GAP_004:** No contract hash recorded

### P2 — Medium Priority

1. **AUTHZ_GAP_001:** No self-approval prevention
2. **AUTHZ_GAP_002:** VIEWER role not enforced
3. **AUTHZ_GAP_003:** Approver can publish without permission
4. **AUTHZ_GAP_004:** No agency filter on form-studio
5. **AUDIT_GAP_004:** Draft save not logged
6. **AUDIT_GAP_005:** Permission changes partially logged
7. **AUDIT_GAP_006:** Template changes not logged
8. **OPS_GAP_003:** No MFA capability

### P3 — Low Priority (Future)

1. **OPS_GAP_005:** No webhook sync
2. **OPS_GAP_006:** No SSO/SAML
3. **OPS_GAP_004:** No refresh token rotation
4. **EXPORT_GAP_005:** No file download audit

---

## 4. Provider Relevance Matrix

| Gap | Clerk | Auth0 | Supabase | Auth.js | Notes |
|-----|-------|--------|----------|---------|-------|
| AUTH_GAP_001 | ✅ Use org + middleware | ✅ Use org + middleware | ⚠️ Use RLS | ⚠️ Manual | All need API-level fixes |
| AUTH_GAP_002 | ✅ Webhook + custom log | ✅ Webhook + custom log | ⚠️ Custom log | ⚠️ Custom log | All need custom audit |
| AUTH_GAP_005 | ✅ Clerk middleware | ✅ Auth0 middleware | ⚠️ Manual | ⚠️ Manual | Clerk/Auth0 best |
| OPS_GAP_001 | ✅ No seed needed | ✅ No seed needed | ⚠️ May need seed | ⚠️ Need seed | Clerk/Auth0 offload auth |
| OPS_GAP_002 | ✅ Built-in | ✅ Built-in | ⚠️ Manual | ⚠️ Manual | Clerk/Auth0 best |
| OPS_GAP_003 | ✅ TOTP/SMS | ✅ TOTP/SMS | ⚠️ Custom | ⚠️ Custom | Clerk/Auth0 best |
| OPS_GAP_006 | ⚠️ No SSO | ✅ Full SSO/SAML | ❌ No SSO | ❌ No SSO | Auth0 only for SSO |
| EXPORT_GAP_001 | ⚠️ Custom | ⚠️ Custom | ⚠️ Custom | ⚠️ Custom | All need custom |

**Legend:** ✅ = Native support, ⚠️ = Requires custom work, ❌ = Not available
