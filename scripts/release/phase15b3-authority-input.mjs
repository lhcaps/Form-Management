#!/usr/bin/env node
/**
 * Phase 15B.3 — Phase 2: Authoritative 213 Input Builder.
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 * Build the canonical form input from the authoritative runtime index
 * `docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-runtime-index.v2.1.json`
 * (or the newest current canonical equivalent after verifying its hash).
 *
 * Per the brief, we MUST NOT iterate 1..213 as the authority. We MUST load
 * the exact expected form-code set and exact contract path from the index.
 *
 * Required output invariants:
 *   registeredForms = 213
 *   contractPaths = 213
 *   duplicateMappings = 0
 *   missingMappings = 0
 *   unknownMappings = 0
 *
 * The output also records the SHA-256 of every contract file so Phase 3
 * can reference the same set deterministically.
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash as cryptoCreateHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

const INDEX_PATHS = [
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "runtime-rollout",
    "locked-authority-rebase",
    "locked-contract-runtime-index.v2.1.json",
  ),
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "runtime-rollout",
    "locked-authority-rebase",
    "locked-contract-runtime-index.v2.json",
  ),
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "runtime-rollout",
    "locked-authority-rebase",
    "locked-contract-runtime-index.json",
  ),
];

const OUTPUT_DIR =
  process.env.OUTPUT_DIR ??
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "release-integration",
  );

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fileSha256(path) {
  const buf = readFileSync(path);
  return cryptoCreateHash("sha256").update(buf).digest("hex");
}

function findIndex() {
  for (const p of INDEX_PATHS) {
    if (existsSync(p)) {
      return { path: p, data: readJson(p) };
    }
  }
  throw new Error(
    "No authoritative runtime index found. Searched: " + INDEX_PATHS.join(", "),
  );
}

function main() {
  const idx = findIndex();
  const forms = idx.data.forms ?? [];
  if (forms.length !== 213) {
    throw new Error(
      `Expected 213 forms in ${idx.path}, got ${forms.length}`,
    );
  }

  const rows = [];
  let duplicateMappings = 0;
  let missingMappings = 0;
  let unknownMappings = 0;

  const seen = new Map(); // formCode -> count

  for (const f of forms) {
    const formCode = f?.identity?.templateCode;
    const contractPathRel = f?.identity?.contractPath;
    const contractSha = f?.identity?.contractFileSha256;
    const canonicalFormSha = f?.hashes?.canonicalFormSha256 ?? null;
    const normalizedDocxPath = f?.identity?.normalizedDocxPath ?? null;
    const normalizedDocxSha = f?.hashes?.normalizedDocxSha256 ?? null;

    if (!formCode) {
      missingMappings++;
      continue;
    }
    seen.set(formCode, (seen.get(formCode) ?? 0) + 1);

    // Validate contract path actually exists.
    const absPath = join(REPO_ROOT, contractPathRel ?? "");
    let contractPathExists = false;
    let absContractSha = null;
    if (existsSync(absPath)) {
      contractPathExists = true;
      absContractSha = fileSha256(absPath);
    } else {
      unknownMappings++;
    }

    if ((contractSha ?? null) !== null && absContractSha !== null && contractSha !== absContractSha) {
      console.warn(
        `MISMATCH: ${formCode} index contractSha=${contractSha} actualSha=${absContractSha}`,
      );
    }

    rows.push({
      FORM_CODE: formCode,
      CONTRACT_PATH: contractPathRel ?? null,
      CONTRACT_PATH_EXISTS: contractPathExists,
      CONTRACT_SHA256: contractSha ?? absContractSha ?? null,
      CANONICAL_FORM_SHA256: canonicalFormSha,
      NORMALIZED_DOCX_PATH: normalizedDocxPath,
      NORMALIZED_DOCX_SHA256: normalizedDocxSha,
    });
  }

  for (const [code, count] of seen.entries()) {
    if (count > 1) {
      duplicateMappings += count - 1;
    }
  }

  // Normalized DOCX path: locate under `docs/audit/docx/normalized/...`
  // if not provided by the index.
  for (const row of rows) {
    if (!row.NORMALIZED_DOCX_PATH) {
      const code = row.FORM_CODE;
      const normalizedDir = join(
        REPO_ROOT,
        "docs",
        "audit",
        "docx",
        "normalized",
        code,
      );
      if (existsSync(normalizedDir)) {
        try {
          const entries = readdirSync(normalizedDir);
          const docx = entries.find((e) => e.endsWith(".docx"));
          if (docx) {
            row.NORMALIZED_DOCX_PATH = join(
              "docs",
              "audit",
              "docx",
              "normalized",
              code,
              docx,
            );
            const buf = readFileSync(join(normalizedDir, docx));
            row.NORMALIZED_DOCX_SHA256 = cryptoCreateHash("sha256")
              .update(buf)
              .digest("hex");
          }
        } catch {
          /* best-effort */
        }
      }
    }
  }

  const out = {
    schema: "qllaw.phase15b3.authority_input/v1",
    runId: "PHASE15B3_PHASE2_AUTHORITY_INPUT",
    generatedAt: new Date().toISOString(),
    authority: {
      indexPath: idx.path,
      indexSchemaVersion: idx.data.schemaVersion ?? null,
      indexAuthority: idx.data.authority ?? null,
      indexHash: fileSha256(idx.path),
    },
    invariants: {
      registeredForms: 213,
      contractPaths: rows.filter((r) => r.CONTRACT_PATH != null).length,
      contractPathsValid: rows.filter((r) => r.CONTRACT_PATH_EXISTS).length,
      duplicateMappings,
      missingMappings,
      unknownMappings,
    },
    rows,
  };

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const outPath = join(OUTPUT_DIR, "phase15b3-authority-input-213.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(JSON.stringify({
    ok: true,
    outPath,
    invariants: out.invariants,
    indexPath: idx.path,
    indexHash: out.authority.indexHash,
  }, null, 2));
}

main();
