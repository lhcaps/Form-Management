import type { CompiledFormContract } from "@qllaw/form-contracts";
import type { FormFlightProfile } from "./types";

/**
 * Derives the generated-document-only Form Flight profile from the exact
 * compiled contract returned by the runtime contract API. This keeps every
 * field and required rule aligned with the locked/published contract while
 * leaving the standalone template runtime fail-closed.
 */
export function createPersistedFormFlightProfile(
  contract: CompiledFormContract,
): FormFlightProfile {
  const fieldPaths = [...new Set(contract.source.fields.map((field) => field.key))];
  const requiredFieldPaths = [
    ...new Set(
      contract.source.fields
        .filter((field) => field.required)
        .map((field) => field.key),
    ),
  ];

  return {
    templateCode: contract.templateCode,
    title: contract.title,
    fieldPaths,
    requiredFieldPaths,
    demo: {},
    acceptance: { requiredText: [], forbiddenText: [] },
    persistedReady: true,
    profileStatus: "persisted-ready",
  };
}
