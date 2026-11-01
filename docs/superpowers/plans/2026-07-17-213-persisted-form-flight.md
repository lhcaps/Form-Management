# 213 Persisted Form Flight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 213 locked BM contracts available through a persisted, contract-native Form Flight lifecycle with evidence for save, reload, DOCX and PDF export.

**Architecture:** Generated per-BM profiles are derived only from compiled locked contracts. A single persisted adapter renders those profiles and saves only through the contract-input route; the legacy DTO route remains isolated. Corpus gates distinguish profile availability, persisted workflow evidence and visual fidelity.

**Tech Stack:** TypeScript, Next.js 16, React 19, NestJS 11, Prisma/MariaDB, `@qllaw/form-contracts`, Playwright and Node test runner.

## Global Constraints

- Do not mutate locked DOCX contracts, Prisma schema, or runtime-preview/persisted-document boundary.
- Clerk ticket + storageState is required for protected browser evidence; never use `qlv_session` as a substitute.
- A profile field must be present in the compiled contract; an unknown field must fail before it reaches the API.
- `ContractFormInputsSaveAdapter` remains the persisted save authority; do not add a 213-wide legacy DTO whitelist.
- Preserve user-owned dirty worktree changes; do not stage, commit, push, or delete unrelated artifacts.
- A green structural contract gate never promotes visual fidelity or client readiness by itself.

---

### Task 1: Define generated persisted-profile status and invariants

**Files:**
- Modify: `apps/web/src/lib/form-flight/types.ts`
- Modify: `apps/web/src/lib/form-flight/profile-status.ts`
- Modify: `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts`
- Test: `apps/web/src/lib/form-flight/generated-profile-invariants.test.ts`

**Interfaces:**
- Produces `FormFlightProfileStatus` values `runtime-ready`, `persisted-ready`, `audit-only`, and `skeleton`.
- Produces `assertProfileInvariant(profile, contractFieldPaths?)` returning an exact error string for duplicate, missing-required, or out-of-contract paths.
- Consumes compiled field paths supplied by the generated registry in Task 3.

- [ ] **Step 1: Write failing invariant tests**

```ts
test("rejects a persisted profile whose required path is absent", () => {
  expect(assertProfileInvariant(profileWithMissingRequired)).toContain("not in fieldPaths");
});
test("rejects a profile field outside its compiled contract", () => {
  expect(assertProfileInvariant(profile, ["document.code"])).toContain("outside compiled contract");
});
```

- [ ] **Step 2: Run the focused test and observe failure**

Run: `pnpm --filter web exec jest src/lib/form-flight/generated-profile-invariants.test.ts --runInBand`

Expected: FAIL because the persisted status and contract-path invariant do not exist.

- [ ] **Step 3: Add the narrow status and invariant implementation**

```ts
export type FormFlightProfileStatus =
  | "runtime-ready" | "persisted-ready" | "audit-only" | "skeleton";

export function assertProfileInvariant(profile, contractFieldPaths = profile.fieldPaths) {
  const contract = new Set(contractFieldPaths);
  for (const path of profile.fieldPaths) if (!contract.has(path)) return `Field path "${path}" is outside compiled contract.`;
  for (const path of profile.requiredFieldPaths) if (!profile.fieldPaths.includes(path)) return `Required field path "${path}" is not in fieldPaths.`;
  return "";
}
```

- [ ] **Step 4: Run focused tests and web typecheck**

Run: `pnpm --filter web exec jest src/lib/form-flight/generated-profile-invariants.test.ts --runInBand; pnpm --filter web exec tsc --noEmit`

Expected: PASS.

### Task 2: Build deterministic profile corpus generator

**Files:**
- Create: `scripts/form-flight/generate-persisted-profiles.mjs`
- Create: `apps/web/src/lib/form-flight/profiles/generated-profiles.ts`
- Create: `docs/audit/unified-bm-workspace/FORM_FLIGHT_PERSISTED_PROFILE_MATRIX.latest.json` (generated)
- Test: `test/form-flight-persisted-profile-generator.test.mjs`

**Interfaces:**
- Produces `GENERATED_PERSISTED_PROFILES: Readonly<Record<string, FormFlightProfile>>` with 213 entries.
- Consumes `docs/audit/docx/compiled-v2/*.compiled.json`.
- Produces a matrix row `{ code, fieldCount, requiredCount, tableCount, contractHash, status }` for every BM.

- [ ] **Step 1: Write failing generator tests**

```js
test("emits exactly one persisted profile for every compiled contract", () => {
  assert.equal(Object.keys(profiles).length, 213);
  assert.equal(matrix.summary.outsideContractPaths, 0);
});
test("keeps BM-006 field paths and required paths equal to its compiled source", () => {
  assert.deepEqual(profileFieldPaths("BM-006"), compiledFieldPaths("BM-006"));
});
```

- [ ] **Step 2: Run generator test and observe failure**

Run: `node --test test/form-flight-persisted-profile-generator.test.mjs`

Expected: FAIL because no generated corpus is imported.

- [ ] **Step 3: Implement deterministic generation from compiled contracts**

```js
const profile = {
  templateCode: compiled.templateCode,
  title: compiled.title,
  profileStatus: "persisted-ready",
  fieldPaths: compiled.source.fields.map((field) => field.key),
  requiredFieldPaths: compiled.requiredFieldKeys,
  demo: {},
  acceptance: { requiredText: [], forbiddenText: ["{{", "}}", "undefined", "null", "[object Object]"] },
};
```

The script must sort by `templateCode`, use stable JSON serialization, reject non-213 corpus counts, and never write a locked contract.

- [ ] **Step 4: Run generator in check mode then generation mode**

Run: `node scripts/form-flight/generate-persisted-profiles.mjs --check; node scripts/form-flight/generate-persisted-profiles.mjs --write`

Expected: `profiles=213`, `outsideContractPaths=0`, and deterministic repeated output.

### Task 3: Register the generated corpus and activate the persisted adapter

**Files:**
- Modify: `apps/web/src/lib/form-flight/registry.ts`
- Modify: `apps/web/src/lib/form-flight/index.ts`
- Create: `apps/web/src/components/documents/form-flight-persisted-inputs.tsx`
- Modify: `apps/web/src/components/documents/generated-document-workspace.tsx`
- Test: `apps/web/src/components/documents/form-flight-persisted-inputs.test.tsx`
- Test: `test/infrastructure/generated-document-workspace-adapter-precedence.guard.test.mjs`

**Interfaces:**
- `FormFlightPersistedInputs({ documentId, templateCode, contract, contractHash, onSaved })` renders one generated profile and saves `{ contractHash, data }` through `savePublishedContractFormInputs`.
- `GeneratedDocumentWorkspace` selects this panel only when generated profile, runtime contract and template code agree.

- [ ] **Step 1: Write failing selection and save tests**

```tsx
render(<FormFlightPersistedInputs documentId="42" templateCode="BM-006" contract={contract} contractHash="hash" />);
await user.click(screen.getByRole("button", { name: "Lưu dữ liệu biểu mẫu" }));
expect(savePublishedContractFormInputs).toHaveBeenCalledWith("42", { contractHash: "hash", data: expect.any(Object) });
```

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `pnpm --filter web exec jest src/components/documents/form-flight-persisted-inputs.test.tsx --runInBand`

Expected: FAIL because the component and generated-profile lookup do not exist.

- [ ] **Step 3: Implement the contract-native panel and resolver**

```tsx
const profile = getFormFlightProfile(templateCode);
if (!profile || profile.profileStatus !== "persisted-ready") return <PublishedContractFormInputsPanel {...props} />;
return <FormFlightPersistedInputs {...props} profile={profile} />;
```

`FormFlightPersistedInputs` must reuse `ContractV2Renderer`, load `render-payload`, call only `savePublishedContractFormInputs`, expose dirty/saving/error state, and preserve `onSaved` refresh behavior.

- [ ] **Step 4: Run component, guard, lint and typecheck tests**

Run: `pnpm --filter web exec jest src/components/documents/form-flight-persisted-inputs.test.tsx --runInBand; node --test test/infrastructure/generated-document-workspace-adapter-precedence.guard.test.mjs; pnpm --filter web lint; pnpm --filter web exec tsc --noEmit`

Expected: PASS.

### Task 4: Add contract-route API and negative-boundary coverage

**Files:**
- Modify: `apps/api/src/modules/documents/rendering/application/generated-input-save-core/generated-input-save.orchestrator.test.ts`
- Create: `apps/api/src/modules/contract-platform/application/contract-form-inputs.service.persisted-profile.spec.ts`
- Test: `tests/e2e/generated-document-form-flight-boundary.auth.spec.ts`

**Interfaces:**
- Contract save accepts only contract paths, rejects stale hash and cross-agency access.
- Persisted workflow never creates a runtime preview session; standalone workflow never creates a generated document.

- [ ] **Step 1: Write failing API and boundary tests**

```ts
await expect(service.save("42", { contractHash, data: { unknown: "x" } }, actor)).rejects.toMatchObject({ code: "CONTRACT_INPUT_VALIDATION_FAILED" });
await expect(page.goto("/templates/BM-006")).not.toTriggerGeneratedDocumentCreation();
```

- [ ] **Step 2: Run the focused API and browser tests**

Run: `pnpm --filter api test -- contract-form-inputs.service.persisted-profile.spec.ts --runInBand; pnpm exec playwright test tests/e2e/generated-document-form-flight-boundary.auth.spec.ts --project "authenticated chromium"`

Expected: FAIL until Task 3 uses the contract route consistently.

- [ ] **Step 3: Make only the minimum API/UI wiring changes required by failures**

Do not add broad legacy DTO decorators. Keep the existing `ContractFormInputsService.save` unknown-field and scope checks as the authority.

- [ ] **Step 4: Re-run focused coverage**

Run: same commands as Step 2.

Expected: PASS with no generated-document row from a runtime preview.

### Task 5: Build 213-BM persisted workflow collector

**Files:**
- Create: `scripts/smoke-persisted-form-flight-213.mjs`
- Create: `test/smoke-persisted-form-flight-213.test.mjs`
- Modify: `package.json`
- Create: `docs/audit/unified-bm-workspace/QLLAW_PERSISTED_FORM_FLIGHT_213.latest.json` (generated)

**Interfaces:**
- `pnpm smoke:forms:persisted:213` writes one immutable row per BM with `save`, `reload`, `docx`, `pdf`, `history`, and `failure` fields.
- The collector requires fresh Clerk bearer tokens, creates isolated batch/document records, and deletes only its own disposable data when cleanup is enabled.

- [ ] **Step 1: Write failing collector contract tests**

```js
assert.equal(report.summary.total, 213);
assert.equal(report.summary.persistedReady, 213);
assert.equal(report.rows.filter((row) => row.failure).length, 0);
```

- [ ] **Step 2: Run test and observe failure**

Run: `node --test test/smoke-persisted-form-flight-213.test.mjs`

Expected: FAIL because no collector/report exists.

- [ ] **Step 3: Implement authenticated collector**

Use the existing Clerk storageState/token provider pattern from `scripts/smoke-forms-runtime-213.mjs`. For each template, call the real persisted create, contract save, render DOCX, convert PDF and history APIs. Record status and artifact metadata without writing fake success rows.

- [ ] **Step 4: Run the collector against a healthy local stack**

Run: `E2E_API_BASE_URL=http://localhost:3111/api/v1 PLAYWRIGHT_BASE_URL=http://localhost:3110 pnpm smoke:forms:persisted:213`

Expected: report contains 213 rows; any failed BM remains a blocker with request ID and exact stage.

### Task 6: Integrate profile and evidence gates without false promotion

**Files:**
- Modify: `scripts/docx-contract/gate-forms-213.cjs`
- Create: `test/form-flight-persisted-gate.test.mjs`
- Modify: `docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_MATRIX.latest.json` (generated only)

**Interfaces:**
- Gate reports distinct `profileCoverage`, `persistedWorkflowCoverage`, `runtimePreviewCoverage`, and `visualFidelityCoverage` fields.
- A missing or stale persisted evidence row fails the persisted coverage gate; it does not alter the locked-contract verdict.

- [ ] **Step 1: Write failing gate tests**

```js
assert.equal(result.persistedWorkflowCoverage.pass, 213);
assert.equal(result.persistedWorkflowCoverage.fail, 0);
assert.equal(result.readyAbsolute, false, "visual fidelity remains independent");
```

- [ ] **Step 2: Run the gate test and observe failure**

Run: `node --test test/form-flight-persisted-gate.test.mjs`

Expected: FAIL because current gate conflates contract lock with workflow readiness.

- [ ] **Step 3: Add separate persisted evidence parsing and fail-closed output**

Read only the collector report from Task 5. Reject wrong corpus count, duplicate BM codes, missing artifacts or report hash mismatch. Never add `--allow-*` behavior for persisted coverage.

- [ ] **Step 4: Run all 213 gates**

Run: `pnpm gate:forms:213; node --test test/form-flight-persisted-gate.test.mjs`

Expected: contract gate and persisted workflow gate expose separate, truthful states.

### Task 7: Completion verification for this workstream

**Files:**
- Review: `docs/audit/unified-bm-workspace/FORM_FLIGHT_PERSISTED_PROFILE_MATRIX.latest.json`
- Review: `docs/audit/unified-bm-workspace/QLLAW_PERSISTED_FORM_FLIGHT_213.latest.json`
- Review: `docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_MATRIX.latest.json`

- [ ] **Step 1: Run quality gates**

Run: `CI=true pnpm verify:quick; CI=true pnpm test; CI=true pnpm build`

Expected: PASS.

- [ ] **Step 2: Run authenticated persisted acceptance evidence**

Run: `pnpm smoke:forms:persisted:213`

Expected: 213/213 save, reload, DOCX, PDF and history rows; no fake PASS.

- [ ] **Step 3: Inspect blockers honestly**

Run: `pnpm gate:forms:213; pnpm audit:213-remediation-readiness`

Expected: report separate remaining worktree, Docker-secret, dependency-advisory and visual-fidelity blockers from persisted profile completion.
