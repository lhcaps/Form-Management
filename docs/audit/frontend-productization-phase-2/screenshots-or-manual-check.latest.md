# Screenshot / Manual Visual Check — Frontend Productization Phase 2

## Routes Checked

| Route | Status | Notes |
|-------|--------|-------|
| `/templates` | ⚠ Manual | Template selector page |
| `/documents/[id]` | ⚠ Manual | Generated form editor (BM-001, BM-004) |
| `/reports` | ⚠ Manual | Reports dashboard |

## Expected Visual States After Implementation

### `/templates` (Template Selector)

**Expected (good):**
- Page header shows "QUẢN LÝ HỒ SƠ VKS / CHỌN BIỂU MẪU" (not "QUANLYVKS / TEMPLATE SELECTOR")
- Stat card labels: "Đã triển khai" (not "Biểu mẫu trong DB")
- Stat card labels: "Danh mục biểu mẫu" (not "Catalog API")
- Source badge: "Nguồn danh mục: Đã tải" (not raw `.zip` filename)

**Debug mode only (set `NEXT_PUBLIC_SHOW_TEMPLATE_DEBUG_INFO=true`):**
- Source badge shows actual `.zip` filename

### `/documents/[id]` (Generated Form Editor — Published Contract)

**Expected (good):**
- NO "Contract runtime · BM-XXX · vN" banner at top
- NO contract hash visible
- NO raw `#{documentId}` visible in header
- "Cấp văn bản chưa xác định" shown for unknown scope (not "UNKNOWN_SCOPE")
- "Điền dữ liệu mẫu" button visible near "Lưu dữ liệu biểu mẫu"
- Amber banner "Đang sử dụng dữ liệu mẫu..." appears after clicking
- Form section headings: "Thông tin văn bản", "Người tiếp nhận", etc. (not raw English keys)
- Save success: "Đã lưu dữ liệu biểu mẫu." (not "Đã lưu theo published contract.")

**Debug mode only (set `NEXT_PUBLIC_SHOW_INTERNAL_IDS=true`):**
- Internal document ID badge shown: "Mã hồ sơ nội bộ: #N"

**Debug mode only (set `NEXT_PUBLIC_SHOW_CONTRACT_DEBUG_INFO=true`):**
- "Contract runtime · BM-XXX · vN" banner shown
- Contract hash visible

### `/reports` (Reports Dashboard)

**Expected (good):**
- Page background: `bg-slate-50` (not `bg-zinc-50`)
- Border color: `border-slate-200` for header divider
- Heading color: `text-slate-950`

## Manual Verification Steps

1. Open browser to `http://localhost:3000`
2. Navigate to `/templates`
   - [ ] Header shows Vietnamese breadcrumb
   - [ ] Stat cards have clean labels
3. Create/open a document, navigate to `/documents/[id]`
   - [ ] No debug banner at top
   - [ ] "Điền dữ liệu mẫu" button visible
   - [ ] Click button → amber banner appears
   - [ ] Section headings are Vietnamese
4. Click "Lưu dữ liệu biểu mẫu"
   - [ ] Success message: "Đã lưu dữ liệu biểu mẫu."
5. Navigate to `/reports`
   - [ ] Page uses slate color scheme

## Date of Check

2026-06-30
