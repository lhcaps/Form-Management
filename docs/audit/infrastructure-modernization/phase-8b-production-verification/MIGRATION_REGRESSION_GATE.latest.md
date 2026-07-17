# Phase 8B - Migration regression gate

## Verdict

`PASS`

## Implementation

- Script: `scripts/audit/migration-regression-gate.mjs`.
- Script SHA-256: `abdec7ce960748444ae28a04d86835aed5f184910377c4b7d33034bef0686dd0`.
- Focused test: `test/migration-regression-gate.test.mjs`.
- Test SHA-256: `49c9d2b1a6375002cb94a3eafa4ff47833d153a8e87b782ad2166b95e765c4f0`.
- Package alias: none; the script is invoked directly.
- CI: one new `migration-regression-gate` job in `.github/workflows/ci.yml`.

The script generates unique container/network/volume names, rejects names containing known persistent resource fragments, ignores persistent credentials, confirms the target database is empty, applies the single active migration twice, checks failed rows and status, requires an empty database-to-datamodel diff, and cleans up in all paths. Missing Docker or prerequisites fails closed.

## Focused tests

Initial RED proof: importing the not-yet-created script caused `ERR_MODULE_NOT_FOUND`, exit `1`.

Final focused result:

- Child migration failure produces non-zero gate result: PASS.
- Cleanup runs after a mocked child failure: PASS.
- Success requires both deploys, status, zero failed rows, parity, and cleanup: PASS.
- Known persistent container/volume names are rejected: PASS.
- CI job has frozen install, explicit timeout, direct invocation, always-uploaded failure evidence, and no `continue-on-error`: PASS.
- Combined migration-gate + CI reproducibility test run: `7/7`, exit `0`.

## Real gate run

An initial real run correctly returned non-zero after both deploys/status passed because the command helper incorrectly appended `--schema` to `prisma migrate diff`. Prisma 6.19 rejects that option for `migrate diff`. Cleanup still removed container/network/volume with exits `0/0/0`. The helper was narrowed so diff uses its explicit `--to-schema-datamodel` path without the invalid global option.

Final run:

| Check | Result |
| --- | --- |
| Run ID | `phase8b-migration-gate-20260710204802-75b58740` |
| Initially empty | yes |
| First deploy | exit `0` |
| Second deploy | exit `0` |
| Failed migration rows | `0` |
| Status | exit `0` |
| Schema parity | empty diff, PASS |
| Structure | `40` tables / `490` columns including migration metadata |
| Bootstrap data | none required; zero data statements |
| Cleanup | container/network/volume `0/0/0`, leftovers `0` |
| Duration | `13,307 ms` |
| Final exit | `0` |

- Evidence: `logs/migration-regression-gate/phase8b-migration-gate-20260710204802-75b58740.json`.
- Evidence SHA-256: `bfb7a108395080a7af4dd48a71f2f1d9166dadcee08491f9f2cb515865068185`.

## CI integration

The new job uses Ubuntu, Node 22, pnpm 10.33.2, `pnpm install --frozen-lockfile`, a 15-minute timeout, and direct script invocation. It uploads the JSON and unfiltered run log with `if: always()`. No existing job was removed or refactored.

The pre-edit CI file was backed up byte-for-byte at `%TEMP%/qllaw-phase8b-ci-before-202607110348.yml`; pre-edit SHA-256 was `803212f0e577233dc09790f009f74473b491154fe0d2c1e9ce492a6e1c54bdda`.
