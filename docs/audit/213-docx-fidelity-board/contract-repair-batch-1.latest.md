# Contract Repair Batch 1

Mode: EVIDENCE_SELECTION_ONLY

This batch selects structural contract-repair candidates only. It does not approve or apply mutations.

## Safety

| Assertion | Value |
| --- | --- |
| noContractMutation | true |
| noCompiledMutation | true |
| noDbPublish | true |
| noApprovedDecisions | true |
| sameBmEvidenceRequired | true |

## Items

| BM | Risk | Issues | Findings | Evidence target |
| --- | --- | --- | --- | --- |
| BM-065 | HIGH | 4 | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER, REVIEW_REQUIRED_REMAINS | docs/audit/per-form-render-accurate/BM-065/evidence.latest.json |
| BM-067 | HIGH | 3 | CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER, BINDING_WITHOUT_TEMPLATE_PLACEHOLDER, REVIEW_REQUIRED_REMAINS | docs/audit/per-form-render-accurate/BM-067/evidence.latest.json |
| BM-064 | HIGH | 2 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT, REVIEW_REQUIRED_REMAINS | docs/audit/per-form-render-accurate/BM-064/evidence.latest.json |
| BM-080 | HIGH | 2 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT, REVIEW_REQUIRED_REMAINS | docs/audit/per-form-render-accurate/BM-080/evidence.latest.json |
| BM-001 | HIGH | 0 | TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | docs/audit/per-form-render-accurate/BM-001/evidence.latest.json |

## Required Evidence Per BM

### BM-065

- same-BM normalized DOCX placeholder inventory
- locked contract docxSlots/canonicalFields/renderBindings comparison
- proposed patch plan with no approved decisions
- render-diff after any approved structural repair

Evidence JSON: `docs/audit/per-form-render-accurate/BM-065/evidence.latest.json`
Patch plan JSON: `docs/audit/per-form-render-accurate/BM-065/patch-plan.latest.json`

### BM-067

- same-BM normalized DOCX placeholder inventory
- locked contract docxSlots/canonicalFields/renderBindings comparison
- proposed patch plan with no approved decisions
- render-diff after any approved structural repair

Evidence JSON: `docs/audit/per-form-render-accurate/BM-067/evidence.latest.json`
Patch plan JSON: `docs/audit/per-form-render-accurate/BM-067/patch-plan.latest.json`

### BM-064

- same-BM normalized DOCX placeholder inventory
- locked contract docxSlots/canonicalFields/renderBindings comparison
- proposed patch plan with no approved decisions
- render-diff after any approved structural repair

Evidence JSON: `docs/audit/per-form-render-accurate/BM-064/evidence.latest.json`
Patch plan JSON: `docs/audit/per-form-render-accurate/BM-064/patch-plan.latest.json`

### BM-080

- same-BM normalized DOCX placeholder inventory
- locked contract docxSlots/canonicalFields/renderBindings comparison
- proposed patch plan with no approved decisions
- render-diff after any approved structural repair

Evidence JSON: `docs/audit/per-form-render-accurate/BM-080/evidence.latest.json`
Patch plan JSON: `docs/audit/per-form-render-accurate/BM-080/patch-plan.latest.json`

### BM-001

- same-BM normalized DOCX placeholder inventory
- locked contract docxSlots/canonicalFields/renderBindings comparison
- proposed patch plan with no approved decisions
- render-diff after any approved structural repair

Evidence JSON: `docs/audit/per-form-render-accurate/BM-001/evidence.latest.json`
Patch plan JSON: `docs/audit/per-form-render-accurate/BM-001/patch-plan.latest.json`
