# QLLAW Phase 8B - Báo cáo hoàn tất

STATUS:
`PARTIAL`

STATUS_NOTE:
Tất cả gate kỹ thuật đã thực thi đều PASS: baseline mới, mô phỏng chuyển đổi E1/E2/E3, fresh migration, Docker build/boot, verifier, idempotence, full validation và invariant. Tuy nhiên không được tuyên bố production-ready vì 9 biểu mẫu chưa có bằng chứng throttling hợp lệ (`UNVERIFIED`), ảnh runtime không có Times New Roman và đang fallback sang Liberation Serif, cơ sở dữ liệu thật chưa được operator phê duyệt chuyển metadata, và fresh production database cần quy trình bootstrap contract-governance được duyệt.

REPOSITORY:
* root: `D:\Study\Project\QLLaw-main`
* branch: `audit/bm006-visual-fidelity-evidence`
* HEAD: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`

GIT_POLICY:
`NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR`

CONTEXT_CONSUMED:
* authoritative files read: attachment master task; root `AGENTS.md`; Stage 4A final/corrections, fresh probe, ownership ledger, additive replay, Git provenance, remediation options, gate design, Phase 8A corrections; current Prisma schema/migrations; Docker entrypoint/verifier; package scripts; CI; canonical matrix, browser evidence and protected-invariant artifacts.
* raw logs read: dependency replay, candidate/fresh DB, transition/persistent snapshots, migration gate, Docker API/Web build, Docker boot, and the exact evidence needed to resolve inconsistent or missing report fields.
* context deliberately skipped: recursive reading of unrelated `docs/audit/**`, application/business rows, unrelated dirty-tree implementation, secrets, and stale reports not needed to decide a gate.

MIGRATION_FORENSICS:
* corrected duplicate count: `12 UNGUARDED_DUPLICATE`; guarded duplicates `2`; ledger keys `34`; duplicate keys `0`.
* dependency-aware results: contract-platform sequence `VALID_WITH_PREREQUISITES`; identity sequence `VALID_WITH_PREREQUISITES`.
* confirmed defects: old chain is not fresh-install safe; `init_schema` already owns later additive objects, producing Prisma `P3018` / MariaDB `1060`; ledger also contains `2 DEFINITION_CONFLICT` and `2 ORDER_DEPENDENT` objects. Category totals: init `1`, unguarded duplicate `12`, guarded duplicate `2`, additive `12`, order-dependent `2`, definition-conflict `2`, no-op `3`, unknown `0`.

CANDIDATE_BASELINE:
* Prisma version: `6.19.3`.
* generation command: `pnpm --filter api exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output <phase8b>/stage4b-candidate/000000000000_squashed_baseline/migration.generated.sql`.
* generated hash: `a8be201236a362adacbffeb4bd905db10942b54a9ed1a98ba8ec09b68b26efb7`.
* final candidate hash: `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`.
* custom SQL retained: `auth_identities.updated_at DATETIME(0) ... ON UPDATE CURRENT_TIMESTAMP(0)` plus source/reason comment.
* bootstrap data retained: none; historical blanket permission insert is obsolete for a fresh database and authorization is role-owned.
* unresolved deltas: material baseline unknowns `0`; three legacy populated-row transforms remain operator-visible transition concerns; persistent DB retains two compatible `DEFAULT 'GLOBAL'` clauses that the datamodel/candidate omit.

FRESH_DB:
* initially empty: yes, `0` user tables.
* first deploy: exit `0`.
* second deploy: exit `0`.
* status: exit `0`.
* failed migration rows: `0`.
* schema parity: PASS; empty Prisma diffs; `39` application tables, `482` columns, `194` physical indexes, `64` foreign keys; custom timestamp behavior PASS.

PERSISTENT_DB_READONLY:
* inspected: yes, metadata/structure only in `READ ONLY`; MariaDB `11.8.8`, `40` tables including migration metadata, `490` columns, `195` indexes, `64` FKs, `15` migration rows / `13` names. Structural probe application rows read `0`; the separate accidental read-only contract-sync comparison is disclosed under remaining risks.
* schema parity: bounded `SCHEMA_DIFFERENCE`; only `form_contract_versions.scope_key` and `official_permissions.scope_key` retain `DEFAULT 'GLOBAL'`.
* migration metadata state: healthy, active failed rows `0`, historical rolled-back attempts `2`; after local squash the expected filesystem/database name divergence remains until an authorized metadata transition.
* persistent mutation: `NO`; final structure hash `1ea4e8e74fc4273b52c373937619141ea865ac7219f4d7977e8048c6f51bf2ae` and metadata hash `c526a1cdaa2c534a4758fc3d1e0884ef75f241a402bb06c0c57d8ce4c37b1f11` equal their pre-task values.

TRANSITION_SIMULATION:
* E1: PASS; resolve baseline as applied, status/deploy `0`, legacy rows retained, no app-schema mutation.
* E2: PASS; first resolve the active failed legacy row as rolled back, then resolve baseline; incorrect order is correctly blocked by `P3009`.
* E3: PASS; incomplete successful legacy metadata plus complete schema transitions with one baseline resolution, status/deploy `0`.
* metadata operations required: current persistent state follows E1 if approved: backup, maintenance window, verify exact diff/hash, `migrate resolve --applied 20260711000000_squashed_baseline`, status, deploy twice. Never delete legacy rows.
* schema mutation: none in all simulations; baseline SQL must never be applied directly to the populated existing schema.
* verdict: `TRANSITION_GO` for a future operator-approved metadata transition; no live transition executed.

ACTIVE_BASELINE:
* implemented: yes, `apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql`.
* old history archived: yes, all `13` migration directories under the Phase 8B report archive.
* archive verified: `13/13` source/archive/backup hashes match; manifest hash `e06cdde9ae8effce94bf61987ff0ea3cc2ed45789ed18cde98802f350ebc16c5`.
* active migration count: `1`.
* active baseline hash: `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`, byte-identical to candidate.
* rollback tested: yes, `13/13` archived files restored and active baseline reinstalled in an OS-temp rehearsal; live tree not disturbed.

MIGRATION_GATE:
* script: `scripts/audit/migration-regression-gate.mjs`.
* focused test: `test/migration-regression-gate.test.mjs`; combined gate/CI suite `7/7` PASS.
* first deploy: exit `0`.
* second deploy: exit `0`.
* status: exit `0`; failed rows `0`; empty diff; no leftovers.
* CI integration: one independent Ubuntu job, Node 22, pnpm 10.33.2, frozen install, 15-minute timeout, direct fail-closed invocation, `if: always()` artifact upload, no `continue-on-error`.

DOCKER_BUILD:
* API: PASS, no-cache, `88,894 ms`, tag `qllaw-phase8b-codex-api:20260711-0352`.
* Web: PASS, `69,084 ms`, tag `qllaw-phase8b-codex-web:20260711-0355`.
* contracts resolution: `213 locked / 213 compiled`, package export and browser entrypoint PASS.
* assets: required API/Web runtime assets, Prisma Client, LF entrypoint and writable runtime directories PASS; no secret values detected.
* non-root: API/Web both `node`, uid `1000`.
* context size: API `9.12 MB`; Web `709.88 kB`.
* image sizes: API `554,323,517` bytes (`528.64 MiB`); Web `355,562,705` bytes (`339.09 MiB`).

DOCKER_BOOT:
* database: disposable `mariadb:11`, healthy, no persistent resource reuse.
* migration: one active baseline row, failed rows `0`, explicit second deploy exit `0`/no pending.
* API readiness: expected pre-governance `503`; after disposable three-contract governance prerequisite, HTTP `200`.
* Web readiness: HTTP `200`.
* seed: disabled and not executed; no personal/case data.
* restart: PASS; healthy, migration row `1 -> 1`, fixture `3 -> 3`, no duplicates.
* shutdown: graceful SIGTERM, Web/API exit `143`, `199/204 ms`, no forced `137`.
* cleanup: PASS, containers/networks/volumes `0/0/0`; total `38,230 ms`.

DOCKER_VERIFIER:
* final exit: `0`, `3,777 ms`, `DOCKER_VERIFY=PASS` using exact images and complete boot artifact.
* required failures: invalid/missing boot stage, migration, readiness, restart, shutdown, cleanup, image mismatch, single image override, or malformed JSON all fail closed.
* truthful: yes; no global PASS is possible without boot evidence. Image-only success is explicitly `PASS_IMAGE_ONLY`.
* changes: exact image overrides, complete boot-envelope validator, required-stage output, BOM-safe JSON parser, importable test seam, and focused truthfulness test.

FONT:
* requested: Times New Roman.
* resolved: Liberation Serif regular/bold/italic/bold-italic; exact Times New Roman entry absent.
* conversion: BM-001 DOCX to PDF exit `0`, `716 ms`, output `73,099` bytes; page count unavailable because `pdfinfo` is absent.
* fidelity classification: `METRIC_COMPATIBLE_FALLBACK`; operational conversion PASS, legal-layout fidelity PARTIAL.

THROTTLING:
* forms audited: BM-118, BM-119, BM-120, BM-151, BM-152, BM-153, BM-185, BM-186, BM-187.
* explicit 429: `0`.
* timing-only: `9` legacy labels lack supporting rate-limit evidence; observed route runs were `1,286-1,377 ms` with HTTP 200.
* rerun: source/render route proof PASS; Clerk-protected collector not rerun because no fresh ticket/auth state was provable and canonical mutation was forbidden.
* unverified: `9/9`; future classifier now requires explicit 429/ThrottlerException/Too Many Requests/rate-limit evidence.

EVIDENCE_IDEMPOTENCE:
* disposable: yes, 1,600-file OS-temp dependency closure, then removed.
* first apply: exit `0`, `2,265 ms`, `NO_SEMANTIC_CHANGE`, 36 steps.
* second apply: exit `0`, `1,932 ms`, `NO_SEMANTIC_CHANGE`, 36 steps.
* byte-identical: yes; whole-workspace SHA-256 `de3497a53a20e701a840e6b4c95d66b932c4fab2b96e1de43619e34b3a30b01b` before/after both applies.
* history preserved: yes; row order hash, 201/12 axes, exact holdouts, 124 browser-history entries and 9 rerun records unchanged.
* canonical mutation: none.

FILES_CHANGED_BY_CODEX:

Các số CI/verifier/collector dưới đây được tính so với backup byte-exact trước khi Codex sửa; không quy các thay đổi dirty-tree có sẵn cho Phase 8B. Các báo cáo Markdown/JSON không lặp lại trong bảng source/config này.

| path | finding | exact reason | additions | deletions |
| --- | --- | --- | ---: | ---: |
| `.github/workflows/ci.yml` | MIGRATION_REGRESSION_GATE | thêm một job fresh-MariaDB fail-closed và artifact luôn upload | 40 | 0 |
| `scripts/audit/migration-regression-gate.mjs` | MIGRATION_REGRESSION_GATE | gate disposable, deploy hai lần, status/parity/cleanup | 405 | 0 |
| `test/migration-regression-gate.test.mjs` | MIGRATION_REGRESSION_GATE | TDD cho failure propagation, cleanup, success contract và CI wiring | 111 | 0 |
| `scripts/docker-verify.mjs` | DOCKER_VERIFIER | loại PASS_STATIC; ràng buộc exact image và full boot evidence; BOM-safe | 134 | 10 |
| `test/infrastructure/docker-verifier-truthfulness.test.mjs` | DOCKER_VERIFIER | TDD chống global PASS thiếu boot và chống required-stage failure | 106 | 0 |
| `scripts/audit/browser-visibility-source-render-only.mjs` | THROTTLING_CLASSIFIER | bỏ suy diễn throttling từ timing/network; dùng classifier có guard | 9 | 18 |
| `scripts/audit/lib/throttling-classifier.mjs` | THROTTLING_CLASSIFIER | chỉ chấp nhận bằng chứng rate-limit tường minh | 70 | 0 |
| `test/infrastructure/throttling-classifier.test.mjs` | THROTTLING_CLASSIFIER | TDD cho 429 thật và timing/network UNVERIFIED | 41 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/stage4b-candidate/000000000000_squashed_baseline/migration.generated.sql` | MIGRATION_BASELINE | bằng chứng Prisma diff bất biến từ complete datamodel | 1,059 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/stage4b-candidate/000000000000_squashed_baseline/migration.candidate.sql` | MIGRATION_BASELINE | generated SQL cộng đúng một timestamp clause bắt buộc | 1,060 | 0 |
| `apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql` | MIGRATION_BASELINE | active baseline byte-identical với candidate đã GO | 1,060 | 0 |
| `apps/api/prisma/migrations/20260615000000_init_schema/migration.sql` | MIGRATION_BASELINE | bỏ chain lỗi khỏi active Prisma history; bản exact nằm trong archive | 0 | 813 |
| `apps/api/prisma/migrations/20260616000000_add_officials_role/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 23 |
| `apps/api/prisma/migrations/20260616005000_create_auth_sessions/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 20 |
| `apps/api/prisma/migrations/20260616010000_add_official_credentials/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 24 |
| `apps/api/prisma/migrations/20260616020000_add_template_owner_official/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 36 |
| `apps/api/prisma/migrations/20260616_add_auth_sessions/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 22 |
| `apps/api/prisma/migrations/20260617010000_add_soft_delete_to_case_offenses_and_evidence/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 19 |
| `apps/api/prisma/migrations/20260617110000_fix_vietnamese_column_defaults/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 11 |
| `apps/api/prisma/migrations/20260620150000_add_form_contract_platform_v2/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 113 |
| `apps/api/prisma/migrations/20260620170000_enforce_form_contract_scope_uniqueness/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 25 |
| `apps/api/prisma/migrations/20260622000000_add_clerk_auth_identities/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 26 |
| `apps/api/prisma/migrations/20260702000000_add_auth_identity_audit_logs/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 30 |
| `apps/api/prisma/migrations/20260702_generated_document_audit_logs/migration.sql` | MIGRATION_BASELINE | như trên | 0 | 87 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260615000000_init_schema/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 813 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260616000000_add_officials_role/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 23 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260616005000_create_auth_sessions/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 20 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260616010000_add_official_credentials/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 24 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260616020000_add_template_owner_official/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 36 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260616_add_auth_sessions/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 22 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260617010000_add_soft_delete_to_case_offenses_and_evidence/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 19 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260617110000_fix_vietnamese_column_defaults/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 11 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260620150000_add_form_contract_platform_v2/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 113 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260620170000_enforce_form_contract_scope_uniqueness/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 25 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260622000000_add_clerk_auth_identities/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 26 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260702000000_add_auth_identity_audit_logs/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 30 | 0 |
| `docs/audit/infrastructure-modernization/phase-8b-production-verification/migrations-archive/20260702_generated_document_audit_logs/migration.sql` | MIGRATION_BASELINE | giữ rollback provenance đúng hash | 87 | 0 |

VALIDATION:

| command | exit | duration | result |
| --- | ---: | ---: | --- |
| contracts/API/Web/root typechecks | `0/0/0/0` | `3,136 / 13,832 / 8,734 / 5,756 ms` | PASS |
| `pnpm lint` | `0` | `~62,050 ms` | PASS |
| `pnpm test` | `0` | `~50,000 ms` | PASS |
| `pnpm build` | `0` | `~50,000 ms` | PASS |
| infrastructure guards | `0` | `327 ms` | `17/17` PASS |
| hardcode / locked-compiled / contract-sync / encoding | `0/0/0/0` | `450 / 420 / 1,470 / 477 ms` | PASS; sync official ở FILE_ONLY |
| forms gate / evidence check | `0/0` | `391 / 100 ms` | `213/213`; `201/12`, 36 steps |
| migration focused + CI tests | `0` | not retained separately | `7/7` PASS |
| Docker verifier focused + command guard | `0` | not retained separately | `10/10` PASS |
| throttling classifier tests | `0` | not retained separately | `3/3` PASS |
| combined final focused closure suite | `0` | `91.815 ms` | `20/20` PASS |
| fresh migration regression gate | `0` | `11,422 ms` | deploy `0/0`, status `0`, parity/cleanup PASS |
| API / Web production builds | `0/0` | `88,894 / 69,084 ms` | PASS |
| disposable production boot | `0` | `38,230 ms` | PASS |
| final `pnpm docker:verify` | `0` | `3,777 ms` | `DOCKER_VERIFY=PASS` |
| `pnpm verify:quick` | `0` | `8,866 ms` | PASS |
| `pnpm verify:full` | `0` | `~90,000 ms` | PASS |
| `pnpm verify:ci` | `0` | `~95,100 ms` | PASS với known BM-006 acknowledgement giữ nguyên |

INVARIANTS:
* persistent DB: không mutate; structure/metadata hashes trước-sau giống hệt; application rows read `0` trong official metadata probes.
* form-studio: protected state count `2`, hash không đổi.
* BM files: `213` input files; tập `127` file đã dirty từ lúc bắt đầu giữ nguyên hash.
* DOCX: toàn bộ `1,104`; source `19`; normalized `441`; mọi count/hash không đổi.
* contracts: locked `213`, compiled `213`, hashes không đổi.
* Prisma schema: SHA-256 `057375956a72fe40e11e0950c4126c4827e05824714a881f9de9ea0826e6022b`, không đổi.
* matrix: `201 INPUT_CONNECTED_PASS / 12 INPUT_CONNECTED_PARTIAL`, row order/hash không đổi.
* holdouts: BM-024, BM-039, BM-041, BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-089, BM-099, BM-200; không đổi.
* BM006: `INPUT_CONNECTED_PASS`, `fidelityComplete=false`, manual review vẫn bắt buộc, visual PDF vẫn `PARTIAL_AUTO_NEEDS_REVIEW`; không đổi.
* BM130: `INPUT_CONNECTED_PASS`, `fidelityComplete=false`, fidelity audit `NOT_RUN`; canary không đổi.
* runtimeReady: chỉ BM-001 và BM-171.
* fidelityComplete: `0` true.
* Docker leftovers: matching images/containers/networks/volumes `0/0/0/0`.

GIT:
* staged: `0`.
* commit: none.
* push: none.
* PR: none.

REMAINING_RISKS:
1. Filesystem chỉ còn baseline mới nhưng persistent `_prisma_migrations` vẫn là lịch sử cũ; đây là trạng thái dự kiến trước khi operator chạy runbook, không phải trạng thái deploy production ngay lập tức.
2. Hai default `GLOBAL` lịch sử vẫn tồn tại trên persistent schema. Chúng tương thích với code hiện tại nhưng phải được operator chấp nhận rõ trong preflight diff.
3. Times New Roman không có trong ảnh; Liberation Serif có thể làm lệch phân trang/metric của văn bản pháp lý.
4. Chín nhãn throttling cũ không có raw 429/structured evidence và phải giữ `UNVERIFIED`.
5. Fresh production DB không tự có ba contract-governance rows cần cho readiness; cần quy trình bootstrap có chủ sở hữu, không dùng synthetic fixture của probe.
6. Worktree có rất nhiều thay đổi tồn tại trước Phase 8B; Phase 8B cố ý không clean, stage hay commit chúng.
7. Một lần contract-sync ban đầu đã vô tình đọc metadata 213 contract rows từ persistent DB do root env; không ghi dữ liệu, không in business rows, và các hash cuối chứng minh không mutation.

NEED_USER_DECISION:
1. Chấp nhận policy font fallback hay cung cấp kênh cài Times New Roman có license/approval rồi chạy lại visual fidelity.
2. Phê duyệt một Phase 8C có DBA/operator: backup, maintenance window, metadata-only baseline resolution theo E1 và rollback plan; Codex chưa được phép tự làm bước này.
3. Quyết định quy trình bootstrap ba governed contracts cho fresh production DB.
4. Cung cấp/refresh Clerk ticket + storageState để rerun 9 biểu mẫu và quyết định có cập nhật canonical browser artifact sau khi raw evidence đạt yêu cầu hay không.

NEXT_RECOMMENDED_PHASE:
`PHASE 8C - OPERATOR-GOVERNED RELEASE ACCEPTANCE`: chốt font policy; chạy authenticated raw-response rerun cho 9 form trong disposable evidence copy; thiết kế/duyệt governed-contract bootstrap; sau backup và preflight diff, thực hiện metadata-only persistent transition theo runbook rồi kiểm tra status/deploy hai lần, readiness, rollback checkpoint và post-transition hashes. Dừng ngay nếu diff vượt quá hai default đã biết.
