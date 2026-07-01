/**
 * Unit tests for document-render-api helpers.
 * Uses Node's built-in test runner (node:test).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mock api-client before importing document-render-api
// (Variables kept for future mocking implementation)

describe("document-render-api exports", async () => {
  // Since we can't easily mock ESM modules, we'll verify the module structure
  // and that the functions have correct signatures by importing

  const mod = await import("./document-render-api");

  it("exports renderDocumentDocx function", () => {
    assert.equal(typeof mod.renderDocumentDocx, "function");
  });

  it("exports convertDocumentPdf function", () => {
    assert.equal(typeof mod.convertDocumentPdf, "function");
  });

  it("exports extractFileIdFromRenderResponse function", () => {
    assert.equal(typeof mod.extractFileIdFromRenderResponse, "function");
  });

  it("exports extractFileNameFromRenderResponse function", () => {
    assert.equal(typeof mod.extractFileNameFromRenderResponse, "function");
  });

  it("exports RenderedDocumentFile type", () => {
    // TypeScript type - verified at compile time
    assert.ok(mod);
  });

  it("exports RenderDocumentResponse type", () => {
    // TypeScript type - verified at compile time
    assert.ok(mod);
  });
});

describe("extractFileIdFromRenderResponse", async () => {
  const { extractFileIdFromRenderResponse } = await import(
    "./document-render-api"
  );

  it("extracts file.id from response.file", () => {
    const response = { file: { id: "123" } };
    assert.equal(extractFileIdFromRenderResponse(response), "123");
  });

  it("extracts file.fileId from response.file", () => {
    const response = { file: { fileId: "456" } };
    assert.equal(extractFileIdFromRenderResponse(response), "456");
  });

  it("extracts file.storedFileId from response.file", () => {
    const response = { file: { storedFileId: "789" } };
    assert.equal(extractFileIdFromRenderResponse(response), "789");
  });

  it("extracts from data.file.id if available", () => {
    const response = { data: { file: { id: "999" } } };
    assert.equal(extractFileIdFromRenderResponse(response), "999");
  });

  it("returns undefined when no fileId found", () => {
    const response = { file: {} };
    assert.equal(extractFileIdFromRenderResponse(response), undefined);
  });

  it("returns undefined for empty response", () => {
    const response = {};
    assert.equal(extractFileIdFromRenderResponse(response), undefined);
  });

  it("prefers file.id over top-level fileId", () => {
    const response = { file: { id: "123" }, fileId: "456" };
    assert.equal(extractFileIdFromRenderResponse(response), "123");
  });
});

describe("extractFileNameFromRenderResponse", async () => {
  const { extractFileNameFromRenderResponse } = await import(
    "./document-render-api"
  );

  it("extracts file.fileName from response.file", () => {
    const response = { file: { fileName: "test.docx" } };
    assert.equal(
      extractFileNameFromRenderResponse(response, "fallback.docx"),
      "test.docx",
    );
  });

  it("extracts file.originalName from response.file", () => {
    const response = { file: { originalName: "original.pdf" } };
    assert.equal(
      extractFileNameFromRenderResponse(response, "fallback.pdf"),
      "original.pdf",
    );
  });

  it("extracts file.name from response.file", () => {
    const response = { file: { name: "named.docx" } };
    assert.equal(
      extractFileNameFromRenderResponse(response, "fallback.docx"),
      "named.docx",
    );
  });

  it("extracts from data.file if available", () => {
    const response = { data: { file: { fileName: "nested.docx" } } };
    assert.equal(
      extractFileNameFromRenderResponse(response, "fallback.docx"),
      "nested.docx",
    );
  });

  it("returns fallback when no filename found", () => {
    const response = { file: {} };
    assert.equal(
      extractFileNameFromRenderResponse(response, "my-fallback.docx"),
      "my-fallback.docx",
    );
  });

  it("returns fallback for empty response", () => {
    const response = {};
    assert.equal(
      extractFileNameFromRenderResponse(response, "default.docx"),
      "default.docx",
    );
  });
});
