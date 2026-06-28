# Worktree Hygiene Snapshot

## Git Status Summary

**Branch:** `fix/documents-canonical-render-payload-snapshot` (ahead of origin)
**Last commit:** `67b45832` — `docs(audit): plan BM-096 signature group evidence review`

## Modified Files (21) — All Codex Changes

### Codex applied contract repairs (MUST NOT COMMIT WITH MY WORK)
```
docs/audit/docx/compiled-v2/BM-003.compiled.json         (Codex)
docs/audit/docx/compiled-v2/BM-021.compiled.json         (Codex)
docs/audit/docx/compiled-v2/BM-022.compiled.json         (Codex)
docs/audit/docx/compiled-v2/BM-025.compiled.json         (Codex)
docs/audit/docx/compiled-v2/BM-032.compiled.json         (Codex)
docs/audit/docx/compiled-v2/BM-036.compiled.json         (Codex)
docs/audit/docx/compiled-v2/BM-096.compiled.json         (Codex)
docs/audit/docx/contracts/locked/BM-003__bb64990bc49b.contract.locked.json  (Codex)
docs/audit/docx/contracts/locked/BM-021__772319486f41.contract.locked.json  (Codex)
docs/audit/docx/contracts/locked/BM-022__13d342bdfc56.contract.locked.json  (Codex)
docs/audit/docx/contracts/locked/BM-025__5dcf0eb7f481.contract.locked.json  (Codex)
docs/audit/docx/contracts/locked/BM-032__cce50086cd38.contract.locked.json  (Codex)
docs/audit/docx/contracts/locked/BM-036__6f4466480a94.contract.locked.json  (Codex)
docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json  (Codex)
```

### Codex audit reports (MUST NOT COMMIT WITH MY WORK)
```
docs/audit/forms-root-cause/latest.json                  (Codex)
docs/audit/forms-root-cause/latest.md                    (Codex)
docs/audit/form-authoring-baselines/audited.md            (Codex)
docs/audit/form-authoring-baselines/matrix.csv           (Codex)
docs/audit/docx/reports/FORM-CONTRACT-DB-PUBLISH.md    (Codex)
scripts/audit/audit-forms-root-cause.mjs                 (Codex)
apps/api/src/modules/form-studio/infrastructure/legacy-renderer-capabilities.generated.ts  (Codex)
```

## Untracked Files (~65) — My New BM-052 Evidence

### My new files (cursor-added evidence)
```
docs/audit/docx-placeholder-renormalization/BM-052/evidence.latest.json
docs/audit/docx-placeholder-renormalization/BM-052/evidence.latest.md
docs/audit/docx-placeholder-renormalization/BM-052/patch-plan.latest.json
docs/audit/docx-placeholder-renormalization/BM-052/patch-plan.latest.md
docs/audit/docx-placeholder-renormalization/BM-052/planner-handoff.latest.json
docs/audit/docx-placeholder-renormalization/BM-052/planner-handoff.latest.md
docs/audit/docx-placeholder-renormalization/BM-052/worktree-hygiene.latest.md    (this file)
docs/audit/docx-placeholder-renormalization/BM-052/worktree-hygiene.latest.json
docs/audit/213-docx-fidelity-board/cursor-resume-from-codex.latest.md
docs/audit/213-docx-fidelity-board/cursor-resume-from-codex.latest.json
scripts/audit/plan-bm052-docx-placeholder-renormalization.mjs
test/bm052-docx-placeholder-renormalization.test.mjs
```

### Codex untracked files (not mine, not to commit)
```
.cursor/rules/qllaw-contract-remediation.mdc               (Codex)
docs/superpowers/plans/2026-06-28-213-docx-fidelity-remediation.md  (Codex)
docs/audit/213-docx-fidelity-board/                     (Codex)
docs/audit/BM096_SINGLE_CANDIDATE_BRIEFING.md            (Codex)
docs/audit/per-form-render-accurate/                     (Codex)
docs/audit/docx-path-binding-*                           (Codex)
docs/audit/docx-placeholder-renormalization/plan.latest.json  (Codex)
docs/audit/docx-placeholder-renormalization/plan.latest.md    (Codex)
scripts/audit/refresh-213-docx-fidelity-board.mjs      (Codex)
scripts/audit/plan-docx-placeholder-renormalization.mjs  (Codex)
scripts/audit/plan-contract-repair-batch-1-evidence.mjs  (Codex)
scripts/audit/lib/                                      (Codex)
scripts/audit/apply-*.mjs                                (Codex)
scripts/audit/investigate-*.mjs                        (Codex)
scripts/audit/draft-*.mjs                              (Codex)
scripts/extract-*.mjs                                    (Codex)
test/213-docx-fidelity-board.test.mjs                  (Codex)
test/contract-repair-batch-*.test.mjs                  (Codex)
test/docx-placeholder-renormalization-plan.test.mjs     (Codex)
test/forms-root-cause-fix-plan.test.mjs                 (Codex)
packages/form-contracts/src/field-labels.ts             (Codex)
packages/form-contracts/test/field-labels.test.ts     (Codex)
```

## Forbidden Mutation Files (read-only)

These must NEVER be mutated by my work:
```
docs/audit/docx/contracts/locked/           ← forbidden
docs/audit/docx/compiled-v2/                ← forbidden
storage/templates/normalized-docx/           ← forbidden
```

## Classification

### codexModifiedFiles (21 files)
All Codex work — must not be mixed with my commit.

### cursorBm052EvidenceFiles (13 files)
My new BM-052 evidence artifacts, safe to commit together:
- `docs/audit/docx-placeholder-renormalization/BM-052/` (8 files)
- `docs/audit/213-docx-fidelity-board/cursor-resume-from-codex.latest.md`
- `docs/audit/213-docx-fidelity-board/cursor-resume-from-codex.latest.json`
- `scripts/audit/plan-bm052-docx-placeholder-renormalization.mjs`
- `test/bm052-docx-placeholder-renormalization.test.mjs`

### generatedAuditReports
None in my worktree change set.

### forbiddenMutationFiles
None mutated. Confirmed: no changes to `locked/`, `compiled-v2/`, or `normalized-docx/`.

### safeToCommitNow
```
cursorBm052EvidenceFiles only (13 files)
```

### mustNotCommitYet
```
codexModifiedFiles (21 files) — Codex's uncommitted work
```

### recommendedCommitPlan

**Commit A (Codex, separate PR):**
Codex should commit their 21 modified files separately.
Do NOT wait for me. Codex's contract repairs and audit refreshes are independent.

**Commit B (My BM-052 evidence, after refinement):**
Only my 13 cursorBm052EvidenceFiles.
Commit message: `docs(audit): refine BM-052 DOCX placeholder renormalization evidence — remove ambiguity`

Do NOT include any Codex-modified files. Do NOT include Codex untracked files. Isolate to exactly the 13 files above.
