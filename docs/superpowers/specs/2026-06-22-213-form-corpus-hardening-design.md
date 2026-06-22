# 213-Form Corpus Hardening Design

## Context

The repository exposes all 213 forms through Form Studio and `/documents`, but
the current `LOCKED_VERIFIED: 213` label is not trustworthy. A fresh audit on
2026-06-22 found:

- 213 locked files were produced by `system-batch-lock`;
- 633 locked-contract verification failures;
- 154 normalized-DOCX hash mismatches;
- 136 contracts with duplicate slot and binding identifiers;
- 62 contracts with generic paths such as `document.field` or
  `recipients.field`;
- BM-058 is an invalid DOCX package;
- the baseline audit equates `status: locked` with verified quality.

The objective is to make the corpus auditable and runtime-safe, then remediate
forms in evidence-backed waves until every form matches its normalized DOCX.

## Selected approach

Use a blocker-first corpus hardening program:

1. introduce one deterministic quality evaluator shared by audits and runtime;
2. make lock generation fail closed and preserve review provenance;
3. repair mechanically provable defects across the corpus;
4. remediate semantic defects per template, beginning with BM-058 and BM-213;
5. require package, contract, runtime, and render evidence before a form is
   described as verified.

Bulk heuristic renaming is rejected. A frontend field with the same ordinal as
a DOCX blank is evidence, not proof.

## Quality states

Each canonical form receives one of these states:

- `VERIFIED`: valid package, matching hash, semantic placeholder parity,
  no generic paths, no unresolved review flags, and approved review provenance.
- `AUTOMATED_REVIEW_PENDING`: structurally clean but only machine-reviewed.
- `SEMANTIC_REMEDIATION_REQUIRED`: generic or ambiguous field names remain.
- `PACKAGE_REPAIR_REQUIRED`: the DOCX package cannot be opened or lacks required
  OOXML parts.
- `CONTRACT_REPAIR_REQUIRED`: contract bindings do not match the normalized
  template or contain contradictory records.

`status: locked` alone never produces `VERIFIED`.

## Corpus quality evaluator

A reusable module inspects one contract and its normalized DOCX:

- parses the package and requires `[Content_Types].xml`, `_rels/.rels`, and
  `word/document.xml`;
- compares `extractionSource.sha256` with the actual normalized file;
- extracts unique mustache placeholders and compares them with contract slots
  and bindings;
- rejects broad generic paths including `.field`, `.field12`, and generated
  placeholder names;
- detects conflicting duplicate records while allowing exact duplicate
  occurrences to be normalized safely;
- distinguishes automated review from approved human review.

The locked-contract and authoring-baseline reports consume this evaluator.

## Lock pipeline

`lock-reviewed-contracts.mjs` must:

- reject `system-batch-lock` as human approval;
- require an explicit review kind;
- apply semantic mappings before lock validation;
- collapse only byte-equivalent duplicate slot/binding records;
- reject duplicates that disagree on source, transform, fallback, or evidence;
- refuse generic paths and package/hash mismatch;
- retain unresolved questions instead of clearing them automatically.

Existing automated artifacts remain available as evidence but are not treated
as human-approved production contracts.

## BM-058 and BM-213

### BM-058

Recover the full package from the valid checked-in backup/source rather than
repacking an extracted directory. Replace only reviewed blanks with semantic
placeholders, preserve every unrelated ZIP part, update the contract hash, and
render the result.

### BM-213

Read the full visible DOCX text and bespoke panel payload. Replace generic
`recipients.field` and `document.field` placeholders with reviewed semantic
names. Literal ellipses that are part of legal prose remain unchanged.

Both forms must pass focused refinement, package, placeholder-parity, and
render checks.

## Mechanical corpus reconciliation

For contracts whose normalized DOCX already contains semantic placeholders:

- synchronize the extraction hash;
- collapse exact duplicate slot/binding records;
- preserve the canonical field set;
- reject any conflicting duplicate instead of choosing one;
- keep automated provenance as pending review.

No semantic name is invented during this phase.

## Semantic waves

Remaining generic forms are grouped by legal workflow and similarity. Every
wave:

1. reads the normalized DOCX and its source;
2. compares the bespoke form panel and runtime payload;
3. adds a reviewed semantic profile;
4. remediates placeholders with fail-closed anchors;
5. updates the draft/locked evidence without fabricating human approval;
6. runs focused tests, smoke preview, and render QA.

## Runtime safety

Active contract rendering must reject contracts that do not meet the configured
quality threshold. Shadow mode may inspect pending forms, but automatic review
must not silently become active production approval.

## Verification

The program is complete only when:

- corpus quality reports 213 packages readable and 213 hashes matching;
- no contract has generic paths, conflicting duplicates, missing bindings, or
  unresolved placeholders;
- all focused and global contract/refinement tests pass;
- lint, typecheck, tests, and build pass;
- runtime smoke creates documents through `/documents/{id}`;
- every final normalized DOCX is rendered and visually inspected;
- human/legal approval is reported separately and never inferred.

