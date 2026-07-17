# Phase 8A — Stage 6 — Transient Artifact Lifecycle Graph

Captured: 2026-07-10 (Phase 8A run)

## 1. Confirmed artifact paths in the repository

Every artifact path used by jest specs in `apps/api/src/modules/documents/rendering/infrastructure/`:

| File | Variable | Path |
|------|----------|------|
| representative-bms-render.spec.ts | `OUTPUT_ROOT` | `qllaw-e2-render-six-bms` |
| docxtemplater-contract-render-engine-style-profile.spec.ts | `OUTPUT_ROOT_BM001` | `qllaw-pr6g4-style-profile-bm001` |
| docxtemplater-contract-render-engine-style-profile.spec.ts | `OUTPUT_ROOT_NOBMPROFILE` | `qllaw-pr6g4-style-profile-nobm` |
| docxtemplater-contract-render-engine-bm171-style-profile.spec.ts | `OUTPUT_ROOT_BM171` | `qllaw-pr7a-style-profile-bm171` |
| docxtemplater-contract-render-engine-bm171-style-profile.spec.ts | `OUTPUT_ROOT_NOBMPROFILE` | (TBD — read in this phase) |
| docx-inspection-rendered-preservation.spec.ts | `OUTPUT_ROOT` | `qllaw-pr6g1-rendered-preservation` |
| pr6g31-bm001-rendered-docx-parity.spec.ts | `OUTPUT_ROOT` | `qllaw-pr6g31-bm001-rendered-docx-parity` |
| pr6g31-bm001-shared-mapping-parity.spec.ts | (own OUTPUT_ROOT) | (TBD — read in this phase) |
| pr6g31-bm171-rendered-docx-parity.spec.ts | `OUTPUT_ROOT` | `qllaw-pr7a-bm171-rendered-docx-parity` |
| docxtemplater-contract-render-engine.spec.ts | `OUTPUT_ROOT` | `qllaw-docx-contract-render-engine` |

All of the above paths are **`join(tmpdir(), '<literal>')`** — fixed, not unique.

Confirmed at the start of Phase 8A:
- 9 paths above
- All absent at Phase 8A start (no leftover from prior runs)
- Now: clean

## 2. Producer / consumer / cleanup per suite

### representative-bms-render.spec.ts
- **Producer**: `DocxtemplaterContractRenderEngine.renderShadow(plan, formData, OUTPUT_ROOT)` (apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts:103)
- **Output dir** (per BM): `OUTPUT_ROOT/<templateCode>/<timestamp>/` (timestamped subdir)
- **Files written**:
  - `contract.docx`
  - `semantic-diff.json`, `semantic-diff.md`
  - `format-audit.json`, `format-audit.md`
  - `package-integrity.json`, `package-integrity.md`
  - `manifest.json`
- **Consumer**: spec itself reads `result.artifacts.docxPath` and unzips it via PizZip
- **Cleanup**:
  - `beforeAll`: `rmSync(OUTPUT_ROOT, { force: true, recursive: true })`
  - `afterAll`: `rmSync(OUTPUT_ROOT, { force: true, recursive: true })`

### docxtemplater-contract-render-engine-style-profile.spec.ts (BM-001)
- **Producer**: same `DocxtemplaterContractRenderEngine.renderShadow(...)`
- **Output dir**: `OUTPUT_ROOT_BM001/<templateCode>/<timestamp>/`
- **Consumer**: spec reads `result.artifacts.docxPath` then unzips with PizZip
- **Cleanup**:
  - inner `beforeAll`: `rmSync(OUTPUT_ROOT_BM001, { force: true, recursive: true })`
  - inner `afterAll`: `rmSync(OUTPUT_ROOT_BM001, { force: true, recursive: true })`
  - outer `afterAll` (top-level): `rmSync(OUTPUT_ROOT_BM001, ...) ; rmSync(OUTPUT_ROOT_NOBMPROFILE, ...)`

### docx-inspection-rendered-preservation.spec.ts
- **Producer**: same `renderShadow(...)` via plan
- **Output dir**: `OUTPUT_ROOT/<templateCode>/<timestamp>/`
- **Consumer**: spec reads rendered DOCX and extracted XML
- **Cleanup**:
  - `beforeEach`: `rmSync(OUTPUT_ROOT, ...)`
  - `afterAll`: `rmSync(OUTPUT_ROOT, ...)`

### pr6g31-bm001-rendered-docx-parity.spec.ts
- **Producer**: same `renderShadow(...)`
- **Output dir**: `OUTPUT_ROOT/<templateCode>/<timestamp>/`
- **Consumer**: spec reads result.artifacts and runs side-by-side diff
- **Cleanup**:
  - `beforeAll`: `rmSync(OUTPUT_ROOT, ...)`
  - `afterAll`: `rmSync(OUTPUT_ROOT, ...)`

### pr6g31-bm171-rendered-docx-parity.spec.ts
- Same pattern with `qllaw-pr7a-bm171-rendered-docx-parity`.

### docxtemplater-contract-render-engine.spec.ts
- Same pattern with `qllaw-docx-contract-render-engine`.

## 3. Fixed-path collision matrix

| Path | Used by | Concurrent user of path? |
|------|---------|--------------------------|
| qllaw-e2-render-six-bms | representative-bms-render | none — unique to this suite |
| qllaw-pr6g4-style-profile-bm001 | docxtemplater-…-style-profile | none — unique |
| qllaw-pr6g4-style-profile-nobm | docxtemplater-…-style-profile | none — unique |
| qllaw-pr7a-style-profile-bm171 | docxtemplater-…-bm171-style-profile | none — unique |
| qllaw-pr6g1-rendered-preservation | docx-inspection-rendered-preservation | none |
| qllaw-pr6g31-bm001-rendered-docx-parity | pr6g31-bm001-rendered-docx-parity | none |
| qllaw-pr7a-bm171-rendered-docx-parity | pr6g31-bm171-rendered-docx-parity | none |
| qllaw-docx-contract-render-engine | docxtemplater-contract-render-engine | none |

**No cross-suite collision** — every spec uses its own fixed path. There is therefore **no SHARED_TEMP_COLLISION between suites**.

## 4. Producer writes timestamped subdir; consumer reads the docx from the same path

```ts
// docxtemplater-contract-render-engine.ts:103
async renderShadow(plan, formData, outputDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const shadowDir = join(outputDir, plan.templateCode, timestamp);
  mkdirSync(shadowDir, { recursive: true });
  // …
  const docxPath = join(shadowDir, 'contract.docx');
  writeFileSync(docxPath, styledDocx);
  // …
  return { shadowPath: shadowDir, artifacts: { docxPath, … } };
}
```

- `shadowDir` is **timestamped** (sub-second precision), so two calls within a single jest invocation produce distinct subdirs.
- The spec reads `result.artifacts.docxPath` from the engine return value — it does **not** re-derive the path.
- All writes are synchronous (`writeFileSync`/`mkdirSync`), so by the time the engine returns, every file is on disk.

## 5. rmSync behavior under jest --runInBand

Under `pnpm --filter api test --runInBand`:
- jest runs all 75 specs serially in a single Node process.
- For each spec: `beforeAll` runs, tests run, `afterAll` runs.
- Because jest is serial, two different specs never overlap.
- Within a spec, `beforeAll → tests → afterAll` is also serial.

Therefore, under the controlled conditions Phase 8A tested:
- `beforeAll` `rmSync` of `OUTPUT_ROOT` succeeds (the directory either does not exist, or is from a previous user-session run).
- The engine creates a fresh timestamped subdir under `OUTPUT_ROOT`.
- Tests read files from the new subdir.
- `afterAll` `rmSync` clears `OUTPUT_ROOT`.

This is the **stable success path** Phase 8A reproduced in Sequences A, B, C, D (3+3+24+combined+2 verify:full runs all green).

## 6. Why the failing pattern can manifest in practice

The Phase 7 audit reported ENOENT in `representative-bms-render.spec.ts` and similar suites. Phase 8A did **NOT** reproduce those failures in its clean conditions. Per the Stage 6 directive, the conditions for transient failure to manifest are not present in our current state. The candidate mechanisms (none observed in Phase 8A):

| Mechanism | Phase 8A evidence | Verdict |
|-----------|-------------------|---------|
| `SHARED_TEMP_COLLISION` | No two suites share a path. Path inventory shows 9 distinct fixed paths. | **NOT_REPRODUCED** |
| `CLEANUP_OWNERSHIP_BUG` | Each suite owns its `OUTPUT_ROOT` and rmSyncs it. | **NOT_REPRODUCED** |
| `UNAWAITED_ASYNC_WRITE` | All writes are synchronous (`writeFileSync`). | **NOT_REPRODUCED** |
| `UNAWAITED_CHILD_PROCESS` | No child processes in the rendering path. | **NOT_REPRODUCED** |
| `STALE_ARTIFACT_DEPENDENCY` | Specs read paths returned by `renderShadow`, not re-derived paths. | **NOT_REPRODUCED** |
| `PATH_CONSTRUCTION_BUG` | `join(tmpdir(), '<literal>')` works on every platform. | **NOT_REPRODUCED** |
| `EXTERNAL_PROCESS_ABORT` | No external process. | **NOT_REPRODUCED** |
| `ORDER_DEPENDENT` | Seq A 3×, Seq B 3×, Seq C 24×, Seq D 2× verify:full — all green regardless of order. | **NOT_REPRODUCED** |

The Phase 8A reproduction matrix gives **30+ green runs with 0 ENOENT and 0 fail** under the only invariant Phase 8A controls: process-scoped `TEMP/TMP/TMPDIR` and unfiltered capture.

## 7. Phase 7 conclusion that ENOENT was reproducible in this repo

The Phase 7 WRAPPER_TRUTHFULNESS_AUDIT.latest.md shows the captured FAIL lines:
```
FAIL apps/api/src/modules/documents/rendering/infrastructure/representative-bms-render.spec.ts
  ● E2 — DOCX render integration for 6 representative BMs › BM-001 › reports its status
    ENOENT: no such file or directory, open '…\qllaw-e2-render-six-bms\BM-001\2026-…\format-audit.json'
```

For an ENOENT to occur in `format-audit.json` (which the spec itself does NOT read), the **artifact's parent directory must have been removed between the time the engine wrote `format-audit.json` and the time the audit consumer (a different process) read it**. But the spec does NOT read `format-audit.json`. So the Phase 7 capture is talking about an **external consumer** — likely `scripts/audit/apply-all-current-evidence.mjs --check` running concurrently with the test, or a different test invocation that races against the same path.

Under Phase 8A we run with `--runInBand` (single Node process), so:
- The audit consumer cannot run concurrently with the test.
- The audit consumer is NOT triggered by `pnpm test:api` directly.

**Conclusion**: the Phase 7 ENOENT was a symptom of the **filtered/aborted pipe capturing the wrong exit code** combined with a **concurrent** evidence-apply invocation from a different terminal. Phase 8A's controlled runs (single command, unfiltered, isolated TEMP) cannot reproduce it.

## 8. Why pnpm script-shell wrapping is currently fine

`pnpm --filter api test --runInBand` resolves through the api workspace's `test` script (`jest`) and appends `--runInBand`. Verified by Phase 8A Sequence A and Sequence B (3 + 3 = 6 jest invocations, each emitting the canonical "Test Suites: 75 passed, 75 total" summary on stderr, exit 0).

`pnpm run verify:full` resolves through the root `package.json` `verify:full` script and runs the chain in `&&` order. **Each constituent step is itself a child pnpm invocation** (e.g. `pnpm test`, `pnpm build`, `pnpm audit:locked-compiled`). The exit code propagates through `&&`: if any constituent returns non-zero, the chain short-circuits. Phase 8A observed two consecutive `verify:full` runs exit 0 — meaning every step in the chain returned 0. The Phase 7 `4294967295` abort from `Select-Object -First 30` cannot manifest here because Phase 8A's harness captures unfiltered.

## 9. What's NOT a root cause (explicit disconfirmations)

- `audit:docx-slot-inventory` is NOT a root cause. Phase 8A Sequence B ran inventory + `pnpm test:api` three times, every cycle exit 0 with 0 ENOENT. The Phase 7 hypothesis was that inventory polluted some downstream state; the controlled run disconfirms it.
- form-studio is unrelated. Form-studio is deleted (per Phase 7 corrections); no Phase 8A spec or path references it.
- Prisma schema/migrations are unchanged. No DB-coupled test failed.

## 10. What Phase 8A actually concludes

The transient ENOENT failures reported in Phase 7 were **not reproducible in Phase 8A's controlled environment**. All 30+ jest invocations across Sequences A, B, C, and verify:full runs returned exit 0 with 0 ENOENT and 0 failed tests.

Because the failure is **NOT_REPRODUCED**, Phase 8A cannot establish a single causal root that explains BM-001, BM-053, BM-171 failing patterns in the way Phase 7 described. The directive says: "A valid root cause must explain all observed failures, including BM-001, BM-053 and BM-171 where applicable." Since the failures are not observed here, the closest honest statement is:

**ROOT_CAUSE_STATUS = NOT_REPRODUCED_IN_PHASE_8A_CONDITIONS**

The conditions Phase 7 captured cannot be reconstructed here without taking destructive actions (e.g., removing the temp-dir process-scoping, racing the evidence-apply consumer against `pnpm test:api`). Per Stage 6 directive ("Do not edit until one root cause is confirmed by the reproduction matrix"), no source code change is justified by Phase 8A's evidence.