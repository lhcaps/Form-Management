# PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_1

Generated: 2026-06-26T18:56:00.225Z

## Summary

- Batch: BM-063 × 2, BM-065 × 2 (4 items total)
- Approved: **0**
- Deferred: **4**
- Legal review: **0**
- DOCX reauthor required: **2**

## Decisions

### BM-063/document.fullDocumentCode8
**DEFER** [DOCX_REAUTHOR_REQUIRED]
**Role:** body_procedural_reference
**Visible label:** No
**Evidence paragraphs:** [011], [013], [014], [015], [016], [017], [033]
**Reason:** Body/procedural reference slot. Appears in paragraphs [011][013][014][015][016][017][033] with context like "ngày … tháng … năm …", "Kiểm sát viên …2", "UBND cấp xã". References the underlying Lệnh kê biên tài sản (procedural antecedent), not the current biên bản's document code. No visible Vietnamese label. Legitimate document.fullDocumentCode already exists in contract with label "Số văn bản". Path name is semantically wrong. Label-only fix insufficient.

---
### BM-063/recipients.personLine5
**DEFER** [DEFER_NO_CONTEXT]
**Role:** body_recipient_filler
**Visible label:** No
**Evidence paragraphs:** [021], [022], [025], [030], [031]
**Reason:** Body slot. Appears in paragraphs [021][022][025][030][031] interleaved with legitimate recipient fields (Tên gọi khác, Nghề nghiệp, blank placeholder lines). Appears empty or as a secondary blank line in the recipient data block. No visible label. No confident semantic mapping. Multiple instances suggest generic filler slots from DOCX remediation. Cannot approve without understanding what "Tên gọi khác" or "Nghề nghiệp" lines should contain.

---
### BM-065/document.fullDocumentCode8
**DEFER** [DOCX_REAUTHOR_REQUIRED]
**Role:** body_procedural_reference
**Visible label:** No
**Evidence paragraphs:** [011], [013], [014], [015], [016], [017], [029], [030]
**Reason:** Body/procedural reference slot. Appears in paragraphs [011][013][014][015][016][017][029][030] at structural positions with context referencing Kiểm sát viên superscript, UBND cấp xã, and "Ngay sau khi nhận được". References the underlying Lệnh kê biên tài sản / Quyết định hủy bỏ that this biên bản is reporting on — not the current biên bản's own document number. No visible label. Legitimate document.fullDocumentCode already exists with label "Số văn bản". Path name is semantically wrong. DOCX_REAUTHOR_REQUIRED.

---
### BM-065/recipients.personLine3
**DEFER** [DEFER_NO_CONTEXT]
**Role:** body_recipient_filler
**Visible label:** No
**Evidence paragraphs:** [021], [022], [025]
**Reason:** Body slot. Appears in paragraphs [021][022][025] at the same structural positions as BM-063 recipients.personLine5. Interleaved with legitimate recipient fields (Tên gọi khác, Nghề nghiệp, blank lines). No visible label. Multiple instances suggest generic filler slots from DOCX remediation, not actual recipient person data. Cannot approve without understanding semantic purpose of each filler position.

## Safety

- Locked contracts mutated: **NO**
- DOCX touched: **NO**
- Source/path/binding touched: **NO**
- Compiled artifacts hand-edited: **NO**
- Global decisions modified: **NO**

## Next task

PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_2

---
_This review is auto-generated. Do not edit manually._
