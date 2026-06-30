# BM-203 CodeGraph Findings

- Board lane SOURCE_POLICY is driven by WEAK_EVIDENCE_AUTO_LOCKED and REQUIRED_SUSPICIOUS.
- All 21 fields are deferred; 19 WEAK_EVIDENCE_AUTO_LOCKED + 2 REQUIRED_SUSPICIOUS.
- `renderBindings.slotId` is the DOCX placeholder target; `renderBindings.from` is the semantic source path.
- Human-review ledgers under docs/audit/docx-placeholder-renormalization/BM-*/ are preserved by refresh-213-docx-fidelity-board.mjs.
- Evidence-only mode: no contract mutation, no DOCX mutation, no compiled mutation, no DB publish.
