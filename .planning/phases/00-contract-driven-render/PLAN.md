# Phase 0 — Plan: Contract-Driven Render & Form Schema

> Status: **plan ready v2.3** (G/H/I/J — Legal/Semantic, Provenance, Migration, Performance — thêm 2026-06-25)
> Ngày: 2026-06-25
> Phạm vi: Phase A→F→G→H→I→J→C→D theo CONTEXT.md + DOCX Fidelity + Production Hardening
> Verify model: **goal-backward** — mỗi task có command pass/fail cụ thể

---

## 0. Goal-backward verification (đo trước khi làm)

| # | Outcome (user-visible) | Pass command (must exit 0) |
|---|------------------------|-----------------------------|
| G1 | 213/213 BMs schema hợp lệ (required fields tồn tại) | `pnpm audit:forms:runtime-readiness` |
| G2 | Không BM nào render `{{...}}` literal | `pnpm smoke:forms-runtime:213` |
| G3 | Gate 213 pass KHÔNG cần `--allow-*` | `pnpm gate:forms:213` |
| G4 | User mở BM UI → thấy input cho required fields → save → reload → DOCX đúng | Playwright E2E (Phase E3) |
| G5 | Backend trả `{ path, label, section, sectionTitle, required, code, message }` khi thiếu required | API integration test (Phase A2) |

> **Quan trọng (correction #8)**: G2/G3 KHÔNG pass chỉ nhờ schema UI tồn tại. Smoke phải tự sinh deterministic mock values cho mọi required manual field trước khi render. Gate chỉ meaningful sau khi E1+E2 pass.

---

## 1. Dependency graph (v2.3 — G/H/I/J thêm production hardening)

```
A1 → A2 → A3
        ↓
B1 → B2 → B3 → B4
        ↓
E1 → E2
        ↓
F1 → F2 → F3 → F4 → F5    ← DOCX fidelity gate
        ↓
G1 → G2 → G3 → G4         ← Legal/semantic validation
        ↓
C1 → C2 → C3               ← Contract sync gate (sau F + G)
        ↓
E3 → E4
        ↓
F6
        ↓
H1 → H3a                   ← Provenance type + minimal block (ngay sau F6, trước I)
        ↓
I1 → I2                    ← Migration existing documents
        ↓
H2 → H3b                  ← Full audit table + full block (sau I+G+F)
        ↓
J1 → J2 → J3 → J4          ← Performance + observability + rollback + feature flags
        ↓
D1                          ← Renderer refactor (cuối cùng, khi safety net đầy đủ)
```

**Lý do thứ tự v2.3**:
- F (DOCX fidelity) phải trước G vì G validate values dựa trên schema đã ổn định.
- H1/H3a ngay sau F6 (trước I) để tránh window F6→I mà không có export block. Export production phải bị block (minimal: drift + placeholder) ngay khi F6 pass.
- H3b (full block) chạy sau I vì cần G2 (semantic audit) + F2/F3 (fidelity) làm signals đầy đủ.
- C (contract sync gate) sau F+G vì cần schema/fidelity pass trước khi gate có ý nghĩa.
- I (migration) sau F6 vì cần golden fixtures làm baseline cho legacy data.
- H (provenance) sau I vì provenance chỉ meaningful khi documents đã migrated/consistent.
- J (performance) sau H vì cache + metrics cần provenance layer để trace.
- D (refactor 33k dòng) cuối cùng vì cần tất cả test/fidelity/audit/provenance làm safety net.

**Lý do**: E1/E2 xong → phải verify DOCX fidelity trước khi gate C. F1-F5 là lớp bảo hiểm cuối để render không chỉ "không lỗi kỹ thuật" mà còn "đúng mẫu pháp lý". C gate yếu nếu chỉ kiểm tra schema/render mà không kiểm tra fidelity.

**Lý do**: Không thể gate drift khi chưa có schema conformance + render integration. Gate yếu sẽ cho phép regression lọt.

---

## 2. Task ordering & atomic commits

**Quy tắc**: 1 task = 1 commit. Mỗi commit phải giữ `pnpm test` xanh (trừ task explicitly marked "skips long test").
Commit message style: `type(scope): why`.

---

### Phase A — Hotfix có nghĩa (ưu tiên #1)

#### Task A1. Initialize canonical `render_payload_snapshot` trong `createBatch`  ✅ CORRECTED
- **File**: `apps/api/src/modules/documents/documents.service.ts` (line 397, `render_payload_snapshot` block trong `createBatch`)
- **Why**: Root cause gốc là `createBatch` khởi tạo snapshot thiếu `formInputs`, `payloadOverrides`, `renderPayloadOverrides`, `contractMeta`. Controller form-inputs chỉ là nơi save — không phải nơi khởi tạo.
- **Patch** (giá trị đầy đủ cần có trong snapshot lúc tạo):
    ```
    render_payload_snapshot = {
      case: {...},
      target: {...},
      template: {...},
      formats: plan.formats,
      formInputs: {},                 // ← mới
      payloadOverrides: {},           // ← mới
      renderPayloadOverrides: {},     // ← mới
      contractMeta: {                 // ← mới (CORRECTION)
        templateCode: item.templateCode,
        sourceId: <lookup, may be null>,
        contractVersionHash: <lookup, may be null>,
        contractLookupStatus: "FOUND" | "MISSING" | "STALE"
      }
    }
    ```
  - **`contractLookupStatus` semantics** (locked — §10.1):
    - `FOUND`: lookup thấy `form_contract_versions` row matching `templateCode` với `compiled_json` khớp `stableHash(compileContract(v1File))`.
    - `MISSING`: không có row nào cho `templateCode` trong DB.
    - `STALE`: có row nhưng `compiled_json` hash lệch `stableHash(compileContract(v1File))` (drift detected).
  - UI/debug dùng `contractLookupStatus` để phân biệt "chưa publish" / "stale" / "lookup fail" thay vì chỉ `null`.
- **Hot-path constraint** (v2.3 — locked):
  - `createBatch` MUST NOT: compile contract, hash filesystem files, scan 213 contracts, iterate `docs/audit/docx/contracts/locked/*`.
  - Lookup `contractMeta` PHẢI là O(1) từ in-memory cache hoặc indexed DB query (single-row by `templateCode`).
  - Nếu cache miss hoặc DB miss → fallback `MISSING` + log warning, KHÔNG block `createBatch`.
  - `C1` (startup guard) và `J1` (contract cache) chịu trách nhiệm full drift check.
  - Implementation: `contractMeta.contractVersionHash` lookup qua `formContractVersionsRepo.findLatestByCode(templateCode)` (single indexed query, không scan).
- **Verify**:
  - New unit test `documents.service.spec.ts` case `createBatch` → snapshot có đủ 4 keys mới.
  - Existing 211 API tests vẫn pass (snapshot spread-safe — chỉ thêm key, không sửa logic).
  - `pnpm test:api -- documents` pass.
- **Commit**: `fix(documents): initialize formInputs + overrides + contractMeta in createBatch snapshot`
- **Skip long test**: no (cần chạy api test để confirm không vỡ 211 tests)
- **Risks**: 
  - Một số BM-specific code path đọc snapshot có thể expect thiếu key → check BM-001/Bm-031/Bm-053 sau khi merge.
  - `contractVersionHash` cần lookup từ `form_contract_versions` — nếu chưa có version cho template → fallback `null` + log warning, không fail batch.

#### Task A2. Structured validation error contract  ✅ CORRECTED
- **File**: `apps/api/src/modules/form-studio/application/contract-form-inputs.service.ts`
- **Contract** (locked):
  ```ts
  type FormValidationError = {
    path: string;            // "agency.parentName"
    label: string;           // "Tên viện kiểm sát"
    section: string;         // "agency"
    sectionTitle: string;    // "Cơ quan ban hành"
    required: boolean;
    code:
      | "REQUIRED"
      | "INVALID_TYPE"
      | "INVALID_DATE"
      | "UNKNOWN_FIELD"
      | "CONTRACT_DRIFT";
    message: string;
  };

  type FormValidationResponse = {
    ok: false;
    errors: FormValidationError[];
  };
  ```
- **Why**: Mở rộng thêm `sectionTitle` + `code` để FE render đẹp và debug được, không phải parse message string.
- **Verify**:
  - New unit test `contract-form-inputs.service.spec.ts`:
    - Case "missing required field" → response chứa `errors[0]` đủ 7 key.
    - Case "invalid date format" → `code === "INVALID_DATE"`.
  - `pnpm test:api -- contracts-form-inputs` pass.
- **Commit**: `feat(form-inputs): structured FormValidationError with sectionTitle + code`
- **Skip long test**: yes

#### Task A3. Wire hotfix UI: render structured error list
- **File**: `apps/web/src/components/documents/generic-template-form-inputs.tsx`
- **Why**: Phase A chỉ có ý nghĩa khi user thấy được lỗi có field cụ thể. Hiện `setError(msg)` chỉ show string.
- **Approach**: Render error dạng list (path + label + section), không parse string. Nếu backend trả `errors[]` thì map thành UI list; nếu trả message cũ thì fallback string.
- **Verify**:
  - `pnpm test:web-unit` pass.
  - Manual: mở BM UI, để trống required, save → thấy error có path + label + section.
- **Commit**: `feat(ui): render structured FormValidationError list in form inputs panel`
- **Skip long test**: yes

**Phase A gate**: `pnpm test:api` + `pnpm test:web-unit` xanh. User mở BM UI → thấy error có path + label + section + sectionTitle.

---

### Phase B — Schema-driven UI (core)

#### Task B1. `derive-form-input-schema.ts` với 3-layer fallback  ✅ CORRECTED
- **File mới**: `packages/form-contracts/src/derive-form-input-schema.ts`
- **Output shape**:
  ```ts
  type FormInputSchema = {
    templateCode: string;
    sourceId: string;
    warnings: SchemaWarning[];
    sections: FormInputSection[];
  };

  type FormInputSection = {
    key: string;            // first path segment
    title: string;          // SECTION_TITLES[key] ?? humanize(key)
    fields: FormInputField[];
  };

  type FormInputField = {
    path: string;           // "agency.parentName"
    label: string;
    required: boolean;
    inputType: "text" | "date" | "number" | "textarea";
    source: RenderBindingSourceKind;  // manual | casePayload | agencyConfig | officialConfig | systemDate | computed
    editable: boolean;                  // ← CORRECTION: UI dùng để decide render input vs readonly
    readonlyReason?:                    // ← CORRECTION: chỉ set khi editable=false
      | "CASE_PAYLOAD"
      | "AGENCY_CONFIG"
      | "OFFICIAL_CONFIG"
      | "SYSTEM_DATE"
      | "COMPUTED";
    visible: boolean;                   // ← v2.3: UI dùng để decide render hay hide hoàn toàn
    visibilityReason?:                  // ← v2.3
      | "USER_INPUT"                    // editable manual field
      | "READONLY_PREVIEW"              // casePayload/agencyConfig/systemDate/computed nếu hữu ích preview
      | "INTERNAL_RENDER_ONLY";        // internal: hide khỏi UI nhưng vẫn resolve/render
    reviewRequired: boolean;
    origin: "canonical" | "binding-fallback" | "hint";  // debug aid
  };

  // Rule (locked):
  //   manual              → editable=true,  readonlyReason=undefined, visible=true,  visibilityReason="USER_INPUT"
  //   casePayload         → editable=false, readonlyReason="CASE_PAYLOAD", visible=true, visibilityReason="READONLY_PREVIEW"
  //   agencyConfig        → editable=false, readonlyReason="AGENCY_CONFIG", visible=true, visibilityReason="READONLY_PREVIEW"
  //   officialConfig      → editable=false, readonlyReason="OFFICIAL_CONFIG", visible=true, visibilityReason="READONLY_PREVIEW"
  //   systemDate          → editable=false, readonlyReason="SYSTEM_DATE", visible=true, visibilityReason="READONLY_PREVIEW"
  //   computed            → editable=false, readonlyReason="COMPUTED", visible=false (default), visibilityReason="INTERNAL_RENDER_ONLY"
  //   computed (contract hint cho phép preview) → visible=true, visibilityReason="READONLY_PREVIEW"
  //   unknown → manual    → editable=true,  readonlyReason=undefined, visible=true, visibilityReason="USER_INPUT", warning emitted
  //   binding-fallback    → editable=true,  source="manual", visible=true, visibilityReason="USER_INPUT", warning emitted

  type SchemaWarning = {
    code: "BOUND_SLOT_MISSING_FIELD" | "REJECTED_AS_EDITABLE" | "UNKNOWN_SOURCE_NORMALIZED";
    path?: string;
    message: string;
  };
  ```
- **3-layer source priority** (CORRECTION #2):
  1. **`canonicalFields`** (primary): normal fields với full schema.
  2. **`renderBindings[]` + `docxSlots[]`**: detect slots có binding kind `FIELD` hoặc có trong `docxSlots[]` nhưng không có trong `canonicalFields` → emit field mặc định `inputType="text"`, `source="manual"`, `origin="binding-fallback"` + warning `BOUND_SLOT_MISSING_FIELD`.
  3. **`formInputHints.suggestedControls`**: chỉ dùng làm UI hint refinement (label override, default value), **KHÔNG bao giờ là source of truth cho field existence**.
  4. **`rejectedCandidates[]`**: **NEVER** thành editable field. Nếu lỡ có → emit warning `REJECTED_AS_EDITABLE`.
- **Source normalization**:
  - `source: "unknown"` → output `source: "manual"` + warning `UNKNOWN_SOURCE_NORMALIZED` (chỉ tạm; remediation thật ở Phase C3).
- **Verify**:
  - Unit test `derive-form-input-schema.spec.ts` với 6 BMs (BM-001, BM-051, BM-053, BM-100, BM-150, BM-200).
  - Snapshot test cho mỗi BM để chống regression.
  - Test riêng: BM có `rejectedCandidates` → assert không có field editable từ rejected.
  - `pnpm test:contracts` pass.
- **Commit**: `feat(form-contracts): derive-form-input-schema with 3-layer source priority`

#### Task B2. `SECTION_TITLES` map + `humanizeSectionKey` fallback  ✅ CORRECTED
- **File mới**: `packages/form-contracts/src/section-titles.ts`
- **Rule** (locked):
  ```ts
  const SECTION_TITLES: Record<string, string> = {
    agency: "Cơ quan",
    document: "Văn bản",
    caseInfo: "Thông tin vụ án",
    legalBasis: "Căn cứ pháp lý",
    offense: "Hành vi / tội danh",
    measure: "Biện pháp tố tụng",
    signature: "Chữ ký",
    recipients: "Nơi nhận",
    caseRecovery: "Khôi phục hồ sơ",
    prosecutionTransfer: "Chuyển hồ sơ",
    investigationExtension: "Gia hạn điều tra",
    approval: "Phê duyệt",
    monitoring: "Kiểm sát",
    // ... mở rộng khi phát hiện section mới trong 213 BMs (chạy audit trước)
  };

  export function getSectionTitle(sectionKey: string): string {
    return SECTION_TITLES[sectionKey] ?? humanizeSectionKey(sectionKey);
  }

  export function humanizeSectionKey(key: string): string {
    // camelCase / snake_case → "Từng Từ Viết Hoa"
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  ```
- **Verify**:
  - Test: mọi section key trong 213 BMs → `getSectionTitle()` trả non-empty string.
  - Test riêng: section key mới (ví dụ `unknownFutureSection`) → fallback `humanizeSectionKey` → non-empty.
  - KHÔNG assert "mọi key phải có trong SECTION_TITLES map" (test cứng sẽ chết khi thêm section).
  - Audit script: chạy qua 213 BMs → report sections KHÔNG có trong map (cần review bổ sung title đẹp).
- **Commit**: `feat(form-contracts): section titles map + humanize fallback`
- **Coupling**: B1 dùng B2.

#### Task B3. Endpoint `GET /documents/generated/:id/form-schema` + UI wire  ✅ CORRECTED
- **File mới endpoint**: `apps/api/src/modules/documents/document-form-schema.controller.ts`
  (hoặc method mới trong `document-renderer.controller.ts` — chọn khi execute)
- **Endpoint contract** (locked — §10.3):
    ```
    GET /documents/generated/:id/form-schema
    Response:
    {
      generatedDocumentId: string,
      templateCode: string,
      sourceId: string,
      contractVersionHash: string,
      schema: FormInputSchema,
      values: Record<string, unknown>,          // ← user-editable formInputs ONLY (editable=true fields)
      resolvedValues: Record<string, unknown>,  // ← readonly/render preview values (case/system/agency/computed)
      validation: {
        missingRequiredFields: FormValidationError[];
      }
    }
    ```
- **Semantics**:
  - `values` chỉ chứa entries với `editable=true`. UI bind input từ đây. Save chỉ ghi keys này vào `formInputs`.
  - `resolvedValues` chứa entries với `editable=false` (casePayload, agencyConfig, ...) + preview của editable values. UI hiển thị readonly + dùng cho render preview.
  - **Quan trọng**: nếu không tách → save sẽ ghi cả `casePayload.*` vào `formInputs` → data lẫn lộn, khó debug.
- **Why**: Schema phải gắn với **generated document** hiện tại (có snapshot riêng), không chỉ template catalog. Generated document có case/target context riêng → values khác nhau giữa 2 documents cùng template.
- **File modify (UI)**: `apps/web/src/components/documents/generic-template-form-inputs.tsx`
  - Gọi endpoint mới khi load.
  - Render dynamic sections theo `schema.sections`.
  - Hiển thị `validation.missingRequiredFields` nếu có.
  - Preserve existing 6-section behavior cho BM custom (BM-001, BM-156…) — KHÔNG touch custom components.
- **Verify**:
  - API integration test `document-form-schema.controller.spec.ts`: GET với id hợp lệ → response shape đúng.
  - Visual test: load BM-051 (3 sections) → render đủ 3. Load BM-001 (9 sections) → render đủ 9 (nếu không có custom component).
  - `pnpm test:web-unit` pass.
  - `pnpm typecheck` pass.
- **Commit**: `feat(documents): GET /form-schema endpoint + dynamic UI render`
- **Risk**: Custom UI components BM-001, BM-156 có thể vẫn dùng hard-coded panels. Mitigation: chỉ swap UI cho BMs chưa có custom component.

#### Task B4. Source normalization trong schema layer
- **File**: `packages/form-contracts/src/derive-form-input-schema.ts` (cùng B1, hoặc commit riêng)
- **Approach**: `unknown` → `manual` trong output + warning. Field vẫn editable. KHÔNG đụng vào locked contract (đó là việc của C3).
- **Verify**:
  - Test: BM có `source: "unknown"` → output `source: "manual"`, có warning.
  - Audit script: list 16 `unknown` + 90 `constantFromDocx` + 9 `derived` = **115 fields** cần remediation ở C3.
- **Commit**: `feat(form-contracts): normalize unknown source to manual with warning`
- **Coupling**: OK tách riêng B1, hoặc gộp.

**Phase B gate (CORRECTED)**: 
- ✅ 213/213 BMs `deriveFormInputSchema()` thành công (no throw).
- ✅ 100% canonicalFields có source ∈ {manual, casePayload, agencyConfig, officialConfig, systemDate, computed} đều expose trong schema.
- ✅ 100% required manual fields xuất hiện trong UI schema (test bằng cách load từng BM, kiểm tra có input tương ứng).
- ✅ Save/reload preserve unknown sections (không xoá sections không có trong schema hiện tại).

---

## Phase F — DOCX Fidelity Gate (v2.2 — blind spot sau E2)

> **Purpose**: Schema/UI/render passing is not enough. A BM is only correct when rendered DOCX remains faithful to the original DOCX template. Blind spot lớn: DOCX có thể không còn `{{...}}` nhưng vẫn sai mẫu hoàn toàn (fill nhầm slot, mất header/footer, bảng sai dòng, format vỡ).

**Nền tảng có sẵn**:
- 373 normalized DOCX templates tại `storage/templates/normalized-docx/`.
- `scripts/docx-contract/extract-docx-structure.mjs` — đọc OOXML zip, extract text, table count, header/footer, style IDs.
- `scripts/docx-contract/reconcile-form-corpus.mjs` — inventory BM.

**Precondition**: F1-F5 chạy sau E2 (mock values đã sẵn sàng).

#### Task F1. `audit:docx-slot-inventory` — 213/213  ✅ NEW
- **File mới**: `scripts/audit/audit-docx-slot-inventory.mjs`
- **Input**: `docs/audit/docx/contracts/locked/*.json` + `storage/templates/normalized-docx/*/BM-*_normalized.docx`
- **Approach**: với mỗi locked contract, verify mọi `docxSlots` có trạng thái rõ ràng:
  ```
  type DocxSlotInventoryReport = {
    templateCode: string;
    sourceId: string;
    totalDocxSlots: number;
    boundSlots: string[];
    canonicalFields: string[];
    renderBindings: string[];
    missingCanonicalField: string[];
    missingRenderBinding: string[];
    rejectedCandidates: Array<{ slotId: string; reason: string }>;
    status: "PASS" | "REVIEW_REQUIRED" | "FAIL";
  };
  ```
- **PASS rule**:
  - 100% `docxSlots` có `renderBinding` HOẶC nằm trong `rejectedCandidates` có reason rõ.
  - 100% `renderBindings` trỏ tới field/source hợp lệ.
  - 100% `canonicalFields.path` unique (no duplicates).
- **FAIL rule**:
  - `docxSlot` xuất hiện trong DOCX nhưng không `renderBinding` và không `rejectedCandidates` reason.
  - `renderBinding` trỏ tới path không tồn tại trong `canonicalFields`/resolved source.
  - duplicate `canonicalFields.path`.
- **Command**: `pnpm audit:docx-slot-inventory`
- **Pass criteria**: 213/213 PASS, 0 `missingRenderBinding`, 0 duplicate field path, 0 orphan renderBinding.
- **Commit**: `test(docx): audit-docx-slot-inventory for 213/213 BMs`
- **Coupling**: E1 phải pass trước (schema derive phải chạy được).

#### Task F2. `test:docx-structural-fidelity` — 213/213  ✅ NEW
- **File mới**: `tests/docx/docx-structural-fidelity.test.mjs`
- **Allowlist file** (versioned, committed): `docs/audit/docx/fidelity-allowlist.json` — thay vì hard-code trong script.
  ```
  {
    "BM-053": {
      "paragraphDeltaPercent": 20,
      "allowedMissingStyleIds": [],
      "allowedTableDelta": 0,
      "notes": "legalBasis lines expand text length"
    },
    "default": {
      "paragraphDeltaPercent": 15,
      "allowedMissingStyleIds": [],
      "allowedTableDelta": 0
    }
  }
  ```
- **Approach**: render 213 BMs với deterministic mock → unzip both original + rendered → compare:
  ```
  type DocxStructuralFidelityResult = {
    templateCode: string;
    originalParagraphCount: number;
    renderedParagraphCount: number;
    paragraphDeltaPercent: number;
    originalTableCount: number;
    renderedTableCount: number;
    originalHeaderCount: number;
    renderedHeaderCount: number;
    originalFooterCount: number;
    renderedFooterCount: number;
    originalStyleIds: string[];
    renderedStyleIds: string[];
    missingStyleIds: string[];
    status: "PASS" | "FAIL";
  };
  ```
- **File comparison**: `word/document.xml`, `word/styles.xml`, `word/header*.xml`, `word/footer*.xml`, `word/numbering.xml`, `word/settings.xml`, `word/_rels/document.xml.rels`.
- **PASS rule** (với allowlist):
  - rendered DOCX opens as valid zip + `word/document.xml` tồn tại.
  - `tableCount` không giảm trừ khi `fidelity-allowlist.json[templateCode].allowedTableDelta` cho phép.
  - `headerCount` / `footerCount` không đổi.
  - `missingStyleIds` nằm trong `fidelity-allowlist.json[templateCode].allowedMissingStyleIds`.
  - `paragraphDeltaPercent <= fidelity-allowlist.json[templateCode].paragraphDeltaPercent`.
- **Command**: `pnpm test:docx-structural-fidelity`
- **Pass criteria**: 213/213 PASS. Không so sánh text equality (text length thay đổi do fill data là OK).
- **Commit**: `test(docx): structural fidelity test for 213/213 BMs`
- **Note**: Exact XML equality không khả thi vì fill data thay đổi text length. Threshold-based comparison.

#### Task F3. `audit:rendered-text-fidelity` — 213/213  ✅ NEW
- **File mới**: `scripts/audit/audit-rendered-text-fidelity.mjs`
- **Approach**: extract normalized text từ original + rendered DOCX:
  ```
  type TextAnchor = {
    text: string;
    required: boolean;
    locationHint?: string;
  };

  type TextFidelityReport = {
    templateCode: string;
    originalTextLength: number;
    renderedTextLength: number;
    textLengthRatio: number;
    requiredAnchors: TextAnchor[];
    missingAnchors: string[];
    unreplacedPlaceholders: string[];
    status: "PASS" | "FAIL";
  };
  ```
- **Auto-generate anchors**: từ original DOCX, extract các đoạn text dài cố định (quốc hiệu/tiêu ngữ, tên biểu mẫu, căn cứ pháp lý cố định, nhãn mục, "Nơi nhận", chức danh ký).
- **Allowlist**: thresholds từ `docs/audit/docx/fidelity-allowlist.json[templateCode].textLengthRatioMin/Max` (default 0.7–1.3).
- **PASS rule**:
  - 0 unreplaced `{{...}}` placeholder.
  - 0 missing required anchors.
  - `textLengthRatio` nằm trong `fidelity-allowlist.json` threshold.
- **Command**: `pnpm audit:rendered-text-fidelity`
- **Pass criteria**: 213/213 PASS.
- **Commit**: `test(docx): rendered text fidelity audit for 213/213 BMs`

#### Task F4. `test:docx-binding-correctness` — representative + 213 smoke  ✅ NEW
- **File mới**: `tests/docx/docx-binding-correctness.test.mjs`
- **Approach**: deterministic mock values encode field path để verify binding correctness:
  ```ts
  // legalBasis.line1 → __LEGALBASIS_LINE1__
  // signature.signerName → __SIGNATURE_SIGNERNAME__
  function deterministicMock(field: FormInputField): string {
    return `__${field.path.replace(/\W+/g, "_").toUpperCase()}__`;
  }
  ```
- **Assert sau render**:
  - Mỗi required manual field marker xuất hiện đúng `expectedMultiplicity` lần.
  - Marker không xuất hiện trong vùng bị cấm (banned zones per contract).
  - Marker không bị swap (marker A không xuất hiện trong slot của marker B).
- **Multiplicity rule**:
  - Single-value field → 1 lần.
  - Repeat/block field → N lần (theo mock data array length).
- **PASS rule**: 6 representative BMs (BM-001/051/053/100/150/200) pass binding correctness với XML context check. 207 BMs smoke pass (text-level: marker xuất hiện ≥1 lần, không duplicate ngoài expected).
- **XML context check** (v2.3 — chỉ 6 representative):
  ```
  type MarkerLocation = {
    marker: string;
    xmlPart: "document" | "header" | "footer";
    paragraphIndex?: number;
    tableIndex?: number;
    rowIndex?: number;
    cellIndex?: number;
    nearbyTextBefore: string;
    nearbyTextAfter: string;
    expectedSlotId: string;
  };

  type BindingCorrectnessReport = {
    templateCode: string;
    markers: MarkerLocation[];
    textLevelPassed: boolean;
    xmlContextPassed: boolean;
    status: "PASS" | "FAIL";
  };
  ```
- **Approach** (representative 6): không chỉ extract text mà còn unzip → parse `word/document.xml` (XML parser) → tìm marker trong `<w:t>` elements với XML context (paragraph/table/row/cell indices + nearby text).
- **Approach** (207 smoke): text-level only — chỉ check marker xuất hiện `≥1` lần, không false negative nếu XML context fail.
- **Lý do**: marker xuất hiện đúng 1 lần nhưng nằm sai paragraph/table cell vẫn có thể pass nếu chỉ extract text. XML context catch được swap.
- **Command**: `pnpm test:docx-binding-correctness`
- **Commit**: `test(docx): binding correctness with XML context for 6 representative BMs + text smoke for 207`

#### Task F5. `test:docx-repeat-blocks` — table/repeat fidelity  ✅ NEW
- **File mới**: `tests/docx/docx-repeat-blocks.test.mjs`
- **Approach**: contracts có table/list bindings (recipients, accused list, legalBasis, attachments) → render mock array với 3 rows → verify row count:
  ```
  type RepeatBlockFidelityReport = {
    templateCode: string;
    repeatBlocks: Array<{
      key: string;
      expectedRows: number;
      actualRows: number;
      status: "PASS" | "FAIL";
    }>;
  };
  ```
- **Rule**: nếu mock data có `recipients = [{name: "A"}, {name: "B"}, {name: "C"}]` → rendered table phải có đúng 3 data rows, không 1, không 0.
- **PASS rule**: repeat block count khớp expected (3 mock rows → 3 rendered rows).
- **Command**: `pnpm test:docx-repeat-blocks`
- **Commit**: `test(docx): repeat/table block fidelity for BMs with list bindings`

#### Task F6. `test:golden-docx` — 30 goldens  ✅ NEW
- **File mới**: `tests/golden-docx/` (30 subdirs, 1 per BM)
- **Structure**:
  ```
  tests/golden-docx/
    BM-001/
      input.json
      expected-anchors.json
      expected-text.txt
    BM-053/
      ...
  ```
- **30 BMs**: BM-001, BM-002, BM-004, BM-031, BM-039, BM-051, BM-053, BM-054, BM-057, BM-070, BM-085, BM-086, BM-100, BM-103, BM-139, BM-141, BM-144, BM-145, BM-146, BM-148, BM-150, BM-156, BM-159, BM-166, BM-168, BM-169, BM-170, BM-171, BM-172, BM-173.
- **PASS rule**: 30/30 golden pass. 0 missing anchor. 0 placeholder. 0 structural break. 0 binding marker mismatch.
- **Command**: `pnpm test:golden-docx`
- **Commit**: `test(docx): golden fixtures for 30 representative BMs`
- **Risk**: Golden fixtures cần maintain khi template thay đổi. Mitigation: F1-F5 chạy trước F6 để catch break sớm.

**Phase F gate**:
- 213/213 slot inventory PASS.
- 213/213 structural fidelity PASS.
- 213/213 rendered text fidelity PASS.
- 6/6 binding correctness PASS (representative).
- 207/207 binding correctness smoke PASS.
- Repeat/table blocks: 0 FAIL.
- 30/30 golden PASS.

---

## Phase G — Legal/Semantic Validation (v2.3)

> **Purpose**: F gate kiểm tra DOCX đúng cấu trúc/slot/text anchor. Nhưng nó chưa kiểm tra ý nghĩa nghiệp vụ. File render đúng slot vẫn có thể sai: ngày ký trước ngày quyết định, số văn bản sai format, căn cứ pháp lý thiếu điều/khoản, chức danh ký không phù hợp, BM giai đoạn truy tố nhưng case stage là điều tra.
> **Warn-only default**: semantic rules dễ false positive (date order, legal basis, case stage có ngoại lệ theo từng BM). Giai đoạn đầu `SEMANTIC_VALIDATION_ENFORCE=false` → chỉ log + warning. Sau khi 30 golden + canary ổn → bật enforce cho ERROR.

#### Task G1. `semantic-rules.ts` — declarative rule type  ✅ NEW
- **File mới**: `packages/form-contracts/src/semantic-rules.ts`
- **Type** (locked):
  ```ts
  type Condition = 
    | { kind: "always" }
    | { kind: "pathEquals"; path: string; value: unknown }
    | { kind: "pathIn"; path: string; values: unknown[] }
    | { kind: "pathTruthy"; path: string };

  type SemanticRule =
    | { code: "DATE_ORDER"; before: string; after: string; severity: "ERROR" | "WARNING" }
    | { code: "REQUIRED_WHEN"; path: string; when: Condition; severity: "ERROR" | "WARNING" }
    | { code: "FORMAT"; path: string; pattern: string; severity: "ERROR" | "WARNING" }
    | { code: "ONE_OF"; path: string; values: string[]; severity: "ERROR" | "WARNING" }
    | { code: "CASE_STAGE_COMPATIBLE"; path: string; allowedStages: string[]; severity: "ERROR" | "WARNING" }
    | { code: "LEGAL_BASIS_REQUIRED"; paths: string[]; severity: "ERROR" | "WARNING" };

  type FormSemanticErrors = {
    code: string;
    severity: "ERROR" | "WARNING";
    path?: string;
    relatedPaths?: string[];
    message: string;
  };
  ```
- **Where declared**: thêm field `semanticRules?: SemanticRule[]` vào locked contract JSON. Default `[]` (no rules).
- **Commit**: `feat(form-contracts): semantic-rules type + locked contract field`

#### Task G2. `audit:form-semantic-validity`  ✅ NEW
- **File mới**: `apps/api/src/modules/documents/validation/form-semantic-validator.ts` + `scripts/audit/audit-form-semantic-validity.mjs`
- **Approach**: 
  - Load locked contract → lấy `semanticRules`.
  - Load resolved values (formInputs + case + agency) → evaluate mỗi rule.
  - Report per BM + summary.
- **Command**: `pnpm audit:form-semantic-validity`
- **Pass criteria**:
  - 213/213 BMs have semantic rule coverage report.
  - 0 critical semantic ERROR trong 30 golden BMs.
  - WARNING allowed only with explicit remediation note (file `docs/audit/semantic-warnings.json`).
- **Commit**: `feat(semantic): form-semantic-validator + audit script for 213 BMs`

#### Task G3. UI hiển thị semantic error + warn-only mode  ✅ NEW
- **File modify**: `apps/web/src/components/documents/generic-template-form-inputs.tsx` + endpoint integration
- **Approach**:
  - Backend trả `{ schemaErrors, semanticErrors, contractErrors }` (mở rộng từ A2 `{ schemaErrors }`).
  - UI hiển thị 3 section riêng, semantic errors có icon đỏ ERROR / vàng WARNING.
- **Flag**: `SEMANTIC_VALIDATION_ENFORCE` (default `false`).
  - `false`: semantic ERROR → log + hiển thị warning trên UI + cho phép export.
  - `true`: semantic ERROR → block export (giống schema error).
- **Commit**: `feat(ui): render semantic validation errors with severity color + enforce flag`

#### Task G4. Predefined rule sets cho common patterns + allowlist  ✅ NEW
- **File**: `apps/api/src/modules/documents/validation/predefined-rules.ts`
- **Default rules auto-injected** (khi contract không khai báo rule riêng):
  - `DATE_ORDER`: `document.issueDate` phải ≤ `signature.signedDate`.
  - `REQUIRED_WHEN`: `legalBasis.line1` required khi template là biện pháp ngăn chặn.
  - `CASE_STAGE_COMPATIBLE`: BM stage phải match case stage.
  - `LEGAL_BASIS_REQUIRED`: các BM có `legalBasis` section phải có ≥ 1 dòng.
- **Commit**: `feat(semantic): predefined rules for date order / legal basis / case stage`

**Phase G gate** (warn-only by default):
- 213/213 BMs có semantic rule coverage report.
- 30/30 golden BMs có 0 critical ERROR.
- `SEMANTIC_VALIDATION_ENFORCE=false` → semantic ERROR chỉ log + warning, không block.
- Sau canary ổn → bật `SEMANTIC_VALIDATION_ENFORCE=true` → semantic ERROR block export.

---

## Phase H — Auditability & Export Provenance (v2.3 — sửa order: F6→H1/H3a→I→H2/H3b→J→D)

> **Purpose**: Sau khi render/export DOCX, cần truy vết được file render từ contract nào, data nào, ai export, khi nào. Với biểu mẫu pháp lý, đây bắt buộc. Không có provenance → export sai rất khó điều tra.
> **Order fix**: H1/H3a chạy ngay sau F6 (trước I) để tránh window F6→I mà không có export block. H3b (full block) chạy sau I khi đã có đủ signals.

#### Task H1. `ExportProvenance` type + emit  ✅ NEW
- **File mới**: `apps/api/src/modules/documents/provenance/export-provenance.ts`
- **Type** (locked):
  ```ts
  type ExportProvenance = {
    generatedDocumentId: string;
    templateCode: string;
    sourceId: string;
    contractVersionHash: string;
    rendererVersion: string;            // từ package.json
    renderEngine: "docxtemplater" | "shadow" | "legacy";
    inputHash: string;                  // sha256(formInputs)
    resolvedPayloadHash: string;        // sha256(resolved payload after override)
    outputDocxHash: string;             // sha256(output docx)
    exportedBy: string;
    exportedAt: string;                 // ISO
    validationStatus: "PASS" | "WARN" | "FAIL";
    fidelityStatus: "PASS" | "WARN" | "FAIL";
  };
  ```
- **Wire**: emit provenance ở cuối `document-renderer.service.ts::render()` flow (hoặc controller) trước khi trả về client.
- **Commit**: `feat(provenance): ExportProvenance type + emit on render`

#### Task H3a. Minimal export block (trước I)  ✅ NEW
- **File modify**: render/export controller
- **Rule** (minimal — block CHỈ khi critical, để tránh window F6→I mà không có block):
  - `contractLookupStatus` = `STALE` hoặc `MISSING`.
  - `unreplacedPlaceholders > 0`.
- **UI**: "Export blocked" với exact reason list.
- **Tại sao minimal**: G2 (semantic audit) và F2/F3 (fidelity) chưa chạy trong window này → không block trên schema/semantic ERROR được.
- **Commit**: `feat(export): minimal block (drift + placeholder) after F6, before migration`

#### Task H2. `document_export_audit_logs` table  ✅ NEW
- **File**: `apps/api/prisma/schema.prisma` (append model)
- **Columns**:
  ```
  id                              BigInt PK
  generated_document_id           BigInt FK
  template_code                   String
  source_id                       String
  contract_version_hash           String(64)
  input_hash                      String(64)
  resolved_payload_hash           String(64)
  output_docx_hash                String(64)
  exported_by                     String
  exported_at                     DateTime
  validation_status               String
  fidelity_status                 String
  created_at                      DateTime @default(now())
  ```
- **Migration**: `prisma migrate dev --name add_document_export_audit_logs`
- **Commit**: `feat(audit): document_export_audit_logs table + migration`

#### Task H3b. Full export block (sau I + sau G2 + sau F2/F3)  ✅ NEW
- **File modify**: render/export controller
- **Rule** (full — mở rộng H3a khi đã có đủ signals):
  - `contractLookupStatus` ≠ `FOUND` (drift STALE/MISSING).
  - `schemaErrors.length > 0`.
  - `semanticErrors.filter(ERROR).length > 0` (chỉ khi `SEMANTIC_VALIDATION_ENFORCE=true`).
  - `unreplacedPlaceholders > 0`.
  - `fidelityStatus = FAIL` (chỉ khi `DOCX_FIDELITY_GATE_ENFORCE=true`).
- **UI**: "Export blocked" với exact reason list, không cho retry.
- **Commit**: `feat(export): full block after migration + G2 + F2/F3 signals available`

**Phase H gate**:
- H3a block active ngay sau F6 (minimal, critical-only).
- Mọi export persist 1 row trong `document_export_audit_logs`.
- H3b full block active sau I+G2+F2/F3.
- 0 export thành công khi validation fail (với enforce flags = true).
- Query provenance trả đầy đủ.

---

## Phase I — Migration & Backward Compatibility (v2.3)

> **Purpose**: Document cũ tạo trước khi schema mới ra đời có `render_payload_snapshot` thiếu `formInputs/payloadOverrides/renderPayloadOverrides/contractMeta`. Sau deploy, mở lại UI có thể trống hoặc save đè mất dữ liệu. Cần migration path idempotent.

#### Task I1. `migrate:generated-documents-snapshot` script  ✅ NEW
- **File mới**: `scripts/migrate/migrate-generated-documents-snapshot.mjs`
- **Approach**:
  ```
  For every generated_documents row:
    snapshot = render_payload_snapshot ?? {}
    if !snapshot.formInputs → snapshot.formInputs = {}
    if !snapshot.payloadOverrides → snapshot.payloadOverrides = {}
    if !snapshot.renderPayloadOverrides → snapshot.renderPayloadOverrides = {}
    if !snapshot.contractMeta → 
      snapshot.contractMeta = {
        templateCode: <lookup from templates.template_code>,
        sourceId: <lookup or null>,
        contractVersionHash: <lookup or null>,
        contractLookupStatus: "MISSING"  // unknown for old docs
      }
    // legacy fields outside formInputs → copy into formInputs with audit note
    if (snapshot contains legacy data outside formInputs) {
      formInputs = { ...legacy, ...snapshot.formInputs }
      audit note in migration log
    }
    write back render_payload_snapshot
  ```
- **Flag**: `--dry-run` (chỉ report) hoặc `--apply` (thực sự update).
- **Output contract** (locked):
  ```json
  {
    "scanned": 1234,
    "patched": 567,
    "skipped": 12,
    "risky": [
      { "generatedDocumentId": "abc", "reason": "legacy fields ambiguous" }
    ]
  }
  ```
- **Idempotent**: chạy 2 lần không thay đổi thêm. Verify: `pnpm migrate:generated-documents-snapshot --dry-run` lần 2 → `patched = 0`.
- **Commit**: `feat(migrate): idempotent snapshot migration for existing generated_documents`

#### Task I2. Migration report in repo  ✅ NEW
- **File**: `docs/audit/migrations/<timestamp>.md`
- **Auto-generated** từ script, gitignored content (chỉ report file commit vào).
- **Commit**: `chore(migration): initial snapshot migration report 2026-06-XX`

**Phase I gate**:
- `pnpm migrate:generated-documents-snapshot --dry-run` clean.
- `--apply` thực sự patch đúng `patched = scanned - skipped` rows.
- 2nd `--dry-run` → `patched = 0` (idempotent).
- 0 risky rows nếu possible (hoặc risky rows đã review + có remediation note).

---

## Phase J — Performance, Observability & Rollback (v2.3)

> **Purpose**: Plan chạy nhiều audit 213 BM. Production cần nhanh, trace được, rollback được. Không có cache + metrics + feature flag thì 1 deploy có thể break production.

#### Task J1. Contract/schema cache  ✅ NEW
- **File mới**: `apps/api/src/modules/forms-contracts/infrastructure/contract-cache.ts`
- **Cache key**: `templateCode + sourceId + contractVersionHash`
- **Cache value**:
  ```ts
  type CachedContract = {
    compiledContract: unknown;
    formInputSchema: FormInputSchema;
    semanticRules: SemanticRule[];
    fidelityStatus: "PASS" | "WARN" | "FAIL" | "UNKNOWN";
    cachedAt: number;
  };
  ```
- **Invalidate khi**:
  - `contractVersionHash` đổi.
  - Publisher chạy.
  - Startup guard (C1) detect drift.
- **Implementation**: in-memory LRU + TTL (60s) + explicit invalidation hook.
- **Commit**: `feat(cache): contract+schema cache keyed by version hash`

#### Task J2. Structured metrics + logs  ✅ NEW
- **File**: `apps/api/src/common/observability/metrics.ts` + log structured
- **Metrics** (locked — emit với counter/timer):
  - `form_schema_build_ms` (timer, label: `templateCode`)
  - `render_docx_ms` (timer, label: `templateCode`, `renderEngine`)
  - `contract_lookup_ms` (timer, label: `status`)
  - `validation_ms` (timer, label: `phase`: schema|semantic|contract)
  - `docx_output_size_bytes` (histogram, label: `templateCode`)
  - `render_failure_count_by_template` (counter, label: `templateCode`, `reason`)
  - `export_blocked_count_by_reason` (counter, label: `reason`)
  - `contract_drift_detected_count` (counter)
- **Logs structured**: `{ traceId, spanId, templateCode, sourceId, contractVersionHash, phase, durationMs, result }`.
- **Commit**: `feat(observability): structured metrics + logs for form/render/export`

#### Task J3. Contract rollback command  ✅ NEW
- **File mới**: `scripts/contracts/contracts-rollback.mjs`
- **Approach**: mỗi publish lưu `previousVersionHash` + `currentVersionHash` + `publishedBy` + `publishedAt` trong `form_contract_versions` (đã có sẵn `revision` field).
- **Command**:
  ```
  pnpm contracts:rollback --template BM-053 --to <versionHash>
  ```
- **Effect**: update `form_contract_versions.status` của version mới nhất → `ARCHIVED`, version được chọn → `PUBLISHED`. Invalidate cache (J1).
- **Verify**: integration test rollback BM-053 + render snapshot pass.
- **Commit**: `feat(contracts): rollback command + previousVersionHash tracking`

#### Task J4. Feature flags + canary rollout  ✅ NEW
- **File mới**: `apps/api/src/common/feature-flags/feature-flags.ts`
- **Flags** (locked):
  - `FORM_SCHEMA_DYNAMIC_ENABLED` (default `false`).
  - `FORM_SCHEMA_DYNAMIC_ALLOWLIST` (CSV, e.g. `BM-001,BM-051,BM-053`).
  - `DOCX_FIDELITY_GATE_ENFORCE` (default `false` → khi `false` chỉ log warning, không block).
- **Read** từ `process.env` với cache + watcher for dev.
- **Canary stages**:
  1. Stage 1: enable schema UI for 6 representative BMs.
  2. Stage 2: enable 30 golden BMs.
  3. Stage 3: enable 213 BMs.
- **Commit**: `feat(flags): FORM_SCHEMA_DYNAMIC_ENABLED + ALLOWLIST + DOCX_FIDELITY_GATE_ENFORCE`

**Phase J gate**:
- Cache hit rate > 80% trong 30 minutes normal traffic (tự measure qua J2 metrics).
- Metrics emit mọi operation (verify qua dev log).
- Rollback command test pass.
- Feature flag toggle không cần restart.

---

### Phase C — Contract sync gate

#### Task C1. Startup guard với stable compiled hash  ✅ CORRECTED
- **File mới**: `apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts`
- **Compare rule** (CORRECTION #5):
  ```
  locked V1 file path: contracts/**/BM-XXX__*.contract.locked.json
  DB row: form_contract_versions WHERE sourceId = ...

  Drift check:
    v1Hash    = stableHash(JSON.parse(readFile(lockedPath)))
    v1Compiled = compileContract(JSON.parse(readFile(lockedPath)))
    v1CompiledHash = stableHash(v1Compiled)

    dbCompiledHash = stableHash(form_contract_versions.compiled_json)

    match = (v1CompiledHash === dbCompiledHash)
  ```
- **Wire**: gọi guard trong `apps/api/src/main.ts` onModuleInit. Nếu drift → fail-startup, trừ khi `ALLOW_CONTRACT_DRIFT=1`.
- **DB option** (nếu cần extra precision): thêm column `form_contract_versions.source_hash` qua migration nhỏ, populate từ `v1Hash` khi publish. Verify drift bằng compare `source_hash === stableHash(lockedPath)` trước khi compare compiled.
- **Verify**:
  - Integration test 1: mock DB với `compiled_json` stale → app boot fails với message rõ ràng.
  - Integration test 2: mock DB match → app boot OK.
  - Integration test 3: env `ALLOW_CONTRACT_DRIFT=1` → app boot OK + log warning đỏ.
  - `pnpm test:api` pass.
- **Commit**: `feat(forms-contracts): startup guard comparing stable compiled hash V1↔V2`
- **Risk**: Dev environment có thể bị block nếu chưa sync DB. Mitigation: env flag + loud warning.

#### Task C2. CI gate: `audit:contract-sync` block merge (CORRECTION §10.5)
- **Files**: 
  - `.github/workflows/ci.yml` (thêm step vào job check hiện có — xác định job name khi execute)
  - `scripts/audit/audit-contract-sync.mjs` (verify/tạo mới nếu chưa có — check khi execute; có thể đã có dưới tên khác)
- **Output contract** (locked — CI log phải đọc được ngay):
    ```
    pnpm audit:contract-sync
    
    Output (stdout JSON hoặc formatted):
    {
      totalLockedContracts: number,       // count từ V1 .locked.json files
      totalDbCompiledContracts: number,   // count từ form_contract_versions.compiled_json NOT NULL
      matched: number,                    // cả 2 phía cùng có + hash khớp
      missingInDb: string[],              // sourceIds có ở V1 nhưng không có ở DB
      staleInDb: string[],                // sourceIds có ở V1 + DB nhưng compiled_hash lệch
      extraInDb: string[]                 // sourceIds có ở DB nhưng không có ở V1 (orphan)
    }
    
    Exit code:
      0  — missingInDb.length === 0 AND staleInDb.length === 0
      1  — có missingInDb hoặc staleInDb
      2  — script error (DB down, parse fail, ...)
    ```
- **CI integration**: step `pnpm audit:contract-sync` fail → CI block merge.
- **Verify**:
  - Manual: tạo PR với V1 modification không sync DB → CI red với log "staleInDb: [BM-XXX]".
  - Manual: sync DB → CI green với log "matched: 213, missingInDb: [], staleInDb: []".
- **Commit**: `chore(ci): gate merges on contract V1/V2 stable hash sync with structured output`

#### Task C3. Remediate 115 invalid/unknown source fields trong locked contracts  ✅ CORRECTED (2026-06-25 — B4 audit re-scoped)
|- **Files**: locked contract JSON files có field invalid/unknown source (audit bằng script trước khi sửa).
|- **Scope expansion (B4 audit, 2026-06-25)**: Original plan ghi "Remediate 16 source=unknown". B4 corpus audit phát hiện thêm:
  - 16 × `source: "unknown"` (BM-051, BM-052, BM-060, BM-061, BM-062, BM-063, BM-064, ...)
  - 90 × `source: "constantFromDocx"` (concentrated on `legalBasis.procedureArticlesLine` + `agency.parentNameUpper`)
  - 9 × `source: "derived"` (computed at render time)
  - **Tổng: 115 source fields** cần remediate, KHÔNG phải 16.
|- **Approach** (KHÔNG chỉ drop flag — phải map đúng semantics):
  - For each of 115 fields:
    - Nếu user-editable (constant text user can override) → `source: "manual"`.
    - Nếu derive từ case → `source: "casePayload"`.
    - Nếu agency config → `source: "agencyConfig"`.
    - Nếu là fixed text from DOCX template (`constantFromDocx`) → `source: "officialConfig"` (preferred) hoặc compute + render-only field. KHÔNG BAO GIỜ map sang `manual` — làm vậy user sẽ sửa text pháp lý cố định.
    - Nếu là value computed at render time (`derived`) → `source: "computed"`. KHÔNG BAO GIỜ map sang `manual` — user không nên nhập lại giá trị renderer tự tính.
  - Mỗi field kèm audit note trong locked JSON (hoặc file `.remediation-log.json`).
|- **Verify**:
  - Audit: `pnpm --filter @qllaw/form-contracts test` (B4 audit test + E1 conformance test).
  - Audit: `grep -E '"source": "(unknown|constantFromDocx|derived)"' contracts/**/*.locked.json` → count 0 sau task.
  - `pnpm gate:forms:213` exit 0 không cần `--allow-source-unknown` hoặc `--allow-source-constant-from-docx` hoặc `--allow-source-derived`.
  - Mọi 115 fields đều có source ∈ `VALID_SOURCES` (locked: `manual | casePayload | agencyConfig | officialConfig | systemDate | computed`).
  - **Kill criterion (amended)**: Nếu > 5 fields không map được rõ ràng vào 1 trong 6 sources hiện có (vd. fields cần `TEMPLATE_CONSTANT` mới), C3 dừng và escalate: cần mở rộng taxonomy `VALID_SOURCES` ở PLAN.md mới, KHÔNG tự ý thêm.
|- **Commit**: `fix(contracts): remediate 115 invalid/unknown source fields in locked contracts (manual/casePayload/agencyConfig/officialConfig/computed)`
|- **Sequence**: Phải chạy script liệt kê 115 fields + propose mapping trước; review với user; mới apply.
|- **History**:
  - v2.3 initial: "Remediate 16 source=unknown" (under-scoped)
  - v2.3 +B4: "Remediate 115 invalid/unknown source fields" (correct scope after B4 corpus audit)

**Phase C gate (CORRECTED)**:
- ✅ CI phát hiện drift qua stable compiled hash.
- ✅ Production startup fail khi drift.
- ✅ Dev bypass chỉ với `ALLOW_CONTRACT_DRIFT=1` + loud warning.
- ✅ `pnpm gate:forms:213` exit 0 không cần `--allow-source-unknown` hoặc `--allow-source-constant-from-docx` hoặc `--allow-source-derived` (sau C3 đã remediate 115 fields xong: 0 unknown + 0 constantFromDocx + 0 derived).

---

### Phase D — Renderer hardening (sau E)

> **Hard rule**: Phase D chỉ bắt đầu SAU khi Phase E có test matrix pass. Đây là để tránh refactor 33k file mà không có safety net.

#### Task D1. Tách `document-renderer.service.ts` thành modules
- **Files**: mới + refactor
  - `apps/api/src/modules/documents/renderer/slot-binding.ts` (resolve `renderBindings`)
  - `apps/api/src/modules/documents/renderer/format-rules.ts` (`renderFormatHints`)
  - `apps/api/src/modules/documents/renderer/bm-overrides/` (30+ BM-specific → dispatcher table)
- **Verify**:
  - Renderer integration test pass (Phase E2).
  - Renderer unit test cho mỗi pure module.
  - `pnpm test:api` pass.
  - Snapshot test DOCX output cho 6 BMs đại diện (BM-001, BM-051, BM-053, BM-100, BM-150, BM-200 — locked ở §E2).
- **Commit**: nhiều commit nhỏ, mỗi commit 1 module extraction.
- **Risk**: Ôm đồm sẽ chậm. Mitigation: 1 commit = 1 concern, có test ngay.

**Phase D gate**: `document-renderer.service.ts` < 10k dòng. Renderer integration test pass. 6 BM snapshot DOCX ổn định.

---

### Phase E — Test matrix thật (PARALLEL AFTER B)

> **CORRECTION #6**: E1+E2 chạy **trước** C, không để sau C. E3+E4 chạy sau C.

#### Task E1. Schema conformance test: 213 BMs
- **File mới**: `test/forms/schema-conformance.test.mjs`
- **Approach**:
  - Iterate `contracts/**/BM-*__*.contract.locked.json` (212 + 1 root = 213).
  - For each: `deriveFormInputSchema(contract)` → assert:
    - sections.length > 0.
    - Mỗi field có đủ path + label.
    - Không duplicate path.
    - Không field nào có `origin === "rejected"` (rejectedCandidates must never be editable).
- **Verify**: `pnpm test:node -- schema-conformance` pass (213/213).
- **Commit**: `test(forms): schema conformance test for all 213 BMs`

#### Task E2. DOCX render integration: 6 BMs đại diện (CORRECTION §10.4 — bộ 6 không phải 5)
- **File mới**: `apps/api/src/modules/documents/renderer/__tests__/integration.spec.ts`
- **Bộ representative** (locked):
  - **BM-001** — reception/crimeReport/informant (multi-section phức tạp)
  - **BM-051** — decision/document simple (ít section)
  - **BM-053** — legalBasis special case (root cause thực tế, line1..line5)
  - **BM-100** — mid-corpus representative
  - **BM-150** — late-corpus representative
  - **BM-200** — late-corpus representative
- **Approach** (CORRECTION #8): generate **deterministic mock values** cho mọi required manual field trước khi render:
  ```ts
  function buildMockValues(schema: FormInputSchema): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.required && field.source === "manual") {
          values[field.path] = deterministicMock(field); // based on path hash
        }
      }
    }
    return values;
  }
  ```
- **Assert**:
  - DOCX output không có `{{...}}` literal.
  - Mọi required field có value.
- **Verify**: `pnpm test:api -- renderer-integration` pass.
- **Commit**: `test(renderer): DOCX snapshot integration for 6 representative BMs with deterministic mock`

#### Task E3. Playwright E2E: open → fill → save → reload → render
- **File**: `tests/e2e/form-studio.spec.ts` (extend existing skeleton)
- **Approach**:
  - Setup: tạo case, tạo document BM-001, mở UI.
  - Fill 3 required fields, save.
  - Reload page → assert values persist.
  - Click "Tải xuống DOCX" → assert file exists, không có `{{...}}`.
  - Lặp cho 6 BMs đại diện.
- **Verify**: `pnpm test:form-studio:e2e` pass.
- **Commit**: `test(e2e): form inputs round-trip for 6 representative BMs`

#### Task E4. Visual smoke: 30 BMs regression
- **File mới**: `tests/e2e/form-studio-visual.spec.ts`
- **Approach**:
  - Screenshot mỗi BM UI.
  - Compare với baseline snapshot.
  - Manual review nếu diff.
- **Verify**: `pnpm test:form-studio:e2e -- visual` pass.
- **Commit**: `test(e2e): visual smoke regression for 30 BMs`

**Phase E gate** (v2.2 — sau F1-F5): 213/213 schema pass + 6/6 render snapshot pass + 5/5 E2E pass + 30/30 visual smoke pass + Phase F gate pass.

---

## 3. Coupling & execution order (locked — v2.3)

```
Week 1:  A1 → A2 → A3
Week 2:  B1 → B2 → B3 → B4
Week 3:  E1 → E2
Week 4:  F1 → F2 → F3
Week 5:  F4 → F5
Week 6:  G1 → G2 → G3 → G4        ← Legal/semantic
Week 7:  C1 → C2 → C3
Week 8:  E3 → E4
Week 9:  F6                          ← golden fixtures
Week 10: H1 → H3a                    ← provenance type + minimal block (ngay sau F6)
Week 10: I1 → I2                     ← migration (song song H1/H3a)
Week 11: H2 → H3b                    ← full audit table + full block (sau I+G+F)
Week 12: J1 → J2 → J3 → J4           ← cache + metrics + rollback + flags
Week 13+: D1                          ← refactor an toàn
```

## 4. Risks & mitigations

| Risk | Mitigation | Phase |
|------|------------|-------|
| Custom UI BM-001 regress | Snapshot test trước/sau Phase B | B3 |
| DB stale sau PR | Startup guard với stable compiled hash | C1 |
| Gate yếu nếu thiếu test | E1+E2 PHẢI pass trước khi gate có ý nghĩa | C (sau E) |
| 33k renderer refactor | Tách module sau khi có test bảo vệ | D (sau E3) |
| Backward compat 211 API tests | A1 chỉ thêm key, không sửa logic merge | A1 |
| Unknown source 115 fields (16 unknown + 90 constantFromDocx + 9 derived) | Schema normalize (B4) + runtime smoke (E1) + remediation thật (C3) | B4+E1+C3 |
| Smoke pass giả do thiếu data | Sinh deterministic mock values trước render | E2 |
| Hard-code section title thiếu | `humanizeSectionKey()` fallback | B2 |
| BM có bound slot không có canonicalField | 3-layer source priority + warning | B1 |
| Render mất table/header/footer/font | F2 structural fidelity test | F2 |
| Render slot fill nhầm slot | F4 binding correctness test với path-encoded markers | F4 |
| DOCX fidelity không được verify | Phase F gate TRƯỚC C gate | F (trước C) |
| Nghiệp vụ sai (date order, legal basis, stage) dù DOCX đúng cấu trúc | G semantic validation rules + audit | G |
| File render sai không truy vết được | H export provenance + audit log | H |
| Document cũ vỡ sau deploy | I snapshot migration idempotent | I |
| Production không monitor/rollback được | J cache + metrics + rollback + feature flags | J |

## 5. Out of scope (locked)

- Refactor full 33k dòng `document-renderer.service.ts` (Phase D chỉ tách module).
- Viết lại 213 bespoke UI components (đã chạy được).
- Docker production build fix (issue riêng).
- Phase 4.2 Cases UX.

## 6. Definition of done (CORRECTED)

- **Phase A done**: 
  - User mở BM UI → thấy error có `path + label + section + sectionTitle + code + message`.
  - `render_payload_snapshot` lúc tạo mới có đủ 4 keys (formInputs/payloadOverrides/renderPayloadOverrides/contractMeta).
- **Phase B done**:
  - 213/213 BMs `deriveFormInputSchema()` thành công.
  - 100% canonicalFields với source ∈ valid set đều expose trong schema.
  - 100% required manual fields xuất hiện trong UI schema.
  - Save/reload preserve unknown sections.
- **Phase C done**:
  - CI phát hiện contract drift qua stable compiled hash (V1 file → compile → hash) ↔ (`compiled_json` → hash).
  - Production startup fail khi drift (trừ `ALLOW_CONTRACT_DRIFT=1` + loud warning).
  - `pnpm gate:forms:213` exit 0 không flag (sau C3 remediation xong).
- **Phase D done**: Renderer service < 10k dòng, có unit test per module.
- **Phase E done**: 213/213 schema test + 6/6 render snapshot + 5/5 E2E + 30/30 visual + F1-F6 DOCX fidelity.
- **Phase F done**: 213/213 slot inventory + structural fidelity + text fidelity + 6/6 binding correctness + 207/207 binding smoke + 0 repeat-block FAIL + 30/30 golden.
- **Phase G done**: 213/213 semantic rule coverage + 30/30 golden có 0 critical ERROR + UI hiển thị semantic errors theo severity + `SEMANTIC_VALIDATION_ENFORCE=false` by default (warn-only giai đoạn đầu).
- **Phase H done**: H3a block active ngay sau F6 (minimal: drift + placeholder) + H3b full block sau I+G+F + 100% export persist provenance row + 0 export thành công khi validation fail (với enforce flags = true).
- **Phase I done**: dry-run clean + apply patch đúng số row + idempotent (2nd dry-run = 0 patched) + 0 risky rows.
- **Phase J done**: cache hit rate > 80% + metrics emit mọi operation + rollback command pass + feature flag toggle không cần restart.

## 7. Kill criteria (v2.3 — khi nào dừng task vì assumption sai)

Không có kill criteria, Cursor có thể cố "fix cho pass" bằng relax gate hoặc auto-map bừa.

| Phase | Kill criterion | Hành động khi hit |
|-------|----------------|--------------------|
| **A1** | 211 API tests fail > 5 sau patch snapshot | Revert A1, refactor snapshot shape nhỏ hơn |
| **B1** | > 20% BMs có canonicalFields thiếu path usable | **DỪNG**. Chạy contract remediation (C3) trước. Không ép schema với 80% data |
| **B3** | 6 representative BMs không derive schema được | DỪNG. Tìm pattern lỗi chung trước khi expand 213 |
| **F1** | > 10% BMs missingRenderBinding (không có `rejectedCandidates` reason) | **DỪNG**. KHÔNG làm F2/F3/F4/F5/F6. Sửa contracts trước |
| **F2** | > 15% BMs structural FAIL khi threshold default | Điều chỉnh `fidelity-allowlist.json` per-BM, KHÔNG relax default |
| **G2** | semantic warnings > 30% BMs (trong 30 golden) | **KHÔNG enforce**. Chỉ report. Bỏ G3 enforce mode |
| **I1** | risky rows > 5% `generated_documents` | **KHÔNG --apply**. Cần manual migration plan cho risky cases |
| **J1** | cache hit rate < 50% trong synthetic benchmark 213 schema requests (1000 iterations) | Cache key sai hoặc invalidation sai. Re-design J1 trước khi làm J2-J4 |

Quy tắc chung: nếu kill criterion hit → dừng task, ghi vào `.planning/phases/00-contract-driven-render/SUMMARY.md`, escalate cho user. KHÔNG auto-relax gate để pass.

## 8. Reporting cadence

Sau mỗi task merged → update `.planning/phases/00-contract-driven-render/SUMMARY.md`:
- Task ID + status
- Verify command output (exit code, summary)
- Side effects / risks observed
- Next task

## 8. Corrections log

### v1 → v2 (chốt 2026-06-25)

| # | Vấn đề trong plan v1 | Sửa ở plan v2 |
|---|----------------------|----------------|
| 1 | A1 trỏ sai file (`form-studio controller` thay vì `documents.service.ts`) | A1 patch `createBatch` line 397, thêm 4 key mới |
| 2 | A2 error contract chưa đủ | Thêm `sectionTitle` + `code` enum (5 giá trị) |
| 3 | B1 chỉ từ canonicalFields, thiếu fallback | 3-layer source priority + rejectedCandidates blacklist |
| 4 | B2 hard-code 20 có thể thiếu | `SECTION_TITLES` map + `humanizeSectionKey()` fallback |
| 5 | B3 endpoint mơ hồ | Locked `GET /documents/generated/:id/form-schema` với response shape |
| 6 | C1 compare raw hash không khả thi | So sánh stable compiled hash (V1→compile→hash) vs (DB.compiled_json→hash); thêm `source_hash` column nếu cần |
| 7 | C3 drop flag sai logic | C3 thành "Remediate 16 source=unknown" trong locked contracts |
| 8 | Phase E đặt sau C | E1+E2 trước C; E3+E4 sau C. Smoke phải sinh deterministic mock values |
| 9 | DoD Phase B/C mơ hồ | DoD tightened: 213/213 schema pass + 100% required manual expose + drift check qua stable compiled hash |

### v2 → v2.1 (chốt 2026-06-25, 02:12)

| # | Vấn đề trong plan v2 | Sửa ở plan v2.1 |
|---|----------------------|-----------------|
| 10.1 | A1 `contractMeta` chỉ có `null` fallback — không debug được trạng thái | Thêm `contractLookupStatus: "FOUND" \| "MISSING" \| "STALE"` enum |
| 10.2 | B1 không phân biệt editable vs readonly — UI render input cho cả non-manual | Thêm `editable: boolean` + `readonlyReason?: 5 giá trị` |
| 10.2b | B1 không phân biệt visible vs editable — `computed` field mặc định không nên hiện UI dù cần render | Thêm `visible: boolean` + `visibilityReason?: 3 giá trị` (v2.3) |
| 10.3 | B3 response chỉ có `values` — UI có thể ghi nhầm casePayload vào formInputs | Tách thành `values` (user-editable) + `resolvedValues` (readonly preview) |
| 10.4 | E2 chỉ 5 BMs, BM-053 (legalBasis root cause) để open question | Locked 6 BMs: BM-001/051/053/100/150/200 |
| 10.5 | C2 `audit:contract-sync` output không định nghĩa — Cursor có thể viết sơ sài | Locked output contract: totalLocked/totalDb/matched/missingInDb/staleInDb/extraInDb + exit 0/1/2 |

### v2.1 → v2.2 (chốt 2026-06-25, 02:22)

| # | Vấn đề trong plan v2.1 | Sửa ở plan v2.2 |
|---|--------------------------|-------------------|
| 11 | Plan chỉ kiểm tra `{{...}}` + required fields + schema derive + UI render — blind spot lớn: DOCX có thể không còn `{{...}}` nhưng vẫn sai mẫu hoàn toàn | Thêm Phase F — DOCX Fidelity Gate (F1-F6) sau E2, trước C |
| 11.1 | F1 không có: slot nào bị bỏ nhầm, orphan binding, duplicate canonical path | `audit:docx-slot-inventory` với PASS/FAIL rule rõ |
| 11.2 | F2 không có: table/header/footer/styles có giữ không, DOCX có mở được không | `test:docx-structural-fidelity` unzip + compare paragraph/table/header/footer/style counts |
| 11.3 | F3 không có: text cố định có bị mất không, text length ratio | `audit:rendered-text-fidelity` với required anchors + ratio threshold |
| 11.4 | F4 không có: field fill đúng slot không, marker có bị swap không | `test:docx-binding-correctness` với path-encoded deterministic mock markers |
| 11.5 | F5 không có: repeat/table block có đúng số dòng không | `test:docx-repeat-blocks` với 3-row mock → verify row count |
| 11.6 | F6 không có: 30 BM quan trọng cần golden output | `test:golden-docx` với 30 goldens |
| 11.7 | DoD không include DOCX fidelity criteria | Thêm F gate vào Phase E + F done criteria |
| 11.8 | Timeline chưa có Phase F | Week 3-5: F1→F2→F3→F4→F5; Week 8: F6 |

### v2.2 → v2.3 (chốt 2026-06-25, 02:35)

| # | Vấn đề trong plan v2.2 | Sửa ở plan v2.3 |
|---|--------------------------|-------------------|
| 12 | Inconsistency: D1 gate, E2 commit, B1 test, E2 vẫn ghi 5 BM trong khi plan đã chốt 6 (thêm BM-053) | Sửa tất cả 4 chỗ "5 BM" → "6 BM" |
| 12.1 | Không validate ý nghĩa nghiệp vụ (date order, legal basis, case stage) — F chỉ check cấu trúc/slot/text | Thêm Phase G — Legal/Semantic Validation (G1-G4) sau F |
| 12.2 | Không có audit/provenance cho DOCX export — render xong không truy vết | Thêm Phase H — Auditability & Export Provenance (H1-H3a-H2-H3b) |
| 12.7a | H3 block export phải có sớm (trước I) — window F6→I không block là rủi ro | Split H3 → H3a (minimal, trước I) + H3b (full, sau I+G+F) |
| 12.7b | Semantic rules G dễ false positive — block ngay sẽ làm user không export được dù form hợp lệ | `SEMANTIC_VALIDATION_ENFORCE=false` by default. Giai đoạn đầu: log + warning. Sau canary: bật enforce cho ERROR |
| 12.7c | F2/F3 thresholds hard-coded trong script — BM khác nhau cần threshold khác nhau | Thêm `docs/audit/docx/fidelity-allowlist.json` versioned. F2 dùng `paragraphDeltaPercent` + `allowedMissingStyleIds` + `allowedTableDelta`. F3 dùng `textLengthRatioMin/Max` |
| 12.3 | Document cũ tạo trước schema mới sẽ vỡ sau deploy (thiếu formInputs/contractMeta) | Thêm Phase I — Migration & Backward Compatibility (I1-I2) |
| 12.4 | Không có cache/metrics/feature flags/rollback — production không monitor/rollback được | Thêm Phase J — Performance, Observability & Rollback (J1-J4) |
| 12.5 | Timeline chưa có G/H/I/J | Week 6 G; Week 10 I; Week 11 H; Week 12 J |
| 12.6 | DoD chỉ có A/B/C/D/E/F | Thêm G/H/I/J done criteria |

---

## 9. Prompt khóa cho Cursor (để dán khi execute)

Dán đoạn này vào prompt khi giao task cho Cursor để tránh quên:

```
Corrections before execution (đã chốt trong PLAN.md v2 §8 + v2.1 §8.2):

1. Task A1 phải patch apps/api/src/modules/documents/documents.service.ts::createBatch
   (line 397 — render_payload_snapshot block), KHÔNG chỉ form-studio controller.
   Snapshot lúc tạo PHẢI có đủ: formInputs:{}, payloadOverrides:{},
   renderPayloadOverrides:{}, contractMeta:{templateCode, sourceId, contractVersionHash, contractLookupStatus}.

2. deriveFormInputSchema dùng 3-layer source priority:
   (1) canonicalFields → normal fields
   (2) renderBindings/docxSlots bound nhưng thiếu canonical → fallback field + warning
   (3) formInputHints → chỉ UI hint, KHÔNG source of truth
   rejectedCandidates → KHÔNG BAO GIỜ editable.

3. FormInputField PHẢI có editable:boolean + readonlyReason? + visible:boolean + visibilityReason? cho non-manual.
   Rule: manual→editable=true, visible=true; casePayload/agencyConfig/officialConfig/systemDate→editable=false, visible=true (preview); computed→editable=false, visible=false mặc định (internal render only).

4. Endpoint PHẢI là GET /documents/generated/:id/form-schema trả về
   { schema, values, resolvedValues, validation.missingRequiredFields }. KHÔNG dùng
   forms-catalog endpoint cho per-document schema.
   values = user-editable formInputs only (editable=true).
   resolvedValues = readonly case/system/agency/computed preview.

5. SECTION_TITLES phải có humanizeSectionKey() fallback. Test assert
   non-empty title, KHÔNG assert "có trong map".

6. Contract drift check so sánh stableHash(compileContract(v1File))
   với stableHash(db.compiled_json). Nếu cần extra precision, thêm
   form_contract_versions.source_hash column.

7. --allow-source-unknown / --allow-source-constant-from-docx /
   --allow-source-derived chỉ drop SAU khi đã remediate 115 locked
   contracts:
   - 16 source=unknown → manual/casePayload/agencyConfig
   - 90 source=constantFromDocx → officialConfig (KHÔNG manual)
   - 9 source=derived → computed (KHÔNG manual)

8. Thứ tự v2.3:
   A → B → E1 → E2 → F1 → F2 → F3 → F4 → F5 → G1 → G2 → G3 → G4 → C1 → C2 → C3 → E3 → E4 → F6 → H1 → H3a → I1 → I2 → H2 → H3b → J1 → J2 → J3 → J4 → D1.
   Phase F (DOCX fidelity) phải pass TRƯỚC C gate. H3a chạy TRƯỚC I để tránh window F6→I.

9. Smoke:forms-runtime:213 phải sinh deterministic mock values cho
   mọi required manual field trước khi render. UI schema tồn tại
   không đảm bảo smoke pass.

10. E2 representative render integration = 6 BMs:
    BM-001, BM-051, BM-053 (legalBasis special case), BM-100, BM-150, BM-200.

11. pnpm audit:contract-sync PHẢI output JSON/format:
    { totalLockedContracts, totalDbCompiledContracts, matched,
      missingInDb[], staleInDb[], extraInDb[] }
    exit 0 chỉ khi missingInDb.length===0 && staleInDb.length===0.
    exit 1 = có missing/stale. exit 2 = script error.

12. contractMeta.contractLookupStatus enum: FOUND | MISSING | STALE.
    FOUND = DB row match stableHash. MISSING = không có DB row.
    STALE = có row nhưng hash lệch.

13. Phase F — DOCX Fidelity Gate (BẮT BUỘC sau E2, trước C):
    F1: audit:docx-slot-inventory — 213/213 PASS, 0 orphan binding, 0 duplicate canonical path.
    F2: test:docx-structural-fidelity — unzip original vs rendered, table/header/footer/style count.
    F3: audit:rendered-text-fidelity — required anchors không mất, text length ratio threshold.
    F4: test:docx-binding-correctness — deterministic mock markers encode path, verify binding position.
    F5: test:docx-repeat-blocks — 3 mock rows → 3 rendered rows cho repeat/table BMs.
    F6: test:golden-docx — 30 goldens (BM-001,002,004,031,039,051,053,054,057,070,085,086,100,103,139,141,144,145,146,148,150,156,159,166,168,169,170,171,172,173).

    DOCX "không còn {{...}}" KHÔNG đủ. Phải pass F1-F5 trước khi C gate mới có ý nghĩa.

14. Phase G — Legal/Semantic Validation (sau F, trước C):
    semantic-rules.ts với 6 codes: DATE_ORDER | REQUIRED_WHEN | FORMAT | ONE_OF | CASE_STAGE_COMPATIBLE | LEGAL_BASIS_REQUIRED.
    Backend trả { schemaErrors, semanticErrors, contractErrors }.
    UI hiển thị semantic errors theo severity (ERROR đỏ, WARNING vàng).
    Predefined rules auto-inject: DATE_ORDER, REQUIRED_WHEN, CASE_STAGE_COMPATIBLE, LEGAL_BASIS_REQUIRED.
    pnpm audit:form-semantic-validity: 213/213 coverage, 30/30 golden 0 critical ERROR.

15. Phase H split (sửa order):
    H1 + H3a chạy ngay sau F6, trước I (minimal block: drift STALE/MISSING + unreplaced placeholders).
    H2 + H3b chạy sau I (full audit table + full block với schema/semantic/fidelity signals).
    Nếu đặt toàn bộ H sau I sẽ mất mitigation H3a.
    ExportProvenance type: generatedDocumentId, templateCode, sourceId, contractVersionHash,
    rendererVersion, renderEngine, inputHash, resolvedPayloadHash, outputDocxHash, exportedBy, exportedAt, validationStatus, fidelityStatus.
    DB table: document_export_audit_logs.
    Block export khi: contractLookupStatus≠FOUND, schemaErrors>0, semanticErrors.ERROR>0, unreplacedPlaceholders>0.
    Hash: sha256 cho inputHash, resolvedPayloadHash, outputDocxHash.

16. Phase I — Existing Data Migration (sau F6):
    pnpm migrate:generated-documents-snapshot --dry-run (output: scanned/patched/skipped/risky).
    pnpm migrate:generated-documents-snapshot --apply.
    Idempotent: 2nd dry-run → patched=0.
    Preserve unknown sections, never delete legacy data, copy legacy fields into formInputs with audit note.

17. Phase J — Performance, Observability & Rollback (sau H):
    Cache key: templateCode+sourceId+contractVersionHash. Invalidate khi hash đổi/publisher/drift.
    Metrics: form_schema_build_ms, render_docx_ms, contract_lookup_ms, validation_ms,
    docx_output_size_bytes, render_failure_count_by_template, export_blocked_count_by_reason,
    contract_drift_detected_count.
    Rollback: pnpm contracts:rollback --template BM-053 --to <versionHash>.
    Feature flags: FORM_SCHEMA_DYNAMIC_ENABLED, FORM_SCHEMA_DYNAMIC_ALLOWLIST, DOCX_FIDELITY_GATE_ENFORCE.
    Canary: 6 BMs → 30 BMs → 213 BMs.
```

## 10. Open question (carry-over, giảm sau v2.1)

1. `formInputHints.suggestedControls` — dùng cho label override / default value hay bỏ hẳn? **Default**: dùng làm UI hint refinement (label), không cho field existence. Quyết khi execute B1.
2. ~~Có cần thêm BM-053 vào E2 snapshot (legalBasis special case)?~~ **Đã chốt trong v2.1 §10.4**: CÓ, bộ 6 BMs.
3. Có nên thêm `form_contract_versions.source_hash` column hay so sánh qua `compiled_json` hash là đủ? **Default**: bắt đầu bằng compiled_json hash; nếu drift nhiều false-positive → mới thêm column.
