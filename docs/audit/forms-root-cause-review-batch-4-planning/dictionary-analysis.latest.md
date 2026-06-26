# Batch 4 Dictionary Analysis

Generated: 2026-06-26T11:09:51.938Z
Mode: **PLANNING ONLY**

## Summary

| Metric | Value |
|--------|------:|

| Dictionary keys evaluated | 32 |
| Keys matched in audit | 0 |
| Keys not matched | 32 |

## Why No Dictionary Matches

The Batch 4 dictionary evaluated 32 keys but matched 0 BAD_LABEL items.

**Root cause:** The remaining BAD_LABEL pool is dominated by:

1. **O trong** (340 items, 86 BMs): DOCX slot placeholder text rendered as field label.
   - The label IS the raw Vietnamese for "blank" — not a camelCase key.
   - Dictionary was keyed on camelCase (e.g. `fullName`, `name`) — these are already fixed by Batch 3.
   - O trong comes from DOCX rendering of empty or unnamed slots.

2. **Slot from Wave 02 DOCX remediation** (57 items, 9 BMs): Structural leftover labels.
   - Not camelCase — a descriptive string indicating incomplete DOCX remediation.

3. **Slot from DOCX remediation** (16 items, 10 BMs): Generic slot placeholder.

4. **Individual camelCase** (19 items): `archiveLine`, `issuePlaceAndDateLine`, etc.
   - Each appears 1-3 times — too fragmented for dictionary clustering.

## Conclusion

The Batch 3 approach (deterministic label dictionary for person/address/contact labels) has been exhausted.
The remaining BAD_LABEL are not metadata typos — they are structural artifacts of DOCX slot naming.

**Next wave of label fixes requires upstream DOCX authoring work.**
