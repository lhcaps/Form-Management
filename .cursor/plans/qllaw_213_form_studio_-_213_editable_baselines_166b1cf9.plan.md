---
name: QLLaw 213 Form Studio - 213 Editable Baselines
overview: Implement "213 editable baselines now" for Form Studio by wiring existing authoring resolution into the frontend, fixing /documents and /admin/form-studio UI, adding catalog unification, normalizing BM-004 DOCX, and running the full audit pipeline.
todos:
  - id: docs-catalog
    content: Wire /documents into GET /form-platform/catalog
    status: pending
  - id: docs-badge
    content: Display honest runtime badge on each card
    status: pending
  - id: studio-labels
    content: Standardize /admin/form-studio button labels (7 lifecycle states)
    status: pending
  - id: studio-provenance
    content: Show baseline provenance + warnings when opening
    status: pending
  - id: bm004-normalize
    content: Normalize BM-004 DOCX → storage/templates/normalized-docx/BM-004/
    status: pending
  - id: bm004-opendesign
    content: Verify BM-004 open-design returns draftId + baseline (not 404)
    status: pending
  - id: bm004-runtime
    content: Verify BM-004 runtime rejects (RUNTIME_CONTRACT_NOT_FOUND)
    status: pending
  - id: bm004-test
    content: Add BM-004 acceptance test (open-design + runtime reject)
    status: pending
  - id: audit-213
    content: Run pnpm audit:form-authoring-baselines → verify 213/213
    status: pending
isProject: false
---

## Mục tiêu

Tất cả 213 BM codes mở được trong Form Studio (`/admin/form-studio`), `/documents` hiển thị đúng badge thực, runtime không bao giờ dùng draft.

---

## 1. Wire `/documents` vào `GET /form-platform/catalog`

**File:** `apps/web/src/components/documents/template-selector-workspace.tsx`

Thay `loadDbTemplates()` gọi `GET /api/v1/templates` bằng gọi `GET /form-platform/catalog` (đã có sẵn trong `form-studio-api.ts`).

**Thêm import:**
```typescript
import { listFormStudioTemplates } from "@/lib/form-studio-api";
```

**Thay `loadDbTemplates()` body:**
```typescript
const result = await listFormStudioTemplates(q ?? "");
const items = result.items ?? [];
// items[i] có: templateCode, title, docx.{ready,normalizedPath}, 
// authoring.{status,canOpen,mode}, runtime.{available,source}, 
// quality.{grade,fieldCount,bindingCount,unresolvedCount}
```

**Xoá** dependency vào `vksTemplateCatalog` (hard-coded static) — catalog từ API đã đầy đủ.

**Migrate `VksTemplateItem` → `FormPlatformCatalogItem`:**
- `templateCode` = `item.templateCode`
- `title` = `item.title`
- `docxReady` = `item.docx.ready`
- `authoringStatus` = `item.authoring.status`
- `authoringMode` = `item.authoring.mode`
- `runtimeSource` = `item.runtime.source`
- `qualityGrade` = `item.quality.grade`

**Giữ lại** scoring logic (`scoreTemplate()`) để reorder recommendations — không xoá.

---

## 2. Hiển thị honest runtime badge trên mỗi card

**Trong `TemplateCard` component** (hoặc inline trong `template-selector-workspace.tsx`):

```typescript
function RuntimeBadge({ item }: { item: FormPlatformCatalogItem }) {
  const { source } = item.runtime;
  if (!item.runtime.available) {
    return <Badge variant="red">Không khả dụng</Badge>;
  }
  switch (source) {
    case 'AGENCY_PUBLISHED':  return <Badge variant="green">Đã xuất bản</Badge>;
    case 'GLOBAL_PUBLISHED':  return <Badge variant="blue">Toàn cục</Badge>;
    case 'LOCKED_FILE':       return <Badge variant="amber">Hợp đồng khóa</Badge>;
    case 'LEGACY_BESPOKE':    return <Badge variant="orange">Bespoke cũ</Badge>;
    case 'GENERIC_FALLBACK': return <Badge variant="gray">Tạm thời</Badge>;
    case 'UNAVAILABLE':       return <Badge variant="red">Không khả dụng</Badge>;
  }
}
```

**Thêm** vào `TemplateCard` JSX, bên dưới title.

**Kiểm tra** `item.authoring.canOpen` để enable/disable button "Mở biểu mẫu".

---

## 3. Chuẩn hoá button labels trong `/admin/form-studio`

**File:** `apps/web/src/components/form-studio/form-studio-workspace.tsx`

Tìm chỗ render button "Mở thiết kế" / "Tiếp tục chỉnh sửa" / "Xem bản chờ duyệt" (khoảng line 354-368).

**Thay bằng switch trên `item.authoring.status` + `item.authoring.mode`:**

```typescript
function StudioActionButton({ item }: { item: FormStudioTemplateSummary }) {
  const { status, mode } = item;
  if (status === 'NOT_INITIALIZED') return <Button intent="primary">Mở thiết kế</Button>;
  if (status === 'DRAFT' || status === 'CHANGES_REQUESTED') return <Button>Tiếp tục chỉnh sửa</Button>;
  if (status === 'IN_REVIEW') return <Button variant="secondary">Xem bản chờ duyệt</Button>;
  if (status === 'APPROVED') return <Button>Xem và xuất bản</Button>;
  if (status === 'PUBLISHED') return <Button intent="outline">Tạo phiên bản mới</Button>;
  if (status === 'ARCHIVED') return <Button variant="ghost">Xem lịch sử</Button>;
  return <Button>Mở thiết kế</Button>;
}
```

---

## 4. Hiển thị provenance + warnings khi mở baseline

**Trong `StudioEditor` component** (nơi `draft` state được set), khi nhận `baseline` từ `openFormDesign()`:

**Thêm state:**
```typescript
const [baseline, setBaseline] = useState<AuthoringBaseline | null>(null);
```

**Khi `openDesign` thành công:**
```typescript
.then((result) => {
  setBaseline(result.baseline);
  return getFormDraft(result.draftId);
})
.then(setDraft);
```

**Hiển thị provenance banner:**
```typescript
{baseline && (
  <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
    <strong>Nguồn baseline:</strong> {baseline.source}
    {" | "} <strong>Grade:</strong> {baseline.qualityGrade}
    {" | "} <strong>Fields:</strong> {baseline.fields.length}
    {" | "} <strong>Bindings:</strong> {baseline.renderBindings.length}
    {baseline.warnings?.length > 0 && (
      <ul className="mt-1 list-inside list-disc text-amber-700">
        {baseline.warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    )}
  </div>
)}
```

---

## 5. Normalize BM-004 DOCX

**Kiểm tra** `apps/api/src/modules/form-studio/application/template-normalizer.service.ts` — xem có thể dùng lại không, hoặc gọi CLI normalization.

**Chạy:**
```bash
cd apps/api
npx ts-node -e "
import { TemplateNormalizerService } from './src/modules/form-studio/application/template-normalizer.service';
// normalize BM-004 DOCX → storage/templates/normalized-docx/BM-004/BM-004_normalized.docx
"
```

**Hoặc dùng seed script đã có** `scripts/seed-normalized-docx.ts` nếu tồn tại.

**Verify** sau khi normalize:
```bash
ls storage/templates/normalized-docx/BM-004/
# Phải có: BM-004_normalized.docx
```

---

## 6. Verify BM-004 `open-design` hoạt động

**Start backend** (nếu chưa chạy):
```bash
cd apps/api && pnpm start:dev
```

**Test endpoint:**
```bash
curl -X POST http://localhost:3001/api/v1/admin/form-templates/BM-004/open-design \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**Expected:** HTTP 200, body có `draftId` + `baseline` với `templateCode: "BM-004"`, `source: "DRAFT_V1"`.

**Verify runtime bị reject:**
```bash
curl http://localhost:3001/api/v1/forms/runtime/BM-004 \
  -H "Accept: application/json"
# Expected: HTTP 404 hoặc RUNTIME_CONTRACT_NOT_FOUND (vì BM-004 chưa PUBLISHED)
```

---

## 7. Verify BM-004 Runtime strict

**Confirm** `RuntimeFormContractService.resolve()` không fallback sang draft V1.

**Kiểm tra** `apps/api/src/modules/form-studio/application/runtime-form-contract.service.ts` lines 21-31:
- Step 1-3: DB lookup (AGENCY_PUBLISHED, GLOBAL_PUBLISHED)
- Step 4: V1 locked file (`v1.status === 'locked'`)
- Step 5: throw

**Không có** `return fromV1File(v1, 'DRAFT_V1', ...)` trong runtime resolver.

---

## 8. Chạy audit pipeline

```bash
# 1. Typecheck
cd apps/web && npx tsc --noEmit

# 2. Lint
pnpm lint 2>&1 | head -30

# 3. Audit templates
pnpm audit:templates 2>&1 | tail -20

# 4. Audit authoring baselines
pnpm audit:form-authoring-baselines 2>&1 | tail -30

# 5. Check audit result
# Expected: 213/213 unique BM codes resolved to authoring baseline
```

---

## 9. Fix acceptance test cho BM-004

**Thêm test file** `apps/api/src/modules/form-studio/authoring-contract.service.spec.ts`:

```typescript
describe('BM-004 open-design', () => {
  it('returns draft baseline, not 404', async () => {
    const result = await service.openDesign('BM-004', agencyId, userId);
    expect(result.draftId).toBeDefined();
    expect(result.baseline.templateCode).toBe('BM-004');
  });

  it('runtime rejects BM-004 when not published', async () => {
    await expect(
      runtimeService.resolve('BM-004', agencyId)
    ).rejects.toThrow('RUNTIME_CONTRACT_NOT_FOUND');
  });
});
```

---

## Files thay đổi

| File | Thay đổi |
|---|---|
| `apps/web/src/components/documents/template-selector-workspace.tsx` | Gọi `GET /form-platform/catalog`, hiển thị badge |
| `apps/web/src/components/form-studio/form-studio-workspace.tsx` | Chuẩn hoá button labels, hiển thị baseline provenance |
| `apps/api/src/modules/form-studio/authoring-contract.service.spec.ts` | Test BM-004 open-design + runtime reject |

---

## Root cause đã giải thích

**`AuthoringContractResolver` đã tồn tại** — là `AuthoringContractService.resolveBaseline()`. Resolution order chuẩn:

1. Agency editable draft (DRAFT / CHANGES_REQUESTED)
2. Agency read-only (IN_REVIEW / APPROVED)
3. Agency published
4. Global published
5. V1 locked file → LOCKED_V1
6. V1 draft file → DRAFT_V1 ← **BM-004 vào đây**
7. Virtual from DOCX → GENERIC_FALLBACK

**Runtime resolver** chỉ có 4 bước, không fallback draft → đúng spec.

**Bug gốc:** Frontend `/admin/form-studio` và `/documents` không gọi đúng endpoint — chúng dùng static catalog hoặc `GET /templates` thay vì `GET /form-platform/catalog`.

---

## Risks

- `GET /form-platform/catalog` requires `FORM_TEMPLATE_EDIT` permission → user cần login. Xử lý: show skeleton cho anonymous, full data cho logged-in user.
- BM-004 normalized DOCX normalize có thể fail nếu LibreOffice không có trong PATH → dùng fallback manual nếu cần.
- 213 baseline audit có thể có duplicate BM-139 conflicts → đã có logic trong script, chỉ verify không fix.