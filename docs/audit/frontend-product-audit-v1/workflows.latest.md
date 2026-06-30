# User Workflow Audit — QUANLYVKS Frontend Audit V1

> Generated: 2026-06-30

## Workflow 1: Open Template Selector

### Expected Flow
```
User opens /templates
User sees clear search/filter UI
User sees total templates and suitable templates
User does not see technical DB/API/debug labels
User can choose case/hồ sơ
User can open a form
```

### Current Status: PARTIAL (P1 Issues)

#### Issues Found

| Issue ID | Severity | Category | File | Evidence | User Impact | Recommended Fix | Safe Without Backend |
|----------|----------|----------|------|----------|-------------|-----------------|---------------------|
| WF1-01 | P1 | DEBUG_LEAK | template-selector-workspace.tsx:852 | "Biểu mẫu trong DB" stat card label | Users see internal DB terminology | Replace with "Đã triển khai" or remove | Yes |
| WF1-02 | P1 | DEBUG_LEAK | template-selector-workspace.tsx:879 | "Catalog API" stat card label | Users see technical API terminology | Replace with "Danh mục nền tảng" | Yes |
| WF1-03 | P1 | DEBUG_LEAK | template-selector-workspace.tsx:1003 | `{templateCatalogMeta.sourceZip}` displayed | Shows internal zip file path | Hide this chip or make it admin-only | Yes |
| WF1-04 | P1 | COPY | template-selector-workspace.tsx:788 | "QUANLYVKS / TEMPLATE SELECTOR" header | Internal route name exposed | Replace with "Chọn biểu mẫu pháp lý" | Yes |
| WF1-05 | P2 | UI | template-selector-workspace.tsx | No loading skeleton for initial load | Jumpy layout during data fetch | Add skeleton loading state | Yes |

### Current Behavior
- Loading state: "Đang tải..." text only
- Error state: ErrorBanner component used
- Empty state: Handled with casePickerError message

---

## Workflow 2: Open Generated Form

### Expected Flow
```
User opens a selected form
User sees form title, case info, document number
User sees clearly grouped Vietnamese form sections
User sees action bar
User can input data
User can optionally fill sample data
```

### Current Status: PARTIAL (P0 + P1 Issues)

#### Issues Found

| Issue ID | Severity | Category | File | Evidence | User Impact | Recommended Fix | Safe Without Backend |
|----------|----------|----------|------|----------|-------------|-----------------|---------------------|
| WF2-01 | P0 | UX | generated-document-workspace.tsx | NO "Điền dữ liệu mẫu" button visible | Users cannot prefill with sample data | Add prominent sample prefill button | Yes |
| WF2-02 | P1 | DEBUG_LEAK | generated-document-workspace.tsx:643 | "Mã biểu mẫu #{documentId}" displayed | Shows internal DB ID to users | Replace with "Số định danh" or remove | Yes |
| WF2-03 | P1 | DEBUG_LEAK | published-contract-form-inputs.tsx:117 | "Contract runtime · {templateCode} · v{version}" | Exposes internal runtime terminology | Hide this debug panel or make admin-only | Yes |
| WF2-04 | P1 | DEBUG_LEAK | published-contract-form-inputs.tsx:120 | `{contractHash}` in monospace | Shows long hash to users | Hide this line entirely | Yes |
| WF2-05 | P2 | COPY | generated-document-workspace.tsx:608 | `UNKNOWN_SCOPE` fallback for renderScope | Unclear scope label | Show Vietnamese label like "Cấp văn bản" | Yes |

### Current Behavior
- Form title: Shows `{templateCode} - {templateName}` correctly
- Case context: Shows in header chips
- Section headers: Uses raw keys from contract schema (document, receiver, informant, etc.)
- Action bar: "Lưu dữ liệu biểu mẫu" button exists

---

## Workflow 3: Sample Prefill

### Expected Flow
```
User clicks "Điền dữ liệu mẫu"
Empty fields are filled
Existing user-entered fields are preserved by default
User can choose overwrite if needed
Sample mode banner appears
Sample data is not persisted unless user saves
```

### Current Status: **NOT IMPLEMENTED (P0 Blocker)**

#### Issues Found

| Issue ID | Severity | Category | File | Evidence | User Impact | Recommended Fix | Safe Without Backend |
|----------|----------|----------|------|----------|-------------|-----------------|---------------------|
| WF3-01 | P0 | UX | generated-document-workspace.tsx | NO sample prefill button in UI | **CRITICAL: Users cannot prefill forms** | Add "Điền dữ liệu mẫu" button in action bar | Yes |
| WF3-02 | P0 | BACKEND_WIRING | N/A | `getSampleData()` and `mergeWithSampleData()` exist but NOT wired to any UI | Sample data infrastructure exists but unusable | Wire functions to new UI button | Yes |
| WF3-03 | P1 | UX | generated-document-workspace.tsx | No sample mode indicator | Users don't know if form has sample data | Show banner "Chế độ xem trước - chưa lưu" | Yes |

### Infrastructure Available
- `getSampleData(templateCode, contractFields)` in `sample-data.ts` ✓
- `mergeWithSampleData(existing, sample)` in `sample-data.ts` ✓
- 1735/1735 sample data coverage ✓
- `generateSampleFromFields()` for dynamic generation ✓

### Missing: UI Button and Wiring

---

## Workflow 4: Save/Reload

### Expected Flow
```
User edits data
User saves draft
App confirms saved
User reloads page
Saved user data remains
Sample data does not resurrect stale values
```

### Current Status: PARTIAL (P2 Issues)

#### Issues Found

| Issue ID | Severity | Category | File | Evidence | User Impact | Recommended Fix | Safe Without Backend |
|----------|----------|----------|------|----------|-------------|-----------------|---------------------|
| WF4-01 | P2 | STATE_FLOW | published-contract-form-inputs.tsx:104 | Success message: "Đã lưu theo published contract." | Unclear message | Change to "Đã lưu biểu mẫu." | Yes |
| WF4-02 | P2 | UX | published-contract-form-inputs.tsx | No dirty state indicator | User doesn't know if unsaved changes exist | Add asterisk or "Unsaved" badge | Yes |
| WF4-03 | P2 | UX | published-contract-form-inputs.tsx | No autosave indicator | No feedback between saves | Consider autosave with status | No |

### Current Behavior
- Save button: "Lưu dữ liệu biểu mẫu" ✓
- Success toast: Inline message (not toast notification)
- Error handling: Inline error message
- Reload: Data persists via `/render-payload` on mount

---

## Workflow 5: Export DOCX/PDF

### Expected Flow
```
User exports Word/PDF
App shows progress
Download starts
Exported file contains user data
No placeholder/undefined/null/"Ô trống"
Export history visible or at least action feedback visible
```

### Current Status: UNKNOWN (Cannot verify without running app)

#### Issues to Check

| Issue ID | Severity | Category | File | Evidence | User Impact | Recommended Fix | Safe Without Backend |
|----------|----------|----------|------|----------|-------------|-----------------|---------------------|
| WF5-01 | P2 | UX | generated-document-action-panel.tsx | Cannot verify without running app | Need runtime check | Add export progress indicator | Partial |
| WF5-02 | P2 | UX | generated-document-action-panel.tsx | Cannot verify without running app | Need runtime check | Add export success/error toast | Partial |
| WF5-03 | P1 | BACKEND_WIRING | generated-document-workspace.tsx:694-708 | PublishedContractFormInputsPanel vs Panel logic | Only published contracts show save? | Verify all BM types can save | Partial |

---

## Workflow 6: Reports

### Expected Flow
```
User opens reports
Filters week/month
Sees summary
Exports CSV/PDF safely
```

### Current Status: GOOD (Minor P3 Issues)

#### Issues Found

| Issue ID | Severity | Category | File | Evidence | User Impact | Recommended Fix | Safe Without Backend |
|----------|----------|----------|------|----------|-------------|-----------------|---------------------|
| WF6-01 | P3 | UI | reports/page.tsx:120 | Uses `bg-zinc-50` instead of `bg-slate-50` | Inconsistent color palette | Use consistent slate palette | Yes |
| WF6-02 | P3 | COPY | reports/page.tsx:125 | "Báo cáo - Thống kê" header | Minor copy improvement | "Báo cáo thống kê" | Yes |

### Current Behavior
- Week/Month filter: Working toggle buttons ✓
- Date anchor: Date picker working ✓
- Summary cards: 4 metric cards ✓
- Detail table: Grouped by time/ward/offense ✓
- Export buttons: CSV and Print/PDF ✓

---

## Summary Statistics

| Workflow | Overall Status | P0 | P1 | P2 | P3 |
|----------|---------------|-----|-----|-----|-----|
| Template Selector | PARTIAL | 0 | 4 | 1 | 0 |
| Generated Form | PARTIAL | 1 | 3 | 1 | 0 |
| Sample Prefill | **NOT IMPLEMENTED** | **2** | 1 | 0 | 0 |
| Save/Reload | PARTIAL | 0 | 0 | 3 | 0 |
| Export | UNKNOWN | 0 | 1 | 2 | 0 |
| Reports | GOOD | 0 | 0 | 0 | 2 |

### Critical Blockers (Must Fix Before Launch)
1. **WF3-01**: Add sample prefill button (P0)
2. **WF3-02**: Wire sample data functions to UI (P0)

### High Priority (Should Fix Soon)
1. Hide debug labels in template selector
2. Hide contract runtime/hash in form editor
3. Replace internal IDs with user-friendly labels
