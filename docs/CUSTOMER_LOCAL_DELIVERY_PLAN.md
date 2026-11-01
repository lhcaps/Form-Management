# QLLaw — Customer-local delivery plan

This plan is the post-merge delivery roadmap for the customer-local
release of QLLaw. It assumes a successful PR #40 merge to `main`
and a passing clean-clone verification.

## Release state at delivery

| Field | Value |
|---|---|
| `corpusComplete` | true |
| `registeredForms` | 213 |
| `formsMissingFromCorpus` | 0 |
| `mergedToMain` | true |
| `customerLocalReady` | true (only after clean-clone verification) |
| `productionReady` | false (per-form runtime certification incomplete) |
| `securityCritical` | 0 |
| `securityHigh` | 0 |
| `stagedCount` | 0 |

## Stage 1 — Customer local pilot

Goal: validate the install on a customer-controlled machine and
establish an initial administrator.

Tasks:

- [ ] Install per `docs/CUSTOMER_LOCAL_INSTALLATION.md`.
- [ ] Run `scripts/local/setup.ps1`.
- [ ] Run `scripts/local/start.ps1`.
- [ ] Run `scripts/local/doctor.ps1` and confirm PASS.
- [ ] Run `scripts/local/smoke.ps1` and confirm catalogue count = 213.
- [ ] Create the first administrator via Clerk.
- [ ] Verify backup location is writable.
- [ ] Verify Clerk access policy restricts non-administrators.
- [ ] Run the acceptance checklist (`docs/CUSTOMER_LOCAL_ACCEPTANCE_CHECKLIST.md`).

Exit criteria: All acceptance checklist items signed.

## Stage 2 — Operational handoff

Goal: hand the install over to the customer's operator.

Tasks:

- [ ] Train the customer operator on `scripts/local/*`.
- [ ] Walk through backup / restore procedure end-to-end.
- [ ] Walk through logs and troubleshooting runbook.
- [ ] Record the installed commit/tag in the customer runbook.
- [ ] Obtain operator sign-off.

Exit criteria: Operator sign-off, recorded in the runbook.

## Stage 3 — Post-handoff support

Ongoing:

- Bug-fix branches follow the same audit + clean-clone protocol.
- Backup verification cadence: weekly (manual restore drill on
  isolated host).
- Dependency-security review cadence: monthly, or whenever a
  HIGH / CRITICAL advisory is published.
- Upgrade procedure: as documented in
  `docs/CUSTOMER_LOCAL_INSTALLATION.md#upgrade-procedure`.
- Locked DOCX templates are immutable. Any change to a locked
  template requires a new release. Customers do not edit them
  directly.

Exit criteria: N/A — ongoing.

## Stage 4 — Future production certification

`productionReady` remains false at customer-local delivery because
the per-form runtime browser-certification work (Phase 10–14 of the
runtime rollout) is multi-day and not part of this customer-local
release. The corpus of 213 forms is complete and locked; the
runtime-certification work is a separate gate.

Future work to reach `productionReady`:

- Wire the SIGNATURE_SECTION adapter into the runtime render
  pipeline (currently unit-tested but not wired).
- Wire ISSUE_PLACE_DATE, RECIPIENT_COPY, CASE_INFO_BLOCK, and
  OFFICIAL_BLOCK adapters into the runtime pipeline.
- Complete the per-form real-browser Word + LibreOffice R1/R2
  verification for all 213 forms.
- Re-run `audit:forms:corpus` and `gate:forms:213` to confirm no
  source-slot debt remains.
- Re-run `audit:forms:runtime-readiness` to confirm the live
  roster includes all 213 forms.

These tasks are tracked but explicitly out of scope for the
customer-local release.
