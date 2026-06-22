import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

const FILES = {
  "BM-054__71a4c9ac7e0e.contract.locked.json": {
    fieldIdx: 27,
    bindingIdx: 27,
  },
  "BM-139__23306e6022bd.contract.locked.json": {
    fieldIdxs: [3, 4, 5],
    bindingIdxs: [4, 5, 6],
  },
  "BM-159__d95eb7bda8e3.contract.locked.json": {
    fieldIdx: 14,
    bindingIdx: 14,
  },
};

let fixed = 0;

for (const [filename, config] of Object.entries(FILES)) {
  const fp = path.join(LOCKED_DIR, filename);
  if (!fs.existsSync(fp)) { console.log("MISSING: " + filename); continue; }

  const c = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;

  // Fix canonicalFields.type
  if ("fieldIdx" in config) {
    const f = c.canonicalFields?.[config.fieldIdx];
    if (f && f.type === undefined) {
      console.log(`FIX: ${filename} canonicalFields[${config.fieldIdx}].type = "text"`);
      f.type = "text";
      changed = true;
    }
  }
  if ("fieldIdxs" in config) {
    for (const idx of config.fieldIdxs) {
      const f = c.canonicalFields?.[idx];
      if (f && f.type === undefined) {
        console.log(`FIX: ${filename} canonicalFields[${idx}].type = "text"`);
        f.type = "text";
        changed = true;
      }
    }
  }

  // Fix renderBindings.fallback
  if ("bindingIdx" in config) {
    const b = c.renderBindings?.[config.bindingIdx];
    if (b && b.fallback === undefined) {
      console.log(`FIX: ${filename} renderBindings[${config.bindingIdx}].fallback = ""`);
      b.fallback = "";
      changed = true;
    }
  }
  if ("bindingIdxs" in config) {
    for (const idx of config.bindingIdxs) {
      const b = c.renderBindings?.[idx];
      if (b && b.fallback === undefined) {
        console.log(`FIX: ${filename} renderBindings[${idx}].fallback = ""`);
        b.fallback = "";
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(c, null, 2));
    fixed++;
    console.log("  -> Saved\n");
  }
}

console.log("Total fixed: " + fixed);
