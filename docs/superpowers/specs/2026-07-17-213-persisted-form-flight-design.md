# Thiết kế Form Flight persisted cho 213 biểu mẫu

## Mục tiêu

Mỗi BM-001 đến BM-213 có một profile UX riêng trong Generated Document Workspace. Profile dùng contract đã lock làm authority cho field, validation và render binding. Lifecycle bắt buộc là tải dữ liệu đã lưu, nhập, lưu theo contract, reload, render DOCX và xuất PDF.

## Vấn đề hiện tại

Registry frontend có panel legacy nhưng payload không thống nhất với legacy DTO whitelist. Bật registry hàng loạt có thể trả HTTP 400 hoặc lưu dữ liệu renderer không đọc. `PublishedContractFormInputsPanel` và `ContractFormInputsSaveAdapter` đã có luồng contract-native nhưng matrix chỉ ghi hai Form Flight profile runtime-ready.

## Lựa chọn

1. Bật 212 panel legacy và mở rộng DTO theo object group: nhanh nhưng sao chép 213 hợp đồng dữ liệu, khó chứng minh renderer mapping và rủi ro regress.
2. Chỉ dùng form generic: an toàn cho save nhưng không đáp ứng adapter/profile riêng theo BM.
3. Chọn Form Flight contract-native: sinh profile riêng cho từng BM từ compiled locked contract, dùng adapter persisted chung. Profile định nghĩa UX; contract định nghĩa data. Đây là hướng đã được phê duyệt.

## Kiến trúc

Mỗi `templateCode` có đúng một `FormFlightProfile` generated từ compiled locked artifact. Profile chứa template code, contract hash, section, field path, control, required state, table metadata, presentation hints và sample data không chứa dữ liệu thật. Generator fail-closed khi thiếu artifact, trùng profile hoặc có field ngoài contract.

`GeneratedDocumentWorkspace` resolve profile theo template của persisted document. Khi profile hợp lệ, nó dùng Form Flight persisted panel chung thay vì panel legacy. Panel tải render payload của đúng document, dựng UI từ profile và contract, lưu qua contract-input route với contract hash và nested data, hiển thị lỗi theo field path, rồi reload và refresh history.

`ContractFormInputsSaveAdapter` giữ authority cho agency scope, contract hash, computed/default/system values và unknown-field rejection. Legacy DTO route không được biến thành whitelist 213 object group. `/templates/:templateCode` vẫn là runtime preview session; `/documents/:id` là persisted document workspace.

## Delivery và evidence

Generator tạo 213 profile rồi kiểm tra invariant toàn corpus. Activation theo batch control/table pattern. Một BM chỉ là `persisted-ready` khi có profile invariant, Clerk-authenticated save/reload, DOCX render, PDF export và artifact assertion. Matrix ghi độc lập profile generated, persisted-ready, fidelity-reviewed và runtime-ready.

## Acceptance

- 213 contracts có đúng một persisted profile hợp lệ.
- Không profile nào có field ngoài contract hoặc làm mất required/control/table rule.
- Mỗi BM có evidence create/select, save, reload, DOCX và PDF.
- Artifact thuộc persisted document đúng ID, history/audit tồn tại.
- Runtime preview vẫn `persisted=false`, không sinh generated document row.
- Không dùng adapter pass để suy ra visual fidelity pass; không dùng allowance để gọi customer-ready.

## Ngoài phạm vi batch đầu

Không sửa locked DOCX, Prisma schema, credential hoặc user-owned worktree changes. Docker secret provisioning, dependency scanner và cleanup worktree là workstream tiếp sau adapter lifecycle.
