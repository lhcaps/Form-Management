# Per-Form Render Accurate — BM-002 Evidence Pack

Generated: 2026-06-27T05:02:00.000Z
Task: PER_FORM_RENDER_ACCURATE_BM002_EVIDENCE
Pilot: BM-002 / f78301178da7

---

## Pilot Selection

| Metric | Value |
|--------|-------|
| Priority rank | 1 of 213 |
| Score | 37 |
| UI_VISIBLE_BAD_METADATA | 9 |
| BAD_LABEL | 10 |
| Blocking issues | 0 |

---

## Source Evidence

| Asset | Available | Path |
|-------|-----------|------|
| Original DOC | ✅ | `docs/Biểu mẫu/.../02-Phiếu chuyển nguồn tin về tội phạm.doc` |
| Normalized DOCX | ✅ | `storage/templates/normalized-docx/BM-002/BM-002_normalized.docx` |
| Rendered DOCX | ✅ | `.cache/f2-rendered-docx/BM-002.bin` |
| Locked contract | ✅ | `docs/audit/docx/contracts/locked/BM-002__f78301178da7.contract.locked.json` |
| SHA256 (original) | `f78301178da7...` | |
| SHA256 (normalized) | `c3164f9f4fd0...` | |

---

## Current Audit Findings for BM-002

| Issue Code | Count | Severity |
|-----------|-------|----------|
| BAD_LABEL | 10 | REVIEW |
| UI_VISIBLE_BAD_METADATA | 9 | FAIL |
| SHOULD_BE_READONLY | 4 | REVIEW |
| COMPILED_DRIFT | 28 | — |

No legal review, domain model review, or DOCX reauthor blocks.

---

## BAD_LABEL Fields — 10 Fields (Bucket A Candidates)

All 10 BAD_LABEL fields are candidates for SAFE_LABEL_ONLY patches. The current label is the raw camelCase path tail. The visible Vietnamese context provides the correct label.

| # | Slot ID | Current Label | Visible Context | Status |
|---|---------|--------------|----------------|--------|
| 1 | `document.issuePlaceAndDateLine` | issuePlaceAndDateLine | "Nơi cấp / Địa điểm, ngày lập" | ✅ SAFE_LABEL_ONLY |
| 2 | `sourceReport.receivedDateLine` | receivedDateLine | "Ngày tiếp nhận" | ✅ SAFE_LABEL_ONLY |
| 3 | `reporter.genderText` | genderText | "Giới tính" | ✅ SAFE_LABEL_ONLY |
| 4 | `reporter.otherName` | otherName | "Tên gọi khác" | ✅ SAFE_LABEL_ONLY |
| 5 | `reporter.birthDateLine` | birthDateLine | "Sinh ngày" | ✅ SAFE_LABEL_ONLY |
| 6 | `reporter.identityIssueDateLine` | identityIssueDateLine | "Cấp ngày" | ✅ SAFE_LABEL_ONLY |
| 7 | `reporter.organizationRepresentative` | organizationRepresentative | "Là người đại diện của cơ quan, tổ chức (nếu có)" | ✅ SAFE_LABEL_ONLY |
| 8 | `sourceReport.content` | content | "Nội dung" | ✅ SAFE_LABEL_ONLY |
| 9 | `recipients.primaryLine` | primaryLine | "Nơi nhận (dòng 1)" | ✅ SAFE_LABEL_ONLY |
| 10 | `recipients.archiveLine` | archiveLine | "Nơi nhận (dòng lưu)" | ✅ SAFE_LABEL_ONLY |

---

## UI_VISIBLE_BAD_METADATA Fields — 9 Fields

These 9 fields are flagged as visible in the rendered output with bad metadata. The BAD_LABEL issue above captures the same fields.

Note: UI_VISIBLE_BAD_METADATA is flagged on the **rendered output**, not the contract label. The root cause is the camelCase labels appearing in the rendered output rather than the proper Vietnamese field names. Fixing the `currentLabel` on the canonical fields will resolve these.

---

## Rendered Text Sample (first 20 segments)

```
0:  Mẫu số 02/HS
1:  (Ban hành theo Thông tư  số 03/2026/TT-VKSTC Ngày 09/02/2026)
2:  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
3:  Độc lập – Tự do - Hạnh phúc
4:  Số: __DOCUMENT_DOCUMENTCODE__
5:  __DOCUMENT_ISSUEPLACEANDDATELINE__
6:  PHIẾU CHUYỂN NGUỒN TIN VỀ TỘI PHẠM
7:  Kính gửi: __RECEIVER_NAME__
8:  Ngày __SOURCEREPORT_RECEIVEDDATELINE__, __AGENCY_BODYNAME__
9:  nhận được nguồn tin về tội phạm của ông/bà:
10: Họ tên: __REPORTER_FULLNAME__
11: Giới tính: __REPORTER_GENDERTEXT__
12: Tên gọi khác: __REPORTER_OTHERNAME__
13: Sinh ngày __REPORTER_BIRTHDATELINE__ tại: __REPORTER_BIRTHPLACE__
14: Quốc tịch: __REPORTER_NATIONALITY__; Dân tộc: __REPORTER_ETHNICITY__; Tôn giáo: __REPORTER_RELIGION__
15: Nghề nghiệp: __REPORTER_OCCUPATION__
16: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: __REPORTER_IDENTITYNUMBER__
17: Cấp ngày __REPORTER_IDENTITYISSUEDATELINE__ Nơi cấp: __REPORTER_IDENTITYISSUEPLACE__
18: Nơi thường trú: __REPORTER_PERMANENTRESIDENCE__
19: Nơi tạm trú: __REPORTER_TEMPORARYRESIDENCE__
```

Render audit: PASS. Text length ratio: 0.979. No unreplaced placeholders. No missing anchors.

---

## Non-Contract Issues (Informational)

| Issue | Count | Action Required |
|-------|-------|----------------|
| SHOULD_BE_READONLY | 4 | Informational — flags computed/agency fields. No contract changes needed. |
| COMPILED_DRIFT | 28 | Compiled artifact drift. Contract is source of truth. No contract changes needed. |

---

## Safety Classification

| Bucket | Count | Files to Modify |
|--------|-------|----------------|
| A — SAFE_LABEL_ONLY | 10 | `BM-002__f78301178da7.contract.locked.json` |
| B — SAFE_RENDER_HINT_ONLY | 0 | — |
| C — SAFE_METADATA_ONLY | 0 | — |
| D — PATH_BINDING_REVIEW | 0 | — |
| E — DOMAIN_MODEL_REVIEW | 0 | — |
| F — LEGAL_REVIEW | 0 | — |
| G — DOCX_REAUTHOR | 0 | — |
| H — STALE_FORM_INPUT_HINTS | 0 | — |

---

_Evidence pack auto-generated. Do not edit manually._
