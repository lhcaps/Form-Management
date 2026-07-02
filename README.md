# QUANLYVKS / QLLaw / Form-Management

Hệ thống quản lý hồ sơ vụ án và tự động hóa biểu mẫu pháp lý cho Viện Kiểm sát nhân dân.

**This is a case/document workflow system, not a generic form builder.**

## Core Invariants

```
Clerk authenticates identity.
DB officials/permissions authorize business access.
DOCX contracts are the source of truth.
Standalone templates use runtime preview sessions.
Generated documents use persisted document workspaces.
```

## Project Identity

- **QUANLYVKS / QLLaw / Form-Management**
- **Domain:** Legal case/document workflow for Vietnamese Prosecution Services
- **Stack:** Next.js 16 + NestJS 11 + Prisma + MariaDB + Clerk
- **Package manager:** pnpm workspace

## Key Boundaries

| Route | Flow | Persisted? |
|-------|------|-----------|
| `/templates/:templateCode` | Runtime DOCX/Preview Session | No |
| `/documents/:id` | Generated Document Workspace | Yes (DB rows + audit) |

## Documentation

| File | Purpose |
|------|---------|
| `docs/PROJECT_SPEC.md` | Canonical operating spec |
| `docs/AUTH_RBAC_POLICY.md` | Auth/RBAC invariants |
| `docs/SECURITY_POLICY.md` | Secrets, env, pattern blacklist |
| `docs/TESTING_STRATEGY.md` | Testing layers, E2E |
| `docs/RELEASE_CHECKLIST.md` | Pre-release gates |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start database
pnpm db:up

# Start development servers
pnpm dev

# Run tests
pnpm test
pnpm test:e2e:auth

# Run validation gates
pnpm audit:hardcode
pnpm audit:locked-compiled
pnpm audit:contract-sync
```

## Quick Links

- [Project Operating Spec](docs/PROJECT_SPEC.md)
- [Auth/RBAC Policy](docs/AUTH_RBAC_POLICY.md)
- [Security Policy](docs/SECURITY_POLICY.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Release Checklist](docs/RELEASE_CHECKLIST.md)
