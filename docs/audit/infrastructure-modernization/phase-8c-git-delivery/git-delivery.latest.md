# Phase 8C Git delivery plan

Generated: 2026-07-11T10:09:40.354Z

Branch: `audit/bm006-visual-fidelity-evidence`
HEAD: `ea3e1c3c53278fad09c8557487ffb1d48d685a65`
Upstream: `(none)`

## Bucket summary

| Bucket | Count |
|---|---:|
| `PHASE_8C_FONT` | 12 |
| `PHASE_8C_PDF_FIDELITY` | 1 |
| `PHASE_8C_BOOTSTRAP` | 1 |
| `PHASE_8C_THROTTLING` | 1 |
| `PHASE_8C_METADATA` | 1 |
| `PRE_EXISTING_DIRTY` | 1109 |

## Policy

- **Phase 8C never stages / commits / pushes / opens PRs.**
- Pre-existing dirty tree is OUT OF SCOPE for Phase 8C.
- Operator must manually curate and commit the PHASE_8C_* buckets only after reviewing this plan.

## Proposed commits

### `PHASE_8C_FONT`

Branch: `feat/phase-8c-font-fidelity`

```
feat(infrastructure): Times New Roman font fidelity + readiness policy

- scripts/fonts/{ttf-inspector,verify-font-policy}.mjs
- docker-compose.prod.yml + docker/api.Dockerfile + docker/api-entrypoint.sh
- apps/api/src/modules/health/readiness.service.{ts,spec.ts}
- apps/api/src/infrastructure/config/app-config.service.{ts,spec.ts}
- .env.docker.example, scripts/docker-verify.mjs
- test/font-policy.test.mjs
```

### `PHASE_8C_PDF_FIDELITY`

Branch: `docs/phase-8c-pdf-fidelity-evidence`

```
docs(audit): BM-001/BM-006/BM-171 PDF fidelity evidence packet

- scripts/audit/build-phase-8c-pdf-fidelity-evidence.mjs
- docs/audit/infrastructure-modernization/phase-8c-pdf-fidelity/
```

### `PHASE_8C_BOOTSTRAP`

Branch: `feat/phase-8c-contract-bootstrap`

```
feat(audit): governed contract bootstrap for fresh production DB

- scripts/audit/build-phase-8c-bootstrap-sql.mjs
- docs/audit/infrastructure-modernization/phase-8c-bootstrap/
```

### `PHASE_8C_THROTTLING`

Branch: `docs/phase-8c-throttling-closure`

```
docs(audit): nine-form authenticated throttling closure (NEED_USER_DECISION)

- scripts/audit/build-phase-8c-throttling-closure.mjs
- docs/audit/infrastructure-modernization/phase-8c-throttling/
```

### `PHASE_8C_METADATA`

Branch: `docs/phase-8c-metadata-transition`

```
docs(audit): persistent metadata transition preflight package

- scripts/audit/build-phase-8c-metadata-transition-package.mjs
- docs/audit/infrastructure-modernization/phase-8c-metadata-transition/
```
