# Báo cáo cuối — Production Infrastructure Modernization

STATUS:

PARTIAL

STATUS_NOTE:

Các thay đổi hạ tầng trong phạm vi được phép đã được triển khai và các gate tĩnh, test/build, audit evidence, image probe, web runtime và DOCX→PDF probe đều có bằng chứng thực thi. Không thể kết luận `PASS` cho production runtime vì fresh MariaDB dừng tại Prisma `P3018` / MariaDB `1060` ở migration `20260616000000_add_officials_role`; sửa lịch sử migration đang áp dụng cần quyết định của chủ hệ thống. Times New Roman cũng chưa có trong image và đang resolve sang Liberation Serif, nên chính sách font production cần quyết định/license riêng. Hai phần này không bị che bằng skip hoặc PASS giả.

REPOSITORY_ROOT:

`D:/Study/Project/QLLaw-main`

CURRENT_BRANCH:

`audit/bm006-visual-fidelity-evidence`

CURRENT_HEAD:

`ea3e1c3c53278fad09c8557487ffb1d48d685a65`

REMOTE_MAIN_HEAD:

`12749f1fefaca7e63e1f0df7cf5c0d5b19f126f4`

GIT_POLICY:

NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR

BASELINE:

- modified: 208 tracked paths.
- untracked: 1,232 paths.
- staged: 0 paths.
- tool versions: Windows 10.0.26200 x64; PowerShell 5.1.26100.8655; Node v22.23.1; pnpm 10.33.2; Git 2.54.0.windows.1; Docker client/server 29.5.3; Compose v5.1.4.

ARCHITECTURE_SUMMARY:

Hệ thống vẫn là pnpm monorepo NestJS 11 + Next.js 16 + Prisma 6 + MariaDB 11. Clerk xác thực danh tính; DB officials/auth identities/permissions quyết định quyền nghiệp vụ. `/templates/:templateCode` tiếp tục dùng runtime preview session tạm thời với `persisted=false`; `/documents/:id` tiếp tục là generated-document workspace có DB/audit. DOCX locked/compiled là tài sản runtime được đóng gói chính xác 213/213. Evidence pipeline dùng canonical matrix, reducer bảo toàn field do apply sở hữu, và orchestrator có preflight, lock, timeout, rollback, check/apply-existing tách biệt. Production API nạp env theo platform-first, chạy non-root, đợi DB rồi fail-closed tại `prisma migrate deploy`; web chạy Next trực tiếp làm PID 1.

P0_BLOCKERS_FOUND:

6: evidence reducer/orchestrator làm mất evidence; CRLF entrypoint; thiếu runtime contracts; sai env precedence; Docker context quá rộng; migration history xung đột trên blank DB.

P0_BLOCKERS_RESOLVED:

5 (`INFRA-P0-001` đến `INFRA-P0-005`): canonical giữ 201/12 và downstream evidence; entrypoint LF; image có đúng 213 locked + 213 compiled; production env không bị repo env ghi đè; context giảm từ khoảng 330 MB xuống khoảng 1.25 MB.

P0_BLOCKERS_REMAINING:

1 (`INFRA-P0-006`, `NEED_USER_DECISION`): baseline migration đã chứa `officials.role`, nhưng migration `20260616000000_add_officials_role` tạo lại cột và thất bại trên MariaDB sạch. Không sửa migration đã áp dụng khi chưa đối chiếu `_prisma_migrations` và schema của mọi môi trường persistent.

ROOT_CAUSES:

- Evidence reducer coi một số field promotion là base field và bỏ top-level apply summary; apply-all trước đây trộn selector/smoke/browser collector với bước apply-existing và thiếu transaction/timeout.
- Shell entrypoint có CRLF; Docker runner thiếu governed contract corpus/seed dependencies; `.dockerignore` tụt sau các đường dẫn auth/temp/evidence.
- Env được load ở nhiều lớp với `override=true`; platform/container value có thể bị ghi đè.
- Init migration đã fold các thay đổi sau đó nhưng migration additive cũ vẫn chạy lại.
- Một gate dùng tuổi report theo wall-clock thay vì provenance nội dung; hardcode audit không phân biệt detector cố ý với runtime default.
- Import storage chấp nhận absolute/traversal path và Multer chưa chặn kích thước trước khi ghi.
- Runtime images chạy root, DB public port, thiếu health dependency/shutdown semantics; CI trước đây mới chứng minh build.
- Image chỉ có font redistributable; Times New Roman proprietary không được phép tự tải.

EVIDENCE_RECONCILIATION:

- totalForms: 213.
- inputConnectedPass: 201.
- inputConnectedPartial: 12 (`BM-024`, `BM-039`, `BM-041`, `BM-049`, `BM-050`, `BM-051`, `BM-077`, `BM-079`, `BM-082`, `BM-089`, `BM-099`, `BM-200`).
- browserVerified: 201 `true`, 0 `false`, 12 không được promote/không suy diễn.
- evidence inconsistencies found: 3 nhóm — reducer làm mất 24 source/render promotions (201/12 thành 177/36), canonical bỏ 124 browser rows đã có artifact, và apply summaries/timestamps làm orchestration không idempotent.
- evidence inconsistencies resolved: 3/3 bằng preservation semantics, artifact preflight, transactional apply-existing và check mode; không chạy lại browser collector, không tạo evidence giả. `fidelityComplete=true` vẫn là 0.

INFRASTRUCTURE_CHANGES:

- Chuẩn hóa bootstrap/config: platform env thắng, production bỏ qua repo env, `API_PORT` rồi `PORT`, shutdown hooks.
- Request completion log chỉ ghi requestId/method/route/status/duration; CORS expose request/rate-limit headers.
- Import paths fail-closed trong storage root; upload giới hạn 50 MiB trước disk write.
- Contract sync guard và slot inventory deterministic/provenance-based; 213/213 templates, 2,497 slots/bindings/canonical.
- Evidence orchestration có lock, rollback, bounded child process, preflight và semantic/byte idempotence.

CI_CHANGES:

- `verify:quick`, `verify:full`, `verify:ci`, `dev:doctor`, `docker:verify` tạo command surface thống nhất.
- GitHub Actions có concurrency cancellation, timeout, frozen install, deterministic CI verification, Docker image verification và artifact upload.
- Locked-contract CI chỉ chấp nhận đúng debt `BM-006:EXTRACTION_HASH_MISMATCH`; strict/default và allowlist sai vẫn fail. Acknowledgment này không phải production-readiness waiver.

DOCKER_CHANGES:

- LF entrypoint được enforce; DB wait/migrate/seed fail-closed; seed opt-in và mặc định `false`.
- API/web chạy `USER node`, `no-new-privileges`, drop capabilities, có healthcheck/stop grace; MariaDB không publish host port.
- API image chứa đúng governed assets; LibreOffice chạy qua wrapper có profile riêng và timeout.
- Web dùng direct Node/Next PID 1; image probes tìm image theo Compose labels tương thích Compose v5.
- `.dockerignore` loại auth state, secrets, cache, temp/evidence bulk nhưng vẫn giữ runtime assets cần thiết.

RUNTIME_RELIABILITY_CHANGES:

- Web `/healthz` trả HTTP 200 sau 535 ms và nhận SIGTERM, dừng trong 316 ms (exit 143 theo signal, không OOM/forced timeout).
- API có shutdown hooks và readiness healthcheck trong image, nhưng cold boot/readiness/shutdown thực tế giữ `NOT_RUN` vì entrypoint dừng đúng tại migration blocker.
- BM-001 shadow-render chạy 5 scenarios; DOCX→PDF thực tế tạo PDF 73,099 byte bằng LibreOffice 7.4.7.2.

SECURITY_CHANGES:

- Production env không đọc file local; không log secret/value; request log không chứa body/cookie/token.
- Import storage containment và pre-write size cap.
- Non-root containers, internal DB, capability drop, `no-new-privileges`, health-gated dependency.
- Seed user/test data là opt-in; không có password mặc định `tester123`.
- High-confidence private-key/live-token scan trên 81 file task-scoped: 0 findings; placeholder trong env/CI example không được coi là credential thật.

DEVELOPER_EXPERIENCE_CHANGES:

- `dev:doctor` báo tool/env/path readiness theo SET/UNSET, không in giá trị.
- Runbook mới cho production Docker, developer verification, DB backup/restore và rollback.
- Audit reports có JSON + Markdown; command ordering được đóng gói thay vì yêu cầu nhớ thủ công.

PERFORMANCE_BEFORE_AFTER:

| Metric | Before | After | Diễn giải |
|---|---:|---:|---|
| Typecheck | 5.959 s | 7.116 s | PASS → PASS; khác biệt host/cache. |
| Lint | 89.830 s | 24.837 s | PASS → PASS; cache-sensitive. |
| Test | 51.576 s, 1 stale-report failure | 17.774 s | 103 contracts + 704 API + 763 Node + 1,427 web. |
| Build | 63.694 s | 24.910 s | PASS → PASS; 17 Next routes. |
| Docker context | ~330 MB | ~1.25 MB | giảm khoảng 99.621%; số Docker progress được làm tròn. |
| API image | 601,984,503 B | 554,341,140 B | giảm 47,643,363 B / 7.914%. |
| Web image | 355,553,407 B | 355,562,537 B | tăng 9,130 B / 0.003%. |
| Web readiness | NOT_MEASURED | 535 ms | HTTP 200. |
| Web SIGTERM | baseline runtime fail | 316 ms | signal stop, không forced timeout. |
| BM-001 PDF | NOT_MEASURED | 1.084 s | 73,099 bytes. |

Docker build 90.023 s baseline no-cache và 73.762 s final warm/incremental không phải so sánh cùng điều kiện; không dùng số này để claim speedup.

FILES_CHANGED_BY_THIS_TASK:

Mỗi dòng có dạng `path | reason | user-existing-change-preserved`.

| path | reason | user-existing-change-preserved |
|---|---|---|
| `.ai/harness/project_failure-log.md` | ghi failure/reproduction theo harness | YES — append, không reset nội dung cũ |
| `.dockerignore` | thu nhỏ và bảo vệ build context | YES — patch cục bộ |
| `.env.docker.example` | mẫu env production/seed an toàn | YES — không ghi secret thật |
| `.env.example` | tài liệu biến config mới | YES — không ghi secret thật |
| `.gitattributes` | enforce LF cho shell scripts | YES — patch cục bộ |
| `.github/workflows/ci.yml` | deterministic CI + Docker verification artifacts | YES — patch cục bộ |
| `apps/api/prisma/seed.ts` | seed opt-in/safe profile | YES — không sửa schema/migration/data persistent |
| `apps/api/src/app.module.ts` | single env-loading policy | YES — patch cục bộ |
| `apps/api/src/common/request-context.middleware.spec.ts` | regression cho completion metadata | YES — patch cục bộ |
| `apps/api/src/common/request-context.middleware.ts` | bounded completion logging | YES — patch cục bộ |
| `apps/api/src/infrastructure/config/app-config.service.spec.ts` | env/port/seed safety tests | YES — patch cục bộ |
| `apps/api/src/infrastructure/config/app-config.service.ts` | API_PORT/PORT và production safety | YES — patch cục bộ |
| `apps/api/src/infrastructure/config/load-api-environment.spec.ts` | platform-first env regression | YES — file task-scoped, no destructive rewrite |
| `apps/api/src/infrastructure/config/load-api-environment.ts` | central local-only dotenv loader | YES — file task-scoped, no destructive rewrite |
| `apps/api/src/main.ts` | dynamic module import, shutdown hooks, exposed headers | YES — patch cục bộ |
| `apps/api/src/modules/documents/rendering/infrastructure/docx-slot-inventory.spec.ts` | provenance-based deterministic gate | YES — patch cục bộ |
| `apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.spec.ts` | missing/empty corpus regression | YES — patch cục bộ |
| `apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts` | fail-closed runtime asset guard | YES — patch cục bộ |
| `apps/api/src/modules/imports/imports.module.ts` | Multer 50 MiB limit | YES — patch cục bộ |
| `apps/api/src/modules/imports/imports.service.ts` | storage API alignment | YES — patch cục bộ |
| `apps/api/src/modules/imports/import-storage.service.spec.ts` | traversal/absolute-path regression | YES — file task-scoped, no destructive rewrite |
| `apps/api/src/modules/imports/import-storage.service.ts` | path containment | YES — patch cục bộ |
| `apps/api/src/seed/seed-config.spec.ts` | seed opt-in/default regression | YES — file task-scoped, no destructive rewrite |
| `apps/api/src/seed/seed-config.ts` | seed config seam | YES — file task-scoped, no destructive rewrite |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | bỏ duplicate hardcode literal khỏi runtime copy/comment | YES — behavior/route contract giữ nguyên |
| `apps/web/src/lib/form-flight/bm001-second-pilot.test.ts` | đồng bộ expected runtime-ready evidence | YES — test-only patch |
| `apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs` | đồng bộ approved BM-001 profile | YES — test-only patch |
| `apps/web/src/lib/form-flight/profile-status.test.ts` | giữ allowlist BM-001/BM-171 | YES — test-only patch |
| `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` | đồng bộ canonical demo payload | YES — không promote form mới |
| `apps/web/src/lib/runtime-ux/index.ts` | bỏ explanatory detector literal duplication | YES — behavior giữ nguyên |
| `docker/api.Dockerfile` | non-root, assets, healthcheck, LO/fonts | YES — patch cục bộ |
| `docker/api-entrypoint.sh` | LF, migrate/seed fail-closed, exec PID 1 | YES — patch cục bộ |
| `docker/libreoffice-wrapper.sh` | bounded isolated conversion profile | YES — file task-scoped, no destructive rewrite |
| `docker/web.Dockerfile` | non-root healthcheck và direct Next PID 1 | YES — patch cục bộ |
| `docker-compose.prod.yml` | internal DB, health dependencies, security/seed policy | YES — patch cục bộ |
| `docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md` | generated current locked audit | YES — report only, contracts untouched |
| `docs/audit/docx-slot-inventory/latest.json` | deterministic 213 inventory evidence | YES — derived artifact only |
| `docs/audit/docx-slot-inventory/latest.md` | human-readable inventory evidence | YES — derived artifact only |
| `docs/audit/infrastructure-modernization/ARCHITECTURE_MAP.latest.md` | current architecture/boundary map | YES — unrelated history untouched |
| `docs/audit/infrastructure-modernization/BASELINE.latest.json` | immutable machine baseline | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/BASELINE.latest.md` | immutable human baseline | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/BASELINE_COMMANDS.latest.json` | baseline command evidence | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/BASELINE_COMMANDS.latest.md` | baseline command summary | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/BLOCKER_REGISTER.latest.json` | exact blocker reproduction/root cause | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/BLOCKER_REGISTER.latest.md` | blocker overview | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/docker-probe.env.example` | isolated non-secret probe config | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/docker-probe.override.yml` | disposable probe topology | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/IMPLEMENTATION_PLAN.latest.md` | scoped execution/rollback plan | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/PERFORMANCE_BASELINE.latest.json` | machine-readable metrics | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/PERFORMANCE_BASELINE.latest.md` | before/after metrics | YES — new task deliverable |
| `docs/audit/infrastructure-modernization/FINAL_REPORT.latest.md` | required Vietnamese final report | N/A — new task deliverable |
| `docs/audit/sot-gates-v1/latest.json` | refreshed source-of-truth gate evidence | YES — derived artifact only |
| `docs/audit/sot-gates-v1/latest.md` | refreshed source-of-truth gate summary | YES — derived artifact only |
| `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json` | reconciled canonical evidence | YES — 201/12 and downstream fields preserved |
| `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md` | reconciled matrix summary | YES — 201/12 preserved |
| `docs/operations/DATABASE_BACKUP_RESTORE.md` | backup/restore/decision runbook | YES — unrelated docs untouched |
| `docs/operations/DEVELOPER_VERIFICATION.md` | command surface/runbook | YES — unrelated docs untouched |
| `docs/operations/PRODUCTION_DOCKER_RUNBOOK.md` | deploy/health/rollback/font guidance | YES — unrelated docs untouched |
| `package.json` | unified verification/doctor/Docker scripts | YES — lockfile untouched |
| `scripts/audit/apply-all-current-evidence.mjs` | transactional apply/check orchestrator | YES — patch cục bộ |
| `scripts/audit/audit-docx-slot-inventory.mjs` | deterministic provenance inventory | YES — patch cục bộ |
| `scripts/audit/status-matrix-213.mjs` | preserve apply-owned evidence | YES — patch cục bộ |
| `scripts/audit/status-matrix-preserves-evidence.guard.test.mjs` | preservation/idempotence regression | YES — patch cục bộ |
| `scripts/audit-form-authoring-baselines.mjs` | deterministic baseline compatibility | YES — patch cục bộ |
| `scripts/audit-runtime-hardcodes.mjs` | fail-closed exact path/count detector | YES — patch cục bộ |
| `scripts/dev-doctor.mjs` | non-secret local diagnostics | YES — file task-scoped, no destructive rewrite |
| `scripts/dev-healthcheck.mjs` | bounded readiness diagnostics | YES — patch cục bộ |
| `scripts/docker-verify.mjs` | Compose v5 image resolution + image/PDF probes | YES — file task-scoped, no destructive rewrite |
| `scripts/docx-contract/verify-locked-contracts.mjs` | explicit exact BM-006 debt policy | YES — strict mode giữ fail-closed |
| `test/bm096-single-candidate-apply.test.mjs` | stale historical count expectation fix | YES — additive compatibility |
| `test/bm096-single-candidate-review.test.mjs` | stale historical count expectation fix | YES — additive compatibility |
| `test/bm213-form-inputs.test.mjs` | current canonical count expectation | YES — holdouts giữ nguyên |
| `test/ci-reproducibility.test.mjs` | deterministic CI surface regression | YES — patch cục bộ |
| `test/form-authoring-baselines.test.mjs` | deterministic baseline regression | YES — patch cục bộ |
| `test/infrastructure/api-runtime-safety.guard.test.mjs` | env/log/import/seed safety guard | YES — new task guard |
| `test/infrastructure/developer-command-surface.guard.test.mjs` | package/CI/docs command guard | YES — new task guard |
| `test/infrastructure/evidence-orchestrator.guard.test.mjs` | lock/rollback/no-live-collector guard | YES — new task guard |
| `test/infrastructure/production-runtime.guard.test.mjs` | Docker/runtime/LF/security guard | YES — new task guard |
| `test/infrastructure/runtime-hardcode-audit.guard.test.mjs` | exact detector negative regression | YES — new task guard |
| `test/remediation-leak-batch-2a.test.mjs` | current canonical preservation semantics | YES — additive compatibility |
| `test/semantic-evidence-baseline-gate.test.mjs` | current evidence baseline semantics | YES — additive compatibility |

Generated `.codegraph/*`, `apps/web/next-env.d.ts`, `apps/web/tsconfig.tsbuildinfo`, build output, temp render output và Docker layers không được tính là source files changed by this task.

VALIDATION_COMMANDS:

| command | exit code | duration | result |
|---|---:|---:|---|
| `pnpm typecheck` | 0 | 7.116 s | PASS |
| `pnpm lint` | 0 | 24.837 s | PASS |
| `pnpm test` | 0 | 17.774 s | PASS: 103 contracts, 704 API, 763 Node, 1,427 web |
| `pnpm build` | 0 | 24.910 s | PASS: API/contracts + 17 Next routes |
| `pnpm verify:full` | 0 | 137.529 s | PASS |
| `pnpm verify:ci` | 0 | 60.023 s | PASS với BM-006 debt được acknowledge chính xác, không phải fidelity PASS |
| focused five web files | 0 | 0.830 s | PASS 77/77 |
| `node scripts/docx-contract/verify-locked-contracts.mjs` | 1 | bounded | EXPECTED FAIL: BM-006 mismatch còn hiện hữu |
| verifier với allowlist sai | 1 | bounded | EXPECTED FAIL: fail-closed |
| verifier với exact `BM-006:EXTRACTION_HASH_MISMATCH` | 0 | 0.659 s | PASS acknowledgement policy |
| `pnpm docker:verify -- --build` | 0 | 73.762 s | PASS image/assets/non-root/LO/font/BM-001 PDF probes |
| BM-001 shadow render | 0 | 0.907 s | 5 package PASS; semantic 1 PASS, 4 WARN, 0 FAIL |
| direct BM-001 PDF conversion | 0 | 1.084 s | PDF 73,099 bytes |
| disposable blank-DB `prisma migrate deploy` | 1 | 6.954 s | EXPECTED BLOCKER: P3018 / MariaDB 1060; probe resources cleaned |
| isolated web readiness + SIGTERM probe | 0 | 1.055 s total | HTTP 200; ready 535 ms; stop 316 ms |
| task-scoped secret/artifact/hash probe | 0 | 6.590 s | 0 high-confidence secret files; 4/4 JSON parsed; 81 report file rows; forbidden paths untouched |
| named final invariant assertions | 0 | 0.551 s | PASS 23/23; staged 0; exact holdouts/allowlist/hashes/probe cleanup |

DOCKER_VERIFICATION:

- build: PASS — final verifier exit 0; API image 554,341,140 B (`User=node`), web image 355,562,537 B (`User=node`), context khoảng 1.25 MB.
- boot: PARTIAL — web boot proven; API entrypoint reaches migration and then fails closed at known P0 migration blocker.
- migrations: NEED_USER_DECISION — blank DB deploy fails P3018/1060; second deploy, seed-twice và API restart không chạy.
- readiness: web PASS; API NOT_RUN vì Nest chưa được start sau migration failure.
- web smoke: PASS — `/healthz` HTTP 200 sau 535 ms.
- shutdown: web PASS (SIGTERM 316 ms, exit 143 by signal, no forced timeout); API NOT_RUN.

INVARIANTS:

- standalone/persisted boundary preserved: YES; không đổi public route/persisted semantics.
- source DOCX mutated: NO by this task.
- normalized DOCX mutated: NO by this task; BM-006 SHA-256 giữ `b83c42ad854f5cd4e08bc8f901389be0ee17c1401c4e42a309016154bd399f56`.
- locked contracts mutated: NO by this task; chỉ copy/read/audit corpus.
- compiled contracts mutated: NO by this task; chỉ copy/read/audit corpus.
- DB data mutated: NO user/persistent DB; chỉ disposable isolated Docker DB probe, không publish DB port.
- Prisma schema mutated: NO; SHA-256 giữ `057375956a72fe40e11e0950c4126c4827e05824714a881f9de9ea0826e6022b`.
- migrations created: NO; migration directory không bị task sửa.
- holdouts preserved: YES; đúng 12 code nêu trên còn PARTIAL.
- BM006 KEEP preserved: YES; không sửa calibration/source/normalized/contract và không nâng fidelity.
- runtimeReady allowlist preserved: YES; chỉ `BM-001` + `BM-171`.
- fidelityComplete truth preserved: YES; 0/213 true, không global claim.
- canonical matrix hashes: JSON `8599db87d01cfd92a7136f9d255a3496265c9e05ec422682840fa36abfdc70eb`; Markdown `c63aa6091b5fd53e86cf8c76ba6a034e7ffa5288eb4263b80198c5902faebff1`.

GIT:

- files staged: 0.
- commit created: NO.
- pushed: NO.
- PR opened: NO.
- final working tree snapshot: 247 tracked changed, 1,260 untracked, 1,507 porcelain entries; toàn bộ vẫn local và user-owned.

REMAINING_RISKS:

- Chưa có full API cold boot/readiness/latency/restart/shutdown và seed-twice vì migration history blocker.
- Sửa migration cũ có thể làm lệch checksum ở môi trường đã deploy; không được chọn chiến lược chỉ dựa trên blank DB.
- Liberation Serif có thể thay đổi pagination/line wrap so với Times New Roman trong tài liệu pháp lý.
- Legacy import DB rows chứa absolute path có thể bị fail-closed và cần migration/compatibility pass riêng.
- Bind-mount ownership trên Linux production phụ thuộc operator UID/GID; runbook đã ghi cách kiểm tra.
- BM-006 extraction hash mismatch vẫn là debt hiển thị rõ; không đồng nghĩa fidelity complete.

NEED_USER_DECISION:

1. Database migration history: cung cấp/cho phép đối chiếu `_prisma_migrations` + schema của từng persistent environment, rồi chọn một trong các chiến lược được review: baseline/resolve cho môi trường mới, forward corrective migration, hoặc kế hoạch migration-history normalization. Không sửa các migration đã áp dụng trước quyết định này.
2. Licensed font policy: phê duyệt font hợp pháp và cách đưa vào production (secret/bind mount hoặc private build asset), hoặc chấp nhận rõ Liberation Serif fallback cùng sai khác layout. Không tự tải Times New Roman.

NEXT_RECOMMENDED_PHASE:

Sau khi quyết định migration và font: chạy lại isolated full-stack `build -> blank migrate deploy -> migrate deploy lần 2 -> seed lần 1/2 -> API/web health/readiness -> representative API latency -> restart -> SIGTERM -> cleanup`, sau đó cập nhật blocker register/performance/final report. Chỉ khi chuỗi này có bằng chứng xanh mới quay lại phase biểu mẫu tiếp theo; không promote 12 holdout, BM-006 hoặc runtimeReady trong phase hạ tầng.
