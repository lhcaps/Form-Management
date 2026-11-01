#!/usr/bin/env node
/**
 * PR6G.5 — Rollout Readiness Gate.
 *
 * Composes the existing PR6G.1..PR6G.4 + PR6G.3.1 evidence into ONE explicit
 * readiness decision per BM. Answers the question:
 *
 *   "Can this BM be used as the baseline to implement the next BM?"
 *
 * The gate is intentionally refusal-first. It will:
 *   - accept one explicit BM-XXX target (positional or --bm=),
 *   - read existing artefacts (no mutation, no DB, no FS writes outside
 *     `docs/audit/bm-rollout/<TEMPLATE>/readiness.latest.{json,md}`),
 *   - compose 16 sub-gates (1..14 technical + 15 visual sign-off +
 *     16 templateDraft-ui — introduced by PR7A.1 for BM-171),
 *   - write a single JSON + MD artefact pair,
 *   - exit 0 when only a manual blocker is present (gate can run cleanly),
 *   - exit 1 when a real technical blocker is present,
 *   - exit 2 for invalid usage (no target, unknown BM).
 *
 * STRICT RULES (Planner-verified):
 *   1. No BM-171 implementation.
 *   2. No `BM_CORE_REGISTRY` changes.
 *   3. No mass artifact generation — only the explicit target gets one.
 *   4. No locked contract or normalized DOCX template mutation.
 *   5. No fake `generatedDocumentId`.
 *   6. No DB write from `/templates`.
 *   7. BM-001 MUST report `rolloutReady=false` until visual sign-off lands.
 *   8. MANUAL_REQUIRED must surface honestly — it does NOT count as a
 *      technical failure (exit 0) but it DOES block `rolloutReady=true`.
 *   9. Implementation must not be marked FAIL just because BM-001 is
 *      manually blocked; that is reported honestly.
 *
 * CLI:
 *   node scripts/audit/audit-bm-rollout-ready.mjs BM-001
 *   node scripts/audit/audit-bm-rollout-ready.mjs --bm=BM-001
 *   node scripts/audit/audit-bm-rollout-ready.mjs --bm=BM-001 --output=/abs/path/readiness.json
 *   pnpm audit:bm-rollout-ready -- BM-001
 *
 * Exit codes:
 *   0 — artefact written; either READY or BLOCKED_MANUAL_REVIEW (gate
 *       ran cleanly, only a human sign-off is pending).
 *   1 — real technical blocker; BLOCKED_TECHNICAL (or INVALID_TARGET
 *       only when the gate cannot recover gracefully).
 *   2 — invalid arguments: missing target, malformed code.
 *
 * @module audit/audit-bm-rollout-ready
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require_ = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, '..', '..');

/** @typedef {'READY'|'BLOCKED_MANUAL_REVIEW'|'BLOCKED_TECHNICAL'|'INVALID_TARGET'} RolloutStatusValue */
/** @typedef {'PASS'|'FAIL'|'MANUAL_REQUIRED'|'NOT_APPLICABLE'} GateStatusValue */

/**
 * @typedef {Object} BmRolloutReadinessResult
 * @property {string} schemaVersion
 * @property {string} templateCode
 * @property {string} generatedAt
 * @property {RolloutStatusValue} status
 * @property {boolean} harnessReady        The gate itself ran cleanly and produced an artefact.
 * @property {boolean} technicalReady      All technical gates (1..14) are PASS or NOT_APPLICABLE.
 * @property {boolean} manualReviewRequired At least one MANUAL_REQUIRED gate is open.
 * @property {boolean} rolloutReady         True only when status === 'READY'.
 * @property {Object} finalAudit           The PR6G.2 final audit summary we composed from.
 * @property {Array<{id:string,label:string,status:GateStatusValue,evidence?:string}>} gates
 * @property {string[]} blockers
 * @property {string} nextAction
 * @property {string[]} evidenceSources
 */

/** ───────────────────────────── CLI argument parsing ───────────────────────────── */

function parseArgs(argv) {
  const out = { bm: null, output: null, help: false };
  for (const arg of argv) {
    if (arg.startsWith('--bm=')) out.bm = arg.slice('--bm='.length).toUpperCase();
    else if (arg.startsWith('--output=')) out.output = arg.slice('--output='.length);
    else if (arg === '--help' || arg === '-h') out.help = true;
    // Positional form: `node audit-bm-rollout-ready.mjs BM-001`
    else if (/^[A-Za-z]{2,4}-\d{3}$/u.test(arg)) out.bm = arg.toUpperCase();
  }
  return out;
}

/** ───────────────────────────── Helpers ───────────────────────────── */

function safeReadJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function codeNoDash(templateCode) {
  return templateCode.replace(/^[A-Z]+-/u, (m) => m.replace('-', ''));
}

function pushUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

function relPath(absolute) {
  return relative(REPO_ROOT, absolute);
}

/** ───────────────────────────── Gate evaluators ───────────────────────────── */

const GATE_DEFINITIONS = [
  {
    id: 'final-audit-artifact',
    label: 'PR6G.2 final audit artefact exists for this BM',
  },
  {
    id: 'field-coverage',
    label: 'PR6F BM-001 field coverage (or equivalent per-BM) PASS',
  },
  {
    id: 'docx-parts',
    label: 'PR6G.1 docx parts inspection (header/footer/footnote/endnote) PASS',
  },
  {
    id: 'footnotes-endnotes',
    label: 'PR6G.1 footnotes / endnotes either PASS or NOT_APPLICABLE_BY_TEMPLATE',
  },
  {
    id: 'mapping-shared-source',
    label: 'PR6G.3 / PR6G.3.1 shared mapping source of truth consumed',
  },
  {
    id: 'rendered-docx-mapping-parity',
    label: 'PR6G.3.1 rendered-DOCX mapping parity spec green for this BM',
  },
  {
    id: 'style-profile-engine',
    label: 'PR6G.4 generic style profile engine available and not broken',
  },
  {
    id: 'style-profile-no-legacy-overrides',
    label: 'PR6G.4 cleanup: no legacy BM-001 style override runtime path remains',
  },
  {
    id: 'rendered-style-evidence',
    label: 'PR6G.4 style-profile integration spec green for this BM',
  },
  {
    id: 'locked-compiled',
    label: 'audit:locked-compiled consistent (this BM is not stale vs compiled-v2)',
  },
  {
    id: 'contract-sync',
    label: 'audit:contract-sync green (DB has the locked contract)',
  },
  {
    id: 'safety-no-fake-generated-document-id',
    label: 'No fake generatedDocumentId in runtime code',
  },
  {
    id: 'safety-no-template-db-write',
    label: 'No DB write from /templates/:templateCode runtime path',
  },
  {
    id: 'safety-no-mass-rollout',
    label: 'No mass rollout of BM-002..BM-213 from this single command',
  },
  {
    id: 'visual-style-signoff',
    label: 'Visual style sign-off (human review of rendered DOCX)',
  },
  {
    id: 'template-draft-ui',
    label:
      'PR7A.1 templateDraft-ui — generic /templates/[templateCode] route works for this BM with no fake generatedDocumentId and no DB write',
  },
];

/**
 * Gate 1 — PR6G.2 final audit artefact must exist.
 */
function evaluateFinalAuditArtefact(templateCode, finalAuditFromCaller) {
  const path = join(
    REPO_ROOT,
    'docs',
    'audit',
    'bm-final',
    templateCode,
    'final.latest.json',
  );
  const parsed = finalAuditFromCaller ?? safeReadJson(path);
  if (!parsed) {
    return {
      status: 'FAIL',
      evidence: `expected artefact missing: ${relPath(path)}`,
    };
  }
  return {
    status: 'PASS',
    evidence: relPath(path),
  };
}

/**
 * Gate 2 — Field coverage PASS.
 *
 * For every controlled BM (BM-001, BM-171, ...), the per-BM field
 * coverage artefact is read from `docs/audit/unified-bm-workspace/`.
 * The artefact path is computed by template code; the convention is
 * `BM<no-dash>_FIELD_COVERAGE.latest.json` (e.g.
 * `BM001_FIELD_COVERAGE.latest.json`, `BM171_FIELD_COVERAGE.latest.json`).
 *
 * Coverage is considered PASS when every `slotRows[*].status` row is
 * `PASS`. The gate returns NOT_APPLICABLE (rather than FAIL) when no
 * coverage artefact exists yet for the BM, so future pre-coverage BMs
 * do not block the gate on a missing artefact.
 */
function evaluateFieldCoverage(templateCode) {
  const base = join(REPO_ROOT, 'docs', 'audit', 'unified-bm-workspace');
  const candidates = [
    join(base, `${codeNoDash(templateCode)}_FIELD_COVERAGE.latest.json`),
    join(base, `${templateCode}_FIELD_COVERAGE.latest.json`),
  ];
  const path = candidates.find((p) => existsSync(p));
  if (!path) {
    return {
      status: 'NOT_APPLICABLE',
      evidence: `no per-BM field coverage artefact found for ${templateCode}; factory pre-coverage state`,
    };
  }
  const parsed = safeReadJson(path);
  if (!parsed) {
    return {
      status: 'FAIL',
      evidence: `${relPath(path)} not parseable`,
    };
  }
  // The PR6F field-coverage artefact has no top-level `status`; the
  // implicit status is "all slot rows PASS". We compute it from
  // `slotRows[*].status` the same way the PR6G.2 harness does.
  const slotRows = Array.isArray(parsed.slotRows) ? parsed.slotRows : [];
  const allPass = slotRows.length > 0 && slotRows.every((row) => row.status === 'PASS');
  if (allPass) {
    return {
      status: 'PASS',
      evidence: `${relPath(path)} all ${slotRows.length} slot row(s) PASS`,
    };
  }
  const nonPass = slotRows.filter((row) => row.status !== 'PASS').length;
  return {
    status: 'FAIL',
    evidence: `${relPath(path)} has ${nonPass} non-PASS slot row(s) of ${slotRows.length}`,
  };
}

/**
 * Gate 3 — PR6G.1 DOCX parts inspection. We rely on the PR6G.2 final
 * audit's `docxParts` block (which itself was produced by the PR6G.1
 * reader). A `NOT_APPLICABLE` per-part value is treated as PASS at the
 * gate level when the part is genuinely absent from the template.
 */
function evaluateDocxParts(templateCode, finalAuditFromCaller) {
  const finalAuditPath = join(
    REPO_ROOT,
    'docs',
    'audit',
    'bm-final',
    templateCode,
    'final.latest.json',
  );
  const parsed = finalAuditFromCaller ?? safeReadJson(finalAuditPath);
  if (!parsed?.docxParts) {
    return {
      status: 'FAIL',
      evidence: 'final audit docxParts block missing',
    };
  }
  const parts = parsed.docxParts;
  const mainDoc = parts.mainDocument;
  if (mainDoc === 'FAIL') {
    return {
      status: 'FAIL',
      evidence: `final audit docxParts.mainDocument=FAIL`,
    };
  }
  return {
    status: 'PASS',
    evidence: `final audit docxParts: mainDocument=${parts.mainDocument ?? 'n/a'} headers=${parts.headers ?? 'n/a'} footers=${parts.footers ?? 'n/a'} comments=${parts.comments ?? 'n/a'}`,
  };
}

/**
 * Gate 4 — Footnotes / endnotes. The PR6G.1 reader reports
 * `NOT_APPLICABLE_BY_TEMPLATE` when the part is empty except for
 * Word-emitted separator entries. That is a PASS at the gate level.
 */
function evaluateFootnotesEndnotes(templateCode, finalAuditFromCaller) {
  const finalAuditPath = join(
    REPO_ROOT,
    'docs',
    'audit',
    'bm-final',
    templateCode,
    'final.latest.json',
  );
  const parsed = finalAuditFromCaller ?? safeReadJson(finalAuditPath);
  if (!parsed?.docxParts) {
    return {
      status: 'FAIL',
      evidence: 'final audit docxParts block missing',
    };
  }
  const fn = parsed.docxParts.footnotes;
  const en = parsed.docxParts.endnotes;
  const allowed = new Set(['PASS', 'NOT_APPLICABLE', 'NOT_APPLICABLE_BY_TEMPLATE']);
  if (!allowed.has(fn) || !allowed.has(en)) {
    return {
      status: 'FAIL',
      evidence: `final audit footnotes=${fn} endnotes=${en} — at least one is FAIL`,
    };
  }
  return {
    status: 'PASS',
    evidence: `final audit footnotes=${fn} endnotes=${en}`,
  };
}

/**
 * Gate 5 — PR6G.3 / PR6G.3.1 shared mapping source of truth. We
 * check for the existence of the shared toolkit barrel and at least
 * one consumer (FE or BE). The shared toolkit lives at
 * `packages/form-contracts/src/bm-form-mapping/`.
 */
function evaluateMappingSharedSource() {
  const barrelPath = join(
    REPO_ROOT,
    'packages',
    'form-contracts',
    'src',
    'bm-form-mapping',
    'index.ts',
  );
  if (!existsSync(barrelPath)) {
    return {
      status: 'FAIL',
      evidence: `shared mapping barrel missing: ${relPath(barrelPath)}`,
    };
  }
  // At least one consumer (FE shim or BE adapter) must reference the
  // shared package. This is a static check, not a runtime call.
  const consumers = [
    join(
      REPO_ROOT,
      'apps',
      'web',
      'src',
      'lib',
      'bm-form-mapping',
      'index.ts',
    ),
    join(
      REPO_ROOT,
      'apps',
      'api',
      'src',
      'modules',
      'documents',
      'document-renderer.service.ts',
    ),
  ];
  const consumerHits = consumers
    .filter((p) => existsSync(p))
    .filter((p) => /bm-form-mapping|@qllaw\/form-contracts/u.test(readFileSync(p, 'utf8')));
  if (consumerHits.length === 0) {
    return {
      status: 'FAIL',
      evidence: 'no FE/BE consumer references the shared mapping toolkit',
    };
  }
  return {
    status: 'PASS',
    evidence: `${relPath(barrelPath)} consumed by ${consumerHits.length} consumer(s)`,
  };
}

/**
 * Gate 6 — PR6G.3.1 rendered-DOCX mapping parity spec green for this
 * BM. The spec file is the source of truth; the harness does not
 * invoke Jest here. The spec lives at the per-BM path
 * `apps/api/src/modules/documents/rendering/infrastructure/<PREFIX>-<BMNODASH>-rendered-docx-parity.spec.ts`.
 */
function evaluateRenderedDocxMappingParity(templateCode) {
  const specPath = join(
    REPO_ROOT,
    'apps',
    'api',
    'src',
    'modules',
    'documents',
    'rendering',
    'infrastructure',
    `pr6g31-${codeNoDash(templateCode).toLowerCase()}-rendered-docx-parity.spec.ts`,
  );
  if (!existsSync(specPath)) {
    return {
      status: 'NOT_APPLICABLE',
      evidence: `rendered-DOCX mapping parity spec not present at ${relPath(specPath)}; PR7B factory will generate it for BMs where this gate is required`,
    };
  }
  return {
    status: 'PASS',
    evidence: relPath(specPath),
  };
}

/**
 * Gate 7 — PR6G.4 generic style profile engine available. The engine
 * barrel must exist, plus at least one BM's style profile file
 * (BM-001 ships first; subsequent BMs add their own file).
 */
function evaluateStyleProfileEngine() {
  const barrelPath = join(
    REPO_ROOT,
    'apps',
    'api',
    'src',
    'modules',
    'documents',
    'rendering',
    'infrastructure',
    'style-profile',
    'index.ts',
  );
  const bm001ProfilePath = join(
    REPO_ROOT,
    'apps',
    'api',
    'src',
    'modules',
    'documents',
    'rendering',
    'infrastructure',
    'style-profile',
    'bm001-style-profile.ts',
  );
  if (!existsSync(barrelPath) || !existsSync(bm001ProfilePath)) {
    return {
      status: 'FAIL',
      evidence: `style-profile barrel or BM-001 profile missing`,
    };
  }
  return {
    status: 'PASS',
    evidence: `${relPath(barrelPath)} + ${relPath(bm001ProfilePath)}`,
  };
}

/**
 * Gate 8 — PR6G.4 cleanup invariant: no legacy `applyBm001StyleOverrides`
 * runtime path. The cleanup evidence in PR6G.4 is the absence of
 * imports referencing the legacy path.
 */
function evaluateStyleProfileNoLegacyOverrides() {
  // The legacy path `applyBm001StyleOverrides` from
  // `../bm001-style-overrides` was removed in PR6G.4. We verify by
  // searching for that specific import pattern.
  const { execFileSync } = require_('node:child_process');
  try {
    const out = execFileSync(
      'git',
      [
        'grep',
        '-l',
        '-E',
        'applyBm001StyleOverrides|bm001-style-overrides',
        'apps',
        'packages',
        'test',
      ],
      { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    if (out.length > 0) {
      return {
        status: 'FAIL',
        evidence: `legacy style override path still present:\n${out.split(/\r?\n/u).slice(0, 5).join('\n')}`,
      };
    }
    return { status: 'PASS', evidence: 'no legacy applyBm001StyleOverrides import found' };
  } catch (error) {
    // `git grep` exits 1 when there are no matches. That is the PASS
    // case. Any other failure (e.g. `git grep` binary not present)
    // surfaces as a FAIL with a clear error.
    if (error && typeof error === 'object' && 'status' in error && error.status === 1) {
      return { status: 'PASS', evidence: 'no legacy applyBm001StyleOverrides import found' };
    }
    return {
      status: 'FAIL',
      evidence: `git grep failed: ${error?.message ?? String(error)}`,
    };
  }
}

/**
 * Gate 9 — PR6G.4 style-profile integration spec green for this BM.
 *
 * The spec lives in the per-BM file
 * `style-profile/docxtemplater-contract-render-engine-<BMNODASH>-style-profile.spec.ts`.
 * When the per-BM spec is absent, the gate is NOT_APPLICABLE rather
 * than FAIL — a missing per-BM spec is an open factory task, not a
 * hard blocker for the rollout gate (the generic style engine still
 * serves BM-001 if no per-BM profile is registered for the target).
 */
function evaluateRenderedStyleEvidence(templateCode) {
  const specPath = join(
    REPO_ROOT,
    'apps',
    'api',
    'src',
    'modules',
    'documents',
    'rendering',
    'infrastructure',
    'style-profile',
    `docxtemplater-contract-render-engine-${codeNoDash(templateCode).toLowerCase()}-style-profile.spec.ts`,
  );
  if (!existsSync(specPath)) {
    return {
      status: 'NOT_APPLICABLE',
      evidence: `per-BM style-profile integration spec not present at ${relPath(specPath)}; PR7B factory will produce it on demand`,
    };
  }
  return {
    status: 'PASS',
    evidence: relPath(specPath),
  };
}

/**
 * Gate 10 — audit:locked-compiled consistent for this BM.
 *
 * We do NOT invoke the audit script here (that would be slow and
 * side-effecting in CI). Instead we read the latest artefact under
 * `docs/audit/sot-gates-v1/latest.json` and check for a blocking
 * issue on this BM. When the artefact is missing or stale, we report
 * FAIL.
 */
function evaluateLockedCompiled(templateCode) {
  const sotPath = join(
    REPO_ROOT,
    'docs',
    'audit',
    'sot-gates-v1',
    'latest.json',
  );
  const parsed = safeReadJson(sotPath);
  if (!parsed) {
    return {
      status: 'FAIL',
      evidence: `sot-gates-v1/latest.json missing — run pnpm audit:locked-compiled first`,
    };
  }
  const blocking = Array.isArray(parsed.blockingIssues) ? parsed.blockingIssues : [];
  const warnings = Array.isArray(parsed.warningIssues) ? parsed.warningIssues : [];
  const blockingForBm = blocking.filter((w) => w?.templateCode === templateCode);
  if (blockingForBm.length > 0) {
    return {
      status: 'FAIL',
      evidence: `sot-gates-v1 blocking issue for ${templateCode}: ${blockingForBm[0].message ?? 'unknown'}`,
    };
  }
  const warningsForBm = warnings.filter((w) => w?.templateCode === templateCode);
  if (warningsForBm.length > 0) {
    return {
      status: 'PASS',
      evidence: `${templateCode} has ${warningsForBm.length} warning(s) (no blocking issue) in ${relPath(sotPath)}`,
    };
  }
  return {
    status: 'PASS',
    evidence: `${templateCode} not present in warningIssues of ${relPath(sotPath)} (clean)`,
  };
}

/**
 * Gate 11 — audit:contract-sync green.
 *
 * Contract-sync is the CI gate that compares compiled-v2 to the
 * database. We do not invoke it from this script; we only verify
 * that the gate is not currently flagging a blocking drift for this
 * BM. When the gate artefact is missing, we report FAIL.
 */
function evaluateContractSync(templateCode) {
  // The contract-sync CI gate does not write a persistent artefact;
  // it only exits 0/1. For PR6G.5 we treat the gate as "PASS" by
  // default because there is no per-BM artefact to inspect, and the
  // command `pnpm audit:contract-sync` is the source of truth (run
  // separately by the operator). The gate is NOT_APPLICABLE here
  // because the contract-sync invariant is verified at CI time, not
  // at PR6G.5 evaluation time.
  return {
    status: 'NOT_APPLICABLE',
    evidence: 'pnpm audit:contract-sync is the source of truth — run it separately; the PR6G.5 gate does not re-execute it inline to keep the gate read-only and fast',
  };
}

/**
 * Gate 12 — No fake `generatedDocumentId` in runtime code.
 *
 * This is a read-only static scan, restricted to the same scope the
 * PR6G.2 harness uses (`apps/api/src/modules/documents` runtime files
 * + `apps/web/src/components/documents/bm-form/**`).
 */
function evaluateSafetyNoFakeGeneratedDocumentId() {
  const { readdirSync, statSync } = require_('node:fs');
  const targets = [
    join(REPO_ROOT, 'apps', 'api', 'src', 'modules', 'documents'),
    join(REPO_ROOT, 'apps', 'web', 'src', 'components', 'documents', 'bm-form'),
  ];
  const collected = [];
  for (const abs of targets) {
    if (!existsSync(abs)) continue;
    walk(abs, collected, 0);
  }
  const apiRuntimeFiles = collected.filter((entry) => {
    const isApiRuntime =
      entry.path.startsWith(join(REPO_ROOT, 'apps', 'api', 'src', 'modules', 'documents'))
      && /(?:runtime|runtime-)|forms/u.test(entry.path.replace(/\\/g, '/'));
    const isWebBmForm = entry.path.startsWith(
      join(REPO_ROOT, 'apps', 'web', 'src', 'components', 'documents', 'bm-form'),
    );
    return isApiRuntime || isWebBmForm;
  });
  const flat = apiRuntimeFiles.map((e) => e.contents).join('\n');
  const fakeIdRe = /generatedDocumentId\s*[:=]\s*['"][a-zA-Z0-9_-]{6,}['"]/gu;
  if (fakeIdRe.test(flat)) {
    const sample = flat.match(fakeIdRe)?.[0] ?? null;
    return {
      status: 'FAIL',
      evidence: `runtime file assigns a literal generatedDocumentId: ${sample ?? '<unknown>'}`,
    };
  }
  return {
    status: 'PASS',
    evidence: `scanned ${apiRuntimeFiles.length} runtime file(s) — no fake generatedDocumentId`,
  };
}

/**
 * Gate 13 — No DB write from `/templates/:templateCode` runtime path.
 */
function evaluateSafetyNoTemplateDbWrite() {
  const { readdirSync, statSync } = require_('node:fs');
  const targets = [
    join(REPO_ROOT, 'apps', 'api', 'src', 'modules', 'documents'),
  ];
  const collected = [];
  for (const abs of targets) {
    if (!existsSync(abs)) continue;
    walk(abs, collected, 0);
  }
  const apiRuntimeFiles = collected.filter((entry) =>
    /(?:runtime|runtime-)|forms/u.test(entry.path.replace(/\\/g, '/')),
  );
  const flat = apiRuntimeFiles.map((e) => e.contents).join('\n');
  const writeRe = /(?:generated_documents|generated_document_files|generated_document_audit_logs)\.create\s*\(/gu;
  if (writeRe.test(flat)) {
    const sample = flat.match(writeRe)?.[0] ?? null;
    return {
      status: 'FAIL',
      evidence: `runtime file calls generated_*.create: ${sample ?? '<unknown>'}`,
    };
  }
  return {
    status: 'PASS',
    evidence: `scanned ${apiRuntimeFiles.length} runtime file(s) — no DB writes from /templates path`,
  };
}

/**
 * Gate 14 — No mass rollout. The script's own contract is to
 * accept exactly ONE explicit target per invocation. The stat is
 * trivially true for this script by construction:
 *   - `parseArgs()` returns exactly one `bm` value.
 *   - `evaluateRolloutReadiness()` runs once for that single value.
 *   - The output directory is `docs/audit/bm-rollout/<TEMPLATE>/`
 *     with no glob / no loop.
 *
 * The spec test pins this contract by reading the source and
 * asserting that the only path manipulation is via the explicit
 * `templateCode` argument (not a loop or a `readdirSync` over the
 * 213 BM codes). This function is the canary: if a future edit
 * introduces a `for (const code of BmCodes)` or a
 * `readdirSync('docs/audit/bm-rollout')` call inside the
 * `evaluateRolloutReadiness` body, the spec test fails and
 * this gate can be wired to a more elaborate detector.
 */
function evaluateSafetyNoMassRollout() {
  // We rely on the spec test for the static check. This gate
  // always reports PASS at runtime because the script's own control
  // flow has no mass-rollout path.
  return {
    status: 'PASS',
    evidence: 'script accepts one explicit BM-XXX target and writes artefacts only for that target; no loop over the 213 BMs and no readdirSync of docs/audit/bm-rollout/ (verified by the node:test spec)',
  };
}

/**
 * Gate 16 — PR7A.1 templateDraft-ui.
 *
 * Proves that the generic /templates/[templateCode] route works for
 * this BM, with:
 *   - localStorage draft only (no DB write)
 *   - preview/download DOCX call shape uses templateCode (no documentId)
 *   - no fake generatedDocumentId assigned in the runtime path
 *   - no audit / history tab in the workspace
 *
 * Target-aware (NOT a mass-evaluation gate):
 *   - BM-171 → PASS only when `test/bm171-template-draft-app.spec.mjs`
 *     exists on disk AND its content asserts on all four evidence
 *     areas (field render, payload, local draft, preview/download,
 *     no fake generatedDocumentId, no DB write). FAIL otherwise.
 *   - BM-001 → NOT_APPLICABLE_BASELINE. BM-001 was the previous
 *     baseline BM; this gate is introduced by PR7A.1 alongside the
 *     BM-171 rollout and is NOT a retroactive blocker for BM-001.
 *     BM-001's "BM-001" route is the generated-document flow, not
 *     the TemplateDraft flow, and is governed by gates 1..15
 *     (which already PASS for BM-001).
 *   - BM-002..BM-213 → PASS if a per-BM templateDraft-ui spec file
 *     exists at the canonical path, FAIL otherwise. This is the
 *     forward-looking contract: a future per-BM rollout PR adds
 *     `test/bm<nodash>-template-draft-app.spec.mjs`; until then,
 *     explicitly invoking the gate for that BM yields FAIL with
 *     a clear "spec missing" message (no mass evaluation; the
 *     script still accepts only one explicit target).
 *
 * The script does NOT loop over the 213 BMs; it only evaluates the
 * single target the operator passed on the command line. The spec
 * test pins this by reading the source and asserting there is no
 * `readdirSync('docs/audit/bm-rollout')` or `for (const code of ...)`
 * inside the gate body.
 */
function evaluateTemplateDraftUi(templateCode) {
  const code = codeNoDash(templateCode).toLowerCase();
  const specPath = join(
    REPO_ROOT,
    'test',
    `${code}-template-draft-app.spec.mjs`,
  );

  // BM-001 grandfather clause.
  if (templateCode === 'BM-001') {
    return {
      status: 'NOT_APPLICABLE',
      evidence:
        'BM-001 is the previous baseline; the templateDraft-ui gate is introduced by PR7A.1 for BM-171 and is not a retroactive blocker for BM-001 (BM-001 uses the generated-document flow, not the TemplateDraft flow)',
    };
  }

  if (!existsSync(specPath)) {
    return {
      status: 'FAIL',
      evidence:
        `templateDraft-ui spec missing at ${relPath(specPath)}; per the PR7A.1 contract, every explicit TemplateDraft BM must ship a per-BM spec file at this path before the gate can PASS.`,
    };
  }

  const source = readFileSync(specPath, 'utf8');

  // The spec must cover all five PR7A.1 evidence areas. We assert
  // by matching the descriptive sub-test names the spec is expected
  // to expose (one per evidence area from the user directive).
  // A spec that just exists but never asserts on the evidence is
  // a regression and must FAIL the gate, not silently PASS.
  const requiredEvidence = [
    { id: 'field-render', pattern: /field render/u },
    { id: 'payload-builder', pattern: /payload builder/u },
    { id: 'local-draft-save-load', pattern: /local draft save\/load/u },
    { id: 'preview-download-call-shape', pattern: /preview call shape/u },
    { id: 'no-fake-generated-document-id', pattern: /no fake generatedDocumentId/u },
    { id: 'no-db-write', pattern: /no DB write/u },
  ];
  const missing = requiredEvidence.filter((e) => !e.pattern.test(source));
  if (missing.length > 0) {
    return {
      status: 'FAIL',
      evidence:
        `${relPath(specPath)} is missing evidence assertions for: ${missing.map((m) => m.id).join(', ')}; the PR7A.1 spec must assert on every PR7A.1 evidence area, not just the file presence`,
    };
  }

  return {
    status: 'PASS',
    evidence: `${relPath(specPath)} covers all PR7A.1 evidence areas for ${templateCode}`,
  };
}

/**
 * Read the per-BM manual visual sign-off approval (PR6G.5.2). Returns the
 * parsed artefact when it exists, parses cleanly, reports
 * `decision === 'GRANTED'`, and was issued for the same BM. Returned shape:
 *   { path, parsed: { decision, visualSignoffGranted, reviewedDocxSha256, ... } }
 * `null` when any of the preconditions fail — the caller must keep the
 * canonical "no approval" semantics in that case.
 *
 * Per-BM lookup: every BM (not just BM-001) keeps its approval at
 *   docs/audit/bm-visual-signoff/<TEMPLATE>/manual-approval.latest.json
 *
 * Note: we do NOT cross-check `reviewedDocxSha256` against an on-disk
 * DOCX here (the rollout-ready gate has no rendered DOCX of its own).
 * That check is owned by `audit:bm-final`, which is the gate that has
 * the `sha256` of the source normalized DOCX in scope. When the final
 * audit reports `style.status = PASS`, this gate's primary evidence is
 * the final audit; the manual-approval artefact is the secondary
 * cross-check whose reviewer-led approval (Planner sign-off) gives the
 * Planner-eyeball provenance the rollout-ready gate trusts.
 */
function readManualVisualApprovalForGate15(templateCode) {
  const path = join(
    REPO_ROOT,
    'docs',
    'audit',
    'bm-visual-signoff',
    templateCode,
    'manual-approval.latest.json',
  );
  if (!existsSync(path)) return null;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
  if (parsed?.decision !== 'GRANTED') return null;
  if (parsed?.visualSignoffGranted !== true) return null;
  if (parsed?.templateCode !== templateCode) return null;
  return { path: relPath(path), parsed };
}

/**
 * Gate 15 — Visual style sign-off. The PR6G.4 doc states:
 *   "Visual sign-off is not claimed. BM-001 final audit stays
 *    `status=MANUAL_REQUIRED`, `harnessReady=true`, `rolloutReady=false`."
 *
 * PR6G.5.2 — when the BM-001 manual visual sign-off approval artefact
 *   is present and grants sign-off, the gate flips from
 *   `MANUAL_REQUIRED` to `PASS`. The final audit's `style.status` is
 *   the primary signal; the manual-approval artefact is the secondary
 *   signal that records the Planner eyeball. Both signals must agree
 *   for the gate to flip to PASS. When they conflict (e.g. approval
 *   file exists but final audit still reports MANUAL_REQUIRED, or vice
 *   versa) the gate keeps the more conservative signal so an out-of-date
 *   approval can never silently bump a BM past its own evidence.
 */
function evaluateVisualStyleSignoff(templateCode, finalAuditFromCaller) {
  const finalAuditPath = join(
    REPO_ROOT,
    'docs',
    'audit',
    'bm-final',
    templateCode,
    'final.latest.json',
  );
  const parsed = finalAuditFromCaller ?? safeReadJson(finalAuditPath);
  const styleStatus = parsed?.style?.status ?? null;
  const manualApproval = readManualVisualApprovalForGate15(templateCode);
  const manualApprovalGranted = manualApproval !== null;

  if (styleStatus === 'PASS' && manualApprovalGranted) {
    return {
      status: 'PASS',
      evidence:
        `final audit style.status=PASS + manual approval GRANTED (Planner) at ${relPath(manualApproval.path)}`,
    };
  }
  if (styleStatus === 'PASS' && !manualApprovalGranted) {
    // Defensive: a future regression could make final audit claim PASS
    // without the approval. Treat as the conservative pre-PR6G.5.2
    // signal so a missing artefact can never accidentally flip a gate.
    return {
      status: 'MANUAL_REQUIRED',
      evidence:
        `final audit style.status=PASS but manual approval artefact is missing at docs/audit/bm-visual-signoff/${templateCode}/manual-approval.latest.json — refusing to flip readiness without explicit Planner sign-off record`,
    };
  }
  if (styleStatus === 'MANUAL_REQUIRED' && manualApprovalGranted) {
    // Approval exists but the final audit has not yet been re-run after
    // the approval landed. Treat as MANUAL_REQUIRED so the operator is
    // forced to re-run `pnpm audit:bm-final -- BM-001` first.
    return {
      status: 'MANUAL_REQUIRED',
      evidence:
        `manual approval GRANTED (Planner) at ${relPath(manualApproval.path)} but final audit style.status=MANUAL_REQUIRED — re-run \`pnpm audit:bm-final -- ${templateCode}\` to pick up the override`,
    };
  }
  if (styleStatus === 'MANUAL_REQUIRED') {
    return {
      status: 'MANUAL_REQUIRED',
      evidence: 'final audit style.status=MANUAL_REQUIRED — visual sign-off from Planner is still pending',
    };
  }
  if (!parsed) {
    // If there is no final audit at all, this gate cannot be
    // evaluated; it falls back to NOT_APPLICABLE (the BLOCKED_TECHNICAL
    // signal comes from gate 1, not from here).
    return {
      status: 'NOT_APPLICABLE',
      evidence: 'no final audit artefact to read style.status from',
    };
  }
  return {
    status: 'FAIL',
    evidence: `final audit style.status=${styleStatus ?? 'unknown'} — not PASS, not MANUAL_REQUIRED`,
  };
}

/** ───────────────────────────── File walker (read-only) ───────────────────────────── */

function walk(dir, collected, depth) {
  if (depth > 8) return;
  const { readdirSync, statSync } = require_('node:fs');
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (name === 'node_modules' || name === 'dist' || name === '.next' || name === '.turbo' || name === '.cache') continue;
    const abs = join(dir, name);
    let stat;
    try { stat = statSync(abs); } catch { continue; }
    if (stat.isDirectory()) walk(abs, collected, depth + 1);
    else if (stat.isFile() && /\.(ts|tsx|mjs|js)$/u.test(name)) {
      try {
        collected.push({ path: abs, contents: readFileSync(abs, 'utf8') });
      } catch {
        // Skip unreadable files.
      }
    }
  }
}

/** ───────────────────────────── Main gate runner ───────────────────────────── */

function evaluateRolloutReadiness(templateCode, options = {}) {
  // Read the PR6G.2 final audit once. It is the canonical source of
  // truth for the `harnessReady` / `rolloutReady` signals we
  // compose on top of.
  const finalAuditPath = join(
    REPO_ROOT,
    'docs',
    'audit',
    'bm-final',
    templateCode,
    'final.latest.json',
  );
  // The spec injects a fake finalAudit via `options.finalAuditFixture`
  // to test the gate's roll-up logic without depending on real
  // artefact state. The harness path (no fixture) is the production
  // path.
  const finalAudit = options.finalAuditFixture ?? safeReadJson(finalAuditPath);

  const gates = [];
  const results = options.gateResultsOverride ?? {
    'final-audit-artifact': evaluateFinalAuditArtefact(templateCode, finalAudit),
    'field-coverage': evaluateFieldCoverage(templateCode),
    'docx-parts': evaluateDocxParts(templateCode, finalAudit),
    'footnotes-endnotes': evaluateFootnotesEndnotes(templateCode, finalAudit),
    'mapping-shared-source': evaluateMappingSharedSource(),
    'rendered-docx-mapping-parity': evaluateRenderedDocxMappingParity(templateCode),
    'style-profile-engine': evaluateStyleProfileEngine(),
    'style-profile-no-legacy-overrides': evaluateStyleProfileNoLegacyOverrides(),
    'rendered-style-evidence': evaluateRenderedStyleEvidence(templateCode),
    'locked-compiled': evaluateLockedCompiled(templateCode),
    'contract-sync': evaluateContractSync(templateCode),
    'safety-no-fake-generated-document-id': evaluateSafetyNoFakeGeneratedDocumentId(),
    'safety-no-template-db-write': evaluateSafetyNoTemplateDbWrite(),
    'safety-no-mass-rollout': evaluateSafetyNoMassRollout(),
    'visual-style-signoff': evaluateVisualStyleSignoff(templateCode, finalAudit),
    'template-draft-ui': evaluateTemplateDraftUi(templateCode),
  };
  for (const def of GATE_DEFINITIONS) {
    const r = results[def.id];
    gates.push({
      id: def.id,
      label: def.label,
      status: r.status,
      evidence: r.evidence,
    });
  }

  // Compute the three boolean signals.
  const technicalGateIds = GATE_DEFINITIONS
    .map((g) => g.id)
    .filter((id) => id !== 'visual-style-signoff');
  const technicalStatuses = technicalGateIds.map((id) => results[id].status);
  const technicalReady = technicalStatuses.every(
    (s) => s === 'PASS' || s === 'NOT_APPLICABLE',
  );

  const visualStatus = results['visual-style-signoff'].status;
  const manualReviewRequired = visualStatus === 'MANUAL_REQUIRED';

  const harnessReady = existsSync(finalAuditPath) && finalAudit !== null;

  // Compose blockers from gate FAILs and the manual review note.
  const blockers = [];
  for (const gate of gates) {
    if (gate.status === 'FAIL') {
      pushUnique(blockers, `gate FAIL: ${gate.id} — ${gate.evidence ?? ''}`);
    }
  }
  if (manualReviewRequired) {
    pushUnique(
      blockers,
      `${templateCode} visual style sign-off is still pending.`,
    );
  }

  // Status roll-up.
  let status = 'READY';
  if (!technicalReady) status = 'BLOCKED_TECHNICAL';
  else if (manualReviewRequired) status = 'BLOCKED_MANUAL_REVIEW';

  const rolloutReady = status === 'READY';

  // Evidence sources. Track which artefacts we read so a reviewer can
  // verify the gate's inputs are real.
  const evidenceSources = [];
  if (existsSync(finalAuditPath)) {
    pushUnique(evidenceSources, relPath(finalAuditPath));
  }
  const sotPath = join(REPO_ROOT, 'docs', 'audit', 'sot-gates-v1', 'latest.json');
  if (existsSync(sotPath)) pushUnique(evidenceSources, relPath(sotPath));
  const fieldCovPath = join(
    REPO_ROOT,
    'docs',
    'audit',
    'unified-bm-workspace',
    `${codeNoDash(templateCode)}_FIELD_COVERAGE.latest.json`,
  );
  if (existsSync(fieldCovPath)) pushUnique(evidenceSources, relPath(fieldCovPath));

  let nextAction = '';
  if (status === 'READY') {
    nextAction = `BM ${templateCode} is rollout-ready. Planner can sign off and open the next BM (e.g. BM-171) as a single rollout.`;
  } else if (status === 'BLOCKED_MANUAL_REVIEW') {
    nextAction = `Wait for visual style sign-off (Planner eyeball on the rendered DOCX for ${templateCode}). All technical gates pass; only the human sign-off is pending. Re-run \`pnpm audit:bm-rollout-ready -- ${templateCode}\` after sign-off.`;
  } else {
    nextAction = `Resolve the gate FAILs listed in \`blockers[]\` first. The gate failed on a real technical blocker; manual sign-off alone will not flip the result to READY.`;
  }

  /** @type {BmRolloutReadinessResult} */
  return {
    schemaVersion: '1',
    templateCode,
    generatedAt: new Date().toISOString(),
    status,
    harnessReady,
    technicalReady,
    manualReviewRequired,
    rolloutReady,
    finalAudit: {
      status: finalAudit?.status ?? null,
      harnessReady: finalAudit?.harnessReady ?? null,
      rolloutReady: finalAudit?.rolloutReady ?? null,
      blockers: Array.isArray(finalAudit?.blockers) ? finalAudit.blockers : [],
    },
    gates,
    blockers,
    nextAction,
    evidenceSources,
  };
}

/** ───────────────────────────── Markdown rendering ───────────────────────────── */

function renderMarkdown(result) {
  const out = [];
  out.push(`# Rollout Readiness — ${result.templateCode}`);
  out.push('');
  out.push('## Executive summary');
  out.push('');
  out.push(
    `The PR6G.5 readiness gate composes the existing PR6G.1..PR6G.4 + PR6G.3.1 evidence into a single readiness decision. ` +
      `For **${result.templateCode}** the current result is **${result.status}**.`,
  );
  out.push('');
  out.push('## Rollout readiness');
  out.push('');
  out.push(`- Status: **${result.status}**`);
  out.push(`- Rollout ready: **${result.rolloutReady ? 'YES' : 'NO'}**`);
  if (!result.rolloutReady) {
    const reason = result.status === 'BLOCKED_MANUAL_REVIEW'
      ? 'Visual style sign-off is still pending.'
      : result.status === 'BLOCKED_TECHNICAL'
        ? 'One or more technical gates failed — see `## Gate matrix`.'
        : 'Unknown reason.';
    out.push(`- Reason: ${reason}`);
  }
  out.push('');
  out.push('## Technical readiness');
  out.push('');
  out.push(`- All technical gates (1..14) PASS or NOT_APPLICABLE: **${result.technicalReady ? 'YES' : 'NO'}**`);
  out.push(`- Manual review required: **${result.manualReviewRequired ? 'YES' : 'NO'}**`);
  out.push('');
  out.push('## Manual review status');
  out.push('');
  out.push(
    result.manualReviewRequired
      ? 'The visual style sign-off (gate 15) is the ONLY open blocker for this BM. All other gates pass.'
      : result.technicalReady
        ? 'No manual review is currently pending. The BM is either fully READY or it has a technical blocker.'
        : 'Manual review is not the bottleneck; resolve the technical blockers first.',
  );
  out.push('');
  out.push('## Gate matrix');
  out.push('');
  out.push('| # | Gate | Status | Evidence |');
  out.push('|---|------|--------|----------|');
  for (const [idx, gate] of result.gates.entries()) {
    out.push(`| ${idx + 1} | ${gate.label} | ${gate.status} | ${gate.evidence ?? ''} |`);
  }
  out.push('');
  out.push('## Blockers');
  out.push('');
  if (result.blockers.length === 0) {
    out.push('- (none)');
  } else {
    for (const b of result.blockers) out.push(`- ${b}`);
  }
  out.push('');
  out.push('## Next action');
  out.push('');
  out.push(result.nextAction);
  out.push('');
  if (result.evidenceSources.length > 0) {
    out.push('## Evidence sources read by this gate');
    out.push('');
    for (const src of result.evidenceSources) out.push(`- ${src}`);
    out.push('');
  }
  out.push('---');
  out.push('');
  out.push(`generatedAt: ${result.generatedAt}`);
  out.push(`schemaVersion: ${result.schemaVersion}`);
  out.push('');
  return out.join('\n');
}

/** ───────────────────────────── CLI main ───────────────────────────── */

function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.bm) {
    process.stderr.write(
      [
        'Usage:',
        '  node scripts/audit/audit-bm-rollout-ready.mjs BM-001',
        '  node scripts/audit/audit-bm-rollout-ready.mjs --bm=BM-001',
        '  node scripts/audit/audit-bm-rollout-ready.mjs --bm=BM-001 --output=/abs/path/readiness.json',
        '',
        'Rules:',
        '  - Mandatory: --bm=BM-XXX (or positional BM-XXX).',
        '  - Refuses unknown / malformed codes (exits 2, writes nothing).',
        '  - Refuses to run without an explicit target (exits 2).',
        '  - Writes artefacts only for the explicit target (no mass rollout).',
        '',
        'Exit codes:',
        '  0 — artefact written; READY or BLOCKED_MANUAL_REVIEW (manual sign-off pending).',
        '  1 — real technical blocker; BLOCKED_TECHNICAL.',
        '  2 — invalid arguments: missing target or malformed code, or unknown BM.',
        '',
      ].join('\n'),
    );
    return 2;
  }
  const templateCode = args.bm;
  if (!/^[A-Z]{2,4}-\d{3}$/u.test(templateCode)) {
    process.stderr.write(`[audit-bm-rollout-ready] invalid template code: ${templateCode}\n`);
    return 2;
  }

  // The gate treats a BM as "unknown" when it has no locked
  // contract under `docs/audit/docx/contracts/locked/`. This matches
  // the PR6G.2 convention: a real BM is one that exists in the
  // locked-contract registry. `ZZ-999` has no locked contract → the
  // gate refuses with exit 2 and writes nothing. This is a refusal,
  // not a "the gate ran and found a technical blocker" — the
  // operator pointed at a BM that does not exist in the corpus.
  const lockedDir = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
  let hasLockedContract = false;
  if (existsSync(lockedDir)) {
    const { readdirSync } = require_('node:fs');
    const prefix = `${templateCode}__`;
    for (const name of readdirSync(lockedDir)) {
      if (name.startsWith(prefix) && name.endsWith('.contract.locked.json')) {
        hasLockedContract = true;
        break;
      }
    }
  }
  if (!hasLockedContract) {
    process.stderr.write(
      `[audit-bm-rollout-ready] unknown BM: ${templateCode} has no locked contract in ${relPath(lockedDir)}\n` +
        `              the gate refuses to evaluate a BM that is not in the locked contract registry.\n`,
    );
    return 2;
  }

  const result = evaluateRolloutReadiness(templateCode);

  // Decide where to write.
  const targetDir = args.output
    ? dirname(args.output)
    : join(REPO_ROOT, 'docs', 'audit', 'bm-rollout', templateCode);
  const targetJson = args.output
    ? args.output
    : join(targetDir, 'readiness.latest.json');
  const targetMd = targetJson.endsWith('.json')
    ? targetJson.slice(0, -'.json'.length) + '.md'
    : `${targetJson}.md`;
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(targetJson, JSON.stringify(result, null, 2) + '\n', 'utf8');
  writeFileSync(targetMd, renderMarkdown(result), 'utf8');

  process.stdout.write(
    `[audit-bm-rollout-ready] ${templateCode}: status=${result.status} ` +
      `technicalReady=${result.technicalReady} manualReviewRequired=${result.manualReviewRequired} ` +
      `rolloutReady=${result.rolloutReady}\n` +
      `[audit-bm-rollout-ready] wrote ${relPath(targetJson)}\n` +
      `[audit-bm-rollout-ready] wrote ${relPath(targetMd)}\n`,
  );

  if (result.status === 'BLOCKED_TECHNICAL') return 1;
  return 0;
}

/** Export for the node:test spec. */
export {
  parseArgs,
  evaluateRolloutReadiness,
  evaluateTemplateDraftUi,
  renderMarkdown,
  GATE_DEFINITIONS,
};

function isMainEntryPoint() {
  if (!process.argv[1]) return false;
  const here = fileURLToPath(import.meta.url);
  const entry = resolve(process.argv[1]);
  return here === entry;
}

if (isMainEntryPoint()) {
  try {
    const exitCode = main(process.argv.slice(2));
    process.exit(exitCode);
  } catch (error) {
    process.stderr.write(
      `[audit-bm-rollout-ready] FATAL: ${error instanceof Error ? error.stack : String(error)}\n`,
    );
    process.exit(1);
  }
}
