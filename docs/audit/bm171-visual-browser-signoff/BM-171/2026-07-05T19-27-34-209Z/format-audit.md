# DOCX Format Audit

**Overall Status**: `warning`

| Check ID | Requirement | Status | Evidence |
|----------|-------------|--------|---------|
| FMT-001 | Times New Roman size 13 baseline | `pass` | Times New Roman found; Normal style unavailable |
| FMT-002 | Header: VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH | `pass` | Agency header found in document XML |
| FMT-003 | Header: VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 bold | `pass` | KHU VỰC 7 found; bold tag proximity: true |
| FMT-004 | Underline under KHU VỰC 7 only (not full line) | `not_detectable` | Underline not detectable from OOXML proximity check |
| FMT-005 | Legal basis line size 8 (w:sz val=16 in half-points) | `pass` | Legal basis line found; font size 8 proximity check |
| FMT-006 | Quốc hiệu size 13 | `pass` | National motto found in document XML |
| FMT-007 | Độc lập - Tự do - Hạnh phúc size 14 | `pass` | Motto found; size 14 (w:val=28) proximity check |
| FMT-008 | Underline under motto matches exact line width | `not_detectable` | Underline not detectable from OOXML proximity check |
| FMT-009 | Issue date line italic size 14 | `pass` | Issue date pattern found in document XML |
| FMT-010 | Số... line and ngày/tháng/năm line on same horizontal level | `not_detectable` | Số line found; horizontal alignment requires visual/PDF pipeline |
| FMT-011 | Body titles / main title bold size 14 | `pass` | Known title runs=2, bold14=true |
| FMT-012 | Điều 1, Điều 2, or section headings 1., 2. bold | `pass` | 2/7 Điều/section runs are bold |
| FMT-013 | Footer: Nơi nhận: bold italic size 12 | `not_detectable` | - |
| FMT-014 | Footer recipient lines size 11 | `warning` | Nơi nhận paragraph found but no sz=22 in same paragraph |
| FMT-015 | Signature title bold size 14; 2-3 lines between title and name | `pass` | 2/2 signature title runs are bold+sz14 |
| FMT-016 | Page number present for documents > 2 pages | `not_detectable` | - |
| FMT-017 | Different First Page section property enabled | `not_detectable` | w:titlePg not found in document section properties |
| FMT-018 | BM-001 receiver identity legal content uses explicit black text | `not_applicable` | BM-001 identifying text not present |
| FMT-019 | BM-001 Mẫu số 01/HS form note uses explicit black text at 8pt | `not_applicable` | BM-001 Mẫu số 01/HS textbox not present |