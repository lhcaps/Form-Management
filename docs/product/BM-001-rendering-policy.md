# BM-001 Rendering Policy

## Purpose

This policy defines the product boundary between the canonical blank BM-001
source form, a completed BM-001 document, and the web data-entry interface.
It governs presentation fidelity only and does not certify legal correctness.

## Canonical Source and Drafting Instructions

The canonical `.doc` source remains unchanged and preserves all seven numbered
drafting instructions supplied with the blank form.

Completed BM-001 documents intentionally omit those instructions because they:

- direct the person preparing the form rather than record case evidence;
- have already been applied through the form fields and renderer bindings;
- are not content entered, confirmed, or signed by the parties;
- consume page space and can destabilize the completed document's signature
  layout.

Removing the instructions from a completed document does not authorize their
removal from the canonical blank source.

## Completed DOCX Presentation Invariants

Every generated BM-001 DOCX must satisfy these requirements:

- the receiver identity paragraph beginning with `Tôi:` uses explicit black
  text for every visible run;
- the top-right `Mẫu số 01/HS` note and its legal-basis text use explicit black
  text at 8pt;
- unrelated formatting and unrelated DOCX package parts remain unchanged;
- optional empty values render naturally without `undefined`, `null`, or an
  unresolved placeholder;
- long content may flow to a second page when necessary; content must not be
  compressed merely to force a one-page result.

`FMT-018` and `FMT-019` are hard structural checks for the two BM-001-specific
color and typography invariants.

## Web Form and Print Behavior

`Giới tính` and `Tên gọi khác` are explicit labeled BM-001 form controls and
map to `informant.genderLabel` and `informant.otherName`.

The sticky save/action panel is application chrome. It remains available for
interactive screen use and must be hidden under print media so it cannot cover
form fields or appear in a PDF/printed form.

## Cutover Boundary

Automated checks and agent-assisted Word inspection are technical evidence.
They do not constitute human active-cutover approval.

BM-001 must remain in `off` or `shadow` mode until:

1. a new Microsoft Word human review approves the remediated artifacts;
2. the named reviewer and review date are recorded;
3. the explicit active-cutover approval checkbox is selected; and
4. `pnpm check:bm001-cutover -- --require-ready` exits `0`.

Until then, `DOCUMENT_RENDERER_MODE=active` must not be enabled.
