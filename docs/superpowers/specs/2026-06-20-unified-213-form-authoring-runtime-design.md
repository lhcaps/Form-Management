# QLLaw Unified 213-Form Authoring and Runtime Design

## 1. Mục tiêu

Hợp nhất `/documents` và `/admin/form-studio` trên cùng một nguồn dữ liệu biểu
mẫu, để:

- 213/213 biểu mẫu chuẩn có thể mở thiết kế ngay trong Form Studio;
- mỗi thiết kế khởi đầu từ đúng normalized DOCX và contract trích xuất của chính
  mã BM đó;
- trang tạo biểu mẫu và Form Studio hiển thị cùng trạng thái, chất lượng và
  renderer capability;
- draft phục vụ biên tập không bị nhầm với contract production;
- runtime người dùng vẫn chỉ nhận published V2 hoặc locked V1;
- không tuyên bố một biểu mẫu đúng nghiệp vụ/pháp lý chỉ vì extraction hoặc
  automated checks đã chạy.

Thiết kế này sửa tận gốc lỗi `RUNTIME_CONTRACT_NOT_FOUND` khi Form Studio mở
BM-004 và các biểu mẫu draft khác. Nó không hạ gate production và không bật
`DOCUMENT_RENDERER_MODE=active`.

## 2. Định nghĩa “đúng với DOCX”

“Đúng với DOCX” trong platform được chia thành ba mức độc lập.

### 2.1. Package và layout fidelity

- Normalized DOCX của đúng `templateCode` là layout authority.
- Preview và render phải bắt đầu từ chính package DOCX đó, không dựng lại bố
  cục Word bằng HTML hoặc JSX.
- Các package part không liên quan đến binding phải được giữ nguyên.
- `templateHash` của contract phải khớp file normalized DOCX đang dùng.
- Không cho preview, submit review hoặc publish nếu file DOCX bị thiếu, stale
  hash hoặc không đọc được.

Mức này có thể được kiểm chứng tự động bằng package-integrity smoke.

### 2.2. Structural binding fidelity

- Field trong authoring baseline phải bắt nguồn từ `canonicalFields` của đúng
  V1 contract.
- Binding phải trỏ tới `docxSlots` của cùng `sourceId`.
- Slot giữ metadata vị trí trích xuất: part, block và table cell khi có.
- Field tự thêm phải bind vào slot hợp lệ, table loop, computed/default source
  hoặc extension point được đăng ký.
- Compiler chặn slot không tồn tại, binding chéo template, stale source hash,
  loop marker thiếu và field bắt buộc không có nguồn.

Mức này có thể được kiểm chứng tự động về cấu trúc.

### 2.3. Semantic và legal fidelity

- `source=unknown`, `reviewRequired=true`, label hoặc namespace do heuristic đề
  xuất không được coi là đã xác nhận nghiệp vụ.
- Draft V1 được chuyển sang V2 để biên tập nhưng giữ nguyên trạng thái cần
  review.
- Chỉ contract đã human-review mới được gắn grade `LOCKED_VERIFIED`.
- Automated checks không được đổi grade thành verified và không được phát biểu
  biểu mẫu đúng pháp lý.

Mức này cần reviewer đọc DOCX và xác nhận field/binding.

## 3. Nguyên nhân lỗi hiện tại

`AdminFormTemplatesService.clone()` gọi `RuntimeFormContractService.resolve()`.
Runtime resolver chỉ cho phép:

1. agency published V2;
2. global published V2;
3. locked V1 file contract.

Form Studio lại cần đọc cả draft V1 để tạo bản thiết kế. Việc dùng chung resolver
đã ghép nhầm hai lifecycle:

- **authoring lifecycle**: được phép bắt đầu từ extracted draft;
- **runtime lifecycle**: chỉ được phép dùng artifact đã publish hoặc locked.

Do đó BM-004 có normalized DOCX, V1 draft contract, DB template và FE panel
nhưng vẫn bị HTTP 404 khi bấm “Clone cho cơ quan”.

## 4. Kiến trúc đích

```text
Canonical source DOC/DOCX
          |
          v
Normalized DOCX + extracted V1 contract
          |
          +-------------------------------+
          |                               |
          v                               v
AuthoringContractResolver          RuntimeFormContractResolver
locked hoặc draft V1               published V2 hoặc locked V1
          |                               |
          v                               v
Virtual V2 baseline                Normal-user form runtime
          |
          v
Materialize agency draft on demand
          |
          v
Editor -> Review -> Approval -> Published immutable V2
```

Hai resolver có trách nhiệm khác nhau và không gọi lẫn nhau.

## 5. Authoring Contract Resolver

Tạo `AuthoringContractResolver` chuyên dùng cho Form Studio.

### 5.1. Thứ tự resolve

Với `templateCode` và `agencyId`, resolver chọn:

1. agency version đang editable: `DRAFT` hoặc `CHANGES_REQUESTED`;
2. agency version đang `IN_REVIEW` hoặc `APPROVED` để mở read-only;
3. agency published version để tạo version kế tiếp;
4. global published V2;
5. locked V1 file contract;
6. draft V1 file contract;
7. normalized DOCX extraction fallback nếu template import chưa có V1 contract.

Mục 5-7 chỉ tạo **virtual baseline**, chưa ghi DB.

### 5.2. Deterministic virtual baseline

Virtual baseline gồm:

- `templateCode`, title và template identity từ DB;
- `templateHash` và `normalizedDocxPath` từ active template version;
- sections, fields và render bindings từ `adaptV1Contract()`;
- source provenance gồm `sourceId`, V1 status và extraction hash;
- quality grade;
- warnings chưa review;
- renderer capability hiện tại.

Cùng một template/version phải sinh cùng serialized baseline và hash.

Không tạo sẵn 213 agency draft trong database. Khi Editor bấm **Mở thiết kế**:

- nếu đã có editable version, mở version đó;
- nếu chưa có, materialize virtual baseline thành một DB draft revision 0;
- thao tác phải idempotent: double-click hoặc hai request đồng thời không tạo
  hai draft cùng scope.

### 5.3. Quality grade

Mỗi baseline có đúng một grade:

- `LOCKED_VERIFIED`: V1 locked hoặc published V2 đã qua governance.
- `EXTRACTED_NEEDS_REVIEW`: có normalized DOCX và V1 draft contract.
- `GENERIC_FALLBACK`: chỉ có normalized DOCX hoặc extraction tối thiểu.

Grade không đồng nhất với lifecycle status. Một `DRAFT` có thể bắt đầu từ
`LOCKED_VERIFIED`; một `PUBLISHED` agency overlay vẫn giữ provenance về base.

## 6. Unified Form Platform Catalog

Tạo một catalog projection dùng chung cho `/documents` và Form Studio. Catalog
không thay thế các bảng identity hiện tại; nó tổng hợp trạng thái từ:

- `templates` và active `template_versions`;
- V1 file contract repository;
- V2 `form_contract_versions`;
- normalized DOCX inventory;
- FE renderer capability registry.

Mỗi item trả về:

```ts
type FormPlatformCatalogItem = {
  templateId: string;
  templateCode: string;
  title: string;
  stageCode: string | null;

  docx: {
    ready: boolean;
    normalizedPath: string | null;
    templateHash: string | null;
  };

  authoring: {
    status:
      | "NOT_INITIALIZED"
      | "DRAFT"
      | "CHANGES_REQUESTED"
      | "IN_REVIEW"
      | "APPROVED"
      | "PUBLISHED"
      | "ARCHIVED";
    versionId: string | null;
    canOpen: boolean;
    mode: "EDIT" | "READ_ONLY" | "CREATE_VERSION";
  };

  runtime: {
    available: boolean;
    source:
      | "AGENCY_PUBLISHED"
      | "GLOBAL_PUBLISHED"
      | "LOCKED_FILE"
      | "LEGACY_BESPOKE"
      | "GENERIC_FALLBACK"
      | "UNAVAILABLE";
    contractHash: string | null;
  };

  quality: {
    grade:
      | "LOCKED_VERIFIED"
      | "EXTRACTED_NEEDS_REVIEW"
      | "GENERIC_FALLBACK";
    fieldCount: number;
    bindingCount: number;
    unresolvedCount: number;
  };

  renderer: {
    kind: "PUBLISHED_V2" | "BESPOKE" | "GENERIC";
    editableInStudio: boolean;
  };
};
```

### 6.1. Trạng thái hiển thị

Form Studio không được hiển thị `DRAFT` khi chưa có DB version. Nó hiển thị:

- `Chưa khởi tạo`;
- `Đang biên tập`;
- `Cần chỉnh sửa`;
- `Chờ duyệt`;
- `Đã duyệt`;
- `Đã xuất bản`;
- `Đã lưu trữ`.

Quality và lifecycle phải là hai badge riêng.

## 7. Form Studio UX

### 7.1. Catalog actions

Nút chính thay đổi theo catalog item:

- `NOT_INITIALIZED` -> **Mở thiết kế**;
- `DRAFT` hoặc `CHANGES_REQUESTED` -> **Tiếp tục chỉnh sửa**;
- `IN_REVIEW` -> **Xem bản chờ duyệt**;
- `APPROVED` -> **Xem và publish** cho Approver;
- `PUBLISHED` -> **Tạo phiên bản mới**;
- `ARCHIVED` -> **Xem lịch sử**.

Không dùng cụm “Clone cho cơ quan” cho thao tác khởi tạo base standard vì nó
làm người dùng hiểu rằng hệ thống tạo một template identity mới. Identity vẫn là
BM chuẩn; chỉ agency version được tạo.

### 7.2. Editor

Khi mở một extracted baseline:

- canvas hiển thị field của chính V1 contract;
- panel phải hiển thị source provenance và unresolved warning;
- slot picker chỉ cho chọn slot của chính DOCX;
- field labels có thể sửa nhưng original extracted label vẫn có trong diff;
- preview luôn render bằng normalized DOCX của catalog item;
- autosave chỉ bắt đầu sau khi materialize thành DB draft.

Nếu V1 contract chỉ có ít field, UI phải nói rõ “Extraction còn thô” thay vì
trình bày như biểu mẫu hoàn chỉnh.

### 7.3. Review và publish

Giữ four-eyes governance:

- creator không tự approve;
- submitted revision read-only;
- publish chỉ từ `APPROVED`;
- published snapshot immutable;
- draft không xuất hiện ở normal runtime.

## 8. Trang `/documents`

### 8.1. Bỏ hiển thị trùng

Chỉ có một collection biểu mẫu canonical, nhóm theo giai đoạn. Recommendation
engine chỉ:

- thay đổi thứ tự;
- thêm relevance score và lý do;
- cung cấp filter “Phù hợp nhất”.

Không render lại một danh sách “Gợi ý” thứ hai chứa cùng card.

### 8.2. Badge runtime trung thực

Mỗi card hiển thị một runtime badge:

- `Published contract`;
- `Locked verified`;
- `Legacy bespoke`;
- `Generic fallback`;
- `Chưa sẵn sàng`.

Không dùng một nhãn chung “Có thể mở” cho mọi capability.

### 8.3. Quy tắc mở biểu mẫu

- `AGENCY_PUBLISHED` hoặc `GLOBAL_PUBLISHED` -> `ContractV2Renderer`.
- `LOCKED_FILE` -> contract-driven locked runtime.
- `LEGACY_BESPOKE` -> component chuyên biệt hiện có.
- `GENERIC_FALLBACK` -> generic legacy panel, kèm cảnh báo capability.
- Draft authoring tuyệt đối không được dùng ở `/documents`.

Trong giai đoạn chuyển đổi, bespoke renderer được ưu tiên cho mẫu chưa có
published V2 để không làm mất nghiệp vụ đang hoạt động.

## 9. Đánh giá và giảm dư thừa

### 9.1. Giữ lại

- Normalized DOCX và V1 contract: evidence/base authority.
- V2 DB contract: governance và agency customization.
- 145 bespoke components: fallback nghiệp vụ cho tới khi V2 tương ứng đã
  publish và qua một release ổn định.
- 68 generic wrappers: tạm giữ để không phá runtime.

### 9.2. Ngừng coi là bằng chứng chất lượng

- Sự tồn tại của `bm-XXX-form-inputs.tsx` không chứng minh biểu mẫu chi tiết.
- Audit 213 coverage chỉ chứng minh asset/catalog presence.
- `runtimeEligible` của V1 không được dùng để quyết định authoring eligibility.

### 9.3. Loại bỏ dần

- Bảng `BM_PANEL_BY_CODE` viết tay được thay bằng generated capability manifest,
  nhưng chỉ sau khi có audit parity.
- Generic wrapper chỉ xóa sau khi published V2 của cùng BM chạy ổn định.
- Không xóa hàng loạt component trong workstream sửa authoring.

### 9.4. Đổi tên nghiệp vụ

- Sidebar `/templates`: **Duyệt văn bản**.
- Form Studio review: **Duyệt cấu hình biểu mẫu**.

Điều này tách duyệt output document khỏi duyệt contract definition.

## 10. API boundaries

### 10.1. Catalog

```text
GET /form-platform/catalog
GET /form-platform/catalog/:templateCode
```

Normal users nhận runtime fields; Admin có permission nhận thêm authoring
metadata. API vẫn scope theo agency.

### 10.2. Authoring

```text
POST /admin/form-templates/:id/open-design
GET  /admin/form-drafts/:draftId
PATCH /admin/form-drafts/:draftId
```

`open-design` thay cho clone standard form. Import và blank creation vẫn giữ
endpoint riêng.

### 10.3. Runtime

```text
GET /forms/runtime/:templateCode
```

Endpoint này giữ strict behavior. Không fallback sang draft V1.

## 11. Error handling

- `AUTHORING_BASE_NOT_FOUND`: không có V1 contract và không có normalized DOCX.
- `NORMALIZED_DOCX_REQUIRED`: có contract nhưng thiếu DOCX để preview/review.
- `AUTHORING_BASE_STALE`: extraction hash không khớp active DOCX.
- `DRAFT_REVISION_CONFLICT`: optimistic concurrency conflict.
- `RUNTIME_CONTRACT_NOT_FOUND`: chỉ dùng ở normal runtime, không xuất hiện khi
  mở thiết kế nếu authoring base tồn tại.
- `AUTHORING_MATERIALIZATION_CONFLICT`: concurrent open-design; server trả lại
  draft đã thắng thay vì tạo duplicate.

UI hiển thị lỗi kèm action cụ thể: tải lại, chạy normalize, mở draft hiện hữu
hoặc xem validation.

## 12. Đồng bộ 213 biểu mẫu

### 12.1. Baseline coverage

Thêm audit `audit:form-authoring-baselines` chứng minh:

- đúng 213 unique BM codes;
- mỗi code có DB template identity;
- mỗi code có normalized DOCX;
- mỗi code resolve được virtual V2 baseline;
- baseline trỏ đúng sourceId/templateHash;
- field/binding counts khớp V1 adapter;
- duplicate BM-139 được chọn theo canonical source policy và nguồn còn lại vẫn
  được ghi nhận trong provenance.

### 12.2. Quality backlog

Audit xuất matrix theo BM:

```text
BM | DOCX | Base grade | Fields | Bindings | Unknown | Review required |
Bespoke/Generic | Agency status | Runtime source
```

Matrix là backlog review thực, không phải báo cáo “213 hoàn thành”.

### 12.3. Refinement waves

Sau khi 213 baseline mở được, nâng chất lượng theo wave:

1. locked pilots BM-001..003;
2. bespoke high-value forms;
3. forms có field count thấp hoặc generic wrapper;
4. phần còn lại theo stage.

Mỗi BM cần:

- DOCX/source hash parity;
- field và binding review;
- form UI parity;
- sample payload;
- preview smoke;
- reviewer sign-off.

## 13. Testing và acceptance criteria

### Backend

- BM-004 `open-design` trả draft thay vì HTTP 404.
- Runtime resolver của BM-004 vẫn trả 404 khi chưa published/locked.
- 213 catalog items resolve authoring baseline.
- Concurrent `open-design` chỉ tạo một editable agency draft.
- Locked contract được ưu tiên hơn draft duplicate.
- BM-139 canonical source deterministic.
- Draft không được normal-user runtime trả về.

### Frontend

- Form Studio hiển thị `Chưa khởi tạo`, không hiển thị `DRAFT` giả.
- BM-004 mở editor và có đúng field/binding từ V1 adapter.
- Admin thêm field, đổi control, bind slot và autosave.
- Preview dùng đúng normalized DOCX.
- `/documents` chỉ render một canonical collection.
- Recommendation chỉ reorder/filter collection.
- Runtime badge đúng với renderer thực tế.

### Corpus và renderer

- `audit:templates` vẫn đạt 213.
- `audit:form-authoring-baselines` đạt 213/213.
- Preview package không mất parts.
- Không có unresolved placeholder, literal `undefined` hoặc `null`.
- Existing bespoke smoke không regress.
- BM-001 cutover vẫn:

```text
Automated ready: YES
Human approval: NO
Active ready: NO
```

## 14. Phạm vi không làm trong lần sửa nền này

- Không human-approve tự động 210 draft contract.
- Không xóa ngay 213 component.
- Không thay DOCX bằng HTML/WYSIWYG editor.
- Không bật active renderer.
- Không dùng draft authoring như production contract.
- Không tuyên bố 213 biểu mẫu đã đúng pháp lý chỉ từ automated baseline.

## 15. Điều kiện hoàn thành workstream

Workstream hoàn thành khi:

1. Form Studio mở thiết kế được 213/213 mã mà không cần contract locked;
2. mỗi baseline có provenance, quality grade và đúng normalized DOCX;
3. `/documents` và Form Studio dùng chung platform catalog;
4. UI không còn danh sách biểu mẫu lặp và không còn trạng thái gây hiểu nhầm;
5. runtime production vẫn strict;
6. người dùng có thể bắt đầu tinh chỉnh từng biểu mẫu ngay;
7. hệ thống nói rõ mẫu nào đã verified và mẫu nào còn cần review.
