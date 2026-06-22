#!/usr/bin/env node
/**
 * Fixes all ellipsis-generated profiles from array format to dict format.
 * DOCX files don't need to be regenerated.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(__dirname, "form-refinement", "profiles");

const files = fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith(".json"));

let fixed = 0, skipped = 0, errors = 0;

for (const file of files) {
  const filePath = path.join(PROFILES_DIR, file);
  const content = fs.readFileSync(filePath, "utf8");
  let profile;
  try {
    profile = JSON.parse(content);
  } catch {
    console.log(`SKIP (parse error): ${file}`);
    errors++;
    continue;
  }

  // Already dict format?
  if (!Array.isArray(profile.fields)) {
    skipped++;
    continue;
  }

  // Convert array to dict
  const fieldsDict = Object.fromEntries(profile.fields.map((f) => [f.path, f]));
  profile.fields = fieldsDict;

  fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
  console.log(`FIXED: ${file} (${profile.fields.length} fields)`);
  fixed++;
}

console.log(`\nFixed: ${fixed}, Skipped (already dict): ${skipped}, Errors: ${errors}`);
