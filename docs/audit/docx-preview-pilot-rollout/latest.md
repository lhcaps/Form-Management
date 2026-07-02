# DOCX Preview Pilot Rollout — Runtime Preview Session

**Branch:** `feat/docx-preview-pilot-rollout`  
**PR:** #31 — Advanced DOCX Preview P2 — Pilot Runtime Reliability  
**Generated:** 2026-07-03

---

## Architecture Summary

This PR implements the **Runtime Preview Session** architecture for standalone template preview at `/templates/:templateCode`. The architecture cleanly separates:

1. **Standalone Runtime Template Preview** (`/templates/BM-001`)
   - No `generatedDocumentId`
   - No database rows
   - Uses temporary filesystem-backed preview sessions

2. **Persisted Generated Document Workspace** (`/documents/:id`)
   - Has `generated_documents`, `generated_document_files` rows
   - Has preview/history tabs
   - Remains unchanged

---

## Endpoints Implemented

| Method | Path | Response Type | Purpose |
|--------|------|---------------|---------|
| `POST` | `/api/v1/forms/runtime/:templateCode/preview-session` | JSON | Create preview session, returns metadata with download URLs |
| `GET` | `/api/v1/forms/runtime/preview-sessions/:sessionId/docx` | DOCX binary | Download DOCX from preview session |
| `GET` | `/api/v1/forms/runtime/preview-sessions/:sessionId/pdf` | PDF or 404 | Get PDF preview if available (graceful) |
| `POST` | `/api/v1/forms/runtime/:templateCode/render-docx` | DOCX binary | Pure download (unchanged) |

---

## Files Changed

```
apps/api/src/modules/documents/runtime-preview-session.service.ts
apps/api/src/modules/documents/runtime-preview-session.service.spec.ts
apps/api/src/modules/documents/runtime-template-render.controller.ts
apps/api/src/modules/documents/runtime-template-render.controller.spec.ts
apps/api/src/modules/documents/documents.module.ts
apps/web/src/lib/runtime-template-preview.ts
apps/web/src/components/documents/template-preview-workspace.tsx
docs/audit/docx-preview-pilot-rollout/latest.json
```

---

## Non-Goals Respected

- No DOCX template changes
- No locked contract mutations
- No DTO whitelist weakening
- No `mode` in request body
- No `?mode=metadata`
- No `response.json()` from Nest handlers
- No fake `generatedDocumentId`
- No history/audit links in standalone mode
- No database tables for preview sessions

---

## Tests Run

| Command | Result |
|---------|--------|
| `pnpm --filter api exec tsc --noEmit` | PASS |
| `pnpm --filter web exec tsc --noEmit` | PASS |
| `pnpm --filter api lint` | PASS |
| `pnpm --filter web lint` | PASS |
| `pnpm --filter api test --testPathPatterns runtime-preview-session --runInBand` | PASS (22 tests) |

---

## Known Limitations

- **PDF preview:** Not available for runtime preview sessions (graceful degradation — DOCX download always works)
- **Session TTL:** 60 minutes, cleaned up opportunistically
- **No persistent storage:** Preview sessions are temporary

---

## Manual Smoke Test Checklist

- [ ] Open `/templates/BM-001`
- [ ] Click "Xem trước bản in"
- [ ] Network shows `POST /api/v1/forms/runtime/BM-001/preview-session`
- [ ] Response is JSON, not `PK`
- [ ] No auto-download
- [ ] Preview panel appears with file info
- [ ] Click "Tải DOCX"
- [ ] Network shows `GET /api/v1/forms/runtime/preview-sessions/{sessionId}/docx`
- [ ] Response is DOCX binary starting with `PK`
- [ ] Click "Mở với hồ sơ để lưu DB"
- [ ] Routes to `/documents?templateCode=BM-001`
- [ ] No "Lịch sử xử lý" in standalone preview panel
- [ ] Existing `/documents/:id` preview/history still works
