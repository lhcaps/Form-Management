# PR7A — BM-171 Single Rollout: Intake Report

> **Phase:** PR7A (BM-171 controlled rollout — first BM after BM-001).
> **Parent contract:** PR6G.1..PR6G.5.2 merged into `main`, BM-001 gates
> `READY` on `main` (Planner visual sign-off GRANTED).
> **Date:** 2026-07-05.
> **Scope:** BM-171 ONLY. No BM-002..BM-213 work. No BM-001 modification.

## 0. Hard scope reminder

Per the user directive:

- **Do not mass rollout BM-002..BM-213.** A future per-BM rollout
  remains gated on its own audit + sign-off; that work is NOT this
  PR.
- **Do not mark BM-171 READY without its own final audit + visual
  sign-off.** This intake report is the input to that future
  audit/sign-off pair; it does not claim BM-171 status.
- **Reuse BM-001 foundation.** Consume PR6G.1 docx-inspection, PR6G.2
  audit harness (`audit:bm-final`), PR6G.3 shared mapping toolkit
  (`@qllaw/form-contracts/bm-form-mapping/`), PR6G.3.1 rendered-DOCX
  parity spec pattern, PR6G.4 generic style profile engine, and
  PR6G.5 rollout readiness gate (`audit:bm-rollout-ready`).
- **Do not copy BM-001-specific code.** BM-171 profile, per-BM parity
  spec, and form-inputs panel are written fresh and only reuse the
  generic toolkit.
- **Add/reuse BM-171 locked contract and normalized DOCX only if
  missing.** This intake report documents that BOTH are already on
  disk for BM-171.
- **Produce BM-171 final audit artefacts only for BM-171.** No
  `docs/audit/bm-final/<OTHER-TEMPLATE>/...` writes.
- **Keep BM-001 unchanged.** This PR creates nothing under
  `docs/audit/bm-final/BM-001/`, `docs/audit/bm-rollout/BM-001/`,
  `docs/audit/bm-visual-signoff/BM-001/`, or the BM-001 style
  profile file.

This document is the **first deliverable** of PR7A. It does NOT
implement the BM-171 panel, the BM-171 style profile, the BM-171
parity spec, or the BM-171 final audit harness runs. It produces
input artefacts only, so the future BM-171 implementation PR has a
single source of truth to plan against.

## 1. Identity

| key | value |
|---|---|
| Template code | **BM-171** |
| Source title | **QĐ trả lại tài sản** (Quyết định trả lại tài sản) |
| Stage code / label | `06` / **XỬ LÝ VẬT CHỨNG** |
| Form number | `171/HS` |
| Legal-basis line | Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026 |
| Source `BM_CORE_REGISTRY` risk | None — BM-171 is already in the locked contracts tree; this PR does NOT touch the registry |
| Mass-rollout risk | None — the PR6G.5 gate accepts one explicit `--bm=BM-171`; the PR6G.2 audit harness also accepts one explicit target. No `--all` switch. |

## 2. Source artefacts on disk (already exist — no work needed)

| artefact | path | present? |
|---|---|---|
| Source DOCX (legacy `.doc`) | `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/06. XU LY VAT CHUNG/171-QĐ trả lại tài sản.doc` | YES |
| Normalized DOCX (locked source-of-truth for the render path) | `storage/templates/normalized-docx/BM-171/BM-171_normalized.docx` (26 445 bytes, sha256 `bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2`) | YES |
| Locked contract (DOCX slots + canonical fields + render bindings) | `docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json` | YES |
| Lock-mapping (slot → canonical) | `docs/audit/docx/human-review/BM-171__lock-mapping.json` | YES |
| Extracted DOCX structure | `docs/audit/docx/extracted/BM-171__46b9a8be4e01.extract.json` (95 paragraphs, 0 tables, 3 037 rawTextLength) | YES |
| Draft contract (pre-lock) | `docs/audit/docx/contracts/BM-171__46b9a8be4e01.contract.draft.json` | YES — superseded by locked; will NOT be touched |
| Form inputs panel (legacy / pre-PR6G.*) | `apps/web/src/components/documents/bm-171-form-inputs.tsx` | YES — pre-PR6G.*, kept untouched |
| BM-171 locked-compiled status | `docs/audit/sot-gates-v1/latest.json` entry: `CONSISTENT`, 1 LOW `CONTRACT_HASH_MISMATCH` warning (`332ef3be... → 11166e6e...`) | YES — non-blocking; gate 10 will report PASS |

## 3. Slots — full enumeration from the locked contract

37 `docxSlots`, all `reviewRequired: false`, reviewed by `Le Huy` on
`2026-06-22T08:15:00.000+07:00` (human lock-mapping pass).

| # | slotId | part | blockId | slotType | required | transform | source |
|---:|---|---|---|---|:-:|---|---|
|  1 | `agency.parentName` | word/document.xml | P0011 | text | YES | identity | agencyConfig |
|  2 | `agency.name` | word/document.xml | P0011 | text | YES | identity | agencyConfig |
|  3 | `document.documentCode` | word/document.xml | P0012 | text | YES | identity | manual |
|  4 | `document.issuePlaceAndDateLine` | word/document.xml | P0019 | text | YES | `date.issuePlaceDateLine` | systemDate |
|  5 | `official.issuerTitle` | word/document.xml | P0023 | text | YES | identity | manual |
|  6 | `legalBasis.procedureArticlesLine` | word/document.xml | P0024 | multilineText | YES | identity | officialConfig (lock-mapping marks `constantFromDocx`) |
|  7 | `caseDecision.prosecutionDecisionLegalBasisLine` | word/document.xml | P0025 | multilineText | YES | identity | manual |
|  8 | `accusedDecision.prosecutionDecisionLegalBasisLine` | word/document.xml | P0026 | multilineText | YES | identity | manual |
|  9 | `assetReturn.investigationConclusionLegalBasisLine` | word/document.xml | P0027 | multilineText | YES | identity | manual |
| 10 | `assetReturn.caseSuspensionDecisionLegalBasisLine` | word/document.xml | P0028 | multilineText | YES | identity | manual |
| 11 | `assetReturn.accusedSuspensionDecisionLegalBasisLine` | word/document.xml | P0029 | multilineText | YES | identity | manual |
| 12 | `assetReturn.considerationLine` | word/document.xml | P0030 | multilineText | YES | identity | manual |
| 13 | `assetReturn.assetListLine` | word/document.xml | P0033 | multilineText | YES | identity | manual |
| 14 | `assetOwner.fullName` | word/document.xml | P0034 | text | YES | identity | manual |
| 15 | `assetOwner.genderText` | word/document.xml | P0034 | text | YES | identity | manual |
| 16 | `assetOwner.otherName` | word/document.xml | P0035 | text | **NO** | identity | manual |
| 17 | `assetOwner.dateOfBirthText` | word/document.xml | P0036 | text | YES | identity | systemDate |
| 18 | `assetOwner.placeOfBirth` | word/document.xml | P0036 | text | YES | identity | manual |
| 19 | `assetOwner.nationality` | word/document.xml | P0037 | text | YES | identity | manual |
| 20 | `assetOwner.ethnicity` | word/document.xml | P0037 | text | YES | identity | manual |
| 21 | `assetOwner.religion` | word/document.xml | P0037 | text | **NO** | identity | manual |
| 22 | `assetOwner.occupation` | word/document.xml | P0038 | text | YES | identity | manual |
| 23 | `assetOwner.identityNo` | word/document.xml | P0039 | text | YES | identity | manual |
| 24 | `assetOwner.identityIssuedDateText` | word/document.xml | P0040 | text | YES | identity | systemDate |
| 25 | `assetOwner.identityIssuedPlace` | word/document.xml | P0040 | text | YES | identity | manual |
| 26 | `assetOwner.permanentResidence` | word/document.xml | P0041 | multilineText | YES | identity | manual |
| 27 | `assetOwner.temporaryResidence` | word/document.xml | P0042 | multilineText | **NO** | identity | manual |
| 28 | `assetOwner.currentResidence` | word/document.xml | P0043 | multilineText | YES | identity | manual |
| 29 | `assetReturn.executionRequestLine` | word/document.xml | P0045 | multilineText | YES | identity | manual |
| 30 | `recipients.line1` | word/document.xml | P0048 | text | YES | identity | manual |
| 31 | `recipients.archiveLine` | word/document.xml | P0049 | text | YES | identity | manual |
| 32 | `signature.signMode` | word/document.xml | P0050 | signature | YES | identity | officialConfig |
| 33 | `signature.positionTitle` | word/document.xml | P0051 | signature | YES | identity | officialConfig |
| 34 | `signature.signerName` | word/document.xml | P0055 | signature | YES | identity | officialConfig |

**Distinct slot counts:**

| metric | count |
|---:|---:|
| Total slots | 34 (max blockId `P0055` reached, but slots are labelled by ID; see actual count below) |
| Required | 31 |
| Optional | 3 |
| `multilineText` | 11 |
| `text` | 20 |
| `signature` | 3 |
| Distinct `partName` | `word/document.xml` (only) |
| Distinct `blockId`s | P0011, P0012, P0019, P0023..P0030 (8), P0033..P0045 (5), P0048..P0051 (3), P0055 (1) — total 17 distinct block IDs |

> **Read carefully:** the slot list above is **frozen at 34 distinct
> slotIds** per the locked contract. Each row is one slotId; the
> `docxSlots` array length is 37 (legacy duplicate `P0030` etc. are not
> present here — the 37 number is the count in the contract JSON).
> The exact count and IDs are the source of truth for the future
> `BM171_FIELD_COVERAGE.latest.json` artefact and its 5 mandatory
> gates.

## 4. Required fields (mapped to BM-171 panel sections)

The locked contract groups canonicalFields into 5 sections, all
required by default. The future BM-171 panel will mirror these 5
section shapes.

### 4.1 Section: **Cơ quan và văn bản** (`agency`, `document`, `official`)

| path | label | type | required | UI hint |
|---|---|---|:-:|---|
| `agency.parentName` | Cơ quan cấp trên | string | YES | text |
| `agency.name` | Viện kiểm sát ban hành | string | YES | text |
| `document.documentCode` | Số quyết định | string | YES | text |
| `document.issuePlaceAndDateLine` | Địa danh, ngày ban hành | string | YES | text (computed) |
| `official.issuerTitle` | Chủ thể ban hành | string | YES | text |

### 4.2 Section: **Căn cứ pháp lý** (`legalBasis`, `caseDecision`, `accusedDecision`, sub-fields of `assetReturn`)

| path | label | type | required | UI hint |
|---|---|---|:-:|---|
| `legalBasis.procedureArticlesLine` | Căn cứ Bộ luật Tố tụng hình sự | string | YES | textarea |
| `caseDecision.prosecutionDecisionLegalBasisLine` | Căn cứ quyết định truy tố | string | YES | textarea |
| `accusedDecision.prosecutionDecisionLegalBasisLine` | Căn cứ quyết định đối với bị can | string | YES | textarea |
| `assetReturn.investigationConclusionLegalBasisLine` | Căn cứ kết luận điều tra | string | YES | textarea |
| `assetReturn.caseSuspensionDecisionLegalBasisLine` | Căn cứ quyết định tạm đình chỉ vụ án | string | YES | textarea |
| `assetReturn.accusedSuspensionDecisionLegalBasisLine` | Căn cứ quyết định tạm đình chỉ đối với bị can | string | YES | textarea |
| `assetReturn.considerationLine` | Căn cứ xem xét tài sản | string | YES | textarea |
| `assetReturn.assetListLine` | Danh mục tài sản | string | YES | textarea |

### 4.3 Section: **Thông tin chủ tài sản** (`assetOwner`)

| path | label | type | required | UI hint |
|---|---|---|:-:|---|
| `assetOwner.fullName` | Họ và tên chủ tài sản | string | YES | text |
| `assetOwner.genderText` | Giới tính | string | YES | select (`Nam`/`Nữ`) |
| `assetOwner.otherName` | Tên gọi khác | string | NO  | text |
| `assetOwner.dateOfBirthText` | Sinh ngày | string | YES | text |
| `assetOwner.placeOfBirth` | Nơi sinh | string | YES | text |
| `assetOwner.nationality` | Quốc tịch | string | YES | text |
| `assetOwner.ethnicity` | Dân tộc | string | YES | text |
| `assetOwner.religion` | Tôn giáo | string | NO  | text |
| `assetOwner.occupation` | Nghề nghiệp | string | YES | text |
| `assetOwner.identityNo` | Số CMND/CCCD | string | YES | text |
| `assetOwner.identityIssuedDateText` | Cấp ngày | string | YES | text |
| `assetOwner.identityIssuedPlace` | Nơi cấp | string | YES | text |
| `assetOwner.permanentResidence` | Nơi thường trú | string | YES | textarea |
| `assetOwner.temporaryResidence` | Nơi tạm trú | string | NO  | textarea |
| `assetOwner.currentResidence` | Nơi ở hiện tại | string | YES | textarea |

### 4.4 Section: **Nội dung quyết định** (`assetReturn.executionRequestLine`)

| path | label | type | required | UI hint |
|---|---|---|:-:|---|
| `assetReturn.executionRequestLine` | Điều 2 - Yêu cầu | string | YES | textarea |

### 4.5 Section: **Nơi nhận** (`recipients`)

| path | label | type | required | UI hint |
|---|---|---|:-:|---|
| `recipients.line1` | Nơi nhận chính | string | YES | text |
| `recipients.archiveLine` | Lưu hồ sơ | string | YES | text |

### 4.6 Section: **Chữ ký** (`signature`)

| path | label | type | required | UI hint |
|---|---|---|:-:|---|
| `signature.signMode` | Chế độ ký | string | YES | text (KT. / TUQ. / VIỆN TRƯỞNG) |
| `signature.positionTitle` | Chức vụ người ký | string | YES | text (VIỆN TRƯỞNG / PHÓ VIỆN TRƯỞNG / KIỂM SÁT VIÊN) |
| `signature.signerName` | Người ký | string | YES | text |

**Distinct canonical field count: 34** (matches §3 slot count).

## 5. Mapping rules (what the BM-171 mapper must produce)

The mapping layer's job is **only** to convert the canonical payload
into a render-payload that matches every `docxSlot` in the locked
contract. The future BM-171 implementation MUST consume the shared
toolkit; it MUST NOT re-implement date / place / identity formatting
locally.

### 5.1 Slot-to-source binding

Per the locked contract's `renderBindings[]`:

- Identity transform → 33 slots (all rows except row 4).
- `date.issuePlaceDateLine` → 1 slot (`document.issuePlaceAndDateLine`).
- All bindings have `fallback: ""` (no fabricated legal facts).

### 5.2 Toolkit functions to call (reused from `@qllaw/form-contracts/bm-form-mapping/`)

| Slot | Toolkit helper | Notes |
|---|---|---|
| `document.issuePlaceAndDateLine` | `formatVietnamesePlaceDateLine({ place, isoDate, defaultPlace })` | shared with BM-001; preserves leading zeros. |
| `assetOwner.dateOfBirthText` | `splitIsoDateToVietnameseParts` + `formatSlashDate` (or the existing `firstText(...)` fallback chain in BM-001) | preserves `dd/mm/yyyy` slash form; NOT a Vietnamese legal sentence (no `ngày`). |
| `assetOwner.identityIssuedDateText` | `splitIsoDateToVietnameseParts` + `formatSlashDate` | same as above. |
| All other text / multilineText slots | `normalizeTextInput` / `emptyStringIfMissing` | empty-safe; never returns `"undefined"` / `"null"` / `"[object Object]"`. |
| `recipients.archiveLine` | `buildArchiveLine(input)` with no-dash fallback | shared with BM-001; default `'Lưu: HSVA, HSKS, VP.'`. |
| All `assetOwner.genderText` references | select (`Nam` / `Nữ`) — locked contract `options` field | not a date / place mapping; identity transform. |
| All `signature.*` references | identity transform, sourced from `officialConfig` | VM convenience layer; mapper exposes typed select options. |

### 5.3 Hard rules (per failure-log 2026-06-19)

- Empty / malformed ISO date inputs must yield three empty strings,
  not `Invalid Date`. (Already enforced by
  `splitIsoDateToVietnameseParts`.)
- Coercion through `String(value)` / `JSON.stringify(value)` must never
  leak `[object Object]`, `undefined`, `null`, `Invalid Date`, or
  `{{...}}` braces into the rendered DOCX. (Enforced by
  `assertNoUnsafeMappedValue` + the existing `unresolved-docx-placeholder`
  leak detector in `audit-bm-final.mjs`.)
- `recipients.archiveLine` MUST NOT default to legacy `'Lưu: HSVV, VP.'`
  — that string would fail the BM-001 parity check (PR6G.3.1 lesson).

### 5.4 Per-BM adapter declaration (future PR scope)

This intake report DOES NOT create the BM-171 mapper file. The future
PR7A implementation must add a per-BM **adapter** (the analogue of
the BM-001 narrow adapter) that:

1. Imports from `@qllaw/form-contracts/bm-form-mapping/`.
2. Declares typed shapes for the 5 sections.
3. Computes `issuePlaceAndDateLine` via the shared toolkit.
4. Mirrors `document-renderer.service.ts`'s BM-001-aligned
   companion-field pattern (a parallel `{X}Aligned` field is the
   documented escape hatch from PR6G.3.1; the BM-171 implementation
   may use the same naming convention).

## 6. Footnotes / endnotes / header / footer status

Per the extracted DOCX structure (`BM-171__46b9a8be4e01.extract.json`)
and the LOCKED contract:

| part | status | rationale |
|---|---|---|
| `word/document.xml` | **PASS** (extracted, 95 paragraphs visible) | the only meaningful body part. |
| headers | **NOT_APPLICABLE** for now; the BM-171 normalized DOCX has no `word/header*.xml` parts. | PR6G.1 inspector will confirm `headers: []`. |
| footers | **NOT_APPLICABLE** | same — no `word/footer*.xml` parts. |
| footnotes | **NOT_APPLICABLE_BY_TEMPLATE** | the BM-171 source DOCX has NO numbered footnotes; the visible "footnote markers" in the rendered form are NOTES INLINE in the body (e.g. `12`, `13` superscript numbers pointing at the explanation text below the body, NOT real `<w:footnote>` entries). |
| endnotes | **NOT_APPLICABLE_BY_TEMPLATE** | same reasoning. |
| comments | **NOT_APPLICABLE** | no `word/comments.xml`. |

> **Re-confirmation step:** the future PR7A implementation run of
> `pnpm audit:bm-final -- BM-171` MUST confirm every line above
> matches the PR6G.1 inspector output (`inspectDocxPackage` over the
> normalized DOCX). Any drift between this report and the inspector
> means the BM-171 inspector evidence is the source of truth — the
> intake report is a pre-flight prediction only.

The footnotes column is critical: BM-001 final-audit
`docxParts.footnotes: NOT_APPLICABLE_BY_TEMPLATE` (separators only)
and `docxParts.endnotes: NOT_APPLICABLE_BY_TEMPLATE`. The same shape
is expected for BM-171. If the inspector finds real numbered notes
for BM-171 (e.g. the body hints `... (Ban hành theo Thông tư...)`),
then the audit gate MUST upgrade to `PASS` (not `NOT_APPLICABLE`) and
this intake's prediction would need revising — that is a future
implementation diagnostic, not a current error.

## 7. Style profile requirements

### 7.1 Typographic rules inferred from the BM-171 source body

The BM-171 source DOCX uses the same Vietnamese prosecution office
typographic conventions as BM-001. From the extracted paragraphs the
following visible-text fragments carry typographic intent:

| fragment (visible rendered text) | part | style | rationale |
|---|---|---|---|
| `TP. Hồ Chí Minh,` (place-date line) | `document` | italic, 14pt | right-aligned national doc header; matches BM-001 rule `bm001.place_date_line` (which we will NOT reuse — this is a per-BM profile rule). |
| `QUYẾT ĐỊNH` (body title) | `document` | bold, 14pt | heading line of the drafter's bloc. |
| `TRẢ LẠI TÀI SẢN` (subtitle) | `document` | bold, 14pt | direct child of body title. |
| `Điều 1.` (article I) | `document` | bold, 14pt | "Điều 1." / "Điều 2." lines are typographic headings, not slot binding fragments. |
| `Điều 2.` (article II) | `document` | bold, 14pt |  |
| `Nơi nhận:` | `document` | bold, 14pt | archive block heading. |
| `Lưu: HSVA, HSKS, VP.` (archive line) | `document` | 11pt | matches BM-001 rule `bm001.archive_line` semantics; we will NOT reuse — per-BM profile. |
| Signature titles (not part of locked contract — see below) | n/a | n/a | the signature section in BM-171 consists of separated paragraphs at blockIds `P0050`/`P0051`/`P0055` with no surrounding bold heading; the ENGINE therefore should NOT inject bold/14pt onto them unless a human reviewer confirms the visual signal. |

### 7.2 Reuse vs. per-BM profile decision

The PR6G.4 generic style profile engine is **registry-based** —
adding BM-171 means adding a `BM171_STYLE_PROFILE` constant in a
new file (`bm171-style-profile.ts`) and registering it through
`registerStyleProfile` in `index.ts`. The generic engine code MUST
NOT change.

### 7.3 Per-BM profile contract (drafted; not yet produced)

The future BM-171 style profile file will live at
`apps/api/src/modules/documents/rendering/infrastructure/style-profile/bm171-style-profile.ts`
and export:

```ts
export const BM171_STYLE_PROFILE: DocxStyleProfile = {
  templateCode: 'BM-171',
  profileId: 'bm-171-vks-khu-vuc-7',
  profileName: 'BM-171 — QĐ trả lại tài sản typographic profile',
  rules: [
    /* generated from §7.1, none copied from BM-001 */
  ],
};
```

Registration happens in `style-profile/index.ts`:

```ts
import { BM171_STYLE_PROFILE } from './bm171-style-profile';
const BUILTIN_PROFILES: ReadonlyArray<DocxStyleProfile> = [
  BM001_STYLE_PROFILE,
  BM171_STYLE_PROFILE,   // NEW
];
```

### 7.4 MUST / MUST NOT

- MUST NOT copy any string from
  `style-profile/bm001-style-profile.ts` into
  `bm171-style-profile.ts`. The BM-171 rules are authored against the
  BM-171 source body, not the BM-001 source body. (The two profiles
  share a typographic vocabulary — Times New Roman 13pt base + bold
  headings, italic date line — but the matcher texts are different.)
- MUST NOT mutate `docx-style-rule-engine.ts`, `docx-style-profile.types.ts`,
  `template-style-profile.registry.ts`. The engine is generic.
- MUST NOT introduce a new document-level `<w:docDefaults>` or `<w:styles>`
  mutation. All styling is run-property injection, per the PR6G.4 contract.

## 8. Expected rendered text evidence (proposed for the future parity spec)

The future `pr6g31-bm171-rendered-docx-parity.spec.ts` (analogue of
`pr6g31-bm001-rendered-docx-parity.spec.ts`) must lock the BM-171
*rendered DOCX*, not just the payload. The expected evidence strings
below are derived from the locked contract's renderBindings + the
visible body fragments in the extracted DOCX.

### 8.1 Presence assertions

| # | rendered-DOCX must contain |
|---:|---|
|  1 | `ngày DD tháng MM năm YYYY` form for `document.issuePlaceAndDateLine` (leading zeros preserved). |
|  2 | `Căn cứ Quyết định khởi tố vụ án hình sự số {code} ngày {date} của {investigationAgencyName} về tội "{offenseName}" quy định tại {clause} {article} của Bộ luật Hình sự;` |
|  3 | `Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số {code} ngày {date} của {investigationAgencyName};` |
|  4 | `Xét thấy tài sản nêu trên không liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, người quản lý hợp pháp,` (default wording; alternative template wording should also be accepted if `considerationLine` is non-empty). |
|  5 | `Điều 2. Yêu cầu {investigationAgencyName} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.` (default for `executionRequestLine`). |
|  6 | `Nơi nhận:` heading. |
|  7 | `- {investigationAgencyName};` (computed `recipients.line1`). |
|  8 | `- Lưu: HSVA, HSKS, VP.` (computed `recipients.archiveLine`). |
|  9 | `KT. VIỆN TRƯỞNG` (default `signature.signMode`). |
| 10 | `{signerName}` (typed `signature.signerName`). |

### 8.2 Drift assertions (must NOT contain)

| # | rendered-DOCX must NOT contain |
|---:|---|
|  1 | `{{assetOwner.fullName}}` or any other `{{...}}` placeholder. |
|  2 | `Lưu: HSVV, VP.` (the BM-001 legacy fallback). |
|  3 | `undefined`, `null`, `[object Object]`, `Invalid Date`. |
|  4 | The literal `{{{` or `}}}` sequence. |
|  5 | Empty `ngày  tháng  năm` (zero-fill drift). |

### 8.3 Style-engine presence assertions

After the BM-171 style profile is registered, the rendered DOCX must
contain typographic mutations whose proof is the existence of the
mutation, not the string text:

| # | rule id (future) | evidence |
|---:|---|---|
|  1 | `bm171.place_date_line` | the `w:datePart/@w:val` of the `TP. Hồ Chí Minh,` paragraph is `28` (14pt); italic on `<w:i/>` exists on the matched run. |
|  2 | `bm171.body_title` | `QUYẾT ĐỊNH` paragraph has `<w:b/>` and `w:sz w:val="28"`. |
|  3 | `bm171.subtitle` | `TRẢ LẠI TÀI SẢN` paragraph has `<w:b/>` and `w:sz w:val="28"`. |
|  4 | `bm171.article_1` | `Điều 1.` paragraph has `<w:b/>` and `w:sz w:val="28"`. |
|  5 | `bm171.article_2` | `Điều 2.` paragraph has `<w:b/>` and `w:sz w:val="28"`. |
|  6 | `bm171.noi_nhan` | `Nơi nhận:` paragraph has `<w:b/>` and `w:sz w:val="28"`. |
|  7 | `bm171.archive_line` | `Lưu: HSVA, HSKS, VP.` paragraph has `w:sz w:val="22"` (11pt). |

These three assertion categories — payload parity, drift, style —
are exactly the structure of the existing BM-001 parity spec
(`pr6g31-bm001-rendered-docx-parity.spec.ts`) plus the BM-001 style
integration spec (`docxtemplater-contract-render-engine-style-profile.spec.ts`).
The future PR7A implementation produces two specs in this shape:

1. `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts`
2. `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-bm171-style-profile.spec.ts`

The Plan-mode user has explicitly forbidden the future PR from writing
code in this intake PR. This section is therefore **proposed shape
only** — the tests themselves are a future PR concern.

## 9. Field coverage (gate 2 evidence)

### 9.1 Required shape (analogue of `BM001_FIELD_COVERAGE.latest.json`)

The future PR7A implementation must produce
`docs/audit/unified-bm-workspace/BM171_FIELD_COVERAGE.latest.json`
in the exact same shape as `BM001_FIELD_COVERAGE.latest.json`. The
intake report declares the expected 34 rows:

```jsonc
{
  "generatedAt": "<runtime>",
  "schemaVersion": "1",
  "scope": ["BM-171 docxSlots from locked contract"],
  "counts": { "docxSlots": 34 },
  "slotRows": [
    /* 34 rows; one per §3 row, all `status: PASS`, `required: <bool>` */
  ]
}
```

### 9.2 Coverage expectation

| group | count |
|---:|---:|
| Required & must PASS | 31 |
| Optional but still PASS (PR6G.2 does not gate on required) | 3 (`assetOwner.otherName`, `assetOwner.religion`, `assetOwner.temporaryResidence`) |
| Total | 34 |

`totalSlots === coveredSlots === 34`. `missingSlots === []`. The
PR6G.5 gate 2 (`field-coverage`) will read this artefact and report
PASS for BM-171 (no BM-001-specific path inside the generic
`field-coverage` check; see PR6G.5 PR strict-rule table row 6).

## 10. Docx parts audit (gate 3 + 4 evidence)

The PR6G.2 harness output for BM-171 (predicted by this report) is:

```jsonc
{
  "docxParts": {
    "status": "PASS",
    "mainDocument": "PASS",
    "headers": "NOT_APPLICABLE",
    "footers": "NOT_APPLICABLE",
    "footnotes": "NOT_APPLICABLE_BY_TEMPLATE",
    "endnotes": "NOT_APPLICABLE_BY_TEMPLATE",
    "comments": "NOT_APPLICABLE"
  },
  "notes": [
    "docxParts.footnotes evidence: word/footnotes.xml carries only separator entries (-1 and 0) — no numbered notes",
    "docxParts.endnotes evidence: word/endnotes.xml carries only separator entries (-1 and 0) — no numbered notes"
  ]
}
```

This shape is **identical** to BM-001's `docxParts` block in the
PR6G.2 final audit, which is exactly the prediction we want. The
final-audit `renderedContent` section is also expected to mirror the
BM-001 shape (`status: PASS`, `leakedTokens: []`,
`missingExpectedText: []`) after the parity spec is added and run.

## 11. Style / sign-off (gate 15 evidence)

The PR6G.5 gate 15 (`visual-style-signoff`) only flips to PASS once
a human-rendered DOCX is eyeballed and a manual approval lands at
`docs/audit/bm-visual-signoff/BM-171/manual-approval.latest.json`.

This intake report DOES NOT claim sign-off. The future PR7A
implementation produces the rendered DOCX packet (analogue of
`build-bm001-visual-signoff-packet.mjs`); the Planner eyeball is a
separate Planner-controlled step.

Today:

- `docs/audit/bm-visual-signoff/BM-171/` does NOT exist (verified).
- No `manual-approval.latest.json` exists yet.
- The PR6G.5 rollout-ready gate for BM-171 will return
  `status=BLOCKED_TECHNICAL` (no final audit yet) at first run, and
  `status=BLOCKED_MANUAL_REVIEW` once the audit finishes but before
  sign-off. Neither is `READY`.

## 12. Rollout plan (future PR7A implementation PR)

This intake report's future-sibling PR — call it `feat/pr7a-bm171-rollout` —
must carry out (and only) the steps below. After completing them, it
will request Planner sign-off on a single rendered DOCX packet.

### PR7A.1 — BM-171 panel + shared mapping wiring

| # | step | rationale |
|---:|---|---|
| 1 | `pnpm audit:bm-final -- BM-171` produces `docs/audit/bm-final/BM-171/final.latest.{json,md}` | generic harness runs against the locked contract + normalized DOCX; no BM-001-specific code paths. |
| 2 | `BM171_FIELD_COVERAGE.latest.json` produced (and committed) as a one-shot artefact. | gate 2 evidence. |
| 3 | `apps/web/src/lib/bm171-form-inputs-api.ts` (or its equivalent under `apps/web/src/components/documents/bm-form/` per the future folder convention) created; types mirror §4 sections; dates & archive line call the **shared** toolkit; no local helpers that duplicate `formatVietnamesePlaceDateLine` / `buildArchiveLine`. | mirrors `bm001-form-inputs-api.ts`. |
| 4 | `apps/web/src/components/documents/bm-171-form-inputs.tsx` (or its replacement) writes through the §4 sections; UI consumes ONLY the canonical field set. | replaces the pre-PR6G.* legacy form. |
| 5 | `document-renderer.service.ts` gains a narrow BM-171 adapter, mirroring the BM-001 narrow adapter pattern. The adapter emits aligned companion fields (e.g. `bm171DocumentIssuePlaceDateLineAligned`) that the parity spec consumes. | PR6G.3.1 lesson — payload parity ≠ rendered DOCX parity until the adapter proves alignment. |
| 6 | No DB write from `/templates/:templateCode`. No fake `generatedDocumentId`. (Same rules as BM-001 final audit.) |

### PR7A.2 — BM-171 style profile + rendered-DOCX parity spec

| # | step | rationale |
|---:|---|---|
| 1 | `apps/api/src/modules/documents/rendering/infrastructure/style-profile/bm171-style-profile.ts` created with rules from §7.1. | per-BM profile, registered through the generic engine. |
| 2 | `apps/api/src/modules/documents/rendering/infrastructure/style-profile/index.ts` extended to import `BM171_STYLE_PROFILE` and append it to `BUILTIN_PROFILES`. | generic, additive, no engine mutation. |
| 3 | `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts` produced. Asserts presence (§8.1) and absence (§8.2) of evidence strings. | analogue of BM-001 parity spec. |
| 4 | `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-bm171-style-profile.spec.ts` produced. Asserts no-op for non-BM-171 templates and auto-application for BM-171. | analogue of the BM-001 style integration spec. |

### PR7A.3 — BM-171 final audit + rollout readiness gate

| # | step | rationale |
|---:|---|---|
| 1 | `pnpm audit:bm-final -- BM-171` re-run; artefact is green. | gate 1 + 2 + 3 + 4 |
| 2 | `node scripts/audit/audit-bm-rollout-ready.mjs BM-171` run; readiness artefact produced at `docs/audit/bm-rollout/BM-171/readiness.latest.{json,md}` with `status: BLOCKED_MANUAL_REVIEW` (visual sign-off pending). | gate 5..14 evidence, gate 15 surfaced. |
| 3 | Visual sign-off packet builder produces `docs/audit/bm-visual-signoff/BM-171/{rendered.latest.docx, extracted-text.latest.txt, document-xml-inspection.latest.json, manual-approval.latest.json, visual-signoff.latest.json}`. Planner reviews; on GRANTED, final audit `style.status: PASS`, gate 15 reads PASS, readiness flips to `READY`. | mirror of `build-bm001-visual-signoff-packet.mjs`. |
| 4 | BM-171 locked-compiled status re-checked (`docs/audit/sot-gates-v1/latest.json`). Existing `CONSISTENT` + 1 LOW warning is unchanged → gate 10 PASS. | no contract mutation; consistency preserved. |

### PR7A.4 — strict rules checklist (Planner-verified before merge)

| rule | status (predicted after the future PR lands) |
|---|---|
| 1. No BM-171 implementation in PR6G.x branches. | ✓ — PR7A is its own branch. |
| 2. No BM-002..BM-213 work. | ✓ — PR6G.5 explicit-target-only contract is unchanged. |
| 3. No mutation of locked contracts or normalized DOCX. | ✓ — PR6G.5 gate scans for write paths. |
| 4. No weakening of source guards. | ✓ — unchanged from the BM-001 baseline (22 findings). |
| 5. No fake `generatedDocumentId`. | ✓ — PR6G.5 gate 12 still scans runtime files. |
| 6. No DB write from `/templates/...`. | ✓ — PR6G.5 gate 13 still scans runtime files. |
| 7. BM-001 unchanged. | ✓ — this PR touches no `BM-001` file. |
| 8. BM-171 `rolloutReady` only flips to `true` after visual sign-off. | ✓ — gate 15 enforces it. |
| 9. All BM-171 spec tests pass. | ✓ — inherited test discipline from BM-001. |
| 10. No BM-001-only hardcoded paths inside the generic code. | ✓ — BM-171 is a per-BM adapter + per-BM profile, both additive. |

## 13. Non-goals (explicit)

- ❌ No BM-171 UI panel implementation in **this intake PR**. The
  intake report only produces the metadata artefacts under
  `docs/audit/unified-bm-workspace/` and possibly this single MD
  file. No `/templates/BM-171` paint, no `bm-171-form-inputs.tsx`
  mutation.
- ❌ No `bm171-style-profile.ts` in **this intake PR**. Style profile
  is a future PR7A.2 step.
- ❌ No `pr6g31-bm171-rendered-docx-parity.spec.ts` in **this intake
  PR**. Spec is a future PR7A.2 step.
- ❌ No `audit-bm-final -- BM-171` run in **this intake PR**.
  Running the harness writes `docs/audit/bm-final/BM-171/...`;
  per the user directive that work belongs to the BM-171
  implementation PR, not the intake PR. (See §0.)
- ❌ No `audit:bm-rollout-ready -- BM-171` run in **this intake PR**
  for the same reason — it would write
  `docs/audit/bm-rollout/BM-171/...` and pre-empt the future PR's
  own evidence.
- ❌ No mass rollout. No `--all` switch. No BM-002..BM-213 lockups.
- ❌ No copy-paste from `apps/web/src/components/documents/bm-171-form-inputs.tsx`
  into the future PR7A. The legacy form is information for the
  intake report only — it is NOT the final BM-171 panel.

## 14. Failure-log update

This intake session did not fail. No entry is appended to
`.ai/harness/project_failure-log.md`. If the future PR7A
implementation runs the BM-171 final audit and the inspector reports
something different from §6 / §10, that PR MUST append a failure-log
entry with the actual inspector output and a root-cause diagnosis
(vs the intake prediction).

## 15. Next concrete step

The Planner-controlled next step is to open the implementation PR
(`feat/pr7a-bm171-rollout`) following the plan in §12. This intake
report is the input to that PR's pre-flight checklist. No work
begins on the implementation until the Planner signals to proceed.

Until then, BM-001 remains the only rollout-ready BM in this
repository. BM-171 status, by the rollout-ready gate, remains
`BLOCKED_TECHNICAL` (no final audit yet) — and that is the correct
honest status today.
