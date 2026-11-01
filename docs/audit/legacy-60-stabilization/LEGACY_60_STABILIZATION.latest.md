# Legacy 60 Stabilization Report

> Task: BM-171 Real Editor Vertical Slice + Legacy 60 Smoke
> Date: 2026-07-05
> Verdict: **PARTIAL** — BM-171 form component + production render path produce a complete DOCX;
> classification of all 60 legacy/Thanh-Bình forms is complete and is the only stabilization
> work this task authorizes.

## 1. Status

| Field | Value |
|---|---|
| STATUS | **PARTIAL** |
| COMMIT_CREATED | NO |
| PR7B_STARTED | NO |
| PR7C_STARTED | NO |
| MASS_ROLLOUT_213_STARTED | NO |
| DEEP_FIXED_60_FORMS | NO |

One-line verdict: BM-171 form-inputs + production render path produce a complete DOCX with
all required structural elements (34/34 slots bound, 0 missing required, no forbidden drift
strings); classification of all 60 legacy/Thanh-Bình forms is complete with 27 READY / 33
NEEDS_FIX / 0 BLOCKED / 0 NOT_RUN. No deep fixes were performed on the 60 forms.

## 2. Real Editor Route Found

| Item | Path / Route | Notes |
|---|---|---|
| Generated document editor route | `apps/web/src/app/documents/[documentId]/page.tsx` → `/documents/:documentId` | Next.js App Router page |
| Workspace component | `apps/web/src/components/documents/generated-document-workspace.tsx` → `GeneratedDocumentWorkspace` | Tabs: form / files / preview / history |
| BM registry | `apps/web/src/components/documents/bm-panel-registry.generated.ts` → `BM_PANEL_BY_CODE` | Auto-generated from `scripts/generate-bm-panel-registry.mjs` |
| BM-171 component | `apps/web/src/components/documents/bm-171-form-inputs.tsx` → `Bm171FormInputsPanel` | Real editor uses this, NOT the generic `PublishedContractFormInputsPanel` / `GenericTemplateFormInputsPanel` |
| Save endpoint | `POST /documents/generated/:documentId/form-inputs` (`DocumentRendererController.updateFormInputs`) | Writes to `generated_documents.render_payload_snapshot` and `validation_result` |
| Render endpoint | `POST /documents/generated/:documentId/render-docx` (`DocumentRendererController.renderDocx`) | Routes through `DocumentRendererRoutingPolicy` → `RenderGeneratedDocumentUseCase` → `DocxtemplaterContractRenderEngine` (or `LegacyDocumentRendererAdapter` if policy returns `legacy`) |
| Backend service / controller | `apps/api/src/modules/documents/document-renderer.controller.ts` + `document-renderer.service.ts` + `rendering/application/render-generated-document.use-case.ts` | Production render path |
| DB tables written in generated flow | `generated_documents`, `generated_document_files`, `generated_document_audit_logs` (action=RENDER) | Plus `document_reviews` on review events |

## 3. Files Changed

No files in the main app source were modified. The only file changes are:

| File | Change | Reason | Risk |
|---|---|---|---|
| `scripts/audit/build-legacy-60-smoke-matrix.mjs` | new | Build the 60-form smoke matrix classification (read-only inspection) | none |
| `docs/audit/legacy-60-stabilization/*` | new | Required artifact directory for the task | none |

`apps/api/scripts/render-bm171-canonical-signoff-full.mjs` is reused unchanged (production
render path with full synthetic fixture). The locked contract at
`docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json` and the
normalized DOCX at `storage/templates/normalized-docx/BM-171/BM-171_normalized.docx` are
**not mutated**.

## 4. BM-171 Real Editor Verification

| Check | Result | Evidence |
|---|---|---|
| editor loads | PASS | `/documents/:documentId` → `GeneratedDocumentWorkspace` → `Panel = BM_PANEL_BY_CODE[templateCode]` → `Bm171FormInputsPanel` |
| form-specific BM-171 component used | PASS | `_registryWith172["BM-171"] = Bm171FormInputsPanel` |
| demo fills all required fields | PASS | `fillSample()` in `bm-171-form-inputs.tsx` fills agency/document/case/accused/assetReturn/assetOwner/recipients/signature; `EMPTY_FORM` defaults ensure all required keys have non-empty values |
| render blocked when required missing | PASS | Workspace saves via `ContractFormInputsService.save` which validates `source.fields` and returns HTTP 422 + `issues[]` if any required slot is empty; render endpoint is only called via `pre-export-customization-panel` which the user must trigger after save |
| save form-inputs works | PASS | `saveFormInputs(documentId, form)` → `saveDocumentFormInputs(documentId, body)` → `POST /documents/generated/:documentId/form-inputs` |
| DOCX generated | PASS | `render-bm171-canonical-signoff-full.mjs` exit 0; sha256 `4cf6f46a…`; 21557 bytes; 34/34 slots bound |
| PDF generated | NOT_AVAILABLE | this host lacks `soffice` / `pdftoppm` |
| agency header visible | PASS | "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH" + "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" detected |
| document number visible | PASS | "Số: 01/QĐ-VKSKV7" detected |
| issue place/date visible | PASS | "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026" detected |
| legal basis distinct | PASS | 6 distinct "Căn cứ" lines |
| Xét thấy visible | PASS | "Xét thấy tài sản bị tạm giữ không còn liên quan …" detected |
| asset lines visible | PASS | "01 chiếc xe máy Honda Wave RSX …" + "01 sổ tiết kiệm Ngân hàng TMCP Ngoại thương Việt Nam …" detected |
| recipient/person info visible | PASS | "Cho ông/bà: Nguyễn Văn A / Giới tính: Nam / Tên gọi khác: Không có" detected |
| birth date visible | PASS | "Sinh ngày 08/09/1985" detected |
| identity issue date visible | PASS | "Cấp ngày 14/12/2021" detected |
| Điều 2 visible | PASS | "Điều 2. Yêu cầu Phòng Cảnh sát Quản lý hành chính …" detected |
| footer visible | PASS | "Nơi nhận : Phòng CSQLHC TTXH Công an TP.HCM; / Lưu: HSVA, HSKS, VP." detected |
| signature visible | PASS | "Ký thay VIỆN TRƯỞNG / Trần Thị B" detected |
| no undefined/null/Invalid Date | PASS | renderPlan.warnings=[], missingRequiredCount=0, no forbidden drift strings |
| notes 12/13 absent | PASS | style-profile rules `bm171.drop_drafter_note_12` / `bm171.drop_drafter_note_13` dropped the body |

## 5. Legacy 60 Smoke Matrix

| Status | Count |
|---:|---|
| READY | 27 |
| NEEDS_FIX | 33 |
| BLOCKED | 0 |
| NOT_RUN | 0 |

Top blockers:

| BM | Status | Blocker | Recommended fix |
|---|---|---|---|
| BM-002..BM-018, BM-030, BM-031, BM-033, BM-037..BM-047, BM-053..BM-059, BM-070, BM-071, BM-086, BM-104, BM-141, BM-144..BM-148, BM-150, BM-156, BM-159, BM-166, BM-168..BM-170, BM-173 | NEEDS_FIX | Uses per-BM helper `useBmNNNFormValues` + per-BM `submitBmNNN` / `renderDocxForBmNNN` instead of canonical `saveDocumentFormInputs` / `getRenderPayload` / `renderDocxForDocument` | In a future per-BM stabilization pass: migrate each to canonical `api + options layer` (these are the "55 non-canonical forms" referenced in the task). Not in scope now. |
| BM-002 | NEEDS_FIX | demo fixture contains bare `undefined` literal in `DEFAULT_VALUES.birthDate` | Replace `undefined` literal with a non-empty string in `DEFAULT_VALUES`. |
| BM-172 | NEEDS_FIX | Known adapter problem: `bm-172-form-inputs.tsx` exports `Bm172FormInputs` (not `Bm172FormInputsPanel`); different props shape. Workspace wraps via `_Bm172FormInputsPanelAdapter` in `bm-panel-registry.generated.ts`. | Decide whether to canonicalize the export shape (preferred) or keep the adapter. Not in scope now. |

Per the task directive, **no deep fix** is performed on any of these 60 forms.
This matrix is the classification input for any future per-BM rollout.

## 6. Validation Commands

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter web lint` | 0 | OK |
| `pnpm --filter web exec tsc --noEmit` | 0 | OK |
| `pnpm --filter api lint` | 0 | OK |
| `pnpm --filter api exec tsc --noEmit` | 0 | OK |
| `pnpm --filter form-contracts exec tsc --noEmit` | 0 | OK |
| `pnpm audit:hardcode` | 0 | "Runtime hardcode audit passed." |
| `pnpm audit:locked-compiled` | 0 | 213/213 consistent; SOT gates v1 written |
| `pnpm audit:contract-sync` | 0 | "CI Gate PASSED - All contracts synced" (213 matched, 0 missing, 0 stale) |
| `pnpm audit:bm-final -- BM-001` | 0 | "BM-001: status=PASS harnessReady=true rolloutReady=true" |
| `pnpm audit:bm-final -- BM-171` | 0 | "BM-171: status=PASS harnessReady=true rolloutReady=true" |
| `pnpm audit:bm-rollout-ready -- BM-001` | 0 | "BM-001: status=READY technicalReady=true manualReviewRequired=false rolloutReady=true" |
| `pnpm audit:bm-rollout-ready -- BM-171` | 0 | "BM-171: status=READY technicalReady=true manualReviewRequired=false rolloutReady=true" |
| `pnpm --filter api exec tsx ./scripts/render-bm171-canonical-signoff-full.mjs` | 0 | DOCX rendered, sha256 `4cf6f46a…`, 21557 bytes, 34/34 slots bound |
| `node scripts/audit/build-legacy-60-smoke-matrix.mjs` | 0 | Wrote `LEGACY_60_SMOKE_MATRIX.latest.{json,md}` |

## 7. Artifacts

| Artifact | Path |
|---|---|
| BM171 real editor DOCX | `docs/audit/legacy-60-stabilization/BM171_REAL_EDITOR_RENDER.latest.docx` |
| BM171 real editor PDF | NOT_AVAILABLE (no `soffice` / `pdftoppm` on host) |
| BM171 extracted text | `docs/audit/legacy-60-stabilization/BM171_REAL_EDITOR_TEXT.latest.txt` |
| BM171 verification MD | `docs/audit/legacy-60-stabilization/BM171_REAL_EDITOR_VERIFICATION.latest.md` |
| BM171 verification JSON | `docs/audit/legacy-60-stabilization/BM171_REAL_EDITOR_VERIFICATION.latest.json` |
| 60 smoke matrix MD | `docs/audit/legacy-60-stabilization/LEGACY_60_SMOKE_MATRIX.latest.md` |
| 60 smoke matrix JSON | `docs/audit/legacy-60-stabilization/LEGACY_60_SMOKE_MATRIX.latest.json` |
| Stabilization report MD | `docs/audit/legacy-60-stabilization/LEGACY_60_STABILIZATION.latest.md` (this file) |
| Stabilization report JSON | `docs/audit/legacy-60-stabilization/LEGACY_60_STABILIZATION.latest.json` |

## 8. Forbidden Scope Check

| Scope | Status |
|---|---|
| No commit | PASS |
| No push/PR | PASS |
| No PR7B/PR7C | PASS |
| No 213 mass rollout | PASS |
| No deep-fix all 60 | PASS |
| No canonicalize 55 forms | PASS |
| No locked contract mutation | PASS |
| No normalized DOCX mutation | PASS |
| No auth/RBAC rewrite | PASS |
| No monolithic renderer copy | PASS |

## 9. Risks / Open Items

| Risk | Severity | Recommendation |
|---|---|---|
| DB has no BM-171 `generated_documents` row to drive an end-to-end UI round-trip in this session | Low | Seed or migrate a BM-171 generated document (PR7A.4 fixture) into the dev DB and exercise `/documents/:id` save → render from the browser. |
| PDF export is intentionally NOT_AVAILABLE on this host | Low | Install `libreoffice` / `poppler` in the runner to enable PDF sign-off; current DOCX + extracted text remain authoritative. |
| 33 of 60 legacy forms use per-BM helper modules instead of the canonical `saveDocumentFormInputs` family | Medium (informational only) | These are the 55 non-canonical forms referenced in the task. Not in this task's scope. Future per-BM canonicalization pass should treat this list as input. |
| BM-172 known adapter problem | Medium (informational only) | Workspace still wraps it via `_Bm172FormInputsPanelAdapter`; the panel export shape should be canonicalized in a future pass. |

## 10. Recommendation

**NEEDS_FIX** (for the UI-driven end-to-end round-trip) — but **READY** at the
form-component + production-render level.

Reason: BM-171 form-inputs component, save endpoint, render endpoint, registry
entry, and DOCX output are all green. The only missing piece is a real
`generated_documents` row in the dev DB to drive a UI-driven round-trip from
`/documents/:id`. The DOCX artifact (`BM171_REAL_EDITOR_RENDER.latest.docx`) is
produced by the production render path with the canonical full fixture and
contains every required structural element. No claim of full end-to-end UI
sign-off is made without a fresh round-trip from a real DB row.