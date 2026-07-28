# Phase 8B - Disposable production-stack boot

## Verdict

`PASS` for the isolated boot gate. This is not a production-readiness declaration.

## Isolation

- Compose project: `phase8b-codex-boot-202607111512`.
- Images: the exact Phase 8B API/Web images plus `mariadb:11`.
- Host ports published by API/Web: `0 / 0`.
- Secrets: generated only for the disposable run; not recorded in evidence.
- Seed: disabled; no seed command executed.
- Personal, case, or legal-document data inserted: no.

## Boot and readiness

MariaDB, API, and Web all started with exit `0` and became healthy. On the truly fresh database, API readiness first returned the expected `503` because the governed database had no published BM-001/BM-002/BM-003 contract rows. The probe then inserted only a disposable governance prerequisite: one synthetic official, three template rows, and three `PUBLISHED` contract rows. `ALLOW_CONTRACT_DRIFT=1` was scoped to this isolated proof only. API and Web readiness then returned HTTP `200`.

| Check | Result |
| --- | --- |
| First migration metadata | exactly `1` baseline row, `0` failed rows |
| Active baseline observed in logs | yes |
| Second explicit deploy | exit `0`, no pending migrations |
| Seed disabled / executed | yes / no |
| API/Web uid | `1000 / 1000` |
| Required writable directories | PASS |
| API restart | exit `0`, healthy |
| Metadata before/after restart | `1 / 1`, no duplicate row |
| Disposable readiness fixture before/after restart | `3 / 3`, no duplicate row |

## Shutdown and cleanup

- Web/API stop durations: `199 ms / 204 ms`.
- Web/API container exits: `143 / 143`, accepted SIGTERM exits.
- Forced exit `137`: none.
- Compose down: exit `0`, `688 ms`.
- Matching leftover containers/networks/volumes: `0 / 0 / 0`.
- Total run duration: `38,230 ms`.

## Evidence

- Result envelope: `logs/docker-boot-202607111512.json`.
- Complete boot log: `logs/docker-boot-202607111512.log`.

Production still needs an approved governed-contract bootstrap policy; the synthetic fixture is proof material only and is not a production seed recommendation.
