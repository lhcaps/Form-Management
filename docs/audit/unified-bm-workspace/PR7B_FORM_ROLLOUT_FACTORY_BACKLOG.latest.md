# PR7B — Form Rollout Factory Backlog

> **Status:** Pre-PR7B intake. Every item below was identified during the
> PR7A BM-171 controlled rollout as a piece of **repeated manual work that
> must become an automated factory step**.
>
> **Hard contract:** No BM becomes an N-PR rollout again. Once PR7B lands,
> rolling out BM-X requires only "fill the per-BM input artifacts, run the
> factory"; no new PRs per BM.
>
> **Source:** observations made while implementing PR7A. Each line traces
> to a specific decision point where manual work was repeated.

---

## 0. PR7A scope reminder (for context)

PR7A rolled out BM-171, the second controlled BM, using the BM-001 foundation.
The factory backlog below was observed during that rollout. Every item is
additive — adding BM-171 must NOT remove or mutate the BM-001 artefacts
already on disk.

---

## 1. Backlog items (ranked by impact)

### F1 — Per-BM allow-list in audit scripts

**Observation:** Both `scripts/audit/audit-bm-final.mjs` and
`scripts/audit/audit-bm-rollout-ready.mjs` hardcode BM-001 in code paths:
- `audit-bm-final.mjs` `readManualVisualApproval` early-returns
  `if (templateCode !== 'BM-001') return null;`
- `audit-bm-rollout-ready.mjs` gates 2, 6, 9, 15 each early-return
  `NOT_APPLICABLE` for any non-BM-001 template.
- `scripts/audit/build-bm001-visual-signoff-packet.mjs`
  `ALLOWED_TARGETS = new Set(['BM-001'])` refuses every other BM.

**Factory need:** Replace the hardcoded `BM-001` short-circuit with a
data-driven allow-list (e.g. `config/rollout-factory/allowed-bms.json`)
that the audit scripts read at startup. The first registration adds
BM-171; subsequent BMs add a single line.

**Status in PR7A:** **Generalised ad-hoc for BM-171 by relaxing the
`!== 'BM-001'` guards to a small allow-list inside the script** (BM-001
∪ {BM-171}). This is a one-shot accommodation; PR7B turns it into a
data-driven allow-list with full factory discipline.

---

### F2 — `build-bmXXX-visual-signoff-packet.mjs` per-BM

**Observation:** The BM-001 sign-off packet builder hardcodes the BM-001
fixture, the BM-001 canonical strings (`BIÊN BẢN`, `Tiếp nhận nguồn tin
về tội phạm`, etc.), and the BM-001 human-only checklist. BM-171 needs a
parallel builder with BM-171 strings.

**Factory need:** A single `build-bm-visual-signoff-packet.mjs` driven by
a per-BM JSON fixture + checklist (auto-confirmable + human-only). The
canonical fixture file lives at
`config/rollout-factory/<BM>/canonical-fixture.json` and the checklist
lives at `config/rollout-factory/<BM>/human-only-checks.json`.

**Status in PR7A:** **Two parallel scripts exist** —
`build-bm001-visual-signoff-packet.mjs` and
`build-bm171-visual-signoff-packet.mjs`. PR7B replaces both with a single
parameterised script.

---

### F3 — Per-BM canonical render helper

**Observation:** `apps/api/scripts/render-bm001-canonical-signoff.mjs`
hardcodes the BM-001 fixture payload inside the script. BM-171 needs a
parallel helper that loads its fixture.

**Factory need:** A single `render-bm-canonical-signoff.mjs` that reads
the same per-BM canonical fixture JSON that F2 consumes, calls the
production render path, and emits the rendered DOCX + manifest.

**Status in PR7A:** **Two parallel render helpers exist** —
`render-bm001-canonical-signoff.mjs` and
`render-bm171-canonical-signoff.mjs`. PR7B unifies them behind one
helper.

---

### F4 — Per-BM rendered-DOCX parity spec

**Observation:** `pr6g31-bm001-rendered-docx-parity.spec.ts` is fully
BM-001-specific. BM-171 ships a parallel
`pr6g31-bm171-rendered-docx-parity.spec.ts`. Each new BM multiplies the
spec count linearly.

**Factory need:** A single `pr6g31-bm-rendered-docx-parity.spec.ts`
that reads the per-BM canonical fixture + per-BM must-contain /
must-not-contain string tables from JSON, then runs the SAME assertions
against the rendered DOCX. The fixture and string tables are sourced
from `config/rollout-factory/<BM>/parity-strings.json`.

**Status in PR7A:** **Two parallel specs exist**. PR7B consolidates them.

---

### F5 — Per-BM style-profile integration spec

**Observation:** `docxtemplater-contract-render-engine-style-profile.spec.ts`
is BM-001-specific (asserts BM-001's rules apply). BM-171 ships
`docxtemplater-contract-render-engine-bm171-style-profile.spec.ts`.
Same linear growth problem as F4.

**Factory need:** A single spec that runs the same four test cases for
every registered style profile (no-op for unknowns, auto-applies for the
target BM, text not mutated by run-properties, registry reset is idempotent).
The per-BM rule ID expectations come from the per-BM profile file itself.

**Status in PR7A:** **Two parallel specs exist**. PR7B consolidates them.

---

### F6 — Per-BM field-coverage artefact generator

**Observation:** `BM171_FIELD_COVERAGE.latest.json` is hand-authored in
the intake PR (a 34-row table mirroring `BM001_FIELD_COVERAGE.latest.json`).
Every future BM needs the same hand-authored coverage artefact.

**Factory need:** A single `build-bm-field-coverage.mjs` that reads the
locked contract JSON for a given BM, walks `docxSlots[]`, and emits the
coverage artefact. The script must produce the SAME shape as the existing
BM-001/BM-171 hand-authored artefacts so downstream gates do not need to
change.

**Status in PR7A:** **Not implemented** — the BM-171 coverage artefact
remains hand-authored. PR7B builds the generator + a one-shot re-run for
BM-001 + BM-171 to confirm parity with the hand-authored versions.

---

### F7 — Per-BM renderer adapter

**Observation:** `document-renderer.service.ts` has BM-001-specific
inline branches at multiple locations (the `isBm001Template` flags at
lines ~4238, ~5990, ~6010, ~6100; the `templateCode === 'BM-001'`
blocks at lines ~578, ~24520, ~33743). PR6G.3.1 introduced the
`bm001DocumentIssuePlaceDateLineAligned` / `bm001ArchiveLineAligned`
companion fields, but those still live inline in the monolithic
renderer service. BM-171 needs its own inlined branches, multiplying
the maintenance load.

**Factory need:** A `BmRenderPayloadAdapter` registry
(`apps/api/src/modules/documents/rendering/infrastructure/adapters/`) with
one adapter file per BM. `document-renderer.service.ts` looks up the
adapter via `templateCode` and delegates the per-BM `*Aligned` companion
fields. The first non-BM-001 adapter (BM-171) demonstrates the pattern;
subsequent BMs are additive.

**Status in PR7A:** **Out of scope** — modifying
`document-renderer.service.ts` to introduce a registry would be a
high-risk refactor that is better done as PR7B's first task than as a
per-BM inline branch. BM-171 inherits the BM-001 pattern: the FE form-inputs
API is implemented but the BE adapter remains inline in the
renderer service — flagged as a follow-up.

**Workaround in PR7A:** The BM-171 form-inputs panel + canonical fixture
uses the **shared toolkit** (`@qllaw/form-contracts`) directly, so the
BE side still produces correct output via the toolkit even though the
inline adapter pattern is not yet extracted. This works because the locked
BM-171 contract uses identity transforms for every slot — the tool calls
live in the FE mapper and the BE only needs identity passthrough. A
follow-up BM with conditional slots (e.g. BM-002 with `includeX` flags)
will force the F7 extraction.

---

### F8 — `audit-bm-final` style-summary generalisation

**Observation:** `summariseStyle()` in `audit-bm-final.mjs` checks for a
BM-001-only manual-approval artefact. To flip a non-BM-001 BM to PASS
the function must be generalised.

**Factory need:** Replace the `if (templateCode !== 'BM-001') return null;`
early-return with a per-BM manual-approval lookup
(`docs/audit/bm-visual-signoff/<BM>/manual-approval.latest.json`).
This is a structural generalisation, not a per-BM hardcode.

**Status in PR7A:** **Generalised** — the helper reads the manual
approval from `docs/audit/bm-visual-signoff/<templateCode>/...` for any
BM. BM-171's style summary still reports `MANUAL_REQUIRED` because no
manual approval has landed yet (which is the correct honest status
before Planner eyeball).

---

### F9 — Batch audit gate runner

**Observation:** Every per-BM rollout requires running three audit
commands sequentially: `audit:bm-final -- BM-XXX`,
`audit:bm-rollout-ready -- BM-XXX`, and the per-BM visual sign-off
packet builder. The order is mandatory (final audit must precede
rollout-ready; rollout-ready must precede visual sign-off packet; visual
sign-off packet must precede Planner eyeball).

**Factory need:** A single `audit:bm-factory -- BM-XXX` command that runs
all three with the correct ordering, propagates failures, and writes a
single combined readiness summary to
`docs/audit/bm-rollout/<BM>/factory-run.latest.json`.

**Status in PR7A:** **Not implemented**. PR7A explicitly does NOT bundle
the three commands — each runs in its own shell step so the operator can
inspect each artefact independently. PR7B adds the combined runner.

---

### F10 — Exception queue + per-BM retry hook

**Observation:** Once we roll out multiple BMs per batch, some BMs will
fail the audit gate (e.g. locked contract hash mismatch, missing
normalized DOCX). Today the operator must discover each failure by
re-reading the audit artefact manually. With 5+ BMs per batch, this is a
manual bottleneck.

**Factory need:** A simple `docs/audit/rollout-factory/exception-queue.latest.json`
artefact that aggregates every FAIL across all three audit commands for
every BM in the current batch. The operator reads ONE file to triage.
Format: per-BM `{ status, failedGates[], recommendedAction }` rows.

**Status in PR7A:** **Not implemented**. The audit artefacts themselves
are sufficient for one-BM-at-a-time. PR7B adds the queue when we move
to multi-BM batch runs.

---

### F11 — Per-BM intake report generator

**Observation:** `PR7A_BM171_INTAKE.latest.md` is 590 lines of
hand-authored intake analysis that future BMs would need to mirror.
Even with PR7B, an intake artefact must exist per BM to record which
locked contract hash, normalized DOCX sha256, and reference slot map the
factory is rolling out.

**Factory need:** A generator that reads the locked contract + normalized
DOCX + extracted DOCX structure JSON, then emits:
- `docs/audit/unified-bm-workspace/PR<X>B_<BM>_INTAKE.latest.md`
- `<BM>_FIELD_COVERAGE.latest.json`
- `<BM>_RENDERED_TEXT_EVIDENCE.latest.md`
- `<BM>_STYLE_PROFILE_REQUIREMENTS.latest.md`

The intake generator produces the canonical artefacts but the **typographic
intent** for the style profile still needs human derivation (the matcher
texts come from the source body, not from any auto-extractable signal).
So the style profile file itself remains manual.

**Status in PR7A:** **Intake artefacts were hand-authored** in PR7A.
PR7B adds the generator to accelerate intake phases for BMs where the
locked contract + normalized DOCX are already on disk.

---

## 2. What PR7B will look like (high-level)

```
PR7B — Form Rollout Factory
├── F1: data-driven BM allow-list (config/rollout-factory/allowed-bms.json)
├── F2–F5: parameterised per-BM scripts (one each: packet-builder,
│          render-helper, parity-spec, style-profile-spec)
├── F6: build-bm-field-coverage.mjs (auto coverage artefact)
├── F7: BmRenderPayloadAdapter registry (replaces inline BM-XXX branches
│       in document-renderer.service.ts)
├── F8: already partially generalised in PR7A; PR7B consolidates
├── F9: audit:bm-factory combined runner
├── F10: exception queue artefact
└── F11: build-bm-intake-report.mjs (4 artefacts per BM)
```

## 3. Acceptance (post PR7B)

- One command, one PR, one human sign-off can roll out an arbitrary BM
  whose locked contract + normalized DOCX already exist.
- No `BM-XXX` literal in any audit script or sign-off packet script
  (every BM is data, not code).
- Per-BM artefacts under `config/rollout-factory/<BM>/` are the single
  source of per-BM factory input.

## 4. Current PR7A hand-offs

The following are written manually in PR7A but MUST be regenerated by
PR7B factory scripts:
- `docs/audit/unified-bm-workspace/BM171_FIELD_COVERAGE.latest.json`
- `docs/audit/bm-visual-signoff/BM-171/` packet files
- `apps/api/scripts/render-bm171-canonical-signoff.mjs`
- `scripts/audit/build-bm171-visual-signoff-packet.mjs`
- `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts`
- `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-bm171-style-profile.spec.ts`

PR7A intentionally writes these by hand (per the "no copy-paste from
BM-001" rule). PR7B's factory scripts are the regression target —
when PR7B lands, the next BM (whatever it is) ships ZERO new inline
per-BM files.
