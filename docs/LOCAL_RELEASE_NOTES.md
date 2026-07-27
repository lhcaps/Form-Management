# QLLaw — Local release notes

## customer-local-baseline-2026-07-27

This release establishes the customer-local delivery baseline for
QLLaw. It merges the work in PR #40 into `main` and verifies the
delivered artifact on a fresh clone.

### Highlights

- 213 locked form contracts (the corpus is complete).
- 213 semantic UI profiles (one per BM).
- 213 catalogue entries exposed via the catalogue API.
- Customer-local installation scripts (`scripts/local/*.ps1`).
- Repository hygiene guard preventing accidental commits of
  secrets, auth state, runtime sessions, and large binaries.
- Dependency security gates: 0 critical, 0 high advisories
  remaining at merge time.

### Installation

See `docs/CUSTOMER_LOCAL_INSTALLATION.md`. The minimum commands are:

```powershell
git clone https://github.com/lhcaps/Form-Management.git
cd Form-Management
git checkout customer-local-baseline-2026-07-27
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\setup.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\start.ps1
```

### Operations

See `docs/CUSTOMER_LOCAL_OPERATIONS.md`, `docs/CUSTOMER_LOCAL_BACKUP_RESTORE.md`,
and `docs/CUSTOMER_LOCAL_TROUBLESHOOTING.md`.

### Known limitations

- `productionReady` remains false. Only 25 forms have been
  runtime-browser-verified end-to-end. The remaining 188 forms are
  catalogued and render server-side DOCX but are not yet
  browser-certified. This is documented in
  `docs/audit/final-213-customer-ready/CURRENT-PROJECT-STATE.md`.
- Customer-local installs run against a single MariaDB instance.
  Production-grade horizontal scaling is a separate deployment.
- LibreOffice rendering uses fallback fonts if Times New Roman is
  not installed on the host. Production deployments should mount a
  licensed TNR font directory.

### Security

- 0 critical and 0 high dependency advisories at merge time.
- `audit-repository-hygiene.mjs` reports `verdict: PASS` on the
  merged main.
- `audit-secret-scan.py` reports 0 tracked secrets and 0 tracked
  auth state.

### Rollback

The release is forward-only. To roll back:

1. Stop the stack: `scripts/local/stop.ps1`.
2. Restore the previous backup: `scripts/local/restore.ps1`.
3. `git checkout <previous-tag-or-commit>`.
4. Re-run setup and start scripts.

If rollback is required after a schema change, an isolated MariaDB
must be used to test the restore before pointing production at it.

### Acknowledgements

This release was assembled by the autonomous release-integration
loop over 23 phases, including safety snapshot, classification of
every dirty and untracked path, secret/auth/data audit, large-file
audit, dependency security check, repository hygiene guard,
customer-local scripts and documentation, and clean-clone
verification.
