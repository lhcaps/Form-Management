# CodeGraph Findings — BM-062

**Generated:** 2026-06-28
**Task:** BM062_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE

---

## Code Facts

### Render pipeline

1. `docxtemplater` resolves placeholders using the render payload.
2. `buildRenderPayload` (from `render-form-fidelity-gate.mjs`) maps `renderBindings[].from` → data values.
3. If a slot has no binding, docxtemplater outputs the **fallback** value — or `undefined` if no fallback.
4. `findUndefinedNullLiterals` scans rendered text for literal strings "undefined" or "null".
5. Each distinct undefined/null literal string in the rendered output counts as one "issue" in `literalFidelity`.

### Key insight: why 5 undefined issues, not 16

`decision.decisionLine11` has 1 slot + 1 binding → all 11 DOCX occurrences get the same bound value → renders as ONE distinct literal string (the bound value, which may be the fallback ""). `recipients.personLine5` has 0 slots, 0 bindings → all 5 occurrences produce literal `undefined` → renders as ONE distinct literal string `undefined`. Total distinct undefined literals = 2. The gate reports 5 — likely counting occurrences or extra edge cases.

### Binding model

```
docxSlots[].slotId          = actual DOCX placeholder id (e.g. "decision.decisionLine11")
renderBindings[].slotId     = docxSlots[].slotId
renderBindings[].from       = semantic source field path
canonicalFields[].path      = semantic source field path
```

### Missing slot = missing literal

If `docxSlots[]` does NOT contain an entry for a DOCX placeholder, docxtemplater outputs the raw placeholder tag `{{placeholder}}` as text — NOT `undefined`. Only a slot-without-binding produces `undefined`.

### Locked contract findings

BM-062 locked contract (`BM-062__110961a781fa.contract.locked.json`):
- `docxSlots`: 5 entries — `agency.name`, `decision.decisionLine`, `recipients.personLine`, `document.fullDocumentCode`, `decision.decisionLine11`
- `renderBindings`: 5 entries — all self-referential (slotId = from)
- `canonicalFields`: 5 entries
- **`recipients.personLine5`**: 0 slots, 0 bindings, 0 canonical fields — completely absent from contract
- **`decision.decisionLine11`**: 1 slot for 11 DOCX occurrences — all map to the same slot + binding
- `formInputHints`: 19 fields (`document.field1`..`field19`, `person.field11`..`field16`) but only 5 in contract

---

## Corpus Naming Conventions

### `decision.decisionLine*` pattern
- BM-052 had `decision.decisionLine2` (✓ correct — was split correctly)
- BM-062 has `decision.decisionLine11` as a **catch-all for 11 different semantic contexts**
- The label "Địa điểm, ngày lập" (place and date of drafting) applies to only 1 of 11 occurrences
- This is a canonical naming error: `decision.*` implies decision metadata, not person/asset data

### `recipients.personLine*` pattern
- `recipients.personLine` = single person name line (already exists, correct)
- `recipients.personLine5` = ambiguous numbered person line
- In BM-062, this appears in the **asset seizure person table** (4 blank cells) + **footer** (1 occurrence)
- The footer occurrence has visible label "(Ký, ghi rõ họ tên, đóng dấu)" — clear signature context

### Corpus pattern for person table rows
- `person.fullName`, `person.idNumber`, `person.job`, `person.temporaryAddress`, `person.permanentAddress`
- `person.alias`, `person.birthDate`, `person.gender`, `person.nationality` exist in other BMs
- BM-052 had `recipients.personLine6` blank cells (deferred to human review)

---

## BM-062 DOCX Facts (from plan.latest.json)

### `decision.decisionLine11` — 11 occurrences

Anchors span: `fullName`, `idNumber`, `job`, `permanentAddress`, `temporaryAddress`, `currentAddress`, `asset`, `assignment`, `prosecutor`, and more. Only ONE occurrence has label "Địa điểm, ngày lập" (place/date).

Occurrence contexts (from plan):
1. After "Điều 1. Kê biên tài sản: 11 {{decision.decisionLine11}}" — this is the labeled occurrence
2-5. In person table row between "Họ tên:" and "Nghề nghiệp:" — these are person detail fields
6. After "Số CMND/Thẻ CCCD/..." — person ID field
7-8. "Nơi thường trú:" and "Nơi tạm trú:" — address fields
9-11. In article body and assignment sections

### `recipients.personLine5` — 5 occurrences

Anchors span: `asset`, `assignment`, `fullName`, `idNumber`, `job`, `prosecutor`, `recipientFooter`, `signature`.

Occurrence contexts:
1-4. In person table row: `Họ tên: 12 {{recipients.personLine}} {{recipients.personLine5}} × 4` — blank cells
5. In footer: `{{recipients.personLine5}} (Ký, ghi rõ họ tên, đóng dấu)` — signature context

---

## Assumptions

- The plan.latest.json occurrence contexts are accurate and from the normalized DOCX.
- The 1 slot for `decision.decisionLine11` was created for the "Địa điểm, ngày lập" occurrence only.
- The other 10 `decision.decisionLine11` occurrences were never given slots because they are mislabeled.
- `recipients.personLine5` was never in the contract at all.

---

## Unknowns

- Which of the 10 remaining `decision.decisionLine11` occurrences should map to person fields?
- Are there existing person field slots in the formInputHints that should be used?
- Should the 4 person-table blank cells become distinct semantic fields?
- Should the footer `recipients.personLine5` be `signature.signerName`?
- What is the canonical path for "Địa điểm, ngày lập" — is it `document.issuePlaceAndDate`?

---

## Unknowns

- Does `formInputHints` provide a path mapping hint for the person fields?
- Is there a pattern in other BM asset seizure forms for person table cells?
