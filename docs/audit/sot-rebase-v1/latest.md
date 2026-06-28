# SOT_REBASE_V1 — Source of Truth Rebase Audit

**Generated:** 2026-06-28T18:14:10.219Z

## SOT Policy

- **normalized DOCX** = structural/placeholder SOT
- **locked contract JSON** = current semantic working SOT (semantic-suspect until audit passes)
- **compiled-v2** = derived artifact, NOT SOT
- **DB compiled_json** = runtime published copy, NOT SOT

## Summary

| Metric | Value |
|--------|-------|
| Total BMs | 213 |
| Total issues | 4500 |
| CRITICAL | 3 |
| HIGH | 2734 |
| MEDIUM | 1763 |

## Specific Issue Counts

| Issue | Count | Severity |
|-------|-------|----------|
| Ô trống auto-approved | 674 | HIGH |
| rawPattern mismatch | 1025 | HIGH/MEDIUM |
| formInputHints stale | 1130 | HIGH |
| compiled-v2 stale vs locked | 3 | CRITICAL |
| generic path leakage | 0 | HIGH |
| auto-generated auto-approved | 1668 | MEDIUM |

## By Classification

| Classification | BMs |
|----------------|-----|
| LOCKED_CONTRACT_EVIDENCE_INCONSISTENT | 203 |
| LOCKED_CONTRACT_STRUCTURALLY_MATCHED | 8 |
| COMPILED_V2_STALE_VS_LOCKED | 2 |

## Top 30 Riskiest BMs

| Rank | BM | Score | Issues | Classification |
|------|----|-------|--------|----------------|
| 1 | BM-096 | 266 | 100 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 2 | BM-136 | 239 | 91 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 3 | BM-155 | 225 | 85 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 4 | BM-117 | 167 | 65 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 5 | BM-118 | 167 | 65 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 6 | BM-106 | 158 | 60 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 7 | BM-126 | 158 | 60 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 8 | BM-152 | 132 | 50 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 9 | BM-134 | 127 | 49 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 10 | BM-135 | 127 | 49 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 11 | BM-161 | 110 | 42 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 12 | BM-087 | 109 | 41 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 13 | BM-127 | 109 | 41 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 14 | BM-129 | 109 | 41 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 15 | BM-130 | 109 | 41 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 16 | BM-138 | 109 | 41 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 17 | BM-048 | 107 | 41 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 18 | BM-114 | 93 | 35 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 19 | BM-115 | 93 | 35 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 20 | BM-128 | 93 | 35 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 21 | BM-131 | 93 | 35 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 22 | BM-137 | 93 | 35 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 23 | BM-149 | 93 | 35 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 24 | BM-154 | 86 | 34 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 25 | BM-013 | 83 | 33 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 26 | BM-028 | 83 | 41 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 27 | BM-133 | 83 | 31 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 28 | BM-212 | 80 | 28 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 29 | BM-102 | 77 | 29 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 30 | BM-113 | 77 | 29 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |

## CRITICAL: compiled-v2 Stale vs Locked

⚠️ **BM-063/BM-066 style stale bindings detected: 3**

Render Atlas PASS and DB sync PASS prove runtime fidelity only — they do NOT validate semantic correctness.

| BM | binding | targetSlotId | reason |
|---|--------|-------------|--------|
| binding-5 | document.fullDocumentCode8 | compiled binding "binding-5" targets slot "document.fullDocumentCode8" NOT in lo |
| binding-6 | recipients.personLine4 | compiled binding "binding-6" targets slot "recipients.personLine4" NOT in locked |
| binding-6 | recipients.personLine4 | compiled binding "binding-6" sources from "recipients.personLine4" NOT in locked |

## HIGH: Ô trống Auto-Approved

674 docxSlots/canonicalFields with label "Ô trống" and reviewRequired=false.
These were auto-approved without human review evidence.

| BM | field | path/slotId | label |
|---|------|------------|-------|
| document.vietTat | docxSlot | document.vietTat | Ô trống |
| agency.diaDanh | docxSlot | agency.diaDanh | Ô trống |
| document.vietTat | canonicalField | document.vietTat | Ô trống |
| agency.diaDanh | canonicalField | agency.diaDanh | Ô trống |
| agency.tenCo | docxSlot | agency.tenCo | Ô trống |
| document.vietTat | docxSlot | document.vietTat | Ô trống |
| agency.diaDanh | docxSlot | agency.diaDanh | Ô trống |
| document.ngayBan | docxSlot | document.ngayBan | Ô trống |
| document.soVan | docxSlot | document.soVan | Ô trống |
| agency.tenCo | canonicalField | agency.tenCo | Ô trống |
| document.vietTat | canonicalField | document.vietTat | Ô trống |
| agency.diaDanh | canonicalField | agency.diaDanh | Ô trống |
| document.ngayBan | canonicalField | document.ngayBan | Ô trống |
| document.soVan | canonicalField | document.soVan | Ô trống |
| agency.issuePlace | docxSlot | agency.issuePlace | Ô trống |
| document.documentCode | docxSlot | document.documentCode | Ô trống |
| decision.summaryLine | docxSlot | decision.summaryLine | Ô trống |
| decision.decisionLine | docxSlot | decision.decisionLine | Ô trống |
| agency.issuePlace | canonicalField | agency.issuePlace | Ô trống |
| decision.summaryLine | canonicalField | decision.summaryLine | Ô trống |
| decision.decisionLine | canonicalField | decision.decisionLine | Ô trống |
| person.fullName | docxSlot | person.fullName | Ô trống |
| document.issuePlaceAndDateLine | docxSlot | document.issuePlaceAndDateLine | Ô trống |
| document.issuePlaceAndDateLine | canonicalField | document.issuePlaceAndDateLine | Ô trống |
| agency.issuePlace | docxSlot | agency.issuePlace | Ô trống |
| agency.issuePlace | canonicalField | agency.issuePlace | Ô trống |
| document.issueDate | docxSlot | document.issueDate | Ô trống |
| agency.coQuan | docxSlot | agency.coQuan | Ô trống |
| agency.diaDanh | docxSlot | agency.diaDanh | Ô trống |
| document.soThong | docxSlot | document.soThong | Ô trống |

## HIGH: Generic Path Leakage

0 fields still use generic paths (document.fieldN, decision.fieldN, etc.).
These should be semanticized but were auto-approved.


## HIGH: rawPattern Mismatch

1025 fields have evidence.rawPattern that does not match their slotId/path.

| BM | field | expected | actual |
|---|------|---------|--------|
|  | docxSlot.evidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.evidence.rawPattern | {{agency.tenCo}} | {{document.field3}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.tenCo}} | {{document.field3}} |
|  | docxSlot.evidence.rawPattern | {{document.vietTat}} | {{document.field4}} |
|  | docxSlot.reviewEvidence.rawPattern | {{document.vietTat}} | {{document.field4}} |
|  | docxSlot.evidence.rawPattern | {{agency.diaDanh}} | {{document.field9}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.diaDanh}} | {{document.field9}} |
|  | docxSlot.evidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.evidence.rawPattern | {{agency.tenCo}} | {{document.field3}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.tenCo}} | {{document.field3}} |
|  | docxSlot.evidence.rawPattern | {{document.vietTat}} | {{document.field4}} |
|  | docxSlot.reviewEvidence.rawPattern | {{document.vietTat}} | {{document.field4}} |
|  | docxSlot.evidence.rawPattern | {{agency.diaDanh}} | {{document.field5}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.diaDanh}} | {{document.field5}} |
|  | docxSlot.evidence.rawPattern | {{document.ngayBan}} | {{case.field6}} |
|  | docxSlot.reviewEvidence.rawPattern | {{document.ngayBan}} | {{case.field6}} |
|  | docxSlot.evidence.rawPattern | {{document.soVan}} | {{document.field7}} |
|  | docxSlot.reviewEvidence.rawPattern | {{document.soVan}} | {{document.field7}} |

## Notes

- Render Atlas PASS = runtime render fidelity only, NOT semantic correctness.
- DB sync PASS = compiled-v2 matches DB, NOT that compiled-v2 matches locked.
- This audit determines SOT trust and semantic/evidence consistency.
