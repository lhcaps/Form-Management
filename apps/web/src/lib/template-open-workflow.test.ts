import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTemplateOpenPath,
  getCaseBoundTemplateOpenTarget,
  getPrimaryTemplateOpenTarget,
  isTemplateOpenable,
} from "./template-open-workflow";

test("primary template open uses a template preview route without requiring a case", () => {
  const target = getPrimaryTemplateOpenTarget({
    templateCode: "BM-001",
    dbTemplateId: "template-1",
    hasRuntimeContract: true,
    directDocumentId: null,
  });

  assert.deepEqual(target, {
    kind: "template-preview",
    href: "/templates/BM-001",
  });
});

test("primary template open never points at the removed standalone document endpoint", () => {
  const target = getPrimaryTemplateOpenTarget({
    templateCode: "BM-050",
    dbTemplateId: "template-50",
    hasRuntimeContract: true,
    directDocumentId: null,
  });

  assert.equal(target.kind, "template-preview");
  assert.equal("href" in target && target.href.includes("/documents/standalone"), false);
});

test("case-bound document creation is only returned for the explicit case action", () => {
  assert.deepEqual(
    getCaseBoundTemplateOpenTarget({
      templateCode: "BM-050",
      dbTemplateId: "template-50",
      currentCaseId: null,
    }),
    { kind: "case-picker" },
  );

  assert.deepEqual(
    getCaseBoundTemplateOpenTarget({
      templateCode: "BM-050",
      dbTemplateId: "template-50",
      currentCaseId: "case-1",
    }),
    {
      kind: "case-document",
      caseId: "case-1",
      dbTemplateId: "template-50",
    },
  );
});

test("template preview paths are validated and encoded", () => {
  assert.equal(buildTemplateOpenPath("BM-050"), "/templates/BM-050");
  assert.throws(() => buildTemplateOpenPath("not-a-template"), /Invalid template code/);
});

test("runtime contracts make templates openable even without DB document creation", () => {
  assert.equal(
    isTemplateOpenable({
      dbTemplateId: null,
      hasRuntimeContract: true,
      directDocumentId: null,
    }),
    true,
  );
});
