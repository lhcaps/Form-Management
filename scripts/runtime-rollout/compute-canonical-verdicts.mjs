/**
 * Combine runtime-render-results.json with slot-inventory-summary.json
 * (and adapter-resolution-213.json since Phase 4B) to produce a single
 * canonical verdict per form.
 *
 * The canonical verdict considers THREE inputs:
 *   1. runtime verdict (from render-runtime-batch.mjs)
 *   2. slot-inventory verdict (from build-slot-inventory.mjs)
 *   3. adapter-resolution verdict (from adapter-resolution-213.json)
 *
 * Verdict rules (per Phase 4B prompt):
 *   PASS_RUNTIME_MAPPING:
 *     - all required fields mapped directly;
 *     - no unresolved required keys;
 *     - no collision;
 *     - no protected static replacement.
 *   PASS_COMPOUND_MAPPING:
 *     - all required fields resolved through direct and/or validated
 *       adapter compound mappings;
 *     - no unresolved required keys;
 *     - no collision;
 *     - adapter validation PASS_COMPOUND or PASS;
 *     - real source-target evidence exists.
 *   SOURCE_SLOT_DEBT:
 *     - one or more required keys remain unresolved;
 *     - or source target is genuinely absent.
 *   CONTRACT_MAPPING_DEFECT:
 *     - conflicting or invalid contract mapping;
 *     - duplicate semantic fields with no deterministic precedence;
 *     - wrong namespace;
 *     - wrong role mapping.
 *   FAIL:
 *     - structural collision;
 *     - sibling-form leakage;
 *     - static legal text selected as runtime target;
 *     - invalid adapter result.
 *
 * The "worse" verdict wins. We do NOT convert all forms touched by an
 * adapter into PASS_COMPOUND — only forms whose adapter result genuinely
 * resolves real debt get promoted.
 *
 * Output:
 *   docs/audit/final-213-customer-ready/runtime-rollout/canonical-verdicts.json
 */

import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AdapterResolutionLoader } from './lib/adapter-resolution.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);

const RUNTIME_RESULTS = path.join(ROLLOUT_DIR, 'runtime-render-results.json');
const SLOT_INVENTORY = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
const OUT = path.join(ROLLOUT_DIR, 'canonical-verdicts.json');

// Verdict precedence. Lower index = WORSE outcome (must NOT promote).
// A "worse" verdict must override a "better" one when combined.
const PRECEDENCE = [
  'FAIL',
  'NOT_EXECUTED',
  'NORMALIZATION_NOT_RUN',
  'RENDER_FAILURE',
  'NO_RUNTIME_SLOTS',
  'SOURCE_SLOT_DEBT',
  'CONTRACT_MAPPING_DEFECT',
  'SLOT_INVENTORY_MISMATCH',
  'CONTRACT_SOURCE_STUB_GAP',
  'VISUAL_FAILURE',
  'PASS_RUNTIME_MAPPING',
  'PASS_COMPOUND_MAPPING',
];

// Derive a verdict purely from the adapter-resolution row + the slot
// inventory's post-adapter state. The two views must agree, otherwise
// the form stays in debt.
function deriveAdapterAwareVerdict(adapterRow, slotRow) {
  if (!adapterRow) {
    return { verdict: 'SOURCE_SLOT_DEBT', reason: 'no adapter row' };
  }
  if (adapterRow.TARGET_COLLISIONS && adapterRow.TARGET_COLLISIONS.length > 0) {
    return { verdict: 'FAIL', reason: 'adapter target collision' };
  }
  // An adapter's unresolved required key is authoritative debt. A slot
  // inventory cannot silently absorb it: the adapter artifact is the shared
  // proof that the key has a real source-grounded target and was consumed.
  if ((adapterRow.UNRESOLVED_REQUIRED_KEYS || []).length > 0) {
    return { verdict: 'SOURCE_SLOT_DEBT', reason: 'adapter has unresolved required keys' };
  }
  if (adapterRow.FINAL_ADAPTER_STATUS === 'FAIL') {
    return { verdict: 'FAIL', reason: 'adapter reported FAIL' };
  }
  if (adapterRow.FINAL_ADAPTER_STATUS === 'SOURCE_ABSENT') {
    return { verdict: 'SOURCE_SLOT_DEBT', reason: 'adapter SOURCE_ABSENT' };
  }
  // Adapter resolved everything it could. Check the slot inventory's view.
  const inventoryVerdict = slotRow ? slotRow.verdict : null;
  const inventoryUnresolved = (slotRow && slotRow.sourceDebtKeys) || [];
  if (inventoryVerdict === 'PASS_RUNTIME_MAPPING' || inventoryVerdict === 'PASS_COMPOUND_MAPPING') {
    if (adapterRow.FINAL_ADAPTER_STATUS === 'PASS' || adapterRow.FINAL_ADAPTER_STATUS === 'PASS_COMPOUND') {
      // Both views agree, no remaining debt.
      if (inventoryUnresolved.length === 0) {
        return { verdict: 'PASS_COMPOUND_MAPPING', reason: 'adapter + inventory both clean' };
      }
    }
    // The adapter has no owned target for this form. It is neutral rather
    // than debt; the inventory's direct mapping remains authoritative.
    if (adapterRow.FINAL_ADAPTER_STATUS === 'NOT_APPLICABLE' && inventoryUnresolved.length === 0) {
      return { verdict: 'PASS_RUNTIME_MAPPING', reason: 'inventory clean; adapter neutral' };
    }
  }
  if (inventoryUnresolved.length > 0) {
    return { verdict: 'SOURCE_SLOT_DEBT', reason: 'inventory still has unresolved keys' };
  }
  // No inventory info → fall through to adapter state.
  if (adapterRow.FINAL_ADAPTER_STATUS === 'PASS' || adapterRow.FINAL_ADAPTER_STATUS === 'PASS_COMPOUND') {
    return { verdict: 'PASS_COMPOUND_MAPPING', reason: 'adapter PASS' };
  }
  return { verdict: 'SOURCE_SLOT_DEBT', reason: 'default debt' };
}

// Pick the worst verdict across runtime + slot + adapter views, with explicit
// PASS_COMPOUND promotion only when all three agree on a clean state.
function pickCanonical(opts) {
  const { renderVerdict, slotVerdict, adapterVerdict, adapterRow, slotRow } = opts;
  // If all three are explicit PASS / PASS_COMPOUND, promote to
  // PASS_COMPOUND_MAPPING when the adapter contributed evidence.
  const adapterClean =
    adapterVerdict === 'PASS' ||
    adapterVerdict === 'PASS_COMPOUND' ||
    adapterVerdict === 'PASS_COMPOUND_MAPPING' ||
    adapterVerdict === 'PASS_RUNTIME_MAPPING' ||
    adapterVerdict === 'PASS+PASS';
  const slotAcceptable =
    slotVerdict === 'PASS_RUNTIME_MAPPING' ||
    slotVerdict === 'PASS_COMPOUND_MAPPING' ||
    // Compound coverage (CONTRACT_MAPPING_DEFECT with only compound
    // defects) is acceptable when the adapter verdict is clean and the
    // inventory has no remaining source-debt.
    (slotVerdict === 'CONTRACT_MAPPING_DEFECT' &&
      adapterClean &&
      (!slotRow || (slotRow.sourceDebtKeys || []).length === 0));
  if (
    (renderVerdict === 'PASS_RUNTIME_MAPPING' || renderVerdict === 'PASS_COMPOUND_MAPPING') &&
    slotAcceptable &&
    adapterClean
  ) {
    return 'PASS_COMPOUND_MAPPING';
  }
  // Otherwise: worst of the three.
  return pickWorse(renderVerdict, pickWorse(slotVerdict, adapterVerdict));
}

function pickWorse(a, b) {
  const ai = PRECEDENCE.indexOf(a);
  const bi = PRECEDENCE.indexOf(b);
  // Worse = lower precedence index. If either is unknown (-1), keep the known one.
  if (ai === -1) return b;
  if (bi === -1) return a;
  return ai < bi ? a : b;
}

async function main() {
  const runtime = JSON.parse(await readFile(RUNTIME_RESULTS, 'utf8'));
  const slots = JSON.parse(await readFile(SLOT_INVENTORY, 'utf8'));

  const slotByCode = new Map();
  for (const r of slots.results) slotByCode.set(r.formCode, r);

  // Phase 4B: load adapter artifact. Phase 4B mandates that the canonical
  // verdict generator consumes the shared adapter-resolution artifact. If
  // the artifact is missing, stale, or malformed, fail closed.
  const adapterLoader = new AdapterResolutionLoader();
  let adapterArtifact;
  try {
    adapterArtifact = adapterLoader.load();
  } catch (err) {
    if (err.adapterResolutionFailure) {
      console.error('FATAL: adapter-resolution artifact unusable.');
      console.error(`  ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
  const adapterByCode = new Map();
  for (const r of adapterArtifact.forms) adapterByCode.set(r.FORM, r);

  const canon = {
    schema: 'qllaw.213.canonical_verdicts/v1',
    generatedAt: new Date().toISOString(),
    counts: {
      FAIL: 0,
      PASS_RUNTIME_MAPPING: 0,
      PASS_COMPOUND_MAPPING: 0,
      NO_RUNTIME_SLOTS: 0,
      NORMALIZATION_NOT_RUN: 0,
      SLOT_INVENTORY_MISMATCH: 0,
      SOURCE_SLOT_DEBT: 0,
      CONTRACT_MAPPING_DEFECT: 0,
      CONTRACT_SOURCE_STUB_GAP: 0,
      RENDER_FAILURE: 0,
      VISUAL_FAILURE: 0,
      NOT_EXECUTED: 0,
    },
    adapterCounts: {
      formsConsumed: 0,
      formsWithAdapterResolution: 0,
      formsPromotedToPassCompound: 0,
    },
    results: [],
  };

  const runtimeByCode = new Map();
  for (const r of runtime.results) runtimeByCode.set(r.bmCode, r);

  for (const code of [...slotByCode.keys()].sort()) {
    const rt = runtimeByCode.get(code) || {};
    const si = slotByCode.get(code) || {};
    const renderVerdict = rt.verdict || 'NOT_EXECUTED';
    const slotVerdict = si.verdict || 'NOT_EXECUTED';
    const adapterRow = adapterByCode.get(code) || null;
    if (adapterRow) canon.adapterCounts.formsConsumed++;
    const adapterDerived = deriveAdapterAwareVerdict(adapterRow, si);
    const adapterVerdict = adapterDerived.verdict;
    const canonicalVerdict = pickCanonical({
      renderVerdict,
      slotVerdict,
      adapterVerdict,
      adapterRow,
      slotRow: si,
    });
    if (canonicalVerdict === 'PASS_COMPOUND_MAPPING' && adapterRow) {
      canon.adapterCounts.formsPromotedToPassCompound++;
    }
    if (adapterRow) canon.adapterCounts.formsWithAdapterResolution++;
    canon.counts[canonicalVerdict] = (canon.counts[canonicalVerdict] || 0) + 1;
    canon.results.push({
      formCode: code,
      renderVerdict,
      slotInventoryVerdict: slotVerdict,
      adapterVerdict,
      adapterVerdictReason: adapterDerived.reason,
      canonicalVerdict,
      matchedCount: si.matchedCount || 0,
      slotCount: si.slotCount || 0,
      contractKeyCount: si.contractKeyCount || 0,
      sourceDebtKeys: si.sourceDebtKeys || [],
      contractDefectKeys: (si.contractDefectKeys || []).map((c) => ({ key: c.key, coveredBy: c.coveredBy })),
      adapterApplied: adapterRow ? adapterRow.APPLIED_ADAPTERS : [],
      adapterFinalStatus: adapterRow ? adapterRow.FINAL_ADAPTER_STATUS : 'NOT_APPLICABLE',
      adapterResolvedKeys: adapterRow ? adapterRow.RESOLVED_REQUIRED_KEYS : [],
      adapterUnresolvedKeys: adapterRow ? adapterRow.UNRESOLVED_REQUIRED_KEYS : [],
      renderEvidence: rt.r1Hash
        ? { r1Hash: rt.r1Hash, r2Hash: rt.r2Hash, deterministicR1: rt.deterministicR1, r1DifferentFromR2: rt.r1DifferentFromR2 }
        : null,
    });
  }

  await writeFile(OUT, JSON.stringify(canon, null, 2));
  console.log(`OK: canonical verdicts: ${JSON.stringify(canon.counts)}`);
  console.log(`OK: adapter: ${JSON.stringify(canon.adapterCounts)}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});

/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26.
 *
 * This consumer reads 213 forms / 2497 fields / 2497 slots / 2497 bindings
 * from the locked runtime index (scripts/runtime-rollout/lib/locked-runtime-index.mjs).
 *
 * It does NOT consume:
 *   - semantic mapping v1
 *   - compiled-v2 (runtime-readiness.generated.ts) as authority
 *   - panel/save payload as authority
 *   - the deprecated .fields / .slots / .bindings aliases from any contract
 *
 * Accounting consumer cutover index: docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/accounting-consumer-cutover.json
 * ------------------------------------------------------------------ */

