# QLLaw infrastructure blocker register

| ID | Priority | Subsystem | Status | Root cause | Safe boundary |
|---|---|---|---|---|---|
| INFRA-P0-001 | P0 | audit-evidence | RESOLVED | Canonical orchestration now preflights, locks, rolls back, excludes live collectors, and proves semantic idempotence. | Preserve 201/12 and apply-owned evidence; never infer or recollect browser evidence. |
| INFRA-P0-002 | P0 | docker-entrypoint | RESOLVED | CRLF shebang corruption was confirmed and removed; LF is enforced and the entrypoint reaches migration. | Keep shell scripts LF-only and fail-closed. |
| INFRA-P0-003 | P0 | docker-runtime-assets | RESOLVED | Final API image contains exactly 213 locked plus 213 compiled artifacts. | Package only governed runtime assets; do not mutate their contents. |
| INFRA-P0-004 | P0 | production-environment | RESOLVED | Platform/container env now wins; production ignores repository env files. | Never log values; preserve development precedence. |
| INFRA-P0-005 | P0 | docker-build-context | RESOLVED | Final context is approximately 1.25 MB versus approximately 330 MB at baseline. | Keep auth state, secrets, temp output and bulk docs excluded while allowlisting governed runtime artifacts. |
| INFRA-P0-006 | P0 | database-migrations | NEED_USER_DECISION | Fresh MariaDB reproduction fails P3018 / 1060 at `20260616000000_add_officials_role`: `officials.role` already exists from the baseline migration. | Do not mutate applied migrations. Compare `_prisma_migrations` across persistent environments and approve a baseline/resolve strategy first. |
| INFRA-P1-001 | P1 | docker-seed | PARTIAL | Image command/dependencies resolve and seed defaults off; seed-twice remains NOT_RUN because migrations cannot finish. | Keep seed opt-in and single-run until migration history is resolved. |
| INFRA-P1-002 | P1 | test-evidence-freshness | RESOLVED | Inventory is deterministic, provenance-based, and refreshed before consumers; 213/213 passes. | Keep wall-clock freshness out of deterministic unit gates. |
| INFRA-P1-003 | P1 | runtime-hardcode-audit | RESOLVED | Exact detector path/count allowlist is fail-closed; runtime copy leaks fail. | Synthetic profile fixtures remain the documented exception. |
| INFRA-P1-004 | P1 | imports-security | RESOLVED | Storage paths are contained and uploads are capped at 50 MiB before disk write. | Legacy absolute DB rows remain a separately scoped compatibility decision. |
| INFRA-P1-005 | P1 | runtime-operations | PARTIAL | Images are non-root and health-gated; web readiness/SIGTERM are proven. API end-to-end boot is blocked at migration. | Retain stop grace and health semantics; rerun full stack after INFRA-P0-006. |
| INFRA-DECISION-001 | P1 | legal-rendering-fonts | NEED_USER_DECISION | Confirmed by runner probe. | Do not download proprietary fonts. Document fallback and request approved font file/mount decision. |

Full reproduction, affected files, regression test, verification command, and residual risk are in `BLOCKER_REGISTER.latest.json`.

Current unresolved decisions: database migration history and licensed production font policy. The locked-contract CI gate explicitly acknowledges only `BM-006:EXTRACTION_HASH_MISMATCH`; that acknowledgment is visible debt and does not authorize a production-ready claim.
