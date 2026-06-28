# PRIOR DOCX REMEDIATION GENERIC SLOT — LANE CLOSURE REPORT

Generated: 2026-06-26T19:18:24.529Z

---

## Executive Summary

**Lane:** PRIOR_DOCX_REMEDIATION_GENERIC_SLOT
**Status:** CLOSED — no label-only opportunities
**Current audit baseline:**

| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**Lane candidates:** 16
**Label-only approved:** **0**
**Apply delta:** totalIssues +0, BAD_LABEL +0, UI_VISIBLE_BAD_METADATA +0

---

## Conclusion

**This lane has 0 label-only opportunities.**

- Do NOT create a label-fix apply script.
- Do NOT approve any item from this lane without DOCX reauthor or legal review.
- The 5 DOCX_REAUTHOR_REQUIRED items need a DOCX reauthor / path-binding investigation lane.
- The 7 DEFER_NO_CONTEXT items need more evidence (paragraph context, visible labels) before any label decision.
- The 4 LEGAL_REVIEW items are parked; do not touch without explicit legal reviewer.

**This lane should be marked CLOSED.**

---

## Candidate Reconciliation

| # | ID | Template | Path | Risk | Decision | Category | Slot Role | Visible Label |
|---|----|----------|------|------|----------|----------|-----------|---------------|
| 1 | BM-063/document.fullDocumentCode8 | BM-063 | document.fullDocumentCode8 | MEDIUM | DEFER | DOCX_REAUTHOR_REQUIRED | body_procedural_reference | No |
| 2 | BM-063/recipients.personLine5 | BM-063 | recipients.personLine5 | MEDIUM | DEFER | DEFER_NO_CONTEXT | body_recipient_filler | No |
| 3 | BM-065/document.fullDocumentCode8 | BM-065 | document.fullDocumentCode8 | MEDIUM | DEFER | DOCX_REAUTHOR_REQUIRED | body_procedural_reference | No |
| 4 | BM-065/recipients.personLine3 | BM-065 | recipients.personLine3 | MEDIUM | DEFER | DEFER_NO_CONTEXT | body_recipient_filler | No |
| 5 | BM-052/recipients.personLine6 | BM-052 | recipients.personLine6 | MEDIUM | DEFER | DEFER_NO_CONTEXT | body_recipient_filler_and_footer_nơi_nhận_suffix | No |
| 6 | BM-061/recipients.personLine3 | BM-061 | recipients.personLine3 | MEDIUM | DEFER | DEFER_NO_CONTEXT | body_recipient_filler | No |
| 7 | BM-062/recipients.personLine5 | BM-062 | recipients.personLine5 | MEDIUM | DEFER | DEFER_NO_CONTEXT | body_recipient_filler_and_footer_nơi_nhận_suffix | No |
| 8 | BM-064/document.issueDate4 | BM-064 | document.issueDate4 | MEDIUM | DEFER | DOCX_REAUTHOR_REQUIRED | body_procedural_legal_text_filler | No |
| 9 | BM-066/document.fullDocumentCode4 | BM-066 | document.fullDocumentCode4 | MEDIUM | DEFER | DOCX_REAUTHOR_REQUIRED | body_procedural_reference | No |
| 10 | BM-066/recipients.personLine4 | BM-066 | recipients.personLine4 | MEDIUM | DEFER | DEFER_NO_CONTEXT | body_recipient_filler_and_footer_nơi_nhận_suffix | No |
| 11 | BM-067/document.fullDocumentCode6 | BM-067 | document.fullDocumentCode6 | MEDIUM | DEFER | DOCX_REAUTHOR_REQUIRED | body_procedural_reference | No |
| 12 | BM-067/recipients.personLine3 | BM-067 | recipients.personLine3 | MEDIUM | DEFER | DEFER_NO_CONTEXT | body_recipient_filler | No |
| 13 | BM-051/decision.decisionLine3 | BM-051 | decision.decisionLine3 | HIGH | DEFER | LEGAL_REVIEW_REQUIRED | legal_decision_field | No |
| 14 | BM-052/decision.decisionLine2 | BM-052 | decision.decisionLine2 | HIGH | DEFER | LEGAL_REVIEW_REQUIRED | legal_decision_field | No |
| 15 | BM-060/decision.decisionLine10 | BM-060 | decision.decisionLine10 | HIGH | DEFER | LEGAL_REVIEW_REQUIRED | legal_decision_field | No |
| 16 | BM-062/decision.decisionLine11 | BM-062 | decision.decisionLine11 | HIGH | DEFER | LEGAL_REVIEW_REQUIRED | legal_decision_field | No |

---

## Medium Review Result

### DOCX_REAUTHOR_REQUIRED — 5 items

| ID | Slot Role | Key Evidence |
|----|-----------|--------------|
| BM-063/document.fullDocumentCode8 | body_procedural_reference | Paragraphs [011][013][014][015][016][017][033] — context like "ngày … tháng … năm …", "Kiểm sát viên …2", "UBND cấp xã". References underlying Lệnh kê biên tài sản. Legitimate document.fullDocumentCode already exists with label "Số văn bản". Path name semantically wrong. |
| BM-065/document.fullDocumentCode8 | body_procedural_reference | Paragraphs [011][013][014][015][016][017][029][030] — references Kiểm sát viên superscript, UBND cấp xã, "Ngay sau khi nhận được". References underlying Lệnh/Quyết định hủy bỏ. Legitimate document.fullDocumentCode exists. Path semantically wrong. |
| BM-064/document.issueDate4 | body_procedural_legal_text_filler | Paragraphs [016][017][020][026] — appears in "Xét thấy", "Căn cứ Lệnh kê biên tài sản số …", "Điều 2. Yêu cầu". Not a date field — procedural/legal text filler. Legitimate document.issueDate exists as computed field. Path semantically wrong. |
| BM-066/document.fullDocumentCode4 | body_procedural_reference | Paragraphs [010][018][026][030] — slot at [010] appears ABOVE title "LỆNH / PHONG TỎA TÀI KHOẢN" (anomalous). Also in "Xét thấy", "Số CMND:...", "Yêu cầu 12 và 14...". Legitimate document.fullDocumentCode exists. Path semantically wrong. |
| BM-067/document.fullDocumentCode6 | body_procedural_reference | Paragraphs [011][013][014][015][016] — slot at [011] above title "BIÊN BẢN / Phong tỏa tài khoản". Adjacent to Kiểm sát viên / Đại diện Tổ chức tín dụng signature lines. Legitimate document.fullDocumentCode exists. Path semantically wrong. |

**Common pattern:** slot path looks like document metadata, but rendered paragraphs show procedural/body/signature/reference context. Legitimate canonical document metadata field already exists in the same contract. Label-only fix would misrepresent the field.

### DEFER_NO_CONTEXT — 7 items

| ID | Slot Role | Key Evidence |
|----|-----------|--------------|
| BM-063/recipients.personLine5 | body_recipient_filler | Paragraphs [021][022][025][030][031] — blank filler interleaved with "Tên gọi khác", "Nghề nghiệp", blank placeholder lines. No visible label. |
| BM-065/recipients.personLine3 | body_recipient_filler | Paragraphs [021][022][025] — same pattern as BM-063. Blank filler between "Tên gọi khác:" and "Nghề nghiệp:". No visible label. |
| BM-052/recipients.personLine6 | body_recipient_filler + footer_nơi_nhận_suffix | Paragraphs [019][020][021][024][027][035] — blank filler + "11__RECIPIENTS_PERSONLINE6__" suffix in Nơi nhận list. No visible label. |
| BM-061/recipients.personLine3 | body_recipient_filler | Paragraphs [022][023][026] — blank filler between "Tên gọi khác:" and "Nghề nghiệp:". No visible label. |
| BM-062/recipients.personLine5 | body_recipient_filler + footer_nơi_nhận_suffix | Paragraphs [021][022][023][037] — blank filler + "16__RECIPIENTS_PERSONLINE5__" suffix in Nơi nhận list. No visible label. |
| BM-066/recipients.personLine4 | body_recipient_filler + footer_nơi_nhận_suffix | Paragraphs [023][024][031] — blank filler between "Tên gọi khác:" and "Nghề nghiệp:" + "15__RECIPIENTS_PERSONLINE4__" in Nơi nhận. No visible label. |
| BM-067/recipients.personLine3 | body_recipient_filler | Paragraphs [021][022][025] — blank filler between "Tên gọi khác:" and "Nghề nghiệp:". No visible label. |

**Common pattern:** generic body recipient filler; repeated blank lines; sometimes footer/Nơi nhận suffix; no visible Vietnamese label; no semantic distinction between instances.

### LEGAL_REVIEW_REQUIRED — 4 parked items

| ID | Path | Reason |
|----|------|--------|
| BM-051 | decision.decisionLine3 | decision.* field — parked. Do not approve without legal reviewer. |
| BM-052 | decision.decisionLine2 | decision.* field — parked. Do not approve without legal reviewer. |
| BM-060 | decision.decisionLine10 | decision.* field — parked. Do not approve without legal reviewer. |
| BM-062 | decision.decisionLine11 | decision.* field — parked. Do not approve without legal reviewer. |

**Policy:** Do not approve decision.* fields without explicit legal reviewer/legal sign-off.

---

## Computed Lane Counts

| Metric | Value |
|--------|-------|
| Total candidates | 16 |
| Approved label-only | 0 |
| Medium reviewed | 12/12 |
| Medium remaining | 0 |
| Medium DEFER decisions | 12 |
| DOCX_REAUTHOR_REQUIRED | 5 |
| DEFER_NO_CONTEXT | 7 |
| LEGAL_REVIEW_REQUIRED (parked) | 4 |
| **Sum check** | **16** ✓ |

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Global decisions modified: **0**
- Apply script created: **NO**
- Apply write triggered: **NO**

---

## Next Recommended Action

**DOCX_PATH_BINDING_INVESTIGATION_PLAN**

Not Ô trống lane (~340 items). Two independent lanes (Wave 02 + this lane) have shown the same root pattern: slot metadata paths look like they could accept a label fix, but rendered paragraphs reveal body/footer/procedural/signature context. A path/binding investigation should precede any label-fix for this class of slots.

---

_Lane closure auto-generated. Do not edit manually._
