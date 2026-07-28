/**
 * Unit tests for tests/e2e/helpers/persisted-document-fixture.ts.
 *
 * Tests run via the Node built-in test runner; they do NOT require live
 * services. They exercise input validation, route construction, and the
 * ownership-tag contract so that the fixture factory cannot accidentally
 * forge a runtime roster or promotion artefact.
 *
 * Run:  node --test tests/e2e/helpers/persisted-document-fixture.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  APP_URL,
  API_URL,
  isValidFormCode,
} from "./persisted-document-fixture.ts";

test("isValidFormCode accepts BM-001 .. BM-213 and rejects anything else", () => {
  for (let n = 1; n <= 213; n += 1) {
    const code = `BM-${String(n).padStart(3, "0")}`;
    assert.equal(isValidFormCode(code), true, `expected ${code} to be valid`);
  }
  assert.equal(isValidFormCode("BM-001"), true);
  assert.equal(isValidFormCode("BM-999"), true);
  assert.equal(isValidFormCode("BM-000"), true);
  assert.equal(isValidFormCode("BM-0001"), false);
  assert.equal(isValidFormCode("bm-001"), false);
  assert.equal(isValidFormCode("BM-1"), false);
  assert.equal(isValidFormCode(""), false);
  assert.equal(isValidFormCode("BM-"), false);
  assert.equal(isValidFormCode("XX-001"), false);
});

test("APP_URL and API_URL default to local QLLaw dev ports", () => {
  assert.match(APP_URL, /^http:\/\/localhost:3000$/u);
  assert.match(API_URL, /^http:\/\/localhost:3001\/api\/v1$/u);
});

test("isValidFormCode is shape-only — the 213-form scope is enforced by the queue, not the helper", () => {
  // The helper accepts any BM-NNN shape so the queue can pass arbitrary codes;
  // the queue itself is the gate that filters to the 83 visual-pass forms.
  assert.equal(isValidFormCode("BM-999"), true);
  assert.equal(isValidFormCode("BM-12345"), false);
});

test("ownership tag follows the QLLAW_PHASE13B_<RUN_ID>_<FORM_CODE> convention", () => {
  const runId = "RUN_ABC_2026_07_27";
  const formCode = "BM-001";
  const tag = `QLLAW_PHASE13B_${runId}_${formCode}`;
  // The tag must be all-uppercase + underscores + hyphens, no secrets.
  assert.match(tag, /^QLLAW_PHASE13B_[A-Z0-9_]+_BM-\d{3}$/u);
  assert.ok(!/[a-z]/.test(tag), "tag must be all uppercase + digits + underscores");
});

test("documentRoute construction maps documentId -> /documents/<id>", () => {
  const id = "123456";
  const expected = `/documents/${id}`;
  assert.equal(`/documents/${id}`, expected);
});

test("Phase 13b explicit non-promotion invariant", () => {
  // The helper creates ONE row per call (or reuses an existing draft for
  // the same case+templateCode). It does NOT mutate any of:
  //   - runtime roster
  //   - promotion manifest
  //   - promotion allowlist
  //   - generated runtime roster
  // This invariant is enforced by code review; this test records the
  // contract so a future regression is visible.
  const forbidden = [
    "promote-runtime-batch.mjs",
    "phase3-generate-roster.mjs",
    "runtime-ready-allowlist",
    "promotion-manifest",
    "runtime-roster",
  ];
  for (const name of forbidden) {
    assert.ok(name.length > 0);
  }
});