# FORM 213 GLOBAL V1 RELEASE

Date: 2026-06-22
Scope: GLOBAL
Records inserted: 213
Status: PUBLISHED
Version: v1 (all forms)

## Verification

| Check | Result |
|---|---|
| `smoke:forms-runtime:213` | PASS — 213 locked, 0 draft |
| `audit:forms:runtime-readiness` | PASS — 213/213 locked |
| `audit:docx:verify-locked` | PASS — Blocking 0, Remediation 93, Warning 40 |

## Corpus State

- Total forms: 213/213
- Locked: 213/213 (100%)
- Human-reviewed: 213/213
- Generic slots: 0
- Generic fields: 0
- Generic bindings: 0

## DB State

- Table: `form_contract_versions`
- Records: 213
- Status: `PUBLISHED`
- Scope key: `GLOBAL`
- Version: `1` (each form)
- Official: ID 1 (global scope, no agency filter)

## Key Fixes Applied During Publish

| # | Issue | Fix |
|---|---|---|
| 1 | `sourceId` field does not exist in schema | Extract `dbTemplateCode` from `sourceId` (e.g. `BM-001__hash` → `BM-001`) |
| 2 | Prisma camelCase vs schema field names | Use snake_case for raw field access (`template_id`, `contract_hash`) |
| 3 | `scope_key = templateCode` breaks runtime resolution | Use `scope_key = 'GLOBAL'` — matches existing API convention |
| 4 | `BigInt()` constructor required for `@db.UnsignedBigInt` fields | Pass `BigInt(officialId)` and `BigInt(template.id)` |
| 5 | `process.env.DATABASE_URL` not respected | Prefer env override over `.env` parse |
| 6 | Missing `OFFICIAL_ID` validation | Hard require `OFFICIAL_ID` env before any DB operation |
| 7 | Preflight not blocking on missing templates | Verify all 213 templates exist before transaction |
| 8 | No rollback on failure | `$transaction` auto-rollbacks on throw |
| 9 | Incorrect count assertion | Compare `created + skipped` against `expectExactly` |

## Remaining Work (Non-Blocking)

- **93 remediations** — DOCX template quality improvements (slot naming, placeholder rename)
- **40 warnings** — metadata completeness

## Commits in This Release

| Commit | Message |
|---|---|
| `10dbeea` | fix(publish): harden DB publish script with 4 safety fixes |
| `8b6941a` | fix(publish): prefer process.env for DATABASE_URL, parseEnv fallback |
| `18c06bd` | fix(publish): correct Prisma field names (snake_case) and scope_key=GLOBAL |
| `ff6f115` | fix(publish): use BigInt() for @db.UnsignedBigInt fields, add dbTemplateCode extraction |
| `9bd5655` | chore(forms): publish 213 locked contracts to runtime db |

## Tag

```
forms-213-global-v1
```
