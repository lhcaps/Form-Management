# BM-066 Render Fidelity Gate

Generated: 2026-06-28T17:27:35.543Z
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

Template placeholders without slots: recipients.personLine4
Template placeholders without bindings: recipients.personLine4

## Text Findings

Unreplaced placeholders: 0
Missing static anchors: 0
Undefined/null literals: 4

## Structure

| Metric | Source | Rendered | Delta |
|---|---:|---:|---:|
| paragraphCount | 96 | 96 | 0 |
| tableCount | 2 | 2 | 0 |
| rowCount | 2 | 2 | 0 |
| cellCount | 4 | 4 | 0 |
| headerCount | 0 | 0 | 0 |
| footerCount | 0 | 0 | 0 |

Next action: Repair template placeholders without bindings before claiming render fidelity.
