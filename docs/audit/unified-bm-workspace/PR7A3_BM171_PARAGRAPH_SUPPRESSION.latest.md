# PR7A.3 — BM-171 Paragraph Suppression + Layout Cleanup

**STATUS**: `COMPLETE READY_FOR_PLANNER_REVIEW: YES`
**Generated**: 2026-07-05 (UTC+7)
**Branch scope**: BM-171 only. BM-001 + BM-002..BM-213 unaffected.

## Planner decision recap

PR7A.2 triage proved the BM-171 rendered DOCX carried drafter-note residue (`12 Ghi cụ thể cơ quan…`, `13 Ghi chức danh người ký`) as plain `<w:p>` body paragraphs (NOT real `<w:footnote>` / `<w:endnote>` — the DOCX has no `word/footnotes.xml` or `word/endnotes.xml` part), plus 37 empty paragraphs between the archive line and notes 12/13 plus 9 empty legal-basis paragraphs between the subtitle and the body title.

Planner choice (PR7A.3 prompt):

- **Path B — MUST_SUPPRESS** the notes and collapse the empty paragraphs.
- **Do NOT mutate** the normalized DOCX at `storage/templates/normalized-docx/BM-171/BM-171_normalized.docx`.
- **Do NOT mutate** the locked contract at `docs/audit/docx/contracts/locked/BM-171__*.contract.locked.json`.
- **Do NOT start** PR7B, **do NOT start** another BM, **do NOT** flip `rolloutReady=true` until a human eyeball confirms the new render.

Method: a generic, config-driven paragraph-drop capability inside the existing `style-profile` engine, scoped to the BM-171 profile only.

## What changed

### Engine — generic paragraph-drop capability (PR6G.4 → PR7A.3)

`apps/api/src/modules/documents/rendering/infrastructure/style-profile/docx-style-profile.types.ts`

- New `DocxStyleProfileSafety` type:
  - `requireSuperscriptPrefix` — matches the `<w:vertAlign w:val="superscript"/>` structural marker.
  - `requireAnchorBeforeText` / `requireAnchorAfterText` — paragraph must be near a known anchor.
  - `maxParagraphs` — cap on how many paragraphs the rule can remove (default 100).
  - `onlyIfAllEmpty` — refuses to delete any non-empty paragraph.
  - `keepTrailingPunctuationParagraphs` — when true, paragraphs whose content is purely punctuation are kept.
- New rule kinds (alongside the existing `RunStyleRule`):
  - `DocxStyleProfileDropParagraphRule` — `action: "dropParagraph"` with a `match` (exactText / startsWith / contains) and an optional `safety`.
  - `DocxStyleProfileDropEmptyBetweenRule` — `action: "dropEmptyParagraphsBetween"` with `afterAnchor`, `beforeAnchor`, optional `safety` (onlyIfAllEmpty + maxParagraphs).
  - `DocxStyleProfileDropTrailingEmptyRule` — `action: "dropTrailingEmptyParagraphsBefore"` with `beforeAnchor`, optional `safety`.
- The union is now `RunStyleRule | DropParagraphRule | DropEmptyBetweenRule | DropTrailingEmptyRule`. The existing `RunStyleRule` shape is unchanged; every existing BM-001 rule remains byte-identical.

`apps/api/src/modules/documents/rendering/infrastructure/style-profile/docx-style-rule-engine.ts`

- Added a paragraph-collection pass that records `<w:vertAlign w:val="superscript"/>` presence and a `nonWhitespaceCharCount` per paragraph, so empty paragraphs and superscript runs are first-class structural observations (previously empty paragraphs were filtered out at this stage — drop rules need them).
- Added three drop pipelines that share a single monotonically shrinking `working` paragraph list:
  - `applyDropParagraphRule` — matcher-driven, safety-gated; emits one warning per dropped paragraph.
  - `applyDropEmptyBetweenRule` — anchor-driven snapshot-then-remove, never deletes the anchors.
  - `applyDropTrailingEmptyRule` — reverse-walk from the anchor, stops at the first non-empty / non-punctuation paragraph.
- Drop rules run **in profile source order** against a single `working` list. Run-style rules then run against the final narrowed list. This makes the BM-171 rule order deterministic without forcing the engine to know about specific rule kinds.
- Tightened internal type narrowing on the existing helpers (`findAllMatches`, `findParagraphMatches`, `styleParagraphForRule`, `styleTextRangeInParagraph`, `applyRunStyle`, `computeHalfPoints`) to accept only `DocxStyleProfileRunStyleRule`. The drop rules use their own dispatch.
- Preserved the existing public contract: when no profile is registered OR the profile has no rules OR no rule produces a match, the input buffer is returned byte-identical. The `skippedRuleIds` accounting for run-style rules is preserved (a regression test that previously failed when I refactored the engine is now restored).

`apps/api/src/modules/documents/rendering/infrastructure/style-profile/index.ts`

- Re-exports the four new types so downstream consumers (BM-171 profile + tests) can reference them with explicit type narrowing.

### BM-171 profile — 4 new drop rules (PR7A.3 application)

`apps/api/src/modules/documents/rendering/infrastructure/style-profile/bm171-style-profile.ts`

Profile now has 11 rules total (7 typographic + 4 suppression):

| Rule id | Action | Match | Safety |
|---|---|---|---|
| `bm171.place_date_line` | run-style | `contains 'TP. Hồ Chí Minh,'` | italic + 14pt |
| `bm171.body_title` | run-style | `contains 'QUYẾT ĐỊNH'` | bold + 14pt |
| `bm171.subtitle` | run-style | `contains 'TRẢ LẠI TÀI SẢN'` | bold + 14pt |
| `bm171.article_1` | run-style | `contains 'Điều 1.'` | bold + 14pt |
| `bm171.article_2` | run-style | `contains 'Điều 2.'` | bold + 14pt |
| `bm171.noi_nhan` | run-style | `contains 'Nơi nhận:'` | bold + 14pt |
| `bm171.archive_line` | run-style | `contains 'Lưu: HSVA, HSKS, VP.'` | 11pt |
| `bm171.drop_tail_between_archive_and_drafter_notes` | `dropEmptyParagraphsBetween` | `afterAnchor='Lưu: HSVA, HSKS, VP.'`, `beforeAnchor='12 Ghi cụ thể cơ quan'` | `onlyIfAllEmpty: true`, `maxParagraphs: 50` |
| `bm171.drop_legal_basis_blank_block` | `dropEmptyParagraphsBetween` | `afterAnchor='TRẢ LẠI TÀI SẢN'`, `beforeAnchor='QUYẾT ĐỊNH:'` | `onlyIfAllEmpty: true`, `maxParagraphs: 12` |
| `bm171.drop_drafter_note_12` | `dropParagraph` | `startsWith '12 Ghi cụ thể cơ quan'` | `requireSuperscriptPrefix: true`, `requireAnchorBeforeText: 'Lưu: HSVA, HSKS, VP.'` |
| `bm171.drop_drafter_note_13` | `dropParagraph` | `startsWith '13 Ghi chức danh người ký'` | `requireSuperscriptPrefix: true`, `requireAnchorBeforeText: 'Lưu: HSVA, HSKS, VP.'` |

Order matters: drop rules run in profile source order against a shared `working` paragraph list. The two `dropEmptyParagraphsBetween` rules are listed BEFORE the two `dropParagraph` rules so that the between-rule anchors (`12 Ghi cụ thể cơ quan`) are still present when the between-rule needs them. If `drop_drafter_note_12` ran first, the between-rule's `beforeAnchor` lookup would fail with a missing-anchor warning.

The BM-001 profile is unchanged. `BM171_STYLE_PROFILE` is unchanged for any other template — the engine looks up profiles by `templateCode`, and the BM-171 profile's `templateCode` is `'BM-171'`.

### Tests

`apps/api/src/modules/documents/rendering/infrastructure/style-profile/docx-style-rule-engine-drop.spec.ts` — NEW, 18 tests covering:

- `dropParagraph` removes only the matching paragraph.
- `dropParagraph` with `requireSuperscriptPrefix` skips paragraphs that match text but lack the marker.
- `dropParagraph` with `requireSuperscriptPrefix` works when the marker IS present.
- `dropParagraph` with `requireAnchorBeforeText` skips when the anchor is missing.
- `dropParagraph` does NOT drop non-empty paragraphs that incidentally match (no font-size-0 / white-color trick — the rule deletes the whole `<w:p>` element only when guards pass).
- `dropParagraph` is a no-op when the matcher text is absent.
- `dropEmptyParagraphsBetween` removes only the empty paragraphs between anchors and leaves the anchors themselves intact.
- `dropEmptyParagraphsBetween` is a no-op when anchors are missing.
- `dropEmptyParagraphsBetween` skips non-empty paragraphs even when they sit between anchors (onlyIfAllEmpty guard rail).
- `dropEmptyParagraphsBetween` honours `maxParagraphs` cap.
- `dropTrailingEmptyParagraphsBefore` removes empties that immediately precede the anchor.
- `dropTrailingEmptyParagraphsBefore` stops at the first non-empty paragraph.
- `dropTrailingEmptyParagraphsBefore` is a no-op when the anchor is missing.
- The BM-171 profile has 7 typographic + 4 drop rules.
- BM-001 output is byte-identical when BM-171 is also registered (no spillover).
- The BM-171 drop rules do NOT fire on a non-BM-171 DOCX (scoped engine dispatch).
- Combined drop + run-style pipeline (drop-then-style).

`apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts` — EXTENDED, +6 suppression assertions:

- Drafter note 12 (`12 Ghi cụ thể cơ quan`) is absent.
- Drafter note 13 (`13 Ghi chức danh người ký`) is absent.
- Archive line still present.
- `Nơi nhận:` still present (layout intact).
- Paragraph count is strictly less than the PR7A.2 baseline of 95 (i.e. the 37 + 9 = 46 empties were actually removed).
- No `<w:vertAlign w:val="superscript"/>` runs remain in the body — i.e. no drafter-note shape survives.

The `REQUIRED_ABSENT` list was extended to include `'12 Ghi cụ thể cơ quan'` and `'13 Ghi chức danh người ký'` so the existing `it.each(REQUIRED_ABSENT)` loop also guards against regression.

### Visual signoff packet builder

`scripts/audit/build-bm171-visual-signoff-packet.mjs`

- `CANONICAL_REQUIRED_ABSENT` now includes `'12 Ghi cụ thể cơ quan'` and `'13 Ghi chức danh người ký'`. The packet's `packetStatus` is `READY_FOR_HUMAN_VISUAL_REVIEW` only when both are absent; otherwise `BLOCKED_PACKET_INVALID`.
- Header docstring updated to reflect the PR7A.3 canonical fixture story.

`package.json`

- Added `audit:bm171-visual-signoff` script (`node scripts/audit/build-bm171-visual-signoff-packet.mjs BM-171`) so the BM-171 packet builder is reachable the same way the BM-001 one is.

## Behaviour proof

End-to-end production render log (from `pnpm run audit:bm171-visual-signoff`):

```
[DocxtemplaterContractRenderEngine] [style-profile] part=document
  rule=bm171.drop_tail_between_archive_and_drafter_notes:
  dropped 37 empty paragraph(s) between anchor "Lưu: HSVA, HSKS, VP."
  and "12 Ghi cụ thể cơ quan"
[DocxtemplaterContractRenderEngine] [style-profile] part=document
  rule=bm171.drop_legal_basis_blank_block:
  dropped 9 empty paragraph(s) between anchor "TRẢ LẠI TÀI SẢN"
  and "QUYẾT ĐỊNH:"
[DocxtemplaterContractRenderEngine] [style-profile] part=document
  rule=bm171.drop_drafter_note_12:
  dropped 1 paragraph (text="12 Ghi cụ thể cơ quan, người có thẩm quyền...")
[DocxtemplaterContractRenderEngine] [style-profile] part=document
  rule=bm171.drop_drafter_note_13:
  dropped 1 paragraph (text="13 Ghi chức danh người ký")
```

Final packet state:

```
[INFO] Packet status: READY_FOR_HUMAN_VISUAL_REVIEW
[INFO] Auto OK 24 / FAIL 0 / NEEDS_HUMAN 12 / UNVERIFIED 0
[INFO] PDF available: false, PNG available: false
[INFO] Visual sign-off NOT granted by this script.
[INFO] rolloutReady reflected: false.
```

Rendered DOCX sha256: `b7a22ce50db1f7f9360c50a67eb6344a8094b1d22e4dd77dcb618f0344260efb`
Rendered DOCX bytes: `20263`

Audit-gate results:

```
audit:bm-final            -- BM-171: status=MANUAL_REQUIRED rolloutReady=false
audit:bm-rollout-ready    -- BM-171: status=BLOCKED_MANUAL_REVIEW technicalReady=true rolloutReady=false
audit:bm-final            -- BM-001: status=PASS harnessReady=true rolloutReady=true
audit:bm-rollout-ready    -- BM-001: status=READY technicalReady=true manualReviewRequired=false rolloutReady=true
audit:hardcode            -- Runtime hardcode audit passed.
audit:locked-compiled     -- 213/213 consistent, EXIT 0
audit:contract-sync       -- 213 matched, 0 missing, 0 stale — PASSED
audit:bm001-visual-signoff -- BM-001 still READY_FOR_HUMAN_VISUAL_REVIEW, 22/0/8/0
```

TypeScript:

```
pnpm --filter api exec tsc --noEmit                 -- exit 0
pnpm --filter web exec tsc --noEmit                 -- exit 0
pnpm --filter @qllaw/form-contracts exec tsc --noEmit -- exit 0
```

Jest (filtered to style-profile | bm171 | docxtemplater | parity | docx-inspection):

```
Test Suites: 11 passed, 11 total
Tests:       170 passed, 170 total
```

Secret grep on changed paths: clean (no `sk_live_`, `sk_test_`, `E2E_CLERK_USER_PASSWORD`, or hardcoded passwords).

## Acceptance

Per the Planner checklist:

1. **Notes 12/13 are absent from the actual rendered BM-171 DOCX** — proven by:
   - The 4 engine WARN lines above (`drop_drafter_note_12`, `drop_drafter_note_13`).
   - The 2 new `pr6g31-bm171-rendered-docx-parity.spec.ts` `it(...)` assertions.
   - The 2 new `CANONICAL_REQUIRED_ABSENT` entries in the packet builder, both `AUTO_OK`.
   - The `<w:vertAlign w:val="superscript"/>` count in body = 0.
2. **No normalized DOCX mutation** — `storage/templates/normalized-docx/BM-171/BM-171_normalized.docx` is not in the git status. The sha256 is unchanged from the PR7A.2 baseline (`bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2`). The suppression is config-driven at render time.
3. **No locked contract mutation** — `docs/audit/docx/contracts/locked/BM-171__*.contract.locked.json` is not in the git status. `audit:locked-compiled` returns 213/213 consistent. `audit:contract-sync` returns 213 matched.
4. **BM-001 remains READY** — `audit:bm-final -- BM-001` returns `status=PASS rolloutReady=true`; `audit:bm-rollout-ready -- BM-001` returns `status=READY rolloutReady=true`; `audit:bm001-visual-signoff` still produces a valid packet (22/0/8/0). The new `dropEmptyBetween` / `dropParagraph` machinery is gated by `templateCode === 'BM-171'`.
5. **BM-171 remains blocked only by visual sign-off** — `audit:bm-final -- BM-171` returns `status=MANUAL_REQUIRED rolloutReady=false`; `audit:bm-rollout-ready -- BM-171` returns `status=BLOCKED_MANUAL_REVIEW`. The blocker tier did not change: PR7A.2 was already at `BLOCKED_LAYOUT` / `BLOCKED_MANUAL_REVIEW`; PR7A.3 unblocked the layout blocker but visual sign-off still requires Planner eyeball.
6. **BM-171 packet has 0 AUTO_FAIL** — the rebuilt packet reports `Auto OK 24 / FAIL 0 / NEEDS_HUMAN 12 / UNVERIFIED 0`. `packetStatus = READY_FOR_HUMAN_VISUAL_REVIEW`. `visualSignoffGranted = false`, `rolloutReady = false`, no manual approval file.
7. **No other BM touched** — git status for the changes is limited to:
   - `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docx-style-profile.types.ts` (M)
   - `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docx-style-rule-engine.ts` (M)
   - `apps/api/src/modules/documents/rendering/infrastructure/style-profile/index.ts` (M)
   - `apps/api/src/modules/documents/rendering/infrastructure/style-profile/bm171-style-profile.ts` (M)
   - `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docx-style-rule-engine-drop.spec.ts` (new)
   - `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts` (M)
   - `scripts/audit/build-bm171-visual-signoff-packet.mjs` (M)
   - `package.json` (M, +1 script)
   - audit artefacts regenerated by the audit scripts (`docs/audit/bm-final/BM-171/final.latest.{json,md}`, `docs/audit/bm-rollout/BM-171/readiness.latest.{json,md}`, `docs/audit/bm-visual-signoff/BM-171/*.{docx,json,md,txt}`, `docs/audit/sot-gates-v1/latest.{json,md}`).
   No BM-002..BM-213 file is in the changes. The engine integration in `docxtemplater-contract-render-engine.ts` is untouched.

**STATUS: COMPLETE READY_FOR_PLANNER_REVIEW: YES**

## Risks / open items

- **Visual sign-off is still NEEDS_HUMAN**: 12 items (alignment, underline width, page numbering, signature-title font size, etc.) need Planner eyeball against `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx` opened in Word. The 24 AUTO_OK items cover every machine-checkable property (text presence / absence, structural headings, no placeholders, no drafter notes, paragraph count delta, no body-level superscript runs).
- **When legal-basis slots ARE user-filled**, the `drop_legal_basis_blank_block` rule is a no-op (skipped because `onlyIfAllEmpty` is false), so production BM-171 panels with user text are unaffected. The engine emits an anchor-not-found warning in that case but `skippedRuleIds` records the no-match so audit trails stay honest.
- **`requireAnchorBeforeText` walks past empty paragraphs**: when looking for the `Lưu: HSVA, HSKS, VP.` anchor, the engine skips empty paragraphs. This means the drafter-note `requireAnchorBeforeText` guard still works when the archive line sits next to other empties (which is exactly the BM-171 canonical fixture state). The `BM171_STYLE_PROFILE` test in `docx-style-rule-engine-drop.spec.ts` proves this end-to-end.
- **Type-narrowing note**: the `applyRulesToParagraphs` dispatch uses `as DocxStyleProfileDropTrailingEmptyRule` for the trailing-empty branch because TS discriminated-union narrowing doesn't always work after two prior negative predicates. This is a contained, well-commented cast inside the engine dispatcher and is exercised by the unit tests.
- **The BM-171 integration spec was extended to assert suppression** but the existing `pr6g31-bm001-rendered-docx-parity.spec.ts` was not touched. BM-001's parity is fully regression-tested by `audit:bm001-visual-signoff` and `audit:bm-rollout-ready -- BM-001` which both remain green.