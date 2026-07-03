import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { test } from "node:test";

function documentsDir() {
  const fromApi = resolve(process.cwd(), "..", "web", "src", "components", "documents");
  if (basename(process.cwd()) === "api" && existsSync(fromApi)) {
    return fromApi;
  }
  return resolve(process.cwd(), "apps", "web", "src", "components", "documents");
}

function bmFormFiles() {
  const root = documentsDir();
  return readdirSync(root)
    .filter((file) => /^bm-\d{3}-form-inputs\.tsx$/.test(file))
    .map((file) => join(root, file));
}

function findDuplicatedStickyActionBars() {
  return bmFormFiles()
    .flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return source
        .split(/\r?\n/)
        .flatMap((line, index) => {
          const hasDuplicatedStickyShell =
            line.includes("sticky") &&
            line.includes("bg-white/95") &&
            line.includes("backdrop-blur");
          const hasOverelevatedBlurShell =
            line.includes("shadow-xl") && line.includes("backdrop-blur");

          if (!hasDuplicatedStickyShell && !hasOverelevatedBlurShell) {
            return [];
          }

          return [
            `${basename(file)}:${index + 1}:${line.trim()}`,
          ];
        });
    });
}

test("BM forms use FormActionBar instead of duplicated sticky action shells", () => {
  assert.deepEqual(findDuplicatedStickyActionBars(), []);
});

test("BM-172 special top-sticky action surface uses FormActionBar", () => {
  const source = readFileSync(
    join(documentsDir(), "bm-172-form-inputs.tsx"),
    "utf8",
  );

  assert.match(source, /<FormActionBar[^>]*position="top"/);
  assert.doesNotMatch(source, /sticky top-3[^"]*bg-white\/95[^"]*backdrop-blur/);
});
