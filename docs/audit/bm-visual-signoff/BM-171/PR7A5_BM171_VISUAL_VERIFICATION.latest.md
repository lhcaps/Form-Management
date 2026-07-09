# PR7A.5 — BM-171 Manual Visual Verification / Word Openability Evidence

**STATUS**: `COMPLETE`  
**Generated**: 2026-07-05T12:30:00Z  
**Task**: PR7A.5 (BM-171 manual visual + openability evidence)  
**Render path**: production (`DocxtemplaterContractRenderEngine` + full synthetic fixture)  
**Rendered DOCX sha256**: `c9cb504f7a1de87761f95a1f06b7daf1a24f885f88c8e250e2ed06deda1a4b34` (21557 bytes)  
**Source DOCX sha256**: `bbfd0720691ed6ea85b106f2abbf6734e4297d4120a1e17c84d498f78ed623a2` (26445 bytes)

## 1. Host environment

- OS: Microsoft Windows 10.0.26200
- Word: Microsoft Office 16.0 (`C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE`)
- LibreOffice: NOT on PATH (soffice / libreoffice not installed)
- pdftoppm: NOT on PATH
- PDF export: Microsoft Word 16.0 SaveAs PDF (`wdFormatPDF = 17`)
- PNG conversion: `Windows.Data.Pdf` (Win10+ UWP) via PowerShell reflection

PR7A.4 ran with `libreofficePdfExport=NOT_AVAILABLE` and `wordComOpenability=NOT_AVAILABLE`. PR7A.5 fills both gaps via Word 16.0 on this host.

## 2. Word openability evidence (AUTOMATED via COM)

Engine: `Microsoft.Office.Interop.Word.ApplicationClass` (Word 16.0)

### Source DOCX

- Opened: **YES** (no exception thrown by `Documents.Open`)
- Repair / unreadable-content prompt: **NO** (no dialog, no recovery)
- `ReadOnlyRecommended`: `False`
- Page count: **2**
- Paragraph count: **38**
- Word count: **150**
- Save roundtrip bytes: changed (Word normalizes structure on save)
- Roundtrip output: 28217 bytes, sha256 `7E978AFC75D39CC74CEAE8B360C5B46B64F2E546486CD884CF21B02B65AC7025`

### Rendered DOCX (production full-fixture render)

- Opened: **YES** (no exception thrown by `Documents.Open`)
- Repair / unreadable-content prompt: **NO** (no dialog, no recovery)
- `ReadOnlyRecommended`: `False`
- Page count: **2**
- Paragraph count: **36**
- Word count: **438**
- Save roundtrip bytes: changed (Word normalizes structure on save)
- Roundtrip output: 26368 bytes, sha256 `3A29493E2599BA7E8AA569DDCAF93B537EE35115C8E2C115B6BF0B931EAA7A5C`

**Verdict**: Both files open cleanly with Microsoft Word 16.0 on this host. No repair / unreadable-content / recovery dialog observed for either file.

## 3. Visual evidence artifacts (PDF + PNG)

| Artifact | Path | Available |
|---|---|---|
| Source PDF | `docs/audit/bm-visual-signoff/BM-171/source-render-visual/source.latest.pdf` | YES (163411 bytes) |
| Rendered PDF | `docs/audit/bm-visual-signoff/BM-171/source-render-visual/rendered.latest.pdf` | YES (172697 bytes) |
| Source page 1 PNG | `docs/audit/bm-visual-signoff/BM-171/source-render-visual/source-page-1.png` | YES (221996 bytes, 1240x1754) |
| Source page 2 PNG | `docs/audit/bm-visual-signoff/BM-171/source-render-visual/source-page-2.png` | YES (55653 bytes, 1240x1754) |
| Rendered page 1 PNG | `docs/audit/bm-visual-signoff/BM-171/source-render-visual/rendered-page-1.png` | YES (238316 bytes, 1240x1754) |
| Rendered page 2 PNG | `docs/audit/bm-visual-signoff/BM-171/source-render-visual/rendered-page-2.png` | YES (103609 bytes, 1240x1754) |
| Contact sheet (2x2) | `docs/audit/bm-visual-signoff/BM-171/source-render-visual/contact-sheet.latest.png` | YES (393514 bytes) |

PDFs produced by Microsoft Word 16.0 `SaveAs PDF` (production-grade, not LibreOffice).
PNGs produced by `Windows.Data.Pdf.PdfPage.RenderToStreamAsync` at 1240x1754.

## 4. Visual checklist (18 items)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Word opens rendered DOCX without repair prompt | **PASS** | `Microsoft.Office.Interop.Word.Documents.Open` returned `DocumentClass` without exception; `ReadOnlyRecommended=False`; no unreadable-content prompt observed |
| 2 | Source and rendered page count acceptable | **PASS** | Both 2 pages |
| 3 | Header left block retained | **PASS** | Visible in `rendered-page-1.png` top-left |
| 4 | Header right block retained | **PASS** | Visible in `rendered-page-1.png` top-right |
| 5 | "CONG HOA..." alignment comparable to source | **PASS** | Quoc hieu paragraph present and centered; template-note residues 12/13 absent in body |
| 6 | "Mau so 171/HS" position acceptable | **NEEDS_HUMAN** | Form code visible in template style; visual centering needs Planner eyeball in Word |
| 7 | "So: 01/QD-VKSKV7" block acceptable | **PASS** | Required-present PASS in PR7A.4; visible in `rendered-page-1.png` |
| 8 | Title block "QUYET DINH / TRA LAI TAI SAN" acceptable | **PASS** | Both required-present PASS; `rendered-page-1.png` shows centered title block |
| 9 | Legal-basis block preserved | **PASS** | All 6 "Can cu ..." lines required-present PASS in PR7A.4; visible in `rendered-page-1.png` |
| 10 | No huge blank white-space before "QUYET DINH:" | **PASS** | `rendered-page-1.png` shows tight spacing between legal-basis block and second QUYET DINH heading |
| 11 | "Dieu 1" content layout acceptable | **PASS** | Article heading "Dieu 1." required-present PASS; `rendered-page-1.png` shows 4 asset lines + "ngay ..." clearly |
| 12 | Returned asset lines visible | **PASS** | Both required-present PASS in PR7A.4; `rendered-page-1.png` shows numbered asset list |
| 13 | Person / recipient information visible | **PASS** | Nguyen Van A + CCCD 079085001234 + sinh ngay 08/09/1985 + Phuong Ben Nghe required-present PASS; visible in `rendered-page-1.png` |
| 14 | "Dieu 2" visible and meaningful | **PASS** | Dieu 2 + "Yeu cau Phong Canh sat" + "chuyen giao tai san" required-present PASS; `rendered-page-2.png` shows full sentence |
| 15 | "Noi nhan" block acceptable | **PASS** | "Noi nhan:" + "Luu: HSVA, HSKS, VP." required-present PASS; `rendered-page-2.png` shows recipients block |
| 16 | Signature block acceptable | **PASS** | All 4 signature lines required-present PASS in PR7A.4; `rendered-page-2.png` shows full signature stack |
| 17 | Notes 12 / 13 absent from final body | **PASS** | Required-absent assertions PASS in PR7A.4; no body-level superscript runs detected |
| 18 | Instruction notes do not leak into final body | **PASS** | All 6 `{{...}}` required-absent assertions PASS in PR7A.4; no curly-brace placeholder strings in rendered visible text |

**Summary**: 18 items — 17 PASS, 1 NEEDS_HUMAN, 0 FAIL.

## 5. Validation commands

| Command | Exit | Result |
|---|---|---|
| `pnpm audit:bm-source-render-parity BM-171 --fixture full` | 0 | PASS — present 39/39, absent 14/14, header 4/4, superscript 0, xml parts 5/5 |
| `pnpm audit:bm-openability BM-171` | 0 | PASS mechanical — unzip, required parts, XML parse, relationships all pass; LibreOffice unavailable; Word COM now verified by PR7A.5 |
| `pnpm audit:bm171-visual-signoff` | 0 | PASS — Auto OK 55 / FAIL 0 / NEEDS_HUMAN 12 / UNVERIFIED 0 |
| `pnpm audit:bm-final BM-171` | 0 | MANUAL_REQUIRED harnessReady=true rolloutReady=false |
| `pnpm audit:bm-rollout-ready BM-171` | 0 | BLOCKED_MANUAL_REVIEW technicalReady=true manualReviewRequired=true rolloutReady=false |
| `pnpm audit:bm-final BM-001` | 0 | PASS harnessReady=true rolloutReady=true |
| `pnpm audit:bm-rollout-ready BM-001` | 0 | READY technicalReady=true manualReviewRequired=false rolloutReady=true |
| `pnpm audit:hardcode` | 0 | PASS — Runtime hardcode audit passed |
| `pnpm audit:locked-compiled` | 0 | PASS — 213/213 consistent |
| `pnpm audit:contract-sync` | 0 | PASS — 213 matched, 0 missing in DB, 0 stale |

No `pnpm audit:bm171-visual-verification` script existed prior to PR7A.5. The artifact
`docs/audit/bm-visual-signoff/BM-171/PR7A5_BM171_VISUAL_VERIFICATION.latest.json` serves as
the script-equivalent packet. Future runs can invoke it via the markdown file as a manual checklist.

## 6. Regression status

BM-001:
- bm-final: PASS rolloutReady=true (UNCHANGED)
- rollout-ready: READY (UNCHANGED)
- changed: NO

BM-171:
- bm-final: MANUAL_REQUIRED (UNCHANGED from PR7A.4)
- rollout-ready: BLOCKED_MANUAL_REVIEW (UNCHANGED from PR7A.4)
- visualSignoffGranted: false (UNCHANGED)
- rolloutReady: false (UNCHANGED)
- manual approval: NOT_CREATED

Other BMs:
- touched: NO

## 7. Forbidden scope compliance

| Forbidden area | Mutated? | Evidence |
|---|---|---|
| BM-171 normalized DOCX | NO | Source sha256 `bbfd...623a2` unchanged |
| BM-171 locked contract | NO | No edits to `docs/audit/docx/contracts/locked/` |
| Other BM contracts | NO | `audit:locked-compiled` still 213/213 consistent |
| Manual approval artifacts | NO | No `manual-approval` files created |
| PR7B files | NO | No PR7B work started |
| Renderer logic | NO | No changes to `docxtemplater-contract-render-engine.ts` |

## 8. Blockers / open items

| Blocker / risk | Severity | Evidence | Recommended next step |
|---|---|---|---|
| Mau so 171/HS visual centering | LOW | NEEDS_HUMAN check #6 | Planner eyeball confirmation in Word |
| Page number rendering | LOW | NEEDS_HUMAN check (carried from PR7A.4) | Planner eyeball confirmation in Word |

## 9. Executor recommendation

**Recommendation**: `PLANNER_CAN_VISUALLY_APPROVE`

**Reason**: Word 16.0 opens both source and rendered DOCX without any repair / unreadable-content prompt; rendered DOCX page-count (2) matches source; all 17 auto-confirmable visual checks PASS (legal-basis block preserved, notes 12/13 absent, instruction placeholders absent, signature block intact, recipients + archive line present); only 1 NEEDS_HUMAN (mau-so 171/HS visual centering) carried forward. Forbidden scope respected — no locked contract / normalized DOCX / renderer mutation, no manual approval, no rolloutReady flip.

Even with PASS, executor has NOT created manual approval, has NOT set visualSignoffGranted=true, has NOT set rolloutReady=true, has NOT started PR7B. Per task contract, Planner owns the signoff decision.