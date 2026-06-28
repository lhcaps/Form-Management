# BM-069 Contract Repair Evidence

Mode: EVIDENCE_ONLY
Render gate: PASS
Candidates: 0
Deferred issue groups: 8
Review-required fields: 12
Root-cause issue entries: 24

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
