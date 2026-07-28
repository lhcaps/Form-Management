# Phase 8B - Evidence apply idempotence

## Verdict

`PASS` in a disposable workspace; canonical evidence was not mutated.

## Disposable proof

- Workspace: `%TEMP%/qllaw-phase8b-evidence-idempotence-20260711152641`.
- Minimum dependency closure copied: `1,600` files.
- Initial check mode: PASS.
- Formal apply 1: exit `0`, `2,265 ms`, `NO_SEMANTIC_CHANGE`, `36` steps.
- Formal apply 2: exit `0`, `1,932 ms`, `NO_SEMANTIC_CHANGE`, `36` steps.
- Workspace removed after proof: yes.

The initial closure attempts identified missing parsed evidence and `form-lifecycle.ts`; each failed apply rolled back cleanly. After completing the minimum closure, the formal proof was run exactly twice.

## Byte identity

Input, after apply 1, and after apply 2 were identical:

| Scope | Count | SHA-256 |
| --- | ---: | --- |
| Entire disposable workspace | `1,600` | `de3497a53a20e701a840e6b4c95d66b932c4fab2b96e1de43619e34b3a30b01b` |
| Unified evidence files | `203` | `f891393ada0afb32dd6aa28f98c19b34415e9cd322b1d660a0c43c7d9566c0e1` |
| Status matrix JSON | `1` | `8599db87d01cfd92a7136f9d255a3496265c9e05ec422682840fa36abfdc70eb` |
| Status matrix Markdown | `1` | `c63aa6091b5fd53e86cf8c76ba6a034e7ffa5288eb4263b80198c5902faebff1` |
| Browser visibility artifact | `1` | `fa8e6851db64ac8100ed99ff514c8e42b7b6b8fd15af4af715e175f8bdd1f7a0` |
| Matrix row order | `213` unique, strictly ascending | `d98796400d5c3f27705c22c636adf11525b0e160172f8a2ffb82cf5f0629693a` |

## Preserved semantics/history

- Matrix: `201 PASS / 12 PARTIAL`.
- Browser axis: `201 PASS / 0 FAIL / 12 NOT_RUN`.
- Exact 12 holdouts: unchanged.
- Browser history: `124` entries, `124` PASS, including the existing 9-form rerun records.
- Top-level axes, ordering, BM-006/BM-130 state, runtime-ready allowlist, and `fidelityComplete=true` count: unchanged.
- Canonical unified-evidence hashes before/after the disposable test: identical.
