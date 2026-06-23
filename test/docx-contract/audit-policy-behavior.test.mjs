/**
 * test/docx-contract/audit-policy-behavior.test.mjs
 * Tests for audit policy integration in evaluateFormArtifact.
 */

import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import PizZip from "pizzip";

import {
  evaluateFormArtifact,
  isSlotPolicySuppressed,
  getSuppressionNote,
} from "../../scripts/docx-contract/lib/form-corpus-quality.mjs";
import { createPolicyContext } from "../../scripts/docx-contract/lib/audit-policy-loader.mjs";

const ROOT = process.cwd();

// ── isSlotPolicySuppressed ──────────────────────────────────────────────────

test("isSlotPolicySuppressed: null policies returns false", () => {
  assert.strictEqual(isSlotPolicySuppressed(null, "BM-063", "document.fullDocumentCode"), false);
});

test("isSlotPolicySuppressed: null policies returns false (undefined)", () => {
  assert.strictEqual(isSlotPolicySuppressed(undefined, "BM-063", "document.fullDocumentCode"), false);
});

// ── Metadata-only suppression ──────────────────────────────────────────────

test("evaluateFormArtifact: metadata-only field emits ACCEPTED_METADATA_ONLY_FIELD instead of CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", () => {
  const policies = createPolicyContext(ROOT);

  // Build a minimal contract that has a slot but no matching DOCX placeholder
  const docxBuf = makeMinimalDocx([]); // no placeholders at all
  const contract = {
    templateCode: "BM-031",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [{ slotId: "agency.bodyName" }],
    canonicalFields: [{ path: "agency.bodyName" }],
    renderBindings: [{ slotId: "agency.bodyName", from: "agency.bodyName", transform: "identity" }],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf, policies });

  const suppressedIssues = result.issues.filter(
    (i) => i.code === "ACCEPTED_METADATA_ONLY_FIELD",
  );
  const remediationIssues = result.issues.filter(
    (i) => i.code === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER",
  );

  assert.ok(suppressedIssues.length > 0, "ACCEPTED_METADATA_ONLY_FIELD should be emitted");
  assert.strictEqual(remediationIssues.length, 0, "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER should be suppressed");
});

test("evaluateFormArtifact: metadata-only field emits ACCEPTED_METADATA_ONLY_FIELD for BINDING_WITHOUT", () => {
  const policies = createPolicyContext(ROOT);

  const docxBuf = makeMinimalDocx([]);
  const contract = {
    templateCode: "BM-036",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [{ slotId: "document.issueDate" }],
    canonicalFields: [{ path: "document.issueDate" }],
    renderBindings: [{ slotId: "document.issueDate", from: "document.issueDate", transform: "identity" }],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf, policies });

  const suppressedIssues = result.issues.filter(
    (i) => i.code === "ACCEPTED_METADATA_ONLY_FIELD",
  );
  assert.ok(suppressedIssues.length > 0, "ACCEPTED_METADATA_ONLY_FIELD should be emitted for BM-036");
});

// ── Alias satisfied suppression ────────────────────────────────────────────

test("evaluateFormArtifact: alias-satisfied canonical field emits FIELD_SATISFIED_BY_ALIAS", () => {
  const policies = createPolicyContext(ROOT);

  // BM-063: document.fullDocumentCode8 is rendered in DOCX, document.fullDocumentCode is orphaned
  // The slot for document.fullDocumentCode has no DOCX placeholder -> should be suppressed
  const docxBuf = makeMinimalDocx(["document.fullDocumentCode8"]);
  const contract = {
    templateCode: "BM-063",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [
      { slotId: "document.fullDocumentCode" },       // orphaned canonical
      { slotId: "document.fullDocumentCode8" },       // alias target (rendered)
    ],
    canonicalFields: [
      { path: "document.fullDocumentCode" },
      { path: "document.fullDocumentCode8" },
    ],
    renderBindings: [
      { slotId: "document.fullDocumentCode", from: "document.fullDocumentCode", transform: "identity" },
      { slotId: "document.fullDocumentCode8", from: "document.fullDocumentCode8", transform: "identity" },
    ],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf, policies });

  const aliasNotes = result.issues.filter((i) => i.code === "FIELD_SATISFIED_BY_ALIAS");
  const remediationIssues = result.issues.filter(
    (i) =>
      i.code === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER" &&
      i.details.includes("document.fullDocumentCode"),
  );

  assert.ok(aliasNotes.length > 0, "FIELD_SATISFIED_BY_ALIAS should be emitted");
  assert.strictEqual(remediationIssues.length, 0, "document.fullDocumentCode should be suppressed");
});

test("evaluateFormArtifact: alias-satisfied canonical suppresses BINDING_WITHOUT too", () => {
  const policies = createPolicyContext(ROOT);

  const docxBuf = makeMinimalDocx(["document.fullDocumentCode8"]);
  const contract = {
    templateCode: "BM-063",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [
      { slotId: "document.fullDocumentCode" },
      { slotId: "document.fullDocumentCode8" },
    ],
    canonicalFields: [
      { path: "document.fullDocumentCode" },
      { path: "document.fullDocumentCode8" },
    ],
    renderBindings: [
      { slotId: "document.fullDocumentCode", from: "document.fullDocumentCode", transform: "identity" },
      { slotId: "document.fullDocumentCode8", from: "document.fullDocumentCode8", transform: "identity" },
    ],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf, policies });

  const bindingRemediation = result.issues.filter(
    (i) =>
      i.code === "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER" &&
      i.details.includes("document.fullDocumentCode"),
  );
  assert.strictEqual(bindingRemediation.length, 0, "Binding remediation should be suppressed for alias-satisfied");
});

// ── Remove-pending is NOT suppressed ─────────────────────────────────────────

test("evaluateFormArtifact: remove-pending field is NOT suppressed", () => {
  const policies = createPolicyContext(ROOT);

  // BM-067 document.fullDocumentCode2 is remove-pending
  const docxBuf = makeMinimalDocx(["document.fullDocumentCode6"]);
  const contract = {
    templateCode: "BM-067",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [
      { slotId: "document.fullDocumentCode" },      // alias: suppressed
      { slotId: "document.fullDocumentCode2" },     // remove-pending: NOT suppressed
      { slotId: "document.fullDocumentCode6" },     // alias target: rendered
    ],
    canonicalFields: [
      { path: "document.fullDocumentCode" },
      { path: "document.fullDocumentCode2" },
      { path: "document.fullDocumentCode6" },
    ],
    renderBindings: [
      { slotId: "document.fullDocumentCode", from: "document.fullDocumentCode", transform: "identity" },
      { slotId: "document.fullDocumentCode2", from: "document.fullDocumentCode2", transform: "identity" },
      { slotId: "document.fullDocumentCode6", from: "document.fullDocumentCode6", transform: "identity" },
    ],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf, policies });

  const removePendingRemediation = result.issues.filter(
    (i) =>
      i.code === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER" &&
      i.details.includes("document.fullDocumentCode2"),
  );

  assert.ok(removePendingRemediation.length > 0, "remove-pending field should NOT be suppressed");
});

// ── Conflict pending is NOT suppressed ───────────────────────────────────────

test("evaluateFormArtifact: BM-052 fullDocumentCode (conflict-pending) is NOT suppressed", () => {
  const policies = createPolicyContext(ROOT);

  const docxBuf = makeMinimalDocx(["document.fullDocumentCode2"]);
  const contract = {
    templateCode: "BM-052",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [
      { slotId: "document.fullDocumentCode" },     // conflict-pending: NOT suppressed
      { slotId: "document.fullDocumentCode2" },    // remove-pending
    ],
    canonicalFields: [
      { path: "document.fullDocumentCode" },
      { path: "document.fullDocumentCode2" },
    ],
    renderBindings: [
      { slotId: "document.fullDocumentCode", from: "document.fullDocumentCode", transform: "identity" },
      { slotId: "document.fullDocumentCode2", from: "document.fullDocumentCode2", transform: "identity" },
    ],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf, policies });

  const conflictRemediation = result.issues.filter(
    (i) =>
      i.code === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER" &&
      i.details.includes("document.fullDocumentCode"),
  );

  assert.ok(conflictRemediation.length > 0, "conflict-pending alias should NOT be suppressed");
});

// ── No policies: normal behavior ─────────────────────────────────────────────

test("evaluateFormArtifact: without policies, issues are emitted normally", () => {
  // No policies passed
  const docxBuf = makeMinimalDocx([]);
  const contract = {
    templateCode: "BM-031",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [{ slotId: "agency.bodyName" }],
    canonicalFields: [{ path: "agency.bodyName" }],
    renderBindings: [{ slotId: "agency.bodyName", from: "agency.bodyName", transform: "identity" }],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf });

  const remediationIssues = result.issues.filter(
    (i) =>
      i.code === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER" ||
      i.code === "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER",
  );
  // Without policies, issues are emitted normally
  assert.ok(remediationIssues.length > 0, "Issues should be emitted when no policies are active");
});

test("evaluateFormArtifact: unknown field not in policy is NOT suppressed", () => {
  const policies = createPolicyContext(ROOT);

  const docxBuf = makeMinimalDocx([]);
  const contract = {
    templateCode: "BM-063",
    status: "locked",
    schemaVersion: "1.0",
    extractionSource: { sha256: sha256buf(docxBuf), relativePath: "" },
    docxSlots: [{ slotId: "unknown.field" }],
    canonicalFields: [{ path: "unknown.field" }],
    renderBindings: [{ slotId: "unknown.field", from: "unknown.field", transform: "identity" }],
  };

  const result = evaluateFormArtifact({ contract, normalizedDocxBuffer: docxBuf, policies });

  const remediationIssues = result.issues.filter(
    (i) =>
      i.code === "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER" &&
      i.details.includes("unknown.field"),
  );
  assert.ok(remediationIssues.length > 0, "Unknown field should not be suppressed");
});

// ── getSuppressionNote ───────────────────────────────────────────────────

test("getSuppressionNote returns ACCEPTED_METADATA_ONLY_FIELD for metadata-only field", () => {
  const policies = createPolicyContext(ROOT);
  const note = getSuppressionNote(policies, "BM-031", "agency.bodyName", "agency.bodyName");
  assert.strictEqual(note, "ACCEPTED_METADATA_ONLY_FIELD");
});

test("getSuppressionNote returns FIELD_SATISFIED_BY_ALIAS for alias-satisfied field", () => {
  const policies = createPolicyContext(ROOT);
  const note = getSuppressionNote(
    policies,
    "BM-063",
    "document.fullDocumentCode",
    "document.fullDocumentCode",
  );
  assert.strictEqual(note, "FIELD_SATISFIED_BY_ALIAS");
});

test("getSuppressionNote returns null for unknown field", () => {
  const policies = createPolicyContext(ROOT);
  const note = getSuppressionNote(policies, "BM-063", "unknown.field", "unknown.field");
  assert.strictEqual(note, null);
});

test("getSuppressionNote returns null when policies is null", () => {
  assert.strictEqual(getSuppressionNote(null, "BM-031", "agency.bodyName", "agency.bodyName"), null);
});

// ── Helpers ────────────────────────────────────────────────────────────────

function sha256buf(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Creates a minimal DOCX buffer with the given placeholder names.
 * Simpler than building a full DOCX — the quality checker only looks at
 * the extracted mustache patterns.
 */
function makeMinimalDocx(placeholders) {
  const mustacheContent = placeholders.map((p) => "{{" + p + "}}").join(" ");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">",
    "<w:body>",
    "<w:p><w:r><w:t>" + mustacheContent + "</w:t></w:r></w:p>",
    "</w:body>",
    "</w:document>",
  ].join("");

  const zip = new PizZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
