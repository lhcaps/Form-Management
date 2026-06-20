import fs from "node:fs";
import path from "node:path";
import { stableStringify } from "../src/index.js";
import { compileFile, lockedContractFiles, repoRoot } from "./workspace.js";

let failed = false;
const outputDirectory = path.join(
  repoRoot(),
  "docs",
  "audit",
  "docx",
  "compiled-v2",
);

for (const file of lockedContractFiles()) {
  const { result } = compileFile(file);
  const artifact = result.artifact;
  if (!result.ok || !artifact) {
    failed = true;
    console.error(`INVALID ${path.basename(file)}`);
    continue;
  }
  const compiledFile = path.join(
    outputDirectory,
    `${artifact.templateCode}.compiled.json`,
  );
  if (!fs.existsSync(compiledFile)) {
    failed = true;
    console.error(`MISSING ${path.relative(repoRoot(), compiledFile)}`);
    continue;
  }
  const actual = fs.readFileSync(compiledFile, "utf8").trim();
  const expected = stableStringify(artifact);
  if (actual !== expected) {
    failed = true;
    console.error(`STALE   ${path.relative(repoRoot(), compiledFile)}`);
    continue;
  }
  console.log(`SYNCED  ${artifact.templateCode} ${artifact.contractHash}`);
}

if (failed) process.exitCode = 1;
