# BM-052 CodeGraph Apply Findings

## Tool Status

- CodeGraph MCP: available and queried with `mcp__codegraph.codegraph_explore`.
- Shell healthcheck: `codegraph status` reported the `D:\Study\Project\QLLaw-main` index is up to date.

## Renderer And Binding Model

CodeGraph confirmed the runtime contract render plan uses:

- `renderBindings[].slotId` as the DOCX slot target.
- `renderBindings[].from` as the source field path read from form data.
- `canonicalFields[].path` as the semantic form-data field path.

Relevant source paths surfaced by CodeGraph:

- `apps/api/src/modules/documents/rendering/application/contract-render-plan.builder.ts`
- `apps/api/src/modules/documents/rendering/domain/contract-render-plan.ts`
- `apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts`
- `apps/api/src/modules/forms-contracts/domain/form-contract.ts`
- `packages/form-contracts/src/payload.ts`

The BM-052 apply runner therefore must not assume `canonicalFields[].path`, `docxSlots[].slotId`, and `renderBindings[].from` are globally identical.

## Compiler Findings

CodeGraph surfaced `packages/form-contracts/src/compiler.ts` and `packages/form-contracts/src/types.ts`.

Important points:

- V2 compilation preserves render bindings into the compiled render plan.
- Validation cares about duplicate render bindings and binding source existence.
- No evidence was found that occurrence-suffix semantic field names such as `person.idNumber6` are expected by the compiler.

## Suffix Name Check

CodeGraph found the rejected suffix names only in the BM-052 deep OOXML extraction script/evidence path, not as required runtime model fields:

- `person.personFullName2a`
- `person.personFullName2b`
- `person.idNumber6`
- `person.addressTemporary6`

Those names are stale proposal artifacts and are explicitly blocked by `decisions.approved.json` and the apply runner.

## Apply Pattern

The existing approved apply runners use the same safety pattern the BM-052 runner follows:

- explicit approved decision file
- dry-run/write modes
- validation before mutation
- timestamped backups before write
- JSON/Markdown apply reports
- no compiled-v2 manual edit

For BM-052, the runner additionally performs occurrence-aware `word/document.xml` replacement and refuses global replacement semantics.
