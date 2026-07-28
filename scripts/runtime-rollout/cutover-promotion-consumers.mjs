// Phase 10 — Cut over 2 promotion consumers last.
//
// Promotion consumers:
//   8. promote-runtime-batch.mjs
//   9. phase3-generate-roster.mjs
//
// Spec rules:
//   - promotion requires Word + LibreOffice + browser evidence
//   - we are NOT executing those Phases 12-13 in this wave
//   - the wave expects "bypass consumers reduced from 9 to at most the two
//     intentionally deferred promotion consumers"
//   - so we LEAVE these two as `bypass=true` and record the deferral with
//     concrete prerequisites
//
// Outputs:
//   docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/promotion-consumer-cutover.json

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/promotion-consumer-cutover.json');

const CONSUMERS = [
  'scripts/runtime-rollout/promote-runtime-batch.mjs',
  'scripts/runtime-rollout/phase3-generate-roster.mjs',
];

const LOCKED_LOADER_HINT = ['locked-runtime-index', 'lib/locked-runtime-index'];
const V1_HINT = ['semantic-mapping-v1', 'semanticMappingV1'];
const DEFERRED_PREREQS = [
  'Word R1/R2 deterministic pass',
  'LibreOffice R1/R2 deterministic pass',
  'Browser authenticated save/reload evidence',
  'preview/download revision parity',
  'provenance pass',
];

function readSafe(p) {
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}
function mapLocked(source) { return !!source && LOCKED_LOADER_HINT.some((h) => source.includes(h)); }
function mapV1(source) { return !!source && V1_HINT.some((h) => source.includes(h)); }

function lockedMarkerText() {
  return `
/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26 (promotion consumer).
 *
 * The promotion consumer reads locked authority for the source data, but
 * promotion eligibility is gated on further Phase 12 (Word) + Phase 13
 * (LibreOffice) + Phase 14 (browser) evidence.
 *
 * Per wave spec, this consumer is intentionally DEFERRED (left as bypass)
 * until Word, LibreOffice and browser persistence evidence are emitted.
 *
 * Deferred prerequisites (Phase 12-13-14 of the activation wave):
${DEFERRED_PREREQS.map((p) => ` *   - ${p}`).join('\n')}
 * ------------------------------------------------------------------ */
`;
}

export function buildPromotionCutover(options = {}) {
  const index = loadLockedRuntimeIndex();
  const consumers = CONSUMERS.map((name) => {
    const source = readSafe(path.join(REPO_ROOT, name));
    return {
      CONSUMER: name,
      present: !!source,
      locked_loader_imported: mapLocked(source),
      v1_mapping_consumed: mapV1(source),
    };
  });

  // Mark each promotion consumer for traceability. We do NOT cut them over to
  // locked-authority-active yet because Phase 12-13-14 evidence is not yet
  // produced.
  const patchedNames = [];
  for (const c of consumers) {
    const abs = path.join(REPO_ROOT, c.CONSUMER);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, 'utf8');
    if (text.includes('Locked authority cutover marker')) continue;
    writeFileSync(abs, `${text.trimEnd()}\n${lockedMarkerText()}\n`, 'utf8');
    patchedNames.push(c.CONSUMER);
  }

  // Mark all 2 as intentionally deferred (bypass) — they are the two that
  // the user expects to remain deferred until Word/LO/browser evidence exists.
  const report = {
    schema: 'qllaw.213.promotion_consumer_cutover/v1',
    generatedAt: new Date().toISOString(),
    consumerCount: consumers.length,
    consumers: consumers.map((c) => ({
      ...c,
      locked_authority_active: false,
      legacy_authority_active: true,
      mixed_authority: false,
      bypass: true,
      deferralRequired: true,
      deferralReason: 'Phases 12-14 (Word + LibreOffice + browser) not yet executed in this wave',
    })),
    lockedAuthorityActive: 0,
    legacyAuthorityActive: 2,
    mixedAuthority: 0,
    bypass: 2,
    cutoverSucceeded: false,
    deferredPrerequisites: DEFERRED_PREREQS,
    waveExpectedBypassConsumers: 2, // Per spec, max 2 deferred.
    patchedFiles: patchedNames,
  };

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, report };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { report, outputPath } = buildPromotionCutover();
  console.log(`OK promotion cutover: locked=${report.lockedAuthorityActive}/${report.consumerCount} bypass=${report.bypass} deferredPrereqs=${report.deferredPrerequisites.length}`);
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
}
