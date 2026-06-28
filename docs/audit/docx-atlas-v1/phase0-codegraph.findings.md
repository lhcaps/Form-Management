# DOCX Atlas V1 Phase 0 — CodeGraph Findings

**Generated:** 2026-06-28T14:00:00.000Z
**CodeGraph MCP Status:** AVAILABLE

## CodeGraph Health

```json
{
  "cliFound": true,
  "projectInitialized": true,
  "cursorMcpConfigured": true,
  "mcpToolAvailableInAgent": true,
  "exploreQuerySucceeded": true,
  "fallbackUsed": false,
  "errors": []
}
```

## Queries Run

### A. render-form-fidelity-gate inputs/outputs/exit codes

**Source:** `scripts/audit/render-form-fidelity-gate.mjs`

Key findings:
- `parseArgs()` accepts `--root` and `--template-code`
- `run()` returns `{ status, clean, nextAction, paths, bindingFidelity, render, textFidelity, literalFidelity, structureFidelity, packageIntegrity }`
- Exit code: 0 = PASS, 1 = FAIL
- **Critical:** Batch wrapper must NOT use shell chaining (`&&`) — must capture exit codes via `child_process`

### B. BM-062 OOXML helper patterns

**Source:** `scripts/audit/plan-bm062-docx-placeholder-renormalization.mjs`

Key helpers found:
- `extractAllTextNodes(xml)` — regex-based text node extraction
- `findOccurrences(textNodes, placeholder)` — finds all occurrences
- `buildNeighborhood(textNodes, occIdx, radius)` — surrounding context
- `getFullParagraph(xml, occTextNode)` — paragraph containing occurrence
- `getTableContext(xml, occTextNode)` — rough table context (needs upgrade)
- `getSurroundingLabels(textNodes, occIdx, direction, radius)` — label detection

**Upgrade needed:**
- Current label regex only catches labels with colon
- Need to add Vietnamese patterns without colon

### C. plan-contract-repair-batch-1-evidence structural mismatch logic

**Source:** `scripts/audit/plan-contract-repair-batch-1-evidence.mjs`

Key function: `buildStructuralMismatches(docx, contract)` returns:
- `templatePlaceholdersWithoutSlots`
- `contractSlotsWithoutTemplatePlaceholders`
- `bindingsWithoutTemplatePlaceholders`
- `slotsWithoutBindings`
- `bindingsWithoutSlots`
- `slotsWithoutCanonicalFields`
- `fieldsWithoutSlots`
- `duplicateSemanticPlaceholders`
- `reviewRequired` (slots/fields/bindings)

**Extracted to:** `scripts/audit/lib/contract-structural-mismatches.mjs`

### D. Board blocker ledger preservation status field

**Source:** `scripts/audit/refresh-213-docx-fidelity-board.mjs`

Key finding:
- `applyHumanReviewBlockerLedgers()` reads ledger where `ledger.status === 'BLOCKED_BY_HUMAN_DOCX_REVIEW'`
- Patches row to: `primaryLane = 'LEGAL_REVIEW'`, `completionStatus = 'BLOCKED_BY_HUMAN_DOCX_REVIEW'`
- **Confirmed:** Both `status` AND `completionStatus` fields must be set

### E. Existing script/test conventions

**Test pattern:** `node --test test/*.test.mjs`
**Module convention:** ESM with named exports
**Workspace require:** `createRequire(join(ROOT, 'apps', 'api', 'package.json'))`

### F. Where to place shared audit modules

**Decision:** `scripts/audit/lib/`

Existing modules confirmed:
- `scripts/audit/lib/` exists
- All new modules placed here

## Module Exports Summary

### ooxml-context-extractor.mjs
- `parseDocxBuffer(buffer)`
- `extractOoxmlParts(zip)`
- `extractTextNodesFromPart(partName, xml, globalOffset)`
- `findPlaceholderOccurrences(textNodes)`
- `extractPlaceholderOccurrencesFromDocx(docxPath)`
- `detectVietnameseLabels(text)`
- `isRiskyPlaceholderFamily(placeholder)`
- `buildContextSignature(occurrence)`
- `classifyDocxRiskForPlaceholderGroup(placeholder, occurrences)`

### contract-structural-mismatches.mjs
- `slotId(slot)`
- `bindingSlotId(binding)`
- `simplifySlot(slot)`
- `simplifyField(field)`
- `simplifyBinding(binding)`
- `buildStructuralMismatches(docxPlaceholderSetOrAtlas, contract)`
- `summarizeStructuralMismatches(mismatches)`
- `loadLockedContract(lockedDir, templateCode)`

### render-gate-cache.mjs
- `renderDiffPath(root, templateCode)`
- `normalizedDocxPath(root, templateCode)`
- `findLockedContractFile(root, templateCode)`
- `isRenderDiffFresh(root, templateCode)`
- `readRenderDiff(root, templateCode)`
- `runRenderGate(root, templateCode)`
- `runRenderGateBatch(root, templateCodes, options)`
- `getRenderGateResult(root, templateCode, options)`

### smart-remediation-classifier.mjs
- `BUCKETS` (const object)
- `BUCKET_PRECEDENCE` (array)
- `isExistingBlocked(rowOrLedger)`
- `hasRenderFailure(renderReport)`
- `hasHighDocxOccurrenceRisk(docxAtlasRow)`
- `isRiskyPlaceholderFamily(placeholder)`
- `hasDuplicateMultiContextRisk(docxAtlasRow)`
- `hasTableBlankAmbiguity(docxAtlasRow)`
- `isDocxSafeRenderPassPolicyBlocker(input)`
- `isRenderFailRepair(input)`
- `isDocxOccurrenceReview(input)`
- `isPlannerReviewCandidate(input)`
- `classifyBmForSmartQueue(input)`
- `classifyQueue(bms)`

## Safety Assertions Verified

- ✅ No assumption that `canonicalFields.path == docxSlots.slotId`
- ✅ Binding model treats these as separate namespaces
- ✅ Render gate capture handles FAIL as valid result
- ✅ Blocker ledger schema requires both `status` and `completionStatus`
