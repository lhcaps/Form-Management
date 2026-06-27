# REMEDIATION_LEAK Batch 1 - Safe Slot Label Cleanup

Generated: 2026-06-27T18:07:28.984Z

## Scope
- Issue: REMEDIATION_LEAK (slot labels leaking internal remediation text)
- Max BMs: 5
- Max mutations: 20

## Bucket Summary

| Bucket | Count |
|--------|-------|
| SAFE_SLOT_LABEL_CLEANUP_CANDIDATE | 13 |
| DEFERRED_BAD_CANONICAL_LABEL | 20 |
| DEFERRED_MISSING_CANONICAL_FIELD | 0 |
| DEFERRED_CONFLICTING_FIELD_ISSUES | 10 |
| DEFERRED_CONTEXT_REVIEW | 0 |
| DEFERRED_MISSING_LOCKED_CONTRACT | 0 |

## Safe Candidates (Batch)

| Template | Slot | Label Before | Label After |
|----------|------|--------------|-------------|
| BM-080 | document.fullDocumentCode | Slot from Wave 02 DOCX remediation | Số văn bản |
| BM-080 | document.issueDate | Slot from Wave 02 DOCX remediation | Ngày ban hành |
| BM-162 | document.fullDocumentCode | Slot from Wave 02 DOCX remediation | Số văn bản |
| BM-162 | document.issueDate | Slot from Wave 02 DOCX remediation | Ngày ban hành |
| BM-162 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay |
| BM-162 | person.idNumber | Slot from Wave 02 DOCX remediation | Số CCCD/CMND |
| BM-162 | person.occupation | Slot from Wave 02 DOCX remediation | Nghề nghiệp |
| BM-162 | person.personFullName | Slot from Wave 02 DOCX remediation | Họ tên |
| BM-163 | document.fullDocumentCode | Slot from Wave 02 DOCX remediation | Số văn bản |
| BM-163 | document.issueDate | Slot from Wave 02 DOCX remediation | Ngày ban hành |
| BM-163 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay |
| BM-163 | person.idNumber | Slot from Wave 02 DOCX remediation | Số CCCD/CMND |
| BM-163 | person.personFullName | Slot from Wave 02 DOCX remediation | Họ tên |

## All Candidates (Reference)

| Template | Slot | Label Before | Label After |
|----------|------|--------------|-------------|
| BM-080 | document.fullDocumentCode | Slot from Wave 02 DOCX remediation | Số văn bản |
| BM-080 | document.issueDate | Slot from Wave 02 DOCX remediation | Ngày ban hành |
| BM-162 | document.fullDocumentCode | Slot from Wave 02 DOCX remediation | Số văn bản |
| BM-162 | document.issueDate | Slot from Wave 02 DOCX remediation | Ngày ban hành |
| BM-162 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay |
| BM-162 | person.idNumber | Slot from Wave 02 DOCX remediation | Số CCCD/CMND |
| BM-162 | person.occupation | Slot from Wave 02 DOCX remediation | Nghề nghiệp |
| BM-162 | person.personFullName | Slot from Wave 02 DOCX remediation | Họ tên |
| BM-163 | document.fullDocumentCode | Slot from Wave 02 DOCX remediation | Số văn bản |
| BM-163 | document.issueDate | Slot from Wave 02 DOCX remediation | Ngày ban hành |
| BM-163 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay |
| BM-163 | person.idNumber | Slot from Wave 02 DOCX remediation | Số CCCD/CMND |
| BM-163 | person.personFullName | Slot from Wave 02 DOCX remediation | Họ tên |

## Approval Required

Edit `decisions.approved.json` to add approved decisions:

```json
{
  "decisions": [
    {
      "templateCode": "BM-XXX",
      "slotId": "path.to.field",
      "decision": "APPROVED_UPDATE_SLOT_LABEL",
      "action": "UPDATE_SLOT_LABEL"
    }
  ]
}
```