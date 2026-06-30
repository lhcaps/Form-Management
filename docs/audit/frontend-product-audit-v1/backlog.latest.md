# Prioritized Frontend Issue Backlog — QUANLYVKS Frontend Audit V1

> Generated: 2026-06-30

## Priority Definitions

| Priority | Definition | SLA |
|----------|------------|-----|
| P0 | Blocks real user from opening/filling/saving/exporting a form | Must fix before launch |
| P1 | Makes app look unfinished or expose dev/debug internals | Should fix before launch |
| P2 | Design consistency, layout, copy, accessibility, responsive | Fix in Phase 2 |
| P3 | Nice-to-have polish and admin tooling | Fix in Phase 3+ |

---

## P0: Critical Blockers (Must Fix)

### 1. Add Sample Prefill UI
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P0-01 |
| Workflow | Sample Prefill |
| Category | UX / BACKEND_WIRING |
| File | `apps/web/src/components/documents/generated-document-workspace.tsx` |
| Evidence | NO sample prefill button visible in form editor |
| User Impact | **CRITICAL: Users cannot prefill forms with sample data** |
| Root Cause | Sample data infrastructure exists (`getSampleData`, `mergeWithSampleData`) but not wired to UI |
| Fix | Add "Điền dữ liệu mẫu" button to action bar, wire to sample functions |
| Safe to Fix Without Backend | YES |

### 2. Wire Sample Data Functions to UI
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P0-02 |
| Workflow | Sample Prefill |
| Category | BACKEND_WIRING |
| File | `apps/web/src/features/forms-contracts/sample-data.ts` |
| Evidence | `getSampleData()` and `mergeWithSampleData()` exist but not called from any UI component |
| User Impact | **Sample data coverage is 1735/1735 but unusable by users** |
| Root Cause | No UI trigger for sample prefill |
| Fix | Add button → `getSampleData(templateCode)` → `mergeWithSampleData(existing, sample)` |
| Safe to Fix Without Backend | YES |

---

## P1: High Priority (Should Fix)

### 3. Hide Contract Runtime Debug Panel
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P1-01 |
| Workflow | Open Generated Form |
| Category | DEBUG_LEAK |
| File | `apps/web/src/components/documents/published-contract-form-inputs.tsx:117-121` |
| Evidence | "Contract runtime · {templateCode} · v{version}" and `{contractHash}` displayed |
| User Impact | Exposes internal runtime information to users |
| Fix | Wrap in `{IS_DEBUG && (...)}` or remove entirely |
| Safe to Fix Without Backend | YES |

### 4. Clean Template Selector Stats
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P1-02 |
| Workflow | Open Template Selector |
| Category | DEBUG_LEAK |
| File | `apps/web/src/components/documents/template-selector-workspace.tsx` |
| Evidence | Lines 788, 852, 879, 1003 show "Biểu mẫu trong DB", "Catalog API", `{sourceZip}` |
| User Impact | Users see internal DB/API/technical labels |
| Fix | Replace with Vietnamese labels, hide zip path behind debug flag |
| Safe to Fix Without Backend | YES |

### 5. Replace Internal ID Display
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P1-03 |
| Workflow | Open Generated Form |
| Category | DEBUG_LEAK |
| File | `apps/web/src/components/documents/generated-document-workspace.tsx:643-647` |
| Evidence | "Mã biểu mẫu #{documentId}" showing internal DB ID |
| User Impact | Users see cryptic internal ID |
| Fix | Remove or replace with "Số định danh: {shortId}" |
| Safe to Fix Without Backend | YES |

### 6. Clean "Published contract" Badge Labels
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P1-04 |
| Workflow | Open Generated Form |
| Category | DEBUG_LEAK |
| File | `apps/web/src/lib/form-platform-catalog.ts:83,85` |
| Evidence | "Published contract" badge labels |
| User Impact | English label in Vietnamese UI |
| Fix | Change to Vietnamese "Đã xuất bản" or remove |
| Safe to Fix Without Backend | YES |

### 7. Add Sample Mode Indicator
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P1-05 |
| Workflow | Sample Prefill |
| Category | UX |
| File | `apps/web/src/components/documents/generated-document-workspace.tsx` |
| Evidence | No indicator when form has sample data |
| User Impact | Users don't know if form has sample vs user data |
| Fix | Add banner "Chế độ xem trước - chưa lưu" when sample is applied |
| Safe to Fix Without Backend | YES |

---

## P2: Medium Priority (Phase 2)

### 8. Create Shared PageShell Component
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-01 |
| Workflow | All |
| Category | DESIGN_CONSISTENCY |
| File | New: `apps/web/src/components/common/page-shell.tsx` |
| Evidence | Inconsistent page layouts across pages |
| Fix | Create shared PageShell with consistent header, padding, spacing |
| Safe to Fix Without Backend | YES |

### 9. Create Shared Design Tokens
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-02 |
| Workflow | All |
| Category | DESIGN_CONSISTENCY |
| File | New: `apps/web/src/lib/design-tokens.ts` |
| Evidence | No shared design tokens, inconsistent spacing/colors |
| Fix | Create design token constants for colors, spacing, typography |
| Safe to Fix Without Backend | YES |

### 10. Fix Form Input Labels
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-03 |
| Workflow | Open Template Selector |
| Category | ACCESSIBILITY |
| File | `apps/web/src/components/documents/template-selector-workspace.tsx` |
| Evidence | Inputs use only placeholder, no `<label>` elements |
| Fix | Add proper `<label>` elements for accessibility |
| Safe to Fix Without Backend | YES |

### 11. Add Dirty State Indicator
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-04 |
| Workflow | Save/Reload |
| Category | UX |
| File | `apps/web/src/components/documents/published-contract-form-inputs.tsx` |
| Evidence | No indication of unsaved changes |
| Fix | Add asterisk or "Unsaved" badge when form is dirty |
| Safe to Fix Without Backend | YES |

### 12. Fix Color Palette Inconsistency
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-05 |
| Workflow | Reports |
| Category | DESIGN_CONSISTENCY |
| File | `apps/web/src/app/reports/page.tsx` |
| Evidence | Uses `zinc-*` instead of `slate-*` |
| Fix | Replace all `zinc-*` with `slate-*` |
| Safe to Fix Without Backend | YES |

### 13. Standardize Border Radius
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-06 |
| Workflow | All |
| Category | DESIGN_CONSISTENCY |
| Evidence | Mix of `rounded-3xl` and `rounded-md` |
| Fix | Standardize on `rounded-3xl` for sections |
| Safe to Fix Without Backend | YES |

### 14. Add Form Error Association
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-07 |
| Workflow | Save/Reload |
| Category | ACCESSIBILITY |
| File | `apps/web/src/components/documents/published-contract-form-inputs.tsx` |
| Evidence | No `aria-describedby` for error messages |
| Fix | Add error association with `aria-describedby` |
| Safe to Fix Without Backend | YES |

### 15. Improve Loading States
| Field | Value |
|-------|-------|
| Issue ID | BACKLOG-P2-08 |
| Workflow | Open Template Selector |
| Category | UX |
| Evidence | "Đang tải..." text only, no skeleton |
| Fix | Add skeleton loading states |
| Safe to Fix Without Backend | YES |

---

## P3: Low Priority (Phase 3+)

### 16. Add Skip to Content Link
### 17. Implement Focus Trap for Modals
### 18. Add Keyboard Shortcuts
### 19. Add Toast Notifications
### 20. Add Admin Debug Panel
### 21. Mobile-Specific Optimizations
### 22. Add Playwright Accessibility Tests
### 23. Add Coverage Reports

---

## Summary Statistics

| Priority | Count | Estimated Effort |
|----------|-------|-----------------|
| P0 | 2 | 1-2 days |
| P1 | 5 | 2-3 days |
| P2 | 8 | 3-5 days |
| P3 | 8 | Ongoing |
| **TOTAL** | **23** | **1-2 weeks** |

---

## Implementation Order

1. **P0-01**: Add sample prefill button
2. **P0-02**: Wire sample data functions
3. **P1-01**: Hide contract runtime debug
4. **P1-02**: Clean template selector stats
5. **P1-03**: Replace internal ID display
6. **P1-04**: Clean badge labels
7. **P1-05**: Add sample mode indicator
8. **P2-01** through **P2-08**: Design system unification
9. **P3-01** through **P3-08**: Polish and admin tooling
