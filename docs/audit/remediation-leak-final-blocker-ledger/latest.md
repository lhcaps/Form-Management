# REMEDIATION_LEAK Final Blocker Ledger

**Generated:** 2026-06-28T02:07:00.000Z
**Status:** CLOSED - REQUIRES_DIRECT_DOCX_REVIEW

## Summary

| Classification | Count |
|----------------|-------|
| BM-069 missing direct decision | 5 |
| Body/footer slot wrong context | 3 |
| No visible DOB label | 2 |
| **Total** | **10** |

## Hard Rules (Enforced)

| Rule | Action |
|------|--------|
| rawPattern EMPTY + textBefore `{{document.fieldN}}` | DO NOT APPROVE |
| Cross-BM evidence | DO NOT APPROVE |
| Body/footer slot ≠ document header | DO NOT APPROVE |
| No direct DOCX evidence | DEFER |

## Blocker Details

| ID | BM | Path | Reason | Can Remediate? | Required Action |
|----|----|------|--------|----------------|-----------------|
| LEAK-BLK-001 | BM-069 | document.fullDocumentCode | CROSS_BM_EVIDENCE_REJECTED | NO | DIRECT_DOCX_REVIEW_BM-069 |
| LEAK-BLK-002 | BM-069 | document.reasonLine | NO_REVIEW_DECISION | NO | DIRECT_DOCX_REVIEW_BM-069 |
| LEAK-BLK-003 | BM-069 | document.reasonLine2 | NO_REVIEW_DECISION | NO | DIRECT_DOCX_REVIEW_BM-069 |
| LEAK-BLK-004 | BM-069 | decision.decisionLine | NO_REVIEW_DECISION | NO | DIRECT_DOCX_REVIEW_BM-069 |
| LEAK-BLK-005 | BM-069 | document.summaryLine | NO_REVIEW_DECISION | NO | DIRECT_DOCX_REVIEW_BM-069 |
| LEAK-BLK-006 | BM-075 | document.fullDocumentCode | BODY_SLOT_NOT_HEADER | NO | PATH_REMAP_REQUIRES_DOCX_AUTHORING |
| LEAK-BLK-007 | BM-077 | document.fullDocumentCode | FOOTER_SLOT_NOT_HEADER | NO | PATH_REMAP_REQUIRES_DOCX_AUTHORING |
| LEAK-BLK-008 | BM-082 | document.fullDocumentCode | WRONG_SEMANTIC_PATH | NO | PATH_REMAP_REQUIRES_DOCX_AUTHORING |
| LEAK-BLK-009 | BM-162 | person.dateOfBirth | NO_VISIBLE_DOB_LABEL | NO | DIRECT_DOCX_REVIEW_BM-162 |
| LEAK-BLK-010 | BM-163 | person.dateOfBirth | NO_VISIBLE_DOB_LABEL | NO | DIRECT_DOCX_REVIEW_BM-163 |

## Why These Cannot Be Fixed Now

### BM-069 Group (5 items)
- All 5 items lack independent BM-069 DOCX review evidence
- LEAK-BLK-001 uses BM-068 evidence (cross-BM rejected)
- LEAK-BLK-002 to 005 have null review decisions in review-pack

### Body/Footer Slot Group (3 items)
- BM-075/077/082 document.fullDocumentCode slots are in body/footer, not header
- These are NOT document code fields - they are procedural/form reference fields
- Requires path remapping, not just label change

### DOB Label Group (2 items)
- BM-162/163 person.dateOfBirth slots lack visible DOB labels
- Cannot determine semantic without manual DOCX review

## Next Action

**Lane switch to PATH_DOMAIN_BINDING_BATCH_1**

For: BM-096, BM-155, BM-136 (in order of priority)

---

*REMEDIATION_LEAK closed from 63 → 10. Remaining 10 are true blockers requiring direct DOCX review.*
