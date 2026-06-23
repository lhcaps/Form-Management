# Legal Review Packet — Wave 04E

> Generated: 2026-06-23T08:56:33.392Z
> Items: 2 field-level items requiring legal/form-author review

> **AGENCY POLICY**: Do NOT modify templates without explicit legal reviewer approval.

## Summary

| BM | Field | Risk | Why Legal Review Required |
|---|---|---|---|
| BM-056 | `person.religion` | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout | Privacy/regulatory concern |
| BM-056 | `person.religion` | ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout | Privacy/regulatory concern |

---

## Item 1: BM-056 — `person.religion`

**Template:** QĐ tạm hoãn xuất cảnh
**Form number:** 056/HS
**Issue code:** `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`
**Risk:** ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout

### Why Legal Review Is Required

BM-056 is an exit postponement form for minors ("Biện pháp hoãn xuất cảnh"). Collecting religion data requires legal review of regulatory basis.

### Possible Privacy/Regulatory Concern

- BM-056 là biện pháp tạm hoãn xuất cảnh cho người nước ngoài.
- Thu thập dữ liệu tôn giáo (`person.religion`) yêu cầu căn cứ pháp lý rõ ràng.
- Vietnamese PDPD / GDPR alignment: dữ liệu tôn giáo là dữ liệu nhạy cảm theo quy định.
- Cần xác định: trường này có thực sự cần thiết cho mẫu đơn này không?

### Reviewer Decision Required

- [ ] **APPROVE_ADD**: Cho phép thêm placeholder `{{person.religion}}` vào DOCX.
- [ ] **APPROVE_METADATA_ONLY**: Giữ slot/binding trong locked contract nhưng KHÔNG render vào DOCX.
- [ ] **REMOVE**: Xoá slot và binding khỏi contract (yêu cầu form-author action sau).
- [ ] **DEFER**: Chuyển sang wave sau.

### Evidence

- Slot tồn tại trong locked contract: **YES**
- Field tồn tại: **YES**
- Binding tồn tại: **YES**
- Placeholder trong DOCX: **NO**
- rawPattern: `(none)`
- textBefore: `(none)`


---

## Item 2: BM-056 — `person.religion`

**Template:** QĐ tạm hoãn xuất cảnh
**Form number:** 056/HS
**Issue code:** `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`
**Risk:** ⚠ MEDIUM — sửa cẩn thận, ảnh hưởng layout

### Why Legal Review Is Required

BM-056 is an exit postponement form for minors ("Biện pháp hoãn xuất cảnh"). Collecting religion data requires legal review of regulatory basis.

### Possible Privacy/Regulatory Concern

- BM-056 là biện pháp tạm hoãn xuất cảnh cho người nước ngoài.
- Thu thập dữ liệu tôn giáo (`person.religion`) yêu cầu căn cứ pháp lý rõ ràng.
- Vietnamese PDPD / GDPR alignment: dữ liệu tôn giáo là dữ liệu nhạy cảm theo quy định.
- Cần xác định: trường này có thực sự cần thiết cho mẫu đơn này không?

### Reviewer Decision Required

- [ ] **APPROVE_ADD**: Cho phép thêm placeholder `{{person.religion}}` vào DOCX.
- [ ] **APPROVE_METADATA_ONLY**: Giữ slot/binding trong locked contract nhưng KHÔNG render vào DOCX.
- [ ] **REMOVE**: Xoá slot và binding khỏi contract (yêu cầu form-author action sau).
- [ ] **DEFER**: Chuyển sang wave sau.

### Evidence

- Slot tồn tại trong locked contract: **YES**
- Field tồn tại: **YES**
- Binding tồn tại: **YES**
- Placeholder trong DOCX: **NO**
- rawPattern: `(none)`
- textBefore: `(none)`


---

*End of Legal Review Packet*
