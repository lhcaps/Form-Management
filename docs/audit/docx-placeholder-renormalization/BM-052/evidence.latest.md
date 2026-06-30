# BM-052 DOCX Placeholder Renormalization Evidence

Mode: EVIDENCE_ONLY | Can apply run now: **NO**

## Duplicate Semantic Placeholders

| Placeholder | Count | Severity | Anchors |
| --- | --- | --- | --- |
| decision.decisionLine2 | 2 | HIGH | dateLine, decisionBasis, documentNumber, fullName |
| recipients.personLine6 | 6 | HIGH | fullName, job, idNumber, permanentAddress, temporaryAddress, signature, recipientFooter |

## Occurrence Evidence

| # | Placeholder | Occ | Anchors | Inferred Semantic | Confidence | Needs New | Proposed New | Classification | Change Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | recipients.personLine6 | 0 | fullName, job, idNumber | person.personExtra | LOW | NO | — | DEFER AMBIGUOUS PERSON NAME | NONE |
| 2 | recipients.personLine6 | 1 | fullName, job, idNumber, permanentAddress | person.personExtra | LOW | NO | — | DEFER AMBIGUOUS PERSON NAME | NONE |
| 3 | recipients.personLine6 | 2 | fullName, job, idNumber, permanentAddress, temporaryAddress | person.personExtra | LOW | NO | — | DEFER AMBIGUOUS PERSON NAME | NONE |

## Proposed Occurrence Splits

| Original | Occ | Proposed New | Semantic | Confidence | Change Type |
| --- | --- | --- | --- | --- | --- |

## Collision Checks

| Proposed | Original | Occ | Collisions | Collision-Free |
| --- | --- | --- | --- | --- |

## Classification Counts

| Classification | Count |
| --- | --- |
| DEFER_AMBIGUOUS_PERSON_NAME | 3 |

## Safety Assertions

| Assertion | Value |
| --- | --- |
| noDocxMutation | true |
| noLockedContractMutation | true |
| noCompiledV2Mutation | true |
| noDbPublish | true |
| noApprovedDecisions | true |
| sameBmEvidenceOnly | true |
| codeGraphUsedForCodeOnly | true |

## Planner Decision Needed

For each proposed occurrence split in BM-052, approve or reject the proposed new placeholder id and the change type (DOCX+CONTRACT or CONTRACT_ONLY), based on whether the DOCX renormalization is warranted for that specific occurrence.
