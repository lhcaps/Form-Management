# Residual Remediation Analysis (Wave 04E-3)

Generated: 2026-06-23T12:20:35.352Z
Source: remaining-remediation-inventory.json + wave-04e-decisions.json

## Classification Summary

### METADATA_ONLY_APPROVED (8)

| BM | Field | Issue | Reviewer Decision | Safe Now | Next Action |
|---|---|---|---|---|---|
| BM-031 | `agency.bodyName` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY_ALIAS | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |
| BM-031 | `agency.bodyName` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY_ALIAS | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |
| BM-036 | `document.issueDate` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |
| BM-036 | `document.issueDate` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |
| BM-052 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY_ALIAS | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |
| BM-052 | `document.fullDocumentCode` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY_ALIAS | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |
| BM-065 | `decision.decisionLine` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY_DO_NOT_RENDER | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |
| BM-065 | `decision.decisionLine` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | METADATA_ONLY_DO_NOT_RENDER | NO | No action needed. Item is approved as metadata-only. The remediation check will remain until the alias mechanism is implemented or the slot is removed with explicit approval. |

### ALIAS_PENDING_IMPLEMENTATION (6)

| BM | Field | Issue | Reviewer Decision | Safe Now | Next Action |
|---|---|---|---|---|---|
| BM-063 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | ALIAS_CANONICALIZE | NO | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-063 | `document.fullDocumentCode` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | ALIAS_CANONICALIZE | NO | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-065 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | ALIAS_CANONICALIZE | NO | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-065 | `document.fullDocumentCode` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | ALIAS_CANONICALIZE | NO | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-067 | `document.fullDocumentCode` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | ALIAS_CANONICALIZE | NO | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-067 | `document.fullDocumentCode` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | ALIAS_CANONICALIZE | NO | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |

### REMOVE_PENDING_EXPLICIT_APPROVAL (4)

| BM | Field | Issue | Reviewer Decision | Safe Now | Next Action |
|---|---|---|---|---|---|
| BM-052 | `document.fullDocumentCode2` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | REMOVE_OR_METADATA_ONLY | NO | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |
| BM-052 | `document.fullDocumentCode2` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | REMOVE_OR_METADATA_ONLY | NO | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |
| BM-067 | `document.fullDocumentCode2` | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | REMOVE_OR_REPEAT_CANONICAL | NO | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |
| BM-067 | `document.fullDocumentCode2` | BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | REMOVE_OR_REPEAT_CANONICAL | NO | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |

### AUDIT_CLASSIFICATION_ACCEPTED (16)

| BM | Field | Issue | Reviewer Decision | Safe Now | Next Action |
|---|---|---|---|---|---|
| BM-001 | `crimeReport.attachedItemsDescription` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `crimeReport.content` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.endedAtDay` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.endedAtMonth` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.endedAtTimeText` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.endedAtYear` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.locationName` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.startedAtDay` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.startedAtMonth` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.startedAtTimeText` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-001 | `reception.startedAtYear` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-002 | `sourceTransfer.attachedItemsDescription` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-003 | `official.issuerTitle` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-003 | `sourceAssignment.article1Line` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-003 | `sourceAssignment.article2Line` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |
| BM-003 | `sourceAssignment.article3Line` | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | — | NO | Do not touch. Accept as-is unless policy changes or a future form-author review explicitly requires rendering. |

## Governance Backlog

| BM | Field | Classification | Required Action |
|---|---|---|---|
| BM-052 | `document.fullDocumentCode2` | REMOVE_PENDING_EXPLICIT_APPROVAL | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |
| BM-052 | `document.fullDocumentCode2` | REMOVE_PENDING_EXPLICIT_APPROVAL | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |
| BM-063 | `document.fullDocumentCode` | ALIAS_PENDING_IMPLEMENTATION | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-063 | `document.fullDocumentCode` | ALIAS_PENDING_IMPLEMENTATION | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-065 | `document.fullDocumentCode` | ALIAS_PENDING_IMPLEMENTATION | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-065 | `document.fullDocumentCode` | ALIAS_PENDING_IMPLEMENTATION | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-067 | `document.fullDocumentCode` | ALIAS_PENDING_IMPLEMENTATION | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-067 | `document.fullDocumentCode2` | REMOVE_PENDING_EXPLICIT_APPROVAL | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |
| BM-067 | `document.fullDocumentCode` | ALIAS_PENDING_IMPLEMENTATION | Requires alias mechanism implementation. Owner: backend contract system. Until implemented, the canonical slot stays unmapped and the remediation check remains. |
| BM-067 | `document.fullDocumentCode2` | REMOVE_PENDING_EXPLICIT_APPROVAL | Requires explicit destructive approval from reviewer or legal. Do not remove slot/binding without APPROVE_REMOVE decision. If the same value is already rendered by another field, prefer aliasing over removal. |

## Notes

- BM-001/BM-002/BM-003: 16 items classified as `AUDIT_CLASSIFICATION_ACCEPTED` — accepted no-action set per Wave 04E reviewer decision.
- METADATA_ONLY_APPROVED items: reviewer approved; no DOCX change needed. Remediation check remains because alias mechanism is not implemented.
- ALIAS_PENDING items: cannot apply without alias mechanism. Owner: backend contract system.
- REMOVE_PENDING items: destructive removal not approved. Requires explicit APPROVE_REMOVE decision.
- SAFE_TO_APPLY_NOW: 0 items — all decisions from Wave 04E-2 were already applied.
