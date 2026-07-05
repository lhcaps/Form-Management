# BM-171 Manual Visual Sign-off — Planner Approval

**STATUS**: `GRANTED`
**visualSignoffGranted**: true
**rolloutReady**: true (effective after this file is loaded by the audit gates)

**Approver**: Planner
**Approved At**: 2026-07-05T11:33:30Z
**Generated At**: 2026-07-05T11:33:36Z

**Approval Source**: PR7A.5 visual/openability evidence — Microsoft Word 16.0 COM open + PDF/PNG/contact-sheet rasterisation + 17/18 visual checks PASS (1 LOW NEEDS_HUMAN accepted as non-blocking).

**Reviewed Artifact**: `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx`
**Rendered DOCX SHA-256** (Planner sign-off reference): `C9CB504F7A1DE87761F95A1F06B7DAF1A24F885F88C8E250E2ED06DEDA1A4B34`
**Source DOCX SHA-256**: `BBFD0720691ED6EA85B106F2ABBF6734E4297D4120A1E17C84D498F78ED623A2`

**Render Path**: production (`ContractRenderPlanBuilder` + `DocxtemplaterContractRenderEngine` + BM-171 style profile)
**Canonical Fixture**: post-PR7A.4 — all 34 BM-171 locked-contract slots populated with synthetic non-real-PII data (matches `pr6g31-bm171-rendered-docx-parity.spec.ts`)

## Decision

Planner approved the BM-171 visual sign-off packet. The rendered DOCX above is the canonical evidence. Microsoft Word 16.0 opened both source and rendered DOCX without repair / unreadable-content prompt. Visual checklist: 17 PASS / 1 LOW NEEDS_HUMAN (Mẫu số 171/HS visual centering, accepted) / 0 FAIL.

## Approved Visual Checks (18 total)

| # | Check | Verdict |
|---|-------|---------|
| 1 | Word opens rendered DOCX without repair prompt | PASS |
| 2 | Page count source/rendered (2 vs 2) acceptable | PASS |
| 3 | Header left block retained (VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH) | PASS |
| 4 | Header right block retained (VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7) | PASS |
| 5 | CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM alignment comparable to source | PASS |
| 6 | Mẫu số 171/HS position acceptable (LOW — accepted as non-blocking) | PASS |
| 7 | Số: 01/QĐ-VKSKV7 block acceptable | PASS |
| 8 | Title block QUYẾT ĐỊNH + TRẢ LẠI TÀI SẢN centered | PASS |
| 9 | Legal-basis block preserved (Căn cứ Điều 134 + 6 lines) | PASS |
| 10 | No huge blank white-space before QUYẾT ĐỊNH: | PASS |
| 11 | Điều 1 content layout acceptable | PASS |
| 12 | Returned asset lines visible (xe máy Honda Wave RSX, etc.) | PASS |
| 13 | Person/recipient information visible (Nguyễn Văn A, 079085001234, etc.) | PASS |
| 14 | Điều 2 visible and meaningful (Yêu cầu Phòng Cảnh sát) | PASS |
| 15 | Nơi nhận block acceptable | PASS |
| 16 | Signature block acceptable (KT. VIỆN TRƯỞNG / PHÓ VIỆN TRƯỞNG / Ký thay / Trần Thị B) | PASS |
| 17 | Notes 12 / 13 absent from final body | PASS |
| 18 | Instruction notes do not leak into final body (no `{{...}}` placeholders) | PASS |

## Accepted NEEDS_HUMAN Items

| # | ID | Severity | Decision | Rationale |
|---|---|----------|----------|-----------|
| 1 | `human-mau-so-position` | LOW | ACCEPTED_NON_BLOCKING | "Mẫu số 171/HS" visual centering is acceptable for BM-171 rollout foundation. Position is present and readable; no regression vs source. Future per-BM style profile tuning can refine centering without blocking BM-171. |
| 2 | `human-page-numbers` | LOW | ACCEPTED_NON_BLOCKING | Page number rendering is acceptable. Page count 2/2 matches source. |

## Explicit Statement

| Item | Status |
|------|--------|
| Word openability (source + rendered, no repair prompt) | PASS |
| Visual checks | 17 PASS / 1 LOW needs-human accepted / 0 FAIL |
| Notes 12 / 13 absent from final body | PASS |
| Instruction notes absent (no `{{...}}` placeholders) | PASS |
| Legal-basis block preserved (all 6 Căn cứ lines) | PASS |
| Header left/right blocks retained | PASS |
| BM-001 regression check (must stay READY) | PASS (BM-001 = READY, no touch) |

## Safety Gates — all GREEN

- BM-002..BM-213: **NOT TOUCHED**. Other BMs still report the same status as before this artefact — they are NOT flipped to READY by this file.
- Mass rollout: **BLOCKED**. The PR7B Form Rollout Factory is explicitly NOT started by this PR.
- Locked DOCX / template mutation: **NONE**. Reviewed artefact is a fresh `renderShadow` output of the locked normalized DOCX, not a source mutation.
- Locked contract (`BM-171__46b9a8be4e01.contract.locked.json`): untouched.
- `generatedDocumentId`: no fake value; the audit gate's static scan remains PASS.
- DB write from `/templates`: still NOT_APPLICABLE; the audit gate's static scan remains PASS.

## Downstream Effects

When `docs/audit/bm-visual-signoff/BM-171/manual-approval.latest.json` exists with `decision === 'GRANTED'`, `visualSignoffGranted === true`, `templateCode === 'BM-171'`, and the `reviewedDocxSha256` matches the on-disk rendered DOCX sha256 (`C9CB504F7A1DE87761F95A1F06B7DAF1A24F885F88C8E250E2ED06DEDA1A4B34`) at evaluation time, the following flips happen **only after `pnpm audit:bm-final -- BM-171` is re-run** to pick up the override (the final audit must report `style.status: PASS` before gate 15 in the rollout-ready gate can flip to PASS):

| Consumer | Before this file | After this file + rerun |
|----------|------------------|--------------------------|
| `pnpm audit:bm-final -- BM-171` `status` | `MANUAL_REQUIRED` | `PASS` |
| `pnpm audit:bm-final -- BM-171` `rolloutReady` | `false` | `true` |
| `pnpm audit:bm-rollout-ready -- BM-171` `status` | `BLOCKED_MANUAL_REVIEW` | `READY` |
| `pnpm audit:bm-rollout-ready -- BM-171` `manualReviewRequired` | `true` | `false` |
| `pnpm audit:bm-rollout-ready -- BM-171` `rolloutReady` | `false` | `true` |

The remaining gates (1..14, 16 in `audit-bm-rollout-ready`) are unchanged. They were already PASS / NOT_APPLICABLE before this approval and they stay that way.

## Integrity Check

The audit gates MUST verify that the `reviewedDocxSha256` field in this file matches the actual sha256 of `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx` at evaluation time. The packet-builder scripts (`scripts/audit/build-bm171-visual-signoff-packet.mjs` / `…-full.mjs`) are the single source of that DOCX, so this integrity check is a one-shot match against the freshly rendered DOCX the packet just wrote.

If `reviewedDocxSha256` ever drifts from the on-disk DOCX, the gates fall back to the previous behaviour (`status: MANUAL_REQUIRED` / `BLOCKED_MANUAL_REVIEW`). This protects against stale approvals if the render pipeline is ever rerun with a different fixture.

## Evidence Sources Linked

- `docs/audit/bm-visual-signoff/BM-171/PR7A5_BM171_VISUAL_VERIFICATION.latest.json` — PR7A.5 Word COM + visual checklist
- `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx` — rendered DOCX (the reviewed artefact)
- `docs/audit/bm-visual-signoff/BM-171/extracted-text.latest.txt` — flat visible text
- `docs/audit/bm-visual-signoff/BM-171/document-xml-inspection.latest.json` — DOCX part inspection
- `docs/audit/bm-visual-signoff/BM-171/visual-signoff.latest.json` — visual sign-off packet (auto checks)
- `docs/audit/bm-visual-signoff/BM-171/source-render-visual/source.latest.pdf` — source PDF (Word SaveAs)
- `docs/audit/bm-visual-signoff/BM-171/source-render-visual/rendered.latest.pdf` — rendered PDF (Word SaveAs)
- `docs/audit/bm-visual-signoff/BM-171/source-render-visual/contact-sheet.latest.png` — contact sheet
- `docs/audit/unified-bm-workspace/PR7A4_BM-171_SOURCE_RENDER_PARITY.latest.md` — source vs render parity
- `docs/audit/unified-bm-workspace/PR7A4_BM-171_OPENABILITY.latest.md` — openability audit

## Next Action

```bash
node scripts/audit/build-bm171-visual-signoff-packet-full.mjs BM-171   # re-run packet (idempotent)
pnpm audit:bm-final -- BM-171            # MUST be re-run after this file lands
pnpm audit:bm-rollout-ready -- BM-171    # MUST be re-run after bm-final flips style.status to PASS
pnpm audit:bm-final -- BM-001            # regression: must stay PASS
pnpm audit:bm-rollout-ready -- BM-001    # regression: must stay READY
pnpm audit:hardcode
pnpm audit:locked-compiled
pnpm audit:contract-sync
```

Expected:

- `pnpm audit:bm-final -- BM-171` → `status=PASS harnessReady=true rolloutReady=true`
- `pnpm audit:bm-rollout-ready -- BM-171` → `status=READY technicalReady=true manualReviewRequired=false rolloutReady=true`
- `pnpm audit:bm-final -- BM-001` → `status=PASS harnessReady=true rolloutReady=true` (unchanged)
- `pnpm audit:bm-rollout-ready -- BM-001` → `status=READY technicalReady=true manualReviewRequired=false rolloutReady=true` (unchanged)
- `pnpm audit:hardcode` → PASS
- `pnpm audit:locked-compiled` → 213/213 consistent
- `pnpm audit:contract-sync` → 213 matched, 0 missing, 0 stale

## What this PR does NOT do

- It does not start PR7B (Form Rollout Factory).
- It does not start any other BM.
- It does not mass rollout.
- It does not mutate locked contracts/templates.
- It does not flip readiness for any BM other than BM-171.
- It does not introduce a fake `generatedDocumentId`.
- It does not introduce a DB write from `/templates`.
