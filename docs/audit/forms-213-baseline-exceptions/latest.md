# Forms-213 Baseline Exceptions Ledger

Generated: 2026-06-25T16:54:15.144Z
Gate flags: --allow-remediation --allow-unresolved-review (since 2026-06-25)
Commit: 5edf4be7

## Gate Status

**PASS_WITH_ACKNOWLEDGED_BASELINE_EXCEPTIONS**

This is NOT a zero-exception pass. The gate passes because these
exceptions are documented and acknowledged. Removing the flags
without resolving the items below will make the gate fail again.

| Category | Count |
|---|---|
| Remediation items (DOCX authoring needed) | 8 |
| Unresolved reviewRequired (manual review) | 61 |

## Remediation Items (8) — DOCX authoring needed

| Template | Path/Slot | Reason |
|---|---|---|
| BM-001 | crimeReport.attachedItemsDescription | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: crimeReport.attachedItemsDescription exists in template but not in docxSlots |
| BM-001 | crimeReport.content | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: crimeReport.content exists in template but not in docxSlots |
| BM-002 | sourceTransfer.attachedItemsDescription | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: sourceTransfer.attachedItemsDescription exists in template but not in docxSlots |
| BM-003 | official.issuerTitle | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: official.issuerTitle exists in template but not in docxSlots |
| BM-052 | document.fullDocumentCode | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER + BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode in contract but not in template |
| BM-052 | document.fullDocumentCode2 | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER + BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2 in contract but not in template |
| BM-067 | document.fullDocumentCode2 | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER + BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2 in contract but not in template |
| BM-167 | document.fullDocumentCode2 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: document.fullDocumentCode2 exists in template but not in docxSlots |

## Unresolved reviewRequired Fields (61) — Manual review needed

These fields have `reviewRequired: true` on non-auto-resolved sources.
They exist in locked DOCX but the review flag was never cleared.

| Template | Count | Fields |
|---|---|---|
| BM-062 | 1 | decision.decisionLine |
| BM-063 | 1 | document.issuePlaceAndDateLine |
| BM-065 | 1 | decision.decisionLine |
| BM-066 | 1 | decision.decisionLine |
| BM-068 | 12 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.permanentAddress, person.permanentAddress2, person.occupation, person.idNumber, person.permanentAddress3, person.occupation2, person.idNumber2, person.temporaryAddress, person.province |
| BM-069 | 12 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.idNumber, document.reasonLine, document.reasonLine2, person.personFullName, person.currentAddress, person.currentAddress2, decision.decisionLine, person.occupation, document.summaryLine |
| BM-073 | 4 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.idNumber |
| BM-075 | 4 | document.fullDocumentCode, person.personFullName, person.dateOfBirth, person.currentAddress |
| BM-077 | 1 | document.fullDocumentCode |
| BM-080 | 6 | document.fullDocumentCode, document.issueDate, person.personFullName, person.dateOfBirth, person.currentAddress, legalBasis.legalBasisLine |
| BM-082 | 1 | document.fullDocumentCode |
| BM-162 | 7 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.personFullName, person.currentAddress, person.occupation, person.idNumber |
| BM-163 | 10 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.personFullName, person.currentAddress, person.occupation, person.ward, person.province, person.idNumber, case.caseNumber |

## Policy

- Remediation items require DOCX template editing to add/rename placeholders.
- Unresolved reviewRequired fields require human review to clear the flag.
- Neither category blocks runtime rendering.
- Removing `--allow-remediation` or `--allow-unresolved-review` from `package.json`
  will make `pnpm gate:forms:213` fail until these items are resolved.

## History

- 2026-06-25: Acknowledged baseline exceptions introduced during GATE_FIX (5edf4be7).
