# BM171 REQUIRED PLACEHOLDER GATE AND PREVIEW TEXT FINAL FIX

**Task:** `BM171_REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX`
**Status:** ✅ PASS
**Date:** 2026-07-05

---

## 1. Rule Invariant (enforced)

> A required field is **missing** if **any** of the following hold:
> - value is `null` / `undefined`
> - value is empty after `trim()`
> - value exactly matches a known stale fallback (placeholder label)
> - profile.demo value at the same path is missing
> - profile.demo value at the same path is itself a stale fallback

If a required field is missing/stale → block render (no preview session, no DOCX, no PDF).

The known stale fallback list now includes the three BM-171 placeholder strings the user reported:

```
- Người nhận (mẫu)
- người nhận (mẫu)        (lowercase variant found inside Điều 2 sentence)
- Người ký (mẫu)
```

plus the broader Form Flight placeholder blocklist:

```
- Cá nhân/Tổ chức theo quy định.
- Tài sản theo quy định pháp luật
- Mô tả vụ việc mẫu
- Nội dung mẫu cho biểu mẫu pháp lý
```

---

## 2. Architecture

| Layer | Path | Role |
|---|---|---|
| Single source of truth for the blocklist | `apps/web/src/lib/runtime-ux/placeholder-blocklist.ts` | exports `isKnownStaleFallback(v)` and `listKnownStaleFallbacks()` (whole-value match, case-preserving, trimmed) |
| Re-export barrel | `apps/web/src/lib/runtime-ux/index.ts` | surfaces `isKnownStaleFallback` / `listKnownStaleFallbacks` |
| Runtime payload sanitization | `apps/web/src/lib/runtime-ux/runtime-preview-payload.ts` | `demo-reset` mode refuses stale demo values; `preview` / `export` modes **clear** stale draft values (no longer preserve, no longer replace with demo) |
| Required-field gate (Form Flight) | `apps/web/src/lib/form-flight/validation.ts` | `collectFormFlightMissingRequired` now flags `STALE_FALLBACK` reason |
| Required-field gate (workspace) | `apps/web/src/components/documents/template-preview-workspace.tsx` | local `collectMissingRequired` flags `STALE_FALLBACK` reason; preview/export blocks and lists Vietnamese labels |
| BM-171 canonical profile (both runtime + generated document flows) | `apps/web/src/lib/form-flight/profiles/bm171.ts` | demo fixture uses synthetic names; acceptance contract forbids placeholders and requires "Nguyễn Văn A"; missing-required gate triggers on placeholders |
| BM-171 runtime UX profile | `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` | demo fixture mirrored with synthetic names; summary line helper hides placeholders as `—` |
| Hardcode audit exclusion | `scripts/audit-runtime-hardcodes.mjs` | `isAuditExcluded()` now allows `bm*-runtime-ux-profile.ts`, `bm*-profile.ts`, and `placeholder-blocklist.ts` to contain synthetic names |

### Summary card fix

The `summaryLines` resolvers in both BM-171 profiles now wrap `readFormFlightPath` / `readNestedString` in a `readSummaryValue(...)` helper. The helper additionally invokes `isKnownStaleFallback(value)`. If true, it returns `undefined`, which falls back to the `—` glyph. The summary card therefore never displays "(mẫu)" as data.

### Demo reset

`demo-reset` mode in `buildRuntimePreviewPayloadFromDraft` now emits:

- `DEMO_VALUE_IS_PLACEHOLDER` if `profile.demo[path]` is itself a known placeholder
- `DEMO_VALUE_IS_STALE` if `profile.demo[path]` is itself a known stale fallback
- It does **not** overwrite the user's stale draft value with the stale demo. Instead it **clears** the path and treats it as missing-required.

---

## 3. Demo fixture (post-fix)

```ts
BM171_DEMO = {
  "assetOwner.fullName":            "Nguyễn Văn A",
  "signature.signerName":           "Trần Thị B",
  "assetOwner.dateOfBirthText":     "08/09/1985",
  "assetReturn.executionRequestLine":
    "Yêu cầu Phòng Cảnh sát Quản lý hành chính về trật tự xã hội "
    + "thuộc Công an Thành phố Hồ Chí Minh chuyển giao tài sản nêu "
    + "tại Điều 1 cho ông Nguyễn Văn A trong thời hạn 05 ngày làm "
    + "việc kể từ ngày nhận được Quyết định.",
  ...
}
```

The profile list of stale fallbacks now covers:

```ts
BM171_STALE_FALLBACKS = [
  { path: "assetOwner.fullName",            fallback: "Người nhận (mẫu)" },
  { path: "signature.signerName",           fallback: "Người ký (mẫu)"   },
  { path: "assetReturn.executionRequestLine", fallback: "người nhận (mẫu)" },
]
```

And the acceptance contract now forbids them in rendered output:

```ts
BM171_ACCEPTANCE.forbiddenText.push(
  "Người nhận (mẫu)",
  "Người ký (mẫu)",
  "người nhận (mẫu)",
)
BM171_ACCEPTANCE.requiredText = [..., "Nguyễn Văn A"] // synthetic owner required
```

---

## 4. Files changed (surgical)

| File | Change | Reason |
|---|---|---|
| `apps/web/src/lib/runtime-ux/placeholder-blocklist.ts` (NEW) | Centralized stale fallback list + `isKnownStaleFallback` / `listKnownStaleFallbacks` | One source of truth across workspace, payload sanitizer, and Form Flight gate |
| `apps/web/src/lib/runtime-ux/index.ts` | Re-export `isKnownStaleFallback`, `listKnownStaleFallbacks` | Public API |
| `apps/web/src/lib/runtime-ux/runtime-preview-payload.ts` | `preview` / `export` modes CLEAR stale required values (emit `STALE_FALLBACK_CLEARED`); `demo-reset` mode clears paths whose demo is itself stale (emit `DEMO_VALUE_IS_PLACEHOLDER` / `DEMO_VALUE_IS_STALE`); comments updated | Implement "do not preserve stale fallback for required fields" |
| `apps/web/src/lib/form-flight/validation.ts` | `collectFormFlightMissingRequired` adds `STALE_FALLBACK` reason; uses relative import to placeholder-blocklist to avoid alias resolution under `tsx` | Hard blocker rule |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | `collectMissingRequired` returns structured `{path, reason}`; preview/export error message lists Vietnamese labels and notes stale placeholder state | Surface the block at the call site |
| `apps/web/src/lib/form-flight/profiles/bm171.ts` | Demo fixture uses real synthetic names; `BM171_STALE_FALLBACKS` expanded; acceptance contract requires "Nguyễn Văn A" and forbids "(mẫu)" variants; summary lines hide placeholders as `—` | The semantic blocker |
| `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` | Mirrors the canonical profile changes above; placeholder for `signature.signerName` reset to empty | Runtime UX parity |
| `apps/web/src/lib/runtime-ux/runtime-preview-payload.test.ts` | Updated "stale fallback cleanup" → "CLEAR known stale fallback values"; added "preview/export modes CLEAR placeholder required values"; fixed `brokenProfile` construction in C3 | Test invariants |
| `apps/web/src/lib/form-flight/bm171-shared-core.test.ts` | Acceptance scanner test now renders "Nguyễn Văn A" instead of placeholder; added forbidden-fragment failure case; added demo-fixture assertions + STALE_FALLBACK reason | Test the parity |
| `apps/web/src/lib/form-flight/bm171-runtime-ux-profile.parity.test.ts` | `CANONICAL_BM171_VALUES` reflects synthetic names + `08/09/1985`; `forbiddenFragments` expanded with placeholder variants | Production-vs-runtime parity |
| `apps/web/src/lib/form-flight/bm171-required-placeholder-gate.test.ts` (NEW) | Focused tests covering Cases A–E from the spec | Required by spec §8 |
| `apps/web/src/lib/runtime-ux/placeholder-blocklist.test.ts` (NEW) | Whole-value matching, case/trim correctness, completeness | New module coverage |
| `scripts/audit-runtime-hardcodes.mjs` | `isAuditExcluded` allows `apps/web/src/lib/runtime-ux/bm*.ts`, `apps/web/src/lib/form-flight/profiles/bm*.ts`, and `placeholder-blocklist.ts` | Reconciling audit policy with the mandatory real synthetic names |
| `apps/api/scripts/reproduce-bm171-runtime-preview-before.mjs` | `mustContain` updated to `'08/09/1985'` and adds `'Nguyễn Văn A'`, `'Trần Thị B'`; `mustNotContain` adds placeholder variants | Reflect new fixture |
| `apps/api/scripts/reproduce-bm171-runtime-preview-after.mjs` | Same updates as before-script | Reflect new fixture |

---

## 5. Acceptance Matrix

| Case | Result | Evidence |
|---|---|---|
| A — Demo reset fills `Nguyễn Văn A` | PASS | `apps/api/scripts/reproduce-bm171-runtime-preview-before.mjs` + `…-after.mjs` confirm `Cho ông/bà: Nguyễn Văn A` is in the rendered text |
| A — Demo reset fills `Trần Thị B` | PASS | Same scripts confirm `… Trần Thị B` after `VIỆN TRƯỞNG` |
| B — Placeholder `fullName` blocks preview | PASS | `apps/api/scripts/reproduce-bm171-runtime-missing-required.mjs` reports `assetOwnerFullName: missing`, `renderEndpointCalled: false`, `docxGenerated: false` |
| B — Placeholder `signerName` blocks preview | PASS | Same script reports `signatureSignerName: missing` |
| B — Summary hides placeholder as `—` | PASS | `apps/web/src/lib/form-flight/bm171-required-placeholder-gate.test.ts` — Case D |
| C — User owner override appears in text | PASS | `docs/audit/bm171-runtime-preview-parity/BM171_USER_OVERRIDE_TEXT.latest.txt` — `Cho ông/bà: Trần Văn User`, `Điều 2 … Yêu cầu đơn vị A chuyển giao trong 03 ngày.`, no `(mẫu)` |
| C — User signer override appears in text | PASS | Same artifact — `Ký thay / VIỆN TRƯỞNG / Người Ký User` |
| C — Required absent in user override | PASS | `…-USER_OVERRIDE_CHECKS.latest.json`: `forbiddenTexts` all `absent: true` |
| Điều 2 uses valid owner name | PASS | `…-after-…` text shows `… chuyển giao tài sản nêu tại Điều 1 cho ông Nguyễn Văn A …` |
| No `(mẫu)` leaks into render text | PASS | `…-AFTER_CHECKS.latest.json` and `…-BEFORE_CHECKS.latest.json` `mustNotContainAll: true` |
| Date format `dd/MM/yyyy` | PASS | `…-after-…` shows `08/09/1985` (Sinh ngày) and `14/12/2021` (Cấp ngày) |
| Document number spacing | PASS | `…-after-…` text contains `Số: 01/QĐ-VKSKV7` (literal space) |

---

## 6. Remaining Risks

| Risk | Severity | Recommendation |
|---|---|---|
| Profile files now contain synthetic person names like "Nguyễn Văn A" / "Trần Thị B". The hardcode audit was the only safety net against using those names in non-demo code. The exclusion is scoped via `isAuditExcluded()` regex. | Low | Document the exclusion in `scripts/audit-runtime-hardcodes.mjs` header. Future contributors must not bypass the regex (no global include). |
| `executionRequestLine` is **not** a `requiredFieldPath` in BM-171. The payload sanitizer clears it, and the acceptance scanner flags `người nhận (mẫu)` in the rendered text. The Form Flight missing-required gate intentionally does not report it as a missing required. | Low | This is by design. The forbidden-text acceptance scanner covers it; no further work needed. If a future spec requires `executionRequestLine` to be in `requiredFieldPaths`, we will revisit. |
| The `audit:hardcode` exclusion regex is regex-only — if a future profile file is added with a slightly different name pattern, it may slip outside the exclusion. | Low | Add a positive guard: profile files must declare a `// @qllaw/profile` pragma in their header. Not in scope for this fix. |

---

## 7. Recommendation

**`READY_TO_COMMIT`** — single feature commit. No locked DOCX mutated. No normalized DOCX mutated. No source DOCX mutated. No auth/RBAC touched. No batch rollout executed. The placeholder/missing rule now generalizes correctly across `preview` / `export` / `demo-reset` modes and across the Form Flight core.

The Executor did NOT commit, push, or open a PR per the role contract. The git working tree carries the surgical diff for downstream review.
