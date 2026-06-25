# C1-PREP: Contract Sync Guard Readiness Audit
Generated: 2026-06-25T15:10:38.645Z

## Strategy
Recommended C1 implementation: **DB_UNAVAILABLE_USE_FILE_ONLY_GUARD**

## Locked Contracts
| Metric | Value |
|--------|-------|
| Total locked files | 213 |
| Compiled to V2 artifact | 3 |
| Failed to parse | 0 |

## Database
| Metric | Value |
|--------|-------|
| DB available | NO |
| DB compiled contracts | 0 |

## Warnings
- 210 locked contracts have no compiled-v2 artifact in docs/audit/docx/compiled-v2/ (BM-004, BM-005, BM-006, BM-007, BM-008...). Run "pnpm contract:compile" to populate. These will appear as "missingInDb" until published.
- DATABASE_URL not set or Prisma client unavailable. DB comparison skipped.

## Key Findings for C1

DB not available. C1 startup guard should:
1. Skip DB comparison (DB_UNAVAILABLE)
2. Optionally verify compiled-v2 artifacts exist for all locked contracts
3. Log warning but allow startup

**Recommended**: Run this audit with DB available to confirm the
compiled hash compare strategy before implementing C1.

## Hash Method Clarification

| Hash function | Where used | Strips volatile fields? |
|---------------|-----------|--------------------------|
| stableHash() | compileContract() -> artifact.contractHash | NO (plain stable-stringify) |
| stableContractHash() | publish-locked-contracts-to-db -> DB contract_hash column | YES (strips volatile) |

**C1 must use stableHash() on both sides (compiled artifact).**
DB contract_hash column uses stableContractHash() and CANNOT be compared directly.