# QLLAW 213 Form Input Linkage Matrix — latest

> **Generated**: 2026-07-07T20:26:36.159Z
> **Total forms**: 213

## Counts

| Status | Count |
|---|---|
| INPUT_CONNECTED_PASS | 2 |
| INPUT_CONNECTED_PARTIAL | 211 |
| FIDELITY_PENDING | 0 |
| ROUTE_BLOCKED | 0 |
| CONTRACT_BLOCKED | 0 |
| PREVIEW_BLOCKED | 0 |

## Runtime-ux profiles registered

- Profiles registered: BM-001, BM-002, BM-003, BM-004, BM-005, BM-006, BM-007, BM-008, BM-009, BM-010, BM-011, BM-012, BM-013, BM-014, BM-015, BM-016, BM-017, BM-018, BM-019, BM-020, BM-021, BM-022, BM-023, BM-024, BM-025, BM-026, BM-027, BM-028, BM-029, BM-030, BM-031, BM-032, BM-033, BM-034, BM-035, BM-036, BM-037, BM-038, BM-039, BM-040, BM-041, BM-042, BM-043, BM-044, BM-045, BM-046, BM-047, BM-048, BM-049, BM-050, BM-051, BM-052, BM-053, BM-054, BM-055, BM-056, BM-057, BM-058, BM-059, BM-060, BM-061, BM-062, BM-063, BM-064, BM-065, BM-066, BM-067, BM-068, BM-069, BM-070, BM-071, BM-072, BM-073, BM-074, BM-075, BM-076, BM-077, BM-078, BM-079, BM-080, BM-081, BM-082, BM-083, BM-084, BM-085, BM-086, BM-087, BM-088, BM-089, BM-090, BM-091, BM-092, BM-093, BM-094, BM-095, BM-096, BM-097, BM-098, BM-099, BM-100, BM-101, BM-102, BM-103, BM-104, BM-105, BM-106, BM-107, BM-108, BM-109, BM-110, BM-111, BM-112, BM-113, BM-114, BM-115, BM-116, BM-117, BM-118, BM-119, BM-120, BM-121, BM-122, BM-123, BM-124, BM-125, BM-126, BM-127, BM-128, BM-129, BM-130, BM-131, BM-132, BM-133, BM-134, BM-135, BM-136, BM-137, BM-138, BM-139, BM-140, BM-141, BM-142, BM-143, BM-144, BM-145, BM-146, BM-147, BM-148, BM-149, BM-150, BM-151, BM-152, BM-153, BM-154, BM-155, BM-156, BM-157, BM-158, BM-159, BM-160, BM-161, BM-162, BM-163, BM-164, BM-165, BM-166, BM-167, BM-168, BM-169, BM-170, BM-171, BM-172, BM-173, BM-174, BM-175, BM-176, BM-177, BM-178, BM-179, BM-180, BM-181, BM-182, BM-183, BM-184, BM-185, BM-186, BM-187, BM-188, BM-189, BM-190, BM-191, BM-192, BM-193, BM-194, BM-195, BM-196, BM-197, BM-198, BM-199, BM-200, BM-201, BM-202, BM-203, BM-204, BM-205, BM-206, BM-207, BM-208, BM-209, BM-210, BM-211, BM-212, BM-213
- Runtime-ready allowlist: BM-001, BM-171
- Form-flight profiles: 213
- Legacy components: 213

> NOTE: `apps/web/src/features/forms-contracts/sample-data.ts` still contains legacy stale tokens (`Nguyễn Văn A`, `Trần Thị B`, etc.) in its `SAMPLE_REGISTRY`. The Phase-4 runtime-ux profile generator removes the runtime dependency on this path, but the file is not deleted to preserve the fall-through heuristic for any form that genuinely lacks a profile.

## Per-form linkage

| Code | Title | Sections | Fields | Required | Profile | Smart | Stale tokens | Status |
|---|---|---:|---:|---:|---|---:|---|---|
| BM-001 | Biên bản tiếp nhận nguồn tin về tội phạm | 6 | 39 | 38 | YES | 13 | — | INPUT_CONNECTED_PASS |
| BM-002 | Phiếu chuyển nguồn tin về tội phạm | 8 | 30 | 29 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-003 | QĐ phân công THQCT, KS việc tiếp nhận, giải quyết nguồn tin  | 7 | 14 | 14 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-004 | QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-005 | Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm | 4 | 16 | 13 | YES | 9 | — | INPUT_CONNECTED_PARTIAL |
| BM-006 | Yêu cầu tiếp nhận, kiểm tra, xác minh, ra QĐ giải quyết nguồ | 3 | 15 | 15 | YES | 6 | — | INPUT_CONNECTED_PARTIAL |
| BM-007 | Yêu cầu cung cấp tài liệu để kiểm sát việc giải quyết nguồn  | 4 | 17 | 14 | YES | 5 | — | INPUT_CONNECTED_PARTIAL |
| BM-008 | Yêu cầu chuyển nguồn tin về tội phạm | 3 | 14 | 14 | YES | 4 | — | INPUT_CONNECTED_PARTIAL |
| BM-009 | QĐ gia hạn thời hạn giải quyết nguồn tin về tội phạm | 5 | 16 | 16 | YES | 8 | — | INPUT_CONNECTED_PARTIAL |
| BM-010 | QĐ tạm đình chỉ giải quyết nguồn tin về tội phạm | 4 | 15 | 15 | YES | 6 | — | INPUT_CONNECTED_PARTIAL |
| BM-011 | QĐ huỷ bỏ QĐ tạm đình chỉ việc giải quyết nguồn tin về tội p | 4 | 15 | 15 | YES | 6 | — | INPUT_CONNECTED_PARTIAL |
| BM-012 | QĐ phục hồi giải quyết nguồn tin | 4 | 14 | 14 | YES | 4 | — | INPUT_CONNECTED_PARTIAL |
| BM-013 | QĐ giải quyết tranh chấp về thẩm quyền giải quyết nguồn tin | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-014 | QĐ trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội | 5 | 19 | 17 | YES | 8 | — | INPUT_CONNECTED_PARTIAL |
| BM-015 | KH trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin v | 8 | 28 | 27 | YES | 18 | — | INPUT_CONNECTED_PARTIAL |
| BM-016 | KL trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin v | 7 | 30 | 29 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-017 | Yêu cầu khởi tố vụ án hình sự | 4 | 14 | 14 | YES | 6 | — | INPUT_CONNECTED_PARTIAL |
| BM-018 | Yêu cầu ra QĐ thay đổi QĐ khởi tố vụ án hình sự | 4 | 17 | 17 | YES | 8 | — | INPUT_CONNECTED_PARTIAL |
| BM-019 | Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự | 5 | 17 | 17 | YES | 2 | — | INPUT_CONNECTED_PARTIAL |
| BM-020 | Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố | 4 | 13 | 13 | YES | 5 | — | INPUT_CONNECTED_PARTIAL |
| BM-021 | QĐ không khởi tố vụ án hình sự | 1 | 7 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-022 | QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự | 2 | 4 | 0 | YES | 1 | — | INPUT_CONNECTED_PARTIAL |
| BM-023 | QĐ khởi tố vụ án hình sự | 5 | 17 | 17 | YES | 5 | — | INPUT_CONNECTED_PARTIAL |
| BM-024 | QĐ thay đổi QĐ khởi tố vụ án hình sự | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-025 | QĐ bổ sung QĐ khởi tố vụ án hình sự | 2 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-026 | QĐ huỷ bỏ QĐ khởi tố vụ án hình sự | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-027 | Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-028 | QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự | 1 | 8 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-029 | QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố vụ án hình sự | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-030 | Thông báo kết quả giải quyết nguồn tin về tội phạm | 5 | 14 | 14 | YES | 5 | — | INPUT_CONNECTED_PARTIAL |
| BM-031 | QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp | 5 | 16 | 15 | YES | 7 | — | INPUT_CONNECTED_PARTIAL |
| BM-032 | QĐ không phê chuẩn Lệnh bắt người bị giữ trong trường hợp kh | 2 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-033 | QĐ phê chuẩn QĐ gia hạn tạm giữ | 5 | 21 | 20 | YES | 11 | — | INPUT_CONNECTED_PARTIAL |
| BM-034 | QĐ không phê chuẩn QĐ gia hạn tạm giữ | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-035 | QĐ huỷ bỏ QĐ tạm giữ, quyết định gia hạn tạm giữ | 1 | 3 | 0 | YES | 1 | — | INPUT_CONNECTED_PARTIAL |
| BM-036 | QĐ trả tự do cho người bị tạm giữ | 1 | 9 | 0 | YES | 4 | — | INPUT_CONNECTED_PARTIAL |
| BM-037 | QĐ phê chuẩn Lệnh bắt bị can để tạm giam | 5 | 19 | 18 | YES | 8 | Nguyễn Văn A | INPUT_CONNECTED_PARTIAL |
| BM-038 | QĐ không phê chuẩn Lệnh bắt bị can để tạm giam | 5 | 20 | 19 | YES | 9 | — | INPUT_CONNECTED_PARTIAL |
| BM-039 | Lệnh bắt bị can bị tạm giam | 6 | 40 | 37 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-040 | QĐ phê chuẩn Lệnh tạm giam | 5 | 20 | 19 | YES | 9 | — | INPUT_CONNECTED_PARTIAL |
| BM-041 | QĐ không phê chuẩn Lệnh tạm giam | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-042 | QĐ gia hạn tạm giam | 5 | 23 | 22 | YES | 10 | — | INPUT_CONNECTED_PARTIAL |
| BM-043 | QĐ huỷ bỏ biện pháp tạm giam | 5 | 19 | 18 | YES | 9 | Nguyễn Thị Hồng Hạnh | INPUT_CONNECTED_PARTIAL |
| BM-044 | QĐ thay thế biện pháp tạm giam | 6 | 21 | 20 | YES | 9 | — | INPUT_CONNECTED_PARTIAL |
| BM-045 | QĐ phê chuẩn QĐ về việc bảo lĩnh | 5 | 20 | 19 | YES | 9 | — | INPUT_CONNECTED_PARTIAL |
| BM-046 | QĐ không phê chuẩn QĐ về việc bảo lĩnh | 5 | 20 | 19 | YES | 9 | — | INPUT_CONNECTED_PARTIAL |
| BM-047 | QĐ về việc bảo lĩnh | 6 | 34 | 31 | YES | 9 | — | INPUT_CONNECTED_PARTIAL |
| BM-048 | QĐ huỷ bỏ biện pháp bảo lĩnh | 1 | 8 | 0 | YES | 2 | — | INPUT_CONNECTED_PARTIAL |
| BM-049 | QĐ phê chuẩn QĐ về việc đặt tiền để bảo đảm | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-050 | QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-051 | QĐ về việc đặt tiền để bảo đảm | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-052 | QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm | 3 | 9 | 1 | YES | 2 | — | INPUT_CONNECTED_PARTIAL |
| BM-053 | Lệnh cấm đi khỏi nơi cư trú | 8 | 34 | 27 | YES | 12 | — | INPUT_CONNECTED_PARTIAL |
| BM-054 | Thông báo về việc áp dụng biện pháp cấm đi khỏi nơi cư trú | 7 | 28 | 25 | YES | 6 | — | INPUT_CONNECTED_PARTIAL |
| BM-055 | QĐ huỷ bỏ biện pháp cấm đi khỏi nơi cư trú | 7 | 33 | 30 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-056 | QĐ tạm hoãn xuất cảnh | 7 | 29 | 26 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-057 | QĐ huỷ bỏ biện pháp tạm hoãn xuất cảnh | 6 | 28 | 25 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-058 | Lệnh tạm giam | 7 | 36 | 31 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-059 | QĐ gia hạn thời hạn tạm giam để truy tố 1 | 8 | 40 | 37 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-060 | QĐ áp giải bị can | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-061 | QĐ dẫn giải | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-062 | Lệnh kê biên tài sản | 6 | 20 | 2 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-063 | Biên bản kê biên tài sản | 5 | 16 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-064 | QĐ huỷ bỏ biện pháp kê biên tài sản | 2 | 3 | 1 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-065 | BB về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-066 | Lệnh phong toả tài khoản | 6 | 12 | 1 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-067 | Biên bản phong tỏa tài khoản | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-068 | QĐ huỷ bỏ biện pháp phong toả tài khoản | 1 | 14 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-069 | BB về việc hủy bỏ biện pháp phong tỏa tài khoản | 1 | 14 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-070 | QĐ phân công PVT THQCT, KS việc giải quyết VAHS | 4 | 17 | 17 | YES | 4 | — | INPUT_CONNECTED_PARTIAL |
| BM-071 | QĐ phân công KSV, KTV THQCT, KS việc giải quyết VAHS | 5 | 19 | 18 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-072 | QĐ thay đổi VT, PVT, KSV, KTV THQCT, KS việc giải quyết vụ á | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-073 | Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền  | 3 | 5 | 3 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-074 | Yêu cầu cử người phiên dịch, người dịch thuật | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-075 | Đề nghị thay đổi người phiên dịch, người dịch thuật | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-076 | QĐ thay đổi người phiên dịch, người dịch thuật | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-077 | Yêu cầu, đề nghị cử người bào chữa | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-078 | Thông báo người bào chữa | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-079 | Thông báo huỷ bỏ việc đăng ký bào chữa | 1 | 1 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-080 | Thông báo từ chối việc đăng ký bào chữa | 2 | 7 | 1 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-081 | QĐ thời điểm người bào chữa tham gia tố tụng | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-082 | Thông báo về thời gian, địa điểm tiến hành tố tụng cho người | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-083 | Yêu cầu thay đổi người giám định, người định giá tài sản | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-084 | QĐ thay đổi người giám định, người định giá tài sản | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-085 | QĐ chuyển vụ án hình sự để điều tra theo thẩm quyền | 5 | 19 | 17 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-086 | QĐ chuyển việc thực hiện thẩm quyền thực hành quyền công tố, | 5 | 18 | 18 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-087 | Yêu cầu điều tra | 1 | 7 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-088 | QĐ huỷ bỏ QĐ nhập vụ án hình sự | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-089 | QĐ huỷ bỏ QĐ tách vụ án hình sự | 1 | 1 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-090 | QĐ phê chuẩn QĐ khởi tố bị can | 5 | 18 | 17 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-091 | QĐ phê chuẩn QĐ thay đổi QĐ khởi tố bị can | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-092 | QĐ phê chuẩn QĐ bổ sung QĐ khởi tố bị can | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-093 | QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố bị can | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-094 | QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố bị can | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-095 | QĐ huỷ bỏ QĐ huỷ bỏ QĐ khởi tố bị can | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-096 | Yêu cầu ra QĐ khởi tố bị can | 1 | 18 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-097 | QĐ khởi tố bị can | 7 | 32 | 26 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-098 | Yêu cầu ra QĐ thay đổi quyết định khởi tố bị can | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-099 | QĐ thay đổi QĐ khởi tố bị can | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-100 | Yêu cầu ra QĐ bổ sung QĐ khởi tố bị can | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-101 | QĐ bổ sung QĐ khởi tố bị can | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-102 | QĐ huỷ bỏ QĐ khởi tố bị can | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-103 | Đề nghị gia hạn thời hạn điều tra | 4 | 21 | 21 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-104 | quyết định gia hạn thời hạn điều tra VAHS | 5 | 18 | 18 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-105 | QĐ không gia hạn thời hạn điều tra VAHS | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-106 | Yêu cầu truy nã bị can | 1 | 11 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-107 | QĐ huỷ bỏ QĐ tạm đình chỉ điều tra VAHS | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-108 | QĐ huỷ bỏ QĐ tạm đình chỉ điều tra bị can | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-109 | QĐ huỷ bỏ QĐ tạm đình chỉ điều tra VAHS đối với bị can | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-110 | QĐ huỷ bỏ QĐ đình chỉ điều tra VAHS | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-111 | QĐ huỷ bỏ QĐ đình chỉ điều tra bị can | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-112 | QĐ huỷ bỏ QĐ đình chỉ điều tra VAHS đối với bị can | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-113 | Yêu cầu phục hồi điều tra VAHS | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-114 | Yêu cầu phục hồi điều tra bị can | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-115 | Yêu cầu phục hồi điều tra VAHS đối với bị can | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-116 | QĐ phục hồi điều tra vụ án hình sự | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-117 | QĐ phục hồi điều tra bị can | 1 | 12 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-118 | QĐ phục hồi điều tra VA đối với bị can | 1 | 12 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-119 | QĐ phê chuẩn Lệnh khám xét | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-120 | QĐ không phê chuẩn Lệnh khám xét | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-121 | QĐ phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu p | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-122 | QĐ không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-123 | QĐ thực nghiệm điều tra | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-124 | Biên bản thực nghiệm điều tra | 1 | 1 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-125 | Thông báo về việc không chấp nhận đề nghị trưng cầu giám địn | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-126 | QĐ trưng cầu giám định | 1 | 11 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-127 | Yêu cầu định giá tài sản | 1 | 7 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-128 | Thông báo nội dung kết luận giám định, định giá tài sản | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-129 | QĐ trưng cầu giám định bổ sung | 1 | 7 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-130 | QĐ trưng cầu giám định lại | 1 | 7 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-131 | Yêu cầu định giá lại tài sản | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-132 | QĐ định giá lại tài sản trong trường hợp đặc biệt | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-133 | QĐ giám định lại trong trường hợp đặc biệt | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-134 | BB ghi lời khai | 1 | 10 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-135 | BB hỏi cung bị can | 1 | 10 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-136 | BB đối chất | 1 | 17 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-137 | Biên bản xác minh-làm việc | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-138 | Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng  | 1 | 7 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-139 | Kiến nghị khắc phục vi phạm trong hoạt động khởi tố, điều tr | 2 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-140 | Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm p | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-141 | QĐ chuyển vụ án để truy tố | 5 | 19 | 19 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-142 | Quyết định nhập vụ án hình sự trong giai đoạn truy tố | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-143 | Quyết định tách vụ án hình sự trong giai đoạn truy tố | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-144 | QĐ gia hạn thời hạn QĐ việc truy tố | 5 | 17 | 17 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-145 | QĐ trả hồ sơ vụ án để điều tra bổ sung | 5 | 21 | 20 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-146 | QĐ tạm đình chỉ vụ án | 5 | 18 | 17 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-147 | QĐ huỷ bỏ QĐ tạm đình chỉ vụ án | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-148 | QĐ tạm đình chỉ vụ án đối với bị can | 6 | 30 | 27 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-149 | QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-150 | QĐ đình chỉ vụ án | 5 | 22 | 22 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-151 | QĐ huỷ bỏ QĐ đình chỉ vụ án | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-152 | QĐ đình chỉ vụ án đối với bị can | 1 | 9 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-153 | QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can | 1 | 5 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-154 | QĐ phục hồi vụ án | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-155 | QĐ phục hồi vụ án đối với bị can | 1 | 15 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-156 | Cáo trạng | 5 | 41 | 28 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-157 | Bản kê vật chứng kèm theo Cáo trạng | 1 | 1 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-158 | Danh sách đề nghị triệu tập đến phiên tòa | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-159 | QĐ phân công VKS cấp dưới THQCT, KS xét xử VAHS | 5 | 15 | 15 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-160 | Biên bản niêm yết công khai văn bản tố tụng | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-161 | Phiếu yêu cầu trích xuất | 1 | 8 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-162 | Giấy mời | 1 | 8 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-163 | Giấy triệu tập | 1 | 11 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-164 | BB giao nhận Cáo trạng, QĐ truy tố theo thủ tục rút gọn, QĐ  | 1 | 9 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-165 | Thông báo về việc vụ án có bị can bị tạm giam | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-166 | QĐ trả hồ sơ vụ án để điều tra lại | 5 | 14 | 14 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-167 | Thông báo về việc trả hồ sơ, ban hành cáo trạng | 2 | 2 | 1 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-168 | BB giao nhận hồ sơ vụ án, vụ việc | 2 | 14 | 14 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-169 | QĐ xử lý vật chứng | 5 | 20 | 20 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-170 | QĐ huỷ bỏ QĐ xử lý vật chứng | 5 | 17 | 17 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-171 | QĐ trả lại tài sản | 6 | 34 | 31 | YES | 0 | Nguyễn Văn A;Trần Thị B | INPUT_CONNECTED_PASS |
| BM-172 | QĐ huỷ bỏ QĐ trả lại tài sản | 6 | 34 | 31 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-173 | QĐ chuyển vật chứng | 5 | 16 | 16 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-174 | Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt | 1 | 11 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-175 | QĐ phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-176 | QĐ không phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc | 1 | 7 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-177 | QĐ gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc b | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-178 | QĐ huỷ bỏ QĐ áp dụng biện pháp điều tra tố tụng đặc biệt | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-179 | QĐ áp dụng biện pháp chữa bệnh | 1 | 9 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-180 | QĐ đình chỉ thi hành biện pháp bắt buộc chữa bệnh | 1 | 10 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-181 | QĐ áp dụng thủ tục rút gọn | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-182 | QĐ huỷ bỏ QĐ áp dụng thủ tục rút gọn 1 | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-183 | QĐ truy tố theo thủ tục rút gọn | 1 | 9 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-184 | Đề nghị áp dụng biện pháp bảo vệ | 1 | 13 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-185 | Yêu cầu lập Báo cáo điều tra xã hội bổ sung | 1 | 6 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-186 | Thông báo áp dụng thủ tục xử lý chuyển hướng | 1 | 20 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-187 | Yêu cầu NLCTXH xây dựng kế hoạch XLCH hoặc kế hoạch XLCH bổ  | 1 | 16 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-188 | Đề nghị Tòa án giải quyết vấn đề bồi thường thiệt hại | 1 | 18 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-189 | Yêu cầu CQĐT đề nghị TA xem xét áp dụng biện pháp giáo dục t | 1 | 17 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-190 | Đề nghị Tòa án xem xét, quyết định áp dụng biện pháp giáo dụ | 1 | 19 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-191 | Quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồn | 1 | 18 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-192 | Quyết định không áp dụng biện pháp xử lý chuyển hướng tại cộ | 1 | 17 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-193 | Quyết định thay đổi biện pháp xử lý chuyển hướng tại cộng đồ | 1 | 16 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-194 | Quyết định hủy bỏ quyết định áp dụng biện pháp xử lý chuyển  | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-195 | Quyết định hủy bỏ quyết định không áp dụng biện pháp xử lý c | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-196 | Quyết định mở phiên họp xem xét, áp dụng biện pháp xử lý chu | 1 | 20 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-197 | BB phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồn | 1 | 13 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-198 | Quyết định hoãn phiên họp xem xét, quyết định áp dụng BPXLCH | 1 | 3 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-199 | Kiến nghị về quyết định áp dụng BPXLCH của Tòa án - Copy | 1 | 20 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-200 | Thông báo tiếp nhận khiếu nại, kiến nghị cân nhắc tính cần t | 1 | 2 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-201 | Quyết định giải quyết khiếu nại, kiến nghị | 1 | 17 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-202 | Quyết định đình chỉ việc giải quyết khiếu nại, kiến nghị | 1 | 4 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-203 | Thông báo về hoạt động tố tụng | 1 | 21 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-204 | QĐ việc tham gia tố tụng của người đại diện, tổ chức | 1 | 10 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-205 | Thông báo áp dụng biện pháp ngăn chặn đối với NCTN | 1 | 16 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-206 | Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - | 1 | 15 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-207 | Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát đ | 1 | 15 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-208 | Quyết định không phê chuẩn quyết định áp dụng biện pháp giám | 1 | 15 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-209 | Quyết định áp dụng biện pháp giám sát bởi người đại diện | 1 | 14 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-210 | Quyết định thay đổi người đại diện | 1 | 12 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-211 | Thông báo về việc thụ lý vụ án | 1 | 21 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-212 | Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa | 1 | 25 | 0 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |
| BM-213 | Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN | 5 | 28 | 22 | YES | 0 | — | INPUT_CONNECTED_PARTIAL |

## Profile issues (fields/keys missing from contract)
- BM-037 (status=INPUT_CONNECTED_PARTIAL)
  - stale tokens in profile: Nguyễn Văn A
- BM-043 (status=INPUT_CONNECTED_PARTIAL)
  - stale tokens in profile: Nguyễn Thị Hồng Hạnh
- BM-171 (status=INPUT_CONNECTED_PASS)
  - stale tokens in profile: Nguyễn Văn A / Trần Thị B
