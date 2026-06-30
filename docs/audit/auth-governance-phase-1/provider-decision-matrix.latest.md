# AUTH GOVERNANCE PHASE 1 — PROVIDER DECISION MATRIX

**Date:** 2026-06-30
**Phase:** Phase 4 — Provider Decision Matrix (PATCHED: Phase 1B)
**User Decision:** Clerk (confirmed 2026-06-30)

---

## 0. Provider Decision (Final — User Confirmed)

### Chosen Provider: Clerk

### Backup Provider: Auth0/Okta

**Condition for escalation:** Only if enterprise SSO/SAML, centralized IdP integration, procurement/compliance, or customer IAM requirements become mandatory.

### Rejected for Current Architecture: Supabase Auth

**Reason:** Current data layer is MariaDB. Supabase Auth requires Supabase/Postgres/RLS. Migration cost outweighs benefits.

### Not Recommended as Primary: Self-hosted Auth.js/NextAuth

**Reason:** Additional security and maintenance burden. Not designed for legal/government compliance workflows.

---

## 1. Scoring Model (Corrected)

The original scoring model had a flaw: Auth0 scored 119/116, exceeding the maximum. This was because some per-criterion scores exceeded the declared weight ceiling.

The corrected model separates concerns into **5 independent decision categories** rather than a single weighted sum. Each category produces its own verdict; the final provider choice balances across categories.

### 1.1 Category Definitions

| Category | Max | Description |
|----------|-----|-------------|
| MVP Velocity Score | 10 | Speed to production-ready auth for Next.js App Router |
| Current Architecture Fit Score | 10 | Compatibility with existing MariaDB + NestJS stack |
| Enterprise Procurement Score | 10 | SSO/SAML, centralized IdP, compliance features |
| Operational Complexity Score | 10 | DX, maintenance burden, lock-in risk |
| Lock-in / Cost Risk | 10 | Vendor dependency and pricing model |

**Category max per provider: 50**

### 1.2 Provider Comparison

#### Clerk

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| MVP Velocity Score | 10 | 10 | Best Next.js App Router integration, fastest path |
| Current Architecture Fit Score | 8 | 10 | JWT validation works with any DB; needs custom NestJS middleware |
| Enterprise Procurement Score | 6 | 10 | MFA available (paid plan), no native SSO/SAML yet |
| Operational Complexity Score | 9 | 10 | Excellent DX, built-in org model, great docs |
| Lock-in / Cost Risk | 7 | 10 | Moderate lock-in; free tier generous |
| **Total** | **40** | **50** | |

#### Auth0/Okta

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| MVP Velocity Score | 7 | 10 | Universal Login works, less Next.js-native |
| Current Architecture Fit Score | 9 | 10 | JWT validation works with any DB; strong API auth |
| Enterprise Procurement Score | 10 | 10 | Full SAML, OIDC, MFA, best compliance features |
| Operational Complexity Score | 7 | 10 | Good docs, learning curve, configuration complexity |
| Lock-in / Cost Risk | 5 | 10 | High lock-in; more expensive at scale |
| **Total** | **38** | **50** | |

#### Supabase Auth

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| MVP Velocity Score | 6 | 10 | Good DX but designed for Supabase DB |
| Current Architecture Fit Score | 4 | 10 | Current DB is MariaDB — migration required |
| Enterprise Procurement Score | 5 | 10 | SSO in beta, MFA in paid plan |
| Operational Complexity Score | 6 | 10 | Good DX if Supabase-native |
| Lock-in / Cost Risk | 7 | 10 | High lock-in to Supabase ecosystem |
| **Total** | **28** | **50** | |

#### Auth.js / NextAuth

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| MVP Velocity Score | 7 | 10 | Built for Next.js but no native org model |
| Current Architecture Fit Score | 8 | 10 | Works with any DB |
| Enterprise Procurement Score | 3 | 10 | No native MFA/SSO; self-hosted burden |
| Operational Complexity Score | 5 | 10 | Security maintenance falls on team |
| Lock-in / Cost Risk | 10 | 10 | No vendor lock-in; free and open-source |
| **Total** | **33** | **50** | |

### 1.3 Decision Matrix Summary

| Provider | MVP Velocity | Arch Fit | Enterprise | Operations | Lock-in/Cost | Total | Verdict |
|----------|-------------|----------|------------|------------|---------------|-------|---------|
| **Clerk** | **10** | 8 | 6 | **9** | 7 | **40** | **Best for MVP** |
| Auth0 | 7 | 9 | **10** | 7 | 5 | 38 | Best for enterprise |
| Auth.js | 7 | 8 | 3 | 5 | **10** | 33 | Self-hosted option |
| Supabase | 6 | 4 | 5 | 6 | 7 | 28 | DB mismatch |

---

## 2. Decision Logic

### 2.1 If the customer needs SSO/SAML immediately (0–6 months)

**Recommendation: Auth0/Okta**

Auth0 is the only option with first-class SAML/SSO support and centralized IdP integration. If the customer needs to integrate with government identity systems, Auth0 is required.

### 2.2 If the customer prioritizes speed of implementation with no immediate SSO requirement

**Recommendation: Clerk**

Clerk has the best Next.js integration and the fastest time-to-production. If SSO is not an immediate requirement, Clerk is the best choice for rapid development.

### 2.3 If the customer needs complete control with no vendor dependency

**Recommendation: Auth.js**

If vendor lock-in is unacceptable and the team has the expertise, Auth.js provides full control. However, this increases security maintenance burden significantly.

### 2.4 If the customer is already using Supabase

**Recommendation: Supabase Auth**

If the DB is already Supabase/Postgres, Supabase Auth is a natural fit. However, given the current MariaDB setup, migration cost is too high.

---

## 3. Decision Gates

These gates must be evaluated before implementation begins.

### GATE-1 — SSO/SAML

```
IF mandatory SSO/SAML within 0–6 months → escalate to Auth0/Okta
ELSE → Clerk is approved
```

**Current status:** No immediate SSO/SAML requirement. Clerk approved.

### GATE-2 — MFA

```
MFA alone does NOT force Auth0.
Clerk and Auth0 can both support MFA-style production auth.
The decision point is:
  - Enterprise SSO/SAML
  - Centralized IdP integration
  - Procurement/compliance requirements
  - Customer IAM mandates
```

**MFA action:** Verify Clerk project settings and selected plan. MFA alone does not change provider.

### GATE-3 — Clerk Organizations

```
Use Clerk Organizations for agency context.
Keep QUANLYVKS DB authoritative for permissions.
Do not rely on Clerk org roles as the sole business-authorization source.
```

### GATE-4 — Clerk Roles/Permissions

```
Do NOT rely solely on Clerk org roles for legal/business authorization.
Use QUANLYVKS DB roles/permissions and API guards as the authoritative source.
Clerk org role is coarse context only.
```

### GATE-5 — API Security

```
All sensitive API calls must validate Clerk JWT/Bearer token before accepting user identity.
Never trust client-provided agencyId without verifying membership.
```

---

## 4. Clerk Decision Rationale

### Why Clerk for QUANLYVKS

1. **Best Next.js App Router fit** — QUANLYVKS is a Next.js app. Clerk is purpose-built for this.
2. **Organizations map to agencies** — Clerk Organizations directly model the agency hierarchy.
3. **MFA support** — Built-in TOTP MFA available (paid plan). MFA alone does not change provider.
4. **Webhook audit trail** — Auth events can be logged via webhooks.
5. **Fastest implementation** — Reduces time-to-production significantly.
6. **Good free tier** — Suitable for development and low-volume production.
7. **No immediate SSO requirement** — GATE-1 is clear.

### Clerk Concerns and Mitigations

| Concern | Mitigation |
|---------|------------|
| No native SSO/SAML | Clerk supports OIDC which can connect to government IdPs. SAML on roadmap. Auth0 fallback if mandatory. |
| Some lock-in | Keep permission logic in QUANLYVKS DB; use Clerk only for identity, not business authorization. |
| MFA requires paid plan | Verify plan requirements; acceptable for production legal workflow. |

---

## 5. Migration Risk Assessment

### Clerk Migration

| Risk | Severity | Mitigation |
|------|----------|------------|
| Vendor lock-in | Medium | Keep permission logic in DB; use Clerk only for authN |
| Cost increase | Low | Clerk has generous free tier |
| SSO gap | Medium | Use OIDC; plan for SAML when available |
| Data migration | Low | Keep officials table; add Clerk identity mapping |

### Auth0 Migration (if needed)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Higher cost | Medium | Negotiate pricing; use Auth0 free tier for dev |
| Configuration complexity | Medium | Use Auth0 templates for quick start |
| SSO complexity | Low | Benefit, not a risk |
| Data migration | Low | Keep officials table; add Auth0 identity mapping |

---

## 6. Cost Comparison

| Provider | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| Clerk | 10K MAU | $25/mo + $0.02/MAU | Good free tier for dev |
| Auth0 | 7K MAU | $23/mo + $0.005/MAU | More expensive at scale |
| Supabase | 50K MAU | $25/mo | Good free tier, but DB mismatch |
| Auth.js | Free | Free | Self-hosted, no vendor cost |

---

## 7. Final Verdict

**Chosen Provider: Clerk**

**Backup: Auth0/Okta** — escalate only if enterprise SSO/SAML/procurement becomes mandatory.

**Rejected: Supabase Auth** — current architecture is MariaDB, not Supabase/Postgres/RLS.

**Not Primary: Auth.js/NextAuth** — security/maintenance burden not acceptable for legal/government workflow.

---

## 8. Scoring Model Corrections (What Changed)

### Original Problem

The original scoring model had Auth0 at 119/116, exceeding the maximum of 116. This happened because per-criterion scores exceeded the declared weight ceiling in some categories (e.g., "Developer experience" scored 10 against max 8).

### Correction Applied

- Replaced single weighted-sum scoring with **5 independent decision categories**
- Each category is scored independently against a 0–10 scale
- No category score can exceed 10
- Auth0 total: 38/50 (was 119/116)
- Clerk total: 40/50 (was 111/116)
- Final verdict remains Clerk because user has chosen Clerk for current product direction, and Clerk scores highest on MVP Velocity and Operations

### MFA/SSO Rule Correction

Original statement:
> MFA requirement? If yes, switch to Auth0.

Corrected:
> MFA alone does NOT force Auth0. Clerk and Auth0 both support MFA. The decision point is enterprise SSO/SAML, centralized IdP, procurement/compliance, and customer IAM requirements.
