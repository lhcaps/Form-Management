# PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_EVIDENCE_BATCH_2

Generated: 2026-06-26T19:09:13.035Z

## Summary

- Batch: BM-052, BM-061, BM-062, BM-064, BM-066(×2), BM-067(×2) (8 items total)
- Approved: **0**
- Deferred: **8**
- Legal review: **0**
- DOCX reauthor required: **3**
- DEFER_NO_CONTEXT: **5**

## Lane status (12 medium items across 2 batches)

| Metric | Value |
|--------|-------|
| Total candidates | 16 |
| HIGH legal parked | 4 |
| Medium total | 12 |
| Medium reviewed batch 1 | 4 |
| Medium reviewed batch 2 | 8 |
| Medium remaining | 0 |
| Approved (all lane) | 0 |
| Deferred (all lane) | 8 |
| DOCX reauthor (all lane) | 3 |

## Decisions

### BM-052/recipients.personLine6
**DEFER** [DEFER_NO_CONTEXT]
**Role:** body_recipient_filler_and_footer_nơi_nhận_suffix
**Visible label:** No
**Evidence paragraphs:** [019], [020], [021], [024], [027], [035]
**Reason:** Body filler: slots at [019][020][021][024][027] are blank lines interleaved with legitimate recipient fields (Tên gọi khác, Nghề nghiệp, Số CMND, Nơi thường trú, Nơi tạm trú). Footer suffix: slot at [035] is "11__RECIPIENTS_PERSONLINE6__" appended after Nơi nhận list items (7…; 10…; 8…/người thân thích; Lưu: HSVA, HSKS, VP.). No visible label anywhere. Multiple instances without semantic distinction. Same pattern as BM-063/BM-065 recipients.personLine slots.

---
### BM-061/recipients.personLine3
**DEFER** [DEFER_NO_CONTEXT]
**Role:** body_recipient_filler
**Visible label:** No
**Evidence paragraphs:** [022], [023], [026]
**Reason:** Body filler: slots at [022][023] are blank lines between "Tên gọi khác:" and "Nghề nghiệp:". Slot at [026] is blank line after "Số CMND/Thẻ CCCD/...". No visible label. No semantic distinction between multiple instances. Same pattern as BM-052 recipients.personLine6 and BM-063/BM-065 recipients.personLine slots.

---
### BM-062/recipients.personLine5
**DEFER** [DEFER_NO_CONTEXT]
**Role:** body_recipient_filler_and_footer_nơi_nhận_suffix
**Visible label:** No
**Evidence paragraphs:** [021], [022], [023], [037]
**Reason:** Body filler: slots at [021][022][023] are blank lines after "Họ tên:__RECIPIENTS_PERSONLINE__" (the legitimate recipient person slot). Footer suffix: slot at [037] is "16__RECIPIENTS_PERSONLINE5__" appended after Nơi nhận list items (12…; 13…; 15…; Lưu: HSVA, HSKS, VP.). No visible label. Same pattern as BM-052 recipients.personLine6.

---
### BM-064/document.issueDate4
**DEFER** [DOCX_REAUTHOR_REQUIRED]
**Role:** body_procedural_legal_text_filler
**Visible label:** No
**Evidence paragraphs:** [016], [017], [020], [026]
**Reason:** Not a date field — appears in procedural/legal text. Slots at [016][017]: adjacent to "Xét thấy" and citation block "Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với". Slot at [020]: inside "Điều 2. Yêu cầu 7 và 8… thực hiện Quyết định". Slot at [026]: suffix in Nơi nhận list. The legitimate document.issueDate field exists as a computed date field. document.issueDate4 is a misnamed slot appearing in procedural/legal text, not a date placeholder. Path name is semantically wrong. Fix requires DOCX reauthor/remap, not label change.

---
### BM-066/document.fullDocumentCode4
**DEFER** [DOCX_REAUTHOR_REQUIRED]
**Role:** body_procedural_reference
**Visible label:** No
**Evidence paragraphs:** [010], [018], [026], [030]
**Reason:** Slot at [010] appears ABOVE the document title "LỆNH / PHONG TỎA TÀI KHOẢN" — anomalous structural position. Slots at [018][030]: adjacent to "Xét thấy" and inside decision articles. Slot at [026]: placed inside "Số CMND/Thẻ CCCD/..." line. Legitimate document.fullDocumentCode already exists with label "Số văn bản". Path name is semantically wrong. Appears in procedural/decision context, not as current document number. DOCX_REAUTHOR_REQUIRED.

---
### BM-066/recipients.personLine4
**DEFER** [DEFER_NO_CONTEXT]
**Role:** body_recipient_filler_and_footer_nơi_nhận_suffix
**Visible label:** No
**Evidence paragraphs:** [023], [024], [031]
**Reason:** Body filler: slots at [023][024] are blank lines between "Tên gọi khác:" and "Nghề nghiệp:". Footer suffix: slot at [031] is "15__RECIPIENTS_PERSONLINE4__" after Nơi nhận list items. No visible label. Same pattern as other recipients.personLineX slots in this lane.

---
### BM-067/document.fullDocumentCode6
**DEFER** [DOCX_REAUTHOR_REQUIRED]
**Role:** body_procedural_reference
**Visible label:** No
**Evidence paragraphs:** [011], [013], [014], [015], [016]
**Reason:** Slot at [011] appears ABOVE document title "BIÊN BẢN / Phong tỏa tài khoản". Slots at [013][014][015][016]: adjacent to Kiểm sát viên / Đại diện Tổ chức tín dụng/Kho bạc Nhà nước signature lines — structural roles in the biên bản body. Legitimate document.fullDocumentCode already exists with label "Số văn bản". Path name is semantically wrong. Appears in biên bản body/signature context, not as current document number. DOCX_REAUTHOR_REQUIRED.

---
### BM-067/recipients.personLine3
**DEFER** [DEFER_NO_CONTEXT]
**Role:** body_recipient_filler
**Visible label:** No
**Evidence paragraphs:** [021], [022], [025]
**Reason:** Body filler: slots at [021][022] are blank lines between "Tên gọi khác:" and "Nghề nghiệp:". Slot at [025] is blank line after "Số CMND/Thẻ CCCD/...". No visible label. No semantic distinction between multiple instances. Same family as BM-063/BM-065 recipients.personLine3/5 slots.

## Safety

- Locked contracts mutated: **NO**
- DOCX touched: **NO**
- Source/path/binding touched: **NO**
- Compiled artifacts hand-edited: **NO**
- Global decisions modified: **NO**

## Next task

PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_CLOSURE_REPORT

---
_This review is auto-generated. Do not edit manually._
