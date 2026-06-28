# BM-069 Human Review Blocker

**Template:** BM-069 - BB về việc hủy bỏ biện pháp phong tỏa tài khoản
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW
**Lane:** LEGAL_REVIEW
**Can Apply Now:** NO
**Can Mark Done:** NO

## Render Gate

Render gate is PASS. BM-069 is blocked for contract/DOCX review, not render execution.

## Deferred Issue Groups

| Path | Issue codes | Classification | Evidence note |
|---|---|---|---|
| `decision.decisionLine` | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | DEFER_LEGAL_REVIEW | decision.decisionLine is parked by same-BM path-binding evidence as LEGAL_REVIEW. Do not rename the slot or bind it without legal/form review. |
| `document.fullDocumentCode` | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REQUIRED_SUSPICIOUS, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | DEFER_DOCX_AUTHORING_REVIEW | document.fullDocumentCode still carries DOCX-remediation/generic-field debt. Same-BM prior evidence keeps this deferred; label-only/path-only mutation is not safe. |
| `document.issueDate` | REQUIRED_SUSPICIOUS | DEFER_REQUIRED_POLICY_REVIEW | document.issueDate has REQUIRED_SUSPICIOUS. required=true changes runtime/legal validation behavior and needs explicit human policy review. |
| `document.reasonLine` | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | DEFER_DOCX_AUTHORING_REVIEW | document.reasonLine still carries DOCX-remediation/generic-field debt. Same-BM prior evidence keeps this deferred; label-only/path-only mutation is not safe. |
| `document.reasonLine2` | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | DEFER_DOCX_AUTHORING_REVIEW | document.reasonLine2 still carries DOCX-remediation/generic-field debt. Same-BM prior evidence keeps this deferred; label-only/path-only mutation is not safe. |
| `document.summaryLine` | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | DEFER_DOCX_AUTHORING_REVIEW | document.summaryLine still carries DOCX-remediation/generic-field debt. Same-BM prior evidence keeps this deferred; label-only/path-only mutation is not safe. |
| `person.idNumber` | REQUIRED_SUSPICIOUS | DEFER_REQUIRED_POLICY_REVIEW | person.idNumber has REQUIRED_SUSPICIOUS. required=true changes runtime/legal validation behavior and needs explicit human policy review. |
| `person.occupation` | REQUIRED_SUSPICIOUS | DEFER_REQUIRED_POLICY_REVIEW | person.occupation has REQUIRED_SUSPICIOUS. required=true changes runtime/legal validation behavior and needs explicit human policy review. |

## Required Review

- Resolve the false-header/body-procedural document.fullDocumentCode evidence.
- Review decision/reason/summary body procedural slots against the original DOCX/legal form.
- Approve required/reviewRequired policy before any contract mutation.
- Do not mark BM-069 DONE until human DOCX/legal review closes these blockers.
