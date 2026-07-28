# Top-Right Promulgation Block — XML Measurement Experiment

- Snapshot: 2026-07-09T21:02:43.815Z
- Script: `scripts/audit/measure-top-right-promulgation-block.mjs`
- Triggers: "Mẫu số", "Ban hành theo Thông tư", "TT-VKSTC", "Mẫu số "
- Source normalized: `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx`
- Generated DOCX candidates (first hit wins):
  - `D:/Study/Project/QLLaw-main/.tmp-docx-download-smoke`
  - `D:/Study/Project/QLLaw-main/.tmp-batch3-docx-download-smoke`
  - `D:/Study/Project/QLLaw-main/.tmp-batch4-docx-download-smoke`

## Summary

| Code | Status | Aggregate verdict | Block count (src/gen) | Reason |
|---|---|---|---|---|
| BM-006 | OK | EXACT_MATCH | 6 / 6 |  |

## Per-block detail

### BM-006

- Source: `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-006/BM-006_normalized.docx`
- Generated: `D:/Study/Project/QLLaw-main/.tmp-docx-download-smoke/BM-006.docx`
- Source PDF: `D:/Study/Project/QLLaw-main/.tmp-visual-pdf-fidelity/BM-006/BM-006_normalized.pdf`
- Generated PDF: `D:/Study/Project/QLLaw-main/.tmp-visual-pdf-fidelity/BM-006/BM-006.pdf`
- Aggregate verdict: **EXACT_MATCH**

| # | Verdict | Text src | Text gen | pPrEqual | Run props diff (first run) |
|---|---|---|---|---|---|
| 0 | EXACT_MATCH | Mẫu số 06/HS | Mẫu số 06/HS | true | ALL_EQUAL |
| 1 | EXACT_MATCH | (Ban hành theo Thông tư  số 03/2026/TT-V | (Ban hành theo Thông tư  số 03/2026/TT-V | true | ALL_EQUAL |
| 2 | EXACT_MATCH | Ngày 09/02/2026) | Ngày 09/02/2026) | true | ALL_EQUAL |
| 3 | EXACT_MATCH | Mẫu số 06/HS | Mẫu số 06/HS | true | ALL_EQUAL |
| 4 | EXACT_MATCH | (Ban hành theo Thông tư  số 03/2026/TT-V | (Ban hành theo Thông tư  số 03/2026/TT-V | true | ALL_EQUAL |
| 5 | EXACT_MATCH | Ngày 09/02/2026) | Ngày 09/02/2026) | true | ALL_EQUAL |

## Notes

- Source DOCX is the normalized baseline at `storage/templates/normalized-docx/<code>/<code>_normalized.docx`.
- Generated DOCX is the latest authenticated DOCX download smoke artifact at `.tmp-docx-download-smoke/<code>.docx`.
- Both paragraphs are extracted as `<w:p>...</w:p>` blocks from `word/document.xml`.
- Run-property comparison inspects `<w:rFonts/>`, `<w:sz/>`, `<w:szCs/>`, `<w:b/>`, `<w:bCs/>`, `<w:i/>`, `<w:iCs/>`, `<w:color/>`.
- Text-box geometry (cx/cy/posOffset/wrapSquare) is captured when the paragraph contains `<w:drawing>`.
- No source/normalized/locked/compiled DOCX or contract is mutated.
- FIDELITY_COMPLETE_EVIDENCED remains `false`.