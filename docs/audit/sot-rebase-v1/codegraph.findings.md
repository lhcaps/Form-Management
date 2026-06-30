# CodeGraph Findings — SOT_REBASE_V1

## Query A — normalized DOCX Loading Path

### How normalized DOCX is loaded at runtime

**File:** `apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts`

The render engine loads normalized DOCX at runtime via:

```typescript
private async loadTemplate(templateCode: string): Promise<Buffer> {
  const normalizedTemplateRoot = join(
    this.workspace.normalizedTemplatesRoot,
    templateCode,
  );
  const templatePath = join(
    normalizedTemplateRoot,
    `${templateCode}_normalized.docx`,
  );
  return readFileSync(templatePath);
}
```

**Path:** `storage/templates/normalized-docx/{templateCode}/{templateCode}_normalized.docx`

**Key insight:** Runtime uses normalized DOCX directly — not locked contracts — as the template source. The locked contract's `extractionSource.relativePath` references this same normalized DOCX.

---

## Query B — Locked Contract Schema and Consumers

### Locked contract schema (V1)

**File:** `docs/audit/docx/contracts/locked/BM-050__*.contract.locked.json`

Schema version: `1.0` (V1). Key fields:

- `docxSlots[]` — placeholder locations in normalized DOCX
  - `slotId` — semantic placeholder name (e.g., `agency.tenVien`)
  - `label` — human-readable label (e.g., `"Ô trống"`)
  - `evidence.rawPattern` — original DOCX placeholder (e.g., `{{document.field1}}`)
  - `reviewRequired` — whether needs human review
- `canonicalFields[]` — form input fields
  - `path` — field path (e.g., `agency.tenVien`)
  - `label` — field label
  - `rawPattern` — source placeholder
- `renderBindings[]` — field-to-slot mappings (V1 shape: `{slotId, from, transform}`)
- `formInputHints` — UI hint for form renderer
- `productMetadata` — review state

### V1→V2 adapter

**File:** `packages/form-contracts/src/v1-adapter.ts`

```typescript
adapted.renderBindings = (contract.renderBindings ?? []).map(
  (binding, index) => ({
    id: `binding-${index + 1}`,
    target: { kind: "SLOT", slotId: binding.slotId },
    source: { kind: "FIELD", fieldKey: binding.from },
    transform: binding.transform || "identity",
    fallback: binding.fallback ?? "",
  }),
);
```

V1 `renderBindings[].slotId` is used directly as V2 `target.slotId`.

### Runtime usage

**File:** `apps/api/src/modules/form-studio/application/runtime-form-contract.service.ts`

`RuntimeFormContractService.resolve()` loads from:
1. DB PUBLISHED (prefer)
2. File-based locked contract (fallback via `fileContracts.findByIdentifier()`)

When from file: `adaptV1Contract()` → `compileContract()` → `artifact`

---

## Query C — compiled-v2 Generation and Consumers

### Generation

**File:** `packages/form-contracts/scripts/compile-contracts.ts`

```typescript
for (const file of lockedContractFiles()) {
  const { result } = compileFile(file);
  fs.writeFileSync(outputFile, `${stableStringify(result.artifact)}\n`);
}
```

**Output:** `docs/audit/docx/compiled-v2/{templateCode}.compiled.json`

### Compilation

```typescript
// workspace.ts
export function compileFile(file: string) {
  const result = compileContract(readAsV2(file));
  return { file, result };
}

// compiler.ts
export function compileContract(contract: FormContractV2): CompileResult {
  const contractHash = stableHash({ ...contract, contractHash: "" });
  // ...
  renderPlan: { bindings: contract.renderBindings, ... }
}
```

`compileContract` takes `contract.renderBindings` directly from the adapted V2 contract.

### Consumers

- `audit-contract-sync.mjs` — reads `contractHash` from compiled-v2, compares to DB
- **Does NOT** compare compiled-v2 `renderPlan.bindings` against locked `docxSlots`

---

## Query D — DB Publish Flow

**File:** `scripts/docx-contract/publish-locked-contracts-to-db.mjs`

Copies `compiled-v2/*.compiled.json` content into `form_contract_versions.compiled_json` in DB.

After publish, DB row's `compiled_json.contractHash` matches the published compiled-v2 artifact.

---

## Query E — Render Engine Fallback

**File:** `docxtemplater-contract-render-engine.ts`

```typescript
const boundKeys = new Set(plan.bindings.map((b) => b.slotId));
for (const [key, value] of Object.entries(formData)) {
  if (boundKeys.has(key)) continue;
  if (value !== undefined && value !== null && value !== '') {
    bindingMap.set(key, String(value)); // fallback for unbound placeholders
  }
}
```

**Fallback behavior:** unbound DOCX placeholders get filled from raw `formData`. This means a stale binding like `document.fullDocumentCode8 → slot(document.fullDocumentCode8)` would fail silently (render as empty or undefined) because `formData` likely doesn't have `fullDocumentCode8`.

---

## Query F — audit-contract-sync Limitation

Confirmed: `audit-contract-sync` compares `compiled-v2.contractHash` against `DB.PUBLISHED.compiled_json.contractHash`. It does NOT compare `compiled-v2.renderPlan.bindings` against `locked.docxSlots`. This was verified by reading the script source.

---

## Query G — formInputHints Usage

**Found:** `formInputHints` is stored in locked contracts but **NOT consumed at runtime** by the form renderer or docxtemplater. It is:
- Part of the V1 schema
- Persisted through V1→V2 adaptation
- Written to compiled-v2 as metadata
- **Not referenced by any rendering, form-input, or DB publish code**

This means `formInputHints.stale` paths in locked contracts have **no runtime impact** — they are stale metadata that was not cleaned up after semanticization.

---

## Query H — existing Atlas Scripts

- `scripts/audit/refresh-213-docx-fidelity-board.mjs` — renders all 213, checks fidelity
- `scripts/audit/audit-contract-sync.mjs` — compares compiled-v2 ↔ DB
- `scripts/audit/render-form-fidelity-gate.mjs` — per-template render gate

None of these audit the semantic consistency of locked contract evidence fields.

---

## Conclusion

CodeGraph confirms:

1. **Normalized DOCX** = structural SOT (runtime loads it directly)
2. **Locked contracts** = semantic SOT (but evidence fields can be stale)
3. **compiled-v2** = derived artifact (generated from locked, can be stale)
4. **DB** = runtime published copy (matches compiled-v2 hash)
5. **formInputHints** = stale metadata with no runtime impact
6. **audit-contract-sync** = cannot detect compiled-v2 vs locked mismatch
7. **render fallback** = masks stale bindings at runtime (won't crash, just fills wrong)
