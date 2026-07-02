# RELEASE_CHECKLIST.md — Pre-Release Gates

> **Source:** Extracted from `docs/PROJECT_SPEC.md` §12.
> **Canonical reference:** `docs/PROJECT_SPEC.md` is the master spec.

---

Every PR that changes business behavior **must** pass all gates below before merge.

## 1. Product Boundary Check

```
□ Standalone template = Runtime DOCX/Preview Session (no persisted document)
□ Persisted document = Generated Document Workspace (has DB rows + audit logs)
□ These two flows are NOT mixed
```

## 2. Source of Truth Check

```
□ 213 DOCX contracts/templates are NOT mutated outside of explicit scope
□ pnpm audit:locked-compiled passes (213/213 consistent, 0 missing, 0 stale)
□ pnpm audit:contract-sync passes (all contracts sync with DB)
□ Do NOT mass-edit contracts in small PRs
```

## 3. Auth / Agency Boundary Check

```
□ Authentication ≠ Authorization is preserved
□ Clerk authenticates identity
□ DB officials/permissions authorize business access
□ CROSS-AGENCY access → 403
□ UI hide/show is NOT a security boundary
□ Server/API always checks permission
□ Clerk-protected web routes use Clerk browser session, NOT qlv_session
```

## 4. Locked Contract Mutation Check

```
□ Locked DOCX contracts/templates are NOT mutated outside explicit scope
□ If a contract must change, follow the contract editing workflow
□ Touching 213 contracts in small PRs is prohibited
```

## 5. Honest UX Check

```
□ UI does NOT say "Đã tạo bản xem trước" when no visual preview exists
□ When pdfPreviewUrl is null and no DOCX renderer:
    → UI says "Đã tạo file DOCX tạm thời"
    → Copy: "File DOCX đã được tạo tạm thời nhưng hiện chưa thể hiển thị trực tiếp trong trình duyệt. Bạn có thể tải DOCX để kiểm tra định dạng."
□ Panel style: neutral/warning/amber, NOT green success
□ PDF unavailable message visible: "Tính năng xem trước PDF đang được phát triển."
□ Save-to-case CTA: disabled, no href, no route loop
□ No "Lịch sử xử lý" in standalone template mode
□ /documents/:id?tab=preview and ?tab=history still work
```

## 6. Test / Lint / Typecheck / Audit Gates

```bash
pnpm --filter api test --runInBand          # PASS
pnpm --filter api lint                      # PASS
pnpm --filter api exec tsc --noEmit        # PASS
pnpm --filter web lint                     # PASS
pnpm --filter web exec tsc --noEmit       # PASS
pnpm typecheck                             # PASS
pnpm lint                                  # PASS
pnpm audit:hardcode                        # PASS
pnpm audit:locked-compiled                 # PASS
pnpm audit:contract-sync                   # PASS
pnpm build                                 # PASS
```

## 7. Docs / Audit Update Check

```
□ docs/PROJECT_SPEC.md updated if architecture/auth/UX changes
□ docs/AUTH_RBAC_POLICY.md updated if auth invariants changed
□ docs/SECURITY_POLICY.md updated if secrets/pattern policy changed
□ docs/TESTING_STRATEGY.md updated if testing approach changed
□ docs/RELEASE_CHECKLIST.md updated if release gates changed
□ Audit reports updated if relevant
```

## 8. Git Status Check

```
□ No secrets committed
□ No .env.local committed
□ No .env.e2e.local committed
□ No playwright/.clerk/admin.json committed
□ No auth state/token/cookie committed
□ No screenshots with tokens/cookies/passwords committed
□ No storage/runtime-preview-sessions/ committed
□ No test-results/ or playwright-report/ committed
□ Git status is clean for the scope of this PR
```

## 9. Secret Hygiene Check

```bash
rg "sk_(test|live)_[A-Za-z0-9]|E2E_CLERK_USER_PASSWORD" .
```

Expected: **Zero matches**.

```
□ No sk_test_ or sk_live_ strings found
□ No E2E_CLERK_USER_PASSWORD found
□ No .env.e2e.local staged
□ No playwright/.clerk staged
□ No auth/session files staged
```

## 10. Authenticated E2E Strategy Check

```
□ Clerk-protected web routes use Clerk ticket strategy + Playwright storageState
□ Do NOT use qlv_session cookie to test Clerk web routes
□ Do NOT automate password/MFA forms
□ Do NOT include E2E_CLERK_USER_PASSWORD in code/spec/example
□ E2E user is linked with active official in DB (identity projection works)
```

---

## Quick Reference

Run all gates with:

```bash
pnpm --filter api test --runInBand
pnpm --filter api lint && pnpm --filter web lint
pnpm --filter api exec tsc --noEmit && pnpm --filter web exec tsc --noEmit
pnpm audit:hardcode && pnpm audit:locked-compiled && pnpm audit:contract-sync
pnpm build
rg "sk_(test|live)_[A-Za-z0-9]|E2E_CLERK_USER_PASSWORD" .
```

---

*Canonical source: `docs/PROJECT_SPEC.md §12`*
