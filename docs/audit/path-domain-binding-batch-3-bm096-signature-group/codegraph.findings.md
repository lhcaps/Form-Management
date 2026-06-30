# CodeGraph Findings: BM-096 Signature Group

## Query Summary

Queries performed:
1. `BM-096 signature.cheDo signature.chucVu signature.nguoiKy canonicalFields docxSlots renderBindings`
2. `audit-forms-root-cause.mjs signature fields analysis`

## Key Findings

### signature.cheDo
- **docxSlots entry**: `slotId=signature.cheDo`, context=`Nơi thường trú: {{document.field17}}{{document.field18}}`
- **canonicalFields entry**: `path=signature.cheDo`, label=`Ô trống`, source=`manual`
- **renderBinding**: `from=signature.cheDo`, transform=`identity`
- **audit issues**: GENERIC_FIELD_CANONICALIZATION, BAD_LABEL
- **visible Vietnamese**: `Nơi thường trú:` (permanent residence)

### signature.chucVu
- **docxSlots entry**: `slotId=signature.chucVu`, context=`Nơi thường trú: {{document.field17}}{{document.field18}}`
- **canonicalFields entry**: `path=signature.chucVu`, label=`Ô trống`, source=`manual`
- **renderBinding**: `from=signature.chucVu`, transform=`identity`
- **audit issues**: GENERIC_FIELD_CANONICALIZATION, BAD_LABEL
- **visible Vietnamese**: `Nơi thường trú:` (permanent residence)

### signature.nguoiKy
- **docxSlots entry**: `slotId=signature.nguoiKy`, context=`Nơi tạm trú: {{document.field19}}`
- **canonicalFields entry**: `path=signature.nguoiKy`, label=`Ô trống`, source=`manual`
- **renderBinding**: `from=signature.nguoiKy`, transform=`identity`
- **audit issues**: GENERIC_FIELD_CANONICALIZATION, BAD_LABEL
- **visible Vietnamese**: `Nơi tạm trú:` (temporary residence)

## Interpretation

All three fields have docxSlots entries with clear Vietnamese labels indicating **person address semantics** (`Nơi thường trú` = permanent residence, `Nơi tạm trú` = temporary residence), yet the canonical paths place them under `signature.*` domain. This is a systematic misclassification.

The correct semantic domain should be `person.*` (address fields), but the exact target path cannot be determined from DOCX alone without cross-BM inference. Classification: **DEFER_PATH_DOMAIN_MISMATCH**.

## Risk Analysis

| Field | Runtime Risk | Audit Risk | Recommended Action |
|-------|-------------|------------|-------------------|
| signature.cheDo | LOW - not a runtime field | HIGH - GENERIC_FIELD_CANONICALIZATION + BAD_LABEL | DEFER |
| signature.chucVu | LOW - not a runtime field | HIGH - GENERIC_FIELD_CANONICALIZATION + BAD_LABEL | DEFER |
| signature.nguoiKy | LOW - not a runtime field | HIGH - GENERIC_FIELD_CANONICALIZATION + BAD_LABEL | DEFER |

**Conclusion**: Keeping these fields under `signature.*` is not catastrophic but represents a systematic path-domain mismatch. DOCX context clearly shows address semantics. No action should be taken without planner/legal review.