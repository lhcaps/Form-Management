# Debug/Hardcode Leakage Audit — QUANLYVKS Frontend Audit V1

> Generated: 2026-06-30

## Summary

| Classification | Count |
|---------------|-------|
| USER_VISIBLE_BLOCKER | 8 |
| ADMIN_ONLY_OK | 2 |
| TEST_ONLY_OK | 3 |
| INTERNAL_LOG_OK | 0 |
| REMOVE_OR_HIDE | 0 |
| UNKNOWN | 0 |
| **TOTAL** | **13** |

## Detailed Findings

### USER_VISIBLE_BLOCKER Issues (Must Fix)

These expose internal concepts, database IDs, or technical terminology to end users.

| ID | File | Line | Evidence | Classification | Recommended Treatment |
|----|------|------|----------|----------------|---------------------|
| DL-01 | `template-selector-workspace.tsx` | 852 | "Biểu mẫu trong DB" | USER_VISIBLE_BLOCKER | Replace with "Đã triển khai" |
| DL-02 | `template-selector-workspace.tsx` | 879 | "Catalog API" | USER_VISIBLE_BLOCKER | Replace with "Danh mục nền tảng" or hide |
| DL-03 | `template-selector-workspace.tsx` | 1003 | `{templateCatalogMeta.sourceZip}` | USER_VISIBLE_BLOCKER | Hide behind `NEXT_PUBLIC_DEBUG` flag |
| DL-04 | `template-selector-workspace.tsx` | 788 | "QUANLYVKS / TEMPLATE SELECTOR" | USER_VISIBLE_BLOCKER | Replace with "Chọn biểu mẫu pháp lý" |
| DL-05 | `published-contract-form-inputs.tsx` | 117 | "Contract runtime · {templateCode} · v{version}" | USER_VISIBLE_BLOCKER | Hide behind debug flag |
| DL-06 | `published-contract-form-inputs.tsx` | 120 | `{contractHash}` in monospace | USER_VISIBLE_BLOCKER | Remove entirely |
| DL-07 | `generated-document-workspace.tsx` | 643-647 | "Mã biểu mẫu" with `#{documentId}` | USER_VISIBLE_BLOCKER | Replace with "Số định danh" or remove |
| DL-08 | `form-platform-catalog.ts` | 83,85 | "Published contract" badge | USER_VISIBLE_BLOCKER | Replace with Vietnamese label |

### ADMIN_ONLY_OK Issues

These are acceptable for admin/dev mode but should be hidden in production.

| ID | File | Line | Evidence | Classification | Recommended Treatment |
|----|------|------|----------|----------------|---------------------|
| DL-09 | `ContractPreviewPanel.tsx` | 28,29,46 | `debugSlotIds` prop | ADMIN_ONLY_OK | Already behind prop, add env check |
| DL-10 | `form-studio-workspace.tsx` | 1833 | `{version.contractHash ?? "Chưa có immutable hash"}` | ADMIN_ONLY_OK | Hide in production mode |

### TEST_ONLY_OK Issues

These are acceptable in test files only.

| ID | File | Line | Evidence | Classification | Recommended Treatment |
|----|------|------|----------|----------------|---------------------|
| DL-11 | `api-client.test.ts` | 11,55,74,etc | `mock.method()` calls | TEST_ONLY_OK | Keep in tests only |
| DL-12 | `form-platform-catalog.test.ts` | 42 | `"Published contract"` label | TEST_ONLY_OK | Already in test file |
| DL-13 | `sample-generator.ts` / `sample-data.ts` | 237,239 | `deterministicFill()` hash | INTERNAL_LOG_OK | Internal function, acceptable |

## File-by-File Breakdown

### `apps/web/src/components/documents/template-selector-workspace.tsx`

| Line | Issue | Classification | Fix |
|------|-------|----------------|-----|
| 788 | "QUANLYVKS / TEMPLATE SELECTOR" | USER_VISIBLE_BLOCKER | Change to user-friendly Vietnamese |
| 852 | "Biểu mẫu trong DB" | USER_VISIBLE_BLOCKER | Change to "Đã triển khai" |
| 879 | "Catalog API" | USER_VISIBLE_BLOCKER | Change to "Danh mục nền tảng" |
| 1003 | `{templateCatalogMeta.sourceZip}` | USER_VISIBLE_BLOCKER | Hide behind debug flag |
| 719 | "seed/mapping biểu mẫu này vào DB trước" | ADMIN_ONLY_OK | Keep error message, acceptable |

### `apps/web/src/components/documents/published-contract-form-inputs.tsx`

| Line | Issue | Classification | Fix |
|------|-------|----------------|-----|
| 117 | "Contract runtime · {templateCode} · v{version}" | USER_VISIBLE_BLOCKER | Hide behind debug flag |
| 120 | `{contractHash}` | USER_VISIBLE_BLOCKER | Remove entirely |
| 104 | "Đã lưu theo published contract." | COPY_IMPROVEMENT | Change to "Đã lưu biểu mẫu." |

### `apps/web/src/components/documents/generated-document-workspace.tsx`

| Line | Issue | Classification | Fix |
|------|-------|----------------|-----|
| 643-647 | "Mã biểu mẫu" with `#{documentId}` | USER_VISIBLE_BLOCKER | Replace or remove |
| 597 | "QUANLYVKS / Biểu mẫu đã tạo" | COPY_IMPROVEMENT | Keep, acceptable |
| 608 | `UNKNOWN_SCOPE` fallback | COPY_IMPROVEMENT | Add Vietnamese fallback |

### `apps/web/src/lib/form-platform-catalog.ts`

| Line | Issue | Classification | Fix |
|------|-------|----------------|-----|
| 83 | `return { label: "Published contract", tone: "success" }` | USER_VISIBLE_BLOCKER | Change to "Hợp đồng đã xuất bản" |
| 85 | `return { label: "Published contract", tone: "info" }` | USER_VISIBLE_BLOCKER | Change to "Hợp đồng đã xuất bản" |

### `apps/web/src/features/forms-contracts/ContractPreviewPanel.tsx`

| Line | Issue | Classification | Fix |
|------|-------|----------------|-----|
| 28 | `debugSlotIds` comment | ADMIN_ONLY_OK | Already behind prop |
| 46 | `debugSlotIds = false` default | ADMIN_ONLY_OK | Add env-based override |

## Implementation Strategy

### Debug Flag System

```typescript
// apps/web/src/lib/debug.ts
export const IS_DEBUG = process.env.NODE_ENV === 'development' || 
  process.env.NEXT_PUBLIC_DEBUG === 'true';
```

### Conditional Rendering Pattern

```tsx
// Before (exposes to all users)
<div className="...">
  Contract runtime · {templateCode} · v{version}
  {contractHash}
</div>

// After (debug only)
{IS_DEBUG && (
  <div className="debug-only ...">
    Contract runtime · {templateCode} · v{version}
    {contractHash}
  </div>
)}
```

## Validation Checklist

After implementing fixes:
- [ ] No "DB", "API", "Catalog", "Contract runtime" visible to normal users
- [ ] No `{documentId}` or `{contractHash}` visible to normal users
- [ ] No zip path references in UI
- [ ] No "QUANLYVKS" in route breadcrumbs
- [ ] All badges use Vietnamese labels
