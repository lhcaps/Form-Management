# PR7A — BM-171 Rendered Text Evidence Manifest

> **Purpose:** the future PR7A implementation PR
> (`feat/pr7a-bm171-rollout`) must produce a parity spec at
> `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts`
> whose assertions are pinned to the visible-text evidence listed
> here. This manifest is the **input** to that spec — not the spec
> itself.
>
> **Shape:** mirrors `pr6g31-bm001-rendered-docx-parity.spec.ts` (its
> `evidenceBlock` + `driftBlock`) so the future spec can be written
> straight from this manifest.
>
> **Status:** proposed only. Nothing has been rendered yet — the
> paragraphs below are the predicted evidence the future parity spec
> will assert on the **actual rendered DOCX** (after docxtemplater +
> the BM-171 style profile post-processor run).

## 0. Method (per PR6G.3.1)

1. Build a BM-171 fixture payload whose slot values mirror what
   `document-renderer.service.ts` (with the future BM-171 narrow
   adapter) emits for BM-171.
2. Render through the real `DocxtemplaterContractRenderEngine`
   against the locked BM-171 contract.
3. Run the future BM-171 style profile post-processor on the rendered
   DOCX.
4. Extract `word/document.xml` text and assert:
   - presence of every "must contain" string,
   - absence of every "must NOT contain" string.

If any future change to `document-renderer.service.ts` regresses
BM-171 the spec fails before the regression can ship.

## 1. Presence assertions (`mustContain`)

The future parity spec renders the DOCX with the canonical BM-171
fixture values listed below. Every `mustContain` block must be found
verbatim in the rendered `word/document.xml` text.

| # | category | asserted substring | notes |
|---:|---|---|---|
|  1 | identity-issue date (NO `ngày` token) | `14/12/2021` (sample `assetOwner.identityIssuedDateText`) | preserves `dd/mm/yyyy` form with leading zeros; uses `formatSlashDate`. |
|  2 | birth date | `08/09/1985` (sample `assetOwner.dateOfBirthText`) |  |
|  3 | place-date line | `, ngày 04 tháng 07 năm 2026` (sample `document.issuePlaceAndDateLine`) | `formatVietnamesePlaceDateLine` preserves leading zeros (PR6G.3.1 lesson). |
|  4 | procedure legal basis | `Căn cứ Điều 41, Điều 106 của Bộ luật Tố tụng hình sự;` (default `legalBasis.procedureArticlesLine`) |  |
|  5 | case-decision line | `Căn cứ Quyết định khởi tố vụ án hình sự số 07/QĐ-KTVA ngày 12 tháng 03 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội "Đánh bạc" quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;` | computed from `caseDecision.*` + `assetReturn.{investigationAgencyName, offenseName, legalClause, legalArticle}`. |
|  6 | accused-decision line | `Căn cứ Quyết định khởi tố bị can số 08/QĐ-KTBC ngày 13 tháng 03 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Nguyễn Văn A về tội "Đánh bạc" quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;` | computed when `includeAccusedDecisionLine = true`. |
|  7 | investigation-conclusion line | `Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 01/KLĐT ngày 04 tháng 07 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;` | computed from `assetReturn.{investigationConclusionCode, investigationConclusionLegalBasisLine}`. |
|  8 | case-suspension-decision line (conditional) | `Căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án hình sự số 171/QĐ-VKSKV7 ngày 04 tháng 07 năm 2026 của Viện kiểm sát nhân dân khu vực 7;` | present only when `includeCaseSuspensionDecisionLine = true`. |
|  9 | accused-suspension-decision line (conditional) | `Căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án hình sự đối với bị can số 172/QĐ-VKSKV7 ngày 04 tháng 07 năm 2026 của Viện kiểm sát nhân dân khu vực 7;` | present only when `includeAccusedSuspensionDecisionLine = true`. |
| 10 | consideration line | `Xét thấy tài sản nêu trên không liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, người quản lý hợp pháp,` (default) | `assetReturn.considerationLine`. |
| 11 | asset-list line | `01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án.` | `assetReturn.assetListLine` (default `, .` ending). |
| 12 | asset-owner block | `Cho ông/bà: Nguyễn Văn A Giới tính: Nam` | conditional `includeAccusedDecisionLine` not required for this block. |
| 13 | asset-owner date-of-birth block | `Sinh ngày 08 tháng 09 năm 1985 tại: tỉnh Quảng Ngãi` |  |
| 14 | asset-owner identity block | `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: 051080000314` |  |
| 15 | execution-request line | `Điều 2. Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.` (default) | `assetReturn.executionRequestLine`. |
| 16 | recipients block heading | `Nơi nhận:` |  |
| 17 | recipients.line1 | `- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;` | computed. |
| 18 | recipients.archiveLine | `- Lưu: HSVA, HSKS, VP.` | `buildArchiveLine()` no-dash fallback. |
| 19 | signature.signMode | `KT. VIỆN TRƯỞNG` |  |
| 20 | signature.signerName | the typed signer name (no fixture hardcode in this manifest) | the spec fixture fills it. |
| 21 | end-of-document marker | `/-` placeholder paragraph (whitespace-only) | spec should NOT assert on whitespace — only on visible text. |

## 2. Drift assertions (`mustNotContain`)

| # | category | forbidden substring | rationale |
|---:|---|---|---|
|  1 | unresolved docx placeholder | any `{{...}}` for slots in §3 of `PR7A_BM171_INTAKE.latest.md` | forbidden-token leak detector (PR6G.2 §LEAKED_TOKEN_PATTERNS). |
|  2 | legacy archive-line fallback | `Lưu: HSVV, VP.` | PR6G.3.1 BM-001 legacy fallback is NOT a BM-171 fallback either. |
|  3 | serialised `undefined` | literal `undefined` (case-sensitive) | PR6G.2 §LEAKED_TOKEN_PATTERNS. |
|  4 | serialised `null` | literal `null` as a standalone word (case-sensitive) | PR6G.2 §LEAKED_TOKEN_PATTERNS; legitimate Vietnamese "null" or "NULL" must not be in the rendered DOCX anyway. |
|  5 | serialised object | literal `[object Object]` |  |
|  6 | invalid date | literal `Invalid Date` |  |
|  7 | placeholder braces | triple `{{{` or `}}}` sequence |  |
|  8 | zero-fill Vietnamese date | `ngày  tháng  năm ` (empty parts) | drift asserted by the toolkit (parts are non-empty or zero-string). |
|  9 | typed-as-`undefined` field names | `undefined` anywhere inside paragraph 19 (`document.issuePlaceAndDateLine`) | spec must catch empty-date fallback regressions. |

## 3. Style-engine presence assertions (`styleProfileApplied`)

These assertions prove the future BM-171 style profile ran the
typographic mutations §7 of the intake report promises. They use the
XML walk that the existing `docx-style-rule-engine.ts` exposes; the
future parity spec reuses the same helpers.

| # | rule id (future) | part | expected run-property hint |
|---:|---|---|---|
|  1 | `bm171.place_date_line` | `document` | the `TP. Hồ Chí Minh,` matched paragraph has `<w:i/>` set and `<w:sz w:val="28"/>` (14pt) on the matched run. |
|  2 | `bm171.body_title` | `document` | the `QUYẾT ĐỊNH` matched paragraph has `<w:b/>` and `<w:sz w:val="28"/>`. |
|  3 | `bm171.subtitle` | `document` | the `TRẢ LẠI TÀI SẢN` matched paragraph has `<w:b/>` and `<w:sz w:val="28"/>`. |
|  4 | `bm171.article_1` | `document` | the `Điều 1.` matched paragraph has `<w:b/>` and `<w:sz w:val="28"/>`. |
|  5 | `bm171.article_2` | `document` | the `Điều 2.` matched paragraph has `<w:b/>` and `<w:sz w:val="28"/>`. |
|  6 | `bm171.noi_nhan` | `document` | the `Nơi nhận:` matched paragraph has `<w:b/>` and `<w:sz w:val="28"/>`. |
|  7 | `bm171.archive_line` | `document` | the `Lưu: HSVA, HSKS, VP.` matched paragraph has `<w:sz w:val="22"/>` (11pt). |
|  8 | (none for the signature section) | n/a | the BM-171 source body separates signMode / positionTitle / signerName into distinct paragraphs without a bold heading above them. **A future implementation may decide to add or omit a signature-heading rule; this manifest documents the current best-effort prediction only.** |

## 4. Non-applicability assertions

| # | assertion | why |
|---:|---|---|
|  1 | the future spec MUST assert that `applyStyleProfileToDocxBuffer(buffer, "BM-NONEXISTENT")` is a byte-identical no-op. | mirrors `docxtemplater-contract-render-engine-style-profile.spec.ts` no-op section. |
|  2 | the future spec MUST NOT assert that BM-001's profile rules apply to BM-171. | the BM-171 profile is per-BM; cross-application is a future option, not an obligation. |

## 5. Fixture values (locked by this manifest)

These concrete sample values are the **fixture input** for the parity
spec. They are not legal advice; they match the BM-001 parity
spec's discipline (real-shaped values that exercise every common
code path — date formatting, identity-date formatting, derived
constant text, conditional decides).

```jsonc
{
  "agency": {
    "parentName": "Viện kiểm sát nhân dân tối cao",
    "name": "Viện kiểm sát nhân dân khu vực 7",
    "issuePlace": "TP. Hồ Chí Minh"
  },
  "document": {
    "documentCode": "171/QĐ-VKSKV7",
    "issueDate": "2026-07-04",
    "issuePlaceAndDateLine": "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026"
  },
  "official": {
    "issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7"
  },
  "legalBasis": {
    "procedureArticlesLine": "Căn cứ Điều 41, Điều 106 của Bộ luật Tố tụng hình sự;"
  },
  "caseDecision": {
    "decisionCode": "07/QĐ-KTVA",
    "decisionDate": "2026-03-12",
    "prosecutionDecisionLegalBasisLine": ""
  },
  "accusedDecision": {
    "decisionCode": "08/QĐ-KTBC",
    "decisionDate": "2026-03-13",
    "accusedName": "Nguyễn Văn A",
    "prosecutionDecisionLegalBasisLine": ""
  },
  "assetReturn": {
    "includeAccusedDecisionLine": true,
    "includeCaseSuspensionDecisionLine": true,
    "includeAccusedSuspensionDecisionLine": true,
    "agencyBodyName": "Viện kiểm sát nhân dân khu vực 7",
    "investigationAgencyName": "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    "offenseName": "Đánh bạc",
    "legalClause": "khoản 1",
    "legalArticle": "Điều 321",
    "accusedName": "Nguyễn Văn A",
    "investigationConclusionCode": "01/KLĐT",
    "investigationConclusionDate": "2026-07-04",
    "investigationConclusionLegalBasisLine": "",
    "caseSuspensionDecisionCode": "171/QĐ-VKSKV7",
    "caseSuspensionDecisionDate": "2026-07-04",
    "caseSuspensionDecisionLegalBasisLine": "",
    "accusedSuspensionDecisionCode": "172/QĐ-VKSKV7",
    "accusedSuspensionDecisionDate": "2026-07-04",
    "accusedSuspensionDecisionLegalBasisLine": "",
    "considerationLine": "Xét thấy tài sản nêu trên không liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, người quản lý hợp pháp",
    "assetListLine": "01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án",
    "executionRequestLine": ""
  },
  "assetOwner": {
    "fullName": "Nguyễn Văn A",
    "genderText": "Nam",
    "otherName": "Không có",
    "dateOfBirth": "1985-09-08",
    "dateOfBirthText": "08/09/1985",
    "placeOfBirth": "tỉnh Quảng Ngãi",
    "nationality": "Việt Nam",
    "ethnicity": "Kinh",
    "religion": "Không",
    "occupation": "Kinh doanh",
    "identityNo": "051080000314",
    "identityIssuedDate": "2021-12-14",
    "identityIssuedDateText": "14/12/2021",
    "identityIssuedPlace": "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
    "permanentResidence": "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    "temporaryResidence": "Không có",
    "currentResidence": "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh"
  },
  "recipients": {
    "line1": "",
    "archiveLine": ""
  },
  "signature": {
    "signMode": "KT. VIỆN TRƯỞNG",
    "positionTitle": "PHÓ VIỆN TRƯỞNG",
    "signerName": "<filled by spec>"
  }
}
```

All fixtures call the **`@qllaw/form-contracts`** helpers (PR6G.3
generic toolkit), NOT local BM-171-specific date helpers. The parity
spec proves that the toolkit reuse works for BM-171 in exactly the
same way it does for BM-001.

## 6. Mapping requirements (this manifest's companion)

For each of the 34 slots, this manifest cross-references the
`@qllaw/form-contracts` call site the future BM-171 implementation
must use. The mapping rules below produce the §1 evidence strings.

| slot | required helper | fallback |
|---|---|---|
| `document.issuePlaceAndDateLine` | `formatVietnamesePlaceDateLine({ place, isoDate, defaultPlace })` from `place-date-line.js` | `""` if both `place` and `defaultPlace` are empty. |
| `assetOwner.dateOfBirthText` | `splitIsoDateToVietnameseParts` + `formatSlashDate` | `""` if input is empty / malformed. |
| `assetOwner.identityIssuedDateText` | `splitIsoDateToVietnameseParts` + `formatSlashDate` | `""` if input is empty / malformed. |
| `recipients.archiveLine` | `buildArchiveLine(input)` with no-dash fallback `'Lưu: HSVA, HSKS, VP.'` | the `HSVA` fallback matches BM-001. |
| every other slot | `normalizeTextInput` / `emptyStringIfMissing` | `""` (no fabrication). |
| `assetOwner.genderText` | identity; UI provides a `select` enum (Nam/Nữ) per the locked contract `options` field. | `""`. |
| `signature.signMode` / `positionTitle` / `signerName` | identity; UI select options curated from official preferences. | `""`. |

## 7. Style profile requirements (this manifest's companion)

For each of the 7 typographic mutation rules this manifest predicts
(§3), the future BM-171 implementation MUST author them in
`bm171-style-profile.ts` with `match.text` strings that are BM-171-
specific — i.e. zero overlap with the BM-001 profile matcher text.
The matcher strings are derived solely from the BM-171 source DOCX
visible body (`QUYẾT ĐỊNH`, `TRẢ LẠI TÀI SẢN`, `Điều 1.`,
`Điều 2.`, `Nơi nhận:`, `Lưu: HSVA, HSKS, VP.`, `TP. Hồ Chí Minh,`).

The profile file MUST NOT mutate the engine code
(`docx-style-rule-engine.ts`, `docx-style-profile.types.ts`,
`template-style-profile.registry.ts`). It is data only.

The registration site is `style-profile/index.ts`'s `BUILTIN_PROFILES`
array. The append is **additive**: BM-001 stays first, BM-171
appended second, the engine keeps working unchanged.
