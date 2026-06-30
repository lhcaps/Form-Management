# BM-203 Human Review Blocker

**Template:** BM-203 - Thông báo về hoạt động tố tụng
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW
**Lane:** LEGAL_REVIEW
**Can Apply Now:** NO
**Can Mark Done:** NO

## Render Gate

Render gate is PASS. BM-203 is blocked for source-policy review, not render execution.

## Deferred Fields

| Path | Issue codes | Label | Classification |
|---|---|---|---|
| `case.caseNumber` | WEAK_EVIDENCE_AUTO_LOCKED | Số vụ án | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `case.caseNumber2` | WEAK_EVIDENCE_AUTO_LOCKED | Số vụ án (dòng 2) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `document.fullDocumentCode` | WEAK_EVIDENCE_AUTO_LOCKED, REQUIRED_SUSPICIOUS | Số văn bản / quyết định | DEFER_REQUIRED_POLICY_REVIEW |
| `document.issueDate` | WEAK_EVIDENCE_AUTO_LOCKED, REQUIRED_SUSPICIOUS | Ngày ban hành | DEFER_REQUIRED_POLICY_REVIEW |
| `document.issuePlace` | WEAK_EVIDENCE_AUTO_LOCKED | Nơi ban hành | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine10` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 10) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine11` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 11) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine12` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 12) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine13` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 13) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine14` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 14) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine15` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 15) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine2` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 2) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine3` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 3) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine4` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 4) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine5` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 5) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine6` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 6) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine7` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 7) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine8` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 8) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |
| `recipients.personLine9` | WEAK_EVIDENCE_AUTO_LOCKED | Người nhận (dòng 9) | DEFER_WEAK_EVIDENCE_AUTO_LOCKED |

## Required Review

- Confirm source, required, and reviewRequired policy per field.
- Split any approved metadata changes into a separate apply task with exact path-level decisions.
- Do not mark BM-203 DONE until policy blockers are resolved.
