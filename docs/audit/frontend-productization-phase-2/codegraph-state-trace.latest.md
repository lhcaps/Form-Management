# CodeGraph State Trace — Frontend Productization Phase 2

## Q1: Which component owns formData for published contracts?

**Answer:** `PublishedContractFormInputsPanel` (`apps/web/src/components/documents/published-contract-form-inputs.tsx`)

State ownership:
- `data` — `useState<Record<string, unknown>>({})` (line 26)
- `loading` — `useState(true)` (line 27)
- `saving` — `useState(false)` (line 28)
- `message` — `useState("")` (line 29)
- `error` — `useState("")` (line 30)
- `fieldErrors` — `useState<Record<string, string>>({})` (line 31)

## Q2: Which component owns formData for BM-specific panels?

**Answer:** Currently, the runtime path for all 213 DB-published forms goes through `PublishedContractFormInputsPanel` via `GeneratedDocumentWorkspace`. BM-specific panels (e.g., `bm-004-form-inputs.tsx`) are used in `FormStudioWorkspace` (authoring mode) only, NOT in the document viewing/editing mode.

## Q3: Which path is actually used by current DB-published 213 forms?

**Answer:** `GeneratedDocumentWorkspace` → `PublishedContractFormInputsPanel` → `ContractV2Renderer`

Flow:
1. `GeneratedDocumentWorkspace` fetches render payload from `/documents/generated/[id]`
2. Passes `contract` (CompiledFormContract) and `contractHash` to `PublishedContractFormInputsPanel`
3. `PublishedContractFormInputsPanel` fetches `/documents/generated/[id]/render-payload` for initial data
4. `ContractV2Renderer` renders fields and calls `onChange` to update local `data`

## Q4: Does PublishedContractFormInputsPanel have enough state to apply sample data?

**Answer:** YES

- `data` is local state — can be modified directly
- `contract` prop provides `templateCode` and `source.fields`
- `loading` prevents premature actions
- No external state management dependency

## Q5: Is PublishedContractFormInputsPanel the correct insertion point?

**Answer:** YES

- It is the sole owner of `data` for published contracts
- It has access to `contract.templateCode` and `contract.source.fields`
- It has the save button — sample mode indicator can live here
- BM-specific panels are NOT in the runtime path for DB-published forms

## Q6: How is save implemented?

**Answer:** `PublishedContractFormInputsPanel.save()` function (lines 58-111)

1. Validates required fields
2. PUT to `/documents/generated/${documentId}/contract-form-inputs` with `{ contractHash, data }`
3. Shows success/error message
4. Calls `onSaved?.()` callback

## Q7: How is reload implemented?

**Answer:** `useEffect` in `PublishedContractFormInputsPanel` (lines 33-56)

1. On `documentId` or `contractHash` change, fetches `/documents/generated/${documentId}/render-payload`
2. Merges `payload.formInputs` with `payload.renderPayloadOverrides`
3. Sets `data` state — this is the reload behavior

## Q8: How is export implemented?

**Answer:** Export is handled in `GeneratedDocumentWorkspace` via `GeneratedDocumentActionPanel`:
- `ContractPreviewPanel` for preview
- Export to DOCX/PDF via backend endpoints
- Sample data values are saved as regular form data, so exports will contain them

## Q9: What exact type/shape does compiled contract use for fields?

**Answer:** `CompiledFormContract` from `@qllaw/form-contracts`:
- `source.fields: FieldDefinition[]`
- `source.sections: SectionDefinition[]`
- `templateCode: string`
- `version: number`

`FieldDefinition` shape:
```typescript
interface FieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  dataSource?: { kind?: string };
}
```

## Q10: How can getSampleData(templateCode, fields) be called without type hacks?

**Answer:** The function signature is:
```typescript
getSampleData(
  templateCode: string,
  contractFields?: Array<{
    key: string;
    label: string;
    required?: boolean;
    dataSource?: { kind?: string };
  }>
): SampleData
```

`contract.source.fields` already matches the required shape:
```typescript
contract.source.fields.map(f => ({
  key: f.key,
  label: f.label,
  required: f.required,
  dataSource: f.dataSource,
}))
```

No type casts needed — direct pass-through.

## Summary: Sample Prefill Implementation Strategy

**Target file:** `apps/web/src/components/documents/published-contract-form-inputs.tsx`

**Implementation:**
1. Add `sampleMode` state: `useState(false)`
2. Add "Điền dữ liệu mẫu" button near save button
3. Button handler:
   - Call `getSampleData(contract.templateCode, contract.source.fields)`
   - Call `mergeWithSampleData(data, sample)`
   - `setData(merged)`
   - `setSampleMode(true)`
4. Show banner when `sampleMode === true`
5. After successful save, clear `sampleMode`

**Preserve-user-value behavior:** `mergeWithSampleData` already implements preserve-empty-only semantics.
