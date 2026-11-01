# QLLaw — Customer-local acceptance checklist

Before declaring a customer-local install ready for production use,
verify each item below. This checklist is signed by the customer's
operator and the QLLaw delivery contact.

## Installation

- [ ] OS meets minimum requirements (Windows 10 / 11, Linux x86_64).
- [ ] Node 22.x and pnpm >= 10.0.0 installed.
- [ ] Docker Desktop installed and running.
- [ ] Ports 3000, 3001, 3307 free on the host.
- [ ] `git clone` of the correct release tag/commit completed.
- [ ] `.env` created from `.env.example` and populated with Clerk keys.

## First launch

- [ ] `scripts/local/setup.ps1` exited 0.
- [ ] `scripts/local/doctor.ps1` reports PASS for required rows.
- [ ] `scripts/local/start.ps1` reports healthy endpoints.
- [ ] `scripts/local/status.ps1` shows API 200, Web 200, DB PASS.

## Authentication

- [ ] Clerk publishable + secret keys present in `.env`.
- [ ] First administrator signed in successfully.
- [ ] Administrator role `Officials.Admin` granted through Clerk.
- [ ] Sign-out clears the `__session` cookie.

## Catalogue

- [ ] `scripts/local/smoke.ps1` reports "Catalogue count = 213".
- [ ] At least one form can be opened end-to-end.
- [ ] DOCX download produces a valid file (file size > 1 KB).
- [ ] DOCX content shows form-specific fields, not a placeholder.

## Backup and restore

- [ ] `scripts/local/backup.ps1` produces a non-zero dump.
- [ ] SHA-256 hash of the dump file matches the manifest.
- [ ] `scripts/local/restore.ps1` dry-run prints the expected hash.
- [ ] Optional: restore drill on an isolated host completed.

## Operations

- [ ] `scripts/local/stop.ps1` stops the stack and retains the DB volume.
- [ ] `scripts/local/start.ps1` resumes the stack with the same data.
- [ ] `scripts/local/status.ps1` works while the stack is stopped.

## Security

- [ ] `.env`, `.env.docker`, `.env.docker.demo`, `.env.e2e.local` are
      not present in `git status`.
- [ ] `playwright/.clerk/` is gitignored and not present in
      `git status`.
- [ ] `scripts/release/audit-repository-hygiene.mjs` reports `verdict: PASS`.
- [ ] `scripts/release/audit-secret-scan.py` reports 0 tracked secrets.

## Final sign-off

- [ ] Customer operator confirms acceptance.
- [ ] QLLaw delivery contact confirms acceptance.
- [ ] Installed commit/tag recorded in the customer runbook.
- [ ] Date of acceptance recorded.
