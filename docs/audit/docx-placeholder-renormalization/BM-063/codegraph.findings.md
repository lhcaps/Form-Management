# CodeGraph Findings — BM-063 DOCX Placeholder Renormalization

**Task:** BM063_DOCX_PLACEHOLDER_RENORMALIZATION_EVIDENCE
**Mode:** EVIDENCE_ONLY
**Date:** 2026-06-28

---

## Query A: Risk Detector — duplicateSemantic Classification

### Code Facts

`scripts/audit/lib/docx-placeholder-risks.mjs` contains `duplicateSemanticRisk` function (called by `buildPlaceholderRisks`).

`scripts/audit/plan-213-bm-remediation-master.cjs` — `primaryLane()` function uses these issue types for lane determination:

- `REMEDIATION_LEAK` → REMEDIATION_LEAK lane
- `RAW_PATTERN_DOMAIN_MISMATCH`, `SOURCE_MISMATCH`, `GENERIC_FIELD_CANONICALIZATION` → PATH_DOMAIN_BINDING lane
- `SHOULD_BE_READONLY`, `REQUIRED_SUSPICIOUS`, `COMPILED_DRIFT` → SOURCE_POLICY lane
- `MANUAL_LEGAL_REVIEW` → LEGAL_REVIEW lane
- `WEAK_EVIDENCE_AUTO_LOCKED` → EVIDENCE_REVIEW lane

### BM-063 Risk Context

BM-063's root-cause issues include:
- `GENERIC_FIELD_CANONICALIZATION` (1 count) — field canonicalization issue
- `BAD_LABEL` (1 count) — bad label
- `REQUIRED_SUSPICIOUS` (1 count) — required policy issue
- `COMPILED_DRIFT` (1 count) — compiled artifact drift

This places BM-063 in **PATH_DOMAIN_BINDING** + **SOURCE_POLICY** lanes (primary is determined by highest-priority issue type).

### Assumption

The `duplicateSemanticRisk` function in `docx-placeholder-risks.mjs` flags placeholders that appear N>1 times in a BM, with suffix index (e.g., `personLine5`, `fullDocumentCode8`). This is a structural signal, not a semantic determination.

---

## Query B: Evidence Script Patterns (BM-052/BM-062)

### Code Facts

BM-052 evidence script (`plan-bm052-docx-placeholder-renormalization.mjs`) and BM-062 evidence script (`plan-bm062-docx-placeholder-renormalization.mjs`) use:

- `PizZip` to extract `word/document.xml` from normalized DOCX
- `asText()` (NOT `async('string')`) for XML content
- Context extraction: 700 chars before/after via text slicing
- Classification via neighborhood text analysis (Vietnamese label detection)
- `occurrenceIndex` for targeting

### BM-063 Relationship

BM-063 should mirror the same extraction pattern. Do NOT copy BM-052/BM-062 semantic conclusions (they used `recipients.personLine6` and `recipients.personLine5` / `decision.decisionLine11`). BM-063 uses `document.fullDocumentCode8` and `recipients.personLine5`.

---

## Query C: RenderBinding/DocxSlot/CanonicalField Flow

### Code Facts

From `form-contract.ts` (API domain types):

```
DocxSlot { slotId, required, reviewRequired, context, label, location }
CanonicalField { path, type, source, uiComponent, section, required, transform }
RenderBinding { slotId, from, transform, fallback }
```

Binding model:
- `docxSlots[].slotId` = actual DOCX placeholder id (e.g., `recipients.personLine5`)
- `renderBindings[].slotId` = same as docxSlots slotId
- `renderBindings[].from` = semantic source field path (canonical path)
- `canonicalFields[].path` = semantic path

For BM-063:
- `document.fullDocumentCode8` has NO slot in locked contract → binding FAIL
- `recipients.personLine5` has 1 slot → 5 DOCX occurrences, 1 slot = 4 undefined literals

### Assumption

`renderBindings[].from` and `canonicalFields[].path` should match when the field is correctly bound. `document.fullDocumentCode8` is unbound — all 8 occurrences render as "undefined".

---

## Query D: Path Conventions

### Code Facts (from `source-remediation-proposal.mjs`)

```
document.fullDocumentCode / document.fullDocumentCode2 → source: manual (HIGH confidence)
decision.decisionLine → source: computed (HIGH confidence)
recipients.personLine → source: manual
signature.signerName → source: officialConfig (from BM-052 apply)
legalBasis.*Line → source: officialConfig
agency.* → source: agencyConfig
```

### Corpus Conventions

- `document.fullDocumentCode` = user's document reference number (manual)
- `document.fullDocumentCode8` = suffix-indexed duplicate (8th occurrence of document code pattern)
- `recipients.personLine` = recipient person name in table
- `recipients.personLine5` = suffix-indexed duplicate (5th person line)
- `signature.signerName` = signer name in footer

### Unknowns

- Is `document.fullDocumentCode8` intentionally a separate field from `document.fullDocumentCode`, or is it a DOCX formatting artifact?
- Is `recipients.personLine5` in BM-063 the same semantic role as `recipients.personLine5` in BM-062? (Same path, different BM — cross-BM evidence is NOT used for approval)

---

## Query E: Board Blocker Preservation

### Systemic Issue

`refresh-213-docx-fidelity-board.mjs` regenerates board from source data and overwrites manual blocker edits. BM-052 and BM-062 rows revert to `NEEDS_REMEDIATION` after every refresh.

### Evidence

Confirmed: after board refresh, BM-052 and BM-062 rows show:
- `primaryLane: CONTRACT_REPAIR`
- `completionStatus: NEEDS_REMEDIATION`
- `nextAction: "Repair same-BM DOCX..."`

### Fix Applied

Post-processing patch script re-applied blocker state. Recommend: add post-processing step to board refresh script that reads `human-review-blocker.latest.json` files and re-applies BLOCKED_BY_HUMAN_DOCX_REVIEW status.

---

## Query F: BM-063 Evidence Pattern

BM-063 should mirror:

1. OOXML extraction via PizZip (same as BM-052/BM-062)
2. Neighborhood text analysis for Vietnamese label detection
3. Per-occurrence classification with explicit confidence
4. Same classification enum (DEFER_*, REVIEW_CANDIDATE_*)

BM-063 should NOT mirror:
- BM-052's `recipients.personLine6` conclusions
- BM-062's `recipients.personLine5` / `decision.decisionLine11` conclusions
- Any semantic approval from cross-BM evidence
