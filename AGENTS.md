# AGENTS.md (project root)

> This file is the **project-specific** AGENTS file for QUANLYVKS/QLLaw.
> It tells future AI agents what this project is and what rules apply.

## What this project is

**QUANLYVKS / QLLaw / Form-Management** is a legal case/document workflow system for
Vietnamese Prosecution Services (Viện Kiểm sát nhân dân), not a generic form builder.

It manages:
- Case files and legal proceedings
- 213 locked/compiled legal form contracts (biểu mẫu pháp lý)
- DOCX/PDF generation from cases + templates
- Document review and governance
- Agency-scoped authorization
- Audit history

**Source of truth:** DOCX contracts/templates are the layout authority. Users must not
freely edit legal document layout.

## Core business invariants

```
Clerk authenticates identity.
DB officials/auth_identities authorize business access.
DOCX contracts are source of truth.
Generated document workspace is the persisted legal-document workspace.
Runtime preview session is temporary and only for standalone templates.
```

## Hard boundary

```
Standalone template = Runtime DOCX/Preview Session. No persisted document.
Persisted document = Generated Document Workspace. Has DB rows + audit logs.
Do not mix these two flows.
```

## Project-specific rules (override universal rules)

- Do NOT mutate 213 locked DOCX contracts/templates unless explicitly scoped.
- Respect `/templates` vs `/documents` boundary — they are different flows.
- Clerk authenticates identity; DB officials/permissions authorize business access.
- `qlv_session` cookie is NOT valid for Clerk-protected web route E2E.
- Playwright protected web E2E uses Clerk ticket strategy + storageState.
- dotenv is standard for Node-side tooling/E2E; do not use custom env parsers.
- Do not commit secrets, auth state, generated session files, or screenshots with tokens.

## AI agent guidelines

```
- Map architecture before changing code.
- Keep diffs minimal.
- Every change needs validation commands.
- Final report must include changed files, reasons, tests, risks, rollback.
- Run validation gates before declaring success.
- Log failures to .ai/harness/failure-log.md when the agent fails.
```

## Skills to prefer

- `plan` — almost every change starts here.
- `code-review` — every PR.
- `debug` — investigate known failing things.

## Skills to ignore

- `image-to-code` — no UI generation needed.
- `motion-design` — no complex animation needed.

## Repo map

```
apps/
  api/     → NestJS backend (API prefix: /api/v1)
  web/     → Next.js frontend
packages/
  form-contracts/ → schema/contract/render logic for 213 forms
scripts/
  audit/*.mjs     → audit gates and validation scripts
docs/
  PROJECT_SPEC.md       → canonical operating spec
  AUTH_RBAC_POLICY.md   → auth/RBAC invariants
  SECURITY_POLICY.md    → secrets, env, pattern blacklist
  TESTING_STRATEGY.md   → testing layers, E2E
  RELEASE_CHECKLIST.md  → pre-release gates
```

## Local overrides

- **Do NOT add real secrets** — use `.env.example` / `.env.e2e.example` as templates.
- **Do NOT commit `.env.local`**, `.env.e2e.local`, or `playwright/.clerk/`.
- **Do NOT use `E2E_CLERK_USER_PASSWORD`** — ticket strategy does not need password.
