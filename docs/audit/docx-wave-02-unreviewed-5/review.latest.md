# Wave 02 Unreviewed 5 — Classification Report

**Generated:** 2026-06-26 17:30 UTC+7
**Reviewer:** Le Huy
**Scope:** 5 master pack IDs not covered by any previous per-BM review batch
**Method:** DOCX paragraph-level extraction from `.cache/f2-rendered-docx/*.bin` + locked-contract `docxSlots` cross-check.

---

## IDs covered

| ID | BM | Path | Placeholder |
|----|----|------|-------------|
| W2R-017 | BM-069 | `document.reasonLine` | `{{document.field6}}` |
| W2R-018 | BM-069 | `document.reasonLine2` | `{{document.field7}}` |
| W2R-024 | BM-069 | `document.summaryLine` | `{{document.field12}}` |
| W2R-025 | BM-073 | `document.fullDocumentCode` | `{{document.field1}}` |
| W2R-026 | BM-073 | `document.issueDate` | `{{document.field2}}` |

---

## Decision summary

| Decision | Count |
|----------|------:|
| APPROVED_LABEL | 0 |
| DEFER | 5 |
| LEGAL_REVIEW | 0 |
| DOCX_REAUTHOR_REQUIRED | 0 |
| PENDING_REVIEW | 0 |
| **Total** | **5** |

**Apply-write triggered?** No (0 approvals). No merge to `decisions.approved.json` (global).

---

## Per-item review

### W2R-017 — BM-069 `document.reasonLine` → **DEFER**

- **Rendered DOCX paragraph [017]:** `__DOCUMENT_REASONLINE__` (standalone line)
- **Context before:** "Đại diện Tổ chức tín dụng/Kho bạc Nhà nước__PERSON_IDNUMBER__"
- **Context after:** "Thi hành Quyết định hủy bỏ biện pháp phong tỏa tài khoản theo Lệnh phong tỏa tài khoản số … ngày … tháng … năm …__DOCUMENT_REASONLINE2__"
- **Visible Vietnamese label:** none
- **Reason:** Body-line slot with no visible label. Approving "Lý do" without visible evidence is unsafe. Family of body slots without labels — needs path/binding investigation.

### W2R-018 — BM-069 `document.reasonLine2` → **DEFER**

- **Rendered DOCX paragraph [018]:** "Thi hành Quyết định hủy bỏ biện pháp phong tỏa tài khoản theo Lệnh phong tỏa tài khoản số … ngày … tháng … năm …__DOCUMENT_REASONLINE2__"
- **Visible Vietnamese label:** none (slot is sentence-trailing)
- **Reason:** Slot embedded at the END of a procedural sentence about thi hành Quyết định. Not a labeled form field. Body/procedural text slot.

### W2R-024 — BM-069 `document.summaryLine` → **DEFER**

- **Rendered DOCX paragraph [031]:** "2. Các thông tin về tài khoản, số lượng tài khoản, số tiền có trong tài khoản được hủy bỏ biện pháp phong tỏa tài khoản__DOCUMENT_SUMMARYLINE__"
- **Visible Vietnamese label:** none
- **Reason:** Free-form body completion in the procedural enumeration clause 2 of the biên bản. "Tóm tắt nội dung" would mismatch the procedural context. Needs path/binding investigation to determine whether this is a labeled account-info continuation.

### W2R-025 — BM-073 `document.fullDocumentCode` → **DEFER**

- **Visible header at paragraph [009]:** "Số: …/YC-VKS…-…" (has NO slot)
- **Slot location at paragraph [012]:** "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__"
- **Visible Vietnamese label:** none on the slot's paragraph
- **Reason:** Same systemic false-header pattern flagged in closure report §1 (W2R-029/033/040/013). The "Số:" header has no slot; the slot sits in the body title line "Thay đổi __fullDocumentCode__" (a sub-number reference). Path/binding investigation required before any label can be approved.

### W2R-026 — BM-073 `document.issueDate` → **DEFER**

- **Visible header at paragraph [010]:** "…, ngày … tháng … năm 20…" (has NO slot)
- **Slot location at paragraph [016]:** "Xét thấy__DOCUMENT_ISSUEDATE__"
- **Visible Vietnamese label:** none on the slot's paragraph
- **Reason:** Same family as W2R-025. The visible date header has no slot; the slot sits in the body "Xét thấy …" preamble (Considering that …) — a reasoning clause, not the issuance date header. Approving "Ngày ban hành" would misrepresent the slot semantics.

---

## Why all 5 are DEFER, not DOCX_REAUTHOR_REQUIRED

W2R-027/028 (BM-073 `person.dateOfBirth` / `person.idNumber`) were correctly marked `DOCX_REAUTHOR_REQUIRED` in priority-7 because BM-073 has no personal DOB/CCCD field at all — the slot path is semantically wrong and the form needs a new field.

These 5 IDs are different:
- `document.fullDocumentCode`, `document.issueDate`, `document.reasonLine*`, `document.summaryLine` are all legitimate semantic paths that exist on similar BMs.
- The issue is that on BM-069 and BM-073, the Wave 02 DOCX remediation mapped the slots to the wrong paragraphs in the rendered DOCX, so they don't sit on the lines where the visible Vietnamese labels are.
- This is a path/binding/lane-positioning issue, not a missing-field issue.

`DEFER` is the correct label here pending the systemic path/binding investigation lane (closure report §1). Future DOCX_REAUTHOR lane work may reclassify some of these if investigation confirms re-positioning is required.

---

## Safety / scope discipline

- 0 DOCX files touched.
- 0 source/path/binding touched.
- 0 compiled artifacts hand-edited.
- 0 locked contracts mutated.
- 0 approvals → apply-write skipped (per task rules).
- Closure script extended by 2 lines to read this new review folder so the master-not-reviewed count drops to 0.

---

## Next task

`PRIOR_DOCX_REMEDIATION_GENERIC_SLOT_REVIEW_PLAN` — plan + sample + group only, no apply.