/**
 * Compatibility re-export shim for the retired customer-facing Form Studio
 * admin authoring surface.
 *
 * After the form-studio retirement (PR-B / contract-platform module
 * consolidation), the only remaining customer-facing surface is the
 * generated-document lifecycle plus the public runtime contract lookup.
 * Anything that still imports from this path should resolve to the same
 * shape via the contract-platform module.
 *
 * This file MUST stay a thin re-export shim. Do not add new authoring
 * helpers here. The retired authoring helpers (anything targeting the
 * admin authoring controller surface) are protected by the
 * form-studio-retirement-guard and the generated-form-input-guard tests.
 */
export {
  listFormPlatformCatalog,
  getRuntimeFormContract,
  type FormPlatformCatalogItem,
  type FormPlatformCatalogResponse,
} from "./contract-platform-api";
