# Advanced DOCX Preview/Style Foundation — Audit Report

## Phase Status: COMPLETE ✅

Generated: 2026-07-02

---

## Style Profile

### Global
- **Font Family**: Times New Roman
- **Base Font Size**: 13pt (half-points: 26)

### Header (Left)
- **Parent Agency**: `VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH` (non-bold)
- **Issuing Agency**: `VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7` (bold)
- **Underline**: constrained to "KHU VỰC 7" only

### Header (Right)
- **Quốc hiệu**: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM` — bold size 13
- **Motto**: `Độc lập - Tự do - Hạnh phúc` — bold size 14, underline matching exact width
- **Place/Date**: italic size 14

### Template Block
- **Mẫu số line**: pattern `Mẫu số \S+`
- **Circular**: `(Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026)` — size 8pt (half-points: 16)

### Body
- **Main Title**: bold size 14 (QUYẾT ĐỊNH, LỆNH, BIÊN BẢN, etc.)
- **Subtitle**: bold size 14, one blank line spacing
- **Article Headings** (Điều 1, Điều 2, 1., 2., I., II., III.): bold

### Footer
- **Nơi nhận:** bold italic size 12
- **Recipient lines**: size 11
- **Signature title**: bold size 14 (Viện trưởng, Kiểm sát viên), 2–3 lines spacing

### Page/Section
- **Different First Page**: required
- **Page Numbering**: required when page count > 2

---

## Style Audit Checks Implemented

### Checks from `docx-format-auditor.ts` (existing)
| ID | Check | Source |
|---|---|---|
| FMT-001 | Times New Roman base font | existing |
| FMT-002 | Agency header present | existing |
| FMT-003 | KHU VỰC 7 bold | existing |
| FMT-004 | Underline under KHU VỰC 7 (visual) | existing |
| FMT-005 | Legal basis size 8pt | existing |
| FMT-006 | Quốc hiệu present | existing |
| FMT-007 | Motto bold size 14 | existing |
| FMT-008 | Motto underline width (visual) | existing |
| FMT-009 | Issue date pattern | existing |
| FMT-010 | Horizontal alignment (visual) | existing |
| FMT-011 | Body titles bold size 14 | existing |
| FMT-012 | Điều headings bold | existing |
| FMT-013 | Nơi nhận label | existing |
| FMT-014 | Footer recipient size 11 | existing |
| FMT-015 | Signature title bold size 14 | existing |
| FMT-016 | Page numbering | existing |
| FMT-017 | Different First Page | existing |
| FMT-018 | BM-001 receiver text black | existing |
| FMT-019 | BM-001 form note black 8pt | existing |

### New High-Level Service
- `DocxStyleAuditService` wraps auditor with:
  - Profile ID/name metadata
  - Finding severity classification (INFO/WARN/FAIL)
  - Finding location (header/footer/body/settings)
  - Human-readable messages
  - Actionable recommendations

### Output Shape
```typescript
{
  status: 'PASS' | 'WARN' | 'FAIL',
  profileId: 'vks-khu-vuc-7',
  profileName: 'Viện Kiểm Sát Nhân Dân Khu Vực 7',
  summary: {
    total: number,
    pass: number,
    warning: number,
    fail: number,
    notDetectable: number,
    notApplicable: number,
  },
  findings: [
    {
      severity: 'INFO' | 'WARN' | 'FAIL',
      code: 'FMT-001',
      message: string,
      location: 'header' | 'footer' | 'body' | 'settings' | 'styles' | 'document',
      recommendation?: string,
    }
  ],
  rawAudit: DocxFormatAudit,
}
```

---

## Preview API

### Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/documents/generated/:documentId/preview` | Full preview with audit + PDF |
| GET | `/documents/generated/:documentId/preview/audit` | Audit-only (fast) |
| GET | `/documents/preview/sample-data` | Sample data keys |

### Authorization
- Agency-scoped via `AgencyResourceAccessService`
- VIEWER role forbidden
- File paths never exposed

### Features
- Locate latest DOCX file
- Run style audit (read-only)
- Convert to PDF for preview (if conversion available)
- Return audit summary + findings + PDF metadata

### Limitations
- PDF conversion requires Windows with Word COM or LibreOffice
- PDF preview may be unavailable on Linux CI environments
- Audit is still available in audit-only mode on all environments

---

## Sample Data Provider

### Provider
- `SampleDataProvider` class with 50+ field keys
- Deterministic, non-dynamic values
- Categories: person, agency, case, date, offense, address, general
- All values marked `persisted: false`

### Sample Values (Key Examples)
| Key | Value |
|---|---|
| `person.fullName` | Nguyễn Văn A |
| `agency.name` | Viện Kiểm sát nhân dân khu vực 7 |
| `agency.parentName` | Viện Kiểm sát nhân dân thành phố Hồ Chí Minh |
| `case.caseCode` | VKS7-2026-001 |
| `document.date` | 15/07/2026 (fixed, not Date.now) |
| `offense.name` | Tội trộm cắp tài sản |
| `offense.article` | Điều 173 |

### Persistence Safety
- Sample data never saved to case/form DB
- Preview response includes `sample: true` flag
- No persisted official generated documents created

---

## Frontend UI

### Location
- New "Xem trước bản in" tab in `GeneratedDocumentWorkspace`
- `GeneratedDocumentPreviewPanel` component

### Features
- Audit status badge (PASS/WARN/FAIL)
- Summary counts (pass/warn/fail)
- Severity-grouped findings (FAIL → WARN → INFO)
- Finding details: severity, location, code, message, recommendation
- Reload button
- Sample data badge
- Sample warning message

### Labels (Vietnamese)
- "Kiểm tra định dạng"
- "Đạt" / "Cảnh báo" / "Lỗi"
- "Đầu trang" / "Chân trang" / "Nội dung" / "Cài đặt"
- "Đề xuất:"
- "Tải lại"
- "Dữ liệu mẫu"
- "Không lưu dữ liệu mẫu vào hồ sơ"

---

## Pilot Templates

### BM-039 (Lệnh bắt bị can để tạm giam)
- Discussed in original requirements
- Not mass-mutated — audit-ready

### BM-001 (Biên bản tiếp nhận nguồn tin)
- Already has format checks (FMT-018, FMT-019)
- Audit-ready

### Multi-page long forms
- Page numbering check (FMT-016) implemented
- Audit-ready

---

## Tests Added

| File | Cases |
|---|---|
| `docx-style-audit.service.spec.ts` | 8 cases: PASS/WARN/FAIL status, findings, recommendations, locations, profile |
| `sample-data-provider.spec.ts` | 13 cases: get, getAll, toObject, byCategory, determinism, categories |

**Total**: 21 new test cases across 2 spec files.

---

## Validation Results

| Command | Result |
|---|---|
| `pnpm --filter api test --runInBand` | ✅ 62 suites, 487 tests (27 new) |
| `pnpm --filter api lint` | ✅ 0 errors |
| `pnpm --filter api exec tsc --noEmit` | ✅ 0 errors |
| `pnpm --filter web lint` | ✅ 0 errors |
| `pnpm --filter web exec tsc --noEmit` | ✅ 0 errors |
| `pnpm typecheck` | ✅ All packages pass |
| `pnpm lint` | ✅ All packages pass |
| `pnpm exec prisma validate` | ✅ Schema valid |
| `pnpm audit:locked-compiled` | ✅ 213/213 consistent |
| `pnpm audit:contract-sync` | ✅ 213/213 matched |
| `pnpm build` | ✅ Build successful |

---

## Files Changed

| File | Change | Reason |
|---|---|---|
| `apps/api/src/modules/documents/style/vks-khu-vuc-7-style-profile.ts` | **NEW** | Canonical style profile reference |
| `apps/api/src/modules/documents/style/docx-style-audit.service.ts` | **NEW** | High-level audit service |
| `apps/api/src/modules/documents/style/docx-style-audit.service.spec.ts` | **NEW** | Unit tests for audit service |
| `apps/api/src/modules/documents/preview/docx-preview.dto.ts` | **NEW** | Preview DTOs |
| `apps/api/src/modules/documents/preview/docx-preview.service.ts` | **NEW** | Preview pipeline service |
| `apps/api/src/modules/documents/preview/docx-preview.controller.ts` | **NEW** | Preview API endpoints |
| `apps/api/src/modules/documents/preview/sample-data-provider.ts` | **NEW** | Sample data provider |
| `apps/api/src/modules/documents/preview/sample-data-provider.spec.ts` | **NEW** | Unit tests for sample provider |
| `apps/api/src/modules/documents/documents.module.ts` | MODIFIED | Register new module and services |
| `apps/web/src/components/documents/generated-document-preview-panel.tsx` | **NEW** | Frontend preview/audit panel |
| `apps/web/src/components/documents/generated-document-workspace.tsx` | MODIFIED | Add preview tab |
| `apps/web/src/lib/generated-documents-api.ts` | MODIFIED | Add preview API functions and types |

---

## Out of Scope (Not Implemented)

- Mass formatting all 213 forms
- Manual DOCX template rewrite
- DOCX render engine rewrite
- shadcn migration
- Report/statistics feature
- Form search/stage filter
- Visual PDF renderer (blocked by conversion infrastructure on Linux)

---

## Residual Risks

| Risk | Mitigation |
|---|---|
| All 213 rollout | Profile + audit foundation enables systematic rollout without mass-mutation |
| Exact Word/LibreOffice rendering parity | Visual inspection required; structural checks only |
| Page numbering auto-detection | FMT-016 detects PAGE field presence; page count requires render |
| Legacy templates | Audit degrades gracefully with `not_detectable` |
| Visual diff automation | Future work — requires rendered PDF pipeline |

---

## Next Steps (Future PRs)

1. **Rendered PDF preview**: Integrate PDF viewer component in frontend
2. **Per-template style profile**: Extend profile system for different VKS levels
3. **Batch audit**: Run audit across all generated documents
4. **Visual diff**: Compare rendered output vs. template baseline
5. **Audit history**: Persist audit results over time
6. **BM-specific profiles**: Add BM-053, BM-085, etc. specific checks
7. **Page image thumbnails**: Convert PDF pages to images for preview strip

---

*Report generated for PR: Advanced DOCX Preview and Style Foundation*
