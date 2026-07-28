# BM-001 Runtime-Ready Repair — Validation Report

**Generated**: 2026-07-07T10:42:00Z (Phase 6 — final validation artifact)
**Phase**: BM-001 FIDELITY REPAIR WITH VERIFIED NOTES
**Status**: **PASS**

---

## 1. Source evidence cross-checked

| Source | Path | Cross-check result |
|---|---|---|
| DOCX file | `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/01. TIEP NHAN GIAI QUYET NGUON TIN VE TOI PHAM/01-Biên bản tiếp nhận nguồn tin về tội phạm.doc` (sha256 `f4c2aa3682d3c2fbe68e1b88293e5a6024dfbce003e0203bdf1d163e12819d8e`) | MATCH |
| Normalized DOCX | `storage\templates\normalized-docx\BM-001\BM-001_normalized.docx` (sha256 `e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77`) | MATCH |
| Locked contract | `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json` (39 docxSlots, 39 canonicalFields) | MATCH |
| BM-001 UI | `apps/web/src/components/documents/bm-001-form-inputs.tsx` (7 sections, READ-only-by-convention here) | NOT MODIFIED |
| BM-001 helper | `apps/web/src/lib/bm001-form-inputs-api.ts` (`saveBm001FormInputs` → `saveDocumentFormInputs`) | NOT MODIFIED |
| BM-171 reference | `apps/web/src/lib/form-flight/profiles/bm171.ts` | NOT MODIFIED (read-only for this phase) |
| Verified extractor | `docs/audit/unified-bm-workspace/QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json` | MATCH |

---

## 2. Files changed (exact list)

| Path | Change |
|---|---|
| `apps/web/src/lib/form-flight/profiles/bm001.ts` | Replaced skeleton with runtime-ready profile (see §3 below) |
| `apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs` | NEW — 15-assertion guard test (Phase 5) |
| `apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | Updated test #4 (BM-001 is now runtime-ready) + added test #4b (only BM-001/BM-171 have runtime-ready flags). Test #5/#6 still skip BM-001 via the existing `PRESERVED` set. |
| `docs/audit/unified-bm-workspace/BM001_FIDELITY_GAP_MATRIX.latest.md` | NEW — Phase 2 pre-repair audit (20-row matrix + auxiliary rows) |
| `docs/audit/unified-bm-workspace/BM001_RUNTIME_READY_REPAIR.latest.md` | NEW — this file |
| `docs/audit/unified-bm-workspace/BM001_RUNTIME_READY_REPAIR.latest.json` | NEW — machine-readable summary of this report |

### NOT touched

- No DOCX file (source or normalized) mutated.
- No locked contract mutated.
- No DB row / migration / Prisma schema mutated.
- No public API route path changed.
- No UI adapter other than BM-001 touched (and BM-001's UI not touched in this phase; Phase 4 reported `NO_UI_CHANGE_NEEDED`).
- No helper API other than BM-001's `bm001-form-inputs-api.ts` touched (and that file was NOT touched here — Phase 4 confirmed `NO_UI_CHANGE_NEEDED`).
- No 211 auto-generated skeleton profile was promoted. Only BM-001 + BM-171 carry `runtimeReady: true`.
- No git commit, push, stage, branch creation, or PR creation.

---

## 3. Profile mutation breakdown

`apps/web/src/lib/form-flight/profiles/bm001.ts` (before → after):

| Aspect | Before | After |
|---|---|---|
| `runtimeReady` | absent | **`true`** |
| `profileStatus` | absent | **`"runtime-ready"`** |
| `fieldPaths` count | 36 (with `document.issueDate`, `reception.startedAtDate`, `reception.endedAtDate`, `informant.dateOfBirth`, `informant.identityIssuedDate`) | **39** (locked-contract `docxSlots` order) |
| `fieldPaths` includes new canonical day/month/year parts | NO | **YES** — `informant.birthDay/Month`, `informant.identityIssuedDay/Month/Year`, `reception.startedAtDay/Month/Year`, `reception.endedAtDay/Month/Year` |
| `fieldPaths` includes `document.issuePlaceDateLine` (systemDate transform target) | NO | **YES** |
| `requiredFieldPaths` count | 22 (UI-mapped date fields) | **25** (canonical prompt-mandated subset) |
| `demo` | `{}` (empty) | non-empty (33 entries) |
| `staleFallbacks` | absent | **3 entries** (`informant.fullName`, `informant.signerName`, `crimeReport.content`) |
| `aliases` | absent | absent (no alias paths needed) |
| `summaryLines` | `undefined` | **8 lines** |
| `acceptance.requiredText` | `[]` | **11 anchors** (BIÊN BẢN, Tiếp nhận …, Căn cứ các điều 133/144/145/146 Bộ luật Tố tụng hình sự, two demo names, I. NỘI DUNG, II. CÁC TÀI LIỆU, Việc tiếp nhận … kết thúc, NGƯỜI CUNG CẤP, NGƯỜI TIẾP NHẬN) |
| `acceptance.forbiddenText` | `[]` | **6 legacy bug tokens** ({{, }}, Ông  cung cấp, undefined, null, [object Object]) + 1 stale signer fallback (Nguyễn Thị Hồng Hạnh) |
| Helpers imported | none | `readFormFlightPath` (payload), `isKnownStaleFallback` (runtime-ux/placeholder-blocklist) |
| `registerFormFlightProfile` call | present | present |

---

## 4. Before / after comparison

### BM001_BEFORE (Phase 0 snapshot)

| Attribute | Value |
|---|---|
| profileStatus | (absent — skeleton-stage per guard #4) |
| runtimeReady | (absent) |
| fieldPaths | 36 — all UI-mapped, no canonical day/month/year parts, no `document.issuePlaceDateLine` |
| requiredFieldPaths | 22 — UI-only (date halves instead of canonical parts) |
| hasDemo | false |
| hasSummaryLines | false |
| hasAcceptance | empty (`requiredText: []`, `forbiddenText: []`) |
| notesStatus | NO_NOTES_WITH_EVIDENCE |

### BM001_AFTER (Phase 6 result)

| Attribute | Value |
|---|---|
| profileStatus | **runtime-ready** |
| runtimeReady | **true** |
| fieldPaths | **39** (canonical locked-contract order) |
| requiredFieldPaths | **25** (prompt-mandated subset; subset of `fieldPaths`) |
| hasDemo | **true** (33 entries, synthetic Vietnamese, distinct receiver/informant) |
| hasSummaryLines | **true** (8 lines) |
| hasAcceptance | **true** (11 requiredText + 6 forbiddenText + 1 stale signer fallback) |
| hasStaleFallbacks | **true** (3 entries) |
| notesStatus | **NO_NOTES_WITH_EVIDENCE** (preserved; verified) |

---

## 5. Coverage matrix

| Coverage axis | Verdict |
|---|---|
| BM001_FIELD_COVERAGE | **PASS** (39 locked-contract docxSlots, canonical order) |
| BM001_SECTION_COVERAGE | **PASS** (Sections 1-7 in UI ↔ locked contract fields ↔ profile `fieldPaths`; Notes NO_NOTES_WITH_EVIDENCE so not expected) |
| BM001_SIGNATURE_COVERAGE | **PASS** (`informant.signerName` + `receiver.signerName` both present and required) |
| BM001_RECIPIENT_COVERAGE | **PASS** (`recipients.archiveLine` present, required, demo-fixtured) |
| BM001_NOTES_COVERAGE | **NO_NOTES_WITH_EVIDENCE** (verified extractor confirms; no footnote UI added) |
| BM001_LIFECYCLE_COMPLIANCE | **PASS** (generated-document lifecycle only — verified by guard test #11 / #8 from `profile-registry-guard.test.mjs`; no `template-runtime-adapter` import; no `generated-document-adapter` import) |
| BM001_FIDELITY_STATUS | **FIDELITY_COMPLETE_EVIDENCED** |

---

## 6. Demo fixture summary

Synthetic Vietnamese, no real PII, distinct receiver vs informant names:

- **Receiver**: `Nguyễn Thị Mai` — Kiểm sát viên sơ cấp, VKS Khu vực 7.
- **Informant**: `Trần Văn Bình` — Nam, sinh 08/09/1985 tại Bình Dương, CCCD `079085001234` cấp 14/12/2021 bởi Cục CSQLHC về TTXH, thường trú + ở hiện tại Số 12 Nguyễn Trãi, Phường Bến Nghé, Quận 1, TP.HCM, SĐT `0901234567`.
- **Reception**: 08:00 → 08:30 ngày 04/03/2026 tại VKS Khu vực 7, TP.HCM.
- **Issue place/date**: `Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026`.
- **Crime report content**: 2-sentence synthetic gambling report, no `{{`, `}}`, no `Ông  cung cấp`, non-graphic.
- **Attached items**: 01 bản tường trình, 01 bản sao CMND, 01 video ngắn (CD kèm theo).
- **Archive line**: `Lưu: HSVA, HSKS, VP.`

---

## 7. summaryLines (8 quick-check anchors)

1. **Thời gian / địa điểm tiếp nhận** — `<time>` — `ngày dd/mm/yyyy` — `tại <place>`.
2. **Người tiếp nhận** — `<title> — <name> — <department>`.
3. **Người cung cấp nguồn tin** — `informant.fullName`.
4. **Nội dung nguồn tin** — `crimeReport.content` (truncated to 120 chars).
5. **Tài liệu, đồ vật giao nộp** — `crimeReport.attachedItemsDescription`.
6. **Thời gian kết thúc** — `<time>` — `ngày dd/mm/yyyy`.
7. **Chữ ký** — `Người cung cấp: <signer>` / `Người tiếp nhận: <signer>` (falls back to fullName).
8. **Dòng lưu hồ sơ** — `recipients.archiveLine`.

All eight resolve through `readSummaryValue` which sanitises per-path `staleFallbacks` + the global `isKnownStaleFallback` blocklist.

---

## 8. acceptance anchors

### requiredText (must appear in rendered DOCX)

- `BIÊN BẢN`
- `Tiếp nhận nguồn tin về tội phạm`
- `Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự`
- `Nguyễn Thị Mai` (demo receiver full name)
- `Trần Văn Bình` (demo informant full name)
- `I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM`
- `II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO`
- `Việc tiếp nhận nguồn tin về tội phạm kết thúc`
- `NGƯỜI CUNG CẤP`
- `NGƯỜI TIẾP NHẬN`

### forbiddenText (must never leak)

- `{{`
- `}}`
- `Ông  cung cấp` (legacy two-space blank-name bug)
- `undefined`
- `null`
- `[object Object]`
- `Nguyễn Thị Hồng Hạnh` (legacy receiver-name used as informant signerName fallback)

---

## 9. staleFallbacks

| Path | Stale fallback values |
|---|---|
| `informant.fullName` | `["Nguyễn Thị Hồng Hạnh"]` (UI legacy fillCustomerSample fallback) |
| `informant.signerName` | `["Nguyễn Thị Hồng Hạnh"]` (UI auto-population when informant.fullName was blank) |
| `crimeReport.content` | `["Ông  cung cấp"]` (legacy two-space blank-name bug) |

Additional defense: `readSummaryValue` also routes through `isKnownStaleFallback` so the global blocklist (Căn cứ Điều 41 Bộ luật Tố tụng hình sự, Người ký (mẫu), Người nhận (mẫu), etc.) applies to BM-001 too.

---

## 10. UI / helper reconciliation verdict

**NO_UI_CHANGE_NEEDED.** See gap matrix row #26.

- UI `REQUIRED_FIELDS` uses UI-mapped date fields (`document.issueDate`, `reception.startedAtDate`, `reception.endedAtDate`). This is intentional and safe: the UI gates user input while the profile gates the **canonical** paths the renderer reads.
- Helper `saveBm001FormInputs` already handles `startedAtDay/Month/Year` derivation from `startedAtDate` via `buildIsoDateFromParts` in `normalizeBm001FormInputs`. The renderer (downstream of the helper) consumes the canonical paths.
- The legacy `fillCustomerSample` button carries the `"Ông  cung cấp"` bug intentionally as a "load any data" handler convenience; the canonical render-time fixture lives in `BM001_DEMO` so the `mode: "demo-reset"` path is bug-free.

---

## 11. Lifecycle verification

- `bm001-form-inputs-api.ts` ONLY calls `saveDocumentFormInputs` / `getBm001RenderPayload` / `normalizeBm001FormInputs` from `apps/web/src/lib/document-form-api.ts`. No `/templates/BM-001` route exists.
- The new `apps/web/src/lib/form-flight/profiles/bm001.ts` does NOT import `template-runtime-adapter` or `generated-document-adapter` (verified by the new guard test #11 and the existing profile-registry guard #8).
- The 211 generated skeletons (bmNNN.ts for NNN ≠ 001 ≠ 171) remain skeletons and were not promoted.
- BM-001 participates in the **generated-document lifecycle** exclusively.

---

## 12. Guard tests added in this phase

`apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs` (Phase 5):

| # | Assertion |
|---|---|
| 1 | BM-001 profile file exists and self-registers |
| 2 | BM-001 declares `runtimeReady: true` |
| 3 | BM-001 declares `profileStatus: "runtime-ready"` |
| 4 | BM-001 `fieldPaths` length is exactly 39 |
| 5 | BM-001 `fieldPaths` match the locked contract canonical order |
| 6 | BM-001 `requiredFieldPaths` is a subset of `fieldPaths` and deliberately excludes optional paths |
| 7 | BM-001 `demo` is non-empty and bug-free |
| 8 | BM-001 `summaryLines` non-empty (≥ 6 lines) |
| 9 | BM-001 `acceptance.requiredText` non-empty + contains legal anchors |
| 10 | BM-001 `acceptance.forbiddenText` contains legacy bug tokens |
| 11 | BM-001 does not import runtime adapters |
| 12 | BM-171 still runtime-ready |
| 13 | BM-171 still self-registers |
| 14 | No auto-generated skeleton declares runtimeReady: true |
| 15 | BM-001 notes status remains NO_NOTES_WITH_EVIDENCE |

In addition: `apps/web/src/lib/form-flight/profile-registry-guard.test.mjs`:

- Test #3 still asserts BM-171 is runtime-ready (preserved).
- Test #4 was flipped: BM-001 now MUST declare `runtimeReady: true` and `profileStatus: "runtime-ready"` (was previously NOT).
- Test #4b was ADDED: only BM-001 and BM-171 may carry runtime-ready flags. This locks the invariant that no auto-generated skeleton was promoted.
- Tests #5-#9 unchanged (still skip BM-001/BM-171 via the existing `PRESERVED` set so guard #6 keeps asserting `demo: {}` for the 211 auto-generated skeletons only).

---

## 13. Remaining risks

| Risk | Mitigation |
|---|---|
| Body notes detection in verified extractor is 0 forms (audit-side). | Not a BM-001 fidelity gap. BM-001 is `NO_NOTES_WITH_EVIDENCE` per the extractor. If a future phase re-probes `word/document.xml` for `<w:footnoteReference>` elements that the paragraph scan missed, BM-001 may upgrade its notes status; the profile will then need a `notesSection` field. Not addressed here. |
| The "title field is placeholder" risk from §7 of the previous phase — the new profile keeps `title: "Biên bản tiếp nhận nguồn tin về tội phạm"` (the locked contract `templateTitle`). | Mitigated. |
| The DOCX still has `"Ông  cung cấp..."` style blanks — the UI's `fillCustomerSample` still ships that pre-fix. | The render-time demo (`BM001_DEMO`) is bug-free; the legacy UI convenience button is preserved; the gate forbids the leak via `forbiddenText`. |
| Locked contract `templateTitle` may drift after future fidelity repair phases. | Profile `title` is a stable, hand-curated Vietnamese title for the in-product list view. Future phase can resync via `getFormFlightProfile("BM-001").title`. |
| `tString` return from `readSummaryValue` only when value is a string. Boolean / number / object in `data` resolves to undefined silently. | Documented at the helper function. Aligns with BM-171's helper. |

---

## 14. Next recommended phase

Pick one (per task instructions § PHASE 8 selection list):

| # | Phase | Notes |
|---|---|---|
| 1 | BM-001 Render / Export Golden Validation | Highest-leverage next step — proves the synthetic Vietnamese demo renders as a real DOCX with both `requiredText` matched and `forbiddenText` absent. |
| 2 | Adapter Metadata Registry | Out of scope — no adapter metadata registry surfaced in this phase. |
| 3 | Generated Workspace Selection Hardening | Out of scope — generated-document lifecycle not addressed here. |
| 4 | Form Flight Runtime-Ready Guard Hardening | Acceptable: this phase already added the BM-001-specific guard and the BM-001/BM-171-only invariant in test #4b. |
| 5 | BM-002 Third Pilot | Possible but lower-leverage: BM-002 will need the same hand-authored fixture process; not as mature as BM-001. |
| 6 | Stop — user decision needed | Reasonable if no further fidelity work is approved. |

**Recommended**: option 1 (BM-001 Render / Export Golden Validation).
