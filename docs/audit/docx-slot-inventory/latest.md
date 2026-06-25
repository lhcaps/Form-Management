# DOCX Slot Inventory — F1 audit

Generated: 2026-06-25T02:53:46.636Z
Overall status: **FAIL** (200/213 BMs PASS)

## Corpus totals

| Metric | Value |
|--------|-------|
| totalContracts | 213 |
| totalTemplatesFound | 213 |
| totalTemplatesMissing | 0 |
| totalDocxSlots | 2453 |
| totalRenderBindings | 2453 |
| totalCanonicalFields | 2453 |
| malformedPlaceholdersCount | 107 |
| passCount | 200 |
| failCount | 13 |

## Malformed placeholders (first 25)

| templateCode | part | kind | offset | preview |
|--------------|------|------|--------|---------|
| BM-031 | word/document.xml | UNCLOSED_OPENING | 1 | ` {{agency.bodyName}` |
| BM-031 | word/document.xml | UNCLOSED_OPENING | 25779 | `28"/></w:rPr><w:t xml:space="preserve"> {{agency.bodyName}</w:t></w:r><w:r><w:rP` |
| BM-051 | word/document.xml | TRIPLE_BRACE | 24 | `{{decision.decisionLine3}}}` |
| BM-051 | word/document.xml | TRIPLE_BRACE | 29321 | `"/></w:rPr><w:t>{{decision.decisionLine3}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-051 | word/document.xml | TRIPLE_BRACE | 29623 | `pace="preserve">{{decision.decisionLine3}}}</w:t></w:r><w:r><w:rPr><w:rFonts w:c` |
| BM-051 | word/document.xml | TRIPLE_BRACE | 35403 | `"/></w:rPr><w:t>{{decision.decisionLine3}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 24 | `{{decision.decisionLine2}}}` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 21323 | `pace="preserve">{{decision.decisionLine2}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 22112 | `"/></w:rPr><w:t>{{decision.decisionLine2}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 24638 | `"/></w:rPr><w:t>{{recipients.personLine6}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 25336 | `"/></w:rPr><w:t>{{recipients.personLine6}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 26034 | `"/></w:rPr><w:t>{{recipients.personLine6}}}</w:t><w:tab/><w:tab/><w:t xml:space=` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 28063 | `pace="preserve">{{recipients.personLine6}}}</w:t><w:tab/><w:tab/></w:r></w:p><w:` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 30853 | `"/></w:rPr><w:t>{{recipients.personLine6}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-052 | word/document.xml | TRIPLE_BRACE | 36482 | `"/></w:rPr><w:t>{{recipients.personLine6}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-059 | word/document.xml | UNOPENED_TAG | 22 | `{recipients.personLine}}` |
| BM-059 | word/document.xml | ORPHAN_CLOSING | 53030 | `22"/></w:rPr><w:t>{recipients.personLine}}</w:t></w:r><w:r><w:rPr><w:rFonts w:hi` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 25 | `{{decision.decisionLine10}}}` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 27500 | `ace="preserve">{{decision.decisionLine10}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 29681 | `/></w:rPr><w:t>{{decision.decisionLine10}}}</w:t></w:r><w:r><w:rPr><w:rFonts w:e` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 30119 | `/></w:rPr><w:t>{{decision.decisionLine10}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 31512 | `/></w:rPr><w:t>{{decision.decisionLine10}}}</w:t><w:tab/><w:tab/></w:r></w:p><w:` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 32070 | `/></w:rPr><w:t>{{decision.decisionLine10}}}</w:t><w:tab/><w:tab/><w:t xml:space=` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 34101 | `ace="preserve">{{decision.decisionLine10}}}</w:t><w:tab/><w:tab/></w:r></w:p><w:` |
| BM-060 | word/document.xml | TRIPLE_BRACE | 35812 | `/></w:rPr><w:t>{{decision.decisionLine10}}}</w:t></w:r></w:p><w:p><w:pPr><w:pSty` |

## Failures (non-PASS BMs)

| templateCode | reason |
|--------------|--------|
| BM-031 | malformed-placeholders(2) |
| BM-051 | malformed-placeholders(4) |
| BM-052 | malformed-placeholders(9) |
| BM-059 | malformed-placeholders(2) |
| BM-060 | malformed-placeholders(11) |
| BM-061 | malformed-placeholders(4) |
| BM-062 | malformed-placeholders(18) |
| BM-063 | malformed-placeholders(15) |
| BM-064 | malformed-placeholders(5) |
| BM-065 | malformed-placeholders(13) |
| BM-066 | malformed-placeholders(10) |
| BM-067 | malformed-placeholders(11) |
| BM-167 | malformed-placeholders(3) |
