# BM-063 Render Fidelity Gate

Generated: 2026-06-28T17:27:34.689Z
Status: **FAIL**

| Gate | Status |
|---|---|
| Binding fidelity | FAIL |
| Render | PASS |
| Text fidelity | PASS |
| Literal fidelity | FAIL |
| Structure fidelity | PASS |
| Package integrity | PASS |

## Binding Findings

Template placeholders without slots: document.fullDocumentCode8
Template placeholders without bindings: document.fullDocumentCode8

## Text Findings

Unreplaced placeholders: 0
Missing static anchors: 0
Undefined/null literals: 8

## Structure

| Metric | Source | Rendered | Delta |
|---|---:|---:|---:|
| paragraphCount | 72 | 72 | 0 |
| tableCount | 2 | 2 | 0 |
| rowCount | 3 | 3 | 0 |
| cellCount | 8 | 8 | 0 |
| headerCount | 0 | 0 | 0 |
| footerCount | 0 | 0 | 0 |

Next action: Repair template placeholders without bindings before claiming render fidelity.
