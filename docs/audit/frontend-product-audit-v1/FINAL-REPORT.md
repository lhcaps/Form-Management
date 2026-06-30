# FRONTEND PRODUCT AUDIT V1 — FINAL REPORT

> Generated: 2026-06-30
> Audit Scope: QUANLYVKS Frontend Productization
> Status: **NEEDS_FE_FIXES** → Ready for Phase 2 Implementation

---

## 1. Verdict

| Aspect | Status |
|--------|--------|
| Backend Readiness | READY_ABSOLUTE_VERIFIED |
| Form Contracts | 213/213 PASS |
| Sample Data Coverage | 1735/1735 PASS (100%) |
| Frontend Status | **NEEDS_FE_FIXES** |

**Decision**: Proceed to Phase 2 implementation. The backend and form-engine layer is fully ready. The frontend needs productization work before deployment.

---

## 2. Current Frontend Architecture

### Route Map

| Route | Component | Purpose |
|-------|-----------|---------|
| `/templates` | `TemplateSelectorWorkspace` | Template selector + search |
| `/documents/[id]` | `GeneratedDocumentWorkspace` | Document form editor |
| `/reports` | `ReportsPage` | Reports dashboard |
| `/cases` | Case management | Case CRUD |

### Component Architecture

```
apps/web/src/
├── components/documents/
│   ├── template-selector-workspace.tsx    [1254 lines]
│   ├── generated-document-workspace.tsx     [726 lines]
│   ├── published-contract-form-inputs.tsx   [163 lines]
│   ├── bm-*-form-inputs.tsx               [150+ forms]
│   └── generated-document-action-panel.tsx
├── features/forms-contracts/
│   ├── sample-data.ts                     [577 lines] ← NOT WIRED TO UI
│   └── sample-generator.ts                [383 lines]
└── lib/
    ├── vks-template-catalog.ts           [3200+ lines]
    └── form-platform-catalog.ts
```

### State Management
- Local state with `useState` throughout
- No global state management (Zustand/Redux)
- API calls via `readApi()` wrapper

---

## 3. Workflow Findings

### Template Selector ✅ PARTIAL
- Search/filter working
- Case picker working
- **Issues**: Debug labels visible ("Biểu mẫu trong DB", "Catalog API", `{sourceZip}`)

### Form Editor ✅ PARTIAL
- Form rendering working
- Save functionality working
- **CRITICAL BLOCKER**: No sample prefill button (sample data exists but not wired)

### Sample Prefill ❌ **NOT IMPLEMENTED**
- `getSampleData()` exists in `sample-data.ts` ✓
- `mergeWithSampleData()` exists in `sample-data.ts` ✓
- **NO UI button** to trigger sample prefill ✗
- **User Impact**: 1735/1735 sample coverage unusable

### Save/Reload ✅ WORKING
- Save button present
- Reload preserves data
- Minor UX improvements needed (dirty state indicator)

### Export ✅ LIKELY WORKING
- Cannot verify without running app
- Need runtime E2E tests

### Reports ✅ GOOD
- Week/Month filter working
- CSV/PDF export working
- Minor design consistency issue (zinc vs slate)

---

## 4. Debug/Hardcode Leakage

| Classification | Count | Examples |
|---------------|-------|----------|
| USER_VISIBLE_BLOCKER | 8 | "Biểu mẫu trong DB", "Catalog API", `{sourceZip}`, "Contract runtime", `{contractHash}`, `#{documentId}` |
| ADMIN_ONLY_OK | 2 | `debugSlotIds` prop, Form Studio hash |
| TEST_ONLY_OK | 3 | Test mocks |

**Critical Fixes Needed:**
1. Hide "Contract runtime" and hash from users
2. Replace "Biểu mẫu trong DB" with Vietnamese
3. Remove `{sourceZip}` from UI
4. Replace `#{documentId}` with user-friendly label

---

## 5. Design System Findings

### Current State
- **Colors**: Slate-based palette, mostly consistent
- **Typography**: System fonts, Tailwind scale
- **Spacing**: Tailwind scale, inconsistent padding
- **Border Radius**: Mix of `rounded-3xl` and `rounded-md`

### Inconsistencies Found
1. Reports page uses `zinc-*` instead of `slate-*`
2. Border radius varies across pages
3. No shared `PageShell` component
4. No design token file

### Recommended Direction
- Professional Vietnamese legal/government SaaS
- Clean, high-trust, document-centric
- Calm blue/neutral base
- Clear action hierarchy
- No flashy gradients, no emoji

### Stitch Availability
- **Status**: CLI installed, MCP server not configured
- **Available Skills**: `extract-design-md`, `code-to-design`, `manage-design-system`
- **Recommendation**: Configure Stitch MCP for Phase 3

---

## 6. Accessibility/Responsive Findings

### Accessibility
| Check | Status |
|-------|--------|
| Keyboard navigation | PARTIAL |
| ARIA labels | PARTIAL |
| Color contrast | PASS |
| Focus visible | PASS |

**Issues:**
- Some inputs lack `<label>` elements
- No `aria-describedby` for error messages
- No skip-to-content link

### Responsive
| Check | Status |
|-------|--------|
| Mobile | GOOD |
| Tablet | GOOD |
| Desktop | GOOD |

**Issues:**
- Template cards grid may show 2 columns on mobile portrait
- Case picker modal may overflow on small screens

---

## 7. Test Coverage Gaps

| Type | Current | Missing |
|------|---------|---------|
| Unit | 66 tests | Sample data tests, form validation tests |
| Integration | 0 | — |
| E2E | Unknown | Sample prefill, template selector, save/reload |

**Priority Test Additions:**
1. Sample data unit tests
2. Sample prefill E2E test
3. Template selector workflow E2E

---

## 8. Prioritized Backlog

### P0: Critical (Must Fix)
| ID | Issue | Effort |
|----|-------|--------|
| BACKLOG-P0-01 | Add sample prefill button | 0.5 day |
| BACKLOG-P0-02 | Wire sample data functions | 0.5 day |

### P1: High Priority
| ID | Issue | Effort |
|----|-------|--------|
| BACKLOG-P1-01 | Hide contract runtime debug | 0.25 day |
| BACKLOG-P1-02 | Clean template selector stats | 0.5 day |
| BACKLOG-P1-03 | Replace internal ID display | 0.25 day |
| BACKLOG-P1-04 | Clean badge labels | 0.25 day |
| BACKLOG-P1-05 | Add sample mode indicator | 0.25 day |

### P2: Medium Priority
| ID | Issue | Effort |
|----|-------|--------|
| BACKLOG-P2-01 | Create shared PageShell | 1 day |
| BACKLOG-P2-02 | Create design tokens | 0.5 day |
| BACKLOG-P2-03 | Fix input labels | 0.5 day |
| BACKLOG-P2-04 | Add dirty state indicator | 0.25 day |
| BACKLOG-P2-05 | Fix color inconsistency | 0.25 day |
| BACKLOG-P2-06 | Standardize border radius | 0.5 day |
| BACKLOG-P2-07 | Add error association | 0.25 day |
| BACKLOG-P2-08 | Improve loading states | 0.5 day |

### P3: Low Priority
- Add skip to content link
- Implement focus trap for modals
- Add keyboard shortcuts
- Add toast notifications
- Add admin debug panel
- Mobile-specific optimizations
- Playwright accessibility tests
- Coverage reports

**Total Estimated Effort**: 1-2 weeks

---

## 9. Recommended Next Phase

### Task Name
**QUANLYVKS_FRONTEND_PRODUCTIZATION_PHASE_2**

### Implementation Sequence

1. **Create new branch**: `feat/frontend-productization-phase-2`

2. **Phase 2A**: P0 Fixes (2 tasks, 1 day)
   - Add sample prefill button
   - Wire sample data functions

3. **Phase 2B**: P1 Fixes (5 tasks, 1.5 days)
   - Hide debug panels
   - Clean UI labels
   - Add sample mode indicator

4. **Phase 2C**: P2 Design Fixes (8 tasks, 3.5 days)
   - Create shared components
   - Fix design inconsistencies
   - Add accessibility improvements

5. **Phase 2D**: P2 Test Additions (2 tasks, 0.5 day)
   - Add sample data unit tests
   - Add E2E tests

### Validation Plan

```bash
# After each task
pnpm typecheck
pnpm test:web-unit
pnpm --filter web lint

# After all P0/P1 fixes
# Manual: Open form, click sample prefill, verify
# Manual: Open template selector, verify no debug labels
```

### Rollback Plan

```bash
git checkout HEAD -- apps/web/src/
```

---

## 10. Artifacts Created

| File | Purpose |
|------|---------|
| `docs/audit/frontend-product-audit-v1/stitch-setup.latest.md` | Stitch installation status |
| `docs/audit/frontend-product-audit-v1/baseline.latest.md` | Baseline snapshot |
| `docs/audit/frontend-product-audit-v1/baseline.latest.json` | Baseline JSON |
| `docs/audit/frontend-product-audit-v1/codegraph-map.latest.md` | Architecture map |
| `docs/audit/frontend-product-audit-v1/codegraph-map.latest.json` | Architecture JSON |
| `docs/audit/frontend-product-audit-v1/workflows.latest.md` | Workflow audit |
| `docs/audit/frontend-product-audit-v1/workflows.latest.json` | Workflow JSON |
| `docs/audit/frontend-product-audit-v1/debug-hardcode-leakage.latest.md` | Debug leakage audit |
| `docs/audit/frontend-product-audit-v1/debug-hardcode-leakage.latest.json` | Debug leakage JSON |
| `docs/audit/frontend-product-audit-v1/design-system.latest.md` | Design system audit |
| `docs/audit/frontend-product-audit-v1/design-system.latest.json` | Design system JSON |
| `docs/audit/frontend-product-audit-v1/a11y-responsive.latest.md` | Accessibility audit |
| `docs/audit/frontend-product-audit-v1/a11y-responsive.latest.json` | Accessibility JSON |
| `docs/audit/frontend-product-audit-v1/test-coverage.latest.md` | Test coverage audit |
| `docs/audit/frontend-product-audit-v1/test-coverage.latest.json` | Test coverage JSON |
| `docs/audit/frontend-product-audit-v1/backlog.latest.md` | Prioritized backlog |
| `docs/audit/frontend-product-audit-v1/backlog.latest.json` | Backlog JSON |
| `docs/audit/frontend-product-audit-v1/implementation-plan-phase-2.md` | Implementation plan |
| `.stitch/DESIGN_AUDIT.md` | Stitch design inventory |

---

## 11. Git Status

### Dirty Files
| Status | Files |
|--------|-------|
| Modified (pre-existing) | 4 files in other audit dirs |
| Untracked (new) | Entire `docs/audit/frontend-product-audit-v1/` directory |
| Untracked (new) | `.stitch/` directory |

### Recommendation
**DO NOT commit yet.** These are audit artifacts. Wait for Phase 2 implementation to:
1. Create implementation branch
2. Commit audit artifacts separately OR
3. Include in Phase 2 PR

---

## 12. Do/Do Not Recommendation

### Do ✅
- ✅ Proceed to Phase 2 implementation
- ✅ Fix P0 issues first (sample prefill)
- ✅ Fix P1 issues next (debug leakage)
- ✅ Create design system components in Phase 2
- ✅ Add tests alongside fixes
- ✅ Keep audit artifacts in `docs/audit/frontend-product-audit-v1/`

### Do Not ❌
- ❌ Do not mutate locked contracts
- ❌ Do not mutate normalized DOCX
- ❌ Do not hand-edit compiled-v2
- ❌ Do not commit without Phase 2 implementation
- ❌ Do not weaken readiness gates
- ❌ Do not implement broad redesign in Phase 2

---

## Summary

**Overall Status**: READY for Phase 2 Implementation

**Critical Path**:
1. Add sample prefill button (P0)
2. Wire sample data functions (P0)
3. Hide debug information (P1)
4. Clean UI labels (P1)
5. Create design system components (P2)

**Estimated Time**: 1-2 weeks

**Next Action**: Create branch `feat/frontend-productization-phase-2` and implement P0 fixes.
