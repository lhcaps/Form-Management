# Per-Form Render Accurate — BM-002 Patch Plan (Corrected v2)

Generated: 2026-06-27T05:20:00.000Z
Task: PER_FORM_RENDER_ACCURATE_BM002_PATCH_PLAN_CORRECTED
File: `BM-002__f78301178da7.contract.locked.json`

---

## Corrections from Original Patch Plan (v1 → v2)

The original patch plan had **4 critical errors**:

| # | Error in v1 | Corrected in v2 |
|---|------------|-----------------|
| 1 | Targeted `docxSlots[N].label` | Must target **`canonicalFields[N].label`** — audit reads canonicalFields, not docxSlots |
| 2 | Wrong index for `reporter.organizationRepresentative` (was 24) | Correct: **23** |
| 3 | Wrong index for `sourceReport.content` (was 25) | Correct: **24** |
| 4 | Wrong index for `recipients.primaryLine` (was 28) | Correct: **25** |
| 5 | Wrong index for `recipients.archiveLine` (was 29) | Correct: **26** |
| 6 | Wrong label: `document.issuePlaceAndDateLine` → "Nơi cấp" | Correct: **"Địa điểm, ngày tháng năm"** |
| 7 | Wrong label: `reporter.organizationRepresentative` → "Là đại diện" | Correct: **"Người đại diện cơ quan, tổ chức"** |

---

## Audit Source Analysis (Root Cause of v1 Errors)

### How BAD_LABEL is triggered

| Item | Detail |
|------|--------|
| Issue code | `BAD_LABEL` |
| Source array | `canonicalFields` |
| Source field | `canonicalFields[N].label` |
| Trigger logic | `isBadLabel(canonicalFields[N].label, canonicalFields[N].path) === bad` |
| Trigger conditions | Empty string, "Ô trống", starts with "Slot from", contains "remediation", contains "TODO", contains "unknown", matches `^field\d+$`, or raw camelCase with no Vietnamese and not in `PATH_OVERRIDE_VALUES` set |
| File | `scripts/audit/audit-forms-root-cause.mjs` |
| Function | `auditField()` — Rule 1: BAD_LABEL |

### How UI_VISIBLE_BAD_METADATA is triggered

| Item | Detail |
|------|--------|
| Issue code | `UI_VISIBLE_BAD_METADATA` |
| Source array | `canonicalFields` via `deriveFormInputSchema()` |
| Source field | `getFieldLabel(canonicalFields[N].path, canonicalFields[N].label)` |
| Label resolution | `deriveFormInputSchema()` calls `getFieldLabel(path, label)` from `packages/form-contracts/src/field-labels.ts` |
| Resolution chain | 1. Use rawLabel if not BAD_LABELS and not in `LABEL_TAIL_MAP`. 2. `PATH_OVERRIDES` exact path. 3. `LABEL_TAIL_MAP` tail. 4. Humanize fallback. |
| Trigger condition | `isBadLabel(resolvedLabel, path) === bad` AND field is visible (source ≠ computed) |
| File | `scripts/audit/audit-forms-root-cause.mjs` |
| Function | `auditContract()` — Rule 6: UI_VISIBLE_BAD_METADATA |

### Key Finding

> **Both issue codes read from `canonicalFields[].label`.**
> `docxSlots[].label` is NOT read by the audit.
> The original patch plan targeted the WRONG array and would NOT have reduced BAD_LABEL/UI_VISIBLE counts.

---

## Summary

| Metric | Value |
|--------|-------|
| Total physical edits | 10 |
| File to modify | 1 |
| Array to modify | `canonicalFields` |
| Risk level | LOW |
| Modification type | Label-only (no path, no binding, no DOCX) |
| Expected BAD_LABEL delta | **-10** |
| Expected UI_VISIBLE delta | **-9** |
| Render output changes | No |
| Approval required | YES |

---

## Corrected Changes — Bucket A (SAFE_LABEL_ONLY)

All 10 changes modify `canonicalFields[N].label` only. No path changes, no binding changes, no DOCX mutation.

### Change 1 — `document.issuePlaceAndDateLine`

| Field | Value |
|-------|-------|
| Array index | **3** |
| JSON path | `canonicalFields[3].label` |
| Old value | `issuePlaceAndDateLine` |
| New value | **`Địa điểm, ngày tháng năm`** |
| Visible context | `[Auto-generated] {{document.issuePlaceAndDateLine}}` — header date/place line. source=systemDate. |
| v1 error | Proposed "Nơi cấp" (wrong — means ID card issue place, not document header) |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `issuePlaceAndDateLine` |

### Change 2 — `sourceReport.receivedDateLine`

| Field | Value |
|-------|-------|
| Array index | **5** |
| JSON path | `canonicalFields[5].label` |
| Old value | `receivedDateLine` |
| New value | **`Ngày tiếp nhận`** |
| Visible context | `[Auto-generated] Ngày` — date of receipt. source=systemDate. |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `receivedDateLine` |

### Change 3 — `reporter.genderText`

| Field | Value |
|-------|-------|
| Array index | **8** |
| JSON path | `canonicalFields[8].label` |
| Old value | `genderText` |
| New value | **`Giới tính`** |
| Visible context | `[Auto-generated] Họ tên: ... Giới tính:` — clearly labeled. source=manual. |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `genderText` |

### Change 4 — `reporter.otherName`

| Field | Value |
|-------|-------|
| Array index | **9** |
| JSON path | `canonicalFields[9].label` |
| Old value | `otherName` |
| New value | **`Tên gọi khác`** |
| Visible context | `[Auto-generated] Tên gọi khác:` — directly labeled. source=manual. |
| Note | NOT in `LABEL_TAIL_MAP` tail "otherName" — audit correctly flags it. |
| Risk | LOW |
| Audit delta | BAD_LABEL -1 |
| Rollback | Revert to `otherName` |

### Change 5 — `reporter.birthDateLine`

| Field | Value |
|-------|-------|
| Array index | **10** |
| JSON path | `canonicalFields[10].label` |
| Old value | `birthDateLine` |
| New value | **`Sinh ngày`** |
| Visible context | `[Auto-generated] Sinh ngày` — directly labeled. source=systemDate. |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `birthDateLine` |

### Change 6 — `reporter.identityIssueDateLine`

| Field | Value |
|-------|-------|
| Array index | **17** |
| JSON path | `canonicalFields[17].label` |
| Old value | `identityIssueDateLine` |
| New value | **`Cấp ngày`** |
| Visible context | `[Auto-generated] Cấp ngày` — directly labeled. source=systemDate. |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `identityIssueDateLine` |

### Change 7 — `reporter.organizationRepresentative`

| Field | Value |
|-------|-------|
| Array index | **23** |
| JSON path | `canonicalFields[23].label` |
| Old value | `organizationRepresentative` |
| New value | **`Người đại diện cơ quan, tổ chức`** |
| Visible context | `[Auto-generated] Là người đại diện của cơ quan, tổ chức (nếu có):` — full context is visible in the form. |
| v1 error | Proposed "Là đại diện" (too vague — cuts off the full context). Also wrong index (was 24). |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `organizationRepresentative` |

### Change 8 — `sourceReport.content`

| Field | Value |
|-------|-------|
| Array index | **24** |
| JSON path | `canonicalFields[24].label` |
| Old value | `content` |
| New value | **`Nội dung`** |
| Visible context | `[Auto-generated] Nội dung:` — directly labeled. source=manual. |
| v1 error | Wrong index (was 25). |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `content` |

### Change 9 — `recipients.primaryLine`

| Field | Value |
|-------|-------|
| Array index | **25** |
| JSON path | `canonicalFields[25].label` |
| Old value | `primaryLine` |
| New value | **`Nơi nhận`** |
| Visible context | Appears below "Nơi nhận:" label. Standard Vietnamese administrative label. source=manual. |
| v1 error | Wrong index (was 28). |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `primaryLine` |

### Change 10 — `recipients.archiveLine`

| Field | Value |
|-------|-------|
| Array index | **26** |
| JSON path | `canonicalFields[26].label` |
| Old value | `archiveLine` |
| New value | **`Nơi lưu`** |
| Visible context | Second recipient line, for archive/copy recipients. source=manual. |
| v1 error | Proposed "Nơi nhận lưu" (too verbose). Wrong index (was 29). |
| Risk | LOW |
| Audit delta | BAD_LABEL -1, UI_VISIBLE_BAD_METADATA -1 |
| Rollback | Revert to `archiveLine` |

---

## docxSlots Misalignment (Informational — NOT in scope)

The `docxSlots` array has swapped/misaligned labels for several fields. This is a **separate issue** from the canonicalFields label problem. The docxSlots misalignment does NOT trigger any audit issues because the audit reads `canonicalFields[].label`, not `docxSlots[].label`.

However, for long-term consistency, the docxSlots labels should also be corrected. This should be tracked as a separate task with separate approval. **This SAFE_LABEL_ONLY patch does NOT fix docxSlots labels.**

Affected docxSlots (informational):
- `docxSlots[10].label` = `"birthDateLine"` but slot is at index 10, path is `reporter.birthDateLine`
- `docxSlots[17].label` = `"identityIssueDateLine"` but slot is at index 17, path is `reporter.identityIssueDateLine`
- `docxSlots[24].label` = `"content"` but path is `reporter.organizationRepresentative`
- `docxSlots[25].label` = `"primaryLine"` but path is `sourceReport.content`
- `docxSlots[28].label` = `"signerName"` but path is `recipients.primaryLine`
- `docxSlots[29].label` = `"undefined"` but path is `recipients.archiveLine`

---

## Preflight Validation (Required Before Apply)

Before writing the contract, validate ALL of the following:

```javascript
// Assert contract identity
contract.templateCode === 'BM-002'
contract.sourceId === 'f78301178da7'

// Assert counts unchanged
contract.canonicalFields.length === 31
contract.docxSlots.length === 31
contract.renderBindings.length === 31

// Assert each label field's old value
contract.canonicalFields[3].path === 'document.issuePlaceAndDateLine'
contract.canonicalFields[3].label === 'issuePlaceAndDateLine'   // must match exactly

contract.canonicalFields[5].path === 'sourceReport.receivedDateLine'
contract.canonicalFields[5].label === 'receivedDateLine'

contract.canonicalFields[8].path === 'reporter.genderText'
contract.canonicalFields[8].label === 'genderText'

contract.canonicalFields[9].path === 'reporter.otherName'
contract.canonicalFields[9].label === 'otherName'

contract.canonicalFields[10].path === 'reporter.birthDateLine'
contract.canonicalFields[10].label === 'birthDateLine'

contract.canonicalFields[17].path === 'reporter.identityIssueDateLine'
contract.canonicalFields[17].label === 'identityIssueDateLine'

contract.canonicalFields[23].path === 'reporter.organizationRepresentative'
contract.canonicalFields[23].label === 'organizationRepresentative'

contract.canonicalFields[24].path === 'sourceReport.content'
contract.canonicalFields[24].label === 'content'

contract.canonicalFields[25].path === 'recipients.primaryLine'
contract.canonicalFields[25].label === 'primaryLine'

contract.canonicalFields[26].path === 'recipients.archiveLine'
contract.canonicalFields[26].label === 'archiveLine'

// Assert renderBindings are unchanged (identity bindings)
contract.renderBindings.every(b => b.transform === 'identity' || b.transform.startsWith('date.'))
```

---

## Validation Steps (post-approval)

1. `pnpm typecheck` — must exit 0
2. `node scripts/audit/audit-forms-root-cause.mjs --report-only` — verify BM-002 BAD_LABEL count ≤ 0 and UI_VISIBLE_BAD_METADATA ≤ 0
3. `node scripts/audit/audit-rendered-text-fidelity.mjs --template-code BM-002` — must still PASS

---

## Approval Command

```
APPROVE_RENDER_ACCURATE_FORM BM-002 f78301178da7 SAFE_LABEL_ONLY
```

**No blocked buckets.** This patch contains only Bucket A changes — 10 label-only corrections on `canonicalFields[].label`.

---

_Patch plan corrected v2. All original errors identified and fixed. Do not apply until approval is given._
