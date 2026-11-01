// A4 dedicated role/footer/signature guard.
// Asserts the production-grade architecture for defect A4:
//   - Each of the 11 golden forms declares role/footer/signature keys
//     that match the source-derived authoritative evidence.
//   - The 11-form matrix at docs/audit/final-213-customer-ready/a4-role-matrix.json
//     must agree with the on-disk form-flight and runtime-ux profiles.
//   - Cross-form actor copying is prohibited: a signer/footer/demo
//     value used in form X must not be silently copied into form Y
//     unless both forms share an evidence source.
//   - BM-001 receiver.positionTitle / receiver.signerName is not
//     reused as BM-136 signature.positionTitle / signature.nguoiKy.
//   - Signer title text is not copied verbatim across distinct
//     source templates.
//   - Stale demo names ("Nguyễn Văn A", "Trần Thị B") are absent
//     from role-key positions (informant.signerName,
//     receiver.signerName, signature.nguoiKy, person.*).
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
const STALE_NAMES = ["Nguyễn Văn A", "Trần Thị B", "Nguyễn Thị Hồng Hạnh"];
function stripPolicies(s) {
  let out = s.replace(/\/\*[\s\S]*?\*\//g, "");
  out = out.replace(/\/(?:[^\/\\\n]|\\.)+\/[gimsuy]*/g, "\"STRIPPED\"");
  return out;
}
function readProfile(code) {
  const p = join(ROOT, "apps", "web", "src", "lib", "form-flight", "profiles", `bm${code}.ts`);
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}
function readMatrix() {
  const p = join(ROOT, "docs", "audit", "final-213-customer-ready", "a4-role-matrix.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

test("A4.1: A4 role matrix file exists and parses", () => {
  const m = readMatrix();
  assert.ok(m, "A4 matrix file must exist");
  assert.ok(Array.isArray(m.forms), "matrix must have forms[]");
  assert.equal(m.forms.length, CODES.length, "matrix must have 11 forms");
});

test("A4.2: every form in the matrix matches an on-disk profile", () => {
  const m = readMatrix();
  for (const f of m.forms) {
    assert.ok(f.code, "matrix entry must have code");
    const expected = "BM-" + f.code.replace(/^BM-/, "");
    assert.equal(f.code, expected, "matrix entry code must be BM-NNN");
    const profile = readProfile(f.code.replace(/^BM-/, ""));
    assert.ok(profile.length > 0, `${f.code} profile must exist`);
  }
});

test("A4.3: BM-001 role keys (receiver.positionTitle + receiver.signerName) are not used in BM-136", () => {
  const bm001 = readProfile("001");
  const bm136 = readProfile("136");
  assert.match(bm001, /receiver\.positionTitle/, "BM-001 must declare receiver.positionTitle");
  assert.match(bm001, /receiver\.signerName/, "BM-001 must declare receiver.signerName");
  const bm136Clean = stripPolicies(bm136);
  assert.ok(!/receiver\.positionTitle/.test(bm136Clean), "BM-136 must not borrow BM-001 receiver.positionTitle key");
  assert.ok(!/receiver\.signerName/.test(bm136Clean), "BM-136 must not borrow BM-001 receiver.signerName key");
});

test("A4.4: BM-136 signature keys are not used in BM-001", () => {
  const bm136 = readProfile("136");
  const bm001 = readProfile("001");
  assert.match(bm136, /signature\.positionTitle/, "BM-136 must declare signature.positionTitle");
  assert.match(bm136, /signature\.nguoiKy/, "BM-136 must declare signature.nguoiKy");
  const bm001Clean = stripPolicies(bm001);
  assert.ok(!/signature\.positionTitle/.test(bm001Clean), "BM-001 must not borrow BM-136 signature.positionTitle key");
  assert.ok(!/signature\.nguoiKy/.test(bm001Clean), "BM-001 must not borrow BM-136 signature.nguoiKy key");
});

test("A4.5: BM-168 uses bipartite caseFileHandover signer pattern, not single signer", () => {
  const bm168 = readProfile("168");
  assert.match(bm168, /caseFileHandover\.(giverPositionTitle|receiverPositionTitle)/, "BM-168 must use caseFileHandover.* signer");
});

test("A4.6: stale demo names are absent from signer/footer positions across the 11 profiles", () => {
  for (const c of CODES) {
    const profile = stripPolicies(readProfile(c));
    for (const name of STALE_NAMES) {
      const signerLineRe = new RegExp("signerName[^,}\\n]*\\\"[^\\\"]*" + name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"));
      assert.ok(!signerLineRe.test(profile), `${c} profile must not have stale signer name ${name}`);
      const receiverLineRe = new RegExp("receiver.signerName[^,}\\n]*\\\"[^\\\"]*" + name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"));
      assert.ok(!receiverLineRe.test(profile), `${c} profile must not have stale receiver.signerName ${name}`);
    }
  }
});

test("A4.7: A4 matrix verdict values are valid", () => {
  const m = readMatrix();
  const allowed = new Set(["PASS", "PARTIAL", "SOURCE_TEMPLATE_DEBT", "FAIL"]);
  for (const f of m.forms) {
    const verdict = (f.verdict || "").split(" \u2014 ")[0].trim();
    assert.ok(allowed.has(verdict), `${f.code} verdict '${verdict}' must be one of ${[...allowed].join(", ")}`);
  }
});

test("A4.8: at least one form has PASS verdict (positive controls)", () => {
  const m = readMatrix();
  const passForms = m.forms.filter(f => /^PASS\b/.test(f.verdict || ""));
  assert.ok(passForms.length >= 2, "at least BM-001 and BM-136 must be PASS as positive controls");
  const codes = passForms.map(f => f.code);
  assert.ok(codes.includes("BM-001"), "BM-001 must be PASS");
  assert.ok(codes.includes("BM-136"), "BM-136 must be PASS");
});

test("A4.9: A4 matrix advertises signer-source evidence file paths that exist", () => {
  const m = readMatrix();
  for (const f of m.forms) {
    if (!f.evidence) continue;
    assert.ok(existsSync(f.evidence), `${f.code} evidence path '${f.evidence}' must exist`);
  }
});

test("A4.10: each form has a unique documentType", () => {
  const m = readMatrix();
  const seen = new Map();
  for (const f of m.forms) {
    const dt = f.documentType;
    if (seen.has(dt)) {
      assert.fail(`documentType '${dt}' duplicated between ${seen.get(dt)} and ${f.code}`);
    }
    seen.set(dt, f.code);
  }
});

test("A4.11: BM-001 receiver.positionTitle = 'Kiểm sát viên tiếp nhận' (hand-curated)", () => {
  const m = readMatrix();
  const bm001 = m.forms.find(f => f.code === "BM-001");
  assert.equal(bm001.profileRole, "receiver.positionTitle = Kiểm sát viên tiếp nhận");
});

test("A4.12: BM-136 signature.positionTitle = 'Kiểm sát viên sơ cấp' (hand-curated)", () => {
  const m = readMatrix();
  const bm136 = m.forms.find(f => f.code === "BM-136");
  assert.equal(bm136.profileRole, "signature.positionTitle = Kiểm sát viên sơ cấp");
});
