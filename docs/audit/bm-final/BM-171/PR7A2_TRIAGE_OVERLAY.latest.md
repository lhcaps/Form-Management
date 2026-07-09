# BM-171 Final Audit — PR7A.2 Triage Overlay (2026-07-05)

> **This is an OVERLAY** on top of `docs/audit/bm-final/BM-171/final.latest.md`
> (which is regenerated on every `pnpm audit:bm-final` run and therefore
> does not persist triage-layer information). The overlay is the
> canonical source of the PR7A.2 conclusion for the BM-171 final-audit
> evidence.

## Cross-references

- Visual sign-off packet (overlaid): `docs/audit/bm-visual-signoff/BM-171/visual-signoff.latest.json` (now `packetStatus: FAIL_VISUAL_REVIEW`)
- Triage MD: `docs/audit/unified-bm-workspace/PR7A2_BM171_DOCX_PARTS_LAYOUT_TRIAGE.latest.md`
- Triage JSON: `docs/audit/unified-bm-workspace/PR7A2_BM171_DOCX_PARTS_LAYOUT_TRIAGE.latest.json`
- Readiness overlay: `docs/audit/bm-rollout/BM-171/readiness.latest.{json,md}` (`pr7a2TriageOverlay` block)

## What this overlay says on top of `final.latest.{json,md}`

| field | generic `final.latest` says | PR7A.2 overlay says |
|---|---|---|
| `status` | `MANUAL_REQUIRED` | `MANUAL_REQUIRED` (unchanged — generic verdict stands) |
| `rolloutReady` | `false` | `false` (also unchanged) |
| `style.status` | `MANUAL_REQUIRED` | `MANUAL_REQUIRED` (with `failureReason: PR7A2_TRIAGE_BLOCKED_LAYOUT`) |
| `docxParts.footnotes` | `NOT_APPLICABLE_BY_TEMPLATE` | **MISLEADING** — should be `NOT_PRESENT`. The DOCX package has no `word/footnotes.xml` part at all. |
| `docxParts.endnotes` | `NOT_APPLICABLE_BY_TEMPLATE` | **MISLEADING** — should be `NOT_PRESENT`. The DOCX package has no `word/endnotes.xml` part at all. |
| `blockers` | "BM-171 visual style sign-off is still pending" | Same + the PR7A.2 triage blockers (notes 12/13 visibility, page-1 huge blank, page-2 overflow) |

## PR7A.2 triage blockers layered on top of `final.latest`

1. **Notes 12 / 13 visible at the bottom of the rendered DOCX.** No real
   `<w:footnote>` or `<w:endnote>` exists. Body `<w:p>` paragraphs 86
   and 87 of `word/document.xml` are inherited verbatim from the
   normalized source DOCX.
2. **Page-1 huge blank spacing before `QUYẾT ĐỊNH:`.** Cause: 9
   consecutive empty legal-basis placeholder paragraphs (rendered 21–29)
   each carrying `w:spacing w:before/afterLines="50"` plus a positional
   `<w:drawing>` underline in paragraph 15.
3. **Page-2 overflow** containing `Nơi nhận:`, `Lưu: HSVA, HSKS, VP.`
   and notes 12/13. Cause: 37 empty paragraphs (rendered 50–85) plus
   tight bottom margin (288 twips). No explicit
   `<w:br w:type="page"/>` anywhere.
4. **`audit-bm-final.mjs` evidence wording is misleading** — `BM-171`
   has no `word/footnotes.xml` part at all. Reclassify to `NOT_PRESENT`.
5. **Visual packet blind spot** — `CANONICAL_REQUIRED_PRESENT` /
   `CANONICAL_REQUIRED_ABSENT` do not include any "notes 12/13 must
   be absent" check. PR7A.3 must add it.

## Decisions the PR7A.2 triage did NOT silently take

- Path A (`EXPECTED_BY_TEMPLATE`) vs Path B (`MUST_SUPPRESS`) for
  notes 12/13 visibility policy.
- Whether to extend the PR6G.4 style-profile engine with a
  paragraph-drop rule kind (Path B option 3).
- Whether to mutate the locked contract or normalized DOCX.

Those decisions are deferred to the Planner per direct user
instruction in the source prompt: "Không trả lời được câu đó thì
không sửa." — i.e. the agent refuses to silently pick a side when
both are defensible.

## What is unchanged

- BM-001: still READY (no change to BM-001 artefacts).
- Locked contract for BM-171 (`docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json`): NOT modified.
- Normalized DOCX for BM-171 (`storage/templates/normalized-docx/BM-171/BM-171_normalized.docx`): NOT modified.
- No `manual-approval.latest.{json,md}` written.
- `rolloutReady` and `visualSignoffGranted` for BM-171 stay `false`.
- PR7B is NOT started. No other BM rollout is started.

## What must happen in PR7A.3

The fix-decision branch (PR7A.3) cannot be a hotfix because the issue
has two defensible paths and both touch different surfaces:

- Path A (`EXPECTED_BY_TEMPLATE`): zero code change; just re-run the
  visual sign-off packet with an explicit
  `notes 12/13 present (EXPECTED_BY_TEMPLATE)` check and update the
  audit verdict wording.
- Path B (`MUST_SUPPRESS`):
  - Option 1 — mutate normalized DOCX (FORBIDDEN per AGENTS.md
    without explicit user scope).
  - Option 2 — per-BM body-tail-clipper rule in the contract render
    plan (PR6G-level change).
  - Option 3 — per-BM body-tail-drop rule in the BM-171 style profile
    (requires a new style-rule kind in the PR6G.4 generic engine).

PR7A.3 cannot run until the user picks Path A or Path B.

## Verdict (effective)

| decision | value |
|---|---|
| BM-171 visual sign-off | **FAIL_VISUAL_REVIEW** |
| BM-171 `manualApprovalAllowed` | **`false`** |
| BM-171 `rolloutReady` (effective) | **`false`** |
| BM-171 blocker tier | **`BLOCKED_LAYOUT`** (new tier introduced by PR7A.2) |
| BM-001 status | `READY` (unchanged) |
| PR7B / other BM rollout | **NOT_STARTED** |
| Mutate locked contract / normalized DOCX | **NOT_DONE** |

Generated: 2026-07-05T16:30:00.000Z
