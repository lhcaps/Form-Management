# Rename Proposals — Wave 02 DOCX Remediation

Generated: 2026-06-26T14:15:00.000Z
Mode: **PLANNING ONLY**

## Classification Summary

| Classification | Count |
|-------------|------:|
| **W2_SAFE_DOCX_RENAME** | 0 |
| **W2_DEFER_NO_CONTEXT** | 56 |
| **W2_DEFER_LEGAL_CONTEXT** | 1 |
| W2_DEFER_DOCUMENT_LINE | 0 |
| W2_DO_NOT_FIX | 0 |
| **Total** | **57** |

## Safe Rename Proposals

**NONE.** Zero items meet the safety criteria for automatic DOCX rename.

### Why Zero Safe Proposals?

The classification criteria require static Vietnamese text evidence (label text before the
placeholder) OR table cell label OR section heading + slot order across multiple BMs.

**None of the 57 items have static Vietnamese text naming the field.**

The only item with adjacent Vietnamese text is:

| BM | Path | Text | Why Not Safe |
|----|------|------|-------------|
| BM-163 | person.currentAddress | "Nơi ở hiện nay: {{person.currentAddress}}" | The path already uses the correct semantic name. The bad label is in the **contract**, not the DOCX. DOCX editing would not fix the contract label. This is a labels-only problem. |

All other 56 items have:
- Only font/style XML in `textBefore` (e.g. `<w:rFonts w:ascii="Times New Roman"/> {{...}}`)
- OR a generic `{{document.fieldN}}` placeholder with no label text at all
- OR a footnote superscript marker (e.g. `5 {{person.dateOfBirth}}`) which is NOT a field label

## Deferred Items

All 57 items are deferred to the next task.

### Deferral Reason Breakdown

| Reason | Count | Items |
|--------|------:|-------|
| No static text in DOCX | 56 | All BM-068, BM-069, BM-073, BM-075, BM-077, BM-080, BM-082, BM-162, BM-163 items |
| Labels-only problem (DOCX correct, contract wrong) | 1 | BM-163 / person.currentAddress |
| Path/placeholder mismatch requiring original DOCX review | ~15 | Multiple items where `{{document.fieldN}}` maps to semantically different paths |

### Items Requiring Original DOCX Review (High Priority for Manual Lane)

These items have a `{{document.fieldN}}` placeholder that maps to a semantically different
path. The original `.doc` file must be inspected to understand what the field really is:

- BM-068: person.dateOfBirth → `{{document.field3}}`
- BM-069: person.dateOfBirth → `{{document.field3}}`
- BM-069: person.idNumber → `{{document.field5}}`
- BM-069: document.reasonLine → `{{document.field6}}`
- BM-069: decision.decisionLine → `{{document.field8}}`
- BM-069: person.occupation → `{{document.field10}}`
- BM-069: document.summaryLine → `{{document.field12}}`
- BM-073: person.dateOfBirth → `{{document.field3}}`
- BM-073: person.idNumber → `{{document.field5}}`
- BM-162: person.dateOfBirth → `{{document.field3}}`
- BM-163: person.dateOfBirth → `{{document.field3}}`

## Next Task

Since **zero safe automatic DOCX rename candidates exist**, the next task must be:

**DOCX_WAVE_02_MANUAL_AUTHORING_REVIEW**

This task would:
1. Open the ORIGINAL `.doc` source files for each BM
2. Inspect the surrounding static text around each placeholder
3. Determine the correct field name
4. Either update the normalized DOCX and re-extract, or manually set the contract label
