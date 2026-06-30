# Safety Plan — DOCX Wave 02 Placeholder Fix

Generated: 2026-06-26T14:15:00.000Z
Mode: **PLANNING ONLY**

## Decision: NO APPLY TASK

**No automatic DOCX rename is safe. Zero W2_SAFE_DOCX_RENAME candidates found.**

## Why No Automatic Fix?

The safety threshold for `W2_SAFE_DOCX_RENAME` requires at least one of:

1. Static Vietnamese text appears directly before the placeholder (e.g. `"CMND: {{person.idNumber}}"`)
2. Table cell label clearly names the field
3. Section heading + slot order makes it unambiguous across multiple BMs
4. Repeated identical context appears consistently

**None of the 57 Wave 02 items meet any of these criteria.**

What they actually have:
- Font/style XML in textBefore: `<w:rFonts w:ascii="Times New Roman"/> {{document.field1}}`
- Footnote superscript markers: `5 {{person.dateOfBirth}}` — footnote numbers, not field labels
- Truncated procedural text after placeholder: `biết./.` — procedural body text, not a label

Auto-renaming would require guessing the field meaning from the path name alone, which is
exactly what the Wave 02 remediation already did — and produced the generic label as a result.

## If Safe Candidates Existed

If safe candidates were found, the apply task would work as follows:

### Step 1: Backup
```bash
# Copy each normalized DOCX to .backup/ before touching
cp storage/templates/normalized-docx/BM-XXX/BM-XXX_normalized.docx \
   .backup/BM-XXX/BM-XXX_normalized.docx
```

### Step 2: Modify DOCX
Only modify `word/document.xml` in each normalized DOCX:
- Find: `{{document.fieldN}}` (generic placeholder)
- Replace with: `{{path}}` (semantic placeholder matching canonical field path)

### Step 3: Re-extract
Re-run the extraction pipeline:
- The pipeline would extract from the modified normalized DOCX
- Regenerate locked contracts with new labels
- Labels would now match the semantic path name

### Step 4: Verify
```bash
pnpm audit:forms-root-cause
pnpm audit:docx-slot-inventory
pnpm typecheck
```

Compare BAD_LABEL delta before/after.

### Step 5: Safety gates
- Total slot count must not change
- No binding loss
- No placeholder count mismatch
- docx-fidelity: rendered output unchanged (only label text changes)

## Next Recommended Task

**DOCX_WAVE_02_MANUAL_AUTHORING_REVIEW**

This is NOT a pipeline automation task. It requires a human to:

1. Open the ORIGINAL `.doc` source file in Word (not the normalized docx)
2. Find each placeholder and read the surrounding Vietnamese text
3. Determine the correct field name based on context
4. Either:
   - (a) Update the placeholder name in the DOCX, then re-normalize and re-extract
   - (b) Manually set the contract canonicalField label to the correct Vietnamese text

### Items Needing Priority Review (path/placeholder mismatch)

These 11 items have `{{document.fieldN}}` placeholders mapped to semantically different paths —
the original DOCX likely has a meaningful label that was lost during extraction:

| BM | Current Path | Placeholder | Likely Real Label |
|----|-------------|-------------|-------------------|
| BM-068 | person.dateOfBirth | document.field3 | Ngày sinh |
| BM-069 | person.dateOfBirth | document.field3 | Ngày sinh |
| BM-069 | person.idNumber | document.field5 | Số CMND/CCCD |
| BM-069 | document.reasonLine | document.field6 | Lý do |
| BM-069 | decision.decisionLine | document.field8 | Số QĐ |
| BM-069 | person.occupation | document.field10 | Nghề nghiệp |
| BM-069 | document.summaryLine | document.field12 | Tóm tắt nội dung |
| BM-073 | person.dateOfBirth | document.field3 | Ngày sinh |
| BM-073 | person.idNumber | document.field5 | Số CMND/CCCD |
| BM-162 | person.dateOfBirth | document.field3 | Ngày sinh |
| BM-163 | person.dateOfBirth | document.field3 | Ngày sinh |

### High-Value Items for Review (semantic path but generic placeholder)

These items have the correct path but generic placeholder — opening the original DOCX
would confirm the label:

- document.fullDocumentCode across ALL 9 BMs — likely "Số/Ký hiệu văn bản" or similar
- document.issueDate across 5 BMs — likely "Ngày ban hành"
- person.currentAddress across 4 BMs — likely "Địa chỉ" or "Nơi ở hiện nay"
- person.personFullName across 4 BMs — likely "Họ tên"
- person.idNumber across 3 BMs — likely "Số CMND/CCCD"

## Safety Checklist

| Check | Result |
|-------|--------|
| Locked contracts mutated | **false** |
| DOCX touched | **false** |
| Compiled artifacts hand-edited | **false** |
| No binding loss | **true** |
| No placeholder count mismatch | **true** |

## Validation

This planning task did not mutate any file in `storage/`, `docs/contracts/`, or
`docs/audit/docx/`. All outputs are new files in `docs/audit/docx-wave-02-placeholder-fix-planning/`.
