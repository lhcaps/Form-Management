import type { FormContractV2 } from "./types.js";

export function createEmptyContract(input: {
  templateCode: string;
  title: string;
  agencyId: string | null;
  templateHash: string;
  normalizedDocxPath?: string;
  baseContractHash?: string | null;
}): FormContractV2 {
  return {
    schemaVersion: "2.0",
    templateCode: input.templateCode,
    title: input.title,
    agencyId: input.agencyId,
    version: 1,
    status: "DRAFT",
    baseContractHash: input.baseContractHash ?? null,
    contractHash: "",
    templateHash: input.templateHash,
    normalizedDocxPath: input.normalizedDocxPath,
    sections: [],
    fields: [],
    repeatableGroups: [],
    tables: [],
    computedFields: [],
    conditionalRules: [],
    validationRules: [],
    defaultRules: [],
    presetRules: [],
    renderBindings: [],
    migrationRules: [],
    extensionPoints: [],
  };
}
