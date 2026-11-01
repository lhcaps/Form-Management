# QLLaw infrastructure performance before/after

Status: **PARTIAL**. All measured build/test/image probes passed, but API cold start, API readiness and API latency are **NOT_RUN** because the production entrypoint correctly stops at the unresolved Prisma migration-history blocker.

These measurements came from the same Windows/Docker Desktop host, but cache and background-load state were not normalized. They are operational observations, not a controlled benchmark.

| Metric | Before | After | Result / note |
|---|---:|---:|---|
| Install | NOT_RUN | NOT_RUN | Existing frozen-lockfile install was usable. |
| Typecheck | 5.959 s | 7.116 s | PASS → PASS; +19.416%. |
| Lint | 89.830 s | 24.837 s | PASS → PASS; -72.351%; cache-sensitive. |
| Tests | 51.576 s | 17.774 s | 1 stale-report failure → 103 contract + 704 API + 763 node + 1,427 web PASS. |
| Build | 63.694 s | 24.910 s | PASS → PASS; cache-sensitive. |
| `verify:full` | NOT_MEASURED | 137.529 s | PASS. |
| `verify:ci` | NOT_MEASURED | 60.023 s | PASS; BM-006 hash mismatch remains explicit acknowledged debt. |
| Docker build | 90.023 s no-cache | 73.762 s warm/incremental | PASS; not a like-for-like speed comparison. |
| Docker context | ~330 MB | ~1.25 MB | About 99.621% smaller; rounded Docker progress value after final reports were added. |
| API image | 601,984,503 B | 554,341,140 B | 47,643,363 B / 7.914% smaller; `User=node`. |
| Web image | 355,553,407 B | 355,562,537 B | +9,130 B / 0.003%; `User=node`. |
| Web cold readiness | NOT_MEASURED | 535 ms | `/healthz` HTTP 200. |
| Web SIGTERM stop | failed baseline runtime | 316 ms | Exit 143 (SIGTERM), no OOM/forced timeout. |
| BM-001 DOCX shadow render | NOT_MEASURED | 0.907 s / 5 scenarios | Average 0.181 s; 5 package-integrity PASS, 1 semantic PASS, 4 semantic warnings, 0 FAIL. |
| BM-001 PDF conversion | NOT_MEASURED | 1.084 s | LibreOffice 7.4.7.2; 73,099-byte PDF. |
| Browser sweep | NOT_RUN | NOT_RUN | Existing 124 browser-evidence rows preserved; no new request count or duration inferred. |
| Next routes | NOT_RECORDED | 17 | Production build PASS. |

## Explicitly unmeasured

- API cold start: **NOT_RUN** — Prisma P3018 / MariaDB 1060 stops boot before Nest readiness.
- API readiness: **NOT_RUN** — same blocker.
- Representative API latency: **NOT_RUN** — no production-ready API instance.
- Licensed-font fidelity: Times New Roman resolves to Liberation Serif. The conversion pipeline works, but production font policy remains **NEED_USER_DECISION**.
