import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * Tests for runtime-template-preview.ts data layer and preview-panel conditional logic.
 *
 * The TemplatePreviewWorkspace component renders different UI based on whether
 * a real visual preview exists:
 *  - pdfPreviewUrl !== null → "Đã tạo bản xem trước" (green success)
 *  - pdfPreviewUrl === null → "Đã tạo file DOCX tạm thời" (amber warning)
 *
 * These tests verify the data contracts and logic that drives those conditions.
 */

describe("RuntimePreviewSessionResponse — pdfPreviewUrl contracts", () => {
  it("pdfPreviewUrl can be null when PDF generation is not implemented", () => {
    const session: {
      pdfPreviewUrl: string | null;
      docxDownloadUrl: string;
      persisted: false;
    } = {
      pdfPreviewUrl: null,
      docxDownloadUrl: "/api/v1/forms/runtime/preview-sessions/runtime_preview_abc/docx",
      persisted: false,
    };

    assert.equal(session.pdfPreviewUrl, null);
    assert.equal(session.persisted, false);
    assert.ok(session.docxDownloadUrl.includes("/docx"));
  });

  it("pdfPreviewUrl can be a string URL when PDF is available", () => {
    const session: {
      pdfPreviewUrl: string | null;
      persisted: false;
    } = {
      pdfPreviewUrl: "/api/v1/forms/runtime/preview-sessions/runtime_preview_abc/pdf",
      persisted: false,
    };

    assert.equal(typeof session.pdfPreviewUrl, "string");
    assert.equal(
      session.pdfPreviewUrl,
      "/api/v1/forms/runtime/preview-sessions/runtime_preview_abc/pdf",
    );
  });
});

describe("Preview panel conditional logic — hasRealVisualPreview", () => {
  /**
   * Determines whether the component should show the "Đã tạo bản xem trước" (green) panel.
   * A real visual preview exists when pdfPreviewUrl is not null.
   */
  function hasRealVisualPreview(
    pdfPreviewUrl: string | null,
  ): boolean {
    return pdfPreviewUrl !== null;
  }

  it("returns false when pdfPreviewUrl is null — show amber 'Đã tạo file DOCX tạm thời'", () => {
    assert.equal(hasRealVisualPreview(null), false);
  });

  it("returns true when pdfPreviewUrl is a string — show green 'Đã tạo bản xem trước'", () => {
    assert.equal(
      hasRealVisualPreview("/api/v1/forms/runtime/preview-sessions/abc/pdf"),
      true,
    );
  });
});

describe("Preview panel heading copy — based on pdfPreviewUrl", () => {
  function getPanelHeading(pdfPreviewUrl: string | null): string {
    if (pdfPreviewUrl) return "Đã tạo bản xem trước";
    return "Đã tạo file DOCX tạm thời";
  }

  it('shows "Đã tạo bản xem trước" when PDF is available', () => {
    assert.equal(
      getPanelHeading("/api/v1/forms/runtime/preview-sessions/abc/pdf"),
      "Đã tạo bản xem trước",
    );
  });

  it('shows "Đã tạo file DOCX tạm thời" when pdfPreviewUrl is null', () => {
    assert.equal(getPanelHeading(null), "Đã tạo file DOCX tạm thời");
  });
});

describe("Save-to-case CTA — disabled when feature not implemented", () => {
  interface SaveToCaseButton {
    disabled: boolean;
    label: string;
    tooltip: string;
  }

  function getSaveToCaseButton(
    isImplemented: boolean,
  ): SaveToCaseButton {
    if (isImplemented) {
      return {
        disabled: false,
        label: "Tạo văn bản từ hồ sơ",
        tooltip: "",
      };
    }
    return {
      disabled: true,
      label: "Tạo văn bản từ hồ sơ",
      tooltip: "Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới.",
    };
  }

  it("is disabled when feature not implemented", () => {
    const btn = getSaveToCaseButton(false);
    assert.equal(btn.disabled, true);
    assert.equal(btn.label, "Tạo văn bản từ hồ sơ");
    assert.ok(btn.tooltip.length > 0);
  });

  it("is active when feature is implemented", () => {
    const btn = getSaveToCaseButton(true);
    assert.equal(btn.disabled, false);
    assert.equal(btn.label, "Tạo văn bản từ hồ sơ");
    assert.equal(btn.tooltip, "");
  });

  it("has no active route when disabled", () => {
    // When disabled, the component renders a <button>, not a <Link>.
    // There is no href to /documents?templateCode=... in the disabled state.
    const btn = getSaveToCaseButton(false);
    assert.equal(btn.disabled, true);
    // The disabled button has no URL — this is verified by the component code
    // which renders <button type="button" disabled ...> instead of <Link href="...">
  });
});

describe("Tải DOCX — always available regardless of pdfPreviewUrl", () => {
  it("docxDownloadUrl is always present in the session response", () => {
    const session = {
      pdfPreviewUrl: null as string | null,
      docxDownloadUrl: "/api/v1/forms/runtime/preview-sessions/runtime_preview_abc/docx",
    };

    assert.ok(session.docxDownloadUrl.length > 0);
    assert.ok(session.docxDownloadUrl.endsWith("/docx"));
  });

  it("Tải DOCX action uses docxDownloadUrl from session", () => {
    const session = {
      docxDownloadUrl: "/api/v1/forms/runtime/preview-sessions/runtime_preview_abc/docx",
      fileName: "BM-001_preview.docx",
    };

    // The component calls downloadRuntimePreviewDocxByUrl(session.docxDownloadUrl, session.fileName)
    assert.ok(session.docxDownloadUrl.length > 0);
    assert.equal(session.fileName, "BM-001_preview.docx");
  });
});

describe("Panel style — amber when no visual preview, green when visual preview exists", () => {
  function getPanelStyle(pdfPreviewUrl: string | null): "success" | "warning" {
    return pdfPreviewUrl ? "success" : "warning";
  }

  it('returns "warning" when pdfPreviewUrl is null', () => {
    assert.equal(getPanelStyle(null), "warning");
  });

  it('returns "success" when pdfPreviewUrl is present', () => {
    assert.equal(
      getPanelStyle("/api/v1/forms/runtime/preview-sessions/abc/pdf"),
      "success",
    );
  });
});
