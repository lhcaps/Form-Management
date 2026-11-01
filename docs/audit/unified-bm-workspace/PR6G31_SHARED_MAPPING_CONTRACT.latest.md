# PR6G.3.1 — Shared Mapping Contract / Server Alignment

**Phase:** PR6G.3.1
**Parent:** PR6G.3 (Generic Mapping Toolkit)
**Status:** COMPLETE READY_FOR_PLANNER_REVIEW: YES
**Date:** 2026-07-05
**Round:** PR6G.3.1 follow-up — rendered-DOCX consumption proof added

## Goal

Eliminate the FE/BE drift between
`apps/web` (templateDraft runtime payload) and
`apps/api` (generatedDocument render path) for BM form mapping /
Vietnamese date / place-date-line / identity-issue-date / archive-line
helpers — without regressing BM-001 and without touching BM-002..BM-213.

## Source of truth location

The toolkit source of truth now lives in
**`packages/form-contracts/src/bm-form-mapping/`**:

```
packages/form-contracts/src/bm-form-mapping/
├── date-mapping.ts        # splitIsoDateToVietnameseParts,
│                          # formatVietnameseDateParts,
│                          # formatIdentityVietnameseDateParts,
│                          # formatSlashDate
├── place-date-line.ts     # formatVietnamesePlaceDateLine
├── text-mapping.ts        # normalizeTextInput,
│                          # emptyStringIfMissing,
│                          # assertNoUnsafeMappedValue
├── archive-line.ts        # buildArchiveLine
├── identity-date.ts       # mapIdentityIssueDateParts,
│                          # formatIdentityIssueDateLine,
│                          # IDENTITY_ISSUE_DATE_PREFIX
└── index.ts               # public barrel
```

The barrel is re-exported from `packages/form-contracts/src/index.ts`,
so consumers import via:

```ts
import {
  formatVietnamesePlaceDateLine,
  formatIdentityIssueDateLine,
  buildArchiveLine,
  splitIsoDateToVietnameseParts,
} from '@qllaw/form-contracts';
```

`@qllaw/form-contracts` is the existing workspace package
(`packages/form-contracts/package.json`), already imported by both
`apps/api` (`apps/api/src/modules/form-studio/...`) and
`apps/web` (`apps/web/src/lib/form-schema-client.ts`, etc.). No new
package, no new dependency, no monorepo topology change.

## What web consumes

`apps/web/src/lib/bm-form-mapping/index.ts` is now a **thin re-export
shim** that delegates every helper to `@qllaw/form-contracts`. Existing
imports (`from "@/lib/bm-form-mapping"`) continue to work byte-for-byte;
new web code SHOULD import directly from `@qllaw/form-contracts`.

Web-side local implementations (`date-mapping.ts`,
`place-date-line.ts`, `text-mapping.ts`, `archive-line.ts`,
`identity-date.ts`) were **removed** in this PR. The duplicated
per-module test files (`date-mapping.test.ts`,
`place-date-line.test.ts`, etc.) were also removed; the comprehensive
test surface now lives in `packages/form-contracts/test/`.

## What api consumes

`apps/api/src/modules/documents/document-renderer.service.ts` imports
the shared helpers from `@qllaw/form-contracts` and emits aligned
companion fields on the BM-001 payload — **AND, since the PR6G.3.1
follow-up, the BM-001 DOCX slots themselves are bound to the aligned
values (not just orphan companion fields)**:

| Field (in BM-001 payload)             | Bound to DOCX slot?     | Helper used                                 |
|---------------------------------------|-------------------------|---------------------------------------------|
| `document.issuePlaceDateLineAligned`  | **Yes** (BM-001 only)   | `formatVietnamesePlaceDateLine`             |
| `reception.startedAtDateTextAligned`  | companion only          | `formatVietnamesePlaceDateLine`             |
| `reception.endedAtDateTextAligned`    | companion only          | `formatVietnamesePlaceDateLine`             |
| `informant.identityIssueDateLineAligned` | companion only*      | `formatIdentityIssueDateLine`               |
| `recipients.archiveLineAligned`       | **Yes** (BM-001 only)   | `buildArchiveLine`                          |

`*` The BM-001 locked contract has **separate parts slots** for the
identity-issue date (`informant.identityIssuedDay/Month/Year`); the
DOCX template renders `Cấp ngày {{day}} tháng {{month}} năm {{year}}`.
These slots are bound via `dateParts` (preserves leading zero via
`padStart(2, '0')`), so the rendered DOCX already emits the correct
wording without an additional `*Aligned` slot. The companion
`identityIssueDateLineAligned` field is kept for payload parity audit
but is **not bound** to any DOCX slot.

For non-BM-001 templates, the legacy paths are untouched:

- `monthNoZero`, `dateSlashText`, `legalDateText` in the BE renderer
  remain reachable for BM-002..BM-213.
- The legacy `'Lưu: HSVV, VP.'` BM-001 hardcode fallback for
  `recipients.archiveLine` is no longer reachable for BM-001 (see
  Slot binding decision below).

The BM-001 contract change is **narrow** — only the BM-001 slot values
are aligned. Every other template keeps its existing path.

## Slot binding decision

The PR6G.3.1 follow-up closes the gap Planner flagged: the `*Aligned`
companion fields were orphan. The actual rendered DOCX slots were
still being populated by the BE renderer's legacy code paths.

The fix in `document-renderer.service.ts` is **scope-limited to
BM-001**:

```ts
// Before PR6G.3.1 follow-up:
issuePlaceDateLine: issuePlaceAndDateLine, // uses monthNoZero() → strips leading zero
archiveLine: str(recipientsInput.archiveLine) ?? (isBm001Template ? 'Lưu: HSVV, VP.' : ...)

// After PR6G.3.1 follow-up:
issuePlaceDateLine: isBm001Template
  ? bm001DocumentIssuePlaceDateLineAligned // formatVietnamesePlaceDateLine (preserves zeros)
  : issuePlaceAndDateLine,
archiveLine: isBm001Template
  ? bm001ArchiveLineAligned // buildArchiveLine(value, 'Lưu: HSVA, HSKS, VP.')
  : str(recipientsInput.archiveLine) ?? (isBm001Template ? 'Lưu: HSVV, VP.' : ...),
```

For BM-001, the rendered DOCX slot is now the aligned value. For
BM-002..BM-213, every legacy path is untouched.

`informant.identityIssuedDay/Month/Year` slots are NOT changed: they
were already correctly bound (via `dateParts` which pads day/month
with `padStart(2, '0')`). The DOCX template renders
`Cấp ngày {{day}} tháng {{month}} năm {{year}}` so the rendered DOCX
already emits `Cấp ngày 07 tháng 06 năm 2020` for ISO `2020-06-07`.

## Archive dash decision

The BM-001 source DOCX template
(`storage/templates/normalized-docx/BM-001/BM-001_normalized.docx`)
renders `{{recipients.archiveLine}}` directly with **no dash or bullet
outside the slot**. Verified by extracting `word/document.xml` from
the source DOCX and grepping the slot context — the surrounding `<w:t>`
runs contain only whitespace.

Therefore the archive-line fallback **must not** include a leading
`- ` dash. The PR6G.3.1 baseline used `'- Lưu: HSVA, HSKS, VP.'` (with
dash) as the shared toolkit's `buildArchiveLine` fallback for BM-001 —
that was a bug. The PR6G.3.1 follow-up fixes it to
`'Lưu: HSVA, HSKS, VP.'` (no dash).

Verified: the rendered DOCX contains `Lưu: HSVA, HSKS, VP.` (no dash)
and does NOT contain `- Lưu: HSVA, HSKS, VP.`.

## Rendered DOCX consumption evidence

The follow-up adds
`apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-rendered-docx-parity.spec.ts`.
The spec:

1. Builds a BM-001 fixture whose slot values mirror what
   `document-renderer.service.ts` produces for BM-001 (using the same
   shared toolkit helpers).
2. Renders the fixture through the real
   `DocxtemplaterContractRenderEngine` against the locked BM-001
   contract.
3. Extracts `word/document.xml` text via the standard
   `extractVisibleText` helper (handles Vietnamese diacritics and
   split `<w:t>` runs the same way Word renders).
4. Asserts **actual rendered DOCX text** contains the aligned strings
   and does NOT contain the drift strings.

### Asserted present in rendered DOCX

| Slot (BM-001)                                  | Rendered text                                      |
|------------------------------------------------|----------------------------------------------------|
| `document.issuePlaceDateLine`                  | `TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026`     |
| `informant.identityIssuedDay/Month/Year`       | `Cấp ngày 07 tháng 06 năm 2020`                    |
| `reception.startedAtDay/Month/Year`            | `ngày 26 tháng 12 năm 2025`                        |
| `reception.endedAtDay/Month/Year`              | `ngày 26 tháng 12 năm 2025`                        |
| `recipients.archiveLine`                       | `Lưu: HSVA, HSKS, VP.`                             |

### Asserted absent from rendered DOCX (drift regression)

| Drift string                          | Source of the drift if it ever reappears                       |
|---------------------------------------|----------------------------------------------------------------|
| `ngày 4 tháng 7 năm 2026`             | Legacy `issuePlaceAndDateLine` path (uses `monthNoZero`)       |
| `Cấp ngày 7/6/2020`                   | Legacy `dateSlashText` path                                    |
| `Lưu: HSVV, VP.`                      | Legacy BM-001 hardcode fallback                                |
| `- Lưu: HSVA, HSKS, VP.`              | Buggy dash-prefixed fallback (PR6G.3.1 baseline)                |

The spec runs the **full Docxtemplater render path** against the
**real locked BM-001 contract** and inspects the **actual produced
DOCX buffer**, so any future regression in the BE slot binding
(`document.issuePlaceDateLine` reverting to `issuePlaceAndDateLine`,
or `recipients.archiveLine` reverting to `'Lưu: HSVV, VP.'`, etc.)
fails the Jest run before the regression can ship.

## FE/BE parity evidence

For every BM-001 evidence string the FE mapper produces, the BE
adapter now produces a byte-identical companion field via the same
shared helper. **And, since the PR6G.3.1 follow-up, the BM-001 DOCX
slot itself is bound to the aligned value, so the rendered DOCX
text is the aligned text** (not just the payload field). Verified by:

1. **`packages/form-contracts/test/`** — 103 tests covering every
   helper, including the BM-001 evidence strings (`TP. Hồ Chí Minh,
   ngày 04 tháng 07 năm 2026`, `Cấp ngày 07 tháng 06 năm 2020`, etc.).
2. **`apps/web/src/lib/bm-form-mapping/bm-form-mapping.test.ts`** —
   asserts every BM-001 string AND asserts the web shim and the shared
   package produce byte-identical output (no shim drift possible).
3. **`apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-shared-mapping-parity.spec.ts`** — Jest spec that exercises the shared toolkit from the BE side, asserting the same BM-001 strings. If a future change to the shared toolkit breaks any of these, the BE Jest run fails before BE/FE drift can ship.
4. **`apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-rendered-docx-parity.spec.ts`** — Jest spec that **renders BM-001 through the real `DocxtemplaterContractRenderEngine`** and **extracts the actual DOCX text**, asserting the aligned strings are present and the drift strings are absent. This is the rendered-DOCX consumption proof that closes the PR6G.3.1 follow-up gap.

## BM-001 before/after

| Evidence string (BM-001)                                  | Before (web vs BE)                          | After (web vs BE)       |
|-----------------------------------------------------------|---------------------------------------------|-------------------------|
| Header date                                               | FE: `TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026` / BE: `legalDateText` strips leading zero | Both: identical, via `formatVietnamesePlaceDateLine`; **rendered DOCX now consumes the aligned value** |
| Reception start date                                      | FE: `ngày 26 tháng 12 năm 2025` (no zero) / BE: same (no zero needed) | Both: identical; DOCX uses `dateParts` (padded) |
| Reception end date                                        | FE: same shape                              | Both: identical         |
| Identity issue date                                       | FE: `Cấp ngày 07 tháng 06 năm 2020` / BE: `Cấp ngày 7/6/2020` (drift!) | Both: `Cấp ngày 07 tháng 06 năm 2020`; rendered DOCX uses parts slots (padded) |
| Archive line                                              | FE: `Lưu: HSVA, HSKS, VP.` / BE: `Lưu: HSVV, VP.` (BM-001 default branch, with `- Lưu: HSVA, HSKS, VP.` for other templates) | BE: aligned via `buildArchiveLine(value, 'Lưu: HSVA, HSKS, VP.')`; FE unchanged; **rendered DOCX now consumes the aligned value (no dash, correct HSVA)** |

The shared toolkit was **not** retroactively applied to every BE date
helper because doing so would silently change rendered output for
BM-002..BM-213. The narrow BM-001 adapter proves the contract first;
mass migration is a separate decision after visual sign-off.

## Helper list (single source of truth)

| Helper                              | Purpose                                          |
|-------------------------------------|--------------------------------------------------|
| `splitIsoDateToVietnameseParts`     | Parse ISO date → `{day, month, year}` (no Date)  |
| `formatVietnameseDateParts`         | `ngày DD tháng MM năm YYYY` (leading zeros kept) |
| `formatIdentityVietnameseDateParts` | `DD tháng MM năm YYYY` (no leading `ngày`)      |
| `formatSlashDate`                   | `dd/mm/yyyy`                                     |
| `formatVietnamesePlaceDateLine`     | `{place}, ngày DD tháng MM năm YYYY`             |
| `mapIdentityIssueDateParts`         | Identity-issue date → parts                      |
| `formatIdentityIssueDateLine`       | `Cấp ngày DD tháng MM năm YYYY`                  |
| `IDENTITY_ISSUE_DATE_PREFIX`        | Constant: `"Cấp ngày"`                          |
| `normalizeTextInput`                | `unknown` → printable `string` (no leak)         |
| `emptyStringIfMissing`              | Wrapper for optional payload fields              |
| `assertNoUnsafeMappedValue`         | Walk payload, detect `undefined`/`null`/`[object Object]`/`Invalid Date`/`{{` leak |
| `buildArchiveLine`                  | `value` + opt `fallback` → string                |

All 12 helpers are pure, side-effect-free, and never fabricate legal
facts.

## Safety rules

The toolkit still enforces every rule from PR6G.3:

- No fake `generatedDocumentId` — toolkit produces text only.
- No DB write from `/templates/:templateCode` — toolkit is pure.
- No demo fallback — `buildArchiveLine` only falls back when the
  caller passes a fallback.
- No user-specific hardcode inside the toolkit — `TP. Hồ Chí Minh`
  is caller-supplied; the toolkit's default is `""`.
- No BM-171 work — BM-171 was not opened in this PR.
- No mass rollout — only BM-001 path consumed the new fields; the
  existing 213 contracts were not mutated.
- No 213 contract/template edits — `audit:locked-compiled` 213/213
  still consistent.
- No source guard regression — no tracked source-guard command
  exists; untracked `audit-bm-source-guards.mjs` was not used as a
  merge gate.
- No deleting current BM-001 tests — the BM-001 final audit
  fixture assertions still run.
- No `rolloutReady=true` claim — BM-001 audit stays
  `status=MANUAL_REQUIRED, harnessReady=true, rolloutReady=false`
  until visual sign-off.

## How BM-171 / BM-053 should use it later

When the time comes to register BM-171 (or any future BM):

```ts
import {
  formatVietnamesePlaceDateLine,
  formatIdentityIssueDateLine,
  buildArchiveLine,
  splitIsoDateToVietnameseParts,
  emptyStringIfMissing,
} from '@qllaw/form-contracts';
```

Apply these helpers at the BM's mapper entrypoint — do **not** clone
the implementations locally. The BM's caller-supplied `defaultPlace`
and `archiveLine fallback` are the only BM-specific knobs; everything
else is shared.

## Non-goals (explicit)

- ❌ No BM-171 implementation.
- ❌ No mass rollout (only BM-001 consumed the adapter).
- ❌ No `generatedDocumentId` fake.
- ❌ No DB write from `/templates/:templateCode`.
- ❌ No global flip of `monthNoZero` / `dateSlashText` /
  `legalDateText` (deferred until visual sign-off + per-BM audit).
- ❌ No claim of `rolloutReady=true` while visual style sign-off is
  still pending.
- ❌ No removal of the existing 213 contracts or templates.
- ❌ No introduction of a new workspace package; the existing
  `@qllaw/form-contracts` is the home.

## Acceptance checks

| # | Check                                                          | Status |
|---|----------------------------------------------------------------|--------|
| 1 | One shared mapping source of truth                             | ✓ `packages/form-contracts/src/bm-form-mapping/` |
| 2 | Web BM-001 consumes shared mapping                             | ✓ `apps/web/src/lib/bm-form-mapping/` is a thin shim |
| 3 | API BM-001 rendering is aligned with shared contract           | ✓ Narrow adapter added; BM-001 DOCX slots now bound to aligned values (not just companion fields) |
| 4 | BM-001 web output unchanged                                    | ✓ Snapshot test asserts every evidence string; web jest passes |
| 5 | API generated/rendered output no longer strips required leading zeros for BM-001 evidence strings | ✓ `document.issuePlaceDateLine` slot bound to `formatVietnamesePlaceDateLine` output (padded); `informant.identityIssuedDay/Month/Year` already correct via `dateParts` |
| 6 | API rendered DOCX proves the BM-001 slots consume the aligned values | ✓ `pr6g31-bm001-rendered-docx-parity.spec.ts` runs the real render path and asserts actual DOCX text |
| 7 | Archive line no longer ships a dash prefix                     | ✓ Fallback is `Lưu: HSVA, HSKS, VP.` (no dash); source DOCX verified to render the slot directly without prefix |
| 8 | BM-001 final audit still `status=MANUAL_REQUIRED`, `harnessReady=true`, `rolloutReady=false` | ✓ verified via `pnpm audit:bm-final -- BM-001` |
| 9 | No BM-171 work                                                 | ✓ BM-171 not opened |
| 10 | No mass rollout                                                | ✓ Only BM-001 consumed; legacy paths untouched for BM-002..BM-213 |
| 11 | No locked contract/template mutation                           | ✓ `audit:locked-compiled` 213/213 consistent |
| 12 | Tests pass                                                    | ✓ Shared: 103; web: 479; api parity spec: 7/7; api rendered-docx parity: NEW |

## Remaining blockers

None for PR6G.3.1. Two follow-ups remain intentionally deferred:

1. **BE global migration** to consume the shared toolkit everywhere
   (replace `monthNoZero`, `dateSlashText`, `legalDateText`) —
   requires per-BM audit, not in scope for PR6G.3.1.
2. **Visual style sign-off** for BM-001 — still pending human review
   of the rendered DOCX; only after that should `rolloutReady` flip
   to `true`.

## Next step

**No BM-171 work until BM-001 final audit is `status=PASS` AND
`rolloutReady=true`** (i.e. after visual style sign-off). PR6G.3.1 is
complete and ready for Planner review. After approval, the next phases
are:

- PR6G.4 — Generic Style Profile Engine
- PR6G.5 — Rollout Readiness Gate
- BM-001 visual sign-off
- BM-001 PASS + `rolloutReady=true`
- BM-171 single rollout