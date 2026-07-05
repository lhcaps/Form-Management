# EXECUTOR REPORT — BM171 REQUIRED PLACEHOLDER GATE AND PREVIEW TEXT FINAL FIX

## 1. Status

```
STATUS:                          PASS
COMMIT_CREATED:                  NO
LOCKED_CONTRACTS_MUTATED:        NO
NORMALIZED_DOCX_MUTATED:         NO
SOURCE_DOCX_MUTATED:             NO
PLACEHOLDER_REQUIRED_VALUES_BLOCKED: YES
DEMO_USES_REAL_SYNTHETIC_VALUES: YES
```

**One-line verdict:** Placeholder/stale-fallback values for required fields are now treated as missing-required across runtime preview, payload sanitization, Form Flight validation, and the acceptance scanner; BM-171 demo is rebuilt with real synthetic owner (`Nguyễn Văn A`) and signer (`Trần Thị B`); all audits, lint, type-check, unit tests, and reproduction scripts pass.

---

## 2. Root Cause

| # | Issue | Cause | Fix |
|---|---|---|---|
| C1 | `Cho ông/bà:` empty in PDF | `assetOwner.fullName` carried the placeholder `Người nhận (mẫu)`; payload sanitizer previously "preserved" stale draft because `profile.demo` was itself stale. | Centralized `isKnownStaleFallback` blocklist (`apps/web/src/lib/runtime-ux/placeholder-blocklist.ts`); payload sanitizer now **clears** stale draft values (no preservation); `demo-reset` refuses to overwrite with a stale demo; `collectMissingRequired` flags `STALE_FALLBACK` reason; UI gates preview/export with red error state. |
| C2 | Điều 2 contained `người nhận (mẫu)` | `assetReturn.executionRequestLine` derived from a stale draft owner name. | Same blocklist + missing-required gate covers the source; acceptance scanner (`forbiddenText: "người nhận (mẫu)"`) now fails the build if it leaks; demo fixture rebuilt so `executionRequestLine` references `Nguyễn Văn A`. |
| C3 | Signer name missing in PDF | `signature.signerName` was `Người ký (mẫu)`; payload sanitizer preserved the stale value. | Same fix as C1; demo fixture rebuilt to `Trần Thị B`; profile `BM171_STALE_FALLBACKS` lists `Người ký (mẫu)`; acceptance contract requires `Trần Thị B` to be present after `VIỆN TRƯỞNG`. |
| C4 | Warning panel said "stale fallback preserved because profile demo value is missing or itself stale" | `buildRuntimePreviewPayloadFromDraft` previously fell back to the stale draft value if `profile.demo` was missing/stale. | Removed the preserve-stale branch in `preview` / `export` modes; emit `STALE_FALLBACK_CLEARED` warning; emit `DEMO_VALUE_IS_STALE` / `DEMO_VALUE_IS_PLACEHOLDER` for the demo-reset case. |
| C5 | Summary card displayed `—` for empty, but placeholder still leaked as data | Summary resolvers used `readNestedString` which only checked emptiness. | Introduced `readSummaryValue` helper that also calls `isKnownStaleFallback` and returns `undefined` so the summary falls back to `—`. |
| C6 | Date format displayed as `08/9/1985` (single-digit month) in some artifacts | Demo fixture had `08/9/1985`. | Demo fixture normalized to `08/09/1985`; reproduction script `mustContain` anchors updated; tests assert `dd/MM/yyyy` whole-string match. |

---

## 3. Files Changed

| File | Change | Reason | Risk |
|---|---|---|---|
| `apps/web/src/lib/runtime-ux/placeholder-blocklist.ts` (NEW) | Centralized stale fallback list + `isKnownStaleFallback` / `listKnownStaleFallbacks` (whole-value match, case-preserving, trimmed) | Single source of truth across workspace, payload sanitizer, Form Flight gate | Low — additive module |
| `apps/web/src/lib/runtime-ux/index.ts` | Re-export `isKnownStaleFallback`, `listKnownStaleFallbacks` | Public API | Low |
| `apps/web/src/lib/runtime-ux/runtime-preview-payload.ts` | `preview` / `export` modes now **clear** stale required values (emit `STALE_FALLBACK_CLEARED`); `demo-reset` clears paths whose demo is itself stale (emit `DEMO_VALUE_IS_PLACEHOLDER` / `DEMO_VALUE_IS_STALE`); removed local `isKnownStaleFallback`, now imported from `./placeholder-blocklist`; updated JSDoc and `BuildPayloadWarning` type | Implement "do not preserve stale fallback for required fields" | Low — semantic break of stale-preserving fallback is intentional; covered by tests |
| `apps/web/src/lib/form-flight/validation.ts` | `collectFormFlightMissingRequired` adds `STALE_FALLBACK` reason; relative import for `placeholder-blocklist` to avoid `@/` alias resolution under `tsx` | Hard blocker rule | Low |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | Local `collectMissingRequired` returns structured `{path, reason}`; preview/export error message lists Vietnamese labels and notes stale placeholder state; `isKnownStaleFallback` imported | Surface the block at the call site; tests rely on the structured reason | Low |
| `apps/web/src/lib/form-flight/profiles/bm171.ts` | Demo fixture uses real synthetic names; `BM171_STALE_FALLBACKS` expanded; acceptance contract requires `Nguyễn Văn A` and forbids `(mẫu)` variants; summary lines use `readSummaryValue` to hide placeholders as `—` | The semantic blocker | Medium — affects generated-doc flow as well; covered by `bm171-shared-core.test.ts` |
| `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` | Mirrors the canonical profile changes; placeholder for `signature.signerName` reset to empty | Runtime UX parity with canonical profile | Low |
| `apps/web/src/lib/runtime-ux/runtime-preview-payload.test.ts` | Stale-fallback test rewritten to assert **clear** behavior; added Case B-equivalent tests; fixed `brokenProfile` construction | Test invariants | Low |
| `apps/web/src/lib/form-flight/bm171-shared-core.test.ts` | Acceptance scanner test renders `Nguyễn Văn A`; added forbidden-fragment failure case; added demo-fixture and gate tests | Test parity | Low |
| `apps/web/src/lib/form-flight/bm171-runtime-ux-profile.parity.test.ts` | `CANONICAL_BM171_VALUES` reflects synthetic names + `08/09/1985`; `forbiddenFragments` expanded | Production-vs-runtime parity | Low |
| `apps/web/src/lib/form-flight/bm171-required-placeholder-gate.test.ts` (NEW) | Focused unit tests for Cases A–E | Required by spec §8 | Low |
| `apps/web/src/lib/runtime-ux/placeholder-blocklist.test.ts` (NEW) | Whole-value matching, case/trim correctness, completeness | New module coverage | Low |
| `scripts/audit-runtime-hardcodes.mjs` | `isAuditExcluded` allows `apps/web/src/lib/runtime-ux/bm*.ts`, `apps/web/src/lib/form-flight/profiles/bm*.ts`, `placeholder-blocklist.ts` | Reconciling audit policy with mandatory synthetic names | Low — well-scoped exclusion |
| `apps/api/scripts/reproduce-bm171-runtime-preview-before.mjs` | `mustContain` updated to `'08/09/1985'` and adds `'Nguyễn Văn A'`, `'Trần Thị B'`; `mustNotContain` adds placeholder variants | Reflect new fixture | Low |
| `apps/api/scripts/reproduce-bm171-runtime-preview-after.mjs` | Same updates as before-script | Reflect new fixture | Low |

---

## 4. Acceptance Matrix

| Case | Result | Evidence |
|---|---|---|
| A — demo reset fills `Nguyễn Văn A` | **PASS** | `docs/audit/bm171-required-placeholder-gate/BM171_DEMO_RESET_TEXT.latest.txt` includes `Cho ông/bà: Nguyễn Văn A`; `…-after-…-CHECKS.latest.json` anchor `"Nguyễn Văn A"` present; `(mẫu)` forbidden anchors all absent |
| A — demo reset fills `Trần Thị B` | **PASS** | Same text shows `… Trần Thị B` directly after `VIỆN TRƯỞNG`; anchor present in checks JSON |
| B — placeholder `fullName` blocks preview | **PASS** | `docs/audit/bm171-required-placeholder-gate/BM171_PLACEHOLDER_BLOCK.latest.json` reports `assetOwnerFullName: missing`, `missingRequiredDetected` includes `assetOwner.fullName`, `missingCount: 3`, `renderEndpointCalled: false`, `docxGenerated: false`, `errorStateVisible: true`, `greenSuccessStateVisible: false` |
| B — placeholder `signerName` blocks preview | **PASS** | Same artifact reports `signatureSignerName: missing` and `signature.signerName` in `missingRequiredDetected` |
| B — summary hides placeholder as `—` | **PASS** | `apps/web/src/lib/form-flight/bm171-required-placeholder-gate.test.ts` Case D |
| C — user owner override appears in text | **PASS** | `docs/audit/bm171-required-placeholder-gate/BM171_USER_OVERRIDE_TEXT.latest.txt` — `Cho ông/bà: Trần Văn User`, no `(mẫu)`; `…-USER_OVERRIDE_CHECKS.latest.json` confirms all forbidden anchors absent |
| C — user signer override appears in text | **PASS** | Same artifact — `Ký thay / VIỆN TRƯỞNG / Người Ký User` |
| Điều 2 uses valid owner name | **PASS** | `…-after-…` text shows `… cho ông Nguyễn Văn A …`; forbidden anchor `người nhận (mẫu)` absent |
| no placeholder leaks into render text | **PASS** | `…-AFTER_CHECKS.latest.json`: `mustNotContainAll: true` for `Người nhận (mẫu)`, `Người ký (mẫu)`, `người nhận (mẫu)`; same for `…-BEFORE_CHECKS.latest.json` |
| date format `dd/MM/yyyy` | **PASS** | Both `Sinh ngày 08/09/1985` and `Cấp ngày 14/12/2021` present in `BM171_DEMO_RESET_TEXT.latest.txt` |
| document number spacing | **PASS / OK** | Both `Số: 01/QĐ-VKSKV7` (literal space) in `BM171_DEMO_RESET_TEXT.latest.txt` and `Số: 99/QĐ-USER` in `BM171_USER_OVERRIDE_TEXT.latest.txt`; the locked DOCX was not mutated |

---

## 5. Validation Commands

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter web lint` | 0 | eslint passed (no findings) |
| `pnpm --filter web exec tsc --noEmit` | 0 | TypeScript clean (apps/web) |
| `pnpm --filter api lint` | 0 | eslint passed (no findings) |
| `pnpm --filter api exec tsc --noEmit` | 0 | TypeScript clean (apps/api) |
| `pnpm --filter @qllaw/form-contracts exec tsc --noEmit` | 0 | TypeScript clean (form-contracts) |
| `pnpm audit:hardcode` | 0 | `Runtime hardcode audit passed.` |
| `pnpm audit:locked-compiled` | 0 | `213/213 consistent` — no locked compilation drift |
| `pnpm audit:contract-sync` | 0 | `CI Gate PASSED - All contracts synced` |
| `pnpm audit:bm-final -- BM-171` | 0 | `status=PASS harnessReady=true rolloutReady=true` |
| `pnpm audit:bm-rollout-ready -- BM-171` | 0 | `status=READY technicalReady=true manualReviewRequired=false rolloutReady=true` |
| `pnpm audit:bm-source-render-parity -- BM-171` | 0 | `present 39/39, absent 14/14, header 4/4, superscript 0, xml parts 5/5, overall PASS` |
| `pnpm test:web-unit` | 0 | `tests 515 / pass 515 / fail 0 / skipped 0` |
| `pnpm --filter api exec tsx scripts/reproduce-bm171-runtime-missing-required.mjs` | 0 | `BM-171 missing-required gate detects all three mandated required fields.` |
| `pnpm --filter api exec tsx scripts/reproduce-bm171-runtime-stale-cleanup.mjs` | 0 | `BM-171 stale-fallback cleanup passes acceptance checks.` |
| `pnpm --filter api exec tsx scripts/reproduce-bm171-runtime-user-override.mjs` | 0 | `BM-171 user-override preservation passes acceptance checks.` |
| `pnpm --filter api exec tsx scripts/reproduce-bm171-runtime-preview-before.mjs` | 0 | `BM-171 runtime preview BEFORE fix matches production semantics.` |
| `pnpm --filter api exec tsx scripts/reproduce-bm171-runtime-preview-after.mjs` | 0 | `BM-171 runtime preview AFTER fix matches production semantics.` |

---

## 6. Artifacts

| Artifact | Path |
|---|---|
| Markdown (English) | `docs/audit/bm171-required-placeholder-gate/BM171_REQUIRED_PLACEHOLDER_GATE.latest.md` |
| JSON (machine summary) | `docs/audit/bm171-required-placeholder-gate/BM171_REQUIRED_PLACEHOLDER_GATE.latest.json` |
| Demo reset rendered text | `docs/audit/bm171-required-placeholder-gate/BM171_DEMO_RESET_TEXT.latest.txt` |
| Demo reset request payload | `docs/audit/bm171-required-placeholder-gate/BM171_DEMO_RESET_PAYLOAD.latest.json` |
| Placeholder block evidence | `docs/audit/bm171-required-placeholder-gate/BM171_PLACEHOLDER_BLOCK.latest.json` |
| User override rendered text | `docs/audit/bm171-required-placeholder-gate/BM171_USER_OVERRIDE_TEXT.latest.txt` |
| User override request payload | `docs/audit/bm171-required-placeholder-gate/BM171_USER_OVERRIDE_PAYLOAD.latest.json` |
| Executor report (this file) | `docs/audit/bm171-required-placeholder-gate/EXECUTOR_REPORT.latest.md` |

No PDF/browser screenshots are included — the workspace has no browser harness available in this run, so per the spec we do not fake screenshot evidence.

---

## 7. Remaining Risks

| Risk | Severity | Recommendation |
|---|---|---|
| The hardcode audit exclusion for profile modules (`bm*-runtime-ux-profile.ts`, `bm*-profile.ts`, `placeholder-blocklist.ts`) allows synthetic person names. A future profile file with a non-matching name pattern could slip outside the exclusion. | Low | Add a positive guard: profile files must declare a `// @qllaw/profile` pragma in their header. Out of scope here. |
| `executionRequestLine` is not in BM-171's `requiredFieldPaths`. The Form Flight missing-required gate intentionally does not flag it as `MISSING`. Coverage comes from the payload sanitizer (clears the stale value) and the acceptance scanner (`forbiddenText`). | Low | If a future spec explicitly requires `executionRequestLine` to be a required field, add it to `requiredFieldPaths` and the gate will then flag placeholders as `STALE_FALLBACK`. |
| Several reproduction scripts in `apps/api/scripts/` were updated to reflect the new fixture (`08/09/1985` instead of `08/9/1985`). Downstream consumers of these scripts' `latest.*` artifacts need to be aware. | Low | Document the fixture-change in commit message. |
| The new `isKnownStaleFallback` performs exact-string matching. A user typing the placeholder text inside a longer sentence (e.g., `… người nhận (mẫu) nào đó …`) will not be flagged by the missing-required gate for non-required paths. | Low (intentional) | The acceptance scanner (`forbiddenText`) catches the leak in rendered DOCX text. If the product wants substring-level placeholder detection in non-required paths, that is a separate decision. |
| The placeholder blocklist currently lives in `apps/web`. Should the API ever need to evaluate the same blocklist (e.g., server-side pre-validation of templates), a cross-package duplicate could drift. | Low | Move `placeholder-blocklist.ts` to `packages/form-contracts/` if/when needed. Out of scope here. |

---

## 8. Recommendation

**`READY_TO_COMMIT`**

**Reason:** All four blockers reported by the user are fixed (placeholder fullName/signerName block render; Điều 2 derived from real owner name; signature block shows real signer; warning panel correctly flags placeholder state). Demo reset fills `Nguyễn Văn A` and `Trần Thị B`. Summary card hides placeholders as `—`. Date format `dd/MM/yyyy`. Document number spacing intact. 515/515 unit tests pass. All seven required audits pass, including the BM-171-specific rollout-ready gate. No locked/normalized/source DOCX mutated. No auth/RBAC touched. No batch rollout executed (per role contract). The fix is surgical, the test coverage is comprehensive, and the artifacts are reproducible.

The Executor did NOT commit, push, or open a PR. The git working tree carries the diff for the Planner's downstream review.
