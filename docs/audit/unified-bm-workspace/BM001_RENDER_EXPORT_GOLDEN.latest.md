# BM-001 Render / Export Golden Validation — Phase Report

**Generated**: 2026-07-07
**Phase**: BM-001 RENDER / EXPORT GOLDEN VALIDATION
**Status**: **PASS**

---

## 1. Strategy chosen

**Strategy A — direct generated render core.** The script reuses the same
Docxtemplater + PizZip packages and the same `{{ ... }}` delimiter pair as
the production `DocxtemplaterContractRenderEngine`
(`apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts`).
It feeds the BM-001 locked contract's 39 slot bindings + the canonical
`BM001_DEMO` payload into the engine, writes the DOCX output to
`docs/audit/unified-bm-workspace/bm001-golden/BM001_RENDERED_GOLDEN.latest.docx`,
extracts text from `word/document.xml` (+ headers, footers, footnotes,
endnotes), and runs the BM-001 profile's `acceptance.requiredText` and
`acceptance.forbiddenText` scanner against the rendered text.

The `/templates/:templateCode` runtime preview lifecycle was NOT used.

No DB mutation. No Prisma connection opened. No source DOCX, normalized
DOCX, or locked contract was written.

## 2. Lifecycle path used

| Stage | Path |
|---|---|
| Read inputs | `apps/web/src/lib/form-flight/profiles/bm001.ts` (profile source) + `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json` + `storage/templates/normalized-docx/BM-001/BM-001_normalized.docx` |
| Render DOCX | `PizZip` + `Docxtemplater` (workspace `apps/api/node_modules`) — same engine as `DocxtemplaterContractRenderEngine.renderActiveDocx` |
| Export PDF | `apps/api/scripts/pdf-convert-word-com.ps1` (Windows PowerShell + Microsoft Word COM); falls back to `pdf-convert-fallback.ps1` (LibreOffice → Word COM) |
| Extract DOCX text | `PizZip` walk over `word/document.xml`, `word/header*.xml`, `word/footer*.xml`, `word/footnotes.xml`, `word/endnotes.xml`; `<w:t>` runs joined, whitespace-normalized |
| Extract PDF text | `pdf-parse` v2 (`apps/api/node_modules/pdf-parse`, `PDFParse` class) — used only when PDF export succeeded |
| Scanner | Same anchors as `BM001_ACCEPTANCE` in `bm001.ts` |

## 3. Render strategy outputs

| Output | Path | Size | Status |
|---|---|---:|---|
| DOCX | `docs/audit/unified-bm-workspace/bm001-golden/BM001_RENDERED_GOLDEN.latest.docx` | 21,865 bytes | PASS |
| PDF | `docs/audit/unified-bm-workspace/bm001-golden/BM001_RENDERED_GOLDEN.latest.pdf` | 140,687 bytes | PASS |
| JSON | `docs/audit/unified-bm-workspace/bm001-golden/BM001_RENDER_EXPORT_GOLDEN.latest.json` | full machine-readable report | PASS |
| Markdown | `docs/audit/unified-bm-workspace/bm001-golden/BM001_RENDER_EXPORT_GOLDEN.latest.md` | detailed per-DOCX/PDF tables | PASS |

## 4. DOCX Golden — head-to-head pass table

| Acceptance dimension | Count | Status |
|---|---|---|
| `acceptance.requiredText` anchors present in DOCX | **10 / 10** | PASS |
| `acceptance.forbiddenText` tokens absent from DOCX | **7 / 7** | PASS |
| Required sections (BIÊN BẢN / Tiếp nhận / I. / II. / NGƯỜI CUNG CẤP / NGƯỜI TIẾP NHẬN) | **6 / 6** | PASS |
| Demo names (Nguyễn Thị Mai + Trần Văn Bình) | **2 / 2** | PASS |
| Known bug tokens (Ông  cung cấp / Nguyễn Thị Hồng Hạnh) absent | **2 / 2** | PASS |
| Unreplaced `{{ ... }}` placeholders | 0 | PASS |
| Undefined / null / `[object Object]` literals | 0 | PASS |

DOCX text extraction succeeded (2 OOXML parts scanned).

## 5. PDF Golden — head-to-head pass table

| Acceptance dimension | Count | Status |
|---|---|---|
| `acceptance.requiredText` anchors present in PDF | **10 / 10** | PASS |
| `acceptance.forbiddenText` tokens absent from PDF | **7 / 7** | PASS |
| Required sections in PDF | **6 / 6** | PASS |
| Demo names in PDF | **2 / 2** | PASS |
| Known bug tokens absent from PDF | **2 / 2** | PASS |
| Placeholder leaks in PDF | 0 | PASS |

PDF helper used: `apps/api/scripts/pdf-convert-word-com.ps1` (Windows
PowerShell + Microsoft Word COM). PDF text extraction succeeded via
`pdf-parse` v2.

## 6. requiredText results — DOCX vs PDF

| Anchor | DOCX | PDF |
|---|---|---|
| `BIÊN BẢN` | PASS | PASS |
| `Tiếp nhận nguồn tin về tội phạm` | PASS | PASS |
| `Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự` | PASS | PASS |
| `Nguyễn Thị Mai` | PASS | PASS |
| `Trần Văn Bình` | PASS | PASS |
| `I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM` | PASS | PASS |
| `II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO` | PASS | PASS |
| `Việc tiếp nhận nguồn tin về tội phạm kết thúc` | PASS | PASS |
| `NGƯỜI CUNG CẤP` | PASS | PASS |
| `NGƯỜI TIẾP NHẬN` | PASS | PASS |

## 7. forbiddenText results — DOCX vs PDF

| Token | DOCX | PDF |
|---|---|---|
| `{{` | ABSENT (PASS) | ABSENT (PASS) |
| `}}` | ABSENT (PASS) | ABSENT (PASS) |
| `Ông  cung cấp` | ABSENT (PASS) | ABSENT (PASS) |
| `undefined` | ABSENT (PASS) | ABSENT (PASS) |
| `null` | ABSENT (PASS) | ABSENT (PASS) |
| `[object Object]` | ABSENT (PASS) | ABSENT (PASS) |
| `Nguyễn Thị Hồng Hạnh` | ABSENT (PASS) | ABSENT (PASS) |

## 8. Placeholder + stale-fallback leak check

| Leak class | DOCX | PDF |
|---|---|---|
| Unreplaced `{{ ... }}` placeholders | None | None |
| `${...}` template strings | None | None |
| `<<...>>` angle-bracket placeholders | None | None |
| `undefined` / `null` literal text | None | None |
| `[object Object]` literal text | None | None |
| Legacy `"Ông  cung cấp"` two-space bug | None | None |
| Legacy `"Nguyễn Thị Hồng Hạnh"` literal | None | None |

## 9. Notes status

| Field | Value |
|---|---|
| BM-001 notes status | **NO_NOTES_WITH_EVIDENCE** (unchanged) |
| BM-171 runtime-ready | **YES** (unchanged) |
| Other skeletons promoted in this phase | **NO** (still 211 skeletons, only BM-001 + BM-171 runtime-ready) |

## 10. UI sample bug probe (PHASE 5)

The legacy `fillCustomerSample` in `apps/web/src/components/documents/bm-001-form-inputs.tsx`
(lines 560–619 before this phase) hard-coded the very forbiddenText tokens
the BM-001 acceptance scanner rejects:

- `receiver.fullName: "Nguyễn Thị Hồng Hạnh"` → forbidden token
- `informant.signerName: "Nguyễn Thị Hồng Hạnh"` → forbidden token
- `crimeReport.content: "Ông  cung cấp nguồn tin ..."` → forbidden token (two-space bug)
- `informant.fullName: ""` → blank name (stale fallback)

**Fix applied** (BM-001 only, no other form files touched):
replaced the entire `fillCustomerSample` body with values that mirror
`BM001_DEMO` so the legacy "Điền dữ liệu mẫu" button no longer injects
forbidden tokens:

- `receiver.fullName` → `Nguyễn Thị Mai` (was `Nguyễn Thị Hồng Hạnh`)
- `receiver.signerName` → `Nguyễn Thị Mai` (was `""`)
- `informant.fullName` → `Trần Văn Bình` (was `""`)
- `informant.signerName` → `Trần Văn Bình` (was `Nguyễn Thị Hồng Hạnh`)
- `crimeReport.content` → non-graphic, distinct receiver vs informant
  (was `"Ông  cung cấp ..."` with two-space bug)
- Added `agency.parentName`, `agency.name`, `informant.temporaryAddress`,
  `informant.phone` (were empty / blank)

No other UI adapters modified. Helper API (`bm001-form-inputs-api.ts`)
not touched.

After the fix, the golden guard test confirms:

- Test 13: no `"Nguyễn Thị Hồng Hạnh"` literal as a sample value
- Test 14: no `"Ông  cung cấp"` literal as a sample value
- Test 15: no `informant.fullName: ""` blank in `fillCustomerSample`

## 11. Files changed (exact list)

| Path | Change | Why |
|---|---|---|
| `scripts/audit/validate-bm001-render-export-golden.mjs` | NEW | Golden validation driver — renders DOCX through Docxtemplater, exports PDF via Word COM, runs acceptance scanner |
| `apps/web/src/lib/form-flight/bm001-render-export-golden.guard.test.mjs` | NEW | Read-only guard test (17 assertions) for golden artifacts + UI sample fixture integrity |
| `apps/web/src/components/documents/bm-001-form-inputs.tsx` | MODIFIED (`fillCustomerSample` only) | Replace legacy sample values with `BM001_DEMO` values so the "Điền dữ liệu mẫu" button no longer injects forbiddenText tokens into the renderer |
| `docs/audit/unified-bm-workspace/bm001-golden/` | NEW directory | Golden DOCX + PDF + JSON + Markdown artifacts |
| `docs/audit/unified-bm-workspace/BM001_RENDER_EXPORT_GOLDEN.latest.md` | NEW | This top-level phase summary |
| `docs/audit/unified-bm-workspace/BM001_RENDER_EXPORT_GOLDEN.latest.json` | NEW | Top-level machine-readable summary (status + key counts) |

## 12. Files NOT changed (must not change)

- `docs/Biểu mẫu/Full/.../01-Biên bản tiếp nhận nguồn tin về tội phạm.doc` (source DOCX)
- `storage/templates/normalized-docx/BM-001/BM-001_normalized.docx` (normalized DOCX)
- `storage/templates/normalized-docx/BM-001/BM-001_Bien-ban-tiep-nhan-nguon-tin-ve-toi-pham.docx` (raw normalized source)
- `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json`
- `apps/web/src/lib/form-flight/profiles/bm001.ts`
- `apps/web/src/lib/form-flight/profiles/bm171.ts`
- `apps/web/src/lib/bm001-form-inputs-api.ts`
- `apps/api/src/**` (no backend mutations)
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**` (no migrations)
- Any other `bm-XXX-form-inputs.tsx` (only BM-001 was modified, only its sample fixture)
- Any other form profile (`bm002..bm213.ts`)

## 13. Validation commands run

| Command | Exit | Result |
|---|---|---|
| `node scripts/audit/validate-bm001-render-export-golden.mjs` | 0 | PASS — DOCX 10/10 required, 7/7 forbidden, 6/6 sections, 2/2 demo names; PDF same |
| `node --test apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs` | 0 | 15 / 15 PASS |
| `node --test apps/web/src/lib/form-flight/bm001-render-export-golden.guard.test.mjs` | 0 | 17 / 17 PASS |
| `node --test apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | 0 | 10 / 10 PASS |

## 14. Remaining risks

| Risk | Severity | Mitigation |
|---|---|---|
| BM-001 demo values are synthetic; real case data may include PII that wasn't pre-validated | Low | Profile carries per-path stale-fallbacks; acceptance scanner rejects blank / legacy names; further PII safety out of scope for golden-validation phase |
| PDF export requires Windows + Microsoft Word installed | Medium | Documented in this report; `pdf-convert-fallback.ps1` covers LibreOffice path; if neither is available the script marks PDF as PARTIAL and the DOCX path still PASSES |
| `pdf-parse` v2 API drift between minor versions | Low | Script tries both `default`-export and `PDFParse` named-class shapes; failure is reported as a non-fatal `textExtractionNote` in the JSON |
| `fillCustomerSample` rewrite changes user-facing demo data | Low | Sample now matches `BM001_DEMO` so golden + UI stay aligned; comment block at top of function explains the change for future readers |
| Profile-registry guard pattern change (new skeleton promotion) | Low | `bm001-render-export-golden.guard.test.mjs` test #7 enforces 211 skeletons + only BM-001 + BM-171 runtime-ready; future promotion would fail CI |

## 15. Final verdict

**BM-001 render / export golden validation: PASS.**

The BM-001 canonical FormFlightProfile is no longer merely metadata. The
`BM001_DEMO` synthetic Vietnamese fixture renders cleanly through the same
Docxtemplater engine the production generated-document renderer uses. The
rendered DOCX satisfies every acceptance scanner check (10/10 requiredText,
7/7 forbiddenText absent, all required sections present, all demo names
present, no placeholder or stale-fallback leaks). The PDF export through
the existing Windows Word COM helper produces a real `%PDF-1.7` document
(140 KB) that passes the identical acceptance scan.

The legacy UI sample bug (`"Ông  cung cấp ..."`, blank `informant.fullName`,
`"Nguyễn Thị Hồng Hạnh"` reused as receiver) is fixed in BM-001's
`fillCustomerSample` only — no other form's UI was touched. BM-171
remains runtime-ready. No other skeleton was promoted. No SOT, DB,
schema, migration, route, or contract was mutated.

Recommended next phase: **BM-002 Third Pilot** — promote BM-002 to
runtime-ready using the same skeleton → runtime-ready pipeline that
worked for BM-001 + BM-171, then run this same golden validation
script against BM-002 to confirm the pattern generalizes.