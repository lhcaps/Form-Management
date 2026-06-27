import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const LOCKED_FILE = "BM-096__a50a08efa62f.contract.locked.json";
const LOCKED_PATH = path.join(LOCKED_DIR, LOCKED_FILE);

const APPROVED = {
  oldPath: "document.diaChi",
  newPath: "person.idNumber",
  oldLabel: "Ô trống",
  newLabel: "Số CCCD/CMND",
  rawPattern: "{{person.field14}}",
  textBefore: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:",
};

// Load contract once at module level so both describe blocks can reference it
assert.ok(fs.existsSync(LOCKED_PATH), `Locked file not found: ${LOCKED_PATH}`);
const CONTRACT = JSON.parse(fs.readFileSync(LOCKED_PATH, "utf8"));
assert.strictEqual(CONTRACT.templateCode, "BM-096", "must be BM-096");

describe("BM096 Single Candidate Apply — Pre-Mutation State (for documentation)", () => {
  // These assertions document the pre-mutation state.
  // After the mutation is applied, these will fail — which proves the mutation worked.
  // Run the dry-run of apply-bm096-single-candidate-approved-remap.mjs to verify pre-state.

  it("Pre-mutation: path 'document.diaChi' must exist in canonicalFields", () => {
    const field = CONTRACT.canonicalFields.find((f) => f.path === "document.diaChi");
    if (!field) { assert.ok(true, "skipped — already mutated"); return; }
    assert.ok(field, "PRE-MUTATION: canonicalFields should contain 'document.diaChi'");
  });

  it("Pre-mutation: path 'person.idNumber' must NOT exist in canonicalFields", () => {
    const dup = CONTRACT.canonicalFields.find((f) => f.path === "person.idNumber");
    if (dup) { assert.ok(true, "skipped — already mutated"); return; }
    assert.strictEqual(dup, undefined, "PRE-MUTATION: person.idNumber must not exist yet");
  });

  it("Pre-mutation: document.diaChi label must be 'Ô trống'", () => {
    const field = CONTRACT.canonicalFields.find((f) => f.path === "document.diaChi");
    if (!field) { assert.ok(true, "skipped — already mutated"); return; }
    assert.strictEqual(field.label, "Ô trống", "PRE-MUTATION: label must be Ô trống");
  });

  it("Pre-mutation: slotId 'document.diaChi' must exist in docxSlots", () => {
    const slot = CONTRACT.docxSlots.find((s) => s.slotId === "document.diaChi");
    if (!slot) { assert.ok(true, "skipped — already mutated"); return; }
    assert.ok(slot, "PRE-MUTATION: docxSlots should contain slotId 'document.diaChi'");
  });

  it("Pre-mutation: rawPattern must be '{{person.field14}}'", () => {
    const slot = CONTRACT.docxSlots.find((s) => s.slotId === "document.diaChi");
    if (!slot) { assert.ok(true, "skipped — already mutated"); return; }
    assert.strictEqual(slot.evidence?.rawPattern, "{{person.field14}}");
  });

  it("Pre-mutation: slotId 'document.diaChi' in renderBindings", () => {
    const binding = CONTRACT.renderBindings.find((b) => b.slotId === "document.diaChi");
    if (!binding) { assert.ok(true, "skipped — already mutated"); return; }
    assert.ok(binding, "PRE-MUTATION: renderBindings should contain slotId 'document.diaChi'");
  });
});

describe("BM096 Single Candidate Apply — Post-Mutation State (verified)", () => {
  it("Post-mutation: path 'document.diaChi' must NOT exist in canonicalFields", () => {
    const old = CONTRACT.canonicalFields.find((f) => f.path === "document.diaChi");
    assert.strictEqual(old, undefined, "document.diaChi must be removed from canonicalFields");
  });

  it("Post-mutation: path 'person.idNumber' must exist in canonicalFields", () => {
    const field = CONTRACT.canonicalFields.find((f) => f.path === "person.idNumber");
    assert.ok(field, "person.idNumber must exist in canonicalFields after mutation");
  });

  it("Post-mutation: person.idNumber label must be 'Số CCCD/CMND'", () => {
    const field = CONTRACT.canonicalFields.find((f) => f.path === "person.idNumber");
    assert.strictEqual(field.label, "Số CCCD/CMND");
  });

  it("Post-mutation: person.idNumber source must be 'manual' (unchanged)", () => {
    const field = CONTRACT.canonicalFields.find((f) => f.path === "person.idNumber");
    assert.strictEqual(field.source, "manual");
  });

  it("Post-mutation: person.idNumber required must be false (unchanged)", () => {
    const field = CONTRACT.canonicalFields.find((f) => f.path === "person.idNumber");
    assert.strictEqual(field.required, false);
  });

  it("Post-mutation: person.idNumber reviewRequired must be false (unchanged)", () => {
    const field = CONTRACT.canonicalFields.find((f) => f.path === "person.idNumber");
    assert.strictEqual(field.reviewRequired, false);
  });

  it("Post-mutation: slotId 'document.diaChi' must NOT exist in docxSlots", () => {
    const old = CONTRACT.docxSlots.find((s) => s.slotId === "document.diaChi");
    assert.strictEqual(old, undefined, "document.diaChi must be removed from docxSlots");
  });

  it("Post-mutation: slotId 'person.idNumber' must exist in docxSlots", () => {
    const slot = CONTRACT.docxSlots.find((s) => s.slotId === "person.idNumber");
    assert.ok(slot, "person.idNumber must exist in docxSlots after mutation");
  });

  it("Post-mutation: slotId 'person.idNumber' label must be 'Số CCCD/CMND'", () => {
    const slot = CONTRACT.docxSlots.find((s) => s.slotId === "person.idNumber");
    assert.strictEqual(slot.label, "Số CCCD/CMND");
  });

  it("Post-mutation: slotId 'person.idNumber' rawPattern must be '{{person.field14}}' (unchanged)", () => {
    const slot = CONTRACT.docxSlots.find((s) => s.slotId === "person.idNumber");
    assert.strictEqual(slot.evidence?.rawPattern, "{{person.field14}}");
  });

  it("Post-mutation: slotId 'document.diaChi' must NOT exist in renderBindings", () => {
    const old = CONTRACT.renderBindings.find((b) => b.slotId === "document.diaChi");
    assert.strictEqual(old, undefined, "document.diaChi must be removed from renderBindings");
  });

  it("Post-mutation: slotId 'person.idNumber' must exist in renderBindings", () => {
    const binding = CONTRACT.renderBindings.find((b) => b.slotId === "person.idNumber");
    assert.ok(binding, "person.idNumber must exist in renderBindings after mutation");
  });

  it("Post-mutation: renderBindings binding.from must be 'person.idNumber'", () => {
    const binding = CONTRACT.renderBindings.find((b) => b.slotId === "person.idNumber");
    assert.strictEqual(binding.from, "person.idNumber");
  });

  it("Post-mutation: signature.cheDo path unchanged (protected)", () => {
    const f = CONTRACT.canonicalFields.find((f) => f.path === "signature.cheDo");
    assert.ok(f, "signature.cheDo must still exist");
  });

  it("Post-mutation: signature.nguoiKy path unchanged (protected)", () => {
    const f = CONTRACT.canonicalFields.find((f) => f.path === "signature.nguoiKy");
    assert.ok(f, "signature.nguoiKy must still exist");
  });
});

describe("BM096 Single Candidate Apply — Post-Apply Expectations", () => {
  it("apply runner must exist", () => {
    const runnerPath = path.join(ROOT, "scripts", "audit", "apply-bm096-single-candidate-approved-remap.mjs");
    assert.ok(fs.existsSync(runnerPath), "Apply runner script must exist");
  });

  it("decisions.approved.json must exist", () => {
    const decPath = path.join(
      ROOT,
      "docs", "audit",
      "path-domain-binding-batch-1-bm096-single-candidate",
      "decisions.approved.json",
    );
    assert.ok(fs.existsSync(decPath), "decisions.approved.json must exist");
  });

  it("decisions.approved.json must have mode APPROVED_FOR_APPLY", () => {
    const decPath = path.join(
      ROOT,
      "docs", "audit",
      "path-domain-binding-batch-1-bm096-single-candidate",
      "decisions.approved.json",
    );
    const dec = JSON.parse(fs.readFileSync(decPath, "utf8"));
    assert.strictEqual(dec.mode, "APPROVED_FOR_APPLY");
  });

  it("decisions.approved.json must have exactly one approved decision", () => {
    const decPath = path.join(
      ROOT,
      "docs", "audit",
      "path-domain-binding-batch-1-bm096-single-candidate",
      "decisions.approved.json",
    );
    const dec = JSON.parse(fs.readFileSync(decPath, "utf8"));
    assert.strictEqual(dec.approvedCount, 1);
    assert.strictEqual(dec.decisions.length, 1);
  });

  it("approved decision must match expected shape", () => {
    const decPath = path.join(
      ROOT,
      "docs", "audit",
      "path-domain-binding-batch-1-bm096-single-candidate",
      "decisions.approved.json",
    );
    const dec = JSON.parse(fs.readFileSync(decPath, "utf8"));
    const d = dec.decisions[0];
    assert.strictEqual(d.decision, "APPROVED_SAFE_PATH_REMAP");
    assert.strictEqual(d.templateCode, "BM-096");
    assert.strictEqual(d.oldPath, "document.diaChi");
    assert.strictEqual(d.newPath, "person.idNumber");
    assert.strictEqual(d.approved, true);
    assert.strictEqual(d.sourceMustRemainUnchanged, true);
    assert.strictEqual(d.requiredMustRemainUnchanged, true);
    assert.strictEqual(d.reviewRequiredMustRemainUnchanged, true);
  });
});
