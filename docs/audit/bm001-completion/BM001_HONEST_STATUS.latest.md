# BM-001 canonical-render audit (Wording correction 2026-07-06)

> **Supersedes** `BM001_COMPLETION_AUDIT.latest.*` written by `build-bm001-completion-audit.mjs`.
> The script's machine status remains `status: PASS` because every render-artifact
> gate that ships inside the script is satisfied (renderer path, anchors, forbidden
> scan, format policy). **The artifact file from the script is left untouched** so
> reviewers can re-run the script and compare. This file is the authoritative
> word-of-truth for what PR7B claims about BM-001. See **`docs/audit/EXECUTOR_REPORT.latest.md`** for the roll-up.

## 1. Honest status

| Scope | Result | Evidence |
|---|---|---|
| BM-001 canonical renderer path | **PASS** | `ContractRenderPlanBuilder` + `DocxtemplaterContractRenderEngine` produced `BM001_RUNTIME_PREVIEW.latest.docx` (21722 bytes, sha256 `e529cbae…5908`); package integrity `pass`; format policy `pass` |
| BM-001 required anchors | **11 / 11 present** | `BM001_ACCEPTANCE.latest.json` → `requiredAnchorsPass=true` |
| BM-001 forbidden scan | **0 hits** | `BM001_ACCEPTANCE.latest.json` → `forbiddenHits=[]` |
| BM-001 full Form Flight profile | **NOT COMPLETE** | `apps/web/src/lib/form-flight/profiles/bm001.ts` self-declares "skeleton, not a full profile" — `demo: {}`, `summaryLines: undefined`, `acceptance: { requiredText: [], forbiddenText: [] }` |
| BM-001 profile slot coverage | **0 / 35 demo-filled** | Profile field paths exist; the runtime-ux demo fixture for BM-001 is empty by design (file header: "shared-core payload builder is a no-op for BM-001" until a future task fills it) |
| BM-001 missing required slots | **23 of 39 still missing** | `BM001_PAYLOAD.latest.json` → `missingRequiredCount=23` against the locked contract's 39 slots; canonical fixture only fills the shared subset. Profile is the source of those 23, not the renderer |
| BM-001 runtime workspace | **NOT DELIVERED** | A user typing values into the BM-001 form would still leave 23 slots blank because the profile has no `demo` / `userOverrideMatrix`; this requires `BM001_FULL_FORM_FLIGHT_PROFILE_COMPLETION` |

**Headline**: BM-001 cannot be called "hoàn thiện" in the sense of "user opens form, fills all fields, previews/exports with no missing fields". It **is** ready on the **renderer side**. Completing the profile is a separate phase.

## 2. Artifacts (unchanged, kept on disk for evidence)

All under `docs/audit/bm001-completion/`:

- `BM001_RUNTIME_PREVIEW.latest.docx` — canonical DOCX produced by the production renderer.
- `BM001_RUNTIME_PREVIEW_TEXT.latest.txt` — visible-text extract.
- `BM001_FORM_STATE.latest.json` — Form Flight form-state snapshot (35 field paths in profile, demo = `{}`).
- `BM001_PAYLOAD.latest.json` — render-plan payload (39 bindings, 23 missing).
- `BM001_ACCEPTANCE.latest.json` — required-anchor scan (11/11) + forbidden-value scan (0 hits) + sha256.
- `BM001_COMPLETION_AUDIT.latest.json` — script-generated machine status (status=PASS scoped to renderer path; the human headline is this MD).
- `BM001_COMPLETION_AUDIT.latest.md` — script-generated machine-readable MD (kept for script-output diff parity; superseded by the present file).

## 3. What this audit proves vs. what it does NOT prove

**Proves**:
- The BM-001 form code-paths from `ContractRenderPlanBuilder` through `DocxtemplaterContractRenderEngine` produce a clean DOCX for the shared subset of slots.
- The visible DOCX text contains every `BIÊN BẢN` / `Tiếp nhận nguồn tin về tội phạm` / `Hồi 08:00` / `26 tháng 12 năm 2025` / bold-section anchor expected in a real biên bản.
- Zero leak of `undefined`, `null`, `Invalid Date`, `[object Object]`, unresolved `{{…}}`, `[Họ tên]`, `[Ngày sinh]`, `[Số CMND]`, `Người nhận (mẫu)`, `Người ký (mẫu)`.
- Format policy and package integrity check pass.

**Does NOT prove**:
- That a user typing values into the BM-001 form will see a complete DOCX (the profile has no `demo`/`userOverrideMatrix`).
- That the BM-001 runtime UX has a usable summary panel (profile has no `summaryLines`).
- That any acceptance test would assert BM-001 specific anchors in the form workspace (profile has no `acceptance.requiredText` / `acceptance.forbiddenText`).
- That BM-001 is "rollout ready" — `missingRequiredCount=23` is a blocker in any user-driven flow, even though the renderer's empty-run output is harmless.

## 4. Next step

`BM001_FULL_FORM_FLIGHT_PROFILE_COMPLETION` — full Form Flight profile completion. Out of scope for PR7B.
