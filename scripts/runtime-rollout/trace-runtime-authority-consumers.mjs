// Consumer dependency trace — reads each named active consumer, detects:
//   - which authority source it consults (locked, v1 mapping, compiled-v2, panel)
//   - whether it imports the locked runtime index loader
//   - whether it has any fallback path
//   - whether it references semantic mapping v1
//
// Output: a JSON report with per-script status (LOCKED_AUTHORITY_ACTIVE,
// SHADOW_MODE, LEGACY_AUTHORITY_ACTIVE, BYPASS_DETECTED, MIXED_AUTHORITY_UNSAFE).

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-consumer-trace.json');

const CONSUMERS = [
  { script: 'scripts/runtime-rollout/build-slot-inventory.mjs' },
  { script: 'scripts/runtime-rollout/compute-canonical-verdicts.mjs' },
  { script: 'scripts/runtime-rollout/build-source-slot-debt-family-report.mjs' },
  { script: 'scripts/runtime-rollout/per-form-readiness-reconciliation.mjs' },
  { script: 'scripts/runtime-rollout/build-adapter-resolution.mts' },
  { script: 'scripts/runtime-rollout/render-runtime-batch.mjs' },
  { script: 'scripts/runtime-rollout/promote-runtime-batch.mjs' },
  { script: 'scripts/runtime-rollout/phase3-generate-roster.mjs' },
  { script: 'scripts/runtime-rollout/guard-runtime-rollout-evidence.mjs' },
];

const LOCKED_LOADER_HINTS = [
  'locked-runtime-index',
  'locked-contract-loader',
  'lib/locked-runtime-index',
  'lib/locked-contract-loader',
  'locked-contract-runtime-index',
  'locked_runtime_index',
  'lockedContractRuntimeIndex',
];

const V1_MAPPING_HINTS = [
  'semantic-mapping-v1',
  'semantic_mapping_v1',
  'semanticMappingV1',
  'semantic-mapping/mappings.json',
  'semantic-mapping.json',
  'semanticV1',
  'V1_MAPPING',
];

const COMPILED_V2_HINTS = [
  'compiled-v2',
  'compiled_v2',
  'compiledV2',
  'compiler.ts',
  'compiler.js',
  'compile-form-contracts',
];

const PANEL_HINTS = [
  'panel',
  'form-inputs',
  'form-input',
  'bm-XXX-form-inputs',
  'formSection',
  'panelState',
  'panelRegistry',
];

const FALLBACK_HINTS = [
  'fallback',
  'try {',
  'try{',
  'catch',
  '??',
  'panel ??',
  'compiled ??',
];

function fileExists(repoRoot, relativePath) {
  return existsSync(path.join(repoRoot, relativePath));
}

function readIfExists(repoRoot, relativePath) {
  const abs = path.join(repoRoot, relativePath);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, 'utf8');
}

function detectHints(source, hints) {
  if (!source) return [];
  return hints.filter((hint) => source.includes(hint));
}

function classify(trace) {
  if (trace.LOCKED_RUNTIME_LOADER_IMPORTED && trace.V1_MAPPING_REFERENCES.length === 0 && trace.COMPILED_V2_REFERENCES.length === 0 && trace.PANEL_REFERENCES.length === 0) {
    return 'LOCKED_AUTHORITY_ACTIVE';
  }
  if (trace.LOCKED_RUNTIME_LOADER_IMPORTED && (trace.V1_MAPPING_REFERENCES.length > 0 || trace.PANEL_REFERENCES.length > 0)) {
    return 'MIXED_AUTHORITY_UNSAFE';
  }
  if (!trace.LOCKED_RUNTIME_LOADER_IMPORTED && (trace.V1_MAPPING_REFERENCES.length > 0 || trace.COMPILED_V2_REFERENCES.length > 0)) {
    return 'LEGACY_AUTHORITY_ACTIVE';
  }
  if (trace.LOCKED_RUNTIME_LOADER_IMPORTED && trace.FALLBACK_PATHS.length > 0) {
    return 'SHADOW_MODE';
  }
  return 'BYPASS_DETECTED';
}

import { existsSync } from 'node:fs';

export function traceRuntimeAuthorityConsumers(options = {}) {
  const traces = CONSUMERS.map(({ script }) => {
    const source = readIfExists(REPO_ROOT, script);
    const present = fileExists(REPO_ROOT, script);
    const lockedHints = detectHints(source, LOCKED_LOADER_HINTS);
    const v1Hints = detectHints(source, V1_MAPPING_HINTS);
    const compiledHints = detectHints(source, COMPILED_V2_HINTS);
    const panelHints = detectHints(source, PANEL_HINTS);
    const fallbackHints = detectHints(source, FALLBACK_HINTS);

    return {
      SCRIPT: script,
      present,
      FIELD_AUTHORITY: lockedHints.length > 0 ? 'locked' : (compiledHints.length > 0 ? 'compiled-v2' : 'unknown'),
      REQUIREDNESS_AUTHORITY: lockedHints.length > 0 ? 'locked' : (panelHints.length > 0 ? 'panel' : 'unknown'),
      SLOT_AUTHORITY: lockedHints.length > 0 ? 'locked' : (compiledHints.length > 0 ? 'compiled-v2' : 'unknown'),
      BINDING_AUTHORITY: lockedHints.length > 0 ? 'locked' : (v1Hints.length > 0 ? 'semantic-mapping-v1' : 'unknown'),
      SOURCE_HASH_AUTHORITY: lockedHints.length > 0 ? 'locked' : 'unknown',
      ADAPTER_AUTHORITY: source && source.includes('AdapterRegistry') ? 'registered' : (source && source.includes('adapters/') ? 'ad-hoc' : 'none'),
      FALLBACK_PATHS: fallbackHints,
      V1_MAPPING_REFERENCES: v1Hints,
      COMPILED_V2_REFERENCES: compiledHints,
      PANEL_REFERENCES: panelHints,
      LOCKED_RUNTIME_LOADER_IMPORTED: lockedHints.length > 0,
    };
  });

  for (const trace of traces) {
    trace.CUTOVER_STATUS = classify(trace);
  }

  const summary = {
    totalConsumers: traces.length,
    byStatus: traces.reduce((acc, t) => ({ ...acc, [t.CUTOVER_STATUS]: (acc[t.CUTOVER_STATUS] ?? 0) + 1 }), {}),
    unknownConsumers: traces.filter((t) => !t.present).map((t) => t.SCRIPT),
  };

  return {
    schema: 'qllaw.213.locked_authority_consumer_trace/v1',
    generatedAt: new Date().toISOString(),
    consumers: traces,
    summary,
  };
}

export function writeConsumerTrace(options = {}) {
  const result = traceRuntimeAuthorityConsumers(options);
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, result };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { result, outputPath } = writeConsumerTrace();
  console.log(`OK consumer trace: ${result.summary.totalConsumers} consumers; ${JSON.stringify(result.summary.byStatus)}`);
  if (result.summary.unknownConsumers.length) {
    console.error('FAIL missing consumers:', result.summary.unknownConsumers);
    process.exit(1);
  }
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
}
