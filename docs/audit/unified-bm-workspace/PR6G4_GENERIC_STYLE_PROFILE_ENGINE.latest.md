# PR6G.4 — Generic Style Profile Engine

**Phase:** PR6G.4
**Parent:** PR6G (BM Final Audit Hardening)
**Status:** COMPLETE READY_FOR_PLANNER_REVIEW: YES
**Date:** 2026-07-05
**Round:** Foundation phase — converts BM-specific style override logic into a config-driven DOCX style profile engine.

## Goal

Convert the BM-001 style override logic into a reusable, config-driven DOCX style profile engine so later BMs can reuse the same mechanism without copy-pasting per-BM style files.

The engine is the **generic runner**. Every BM-specific typographic rule (which text fragments to bold, italicise, resize) lives in a per-template **profile config** registered with the engine. The engine is text-free at its core — it never hard-codes BM-001 wording.

## Non-goals (explicit)

- ❌ No BM-171 implementation.
- ❌ No mass rollout of BM-002..BM-213.
- ❌ No locked contract / template mutation.
- ❌ No `rolloutReady=true` flip for BM-001.
- ❌ No fake `generatedDocumentId`.
- ❌ No DB write from `/templates/:templateCode`.
- ❌ No claim of visual style sign-off.
- ❌ No new workspace package (the engine lives under `apps/api/src/modules/documents/rendering/infrastructure/style-profile/`).

## Engine architecture

The engine is a pure, no-NestJS, no-FS module:

```
apps/api/src/modules/documents/rendering/infrastructure/style-profile/
├── docx-style-profile.types.ts            # DocxStyleProfile, DocxStyleProfileRule, …
├── docx-style-rule-engine.ts              # applyStyleProfileToDocxBuffer(...)
├── template-style-profile.registry.ts     # registerStyleProfile / getStyleProfileForTemplate
├── bm001-style-profile.ts                 # BM001_STYLE_PROFILE data
├── index.ts                               # Public barrel + module-init registration
├── docx-style-rule-engine.spec.ts         # Engine unit tests (no Docxtemplater, no real DOCX)
└── docxtemplater-contract-render-engine-style-profile.spec.ts  # Integration with real BM-001 render
```

### Data flow

```
DocxtemplaterContractRenderEngine.renderShadow / renderActiveDocx
        |
        |  (1) fillTemplate() — fills DOCX with the locked contract + bindings
        |
        v
applyTemplateStyleProfile(renderedDocx, templateCode)
        |
        |  (2) lookup profile: getStyleProfileForTemplate(templateCode)
        |       — null when no profile registered, byte-identical no-op
        |
        v
applyStyleProfileToDocxBuffer(renderedDocx, profile)
        |
        |  (3) for each rule, walk word/document.xml (and header / footer /
        |      footnote / endnote parts when the rule targets them),
        |      split runs at the matched substring, and apply the rule's
        |      style override (bold / italic / font size).
        |
        v
new Buffer (or input reference when no rule applied)
```

### Rule shape

```ts
type DocxStyleProfileRule = {
  id: string;
  part: 'document' | 'header' | 'footer' | 'footnote' | 'endnote';
  match:
    | { type: 'exactText'; text: string }
    | { type: 'startsWith'; text: string }
    | { type: 'contains'; text: string };
  style: {
    bold?: boolean;
    italic?: boolean;
    fontSizePt?: number;
    fontSizeHalfPt?: number;
  };
};
```

The engine intentionally has only three matchers (`exactText`, `startsWith`, `contains`) and four style knobs (`bold`, `italic`, `fontSizePt`, `fontSizeHalfPt`). More elaborate typographic transforms are intentionally out of scope — the engine should grow only when a real BM needs them, not speculatively.

### Whitespace normalisation

DOCX paragraphs frequently interleave `<w:t>` runs with `<w:br/>` and `<w:tab/>` elements. A profile rule whose `match.text` was authored against the visible rendered string (`NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM`) would NOT match a paragraph that contains a literal `<w:br/>` between two halves of the same phrase (`NGƯỜI CUNG CẤP NGUỒN TIN \nVỀ TỘI PHẠM`).

The engine builds a parallel normalised text representation per paragraph (collapsing every run of whitespace into a single space) and uses it for matching only. Run splitting still operates on raw text indices, so structural breaks (newlines, tabs) are preserved when the engine emits the styled runs.

This matches the behaviour of `DocumentPreExportService.collapseWhitespace` so the engine's match semantics stay aligned with the rest of the rendering pipeline.

### No-op contract

When `getStyleProfileForTemplate(templateCode)` returns `null`, `applyTemplateStyleProfile` returns the input buffer byte-identical. When the registry returns a profile with zero rules, the engine also returns the input buffer byte-identical. The integration spec proves this with two scenarios:

1. A `BM-999` (no profile) input — output is the same Buffer reference.
2. A `BM-099` (no profile) input even when BM-001 is registered — output is the same Buffer reference.

This is the PR6G.4 non-regression contract: every template code that has no registered profile is byte-identical to the pre-PR6G.4 render output.

### Run splitting safety

The engine splits `<w:t>` runs at the matched substring boundaries, applies the rule's style override to the matched fragment, and preserves the leading / trailing fragments as cloned runs that inherit the original run's properties (without the override). When a match crosses multiple runs (e.g. the BM-001 signature title split across two `<w:t>` runs in the locked template), the engine handles each affected segment independently and emits a warning if the run split cannot be performed safely (e.g. when the parent node is detached mid-iteration).

## BM-001 profile rules

The BM-001 profile (`apps/api/src/modules/documents/rendering/infrastructure/style-profile/bm001-style-profile.ts`) carries the typographic rules that the locked BM-001 contract template does NOT carry natively:

| Rule ID | Match (contains) | Style | Notes |
|---|---|---|---|
| `bm001.place_date_line` | `TP. Hồ Chí Minh,` | italic + 14pt | The header place-date line (italic + sz=28). |
| `bm001.body_title` | `BIÊN BẢN` | bold + 14pt | Body title (bold + sz=28). |
| `bm001.subtitle` | `Tiếp nhận nguồn tin về tội phạm` | bold + 14pt | Subtitle immediately after the body title. |
| `bm001.heading_i` | `I. NỘI DUNG` | bold + 14pt | Section I heading. |
| `bm001.heading_ii` | `II. CÁC TÀI LIỆU` | bold + 14pt | Section II heading. |
| `bm001.signature_informant` | `NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM` | bold + 14pt | Informant signature title. |
| `bm001.signature_receiver` | `NGƯỜI TIẾP NHẬN` | bold + 14pt | Receiver signature title. |
| `bm001.archive_line` | `Lưu: HSVA, HSKS, VP.` | 11pt | Archive line (sz=22) — NOT bold / NOT italic. |

### Matcher choice rationale

The BM-001 locked template renders headers, titles, headings, signature titles, and the archive line inside LARGER paragraphs (the body title `BIÊN BẢN` sits inside a single concatenated header paragraph; the heading `I. NỘI DUNG` is appended to a paragraph that starts with `Là người đại diện...`). `exactText` and `startsWith` therefore do not match reliably across the BM-001 rendered output. Every rule uses `contains` matching so the engine can target the relevant substring and split runs at the match boundaries, applying the typographic override ONLY to the matched fragment.

### "Nơi nhận" is NOT_APPLICABLE_BY_TEMPLATE

The BM-001 locked template has no `Nơi nhận:` block. The BM-001 final audit doc (`docs/audit/bm-final/BM-001/final.latest.md`) documents the field as `NOT_APPLICABLE_BY_TEMPLATE`. The profile MUST NOT invent one. The engine's data-driven design means a future BM that needs `Nơi nhận:` styling can add a rule to its own profile without touching the engine.

## Style evidence

| Rule | Rendered DOCX run-property assertion | Status |
|---|---|---|
| `bm001.place_date_line` | `TP. Hồ Chí Minh,` run carries `<w:i/>` + `<w:sz w:val="28"/>` + `<w:szCs w:val="28"/>` | PASS (engine unit + integration spec) |
| `bm001.body_title` | `BIÊN BẢN` run carries `<w:b/>` + `<w:sz w:val="28"/>` + `<w:szCs w:val="28"/>`, no `<w:i/>` | PASS |
| `bm001.subtitle` | `Tiếp nhận nguồn tin về tội phạm` run carries `<w:b/>` + `<w:sz w:val="28"/>` + `<w:szCs w:val="28"/>` | PASS |
| `bm001.heading_i` | `I. NỘI DUNG` run carries `<w:b/>` + `<w:sz w:val="28"/>` | PASS |
| `bm001.heading_ii` | `II. CÁC TÀI LIỆU` run carries `<w:b/>` + `<w:sz w:val="28"/>` | PASS |
| `bm001.signature_informant` | `NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM` run carries `<w:b/>` + `<w:sz w:val="28"/>` | PASS |
| `bm001.signature_receiver` | `NGƯỜI TIẾP NHẬN` run carries `<w:b/>` + `<w:sz w:val="28"/>` | PASS |
| `bm001.archive_line` | `Lưu: HSVA, HSKS, VP.` run carries `<w:sz w:val="22"/>` + `<w:szCs w:val="22"/>` and NO `<w:b/>` / `<w:i/>` | PASS |
| `Nơi nhận` block | Profile does not invent one. BM-001 final audit doc still says `NOT_APPLICABLE_BY_TEMPLATE`. | NOT_APPLICABLE_BY_TEMPLATE (no rule) |

## Non-BM no-op evidence

`DocxtemplaterContractRenderEngine.applyTemplateStyleProfile(buffer, templateCode)` returns the input buffer byte-identical when `getStyleProfileForTemplate(templateCode)` returns `null`. The integration spec exercises two scenarios:

1. **No profile registered at all** (registry cleared) — `BM-999` returns the input reference.
2. **Profile exists for a different template** (`BM-001` registered) — `BM-099` returns the input reference.

Byte-identical = same `Buffer` reference (the engine never mutates the input).

## PR6G.3.1 non-regression evidence

The integration spec renders BM-001 with the same payload used by `pr6g31-bm001-rendered-docx-parity.spec.ts` and asserts:

| PR6G.3.1 evidence string | Present in rendered DOCX after style-profile | Drift string absent | Status |
|---|---|---|---|
| `TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026` | ✓ | `ngày 4 tháng 7 năm 2026` ✓ | PASS |
| `Cấp ngày 07 tháng 06 năm 2020` | ✓ | `Cấp ngày 7/6/2020` ✓ | PASS |
| `Lưu: HSVA, HSKS, VP.` | ✓ | `Lưu: HSVV, VP.` ✓, `- Lưu: HSVA, HSKS, VP.` ✓ | PASS |

The style-profile engine mutates run properties, not text. The PR6G.3.1 shared-mapping evidence is preserved byte-for-byte.

## Tests

| Spec | Coverage | Status |
|---|---|---|
| `docx-style-rule-engine.spec.ts` | Engine unit tests: no-op contract, BM-001 profile rules, matcher types, run splitting, whitespace normalisation, registry semantics | 26 / 26 PASS |
| `docxtemplater-contract-render-engine-style-profile.spec.ts` | Engine integration: BM-001 auto-application through real Docxtemplater pipeline + non-BM no-op contract + PR6G.3.1 non-regression | 8 / 8 PASS |
| `docx-inspection-rendered-preservation.spec.ts` | PR6G.1 rendered-DOCX preservation: parts / footnotes / content / idempotence / scoped no-op (now via generic style-profile entrypoint) | 14 / 14 PASS |

Total: **48 / 48** engine + preservation tests pass. All 8 PR6G.3.1 parity tests continue to pass (no regression).

## Safety rules confirmed

- [x] No BM-171 implementation.
- [x] No `BM_CORE_REGISTRY` changes for new BMs.
- [x] No mass rollout.
- [x] No locked contract / template mutation.
- [x] No fake `generatedDocumentId`.
- [x] No DB write from `/templates`.
- [x] No style hardcode hidden in engine.
- [x] BM-specific text only lives in BM-specific style profile config.
- [x] Engine is byte-identical no-op for templates without a registered profile.
- [x] Existing BM-001 rendered DOCX content remains unchanged (shared-mapping evidence verified).
- [x] Visual sign-off is not claimed.
- [x] BM-001 final audit stays `status=MANUAL_REQUIRED`, `harnessReady=true`, `rolloutReady=false`.

## BM-001 final audit status

The BM-001 final audit doc (`docs/audit/bm-final/BM-001/final.latest.md`) is NOT modified by this PR. Its current state — `status=MANUAL_REQUIRED`, `harnessReady=true`, `rolloutReady=false` — is the unchanged target state. PR6G.4 contributes the generic style-profile engine infrastructure; the visual style sign-off decision is a separate human review of the rendered DOCX, deferred to after PR6G.5 (Rollout Readiness Gate).

## Acceptance checks

| # | Check | Status |
|---|---|---|
| 1 | Generic style profile engine exists | ✓ `apps/api/src/modules/documents/rendering/infrastructure/style-profile/` |
| 2 | BM-001 style rules are config/profile data, not hardcoded engine logic | ✓ `bm001-style-profile.ts` is pure data |
| 3 | BM-001 rendered style evidence remains unchanged (shared mapping preserved) | ✓ Integration spec asserts PR6G.3.1 evidence strings + drift absence |
| 4 | Non-BM templateCode no-op is byte-identical | ✓ `applyTemplateStyleProfile` returns input buffer reference for unregistered templates |
| 5 | No BM-171 | ✓ BM-171 not opened |
| 6 | No mass rollout | ✓ Only BM-001 profile registered; BM-002..BM-213 untouched |
| 7 | No locked contract / template mutation | ✓ `audit:locked-compiled` not changed |
| 8 | No source-of-truth drift | ✓ Engine operates on the same locked DOCX the renderer fills |
| 9 | BM-001 final audit stays `status=MANUAL_REQUIRED`, `harnessReady=true`, `rolloutReady=false` | ✓ BM-001 final audit doc untouched |
| 10 | Tests pass | ✓ 34 / 34 style-profile tests + 14 / 14 preservation tests + 8 / 8 PR6G.3.1 parity tests |

## Source-of-truth invariant (PR6G.4 cleanup check)

The Planner-required cleanup check is documented here for future regressions:

> **BM-001 style source of truth is `bm001-style-profile.ts`.**
> **Legacy `bm001-style-overrides` runtime path is removed.**

### Cleanup evidence (rg-based)

```
$ rg "applyBm001StyleOverrides|bm001-style-overrides" apps packages test
ZERO matches
```

The only remaining text matches across the whole repo are inside historical PR6G.1 / PR6G.2 audit docs (`docs/audit/unified-bm-workspace/PR6G1_PR_BODY.latest.md`, `PR6G2_PR_BODY.latest.md`, `PR6G2_MERGE_PACKET.latest.md`) which describe the **pre-existing** PR6F worktree drift that PR6G.4 finally closed. Those docs are history-of-the-worktree records and stay untouched.

### Pre-PR6G.4 state of the legacy path

Before this PR6G.4 cleanup pass:

- `apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts` imported `applyBm001StyleOverrides` from `'../bm001-style-overrides'` and called it on every rendered buffer.
- `bm001-style-overrides.ts` (the supposed implementation) was **never committed to git** (verified via `git ls-files` and `git log --all -- "**/bm001-style-overrides.ts"`).
- The spec was therefore failing TypeScript compilation (`TS2307: Cannot find module '../bm001-style-overrides'`).

This was pre-existing PR6F worktree drift documented in the PR6G.1 / PR6G.2 audit docs as a known issue.

### What this cleanup pass changed

1. **No `bm001-style-overrides.ts` to delete** — it never landed in the codebase.
2. **Migrated the only consumer** (`docx-inspection-rendered-preservation.spec.ts`):
   - Replaced `import { applyBm001StyleOverrides } from '../bm001-style-overrides'` with `import { applyStyleProfileToDocxBuffer, getStyleProfileForTemplate } from '../style-profile'`.
   - Added a local `applyStyleProfileForTemplate(buffer, templateCode)` helper that:
     - returns the input buffer byte-identical when no profile is registered, OR
     - delegates to `applyStyleProfileToDocxBuffer(buffer, profile).buffer` when a profile is registered.
   - Replaced every `applyBm001StyleOverrides(buf, '<templateCode>')` call with `applyStyleProfileForTemplate(buf, '<templateCode>')`.
   - Updated the spec's pipeline diagram and inline comments to reference `applyStyleProfileToDocxBuffer(buffer, profile)`.
3. **Result**: the spec now compiles AND passes — 14 / 14 tests (was 0 / 14 because the suite failed to compile before the migration).
4. **Render engine call sites**: `apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts` calls only `applyTemplateStyleProfile(buffer, templateCode)` — no BM-001-specific code remains in the render engine.
5. **Audit doc updated** to record the source-of-truth invariant above.

### Why this matters

Two parallel style sources for BM-001 (the legacy `bm001-style-overrides` runtime path + the new `style-profile/bm001-style-profile.ts`) would cause style drift: any future fix to BM-001 typographic rules would have to land in two places, and one would inevitably be forgotten. PR6G.4's invariant is that **only `bm001-style-profile.ts` exists**, and the engine is the only entrypoint the rest of the codebase can call.

## Remaining blockers

None for PR6G.4. Follow-ups intentionally deferred:

1. **PR6G.5 — Rollout Readiness Gate**: the audit harness still needs a gate that fails the run when a BM-001 audit cannot claim `rolloutReady=true` (visual sign-off pending). PR6G.5 will compose the existing pieces (PR6G.1..PR6G.4 + PR6G.3.1 mapping) into a single readiness gate.
2. **BM-001 visual style sign-off**: still requires a human review of the rendered DOCX after the engine applies the BM-001 profile. Only after this sign-off should `rolloutReady` flip to `true`.
3. **Header / footer / footnote / endnote engine plumbing**: the engine already has `part: 'header' | 'footer' | 'footnote' | 'endnote'` support and the matching logic dispatches correctly, but no current BM profile targets those parts. The plumbing is in place for future BMs that need it; the BM-001 profile continues to target only `document` (the locked BM-001 template has no headers, footers, footnotes, or endnotes — verified via the BM-001 final audit doc).

## Next step

**No BM-171 work until BM-001 final audit is `status=PASS` AND `rolloutReady=true`** (i.e. after visual style sign-off + PR6G.5 rollout readiness gate). PR6G.4 is complete and ready for Planner review. After approval, the next phases are:

- PR6G.5 — Rollout Readiness Gate
- BM-001 visual sign-off
- BM-001 PASS + `rolloutReady=true`
- BM-171 single rollout