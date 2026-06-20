# Quy trình hoàn thiện một hoặc nhiều biểu mẫu BM

Mục tiêu của quy trình này là hoàn thiện có bằng chứng từng mã BM, không đánh
đồng “đã có asset” với “đã đúng nghiệp vụ”.

## Đầu vào bắt buộc

- Danh sách mã, ví dụ `BM-004` hoặc `BM-004,BM-027`.
- DOC/DOCX gốc và normalized DOCX đúng mã.
- V1 contract đã trích xuất của đúng `sourceId`.
- Component legacy hiện tại để đối chiếu hành vi đang dùng.

## Definition of Done cho từng BM

1. Chọn đúng nguồn canonical; nguồn trùng được ghi nhận là alternate provenance.
2. Đọc trực tiếp DOCX, lập danh sách field, slot, bảng, checkbox và phần lặp.
3. Đối chiếu V1 contract; sửa field key, control type, required, source và binding.
4. Mở Form Studio từ `open-design`; không dùng runtime resolver để khởi tạo.
5. Thử thêm/sửa/xóa field, đổi control và chọn lại DOCX slot.
6. Preview bằng đúng normalized DOCX; package Word không mất part.
7. Không còn placeholder chưa giải quyết, literal `undefined` hoặc `null`.
8. Chạy quality gate theo đúng danh sách mã:

```powershell
pnpm audit:form-authoring-baselines -- --codes BM-004,BM-027
```

9. Reviewer đọc DOCX và xác nhận semantic/legal fidelity.
10. Chỉ sau review mới submit, approve và publish. Draft không được đưa vào
    normal-user runtime.

## Phân loại kết quả

- `LOCKED_VERIFIED`: đã có locked evidence/human review.
- `EXTRACTED_NEEDS_REVIEW`: mở và chỉnh được, nhưng extraction còn cần người
  đối chiếu.
- `GENERIC_FALLBACK`: chỉ có nền DOCX hoặc legacy generic; chưa được coi là
  hoàn thiện chi tiết.

File evidence cho đợt chọn mã được sinh tại
`docs/audit/form-authoring-baselines/selection-<codes>.md` và `.csv`.
