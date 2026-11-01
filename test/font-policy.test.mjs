import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { inspectFont, verifyFontDirectory } from "../scripts/fonts/ttf-inspector.mjs";

const ROOT = process.cwd().replace(/\\/g, "/");
const WINDOWS_ONLY = process.platform !== "win32";

describe("Phase 8C TTF inspector", () => {
  const windowsTnrDir = "C:/Windows/Fonts";

  it("detects exact Times New Roman family and all four styles on Windows", { skip: WINDOWS_ONLY }, () => {
    const report = verifyFontDirectory({
      fontDir: windowsTnrDir,
      requiredFamily: "Times New Roman",
      allowFallback: false,
    });

    assert.equal(report.aggregate, "EXACT_REQUIRED_FONT_PASS");
    assert.deepEqual(
      report.presentStyles.sort(),
      ["Bold", "Bold Italic", "Italic", "Regular"].sort(),
    );
    assert.equal(report.missingStyles.length, 0);
    const regular = report.perFont.find((p) => p.subfamily === "Regular");
    assert.ok(regular);
    assert.equal(regular.status, "EXACT_REQUIRED_FONT_PASS");
    assert.equal(regular.postscriptName, "TimesNewRomanPSMT");
  });

  it("classifies Liberation Serif aliases as ALIAS_ONLY under required policy", { skip: WINDOWS_ONLY }, () => {
    const tmpDir = join(tmpdir(), "qllaw-font-" + Date.now());
    mkdirSync(tmpDir, { recursive: true });
    try {
      for (const [src, dst] of [
        ["C:/Windows/Fonts/LiberationSerif-Regular.ttf", "times.ttf"],
        ["C:/Windows/Fonts/LiberationSerif-Bold.ttf", "timesbd.ttf"],
        ["C:/Windows/Fonts/LiberationSerif-Italic.ttf", "timesi.ttf"],
        [
          "C:/Windows/Fonts/LiberationSerif-BoldItalic.ttf",
          "timesbi.ttf",
        ],
      ]) {
        writeFileSync(join(tmpDir, dst), readFileSync(src));
      }

      const report = verifyFontDirectory({
        fontDir: tmpDir,
        requiredFamily: "Times New Roman",
        allowFallback: false,
      });

      assert.equal(report.aggregate, "EXACT_REQUIRED_FONT_MISSING");
      assert.ok(report.perFont.every((p) => p.status === "ALIAS_ONLY"));
      const regular = report.perFont.find((p) => p.subfamily === "Regular");
      assert.ok(regular);
      assert.equal(regular.family, "Liberation Serif");
    } finally {
      try {
        const { rmSync } = require("node:fs");
        rmSync(tmpDir, { recursive: true });
      } catch {}
    }
  });

  it("returns STYLE_INCOMPLETE when only three of the four required styles are present", { skip: WINDOWS_ONLY }, () => {
    const tmpDir = join(tmpdir(), "qllaw-font-" + Date.now());
    mkdirSync(tmpDir, { recursive: true });
    try {
      for (const [src, dst] of [
        ["C:/Windows/Fonts/times.ttf", "times.ttf"],
        ["C:/Windows/Fonts/timesbd.ttf", "timesbd.ttf"],
        ["C:/Windows/Fonts/timesi.ttf", "timesi.ttf"],
      ]) {
        writeFileSync(join(tmpDir, dst), readFileSync(src));
      }

      const report = verifyFontDirectory({
        fontDir: tmpDir,
        requiredFamily: "Times New Roman",
        allowFallback: false,
      });

      assert.equal(report.aggregate, "STYLE_INCOMPLETE");
      assert.ok(report.missingStyles.includes("Bold Italic"));
      assert.ok(
        report.perFont.some((p) => p.status === "EXACT_REQUIRED_FONT_PASS"),
      );
    } finally {
      try {
        const { rmSync } = require("node:fs");
        rmSync(tmpDir, { recursive: true });
      } catch {}
    }
  });

  it("honours fallback-allowed mode instead of failing on missing exact family", { skip: WINDOWS_ONLY }, () => {
    const tmpDir = join(tmpdir(), "qllaw-font-" + Date.now());
    mkdirSync(tmpDir, { recursive: true });
    try {
      for (const [src, dst] of [
        ["C:/Windows/Fonts/LiberationSerif-Regular.ttf", "times.ttf"],
        ["C:/Windows/Fonts/LiberationSerif-Bold.ttf", "timesbd.ttf"],
        ["C:/Windows/Fonts/LiberationSerif-Italic.ttf", "timesi.ttf"],
        [
          "C:/Windows/Fonts/LiberationSerif-BoldItalic.ttf",
          "timesbi.ttf",
        ],
      ]) {
        writeFileSync(join(tmpDir, dst), readFileSync(src));
      }

      const report = verifyFontDirectory({
        fontDir: tmpDir,
        requiredFamily: "Times New Roman",
        allowFallback: true,
      });

      assert.equal(report.aggregate, "FALLBACK_ALLOWED");
      assert.ok(report.perFont.every((p) => p.status === "FALLBACK_ALLOWED"));
    } finally {
      try {
        const { rmSync } = require("node:fs");
        rmSync(tmpDir, { recursive: true });
      } catch {}
    }
  });

  it("fails closed when the font directory contains no matching TTF filenames", () => {
    const tmpDir = join(tmpdir(), "qllaw-font-" + Date.now());
    mkdirSync(tmpDir, { recursive: true });
    try {
      const report = verifyFontDirectory({
        fontDir: tmpDir,
        requiredFamily: "Times New Roman",
        allowFallback: false,
      });

      assert.equal(report.aggregate, "EXACT_REQUIRED_FONT_MISSING");
      assert.equal(report.perFont.length, 4);
      assert.ok(report.perFont.every((p) => p.status === "EXACT_REQUIRED_FONT_MISSING"));
    } finally {
      try {
        const { rmSync } = require("node:fs");
        rmSync(tmpDir, { recursive: true });
      } catch {}
    }
  });
});

describe("Phase 8C font binary leak guard", () => {
  const windowsTnrDir = "C:/Windows/Fonts";

  it("does not embed font binary content in the verification output", { skip: WINDOWS_ONLY }, () => {
    const report = verifyFontDirectory({
      fontDir: windowsTnrDir,
      requiredFamily: "Times New Roman",
      allowFallback: false,
    });

    const serialized = JSON.stringify(report);
    assert.ok(!serialized.includes("GDI\x00"), "serialized report contains embedded GDI table");
    assert.ok(!serialized.includes("LTSH"), "serialized report contains embedded LTSH table");
    for (const entry of report.perFont) {
      assert.equal(typeof entry.size, "number", "size must be numeric, not raw bytes");
    }
  });
});
