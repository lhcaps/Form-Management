# QLLAW Form Flight Profile Skeletons — Guard Report

**Generated**: 2026-07-07T10:30:00Z (Phase 8 validation)
**Phase**: FORM FLIGHT PROFILE SKELETON GENERATION
**Status**: PASS

---

## 1. Total expected forms

| Metric | Count |
|---|---|
| Total forms expected | **213** |
| Existing profile files (before) | 2 |
| Missing profile files (before) | 211 |

---

## 2. Generation result

| Metric | Count |
|---|---|
| Generated skeleton profiles | **211** |
| Skipped forms | 0 |
| Overwritten existing profiles | **0** |

### Action distribution

| Action | Count |
|---|---|
| KEEP_RUNTIME_READY (BM-171) | 1 |
| KEEP_EXISTING_SKELETON (BM-001) | 1 |
| GENERATE_SKELETON | 211 |
| SKIP_WITH_REASON | 0 |

---

## 3. Post-generation counts

| Metric | Count |
|---|---|
| Total profile files (on disk) | **213** |
| Total registered profiles (self-registering on import) | **213** discoverable; runtime-imported count is unchanged (panels import what they need) |
| RUNTIME_READY profiles | **1** (BM-171 only) |
| SKELETON profiles | **212** (BM-001 hand-authored + 211 auto-generated) |
| GENERATED_READY_APPROVED profiles | **0** |

### Profile status distribution

| Status | Count |
|---|---|
| runtime-ready (hand-authored) | 1 |
| skeleton (BM-001 hand-authored) | 1 |
| skeleton (auto-generated) | 211 |
| audit-only | 0 |
| missing | 0 |
| invalid | 0 |

---

## 4. Preserved invariants

| Invariant | Status |
|---|---|
| BM-171 preserved as runtime-ready | **YES** (unchanged from HEAD content; git shows `runtimeReady: true` + `profileStatus: "runtime-ready"`) |
| BM-001 preserved as skeleton | **YES** (no diff vs HEAD; runtimeReady / profileStatus flags remain absent) |
| No profile marked runtimeReady except BM-171 | **YES** (guard test #5) |
| No generated skeleton marked fidelity complete | **YES** (no skeleton declares FIDELITY_COMPLETE_EVIDENCED; title is `Biểu mẫu BM-NNN` placeholder, demo is empty) |
| Notes status distribution copied from verified extractor | **YES** — see §5 |

---

## 5. Notes status distribution (from verified extractor)

| Status | Count |
|---|---|
| PASS | 154 |
| NO_NOTES_WITH_EVIDENCE | 59 |
| PARTIAL | 0 |
| FAIL | 0 |
| UNKNOWN | 0 |

Zero forms had notes status PARTIAL / FAIL / UNKNOWN. The extractor
returned 0 body-notes across all 213 forms; this is recorded as an
extractor-side risk and is NOT a skeleton blocker (see §7).

---

## 6. Safety assertions

| Assertion | Status |
|---|---|
| No generated skeleton `runtimeReady=true` | **PASS** (guard test #5 strips comments and asserts no assignment) |
| No generated skeleton `profileStatus="runtime-ready"` | **PASS** (guard test #5) |
| No generated skeleton has non-empty `demo` | **PASS** (guard test #6 asserts `demo: {}`) |
| No generated skeleton has non-empty `acceptance.requiredText` | **PASS** (guard test #6) |
| No generated skeleton marked fidelity complete | **PASS** (no skeleton has any demo / summary / acceptance content) |
| No UI adapter changed | **PASS** (only `apps/web/src/lib/form-flight/profiles/*.ts` and `scripts/audit/*.mjs` were touched) |
| No SOT changed (DOCX, contracts, DB, schema, routes) | **PASS** (only profile inventory + audit script added) |

---

## 7. Risk list

1. **Body notes detection returned 0 forms** (extractor-side). The
   extractor's paragraph-text scan did not find any body-level
   footnote/endnote references. 154 forms have real footnote streams
   in `word/footnotes.xml`, and 59 forms have
   `NO_NOTES_WITH_EVIDENCE`. This is not a skeleton blocker — generated
   skeletons make no claim about notes — but a future fidelity-repair
   phase that promotes skeletons to runtime-ready MUST re-investigate
   body-note detection. Recommended: probe the normalized DOCX
   `word/document.xml` for `<w:footnoteReference>` elements that the
   current paragraph text scan missed.

2. **Title field is `Biểu mẫu BM-NNN` placeholder.** Hand-curated
   Vietnamese titles exist for some forms but the verified extract does
   not surface a stable title string. Future fidelity-repair phases
   should derive the title from the locked contract's
   `formTitle` field or the first paragraph of the DOCX.

3. **Required-field paths are empty for all generated skeletons.**
   This is the safe skeleton default — no locked contract surfaced an
   explicit `requiredFieldKeys` list. When fidelity-repair is done for
   a specific form, the locked contract should be updated to declare
   its required fields and the skeleton should be regenerated.

4. **`fieldPaths` are alphabetically sorted** (not locked-contract
   order). This makes generated diffs stable across re-runs but
   diverges from the locked contract's natural declaration order. The
   BM-001 skeleton uses the locked-contract order; future fidelity
   repair for generated skeletons may want to switch to contract
   order for parity.

5. **211 new files on disk, 0 in the registry map.** The Form Flight
   `registry.ts` map only contains profiles that are runtime-imported
   by panels / tests. Generated skeletons self-register via the
   side-effect `registerFormFlightProfile(...)` call when their file
   is imported. Today no consumer imports them (panels still use
   their own legacy code paths). This is intentional: skeleton
   registration should happen only when a panel decides to consume
   the profile. The next phase that promotes a skeleton to
   runtime-ready will import that single file from the consuming
   panel.

---

## 8. Files changed

### Created (213 files)

| Path | Count | Purpose |
|---|---|---|
| `apps/web/src/lib/form-flight/profiles/bmNNN.ts` | 211 | Auto-generated skeleton profile (BM-002 … BM-213 minus BM-001 + BM-171) |
| `apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | 1 | Lightweight node:test guard (9 assertions, no DB) |

### Audit artifacts

| Path | Purpose |
|---|---|
| `scripts/audit/generate-form-flight-profile-skeletons.mjs` | Idempotent generator with `--dry-run` mode + 846 invariant checks |
| `docs/audit/unified-bm-workspace/QLLAW_FORM_FLIGHT_SKELETON_GENERATION.dry-run.md` | Per-form dry-run plan (213 rows + per-action counts) |
| `docs/audit/unified-bm-workspace/QLLAW_FORM_FLIGHT_PROFILE_SKELETONS.generation.json` | Final generation JSON with invariant check log |
| `docs/audit/unified-bm-workspace/QLLAW_FORM_FLIGHT_PROFILE_SKELETONS.latest.md` | This guard report |

### NOT touched

- Any DOCX (source or normalized).
- Any locked contract JSON.
- Any DB row / migration / Prisma schema.
- Any public API route path.
- Any UI adapter (`bm-NNN-form-inputs.tsx`).
- Any existing profile file (`bm001.ts`, `bm171.ts`).
- The Form Flight `registry.ts` (the registry is a generic
  `Map<string, FormFlightProfile>` — it does not list per-profile
  entries. Self-registration on module import is the existing
  pattern, and adding eager imports would create a runtime takeover
  risk for every form).

---

## 9. Validation commands run

| Command | Exit | Status | Summary |
|---|---|---|---|
| `node scripts/audit/generate-form-flight-profile-skeletons.mjs --dry-run` | 0 | **PASS** | 0 files written (already generated), 213 plan rows, 4 invariants |
| `node scripts/audit/generate-form-flight-profile-skeletons.mjs` | 0 | **PASS** | 211 files written, 846 invariants passed |
| `pnpm --filter web exec tsc --noEmit` | 0 | **PASS** | All 213 generated profiles + existing app code compile clean |
| `pnpm --filter api exec tsc --noEmit` | 0 | **PASS** | API unchanged, compiles clean |
| `node --test apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | 0 | **PASS** | 9/9 guard tests pass |
| `pnpm lint` (web + api) | n/a | n/a | Skipped per phase 8 — lint infrastructure has pre-existing debt (`react-hooks/set-state-in-effect`, etc.); project intake explicitly notes "KHÔNG chặn build hay test; KHÔNG được sửa hàng loạt trong cùng 1 task". |

---

## 10. Next recommended phase

**1. BM-001 Fidelity Repair With Verified Notes**

Rationale: BM-001 is the only hand-authored skeleton (212 generated
skeletons are NOT fidelity-ready). Promoting BM-001 to runtime-ready
is the highest-leverage next step:

- It already has the most complete `bm001-form-inputs-api.ts` helper
  surface in the project.
- It already has a verified NO_NOTES_WITH_EVIDENCE state (after the
  extractor hardening phase).
- A second runtime-ready profile (besides BM-171) proves that the
  promotion pipeline works for forms beyond the canonical pilot.

The 211 auto-generated skeletons should remain as inventory for
fidelity repair; they should NOT be promoted to runtime-ready until
each form has hand-authored demo / summaryLines / acceptance /
render-validation evidence. The "213 Batch Fidelity Repair" option
(#5) is not recommended yet — promoting all 213 simultaneously would
require authoring 213 sets of demo + summaryLines + acceptance,
which is unbounded scope and would inflate the BM-001 second-pilot
into a rewrite of the project.

"Form Flight Skeleton Guard Hardening" (#4) is partially already done
by this phase's `profile-registry-guard.test.mjs`, but more guards
(invariant assertion that `requiredFieldPaths` is a subset of
`fieldPaths` for every generated skeleton, integration test that
imports all 213 modules) can be added incrementally.