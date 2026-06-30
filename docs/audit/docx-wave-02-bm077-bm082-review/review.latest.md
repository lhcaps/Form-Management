# DOCX Wave 02 — BM-077 / BM-082 Review

**Reviewed:** 2026-06-26 by Le Huy
**Source evidence:** Rendered DOCX XML from `.cache/f2-rendered-docx/BM-077.bin` and `BM-082.bin`

---

## W2R-033 — BM-077 — document.fullDocumentCode

| Field | Value |
|-------|-------|
| Template | BM-077 — Yêu cầu/Đề nghị cử người bào chữa |
| SourceId | `99d7843f9f9e` |
| Path | `document.fullDocumentCode` |
| Current label | Slot from Wave 02 DOCX remediation |
| Decision | **DEFER** |
| Risk | medium |

### Evidence

Header area (tokens 0–20):
```
Mẫu số 77/HS | (Ban hành theo Thông tư số .../2026/TT-VKSTC ...)|
VIỆN KIỂM SÁT | ... | __AGENCY_NAME__ | CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM |
Độc lập – Tự do - Hạnh phúc | Số: …/YC/ĐN-VKS…- | ... | , ngày … tháng … năm 20…
```

Slot position (index 57):
```
Nơi nhận: | - | 10 | __DOCUMENT_FULLDOCUMENTCODE__ | - Lưu: HSVA, HSKS, VP.
```

### Reasoning

Header has `Số: …/YC/ĐN-VKS…-` but the slot does NOT sit on this line. The slot is inside the `Nơi nhận` (recipient) footer, preceded by footnote marker `10`. This is a footnote recipient address slot, not a document code field. Pattern matches BM-075 W2R-029 body slot. Cannot approve without re-mapping the slot or having stronger evidence.

---

## W2R-040 — BM-082 — document.fullDocumentCode

| Field | Value |
|-------|-------|
| Template | BM-082 — Thông báo cho người bào chữa về thời gian, địa điểm tiến hành hoạt động tố tụng |
| SourceId | `44cc2b043383` |
| Path | `document.fullDocumentCode` |
| Current label | Slot from Wave 02 DOCX remediation |
| Decision | **DEFER** |
| Risk | medium |

### Evidence

Header area (tokens 0–28):
```
Mẫu số 82/HS | ... | VIỆN KIỂM SÁT | ... | __AGENCY_NAME__ |
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM | Độc lập – Tự do - Hạnh phúc |
Số: …/TB-VKS…- | ... | ngày … tháng … năm 20…
THÔNG BÁO | Cho người bào chữa về thời gian, địa điểm tiến hành hoạt động tố tụng
```

Slot position (index 29):
```
… sẽ tiến hành | … đối với | __DOCUMENT_FULLDOCUMENTCODE__ | Viện kiểm sát 2 | ...
thông báo cho người bào chữa biết để tham gia; ...
```

### Reasoning

Header has `Số: …/TB-VKS…-` but the slot appears in body procedural text: "… sẽ tiến hành … đối với __DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát 2". This is a case/procedural reference slot inside the notification body, not the document number header line. Pattern matches BM-075 W2R-029. DEFER.

---

## Summary

| Item | BM | Path | Decision | Reason |
|------|----|------|----------|--------|
| W2R-033 | BM-077 | document.fullDocumentCode | DEFER | Slot in Nơi nhận footnote, not header |
| W2R-040 | BM-082 | document.fullDocumentCode | DEFER | Slot in body procedural text, not header |

**Approved this batch:** 0
**Deferred this batch:** 2
**Legal review:** 0
**DOCX reauthor:** 0
