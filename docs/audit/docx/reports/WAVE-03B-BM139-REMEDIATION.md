# Wave 03B BM-139 Remediation

## Scope
BM-139 only.

## Baseline (2026-06-23T00:32:00Z)

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation | 62 |
| Warning | 58 |
| Gate | PASS |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |

## Placeholder Analysis

| Old Placeholder | Occurrences | DOCX Context | Semantic Meaning | Proposed Path | Decision |
|---|---|---|---|---|---|
| `{{agency.dongDia}}` | 1 | "...nhận được Kiến nghị. **{{agency.dongDia}}** 2.2. Trả lời bằng văn bản cho Viện kiểm sát 2…" | Asks recipient agency for their locality (district/province) when responding | `recipients.localityName` | **Rename** |
| `{{document.chuThe}}` | 1 | "6 {{document.chuThe}} ( Ký, ghi rõ họ tên, đóng dấu )" | Signatory full name in closing block | `person.personFullName` | **Rename** |
| `{{document.ngayBan}}` | 1 | "**{{agency.diaDanh}}** 1.3… **{{document.ngayBan}}** 2. Để bảo đảm…" | Issuance date of the recommendation document | `document.issueDate` | **Rename** |

## Decision Rationale

- **`agency.dongDia` → `recipients.localityName`**: In the body text of a Kiến nghị (recommendation), the recipient agency ("Viện kiểm sát 2") is asked to respond in writing. The phrase asks about the locality of the recipient — `recipients.*` is the correct namespace. `localityName` maps to district/province level.
- **`document.chuThe` → `person.personFullName`**: The signatory field "( Ký, ghi rõ họ tên, đóng dấu )" requires the full name of the signing person. `person.personFullName` is the established canonical path for person names.
- **`document.ngayBan` → `document.issueDate`**: Section 1.3 (reasoning) precedes section 2 (instructions). The placeholder sits between sections as the document date. `document.issueDate` is the established canonical path for issuance dates.

## Changes

| Old Placeholder | New Placeholder | Evidence | DB Version |
|---|---|---|---|
| `{{agency.dongDia}}` | `{{recipients.localityName}}` | Body text requesting recipient locality | v2 |
| `{{document.chuThe}}` | `{{person.personFullName}}` | Signatory block with "Ký, ghi rõ họ tên" | v2 |
| `{{document.ngayBan}}` | `{{document.issueDate}}` | Document issuance date between sections 1.3 and 2 | v2 |

## After

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation | 61 |
| Warning | 58 |
| Gate | PASS |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |

## DB Publish

- Created: 1 (BM-139, version 2)
- Skipped: 212
- Failed: 0
- Scope key: GLOBAL
- Source resolution: GLOBAL_PUBLISHED

## Helper Created

- `scripts/docx-contract/lib/generic-path.mjs` — shared module exporting `GENERIC_PATH_RE`, `isGenericPath()`, `assertNotGenericPath()`. Prevents future scripts from accidentally proposing generic paths that would trigger blocking.

## Warnings

- New warnings: 0
- Resolved warnings: 0
- Accepted warnings: 0 (no new warnings introduced)

## Remaining Work

| Remaining metric | Count | Forms |
|---|---|---|
| Remediation | 61 | BM-021, BM-031, BM-036, BM-044 (CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER); BM-051–067, BM-073, BM-075, BM-077, BM-080, BM-082, BM-162–163 (semantic CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER after Wave 01/02); BM-184–BM-212 (`{{document.field}}`, `{{recipients.field}}`, `{{decision.field}}`) |
| Warning | 58 | REVIEW_REQUIRED_REMAINS on Wave 01/02 semantic fields |

## Recommended Next Wave

- **Wave 03C**: BM-184–BM-212 — `{{document.field}}`, `{{recipients.field}}`, `{{decision.field}}` patterns. 29 forms remaining.
