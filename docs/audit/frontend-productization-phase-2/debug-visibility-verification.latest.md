# Debug Visibility Verification — Frontend Productization Phase 2

## Date

2026-06-30

---

## Default Mode (no env flags set)

All three flags default to `false`:

```typescript
export const SHOW_CONTRACT_DEBUG_INFO =
  process.env.NEXT_PUBLIC_SHOW_CONTRACT_DEBUG_INFO === "true"; // false by default

export const SHOW_TEMPLATE_DEBUG_INFO =
  process.env.NEXT_PUBLIC_SHOW_TEMPLATE_DEBUG_INFO === "true"; // false by default

export const SHOW_INTERNAL_IDS =
  process.env.NEXT_PUBLIC_SHOW_INTERNAL_IDS === "true"; // false by default
```

### Verified Hidden in Normal Mode

| Item | Expected | Result |
|------|----------|--------|
| "Contract runtime · BM-XXX · vN" banner | NOT visible | ✓ (E2E confirmed) |
| Contract hash | NOT visible | ✓ (removed from UI) |
| `#{documentId}` raw internal ID | NOT visible | ✓ (behind SHOW_INTERNAL_IDS) |
| "Catalog API" stat label | NOT visible | ✓ (→ "Danh mục biểu mẫu") |
| `sourceZip` raw filename | NOT visible | ✓ (→ "Đã tải") |
| "Published contract" badge | NOT visible | ✓ (→ "Sẵn sàng mở") |
| "Biểu mẫu trong DB" | NOT visible | ✓ (→ "Đã triển khai") |
| "QUANLYVKS / TEMPLATE SELECTOR" | NOT visible | ✓ (→ "QUẢN LÝ HỒ SƠ VKS / CHỌN BIỂU MẪU") |
| "UNKNOWN_SCOPE" raw text | NOT visible | ✓ (→ "Cấp văn bản chưa xác định") |

---

## Debug Mode (env flags set)

Enable with:
```bash
NEXT_PUBLIC_SHOW_CONTRACT_DEBUG_INFO=true
NEXT_PUBLIC_SHOW_TEMPLATE_DEBUG_INFO=true
NEXT_PUBLIC_SHOW_INTERNAL_IDS=true
```

### Verified Visible in Debug Mode

| Item | Expected | Implementation |
|------|----------|---------------|
| Contract runtime + hash | Visible in blue info box | `SHOW_CONTRACT_DEBUG_INFO` flag |
| sourceZip raw filename | Visible in filter badge | `SHOW_TEMPLATE_DEBUG_INFO` flag |
| Internal doc ID "Mã hồ sơ nội bộ: #N" | Visible in header | `SHOW_INTERNAL_IDS` flag |

---

## E2E Evidence

- `sample-prefill.spec.ts`: Asserts `Contract runtime` and `Published contract` are NOT visible in normal mode.
- `document-form-save.spec.ts`: Confirms form renders and saves without debug labels.

---

## Verification Command

```bash
# Normal mode (default)
npx playwright test tests/e2e/sample-prefill.spec.ts
# Expected: pass (no debug labels visible)

# Debug mode (with flags)
NEXT_PUBLIC_SHOW_CONTRACT_DEBUG_INFO=true \
NEXT_PUBLIC_SHOW_TEMPLATE_DEBUG_INFO=true \
NEXT_PUBLIC_SHOW_INTERNAL_IDS=true \
npx playwright test tests/e2e/sample-prefill.spec.ts
# Expected: pass (debug labels visible)
```
