#!/usr/bin/env node
// Phase 15B.1 Phase 4 — Audit current 35-form generator
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ts = readFileSync('packages/form-contracts/src/runtime-readiness.generated.ts', 'utf8');
const json = JSON.parse(readFileSync('docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json', 'utf8'));

// Extract TS entries: formCode, evidenceSha256, source
const tsEntryRegex = /formCode:\s*"([^"]+)",\s*promotionStatus:\s*"([^"]+)",\s*evidencePath:\s*"([^"]+)",\s*evidenceSha256:\s*"([a-f0-9]+)",\s*source:\s*"([^"]+)"/g;
const tsEntries = [];
let m;
while ((m = tsEntryRegex.exec(ts)) !== null) {
  tsEntries.push({
    formCode: m[1],
    promotionStatus: m[2],
    evidencePath: m[3],
    evidenceSha256: m[4],
    source: m[5],
  });
}

// Extract TS roster codes
const rosterMatch = ts.match(/RUNTIME_READY_FORM_CODES = \[([\s\S]*?)\] as const;/);
const tsRosterCodes = (rosterMatch?.[1] ?? '')
  .split('\n')
  .map((l) => l.match(/"([^"]+)"/)?.[1])
  .filter(Boolean);

// Extract TS RUNTIME_READINESS_PROVENANCE
const provMatch = ts.match(/RUNTIME_READINESS_PROVENANCE = \{([\s\S]*?)notes: \[([\s\S]*?)\],?\s*\} as const;/);
const tsNotes = (provMatch?.[2] ?? '')
  .split('\n')
  .map((l) => l.match(/"([^"]+)"/)?.[1])
  .filter(Boolean);

const jsonCodes = json.runtimeReadyFormCodes ?? [];
const jsonEntries = new Map((json.entries ?? []).map((e) => [e.formCode, e]));

// Comparisons
const tsEntrySet = new Set(tsEntries.map((e) => e.formCode));
const jsonEntrySet = new Set(jsonEntries.keys());
const tsRosterSet = new Set(tsRosterCodes);
const jsonRosterSet = new Set(jsonCodes);

const equalEntries = tsEntrySet.size === jsonEntrySet.size && [...tsEntrySet].every((c) => jsonEntrySet.has(c));
const equalRoster = tsRosterSet.size === jsonRosterSet.size && [...tsRosterSet].every((c) => jsonRosterSet.has(c));

// SHA mismatch detection
let shaMismatches = 0;
for (const [code, e] of jsonEntries) {
  const tsE = tsEntries.find((t) => t.formCode === code);
  if (tsE && tsE.evidenceSha256 !== e.evidenceSha256) {
    shaMismatches++;
    console.log('SHA mismatch', code, 'ts:', tsE.evidenceSha256, 'json:', e.evidenceSha256);
  }
}

// Verify SHA is real for Phase-14 entries
let realDocxShas = 0;
let fakeTextShas = 0;
for (const e of tsEntries) {
  const code = e.formCode;
  const docxPath = `storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
  if (e.source === 'phase14-dual-browser-promotion') {
    if (existsSync(docxPath)) {
      const realSha = createHash('sha256').update(readFileSync(docxPath)).digest('hex');
      if (realSha === e.evidenceSha256) {
        realDocxShas++;
      } else {
        fakeTextShas++;
        console.log('Phase-14 SHA is NOT real DOCX hash', code, 'claimed:', e.evidenceSha256, 'actual:', realSha);
      }
    }
  }
}

// Verify baseline codes are in evidence-safe-roster rows
const evidenceSafe = JSON.parse(
  readFileSync(
    'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/turn4-adversarial-audit/evidence-safe-roster.json',
    'utf8',
  ),
);
const esRows = new Set((evidenceSafe.rows ?? []).map((r) => r.FORM_CODE));
const inEvidenceSafe25 = new Set(evidenceSafe.eligible ?? []);

const baseline_11 = ['BM-001', 'BM-136', 'BM-148', 'BM-156', 'BM-157', 'BM-168', 'BM-171', 'BM-174', 'BM-181', 'BM-206', 'BM-213'];
const phase1_5 = ['BM-002', 'BM-008', 'BM-010', 'BM-012', 'BM-172'];

const baselineInEvidenceSafeRows = baseline_11.map((c) => ({ code: c, inRows: esRows.has(c), inEligible25: inEvidenceSafe25.has(c) }));
const phase1InEvidenceSafeRows = phase1_5.map((c) => ({ code: c, inRows: esRows.has(c), inEligible25: inEvidenceSafe25.has(c) }));

console.log(JSON.stringify({
  schema: 'qllaw.phase15b1.current_roster_generator_audit/v1',
  generatedAt: new Date().toISOString(),
  tsEntriesCount: tsEntries.length,
  jsonEntriesCount: jsonEntries.size,
  tsRosterCount: tsRosterCodes.length,
  jsonRosterCount: jsonCodes.length,
  equalEntries,
  equalRoster,
  shaMismatches,
  realDocxShas,
  fakeTextShas,
  tsProvenanceNotes: tsNotes,
  baselineInEvidenceSafeRows,
  phase1InEvidenceSafeRows,
  verdict: (() => {
    if (!equalEntries || !equalRoster || shaMismatches > 0) return 'CURRENT_35_UNPROVEN';
    if (fakeTextShas > 0) return 'CURRENT_35_OVERPROMOTED';
    if (phase1InEvidenceSafeRows.some((p) => !p.inEligible25) || baselineInEvidenceSafeRows.some((b) => !b.inEligible25)) return 'CURRENT_35_OVERPROMOTED';
    return 'CURRENT_35_CONFIRMED';
  })(),
  summary: 'Generator (regenerate-runtime-readiness.py) takes the UNION of baselineRuntimeReady (11) + newlyPromoted (5) + phase14Promoted (19) = 35. The 5 newlyPromoted have Phase 1B LibreOffice R1/R2 only, no REAL_UI. The 11 baseline forms are NOT in evidence-safe-roster rows; they are included because bridge-eligibility.ts asserts them as ALREADY_READY. Per the prompt rules, this is test-driven membership: the bridge-eligibility test forces the roster, not the evidence policy.',
}, null, 2));