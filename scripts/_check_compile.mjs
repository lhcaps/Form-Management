import { validateContract } from "./packages/form-contracts/src/validator.ts";
import fs from "node:fs";

const lockedDir = "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked";
const files = fs.readdirSync(lockedDir).filter(f => f.endsWith(".contract.locked.json")).slice(0, 3);

for (const file of files) {
  const contract = JSON.parse(fs.readFileSync(lockedDir + "/" + file, "utf8"));
  // Convert to FormContractV2 format
  const v2 = {
    version: contract.version,
    templateCode: contract.templateCode || contract.sourceId?.split("__")[0] || "UNKNOWN",
    title: contract.title || "",
    agencyId: contract.metadata?.agencyId || null,
    fields: (contract.canonicalFields || []).map((f: any) => ({
      key: f.path,
      sectionId: f.path.split(".")[0],
      label: f.label || f.path,
      control: f.slotType === "date" ? "date" : "text",
      required: f.required ?? false,
      order: 0,
    })),
    sections: [],
    repeatableGroups: [],
    tables: [],
    conditionalRules: [],
    renderBindings: (contract.renderBindings || []).map((b: any) => ({
      id: b.slotId,
      from: b.from || b.slotId,
      transform: b.transform || "identity",
    })),
    docxSlots: (contract.docxSlots || []).map((s: any) => ({
      slotId: s.slotId,
      blockId: s.location?.blockId || "",
    })),
  };

  const result = validateContract(v2 as any);
  const errors = result.filter((r: any) => r.severity === "ERROR");
  const warnings = result.filter((r: any) => r.severity === "WARNING");

  console.log(file + ": " + errors.length + " errors, " + warnings.length + " warnings");
  if (errors.length > 0) {
    errors.slice(0, 3).forEach((e: any) => console.log("  ERROR: " + e.code + " - " + e.message));
  }
}
