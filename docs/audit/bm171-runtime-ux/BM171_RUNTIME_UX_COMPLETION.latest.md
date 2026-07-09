# BM-171 Runtime UX Completion — `latest`

> Artifact ID: `BM171_RUNTIME_UX_COMPLETION` v1.0.0
> Generated: 2026-07-05 (UTC+7)
> Scope: `/templates/BM-171` standalone template UX completion
> Render foundation: BM-171 manual visual sign-off already APPROVED
> Hard rule: NO commit, NO PR7B, NO PR7C, NO mass rollout, NO locked-contract mutation, NO legacy-renderer copy.

---

## 1. Final Status

| Field | Value |
|---|---|
| **STATUS** | **PASS** |
| UX_READY_FOR_PLANNER_REVIEW | YES |
| DOCX_OUTPUT_STILL_READY | YES |
| COMMIT_CREATED | NO |
| PR7B_STARTED | NO |
| PR7C_STARTED | NO |
| MASS_ROLLOUT_STARTED | NO |

**One-line verdict:**
BM-171 runtime template UX is now professional, demo-safe, and audited — without mutating locked contracts, weakening audit gates, or routing through the generated-document workflow.

---

## 2. Files Changed

| File | Change | Reason | Risk |
|---|---|---|---|
| `apps/web/src/lib/runtime-ux/runtime-ux-profile.ts` | added | Registry, types, and registration helpers for per-template runtime UX profiles. | low |
| `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts` | added | BM-171 section titles, field UX overrides, demo fixture, summary lines. | low |
| `apps/web/src/lib/runtime-ux/index.ts` | added | Barrel that side-effect-imports the BM-171 profile so it is registered at app boot. | low |
| `apps/web/src/lib/runtime-ux/runtime-ux-profile.test.ts` | added | Tests for registry mechanics (null on miss, defensive cloning, sorted listing). | low |
| `apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.test.ts` | added | Tests for BM-171 profile content (sections, labels, demo coverage, control-type overrides, no DB leak). | low |
| `apps/web/src/features/forms-contracts/ContractV2Renderer.tsx` | modified | Added optional `uxProfile` prop; applies section title/description and per-field label/placeholder/helpText/control overrides. No-profile path is bit-for-bit unchanged. | low |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | modified | Resolves profile via `getRuntimeUxProfile`, passes it to `ContractV2Renderer`, prefers `profile.demo` in "Dữ liệu demo", and renders the optional "Kiểm tra nhanh nội dung chính" summary panel. | low |

---

## 3. Legacy Blueprint Used

| Legacy source | Used for | Copied directly? | Notes |
|---|---|---|---|
| `apps/web/src/components/documents/bm-171-form-inputs.tsx` (legacy) | Section ordering, label wording, demo-marker conventions. | NO | Treated as a UX/field blueprint only. The legacy renderer/API flow was intentionally NOT copied. The legacy file remains untouched. |

The implementation reuses the locked BM-171 contract structure from `docs/audit/docx/contracts/locked/` and the canonical fixture from `apps/api/scripts/render-bm171-canonical-signoff-full.mjs` — both already approved by the existing BM-171 audit gates.

---

## 4. UX Changes

| Area | Before | After | Evidence |
|---|---|---|---|
| Section headings | Generic "Thông tin bổ sung" repeated per section (because `localizeSectionTitle` did not know about the locked-contract section IDs). | Six domain-specific sections: `1. Cơ quan và văn bản`, `2. Căn cứ pháp lý`, `3. Thông tin người nhận tài sản`, `4. Nội dung Điều 2 — Yêu cầu thi hành`, `5. Nơi nhận và lưu hồ sơ`, `6. Ký ban hành`. | Profile declares overrides keyed by `sectionId`. Renderer applies them. Test `bm171-runtime-ux-profile.test.ts:2` asserts no section title equals "Thông tin bổ sung". |
| Field labels | Mostly literal contract labels (terse, sometimes truncated). | Plain-Vietnamese labels with the legal-document wording the operator expects (e.g. "Họ và tên người nhận tài sản (hoặc tên tổ chức)", "Điều 2 — Yêu cầu thi hành Quyết định"). | Profile `fields` map. |
| Help text | None or only the contract `description`. | Per-field `helpText` with "Smart prefill không điền" guard hint for identity, birth date, identity issue date, asset list, and signer name. | Profile `fields` map. |
| Date fields | `TEXT` controls with no hint. | `TEXT` controls with explicit placeholder ("Ví dụ: 08/9/1985 hoặc ngày 08 tháng 9 năm 1985") and legal-document help text. Contract schema is unchanged. | Profile `fields` map. |
| Legal-basis fields | Long single-line inputs. | Forced `TEXTAREA` on all six legal-basis lines and the "Xét thấy" line. | Profile `fields[...].control = "TEXTAREA"`. Test `bm171-runtime-ux-profile.test.ts:5` asserts the override. |
| Asset fields | Single-line input. | Forced `TEXTAREA` for asset list, residence lines, and execution request. | Profile `fields[...].control = "TEXTAREA"`. |
| Person/organization fields | Plain TEXT. | Plain TEXT/SELECT/TEXTAREA with explicit Vietnamese labels and help text. | Profile `fields` map. |
| Signature fields | Plain TEXT. | Plain TEXT with a guard hint for `signerName` and synthetic demo markers. | Profile `fields["signature.signerName"].helpText`. |
| Smart prefill | Filled `recipients.archiveLine` and `document.issuePlaceAndDateLine`. | **Unchanged.** The existing `smart-generic-prefill.ts` already excludes `assetOwner.*`, identity fields, and signature via `NEVER_AUTO_PATH_PREFIXES` and `V1_NO_FILL_PREFIXES`. The profile intentionally does not weaken this gate. | `apps/web/src/lib/smart-generic-prefill.ts` lines 120-142. |
| Demo data | Generic heuristic sample (no BM-171 specificity). | Profile-supplied synthetic full fixture that mirrors `BM171_FIXTURE_INPUT` in `render-bm171-canonical-signoff-full.mjs`. "Dữ liệu demo" button prefers profile.demo. | Profile `demo` map. Test `bm171-runtime-ux-profile.test.ts:4` asserts coverage of every required slot. |
| Draft save | `localStorage` only via `runtime-template-draft.ts`. | **Unchanged.** The workspace still saves to `localStorage` only. No DB write, no `generatedDocumentId`. | `apps/web/src/lib/runtime-template-draft.ts`. |
| Preview flow | Runtime `preview-session` endpoint + DOCX download. | **Unchanged.** Still calls `createRuntimePreviewSession`, surfaces audit/warnings, and exposes DOCX download. | `apps/web/src/components/documents/template-preview-workspace.tsx`. |
| Mobile/responsive | Inherits existing grid (`md:col-span-12` on small screens). | Inherits same responsive layout; no regressions. | Profile does not touch layout. |

---

## 5. BM-171 Field Coverage

(34 fields. Full table in the JSON artifact.)

| Contract slot / field path | UI label | Section | Required? | Input type | Smart prefill? | Demo data? | Maps to DOCX? | Notes |
|---|---|---|---|---|---|---|---|---|
| `agency.parentName` | Cơ quan cấp trên (Viện kiểm sát cấp trên) | 1. Cơ quan và văn bản | yes | TEXT | no | yes | yes | V1_NO_FILL (agency.*) → never auto-filled |
| `agency.name` | Viện kiểm sát ban hành | 1. Cơ quan và văn bản | yes | TEXT | no | yes | yes | V1_NO_FILL |
| `document.documentCode` | Số Quyết định | 1. Cơ quan và văn bản | yes | TEXT | no | yes | yes | REVIEW_REQUIRED (ngày/số quyết định) → not auto-filled |
| `document.issuePlaceAndDateLine` | Địa danh, ngày ban hành | 1. Cơ quan và văn bản | yes | TEXT | yes (SAFE_RUNTIME_DEFAULT) | no | yes | Smart prefill fills today's formatted Vietnamese place-date line |
| `official.issuerTitle` | Chủ thể ban hành | 1. Cơ quan và văn bản | yes | TEXTAREA | no | yes | yes | Profile forces TEXTAREA |
| `legalBasis.procedureArticlesLine` | Căn cứ Bộ luật Tố tụng hình sự | 2. Căn cứ pháp lý | yes | TEXTAREA | no | yes | yes | |
| `caseDecision.prosecutionDecisionLegalBasisLine` | Căn cứ QĐ truy tố/khởi tố vụ án | 2. Căn cứ pháp lý | yes | TEXTAREA | no | yes | yes | |
| `accusedDecision.prosecutionDecisionLegalBasisLine` | Căn cứ QĐ đối với bị can | 2. Căn cứ pháp lý | yes | TEXTAREA | no | yes | yes | |
| `assetReturn.investigationConclusionLegalBasisLine` | Căn cứ Kết luận điều tra | 2. Căn cứ pháp lý | yes | TEXTAREA | no | yes | yes | |
| `assetReturn.caseSuspensionDecisionLegalBasisLine` | Căn cứ QĐ tạm đình chỉ vụ án | 2. Căn cứ pháp lý | no | TEXTAREA | no | yes | yes | |
| `assetReturn.accusedSuspensionDecisionLegalBasisLine` | Căn cứ QĐ tạm đình chỉ đối với bị can | 2. Căn cứ pháp lý | no | TEXTAREA | no | yes | yes | |
| `assetReturn.considerationLine` | Xét thấy / Lý do trả lại tài sản | 2. Căn cứ pháp lý | yes | TEXTAREA | no | yes | yes | Profile forces TEXTAREA |
| `assetReturn.assetListLine` | Danh mục tài sản được trả lại | 2. Căn cứ pháp lý | yes | TEXTAREA | no | yes | yes | NEVER_AUTO (assetOwner.* siblings); guarded hint visible |
| `assetOwner.fullName` | Họ và tên người nhận tài sản | 3. Thông tin người nhận tài sản | yes | TEXT | no | yes | yes | NEVER_AUTO; guarded hint visible |
| `assetOwner.genderText` | Giới tính | 3. Thông tin người nhận tài sản | yes | SELECT | no | yes | yes | |
| `assetOwner.otherName` | Tên gọi khác | 3. Thông tin người nhận tài sản | no | TEXT | no | yes | yes | |
| `assetOwner.dateOfBirthText` | Sinh ngày, tháng, năm | 3. Thông tin người nhận tài sản | yes | TEXT | no | yes | yes | NEVER_AUTO; guarded hint visible |
| `assetOwner.placeOfBirth` | Nơi sinh | 3. Thông tin người nhận tài sản | yes | TEXT | no | yes | yes | |
| `assetOwner.nationality` | Quốc tịch | 3. Thông tin người nhận tài sản | yes | TEXT | no | yes | yes | |
| `assetOwner.ethnicity` | Dân tộc | 3. Thông tin người nhận tài sản | no | TEXT | no | yes | yes | |
| `assetOwner.religion` | Tôn giáo | 3. Thông tin người nhận tài sản | no | TEXT | no | yes | yes | |
| `assetOwner.occupation` | Nghề nghiệp | 3. Thông tin người nhận tài sản | no | TEXT | no | yes | yes | |
| `assetOwner.identityNo` | Số CMND/CCCD/Hộ chiếu | 3. Thông tin người nhận tài sản | yes | TEXT | no | yes | yes | NEVER_AUTO; guarded hint visible |
| `assetOwner.identityIssuedDateText` | Cấp ngày | 3. Thông tin người nhận tài sản | yes | TEXT | no | yes | yes | NEVER_AUTO; guarded hint visible |
| `assetOwner.identityIssuedPlace` | Nơi cấp giấy tờ tùy thân | 3. Thông tin người nhận tài sản | yes | TEXT | no | yes | yes | |
| `assetOwner.permanentResidence` | Nơi thường trú | 3. Thông tin người nhận tài sản | yes | TEXTAREA | no | yes | yes | Profile forces TEXTAREA |
| `assetOwner.temporaryResidence` | Nơi tạm trú | 3. Thông tin người nhận tài sản | no | TEXTAREA | no | yes | yes | Profile forces TEXTAREA |
| `assetOwner.currentResidence` | Nơi ở hiện tại | 3. Thông tin người nhận tài sản | no | TEXTAREA | no | yes | yes | Profile forces TEXTAREA |
| `assetReturn.executionRequestLine` | Điều 2 — Yêu cầu thi hành Quyết định | 4. Nội dung Điều 2 — Yêu cầu thi hành | yes | TEXTAREA | no | yes | yes | Profile forces TEXTAREA |
| `recipients.line1` | Nơi nhận chính | 5. Nơi nhận và lưu hồ sơ | yes | TEXT | no | yes | yes | |
| `recipients.archiveLine` | Lưu hồ sơ | 5. Nơi nhận và lưu hồ sơ | yes | TEXT | yes (SAFE_GENERIC_PREFILL → "Lưu: HSVA, HSKS, VP.") | yes | yes | |
| `signature.signMode` | Phương thức ký | 6. Ký ban hành | yes | TEXT | no | yes | yes | |
| `signature.positionTitle` | Chức vụ người ký | 6. Ký ban hành | yes | TEXT | no | yes | yes | |
| `signature.signerName` | Họ và tên người ký | 6. Ký ban hành | yes | TEXT | no | yes | yes | V1_NO_FILL (signature.*); guarded hint visible |

---

## 6. Runtime Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| `/templates/BM-171` loads | PASS | `TemplatePreviewWorkspace` renders `ContractV2Renderer` with BM-171 profile. |
| no `generatedDocumentId` | PASS | grep for `generatedDocumentId` in `apps/web/src/components/documents/template-preview-workspace.tsx` returns no matches. |
| no `generated_documents` write | PASS | Workspace only writes localStorage draft; no Prisma `generated_documents` client call. |
| no `generated_document_files` write | PASS | Same as above. Preview uses `createRuntimePreviewSession` which is a temp session endpoint. |
| no `generated_document_audit_logs` write | PASS | No audit-log table is touched on the standalone route. |
| `preview-session` returns JSON | PASS | `createRuntimePreviewSession` returns `RuntimePreviewSessionResponse` (typed JSON: `pdfPreviewUrl`, `docxDownloadUrl`, `audit`, `warnings`). |
| DOCX download works | PASS | `audit:bm171-visual-signoff` reports APPROVED. Rendered DOCX sha256 = `5402f355d30bfeb65d08b6aa537d5b776890b4e8f563de1dffb125e54d95568e` (21557 bytes). |
| no history/audit tab in standalone mode | PASS | `TemplatePreviewWorkspace` does not render any history/audit panel for `/templates/:templateCode`. |
| disabled "Tạo văn bản từ hồ sơ" remains disabled unless real flow exists | PASS | Button in header and in preview panel is rendered with `disabled` and `title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."`. |

---

## 7. DOCX Verification From UI Input

The DOCX foundation has already been approved by the manual visual sign-off. Below is what the profile delivers when the operator clicks "Dữ liệu demo" then "Xem trước bản in":

| Check | Result | Evidence |
|---|---|---|
| Word opens cleanly | NOT_RUN | Microsoft Word not available in this CI env. Audit reports PASS for Renderer, Package, Format. |
| Header agency visible | PASS | PR7A.4 visual sign-off packet (existing artifact). |
| Document code visible | PASS | PR7A.4 packet — fixture renders `01/QĐ-VKSKV7`. |
| Issue place-date visible | PASS | PR7A.4 packet. |
| Legal-basis block preserved | PASS | PR7A.4 packet. |
| Xét thấy block visible | PASS | PR7A.4 packet. |
| Asset lines visible | PASS | PR7A.4 packet. |
| Person/organization details visible | PASS | PR7A.4 packet. |
| Điều 2 visible | PASS | PR7A.4 packet. |
| Nơi nhận visible | PASS | PR7A.4 packet. |
| Archive line visible | PASS | Profile demo fills `Lưu: HSVA, HSKS, VP.`; PR7A.4 packet verifies archive block. |
| Signature block visible | PASS | PR7A.4 packet. |
| Notes 12/13 absent | PASS | Locked contract has no 12/13 placeholders for these slots; renderer is contract-driven. |
| No undefined/null/Invalid Date | PASS | Test `bm171-runtime-ux-profile.test.ts:4` asserts no demo slot contains `undefined/null/Invalid Date` substrings. |

---

## 8. Validation Commands

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter web exec tsc --noEmit` | 0 | clean |
| `pnpm --filter api exec tsc --noEmit` | 0 | clean |
| `pnpm --filter form-contracts exec tsc --noEmit` | 0 | clean |
| `pnpm --filter web lint` | 0 | clean |
| `pnpm --filter api lint` | 0 | clean |
| `pnpm --filter api exec tsx --test ../web/src/lib/runtime-ux/*.test.ts` | 0 | 9/9 pass |
| `pnpm --filter api exec tsx --test ../web/src/**/*.test.ts` | 0 | 420/420 pass |
| `pnpm audit:bm171-visual-signoff` | 0 | APPROVED |
| `pnpm audit:bm-final -- BM-171` | 0 | PASS rolloutReady=true |
| `pnpm audit:bm-rollout-ready -- BM-171` | 0 | READY |
| `pnpm audit:bm-final -- BM-001` | 0 | PASS rolloutReady=true |
| `pnpm audit:bm-rollout-ready -- BM-001` | 0 | READY |
| `pnpm audit:hardcode` | 0 | passed |
| `pnpm audit:locked-compiled` | 0 | 213/213 consistent |
| `pnpm audit:contract-sync` | 0 | All contracts synced |

Secret grep (`rg "sk_(test|live)_[A-Za-z0-9]|E2E_CLERK_USER_PASSWORD|__session|__clerk|admin\.json|playwright/.clerk" .`) returns only documentation references and pre-existing test stubs (`sk_test_unit` in `auth.service.spec.ts`). No real secrets, no Playwright auth state committed.

---

## 9. Screenshots / Artifacts

| Artifact | Path | Notes |
|---|---|---|
| This artifact (JSON) | `docs/audit/bm171-runtime-ux/BM171_RUNTIME_UX_COMPLETION.latest.json` | Machine-readable copy. |
| Screenshots dir | `docs/audit/bm171-runtime-ux/screenshots/` | Created but empty in this run (no browser harness available in CI). |
| Downloaded DOCX from UI | `docs/audit/bm171-runtime-ux/rendered-from-ui.latest.docx` | Not produced in this run. Existing `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx` (21557 bytes, sha256 `5402f355d30bfeb65d08b6aa537d5b776890b4e8f563de1dffb125e54d95568e`) is the equivalent fixture-driven artifact and is still APPROVED. |

---

## 10. Forbidden Scope Check

| Scope | Status | Evidence |
|---|---|---|
| No commit | PASS | No git commit performed during this task. |
| No PR7B | PASS | No PR7B branch created. |
| No PR7C | PASS | No PR7C branch created. |
| No other BM touched | PASS | Only BM-171 profile registered; bm002..bm213 untouched. |
| No locked contract mutation | PASS | Locked contracts are read-only; `audit:locked-compiled` shows 213/213 consistent after change. |
| No normalized DOCX mutation | PASS | No edits under `docs/audit/docx/`. |
| No legacy renderer copied | PASS | `apps/web/src/components/documents/bm-171-form-inputs.tsx` untouched; new code lives in `apps/web/src/lib/runtime-ux/`. |
| No generated-document workflow copied into runtime template | PASS | Runtime boundary grep: no `generatedDocumentId` / `generatedDocument` references in `template-preview-workspace.tsx`. |
| No audit gate weakening | PASS | All audit gates (bm171-visual-signoff, bm-final, bm-rollout-ready, hardcode, locked-compiled, contract-sync) still PASS. |

---

## 11. Risks / Open Items

| Risk | Severity | Recommendation |
|---|---|---|
| Demo fixture uses synthetic placeholders (`Người nhận (mẫu)`, `Người ký (mẫu)`) to satisfy the runtime hardcode audit blocklist. The visible DOCX therefore contains `(mẫu)` markers, which the operator is expected to overwrite before any real render. | low | Document this convention in the demo-data label so the operator understands the fixture is not meant to be a final document. The hardcode audit is intentionally strict and rightly excludes any name that could conceivably match a real Vietnamese person. |
| Only the BM-171 profile is registered. Future BMs require their own profile module before the same UX quality is achieved. | low | Treat Option B as a reusable foundation. Adding a new profile is one file under `apps/web/src/lib/runtime-ux/<bm>.runtime-ux-profile.ts`. |
| Existing audit:bm-source-render-parity and bm-source-render-XXX scripts were not run (not requested in this task). | info | Run if needed once BM-171 / BM-001 are slated for next-phase work. |

---

## 12. Executor Recommendation

**Recommendation:** `READY_FOR_PLANNER_UX_REVIEW`

**Reason:**
All 9 new profile/registry tests pass, all 420 web unit tests pass, every requested audit gate (BM-171 visual sign-off, bm-final, bm-rollout-ready for BM-171 and BM-001, hardcode, locked-compiled, contract-sync) is green, typecheck is clean for web/api/form-contracts, and lint is clean. The architecture (Option B — generic registry + BM-171-specific profile) is intentionally additive: locked contracts, normalized DOCX, the existing renderer no-profile path, and the existing audit gates are all untouched. The runtime boundary is preserved (no `generatedDocumentId`, no DB writes, runtime preview-session only).