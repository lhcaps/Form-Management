# BM-019/BM-020 DOCX Remediation Design

## Context

The first 60 reviewed form contracts now have semantic placeholders and passing
structural preview evidence. The remaining 153 normalized DOCX files have no
semantic placeholders, so they cannot safely enter the existing refinement
pipeline.

The approved handoff requires the next wave to avoid invented placeholders,
read each normalized DOCX directly, compare it with the bespoke panel and
runtime payload, and defer any form whose meaning is not clear enough.

## Selected batch

This wave remediates only:

- `BM-019`: request to supplement a criminal-case initiation decision.
- `BM-020`: request to cancel an initiation/non-initiation decision.

Both forms have bespoke panels with reviewed payload names. Their normalized
DOCX files have stable paragraph anchors but only legacy dotted blanks.

## Considered approaches

1. **Deterministic per-template remediation — selected.**
   Replace only reviewed paragraphs and blank ranges. Abort when an expected
   source paragraph is missing or changed.
2. **Corpus-wide heuristic insertion — rejected.**
   Faster, but it would convert layout guesses into apparently authoritative
   field bindings and violate the no-guessing guardrail.
3. **OCR or visual-layout inference — deferred.**
   Useful for ambiguous forms, but the current machine has no LibreOffice
   visual pipeline and these two forms already have sufficient textual and
   panel provenance.

## Architecture

### Remediation layer

A reusable OOXML helper will:

- read only `word/document.xml`;
- identify a paragraph by exact visible text;
- replace reviewed text while preserving paragraph/run XML around it;
- clone the existing signature paragraph when several semantic signature
  lines must replace one dotted legacy line;
- fail when an anchor is missing, duplicated, or already differs from the
  reviewed source;
- preserve every DOCX package part other than `word/document.xml`.

Template-specific functions will hold the BM-019 and BM-020 replacement maps.
No replacement rule will be inferred from a BM code or document title.

### Semantic fields

BM-019 binds header data, the original initiation decision, original and
additional offenses, requested authority, recipients, and signature data.
Repeated facts use the same placeholder path.

BM-020 binds header data, its reviewed reason line, generated Article 1 and
Article 2 lines, requested authority, recipients, and signature data. The
existing bespoke panel already writes `reasonLine`, `article1Line`, and
`article2Line`, so the DOCX does not need conditional slash-branch logic.

### Refinement layer

After the DOCX files contain semantic placeholders:

- add one semantic profile per BM;
- add the exact field order to the focused refinement test;
- dry-run refinement before writing contracts;
- keep contracts `draft`, sources `unknown`, and all review flags enabled;
- render sample previews and produce structural evidence.

## Safety and failure handling

- Remediation is idempotent: an already-remediated file returns unchanged.
- Partial remediation is forbidden. Any missing or duplicate anchor aborts
  before a DOCX buffer is returned.
- No original `.doc` file is modified.
- No template outside BM-019/BM-020 is modified.
- BM-001 cutover state and renderer mode remain unchanged.
- Structural preview evidence is not reported as visual or legal approval.

## Verification

The batch is accepted only when:

- remediator unit tests prove exact replacements, idempotency, fail-closed
  behavior, and preservation of unrelated package parts;
- focused refinement tests pass for all existing forms plus BM-019/BM-020;
- dry-run counts match the reviewed profiles before `--write`;
- refinement smoke reports no unresolved placeholders, missing samples,
  literal leakage, or package-integrity changes;
- DOCX contract verify, authoring audit, template/UI/encoding audits, lint,
  typecheck, full tests, and build pass;
- runtime smoke is attempted if the local API can be started cleanly.

## Approval provenance

This design implements the continuation instructions in the user-provided
handoff: file 2 defines the workflow and guardrails, while file 1 records the
60 completed forms and selects the 153-form DOCX remediation wave as the next
priority.
