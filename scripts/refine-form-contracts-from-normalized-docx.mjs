#!/usr/bin/env node

import { writeFileSync } from "node:fs";

import {
  parseSelectedCodes,
  prepareContractRefinement,
  resolveRepoRoot,
} from "./form-refinement/normalized-contract-refinement.mjs";

const repoRoot = resolveRepoRoot();
const args = process.argv.slice(2);
const codes = parseSelectedCodes(args);
const shouldWrite = args.includes("--write");

if (codes.length === 0) {
  throw new Error(
    "No BM codes selected. Use --codes BM-005,BM-006 and add --write to update contracts.",
  );
}

const prepared = codes.map((code) =>
  prepareContractRefinement(repoRoot, code),
);

for (const item of prepared) {
  const originalGeneric = item.original.canonicalFields.filter((field) =>
    /\.[Ff]ield\d+$/u.test(field.path),
  ).length;
  console.log(
    [
      item.code,
      `${item.original.canonicalFields.length}->${item.refined.canonicalFields.length} fields`,
      `${item.refined.renderBindings.length} bindings`,
      `${originalGeneric}->0 generic fields`,
      shouldWrite ? "WRITE" : "DRY-RUN",
    ].join(" | "),
  );
}

if (shouldWrite) {
  for (const item of prepared) {
    writeFileSync(
      item.contractPath,
      `${JSON.stringify(item.refined, null, 2)}\n`,
      "utf8",
    );
  }
  console.log(`Updated ${prepared.length} draft contract(s).`);
} else {
  console.log("Dry run only; no contract files were changed.");
}
