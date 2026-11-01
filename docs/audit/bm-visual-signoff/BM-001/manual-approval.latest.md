# BM-001 Manual Visual Sign-off — Planner Approval

**STATUS**: `GRANTED`
**visualSignoffGranted**: true
**rolloutReady**: true (effective after this file is loaded by the audit gates)

**Approver**: Planner
**Approved At**: 2026-07-04T20:55:00Z
**Generated At**: 2026-07-04T21:01:30Z

**Reviewed Artifact**: `docs/audit/bm-visual-signoff/BM-001/rendered.latest.docx`
**Rendered DOCX SHA-256**: `0021c21dddf5e2b147e2bb1aaf812dd4848e91c97720ea3816168d461d58a7c5`

**Render Path**: production (`ContractRenderPlanBuilder` + `DocxtemplaterContractRenderEngine`)
**Canonical Fixture**: post-PR6G.3.1 (matches `pr6g31-bm001-rendered-docx-parity.spec.ts`)

## Decision

Planner approved the BM-001 visual sign-off packet. The rendered DOCX above is the canonical evidence. All 8 human-only visual checks were verified visually in Microsoft Word.

## Approved Human-Only Visual Checks

| # | Check | Verdict |
|---|---|---|
| 1 | Header date line is right-aligned | PASS |
| 2 | VKS underline length is visually correct | PASS |
| 3 | "Ban hành theo Thông tư…" remains size 8 | PASS |
| 4 | Title "BIÊN BẢN" bold + 14pt | PASS |
| 5 | Subtitle "Tiếp nhận nguồn tin về tội phạm" bold + 14pt | PASS |
| 6 | I. NỘI DUNG / II. CÁC TÀI LIỆU bold + 14pt | PASS |
| 7 | Signature titles bold + 14pt | PASS |
| 8 | Page numbers visually acceptable | PASS |

## Safety Gates — all GREEN

- BM-171 work: **BLOCKED** (not started). This PR only consumes the approval.
- Mass rollout: **BLOCKED**. Other BMs (BM-002..BM-213) still report the same status as before this artifact — they are NOT flipped to READY by this file.
- Locked DOCX / template mutation: **NONE**. Reviewed artifact is a fresh `renderShadow` output, not a source mutation.
- Locked contract (`BM-001__f4c2aa3682d3.contract.locked.json`): untouched.
- `generatedDocumentId`: no fake value; the audit gate's static scan remains PASS.
- DB write from `/templates`: still NOT_APPLICABLE; the audit gate's static scan remains PASS.

## Downstream Effects

When `docs/audit/bm-visual-signoff/BM-001/manual-approval.latest.json` exists with `decision === 'GRANTED'`, `visualSignoffGranted === true`, and the `reviewedDocxSha256` matches the rendered DOCX the audit gates compose against, the following flips happen:

| Consumer | Before this file | After this file |
|---|---|---|
| `pnpm audit:bm-final -- BM-001` `status` | `MANUAL_REQUIRED` | `PASS` |
| `pnpm audit:bm-final -- BM-001` `rolloutReady` | `false` | `true` |
| `pnpm audit:bm-rollout-ready -- BM-001` `status` | `BLOCKED_MANUAL_REVIEW` | `READY` |
| `pnpm audit:bm-rollout-ready -- BM-001` `manualReviewRequired` | `true` | `false` |
| `pnpm audit:bm-rollout-ready -- BM-001` `rolloutReady` | `false` | `true` |

The remaining gates (1..14 in `audit-bm-rollout-ready`) are unchanged. They were already PASS / NOT_APPLICABLE before this approval and they stay that way.

## Integrity Check

The audit gates MUST verify that the `reviewedDocxSha256` field in this file matches the actual sha256 of `docs/audit/bm-visual-signoff/BM-001/rendered.latest.docx` at evaluation time. The packet-builder script (`scripts/audit/build-bm001-visual-signoff-packet.mjs`) is the single source of that DOCX, so this integrity check is a one-shot match against the freshly rendered DOCX the packet just wrote.

If `reviewedDocxSha256` ever drifts from the on-disk DOCX, the gates fall back to the previous behaviour (`status: MANUAL_REQUIRED` / `BLOCKED_MANUAL_REVIEW`). This protects against stale approvals if the render pipeline is ever rerun with a different fixture.

## Next Action

Run:

```bash
node scripts/audit/build-bm001-visual-signoff-packet.mjs BM-001   # (already done in PR6G.5.1)
pnpm audit:bm-final -- BM-001
pnpm audit:bm-rollout-ready -- BM-001
pnpm audit:bm-rollout-ready:test
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
pnpm --filter @qllaw/form-contracts exec tsc --noEmit
pnpm audit:hardcode
pnpm audit:locked-compiled
pnpm audit:contract-sync
```

Expected:

- `pnpm audit:bm-final -- BM-001` → `status=PASS harnessReady=true rolloutReady=true`
- `pnpm audit:bm-rollout-ready -- BM-001` → `status=READY technicalReady=true manualReviewRequired=false rolloutReady=true`
- All other commands → exit 0 / green

## What this PR does NOT do

- It does not start BM-171.
- It does not mass rollout.
- It does not mutate locked contracts/templates.
- It does not flip readiness for any BM other than BM-001.
- It does not introduce a fake `generatedDocumentId`.
- It does not introduce a DB write from `/templates`.