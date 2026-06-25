# DOCX Repeat/Table/List Block Fidelity — F5 audit
Generated: 2026-06-25T10:47:49.238Z

| Metric | Value |
|--------|-------|
| totalContracts | 213 |
| noRepeatCandidatesCount | 213 |
| reviewRequiredCount | 0 |
| failCount | 0 |
| totalRepeatCandidates | 161 |
| confirmedRepeatCandidates | 0 |
| scalarCandidates | 161 |

## Scalar candidates (known-list sections, not repeat)

| templateCode | key | slotTypes | reason |
|-------------|-----|----------|--------|
| BM-001 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-002 | recipients | text | all 2 slot(s) are scalar (text). Not repeat/table/list. |
| BM-003 | recipients | text | all 2 slot(s) are scalar (text). Not repeat/table/list. |
| BM-005 | recipients | text | all 2 slot(s) are scalar (text). Not repeat/table/list. |
| BM-006 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-007 | recipients | text | all 2 slot(s) are scalar (text). Not repeat/table/list. |
| BM-008 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-009 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-010 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-011 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-012 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-014 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-015 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-016 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-017 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-018 | recipients | text | all 2 slot(s) are scalar (text). Not repeat/table/list. |
| BM-019 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-020 | recipients | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-021 | legalBasis | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-023 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-028 | legalBasis | text | all 1 slot(s) are scalar (text). Not repeat/table/list. |
| BM-030 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-031 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-033 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-036 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-037 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-038 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-039 | recipients | text | all 4 slot(s) are scalar (text). Not repeat/table/list. |
| BM-040 | recipients | text | all 3 slot(s) are scalar (text). Not repeat/table/list. |
| BM-042 | recipients | text | all 5 slot(s) are scalar (text). Not repeat/table/list. |
| ... | (85 more contracts) | | |

## Detection dimensions

| Dimension | Count |
|-----------|-------|
| docxSlot.slotType=repeat/table/list | 0 |
| renderBinding.renderType=TABLE/LIST/REPEAT | 0 |
| canonicalField arrays | 0 |
| DOCX {# loop syntax | 0 |
| DOCX <w:tbl> elements | 0 |
| Known list section keys | 161 |

## Conclusion

**213/213 contracts have NO_REPEAT_CANDIDATES.** 0 confirmed repeat/table/list, 161 scalar (known-list section keys with text/date slots only).

No contracts in the 213-form corpus have repeat/table/list bindings. Known list section keys (recipients, legalBasis) contain scalar text fields (e.g., `recipients.archiveLine`, `legalBasis.procedureArticlesLine`). The renderer does not need array-repeat support for any form.

