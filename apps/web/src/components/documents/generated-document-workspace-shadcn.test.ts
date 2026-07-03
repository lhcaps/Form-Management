import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const documentsDir = fileURLToPath(new URL(".", import.meta.url));

function readDocumentSource(fileName: string) {
  return readFileSync(join(documentsDir, fileName), "utf8");
}

const actionPanel = readDocumentSource("generated-document-action-panel.tsx");
const workspace = readDocumentSource("generated-document-workspace.tsx");
const previewPanel = readDocumentSource("generated-document-preview-panel.tsx");
const auditPanel = readDocumentSource("generated-document-audit-panel.tsx");
const preExportPanel = readDocumentSource("pre-export-customization-panel.tsx");

const generatedWorkspaceSources = [
  actionPanel,
  workspace,
  previewPanel,
  auditPanel,
  preExportPanel,
].join("\n");

describe("generated document workspace shadcn convergence", () => {
  it("uses shadcn primitives for persisted workspace actions and tabs", () => {
    assert.match(actionPanel, /@\/components\/ui\/button/);
    assert.match(preExportPanel, /@\/components\/ui\/button/);
    assert.match(previewPanel, /@\/components\/ui\/button/);
    assert.match(workspace, /@\/components\/ui\/tabs/);
  });

  it("does not keep raw action buttons or inline svg controls in migrated surfaces", () => {
    assert.doesNotMatch(actionPanel, /<button\b/);
    assert.doesNotMatch(preExportPanel, /<button\b/);
    assert.doesNotMatch(previewPanel, /<button\b/);
    assert.doesNotMatch(workspace, /<button\b/);
    assert.doesNotMatch(previewPanel, /<svg\b/);
  });

  it("standardizes generated document status tones with Badge or StatusBadge", () => {
    assert.match(actionPanel, /@\/components\/common\/status-badge/);
    assert.match(auditPanel, /@\/components\/ui\/badge/);
    assert.match(previewPanel, /@\/components\/ui\/badge/);
    assert.doesNotMatch(
      generatedWorkspaceSources,
      /bg-blue-50 text-blue-700|bg-indigo-50 text-indigo-700|bg-amber-50 text-amber-700|bg-emerald-50 text-emerald-700|bg-rose-50 text-rose-700/,
    );
  });

  it("does not introduce runtime template routes or preview sessions into persisted documents", () => {
    assert.doesNotMatch(
      generatedWorkspaceSources,
      /\/templates\/|preview-session|runtime-preview/,
    );
  });
});

describe("PR #9 pre-export form control shadcn convergence", () => {
  it("migrates pre-export raw form controls to shadcn primitives", () => {
    // Imports
    assert.match(preExportPanel, /@\/components\/ui\/input/);
    assert.match(preExportPanel, /@\/components\/ui\/checkbox/);
    assert.match(preExportPanel, /@\/components\/ui\/select/);
    // No raw form controls
    assert.doesNotMatch(preExportPanel, /<input\b/, "pre-export panel must not contain raw <input>");
    assert.doesNotMatch(preExportPanel, /<select\b/, "pre-export panel must not contain raw <select>");
    assert.doesNotMatch(preExportPanel, /<textarea\b/, "pre-export panel must not contain raw <textarea>");
  });

  it("preserves alignment null sentinel so 'Giữ nguyên' keeps mapping to null", () => {
    assert.match(
      preExportPanel,
      /__no_alignment__|toAlignmentSelectValue|fromAlignmentSelectValue/,
      "pre-export panel must keep the alignment null sentinel helpers",
    );
  });

  it("coerces checkbox onCheckedChange to a safe boolean (handles 'indeterminate')", () => {
    // Every Checkbox in the panel must coerce with `checked === true` to avoid
    // string-typed state on 'indeterminate'.
    const onCheckedChangeMatches = preExportPanel.match(/onCheckedChange=/g) ?? [];
    const checkedTrueCoercions = preExportPanel.match(/checked === true/g) ?? [];
    assert.ok(
      onCheckedChangeMatches.length > 0,
      "pre-export panel must have at least one Checkbox",
    );
    assert.equal(
      onCheckedChangeMatches.length,
      checkedTrueCoercions.length,
      "every Checkbox onCheckedChange must coerce with `checked === true`",
    );
  });

  it("does not use dark surface classes on form controls or panels", () => {
    assert.doesNotMatch(preExportPanel, /bg-slate-950/);
    assert.doesNotMatch(preExportPanel, /bg-slate-900/);
    assert.doesNotMatch(preExportPanel, /bg-black/);
    // bg-primary must not be used as a form control/card surface; only Button
    // primary action (variant="default") is allowed and is applied via the
    // Button component, not as a className on raw elements.
    assert.doesNotMatch(
      preExportPanel,
      /className="[^"]*bg-primary[^"]*rounded-lg border/,
    );
  });

  it("preserves all export and rescan API names so the panel still wires to existing handlers", () => {
    assert.match(preExportPanel, /saveGeneratedDocumentPreExportConfig/);
    assert.match(preExportPanel, /renderGeneratedDocumentDocx/);
    assert.match(preExportPanel, /convertGeneratedDocumentPdf/);
    assert.match(preExportPanel, /scanGeneratedDocumentPreExportBlankCandidates/);
    assert.match(preExportPanel, /getGeneratedDocumentPreExportConfig/);
  });
});
