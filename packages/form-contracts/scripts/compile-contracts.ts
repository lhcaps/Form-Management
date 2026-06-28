import fs from "node:fs";
import path from "node:path";
import { stableStringify } from "../src/index.js";
import { compileFile, lockedContractFiles, repoRoot } from "./workspace.js";

const args = process.argv.slice(2);
const BM_FILTER = (() => {
  // Support --bm=BM-063,BM-066 (comma-separated) or multiple --bm flags
  const bmArgs = args.filter((a) => a.startsWith("--bm="));
  if (bmArgs.length === 0) return null;
  return bmArgs
    .flatMap((a) => a.replace("--bm=", "").split(","))
    .map((s) => s.trim())
    .filter(Boolean);
})();

const outputDirectory = path.join(
  repoRoot(),
  "docs",
  "audit",
  "docx",
  "compiled-v2",
);
fs.mkdirSync(outputDirectory, { recursive: true });

const files = lockedContractFiles();
const filtered = BM_FILTER
  ? files.filter((file) => BM_FILTER.some((bm) => path.basename(file).startsWith(bm + "__")))
  : files;

if (BM_FILTER) {
  console.error(`[compile] Compiling ${filtered.length} of ${files.length} contracts (BM filter: ${BM_FILTER.join(", ")})`);
}

for (const file of filtered) {
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
