# Corrected 213-Form Remediation Path

Generated from the current audit state after the BM-003/BM-036/BM-021/BM-022/BM-025/BM-032 structural repairs and the BM-213 legacy renderer manifest refresh.

## What Was Corrected

The prior unsafe direction was to force contract paths, DOCX slots, and render bindings to share the same identifier. That is not always correct.

Correct rule:

- `docxSlots[].slotId` must target the exact normalized DOCX placeholder.
- `renderBindings[].from` must point to the semantic source field.
- A contract field can remain semantic while a DOCX slot keeps a legacy or normalized placeholder name.

BM-096 is the reference example: the DOCX placeholder remains `document.diaChi`, while the semantic source remains `person.idNumber`.

## Current State

- Contract DB sync: 213/213 matched.
- Authoring baseline resolved: 191/213.
- Remaining contract-repair blockers: 22.
- Current contract-repair batch: BM-052, BM-062, BM-063, BM-065, BM-066.

## New Gate Before Contract Repair

Do not add, relink, or remove fields merely because a placeholder is present or absent when the normalized DOCX placeholder is a repeated numbered placeholder with mixed legal/person/document contexts.

These require DOCX placeholder renormalization first:

- `decision.decisionLineN` repeated across legal basis, person facts, obligations, or footer text.
- `recipients.personLineN` repeated across full name, alias, job, ID number, permanent address, temporary address, signature, or footer text.
- `document.fullDocumentCodeN` repeated across title, date line, participants, committee names, asset descriptions, or execution content.

The evidence planner now emits `REVIEW_RENORMALIZE_DUPLICATE_DOCX_PLACEHOLDER` for these cases and suppresses add-slot suggestions for the same placeholder until the DOCX placeholder map is made semantic.

## Correct Batch Order

1. Keep running sync, root-cause, baseline, board, and evidence audits after every batch.
2. Apply only safe structural decisions when same-BM evidence proves one of:
   - a unique DOCX placeholder needs a field/slot/binding,
   - an orphan field/slot/binding is absent from the normalized DOCX and has no runtime use,
   - a DOCX slot target must be relinked while preserving the semantic `binding.from`.
3. For duplicate numbered placeholders, renormalize the normalized DOCX occurrence-by-occurrence first, then update the contract fields/slots/bindings to the new semantic map.
4. Only after structural and DOCX renormalization blockers clear, continue with path/domain binding, source policy, weak evidence review, and render fidelity.

## Current Renormalization Front

The next real work is not safe contract mutation. It is occurrence-level DOCX renormalization for:

- BM-052: `decision.decisionLine2`, `recipients.personLine6`
- BM-062: `decision.decisionLine11`, `recipients.personLine5`
- BM-063: `document.fullDocumentCode8`, `recipients.personLine5`
- BM-065: `document.fullDocumentCode8`, `recipients.personLine3`
- BM-066: `document.fullDocumentCode4`, `recipients.personLine4`

For each BM, inspect `docs/audit/per-form-render-accurate/<BM>/evidence.latest.json` and `patch-plan.latest.json`; use the occurrence contexts to split placeholders into precise semantic fields before approving any contract repair.
