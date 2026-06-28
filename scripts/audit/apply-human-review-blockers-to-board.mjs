#!/usr/bin/env node
/**
 * scripts/audit/apply-human-review-blockers-to-board.mjs
 *
 * Post-refresh helper that reads all human-review-blocker ledgers and
 * patches the board JSON and CSV. This is a belt-and-suspenders companion
 * to the durable blocker-scanning logic built into refresh-213-docx-fidelity-board.mjs.
 *
 * Run AFTER refresh-213-docx-fidelity-board.mjs if you want to ensure
 * blockers are applied even if the main script's blocker scan fails.
 *
 * This helper scans future blocker ledgers too — it is not hardcoded
 * to only BM-052/BM-062/BM-063.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const AUDIT_RENORM_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization');
const BOARD_JSON = join(ROOT, 'docs', 'audit', '213-docx-fidelity-board', 'latest.json');
const BOARD_CSV = join(ROOT, 'docs', 'audit', '213-docx-fidelity-board', 'per-bm.csv');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += ch;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((candidate) =>
    candidate.some((cell) => cell.trim().length > 0),
  );
  if (!header) return [];

  return body.map((cells) =>
    Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ''])),
  );
}

async function main() {
  // Phase 1: Scan all human-review-blocker ledgers.
  const ledgers = [];
  if (!existsSync(AUDIT_RENORM_DIR)) {
    console.log('[blocker-helper] No human-review-blocker ledgers found.');
    return;
  }

  for (const bmDir of readdirSync(AUDIT_RENORM_DIR)) {
    const ledgerPath = join(AUDIT_RENORM_DIR, bmDir, 'human-review-blocker.latest.json');
    if (!existsSync(ledgerPath)) continue;
    try {
      const ledger = readJson(ledgerPath);
      if (ledger.status === 'BLOCKED_BY_HUMAN_DOCX_REVIEW') {
        ledgers.push(ledger);
        console.log(`[blocker-helper] Found: ${ledger.templateCode} → BLOCKED_BY_HUMAN_DOCX_REVIEW`);
      }
    } catch (err) {
      console.warn(`[blocker-helper] Skipping invalid ledger: ${ledgerPath}: ${err.message}`);
    }
  }

  if (ledgers.length === 0) {
    console.log('[blocker-helper] No blocker ledgers found. Nothing to patch.');
    return;
  }

  // Phase 2: Patch board JSON.
  const board = readJson(BOARD_JSON);
  let jsonPatched = 0;
  for (const ledger of ledgers) {
    const row = board.rows?.find((r) => r.templateCode === ledger.templateCode);
    if (!row) {
      console.warn(`[blocker-helper] WARNING: ${ledger.templateCode} not found in board JSON.`);
      continue;
    }
    row.primaryLane = 'LEGAL_REVIEW';
    row.completionStatus = 'BLOCKED_BY_HUMAN_DOCX_REVIEW';
    row.nextAction = `BLOCKED: Human DOCX/legal review required for ${(ledger.blockedPlaceholders || []).map((b) => `${b.count}x ${b.placeholder}`).join(', ')}.`;
    jsonPatched += 1;
  }

  // Update summary lane counts.
  if (board.summary) {
    // Recompute lane counts from patched rows.
    const laneCounts = {};
    for (const row of board.rows || []) {
      laneCounts[row.primaryLane] = (laneCounts[row.primaryLane] ?? 0) + 1;
    }
    board.summary.laneCounts = laneCounts;
  }

  writeFileSync(BOARD_JSON, JSON.stringify(board, null, 2), 'utf8');
  console.log(`[blocker-helper] Patched ${jsonPatched} row(s) in ${BOARD_JSON}`);

  // Phase 3: Patch board CSV.
  if (existsSync(BOARD_CSV)) {
    const csvText = readFileSync(BOARD_CSV, 'utf8');
    const csvRows = parseCsv(csvText);
    if (csvRows.length > 0) {
      const header = Object.keys(csvRows[0]);

      let csvPatched = 0;
      const patchedCsvRows = csvRows.map((row) => {
        const ledger = ledgers.find((l) => l.templateCode === row['BM']);
        if (!ledger) return row;
        if ('primaryLane' in row) row['primaryLane'] = 'LEGAL_REVIEW';
        if ('completionStatus' in row) row['completionStatus'] = 'BLOCKED_BY_HUMAN_DOCX_REVIEW';
        if ('nextAction' in row) {
          // Handle both summary and per-occurrence formats.
          const bps = ledger.blockedPlaceholders || [];
          if (bps.length > 0 && 'count' in bps[0]) {
            row['nextAction'] = `BLOCKED: Human DOCX/legal review required for ${bps.map((b) => `${b.count}x ${b.placeholder}`).join(', ')}.`;
          } else if (bps.length > 0 && 'occurrenceIndex' in bps[0]) {
            const byPlaceholder = {};
            for (const item of bps) {
              byPlaceholder[item.placeholder] = (byPlaceholder[item.placeholder] || 0) + 1;
            }
            const summary = Object.entries(byPlaceholder).map(([ph, cnt]) => `${cnt}x ${ph}`).join(', ');
            row['nextAction'] = `BLOCKED: Human DOCX/legal review required for ${summary}.`;
          } else {
            row['nextAction'] = 'BLOCKED: Human DOCX/legal review required.';
          }
        }
        csvPatched += 1;
        return row;
      });

      const csvLines = [
        header.join(','),
        ...patchedCsvRows.map((r) => header.map((col) => csvEscape(r[col])).join(',')),
      ];
      writeFileSync(BOARD_CSV, csvLines.join('\n'), 'utf8');
      console.log(`[blocker-helper] Patched ${csvPatched} row(s) in ${BOARD_CSV}`);
    }
  }

  console.log(`[blocker-helper] Done. ${ledgers.length} blocker(s) applied.`);
}

main().catch((err) => {
  console.error(`[blocker-helper] ERROR: ${err.message}`);
  process.exit(1);
});
