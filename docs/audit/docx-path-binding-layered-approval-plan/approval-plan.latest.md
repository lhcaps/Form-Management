# DOCX Path/Binding Layered Approval Plan

Generated: 2026-06-26T21:51:15.813Z

---


## Executive Summary

| Metric | Value |
| Total destructive remove candidates | 10 |
| Layers | 3 |
| Approved layers | 3 |
| Apply allowed | YES |
| Approval required | NO |
| Recommended first layer | A |

---


**Why layered?**


10 removals across 7 BMs represents meaningful blast radius. Layering:


- Simplifies rollback — one layer at a time


- Makes delta visible — Layer A = 4 removals on one contract


- Reduces cognitive load on approval decision


Layer A (BM-073 only) is the recommended first layer because it has the lowest risk: one contract, same BM family, easiest rollback.


## Layer Table

| Layer | Scope | Contracts | Items | Risk | Status |
| A | BM-073 only | 1 | 4 | LOWEST | APPLIED |
| B | P0 non-BM-073 | 3 | 3 | LOW | APPLIED |
| C | P1 recipients footer suffix | 3 | 3 | MEDIUM | APPLIED |

---


## Layer A — BM-073 only

| Risk | LOWEST |
| Contracts | 1 |
| Items | 4 |
| Template codes | BM-073 |

### Items

| Decision ID | BM | Source ID | Path | Domain Model Note |
| DOCX-REMOVE-001 | BM-073 | e412fccad227 | person.dateOfBirth | No |
| DOCX-REMOVE-002 | BM-073 | e412fccad227 | person.idNumber | No |
| DOCX-REMOVE-006 | BM-073 | e412fccad227 | document.fullDocumentCode | No |
| DOCX-REMOVE-007 | BM-073 | e412fccad227 | document.issueDate | No |

### Individual Approval Commands


```
DOCX-REMOVE-001 command:
APPROVE_LAYER_A_DESTRUCTIVE_REMOVE DOCX-REMOVE-001 BM-073 e412fccad227 person.dateOfBirth
```


```
DOCX-REMOVE-002 command:
APPROVE_LAYER_A_DESTRUCTIVE_REMOVE DOCX-REMOVE-002 BM-073 e412fccad227 person.idNumber
```


```
DOCX-REMOVE-006 command:
APPROVE_LAYER_A_DESTRUCTIVE_REMOVE DOCX-REMOVE-006 BM-073 e412fccad227 document.fullDocumentCode
```


```
DOCX-REMOVE-007 command:
APPROVE_LAYER_A_DESTRUCTIVE_REMOVE DOCX-REMOVE-007 BM-073 e412fccad227 document.issueDate
```


### Bulk Approval Command


```
APPROVE_DESTRUCTIVE_LAYER A BM-073 e412fccad227 DOCX-REMOVE-001 DOCX-REMOVE-002 DOCX-REMOVE-006 DOCX-REMOVE-007
```


---


## Layer B — P0 non-BM-073

| Risk | LOW |
| Contracts | 3 |
| Items | 3 |
| Template codes | BM-080, BM-063, BM-064 |

### Items

| Decision ID | BM | Source ID | Path | Domain Model Note |
| DOCX-REMOVE-003 | BM-080 | a7aa64d4b889 | person.personFullName | YES — see domain model notes |
| DOCX-REMOVE-004 | BM-063 | 54b73110a34f | document.fullDocumentCode8 | YES — see domain model notes |
| DOCX-REMOVE-005 | BM-064 | 4d8cebc3515b | document.issueDate4 | YES — see domain model notes |

### Individual Approval Commands


```
DOCX-REMOVE-003 command:
APPROVE_LAYER_B_DESTRUCTIVE_REMOVE DOCX-REMOVE-003 BM-080 a7aa64d4b889 person.personFullName
```


```
DOCX-REMOVE-004 command:
APPROVE_LAYER_B_DESTRUCTIVE_REMOVE DOCX-REMOVE-004 BM-063 54b73110a34f document.fullDocumentCode8
```


```
DOCX-REMOVE-005 command:
APPROVE_LAYER_B_DESTRUCTIVE_REMOVE DOCX-REMOVE-005 BM-064 4d8cebc3515b document.issueDate4
```


### Bulk Approval Command


```
APPROVE_DESTRUCTIVE_LAYER B BM-080 BM-063 BM-064 a7aa64d4b889 54b73110a34f 4d8cebc3515b DOCX-REMOVE-003 DOCX-REMOVE-004 DOCX-REMOVE-005
```


---


## Layer C — P1 recipients footer suffix

| Risk | MEDIUM |
| Contracts | 3 |
| Items | 3 |
| Template codes | BM-052, BM-062, BM-066 |

### Items

| Decision ID | BM | Source ID | Path | Domain Model Note |
| DOCX-REMOVE-008 | BM-052 | 9919ecdb3971 | recipients.personLine6 | No |
| DOCX-REMOVE-009 | BM-062 | 110961a781fa | recipients.personLine5 | No |
| DOCX-REMOVE-010 | BM-066 | e3bc56081554 | recipients.personLine4 | No |

### Individual Approval Commands


```
DOCX-REMOVE-008 command:
APPROVE_LAYER_C_DESTRUCTIVE_REMOVE DOCX-REMOVE-008 BM-052 9919ecdb3971 recipients.personLine6
```


```
DOCX-REMOVE-009 command:
APPROVE_LAYER_C_DESTRUCTIVE_REMOVE DOCX-REMOVE-009 BM-062 110961a781fa recipients.personLine5
```


```
DOCX-REMOVE-010 command:
APPROVE_LAYER_C_DESTRUCTIVE_REMOVE DOCX-REMOVE-010 BM-066 e3bc56081554 recipients.personLine4
```


### Bulk Approval Command


```
APPROVE_DESTRUCTIVE_LAYER C BM-052 BM-062 BM-066 9919ecdb3971 110961a781fa e3bc56081554 DOCX-REMOVE-008 DOCX-REMOVE-009 DOCX-REMOVE-010
```


---


## Apply Gate


**This plan does NOT approve anything.**


No apply script is created by this task.


Future apply requires ALL of the following:


- Approval command for one complete layer (individual or bulk)


- Generation of layer-specific approved decisions file


- Guarded dry-run with diff review


- Backup of locked contracts before write


- Write apply with explicit commit


- Post-apply audit validation


- Rollback artifact preserved


## Recommended Future Apply Order


- Layer A → audit → verify


- Layer B → audit → verify


- Layer C → audit → verify


Then only consider domain-model additions after all layers are applied.


## Current Audit State

| Metric | Value |
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |
| Approved for apply | 10 |
| Apply allowed | true |
| Approval required | false |

---


## Safety

| Check | Value |
| Locked contracts mutated | 0 |
| DOCX touched | 0 |
| Source/path/binding touched | 0 |
| Compiled artifacts hand-edited | 0 |
| Apply script created | NO |
| Apply write | 0 |

---


_Lane approval plan auto-generated. Do not edit manually._
