# BM-001 Blocker Remediation Evidence

## Scope

This report records technical remediation of the five blockers in the
conditional BM-001 review dated 2026-06-20. It is not a replacement for the
required human Microsoft Word approval.

Implementation commits:

- `2362341` — deterministic BM-001 OOXML remediation and format gates;
- `43b5949` — unobstructed BM-001 web print layout and browser regression;
- `01bb519` — reconcile all 11 reviewed post-lock bindings into the BM-001
  taxonomy, DOCX slots, and canonical fields.

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

Smoke timestamp prefix: `2026-06-19T23-53-22` UTC, generated after the
post-lock contract reconciliation commit.

| Scenario | Output directory | Rendered DOCX SHA-256 |
|---|---|---|
| Basic valid | `01-basic-valid-2026-06-19T23-53-22-390Z` | `BDAF5FEBC4835FABAB923293896DCFF2DD8F5C6492EB6BDCB5F9A837D3FCC6EE` |
| Long source report | `02-long-source-report-2026-06-19T23-53-22-405Z` | `8E16202119352B14D6A6873C1F9E6BE63E492638646F6E59D079C74F8649C119` |
| Organization informant | `03-organization-informant-2026-06-19T23-53-22-420Z` | `27953214C57087019DD3237D3D62FE5F71435EEE6643D64D0946EBE99FB2318B` |
| Missing optional fields | `04-missing-optional-fields-2026-06-19T23-53-22-431Z` | `07E228FEB7CABADAE876B0A566DA3F7D0352D75B31E2E0ACA0DC845AD9BDEC7E` |
| Vietnamese diacritics and addresses | `05-vietnamese-diacritics-and-addresses-2026-06-19T23-53-22-444Z` | `5A05F7C6752A3EB89E47D89CAB3B15514C1C0FEA752399CEEF6CE56AE5C85F39` |

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
