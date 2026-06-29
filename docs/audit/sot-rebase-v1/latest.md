# SOT_REBASE_V1 — Source of Truth Rebase Audit

**Generated:** 2026-06-29T22:25:22.758Z

## SOT Policy

- **normalized DOCX** = structural/placeholder SOT
- **locked contract JSON** = current semantic working SOT (semantic-suspect until audit passes)
- **compiled-v2** = derived artifact, NOT SOT
- **DB compiled_json** = runtime published copy, NOT SOT

## Summary

| Metric | Value |
|--------|-------|
| Total BMs | 213 |
| Total issues | 2393 |
| CRITICAL | 0 |
| HIGH | 995 |
| MEDIUM | 1398 |

## Specific Issue Counts

| Issue | Count | Severity |
|-------|-------|----------|
| Ô trống auto-approved | 350 | HIGH |
| rawPattern mismatch | 709 | HIGH/MEDIUM |
| formInputHints stale | 0 | HIGH |
| compiled-v2 stale vs locked | 0 | CRITICAL |
| generic path leakage | 0 | HIGH |
| auto-generated auto-approved | 1334 | MEDIUM |

## By Classification

| Classification | BMs |
|----------------|-----|
| LOCKED_CONTRACT_EVIDENCE_INCONSISTENT | 205 |
| LOCKED_CONTRACT_STRUCTURALLY_MATCHED | 8 |

## Top 30 Riskiest BMs

| Rank | BM | Score | Issues | Classification |
|------|----|-------|--------|----------------|
| 1 | BM-096 | 98 | 34 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 2 | BM-136 | 93 | 33 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 3 | BM-155 | 86 | 30 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 4 | BM-117 | 66 | 24 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 5 | BM-118 | 66 | 24 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 6 | BM-106 | 62 | 22 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 7 | BM-126 | 62 | 22 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 8 | BM-134 | 51 | 19 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 9 | BM-135 | 51 | 19 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 10 | BM-152 | 50 | 18 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 11 | BM-069 | 47 | 17 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 12 | BM-048 | 44 | 16 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 13 | BM-161 | 44 | 16 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 14 | BM-087 | 43 | 15 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 15 | BM-127 | 43 | 15 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 16 | BM-129 | 43 | 15 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 17 | BM-130 | 43 | 15 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 18 | BM-138 | 43 | 15 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 19 | BM-039 | 40 | 40 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 20 | BM-021 | 37 | 15 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 21 | BM-028 | 37 | 17 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 22 | BM-114 | 37 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 23 | BM-115 | 37 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 24 | BM-128 | 37 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 25 | BM-131 | 37 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 26 | BM-137 | 37 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 27 | BM-149 | 37 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 28 | BM-013 | 35 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 29 | BM-154 | 35 | 13 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |
| 30 | BM-036 | 34 | 18 | LOCKED_CONTRACT_EVIDENCE_INCONSISTENT |

## CRITICAL: compiled-v2 Stale vs Locked

⚠️ **BM-063/BM-066 style stale bindings detected: 0**

Render Atlas PASS and DB sync PASS prove runtime fidelity only — they do NOT validate semantic correctness.


## HIGH: Ô trống Auto-Approved

350 docxSlots/canonicalFields with label "Ô trống" and reviewRequired=false.
These were auto-approved without human review evidence.

| BM | field | path/slotId | label |
|---|------|------------|-------|
| document.vietTat | docxSlot | document.vietTat | Ô trống |
| agency.diaDanh | docxSlot | agency.diaDanh | Ô trống |
| agency.tenCo | docxSlot | agency.tenCo | Ô trống |
| document.vietTat | docxSlot | document.vietTat | Ô trống |
| agency.diaDanh | docxSlot | agency.diaDanh | Ô trống |
| document.ngayBan | docxSlot | document.ngayBan | Ô trống |
| document.soVan | docxSlot | document.soVan | Ô trống |
| agency.issuePlace | docxSlot | agency.issuePlace | Ô trống |
| document.documentCode | docxSlot | document.documentCode | Ô trống |
| decision.summaryLine | docxSlot | decision.summaryLine | Ô trống |
| decision.decisionLine | docxSlot | decision.decisionLine | Ô trống |
| person.fullName | docxSlot | person.fullName | Ô trống |
| document.issuePlaceAndDateLine | docxSlot | document.issuePlaceAndDateLine | Ô trống |
| agency.issuePlace | docxSlot | agency.issuePlace | Ô trống |
| document.issueDate | docxSlot | document.issueDate | Ô trống |
| agency.coQuan | docxSlot | agency.coQuan | Ô trống |
| agency.diaDanh | docxSlot | agency.diaDanh | Ô trống |
| document.soThong | docxSlot | document.soThong | Ô trống |
| document.ngayBan | docxSlot | document.ngayBan | Ô trống |
| agency.coQuan | docxSlot | agency.coQuan | Ô trống |
| agency.diaDanh | docxSlot | agency.diaDanh | Ô trống |
| document.soQuyet | docxSlot | document.soQuyet | Ô trống |
| document.ngayBan | docxSlot | document.ngayBan | Ô trống |
| legalBasis.canCu | docxSlot | legalBasis.canCu | Ô trống |
| document.soQd | docxSlot | document.soQd | Ô trống |
| document.ngayQd | docxSlot | document.ngayQd | Ô trống |
| agency.tenCo | docxSlot | agency.tenCo | Ô trống |
| document.vietTat | docxSlot | document.vietTat | Ô trống |
| agency.issuePlace | docxSlot | agency.issuePlace | Ô trống |
| document.documentCode | docxSlot | document.documentCode | Ô trống |

## HIGH: Generic Path Leakage

0 fields still use generic paths (document.fieldN, decision.fieldN, etc.).
These should be semanticized but were auto-approved.


## HIGH: rawPattern Mismatch

709 fields have evidence.rawPattern that does not match their slotId/path.

| BM | field | expected | actual |
|---|------|---------|--------|
|  | docxSlot.evidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.evidence.rawPattern | {{agency.tenCo}} | {{document.field3}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.tenCo}} | {{document.field3}} |
|  | docxSlot.evidence.rawPattern | {{document.vietTat}} | {{document.field4}} |
|  | docxSlot.evidence.rawPattern | {{agency.diaDanh}} | {{document.field9}} |
|  | docxSlot.evidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.vienKiem}} | {{document.field1}} |
|  | docxSlot.evidence.rawPattern | {{agency.tenCo}} | {{document.field3}} |
|  | docxSlot.evidence.rawPattern | {{document.vietTat}} | {{document.field4}} |
|  | docxSlot.evidence.rawPattern | {{agency.diaDanh}} | {{document.field5}} |
|  | docxSlot.evidence.rawPattern | {{document.ngayBan}} | {{case.field6}} |
|  | docxSlot.evidence.rawPattern | {{document.soVan}} | {{document.field7}} |
|  | docxSlot.evidence.rawPattern | {{agency.parentNameUpper}} | {{document.field1}} |
|  | docxSlot.reviewEvidence.rawPattern | {{agency.parentNameUpper}} | {{document.field1}} |
|  | docxSlot.evidence.rawPattern | {{agency.issuePlace}} | {{document.field3}} |
|  | docxSlot.evidence.rawPattern | {{document.documentCode}} | {{document.field4}} |
|  | docxSlot.reviewEvidence.rawPattern | {{document.documentCode}} | {{document.field4}} |
|  | docxSlot.evidence.rawPattern | {{document.issuePlaceAndDateLine}} | {{legalBasis.procedureArticlesLine}} |
|  | docxSlot.reviewEvidence.rawPattern | {{document.issuePlaceAndDateLine}} | {{legalBasis.procedureArticlesLine}} |

## Notes

- Render Atlas PASS = runtime render fidelity only, NOT semantic correctness.
- DB sync PASS = compiled-v2 matches DB, NOT that compiled-v2 matches locked.
- This audit determines SOT trust and semantic/evidence consistency.
