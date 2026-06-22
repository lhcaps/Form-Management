import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import PizZip from "pizzip";

import { reconcileLockedContract } from "../../scripts/docx-contract/lib/locked-contract-reconciler.mjs";

function makeDocx(placeholders) {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file("_rels/.rels", "<Relationships/>");
  zip.file(
    "word/document.xml",
    `<w:document><w:body><w:p><w:r><w:t>${placeholders
      .map((value) => `{{${value}}}`)
      .join(" ")}</w:t></w:r></w:p></w:body></w:document>`,
  );
  return zip.generate({ type: "nodebuffer" });
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

test("reconciler updates hash and collapses only exact duplicates", () => {
  const docx = makeDocx(["agency.name"]);
  const contract = {
    status: "locked",
    extractionSource: { sha256: "stale" },
    docxSlots: [
      {
        slotId: "agency.name",
        slotType: "text",
        required: true,
        reviewRequired: false,
      },
      {
        slotId: "agency.name",
        slotType: "text",
        required: true,
        reviewRequired: false,
      },
    ],
    canonicalFields: [
      {
        path: "agency.name",
        source: "agencyConfig",
        reviewRequired: false,
      },
    ],
    renderBindings: [
      {
        slotId: "agency.name",
        from: "agency.name",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
      {
        slotId: "agency.name",
        from: "agency.name",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
      {
        slotId: "document.orphan",
        from: "document.orphan",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
    ],
  };

  const result = reconcileLockedContract(contract, docx);

  assert.equal(result.contract.extractionSource.sha256, sha256(docx));
  assert.equal(result.contract.docxSlots.length, 1);
  assert.equal(result.contract.renderBindings.length, 1);
  assert.deepEqual(result.changes.sort(), [
    "COLLAPSED_EXACT_BINDING_DUPLICATES:1",
    "COLLAPSED_EXACT_SLOT_DUPLICATES:1",
    "REMOVED_ORPHAN_BINDINGS:1",
    "SYNCED_EXTRACTION_HASH",
  ]);
  assert.equal(result.contract.status, "locked");
});

test("reconciler restores a missing identity binding when slot and field paths match", () => {
  const docx = makeDocx(["signature.signerName"]);
  const contract = {
    extractionSource: { sha256: sha256(docx) },
    docxSlots: [
      {
        slotId: "signature.signerName",
        slotType: "text",
        required: true,
        reviewRequired: false,
      },
    ],
    canonicalFields: [
      {
        path: "signature.signerName",
        source: "officialConfig",
        reviewRequired: false,
      },
    ],
    renderBindings: [],
  };

  const result = reconcileLockedContract(contract, docx);

  assert.deepEqual(result.contract.renderBindings, [
    {
      slotId: "signature.signerName",
      from: "signature.signerName",
      transform: "identity",
      fallback: "",
      reviewRequired: false,
    },
  ]);
  assert.deepEqual(result.changes, ["ADDED_IDENTITY_BINDINGS:1"]);
});

test("reconciler fails closed on conflicting duplicates", () => {
  const docx = makeDocx(["agency.name"]);
  const contract = {
    extractionSource: { sha256: sha256(docx) },
    docxSlots: [
      {
        slotId: "agency.name",
        slotType: "text",
        required: true,
        reviewRequired: false,
      },
      {
        slotId: "agency.name",
        slotType: "multilineText",
        required: true,
        reviewRequired: false,
      },
    ],
    canonicalFields: [],
    renderBindings: [],
  };

  assert.throws(
    () => reconcileLockedContract(contract, docx),
    /Conflicting duplicate DOCX slot "agency\.name"/u,
  );
});

test("reconciler rejects an invalid DOCX package", () => {
  assert.throws(
    () =>
      reconcileLockedContract(
        {
          extractionSource: { sha256: "" },
          docxSlots: [],
          canonicalFields: [],
          renderBindings: [],
        },
        Buffer.from("not-a-docx"),
      ),
    /Invalid DOCX package|missing required part/u,
  );
});
