# CodeGraph Frontend Architecture Map — QUANLYVKS Frontend Audit V1

> Generated: 2026-06-30

## Route Map

### Primary Routes (Next.js App Router)

| Route | Component | Purpose | Status |
|-------|-----------|---------|--------|
| `/` | Root redirect | Entry point | Active |
| `/templates` | `template-selector-workspace.tsx` | Template selector + search | Active |
| `/documents/[id]` | `generated-document-workspace.tsx` | Generated document form editor | Active |
| `/reports` | `reports/page.tsx` | Reports dashboard | Active |
| `/cases` | `cases/page.tsx` | Case management | Active |
| `/admin/form-studio` | `form-studio-workspace.tsx` | Form Studio (admin only) | Active |
| `/admin/form-studio/permissions` | Admin permissions | Admin | Active |

## Component Architecture

### Core Components

```
apps/web/src/
├── app/
│   ├── templates/page.tsx            → TemplateSelectorWorkspace
│   ├── documents/[id]/page.tsx       → GeneratedDocumentWorkspace
│   ├── reports/page.tsx              → ReportsPage
│   ├── cases/page.tsx                → Case management
│   ├── admin/form-studio/page.tsx    → FormStudioWorkspace
│   └── admin/form-studio/permissions/page.tsx
│
├── components/
│   ├── documents/
│   │   ├── template-selector-workspace.tsx     [1254 lines] - Main template selector
│   │   ├── generated-document-workspace.tsx      [726 lines] - Document form editor
│   │   ├── published-contract-form-inputs.tsx     [163 lines] - Contract runtime panel
│   │   ├── generic-template-form-inputs.tsx      - Generic form inputs
│   │   ├── bm-*-form-inputs.tsx (150+ files)   - Specific BM form inputs
│   │   └── generated-document-action-panel.tsx    - Export/print actions
│   │
│   ├── layout/
│   │   ├── app-shell.tsx            - Main app shell
│   │   ├── sidebar.tsx               - Sidebar navigation
│   │   └── topbar.tsx                - Top bar
│   │
│   ├── common/
│   │   ├── status-badge.tsx         - Status chips
│   │   ├── error-banner.tsx          - Error display
│   │   ├── loading-state.tsx        - Loading spinner
│   │   ├── empty-state.tsx           - Empty state
│   │   ├── confirm-dialog.tsx         - Confirmation dialog
│   │   └── page-shell.tsx            - Page wrapper
│   │
│   └── ui/                           - shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       └── ...
│
├── features/
│   └── forms-contracts/
│       ├── sample-data.ts            [577 lines] - Sample data provider
│       ├── sample-generator.ts        [383 lines] - Sample generator
│       ├── ContractV2Renderer.tsx    - Contract form renderer
│       ├── ContractPreviewPanel.tsx  - Contract preview
│       └── index.ts
│
└── lib/
    ├── api-client.ts                 - API client
    ├── documents-api.ts             - Document API
    ├── generated-documents-api.ts    - Generated document API
    ├── templates-api.ts              - Template API
    ├── cases-api.ts                 - Case API
    ├── form-studio-api.ts           - Form Studio API
    ├── vks-template-catalog.ts      [3200+ lines] - Template catalog
    ├── form-platform-catalog.ts       - Platform catalog
    ├── bm-auto-populate/            - BM field mapping
    │   ├── central-adapter.ts
    │   ├── bm-field-map.ts
    │   └── use-apply-case-payload.ts
    └── reports-export.ts             - Report export utilities
```

## Data Flow Summary

### Template Selector Flow
```
User opens /templates
    ↓
loadDbTemplates() → GET /templates/db
loadCatalog() → GET /form-studio/catalog
    ↓
scoreTemplate() → Calculate recommendations based on input
    ↓
visibleCatalogGroups → Grouped by stage
    ↓
openTemplate() → createBatchForCase() → POST /documents/batch
    ↓
router.push(/documents/{generatedDocumentId})
```

### Document Form Editor Flow
```
User opens /documents/{id}
    ↓
fetch /documents/generated/{id}/render-payload
    ↓
CasePayloadProvider → buildCasePayloadFromRenderPayload()
    ↓
Select BM Panel (BM_PANEL_BY_CODE[templateCode])
    ↓
Render form (PublishedContractFormInputsPanel | BM-specific panel)
    ↓
save() → PUT /documents/generated/{id}/contract-form-inputs
```

### Sample Prefill Flow (CURRENTLY NOT WIRED)
```
User clicks "Điền dữ liệu mẫu" [BUTTON NOT IMPLEMENTED]
    ↓
getSampleData(templateCode, contractFields)
    ↓
mergeWithSampleData(existingData, sample)
    ↓
Update form state with merged data
    ↓
Set sample mode indicator
```

**CRITICAL FINDING**: The sample prefill infrastructure exists but NO UI button triggers it.

## State Ownership

| State | Owner | Location |
|-------|-------|----------|
| Template list | `useState<DbTemplate[]>` | template-selector-workspace.tsx |
| Current case | `useState<string\|null>` | template-selector-workspace.tsx |
| Form data | `useState<Record<string, unknown>>` | Each BM panel |
| Document payload | `useState<RenderPayloadResponse>` | generated-document-workspace.tsx |
| Active tab | `useState<TabKey>` | generated-document-workspace.tsx |

## API Calls

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/templates/db` | GET | Load DB templates |
| `/form-studio/catalog` | GET | Load platform catalog |
| `/documents/batch` | POST | Create document batch |
| `/documents/generated/{id}` | GET | Load document |
| `/documents/generated/{id}/render-payload` | GET | Load render payload |
| `/documents/generated/{id}/contract-form-inputs` | PUT | Save form data |
| `/documents/generated/{id}/history` | GET | Load document history |
| `/cases?pageSize=100` | GET | Load case options |
| `/cases/reports/summary` | GET | Load report data |
| `/document-review-queue` | GET | Load review queue |

## Sample Data Touchpoints

| File | Function | Status |
|------|----------|--------|
| `sample-data.ts` | `getSampleData()` | Defined, not called from UI |
| `sample-data.ts` | `mergeWithSampleData()` | Defined, not called from UI |
| `sample-data.ts` | `generateSampleFromFields()` | Exported for tests |
| `sample-generator.ts` | `generateSampleFromFields()` | Generator logic |
| `sample-generator.ts` | `auditSampleCoverage()` | Coverage audit helper |

## Save/Export Touchpoints

| File | Function | Usage |
|------|----------|-------|
| `published-contract-form-inputs.tsx` | `save()` | PUT contract-form-inputs |
| `generated-document-action-panel.tsx` | Export actions | DOCX/PDF generation |
| `reports-export.ts` | `buildReportCsv()` | CSV export |
| `reports-export.ts` | `buildReportPrintHtml()` | Print/PDF export |

## Debug Leakage Points

| Location | Issue | Severity |
|----------|-------|----------|
| `template-selector-workspace.tsx:852` | "Biểu mẫu trong DB" | P1 |
| `template-selector-workspace.tsx:879` | "Catalog API" | P1 |
| `template-selector-workspace.tsx:1003` | `{templateCatalogMeta.sourceZip}` | P1 |
| `published-contract-form-inputs.tsx:117` | "Contract runtime" label | P1 |
| `published-contract-form-inputs.tsx:120` | `{contractHash}` in monospace | P1 |
| `generated-document-workspace.tsx:643` | "Mã biểu mẫu" with `#{documentId}` | P1 |
| `form-platform-catalog.ts:83,85` | "Published contract" badges | P2 |

## Tests Currently Covering

| Area | Test Location | Coverage |
|------|---------------|----------|
| API error handling | `api-client.test.ts` | 8 tests |
| Case payload application | `central-adapter.test.mjs` | 16 tests |
| BM field mapping | `bm-field-map.test.ts` | 25 bespoke + 4 flat |
| Form schema fetch | `form-schema-client.test.ts` | 3 tests |
| Error parsing | `form-validation-errors.test.ts` | 8 tests |
| Report generation | `reports-export.test.ts` | 2 tests |

## Missing Tests

| Area | Priority | Notes |
|------|----------|-------|
| Template selector workflow | P1 | No E2E for search/filter/open |
| Sample prefill button | P0 | No tests for prefill flow |
| Save/reload persistence | P1 | No tests for save → reload |
| Export flow | P1 | No tests for DOCX/PDF export |
| Debug info visibility | P1 | No tests for debug flag behavior |
| Section label localization | P2 | No tests for raw key display |

## Files Requiring Changes (Phase 2)

### P0 Priority
1. `apps/web/src/components/documents/template-selector-workspace.tsx` — Add sample prefill button
2. `apps/web/src/components/documents/generated-document-workspace.tsx` — Wire sample data
3. `apps/web/src/features/forms-contracts/sample-data.ts` — Already exists, needs UI wiring

### P1 Priority
4. `apps/web/src/components/documents/published-contract-form-inputs.tsx` — Hide debug info
5. `apps/web/src/components/documents/template-selector-workspace.tsx` — Clean debug labels
6. `apps/web/src/components/documents/generated-document-workspace.tsx` — Clean debug labels
7. `apps/web/src/lib/form-platform-catalog.ts` — Clean "Published contract" badges

### P2 Priority
8. `apps/web/src/components/common/page-shell.tsx` — Create shared layout
9. `apps/web/src/components/ui/` — Unify button/card/badge styles
10. `apps/web/src/components/layout/` — Create shared navigation
