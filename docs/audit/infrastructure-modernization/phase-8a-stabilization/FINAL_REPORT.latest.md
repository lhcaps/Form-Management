# Báo cáo cuối kỳ — Phase 8A — Ổn định hóa kiểm thử xác định & Truy nguyên thay đổi

**STATUS:**
PARTIAL

**STATUS_NOTE:**
Phase 8A đã thực hiện thành công 38 lần chạy lặp lại với thoát mã 0 và 0 ENOENT trên `pnpm test:api`, `pnpm audit:docx-slot-inventory`, các suite tập trung và `pnpm verify:full`/`verify:ci`. Repro nhiễu ENOENT của Phase 7 **không tái tạo được** trong điều kiện Phase 8A kiểm soát (TEMP/TMP/TMPDIR theo tiến trình, chụp stdout/stderr không lọc). Do lỗi không tái tạo, giai đoạn 7 (regression test) và giai đoạn 8 (minimal fix) không phát sinh thay đổi mã nguồn. Trạng thái PARTIAL — không phải PASS — vì tiêu chí PASS yêu cầu root cause được xác nhận kèm regression test trước/sau fix; cả hai đều không áp dụng được khi lỗi không tái tạo.

**REPOSITORY_ROOT:**
`D:/Study/Project/QLLaw-main`

**CURRENT_BRANCH:**
`audit/bm006-visual-fidelity-evidence`

**CURRENT_HEAD:**
`ea3e1c3c53278fad09c8557487ffb1d48d685a65`

**GIT_POLICY:**
`NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR`

**PHASE7_CORRECTIONS:**

* deletion count: **32** (29 API + 3 Web), không phải 35 như Phase 7 đã ghi.
* API deletions: 29 file `apps/api/src/modules/form-studio/...` (xem `FORM_STUDIO_PROVENANCE.latest.json`).
* Web deletions: 3 file `apps/web/src/app/admin/(shared)/form-studio/page.tsx`, `…/permissions/page.tsx`, `apps/web/src/components/form-studio/form-studio-workspace.tsx`.
* form-studio attribution: **MIXED_CHANGE** (xem P7C-03). Các commit xóa tiền-Codex (`1cff7035`, `1206fec8`, `4229df14`) — vì vậy cây làm việc bẩn trước khi Codex chạm vào repo. Codex không xóa các file này.
* filtered wrapper exit interpretation: `Select-Object -First 30` đã đóng sớm pipe, đẩy `4294967295` (Windows abort / SIGPIPE giả lập) — không phải exit code của `verify:ci`. Kết luận Phase 7 rằng wrapper che giấu lỗi là không có cơ sở.
* previous root-cause claims corrected: `audit:docx-slot-inventory` gây ENOENT (H-1) — bác bỏ bởi Sequence B 3/3 cycles pass. Các giả thuyết khác (H-2 đến H-7) — bác bỏ (xem `ROOT_CAUSE.latest.json`).

**FORM_STUDIO:**

* current state: 32 file `apps/.../form-studio/...` bị xóa so với HEAD; `apps/web/src/lib/form-studio-api.ts` còn lại làm compatibility shim trỏ sang `contract-platform-api`. Hai bài test canary (`apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts` + `apps/web/src/lib/form-studio-retirement-guard.test.ts`) đòi hỏi trạng thái xóa này là trạng thái đúng.
* provenance: **MIXED_CHANGE (DELETION_INTENT_DOCUMENTED + PREEXISTING_USER_DELETION)** — ba commit `1cff7035`, `1206fec8`, `4229df14` đều có trước phase infrastructure. Hai retirement guard test bắt buộc. Không có bằng chứng Codex thực hiện việc xóa.
* active references:
  - imports: 0
  - route links: 0 (`/admin/form-studio`, `/admin/form-studio/permissions` đều được guard test blacklist)
  - permission identifiers: 0 (retired controllers bị blacklist bởi `contract-platform-retirement.guard.test.ts`)
  - API clients: chỉ `apps/web/src/lib/form-studio-api.ts` (shim `contract-platform-api`)
  - navigation entries: 0 (`components/layout/nav-items.tsx` không có entry)
  - tests:
    - `apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts`
    - `apps/web/src/lib/form-studio-retirement-guard.test.ts`
    - `tests/e2e/form-studio.spec.ts` (Playwright; trạng thái chạy chưa kiểm chứng)
  - documentation: văn bản còn lại trong script doc vài nơi (xem JSON).
* feature reachability: customer-facing `/admin/form-studio/...` cố ý vắng mặt. Runtime contract resolution (`forms/runtime`) còn chạy được qua `contract-platform/runtime-form-contract.controller.ts`. Compatibility shim bảo toàn import cũ.
* modified by this phase: 0 file form-studio được sửa đổi, tạo mới, hay xóa.
* need user decision: false — không có khôi phục, không xóa thêm.

**BM_CHANGE_CLASSIFICATION:**

* total reviewed: 127 file `apps/web/src/components/documents/bm-XXX-form-inputs.tsx`
* whitespace only: 0
* line ending only: 0
* semantic: **127** (toàn bộ 127 file là `SEMANTIC_UI_CHANGE`)
* unknown: 0
* holdouts affected: 5/12 (`BM-024`, `BM-039`, `BM-041`, `BM-089`, `BM-099`)
* runtimeReady allowlist (BM-001, BM-171) affected: 1 (BM-001, fixture-only `fillCustomerSample()` — comment trong diff tham chiếu `apps/web/src/lib/form-flight/profiles/bm001.ts`, phù hợp với canary pilot). BM-171 không có diff.
* protected route leak: 0 (không file nào tham chiếu `/admin/form-studio`, `FormStudioModule`, hay `form-permissions`).
* behavioral signals: 119 touched data binding, 25 touched save/submit handler, 7 touched date input/format, 0 touched preview/runtime-resolution, 0 touched input onChange/onBlur.
* chi tiết: xem `BM_CHANGE_CLASSIFICATION.latest.{json,md}`.

**REPRODUCTION:**

* pnpm test:api: **3/3 pass, exit 0, 0 ENOENT, 0 fail** (Tests: 704 passed, 704 total)
* inventory then test:api: **3/3 cycles pass** (cả `pnpm audit:docx-slot-inventory` và `pnpm test:api` cùng exit 0 trong 3 cycles liên tiếp)
* focused suites: **24/24 individual runs pass** (8 suites × 3 lần) và **1/1 combined run pass** (8 suites chạy theo thứ tự jest)
* verify:full: **2/2 pass, exit 0** (144.7s, 153.4s)
* verify:ci: **2/2 pass, exit 0** (158.5s, 155.1s)
* order dependency reproduced: **NO** (38 runs, mọi thứ pass bất kể thứ tự, fresh temp root, inventory trước/sau)
* transient failure reproduced: **NO**

**CONFIRMED_ROOT_CAUSE:**
`NOT_REPRODUCED_IN_PHASE_8A_CONDITIONS`

Toàn bộ 7 giả thuyết khả dĩ (H-1 đến H-7) trong `ROOT_CAUSE.latest.json` đều bị bác bỏ bởi ma trận tái tạo. Hai giả thuyết còn lại (U-1: concurrent evidence-apply race; U-2: stale temp dirs từ phiên khác) vẫn plausible nhưng nằm ngoài phạm vi Phase 8A.

**REGRESSION_TEST:**
Không phát sinh. Stage 7 yêu cầu một bài test xác định fail trước và pass sau khi fix. Vì lỗi không tái tạo được trong điều kiện Phase 8A, không có hành vi fail để viết test.

**MINIMAL_FIX:**
Không phát sinh. Stage 8 yêu cầu fix chỉ khi regression test reproduce được. Khi không có regression test, không có fix.

**FILES_CHANGED_BY_THIS_PHASE:**

| path | exact reason | lines added | lines removed |
|------|--------------|-------------|---------------|
| (none) | Phase 8A không sửa đổi bất kỳ file nguồn nào trong repo. | 0 | 0 |

Các file mới (untracked) do Phase 8A tạo ra chỉ nằm trong `docs/audit/infrastructure-modernization/phase-8a-stabilization/`:

* `BASELINE.latest.{json,md}`
* `PHASE7_CORRECTIONS.latest.{json,md}`
* `FORM_STUDIO_PROVENANCE.latest.{json,md}`
* `BM_CHANGE_CLASSIFICATION.latest.{json,md}`
* `REPRODUCTION_MATRIX.latest.{json,md}`
* `TRANSIENT_ARTIFACT_GRAPH.latest.md`
* `ROOT_CAUSE.latest.{json,md}`
* `VALIDATION.latest.{json,md}`
* `FINAL_REPORT.latest.md`
* `logs/phase-8a-*.mjs` (script harness và classifiers)
* `logs/seq-*.json`, `logs/pnpm-*.{json,txt}` (log artifacts)

**VALIDATION:**

Lệnh xác nhận xem `VALIDATION.latest.{json,md}` để biết chi tiết. Tóm tắt:

| command | run id tiêu biểu | exit | duration | result |
|---------|--------------------|------|----------|--------|
| pnpm test:api | run-20260710171627-…-001 | 0 | 51.4s | Tests: 704 passed |
| pnpm test:api | run-20260710171718-…-002 | 0 | 51.1s | Tests: 704 passed |
| pnpm test:api | run-20260710171809-…-003 | 0 | 51.2s | Tests: 704 passed |
| pnpm audit:docx-slot-inventory | run-20260710172411-…-001 | 0 | 0.6s | written |
| pnpm audit:docx-slot-inventory | run-20260710172502-…-003 | 0 | 0.6s | written |
| pnpm audit:docx-slot-inventory | run-20260710172552-…-005 | 0 | 0.6s | written |
| pnpm verify:full | run-20260710172629-…-001 | 0 | 144.7s | chain exit 0 |
| pnpm verify:full | run-20260710172854-…-002 | 0 | 153.4s | chain exit 0 |
| pnpm verify:ci | run-20260710173127-…-003 | 0 | 158.5s | chain exit 0 |
| pnpm verify:ci | run-20260710173406-…-004 | 0 | 155.1s | chain exit 0 |
| representative-bms-render (×3) | …-001, -002, -003 | 0,0,0 | 5.1, 4.6, 4.6 | 36 tests pass |
| docxtemplater-style-profile (×3) | …-004, -005, -006 | 0,0,0 | 4.3, 3.9, 3.9 | pass |
| docxtemplater-bm171-style-profile (×3) | …-007, -008, -009 | 0,0,0 | 4.0, 4.0, 4.0 | pass |
| docx-inspection-rendered-preservation (×3) | …-010, -011, -012 | 0,0,0 | 4.3, 4.4, 4.5 | pass |
| pr6g31-bm001-rendered-docx-parity (×3) | …-013, -014, -015 | 0,0,0 | 4.5, 4.4, 3.9 | pass |
| pr6g31-bm001-shared-mapping-parity (×3) | …-016, -017, -018 | 0,0,0 | 3.1, 3.2, 3.0 | pass |
| pr6g31-bm171-rendered-docx-parity (×3) | …-019, -020, -021 | 0,0,0 | 4.0, 4.4, 4.1 | pass |
| docxtemplater-contract-render-engine (×3) | …-022, -023, -024 | 0,0,0 | 3.8, 3.7, 3.6 | pass |
| 8-suite combined run | …-025 | 0 | 8.6s | 8 suites pass |

**DETERMINISM:**

* focused test consecutive passes: **24 runs** (8 suites × 3 lần) — 100% pass
* API suite consecutive passes: **3 consecutive runs** — 100% pass
* verify:full consecutive passes: **2 consecutive runs** — 100% pass
* verify:ci consecutive passes: **2 consecutive runs** — 100% pass
* unexpected ENOENT: **0** (trên 38 runs)
* leaked processes: **0**
* leaked temp directories: **0** (mỗi run cleanup `qllaw-phase8a-<runId>-*`)

**INVARIANTS:**

* form-studio changed: **0** file form-studio được sửa, xóa, hay tạo mới bởi Phase 8A
* BM files changed: **0** file `bm-XXX-form-inputs.tsx` nào được sửa đổi bởi Phase 8A (modifications trong working tree là pre-Phase 8A)
* DOCX changed: **0** (source DOCX, normalized DOCX đều nguyên)
* contracts changed: **0** (locked JSON và compiled `dist/*` đều nguyên)
* Prisma changed: **0** (schema và migrations nguyên; `prisma/seed.ts` modification là pre-Phase 8A)
* matrix changed: `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md}` nguyên
* holdouts preserved: **12/12** (BM-024, BM-039, BM-041, BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-089, BM-099, BM-200) — `counts.INPUT_CONNECTED_PARTIAL = 12`
* BM006 preserved: `bm-006-form-inputs.tsx` modification là pre-Phase 8A; không có thay đổi mới.
* BM130 preserved: file không nằm trong diff list; không có thay đổi mới.
* runtimeReady preserved: chỉ BM-001 có diff (fixture-only); runtimeReady allowlist concept không bị ảnh hưởng bởi thay đổi nguồn nào từ Phase 8A
* fidelityComplete truth preserved: `fidelityComplete=true` count không thay đổi (Phase 8A không ghi vào matrix)

**GIT:**

* staged: **0** file (`git diff --cached --name-only` trống)
* commit: **không commit**
* push: **không push**
* PR: **không PR**

**REMAINING_RISKS:**

1. **CRIT-02 từ Phase 7** (ENOENT trong chain `verify:full`) — Phase 8A không tái tạo. Rủi ro: có thể vẫn tồn tại khi chạy song song với một consumer khác (U-1 plausible). Phase 8B nên xem xét nếu muốn đóng dứt điểm.
2. **CRIT-03 từ Phase 7** (wrapper che exit code) — đã giải quyết (`verify:full` exit 0 hai lần liên tiếp; lý thuyết 4294967295 là do pipe filter).
3. **Concurrency** — Phase 8A chạy serial; nếu CI hoặc dev session khởi chạy `apply-all-current-evidence.mjs --check` song song với `pnpm test:api` thì có thể thấy U-1.
4. **Stale `qllaw-*` temp dirs** — 80+ dirs không thuộc phase tồn tại trong `$TEMP` sau các phiên trước. Phase 8A không xóa (theo policy). Người dùng có thể clear thủ công nếu cần.
5. **Web-unit tests** nằm ngoài phạm vi Phase 8A (chỉ tập trung API/test infra).

**NEED_USER_DECISION:**

Cần quyết định người dùng:

1. Có nên chạy `pnpm verify:ci` thêm 2 lần nữa trong Phase 8A để thắt chặt CONFIDENCE trên sequence D, hay đủ rồi?
2. Có nên để Phase 8B điều tra U-1 (concurrent evidence-apply race) và U-2 (stale qllaw-* cleanup) hay là đã chấp nhận là "không thể tái tạo"?

**PHASE_8B_READINESS:**
`READY`

Lý do: Phase 8B chỉ cần xử lý (a) disposable fresh-DB migration classification, (b) isolated Docker build/boot, (c) throttling classifier verification, (d) font policy, (e) apply-mode evidence idempotence. Phase 8A đã chứng minh:
- `pnpm verify:full` deterministic (2/2 exit 0)
- `pnpm verify:ci` deterministic (2/2 exit 0 — chain cuối cùng chạy `apply-all-current-evidence.mjs --check`)
- 38 jest invocation với exit 0
- Không có ENOENT bất ngờ

Các tiêu chí PASS của Phase 8A không đạt hoàn toàn vì root cause ENOENT không tái tạo, nhưng trạng thái còn lại đủ vững để Phase 8B bắt đầu.

**NEXT_PHASE:**
Phase 8B chỉ nên bao gồm:
* disposable fresh-DB migration classification
* isolated Docker build/boot
* throttling classifier verification
* font policy
* apply-mode evidence idempotence

Trước khi Phase 8B khởi động, người dùng có thể muốn:
* Xem lại `PHASE7_CORRECTIONS.latest.md`, `FORM_STUDIO_PROVENANCE.latest.md`, `BM_CHANGE_CLASSIFICATION.latest.md`, `REPRODUCTION_MATRIX.latest.md`, `ROOT_CAUSE.latest.md`, `TRANSIENT_ARTIFACT_GRAPH.latest.md`, `VALIDATION.latest.md` để xác nhận.
* Quyết định xem có cần thêm run `verify:ci` hay không (xem `NEED_USER_DECISION`).
* Không cần `git add`, `commit`, hay `push` ở điểm này — theo Git Policy tuyệt đối của Phase 8A.