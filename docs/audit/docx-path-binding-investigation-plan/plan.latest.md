# DOCX Path/Binding Investigation Plan

Generated: 2026-06-26T19:31:35.473Z

---

## Executive Summary

**Current audit state:**
| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**Why label-only remediation must pause for these patterns:**

Two independent lanes (Wave 02 + Prior DOCX Remediation Generic Slot) have demonstrated the same systemic root cause: **slot placement in DOCX XML does not match the semantic path name.** Label-only remediation cannot distinguish between:
1. A slot that genuinely belongs to a document metadata field but has a wrong label
2. A slot that is placed in body/procedural/signature/footer context with a misleading path name

Approving labels on items in category (2) would misrepresent the field to users and corrupt data entry semantics.

**Investigation registry total: 40 suspect items**

| By Priority | Count |
|-------------|-------|
| P0 (highest) | 5 |
| P1 | 16 |
| P2 | 19 |

| By Root Cause Hypothesis | Count |
|--------------------------|-------|
| PERSON_FIELD_PATH_MISMATCH | 4 |
| FALSE_HEADER_SLOT | 9 |
| BODY_PROCEDURAL_REFERENCE | 7 |
| RECIPIENT_FILLER_NO_CONTEXT | 8 |
| LEGAL_DECISION_PARKED | 7 |
| MULTI_COLUMN_LAYOUT_AMBIGUITY | 5 |

| By Recommended Action | Count |
|------------------------|-------|
| DOCX_REAUTHOR_INVESTIGATE | 8 |
| PATH_BINDING_INVESTIGATE  | 6 |
| LEGAL_REVIEW              | 7 |
| LAYOUT_AWARE_EXTRACTION   | 5 |
| KEEP_DEFERRED             | 14 |

**Recommended priority order:** P0 → P1 → P2 (P2 items need P0/P1 resolved first for BM overlap)

---

## Evidence from Closed Lanes

### Wave 02 Closure Findings

Wave 02 reviewed 56 items. Key systemic patterns identified:

**False-header / body slot (document metadata path but body/procedural placement):**
- BM-069 W2R-013: biên bản body slot, no header slot
- BM-075 W2R-029: slot in "Xét thấy ĐỀ NGHỊ" procedural line, header has no slot
- BM-077 W2R-033: slot in Nơi nhận footer, not document header
- BM-082 W2R-040: slot in procedural body "đối với __DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát"
- BM-073 W2R-025: slot in "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__" body title

**document.issueDate body reasoning-clause:**
- BM-073 W2R-026: slot in "Xét thấy__DOCUMENT_ISSUEDATE__" body reasoning clause

**Person field path mismatch (semantic wrong path):**
- BM-080 W2R-036: person.personFullName appears under "Số thẻ luật sư" — card number context
- BM-073 W2R-027: person.dateOfBirth = phân công/cơ quan reference (footnote 5)
- BM-073 W2R-028: person.idNumber = footnote reference marker

**Person fields in footnote/procedural slots:**
- BM-080 W2R-037: person.dateOfBirth in Xét thấy footnote marker sentence
- BM-080 W2R-038: person.currentAddress in thông báo sentence

**Multi-column layout ambiguity:**
- BM-162 W2R-043: person.dateOfBirth — noisy multi-column table extraction
- BM-163 W2R-050: person.dateOfBirth — noisy multi-column table extraction

**Legal/procedural fields parked:**
- W2R-022: decision.decisionLine — Lệnh/Quyết định phong tỏa context
- W2R-039: legalBasis.legalBasisLine — Nơi nhận block
- W2R-056: case.caseNumber — legal field

### Prior DOCX Remediation Generic Slot Closure Findings

Reviewed 16 items. Key patterns:

**DOCX_REAUTHOR_REQUIRED (5 items):** BM-063, BM-065 document.fullDocumentCode8; BM-064 document.issueDate4; BM-066, BM-067 document.fullDocumentCode4/6 — all appear in body/procedural/signature context, legitimate canonical document metadata already exists.

**DEFER_NO_CONTEXT (7 items):** BM-052/061/062/063/065/066/067 recipients.personLine3/4/5/6 — generic blank filler slots, footer Nơi nhận suffix, no visible Vietnamese label.

**LEGAL_REVIEW (4 items):** BM-051/052/060/062 decision.decisionLine* — parked, do not approve without legal reviewer.

---

## Root Cause Taxonomy

### FALSE_HEADER_SLOT
Slot path looks like document metadata (e.g., document.fullDocumentCode) but the DOCX slot is not in the header — it is in the body, procedural text, or footer. The legitimate canonical field already exists in the same contract with a correct label. Fixing the label would misrepresent the slot's actual purpose.

### BODY_PROCEDURAL_REFERENCE
Slot appears in procedural/decision body text (Xét thấy, Yêu cầu, Căn cứ, thông báo). The slot references an antecedent document or provides a grammatical continuation of a legal sentence. Not a document metadata field.

### RECIPIENT_FILLER_NO_CONTEXT
Slot is a blank body filler or Nơi nhận footer suffix. Multiple instances per contract without semantic distinction. No visible Vietnamese label. Cannot approve any UI label safely.

### PERSON_FIELD_PATH_MISMATCH
Slot path (e.g., `person.dateOfBirth`, `person.personFullName`) does not match the rendered DOCX content (e.g., phân công/cơ quan reference, card number, footnote marker). The path was set incorrectly during prior DOCX remediation. Remapping or removing the slot is the only safe fix.

### SEMANTICALLY_WRONG_PATH
Similar to PERSON_FIELD_PATH_MISMATCH but for any field. The path name is semantically wrong for the rendered slot context. Requires path remapping or DOCX slot removal.

### LEGAL_DECISION_PARKED
decision.* / legalBasis.* fields. Parked for explicit legal reviewer. Do not approve without legal sign-off.

### MULTI_COLUMN_LAYOUT_AMBIGUITY
Multi-column table layout makes paragraph extraction noisy. Slot position ambiguous. Needs layout-aware XML extraction (table-aware) to determine correct context.

---

## Investigation Registry

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk | Priority |
|----|----|------|----------------|-----------|-------------|------|----------|
| W2R-027 | BM-073 | person.dateOfBirth | DOCX_REAUTHOR_REQUIRED | PERSON_FIELD_PATH_MISMATCH | DOCX_REAUTHOR_INVESTIGATE | HIGH | P0 |
| W2R-028 | BM-073 | person.idNumber | DOCX_REAUTHOR_REQUIRED | PERSON_FIELD_PATH_MISMATCH | DOCX_REAUTHOR_INVESTIGATE | HIGH | P0 |
| W2R-036 | BM-080 | person.personFullName | DEFER | PERSON_FIELD_PATH_MISMATCH | DOCX_REAUTHOR_INVESTIGATE | HIGH | P0 |
| PRIOR-DXR-001 | BM-063 | document.fullDocumentCode8 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH | P0 |
| PRIOR-DXR-002 | BM-064 | document.issueDate4 | DOCX_REAUTHOR_REQUIRED | BODY_PROCEDURAL_REFERENCE | DOCX_REAUTHOR_INVESTIGATE | HIGH | P0 |
| W2R-013 | BM-069 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM | P1 |
| W2R-029 | BM-075 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM | P1 |
| W2R-033 | BM-077 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM | P1 |
| W2R-040 | BM-082 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM | P1 |
| W2R-025 | BM-073 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | HIGH | P1 |
| W2R-026 | BM-073 | document.issueDate | DEFER | BODY_PROCEDURAL_REFERENCE | PATH_BINDING_INVESTIGATE | HIGH | P1 |
| PRIOR-DXR-003 | BM-065 | document.fullDocumentCode8 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH | P1 |
| PRIOR-DXR-004 | BM-066 | document.fullDocumentCode4 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH | P1 |
| PRIOR-DXR-005 | BM-067 | document.fullDocumentCode6 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH | P1 |
| PRIOR-DXR-006 | BM-063 | recipients.personLine5 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P1 |
| PRIOR-DXR-007 | BM-065 | recipients.personLine3 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P1 |
| PRIOR-DXR-008 | BM-052 | recipients.personLine6 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P1 |
| PRIOR-DXR-009 | BM-061 | recipients.personLine3 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P1 |
| PRIOR-DXR-010 | BM-062 | recipients.personLine5 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P1 |
| PRIOR-DXR-011 | BM-066 | recipients.personLine4 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P1 |
| PRIOR-DXR-012 | BM-067 | recipients.personLine3 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P1 |
| W2R-039 | BM-080 | legalBasis.legalBasisLine | LEGAL_REVIEW | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH | P2 |
| W2R-022 | BM-069 | decision.decisionLine | LEGAL_REVIEW | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH | P2 |
| W2R-056 | BM-163 | case.caseNumber | DEFER | LEGAL_DECISION_PARKED | LEGAL_REVIEW | MEDIUM | P2 |
| PRIOR-DXR-013 | BM-051 | decision.decisionLine3 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH | P2 |
| PRIOR-DXR-014 | BM-052 | decision.decisionLine2 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH | P2 |
| PRIOR-DXR-015 | BM-060 | decision.decisionLine10 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH | P2 |
| PRIOR-DXR-016 | BM-062 | decision.decisionLine11 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH | P2 |
| W2R-043 | BM-162 | person.dateOfBirth | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | MEDIUM | P2 |
| W2R-050 | BM-163 | person.dateOfBirth | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | MEDIUM | P2 |
| W2R-052 | BM-163 | person.occupation | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | LOW | P2 |
| W2R-053 | BM-163 | person.ward | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | LOW | P2 |
| W2R-054 | BM-163 | person.province | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | LOW | P2 |
| W2R-017 | BM-069 | document.reasonLine | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM | P2 |
| W2R-018 | BM-069 | document.reasonLine2 | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM | P2 |
| W2R-024 | BM-069 | document.summaryLine | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM | P2 |
| W2R-031 | BM-075 | person.dateOfBirth | DEFER | PERSON_FIELD_PATH_MISMATCH | KEEP_DEFERRED | MEDIUM | P2 |
| W2R-032 | BM-075 | person.currentAddress | DEFER | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM | P2 |
| W2R-037 | BM-080 | person.dateOfBirth | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM | P2 |
| W2R-038 | BM-080 | person.currentAddress | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM | P2 |

---

## P0 Candidates

**Rationale:** These items are strong evidence of wrong path or wrong DOCX placement. Fixing labels would be dangerous and could corrupt data semantics.

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
| W2R-027 | BM-073 | person.dateOfBirth | DOCX_REAUTHOR_REQUIRED | PERSON_FIELD_PATH_MISMATCH | DOCX_REAUTHOR_INVESTIGATE | HIGH |
| W2R-028 | BM-073 | person.idNumber | DOCX_REAUTHOR_REQUIRED | PERSON_FIELD_PATH_MISMATCH | DOCX_REAUTHOR_INVESTIGATE | HIGH |
| W2R-036 | BM-080 | person.personFullName | DEFER | PERSON_FIELD_PATH_MISMATCH | DOCX_REAUTHOR_INVESTIGATE | HIGH |
| PRIOR-DXR-001 | BM-063 | document.fullDocumentCode8 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH |
| PRIOR-DXR-002 | BM-064 | document.issueDate4 | DOCX_REAUTHOR_REQUIRED | BODY_PROCEDURAL_REFERENCE | DOCX_REAUTHOR_INVESTIGATE | HIGH |

---

## P1 Candidates

### False-header document metadata slots

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
| W2R-013 | BM-069 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM |
| W2R-029 | BM-075 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM |
| W2R-033 | BM-077 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM |
| W2R-040 | BM-082 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | MEDIUM |
| W2R-025 | BM-073 | document.fullDocumentCode | DEFER | FALSE_HEADER_SLOT | PATH_BINDING_INVESTIGATE | HIGH |
| W2R-026 | BM-073 | document.issueDate | DEFER | BODY_PROCEDURAL_REFERENCE | PATH_BINDING_INVESTIGATE | HIGH |
| PRIOR-DXR-003 | BM-065 | document.fullDocumentCode8 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH |
| PRIOR-DXR-004 | BM-066 | document.fullDocumentCode4 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH |
| PRIOR-DXR-005 | BM-067 | document.fullDocumentCode6 | DOCX_REAUTHOR_REQUIRED | FALSE_HEADER_SLOT | DOCX_REAUTHOR_INVESTIGATE | HIGH |

### Recipients filler no-context slots

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
| PRIOR-DXR-006 | BM-063 | recipients.personLine5 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |
| PRIOR-DXR-007 | BM-065 | recipients.personLine3 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |
| PRIOR-DXR-008 | BM-052 | recipients.personLine6 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |
| PRIOR-DXR-009 | BM-061 | recipients.personLine3 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |
| PRIOR-DXR-010 | BM-062 | recipients.personLine5 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |
| PRIOR-DXR-011 | BM-066 | recipients.personLine4 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |
| PRIOR-DXR-012 | BM-067 | recipients.personLine3 | DEFER_NO_CONTEXT | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |

---

## P2 Candidates

### Legal/decision parked

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
| W2R-039 | BM-080 | legalBasis.legalBasisLine | LEGAL_REVIEW | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH |
| W2R-022 | BM-069 | decision.decisionLine | LEGAL_REVIEW | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH |
| W2R-056 | BM-163 | case.caseNumber | DEFER | LEGAL_DECISION_PARKED | LEGAL_REVIEW | MEDIUM |
| PRIOR-DXR-013 | BM-051 | decision.decisionLine3 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH |
| PRIOR-DXR-014 | BM-052 | decision.decisionLine2 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH |
| PRIOR-DXR-015 | BM-060 | decision.decisionLine10 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH |
| PRIOR-DXR-016 | BM-062 | decision.decisionLine11 | LEGAL_REVIEW_REQUIRED | LEGAL_DECISION_PARKED | LEGAL_REVIEW | HIGH |

### Multi-column layout ambiguity

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
| W2R-043 | BM-162 | person.dateOfBirth | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | MEDIUM |
| W2R-050 | BM-163 | person.dateOfBirth | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | MEDIUM |
| W2R-052 | BM-163 | person.occupation | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | LOW |
| W2R-053 | BM-163 | person.ward | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | LOW |
| W2R-054 | BM-163 | person.province | DEFER | MULTI_COLUMN_LAYOUT_AMBIGUITY | LAYOUT_AWARE_EXTRACTION | LOW |

### Body procedural miscellaneous

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
| W2R-017 | BM-069 | document.reasonLine | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM |
| W2R-018 | BM-069 | document.reasonLine2 | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM |
| W2R-024 | BM-069 | document.summaryLine | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM |
| W2R-031 | BM-075 | person.dateOfBirth | DEFER | PERSON_FIELD_PATH_MISMATCH | KEEP_DEFERRED | MEDIUM |
| W2R-032 | BM-075 | person.currentAddress | DEFER | RECIPIENT_FILLER_NO_CONTEXT | KEEP_DEFERRED | MEDIUM |
| W2R-037 | BM-080 | person.dateOfBirth | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM |
| W2R-038 | BM-080 | person.currentAddress | DEFER | BODY_PROCEDURAL_REFERENCE | KEEP_DEFERRED | MEDIUM |

---

## Recommended Next Task

**DOCX_PATH_BINDING_P0_INVESTIGATION_BATCH_1**

Scope (5 P0 items):
- W2R-027: BM-073 person.dateOfBirth (phân công/cơ quan reference)
- W2R-028: BM-073 person.idNumber (footnote reference)
- W2R-036: BM-080 person.personFullName (Số thẻ context)
- PRIOR-DXR-001: BM-063 document.fullDocumentCode8 (body procedural)
- PRIOR-DXR-002: BM-064 document.issueDate4 (procedural text filler)

**This task is read-only / investigation-only.** No DOCX mutation. No contract mutation. No apply.

Investigation questions per item:
1. Is the wrong path in the DOCX XML binding (slot placed in wrong position), or in the path field itself?
2. Does the DOCX slot need to be removed, remapped to a new path, or is it redundant with an existing legitimate slot?
3. Should the slot be removed entirely, or is there a legitimate semantic role it should fulfill?

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Apply write triggered: **0**

---

_Lane closure auto-generated. Do not edit manually._
