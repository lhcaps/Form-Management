# QLLaw Route/Surface Audit

**Audit Date:** 2026-07-03
**Purpose:** Map all routes and surfaces with UX/UI assessment

---

## Surface Inventory

| # | Route | Component/File | Primary User Job | Framework | Status |
|---|-------|----------------|------------------|-----------|--------|
| 1 | `/` | `app/page.tsx` | Dashboard overview | Next.js Page | REVIEWED |
| 2 | `/cases` | `app/cases/page.tsx` | Case list | Next.js Page | PARTIAL |
| 3 | `/cases/[caseId]` | `app/cases/[caseId]/page.tsx` | Case detail | Next.js Dynamic | PARTIAL |
| 4 | `/documents` | `app/documents/page.tsx` | Document creation | Next.js Page | UNKNOWN |
| 5 | `/documents/[documentId]` | `app/documents/[documentId]/page.tsx` | Persisted document | Next.js Dynamic | REVIEWED |
| 6 | `/templates` | `app/templates/page.tsx` | Review queue | Next.js Page | REVIEWED |
| 7 | `/templates/[templateCode]` | `app/templates/[templateCode]/page.tsx` | Runtime template | Next.js Dynamic | REVIEWED |
| 8 | `/admin/auth/identities` | `app/admin/(shared)/auth/identities/page.tsx` | Admin identity linking | Next.js Page | REVIEWED |
| 9 | `/admin/form-studio` | `app/admin/(shared)/form-studio/page.tsx` | Form Studio admin | Next.js Page | UNKNOWN |
| 10 | `/imports` | `app/imports/page.tsx` | Data import | Next.js Page | UNKNOWN |
| 11 | `/reports` | `app/reports/page.tsx` | Reports | Next.js Page | UNKNOWN |
| 12 | `/settings` | `app/settings/page.tsx` | Settings | Next.js Page | UNKNOWN |
| 13 | `/sign-in` | `app/sign-in/[[...sign-in]]/page.tsx` | Clerk auth | Clerk Catch-all | REVIEWED |
| 14 | `/sign-up` | `app/sign-up/[[...sign-up]]/page.tsx` | Clerk registration | Clerk Catch-all | UNKNOWN |
| 15 | `/healthz` | `app/healthz/route.ts` | Health check | API Route | N/A |

---

## Detailed Surface Assessment

### 1. Dashboard (`/`)

**File:** `apps/web/src/app/page.tsx`
**Status:** REVIEWED

| Aspect | Finding |
|--------|---------|
| **Layout** | Custom layout — does NOT use `PageShell` |
| **Visual** | `rounded-lg border border-slate-200 bg-white p-4` for KPI cards — inconsistent with `rounded-3xl p-6` PageSection |
| **AI Slop** | LOW — KPI cards use inline `bg-blue-50 text-blue-700` pattern (generic dashboard look) |
| **Accessibility** | Skip link in layout; KPI values use high-contrast text |
| **Responsive** | `md:grid-cols-4` for KPIs, `xl:grid-cols-[1.3fr_1fr]` for main layout |
| **Issues** | Custom layout vs PageShell inconsistency; hardcoded status tones |

**Components Used:**
- `ErrorBanner` (shared)
- `LoadingState` (shared)
- Custom `<article>` for KPI cards
- Custom `<Link>` for module cards
- Custom `<Link>` for activity items

**Suggested Treatment:**
- Migrate to `PageSection` for KPI cards
- Create `KpiCard` shared component
- Use `StatusBadge` for KPI status tones

---

### 2. Cases List (`/cases`)

**File:** `app/cases/page.tsx`
**Status:** PARTIAL (not fully inspected)

| Aspect | Finding |
|--------|---------|
| **Layout** | Custom page layout |
| **Visual** | Uses `rounded-full` for status badges; `rounded-lg` for cards |
| **AI Slop** | LOW — standard case list UI |
| **Accessibility** | Table semantics assumed |
| **Responsive** | Assumed responsive |

**Suggested Treatment:**
- Adopt `PageShell`/`PageSection`
- Use `StatusBadge` for status display
- Standardize on `rounded-2xl` for cards

---

### 3. Case Detail (`/cases/[caseId]`)

**File:** `app/cases/[caseId]/page.tsx`
**Component:** `case-detail-workspace.tsx`
**Status:** PARTIAL

| Aspect | Finding |
|--------|---------|
| **Layout** | Custom workspace |
| **Visual** | Uses `rounded-full` for status badges; custom workspace layout |
| **AI Slop** | LOW |
| **Accessibility** | Assumed correct |
| **Responsive** | Assumed responsive |

**Suggested Treatment:**
- Review status badge usage for consistency
- Audit shadow usage for consistency

---

### 4. Document Creation (`/documents`)

**File:** `app/documents/page.tsx`
**Status:** UNKNOWN (requires runtime inspection)

---

### 5. Generated Document Workspace (`/documents/[documentId]`)

**File:** `app/documents/[documentId]/page.tsx`
**Component:** `generated-document-workspace.tsx`
**Status:** REVIEWED

| Aspect | Finding |
|--------|---------|
| **Layout** | Custom workspace with tabs (Preview/History) |
| **Visual** | `rounded-2xl border shadow-sm` for sections — mostly consistent with PageSection |
| **AI Slop** | LOW — clean, functional UI |
| **Accessibility** | Tabbed interface with Radix |
| **Responsive** | Responsive design assumed |
| **Issues** | Template badges use `rounded-full`; some hardcoded status colors |

**Sub-components:**
- `GeneratedDocumentPreviewPanel` — PDF/DOCX preview
- `GeneratedDocumentAuditPanel` — audit history
- `GeneratedDocumentActionPanel` — document actions

**Strengths:**
- Correctly separates preview from history
- Clean action panel layout
- Semantic status badges via `StatusBadge` component

**Suggested Treatment:**
- Review template badge styling
- Consolidate any hardcoded status colors

---

### 6. Review Queue (`/templates`)

**File:** `app/templates/page.tsx`
**Component:** `review-queue-item-card.tsx`
**Status:** REVIEWED

| Aspect | Finding |
|--------|---------|
| **Layout** | Grid layout of review cards |
| **Visual** | `rounded-3xl border shadow-sm hover:shadow-md` — consistent with PageSection |
| **AI Slop** | LOW — functional card design |
| **Accessibility** | `aria-label` on review cards; download buttons have labels |
| **Responsive** | Grid with `sm:grid-cols-2 lg:grid-cols-3` |

**Component:** `ReviewQueueItemCard`
- Template code badge
- Status badge (via `StatusBadge`)
- File availability badge
- Download links
- Action buttons (approve, request revision, cancel)

**Strengths:**
- Uses `StatusBadge` correctly
- Clean card design
- Functional hover states

**Suggested Treatment:**
- Review hover shadow (`hover:shadow-md`) for consistency
- Standardize badge radius if needed

---

### 7. Template Preview Workspace (`/templates/[templateCode]`)

**File:** `app/templates/[templateCode]/page.tsx`
**Component:** `template-preview-workspace.tsx`
**Status:** REVIEWED

| Aspect | Finding |
|--------|---------|
| **Layout** | Runtime DOCX/Preview session |
| **Visual** | `rounded-3xl p-7 shadow-sm` header — slightly larger than PageSection (`p-6`) |
| **AI Slop** | LOW — functional workspace design |
| **Accessibility** | Proper state management; honest UX copy |
| **Responsive** | Responsive assumed |
| **Issues** | Header padding inconsistency; sticky action bars duplicated in 100+ BM forms |

**Key UX Decisions (Correct):**
- ✅ Honest copy: "Đã tạo file DOCX tạm thời" vs "Đã tạo bản xem trước"
- ✅ Save-to-case CTA disabled when feature not implemented
- ✅ No "Lịch sử xử lý" link in standalone mode
- ✅ PDF preview note when unavailable

**Sub-components:**
- `RuntimePdfPreview` — inline PDF preview
- `ContractV2Renderer` — form contract renderer
- BM form components (100+)

**Suggested Treatment:**
- Reduce header padding: `p-7` → `p-6`
- Extract sticky action bar to shared `FormActionBar`
- Standardize template badge styling

---

### 8. Admin Auth Identities (`/admin/auth/identities`)

**File:** `app/admin/(shared)/auth/identities/page.tsx`
**Status:** REVIEWED

| Aspect | Finding |
|--------|---------|
| **Layout** | Custom page layout — does NOT use `PageShell` |
| **Visual** | Custom inline buttons with hardcoded colors; hand-built modals |
| **AI Slop** | MEDIUM — `bg-[#123B66]` hardcoded; custom modals instead of Dialog |
| **Accessibility** | Some `aria-label` on buttons; search input has focus states |
| **Responsive** | Assumed responsive |

**Issues Found:**
1. `bg-[#123B66]` on link button → should use `variant="default"`
2. `bg-rose-600` on unlink button → should use `variant="destructive"`
3. Custom modal at line 200 instead of `Dialog` component
4. Custom modal at line 388 instead of `Dialog` component
5. Custom refresh/search/link/unlink icons instead of Lucide

**Suggested Treatment:**
- Use shared `Button` component with semantic variants
- Replace custom modals with `Dialog` component
- Replace inline SVG icons with Lucide
- Consider adopting `PageShell`

---

### 9. Form Studio (`/admin/form-studio`)

**File:** `app/admin/(shared)/form-studio/page.tsx`
**Component:** `form-studio-workspace.tsx`
**Status:** UNKNOWN (large complex component)

**Notes:**
- Three-pane layout (structure, canvas, inspector)
- Drag-and-drop with `@dnd-kit`
- Admin-only surface

**Suggested Treatment:**
- Review in detail when Phase 3 planning begins
- Any shared component changes need careful consideration for editor integrity

---

### 10-12. Imports, Reports, Settings

**Status:** UNKNOWN (not inspected)

**Suggested Treatment:**
- Inspect in detail for Phase 2

---

### 13. Sign-In (`/sign-in`)

**File:** `app/sign-in/[[...sign-in]]/page.tsx`
**Component:** `auth-shell.tsx`
**Status:** REVIEWED

| Aspect | Finding |
|--------|---------|
| **Layout** | Two-column: brand left, form right |
| **Visual** | Dark gradient left panel; `bg-[#f6f8fb]` right panel |
| **AI Slop** | LOW — gradient is acceptable brand identity |
| **Accessibility** | Clerk handles a11y |
| **Responsive** | Grid collapses on mobile; form centered |

**Strengths:**
- Clean auth layout
- Proper branding
- Trust badges with Lucide icons

**Issues:**
1. Gradient hardcoded: `bg-[linear-gradient(135deg,#07111f_0%,#0b1730_58%,#103257_100%)]`
2. Will not adapt to dark mode

**Suggested Treatment:**
- Convert gradient to CSS variable for dark mode support

---

## Workspace Boundary Audit

Per PROJECT_SPEC.md section 6:

| Surface | Type | Boundary Correct? | Evidence |
|---------|------|-------------------|----------|
| `/templates/[code]` | Runtime DOCX/Preview Session | ✅ YES | No `generated_documents` rows, no history tab |
| `/documents/[id]` | Persisted Generated Document | ✅ YES | Has preview/history/audit, DB rows |
| Runtime template workspace | Standalone | ✅ YES | `previewSession` state, honest UX copy |
| Generated document workspace | Persisted | ✅ YES | Audit panel, history tab, DB persistence |

**Observation:** The runtime vs persisted workspace boundary is correctly implemented in the UX. No mixing detected.

---

## Visual Consistency Map

```
Surface                    | Radius    | Border    | Shadow    | Padding
--------------------------|-----------|-----------|-----------|--------
PageSection (canonical)   | 3xl (16px)| slate-200 | shadow-sm | p-6
EmptyState                | 3xl       | slate-200 | shadow-sm | p-10
LoadingState              | 3xl       | slate-200 | shadow-sm | varies
TemplatePreview header    | 3xl       | slate-200 | shadow-sm | p-7 ⚠️
ReviewQueueItemCard       | 3xl       | slate-200 | shadow-sm | p-5
GeneratedDoc sections     | 2xl (12px)| slate-200 | shadow-sm | p-6
BM form meta bar          | 3xl       | slate-200 | shadow-sm | p-5-6
BM form sticky bar        | 2xl       | slate-200 | shadow-lg/xl | p-3-5 ⚠️
Dashboard KPI cards       | lg (8px)  | slate-200 | none      | p-4 ⚠️
Dashboard module links     | lg        | slate-200 | none      | p-4 ⚠️
Nav items                 | [18px]    | none      | none      | px-3.5 ⚠️
Admin table               | none      | slate-200 | none      | varies
```

**Legend:** ✅ Consistent | ⚠️ Inconsistent

---

## Component Dependency Graph (Key Surfaces)

```
AppShell
├── Sidebar (nav-items.tsx)
├── Topbar (topbar.tsx)
└── Page Content
    ├── Dashboard (page.tsx)
    │   ├── ErrorBanner
    │   ├── LoadingState
    │   └── Custom KPI cards ⚠️
    ├── Cases (cases/page.tsx)
    │   └── Custom layout ⚠️
    ├── Documents (documents/page.tsx)
    ├── TemplatePreviewWorkspace (/templates/[code])
    │   ├── TemplatePreview header
    │   ├── RuntimePdfPreview
    │   ├── ContractV2Renderer
    │   │   └── [bm-*-form-inputs.tsx] ⚠️ 100+ files
    │   │       └── Sticky action bar ⚠️ (duplicated)
    │   └── PreExportCustomizationPanel
    ├── GeneratedDocWorkspace (/documents/[id])
    │   ├── GeneratedDocumentPreviewPanel
    │   ├── GeneratedDocumentActionPanel
    │   ├── GeneratedDocumentAuditPanel
    │   └── [bm-*-form-inputs.tsx]
    ├── ReviewQueue (/templates)
    │   └── ReviewQueueItemCard
    ├── AdminAuthIdentities (/admin/auth/identities)
    │   ├── Custom table ⚠️
    │   └── Custom modals ⚠️
    └── FormStudio (/admin/form-studio)
        └── FormStudioWorkspace
```

---

## Risk Assessment by Surface

| Surface | Change Risk | Reason |
|---------|-------------|--------|
| Dashboard KPI cards | MEDIUM | Layout change affects all users |
| BM form action bars | MEDIUM | 100+ files, high visual impact |
| Nav sidebar | LOW | Single file, clear change |
| Admin auth identities | LOW | Low-traffic surface |
| Template preview workspace | MEDIUM | High visibility |
| Generated document workspace | LOW-MEDIUM | Medium visibility |
| Review queue | LOW | Consistent with PageSection |
| Auth shell | LOW | Single login surface |
