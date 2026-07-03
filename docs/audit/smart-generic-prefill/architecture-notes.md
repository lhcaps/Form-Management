# Smart Generic Prefill — Architecture Notes

> Audit date: 2026-07-03
> Scope: Runtime standalone template (`/templates/:templateCode`), NOT case-bound documents.

---

## 1. Background and Problem Statement

Users must manually fill every field in 213 legal templates. Many fields (place/date boilerplate, agency headers, distribution lines) are identical across all documents. These should be prefillable with generic defaults, leaving only case-specific legal fields for the user to enter.

**This is not a demo-data feature.** The previous "Điền dữ liệu mẫu" button injected hardcoded demo values (fake people, fake dates in 2025-2026, fake offense descriptions). PR #35 renamed this to "Dữ liệu demo" with explicit warning copy, clarifying it is demo-only. The separate "Điền nhanh thông tin chung" action prefills only truly generic, context-independent fields with current date — this is the safe primary action.

---

## 2. Current Architecture

### 2.1 Relevant Files

| File | Role |
|------|------|
| `apps/web/src/features/forms-contracts/sample-data.ts` | Hardcoded demo sample data (labeled DEMO DATA ONLY; not runtime defaults) |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | UI: "Dữ liệu demo" button → `applySampleData()` |
| `apps/web/src/lib/runtime-template-draft.ts` | localStorage draft persistence |
| `apps/web/src/lib/runtime-template-preview.ts` | Runtime preview session (no DB write) |
| `apps/web/src/lib/runtime-template-export.ts` | DOCX render/export |
| `apps/web/src/lib/runtime-template-case-import.ts` | Case-bound import (not in scope) |
| `packages/form-contracts/src/` | Contract types, field definitions |
| `docs/audit/docx/compiled-v2/*.compiled.json` | 213 compiled contract artifacts |

### 2.2 Current Sample Data Flow

```
User clicks "Dữ liệu demo"
  → getSampleData(templateCode, fields)
    → SAMPLE_REGISTRY[templateCode] (BM-001, BM-002, BM-003 explicit overrides)
    → generateSampleFromFields(fields) (heuristic generation; guarded for dangerous labels)
  → mergeWithSampleData(existingData, sample)
    → for each sample field: if existing is empty → fill it
  → setData(merged)
  → message: "Đã điền dữ liệu demo vào các trường còn trống."
```

**Key behaviors confirmed:**
1. `getSampleData` is **field-label + path-based** (matches against `ALL_DEFAULTS` dictionary and label heuristics)
2. `mergeWithSampleData` **never overwrites existing user values** (only fills empty fields)
3. Sample data **only applies on explicit user click**, not on page load
4. Sample data is **excluded from `audit:hardcode`** via `isAuditExcluded()` in `audit-runtime-hardcodes.mjs`
5. No local draft data is overwritten on page load — draft is loaded first, then sample is merged on user action

### 2.3 Where "ngày 01 tháng 01 năm 2026" Comes From

The stale 2026 place-date appeared in (addressed in PR #35):
- `DOCUMENT_DEFAULTS['document.issuePlaceDateLine']` (removed in PR #35)
- `SAMPLE_REGISTRY['BM-001']['document.issuePlaceDateLine']` (removed in PR #35)
- `D_DATE = "01"`, `D_MONTH = "01"`, `D_YEAR = "2026"`, `D_FULL_DATE = "2026-01-01"` (kept for non-date fields, guarded for birth/offense/case/identity)
- Label heuristic `if (l.includes("năm")) return "2026"` (now guarded — returns `""` for birth/offense/case/identity fields in PR #35)

This is **demo sample data**, not generic defaults. It is marked as excluded from hardcode audit.

### 2.4 Identity Issue Date Field Guards (PR #35)

Identity issue dates (`Ngày cấp CCCD`, `Ngày cấp CMND`, `Năm cấp`, etc.) are person-specific legal facts and must NOT be filled by generic fallback. They are blocked at two levels:

1. **Label guard** (`getDateGuardMatch`, step 0): Blocks any label matching `^ngày\s+cấp` (covers `ngày cấp`, `ngày cấp CCCD`, `ngày cấp CMND`, etc.), plus `tháng cấp`, `năm cấp`, `cấp ngày`, `cấp tháng`, `cấp năm`, and all detention/offense/prosecution year variants.

2. **Path guard** (step 0b/0c): Blocks any field key matching `identityIssue*DateLine`, `identityIssue*Date`, `identityIssue*Day`, `identityIssue*Month`, `identityIssue*Year` (both `Issue*` and `Issued*` variants). Also blocks the generic label `ngày` / `tháng` / `năm` for these paths to prevent last-segment domain dict matching (e.g., `birthDay` inside `identityIssueDateLine`).

Demo values for identity issue fields must come from **explicit registry** or test fixtures, not broad heuristic fallback.

---

## 3. Field Classification System

### 3.1 Four Classifications

| Classification | Count | Description | Auto-fill in v1? |
|---|---|---|---|
| `SAFE_RUNTIME_DEFAULT` | 69 | SYSTEM/CURRENT_DATE fields with safe place/date labels | YES (button) |
| `SAFE_GENERIC_PREFILL` | 384 | MANUAL fields that are truly generic boilerplate | YES (button) |
| `REVIEW_REQUIRED` | 37 | Ambiguous fields needing manual review before classification | NO |
| `NEVER_AUTO` | 2,007 | Case-specific/legal facts | NEVER |

### 3.2 SAFE_RUNTIME_DEFAULT (69 fields)

SYSTEM/CURRENT_DATE fields where the label and path match safe document metadata patterns:

```
document.issuePlaceDateLine     — Địa điểm, ngày lập
document.issuePlaceAndDateLine  — Địa danh, ngày ban hành
document.issueDate             — Ngày ban hành (SYSTEM kind)
```

All are SYSTEM data source, meaning the runtime form contract itself declares these as `dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" }`. The runtime defaults come from the **contract definition**, not the sample data.

These fields need real runtime date (current date) and place (from context). They are safe to prefill because they are the document's own metadata header, not facts about a case.

### 3.3 SAFE_GENERIC_PREFILL (384 fields)

MANUAL/CONSTANT fields that are genuinely generic boilerplate:

```
recipients.archiveLine         — Nơi lưu (Lưu: HSVA, HSKS, VP.)
recipients.distributionLine     — Nơi nhận / Phân phối
legalBasis.*                   — Căn cứ Điều X Bộ luật Tố tụng hình sự
signature.*                    — Người ký / Chức vụ
agency.*                       — Tên cơ quan, địa chỉ
```

These are constant across documents of the same agency. They do not decide legal facts.

### 3.4 REVIEW_REQUIRED (37 fields)

Ambiguous fields that require human classification before auto-fill:

```
sourceSuspension.*             — Ngày tiếp nhận nguồn tin
sourceRecovery.*               — Ngày quyết định tạm đình chỉ
initiationRequest.*            — Ngày quyết định khởi tố ban đầu
investigationExtension.*       — Từ ngày / Đến ngày (gia hạn điều tra)
person.birthInfoLine           — Sinh ngày, tháng, năm, nơi sinh
reporter.birthDateLine         — Sinh ngày
sourceReport.receivedDateLine   — Ngày tiếp nhận
document.ngayLap               — Ngày lập
```

These contain "ngày" in the label but are not clearly document metadata or clearly case facts.

### 3.5 NEVER_AUTO (2,007 fields)

Case-specific/legal facts. Must remain blank for the user to enter:

```
accused.*                      — Bị can, ngày sinh, ngày bắt, ngày tạm giữ
victim.*                       — Bị hại
witness.*                      — Người làm chứng
offense.*                       — Tội danh, điều luật, ngày phạm tội
case.*                         — Số vụ án, tên vụ việc
measure.*                      — Biện pháp ngăn chặn
decision.*                     — Số quyết định, ngày quyết định
detentionArrest.*              — Ngày tạm giữ
prosecution.*                  — Ngày khởi tố
indictment.*                    — Cáo trạng
person.birthDay/Month/Year     — Ngày sinh
person.identityIssue*           — Ngày cấp CMND/CCCD
investigation.*               — Ngày nhận, ngày giao hồ sơ
```

---

## 4. Architecture Options

### Option A — Patch Current `getSampleData`

Change `sample-data.ts` to produce safer values (current date instead of 2026, strip person data).

**Pros:** Minimal diff.
**Cons:** Still mixes demo and generic defaults; harder to expand; the sample-data file is already excluded from hardcode audit by design.

### Option B — New `smart-generic-prefill.ts` Layer (RECOMMENDED)

Create `apps/web/src/lib/smart-generic-prefill.ts` with:

```typescript
export type SmartPrefillContext = {
  now: Date;
  timezone: 'Asia/Ho_Chi_Minh';
  defaultPlace: string;
};

export type PrefillClassification =
  | 'SAFE_RUNTIME_DEFAULT'
  | 'SAFE_GENERIC_PREFILL'
  | 'REVIEW_REQUIRED'
  | 'NEVER_AUTO';

export function getSmartGenericPrefillData(
  templateCode: string,
  fields: CompiledFormContract['source']['fields'],
  context: SmartPrefillContext,
): Record<string, unknown>;

export function mergeWithSmartPrefill(
  current: Record<string, unknown>,
  prefill: Record<string, unknown>,
): Record<string, unknown>;
```

**Pros:** Clean separation; testable with injected date; does not mutate contracts; keeps demo sample separate.
**Cons:** Slightly larger PR.

### Option C — Server-side Defaults Endpoint

`GET /api/v1/forms/runtime/:templateCode/defaults`

**Pros:** Centralized; future agency/official profile support.
**Cons:** Larger PR; not needed for v1.

### Option D — Mutate 213 Contracts

**REJECTED.** Locked contracts are source of truth. Do not mass-edit.

---

## 5. Proposed Implementation Plan (Option B)

### 5.1 New file: `apps/web/src/lib/smart-generic-prefill.ts`

```
Centralize defaults:
  DEFAULT_RUNTIME_TEMPLATE_PLACE = 'TP. Hồ Chí Minh'
  DEFAULT_RUNTIME_TEMPLATE_TIMEZONE = 'Asia/Ho_Chi_Minh'

Date formatter:
  formatVietnameseDate(date: Date, place?: string)
  → "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026"
  → "ngày 03 tháng 07 năm 2026"

Prefill generators:
  generateSafeRuntimeDefaults(fields, context) → SAFE_RUNTIME_DEFAULT values
  generateSafeGenericDefaults(fields, context) → SAFE_GENERIC_PREFILL values
  getSmartGenericPrefillData(templateCode, fields, context) → merged prefill

Load classification from field-inventory.json or inline registry.

mergeWithSmartPrefill(existing, prefill) → only fills empty fields.
```

### 5.2 UX Changes in `template-preview-workspace.tsx`

**Option 1 (Recommended):** Two separate buttons
```
Button 1: "Điền nhanh thông tin chung" → SAFE_RUNTIME_DEFAULT + SAFE_GENERIC_PREFILL
Button 2: "Dữ liệu demo" → current getSampleData behavior (clearly labeled as demo)
```

### 5.3 Policy Decisions Needed

1. **Auto-apply on empty template load?** Recommendation: NO. User must explicitly click.
2. **Overwrite existing values?** NO. Only fill empty fields (already the behavior of `mergeWithSampleData`).
3. **Default place source?** v1 fallback: hardcoded `TP. Hồ Chí Minh`. v2: agency profile.
4. **Demo sample data?** Keep `sample-data.ts` for explicit demo use, clearly labeled.
5. **REVIEW_REQUIRED fields?** Do NOT auto-fill. Keep blank.

---

## 6. Default Context Policy

```typescript
export const DEFAULT_RUNTIME_TEMPLATE_PLACE = 'TP. Hồ Chí Minh';
export const DEFAULT_RUNTIME_TEMPLATE_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DEFAULT_RUNTIME_TEMPLATE_DATE_FORMAT = 'ngày DD tháng MM năm YYYY';
```

**Do not scatter hardcoded place/date strings** across the codebase. Centralize in one module.

Date formatting:
- Full: `{place}, ngày DD tháng MM năm YYYY` → "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026"
- Date only: `ngày DD tháng MM năm YYYY` → "ngày 03 tháng 07 năm 2026"
- ISO: `YYYY-MM-DD` → "2026-07-03"

---

## 7. Test Plan

### Unit tests (`smart-generic-prefill.test.ts`):
- Formats Vietnamese legal date correctly with injected Date
- Generates place-date from injected Date
- Does not fill `accused.birthDay`, `offense.dateOfOffense`, `detentionArrest.detentionDate`, `person.dateOfBirth`
- Does not fill `decision.decisionCode`, `case.caseCode`, `offense.legalArticle`
- Fills only allowlisted document metadata fields
- `mergeWithSmartPrefill` never overwrites existing values
- Classification is correct for all four categories

### Web tests:
- Clicking "Điền nhanh thông tin chung" fills "Địa điểm, ngày lập" with current date (injected)
- Important case-specific fields remain blank
- User-entered values are preserved after prefill
- Preview/export receives merged data

### E2E/smoke:
- `/templates/BM-001` loads
- Click prefill button
- Field `document.issuePlaceDateLine` contains current date (injected in test)
- DOCX preview/export still works
- `audit:hardcode` passes (no stale 2026 values in new code)

### Audit:
- field-inventory.json generated and committed
- No locked contracts changed
- No unsafe fields auto-filled

---

## 8. Corpus Statistics

| Metric | Value |
|--------|-------:|
| Total templates scanned | 213 |
| Total fields scanned | 2,497 |
| SAFE_RUNTIME_DEFAULT | 69 |
| SAFE_GENERIC_PREFILL | 384 |
| REVIEW_REQUIRED | 37 |
| NEVER_AUTO | 2,007 |
| SYSTEM/CURRENT_DATE fields | 96 |
| Fields with hardcoded 2026 sample values | 110 |

**Viable prefill fields for v1:** 453 fields (69 SAFE_RUNTIME_DEFAULT + 384 SAFE_GENERIC_PREFILL)

---

## 9. Risks and Open Questions

1. **Default place**: v1 uses hardcoded `TP. Hồ Chí Minh`. What if the agency is not in HCMC?
2. **REVIEW_REQUIRED reclassification**: Some fields may be safely prefillable with more review. Deferred to v2.
3. **`document.ngayBan`**: These are SAFE_GENERIC_PREFILL in the current classification, but they use "01" as the sample value. Real generic default should use current date part.
4. **`sample-data.ts` coexisting**: The demo sample data existed alongside smart prefill. PR #35 clarified the separation.
5. **Agency/official profile**: Future v2 could use real agency name and address for `agency.*` prefill.
6. **Field inventory freshness**: The `field-inventory.json` needs to be regenerated if contracts are recompiled.

---

## 10. Deliverables

| File | Status |
|------|--------|
| `scripts/audit/smart-generic-prefill.mjs` | Created |
| `docs/audit/smart-generic-prefill/field-inventory.csv` | Generated |
| `docs/audit/smart-generic-prefill/field-inventory.json` | Generated |
| `docs/audit/smart-generic-prefill/architecture-notes.md` | This file |
| `docs/audit/smart-generic-prefill/latest.md` | Created |
| `docs/audit/smart-generic-prefill/latest.json` | Created |
| `apps/web/src/lib/smart-generic-prefill.ts` | Created in PR #34 |
| `apps/web/src/lib/smart-generic-prefill.test.ts` | Created in PR #34 |
| `apps/web/src/lib/template-preview-workspace.prefill.test.ts` | Created in PR #34 |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | Updated in PR #34 |
| `apps/web/src/features/forms-contracts/sample-data.ts` | Clarified in PR #35 |
| `apps/web/src/features/forms-contracts/sample-data.test.ts` | Extended in PR #35 |

---

## 11. PR #35 Demo Data Cleanup Findings

After PR #34 shipped, discovery confirmed stale demo data issues that were addressed in PR #35 (`chore/demo-sample-data-cleanup`):

**Confirmed problems:**
1. `SAMPLE_REGISTRY['BM-001']['document.issuePlaceDateLine']` = stale fixed date (removed in PR #35)
2. `SAMPLE_REGISTRY['BM-002']['document.issueDate']` = `"2026-01-01"` (removed in PR #35)
3. `SAMPLE_REGISTRY['BM-003']['document.issueDate']` = `"2026-01-01"` (removed in PR #35)
4. `DOCUMENT_DEFAULTS['document.issuePlaceDateLine']` = stale fixed date (removed in PR #35)
5. `D_YEAR = "2026"`, `D_FULL_DATE = "2026-01-01"` (kept but guarded)
6. Label heuristic `if (l.includes("năm")) return "2026"` — too broad (guarded in PR #35)

**PR #35 fixes applied:**
- `SAMPLE_REGISTRY` for BM-001/002/003: stale `document.issueDate` and `document.issuePlaceDateLine` entries removed
- `DOCUMENT_DEFAULTS`: `document.issuePlaceDateLine` entry removed
- `generateFieldValue`: NEVER_AUTO label guards added before broad `ngày`/`tháng`/`năm` heuristics — birth/detention/offense/case/legal-fact date fields now return `""` instead of demo values
- Demo place-date formatters added (`formatDemoVietnameseLegalDate`, `formatDemoVietnamesePlaceDate`) with explicit "DEMO DATA ONLY" comments
- `sample-data.ts` top-of-file warning: *"DEMO DATA ONLY. Do not use as legal/runtime defaults. Real safe defaults live in smart-generic-prefill.ts."*
- UI: "Dữ liệu demo" keeps `title="Dữ liệu demo — không dùng cho vụ việc thực"`, added visible italic warning: *"Dữ liệu demo chỉ dùng để kiểm thử/xem thử biểu mẫu, không dùng cho văn bản thật."*
- Demo button message updated to: "Đã điền dữ liệu demo vào các trường còn trống."

**Architecture maintained:**
- Demo sample data (`sample-data.ts`) is fully separate from Smart Generic Prefill (`smart-generic-prefill.ts`)
- Smart Generic Prefill behavior unchanged by PR #35
- Runtime-only boundary preserved (no generated document DB behavior)

---

*Generated: 2026-07-03. Cursor agent research phase.*
