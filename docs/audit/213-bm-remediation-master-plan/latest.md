# 213 BM Remediation Master Plan

Generated: 2026-06-27T18:23:43.827Z

## Executive Decision

- The old safe-label Batch 1 is superseded.
- The current field-level safe-label Batch 1 has no auto-approvable fields.
- Remaining BM work must proceed by lane: path/domain, source policy, remediation leak, DOCX evidence, legal review, then DB/runtime sync.

## Global Snapshot

| Metric | Value |
|--------|-------|
| Contracts | 213 |
| Fields | 2443 |
| Total issues | 1497 |
| FAIL | 1156 |
| REVIEW | 341 |
| Safe-label AUTO_SAFE_APPROVABLE fields | 0 |
| Safe-label approval command | none |

## Issue Counts

| Issue | Count |
|-------|-------|
| BAD_LABEL | 353 |
| UI_VISIBLE_BAD_METADATA | 15 |
| GENERIC_FIELD_CANONICALIZATION | 352 |
| RAW_PATTERN_DOMAIN_MISMATCH | 10 |
| SOURCE_MISMATCH | 121 |
| SHOULD_BE_READONLY | 42 |
| REQUIRED_SUSPICIOUS | 115 |
| COMPILED_DRIFT | 57 |
| REMEDIATION_LEAK | 10 |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 |

## Primary Lane Counts

| Lane | BMs |
|------|-----|
| PATH_DOMAIN_BINDING | 127 |
| SOURCE_POLICY | 50 |
| VERIFY_ONLY | 17 |
| KEEP_DEFERRED_REVIEW | 8 |
| DOCX_AUTHORING | 7 |
| REMEDIATION_LEAK | 2 |
| EVIDENCE_REVIEW | 2 |

## Runtime/Docker/SQL Evidence

| Check | Current evidence |
|-------|------------------|
| Docker daemon | reachable |
| Dev compose config | valid |
| Prod compose config | valid |
| DB TCP | open |
| Prisma migrate status | pass |
| Contract sync | Strategy=DB_COMPARE, matched=213, stale=0. |
| Publish forms DB plan | pass: Publish plan generated successfully. |

## Root Cause Findings

- The >3000-count symptom was a mixed report, not one label bug: label, path/domain, source policy, weak evidence, remediation, compiled drift, and runtime DB evidence were mixed together.
- Compiled artifacts were stale/noisy earlier; official contract compilation and enum normalization reduced COMPILED_DRIFT noise, leaving true source-policy drift.
- The V1 adapter previously allowed docxSlots labels to override canonical field labels in compiled/UI output; canonicalFields labels are now the UI source of truth.
- The old Batch 1 was BM-level and stale; the regenerated field-level safe-label plan has zero AUTO_SAFE fields because current label issues co-occur with blockers/review/deferred tracks.
- Runtime DB contract-sync was verified against form_contract_versions with no missing or stale records.

## Execution Order

1. Keep safe-label batch disabled until AUTO_SAFE_APPROVABLE is non-empty under field-level gates.
2. Clear KEEP_DEFERRED and REMEDIATION_LEAK forms with DOCX evidence and reviewed decision packs.
3. Process PATH_DOMAIN_BINDING forms by comparing rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value.
4. Process SOURCE_POLICY forms by deciding manual/case/agency/official/system/computed source kind and readonly/required semantics.
5. Process WEAK_EVIDENCE and LEGAL_REVIEW forms with reviewer-led evidence packets.
6. Regenerate contracts through official paths, then run contract validate, compile, compile-sync, root-cause audit, and safe-label plan refresh.
7. After file artifacts are clean, start Docker/DB, run migrations, publish forms to DB, and run DB contract-sync.
8. Run runtime smoke for Form Studio, documents, and DOCX rendering before marking any BM complete.

## Top Issue BMs

| Rank | BM | Issues | Lane | Risk | Key counts |
|------|----|--------|------|------|------------|
| 1 | BM-096 | 32 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=16, GENERIC_FIELD_CANONICALIZATION=16 |
| 2 | BM-155 | 29 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=13, UI_VISIBLE_BAD_METADATA=2, GENERIC_FIELD_CANONICALIZATION=13, SOURCE_MISMATCH=1 |
| 3 | BM-136 | 28 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=14, GENERIC_FIELD_CANONICALIZATION=14 |
| 4 | BM-212 | 25 | SOURCE_POLICY | HIGH | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=23 |
| 5 | BM-069 | 24 | KEEP_DEFERRED_REVIEW | HIGH | BAD_LABEL=5, UI_VISIBLE_BAD_METADATA=5, GENERIC_FIELD_CANONICALIZATION=5, REQUIRED_SUSPICIOUS=4, REMEDIATION_LEAK=5 |
| 6 | BM-117 | 21 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=10, GENERIC_FIELD_CANONICALIZATION=10, SOURCE_MISMATCH=1 |
| 7 | BM-118 | 21 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=10, GENERIC_FIELD_CANONICALIZATION=10, SOURCE_MISMATCH=1 |
| 8 | BM-203 | 21 | SOURCE_POLICY | HIGH | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=19 |
| 9 | BM-211 | 21 | SOURCE_POLICY | HIGH | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=19 |
| 10 | BM-126 | 20 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=9, GENERIC_FIELD_CANONICALIZATION=9, SOURCE_MISMATCH=1, COMPILED_DRIFT=1 |
| 11 | BM-186 | 20 | SOURCE_POLICY | HIGH | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=18 |
| 12 | BM-196 | 20 | SOURCE_POLICY | HIGH | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=18 |
| 13 | BM-190 | 19 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=17 |
| 14 | BM-199 | 19 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=17 |
| 15 | BM-106 | 18 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=9, GENERIC_FIELD_CANONICALIZATION=9 |
| 16 | BM-188 | 18 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=16 |
| 17 | BM-191 | 18 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=16 |
| 18 | BM-028 | 17 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=7, GENERIC_FIELD_CANONICALIZATION=7, SOURCE_MISMATCH=3 |
| 19 | BM-192 | 17 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=15 |
| 20 | BM-201 | 17 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=15 |
| 21 | BM-036 | 16 | PATH_DOMAIN_BINDING | HIGH | BAD_LABEL=2, GENERIC_FIELD_CANONICALIZATION=2, RAW_PATTERN_DOMAIN_MISMATCH=5, SHOULD_BE_READONLY=2, REQUIRED_SUSPICIOUS=2, COMPILED_DRIFT=3 |
| 22 | BM-187 | 16 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=14 |
| 23 | BM-189 | 16 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=1, WEAK_EVIDENCE_AUTO_LOCKED=15 |
| 24 | BM-193 | 16 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=2, WEAK_EVIDENCE_AUTO_LOCKED=14 |
| 25 | BM-205 | 15 | SOURCE_POLICY | MEDIUM | REQUIRED_SUSPICIOUS=1, WEAK_EVIDENCE_AUTO_LOCKED=14 |

## Per-BM Ledger

| BM | Issues | Primary lane | Risk | BAD_LABEL | PATH | SOURCE | READONLY | WEAK | REMEDIATION | Next action |
|----|--------|--------------|------|-----------|------|--------|----------|------|-------------|-------------|
| BM-001 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-002 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-003 | 7 | SOURCE_POLICY | MEDIUM | 3 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-004 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-005 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-006 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-007 | 1 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-008 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-009 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-010 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 3 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-011 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-012 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-013 | 11 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-014 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 3 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-015 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-016 | 1 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-017 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-018 | 1 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-019 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-020 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-021 | 14 | PATH_DOMAIN_BINDING | HIGH | 3 | 2 | 0 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-022 | 5 | PATH_DOMAIN_BINDING | MEDIUM | 0 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-023 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 1 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-024 | 5 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-025 | 7 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-026 | 4 | PATH_DOMAIN_BINDING | MEDIUM | 0 | 1 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-027 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-028 | 17 | PATH_DOMAIN_BINDING | HIGH | 7 | 0 | 3 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-029 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-030 | 1 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-031 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 0 | 1 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-032 | 7 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-033 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-034 | 4 | PATH_DOMAIN_BINDING | MEDIUM | 0 | 1 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-035 | 2 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-036 | 16 | PATH_DOMAIN_BINDING | HIGH | 2 | 5 | 0 | 2 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-037 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-038 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-039 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-040 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-041 | 3 | PATH_DOMAIN_BINDING | MEDIUM | 0 | 1 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-042 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 3 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-043 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 3 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-044 | 5 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 1 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-045 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-046 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-047 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-048 | 12 | PATH_DOMAIN_BINDING | HIGH | 6 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-049 | 2 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-050 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-051 | 3 | DOCX_AUTHORING | HIGH | 0 | 0 | 1 | 0 | 0 | 0 | Return to normalized/source DOCX evidence; reauthor or remap before contract mutation. |
| BM-052 | 5 | DOCX_AUTHORING | HIGH | 1 | 0 | 1 | 0 | 0 | 0 | Return to normalized/source DOCX evidence; reauthor or remap before contract mutation. |
| BM-053 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-054 | 2 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 2 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-055 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 3 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-056 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 1 | 0 | 1 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-057 | 1 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-058 | 9 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 5 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-059 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 1 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-060 | 2 | DOCX_AUTHORING | HIGH | 0 | 0 | 0 | 0 | 0 | 0 | Return to normalized/source DOCX evidence; reauthor or remap before contract mutation. |
| BM-061 | 2 | KEEP_DEFERRED_REVIEW | HIGH | 0 | 0 | 0 | 0 | 0 | 0 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-062 | 5 | DOCX_AUTHORING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Return to normalized/source DOCX evidence; reauthor or remap before contract mutation. |
| BM-063 | 5 | KEEP_DEFERRED_REVIEW | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-064 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-065 | 6 | KEEP_DEFERRED_REVIEW | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-066 | 5 | DOCX_AUTHORING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Return to normalized/source DOCX evidence; reauthor or remap before contract mutation. |
| BM-067 | 5 | KEEP_DEFERRED_REVIEW | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-068 | 4 | DOCX_AUTHORING | HIGH | 0 | 0 | 0 | 0 | 0 | 0 | Return to normalized/source DOCX evidence; reauthor or remap before contract mutation. |
| BM-069 | 24 | KEEP_DEFERRED_REVIEW | HIGH | 5 | 0 | 0 | 0 | 0 | 5 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-070 | 5 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 5 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-071 | 5 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 5 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-072 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-073 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-074 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-075 | 7 | KEEP_DEFERRED_REVIEW | HIGH | 1 | 0 | 0 | 0 | 0 | 1 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-076 | 9 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-077 | 5 | KEEP_DEFERRED_REVIEW | HIGH | 1 | 0 | 0 | 0 | 0 | 1 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-078 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-079 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-080 | 5 | DOCX_AUTHORING | HIGH | 0 | 0 | 0 | 0 | 0 | 0 | Return to normalized/source DOCX evidence; reauthor or remap before contract mutation. |
| BM-081 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-082 | 5 | KEEP_DEFERRED_REVIEW | HIGH | 1 | 0 | 0 | 0 | 0 | 1 | Resolve deferred header/body/path finding first; do not run fast label-only approval. |
| BM-083 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-084 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-085 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-086 | 1 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-087 | 12 | PATH_DOMAIN_BINDING | HIGH | 6 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-088 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-089 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-090 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-091 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-092 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-093 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-094 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-095 | 7 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-096 | 32 | PATH_DOMAIN_BINDING | HIGH | 16 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-097 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-098 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-099 | 2 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-100 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-101 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-102 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-103 | 1 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-104 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-105 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-106 | 18 | PATH_DOMAIN_BINDING | HIGH | 9 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-107 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-108 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-109 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-110 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-111 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-112 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-113 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-114 | 10 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-115 | 10 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-116 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-117 | 21 | PATH_DOMAIN_BINDING | HIGH | 10 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-118 | 21 | PATH_DOMAIN_BINDING | HIGH | 10 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-119 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-120 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-121 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-122 | 2 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-123 | 2 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-124 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-125 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-126 | 20 | PATH_DOMAIN_BINDING | HIGH | 9 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-127 | 12 | PATH_DOMAIN_BINDING | HIGH | 6 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-128 | 11 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-129 | 12 | PATH_DOMAIN_BINDING | HIGH | 6 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-130 | 13 | PATH_DOMAIN_BINDING | HIGH | 6 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-131 | 10 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-132 | 7 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-133 | 12 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 2 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-134 | 14 | PATH_DOMAIN_BINDING | HIGH | 7 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-135 | 14 | PATH_DOMAIN_BINDING | HIGH | 7 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-136 | 28 | PATH_DOMAIN_BINDING | HIGH | 14 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-137 | 10 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-138 | 12 | PATH_DOMAIN_BINDING | HIGH | 6 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-139 | 4 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 3 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-140 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-141 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-142 | 8 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-143 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-144 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-145 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 3 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-146 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 4 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-147 | 6 | PATH_DOMAIN_BINDING | HIGH | 3 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-148 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 3 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-149 | 10 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-150 | 4 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 4 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-151 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-152 | 14 | PATH_DOMAIN_BINDING | HIGH | 7 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-153 | 9 | PATH_DOMAIN_BINDING | HIGH | 4 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-154 | 11 | PATH_DOMAIN_BINDING | HIGH | 5 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-155 | 29 | PATH_DOMAIN_BINDING | HIGH | 13 | 0 | 1 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-156 | 1 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 1 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-157 | 2 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-158 | 4 | PATH_DOMAIN_BINDING | HIGH | 2 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-159 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 1 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-160 | 2 | PATH_DOMAIN_BINDING | HIGH | 1 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-161 | 12 | PATH_DOMAIN_BINDING | HIGH | 6 | 0 | 0 | 0 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-162 | 8 | REMEDIATION_LEAK | HIGH | 1 | 0 | 0 | 0 | 0 | 1 | Inspect remediation placeholder fields against source DOCX and close leak with reviewed decision pack. |
| BM-163 | 12 | REMEDIATION_LEAK | HIGH | 1 | 0 | 0 | 0 | 0 | 1 | Inspect remediation placeholder fields against source DOCX and close leak with reviewed decision pack. |
| BM-164 | 7 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 6 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-165 | 2 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 1 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-166 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-167 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-168 | 0 | VERIFY_ONLY | LOW | 0 | 0 | 0 | 0 | 0 | 0 | Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke. |
| BM-169 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-170 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-171 | 2 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 1 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-172 | 5 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 4 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-173 | 3 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 2 | 1 | 0 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-174 | 14 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 10 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-175 | 4 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 2 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-176 | 8 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 6 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-177 | 2 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 1 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-178 | 5 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 3 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-179 | 10 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 8 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-180 | 12 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 0 | 0 | 9 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-181 | 4 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 2 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-182 | 4 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 2 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-183 | 11 | PATH_DOMAIN_BINDING | HIGH | 0 | 0 | 0 | 0 | 8 | 0 | Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field. |
| BM-184 | 14 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 11 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-185 | 7 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 5 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-186 | 20 | SOURCE_POLICY | HIGH | 0 | 0 | 0 | 0 | 18 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-187 | 16 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 14 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-188 | 18 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 16 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-189 | 16 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 15 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-190 | 19 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 17 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-191 | 18 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 16 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-192 | 17 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 15 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-193 | 16 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 14 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-194 | 4 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 2 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-195 | 4 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 2 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-196 | 20 | SOURCE_POLICY | HIGH | 0 | 0 | 0 | 0 | 18 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-197 | 13 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 11 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-198 | 4 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 2 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-199 | 19 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 17 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-200 | 2 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 1 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-201 | 17 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 15 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-202 | 5 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 3 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-203 | 21 | SOURCE_POLICY | HIGH | 0 | 0 | 0 | 0 | 19 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-204 | 11 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 9 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-205 | 15 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 14 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-206 | 13 | EVIDENCE_REVIEW | MEDIUM | 0 | 0 | 0 | 0 | 13 | 0 | Strengthen evidence for auto-locked fields or downgrade to manual review. |
| BM-207 | 14 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 13 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-208 | 14 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 13 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-209 | 13 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 0 | 12 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-210 | 10 | EVIDENCE_REVIEW | MEDIUM | 0 | 0 | 0 | 0 | 10 | 0 | Strengthen evidence for auto-locked fields or downgrade to manual review. |
| BM-211 | 21 | SOURCE_POLICY | HIGH | 0 | 0 | 0 | 0 | 19 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-212 | 25 | SOURCE_POLICY | HIGH | 0 | 0 | 0 | 0 | 23 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |
| BM-213 | 5 | SOURCE_POLICY | MEDIUM | 0 | 0 | 0 | 2 | 0 | 0 | Decide source kind and readonly/required policy; recompile and verify source-kind parity. |

## Completion Gate For Each BM

- Locked contract is reviewed and matches the source DOCX evidence for that BM.
- canonicalFields, docxSlots, renderBindings, and paths have no unresolved audit issues unless accepted in a dated review ledger.
- compiled-v2 is regenerated by pnpm contract:compile and passes pnpm audit:contract-compile:sync.
- Root-cause audit has zero FAIL for the BM, or remaining REVIEW items are explicitly accepted with reviewer/date/reason.
- DB form_contract_versions compiled_json hash matches file compiled artifact after publish.
- Runtime form UI and document render smoke pass for the BM.
- Renderer active mode remains explicit allow-list only; no wildcard cutover.
