# BM-001 Visual Sign-off Packet

**STATUS**: `READY_FOR_HUMAN_VISUAL_REVIEW`
**visualSignoffGranted**: false (this script NEVER grants sign-off)
**rolloutReady**: false (PR6G.5 gate stays at BLOCKED_MANUAL_REVIEW)
**Generated**: 2026-07-05T09:53:48.102Z
**Render path**: production (ContractRenderPlanBuilder + DocxtemplaterContractRenderEngine)
**Canonical fixture**: post-PR6G.3.1 — matches `pr6g31-bm001-rendered-docx-parity.spec.ts`
**Rendered DOCX sha256**: `f9ac8d538695b8925bab83a8577f0a102ae02ed0f9b8fa24535b29a643091b94`
**Engine audit**: semantic=warning, format=pass, package=pass

## Packet Files

- `rendered.latest.docx` — fresh canonical render, open this in Word
- `extracted-text.latest.txt` — flat visible text
- `document-xml-inspection.latest.json` — render provenance + engine audit
- `visual-signoff.latest.json` — full checklist (auto / human / canonical)
- `visual-signoff.latest.md` — this file
- `rendered.latest.pdf` — UNAVAILABLE on this host
- `page-*.png` — UNAVAILABLE on this host

## Honest Report — PDF / PNG availability

This host lacks LibreOffice / soffice and pdftoppm.
DOCX + OOXML inspection is the only visual evidence available.
Planner must open the DOCX in Microsoft Word to complete visual sign-off.

## Canonical Required-Present checks (auto-confirmable)

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | Canonical required-present: "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026" | `AUTO_OK` | detected in rendered DOCX visible text |
| 2 | Canonical required-present: "Cấp ngày 07 tháng 06 năm 2020" | `AUTO_OK` | detected in rendered DOCX visible text |
| 3 | Canonical required-present: "Hồi 08:00" | `AUTO_OK` | detected in rendered DOCX visible text |
| 4 | Canonical required-present: "ngày 26 tháng 12 năm 2025" | `AUTO_OK` | detected in rendered DOCX visible text |
| 5 | Canonical required-present: "tại TP. Hồ Chí Minh" | `AUTO_OK` | detected in rendered DOCX visible text |
| 6 | Canonical required-present: "hồi 10:00 ngày 26 tháng 12 năm 2025" | `AUTO_OK` | detected in rendered DOCX visible text |
| 7 | Canonical required-present: "Lưu: HSVA, HSKS, VP." | `AUTO_OK` | detected in rendered DOCX visible text |

## Canonical Forbidden-Drift checks (auto-confirmable)

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | Canonical forbidden: "Lưu: HSVV, VP." | `AUTO_OK` | forbidden drift string not present |
| 2 | Canonical forbidden: "- Lưu: HSVA, HSKS, VP." | `AUTO_OK` | forbidden drift string not present |
| 3 | Canonical forbidden: "ngày 4 tháng 7 năm 2026" | `AUTO_OK` | forbidden drift string not present |
| 4 | Canonical forbidden: "Cấp ngày 7/6/2020" | `AUTO_OK` | forbidden drift string not present |
| 5 | Canonical forbidden: "{{" | `AUTO_OK` | forbidden drift string not present |
| 6 | Canonical forbidden: "undefined" | `AUTO_OK` | forbidden drift string not present |
| 7 | Canonical forbidden: "[object Object]" | `AUTO_OK` | forbidden drift string not present |
| 8 | Canonical forbidden: "Invalid Date" | `AUTO_OK` | forbidden drift string not present |
| 9 | Canonical forbidden: literal "null" as standalone token | `AUTO_OK` | no standalone "null" token |

## Structural Presence checks (auto-confirmable)

| Check | Status | Evidence |
|---|---|---|
| Quốc hiệu "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" present | `AUTO_OK` | auto-detected from rendered DOCX visible text |
| Tiêu ngữ "Độc lập – Tự do – Hạnh phúc" present | `AUTO_OK` | auto-detected from rendered DOCX visible text (tolerates both – and -) |
| Title "BIÊN BẢN" present | `AUTO_OK` | auto-detected from rendered DOCX visible text |
| Subtitle "Tiếp nhận nguồn tin về tội phạm" present | `AUTO_OK` | auto-detected from rendered DOCX visible text |
| End-of-reception line present | `AUTO_OK` | auto-detected from rendered DOCX visible text |
| No "Nơi nhận:" because BM-001 is NOT_APPLICABLE_BY_TEMPLATE | `AUTO_OK` | auto-detected from rendered DOCX visible text |

## Human-Only Visual checks (Planner eyeball required)

| Check | Status | Evidence |
|---|---|---|
| Header date line is right-aligned (visual) | `NEEDS_HUMAN` | visual paragraph alignment — open rendered.latest.docx in Word |
| VKS underline length is visually correct | `NEEDS_HUMAN` | visual underline width — open rendered.latest.docx in Word |
| "Ban hành theo Thông tư…" remains size 8 | `NEEDS_HUMAN` | visual font size — open rendered.latest.docx in Word |
| Title "BIÊN BẢN" bold + 14pt | `NEEDS_HUMAN` | visual weight + size — open rendered.latest.docx in Word |
| Subtitle "Tiếp nhận nguồn tin về tội phạm" bold + 14pt | `NEEDS_HUMAN` | visual weight + size — open rendered.latest.docx in Word |
| I. NỘI DUNG / II. CÁC TÀI LIỆU bold + 14pt | `NEEDS_HUMAN` | visual weight + size — open rendered.latest.docx in Word |
| Signature titles bold + 14pt | `NEEDS_HUMAN` | visual weight + size — open rendered.latest.docx in Word |
| Page numbers visually acceptable | `NEEDS_HUMAN` | visual — open rendered.latest.docx in Word |

## Auto vs Human split

- AUTO_OK: **22**
- AUTO_FAIL: **0**
- NEEDS_HUMAN: **8**
- UNVERIFIED: **0**

## Visual Sign-off Reminder

- This script never flips `visualSignoffGranted` to true.
- The PR6G.5 rollout gate (`pnpm audit:bm-rollout-ready -- BM-001`) stays `BLOCKED_MANUAL_REVIEW` until a Planner eyeball confirms.
- No BM-171 implementation, no mass rollout, no locked DOCX/template mutation.

