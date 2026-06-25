# DOCX Slot Inventory — F1 audit

Generated: 2026-06-25T14:53:39.326Z
Overall status: **FAIL** (212/213 BMs PASS)

## Corpus totals

| Metric | Value |
|--------|-------|
| totalContracts | 213 |
| totalTemplatesFound | 213 |
| totalTemplatesMissing | 0 |
| totalDocxSlots | 2453 |
| totalRenderBindings | 2453 |
| totalCanonicalFields | 2453 |
| malformedPlaceholdersCount | 4 |
| passCount | 212 |
| failCount | 1 |

## Malformed placeholders (first 25)

| templateCode | part | kind | offset | preview |
|--------------|------|------|--------|---------|
| BM-001 | word/document.xml | TRIPLE_BRACE | 19 | `{{receiver.fullName}}}}}` |
| BM-001 | word/document.xml | UNOPENED_TAG | 21 | `{{receiver.fullName}}}}}` |
| BM-001 | word/document.xml | TRIPLE_BRACE | 19932 | `l="28"/></w:rPr><w:t>{{receiver.fullName}}}}}</w:t></w:r><w:r><w:rPr><w:rFonts w` |
| BM-001 | word/document.xml | ORPHAN_CLOSING | 19934 | `"28"/></w:rPr><w:t>{{receiver.fullName}}}}}</w:t></w:r><w:r><w:rPr><w:rFonts w:a` |

## Failures (non-PASS BMs)

| templateCode | reason |
|--------------|--------|
| BM-001 | malformed-placeholders(4) |
