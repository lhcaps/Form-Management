/**
 * Form Flight — public surface.
 *
 * The two adapters and the shared core are exported here. Profile
 * modules (e.g. `profiles/bm171.ts`) are NOT eagerly imported: callers
 * that want them registered must `import "@/lib/form-flight/profiles/bm171"`
 * explicitly. This mirrors the existing `runtime-ux` barrel pattern.
 */

export {
  type FormFlightMode,
  type FormFlightPayloadMode,
  type FormFlightProfile,
  type FormFlightAdapter,
} from "./types";

export {
  buildFormFlightPayload,
  setFormFlightPath,
  readFormFlightPath,
} from "./payload";

export {
  collectFormFlightMissingRequired,
  listFormFlightMissingPaths,
  snapshotFormFlightFields,
  type FormFlightMissingField,
} from "./validation";

export { resolveFormFlightLine, resolveFormFlightSummary } from "./summary";

export { scanFormFlightAcceptance, type FormFlightAcceptanceResult } from "./acceptance";

export {
  registerFormFlightProfile,
  getFormFlightProfile,
  listFormFlightProfiles,
  __resetFormFlightProfilesForTests,
} from "./registry";

export {
  createTemplateRuntimeAdapter,
  gateRuntimePreview,
  buildRuntimePreviewPayload,
  resolveRuntimeSummary,
  acceptRuntimeRenderedText,
  listRuntimeMissingFields,
} from "./adapters/template-runtime-adapter";

export {
  createGeneratedDocumentAdapter,
  gateGeneratedDocumentSave,
  buildGeneratedDocumentSavePayload,
  buildGeneratedDocumentDemoPayload,
  resolveGeneratedDocumentSummary,
  acceptGeneratedDocumentRenderedText,
  listGeneratedDocumentMissingFields,
  assertProfileInvariant,
} from "./adapters/generated-document-adapter";

export {
  decideFormLifecycle,
  registerRuntimeReadyFormFlightProfiles,
  listApprovedRuntimeReadyCodes,
  isApprovedRuntimeReadyCode,
  RUNTIME_READY_FORM_FLIGHT_PROFILES,
  type FormLifecycleDecision,
  type FormLifecycleKind,
  type FormLifecyclePanelKind,
  type FormLifecycleProfileStatus,
  type RuntimeReadyFormFlightCode,
} from "./form-lifecycle";