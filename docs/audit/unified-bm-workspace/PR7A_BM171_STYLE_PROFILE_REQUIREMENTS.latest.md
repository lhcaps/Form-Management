# PR7A — BM-171 Style Profile Requirements

> **Status:** pre-flight prediction for the future
> `feat/pr7a-bm171-rollout` implementation PR. No style profile file
> exists yet.
>
> **Reuse:** the BM-171 profile MUST be added to the PR6G.4 generic
> style profile engine by appending a new
> `BM171_STYLE_PROFILE` constant and registering it through
> `registerStyleProfile`. The engine code MUST NOT change.
>
> **Strict:** no matcher string from
> `style-profile/bm001-style-profile.ts` may appear in
> `bm171-style-profile.ts`. The two profiles are independent.

## 1. Inputs

| input | source | verified? |
|---|---|---|
| BM-171 normalized DOCX | `storage/templates/normalized-docx/BM-171/BM-171_normalized.docx` | ✅ (sha256 `bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2`, 26 445 bytes) |
| BM-171 source body fragments | `docs/audit/docx/extracted/BM-171__46b9a8be4e01.extract.json` | ✅ (95 paragraphs) |
| BM-171 locked contract slot names | `docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json` | ✅ (37 slot rows, 34 distinct slotIds; see intake report §3) |

## 2. Visible body fragments that carry typographic intent

The future BM-171 style profile applies run-property mutations to
the following rendered body fragments. Each fragment is matched by a
single rule with `match.type: 'contains'` (consistent with the BM-001
profile's matcher choice rationale).

| # | matched rendered substring | part | style overrides | rationale |
|---:|---|---|---|---|
| 1 | `TP. Hồ Chí Minh,` | `document` | `italic: true`, `fontSizePt: 14` | right-aligned place-date line; matches the BM-001 rule `bm001.place_date_line` SEMANTICS but the matcher text is BM-171-specific. |
| 2 | `QUYẾT ĐỊNH` | `document` | `bold: true`, `fontSizePt: 14` | body title. |
| 3 | `TRẢ LẠI TÀI SẢN` | `document` | `bold: true`, `fontSizePt: 14` | subtitle (direct child of body title). |
| 4 | `Điều 1.` | `document` | `bold: true`, `fontSizePt: 14` | article I heading. |
| 5 | `Điều 2.` | `document` | `bold: true`, `fontSizePt: 14` | article II heading. |
| 6 | `Nơi nhận:` | `document` | `bold: true`, `fontSizePt: 14` | recipients heading. |
| 7 | `Lưu: HSVA, HSKS, VP.` | `document` | `fontSizePt: 11` | archive line. |

## 3. Why no signature-heading rule for BM-171

The BM-001 source body contains a clearly visible
`"NGƯỜI CUNG CẤP NGUỒN TIN VỀ TỘI PHẠM"` / `"NGƯỜI TIẾP NHẬN"`
heading line right above the signature block. That is why the BM-001
profile has `signature_informant` and `signature_receiver` rules.

The BM-171 source body, by contrast, splits the signature block into
three SEPARATE paragraph blocks at `P0050` (signMode), `P0051`
(positionTitle), `P0055` (signerName). There is no bold "KT. VIỆN
TRƯỞNG" or "PHÓ VIỆN TRƯỞNG" heading line wrapping the signature;
the drafter's wording flows inline.

**Therefore the BM-171 profile declares NO signature-heading rules
in v1.** A human sign-off pass may later add rules if reviewers note
a visual inconsistency, but v1 keeps the profile minimal and
evidence-driven.

## 4. Why no footnote / endnote / header / footer rule for BM-171

| part | BM-171 status | BM-171 rule needed? |
|---|---|:-:|
| `header` | template has no header parts | NO (engine returns NOT_APPLICABLE; no rule needed) |
| `footer` | template has no footer parts | NO |
| `footnote` | template has only Word-emitted separator entries | NO |
| `endnote` | template has only Word-emitted separator entries | NO |

The profile only ever carries `part: 'document'` rules for BM-171.
The engine itself DOES support `part: 'header' | 'footer' |
'footnote' | 'endnote'` (per `DocxStyleProfilePart` union); unused
values are merely absent.

## 5. File layout (future PR7A.2 step)

```
apps/api/src/modules/documents/rendering/infrastructure/style-profile/
├── bm001-style-profile.ts       (existing, BM-001-only)
├── bm171-style-profile.ts       (NEW)
├── docx-style-profile.types.ts  (existing, generic)
├── docx-style-rule-engine.ts    (existing, generic — NOT modified)
├── docx-style-rule-engine.spec.ts (existing, generic — NOT modified)
├── docxtemplater-contract-render-engine-style-profile.spec.ts
│                                (existing, BM-001 — analogue for BM-171)
├── index.ts                     (existing, BUILTIN_PROFILES updated to include BM-171)
└── template-style-profile.registry.ts (existing, generic — NOT modified)
```

`bm171-style-profile.ts` MUST export exactly one symbol:
`BM171_STYLE_PROFILE`, typed as `DocxStyleProfile`.

`style-profile/index.ts` MUST import `BM171_STYLE_PROFILE` from
`'./bm171-style-profile'` and append it to `BUILTIN_PROFILES`:

```ts
const BUILTIN_PROFILES: ReadonlyArray<DocxStyleProfile> = [
  BM001_STYLE_PROFILE,
  BM171_STYLE_PROFILE,   // NEW
];
```

The `ensureStyleProfilesRegistered()` helper is unchanged.
`registerStyleProfile(...)` and `__resetStyleProfileRegistryForTests()`
remain generic.

## 6. Predicted BM-171 style profile constants

This is the predicted shape of `BM171_STYLE_PROFILE` (NOT to be
written in this intake PR; the future PR7A.2 step produces it).

```ts
import type { DocxStyleProfile } from './docx-style-profile.types';

export const BM171_STYLE_PROFILE: DocxStyleProfile = {
  templateCode: 'BM-171',
  profileId: 'bm-171-vks-khu-vuc-7',
  profileName: 'BM-171 — QĐ trả lại tài sản typographic profile',
  rules: [
    {
      id: 'bm171.place_date_line',
      part: 'document',
      match: { type: 'contains', text: 'TP. Hồ Chí Minh,' },
      style: { italic: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.body_title',
      part: 'document',
      match: { type: 'contains', text: 'QUYẾT ĐỊNH' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.subtitle',
      part: 'document',
      match: { type: 'contains', text: 'TRẢ LẠI TÀI SẢN' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.article_1',
      part: 'document',
      match: { type: 'contains', text: 'Điều 1.' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.article_2',
      part: 'document',
      match: { type: 'contains', text: 'Điều 2.' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.noi_nhan',
      part: 'document',
      match: { type: 'contains', text: 'Nơi nhận:' },
      style: { bold: true, fontSizePt: 14 },
    },
    {
      id: 'bm171.archive_line',
      part: 'document',
      match: { type: 'contains', text: 'Lưu: HSVA, HSKS, VP.' },
      style: { fontSizePt: 11 },
    },
  ],
};
```

> **Important:** the matcher texts above (e.g. `TP. Hồ Chí Minh,`,
> `Lưu: HSVA, HSKS, VP.`) are BM-171-specific words / phrases, but
> are NOT the same as BM-001's matcher texts. The BM-001 archive
> line `Lưu: HSVA, HSKS, VP.` happens to share the substring with
> BM-171 because both forms use the canonical VKS archive phrasing;
> this is acceptable because the matcher text is `contains` and the
> rule's `id` differs. **The rule body, however, MUST NOT be a
> copy-paste of the BM-001 rules — typographic intent must be
> re-derived from the BM-171 extracted body.**

## 7. Spec coverage (future PR7A.2 step)

The future spec is
`apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-bm171-style-profile.spec.ts`.
It mirrors the BM-001 integration spec exactly, replacing fixture
inputs and assertions with BM-171 evidence strings.

Required test cases:

| # | test name | must assert |
|---:|---|---|
|  1 | no-op for BM-NONEXISTENT | `applyStyleProfileToDocxBuffer(buffer, 'BM-NONEXISTENT')` returns the input buffer byte-identical. |
|  2 | auto-applies for BM-171 | `applyStyleProfileToDocxBuffer(buffer, 'BM-171')` mutates the rendered XML; at least one rule from `BM171_STYLE_PROFILE.rules[]` reports `appliedRuleIds` contains its id. |
|  3 | non-regression of PR6G.3.1 mapping | every presence string from `PR7A_BM171_RENDERED_TEXT_EVIDENCE.latest.md` §1 is still in the rendered DOCX after the BM-171 profile runs (text is unchanged; only run-properties). |
|  4 | registry reset does not leak BM-001 into BM-171 | after `__resetStyleProfileRegistryForTests()`, BM-171's rules are still applied (registry is rebuilt by `ensureStyleProfilesRegistered`). |

## 8. Rollout gate impact (gate 7 + 8 + 9)

After the future PR7A.2 lands BM-171 profile + spec:

| PR6G.5 gate | BM-171 status | evidence |
|---|---|---|
| 7 — `style-profile-engine` | PASS | `apps/api/src/.../style-profile/index.ts` re-exports `BM171_STYLE_PROFILE` via `BUILTIN_PROFILES`. |
| 8 — `style-profile-no-legacy-overrides` | PASS | no legacy `applyBm171StyleOverrides` import exists; the post-processor path is the registry. (Predicted — the gate scans runtime files for BM-specific override modules; BM-171 has none.) |
| 9 — `rendered-style-evidence` | PASS once the BM-171 style integration spec lands at `docxtemplater-contract-render-engine-bm171-style-profile.spec.ts`. (Predicted.) |

## 9. Non-goals (explicit)

- ❌ No copy-paste of `BM001_STYLE_PROFILE` rules. The matcher texts are
  BM-171 body fragments; the typographic intent is repeated but the
  matcher texts are unique to BM-171.
- ❌ No mutation of `docx-style-rule-engine.ts`,
  `docx-style-profile.types.ts`, or
  `template-style-profile.registry.ts`. The engine is generic.
- ❌ No new `<w:docDefaults>` / `<w:styles>` mutation. All styling is
  run-property mutation, per PR6G.4 contract.
- ❌ No `header` / `footer` / `footnote` / `endnote` rule parts for
  BM-171 v1.
- ❌ No BM-001 mutation. The BM-001 profile file and its specs are
  NOT touched in this future PR.
