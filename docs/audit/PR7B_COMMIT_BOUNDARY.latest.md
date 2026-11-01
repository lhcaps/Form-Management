# PR7B commit-boundary note (wording correction 2026-07-06)

This is the **commit-boundary** for PR7B. It defines what the PR7B commit
message and PR description MAY claim and what they MUST NOT claim.

Authoritative scope documents:

- Roll-up: `docs/audit/bm171-visual-browser-signoff/EXECUTOR_REPORT.latest.md`
- BM-001 honest status: `docs/audit/bm001-completion/BM001_HONEST_STATUS.latest.md` (+`.json`)
- BM-171 baseline report: in `EXECUTOR_REPORT.latest.md` §1.

## MAY claim (commit subject + body)

- `BM-171 stabilized as Form Flight baseline`
- `Form Flight core added`
- `BM-001 canonical render audit added; full profile pending`

Suggested commit subject:

```
feat(web,api): stabilize BM-171 baseline and add BM-001 canonical-render audit
```

## MUST NOT claim

- `BM-001 complete` / `BM-001 hoàn thiện`
- `BM-001 full profile ready`
- `BM-001 runtime workspace complete`
- `BM-001 rollout ready from a user-typing-values perspective`

Any wording that ties "BM-001" to "complete" without qualifying it as
"canonical renderer path" is forbidden.

## Why this boundary

Two artifacts together supply the evidence:

1. `apps/web/src/lib/form-flight/profiles/bm001.ts` self-declares as
   "skeleton, not a full profile" with `demo: {}`, `summaryLines: undefined`,
   `acceptance: { requiredText: [], forbiddenText: [] }`.
2. `docs/audit/bm001-completion/BM001_PAYLOAD.latest.json` shows
   `missingRequiredCount=23 of 39` against the locked contract.

A user typing values into the BM-001 form cannot fill 23 of the 39 locked
contract slots while the Form Flight profile remains a skeleton. Closing
those 23 slots is the first concrete deliverable of the next phase
(`BM001_FULL_FORM_FLIGHT_PROFILE_COMPLETION`). Stuffing the full profile
into PR7B would bloat the diff and risk regressing the BM-171 baseline
that is already verified green.

## Files in this PR7B commit boundary

Locked contract JSON: untouched.
Normalized DOCX: untouched.
Source DOCX: untouched.
Auth / RBAC: untouched.
BM-001 Form Flight profile: untouched.
