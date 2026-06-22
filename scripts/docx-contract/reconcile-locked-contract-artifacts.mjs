#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { reconcileLockedContract } from "./lib/locked-contract-reconciler.mjs";

const ROOT = process.cwd();
const LOCKED_DIR = path.join(
  ROOT,
  "docs",
  "audit",
  "docx",
  "contracts",
  "locked",
);
const shouldWrite = process.argv.includes("--write");

const summary = {
  scanned: 0,
  changed: 0,
  unchanged: 0,
  blocked: 0,
  changeCounts: {},
  blockers: [],
};

for (const fileName of fs
  .readdirSync(LOCKED_DIR)
  .filter((value) => value.endsWith(".contract.locked.json"))
  .sort()) {
  summary.scanned += 1;
  const contractPath = path.join(LOCKED_DIR, fileName);
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const normalizedPath = contract.extractionSource?.relativePath
    ? path.join(ROOT, contract.extractionSource.relativePath)
    : null;

  if (!normalizedPath || !fs.existsSync(normalizedPath)) {
    summary.blocked += 1;
    summary.blockers.push({
      templateCode: contract.templateCode ?? fileName,
      reason: "NORMALIZED_DOCX_NOT_FOUND",
    });
    continue;
  }

  try {
    const result = reconcileLockedContract(
      contract,
      fs.readFileSync(normalizedPath),
    );
    if (result.changes.length === 0) {
      summary.unchanged += 1;
      continue;
    }

    summary.changed += 1;
    for (const change of result.changes) {
      const changeCode = change.split(":")[0];
      summary.changeCounts[changeCode] =
        (summary.changeCounts[changeCode] ?? 0) + 1;
    }
    console.log(
      `${contract.templateCode}: ${result.changes.join(", ")}${shouldWrite ? "" : " [DRY-RUN]"}`,
    );

    if (shouldWrite) {
      fs.writeFileSync(
        contractPath,
        `${JSON.stringify(result.contract, null, 2)}\n`,
        "utf8",
      );
    }
  } catch (error) {
    summary.blocked += 1;
    summary.blockers.push({
      templateCode: contract.templateCode ?? fileName,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify(summary, null, 2));
if (summary.blocked > 0) process.exitCode = 1;
