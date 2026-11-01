# 213-form corpus evidence

Baseline source: `8861eb966a608b035ec7a7b457c7074e6490119e`, Windows, Node `v22.23.1`, pnpm `10.33.2`. Observed 2026-11-02 02:09–02:11 ICT (UTC+07:00). Commands were run from the repository root; no database or service was changed.

| Observation | Evidence and outcome | Meaning |
| --- | --- | --- |
| Locked and reviewed | `pnpm gate:forms:213 --allow-source-unknown` printed 213/213 locked and 213/213 human-reviewed metadata. | Review metadata and inventory; not 213 end-to-end verified. |
| Corpus gate | The same command exited **1**: verify report stale. It reported zero generic slots, fields and bindings; the stored report showed zero blocking, zero remediation and 47 warnings. | **FAIL**. The package script passes `--allow-remediation` and `--allow-unresolved-review`; the invocation also allows unknown sources. These allowances matter and do not prove strict readiness. |
| Fresh verifier | After `pnpm install --frozen-lockfile --ignore-scripts --store-dir D:\Study\Project\Improments\career-rebrand\.pnpm-store` exited **0**, `node scripts/docx-contract/verify-locked-contracts.mjs` exited **1**, reporting 213 contracts, 1,278 checks passed, 11 blocking `EXTRACTION_HASH_MISMATCH`, zero remediation and 47 warnings. | Fresh verification found real blocking mismatches under its rules; their underlying cause has not been established. |
| Gate with fresh report | Immediately after that verifier, `pnpm gate:forms:213 --allow-source-unknown` exited **1**, citing the 11 blocking issues. | **FAIL** even after resolving report freshness. The same allowances apply. |
| Locked versus compiled | `node scripts/audit/audit-locked-compiled-consistency.mjs --strict` printed `213/213 consistent` and exited **0**. | This compares artifacts under this script's rules; it does not test rendering every document end-to-end. |
| Stored verification report | `docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md`, generated 2026-07-17, reported 213 files checked and 47 metadata warnings. | Historical report, stale for the gate; not a fresh pass. |
| Corpus inventory | `docs/templates/TEMPLATE_CORPUS_AUDIT.md` reports 213 source codes, 130 specific frontend panels, 83 generic fallback panels and 61 warnings. | Historical generated report; not an independent runtime count. |

The verifier temporarily regenerated the tracked summary; its original bytes were restored after the two checks and `git diff --exit-code -- docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md` exited **0**. Consequently a new gate invocation against this checkout first encounters the stale historical summary again. Neither local check proves production use, legal correctness, complete end-to-end document generation, or a currently running service. No real case data or template contents are reproduced in this summary.
