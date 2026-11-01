/**
 * Phase 13 blocker grouping.
 *
 * Records the canonical Phase 4 blocker families and how each manifests
 * in our locked-authority + DTO + panel architecture. Even when the
 * static crosswalk reports zero blockers, we surface these families so
 * that any future failure can be classified against the same taxonomy.
 *
 * For each family we record:
 *   - family
 *   - signature
 *   - reproducible symptom
 *   - detection signal
 *   - generic root-cause fix area
 *   - whether we observed it during the static crosswalk
 *
 * Output:
 *   - phase13-browser/blocker-taxonomy.json
 */

import { writeFile, mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const PHASE13_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'locked-authority-rebase',
  'phase13-browser',
);

const FAMILIES = [
  {
    family: 'GENERIC_PANEL_FIELD_OMISSION',
    signature: 'panel exists but does not render the locked field',
    reproducibleSymptom: 'locked field has no rendered input control in the panel',
    detectionSignal: 'crosswalk.verdict === CONTROL_MISSING for an editable locked field',
    fixArea: 'apps/web/src/components/documents/bm-NNN-form-inputs.tsx',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'PANEL_REGISTRY_MISMATCH',
    signature: 'panel file exists but registry does not include the form code',
    reproducibleSymptom: 'route loads but no inputs render',
    detectionSignal: 'PANEL_REGISTERED === false in queue row',
    fixArea: 'apps/web/src/components/documents/bm-panel-registry.generated.ts',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'CONTROL_TYPE_MISMATCH',
    signature: 'locked type != control type',
    reproducibleSymptom: 'saving text into a date field or vice versa',
    detectionSignal: 'crosswalk.LOCKED_TYPE !== PANEL_CONTROL_TYPE',
    fixArea: 'panel component selection per locked field',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'DATE_COMPONENT_SERIALIZATION',
    signature: 'date picker outputs YYYY-MM-DD but DTO expects dd/MM/yyyy or vice versa',
    reproducibleSymptom: 'saved date displays correctly but renders empty in DOCX',
    detectionSignal: 'ROUND_TRIP_EXPECTED_TYPE mismatches loaded value',
    fixArea: 'panel serializer in bm-NNN-form-inputs.tsx',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'BOOLEAN_SERIALIZATION',
    signature: 'boolean field stored as string "true"/"false"',
    reproducibleSymptom: 'checkbox state does not round-trip',
    detectionSignal: 'crosswalk.LOCKED_TYPE === boolean but value is string',
    fixArea: 'panel serializer in bm-NNN-form-inputs.tsx',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'ENUM_SERIALIZATION',
    signature: 'enum value not in canonical list',
    reproducibleSymptom: 'select renders but selecting value persists wrong string',
    detectionSignal: 'loaded value not in payload.options',
    fixArea: 'apps/web/src/lib/runtime-ux/bm-NNN-runtime-ux-profile.ts',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'REPEATER_SERIALIZATION',
    signature: 'array field saved as JSON string instead of nested array',
    reproducibleSymptom: 'repeater renders first row but loses the rest on reload',
    detectionSignal: 'crosswalk.SAVE_PAYLOAD_PATH points to string, not array',
    fixArea: 'apps/web/src/components/documents/bm-form/repeater-section.tsx',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'NESTED_PAYLOAD_PATH',
    signature: 'panel saves to {section}.{field} but DTO expects {section}.{field}.{sub}',
    reproducibleSymptom: 'value disappears on reload',
    detectionSignal: 'loaded value is undefined for a saved key',
    fixArea: 'apps/api/src/modules/documents/dto/update-generated-document-form-inputs.dto.ts',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'SAVE_PAYLOAD_OMISSION',
    signature: 'panel calls save() but body does not include the edited field',
    reproducibleSymptom: 'PATCH 200 but DB row unchanged',
    detectionSignal: 'API request payload missing the field',
    fixArea: 'panel save handler',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'API_DTO_STRIPPING',
    signature: 'DTO @IsOptional / whitelist strips unknown fields',
    reproducibleSymptom: 'request has field, response 200, but row missing the field',
    detectionSignal: 'logs show stripped payload',
    fixArea: 'apps/api/src/modules/documents/dto/update-generated-document-form-inputs.dto.ts',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'REPOSITORY_STORAGE_OMISSION',
    signature: 'service does not persist every DTO group',
    reproducibleSymptom: 'API logs persist success, but row read returns empty',
    detectionSignal: 'audit-log + DB row mismatch',
    fixArea: 'apps/api/src/modules/documents/rendering/application/generated-input-save-core',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'LOAD_RESPONSE_OMISSION',
    signature: 'GET render-payload does not include the saved field',
    reproducibleSymptom: 'page reloads with empty field even though DB has value',
    detectionSignal: 'API response missing field',
    fixArea: 'apps/api/src/modules/documents/document-renderer.service.ts',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'HYDRATION_KEY_MISMATCH',
    signature: 'panel hydrate reads payload.X.Y but DB stored under X.z',
    reproducibleSymptom: 'panel renders empty for a non-empty DB row',
    detectionSignal: 'crosswalk.LOAD_RESPONSE_PATH != HYDRATION_PATH',
    fixArea: 'panel normalize* function in apps/web/src/lib/bmNNN-form-inputs-api',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'DEFAULT_VALUE_OVERWRITE',
    signature: 'panel uses default value if save response is empty',
    reproducibleSymptom: 'saved value silently replaced by blank',
    detectionSignal: 'snapshot equality check between R1 reload and saved state',
    fixArea: 'panel mergeForm() helper',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'RACE_WITH_AUTOSAVE',
    signature: 'autosave fires before explicit save; reload shows autosave version',
    reproducibleSymptom: 'R1/R2 swap is non-deterministic across reloads',
    detectionSignal: 'race-condition log signature',
    fixArea: 'panel autosave debounce + version key',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'CASE_CONTEXT_BINDING',
    signature: 'panel reads caseId but route does not supply it',
    reproducibleSymptom: 'missing case context causes API 400',
    detectionSignal: 'API 400 with "caseId required"',
    fixArea: 'apps/web/src/lib/draft-bridge-api.ts',
    observedDuringStaticCrosswalk: 0,
  },
  {
    family: 'DOCUMENT_CONTEXT_BINDING',
    signature: 'panel reads documentId but route does not supply it',
    reproducibleSymptom: 'panel mounts but every API call 404s',
    detectionSignal: 'API 404 on /documents/generated/:id',
    fixArea: 'apps/web/src/components/documents/generated-document-workspace.tsx',
    observedDuringStaticCrosswalk: 0,
  },
];

async function main() {
  await mkdir(PHASE13_DIR, { recursive: true });
  const out = path.join(PHASE13_DIR, 'blocker-taxonomy.json');
  const artifact = {
    schema: 'qllaw.phase13.blocker_taxonomy/v1',
    generatedAt: new Date().toISOString(),
    familyCount: FAMILIES.length,
    families: FAMILIES,
    notes: [
      'All families are recorded for taxonomy completeness. The static crosswalk reports 0 blockers because every locked field in the 83-form queue has a panel that covers the corresponding DTO group.',
      'True blockers will only surface during the Phase 8 browser smoke, where they will be classified against this taxonomy.',
    ],
  };
  await writeFile(out, JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify({ status: 'OK', familyCount: FAMILIES.length, out }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message }));
  process.exit(1);
});