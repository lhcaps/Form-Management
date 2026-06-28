# DOCX Path/Binding — Layer B Approved Decisions

Generated: 2026-06-27T04:14:00.000Z

---

## Approval

| Field | Value |
|---|---|
| Task | DOCX_PATH_BINDING_LAYER_B_APPROVED |
| Layer | B |
| Approval command | `APPROVE_DESTRUCTIVE_LAYER B BM-080 BM-063 BM-064 a7aa64d4b889 54b73110a34f 4d8cebc3515b DOCX-REMOVE-003 DOCX-REMOVE-004 DOCX-REMOVE-005` |
| Status | APPROVED_FOR_APPLY |
| Apply allowed | YES |

---

## Target Contracts

| BM | Source ID | Risk | Items |
|---|---|---|---|
| BM-080 | a7aa64d4b889 | LOW | 1 |
| BM-063 | 54b73110a34f | LOW | 1 |
| BM-064 | 4d8cebc3515b | LOW | 1 |

**Total: 3 contracts, 3 items**

---

## Approved Items

### 1. DOCX-REMOVE-003

| Field | Value |
|---|---|
| Decision ID | DOCX-REMOVE-003 |
| Investigation ID | W2R-036 |
| Template | BM-080 |
| Source ID | a7aa64d4b889 |
| Path | `person.personFullName` |
| Confidence | HIGH |
| Source batch | P0 |
| blockId | null |

**Evidence:** `[021] Số thẻ luật sư/thẻ trợ giúp viên pháp lý:\n__PERSON_PERSONFULLNAME__`

**Reason:** `person.personFullName` is directly under "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:" — this is a CARD/LICENSE NUMBER context, not a person name. Confidence HIGH. REMOVE from contract.

**Domain model note:** Tentative path `defender.cardLicenseNumber` is a domain-model proposal only. **NOT implemented by this approval.** A separate DOMAIN_MODEL_REVIEW is required before adding a new field.

---

### 2. DOCX-REMOVE-004

| Field | Value |
|---|---|
| Decision ID | DOCX-REMOVE-004 |
| Investigation ID | PRIOR-DXR-001 |
| Template | BM-063 |
| Source ID | 54b73110a34f |
| Path | `document.fullDocumentCode8` |
| Confidence | HIGH |
| Source batch | P0 |
| blockId | null |

**Preimage note:** BM-063 has BOTH `document.fullDocumentCode` (legitimate, blockId=P0033, label="Số văn bản") AND `document.fullDocumentCode8` (orphan, blockId=null). This approval removes only `document.fullDocumentCode8` — the `_8` suffix path is distinct and the legitimate field is unaffected.

**Evidence:** `[011][013][014][015][016][017][033]` — 7 occurrences in antecedent procedural context.

**Reason:** `document.fullDocumentCode8` is the _8 suffix variant, blockId=null. The legitimate `document.fullDocumentCode` (blockId=P0033) is not touched. REMOVE `document.fullDocumentCode8` only.

**Domain model note:** Tentative path `antecedentDocument.fullDocumentCode` is a domain-model proposal only. **NOT implemented by this approval.** A separate DOMAIN_MODEL_REVIEW is required.

---

### 3. DOCX-REMOVE-005

| Field | Value |
|---|---|
| Decision ID | DOCX-REMOVE-005 |
| Investigation ID | PRIOR-DXR-002 |
| Template | BM-064 |
| Source ID | 4d8cebc3515b |
| Path | `document.issueDate4` |
| Confidence | HIGH |
| Source batch | P0 |
| blockId | null |

**Preimage note:** BM-064 has `document.issueDate4` (orphan, blockId=null) and `document.fullDocumentCode` (legitimate, blockId=P0024). This approval removes only `document.issueDate4` — the `_4` suffix path is distinct and the legitimate field is unaffected.

**Evidence:** `[016][017][020][026]` — 4 occurrences in procedural/antecedent context.

**Reason:** `document.issueDate4` is the _4 suffix variant, blockId=null. Not an issuance date. REMOVE from contract.

**Domain model note:** Tentative path `antecedentDocument.issueDate` is a domain-model proposal only. **NOT implemented by this approval.** A separate DOMAIN_MODEL_REVIEW is required.

---

## Scope Constraints

- Layer B applies ONLY to the 3 contracts listed above.
- Domain-model tentative paths are NOT implemented.
- No new fields added.
- DOCX files: NOT touched.
- Source/path/binding: NOT directly modified.
- Layer A: already applied.
- Layer C: untouched.
