# Remaining Remediation Inventory (Wave 04A)

Generated: 2026-06-23T13:33:05.065Z

## Summary

| Issue Type | Count |
|---|---|
| TEMPLATE_PLACEHOLDER_WITHOUT_SLOT | 16 |
| CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER | 3 |
| BINDING_WITHOUT_TEMPLATE_PLACEHOLDER | 3 |
| Other | 0 |
| **Total** | **22** |

## Risk Breakdown

| Risk | Count |
|---|---|
| Low | 6 |
| Medium | 16 |
| High | 0 |

## TEMPLATE_PLACEHOLDER_WITHOUT_SLOT

### BM-001

- `crimeReport.attachedItemsDescription` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: crimeReport.attachedItemsDescription
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: crimeReport.attachedItemsDescription

- `crimeReport.content` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: crimeReport.content
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: crimeReport.content

- `reception.endedAtDay` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.endedAtDay
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.endedAtDay

- `reception.endedAtMonth` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.endedAtMonth
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.endedAtMonth

- `reception.endedAtTimeText` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.endedAtTimeText
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.endedAtTimeText

- `reception.endedAtYear` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.endedAtYear
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.endedAtYear

- `reception.locationName` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.locationName
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.locationName

- `reception.startedAtDay` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.startedAtDay
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.startedAtDay

- `reception.startedAtMonth` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.startedAtMonth
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.startedAtMonth

- `reception.startedAtTimeText` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.startedAtTimeText
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.startedAtTimeText

- `reception.startedAtYear` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: reception.startedAtYear
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: reception.startedAtYear

### BM-002

- `sourceTransfer.attachedItemsDescription` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: sourceTransfer.attachedItemsDescription
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: sourceTransfer.attachedItemsDescription

### BM-003

- `official.issuerTitle` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: official.issuerTitle
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: official.issuerTitle

- `sourceAssignment.article1Line` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: sourceAssignment.article1Line
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: sourceAssignment.article1Line

- `sourceAssignment.article2Line` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: sourceAssignment.article2Line
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: sourceAssignment.article2Line

- `sourceAssignment.article3Line` — MEDIUM risk · `add-placeholder`
  - Reason: DOCX template needs add-placeholder: sourceAssignment.article3Line
  - Evidence: TEMPLATE_PLACEHOLDER_WITHOUT_SLOT: sourceAssignment.article3Line

## CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER

### BM-052

- `document.fullDocumentCode` — LOW risk · `rename-placeholder`
  - Reason: DOCX template needs rename-placeholder: document.fullDocumentCode
  - Evidence: CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode

- `document.fullDocumentCode2` — LOW risk · `rename-placeholder`
  - Reason: DOCX template needs rename-placeholder: document.fullDocumentCode2
  - Evidence: CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2

### BM-067

- `document.fullDocumentCode2` — LOW risk · `rename-placeholder`
  - Reason: DOCX template needs rename-placeholder: document.fullDocumentCode2
  - Evidence: CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2

## BINDING_WITHOUT_TEMPLATE_PLACEHOLDER

### BM-052

- `document.fullDocumentCode` — LOW risk · `rename-placeholder`
  - Reason: DOCX template needs rename-placeholder: document.fullDocumentCode
  - Evidence: BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode

- `document.fullDocumentCode2` — LOW risk · `rename-placeholder`
  - Reason: DOCX template needs rename-placeholder: document.fullDocumentCode2
  - Evidence: BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2

### BM-067

- `document.fullDocumentCode2` — LOW risk · `rename-placeholder`
  - Reason: DOCX template needs rename-placeholder: document.fullDocumentCode2
  - Evidence: BINDING_WITHOUT_TEMPLATE_PLACEHOLDER: document.fullDocumentCode2

## Recommended Wave 04B (lowest risk first)

### BM-052
  - `document.fullDocumentCode` — low risk · `rename-placeholder` (`CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`)
  - `document.fullDocumentCode2` — low risk · `rename-placeholder` (`CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`)
  - `document.fullDocumentCode` — low risk · `rename-placeholder` (`BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`)
  - `document.fullDocumentCode2` — low risk · `rename-placeholder` (`BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`)
### BM-067
  - `document.fullDocumentCode2` — low risk · `rename-placeholder` (`CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`)
  - `document.fullDocumentCode2` — low risk · `rename-placeholder` (`BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`)
### BM-001
  - `crimeReport.attachedItemsDescription` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `crimeReport.content` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.endedAtDay` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.endedAtMonth` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.endedAtTimeText` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.endedAtYear` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.locationName` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.startedAtDay` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.startedAtMonth` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.startedAtTimeText` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `reception.startedAtYear` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
### BM-002
  - `sourceTransfer.attachedItemsDescription` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
### BM-003
  - `official.issuerTitle` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `sourceAssignment.article1Line` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `sourceAssignment.article2Line` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)
  - `sourceAssignment.article3Line` — medium risk · `add-placeholder` (`TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`)