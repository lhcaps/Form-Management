# QLLAW Form Catalog / Open Workflow Linkage — verification

> Read alongside `QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.md`. This file
> documents the form-catalog → open → template-preview-workspace flow.

## 1. Verification steps performed

| # | Step | Result |
|---|---|---|
| 1 | `pnpm dev` running from repo root | YES — terminal log `pnpm dev:wait-ready` exit 0 |
| 2 | `GET /templates/BM-001` | HTTP 200 |
| 3 | `GET /templates/BM-005` (auto-generated runtime-ux profile) | HTTP 200 |
| 4 | `GET /templates/BM-171` | HTTP 200 |
| 5 | `GET /api/v1/form-platform/catalog` (dev proxy) | reachable, but 401 without session token |
| 6 | `GET /api/v1/forms/locked` (dev proxy) | HTTP 200 (catalog) |
| 7 | 213 compiled contracts present on disk | YES (`Get-ChildItem` count = 213) |
| 8 | 213 locked contracts present on disk | YES |
| 9 | 213 runtime-ux profile files present | YES (2 curated + 211 auto-generated) |
| 10 | 213 runtime-ux profile imports in `index.ts` | YES |
| 11 | `RUNTIME_READY_FORM_FLIGHT_PROFILES` allowlist | UNCHANGED at BM-001 + BM-171 |
| 12 | BM-001 / BM-171 curated profile files untouched by generator | YES (CURATED_PROFILES whitelist in `generate-runtime-ux-profiles.mjs`) |

## 2. Open workflow path

```
User → /templates/BM-<NNN>
   → apps/web/src/app/templates/[templateCode]/page.tsx
   → <TemplatePreviewWorkspace templateCode={…} />
   → getRuntimeFormContract(<code>)
       → GET /api/v1/forms/runtime/<BM-NNN>
       → CompiledFormContract (templateCode, source.{fields, sections})
   → getRuntimeUxProfile(<code>)
       → apps/web/src/lib/runtime-ux/index.ts (side-effect registry)
       → bmNNN-runtime-ux-profile.ts registerRuntimeUxProfile(...)
   → <ContractV2Renderer contract data uxProfile …>
   → section rendering: uxProfile.sections[] + contract.source.sections[]
   → field rendering: uxProfile.fields[] + smart controls
   → localStorage draft: qllaw:runtime-template-draft:<code>:<hash>
   → "Dữ liệu demo" → applySampleData() → buildRuntimePreviewPayloadFromDraft
   → "Xem trước bản in" → createRuntimePreviewSession() → RuntimePdfPreview
   → "Tải DOCX" → downloadRuntimeTemplateDocx()
```

No new framework. No parallel system. No new public API route path.

## 3. Catalog coverage

Every BM code reachable via `/templates/BM-NNN`. The
`/templates/[templateCode]` page route catches all 213 codes
(`pages 213`). The `/api/v1/forms/runtime/<code>` endpoint reads
the locked contract on disk; the disk has 213 locked contracts.
Therefore every BM code is openable.

## 4. Items NOT changed by this phase

- `apps/web/src/app/templates/[templateCode]/page.tsx`: unchanged.
- `apps/web/src/components/documents/template-preview-workspace.tsx`: only the
  Xóa bản nháp disabled-state fix from Phase 1; no other behaviour changed.
- `apps/web/src/features/forms-contracts/ContractV2Renderer.tsx`: unchanged.
- `apps/web/src/lib/runtime-ux/runtime-ux-profile.ts`: unchanged.
- `apps/web/src/lib/runtime-ux/runtime-preview-payload.ts`: unchanged.
- `apps/web/src/lib/runtime-ux/smart-field-helpers.ts`: unchanged.
- `apps/api/src/modules/contract-platform/*`: unchanged.
- `docs/audit/docx/contracts/locked/*`: unchanged.
- `docs/audit/docx/compiled-v2/*`: unchanged.
- `RUNTIME_READY_FORM_FLIGHT_PROFILES` allowlist in
  `apps/web/src/lib/form-flight/form-lifecycle.ts`: unchanged (still BM-001 +
  BM-171).
- `apps/web/src/components/documents/bm-NNN-form-inputs.tsx` (legacy
  components, 213 files): unchanged. They remain importable from
  `bm-panel-registry.generated.ts` for the generated-document flow.

## 5. Items added by this phase

- 211 new runtime-ux profiles under `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts`.
- 211 new imports added to `apps/web/src/lib/runtime-ux/index.ts`.
- `scripts/audit/audit-213-form-input-linkage.mjs` (read-only audit).
- `scripts/audit/generate-runtime-ux-profiles.mjs` (idempotent profile
  generator).

## 6. Remaining blockers (recorded, not fixed)

- Forms still rely on the existing legacy `bm-NNN-form-inputs.tsx` components
  for the generated-document workspace flow. Those are intentionally NOT
  removed (they are referenced from `bm-panel-registry.generated.ts`). The
  runtime-ux profile is additive — it lifts `/templates/<code>` to
  `INPUT_CONNECTED_PARTIAL` for all 213.
- `INPUT_CONNECTED_PARTIAL → INPUT_CONNECTED_PASS` for the 211 forms requires
  hand-curated labels, hand-curated smart controls, and per-form
  golden-render + browser-smoke evidence. That is the next phase.
- The `FormFlight` allowlist (`RUNTIME_READY_FORM_FLIGHT_PROFILES`) remains
  strict (BM-001 + BM-171). Adding new entries is gated by the
  `form-lifecycle-wiring.guard.test.mjs` invariants.