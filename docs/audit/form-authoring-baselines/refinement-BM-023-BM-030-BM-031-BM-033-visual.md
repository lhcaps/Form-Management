# Microsoft Word Visual QA — BM-023, BM-030, BM-031, BM-033

- Renderer: Microsoft Word desktop `16.x`, `ExportAsFixedFormat` to PDF.
- Raster inspection: Poppler `pdftoppm`, 144 DPI.
- Inspection scope: every rendered page at full-page view.
- Result: **PASS**
- Lifecycle: visual QA does not grant semantic/legal approval; all four contracts remain draft and review-required.

| BM | Pages | Word export | Clipping / overlap | Header and title | Body and recipients | Result |
|---|---:|---|---|---|---|---|
| BM-023 | 1 | PASS | None observed | Aligned and readable | Complete; signature and recipients remain on page | PASS |
| BM-030 | 1 | PASS | None observed | Aligned and readable | Complete; notification body, signature and recipients remain on page | PASS |
| BM-031 | 1 | PASS | None observed | Header remediated to use uppercase `agency.name`; body retains `agency.bodyName` | Complete; no isolated agency suffix or broken title wrapping | PASS |
| BM-033 | 1 | PASS | None observed | Aligned and readable | Complete; decision body, signature and recipients remain on page | PASS |

## Structural checks paired with the visual review

- All sample placeholders resolved.
- No literal `undefined` or `null`.
- Every non-empty sample value appears in `word/document.xml`.
- No package part is missing.
- Preserved OOXML parts remain byte-identical to the normalized DOCX.
- Each output opens in Microsoft Word and exports to a non-empty one-page PDF.

## Visual remediation applied

BM-031 originally reused `agency.bodyName` in both the uppercase header and the issuing-authority sentence. The header therefore rendered in body case and wrapped the suffix `7` onto a separate line. The normalized DOCX now uses:

- `agency.name` for the uppercase header;
- `agency.bodyName` for `Viện trưởng {{agency.bodyName}}`.

The remediated output was exported and inspected again after the placeholder split.
