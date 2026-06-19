# BM-001 Active Cutover Checklist

Active mode remains disabled until every mandatory gate below is proven.

## Automated Gates

- [x] Smoke and API runtime use the same full-package DOCX renderer.
- [x] Locked contracts are resolved by template code without hard-coded source suffixes.
- [x] Five deterministic scenarios are generated.
- [x] No semantic failure.
- [x] No missing expected text.
- [x] No unresolved placeholders.
- [x] No `undefined` or `null` literals.
- [x] DOCX package integrity preserves styles, settings, relationships, headers, footers, numbering, and other template parts.
- [x] Evidence manifest records source, template, contract, and rendered SHA-256 hashes.
- [x] CI executes the shared renderer smoke.
- [ ] All accepted format warnings are reviewed in Microsoft Word.

## Human Gates

- [ ] [BM-001 human review](../reviews/BM-001-human-review-2026-06-20.md) is completed in Microsoft Word.
- [ ] Reviewer and review date are present.
- [ ] The explicit active-cutover approval checkbox is selected.
- [ ] All 11 post-lock bindings are reviewed.
- [ ] No legal-correctness claim is made.

## D.2.3B.1 Technical Remediation

- [x] Receiver identity text is explicitly black and protected by `FMT-018`.
- [x] The canonical-source versus completed-document instruction policy is
  recorded in [BM-001 rendering policy](BM-001-rendering-policy.md).
- [x] The top-right form note is explicitly black at 8pt and protected by
  `FMT-019`.
- [x] The web save/action panel is hidden under print media.
- [x] `Giới tính` and `Tên gọi khác` remain visible, labeled BM-001 controls.
- [x] Fresh smoke, browser, hash, and Word technical evidence is recorded in
  [BM-001 remediation evidence](../reviews/BM-001-remediation-evidence-2026-06-20.md).

These checks record technical remediation only. They do not satisfy or waive
the human gates above.

## Enablement

Only after `pnpm check:bm001-cutover --require-ready` succeeds:

```dotenv
DOCUMENT_RENDERER_MODE=active
DOCUMENT_RENDERER_CONTRACT_TEMPLATES=BM-001
```

Never use a wildcard allow-list.

## Rollback

Immediate rollback:

```dotenv
DOCUMENT_RENDERER_MODE=off
```

To continue collecting evidence without affecting users:

```dotenv
DOCUMENT_RENDERER_MODE=shadow
DOCUMENT_RENDERER_CONTRACT_TEMPLATES=BM-001
```

## Current Decision

Conditional. The five D.2.3B.1 technical blockers are remediated, but active
mode is not approved until a new signed Microsoft Word review approves the
fresh artifacts and the active renderer persistence path is implemented and
verified.
