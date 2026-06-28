# BM-069 CodeGraph Findings

- Runtime render uses contract render bindings: `slotId` targets the DOCX placeholder and `from` targets the semantic source path.
- The render plan builder treats `reviewRequired` as a warning; clean rendering does not close human review debt.
- Previous contract-repair apply patterns that mutate `slotId` and `from` together are unsafe for BM-069 without explicit same-BM DOCX approval.
- Board refresh preserves `human-review-blocker.latest.json` ledgers and moves blocked BMs to `LEGAL_REVIEW`.
