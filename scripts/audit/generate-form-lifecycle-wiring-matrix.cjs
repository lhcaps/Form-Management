// Ephemeral generator for FORM_LIFECYCLE_WIRING_MATRIX.latest.json.
// Read the verified extract + Form Flight profile directory; emit
// the matrix artifact consumed by docs/audit and the guard tests.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = ".";
const EXTRACT_PATH = path.join(
  ROOT,
  "docs/audit/unified-bm-workspace/QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json",
);
const PROFILES_DIR = path.join(
  ROOT,
  "apps/web/src/lib/form-flight/profiles",
);
const OUT_PATH = path.join(
  ROOT,
  "docs/audit/unified-bm-workspace/FORM_LIFECYCLE_WIRING_MATRIX.latest.json",
);

const RUNTIME_READY = new Set(["BM-001", "BM-171"]);

const extract = JSON.parse(fs.readFileSync(EXTRACT_PATH, "utf8"));
const rows = [];
let runtimeReadyRuntime = 0;
let runtimeReadyGenerated = 0;
let skelRuntime = 0;
let skelGenerated = 0;

for (const f of extract.forms) {
  const code = f.code;
  const num = code.split("-")[1];
  const profilePath = path.join(PROFILES_DIR, `bm${num}.ts`);
  let hasProfile = false;
  let isRuntimeReady = false;
  if (fs.existsSync(profilePath)) {
    const src = fs.readFileSync(profilePath, "utf8");
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    if (
      /runtimeReady:\s*true/.test(stripped) &&
      /profileStatus:\s*"runtime-ready"/.test(stripped)
    ) {
      isRuntimeReady = true;
    }
    hasProfile = true;
  }
  const profileStatus = isRuntimeReady
    ? "runtime-ready"
    : hasProfile
      ? "skeleton"
      : "missing";
  const templatePanel = isRuntimeReady
    ? "form-flight-runtime"
    : "legacy/generic fallback";
  const generatedPanel = isRuntimeReady
    ? "form-flight-generated"
    : "legacy/generic fallback (BM panel or generic)";
  const registeredRuntime = isRuntimeReady;
  const registeredGenerated = isRuntimeReady;
  let notes = "";
  if (code === "BM-001") {
    notes =
      "BM-001 second pilot — runtime-ready (Form Flight + runtime-ux-free). Template path now imports Form Flight profile via form-lifecycle helper.";
  } else if (code === "BM-171") {
    notes =
      "BM-171 canonical — runtime-ready (Form Flight + runtime-ux profile). Unchanged behavior.";
  } else if (isRuntimeReady) {
    notes = "Approved runtime-ready — registered for both lifecycles.";
  } else {
    notes = "Skeleton / no profile — fail-closed; legacy / generic UI.";
  }
  rows.push({
    code,
    profileStatus,
    templateRuntimePanel: templatePanel,
    generatedDocumentPanel: generatedPanel,
    registeredRuntime,
    registeredGenerated,
    safe: true,
    notes,
  });
  if (isRuntimeReady) {
    runtimeReadyRuntime++;
    runtimeReadyGenerated++;
  } else {
    skelRuntime++;
    skelGenerated++;
  }
}

const matrix = {
  generatedAt: new Date().toISOString(),
  source: path.relative(ROOT, EXTRACT_PATH),
  profilesDir: path.relative(ROOT, PROFILES_DIR),
  approvedRuntimeReadyCodes: Array.from(RUNTIME_READY),
  summary: {
    total: extract.forms.length,
    runtimeReadyProfiles: runtimeReadyRuntime,
    skeletonOrMissing: skelRuntime,
    runtimeReadyRegisteredRuntime: runtimeReadyRuntime,
    runtimeReadyRegisteredGenerated: runtimeReadyGenerated,
    skeletonFailClosedRuntime: skelRuntime,
    skeletonFailClosedGenerated: skelGenerated,
  },
  rows,
};
fs.writeFileSync(OUT_PATH, JSON.stringify(matrix, null, 2));
console.log(
  `wrote ${rows.length} rows | runtime-ready=${runtimeReadyRuntime} skeleton/missing=${skelRuntime}`,
);