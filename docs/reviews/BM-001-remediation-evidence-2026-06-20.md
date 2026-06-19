# BM-001 Blocker Remediation Evidence

## Scope

This report records technical remediation of the five blockers in the
conditional BM-001 review dated 2026-06-20. It is not a replacement for the
required human Microsoft Word approval.

Implementation commits:

- `2362341` — deterministic BM-001 OOXML remediation and format gates;
- `43b5949` — unobstructed BM-001 web print layout and browser regression;
- `01bb519` — reconcile all 11 reviewed post-lock bindings into the BM-001
  taxonomy, DOCX slots, and canonical fields;
- `4ede2b0` — scope the BM-001 receiver-color audit so another form containing
  `Tôi:` is not treated as BM-001.

Normalized template SHA-256, identical in both tracked locations:

`E2D1A2C60BE3A25DC688DCBB54F53C1F1E93ED0267EBC5A81A809D9A0855FB77`

## Required-Fix Evidence

| Review blocker | Technical resolution | Evidence |
|---|---|---|
| Red `Tôi:` receiver line | The BM-001 normalizer now scopes an OOXML color remediation to the receiver identity paragraph and makes every visible run explicitly black. | Remediator unit/real-template/CLI tests pass; `FMT-018` passes in 5/5 fresh scenarios; Word normal view and Print Preview show black text. |
| Missing source instructions | Product policy explicitly preserves all seven instructions in the canonical blank source and intentionally omits them from completed documents. | [BM-001 rendering policy](../product/BM-001-rendering-policy.md). |
| Faint top-right form note | The remediator gives every visible run in the `Mẫu số 01/HS` textbox explicit black color while retaining 8pt typography. | `FMT-019` passes in 5/5 fresh scenarios; Word Print Preview on a white page shows the note legibly. |
| Sticky save panel overlaps print output | The panel is marked with `data-bm001-save-panel` and hidden with `print:hidden`; its sticky screen behavior is retained. | Focused Chromium Playwright print-media test passes. |
| `Giới tính` / `Tên gọi khác` labels unclear | Both controls have stable BM-001 field markers and remain visible when print media is emulated. | Focused Chromium Playwright test asserts both controls remain visible while the save panel is hidden. |

## Automated Verification

Focused verification completed successfully:

- Node contract/readiness suite: 22/22 tests passed.
- API renderer/auditor suite: 3 suites, 46/46 tests passed.
- Chromium BM-001 print regression: 1/1 passed.
- Both normalized template copies have identical SHA-256 hashes.
- Locked-contract verification: 3 contracts, 48 checks passed, 0 failed,
  0 warnings.
- BM-001 contract cardinality: 39 DOCX slots, 39 canonical fields, 39 render
  bindings, with no duplicate identifiers.

Fresh five-scenario shadow smoke:

- semantic: 1 pass, 4 warning, 0 fail;
- missing expected text: 0;
- unresolved placeholders: 0;
- unexpected `undefined` / `null` literals: 0;
- package-integrity failures: 0;
- `FMT-018`: 5/5 pass;
- `FMT-019`: 5/5 pass.

The four semantic warnings are length-difference heuristics with no specific
missing value. Existing `FMT-011` and `FMT-015` warnings remain non-blocking and
were previously reviewed visually; this remediation introduced no format
failure.

## Fresh Artifacts

Smoke timestamp prefix: `2026-06-19T23-56-15` UTC, generated after the
post-lock contract reconciliation and final audit-scope hardening commits.

| Scenario | Output directory | Rendered DOCX SHA-256 |
|---|---|---|
| Basic valid | `01-basic-valid-2026-06-19T23-56-15-544Z` | `CE7888678BE3043785E3B9DA2B62527C5B6F73F6B5D44E842EC970EEC592574F` |
| Long source report | `02-long-source-report-2026-06-19T23-56-15-558Z` | `F1278C12BE9E6360123E06A2D84B006D171FF62ED39C2392E270FECB57E946D2` |
| Organization informant | `03-organization-informant-2026-06-19T23-56-15-572Z` | `E46AFBBE9C77FC59A5661DB526213F5C6886634730A720A6C1EC54F62CCB6E48` |
| Missing optional fields | `04-missing-optional-fields-2026-06-19T23-56-15-583Z` | `ABD658F47631CAFB0608317F8A4476B7273982ED64DA6ACE54E32BF50B6F7EE6` |
| Vietnamese diacritics and addresses | `05-vietnamese-diacritics-and-addresses-2026-06-19T23-56-15-594Z` | `E126ADD8769AF0B556E9BB86131D62452CD30BBB44A97D11F90DD4CD6284FEB6` |

## Microsoft Word Technical Inspection

Representative basic, long-content, missing-optional, and Vietnamese-diacritic
artifacts opened without a repair warning.

Observed in normal view and, for representative basic/long cases, Print
Preview:

- the `Tôi:` receiver line is black;
- the top-right form note is black and legible on a white page;
- Vietnamese diacritics remain intact;
- natural blank optional fields remain clean;
- pagination and signature areas remain stable at two pages;
- long report content flows without clipping.

This is agent-assisted technical inspection, not the named product owner's
human approval.

The final smoke was regenerated after contract reconciliation. That amendment
adds the already-reviewed slot and field metadata but does not change the
template or the 11 render bindings, so the inspected presentation path remains
the same.

## Cutover Status

Technical remediation: **complete**.

Human active approval: **pending**.

The existing conditional human-review report remains unchanged. The hard gate
must continue to return exit code `2` until a new human review explicitly
approves these remediated artifacts. `DOCUMENT_RENDERER_MODE=active` remains
disabled.
