# Wave 02 Closure Report

**Generated:** 2026-06-26 17:30 UTC+7 (recomputed after unreviewed-5 classification)
**Reviewer:** Le Huy
**Scope:** Wave 02 DOCX manual review/apply lane — all BMs from `review-pack.latest.json`
**Method:** Script-driven reconciliation of `decisions.approved.json`, per-BM `review.latest.json`, `priority-7-decisions.draft.json`, `apply/latest.json`, plus unreviewed-5 batch (`docs/audit/docx-wave-02-unreviewed-5/review.latest.json`)

---

## Executive summary

| Metric | Baseline | Current | Delta |
|--------|---------:|--------:|------:|
| `totalIssues` | 3440 | 3395 | **-45** |
| `BAD_LABEL` | 431 | 399 | **-32** |
| `UI_VISIBLE_BAD_METADATA` | 76 | 44 | **-32** |

- **Approved labels applied:** 32 (in global `decisions.approved.json`, all idempotent re-skips verify)
- **Locked contracts mutated (label only):** 6
  - BM-068 — `6c1275cc752e`
  - BM-069 — `3a67d1a2e298`
  - BM-162 — `6e7e16348066`
  - BM-163 — `61941122b9e4`
  - BM-075 — `dc493cfb5fd3`
  - BM-080 — `a7aa64d4b889`
- **BM-077/BM-082 reviewed:** 0 approved, 2 defer (body slot systemic pattern detected)
- **Pre-batch applied:** 1 (BM-163 W2R-APPLIED-001 currentAddress, applied 2026-06-26T14:47Z)
- **DOCX files touched:** 0
- **source/path/binding touched:** 0
- **Compiled artifacts hand-edited:** 0

---

## Computed counts (script: `scripts/audit/wave-02-closure-report.mjs`)

| Bucket | Count |
|--------|------:|
| Master pack items (W2R-001 → W2R-056) | 56 |
| Reviewed (in any review.latest.json + priority-7 + unreviewed-5) | 56 |
| Approved (in global decisions.approved.json) | 32 |
| Approved from priority-7 pre-batch (subset of 32) | 4 |
| Pre-batch applied (W2R-APPLIED-001) | 1 |
| **DEFER** | **20** |
| **LEGAL_REVIEW** | **2** |
| **DOCX_REAUTHOR_REQUIRED** | **2** |
| PENDING_REVIEW | 0 |
| In master but not reviewed | 0 |
| In global but not reviewed | 0 |
| Duplicates | 0 |
| `totalItems` mismatch | 0 |
| Approved-label mismatches | 0 |
| `legalBasis.*` approved without legal reviewer | 0 |

**Sum check:** 32 (approved) + 20 (defer) + 2 (legal) + 2 (reauthor) + 0 (unreviewed) = 56 ✓

---

## Master pack IDs not yet reviewed

**None.** Wave 02 unreviewed-5 batch closed all 5 remaining IDs (W2R-017, W2R-018, W2R-024, W2R-025, W2R-026) as DEFER on 2026-06-26 17:30 UTC+7. See `docs/audit/docx-wave-02-unreviewed-5/review.latest.json` and `docs/audit/docx-wave-02-unreviewed-5/review.latest.md` for the per-item classification.

---

## Contract coverage (per BM)

| BM | Approved | Defer | LegalReview | DOCXReauthor | Total |
|----|---------:|------:|------------:|-------------:|------:|
| BM-068 | 12 | 0 | 0 | 0 | 12 |
| BM-069 | 7 | 4 | 1 | 0 | 12 |
| BM-073 | 0 | 2 | 0 | 2 | 4 |
| BM-075 | 1 | 3 | 0 | 0 | 4 |
| BM-077 | 0 | 1 | 0 | 0 | 1 |
| BM-080 | 2 | 3 | 1 | 0 | 6 |
| BM-082 | 0 | 1 | 0 | 0 | 1 |
| BM-162 | 6 | 1 | 0 | 0 | 7 |
| BM-163 | 4 | 5 | 0 | 0 | 9 |
| **Total** | **32** | **20** | **2** | **2** | **56** |

---

## Approved item table

| reviewItemId | templateCode | sourceId | path | approvedLabel | risk |
|--------------|--------------|----------|------|---------------|------|
| W2R-001 | BM-068 | `6c1275cc752e` | document.fullDocumentCode | Số/Ký hiệu văn bản | medium |
| W2R-002 | BM-068 | `6c1275cc752e` | document.issueDate | Ngày ban hành | medium |
| W2R-003 | BM-068 | `6c1275cc752e` | person.dateOfBirth | Ngày sinh | high |
| W2R-004 | BM-068 | `6c1275cc752e` | person.permanentAddress | Nơi thường trú | low |
| W2R-005 | BM-068 | `6c1275cc752e` | person.permanentAddress2 | Nơi thường trú | low |
| W2R-006 | BM-068 | `6c1275cc752e` | person.occupation | Nghề nghiệp | low |
| W2R-007 | BM-068 | `6c1275cc752e` | person.idNumber | Số CCCD/CMND | low |
| W2R-008 | BM-068 | `6c1275cc752e` | person.permanentAddress3 | Nơi thường trú | low |
| W2R-009 | BM-068 | `6c1275cc752e` | person.occupation2 | Nghề nghiệp | low |
| W2R-010 | BM-068 | `6c1275cc752e` | person.idNumber2 | Số CCCD/CMND | low |
| W2R-011 | BM-068 | `6c1275cc752e` | person.temporaryAddress | Nơi tạm trú | low |
| W2R-012 | BM-068 | `6c1275cc752e` | person.province | Tỉnh/Thành phố | low |
| W2R-014 | BM-069 | `3a67d1a2e298` | document.issueDate | Ngày lập biên bản | medium |
| W2R-015 | BM-069 | `3a67d1a2e298` | person.dateOfBirth | Ngày sinh | high |
| W2R-016 | BM-069 | `3a67d1a2e298` | person.idNumber | Số CCCD/CMND | high |
| W2R-019 | BM-069 | `3a67d1a2e298` | person.personFullName | Họ tên | low |
| W2R-020 | BM-069 | `3a67d1a2e298` | person.currentAddress | Nơi ở hiện tại | low |
| W2R-021 | BM-069 | `3a67d1a2e298` | person.currentAddress2 | Nơi ở hiện tại | low |
| W2R-023 | BM-069 | `3a67d1a2e298` | person.occupation | Nghề nghiệp | high |
| W2R-030 | BM-075 | `dc493cfb5fd3` | person.personFullName | Họ tên | low |
| W2R-034 | BM-080 | `a7aa64d4b889` | document.fullDocumentCode | Số/Ký hiệu văn bản | medium |
| W2R-035 | BM-080 | `a7aa64d4b889` | document.issueDate | Ngày tháng năm | medium |
| W2R-041 | BM-162 | `6e7e16348066` | document.fullDocumentCode | Số/Ký hiệu văn bản | medium |
| W2R-042 | BM-162 | `6e7e16348066` | document.issueDate | Ngày tháng năm | medium |
| W2R-044 | BM-162 | `6e7e16348066` | person.personFullName | Họ tên | low |
| W2R-045 | BM-162 | `6e7e16348066` | person.currentAddress | Nơi ở hiện nay | low |
| W2R-046 | BM-162 | `6e7e16348066` | person.occupation | Nghề nghiệp | low |
| W2R-047 | BM-162 | `6e7e16348066` | person.idNumber | Số CCCD/CMND | low |
| W2R-048 | BM-163 | `61941122b9e4` | document.fullDocumentCode | Số/Ký hiệu văn bản | medium |
| W2R-049 | BM-163 | `61941122b9e4` | document.issueDate | Ngày tháng năm | medium |
| W2R-051 | BM-163 | `61941122b9e4` | person.personFullName | Họ tên | low |
| W2R-055 | BM-163 | `61941122b9e4` | person.idNumber | Số CCCD/CMND | low |

---

## Deferred item table (20)

| reviewItemId | templateCode | path | pattern |
|--------------|--------------|------|---------|
| W2R-013 | BM-069 | document.fullDocumentCode | No visible Số: line (biên bản, no doc number line) |
| W2R-017 | BM-069 | document.reasonLine | Body-line slot, no visible Vietnamese label |
| W2R-018 | BM-069 | document.reasonLine2 | Sentence-trailing body slot inside thi-hành Quyết định procedural text |
| W2R-024 | BM-069 | document.summaryLine | Free-form body completion in clause 2 account-info enumeration |
| W2R-025 | BM-073 | document.fullDocumentCode | False-header pattern: visible Số header at ¶[009] has no slot; slot sits in title body line "Thay đổi __fullDocumentCode__" at ¶[012] |
| W2R-026 | BM-073 | document.issueDate | False-header pattern: visible date header at ¶[010] has no slot; slot sits in "Xét thấy __DOCUMENT_ISSUEDATE__" reasoning clause at ¶[016] |
| W2R-029 | BM-075 | document.fullDocumentCode | Body slot in "Xét thấy" line, header Số has no slot |
| W2R-031 | BM-075 | person.dateOfBirth | Slot inside translation subject sentence, no "Sinh ngày" label |
| W2R-032 | BM-075 | person.currentAddress | Slot in Nơi nhận footer with footnote marker, not address field |
| W2R-033 | BM-077 | document.fullDocumentCode | Body slot in Nơi nhận footer (footnote marker 10) |
| W2R-036 | BM-080 | person.personFullName | Slot preceded by "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:" — path mismatch |
| W2R-037 | BM-080 | person.dateOfBirth | Footnote marker 5/6 inside Xét thấy sentence |
| W2R-038 | BM-080 | person.currentAddress | Footnote marker 5 inside "thông báo" sentence |
| W2R-040 | BM-082 | document.fullDocumentCode | Body slot in "… đối với …" procedural text |
| W2R-043 | BM-162 | person.dateOfBirth | Multi-column table layout; no visible "Sinh ngày" label |
| W2R-050 | BM-163 | person.dateOfBirth | No visible "Sinh ngày" label |
| W2R-052 | BM-163 | person.occupation | No "Nghề nghiệp:" label; only "Là" between fields |
| W2R-053 | BM-163 | person.ward | No visible "Phường/Xã:" label |
| W2R-054 | BM-163 | person.province | No visible "Tỉnh/Thành phố:" label |
| W2R-056 | BM-163 | case.caseNumber | Legal/procedural field; ambiguous |

---

## Legal review table (2)

| reviewItemId | templateCode | path | reason |
|--------------|--------------|------|--------|
| W2R-022 | BM-069 | decision.decisionLine | Lệnh/Quyết định phong tỏa context; cannot approve "Số QĐ" without legal review |
| W2R-039 | BM-080 | legalBasis.legalBasisLine | legalBasis.* field; any label change requires legal review |

---

## DOCX reauthor table (2)

| reviewItemId | templateCode | path | reason |
|--------------|--------------|------|--------|
| W2R-027 | BM-073 | person.dateOfBirth | BM-073 has no personal DOB field; path is semantically wrong |
| W2R-028 | BM-073 | person.idNumber | BM-073 has no CMND/CCCD field; footnote 5 is a personnel role type |

---

## Systemic findings

### 1. document.fullDocumentCode false-header pattern (now 5 occurrences)

The DOC shows a visible `Số: …/…-VKS…-` header line, but the slot code does not sit on that line. Instead it appears in:

- **BM-075 W2R-029**: body line `Xét thấy __DOCUMENT_FULLDOCUMENTCODE__ ĐỀ NGHỊ:` — case context
- **BM-077 W2R-033**: footer `Nơi nhận: - 10 __DOCUMENT_FULLDOCUMENTCODE__ - Lưu:` — footnote marker
- **BM-082 W2R-040**: body line `… sẽ tiến hành … đối với __DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát 2` — procedural/case reference
- **BM-069 W2R-013**: biên bản has no Số header at all
- **BM-073 W2R-025** (added by unreviewed-5 batch): title body line `Thay đổi __DOCUMENT_FULLDOCUMENTCODE__` — the visible `Số: …/YC-VKS…-…` header at ¶[009] has no slot; the slot is in the title body line that uses "Thay đổi" (to change) + the document sub-number reference

**Resolution path:** DOCX re-author lane must investigate whether the original DOCX has the slot code in the wrong XML position, or whether the Wave 02 DOCX remediation mapped slots to the wrong paragraphs. A `path/binding` investigation is required before any approval.

### 2. document.issueDate Xét-thấy/Thi-hành reasoning-clause pattern (BM-073 W2R-026, BM-069 W2R-014/017/018/024 family)

The visible date header `…, ngày … tháng … năm 20…` exists at the top of BM-073 but the slot __DOCUMENT_ISSUEDATE__ sits in the body reasoning clause `Xét thấy __DOCUMENT_ISSUEDATE__`. The same pattern applies to BM-069 issueDate/body slots. These are reasoning clauses (Xét thấy = Considering that; Thi hành = Implementing), not issuance date headers.

**Resolution path:** Same as §1 — path/binding investigation required.

### 2. BM-080 person field path mismatch

- **W2R-036 person.personFullName**: preceded by `Số thẻ luật sư/thẻ trợ giúp viên pháp lý:` — this is a card number field, not a name field. Actual name is earlier as `Ông/Bà:`.
- **W2R-037/W2R-038**: slots in footnote-marker sentence positions, not actual field positions.

**Resolution path:** investigate path binding for BM-080 contract.

### 3. Multi-column layout extraction risk (BM-162)

- **W2R-043 person.dateOfBirth**: field codes are interspersed in complex multi-column table layout. No clear `Sinh ngày ...` or `Ngày sinh:` label found near the slot in extracted text.
- **W2R-050 (BM-163)**: similar multi-column risk; date-of-birth label is absent in extracted text.

**Resolution path:** A regex-based DOCX text extraction cannot reliably resolve multi-column tables. A more sophisticated layout-aware extraction (e.g. paragraph + run iteration with column grouping) is needed.

### 4. Legal/procedural fields blocked

- **W2R-022** decision.decisionLine — phong tỏa Lệnh/Quyết định context
- **W2R-039** legalBasis.legalBasisLine — legalBasis.* is policy-blocked
- **W2R-056** case.caseNumber — case/docket number; ambiguous visible label

All three require human legal/procedural review. The lane policy is: never apply a label change to legal fields without explicit legal reviewer sign-off.

### 5. BM-073 path/placeholder mismatch (path investigation needed)

- **W2R-027, W2R-028** (DOCX_REAUTHOR_REQUIRED): BM-073 concerns changing `Thủ trưởng/Cấp trưởng/Phó Thủ trưởng/Cấp phó/Điều tra viên/cán bộ điều tra` — not personal DOB/ID number fields. The `person.dateOfBirth` and `person.idNumber` paths are semantically wrong. The fields are likely `person.officialRole` or similar; the placeholder `{{document.field3}}` / `{{document.field5}}` references footnote 3 and 5 in BM-073 which describe role-type, not personal identity.
- **W2R-025, W2R-026** (DEFER per unreviewed-5 batch): the slot paths (`document.fullDocumentCode`, `document.issueDate`) are plausible, but the slots sit on the wrong paragraphs in the rendered DOCX (false-header pattern §1, §2 above). Path/binding investigation should confirm whether the slots need to be re-positioned in the DOCX, or whether the rendered DOCX is correct and the slot semantic is genuinely different (e.g., a sub-document number for a "change" annex rather than the main issuance number).

---

## Reconciliation checks (all passed)

| Check | Result |
|-------|--------|
| Approved count from global decisions.approved.json | 32 ✓ |
| Reviewed count from per-BM review + priority-7 + unreviewed-5 | 56 ✓ |
| Defer count | 20 ✓ |
| Legal review count | 2 ✓ |
| DOCX reauthor count | 2 ✓ |
| Master pack total = sum of categories | 32 + 20 + 2 + 2 + 0 = 56 ✓ |
| Duplicates in reviewed set | 0 ✓ |
| `totalItems` vs `items.length` mismatch in decisions.approved.json | 0 ✓ |
| `approvedLabel` set without APPROVED_LABEL decision | 0 ✓ (W2R-043 typo fixed) |
| `legalBasis.*` approved without legalReviewer | 0 ✓ |
| sourceId missing or equal to templateCode | 0 ✓ |
| `currentLabel` not "Slot from Wave 02 DOCX remediation" | 0 ✓ (all approved items still have placeholder currentLabel by design — the apply script only mutates the locked-contract `label` field, not the in-pack `currentLabel`) |

**Note on `stillPlaceholderAfterApproval`:** All 32 approved items still have `currentLabel: "Slot from Wave 02 DOCX remediation"` in `decisions.approved.json`. This is **by design**: `decisions.approved.json` is the input to the apply script; the apply script mutates `label` on locked contracts in `packages/form-contracts/.../BM-XXX__<sourceId>.contract.locked.json`. The `currentLabel` in `decisions.approved.json` represents the pre-apply state for audit traceability. Idempotent re-skips verify label already matches `approvedLabel`.

---

## Recommended next lane

1. **Prior DOCX remediation generic slots lane (~16 items)** — likely safe, lower risk than current 3395 baseline issues
2. **Document metadata / legal / procedural lane** — handle the 4 systemic false-header items (BM-075/077/082/069 fullDocumentCode) and BM-073 path investigation
3. **Plan separately for large blank-slot lane (~340 items)** — high risk; needs sampling, grouping by path, batched application

---

## Validation

- `pnpm audit:forms-root-cause` → totalIssues: 3395, BAD_LABEL: 399, UI_VISIBLE_BAD_METADATA: 44 (no change from previous batch)
- `pnpm typecheck` → exit 0
- Idempotent re-run of apply script → 32 skipped, 0 mutations, 0 failures

---

## Files in this closure

- `docs/audit/docx-wave-02-closure/closure.latest.json` — machine-readable
- `docs/audit/docx-wave-02-closure/closure.latest.md` — this file
- `scripts/audit/wave-02-closure-report.mjs` — reconciliation script (re-runnable)

## Inputs reconciled

- `docs/audit/docx-wave-02-manual-review-pack/review-pack.latest.json` (master, 56 items)
- `docs/audit/docx-wave-02-manual-review-pack/decisions.approved.json` (32 items)
- `docs/audit/docx-wave-02-manual-review-pack/apply/latest.json` (32 idempotent skips)
- `docs/audit/docx-wave-02-priority-7-manual-review/priority-7-decisions.draft.json` (7 items: 4 approved + 1 legal + 2 reauthor)
- `docs/audit/docx-wave-02-bm068-bm069-review/review.latest.json`
- `docs/audit/docx-wave-02-bm162-bm163-review/review.latest.json`
- `docs/audit/docx-wave-02-bm075-bm080-review/review.latest.json`
- `docs/audit/docx-wave-02-bm077-bm082-review/review.latest.json`
- `docs/audit/docx-wave-02-unreviewed-5/review.latest.json` (added 2026-06-26 17:30 — closes the 5 remaining master IDs as DEFER)
