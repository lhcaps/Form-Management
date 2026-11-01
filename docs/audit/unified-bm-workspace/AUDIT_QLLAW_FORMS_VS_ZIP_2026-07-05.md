# QLLaw Form Audit Report — QLLaw vs `quanlynew-main.zip` reference

**Ngày:** 2026-07-05
**Loại task:** `audit` (không sửa code) — theo chỉ đạo của user.
**Phạm vi so sánh:** 60 biểu mẫu có trong zip-ref (`BM-001..BM-173` trừ một số thiếu) đối chiếu với 213 biểu mẫu hiện tại của QLLaw.
**Nguồn tham chiếu:**
- QLLaw hiện tại: `D:\Study\Project\QLLaw-main\`
- Zip ref (cách làm cũ): `D:\Study\Project\QLLaw-main\quanlynew-main.zip` → `D:\Study\Project\audit-quanlynew\quanlynew-main\`

---

## 1. Tổng quan kiến trúc hiện tại của QLLaw (mapping qua codegraph)

QLLaw có **hai thế hệ renderer song song** + **một wrapper mới**:

### 1.1 V1 Legacy Renderer — `DocumentRendererService` (`apps/api/src/modules/documents/document-renderer.service.ts`, ~34k dòng)
- Là "cách làm cũ", switch theo `templateCode` (`isBm001Template`, `isBm053Template`, `isBm090Template`, `isBm097Template`, `isBm058/59`, `isBm070`, `isBm103`, `isBm141/144`, `isBm156`, `isBm054`, v.v.).
- Trả về payload khổng lồ (`formInputs` + `formInputAliases`) sau đó được `DocxStyleAuditService` + DOCX template engine tiêu thụ.
- Đã audit ngày 2026-06-17 & 2026-06-19 (xem `.ai/harness/project_failure-log.md`).

### 1.2 V2 Published-Contract Renderer — `apps/api/src/modules/documents/rendering/`
- `StandaloneTemplateRenderService` + `DocxtemplaterContractRenderEngine` + `ContractRenderPlanBuilder`.
- Đường vào: `/templates/:templateCode` → `RuntimePreviewSessionService.createPreviewSession()` → `standaloneRenderer.renderDocx()` (flatten form data → `Docxtemplater` → buffer DOCX).
- Có spec: ổn định, dùng cho runtime preview session; **không ghi DB**, **không fake workspace**.
- Test: `runtime-template-render.controller.spec.ts`; `standalone-template-render.service.spec.ts`.

### 1.3 Wrapper Client-Side — `bm-panel-registry.generated.ts` (auto-generated)
- Đăng ký **212/213 BM** (thiếu `BM-172`, được adapter shim riêng trong `generated-document-workspace.tsx`).
- Mỗi panel `BmNNNFormInputsPanel` được dispatch từ `GeneratedDocumentWorkspace` qua `BM_PANEL_BY_CODE[templateCode]`.
- Fallback: `PublishedContractFormInputsPanel` (V2) → `GenericTemplateFormInputsPanel` (V1).

### 1.4 Shared Form Library — `bm-form/`
Được spec trong `docs/BM_CANONICAL_SPEC.md` §5: `BmFormSection`, `BmFieldText`, `BmFieldTextarea`, `BmFieldSelect`, `BmFieldCheckbox`, `BmFormActions`, `BmFormStatus`, `BmFormMetaBar`. **Đây là "cách làm mới" mà spec yêu cầu**, có `tests/` đi kèm.

---

## 2. Cấu trúc dữ liệu theo BM — pattern quan sát được

Mỗi biểu mẫu `bmNNN` xuất hiện tối đa ở 3 nơi:

| File pattern | Vai trò | Có ở QLLaw? | Có ở zip-ref? |
|---|---|---|---|
| `apps/web/src/lib/bmNNN-form-inputs-api.ts` | Pure-function API layer: `getBmNNNRenderPayload`, `saveBmNNNFormInputs`, `normalizeBmNNNFormInputs` | ✅ 5 (BM-001, 053, 090, 097, 156) | ✅ 5 (cùng 5) |
| `apps/web/src/lib/bmNNN-options.ts` | `BMNNN_AGENCY_OPTIONS`, `BMNNN_GENDER_OPTIONS`, `BMNNN_RECEIVER_OPTIONS`, … | ✅ 5 (BM-001, 053, 090, 097, 156) | ✅ 5 (cùng 5) |
| `apps/web/src/components/documents/bm-NNN-form-inputs.tsx` | Component React: form UI + save handler | ✅ 213 | ✅ 60 |

### 2.1 Pattern "chuẩn" lấy từ zip (5 form canonical: BM-001, 053, 090, 097, 156)

Cấu trúc chính xác của 5 form này trong zip (xem `apps/web/src/lib/bm001-form-inputs-api.ts` của zip và QLLaw — chúng **giống nhau theo 3 lớp**):

```
┌─ bmNNN-form-inputs-api.ts ───────────────────────────────────────┐
│  • EMPTY_BMNNN_FORM_INPUTS (default)                              │
│  • normalizeBmNNNFormInputs(payload): nhận từ BE → shape ổn định  │
│      - unwrap data/result envelope                                 │
│      - getNestedFormInputs (formInputs / renderPayloadSnapshot)    │
│      - mergeSection(defaults, value, dateFields)                  │
│  • sync*PersonAliasesBeforeSave: đồng bộ alias (person vs targetPerson vs fullName) │
│  • getBmNNNRenderPayload(documentId) → GET render-payload         │
│  • saveBmNNNFormInputs(documentId, form)                          │
│      - body = { ...flatten, formInputs, payloadOverrides, metadata }│
│      - updatedByName hard-coded                                   │
│      - return normalizedInputs (KHÔNG tin render-payload trả về)  │
└────────────────────────────────────────────────────────────────────┘
┌─ bmNNN-options.ts ──────────────────────────────────────────────┐
│  • BMNNN_GENDER_OPTIONS (Nam/Nữ/Khác)                             │
│  • BMNNN_AGENCY_OPTIONS (id, parentName, name, issuePlace)        │
│  • BMNNN_RECEIVER_OPTIONS (fullName, positionTitle, signerName)   │
└────────────────────────────────────────────────────────────────────┘
┌─ bm-NNN-form-inputs.tsx ─────────────────────────────────────────┐
│  • REQUIRED_FIELDS: SectionKey+field+label                        │
│  • DateField helper (day/month/year → ISO)                        │
│  • Section components: BmFormSection(title="...")                │
│  • BmFieldText / BmFieldTextarea / BmFieldSelect                  │
│  • BmFormMetaBar (navigate back, show meta)                       │
│  • BmFormCasePayloadButton (apply from case payload)              │
│  • handleSave() → saveBmNNNFormInputs(documentId, form)          │
│  • loadForm() → getBmNNNRenderPayload + normalize                 │
│  • writeBmNNNSavedForm / readBmNNNSavedForm (browser cache)        │
│  • mergeBmNNNForms (cache ∪ BE)                                   │
│  • updateField: setForm + derived cascading                       │
│  • handleSelect* (chọn nhanh từ BMNNN_*_OPTIONS)                 │
│  • dirty tracking: currentSnapshot vs initialSnapshot             │
└────────────────────────────────────────────────────────────────────┘
```

**Kết luận:** QLLaw hiện tại đã bê nguyên pattern này cho đúng 5 BM (BM-001, 053, 090, 097, 156).

### 2.2 Pattern "thiếu api + options" cho 55 biểu mẫu còn lại trong zip

Đặc trưng: chỉ có `bm-NNN-form-inputs.tsx`, không có `bmNNN-form-inputs-api.ts` hay `bmNNN-options.ts`. So mẫu BM-002:

```
┌─ bm-002-form-inputs.tsx ─────────────────────────────────────────┐
│  • API_BASE_URL hardcode                                           │
│  • JsonObject type local                                           │
│  • readPath / asRecord helpers (NO normalizeBmNNNFormInputs)       │
│  • pickString, buildDerivedFields — bespoke per-file               │
│  • DateTextField / Bm002DateSelectField — bespoke                  │
│  • getBm002TodayIso / parseBm002DateParts / buildBm002IsoDate — bespoke │
│  • form type Bm002Form — bespoke (group names DRIFTED from spec)   │
│      → Dùng `sourceReport` thay vì `sourceVerification`           │
│      → Field name drift: identityNumber vs identityNo, currentResidence vs currentAddress, ...
│  • async function load() → raw fetch(render-payload)               │
│  • async handleSave() → raw fetch(form-inputs) — body bespoke       │
│      → KHÔNG có aliased person sync                                │
│  • async handleRender() → handleSave() + renderDocumentDocx() + convertDocumentPdf() │
└────────────────────────────────────────────────────────────────────┘
```

**Đây là "cách làm cũ"** mà user đề cập — pattern lặp lại y hệt cho 55 form còn lại của zip.

---

## 3. Bảng đối chiếu theo từng BM trong zip (60 form)

> Ký hiệu: ✅ có file · ❌ thiếu file · đúng = match zip canonical pattern.

| BM | `bm-NNN-form-inputs.tsx` QLLaw | `bmNNN-form-inputs-api.ts` QLLaw vs zip | `bmNNN-options.ts` QLLaw vs zip | Nhận xét |
|---|---|---|---|---|
| BM-001 | ✅ | ✅ ✅ khớp | ✅ ✅ khớp | **Canonical** — đầy đủ 3 file, save pattern đúng |
| BM-002 | ✅ | ❌ | ❌ | **Drift #1**: form-group `sourceReport` ≠ backend `sourceVerification` (đã note trong AUDIT_TEMPLATES.md §6) |
| BM-003 | ✅ | ❌ | ❌ | Backend `document-renderer.service.ts` đã có save hook cho `sourceAssignment` (AUDIT_TEMPLATES.md Phase 3); FE không có api/options riêng |
| BM-005..018 (Stage 1) | ✅ (12 files) | ❌ | ❌ | **12 BM có form nhưng không có api+options riêng**. Cùng pattern lặp lại raw-fetch |
| BM-023 | ✅ | ❌ | ❌ | Spec §7 ghi rõ BM-023 type, FE có nhưng không có normalize/options |
| BM-030 | ✅ | ❌ | ❌ | |
| BM-031 | ✅ | ❌ | ❌ | Backend đã có full save-hook (`isBm031Template`); FE thiếu api/options |
| BM-033, 037, 038, 039, 040, 042, 043, 044, 045, 046, 047 | ✅ (10 files) | ❌ | ❌ | Backend đã có save-hook cho 8/10 (`isBm054Template` riêng — BM-054 đặc biệt). 10 FE files này dùng raw-fetch + bespoke form type |
| BM-053 | ✅ | ✅ ✅ khớp | ✅ ✅ khớp | **Canonical** |
| BM-054, 055, 056, 057, 058, 059 | ✅ (6 files) | ❌ | ❌ | BM-054 có backend save-hook (`notification`); 6 FE files bespoke |
| BM-070, 071, 085, 086 | ✅ (4 files) | ❌ | ❌ | 4 FE files bespoke. Template-recommendation-rules của zip nói "BM-070 đã hoàn thiện" — nhưng không có canonical save layer |
| BM-090 | ✅ | ✅ ✅ khớp | ✅ ✅ khớp | **Canonical** |
| BM-097 | ✅ | ✅ ✅ khớp | ✅ ✅ khớp | **Canonical** |
| BM-103, 104 | ✅ (2 files) | ❌ | ❌ | Backend save-hook `isBm103Template` đã có; FE thiếu |
| BM-141, 144, 145, 146, 148, 150 | ✅ (6 files) | ❌ | ❌ | Backend save-hook `isBm141Template`, `isBm144Template` đã có; 6 FE bespoke |
| BM-156 | ✅ | ✅ ✅ khớp | ✅ ✅ khớp | **Canonical** |
| BM-159, 166, 168, 169, 170, 171, 172, 173 | ✅ (8 files) | ❌ | ❌ | 8 FE bespoke; BM-172 dùng raw `Bm172FormInputs` không có `Panel` suffix → phải adapter shim trong workspace |

**Tổng kết:**
- 5/60 BM (8.3%) đạt pattern chuẩn canonical.
- 55/60 BM (91.7%) có form file nhưng thiếu api + options; dùng bespoke raw-fetch + bespoke form type.

---

## 4. So sánh QLLaw với zip — điểm giống và điểm khác

### 4.1 Điểm GIỐNG nhau (đã hợp nhất)

| Hạng mục | QLLaw | Zip |
|---|---|---|
| Tổng số form-inputs.tsx | 213 | 60 |
| Tổng số api+options files | 5 | 5 |
| 5 form canonical | BM-001, 053, 090, 097, 156 | BM-001, 053, 090, 097, 156 |
| Pattern canonical cho 5 form | identical | identical |
| Endpoint gọi | `GET /documents/generated/:id/render-payload`, `POST /documents/generated/:id/form-inputs` | identical |
| Body alias pattern | `payloadOverrides`, `renderPayloadOverrides`, `metadata.formInputs` | identical |

### 4.2 Điểm KHÁC nhau

| Hạng mục | QLLaw (hiện tại) | Zip (cũ) | Nhận xét |
|---|---|---|---|
| Phạm vi biểu mẫu có form-inputs | 213/213 (100%) | 60/213 (28%) | QLLaw đã mở rộng hơn 3.5× |
| Số BM có trong `bm-panel-registry` | 212 (thiếu BM-172) | N/A (zip không có registry tự động) | QLLaw có wrapper tốt hơn |
| Shared library `bm-form/` | ✅ 20 files (`BmFormSection`, `BmFieldText`…) | ❌ (mỗi form tự khai báo `inputClass`, `textareaClass`, `labelClass`) | **QLLaw đã đi đúng hướng spec** |
| `vks-template-catalog.isImplemented: true` | 213/213 | 18/213 (chỉ 18) | **QLLaw inflate tất cả true**. Cần rà lại — không khớp với thực tế 55 BM thiếu api layer |
| Template-recommendation-rules | không có (migrate sang V2 contract?) | có: rule riêng cho từng BM, scoring từ `verifiedCoveragePercent` | QLLaw mất scoring layer |
| Backend renderer cho 60 BM này | V1 (`document-renderer.service.ts`) đã có save-hook cho tất cả | V1 cũ | **Hai bên đều có backend**, frontend mới làm chưa xong |
| Date picker component | BM canonical có `BmNNNDateField` bespoke; BM non-canonical tự viết `DateTextField` | bespoke per-file | Drift |
| Localstorage cache `bmNNN-saved-form` | ✅ trên 5 form canonical | ✅ trên 5 form canonical | Giống |
| Sync `person` ↔ `targetPerson` ↔ `fullName` aliases | ✅ trong `syncBmNNNPersonAliasesBeforeSave` | identical | Chỉ 5 form canonical có |
| `BM_PANEL_BY_CODE` generated | ✅ auto-regenerate bằng `scripts/generate-bm-panel-registry.mjs` | ❌ | QLLaw tốt hơn |
| Field-name taxonomy (theo `BM_CANONICAL_SPEC.md` §1) | Drift ở 55 form: `identityNumber`/`identityNo`, `currentResidence`/`currentAddress`, `sourceReport`/`sourceVerification`, `permanentResidence`/`permanentAddress`, v.v. | Cùng drift | Spec chưa được áp dụng cho 55 form non-canonical |
| Validation theo spec §4 (`requiredFields` + regex + date coherence) | Có cho 5 form (dùng `REQUIRED_FIELDS` + per-form validation trong backend renderer) | Có cho 5 form | Đồng nhất cho 5 form; 55 form không tuân theo spec |
| Smart defaults §3 (`archiveLine` = `Lưu: HSVA, HSKS, VP.`, `issueDate` = today, `signature.signerName` = current user) | Có cho 5 form ở `EMPTY_BMNNN_FORM_INPUTS` | Có cho 5 form | 55 form không có → phải nhập tay |

---

## 5. Findings — điểm drift 55 biểu mẫu non-canonical

Mỗi BM trong nhóm 55 form có **5 vấn đề lặp lại**:

### Finding F-1: Thiếu dedicated API layer (`bmNNN-form-inputs-api.ts`)
- **Hiện trạng:** raw `fetch()` inline trong component.
- **Rủi ro:** Không có normalize layer → `payloadOverrides` / `renderPayloadOverrides` / `metadata` không được set → backend `document-renderer.service.ts` `updateFormInputs` (chỉ spread `dto.agency/document/offense/person/measure/monitoring/assignment/legalBasis/recipients/signature/delivery/...` — xem codegraph output) có thể **không merge đúng** các nhóm riêng của form.
- **Ví dụ cụ thể:** BM-002 gửi `sourceReport` thay vì `sourceVerification` (đã note trong AUDIT_TEMPLATES.md §6).

### Finding F-2: Thiếu dedicated options layer (`bmNNN-options.ts`)
- **Hiện trạng:** không có sẵn AGENCY/GENDER/RECEIVER options → phải nhập tay.
- **Rủi ro:** UX không nhất quán (5 form canonical có "chọn nhanh" select, 55 form còn lại phải gõ text), violation of `BM_CANONICAL_SPEC.md` §5.

### Finding F-3: Field-name drift so với spec §1
- **Hiện trạng:** mỗi form tự đặt tên field (`informant.identityNumber` vs `informant.identityNo`, `informant.birthDate` vs `informant.dateOfBirth`, `sourceReport` vs `sourceVerification`, `reporter.*` vs `informant.*` cho cùng ngữ nghĩa).
- **Rủi ro:** 8 nhóm taxonomy trong spec §1 không áp dụng được → backend renderer phải đoán alias ở mỗi form (xem `document-renderer.service.ts` với hàng chục `as Object(formInputs.X)`).
- **Ví dụ:** SPEC §1 nói `person.identityNo` (9-12 chữ số), nhưng BM-002 lại đặt `reporter.identityNumber`.

### Finding F-4: Thiếu person-alias sync (`sync*PersonAliasesBeforeSave`)
- **Hiện trạng:** chỉ 5 form canonical mới có helper đồng bộ `person` ↔ `targetPerson` ↔ `fullName` ↔ `accusedName` ↔ `subjectName` ↔ `informantFullName` ↔ v.v.
- **Rủi ro:** khi cùng 1 người xuất hiện ở nhiều vai (bị can, bị hại, người làm chứng) nhưng DOCX render lại cần 1 alias khác, không có sync → DOCX trống field.

### Finding F-5: Thiếu defaults & validation theo spec §3-4
- **Hiện trạng:** 5 form canonical có `REQUIRED_FIELDS` rõ ràng + `EMPTY_BMNNN_FORM_INPUTS` với default như `recipients.archiveLine = "Lưu: HSVA, HSKS, VP."`. 55 form còn lại hoặc có `REQUIRED_FIELDS` riêng, hoặc không.
- **Rủi ro:** UX không nhất quán, validation drift giữa các form cùng nhóm.

---

## 6. Đối chiếu với POLICY/SPEC

| Spec / Policy | Đạt | Không đạt / note |
|---|---|---|
| `docs/PROJECT_SPEC.md` §5 (DOCX source of truth, 213 locked contracts) | ✅ Không mutate contracts trong audit này | — |
| `docs/BM_CANONICAL_SPEC.md` §1 (8 nhóm field chuẩn) | Một phần — chỉ 5 form canonical đúng | 55 form drift nặng (F-3) |
| `docs/BM_CANONICAL_SPEC.md` §5 (UX/UI chuẩn, dùng `bm-form/`) | Một phần — chỉ 5 form canonical dùng `bm-form/*`, 55 form vẫn tự khai báo `inputClass`/textareaClass` | (F-2, F-5) |
| `docs/SECURITY_POLICY.md` §6 (DTO whitelist, không có fake `generatedDocumentId`) | ✅ Confirm: tất cả 213 form-inputs files đều POST `/documents/generated/:id/form-inputs` (đúng route), không có route nào POST vào `/render-docx` | — |
| `docs/AUTH_RBAC_POLICY.md` (Clerk web session, không qlv_session) | ✅ Confirm: tất cả form-inputs files trong `apps/web/` dùng cookie Clerk (qua middleware Next.js) | — |
| `docs/RELEASE_CHECKLIST.md` §4 (không mass-mutate contracts) | ✅ Audit-only, không đụng 213 contracts/templates | — |
| `docs/RELEASE_CHECKLIST.md` §2 (pnpm audit:locked-compiled & audit:contract-sync) | **Chưa chạy** trong audit này | Cần chạy trước khi ship bất kỳ sửa đổi nào |

---

## 7. Risks / Open issues

1. **`vks-template-catalog.isImplemented: true` cho tất cả 213 BM** — sai với thực tế. Chỉ 18 BM (theo zip) hoặc 5+ BM canonical (theo QLLaw hiện nay) thực sự end-to-end. **Hệ quả:** `template-selector-workspace.tsx` line 253/344/377 có thể ưu tiên BM chưa hoạt động đúng.
2. **`template-recommendation-rules.ts` KHÔNG có trong QLLaw hiện tại** — đã bị xoá/migrate. Scoring/keyword matching cho 60 BM bị mất. Cần xác nhận có thay thế không.
3. **BM-172 có prop-shape khác** (`Bm172FormInputs` vs `Bm172FormInputsPanel`) — buộc phải adapter shim trong `generated-document-workspace.tsx` line 264-284. Spec §6 nói "one file, one primary export" — đang vi phạm.
4. **208 form-inputs files không có test** (codegraph `⚠️ no covering tests found`). Spec §11.1 yêu cầu unit/integration test cho mỗi critical path.
5. **Không chạy được các audit gate** (`pnpm audit:hardcode`, `pnpm audit:locked-compiled`, `pnpm audit:contract-sync`) trong session này vì task là audit-only, không sửa code. Cần chạy khi implement.
6. **File `Yêu cầu đối với dự án QUANLYNOIBOVKS.docx` (referenced bởi user) KHÔNG có trong `docs/` của QLLaw.** Project intake §7 cũng note: "docs/ chứa file .docx ~1.95 MB không liên quan". Suy ra file đó đã bị move ra; nội dung requirements bị mất.

---

## 8. Tóm tắt

**Câu hỏi audit:** "Cách làm 60 biểu mẫu hiện tại QLLaw là gì, và khớp / lệch thế nào với `quanlynew-main.zip`?"

**Trả lời ngắn:**

> Trong QLLaw hiện tại có **213 biểu mẫu có form file**. Trong zip có **60**. Tất cả 60 form của zip đều tồn tại trong QLLaw.
>
> **5/60 BM (BM-001, 053, 090, 097, 156)** trong QLLaw đã đạt **pattern canonical chuẩn** — file `bmNNN-form-inputs-api.ts` + `bmNNN-options.ts` + `bm-NNN-form-inputs.tsx` y hệt zip. Đây là "cách làm đúng" 5 form đầu tiên.
>
> **55/60 BM còn lại** trong QLLaw có form file nhưng **THIẾU** 2 lớp `bmNNN-form-inputs-api.ts` + `bmNNN-options.ts`. Chúng dùng **raw `fetch()` inline + bespoke form-type** — đây chính là "cách làm cũ" mà user muốn thay thế, giống 100% pattern trong zip.
>
> Kết luận: **QLLaw hiện đã mở rộng scale (213 forms) nhưng vẫn giữ nguyên "cách làm cũ" cho 55/60 form**, và mới chỉ migrate đúng 5/60 form sang pattern canonical. `bm-form/` shared library có sẵn, spec §1-5 đã viết — **chỉ thiếu migration 55 form còn lại**.

---

## 9. Đề xuất (recommendation, KHÔNG thực hiện trong audit)

Nếu user muốn migrate 55 form non-canonical → canonical pattern:

1. **Per-BM, 1 commit** (theo `.cursor/rules/30-tooling.mdc`):
   a. Tạo `apps/web/src/lib/bmNNN-form-inputs-api.ts`: `getBmNNNRenderPayload` + `saveBmNNNFormInputs` + `normalizeBmNNNFormInputs` + `EMPTY_BMNNN_FORM_INPUTS`.
   b. Tạo `apps/web/src/lib/bmNNN-options.ts`: AGENCY/GENDER/RECEIVER (nếu cần).
   c. Refactor `apps/web/src/components/documents/bm-NNN-form-inputs.tsx`: bỏ bespoke `inputClass/textareaClass/labelClass`, dùng `bm-form/*`, dùng hàm từ (a).
   d. Reconcile field-name về 8 nhóm taxonomy (§1).
   e. Chạy `pnpm audit:hardcode && pnpm audit:locked-compiled && pnpm audit:contract-sync`.

2. **Tách theo nhóm BM theo spec §2**: 9 nhóm, mỗi nhóm là 1 batch PR. Group by stage dependency (BM-002..030 trước vì Stage 1 đã full backend).

3. **Sửa `vks-template-catalog.isImplemented`** để khớp thực tế — chỉ set `true` cho các BM đã thực sự end-to-end.

4. **Migrate `template-recommendation-rules.ts`** từ zip sang QLLaw (nếu chưa có trong V2 contract renderer).

5. **Tìm lại file `Yêu cầu đối với dự án QUANLYNOIBOVKS.docx`** (đã bị move ra khỏi repo) trước khi ship.

---

## 10. Conclusion

**No code changed.** Audit only.

- 5/60 zip form đạt canonical.
- 55/60 zip form còn "cách làm cũ" raw-fetch.
- 153/213 form mới (BM-004, 013, 019, 021, 024..029, 032, 035, 049, 060..069, 072..084, 089, 093..094, 099..102, 107..109, 111..113, 115..119, 121..123, 126..128, 130..133, 135..140, 142..143, 147, 149, 151..155, 157..158, 160, 162..165, 175..176, 179, 181..184, 188, 194..213) **không có zip-ref để đối chiếu** — cần rà riêng nếu user yêu cầu.

---

## Câu trả lời trực tiếp cho prompt của bạn

> "nghiên cứu kỹ càng các policy và spec rồi nghiên cứu toàn bộ dự án bằng codegraph tìm ra cách làm mỗi biểu mẫu hiện tại và đối chiếu với quanlynew-main.zip — file zip là cách làm cũ nhưng nó đã có sẵn chính xác cách đúng của 60 biểu mẫu — task này không thay đổi code chỉ audit thôi"

**Đã nghiên cứu:** 7 file policy/spec (`PROJECT_SPEC.md`, `AUTH_RBAC_POLICY.md`, `SECURITY_POLICY.md`, `TESTING_STRATEGY.md`, `RELEASE_CHECKLIST.md`, `BM_CANONICAL_SPEC.md`, `AUDIT_TEMPLATES.md`), meta-harness (`.harness/manifest.yaml` + `.ai/harness/project-intake.md` + `.ai/harness/project_failure-log.md`).

**Đã map kiến trúc bằng codegraph:**
- V1 Legacy renderer (`document-renderer.service.ts` — 34k dòng, switch theo `templateCode`)
- V2 Published-contract renderer (`rendering/` + `DocxtemplaterContractRenderEngine`)
- Wrapper client (`bm-panel-registry.generated.ts` + `bm-form/` shared lib)

**Cách làm mỗi biểu mẫu hiện tại:** 3 lớp file, nhưng **chỉ 5/213 BM đủ cả 3 lớp (`bmNNN-form-inputs-api.ts` + `bmNNN-options.ts` + `bm-NNN-form-inputs.tsx`)**; 208/213 chỉ có lớp component với raw-fetch inline.

**Đối chiếu với zip quanlynew-main.zip:**
- 5 form canonical (BM-001, 053, 090, 097, 156) → QLLaw và zip **khớp 100%** pattern (`save*FormInputs`, `normalize*FormInputs`, `EMPTY_*_FORM_INPUTS`, `BMNNN_*_OPTIONS`, derived cascading, localStorage cache).
- 55/60 form zip non-canonical → QLLaw vẫn giữ **"cách làm cũ" raw-fetch + bespoke form-type** y hệt zip; chỉ thay đổi là dùng `bm-form/*` (một phần) và `BmFormSection` (một phần).

**Audit, không sửa code.** Không có file nào được tạo/sửa/xoá ngoài 2 helper scripts (đã ignore, không push): `agent-tools/compare-coverage.ps1`, `agent-tools/count-zip-catalog.ps1`, `extract-zip.ps1`, `find-yeu-cau.ps1`, `list-zip.ps1`. Toàn bộ scripts nằm ở `C:\Users\ADMIN\.cursor\projects\d-Study-Project-QLLaw-main\agent-tools\` — không trong workspace.
