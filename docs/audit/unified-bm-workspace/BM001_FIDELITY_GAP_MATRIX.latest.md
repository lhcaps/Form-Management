# BM-001 Fidelity Gap Matrix — Pre-Repair Audit

**Generated**: 2026-07-07T10:35:00Z (Phase 2 — gap matrix before any code mutation)
**Phase**: BM-001 FIDELITY REPAIR WITH VERIFIED NOTES
**Source of truth**: `docs/audit/unified-bm-workspace/QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json` (213 forms, BM-001 included)
**Target**: `FIDELITY_COMPLETE_EVIDENCED` (BM-001 only)
**Reference**: BM-171 canonical profile in `apps/web/src/lib/form-flight/profiles/bm171.ts`

---

## 1. Source-of-truth evidence (cross-checked before writing the matrix)

| Artifact | Path | Status |
|---|---|---|
| DOCX file | `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/01. TIEP NHAN GIAI QUYET NGUON TIN VE TOI PHAM/01-Biên bản tiếp nhận nguồn tin về tội phạm.doc` (sha256 `f4c2aa3682d3c2fbe68e1b88293e5a6024dfbce003e0203bdf1d163e12819d8e`) | **FOUND** |
| Normalized DOCX | `storage\templates\normalized-docx\BM-001\BM-001_normalized.docx` | **FOUND** |
| Locked contract | `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json` | **FOUND** |
| Locked contract `docxSlots.length` | 39 (matches prompt verbatim) | **MATCH** |
| UI adapter | `apps/web/src/components/documents/bm-001-form-inputs.tsx` | **FOUND** |
| Helper API | `apps/web/src/lib/bm001-form-inputs-api.ts` | **FOUND** |
| Options | `apps/web/src/lib/bm001-options.ts` | **FOUND** |
| Form Flight profile (current) | `apps/web/src/lib/form-flight/profiles/bm001.ts` | **SKELETON** (no `runtimeReady`, no `profileStatus`) |
| Notes status (verified extractor) | `NO_NOTES_WITH_EVIDENCE` | **PASS** |
| Profile-registry guard test #4 | asserts BM-001 must NOT yet be runtime-ready | **WILL BE UPDATED** |

---

## 2. Required BM-001 known sections (from prompt + locked contract evidence)

| # | Section | DOCX/Contract Evidence | UI Coverage | Notes |
|---|---|---|---|---|
| 1 | Header / cơ quan / văn bản | `P0010` `document.issuePlaceDateLine` + canonical fields `agency.*` (parentName/name/issuePlace) + `document.issueDate` (renormalized to issuePlaceDateLine via systemDate transform) | Section 1 (`1. Cơ quan lập biên bản`) + `document.issueDate` exposed via `Bm001DateField` (line 764) | UI stores ISO `issueDate`; canonical field is `issuePlaceDateLine` (computed from `document.issueDate` + agency + issue place via backend `systemDate` transform) |
| 2 | Thời gian, địa điểm tiếp nhận | `reception.startedAtTimeText/day/month/year/locationName` + `reception.endedAtTimeText/day/month/year` | Section 2 (`2. Thời gian / địa điểm tiếp nhận`) | UI stores `reception.startedAtDate`/`endedAtDate` ISO; helper `normalizeBm001FormInputs` derives day/month/year parts on read |
| 3 | Người tiếp nhận | `receiver.fullName/positionTitle/departmentName` | Section 3 (`3. Người tiếp nhận`) | ✓ |
| 4 | Người cung cấp nguồn tin | `informant.fullName/genderLabel/otherName/dateOfBirth(parts)/placeOfBirth/nationality/ethnicity/religion/occupation/identityNo/identityIssuedDate(parts)/identityIssuedPlace/permanentAddress/temporaryAddress/currentAddress/phone/representedOrganization/signerName` | Section 4 (`4. Người cung cấp nguồn tin`) | ✓ + UI exposes both ISO and year parts |
| 5 | I. Nội dung nguồn tin về tội phạm | `crimeReport.content` | Section 5 (`5. Nội dung nguồn tin về tội phạm`) | ✓ |
| 6 | II. Tài liệu, đồ vật giao nộp kèm theo | `crimeReport.attachedItemsDescription` | Section 6 (`6. Tài liệu, đồ vật giao nộp kèm theo`) | ✓ |
| 7 | Kết thúc biên bản | `reception.endedAtTimeText/day/month/year` | Section 2 (combined with start in UI) | ✓ |
| 8 | Chữ ký người cung cấp / người tiếp nhận | `informant.signerName` + `receiver.signerName` | Section 3 (receiver.signerName) + Section 4 (informant.signerName) | ✓ |
| 9 | Dòng lưu hồ sơ / `recipients.archiveLine` | `recipients.archiveLine` | Section 7 (`7. Dòng lưu hồ sơ`) | ✓ |
| 10 | Notes (verified NO_NOTES_WITH_EVIDENCE) | 0 `<w:footnoteReference>` in body | none required | confirmed via verified extractor (prompt § CONTEXT) |

---

## 3. Fidelity gap matrix (20 rows)

Legend:
- **Status** — PASS = matches BM-171 evidence, no repair needed · PARTIAL = present but incomplete · FAIL = missing/broken · N/A = not applicable (e.g. notes for NO_NOTES_WITH_EVIDENCE)
- **Repair Needed** — KEEP / ADD / REPLACE / NONE

| # | Area | DOCX/Contract Evidence | Current UI/Profile Evidence | Status | Repair Needed | File |
|---|---|---|---|---|---|---|
| 1 | Agency / header | `agency.parentName`, `agency.name`, `agency.issuePlace` (via locked contract canonical fields section `Agency`); systemDate transform maps these to `document.issuePlaceDateLine`. | UI `Section 1` covers all three; profile declares them in `fieldPaths`. | PASS | KEEP | `bm001.ts` (profile), `bm-001-form-inputs.tsx` (UI), `bm001-form-inputs-api.ts` (helper) |
| 2 | Document issue place/date | `document.issuePlaceDateLine` (slot 0 + canonical field 0). | UI exposes `document.issueDate` (ISO) — backend transforms to `document.issuePlaceDateLine` on save. **Profile does NOT yet declare `document.issuePlaceDateLine`**. | PARTIAL | ADD `document.issuePlaceDateLine` to `fieldPaths` and `requiredFieldPaths` (it is the actual rendered slot). | `bm001.ts` |
| 3 | Reception start time/date/location | `reception.startedAtTimeText/day/month/year/locationName` (5 slots) | UI exposes `startedAtTimeText`, `startedAtDate` (ISO), `locationName`. Profile declares `startedAtTimeText` + `locationName` but NOT `startedAtDay/Month/Year` (these come from helper read on `startedAtDate`). | PARTIAL | ADD `reception.startedAtDay`, `reception.startedAtMonth`, `reception.startedAtYear` to `fieldPaths` + `requiredFieldPaths`. | `bm001.ts` |
| 4 | Receiver identity | `receiver.fullName/positionTitle/departmentName` (3 required slots) | UI Section 3 + profile. | PASS | KEEP | (no change) |
| 5 | Informant identity group | `informant.fullName`, `informant.genderLabel`, `informant.otherName` (3 required slots) | UI + profile. | PASS | KEEP | (no change) |
| 6 | Informant identity date parts | `informant.birthDay/birthMonth/birthYear` (3 datePart slots, canonical contract fields required) | UI exposes both ISO `dateOfBirth` and `birthYear` text. Profile declares `birthYear` only (NOT `birthDay/birthMonth`). | PARTIAL | ADD `informant.birthDay`, `informant.birthMonth`. Keep `informant.birthYear`. UI keeps storing ISO; helper derives parts via `buildIsoDateFromParts`. | `bm001.ts` |
| 7 | Informant placeOfBirth / nationality / ethnicity / religion / occupation | All required | UI + profile. | PASS | KEEP | (no change) |
| 8 | Informant identity number / issued date parts / issued place | `informant.identityNo`, `informant.identityIssuedDay/Month/Year/Place` (4 required slots) | UI + profile have `identityNo` + `identityIssuedDate` (ISO) + `identityIssuedPlace`. Profile does NOT yet declare `identityIssuedDay/Month/Year`. | PARTIAL | ADD `informant.identityIssuedDay`, `informant.identityIssuedMonth`, `informant.identityIssuedYear`. | `bm001.ts` |
| 9 | Informant addresses / phone / org | `informant.permanentAddress/temporaryAddress/currentAddress/phone/representedOrganization` (5 required slots) | UI + profile. | PASS | KEEP | (no change) |
| 10 | Informant `signerName` + Receiver `signerName` | `informant.signerName` (slot) + `receiver.signerName` (slot, P0047) | UI Section 3 (receiver.signerName) + Section 4 (informant.signerName); profile declares both. | PASS | KEEP | (no change) |
| 11 | `crimeReport.content` (Section I) | Required multilineText slot | UI Section 5 + profile. | PASS | KEEP | (no change) |
| 12 | `crimeReport.attachedItemsDescription` (Section II) | multilineText slot (NOT required at contract level but UI marks required) | UI Section 6 + profile. | PASS | KEEP | (no change) |
| 13 | `reception.endedAtTimeText/day/month/year` | 4 slots + `reception.endedAtDay/Month/Year` | UI exposes `endedAtTimeText` + `endedAtDate` (ISO); profile declares `endedAtTimeText` only. | PARTIAL | ADD `reception.endedAtDay`, `reception.endedAtMonth`, `reception.endedAtYear`. | `bm001.ts` |
| 14 | `recipients.archiveLine` | 1 required slot | UI Section 7 + profile. | PASS | KEEP | (no change) |
| 15 | Notes | Verified extractor says `NO_NOTES_WITH_EVIDENCE` | none expected | N/A | NONE (no footnote UI required; status preserved) | (no change) |
| 16 | Demo fixture | prompt: synthetic, legally plausible Vietnamese, no real PII, distinct receiver/informant, avoid `"Ông  cung cấp..."` blank-name bug, consistent dates/times, archive line, attached items. | Profile `demo: {}` (empty); UI `fillCustomerSample()` populates a legacy sample with the bug. | FAIL | REPLACE — author fresh `BM001_DEMO` in profile matching BM-171 evidence rules. UI `fillCustomerSample` carries the legacy bug; do NOT silently change it (UI keeps its own dedupe for handler-only flow). Profile demo is the canonical render-time fixture. | `bm001.ts` (only) |
| 17 | `summaryLines` | prompt: 6-10 quick-check lines per receiver / informant / time / place / content / items / ending / signatures / archive. | Profile: `summaryLines: undefined`. | FAIL | REPLACE — author `BM001_SUMMARY_LINES` (8 lines). | `bm001.ts` |
| 18 | `acceptance.requiredText` | prompt: `BIÊN BẢN`, `Tiếp nhận nguồn tin về tội phạm`, `Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự`, demo receiver full name, demo informant full name, `I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM`, `II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO`, `Việc tiếp nhận nguồn tin về tội phạm kết thúc`, `NGƯỜI CUNG CẤP`, `NGƯỜI TIẾP NHẬN`. | Profile `requiredText: []` (empty). | FAIL | ADD `BM001_ACCEPTANCE.requiredText` per prompt §3.7. | `bm001.ts` |
| 19 | `acceptance.forbiddenText` | prompt: `{{`, `}}`, `Ông  cung cấp`, `undefined`, `null`, `[object Object]`. | Profile `forbiddenText: []` (empty). | FAIL | ADD `BM001_ACCEPTANCE.forbiddenText` per prompt §3.7. | `bm001.ts` |
| 20 | `staleFallbacks` | prompt: optional, but list `{{`, `}}`, `Ông  cung cấp`, and (if evidence shows legacy bug) `Nguyễn Thị Hồng Hạnh` as informant fallback. Verified: existing UI `fillCustomerSample()` uses `Nguyễn Thị Hồng Hạnh` as receiver fullName AND reuses it as `informant.signerName` fallback (the old bug). | Profile: no `staleFallbacks` field. Type supports `staleFallbacks?: Readonly<Record<string, readonly string[]>>` so we can ADD without changing the type. | FAIL | ADD `BM001_STALE_FALLBACKS` listing `informant.fullName`/`informant.signerName`/`receiver.fullName` legacy placeholder strings (including `Ông  cung cấp` and the legacy receiver name used as signerName fallback). | `bm001.ts` |

### Auxiliary rows

| # | Area | Evidence | Status | Repair | File |
|---|---|---|---|---|---|
| 21 | `runtimeReady` flag | prompt §3.1 + profile-status.ts contract | missing | ADD `runtimeReady: true` | `bm001.ts` |
| 22 | `profileStatus` flag | prompt §3.2 + profile-status.ts contract | missing | ADD `profileStatus: "runtime-ready"` | `bm001.ts` |
| 23 | `aliases` (read-side) | Prompt does not require it for BM-001; UI helper handles alias via `syncBm001PersonAliasesBeforeSave`. | N/A | NONE | (no change) |
| 24 | Read/save helper path | UI calls `getBm001RenderPayload` + `saveBm001FormInputs` + `normalizeBm001FormInputs`. No runtime template paths. | PASS | KEEP (lifecycle boundary observed) | (no change) |
| 25 | Lifecycle boundary | Generated-document lifecycle (`saveDocumentFormInputs`) only. No `/templates/BM-001` route. No `template-runtime-adapter.ts` reference in the BM-001 path. | PASS | KEEP (no change) | (no change) |
| 26 | UI REQUIRED_FIELDS drift vs locked contract vs profile.requiredFieldPaths | UI REQUIRED_FIELDS uses `document.issueDate` (ISO), `reception.startedAtDate` / `endedAtDate` (ISO). Locked contract + profile use canonical `document.issuePlaceDateLine` + day/month/year parts. Profile requiredFieldPaths MUST use canonical paths (the renderer reads canonical). | PARTIAL | profile.requiredFieldPaths uses canonical paths only. UI REQUIRED_FIELDS drift is intentional (UI guards user input, renderer gates canonical fields). Documented in PHASE 4. | (no change) |

---

## 4. Notes status confirmation

| Form | Verified notes status |
|---|---|
| BM-001 | **NO_NOTES_WITH_EVIDENCE** (confirmed via `QLLAW_FORM_FLIGHT_PROFILE_SKELETONS.latest.md` §5 — 59 forms in this bucket including BM-001; verified extractor returned 0 `<w:footnoteReference>` body refs for BM-001). |

No footnote UI is needed. The profile does not declare a notes-specific field. **Status preserved**.

---

## 5. Lifecycle boundary confirmation

- `bm001-form-inputs-api.ts` is the only save path for BM-001. It calls `saveDocumentFormInputs(documentId, ...)` from `apps/web/src/lib/document-form-api.ts`.
- No import of `template-runtime-adapter.ts` anywhere on the BM-001 path (verified by grep).
- BM-001 is rendered via the generated-document lifecycle only.
- The profile file (after repair) does NOT import runtime adapters (verified by the existing guard test #8).

---

## 6. Conclusion before PHASE 3

- **No UI / helper mutation needed** — UI `fillCustomerSample` keeps its legacy role (handler-only flow convenience); profile `demo` becomes the canonical render-time fixture.
- **NO_UI_CHANGE_NEEDED in profile `bm001.ts`-only repairs.**
- Profile will:
  1. Add `runtimeReady: true`.
  2. Add `profileStatus: "runtime-ready"`.
  3. Replace `fieldPaths` to include the 39 contract slots in canonical order.
  4. Replace `requiredFieldPaths` to be the prompt-defined subset.
  5. Populate `demo`, `summaryLines`, `acceptance`, `staleFallbacks`.
  6. Reference `isKnownStaleFallback` only if necessary (same path BM-171 uses).
- Existing profile-registry guard test #4 (BM-001 NOT runtime-ready) will be UPDATED to reflect new state (BM-001 IS runtime-ready); test #5 (every generated skeleton NOT runtime-ready) still passes since BM-001 is moved to a PRESERVED bucket.
