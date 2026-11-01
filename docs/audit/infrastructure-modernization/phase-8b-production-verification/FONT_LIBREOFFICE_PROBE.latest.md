# Phase 8B - LibreOffice and font probe

## Verdict

`METRIC_COMPATIBLE_FALLBACK`; production fidelity remains `PARTIAL`.

## Measured result

| Item | Result |
| --- | --- |
| LibreOffice | `7.4.7.2 40(Build:2)` |
| Requested family | `Times New Roman` |
| Exact family installed | no (`fc-list` returned no Times New Roman entry) |
| `fc-match` resolution | `Liberation Serif` |
| Resolved regular file | `/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf` |
| Resolved style set | regular, bold, italic, bold-italic |

## Conversion proof

A BM-001 DOCX was converted inside the actual Phase 8B API image:

- LibreOffice exit: `0`.
- Duration: `716 ms`.
- PDF produced: yes.
- PDF size: `73,099` bytes.
- Page count: not measured because `pdfinfo` is not installed in the runtime image.
- Temporary conversion output and container: removed.

Two preliminary probe attempts failed only in the host PowerShell quoting layer; their exact ephemeral containers were removed. They are not conversion results.

The fallback proves the conversion path is operable, but it does not prove legal-layout parity with Times New Roman. No proprietary font was downloaded or copied, and `fidelityComplete=true` remains `0`.
