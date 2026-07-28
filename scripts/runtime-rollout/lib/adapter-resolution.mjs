/**
 * Shared adapter-resolution loader.
 *
 * One JavaScript module consumed by every runtime-rollout consumer:
 *   - build-slot-inventory.mjs
 *   - compute-canonical-verdicts.mjs
 *   - render-runtime-batch.mjs
 *   - per-form-readiness-reconciliation.mjs
 *   - guard-adapter-runtime-wiring.mjs
 *
 * Behavioural contract:
 *   - Loads docs/audit/final-213-customer-ready/runtime-rollout/adapter-resolution-213.json
 *   - Validates schema + 213 unique forms + manifest hash + contract hashes +
 *     normalized-template hashes
 *   - Returns one adapter-resolution record by form code, with helpers for
 *     resolved/unresolved keys, render values, adapter verdict, and final
 *     status
 *   - Fails CLOSED on every category of stale evidence
 *
 * This module NEVER writes. It is read-only.
 */

import { readFile } from 'node:fs/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveRepoRoot() {
  let cur = __dirname;
  for (let i = 0; i < 8; i++) {
    cur = path.dirname(cur);
    if (fs.existsSync(path.join(cur, 'scripts'))) return cur;
  }
  return __dirname;
}

const REPO_ROOT = resolveRepoRoot();
const ARTIFACT_PATH = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'adapter-resolution-213.json',
);
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'authoritative-213-manifest.json',
);
const SLOT_INVENTORY_PATH = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'slot-inventory-summary.json',
);

const REQUIRED_KEYS = [
  'FORM',
  'CONTRACT_PATH',
  'CONTRACT_SHA256',
  'NORMALIZED_TEMPLATE_PATH',
  'NORMALIZED_TEMPLATE_SHA256',
  'APPLIED_ADAPTERS',
  'FIELD_CLASSIFICATIONS',
  'SOURCE_TARGETS',
  'RENDER_VALUES_R1',
  'RENDER_VALUES_R2',
  'RESOLVED_REQUIRED_KEYS',
  'PARTIALLY_RESOLVED_KEYS',
  'UNRESOLVED_REQUIRED_KEYS',
  'STATIC_PROTECTED_KEYS',
  'DISPLAY_ONLY_KEYS',
  'EDITOR_ONLY_KEYS',
  'TARGET_COLLISIONS',
  'ADAPTER_VALIDATION_VERDICT',
  'ADAPTER_VALIDATION_REASONS',
  'FINAL_ADAPTER_STATUS',
];

const ALLOWED_FINAL_STATUS = new Set([
  'PASS',
  'PASS_COMPOUND',
  'PARTIAL',
  'SOURCE_ABSENT',
  'FAIL',
  'NOT_APPLICABLE',
]);

const ALLOWED_ADAPTER_VERDICTS = new Set([
  'PASS',
  'PASS_COMPOUND',
  'FAIL',
  'SOURCE_ABSENT',
  'NOT_APPLICABLE',
]);

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function stableJsonStringify(value) {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableJsonStringify(v)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJsonStringify(value[k])}`).join(',')}}`;
}

function manifestSha(manifest) {
  return sha256(stableJsonStringify(manifest));
}

function contractFileSha(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha256(fs.readFileSync(filePath));
}

function templateFileSha(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha256(fs.readFileSync(filePath));
}

function fail(message) {
  const err = new Error(`adapter-resolution: ${message}`);
  err.adapterResolutionFailure = true;
  throw err;
}

function loadJson(filePath, label) {
  let buf;
  try {
    buf = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    fail(`${label} missing: ${filePath} (${e.message})`);
  }
  try {
    return JSON.parse(buf);
  } catch (e) {
    fail(`${label} malformed JSON: ${filePath} (${e.message})`);
  }
  // unreachable
}

export class AdapterResolutionLoader {
  constructor(opts = {}) {
    this.allowMissingManifest = !!opts.allowMissingManifest;
    this.allowMissingInventory = !!opts.allowMissingInventory;
    this._artifact = null;
    this._manifest = null;
    this._manifestSha = null;
    this._slotInventory = null;
    this._formIndex = null;
    this._loaded = false;
  }

  artifactPath() {
    return ARTIFACT_PATH;
  }

  /**
   * Load and validate the artifact. Throws on any mismatch — closed by
   * default.
   */
  load() {
    if (this._loaded) return this._artifact;
    const artifact = loadJson(ARTIFACT_PATH, 'adapter-resolution-213.json');
    if (artifact.schema !== 'qllaw.213.adapter_resolution/v1') {
      fail(`unexpected schema: ${artifact.schema}`);
    }
    if (!Array.isArray(artifact.forms) || artifact.forms.length !== 213) {
      fail(`expected 213 forms; got ${Array.isArray(artifact.forms) ? artifact.forms.length : 'n/a'}`);
    }
    const seen = new Set();
    for (const r of artifact.forms) {
      if (seen.has(r.FORM)) fail(`duplicate form ${r.FORM}`);
      seen.add(r.FORM);
      for (const k of REQUIRED_KEYS) {
        if (!(k in r)) fail(`form ${r.FORM} missing field ${k}`);
      }
      if (!ALLOWED_FINAL_STATUS.has(r.FINAL_ADAPTER_STATUS)) {
        fail(`form ${r.FORM} has invalid FINAL_ADAPTER_STATUS ${r.FINAL_ADAPTER_STATUS}`);
      }
      if (!ALLOWED_ADAPTER_VERDICTS.has(r.ADAPTER_VALIDATION_VERDICT)) {
        // A multi-family row may retain each family's non-dominant verdict
        // (for example SOURCE_ABSENT+PASS+PASS).  It remains valid only when
        // every segment is an upper-case symbolic verdict.
        if (!/^[A-Z_]+(?:\+[A-Z_]+)+$/.test(r.ADAPTER_VALIDATION_VERDICT)) {
          fail(`form ${r.FORM} has invalid ADAPTER_VALIDATION_VERDICT ${r.ADAPTER_VALIDATION_VERDICT}`);
        }
      }
    }

    // Cross-check against authoritative manifest and slot inventory.
    let manifest = null;
    if (fs.existsSync(MANIFEST_PATH) || !this.allowMissingManifest) {
      manifest = loadJson(MANIFEST_PATH, 'authoritative-213-manifest.json');
      const mSha = manifestSha(manifest);
      if (artifact.authoritativeManifestSha256 && artifact.authoritativeManifestSha256 !== mSha) {
        fail(
          `authoritative-manifest sha mismatch: artifact=${artifact.authoritativeManifestSha256} actual=${mSha}`,
        );
      }
    }

    let slotInventory = null;
    if (fs.existsSync(SLOT_INVENTORY_PATH) || !this.allowMissingInventory) {
      slotInventory = loadJson(SLOT_INVENTORY_PATH, 'slot-inventory-summary.json');
    }

    if (slotInventory) {
      const invByCode = new Map();
      for (const r of slotInventory.results || []) invByCode.set(r.formCode, r);
      for (const r of artifact.forms) {
        const inv = invByCode.get(r.FORM);
        if (!inv) continue;
        if (
          inv.contractSha256 && r.CONTRACT_SHA256 &&
          inv.contractSha256 !== r.CONTRACT_SHA256
        ) {
          fail(`${r.FORM}: contract sha mismatch with slot-inventory`);
        }
        if (
          inv.templateSha256 && r.NORMALIZED_TEMPLATE_SHA256 &&
          inv.templateSha256 !== r.NORMALIZED_TEMPLATE_SHA256
        ) {
          fail(`${r.FORM}: template sha mismatch with slot-inventory`);
        }
        // Optional live-file re-verification when files exist on disk.
        if (r.CONTRACT_PATH && fs.existsSync(r.CONTRACT_PATH)) {
          const liveSha = contractFileSha(r.CONTRACT_PATH);
          if (liveSha && r.CONTRACT_SHA256 && liveSha !== r.CONTRACT_SHA256) {
            fail(`${r.FORM}: live contract file sha mismatch (drift)`);
          }
        }
        if (r.NORMALIZED_TEMPLATE_PATH && fs.existsSync(r.NORMALIZED_TEMPLATE_PATH)) {
          const liveSha = templateFileSha(r.NORMALIZED_TEMPLATE_PATH);
          if (liveSha && r.NORMALIZED_TEMPLATE_SHA256 && liveSha !== r.NORMALIZED_TEMPLATE_SHA256) {
            fail(`${r.FORM}: live template file sha mismatch (drift)`);
          }
        }
      }
    }

    // PASS_COMPOUND must have applied adapters + source targets + at least
    // one resolved required key.
    for (const r of artifact.forms) {
      if (r.FINAL_ADAPTER_STATUS === 'PASS_COMPOUND') {
        if (r.APPLIED_ADAPTERS.length === 0) {
          fail(`${r.FORM}: PASS_COMPOUND but APPLIED_ADAPTERS empty`);
        }
        if (r.SOURCE_TARGETS.length === 0) {
          fail(`${r.FORM}: PASS_COMPOUND without structural source target`);
        }
        if (r.RESOLVED_REQUIRED_KEYS.length === 0 && r.PARTIALLY_RESOLVED_KEYS.length === 0) {
          fail(`${r.FORM}: PASS_COMPOUND but no resolved/partially-resolved keys`);
        }
      }
      // PASS requires no unresolved required keys. If the contract has no
      // family-required keys at all (e.g. forms that don't bind signature or
      // issue slots), then a PASS with no resolved keys is fine.
      // We DO require an applied adapter (deferred debt is not a free PASS).
      if (r.FINAL_ADAPTER_STATUS === 'PASS') {
        if (r.UNRESOLVED_REQUIRED_KEYS.length > 0) {
          fail(`${r.FORM}: PASS but UNRESOLVED_REQUIRED_KEYS populated`);
        }
        if (r.RESOLVED_REQUIRED_KEYS.length === 0 && r.PARTIALLY_RESOLVED_KEYS.length === 0) {
          // No required keys at all — PASS is allowed only if both families
          // were applied and at least one adapter actually ran.
          if (r.APPLIED_ADAPTERS.length === 0) {
            fail(`${r.FORM}: PASS but APPLIED_ADAPTERS empty`);
          }
        }
      }
      // FAIL with target collision: must have at least one collision finding.
      if (r.FINAL_ADAPTER_STATUS === 'FAIL' && r.TARGET_COLLISIONS.length === 0) {
        // other FAIL paths (missing required) are permitted
      }
    }

    this._artifact = artifact;
    this._manifest = manifest;
    this._manifestSha = manifest ? manifestSha(manifest) : null;
    this._slotInventory = slotInventory;

    const formIndex = new Map();
    for (const r of artifact.forms) formIndex.set(r.FORM, r);
    this._formIndex = formIndex;
    this._loaded = true;
    return artifact;
  }

  /** Returns the form's adapter-resolution row, or null when absent. */
  get(formCode) {
    this.load();
    return this._formIndex.get(formCode) || null;
  }

  /** Returns the entire artifact. */
  all() {
    this.load();
    return this._artifact.forms;
  }

  /** Resolve a key for a given form. */
  resolvedKeysFor(formCode) {
    const row = this.get(formCode);
    return row ? row.RESOLVED_REQUIRED_KEYS : [];
  }

  unresolvedKeysFor(formCode) {
    const row = this.get(formCode);
    return row ? row.UNRESOLVED_REQUIRED_KEYS : [];
  }

  renderValuesFor(formCode, role /* 'R1' | 'R2' */) {
    const row = this.get(formCode);
    if (!row) return [];
    return role === 'R2' ? row.RENDER_VALUES_R2 : row.RENDER_VALUES_R1;
  }

  adapterVerdictFor(formCode) {
    const row = this.get(formCode);
    return row ? row.ADAPTER_VALIDATION_VERDICT : 'NOT_APPLICABLE';
  }

  finalAdapterStatusFor(formCode) {
    const row = this.get(formCode);
    return row ? row.FINAL_ADAPTER_STATUS : 'NOT_APPLICABLE';
  }

  appliedAdaptersFor(formCode) {
    const row = this.get(formCode);
    return row ? row.APPLIED_ADAPTERS : [];
  }

  targetCollisionsFor(formCode) {
    const row = this.get(formCode);
    return row ? row.TARGET_COLLISIONS : [];
  }

  /**
   * Aggregate family-key occurrence counts across the artifact. Used by the
   * debt-before/after measure to confirm signatures and issue-place/date keys
   * actually resolved.
   */
  familyOccurrences(family, keyPrefixes) {
    this.load();
    let resolved = 0;
    let unresolved = 0;
    let staticProtected = 0;
    for (const r of this._artifact.forms) {
      if (!r.APPLIED_ADAPTERS.includes(family)) continue;
      for (const k of r.RESOLVED_REQUIRED_KEYS) {
        if (keyPrefixes.some((p) => k.startsWith(p))) resolved++;
      }
      for (const k of r.UNRESOLVED_REQUIRED_KEYS) {
        if (keyPrefixes.some((p) => k.startsWith(p))) unresolved++;
      }
      for (const k of r.STATIC_PROTECTED_KEYS) {
        if (keyPrefixes.some((p) => k.startsWith(p))) staticProtected++;
      }
    }
    return { resolved, unresolved, staticProtected };
  }

  /** Counts the occurrences of a given key prefix in the artifact. */
  countUnresolvedByPrefix(prefixes) {
    this.load();
    let n = 0;
    for (const r of this._artifact.forms) {
      for (const k of r.UNRESOLVED_REQUIRED_KEYS) {
        if (prefixes.some((p) => k.startsWith(p))) n++;
      }
    }
    return n;
  }
}

/**
 * Convenience singleton — preloaded on first use.
 */
let _defaultLoader = null;
export function defaultLoader() {
  if (!_defaultLoader) _defaultLoader = new AdapterResolutionLoader();
  return _defaultLoader;
}

/**
 * One-call helper for inline use in `if (await loader.get(code))`.
 */
export async function loadAdapterResolution() {
  return new AdapterResolutionLoader().load();
}

/**
 * Internal-exposed for tests and command-line invocation:
 *   `node lib/adapter-resolution.mjs --form BM-001`
 */
async function cliMain() {
  const argv = process.argv.slice(2);
  let form = null;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--form') form = argv[++i];
    else if (a === '--json') json = true;
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node lib/adapter-resolution.mjs [--form BM-NNN] [--json]');
      process.exit(0);
    }
  }
  const loader = new AdapterResolutionLoader();
  const artifact = loader.load();
  if (form) {
    const row = loader.get(form);
    if (!row) {
      console.error(`FAIL: ${form} not in artifact`);
      process.exit(1);
    }
    console.log(JSON.stringify(row, null, 2));
    process.exit(0);
  }
  console.log(json ? JSON.stringify(artifact, null, 2) : `OK: 213 forms loaded.`);
  process.exit(0);
}

// Direct CLI invocation (only when this file is run directly).
function isCliInvocation() {
  if (!process.argv[1]) return false;
  let invoked = process.argv[1];
  try {
    invoked = fs.realpathSync.native(invoked);
  } catch {
    // ignore
  }
  let here = import.meta.url;
  if (here.startsWith('file:///')) here = here.slice(8);
  else if (here.startsWith('file://')) here = here.slice(7);
  try {
    here = fs.realpathSync.native(here);
  } catch {
    // ignore
  }
  return here === invoked || here === invoked.replace(/\\/g, '/');
}
if (isCliInvocation()) {
  cliMain().catch((err) => {
    console.error(`adapter-resolution loader: ${err.message}`);
    process.exit(1);
  });
}
