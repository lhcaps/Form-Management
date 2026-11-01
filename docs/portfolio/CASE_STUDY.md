# Form Management: document workflow and contract boundaries

## Context

Form Management is a legal case and document workflow project developed in connection with an industrial internship. The internship host is intentionally unnamed here. The domain concerns Vietnamese legal forms; it does not establish employment at a prosecution agency or adoption across government agencies.

The implementation has to reconcile structured inputs with versioned DOCX templates while keeping a temporary preview distinct from a saved document and its history. The source describes a local/internal application. No live deployment or usage is claimed by this case study.

## Decisions visible in the source

- **Document contracts:** locked form contracts define fields, slots and render bindings; compiled contracts are derived artifacts. See `docs/audit/README.md`, `docs/audit/docx/contracts/locked/` and `docs/audit/docx/compiled-v2/`.
- **Two document lifecycles:** standalone template preview uses a temporary session; a generated document uses a persisted workspace. See `apps/api/src/modules/documents/runtime-preview-session.service.ts` and `apps/api/src/modules/documents/documents.service.ts`.
- **Identity and authorization:** authentication and business authorization are separate concerns. See `docs/AUTH_RBAC_POLICY.md` and the authorization services under `apps/api/src/modules/auth/`.
- **Audit history:** persisted document actions have an audit service; temporary preview must not be presented as a persisted record. See `apps/api/src/modules/documents/generated-document-audit.service.ts` and `docs/TESTING_STRATEGY.md`.

These are **VERIFIED_IMPLEMENTED** by source inspection, not a fresh integrated runtime or security certification. The accompanying [corpus evidence](CORPUS_EVIDENCE.md) separates inventory, review metadata and gate results. [CI audit](CI_AUDIT.md) records the current hosted evidence and limits.

## Lessons and limits

A template count does not prove successful end-to-end generation for every template. A repeatable gate also depends on the freshness of the verification report it consumes. The baseline report was stale; after regeneration the verifier and gate still failed on 11 extraction hash mismatches. The result cannot be called a passing corpus gate. Public demonstrations should use synthetic case data and separately approved dummy templates; no real case content, original forms, credentials, or host-identifying documents belong in the demo.
