# Wave 02 Priority 7 Manual Review Pack

Generated: 2026-06-26T15:07:00.000Z
Mode: **MANUAL REVIEW — PENDING**
Priority: **HIGH** — path/placeholder mismatch items

---

## What Are These 7 Items?

These are the highest-risk items in the Wave 02 batch because:

**The semantic path and DOCX placeholder disagree.**

Example:
```
path:     person.dateOfBirth
placeholder: {{document.field3}}
```

If this field is rendered in the UI, the wrong data binding may be used at runtime — the system thinks it is a date of birth but the DOCX placeholder is a generic `{{document.field3}}` that was mapped incorrectly during Wave 02 remediation.

---

## How to Review

1. Open the **Original DOC** file in Microsoft Word.
2. Search for the **placeholder text** shown in the table below.
3. Read the **full sentence or paragraph** containing the placeholder.
4. Look for any **visible Vietnamese label text** before or after the placeholder.
5. Check **footnotes** — superscript numbers before a placeholder may have relevant context in the footnote text.
6. Fill in your decision in the table below.
7. When done, update `priority-7-decisions.draft.json` with your decisions.

---

## Decision Options

| Decision | When to Use |
|----------|-------------|
| `APPROVED_LABEL` | Original DOC confirms the suggested label, or visible Vietnamese text clearly identifies the field. |
| `DEFER` | Not enough context in the DOC to determine the correct label. |
| `LEGAL_REVIEW` | Field has legal/procedural implications (legal basis, decision grounds, citations). |
| `DOCX_REAUTHOR_REQUIRED` | The placeholder itself is wrong in the DOC — not just the contract label. |

---

## Review Items

### W2R-003 — BM-068 — person.dateOfBirth / {{document.field3}}

| Field | Value |
|-------|-------|
| **Template** | BM-068 |
| **Title** | QĐ huỷ bỏ biện pháp phong toả tài khoản |
| **Path** | `person.dateOfBirth` |
| **Placeholder** | `{{document.field3}}` |
| **Current label** | Slot from Wave 02 DOCX remediation |
| **Suggested label** | Ngày sinh |
| **Risk** | high |
| **Why priority** | path/placeholder mismatch: path=person.dateOfBirth but DOCX uses generic {{document.field3}} |

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/02. BIEN PHAP NGAN CHAN BIEN PHAP CUONG CHE/68-QĐ huỷ bỏ biện pháp phong toả tài khoản.doc`

**Instructions**:
1. Open the DOC in Microsoft Word.
2. Press `Ctrl+H` to open Find & Replace.
3. Search for `{{document.field3}}`.
4. Read the full sentence containing this placeholder.
5. Confirm whether this is a date-of-birth field.
6. Record the exact visible Vietnamese label text if present.

**Your decision**: | **Approved label**: |
|---|---|
| `APPROVED_LABEL` / `DEFER` / `LEGAL_REVIEW` / `DOCX_REAUTHOR_REQUIRED` | |

---

### W2R-015 — BM-069 — person.dateOfBirth / {{document.field3}}

| Field | Value |
|-------|-------|
| **Template** | BM-069 |
| **Title** | BB về việc hủy bỏ biện pháp phong tỏa tài khoản |
| **Path** | `person.dateOfBirth` |
| **Placeholder** | `{{document.field3}}` |
| **Current label** | Slot from Wave 02 DOCX remediation |
| **Suggested label** | Ngày sinh |
| **Risk** | high |
| **Why priority** | path/placeholder mismatch: path=person.dateOfBirth but DOCX uses generic {{document.field3}} |

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/02. BIEN PHAP NGAN CHAN BIEN PHAP CUONG CHE/69-BB về việc hủy bỏ biện pháp phong tỏa tài khoản.doc`

**Instructions**:
1. Open the DOC in Microsoft Word.
2. Search for `{{document.field3}}`.
3. Read the full sentence containing this placeholder.
4. Confirm whether this is a date-of-birth field.

**Your decision**: | **Approved label**: |
|---|---|
| `APPROVED_LABEL` / `DEFER` / `LEGAL_REVIEW` / `DOCX_REAUTHOR_REQUIRED` | |

---

### W2R-016 — BM-069 — person.idNumber / {{document.field5}}

| Field | Value |
|-------|-------|
| **Template** | BM-069 |
| **Title** | BB về việc hủy bỏ biện pháp phong tỏa tài khoản |
| **Path** | `person.idNumber` |
| **Placeholder** | `{{document.field5}}` |
| **Current label** | Slot from Wave 02 DOCX remediation |
| **Suggested label** | Số CCCD/CMND |
| **Risk** | high |
| **Why priority** | path/placeholder mismatch: path=person.idNumber but DOCX uses generic {{document.field5}} |

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/02. BIEN PHAP NGAN CHAN BIEN PHAP CUONG CHE/69-BB về việc hủy bỏ biện pháp phong tỏa tài khoản.doc`

**Instructions**:
1. Open the DOC in Microsoft Word.
2. Search for `{{document.field5}}`.
3. Read the full sentence containing this placeholder.
4. Confirm whether this is an ID number (CCCD/CMND) field.

**Your decision**: | **Approved label**: |
|---|---|
| `APPROVED_LABEL` / `DEFER` / `LEGAL_REVIEW` / `DOCX_REAUTHOR_REQUIRED` | |

---

### W2R-022 — BM-069 — decision.decisionLine / {{document.field8}}

| Field | Value |
|-------|-------|
| **Template** | BM-069 |
| **Title** | BB về việc hủy bỏ biện pháp phong tỏa tài khoản |
| **Path** | `decision.decisionLine` |
| **Placeholder** | `{{document.field8}}` |
| **Current label** | Slot from Wave 02 DOCX remediation |
| **Suggested label** | Số QĐ |
| **Risk** | high |
| **Why priority** | path/placeholder mismatch + legal content. Text fragment "oản theo" suggests "quyết định theo" |

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/02. BIEN PHAP NGAN CHAN BIEN PHAP CUONG CHE/69-BB về việc hủy bỏ biện pháp phong tỏa tài khoản.doc`

**Instructions**:
1. Open the DOC in Microsoft Word.
2. Search for `{{document.field8}}`.
3. Read the full sentence carefully — this may be a legal citation or reference.
4. Confirm whether this is a decision/reference number line.
5. Record exact visible label text.

**Your decision**: | **Approved label**: |
|---|---|
| `APPROVED_LABEL` / `DEFER` / `LEGAL_REVIEW` / `DOCX_REAUTHOR_REQUIRED` | |

---

### W2R-023 — BM-069 — person.occupation / {{document.field10}}

| Field | Value |
|-------|-------|
| **Template** | BM-069 |
| **Title** | BB về việc hủy bỏ biện pháp phong tỏa tài khoản |
| **Path** | `person.occupation` |
| **Placeholder** | `{{document.field10}}` |
| **Current label** | Slot from Wave 02 DOCX remediation |
| **Suggested label** | Nghề nghiệp |
| **Risk** | high |
| **Why priority** | path/placeholder mismatch: path=person.occupation but DOCX uses generic {{document.field10}} |

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/02. BIEN PHAP NGAN CHAN BIEN PHAP CUONG CHE/69-BB về việc hủy bỏ biện pháp phong tỏa tài khoản.doc`

**Instructions**:
1. Open the DOC in Microsoft Word.
2. Search for `{{document.field10}}`.
3. Confirm whether this is an occupation field.

**Your decision**: | **Approved label**: |
|---|---|
| `APPROVED_LABEL` / `DEFER` / `LEGAL_REVIEW` / `DOCX_REAUTHOR_REQUIRED` | |

---

### W2R-027 — BM-073 — person.dateOfBirth / {{document.field3}}

| Field | Value |
|-------|-------|
| **Template** | BM-073 |
| **Title** | Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra |
| **Path** | `person.dateOfBirth` |
| **Placeholder** | `{{document.field3}}` |
| **Current label** | Slot from Wave 02 DOCX remediation |
| **Suggested label** | Ngày sinh |
| **Risk** | high |
| **Why priority** | path/placeholder mismatch. Footnote superscript '5' before placeholder — check footnote text for context |

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/03. NGUOI CO THAM QUYEN NGUOI THAM GIA TO TUNG/73-Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra.doc`

**Instructions**:
1. Open the DOC in Microsoft Word.
2. Search for `{{document.field3}}`.
3. Note the footnote superscript '5' — scroll to the bottom of the page to read footnote 5.
4. Confirm whether this is a date-of-birth field.

**Your decision**: | **Approved label**: |
|---|---|
| `APPROVED_LABEL` / `DEFER` / `LEGAL_REVIEW` / `DOCX_REAUTHOR_REQUIRED` | |

---

### W2R-028 — BM-073 — person.idNumber / {{document.field5}}

| Field | Value |
|-------|-------|
| **Template** | BM-073 |
| **Title** | Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra |
| **Path** | `person.idNumber` |
| **Placeholder** | `{{document.field5}}` |
| **Current label** | Slot from Wave 02 DOCX remediation |
| **Suggested label** | Số CCCD/CMND |
| **Risk** | high |
| **Why priority** | path/placeholder mismatch. Footnote reference before placeholder — check footnote text |

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/03. NGUOI CO THAM QUYEN NGUOI THAM GIA TO TUNG/73-Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra.doc`

**Instructions**:
1. Open the DOC in Microsoft Word.
2. Search for `{{document.field5}}`.
3. Note the footnote reference before placeholder — read footnote text.
4. Confirm whether this is an ID number (CCCD/CMND) field.

**Your decision**: | **Approved label**: |
|---|---|
| `APPROVED_LABEL` / `DEFER` / `LEGAL_REVIEW` / `DOCX_REAUTHOR_REQUIRED` | |

---

## After Review

1. Save your decisions to `priority-7-decisions.draft.json` (update `decision` and `approvedLabel` fields).
2. Copy any `APPROVED_LABEL` items to `docs/audit/docx-wave-02-manual-review-pack/decisions.approved.json`.
3. Run:
   ```bash
   node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs      # dry-run
   node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs --write  # apply
   ```
4. Validate:
   ```bash
   pnpm audit:forms-root-cause
   pnpm typecheck
   ```
