# DOCX Placeholder Renormalization Plan

Mode: DOCX_PLACEHOLDER_RENORMALIZATION_INVENTORY

## Summary

| Metric | Value |
| --- | --- |
| Rows | 213 |
| Rows with duplicate semantic risks | 19 |
| Duplicate semantic risk count | 24 |

## Safety

| Assertion | Value |
| --- | --- |
| inventoryOnly | true |
| noDocxMutation | true |
| noContractMutation | true |
| noCompiledMutation | true |
| occurrenceLevelReviewRequired | true |

## Top Rows

| BM | Risks | Placeholders |
| --- | --- | --- |
| BM-062 | 2 | decision.decisionLine11, recipients.personLine5 |
| BM-063 | 2 | document.fullDocumentCode8, recipients.personLine5 |
| BM-065 | 2 | document.fullDocumentCode8, recipients.personLine3 |
| BM-066 | 2 | document.fullDocumentCode4, recipients.personLine4 |
| BM-067 | 2 | document.fullDocumentCode6, recipients.personLine3 |
| BM-051 | 1 | decision.decisionLine3 |
| BM-052 | 1 | recipients.personLine6 |
| BM-060 | 1 | decision.decisionLine10 |
| BM-061 | 1 | recipients.personLine3 |
| BM-167 | 1 | document.fullDocumentCode2 |
| BM-186 | 1 | recipients.personLine15 |
| BM-187 | 1 | recipients.personLine13 |
| BM-188 | 1 | recipients.personLine15 |
| BM-189 | 1 | recipients.personLine15 |
| BM-190 | 1 | recipients.personLine15 |
| BM-192 | 1 | recipients.personLine13 |
| BM-193 | 1 | recipients.personLine13 |
| BM-203 | 1 | recipients.personLine15 |
| BM-211 | 1 | recipients.personLine16 |

## Risk Details

| BM | Placeholder | Count | Anchors |
| --- | --- | --- | --- |
| BM-051 | decision.decisionLine3 | 3 | dateLine, fullName, recipientFooter, signature |
| BM-052 | recipients.personLine6 | 3 | fullName, idNumber, job, permanentAddress, temporaryAddress |
| BM-060 | decision.decisionLine10 | 10 | alias, dateLine, decisionBasis, documentNumber, idNumber, job, permanentAddress |
| BM-061 | recipients.personLine3 | 3 | alias, currentAddress, dateLine, fullName, idNumber, job, permanentAddress, temporaryAddress |
| BM-062 | decision.decisionLine11 | 11 | asset, assignment, currentAddress, decisionBasis, fullName, idNumber, job, permanentAddress, prosecutor, temporaryAddress |
| BM-062 | recipients.personLine5 | 4 | asset, fullName, idNumber, job |
| BM-063 | document.fullDocumentCode8 | 8 | asset, committee, dateLine, documentNumber, fullName, prosecutor |
| BM-063 | recipients.personLine5 | 5 | alias, asset, currentAddress, dateLine, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress |
| BM-065 | document.fullDocumentCode8 | 8 | asset, committee, dateLine, documentNumber, prosecutor |
| BM-065 | recipients.personLine3 | 3 | alias, asset, currentAddress, dateLine, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress |
| BM-066 | document.fullDocumentCode4 | 4 | alias, currentAddress, decisionBasis, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress |
| BM-066 | recipients.personLine4 | 4 | alias, currentAddress, fullName, idNumber, job, permanentAddress, signature, temporaryAddress |
| BM-067 | document.fullDocumentCode6 | 6 | dateLine, documentNumber, fullName, prosecutor |
| BM-067 | recipients.personLine3 | 3 | alias, currentAddress, dateLine, documentNumber, fullName, idNumber, job, permanentAddress, temporaryAddress |
| BM-167 | document.fullDocumentCode2 | 2 | dateLine, documentNumber, fullName, prosecutor, recipientFooter, signature |
| BM-186 | recipients.personLine15 | 2 | fullName, recipientFooter, signature |
| BM-187 | recipients.personLine13 | 2 | fullName, recipientFooter, signature |
| BM-188 | recipients.personLine15 | 2 | asset, fullName, recipientFooter, signature |
| BM-189 | recipients.personLine15 | 2 | fullName, recipientFooter, signature |
| BM-190 | recipients.personLine15 | 2 | fullName, recipientFooter, signature |
| BM-192 | recipients.personLine13 | 2 | fullName, signature |
| BM-193 | recipients.personLine13 | 2 | fullName, recipientFooter, signature |
| BM-203 | recipients.personLine15 | 4 |  |
| BM-211 | recipients.personLine16 | 4 |  |

## Next Step

For each risk, split the repeated numbered placeholder into occurrence-level semantic placeholders in the normalized DOCX, then update the locked contract fields, slots, and bindings to match that semantic map.
