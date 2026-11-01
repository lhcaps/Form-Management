# PR6G.3 — Generic BM Mapping Toolkit

> Status: COMPLETE — `STATUS: COMPLETE READY_FOR_PLANNER_REVIEW: YES` (subject to
> the BM-001 visual sign-off acceptance criterion remaining `rolloutReady=false`).

## Goal recap

Extract the reusable mapping primitives out of the BM-001 mapper so future
BM forms (BM-171, BM-053, BM-002..BM-213) can be implemented faster without
fake data, hardcoded strings, or DOCX drift.

## What was extracted

The toolkit lives at `apps/web/src/lib/bm-form-mapping/` and is consumed by
BM-001 today. It contains five pure modules plus an index:

| Module | Purpose |
|---|---|
| `date-mapping.ts` | `splitIsoDateToVietnameseParts`, `formatVietnameseDateParts`, `formatIdentityVietnameseDateParts`, `formatSlashDate` |
| `place-date-line.ts` | `formatVietnamesePlaceDateLine` — `{place}, ngày DD tháng MM năm YYYY` |
| `text-mapping.ts` | `normalizeTextInput`, `emptyStringIfMissing`, `assertNoUnsafeMappedValue` |
| `archive-line.ts` | `buildArchiveLine` — only-string inputs survive, fallback is caller-decided |
| `identity-date.ts` | `mapIdentityIssueDateParts`, `formatIdentityIssueDateLine`, `IDENTITY_ISSUE_DATE_PREFIX` |

All helpers are pure: no I/O, no `Date(value)` parsing, no fabricated
legal facts. Missing inputs collapse to `""`. Number/boolean inputs only
count where the BM contract demands them (e.g. `buildArchiveLine` rejects
non-string values to avoid rendering `0` or `false` as an archive line).

## What stays BM-001-specific

The following logic remains in BM-001 because it is genuinely template-
specific and should not be lifted into the toolkit:

- Default agency / receiver / informant / signer / prosecutor names
  (`'Viện kiểm sát nhân dân khu vực 7'`, `'Nguyễn Thị Hồng Hạnh'`,
  `'Trần\u0020Thanh Nam'`, etc.).
- The `'TP. Hồ Chí Minh'` default place fallback for BM-001 / BM-156 /
  BM-058 / BM-059 / BM-003. Other BMs (BM-053, BM-171, ...) get their own
  `defaultPlace` argument via `formatVietnamesePlaceDateLine`.
- BM-001 sample data (`fillCustomerSample` in
  `bm-001-form-inputs.tsx`) and the BM-001 required-field list.
- The BM-001 BE branch in `apps/api/src/modules/documents/document-renderer.service.ts`
  (template code branching). The toolkit is consumed at the FE
  boundary only in this PR; the BE renderer migration is a follow-up
  that does not change rendered output.

## Migration result for BM-001

| Behaviour | Before PR6G.3 | After PR6G.3 | Status |
|---|---|---|---|
| Header date | `TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026` | identical | UNCHANGED |
| Reception start line | `Hồi 08:00, ngày 26 tháng 12 năm 2025, tại TP. Hồ Chí Minh` | identical | UNCHANGED |
| Reception end line | `Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi 10:00 ngày 26 tháng 12 năm 2025.` | identical | UNCHANGED |
| Identity issue date | `Cấp ngày 07 tháng 06 năm 2020` | identical | UNCHANGED |
| Archive line | `Lưu: HSVA, HSKS, VP.` | identical (defaulted by caller) | UNCHANGED |

The BM-001 FE side migrated `asString()` to the toolkit's
`emptyStringIfMissing()` for the input-coercion path. The behaviour is
byte-identical for every existing call site because the BM-001 mapper
only ever passes strings (or null/undefined) into `asString()`.

## How BM-171 / BM-053 should use the toolkit later

Future BMs should consume the toolkit instead of re-implementing the
mapping primitives:

```ts
import {
  formatVietnamesePlaceDateLine,
  formatIdentityIssueDateLine,
  buildArchiveLine,
  assertNoUnsafeMappedValue,
  splitIsoDateToVietnameseParts,
  formatVietnameseDateParts,
} from "@/lib/bm-form-mapping";
```

The toolkit does not invent legal facts: every helper degrades missing
input to an empty string. The caller decides what the empty string
renders as in the DOCX template — that decision stays in the BM-specific
mapper so it can opt-in to a default per BM (e.g. `defaultPlace`).

The first consumer after BM-001 should be BM-053 (the closely-related
"Biên bản tiếp nhận" form). BM-171 follow-up work is not in scope for
PR6G.3.

## Safety rules

1. The toolkit never fabricates legal facts. Missing dates return `""`.
2. The toolkit never returns `"undefined"`, `"null"`, `"[object Object]"`,
   `"Invalid Date"`, or mustache placeholder leaks. `assertNoUnsafeMappedValue`
   is a hard smoke-check the test suite runs.
3. The toolkit never writes to the database, never creates a
   `generatedDocumentId`, never falls back to demo data, and never
   mutates the locked contract / template files.
4. The toolkit's fallback for `formatVietnamesePlaceDateLine` only
   applies when the caller passes `defaultPlace`. Empty place + no
   default → empty segment, never `"TP. Hồ Chí Minh"`.
5. The toolkit's fallback for `buildArchiveLine` only applies when the
   caller passes a fallback string. Number / boolean / object values
   are treated as missing.

## Non-goals (explicit, this PR does NOT do)

- No BM-171 implementation.
- No mass rollout to BM-002..BM-213.
- No generatedDocument fake.
- No DB write from `templateDraft`.
- No locked contract / template mutation.
- No source-guard regression. The toolkit did not touch any
  `audit-bm-source-guards.mjs` content; the `audit:bm-final` run on
  BM-001 must still report the same `sourceGuardFindings: 22` count
  as the PR6F baseline.
- No BE renderer migration. The toolkit is consumed at the FE
  boundary in PR6G.3. Migrating `document-renderer.service.ts`
  `dateParts` / `monthNoZero` / `issuePlaceAndDateLine` to the toolkit
  is a follow-up PR (PR6G.4 or later) because it changes the rendered
  DOCX text from `tháng 7` to `tháng 07` for some templates, which
  crosses the no-behavior-change bar for BM-001.

## Acceptance check

- Generic mapping toolkit exists ✅
- BM-001 consumes the toolkit ✅ (`asString` → `emptyStringIfMissing`)
- BM-001 mapper output is unchanged ✅ (test cases pin every string)
- BM-001 final audit status unchanged ✅ (status=MANUAL_REQUIRED,
  harnessReady=true, rolloutReady=false — the visual sign-off is the
  only thing keeping rolloutReady at false)
- No BM-171 changes ✅
- No mass rollout ✅
- No locked contract / template mutation ✅
- No source-guard regression ✅
- No secret leak ✅
- 57/57 toolkit tests pass ✅
- 479/479 web unit tests pass ✅