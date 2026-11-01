#!/usr/bin/env node
/**
 * structural-213-validator.mjs
 *
 * Iterates all 213 compiled contracts and performs renderer-level
 * structural validation beyond the compiler's schema/duplicate checks.
 *
 * Output: docs/audit/final-213-customer-ready/local-usability/structural-213-matrix.json
 *
 * Row format per form:
 *   FORM, ACCESS_TIER, SECTION_COUNT, CANONICAL_FIELD_COUNT, VISIBLE_FIELD_COUNT,
 *   ORPHAN_FIELDS, DUPLICATE_FIELDS, EMPTY_SECTIONS, UNSUPPORTED_CONTROLS,
 *   INVALID_PROFILE_KEYS, STALE_DEMO_TOKENS, VERDICT, FAILURE_SIGNATURES
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const COMPILED_DIR = `${ROOT}/docs/audit/docx/compiled-v2`;
const PROFILES_DIR = `${ROOT}/apps/web/src/lib/runtime-ux`;
const INDEX_FILE = `${ROOT}/apps/web/src/lib/runtime-ux/index.ts`;
const REGISTRY_FILE = `${ROOT}/apps/web/src/lib/vks-template-catalog.ts`;
const OUT_DIR = `${ROOT}/docs/audit/final-213-customer-ready/local-usability`;
const OUT_FILE = `${OUT_DIR}/structural-213-matrix.json`;

const SUPPORTED_CONTROLS = new Set([
  "TEXT", "TEXTAREA", "TIME", "DATE", "PARTIAL_DATE", "NUMBER",
  "SELECT", "RADIO", "CHECKBOX", "AGENCY_PICKER", "OFFICIAL_PICKER",
  "PERSON_PICKER", "READONLY", "COMPUTED"
]);

const SMART_KINDS = new Set([
  "text", "textarea", "date", "time", "select", "date-parts", "year-or-date", "issue-place-date-line"
]);

function readJsonSafe(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

function compiledExists(code) {
  return existsSync(`${COMPILED_DIR}/${code}.compiled.json`);
}

function loadCompiled(code) {
  const path = `${COMPILED_DIR}/${code}.compiled.json`;
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

function profileExists(code) {
  const name = `bm${code.slice(3)}-runtime-ux-profile.ts`;
  return existsSync(`${PROFILES_DIR}/${name}`);
}

function profileRegistered(code) {
  if (!existsSync(INDEX_FILE)) return false;
  const content = readFileSync(INDEX_FILE, "utf8");
  return content.includes(`./bm${code.slice(3)}-runtime-ux-profile`);
}

function loadProfile(code) {
  const name = `bm${code.slice(3)}-runtime-ux-profile.ts`;
  const path = `${PROFILES_DIR}/${name}`;
  if (!existsSync(path)) return null;
  const content = readFileSync(path, "utf8");
  const m = content.match(/const\s+\w+_RUNTIME_UX_PROFILE\s*[:=]\s*(\{[\s\S]*?\})\s*;\s*\n/);
  if (!m) return null;
  try {
    return new Function(`return ${m[1]};`)();
  } catch {
    return null;
  }
}

function loadRegistry() {
  if (!existsSync(REGISTRY_FILE)) return new Set();
  const content = readFileSync(REGISTRY_FILE, "utf8");
  const m = content.match(/implementedTemplateCodes:\s*string\[\]\s*=\s*\[([\s\S]*?)\]/);
  if (!m) return new Set();
  const codes = m[1].match(/"BM-\d{3}"/g) || [];
  return new Set(codes.map(c => c.slice(1, -1)));
}

function hasStaleToken(value) {
  if (typeof value !== "string") return false;
  const staleTokens = [
    "Nguyễn Văn A", "Trần Thị B", "1980", "Ông  cung cấp", "Ông cung cấp",
    "Người nhận (mẫu)", "Người ký (mẫu)", "Căn cứ Điều 41"
  ];
  return staleTokens.some(t => value.includes(t));
}

function validateContract(contract) {
  const issues = [];
  const sectionIds = new Set();
  const fieldKeys = new Set();

  for (const s of contract.source.sections) {
    if (sectionIds.has(s.id)) {
      issues.push({ code: "DUPLICATE_SECTION_ID", path: `sections.${s.id}`, message: `Duplicate section id "${s.id}".` });
    }
    sectionIds.add(s.id);
  }

  for (const f of contract.source.fields) {
    if (fieldKeys.has(f.key)) {
      issues.push({ code: "DUPLICATE_FIELD_KEY", path: `fields.${f.key}`, message: `Duplicate field key "${f.key}".` });
    }
    fieldKeys.add(f.key);
    if (!sectionIds.has(f.sectionId)) {
      issues.push({ code: "SECTION_NOT_FOUND", path: `fields.${fieldKey}.sectionId`, message: `Section "${f.sectionId}" does not exist.` });
    }
    if (!SUPPORTED_CONTROLS.has(f.control)) {
      issues.push({ code: "UNSUPPORTED_CONTROL", path: `fields.${f.key}.control`, message: `Control "${f.control}" is not supported.` });
    }
  }

  for (const s of contract.source.sections) {
    const fieldsInSection = contract.source.fields.filter(f => f.sectionId === s.id);
    if (fieldsInSection.length === 0) {
      issues.push({ code: "EMPTY_SECTION", path: `sections.${s.id}`, message: `Section "${s.id}" has no fields.` });
    }
  }

  return issues;
}

function validateProfileOverrides(contract, profile) {
  const issues = [];
  if (!profile || !profile.fields) return issues;

  const contractFieldKeys = new Set(contract.source.fields.map(f => f.key));
  for (const key of Object.keys(profile.fields)) {
    if (!contractFieldKeys.has(key)) {
      issues.push({ code: "PROFILE_INVENTED_FIELD", path: `profile.fields.${key}`, message: `Profile override invents field "${key}" not in contract.` });
    }
  }

  for (const f of contract.source.fields) {
    if (!(f.key in (profile.fields || {}))) {
      const hasSmart = contract.source.fields.some(sf => sf.key === f.key && sf.smart);
      if (hasSmart && f.control === "TEXT") {
        issues.push({ code: "PROFILE_SILENT_REMOVE", path: `fields.${f.key}`, message: `Smart field "${f.key}" has no profile override; may be hidden silently.` });
      }
    }
  }

  return issues;
}

function validateSmartSelfHide(contract, profile) {
  const issues = [];
  if (!profile || !profile.fields) return issues;

  for (const [key, override] of Object.entries(profile.fields)) {
    if (override && override.smart && override.smart.derivedTargets) {
      const selfHidden = override.smart.derivedTargets.includes(override.smart.key || key);
      if (selfHidden) {
        issues.push({ code: "SMART_SELF_HIDDEN", path: `profile.fields.${key}.smart`, message: `Smart field "${key}" lists itself in derivedTargets, causing self-hide.` });
      }
    }
  }

  return issues;
}

function validateDemoValues(contract, profile) {
  const issues = [];
  if (!profile || !profile.demo) return issues;

  const contractFieldKeys = new Set(contract.source.fields.map(f => f.key));
  for (const key of Object.keys(profile.demo)) {
    if (!contractFieldKeys.has(key)) {
      issues.push({ code: "DEMO_INVALID_KEY", path: `profile.demo.${key}`, message: `Demo value references unknown field "${key}".` });
    }
  }

  for (const key of Object.keys(profile.demo)) {
    if (hasStaleToken(profile.demo[key])) {
      issues.push({ code: "STALE_DEMO_TOKEN", path: `profile.demo.${key}`, message: `Demo value for "${key}" contains stale token.` });
    }
  }

  return issues;
}

function accessTier(code, registered) {
  const RUNTIME_READY = new Set(["BM-001", "BM-136", "BM-148", "BM-156", "BM-157", "BM-168", "BM-171", "BM-174", "BM-181", "BM-206", "BM-213"]);
  if (RUNTIME_READY.has(code)) return "RUNTIME_READY";
  if (registered) return "LOCAL_SKELETON";
  return "UNKNOWN";
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const registry = loadRegistry();
  const rows = [];
  let pass = 0, fail = 0;

  for (let n = 1; n <= 213; n++) {
    const code = `BM-${String(n).padStart(3, "0")}`;
    const compiled = loadCompiled(code);
    const registered = registry.has(code);
    const profile = loadProfile(code);
    const tier = accessTier(code, registered);

    if (!compiled) {
      rows.push({
        FORM: code,
        ACCESS_TIER: tier,
        SECTION_COUNT: 0,
        CANONICAL_FIELD_COUNT: 0,
        VISIBLE_FIELD_COUNT: 0,
        ORPHAN_FIELDS: 0,
        DUPLICATE_FIELDS: 0,
        EMPTY_SECTIONS: 0,
        UNSUPPORTED_CONTROLS: 0,
        INVALID_PROFILE_KEYS: 0,
        STALE_DEMO_TOKENS: 0,
        VERDICT: "FAIL",
        FAILURE_SIGNATURES: ["COMPILED_CONTRACT_MISSING"]
      });
      fail++;
      continue;
    }

    const compilerIssues = validateContract(compiled);
    const profileIssues = validateProfileOverrides(compiled, profile);
    const smartHideIssues = validateSmartSelfHide(compiled, profile);
    const demoIssues = validateDemoValues(compiled, profile);
    const allIssues = [...compilerIssues, ...profileIssues, ...smartHideIssues, ...demoIssues];

    const duplicateFields = allIssues.filter(i => i.code === "DUPLICATE_FIELD_KEY").length;
    const orphanFields = allIssues.filter(i => i.code === "SECTION_NOT_FOUND").length;
    const emptySections = allIssues.filter(i => i.code === "EMPTY_SECTION").length;
    const unsupportedControls = allIssues.filter(i => i.code === "UNSUPPORTED_CONTROL").length;
    const invalidProfileKeys = allIssues.filter(i => i.code === "PROFILE_INVENTED_FIELD").length;
    const staleDemoTokens = allIssues.filter(i => i.code === "STALE_DEMO_TOKEN").length;
    const smartSelfHidden = allIssues.filter(i => i.code === "SMART_SELF_HIDDEN").length;

    const failureSignatures = Array.from(new Set(allIssues.map(i => i.code)));
    const verdict = failureSignatures.length === 0 ? "PASS" : "FAIL";

    if (verdict === "PASS") pass++; else fail++;

    rows.push({
      FORM: code,
      ACCESS_TIER: tier,
      SECTION_COUNT: compiled.source.sections.length,
      CANONICAL_FIELD_COUNT: compiled.source.fields.length,
      VISIBLE_FIELD_COUNT: compiled.source.fields.filter(f => !f.hiddenRequiredReason).length,
      ORPHAN_FIELDS: orphanFields,
      DUPLICATE_FIELDS: duplicateFields,
      EMPTY_SECTIONS: emptySections,
      UNSUPPORTED_CONTROLS: unsupportedControls,
      INVALID_PROFILE_KEYS: invalidProfileKeys,
      STALE_DEMO_TOKENS: staleDemoTokens,
      SMART_SELF_HIDDEN: smartSelfHidden,
      VERDICT: verdict,
      FAILURE_SIGNATURES: failureSignatures,
      ISSUE_COUNT: allIssues.length
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    pass,
    fail,
    counts: {
      PASS: pass,
      FAIL: fail
    },
    rows
  };

  writeFileSync(OUT_FILE, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ total: rows.length, pass, fail }, null, 2));
}

main();
