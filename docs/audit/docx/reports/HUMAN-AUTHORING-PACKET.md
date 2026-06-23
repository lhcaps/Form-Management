# Human Authoring Packet — Wave 04E

> Generated: 2026-06-23T08:56:33.391Z
> Items: 36 field-level items across 13 BMs

## Summary

| BM | Title | Items |
|---|---|---:|
| BM-021 | QĐ không khởi tố vụ án hình sự | 2 |
| BM-031 | QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp | 2 |
| BM-036 | QĐ trả tự do cho người bị tạm giữ | 4 |
| BM-044 | QĐ thay thế biện pháp tạm giam | 2 |
| BM-052 | QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm | 4 |
| BM-059 | QĐ gia hạn thời hạn tạm giam để truy tố 1 | 2 |
| BM-060 | QĐ áp giải bị can | 2 |
| BM-061 | QĐ dẫn giải | 2 |
| BM-063 | Biên bản kê biên tài sản | 2 |
| BM-064 | QĐ huỷ bỏ biện pháp kê biên tài sản | 2 |
| BM-065 | BB về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản | 4 |
| BM-066 | Lệnh phong toả tài khoản | 4 |
| BM-067 | Biên bản phong tỏa tài khoản | 4 |

## Instructions

1. **Đọc DOCX gốc** cho mỗi BM cần sửa.
2. **Mở khóa DOCX** bằng cách unzip, chỉnh sửa `word/document.xml`, zip lại.
3. **Chèn placeholder** `{{field.path}}` tại vị trí được chỉ định trong bảng.
4. **Sau khi sửa DOCX**: chạy `pnpm extract:docx:structure` và `pnpm extract:docx:normalize` để cập nhật baseline.
5. **Chạy verify**: `pnpm audit:docx:verify-locked` để xác nhận remediation giảm.

---

## BM-021 — QĐ không khởi tố vụ án hình sự

**Form number:** 021/HS

**Existing mustaches in template:**
- {{agency.issuePlace}}
- {{agency.parentNameUpper}}
- {{decision.decisionLine}}
- {{decision.summaryLine}}
- {{document.documentCode}}
- {{document.issuePlaceAndDateLine}}
- {{legalBasis.procedureArticlesLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{agency.nameUpper}}` | Tên viết hoa của cơ quan (biến thể viết hoa tên cơ quan) | Đây là biến thể của trường đã có (ví dụ: agency.nameUpper). Cần người review xác định xem biến thể viết hoa/đầy đủ có cần xuất hiện trong văn bản gốc hay không. | Gần: "…, ngày … tháng … năm 20" | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |
| 2 | `{{agency.nameUpper}}` | Tên viết hoa của cơ quan (biến thể viết hoa tên cơ quan) | Đây là biến thể của trường đã có (ví dụ: agency.nameUpper). Cần người review xác định xem biến thể viết hoa/đầy đủ có cần xuất hiện trong văn bản gốc hay không. | Gần: "…, ngày … tháng … năm 20" | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{agency.nameUpper}}`**
- Trường "agency.nameUpper" (Tên viết hoa của cơ quan (biến thể viết hoa tên cơ quan)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.nameUpper}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{agency.nameUpper}}`**
- Trường "agency.nameUpper" (Tên viết hoa của cơ quan (biến thể viết hoa tên cơ quan)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.nameUpper}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{agency.nameUpper}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.issueDate}}`
- Anchor text (textBefore): `…, ngày … tháng … năm 20`
- Notes: Agency field slot (agency.nameUpper) exists in locked contract but no corresponding mustache in DOCX. Need human review to determine if this variant form should be added.

**Item 2: `{{agency.nameUpper}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.issueDate}}`
- Anchor text (textBefore): `…, ngày … tháng … năm 20`
- Notes: Agency field slot (agency.nameUpper) exists in locked contract but no corresponding mustache in DOCX. Need human review to determine if this variant form should be added.

---

## BM-031 — QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp

**Form number:** 031/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{agency.parentName}}
- {{document.documentCodeLine}}
- {{document.issuePlaceAndDateLine}}
- {{legalBasis.juvenileLegalBasisLine}}
- {{legalBasis.requestApprovalLine}}
- {{measure.article1Line}}
- {{measure.article2Line}}
- {{measure.reasonLine}}
- {{recipients.archiveLine}}
- {{recipients.investigationUnitLine}}
- {{recipients.personLine}}
- {{signature.positionTitle}}
- {{signature.signMode}}
- {{signature.signerName}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{agency.bodyName}}` | Tên thực thể của cơ quan (tên đầy đủ/hiệu) | Đây là biến thể của trường đã có (ví dụ: agency.bodyName). Cần người review xác định xem biến thể viết hoa/đầy đủ có cần xuất hiện trong văn bản gốc hay không. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |
| 2 | `{{agency.bodyName}}` | Tên thực thể của cơ quan (tên đầy đủ/hiệu) | Đây là biến thể của trường đã có (ví dụ: agency.bodyName). Cần người review xác định xem biến thể viết hoa/đầy đủ có cần xuất hiện trong văn bản gốc hay không. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{agency.bodyName}}`**
- Trường "agency.bodyName" (Tên thực thể của cơ quan (tên đầy đủ/hiệu)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.bodyName}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{agency.bodyName}}`**
- Trường "agency.bodyName" (Tên thực thể của cơ quan (tên đầy đủ/hiệu)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.bodyName}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{agency.bodyName}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `(none)`
- Anchor text (textBefore): `(none)`
- Notes: Agency field slot (agency.bodyName) exists in locked contract but no corresponding mustache in DOCX. Need human review to determine if this variant form should be added.

**Item 2: `{{agency.bodyName}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `(none)`
- Anchor text (textBefore): `(none)`
- Notes: Agency field slot (agency.bodyName) exists in locked contract but no corresponding mustache in DOCX. Need human review to determine if this variant form should be added.

---

## BM-036 — QĐ trả tự do cho người bị tạm giữ

**Form number:** 036/HS

**Existing mustaches in template:**
- {{decision.summaryLine}}
- {{document.documentCode}}
- {{document.issuePlaceAndDateLine}}
- {{legalBasis.procedureArticlesLine}}
- {{person.fullName}}
- {{recipients.archiveLine}}
- {{recipients.executionAgencyLine}}
- {{recipients.personLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{agency.parentNameUpper}}` | Tên viết hoa của cơ quan cấp trên | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "VIỆN KIỂM SÁT …" | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |
| 2 | `{{agency.parentNameUpper}}` | Tên viết hoa của cơ quan cấp trên | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "VIỆN KIỂM SÁT …" | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |
| 3 | `{{document.issueDate}}` | Ngày ban hành văn bản (ngày cụ thể) | Trường document.issueDate có thể đã được render gián tiếp bởi một trường compound khác. Cần người review xác nhận xem cần render riêng hay không. | Gần: "Nhận thấy" | LOW — sửa an toàn, ít ảnh hưởng layout |
| 4 | `{{document.issueDate}}` | Ngày ban hành văn bản (ngày cụ thể) | Trường document.issueDate có thể đã được render gián tiếp bởi một trường compound khác. Cần người review xác nhận xem cần render riêng hay không. | Gần: "Nhận thấy" | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{agency.parentNameUpper}}`**
- Trường "agency.parentNameUpper" (Tên viết hoa của cơ quan cấp trên) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.parentNameUpper}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{agency.parentNameUpper}}`**
- Trường "agency.parentNameUpper" (Tên viết hoa của cơ quan cấp trên) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.parentNameUpper}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 3: `{{document.issueDate}}`**
- Trường "document.issueDate" (Ngày ban hành văn bản (ngày cụ thể)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.issueDate}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 4: `{{document.issueDate}}`**
- Trường "document.issueDate" (Ngày ban hành văn bản (ngày cụ thể)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.issueDate}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{agency.parentNameUpper}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field1}}`
- Anchor text (textBefore): `VIỆN KIỂM SÁT …`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{agency.parentNameUpper}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field1}}`
- Anchor text (textBefore): `VIỆN KIỂM SÁT …`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 3: `{{document.issueDate}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field5}}`
- Anchor text (textBefore): `Nhận thấy`
- Notes: document.issueDate slot exists but no corresponding mustache in DOCX. May be covered by document.issuePlaceAndDateLine. Human review needed.

**Item 4: `{{document.issueDate}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field5}}`
- Anchor text (textBefore): `Nhận thấy`
- Notes: document.issueDate slot exists but no corresponding mustache in DOCX. May be covered by document.issuePlaceAndDateLine. Human review needed.

---

## BM-044 — QĐ thay thế biện pháp tạm giam

**Form number:** 044/HS

**Existing mustaches in template:**
- {{agency.nameUpper}}
- {{detentionReplacement.article1Line}}
- {{detentionReplacement.article2Line}}
- {{detentionReplacement.detentionExtensionLegalBasisLine}}
- {{detentionReplacement.detentionOrderLegalBasisLine}}
- {{detentionReplacement.durationLine}}
- {{detentionReplacement.proposalLine}}
- {{detentionReplacement.reasonLine}}
- {{document.documentCode}}
- {{document.issuePlaceAndDateLine}}
- {{legalBasis.juvenileJusticeLine}}
- {{legalBasis.procedureArticlesLine}}
- {{official.issuingAuthorityLine}}
- {{recipients.archiveLine}}
- {{recipients.executionAgencyLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{agency.parentNameUpper}}` | Tên viết hoa của cơ quan cấp trên | Đây là biến thể của trường đã có (ví dụ: agency.parentNameUpper). Cần người review xác định xem biến thể viết hoa/đầy đủ có cần xuất hiện trong văn bản gốc hay không. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |
| 2 | `{{agency.parentNameUpper}}` | Tên viết hoa của cơ quan cấp trên | Đây là biến thể của trường đã có (ví dụ: agency.parentNameUpper). Cần người review xác định xem biến thể viết hoa/đầy đủ có cần xuất hiện trong văn bản gốc hay không. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{agency.parentNameUpper}}`**
- Trường "agency.parentNameUpper" (Tên viết hoa của cơ quan cấp trên) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.parentNameUpper}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{agency.parentNameUpper}}`**
- Trường "agency.parentNameUpper" (Tên viết hoa của cơ quan cấp trên) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{agency.parentNameUpper}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{agency.parentNameUpper}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `(none)`
- Anchor text (textBefore): `(none)`
- Notes: Agency field slot (agency.parentNameUpper) exists in locked contract but no corresponding mustache in DOCX. Need human review to determine if this variant form should be added.

**Item 2: `{{agency.parentNameUpper}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `(none)`
- Anchor text (textBefore): `(none)`
- Notes: Agency field slot (agency.parentNameUpper) exists in locked contract but no corresponding mustache in DOCX. Need human review to determine if this variant form should be added.

---

## BM-052 — QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm

**Form number:** 052/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{decision.decisionLine2}}
- {{recipients.personLine6}}
- {{recipients.personLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "Căn cứ Quyết định về việc đặt tiền để bảo đảm số … ngày … tháng … năm … của… đối..." | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "Căn cứ Quyết định về việc đặt tiền để bảo đảm số … ngày … tháng … năm … của… đối..." | LOW — sửa an toàn, ít ảnh hưởng layout |
| 3 | `{{document.fullDocumentCode2}}` | Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 4 | `{{document.fullDocumentCode2}}` | Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 3: `{{document.fullDocumentCode2}}`**
- Trường "document.fullDocumentCode2" (Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode2}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 4: `{{document.fullDocumentCode2}}`**
- Trường "document.fullDocumentCode2" (Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode2}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{decision.field2}}`
- Anchor text (textBefore): `Căn cứ Quyết định về việc đặt tiền để bảo đảm số … ngày … tháng … năm … của… đối với`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{decision.field2}}`
- Anchor text (textBefore): `Căn cứ Quyết định về việc đặt tiền để bảo đảm số … ngày … tháng … năm … của… đối với`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 3: `{{document.fullDocumentCode2}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field5}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 4: `{{document.fullDocumentCode2}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field5}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

---

## BM-059 — QĐ gia hạn thời hạn tạm giam để truy tố 1

**Form number:** 059/HS

**Existing mustaches in template:**
- {{accusedDecision.legalBasisLine}}
- {{agency.name}}
- {{agency.parentName}}
- {{caseDecision.legalBasisLine}}
- {{delivery.deliveredAtText}}
- {{delivery.receiverTitle}}
- {{document.documentCode}}
- {{document.issuePlaceAndDateLine}}
- {{legalBasis.juvenileJusticeLine}}
- {{legalBasis.procedureArticlesLine}}
- {{measure.detentionExtensionArticle1Line}}
- {{measure.detentionExtensionArticle2Line}}
- {{measure.detentionExtensionDurationText}}
- {{measure.detentionExtensionFromDateText}}
- {{measure.detentionExtensionReasonLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{recipients.personLine}}` | Dòng tên người nhận thông báo | Script không tìm được anchor text đáng tin cậy trong DOCX. Người review cần đọc DOCX gốc để xác định vị trí ngữ nghĩa đúng. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{recipients.personLine}}` | Dòng tên người nhận thông báo | Script không tìm được anchor text đáng tin cậy trong DOCX. Người review cần đọc DOCX gốc để xác định vị trí ngữ nghĩa đúng. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{recipients.personLine}}`**
- Trường "recipients.personLine" (Dòng tên người nhận thông báo) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{recipients.personLine}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{recipients.personLine}}`**
- Trường "recipients.personLine" (Dòng tên người nhận thông báo) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{recipients.personLine}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{recipients.personLine}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `(none)`
- Anchor text (textBefore): `(none)`
- Notes: recipients.personLine slot exists but no mustache in DOCX. Human review needed to determine if recipient person line should appear in the template.

**Item 2: `{{recipients.personLine}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `(none)`
- Anchor text (textBefore): `(none)`
- Notes: recipients.personLine slot exists but no mustache in DOCX. Human review needed to determine if recipient person line should appear in the template.

---

## BM-060 — QĐ áp giải bị can

**Form number:** 060/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{decision.decisionLine10}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "Xét thấy" | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "Xét thấy" | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `Xét thấy`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `Xét thấy`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

---

## BM-061 — QĐ dẫn giải

**Form number:** 061/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{recipients.personLine3}}
- {{recipients.personLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field3}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field3}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

---

## BM-063 — Biên bản kê biên tài sản

**Form number:** 063/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{document.fullDocumentCode8}}
- {{document.issuePlaceAndDateLine}}
- {{recipients.personLine5}}
- {{recipients.personLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field10}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field10}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

---

## BM-064 — QĐ huỷ bỏ biện pháp kê biên tài sản

**Form number:** 064/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{document.issueDate4}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với" | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với" | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field3}}`
- Anchor text (textBefore): `Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field3}}`
- Anchor text (textBefore): `Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

---

## BM-065 — BB về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản

**Form number:** 065/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{document.fullDocumentCode8}}
- {{recipients.personLine3}}
- {{recipients.personLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{decision.decisionLine}}` | Dòng trích quyết định (số, ngày tháng năm, cơ quan) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{decision.decisionLine}}` | Dòng trích quyết định (số, ngày tháng năm, cơ quan) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 3 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 4 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{decision.decisionLine}}`**
- Trường "decision.decisionLine" (Dòng trích quyết định (số, ngày tháng năm, cơ quan)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{decision.decisionLine}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{decision.decisionLine}}`**
- Trường "decision.decisionLine" (Dòng trích quyết định (số, ngày tháng năm, cơ quan)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{decision.decisionLine}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 3: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 4: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{decision.decisionLine}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{decision.decisionLine}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 3: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field9}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 4: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field9}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

---

## BM-066 — Lệnh phong toả tài khoản

**Form number:** 066/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{document.fullDocumentCode4}}
- {{recipients.personLine4}}
- {{recipients.personLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{decision.decisionLine}}` | Dòng trích quyết định (số, ngày tháng năm, cơ quan) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "…" | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{decision.decisionLine}}` | Dòng trích quyết định (số, ngày tháng năm, cơ quan) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Gần: "…" | LOW — sửa an toàn, ít ảnh hưởng layout |
| 3 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 4 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{decision.decisionLine}}`**
- Trường "decision.decisionLine" (Dòng trích quyết định (số, ngày tháng năm, cơ quan)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{decision.decisionLine}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{decision.decisionLine}}`**
- Trường "decision.decisionLine" (Dòng trích quyết định (số, ngày tháng năm, cơ quan)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{decision.decisionLine}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 3: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 4: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{decision.decisionLine}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `…`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{decision.decisionLine}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `…`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 3: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field6}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 4: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field6}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

---

## BM-067 — Biên bản phong tỏa tài khoản

**Form number:** 067/HS

**Existing mustaches in template:**
- {{agency.name}}
- {{document.fullDocumentCode6}}
- {{recipients.personLine3}}
- {{recipients.personLine}}

### Required Human Edits

| # | Placeholder | Field Meaning | Why Human Required | Suggested Area | Risk |
|---|---|---|---|---|---|
| 1 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 2 | `{{document.fullDocumentCode}}` | Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 3 | `{{document.fullDocumentCode2}}` | Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |
| 4 | `{{document.fullDocumentCode2}}` | Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn) | Wave 04C đã skip vì không tìm được anchor text an toàn trong DOCX. Script không thể tự xác định vị trí ngữ nghĩa đúng để chèn placeholder. | Cần người review tự xác định vị trí trong DOCX dựa trên ngữ cảnh pháp lý | LOW — sửa an toàn, ít ảnh hưởng layout |

### Reviewer Questions

**Item 1: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 2: `{{document.fullDocumentCode}}`**
- Trường "document.fullDocumentCode" (Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 3: `{{document.fullDocumentCode2}}`**
- Trường "document.fullDocumentCode2" (Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode2}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

**Item 4: `{{document.fullDocumentCode2}}`**
- Trường "document.fullDocumentCode2" (Mã văn bản đầy đủ thứ 2 (dùng khi có 2 quyết định được trích dẫn)) đã tồn tại trong locked contract với binding. Có nên xuất hiện trong DOCX không?
- Nếu CÓ: đặt `{{document.fullDocumentCode2}}` ở đâu trong văn bản là ngữ nghĩa nhất?
- Nếu KHÔNG: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?

### Evidence

**Item 1: `{{document.fullDocumentCode}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 2: `{{document.fullDocumentCode}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field2}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 3: `{{document.fullDocumentCode2}}`**
- Issue: `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field9}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.

**Item 4: `{{document.fullDocumentCode2}}`**
- Issue: `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
- Slot tồn tại: YES
- Field tồn tại: YES
- Binding tồn tại: YES
- Placeholder trong DOCX: NO
- rawPattern: `{{document.field9}}`
- Anchor text (textBefore): `(none)`
- Notes: Wave 04C skipped: no safe anchor found in DOCX template. Human authoring required.


---

*End of Human Authoring Packet*
