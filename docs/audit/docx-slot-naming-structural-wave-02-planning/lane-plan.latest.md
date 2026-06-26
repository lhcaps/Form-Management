# Lane Remediation Plan — DOCX Slot Naming / Structural Wave 02

Generated: 2026-06-26T13:57:59.721Z
Mode: **PLANNING ONLY**

## Lane Summary

| Lane | Count | Fixability | Risk | Recommended Action |
|------|------:|------------|------|-------------------|
| A_O_TRONG_SLOT | 340 | DOCX_AUTHORING_ONLY | high | DOCX authoring — add placeholder text to slots |
| B_WAVE_02_GENERIC_SLOT | 57 | DOCX_AUTHORING_ONLY | high | DOCX Wave 02 remediation — rename slots |
| C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT | 16 | DOCX_AUTHORING_ONLY | high | DOCX authoring — rename slots |
| D_DOCUMENT_LINE_METADATA | 11 | DOCX_AUTHORING_OR_METADATA | medium | Per-BM review — DOCX or metadata fix |
| E_LEGAL_OR_PROCEDURAL_AMBIGUOUS | 0 | LEGAL_REVIEW | high | Legal review — defer |
| F_TRUE_SAFE_STRUCTURAL_RENAME | 0 | METADATA_OR_DOCX | low | Metadata or DOCX — low risk |
| G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW | 8 | ORIGINAL_DOCX_REVIEW | medium | Original DOCX review required |
| H_DO_NOT_FIX_NOISE_OR_DERIVED | 0 | DO_NOT_FIX | low | No action — noise |

## Fix-First Priority

**No safe metadata-only fixes identified.** The primary lanes are:

- **Lane A (340 items)**: O trong — requires DOCX authoring to add placeholder text.
- **Lane B (57 items)**: Wave 02 structural — requires DOCX Wave 02 remediation.
- **Lane C (16 items)**: Prior remediation — requires DOCX authoring.

Total DOCX authoring required: **413 items**

## No Label-Only Batch Apply Available

Unlike Batch 3 (which targeted person/address/contact labels with clear Vietnamese equivalents),
the remaining BAD_LABEL issues are structural DOCX artifacts that cannot be fixed by
changing the label field in the locked contract JSON alone.

The label value (O trong, Slot from Wave 02, etc.) is the metadata representation
of the DOCX slot content. Fixing it requires modifying the source DOCX to add
meaningful placeholder text, which then gets re-extracted with the correct label.

## Next Recommended Task

**DOCX_WAVE_02_PLACEHOLDER_FIX_PLANNING**

Analyze the 9 Wave 02 contracts that have "Slot from Wave 02 DOCX remediation" labels.
Determine if a safe DOCX structural fix can be made to rename those slots.

## Safety

| Check | Result |
|-------|--------|
| Locked contracts mutated | **false** |
| DOCX touched | **false** |
| Compiled artifacts hand-edited | **false** |
