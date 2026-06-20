import path from "node:path";
import { compileFile, lockedContractFiles, repoRoot } from "./workspace.js";

let failed = false;
const files = [
  ...lockedContractFiles(),
  path.join(
    repoRoot(),
    "packages",
    "form-contracts",
    "fixtures",
    "synthetic-v2.contract.json",
  ),
];

for (const file of files) {
  const { result } = compileFile(file);
  if (!result.ok) {
    failed = true;
    console.error(`INVALID ${path.relative(repoRoot(), file)}`);
    for (const issue of result.issues) {
      console.error(`  ${issue.code} ${issue.path}: ${issue.message}`);
    }
  } else {
    console.log(`VALID   ${path.relative(repoRoot(), file)}`);
  }
}

if (failed) process.exitCode = 1;
