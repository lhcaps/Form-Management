# Decision Guide — Wave 02 Priority 7 Items

Generated: 2026-06-26T15:07:00.000Z
Purpose: Guide for human reviewer to make correct decisions for the 7 priority items.

---

## Decision Options

### APPROVED_LABEL

**Use when** the original DOC in Microsoft Word confirms the suggested label, OR when visible Vietnamese text clearly identifies the field.

**Required fields** to fill in:
```json
{
  "decision": "APPROVED_LABEL",
  "approvedLabel": "Ngày sinh",
  "reviewer": "Your name",
  "reviewedAt": "2026-06-26T15:XX:00.000Z",
  "evidenceNotes": "Original DOC line: 'Ngày sinh: {{document.field3}}'"
}
```

**Examples of APPROVED_LABEL evidence:**
- Visible text directly before placeholder: "Ngày sinh: `{{document.field3}}`"
- Table header clearly labels the column as "Ngày sinh"
- Footnote text says "Ngày sinh"

### DEFER

**Use when** the original DOC does not show enough context to determine the correct label.

**Required fields**:
```json
{
  "decision": "DEFER",
  "approvedLabel": null,
  "reviewer": "Your name",
  "reviewedAt": "2026-06-26T15:XX:00.000Z",
  "evidenceNotes": "Placeholder appears mid-sentence without clear field label."
}
```

### LEGAL_REVIEW

**Use when** the field affects legal basis, decision grounds, statutory citations, or procedural classification.

**Required fields**:
```json
{
  "decision": "LEGAL_REVIEW",
  "approvedLabel": null,
  "reviewer": "Your name",
  "reviewedAt": "2026-06-26T15:XX:00.000Z",
  "evidenceNotes": "Field contains legal citation reference. Needs legal officer review."
}
```

**Special case — W2R-022 (BM-069 / decision.decisionLine / {{document.field8}})**: This item has text fragment "oản theo" which likely means "quyết định theo" (decision pursuant to). If the field is a legal citation line, recommend `LEGAL_REVIEW`.

### DOCX_REAUTHOR_REQUIRED

**Use when** the placeholder itself is wrong in the DOC — not just the contract label. This means the original DOC needs to be edited to rename the placeholder before the contract can be fixed.

**Required fields**:
```json
{
  "decision": "DOCX_REAUTHOR_REQUIRED",
  "approvedLabel": null,
  "reviewer": "Your name",
  "reviewedAt": "2026-06-26T15:XX:00.000Z",
  "evidenceNotes": "Placeholder {{document.field8}} should be {{decision.decisionLine}} in DOCX. DOC authoring required."
}
```

---

## Per-Item Decision Guidance

### W2R-003 — BM-068 — person.dateOfBirth / {{document.field3}}

**What to look for**: Look for "Ngày sinh" or a date field near `{{document.field3}}`.
- If the DOC shows "Ngày sinh: `{{document.field3}}`" → APPROVED_LABEL with "Ngày sinh"
- If no clear label → DEFER
- If this is a legal date field → LEGAL_REVIEW

### W2R-015 — BM-069 — person.dateOfBirth / {{document.field3}}

**What to look for**: Same as W2R-003 but in a different document (BM-069).
- The DOCX context had no static text for this field in BM-069.
- You must open the original DOC to see what the real label is.
- If date of birth confirmed → APPROVED_LABEL with "Ngày sinh"

### W2R-016 — BM-069 — person.idNumber / {{document.field5}}

**What to look for**: Look for ID number text like "Số CCCD", "Số CMND", "Số giấy tờ".
- If confirmed → APPROVED_LABEL with "Số CCCD/CMND"
- If ambiguous → DEFER
- If requires legal document number review → LEGAL_REVIEW

### W2R-022 — BM-069 — decision.decisionLine / {{document.field8}}

**What to look for**: The DOCX context had "oản theo" before the placeholder — this likely means "quyết định theo" (decision pursuant to). This is probably a legal citation/reference line.
- If it is clearly a decision number line → APPROVED_LABEL with "Số QĐ"
- If it is a legal citation requiring legal precision → LEGAL_REVIEW
- This field is specifically flagged for careful review.

### W2R-023 — BM-069 — person.occupation / {{document.field10}}

**What to look for**: Look for "Nghề nghiệp" near `{{document.field10}}`.
- If confirmed → APPROVED_LABEL with "Nghề nghiệp"
- If ambiguous → DEFER

### W2R-027 — BM-073 — person.dateOfBirth / {{document.field3}}

**What to look for**: Same as W2R-003/015 but in BM-073. Note the footnote superscript '5' before the placeholder.
- Read the footnote text — it may provide field context.
- If date of birth confirmed → APPROVED_LABEL with "Ngày sinh"
- If no context → DEFER

### W2R-028 — BM-073 — person.idNumber / {{document.field5}}

**What to look for**: Note the footnote reference before the placeholder — read the footnote text.
- If ID number confirmed → APPROVED_LABEL with "Số CCCD/CMND"
- If no context → DEFER

---

## After Making Decisions

1. Update `priority-7-decisions.draft.json` with your decisions.
2. Copy all `APPROVED_LABEL` items to `docs/audit/docx-wave-02-manual-review-pack/decisions.approved.json` (merge with existing structure).
3. Run the apply script:
   ```bash
   node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs
   node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs --write
   ```
4. Validate:
   ```bash
   pnpm audit:forms-root-cause
   pnpm typecheck
   ```
