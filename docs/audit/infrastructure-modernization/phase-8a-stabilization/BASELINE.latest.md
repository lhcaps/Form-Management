# Phase 8A — Baseline Snapshot

**Phase:** 8A — Deterministic test stabilization and change provenance
**Captured:** 2026-07-10 23:58 (+07:00)
**Git policy:** `NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR`

## Repository and tools

| Item | Value |
|---|---|
| Root | `D:/Study/Project/QLLaw-main` |
| Branch | `audit/bm006-visual-fidelity-evidence` |
| HEAD | `ea3e1c3c53278fad09c8557487ffb1d48d685a65` |
| HEAD unix time | `1783631278` |
| `origin/main` | `12749f1fefaca7e63e1f0df7cf5c0d5b19f126f4` |
| OS | Windows 11 Pro 10.0.26200 x64 |
| Shell | PowerShell 5.1.26100.8655 |
| `ComSpec` | `C:\WINDOWS\system32\cmd.exe` |
| Node | v22.23.1 |
| pnpm | 10.33.2 |
| Git | 2.54.0.windows.1 |
| `pnpm script-shell` | undefined (default OS shell) |

## Git state at start

| Bucket | Count |
|---|---:|
| Staged | **0** |
| Modified tracked | **215** |
| Deleted tracked | **32** |
| Untracked | **850** |
| `git diff --name-status` lines | **247** |
| Total porcelain entries | **1097** |

`git diff --cached --name-only` is empty. Staged list will stay at zero throughout Phase 8A.

## Critical file hashes (SHA-256)

| Path | SHA-256 |
|---|---|
| `package.json` | `a7b428ce270f63c9d30901e3cd3aee6c972584134f0c47d8e50d49c413b58ada` |
| `.github/workflows/ci.yml` | `803212f0e577233dc09790f009f74473b491154fe0d2c1e9ce492a6e1c54bdda` |
| `apps/api/package.json` | `724a221e86d68d99cea8c1b2abcad88ec9fb6eeb527f20fdcc86276904bd0d21` |
| `packages/form-contracts/package.json` | `9dbc00d27e1a893f2e66a13ef79e2594a625b8f2834cb5c4ae902aefd36d8fb7` |
| `apps/web/package.json` | `734abb7bdb7aa5708c94f419fbcff198b2db87a02d92e18d3665f35c9a3b5a46` |
| Canonical matrix | `fb24e01b76ea5a35874f32c0449a6ca37df9aba14ef2313ee29011a5b9ee3399` |
| BM-006 normalized DOCX | `b83c42ad854f5cd4e08bc8f901389be0ee17c1401c4e42a309016154bd399f56` |
| Prisma schema | `057375956a72fe40e11e0950c4126c4827e05824714a881f9de9ea0826e6022b` |

## Verification scripts (relevant)

| Script | Command (per `package.json`) |
|---|---|
| `test` | `pnpm test:contracts && pnpm test:api && pnpm test:node && pnpm test:web-unit` |
| `test:api` | `pnpm --filter api test --runInBand` |
| `verify:quick` | `pnpm typecheck && pnpm audit:hardcode && node --test "test/infrastructure/*.guard.test.mjs"` |
| `verify:full` | `pnpm audit:docx-slot-inventory && pnpm verify:quick && pnpm lint && pnpm test && pnpm build && pnpm audit:locked-compiled && pnpm audit:contract-sync && pnpm audit:encoding` |
| `verify:ci` | `pnpm verify:full && pnpm audit:templates && pnpm smoke:bm001-shadow-render && pnpm audit:docx:verify-locked:ci && pnpm gate:forms:213 --allow-source-unknown && node scripts/audit/apply-all-current-evidence.mjs --check` |
| `audit:docx-slot-inventory` | `node scripts/audit/audit-docx-slot-inventory.mjs` |

## Node processes observed at start

- 8 `D:\Node\node.exe` worker processes (likely leftover from earlier `test:web-unit`).
- 6 `codegraph` MCP helpers.
- 3 `Cursor` helper node processes.

None are owned by this phase. Phase-owned processes will be created only inside per-run unique temp directories.

## Phase-owned temporary directories

- `docs/audit/infrastructure-modernization/phase-8a-stabilization/` (read by user)
- `docs/audit/infrastructure-modernization/phase-8a-stabilization/logs/` (per-run command logs)

Per-run command execution will additionally create directories under `%TEMP%` (unique per run), cleaned by the run itself.

## Startup observations

- Windows git `LF will be replaced by CRLF` warnings emit on every diff command. They are advisory (no `.gitattributes` mismatch fix will be made in 8A).
- Three failing suites use **fixed `tmpdir()` paths** rather than `mkdtempSync`:
  - `qllaw-e2-render-six-bms` (`apps/api/src/modules/documents/rendering/infrastructure/representative-bms-render.spec.ts`).
  - `qllaw-pr6g4-style-profile-bm001` and `qllaw-pr6g4-style-profile-nobm` (`apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-style-profile.spec.ts`).
  - `qllaw-pr6g1-rendered-preservation` (`apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts`).
- `audit:docx-slot-inventory` only writes to `docs/audit/docx-slot-inventory/latest.{json,md}`; it does **not** touch `tmpdir()` or any `qllaw-*` shadow path.

## Applicable instructions

- `AGENTS.md`, `apps/web/AGENTS.md`.
- `.ai/harness/project-intake.md`, `.ai/harness/project_failure-log.md`.
- `.cursor/rules/00-meta.mdc`, `10-coding-style.mdc`, `20-safety.mdc`, `30-tooling.mdc`, `50-codegraph-context.mdc`.
- The Phase 8A user task directive (this document's preface). Where it conflicts with the universal coding style, the user directive is authoritative.

## What this baseline proves

1. Staged tree is empty; no Phase 8A work has been staged or committed.
2. The 1096→1097 porcelain entry increase from Phase 7 to now reflects the addition of the phase's own working directory entries (they are inside the new phase dir, treated as untracked).
3. The verification scripts in `package.json` are all unfiltered Node invocations, exit code is preserved by `&&` chain semantics at the `cmd.exe` level.
4. The `audit:docx-slot-inventory` first step in `verify:full` writes only to `docs/audit/docx-slot-inventory/`; it cannot directly mutate `tmpdir()` artifacts.

What this baseline **does not** prove:

- That `verify:full` truly fails today (reproduction matrix required).
- That the `ENOENT` transient artifact belongs to inventory rather than to a different suite's `beforeEach` (reproduction matrix required).
- That any of the form-studio files were deleted by Codex (Stage 2 forensics required).
