import fs from "node:fs";
import path from "node:path";
import { stableStringify } from "../src/index.js";
import { compileFile, lockedContractFiles, repoRoot } from "./workspace.js";

const outputDirectory = path.join(
  repoRoot(),
  "docs",
  "audit",
  "docx",
  "compiled-v2",
);
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of lockedContractFiles()) {
  const { result } = compileFile(file);
  if (!result.ok || !result.artifact) {
    console.error(`Cannot compile ${path.basename(file)}.`);
    process.exitCode = 1;
    continue;
  }
  const outputFile = path.join(
    outputDirectory,
    `${result.artifact.templateCode}.compiled.json`,
  );
  fs.writeFileSync(outputFile, `${stableStringify(result.artifact)}\n`, "utf8");
  console.log(
    `COMPILED ${result.artifact.templateCode} ${result.artifact.contractHash}`,
  );
}
