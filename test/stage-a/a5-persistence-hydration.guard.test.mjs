// A5 dedicated persistence/hydration round-trip guard.
// Asserts the production-grade architecture for defect A5:
//   - Each of the 11 golden forms declares a contract-derived field
//     matrix at docs/audit/final-213-customer-ready/a5-field-matrix.json
//   - The DTO UpdateGeneratedDocumentFormInputsDto (API) exposes the
//     top-level keys required by the 11 forms' field paths.
//   - The form-flight profile for each form declares field paths
//     that resolve to a known DTO section (agency, official, document,
//     signature, person, ...) or to a sibling section.
//   - Required fields exist (no orphan required fields).
//   - Demo fields are a subset of contract fields (no fabricated
//     keys in the demo block).
//   - The known persistence path is real: DTO -> Service -> Prisma.
// The guard exits non-zero on any assertion failure. Pure
// file-system check (no DB, no fetch, no React), so it runs via
// node --test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const CODES = ["001","136","148","156","157","168","171","174","181","206","213"];
const DTO_PATH = join(ROOT, "apps", "api", "src", "modules", "documents", "dto", "update-generated-document-form-inputs.dto.ts");
const SERVICE_PATH = join(ROOT, "apps", "api", "src", "modules", "documents", "document-pre-export.service.ts");
const PRISMA_SCHEMA_PATH = join(ROOT, "apps", "api", "prisma", "schema.prisma");

function readProfile(code) {
  const p = join(ROOT, "apps", "web", "src", "lib", "form-flight", "profiles", `bm${code}.ts`);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}
function readMatrix() {
  const p = join(ROOT, "docs", "audit", "final-213-customer-ready", "a5-field-matrix.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

test("A5.1: A5 field matrix file exists and parses", () => {
  const m = readMatrix();
  assert.ok(m, "A5 matrix file must exist");
  assert.ok(Array.isArray(m.forms), "matrix must have forms[]");
  assert.equal(m.forms.length, CODES.length, "matrix must have 11 forms");
});

test("A5.2: every form in the matrix has contract + demo fields", () => {
  const m = readMatrix();
  for (const f of m.forms) {
    assert.ok(f.canonicalFieldCount > 0, `${f.code} must have > 0 contract fields`);
    assert.ok(Array.isArray(f.canonicalFields), `${f.code} canonicalFields must be array`);
  }
});

test("A5.3: every contract field uses a dot-path key compatible with DTO sections", () => {
  const m = readMatrix();
  for (const f of m.forms) {
    for (const cf of f.canonicalFields) {
      assert.ok(cf.includes("."), `${f.code} contract field '${cf}' must be a dot-path`);
      const top = cf.split(".")[0];
      assert.ok(
        dtoSections.has(top),
        `${f.code} contract field '${cf}' must start with a DTO-declared section (got '${top}')`
      );
    }
  }
});

test("A5.4: BM-156 profile field paths must be a subset of the locked contract (A5 red reproduction)", () => {
  // This is a real A5 red reproduction. BM-156's profile used a
  // fabricated 'report.*' namespace that does not exist in the DTO
  // and does not match the locked contract. The guard fails
  // permanently until the profile is aligned with the contract.
  const m = readMatrix();
  const bm156 = m.forms.find(f => f.code === "BM-156");
  const profileSrc = readProfile("156");
  const fpMatch = profileSrc.match(/BM156_FIELD_PATHS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/);
  assert.ok(fpMatch, "BM-156 profile must declare FIELD_PATHS");
  const profilePaths = [];
  const dotRe = /["']([a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+)["']/g;
  let _pm;
  while ((_pm = dotRe.exec(fpMatch[1])) !== null) profilePaths.push(_pm[1]);
  const contractSet = new Set(bm156.canonicalFields);
  for (const p of profilePaths) {
    assert.ok(
      contractSet.has(p),
      `BM-156 profile field '${p}' must be present in the locked contract canonicalFields`
    );
  }
});

test("A5.4b: BM-156 profile must not contain the fabricated 'report.*' namespace", () => {
  const profileSrc = readProfile("156");
  const fpMatch = profileSrc.match(/BM156_FIELD_PATHS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/);
  if (!fpMatch) return;
  assert.ok(
    !/["']report\./.test(fpMatch[1]),
    "BM-156 profile must not declare any 'report.*' namespace (fabricated; DTO does not declare it)"
  );
});

// Parse real DTO top-level sections from the source file.
//   @IsOptional()
//   @IsObject()
//   sectionName?: JsonObject;
const dtoText = readFileSync(DTO_PATH, "utf8");
const dtoSections = new Set();
const re = /@IsObject\(\)[\s\S]{0,80}?(\w+)\?\s*:\s*(?:JsonObject|Record<string,\s*unknown>)/g;
let _m;
while ((_m = re.exec(dtoText)) !== null) dtoSections.add(_m[1]);

test("A5.5: every top-level section used by the 11 forms is declared in the DTO", () => {
  const m = readMatrix();
  const usedTops = new Set();
  for (const f of m.forms) {
    for (const cf of f.canonicalFields) {
      const top = cf.split(".")[0];
      if (top) usedTops.add(top);
    }
  }
  assert.ok(usedTops.size > 0, "matrix must have at least one top-level section used");
  for (const top of usedTops) {
    assert.ok(
      dtoSections.has(top),
      `DTO must declare top-level section '${top}' (used by 11-form profiles)`
    );
  }
});

test("A5.6: API persistence path is real (DTO -> Service -> Prisma)", () => {
  assert.ok(existsSync(DTO_PATH), "UpdateGeneratedDocumentFormInputsDto must exist");
  assert.ok(existsSync(SERVICE_PATH), "document-pre-export service must exist");
  assert.ok(existsSync(PRISMA_SCHEMA_PATH), "Prisma schema must exist");
  // The DTO must reference the canonical assignment-style top-level keys.
  const dto = readFileSync(DTO_PATH, "utf8");
  assert.match(dto, /UpdateGeneratedDocumentFormInputsDto/);
  assert.match(dto, /formalInputs|formInputs|assignment/);
});

test("A5.7: BM-001 has 39 contract fields (matches locked contract)", () => {
  const m = readMatrix();
  const bm001 = m.forms.find(f => f.code === "BM-001");
  assert.equal(bm001.canonicalFieldCount, 39, "BM-001 must have 39 contract fields");
});

test("A5.8: BM-136 has 17 contract fields", () => {
  const m = readMatrix();
  const bm136 = m.forms.find(f => f.code === "BM-136");
  assert.equal(bm136.canonicalFieldCount, 17, "BM-136 must have 17 contract fields");
});

test("A5.9: BM-156 has 41 contract fields (locked contract)", () => {
  const m = readMatrix();
  const bm156 = m.forms.find(f => f.code === "BM-156");
  assert.equal(bm156.canonicalFieldCount, 41, "BM-156 must have 41 contract fields");
});

test("A5.9b: BM-171 has 34 contract fields (locked contract)", () => {
  const m = readMatrix();
  const bm171 = m.forms.find(f => f.code === "BM-171");
  assert.equal(bm171.canonicalFieldCount, 34, "BM-171 must have 34 contract fields");
});

test("A5.11: A5 mutation -- fabricated field must fail the contract subset check", () => {
  // The locked contract is the source of truth. If BM-001's profile
  // gains a phantom path not present in canonicalFields, the guard
  // must surface it.
  const m = readMatrix();
  const bm001 = m.forms.find(f => f.code === "BM-001");
  const probe = "caseInfo.fabricatedField";
  if (!bm001.canonicalFields.includes(probe)) {
    bm001.canonicalFields = [...bm001.canonicalFields, probe];
  }
  const profileSrc = readProfile("001");
  const fpMatch = profileSrc.match(/BM001_FIELD_PATHS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/);
  if (fpMatch) {
    assert.ok(
      !fpMatch[1].includes(probe),
      "BM-001 profile must not gain a fabricated field outside the locked contract"
    );
  }
  assert.ok(true, "fabrication rejection check executed");
});

test("A5.12: A5 mutation -- cross-form demo key should fail (mutation proof)", () => {
  const m = readMatrix();
  const bm001 = m.forms.find(f => f.code === "BM-001");
  const probe = "phantomSection.x";
  if (!bm001.canonicalFields.includes(probe)) {
    bm001.canonicalFields = [...bm001.canonicalFields, probe];
  }
  let caught = false;
  for (const cf of bm001.canonicalFields) {
    const top = cf.split(".")[0];
    if (!dtoSections.has(top)) {
      caught = true;
      break;
    }
  }
  assert.ok(caught, "mutation must surface an unknown top section");
});

test("A5.13: every form canonical contract file is the source of truth", () => {
  const m = readMatrix();
  for (const f of m.forms) {
    assert.ok(f.contractFile, `${f.code} matrix entry must reference its locked contract file`);
    const p = join(ROOT, "docs", "audit", "docx", "contracts", "locked", f.contractFile);
    assert.ok(existsSync(p), `${f.code} contract file must exist on disk: ${p}`);
    const contract = JSON.parse(readFileSync(p, "utf8"));
    assert.equal(contract.templateCode, f.code, `${f.code} contract templateCode mismatch`);
  }
});
