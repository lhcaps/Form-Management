# Phase 8B - Production Docker build

## Verdict

`PASS`

The production API and Web images were built from the live worktree with unique Phase 8B tags. No Dockerfile or Compose change was needed after the real builds.

## Images

| Service | Tag | Build | Duration | Manifest-list digest | Size |
| --- | --- | --- | ---: | --- | ---: |
| API | `qllaw-phase8b-codex-api:20260711-0352` | no-cache, exit `0` | `88,894 ms` | `sha256:9ffaef6a4205dae509cb8953682c2a6e732a2cd551881a45af89b746b9588016` | `554,323,517` bytes (`528.64 MiB`) |
| Web | `qllaw-phase8b-codex-web:20260711-0355` | exit `0` | `69,084 ms` | `sha256:e02cbb87def553339226d7da6e450f5275bcf3cd7470782316cc05d9eadba366` | `355,562,705` bytes (`339.09 MiB`) |

## Runtime probes

- Locked and compiled contract resolution inside the API image: `213 / 213`, PASS.
- Form-contract package exports and browser entrypoints: resolvable, PASS.
- Required API runtime assets, LF entrypoint, writable storage/log locations, and Prisma Client: PASS.
- LibreOffice in the API image: `7.4.7.2 40(Build:2)`.
- Final API and Web users: `node` (`uid=1000`), not root.
- Baked secret/environment values detected by the scoped image probe: `0`.
- API build context: `9.12 MB`.
- Web build context: `709.88 kB`.

## Evidence and cleanup

- API log: `logs/docker-api-build-202607110352.log`.
- Web log: `logs/docker-web-build-202607110355.log`.
- The unique images were retained only through boot/verifier/font validation and then removed.
- Final matching Phase 8B images, containers, networks, and volumes: `0 / 0 / 0 / 0`.
