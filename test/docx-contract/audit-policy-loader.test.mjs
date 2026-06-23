/**
 * test/docx-contract/audit-policy-loader.test.mjs
 * Tests for audit-policy-loader.mjs
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  loadAuditPolicies,
  createPolicyContext,
  getAliasForField,
  getAliasesForTemplate,
  isAliasActive,
  isAliasSatisfied,
  isMetadataOnlyField,
  getMetadataOnlyFieldsForTemplate,
  isRemovePending,
  getRemovePendingForTemplate,
  isConflictPending,
} from "../../scripts/docx-contract/lib/audit-policy-loader.mjs";

const ROOT = process.cwd();

// ── loadAuditPolicies ─────────────────────────────────────────────────────────

test("loadAuditPolicies returns three policy objects", () => {
  const p = loadAuditPolicies(ROOT);
  assert.ok(p.aliasPolicy, "has aliasPolicy");
  assert.ok(p.metadataOnlyPolicy, "has metadataOnlyPolicy");
  assert.ok(p.removeRequests, "has removeRequests");
});

test("loadAuditPolicies tolerates missing policy directory", () => {
  const p = loadAuditPolicies("/nonexistent/path");
  assert.ok(Array.isArray(p.aliasPolicy.aliases));
  assert.ok(Array.isArray(p.metadataOnlyPolicy.fields));
  assert.ok(Array.isArray(p.removeRequests.removalRequests));
});

// ── createPolicyContext ───────────────────────────────────────────────────────

test("createPolicyContext returns object with all query methods", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(typeof ctx.isAliasActive, "function");
  assert.strictEqual(typeof ctx.isAliasSatisfied, "function");
  assert.strictEqual(typeof ctx.isMetadataOnlyField, "function");
  assert.strictEqual(typeof ctx.isRemovePending, "function");
  assert.strictEqual(typeof ctx.getAliasForField, "function");
  assert.strictEqual(typeof ctx.isConflictPending, "function");
});

// ── getAliasForField ─────────────────────────────────────────────────────────

test("getAliasForField returns BM-063 alias entry", () => {
  const p = loadAuditPolicies(ROOT);
  const alias = getAliasForField(p, "BM-063", "document.fullDocumentCode");
  assert.ok(alias, "alias found");
  assert.strictEqual(alias.suffixedSlotId, "document.fullDocumentCode8");
  assert.strictEqual(alias.direction, "canonical_aliases_to_suffixed_slot");
});

test("getAliasForField returns null for unknown template/field", () => {
  const p = loadAuditPolicies(ROOT);
  assert.strictEqual(getAliasForField(p, "BM-999", "document.fullDocumentCode"), null);
  assert.strictEqual(getAliasForField(p, "BM-063", "unknown.field"), null);
});

// ── getAliasesForTemplate ────────────────────────────────────────────────────

test("getAliasesForTemplate returns aliases for BM-063", () => {
  const p = loadAuditPolicies(ROOT);
  const aliases = getAliasesForTemplate(p, "BM-063");
  assert.ok(aliases.length >= 1);
  assert.ok(aliases.every((a) => a.templateCode === "BM-063"));
});

// ── isAliasActive ────────────────────────────────────────────────────────────

test("isAliasActive returns true for BM-063 fullDocumentCode (active alias)", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(isAliasActive(ctx, "BM-063", "document.fullDocumentCode"), true);
});

test("isAliasActive returns false for BM-052 fullDocumentCode (conflict-pending)", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(isAliasActive(ctx, "BM-052", "document.fullDocumentCode"), false);
});

test("isAliasActive returns false for unknown field", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(isAliasActive(ctx, "BM-063", "unknown.field"), false);
});

// ── isAliasSatisfied ─────────────────────────────────────────────────────────

test("isAliasSatisfied returns true when alias is active and suffix slot is rendered", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(
    isAliasSatisfied(ctx, "BM-063", "document.fullDocumentCode", ["document.fullDocumentCode8"]),
    true,
  );
});

test("isAliasSatisfied returns false when suffix slot is not rendered", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(
    isAliasSatisfied(ctx, "BM-063", "document.fullDocumentCode", ["other.slot"]),
    false,
  );
});

test("isAliasSatisfied returns false for conflict-pending alias (BM-052)", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(
    isAliasSatisfied(ctx, "BM-052", "document.fullDocumentCode", ["document.fullDocumentCode2"]),
    false,
  );
});

test("isAliasSatisfied returns false when renderedFields is empty array", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(isAliasSatisfied(ctx, "BM-063", "document.fullDocumentCode", []), false);
});

test("isAliasSatisfied returns false for unknown field", () => {
  const ctx = createPolicyContext(ROOT);
  assert.strictEqual(
    isAliasSatisfied(ctx, "BM-063", "unknown.field", ["document.fullDocumentCode8"]),
    false,
  );
});

// ── isMetadataOnlyField ─────────────────────────────────────────────────────

test("isMetadataOnlyField returns entry for BM-031 agency.bodyName", () => {
  const p = loadAuditPolicies(ROOT);
  const entry = isMetadataOnlyField(p, "BM-031", "agency.bodyName");
  assert.ok(entry);
  assert.strictEqual(entry.templateCode, "BM-031");
  assert.strictEqual(entry.field, "agency.bodyName");
});

test("isMetadataOnlyField returns entry for BM-036 document.issueDate", () => {
  const p = loadAuditPolicies(ROOT);
  const entry = isMetadataOnlyField(p, "BM-036", "document.issueDate");
  assert.ok(entry);
  assert.strictEqual(entry.templateCode, "BM-036");
});

test("isMetadataOnlyField returns null for unknown template/field", () => {
  const p = loadAuditPolicies(ROOT);
  assert.strictEqual(isMetadataOnlyField(p, "BM-999", "agency.bodyName"), null);
  assert.strictEqual(isMetadataOnlyField(p, "BM-031", "unknown.field"), null);
});

// ── getMetadataOnlyFieldsForTemplate ───────────────────────────────────────

test("getMetadataOnlyFieldsForTemplate returns entries for BM-031", () => {
  const p = loadAuditPolicies(ROOT);
  const fields = getMetadataOnlyFieldsForTemplate(p, "BM-031");
  assert.ok(fields.length >= 1);
  assert.ok(fields.every((f) => f.templateCode === "BM-031"));
});

// ── isRemovePending ─────────────────────────────────────────────────────────

test("isRemovePending returns entry for BM-067 document.fullDocumentCode2", () => {
  const p = loadAuditPolicies(ROOT);
  const entry = isRemovePending(p, "BM-067", "document.fullDocumentCode2");
  assert.ok(entry);
  assert.strictEqual(entry.templateCode, "BM-067");
  assert.strictEqual(entry.id, "RAR-002");
});

test("isRemovePending returns null for BM-063 (no remove pending)", () => {
  const p = loadAuditPolicies(ROOT);
  assert.strictEqual(isRemovePending(p, "BM-063", "document.fullDocumentCode"), null);
});

test("isRemovePending returns null for unknown template/field", () => {
  const p = loadAuditPolicies(ROOT);
  assert.strictEqual(isRemovePending(p, "BM-999", "document.fullDocumentCode2"), null);
});

// ── getRemovePendingForTemplate ────────────────────────────────────────────

test("getRemovePendingForTemplate returns entries for BM-067", () => {
  const p = loadAuditPolicies(ROOT);
  const entries = getRemovePendingForTemplate(p, "BM-067");
  assert.ok(entries.length >= 1);
  assert.ok(entries.every((r) => r.templateCode === "BM-067"));
});

// ── isConflictPending ──────────────────────────────────────────────────────

test("isConflictPending returns true for BM-052 conflict-pending alias", () => {
  const ctx = createPolicyContext(ROOT);
  const alias = getAliasForField(ctx, "BM-052", "document.fullDocumentCode");
  assert.ok(alias);
  assert.strictEqual(isConflictPending(alias), true);
});

test("isConflictPending returns false for BM-063 active alias", () => {
  const ctx = createPolicyContext(ROOT);
  const alias = getAliasForField(ctx, "BM-063", "document.fullDocumentCode");
  assert.ok(alias);
  assert.strictEqual(isConflictPending(alias), false);
});

test("isConflictPending returns false for null", () => {
  assert.strictEqual(isConflictPending(null), false);
});

test("isConflictPending returns false for undefined", () => {
  assert.strictEqual(isConflictPending(undefined), false);
});

// Policy loader does not mutate input

test("createPolicyContext does not mutate original policy arrays", () => {
  const p = loadAuditPolicies(ROOT);
  const ctx = createPolicyContext(ROOT);
  const before = p.aliasPolicy.aliases.length;
  ctx.isAliasActive(ctx, "BM-063", "document.fullDocumentCode");
  const after = p.aliasPolicy.aliases.length;
  assert.strictEqual(before, after);
});
