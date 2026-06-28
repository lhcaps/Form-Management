# BM-096 Contract Repair Evidence

Mode: EVIDENCE_ONLY

## Summary

| Metric | Value |
| --- | --- |
| DOCX placeholders total | 22 |
| DOCX placeholders unique | 18 |
| Contract slots | 18 |
| Canonical fields | 18 |
| Render bindings | 18 |
| Mismatch count | 0 |

## Baseline Findings

- TEMPLATE_PLACEHOLDER_WITHOUT_SLOT
- CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER
- BINDING_WITHOUT_TEMPLATE_PLACEHOLDER

## Structural Mismatches

| Type | Count | Items |
| --- | --- | --- |
| templatePlaceholdersWithoutSlots | 0 |  |
| contractSlotsWithoutTemplatePlaceholders | 0 |  |
| bindingsWithoutTemplatePlaceholders | 0 |  |
| slotsWithoutBindings | 0 |  |
| bindingsWithoutSlots | 0 |  |
| slotsWithoutCanonicalFields | 0 |  |
| fieldsWithoutSlots | 0 |  |

## DOCX Placeholder Context

| Placeholder | Count | Context |
| --- | --- | --- |
| agency.diaDanh | 1 | … tháng … năm … , nếu có) của … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự; Xét thấy 8 {{document.soYeu}} {{agency.diaDanh}} {{document.ngayBan}} YÊU CẦU: Cơ quan , người có thẩm quyền 9 … ra Quyết định khởi tố bị can đối với : Họ tên: 10 {{rec |
| agency.dongDia | 1 | U CẦU: Cơ quan , người có thẩm quyền 9 … ra Quyết định khởi tố bị can đối với : Họ tên: 10 {{recipients.personLine}} …… {{agency.dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document |
| agency.vienKiem | 4 | 6 /TT-VKSTC ngày / /202 6 ) Mẫu số 9 6 /HS (Ban hành theo Thông tư số /202 6 /TT-VKSTC ngày / /202 6 ) VIỆN KIỂM SÁT … {{agency.vienKiem}} 513080 15240 Số : …/QĐ-VKS…- … CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc 936625 26670 … , ngày … t |
| document.chuThe | 1 | ười có thẩm quyền 9 … ra Quyết định khởi tố bị can đối với : Họ tên: 10 {{recipients.personLine}} …… {{agency.dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/T |
| document.diaChi | 1 | ocument.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.lyDo}} {{recipients.luuHo}} Nơi thường trú: {{signature.cheDo}} {{signature.chucVu}} Nơi tạm trú: {{signat |
| document.lyDo | 1 | on.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.lyDo}} {{recipients.luuHo}} Nơi thường trú: {{signature.cheDo}} {{signature.chucVu}} Nơi tạm trú: {{signature.nguoiKy}} {{agen |
| document.namSinh | 1 | .dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.lyDo}} {{recipients.luuHo}} Nơi thường trú: {{signat |
| document.ngayBan | 1 | ếu có) của … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự; Xét thấy 8 {{document.soYeu}} {{agency.diaDanh}} {{document.ngayBan}} YÊU CẦU: Cơ quan , người có thẩm quyền 9 … ra Quyết định khởi tố bị can đối với : Họ tên: 10 {{recipients.personLine}} |
| document.soYeu | 2 | hình sự số … ngày … tháng … năm … , nếu có) của … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự; Xét thấy 8 {{document.soYeu}} {{agency.diaDanh}} {{document.ngayBan}} YÊU CẦU: Cơ quan , người có thẩm quyền 9 … ra Quyết định khởi tố bị can đối với |
| document.tenVu | 1 | tố bị can đối với : Họ tên: 10 {{recipients.personLine}} …… {{agency.dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaC |
| legalBasis.canCu | 1 | … ra Quyết định khởi tố bị can đối với : Họ tên: 10 {{recipients.personLine}} …… {{agency.dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chi |
| person.hoTen | 1 | ients.personLine}} …… {{agency.dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.lyDo}} {{recipient |
| person.toiDanh | 1 | Họ tên: 10 {{recipients.personLine}} …… {{agency.dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.l |
| recipients.luuHo | 1 | son.hoTen}} Nghề nghiệp: {{document.namSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.lyDo}} {{recipients.luuHo}} Nơi thường trú: {{signature.cheDo}} {{signature.chucVu}} Nơi tạm trú: {{signature.nguoiKy}} {{agency.vienKiem}} …… Về t |
| recipients.personLine | 1 | anh}} {{document.ngayBan}} YÊU CẦU: Cơ quan , người có thẩm quyền 9 … ra Quyết định khởi tố bị can đối với : Họ tên: 10 {{recipients.personLine}} …… {{agency.dongDia}} {{document.chuThe}} {{legalBasis.canCu}} {{document.tenVu}} {{person.toiDanh}} {{person.hoTen}} N |
| signature.cheDo | 1 | amSinh}} Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.lyDo}} {{recipients.luuHo}} Nơi thường trú: {{signature.cheDo}} {{signature.chucVu}} Nơi tạm trú: {{signature.nguoiKy}} {{agency.vienKiem}} …… Về tội … quy định tại khoản … Điều … của |
| signature.chucVu | 1 | CCCD/Thẻ CC/Hộ chiếu: {{document.diaChi}} C {{document.lyDo}} {{recipients.luuHo}} Nơi thường trú: {{signature.cheDo}} {{signature.chucVu}} Nơi tạm trú: {{signature.nguoiKy}} {{agency.vienKiem}} …… Về tội … quy định tại khoản … Điều … của Bộ luật Hình sự để t |
| signature.nguoiKy | 1 | diaChi}} C {{document.lyDo}} {{recipients.luuHo}} Nơi thường trú: {{signature.cheDo}} {{signature.chucVu}} Nơi tạm trú: {{signature.nguoiKy}} {{agency.vienKiem}} …… Về tội … quy định tại khoản … Điều … của Bộ luật Hình sự để tiến hành điều tra theo quy định của |
