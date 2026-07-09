/**
 * Public surface for the runtime UX profile layer.
 *
 * Importing this barrel eagerly loads every registered profile so that
 * `getRuntimeUxProfile("BM-171")` works the moment the bundle is
 * imported in `TemplatePreviewWorkspace` or its tests.
 */

// Import order matters — each profile module side-effects the registry.
import "./bm171-runtime-ux-profile";

export {
  type RuntimeUxProfile,
  getRuntimeUxProfile,
  listRegisteredRuntimeUxProfiles,
  registerRuntimeUxProfile,
  __resetRuntimeUxProfilesForTests,
} from "./runtime-ux-profile";

export {
  buildRuntimePreviewPayloadFromDraft,
  setNestedPath,
  type RuntimePreviewPayloadMode,
  type BuildPayloadInput,
  type BuildPayloadResult,
  type BuildPayloadWarning,
} from "./runtime-preview-payload";

export {
  isKnownStaleFallback,
  listKnownStaleFallbacks,
} from "./placeholder-blocklist";
