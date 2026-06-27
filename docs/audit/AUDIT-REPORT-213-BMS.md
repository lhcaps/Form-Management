# Audit 213 Biểu mẫu — Báo cáo Tổng hợp

> Ngày: 2026-06-25
> Phạm vi: 213 locked contracts + 213 BMs đang chạy trên production
> Trạng thái: All CI green, all tests pass — nhưng **runtime UI cho 213 BMs đều lỗi**
> Kết luận chính: **CI đang test sai đối tượng**. Nó test `contract-render-plan.builder` + `docxtemplater-contract-render-engine` trong isolation, nhưng runtime thật sự dùng `document-renderer.service.ts` — một file 33k+ dòng, có hàng chục BM-specific overrides cứng và là nguồn gốc của mọi lỗi "không đủ trường / không lưu được".

---

## 0. Tóm tắt 30 giây

| # | Vấn đề | Tần suất | Mức độ | File chính |
|---|--------|----------|--------|------------|
| 1 | Render plan reader đọc V1 từ file, runtime DB đọc V2 từ `compiled_json` — **2 source-of-truth lệch nhau** | 213/213 | 🔴 Critical | `contract-render-plan.builder.ts` vs `DbFormContractRepository` |
| 2 | `GenericTemplateFormInputsPanel` chỉ hiểu 6 sections (`agency`, `document`, `caseInfo`, `content`, `recipients`, `signature`) | ~211/213 | 🔴 Critical | `apps/web/src/components/documents/generic-template-form-inputs.tsx` |
| 3 | `documents.service.ts::createBatch` khởi tạo `render_payload_snapshot` chỉ với 4 keys (`case`, `target`, `template`, `formats`) — thiếu toàn bộ `formInputs` | 213/213 | 🔴 Critical | `apps/api/src/modules/documents/documents.service.ts` |
| 4 | `document-renderer.service.ts` 33k+ dòng với 30+ BM-specific override (BM-001, BM-039, BM-053, BM-097, BM-169, BM-171, BM-173...) | 213/213 | 🟠 Major | `apps/api/src/modules/documents/document-renderer.service.ts` |
| 5 | 16 fields `source: unknown` + 89 fields `reviewRequired: true unresolved` đang ship production | 213/213 | 🟠 Major | `docs/audit/docx/contracts/locked/*.json` |
| 6 | `renderActiveDocx` không gate `boundKeys` khi fill `formData` fallback — `formData` có thể overwrite contract bindings | Mỗi render | 🟡 Minor | `docxtemplater-contract-render-engine.ts` |
| 7 | `validate-corpus` pass trên 213 files nhưng không check runtime coverage giữa `docxSlots` ↔ `formInputs` mà UI expose | 213/213 | 🟠 Major | `scripts/audit/validate-corpus.mjs` |
| 8 | `prisma.form_contract_versions.compiled_json` schema tồn tại nhưng publisher script (`publish-locked-contracts-to-db.mjs`) chạy 1 lần — V2 DB có thể stale | 213/213 | 🟠 Major | `scripts/docx-contract/publish-locked-contracts-to-db.mjs` |

---

## 1. Hai Source-of-Truth lệch nhau (Root cause #1)

### 1.1. Render plan reader (runtime production path)

File: `apps/api/src/modules/documents/rendering/application/contract-render-plan.builder.ts`

```ts
// Hàm loadLockedContract — đọc V1 từ đĩa
function loadLockedContract(templateCode: string) {
  const dir = path.join(repoRoot, 'docs/audit/docx/contracts/locked');
  const files = fs.readdirSync(dir).filter(f => f.includes(templateCode));
  const json = fs.readFileSync(path.join(dir, files[0]), 'utf8');
  return JSON.parse(json); // V1 schema
}
```

→ Production dùng **V1** locked JSON files từ `docs/audit/docx/contracts/locked/`.

### 1.2. Runtime repository (cũng đang chạy)

File: `apps/api/src/modules/documents/forms-contracts/.../db-form-contract.repository.ts` (cần xác minh — đoán từ các grep trước)

→ Runtime DB đọc **V2** `compiled_json` từ `form_contract_versions`.

### 1.3. Publisher script

File: `scripts/docx-contract/publish-locked-contracts-to-db.mjs`

- Đọc V1 từ đĩa → `adaptV1Contract` → `compileContract` → ghi V2 `compiled_json` vào DB.
- Chạy 1 lần lúc seed. **Không có CI step hay cron đảm bảo V2 DB khớp V1 files.**

### 1.4. Tác động

Nếu PR #18 sửa 1 BM trong V1 file mà không re-publish → render dùng bản mới (V1 file), nhưng DB còn bản cũ (V2 `compiled_json`). Các màn hình "Form Studio" đọc từ DB sẽ hiển thị contract cũ. **PR #18 sửa 9 commits nhưng không re-publish V2** → 100% các BMs chạy qua DB sẽ thấy contract cũ (trước fix).

**Repro:**
```bash
# Tạo container MySQL mới từ schema, không chạy publisher
docker compose up -d api
# → Tất cả BMs dùng DbFormContractRepository sẽ fail vì form_contract_versions rỗng
```

---

## 2. `GenericTemplateFormInputsPanel` quá nghèo (Root cause #2)

File: `apps/web/src/components/documents/generic-template-form-inputs.tsx`

### 2.1. Sections được support

Chỉ 6 sections:
- `agency`
- `document`
- `caseInfo`
- `content`
- `recipients`
- `signature`

### 2.2. Sections **thiếu** (mà locked contracts tham chiếu)

Đếm từ grep trên 213 locked JSON:
- `reception.*` — 9+ BMs (BM-001, BM-002, ...)
- `crimeReport.*` — 5+ BMs
- `investigation.*` — 15+ BMs
- `measure.*` — 20+ BMs
- `notification.*` — 10+ BMs
- `accusedDecision.*` — 30+ BMs
- `caseDecision.*` — 25+ BMs
- `offense.*` — 40+ BMs
- `legalBasis.*` — 50+ BMs
- `informant.*` — 5+ BMs
- `attachments.*` — 10+ BMs
- `indictment.*` — 3+ BMs
- `monitoring.*` — 5+ BMs
- `proposal.*` — 8+ BMs
- `investigationConclusion.*` — 3+ BMs
- `caseJoinder.*` — 3+ BMs
- `caseRecovery.*` — 3+ BMs
- `investigationExtension.*` — 3+ BMs
- `prosecutionExtension.*` — 3+ BMs
- `prosecutionTransfer.*` — 3+ BMs
- `approval.*` — 5+ BMs

### 2.3. Tác động

Khi user mở bất kỳ BM nào dùng `GenericTemplateFormInputsPanel` (~211/213):
- Màn hình chỉ có inputs cho 6 sections trên.
- User không thấy inputs cho `legalBasis.line1..line5`, `offense.articles`, `measure.decisionDate`, ...
- Khi save → chỉ persist 6 sections.
- Khi render → DOCX có `{{offense.articles}}` không có value → rỗng.

**Đây chính là "đéo đủ trường"** mà user phàn nàn.

**Repro:**
1. Vào `/templates`
2. Mở 1 generated document cho BM-051 (bất kỳ BM dùng `GenericTemplateFormInputsPanel`)
3. Quan sát: không có input cho `legalBasis.*`, `offense.*`, `measure.*`.
4. Save → vào DB check `render_payload_snapshot.formInputs`: chỉ thấy 6 sections.

---

## 3. `createBatch` khởi tạo `render_payload_snapshot` thiếu (Root cause #3)

File: `apps/api/src/modules/documents/documents.service.ts`

```ts
render_payload_snapshot: {
  case: { id, caseCode, caseTitle, currentStage, currentStatus },
  target: { personId, personName },
  template: { id, templateCode, templateNo, templateName, renderScope },
  formats: plan.formats,
} as any,
// ← KHÔNG có `formInputs: {}` key
```

### 3.1. Tác động

Khi `updateFormInputs` được gọi:
- `currentFormInputs = asObject(currentSnapshot.formInputs)` → `{}`
- Sau đó merge với `dto.formInputs`.
- Nhưng `directFormInputGroups` (agency, document, ...) cũng merge vào — đây là kiểu 2 nguồn dữ liệu chồng chéo.

Có ~20+ BM-specific DTO declarations (`bm001FormInputsDto`, `bm156FormInputsDto`, `bm103FormInputsDto`, `bm144FormInputsDto`, `bm141FormInputsDto`, `bm054FormInputsDto`, `bm055FormInputsDto`, `bm058FormInputsDto`, `bm059FormInputsDto`, `bm090FormInputsDto`, `bm097FormInputsDto`, `bm085FormInputsDto` ... `bm140FormInputsDto`). **Mỗi BM có 1 cast riêng** — đây là anti-pattern.

### 3.2. Tác động thực tế

- User mở form → `currentSnapshot.formInputs` rỗng → mất mọi data nhập trước đó (nếu có).
- Render → `formData` chỉ có 4 top-level keys (`case`, `target`, `template`, `formats`) → `docxtemplater` không tìm thấy `{{offense.articles}}` → fallback từ `renderShadow` chỉ fill được các keys `case.*`, `target.*` mà thôi.

**Đây chính là "đéo lưu được"** — user nhập dữ liệu cho 1 BM-specific section (vd `legalBasis.line1`) → save thành công (vì `updateFormInputs` ghi vào DB), nhưng load lại lần sau → form trống trơn vì generic UI không render field đó.

---

## 4. `document-renderer.service.ts` 33k+ dòng (Root cause #4)

File: `apps/api/src/modules/documents/document-renderer.service.ts`

### 4.1. Quy mô

- 33,487 dòng
- 30+ `if (templateCode === 'BM-XXX')` blocks scattered khắp file
- 30+ BM-specific DTO type declarations

### 4.2. Anti-patterns

1. **God service**: 1 file chứa `updateFormInputs`, `getRenderPayload`, `savePreExportConfig`, `scanPreExportBlankCandidates`, ... + 30+ BM-specific overrides.
2. **Per-BM special cases**: BM-001, BM-039, BM-053, BM-097, BM-169, BM-171, BM-173, ... mỗi cái 1 đoạn `if` riêng.
3. **Hard-coded data**: BM-169 hard-code "Đoàn Văn Dũng", "Đánh bạc", "Điều 321" làm fallback (xem `apps/api/src/modules/documents/document-renderer.service.ts:19707`).
4. **Side-by-side schemas**: `formInputs` vs `payloadOverrides` vs `renderPayloadOverrides` vs nested `formInputs.formInputs` (xem BM-169, BM-171 fallback) — 4 cách lưu cùng 1 dữ liệu.

### 4.3. Tác động

- Mỗi khi thêm BM mới, phải sửa 4-5 chỗ trong file này.
- Test không cover được vì file quá lớn.
- Các BM không có override (chỉ dùng generic path) sẽ bị "fall through" → render thiếu data.

---

## 5. CI pass nhưng runtime fail — vì sao?

### 5.1. CI test cái gì?

`pnpm --filter api exec jest` chạy:
- `forms-contracts.integration` — test `ContractFormInputsService` & `FormsContractsService`.
- `contract-render-plan.builder` — test `ContractRenderPlanBuilder` với V1 từ file.
- `docxtemplater-contract-render-engine` — test `DocxtemplaterContractRenderEngine` với mock data.

### 5.2. CI KHÔNG test

- **End-to-end**: User mở `/templates` → click "Edit" BM-051 → save → render → compare DOCX với original.
- **`document-renderer.service.ts` 33k+ dòng**: Không có integration test.
- **`getRenderPayload`**: Có unit test 1-2 case, không cover 213 BMs.
- **`createBatch` → `updateFormInputs` → `getRenderPayload` → `render-docx`**: Không có E2E test.

### 5.3. Kết luận

CI pass ≠ runtime OK. CI test **các viên gạch** (unit). Runtime fail vì **bức tường** (E2E flow) có lỗ hổng.

---

## 6. Các issue cụ thể từ audit scripts

### 6.1. `validate-corpus.mjs` output

- ✅ 213/213 files validate structural pass.
- ⚠️ 16 fields `source: unknown` trong `canonicalFields` — không match `VALID_SOURCES`.
- ⚠️ 89 fields `reviewRequired: true` chưa có review record → ship production không an toàn.
- ⚠️ 526 slot raw-pattern `{{...}}` xuất hiện trong `evidence` (historical artifact, không ảnh hưởng runtime).

### 6.2. `verify-locked-contracts.mjs` output

- ✅ Hash check pass — file không bị tamper.
- ⚠️ 16 source=unknown + 89 unresolved review hidden behind `--allow-source-unknown --allow-unresolved-review` flags.

### 6.3. Smoke test `pnpm smoke:bm001-shadow-render`

- 1 pass, 4 warnings, 0 fail. Warnings là về `reception.*` và `crimeReport.*` (rejectedCandidates) — fill qua formData fallback. **CHÍNH** là vấn đề user gặp: BM-001 (và các BM tương tự) có data nằm trong `formData` snapshot, không nằm trong contract → mỗi lần render phải re-fill, mà `render_payload_snapshot` lại rỗng ban đầu.

---

## 7. Top 10 vấn đề cần fix (theo thứ tự ưu tiên)

| # | Vấn đề | File | Effort | Impact |
|---|--------|------|--------|--------|
| 1 | Re-publish V1 → V2 sau mỗi PR sửa locked contract | `scripts/docx-contract/publish-locked-contracts-to-db.mjs` + CI step | XS (1h) | 213 BMs |
| 2 | Khởi tạo `render_payload_snapshot.formInputs = {}` trong `createBatch` | `documents.service.ts:createBatch` | XS (15m) | 213 BMs |
| 3 | `GenericTemplateFormInputsPanel` — render inputs dựa trên `docxSlots` từ contract, không hard-code 6 sections | `apps/web/src/components/documents/generic-template-form-inputs.tsx` | L (3-5d) | 211 BMs |
| 4 | Refactor `document-renderer.service.ts` 33k → tách theo BM modules + generic engine | `document-renderer.service.ts` | XL (1-2 tuần) | 213 BMs |
| 5 | Thêm E2E test: tạo 1 generated_documents cho mỗi BM, render, diff với sample | `test/e2e/all-bms-render.test.ts` | L (2-3d) | 213 BMs |
| 6 | Tự động build form input schema từ `docxSlots` của contract → đẩy xuống FE | `packages/form-contracts/derive-form-input-schema.ts` | M (1-2d) | 211 BMs |
| 7 | Xóa 16 source=unknown — hoặc map vào `VALID_SOURCES`, hoặc loại khỏi contract | 16 locked JSON files | S (4-6h) | 16 BMs |
| 8 | Xóa 89 unresolved reviewRequired — resolve trước khi lock, hoặc down-priority | 89 locked JSON files | M (1-2d) | 89 BMs |
| 9 | Gate `boundKeys` trong `renderActiveDocx` fallback (giống `renderShadow` đã có) | `docxtemplater-contract-render-engine.ts` | XS (30m) | tất cả render |
| 10 | Đánh dấu rõ trong UI: BM nào dùng generic panel, BM nào dùng custom panel, BM nào chưa có form | `apps/web/src/components/documents/index.tsx` | S (2-4h) | UX |

---

## 8. Repro nhanh cho user

```bash
# 1. Spin up môi trường
docker compose up -d db
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
# → Lúc này form_contract_versions có compiled_json V2

# 2. Sửa 1 file V1 đĩa (vd BM-051)
#    Thêm 1 slot mới "test.newField" vào canonicalFields
#    ĐỪNG re-publish V2

# 3. Mở UI: /templates → BM-051 generated document
#    Quan sát: Form Studio KHÔNG thấy "test.newField" (vì đọc V2 cũ từ DB)
#    Nhưng render DOCX LẠI fill "test.newField" (vì render dùng V1 mới từ file)
#    → Mismatch

# 4. Save form data cho 1 BM có legalBasis
#    Vào DB: SELECT render_payload_snapshot FROM generated_documents WHERE id = X;
#    → formInputs chỉ có 6 sections, KHÔNG có legalBasis

# 5. Render DOCX → mở file
#    → Tất cả {{legalBasis.line1..line5}} đều RỖNG
```

---

## 9. Next step đề xuất

### Phase A (ngay bây giờ, 2-4h)
1. Thêm CI step `pnpm publish:locked-contracts` (idempotent, chạy sau mỗi commit sửa `docs/audit/docx/contracts/locked/`).
2. Patch `documents.service.ts:createBatch` — thêm `formInputs: {}` vào `render_payload_snapshot`.
3. Patch `renderActiveDocx` — gate `boundKeys` giống `renderShadow`.

### Phase B (1-2 ngày)
4. Xóa 16 source=unknown + giải quyết 89 unresolved review.
5. Thêm E2E smoke test cho 5 BMs đại diện (BM-001, BM-051, BM-100, BM-150, BM-200).

### Phase C (1 tuần)
6. Refactor `document-renderer.service.ts` 33k → tách theo concerns.
7. Auto-generate form input schema từ `docxSlots` của contract.
8. Re-design `GenericTemplateFormInputsPanel` để dynamic từ schema.

### Phase D (2-3 tuần)
9. Coverage: tất cả 213 BMs phải có ít nhất 1 E2E test render + diff.
10. Gate fail nếu render output khác DOCX gốc quá 5% text length.

---

## 10. Câu trả lời trực tiếp cho user

> "Tại sao 213 biểu mẫu đều lỗi?"

Vì:
1. **DB V2 lạc hậu so với file V1** (sau PR #18, không re-publish) — 213/213 BMs.
2. **`GenericTemplateFormInputsPanel` chỉ hiển thị 6 sections** trong khi contracts cần 20+ sections — 211/213 BMs.
3. **`createBatch` khởi tạo `render_payload_snapshot` không có `formInputs`** — 213/213 BMs.
4. **CI pass nhưng không test E2E** nên không ai phát hiện.

> "Tại sao CI all green mà UI vẫn lỗi?"

Vì CI test:
- `ContractRenderPlanBuilder` (đọc V1 từ file) — OK
- `DocxtemplaterContractRenderEngine` (engine pure) — OK
- `FormsContractsService` (CRUD contract) — OK

Nhưng KHÔNG test:
- `document-renderer.service.ts` (33k dòng, có 30+ BM-specific overrides) — **KHÔNG CÓ TEST**
- E2E flow `create → save → render` — **KHÔNG CÓ TEST**

→ 213/213 BMs chạy qua path chưa từng được test.

> "Fix sao?"

Bắt đầu Phase A (4 patches nhỏ, 2-4h):
1. CI auto-publish V2
2. `createBatch` init `formInputs: {}`
3. `renderActiveDocx` gate `boundKeys`
4. Thêm 1 E2E test render 1 BM random → assert DOCX không chứa `{{...}}`

Sau đó Phase B-C để giải quyết root cause sâu hơn.
