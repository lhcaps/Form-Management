# BM-052 Contract Repair Patch Plan

Mode: PROPOSED_ONLY_NOT_APPROVED

Can apply run now: NO

## Proposed Actions

| Action | Target | Approved | Reason |
| --- | --- | --- | --- |
| REVIEW_RENORMALIZE_DUPLICATE_DOCX_PLACEHOLDER | recipients.personLine6 | false | The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove. |
| REVIEW_ORPHAN_CONTRACT_SLOT | document.fullDocumentCode | false | Contract slot has no matching same-BM normalized DOCX placeholder. |
| REVIEW_ORPHAN_CONTRACT_SLOT | document.fullDocumentCode2 | false | Contract slot has no matching same-BM normalized DOCX placeholder. |
| REVIEW_BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | document.fullDocumentCode | false | Render binding targets a slot that is not present as a same-BM DOCX placeholder. |
| REVIEW_BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | document.fullDocumentCode2 | false | Render binding targets a slot that is not present as a same-BM DOCX placeholder. |

## Planner Decision Needed

Evidence is prepared only. A human/planner must approve exact structural mutations per BM before any apply runner is created.
